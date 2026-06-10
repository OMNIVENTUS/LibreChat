# Repo Diagnosis — OMNIVENTUS/LibreChat fork

**Date:** 2026-06-10 · **Author:** Claude (4 parallel analysis agents + synthesis)
**Scope:** full state audit of the fork, the in-progress merge, the `omniventus/` strategy, and the path forward.

---

## 1. Executive summary

The fork is in a **fragile but recoverable** state. Three critical problems, in order of urgency:

1. **Nothing recent is committed.** The working tree holds an uncommitted ~2,100-file merge (upstream v0.8.1-rc2 into `custom-main`), an unstaged half-finished "externalize to omniventus" refactor, and the entire `omniventus/` folder + `CLAUDE.md` are **untracked**. Months of work are one `git clean` / disk failure away from gone.
2. **The staged merge is broken.** 12 files still contain conflict markers *in the index*. If committed and deployed as-is: backend won't boot (`Message.js`, `config.js`, `files.js` syntax errors), `librechat-data-provider` won't compile (`roles.ts` orphan markers, undefined `userAdminPermissionsSchema`, `actions.ts` ×6 blocks), client won't build (`ChatForm.tsx`, invalid locale JSONs). ~Half the custom features are broken or silently disabled in the staged result.
3. **The merge target is already stale.** You're merging toward v0.8.1-rc2 (Dec 2025), but upstream is at v0.8.6 — 1,085 commits / 2,732 files further, including a build-system migration (rollup → tsdown), a **native Admin Users API**, and a restructured chat-input layer.

**Verdict: salvage the merge, don't abort it.** The conflict-resolution work in the index is ~90% recoverable with a bounded fix list (~2–3 days to green). Commit it as a validated checkpoint, then take v0.8.6 as a second, smaller jump. One giant leap with no intermediate committed state is exactly the failure mode that produced the current situation.

---

## 2. Repo state map

| Ref | Commit | Date | Version | Content |
|---|---|---|---|---|
| `custom-main` (local+origin) | 86d4c394b | 2025-03-21 | v0.7.7-rc1 | base + 16 custom commits |
| `origin/develop` | f7f08d805 | 2026-06-10 | v0.7.7-rc1 | custom-main + Traefik/Docker/NGINX deploy work (PRs #7, #8) |
| `main` / `origin/main` | f55bd6f99 | 2025-12-04 | v0.8.1-rc2 | **vanilla upstream snapshot** (0 custom commits) |
| `origin/prod` | 62efc69fa | 2025-03-22 | v0.7.7-rc1 | what prod tracks (old) |
| `upstream/main` | d91cec210 | 2026-06-10 | v0.8.6 | 2,040 commits ahead of custom-main; 1,085 ahead of `main` |

**Working tree (branch `custom-main`, MERGE_HEAD = f55bd6f99):**
- ~2,111 files staged: the resolved (mostly) merge of v0.8.1-rc2.
- 12 staged files with conflict markers: `.env.example`, `README.md`, `api/models/Message.js`, `api/server/routes/config.js`, `api/server/routes/files/files.js`, `client/src/components/Chat/Input/ChatForm.tsx`, `client/src/components/Chat/Input/Files/Table/Columns.tsx`, `client/src/locales/en/translation.json`, `client/src/locales/fr/translation.json`, `packages/data-provider/src/actions.ts`, plus orphaned `>>>>>>> main` terminators in `packages/data-provider/src/roles.ts` and `data-service.ts`.
- 15 dirty files (12 MM, 1 AM, 1 RM, 3 ` M`): a coherent but incomplete unstaged refactor that reverts upstream files to vanilla and rewires customizations into `@omniventus/*` packages.
- Untracked: `omniventus/` (the override packages + ledger), `CLAUDE.md`.

---

## 3. Custom feature inventory (committed history, vs merge-base f362f1887)

Fork footprint: **97 files, +9,004/−220 lines** — 35 new files, 62 upstream files modified. Overall invasiveness is LOW (~1.8/5); most edits are additive registrations, not rewrites.

| Feature | New files | Upstream files touched | Invasiveness | Staged-merge status |
|---|---|---|---|---|
| Manager role + USER_ADMIN/DELETE | 0 | 1 (`roles.ts` +65) | 1/5 | **BUILD-BROKEN** — markers in roles.ts; USER_ADMIN never ported to new `permissions.ts` |
| User admin UI + API | 10 (~950 LOC) | 3 (registration lines) | 1.5/5 | INTACT |
| Business Actions | 7 | 5 (incl. AskController +61) | 3/5 | INTACT, except unresolved conflict in `api/models/Message.js:265` (must keep both `contextualActions` and `feedback`) |
| Notion tool | 3 (1,472 LOC + 2 specs) | 3 (registration) | 2/5 | INTACT |
| RAG preload + shared files | 2 (incl. `preload.js` 325 LOC) | 6 | 2.5/5 | **FUNCTIONALLY DEAD** — `scope`/`file_access_groups` fields lost (file schema moved to `packages/data-schemas/src/schema/file.ts`, staged copy is vanilla); `preloadFiles()` bootstrap call lost (AppService rewritten upstream); conflicts in `files.js`, `config.js`, `Columns.tsx` |
| Prompt chips (SharedPromptList) | 3 | 2 (ChatForm +106/−98) | 2/5 | Integration trapped inside unresolved conflict in `ChatForm.tsx:208` — a "take main" resolution would silently drop it |
| Message render improvements | — | 4 | 2/5 | INTACT |
| Auth/middleware (checkAdmin + MANAGER) | 1 | 4 | 1.5/5 | INTACT once roles compile |
| Deploy (Traefik/NGINX/Docker) — develop only | 9 | 2 | 1/5 | not part of this merge; needs rebasing later |

Most conflict-prone upstream files going forward: `AskController.js`, `ChatForm.tsx`, `File.js`/file schema, `roles.ts`/`permissions.ts`.

---

## 4. The `omniventus/` approach — honest assessment

**The instinct is right; the implementation overreached; the execution is fatally incomplete.**

What's there: `omniventus/{README.md ledger, .env.example, api/{models/File.js, tools/manifest.js, tools/structured/Notion.js, prompts/createContextHandlers.js}, packages/{data-provider/{permissions.ts, roles.ts}, data-schemas (empty)}}` — 11 files, wired via root `workspaces` glob, `_moduleAliases` in `api/package.json`, tsconfig path mappings, and re-exports from `packages/data-provider/src/index.ts`.

✅ **Sound parts**
- Segregating *new* code (providers, tools, UI features) into a dedicated committed workspace → genuinely reduces merge conflicts to ~zero for those files.
- The README ledger with `[UPDATE]/[OVERRIDE]/[TO_REMOVE]/[TODO]` tags — ~95% accurate vs reality, auditable.
- Makefile-driven workflows.

⚠️ **Overreach**
- Trying to make upstream files "vanilla" by aliasing **core schema modules** (`roles.ts`, `permissions.ts`, `File.js#getFiles`) through a parallel package. The actual customization is ~65 additive lines; the alias machinery to externalize it costs far more than re-resolving a small additive diff at each merge. Deep-import packages need `exports` maps, build steps, and bundler cooperation — fragility in four places to avoid a 5-minute conflict.

❌ **Broken as executed**
- The folder is **untracked** — committing the staged merge ships none of the override targets.
- `@omniventus/api` lives at `omniventus/api`, which the added `omniventus/packages/*` workspace glob does **not** cover → `require('@omniventus/api/...')` fails.
- `"@omniventus/*"` is not valid `module-alias` syntax (prefix matching only, no `*` substitution).
- `@omniventus/data-provider` has no build, no `dist/`, no `exports` map — deep imports resolve only for type-checking via tsconfig paths; the rollup bundle would fail.
- `packages/data-schemas/package.json` declares a dep on **`@omniventus/schemas`** but the package is named `@omniventus/data-schemas` (and is empty) → `npm install` fails.
- Dead code mixed in (`Notion.js` marked TO_REMOVE yet still imported); env vars documented but never read; Business Actions documented in the ledger but not actually in the folder.

**Revised doctrine (recommended):** pick the mechanism by the *shape* of the change —

| Change shape | Mechanism |
|---|---|
| New feature code (services, providers, tools, UI components, hooks) | `omniventus/` workspace packages — **committed** |
| Small registration edits in upstream files (route mount, init call, tool registry, component slot) | In-place edit, minimal, fenced with `// [OMNIVENTUS-START/END]` comments, logged in ledger |
| Schema extensions (roles, permissions, mongoose fields) | In-place **additive** edits — small additive diffs merge nearly automatically; don't externalize |
| Genuine behavior replacement with a clean seam | Wrapper/override module in `omniventus/` — only if committed *and* buildable |

Drop the alias-everything ambition. Keep the ledger. Enable `git rerere` so every conflict is resolved once, forever.

---

## 5. Upstream gap: v0.8.1-rc2 → v0.8.6 (what's waiting after this merge)

1,085 commits, 2,732 files, +444k/−92k lines. Highlights affecting this fork:

- **Build system**: all packages migrated rollup → **tsdown** (+ isolatedDeclarations). Mechanical but mandatory.
- **Native Admin Users API**: `api/server/routes/admin/users.js` + `packages/api/src/admin/{users,config,grants,groups,roles}.ts` + admin UI components. **Overlaps the fork's custom user admin** → plan to adopt upstream's backend and retire most of `UsersController.js`/`routes/users.js`; keep only the custom UI bits that upstream lacks.
- **Permissions expanded**: upstream added `MCP_SERVERS`, `REMOTE_AGENTS`, `SKILLS`, `SHARED_LINKS` types; OpenID role sync; system grants. The Manager role should be re-expressed on top of this.
- **File model migrated**: `api/models/File.js` → `packages/data-schemas/src/models/file.ts` (TypeScript + tenant isolation). The shared-files feature must be re-ported there anyway.
- **Chat input restructured** into `client/src/components/Chat/Input/` (30+ files) — the prompt-chips integration will need re-placement.
- **Skills / MCP everywhere**: marketplace UI, deployment skills, agent file tools, MCP server persistence + OAuth/OBO. The **Notion tool (1,472 LOC custom) should become an MCP server** — upstream-native, zero merge surface.

Estimated effort for the v0.8.1-rc2 → v0.8.6 jump after the checkpoint: ~10–15 focused days.

---

## 6. Recommended recovery plan

### Phase 0 — Safety net (today, ~30 min, before touching anything)
```bash
# full filesystem backup incl. .git, index, untracked files
tar --exclude='node_modules' --exclude='client/dist' -czf ../librechat-backup-2026-06-10.tar.gz .
git config rerere.enabled true        # record every conflict resolution from now on
```

### Phase 1 — Get everything into git (same day)
1. Commit the merge **as-is** (broken is fine; it's a checkpoint, fix-forward):
   `git commit --no-verify -m "WIP: merge v0.8.1-rc2 into custom-main (unresolved markers remain — see omniventus/DIAGNOSIS-2026-06-10.md)"`
2. Commit the untracked + unstaged layer separately:
   `git add omniventus/ CLAUDE.md && git add -A && git commit --no-verify -m "WIP: omniventus externalization layer (incomplete wiring)"`
3. Push: `git push origin custom-main`. Now nothing can be lost.

### Phase 2 — Fix-forward to green on v0.8.1-rc2 (~2–3 days)
Decide the architecture per §4 doctrine: **in-place additive customizations first** (the omniventus alias wiring is broken; revert that layer or park it — it's reproducible from `omniventus/` copies). Then:
1. Resolve the 12 marker files — keeping **both sides** in `Message.js` (`contextualActions` + `feedback`), `config.js` (`fileAccessGroups` + upstream keys), `ChatForm.tsx` (SharedPromptList + upstream layout), `Columns.tsx`, both `translation.json`, `actions.ts`, `data-service.ts`, `roles.ts`.
2. Port `USER_ADMIN` / `DELETE` / `userAdminPermissionsSchema` into the new `packages/data-provider/src/permissions.ts` + fix `roles.ts`.
3. Re-add schema fields in `packages/data-schemas`: `scope`/`access_control`/`file_access_groups` on `file.ts` / `user.ts` (mongoose strict mode silently drops unknown fields — the feature is dead without this).
4. Re-add the `preloadFiles()` bootstrap call in the v0.8.1 startup path (old home `AppService.js` was rewritten).
5. Gate: `node --check` on touched api files; `npm run build:packages && npm run frontend`; `npm run test:api && npm run test:client`; manual smoke of each custom feature.
6. Commit as `checkpoint: custom-main on v0.8.1-rc2, all features green`. Tag it (e.g. `fork-v0.8.1-rc2`).

### Phase 3 — Cleanup commits (1 day)
- Commit a corrected `omniventus/` (new-code packages only; fix or remove the broken alias wiring; delete dead `Notion.js` copy; ledger updated to match reality).
- Rebase/merge `origin/develop`'s deploy work (Traefik/NGINX/Docker — it's isolated, low risk) onto the checkpoint.

### Phase 4 — Second jump: merge upstream v0.8.6 (or latest stable tag) (~10–15 days)
`git merge v0.8.6` from the green checkpoint — `rerere` replays prior resolutions. During this merge, modernize instead of porting blindly:
- adopt tsdown builds;
- **adopt upstream Admin Users API**, retire redundant custom backend, keep custom UI deltas;
- re-express Manager role on the expanded permission/grant system;
- re-port shared-files onto `packages/data-schemas` file model;
- re-place prompt chips in the new `Chat/Input/` structure;
- convert Notion tool → **MCP server** (registered in `librechat.yaml`).

### Phase 5 — Prod rollout & hygiene
- **MongoDB Atlas**: v0.7.7 → v0.8.x involves permission-model migrations (`npm run migrate:agent-permissions`, `migrate:prompt-permissions` — use `:dry-run` first) — rehearse against a staging copy of the Atlas data before deploying.
- Going forward: merge upstream **every 1–2 releases** (small diffs merge trivially; 15-month gaps produce this document), keep `rerere` on, keep CI green-gating `build:packages` + client build on every push, and keep the ledger updated in the same PR as the change it logs.

---

## 7. Open questions / risks

- `origin/develop` and `custom-main` must converge — decide which is canonical after Phase 3 (suggestion: custom-main canonical; develop for integration as documented in CLAUDE.md).
- `prod` branch is 15 months stale — confirm what's actually deployed on DigitalOcean before any push affects CD workflows (`deploy-dev.yml`, `dev-branch-images.yml` are in the staged changes).
- The 23+ auth/security upstream commits between v0.8.1-rc2 and v0.8.6 argue for not lingering on the Phase 2 checkpoint longer than needed.
- Upstreaming candidates: little of the custom work is generic enough to PR upstream, except possibly the file-sharing scope model — re-evaluate after seeing upstream's ACL/shared-links system at v0.8.6.
