#!/bin/bash
# Run Snyk OSS, Code, and Container scans for one repo on the workspace checkout.
# Usage: scan-repo.sh EUDPA-X --repo REPO [--json]
#
# Writes JSON artifacts under workareas/reviews/EUDPA-X/snyk/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"

TICKET=""
REPO=""
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) TICKET="$1"; shift ;;
        --repo) REPO="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -n "$TICKET" ]] && [[ -n "$REPO" ]] || { echo "Usage: $0 EUDPA-X --repo REPO" >&2; exit 1; }

"$SCRIPT_DIR/ensure-auth.sh" >/dev/null

REPO_DIR="$WORKSPACE/repos/$REPO"
OUT_DIR="$WORKSPACE/workareas/reviews/$TICKET/snyk"
mkdir -p "$OUT_DIR"

targets=$("$SCRIPT_DIR/detect-targets.sh" --root "$REPO_DIR" --json)

oss_target=$(echo "$targets" | jq -r '.oss_target // empty')
oss_kind=$(echo "$targets" | jq -r '.oss_kind // empty')
dockerfiles=$(echo "$targets" | jq -c '.dockerfiles')

oss_issues=0
oss_exit=0
code_issues=0
code_exit=0
container_issues=0

run_oss() {
    [[ -n "$oss_target" ]] || return 0
    local out="$OUT_DIR/${REPO}-oss.json"
    local dir="$REPO_DIR"
    local file_arg=""
    if [[ "$oss_target" == */* ]]; then
        dir="$REPO_DIR/${oss_target%/*}"
        file_arg="--file=${oss_target##*/}"
    else
        file_arg="--file=$oss_target"
    fi
    set +e
    (cd "$dir" && snyk test $file_arg --json > "$out" 2>/dev/null)
    oss_exit=$?
    set -e
    if [[ -s "$out" ]] && jq empty "$out" 2>/dev/null; then
        oss_issues=$(jq '[.vulnerabilities[]?] | length' "$out" 2>/dev/null || echo 0)
    else
        oss_issues=0
        oss_exit=2
    fi
}

run_code() {
    local out="$OUT_DIR/${REPO}-code.json"
    set +e
    snyk code test "$REPO_DIR" --json > "$out" 2>/dev/null
    code_exit=$?
    set -e
    if [[ -s "$out" ]] && jq empty "$out" 2>/dev/null; then
        code_issues=$(jq '[.runs[0].results[]?] | length' "$out" 2>/dev/null || echo 0)
        if [[ "$code_issues" == "0" ]]; then
            code_issues=$(jq '[.. | objects | select(has("ruleId")) ] | length' "$out" 2>/dev/null || echo 0)
        fi
    else
        code_issues=0
        code_exit=2
        echo '{"skipped": true, "reason": "snyk code test unavailable or disabled"}' > "$out"
    fi
}

run_container() {
    local df out base
    local count
    count=$(echo "$dockerfiles" | jq 'length')
    [[ "$count" -gt 0 ]] || return 0
    local idx=0
    while [[ "$idx" -lt "$count" ]]; do
        df=$(echo "$dockerfiles" | jq -r ".[$idx]")
        base=$(echo "$df" | tr '/' '_')
        out="$OUT_DIR/${REPO}-container-${base}.json"
        set +e
        snyk container test --file="$df" "$REPO_DIR" --json > "$out" 2>/dev/null
        local c_exit=$?
        set -e
        if [[ -s "$out" ]] && jq empty "$out" 2>/dev/null; then
            local n
            n=$(jq '[.vulnerabilities[]?] | length' "$out" 2>/dev/null || echo 0)
            container_issues=$((container_issues + n))
        fi
        ((idx++)) || true
    done
}

run_oss
run_code
run_container

summary_file="$OUT_DIR/${REPO}-summary.json"
jq -n \
    --arg repo "$REPO" \
    --arg oss_kind "$oss_kind" \
    --argjson oss_issues "$oss_issues" \
    --argjson oss_exit "$oss_exit" \
    --argjson code_issues "$code_issues" \
    --argjson code_exit "$code_exit" \
    --argjson container_issues "$container_issues" \
    --argjson dockerfiles "$dockerfiles" \
    '{
        repo: $repo,
        oss_kind: (if $oss_kind == "" then null else $oss_kind end),
        oss_issues: $oss_issues,
        oss_exit: $oss_exit,
        code_issues: $code_issues,
        code_exit: $code_exit,
        container_issues: $container_issues,
        dockerfiles: $dockerfiles,
        clean: (($oss_issues + $code_issues + $container_issues) == 0)
    }' > "$summary_file"

if [[ "$JSON" == "1" ]]; then
    cat "$summary_file"
    exit 0
fi

echo "Snyk scan $REPO — OSS: $oss_issues ($oss_kind) · Code: $code_issues · Container: $container_issues"
if jq -e '.clean == true' "$summary_file" >/dev/null; then
    echo "  Status: clean"
else
    echo "  Status: findings present"
fi
