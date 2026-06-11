#!/usr/bin/env bash
# PreToolUse on Write — require a sibling *.test.js when creating src/**/*.js.
# Edits to existing files are not gated (only file creation).

set -euo pipefail

payload=$(cat)

tool=$(echo "$payload" | jq -r '.tool_name // empty')
[ "$tool" = "Write" ] || exit 0

file=$(echo "$payload" | jq -r '.tool_input.file_path // empty')

# Only gate source files under tim/src/
case "$file" in
  */tim/src/*.js) ;;
  *) exit 0 ;;
esac

# Allow tests, fixtures, and index re-export barrels
case "$file" in
  *.test.js|*.spec.js) exit 0 ;;
  */__fixtures__/*|*/test-support/*|*/fixtures/*) exit 0 ;;
  */index.js) exit 0 ;;
esac

# If the file already exists this is a re-write, not a new file — allow.
[ -f "$file" ] && exit 0

sibling="${file%.js}.test.js"
if [ ! -f "$sibling" ]; then
  cat >&2 <<EOF
Refusing to create $(basename "$file") without a sibling test.

Code and tests ship together in this project (TDD encouraged).

Either:
  1. Create $sibling first with the behavioural test you intend to satisfy
  2. Or restructure as one of the allowed exceptions: *.test.js, index.js
     re-export, __fixtures__/, test-support/

See tim/CLAUDE.md § Hard rules.
EOF
  exit 2
fi
