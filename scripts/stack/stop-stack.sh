#!/usr/bin/env bash
# Tear down the workspace docker stack and wipe its volumes + orphan containers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$WORKSPACE_ROOT/docker/stack/compose.yml"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"

printf '%sTearing down stack...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans "$@"
