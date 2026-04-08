#!/bin/bash
# Discover "no code changes needed" upgrades and create implementation workspace
# Usage: ./discover-implementations.sh --run-id TICKET [--repo REPO_NAME] [--json]
#
# Creates .todo marker files for each low-risk upgrade that requires no code changes.
# Agents can then process these files in parallel across repos, but sequentially within each repo.

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
Discover "no code changes needed" upgrades and create implementation workspace

Usage: ./discover-implementations.sh --run-id TICKET [options]

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Only process specific repo (e.g., trade-imports-animals-frontend)
  --json                 Output JSON format
  --help                 Show this help message

Examples:
  ./discover-implementations.sh --run-id EUDPA-20578
  ./discover-implementations.sh --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./discover-implementations.sh --run-id EUDPA-20578 --json

This script:
  1. Scans all migration plans in npm-upgrades/{run-id}/
  2. Filters for upgrade__*.auto.md files (no code changes required)
  3. Creates .todo marker files in npm-implementations/{run-id}/
  4. Preserves .done/.failed/.inprogress files from previous runs
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
IMPL_DIR="$AGENTS_DIR/workareas/npm-implementations/$RUN_ID"

# Check if migration plans exist
if [ ! -d "$PLANS_DIR" ]; then
    error "Migration plans directory not found: $PLANS_DIR"
fi

# Create implementation directory
mkdir -p "$IMPL_DIR"

# Parse package info from migration plan filename
parse_plan_filename() {
    local filename="$1"
    local base
    base=$(basename "$filename")
    base="${base%.auto.md}"
    base="${base#upgrade__}"

    # Split by __ using proper delimiter (awk handles multi-char delimiters correctly)
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

# Normalize package name for filename
normalize_package_name() {
    local package="$1"
    echo "$package" | sed 's|/|__|g'
}

# Process repositories
total_repos=0
total_discovered=0
total_skipped=0

# Store repo stats in temp file
repo_stats_file=$(mktemp)
trap "rm -f $repo_stats_file" EXIT

log "Discovering implementation candidates..."
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

    # Create implementation directory for this repo
    impl_repo_dir="$IMPL_DIR/$repo_name"
    mkdir -p "$impl_repo_dir"

    repo_discovered=0
    repo_skipped=0
    repo_items=()

    # Read existing meta file if it exists
    meta_file="$impl_repo_dir/.implementation-meta.json"

    # Process each auto migration plan (extension = classification: no code changes)
    for plan_file in "$repo_dir"/upgrade__*.auto.md; do
        if [ ! -f "$plan_file" ]; then
            continue
        fi

        # Parse package info
        IFS='|' read -r package current target <<< "$(parse_plan_filename "$plan_file")"

        # Create marker filename
        normalized=$(normalize_package_name "$package")
        base_marker="implement__${normalized}__${current}__${target}"

        # Check if already completed or in progress
        if [ -f "$impl_repo_dir/${base_marker}.done" ]; then
            ((repo_skipped++))
            ((total_skipped++))
            continue
        fi

        if [ -f "$impl_repo_dir/${base_marker}.failed" ]; then
            ((repo_skipped++))
            ((total_skipped++))
            continue
        fi

        if [ -f "$impl_repo_dir/${base_marker}.inprogress" ]; then
            ((repo_skipped++))
            ((total_skipped++))
            continue
        fi

        # Create .todo marker file (0-byte marker)
        todo_file="$impl_repo_dir/${base_marker}.todo"

        if [ ! -f "$todo_file" ]; then
            touch "$todo_file"
            ((repo_discovered++))
            ((total_discovered++))
            log "  ✓ Created: $repo_name/$base_marker.todo"
        fi

        # Track for metadata
        repo_items+=("$package|$current|$target|$base_marker")
    done

    # Write metadata file
    cat > "$meta_file" << EOF
{
    "repo_name": "$repo_name",
    "repo_path": "$(jq -r .repo_path "$repo_dir/.upgrades-meta.json" 2>/dev/null || echo '')",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "total_candidates": $repo_discovered,
    "status": {
        "pending": $(find "$impl_repo_dir" -name "*.todo" 2>/dev/null | wc -l | tr -d ' '),
        "in_progress": $(find "$impl_repo_dir" -name "*.inprogress" 2>/dev/null | wc -l | tr -d ' '),
        "completed": $(find "$impl_repo_dir" -name "*.done" 2>/dev/null | wc -l | tr -d ' '),
        "failed": $(find "$impl_repo_dir" -name "*.failed" 2>/dev/null | wc -l | tr -d ' ')
    }
}
EOF

    # Store stats for this repo
    echo "$repo_name|$repo_discovered|$repo_skipped" >> "$repo_stats_file"
done

# Output summary
if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"summary\": {"
    echo "    \"total_repos\": $total_repos,"
    echo "    \"total_discovered\": $total_discovered,"
    echo "    \"total_skipped\": $total_skipped"
    echo "  },"
    echo "  \"repos\": {"
    first=true
    while IFS='|' read -r repo discovered skipped; do
        if [ "$first" = true ]; then
            first=false
        else
            echo ","
        fi
        echo "    \"$repo\": {"
        echo "      \"discovered\": $discovered,"
        echo "      \"skipped\": $skipped"
        echo -n "    }"
    done < "$repo_stats_file"
    echo ""
    echo "  }"
    echo "}"
else
    echo ""
    echo "=== Implementation Discovery Complete ==="
    echo ""
    echo "Total repos processed: $total_repos"
    echo "Total candidates discovered: $total_discovered"
    echo "Total skipped (already done/failed/in progress): $total_skipped"
    echo ""
    echo "Breakdown by repo:"
    while IFS='|' read -r repo discovered skipped; do
        printf "  %-35s discovered: %3d, skipped: %3d\n" "$repo" "$discovered" "$skipped"
    done < "$repo_stats_file" | sort
    echo ""
    echo "Workspace: $IMPL_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Review candidates: ls $IMPL_DIR/*/implement__*.todo"
    echo "  2. Check status: ./tools/npm/upgrade-status.sh --run-id $RUN_ID"
    echo "  3. Run automated upgrades: ./tools/npm/run-automated-upgrades.sh <repo-name> --run-id $RUN_ID"
fi
