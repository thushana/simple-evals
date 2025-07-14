from datetime import datetime
from unittest.mock import Mock, patch

from scorer.scorer_short_answer import ScorerShortAnswer


class TestScorerShortAnswer:

    def test_get_scorer_model(self):
        """Test getting the configured scorer model"""
        scorer = ScorerShortAnswer()
        model = scorer._get_scorer_model()
        assert isinstance(model, str)
        assert len(model) > 0

    def test_get_prompt_template(self):
        """Test getting the prompt template"""
        scorer = ScorerShortAnswer()
        template = scorer._get_prompt_template()
        assert isinstance(template, str)
        assert len(template) > 0

    def test_get_system_level_scoring_guide(self):
        """Test getting the system-level scoring guide"""
        scorer = ScorerShortAnswer()
        guide = scorer._get_system_level_scoring_guide()
        assert isinstance(guide, str)

    def test_get_scoring_guide_with_precedence_question_level(self):
        """Test scoring guide precedence - question level"""
        scorer = ScorerShortAnswer()

        question = Mock()
        question.short_answer_question_rubric_question = "Question-level rubric"

        result = scorer._get_scoring_guide_with_precedence(question)
        assert result == "Question-level rubric"

    def test_get_scoring_guide_with_precedence_test_level(self):
        """Test scoring guide precedence - test level"""
        scorer = ScorerShortAnswer()

        question = Mock()
        question.short_answer_question_rubric_question = None

        test_metadata = {"short_answer_question_rubric_test": "Test-level rubric"}

        result = scorer._get_scoring_guide_with_precedence(question, test_metadata)
        assert result == "Test-level rubric"

    def test_get_scoring_guide_with_precedence_system_level(self):
        """Test scoring guide precedence - system level"""
        scorer = ScorerShortAnswer()

        question = Mock()
        question.short_answer_question_rubric_question = None

        result = scorer._get_scoring_guide_with_precedence(question)
        # Should return system-level guide (could be empty string)
        assert isinstance(result, str)

    @patch("scorer.scorer_short_answer.get_short_answer_question_scorer_provider")
    @patch("scorer.scorer_short_answer.get_short_answer_question_prompt_template")
    def test_call_scorer_model_openai_provider(self, mock_template, mock_provider):
        """Test calling scorer model with OpenAI provider"""
        scorer = ScorerShortAnswer()

        # Mock config
        mock_template.return_value = (
            "Question: {question_text}\nRubric: {rubric}\nResponse: {response}\nMax Points: {max_points}"
        )
        mock_provider.return_value = "openai"

        # Mock question
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.question_text = "What is the capital of France?"
        question.rubric = {"A": {"criteria": "Correct answer", "points": 5}}
        question.max_points = 5
        question.question_image = None
        question.short_answer_question_rubric_question = None

        # Mock response
        response = Mock()
        response.answer = "Paris"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock OpenAI call
        with patch.object(scorer, "_call_openai_model") as mock_openai:
            mock_openai.return_value = (4.0, "Good answer")

            score, explanation = scorer._call_scorer_model(question, response)

            assert score == 4.0
            assert explanation == "Good answer"
            mock_openai.assert_called_once()

    @patch("scorer.scorer_short_answer.get_short_answer_question_scorer_provider")
    @patch("scorer.scorer_short_answer.get_short_answer_question_prompt_template")
    def test_call_scorer_model_fallback_provider(self, mock_template, mock_provider):
        """Test calling scorer model with fallback provider"""
        scorer = ScorerShortAnswer()

        # Mock config
        mock_template.return_value = (
            "Question: {question_text}\nRubric: {rubric}\nResponse: {response}\nMax Points: {max_points}"
        )
        mock_provider.return_value = "unknown"

        # Mock question
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.question_text = "What is the capital of France?"
        question.rubric = {"A": {"criteria": "Correct answer", "points": 5}}
        question.max_points = 5
        question.question_image = None
        question.short_answer_question_rubric_question = None

        # Mock response
        response = Mock()
        response.answer = "Paris"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        score, explanation = scorer._call_scorer_model(question, response)

        assert score == 2.5  # Placeholder score
        assert "Scored using" in explanation
        assert scorer.scorer_model in explanation

    @patch("scorer.scorer_short_answer.get_short_answer_question_scorer_provider")
    @patch("scorer.scorer_short_answer.get_short_answer_question_prompt_template")
    def test_call_scorer_model_with_image(self, mock_template, mock_provider):
        """Test calling scorer model with image"""
        scorer = ScorerShortAnswer()

        # Mock config
        mock_template.return_value = (
            "Question: {question_text}\nRubric: {rubric}\nResponse: {response}\nMax Points: {max_points}"
        )
        mock_provider.return_value = "openai"

        # Mock question with image
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.question_text = "What is shown in this image?"
        question.rubric = {"A": {"criteria": "Correct answer", "points": 5}}
        question.max_points = 5
        question.question_image = "test_image.png"
        question.short_answer_question_rubric_question = None

        # Mock response
        response = Mock()
        response.answer = "A map of Europe"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock image loading
        with patch.object(scorer, "_load_image_as_base64") as mock_load_image:
            mock_load_image.return_value = "encoded_image_data"

            # Mock OpenAI call
            with patch.object(scorer, "_call_openai_model") as mock_openai:
                mock_openai.return_value = (4.5, "Good answer with image")

                score, explanation = scorer._call_scorer_model(question, response)

                assert score == 4.5
                assert explanation == "Good answer with image"
                mock_load_image.assert_called_once_with("test_image.png", "AP_TEST_2020_Q1")
                mock_openai.assert_called_once()

    @patch("scorer.scorer_short_answer.get_short_answer_question_scorer_provider")
    @patch("scorer.scorer_short_answer.get_short_answer_question_prompt_template")
    def test_call_scorer_model_with_image_load_failure(self, mock_template, mock_provider):
        """Test calling scorer model when image loading fails"""
        scorer = ScorerShortAnswer()

        # Mock config
        mock_template.return_value = (
            "Question: {question_text}\nRubric: {rubric}\nResponse: {response}\nMax Points: {max_points}"
        )
        mock_provider.return_value = "openai"

        # Mock question with image
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.question_text = "What is shown in this image?"
        question.rubric = {"A": {"criteria": "Correct answer", "points": 5}}
        question.max_points = 5
        question.question_image = "test_image.png"
        question.short_answer_question_rubric_question = None

        # Mock response
        response = Mock()
        response.answer = "A map of Europe"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock image loading failure
        with patch.object(scorer, "_load_image_as_base64") as mock_load_image:
            mock_load_image.return_value = None

            # Mock OpenAI call
            with patch.object(scorer, "_call_openai_model") as mock_openai:
                mock_openai.return_value = (3.5, "Good answer without image")

                score, explanation = scorer._call_scorer_model(question, response)

                assert score == 3.5
                assert explanation == "Good answer without image"
                mock_load_image.assert_called_once_with("test_image.png", "AP_TEST_2020_Q1")
                mock_openai.assert_called_once()

    @patch("scorer.scorer_short_answer.get_short_answer_question_scorer_provider")
    @patch("scorer.scorer_short_answer.get_short_answer_question_prompt_template")
    def test_call_scorer_model_with_scoring_guide(self, mock_template, mock_provider):
        """Test calling scorer model with scoring guide"""
        scorer = ScorerShortAnswer()

        # Mock config
        mock_template.return_value = (
            "Question: {question_text}\nRubric: {rubric}\nResponse: {response}\nMax Points: {max_points}"
        )
        mock_provider.return_value = "openai"

        # Mock question with scoring guide
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.question_text = "What is the capital of France?"
        question.rubric = {"A": {"criteria": "Correct answer", "points": 5}}
        question.max_points = 5
        question.question_image = None
        question.short_answer_question_rubric_question = "Use specific examples"

        # Mock response
        response = Mock()
        response.answer = "Paris"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock OpenAI call
        with patch.object(scorer, "_call_openai_model") as mock_openai:
            mock_openai.return_value = (4.0, "Good answer")

            score, explanation = scorer._call_scorer_model(question, response)

            assert score == 4.0
            assert explanation == "Good answer"
            mock_openai.assert_called_once()

    def test_score_question_high_score(self):
        """Test scoring question with high score (correct)"""
        scorer = ScorerShortAnswer()

        # Mock question
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.max_points = 5

        # Mock response
        response = Mock()
        response.question_id = "AP_TEST_2020_Q1"
        response.answer = "Paris"
        response.confidence = 0.9
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock scorer model call
        with patch.object(scorer, "_call_scorer_model") as mock_call:
            mock_call.return_value = (4.5, "Excellent answer")  # 90% of max points

            result = scorer.score_question(question, response)

            assert result.question_id == "AP_TEST_2020_Q1"
            assert result.is_correct is True  # 4.5 >= 5 * 0.8
            assert result.given_answer == "Paris"
            assert result.explanation == "Excellent answer"
            assert result.score == 4.5
            assert result.confidence == 0.9
            assert result.time_taken == 2.0
            assert result.tokens_used == 50
            assert result.model_name == "gpt-4o"

    def test_score_question_low_score(self):
        """Test scoring question with low score (incorrect)"""
        scorer = ScorerShortAnswer()

        # Mock question
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.max_points = 5

        # Mock response
        response = Mock()
        response.question_id = "AP_TEST_2020_Q1"
        response.answer = "London"
        response.confidence = 0.3
        response.time_taken = 1.5
        response.tokens_used = 30
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock scorer model call
        with patch.object(scorer, "_call_scorer_model") as mock_call:
            mock_call.return_value = (2.0, "Incorrect answer")  # 40% of max points

            result = scorer.score_question(question, response)

            assert result.question_id == "AP_TEST_2020_Q1"
            assert result.is_correct is False  # 2.0 < 5 * 0.8
            assert result.given_answer == "London"
            assert result.explanation == "Incorrect answer"
            assert result.score == 2.0
            assert result.confidence == 0.3
            assert result.time_taken == 1.5
            assert result.tokens_used == 30
            assert result.model_name == "gpt-4o"

    def test_score_question_boundary_score(self):
        """Test scoring question with boundary score (80% threshold)"""
        scorer = ScorerShortAnswer()

        # Mock question
        question = Mock()
        question.id = "AP_TEST_2020_Q1"
        question.max_points = 5

        # Mock response
        response = Mock()
        response.question_id = "AP_TEST_2020_Q1"
        response.answer = "Paris"
        response.confidence = 0.8
        response.time_taken = 2.0
        response.tokens_used = 50
        response.model_name = "gpt-4o"
        response.timestamp = datetime.now()

        # Mock scorer model call - exactly 80% (4.0/5.0)
        with patch.object(scorer, "_call_scorer_model") as mock_call:
            mock_call.return_value = (4.0, "Good answer")

            result = scorer.score_question(question, response)

            assert result.is_correct is True  # 4.0 >= 5 * 0.8
            assert result.score == 4.0
