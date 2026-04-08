#!/bin/bash
# Discover outdated npm dependencies and create upgrade workspace
# Usage: ./discover-upgrades.sh <repo-path> --run-id TICKET [options]
#
# Creates zero-byte marker files for each outdated dependency.
# Agents can then process these files in parallel to research migration paths.
#
# Options:
#   --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
#   --strategy LEVEL       Upgrade strategy: latest|minor|patch (default: latest)
#   --json                 Output JSON format instead of human-readable
#   --workspace-dir DIR    Custom workspace directory (default: npm-upgrades/)
#   --force                Force re-discovery (recreate workspace)
#   --help                 Show help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

# Defaults
REPO_PATH=""
RUN_ID=""
STRATEGY="latest"
JSON_OUTPUT=false
WORKSPACE_BASE="$AGENTS_DIR/workareas/npm-upgrades"
FORCE=false

show_help() {
    cat << EOF
Discover outdated npm dependencies and create upgrade workspace

Usage: ./discover-upgrades.sh <repo-path> --run-id TICKET [options]

Positional:
  <repo-path>            Path to Node.js repository

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --strategy LEVEL       Upgrade strategy: latest|minor|patch (default: latest)
  --json                 Output JSON format instead of human-readable
  --workspace-dir DIR    Custom workspace directory (default: npm-upgrades/)
  --force                Force re-discovery (recreate workspace)
  --help                 Show this help message

Examples:
  ./discover-upgrades.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578
  ./discover-upgrades.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578 --strategy minor
  ./discover-upgrades.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578 --json

Environment:
  Requires: npm-check-updates (ncu), jq
  Install: npm install -g npm-check-updates
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
        --strategy)
            STRATEGY="$2"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --workspace-dir)
            WORKSPACE_BASE="$2"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -*)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            if [[ -z "$REPO_PATH" ]]; then
                REPO_PATH="$1"
            else
                echo "Error: Too many positional arguments"
                echo "Use --help for usage information"
                exit 1
            fi
            shift
            ;;
    esac
done

# Helper for output
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

# Validate required arguments
if [[ -z "$RUN_ID" ]]; then
    error "--run-id TICKET is required (e.g. --run-id EUDPA-12345)"
fi

if [[ -z "$REPO_PATH" ]]; then
    error "Repository path is required. Use --help for usage information"
fi

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

# Validate strategy
case "$STRATEGY" in
    latest|minor|patch) ;;
    *)
        error "Invalid strategy '$STRATEGY'. Must be latest, minor, or patch"
        ;;
esac

# Check dependencies
command -v ncu >/dev/null 2>&1 || error "npm-check-updates (ncu) is required. Install: npm install -g npm-check-updates"
command -v jq >/dev/null 2>&1 || error "jq is required for JSON processing"

# Validate repository
if [[ ! -d "$REPO_PATH" ]]; then
    error "Repository path does not exist: $REPO_PATH"
fi
REPO_PATH=$(cd "$REPO_PATH" && pwd)  # Convert to absolute path

PACKAGE_JSON="$REPO_PATH/package.json"
if [[ ! -f "$PACKAGE_JSON" ]]; then
    error "No package.json found in $REPO_PATH"
fi

# Extract repository name from path
# If the directory name is generic (service, app, src), use parent directory
REPO_NAME=$(basename "$REPO_PATH")
if [[ "$REPO_NAME" == "service" ]] || [[ "$REPO_NAME" == "app" ]] || [[ "$REPO_NAME" == "src" ]]; then
    # Use parent directory name instead
    REPO_NAME=$(basename "$(dirname "$REPO_PATH")")
fi

# Determine workspace directory
WORKSPACE_DIR="$WORKSPACE_BASE/$RUN_ID/$REPO_NAME"
META_FILE="$WORKSPACE_DIR/.upgrades-meta.json"

# Check if workspace exists
if [[ -d "$WORKSPACE_DIR" ]] && [[ "$FORCE" == "false" ]]; then
    MODE="update"
    log "Updating existing workspace: $WORKSPACE_DIR"
else
    MODE="create"
    log "Creating workspace: $WORKSPACE_DIR"
    mkdir -p "$WORKSPACE_DIR"
fi

# Run ncu to discover outdated dependencies
log "Discovering outdated dependencies..."

# Run ncu and capture output
NCU_OUTPUT=$(cd "$REPO_PATH" && ncu --jsonUpgraded --target "$STRATEGY" 2>&1) || {
    error "Failed to run npm-check-updates: $NCU_OUTPUT"
}

# Check if there are any upgrades
if [[ -z "$NCU_OUTPUT" ]] || [[ "$NCU_OUTPUT" == "{}" ]]; then
    log "No outdated dependencies found"

    # Write empty metadata
    cat > "$META_FILE" << EOF
{
    "repo_name": "$REPO_NAME",
    "repo_path": "$REPO_PATH",
    "workspace_dir": "$WORKSPACE_DIR",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "last_discovered": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "ncu_version": "$(ncu --version 2>/dev/null || echo 'unknown')",
    "upgrade_strategy": "$STRATEGY",
    "total_upgrades": 0,
    "upgrades": [],
    "summary": {
        "total": 0,
        "pending": 0,
        "completed": 0,
        "by_type": {
            "dependencies": 0,
            "devDependencies": 0
        },
        "by_upgrade_type": {
            "patch": 0,
            "minor": 0,
            "major": 0
        }
    }
}
EOF

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        cat "$META_FILE"
    else
        echo ""
        echo "=== NPM Upgrade Discovery Complete ==="
        echo "Repository: $REPO_NAME"
        echo "Workspace: $WORKSPACE_DIR"
        echo ""
        echo "No outdated dependencies found."
    fi
    exit 0
fi

# Normalize package name for filename (replace / with __)
normalize_package_name() {
    local package="$1"
    echo "$package" | sed 's|/|__|g'
}

# Strip version prefix (^, ~, >=, etc.) to get clean version
strip_version_prefix() {
    local version="$1"
    echo "$version" | sed 's/^[\^~>=<]*//'
}

# Determine upgrade type (patch, minor, major)
get_upgrade_type() {
    local current="$1"
    local target="$2"

    # Strip prefixes
    current=$(strip_version_prefix "$current")
    target=$(strip_version_prefix "$target")

    # Extract major.minor.patch
    current_major=$(echo "$current" | cut -d. -f1 | sed 's/[^0-9]//g')
    current_minor=$(echo "$current" | cut -d. -f2 | sed 's/[^0-9]//g')

    target_major=$(echo "$target" | cut -d. -f1 | sed 's/[^0-9]//g')
    target_minor=$(echo "$target" | cut -d. -f2 | sed 's/[^0-9]//g')

    if [[ "$current_major" != "$target_major" ]]; then
        echo "major"
    elif [[ "$current_minor" != "$target_minor" ]]; then
        echo "minor"
    else
        echo "patch"
    fi
}

# Read package.json to determine dependency types
DEPENDENCIES=$(jq -r '.dependencies // {} | keys[]' "$PACKAGE_JSON" 2>/dev/null || echo "")
DEV_DEPENDENCIES=$(jq -r '.devDependencies // {} | keys[]' "$PACKAGE_JSON" 2>/dev/null || echo "")

# Parse ncu output and create marker files
log "Creating marker files..."

upgrades_array=()
created_count=0
skipped_count=0
total_count=0

major_count=0
minor_count=0
patch_count=0
dep_count=0
devdep_count=0

# Parse the JSON output from ncu
while IFS= read -r package; do
    [[ -z "$package" ]] && continue

    # Get target version from ncu output
    target=$(echo "$NCU_OUTPUT" | jq -r --arg pkg "$package" '.[$pkg] // empty')
    [[ -z "$target" ]] && continue

    # Get current version from package.json
    current=$(jq -r --arg pkg "$package" '(.dependencies[$pkg] // .devDependencies[$pkg] // empty)' "$PACKAGE_JSON")
    [[ -z "$current" ]] && continue

    # Strip prefixes for clean versions in filenames
    current_clean=$(strip_version_prefix "$current")
    target_clean=$(strip_version_prefix "$target")

    ((total_count++))

    # Determine dependency type
    dep_type="dependencies"
    if echo "$DEV_DEPENDENCIES" | grep -q "^${package}$"; then
        dep_type="devDependencies"
        ((devdep_count++))
    else
        ((dep_count++))
    fi

    # Determine upgrade type
    upgrade_type=$(get_upgrade_type "$current_clean" "$target_clean")
    case "$upgrade_type" in
        major) ((major_count++)) ;;
        minor) ((minor_count++)) ;;
        patch) ((patch_count++)) ;;
    esac

    # Normalize package name for filename
    normalized=$(normalize_package_name "$package")

    # Generate marker filename (using clean versions without prefixes)
    marker_file="$WORKSPACE_DIR/upgrade__${normalized}__${current_clean}__${target_clean}.md"

    # Check if file exists and has content (already processed by agent)
    status="pending"
    size_bytes=0

    if [[ -f "$marker_file" ]] && [[ -s "$marker_file" ]]; then
        status="completed"
        size_bytes=$(stat -f%z "$marker_file" 2>/dev/null || stat -c%s "$marker_file" 2>/dev/null || echo 0)
        ((skipped_count++))
        log "  Skipping: $package (already processed)"
    else
        # Create or preserve zero-byte marker
        if [[ ! -f "$marker_file" ]]; then
            touch "$marker_file"
            ((created_count++))
            log "  Created: upgrade__${normalized}__${current}__${target}.md"
        fi
    fi

    # Track in metadata array
    upgrades_array+=("$(jq -n \
        --arg package "$package" \
        --arg current "$current_clean" \
        --arg target "$target_clean" \
        --arg upgrade_type "$upgrade_type" \
        --arg marker_file "$(basename "$marker_file")" \
        --arg status "$status" \
        --arg dep_type "$dep_type" \
        --argjson size "$size_bytes" \
        --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        '{
            package: $package,
            current: $current,
            target: $target,
            upgrade_type: $upgrade_type,
            marker_file: $marker_file,
            status: $status,
            dependency_type: $dep_type,
            size_bytes: $size,
            created: $created
        }')")
done < <(echo "$NCU_OUTPUT" | jq -r 'keys[]')

# Calculate completion status
pending_count=0
completed_count=0

for upgrade_json in "${upgrades_array[@]}"; do
    status=$(echo "$upgrade_json" | jq -r '.status')
    if [[ "$status" == "pending" ]]; then
        ((pending_count++))
    else
        ((completed_count++))
    fi
done

# Build upgrades JSON array
upgrades_json=$(printf '%s\n' "${upgrades_array[@]}" | jq -s '.')

# Write metadata file
cat > "$META_FILE" << EOF
{
    "repo_name": "$REPO_NAME",
    "repo_path": "$REPO_PATH",
    "workspace_dir": "$WORKSPACE_DIR",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "last_discovered": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "ncu_version": "$(ncu --version 2>/dev/null || echo 'unknown')",
    "upgrade_strategy": "$STRATEGY",
    "total_upgrades": $total_count,
    "upgrades": $upgrades_json,
    "summary": {
        "total": $total_count,
        "pending": $pending_count,
        "completed": $completed_count,
        "by_type": {
            "dependencies": $dep_count,
            "devDependencies": $devdep_count
        },
        "by_upgrade_type": {
            "patch": $patch_count,
            "minor": $minor_count,
            "major": $major_count
        }
    }
}
EOF

# Output summary
if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat "$META_FILE"
else
    echo ""
    echo "=== NPM Upgrade Discovery Complete ==="
    echo "Repository: $REPO_NAME"
    echo "Workspace: $WORKSPACE_DIR"
    echo ""
    echo "Total upgrades: $total_count"
    echo "  Major: $major_count"
    echo "  Minor: $minor_count"
    echo "  Patch: $patch_count"
    echo ""
    echo "Status:"
    echo "  Pending: $pending_count"
    echo "  Completed: $completed_count"
    echo ""
    if [[ "$MODE" == "update" ]]; then
        echo "Updates:"
        echo "  Created: $created_count new marker files"
        echo "  Skipped: $skipped_count already processed"
        echo ""
    fi
    echo "Next: Process marker files with migration planning agents"
fi
