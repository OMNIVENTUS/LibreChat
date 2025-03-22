#!/bin/bash
set -e

# This script sets up a Digital Ocean droplet for LibreChat deployment
# It installs Docker, Docker Compose, and other required tools

# Update the package list
echo "Updating package list..."
apt-get update

# Install required packages
echo "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    make \
    ufw

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Add current user to docker group
echo "Adding current user to docker group..."
usermod -aG docker $USER

# Install Docker Compose v2
echo "Installing Docker Compose v2..."
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Setup firewall
echo "Setting up firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 22/tcp comment 'Allow SSH'
ufw allow 80/tcp comment 'Allow HTTP'
ufw allow 443/tcp comment 'Allow HTTPS'
echo "y" | ufw enable

# Create directories for SSL certificates
echo "Creating directories for SSL certificates..."
mkdir -p /etc/nginx/ssl

# Clone the LibreChat repository
echo "Cloning the LibreChat repository..."
git clone https://github.com/danny-avila/LibreChat.git /opt/LibreChat
cd /opt/LibreChat

# Create .env file (template)
echo "Creating .env file template..."
cp .env.example .env

echo "Server setup completed successfully!"
echo "Please edit the .env file in /opt/LibreChat before deploying."
echo "Run the deploy.sh script to deploy LibreChat."

echo "Important next steps:"
echo "1. Update your .env file with your MongoDB Atlas URI and other settings"
echo "2. Set up SSL certificates using Let's Encrypt (certbot)"
echo "3. Update GITHUB_OWNER in the deploy.sh script"
echo "4. Run the deploy.sh script to deploy LibreChat" 