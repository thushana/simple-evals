#!/usr/bin/env python3
"""
Test script to verify the refactored evaluator works correctly.
"""

from college_board_eval import (
    APEvaluator, ScorerRegistry, QuestionType,
    MultipleChoiceQuestion, ShortAnswerQuestion, Response, APTest,
    ScorerMultipleChoice, ScorerShortAnswer
)
from datetime import datetime

def test_multiple_choice():
    """Test multiple choice evaluation"""
    print("Testing Multiple Choice evaluation...")
    
    # Create a multiple choice question
    question = MultipleChoiceQuestion(
        id="AP_CALCULUS_BC_2012_I_A_001",
        test=APTest.AP_CALCULUS_BC,
        question_type=QuestionType.MULTIPLE_CHOICE,
        question_text="What is the derivative of x^2?",
        correct_answer="A",
        explanation="The derivative of x^2 is 2x",
        difficulty=0.5,
        skill_domain="Calculus",
        year=2012,
        options={"A": "2x", "B": "x^2", "C": "2x^2", "D": "x"}
    )
    
    # Create a correct response
    correct_response = Response(
        question_id="AP_CALCULUS_BC_2012_I_A_001",
        answer="A",
        explanation="The derivative of x^2 is 2x",
        confidence=0.9,
        time_taken=30.0,
        tokens_used=50,
        model_name="test-model",
        timestamp=datetime.now()
    )
    
    # Create an incorrect response
    incorrect_response = Response(
        question_id="AP_CALCULUS_BC_2012_I_A_001",
        answer="B",
        explanation="I think it's x^2",
        confidence=0.3,
        time_taken=45.0,
        tokens_used=40,
        model_name="test-model",
        timestamp=datetime.now()
    )
    
    # Test evaluation
    evaluator = APEvaluator([question])
    
    correct_result = evaluator.evaluate_response(correct_response)
    incorrect_result = evaluator.evaluate_response(incorrect_response)
    
    print(f"Correct response: score={correct_result.score}, is_correct={correct_result.is_correct}")
    print(f"Incorrect response: score={incorrect_result.score}, is_correct={incorrect_result.is_correct}")
    
    assert correct_result.is_correct == True
    assert incorrect_result.is_correct == False
    assert correct_result.score == 1.0
    assert incorrect_result.score == 0.0
    
    print("✓ Multiple Choice test passed!")

def test_scorer_registry():
    """Test the scorer registry"""
    print("\nTesting Scorer Registry...")
    
    registry = ScorerRegistry()
    supported_types = registry.get_supported_question_types()
    
    print(f"Supported question types: {[t.value for t in supported_types]}")
    
    # Test getting scorers
    mc_scorer = registry.get_scorer(QuestionType.MULTIPLE_CHOICE)
    sa_scorer = registry.get_scorer(QuestionType.SHORT_ANSWER_QUESTION)
    
    print(f"Multiple Choice scorer: {type(mc_scorer).__name__}")
    print(f"Short Answer scorer: {type(sa_scorer).__name__}")
    
    assert isinstance(mc_scorer, ScorerMultipleChoice)
    assert isinstance(sa_scorer, ScorerShortAnswer)
    
    print("✓ Scorer Registry test passed!")

if __name__ == "__main__":
    test_scorer_registry()
    test_multiple_choice()
    print("\n🎉 All tests passed! The refactored evaluator is working correctly.") 