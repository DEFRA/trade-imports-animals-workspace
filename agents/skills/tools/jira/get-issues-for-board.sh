#!/bin/bash
# Get issues from a JIRA board (handles pagination)
# Usage: ./get-issues-for-board.sh <board-id> [format]
# Formats: list (default), summary, json

set -e

BOARD_ID="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$BOARD_ID" ]]; then
    echo "Usage: ./get-issues-for-board.sh <board-id> [format]"
    echo "Formats: list (default), summary, json"
    echo ""
    echo "Example: ./get-issues-for-board.sh 862"
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

# Fetch all issues with pagination
ALL_ISSUES="[]"
START_AT=0
MAX_RESULTS=100

while true; do
    response=$(curl -s -u "$AUTH" \
        -H "Content-Type: application/json" \
        "$BASE_URL/rest/agile/1.0/board/$BOARD_ID/issue?startAt=$START_AT&maxResults=$MAX_RESULTS")

    # Check for errors
    if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1; then
        echo "$response" | jq -r '.errorMessages[]'
        exit 1
    fi

    # Extract issues from this page
    PAGE_ISSUES=$(echo "$response" | jq '.issues')
    PAGE_COUNT=$(echo "$PAGE_ISSUES" | jq 'length')
    TOTAL=$(echo "$response" | jq '.total')

    # Merge into all issues
    ALL_ISSUES=$(echo "$ALL_ISSUES $PAGE_ISSUES" | jq -s 'add')

    # Check if we've fetched all issues
    START_AT=$((START_AT + PAGE_COUNT))
    if [[ $START_AT -ge $TOTAL ]] || [[ $PAGE_COUNT -eq 0 ]]; then
        break
    fi

    # Progress indicator to stderr
    echo "Fetched $START_AT of $TOTAL issues..." >&2
done

case "$FORMAT" in
    json)
        echo "$ALL_ISSUES" | jq '{issues: ., total: (. | length)}'
        ;;
    summary)
        echo "$ALL_ISSUES" | jq -r '.[] | {
            key: .key,
            summary: .fields.summary,
            status: .fields.status.name,
            type: .fields.issuetype.name,
            priority: .fields.priority.name,
            assignee: (.fields.assignee.displayName // "Unassigned"),
            labels: .fields.labels
        }'
        ;;
    list|*)
        echo "=== Board $BOARD_ID Issues ==="
        echo "$ALL_ISSUES" | jq -r '.[] | "\(.key)\t\(.fields.status.name)\t\(.fields.issuetype.name)\t\(.fields.summary)"' | column -t -s $'\t'
        echo ""
        echo "Total: $(echo "$ALL_ISSUES" | jq 'length') issues"
        ;;
esac
