# FastAPI Backend - College Board Evaluation System

FastAPI backend for the College Board Evaluation System, handling results data serving, PDF uploads, image processing, and exam configuration.

## Features

- **Results API**: Serve evaluation results data for the dashboard
- **PDF Upload**: Secure file upload with validation (for ExamExtractor)
- **Image Processing**: Convert PDFs to high-resolution images and thumbnails
- **Exam Configuration**: Serve exam types and years via API
- **CORS Support**: Configured for frontend integration
- **Background Processing**: Async image processing for better UX

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
# Development mode with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the Makefile
cd ../.. && make backend
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

## File Structure

```
backend/
├── main.py              # FastAPI application
├── image_processor.py   # Image processing utilities
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Image Processing

The backend uses `pdf2image` and `Pillow` for:

- **PDF to Images**: Convert PDF pages to 300 DPI PNG images
- **Thumbnail Generation**: Create 800x800 thumbnails for preview
- **Image Cropping**: Crop images to specific coordinates
- **Whitespace Trimming**: Remove excess whitespace
- **Padding**: Add consistent padding around images

## Configuration

Exam types are configured in `../../config/exam-types.json` and served via the API.

## Development

### Adding New Endpoints

1. Add the endpoint to `main.py`
2. Update this README with endpoint documentation
3. Test with the frontend

### Image Processing

The `ImageProcessor` class handles all image operations. Key methods:

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

Use `make web` to start both backend and frontend simultaneously. 