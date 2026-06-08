#!/usr/bin/env bash
# PostToolUse on Edit|Write — format and lint the changed file (non-blocking).
# Silent on success. Lint failures go to stderr for the agent to see.

set -euo pipefail

payload=$(cat)

file=$(echo "$payload" | jq -r '.tool_input.file_path // empty')

# Only act on JS/JSX/MJS/CJS under tim/.
case "$file" in
  */tim/*.js|*/tim/*.jsx|*/tim/*.mjs|*/tim/*.cjs) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

# Run from the tim/ project root so eslint and prettier pick up our configs.
cd "$(dirname "$0")/../.."

# Use --no-error-on-unmatched-pattern in case of file-path mismatch quirks.
npx --no-install prettier --write "$file" >/dev/null 2>&1 || true
if ! npx --no-install eslint --fix "$file" >/tmp/tim-eslint-$$.log 2>&1; then
  echo "eslint reported issues in $file (auto-fix applied where possible):" >&2
  cat /tmp/tim-eslint-$$.log >&2
fi
rm -f /tmp/tim-eslint-$$.log
exit 0
