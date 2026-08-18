#!/bin/bash
# Record a ruling on a gated increment, or attach a revalidation note to any increment.
#
#   accept    — the gap is real and should be built. Unblocks it: blocked -> todo,
#               gate cleared, so the build loop will pop it.
#   reject    — the frontend is right, or the difference does not matter. Terminal
#               status "dropped"; the item stays in the backlog as a recorded decision
#               rather than vanishing, so nobody re-raises it next time the corpus runs.
#   defer     — not now. Stays blocked, but marked decided so the walker moves past it.
#   falsified — the finding's own FALSIFIED BY condition has since fired: one of the two
#               codebases moved and closed the gap. Terminal status "dropped", but kept
#               distinct from reject so the ledger never credits a person with a ruling
#               the evidence made on its own. Cite the commit in the note.
#   note      — no ruling, no status change. Appends a timestamped note to the increment,
#               for when a codebase has moved enough to change the reasoning behind a
#               finding without closing the gap it describes.
#
# Every ruling and every note takes --note. A ruling without a reason is worth very
# little three months later, and this backlog is meant to outlive the conversation
# that made it.
#
# Usage:
#   rule-decision.sh EUDPA-X inc-042 accept    --note "Germinals are in scope for R2."
#   rule-decision.sh EUDPA-X inc-042 reject    --note "Prototype defect, raised with design."
#   rule-decision.sh EUDPA-X inc-042 defer     --note "Revisit after the address-book work."
#   rule-decision.sh EUDPA-X inc-042 falsified --note "Closed by frontend 662dd323."
#   rule-decision.sh EUDPA-X inc-042 note      --note "Premise moved: see 662dd323."

set -e

WORKSPACE="$HOME/git/defra/trade-imports-animals-workspace"

RUN_ID=""; INC_ID=""; RULING=""; NOTE=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        EUDPA-*) RUN_ID="$1"; shift ;;
        inc-*) INC_ID="$1"; shift ;;
        accept|reject|defer|falsified|note) RULING="$1"; shift ;;
        --note) NOTE="$2"; shift 2 ;;
        *) echo "Unknown arg: $1" >&2; exit 1 ;;
    esac
done

[[ -z "$RUN_ID" || -z "$INC_ID" || -z "$RULING" ]] && {
    echo "Usage: $0 EUDPA-X inc-NNN accept|reject|defer|falsified|note --note \"why\"" >&2; exit 1; }
[[ -z "$NOTE" ]] && { echo "Error: --note is required. Record why, not just what." >&2; exit 1; }

target="$WORKSPACE/workareas/journey-builder/$RUN_ID/backlog.json"
[[ -f "$target" ]] || { echo "Error: $target not found" >&2; exit 1; }

jq -e --arg id "$INC_ID" '[.increments[] | select(.id == $id)] | length == 1' "$target" >/dev/null || {
    echo "Error: $INC_ID not found in $RUN_ID" >&2; exit 1; }

ruled_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
tmp="$(mktemp)"

if [[ "$RULING" == "note" ]]; then
    jq --arg id "$INC_ID" --arg note "$NOTE" --arg at "$ruled_at" '
        .increments |= map(
            if .id == $id then .notes = ((.notes // []) + [{ note: $note, at: $at }])
            else . end
        )' "$target" > "$tmp"
    mv "$tmp" "$target"
    echo "$INC_ID: note attached, status unchanged"
    echo "  $NOTE"
    exit 0
fi

case "$RULING" in
    accept)    new_status="todo";    clear_gate=true  ;;
    reject)    new_status="dropped"; clear_gate=false ;;
    defer)     new_status="blocked"; clear_gate=false ;;
    falsified) new_status="dropped"; clear_gate=false ;;
esac

jq --arg id "$INC_ID" \
   --arg status "$new_status" \
   --arg ruling "$RULING" \
   --arg note "$NOTE" \
   --arg at "$ruled_at" \
   --argjson clear "$clear_gate" '
    .increments |= map(
        if .id == $id then
            .status = $status
            | .decision = { ruling: $ruling, note: $note, ruledAt: $at }
            | if $clear then .gate = null else . end
        else . end
    )' "$target" > "$tmp"

mv "$tmp" "$target"

echo "$INC_ID: $RULING -> status=$new_status$( [[ "$clear_gate" == true ]] && echo ", gate cleared" )"
echo "  $NOTE"
