#!/bin/bash
# Print a PR author's GitHub login.
# Usage: ./pr-author.sh REPO PR_NUMBER
# Example: ./pr-author.sh trade-imports-animals-frontend 1234
#
# One line of output, no decoration.

set -e

REPO="${1:-}"
PR_NUMBER="${2:-}"

if [[ -z "$REPO" ]] || [[ -z "$PR_NUMBER" ]]; then
    echo "Usage: ./pr-author.sh REPO PR_NUMBER" >&2
    exit 1
fi

gh pr view "$PR_NUMBER" --repo "DEFRA/$REPO" --json author --jq '.author.login'
