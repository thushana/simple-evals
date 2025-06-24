from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Dict, Any
from datetime import datetime

class APTest(Enum):
    AP_US_HISTORY = "AP United States History"
    AP_WORLD_HISTORY = "AP World History: Modern"
    AP_ENGLISH_LIT = "AP English Literature & Composition"
    AP_ENGLISH_LANG = "AP English Language & Composition"
    AP_US_GOV = "AP United States Government & Politics"
    AP_PSYCHOLOGY = "AP Psychology"
    AP_CALCULUS_AB = "AP Calculus AB"
    AP_BIOLOGY = "AP Biology"
    AP_HUMAN_GEO = "AP Human Geography"
    AP_STATISTICS = "AP Statistics"

class QuestionType(Enum):
    MULTIPLE_CHOICE = "Multiple Choice"
    SHORT_ANSWER = "Short Answer"
    DBQ = "Document-Based Question"
    LONG_ESSAY = "Long Essay"

@dataclass
class Question:
    id: str
    test: APTest
    question_type: QuestionType
    question_text: str
    correct_answer: str
    explanation: str
    difficulty: float  # 0.0 to 1.0
    skill_domain: str
    year: int

@dataclass
class MultipleChoiceQuestion(Question):
    options: Dict[str, str]  # Dictionary mapping letters (A, B, C, D) to their text
    question_context: Optional[str] = None  # Contextual paragraph or passage before the question
    question_image: Optional[str] = None  # Image file reference for the question
    source: Optional['Source'] = None  # Metadata about the question's source

@dataclass
class ShortAnswerQuestion(Question):
    question_context: Optional[str] = None  # Contextual paragraph or passage before the question
    question_image: Optional[str] = None  # Image file reference for the question
    source: Optional['Source'] = None  # Metadata about the question's source

@dataclass
class Response:
    question_id: str
    answer: str
    explanation: Optional[str] = None
    confidence: float = 1.0  # 0.0 to 1.0
    time_taken: float = 0.0  # in seconds
    tokens_used: int = 0
    model_name: str = "unknown"
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class EvaluationResult:
    question_id: str
    is_correct: bool
    expected_answer: str
    given_answer: str
    explanation: Optional[str] = None
    confidence: float = 1.0
    time_taken: float = 0.0
    tokens_used: int = 0
    model_name: str = "unknown"
    timestamp: datetime = field(default_factory=datetime.now)
    score: float = 1.0

@dataclass
class TestResults:
    test: APTest
    total_score: float
    num_questions: int
    average_score: float
    time_period_stats: Dict[str, Dict[str, float]] = field(default_factory=dict)
    confidence_stats: Dict[str, float] = field(default_factory=dict)
    results: List[EvaluationResult] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

Message = dict[str, Any]  # keys role, content
MessageList = list[Message]



@dataclass
class SamplerResponse:
    """
    Response from a sampler.
    """
    response_text: str
    actual_queried_message_list: MessageList
    response_metadata: dict[str, Any]

class SamplerBase:
    """
    Base class for defining a sampling model, which can be evaluated,
    or used as part of the grading process.
    """

    def __call__(
        self, 
        message_list: MessageList,
    ) -> SamplerResponse:
        raise NotImplementedError


@dataclass
class EvalResult:
    """
    Result of running an evaluation (usually consisting of many samples)
    """

    score: float | None  # top-line metric
    metrics: dict[str, float] | None  # other metrics
    htmls: list[str]  # strings of valid HTML
    convos: list[MessageList]  # sampled conversations
    metadata: dict[str, Any] | None  # Extra data such as rubric scores or sollen


@dataclass
class SingleEvalResult:
    """
    Result of evaluating a single sample
    """

    score: float | None
    metrics: dict[str, float] = field(default_factory=dict)
    html: str | None = None
    convo: MessageList | None = None  # sampled conversation
    example_level_metadata: dict[str, Any] | None = (
        None  # Extra data such as rubric scores or sollen
    )


class Eval:
    """
    Base class for defining an evaluation.
    """

    def __call__(self, sampler: SamplerBase) -> EvalResult:
        raise NotImplementedError


@dataclass
class Source:
    name: str
    url: str
    date: str
    description: str

@dataclass
class QuestionGroup:
    id: str
    preamble: str
    source: Source
    questions: list = field(default_factory=list)

