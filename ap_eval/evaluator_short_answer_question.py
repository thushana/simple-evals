from typing import Dict, List, Any, Optional, Tuple
from .ap_types import ShortAnswerQuestion, Response, EvaluationResult
from .config import get_scorer_model, get_short_answer_question_prompt_template, get_system_level_scoring_guide
import re
import json

class ShortAnswerScorer:
    """
    Scores Short Answer Questions using a configured model with precedence hierarchy.
    """
    
    def __init__(self):
        self.scorer_model = get_scorer_model()
        self.prompt_template = get_short_answer_question_prompt_template()
    
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
        
        # TODO: Implement actual model call here
        # For now, return a placeholder score
        # In the real implementation, you would:
        # 1. Call the configured model (self.scorer_model) with the prompt
        # 2. Parse the response to extract score and explanation
        # 3. Return the parsed results
        
        # Placeholder implementation
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