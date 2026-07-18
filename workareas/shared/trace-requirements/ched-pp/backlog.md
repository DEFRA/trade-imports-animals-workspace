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
- **10 born blocked** ⛔ on a human ruling — each states the question; the ruling is **not** authored here.
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
| m5 | Variants & deferred | CSV branch, DoA ownership journey, CUC billing, file bytes + AV, address book, lifecycle, Article 72, cloning, auth stub. Several born blocked. |

**Sequencing:** m0 → m1 (parallel once inc-001 lands) → m2 → m3 → m4 → m5. Reference data is sequenced
explicitly (inc-004..inc-007); the commodity-code + EPPO-species list is the **one** lookup that cannot
be hardcoded — ship a ~10-code fixture. The commodity **collection** is sequenced explicitly as a
model-extension gate (inc-012) **before** any commodity page. Build the manual commodity path against a
fixture code-pick so the happy path is verifiable **without** the blocked search (inc-014). Conflicts
**c-004** (error-summary title) and **c-014** (radio a11y) are **not** per-page blockers — every page
ships the adopted GDS default; sign-off is recorded once.

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

Legend: ⛔ = born blocked (human ruling first). Sizes S/M/L.

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
| inc-014 ⛔ | `commodity-search` — code tree + EPPO species search | L |
| inc-015 | `commodity-basic-description` — select species | M |
| inc-016 | `variety-of-genus-and-species` — variety + class (3-enum) | M |
| inc-017 | `commodity-summary` — commodity table + remove | S |
| inc-018 | `commodity-bulk-details` — per-commodity measures (fix labelless a11y defect) | L |
| inc-019 | `commodity-additional-details` — consignment totals (derived rollups read-only) | S |

### m4 — Details, contacts, traders, review & submit

| id | Increment | Size |
|---|---|---|
| inc-020 ⛔ | `notification-hub` — task-list hub | L |
| inc-021 | `transport-before-bip` — BCP, premises, transport, arrival date+time, containers | L |
| inc-022 | `goods-movement-services` — CTC / MRN / GVMS (data, not an integration) | S |
| inc-023 | `contact-details` — responsible person ('Mobile number' c-020; at-least-one-of) | S |
| inc-024 | `nominated-contact` — repeating optional contacts | S |
| inc-025 ⛔ | `accompanying-documents` — document metadata | M |
| inc-026 | `traders-addresses` — traders table (consignor/destination/packer) | M |
| inc-027 | `consignor-create` (+ confirmation) — hand-entered consignor (fix c-010/c-011 error copy) | M |
| inc-028 | `notifications-dashboard` — list own notifications (one status vocab, c-027) | M |
| inc-029 | `review-notification` — check your answers (pre-submission only) | L |
| inc-030 | `declaration` — attestation + submit (`DRAFT→SUBMITTED`) | S |
| inc-031 | `confirmation` — submission confirmation (add a real H1 — fix the a11y defect) | S |

### m5 — Variants & deferred

| id | Increment | Size |
|---|---|---|
| inc-032 ⛔ | **DoA ownership, visibility & auto-population layer** (born blocked per instruction) | L |
| inc-033 ⛔ | `consignment-for` — who are you creating this for? (behind DoA) | S |
| inc-034 ⛔ | `consignment-organisation` — which delegated org (behind DoA) | S |
| inc-035 | `csv-upload` — CSV commodity branch (replaces manual commodity pages) | L |
| inc-036 ⛔ | CUC billing sub-journey (confirm/find/select/change) | M |
| inc-037 ⛔ | `document-upload` — file bytes + antivirus (separate-app boundary) | M |
| inc-038 | `consignor-search` — address-book search (deferred; free-type instead) | S |
| inc-039 | Draft lifecycle — delete / amend / copy-as-new | M |
| inc-040 ⛔ | Article 72 business rule (no UI evidence) | S |
| inc-041 ⛔ | Cloning front door (success path never observed — all traces 406) | M |
| inc-042 | Auth stub / sign-in (fixed user) | S |

---

## ⛔ Born blocked — the human questions (ruling NOT authored here)

| id | Increment | The question a human must rule |
|---|---|---|
| inc-014 | `commodity-search` | Page confidence is `gap` and it fronts the one lookup that cannot be hardcoded. (1) Which fixture commodity codes + species for pass 1, and may the manual path be verified against a fixture code-pick while the real tree browse/typeahead is deferred? (2) **Open Q 1** — is the internal species id (`add-species-<id>`) stable across ref-data refreshes, or must `eppoCode` be the stored join key? |
| inc-020 | `notification-hub` | Page confidence is `gap` — only the dynamic caption is confirmed. Confirm the hub's **sections**, the per-section status tags, the completeness/gating rule that unlocks "Review and submit", the conditional (gap-confidence) Billing / Catch-certificates / charity sections, and whether the spine or the hub owns navigation. |
| inc-025 | `accompanying-documents` | **c-015** — is at least one accompanying document (a phytosanitary certificate) **mandatory** for CHED-PP? The `isChedp` reading was a trap (CHED-P, not CHED-PP); no trace/test ever drove the error. The page shell is buildable now; only the required-vs-optional ruling is blocked. |
| inc-032 | DoA ownership layer | **Is delegated authority in scope for this rebuild?** Tenancy is entirely new surface (the house model is single-tenant). Sub-questions **G-1..G-6**: which member becomes 'Responsible person' (POP-2); badge/agencyOrganisationId lifecycle on amend/copy (G-2); do co-member actions succeed (G-3); is draft-privacy deliberate (G-4); ≥8-delegation picker (G-5); collapse the two-page selector (G-6). |
| inc-033 | `consignment-for` | Behind inc-032; **G-6** — collapse into one radio group (own org alongside delegated orgs) vs boolean-then-picker? |
| inc-034 | `consignment-organisation` | Behind inc-032; **G-5** — the picker flips radios→autocomplete at ≥8 delegations (never traced). |
| inc-036 | CUC billing | **c-007** — what triggers billing? Free-standing `isCuc` flag vs derived from the Sevington port chosen on `transport-before-bip`. Plus **Open Q 11/14** — is CUC in scope for pass 1, and what is its (thinly-evidenced) shape? |
| inc-037 | `document-upload` | Separate `/upload/` app with an async scan (embedding bytes would let the callback rewrite the notification). Pass 1 defers bytes → metadata only. Plus **c-023** — the AV-failure copy casing was never observed on this single-file surface. Are bytes in scope for pass 1, and the canonical AV copy? |
| inc-040 | Article 72 | A business rule with **no UI** — traces show outputs, never the rule. Define the country×commodity classification, its journey effect, and any stored flag before building. |
| inc-041 | Cloning | The successful clone path is unobserved — all three corpus traces hit the 406 "You cannot clone this certificate". Confirm scope and source the success-state flow first. |

---

## Open questions carried from `target-model.md` (recorded per-increment, not resolved here)

Q1 species identity · Q2 variety identity · Q3 concurrency (no ETag) · Q4 reference-number format ·
Q5 `reasonForImport` enum · Q6 `finishedOrPropagated` / explicit declaration · Q7 which member =
Responsible person (G-1) · Q8 badge lifecycle (G-2) · Q9 country-of-consignment independence ·
Q10 trader region codes vs ISO in one field · Q11 CUC scope · Q12 collapse the org selector (G-6) ·
Q13 unexercised auto-population parties · Q14 CUC pass-1 scope · Q15 Q9/Q10 before finalising countries.
