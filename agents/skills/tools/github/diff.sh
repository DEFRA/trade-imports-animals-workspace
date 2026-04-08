#!/bin/bash
# Get PR diff from GitHub
# Usage: ./diff.sh REPO PR_NUMBER
# Example: ./diff.sh trade-imports-animals-frontend 1234

set -e

REPO="${1:-}"
PR_NUMBER="${2:-}"

if [[ -z "$REPO" ]] || [[ -z "$PR_NUMBER" ]]; then
    echo "Usage: ./diff.sh REPO PR_NUMBER"
    echo "Example: ./diff.sh trade-imports-animals-frontend 1234"
    exit 1
fi

gh pr diff "$PR_NUMBER" --repo "DEFRA/$REPO"
