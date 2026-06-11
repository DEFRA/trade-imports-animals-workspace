#!/usr/bin/env bash
# Stop — advisory nudge to run `npm test` when tim/src/ has unstaged changes.
# Never blocks. Quiet when there's nothing to nudge about.

set -euo pipefail

# Project root = parent of .claude/ (this script lives in .claude/hooks/).
cd "$(dirname "$0")/../.."

# No git? Nothing to check.
git rev-parse --show-toplevel >/dev/null 2>&1 || exit 0

# Any unstaged or untracked .js under tim/src/?
if git status --porcelain -- 'src/**/*.js' 2>/dev/null | grep -q .; then
  cat >&2 <<'EOF'
Reminder: tim/src/ has uncommitted changes. Run `npm test` (from tim/) before
committing to confirm behavioural tests still pass.
EOF
fi
exit 0
