#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STACK_DIR="$WORKSPACE_ROOT/docker/stack"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"
# shellcheck source=lib/compose.sh
source "$LIB_DIR/compose.sh"
# shellcheck source=lib/init-scripts.sh
source "$LIB_DIR/init-scripts.sh"

# Re-stage so a reseed picks up locally edited seed fixtures
stage_init_scripts

printf '%sBouncing mongo (wipes volume, re-runs init scripts)...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose "${COMPOSE_FILES[@]}" --profile database up --force-recreate --renew-anon-volumes --wait mongodb
