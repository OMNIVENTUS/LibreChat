# LibreChat Makefile
# This Makefile provides helpful commands for working with the LibreChat project

.PHONY: help install dev build test clean docker-dev docker-prod lint format update create-user

# Default target
help:
	@echo "LibreChat Makefile commands:"
	@echo "make install        - Install all dependencies"
	@echo "make dev           - Start development servers"
	@echo "make build         - Build the project"
	@echo "make test          - Run all tests"
	@echo "make clean         - Clean up node_modules and build artifacts"
	@echo "make docker-dev    - Run development environment in Docker"
	@echo "make docker-prod   - Run production environment in Docker"
	@echo "make lint          - Run linting"
	@echo "make format        - Format code"
	@echo "make update        - Update dependencies"
	@echo "make create-user   - Create a new user"
	@echo "make e2e           - Run E2E tests"
	@echo "make stop          - Stop all running services"

# Installation
install:
	@echo "Installing dependencies..."
	npm ci
	@echo "Installation complete!"

# Development
dev:
	@echo "Starting development servers..."
	npm run backend:dev & npm run frontend:dev

# Build
run-frontend:
	@echo "Make sur backend is running first. Building the project..."
	npm run frontend:dev

run-backend:
	@echo "Starting the backend with watcher..."
	npm run backend:dev

# Testing
test:
	@echo "Running tests..."
	npm run test:client
	npm run test:api

# E2E Testing
e2e:
	@echo "Running E2E tests..."
	npm run e2e

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf node_modules
	rm -rf api/node_modules
	rm -rf client/node_modules
	rm -rf packages/*/node_modules
	rm -rf client/dist
	rm -rf api/dist

# Docker development environment
docker-dev:
	@echo "Starting Docker development environment..."
	docker-compose up --build

# Docker production environment
docker-prod:
	@echo "Starting Docker production environment..."
	docker-compose -f deploy-compose.yml up -d --build

# Linting
lint:
	@echo "Running linting..."
	npm run lint

# Formatting
format:
	@echo "Formatting code..."
	npm run format

# Update dependencies
update:
	@echo "Updating dependencies..."
	npm run update:local

# Create user
create-user:
	@echo "Creating new user..."
	npm run create-user

# Stop all services
stop:
	@echo "Stopping all services..."
	npm run backend:stop
	docker-compose down
	docker-compose -f deploy-compose.yml down

# Environment setup
setup-env:
	@echo "Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from .env.example"; \
	else \
		echo ".env file already exists"; \
	fi 