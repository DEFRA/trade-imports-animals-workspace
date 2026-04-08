#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_DIR="$SCRIPT_DIR/../repos"

# Accepts repo names as arguments, falls back to hardcoded list
REPOS=("${@:-trade-imports-animals-frontend trade-imports-animals-backend trade-imports-animals-tests trade-imports-animals-admin}")

echo "Updating trade-imports-animals workspace..."
for repo in "${REPOS[@]}"; do
  dir="$REPOS_DIR/$repo"
  if [ -d "$dir/.git" ]; then
    echo "  $repo — pulling..."
    git -C "$dir" pull --rebase
  else
    echo "  $repo — not cloned, skipping (run make setup first)"
  fi
done
echo "Done."
