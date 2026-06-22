#!/bin/bash
# Pre-bake a context bundle per ticket under
#   workareas/sprint-showcase/<id>/context/<KEY>/  (Jira summary +
# description in ticket.md, commit messages + diffstat in commits.md).
# One bundle per ticket so each TICKET_ANALYST reads only its own and
# never re-fetches. Sets tickets[].context_baked = true.
#
# Usage:
#   prepare-sprint-showcase.sh --run-id <id>
#
# Atomic mutations: write to .tmp then mv.

set -e

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"
JIRA_TICKET="$WORKSPACE/tools/jira/ticket.sh"

RUN_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//' >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

RUN_DIR="$WORKSPACE/workareas/sprint-showcase/$RUN_ID"
STATE="$RUN_DIR/state.json"
[[ -f "$STATE" ]] || { echo "No state.json at $STATE" >&2; exit 1; }

CONTEXT_ROOT="$RUN_DIR/context"
mkdir -p "$CONTEXT_ROOT"

# Resolve candidate repo dirs (workspace + repos/*) for `git show`.
REPO_DIRS=("$WORKSPACE")
for d in "$WORKSPACE"/repos/*/; do
    [[ -d "$d" ]] && REPO_DIRS+=("${d%/}")
done

# Find which repo dir owns a given short sha (first match wins).
find_repo_for_sha() {
    local sha="$1"
    for repo in "${REPO_DIRS[@]}"; do
        if git -C "$repo" cat-file -e "${sha}^{commit}" 2>/dev/null; then
            echo "$repo"
            return 0
        fi
    done
    return 1
}

COUNT=0
KEYS=$(jq -r '.tickets[].key' "$STATE")

for KEY in $KEYS; do
    BUNDLE="$CONTEXT_ROOT/$KEY"
    mkdir -p "$BUNDLE"

    # 1. Jira summary + description -> ticket.md (full format renders both).
    {
        bash "$JIRA_TICKET" "$KEY" full 2>/dev/null || echo "Could not fetch $KEY from Jira"
    } > "$BUNDLE/ticket.md"

    # 2. Commit messages + diffstat for this ticket's commit_shas -> commits.md.
    SHAS=$(jq -r --arg k "$KEY" '.tickets[] | select(.key == $k) | .commit_shas[]' "$STATE")
    {
        echo "# Commits referencing $KEY"
        echo ""
        if [[ -z "$SHAS" ]]; then
            echo "_No in-window commits referenced this ticket._"
        else
            for sha in $SHAS; do
                repo=$(find_repo_for_sha "$sha" || true)
                if [[ -z "$repo" ]]; then
                    echo "## $sha (repo not found in workspace)"
                    echo ""
                    continue
                fi
                echo "## $(basename "$repo")@$sha"
                echo ""
                echo '```'
                git -C "$repo" show --stat --no-patch --pretty="format:%h %an %ad%n%n%s%n%n%b" --date=short "$sha" 2>/dev/null || echo "(git show failed for $sha)"
                echo '```'
                echo ""
            done
        fi
    } > "$BUNDLE/commits.md"

    # 3. Flip context_baked = true for this ticket (atomic).
    TMP="$STATE.tmp"
    jq --arg k "$KEY" '
        .tickets = (.tickets | map(
            if .key == $k then .context_baked = true else . end
        ))' "$STATE" > "$TMP"
    mv "$TMP" "$STATE"

    COUNT=$((COUNT + 1))
done

echo "context bundles written: $COUNT (under $CONTEXT_ROOT/)"
