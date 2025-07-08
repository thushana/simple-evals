from typing import Dict, Optional
from .scorer_base import ScorerBase
from ..ap_types import MultipleChoiceQuestion, Response, EvaluationResult

class ScorerMultipleChoice(ScorerBase):
    """
    Scores Multiple Choice questions.
    Simple exact match comparison with the correct answer.
    """
    
    def _get_scorer_model(self) -> str:
        """Multiple choice doesn't need a separate scorer model - uses simple comparison"""
        return "exact_match"
    
    def _get_prompt_template(self) -> str:
        """Multiple choice doesn't use prompt templates"""
        return ""
    
    def score_question(self, question: MultipleChoiceQuestion, response: Response, test_metadata: Optional[Dict] = None) -> EvaluationResult:
        """
        Score a multiple choice question using exact match comparison.
        """
        # Simple exact match comparison
        is_correct = response.answer.strip().upper() == question.correct_answer.strip().upper()
        score = 1.0 if is_correct else 0.0
        
        # Generate explanation
        explanation = f"Correct answer: {question.correct_answer}. Student answer: {response.answer}. {'Correct' if is_correct else 'Incorrect'}."
        
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
            score=score
        ) 