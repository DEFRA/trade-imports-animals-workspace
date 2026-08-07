#!/bin/bash
# List the issue types a project actually accepts on create.
#
# Usage: issue-types.sh [PROJECT_KEY] [--json]
#
# Defaults to $JIRA_PROJECT_KEY. Prints one type per line as
# `name | subtask=true|false | id`, so the sub-task type can be identified
# without guessing at its name — "Sub-task", "Subtask" and "Child" are all
# real spellings across Jira configurations, and create fails with an
# unhelpful `issuetype` error when the guess is wrong.
#
# Boundary: read-only discovery. To CREATE a child issue use add-subtask.sh.

set -e

PROJECT=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        -h|--help)
            sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            PROJECT="$1"
            shift
            ;;
    esac
done

if [[ -z "$JIRA_USER" ]]; then
    echo "Error: JIRA_USER environment variable not set" >&2
    exit 1
fi

if [[ -z "$JIRA_TOKEN" ]]; then
    echo "Error: JIRA_TOKEN environment variable not set" >&2
    exit 1
fi

AUTH="$JIRA_USER:$JIRA_TOKEN"
BASE_URL="${JIRA_BASE_URL:?JIRA_BASE_URL is not set - see README.md}"
PROJECT="${PROJECT:-${JIRA_PROJECT_KEY:?JIRA_PROJECT_KEY is not set - see README.md}}"

response=$(curl -s -X GET \
    -u "$AUTH" \
    -H "Content-Type: application/json" \
    "$BASE_URL/rest/api/2/issue/createmeta/$PROJECT/issuetypes")

if ! echo "$response" | jq -e '.issueTypes' > /dev/null 2>&1; then
    echo "Error: could not read issue types for $PROJECT" >&2
    echo "$response" | jq -r '.errorMessages[]? // .' >&2
    exit 1
fi

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "$response" | jq '{project: "'"$PROJECT"'", issueTypes: [.issueTypes[] | {id, name, subtask}]}'
else
    echo "$response" | jq -r '.issueTypes[] | .name + " | subtask=" + (.subtask|tostring) + " | id=" + .id'
fi
