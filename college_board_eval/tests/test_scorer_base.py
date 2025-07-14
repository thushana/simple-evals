from unittest.mock import Mock, mock_open, patch

from college_board_eval.ap_types import EvaluationResult, Question, Response
from college_board_eval.scorer.scorer_base import ScorerBase


class MockScorer(ScorerBase):
    """Mock implementation of ScorerBase for testing"""

    def _get_scorer_model(self) -> str:
        return "gpt-4o-mini"

    def _get_prompt_template(self) -> str:
        return "Score this response: {response}"

    def score_question(self, question: Question, response: Response, test_metadata=None) -> EvaluationResult:
        return EvaluationResult(
            question_id=response.question_id,
            is_correct=True,
            expected_answer="",
            given_answer=response.answer,
            explanation="Test explanation",
            confidence=0.8,
            time_taken=1.0,
            tokens_used=100,
            model_name=response.model_name,
            timestamp=response.timestamp,
            score=5.0,
        )


class TestScorerBase:

    def test_init(self):
        """Test ScorerBase initialization"""
        scorer = MockScorer()
        assert scorer.scorer_model == "gpt-4o-mini"
        assert scorer.prompt_template == "Score this response: {response}"

    def test_get_model_vision_support_vision_models(self):
        """Test vision model detection for known vision models"""
        scorer = MockScorer()

        vision_models = [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-vision-preview",
            "claude-3-5-sonnet-20241022",
            "claude-3-5-haiku-20241022",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-2.0-flash",
        ]

        for model in vision_models:
            assert scorer._get_model_vision_support(model) is True

    def test_get_model_vision_support_vision_keywords(self):
        """Test vision model detection for models with vision keywords"""
        scorer = MockScorer()

        vision_keyword_models = ["gpt-4-vision", "claude-vision", "gemini-multimodal"]

        for model in vision_keyword_models:
            assert scorer._get_model_vision_support(model) is True

    def test_get_model_vision_support_non_vision_models(self):
        """Test vision model detection for non-vision models"""
        scorer = MockScorer()

        non_vision_models = ["gpt-3.5-turbo", "claude-3-haiku", "gemini-1.0-pro"]

        for model in non_vision_models:
            assert scorer._get_model_vision_support(model) is False

    def test_get_scoring_guide_with_precedence_question_level(self):
        """Test scoring guide precedence - question level"""
        scorer = MockScorer()

        # Mock question with question-level rubric
        question = Mock()
        question.short_answer_question_rubric_question = "Question-level rubric"

        result = scorer._get_scoring_guide_with_precedence(question)
        assert result == "Question-level rubric"

    def test_get_scoring_guide_with_precedence_test_level(self):
        """Test scoring guide precedence - test level"""
        scorer = MockScorer()

        # Mock question without question-level rubric
        question = Mock()
        question.short_answer_question_rubric_question = None

        test_metadata = {"short_answer_question_rubric_test": "Test-level rubric"}

        result = scorer._get_scoring_guide_with_precedence(question, test_metadata)
        assert result == "Test-level rubric"

    def test_get_scoring_guide_with_precedence_system_level(self):
        """Test scoring guide precedence - system level"""
        scorer = MockScorer()

        # Mock question without any rubric
        question = Mock()
        question.short_answer_question_rubric_question = None

        result = scorer._get_scoring_guide_with_precedence(question)
        assert result == ""  # Default system level is empty string

    def test_format_rubric_for_prompt_with_rubric(self):
        """Test rubric formatting with valid rubric"""
        scorer = MockScorer()

        rubric = {
            "A": {"criteria": "Excellent answer", "points": 5, "examples": ["Example 1", "Example 2"]},
            "B": {"criteria": "Good answer", "points": 3},
        }

        result = scorer._format_rubric_for_prompt(rubric)

        assert "Part A:" in result
        assert "Criteria: Excellent answer" in result
        assert "Points: 5" in result
        assert "Examples: Example 1, Example 2" in result
        assert "Part B:" in result
        assert "Criteria: Good answer" in result
        assert "Points: 3" in result

    def test_format_rubric_for_prompt_empty_rubric(self):
        """Test rubric formatting with empty rubric"""
        scorer = MockScorer()

        result = scorer._format_rubric_for_prompt({})
        assert result == "No rubric provided"

    def test_format_rubric_for_prompt_none_rubric(self):
        """Test rubric formatting with None rubric"""
        scorer = MockScorer()

        result = scorer._format_rubric_for_prompt(None)
        assert result == "No rubric provided"

    def test_extract_exam_identifier(self):
        """Test exam identifier extraction from question ID"""
        scorer = MockScorer()

        question_id = "AP_US_HISTORY_2017_I_A_001"
        result = scorer._extract_exam_identifier(question_id)
        assert result == "AP_US_HISTORY_2017"

    def test_extract_exam_identifier_short_id(self):
        """Test exam identifier extraction from short question ID"""
        scorer = MockScorer()

        question_id = "AP_BIO_2020_Q1"
        result = scorer._extract_exam_identifier(question_id)
        assert result == "AP_BIO_2020_Q1"  # Only 3 parts, so all parts are used

    @patch("builtins.open", new_callable=mock_open, read_data=b"fake_image_data")
    @patch("pathlib.Path.exists")
    def test_load_image_as_base64_success(self, mock_exists, mock_file):
        """Test successful image loading and base64 encoding"""
        scorer = MockScorer()
        mock_exists.return_value = True

        with patch("base64.b64encode") as mock_b64encode:
            mock_b64encode.return_value = b"encoded_data"

            result = scorer._load_image_as_base64("test.png", "AP_TEST_2020")

            assert result == "encoded_data"
            mock_file.assert_called_once()
            mock_b64encode.assert_called_once_with(b"fake_image_data")

    @patch("pathlib.Path.exists")
    def test_load_image_as_base64_file_not_found(self, mock_exists):
        """Test image loading when file doesn't exist"""
        scorer = MockScorer()
        mock_exists.return_value = False

        result = scorer._load_image_as_base64("nonexistent.png", "AP_TEST_2020")

        assert result is None

    @patch("builtins.open", side_effect=Exception("File read error"))
    @patch("pathlib.Path.exists")
    def test_load_image_as_base64_exception(self, mock_exists, mock_open):
        """Test image loading when exception occurs"""
        scorer = MockScorer()
        mock_exists.return_value = True

        result = scorer._load_image_as_base64("test.png", "AP_TEST_2020")

        assert result is None

    @patch("openai.OpenAI")
    def test_call_openai_model_success(self, mock_openai):
        """Test successful OpenAI model call"""
        scorer = MockScorer()

        # Mock OpenAI response
        mock_client = Mock()
        mock_completion = Mock()
        mock_completion.choices = [Mock()]
        mock_completion.choices[0].message.content = "Score: 4.5/5.0\nExplanation: Good answer"
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client

        score, explanation = scorer._call_openai_model("Test prompt", "gpt-4o")

        assert score == 4.5
        assert "Good answer" in explanation

    @patch("openai.OpenAI")
    def test_call_openai_model_no_score_match(self, mock_openai):
        """Test OpenAI model call when score pattern doesn't match"""
        scorer = MockScorer()

        # Mock OpenAI response without score pattern
        mock_client = Mock()
        mock_completion = Mock()
        mock_completion.choices = [Mock()]
        mock_completion.choices[0].message.content = "This is a good answer"
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client

        score, explanation = scorer._call_openai_model("Test prompt", "gpt-4o")

        assert score == 0.0
        assert explanation == "This is a good answer"

    @patch("openai.OpenAI", side_effect=Exception("API Error"))
    def test_call_openai_model_exception(self, mock_openai):
        """Test OpenAI model call when exception occurs"""
        scorer = MockScorer()

        score, explanation = scorer._call_openai_model("Test prompt", "gpt-4o")

        assert score == 0.0
        assert "OpenAI scoring failed" in explanation

    @patch("openai.OpenAI")
    def test_call_openai_model_with_image_vision_support(self, mock_openai):
        """Test OpenAI model call with image when model supports vision"""
        scorer = MockScorer()

        # Mock OpenAI response
        mock_client = Mock()
        mock_completion = Mock()
        mock_completion.choices = [Mock()]
        mock_completion.choices[0].message.content = "Score: 4.0/5.0\nExplanation: Good with image"
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client

        image_content = {"type": "image_url", "image_url": {"url": "data:image/png;base64,test"}}

        score, explanation = scorer._call_openai_model("Test prompt", "gpt-4o", image_content)

        assert score == 4.0
        # Verify image was included in the call
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]["messages"][0]["content"]
        assert len(messages) == 2  # Text + image
        assert messages[1] == image_content

    @patch("openai.OpenAI")
    def test_call_openai_model_with_image_no_vision_support(self, mock_openai):
        """Test OpenAI model call with image when model doesn't support vision"""
        scorer = MockScorer()

        # Mock OpenAI response
        mock_client = Mock()
        mock_completion = Mock()
        mock_completion.choices = [Mock()]
        mock_completion.choices[0].message.content = "Score: 3.5/5.0\nExplanation: Good without image"
        mock_client.chat.completions.create.return_value = mock_completion
        mock_openai.return_value = mock_client

        image_content = {"type": "image_url", "image_url": {"url": "data:image/png;base64,test"}}

        score, explanation = scorer._call_openai_model("Question: Test prompt", "gpt-3.5-turbo", image_content)

        assert score == 3.5
        # Verify image notice was added to text
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]["messages"][0]["content"]
        assert len(messages) == 1  # Only text
        assert "doesn't support vision" in messages[0]["text"]
