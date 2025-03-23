# LibreChat Makefile
# This Makefile provides helpful commands for working with the LibreChat project

.PHONY: help install dev build test clean docker-dev docker-prod lint format update create-user ngrok-setup ngrok-dev ngrok-check notion-test notion-test-db notion-create-page notion-create-db textgears-test docker-build docker-push docker-login deploy-prod deploy-prod-build setup-ssl docker-cleanup

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
	@echo "make ngrok-setup    - Setup Ngrok with your auth token"
	@echo "make ngrok-dev      - Run development servers with Ngrok exposure"
	@echo "make ngrok-check    - Check Ngrok installation"
	@echo "make notion-test    - Test Notion API integration"
	@echo "make notion-test-db - Test Notion database query"
	@echo "make notion-create-page - Create a test page in Notion"
	@echo "make notion-create-db - Create a content database in Notion"
	@echo "make textgears-test - Test TextGears content analysis API"
	@echo "make docker-build   - Build Docker image"
	@echo "make docker-build-amd64 - Build Docker image for AMD64 platform (for Digital Ocean)"
	@echo "make docker-build-amd64-direct - Build AMD64 image without buildx (alternative method)"
	@echo "make docker-build-multi - Build multi-platform Docker image (AMD64 + ARM64)"
	@echo "make docker-push    - Push Docker image to GitHub Container Registry"
	@echo "make docker-login   - Log in to GitHub Container Registry"
	@echo "make deploy-prod    - Deploy to production"
	@echo "make deploy-prod-build - Build for AMD64, push, and deploy in one step"
	@echo "make setup-ssl      - Set up SSL certificates with Let's Encrypt"
	@echo "make docker-cleanup - Clean up Docker environment to reclaim disk space"

GITHUB_OWNER=lionelzoc
SSL_EMAIL=lionel@omniventus.com

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

build-frontend:
	@echo "Building the frontend..."
	npm run frontend

build-backend:
	@echo "Building the backend..."
	npm run backend


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

# Ngrok Integration
ngrok-check:
	@echo "Checking Ngrok installation..."
	@if command -v ngrok >/dev/null 2>&1; then \
		echo "✓ Ngrok is installed"; \
	else \
		echo "✗ Ngrok is not installed"; \
		echo "Please install Ngrok from https://ngrok.com/download"; \
		exit 1; \
	fi

ngrok-setup:
	@echo "Setting up Ngrok..."
	@if [ -z "$(NGROK_TOKEN)" ]; then \
		echo "Please provide your Ngrok auth token:"; \
		echo "Usage: make ngrok-setup NGROK_TOKEN=your_token_here"; \
		echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"; \
		exit 1; \
	fi
	@echo "Configuring Ngrok with your auth token..."
	@ngrok config add-authtoken $(NGROK_TOKEN)
	@echo "Ngrok setup complete!"

ngrok-dev: ngrok-check
	@echo "Starting development servers with Ngrok exposure..."
	@echo "Frontend will be available at http://localhost:3080"
	@echo "Starting backend and frontend..."
	@echo "Starting Ngrok tunnel..." 
	@ngrok http 3080 --log=stdout > ngrok.log & \
	echo "Ngrok tunnel started! Check ngrok.log for the public URL" && \
	tail -f ngrok.log | grep --line-buffered "url=" 

# Notion Integration Testing
notion-test:
	@echo "Testing Notion API integration..."
	@if [ -z "$(NOTION_TOKEN)" ]; then \
		echo "Error: NOTION_TOKEN environment variable is required"; \
		echo "Usage: make notion-test NOTION_TOKEN=secret_xxx NOTION_PAGE_ID=xxx"; \
		exit 1; \
	fi
	@if [ -z "$(NOTION_PAGE_ID)" ]; then \
		echo "Error: NOTION_PAGE_ID environment variable is required"; \
		echo "Usage: make notion-test NOTION_TOKEN=secret_xxx NOTION_PAGE_ID=xxx"; \
		exit 1; \
	fi
	@echo "Making test request to Notion API..."
	@curl -s -X GET "https://api.notion.com/v1/pages/$(NOTION_PAGE_ID)" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28" | jq || { \
		echo ""; \
		echo "Failed to parse response. Install jq with 'apt-get install jq' or 'brew install jq'"; \
		curl -s -X GET "https://api.notion.com/v1/pages/$(NOTION_PAGE_ID)" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28"; \
	}
	@echo ""
	@echo "✅ Request complete. If you see a JSON response above, your Notion integration is working!"
	@echo "To test with a database, use: make notion-test-db NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx"

notion-test-db:
	@echo "Testing Notion database query..."
	@if [ -z "$(NOTION_TOKEN)" ]; then \
		echo "Error: NOTION_TOKEN environment variable is required"; \
		echo "Usage: make notion-test-db NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx"; \
		exit 1; \
	fi
	@if [ -z "$(NOTION_DB_ID)" ]; then \
		echo "Error: NOTION_DB_ID environment variable is required"; \
		echo "Usage: make notion-test-db NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx"; \
		exit 1; \
	fi
	@echo "Querying Notion database..."
	@curl -s -X POST "https://api.notion.com/v1/databases/$(NOTION_DB_ID)/query" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28" \
		-H "Content-Type: application/json" \
		-d '{"page_size": 3}' | jq || { \
		echo ""; \
		echo "Failed to parse response. Install jq with 'apt-get install jq' or 'brew install jq'"; \
		curl -s -X POST "https://api.notion.com/v1/databases/$(NOTION_DB_ID)/query" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28" \
		-H "Content-Type: application/json" \
		-d '{"page_size": 3}'; \
	}
	@echo ""
	@echo "✅ Database query complete. If you see a JSON response above, your database query is working!"

notion-create-page:
	@echo "Creating a test page in Notion..."
	@if [ -z "$(NOTION_TOKEN)" ]; then \
		echo "Error: NOTION_TOKEN environment variable is required"; \
		echo "Usage: make notion-create-page NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx"; \
		exit 1; \
	fi
	@if [ -z "$(NOTION_DB_ID)" ]; then \
		echo "Error: NOTION_DB_ID environment variable is required"; \
		echo "Usage: make notion-create-page NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx"; \
		exit 1; \
	fi
	@echo "Creating page in database..."
	@curl -s -X POST "https://api.notion.com/v1/pages" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28" \
		-H "Content-Type: application/json" \
		-d '{ \
			"parent": { "database_id": "$(NOTION_DB_ID)" }, \
			"properties": { \
				"Name": { \
					"title": [ \
						{ \
							"text": { \
								"content": "Test page created via Makefile" \
							} \
						} \
					] \
				}, \
				"Tags": { \
					"multi_select": [ \
						{ \
							"name": "API" \
						}, \
						{ \
							"name": "Test" \
						} \
					] \
				} \
			} \
		}' | jq || { \
		echo ""; \
		echo "Failed to parse response. Install jq with 'apt-get install jq' or 'brew install jq'"; \
		curl -s -X POST "https://api.notion.com/v1/pages" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Notion-Version: 2022-06-28" \
		-H "Content-Type: application/json" \
		-d '{ \
			"parent": { "database_id": "$(NOTION_DB_ID)" }, \
			"properties": { \
				"Name": { \
					"title": [ \
						{ \
							"text": { \
								"content": "Test page created via Makefile" \
							} \
						} \
					] \
				}, \
				"Tags": { \
					"multi_select": [ \
						{ \
							"name": "API" \
						}, \
						{ \
							"name": "Test" \
						} \
					] \
				} \
			} \
		}'; \
	}
	@echo ""
	@echo "✅ Page creation complete. If you see a JSON response with an 'id' field, your page was created successfully!"

# TextGears API test
textgears-test:
	@echo "Testing TextGears content analysis API..."
	@if [ -z "$(TEXTGEARS_API_KEY)" ]; then \
		echo "Error: TEXTGEARS_API_KEY environment variable is required"; \
		echo "Usage: make textgears-test TEXTGEARS_API_KEY=your_api_key CONTENT='Your test content'"; \
		exit 1; \
	fi
	@if [ -z "$(CONTENT)" ]; then \
		echo "Using default test content..."; \
		CONTENT="This is a sample text to analyze with TextGears API. It contains some grammer errors and typos that should be detected."; \
	fi
	@echo "Making test request to TextGears API..."
	@curl -s -X POST "https://api.textgears.com/analyze" \
		-H "Content-Type: application/json" \
		-d "{ \
			\"key\": \"$(TEXTGEARS_API_KEY)\", \
			\"text\": \"$(CONTENT)\", \
			\"language\": \"en-US\" \
		}" | jq || { \
		echo ""; \
		echo "Failed to parse response. Install jq with 'apt-get install jq' or 'brew install jq'"; \
		curl -s -X POST "https://api.textgears.com/analyze" \
		-H "Content-Type: application/json" \
		-d "{ \
			\"key\": \"$(TEXTGEARS_API_KEY)\", \
			\"text\": \"$(CONTENT)\", \
			\"language\": \"en-US\" \
		}"; \
	}
	@echo ""
	@echo "✅ TextGears API test complete!"

notion-create-db:
	@echo "Creating a content database in Notion..."
	@if [ -z "$(NOTION_TOKEN)" ]; then \
		echo "Error: NOTION_TOKEN environment variable is required"; \
		echo "Usage: make notion-create-db NOTION_TOKEN=secret_xxx NOTION_PAGE_ID=xxx"; \
		exit 1; \
	fi
	@if [ -z "$(NOTION_PAGE_ID)" ]; then \
		echo "Error: NOTION_PAGE_ID environment variable is required"; \
		echo "Usage: make notion-create-db NOTION_TOKEN=secret_xxx NOTION_PAGE_ID=xxx"; \
		exit 1; \
	fi
	@echo "Making request to create database in Notion..."
	@curl -s -X POST "https://api.notion.com/v1/databases" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Content-Type: application/json" \
		-H "Notion-Version: 2022-06-28" \
		-d '{ \
			"parent": { \
				"type": "page_id", \
				"page_id": "$(NOTION_PAGE_ID)" \
			}, \
			"title": [ \
				{ \
					"type": "text", \
					"text": { \
						"content": "Content Database" \
					} \
				} \
			], \
			"properties": { \
				"Title": { \
					"title": {} \
				}, \
				"Type": { \
					"select": { \
						"options": [ \
							{ "name": "Blog Post", "color": "blue" }, \
							{ "name": "Social Media", "color": "green" }, \
							{ "name": "Email Newsletter", "color": "orange" }, \
							{ "name": "Marketing Copy", "color": "red" } \
						] \
					} \
				}, \
				"Status": { \
					"select": { \
						"options": [ \
							{ "name": "Draft", "color": "gray" }, \
							{ "name": "In Review", "color": "yellow" }, \
							{ "name": "Published", "color": "green" }, \
							{ "name": "Archived", "color": "brown" } \
						] \
					} \
				}, \
				"Tags": { \
					"multi_select": { \
						"options": [ \
							{ "name": "Marketing", "color": "red" }, \
							{ "name": "Technical", "color": "blue" }, \
							{ "name": "Announcement", "color": "green" }, \
							{ "name": "Tutorial", "color": "purple" } \
						] \
					} \
				}, \
				"Created": { \
					"date": {} \
				}, \
				"Target Audience": { \
					"rich_text": {} \
				}, \
				"SEO Score": { \
					"number": { \
						"format": "number" \
					} \
				} \
			} \
		}' | jq || { \
		echo ""; \
		echo "Failed to parse response. Install jq with 'apt-get install jq' or 'brew install jq'"; \
		curl -s -X POST "https://api.notion.com/v1/databases" \
		-H "Authorization: Bearer $(NOTION_TOKEN)" \
		-H "Content-Type: application/json" \
		-H "Notion-Version: 2022-06-28" \
		-d '{ \
			"parent": { \
				"type": "page_id", \
				"page_id": "$(NOTION_PAGE_ID)" \
			}, \
			"title": [ \
				{ \
					"type": "text", \
					"text": { \
						"content": "Content Database" \
					} \
				} \
			], \
			"properties": { \
				"Title": { \
					"title": {} \
				}, \
				"Type": { \
					"select": { \
						"options": [ \
							{ "name": "Blog Post", "color": "blue" }, \
							{ "name": "Social Media", "color": "green" }, \
							{ "name": "Email Newsletter", "color": "orange" }, \
							{ "name": "Marketing Copy", "color": "red" } \
						] \
					} \
				}, \
				"Status": { \
					"select": { \
						"options": [ \
							{ "name": "Draft", "color": "gray" }, \
							{ "name": "In Review", "color": "yellow" }, \
							{ "name": "Published", "color": "green" }, \
							{ "name": "Archived", "color": "brown" } \
						] \
					} \
				}, \
				"Tags": { \
					"multi_select": { \
						"options": [ \
							{ "name": "Marketing", "color": "red" }, \
							{ "name": "Technical", "color": "blue" }, \
							{ "name": "Announcement", "color": "green" }, \
							{ "name": "Tutorial", "color": "purple" } \
						] \
					} \
				}, \
				"Created": { \
					"date": {} \
				}, \
				"Target Audience": { \
					"rich_text": {} \
				}, \
				"SEO Score": { \
					"number": { \
						"format": "number" \
					} \
				} \
			} \
		}'; \
	}
	@echo ""
	@echo "✅ Database creation request complete. If successful, you will see the database ID in the JSON response above."
	@echo "Use that ID for future database operations with: make notion-test-db NOTION_TOKEN=secret_xxx NOTION_DB_ID=xxx" 


frontend-stop:
	@echo "Stopping frontend development server..."
	@kill $(lsof -t -i:3090)

# Docker deployment commands
docker-build:
	@echo "Building Docker image..."
	docker build -t ghcr.io/$(GITHUB_OWNER)/librechat:latest -f Dockerfile.multi --target api-build .

# Build for specific platform (AMD64 for Digital Ocean)
docker-build-amd64:
	@echo "Building Docker image for AMD64 platform (Digital Ocean)..."
	@echo "Cleaning up Docker environment to free space..."
	docker system prune -f
	@echo "Creating optimized builder with more disk space..."
	docker buildx rm multiplatform-builder || true
	docker buildx create --name multiplatform-builder --use --bootstrap \
		--driver docker-container \
		--driver-opt image=moby/buildkit:master \
		--driver-opt network=host
	@echo "Building image for AMD64 platform..."
	docker buildx build --platform linux/amd64 \
		--memory=4g \
		--output type=docker \
		-t ghcr.io/$(GITHUB_OWNER)/librechat:latest \
		-f Dockerfile.multi --target api-build .

# Alternative AMD64 build using direct Docker (no buildx)
docker-build-amd64-direct:
	@echo "Building Docker image for AMD64 platform using direct build..."
	@echo "This method doesn't use buildx and may work better on some systems."
	@echo "Cleaning up Docker environment to free space..."
	docker system prune -f
	@echo "Building image directly (non-cross-platform build)..."
	docker build -t ghcr.io/$(GITHUB_OWNER)/librechat:latest -f Dockerfile.multi --target api-build .

# Build for multiple platforms
docker-build-multi:
	@echo "Building multi-platform Docker image (AMD64, ARM64)..."
	@echo "Cleaning up Docker environment to free space..."
	docker system prune -f
	@echo "Creating optimized builder with more disk space..."
	docker buildx rm multiplatform-builder || true
	docker buildx create --name multiplatform-builder --use --bootstrap \
		--driver docker-container \
		--driver-opt image=moby/buildkit:master \
		--driver-opt network=host
	@echo "Building multi-platform image and pushing directly to registry..."
	docker buildx build --platform linux/amd64,linux/arm64 \
		--memory=4g \
		-t ghcr.io/$(GITHUB_OWNER)/librechat:latest \
		-f Dockerfile.multi --target api-build \
		--push .

docker-push:
	@echo "Pushing Docker image to GitHub Container Registry..."
	docker push ghcr.io/$(GITHUB_OWNER)/librechat:latest

docker-login:
	@echo "Logging in to GitHub Container Registry..."
	@if [ -z "$(GITHUB_TOKEN)" ]; then \
		echo "Error: GITHUB_TOKEN environment variable is not set"; \
		echo "Please set it with: export GITHUB_TOKEN=your_token_here"; \
		echo "Get your token from: https://github.com/settings/tokens"; \
		exit 1; \
	fi
	@echo "Using GITHUB_TOKEN from environment..."
	@docker login ghcr.io -u $(shell echo $(GITHUB_OWNER) | tr '[:upper:]' '[:lower:]') --password-stdin <<< "$(GITHUB_TOKEN)"
	@echo "Login successful!"

deploy-prod:
	@echo "Deploying to production..."
	@echo "This will pull the latest image and restart the containers"
	@echo "Make sure you've configured your .env file with MongoDB Atlas connection"
	docker-compose -f docker-compose.production.yml pull
	docker-compose -f docker-compose.production.yml up -d

deploy-stop:
	@echo "Stopping production services..."
	docker-compose -f docker-compose.production.yml down

deploy-prod-build:
	@echo "Building locally and deploying to production..."
	make docker-build-amd64
	make docker-push
	make deploy-prod

setup-ssl:
	@echo "Setting up SSL certificates with Let's Encrypt..."
	mkdir -p ./ssl
	docker run --rm -p 80:80 -p 443:443 \
		-v ./ssl:/etc/letsencrypt \
		-v ./ssl-logs:/var/log/letsencrypt \
		certbot/certbot certonly --standalone \
		--agree-tos --email $(SSL_EMAIL) \
		-d chat.omniventus.com
	
	@echo "Copying certificates to NGINX SSL directory..."
	mkdir -p ./ssl
	cp ./ssl/live/chat.omniventus.com/fullchain.pem ./ssl/
	cp ./ssl/live/chat.omniventus.com/privkey.pem ./ssl/

# Docker cleanup helper
docker-cleanup:
	@echo "Cleaning up Docker environment to reclaim disk space..."
	@echo "This will remove unused containers, networks, images, and build cache"
	docker system prune -a -f
	@echo "Removing buildx builder instance if it exists..."
	docker buildx rm multiplatform-builder || true
	@echo "Docker cleanup complete!"
	@echo "Available disk space:"
	df -h