import sys
import os
import datetime
import argparse
from ap_eval.evaluator import APEvaluator
from ap_eval.ap_types import Response
from ap_eval.exam_loader import get_questions_for_exam

def get_sampler(model_name):
    """Get the appropriate sampler based on model name"""
    if model_name.startswith("gpt"):
        from sampler.chat_completion_sampler import ChatCompletionSampler
        return ChatCompletionSampler(model=model_name)
    elif model_name.startswith("claude"):
        from sampler.claude_sampler import ClaudeCompletionSampler
        return ClaudeCompletionSampler(model=model_name)
    elif model_name.startswith("o"):
        from sampler.o_chat_completion_sampler import OChatCompletionSampler
        return OChatCompletionSampler(model=model_name)
    else:
        raise ValueError(f"Unknown model: {model_name}")

def build_prompt(question):
    prompt = f"""
{question.preamble}\n\n{question.question_text}\n\nOptions:\n"""
    for k, v in question.options.items():
        prompt += f"{k}: {v}\n"
    prompt += "\nPlease answer with the correct option letter (A, B, C, or D) and provide a brief explanation."
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
    sampler_response = sampler(message_list)
    
    if show_model_response:
        print(f"\nMODEL RESPONSE:")
        print(f"{'='*50}")
        print(sampler_response.response_text)
        print(f"{'='*50}")
    
    # Extract answer letter
    answer = ""
    for letter in question.options.keys():
        if letter in sampler_response.response_text:
            answer = letter
            break
    if not answer:
        answer = "?"  # fallback if not found
    
    return Response(
        question_id=question.id,
        answer=answer,
        explanation=sampler_response.response_text,
        confidence=1.0,
        time_taken=0.0,
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
    sampler = get_sampler(args.model_name)
    
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
    average_score = total_score / num_questions if num_questions > 0 else 0.0
    
    print(f"\nResults for {args.model_name} on {args.exam_identifier}:")
    print(f"Score: {total_score}/{num_questions} correct")
    print(f"Average: {average_score:.2f}")

if __name__ == "__main__":
    main() 