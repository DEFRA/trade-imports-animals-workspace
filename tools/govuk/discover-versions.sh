#!/bin/bash
# Discover govuk-frontend versions between current and target, create upgrade workspace
# Usage: ./discover-versions.sh <repo-path> --run-id TICKET [options]
#
# Creates zero-byte marker files for each intermediate version.
# Agents then process these files to research what changes are needed.
#
# Options:
#   --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
#   --target VERSION       Target govuk-frontend version (default: latest stable)
#   --json                 Output JSON format instead of human-readable
#   --force                Force re-run (re-fetch changelog, recreate stubs)
#   --help                 Show help message

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

REPO_PATH=""
RUN_ID=""
TARGET_VERSION=""
JSON_OUTPUT=false
WORKSPACE_BASE="$AGENTS_DIR/workareas/govuk-upgrades"
FORCE=false

CHANGELOG_URL="https://raw.githubusercontent.com/alphagov/govuk-frontend/main/CHANGELOG.md"

show_help() {
    cat << EOF
Discover govuk-frontend versions and create upgrade workspace

Usage: ./discover-versions.sh <repo-path> --run-id TICKET [options]

Positional:
  <repo-path>            Path to Node.js repository

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --target VERSION       Target govuk-frontend version (default: latest stable)
  --json                 Output JSON format instead of human-readable
  --force                Force re-run (re-fetch changelog, recreate stubs)
  --help                 Show this help message

Examples:
  ./discover-versions.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578
  ./discover-versions.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578 --target 6.1.0
  ./discover-versions.sh ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend --run-id EUDPA-20578 --json

Environment:
  Requires: jq, curl, npm
EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help) show_help ;;
        --run-id) RUN_ID="$2"; shift 2 ;;
        --target) TARGET_VERSION="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        --force) FORCE=true; shift ;;
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
                exit 1
            fi
            shift
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

# Validate required arguments
[[ -z "$RUN_ID" ]] && error "--run-id TICKET is required (e.g. --run-id EUDPA-12345)"
[[ -z "$REPO_PATH" ]] && error "Repository path is required. Use --help for usage information"

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

# Check dependencies
command -v jq >/dev/null 2>&1 || error "jq is required for JSON processing"
command -v curl >/dev/null 2>&1 || error "curl is required"
command -v npm >/dev/null 2>&1 || error "npm is required"

# Validate repository
[[ ! -d "$REPO_PATH" ]] && error "Repository path does not exist: $REPO_PATH"
REPO_PATH=$(cd "$REPO_PATH" && pwd)

PACKAGE_JSON="$REPO_PATH/package.json"
[[ ! -f "$PACKAGE_JSON" ]] && error "No package.json found in $REPO_PATH"

REPO_NAME=$(basename "$REPO_PATH")

# Strip semver prefix (^, ~, >=, etc.)
strip_prefix() {
    echo "$1" | sed 's/^[^0-9]*//'
}

# Semver comparison: returns 0 (true) if $1 > $2
semver_gt() {
    local a b a1 a2 a3 b1 b2 b3
    a=$(strip_prefix "$1")
    b=$(strip_prefix "$2")
    IFS='.' read -r a1 a2 a3 <<< "$a"
    IFS='.' read -r b1 b2 b3 <<< "$b"
    a3="${a3:-0}"; b3="${b3:-0}"
    [[ "$a1" -gt "$b1" ]] && return 0
    [[ "$a1" -lt "$b1" ]] && return 1
    [[ "$a2" -gt "$b2" ]] && return 0
    [[ "$a2" -lt "$b2" ]] && return 1
    [[ "$a3" -gt "$b3" ]] && return 0
    return 1
}

# Get current version from package.json
CURRENT_RAW=$(jq -r '.dependencies["govuk-frontend"] // .devDependencies["govuk-frontend"] // empty' "$PACKAGE_JSON")
[[ -z "$CURRENT_RAW" ]] && error "govuk-frontend not found in dependencies or devDependencies in $PACKAGE_JSON"
CURRENT=$(strip_prefix "$CURRENT_RAW")

log "Current govuk-frontend version: $CURRENT"

# Get target version if not specified
if [[ -z "$TARGET_VERSION" ]]; then
    log "Fetching latest govuk-frontend version from npm..."
    TARGET_VERSION=$(npm view govuk-frontend dist-tags.latest 2>/dev/null) || error "Failed to fetch latest version from npm"
fi
TARGET=$(strip_prefix "$TARGET_VERSION")

log "Target govuk-frontend version: $TARGET"

# Check if already at target
if ! semver_gt "$TARGET" "$CURRENT"; then
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"status\": \"up-to-date\", \"current\": \"$CURRENT\", \"target\": \"$TARGET\", \"versions\": []}"
    else
        echo "Already up to date: govuk-frontend $CURRENT (target: $TARGET)"
    fi
    exit 0
fi

# Get all stable versions from npm registry
log "Fetching version list from npm..."
ALL_VERSIONS_JSON=$(npm view govuk-frontend versions --json 2>/dev/null) || error "Failed to fetch version list from npm"

# Filter: stable only (no pre-release suffix), strictly greater than current, at most target
VERSIONS_TO_PROCESS=()
while IFS= read -r version; do
    [[ -z "$version" ]] && continue
    # Skip pre-releases (contains -)
    [[ "$version" == *"-"* ]] && continue
    # Skip if <= current
    semver_gt "$version" "$CURRENT" || continue
    # Skip if > target
    semver_gt "$version" "$TARGET" && continue
    VERSIONS_TO_PROCESS+=("$version")
done < <(echo "$ALL_VERSIONS_JSON" | jq -r '.[]')

# Sort ascending by version
IFS=$'\n' sorted_versions=($(printf '%s\n' "${VERSIONS_TO_PROCESS[@]}" | sort -V))
unset IFS

VERSION_COUNT="${#sorted_versions[@]}"

if [[ "$VERSION_COUNT" -eq 0 ]]; then
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"status\": \"no-versions\", \"current\": \"$CURRENT\", \"target\": \"$TARGET\", \"versions\": []}"
    else
        echo "No stable versions found between $CURRENT and $TARGET"
    fi
    exit 0
fi

log "Found $VERSION_COUNT versions to process"

# Create workspace directory
WORKSPACE_DIR="$WORKSPACE_BASE/$RUN_ID/$REPO_NAME"
mkdir -p "$WORKSPACE_DIR"

# Cache CHANGELOG.md (fetch once, reuse on subsequent runs)
CHANGELOG_FILE="$WORKSPACE_DIR/CHANGELOG.md"
if [[ ! -f "$CHANGELOG_FILE" ]] || [[ "$FORCE" == "true" ]]; then
    log "Fetching CHANGELOG.md from GitHub..."
    curl -sf "$CHANGELOG_URL" -o "$CHANGELOG_FILE" || error "Failed to fetch CHANGELOG.md from $CHANGELOG_URL"
    log "Cached: $CHANGELOG_FILE"
else
    log "Using cached CHANGELOG.md"
fi

# Create zero-byte stubs for each version not already planned
created_count=0
skipped_count=0
versions_json="["
first=true

for version in "${sorted_versions[@]}"; do
    stub="$WORKSPACE_DIR/version__${version}.md"
    todo_file="$WORKSPACE_DIR/version__${version}.todo"
    noop_file="$WORKSPACE_DIR/version__${version}.noop"
    done_file="$WORKSPACE_DIR/version__${version}.done"
    failed_file="$WORKSPACE_DIR/version__${version}.failed"

    status="pending"

    if [[ -f "$done_file" ]]; then
        status="done"
        ((skipped_count++))
    elif [[ -f "$failed_file" ]]; then
        status="failed"
        ((skipped_count++))
    elif [[ -f "$todo_file" ]]; then
        status="todo"
        ((skipped_count++))
    elif [[ -f "$noop_file" ]]; then
        status="noop"
        ((skipped_count++))
    else
        if [[ ! -f "$stub" ]] || [[ "$FORCE" == "true" ]]; then
            touch "$stub"
            ((created_count++))
            log "  Created: version__${version}.md"
        else
            log "  Exists:  version__${version}.md"
        fi
    fi

    [[ "$first" == "true" ]] && first=false || versions_json+=","
    versions_json+="{\"version\":\"$version\",\"status\":\"$status\"}"
done
versions_json+="]"

# Write metadata file
cat > "$WORKSPACE_DIR/.upgrade-meta.json" << EOF
{
    "repo_name": "$REPO_NAME",
    "repo_path": "$REPO_PATH",
    "workspace_dir": "$WORKSPACE_DIR",
    "package": "govuk-frontend",
    "current_version": "$CURRENT",
    "target_version": "$TARGET",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "last_discovered": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "total_versions": $VERSION_COUNT,
    "versions": $versions_json
}
EOF

if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat "$WORKSPACE_DIR/.upgrade-meta.json"
else
    echo ""
    echo "=== govuk-frontend Version Discovery Complete ==="
    echo "Repository:  $REPO_NAME"
    echo "Upgrade:     $CURRENT → $TARGET"
    echo "Versions:    $VERSION_COUNT intermediate versions"
    echo "Workspace:   $WORKSPACE_DIR"
    echo ""
    echo "Stubs created:    $created_count"
    echo "Already planned:  $skipped_count"
    echo ""
    echo "Versions:"
    for v in "${sorted_versions[@]}"; do
        echo "  $v"
    done
    echo ""
    echo "Next: Process stubs with VERSION_PLANNER agents (Phase 2)"
fi
