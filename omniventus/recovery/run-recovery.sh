#!/usr/bin/env bash
# Recovery runner — chains headless /goal sessions deterministically.
#
# Why no LLM "watcher": `claude -p "/goal …"` runs the goal loop to completion and
# then EXITS. The process exit is the completion signal — sequential execution
# replaces any polling agent. STATE.md is the human/agent-readable baton, this
# script is the orchestrator, and the gate between phases is a human decision.
#
# Usage:
#   ./omniventus/recovery/run-recovery.sh 1        # run Phase 1 headless
#   ./omniventus/recovery/run-recovery.sh 2        # run Phase 2 (gated: requires Phase 1 done + explicit confirmation)
#
# Permissions: headless sessions can't prompt you. Either run with a project
# .claude/settings.json that allowlists the needed git/npm/docker commands, or
# pass extra flags via CLAUDE_FLAGS, e.g.:
#   CLAUDE_FLAGS="--permission-mode acceptEdits" ./omniventus/recovery/run-recovery.sh 1
# Reserve --dangerously-skip-permissions for isolated containers only.
#
# Single-writer rule: never run two phases (or a phase + an interactive session
# writing this repo) at the same time.

set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root

RECOVERY_DIR="omniventus/recovery"
CLAUDE_FLAGS="${CLAUDE_FLAGS:-}"

extract_goal() { # pull the ```goal fenced block out of a mission file (single source of truth)
  awk '/^```goal$/{flag=1; next} /^```$/{flag=0} flag' "$1"
}

state_done() { # crude check that STATE.md marks a phase done
  grep -Eq "^- phase: $1\b" "$RECOVERY_DIR/STATE.md" && grep -Eq "^- status: done\b" "$RECOVERY_DIR/STATE.md"
}

run_phase() {
  local file="$RECOVERY_DIR/PHASE-$1-GOAL.md"
  local goal; goal="$(extract_goal "$file")"
  [ -n "$goal" ] || { echo "ERROR: no \`\`\`goal block found in $file" >&2; exit 1; }
  echo ">>> Launching Phase $1 headless goal (mission: $file)"
  # shellcheck disable=SC2086
  claude $CLAUDE_FLAGS -p "/goal $goal"
}

PHASE="${1:?usage: run-recovery.sh <1|2>}"

case "$PHASE" in
  1)
    run_phase 1
    echo ">>> Phase 1 session ended. Review STATE.md + git log, then run: $0 2"
    ;;
  2)
    state_done 1 || { echo "ABORT: STATE.md does not show phase 1 done. Finish/repair Phase 1 first." >&2; exit 1; }
    echo "Phase 2 merges upstream and makes architectural decisions."
    echo "Have you re-reviewed PHASE-2-GOAL.md and pinned the upstream tag in it?"
    read -r -p "Type 'yes' to launch Phase 2: " CONFIRM
    [ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 1; }
    run_phase 2
    ;;
  *)
    echo "usage: $0 <1|2>" >&2; exit 1
    ;;
esac
