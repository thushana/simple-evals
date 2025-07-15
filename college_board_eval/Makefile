# AP Evaluation System Makefile

.PHONY: help install install-dev setup setup-pre-commit collate results clean format lint check fix typecheck lint-frontend typecheck-frontend web web-frontend web-backend format-frontend python-codecleanup js-codecleanup test-backend test-backend-coverage

# Default target
help:
	@echo "AP Evaluation System - Available commands:"
	@echo ""
	@echo "  install    - Install the package in development mode"
	@echo "  install-dev- Install development dependencies (black, isort, flake8, mypy)"
	@echo "  setup      - Set up API keys (copy .env.example to .env)"
	@echo "  setup-pre-commit - Set up pre-commit hooks for automatic formatting"
	@echo "  collate    - Generate dashboard from all result files"
	@echo "  clean      - Remove generated result files"
	@echo "  run        - Run AP evaluation (usage: make run MODEL=gpt-4 EXAM=AP_US_HISTORY_2017)"
	@echo ""
	@echo "Web Development Commands:"
	@echo "  web        - Start both FastAPI backend and React frontend development servers"
	@echo "  web-backend - Start only the FastAPI backend server"
	@echo "  web-frontend - Start only the React frontend development server"
	@echo ""
	@echo "Python Code Quality Commands:"
	@echo "  format     - Format code with black and isort"
	@echo "  lint       - Run flake8 linting"
	@echo "  typecheck  - Run mypy type checking"
	@echo "  check      - Run all code quality checks (format + lint + typecheck)"
	@echo "  fix        - Auto-fix formatting issues"
	@echo "  python-codecleanup - Run all Python code quality checks (format + lint + typecheck)"
	@echo ""
	@echo "TypeScript/Frontend Commands:"
	@echo "  lint-frontend    - Run ESLint on frontend"
	@echo "  typecheck-frontend - Run TypeScript type checking on frontend"
	@echo "  format-frontend    - Run Prettier on frontend for consistent code style"
	@echo "  js-codecleanup     - Run all JavaScript/TypeScript code quality checks (format + lint + typecheck)"
	@echo ""
	@echo "Testing Commands:"
	@echo "  test-backend - Run lightweight backend tests (config, imports, API structure)"
	@echo "  test-backend-coverage - Run backend tests with code coverage report"

# Install the package in development mode
install:
	cd .. && pip install -e .

# Install development dependencies
install-dev:
	pip install -r requirements-dev.txt

# Set up pre-commit hooks
setup-pre-commit:
	pre-commit install

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
	@echo "Symlinking results directory for frontend..."
	ln -sf ../../results web/frontend/public/results

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
	cd .. && python -m college_board_eval.run $(MODEL) $(EXAM)

# Convenience target to run evaluation and then start server
evaluate: run collate web

# Code Quality Commands

# Format code with black and isort
format:
	@echo "Formatting code with black..."
	black .
	@echo "Sorting imports with isort..."
	isort .

# Run flake8 linting
lint:
	@echo "Running flake8 linting..."
	flake8 .

# Run mypy type checking
typecheck:
	@echo "Running mypy type checking..."
	mypy .

# Run all code quality checks
check: format lint typecheck
	@echo "All code quality checks completed!"

# Auto-fix formatting issues
fix:
	@echo "Auto-fixing formatting issues..."
	black . --check --diff || black .
	isort . --check-only --diff || isort .
	@echo "Formatting fixes applied!"

# Frontend Commands

# Run ESLint on frontend
lint-frontend:
	@echo "Running ESLint on frontend..."
	cd web/frontend && npm run lint

# Run TypeScript type checking on frontend
typecheck-frontend:
	@echo "Running TypeScript type checking on frontend..."
	cd web/frontend && npm run typecheck 

# Web Development Commands

# Start only the React frontend development server
web-frontend:
	@echo "🚀 Starting Vite frontend development server..."
	cd web/frontend && npm run dev

# Start only the FastAPI backend server (development mode - single worker)
web-backend:
	@echo "🚀 Starting FastAPI backend server (development mode)..."
	cd .. && PYTHONPATH=. uvicorn college_board_eval.web.backend.main:app --reload --host 0.0.0.0 --port 8000

# Start only the FastAPI backend server (production mode - multiple workers)
web-backend-prod:
	@echo "🚀 Starting FastAPI backend server (production mode with multiple workers)..."
	cd .. && PYTHONPATH=. uvicorn college_board_eval.web.backend.main:app --host 0.0.0.0 --port 8000 --workers 4

# Start FastAPI backend with multiple workers and file watching (development-friendly)
web-backend-dev:
	@echo "🚀 Starting FastAPI backend server (multi-worker dev mode with file watching)..."
	cd .. && PYTHONPATH=. watchfiles --filter python "uvicorn college_board_eval.web.backend.main:app --host 0.0.0.0 --port 8000 --workers 4" college_board_eval/web/backend/

# Start both FastAPI backend and React frontend development servers
web:
	@echo "🚀 Starting both backend and frontend development servers..."
	@echo "📡 Backend will be available at: http://localhost:8000"
	@echo "🌐 Frontend will be available at: http://localhost:1600"
	@echo ""
	@echo "Starting FastAPI backend..."
	cd .. && PYTHONPATH=. uvicorn college_board_eval.web.backend.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting Vite frontend..."
	cd web/frontend && npm run dev

# Start both backend (multi-worker) and frontend with hot reload
web-dev:
	@echo "🚀 Starting both backend (multi-worker) and frontend development servers..."
	@echo "📡 Backend will be available at: http://localhost:8000"
	@echo "🌐 Frontend will be available at: http://localhost:1600"
	@echo ""
	@echo "Starting FastAPI backend with multiple workers..."
	cd .. && PYTHONPATH=. watchfiles --filter python "uvicorn college_board_eval.web.backend.main:app --host 0.0.0.0 --port 8000 --workers 4" college_board_eval/web/backend/ &
	@echo "Starting Vite frontend..."
	cd web/frontend && npm run dev

format-frontend:
	cd web/frontend && npx prettier --write . 

# Run all Python code quality checks in one go
python-codecleanup:
	@echo "🧹 Running Python code cleanup..."
	@echo "📝 Formatting code with black and isort..."
	black .
	isort .
	@echo "🔍 Running flake8 linting..."
	flake8 .
	@echo "🔍 Running mypy type checking..."
	mypy .
	@echo "✅ Python code cleanup completed!"

# Run all JavaScript/TypeScript code quality checks in one go
js-codecleanup:
	@echo "🧹 Running JavaScript/TypeScript code cleanup..."
	@echo "📝 Formatting code with Prettier..."
	cd web/frontend && npx prettier --write .
	@echo "🔍 Running ESLint..."
	cd web/frontend && npm run lint
	@echo "🔍 Running TypeScript type checking..."
	cd web/frontend && npm run typecheck
	@echo "✅ JavaScript/TypeScript code cleanup completed!" 

# Run lightweight backend tests
test-backend:
	@echo "🧪 Running Backend Tests..."
	cd .. && PYTHONPATH=. python -m pytest college_board_eval/tests/test_backend.py -v 

# Run backend tests with coverage
test-backend-coverage:
	cd .. && PYTHONPATH=. pytest --cov=college_board_eval.web.backend --cov-report=term-missing --cov-report=html college_board_eval/tests/ 