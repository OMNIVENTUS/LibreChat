# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **OMNIVENTUS's long-lived fork of [LibreChat](https://github.com/danny-avila/LibreChat)** (currently `v0.8.1-rc2`). The fork adds custom features while staying mergeable with upstream. Two git remotes exist:

- `origin` → `OMNIVENTUS/LibreChat` (the fork)
- `upstream` → `danny-avila/LibreChat` (upstream LibreChat)

Branches: `custom-main` is the active working branch, `develop` is the integration branch, `feat/*` are feature branches, `main`/`prod` track deploys.

### Fork philosophy (read before changing upstream files)

Because upstream updates are merged in regularly, **minimize edits to upstream files**. When customizing, prefer (in order): middleware overrides, wrapper modules, feature flags, and custom folders. Work happens mainly on the **client** side. Every file that diverges from upstream must be logged in `omniventus/README.md` using the convention `[UPDATE]`, `[OVERRIDE]`, `[TO_REMOVE]`, `[TODO]` — this ledger is how a future merge knows what to re-apply. The `omniventus/` directory also holds copies/backups of overridden files and its own workspace packages (`omniventus/packages/*`).

When adding recurring dev workflows, add a target to the root `Makefile` so the team can reuse them.

## Common commands

All commands run from the repo root unless noted. The monorepo uses **npm workspaces**: `api`, `client`, `packages/*`, `omniventus/packages/*`.

```bash
npm ci                      # install (also: make install)

# Dev (two processes — backend on :3080, vite frontend on :3090 proxying to :3080)
npm run backend:dev         # nodemon, NODE_ENV=development
npm run frontend:dev        # vite dev server — view live client changes at http://localhost:3090
make dev                    # runs both concurrently

# Build — packages MUST be built before the client (see "Build order" below)
npm run build:packages      # data-provider → data-schemas → api → client-package
npm run frontend            # build:packages + client production build
npm run backend             # NODE_ENV=production node api/server/index.js

# Lint & format
npm run lint                # npm run lint:fix to autofix
npm run format              # prettier

# Tests
npm run test:api            # cd api && jest --ci
npm run test:client         # cd client && jest --ci
make test                   # both

# Single backend test (from api/)
cd api && cross-env NODE_ENV=test npx jest path/to/file.spec.js
cd api && cross-env NODE_ENV=test npx jest -t "test name substring"

# E2E (Playwright, against a running app)
npm run e2e                 # local config; e2e:headed, e2e:debug, e2e:ci also available

# Docker
make docker-dev             # docker compose up --build (full local stack)
make docker-prod            # deploy-compose.yml
```

A parallel set of **`b:*` scripts** (e.g. `b:client`, `b:api:dev`) run the same builds/tests under **Bun** instead of Node.

### Admin / operational scripts (run from root)

User & balance management: `npm run create-user`, `invite-user`, `list-users`, `ban-user`, `delete-user`, `add-balance`, `set-balance`, `list-balances`, `user-stats`. Cache/terms: `flush-cache`, `reset-terms`. Permission migrations: `npm run migrate:agent-permissions` and `migrate:prompt-permissions` (each has `:dry-run` and `:batch` variants).

## Configuration

- `.env` — secrets and runtime config (`make setup-env` copies `.env.example`). Several local variants exist (`env.tarik`, etc.).
- `librechat.yaml` — the main LibreChat config: AI endpoints, MCP servers, interface toggles, allowed action domains. When adding Business Actions that call external services, add the domain to the allowed domains here.

## Architecture (the big picture)

### Three layers + shared packages

- **`api/`** — Express backend (Node). Entry point `api/server/index.js`. Uses the `~/` path alias for the `api/` root (e.g. `require('~/server/middleware')`).
- **`client/`** — React + Vite SPA. State via **Recoil** (`client/src/store`) + **TanStack React Query** + Jotai utils.
- **`packages/`** — shared workspaces consumed by both:
  - `data-provider` → published as `librechat-data-provider`: shared TS types, Zod schemas, API client, and the data-service layer used across api and client. This is the contract between front and back.
  - `data-schemas` → Mongoose schemas/models.
  - `api` → shared backend logic (agents, tools, MCP, files, memory, oauth, crypto).
  - `client` → shared React component library (`librechat-client`).
  - `mcp` → Model Context Protocol support.

**Build order matters:** `client` and `api` import the *built* output of these packages, not their source. Run `npm run build:packages` (data-provider → data-schemas → api → client-package) before building/running the client, or after changing any shared package. `npm run frontend` chains this for you.

### Backend request & streaming flow

`api/server/routes/*` → controllers → `api/app/clients/` (provider clients). `BaseClient` is the shared base; provider clients are `AnthropicClient`, `OpenAIClient`, `GoogleClient`, `OllamaClient`. Modern agent logic lives in `packages/api/src/agents` (the legacy `ChatGPTClient`, `PluginsClient`, and `api/app/clients/agents/*` have been removed in this fork).

Streaming: a controller (e.g. AskController) calls `client.sendMessage()` with an `onProgress` callback; each AI token is written to the response as an SSE event; the controller ends with a `final: true` event and `res.end()`. The client renders these events in real time.

RAG: file-augmented queries are routed to the external **RAG API** (separate service, Docker container, docs at `[RAG_API_HOST]:8000/docs`) which does similarity search against a vector store and returns enriched context.

## OMNIVENTUS custom features

These are the fork's additions — touch them with the fork philosophy above in mind:

- **Roles & permissions**: added a `Manager` role, a `USER_ADMIN` permission type (gates the user-admin feature), and a `DELETE` permission. Defined in `packages/data-provider/src/roles.ts` and `permissions.ts` (overridden — see `omniventus/`).
- **User administration**: admin-only user management UI, backed by `api/server/routes/users.js` → `UsersController` (guarded by `requireJwtAuth` + `checkAdmin`).
- **Business Actions**: contextual action buttons/links rendered above AI responses, populated by non-AI backend processes. Service: `api/server/services/BusinessActionsService.js`; bootstrapped by `initBusinessActions()` (called in `api/server/index.js`); providers in `api/server/services/actions/` (`MovieActionsProvider`, `SearchActionsProvider`). Add a provider by creating a file there, implementing `getActions`, and registering it in `initBusinessActions.js`.
- **Notion tool**: structured tool at `api/app/clients/tools/structured/Notion.js` (the `make notion-*` Makefile targets exercise the Notion REST API directly).
- **Preloaded / shared files in RAG**, file-scope display, and restrictions on deleting files not owned by the user.
- **Prompt chips** displayed above the chat.

`omniventus/README.md` is the authoritative running log of customizations, open TODOs, and design notes — consult it before extending any custom feature.
