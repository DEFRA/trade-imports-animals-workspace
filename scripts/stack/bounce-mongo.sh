#!/usr/bin/env bash
# Wipe the workspace mongo's anonymous volume and recreate the container —
# re-runs the init scripts under docker/stack/scripts/mongodb/ on a fresh DB.
# Useful as a reseed step before E2E test runs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$WORKSPACE_ROOT/docker/stack/compose.yml"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"

printf '%sBouncing mongo (wipes volume, re-runs init scripts)...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose -f "$COMPOSE_FILE" up --force-recreate --renew-anon-volumes --wait mongodb
