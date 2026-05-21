#!/bin/bash
# List items from review.{repo}.md files for a ticket.
# Usage:
#   review-items.sh EUDPA-XXXXX [--repo REPO] [--filter pending|fix|wont-fix|discuss|auto-resolved]
#                                [--status not-done|done|failed] [--json]
#
# Output (TSV columns):
#   repo \t id \t file \t line \t severity \t category \t issue \t fix \t disposition \t status \t notes
#
# Filters narrow the result set. Multiple filters AND together.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"
PARSER="$SCRIPT_DIR/lib/parse-items-table.awk"

TICKET=""
REPO_FILTER=""
DISPOSITION_FILTER=""
STATUS_FILTER=""
JSON_OUTPUT=false

usage() {
    cat <<EOF
Usage: $0 EUDPA-XXXXX [--repo REPO] [--filter DISPOSITION] [--status STATUS] [--json]

  --repo R         Limit to one repo (matches review.<R>.md)
  --filter F       Filter by Disposition: pending|fix|wont-fix|discuss|auto-resolved
  --status S       Filter by Status: not-done|done|failed
  --json           Output JSON array instead of TSV
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --filter) DISPOSITION_FILTER="$2"; shift 2 ;;
        --status) STATUS_FILTER="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage

REVIEW_DIR="$AGENTS_DIR/workareas/reviews/$TICKET"
[[ -d "$REVIEW_DIR" ]] || { echo "Review workspace not found: $REVIEW_DIR" >&2; exit 1; }

# Map filter labels to canonical Disposition / Status values
disposition_label() {
    case "$1" in
        pending) echo "" ;;
        fix) echo "Fix" ;;
        wont-fix) echo "Won't Fix" ;;
        discuss) echo "Discuss" ;;
        auto-resolved) echo "Auto-Resolved" ;;
        *) echo "Invalid --filter: $1" >&2; exit 1 ;;
    esac
}

status_label() {
    case "$1" in
        not-done) echo "Not Done" ;;
        done) echo "Done" ;;
        failed) echo "Failed" ;;
        *) echo "Invalid --status: $1" >&2; exit 1 ;;
    esac
}

DISPOSITION_MATCH=""
STATUS_MATCH=""
[[ -n "$DISPOSITION_FILTER" ]] && DISPOSITION_MATCH=$(disposition_label "$DISPOSITION_FILTER")
[[ -n "$STATUS_FILTER" ]] && STATUS_MATCH=$(status_label "$STATUS_FILTER")

# Collect rows from each review.{repo}.md
tmp_tsv=$(mktemp)
trap 'rm -f "$tmp_tsv"' EXIT

shopt -s nullglob
for review_file in "$REVIEW_DIR"/review.*.md; do
    base=$(basename "$review_file")
    # Strip "review." prefix and ".md" suffix to get repo name
    repo="${base#review.}"
    repo="${repo%.md}"

    # Skip generic review.md (legacy; not a per-repo file)
    [[ "$repo" == "" ]] && continue

    # Apply repo filter
    if [[ -n "$REPO_FILTER" ]] && [[ "$repo" != "$REPO_FILTER" ]]; then
        continue
    fi

    # Parse items, prefix each row with the repo
    awk -v REPO="$repo" -f "$PARSER" "$review_file" \
        | awk -v REPO="$repo" 'BEGIN{OFS="\t"} {print REPO, $0}' >> "$tmp_tsv"
done

# Filter rows
filter_rows() {
    awk -F'\t' -v DISP="$DISPOSITION_MATCH" -v DISP_FILTER="$DISPOSITION_FILTER" \
                -v ST="$STATUS_MATCH" -v ST_FILTER="$STATUS_FILTER" '
    {
        # Columns: 1=repo 2=id 3=file 4=line 5=severity 6=category 7=issue 8=fix 9=disp 10=status 11=notes
        if (DISP_FILTER != "" && $9 != DISP) next
        if (ST_FILTER  != "" && $10 != ST) next
        print
    }' "$tmp_tsv"
}

if [[ "$JSON_OUTPUT" == "true" ]]; then
    filter_rows | jq -Rn '
        [inputs
            | split("\t")
            | {
                repo: .[0],
                id: (.[1] | tonumber? // .[1]),
                file: .[2],
                line: .[3],
                severity: .[4],
                category: .[5],
                issue: .[6],
                fix: .[7],
                disposition: .[8],
                status: .[9],
                notes: .[10]
              }
        ]'
else
    filter_rows
fi
