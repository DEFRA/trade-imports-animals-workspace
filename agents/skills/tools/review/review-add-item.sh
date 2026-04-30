#!/bin/bash
# Append a new item to review.{repo}.md at the next available ID.
# Usage:
#   review-add-item.sh EUDPA-XXXXX --repo REPO --file PATH --line N --severity S --category C --issue "..." --fix "..."
#
# Disposition, Status, and Notes start blank.
# Prints the new ID to stdout.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"
PARSER="$SCRIPT_DIR/lib/parse-items-table.awk"

TICKET=""
REPO=""
FILE=""
LINE=""
SEVERITY=""
CATEGORY=""
ISSUE=""
FIX=""

usage() {
    cat <<EOF
Usage: $0 EUDPA-XXXXX --repo REPO --file PATH --line N --severity S --category C --issue "..." --fix "..."

  --repo R       Target repo (matches review.<R>.md)
  --file P       Path of the affected source file
  --line N       Line number (or range like "12-15")
  --severity S   One of: Critical, Major, Minor
  --category C   E.g. Correctness, Code Quality, Security, Tests
  --issue "..."  Issue description
  --fix "..."    Suggested fix
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO="$2"; shift 2 ;;
        --file) FILE="$2"; shift 2 ;;
        --line) LINE="$2"; shift 2 ;;
        --severity) SEVERITY="$2"; shift 2 ;;
        --category) CATEGORY="$2"; shift 2 ;;
        --issue) ISSUE="$2"; shift 2 ;;
        --fix) FIX="$2"; shift 2 ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage
for var in REPO FILE LINE SEVERITY CATEGORY ISSUE FIX; do
    if [[ -z "${!var}" ]]; then
        lc=$(printf '%s' "$var" | tr '[:upper:]' '[:lower:]')
        echo "--$lc required" >&2
        usage
    fi
done

REVIEW_FILE="$AGENTS_DIR/workareas/reviews/$TICKET/review.${REPO}.md"
[[ -f "$REVIEW_FILE" ]] || { echo "Review file not found: $REVIEW_FILE" >&2; exit 1; }

# Compute next ID
NEXT_ID=$(awk -f "$PARSER" "$REVIEW_FILE" | awk -F'\t' 'BEGIN{max=0} $1+0>max{max=$1+0} END{print max+1}')

# Escape | in cell values
escape_pipes() { printf '%s' "$1" | sed 's/|/\\|/g'; }

NEW_ROW="| #${NEXT_ID} | $(escape_pipes "$FILE") | $(escape_pipes "$LINE") | $(escape_pipes "$SEVERITY") | $(escape_pipes "$CATEGORY") | $(escape_pipes "$ISSUE") | $(escape_pipes "$FIX") |  |  |  |"

# Find insertion point: line number of last data row in ## Items, or separator if no data yet.
last_data_line=$(awk '
    /^## Items[[:space:]]*$/ { in_items=1; seen=0; next }
    /^## / { if (in_items) in_items=0; next }
    !in_items { next }
    /^\|[[:space:]]*-+/ { seen=1; sep_line=NR; next }
    seen && /^\|/ { last=NR }
    END {
        if (last) print last
        else if (sep_line) print sep_line
        else print 0
    }
' "$REVIEW_FILE")

if [[ "$last_data_line" -eq 0 ]]; then
    echo "No '## Items' section found in $REVIEW_FILE" >&2
    exit 1
fi

tmp_out=$(mktemp)
tmp_row=$(mktemp)
trap 'rm -f "$tmp_out" "$tmp_row"' EXIT

# Write the new row to a tmp file and read it from awk via getline,
# bypassing -v's backslash-escape processing (which strips `\|`).
printf '%s\n' "$NEW_ROW" > "$tmp_row"

awk -v lineno="$last_data_line" -v rowfile="$tmp_row" '
    BEGIN { getline row < rowfile; close(rowfile) }
    NR == lineno { print; print row; next }
    { print }
' "$REVIEW_FILE" > "$tmp_out"

mv "$tmp_out" "$REVIEW_FILE"
trap - EXIT

echo "$NEXT_ID"
