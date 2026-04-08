#!/bin/bash
# List govuk-frontend version upgrade planning status across repos
# Usage: ./list-plans.sh --run-id TICKET [--repo REPO_NAME] [--json]
#
# Shows which versions are unplanned (zero-byte stub), .todo (changes needed),
# or .noop (no changes needed) for each repo.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$(dirname "$TOOLS_DIR")"
AGENTS_DIR="$(dirname "$SKILLS_DIR")"

RUN_ID=""
REPO_FILTER=""
JSON_OUTPUT=false

show_help() {
    cat << EOF
List govuk-frontend version upgrade planning status

Usage: ./list-plans.sh --run-id TICKET [options]

Options:
  --run-id TICKET        Run ID / Jira ticket (e.g. EUDPA-20578) [required]
  --repo REPO_NAME       Only show specific repo
  --json                 Output JSON format
  --help                 Show this help message

Examples:
  ./list-plans.sh --run-id EUDPA-20578
  ./list-plans.sh --run-id EUDPA-20578 --repo trade-imports-animals-frontend
  ./list-plans.sh --run-id EUDPA-20578 --json

Output states:
  unplanned  zero-byte .md stub — not yet analysed
  todo       .todo file — code changes required
  noop       .noop file — no changes needed for this version
EOF
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help) show_help ;;
        --run-id) RUN_ID="$2"; shift 2 ;;
        --repo) REPO_FILTER="$2"; shift 2 ;;
        --json) JSON_OUTPUT=true; shift ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

[[ -z "$RUN_ID" ]] && error "--run-id TICKET is required"

WORKSPACE_BASE="$AGENTS_DIR/workareas/govuk-upgrades/$RUN_ID"

if [[ ! -d "$WORKSPACE_BASE" ]]; then
    error "Workspace not found: $WORKSPACE_BASE. Run discover-versions.sh first."
fi

total_unplanned=0
total_todo=0
total_noop=0

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo "{"
    echo "  \"run_id\": \"$RUN_ID\","
    echo "  \"repos\": ["
    first_repo=true
fi

for repo_dir in "$WORKSPACE_BASE"/trade-imports-animals-*; do
    [[ ! -d "$repo_dir" ]] && continue
    repo_name=$(basename "$repo_dir")
    [[ -n "$REPO_FILTER" ]] && [[ "$repo_name" != "$REPO_FILTER" ]] && continue

    unplanned_list=()
    todo_list=()
    noop_list=()

    # Zero-byte .md stubs = unplanned
    while IFS= read -r -d '' f; do
        v=$(basename "$f" .md | sed 's/^version__//')
        unplanned_list+=("$v")
    done < <(find "$repo_dir" -maxdepth 1 -name "version__*.md" -size 0 -print0 2>/dev/null | sort -z -V)

    # .todo files = changes needed
    while IFS= read -r -d '' f; do
        v=$(basename "$f" .todo | sed 's/^version__//')
        todo_list+=("$v")
    done < <(find "$repo_dir" -maxdepth 1 -name "version__*.todo" -print0 2>/dev/null | sort -z -V)

    # .noop files = no changes needed
    while IFS= read -r -d '' f; do
        v=$(basename "$f" .noop | sed 's/^version__//')
        noop_list+=("$v")
    done < <(find "$repo_dir" -maxdepth 1 -name "version__*.noop" -print0 2>/dev/null | sort -z -V)

    ((total_unplanned+=${#unplanned_list[@]}))
    ((total_todo+=${#todo_list[@]}))
    ((total_noop+=${#noop_list[@]}))

    # Read meta for current/target
    current=""
    target=""
    if [[ -f "$repo_dir/.upgrade-meta.json" ]]; then
        current=$(jq -r '.current_version // ""' "$repo_dir/.upgrade-meta.json" 2>/dev/null || echo "")
        target=$(jq -r '.target_version // ""' "$repo_dir/.upgrade-meta.json" 2>/dev/null || echo "")
    fi

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        [[ "$first_repo" == "true" ]] && first_repo=false || echo ","
        unplanned_json=$(printf '%s\n' "${unplanned_list[@]+"${unplanned_list[@]}"}" | jq -R . | jq -s .)
        todo_json=$(printf '%s\n' "${todo_list[@]+"${todo_list[@]}"}" | jq -R . | jq -s .)
        noop_json=$(printf '%s\n' "${noop_list[@]+"${noop_list[@]}"}" | jq -R . | jq -s .)
        echo -n "    {\"repo\": \"$repo_name\", \"current\": \"$current\", \"target\": \"$target\","
        echo -n " \"unplanned\": $unplanned_json, \"todo\": $todo_json, \"noop\": $noop_json}"
    else
        echo ""
        echo "$repo_name  ($current → $target)"
        printf "  Unplanned: %3d  |  Todo: %3d  |  Noop: %3d\n" \
            "${#unplanned_list[@]}" "${#todo_list[@]}" "${#noop_list[@]}"
        if [[ "${#unplanned_list[@]}" -gt 0 ]]; then
            echo "  Unplanned:  ${unplanned_list[*]}"
        fi
        if [[ "${#todo_list[@]}" -gt 0 ]]; then
            echo "  Todo:       ${todo_list[*]}"
        fi
        if [[ "${#noop_list[@]}" -gt 0 ]]; then
            echo "  Noop:       ${noop_list[*]}"
        fi
    fi
done

if [[ "$JSON_OUTPUT" == "true" ]]; then
    echo ""
    echo "  ],"
    echo "  \"summary\": {"
    echo "    \"unplanned\": $total_unplanned,"
    echo "    \"todo\": $total_todo,"
    echo "    \"noop\": $total_noop"
    echo "  }"
    echo "}"
else
    echo ""
    echo "=== Summary ==="
    echo "  Unplanned:         $total_unplanned"
    echo "  Todo (changes):    $total_todo"
    echo "  Noop (no changes): $total_noop"
fi
