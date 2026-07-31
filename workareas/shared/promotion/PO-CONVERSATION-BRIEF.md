# PO / Paul conversation brief — live-animals promotion open items

Assembled 2026-07-24 for Sam to take to the PO (and Paul, where noted). Every
item below is **blocked on someone other than the build loop** — either a V4
spec/page defect the PO owns, or a payload/contract change the PO + backend must
sign off. None needs a code change from the promotion loop right now; each has a
recorded interim behaviour that stands until the PO rules.

Source of truth: `BACKLOG.json` (ids in brackets). V4 = Confluence "Live Animals
Data Fields V4", page 6497338582.

---

## A. V4 page defects / unresolved conflicts (need a PO ruling on the spec)

### A1 — contactAddress has two V4 variants that share one anchor  [p-207, was c-001]
**V4 says:** Contact Address appears as **two** table rows under the same anchor
`#contact_address`:
1. consumed from **gov.identity** (Mandatory "‑", "if more than one address
   exists the user must select one before continuing"), and
2. **user-created** via the Standard Address Block (Mandatory to proceed).

How the two interact is unspecified.
**Prototype does today:** models a single `contactAddress` obligation as
**select-or-create** (pick an existing address, or add one via the shared
Standard Address Block form).
**Ask the PO:** is select-or-create the intended reading? Specifically — when
gov.identity supplies one or more addresses, does the user *pick* one (and can
they still *create* a new one), or are these two genuinely different fields? A
clarified V4 row would close this.

### A2 — V4 example value contradicts its own pattern  [p-208, was c-024]
**V4 says:** internal reference number example value is **`Imports456_GB`** — but
the stated pattern is **alphanumeric** (no underscore), which rejects that
example.
**Prototype does today:** follows the stated alphanumeric pattern; fixtures are
underscore-free. (Note: p-005 separately ratified the prototype's required/max-58
rule — that part is settled; this item is only the example-vs-pattern defect.)
**Ask the PO:** which is authoritative — fix the **example**, or widen the
**pattern** to allow `_`? Straightforward V4 page correction either way.

### A3 — "Optional — all-or-nothing" documents banner has no submit bite  [p-209, was c-026]
**V4 says:** the accompanying-documents block is **optional but all-or-nothing**,
with a banner to that effect.
**Prototype does today:** a section whose only obligation is an *optional*
collection is treated as vacuously complete at the submit gate, so a
**half-completed** document entry never blocks submission. (The model *can*
compute per-entry completeness — nothing consumes it for un-required
collections.)
**Ask the PO / Paul:** should a *started-but-incomplete* optional document block
submit (i.e. extend the readiness rule to consume per-entry completeness for
started entries), or is the current "optional ⇒ never blocks" behaviour
acceptable for go-live? **Interacts with Paul's documents-topology thread**
(all-documents-mandatory vs type-triggered — REMEDIATION-BACKLOG Item 1); best
resolved in that same conversation.

---

## B. Superset re-affirmations with payload/contract impact (PO + backend sign-off)

These were ruled to match V4/the prototype, but each changes a **payload meaning
or backend contract** vs the currently-deployed journey, so the PO (and for B2,
the backend) should confirm before promotion.

### B1 — arrival-date datum changed meaning  [p-010]
Deployed journey asks "arrival at **final destination**"; prototype asks
"arrival at **port of entry**" (`arrivalDateAtPort`). **Both map to the same
payload field** `transport.arrivalDate`, so historical and new records would
mean different things. Ruled: re-affirm port-of-entry (V4 wording, ruling c-096).
**Ask the PO:** confirm port-of-entry is the intended datum, and that
`transport.arrivalDate` carrying a different meaning than historical
final-destination data is acceptable.

### B2 — certifiedFor vocabulary expands the backend enum  [p-002]
Deployed journey collects **3** camelCase values (`approvedBodies`,
`breedingAndOrProduction`, `slaughter`). Prototype offers the **16** V4
certification-purpose values and sends them raw, so the deployed backend enum
would need to grow. Ruled: ship the 16 (V4 is correct); the backend-schema
extension is a **promotion blocker Lane E must plan**.
**Ask the PO + backend:** confirm the V4 16-value vocabulary is correct and the
backend `certifiedFor` enum extends to match.

---

## C. Commodity-type data pack (reopens c-037)  [p-205 / p-206]

**What changed:** c-037 assumed **one animal type per commodity**; that premise is
**disproven** — multi-type per commodity is real (e.g. **0102 = Domestic +
Game**). commodityType is now a **normal mandatory page-owned obligation** with a
conditional type-select (shows a select when a commodity has multiple types,
auto-assumes the single-type case) — built and landed (p-206).
**Open data gap:** real per-commodity type data was sourced for the multi-type
case from the IPAFFS fixtures (0101 single blank type, 0102 Domestic+Game). For
**0103 / 0104 / 0105 / 0106** the prototype keeps the current single-type
assumption — no invented data — pending real data (running the IPAFFS
commoditycode microservice join, or a data-team pull).
**Ask the PO:** review **`decision-docs/p-205-commodity-type-data.md`** (full
evidence trail); confirm the conditional-select approach, and greenlight sourcing
real per-commodity type data for the remaining prototype commodity codes.

---

## Summary — one line each

| Item | Owner | Ask |
|---|---|---|
| p-207 | PO | Clarify the two V4 contactAddress variants; is select-or-create right? |
| p-208 | PO | Fix V4 example `Imports456_GB` vs the alphanumeric pattern. |
| p-209 | PO + Paul | Should a started optional document block submit? (with docs-topology) |
| p-010 | PO | Confirm arrival = port of entry; `transport.arrivalDate` meaning shift ok? |
| p-002 | PO + backend | Confirm 16-value certifiedFor + backend enum extension. |
| p-205/c-037 | PO | Approve conditional type-select + sourcing real type data for 0103–0106. |
