#!/usr/bin/env bash
# Tear the workspace stack down (volumes + orphans wiped) then bring it back
# up via run-stack.sh. Forwards all args to run-stack.sh, so --branch and any
# post-`--` extras work the same way. Stop failure is tolerated — if nothing
# is running, the stop step is a no-op.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$SCRIPT_DIR/stop-stack.sh" || true
exec "$SCRIPT_DIR/run-stack.sh" "$@"
