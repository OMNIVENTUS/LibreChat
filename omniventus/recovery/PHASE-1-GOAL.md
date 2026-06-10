# Phase 1 — Commit everything, fix-forward to a green v0.8.1-rc2 checkpoint

**Read first:** `omniventus/DIAGNOSIS-2026-06-10.md` (full context, fix lists, file-by-file findings).
**State baton:** update `omniventus/recovery/STATE.md` when starting, at milestones, and on completion.

## Situation (as of 2026-06-10)

- Branch `custom-main` holds an **uncommitted** ~2,100-file merge of upstream v0.8.1-rc2 (`.git/MERGE_HEAD` = f55bd6f99).
- `omniventus/` and `CLAUDE.md` are **untracked** — committed nowhere.
- 12 staged files still contain conflict markers; backend/client/data-provider are unbuildable as staged.
- An unstaged "externalize to @omniventus aliases" refactor layer sits on top — its wiring is broken; do NOT pursue it in this phase.

## Hard constraints

- NEVER run: `git merge --abort`, `git reset --hard`, `git checkout -- .`, `git clean`, `git stash drop`, or any force push.
- NEVER delete or overwrite `omniventus/`.
- Safety steps come FIRST, in order, before any fixing (step A below).
- Resolve conflicts by **keeping both sides** (custom feature + upstream change).
- Customizations go **in-place** in upstream files, fenced with `// [OMNIVENTUS]` comments. The broken alias wiring is out of scope for this phase.

## Procedure

### A. Safety net (do first, in this order)
1. `tar --exclude='node_modules' --exclude='client/dist' -czf ../librechat-backup-$(date +%Y%m%d).tar.gz .`
2. `git config rerere.enabled true`
3. Commit the staged merge AS-IS: `git commit --no-verify -m "WIP: merge v0.8.1-rc2 into custom-main (markers remain, see omniventus/DIAGNOSIS-2026-06-10.md)"`
4. `git add -A` (picks up omniventus/, CLAUDE.md, unstaged layer) and commit: `"WIP: omniventus externalization layer + recovery docs (incomplete wiring)"`
5. `git push origin custom-main`
6. Update STATE.md → `status: in-progress`, log the two commit SHAs.

### B. Fix-forward (per diagnosis §6 Phase 2)
1. Resolve the 12 conflict-marker files, keeping both sides:
   `Message.js` (contextualActions + feedback), `config.js` (fileAccessGroups + upstream keys),
   `files.js`, `ChatForm.tsx` (SharedPromptList + upstream layout), `Files/Table/Columns.tsx`,
   `en|fr/translation.json`, `actions.ts` (6 blocks), `data-service.ts`, `roles.ts`,
   `.env.example`, `README.md`.
2. Port `USER_ADMIN` / `DELETE` / `userAdminPermissionsSchema` into `packages/data-provider/src/permissions.ts`; repair `roles.ts`.
3. Re-add the shared-files schema fields in `packages/data-schemas`: `scope`/`access_control` + `file_access_groups` on the file and user schemas (mongoose strict mode silently drops unknown fields).
4. Re-add the `preloadFiles()` bootstrap call in the v0.8.1 api startup path (old home `AppService.js` was rewritten upstream).
5. Decide unstaged-layer leftovers: revert any remaining broken alias edits (they're reproducible from `omniventus/` copies); keep `omniventus/` itself committed as documentation + future packages.
6. Commit in small logical commits; push regularly.

### C. Verify, then close out
1. Run every DONE-WHEN check below and show the output.
2. Update `omniventus/README.md` ledger to reflect what changed.
3. Update STATE.md → `status: done`, `last_commit`, log line. Commit + push.
4. Tag: `git tag fork-v0.8.1-rc2 && git push origin fork-v0.8.1-rc2`.

## DONE-WHEN checklist (every item demonstrated by command output)

1. `git status --porcelain` is empty; all commits pushed to `origin/custom-main`.
2. `git grep -nE '^(<{7} |>{7} )'` and `git grep -n '^=======$' -- ':!*.md'` → no matches.
3. `npm run build:packages` exits 0.
4. `npm run frontend` exits 0.
5. `npm run test:api` and `npm run test:client` exit 0 — OR every remaining failure is shown to also fail on vanilla `main` (f55bd6f99) and is listed as pre-existing.
6. With MongoDB available locally (e.g. `docker run -d -p 27017:27017 mongo`), backend starts and `curl -s -o /dev/null -w '%{http_code}' http://localhost:3080/health` prints `200`.
7. Feature-integrity greps pass: MANAGER + USER_ADMIN in `roles.ts`; USER_ADMIN + DELETE in `permissions.ts`; contextualActions AND feedback in `api/models/Message.js`; initBusinessActions required+invoked in `api/server/index.js`; SharedPromptList rendered in `ChatForm.tsx`; scope/access + file_access_groups fields in data-schemas file/user schemas; `preloadFiles()` invoked at startup; notion registered in `handleTools.js`.
8. `omniventus/README.md` ledger updated; STATE.md shows phase 1 `status: done`, committed and pushed.

## The goal line (single source of truth — extracted by run-recovery.sh, or paste after `/goal`)

```goal
Read omniventus/recovery/PHASE-1-GOAL.md and omniventus/DIAGNOSIS-2026-06-10.md, then execute Phase 1 exactly as written: safety steps A first (tar backup, rerere on, commit staged merge AS-IS with --no-verify, commit omniventus/ + CLAUDE.md + unstaged layer, push origin custom-main), then fix-forward per section B, updating omniventus/recovery/STATE.md at start, milestones, and completion. HARD CONSTRAINTS: never run git merge --abort, git reset --hard, git checkout -- ., git clean, git stash drop, or any force push; never delete omniventus/; keep BOTH sides when resolving conflicts; customizations in-place with // [OMNIVENTUS] fences, do not pursue the @omniventus alias wiring. The goal is MET only when every item of the file's DONE-WHEN checklist has been demonstrated by command output in this conversation — when claiming completion, re-print the full checklist with the evidence for each item, including: git status --porcelain empty and pushed; zero conflict markers via git grep; npm run build:packages, npm run frontend exit 0; test suites pass or failures proven pre-existing on vanilla main; backend boots and /health returns 200 with local MongoDB; all feature-integrity greps pass; ledger and STATE.md (phase 1 status: done) committed and pushed. Or stop after 60 turns, set STATE.md status to blocked with the reason, and summarize exactly what remains.
```
