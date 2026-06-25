#!/bin/bash
# Set the bucket (and optionally the plain-English benefit) on one ticket.
#
# Usage:
#   set-bucket.sh --run-id <id> --key EUDPA-XXXXX [--bucket UJ|IA|TD|""] [--benefit "..."]
#
# Buckets: UJ = User Journey / Skeleton, IA = Integration / Architecture,
#          TD = Technical / Delivery enablers. Pass --bucket "" to clear.
# --benefit sets the non-technical benefit line (used for the
#          "Improving how the team delivers" slide). Pass "" to clear.
#
# Atomic mutation: jq ... > tmp; mv tmp state.json.

set -e

RUN_ID=""
KEY=""
BUCKET=""
SET_BUCKET=0
BENEFIT=""
SET_BENEFIT=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --key) KEY="$2"; shift 2 ;;
        --bucket) BUCKET="$2"; SET_BUCKET=1; shift 2 ;;
        --benefit) BENEFIT="$2"; SET_BENEFIT=1; shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }
[[ -z "$KEY" ]] && { echo "Missing --key" >&2; exit 1; }

case "$BUCKET" in
    ""|"UJ"|"IA"|"TD") ;;
    *) echo "Invalid --bucket: $BUCKET (expected UJ, IA, TD or empty)" >&2; exit 1 ;;
esac

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

exists=$(jq --arg k "$KEY" '[.items[] | select(.key == $k)] | length' "$STATE")
[[ "$exists" -eq 0 ]] && { echo "Ticket $KEY not found in $STATE" >&2; exit 1; }

bucket_json='null'
[[ -n "$BUCKET" ]] && bucket_json=$(jq -nc --arg v "$BUCKET" '$v')
benefit_json=$(jq -nc --arg v "$BENEFIT" 'if $v == "" then null else $v end')

jq \
    --arg k "$KEY" \
    --argjson setb "$SET_BUCKET" \
    --argjson bucket "$bucket_json" \
    --argjson setben "$SET_BENEFIT" \
    --argjson benefit "$benefit_json" '
    .items |= map(
        if .key == $k then
            (if $setb == 1 then .bucket = $bucket else . end)
            | (if $setben == 1 then .benefit = $benefit else . end)
        else . end
    )' "$STATE" > "$STATE.tmp" && mv "$STATE.tmp" "$STATE"

echo "Updated $KEY${SET_BUCKET:+ bucket=${BUCKET:-<null>}}${SET_BENEFIT:+ benefit set}"
