#!/bin/bash

# This script checks what processes are using ports 80 and 443 on the system
# It helps diagnose port conflicts when deploying LibreChat

echo "Checking what processes are using ports 80 and 443..."
echo ""

echo "=== Processes using port 80 (HTTP) ==="
if command -v lsof &> /dev/null; then
    sudo lsof -i :80
elif command -v netstat &> /dev/null; then
    sudo netstat -tulpn | grep :80
else
    echo "Neither lsof nor netstat is available. Please install one of them."
fi

echo ""
echo "=== Processes using port 443 (HTTPS) ==="
if command -v lsof &> /dev/null; then
    sudo lsof -i :443
elif command -v netstat &> /dev/null; then
    sudo netstat -tulpn | grep :443
else
    echo "Neither lsof nor netstat is available. Please install one of them."
fi

echo ""
echo "If you see any processes listed above, they are currently using ports 80 and/or 443."
echo "Options to resolve this conflict:"
echo "1. Stop the conflicting services:"
echo "   sudo systemctl stop nginx  # If NGINX is running"
echo "   sudo systemctl stop apache2  # If Apache is running"
echo ""
echo "2. Use alternative ports in your deployment:"
echo "   export NGINX_HTTP_PORT=8080"
echo "   export NGINX_HTTPS_PORT=8443"
echo "   Then run your deployment command"
echo ""
echo "3. Configure a reverse proxy to forward traffic from ports 80/443 to your LibreChat ports" 