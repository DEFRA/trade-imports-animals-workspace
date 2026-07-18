# CHED-PP spec-gate rulings

**Ruled by:** Sam · **Date:** 2026-07-18 · **Session:** spec-gate review of the trace-mined CHED-PP requirements.

This is the human decision log that closes the CHED-PP spec gate. It records the 8 conflict
rulings, the first-pass scope calls, and the resolution of every born-blocked increment. The
machine-readable form lives in `conflicts.json` (`humanRuling` per conflict) and `backlog.json`
(`scopeDecisions`, per-increment `ruling`, `bornBlockedResolution`).

---

## 1. The 8 conflicts that needed a human

| id | topic | ruling |
|---|---|---|
| **c-004** | Error-summary title | **CONFIRMED** — adopt GDS 'There is a problem' everywhere. Migration task: update the CHED-A QA guard `ched-a-workflows.ts:505` (`/fix the following errors/i`) so it keeps detecting error states. |
| **c-007** | CUC billing trigger | **PROVISIONAL** — model billing as gated by a free-standing `isCuc` flag; not settled — confirm with IPAFFS whether the real server rule derives CUC from the Sevington port. (CUC is in first-pass scope.) |
| **c-013** | commodity-input-method wording | **CONFIRMED** — adopt the visible H1 'How do you want to add your commodity details?'; drop the hidden legend; fold into legend-as-heading. |
| **c-014** | Radio a11y defect | **CONFIRMED** — FIX it. Standard GDS radios (H1 inside the fieldset legend, caption above) across all affected pages. Deliberate behaviour change, not a port. |
| **c-015** | Accompanying docs mandatory? | **RULED MANDATORY** (from domain knowledge) — at least one document (a phytosanitary certificate) required to submit; `required=true`. Corrects the isChedp/CHED-P trap. |
| **c-018** | Validation copy voice | **RULED** — adopt the frontend Joi voice ('Enter/Select the …') as the single canonical string per field; ship one string, not both layers. |
| **c-023** | AV/upload-failure copy | **RULED** — don't port either legacy casing; standardise on GDS sentence case. |
| **c-024** | Overdue-debtor gate | **RULED OUT** of first pass — not implemented. GET/POST inconsistency confirmed a latent IPAFFS bug; report to IPAFFS independently. If added later, derive the flag once per request and never render a permitted option disabled. |

## 2. First-pass scope

| Area | Decision | Consequence |
|---|---|---|
| **Delegated authority (DoA)** | **OUT** | Single-org, own-behalf journey. inc-032/033/034 deferred to a later programme. |
| **CUC billing** | **IN** | inc-036 built, gated provisionally on `isCuc` (c-007); Billing spoke conditional on the hub. |
| **Cloning** | **OUT** | inc-041 deferred; success path never observed. |

## 3. Born-blocked increments — all resolved

**Unblocked → `todo` (5):**
- **inc-014 commodity-search** — build the REAL search now (commodity-code tree browse + EPPO species typeahead, server round-trip); store `eppoCode` as the species join key (Open Q 1); internal `add-species-<id>` is transient UI state.
- **inc-020 notification-hub** — 12 spokes (Origin of the import, Purpose, Commodity, Additional details, Transport to the BCP, Goods movement services, Contact details, Nominated contacts *(optional)*, Accompanying documents, Traders, Billing *(conditional on isCuc)*, Review and submit). Catch certificates / charity / latest-health-cert-status omitted. Hub owns navigation; all-mandatory-complete unlocks 'Review and submit'; optional spokes don't gate.
- **inc-025 accompanying-documents** — c-015 mandatory; `required=true`.
- **inc-036 CUC billing** — in scope; `isCuc`-gated (provisional).
- **inc-040 Article 72** — no-op placeholder rule hook in pass 1; rule supplied by product later.

**Deferred out of first pass (5):**
- **inc-032 / inc-033 / inc-034** — DoA layer + the two org-selector pages.
- **inc-037 document-upload (file bytes + AV)** — bytes out of pass 1 (metadata only via inc-025); c-023 copy ruled for when built.
- **inc-041 cloning** — out of first pass.

## 4. Follow-up actions outside the rebuild

- **Report to IPAFFS:** the c-024 overdue-debtor GET/POST inconsistency (latent bug, zero coverage).
- **Confirm with IPAFFS/product:** the c-007 CUC trigger (free-standing flag vs Sevington-derived) before finalising the billing condition.
- **QA migration:** update the CHED-A guard `ched-a-workflows.ts:505` when the error-summary title changes (c-004).
- **Still needing a policy source (not blocking pass-1 build):** the Article 72 country×commodity rule (inc-040 hook is a placeholder until then).

## 5. Residual policy questions (unchanged — not mineable)

Per `completeness-critique.md`: Article 72 eligibility, risk categorisation, HMI auto-completion,
split generation, control-point↔BCP filtering. These need a human/policy source; the tooling cannot
recover them.
