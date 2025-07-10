# College Board LLM Evaluation System

A system for evaluating language models on SAT and Advanced Placement exam questions. A fork of OpenAI's Simple-Eval project.

## Overview

This system allows you to:
- Load College Board exam questions from JSON files
- Send questions to various language models (GPT-4, Claude, etc.)
- Evaluate model responses and calculate scores
- View detailed information about questions, prompts, and responses
- See a stack ranking of results in an easy to read UI

## Quick Start

### 1. Install and Setup
```bash
make install        # Install the package
make install-dev    # Install development dependencies (optional but recommended)
make setup          # Set up API keys (.env file)
```

### 2. Development Setup (Optional)
For the best development experience, set up pre-commit hooks:
```bash
make setup-pre-commit  # Automatically format code on commit
```

### 2. Run Evaluation
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017
```

### 3. View Results
```bash
make collate    # Generate dashboard
make web        # Start both backend and frontend development servers
```

**Or do everything at once:**
```bash
make evaluate MODEL=gpt-4 EXAM=AP_US_HISTORY_2017
```

## Makefile Commands

For convenience, this project includes a Makefile with common commands. All commands should be run from the `college_board_eval` directory:

### Core Commands
```bash
make help                    # Show all available commands
make install                 # Install the package in development mode
make install-dev             # Install development dependencies (black, isort, flake8, mypy)
make setup                   # Set up API keys (copy .env.example to .env)
make setup-pre-commit        # Set up pre-commit hooks for automatic formatting
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017  # Run evaluation
make collate                 # Generate dashboard from all result files
make web                     # Start React frontend development server
make clean                   # Remove generated result files
make evaluate MODEL=gpt-4 EXAM=AP_US_HISTORY_2017  # Run evaluation + collate + start server
```

### Code Quality Commands
```bash
make format                  # Format code with black and isort
make lint                    # Run flake8 linting
make typecheck               # Run mypy type checking
make check                   # Run all code quality checks (format + lint + typecheck)
make fix                     # Auto-fix formatting issues
```

### Frontend Commands
```bash
make lint-frontend           # Run ESLint on frontend
make typecheck-frontend      # Run TypeScript type checking on frontend
make format-frontend         # Run Prettier on frontend for consistent code style
```

### Development Workflow
For the best development experience, run these commands in sequence:
```bash
make format                  # Format code first
make lint                    # Check for style issues
make typecheck               # Verify type safety
```

Or use the convenience command:
```bash
make check                   # Run all quality checks at once
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

The system generates a modern, interactive dashboard for exploring evaluation results.

### Features
- **Modern React Frontend**: Built with React, TypeScript, and Material-UI for a fast, responsive, and accessible UI
- **Deep Linking**: URLs like `/dashboard/:examSlug` and `/dashboard/:examSlug/:questionId` for direct navigation to any exam or question
- **Interactive Table**: Sort by any column (exam, model, provider, accuracy, score, time)
- **Best Performer Highlighting**: Gold stars and highlighting for the best performing model on each exam
- **Detailed JSON View**: Click on any exam to view the complete evaluation results, with pretty-printed and color-coded JSON
- **Download & Metadata**: Download individual result files and view run metadata
- **Responsive Design**: Works on desktop and mobile devices

### Frontend Development

The dashboard frontend lives in `web/frontend/` and uses Vite for fast development. It communicates with the FastAPI backend for data access.

To develop or run the frontend:
```bash
cd web/frontend
npm install
npm run dev         # Start dev server (default: http://localhost:1600)
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type checking
npm run format      # Run Prettier
```

**Note:** The frontend requires the backend to be running for data access. Use `make web` to start both servers simultaneously.

## Adding New Exams

1. Create a directory in `exams/` with the exam identifier (e.g., `AP_BIOLOGY_2023/`)
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
college_board_eval/
├── README.md                    # This file
├── Makefile                     # Convenience commands
├── __init__.py                  # Package initialization
├── ap_types.py                  # Data structures and types
├── evaluator.py                 # Core evaluation logic
├── exam_loader.py               # Exam loading logic
├── run.py                       # Main evaluation script
├── exams/                       # Exam data
│   ├── exam-types.json          # Exam types configuration
│   └── AP_US_HISTORY_2017/      # Individual exam directory
│       └── AP_US_HISTORY_2017.json # Questions for this exam
├── results/                     # Evaluation results
│   ├── index.json               # Dashboard data
│   ├── collator/                # Results collator
│   └── *.json                   # Individual result files
└── web/                         # Web application
    ├── backend/                 # FastAPI backend
    │   ├── main.py              # API endpoints
    │   └── image_processor.py   # Image processing
    └── frontend/                # React frontend
        ├── source/              # Source code
        └── package.json         # Frontend dependencies
```

## Code Quality Standards

This project maintains high code quality standards using automated tools:

### Python Version
- **Target**: Python 3.10+
- **Type System**: Full type annotations with mypy strict checking
- **Formatting**: Black with 120 character line length
- **Import Sorting**: isort for consistent import organization
- **Linting**: flake8 for style and error detection

### Type Safety
- All functions and methods have type annotations
- Uses mypy for static type checking with strict settings
- Generic types properly implemented for scorer classes
- Dataclasses with proper field ordering and defaults

### Code Style
- 120 character line length limit
- Consistent import organization
- No unused imports or variables
- Proper f-string usage (no f-strings without placeholders)

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