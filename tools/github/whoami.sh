#!/bin/bash
# Print the authenticated `gh` user's login.
# Usage: ./whoami.sh
#
# One line of output, no decoration. Non-zero exit + "" on stdout if
# unauthenticated.

set -e

gh api user --jq '.login'
