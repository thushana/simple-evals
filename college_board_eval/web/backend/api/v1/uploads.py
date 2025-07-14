"""File upload and image processing API endpoints"""

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import requests
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from college_board_eval.web.backend.core.config import IMAGES_DIR, MAX_FILE_SIZE, PROCESSING_DIR, UPLOADS_DIR
from college_board_eval.web.backend.services.image_processor import ImageProcessor

router = APIRouter(prefix="/exams", tags=["uploads"])

# Initialize image processor
image_processor = ImageProcessor(UPLOADS_DIR, IMAGES_DIR)

logger = logging.getLogger(__name__)

# In-memory storage for processing status (in production, use Redis or database)
processing_status: Dict[str, Dict] = {}


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
    thumbnails_dir = exam_processing_dir / "thumbnails"

    pdf_dir.mkdir(exist_ok=True)
    images_dir.mkdir(exist_ok=True)
    thumbnails_dir.mkdir(exist_ok=True)

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
    processing_status[processing_id] = {
        "status": "uploaded",
        "progress": 0,
        "message": "File uploaded, starting processing...",
        "filename": filename,
        "file_path": str(pdf_path),
        "exam_folder": exam_folder,
        "exam_processing_dir": str(exam_processing_dir),
        "size": len(content),
        "upload_time": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "total_pages": 0,
        "processed_pages": 0,
        "error": None,
        "slug": slug,
        "exam_type": exam_type,
        "year": year,
    }

    # Start background image processing with the new directory structure, pass slug
    background_tasks.add_task(process_pdf_images, pdf_path, exam_processing_dir, processing_id, slug)

    return {
        "message": "File uploaded successfully, image processing started",
        "filename": filename,
        "file_path": str(pdf_path),
        "exam_folder": exam_folder,
        "exam_processing_dir": str(exam_processing_dir),
        "size": len(content),
        "upload_time": datetime.now().strftime("%Y%m%d_%H%M%S"),
        "processing": "started",
        "processing_id": processing_id,
        "slug": slug,
    }


async def process_pdf_images(pdf_path: Path, exam_processing_dir: Path, processing_id: str, slug: str):
    """Background task to process PDF into images"""
    try:
        # Update status to processing
        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "status": "processing",
                    "progress": 10,
                    "message": "Converting PDF to images...",
                }
            )

        logger.info(f"Starting image processing for {pdf_path}")

        # Create an extracted images directory for this exam
        extracted_dir = exam_processing_dir / "extracted"
        extracted_dir.mkdir(exist_ok=True)

        # Convert PDF to images in the exam processing directory
        image_paths = image_processor.pdf_to_images(pdf_path, output_dir=extracted_dir, slug=slug)

        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "progress": 50,
                    "message": f"PDF converted to {len(image_paths)} images",
                    "total_pages": len(image_paths),
                    "processed_pages": len(image_paths),
                }
            )

        # Move images to organized structure
        images_dir = exam_processing_dir / "images"
        thumbnails_dir = exam_processing_dir / "thumbnails"

        # Process each image (crop, trim, add padding) and organize
        for i, image_path in enumerate(image_paths):
            if processing_id in processing_status:
                progress = 50 + int((i / len(image_paths)) * 40)  # 50-90%
                processing_status[processing_id].update(
                    {
                        "progress": progress,
                        "message": f"Processing image {i+1} of {len(image_paths)}...",
                    }
                )

            # Process the image
            try:
                processed_image_path = image_processor.process_question_image(image_path)

                # Move to organized structure
                if "thumb" in processed_image_path.name:
                    # Move thumbnail to thumbnails directory
                    final_path = thumbnails_dir / processed_image_path.name
                    processed_image_path.rename(final_path)
                else:
                    # Move full image to images directory
                    final_path = images_dir / processed_image_path.name
                    processed_image_path.rename(final_path)

            except Exception as e:
                logger.warning(f"Error processing image {image_path}: {str(e)}")

        # Clean up extracted directory if needed (optional, or keep for debugging)
        # import shutil
        # shutil.rmtree(extracted_dir, ignore_errors=True)

        # Update final status
        if processing_id in processing_status:
            processing_status[processing_id].update(
                {
                    "status": "completed",
                    "progress": 100,
                    "message": f"Processing completed! {len(image_paths)} images ready in {exam_processing_dir.name}",
                }
            )

        logger.info(
            f"Image processing completed for {pdf_path}: {len(image_paths)} images generated in {exam_processing_dir}"
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


@router.get("/processing/{processing_id}")
async def get_processing_status(processing_id: str):
    """Get the processing status for a specific upload"""
    if processing_id not in processing_status:
        raise HTTPException(status_code=404, detail="Processing status not found")

    return processing_status[processing_id]


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
