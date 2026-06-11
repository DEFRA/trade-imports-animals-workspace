#!/bin/bash
# Record that a prior consolidated item's violation is no longer present
# in the file (REFRESH / MERGE_RESOLVED modes). Appends the consolidated
# item id to `resolved_item_ids` in the per-file review JSON; the
# reconciler later auto-resolves still-open items from this list.
# Usage:
#   file-review-mark-resolved.sh EUDPA-X --repo R --file F --item N
# Idempotent: re-adding an id is a no-op.

set -e

TICKET=""; REPO=""; FILE=""; ITEM=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --repo) REPO="$2"; shift 2 ;;
        --file) FILE="$2"; shift 2 ;;
        --item) ITEM="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

for v in TICKET REPO FILE ITEM; do
    [[ -z "${!v}" ]] && { echo "Missing $v" >&2; exit 1; }
done

encoded="${FILE//\//_}"
target="$HOME/git/defra/trade-imports-animals-workspace/workareas/reviews/$TICKET/file-reviews/$REPO/$encoded.review.json"
[[ -f "$target" ]] || { echo "No review file at $target — call file-review-init.sh first" >&2; exit 1; }

jq --argjson id "$ITEM" \
    '.resolved_item_ids = (((.resolved_item_ids // []) + [$id]) | unique)' \
    "$target" > "$target.tmp" && mv "$target.tmp" "$target"

echo "Marked consolidated item #$ITEM as resolved in $FILE"
