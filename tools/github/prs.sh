#!/bin/bash
# Find GitHub PRs for a JIRA ticket
# Usage: ./prs.sh EUDPA-XXXXX [format]
# Formats: list (default), json, urls

set -e

TICKET="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$TICKET" ]]; then
    echo "Usage: ./prs.sh EUDPA-XXXXX [format]"
    echo "Formats: list (default), json, urls"
    exit 1
fi

response=$(gh search prs "$TICKET" --owner DEFRA --json number,title,repository,url,state 2>/dev/null)

if [[ -z "$response" ]] || [[ "$response" == "[]" ]]; then
    echo "No PRs found for $TICKET"
    exit 0
fi

case "$FORMAT" in
    json)
        echo "$response"
        ;;
    urls)
        echo "$response" | jq -r '.[].url'
        ;;
    list|*)
        echo "=== PRs for $TICKET ==="
        echo "$response" | jq -r '.[] | "[\(.state)] \(.repository.name)#\(.number): \(.title)\n  \(.url)\n"'
        ;;
esac
