#!/bin/bash
# Snyk security gate for a ticket review — scan (and optionally fix) all PR repos.
# Usage: start-snyk.sh EUDPA-XXXXX [--fix] [--json]
#
# Requires: review workspace from start-review.sh, Snyk CLI + auth, gh auth.
# Mutates workspace repos/<repo> checkouts (PR head branches) when --fix is set.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"

TICKET=""
FIX=0
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --fix) FIX=1; shift ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -n "$TICKET" ]] || { echo "Usage: $0 EUDPA-XXXXX [--fix] [--json]" >&2; exit 1; }

META="$WORKSPACE/workareas/reviews/$TICKET/.review-meta.json"
[[ -f "$META" ]] || { echo "Missing $META — run start-review.sh first" >&2; exit 1; }

if ! "$SCRIPT_DIR/ensure-auth.sh" >/dev/null 2>&1; then
    if [[ "$JSON" == "1" ]]; then
        "$SCRIPT_DIR/ensure-auth.sh" --json
    else
        echo "MODE: SNYK_SKIP"
        "$SCRIPT_DIR/ensure-auth.sh" || true
        echo "Continuing review without Snyk — install/auth and re-run start-snyk.sh"
    fi
    exit 0
fi

OUT_DIR="$WORKSPACE/workareas/reviews/$TICKET/snyk"
mkdir -p "$OUT_DIR"

repos=()
while IFS= read -r r; do
    [[ -n "$r" ]] && repos+=("$r")
done < <(jq -r '.prs[].repo' "$META")

declare -a summaries
for repo in "${repos[@]}"; do
    "$SCRIPT_DIR/sync-workspace-repo.sh" "$TICKET" --repo "$repo" >/dev/null
    "$SCRIPT_DIR/scan-repo.sh" "$TICKET" --repo "$repo" --json > "$OUT_DIR/${repo}-summary.json"
    if [[ "$FIX" == "1" ]]; then
        if ! jq -e '.clean == true' "$OUT_DIR/${repo}-summary.json" >/dev/null; then
            "$SCRIPT_DIR/apply-fixes.sh" "$TICKET" --repo "$repo" --json > "$OUT_DIR/${repo}-fix-run.json"
        fi
    fi
    summaries+=("$(cat "$OUT_DIR/${repo}-summary.json")")
done

combined=$(printf '%s\n' "${summaries[@]}" | jq -s '.')
all_clean=$(echo "$combined" | jq '[.[].clean] | all')

report="$WORKSPACE/workareas/reviews/$TICKET/snyk-report.md"
{
    echo "# Snyk report: $TICKET"
    echo
    echo "**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "**Fix mode:** $([ "$FIX" == "1" ] && echo yes || echo no)"
    echo
    echo "## Summary"
    echo
    echo "| Repo | OSS | Code | Container | Clean |"
    echo "|---|---:|---:|---:|---|"
    echo "$combined" | jq -r '.[] | "| \(.repo) | \(.oss_issues) | \(.code_issues) | \(.container_issues) | \(.clean) |"'
    echo
    echo "Artifacts: \`workareas/reviews/$TICKET/snyk/\`"
    echo
    if [[ "$all_clean" == "true" ]]; then
        echo "**Verdict:** SNYK CLEAN"
    else
        echo "**Verdict:** SNYK FINDINGS — triage remaining issues; container base-image bumps may need manual Dockerfile edits from container scan JSON."
    fi
} > "$report"

if [[ "$JSON" == "1" ]]; then
    fix_json=false
    [[ "$FIX" == "1" ]] && fix_json=true
    jq -n \
        --arg ticket "$TICKET" \
        --argjson repos "$combined" \
        --argjson all_clean "$all_clean" \
        --argjson fix "$fix_json" \
        '{mode: "SNYK", ticket: $ticket, fix: $fix, all_clean: $all_clean, repos: $repos, report: "snyk-report.md"}'
    exit 0
fi

echo "MODE: SNYK"
echo
cat "$report"
