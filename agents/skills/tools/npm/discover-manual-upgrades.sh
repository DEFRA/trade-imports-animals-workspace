#!/bin/bash
# Discover manual upgrades (code changes required)
# Usage: ./discover-manual-upgrades.sh --run-id TICKET [--repo REPO_NAME] [--json]

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
Discover manual upgrades requiring code changes

Usage: ./discover-manual-upgrades.sh --run-id TICKET [options]

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Only process specific repo (e.g., trade-imports-animals-frontend)
  --json                 Output JSON format
  --help                 Show this help message

Examples:
  ./discover-manual-upgrades.sh --run-id EUDPA-20578
  ./discover-manual-upgrades.sh --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./discover-manual-upgrades.sh --run-id EUDPA-20578 --json

Output:
  Lists all upgrade__*.manual.md migration plans (code changes required)
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

if [[ -z "$RUN_ID" ]]; then
    error "--run-id TICKET is required (e.g. --run-id EUDPA-12345)"
fi

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

PLANS_DIR="$AGENTS_DIR/workareas/npm-upgrades/$RUN_ID"

# Check if migration plans exist
if [ ! -d "$PLANS_DIR" ]; then
    error "Migration plans directory not found: $PLANS_DIR"
fi

# Get risk level from migration plan
get_risk_level() {
    local plan_file="$1"

    if grep -qi "overall risk.*low\|risk level.*low\|\*\*risk:\*\* low" "$plan_file"; then
        echo "LOW"
    elif grep -qi "overall risk.*medium\|risk level.*medium\|\*\*risk:\*\* medium" "$plan_file"; then
        echo "MEDIUM"
    elif grep -qi "overall risk.*high\|risk level.*high\|\*\*risk:\*\* high" "$plan_file"; then
        echo "HIGH"
    else
        echo "UNKNOWN"
    fi
}

# Parse package info from migration plan filename
parse_plan_filename() {
    local filename="$1"
    local base
    base=$(basename "$filename")
    base="${base%.manual.md}"
    base="${base#upgrade__}"

    # Split by __ using awk (handles multi-char delimiters)
    local parts=()
    while IFS= read -r part; do
        parts+=("$part")
    done < <(echo "$base" | awk -F'__' '{for(i=1;i<=NF;i++) print $i}')

    if [[ "${parts[0]}" == "@"* ]]; then
        # Scoped package: @scope__name__current__target
        package="${parts[0]}/${parts[1]}"
        current="${parts[2]}"
        target="${parts[3]}"
    else
        # Regular package: name__current__target
        package="${parts[0]}"
        current="${parts[1]}"
        target="${parts[2]}"
    fi

    echo "$package|$current|$target"
}

# Process repositories
total_repos=0
total_discovered=0

# Store results in temp file
results_file=$(mktemp)
trap "rm -f $results_file" EXIT

log "Discovering manual upgrade candidates..."
log ""

for repo_dir in "$PLANS_DIR"/trade-imports-animals-*; do
    if [ ! -d "$repo_dir" ]; then
        continue
    fi

    repo_name=$(basename "$repo_dir")

    # Apply repo filter if specified
    if [[ -n "$REPO_FILTER" ]] && [[ "$repo_name" != "$REPO_FILTER" ]]; then
        continue
    fi

    ((total_repos++))

    repo_discovered=0

    # Process each manual migration plan (extension = classification: code changes required)
    for plan_file in "$repo_dir"/upgrade__*.manual.md; do
        if [ ! -f "$plan_file" ]; then
            continue
        fi

        # Parse package info
        IFS='|' read -r package current target <<< "$(parse_plan_filename "$plan_file")"

        # Get risk level
        risk=$(get_risk_level "$plan_file")

        # Store result
        echo "$repo_name|$package|$current|$target|$risk|$plan_file" >> "$results_file"

        ((repo_discovered++))
        ((total_discovered++))

        log "  ✓ Found: $package $current → $target (risk: $risk)"
    done

    if [ "$repo_discovered" -gt 0 ]; then
        log "  Repo: $repo_name - $repo_discovered manual upgrades"
        log ""
    fi
done

# Output summary
if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"summary\": {"
    echo "    \"total_repos\": $total_repos,"
    echo "    \"total_manual_upgrades\": $total_discovered"
    echo "  },"
    echo "  \"upgrades\": ["
    first=true
    while IFS='|' read -r repo package current target risk plan_file; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo "    {"
        echo "      \"repo\": \"$repo\","
        echo "      \"package\": \"$package\","
        echo "      \"current\": \"$current\","
        echo "      \"target\": \"$target\","
        echo "      \"risk\": \"$risk\","
        echo "      \"plan\": \"$plan_file\""
        echo -n "    }"
    done < "$results_file"
    echo ""
    echo "  ]"
    echo "}"
else
    echo ""
    echo "=== Manual Upgrade Discovery Complete ==="
    echo ""
    echo "Total repos: $total_repos"
    echo "Total manual upgrades: $total_discovered"
    echo ""

    if [ "$total_discovered" -gt 0 ]; then
        echo "Breakdown by repo:"
        sort "$results_file" | awk -F'|' '{print $1}' | uniq -c | while read count repo; do
            printf "  %-35s %3d manual upgrades\n" "$repo" "$count"
        done
        echo ""
        echo "Next steps:"
        echo "  1. Review plans: cat npm-upgrades/$RUN_ID/{repo}/upgrade__*.manual.md"
        echo "  2. Spawn agents: See personas/npm-upgrade/MANUAL_IMPLEMENTOR.md"
        echo "  3. Or use ORCHESTRATOR for Phase 3 automation"
    else
        echo "No manual upgrades found - all packages are automated!"
    fi
fi
