# Phase 2 — Merge upstream v0.8.6 from the green checkpoint

> ✅ **Human review completed 2026-06-11.** Tag pinned, Phase 1 outcomes folded in below.
> Precondition verified: `fork-v0.8.1-rc2` = d21154eb3, tree clean, STATE.md phase 1 = done.

**Pinned upstream tag: `v0.8.6`** (exists as a git tag; do NOT merge upstream/main — it has drifted past the release).

**Read first:** `omniventus/DIAGNOSIS-2026-06-10.md` §5 (upstream gap analysis) and §6 Phase 4, then the
"Reality update" section below — it records Phase 1 porting decisions this merge must respect.
**State baton:** update `omniventus/recovery/STATE.md` (set `phase: 2`) at start, milestones, completion.

## Reality update from Phase 1 (2026-06-11) — decisions this merge must respect

- All customizations are **in-place** with `// [OMNIVENTUS]` comment fences, logged in `omniventus/README.md`
  (2026-06-11 ledger section). The `@omniventus/*` alias wiring was reverted — do not resurrect it.
- MANAGER role was re-expressed on upstream's **nested `permissions:` structure** in `roles.ts`;
  `USER_ADMIN`/`DELETE` live in-place in `permissions.ts`.
- Shared-files fields were restored on `packages/data-schemas` `file.ts`/`user.ts`/`role.ts`
  (mongoose strict mode silently drops unknown fields — re-verify after the merge).
- `client/src/components/ui/index.ts` is a **compatibility barrel** re-exporting `@librechat/client`
  (upstream deleted that folder; the fork's user-admin UI still imports from it). `MultiSelectDropDown`
  was restored from v0.7.7. When modernizing, migrating imports to `@librechat/client` directly and
  deleting the barrel is preferred over keeping the shim.
- `preloadFiles()` is invoked in `api/server/index.js` after `updateInterfacePermissions`.
- `git rerere` is enabled — prior resolutions replay automatically.

## Operational guardrails (learned in Phase 1)

- ⚠️ **`.env` MONGO_URI points at the Atlas PRODUCTION cluster. Never boot or test against it.**
  Always override with a local instance, e.g. `MONGO_URI=mongodb://localhost:27017/librechat-dev`
  with `docker run -d -p 27017:27017 mongo`.
- `npm run build:packages` and jest **hang when run sandboxed or in background** on this machine —
  run them in foreground with sandbox disabled.

## Context strategy (per CLAUDE.local.md orchestration rule)

This is a big task: orchestrate, don't solo. Delegate **read-only investigation** to subagents with
self-contained prompts (e.g., per-feature analysis: "how did upstream change X between v0.8.1-rc2 and
v0.8.6, and where should the fork's Y re-attach?"). Keep **all edits serialized in the main session**
(one git index, conflict decisions build on each other). After each work unit, dispatch **separate
validation subagents** (never the author) to check builds/tests/feature integrity, and loop on findings.

## Intent

Merge tag `v0.8.6` into `custom-main` from the green checkpoint, **modernizing instead of porting blindly**:

1. **Build system**: adopt tsdown builds for all packages (upstream migrated off rollup).
2. **User admin**: adopt upstream's native Admin Users API (`api/server/routes/admin/`,
   `packages/api/src/admin/*`); retire the redundant parts of custom `UsersController.js` /
   `routes/users.js`; keep only custom UI deltas upstream lacks.
3. **Manager role**: re-express on upstream's expanded permission system (MCP_SERVERS,
   REMOTE_AGENTS, SKILLS, SHARED_LINKS types + system grants + OpenID role sync).
4. **Shared files / RAG preload**: re-port onto the migrated file model
   (`packages/data-schemas/src/models/file.ts`, TypeScript + tenant isolation).
5. **Prompt chips**: re-place SharedPromptList in the restructured `client/src/components/Chat/Input/`.
6. **Notion tool**: convert to an **MCP server** registered in `librechat.yaml`; delete the
   1,472-line structured tool (zero merge surface going forward).

## Hard constraints

- Same forbidden commands as Phase 1 (no abort/reset --hard/clean/force push; never delete omniventus/).
- Branch first: do the merge on `merge/upstream-v0.8.6`, only fast-forward `custom-main` when green.
- Commit in reviewable increments (one concern per commit); push the merge branch regularly.
- MongoDB migrations (`npm run migrate:agent-permissions`, `migrate:prompt-permissions`) are run
  with `:dry-run` against a LOCAL database only — never against Atlas prod.

## DONE-WHEN checklist (every item demonstrated by command output)

1. `git merge v0.8.6` completed on `merge/upstream-v0.8.6`; zero conflict markers (`git grep` proof).
2. `npm run build:packages`, `npm run frontend` exit 0 under the tsdown toolchain.
3. `npm run test:api` and `npm run test:client` exit 0, or failures proven pre-existing on the vanilla v0.8.6 tag.
4. Backend boots; `curl .../health` prints 200 with **local** MongoDB (overridden MONGO_URI).
5. Feature-integrity demonstrated for: Manager role semantics on the new permission system; user admin
   working via upstream admin API; Business Actions SSE end-to-end; shared-files fields live on the new
   file model; preloadFiles() running at startup; chips rendered in the new Chat/Input structure;
   Notion available as MCP server in librechat.yaml.
6. Migration dry-runs executed locally and their output shown.
7. `custom-main` fast-forwarded, pushed; tag `fork-v0.8.6` pushed; ledger + STATE.md
   (phase 2 status: done) committed and pushed.

## The goal line (extracted by run-recovery.sh, or paste after `/goal`)

```goal
Verify omniventus/recovery/STATE.md shows phase 1 status done and the fork-v0.8.1-rc2 tag exists — if not, report and stop. Then read omniventus/recovery/PHASE-2-GOAL.md (including its Reality update, Operational guardrails, and Context strategy sections) and omniventus/DIAGNOSIS-2026-06-10.md §5-6, and execute Phase 2: merge the pinned tag v0.8.6 into a merge/upstream-v0.8.6 branch from the green checkpoint, modernizing per the file's Intent list (tsdown builds, adopt native Admin Users API, re-express Manager role on expanded permissions, re-port shared files onto the new file model, re-place chips in Chat/Input, convert Notion tool to MCP server), updating STATE.md at start, milestones, completion. Orchestrate per the Context strategy: delegate read-only investigation and validation to subagents, keep all edits serialized in the main session. HARD CONSTRAINTS: never run git merge --abort, git reset --hard, git checkout -- ., git clean, git stash drop, or force push; never delete omniventus/; work on the merge branch and only fast-forward custom-main when green; NEVER boot or run anything against the Atlas MONGO_URI in .env — always override with a local MongoDB URI; DB migrations only as dry-runs on a local database; run build:packages and jest in foreground with sandbox disabled (they hang otherwise). The goal is MET only when every DONE-WHEN item in the file is demonstrated by command output in this conversation — when claiming completion, re-print the checklist with evidence per item (zero markers, builds exit 0, tests pass or pre-existing on vanilla v0.8.6, /health 200 on local Mongo, all seven feature demonstrations, dry-run outputs, custom-main fast-forwarded + tagged fork-v0.8.6 + pushed, STATE.md phase 2 done). Or stop after 120 turns, set STATE.md status to blocked with the reason, and summarize what remains.
```
