#!/bin/bash
# Derive backlog.json (typed, ordered increments) from journey-spec.json.
#
# Rules (encoded here, not left to agent judgment):
#   - one increment per spec page, in section order (linear dependsOn chain —
#     increments edit shared files so the loop is serial by design)
#   - type add-collection when the page collects a collection obligation,
#     else add-page
#   - milestone: M0 = the origin section's first page; M2 = pages whose
#     obligations (incl. transitive collection members) carry modelGap;
#     M1 = everything else
#   - a model-extension increment (gate: sam) precedes the first page that
#     needs each distinct modelGap
#   - after all spec pages: one remove-car-section increment per baseline
#     car-insurance section (vendored obligations-v2 domain), then a final
#     repoint-test-fixtures increment (see PROVENANCE.md)
#
# Idempotent: statuses/commits of existing increments are preserved by id;
# regeneration only adds/updates definitions.
#
# Usage:
#   backlog-generate.sh EUDPA-X [--json]

set -e

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"

RUN_ID=""; AS_JSON=false
while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) RUN_ID="$1"; shift ;;
        --json) AS_JSON=true; shift ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done
[[ -z "$RUN_ID" ]] && { echo "Usage: $0 EUDPA-X [--json]" >&2; exit 1; }

WORKAREA="$WORKSPACE/workareas/journey-builder/$RUN_ID"
meta="$WORKAREA/.digest-meta.json"
[[ -f "$meta" ]] || { echo "Error: $meta not found" >&2; exit 1; }
spec="$(jq -r '.spec_dir' "$meta")/journey-spec.json"
target="$WORKAREA/backlog.json"

# Baseline car-insurance sections to remove once the spec journey is in —
# the section ids in the vendored flow/flow.js (see live-animals/PROVENANCE.md).
CAR_SECTIONS='["email","about-you-and-your-vehicle","your-driving-and-cover","add-to-your-policy","named-driver","modifications","protected-ncd","get-your-quote"]'

existing='{"increments":[]}'
[[ -f "$target" ]] && existing=$(cat "$target")

jq -n \
    --slurpfile s "$spec" \
    --argjson carSections "$CAR_SECTIONS" \
    --argjson existing "$existing" \
    --arg run_id "$RUN_ID" \
    '
    $s[0] as $spec
    | ($spec.obligations | map({key: .id, value: .}) | from_entries) as $byId
    # transitive obligation closure for a page: collects + item members (depth 2)
    | def closure($ids):
        [ $ids[] as $id
          | $byId[$id]
          | ., (.item // [])[] as $m | $byId[$m]
          | ., ((.item // [])[] as $mm | $byId[$mm])
        ] | map(select(. != null)) | unique_by(.id);
    # flatten pages in section order
    | [ $spec.sections[] as $sec | $sec.pages[] | {section: $sec.id, page: .} ] as $pages
    | [ $pages[]
        | . as $p
        | (closure($p.page.collects)) as $obs
        | ($obs | map(select(.modelGap != null) | .modelGap) | unique) as $gaps
        | {
            type: (if ($obs | any(.kind == "collection")) then "add-collection" else "add-page" end),
            section: $p.section,
            page: $p.page.id,
            slug: $p.page.slug,
            obligations: $p.page.collects,
            gaps: $gaps,
            milestone: (if $p.section == "origin" then "M0" elif ($gaps | length) > 0 then "M2" else "M1" end)
          }
      ] as $pageIncs
    # inject model-extension increments before first user of each gap
    | ( [ $pageIncs[] | .gaps[] ] | unique ) as $allGaps
    | [ $pageIncs[]
        | . as $inc
        | ( if ($inc.gaps | length) > 0 then
              [ $inc.gaps[] | {type: "model-extension", gap: ., milestone: "M2", gate: "sam"} ] + [$inc]
            else [$inc] end )
        | .[]
      ]
    # dedupe model-extension by gap, keeping first occurrence
    | reduce .[] as $inc ([]; if $inc.type == "model-extension" and ([.[] | select(.type == "model-extension" and .gap == $inc.gap)] | length) > 0 then . else . + [$inc] end)
    # car-domain removal tail
    + [ $carSections[] | {type: "remove-car-section", section: ., milestone: "M1", gate: null} ]
    + [ {type: "repoint-test-fixtures", milestone: "M1",
         detail: "Re-point engine/test-support fixtures (seedNamedDriver etc.) and root model tests at the live-animals domain (commodityLines/animalIdentifiers)."} ]
    # number + linear chain + merge preserved status
    | to_entries
    | map(
        (.key + 1) as $n
        | ("inc-" + ($n | tostring | if length < 3 then ("0" * (3 - length)) + . else . end)) as $id
        | .value
        + { id: $id,
            dependsOn: (if .key == 0 then [] else ["inc-" + (($n - 1) | tostring | if length < 3 then ("0" * (3 - length)) + . else . end)] end) }
        | (first($existing.increments[]? | select(.id == $id)) // null) as $prev
        | . + { status: ($prev.status // "todo"), commit: ($prev.commit // null), failure_reason: ($prev.failure_reason // null) }
        # a gated increment starts blocked until the gate is cleared
        | if (.gate == "sam" and .status == "todo") then .status = "blocked" else . end
      )
    | { schema_version: 1, run_id: $run_id, increments: . }
    ' > "$target.tmp" && mv "$target.tmp" "$target"

if [[ "$AS_JSON" == true ]]; then
    cat "$target"
else
    jq -r '.increments | group_by(.milestone) | map("\(.[0].milestone): \(length) increments") | join(", ")' "$target"
    jq -r '.increments[] | "\(.id) [\(.milestone)] \(.type) \(.page // .section // .gap // "") (\(.status))"' "$target"
fi
