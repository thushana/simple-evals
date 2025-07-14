# 📝 ExamExtractor: PDF ➜ Structured Exam Assets

A streamlined pipeline that ingests SAT or Advanced Placement PDFs and outputs perfectly cropped images plus standards‑compliant JSON ready for College Board Evals.

---

## Confidence Colors

- ✅ Very Confident & Widely Agreed On
- ⚪ Currently in discussion and not settled
- ⚠️ Unknown factor
- 🔴 Not decided but should be / Strong lack of consensus

## Priority Rubric

🔥 **P0** — On fire → Drop everything (shipped + broken)

🏅 **P1** — Gold → Must Have (critical, publicly promised)

🥈 **P2** — Silver → Should Have (significantly better experience)

🥉 **P3** — Bronze → Eventually Have (future needs or polish)

P4 — Unlikely in this iteration (stretch goals)

---

## Product Requirements & Principles

### PRINCIPLES

1. **Zero‑Friction Ingestion** ✅\
   Upload a PDF → receive a ready‑to‑commit JSON + images bundle with minimal clicks.
2. **Consistent Assets** ✅\
   Every question image trimmed, 5 px white border added, deterministic filenames.
3. **Extensible Architecture** ✅\
   New exam types (PSAT, A‑levels) require only schema tweaks—not code rewrites.
4. **Transparent Extraction** ✅\
   HTML diff reports show raw image, extracted text, and scoring rubric for QA.
5. **Reproducibility First** ✅\
   Fixed seeds, versioned prompts, hashed source PDF in metadata.

---

## Technical Decisions Summary

### Architecture Decisions

- **Backend Framework**: FastAPI with Pydantic models
- **Frontend Framework**: React 19 + TypeScript + MUI
- **Type Safety**: OpenAPI spec → openapi-typescript for TypeScript generation
- **File Processing**: Async job queue for PDF processing
- **Image Generation**: 72 DPI thumbnails + 300 DPI full-res images
- **Storage**: Structured directory organization with slug-based naming

### API Design Decisions

- **RESTful Endpoints**: Versioned API with JSON payloads
- **Error Handling**: Standardized error responses with HTTP status codes
- **File Upload**: Multipart form data with progress tracking
- **Job Processing**: Async jobs with status polling
- **Configuration**: Shared JSON config served by backend

### Frontend Design Decisions

- **Layout**: Left thumbnail tray (10%) + right full-page view
- **Navigation**: Deep linking with React Router
- **State Management**: React hooks for local state
- **Type Safety**: Auto-generated TypeScript types from OpenAPI
- **UI Framework**: Material-UI for consistent design

### Data Flow Decisions

- **Single Source of Truth**: OpenAPI spec for API contracts
- **Type Generation**: Automated pipeline from backend to frontend
- **File Organization**: Consistent naming and directory structure
- **Error Propagation**: Graceful error handling throughout the stack

---

### COMPONENT: BACKEND API

✅ **FASTAPI BACKEND** - Set up FastAPI server with proper project structure
✅ **OPENAPI INTEGRATION** - Configure FastAPI to auto-generate OpenAPI spec
✅ **API VERSIONING** - Implement versioned API endpoints (e.g., `/api/v1/`)
✅ **ERROR HANDLING** - Standardized error responses with proper HTTP status codes
✅ **CORS CONFIGURATION** - Configure CORS for frontend-backend communication

### File Upload & Management

✅ **PDF UPLOAD ENDPOINT** - RESTful endpoint for PDF file uploads (`POST /api/v1/exams/upload`)
✅ **FILE VALIDATION** - Validate PDF files (size, format, security)
✅ **SLUG GENERATION** - Generate unique exam slugs (e.g., `AP_CALCULUS_AB_2025`)
✅ **DUPLICATE HANDLING** - Handle duplicate slugs by appending letters (A, B, C, etc.)
✅ **MULTI-FILE SUPPORT** - Support multiple PDF uploads with numeric suffixes (1, 2, 3, etc.)
✅ **FILE STORAGE** - Structured directory storage for uploaded PDFs
✅ **FILE METADATA** - Store and retrieve file metadata (upload date, original filename, etc.)

### Image Processing

✅ **PDF TO IMAGES** - Convert PDF pages to high-resolution images (300 DPI)
✅ **THUMBNAIL GENERATION** - Generate 72 DPI thumbnails for preview
✅ **IMAGE STORAGE** - Store images in organized directory structure
✅ **IMAGE OPTIMIZATION** - Optimize images for web delivery
✅ **JOB QUEUE SYSTEM** - Implement async job processing for image generation
✅ **JOB STATUS ENDPOINT** - Endpoint to check processing status (`GET /api/v1/jobs/{job_id}`)
✅ **JOB RESULTS ENDPOINT** - Endpoint to retrieve processing results (`GET /api/v1/jobs/{job_id}/results`)

### Configuration Management

✅ **EXAM TYPES CONFIG** - Shared JSON config for exam types (served by backend)
✅ **CONFIG ENDPOINT** - Endpoint to serve exam types configuration (`GET /api/v1/exams/types`)
✅ **YEAR RANGE** - Dynamic year dropdown generation (2000 to current year)
✅ **CONFIG VALIDATION** - Validate exam type configuration on startup

---

## COMPONENT: FRONTEND INTERFACE

### Exam Selection & Upload

✅ **EXAM TYPE DROPDOWN** - Dropdown to select exam type from backend config
✅ **YEAR SELECTION** - Dynamic year dropdown (2000 to current year)
✅ **FILE UPLOAD UI** - Drag-and-drop or file picker for PDF uploads
⬜️ **UPLOAD PROGRESS** - Visual progress indicator during file upload
✅ **UPLOAD VALIDATION** - Client-side validation of file type and size
⬜️ **MULTI-FILE UPLOAD** - Support for uploading multiple PDF files
⬜️ **UPLOAD STATUS** - Real-time status updates during upload process

### Image Viewer Interface

⬜️ **THUMBNAIL TRAY** - Left sidebar with page thumbnails (10% width)
⬜️ **FULL PAGE VIEW** - Right pane showing full-resolution page images
⬜️ **PAGE NAVIGATION** - Click thumbnails to navigate between pages
⬜️ **ZOOM CONTROLS** - Zoom in/out functionality for detailed viewing
⬜️ **LOADING STATES** - Loading indicators while images are being generated
⬜️ **ERROR HANDLING** - Graceful error handling for failed image loads

### Question Extraction Interface

⬜️ **MANUAL CROPPING TOOL** - Default interface for manual question cropping
⬜️ **CROP SELECTION** - Click and drag to select question boundaries
⬜️ **CROP PREVIEW** - Preview of cropped question area
⬜️ **QUESTION METADATA** - Form to add question metadata (type, points, etc.)
⬜️ **BATCH PROCESSING** - Process multiple questions in batch
⬜️ **PROGRESS TRACKING** - Track progress of question extraction

### Results & Export

⬜️ **JSON PREVIEW** - Preview generated JSON structure
⬜️ **DOWNLOAD BUNDLE** - Download JSON + images as a bundle
⬜️ **EXPORT OPTIONS** - Different export formats and options
⬜️ **VALIDATION REPORT** - Report on extracted data quality

---

## COMPONENT: TYPE SAFETY & INTEGRATION

### Type Generation Pipeline

✅ **OPENAPI SPEC GENERATION** - FastAPI auto-generates OpenAPI JSON spec
⬜️ **TYPESCRIPT TYPE GENERATION** - Use openapi-typescript to generate TS types
⬜️ **TYPE SYNC WORKFLOW** - Automated workflow to keep types in sync
✅ **TYPE VALIDATION** - Runtime type validation on API responses
⬜️ **TYPE DOCUMENTATION** - Generated type documentation for developers

### API Contract Management

✅ **SINGLE SOURCE OF TRUTH** - OpenAPI spec as canonical API contract
✅ **VERSION MANAGEMENT** - API versioning strategy and documentation
⬜️ **BREAKING CHANGES** - Process for handling breaking API changes
⬜️ **API DOCUMENTATION** - Auto-generated API documentation from OpenAPI

---

## COMPONENT: DATA MODELS

### Pydantic Models (Backend)

✅ **EXAM UPLOAD MODEL** - Pydantic model for exam upload requests
✅ **JOB STATUS MODEL** - Pydantic model for job status responses
✅ **IMAGE RESULT MODEL** - Pydantic model for image processing results
✅ **ERROR RESPONSE MODEL** - Standardized error response model
✅ **CONFIG MODEL** - Pydantic model for exam type configuration

### TypeScript Types (Frontend)

✅ **AUTO-GENERATED TYPES** - TypeScript types generated from OpenAPI spec
✅ **API CLIENT TYPES** - Types for API client functions
✅ **COMPONENT PROPS TYPES** - TypeScript interfaces for React components
✅ **STATE MANAGEMENT TYPES** - Types for application state management

---

## Current Features

### ✅ Implemented

1. **Exam Type Selection** - Dropdown populated from backend API with all AP exam types organized by category
2. **Year Selection** - Dynamic year dropdown (2000 to current year)
3. **File Upload** - PDF file selection with validation
4. **Conformant Filenames** - Preview of generated filename based on selected exam type and year
5. **Backend Integration** - Full integration with FastAPI backend
6. **Type Safety** - Complete TypeScript types for all API responses
7. **Error Handling** - Graceful error handling for API failures
8. **Loading States** - Loading indicators while fetching data

### 🔄 In Progress

1. **File Upload Implementation** - Connecting the upload button to the backend API
2. **Processing Status** - Real-time status updates during PDF processing
3. **Image Viewer** - Display processed images after upload

### 📋 Next Steps

1. **Complete Upload Flow** - Implement the actual file upload functionality
2. **Processing Status UI** - Add progress indicators and status updates
3. **Image Viewer** - Build the image viewing interface
4. **Question Extraction** - Manual cropping and metadata tools
5. **Export Functionality** - Download processed exam assets

## Usage

1. Navigate to the "Exam Extractor" tab in the application
2. Select an exam type from the dropdown (e.g., "AP Calculus BC")
3. Select a year from the dropdown (e.g., "2025")
4. Choose a PDF file to upload
5. Click "Upload & Process Exam" to start the extraction process

The system will generate conformant filenames like: `AP_CALCULUS_BC_2025_20250115_143022_a1b2c3d4.pdf`

## Technical Architecture

- **Frontend**: React 19 + TypeScript + Material-UI
- **Backend**: FastAPI + Python
- **API**: RESTful endpoints with OpenAPI specification
- **File Processing**: Async background jobs with status polling
- **Type Safety**: Full TypeScript integration with backend types
