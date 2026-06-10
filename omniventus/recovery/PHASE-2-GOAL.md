# Phase 2 — Merge upstream v0.8.6 from the green checkpoint

> ⚠️ **HUMAN REVIEW REQUIRED before running.** This file was drafted on 2026-06-10, before
> Phase 1 completed. Re-read and update it against reality (Phase 1 outcomes, current upstream
> version — pin an exact tag) before extracting the goal. Phase 1 must show `status: done` in
> STATE.md. Do not let an automated chain start this phase unattended.

**Read first:** `omniventus/DIAGNOSIS-2026-06-10.md` §5 (upstream gap analysis) and §6 Phase 4.
**Precondition:** `fork-v0.8.1-rc2` tag exists; builds green; STATE.md phase 1 = done.
**State baton:** update `omniventus/recovery/STATE.md` (set `phase: 2`) at start, milestones, completion.

## Intent

Merge upstream stable (v0.8.6 or the latest tag at execution time — PIN IT HERE: `________`)
into `custom-main` from the green checkpoint, **modernizing instead of porting blindly**:

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
7. `git rerere` is enabled — prior resolutions replay automatically; keep both sides on new conflicts.

## Hard constraints

- Same forbidden commands as Phase 1 (no abort/reset --hard/clean/force push; never delete omniventus/).
- Branch first: do the merge on `merge/upstream-<tag>`, only fast-forward `custom-main` when green.
- Commit in reviewable increments (one concern per commit); push the merge branch regularly.
- MongoDB migrations (`npm run migrate:agent-permissions`, `migrate:prompt-permissions`) are run
  with `:dry-run` against a LOCAL database only — never against Atlas prod.

## DONE-WHEN checklist (every item demonstrated by command output)

1. `git merge <pinned-tag>` completed on the merge branch; zero conflict markers (`git grep` proof).
2. `npm run build:packages`, `npm run frontend` exit 0 under the tsdown toolchain.
3. `npm run test:api` and `npm run test:client` exit 0, or failures proven pre-existing on the vanilla pinned tag.
4. Backend boots; `curl .../health` prints 200 with local MongoDB.
5. Feature-integrity demonstrated for: Manager role semantics on the new permission system; user admin
   working via upstream admin API; Business Actions SSE end-to-end; shared-files fields live on the new
   file model; preloadFiles() running at startup; chips rendered in the new Chat/Input structure;
   Notion available as MCP server in librechat.yaml.
6. Migration dry-runs executed locally and their output shown.
7. `custom-main` fast-forwarded, pushed; tag `fork-<pinned-tag>` pushed; ledger + STATE.md
   (phase 2 status: done) committed and pushed.

## The goal line (extract only AFTER human review + pinning the tag)

```goal
Verify omniventus/recovery/STATE.md shows phase 1 status done and a fork-v0.8.1-rc2 tag exists — if not, set nothing, report, and stop. Then read omniventus/recovery/PHASE-2-GOAL.md and omniventus/DIAGNOSIS-2026-06-10.md §5-6 and execute Phase 2: merge the pinned upstream tag into a merge/upstream-<tag> branch from the green checkpoint, modernizing per the file's Intent list (tsdown builds, adopt native Admin Users API, re-express Manager role on expanded permissions, re-port shared files onto the new file model, re-place chips in Chat/Input, convert Notion tool to MCP server), updating STATE.md at start, milestones, completion. HARD CONSTRAINTS: never run git merge --abort, git reset --hard, git checkout -- ., git clean, git stash drop, or force push; never delete omniventus/; work on the merge branch and only fast-forward custom-main when green; DB migrations only as dry-runs on a local database, never Atlas. The goal is MET only when every DONE-WHEN item in the file is demonstrated by command output in this conversation — when claiming completion, re-print the checklist with evidence per item (zero markers, builds exit 0, tests pass or pre-existing, /health 200, all seven feature demonstrations, dry-run outputs, custom-main fast-forwarded + tagged + pushed, STATE.md phase 2 done). Or stop after 120 turns, set STATE.md status to blocked with the reason, and summarize what remains.
```
