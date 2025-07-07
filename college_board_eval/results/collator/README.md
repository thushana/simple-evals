# AP Evaluation Results Collator

The Results Collator automatically reads all AP evaluation result JSON files and generates an interactive HTML dashboard showing performance metrics across all models and exams.

## Features

- **Automatic Data Loading**: Reads all JSON result files from `college_board_eval/results/`
- **Interactive Dashboard**: Sortable table with all evaluation results
- **Combined Statistics**: Overall accuracy, total questions, time metrics
- **Visual Indicators**: Color-coded accuracy levels (green/yellow/red)
- **Responsive Design**: Works on desktop and mobile devices
- **CDN Libraries**: Uses Bootstrap and Font Awesome from CDN (no local dependencies)

## Usage

### Basic Usage
```bash
python college_board_eval/results/collator/run.py
```

### With Custom Options
```bash
# Custom results directory
python college_board_eval/results/collator/run.py --results-dir /path/to/results

# Custom output location
python college_board_eval/results/collator/run.py --output /path/to/dashboard.html

# Both custom directory and output
python college_board_eval/results/collator/run.py --results-dir /path/to/results --output /path/to/dashboard.html
```

### Viewing the Dashboard
```bash
# Start a local server (recommended)
cd college_board_eval/results
python3 -m http.server 8000
# Then visit: http://localhost:8000

# Or open directly in browser (may have CORS issues)
open college_board_eval/results/index.html
```

## Dashboard Features

### Summary Cards
- **Total Exams**: Number of evaluation runs
- **Total Questions**: Combined questions across all exams
- **Total Correct**: Combined correct answers
- **Overall Accuracy**: Weighted average accuracy
- **Total Time**: Combined evaluation time
- **Q/min Avg**: Average questions per minute

### Sortable Table Columns
- **Exam**: Exam identifier (AP_US_HISTORY_2017, AP_BIOLOGY_2008, etc.)
- **Model**: Model name (gpt-4, claude-3-5-sonnet, etc.)
- **Provider**: Model provider (openai, anthropic, etc.)
- **Accuracy**: Percentage correct (color-coded)
- **Score**: Correct/Total format
- **Questions**: Number of questions in exam
- **Time (s)**: Evaluation time in seconds
- **Q/min**: Questions per minute
- **Date**: When evaluation was run

### Sorting
- Click any column header to sort
- Accuracy, Score, Questions, Time, and Q/min sort by value (descending)
- Text columns sort alphabetically (ascending)
- Default sort is by Accuracy (highest first)

## Output

The collator generates:
- `dashboard.html`: Interactive HTML dashboard
- Console summary with key statistics

## Requirements

- Python 3.6+
- Internet connection (for CDN libraries)
- JSON result files in the results directory

## File Structure

```
college_board_eval/results/collator/
├── run.py                # Main collator script
└── README.md             # This file
```

## Output

The collator generates:
- `college_board_eval/results/index.html`: Interactive HTML dashboard
- `college_board_eval/results/index.json`: Dashboard data (used by the HTML)
- Console summary with key statistics 