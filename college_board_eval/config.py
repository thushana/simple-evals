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