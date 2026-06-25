#!/bin/bash
# Render state.json into the three show-and-tell slides as markdown.
# Writes workareas/show-and-tell/<id>/slides.md and prints its path.
#
# Slides:
#   1. Progress Summary           — ticket count per bucket
#   2. Completed Work Items        — tickets listed under each bucket
#   3. Improving how the team      — plain-English benefits for the
#      delivers                      Technical / Delivery enablers bucket
#
# Usage:
#   render-slides.sh --run-id <id>

set -e

RUN_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

WORKDIR="$HOME/git/defra/trade-imports-animals-workspace/workareas/show-and-tell/$RUN_ID"
STATE="$WORKDIR/state.json"
OUT="$WORKDIR/slides.md"
[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

jq -r '
    .window as $w
    | .buckets as $labels
    | .items as $items
    | def bucket_count($code): [ $items[] | select(.bucket == $code) ] | length;
      def bucket_items($code): [ $items[] | select(.bucket == $code) ];

      "# Show & Tell — \($w.from) → \($w.to)",
      "",
      "## Progress Summary",
      "",
      "_Tickets completed in the last two weeks (\($w.from) → \($w.to))._",
      "",
      ( $labels | to_entries[]
        | "- **\(.value):** \(bucket_count(.key))" ),
      "- **Total:** \($items | length)",
      "",
      "## Completed Work Items",
      "",
      ( $labels | to_entries[] | .key as $code |
        ( "### \(.value)",
          "",
          ( if (bucket_items($code) | length) == 0 then "- _(none)_"
            else (bucket_items($code)[] | "- **\(.key)** — \(.summary)")
            end ),
          "" ) ),
      "## Improving how the team delivers",
      "",
      "_What the Technical / Delivery enablers work means for the team, in plain terms._",
      "",
      ( bucket_items("TD") as $td
        | if ($td | length) == 0 then "- _(no technical / delivery enablers this period)_"
          else ($td[] | "- **\(.key)** — \(.benefit // "_(benefit not yet written)_")")
          end )
' "$STATE" > "$OUT.tmp" && mv "$OUT.tmp" "$OUT"

echo "$OUT"
