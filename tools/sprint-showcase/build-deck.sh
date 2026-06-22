#!/bin/bash
# Build the .pptx slide deck from a run's deck-spec.json via
# `tim deck generate`, then print the resulting path. Upload the .pptx
# to Google Drive and open it with Google Slides to edit — this is the
# MVP alternative to the Google Slides API.
#
# Usage:
#   build-deck.sh --run-id <id>
#
# Reads workareas/sprint-showcase/<id>/deck-spec.json (produced by
# render-sprint-showcase.sh) and writes deck.pptx alongside it.

set -e

RUN_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,13p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

RUN_DIR="$HOME/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/$RUN_ID"
SPEC="$RUN_DIR/deck-spec.json"
OUT="$RUN_DIR/deck.pptx"

[[ -f "$SPEC" ]] || { echo "Cannot find a deck spec at $SPEC. Run render-sprint-showcase.sh first." >&2; exit 1; }

if command -v tim >/dev/null 2>&1; then
    tim deck generate "$SPEC" --out "$OUT" --json
else
    node "$HOME/git/defra/trade-imports-animals-workspace/tim/src/cli.js" deck generate "$SPEC" --out "$OUT" --json
fi

echo "$OUT"
echo "Upload deck.pptx to Google Drive and open with Google Slides to edit."
