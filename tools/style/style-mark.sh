#!/bin/bash
# Set the Disposition (and corresponding Status) on a style item.
# Usage:
#   style-mark.sh EUDPA-XXXXX --repo REPO --item N --disposition "Fix"|"Won't Fix"|"Discuss"|"Auto-Resolved" [--note "..."]
#
# Auto-sets Status:
#   Fix       → Not Done
#   Discuss   → Not Done
#   Won't Fix → —
#   Auto-Resolved → —
#
# --note overwrites the Notes column. Without --note, Notes is left as-is.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"
UPDATER="$SCRIPT_DIR/lib/update-item.awk"

TICKET=""
REPO=""
ITEM=""
DISPOSITION=""
NOTE=""
SET_NOTE=0

usage() {
    cat <<EOF
Usage: $0 EUDPA-XXXXX --repo REPO --item N --disposition VALUE [--note "..."]

  --repo R          Target repo (matches style-review.<R>.md)
  --item N          Item ID
  --disposition V   One of: Fix, "Won't Fix", Discuss, Auto-Resolved, "" (clear)
  --note "..."      Optional notes text (overwrites Notes column)
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO="$2"; shift 2 ;;
        --item) ITEM="$2"; shift 2 ;;
        --disposition) DISPOSITION="$2"; shift 2 ;;
        --note) NOTE="$2"; SET_NOTE=1; shift 2 ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage
[[ -z "$REPO"   ]] && { echo "--repo required" >&2; usage; }
[[ -z "$ITEM"   ]] && { echo "--item required" >&2; usage; }

case "$DISPOSITION" in
    "" | "Fix" | "Won't Fix" | "Discuss" | "Auto-Resolved") ;;
    *) echo "Invalid --disposition: $DISPOSITION" >&2; exit 1 ;;
esac

case "$DISPOSITION" in
    "Fix" | "Discuss") STATUS="Not Done" ;;
    "Won't Fix" | "Auto-Resolved") STATUS="—" ;;
    "") STATUS="" ;;
esac

REVIEW_FILE="$AGENTS_DIR/workareas/code-style-reviews/$TICKET/style-review.${REPO}.md"
[[ -f "$REVIEW_FILE" ]] || { echo "Style review file not found: $REVIEW_FILE" >&2; exit 1; }

AWK_ARGS=(
    -v "ITEM_ID=$ITEM"
    -v "SET_DISP=1" -v "VAL_DISP=$DISPOSITION"
    -v "SET_STAT=1" -v "VAL_STAT=$STATUS"
)
if [[ "$SET_NOTE" == "1" ]]; then
    AWK_ARGS+=( -v "SET_NOTE=1" -v "VAL_NOTE=$NOTE" )
fi

tmp_out=$(mktemp)
trap 'rm -f "$tmp_out"' EXIT

if ! awk "${AWK_ARGS[@]}" -f "$UPDATER" "$REVIEW_FILE" > "$tmp_out"; then
    echo "Failed to update item #$ITEM in $REVIEW_FILE" >&2
    exit 2
fi

mv "$tmp_out" "$REVIEW_FILE"
trap - EXIT

echo "Marked #$ITEM in $REPO: Disposition=${DISPOSITION:-<blank>}, Status=${STATUS:-<blank>}${SET_NOTE:+, Notes set}"
