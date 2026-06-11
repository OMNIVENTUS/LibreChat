# Recovery state — baton file

This file is the shared state between recovery phases, monitoring sessions, and humans.
Whichever session is executing a phase MUST update it: set `status: in-progress` when starting,
append a log line at every significant milestone, and set `status: done` + commit + push when
the phase's DONE-WHEN checklist passes.

**Single-writer rule: only ONE session may execute a phase (and write to this repo) at a time.**
Monitoring sessions may read this file but never write to the repo.

## Current

- phase: 2
- status: done               <!-- not-started | in-progress | done | blocked -->
- owner: claude-code session 2026-06-11
- updated: 2026-06-11
- last_commit: f8ce14faa     <!-- last recovery commit sha (see log for close-out commit) -->
- blocker: —                 <!-- required when status=blocked: what and why -->

## Phase index

| Phase | Mission file | Goal | Status |
|---|---|---|---|
| 1 | [PHASE-1-GOAL.md](PHASE-1-GOAL.md) | Commit everything + fix-forward to green, bootable v0.8.1-rc2 checkpoint | done |
| 2 | [PHASE-2-GOAL.md](PHASE-2-GOAL.md) | Merge upstream v0.8.6 from the checkpoint, modernize features | done |

## Log

- 2026-06-10 — recovery plan created from diagnosis (see ../DIAGNOSIS-2026-06-10.md); state file initialized.
- 2026-06-10 — phase 1 started. Safety net done: tar backup ../librechat-backup-20260610.tar.gz (393M), rerere enabled, staged merge committed as-is (18338da90), omniventus layer + recovery docs committed (071c0ce96), pushed to origin/custom-main.
- 2026-06-10 — B5: broken @omniventus alias wiring reverted to in-place merge-state versions (2332b3c03).
- 2026-06-10 — B1+B2: all 12 conflict-marker files resolved keeping both sides; USER_ADMIN/DELETE ported to permissions.ts; MANAGER re-expressed on upstream nested structure (d352b6f21).
- 2026-06-10 — B3+B4: scope/access_control + file_access_groups schema fields restored; preloadFiles() bootstrap re-wired (15a3c555a).
- 2026-06-11 — C: client build fixed (ui barrel shim, endpoint dedupe, MultiSelectDropDown restore) (2cd7829a0); api fixes (roles middleware, UsersController, stale bedrock mount) (a0c7420b3).
- 2026-06-11 — phase 1 DONE. Evidence: git status clean+pushed; zero conflict markers; build:packages exit 0; npm run frontend exit 0; test:api 1636 passed exit 0; test:client 816 passed exit 0; backend boot vs local Docker mongo → /health 200; all feature-integrity greps pass; tag fork-v0.8.1-rc2.
- 2026-06-11 — phase 2 STARTED (human review completed, tag pinned: v0.8.6 = 566e20b61). Branch merge/upstream-v0.8.6 from fork-v0.8.1-rc2 (d21154eb3).
- 2026-06-11 — merge committed (1fe08fbf1): 39 conflicts resolved, zero markers. NOTE: v0.8.6 still builds with rollup+turbo — tsdown is a later upstream release; "tsdown" intent satisfied by adopting v0.8.6's actual toolchain.
- 2026-06-11 — admin modernization (887cf4170): native /api/admin/users adopted (list/search/delete), MANAGER granted access:admin/read:users/manage:users via system grants, fork backend reduced to PUT /api/users/:userId.
- 2026-06-11 — business actions completed (f50fcd33f, 7b28ace5c): contextualActions generated in agents/request.js, delivered over SSE and persisted.
- 2026-06-11 — Notion → MCP: structured tool deleted; official @notionhq/notion-mcp-server registered as `notion` in librechat.yaml; MCP init confirmed in boot logs.
- 2026-06-11 — builds green (build:packages + client exit 0); test:client 2286 passed; test:api 143/144 suites green — responses.spec.js fails identically on vanilla v0.8.6 (ANTHROPIC_API_KEY-gated integration suite).
- 2026-06-11 — boot vs local Mongo: /health 200; demos: MANAGER role+grants seeded, admin API list/delete, file scope visibility, preloadFiles at startup, chips in ChatForm, business actions SSE+persisted, migration dry-runs exit 0.
- 2026-06-11 — independent validation agent: 8/8 PASS, SAFE TO FAST-FORWARD. custom-main fast-forwarded e0dbd2232..f8ce14faa; tag fork-v0.8.6. phase 2 DONE.
