.PHONY: lint lint-python lint-frontend typecheck typecheck-python typecheck-frontend format

lint: lint-python lint-frontend
lint-python:
	flake8 .

lint-frontend:
	npm run lint:frontend

typecheck: typecheck-python typecheck-frontend
typecheck-python:
	mypy .

typecheck-frontend:
	npm run typecheck:frontend

format:
	black .
	isort .

# ... rest of Makefile unchanged 