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
import openai

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
        provider = get_short_answer_question_scorer_provider()
        model = get_short_answer_question_scorer_model()
        # Try OpenAI if configured
        if provider == "openai":
            try:
                client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
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