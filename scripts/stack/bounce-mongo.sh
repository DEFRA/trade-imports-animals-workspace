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

# Local dev aid for iterating on mongo structure: re-stage the init scripts then
# force-recreate the mongo volume so the next start reseeds from scratch.
#
# The re-stage exists so a reseed picks up locally edited seed fixtures. With no
# local edits under repos/ it adds nothing new; in CI (no repos/ checkout) it
# sparse-fetches the fixtures from GitHub — so the re-stage is never a literal
# no-op, just often a quiet one when run locally with an unchanged tree.
#
# Branch ref matches run-stack.sh's convention: a CI reseed sparse-fetches the
# active branch's fixtures, not the default branch's. Empty falls back to the
# default branch inside stage_init_scripts. Locally repos/ is used regardless.
branch="${1:-${STACK_BRANCH:-}}"
stage_init_scripts "$branch"

printf '%sBouncing mongo (wipes volume, re-runs init scripts)...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose "${COMPOSE_FILES[@]}" --profile database up --force-recreate --renew-anon-volumes --wait mongodb
