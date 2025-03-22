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

- `make docker-build`: Build the Docker image locally for the current platform
- `make docker-build-amd64`: Build the Docker image specifically for AMD64 platform (used by Digital Ocean)
- `make docker-build-multi`: Build multi-platform Docker image for both AMD64 and ARM64
- `make docker-push`: Push the Docker image to GitHub Container Registry
- `make docker-login`: Log in to GitHub Container Registry
- `make deploy-prod`: Deploy the latest image to production
- `make deploy-prod-build`: Build for AMD64, push, and deploy in one step
- `make setup-ssl`: Set up SSL certificates using Let's Encrypt

For Digital Ocean deployments, always use the `docker-build-amd64` command or `deploy-prod-build` to ensure platform compatibility.

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

## Platform Compatibility

When deploying to Digital Ocean, you might encounter platform compatibility issues. Digital Ocean droplets typically run on AMD64 (x86_64) architecture, which requires Docker images that support this platform.

### Handling Platform Compatibility Issues

If you encounter errors like `no matching manifest for linux/amd64 in the manifest list entries`, try these solutions:

1. **Specify platform in docker-compose.production.yml**:

   ```yaml
   services:
     api:
       image: ghcr.io/danny-avila/librechat:latest
       platform: linux/amd64
       # Other configuration...
   ```

2. **Use specific image versions known to support AMD64**:

   - For NGINX: `nginx:1.25-alpine`
   - For MeiliSearch: `getmeili/meilisearch:v1.5`
   - For Postgres/Vector DB: `postgres:15-alpine`

3. **Build multi-platform images in your GitHub Actions workflow**:
   The included GitHub Actions workflow is configured to build images for both AMD64 and ARM64 architectures, making them compatible with various deployment environments.

### Docker Build Disk Space Issues

When building Docker images for LibreChat, you might encounter disk space errors like:

```
npm warn tar TAR_ENTRY_ERROR ENOSPC: no space left on device, write
```

This is because the Node.js dependencies are quite large. To resolve this:

1. **Clean up Docker environment first**:

   ```bash
   make docker-cleanup
   ```

2. **Try the direct build method** (without buildx):

   ```bash
   make docker-build-amd64-direct
   ```

3. **Increase available disk space** on your build machine:

   - On Docker Desktop, you can increase disk space in Settings → Resources → Disk image size
   - On Linux servers, consider adding more disk space or cleaning up unused files

4. **Build directly on Digital Ocean**:
   If building locally continues to fail, you can build directly on your Digital Ocean droplet:

   ```bash
   # SSH into your Digital Ocean droplet
   ssh root@your-droplet-ip

   # Clone your repository
   git clone https://github.com/your-username/LibreChat.git
   cd LibreChat

   # Build the image directly (no cross-compilation needed)
   docker build -t ghcr.io/your-username/librechat:latest -f Dockerfile.multi --target api-build .

   # Login to GitHub Container Registry
   echo YOUR_GITHUB_PAT | docker login ghcr.io -u your-username --password-stdin

   # Push the image
   docker push ghcr.io/your-username/librechat:latest
   ```
