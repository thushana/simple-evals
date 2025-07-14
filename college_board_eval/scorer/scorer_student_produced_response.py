from typing import Dict, Optional

from college_board_eval.ap_types import EvaluationResult, Response, StudentProducedResponseQuestion
from college_board_eval.config import get_student_produced_response_scorer_model
from college_board_eval.scorer.scorer_base import ScorerBase


class ScorerStudentProducedResponse(ScorerBase):
    """
    Scores SAT Student-Produced Response (Grid-In) questions.
    Handles numeric answers with tolerance and multiple acceptable answers.
    """

    def _get_scorer_model(self) -> str:
        """Student produced response doesn't need a separate scorer model - uses numeric comparison"""
        return get_student_produced_response_scorer_model()

    def _get_prompt_template(self) -> str:
        """Student produced response doesn't use prompt templates"""
        return ""

    def score_question(
        self,
        question: StudentProducedResponseQuestion,
        response: Response,
        test_metadata: Optional[Dict] = None,
    ) -> EvaluationResult:
        """
        Score a student-produced response question using numeric comparison.
        """
        # TODO: Implement numeric comparison with tolerance
        # For now, use simple exact match
        is_correct = response.answer.strip() == question.correct_answer.strip()
        score = 1.0 if is_correct else 0.0

        # Generate explanation
        explanation = (
            f"Correct answer: {question.correct_answer}. Student answer: {response.answer}. "
            f"{'Correct' if is_correct else 'Incorrect'}."
        )

        return EvaluationResult(
            question_id=response.question_id,
            is_correct=is_correct,
            expected_answer=question.correct_answer,
            given_answer=response.answer,
            explanation=explanation,
            confidence=response.confidence,
            time_taken=response.time_taken,
            tokens_used=response.tokens_used,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=score,
        )
