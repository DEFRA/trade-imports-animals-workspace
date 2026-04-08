#!/bin/bash
# Add a subtask to a JIRA ticket
# Usage: ./add-subtask.sh PARENT-KEY "Summary" ["Description"]
#        ./add-subtask.sh PARENT-KEY -f subtasks.txt
#
# Options:
#   -P, --priority LEVEL  Priority: Lowest, Low, Medium, High, Highest (default: Medium)
#   -l, --label LABEL     Add label (can be used multiple times)
#   -a, --assign-self     Assign subtask to yourself
#   -f, --file FILE       Create multiple subtasks from file (one summary per line)
#   -h, --help            Show this help message
#
# Examples:
#   ./add-subtask.sh EUDPA-12345 "Write unit tests"
#   ./add-subtask.sh EUDPA-12345 -P High "Fix critical bug" "Detailed description"
#   ./add-subtask.sh EUDPA-12345 -a -l backend "Implement API endpoint"
#   ./add-subtask.sh EUDPA-12345 -f subtasks.txt

set -e

# Defaults
PARENT=""
PRIORITY="Medium"
LABELS=()
SUMMARY=""
DESCRIPTION=""
ASSIGN_SELF=false
FILE=""

show_help() {
    cat << EOF
Add a subtask to a JIRA ticket

Usage: ./add-subtask.sh PARENT-KEY "Summary" ["Description"]
       ./add-subtask.sh PARENT-KEY -f subtasks.txt

Options:
  -P, --priority LEVEL  Priority: Lowest, Low, Medium, High, Highest (default: Medium)
  -l, --label LABEL     Add label (can be used multiple times)
  -a, --assign-self     Assign subtask to yourself
  -f, --file FILE       Create multiple subtasks from file (one summary per line)
  -h, --help            Show this help message

File format for -f option:
  One subtask summary per line. Empty lines and lines starting with # are ignored.

Examples:
  ./add-subtask.sh EUDPA-12345 "Write unit tests"
  ./add-subtask.sh EUDPA-12345 -P High "Fix critical bug" "Detailed description"
  ./add-subtask.sh EUDPA-12345 -a -l backend "Implement API endpoint"
  ./add-subtask.sh EUDPA-12345 -f subtasks.txt

Environment Variables:
  JIRA_USER   Your Atlassian email address
  JIRA_TOKEN  Your Atlassian API token
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -P|--priority)
            PRIORITY="$2"
            shift 2
            ;;
        -l|--label)
            LABELS+=("$2")
            shift 2
            ;;
        -a|--assign-self)
            ASSIGN_SELF=true
            shift
            ;;
        -f|--file)
            FILE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        -*)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            if [[ -z "$PARENT" ]]; then
                PARENT="$1"
            elif [[ -z "$SUMMARY" ]]; then
                SUMMARY="$1"
            elif [[ -z "$DESCRIPTION" ]]; then
                DESCRIPTION="$1"
            else
                echo "Error: Too many positional arguments"
                echo "Use --help for usage information"
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required fields
if [[ -z "$PARENT" ]]; then
    echo "Error: Parent ticket key is required"
    echo "Use --help for usage information"
    exit 1
fi

# Validate parent key format
if [[ ! "$PARENT" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Error: Invalid parent key format '$PARENT'. Expected format: EUDPA-12345"
    exit 1
fi

# Check we have either a summary or a file
if [[ -z "$SUMMARY" && -z "$FILE" ]]; then
    echo "Error: Either a summary or -f/--file is required"
    echo "Use --help for usage information"
    exit 1
fi

if [[ -n "$SUMMARY" && -n "$FILE" ]]; then
    echo "Error: Cannot use both summary and -f/--file together"
    exit 1
fi

# Validate priority
case "$PRIORITY" in
    Lowest|Low|Medium|High|Highest) ;;
    *)
        echo "Error: Invalid priority '$PRIORITY'. Must be Lowest, Low, Medium, High, or Highest"
        exit 1
        ;;
esac

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

# Get account ID if assigning to self
ACCOUNT_ID=""
if [[ "$ASSIGN_SELF" == "true" ]]; then
    myself_response=$(curl -s -X GET \
        -u "$AUTH" \
        -H "Content-Type: application/json" \
        "$BASE_URL/rest/api/2/myself")
    ACCOUNT_ID=$(echo "$myself_response" | jq -r '.accountId')
    DISPLAY_NAME=$(echo "$myself_response" | jq -r '.displayName')
fi

# Build labels JSON array
if [[ ${#LABELS[@]} -gt 0 ]]; then
    LABELS_JSON=$(printf '%s\n' "${LABELS[@]}" | jq -R . | jq -s .)
else
    LABELS_JSON="[]"
fi

# Function to create a single subtask
create_subtask() {
    local summary="$1"
    local description="$2"

    # Build the JSON payload
    PAYLOAD=$(jq -n \
        --arg summary "$summary" \
        --arg description "$description" \
        --arg priority "$PRIORITY" \
        --arg parent "$PARENT" \
        --arg project_key "${JIRA_PROJECT_KEY:?JIRA_PROJECT_KEY is not set - see README.md}" \
        --argjson labels "$LABELS_JSON" \
        '{
            fields: {
                project: { key: $project_key },
                summary: $summary,
                description: $description,
                issuetype: { name: "Sub-task" },
                priority: { name: $priority },
                parent: { key: $parent },
                labels: $labels
            }
        }')

    # Create the subtask
    response=$(curl -s -X POST \
        -u "$AUTH" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "$BASE_URL/rest/api/2/issue")

    # Check for errors
    if echo "$response" | jq -e '.errors' > /dev/null 2>&1; then
        echo "Error creating subtask '$summary':"
        echo "$response" | jq -r '.errors'
        return 1
    fi

    if echo "$response" | jq -e '.errorMessages' > /dev/null 2>&1 && [[ $(echo "$response" | jq '.errorMessages | length') -gt 0 ]]; then
        echo "Error creating subtask '$summary':"
        echo "$response" | jq -r '.errorMessages[]'
        return 1
    fi

    # Extract the new ticket key
    TICKET_KEY=$(echo "$response" | jq -r '.key')

    if [[ "$TICKET_KEY" == "null" || -z "$TICKET_KEY" ]]; then
        echo "Error: Failed to create subtask '$summary'"
        echo "$response"
        return 1
    fi

    # Assign to self if requested
    if [[ "$ASSIGN_SELF" == "true" && -n "$ACCOUNT_ID" && "$ACCOUNT_ID" != "null" ]]; then
        curl -s -X PUT \
            -u "$AUTH" \
            -H "Content-Type: application/json" \
            -d "{\"accountId\": \"$ACCOUNT_ID\"}" \
            "$BASE_URL/rest/api/2/issue/$TICKET_KEY/assignee" > /dev/null
    fi

    echo "$TICKET_KEY - $summary"
}

# Create subtasks
if [[ -n "$FILE" ]]; then
    # Validate file exists
    if [[ ! -f "$FILE" ]]; then
        echo "Error: File not found: $FILE"
        exit 1
    fi

    echo "Creating subtasks for $PARENT from $FILE..."
    echo ""

    count=0
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Trim whitespace
        summary=$(echo "$line" | xargs)
        [[ -z "$summary" ]] && continue

        create_subtask "$summary" ""
        ((count++))
    done < "$FILE"

    echo ""
    echo "Created $count subtask(s) under $PARENT"
    if [[ "$ASSIGN_SELF" == "true" && -n "$DISPLAY_NAME" ]]; then
        echo "Assigned to: $DISPLAY_NAME"
    fi
else
    # Single subtask
    create_subtask "$SUMMARY" "$DESCRIPTION"
    echo "Created under: $BASE_URL/browse/$PARENT"
    if [[ "$ASSIGN_SELF" == "true" && -n "$DISPLAY_NAME" ]]; then
        echo "Assigned to: $DISPLAY_NAME"
    fi
fi
