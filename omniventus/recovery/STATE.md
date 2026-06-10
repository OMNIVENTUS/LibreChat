# Recovery state — baton file

This file is the shared state between recovery phases, monitoring sessions, and humans.
Whichever session is executing a phase MUST update it: set `status: in-progress` when starting,
append a log line at every significant milestone, and set `status: done` + commit + push when
the phase's DONE-WHEN checklist passes.

**Single-writer rule: only ONE session may execute a phase (and write to this repo) at a time.**
Monitoring sessions may read this file but never write to the repo.

## Current

- phase: 1
- status: in-progress        <!-- not-started | in-progress | done | blocked -->
- owner: claude-code session 2026-06-10
- updated: 2026-06-10
- last_commit: 071c0ce96     <!-- last recovery commit sha -->
- blocker: —                 <!-- required when status=blocked: what and why -->

## Phase index

| Phase | Mission file | Goal | Status |
|---|---|---|---|
| 1 | [PHASE-1-GOAL.md](PHASE-1-GOAL.md) | Commit everything + fix-forward to green, bootable v0.8.1-rc2 checkpoint | not-started |
| 2 | [PHASE-2-GOAL.md](PHASE-2-GOAL.md) | Merge upstream v0.8.6 from the checkpoint, modernize features | not-started (HUMAN REVIEW REQUIRED before starting) |

## Log

- 2026-06-10 — recovery plan created from diagnosis (see ../DIAGNOSIS-2026-06-10.md); state file initialized.
- 2026-06-10 — phase 1 started. Safety net done: tar backup ../librechat-backup-20260610.tar.gz (393M), rerere enabled, staged merge committed as-is (18338da90), omniventus layer + recovery docs committed (071c0ce96), pushed to origin/custom-main.
