#!/bin/bash

# Get all logs for a GitHub Actions workflow run
# Usage: ./get-logs.sh <repo> <run-id-or-url>
# Example: ./get-logs.sh trade-imports-animals-frontend 12345678
# Example: ./get-logs.sh DEFRA/trade-imports-animals-frontend 12345678
# Example: ./get-logs.sh trade-imports-animals-frontend https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/12345678
#
# Uses gh CLI for authentication — no env vars required.

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <repo> <run-id-or-url>"
    echo "Example: $0 trade-imports-animals-frontend 12345678"
    echo "Example: $0 DEFRA/trade-imports-animals-frontend 12345678"
    exit 1
fi

# Normalise repo: accept bare name or DEFRA/<name>
REPO="$1"
if [[ "$REPO" != */* ]]; then
    REPO="DEFRA/${REPO}"
fi

# Extract run ID from URL if a URL was passed
RUN_ID="$2"
if [[ "$RUN_ID" == http* ]]; then
    RUN_ID=$(echo "$RUN_ID" | grep -oE '[0-9]+$')
fi

echo "Fetching logs for run ${RUN_ID} in ${REPO}..."
gh run view --repo "$REPO" "$RUN_ID" --log
