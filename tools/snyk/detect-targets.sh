#!/bin/bash
# Detect Snyk scan targets in a repository checkout.
# Usage: detect-targets.sh --root PATH [--json]

set -e

ROOT=""
JSON=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --root) ROOT="$2"; shift 2 ;;
        --json) JSON=1; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -n "$ROOT" ]] || { echo "--root required" >&2; exit 1; }
[[ -d "$ROOT" ]] || { echo "Not a directory: $ROOT" >&2; exit 1; }

oss_target=""
oss_kind=""
for candidate in package.json pom.xml build.gradle; do
    if [[ -f "$ROOT/$candidate" ]]; then
        oss_target="$candidate"
        case "$candidate" in
            package.json) oss_kind="npm" ;;
            pom.xml) oss_kind="maven" ;;
            build.gradle) oss_kind="gradle" ;;
        esac
        break
    fi
    for sub in service app src; do
        if [[ -f "$ROOT/$sub/$candidate" ]]; then
            oss_target="$sub/$candidate"
            case "$candidate" in
                package.json) oss_kind="npm" ;;
                pom.xml) oss_kind="maven" ;;
                build.gradle) oss_kind="gradle" ;;
            esac
            break 2
        fi
    done
done

dockerfiles=()
while IFS= read -r f; do
    dockerfiles+=("$f")
done < <(find "$ROOT" -name Dockerfile -not -path '*/node_modules/*' -not -path '*/.git/*' 2>/dev/null | sort)

# Relative paths from ROOT
rel_dockerfiles=()
for f in "${dockerfiles[@]}"; do
    rel_dockerfiles+=("${f#"$ROOT"/}")
done

df_json='[]'
if [[ ${#rel_dockerfiles[@]} -gt 0 ]]; then
    df_json=$(printf '%s\n' "${rel_dockerfiles[@]}" | jq -R . | jq -s '.')
fi

if [[ "$JSON" == "1" ]]; then
    jq -n \
        --arg oss_target "$oss_target" \
        --arg oss_kind "$oss_kind" \
        --argjson dockerfiles "$df_json" \
        '{
            oss_target: (if $oss_target == "" then null else $oss_target end),
            oss_kind: (if $oss_kind == "" then null else $oss_kind end),
            dockerfiles: $dockerfiles,
            code_scan: true
        }'
    exit 0
fi

echo "OSS: ${oss_target:-none} (${oss_kind:-n/a})"
echo "Dockerfiles: ${#rel_dockerfiles[@]}"
for d in "${rel_dockerfiles[@]}"; do echo "  $d"; done
