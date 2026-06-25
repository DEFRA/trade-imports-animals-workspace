#!/bin/bash
# Step 0 dispatcher — fetch tickets completed in the last N days from Jira and
# seed (or idempotently merge into) the show-and-tell state file.
#
# Usage:
#   start-show-and-tell.sh [--run-id <id>] [--days N]
#
# --run-id  Defaults to today's date (YYYY-MM-DD). Pass an explicit id to
#           re-open a prior fortnight's state.
# --days    Look-back window in days (default 14 — "the last two weeks").
#
# Re-running is idempotent: tickets are re-fetched from the live window, but
# any bucket / benefit already set on a ticket (by the walker) is preserved.
# State: workareas/show-and-tell/<id>/state.json (atomic write).

set -e

RUN_ID=""
DAYS=14

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        --days) DAYS="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && RUN_ID=$(date +%F)

PROJECT="${JIRA_PROJECT_KEY:-EUDPA}"
WORKDIR="$HOME/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/$RUN_ID"
STATE="$WORKDIR/state.json"
RAW="$WORKDIR/.jira.json"
mkdir -p "$WORKDIR"

FROM=$(date -v-"${DAYS}"d +%F 2>/dev/null || date -d "-${DAYS} days" +%F)
TO=$(date +%F)
CREATED=$(date -u +%FT%TZ)
JQL="project = $PROJECT AND status = Done AND resolutiondate >= -${DAYS}d ORDER BY resolutiondate DESC"

echo "Fetching '$PROJECT' tickets resolved in the last $DAYS days ($FROM → $TO)..." >&2
"$HOME/git/defra/trade-imports-animals-workspace/tools/jira/search.sh" \
    "$JQL" json \
    --fields "summary,status,issuetype,labels,parent,resolutiondate,customfield_10008" \
    > "$RAW"

NEW=$(jq '[.issues[] | {
    key: .key,
    summary: .fields.summary,
    type: .fields.issuetype.name,
    status: .fields.status.name,
    resolved: (if .fields.resolutiondate == null then null else .fields.resolutiondate[0:10] end),
    labels: (.fields.labels // []),
    parent: ((.fields.parent.key // .fields.customfield_10008) // null),
    bucket: null,
    benefit: null
}]' "$RAW")

OLD='[]'
[[ -f "$STATE" ]] && OLD=$(jq '.items // []' "$STATE")

MERGED=$(jq -n --argjson new "$NEW" --argjson old "$OLD" '
    ($old | map({key: .key, value: {bucket: .bucket, benefit: .benefit}}) | from_entries) as $idx
    | [ $new | to_entries[] | .value + {
          id: (.key + 1),
          bucket: ($idx[.value.key].bucket // .value.bucket),
          benefit: ($idx[.value.key].benefit // .value.benefit)
      } ]
')

jq -n \
    --argjson items "$MERGED" \
    --arg id "$RUN_ID" --arg created "$CREATED" \
    --arg from "$FROM" --arg to "$TO" --arg jql "$JQL" '{
    id: $id,
    created_at: $created,
    window: { from: $from, to: $to, jql: $jql },
    buckets: {
        UJ: "User Journey / Skeleton",
        IA: "Integration / Architecture",
        TD: "Technical / Delivery enablers"
    },
    items: $items
}' > "$STATE.tmp" && mv "$STATE.tmp" "$STATE"

TOTAL=$(jq '.items | length' "$STATE")
UNCLASSIFIED=$(jq '[.items[] | select(.bucket == null)] | length' "$STATE")

echo "Seeded $STATE" >&2
echo "  tickets: $TOTAL  (unclassified: $UNCLASSIFIED)"
echo "  window:  $FROM → $TO"
