#!/bin/bash
# Post a markdown comment to a GitHub PR.
# Usage: ./pr-comment.sh REPO PR_NUMBER --body-file PATH
# Example: ./pr-comment.sh trade-imports-animals-frontend 1234 \
#            --body-file /tmp/comment.md
#
# Body is read from a file (not a CLI string) because review handoff
# comments can be many KB. Emits the created comment's URL on stdout.

set -e

REPO=""
PR_NUMBER=""
BODY_FILE=""

POSITIONAL=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --body-file) BODY_FILE="$2"; shift 2 ;;
        -*) echo "Unknown option: $1" >&2; exit 1 ;;
        *) POSITIONAL+=("$1"); shift ;;
    esac
done

REPO="${POSITIONAL[0]:-}"
PR_NUMBER="${POSITIONAL[1]:-}"

if [[ -z "$REPO" ]] || [[ -z "$PR_NUMBER" ]] || [[ -z "$BODY_FILE" ]]; then
    echo "Usage: ./pr-comment.sh REPO PR_NUMBER --body-file PATH" >&2
    exit 1
fi

if [[ ! -f "$BODY_FILE" ]]; then
    echo "Body file not found: $BODY_FILE" >&2
    exit 1
fi

gh pr comment "$PR_NUMBER" --repo "DEFRA/$REPO" --body-file "$BODY_FILE"
