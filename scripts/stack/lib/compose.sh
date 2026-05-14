# Sourced by scripts/stack/*.sh. Exports `COMPOSE_FILES` — an array of
# `-f <path>` pairs ready to splat into a `docker compose` invocation. One
# source of truth for the file list so adding a new overlay (or the
# `dev.compose.yml` overlay) only touches this file.
#
# Requires `STACK_DIR` to be set by the caller (workspace's
# docker/stack/ directory).

[ -n "${STACK_DIR:-}" ] || {
  echo "internal error: lib/compose.sh requires STACK_DIR to be set" >&2
  exit 70
}

COMPOSE_FILES=(
  -f "$STACK_DIR/compose.yml"
  -f "$STACK_DIR/database.compose.yml"
  -f "$STACK_DIR/infrastructure.compose.yml"
  -f "$STACK_DIR/stubs.compose.yml"
  -f "$STACK_DIR/backend.compose.yml"
  -f "$STACK_DIR/frontend.compose.yml"
)

# Appends `dev.compose.yml` to the file list. Call from run-stack.sh when
# the --dev flag is set, before invoking docker compose.
compose_files_add_dev() {
  COMPOSE_FILES+=(-f "$STACK_DIR/dev.compose.yml")
}
