#!/bin/bash
# List items from style-review.{repo}.md files for a ticket.
# Usage:
#   style-items.sh EUDPA-XXXXX [--repo REPO] [--filter pending|fix|wont-fix|discuss|auto-resolved]
#                              [--status not-done|done|failed] [--by-file] [--json]
#
# Output (TSV columns):
#   repo \t id \t file \t line \t rule \t severity \t issue \t fix \t disposition \t status \t notes
#
# --by-file groups items by (repo, file) and emits JSON groups (only valid with --json).
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
BY_FILE=false

usage() {
    cat <<EOF
Usage: $0 EUDPA-XXXXX [--repo REPO] [--filter DISPOSITION] [--status STATUS] [--by-file] [--json]

  --repo R         Limit to one repo (matches style-review.<R>.md)
  --filter F       Filter by Disposition: pending|fix|wont-fix|discuss|auto-resolved
  --status S       Filter by Status: not-done|done|failed
  --by-file        Group items by (repo, file) — implies --json
  --json           Output JSON array instead of TSV
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --filter) DISPOSITION_FILTER="$2"; shift 2 ;;
        --status) STATUS_FILTER="$2"; shift 2 ;;
        --by-file) BY_FILE=true; JSON_OUTPUT=true; shift ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage

STYLE_DIR="$AGENTS_DIR/workareas/code-style-reviews/$TICKET"
[[ -d "$STYLE_DIR" ]] || { echo "Style review workspace not found: $STYLE_DIR" >&2; exit 1; }

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

tmp_tsv=$(mktemp)
trap 'rm -f "$tmp_tsv"' EXIT

shopt -s nullglob
for review_file in "$STYLE_DIR"/style-review.*.md; do
    base=$(basename "$review_file")
    repo="${base#style-review.}"
    repo="${repo%.md}"

    [[ -z "$repo" ]] && continue

    if [[ -n "$REPO_FILTER" ]] && [[ "$repo" != "$REPO_FILTER" ]]; then
        continue
    fi

    awk -f "$PARSER" "$review_file" \
        | awk -v REPO="$repo" 'BEGIN{OFS="\t"} {print REPO, $0}' >> "$tmp_tsv"
done

filter_rows() {
    awk -F'\t' -v DISP="$DISPOSITION_MATCH" -v DISP_FILTER="$DISPOSITION_FILTER" \
                -v ST="$STATUS_MATCH" -v ST_FILTER="$STATUS_FILTER" '
    {
        # Columns: 1=repo 2=id 3=file 4=line 5=rule 6=severity 7=issue 8=fix 9=disp 10=status 11=notes
        if (DISP_FILTER != "" && $9 != DISP) next
        if (ST_FILTER  != "" && $10 != ST) next
        print
    }' "$tmp_tsv"
}

if [[ "$BY_FILE" == "true" ]]; then
    filter_rows | jq -Rn '
        [inputs
            | split("\t")
            | {
                repo: .[0],
                id: (.[1] | tonumber? // .[1]),
                file: .[2],
                line: .[3],
                rule: .[4],
                severity: .[5],
                issue: .[6],
                fix: .[7],
                disposition: .[8],
                status: .[9],
                notes: .[10]
              }
        ]
        | group_by([.repo, .file])
        | map({repo: .[0].repo, file: .[0].file, items: .})'
elif [[ "$JSON_OUTPUT" == "true" ]]; then
    filter_rows | jq -Rn '
        [inputs
            | split("\t")
            | {
                repo: .[0],
                id: (.[1] | tonumber? // .[1]),
                file: .[2],
                line: .[3],
                rule: .[4],
                severity: .[5],
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
