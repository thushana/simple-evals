# FastAPI Backend - College Board Evaluation System

FastAPI backend for the College Board Evaluation System, handling results data serving, PDF uploads, image processing, and exam configuration.

## Features

- **Results API**: Serve evaluation results data for the dashboard
- **PDF Upload**: Secure file upload with validation (for ExamExtractor)
- **Image Processing**: Convert PDFs to high-resolution images and thumbnails
- **Exam Configuration**: Serve exam types and years via API
- **CORS Support**: Configured for frontend integration
- **Background Processing**: Async image processing for better UX
- **Modular Architecture**: Clean, maintainable code structure with feature-based organization

## Architecture

The backend has been refactored into a modular, maintainable structure following best practices:

### Directory Structure
```
backend/
├── api/v1/                  # API endpoints organized by feature
│   ├── exams.py             # Exam types and years endpoints
│   ├── uploads.py           # File upload and image processing endpoints
│   ├── results.py           # Results data endpoints
│   └── health.py            # Health check endpoint
├── core/                    # Core configuration and utilities
│   └── config.py            # Centralized configuration (paths, CORS, etc.)
├── services/                # Business logic services
│   └── image_processor.py   # Image processing service
├── main.py                  # Main FastAPI application
└── README.md                # This file
```

### Key Design Principles
- **Modular Design**: Each API endpoint group is in its own module
- **Absolute Imports**: Uses best-practice absolute imports for maintainability
- **Centralized Config**: All configuration in `core/config.py`
- **Service Layer**: Business logic separated into services
- **Type Safety**: Full type annotations with mypy checking

## Setup

### Prerequisites

- Python 3.8+
- poppler-utils (for pdf2image)

### Install Dependencies

```bash
# Install Python dependencies
pip install -r ../../requirements.txt

# Install poppler-utils (macOS)
brew install poppler

# Install poppler-utils (Ubuntu/Debian)
sudo apt-get install poppler-utils
```

### Run the Server

```bash
# Development mode with auto-reload (from project root)
cd ../.. && PYTHONPATH=. uvicorn college_board_eval.web.backend.main:app --reload --host 0.0.0.0 --port 8000

# Or use the Makefile commands
make web-backend             # Start only the backend server
make web                     # Start both backend and frontend
```

## API Endpoints

### Results Data

- `GET /api/v1/results/` - Get the results index.json file
- `GET /api/v1/results/{filename}` - Get a specific result file by filename

### Configuration

- `GET /api/v1/exams/types` - Get available exam types
- `GET /api/v1/exams/years` - Get available years (2000 to current)

### File Upload (ExamExtractor)

- `POST /api/v1/exams/upload` - Upload PDF exam file
  - Parameters: `file` (PDF), `exam_type` (optional), `year` (optional)

### Image Processing (ExamExtractor)

- `GET /api/v1/exams/{exam_name}/images` - Get processed images for an exam

### Health

- `GET /health` - Health check endpoint

## Development

### Adding New Endpoints

1. **Create a new module** in `api/v1/` (e.g., `users.py`)
2. **Define a FastAPI router** with your endpoints:
   ```python
   from fastapi import APIRouter
   
   router = APIRouter(prefix="/users", tags=["users"])
   
   @router.get("/")
   async def get_users():
       return {"users": []}
   ```
3. **Import and include** the router in `main.py`:
   ```python
   from college_board_eval.web.backend.api.v1 import users
   
   app.include_router(users.router, prefix="/api/v1")
   ```

### Code Quality

The backend follows strict code quality standards:

```bash
# Run all Python code quality checks
make python-codecleanup

# Or run individual checks
make format      # Format with black and isort
make lint        # Run flake8 linting
make typecheck   # Run mypy type checking
```

### Configuration

All configuration is centralized in `core/config.py`:
- Base directories (exams, uploads, images, results)
- CORS origins for frontend integration
- File upload limits and allowed types

## Image Processing

The backend uses `pdf2image` and `Pillow` for:

- **PDF to Images**: Convert PDF pages to 300 DPI PNG images
- **Thumbnail Generation**: Create 800x800 thumbnails for preview
- **Image Cropping**: Crop images to specific coordinates
- **Whitespace Trimming**: Remove excess whitespace
- **Padding**: Add consistent padding around images

### ImageProcessor Service

The `ImageProcessor` class in `services/image_processor.py` handles all image operations:

- `pdf_to_images()`: Convert PDF to images
- `crop_image()`: Crop with coordinates
- `trim_whitespace()`: Remove whitespace
- `add_padding()`: Add padding
- `process_question_image()`: Full question processing pipeline

## Integration with Frontend

The backend is configured with CORS to work with the Vite frontend on multiple ports:
- `http://localhost:1600` (custom port)
- `http://localhost:5173` (default Vite port)
- `http://127.0.0.1:1600` and `http://127.0.0.1:5173` (alternative formats)

### Development Commands

```bash
# Start only the backend
make web-backend

# Start only the frontend
make web-frontend

# Start both backend and frontend
make web
```

## Migration from Old Structure

The backend has been refactored from a single `main.py` file to a modular structure:

### Before (Old Structure)
```
backend/
├── main.py              # All endpoints in one file
└── image_processor.py   # Image processing utilities
```

### After (New Structure)
```
backend/
├── api/v1/              # Organized by feature
├── core/                # Configuration
├── services/            # Business logic
└── main.py              # Clean main app
```

This refactor improves:
- **Maintainability**: Easier to find and modify specific endpoints
- **Scalability**: Easy to add new features without cluttering main.py
- **Testing**: Each module can be tested independently
- **Code Quality**: Better separation of concerns 