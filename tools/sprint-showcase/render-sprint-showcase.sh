#!/bin/bash
# Render state.json into the two derived artifacts the deck build
# consumes:
#   - deck-spec.json  structured input for `tim deck generate`
#                     (title/subtitle/sections[]/summary; sections only
#                     for non-empty categories, in fixed order
#                     NEW_FEATURE -> IMPROVEMENT -> BUG_FIX ->
#                     QUALITY_OR_VELOCITY).
#   - deck.md         human-readable mirror the user eyeballs before
#                     building the .pptx.
#
# High+medium-confidence tickets become individual bullets; low-confidence
# tickets (and, when a category has more than 5 tickets, the smallest
# overflow) are rolled up into the section's aggregate_note.
#
# Usage:
#   render-sprint-showcase.sh --run-id <id>
#
# Read-only over state.json; writes the derived deck.md + deck-spec.json.
# Atomic writes: jq ... > tmp; mv tmp file.

set -e

RUN_ID=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --run-id) RUN_ID="$2"; shift 2 ;;
        -h|--help)
            sed -n '2,21p' "$0" >&2
            exit 0 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" ]] && { echo "Missing --run-id" >&2; exit 1; }

RUN_DIR="$HOME/git/defra/trade-imports-animals-workspace/workareas/sprint-showcase/$RUN_ID"
STATE="$RUN_DIR/state.json"
SPEC="$RUN_DIR/deck-spec.json"
DECK="$RUN_DIR/deck.md"

[[ -f "$STATE" ]] || { echo "State not found: $STATE" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Build deck-spec.json.
#
# jq does all the work so the ordering/aggregation rules live in one place:
#   - $ORDER fixes the category sequence; we walk it and keep only those
#     with >=1 analysed ticket.
#   - within a category, sort high > medium > low, keep up to MAX_BULLETS
#     as individual bullets, roll the rest (plus all low-confidence) into
#     aggregate_note.
#   - subtitle dates are formatted readably (e.g. "9-22 Jun 2026").
# ---------------------------------------------------------------------------

MAX_BULLETS=5

SPEC_TMP=$(mktemp)
jq \
    --argjson max "$MAX_BULLETS" \
    '
    # Fixed category order + fixed heading/lead strings.
    def order: ["NEW_FEATURE","IMPROVEMENT","BUG_FIX","QUALITY_OR_VELOCITY"];
    def heading($c):
        {NEW_FEATURE:"New features",
         IMPROVEMENT:"Improvements",
         BUG_FIX:"Reliability fixes",
         QUALITY_OR_VELOCITY:"Quality & delivery"}[$c];
    def lead($c):
        {NEW_FEATURE:"What the product can now do",
         IMPROVEMENT:"Existing things made easier and faster",
         BUG_FIX:"Things that now work as they should",
         QUALITY_OR_VELOCITY:"Work that lets us ship faster and more safely"}[$c];
    def confrank: {high:0, medium:1, low:2}[.confidence] // 3;
    # Aggregate-note noun (singular/plural) per category, e.g.
    # "plus 6 further reliability fixes" / "plus 1 further reliability fix".
    def aggnoun($c; $n):
        {NEW_FEATURE:["new feature","new features"],
         IMPROVEMENT:["improvement","improvements"],
         BUG_FIX:["reliability fix","reliability fixes"],
         QUALITY_OR_VELOCITY:["quality / delivery item","quality / delivery items"]}[$c]
        | if $n == 1 then .[0] else .[1] end;

    # Month-name short form for date formatting.
    def monthname($m):
        ["Jan","Feb","Mar","Apr","May","Jun",
         "Jul","Aug","Sep","Oct","Nov","Dec"][($m|tonumber) - 1];

    # Human-readable subtitle from scope.from / scope.to.
    # Same year/month  -> "9-22 Jun 2026"
    # Same year        -> "9 Jun - 3 Jul 2026"
    # Else             -> "9 Jun 2026 - 3 Jan 2027"
    def fmtdate($d): ($d | split("-")) as $p
        | {y:$p[0], m:$p[1], d:($p[2]|tonumber|tostring)};
    def subtitle:
        (.scope.from | fmtdate(.)) as $f
        | (.scope.to | fmtdate(.)) as $t
        | (if $f.y == $t.y and $f.m == $t.m
              then "\($f.d)–\($t.d) \(monthname($t.m)) \($t.y)"
           elif $f.y == $t.y
              then "\($f.d) \(monthname($f.m)) – \($t.d) \(monthname($t.m)) \($t.y)"
           else "\($f.d) \(monthname($f.m)) \($f.y) – \($t.d) \(monthname($t.m)) \($t.y)"
           end);

    # Only analysed tickets with a category participate.
    [.tickets[] | select(.category != null and .analyzed_at != null)] as $analysed
    | .narrative as $narr

    # Per-category counts (all analysed tickets, including low / rolled-up).
    | (reduce $analysed[] as $t ({}; .[$t.category] = ((.[$t.category] // 0) + 1))) as $counts

    # Build one section per non-empty category, in fixed order.
    | [ order[] as $c
        | ([$analysed[] | select(.category == $c)]) as $inCat
        | select(($inCat | length) > 0)
        | ($inCat | sort_by(confrank)) as $sorted
        # Eligible for an individual bullet: high or medium confidence.
        | ([$sorted[] | select(.confidence == "high" or .confidence == "medium")]) as $eligible
        # Keep up to $max as bullets; everything else rolls up.
        | ($eligible[0:$max]) as $bulleted
        | (($eligible[$max:]) + [$sorted[] | select(.confidence == "low")]) as $rolled
        | {
            category: $c,
            heading: heading($c),
            lead: lead($c),
            bullets: [ $bulleted[] | {headline, benefit: .user_benefit, confidence} ]
          }
        # aggregate_note only when something was rolled up.
        + (if ($rolled | length) > 0
           then {aggregate_note:
                   ("plus \($rolled | length) further "
                    + aggnoun($c; ($rolled | length)))}
           else {} end)
      ]                                                           as $sections

    # Summary block. Fall back to generated text when narrative is null.
    | (($narr.intro)
       // ("Completed work across "
           + ([order[] | select(($counts[.] // 0) > 0)] | length | tostring)
           + " theme(s) this period")) as $headline
    | (($narr.velocity_summary)
       // (([$counts | to_entries[] | .value] | add // 0 | tostring)
           + " items delivered")) as $velocity

    | {
        title: "EUDP Live Animals — Sprint Showcase",
        subtitle: subtitle,
        sections: $sections,
        summary: (
            { headline: $headline,
              counts: (reduce order[] as $c ({}; .[$c] = ($counts[$c] // 0))),
              velocity_summary: $velocity }
            + (if $narr.closing != null then {closing: $narr.closing} else {} end)
        )
      }
    ' "$STATE" > "$SPEC_TMP"
mv "$SPEC_TMP" "$SPEC"

# Did the narrative drive the summary, or did we fall back?
NARRATIVE_SET=$(jq -r '
    if (.narrative.intro != null and .narrative.velocity_summary != null)
    then "yes" else "no" end' "$STATE")

# ---------------------------------------------------------------------------
# Build deck.md — a readable mirror of deck-spec.json.
# ---------------------------------------------------------------------------

DECK_TMP=$(mktemp)
{
    jq -r '"# " + .title' "$SPEC"
    echo
    jq -r '"_" + .subtitle + "_"' "$SPEC"
    echo

    if [[ "$NARRATIVE_SET" == "no" ]]; then
        echo "> Note: narrative is unset in state.json — the summary below uses generated fallback text."
        echo
    fi

    # One block per section.
    jq -r '
        .sections[] |
        "## " + .heading,
        "",
        "> " + .lead,
        "",
        ( .bullets[] |
            "- **" + .headline + "** — " + .benefit + " (" + .confidence + ")" ),
        ( if (.aggregate_note // "") != ""
          then ["", "_" + .aggregate_note + "_"] | .[]
          else empty end ),
        ""
    ' "$SPEC"

    # Summary section.
    jq -r '
        "## Summary",
        "",
        .summary.headline,
        "",
        "**Counts**",
        ( .summary.counts | to_entries[] | "- " + .key + ": " + (.value|tostring) ),
        "",
        "**Velocity**",
        "",
        .summary.velocity_summary,
        ( if (.summary.closing // "") != ""
          then ["", "**Looking ahead**", "", .summary.closing] | .[]
          else empty end )
    ' "$SPEC"
} > "$DECK_TMP"
mv "$DECK_TMP" "$DECK"

echo "$SPEC"
echo "$DECK"
