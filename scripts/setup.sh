#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_DIR="$SCRIPT_DIR/../repos"

mkdir -p "$REPOS_DIR"

clone_if_missing() {
  local name=$1
  local url=$2
  if [ -d "$REPOS_DIR/$name" ]; then
    echo "  $name — already exists, skipping"
  else
    echo "  $name — cloning..."
    git clone "$url" "$REPOS_DIR/$name"
  fi
}

echo "Setting up trade-imports-animals workspace..."
clone_if_missing trade-imports-animals-frontend  git@github.com:DEFRA/trade-imports-animals-frontend.git
clone_if_missing trade-imports-animals-backend   git@github.com:DEFRA/trade-imports-animals-backend.git
clone_if_missing trade-imports-animals-tests     git@github.com:DEFRA/trade-imports-animals-tests.git
clone_if_missing trade-imports-animals-admin     git@github.com:DEFRA/trade-imports-animals-admin.git
echo "Done."
