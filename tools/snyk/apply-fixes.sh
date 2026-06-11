#!/bin/bash
# Apply Snyk auto-fixes on the workspace repo checkout, then re-scan.
# Usage: apply-fixes.sh EUDPA-X --repo REPO [--dry-run] [--json]
#
# OSS: snyk fix (npm/maven where supported).
# Container: no reliable auto-fix — reports recommendations in scan JSON;
# the skill applies Dockerfile base-image bumps manually.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"

TICKET=""
REPO=""
DRY=0
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --repo) REPO="$2"; shift 2 ;;
        --dry-run) DRY=1; shift ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -n "$TICKET" ]] && [[ -n "$REPO" ]] || { echo "Usage: $0 EUDPA-X --repo REPO" >&2; exit 1; }

REPO_DIR="$WORKSPACE/repos/$REPO"
OUT_DIR="$WORKSPACE/workareas/reviews/$TICKET/snyk"
mkdir -p "$OUT_DIR"

targets=$("$SCRIPT_DIR/detect-targets.sh" --root "$REPO_DIR" --json)
oss_target=$(echo "$targets" | jq -r '.oss_target // empty')

fix_applied=false
fix_message="no OSS target"

if [[ -n "$oss_target" ]]; then
    dir="$REPO_DIR"
    file_arg=""
    if [[ "$oss_target" == */* ]]; then
        dir="$REPO_DIR/${oss_target%/*}"
        file_arg="--file=${oss_target##*/}"
    else
        file_arg="--file=$oss_target"
    fi
    if [[ "$DRY" == "1" ]]; then
        fix_message="dry-run: would run snyk fix in $dir"
    else
        set +e
        (cd "$dir" && snyk fix $file_arg --json > "$OUT_DIR/${REPO}-fix.json" 2>/dev/null)
        fix_exit=$?
        set -e
        fix_applied=true
        fix_message="snyk fix exit $fix_exit (see ${REPO}-fix.json)"
    fi
fi

if [[ "$DRY" != "1" ]]; then
    "$SCRIPT_DIR/scan-repo.sh" "$TICKET" --repo "$REPO" --json > "$OUT_DIR/${REPO}-post-fix-summary.json"
    post=$(cat "$OUT_DIR/${REPO}-post-fix-summary.json")
else
    post='{}'
fi

if [[ "$JSON" == "1" ]]; then
    applied_json=false
    [[ "$fix_applied" == true ]] && applied_json=true
    dry_json=false
    [[ "$DRY" == "1" ]] && dry_json=true
    jq -n \
        --arg repo "$REPO" \
        --arg msg "$fix_message" \
        --argjson applied "$applied_json" \
        --argjson dry "$dry_json" \
        --argjson post "$post" \
        '{repo: $repo, fix_applied: $applied, dry_run: $dry, message: $msg, post_scan: $post}'
    exit 0
fi

echo "Apply fixes $REPO: $fix_message"
if [[ "$DRY" != "1" ]] && [[ -f "$OUT_DIR/${REPO}-post-fix-summary.json" ]]; then
    jq -r '"  Post-scan clean: \(.clean)"' "$OUT_DIR/${REPO}-post-fix-summary.json"
fi
