#!/bin/bash

# Trigger a GitHub Actions workflow dispatch event
# Usage: ./trigger-workflow.sh <repo> <workflow-file> [branch] [key=value ...]
# Example: ./trigger-workflow.sh trade-imports-animals-frontend ci.yml
# Example: ./trigger-workflow.sh DEFRA/trade-imports-animals-frontend ci.yml main
# Example: ./trigger-workflow.sh trade-imports-animals-frontend deploy.yml main environment=staging
#
# Prints the URL of the triggered run.
# Uses gh CLI for authentication — no env vars required.

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <repo> <workflow-file> [branch] [key=value ...]"
    echo "Example: $0 trade-imports-animals-frontend ci.yml"
    echo "Example: $0 DEFRA/trade-imports-animals-frontend ci.yml main"
    echo "Example: $0 trade-imports-animals-frontend deploy.yml main environment=staging"
    exit 1
fi

# Normalise repo: accept bare name or DEFRA/<name>
REPO="$1"
if [[ "$REPO" != */* ]]; then
    REPO="DEFRA/${REPO}"
fi

WORKFLOW="$2"
BRANCH="${3:-main}"
shift 3 2>/dev/null || shift $#

# Build --field args for any key=value pairs
FIELD_ARGS=()
for param in "$@"; do
    FIELD_ARGS+=(--field "$param")
done

echo "Triggering workflow '${WORKFLOW}' on branch '${BRANCH}' in ${REPO}..."
gh workflow run "$WORKFLOW" \
    --repo "$REPO" \
    --ref "$BRANCH" \
    "${FIELD_ARGS[@]}"

# Give GitHub a moment to register the run, then fetch the latest run URL
sleep 3
echo ""
echo "Run URL:"
gh run list --repo "$REPO" --workflow "$WORKFLOW" --limit 1 \
    --json url,databaseId,status,createdAt \
    --jq '.[] | "  \(.url)\n  Status: \(.status)  Created: \(.createdAt)"'
