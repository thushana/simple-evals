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
import subprocess

class ResultsCollator:
    def __init__(self, results_dir: str = "ap_eval/results"):
        self.results_dir = results_dir
        self.results_data = []
        
    def load_all_results(self) -> List[Dict[str, Any]]:
        """Load all JSON result files from the results directory"""
        json_files = glob.glob(os.path.join(self.results_dir, "*.json"))
        # Filter out index.json and Results.json
        json_files = [f for f in json_files if os.path.basename(f) not in ("index.json")]
        
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
    
    def get_best_runs(self):
        """Get the best single run (highest accuracy, then fastest time) for each test."""
        best_runs = {}
        for result in self.results_data:
            exam_id = result["exam_identifier"]
            if exam_id not in best_runs:
                best_runs[exam_id] = result
            else:
                current = best_runs[exam_id]
                # Compare by accuracy, then by time
                if result["accuracy_percentage"] > current["accuracy_percentage"]:
                    best_runs[exam_id] = result
                elif result["accuracy_percentage"] == current["accuracy_percentage"] and result["time_total_generation"] < current["time_total_generation"]:
                    best_runs[exam_id] = result
        return best_runs
    
    @staticmethod
    def get_git_user():
        try:
            name = subprocess.check_output(['git', 'config', 'user.name']).decode().strip()
            email = subprocess.check_output(['git', 'config', 'user.email']).decode().strip()
            return name, email
        except Exception:
            return None, None

    def write_index_json(self, output_file: str = "ap_eval/results/index.json"):
        """Write distilled results to index.json for the dashboard JS to load, with metadata."""
        import datetime
        best_runs = self.get_best_runs()  # key: exam_identifier, value: result dict
        distilled_rows = []
        for result in self.results_data:
            is_best = best_runs.get(result["exam_identifier"]) and result["filename"] == best_runs[result["exam_identifier"]]["filename"]
            distilled_rows.append({
                "test": result["exam_identifier"],
                "model": result["model_name"],
                "provider": result["model_provider"],
                "accuracy": result["accuracy_percentage"],
                "score": result["score"],
                "questions": result["questions_count"],
                "time": result["time_total_generation"],
                "date": result["time_timestamp"],
                "is_best": is_best
            })
        name, email = self.get_git_user()
        output = {
            "metadata": {
                "generated_on": datetime.datetime.now().isoformat(),
                "author_name": name,
                "author_email": email
            },
            "results": distilled_rows
        }
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            import json
            json.dump(output, f, indent=2)
        print(f"Distilled results saved to: {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Generate AP evaluation results index.json for dashboard')
    parser.add_argument('--results-dir', default='ap_eval/results', help='Directory containing result JSON files')
    parser.add_argument('--output', default='ap_eval/results/index.json', help='Output JSON file path')
    args = parser.parse_args()
    collator = ResultsCollator(args.results_dir)
    collator.load_all_results()
    if not collator.results_data:
        print("No result files found!")
        return
    print(f"Loaded {len(collator.results_data)} result files")
    collator.write_index_json(args.output)
    # Print summary
    combined_stats = collator.calculate_combined_stats()
    print(f"\nSummary:")
    print(f"Total exams: {combined_stats['total_exams']}")
    print(f"Total questions: {combined_stats['total_questions']}")
    print(f"Overall accuracy: {combined_stats['overall_accuracy']}%")
    print(f"Total time: {combined_stats['total_time_minutes']} minutes")

if __name__ == "__main__":
    main() 