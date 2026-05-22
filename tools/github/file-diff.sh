#!/bin/bash
# Get a single file's hunks from a PR diff
# Usage: ./file-diff.sh REPO PR_NUMBER FILE_PATH
# Example: ./file-diff.sh trade-imports-animals-frontend 1234 src/server/router.js
#
# Filters `gh pr diff` to only the `diff --git a/FILE b/FILE` block for
# the requested file. Exit 0 with empty output if the file is not in
# the PR diff.

set -e

REPO="${1:-}"
PR_NUMBER="${2:-}"
FILE_PATH="${3:-}"

if [[ -z "$REPO" ]] || [[ -z "$PR_NUMBER" ]] || [[ -z "$FILE_PATH" ]]; then
    echo "Usage: ./file-diff.sh REPO PR_NUMBER FILE_PATH" >&2
    echo "Example: ./file-diff.sh trade-imports-animals-frontend 1234 src/server/router.js" >&2
    exit 1
fi

gh pr diff "$PR_NUMBER" --repo "DEFRA/$REPO" | awk -v f="$FILE_PATH" '
    /^diff --git / {
        in_block = ($0 ~ ("a/" f "[[:space:]]") && $0 ~ ("b/" f "$"))
    }
    in_block { print }
'
