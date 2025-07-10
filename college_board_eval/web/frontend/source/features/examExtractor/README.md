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

## COMPONENT: BACKEND API

### FastAPI Backend Setup
⬜️ **FASTAPI BACKEND** - Set up FastAPI server with proper project structure
⬜️ **OPENAPI INTEGRATION** - Configure FastAPI to auto-generate OpenAPI spec
⬜️ **TYPE GENERATION PIPELINE** - Set up openapi-typescript to generate TypeScript types from OpenAPI spec
⬜️ **API VERSIONING** - Implement versioned API endpoints (e.g., `/api/v1/`)
⬜️ **ERROR HANDLING** - Standardized error responses with proper HTTP status codes
⬜️ **CORS CONFIGURATION** - Configure CORS for frontend-backend communication

### File Upload & Management
⬜️ **PDF UPLOAD ENDPOINT** - RESTful endpoint for PDF file uploads (`POST /api/v1/exams/upload`)
⬜️ **FILE VALIDATION** - Validate PDF files (size, format, security)
⬜️ **SLUG GENERATION** - Generate unique exam slugs (e.g., `AP_CALCULUS_AB_2025`)
⬜️ **DUPLICATE HANDLING** - Handle duplicate slugs by appending letters (A, B, C, etc.)
⬜️ **MULTI-FILE SUPPORT** - Support multiple PDF uploads with numeric suffixes (1, 2, 3, etc.)
⬜️ **FILE STORAGE** - Structured directory storage for uploaded PDFs
⬜️ **FILE METADATA** - Store and retrieve file metadata (upload date, original filename, etc.)

### Image Processing
⬜️ **PDF TO IMAGES** - Convert PDF pages to high-resolution images (300 DPI)
⬜️ **THUMBNAIL GENERATION** - Generate 72 DPI thumbnails for preview
⬜️ **IMAGE STORAGE** - Store images in organized directory structure
⬜️ **IMAGE OPTIMIZATION** - Optimize images for web delivery
⬜️ **JOB QUEUE SYSTEM** - Implement async job processing for image generation
⬜️ **JOB STATUS ENDPOINT** - Endpoint to check processing status (`GET /api/v1/jobs/{job_id}`)
⬜️ **JOB RESULTS ENDPOINT** - Endpoint to retrieve processing results (`GET /api/v1/jobs/{job_id}/results`)

### Configuration Management
⬜️ **EXAM TYPES CONFIG** - Shared JSON config for exam types (served by backend)
⬜️ **CONFIG ENDPOINT** - Endpoint to serve exam types configuration (`GET /api/v1/config/exam-types`)
⬜️ **YEAR RANGE** - Dynamic year dropdown generation (2000 to current year)
⬜️ **CONFIG VALIDATION** - Validate exam type configuration on startup

---

## COMPONENT: FRONTEND INTERFACE

### Exam Selection & Upload
⬜️ **EXAM TYPE DROPDOWN** - Dropdown to select exam type from backend config
⬜️ **YEAR SELECTION** - Dynamic year dropdown (2000 to current year)
⬜️ **FILE UPLOAD UI** - Drag-and-drop or file picker for PDF uploads
⬜️ **UPLOAD PROGRESS** - Visual progress indicator during file upload
⬜️ **UPLOAD VALIDATION** - Client-side validation of file type and size
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
⬜️ **OPENAPI SPEC GENERATION** - FastAPI auto-generates OpenAPI JSON spec
⬜️ **TYPESCRIPT TYPE GENERATION** - Use openapi-typescript to generate TS types
⬜️ **TYPE SYNC WORKFLOW** - Automated workflow to keep types in sync
⬜️ **TYPE VALIDATION** - Runtime type validation on API responses
⬜️ **TYPE DOCUMENTATION** - Generated type documentation for developers

### API Contract Management
⬜️ **SINGLE SOURCE OF TRUTH** - OpenAPI spec as canonical API contract
⬜️ **VERSION MANAGEMENT** - API versioning strategy and documentation
⬜️ **BREAKING CHANGES** - Process for handling breaking API changes
⬜️ **API DOCUMENTATION** - Auto-generated API documentation from OpenAPI

---

## COMPONENT: DATA MODELS

### Pydantic Models (Backend)
⬜️ **EXAM UPLOAD MODEL** - Pydantic model for exam upload requests
⬜️ **JOB STATUS MODEL** - Pydantic model for job status responses
⬜️ **IMAGE RESULT MODEL** - Pydantic model for image processing results
⬜️ **ERROR RESPONSE MODEL** - Standardized error response model
⬜️ **CONFIG MODEL** - Pydantic model for exam type configuration

### TypeScript Types (Frontend)
⬜️ **AUTO-GENERATED TYPES** - TypeScript types generated from OpenAPI spec
⬜️ **API CLIENT TYPES** - Types for API client functions
⬜️ **COMPONENT PROPS TYPES** - TypeScript interfaces for React components
⬜️ **STATE MANAGEMENT TYPES** - Types for application state management

---

## COMPONENT: STORAGE & FILE MANAGEMENT

### Directory Structure
⬜️ **EXAM DIRECTORY STRUCTURE** - Organized directory structure for exams
⬜️ **IMAGE STORAGE** - Separate storage for thumbnails and full-res images
⬜️ **METADATA STORAGE** - Storage for exam metadata and configuration
⬜️ **BACKUP STRATEGY** - Backup and recovery procedures for uploaded files

### File Naming Conventions
⬜️ **SLUG-BASED NAMING** - Consistent naming using exam slugs
⬜️ **PAGE NUMBERING** - Consistent page numbering across all files
⬜️ **IMAGE SUFFIXES** - Clear suffixes for different image types (thumb, full, crop)
⬜️ **VERSION CONTROL** - File versioning for updates and corrections

---

## COMPONENT: ERROR HANDLING & MONITORING

### Error Handling
⬜️ **UPLOAD ERRORS** - Handle file upload failures gracefully
⬜️ **PROCESSING ERRORS** - Handle image processing failures
⬜️ **API ERRORS** - Standardized API error responses
⬜️ **CLIENT ERRORS** - Frontend error handling and user feedback
⬜️ **RETRY LOGIC** - Automatic retry for transient failures

### Monitoring & Logging
⬜️ **REQUEST LOGGING** - Log all API requests and responses
⬜️ **ERROR LOGGING** - Comprehensive error logging and alerting
⬜️ **PERFORMANCE MONITORING** - Monitor processing times and resource usage
⬜️ **USER ANALYTICS** - Track feature usage and user behavior

---

## COMPONENT: SECURITY & VALIDATION

### Security Measures
⬜️ **FILE VALIDATION** - Validate uploaded files for security threats
⬜️ **SIZE LIMITS** - Enforce reasonable file size limits
⬜️ **TYPE VALIDATION** - Validate file types and content
⬜️ **ACCESS CONTROL** - Implement proper access controls if needed
⬜️ **INPUT SANITIZATION** - Sanitize all user inputs

### Data Validation
⬜️ **SCHEMA VALIDATION** - Validate JSON schemas for exam data
⬜️ **CONTENT VALIDATION** - Validate extracted question content
⬜️ **IMAGE QUALITY CHECKS** - Validate generated image quality
⬜️ **METADATA VALIDATION** - Validate exam metadata completeness

---

## COMPONENT: PERFORMANCE & SCALABILITY

### Performance Optimization
⬜️ **IMAGE CACHING** - Cache generated images for faster access
⬜️ **LAZY LOADING** - Lazy load images as needed
⬜️ **COMPRESSION** - Compress images for faster delivery

### Scalability Considerations
⬜️ **ASYNC PROCESSING** - Process large files asynchronously
⬜️ **QUEUE MANAGEMENT** - Manage processing queues efficiently
⬜️ **RESOURCE MANAGEMENT** - Efficient resource usage and cleanup
⬜️ **HORIZONTAL SCALING** - Design for horizontal scaling if needed

---

## COMPONENT: TESTING & QUALITY ASSURANCE

### Testing Strategy
⬜️ **UNIT TESTS** - Unit tests for backend API endpoints
⬜️ **INTEGRATION TESTS** - Integration tests for full pipeline
⬜️ **FRONTEND TESTS** - Component and integration tests for frontend
⬜️ **E2E TESTS** - End-to-end tests for complete workflows
⬜️ **PERFORMANCE TESTS** - Performance testing for large file processing

### Quality Assurance
⬜️ **CODE QUALITY** - ESLint, Prettier, and TypeScript strict mode
⬜️ **API TESTING** - Automated API testing with OpenAPI spec
⬜️ **IMAGE QUALITY QA** - Quality checks for generated images
⬜️ **DATA VALIDATION QA** - Validation of extracted exam data

---

## COMPONENT: DEPLOYMENT & OPERATIONS

### Deployment
⬜️ **DOCKER CONFIGURATION** - Docker setup for backend and frontend
⬜️ **ENVIRONMENT CONFIGURATION** - Environment-specific configuration
⬜️ **CI/CD PIPELINE** - Automated build and deployment pipeline
⬜️ **HEALTH CHECKS** - Health check endpoints for monitoring

### Operations
⬜️ **LOGGING SETUP** - Comprehensive logging configuration
⬜️ **MONITORING SETUP** - Application and infrastructure monitoring
⬜️ **BACKUP PROCEDURES** - Automated backup procedures
⬜️ **DISASTER RECOVERY** - Disaster recovery procedures and documentation

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