# AP Evaluation System

A system for evaluating language models on Advanced Placement exam questions. A fork of OpenAI's Simple-Eval project.

## Overview

This system allows you to:
- Load AP exam questions from JSON files
- Send questions to various language models (GPT-4, Claude, etc.)
- Evaluate model responses and calculate scores
- View detailed information about questions, prompts, and responses
- See a stack ranking of results in an easy to read UI

## Quick Start

### 1. Install and Setup
```bash
make install    # Install the package
make setup      # Set up API keys (.env file)
```

### 2. Run Evaluation
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017
```

### 3. View Results
```bash
make collate    # Generate dashboard
make results    # Start server at http://localhost:8000
```

**Or do everything at once:**
```bash
make evaluate MODEL=gpt-4 EXAM=AP_US_HISTORY_2017
```

## Makefile Commands

For convenience, this project includes a Makefile with common commands. All commands should be run from the `ap_eval` directory:

```bash
make help                    # Show all available commands
make install                 # Install the package in development mode
make setup                   # Set up API keys (copy .env.example to .env)
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017  # Run AP evaluation
make collate                 # Generate dashboard from all result files
make results                 # Start local server to view dashboard
make clean                   # Remove generated result files
make evaluate MODEL=gpt-4 EXAM=AP_US_HISTORY_2017  # Run evaluation + collate + start server
```

## Supported Models

- `gpt-4` - OpenAI GPT-4
- `gpt-3.5-turbo` - OpenAI GPT-3.5
- `claude-3.5-sonnet` - Anthropic Claude
- `o1-mini` - OpenAI O1-mini

## Display Options

Add these flags to see more details during evaluation:

```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-question      # Show question details
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-model-query   # Show prompt sent to model
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-model-response # Show model's full response
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-all           # Show everything
```

## Results Dashboard

The system generates an interactive HTML dashboard showing all evaluation results.

### Features
- **Interactive Table**: Sort by any column (exam, model, provider, accuracy, score, time)
- **Best Performer Highlighting**: Gold stars and highlighting for the best performing model on each exam
- **Detailed JSON View**: Click on any exam to view the complete evaluation results
- **Markdown Documentation**: Click "Project Details README" at the bottom to view this documentation
- **Deep Linking**: Share direct links to specific results using URL hashes
- **Responsive Design**: Works on desktop and mobile devices

## Adding New Exams

1. Create a directory in `ap_exams/` with the exam identifier (e.g., `AP_BIOLOGY_2023/`)
2. Add the questions JSON file inside that directory (e.g., `AP_BIOLOGY_2023/AP_BIOLOGY_2023.json`)
3. Follow the same JSON format as existing exams
4. Run evaluation: `make run MODEL=gpt-4 EXAM=AP_BIOLOGY_2023`

## Question Types

### Multiple Choice Questions
Standard multiple choice questions with A, B, C, D options. Model responses are evaluated for exact answer matching.

### Short Answer Questions
Short answer questions use AI-powered rubric-based scoring for more nuanced evaluation.

#### Scoring System
- **LLM-Powered Scoring**: Uses a consistent scoring model regardless of the response generator
- **Rubric-Based**: Each question includes a detailed rubric with point allocation and exemplar answers
- **Configurable**: Scoring parameters are defined in `config.json` with precedence hierarchy:
  - Question-level overrides → Test-level overrides → System-level defaults
- **Structured Prompts**: Scoring uses carefully crafted prompts to ensure consistent evaluation

#### Configuration
The scoring system is configured via `config.json`:
```json
{
  "short_answer_question_scorer_provider": "openai",
  "short_answer_question_scorer_model": "gpt-4o",
  "short_answer_question_rubric_system": "For a short-answer question, a good response should:\n- accomplish all three tasks set by the question...",
  "short_answer_question_rubric_prompt": "You are an AP Short Answer Question scorer.\n\nQuestion: {question_text}\nRubric: {rubric}\nStudent Response: {response}\n\nUse the general AP scoring criteria and specific rubric above to evaluate this response..."
}
```

## Example Output

```
Running AP evaluation for gpt-4 on AP_US_HISTORY_2017...
AP_US_HISTORY_2017_001 – Multiple Choice 📃 → Answered C | Expected C | ✅
AP_US_HISTORY_2017_002 – Multiple Choice 📃 → Answered B | Expected B | ✅
AP_US_HISTORY_2017_003 – Multiple Choice 📃 → Answered D | Expected D | ✅

Results for gpt-4 on AP_US_HISTORY_2017:
Score:          27/27 correct
Average:        100.0%
Total Time:     62.99s
```

## File Structure

```
ap_eval/
├── README.md                    # This file
├── Makefile                     # Convenience commands
├── __init__.py                  # Package initialization
├── ap_types.py                  # Data structures and types
├── evaluator.py                 # Core evaluation logic
├── exam_loader.py               # Exam loading logic
├── run.py                       # Main evaluation script
├── ap_exams/                    # Exam data
│   └── AP_US_HISTORY_2017/      # Individual exam directory
│       └── AP_US_HISTORY_2017.json # Questions for this exam
└── results/                     # Evaluation results
    ├── index.html               # Interactive dashboard
    ├── index.json               # Dashboard data
    ├── collator/                # Results collator
    └── *.json                   # Individual result files
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