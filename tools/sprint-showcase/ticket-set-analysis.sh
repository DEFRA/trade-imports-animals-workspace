#!/bin/bash
# Set one ticket's audience analysis (written by a TICKET_ANALYST):
# category + headline + user benefit + confidence + evidence, and
# stamp analyzed_at. Validates category is one of NEW_FEATURE |
# IMPROVEMENT | BUG_FIX | QUALITY_OR_VELOCITY and that --evidence is
# non-empty. The only mutator of the analyst-owned fields.
#
# Usage:
#   ticket-set-analysis.sh --run-id <id> --key EUDPA-XXXX \
#       --category NEW_FEATURE --headline "..." --user-benefit "..." \
#       --confidence high|medium|low --evidence "EUDPA-XXXX,frontend@abc1234"
#
# Atomic mutations: write to .tmp then mv.

set -e

RUN_ID=""
KEY=""
CATEGORY=""
HEADLINE=""
USER_BENEFIT=""
CONFIDENCE=""
EVIDENCE=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --key) KEY="$2"; shift 2 ;;
        --category) CATEGORY="$2"; shift 2 ;;
        --headline) HEADLINE="$2"; shift 2 ;;
        --user-benefit) USER_BENEFIT="$2"; shift 2 ;;
        --confidence) CONFIDENCE="$2"; shift 2 ;;
        --evidence) EVIDENCE="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }
[[ -z "$KEY" ]] && { echo "Missing --key" >&2; exit 1; }
[[ -z "$CATEGORY" ]] && { echo "Missing --category" >&2; exit 1; }
[[ -z "$HEADLINE" ]] && { echo "Missing --headline" >&2; exit 1; }
[[ -z "$USER_BENEFIT" ]] && { echo "Missing --user-benefit" >&2; exit 1; }
[[ -z "$CONFIDENCE" ]] && { echo "Missing --confidence" >&2; exit 1; }

# Validate category enum.
case "$CATEGORY" in
    NEW_FEATURE|IMPROVEMENT|BUG_FIX|QUALITY_OR_VELOCITY) ;;
    *) echo "Invalid --category '$CATEGORY' (expected NEW_FEATURE|IMPROVEMENT|BUG_FIX|QUALITY_OR_VELOCITY)" >&2; exit 1 ;;
esac

# Validate confidence enum.
case "$CONFIDENCE" in
    high|medium|low) ;;
    *) echo "Invalid --confidence '$CONFIDENCE' (expected high|medium|low)" >&2; exit 1 ;;
esac

# Split --evidence on comma into a JSON array, dropping empty entries.
# Reject if the result is empty (>=1 evidence ref required by the schema).
EVIDENCE_JSON=$(jq -n --arg ev "$EVIDENCE" '
    $ev | split(",") | map(gsub("^\\s+|\\s+$";"")) | map(select(length > 0))')
if [[ "$(printf '%s' "$EVIDENCE_JSON" | jq 'length')" -eq 0 ]]; then
    echo "--evidence must contain at least one non-empty ref (got: '$EVIDENCE')" >&2
    exit 1
fi

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

# Assert the ticket key exists in tickets[].
if [[ "$(jq --arg k "$KEY" '[.tickets[] | select(.key == $k)] | length' "$STATE")" -eq 0 ]]; then
    echo "Ticket key not found in run '$RUN_ID': $KEY" >&2
    exit 1
fi

NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TMP=$(mktemp)
jq \
    --arg k "$KEY" \
    --arg cat "$CATEGORY" \
    --arg head "$HEADLINE" \
    --arg benefit "$USER_BENEFIT" \
    --arg conf "$CONFIDENCE" \
    --argjson ev "$EVIDENCE_JSON" \
    --arg now "$NOW" \
    '.tickets |= map(
        if .key == $k then
            .category = $cat
            | .headline = $head
            | .user_benefit = $benefit
            | .evidence = $ev
            | .confidence = $conf
            | .analyzed_at = $now
        else . end)' "$STATE" > "$TMP"
mv "$TMP" "$STATE"

echo "Analysed $KEY: category=$CATEGORY confidence=$CONFIDENCE evidence=$(printf '%s' "$EVIDENCE_JSON" | jq 'length') ref(s)"
