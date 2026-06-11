#!/bin/bash
# Pin a clone's fetch refspec so a bare `git fetch` / `git pull` can
# never drag in the gh-pages branch (multi-GB published artifacts —
# 17 GB object graph on the frontend repo vs 7 MB for main).
#
# Usage:
#   light-remote.sh --exclude-gh-pages <repo_dir>
#   light-remote.sh --pr-only <repo_dir> <pr_number> [--include-main]
#
# --exclude-gh-pages  All heads EXCEPT gh-pages (negative refspec,
#                     requires git >= 2.29). For long-lived dev clones
#                     that need colleague branches and full history.
#                     A no-op when gh-pages is absent on the remote
#                     (the truncate job deletes/recreates it).
#
# --pr-only           Only refs/pull/<N>/head -> origin/pr-<N>. For
#                     per-ticket review clones under workareas/ —
#                     read-only snapshots that never need other
#                     branches. --include-main adds origin/main as a
#                     second line (merged PRs: refs/pull/<N>/head is
#                     frozen, post-merge work lands on main).
#
# Both modes are idempotent — safe to run before every fetch as a
# self-heal for clones created with the default `+refs/heads/*`
# refspec.

set -e

MODE=""
REPO_DIR=""
PR_NUMBER=""
INCLUDE_MAIN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --exclude-gh-pages) MODE="exclude"; shift ;;
        --pr-only) MODE="pr-only"; shift ;;
        --include-main) INCLUDE_MAIN=true; shift ;;
        -*) echo "Unknown option: $1" >&2; exit 1 ;;
        *)
            if [[ -z "$REPO_DIR" ]]; then REPO_DIR="$1"
            elif [[ -z "$PR_NUMBER" ]]; then PR_NUMBER="$1"
            else echo "Unexpected arg: $1" >&2; exit 1
            fi
            shift ;;
    esac
done

usage() {
    echo "Usage: $0 --exclude-gh-pages <repo_dir>" >&2
    echo "       $0 --pr-only <repo_dir> <pr_number> [--include-main]" >&2
    exit 1
}

[[ -z "$MODE" || -z "$REPO_DIR" ]] && usage
[[ "$MODE" == "pr-only" && -z "$PR_NUMBER" ]] && usage
[[ -d "$REPO_DIR/.git" ]] || { echo "Not a git repo: $REPO_DIR" >&2; exit 1; }

case "$MODE" in
    exclude)
        # Negative refspecs need git >= 2.29.
        ver=$(git version | sed 's/^git version //; s/ .*//')
        major=${ver%%.*}
        minor=$(echo "$ver" | cut -d. -f2)
        if (( major < 2 || (major == 2 && minor < 29) )); then
            echo "git $ver too old for negative refspecs (need >= 2.29)" >&2
            exit 1
        fi
        git -C "$REPO_DIR" config --replace-all remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
        git -C "$REPO_DIR" config --add remote.origin.fetch '^refs/heads/gh-pages'
        ;;
    pr-only)
        git -C "$REPO_DIR" config --replace-all remote.origin.fetch \
            "+refs/pull/$PR_NUMBER/head:refs/remotes/origin/pr-$PR_NUMBER"
        if [[ "$INCLUDE_MAIN" == "true" ]]; then
            git -C "$REPO_DIR" config --add remote.origin.fetch \
                '+refs/heads/main:refs/remotes/origin/main'
        fi
        ;;
esac

# Drop the remote-tracking ref so already-fetched gh-pages objects are
# no longer pinned (gc can reclaim them); ignore if never fetched.
git -C "$REPO_DIR" update-ref -d refs/remotes/origin/gh-pages 2>/dev/null || true

echo "remote.origin.fetch pinned ($MODE) for $REPO_DIR:"
git -C "$REPO_DIR" config --get-all remote.origin.fetch | sed 's/^/  /'
