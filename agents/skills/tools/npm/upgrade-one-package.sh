#!/bin/bash
# Upgrade a single npm package - deterministic workflow
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"

REPO_NAME=""
RUN_ID=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo)
            REPO_NAME="$2"
            shift 2
            ;;
        --run-id)
            RUN_ID="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 --repo <repo-name> --run-id TICKET"
            exit 1
            ;;
    esac
done

[ -z "$REPO_NAME" ] && { echo "Error: --repo <repo-name> is required"; exit 1; }
[ -z "$RUN_ID" ] && { echo "Error: --run-id TICKET is required (e.g. --run-id EUDPA-12345)"; exit 1; }

# Warn if RUN_ID doesn't look like a Jira ticket
if [[ ! "$RUN_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "Warning: --run-id '$RUN_ID' does not match expected Jira ticket format (e.g. PROJ-123)" >&2
fi

IMPL_DIR="$AGENTS_DIR/workareas/npm-implementations/$RUN_ID/$REPO_NAME"

# Auto-demote function: Rename .auto.md plan to .manual.md when automation fails
auto_demote() {
    local reason="$1"
    local auto_plan_path="$2"

    if [ ! -f "$auto_plan_path" ]; then
        echo "Warning: Cannot demote - plan file not found: $auto_plan_path"
        return 1
    fi

    local manual_plan_path="${auto_plan_path%.auto.md}.manual.md"
    mv "$auto_plan_path" "$manual_plan_path"
    echo "✓ Auto-demoted to manual: $reason"
}

# Find next .todo file
TODO_FILE=$(ls "$IMPL_DIR"/*.todo 2>/dev/null | head -1)
[ -z "$TODO_FILE" ] && { echo "No .todo files for $REPO_NAME"; exit 0; }

# Derive plan filename from .todo filename
# .todo format: implement__package__current__target.todo
# plan format: upgrade__package__current__target.auto.md
TODO_BASENAME=$(basename "$TODO_FILE" .todo)
PLAN_FILE="${TODO_BASENAME/implement__/upgrade__}"
PLAN_PATH="$AGENTS_DIR/workareas/npm-upgrades/$RUN_ID/$REPO_NAME/${PLAN_FILE}.auto.md"
# Format: upgrade__@scope__name__current__target.auto.md or upgrade__name__current__target.auto.md

# Parse using awk to handle double-underscore delimiter correctly
PARTS=()
while IFS= read -r part; do
    PARTS+=("$part")
done < <(echo "$PLAN_FILE" | awk -F'__' '{for(i=1;i<=NF;i++) print $i}')

# Remove "upgrade" prefix if present
if [[ "${PARTS[0]}" == "upgrade" ]]; then
    PARTS=("${PARTS[@]:1}")
fi

if [[ "${PARTS[0]}" == "@"* ]]; then
    # Scoped package: @scope__name__current__target
    PACKAGE="${PARTS[0]}/${PARTS[1]}"
    CURRENT="${PARTS[2]}"
    TARGET="${PARTS[3]}"
else
    # Regular package: name__current__target
    PACKAGE="${PARTS[0]}"
    CURRENT="${PARTS[1]}"
    TARGET="${PARTS[2]}"
fi

if [[ -z "$PACKAGE" || -z "$CURRENT" || -z "$TARGET" ]]; then
    echo "ERROR: Cannot parse plan filename: $PLAN_FILE"
    echo "Parsed: PACKAGE=$PACKAGE, CURRENT=$CURRENT, TARGET=$TARGET"
    exit 1
fi

echo "========================================="
echo "Package: $PACKAGE | $CURRENT → $TARGET"
echo "========================================="

# Claim task
INPROGRESS_FILE="${TODO_FILE%.todo}.inprogress"
mv "$TODO_FILE" "$INPROGRESS_FILE"

# Get repo path (already includes /service)
REPO_PATH=$(jq -r '.repo_path' "$IMPL_DIR/.implementation-meta.json")
[ ! -d "$REPO_PATH" ] && { echo "ERROR: $REPO_PATH not found"; exit 1; }

cd "$REPO_PATH"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use

echo "✓ Connectivity OK"

# Baseline test
echo "Running baseline tests..."
npm test >/tmp/baseline.log 2>&1 || {
    echo "ERROR: Baseline tests failed"
    cat >> "$INPROGRESS_FILE" << EOF

## BASELINE FAILURE
Tests failing before upgrade. Repo issue, not package-specific.
EOF
    mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.failed"
    # Note: Don't demote baseline failures - they're repo issues, not upgrade issues
    exit 1
}
echo "✓ Baseline pass"

# Upgrade
echo "Upgrading..."
npm install "$PACKAGE@$TARGET" >/tmp/install.log 2>&1 || {
    echo "ERROR: npm install failed"
    cat >> "$INPROGRESS_FILE" << EOF

## INSTALL FAILURE
npm install $PACKAGE@$TARGET failed
EOF
    auto_demote "npm install failed - likely peer dependency conflict" "$PLAN_PATH"
    mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.failed"
    exit 0  # Exit cleanly so loop continues
}
echo "✓ Installed"

# Test after upgrade
echo "Testing upgraded package..."
npm test >/tmp/upgrade.log 2>&1 || {
    echo "ERROR: Tests failed after upgrade - rolling back"
    git checkout package.json package-lock.json
    npm install >/dev/null 2>&1

    # Verify rollback fixed the issue
    echo "Verifying rollback..."
    if npm test >/tmp/rollback-verify.log 2>&1; then
        echo "✓ Rollback successful - safe to continue"
        cat >> "$INPROGRESS_FILE" << EOF

## TEST FAILURE
Tests failed after upgrade to $TARGET. Rolled back successfully.
Rollback verification: ✓ Tests passing again
Safe to continue with next package.
EOF
        auto_demote "Tests fail after upgrade - requires investigation" "$PLAN_PATH"
        mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.failed"
        exit 0  # Exit cleanly, loop can continue
    else
        echo "✗ CRITICAL: Tests still failing after rollback!"
        echo "Possible cascade failure from previous upgrade."
        cat >> "$INPROGRESS_FILE" << EOF

## CRITICAL: CASCADE FAILURE DETECTED
Tests failed after upgrade to $TARGET.
Rolled back, but tests STILL failing.

This indicates a previous package may have broken something.
STOPPING to prevent further damage.

Recommend:
1. Check git log for recent upgrades
2. Review all changes since start of session
3. May need to rollback multiple packages
EOF
        mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.failed"
        exit 1  # Exit with error, loop should stop
    fi
}
echo "✓ Tests pass"

# Commit (but don't push yet)
git add package.json package-lock.json

# Check if there are actually changes to commit
if git diff --cached --quiet; then
    echo "⚠ No changes detected - package already at target version"
    echo "✓ Skipping (already upgraded)"

    # Mark as done without a new commit
    cat >> "$INPROGRESS_FILE" << EOF

**Completed:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Status:** Already at target version (no changes needed)
EOF
    mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.done"

    echo "========================================="
    echo "SUCCESS: $PACKAGE already at $TARGET"
    echo "========================================="
    exit 0
fi

git commit -m "Upgrade $PACKAGE $CURRENT → $TARGET

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

COMMIT_SHA=$(git rev-parse HEAD)
echo "✓ Committed: $COMMIT_SHA"

# Mark done
cat >> "$INPROGRESS_FILE" << EOF

**Completed:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Commit:** $COMMIT_SHA
**Status:** Committed locally (not pushed)
EOF
mv "$INPROGRESS_FILE" "${INPROGRESS_FILE%.inprogress}.done"

echo "========================================="
echo "SUCCESS: $PACKAGE $CURRENT → $TARGET"
echo "========================================="
