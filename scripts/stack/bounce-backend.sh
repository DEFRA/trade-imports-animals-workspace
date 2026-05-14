#!/usr/bin/env bash
# Recreate the backend container in place — only useful with --dev active
# (the dev-run Dockerfile stage runs `mvn spring-boot:run` which recompiles
# from the bind-mounted src/ on container start, so a recreate picks up
# whatever Java sources are on disk now).
#
# Without --dev: the backend is an immutable image; bouncing achieves
# nothing.
#
# --no-deps so mongo / localstack / etc. aren't restarted under us.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STACK_DIR="$WORKSPACE_ROOT/docker/stack"
LIB_DIR="$SCRIPT_DIR/lib"

# shellcheck source=lib/colour.sh
source "$LIB_DIR/colour.sh"
# shellcheck source=lib/compose.sh
source "$LIB_DIR/compose.sh"

# If a dev overlay file exists, include it so the bounced backend picks up
# the local source mount rather than reverting to the pulled image. The
# overlay is harmless when not in dev mode (compose merges the build/volume
# overrides only; the container won't have been started from source unless
# the original run-stack.sh used --dev).
[ -f "$STACK_DIR/dev.compose.yml" ] && compose_files_add_dev

# Pass every profile so dependency validation across overlay files passes —
# we're only naming one service positionally, so only that one is recreated.
profile_args=(
  --profile database
  --profile infrastructure
  --profile stubs
  --profile backend
  --profile frontend
)

printf '%sBouncing backend (force-recreate, no-deps)...%s\n' "$COLOUR_BOLD" "$COLOUR_RESET"
exec docker compose "${COMPOSE_FILES[@]}" "${profile_args[@]}" up --force-recreate --no-deps --wait trade-imports-animals-backend
