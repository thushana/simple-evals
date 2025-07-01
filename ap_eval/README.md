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

# Claude evaluation
python -m ap_eval.run claude-3-opus-20240229 AP_US_HISTORY_2017

# Show all details
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-all
```

### 4. Generate and View Results Dashboard
```bash
# Generate the dashboard from all result files
python ap_eval/results/collator/run.py

# Start a local server to view the dashboard
cd ap_eval/results
python3 -m http.server 8000

# Open your browser to: http://localhost:8000
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

## Results Dashboard

The system includes a results collator that generates an interactive HTML dashboard showing all evaluation results.

### Features
- **Interactive Table**: Sort by any column (test, model, provider, accuracy, score, time)
- **Best Performer Highlighting**: Gold stars and highlighting for the best performing model on each test
- **Detailed JSON View**: Click on any test to view the complete evaluation results
- **Dynamic Loading**: Dashboard loads data from `index.json` for easy updates
- **Responsive Design**: Works on desktop and mobile devices

For detailed collator documentation, see [ap_eval/results/collator/README.md](results/collator/README.md).

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
├── ap_exams/                    # Exam data
│   └── AP_US_HISTORY_2017/      # Individual exam directory
│       └── AP_US_HISTORY_2017.json # Questions for this exam
└── results/                     # Evaluation results
    ├── index.html               # Interactive dashboard
    ├── index.json               # Dashboard data
    ├── collator/                # Results collator
    │   ├── run.py               # Collator script
    │   └── README.md            # Collator documentation
    └── *.json                   # Individual result files
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

## Contributing

### Commit Message Style

Use concise, descriptive commit messages with the following format:

```
CATEGORY - Brief description
```

**Examples:**
- `AP EXAM - Runners and evaluators`
- `TYPES - Fixes types references`
- `PACKAGE - Made a setup package`
- `ENV - Added an example env file`
- `README - Describes tool`

**Categories:**
- `AP EXAM` - AP exam related changes
- `TYPES` - Type definitions and fixes
- `PACKAGE` - Package setup and configuration
- `ENV` - Environment and configuration
- `README` - Documentation updates
- `RUNNER` - Evaluation runner changes
- `LOADER` - Exam loading logic
- `EVALUATOR` - Evaluation logic changes