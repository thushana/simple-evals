"""File upload and image processing API endpoints"""

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile

from college_board_eval.web.backend.core.config import IMAGES_DIR, MAX_FILE_SIZE, UPLOADS_DIR
from college_board_eval.web.backend.services.image_processor import ImageProcessor

router = APIRouter(prefix="/exams", tags=["uploads"])

# Initialize image processor
image_processor = ImageProcessor(UPLOADS_DIR, IMAGES_DIR)

logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_exam(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    exam_type: Optional[str] = None,
    year: Optional[int] = None,
):
    """Upload a PDF exam file and start image processing"""

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size must be less than 50MB")

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]

    if exam_type and year:
        filename = f"{exam_type}_{year}_{timestamp}_{unique_id}.pdf"
    else:
        filename = f"exam_{timestamp}_{unique_id}.pdf"

    # Save file
    file_path = UPLOADS_DIR / filename
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")

    # Start background image processing
    background_tasks.add_task(process_pdf_images, file_path)

    return {
        "message": "File uploaded successfully, image processing started",
        "filename": filename,
        "file_path": str(file_path),
        "size": len(content),
        "upload_time": timestamp,
        "processing": "started",
    }


async def process_pdf_images(pdf_path: Path):
    """Background task to process PDF into images"""
    try:
        logger.info(f"Starting image processing for {pdf_path}")
        image_paths = image_processor.pdf_to_images(pdf_path)
        logger.info(f"Image processing completed for {pdf_path}: {len(image_paths)} images generated")
    except Exception as e:
        logger.error(f"Error processing images for {pdf_path}: {str(e)}")


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
