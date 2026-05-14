#!/usr/bin/env bash
# Tear down the workspace docker stack and wipe its volumes + orphan containers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STACK_DIR="$WORKSPACE_ROOT/docker/stack"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"
# shellcheck source=lib/compose.sh
source "$LIB_DIR/compose.sh"

printf '%sTearing down stack...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose "${COMPOSE_FILES[@]}" down --volumes --remove-orphans "$@"
