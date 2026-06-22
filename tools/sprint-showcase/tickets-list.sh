#!/bin/bash
# List / filter the run's tickets. Read-only query + coverage gate.
#   --status unanalyzed   tickets with analyzed_at == null OR category == null
#                         (drives fan-out + coverage gate; empty == fully analysed)
#   --by-category         group analysed tickets by category (drives synthesis)
#   --json                machine-readable output
#
# Usage:
#   tickets-list.sh --run-id <id> [--status unanalyzed] [--by-category] [--json]
#
# Read-only — no mutation.

set -e

RUN_ID=""
STATUS_FILTER=""
BY_CATEGORY=0
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --status) STATUS_FILTER="$2"; shift 2 ;;
        --by-category) BY_CATEGORY=1; shift ;;
        --json) JSON=1; shift ;;
        -h|--help)
            sed -n '2,12p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

case "$STATUS_FILTER" in
    ""|unanalyzed) ;;
    *) echo "Invalid --status '$STATUS_FILTER' (expected unanalyzed)" >&2; exit 1 ;;
esac

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

CATEGORY_ORDER='["NEW_FEATURE","IMPROVEMENT","BUG_FIX","QUALITY_OR_VELOCITY"]'

# --- --status unanalyzed: coverage gate -------------------------------------
if [[ "$STATUS_FILTER" == "unanalyzed" ]]; then
    UNANALYZED=$(jq '[.tickets[] | select(.analyzed_at == null or .category == null)]' "$STATE")
    if [[ "$JSON" == "1" ]]; then
        echo "$UNANALYZED"
    else
        printf '%s' "$UNANALYZED" | jq -r '.[] | [.key, .type, .title] | @tsv'
    fi
    exit 0
fi

# --- --by-category: group analysed tickets ----------------------------------
if [[ "$BY_CATEGORY" == "1" ]]; then
    GROUPED=$(jq \
        --argjson order "$CATEGORY_ORDER" '
        [.tickets[] | select(.analyzed_at != null and .category != null)] as $analysed
        | reduce $order[] as $cat ({}; . + { ($cat): [ $analysed[] | select(.category == $cat) ] })' "$STATE")
    if [[ "$JSON" == "1" ]]; then
        echo "$GROUPED"
    else
        printf '%s' "$GROUPED" | jq -r --argjson order "$CATEGORY_ORDER" '
            $order[] as $cat
            | .[$cat] as $items
            | if ($items | length) > 0 then
                "== \($cat) ==",
                ($items[] | [.key, .confidence, .headline] | @tsv)
              else empty end'
    fi
    exit 0
fi

# --- default: human table / json of all tickets -----------------------------
if [[ "$JSON" == "1" ]]; then
    jq '.tickets' "$STATE"
else
    jq -r '.tickets[] | [.key, (.category // "-"), (.confidence // "-"), (.headline // "-")] | @tsv' "$STATE"
fi
