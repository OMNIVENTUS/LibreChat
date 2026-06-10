# Deploying LibreChat behind Traefik

This supersedes the nginx-sidecar approach in [`DEPLOYMENT.md`](./DEPLOYMENT.md). On the
droplet, a single **Traefik** reverse proxy (its own project under `/opt/proxy`) owns ports
80/443 and handles SSL for **every** project — LibreChat today, Strapi and others later —
so there are no port conflicts and no per-project nginx config to maintain.

## Architecture

```
Internet :80/:443
      │
      ▼
  Traefik (/opt/proxy, project "proxy")     ← only public entrypoint; ACME / Let's Encrypt
      │  (shared external docker network: "web")
      ├── chat.omniventus.com  ──►  LibreChat-API:3080
      └── (future projects … each via labels + the "web" network)
```

- **`docker-compose.traefik.yml`** (this repo, project `librechat`): the LibreChat stack —
  `api`, `meilisearch`, `vectordb`, `rag_api`. No nginx `client`; `api` is `expose`d (not
  published) and joined to the external `web` network with Traefik routing labels.
- **`utils/docker/proxy/docker-compose.yml`**: the standalone Traefik project (deployed to
  `/opt/proxy`).
- MongoDB is **not** in the compose — production uses **MongoDB Atlas** via `MONGO_URI` in `.env`.

## First-time setup

```bash
# 1. Shared network (once)
docker network create web

# 2. Traefik project
sudo mkdir -p /opt/proxy/letsencrypt
sudo cp utils/docker/proxy/docker-compose.yml /opt/proxy/docker-compose.yml
sudo touch /opt/proxy/letsencrypt/acme.json && sudo chmod 600 /opt/proxy/letsencrypt/acme.json

# 3. Issue a STAGING cert first (avoid burning the LE production rate limit):
#    uncomment the `caserver` staging line in /opt/proxy/docker-compose.yml, then:
cd /opt/proxy && docker compose up -d
docker logs traefik 2>&1 | grep -iE 'acme|certificate|error'
echo | openssl s_client -connect chat.omniventus.com:443 -servername chat.omniventus.com 2>/dev/null \
  | openssl x509 -noout -issuer -dates           # issuer must contain "(STAGING)"

# 4. Switch to the REAL cert: re-comment the staging line, wipe the store, restart:
cd /opt/proxy && docker compose down
: > letsencrypt/acme.json && chmod 600 letsencrypt/acme.json
docker compose up -d

# 5. Deploy LibreChat
cd /path/to/LibreChat && ./utils/docker/deploy-traefik.sh
```

Verify: `curl -sI https://chat.omniventus.com | head -1` returns `HTTP/2 200` **without** `-k`,
and the cert issuer is `Let's Encrypt` (no `(STAGING)`).

## Migrating from the nginx stack (host nginx or the `client` sidecar)

The old setup terminated TLS with nginx (a host `systemd` nginx, or the docker `client`
service) proxying to `localhost:3080`. To cut over:

```bash
# Free 80/443 — stop whatever currently terminates TLS, and the certbot timer
sudo systemctl stop nginx && sudo systemctl disable nginx           # if a HOST nginx owns 80/443
sudo systemctl stop certbot.timer && sudo systemctl disable certbot.timer
# (the docker `client` sidecar, if any, is removed automatically by --remove-orphans below)

# Start Traefik (see "First-time setup"), then deploy LibreChat in Traefik mode:
./utils/docker/deploy-traefik.sh
```

## Rollback

The previous certs and stack are left intact as a safety net:

```bash
cd /opt/proxy && docker compose down                # release 80/443
sudo systemctl enable --now nginx                   # restore the host nginx (if that was the setup)
sudo systemctl enable --now certbot.timer
docker compose -p librechat -f docker-compose.production.yml up -d   # legacy nginx-sidecar stack
```

## Operational notes / gotchas

- **Renewal is automatic.** Traefik owns port 80 permanently and renews via HTTP-01 ~30 days
  before expiry. No certbot cron needed (disable the old one — see migration above).
- **Never delete `/opt/proxy/letsencrypt/acme.json`** once it holds a real cert — that forces
  re-issuance and risks the production rate limit. Back it up instead.
- **`--remove-orphans`** is what removes the legacy `LibreChat-NGINX` container when switching.
  Never pass `-v` to `docker compose down` — it would delete the `pgdata2` named volume.
- **Memory:** the droplet needs swap and ≥ 2 GB RAM. Meilisearch OOM-loops on a 1 GB box;
  a 2 GB swapfile stabilizes it and leaves headroom for Traefik. Upgrade to ≥ 2 GB before
  adding a second app (e.g. Strapi).
- **`vectordb`** is on `librechat-network` here (it was on the default network in
  `docker-compose.production.yml`, which isolated it from `rag_api`).
