#!/bin/bash
# Get detailed PR information from GitHub
# Usage: ./pr-details.sh REPO PR_NUMBER [format]
# Formats: full (default), files, json

set -e

REPO="${1:-}"
PR_NUMBER="${2:-}"
FORMAT="${3:-full}"

if [[ -z "$REPO" ]] || [[ -z "$PR_NUMBER" ]]; then
    echo "Usage: ./pr-details.sh REPO PR_NUMBER [format]"
    echo "Formats: full (default), files, json"
    exit 1
fi

response=$(gh pr view "$PR_NUMBER" --repo "DEFRA/$REPO" \
    --json title,body,state,mergedAt,commits,files,additions,deletions,author,url)

case "$FORMAT" in
    json)
        echo "$response"
        ;;
    files)
        echo "$response" | jq -r '.files[].path'
        ;;
    full|*)
        echo "=== PR #$PR_NUMBER in $REPO ==="
        echo "$response" | jq -r '"Title: \(.title)"'
        echo "$response" | jq -r '"State: \(.state)"'
        echo "$response" | jq -r '"Author: \(.author.login)"'
        echo "$response" | jq -r '"Merged: \(.mergedAt // "Not merged")"'
        echo "$response" | jq -r '"Changes: +\(.additions) -\(.deletions)"'
        echo ""
        echo "=== Files Changed ==="
        echo "$response" | jq -r '.files[].path'
        echo ""
        echo "=== Description ==="
        echo "$response" | jq -r '.body // "No description"'
        ;;
esac
