# CHED-PP — build backlog

**Generated:** 2026-07-18 — regenerated from the enriched `journey-spec.json` (39 pages, 354 field
rows, 310 validation messages of which **228 grounded** in the legacy Joi/Jakarta catalogues), the
DoA-extended `target-model.md`, `integrations.md`, `authorization-rules.md` and `conflicts.json`
(c-001..c-028, 8 `needsHuman`).

A new **CDP-based** CHED-PP app, built like `trade-imports-animals`: a journey that builds up **one**
JSON notification document and persists it **whole to MongoDB** (no JSON-Patch, no per-microservice
split). It gathers the **same information** as IPAFFS but must **not** inherit IPAFFS's architecture,
URL scheme, bespoke CSS or accessibility defects. **First pass persists to Mongo.**

- **42 increments** across **6 milestones**. One increment per page, in canonical journey order,
  plus scaffolding/persistence, reference data, the commodity-collection model extension and lifecycle.
- **Spec gate PASSED 2026-07-18** — all 8 `needsHuman` conflicts ruled and first-pass scope set by
  Sam. The **10 formerly born-blocked** increments are all resolved: **5 unblocked** (inc-014, inc-020,
  inc-025, inc-036, inc-040), **5 deferred out of first pass** (inc-032/033/034 DoA, inc-037 file bytes,
  inc-041 cloning). Decisions in `RULINGS.md`; machine form in `conflicts.json` + `backlog.json`.
- **Post-submission (inspector / PHSI checks / decisions) is OUT of scope** — a different service.

---

## Milestones

| id | Milestone | Goal |
|---|---|---|
| m0 | Scaffold & persistence spine | App skeleton (agent rails first), Notification JSON document, whole-document Mongo persistence + ref minting, session draft save/resume, page-owned routing/validation spine. |
| m1 | Reference data | House-style server-side clients over hardcoded JSON / fixtures: countries; commodity codes + EPPO species + variety/class; BCP + inspection premises; measures + document types. |
| m2 | Consignment basics | Certificate type (const CHEDPP), country of origin, origin of import, main reason for import. |
| m3 | Commodity capture (manual) | The hard part — the nested repeating commodity collection (commodity → species → variety/class), per-commodity measures, additional details. |
| m4 | Details, contacts, traders, review & submit | Hub, transport, GMS, contacts, document metadata, traders/consignor, dashboard, review, declaration, confirmation — the manual own-org happy path. |
| m5 | Variants & deferred | CSV branch, CUC billing (IN scope), file bytes + AV (deferred), address book, lifecycle, Article 72 (placeholder hook), auth stub. DoA journey + cloning deferred out of first pass. |

**Sequencing:** m0 → m1 (parallel once inc-001 lands) → m2 → m3 → m4 → m5. Reference data is sequenced
explicitly (inc-004..inc-007); the commodity-code + EPPO-species list is the **one** lookup that cannot
be hardcoded — ship a ~10-code fixture. The commodity **collection** is sequenced explicitly as a
model-extension gate (inc-012) **before** any commodity page. inc-014 now builds the **real** commodity
search (tree browse + EPPO typeahead, server round-trip; `eppoCode` join key) — fixture-backed in pass 1,
the real ref-data integration later. Conflicts **c-004** (error-summary title) and **c-014** (radio a11y)
are **not** per-page blockers — every page ships the adopted GDS default; sign-off is recorded once.

---

## Deviations from IPAFFS (carried through every increment)

- Whole-document Mongo POST on every save — **drop** JSON-Patch + `etag`/`If-Match` optimistic
  concurrency (modelGap `optimistic-concurrency-etag`; Open Q 3). Two-tab editing = last-write-wins,
  a **deliberate** decision.
- **One stable id**; `status` moves `DRAFT→SUBMITTED→AMEND→DELETED`. Reject the `DRAFT.GB→CHEDPP.GB`
  id flip and dual-id URLs (modelGap `id-flip-draft-to-ched`).
- **govuk-frontend toolbox only** — no bespoke CSS/datepicker; the CDP cookie banner, not IPAFFS's
  implied-consent `.global-cookie-message`.
- Error summary titled **"There is a problem"** everywhere (c-004); radios use **legend-as-heading**
  with the H1 inside the fieldset (c-014) — fixes the missing radio-group accessible name.
- Real-href `govuk-back-link`.

## Excluded (not increments)

- **Post-submission entirely**: the BIP inspector `decision` app (13 `decision-*` pages),
  `review-notification`'s post-submit Checks / Valid-Rejected tabs, `confirmation`'s risk variants, and
  `split-consignment-confirm` (a post-submission action).
- **Stubbed / deferred integrations** (`integrations.md`): Defra ID/customer (fixed user), permissions
  (allow-all), field-config (inline), risk (always low), certificate PDF, Dynamics, TRACES SOAP, Notify.
- **File bytes + AV** (metadata only, inc-037) and the **address book** (free-type consignor, inc-038).

---

## Increments

Legend: ✅ = formerly born-blocked, now unblocked by a 2026-07-18 ruling; ⏸ = deferred out of first
pass by a 2026-07-18 ruling. Sizes S/M/L. See `RULINGS.md` for the decisions.

### m0 — Scaffold & persistence spine

| id | Increment | Size |
|---|---|---|
| inc-001 | Scaffold the CDP CHED-PP app skeleton (agent rails **first**) | M |
| inc-002 | Notification Mongo document + persistence spine (whole-doc POST, ref mint, no ETag) | L |
| inc-003 | Session draft save/resume + page-owned routing/validation spine | M |

### m1 — Reference data

| id | Increment | Size |
|---|---|---|
| inc-004 | Countries reference data (~254; 'Republic of Ireland' c-012; optgroups c-026) | S |
| inc-005 | Commodity codes + EPPO species + variety/class fixture (the one real lookup) | M |
| inc-006 | Border control posts (144) + inspection premises (per-BCP, filtered) | M |
| inc-007 | Measures (package 24 / quantity 8 / container / means 5 / volume) + document types (17) | S |

### m2 — Consignment basics

| id | Increment | Size |
|---|---|---|
| inc-008 | `import-type` — certificate type → `chedType='CHEDPP'`; "Select the type of import" | S |
| inc-009 | `country-of-origin` — "Select the country of origin of plants, plant product or other objects" | S |
| inc-010 | `origin-of-import` — origin + consigned country + optional local reference | S |
| inc-011 | `about-the-consignment` — main reason for import (3 radios; normalise the enum, c-006) | S |

### m3 — Commodity capture (manual)

| id | Increment | Size |
|---|---|---|
| inc-012 | **Commodity collection model extension** (nested repeating group) — *model-extension gate* | M |
| inc-013 | `commodity-input-method` — manual vs CSV routing (one canonical question, c-013) | S |
| inc-014 ✅ | `commodity-search` — REAL code tree + EPPO species search (server round-trip; `eppoCode` join key) | L |
| inc-015 | `commodity-basic-description` — select species | M |
| inc-016 | `variety-of-genus-and-species` — variety + class (3-enum) | M |
| inc-017 | `commodity-summary` — commodity table + remove | S |
| inc-018 | `commodity-bulk-details` — per-commodity measures (fix labelless a11y defect) | L |
| inc-019 | `commodity-additional-details` — consignment totals (derived rollups read-only) | S |

### m4 — Details, contacts, traders, review & submit

| id | Increment | Size |
|---|---|---|
| inc-020 ✅ | `notification-hub` — task-list hub (12 spokes, hub-owned nav, all-mandatory gating) | L |
| inc-021 | `transport-before-bip` — BCP, premises, transport, arrival date+time, containers | L |
| inc-022 | `goods-movement-services` — CTC / MRN / GVMS (data, not an integration) | S |
| inc-023 | `contact-details` — responsible person ('Mobile number' c-020; at-least-one-of) | S |
| inc-024 | `nominated-contact` — repeating optional contacts | S |
| inc-025 ✅ | `accompanying-documents` — document metadata (c-015: at least one MANDATORY) | M |
| inc-026 | `traders-addresses` — traders table (consignor/destination/packer) | M |
| inc-027 | `consignor-create` (+ confirmation) — hand-entered consignor (fix c-010/c-011 error copy) | M |
| inc-028 | `notifications-dashboard` — list own notifications (one status vocab, c-027) | M |
| inc-029 | `review-notification` — check your answers (pre-submission only) | L |
| inc-030 | `declaration` — attestation + submit (`DRAFT→SUBMITTED`) | S |
| inc-031 | `confirmation` — submission confirmation (add a real H1 — fix the a11y defect) | S |

### m5 — Variants & deferred

| id | Increment | Size |
|---|---|---|
| inc-032 ⏸ | **DoA ownership, visibility & auto-population layer** (deferred — DoA out of first pass) | L |
| inc-033 ⏸ | `consignment-for` — who are you creating this for? (deferred — behind DoA) | S |
| inc-034 ⏸ | `consignment-organisation` — which delegated org (deferred — behind DoA) | S |
| inc-035 | `csv-upload` — CSV commodity branch (replaces manual commodity pages) | L |
| inc-036 ✅ | CUC billing sub-journey (IN scope; `isCuc`-gated, provisional c-007) | M |
| inc-037 ⏸ | `document-upload` — file bytes + antivirus (deferred — bytes out of pass 1; c-023 copy ruled) | M |
| inc-038 | `consignor-search` — address-book search (deferred; free-type instead) | S |
| inc-039 | Draft lifecycle — delete / amend / copy-as-new | M |
| inc-040 ✅ | Article 72 business rule (placeholder no-op rule hook in pass 1) | S |
| inc-041 ⏸ | Cloning front door (deferred out of first pass — success path never observed) | M |
| inc-042 | Auth stub / sign-in (fixed user) | S |

---

## Born-blocked — RESOLVED 2026-07-18 (rulings by Sam; see `RULINGS.md`)

| id | Increment | Ruling |
|---|---|---|
| inc-014 ✅ | `commodity-search` | Build the **real** search now (code tree browse + EPPO species typeahead, server round-trip) — not a fixture code-pick. Store **`eppoCode`** as the species join key (Open Q 1); the internal `add-species-<id>` is transient UI state. |
| inc-020 ✅ | `notification-hub` | **12 spokes** (Origin, Purpose, Commodity, Additional details, Transport to the BCP, GMS, Contact details, Nominated contacts *(optional)*, Accompanying documents, Traders, Billing *(conditional on `isCuc`)*, Review and submit). Catch-cert / charity / latest-health-cert **omitted**. **Hub owns navigation**; all mandatory sections Completed unlocks "Review and submit"; optional spokes don't gate. |
| inc-025 ✅ | `accompanying-documents` | **c-015 → MANDATORY**: at least one document (a phytosanitary certificate) required to submit; `required=true`. |
| inc-032 ⏸ | DoA ownership layer | **DoA OUT of first pass** — deferred to a later programme; single-org own-behalf journey. G-1..G-6 open for that programme. |
| inc-033 ⏸ | `consignment-for` | Deferred — behind DoA (out of first pass). |
| inc-034 ⏸ | `consignment-organisation` | Deferred — behind DoA (out of first pass). |
| inc-036 ✅ | CUC billing | **CUC IN first pass**; gate on a free-standing **`isCuc`** flag (c-007 provisional) — confirm with IPAFFS whether the real rule derives from the Sevington port. |
| inc-037 ⏸ | `document-upload` | **File bytes OUT of pass 1** — metadata only via inc-025; **c-023 → GDS sentence case** for the AV/upload copy when built. |
| inc-040 ✅ | Article 72 | Build a **no-op placeholder rule hook** in pass 1; product supplies the country×commodity condition + effect later. |
| inc-041 ⏸ | Cloning | **OUT of first pass** — success path never observed; source the success-state flow when re-opened. |

**Follow-ups outside the build (`RULINGS.md` §4):** report the c-024 overdue-debtor bug to IPAFFS;
confirm the c-007 CUC trigger with IPAFFS; QA migration of the c-004 guard `ched-a-workflows.ts:505`.

---

## Open questions carried from `target-model.md` (recorded per-increment, not resolved here)

Q1 species identity · Q2 variety identity · Q3 concurrency (no ETag) · Q4 reference-number format ·
Q5 `reasonForImport` enum · Q6 `finishedOrPropagated` / explicit declaration · Q7 which member =
Responsible person (G-1) · Q8 badge lifecycle (G-2) · Q9 country-of-consignment independence ·
Q10 trader region codes vs ISO in one field · Q11 CUC scope · Q12 collapse the org selector (G-6) ·
Q13 unexercised auto-population parties · Q14 CUC pass-1 scope · Q15 Q9/Q10 before finalising countries.
