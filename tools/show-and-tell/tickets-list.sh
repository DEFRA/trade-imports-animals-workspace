#!/bin/bash
# List tickets in a show-and-tell run, optionally filtered by bucket.
#
# Usage:
#   tickets-list.sh --run-id <id> [--bucket UJ|IA|TD] [--unclassified] [--json]
#
# Default: human-readable table (id, bucket code, key, summary).
# --unclassified  Only tickets with no bucket yet.
# --json          Emit the filtered items array.

set -e

RUN_ID=""
BUCKET=""
UNCLASSIFIED=0
JSON_OUTPUT=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --bucket) BUCKET="$2"; shift 2 ;;
        --unclassified) UNCLASSIFIED=1; shift ;;
        --json) JSON_OUTPUT=1; shift ;;
        -h|--help)
            sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

FILTERED=$(jq \
    --arg bucket "$BUCKET" \
    --argjson unclassified "$UNCLASSIFIED" '
    [ .items[]
      | select($bucket == "" or .bucket == $bucket)
      | select($unclassified == 0 or .bucket == null) ]
' "$STATE")

if [[ "$JSON_OUTPUT" == "1" ]]; then
    echo "$FILTERED"
    exit 0
fi

echo "$FILTERED" | jq -r '.[] | [.id, (.bucket // "--"), .key, .summary] | @tsv' \
    | column -t -s $'\t'
COUNT=$(echo "$FILTERED" | jq 'length')
echo ""
echo "$COUNT ticket(s)" >&2
