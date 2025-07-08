from typing import Dict, Optional
from .scorer_base import ScorerBase
from ..ap_types import FreeResponseQuestion, Response, EvaluationResult
from ..config import (
    get_free_response_scorer_model,
    get_free_response_prompt_template,
    get_free_response_system_scoring_guide,
)

class ScorerFreeResponse(ScorerBase):
    """
    Scores general Free Response questions.
    Uses rubric-based scoring for open-ended responses.
    """
    
    def _get_scorer_model(self) -> str:
        """Get the configured scorer model name for free response questions"""
        return get_free_response_scorer_model()
    
    def _get_prompt_template(self) -> str:
        """Get the Free Response rubric prompt template"""
        return get_free_response_prompt_template()
    
    def _get_system_level_scoring_guide(self) -> str:
        """Get the system-level scoring guide for Free Response Questions"""
        return get_free_response_system_scoring_guide()
    
    def score_question(self, question: FreeResponseQuestion, response: Response, test_metadata: Optional[Dict] = None) -> EvaluationResult:
        """
        Score a free response question using rubric-based scoring.
        """
        # TODO: Implement rubric-based scoring for free responses
        # For now, return placeholder
        score = 2.0  # Placeholder score
        explanation = f"Free response scoring not yet implemented. Placeholder score: {score}/{question.max_points}"
        is_correct = score >= (question.max_points * 0.8)
        
        return EvaluationResult(
            question_id=response.question_id,
            is_correct=is_correct,
            expected_answer="",  # Not applicable for Free Response
            given_answer=response.answer,
            explanation=explanation,
            confidence=response.confidence,
            time_taken=response.time_taken,
            tokens_used=response.tokens_used,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=score
        ) 