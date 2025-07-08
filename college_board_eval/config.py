import json
import os
from typing import Dict, Any

def get_config() -> Dict[str, Any]:
    """Load configuration from config.json"""
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    with open(config_path, 'r') as f:
        return json.load(f)

def get_scorer_model() -> str:
    """Get the configured scorer model name"""
    config = get_config()
    return config.get("scorer_model", "gpt-4o")

def get_short_answer_question_prompt_template() -> str:
    """Get the Short Answer Question rubric prompt template"""
    config = get_config()
    return config.get("short_answer_question_rubric_prompt", "")

def get_system_level_scoring_guide() -> str:
    """Get the system-level scoring guide for Short Answer Questions"""
    config = get_config()
    return config.get("short_answer_question_rubric_system", "") 

def get_short_answer_question_scorer_provider() -> str:
    config = get_config()
    return config.get("short_answer_question_scorer_provider", "openai")

def get_short_answer_question_scorer_model() -> str:
    config = get_config()
    return config.get("short_answer_question_scorer_model", "gpt-4o")

# New configuration functions for additional question types

def get_long_answer_scorer_model() -> str:
    """Get the configured scorer model name for long answer questions"""
    config = get_config()
    return config.get("long_answer_scorer_model", "gpt-4o")

def get_long_answer_prompt_template() -> str:
    """Get the Long Answer rubric prompt template"""
    config = get_config()
    return config.get("long_answer_rubric_prompt", "")

def get_long_answer_system_scoring_guide() -> str:
    """Get the system-level scoring guide for Long Answer Questions"""
    config = get_config()
    return config.get("long_answer_rubric_system", "")

def get_free_response_scorer_model() -> str:
    """Get the configured scorer model name for free response questions"""
    config = get_config()
    return config.get("free_response_scorer_model", "gpt-4o")

def get_free_response_prompt_template() -> str:
    """Get the Free Response rubric prompt template"""
    config = get_config()
    return config.get("free_response_rubric_prompt", "")

def get_free_response_system_scoring_guide() -> str:
    """Get the system-level scoring guide for Free Response Questions"""
    config = get_config()
    return config.get("free_response_rubric_system", "")

def get_student_produced_response_scorer_model() -> str:
    """Get the configured scorer model name for student produced response questions"""
    config = get_config()
    return config.get("student_produced_response_scorer_model", "numeric_match") 