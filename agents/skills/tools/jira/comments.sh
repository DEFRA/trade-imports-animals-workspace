#!/bin/bash
# Get JIRA ticket comments
# Usage: ./comments.sh EUDPA-XXXXX [format]
# Formats: list (default), json, count

set -e

TICKET="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$TICKET" ]]; then
    echo "Usage: ./comments.sh EUDPA-XXXXX [format]"
    echo "Formats: list (default), json, count"
    exit 1
fi

USER="${JIRA_USER:-}"
if [[ -z "$USER" ]]; then
    echo "Error: JIRA_USER environment variable not set"
    exit 1
fi

if [[ -z "$JIRA_TOKEN" ]]; then
    echo "Error: JIRA_TOKEN environment variable not set"
    exit 1
fi

AUTH="$USER:$JIRA_TOKEN"
BASE_URL="${JIRA_BASE_URL:?JIRA_BASE_URL is not set - see README.md}"

response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rest/api/2/issue/$TICKET?fields=comment")

# Check for errors
if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
    echo "$response" | jq -r '.errorMessages[]'
    exit 1
fi

comments=$(echo "$response" | jq '.fields.comment.comments')

case "$FORMAT" in
    json)
        echo "$comments"
        ;;
    count)
        echo "$comments" | jq 'length'
        ;;
    list|*)
        count=$(echo "$comments" | jq 'length')
        if [[ "$count" == "0" ]]; then
            echo "No comments on $TICKET"
            exit 0
        fi
        echo "=== Comments on $TICKET ($count) ==="
        echo "$comments" | jq -r '.[] | "--- \(.author.displayName) (\(.created | split("T")[0])) ---\n\(.body)\n"'
        ;;
esac
