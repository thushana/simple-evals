#!/usr/bin/env python3
"""
Test script for Short Answer Question functionality.
"""

from ..ap_types import Response, QuestionType
from ..exam_loader import get_questions_for_exam
from ..evaluator import APEvaluator
from datetime import datetime
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from sampler.chat_completion_sampler import ChatCompletionSampler

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
    # Remove any truncation, always print full text
    print(f"\033[1m📝 Short Answer Question: {question.id}\033[0m")
    if getattr(question, 'question_context', None):
        print(f"\033[1m📚 Context:\033[0m {question.question_context}")
    print(f"\033[1m❓ Question text:\033[0m {question.question_text}")
    print(f"\033[1mMax points:\033[0m {question.max_points}")
    print(f"\033[1mHas rubric:\033[0m {question.rubric is not None}")
    print(f"\033[1mHas exemplar answers:\033[0m {question.exemplar_answers is not None}")
    print(f"\033[1mHas question-level scoring guide:\033[0m {question.short_answer_question_rubric_question is not None}")
    if question.short_answer_question_rubric_question:
        print(f"\033[1mQuestion-level scoring guide:\033[0m {question.short_answer_question_rubric_question}")
    
    # Create a test response
    test_response = Response(
        question_id=question.id,
        answer="""(A) Turner views the West as a process of continual rebirth and expansion, while Limerick sees it as a place shaped by conquest and interaction among diverse groups.\n\n(B) The Homestead Act of 1862 encouraged westward migration and settlement, supporting Turner's interpretation of the frontier as a process of expansion.\n\n(C) The Dawes Act of 1887, which divided tribal lands and aimed to assimilate Native Americans, supports Limerick's interpretation of the West as a place shaped by conquest.""",
        model_name="test-model",
        timestamp=datetime.now()
    )
    
    # Evaluate the response
    evaluator = APEvaluator([question])
    result = evaluator.evaluate_response(test_response)
    
    print("\n\033[1m📝 Student Answer:\033[0m")
    print(test_response.answer)
    print(f"\n\033[1m🏅 Score:\033[0m {result.score}/{question.max_points}")
    print(f"\033[1m{'✅' if result.is_correct else '❌'} Is correct:\033[0m {result.is_correct}")
    print(f"\033[1m💡 Explanation:\033[0m\n{result.explanation}")

def test_poor_response_generation():
    """Test scoring a response that's generated to be like a 5th grader (incorrect/incomplete), agnostic to test/subject."""
    
    # Load questions from the exam
    questions, question_groups = get_questions_for_exam("AP_US_HISTORY_2017")
    
    # Find the Short Answer Question
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]
    
    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return
    
    question = short_answer_questions[0]
    print(f"\n\033[1m🎭 5TH GRADER RESPONSE GENERATION TEST\033[0m")
    print(f"\033[1m📝 Short Answer Question: {question.id}\033[0m")
    if getattr(question, 'question_context', None):
        print(f"\033[1m📚 Context:\033[0m {question.question_context}")
    print(f"\033[1m❓ Question text:\033[0m {question.question_text}")
    print(f"\033[1mMax points:\033[0m {question.max_points}")
    
    # Generate a 5th grader style response using LLM (test-agnostic)
    sampler = ChatCompletionSampler(
        model="gpt-4o-mini",
        temperature=0.9,
        system_message="You are a 5th grade student who is struggling with this exam. You have very basic knowledge and often make mistakes. Write answers that would get a low score on a test—vague, simplistic, with factual errors, and lacking specific details."
    )
    
    # Create the prompt for generating the response (test-agnostic)
    prompt = f"""Answer this test question as if you are a struggling 5th grade student. Your goal is to write a response that would get a LOW score on a test.\n\nIMPORTANT: Make your answers vague, simplistic, and include some factual errors. Don't use specific details or show deep understanding. Write like someone who doesn't really understand the material well.\n\nQuestion Context:\n{question.question_context}\n\nQuestion:\n{question.question_text}\n\nWrite your answer in this format:\n(A) [your answer to part A]\n(B) [your answer to part B]\n(C) [your answer to part C]\n\nRemember: You want to get a LOW score. Be vague, make mistakes, don't show specific knowledge."""

    # Generate the response
    print("\n\033[1m🤖 Generating 5th grader response...\033[0m")
    sampler_response = sampler([{"role": "user", "content": prompt}])
    generated_answer = sampler_response.response_text
    
    # Create the response object
    poor_response = Response(
        question_id=question.id,
        answer=generated_answer,
        model_name="5th-grader-model",
        timestamp=datetime.now()
    )
    
    # Evaluate the response
    evaluator = APEvaluator([question])
    result = evaluator.evaluate_response(poor_response)
    
    print("\n\033[1m👶 Generated 5th Grader's Answer:\033[0m")
    print(poor_response.answer)
    print(f"\n\033[1m🏅 Score:\033[0m {result.score}/{question.max_points}")
    print(f"\033[1m{'✅' if result.is_correct else '❌'} Is correct:\033[0m {result.is_correct}")
    print(f"\033[1m💡 Explanation:\033[0m\n{result.explanation}")

if __name__ == "__main__":
    test_short_answer()
    test_poor_response_generation() 