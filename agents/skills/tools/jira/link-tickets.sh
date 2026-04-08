#!/bin/bash
# Link two JIRA tickets with a relationship
# Usage: ./link-tickets.sh TICKET-KEY LINK-TYPE TARGET-KEY
#
# Common link types:
#   Blocks       - This ticket blocks the target ticket
#   Relates      - This ticket relates to the target ticket
#   Duplicates   - This ticket duplicates the target ticket
#   Cloners      - This ticket clones the target ticket
#
# Examples:
#   ./link-tickets.sh EUDPA-12345 Blocks EUDPA-12346
#   ./link-tickets.sh EUDPA-12345 Relates EUDPA-12347

set -e

# Check arguments
if [[ $# -lt 3 ]]; then
    echo "Usage: ./link-tickets.sh TICKET-KEY LINK-TYPE TARGET-KEY"
    echo ""
    echo "Common link types: Blocks, Relates, Duplicates, Cloners"
    echo ""
    echo "Examples:"
    echo "  ./link-tickets.sh EUDPA-12345 Blocks EUDPA-12346"
    echo "  ./link-tickets.sh EUDPA-12345 Relates EUDPA-12347"
    exit 1
fi

INWARD_ISSUE="$1"
LINK_TYPE="$2"
OUTWARD_ISSUE="$3"

# Check environment variables
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

# Build the JSON payload
PAYLOAD=$(jq -n \
    --arg type "$LINK_TYPE" \
    --arg inward "$INWARD_ISSUE" \
    --arg outward "$OUTWARD_ISSUE" \
    '{
        type: { name: $type },
        inwardIssue: { key: $inward },
        outwardIssue: { key: $outward }
    }')

# Create the link
response=$(curl -s -w "\n%{http_code}" -X POST \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "$BASE_URL/rest/api/2/issueLink")

# Split response into body and status code
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

# Check for errors
if [[ "$http_code" != "201" ]]; then
    echo "Error linking tickets (HTTP $http_code):"
    if [[ -n "$response_body" ]]; then
        echo "$response_body" | jq -r 'if .errorMessages then .errorMessages[] else .errors // . end' 2>/dev/null || echo "$response_body"
    fi
    exit 1
fi

echo "✓ Linked: $INWARD_ISSUE $LINK_TYPE $OUTWARD_ISSUE"
