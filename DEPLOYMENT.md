# Deploying LibreChat to Digital Ocean

This guide provides step-by-step instructions for deploying LibreChat to a Digital Ocean droplet with GitHub Actions CI/CD.

## Architecture Overview

The deployment architecture consists of:

1. **GitHub Repository**: Hosts the code and GitHub Actions workflow for CI/CD
2. **GitHub Container Registry**: Stores the Docker images built by GitHub Actions
3. **Digital Ocean Droplet**: Hosts the LibreChat application
4. **MongoDB Atlas**: Cloud-hosted MongoDB database
5. **NGINX**: Reverse proxy for serving the application and handling SSL

## Prerequisites

- Digital Ocean account
- MongoDB Atlas account with a configured database
- Domain name pointed to your Digital Ocean droplet (e.g., chat.omniventus.com)
- GitHub repository for your LibreChat fork
- GitHub Personal Access Token with packages:read and packages:write scopes

## Step 1: Set Up GitHub Repository

1. Fork the [LibreChat repository](https://github.com/danny-avila/LibreChat) to your GitHub account
2. In your fork's repository settings, go to "Secrets and Variables" > "Actions"
3. Add the following secrets:
   - `CR_PAT`: Your GitHub Personal Access Token with package permissions

## Step 2: Create Digital Ocean Droplet

1. Log in to your Digital Ocean account
2. Create a new Droplet with:
   - Ubuntu 22.04 LTS
   - Basic plan (at least 2GB RAM, 1 CPU)
   - Add your SSH key or use password authentication
   - Choose a datacenter region close to your users
   - Add a name for your droplet (e.g., librechat-production)

## Step 3: Set Up Domain Name

1. In your domain registrar, point your domain (e.g., chat.omniventus.com) to your Digital Ocean droplet's IP address
2. Set up an A record for your domain pointing to your droplet's IP address

## Step 4: Configure the Server

1. SSH into your Digital Ocean droplet

   ```bash
   ssh root@your-droplet-ip
   ```

2. Clone this repository:

   ```bash
   git clone https://github.com/your-username/LibreChat.git
   cd LibreChat
   ```

3. Make the setup script executable and run it:

   ```bash
   chmod +x utils/docker/setup-server.sh
   ./utils/docker/setup-server.sh
   ```

4. Configure SSL certificates using Let's Encrypt:

   ```bash
   apt-get install certbot
   certbot certonly --standalone -d chat.omniventus.com

   # Copy certificates to NGINX SSL directory
   cp /etc/letsencrypt/live/chat.omniventus.com/fullchain.pem /etc/nginx/ssl/
   cp /etc/letsencrypt/live/chat.omniventus.com/privkey.pem /etc/nginx/ssl/
   ```

5. Set up automatic certificate renewal:
   ```bash
   crontab -e
   ```
   Add this line:
   ```
   0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/chat.omniventus.com/fullchain.pem /etc/nginx/ssl/ && cp /etc/letsencrypt/live/chat.omniventus.com/privkey.pem /etc/nginx/ssl/ && docker compose -f docker-compose.production.yml restart client
   ```

## Step 5: Configure Environment Variables

Edit the `.env` file in your project directory:

```bash
nano /opt/LibreChat/.env
```

Update at least the following variables:

```
# MongoDB settings
MONGO_URI=mongodb+srv://yourusername:yourpassword@yourcluster.mongodb.net/librechat

# Server settings
NODE_ENV=production
PORT=3080
HOST=0.0.0.0

# Client settings
DOMAIN_CLIENT=https://chat.omniventus.com
DOMAIN_SERVER=https://chat.omniventus.com

# Authentication settings
# (Configure as needed for your authentication method)
```

## Step 6: Deploy LibreChat

Use the deployment script to deploy LibreChat:

```bash
cd /opt/LibreChat
GITHUB_OWNER=LionelZoc ./utils/docker/deploy.sh
```

## GitHub Actions Workflow

The GitHub Actions workflow is configured to automatically build and push Docker images on:

- Pushes to the main branch
- Pull requests targeting the main branch
- Manual triggers from the GitHub Actions tab

The workflow:

1. Builds the Docker image for the API service
2. Pushes the image to the GitHub Container Registry
3. Tags the image with the SHA of the commit and "latest"

## Manual Deployment Commands

The Makefile includes commands for manual image building and deployment:

- `make docker-build`: Build the Docker image locally
- `make docker-push`: Push the Docker image to GitHub Container Registry
- `make docker-login`: Log in to GitHub Container Registry
- `make deploy-prod`: Deploy the latest image to production
- `make deploy-prod-build`: Build, push, and deploy in one step
- `make setup-ssl`: Set up SSL certificates using Let's Encrypt

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:

   - Check your MongoDB Atlas connection string
   - Ensure network access is configured in MongoDB Atlas

2. **NGINX SSL Configuration**:

   - Verify SSL certificates are in the correct location
   - Check NGINX configuration for errors

3. **Docker Image Pull Issues**:
   - Verify GitHub Container Registry authentication
   - Check that the image exists in your GitHub packages

### Logs

To check application logs:

```bash
docker compose -f docker-compose.production.yml logs api
docker compose -f docker-compose.production.yml logs client
```

## Maintenance

### Updating the Application

To update to the latest version:

1. Pull the latest changes from the upstream repository:

   ```bash
   git pull origin main
   ```

2. Deploy the updated version:
   ```bash
   ./utils/docker/deploy.sh
   ```

### Backup

Regularly backup your MongoDB data and environment configuration.

## Security Considerations

- Keep your MongoDB Atlas credentials secure
- Regularly update server packages with `apt-get update && apt-get upgrade`
- Use strong passwords for all services
- Consider implementing rate limiting and additional security measures

## Support

If you encounter issues with this deployment guide, please open an issue in the repository.
