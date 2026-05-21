#!/bin/bash
# Pull every repo in the review workspace via `git pull --rebase`.
# Usage:
#   pull-repos.sh EUDPA-XXXXX [--repo REPO] [--json]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REVIEW_TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_DIR="$(dirname "$REVIEW_TOOLS_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

TICKET=""
REPO_FILTER=""
JSON_OUTPUT=false

usage() {
    echo "Usage: $0 EUDPA-XXXXX [--repo REPO] [--json]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        -h|--help) usage ;;
        -*) echo "Unknown option: $1" >&2; usage ;;
        *) TICKET="$1"; shift ;;
    esac
done

[[ -z "$TICKET" ]] && usage

REVIEW_DIR="$AGENTS_DIR/workareas/reviews/$TICKET"
META_FILE="$REVIEW_DIR/.review-meta.json"
[[ -f "$META_FILE" ]] || { echo "Meta file not found: $META_FILE" >&2; exit 1; }

repos=$(jq -r '.prs[].repo' "$META_FILE" | sort -u)

results_json="[]"
overall_ok=true

for repo in $repos; do
    if [[ -n "$REPO_FILTER" ]] && [[ "$repo" != "$REPO_FILTER" ]]; then
        continue
    fi
    repo_dir="$REVIEW_DIR/repos/$repo"
    if [[ ! -d "$repo_dir/.git" ]]; then
        if [[ "$JSON_OUTPUT" == "false" ]]; then
            echo "  ⚠️  $repo — not cloned, skipping"
        fi
        results_json=$(jq --arg r "$repo" --arg s "skipped" --arg m "not cloned" '. + [{repo: $r, status: $s, message: $m}]' <<<"$results_json")
        continue
    fi

    # Pull silently; capture stderr
    if out=$(git -C "$repo_dir" pull --rebase --quiet 2>&1); then
        head_sha=$(git -C "$repo_dir" rev-parse HEAD)
        if [[ "$JSON_OUTPUT" == "false" ]]; then
            echo "  ✅ $repo — at ${head_sha:0:7}"
        fi
        results_json=$(jq --arg r "$repo" --arg s "ok" --arg h "$head_sha" '. + [{repo: $r, status: $s, head: $h}]' <<<"$results_json")
    else
        overall_ok=false
        if [[ "$JSON_OUTPUT" == "false" ]]; then
            echo "  ❌ $repo — pull failed: $out"
        fi
        msg_json=$(jq -nR --arg m "$out" '$m')
        results_json=$(jq --arg r "$repo" --arg s "failed" --argjson m "$msg_json" '. + [{repo: $r, status: $s, message: $m}]' <<<"$results_json")
    fi
done

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "$results_json"
fi

[[ "$overall_ok" == "true" ]] || exit 1
