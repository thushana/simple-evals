"""Results-related API endpoints"""

import json

from fastapi import APIRouter, HTTPException

from college_board_eval.web.backend.core.config import RESULTS_DIR

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/")
async def get_results_index():
    """Get the results index.json file"""
    results_index_path = RESULTS_DIR / "index.json"

    if not results_index_path.exists():
        raise HTTPException(status_code=404, detail="Results index not found. Please ensure results/index.json exists.")

    try:
        with open(results_index_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading results index: {str(e)}")


@router.get("/{filename}")
async def get_result_file(filename: str):
    """Get a specific result file by filename"""
    result_file_path = RESULTS_DIR / filename

    # Security: prevent directory traversal
    if not result_file_path.resolve().is_relative_to(RESULTS_DIR.resolve()):
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
