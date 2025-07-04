from typing import List
from .ap_types import Question, Response, EvaluationResult, TestResults, APTest
from datetime import datetime
from collections import defaultdict

class APEvaluator:
    def __init__(self, questions: List[Question]):
        self.questions = {q.id: q for q in questions}
        self.test = questions[0].test if questions else None

    def evaluate_response(self, response: Response) -> EvaluationResult:
        question = self.questions.get(response.question_id)
        if not question:
            raise ValueError(f"Question with ID {response.question_id} not found")

        is_correct = response.answer == question.correct_answer
        score = 1.0 if is_correct else 0.0

        return EvaluationResult(
            question_id=response.question_id,
            is_correct=is_correct,
            expected_answer=question.correct_answer,
            given_answer=response.answer,
            explanation=response.explanation,
            confidence=response.confidence,
            time_taken=response.time_taken,
            tokens_used=response.tokens_used,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=score
        )

    def evaluate_all(self, responses: List[Response]) -> TestResults:
        results = [self.evaluate_response(r) for r in responses]
        
        # Calculate total score and number of questions
        total_score = sum(r.score for r in results)
        num_questions = len(results)
        average_score = total_score / num_questions if num_questions > 0 else 0.0

        # Calculate time period statistics
        time_period_stats = defaultdict(lambda: {"correct": 0, "total": 0})
        for r in results:
            question = self.questions[r.question_id]
            period = str(question.year)  # Using year as the time period
            time_period_stats[period]["total"] += 1
            if r.is_correct:
                time_period_stats[period]["correct"] += 1

        # Calculate confidence statistics
        correct_confidences = [r.confidence for r in results if r.is_correct]
        incorrect_confidences = [r.confidence for r in results if not r.is_correct]
        
        confidence_stats = {
            "correct_avg": sum(correct_confidences) / len(correct_confidences) if correct_confidences else 0.0,
            "incorrect_avg": sum(incorrect_confidences) / len(incorrect_confidences) if incorrect_confidences else 0.0
        }

        return TestResults(
            test=self.test,
            total_score=total_score,
            num_questions=num_questions,
            average_score=average_score,
            time_period_stats=dict(time_period_stats),
            confidence_stats=confidence_stats,
            results=results,
            timestamp=datetime.now()
        ) 