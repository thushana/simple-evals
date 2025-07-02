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
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017

# Claude evaluation
make run MODEL=claude-3-opus-20240229 EXAM=AP_US_HISTORY_2017

# Show all details
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-all
```

### 4. Generate and View Results Dashboard
```bash
# Generate the dashboard from all result files
make collate

# Start a local server to view the dashboard
make results

# Open your browser to: http://localhost:8000
```

**Alternative: Use the convenience command to do everything at once:**
```bash
make evaluate MODEL=gpt-4 EXAM=AP_US_HISTORY_2017
```

## Makefile Commands

For convenience, this project includes a Makefile with common commands:

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

## Usage

### Basic Evaluation
```bash
make run MODEL=<model_name> EXAM=<exam_identifier>
```

**Supported models:**
- `gpt-4` - OpenAI GPT-4
- `gpt-3.5-turbo` - OpenAI GPT-3.5
- `claude-3.5-sonnet` - Anthropic Claude
- `o1-mini` - OpenAI O1-mini

**Direct python command (alternative):**
```bash
python -m ap_eval.run <model_name> <exam_identifier>
```

### Display Options

#### Show Question Details
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-question
```
Displays:
- Question ID
- Preamble (any relevant context)
- Question text
- All options (A, B, C, D)
- Correct answer

#### Show Model Prompt
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-model-query
```
Shows the exact prompt sent to the model.

#### Show Model Response
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-model-response
```
Shows the model's full response text including reasoning.

#### Show Everything
```bash
make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017 -- --show-all
```
Equivalent to using all three flags: `--show-question --show-model-query --show-model-response`

**Direct python commands (alternatives):**
```bash
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-question
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-model-query
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-model-response
python -m ap_eval.run gpt-4 AP_US_HISTORY_2017 --show-all
```

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
4. Run evaluation with: `make run MODEL=gpt-4 EXAM=AP_BIOLOGY_2023`

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


# Collator

The Collator is a script that gathers the results of AP exam evaluations and packages it up in an easy to view UI.

## Overview

## Results Structure

Each exam run result file contains:
- Model responses to exam questions
- Accuracy scores and timing information
- Detailed evaluation metrics
- Question-by-question breakdown

## File Naming Convention

Results are named using the pattern:
```
{EXAM}_{PROVIDER}_{MODEL}_{TIMESTAMP}.json
```

For example:
- `AP_US_HISTORY_2017_openai_gpt-4o-mini_20250630_091909.json`
- `AP_BIOLOGY_2008_openai_gpt-4o_20250701_151534.json`

## Performance Metrics

The evaluation tracks several key metrics:

| Metric | Description |
|--------|-------------|
| Accuracy | Percentage of correct answers |
| Score | Raw score (correct/total questions) |
| Time | Total evaluation time in seconds |
| Provider | Model provider (OpenAI, Anthropic, etc.) |

## Best Performers

⭐ **Best performing models** are highlighted in the dashboard with gold backgrounds and star indicators.

## Usage

1. **Start a local server** to avoid CORS issues:
   ```bash
   cd ap_eval/results
   python3 -m http.server 8000
   ```
2. **Open your browser** and visit `http://localhost:8000`
3. Click on any exam name to view detailed results
4. Sort by different columns to analyze performance
5. Download individual result files for further analysis
6. Click the **"About"** link at the bottom to view this documentation

**Note**: A local server is required because the dashboard loads JSON files via fetch requests, which are blocked by CORS policies when opening HTML files directly in the browser.

## Viewer Features

### 📊 **Interactive Dashboard**
- Sortable table with all evaluation results
- Best performer highlighting with gold backgrounds
- Responsive design for desktop and mobile

### 📄 **File Viewer**
- **JSON Results**: Syntax-highlighted JSON with VSCode-style formatting
- **Markdown Files**: Fully rendered Markdown with beautiful styling
- **Download Links**: Click file paths to download files directly
- **Deep Linking**: Share direct links to specific files using URL hashes

### 🔗 **Deep Linking**
Use URL hashes to directly open specific files:
- `#result=README` - Opens this documentation
- `#result=AP_US_HISTORY_2017` - Opens the best US History result
- `#result=AP_BIOLOGY_2008` - Opens the best Biology result

## Technical Details

- **Results Storage**: JSON format for easy parsing and analysis
- **Client-side Processing**: Dashboard runs entirely in the browser (requires local server for CORS)
- **CDN Libraries**: Uses Bootstrap, Font Awesome, and Marked.js from CDN
- **File Types Supported**: JSON (evaluation results) and Markdown (documentation)
- **Sorting**: Client-side sorting with visual indicators
- **Download**: Direct file downloads with proper MIME types
- **Server Requirement**: Local HTTP server needed to avoid CORS restrictions