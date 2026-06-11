#!/bin/bash

# Wait for a GitHub Actions workflow run to complete
# Usage: ./wait-for-run.sh <repo> <run-id-or-url> [timeout-seconds]
# Example: ./wait-for-run.sh trade-imports-animals-frontend 12345678
# Example: ./wait-for-run.sh DEFRA/trade-imports-animals-frontend 12345678 1800
# Example: ./wait-for-run.sh trade-imports-animals-frontend https://github.com/DEFRA/trade-imports-animals-frontend/actions/runs/12345678 900
#
# Exits 0 on success, 1 on failure or timeout.
# Uses gh CLI for authentication — no env vars required.
#
# Polls `gh run view` rather than `gh run watch`: watch has no timeout
# flag (current gh CLIs reject --timeout), and polling tolerates
# transient API errors instead of dying mid-wait.

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
INTERVAL=10

echo "Waiting for run ${RUN_ID} in ${REPO} (timeout: ${TIMEOUT}s)..."

ELAPSED=0
CONSECUTIVE_FAILURES=0
while true; do
    if STATE=$(gh run view --repo "$REPO" "$RUN_ID" --json status,conclusion \
        --jq '.status + "/" + (.conclusion // "")' 2>/dev/null); then
        CONSECUTIVE_FAILURES=0
        case "$STATE" in
            completed/success)
                echo "Run completed successfully."
                exit 0
                ;;
            completed/*)
                echo "Run completed with conclusion: ${STATE#completed/}."
                exit 1
                ;;
        esac
    else
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        if [ "$CONSECUTIVE_FAILURES" -ge 3 ]; then
            echo "Cannot read run ${RUN_ID} in ${REPO} (3 consecutive failures)."
            exit 1
        fi
    fi

    if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
        echo "Timed out after ${TIMEOUT}s (last status: ${STATE%%/*})."
        exit 1
    fi
    sleep "$INTERVAL"
    ELAPSED=$((ELAPSED + INTERVAL))
done
