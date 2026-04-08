#!/bin/bash
# Verify all service authentications
# Usage: ./auth.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Checking Authentication ==="
echo ""

failed=0

"$SCRIPT_DIR/jira/auth.sh" || failed=1
"$SCRIPT_DIR/confluence/auth.sh" || failed=1
"$SCRIPT_DIR/github/auth.sh" || failed=1
"$SCRIPT_DIR/jenkins/auth.sh" || failed=1

echo ""
if [[ $failed -eq 0 ]]; then
    echo "All services authenticated successfully"
else
    echo "Some services failed authentication"
    exit 1
fi
