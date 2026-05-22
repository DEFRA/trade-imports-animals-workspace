#!/bin/bash
# Detect whether an EUDPA review is FRESH (no prior review) or REFRESH
# (review-index.md already exists). Prints exactly one of:
#
#   FRESH
#   REFRESH
#
# to stdout. Exits 1 on usage error.
#
# Usage: ./detect-mode.sh EUDPA-XXXXX

set -e

: "${TRADE_IMPORTS_WORKSPACE:?TRADE_IMPORTS_WORKSPACE not set — see docs/agent-onboarding.md}"

TICKET="${1:-}"
if [[ -z "$TICKET" ]]; then
  echo "Usage: $0 EUDPA-XXXXX" >&2
  exit 1
fi

if [[ -f "$TRADE_IMPORTS_WORKSPACE/workareas/reviews/$TICKET/review-index.md" ]]; then
  echo REFRESH
else
  echo FRESH
fi
