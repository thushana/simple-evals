# AP Evaluation System Makefile

.PHONY: help install setup collate results clean

# Default target
help:
	@echo "AP Evaluation System - Available commands:"
	@echo ""
	@echo "  install    - Install the package in development mode"
	@echo "  setup      - Set up API keys (copy .env.example to .env)"
	@echo "  collate    - Generate dashboard from all result files"
	@echo "  results    - Start local server to view dashboard"
	@echo "  clean      - Remove generated result files"
	@echo "  run        - Run AP evaluation (usage: make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017)"
	@echo ""

# Install the package in development mode
install:
	cd .. && pip install -e .

# Set up environment file
setup:
	@if [ ! -f ../.env ]; then \
		cp ../.env.example ../.env; \
		echo "Created .env file from .env.example"; \
		echo "Please edit .env and add your API keys"; \
	else \
		echo ".env file already exists"; \
	fi

# Generate dashboard from all result files
collate:
	@echo "Generating dashboard from result files..."
	python results/collator/run.py --results-dir results --output results/index.json

# Start local server to view dashboard
results:
	@echo "Starting local server at http://localhost:8000"
	@echo "Press Ctrl+C to stop the server"
	cd results && python3 -m http.server 8000

# Clean generated result files
clean:
	@echo "Removing generated result files..."
	rm -f results/*.json
	rm -f results/index.json
	@echo "Result files removed"

# Run AP evaluation
run:
	@if [ -z "$(MODEL)" ] || [ -z "$(EXAM)" ]; then \
		echo "Usage: make run MODEL=<model_name> EXAM=<exam_identifier>"; \
		echo "Example: make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017"; \
		exit 1; \
	fi
	@echo "Running AP evaluation for $(MODEL) on $(EXAM)..."
	cd .. && python -m ap_eval.run $(MODEL) $(EXAM)

# Convenience target to run evaluation and then start server
evaluate: run collate results 