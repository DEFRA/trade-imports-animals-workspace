#!/bin/bash
# Show combined govuk-frontend upgrade status (planning + implementation)
# Usage: ./upgrade-status.sh --run-id TICKET [--repo REPO_NAME] [--json]
#
# Extends list-plans.sh to also show .done and .failed from Phase 3 implementation.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

RUN_ID=""
REPO_FILTER=""
JSON_OUTPUT=false

show_help() {
    cat << EOF
Show combined govuk-frontend upgrade status (planning + implementation)

Usage: ./upgrade-status.sh --run-id TICKET [options]

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Only show specific repo
  --json                 Output JSON format
  --help                 Show this help message

Examples:
  ./upgrade-status.sh --run-id EUDPA-20578
  ./upgrade-status.sh --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./upgrade-status.sh --run-id EUDPA-20578 --json

Output states:
  unplanned  zero-byte .md stub — not yet analysed (Phase 2 pending)
  todo       .todo file — code changes required (Phase 3 pending)
  noop       .noop file — no changes needed (skipped in Phase 3)
  done       .done file — implemented and committed
  failed     .failed file — implementation failed, needs investigation
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help) show_help ;;
        --run-id) RUN_ID="$2"; shift 2 ;;
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

log() {
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo "$1"
    fi
}

error() {
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"error\": \"$1\"}"
    else
        echo "Error: $1" >&2
    fi
    exit 1
}

[[ -z "$RUN_ID" ]] && error "--run-id TICKET is required"

WORKSPACE_BASE="$AGENTS_DIR/workareas/govuk-upgrades/$RUN_ID"

if [[ ! -d "$WORKSPACE_BASE" ]]; then
    error "Workspace not found: $WORKSPACE_BASE. Run discover-versions.sh first."
fi

grand_unplanned=0
grand_todo=0
grand_noop=0
grand_done=0
grand_failed=0

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"run_id\": \"$RUN_ID\","
    echo "  \"repos\": ["
    first_repo=true
fi

for repo_dir in "$WORKSPACE_BASE"/trade-imports-animals-*; do
    [[ ! -d "$repo_dir" ]] && continue
    repo_name=$(basename "$repo_dir")
    [[ -n "$REPO_FILTER" ]] && [[ "$repo_name" != "$REPO_FILTER" ]] && continue

    unplanned=$(find "$repo_dir" -maxdepth 1 -name "version__*.md" -size 0 2>/dev/null | wc -l | tr -d ' ')
    todo=$(find "$repo_dir" -maxdepth 1 -name "version__*.todo" 2>/dev/null | wc -l | tr -d ' ')
    noop=$(find "$repo_dir" -maxdepth 1 -name "version__*.noop" 2>/dev/null | wc -l | tr -d ' ')
    done_count=$(find "$repo_dir" -maxdepth 1 -name "version__*.done" 2>/dev/null | wc -l | tr -d ' ')
    failed=$(find "$repo_dir" -maxdepth 1 -name "version__*.failed" 2>/dev/null | wc -l | tr -d ' ')

    ((grand_unplanned+=unplanned))
    ((grand_todo+=todo))
    ((grand_noop+=noop))
    ((grand_done+=done_count))
    ((grand_failed+=failed))

    current=""
    target=""
    if [[ -f "$repo_dir/.upgrade-meta.json" ]]; then
        current=$(jq -r '.current_version // ""' "$repo_dir/.upgrade-meta.json" 2>/dev/null || echo "")
        target=$(jq -r '.target_version // ""' "$repo_dir/.upgrade-meta.json" 2>/dev/null || echo "")
    fi

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        [[ "$first_repo" == "true" ]] && first_repo=false || echo ","
        echo -n "    {\"repo\": \"$repo_name\", \"current\": \"$current\", \"target\": \"$target\","
        echo -n " \"unplanned\": $unplanned, \"todo\": $todo, \"noop\": $noop,"
        echo -n " \"done\": $done_count, \"failed\": $failed}"
    else
        echo ""
        printf "%-50s  %s → %s\n" "$repo_name" "$current" "$target"
        printf "  Unplanned: %3d  |  Todo: %3d  |  Noop: %3d  |  Done: %3d  |  Failed: %3d\n" \
            "$unplanned" "$todo" "$noop" "$done_count" "$failed"
        if [[ "$failed" -gt 0 ]]; then
            echo "  Failed versions:"
            find "$repo_dir" -maxdepth 1 -name "version__*.failed" | sort -V | while read -r f; do
                echo "    $(basename "$f" .failed | sed 's/^version__//')"
            done
        fi
    fi
done

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo ""
    echo "  ],"
    echo "  \"summary\": {"
    echo "    \"unplanned\": $grand_unplanned,"
    echo "    \"todo\": $grand_todo,"
    echo "    \"noop\": $grand_noop,"
    echo "    \"done\": $grand_done,"
    echo "    \"failed\": $grand_failed"
    echo "  }"
    echo "}"
else
    echo ""
    echo "=== govuk-frontend Upgrade Status (Run: $RUN_ID) ==="
    echo "  Unplanned:         $grand_unplanned"
    echo "  Todo (changes):    $grand_todo"
    echo "  Noop (no changes): $grand_noop"
    echo "  Done:              $grand_done"
    echo "  Failed:            $grand_failed"
fi
