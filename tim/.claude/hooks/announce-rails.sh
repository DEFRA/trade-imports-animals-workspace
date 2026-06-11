#!/usr/bin/env bash
# SessionStart — one-line diagnostic so it's clear tim's rails are loaded.

set -euo pipefail
cat <<'EOF'
tim rails loaded: CLAUDE.md + 4 path-scoped rules + 4 PreToolUse hooks
(spy-assertions, sibling-test, npm-install, git-push) + 1 PostToolUse
(format+lint) + 1 Stop (test-nudge). Best-practices imported from
../docs/best-practices. Hard rules: input/output testing, library-first
integrations, code+test ship together.
EOF
exit 0
