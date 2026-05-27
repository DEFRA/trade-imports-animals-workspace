#!/bin/bash
# Aggregate labels in use on a JIRA board's backlog, sorted by frequency.
# Usage: ./list-board-labels.sh <board-id> [format]
# Formats: list (default — "<count> <label>" lines), json
#
# Hits /rest/agile/1.0/board/{id}/backlog and counts the labels[] field
# across the returned issues. Up to 1000 issues are pulled in a single
# request (no pagination — sufficient for catalogue-refresh sampling).
#
# Example: ./list-board-labels.sh 13780
# Example: ./list-board-labels.sh 13780 json

set -e

BOARD_ID="${1:-}"
FORMAT="${2:-list}"

if [[ -z "$BOARD_ID" ]]; then
    echo "Usage: ./list-board-labels.sh <board-id> [format]" >&2
    echo "Formats: list (default), json" >&2
    exit 1
fi

USER="${JIRA_USER:-}"
if [[ -z "$USER" ]]; then
    echo "Error: JIRA_USER environment variable not set" >&2
    exit 1
fi

if [[ -z "$JIRA_TOKEN" ]]; then
    echo "Error: JIRA_TOKEN environment variable not set" >&2
    exit 1
fi

AUTH="$USER:$JIRA_TOKEN"
BASE_URL="${JIRA_BASE_URL:?JIRA_BASE_URL is not set - see README.md}"

response=$(curl -s -u "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rest/agile/1.0/board/$BOARD_ID/backlog?maxResults=1000&fields=labels")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1 \
   && [[ $(echo "$response" | jq '.errorMessages | length') -gt 0 ]]; then
    echo "$response" | jq -r '.errorMessages[]' >&2
    exit 1
fi

case "$FORMAT" in
    json)
        echo "$response" | jq '
            [.issues[].fields.labels[]?]
            | group_by(.)
            | map({label: .[0], count: length})
            | sort_by(-.count)
        '
        ;;
    list)
        echo "$response" | jq -r '.issues[].fields.labels[]?' \
            | sort | uniq -c | sort -rn
        ;;
    *)
        echo "Error: unknown format: $FORMAT" >&2
        exit 1
        ;;
esac
