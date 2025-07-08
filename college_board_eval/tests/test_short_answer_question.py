#!/usr/bin/env python3
"""
Generic test script for Short Answer Question functionality.
"""

import argparse
import os
import sys
from datetime import datetime

from sampler.chat_completion_sampler import ChatCompletionSampler

from ..ap_types import QuestionType, Response
from ..evaluator import APEvaluator
from ..exam_loader import get_questions_for_exam

sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))


def test_question_loading(exam_identifier):
    """Test loading and displaying a Short Answer Question."""

    # Load questions from the exam
    questions, question_groups = get_questions_for_exam(exam_identifier)

    # Find the Short Answer Question
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]

    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return

    question = short_answer_questions[0]
    print(f"\033[1m📝 Short Answer Question: {question.id}\033[0m")
    if getattr(question, "question_context", None):
        print(f"\033[1m📚 Context:\033[0m {question.question_context}")
    print(f"\033[1m❓ Question text:\033[0m {question.question_text}")
    print(f"\033[1mMax points:\033[0m {question.max_points}")
    print(f"\033[1mHas rubric:\033[0m {question.rubric is not None}")
    print(f"\033[1mHas exemplar answers:\033[0m {question.exemplar_answers is not None}")
    print(
        f"\033[1mHas question-level scoring guide:\033[0m "
        f"{question.short_answer_question_rubric_question is not None}"
    )
    if question.short_answer_question_rubric_question:
        print(f"\033[1mQuestion-level scoring guide:\033[0m " f"{question.short_answer_question_rubric_question}")


def test_poor_response_generation(exam_identifier, model_name="gpt-4o-mini"):
    """Test scoring a response that's generated to be poor quality (incorrect/incomplete)."""

    # Load questions from the exam
    questions, question_groups = get_questions_for_exam(exam_identifier)

    # Find the Short Answer Question
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]

    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return

    question = short_answer_questions[0]
    print("\n\033[1m🎭 POOR RESPONSE GENERATION TEST\033[0m")
    print(f"\033[1m📝 Short Answer Question: {question.id}\033[0m")
    if getattr(question, "question_context", None):
        print(f"\033[1m📚 Context:\033[0m {question.question_context}")
    print(f"\033[1m❓ Question text:\033[0m {question.question_text}")
    print(f"\033[1mMax points:\033[0m {question.max_points}")

    # Generate a poor quality response using LLM
    sampler = ChatCompletionSampler(
        model=model_name,
        temperature=0.9,
        system_message=(
            "You are a person with very basic knowledge who is struggling with this assessment. "
            "You have limited understanding and often make mistakes. Write answers that would get a low score—"
            "vague, simplistic, with factual errors, and lacking specific details."
        ),
    )

    # Create the prompt for generating the response
    prompt = (
        "Answer this question as if you are a person with very basic knowledge. "
        "Your goal is to write a response that would get a LOW score.\n\n"
        "IMPORTANT: Make your answers vague, simplistic, and include some factual errors. "
        "Don't use specific details or show deep understanding. "
        "Write like someone who doesn't really understand the material well.\n\n"
        f"Question Context:\n"
        f"{question.question_context if getattr(question, 'question_context', None) else 'No context provided'}\n\n"
        f"Question:\n{question.question_text}\n\n"
        "Write your answer in this format:\n(A) [your answer to part A]\n(B) [your answer to part B]"
        "\n(C) [your answer to part C]\n\n"
        "Remember: You want to get a LOW score. Be vague, make mistakes, don't show specific knowledge."
    )

    # Generate the response
    print("\n\033[1m🤖 Generating poor quality response...\033[0m")
    sampler_response = sampler([{"role": "user", "content": prompt}])
    generated_answer = sampler_response.response_text

    # Create the response object
    poor_response = Response(
        question_id=question.id,
        answer=generated_answer,
        model_name="poor-quality-model",
        timestamp=datetime.now(),
    )

    # Evaluate the response
    evaluator = APEvaluator([question])
    result = evaluator.evaluate_response(poor_response)

    print("\n\033[1m👶 Generated Poor Quality Answer:\033[0m")
    print(poor_response.answer)
    print(f"\n\033[1m🏅 Score:\033[0m {result.score}/{question.max_points}")
    print(f"\033[1m{'✅' if result.is_correct else '❌'} Is correct:\033[0m {result.is_correct}")
    print(f"\033[1m💡 Explanation:\033[0m\n{result.explanation}")


def test_real_model_responses(exam_identifier, model_name="gpt-4o-mini", show_details=False):
    """Test generating real model responses for each short answer question and evaluating them."""

    # Load questions from the exam
    questions, question_groups = get_questions_for_exam(exam_identifier)

    # Filter to only short answer questions
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]

    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return

    print("\n\033[1m🤖 REAL MODEL RESPONSE TEST\033[0m")
    print(f"Found {len(short_answer_questions)} short answer questions")

    # Create evaluator with just short answer questions
    evaluator = APEvaluator(short_answer_questions)

    # Create sampler for generating responses
    sampler = ChatCompletionSampler(
        model=model_name,
        temperature=0.3,
        system_message=(
            "You are a knowledgeable person. Answer the questions thoroughly and accurately, "
            "showing specific knowledge and understanding."
        ),
    )

    responses = []
    results = []

    for i, question in enumerate(short_answer_questions):
        if show_details:
            print("\n" + "=" * 60)
            print(f"🤖 GENERATING RESPONSE FOR: {question.id}")
            print("=" * 60)

            # Show question details
            if getattr(question, "question_context", None):
                print(f"📚 Context: {question.question_context[:200]}...")
            print(f"❓ Question: {question.question_text}")
            print(f"📊 Max points: {question.max_points}")

        # Create prompt for the model
        prompt = f"""Answer this short answer question thoroughly and accurately.

Question Context:
{question.question_context if getattr(question, 'question_context', None) else 'No context provided'}

Question:
{question.question_text}

Provide a detailed response that addresses all parts of the question. Use specific knowledge and evidence."""

        # Generate the response
        if show_details:
            print("\n🔄 Generating response...")
        sampler_response = sampler([{"role": "user", "content": prompt}])
        generated_answer = sampler_response.response_text

        # Create the response object
        test_response = Response(
            question_id=question.id,
            answer=generated_answer,
            model_name=model_name,
            timestamp=datetime.now(),
        )

        responses.append(test_response)

        # Evaluate the response
        if show_details:
            print("\n📝 Generated Answer:")
            print("=" * 40)
            print(generated_answer)
            print("=" * 40)

        result = evaluator.evaluate_response(test_response)
        results.append(result)

        # Display the evaluation result
        score_emoji = (
            "✅"
            if result.score >= question.max_points * 0.8
            else "🟡" if result.score >= question.max_points * 0.5 else "🔴"
        )
        if show_details:
            print("\n🏅 Evaluation Result:")
            print(f"Score: {result.score}/{question.max_points} {score_emoji}")
            print(f"Correct: {'Yes' if result.is_correct else 'No'}")
            print(f"Explanation: {result.explanation}")
        else:
            print(f"{question.id} → Score {result.score}/{question.max_points} {score_emoji}")

    # Calculate final statistics
    total_score = sum(r.score for r in results)
    total_possible = sum(q.max_points for q in short_answer_questions)
    score_average = total_score / total_possible if total_possible > 0 else 0.0

    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"Total Score: {int(total_score)}/{total_possible}")
    print(f"Average: {score_average:.1%}")
    print(f"Questions: {len(short_answer_questions)}")


def test_short_answer_evaluation(exam_identifier, model_name="gpt-4o-mini"):
    """Test the full evaluation pipeline on just short answer questions with real model responses."""

    # Load questions from the exam
    questions, question_groups = get_questions_for_exam(exam_identifier)

    # Filter to only short answer questions
    short_answer_questions = [q for q in questions if q.question_type == QuestionType.SHORT_ANSWER_QUESTION]

    if not short_answer_questions:
        print("No Short Answer Questions found!")
        return

    print("\n\033[1m🎯 SHORT ANSWER EVALUATION TEST (WITH REAL MODEL RESPONSES)\033[0m")
    print(f"Found {len(short_answer_questions)} short answer questions")

    # Create evaluator with just short answer questions
    evaluator = APEvaluator(short_answer_questions)

    # Create sampler for generating responses
    sampler = ChatCompletionSampler(
        model=model_name,
        temperature=0.3,
        system_message=(
            "You are a knowledgeable person. Answer the questions thoroughly and accurately, "
            "showing specific knowledge and understanding."
        ),
    )

    responses = []
    results = []

    for i, question in enumerate(short_answer_questions):
        print(
            f"{question.id} → 🔄 Generating and evaluating...",
            end="",
            flush=True,
        )

        # Create prompt for the model
        prompt = f"""Answer this short answer question thoroughly and accurately.

Question Context:
{question.question_context if getattr(question, 'question_context', None) else 'No context provided'}

Question:
{question.question_text}

Provide a detailed response that addresses all parts of the question. Use specific knowledge and evidence."""

        # Generate the response
        sampler_response = sampler([{"role": "user", "content": prompt}])
        generated_answer = sampler_response.response_text

        # Create the response object
        test_response = Response(
            question_id=question.id,
            answer=generated_answer,
            model_name=model_name,
            timestamp=datetime.now(),
        )

        responses.append(test_response)

        # Evaluate the response
        result = evaluator.evaluate_response(test_response)
        results.append(result)

        # Display the result
        score_emoji = (
            "✅"
            if result.score >= question.max_points * 0.8
            else "🟡" if result.score >= question.max_points * 0.5 else "🔴"
        )
        print(
            "\r{} – Short Answer Question 📝 → Score {} | Max {} | {}".format(
                question.id, result.score, question.max_points, score_emoji
            )
        )

    # Calculate final statistics
    total_score = sum(r.score for r in results)
    total_possible = sum(q.max_points for q in short_answer_questions)
    score_average = total_score / total_possible if total_possible > 0 else 0.0

    print("\n\033[1mResults for Short Answer Questions:\033[0m")
    print(f"Score:\t\t{int(total_score)}/{total_possible} correct")
    print(f"Average:\t{score_average:.1%}")
    print(f"Questions:\t{len(short_answer_questions)}")


def main():
    parser = argparse.ArgumentParser(description="Test Short Answer Question functionality")
    parser.add_argument("exam_identifier", help="Exam identifier (e.g., EXAM_NAME_YEAR)")
    parser.add_argument("--model", default="gpt-4o-mini", help="Model to use for generating responses")
    parser.add_argument(
        "--test",
        choices=["load", "poor", "real", "eval", "all"],
        default="all",
        help="Which test to run",
    )
    parser.add_argument(
        "--show-details",
        action="store_true",
        help="Show detailed output for real model responses",
    )

    args = parser.parse_args()

    print(f"Testing Short Answer Questions for exam: {args.exam_identifier}")
    print(f"Using model: {args.model}")

    if args.test == "load" or args.test == "all":
        test_question_loading(args.exam_identifier)

    if args.test == "poor" or args.test == "all":
        test_poor_response_generation(args.exam_identifier, args.model)

    if args.test == "real" or args.test == "all":
        test_real_model_responses(args.exam_identifier, args.model, args.show_details)

    if args.test == "eval" or args.test == "all":
        test_short_answer_evaluation(args.exam_identifier, args.model)


if __name__ == "__main__":
    main()
