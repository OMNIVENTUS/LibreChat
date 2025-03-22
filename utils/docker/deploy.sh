#!/bin/bash
set -e

# This script is used to deploy LibreChat to production on a Digital Ocean droplet
# It pulls the latest images and restarts the containers

# Change to the project directory
cd "$(dirname "$0")/../.." || exit

# Get the environment variables
GITHUB_OWNER=lionelzoc
IMAGE_TAG=latest

echo "Deploying LibreChat to production..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it before deploying."
  exit 1
fi

# Check if librechat.yaml file exists
if [ ! -f librechat.yaml ]; then
  echo "Error: librechat.yaml file not found. Please create it before deploying."
  exit 1
fi

# Pull the latest images
echo "Pulling the latest Docker images..."
docker compose -f docker-compose.production.yml pull

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.production.yml down

# Start the new containers
echo "Starting new containers..."
GITHUB_OWNER=$GITHUB_OWNER IMAGE_TAG=$IMAGE_TAG docker compose -f docker-compose.production.yml up -d

echo "Deployment completed successfully!"
echo "Your LibreChat instance should be available at https://chat.omniventus.com"

# Check the status of the containers
echo "Container status:"
docker ps -a | grep -E "LibreChat|chat-" 