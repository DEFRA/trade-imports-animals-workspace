#!/bin/bash
#
# clean-docs.sh
#
# Wipes docs/confluence/ and re-runs sync-docs.sh from scratch.
# Use this when Confluence pages have been deleted — sync-docs.sh alone
# leaves orphan files; this ensures a clean mirror.
#
# Usage: ./clean-docs.sh [args forwarded to sync-docs.sh]
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="${TRADE_IMPORTS_WORKSPACE:-$HOME/git/defra/trade-imports-animals-workspace}"
OUTPUT_DIR="$WORKSPACE_ROOT/docs/confluence"

if [[ -d "$OUTPUT_DIR" ]]; then
  echo "Removing $OUTPUT_DIR..."
  rm -rf "$OUTPUT_DIR"
else
  echo "Nothing to clean ($OUTPUT_DIR does not exist)"
fi

echo "Re-syncing..."
exec "$SCRIPT_DIR/sync-docs.sh" "$@"
