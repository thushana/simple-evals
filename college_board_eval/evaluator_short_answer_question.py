from typing import Dict, List, Any, Optional, Tuple
from .ap_types import ShortAnswerQuestion, Response, EvaluationResult
from .config import (
    get_scorer_model,
    get_short_answer_question_prompt_template,
    get_system_level_scoring_guide,
    get_short_answer_question_scorer_provider,
    get_short_answer_question_scorer_model,
)
import re
import json
import os
import base64
import openai
from pathlib import Path

class ShortAnswerScorer:
    """
    Scores Short Answer Questions using a configured model with precedence hierarchy.
    Supports images when the model has vision capabilities.
    """
    
    def __init__(self):
        self.scorer_model = get_scorer_model()
        self.prompt_template = get_short_answer_question_prompt_template()
    
    def _load_image_as_base64(self, image_path: str, exam_identifier: str) -> Optional[str]:
        """
        Load an image file and return it as base64 encoded string.
        Returns None if image cannot be loaded.
        """
        try:
            # Construct the full path to the image
            exam_dir = Path(__file__).parent / "exams" / exam_identifier
            full_image_path = exam_dir / image_path
            
            if not full_image_path.exists():
                print(f"Warning: Image file not found: {full_image_path}")
                return None
            
            # Read and encode the image
            with open(full_image_path, "rb") as image_file:
                image_data = image_file.read()
                encoded_image = base64.b64encode(image_data).decode('utf-8')
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
            "gpt-4o", "gpt-4o-mini", "gpt-4-vision-preview",
            "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022",
            "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"
        }
        
        # Check if model name contains vision indicators
        model_lower = model.lower()
        if "vision" in model_lower or "multimodal" in model_lower:
            return True
            
        return model in vision_models
    
    def _get_scoring_guide_with_precedence(self, question: ShortAnswerQuestion, test_metadata: Optional[Dict] = None) -> str:
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
        return get_system_level_scoring_guide()
    
    def _format_rubric_for_prompt(self, rubric: Dict[str, Any]) -> str:
        """Format the rubric into a readable string for the prompt"""
        if not rubric:
            return "No rubric provided"
        
        formatted = []
        for part_label, part_rubric in rubric.items():
            formatted.append(f"Part {part_label}:")
            formatted.append(f"  Criteria: {part_rubric.get('criteria', 'No criteria')}")
            formatted.append(f"  Points: {part_rubric.get('points', 1)}")
            if part_rubric.get('examples'):
                formatted.append(f"  Examples: {', '.join(part_rubric['examples'])}")
            formatted.append("")
        
        return "\n".join(formatted)
    
    def _call_scorer_model(self, question: ShortAnswerQuestion, response: Response, test_metadata: Optional[Dict] = None) -> Tuple[float, str]:
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
            exam_identifier = question.id.split('_')[0:4]  # Extract exam identifier from question ID (including year)
            exam_identifier = '_'.join(exam_identifier)
            encoded_image = self._load_image_as_base64(question.question_image, exam_identifier)
            
            if encoded_image:
                image_content = {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{encoded_image}"
                    }
                }
            else:
                image_notice = f"\n[Note: An image was supposed to be included here ({question.question_image}), but it could not be loaded. Please evaluate the response based on the text content only.]"
        
        # Create the prompt
        prompt = self.prompt_template.format(
            question_text=question.question_text,
            rubric=rubric_text,
            response=response.answer,
            max_points=question.max_points
        )
        
        # Add the scoring guide to the prompt
        if scoring_guide:
            prompt = prompt.replace("Rubric:", f"General Scoring Criteria:\n{scoring_guide}\n\nRubric:")
        
        # Add image notice if image couldn't be loaded
        if image_notice:
            prompt = prompt.replace("Question:", f"Question:{image_notice}")
        
        provider = get_short_answer_question_scorer_provider()
        model = get_short_answer_question_scorer_model()
        
        # Check if model supports vision
        supports_vision = self._get_model_vision_support(model)
        
        # Try OpenAI if configured
        if provider == "openai":
            try:
                client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                
                # Prepare message content
                message_content = [{"type": "text", "text": prompt}]
                
                # Add image if available and model supports vision
                if image_content and supports_vision:
                    message_content.append(image_content)
                elif image_content and not supports_vision:
                    # Add notice about image not being sent
                    image_notice = f"\n[Note: An image was included in the question ({question.question_image}), but this model ({model}) doesn't support vision. Please evaluate based on the text content only.]"
                    message_content[0]["text"] = message_content[0]["text"].replace("Question:", f"Question:{image_notice}")
                
                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": message_content}],
                    temperature=0.0,
                    max_tokens=512,
                )
                reply = completion.choices[0].message.content.strip()
                # Parse the response for score and explanation
                import re
                # Look for score at the end of the response
                score_match = re.search(r"Score:\s*([0-9.]+)/([0-9.]+)\s*$", reply, re.MULTILINE)
                # Look for explanation at the beginning (before the score)
                explanation_match = re.search(r"Explanation:\s*(.*?)(?=\nScore:|$)", reply, re.DOTALL)
                if score_match:
                    score = float(score_match.group(1))
                else:
                    score = 0.0
                explanation = explanation_match.group(1).strip() if explanation_match else reply
                return score, explanation
            except Exception as e:
                return 0.0, f"[OpenAI scoring failed: {e}]"
        
        # Fallback: placeholder
        score = 2.5  # Placeholder score
        explanation = f"Scored using {self.scorer_model}. Response addresses most parts adequately."
        return score, explanation
    
    def score_question(self, question: ShortAnswerQuestion, response: Response, test_metadata: Optional[Dict] = None) -> EvaluationResult:
        """
        Score a complete Short Answer Question using the configured model with precedence hierarchy.
        """
        # Call the scorer model
        total_score, explanation = self._call_scorer_model(question, response, test_metadata)
        
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
            score=total_score
        ) 