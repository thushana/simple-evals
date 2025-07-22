"""Main FastAPI application for the College Board Exam Extractor"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from college_board_eval.web.backend.api.v1 import exams, health, results
from college_board_eval.web.backend.core.config import CORS_ORIGINS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="College Board Exam Extractor API",
    description="API for uploading and processing SAT/AP exam PDFs",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(exams.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")
app.include_router(health.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "College Board Exam Extractor API"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
