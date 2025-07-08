from typing import Dict, Type
from .scorer_base import ScorerBase
from .scorer_multiple_choice import ScorerMultipleChoice
from .scorer_short_answer import ScorerShortAnswer
from .scorer_student_produced_response import ScorerStudentProducedResponse
from .scorer_long_answer import ScorerLongAnswer
from .scorer_free_response import ScorerFreeResponse
from ..ap_types import QuestionType

class ScorerRegistry:
    """
    Registry for mapping question types to their corresponding scorer classes.
    """
    
    def __init__(self):
        self._scorers: Dict[QuestionType, Type[ScorerBase]] = {
            QuestionType.MULTIPLE_CHOICE: ScorerMultipleChoice,
            QuestionType.SHORT_ANSWER_QUESTION: ScorerShortAnswer,
            QuestionType.STUDENT_PRODUCED_RESPONSE: ScorerStudentProducedResponse,
            QuestionType.LONG_ANSWER: ScorerLongAnswer,
            QuestionType.FREE_RESPONSE: ScorerFreeResponse,
        }
        self._scorer_instances: Dict[QuestionType, ScorerBase] = {}
    
    def get_scorer(self, question_type: QuestionType) -> ScorerBase:
        """
        Get a scorer instance for the given question type.
        Creates and caches instances as needed.
        """
        if question_type not in self._scorer_instances:
            if question_type not in self._scorers:
                raise ValueError(f"No scorer registered for question type: {question_type}")
            
            scorer_class = self._scorers[question_type]
            self._scorer_instances[question_type] = scorer_class()
        
        return self._scorer_instances[question_type]
    
    def register_scorer(self, question_type: QuestionType, scorer_class: Type[ScorerBase]) -> None:
        """
        Register a new scorer class for a question type.
        """
        self._scorers[question_type] = scorer_class
        # Clear cached instance if it exists
        if question_type in self._scorer_instances:
            del self._scorer_instances[question_type]
    
    def get_supported_question_types(self) -> list[QuestionType]:
        """
        Get a list of all supported question types.
        """
        return list(self._scorers.keys()) 