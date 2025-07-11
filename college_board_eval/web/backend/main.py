import json
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .image_processor import ImageProcessor

app = FastAPI(
    title="College Board Exam Extractor API",
    description="API for uploading and processing SAT/AP exam PDFs",
    version="1.0.0",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1600",  # Frontend dev server (custom port)
        "http://localhost:5173",  # Default Vite dev server
        "http://127.0.0.1:1600",  # Alternative localhost format
        "http://127.0.0.1:5173",  # Alternative localhost format
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DIR = Path(__file__).parent.parent.parent
EXAMS_DIR = BASE_DIR / "exams"
UPLOADS_DIR = BASE_DIR / "uploads"
IMAGES_DIR = BASE_DIR / "images"

# Ensure directories exist
UPLOADS_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

# Initialize image processor
image_processor = ImageProcessor(UPLOADS_DIR, IMAGES_DIR)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/")
async def root():
    return {"message": "College Board Exam Extractor API"}


@app.get("/api/v1/exams/types")
async def get_exam_types():
    """Get exam types configuration"""
    config_path = BASE_DIR / "exams" / "exam-types.json"

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


@app.get("/api/v1/exams/years")
async def get_years():
    """Get available years (2000 to current year)"""
    current_year = datetime.now().year
    years = list(range(2000, current_year + 1))
    return {"years": years}


@app.post("/api/v1/exams/upload")
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

    # Validate file size (50MB limit)
    if file.size and file.size > 50 * 1024 * 1024:
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


@app.get("/api/v1/exams/{exam_name}/images")
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
                    {"filename": image_file.name, "type": "thumbnail", "path": str(image_file.relative_to(IMAGES_DIR))}
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


@app.get("/api/v1/results/")
async def get_results_index():
    """Get the results index.json file"""
    results_index_path = BASE_DIR / "results" / "index.json"

    if not results_index_path.exists():
        raise HTTPException(status_code=404, detail="Results index not found. Please ensure results/index.json exists.")

    try:
        with open(results_index_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading results index: {str(e)}")


@app.get("/api/v1/results/{filename}")
async def get_result_file(filename: str):
    """Get a specific result file by filename"""
    results_dir = BASE_DIR / "results"
    result_file_path = results_dir / filename

    # Security: prevent directory traversal
    if not result_file_path.resolve().is_relative_to(results_dir.resolve()):
        raise HTTPException(status_code=400, detail="Invalid filename")

    if not result_file_path.exists():
        raise HTTPException(status_code=404, detail="Result file not found")

    # Only allow .json files
    if not filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are allowed")

    try:
        with open(result_file_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading result file: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
