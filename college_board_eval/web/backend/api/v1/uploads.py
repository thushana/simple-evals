"""File upload and image processing API endpoints"""

import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import requests
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pdf2image import convert_from_path
from PIL import Image

from college_board_eval.web.backend.core.config import IMAGES_DIR, MAX_FILE_SIZE, PROCESSING_DIR, UPLOADS_DIR
from college_board_eval.web.backend.services.image_processor import ImageProcessor

router = APIRouter(prefix="/exams", tags=["uploads"])

# Initialize image processor
image_processor = ImageProcessor(UPLOADS_DIR, IMAGES_DIR)

logger = logging.getLogger(__name__)

# In-memory storage for processing status (in production, use Redis or database)
processing_status: Dict[str, Dict] = {}


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
    }


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

    content = None
    # If file is provided, use it
    if file is not None:
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        # Validate file size
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File size must be less than 50MB")
        try:
            with open(pdf_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    # If pdf_url is provided, download it
    elif pdf_url:
        try:
            resp = requests.get(pdf_url, timeout=30)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to download PDF from URL: {pdf_url}")
            if not pdf_url.lower().endswith(".pdf"):
                raise HTTPException(status_code=400, detail="URL does not point to a PDF file")
            content = resp.content
            with open(pdf_path, "wb") as buffer:
                buffer.write(content)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error downloading PDF: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="No file or pdf_url provided")

    # Initialize processing status
    processing_id = str(uuid.uuid4())
    # Use make_exam_metadata for all metadata/status/response
    metadata = make_exam_metadata(
        slug=slug,
        exam_id=exam_type,
        exam_year=year,
        file_name=filename,
        file_original_url=pdf_url if pdf_url else None,
        file_size_bytes=len(content),
        exam_processing_dir=exam_processing_dir,
    )
    processing_status[processing_id] = metadata.copy()
    write_manifest(exam_processing_dir, metadata)

    # Start background image processing with the new directory structure, pass slug
    background_tasks.add_task(process_pdf_images, pdf_path, exam_processing_dir, processing_id, slug)

    return {
        "message": "File uploaded successfully, image processing started",
        **metadata,
        "processing_id": processing_id,
    }


async def process_pdf_images(pdf_path: Path, exam_processing_dir: Path, processing_id: str, slug: str):
    """Background task to process PDF into images (efficient, in-memory)."""
    try:
        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "status": "processing",
                    "progress": 10,
                    "message": "Converting PDF to images...",
                }
            )

        logger.info(f"Starting image processing for {pdf_path}")

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

            logger.info(f"[MANIFEST DEBUG] Saved full, preview, and thumb for page {page_num}: {full_path}, {preview_path}, {thumb_path}")

            # --- Update manifest for this page ---
            full_rel = str(full_path.relative_to(exam_processing_dir))
            preview_rel = str(preview_path.relative_to(exam_processing_dir))
            thumb_rel = str(thumb_path.relative_to(exam_processing_dir))
            logger.info(f"[MANIFEST DEBUG] Before update_manifest_page for page {page_num}: full={full_rel}, preview={preview_rel}, thumb={thumb_rel}")
            update_manifest_page(exam_processing_dir, page_num, full_rel, preview_rel, thumb_rel)
            logger.info(f"[MANIFEST DEBUG] After update_manifest_page for page {page_num}")
            # Update manifest with pages complete and status
            if manifest_path.exists():
                with open(manifest_path, "r") as f:
                    manifest = json.load(f)
                manifest["metadata"]["processing_pages_complete"] = page_num
                manifest["metadata"]["processing_status"] = f"Processing image {page_num} of {total_pages}..."
                logger.info(f"[MANIFEST DEBUG] Before writing manifest.json for page {page_num}")
                with open(manifest_path, "w") as f:
                    json.dump(manifest, f, indent=2)
                logger.info(f"[MANIFEST DEBUG] After writing manifest.json for page {page_num}")

        # On completion, update manifest to mark as completed and status
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["processing_completed"] = True
            manifest["metadata"]["processing_status"] = "Processing completed!"
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)

        # Update final status
        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "status": "completed",
                    "progress": 100,
                    "message": f"Processing completed! {total_pages} images ready in {exam_processing_dir.name}",
                }
            )

        logger.info(
            f"Image processing completed for {pdf_path}: {total_pages} images generated in {exam_processing_dir}"
        )

    except Exception as e:
        logger.error(f"Error processing images for {pdf_path}: {str(e)}")
        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "status": "error",
                    "progress": 0,
                    "message": f"Processing failed: {str(e)}",
                    "error": str(e),
                }
            )
        # On error, update manifest with error info and status
        manifest_path = exam_processing_dir / "manifest.json"
        if manifest_path.exists():
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
            manifest["metadata"]["processing_completed"] = False
            manifest["metadata"]["error"] = str(e)
            manifest["metadata"]["processing_status"] = f"Processing failed: {str(e)}"
            with open(manifest_path, "w") as f:
                json.dump(manifest, f, indent=2)


@router.get("/processing/{processing_id}")
async def get_processing_status(processing_id: str):
    """Get the processing status for a specific upload"""
    if processing_id not in processing_status:
        raise HTTPException(status_code=404, detail="Processing status not found")

    return processing_status[processing_id]


@router.get("/{slug}/manifest/")
async def get_exam_manifest(slug: str):
    """Get the manifest.json for a given exam slug."""
    exam_processing_dir = PROCESSING_DIR / slug
    manifest_path = exam_processing_dir / "manifest.json"
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Manifest not found")
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    return JSONResponse(content=manifest, headers={"Cache-Control": "no-store"})


@router.get("/{exam_name}/images")
async def get_exam_images(exam_name: str):
    """Get list of processed images for an exam"""
    exam_dir = IMAGES_DIR / exam_name

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
                        "path": str(image_file.relative_to(IMAGES_DIR)),
                    }
                )
            elif "full" in image_file.name:
                images.append(
                    {
                        "filename": image_file.name,
                        "type": "full_resolution",
                        "path": str(image_file.relative_to(IMAGES_DIR)),
                    }
                )

        # Sort by page number
        images.sort(key=lambda x: x["filename"])

        return {
            "exam_name": exam_name,
            "images": images,
            "total_pages": len([img for img in images if img["type"] == "full_resolution"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving images: {str(e)}")
