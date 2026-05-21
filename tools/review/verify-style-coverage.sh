#!/bin/bash
# Verify code style review coverage for a ticket
# Usage: ./verify-style-coverage.sh EUDPA-XXXXX [--json]
#
# Checks that every .js file changed in the PR has a .style.md review.
# Reads .style-meta.json from workareas/code-style-reviews/EUDPA-XXXXX/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

TICKET="${1:-}"
JSON_OUTPUT=false

if [[ "$2" == "--json" ]] || [[ "$1" == "--json" ]]; then
    JSON_OUTPUT=true
    [[ "$1" == "--json" ]] && TICKET="$2"
fi

if [[ -z "$TICKET" ]]; then
    echo "Usage: ./verify-style-coverage.sh EUDPA-XXXXX [--json]"
    echo ""
    echo "Verifies all changed .js files have .style.md review files."
    exit 1
fi

STYLE_DIR="$AGENTS_DIR/workareas/code-style-reviews/$TICKET"
META_FILE="$STYLE_DIR/.style-meta.json"
FILE_REVIEWS_DIR="$STYLE_DIR/file-reviews"

# Helper for output
log() {
    if [[ "$JSON_OUTPUT" == "false" ]]; then
        echo "$1"
    fi
}

error() {
    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo "{\"error\": \"$1\"}"
    else
        echo "Error: $1" >&2
    fi
    exit 1
}

# Check prerequisites
[[ -d "$STYLE_DIR" ]] || error "Code style review directory not found: $STYLE_DIR. Run CODE_STYLE_REVIEWER step 1-3 first."
[[ -f "$META_FILE" ]] || error ".style-meta.json not found. Run CODE_STYLE_REVIEWER step 3 first."
[[ -d "$FILE_REVIEWS_DIR" ]] || error "file-reviews directory not found."

# Read js_files from meta
js_files_json=$(jq '.js_files' "$META_FILE")
total_files=$(echo "$js_files_json" | jq 'length')

# Collect status
all_repos=()
all_files=()
all_statuses=()
pending_list=()
reviewed_count=0

for ((i=0; i<total_files; i++)); do
    repo=$(echo "$js_files_json" | jq -r ".[$i].repo")
    filepath=$(echo "$js_files_json" | jq -r ".[$i].path")

    safe_path=$(echo "$filepath" | tr '/' '_')
    review_file="$FILE_REVIEWS_DIR/$repo/${safe_path}.style.md"

    all_repos+=("$repo")
    all_files+=("$filepath")

    if [[ -f "$review_file" ]] && [[ -s "$review_file" ]]; then
        all_statuses+=("reviewed")
        ((reviewed_count++))
    elif [[ -f "$review_file" ]]; then
        all_statuses+=("pending")
        pending_list+=("$repo|$filepath")
    else
        all_statuses+=("missing")
        pending_list+=("$repo|$filepath")
    fi
done

pending_count=${#pending_list[@]}

if [[ "$total_files" -gt 0 ]]; then
    coverage_pct=$((reviewed_count * 100 / total_files))
else
    coverage_pct=100
fi

if [[ "$pending_count" -eq 0 ]]; then
    coverage_status="100%"
    is_complete=true
else
    coverage_status="${coverage_pct}%"
    is_complete=false
fi

# Write verification file
verification_file="$FILE_REVIEWS_DIR/_STYLE_VERIFICATION.md"

{
    echo "# Code Style Review Coverage Verification"
    echo ""
    echo "**Ticket:** $TICKET"
    echo "**Last Verified:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "**Total JS files changed:** $total_files"
    echo "**Files reviewed:** $reviewed_count"
    echo "**Coverage:** $coverage_status"
    echo ""
    echo "## JS Files Checklist"
    echo ""
    echo "| # | Repository | File | Status |"
    echo "|---|------------|------|--------|"

    for ((i=0; i<${#all_files[@]}; i++)); do
        repo="${all_repos[$i]}"
        filepath="${all_files[$i]}"
        status="${all_statuses[$i]}"
        case "$status" in
            reviewed) status_icon="✅ Reviewed" ;;
            pending)  status_icon="⏳ Pending" ;;
            missing)  status_icon="❌ Missing" ;;
        esac
        echo "| $((i+1)) | $repo | \`$filepath\` | $status_icon |"
    done

    echo ""
    echo "## Verification Result"
    echo ""
    if [[ "$is_complete" == "true" ]]; then
        echo "- [x] **CONFIRMED: All JS files have been style-reviewed**"
    else
        echo "- [ ] **INCOMPLETE: ${pending_count} file(s) pending style review**"
        echo ""
        echo "### Pending Reviews"
        echo ""
        for entry in "${pending_list[@]}"; do
            IFS='|' read -r repo filepath <<< "$entry"
            echo "- \`$repo/$filepath\`"
        done
    fi
} > "$verification_file"

# Output
if [[ "$JSON_OUTPUT" == "true" ]]; then
    pending_json=$(printf '%s\n' "${pending_list[@]:-}" | jq -R -s 'split("\n") | map(select(length > 0))')
    jq -n \
        --arg ticket "$TICKET" \
        --argjson total "$total_files" \
        --argjson reviewed "$reviewed_count" \
        --argjson pending "$pending_count" \
        --arg coverage "$coverage_status" \
        --argjson complete "$is_complete" \
        --argjson pending_files "$pending_json" \
        '{
            ticket: $ticket,
            total: $total,
            reviewed: $reviewed,
            pending: $pending,
            coverage: $coverage,
            complete: $complete,
            pending_files: $pending_files
        }'
else
    echo ""
    echo "=== Style Coverage Verification ==="
    echo "Ticket: $TICKET"
    echo "Coverage: $reviewed_count / $total_files ($coverage_status)"
    echo ""

    if [[ "$is_complete" == "true" ]]; then
        echo "✅ All JS files style-reviewed"
    else
        echo "⏳ Pending $pending_count style review(s):"
        for entry in "${pending_list[@]}"; do
            IFS='|' read -r repo filepath <<< "$entry"
            echo "  - $repo/$filepath"
        done
    fi

    echo ""
    echo "Updated: $verification_file"

    if [[ "$is_complete" == "true" ]]; then
        echo ""
        echo "Ready to write per-repo summaries and code-style-review.md."
    fi
fi
