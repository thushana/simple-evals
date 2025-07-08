from typing import Dict, Optional

from ..ap_types import EvaluationResult, LongAnswerQuestion, Response
from ..config import (
    get_long_answer_prompt_template,
    get_long_answer_scorer_model,
    get_long_answer_system_scoring_guide,
)
from .scorer_base import ScorerBase


class ScorerLongAnswer(ScorerBase):
    """
    Scores AP Long Answer/Long Essay questions.
    Uses rubric-based scoring similar to short answer but for longer responses.
    """

    def _get_scorer_model(self) -> str:
        """Get the configured scorer model name for long answer questions"""
        return get_long_answer_scorer_model()

    def _get_prompt_template(self) -> str:
        """Get the Long Answer rubric prompt template"""
        return get_long_answer_prompt_template()

    def _get_system_level_scoring_guide(self) -> str:
        """Get the system-level scoring guide for Long Answer Questions"""
        return get_long_answer_system_scoring_guide()

    def score_question(
        self,
        question: LongAnswerQuestion,
        response: Response,
        test_metadata: Optional[Dict] = None,
    ) -> EvaluationResult:
        """
        Score a long answer question using rubric-based scoring.
        """
        # TODO: Implement rubric-based scoring for long answers
        # For now, return placeholder
        score = 3.0  # Placeholder score
        explanation = f"Long answer scoring not yet implemented. Placeholder score: {score}/{question.max_points}"
        is_correct = score >= (question.max_points * 0.8)

        return EvaluationResult(
            question_id=response.question_id,
            is_correct=is_correct,
            expected_answer="",  # Not applicable for Long Answer
            given_answer=response.answer,
            explanation=explanation,
            confidence=response.confidence,
            time_taken=response.time_taken,
            tokens_used=response.tokens_used,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=score,
        )
