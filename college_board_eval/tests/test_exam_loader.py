import json

import pytest

from college_board_eval import exam_loader


def test_get_ap_test_enum_valid():
    assert exam_loader.get_ap_test_enum("us_history").name == "AP_US_HISTORY"
    assert exam_loader.get_ap_test_enum("calculus_bc").name == "AP_CALCULUS_BC"


def test_get_ap_test_enum_invalid():
    with pytest.raises(ValueError):
        exam_loader.get_ap_test_enum("not_a_real_exam")


def test_load_questions_from_json_file_not_found():
    with pytest.raises(FileNotFoundError):
        exam_loader.load_questions_from_json("no_such_file.json", "us_history")


def test_load_questions_from_json_invalid_exam_type(tmp_path):
    # Create a minimal valid JSON file
    file = tmp_path / "q.json"
    file.write_text("[]")
    with pytest.raises(ValueError):
        exam_loader.load_questions_from_json(str(file), "not_a_real_exam")


def test_load_questions_from_json_minimal_mcq(tmp_path):
    # Minimal valid MCQ JSON
    data = [
        {
            "id": "Q1",
            "question": {"type": "MULTIPLE_CHOICE", "question_text": "What is 2+2?", "options": {"A": "3", "B": "4"}},
            "answer": {"correct": "B", "explanation": "2+2=4"},
            "metadata": {
                "difficulty": "easy",
                "domain": "math",
                "source": {"ap_test": "US_HISTORY", "url": "", "year": 2020},
            },
        }
    ]
    file = tmp_path / "q.json"
    file.write_text(json.dumps(data))
    questions = exam_loader.load_questions_from_json(str(file), "us_history")
    assert len(questions) == 1
    assert questions[0].question_text == "What is 2+2?"
    assert questions[0].correct_answer == "B"


def test_load_questions_from_json_minimal_short_answer(tmp_path):
    # Minimal valid Short Answer JSON
    data = [
        {
            "id": "Q2",
            "question": {"type": "SHORT_ANSWER", "question_text": "Explain gravity."},
            "answer": {"exemplar": ["Gravity is..."]},
            "metadata": {
                "difficulty": "medium",
                "domain": "science",
                "source": {"ap_test": "BIOLOGY", "url": "", "year": 2021},
            },
        }
    ]
    file = tmp_path / "q.json"
    file.write_text(json.dumps(data))
    questions = exam_loader.load_questions_from_json(str(file), "biology")
    assert len(questions) == 1
    assert questions[0].question_text == "Explain gravity."
    assert hasattr(questions[0], "max_points")


def test_load_question_groups_from_json(tmp_path):
    # Two questions, same context/source, should be grouped
    data = [
        {
            "id": "Q1",
            "question": {
                "type": "MULTIPLE_CHOICE",
                "question_text": "Q1?",
                "options": {"A": "1", "B": "2"},
                "question_context": "Context",
            },
            "answer": {"correct": "A", "explanation": ""},
            "metadata": {
                "difficulty": "easy",
                "domain": "math",
                "source": {"ap_test": "US_HISTORY", "url": "", "year": 2020},
            },
        },
        {
            "id": "Q2",
            "question": {
                "type": "MULTIPLE_CHOICE",
                "question_text": "Q2?",
                "options": {"A": "3", "B": "4"},
                "question_context": "Context",
            },
            "answer": {"correct": "B", "explanation": ""},
            "metadata": {
                "difficulty": "easy",
                "domain": "math",
                "source": {"ap_test": "US_HISTORY", "url": "", "year": 2020},
            },
        },
    ]
    file = tmp_path / "q.json"
    file.write_text(json.dumps(data))
    groups = exam_loader.load_question_groups_from_json(str(file), "us_history")
    assert len(groups) == 1
    assert len(groups[0].questions) == 2


def test_get_questions_for_exam_missing_exams_dir(tmp_path, monkeypatch):
    # Patch __file__ to a temp dir
    monkeypatch.setattr(exam_loader, "__file__", str(tmp_path / "exam_loader.py"))
    # Remove exams dir if exists
    exams_dir = tmp_path / "exams"
    if exams_dir.exists():
        for f in exams_dir.iterdir():
            f.unlink()
        exams_dir.rmdir()
    questions, groups = exam_loader.get_questions_for_exam("AP_FAKE_2020")
    assert questions == []
    assert groups == []


def test_get_questions_for_exam_missing_exam_file(tmp_path, monkeypatch):
    # Patch __file__ to a temp dir
    monkeypatch.setattr(exam_loader, "__file__", str(tmp_path / "exam_loader.py"))
    exams_dir = tmp_path / "exams"
    exams_dir.mkdir()
    questions, groups = exam_loader.get_questions_for_exam("AP_FAKE_2020")
    assert questions == []
    assert groups == []


def test_get_questions_for_exam_valid(tmp_path, monkeypatch):
    # Patch __file__ to a temp dir
    monkeypatch.setattr(exam_loader, "__file__", str(tmp_path / "exam_loader.py"))
    exams_dir = tmp_path / "exams"
    exam_id = "AP_BIOLOGY_2021"
    exam_dir = exams_dir / exam_id
    exam_dir.mkdir(parents=True)
    data = [
        {
            "id": "Q1",
            "question": {"type": "MULTIPLE_CHOICE", "question_text": "Q1?", "options": {"A": "1", "B": "2"}},
            "answer": {"correct": "A", "explanation": ""},
            "metadata": {
                "difficulty": "easy",
                "domain": "math",
                "source": {"ap_test": "BIOLOGY", "url": "", "year": 2021},
            },
        }
    ]
    json_file = exam_dir / f"{exam_id}.json"
    json_file.write_text(json.dumps(data))
    questions, groups = exam_loader.get_questions_for_exam(exam_id)
    assert len(questions) == 1
    assert len(groups) == 1
