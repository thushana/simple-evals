#!/usr/bin/env python3
"""
Test script for Short Answer Question functionality.
"""

from ..ap_types import Response, QuestionType
from ..exam_loader import get_questions_for_exam
from ..evaluator import APEvaluator
from datetime import datetime

def test_short_answer():
    """Test loading and scoring a Short Answer Question."""
    
    # Load questions from the exam
    questions, question_groups = get_questions_for_exam("AP_US_HISTORY_2017")
    
    # Find the Short Answer Question
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]
    
    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return
    
    question = short_answer_questions[0]
    print(f"Testing Short Answer Question: {question.id}")
    print(f"Question text: {question.question_text[:100]}...")
    print(f"Max points: {question.max_points}")
    print(f"Has rubric: {question.rubric is not None}")
    print(f"Has exemplar answers: {question.exemplar_answers is not None}")
    print(f"Has question-level scoring guide: {question.short_answer_question_rubric_question is not None}")
    if question.short_answer_question_rubric_question:
        print(f"Question-level scoring guide preview: {question.short_answer_question_rubric_question[:100]}...")
    
    # Create a test response
    test_response = Response(
        question_id=question.id,
        answer="""(A) Turner views the West as a process of continual rebirth and expansion, while Limerick sees it as a place shaped by conquest and interaction among diverse groups.

(B) The Homestead Act of 1862 encouraged westward migration and settlement, supporting Turner's interpretation of the frontier as a process of expansion.

(C) The Dawes Act of 1887, which divided tribal lands and aimed to assimilate Native Americans, supports Limerick's interpretation of the West as a place shaped by conquest.""",
        model_name="test-model",
        timestamp=datetime.now()
    )
    
    # Evaluate the response
    evaluator = APEvaluator([question])
    result = evaluator.evaluate_response(test_response)
    
    print(f"\nEvaluation Result:")
    print(f"Score: {result.score}/{question.max_points}")
    print(f"Is correct: {result.is_correct}")
    print(f"Explanation: {result.explanation}")

if __name__ == "__main__":
    test_short_answer() 