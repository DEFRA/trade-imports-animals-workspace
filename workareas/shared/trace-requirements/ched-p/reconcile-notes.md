# Notes for Reconcile / SPEC-GATE verification (CHED-P)

## Inspector review-page over-split (dedup at Reconcile)
The Comb wave found that several inventory "pages" in the inspector decision app all resolve to the
SAME rendered page — `/decision/vnet/protected/bip-notifications/{chedRef}/review`, H1
"… - V1 Review outcome decision", pageTitle "Review assessment - …GOV.UK":
- `decision-datetime-submit` (evidence 94d29a16 action 210) — review page tail: "Date and time of
  checks" + declaration radio + "Submit decision".
- `decision-redispatch-deadline` (evidence 189085ad action 203 + b33079fe action 220) — BOTH land on
  the review page; NO standalone `/re-dispatch` page appears in either trace. Marked `confidence: gap`.
  The review page's Decision-information table renders "Refusal decision = Re-dispatching" and a
  "Refusal by date" row, but the value cell is EMPTY — cannot identify the date/time inputs as the
  re-dispatch deadline without inventing semantics.

**Ruling to make at Reconcile:** consolidate these into the single inspector Review/decision page,
OR keep them as facets but mark the re-dispatch-deadline page a `needsHuman` gap (does a standalone
re-dispatch deadline page exist? not in this corpus). Corroborate should check the QA page-objects for
a RedispatchDeadline/RefusalBy page object to settle whether the page exists at all.

## clone-search (out-of-scope candidate — confirmed broken)
`clone-search` (a8789bde action 18): the "Certificate details" search form renders, but the Clone
action never completes — HTTP 406 "Unable to clone". Confirms the CHED-PP-precedent out-of-scope
ruling. Carry as a scope conflict (`needsHuman` or ruled OUT) in conflicts.json.

## contact-address wrong-page fix (Verify self-healed)
Verify flagged `contact-address` as `unsound`: it had been mined as the wrong page ("Add branch
address") and was REPLACED in place with the correct page — "Contact address for consignment", the
address-SELECTION page (16 radios of existing addresses + an add-new link). It is now confidence
`confirmed`. Distinct from `branch-address-creation` (the add-new address FORM). Keep both; do not
treat as duplicates.

## Fish / IUU boundary
See `iuu-boundary-findings.md`. At Reconcile/SPEC-GATE ensure the catch-cert pages
(catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details) + HS ch.03
commodity codes + Anguilla species are flagged IUU (moved to IUU), NOT CHED-P requirements. Fish trace
db2d277c to be dropped from the final CHED-P journey set.
