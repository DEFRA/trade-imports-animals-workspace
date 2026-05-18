#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"

printf '%sRestarting stack...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
"$SCRIPT_DIR/stop-stack.sh" || true
exec "$SCRIPT_DIR/run-stack.sh" "$@"
