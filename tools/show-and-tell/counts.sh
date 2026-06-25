#!/bin/bash
# Ticket counts by bucket — the data behind the Progress Summary slide.
#
# Usage:
#   counts.sh --run-id <id> [--json]

set -e

RUN_ID=""
JSON_OUTPUT=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --json) JSON_OUTPUT=1; shift ;;
        -h|--help)
            sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

SUMMARY=$(jq '
    .items as $items
    | {
        breakdown: [
            .buckets | to_entries[] | .key as $code | {
                code: $code,
                label: .value,
                count: ([ $items[] | select(.bucket == $code) ] | length)
            }
        ],
        unclassified: ([ $items[] | select(.bucket == null) ] | length),
        total: ($items | length)
      }
' "$STATE")

if [[ "$JSON_OUTPUT" == "1" ]]; then
    echo "$SUMMARY"
    exit 0
fi

echo "Progress Summary ($RUN_ID):"
echo "$SUMMARY" | jq -r '.breakdown[] | [.count, .label] | @tsv' \
    | while IFS=$'\t' read -r count label; do
        printf '  %4d  %s\n' "$count" "$label"
    done
UNCL=$(echo "$SUMMARY" | jq -r '.unclassified')
[[ "$UNCL" -gt 0 ]] && printf '  %4d  (unclassified)\n' "$UNCL"
echo "  ----"
printf '  %4d  TOTAL\n' "$(echo "$SUMMARY" | jq -r '.total')"
