#!/bin/bash
# Resolves the test-stack-analysis input (fetches the ticket or
# Confluence page(s) if given), determines in-scope repos (always
# all 8 present under repos/), and seeds
# workareas/test-stack-analysis/{run-id}/.run-meta.json.
#
# Not normally called directly — start-test-stack-analysis.sh
# validates args and execs into this script. Kept as a separate file
# so the one command the LLM runs (start-test-stack-analysis.sh)
# stays thin, matching the review/govuk-upgrade start+prepare split.
#
# Usage: same flags as start-test-stack-analysis.sh.

set -e

RUN_ID=""
TICKET=""
DESCRIPTION=""
URLS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --ticket) TICKET="$2"; shift 2 ;;
        --description) DESCRIPTION="$2"; shift 2 ;;
        --url) URLS+=("$2"); shift 2 ;;
        -h|--help)
            sed -n '2,10p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

WORKSPACE_DIR="$HOME/git/defra/trade-imports-animals-workspace"
RUN_DIR="$WORKSPACE_DIR/workareas/test-stack-analysis/$RUN_ID"
mkdir -p "$RUN_DIR"

INPUT_TYPE=""
INPUT_SUMMARY=""

if [[ -n "$TICKET" ]]; then
    INPUT_TYPE="ticket"
    INPUT_SUMMARY="$TICKET"
    "$WORKSPACE_DIR/tools/jira/ticket.sh" "$TICKET" full > "$RUN_DIR/ticket.md"
elif [[ -n "$DESCRIPTION" ]]; then
    INPUT_TYPE="description"
    INPUT_SUMMARY="$DESCRIPTION"
    printf '%s\n' "$DESCRIPTION" > "$RUN_DIR/description.md"
else
    INPUT_TYPE="url"
    INPUT_SUMMARY="${URLS[*]}"
    i=0
    for url in "${URLS[@]}"; do
        i=$((i + 1))
        "$WORKSPACE_DIR/tools/confluence/page.sh" "$url" full > "$RUN_DIR/confluence-$i.md"
    done
fi

# In-scope repos: always all 8 present under repos/ — a repo with
# nothing relevant to the flow simply reports no findings in Step 1.
REPOS_DIR="$WORKSPACE_DIR/repos"
repos_json="[]"
if [[ -d "$REPOS_DIR" ]]; then
    repos_json=$(find "$REPOS_DIR" -maxdepth 1 -mindepth 1 -type d -exec basename {} \; \
        | sort \
        | jq -R . \
        | jq -s .)
fi

META_FILE="$RUN_DIR/.run-meta.json"
TMP_FILE="$META_FILE.tmp"

jq -n \
    --arg run_id "$RUN_ID" \
    --arg input_type "$INPUT_TYPE" \
    --arg input_summary "$INPUT_SUMMARY" \
    --arg started_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --argjson in_scope_repos "$repos_json" \
    '{
        run_id: $run_id,
        input_type: $input_type,
        input_summary: $input_summary,
        started_at: $started_at,
        in_scope_repos: $in_scope_repos
    }' > "$TMP_FILE"
mv "$TMP_FILE" "$META_FILE"

echo "test-stack-analysis run prepared: $RUN_ID"
echo "Input type: $INPUT_TYPE"
echo "In-scope repos: $(echo "$repos_json" | jq -r 'join(", ")')"
echo "Metadata: $META_FILE"
