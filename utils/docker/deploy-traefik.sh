#!/bin/bash
set -e

# Deploy LibreChat behind the centralized Traefik reverse proxy (Traefik mode).
# Successor to utils/docker/deploy.sh, which deploys the legacy nginx-sidecar stack.
#
# Usage (from anywhere):  ./utils/docker/deploy-traefik.sh
# Assumes the Traefik project lives at $PROXY_DIR (default /opt/proxy).

cd "$(dirname "$0")/../.." || exit 1   # repo root

PROXY_DIR="${PROXY_DIR:-/opt/proxy}"
PROJECT="${COMPOSE_PROJECT:-librechat}"
COMPOSE_FILE="docker-compose.traefik.yml"

echo "==> Ensuring shared 'web' network exists..."
docker network create web 2>/dev/null || true

echo "==> Ensuring Traefik is running..."
if ! docker ps --format '{{.Names}}' | grep -q '^traefik$'; then
  if [ -f "$PROXY_DIR/docker-compose.yml" ]; then
    echo "    Traefik not running — starting it from $PROXY_DIR"
    (cd "$PROXY_DIR" && docker compose up -d)
  else
    echo "ERROR: Traefik is not running and $PROXY_DIR/docker-compose.yml is missing." >&2
    echo "       Copy utils/docker/proxy/docker-compose.yml to $PROXY_DIR and read DEPLOYMENT-TRAEFIK.md." >&2
    exit 1
  fi
fi

[ -f .env ]          || { echo "ERROR: .env not found.";          exit 1; }
[ -f librechat.yaml ] || { echo "ERROR: librechat.yaml not found."; exit 1; }

echo "==> Pulling latest images..."
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" pull

echo "==> Deploying LibreChat (Traefik mode)..."
# --remove-orphans clears the legacy nginx `client` container if switching from the old stack.
docker compose -p "$PROJECT" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Done. Available at https://chat.omniventus.com"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "traefik|LibreChat|chat-" || true
