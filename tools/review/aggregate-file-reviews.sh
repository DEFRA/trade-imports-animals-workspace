#!/bin/bash
# Aggregate per-file .review.json files for a repo into pasteable markdown.
# Usage: aggregate-file-reviews.sh EUDPA-X --repo R [--section file-summary|items|both] [--json]
#
# Reads all *.review.json files for the repo, sorts by file path, and emits:
# - --section file-summary  → File Analysis Summary table (LLM pastes into review.{repo}.md)
# - --section items         → consolidated `## Items` table (globally renumbered IDs)
# - --section both          → both, separated by a blank line
# - --json                  → raw combined JSON instead of markdown

set -e
: "${TRADE_IMPORTS_WORKSPACE:?TRADE_IMPORTS_WORKSPACE not set — see docs/agent-onboarding.md}"

TICKET=""; REPO=""; SECTION="both"; JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --repo) REPO="$2"; shift 2 ;;
        --section) SECTION="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$TICKET" ]] && { echo "Missing ticket" >&2; exit 1; }
[[ -z "$REPO" ]] && { echo "Missing --repo" >&2; exit 1; }

dir="$TRADE_IMPORTS_WORKSPACE/workareas/reviews/$TICKET/file-reviews/$REPO"
[[ -d "$dir" ]] || { echo "No review dir: $dir" >&2; exit 1; }

files=()
while IFS= read -r f; do files+=("$f"); done < <(find "$dir" -maxdepth 1 -name '*.review.json' | sort)

[[ ${#files[@]} -eq 0 ]] && { echo "No .review.json files in $dir" >&2; exit 1; }

combined=$(jq -s '
    [.[] | {
        file: .file,
        verdict: .verdict,
        critical: ([.todos[] | select(.severity == "Critical")] | length),
        major: ([.todos[] | select(.severity == "Major")] | length),
        minor: ([.todos[] | select(.severity == "Minor")] | length),
        todos: .todos
    }] | sort_by(.file)
' "${files[@]}")

if [[ "$JSON" == "1" ]]; then
    echo "$combined"
    exit 0
fi

emit_file_summary() {
    echo "## File Analysis Summary"
    echo
    echo "| File | Verdict | Critical | Major | Minor |"
    echo "|------|---------|----------|-------|-------|"
    # Render verdict in jq (bash `read` collapses adjacent tab IFS chars,
    # which would eat empty-verdict fields — so we resolve to a non-empty
    # display string before tsv-ing).
    echo "$combined" | jq -r '
        def render_verdict:
            if . == "SAFE" then "SAFE"
            elif . == "NEEDS_ATTENTION" then "NEEDS ATTENTION"
            elif . == "RISKY" then "RISKY"
            else "—" end;
        .[] | "| `\(.file)` | \(.verdict | render_verdict) | \(.critical) | \(.major) | \(.minor) |"
    '
}

emit_items() {
    echo "## Items"
    echo
    echo "| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |"
    echo "|---|------|------|----------|----------|-------|-----|-------------|--------|-------|"
    echo "$combined" | jq -r '
        # Escape literal | as \| so the markdown table stays well-formed.
        def esc: . | tostring | gsub("\\|"; "\\|");
        [ .[] as $f | $f.todos[] | . + {file: $f.file} ]
        | to_entries
        | .[]
        | "| \(.key + 1) | `\(.value.file)` | \(.value.line) | \(.value.severity) | \(.value.category | esc) | \(.value.issue | esc) | \(.value.fix | esc) |  |  |  |"
    '
}

case "$SECTION" in
    file-summary) emit_file_summary ;;
    items) emit_items ;;
    both) emit_file_summary; echo; emit_items ;;
    *) echo "Unknown --section: $SECTION" >&2; exit 1 ;;
esac
