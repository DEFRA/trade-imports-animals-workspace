#!/bin/bash
# Verify GitHub authentication
# Usage: ./auth.sh

set -e

echo -n "GitHub: "
if gh auth status > /dev/null 2>&1; then
    user=$(gh api user --jq '.login')
    echo "OK - Authenticated as $user"
else
    echo "FAILED - Not authenticated with gh CLI"
    exit 1
fi
