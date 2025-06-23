# AP Evaluation System

A system for evaluating language models on Advanced Placement exam questions

## Overview

This system allows you to:
- Load AP exam questions from JSON files
- Send questions to various language models (GPT-4, Claude, O1-mini, etc.)
- Evaluate model responses and calculate scores
- View detailed information about questions, prompts, and responses

## Quick Start

### 1. Install the package
```bash
pip install -e .
```

### 2. Set up API keys
```bash
cp .env.example .env
# Edit .env and fill in your API keys
```

### 3. Run evaluation
```bash
# Basic evaluation
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017

# Show all details
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-all
```

## Usage

### Basic Evaluation
```bash
python -m ap_eval.run <model_name> <exam_identifier>
```

**Supported models:**
- `gpt-4` - OpenAI GPT-4
- `gpt-3.5-turbo` - OpenAI GPT-3.5
- `claude-3.5-sonnet` - Anthropic Claude
- `o1-mini` - OpenAI O1-mini

**Supported exam types:**
- `us_history` - AP US History
- `world_history` - AP World History
- `biology` - AP Biology
- `calculus_ab` - AP Calculus AB
- `english_lit` - AP English Literature
- `english_lang` - AP English Language
- `us_gov` - AP US Government
- `psychology` - AP Psychology
- `human_geo` - AP Human Geography
- `statistics` - AP Statistics

**Exam identifiers:**
Use the full exam identifier that matches the directory name:
- `AP_US_HISTORY_2017` - AP US History 2017
- `AP_BIOLOGY_2023` - AP Biology 2023
- `AP_CALCULUS_AB_2022` - AP Calculus AB 2022

### Display Options

#### Show Question Details
```bash
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-question
```
Displays:
- Question ID
- Preamble (any relevant context)
- Question text
- All options (A, B, C, D)
- Correct answer

#### Show Model Prompt
```bash
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-model-query
```
Shows the exact prompt sent to the model.

#### Show Model Response
```bash
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-model-response
```
Shows the model's full response text including reasoning.

#### Show Everything
```bash
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-all
```
Equivalent to using all three flags: `--show-question --show-model-query --show-model-response`

## File Structure

```
ap_eval/
├── README.md                    # This file
├── __init__.py                  # Package initialization
├── ap_types.py                  # Data structures and types
├── evaluator.py                 # Core evaluation logic
├── exam_loader.py               # Exam loading logic
├── run.py                       # Main evaluation script
├── example.py                   # Example usage
├── ap_us_history_questions.py   # Legacy question loading (deprecated)
└── ap_exams/                    # Exam data
    └── AP_US_HISTORY_2017/      # Individual exam directory
        └── AP_US_HISTORY_2017.json # Questions for this exam
```

## Adding New Exams

1. Create a directory in `ap_exams/` with the exam identifier (e.g., `AP_BIOLOGY_2023/`)
2. Add the questions JSON file inside that directory (e.g., `AP_BIOLOGY_2023/AP_BIOLOGY_2023.json`)
3. Follow the same JSON format as existing exams
4. Run evaluation with: `python -m ap_eval.run gpt-4 AP_BIOLOGY_2023`

## Example Output

```
Running AP evaluation for gpt-4 on AP_US_HISTORY_2017...
Using exam: AP_US_HISTORY_2017/AP_US_HISTORY_2017.json
AP_US_HISTORY_2017_001 → Answered A | Expected C | ❌
AP_US_HISTORY_2017_002 → Answered B | Expected B | ✅
AP_US_HISTORY_2017_003 → Answered A | Expected D | ❌

Results for gpt-4 on AP_US_HISTORY_2017:
Score: 1.0/3 correct
Average: 0.33
```