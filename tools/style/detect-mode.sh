#!/bin/bash
# Detect whether an EUDPA code-style review workspace exists. Prints
# exactly one of:
#
#   FRESH    — no prior style review for this ticket
#   EXISTS   — at least one style-review.{repo}.md exists already
#
# to stdout. The SKILL.md interprets EXISTS as either REFRESH (when the
# user asks to re-review) or IMPLEMENT (when the user asks to apply
# fixes) based on the trigger phrase.
#
# Exits 1 on usage error.
#
# Usage: ./detect-mode.sh EUDPA-XXXXX

set -e


TICKET="${1:-}"
if [[ -z "$TICKET" ]]; then
  echo "Usage: $0 EUDPA-XXXXX" >&2
  exit 1
fi

dir="$HOME/git/defra/trade-imports-animals/workareas/code-style-reviews/$TICKET"
if compgen -G "$dir/style-review.*.md" > /dev/null; then
  echo EXISTS
else
  echo FRESH
fi
