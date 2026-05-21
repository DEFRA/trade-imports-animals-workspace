#!/bin/bash
# Extract a specific version's section from the cached govuk-frontend CHANGELOG.md
# Usage: ./fetch-changelog-section.sh VERSION --run-id TICKET --repo REPO_NAME [--json]
#
# Reads from the CHANGELOG.md cached by discover-versions.sh.
# Extracts content between "## vVERSION" and the next "## v" header.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

VERSION=""
RUN_ID=""
REPO_NAME=""
JSON_OUTPUT=false

show_help() {
    cat << EOF
Extract a version's section from the cached govuk-frontend CHANGELOG.md

Usage: ./fetch-changelog-section.sh VERSION --run-id TICKET --repo REPO_NAME [--json]

Positional:
  VERSION                The govuk-frontend version to extract (e.g. 5.8.0)

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Repository name (e.g. trade-imports-animals-frontend) [required]
  --json                 Output JSON: { "version": "...", "content": "..." }
  --help                 Show this help message

Examples:
  ./fetch-changelog-section.sh 5.8.0 --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./fetch-changelog-section.sh 6.0.0 --run-id EUDPA-20578 --repo trade-imports-animals-frontend --json

Requires:
  CHANGELOG.md must be cached by discover-versions.sh first.
  Location: workareas/govuk-upgrades/{run-id}/{repo-name}/CHANGELOG.md
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help) show_help ;;
        --run-id) RUN_ID="$2"; shift 2 ;;
        --repo) REPO_NAME="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        -*)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
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

[[ -z "$VERSION" ]] && error "VERSION is required (e.g. 5.8.0)"
[[ -z "$RUN_ID" ]] && error "--run-id TICKET is required"
[[ -z "$REPO_NAME" ]] && error "--repo REPO_NAME is required"

# Strip v prefix if present
VERSION=$(echo "$VERSION" | sed 's/^v//')

CHANGELOG_FILE="$AGENTS_DIR/workareas/govuk-upgrades/$RUN_ID/$REPO_NAME/CHANGELOG.md"

if [[ ! -f "$CHANGELOG_FILE" ]]; then
    error "Cached CHANGELOG.md not found at: $CHANGELOG_FILE. Run discover-versions.sh first."
fi

# Extract the section for this version using awk.
# Matches the header line "## vVERSION" (with optional space/paren after version),
# then captures all lines until the next "## v" header.
SECTION=$(awk "
    /^## v${VERSION}([[:space:](]|$)/ { found=1; next }
    found && /^## v/ { exit }
    found { print }
" "$CHANGELOG_FILE")

if [[ -z "$SECTION" ]]; then
    error "Version $VERSION not found in CHANGELOG.md"
fi

if [[ "$JSON_OUTPUT" == "true" ]]; then
    command -v jq >/dev/null 2>&1 || error "jq is required for JSON output"
    escaped=$(echo "$SECTION" | jq -Rs '.')
    echo "{\"version\": \"$VERSION\", \"content\": $escaped}"
else
    echo "## govuk-frontend v${VERSION} — Changelog"
    echo ""
    echo "$SECTION"
fi
