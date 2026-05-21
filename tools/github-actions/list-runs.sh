#!/bin/bash

# List recent GitHub Actions workflow runs for a repo
# Usage: ./list-runs.sh <repo> [branch] [workflow]
# Example: ./list-runs.sh trade-imports-animals-frontend
# Example: ./list-runs.sh DEFRA/trade-imports-animals-frontend main
# Example: ./list-runs.sh trade-imports-animals-frontend main ci.yml
#
# Uses gh CLI for authentication — no env vars required.

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <repo> [branch] [workflow]"
    echo "Example: $0 trade-imports-animals-frontend"
    echo "Example: $0 DEFRA/trade-imports-animals-frontend main"
    echo "Example: $0 trade-imports-animals-frontend main ci.yml"
    exit 1
fi

# Normalise repo: accept bare name or DEFRA/<name>
REPO="$1"
if [[ "$REPO" != */* ]]; then
    REPO="DEFRA/${REPO}"
fi

BRANCH="${2:-}"
WORKFLOW="${3:-}"

ARGS=(--repo "$REPO" --limit 20)

if [ -n "$BRANCH" ]; then
    ARGS+=(--branch "$BRANCH")
fi

if [ -n "$WORKFLOW" ]; then
    ARGS+=(--workflow "$WORKFLOW")
fi

gh run list "${ARGS[@]}"
