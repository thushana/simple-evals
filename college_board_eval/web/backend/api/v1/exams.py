"""Exam-related API endpoints including upload, processing, and metadata"""

import base64
import hashlib
import json
import logging

# --- Load .env automatically for API keys ---
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

import jsonschema
import requests
from fastapi import APIRouter, BackgroundTasks, Body, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pdf2image import convert_from_path
from PIL import Image
from pydantic import BaseModel

try:
    from dotenv import load_dotenv

    # Try project root and parent directories
    for p in [
        Path(__file__).parent.parent.parent.parent.parent,
        Path(__file__).parent.parent.parent.parent.parent.parent,
    ]:
        env_path = p / ".env"
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
            break
except ImportError:
    pass
# --- End .env loading ---

# Add the project root to the path to import samplers
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from college_board_eval.config import get_json_extraction_model, get_json_extraction_provider
from college_board_eval.web.backend.core.config import (
    EXAMS_DIR,
    IMAGES_DIR,
    MAX_FILE_SIZE,
    PROCESSING_DIR,
    UPLOADS_DIR,
)
from college_board_eval.web.backend.services.image_processor import ImageProcessor

# Import samplers with error handling
try:
    from eval_types import MessageList
    from sampler.chat_completion_sampler import ChatCompletionSampler
    from sampler.claude_sampler import ClaudeCompletionSampler
    from sampler.gemini_sampler import GeminiCompletionSampler

    SAMPLERS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Samplers not available: {e}")
    SAMPLERS_AVAILABLE = False

router = APIRouter(prefix="/exams", tags=["exams"])

# Initialize image processor
image_processor = ImageProcessor(UPLOADS_DIR, IMAGES_DIR)

logger = logging.getLogger(__name__)


# ============================================================================
# EXAM METADATA ENDPOINTS
# ============================================================================


@router.get("/types")
async def get_exam_types():
    """Get exam types configuration"""
    config_path = EXAMS_DIR / "exam-types.json"

    if not config_path.exists():
        raise HTTPException(
            status_code=500,
            detail="Exam types configuration file not found. Please ensure exams/exam-types.json exists.",
        )

    try:
        with open(config_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading exam types: {str(e)}")


@router.get("/years")
async def get_years():
    """Get available years (2000 to current year)"""
    current_year = datetime.now().year
    years = list(range(2000, current_year + 1))
    return {"years": years}


# ============================================================================
# EXAM UPLOAD AND PROCESSING ENDPOINTS
# ============================================================================


@router.post("/upload")
async def upload_exam(
    background_tasks: BackgroundTasks,
    file: Optional[UploadFile] = File(None),
    slug: str = Form(...),
    exam_type: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    pdf_url: Optional[str] = Form(None),
):
    """Upload a PDF exam file or grab from URL and start image processing"""
    logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Upload request started for slug: {slug}")

    # Use slug for folder and filename
    exam_folder = slug
    filename = f"{slug}.pdf"

    # Create exam processing directory
    exam_processing_dir = PROCESSING_DIR / exam_folder
    exam_processing_dir.mkdir(exist_ok=True)

    # Create subdirectories for different file types
    pdf_dir = exam_processing_dir / "pdf"
    images_dir = exam_processing_dir / "images"
    pdf_dir.mkdir(exist_ok=True)
    images_dir.mkdir(exist_ok=True)

    pdf_path = pdf_dir / filename

    # Validate inputs before starting background processing
    if file is not None:
        logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Validating file upload")
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        # Validate file size
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be less than 50MB")
        # Save the file synchronously before starting background task
        try:
            contents = await file.read()
            with open(pdf_path, "wb") as buffer:
                buffer.write(contents)
            logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] File saved to {pdf_path}")
        except Exception as e:
            logger.error(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Error saving file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    elif pdf_url:
        logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Validating URL")
        if not pdf_url.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="URL does not point to a PDF file")
    else:
        raise HTTPException(status_code=400, detail="No file or pdf_url provided")

    logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Creating initial manifest")
    # Initialize processing status with placeholder values
    metadata = make_exam_metadata(
        slug=slug,
        exam_id=exam_type,
        exam_year=year,
        file_name=filename,
        file_original_url=pdf_url if pdf_url else None,
        file_size_bytes=0,  # Will be updated in background task
        exam_processing_dir=exam_processing_dir,
        processing_status="Starting file processing...",
    )
    write_manifest(exam_processing_dir, metadata)

    logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Adding background task")
    # Start background processing - pass file/URL info to background task
    # Do NOT pass the UploadFile object to the background task
    background_tasks.add_task(process_exam_file_and_images, pdf_path, exam_processing_dir, slug, None, pdf_url)

    logger.info(f"[UPLOAD DEBUG {datetime.now().isoformat()}] Upload endpoint returning response")
    return {
        "message": "File upload started, processing in background",
        **metadata,
    }


# ============================================================================
# QUESTION IMAGE EXTRACTION ENDPOINT
# ============================================================================


class ExtractQuestionImageRequest(BaseModel):
    exam_id: str
    question_id: str
    bounding_box: dict  # expects {x, y, width, height}
    source_image_path: str
    full_width: int
    full_height: int


@router.post("/extract-question-image")
async def extract_question_image(
    req: ExtractQuestionImageRequest = Body(...),
):
    """
    Crop a region from a source image using full image coordinates.
    """
    exam_id = req.exam_id
    question_id = req.question_id
    bbox = req.bounding_box
    source_image_path = Path(req.source_image_path)

    # Use the bounding box directly (already in full image natural pixel coordinates)
    left = bbox["x"]
    top = bbox["y"]
    right = left + bbox["width"]
    bottom = top + bbox["height"]
    crop_coords = (left, top, right, bottom)

    extracted_dir = PROCESSING_DIR / exam_id / "extracted"
    extracted_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Crop the image
    crop_path = image_processor.crop_image(source_image_path, crop_coords, padding=0)
    # Step 2: Trim whitespace
    trimmed_path = image_processor.trim_whitespace(crop_path)
    # Step 3: Add 5px padding
    padded_path = image_processor.add_padding(trimmed_path, padding=5)
    # Save as final image
    final_path = extracted_dir / f"{question_id}.png"
    padded_path.rename(final_path)
    logger.info(f"Final extracted image saved: {final_path}")

    image_url = f"/api/v1/exams/processing/{exam_id}/extracted/{question_id}.png"
    return {"image_url": image_url}


# ============================================================================
# EXAM MANIFEST ENDPOINTS
# ============================================================================


@router.get("/{slug}/manifest/")
async def get_exam_manifest(slug: str):
    """Get the manifest.json for a given exam slug."""
    exam_processing_dir = PROCESSING_DIR / slug
    manifest_path = exam_processing_dir / "manifest.json"
    logger.info(f"[MANIFEST ENDPOINT DEBUG {datetime.now().isoformat()}] Request for slug: {slug}")
    logger.info(f"[MANIFEST ENDPOINT DEBUG {datetime.now().isoformat()}] Manifest path: {manifest_path}")
    if not manifest_path.exists():
        logger.error(f"[MANIFEST ENDPOINT DEBUG {datetime.now().isoformat()}] Manifest not found at {manifest_path}")
        raise HTTPException(status_code=404, detail="Manifest not found")

    # Get file modification time for debugging
    mtime = manifest_path.stat().st_mtime
    logger.info(f"[MANIFEST ENDPOINT DEBUG {datetime.now().isoformat()}] Manifest file mtime: {mtime}")

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    pages_count = len(manifest.get("pages", []))
    processing_complete = manifest.get("metadata", {}).get("processing_completed", "N/A")
    logger.info(
        f"[MANIFEST ENDPOINT DEBUG {datetime.now().isoformat()}] "
        f"Returning manifest with {pages_count} pages, processing_complete: {processing_complete}"
    )
    return JSONResponse(
        content=manifest,
        headers={"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"},
    )


@router.get("/{slug}/manifest/raw")
async def get_exam_manifest_raw(slug: str):
    """Get the raw manifest.json file content for debugging."""
    exam_processing_dir = PROCESSING_DIR / slug
    manifest_path = exam_processing_dir / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Manifest not found")

    with open(manifest_path, "r") as f:
        content = f.read()

    return {"raw_content": content, "file_size": len(content)}


# ============================================================================
# EXAM IMAGE ENDPOINTS
# ============================================================================


@router.get("/{slug}/images/{image_path:path}")
async def serve_exam_image(slug: str, image_path: str):
    """Serve an image file from the exam processing directory"""
    logger.info(f"[IMAGE DEBUG {datetime.now().isoformat()}] Image request for slug: {slug}, path: {image_path}")

    exam_processing_dir = PROCESSING_DIR / slug
    # Images are stored in the images/ subdirectory
    image_file_path = exam_processing_dir / "images" / image_path

    logger.info(f"[IMAGE DEBUG {datetime.now().isoformat()}] Looking for image at: {image_file_path}")
    logger.info(f"[IMAGE DEBUG {datetime.now().isoformat()}] Image file exists: {image_file_path.exists()}")

    if not image_file_path.exists():
        logger.error(f"[IMAGE DEBUG {datetime.now().isoformat()}] Image not found at: {image_file_path}")
        raise HTTPException(status_code=404, detail="Image not found")

    # Security check: ensure the path is within the exam processing directory
    try:
        image_file_path.resolve().relative_to(exam_processing_dir.resolve())
    except ValueError:
        logger.error(f"[IMAGE DEBUG {datetime.now().isoformat()}] Invalid image path: {image_path}")
        raise HTTPException(status_code=400, detail="Invalid image path")

    logger.info(f"[IMAGE DEBUG {datetime.now().isoformat()}] Serving image: {image_file_path}")
    return FileResponse(image_file_path)


@router.get("/{slug}/images")
async def get_exam_images(slug: str):
    """Get list of processed images for an exam"""
    exam_processing_dir = PROCESSING_DIR / slug
    exam_dir = exam_processing_dir / "images"

    if not exam_dir.exists():
        raise HTTPException(status_code=404, detail="Exam images not found")

    try:
        images = []
        for image_file in exam_dir.glob("*.png"):
            if "thumb" in image_file.name:
                images.append(
                    {
                        "filename": image_file.name,
                        "type": "thumbnail",
                        "path": str(image_file.relative_to(exam_processing_dir)),
                    }
                )
            elif "full" in image_file.name:
                images.append(
                    {
                        "filename": image_file.name,
                        "type": "full_resolution",
                        "path": str(image_file.relative_to(exam_processing_dir)),
                    }
                )

        # Sort by page number
        images.sort(key=lambda x: x["filename"])

        return {
            "slug": slug,
            "images": images,
            "total_pages": len([img for img in images if img["type"] == "full_resolution"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving images: {str(e)}")


@router.get("/{slug}/extracted/{image_path:path}")
async def serve_extracted_image(slug: str, image_path: str):
    """Serve an extracted image file from the exam processing directory"""
    exam_processing_dir = PROCESSING_DIR / slug
    extracted_file_path = exam_processing_dir / "extracted" / image_path

    if not extracted_file_path.exists():
        raise HTTPException(status_code=404, detail="Extracted image not found")

    # Security check: ensure the path is within the extracted directory
    try:
        extracted_file_path.resolve().relative_to((exam_processing_dir / "extracted").resolve())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid image path")

    return FileResponse(extracted_file_path)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def write_manifest(
    exam_processing_dir: Path,
    metadata: dict,
    pages: list = None,
):
    """Write or update the manifest.json file in the exam processing directory."""
    manifest_path = exam_processing_dir / "manifest.json"
    manifest = {"metadata": metadata}
    if pages is not None:
        manifest["pages"] = pages
    else:
        # If manifest exists and has pages, preserve them
        if manifest_path.exists():
            try:
                with open(manifest_path, "r") as f:
                    existing = json.load(f)
                if "pages" in existing:
                    manifest["pages"] = existing["pages"]
            except Exception:
                pass
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.flush()  # Force flush to disk
        os.fsync(f.fileno())  # Ensure it's written to disk


def update_manifest_page(
    exam_processing_dir: Path,
    page_number: int,
    full_path: str,
    preview_path: str,
    thumb_path: str,
):
    """Add or update a page entry in the manifest.json file (full, preview, thumb)."""
    manifest_path = exam_processing_dir / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    if "pages" not in manifest:
        manifest["pages"] = []
    # Remove any existing entry for this page
    manifest["pages"] = [p for p in manifest["pages"] if p["page_number"] != page_number]
    manifest["pages"].append(
        {
            "page_number": page_number,
            "full": full_path,
            "preview": preview_path,
            "thumb": thumb_path,
        }
    )
    # Sort pages by page_number
    manifest["pages"] = sorted(manifest["pages"], key=lambda p: p["page_number"])
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        f.flush()  # Force flush to disk
        os.fsync(f.fileno())  # Ensure it's written to disk


def compute_file_sha256(file_path: Path):
    """Compute SHA-256 hash for a file."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def make_exam_metadata(
    slug: str,
    exam_id: str,
    exam_year: int,
    file_name: str,
    file_original_url: Optional[str],
    file_size_bytes: int,
    exam_processing_dir: Path,
    file_total_pages: int = 0,
    processing_started: Optional[str] = None,
    processing_completed: bool = False,
    processing_pages_complete: int = 0,
    processing_status: str = "File uploaded, waiting to start processing...",
    error: Optional[str] = None,
    file_sha256: Optional[str] = None,
) -> dict:
    return {
        "slug": slug,
        "exam_id": exam_id,
        "exam_year": exam_year,
        "file_name": file_name,
        "file_original_url": file_original_url,
        "file_size_bytes": file_size_bytes,
        "file_total_pages": file_total_pages,
        "processing_started": processing_started or datetime.now().isoformat(),
        "processing_completed": processing_completed,
        "processing_pages_complete": processing_pages_complete,
        "processing_status": processing_status,
        "error": error,
        "exam_processing_dir": str(exam_processing_dir),
        "file_sha256": file_sha256,
    }


async def process_exam_file_and_images(
    pdf_path: Path, exam_processing_dir: Path, slug: str, file: Optional[UploadFile], pdf_url: Optional[str]
):
    """Background task to handle file operations and image processing."""
    try:
        logger.info(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] Starting file processing for {slug}")

        content = None

        # Handle file upload
        if file is not None:
            # This should never be hit now; file is always saved synchronously
            logger.info(
                f"[BACKGROUND DEBUG {datetime.now().isoformat()}] Skipping file upload in background task (already saved)"
            )
        # Handle URL download
        elif pdf_url:
            logger.info(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] Processing URL download")
            try:
                resp = requests.get(pdf_url, timeout=30)
                if resp.status_code != 200:
                    error_msg = f"Failed to download PDF from URL: {pdf_url}"
                    logger.error(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] {error_msg}")
                    # Update manifest with error
                    manifest_path = exam_processing_dir / "manifest.json"
                    if manifest_path.exists():
                        with open(manifest_path, "r") as f:
                            manifest = json.load(f)
                        manifest["metadata"]["error"] = error_msg
                        manifest["metadata"]["processing_status"] = f"Processing failed: {error_msg}"
                        with open(manifest_path, "w") as f:
                            json.dump(manifest, f, indent=2)
                    return

                content = resp.content
                with open(pdf_path, "wb") as buffer:
                    buffer.write(content)
                logger.info(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] URL download completed")
            except Exception as e:
                logger.error(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] Error downloading PDF: {str(e)}")
                # Update manifest with error
                manifest_path = exam_processing_dir / "manifest.json"
                if manifest_path.exists():
                    with open(manifest_path, "r") as f:
                        manifest = json.load(f)
                    manifest["metadata"]["error"] = f"Error downloading PDF: {str(e)}"
                    manifest["metadata"]["processing_status"] = f"Processing failed: {str(e)}"
                    with open(manifest_path, "w") as f:
                        json.dump(manifest, f, indent=2)
                return

        # Update manifest with file size and SHA-256 hash
        if pdf_path.exists():
            manifest_path = exam_processing_dir / "manifest.json"
            if manifest_path.exists():
                with open(manifest_path, "r") as f:
                    manifest = json.load(f)
                manifest["metadata"]["file_size_bytes"] = pdf_path.stat().st_size
                # Compute SHA-256 hash
                sha256 = compute_file_sha256(pdf_path)
                manifest["metadata"]["file_sha256"] = sha256
                manifest["metadata"]["processing_status"] = "File saved, starting image processing..."
                with open(manifest_path, "w") as f:
                    json.dump(manifest, f, indent=2)

        # Now process the PDF into images
        await process_pdf_images(pdf_path, exam_processing_dir, slug)

    except Exception as e:
        logger.error(f"[BACKGROUND DEBUG {datetime.now().isoformat()}] Error in background processing: {str(e)}")
        # Update manifest with error
        manifest_path = exam_processing_dir / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["error"] = str(e)
            manifest["metadata"]["processing_status"] = f"Processing failed: {str(e)}"
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)


async def process_pdf_images(pdf_path: Path, exam_processing_dir: Path, slug: str):
    """Background task to process PDF into images (efficient, in-memory)."""
    try:
        logger.info(f"[MANIFEST DEBUG {datetime.now().isoformat()}] Starting image processing for {pdf_path}")

        # Create an extracted images directory for this exam (not used for output, but for compatibility)
        extracted_dir = exam_processing_dir / "extracted"
        extracted_dir.mkdir(exist_ok=True)

        images_dir = exam_processing_dir / "images"
        images_dir.mkdir(exist_ok=True)

        # Load all pages from the PDF as PIL Images (in memory)
        pil_images = convert_from_path(pdf_path, dpi=300)
        total_pages = len(pil_images)

        # Update manifest with total pages and status
        manifest_path = exam_processing_dir / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["file_total_pages"] = total_pages
            manifest["metadata"]["processing_status"] = f"PDF loaded: {total_pages} pages. Starting image processing..."
            logger.info(
                f"[MANIFEST DEBUG {datetime.now().isoformat()}] Writing initial manifest with {total_pages} pages"
            )
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)

        for i, pil_image in enumerate(pil_images):
            page_num = i + 1
            page_num_str = f"{page_num:03d}"
            prefix = f"{slug}_page_{page_num_str}"

            # --- Save full-resolution PNG (300 dpi) ---
            full_filename = f"{prefix}_full.png"
            full_path = images_dir / full_filename
            pil_image.save(full_path, "PNG", optimize=True)

            # --- Generate and save 600px wide JPEG preview ---
            preview = pil_image.copy()
            preview_width = 600
            w_percent = preview_width / float(preview.width)
            preview_height = int(float(preview.height) * w_percent)
            preview = preview.resize((preview_width, preview_height), Image.Resampling.LANCZOS)
            preview_filename = f"{prefix}_preview.jpg"
            preview_path = images_dir / preview_filename
            preview = preview.convert("RGB")
            preview.save(preview_path, "JPEG", quality=90, optimize=True)

            # --- Generate and save 150px wide JPEG thumbnail ---
            thumb = pil_image.copy()
            thumb_width = 150
            w_percent = thumb_width / float(thumb.width)
            thumb_height = int(float(thumb.height) * w_percent)
            thumb = thumb.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            thumb_filename = f"{prefix}_thumb.jpg"
            thumb_path = images_dir / thumb_filename
            thumb = thumb.convert("RGB")
            thumb.save(thumb_path, "JPEG", quality=85, optimize=True)

            logger.info(
                f"[MANIFEST DEBUG {datetime.now().isoformat()}] Saved full, preview, and thumb for page {page_num}: "
                f"{full_path}, {preview_path}, {thumb_path}"
            )

            # --- Update manifest for this page ---
            # Store only the filenames, not the full relative paths
            full_rel = full_path.name
            preview_rel = preview_path.name
            thumb_rel = thumb_path.name
            logger.info(
                f"[MANIFEST DEBUG {datetime.now().isoformat()}] Before update_manifest_page for page {page_num}: "
                f"full={full_rel}, preview={preview_rel}, thumb={thumb_rel}"
            )
            update_manifest_page(exam_processing_dir, page_num, full_rel, preview_rel, thumb_rel)
            logger.info(f"[MANIFEST DEBUG {datetime.now().isoformat()}] After update_manifest_page for page {page_num}")
            # Update manifest with pages complete and status
            if manifest_path.exists():
                with open(manifest_path, "r") as f:
                    manifest = json.load(f)
                manifest["metadata"]["processing_pages_complete"] = page_num
                manifest["metadata"]["processing_status"] = f"Processing image {page_num} of {total_pages}..."
                logger.info(
                    f"[MANIFEST DEBUG {datetime.now().isoformat()}] "
                    f"Before writing manifest.json for page {page_num}"
                )
                with open(manifest_path, "w") as f:
                    json.dump(manifest, f, indent=2)
                    f.flush()  # Force flush to disk
                    os.fsync(f.fileno())  # Ensure it's written to disk
                logger.info(
                    f"[MANIFEST DEBUG {datetime.now().isoformat()}] After writing manifest.json for page {page_num}"
                )

            # Add a small delay to make progressive updates more visible (for testing)
            import asyncio

            await asyncio.sleep(0.5)  # 500ms delay between pages

        # On completion, update manifest to mark as completed and status
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["processing_completed"] = True
            manifest["metadata"]["processing_status"] = "Processing completed!"
            logger.info(f"[MANIFEST DEBUG {datetime.now().isoformat()}] Writing final manifest - processing completed")
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)

        logger.info(
            f"[MANIFEST DEBUG {datetime.now().isoformat()}] Image processing completed for {pdf_path}: "
            f"{total_pages} images generated in {exam_processing_dir}"
        )

    except Exception as e:
        logger.error(f"[MANIFEST DEBUG {datetime.now().isoformat()}] Error processing images for {pdf_path}: {str(e)}")
        manifest_path = exam_processing_dir / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["processing_completed"] = False
            manifest["metadata"]["error"] = str(e)
            manifest["metadata"]["processing_status"] = f"Processing failed: {str(e)}"
            logger.info(f"[MANIFEST DEBUG {datetime.now().isoformat()}] Writing error manifest")
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)


# Backend-editable prompt for LLM extraction
DEFAULT_EXTRACTION_PROMPT = (
    "You are an information extraction assistant. Your task is to fill out the provided JSON schema using ONLY the information that is explicitly present in the image or text.\n"
    "- IMPORTANT: Do NOT fill in the answer or explanation fields unless the correct answer is explicitly given in the image/text. If not present, leave these fields as an empty string or null.\n"
    "- Always return the full JSON structure as defined in the schema, including all fields, even if you must leave some fields as empty strings or null.\n"
    "- DO NOT invent, infer, or extrapolate any information that is not directly visible or stated.\n"
    "- If a field in the schema cannot be filled with information from the image/text, leave it as an empty string, null, or omit it from the output.\n"
    "- Do NOT use prior knowledge, do NOT guess, and do NOT fill in plausible values.\n"
    "- Do NOT add any extra fields or explanations.\n"
    "- Return only valid JSON that matches the schema structure.\n"
    "\nImage/text to extract from: [the image]\n\nSchema:\n"
)


def get_json_extraction_sampler():
    """Get the appropriate sampler for JSON extraction based on configuration"""
    if not SAMPLERS_AVAILABLE:
        raise RuntimeError("Samplers are not available. Please check the import paths.")

    provider = get_json_extraction_provider()
    model = get_json_extraction_model()

    if provider == "openai":
        return ChatCompletionSampler(model=model, temperature=0.1, max_tokens=2048)
    elif provider == "anthropic":
        return ClaudeCompletionSampler(model=model, temperature=0.1, max_tokens=2048)
    elif provider == "google":
        return GeminiCompletionSampler(model=model, temperature=0.1, max_tokens=2048)
    else:
        raise ValueError(f"Unsupported provider: {provider}")


def filter_to_schema_properties(data, schema):
    """Remove any keys from data that are not in the schema's properties."""
    if not isinstance(schema, dict) or not isinstance(data, dict):
        return data
    if schema.get("type") == "object":
        props = schema.get("properties", {})
        filtered = {}
        for k in props:
            if k in data:
                filtered[k] = filter_to_schema_properties(data[k], props[k])
        return filtered
    elif schema.get("type") == "array" and isinstance(data, list):
        item_schema = schema.get("items", {})
        return [filter_to_schema_properties(item, item_schema) for item in data]
    return data


class ExtractJsonFromImageRequest(BaseModel):
    image_url: str
    json_schema: dict


@router.post("/extract-json-from-image")
async def extract_json_from_image(
    req: ExtractJsonFromImageRequest = Body(...),
):
    """
    Accepts an image URL (local API URL) and a JSON schema, reads and encodes the image as base64, and calls an LLM to extract structured data.
    """
    logger.info(f"[extract-json-from-image] Called with image_url={req.image_url}, schema={req.json_schema}")

    try:
        # Get the sampler
        sampler = get_json_extraction_sampler()

        # Construct the prompt with the schema
        schema_str = json.dumps(req.json_schema, indent=2)
        prompt = f"{DEFAULT_EXTRACTION_PROMPT}\n{schema_str}\n\nPlease fill out the schema based on the image content. Return only valid JSON that matches the schema structure."

        # --- Read and encode the image as base64 ---
        # Assume image_url is a local API URL like /api/v1/exams/SLUG/extracted/box_xxx.png
        # Convert to local file path
        from urllib.parse import urlparse

        parsed = urlparse(req.image_url)
        # Remove leading /api/v1/exams/ from path
        path = parsed.path
        if path.startswith("/api/v1/exams/"):
            path = path[len("/api/v1/exams/") :]
        # Now path is like SLUG/extracted/box_xxx.png
        image_file = (PROCESSING_DIR / path).resolve()
        if not image_file.exists():
            logger.error(f"[extract-json-from-image] Image file not found: {image_file}")
            raise HTTPException(status_code=404, detail=f"Image file not found: {image_file}")
        try:
            with open(image_file, "rb") as f:
                image_bytes = f.read()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")
            data_url = f"data:image/png;base64,{image_b64}"
        except Exception as e:
            logger.error(f"[extract-json-from-image] Failed to read/encode image: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to read/encode image: {e}")
        # --- End base64 encoding ---

        # Create the message list with the image and prompt
        messages: MessageList = [
            {
                "role": "user",
                "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": data_url}}],
            }
        ]

        # Call the LLM
        logger.info(f"[extract-json-from-image] Calling LLM with {len(messages)} messages")
        response = sampler(messages)

        # Parse the response as JSON, stripping markdown code block if present
        raw = response.response_text.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)
        try:
            result_json = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error(f"[extract-json-from-image] Failed to parse JSON response: {e}")
            logger.error(f"[extract-json-from-image] Cleaned response: {raw}")
            logger.error(f"[extract-json-from-image] Raw response: {response.response_text}")
            raise HTTPException(status_code=400, detail=f"LLM did not return valid JSON: {e}")
        # Validate and fill missing fields
        filtered_json = filter_to_schema_properties(result_json, req.json_schema)
        logger.info(f"Filtered JSON: {filtered_json}")
        completed_json = fill_missing_fields(filtered_json, req.json_schema)
        logger.info(f"Completed JSON: {completed_json}")
        # Force the question type to match the schema's enum (from the selected type)
        try:
            expected_type = req.json_schema["properties"]["question"]["properties"]["type"]["enum"][0]
            if "question" in completed_json:
                completed_json["question"]["type"] = expected_type
        except Exception as e:
            logger.warning(f"Could not set question type from schema: {e}")
        jsonschema.validate(instance=completed_json, schema=req.json_schema)
        logger.info("[extract-json-from-image] Successfully parsed and validated JSON response")
        return {
            "prompt": prompt,
            "image_url": req.image_url,
            "json_schema": req.json_schema,
            "result_json": completed_json,
            "model_used": f"{get_json_extraction_provider()}/{get_json_extraction_model()}",
        }

    except Exception as e:
        logger.error(f"[extract-json-from-image] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error extracting JSON from image: {str(e)}")


def fill_missing_fields(data, schema):
    """Recursively fill missing required fields in data according to schema, using defaults if present."""
    if not isinstance(schema, dict):
        return data
    if schema.get("type") == "object":
        props = schema.get("properties", {})
        required = schema.get("required", [])
        if not isinstance(data, dict):
            data = {}
        for key in required:
            prop_schema = props.get(key, {})
            if key not in data or data[key] is None:
                # Use default if present
                if "default" in prop_schema:
                    data[key] = prop_schema["default"]
                elif prop_schema.get("type") == "string":
                    data[key] = ""
                elif prop_schema.get("type") == "object":
                    data[key] = fill_missing_fields({}, prop_schema)
                elif prop_schema.get("type") == "array":
                    data[key] = []
                elif prop_schema.get("type") == "number":
                    data[key] = 0
                else:
                    data[key] = None
            else:
                data[key] = fill_missing_fields(data[key], prop_schema)
        return data
    elif schema.get("type") == "array" and isinstance(data, list):
        item_schema = schema.get("items", {})
        return [fill_missing_fields(item, item_schema) for item in data]
    return data
