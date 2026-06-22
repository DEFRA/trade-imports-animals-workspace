#!/bin/bash
# Set the deck-framing narrative (parent-authored at synthesis time):
# narrative.intro + narrative.velocity_summary + optional narrative.closing.
# The only mutator of the narrative-owned fields. --closing is optional;
# when omitted narrative.closing is set to null.
#
# Usage:
#   deck-set-narrative.sh --run-id <id> --intro "..." \
#       --velocity-summary "..." [--closing "..."]
#
# Atomic mutations: write to .tmp then mv.

set -e

RUN_ID=""
INTRO=""
VELOCITY_SUMMARY=""
CLOSING=""
CLOSING_SET=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --intro) INTRO="$2"; shift 2 ;;
        --velocity-summary) VELOCITY_SUMMARY="$2"; shift 2 ;;
        --closing) CLOSING="$2"; CLOSING_SET=1; shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }
[[ -z "$INTRO" ]] && { echo "Missing --intro" >&2; exit 1; }
[[ -z "$VELOCITY_SUMMARY" ]] && { echo "Missing --velocity-summary" >&2; exit 1; }

STATE="$HOME/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/$RUN_ID/state.json"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

# --closing omitted → null; supplied → its (possibly empty) string value.
if [[ "$CLOSING_SET" == "1" ]]; then
    CLOSING_JSON=$(printf '%s' "$CLOSING" | jq -R -s '.')
else
    CLOSING_JSON='null'
fi

TMP=$(mktemp)
jq \
    --arg intro "$INTRO" \
    --arg velocity "$VELOCITY_SUMMARY" \
    --argjson closing "$CLOSING_JSON" \
    '.narrative = {
        intro: $intro,
        velocity_summary: $velocity,
        closing: $closing
    }' "$STATE" > "$TMP"
mv "$TMP" "$STATE"

if [[ "$CLOSING_SET" == "1" ]]; then
    echo "Narrative set for $RUN_ID (intro + velocity_summary + closing)"
else
    echo "Narrative set for $RUN_ID (intro + velocity_summary; closing=null)"
fi
