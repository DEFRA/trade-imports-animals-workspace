#!/bin/bash
# List PR files for one repo that lack a per-file `.review.md`.
# Usage:
#   list-coverage-gaps.sh REVIEW_DIR REPO_NAME PR_NUMBER [--tsv|--json]
#
# Output (TSV by default): one file path per line.
# JSON: array of strings.

set -e

OUTPUT_FORMAT="tsv"
REVIEW_DIR=""
REPO_NAME=""
PR_NUMBER=""

usage() {
    echo "Usage: $0 REVIEW_DIR REPO_NAME PR_NUMBER [--tsv|--json]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --tsv)  OUTPUT_FORMAT="tsv"; shift ;;
        --json) OUTPUT_FORMAT="json"; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *)
            if   [[ -z "$REVIEW_DIR" ]]; then REVIEW_DIR="$1"
            elif [[ -z "$REPO_NAME"  ]]; then REPO_NAME="$1"
            elif [[ -z "$PR_NUMBER"  ]]; then PR_NUMBER="$1"
            fi
            shift
            ;;
    esac
done

[[ -z "$REVIEW_DIR" || -z "$REPO_NAME" || -z "$PR_NUMBER" ]] && usage
[[ -d "$REVIEW_DIR" ]] || { echo "Review dir not found: $REVIEW_DIR" >&2; exit 1; }

pr_files=$(gh pr view "$PR_NUMBER" --repo "DEFRA/$REPO_NAME" --json files --jq '.files[].path' 2>/dev/null) || {
    echo "Failed to fetch PR files for DEFRA/$REPO_NAME #$PR_NUMBER" >&2
    exit 1
}

gaps=""
while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    underscored=${f//\//_}
    review_file="$REVIEW_DIR/file-reviews/$REPO_NAME/${underscored}.review.md"
    if [[ ! -f "$review_file" ]]; then
        gaps="${gaps}${f}\n"
    fi
done <<<"$pr_files"

if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    if [[ -z "$gaps" ]]; then
        echo "[]"
    else
        printf '%b' "$gaps" | jq -Rn '[inputs | select(length > 0)]'
    fi
else
    if [[ -n "$gaps" ]]; then
        printf '%b' "$gaps"
    fi
fi
