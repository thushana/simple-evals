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
- PDF upload interface with drag-and-drop functionality
- File validation (PDF format, 10MB limit)
- Visual feedback and error handling
- Progress indicators and loading states
- Responsive Material-UI design
- Development server with hot module replacement

**Tech Stack:**
- React 19 with TypeScript
- Material-UI (MUI) for components and theming
- Vite for fast development and building
- Emotion for styled components

**Getting Started:**
```bash
cd college_board_eval/web/frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:1600` by default. If that port is in use, Vite will automatically use the next available port (e.g., `http://localhost:1600`).

### 🔄 **Backend (FastAPI) - NEXT**

**Planned Features:**
- PDF file upload and processing
- Page rendering (72 dpi thumbnails + 300 dpi detail views)
- Image cropping and trimming
- Multimodal LLM integration for question extraction
- JSON aggregation and output generation

**Tech Stack:**
- Python 3.10+
- FastAPI for API framework
- PDF processing libraries (PyMuPDF, Pillow)
- Multimodal LLM integration

---

## Project Structure

```
web/
├── frontend/                  # React/MUI frontend
│   ├── src/
│   │   ├── App.tsx           # Main application component
│   │   ├── main.tsx          # Application entry point
│   │   └── components/
│   │       └── Layout.tsx    # Page layout (header/footer)
│   ├── public/               # Static assets (logo, favicon, etc.)
│   ├── package.json          # Frontend dependencies
│   └── ...
└── backend/                  # FastAPI backend (planned)
    ├── main.py               # FastAPI application
    ├── requirements.txt      # Python dependencies
    └── ...
```

---

## Development Notes

- Frontend currently simulates upload process (2-second delay)
- Backend integration is marked with TODO comments in frontend code
- File size limit is set to 10MB
- Only PDF files are accepted for upload
- Frontend is ready for backend API integration

