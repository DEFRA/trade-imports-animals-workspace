#!/bin/bash
# One-shot migration: convert legacy review/decisions split into the consolidated
# `## Items` table inside review.{repo}.md.
#
# Usage:
#   review-migrate-decisions.sh EUDPA-XXXXX [--dry-run]
#
# Per repo:
#   1. Read decisions.{repo}.md (and merge any earlier short-name aliases).
#   2. Rewrite review.{repo}.md: replace `## Todo List` → `## Items` with the new schema.
#   3. Move all `decisions.*.md` files to .archive/decisions/{date}/ for traceability.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"
MIGRATOR="$SCRIPT_DIR/lib/migrate-todo-to-items.awk"

TICKET=""
DRY_RUN=false

usage() {
    echo "Usage: $0 EUDPA-XXXXX [--dry-run]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage

REVIEW_DIR="$AGENTS_DIR/workareas/reviews/$TICKET"
[[ -d "$REVIEW_DIR" ]] || { echo "Review workspace not found: $REVIEW_DIR" >&2; exit 1; }

DATE_TAG=$(date +%Y%m%d-%H%M%S)
ARCHIVE_DIR="$REVIEW_DIR/.archive/decisions/$DATE_TAG"

shopt -s nullglob
review_files=( "$REVIEW_DIR"/review.trade-imports-animals-*.md )
[[ ${#review_files[@]} -gt 0 ]] || { echo "No review.{repo}.md files found in $REVIEW_DIR" >&2; exit 1; }

migrated=0
for review_file in "${review_files[@]}"; do
    base=$(basename "$review_file")
    repo="${base#review.}"
    repo="${repo%.md}"

    # Find decisions file for this repo. Prefer the full-name; fall back to short-name aliases.
    decisions_file="$REVIEW_DIR/decisions.${repo}.md"
    if [[ ! -f "$decisions_file" ]]; then
        # Try short alias (e.g. "frontend" for "trade-imports-animals-frontend")
        short="${repo#trade-imports-animals-}"
        alt="$REVIEW_DIR/decisions.${short}.md"
        if [[ -f "$alt" ]]; then
            decisions_file="$alt"
        else
            decisions_file=""
        fi
    fi

    if [[ -z "$decisions_file" ]] || [[ ! -f "$decisions_file" ]]; then
        echo "  $repo: no decisions file, migrating from review-table flags only"
        decisions_file="/dev/null"
    else
        echo "  $repo: using $(basename "$decisions_file")"
    fi

    tmp_out=$(mktemp)
    if ! awk -v "DECISIONS_FILE=$decisions_file" -f "$MIGRATOR" "$review_file" > "$tmp_out"; then
        echo "  ERROR migrating $repo" >&2
        rm -f "$tmp_out"
        continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  --- diff for $repo ---"
        diff -u "$review_file" "$tmp_out" | head -40 || true
        rm -f "$tmp_out"
    else
        mv "$tmp_out" "$review_file"
        migrated=$((migrated + 1))
    fi
done

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "Dry run complete — no files modified."
    exit 0
fi

# Archive all decisions.*.md (full-name + short-name aliases + combined decisions.md)
mkdir -p "$ARCHIVE_DIR"
moved=0
for f in "$REVIEW_DIR"/decisions.*.md "$REVIEW_DIR"/decisions.md; do
    [[ -f "$f" ]] || continue
    mv "$f" "$ARCHIVE_DIR/"
    moved=$((moved + 1))
done

echo ""
echo "Migration complete:"
echo "  Repos migrated: $migrated"
echo "  Decisions files archived: $moved → $ARCHIVE_DIR"
