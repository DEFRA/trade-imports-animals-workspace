#!/bin/bash
# Set the classification + risk + rationale fields on one package row
# in packages.{repo}.json. Called by PACKAGE_PLANNER workers.
#
# Usage:
#   packages-set-classification.sh --run-id TICKET --repo REPO --package PKG \
#     --classification auto|manual \
#     --risk LOW|MEDIUM|HIGH \
#     --safe-for-automation true|false \
#     --rationale "..." \
#     [--files-affected "path1,path2,..."] \
#     [--changes-required "..."] \
#     [--changelog-url URL] \
#     [--migration-guide-url URL] \
#     [--demoted-from-auto true|false]

set -e

RUN_ID=""
REPO=""
PACKAGE=""
CLASSIFICATION=""
RISK=""
SAFE=""
RATIONALE=""
FILES_AFFECTED=""
SET_FILES=0
CHANGES_REQUIRED=""
SET_CHANGES=0
CHANGELOG_URL=""
SET_CHANGELOG=0
MIGRATION_URL=""
SET_MIGRATION=0
DEMOTED=""
SET_DEMOTED=0

usage() {
    cat <<EOF >&2
Usage: $0 --run-id TICKET --repo REPO --package PKG \\
    --classification auto|manual --risk LOW|MEDIUM|HIGH \\
    --safe-for-automation true|false --rationale "..." \\
    [--files-affected "p1,p2,..."] [--changes-required "..."] \\
    [--changelog-url URL] [--migration-guide-url URL] \\
    [--demoted-from-auto true|false]
EOF
    exit 1
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --repo) REPO="$2"; shift 2 ;;
        --package) PACKAGE="$2"; shift 2 ;;
        --classification) CLASSIFICATION="$2"; shift 2 ;;
        --risk) RISK="$2"; shift 2 ;;
        --safe-for-automation) SAFE="$2"; shift 2 ;;
        --rationale) RATIONALE="$2"; shift 2 ;;
        --files-affected) FILES_AFFECTED="$2"; SET_FILES=1; shift 2 ;;
        --changes-required) CHANGES_REQUIRED="$2"; SET_CHANGES=1; shift 2 ;;
        --changelog-url) CHANGELOG_URL="$2"; SET_CHANGELOG=1; shift 2 ;;
        --migration-guide-url) MIGRATION_URL="$2"; SET_MIGRATION=1; shift 2 ;;
        --demoted-from-auto) DEMOTED="$2"; SET_DEMOTED=1; shift 2 ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1" >&2; usage ;;
    esac
done

[[ -z "$RUN_ID" ]] && usage
[[ -z "$REPO" ]] && usage
[[ -z "$PACKAGE" ]] && usage
[[ -z "$CLASSIFICATION" ]] && usage
[[ -z "$RISK" ]] && usage
[[ -z "$SAFE" ]] && usage
[[ -z "$RATIONALE" ]] && usage

case "$CLASSIFICATION" in
    auto|manual) ;;
    *) echo "Invalid --classification: $CLASSIFICATION (auto|manual)" >&2; exit 1 ;;
esac
case "$RISK" in
    LOW|MEDIUM|HIGH) ;;
    *) echo "Invalid --risk: $RISK (LOW|MEDIUM|HIGH)" >&2; exit 1 ;;
esac
case "$SAFE" in
    true|false) ;;
    *) echo "Invalid --safe-for-automation: $SAFE (true|false)" >&2; exit 1 ;;
esac

TARGET="$HOME/git/defra/trade-imports-animals/workareas/npm-upgrades/$RUN_ID/$REPO/packages.${REPO}.json"
[[ -f "$TARGET" ]] || { echo "Packages file not found: $TARGET" >&2; exit 1; }

exists=$(jq --arg p "$PACKAGE" '[.packages[] | select(.package == $p)] | length' "$TARGET")
[[ "$exists" -eq 0 ]] && { echo "Package not found in $TARGET: $PACKAGE" >&2; exit 1; }

# Build a partial-update object that we merge into the package row.
# files_affected: if provided, split CSV; if empty string, treat as
# explicit empty list.
files_json='null'
if [[ "$SET_FILES" == "1" ]]; then
    if [[ -z "$FILES_AFFECTED" ]]; then
        files_json='[]'
    else
        files_json=$(echo "$FILES_AFFECTED" | jq -Rc 'split(",") | map(gsub("^\\s+|\\s+$"; ""))')
    fi
fi

changes_json='null'
[[ "$SET_CHANGES" == "1" ]] && changes_json=$(jq -nc --arg v "$CHANGES_REQUIRED" 'if $v == "" then null else $v end')
changelog_json='null'
[[ "$SET_CHANGELOG" == "1" ]] && changelog_json=$(jq -nc --arg v "$CHANGELOG_URL" 'if $v == "" then null else $v end')
migration_json='null'
[[ "$SET_MIGRATION" == "1" ]] && migration_json=$(jq -nc --arg v "$MIGRATION_URL" 'if $v == "" then null else $v end')
demoted_json='false'
[[ "$SET_DEMOTED" == "1" ]] && [[ "$DEMOTED" == "true" ]] && demoted_json='true'

jq \
    --arg p "$PACKAGE" \
    --arg cls "$CLASSIFICATION" \
    --arg risk "$RISK" \
    --argjson safe "$SAFE" \
    --arg rationale "$RATIONALE" \
    --argjson files "$files_json" \
    --argjson changes "$changes_json" \
    --argjson changelog "$changelog_json" \
    --argjson migration "$migration_json" \
    --argjson set_files "$SET_FILES" \
    --argjson set_changes "$SET_CHANGES" \
    --argjson set_changelog "$SET_CHANGELOG" \
    --argjson set_migration "$SET_MIGRATION" \
    --argjson set_demoted "$SET_DEMOTED" \
    --argjson demoted "$demoted_json" \
    '.packages |= map(
        if .package == $p then
            .classification = $cls
            | .risk = $risk
            | .safe_for_automation = $safe
            | .rationale = $rationale
            | (if $set_files == 1 then .files_affected = $files else . end)
            | (if $set_changes == 1 then .changes_required_summary = $changes else . end)
            | (if $set_changelog == 1 then .changelog_url = $changelog else . end)
            | (if $set_migration == 1 then .migration_guide_url = $migration else . end)
            | (if $set_demoted == 1 then .demoted_from_auto = $demoted else . end)
        else . end
    )' "$TARGET" > "$TARGET.tmp" && mv "$TARGET.tmp" "$TARGET"

echo "Classified $PACKAGE in $REPO: $CLASSIFICATION (risk=$RISK)"
