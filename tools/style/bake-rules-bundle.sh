#!/bin/bash
# Concatenate the style-relevant best-practices files for one repo into
# a single bundle, so per-file reviewers can Read once instead of N
# times per parallel reviewer.
#
# Usage: bake-rules-bundle.sh EUDPA-XXXXX REPO
#
# Writes to:
#   ~/git/defra/trade-imports-animals-workspace/workareas/code-style-reviews/EUDPA-XXXXX/style-rules.{repo}.md
#
# Per-repo even though today's content is identical across repos
# (Decision 4) — leaves room for per-repo divergence without changing
# the reviewer's prompt shape.

set -e

TICKET="${1:-}"
REPO="${2:-}"

if [[ -z "$TICKET" ]] || [[ -z "$REPO" ]]; then
    echo "Usage: $0 EUDPA-XXXXX REPO" >&2
    exit 1
fi

ROOT="$HOME/git/defra/trade-imports-animals-workspace"
STYLE_DIR="$ROOT/workareas/code-style-reviews/$TICKET"
out="$STYLE_DIR/style-rules.${REPO}.md"

mkdir -p "$STYLE_DIR"

# Files concatenated, in order:
sources=(
    "docs/best-practices/node/code-style.md"
    "docs/best-practices/doc-comments/BEST_PRACTICES.md"
    "docs/best-practices/doc-comments/jsdoc.md"
)

{
    echo "# Style rules bundle for $REPO"
    echo
    echo "Concatenated from \`docs/best-practices/\` at prepare-style time."
    echo "All STYLE_FILE_REVIEWER workers for this ticket read this single"
    echo "file instead of three separate ones."
    for src in "${sources[@]}"; do
        path="$ROOT/$src"
        echo
        echo "---"
        echo
        if [[ -f "$path" ]]; then
            echo "## Source: \`$src\`"
            echo
            cat "$path"
        else
            echo "## Source: \`$src\` (missing)"
        fi
    done
} > "$out"

echo "$out"
