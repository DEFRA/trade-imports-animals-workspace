#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS_DIR="$SCRIPT_DIR/../repos"
GITHUB_ORG="DEFRA"

mkdir -p "$REPOS_DIR"

clone_if_missing() {
  local name=$1
  local url="https://github.com/${GITHUB_ORG}/${name}.git"
  if [ -d "$REPOS_DIR/$name" ]; then
    echo "  $name — already exists, skipping"
  else
    echo "  $name — cloning..."
    git clone "$url" "$REPOS_DIR/$name"
  fi
}

echo "Setting up trade-imports-animals workspace..."
clone_if_missing trade-imports-animals-frontend
clone_if_missing trade-imports-animals-backend
clone_if_missing trade-imports-animals-tests
clone_if_missing trade-imports-animals-admin
clone_if_missing trade-imports-stub
clone_if_missing trade-imports-reference-data
clone_if_missing trade-imports-dynamics-gateway
echo "Done."
