#!/bin/bash
# Dispatcher for govuk-frontend upgrade runs.
#
# Usage:
#   start-upgrade.sh --ticket EUDPA-XXXX [--target VERSION]
#   start-upgrade.sh --branch <branch-name> [--target VERSION]
#
# With --ticket: branch is chore/EUDPA-XXXX (run-id == ticket).
# With --branch: branch is verbatim (run-id is derived from the branch
#   suffix if it starts with chore/EUDPA-XXXX, else the branch slug).
#
# Runs:
#   1. discover-repos.sh        → writes .run-meta.json (in-scope repos)
#   2. setup-branch.sh per repo → ensures every in-scope repo is on the branch
#   3. discover-versions.sh per repo → seeds versions.{repo}.json + pre-bakes
#
# Prints `PHASE: 1` on stdout so the caller can branch.

set -e

TICKET=""
BRANCH=""
TARGET_VERSION=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --ticket) TICKET="$2"; shift 2 ;;
        --branch) BRANCH="$2"; shift 2 ;;
        --target) TARGET_VERSION="$2"; shift 2 ;;
        -h|--help)
            cat <<EOF
Usage:
  $0 --ticket EUDPA-XXXX [--target VERSION]
  $0 --branch <branch-name> [--target VERSION]

If --ticket is given the branch is chore/EUDPA-XXXX. If --branch is given
the branch is used verbatim; a Jira ticket prefix is preferred (DevOps
ticket conventions: parent EUDPA-144, labels DevOps+tech-improvement,
priority Medium, type Task — see ticket-creator skill).
EOF
            exit 0
            ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

if [[ -n "$TICKET" && -n "$BRANCH" ]]; then
    echo "Pass --ticket OR --branch, not both" >&2
    exit 1
fi

if [[ -z "$TICKET" && -z "$BRANCH" ]]; then
    echo "One of --ticket or --branch is required" >&2
    exit 1
fi

if [[ -n "$TICKET" ]]; then
    [[ "$TICKET" =~ ^EUDPA-[0-9]+$ ]] || {
        echo "--ticket must match EUDPA-NNNN (got: $TICKET)" >&2
        exit 1
    }
    BRANCH="chore/$TICKET"
    RUN_ID="$TICKET"
else
    # Derive run-id from branch if it embeds a ticket; else use a slug.
    if [[ "$BRANCH" =~ (EUDPA-[0-9]+) ]]; then
        RUN_ID="${BASH_REMATCH[1]}"
    else
        RUN_ID=$(printf '%s' "$BRANCH" | tr '/' '_' | tr -c '[:alnum:]_-' '_')
    fi
fi

echo "PHASE: 1"
echo "Run ID: $RUN_ID"
echo "Branch: $BRANCH"
[[ -n "$TARGET_VERSION" ]] && echo "Target: $TARGET_VERSION"
echo

# Step 1: discover in-scope repos.
discover_args=(--run-id "$RUN_ID" --branch "$BRANCH")
[[ -n "$TARGET_VERSION" ]] && discover_args+=(--target "$TARGET_VERSION")
"$HOME/git/defra/trade-imports-animals/tools/govuk/discover-repos.sh" "${discover_args[@]}"

META_FILE="$HOME/git/defra/trade-imports-animals/workareas/govuk-upgrades/$RUN_ID/.run-meta.json"
mapfile -t REPOS < <(jq -r '.repos[]' "$META_FILE")

if [[ ${#REPOS[@]} -eq 0 ]]; then
    echo "No repos depend on govuk-frontend — nothing to do." >&2
    exit 0
fi

# Step 2: ensure each repo is on the branch.
echo
echo "Setting up branch $BRANCH on ${#REPOS[@]} repo(s)..."
for repo in "${REPOS[@]}"; do
    "$HOME/git/defra/trade-imports-animals/tools/govuk/setup-branch.sh" --branch "$BRANCH" --repo "$repo"
done

# Step 3: discover versions per repo.
echo
echo "Discovering versions per repo..."
for repo in "${REPOS[@]}"; do
    repo_path="$HOME/git/defra/trade-imports-animals/repos/$repo"
    dv_args=("$repo_path" --run-id "$RUN_ID")
    [[ -n "$TARGET_VERSION" ]] && dv_args+=(--target "$TARGET_VERSION")
    "$HOME/git/defra/trade-imports-animals/tools/govuk/discover-versions.sh" "${dv_args[@]}"
done

echo
echo "=== START COMPLETE ==="
"$HOME/git/defra/trade-imports-animals/tools/govuk/list-plans.sh" --run-id "$RUN_ID"

echo
echo "Next: Phase 2 — spawn VERSION_PLANNER per unplanned version (see PHASE_2_MANAGER.md)."
