#!/bin/bash
# Ensure a repo is on the named branch, creating it if missing.
# Usage:
#   setup-branch.sh --branch <branch> --repo <repo-name>
#
# Wraps `git -C ... rev-parse --verify` + checkout/-b so SKILL.md doesn't
# need to pipe `branch -a` through grep.

set -e

BRANCH=""
REPO=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --branch) BRANCH="$2"; shift 2 ;;
        --repo) REPO="$2"; shift 2 ;;
        -h|--help)
            cat <<EOF
Usage: $0 --branch <branch> --repo <repo-name>
EOF
            exit 0
            ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$BRANCH" ]] && { echo "--branch required" >&2; exit 1; }
[[ -z "$REPO" ]] && { echo "--repo required" >&2; exit 1; }

REPO_DIR="$HOME/git/defra/trade-imports-animals/repos/$REPO"
[[ -d "$REPO_DIR/.git" ]] || { echo "Not a git repo: $REPO_DIR" >&2; exit 1; }

current=$(git -C "$REPO_DIR" branch --show-current)
if [[ "$current" == "$BRANCH" ]]; then
    echo "$REPO: already on $BRANCH"
    exit 0
fi

if git -C "$REPO_DIR" rev-parse --verify --quiet "$BRANCH" >/dev/null; then
    git -C "$REPO_DIR" checkout "$BRANCH"
    echo "$REPO: switched to existing branch $BRANCH"
else
    git -C "$REPO_DIR" checkout -b "$BRANCH"
    echo "$REPO: created and switched to $BRANCH"
fi
