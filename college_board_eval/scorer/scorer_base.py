import base64
import os
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Generic, List, Optional, Tuple, TypeVar

import openai

from ..ap_types import EvaluationResult, Question, Response

# Generic type for question types
Q = TypeVar("Q", bound=Question)


class ScorerBase(ABC, Generic[Q]):
    """
    Abstract base class for all question type scorers.
    Provides standardized interface and common utilities.
    """

    def __init__(self):
        self.scorer_model = self._get_scorer_model()
        self.prompt_template = self._get_prompt_template()

    @abstractmethod
    def _get_scorer_model(self) -> str:
        """Get the configured scorer model name for this question type"""
        pass

    @abstractmethod
    def _get_prompt_template(self) -> str:
        """Get the prompt template for this question type"""
        pass

    @abstractmethod
    def score_question(
        self,
        question: Q,
        response: Response,
        test_metadata: Optional[Dict] = None,
    ) -> EvaluationResult:
        """
        Score a question of this type.
        Must be implemented by each specific scorer.
        """
        pass

    def _load_image_as_base64(self, image_path: str, exam_identifier: str) -> Optional[str]:
        """
        Load an image file and return it as base64 encoded string.
        Returns None if image cannot be loaded.
        """
        try:
            # Construct the full path to the image
            exam_dir = Path(__file__).parent.parent / "exams" / exam_identifier
            full_image_path = exam_dir / image_path

            if not full_image_path.exists():
                print(f"Warning: Image file not found: {full_image_path}")
                return None

            # Read and encode the image
            with open(full_image_path, "rb") as image_file:
                image_data = image_file.read()
                encoded_image = base64.b64encode(image_data).decode("utf-8")
                return encoded_image

        except Exception as e:
            print(f"Warning: Failed to load image {image_path}: {e}")
            return None

    def _get_model_vision_support(self, model: str) -> bool:
        """
        Check if the model supports vision capabilities.
        """
        # Vision-capable models
        vision_models = {
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-vision-preview",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        }

        # Check if model name contains vision indicators
        model_lower = model.lower()
        if "vision" in model_lower or "multimodal" in model_lower:
            return True

        return model in vision_models

    def _get_scoring_guide_with_precedence(self, question: Q, test_metadata: Optional[Dict] = None) -> str:
        """
        Get the appropriate scoring guide based on precedence:
        1. Question-level (highest priority)
        2. Test-level (medium priority)
        3. System-level (lowest priority)
        """
        # This is a generic implementation - specific scorers can override
        # Priority 1: Question-level scoring guide
        if (
            hasattr(question, "short_answer_question_rubric_question")
            and question.short_answer_question_rubric_question
        ):
            return question.short_answer_question_rubric_question

        # Priority 2: Test-level scoring guide
        if test_metadata and test_metadata.get("short_answer_question_rubric_test"):
            return test_metadata["short_answer_question_rubric_test"]

        # Priority 3: System-level scoring guide (fallback)
        return self._get_system_level_scoring_guide()

    def _get_system_level_scoring_guide(self) -> str:
        """Get the system-level scoring guide. Override in specific scorers."""
        return ""

    def _format_rubric_for_prompt(self, rubric: Dict[str, Any]) -> str:
        """Format the rubric into a readable string for the prompt"""
        if not rubric:
            return "No rubric provided"

        formatted = []
        for part_label, part_rubric in rubric.items():
            formatted.append(f"Part {part_label}:")
            formatted.append(f"  Criteria: {part_rubric.get('criteria', 'No criteria')}")
            formatted.append(f"  Points: {part_rubric.get('points', 1)}")
            if part_rubric.get("examples"):
                formatted.append(f"  Examples: {', '.join(part_rubric['examples'])}")
            formatted.append("")

        return "\n".join(formatted)

    def _call_openai_model(
        self, prompt: str, model: str, image_content: Optional[Dict[str, Any]] = None
    ) -> Tuple[float, str]:
        """
        Call OpenAI model to evaluate the response.
        Returns (score, explanation).
        """
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            # Prepare message content
            message_content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]

            # Add image if available and model supports vision
            supports_vision = self._get_model_vision_support(model)
            if image_content and supports_vision:
                message_content.append(image_content)
            elif image_content and not supports_vision:
                # Add notice about image not being sent
                image_notice = (
                    f"\n[Note: An image was included in the question, but this model ({model}) "
                    "doesn't support vision. Please evaluate based on the text content only.]"
                )
                message_content[0]["text"] = message_content[0]["text"].replace("Question:", f"Question:{image_notice}")

            completion = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": message_content}],  # type: ignore[misc]
                temperature=0.0,
                max_tokens=512,
            )
            reply = completion.choices[0].message.content.strip()

            # Parse the response for score and explanation
            score_match = re.search(r"Score:\s*([0-9.]+)/([0-9.]+)\s*$", reply, re.MULTILINE)
            explanation_match = re.search(r"Explanation:\s*(.*?)(?=\nScore:|$)", reply, re.DOTALL)

            if score_match:
                score = float(score_match.group(1))
            else:
                score = 0.0

            explanation = explanation_match.group(1).strip() if explanation_match else reply
            return score, explanation

        except Exception as e:
            return 0.0, f"[OpenAI scoring failed: {e}]"

    def _extract_exam_identifier(self, question_id: str) -> str:
        """Extract exam identifier from question ID"""
        parts = question_id.split("_")
        # Extract first 4 parts (including year) for exam identifier
        exam_identifier = "_".join(parts[0:4])
        return exam_identifier
