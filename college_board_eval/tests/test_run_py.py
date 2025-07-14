import sys

import pytest

import college_board_eval.run as run_py


def test_run_py_import_and_main(monkeypatch):
    # Mock sys.argv to provide required arguments
    monkeypatch.setattr(sys, "argv", ["run.py", "gpt-4", "AP_US_HISTORY_2017"])
    # Mock environment variable for API key
    monkeypatch.setenv("OPENAI_API_KEY", "fake-key")
    # Patch get_questions_for_exam to return empty (to avoid file IO)
    monkeypatch.setattr(run_py, "get_questions_for_exam", lambda exam_id: ([], []))
    # Patch sys.exit to raise SystemExit
    monkeypatch.setattr(sys, "exit", lambda code=0: (_ for _ in ()).throw(SystemExit(code)))
    # Should exit with code 1 due to no questions found
    with pytest.raises(SystemExit) as excinfo:
        run_py.main()
    assert excinfo.value.code == 1
