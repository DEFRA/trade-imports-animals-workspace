#!/bin/bash
# Prepare a code-style review workspace for a JIRA ticket.
# Usage: ./prepare-style.sh EUDPA-XXXXX [--json]
#
# Creates workareas/code-style-reviews/EUDPA-XXXXX/ with:
#   - .style-meta.json (state for other scripts)
#   - file-reviews/{repo}/{safe_path}.style.json placeholders
#   - style-rules.{repo}.md per-repo rules bundle
#
# Piggybacks on the standard review workspace at
# workareas/reviews/EUDPA-XXXXX/ for cloned repos and PR diff cache —
# runs prepare-review.sh first if that workspace is missing.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ROOT="$HOME/git/defra/trade-imports-animals-workspace"
PREPARE_REVIEW="$ROOT/tools/review/prepare-review.sh"
PR_DETAILS="$ROOT/tools/github/pr-details.sh"
FILE_STYLE_INIT="$SCRIPT_DIR/file-style-init.sh"
BAKE_BUNDLE="$SCRIPT_DIR/bake-rules-bundle.sh"

TICKET=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --json) JSON_OUTPUT=true; shift ;;
        EUDPA-*) TICKET="$1"; shift ;;
        -*) echo "Unknown option: $1" >&2; exit 1 ;;
        *) TICKET="$1"; shift ;;
    esac
done

if [[ -z "$TICKET" ]]; then
    echo "Usage: $0 EUDPA-XXXXX [--json]" >&2
    exit 1
fi

REVIEW_DIR="$ROOT/workareas/reviews/$TICKET"
REVIEW_META="$REVIEW_DIR/.review-meta.json"
STYLE_DIR="$ROOT/workareas/code-style-reviews/$TICKET"
STYLE_META="$STYLE_DIR/.style-meta.json"

log() {
    [[ "$JSON_OUTPUT" == "false" ]] && echo "$1"
}

# ---- Step 1: ensure review workspace exists ---------------------------

if [[ ! -f "$REVIEW_META" ]]; then
    log "Review workspace missing — running prepare-review.sh..."
    "$PREPARE_REVIEW" "$TICKET" >&2
fi

[[ -f "$REVIEW_META" ]] || { echo "prepare-review.sh did not produce $REVIEW_META" >&2; exit 1; }

# ---- Step 2: create style workspace ----------------------------------

log "Creating code-style workspace..."
mkdir -p "$STYLE_DIR/file-reviews"

# ---- Step 3: discover .js files from review-meta.json --------------

log "Discovering .js files..."
js_files_json="[]"
total_js=0

while IFS= read -r pr_meta; do
    [[ -z "$pr_meta" ]] && continue
    repo=$(echo "$pr_meta" | jq -r '.repo')
    pr_number=$(echo "$pr_meta" | jq -r '.pr')
    commit=$(echo "$pr_meta" | jq -r '.commit')

    files=$("$PR_DETAILS" "$repo" "$pr_number" files 2>/dev/null) || continue

    while IFS= read -r filepath; do
        [[ -z "$filepath" ]] && continue
        [[ "$filepath" == *.js ]] || continue

        entry=$(jq -nc \
            --arg repo "$repo" \
            --arg path "$filepath" \
            --argjson pr "$pr_number" \
            --arg commit "$commit" \
            '{repo: $repo, path: $path, pr: $pr, commit: $commit}')
        js_files_json=$(jq --argjson e "$entry" '. + [$e]' <<<"$js_files_json")
        total_js=$((total_js + 1))
    done <<<"$files"
done < <(jq -c '.prs[]' "$REVIEW_META")

if [[ "$total_js" -eq 0 ]]; then
    log "No .js files found across any PR."
    # Still write .style-meta.json so subsequent commands have a stable
    # workspace shape (empty js_files).
fi

# ---- Step 4: write .style-meta.json -----------------------------

now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq -n \
    --arg id "$TICKET" \
    --arg created "$now" \
    --argjson js_files "$js_files_json" \
    '{id: $id, created: $created, js_files: $js_files}' > "$STYLE_META.tmp"
mv "$STYLE_META.tmp" "$STYLE_META"

# ---- Step 5: init per-file placeholders -------------------------

log "Creating per-file .style.json placeholders..."
created_files=0
while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    repo=$(echo "$entry" | jq -r '.repo')
    path=$(echo "$entry" | jq -r '.path')
    pr=$(echo "$entry" | jq -r '.pr')
    commit=$(echo "$entry" | jq -r '.commit')

    encoded="${path//\//_}"
    placeholder="$STYLE_DIR/file-reviews/$repo/$encoded.style.json"

    # Skip if already reviewed (verdict set).
    if [[ -f "$placeholder" ]] && [[ "$(jq -r '.verdict // "null"' "$placeholder" 2>/dev/null)" != "null" ]]; then
        continue
    fi

    "$FILE_STYLE_INIT" "$TICKET" \
        --repo "$repo" --file "$path" --commit "$commit" \
        --pr "$pr" --mode FRESH > /dev/null
    created_files=$((created_files + 1))
done < <(jq -c '.js_files[]' "$STYLE_META")

# ---- Step 6: bake per-repo style-rules bundle ------------------

log "Baking per-repo style-rules bundles..."
bundle_repos=()
while IFS= read -r repo; do
    [[ -z "$repo" ]] && continue
    "$BAKE_BUNDLE" "$TICKET" "$repo" > /dev/null
    bundle_repos+=("$repo")
done < <(jq -r '.js_files[].repo' "$STYLE_META" | sort -u)

# ---- Output ----------------------------------------------------------

if [[ "$JSON_OUTPUT" == "true" ]]; then
    cat "$STYLE_META"
else
    echo
    echo "=== Code-Style Workspace Ready ==="
    echo "Ticket: $TICKET"
    echo "Directory: $STYLE_DIR"
    echo
    echo "Created:"
    echo "  ✓ .style-meta.json"
    echo "  ✓ file-reviews/ ($created_files placeholders)"
    if [[ ${#bundle_repos[@]} -gt 0 ]]; then
        for r in "${bundle_repos[@]}"; do
            echo "  ✓ style-rules.${r}.md"
        done
    fi
    echo
    if [[ "$total_js" -eq 0 ]]; then
        echo "Note: no .js files in this PR — no code-style review needed."
    else
        echo "Next: spawn STYLE_FILE_REVIEWER subagents (FRESH Step 4)."
    fi
fi
