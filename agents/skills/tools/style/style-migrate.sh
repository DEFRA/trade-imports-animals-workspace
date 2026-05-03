#!/bin/bash
# One-shot migration: convert legacy code-style-review.md (single monolithic
# doc with `### {repo-name}` Todo List subsections) into per-repo
# style-review.{repo}.md files with a `## Items` table.
#
# Usage:
#   style-migrate.sh EUDPA-XXXXX [--dry-run]
#
# Steps:
#   1. Parse code-style-review.md via lib/migrate-legacy-to-items.awk → TSV
#   2. Group rows by repo, write style-review.{repo}.md per repo with header
#      pulled from .style-meta.json (PR + JS files reviewed) and an empty
#      verdict line (regenerate via persona/style-counts.sh).
#   3. Archive code-style-review.md to .archive/code-style-review.md.{date}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"
MIGRATOR="$SCRIPT_DIR/lib/migrate-legacy-to-items.awk"

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

STYLE_DIR="$AGENTS_DIR/workareas/code-style-reviews/$TICKET"
LEGACY_FILE="$STYLE_DIR/code-style-review.md"
META_FILE="$STYLE_DIR/.style-meta.json"

[[ -d "$STYLE_DIR" ]] || { echo "Style review workspace not found: $STYLE_DIR" >&2; exit 1; }
[[ -f "$LEGACY_FILE" ]] || { echo "Legacy file not found: $LEGACY_FILE" >&2; exit 1; }
[[ -f "$META_FILE" ]] || { echo ".style-meta.json not found: $META_FILE" >&2; exit 1; }

# Extract scope info from legacy doc's Scope table for verdict carry-over.
# Format: | trade-imports-animals-X | #N | M | ⚠️ MINOR ISSUES |
get_legacy_verdict() {
    local repo="$1"
    awk -v REPO="$repo" '
        /^## Scope/ { in_scope=1; next }
        in_scope && /^## / { in_scope=0 }
        !in_scope { next }
        /^\|/ {
            line=$0
            n=split(line, parts, /\|/)
            if (n < 6) next
            r=parts[2]; gsub(/^[ \t]+|[ \t]+$/, "", r)
            v=parts[5]; gsub(/^[ \t]+|[ \t]+$/, "", v)
            if (r == REPO) {
                # Strip leading ⚠️/✅/❌ + space
                sub(/^[^A-Za-z]+/, "", v)
                sub(/[[:space:]]+\(after.*$/, "", v)
                print v
                exit
            }
        }
    ' "$LEGACY_FILE"
}

DATE_TAG=$(date +%Y%m%d-%H%M%S)
ARCHIVE_DIR="$STYLE_DIR/.archive"

# Run migration awk → TSV
tmp_tsv=$(mktemp)
trap 'rm -f "$tmp_tsv"' EXIT

awk -f "$MIGRATOR" "$LEGACY_FILE" > "$tmp_tsv"

if [[ ! -s "$tmp_tsv" ]]; then
    echo "Migration produced no rows. Aborting." >&2
    exit 1
fi

# Discover repos in the TSV
repos=()
while IFS= read -r repo; do
    [[ -n "$repo" ]] && repos+=( "$repo" )
done < <(awk -F'\t' '{print $1}' "$tmp_tsv" | sort -u)

[[ ${#repos[@]} -gt 0 ]] || { echo "No repos discovered in legacy doc." >&2; exit 1; }

echo "Discovered ${#repos[@]} repo(s) in legacy doc:"
for repo in "${repos[@]}"; do
    count=$(awk -F'\t' -v R="$repo" '$1==R{c++} END{print c+0}' "$tmp_tsv")
    echo "  $repo: $count item(s)"
done
echo

# Build per-repo files
build_repo_file() {
    local repo="$1"
    local out_file="$STYLE_DIR/style-review.${repo}.md"

    local pr js_count verdict
    pr=$(jq -r --arg r "$repo" '[.js_files[] | select(.repo==$r)] | first | .pr // ""' "$META_FILE")
    js_count=$(jq -r --arg r "$repo" '[.js_files[] | select(.repo==$r)] | length' "$META_FILE")
    verdict=$(get_legacy_verdict "$repo")
    [[ -z "$verdict" ]] && verdict="MINOR ISSUES"

    {
        printf '# Code Style Review: %s\n\n' "$repo"
        printf '**Ticket:** %s\n' "$TICKET"
        [[ -n "$pr" && "$pr" != "null" ]] && printf '**PR:** #%s\n' "$pr"
        printf '**JS Files Reviewed:** %s\n' "$js_count"
        printf '**Verdict:** %s\n\n' "$verdict"
        printf '## Items\n\n'
        printf '| # | File | Line | Rule | Severity | Issue | Fix | Disposition | Status | Notes |\n'
        printf '|---|------|------|------|----------|-------|-----|-------------|--------|-------|\n'

        # Emit rows. Cells are pre-trimmed by the awk; pipes inside cells need
        # escaping. We rebuild the row carefully.
        awk -F'\t' -v R="$repo" '
            BEGIN { OFS="" }
            $1 != R { next }
            {
                id=$2; file=$3; line=$4; rule=$5; sev=$6; issue=$7; fix=$8; disp=$9; stat=$10; notes=$11
                # Escape literal | in cells
                gsub(/\|/, "\\|", file)
                gsub(/\|/, "\\|", line)
                gsub(/\|/, "\\|", rule)
                gsub(/\|/, "\\|", sev)
                gsub(/\|/, "\\|", issue)
                gsub(/\|/, "\\|", fix)
                gsub(/\|/, "\\|", disp)
                gsub(/\|/, "\\|", stat)
                gsub(/\|/, "\\|", notes)
                print "| #" id " | " file " | " line " | " rule " | " sev " | " issue " | " fix " | " disp " | " stat " | " notes " |"
            }
        ' "$tmp_tsv"
    } > "$out_file.tmp"

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  --- $repo (would write $out_file) ---"
        head -10 "$out_file.tmp"
        echo "  ..."
        rm -f "$out_file.tmp"
    else
        mv "$out_file.tmp" "$out_file"
        echo "  wrote $out_file"
    fi
}

for repo in "${repos[@]}"; do
    build_repo_file "$repo"
done

if [[ "$DRY_RUN" == "true" ]]; then
    echo
    echo "Dry run complete — no files modified."
    exit 0
fi

# Archive legacy doc
mkdir -p "$ARCHIVE_DIR"
archived="$ARCHIVE_DIR/code-style-review.md.${DATE_TAG}"
mv "$LEGACY_FILE" "$archived"

echo
echo "Migration complete:"
echo "  Repos migrated: ${#repos[@]}"
echo "  Legacy doc archived: $archived"
