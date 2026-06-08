#!/usr/bin/env bash
# PreToolUse on Edit|Write — block spy assertions in test files.
# Allows per-block override via `// allow-spy-assertion: <why>` comment.

set -euo pipefail

payload=$(cat)

tool=$(echo "$payload" | jq -r '.tool_name // empty')
file=$(echo "$payload" | jq -r '.tool_input.file_path // empty')

case "$file" in
  *.test.js|*.test.jsx|*.spec.js|*.spec.jsx) ;;
  *) exit 0 ;;
esac

if [ "$tool" = "Write" ]; then
  content=$(echo "$payload" | jq -r '.tool_input.content // empty')
elif [ "$tool" = "Edit" ]; then
  content=$(echo "$payload" | jq -r '.tool_input.new_string // empty')
else
  exit 0
fi

if echo "$content" | grep -Eq '\btoHaveBeenCalled(With|Times)?\b'; then
  if echo "$content" | grep -Eq '//[[:space:]]*allow-spy-assertion:'; then
    exit 0
  fi
  cat >&2 <<'EOF'
Spy assertion detected (toHaveBeenCalled / toHaveBeenCalledWith / toHaveBeenCalledTimes).

These test implementation, not behaviour. Replace with one of:
  - render the component with ink-testing-library, assert lastFrame()
  - call the function, assert its return value or thrown error
  - spawn the CLI, parse stdout, assert the JSON object

See tim/CLAUDE.md § Hard rules. If this is one of the rare valid cases
(outbound webhook, analytics event), override per block by placing
  // allow-spy-assertion: <why>
on a line before the assertion, and assert on the captured payload not the
spy record.
EOF
  exit 2
fi
