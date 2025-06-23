import json
import os
from typing import List
from .ap_types import (
    APTest, QuestionType,
    MultipleChoiceQuestion, Source, QuestionGroup
)

def get_ap_test_enum(exam_type: str) -> APTest:
    """Convert exam type string to APTest enum"""
    exam_mapping = {
        'us_history': APTest.AP_US_HISTORY,
        'world_history': APTest.AP_WORLD_HISTORY,
        'english_lit': APTest.AP_ENGLISH_LIT,
        'english_lang': APTest.AP_ENGLISH_LANG,
        'us_gov': APTest.AP_US_GOV,
        'psychology': APTest.AP_PSYCHOLOGY,
        'calculus_ab': APTest.AP_CALCULUS_AB,
        'biology': APTest.AP_BIOLOGY,
        'human_geo': APTest.AP_HUMAN_GEO,
        'statistics': APTest.AP_STATISTICS,
    }
    
    if exam_type not in exam_mapping:
        raise ValueError(f"Unsupported exam type: {exam_type}. Supported types: {list(exam_mapping.keys())}")
    
    return exam_mapping[exam_type]

def load_questions_from_json(json_file_path: str, exam_type: str) -> List[MultipleChoiceQuestion]:
    """Load questions from JSON file and convert to MultipleChoiceQuestion objects"""
    if not os.path.exists(json_file_path):
        raise FileNotFoundError(f"Question file not found: {json_file_path}")
    
    with open(json_file_path, 'r') as f:
        data = json.load(f)
    
    ap_test = get_ap_test_enum(exam_type)
    questions = []
    
    for item in data:
        # Create Source object from metadata
        source = Source(
            name=item["metadata"]["source"]["ap_test"],
            url=item["metadata"]["source"]["url"],
            date=str(item["metadata"]["source"]["year"]),
            description=f"AP {item['metadata']['source']['ap_test']} {item['metadata']['source']['year']} Practice Exam"
        )
        
        # Create MultipleChoiceQuestion
        question = MultipleChoiceQuestion(
            id=item["id"],
            test=ap_test,
            question_type=QuestionType.MULTIPLE_CHOICE,
            question_text=item["question"]["prompt"],
            options=item["question"]["options"],
            correct_answer=item["answer"]["correct"],
            explanation=item["answer"]["explanation"],
            difficulty=item["metadata"]["difficulty"],
            skill_domain=item["metadata"]["domain"],
            year=item["metadata"]["source"]["year"],
            source=source,
            preamble=item["question"]["preamble"]
        )
        questions.append(question)
    
    return questions

def load_question_groups_from_json(json_file_path: str, exam_type: str) -> List[QuestionGroup]:
    """Load questions from JSON and group them by shared preamble and source"""
    questions = load_questions_from_json(json_file_path, exam_type)
    
    # Group questions by preamble and source
    groups = {}
    for question in questions:
        # Create a key based on preamble and source
        key = (question.preamble, question.source.name, question.source.date)
        
        if key not in groups:
            # Create new group
            group = QuestionGroup(
                id=f"GROUP_{len(groups) + 1}",
                preamble=question.preamble,
                source=question.source
            )
            groups[key] = group
        
        # Add question to group
        groups[key].questions.append(question)
        question.group_id = groups[key].id
    
    return list(groups.values())

def get_questions_for_exam(exam_identifier: str) -> tuple[List[MultipleChoiceQuestion], List[QuestionGroup]]:
    """Get questions and question groups for a specific exam identifier"""
    # Look for exam files in ap_exams directory
    ap_exams_dir = os.path.join(os.path.dirname(__file__), "ap_exams")
    
    if not os.path.exists(ap_exams_dir):
        print(f"Warning: ap_exams directory not found at {ap_exams_dir}")
        return [], []
    
    # Look for the exam directory and the JSON file
    exam_dir = os.path.join(ap_exams_dir, exam_identifier)
    json_file_path = os.path.join(exam_dir, f"{exam_identifier}.json")
    
    if not os.path.exists(json_file_path):
        print(f"Warning: Exam file not found: {exam_identifier}/{exam_identifier}.json")
        print(f"Available exams: {[d for d in os.listdir(ap_exams_dir) if os.path.isdir(os.path.join(ap_exams_dir, d))]}")
        return [], []
    
    print(f"Using exam: {exam_identifier}/{exam_identifier}.json")
    
    # Extract exam type from the identifier for the enum mapping
    exam_type = exam_identifier.lower().replace('ap_', '').replace('_2017', '').replace('_2023', '').replace('_2019', '')
    
    try:
        questions = load_questions_from_json(json_file_path, exam_type)
        question_groups = load_question_groups_from_json(json_file_path, exam_type)
        return questions, question_groups
    except FileNotFoundError:
        print(f"Warning: Exam file not found at {json_file_path}")
        return [], []
    except Exception as e:
        print(f"Error loading questions from JSON: {e}")
        return [], [] 