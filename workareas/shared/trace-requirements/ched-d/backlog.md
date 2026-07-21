# CHED-D — build backlog

**Generated:** 2026-07-21 — regenerated from the enriched `journey-spec.json` (41 pages: 29 notifier
create-journey pages, 4 CUC billing pages, 8 inspector/decision/lab pages — **every create-journey
page is `confidence=confirmed`**), the DoA-extended `target-model.md`, `integrations.md`,
`authorization-rules.md` and `conflicts.json` (c-001..c-044, 26 `needsHuman`).

A new **CDP-based** CHED-D app (High risk food and feed of non-animal origin — internal type code
**CED**), built like `trade-imports-animals`: a journey that builds up **one** JSON notification
document and persists it **whole to MongoDB** (no JSON-Patch, no `etag`/`If-Match`, no
per-microservice split). It gathers the **same information** as IPAFFS but must **not** inherit
IPAFFS's architecture, URL scheme, bespoke CSS or accessibility defects. **First pass persists to
Mongo.**

- **37 increments** across **6 milestones**. One increment per page, in canonical journey order,
  plus scaffolding/persistence, reference data, the commodity-collection model extension and lifecycle.
- **4 born blocked** ⛔ on a human ruling — each states the question; the ruling is **not** authored here.
- **Post-submission (inspector / PHSI checks / lab tests / decisions) is OUT of scope** — a separate
  service (the 8 `order=-1` inspector pages + the 4 spec-less decision pages).

---

## Milestones

| id | Milestone | Goal |
|---|---|---|
| m0 | Scaffold & persistence spine | App skeleton (agent rails first), Notification JSON document (house-parity + `ownership.*` + transit block + HRFNAO commodity leaves), whole-document Mongo persistence + ref minting, session draft save/resume, page-owned routing/validation spine + the once-for-all mandatoriness/concurrency/GDS-default decisions. |
| m1 | Reference data | House-style server-side clients over hardcoded JSON / fixtures: **two** country lists (219 third-country + 254 full 4-nation); CN commodity tree + type/class/family + species/EPPO fixture; BCPs/ports of entry (~31); 25 package types + 14 document types + static enums. |
| m2 | Consignment basics | Certificate type (const `CED`), country of origin, origin of import (countries + region code + internal ref), main reason for import (the confirmed flag-ON **transit** variant). |
| m3 | Commodity capture | The heart of CHED-D — the depth-2 repeating collection (`commodity.commodityComplement[] → species[]`), code search/tree browse, type/class/family + species, per-line weight/packages/package-type + total gross weight, intended-for + temperature. |
| m4 | Details, contacts, traders, review & submit | Hub, transport to the port of entry, GMS, contacts, contact/branch address, document metadata, hand-entered consignor + consignee, dashboard, review, declaration (no checkbox), confirmation — the manual own-org happy path. |
| m5 | Variants & deferred | DoA ownership/visibility/auto-population layer, the flag-OFF tranship variant, CUC billing, file bytes + AV, address-book search, draft lifecycle, auth stub. Four born blocked. |

**Sequencing:** m0 → m1 (parallel once inc-001 lands) → m2 → m3 → m4 → m5. Reference data is sequenced
explicitly (inc-004..inc-007). **Two** distinct country lists are required (c-009): a 219-entry
third-country list (`!country.eu` for CED) for `origin.countryCode`, and a 254-entry full list
(4-nation UK split, no single "United Kingdom") for consigned-country + every address. The CN
commodity tree + species/EPPO is the **one** lookup that cannot be hardcoded — ship a small fixture.
The commodity **collection** is sequenced explicitly as a model-extension gate (**inc-012**) *before*
any commodity page. The GDS defaults (error-summary title "There is a problem", legend-as-heading
radios, always-render-H1) are **not** per-page blockers — recorded once in inc-003 and applied by
every page.

Unlike CHED-PP, **no create-journey page is `gap`-confidence** — every page rendered in a CHED-D
trace. Born-blocks here come from `needsHuman` conflicts, modelGaps and the DoA scope question, not
page confidence.

---

## Deviations from IPAFFS (carried through every increment)

- Whole-document Mongo write on every save — **drop** JSON-Patch + `etag`/`If-Match` optimistic
  concurrency (Open Q 10). Two-tab editing = last-write-wins, a **deliberate** decision.
- **One stable id**; `status` moves `DRAFT→SUBMITTED→AMEND→DELETED`. Reject the
  `DRAFT.GB.YYYY.NNNN → CHEDD.GB.YYYY.NNNN` id-flip and dual-id URLs (Open Q 1).
- `chedType` is a constant **`CED`** — CHED-D-only app; on the wire CHED-D = CED (SOAP
  `SearchCriterionCED`). Legacy display name "CHED-D".
- **govuk-frontend toolbox only** — no bespoke CSS/datepicker, no dt/dd faux-table grids, no
  link-buttons (JB-7); the CDP cookie banner, not IPAFFS's implied-consent `.global-cookie-message`.
- Error summary titled **"There is a problem"** everywhere (drop "Please fix the following errors");
  radios use **legend-as-heading** with the H1 inside the fieldset.
- **Always render an H1** on confirmation (c-020 — IPAFFS drops it on the inspection-required
  variant); fix the `commodity-basic-description` (c-015) and `origin-of-import` (c-016)
  `<title>`/H1 mismatches — adopt the rendered H1.
- For CHED-D the **frontend Joi form is the authoritative mandatoriness layer** — the backend CED
  `@NotNull` group is materially looser (no CED `@NotNull` on address/contact/document rows; JB-2,
  c-038). Pass 1 adopts frontend-parity and enforces it server-side in one place (Open Q 2).
- **`ownership.*` tenancy layer added** (the house `NotificationBase` is single-tenant). Ownership +
  visibility **apply** to CHED-D; delegated creation + the Trade Partner badge do **not** (CHED-PP-only,
  AGT-1/BDG-1). `onBehalfOfOrganisationId` is carried but **dormant**; the badge is **not** modelled.

## Excluded (not increments)

- **Post-submission entirely**: the BIP inspector/decision app — `consignment-checks`,
  `inspector-attachments-upload`, `lab-tests-*`, `record-decision-status`,
  `record-lab-test-information` and the 4 spec-less decision pages (separate service). The
  confirmation risk-outcome variants are derived post-submission (risk engine stubbed).
- **File bytes + AV** (metadata only, inc-023 / born-blocked inc-034) and the **address book**
  (hand-enter consignor + consignee, inc-025/inc-026; search deferred, inc-035).
- **Stubbed / deferred integrations** (`integrations.md`): Defra ID/customer (fixed user "Michael
  Scott"), permissions (allow-all), risk (stubbed), customs refs (server-derived stub), Dynamics,
  TRACES SOAP, Notify, GVMS/NCTS live validation (fields captured only).
- **Not present for CHED-D** (so absent from this backlog): a CSV commodity branch, an Article 72 UI,
  a cloning front door — those are CHED-PP surfaces.

---

## Increments

Legend: ⛔ = born blocked (human ruling first). Sizes S/M/L.

### m0 — Scaffold & persistence spine

| id | Increment | Size |
|---|---|---|
| inc-001 | Scaffold the CDP CHED-D app skeleton (agent rails **first**) | M |
| inc-002 | Notification Mongo document + persistence spine (whole-doc write, ref mint, no ETag, `ownership.*` + separate `accompanying_documents`) | L |
| inc-003 | Session draft save/resume + page-owned routing/validation spine (records mandatoriness-layer + concurrency + GDS-default decisions once) | M |

### m1 — Reference data

| id | Increment | Size |
|---|---|---|
| inc-004 | Countries — **two** lists (219 third-country `!country.eu`; 254 full 4-nation UK split, no "United Kingdom"; c-008/c-009) | S |
| inc-005 | CN commodity tree + type/class/family + species/EPPO fixture (the one real lookup) | M |
| inc-006 | Border control posts / ports of entry (~31; no CHED-D control-point sub-select, c-012) | S |
| inc-007 | Package types (25, `isCed`, c-006) + document types (14, c-005) + static enums | S |

### m2 — Consignment basics

| id | Increment | Size |
|---|---|---|
| inc-008 | `import-type` — certificate type → `chedType='CED'`; "Select the type of import" | S |
| inc-009 | `country-of-origin` — "Select the country of origin of the animal or product" | S |
| inc-010 | `origin-of-import` — origin + region code + consigned country + optional internal ref (flag c-037) | M |
| inc-011 | `about-the-consignment` — main reason for import (**transit** flag-ON variant; point-of-exit + leave date/time) | M |

### m3 — Commodity capture

| id | Increment | Size |
|---|---|---|
| inc-012 | **Commodity collection model extension** (depth-2 repeating group) — *model-extension gate* | M |
| inc-013 | `search-commodity` — code search + 16-chapter tree browse (fixture, server round-trip) | M |
| inc-014 | `commodity-basic-description` — type/class/family + species + add-another (H1 fix c-015) | M |
| inc-015 | `commodity-extended-description` — per-line net-weight/packages/package-type + total gross weight | M |
| inc-016 | `commodity-additional-details` — intended-for + temperature (consignment-level, @NotNull CED) | S |

### m4 — Details, contacts, traders, review & submit

| id | Increment | Size |
|---|---|---|
| inc-017 | `notification-hub` — task-list hub (drop cross-type leakage sections) | M |
| inc-018 | `transport-details` — port of entry, means, id/doc, arrival date+time, containers (flag c-012/c-013/c-040) | L |
| inc-019 | `goods-movement-services` — CTC / MRN / GVMS (data, not an integration) | S |
| inc-020 | `contact-details` — responsible person (pre-populated from signed-in account; flag c-038 contactability) | S |
| inc-021 | `nominated-contacts` — repeating optional contacts | S |
| inc-022 | `contact-address` + `branch-address` — contact address for consignment | M |
| inc-023 | `accompanying-documents` — document **metadata** (type/reference/date; bytes deferred) | M |
| inc-024 | `traders-addresses` — traders table (hand-enter consignor+consignee; "Same as consignee" importer/destination) | M |
| inc-025 | `consignor-creation` (+ confirmation) — hand-entered consignor | M |
| inc-026 | `consignee-creation` (+ confirmation) — hand-entered consignee | M |
| inc-027 | `notifications-dashboard` — list own notifications (govuk-table; define status vocab c-035) | M |
| inc-028 | `review-notification` — check your answers (pre-submission; drop leakage rows) | L |
| inc-029 | `declaration` — submit (**no** acknowledgement checkbox, JB-5/c-019) | S |
| inc-030 | `confirmation` — submission confirmation (**always** render an H1, c-020) | S |

### m5 — Variants & deferred

| id | Increment | Size |
|---|---|---|
| inc-031 ⛔ | Delegated-authority ownership / visibility / auto-population layer | L |
| inc-032 ⛔ | `about-the-consignment` — flag-OFF **tranship** variant (Exit-BCP select) | S |
| inc-033 ⛔ | CUC billing sub-journey | M |
| inc-034 ⛔ | `document-upload` — file bytes + antivirus | M |
| inc-035 | `search-existing-consignor` / `-consignee` — address-book search (deferred stub) | S |
| inc-036 | Draft lifecycle — delete, amend (`submittedBaseline`), copy-as-new | M |
| inc-037 | Auth stub / sign-in (fixed user; account-bar chrome AGT-2) | S |

---

## ⛔ Born blocked — the questions (rulings not authored here)

- **inc-031 — Is delegated authority (DoA) in scope for CHED-D?** The CHED-D corpus has **zero** DoA
  traces; the whole layer is adapted from the CHED-PP DoA corpus, and the house `Notification` is
  single-tenant (no org field at all). Six sub-questions ride on it: **G-1** is CHEDPP-only delegated
  creation a permanent boundary or incomplete rollout (decides whether CHED-D needs an on-behalf-of
  design at all); **G-4** the badge's `type=='CHEDPP'` literal + `agencyOrganisationId` plumbing would
  need generalising; **G-5** would a registered-org CHED-D member auto-populate consignee/contact
  (untraced — POP-1/c-043); **G-2** do co-member Amend/Copy actually *succeed*; **G-3** is
  draft-privacy deliberate; **G-6** the cross-org isolation negative leg has no CHED-D trace.
- **inc-032 — Which `enableCheddLandbridge` state is canonical?** (c-011/c-042) `about-the-consignment`
  serves one of two feature-flag templates. Flag-ON = the transit variant built in inc-011 (free-text
  point-of-exit + leave date/time — the only variant traced). Flag-OFF = the **tranship** variant
  ('For internal market'/'For transfer to' + an **Exit Border Control Post** select, no free-text
  point-of-exit). If tranship is in scope the point-of-exit obligation becomes a BCP *selection* — a
  materially different capture.
- **inc-033 — Is CUC billing in scope for pass 1, and what triggers it?** (Open Q 11) The billing block
  is gated by an `isCuc` flag derived upstream; no trace/assertion pins the server rule (both traces
  non-billable). Shape is provisional; postcode lookup deferred/stubbed.
- **inc-034 — Are file bytes in scope, and what is the canonical file-constraint copy?** Attachments
  are a separate `/upload/` app with an async scan (embedding bytes would let the scan callback rewrite
  the notification). Copy reconciles: the enforced allow-list is
  `{csv,doc,docx,jpg,jpeg,pdf,png,xlsx,xls,gif}` but the hint under-advertises (c-030/c-031); the hint
  says "larger than 1KB" but the code floor is **200 bytes** (c-041); the button is "Next" for CHED-D
  vs "Continue" elsewhere (c-036).

---

## Open questions carried from the model (a human resolves — flagged in-place in the ACs)

1. **Reference-number format** — house `GBN-AG-{YY}-{XXXXXX}` vs IPAFFS `CHEDD.GB.YYYY.NNNN` + the
   `GBCHD…` customs ref + `C678` document code (inc-002).
2. **Which mandatoriness layer is canonical** — frontend Joi (stricter) vs backend CED `@NotNull`
   (no CED rule on address/contact/document rows); JB-2/c-038 (inc-003).
7. **Intended-for / temperature scope** — modelled consignment-level; confirm not per-line under the
   untraced multi-commodity branch (inc-016).
8. **Species identity + EPPO** — is `value` the stable stored key or is `eppoCode` safer? many HRFNAO
   codes carry no species (inc-005).
9. **Contact required-ness** — `name` required; email + telephone each optional with **no** at-least-one
   rule for CED (unlike CHED-PP); confirm the contactability rule (inc-020).
10. **Concurrency** — dropping ETag means two-tab editing is last-write-wins (deliberate); is two-tab
    editing real? (inc-003).
12. **Country fields** — `countryOfConsignmentCode == countryCode` in every trace; `Address.country`
    mixes ISO with 4-nation GB-subdivision codes and has no single "United Kingdom" (inc-004).

(Plus the four born-blocked questions above, and the feature-flag variant question c-011/c-042.)
