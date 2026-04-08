#!/bin/bash

# Wait for a GitHub Actions workflow run to complete
# Usage: ./wait-for-run.sh <repo> <run-id-or-url> [timeout-seconds]
# Example: ./wait-for-run.sh trade-imports-animals-frontend 12345678
# Example: ./wait-for-run.sh DEFRA/trade-imports-animals-frontend 12345678 1800
# Example: ./wait-for-run.sh trade-imports-animals-frontend https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/12345678 900
#
# Exits 0 on success, 1 on failure or timeout.
# Uses gh CLI for authentication — no env vars required.

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <repo> <run-id-or-url> [timeout-seconds]"
    echo "Example: $0 trade-imports-animals-frontend 12345678"
    echo "Example: $0 DEFRA/trade-imports-animals-frontend 12345678 1800"
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

TIMEOUT="${3:-600}"

echo "Waiting for run ${RUN_ID} in ${REPO} (timeout: ${TIMEOUT}s)..."

# gh run watch exits 0 on success, non-zero on failure
if gh run watch --repo "$REPO" "$RUN_ID" --interval 10 --timeout "$TIMEOUT" --exit-status; then
    echo "Run completed successfully."
    exit 0
else
    EXIT_CODE=$?
    echo "Run did not complete successfully (exit code: ${EXIT_CODE})."
    exit 1
fi
