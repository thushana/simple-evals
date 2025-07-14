from datetime import datetime
from unittest.mock import Mock

import pytest

from college_board_eval.ap_types import APTest, EvaluationResult
from college_board_eval.evaluator import APEvaluator


class TestEvaluator:

    def test_init_with_questions(self):
        """Test APEvaluator initialization with questions"""
        # Create mock questions
        question1 = Mock()
        question1.id = "Q1"
        question1.test = APTest.AP_US_HISTORY
        question1.question_type = "multiple_choice"

        question2 = Mock()
        question2.id = "Q2"
        question2.test = APTest.AP_US_HISTORY
        question2.question_type = "short_answer"

        questions = [question1, question2]

        evaluator = APEvaluator(questions)

        assert len(evaluator.questions) == 2
        assert evaluator.questions["Q1"] == question1
        assert evaluator.questions["Q2"] == question2
        assert evaluator.test == APTest.AP_US_HISTORY
        assert evaluator.scorer_registry is not None

    def test_init_without_questions(self):
        """Test APEvaluator initialization without questions"""
        evaluator = APEvaluator([])

        assert len(evaluator.questions) == 0
        assert evaluator.test is None
        assert evaluator.scorer_registry is not None

    def test_evaluate_response_success(self):
        """Test successful response evaluation"""
        # Create mock question
        question = Mock()
        question.id = "Q1"
        question.test = APTest.AP_US_HISTORY
        question.question_type = "multiple_choice"

        # Create mock response
        response = Mock()
        response.question_id = "Q1"
        response.answer = "A"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Create mock evaluation result
        expected_result = EvaluationResult(
            question_id="Q1",
            is_correct=True,
            expected_answer="A",
            given_answer="A",
            explanation="Correct answer",
            confidence=0.9,
            time_taken=2.0,
            tokens_used=50,
            model_name="gpt-4o",
            timestamp=response.timestamp,
            score=5.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.return_value = expected_result

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question])
        evaluator.scorer_registry = mock_registry

        result = evaluator.evaluate_response(response)

        assert result == expected_result
        mock_registry.get_scorer.assert_called_once_with("multiple_choice")
        mock_scorer.score_question.assert_called_once_with(question, response)

    def test_evaluate_response_question_not_found(self):
        """Test response evaluation when question is not found"""
        # Create mock question
        question = Mock()
        question.id = "Q1"
        question.test = APTest.AP_US_HISTORY
        question.question_type = "multiple_choice"

        # Create mock response with non-existent question ID
        response = Mock()
        response.question_id = "NONEXISTENT"

        evaluator = APEvaluator([question])

        with pytest.raises(ValueError, match="Question with ID NONEXISTENT not found"):
            evaluator.evaluate_response(response)

    def test_evaluate_all_success(self):
        """Test successful evaluation of all responses"""
        # Create mock questions
        question1 = Mock()
        question1.id = "Q1"
        question1.test = APTest.AP_US_HISTORY
        question1.question_type = "multiple_choice"
        question1.year = 2017

        question2 = Mock()
        question2.id = "Q2"
        question2.test = APTest.AP_US_HISTORY
        question2.question_type = "short_answer"
        question2.year = 2017

        # Create mock responses
        response1 = Mock()
        response1.question_id = "Q1"
        response1.answer = "A"
        response1.confidence = 0.9
        response1.time_taken = 2.0
        response1.tokens_used = 50
        response1.model_name = "gpt-4o"
        response1.timestamp = datetime.now()

        response2 = Mock()
        response2.question_id = "Q2"
        response2.answer = "Paris"
        response2.confidence = 0.7
        response2.time_taken = 3.0
        response2.tokens_used = 100
        response2.model_name = "gpt-4o"
        response2.timestamp = datetime.now()

        # Create mock evaluation results
        result1 = EvaluationResult(
            question_id="Q1",
            is_correct=True,
            expected_answer="A",
            given_answer="A",
            explanation="Correct answer",
            confidence=0.9,
            time_taken=2.0,
            tokens_used=50,
            model_name="gpt-4o",
            timestamp=response1.timestamp,
            score=5.0,
        )

        result2 = EvaluationResult(
            question_id="Q2",
            is_correct=False,
            expected_answer="",
            given_answer="Paris",
            explanation="Incorrect answer",
            confidence=0.7,
            time_taken=3.0,
            tokens_used=100,
            model_name="gpt-4o",
            timestamp=response2.timestamp,
            score=2.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.side_effect = [result1, result2]

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question1, question2])
        evaluator.scorer_registry = mock_registry

        results = evaluator.evaluate_all([response1, response2])

        # Verify TestResults
        assert results.test == APTest.AP_US_HISTORY
        assert results.total_score == 7.0  # 5.0 + 2.0
        assert results.num_questions == 2
        assert results.average_score == 3.5  # 7.0 / 2
        assert len(results.results) == 2
        assert results.results[0] == result1
        assert results.results[1] == result2

        # Verify time period stats
        assert "2017" in results.time_period_stats
        assert results.time_period_stats["2017"]["total"] == 2
        assert results.time_period_stats["2017"]["correct"] == 1

        # Verify confidence stats
        assert results.confidence_stats["correct_avg"] == 0.9
        assert results.confidence_stats["incorrect_avg"] == 0.7

        # Verify timestamp
        assert isinstance(results.timestamp, datetime)

    def test_evaluate_all_empty_responses(self):
        """Test evaluation of empty response list"""
        evaluator = APEvaluator([])

        results = evaluator.evaluate_all([])

        assert results.total_score == 0.0
        assert results.num_questions == 0
        assert results.average_score == 0.0
        assert len(results.results) == 0
        assert len(results.time_period_stats) == 0
        assert results.confidence_stats["correct_avg"] == 0.0
        assert results.confidence_stats["incorrect_avg"] == 0.0

    def test_evaluate_all_no_correct_responses(self):
        """Test evaluation when no responses are correct"""
        # Create mock question
        question = Mock()
        question.id = "Q1"
        question.test = APTest.AP_US_HISTORY
        question.question_type = "multiple_choice"
        question.year = 2017

        # Create mock response
        response = Mock()
        response.question_id = "Q1"
        response.answer = "B"
        response.confidence = 0.3
        response.time_taken = 1.5
        response.tokens_used = 30
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Create mock evaluation result (incorrect)
        result = EvaluationResult(
            question_id="Q1",
            is_correct=False,
            expected_answer="A",
            given_answer="B",
            explanation="Incorrect answer",
            confidence=0.3,
            time_taken=1.5,
            tokens_used=30,
            model_name="gpt-4o",
            timestamp=response.timestamp,
            score=0.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.return_value = result

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question])
        evaluator.scorer_registry = mock_registry

        results = evaluator.evaluate_all([response])

        # Verify confidence stats for no correct responses
        assert results.confidence_stats["correct_avg"] == 0.0
        assert results.confidence_stats["incorrect_avg"] == 0.3

        # Verify time period stats
        assert results.time_period_stats["2017"]["total"] == 1
        assert results.time_period_stats["2017"]["correct"] == 0

    def test_evaluate_all_no_incorrect_responses(self):
        """Test evaluation when all responses are correct"""
        # Create mock question
        question = Mock()
        question.id = "Q1"
        question.test = APTest.AP_US_HISTORY
        question.question_type = "multiple_choice"
        question.year = 2017

        # Create mock response
        response = Mock()
        response.question_id = "Q1"
        response.answer = "A"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Create mock evaluation result (correct)
        result = EvaluationResult(
            question_id="Q1",
            is_correct=True,
            expected_answer="A",
            given_answer="A",
            explanation="Correct answer",
            confidence=0.9,
            time_taken=2.0,
            tokens_used=50,
            model_name="gpt-4o",
            timestamp=response.timestamp,
            score=5.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.return_value = result

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question])
        evaluator.scorer_registry = mock_registry

        results = evaluator.evaluate_all([response])

        # Verify confidence stats for no incorrect responses
        assert results.confidence_stats["correct_avg"] == 0.9
        assert results.confidence_stats["incorrect_avg"] == 0.0

        # Verify time period stats
        assert results.time_period_stats["2017"]["total"] == 1
        assert results.time_period_stats["2017"]["correct"] == 1

    def test_evaluate_all_fallback_test(self):
        """Test evaluation when test is None and fallback is used"""
        # Create mock question without test
        question = Mock()
        question.id = "Q1"
        question.test = None
        question.question_type = "multiple_choice"
        question.year = 2017

        # Create mock response
        response = Mock()
        response.question_id = "Q1"
        response.answer = "A"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Create mock evaluation result
        result = EvaluationResult(
            question_id="Q1",
            is_correct=True,
            expected_answer="A",
            given_answer="A",
            explanation="Correct answer",
            confidence=0.9,
            time_taken=2.0,
            tokens_used=50,
            model_name="gpt-4o",
            timestamp=response.timestamp,
            score=5.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.return_value = result

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question])
        evaluator.scorer_registry = mock_registry

        results = evaluator.evaluate_all([response])

        # Should use fallback test (AP_US_HISTORY) when no questions have a test
        assert results.test == APTest.AP_US_HISTORY

    def test_evaluate_all_multiple_time_periods(self):
        """Test evaluation with questions from different time periods"""
        # Create mock questions from different years
        question1 = Mock()
        question1.id = "Q1"
        question1.test = APTest.AP_US_HISTORY
        question1.question_type = "multiple_choice"
        question1.year = 2017

        question2 = Mock()
        question2.id = "Q2"
        question2.test = APTest.AP_US_HISTORY
        question2.question_type = "multiple_choice"
        question2.year = 2018

        # Create mock responses
        response1 = Mock()
        response1.question_id = "Q1"
        response1.answer = "A"
        response1.confidence = 0.9
        response1.time_taken = 2.0
        response1.tokens_used = 50
        response1.model_name = "gpt-4o"
        response1.timestamp = datetime.now()

        response2 = Mock()
        response2.question_id = "Q2"
        response2.answer = "B"
        response2.confidence = 0.7
        response2.time_taken = 2.5
        response2.tokens_used = 60
        response2.model_name = "gpt-4o"
        response2.timestamp = datetime.now()

        # Create mock evaluation results
        result1 = EvaluationResult(
            question_id="Q1",
            is_correct=True,
            expected_answer="A",
            given_answer="A",
            explanation="Correct answer",
            confidence=0.9,
            time_taken=2.0,
            tokens_used=50,
            model_name="gpt-4o",
            timestamp=response1.timestamp,
            score=5.0,
        )

        result2 = EvaluationResult(
            question_id="Q2",
            is_correct=False,
            expected_answer="A",
            given_answer="B",
            explanation="Incorrect answer",
            confidence=0.7,
            time_taken=2.5,
            tokens_used=60,
            model_name="gpt-4o",
            timestamp=response2.timestamp,
            score=0.0,
        )

        # Mock scorer
        mock_scorer = Mock()
        mock_scorer.score_question.side_effect = [result1, result2]

        # Mock scorer registry
        mock_registry = Mock()
        mock_registry.get_scorer.return_value = mock_scorer

        evaluator = APEvaluator([question1, question2])
        evaluator.scorer_registry = mock_registry

        results = evaluator.evaluate_all([response1, response2])

        # Verify time period stats for multiple periods
        assert "2017" in results.time_period_stats
        assert "2018" in results.time_period_stats
        assert results.time_period_stats["2017"]["total"] == 1
        assert results.time_period_stats["2017"]["correct"] == 1
        assert results.time_period_stats["2018"]["total"] == 1
        assert results.time_period_stats["2018"]["correct"] == 0
