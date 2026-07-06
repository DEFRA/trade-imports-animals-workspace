#!/bin/bash
# Step 0 dispatcher for test-stack-analysis. Validates args, creates
# the run's workarea directory, then hands off to
# prepare-test-stack-analysis.sh for the actual input resolution.
#
# One-shot skill — no FRESH/REFRESH distinction. Re-running the same
# --run-id overwrites prior output.
#
# Usage:
#   start-test-stack-analysis.sh --run-id <id> --ticket EUDPA-X
#   start-test-stack-analysis.sh --run-id <slug> --description "..."
#   start-test-stack-analysis.sh --run-id <slug> --url <confluence-url> [--url <confluence-url> ...]

set -e

ORIG_ARGS=("$@")

RUN_ID=""
TICKET=""
DESCRIPTION=""
URLS=()

show_help() {
    cat <<'EOF'
Usage: start-test-stack-analysis.sh --run-id <id> [--ticket EUDPA-X | --description "..." | --url <url> [--url <url> ...]]

Exactly one of --ticket, --description, or one-or-more --url is
required. --run-id is the ticket ID for --ticket input, or a short
kebab-case slug you choose for --description/--url input.
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --ticket) TICKET="$2"; shift 2 ;;
        --description) DESCRIPTION="$2"; shift 2 ;;
        --url) URLS+=("$2"); shift 2 ;;
        -h|--help) show_help ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

INPUT_COUNT=0
[[ -n "$TICKET" ]] && INPUT_COUNT=$((INPUT_COUNT + 1))
[[ -n "$DESCRIPTION" ]] && INPUT_COUNT=$((INPUT_COUNT + 1))
[[ ${#URLS[@]} -gt 0 ]] && INPUT_COUNT=$((INPUT_COUNT + 1))

if [[ "$INPUT_COUNT" -ne 1 ]]; then
    echo "Exactly one of --ticket, --description, or --url (repeatable) is required" >&2
    exit 1
fi

WORKSPACE_DIR="$HOME/git/defra/trade-imports-animals-workspace"
RUN_DIR="$WORKSPACE_DIR/workareas/test-stack-analysis/$RUN_ID"
mkdir -p "$RUN_DIR"

exec "$WORKSPACE_DIR/tools/test-stack-analysis/prepare-test-stack-analysis.sh" "${ORIG_ARGS[@]}"
