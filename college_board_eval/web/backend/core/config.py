"""Configuration settings for the College Board Exam Extractor API"""

from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent.parent.parent.parent
EXAMS_DIR = BASE_DIR / "exams"
UPLOADS_DIR = BASE_DIR / "uploads"
IMAGES_DIR = BASE_DIR / "images"
RESULTS_DIR = BASE_DIR / "results"

# Processing directory for uploaded exams
PROCESSING_DIR = EXAMS_DIR / "processing"

# Ensure directories exist
UPLOADS_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)
PROCESSING_DIR.mkdir(exist_ok=True)

# CORS configuration for frontend
CORS_ORIGINS = [
    "http://localhost:1600",  # Frontend dev server (custom port)
    "http://localhost:1601",  # Frontend dev server (alternative port)
    "http://localhost:5173",  # Default Vite dev server
    "http://127.0.0.1:1600",  # Alternative localhost format
    "http://127.0.0.1:1601",  # Alternative localhost format
    "http://127.0.0.1:5173",  # Alternative localhost format
]

# File upload settings
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_FILE_TYPES = [".pdf"]
