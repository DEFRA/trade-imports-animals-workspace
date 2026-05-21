#!/bin/bash
# Run automated upgrades for a repository
# Orchestrates the full Stage 2 workflow: discover -> upgrade loop -> report
#
# Usage: ./run-automated-upgrades.sh <repo-name> --run-id TICKET

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

show_help() {
    cat << EOF
Run automated upgrades for a repository (Stage 2 workflow)

Usage: ./run-automated-upgrades.sh <repo-name> --run-id TICKET [options]

Arguments:
  repo-name     Repository name (e.g., trade-imports-animals-frontend)

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --discover    Run discover-implementations first (default: yes)
  --no-discover Skip discovery, use existing .todo files
  --help        Show this help message

Examples:
  ./run-automated-upgrades.sh trade-imports-animals-frontend --run-id EUDPA-20578
  ./run-automated-upgrades.sh trade-imports-animals-frontend --run-id EUDPA-20578 --no-discover

What it does:
  1. Runs discover-implementations.sh to find "no code changes" packages
  2. Loops through packages sequentially, upgrading one at a time
  3. Tracks progress with .todo -> .done/.failed markers
  4. Shows final status with failures highlighted
  5. Does NOT push to remote (commits stay local for review)

Rollback safety:
  - Each upgrade is committed separately
  - Failed upgrades are rolled back automatically
  - Cascade failure detection stops the loop if rollback fails
  - All commits stay local until you review and push

Next steps after completion:
  - Review commits: git log
  - Review failed packages: look at .failed files
  - Demote failures: ./tools/npm/demote-to-manual.sh
  - Push when ready: git push
EOF
    exit 0
}

RUN_DISCOVER=true
RUN_ID=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            show_help
            ;;
        --run-id)
            RUN_ID="$2"
            shift 2
            ;;
        --no-discover)
            RUN_DISCOVER=false
            shift
            ;;
        --discover)
            RUN_DISCOVER=true
            shift
            ;;
        *)
            if [[ -z "$REPO_NAME" ]]; then
                REPO_NAME="$1"
                shift
            else
                echo "Error: Unknown option: $1" >&2
                exit 1
            fi
            ;;
    esac
done

if [[ -z "$REPO_NAME" ]]; then
    echo "Error: Missing repository name" >&2
    echo "Usage: ./run-automated-upgrades.sh <repo-name> --run-id TICKET" >&2
    echo "Use --help for more information" >&2
    exit 1
fi

if [[ -z "$RUN_ID" ]]; then
    echo "Error: --run-id TICKET is required (e.g. --run-id EUDPA-12345)" >&2
    exit 1
fi

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

echo "==========================================="
echo "Automated NPM Upgrades - Stage 2"
echo "==========================================="
echo "Repository: $REPO_NAME"
echo ""

# Prerequisite: Check git status
REPO_PATH="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")/repos/$REPO_NAME"

if [[ ! -d "$REPO_PATH" ]]; then
    echo "Error: Repository not found at $REPO_PATH" >&2
    exit 1
fi

cd "$REPO_PATH"

if [[ -n $(git status --porcelain -uno) ]]; then
    echo "Error: Repository has uncommitted changes" >&2
    echo "" >&2
    git status --short -uno >&2
    echo "" >&2
    echo "Please commit or stash changes before running automated upgrades" >&2
    exit 1
fi

cd - > /dev/null

echo "✓ Git status clean"
echo ""

# Step 1: Discovery
if [[ "$RUN_DISCOVER" == "true" ]]; then
    echo "Step 1: Discovering automation candidates..."
    "$SCRIPT_DIR/discover-implementations.sh" --repo "$REPO_NAME" --run-id "$RUN_ID"
    echo ""
else
    echo "Step 1: Skipping discovery (using existing .todo files)"
    echo ""
fi

# Step 2: Check if there are packages to process
IMPL_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")/workareas/npm-implementations/$RUN_ID/$REPO_NAME"

if [[ ! -d "$IMPL_DIR" ]]; then
    echo "Error: Implementation directory not found: $IMPL_DIR" >&2
    echo "Run with --discover to create it" >&2
    exit 1
fi

TODO_COUNT=$(find "$IMPL_DIR" -name "*.todo" 2>/dev/null | wc -l | tr -d ' ')

if [[ "$TODO_COUNT" -eq 0 ]]; then
    echo "No packages to process (no .todo files found)"
    echo ""
    "$SCRIPT_DIR/upgrade-status.sh" --repo "$REPO_NAME" --run-id "$RUN_ID"
    exit 0
fi

echo "Step 2: Processing $TODO_COUNT packages..."
echo ""

# Step 3: Run upgrade loop
PROCESSED=0
SUCCESS=0
FAILED=0

while [[ -f $(find "$IMPL_DIR" -name "*.todo" 2>/dev/null | head -1) ]]; do
    ((PROCESSED++))

    echo "=== Package $PROCESSED/$TODO_COUNT ==="

    if "$SCRIPT_DIR/upgrade-one-package.sh" --repo "$REPO_NAME" --run-id "$RUN_ID"; then
        ((SUCCESS++))
        echo "✓ Success"
    else
        EXIT_CODE=$?
        if [[ $EXIT_CODE -eq 1 ]]; then
            # Cascade failure detected - stop immediately
            echo "✗ CRITICAL: Cascade failure detected - stopping"
            echo ""
            echo "A package upgrade broke the test suite and rollback also failed."
            echo "This indicates the repository is in an inconsistent state."
            echo "Manual intervention required before continuing."
            exit 1
        else
            # Normal failure (tests failed, rollback succeeded)
            ((FAILED++))
            echo "✗ Failed (rolled back)"
        fi
    fi

    echo ""
done

# Step 4: Show summary
echo "==========================================="
echo "Automated Upgrades Complete"
echo "==========================================="
echo ""
echo "📊 Summary:"
echo "  Processed: $PROCESSED packages"
echo "  ✅ Success: $SUCCESS"
echo "  ❌ Failed: $FAILED"
echo ""

# Step 5: Show detailed status
"$SCRIPT_DIR/upgrade-status.sh" --repo "$REPO_NAME" --run-id "$RUN_ID"

echo ""
echo "==========================================="
echo "Next Steps"
echo "==========================================="
echo ""

if [[ $SUCCESS -gt 0 ]]; then
    echo "✅ Review successful upgrades:"
    echo "   cd ../../../$REPO_NAME/service"
    echo "   git log --oneline -$SUCCESS"
    echo "   npm test  # Verify final state"
    echo ""
fi

if [[ $FAILED -gt 0 ]]; then
    echo "❌ Review and demote failed packages:"
    echo "   # Check failure reasons in .failed files"
    echo "   ls $IMPL_DIR/*.failed"
    echo ""
    echo "   # Demote to manual implementation"
    echo "   ./tools/npm/demote-to-manual.sh $REPO_NAME <package> \"<reason>\""
    echo ""
fi

if [[ $SUCCESS -gt 0 ]]; then
    echo "🚀 Push when ready:"
    echo "   cd ../../../$REPO_NAME/service"
    echo "   git push origin <branch-name>"
    echo ""
fi

echo "📊 Overall status:"
echo "   ./tools/npm/upgrade-status.sh --run-id $RUN_ID"
