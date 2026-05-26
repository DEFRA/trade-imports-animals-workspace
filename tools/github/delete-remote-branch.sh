#!/bin/bash
# Delete a branch from a GitHub repo (remote-only — does not touch local).
# Usage: ./delete-remote-branch.sh REPO BRANCH
# Example: ./delete-remote-branch.sh trade-imports-animals-frontend \
#            chore/EUDPA-179-review-handoff
#
# Used by the review BATCH_IMPLEMENTOR when the PR owner has finished
# walking a handoff branch and opted into remote cleanup.

set -e

REPO="${1:-}"
BRANCH="${2:-}"

if [[ -z "$REPO" ]] || [[ -z "$BRANCH" ]]; then
    echo "Usage: ./delete-remote-branch.sh REPO BRANCH" >&2
    exit 1
fi

gh api -X DELETE "repos/DEFRA/$REPO/git/refs/heads/$BRANCH"
