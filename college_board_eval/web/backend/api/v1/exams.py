"""Exam-related API endpoints"""

import json
from datetime import datetime

from fastapi import APIRouter, HTTPException

from college_board_eval.web.backend.core.config import EXAMS_DIR

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("/types")
async def get_exam_types():
    """Get exam types configuration"""
    config_path = EXAMS_DIR / "exam-types.json"

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


@router.get("/years")
async def get_years():
    """Get available years (2000 to current year)"""
    current_year = datetime.now().year
    years = list(range(2000, current_year + 1))
    return {"years": years}
