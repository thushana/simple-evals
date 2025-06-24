import sys
import os
import datetime
import argparse
import json
import time
from ap_eval.evaluator import APEvaluator
from ap_eval.ap_types import Response
from ap_eval.exam_loader import get_questions_for_exam

def get_sampler(model_name):
    """Get the appropriate sampler based on model name"""
    if model_name.startswith("gpt"):
        from sampler.chat_completion_sampler import ChatCompletionSampler
        return ChatCompletionSampler(model=model_name), "openai"
    elif model_name.startswith("claude"):
        from sampler.claude_sampler import ClaudeCompletionSampler
        return ClaudeCompletionSampler(model=model_name), "anthropic"
    elif model_name.startswith("o"):
        from sampler.o_chat_completion_sampler import OChatCompletionSampler
        return OChatCompletionSampler(model=model_name), "openai"
    else:
        raise ValueError(f"Unknown model: {model_name}")

def build_prompt(question):
    prompt = f"""
{question.preamble}\n\n{question.question_text}\n\nOptions:\n"""
    for k, v in question.options.items():
        prompt += f"{k}: {v}\n"
    prompt += "\nAnswer with the letter (A, B, C, or D) followed by your reasoning.\nExample: A: (Explain why this option is correct because [keep to 1-2 sentences]...)"
    return prompt

def get_model_response(sampler, question, model_name, show_question=False, show_model_query=False, show_model_response=False):
    if show_question:
        print(f"\n{'='*50}")
        print(f"QUESTION: {question.id}")
        print(f"{'='*50}")
        if question.preamble:
            print(f"PREAMBLE:\n{question.preamble}")
        print(f"\nQUESTION:\n{question.question_text}")
        print(f"\nOPTIONS:")
        for k, v in question.options.items():
            print(f"  {k}: {v}")
        print(f"\nCORRECT ANSWER: {question.correct_answer}")
        print(f"{'='*50}")
    
    prompt = build_prompt(question)
    
    if show_model_query:
        print(f"\nPROMPT SENT TO MODEL:")
        print(f"{'='*50}")
        print(prompt)
        print(f"{'='*50}")
    
    message_list = [
        {"role": "user", "content": prompt}
    ]
    start_time = time.time()
    sampler_response = sampler(message_list)
    end_time = time.time()
    
    if show_model_response:
        print(f"\nMODEL RESPONSE:")
        print(f"{'='*50}")
        print(sampler_response.response_text)
        print(f"{'='*50}")
    
    # Extract answer letter
    answer = ""
    response_text = sampler_response.response_text.strip()
    
    # Look for answer patterns like "A:", "B:", "C:", "D:" at the beginning
    lines = response_text.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith(('A:', 'B:', 'C:', 'D:')):
            answer = line[0]
            break
    
    # If not found at beginning of lines, look for patterns like "Answer: A" or "The answer is B"
    if not answer:
        import re
        patterns = [
            r'answer[:\s]+([ABCD])',
            r'option[:\s]+([ABCD])',
            r'choice[:\s]+([ABCD])',
        ]
        for pattern in patterns:
            match = re.search(pattern, response_text, re.IGNORECASE)
            if match:
                answer = match.group(1)
                break
    
    if not answer:
        answer = "?"  # fallback if not found
    
    generation_time = end_time - start_time
    
    return Response(
        question_id=question.id,
        answer=answer,
        explanation=sampler_response.response_text,
        confidence=1.0,
        time_taken=generation_time,
        tokens_used=0,
        model_name=model_name,
        timestamp=datetime.datetime.now()
    )

def main():
    parser = argparse.ArgumentParser(description='Run AP evaluation for a specific model and exam')
    parser.add_argument('model_name', help='Name of the model to evaluate (e.g., gpt-4, claude-3.5-sonnet)')
    parser.add_argument('exam_identifier', help='Exam identifier (e.g., AP_US_HISTORY_2017, AP_BIOLOGY_2023)')
    parser.add_argument('--show-question', action='store_true', help='Show question details (preamble, question, options)')
    parser.add_argument('--show-model-query', action='store_true', help='Show the prompt sent to the model')
    parser.add_argument('--show-model-response', action='store_true', help='Show the model\'s full response text')
    parser.add_argument('--show-all', action='store_true', help='Show all details (question, prompt, and response)')
    
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
        print("Make sure the exam file exists in ap_eval/ap_exams/ directory")
        sys.exit(1)
    
    evaluator = APEvaluator(questions)
    sampler, model_provider = get_sampler(args.model_name)
    
    responses = []
    results = []
    
    for i, question in enumerate(questions):
        # Show evaluation in progress
        print(f"{question.id} → 🔄 Evaluating...", end='', flush=True)
        
        response = get_model_response(sampler, question, args.model_name, args.show_question, args.show_model_query, args.show_model_response)
        responses.append(response)
        
        # Evaluate the response immediately
        result = evaluator.evaluate_response(response)
        results.append(result)
        
        # Update the line with the result
        status = "✅" if result.is_correct else "❌"
        print(f"\r{question.id} → Answered {result.given_answer} | Expected {result.expected_answer} | {status}")
    
    
    # Calculate final statistics
    total_score = sum(r.score for r in results)
    num_questions = len(results)
    score_average = total_score / num_questions if num_questions > 0 else 0.0
    time_total_generation = sum(r.time_taken for r in responses)
    time_timestamp = datetime.datetime.now().isoformat()

    print(f"\nResults for \033[1m{args.model_name}\033[0m on \033[1m{args.exam_identifier}\033[0m:")
    print(f"Score:\t\t{int(total_score)}/{num_questions} correct")
    print(f"Average:\t{score_average:.1%}")
    print(f"Total Time:\t{time_total_generation:.2f}s")
    
    # Save results as JSON file
    results_data = {
        "exam_metadata": {
            "exam_identifier": args.exam_identifier,
            "model_name": args.model_name,
            "model_provider": model_provider,
            "score": int(total_score),
            "score_average": score_average,
            "time_timestamp": time_timestamp,
            "time_total_generation": time_total_generation,
            "questions_count": num_questions
        },
        "questions": []
    }
    
    # Load original exam data to merge with results
    exam_file_path = os.path.join(os.path.dirname(__file__), "ap_exams", args.exam_identifier, f"{args.exam_identifier}.json")
    with open(exam_file_path, 'r') as f:
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
                "explanation": response.explanation,
                "generation_time": response.time_taken
            }
    
    results_data["questions"] = exam_data
    
    # Save to file
    results_dir = os.path.join(os.path.dirname(__file__), "results")
    os.makedirs(results_dir, exist_ok=True)
    output_filename = f"{args.exam_identifier}_{model_provider}_{args.model_name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_path = os.path.join(results_dir, output_filename)
    with open(output_path, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    print(f"\nResults saved to: {output_path}")

if __name__ == "__main__":
    main() 