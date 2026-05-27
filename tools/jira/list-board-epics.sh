#!/bin/bash
# List epics on a JIRA board.
# Usage: ./list-board-epics.sh <board-id> [format] [--include-done]
# Formats: list (default — "KEY — summary" lines), json
#
# By default only open epics (done=false) are returned. Pass
# --include-done to include closed/done epics as well.
#
# Example: ./list-board-epics.sh 13780
# Example: ./list-board-epics.sh 13780 json
# Example: ./list-board-epics.sh 13780 list --include-done

set -e

BOARD_ID=""
FORMAT="list"
INCLUDE_DONE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --include-done)
            INCLUDE_DONE=true
            shift
            ;;
        list|json)
            FORMAT="$1"
            shift
            ;;
        -h|--help)
            cat << EOF
Usage: ./list-board-epics.sh <board-id> [format] [--include-done]

Formats:
  list  "KEY — summary" lines (default)
  json  raw JSON array of {key, summary, done}

Flags:
  --include-done  Include done epics (default: open only)

Example: ./list-board-epics.sh 13780
EOF
            exit 0
            ;;
        *)
            if [[ -z "$BOARD_ID" ]]; then
                BOARD_ID="$1"
            else
                echo "Error: unexpected argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$BOARD_ID" ]]; then
    echo "Usage: ./list-board-epics.sh <board-id> [format] [--include-done]" >&2
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
    "$BASE_URL/rest/agile/1.0/board/$BOARD_ID/epic?maxResults=100")

if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1 \
   && [[ $(echo "$response" | jq '.errorMessages | length') -gt 0 ]]; then
    echo "$response" | jq -r '.errorMessages[]' >&2
    exit 1
fi

if [[ "$INCLUDE_DONE" == "true" ]]; then
    FILTER='.values'
else
    FILTER='[.values[] | select(.done == false)]'
fi

case "$FORMAT" in
    json)
        echo "$response" | jq "$FILTER | map({key, summary, done})"
        ;;
    list)
        echo "$response" | jq -r "$FILTER | .[] | \"\(.key) — \(.summary)\""
        ;;
    *)
        echo "Error: unknown format: $FORMAT" >&2
        exit 1
        ;;
esac
