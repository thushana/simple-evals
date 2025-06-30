#!/usr/bin/env python3
"""
Results Collator for AP Evaluations
Reads all result JSON files and generates an HTML dashboard with performance metrics.
"""

import json
import os
import glob
from datetime import datetime
from typing import Dict, List, Any
import argparse

class ResultsCollator:
    def __init__(self, results_dir: str = "ap_eval/results"):
        self.results_dir = results_dir
        self.results_data = []
        
    def load_all_results(self) -> List[Dict[str, Any]]:
        """Load all JSON result files from the results directory"""
        json_files = glob.glob(os.path.join(self.results_dir, "*.json"))
        
        for json_file in json_files:
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    
                # Extract key metrics
                exam_meta = data.get("exam_metadata", {})
                
                result_summary = {
                    "filename": os.path.basename(json_file),
                    "exam_identifier": exam_meta.get("exam_identifier", "Unknown"),
                    "model_name": exam_meta.get("model_name", "Unknown"),
                    "model_provider": exam_meta.get("model_provider", "Unknown"),
                    "score": exam_meta.get("score", 0),
                    "score_average": exam_meta.get("score_average", 0.0),
                    "questions_count": exam_meta.get("questions_count", 0),
                    "time_total_generation": exam_meta.get("time_total_generation", 0.0),
                    "time_timestamp": exam_meta.get("time_timestamp", ""),
                    "accuracy_percentage": round(exam_meta.get("score_average", 0.0) * 100, 1),
                    "questions_per_minute": round(exam_meta.get("questions_count", 1) / (exam_meta.get("time_total_generation", 1) / 60), 2)
                }
                
                self.results_data.append(result_summary)
                
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
                
        return self.results_data
    
    def calculate_combined_stats(self) -> Dict[str, Any]:
        """Calculate combined statistics across all exams"""
        if not self.results_data:
            return {}
            
        total_questions = sum(r["questions_count"] for r in self.results_data)
        total_correct = sum(r["score"] for r in self.results_data)
        total_time = sum(r["time_total_generation"] for r in self.results_data)
        
        return {
            "total_exams": len(self.results_data),
            "total_questions": total_questions,
            "total_correct": total_correct,
            "overall_accuracy": round((total_correct / total_questions * 100), 1) if total_questions > 0 else 0,
            "total_time_minutes": round(total_time / 60, 2),
            "average_questions_per_minute": round(total_questions / (total_time / 60), 2) if total_time > 0 else 0
        }
    
    def generate_html(self, output_file: str = "ap_eval/results/collator/dashboard.html"):
        """Generate HTML dashboard with results"""
        
        # Load results if not already loaded
        if not self.results_data:
            self.load_all_results()
            
        combined_stats = self.calculate_combined_stats()
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AP Evaluation Results Dashboard</title>
    
    <!-- Bootstrap CSS from CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome for icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        .metric-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
        }}
        .table-container {{
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }}
        .accuracy-high {{ color: #28a745; font-weight: bold; }}
        .accuracy-medium {{ color: #ffc107; font-weight: bold; }}
        .accuracy-low {{ color: #dc3545; font-weight: bold; }}
        .sortable {{
            cursor: pointer;
            user-select: none;
        }}
        .sortable:hover {{
            background-color: #f8f9fa;
        }}
        .sort-icon {{
            margin-left: 5px;
            opacity: 0.5;
        }}
        .sort-icon.active {{
            opacity: 1;
        }}
    </style>
</head>
<body class="bg-light">
    <div class="container-fluid py-4">
        <div class="row">
            <div class="col-12">
                <h1 class="text-center mb-4">
                    <i class="fas fa-chart-line"></i> AP Evaluation Results Dashboard
                </h1>
                
                <!-- Combined Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('total_exams', 0)}</h3>
                            <p class="mb-0">Total Exams</p>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('total_questions', 0)}</h3>
                            <p class="mb-0">Total Questions</p>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('total_correct', 0)}</h3>
                            <p class="mb-0">Total Correct</p>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('overall_accuracy', 0)}%</h3>
                            <p class="mb-0">Overall Accuracy</p>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('total_time_minutes', 0)}m</h3>
                            <p class="mb-0">Total Time</p>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="metric-card text-center">
                            <h3>{combined_stats.get('average_questions_per_minute', 0)}</h3>
                            <p class="mb-0">Q/min Avg</p>
                        </div>
                    </div>
                </div>
                
                <!-- Results Table -->
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="resultsTable">
                            <thead class="table-dark">
                                <tr>
                                    <th class="sortable" data-sort="exam">Exam <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="model">Model <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="provider">Provider <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="accuracy">Accuracy <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="score">Score <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="questions">Questions <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="time">Time (s) <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="qpm">Q/min <i class="fas fa-sort sort-icon"></i></th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
        """
        
        # Add table rows
        for result in self.results_data:
            accuracy_class = "accuracy-high" if result["accuracy_percentage"] >= 80 else "accuracy-medium" if result["accuracy_percentage"] >= 60 else "accuracy-low"
            
            # Format timestamp
            try:
                timestamp = datetime.fromisoformat(result["time_timestamp"].replace('Z', '+00:00'))
                date_str = timestamp.strftime("%Y-%m-%d %H:%M")
            except:
                date_str = result["time_timestamp"][:16] if result["time_timestamp"] else "Unknown"
            
            html_content += f"""
                                <tr>
                                    <td><strong>{result['exam_identifier']}</strong></td>
                                    <td>{result['model_name']}</td>
                                    <td>{result['model_provider']}</td>
                                    <td class="{accuracy_class}">{result['accuracy_percentage']}%</td>
                                    <td>{result['score']}/{result['questions_count']}</td>
                                    <td>{result['questions_count']}</td>
                                    <td>{result['time_total_generation']:.1f}</td>
                                    <td>{result['questions_per_minute']}</td>
                                    <td>{date_str}</td>
                                </tr>
            """
        
        html_content += """
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="mt-3 text-muted">
                    <small>Generated on: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</small>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Bootstrap JS and Popper.js from CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js"></script>
    
    <script>
        // Sorting functionality
        document.addEventListener('DOMContentLoaded', function() {{
            const table = document.getElementById('resultsTable');
            const headers = table.querySelectorAll('th.sortable');
            
            headers.forEach(header => {{
                header.addEventListener('click', function() {{
                    const column = this.dataset.sort;
                    const tbody = table.querySelector('tbody');
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    
                    // Remove active class from all sort icons
                    headers.forEach(h => h.querySelector('.sort-icon').classList.remove('active'));
                    
                    // Add active class to clicked header
                    this.querySelector('.sort-icon').classList.add('active');
                    
                    // Sort rows
                    rows.sort((a, b) => {{
                        const aVal = getCellValue(a, column);
                        const bVal = getCellValue(b, column);
                        
                        if (column === 'accuracy' || column === 'score' || column === 'questions' || column === 'time' || column === 'qpm') {{
                            return parseFloat(bVal) - parseFloat(aVal); // Descending for metrics
                        }} else {{
                            return aVal.localeCompare(bVal); // Ascending for text
                        }}
                    }});
                    
                    // Reorder rows
                    rows.forEach(row => tbody.appendChild(row));
                }});
            }});
            
            function getCellValue(row, column) {{
                const cellIndex = getColumnIndex(column);
                const cell = row.cells[cellIndex];
                return cell.textContent.trim();
            }}
            
            function getColumnIndex(column) {{
                const headers = Array.from(table.querySelectorAll('th'));
                return headers.findIndex(h => h.dataset.sort === column);
            }}
            
            // Set initial sort by accuracy (descending)
            document.querySelector('[data-sort="accuracy"]').click();
        }});
    </script>
</body>
</html>
        """
        
        # Write HTML file
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            f.write(html_content)
            
        print(f"Dashboard generated: {output_file}")
        return output_file

def main():
    parser = argparse.ArgumentParser(description='Generate AP evaluation results dashboard')
    parser.add_argument('--results-dir', default='ap_eval/results', help='Directory containing result JSON files')
    parser.add_argument('--output', default='ap_eval/results/collator/dashboard.html', help='Output HTML file path')
    
    args = parser.parse_args()
    
    collator = ResultsCollator(args.results_dir)
    collator.load_all_results()
    
    if not collator.results_data:
        print("No result files found!")
        return
        
    print(f"Loaded {len(collator.results_data)} result files")
    
    output_file = collator.generate_html(args.output)
    print(f"Dashboard saved to: {output_file}")
    
    # Print summary
    combined_stats = collator.calculate_combined_stats()
    print(f"\nSummary:")
    print(f"Total exams: {combined_stats['total_exams']}")
    print(f"Total questions: {combined_stats['total_questions']}")
    print(f"Overall accuracy: {combined_stats['overall_accuracy']}%")
    print(f"Total time: {combined_stats['total_time_minutes']} minutes")

if __name__ == "__main__":
    main() 