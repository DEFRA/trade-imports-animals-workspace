#!/bin/bash
# Combined upgrade status: migration plans + implementation progress
# Shows total packages, automated (done/failed/pending), manual packages, and unplanned stubs

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
Combined NPM upgrade status: migration plans + implementation progress

Usage: ./upgrade-status.sh --run-id TICKET [options]

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Only show specific repo (e.g., trade-imports-animals-frontend)
  --json                 Output JSON format
  --help                 Show this help message

Examples:
  ./upgrade-status.sh --run-id EUDPA-20578
  ./upgrade-status.sh --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./upgrade-status.sh --run-id EUDPA-20578 --json

Shows:
  - Total packages per repo (migration plans created)
  - Pending plans: stubs not yet researched by PLANNER
  - Automated packages: done/failed/pending (upgrade__*.auto.md)
  - Manual packages: requiring code changes (upgrade__*.manual.md)
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help)
            show_help
            ;;
        --run-id)
            RUN_ID="$2"
            shift 2
            ;;
        --repo)
            REPO_FILTER="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [[ -z "$RUN_ID" ]]; then
    echo "Error: --run-id TICKET is required (e.g. --run-id EUDPA-12345)" >&2
    exit 1
fi

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

PLANS_DIR="$AGENTS_DIR/workareas/npm-upgrades/$RUN_ID"
IMPL_DIR="$AGENTS_DIR/workareas/npm-implementations/$RUN_ID"

# Check if plans directory exists
if [ ! -d "$PLANS_DIR" ]; then
    echo "Error: Migration plans directory not found: $PLANS_DIR" >&2
    exit 1
fi

# Create temp file for repo stats (format: repo|total|pending_plans|auto|done|failed|pending|inprogress|manual)
stats_file=$(mktemp)
trap "rm -f $stats_file" EXIT

# Analyze each repo
for repo_dir in "$PLANS_DIR"/trade-imports-animals-*; do
    if [ ! -d "$repo_dir" ]; then
        continue
    fi

    repo_name=$(basename "$repo_dir")

    # Apply repo filter if specified
    if [[ -n "$REPO_FILTER" ]] && [[ "$repo_name" != "$REPO_FILTER" ]]; then
        continue
    fi

    # Count migration plans by extension
    auto_plans=$(find "$repo_dir" -name "upgrade__*.auto.md" 2>/dev/null | wc -l | tr -d ' ')
    manual_plans=$(find "$repo_dir" -name "upgrade__*.manual.md" 2>/dev/null | wc -l | tr -d ' ')
    pending_plans=$(find "$repo_dir" -name "upgrade__*.md" ! -name "*.auto.md" ! -name "*.manual.md" 2>/dev/null | wc -l | tr -d ' ')
    total_plans=$(( auto_plans + manual_plans + pending_plans ))

    if [ "$total_plans" -eq 0 ]; then
        continue
    fi

    # Get implementation status for automated packages
    impl_repo_dir="$IMPL_DIR/$repo_name"

    if [ -d "$impl_repo_dir" ]; then
        auto_done=$(find "$impl_repo_dir" -name "*.done" 2>/dev/null | wc -l | tr -d ' ')
        auto_failed=$(find "$impl_repo_dir" -name "*.failed" 2>/dev/null | wc -l | tr -d ' ')
        auto_pending=$(find "$impl_repo_dir" -name "*.todo" 2>/dev/null | wc -l | tr -d ' ')
        auto_inprogress=$(find "$impl_repo_dir" -name "*.inprogress" 2>/dev/null | wc -l | tr -d ' ')
    else
        auto_done=0
        auto_failed=0
        auto_pending=$auto_plans
        auto_inprogress=0
    fi

    # Store stats in temp file
    echo "$repo_name|$total_plans|$pending_plans|$auto_plans|$auto_done|$auto_failed|$auto_pending|$auto_inprogress|$manual_plans" >> "$stats_file"
done

# Sort stats file
sort -o "$stats_file" "$stats_file"

# Output results
if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"run_id\": \"$RUN_ID\","
    echo "  \"repos\": {"
    first=true
    while IFS='|' read -r repo_name total pending_plans auto done failed pending inprogress manual; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi

        echo "    \"$repo_name\": {"
        echo "      \"total\": $total,"
        echo "      \"pending_plans\": $pending_plans,"
        echo "      \"automated\": {"
        echo "        \"total\": $auto,"
        echo "        \"done\": $done,"
        echo "        \"failed\": $failed,"
        echo "        \"pending\": $pending,"
        echo "        \"inprogress\": $inprogress"
        echo "      },"
        echo "      \"manual\": $manual"
        echo -n "    }"
    done < "$stats_file"
    echo ""
    echo "  }"
    echo "}"
else
    echo "==========================================="
    echo "NPM Upgrade Status ($RUN_ID)"
    echo "==========================================="
    echo ""

    # Calculate summary stats
    total_packages=0
    total_pending_plans=0
    total_auto=0
    total_auto_done=0
    total_auto_failed=0
    total_auto_pending=0
    total_manual=0

    while IFS='|' read -r repo_name total pending_plans auto done failed pending inprogress manual; do
        ((total_packages += total))
        ((total_pending_plans += pending_plans))
        ((total_auto += auto))
        ((total_auto_done += done))
        ((total_auto_failed += failed))
        ((total_auto_pending += pending))
        ((total_manual += manual))
    done < "$stats_file"

    echo "📊 Overall Progress:"
    echo "  Total packages: $total_packages"
    echo "  Pending planning (stubs): $total_pending_plans"
    echo "  Automated (no code changes): $total_auto"
    echo "    ✅ Done: $total_auto_done"
    echo "    ❌ Failed: $total_auto_failed"
    echo "    ⏳ Pending: $total_auto_pending"
    echo "  Manual (code changes required): $total_manual"

    if [ "$total_auto" -gt 0 ]; then
        auto_progress=$((total_auto_done * 100 / total_auto))
        echo "  Automation progress: $auto_progress%"
    fi

    echo ""
    echo "==========================================="
    echo "By Repository"
    echo "==========================================="
    echo ""

    printf "%-40s %5s | %5s | %5s %5s %5s %5s | %6s\n" \
        "REPOSITORY" "TOTAL" "STUB" "AUTO" "DONE" "FAIL" "PEND" "MANUAL"
    printf "%-40s %5s | %5s | %5s %5s %5s %5s | %6s\n" \
        "----------" "-----" "----" "-----" "-----" "-----" "-----" "------"

    while IFS='|' read -r repo_name total pending_plans auto done failed pending inprogress manual; do
        printf "%-40s %5d | %5d | %5d %5d %5d %5d | %6d\n" \
            "$repo_name" "$total" "$pending_plans" "$auto" "$done" "$failed" "$pending" "$manual"
    done < "$stats_file"

    echo ""

    # Show failed packages if any
    if [ "$total_auto_failed" -gt 0 ]; then
        echo "==========================================="
        echo "❌ Failed Packages (need manual review)"
        echo "==========================================="
        echo ""

        while IFS='|' read -r repo_name total pending_plans auto done failed pending inprogress manual; do
            impl_repo_dir="$IMPL_DIR/$repo_name"

            if [ ! -d "$impl_repo_dir" ]; then
                continue
            fi

            failed_files=$(find "$impl_repo_dir" -name "*.failed" 2>/dev/null || true)

            if [ -n "$failed_files" ]; then
                echo "$repo_name:"
                echo "$failed_files" | while read -r failed_file; do
                    basename "$failed_file" .failed | sed 's/implement__/  - /; s/__/ /g'
                done
                echo ""
            fi
        done < "$stats_file"
    fi

    echo "==========================================="
    echo "Next Steps"
    echo "==========================================="
    echo ""

    if [ "$total_pending_plans" -gt 0 ]; then
        echo "📝 Pending planning stubs: $total_pending_plans"
        echo "   Spawn PLANNER agents for unresearched packages"
        echo ""
    fi

    if [ "$total_auto_pending" -gt 0 ]; then
        echo "⏳ Pending automated upgrades: $total_auto_pending"
        echo "   Run: ./tools/npm/run-automated-upgrades.sh <repo-name> --run-id $RUN_ID"
        echo ""
    fi

    if [ "$total_auto_failed" -gt 0 ]; then
        echo "❌ Failed automated upgrades: $total_auto_failed"
        echo "   Investigate failures and update migration plans"
        echo ""
    fi

    if [ "$total_manual" -gt 0 ]; then
        echo "🔧 Manual upgrades: $total_manual"
        echo "   Review migration plans in npm-upgrades/$RUN_ID/<repo>/"
        echo ""
    fi
fi
