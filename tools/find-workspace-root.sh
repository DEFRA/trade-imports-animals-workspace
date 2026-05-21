#!/bin/bash
# Print the absolute path of the workspace root to stdout.
#
# Strategy: this script lives at <workspace-root>/tools/find-workspace-root.sh.
# Self-locate via ${BASH_SOURCE[0]} and verify the parent directory carries
# the workspace-root markers (co-presence of .claude/skills/ AND docs/).
#
# Falls back to a cwd walk-up when ${BASH_SOURCE[0]} isn't usable (e.g. piped
# `bash -c` or symlink trickery). The cwd walk-up is the same algorithm tool
# scripts and SKILL.md inline one-liners use.

set -e

# 1. Self-locate fast path.
src="${BASH_SOURCE[0]:-$0}"
if [ -n "$src" ] && [ -f "$src" ]; then
  script_dir="$(cd -- "$(dirname -- "$src")" && pwd -P)"
  candidate="$(dirname -- "$script_dir")"
  if [ -d "$candidate/.claude/skills" ] && [ -d "$candidate/docs" ]; then
    printf '%s\n' "$candidate"
    exit 0
  fi
fi

# 2. Cwd walk-up fallback.
d="${CLAUDE_PROJECT_DIR:-$PWD}"
while [ "$d" != "/" ]; do
  if [ -d "$d/.claude/skills" ] && [ -d "$d/docs" ]; then
    printf '%s\n' "$d"
    exit 0
  fi
  d="$(dirname -- "$d")"
done

echo "find-workspace-root.sh: workspace root not found (need .claude/skills/ + docs/ co-located)" >&2
exit 1
