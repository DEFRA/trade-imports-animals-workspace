#!/bin/bash
# Phase 1 coverage gate: verify every package in every repo's
# packages.{repo}.json has classification != null.
#
# Usage:
#   verify-classification-coverage.sh --run-id TICKET [--repo REPO] [--json]
#
# Exit codes:
#   0  → all packages classified (or no packages.*.json files yet)
#   1  → at least one pending package; lists them on stderr

set -e

RUN_ID=""
REPO_FILTER=""
JSON=0

usage() {
    echo "Usage: $0 --run-id TICKET [--repo REPO] [--json]" >&2
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1" >&2; usage ;;
    esac
done

[[ -z "$RUN_ID" ]] && usage

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fold any per-package classification fragments left by PACKAGE_PLANNER
# workers into the canonical packages.{repo}.json files before counting.
agg_args=(--run-id "$RUN_ID")
[[ -n "$REPO_FILTER" ]] && agg_args+=(--repo "$REPO_FILTER")
"$SCRIPT_DIR/packages-aggregate-classifications.sh" "${agg_args[@]}" >&2 || true

# packages-list.sh handles filtering + JSON output for us.
pending_args=(--run-id "$RUN_ID" --classification pending --json)
[[ -n "$REPO_FILTER" ]] && pending_args+=(--repo "$REPO_FILTER")
pending=$("$SCRIPT_DIR/packages-list.sh" "${pending_args[@]}")

count=$(echo "$pending" | jq 'length')

if [[ "$JSON" == "1" ]]; then
    echo "$pending" | jq --argjson c "$count" '{pending_count: $c, pending: .}'
    [[ "$count" -eq 0 ]] && exit 0 || exit 1
fi

if [[ "$count" -eq 0 ]]; then
    echo "✓ All packages classified for $RUN_ID${REPO_FILTER:+ (repo: $REPO_FILTER)}"
    exit 0
fi

echo "✗ $count package(s) still pending classification:" >&2
echo "$pending" | jq -r '.[] | "  \(.repo)  \(.package)  \(.current) → \(.target)  (\(.upgrade_type))"' >&2
exit 1
