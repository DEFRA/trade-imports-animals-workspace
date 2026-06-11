#!/bin/bash
# Check out the PR head branch in the workspace dev clone (repos/<repo>).
# Usage: sync-workspace-repo.sh EUDPA-X --repo REPO [--json]
#
# Reads PR number from workareas/reviews/EUDPA-X/.review-meta.json.

set -e

TICKET=""
REPO=""
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --repo) REPO="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -n "$TICKET" ]] && [[ -n "$REPO" ]] || { echo "Usage: $0 EUDPA-X --repo REPO" >&2; exit 1; }

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"
META="$WORKSPACE/workareas/reviews/$TICKET/.review-meta.json"
REPO_DIR="$WORKSPACE/repos/$REPO"

[[ -f "$META" ]] || { echo "Missing review meta: $META (run start-review.sh first)" >&2; exit 1; }
[[ -d "$REPO_DIR/.git" ]] || { echo "Workspace repo missing: $REPO_DIR (run make setup)" >&2; exit 1; }

pr=$(jq -r --arg r "$REPO" '.prs[] | select(.repo == $r) | .pr' "$META")
[[ -n "$pr" ]] && [[ "$pr" != "null" ]] || { echo "No PR for $REPO in $META" >&2; exit 1; }

head_branch=$(gh pr view "$pr" --repo "DEFRA/$REPO" --json headRefName --jq '.headRefName' 2>/dev/null)
[[ -n "$head_branch" ]] || { echo "Could not read PR head branch for DEFRA/$REPO#$pr" >&2; exit 1; }

git -C "$REPO_DIR" fetch --quiet origin "$head_branch"
git -C "$REPO_DIR" checkout --quiet "$head_branch"
git -C "$REPO_DIR" pull --ff-only --quiet origin "$head_branch" 2>/dev/null || true

sha=$(git -C "$REPO_DIR" rev-parse --short HEAD)

if [[ "$JSON" == "1" ]]; then
    jq -n --arg repo "$REPO" --arg pr "$pr" --arg branch "$head_branch" --arg sha "$sha" \
        '{repo: $repo, pr: ($pr|tonumber), branch: $branch, head_sha: $sha}'
else
    echo "Synced $REPO to $head_branch @ $sha (PR #$pr)"
fi
