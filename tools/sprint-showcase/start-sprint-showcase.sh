#!/bin/bash
# Resolve the showcase window (date range only — this board has no
# sprints), find the Done tickets that transitioned to Done in the
# window team-wide, plus the git commits across the workspace and
# repos/ that reference them, and seed state.json.
# Prints the resolved --run-id, the window, and tickets found: <N>.
#
# Usage:
#   start-sprint-showcase.sh --from 2026-06-09 --to 2026-06-22
#   start-sprint-showcase.sh                 # defaults to the last 14 days
#
# Atomic mutations: write to .tmp then mv.

set -e

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"
JIRA_SEARCH="$WORKSPACE/tools/jira/search.sh"

FROM=""
TO=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --from) FROM="$2"; shift 2 ;;
        --to) TO="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//' >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

# 1. Resolve window. Default: last 14 days (to=today, from=today-14d).
[[ -z "$TO" ]] && TO=$(date +%Y-%m-%d)
[[ -z "$FROM" ]] && FROM=$(date -v-14d -j -f %Y-%m-%d "$TO" +%Y-%m-%d)

# JQL date upper bounds are EXCLUSIVE — query with to + 1 day.
TO_PLUS1=$(date -v+1d -j -f %Y-%m-%d "$TO" +%Y-%m-%d)

ID="${FROM}_${TO}"
RUN_DIR="$WORKSPACE/workareas/sprint-showcase/$ID"
mkdir -p "$RUN_DIR"

# 2. Query Jira for tickets that transitioned to Done in the window.
JQL="project = EUDPA AND status changed TO Done DURING (\"$FROM\", \"$TO_PLUS1\")"
echo "JQL: $JQL" >&2

ISSUES_JSON=$(bash "$JIRA_SEARCH" "$JQL" json --fields "summary,status,issuetype")

# Normalise into a {key,title,type,status} array.
TICKETS=$(echo "$ISSUES_JSON" | jq '[.issues[] | {
    key: .key,
    title: .fields.summary,
    type: .fields.issuetype.name,
    status: "Done"
}]')

# 3. Crawl git for commits in the window across the workspace repo
#    itself AND every repos/* dir. Build a JSON map of key -> {shas, repos}.
REPO_DIRS=("$WORKSPACE")
for d in "$WORKSPACE"/repos/*/; do
    [[ -d "$d/.git" || -d "$d/.git" || -e "$d/.git" ]] && REPO_DIRS+=("${d%/}")
done

# Collect commits: emit "<repo_basename>\t<sha>\t<subject>" per line.
COMMITS_TSV=$(mktemp)
ALL_REPOS_WITH_COMMITS=$(mktemp)
trap 'rm -f "$COMMITS_TSV" "$ALL_REPOS_WITH_COMMITS"' EXIT

for repo in "${REPO_DIRS[@]}"; do
    [[ -d "$repo/.git" ]] || git -C "$repo" rev-parse --git-dir >/dev/null 2>&1 || continue
    repo_name=$(basename "$repo")
    lines=$(git -C "$repo" log --all --no-merges \
        --since="$FROM 00:00" --until="$TO 23:59" \
        --date=short --pretty="format:%h%x09%s" 2>/dev/null || true)
    if [[ -n "$lines" ]]; then
        while IFS=$'\t' read -r sha subject; do
            [[ -z "$sha" ]] && continue
            printf '%s\t%s\t%s\n' "$repo_name" "$sha" "$subject" >> "$COMMITS_TSV"
        done <<< "$lines"
        # Record this repo as one that had in-window commits.
        echo "$repo_name" >> "$ALL_REPOS_WITH_COMMITS"
    fi
done

# Build a per-key aggregation of commit shas + repos via jq, keyed by
# the [A-Z]{2,}-[0-9]+ references found in each commit subject.
# Each commit can reference multiple keys.
COMMIT_KEY_MAP=$(jq -Rn '
    [ inputs
      | split("\t")
      | { repo: .[0], sha: .[1], subject: (.[2] // "") }
      | . as $c
      | ($c.subject | [scan("[A-Z]{2,}-[0-9]+")]) as $keys
      | $keys[] | { key: ., repo: $c.repo, sha: $c.sha }
    ]' "$COMMITS_TSV")

# All repos that had any in-window commit, sorted unique.
REPOS_ALL=$(sort -u "$ALL_REPOS_WITH_COMMITS" | jq -Rn '[inputs | select(length > 0)]')

# 4. Compose final tickets[] — attach commit_shas + repos per key, seed
#    analyst fields null, and assemble the full state object.
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

STATE=$(jq -n \
    --arg id "$ID" \
    --arg created_at "$NOW" \
    --arg from "$FROM" \
    --arg to "$TO" \
    --argjson tickets "$TICKETS" \
    --argjson commit_map "$COMMIT_KEY_MAP" \
    --argjson repos "$REPOS_ALL" \
    '
    # group commit refs by key
    ($commit_map | group_by(.key) | map({ (.[0].key): {
        shas: (map(.sha) | unique),
        repos: (map(.repo) | unique)
    }}) | add // {}) as $byKey
    |
    {
        id: $id,
        created_at: $created_at,
        scope: { from: $from, to: $to },
        repos: $repos,
        tickets: ($tickets | map(
            . as $t
            | ($byKey[$t.key] // { shas: [], repos: [] }) as $cm
            | {
                key: $t.key,
                title: $t.title,
                type: $t.type,
                status: $t.status,
                repos: $cm.repos,
                commit_shas: $cm.shas,
                context_baked: false,
                category: null,
                headline: null,
                user_benefit: null,
                evidence: null,
                confidence: null,
                analyzed_at: null
            }
        )),
        narrative: { intro: null, velocity_summary: null, closing: null }
    }')

# Write state.json atomically.
TMP="$RUN_DIR/state.json.tmp"
echo "$STATE" | jq '.' > "$TMP"
mv "$TMP" "$RUN_DIR/state.json"

# 5. Report.
N=$(echo "$STATE" | jq '.tickets | length')
echo "--run-id $ID"
echo "window: $FROM .. $TO (Jira queried to $TO_PLUS1, exclusive upper bound)"
echo "tickets found: $N"
