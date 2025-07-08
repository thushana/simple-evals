import datetime
import json

from .ap_types import APTest, Response
from .ap_us_history_questions import SAMPLE_QUESTION_GROUPS, SAMPLE_QUESTIONS
from .evaluator import APEvaluator


def main():
    # Initialize the evaluator with US History questions loaded from JSON
    evaluator = APEvaluator(SAMPLE_QUESTIONS)

    print(f"Loaded {len(SAMPLE_QUESTIONS)} questions from JSON")

    # Print question group information
    print("\nQuestion Groups:")
    for group in SAMPLE_QUESTION_GROUPS:
        print(f"\nGroup ID: {group.id}")
        print(f"Source: {group.source.name}")
        if group.source.url:
            print(f"URL: {group.source.url}")
        if group.source.date:
            print(f"Date: {group.source.date}")
        print(f"Number of questions: {len(group.questions)}")
        print(f"Preamble preview: {group.preamble[:100]}...")

    # Show the structure of questions for evaluation
    print("\nQuestion Structure for Evaluation:")
    for i, question in enumerate(SAMPLE_QUESTIONS[:2]):  # Show first 2 questions
        print(f"\nQuestion {i+1}: {question.id}")
        print(
            f"Preamble: {question.preamble[:100]}..."
            if question.preamble
            else "No preamble"
        )
        print(f"Prompt: {question.question_text}")
        print(f"Options: {question.options}")
        print(f"Correct Answer: {question.correct_answer}")
        print(f"Domain: {question.skill_domain}")
        print(f"Difficulty: {question.difficulty}")

    # Example of how to structure responses for evaluation
    print("\nExample Response Structure:")
    print("To evaluate a model, you would create Response objects like this:")
    print(
        """
    model_responses = [
        Response(
            question_id="AP_US_HISTORY_2017_001",
            answer="C",  # Model's answer
            explanation="Model's reasoning...",
            confidence=0.95,
            time_taken=2.5,
            tokens_used=150,
            model_name="gpt-4",
            timestamp=datetime.datetime.now()
        ),
        # ... more responses
    ]
    
    results = evaluator.evaluate_all(model_responses)
    """
    )

    # Show available questions for evaluation
    print(f"\nAvailable Questions for Evaluation:")
    for question in SAMPLE_QUESTIONS:
        print(f"- {question.id}: {question.question_text[:60]}...")

    print(f"\nTotal questions available: {len(SAMPLE_QUESTIONS)}")
    print("Ready for model evaluation!")


if __name__ == "__main__":
    main()
