# 📝 College Board Evaluation Dashboard

A modern React frontend for viewing and analyzing AP evaluation results, built with TypeScript, Material-UI, and Vite. The frontend communicates with a FastAPI backend for data access.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The frontend will be available at http://localhost:1600
# Note: Requires the backend to be running for data access
```

## Code Quality Commands

From the project root, you can run:

```bash
# Python
make lint         # Lint all Python and frontend JS/TS code
make typecheck    # Type check all Python and frontend TS code
make format       # Format all Python code (black, isort)

# Or, run only frontend checks:
make lint-frontend         # Lint all TypeScript/JS files in the frontend
make typecheck-frontend    # Run TypeScript type checking for the frontend
```

Or, from the frontend directory:

```bash
npm run lint         # Lint all TypeScript/JS files in the frontend
npm run typecheck    # Run TypeScript type checking only (no emit)
```

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

### REQUIREMENTS (High‑Level)

- 🏅 **P1 – PDF UPLOADER –** Upload SAT/AP PDF file from local disk or a web address
- 🏅 **P1 – PAGE RENDERER** – Render 72 dpi thumbnails + 300 dpi detail views
- 🏅 **P1 – IMAGE CROP –** Crop, trim whitespace, add 5 px border, save PNG image file
- 🏅 **P1 – QUESTION EXTRACTOR –** Call multimodal large language model → JSON (`question`, `context`, `options`)
- 🏅 **P1 – JSON BUILDER –** Aggregate into master `<exam_id>.json`

---

## Technical Decisions

| Layer / Concern        | Choice                        | Rationale                                                                      |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| Backend                | **Python (FastAPI)**          | Shared codebase with Simple‑Evals; mature PDF tooling                          |
| Front‑End Framework    | **React (TypeScript) + Vite** | Fast dev server & hot module replacement; aligns with contributor skillset     |
| Component / UI Library | **MUI (Material‑UI)**         | Extensive ready‑made component set; Material Design defaults; strong community |

---

## Implementation Status

### ✅ **Frontend (React/MUI) - COMPLETED**

**Features Implemented:**

- Modern dashboard interface for viewing AP evaluation results
- Sortable results table with provider icons and accuracy indicators
- JSON viewer for detailed result analysis
- Deep linking support for direct navigation to exams and questions
- Download functionality for individual result files
- Responsive Material-UI design
- Development server with hot module replacement

**Tech Stack:**

- React 19 with TypeScript
- Material-UI (MUI) for components and theming
- Vite for fast development and building
- Emotion for styled components

### ✅ **Backend (FastAPI) - COMPLETED**

**Features Implemented:**

- Results API endpoints for serving evaluation data
- CORS configuration for frontend integration
- Health check endpoint
- Exam types and years configuration endpoints
- PDF upload and image processing (for ExamExtractor feature)

**Tech Stack:**

- Python 3.10+
- FastAPI for API framework
- CORS middleware for cross-origin requests

---

## Project Structure

```
web/
├── frontend/                  # React/MUI frontend
│   ├── source/               # Source code
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx          # Application entry point
│   │   ├── features/         # Feature-based organization
│   │   │   ├── dashboard/    # Results dashboard
│   │   │   └── examExtractor/ # PDF upload (planned)
│   │   ├── services/         # API services
│   │   └── components/       # Shared components
│   ├── public/               # Static assets (logo, favicon, etc.)
│   ├── package.json          # Frontend dependencies
│   └── ...
└── backend/                  # FastAPI backend
    ├── main.py               # FastAPI application
    ├── image_processor.py    # Image processing utilities
    └── ...
```

---

## Development Notes

- Frontend communicates with backend API for data access
- CORS is configured for local development (localhost:1600)
- API endpoints are centralized in `source/services/api.ts`
- Feature-based architecture for scalability
- TypeScript provides strong type safety throughout
