[ -n "${STACK_DIR:-}" ] || {
  print_error "internal error: lib/compose.sh requires STACK_DIR to be set"
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

ALL_PROFILES=(database infrastructure servicebus stubs backend frontend)

compose_files_add_dev() {
  COMPOSE_FILES+=(-f "$STACK_DIR/dev.compose.yml")
}
