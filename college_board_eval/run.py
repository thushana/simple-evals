import argparse
import base64
import datetime
import json
import os
import sys
import time

from college_board_eval.ap_types import Response
from college_board_eval.evaluator import APEvaluator
from college_board_eval.exam_loader import get_questions_for_exam


def get_sampler(model_name):
    """Get the appropriate sampler based on model name"""
    if model_name.startswith("gpt"):
        from sampler.chat_completion_sampler import ChatCompletionSampler

        return ChatCompletionSampler(model=model_name), "openai"
    elif model_name.startswith("claude"):
        from sampler.claude_sampler import ClaudeCompletionSampler

        return ClaudeCompletionSampler(model=model_name), "anthropic"
    elif model_name.startswith("gemini"):
        from sampler.gemini_sampler import GeminiCompletionSampler

        return GeminiCompletionSampler(model=model_name), "google"
    elif model_name.startswith("o"):
        from sampler.o_chat_completion_sampler import OChatCompletionSampler

        return OChatCompletionSampler(model=model_name), "openai"
    else:
        raise ValueError(f"Unknown model: {model_name}")


def build_prompt(question):
    prompt = ""

    # Add image reference if present
    if hasattr(question, "question_image") and question.question_image:
        prompt += f"[Refer to the image: {question.question_image}]\n\n"

    # Add text context if present
    if hasattr(question, "question_context") and question.question_context:
        prompt += f"{question.question_context}\n\n"

    prompt += f"{question.question_text}\n\n"

    # Add options for multiple choice questions
    if hasattr(question, "options"):
        prompt += "Options:\n"
        for k, v in question.options.items():
            prompt += f"{k}: {v}\n"
        prompt += (
            "\nAnswer with the letter (A, B, C, or D) followed by your reasoning.\n"
            "Example: A: (Explain why this option is correct because [keep to 1-2 sentences]...)"
        )
    else:
        # For Short Answer Questions
        prompt += "Provide a detailed description of what you observe in the image."

    return prompt


def get_model_response(
    sampler,
    question,
    model_name,
    exam_identifier,
    show_question=False,
    show_model_query=False,
    show_model_response=False,
):
    if show_question:
        print(f"\n{'='*50}")
        print(f"QUESTION: {question.id}")
        print(f"{'='*50}")

        # Show image reference if present
        if hasattr(question, "question_image") and question.question_image:
            print(f"IMAGE: {question.question_image}")

        if hasattr(question, "question_context") and question.question_context:
            print(f"CONTEXT:\n{question.question_context}")

        print(f"\nQUESTION:\n{question.question_text}")

        # Show options for multiple choice questions
        if hasattr(question, "options"):
            print("\nOPTIONS:")
            for k, v in question.options.items():
                print(f"  {k}: {v}")

        print(f"\nCORRECT ANSWER: {question.correct_answer}")
        print(f"{'='*50}")

    # Build the prompt text
    prompt_text = ""

    # Add text context if present
    if hasattr(question, "question_context") and question.question_context:
        prompt_text += f"{question.question_context}\n\n"

    prompt_text += f"{question.question_text}\n\n"

    # Add options for multiple choice questions
    if hasattr(question, "options"):
        prompt_text += "Options:\n"
        for k, v in question.options.items():
            prompt_text += f"{k}: {v}\n"
        prompt_text += (
            "\nAnswer with the letter (A, B, C, or D) followed by your reasoning.\n"
            "Example: A: (Explain why this option is correct because [keep to 1-2 sentences]...)"
        )
    else:
        # For Short Answer Questions
        prompt_text += "Provide a detailed description of what you observe in the image."

    if show_model_query:
        print("\nPROMPT SENT TO MODEL:")
        print("=" * 50)
        print(prompt_text)
        if hasattr(question, "question_image") and question.question_image:
            print(f"\n[Image will be included: {question.question_image}]")
        print("=" * 50)

    # Prepare message content
    content = [{"type": "text", "text": prompt_text}]

    # Add image if present
    if hasattr(question, "question_image") and question.question_image:
        # Construct image path relative to the exam directory
        exam_dir = os.path.join(os.path.dirname(__file__), "exams", exam_identifier)
        image_path = os.path.join(exam_dir, question.question_image)

        # Encode the image
        base64_image = encode_image(image_path)
        if base64_image:
            # Determine image format from file extension
            image_format = question.question_image.split(".")[-1].lower()
            if image_format == "jpg":
                image_format = "jpeg"

            # Use different format for different models
            if model_name.startswith("claude"):
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": f"image/{image_format}",
                            "data": base64_image,
                        },
                    }
                )
            elif model_name.startswith("gemini"):
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": f"image/{image_format}",
                            "data": base64_image,
                        },
                    }
                )
            else:
                content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/{image_format};base64,{base64_image}",
                            "detail": "high",
                        },
                    }
                )

    message_list = [{"role": "user", "content": content}]

    start_time = time.time()
    sampler_response = sampler(message_list)
    end_time = time.time()

    if show_model_response:
        print("\nMODEL RESPONSE:")
        print("=" * 50)
        print(sampler_response.response_text)
        print("=" * 50)

    # Extract answer based on question type
    answer = ""
    response_text = sampler_response.response_text.strip()

    if hasattr(question, "options"):
        # Multiple choice question - extract letter answer
        # Look for answer patterns like "A:", "B:", ..., "Z:" at the beginning
        import re

        lines = response_text.split("\n")
        for line in lines:
            line = line.strip()
            if re.match(r"^[A-Z]:", line):
                answer = line[0]
                break
        # If not found at beginning of lines, look for patterns like "Answer: A" or "The answer is B" (A-Z)
        if not answer:
            patterns = [
                r"answer[:\s]+([A-Z])",
                r"option[:\s]+([A-Z])",
                r"choice[:\s]+([A-Z])",
            ]
            for pattern in patterns:
                match = re.search(pattern, response_text, re.IGNORECASE)
                if match:
                    answer = match.group(1).upper()
                    break
        if not answer:
            answer = "?"  # fallback if not found
    else:
        # Short Answer Question - use the full response as the answer
        answer = response_text

    generation_time = end_time - start_time

    return Response(
        question_id=question.id,
        answer=answer,
        explanation=sampler_response.response_text,
        confidence=1.0,
        time_taken=generation_time,
        tokens_used=0,
        model_name=model_name,
        timestamp=datetime.datetime.now(),
    )


def get_model_response_no_options(
    sampler,
    question,
    model_name,
    exam_identifier,
    show_question=False,
    show_model_query=False,
    show_model_response=False,
):
    """Get model response without showing options - requires Short Answer Question"""
    if show_question:
        print(f"\n{'='*50}")
        print(f"QUESTION (NO OPTIONS): {question.id}")
        print(f"{'='*50}")

        # Show image reference if present
        if hasattr(question, "question_image") and question.question_image:
            print(f"IMAGE: {question.question_image}")

        if hasattr(question, "question_context") and question.question_context:
            print(f"CONTEXT:\n{question.question_context}")

        print(f"\nQUESTION:\n{question.question_text}")
        print(f"\nCORRECT ANSWER: {question.correct_answer}")
        print(f"{'='*50}")

    # Build the prompt text without options
    prompt_text = ""

    # Add text context if present
    if hasattr(question, "question_context") and question.question_context:
        prompt_text += f"{question.question_context}\n\n"

    prompt_text += f"{question.question_text}\n\n"

    # Add instruction for Short Answer Question without options
    prompt_text += (
        "Provide a brief answer (less than 10 words) without seeing the options. "
        "Just give your best response based on the information provided."
    )

    if show_model_query:
        print("\nPROMPT SENT TO MODEL (NO OPTIONS):")
        print("=" * 50)
        print(prompt_text)
        if hasattr(question, "question_image") and question.question_image:
            print(f"\n[Image will be included: {question.question_image}]")
        print("=" * 50)

    # Prepare message content
    content = [{"type": "text", "text": prompt_text}]

    # Add image if present
    if hasattr(question, "question_image") and question.question_image:
        # Construct image path relative to the exam directory
        exam_dir = os.path.join(os.path.dirname(__file__), "exams", exam_identifier)
        image_path = os.path.join(exam_dir, question.question_image)

        # Encode the image
        base64_image = encode_image(image_path)
        if base64_image:
            # Determine image format from file extension
            image_format = question.question_image.split(".")[-1].lower()
            if image_format == "jpg":
                image_format = "jpeg"

            # Use different format for different models
            if model_name.startswith("claude"):
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": f"image/{image_format}",
                            "data": base64_image,
                        },
                    }
                )
            elif model_name.startswith("gemini"):
                content.append(
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": f"image/{image_format}",
                            "data": base64_image,
                        },
                    }
                )
            else:
                content.append(
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/{image_format};base64,{base64_image}",
                            "detail": "high",
                        },
                    }
                )

    message_list = [{"role": "user", "content": content}]

    start_time = time.time()
    sampler_response = sampler(message_list)
    end_time = time.time()

    if show_model_response:
        print("\nMODEL RESPONSE (NO OPTIONS):")
        print("=" * 50)
        print(sampler_response.response_text)
        print("=" * 50)

    # Use the full response as the answer (since no options to match against)
    answer_no_options = sampler_response.response_text.strip()

    generation_time = end_time - start_time

    return answer_no_options, generation_time


def encode_image(image_path):
    """Encode image to base64 for API transmission"""
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except FileNotFoundError:
        print(f"Warning: Image file not found: {image_path}")
        return None
    except Exception as e:
        print(f"Warning: Error encoding image {image_path}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Run AP evaluation for a specific model and exam")
    parser.add_argument(
        "model_name",
        help="Name of the model to evaluate (e.g., gpt-4, claude-3.5-sonnet)",
    )
    parser.add_argument(
        "exam_identifier",
        help="Exam identifier (e.g., AP_US_HISTORY_2017, AP_BIOLOGY_2023)",
    )
    parser.add_argument(
        "--show-question",
        action="store_true",
        help="Show question details (preamble, question, options)",
    )
    parser.add_argument(
        "--show-model-query",
        action="store_true",
        help="Show the prompt sent to the model",
    )
    parser.add_argument(
        "--show-model-response",
        action="store_true",
        help="Show the model's full response text",
    )
    parser.add_argument(
        "--show-all",
        action="store_true",
        help="Show all details (question, prompt, and response)",
    )

    args = parser.parse_args()

    # If --show-all is used, enable all show flags
    if args.show_all:
        args.show_question = True
        args.show_model_query = True
        args.show_model_response = True

    # Check API keys
    if args.model_name.startswith("gpt") or args.model_name.startswith("o"):
        assert os.environ.get("OPENAI_API_KEY"), "Please set OPENAI_API_KEY"
    elif args.model_name.startswith("claude"):
        assert os.environ.get("ANTHROPIC_API_KEY"), "Please set ANTHROPIC_API_KEY"

    print(f"Running AP evaluation for {args.model_name} on {args.exam_identifier}...")

    # Load questions for the specified exam
    questions, question_groups = get_questions_for_exam(args.exam_identifier)

    if not questions:
        print(f"No questions found for exam: {args.exam_identifier}")
        print("Make sure the exam file exists in college_board_eval/exams/ directory")
        sys.exit(1)

    evaluator = APEvaluator(questions)
    sampler, model_provider = get_sampler(args.model_name)

    responses = []
    results = []

    for i, question in enumerate(questions):
        # Show evaluation in progress
        print(f"{question.id} → 🔄 Evaluating...", end="", flush=True)

        # Get regular response with options
        response = get_model_response(
            sampler,
            question,
            args.model_name,
            args.exam_identifier,
            args.show_question,
            args.show_model_query,
            args.show_model_response,
        )

        # Get response without options
        answer_no_options, time_no_options = get_model_response_no_options(
            sampler,
            question,
            args.model_name,
            args.exam_identifier,
            False,
            False,
            False,
        )

        # Add the no-options answer to the response
        response.model_answer_no_options = answer_no_options

        responses.append(response)

        # Evaluate the response immediately
        result = evaluator.evaluate_response(response)
        results.append(result)

        # Update the line with the result
        status = "✅" if result.is_correct else "❌"

        # Determine question type for display with emojis
        if question.question_type == "Short Answer Question":
            question_type = "Short Answer Question 📝"
            # For short answer questions, show score instead of answer
            score_emoji = (
                "✅"
                if result.score >= question.max_points * 0.8
                else "🟡" if result.score >= question.max_points * 0.5 else "🔴"
            )
            print(
                f"\r{question.id} – {question_type} → Score {result.score} | Max {question.max_points} | {score_emoji}"
            )
        else:
            question_type = "Multiple Choice ☑️"
            if hasattr(question, "question_image") and question.question_image:
                question_type = "Multiple Choice 🖼️"
            elif hasattr(question, "question_context") and question.question_context:
                question_type = "Multiple Choice 📃"

            print(
                f"\r{question.id} – {question_type} → "
                f"Answered {result.given_answer} | Expected {result.expected_answer} | {status}"
            )

    # Calculate final statistics
    total_score = sum(r.score for r in results)
    # Calculate total possible points - multiple choice questions are worth 1 point each
    total_possible = 0
    for question in questions:
        if hasattr(question, "max_points"):
            total_possible += question.max_points
        else:
            # Multiple choice questions are worth 1 point each
            total_possible += 1
    num_questions = len(results)
    score_average = total_score / total_possible if total_possible > 0 else 0.0
    time_total_generation = sum(r.time_taken for r in responses)
    time_timestamp = datetime.datetime.now().isoformat()

    print(f"\nResults for \033[1m{args.model_name}\033[0m on \033[1m{args.exam_identifier}\033[0m:")
    print(f"Score:\t\t{int(total_score)}/{total_possible} correct")
    print(f"Average:\t{score_average:.1%}")
    print(f"Total Time:\t{time_total_generation:.2f}s")

    # Save results as JSON file
    results_data = {
        "exam_metadata": {
            "exam_identifier": args.exam_identifier,
            "model_name": args.model_name,
            "model_provider": model_provider,
            "score": int(total_score),
            "total_possible": total_possible,
            "score_average": score_average,
            "time_timestamp": time_timestamp,
            "time_total_generation": time_total_generation,
            "questions_count": num_questions,
        },
        "questions": [],
    }

    # Load original exam data to merge with results
    exam_file_path = os.path.join(
        os.path.dirname(__file__),
        "exams",
        args.exam_identifier,
        f"{args.exam_identifier}.json",
    )
    with open(exam_file_path, "r") as f:
        exam_data = json.load(f)

    # Create a mapping of question IDs to responses
    response_map = {r.question_id: r for r in responses}

    # Merge exam data with responses
    for question in exam_data:
        question_id = question.get("id")
        if question_id in response_map:
            response = response_map[question_id]
            question["Response"] = {
                "model_answer": response.answer,
                "model_answer_no_options": response.model_answer_no_options,
                "explanation": response.explanation,
                "generation_time": response.time_taken,
            }

            # Add metadata fields if they exist
            if "metadata" in question:
                metadata = question["metadata"]
                if "main_practice_skill" in metadata:
                    question["Response"]["main_practice_skill"] = metadata["main_practice_skill"]
                if "learning_objective" in metadata:
                    question["Response"]["learning_objective"] = metadata["learning_objective"]
                if "key_concepts" in metadata:
                    question["Response"]["key_concepts"] = metadata["key_concepts"]

    results_data["questions"] = exam_data

    # Save to file
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_dir, exist_ok=True)
    output_filename = (
        f"{args.exam_identifier}_{model_provider}_{args.model_name}_"
        f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    output_path = os.path.join(results_dir, output_filename)
    with open(output_path, "w") as f:
        json.dump(results_data, f, indent=2)

    print(f"\nResults saved to: {output_path}")


if __name__ == "__main__":
    main()
