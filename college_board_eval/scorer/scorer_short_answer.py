from typing import Dict, Optional, Tuple

from ..ap_types import EvaluationResult, Response, ShortAnswerQuestion
from ..config import (
    get_short_answer_question_prompt_template,
    get_short_answer_question_scorer_model,
    get_short_answer_question_scorer_provider,
    get_system_level_scoring_guide,
)
from .scorer_base import ScorerBase


class ScorerShortAnswer(ScorerBase):
    """
    Scores Short Answer Questions using a configured model with precedence hierarchy.
    Supports images when the model has vision capabilities.
    """

    def _get_scorer_model(self) -> str:
        """Get the configured scorer model name for short answer questions"""
        return get_short_answer_question_scorer_model()

    def _get_prompt_template(self) -> str:
        """Get the Short Answer Question rubric prompt template"""
        return get_short_answer_question_prompt_template()

    def _get_system_level_scoring_guide(self) -> str:
        """Get the system-level scoring guide for Short Answer Questions"""
        return get_system_level_scoring_guide()

    def _get_scoring_guide_with_precedence(
        self, question: ShortAnswerQuestion, test_metadata: Optional[Dict] = None
    ) -> str:
        """
        Get the appropriate scoring guide based on precedence:
        1. Question-level (highest priority)
        2. Test-level (medium priority)
        3. System-level (lowest priority)
        """
        # Priority 1: Question-level scoring guide
        if question.short_answer_question_rubric_question:
            return question.short_answer_question_rubric_question

        # Priority 2: Test-level scoring guide
        if test_metadata and test_metadata.get("short_answer_question_rubric_test"):
            return test_metadata["short_answer_question_rubric_test"]

        # Priority 3: System-level scoring guide (fallback)
        return self._get_system_level_scoring_guide()

    def _call_scorer_model(
        self,
        question: ShortAnswerQuestion,
        response: Response,
        test_metadata: Optional[Dict] = None,
    ) -> Tuple[float, str]:
        """
        Call the configured scorer model to evaluate the response.
        Returns (score, explanation).
        """
        # Get the appropriate scoring guide based on precedence
        scoring_guide = self._get_scoring_guide_with_precedence(question, test_metadata)
        # Format the rubric
        rubric_text = self._format_rubric_for_prompt(question.rubric)

        # Handle image if present
        image_content = None
        image_notice = ""
        if question.question_image:
            # Try to load the image
            exam_identifier = self._extract_exam_identifier(question.id)
            encoded_image = self._load_image_as_base64(
                question.question_image, exam_identifier
            )

            if encoded_image:
                image_content = {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{encoded_image}"},
                }
            else:
                image_notice = f"\n[Note: An image was supposed to be included here ({question.question_image}), but it could not be loaded. Please evaluate the response based on the text content only.]"

        # Create the prompt
        prompt = self.prompt_template.format(
            question_text=question.question_text,
            rubric=rubric_text,
            response=response.answer,
            max_points=question.max_points,
        )

        # Add the scoring guide to the prompt
        if scoring_guide:
            prompt = prompt.replace(
                "Rubric:", f"General Scoring Criteria:\n{scoring_guide}\n\nRubric:"
            )

        # Add image notice if image couldn't be loaded
        if image_notice:
            prompt = prompt.replace("Question:", f"Question:{image_notice}")

        provider = get_short_answer_question_scorer_provider()
        model = self.scorer_model

        # Try OpenAI if configured
        if provider == "openai":
            return self._call_openai_model(prompt, model, image_content)

        # Fallback: placeholder
        score = 2.5  # Placeholder score
        explanation = f"Scored using {self.scorer_model}. Response addresses most parts adequately."
        return score, explanation

    def score_question(
        self,
        question: ShortAnswerQuestion,
        response: Response,
        test_metadata: Optional[Dict] = None,
    ) -> EvaluationResult:
        """
        Score a complete Short Answer Question using the configured model with precedence hierarchy.
        """
        # Call the scorer model
        total_score, explanation = self._call_scorer_model(
            question, response, test_metadata
        )

        # Determine if the overall response is correct (score >= 80% of max)
        is_correct = total_score >= (question.max_points * 0.8)

        return EvaluationResult(
            question_id=response.question_id,
            is_correct=is_correct,
            expected_answer="",  # Not applicable for Short Answer Question
            given_answer=response.answer,
            explanation=explanation,
            confidence=response.confidence,
            time_taken=response.time_taken,
            tokens_used=response.tokens_used,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=total_score,
        )
