#!/usr/bin/env bash
# Tear down the workspace docker stack and wipe its volumes + orphan containers.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$WORKSPACE_ROOT/docker/stack/compose.yml"

exec docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans "$@"
