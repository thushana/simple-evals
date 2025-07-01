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
    
    def get_best_performers(self) -> Dict[str, str]:
        """Get the best performing model for each test"""
        best_performers = {}
        
        # Group by exam identifier
        exam_groups = {}
        for result in self.results_data:
            exam_id = result["exam_identifier"]
            if exam_id not in exam_groups:
                exam_groups[exam_id] = []
            exam_groups[exam_id].append(result)
        
        # Find best performer for each exam
        for exam_id, results in exam_groups.items():
            best_result = max(results, key=lambda x: x["accuracy_percentage"])
            best_performers[exam_id] = best_result["model_name"]
            
        return best_performers
    
    def generate_html(self, output_file: str = "ap_eval/results/collator/dashboard.html"):
        """Generate HTML dashboard with results"""
        
        # Load results if not already loaded
        if not self.results_data:
            self.load_all_results()
            
        combined_stats = self.calculate_combined_stats()
        best_performers = self.get_best_performers()
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AP Evaluation Results Dashboard</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Bootstrap CSS from CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome for icons -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <style>
        body {{
            font-family: 'Roboto', sans-serif;
        }}
        
        .table-container {{
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
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
        
        .number-cell {{
            font-family: 'Roboto Mono', monospace;
            text-align: right;
            font-weight: 500;
        }}
        
        .score-cell {{
            font-family: 'Roboto Mono', monospace;
            text-align: center;
            font-weight: 500;
        }}
        
        .date-cell {{
            font-family: 'Roboto Mono', monospace;
            font-size: 0.9em;
            color: #6c757d;
        }}
        
        h1 {{
            font-weight: 500;
            color: #1E1E1E;
        }}
        
        .table th {{
            font-weight: 500;
            background-color: #0677C9 !important;
            border-color: #0677C9 !important;
            color: white !important;
        }}
        
        .table-dark {{
            background-color: #0677C9 !important;
        }}
        
        .table-dark th {{
            background-color: #0677C9 !important;
            border-color: #0677C9 !important;
            color: white !important;
        }}
        
        .best-performer {{
            background-color: rgba(255, 215, 0, 0.3) !important;
        }}
        
        .star-emoji {{
            margin-right: 5px;
        }}
        
        .model-name {{
            display: inline-block;
            min-width: 120px;
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
                
                <!-- Results Table -->
                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0" id="resultsTable">
                            <thead class="table-dark">
                                <tr>
                                    <th class="sortable" data-sort="exam">Test <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="model">Model <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="provider">Provider <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="accuracy">Accuracy <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="score">Score <i class="fas fa-sort sort-icon"></i></th>
                                    <th class="sortable" data-sort="time">Time (s) <i class="fas fa-sort sort-icon"></i></th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
        """
        
        # Add table rows
        for result in self.results_data:
            accuracy_class = "accuracy-high" if result["accuracy_percentage"] >= 80 else "accuracy-medium" if result["accuracy_percentage"] >= 60 else "accuracy-low"
            
            # Check if this is the best performer for this test
            is_best = best_performers.get(result["exam_identifier"]) == result["model_name"]
            star_html = f'<span class="star-emoji">⭐</span>' if is_best else '<span class="star-emoji" style="visibility:hidden">⭐</span>'
            
            # Format timestamp
            try:
                timestamp = datetime.fromisoformat(result["time_timestamp"].replace('Z', '+00:00'))
                date_str = timestamp.strftime("%Y-%m-%d %H:%M")
            except:
                date_str = result["time_timestamp"][:16] if result["time_timestamp"] else "Unknown"
            
            if is_best:
                td_bg = ' style="background-color:rgba(255,215,0,0.1) !important;"'
            else:
                td_bg = ''
            html_content += f"""
                                <tr>
                                    <td{td_bg}><strong>{result['exam_identifier']}</strong></td>
                                    <td{td_bg}><strong><span class=\"model-name\">{star_html}{result['model_name']}</span></strong></td>
                                    <td{td_bg}>{result['model_provider']}</td>
                                    <td{td_bg} class=\"{accuracy_class} number-cell\">{result['accuracy_percentage']:.1f}%</td>
                                    <td{td_bg} class=\"score-cell\">{result['score']}/{result['questions_count']}</td>
                                    <td{td_bg} class=\"number-cell\">{result['time_total_generation']:.1f}</td>
                                    <td{td_bg} class=\"date-cell\">{date_str}</td>
                                </tr>
            """
        
        html_content += """
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Footer with generation timestamp -->
    <div class="text-center mt-4 mb-3 text-muted">
        <small>Generated on: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</small>
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
        
        # Write distilled JSON with just the table rows
        distilled_rows = []
        for result in self.results_data:
            distilled_rows.append({
                "test": result["exam_identifier"],
                "model": result["model_name"],
                "provider": result["model_provider"],
                "accuracy": result["accuracy_percentage"],
                "score": result["score"],
                "questions": result["questions_count"],
                "time": result["time_total_generation"],
                "date": result["time_timestamp"]
            })
        distilled_path = os.path.join(os.path.dirname(output_file), "index.json")
        with open(distilled_path, 'w') as f:
            import json
            json.dump(distilled_rows, f, indent=2)
        print(f"Distilled results saved to: {distilled_path}")
        
        return output_file

def main():
    parser = argparse.ArgumentParser(description='Generate AP evaluation results dashboard')
    parser.add_argument('--results-dir', default='ap_eval/results', help='Directory containing result JSON files')
    parser.add_argument('--output', default='ap_eval/results/index.html', help='Output HTML file path')
    
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