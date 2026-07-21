# CHED-D journey spec — SPEC GATE (regenerated, legacy + DoA enriched)

**For Sam to accept or reject.** This regenerates the canonical machine-readable journey spec (`journey-spec.json`) and conflict register (`conflicts.json`) from the 41 **enriched** per-page specs — now carrying (1) authoritative **legacy IPAFFS source** for validation copy + mandatoriness, and (2) a **delegated-authority (DoA)** ownership/visibility model. Read the weak parts first — they are at the top.

- **App**: IPAFFS CHED-D pre-notification for high-risk food and feed of non-animal origin (HRFNAO). Being rebuilt as a new, simple CDP app that must gather the SAME information but NOT copy IPAFFS's architecture.
- **Precedence when sources disagree**: `confirmed` (rendered trace — wins on copy/labels/options/structure) → `legacy` (authoritative IPAFFS source — wins on values/copy/render-conditions where traces are silent; "as the old system had it" for mandatoriness) → `inferred` (tests/page-objects) → `gap`.
- **Corpus**: 383 traces, CHED-D subset ≈ 22, 38 error-bearing. Traces are a **lower bound**. **345/383 traces have zero errors**, which is exactly why legacy enrichment is load-bearing: the app's inline error copy was almost never *rendered* for CHED-D, so it is now sourced from the Joi validators + `ValidationMessages` instead.

---

## 0. The weak parts (read these first)

1. **Legacy mandatoriness is a policy, not a law.** 29 fields and 303 validation messages are now `legacy`-tagged. For VALUES and COPY that is trustworthy. For **required-ness** it is "as IPAFFS had it" — and the biggest finding of this run is that **the IPAFFS frontend enforces MORE than its own backend model** (see c-038 / §6 decision 5). A rebuild that validates only against the persisted CED model would silently drop mandatory fields the current UI enforces.
2. **The whole DoA model for CHED-D is INFERRED, not confirmed.** The CHED-D corpus has **zero** auth/DoA traces. Ownership + visibility (OWN-1, VIS-1, VIS-2) are adapted from the CHED-PP DoA corpus on the argument that they key on the shared backend/dashboard, not CHED type. Plausible and testable — but nobody has watched a second CHED-D org-member see a co-member's notification. Treat the authorization section as **requirements to verify**, not observed fact.
3. **Two legacy-vs-rendered disagreements mean IPAFFS source is drifting from what it serves.** `region-code` is gated OFF for CED in the current template yet **rendered** for a CED trace (c-037); the confirmation page's 4th outcome is **dead code** the page object still references (c-020). Where they disagree, the rendered value is kept — but the drift itself is the signal.
4. **A feature flag hides half of one page.** `about-the-consignment` serves one of two templates by `enableCheddLandbridge` (c-011 / c-042). The corpus only ever saw the flag-ON variant (free-text point of exit); the flag-OFF variant replaces it with an "Exit Border Control Post" select. The rebuild must pick which is canonical.
5. **12 validation messages remain a genuine `gap`** — no legacy source and no trace (mostly conditional-branch copy: region-code-when-Yes, some multi-commodity/lab paths). Small, but real.

---

## 1. Headline numbers

| Metric | Count |
|---|---|
| Pages merged (per-page specs) | **41** |
| Pages in the inventory with **no** spec (traced, not specced) | 4 (decision-notifications-search, decision-hub, decision-outcome, decision-confirmation) |
| Raw field entries across all 41 pages (incl. read-only restatements + variant controls) | **283** |
| — deduped in-scope notifier obligations (unchanged model estimate) | ≈ 71 |
| Validation messages captured | **325** |
| Conflicts recorded | **39** (c-001 … c-044, some numbers reserved) |
| — needing a human ruling | **26** |
| — settled by precedence | **13** |
| Model gaps | **13** (was 9; +4 this run) |

### The headline improvement — validation coverage

| | Before (last run) | After (this run) |
|---|---|---|
| Validation messages with real copy | **≈ 8** | **313 / 325 (96.3%)** |
| — `confirmed` (rendered in a trace) | 8 | 9 |
| — `legacy` (Joi / ValidationMessages, file:line) | 0 (excluded by scope) | **303** |
| — `inferred` (tests) | — | 1 |
| — `gap` (still unknown) | ~147 | **12** |

**Validation copy moved from ≈8 covered to 313 covered.** The lever was reversing the old "legacy templates are out of scope" rule: legacy is now a first-class tier above `inferred`.

### Field confidence breakdown (283 fields)

| Confidence | Count | What it means |
|---|---|---|
| `confirmed` | 238 | Rendered in a CHED-D trace |
| `legacy` | 29 | Mandatoriness/values from Joi + Java `@NotNull` groups (e.g. weight/package required, address form) |
| `inferred` | 15 | Variant-only controls, workflow-deduced, DoA-by-architecture |
| `gap` | 1 | No evidence either way |

---

## 2. Conflict register — `needsHuman` FIRST (26)

### 2a. New this run (8)

| id | Page | Topic | Adopted ruling |
|---|---|---|---|
| **c-037** | origin-of-import | Legacy template gates `region-code` OFF for CED, but a CED trace RENDERED it | rendered wins (kept confirmed); IPAFFS source is dropping region-code for CHED-D — decide if the rebuild carries it |
| **c-038** | consignee-creation (+systemic) | Frontend Joi mandatoriness **exceeds** the backend CED model `@NotNull` (address, contact, document rows) | adopted frontend (Joi) required-ness; which layer is authoritative is a rebuild decision |
| **c-039** | import-type | Legacy overdue-debtor gating disables the **CHEDPP** option (never CED) | not a CHED-D requirement; is the payment/debtor policy in scope at all? |
| **c-040** | transport-details | Error copy uses internal short labels ('Identification','Document') ≠ on-screen labels | reuse the on-screen field label in rebuild error copy |
| **c-041** | accompanying-documents | On-page hint says "larger than 1KB"; code floor is **200 bytes** | align advertised copy with the 200-byte floor |
| **c-042** | about-the-consignment | `enableCheddLandbridge` flag-OFF **tranship** variant (Exit-BCP select, no point-of-exit) is unobserved | pick the canonical flag state; underpins c-011 |
| **c-043** | traders-addresses | DoA: CHED-PP org auto-population vs observed CHED-D hand-entry of traders | different actor routes (not a contradiction); org auto-pop is CHEDPP-only — G-5 |
| **c-044** | notifications-dashboard | DoA: delegated-agent creation + Trade Partner badge are CHEDPP-only | CHED-D has no on-behalf-of route; design it in if wanted — G-1/G-4 |

### 2b. Carried forward, still needing a human (18)

| id | Page | Topic | Note |
|---|---|---|---|
| c-001 | origin-of-import | origin-country on two pages + 3 phantom radios | **legacy partially resolved**: 2 of 3 phantom radios are CVEDP-only leakage; health-certificate radio still unexplained |
| c-005 | accompanying-documents | document-type label 'Laboratory sampling results' vs domain long label | legacy: 14 rendered = authoritative allow-list; stale domain vs re-label still open |
| c-008 | consignor-creation | country value-space (four-nation split, no 'United Kingdom') | product call |
| c-009 | country-of-origin | two country lists (219 vs 254) | **legacy resolved the mechanism** (`!country.eu` for CED); EFTA copy nuance remains |
| c-011 | about-the-consignment | point of exit free-text vs BCP dropdown | **reframed by legacy**: it's the `enableCheddLandbridge` flag (see c-042) |
| c-012 | transport-details | 'Port of entry' vs after-BCP variant controls | legacy: control-point is CHEDPP-only; two-leg question remains |
| c-013 | transport-details | road-trailer/container conditional controls | CHED-D requirement or shared markup? |
| c-018 | consignee-creation | address telephone/email required-ness | **legacy resolved frontend behaviour** (required); model has no CED group — see c-038 |
| c-019 | declaration | CHED-D has NO acknowledgement checkbox | **legacy confirmed** (validator CHEDPP/CHED-A only); add one for consistency? |
| c-020 | confirmation | no H1 (a11y defect) + risk-outcome variants | **legacy resolved to 3 served variants**; 4th is dead code; rebuild MUST render an H1 |
| c-024 | lab-tests-required | 'Random' third option (CHED-A only) | does CHED-D ever offer it? |
| c-030 | inspector-attachments-upload | accepted file types | **legacy resolved allow-list** {csv,doc,docx,jpg,jpeg,pdf,png,xlsx,xls,gif}; align copy |
| c-031 | accompanying-documents | same file-type discrepancy | shared capability with c-030 |
| c-032 | notifications-dashboard | bespoke dt/dd grid vs table addressing | true table or faux-table? |
| c-033 | notifications-dashboard | 'Yesterday' quick-range in page object only | confirm on live dashboard |
| c-034 | notifications-dashboard | status label vs backend enum value | full label→code map is a gap |
| c-035 | record-decision-status | two status vocabularies (12 vs 11) | define your own vocabulary |
| c-036 | document-upload | upload button 'Next' vs 'Continue' | legacy did not explain the variance; standardise |

### 2c. Settled by precedence (13) — no human needed

| id | Page | Ruling |
|---|---|---|
| **c-006** | commodity-extended-description | **flipped to settled by legacy**: 25 package-types canonical for CED (isCed excludes Balloon Protected + Pallet Box) |
| **c-014** | goods-movement-services | **flipped to settled by legacy**: the 2-option CTC is a *separate* page (add-ncts-mrn), not a variant of this one |
| **c-017** | consignor-creation | **flipped to settled by provenance shift**: the 16 legacy-Joi messages are now legitimately `legacy`, not out-of-scope `inferred` |
| c-002 | country-of-origin | origin-country required:true (workflow + legacy) |
| c-003 | import-type | mandatory; no-selection copy now legacy 'Select the type of import' |
| c-007 | commodity-extended-description | weight/package required:true (legacy `@NotNull`); gross≥net check may skip SingleCed group |
| c-010 | about-the-consignment | 2 purpose options; 6 page-object extras excluded as leakage |
| c-015 | commodity-basic-description | H1 wins; `<title>` is a legacy bug |
| c-016 | origin-of-import | H1 wins; `<title>` is a legacy bug |
| c-021 | nominated-contacts | label 'Mobile number' wins for display |
| c-022 | contact-details | label 'Mobile number' wins for display |
| c-025 | lab-tests-commodity-select | action-link (rendered + page object agree) |
| c-029 | record-lab-test-information | 3 conclusion options incl. 'Not interpretable' |

---

## 3. Model gaps (13 — the page-owned model can't express these cleanly)

Carried from last run: `duplicate-origin-country`, `cross-page-conditionality`, `repeating-group-in-repeating-group`, `summary-restatement`, `cross-surface-shared-page`, `shared-page-object-cross-type-leakage` (legacy now confirms the CVEDP-only leakage), `select-driven-conditional-reveal`, `variant-only-primary-buttons`, `inventory-pages-without-specs`.

**New this run (4):**

| Marker | What it is |
|---|---|
| `feature-flag-page-variant` | `about-the-consignment` serves one of two templates by `enableCheddLandbridge`; only one flag state is traced (c-011/c-042). |
| `frontend-vs-model-mandatoriness-divergence` | For CHED-D the frontend Joi enforces more mandatory fields than the backend CED `@NotNull` groups — no CED group on address/contact/document rows (c-038, c-018). |
| `org-level-tenancy` | Ownership/visibility key on the owning **organisation**, not the author — the rebuild must model the owning org as tenant and scope the dashboard by a Current-Organisation context (DoA OWN-1/VIS-1/VIS-2). |
| `delegated-route-absent-for-ched-d` | The delegated-agent apparatus (org selector, tenant switch, Trade Partner badge, org auto-population) is CHEDPP-only and does NOT exist for CHED-D; it must be designed in, not ported (AGT-1/BDG-1/POP-1, c-044). |

---

## 4. Delegated-authority (DoA) model summary

**The single most important caveat: the CHED-D corpus has ZERO DoA traces.** Everything here is adapted from the CHED-PP DoA corpus (the shared IPAFFS authorization layer) and marked per rule for CHED-D applicability. Full detail in `journey-spec.json → authorization` and `authorization-rules.md`.

| Area | Applies to CHED-D? | Confidence | Basis |
|---|---|---|---|
| **OWN-1** org-level ownership (owner = org, not author) | **Yes** | inferred | shared backend/dashboard; CHED-PP DoA confirmed |
| **OWN-2** plain member creates for own org, no delegated marker | **Yes — the only CHED-D creation shape** | inferred | every observed CHED-D create is a plain importer |
| **OWN-3** owner changeable in Draft, fixed at submit | **No as-is** | legacy | CHED-D has no org-selection surface |
| **AGT-1** delegated-agent creation (org selector) | **No** | legacy | `consignment_for.js:34` gates on `type===CHEDPP` |
| **AGT-2** 'Manage trade partners' / 'Address book' chrome | **Yes — CHED-D CONFIRMED** | confirmed | renders for the plain CHED-D importer; it's service chrome, not a create route |
| **VIS-1** same-org members share visibility + full actions | **Yes** | inferred | CHED-D dashboard renders the identical 4-action cluster |
| **VIS-2** 'Current Organisation' context switcher | **Yes** | inferred | dashboard chrome, type-agnostic |
| **VIS-3** delegated-org / cross-org isolation / draft privacy | **No as-is** | legacy | no delegated route for CHED-D |
| **BDG-1** teal 'Trade Partner' badge | **NEVER for CHED-D** | legacy | `notificationList.html:28` requires `type=='CHEDPP' AND agencyOrganisationId` |
| **POP-1** Importer/Consignee/Contact auto-populate from owning org | **No — CHED-D hand-enters** (c-043) | legacy | delegated route only; CHED-D pre-populates Contact from the signed-in account instead |

**Open DoA questions (G-1 … G-6):** is CHEDPP-only a permanent boundary or an incomplete rollout (G-1); do co-member Amend/Copy actions *succeed* not just render (G-2); is draft-privacy deliberate (G-3); badge/`agencyOrganisationId` generalisation if extended (G-4); would a registered-org CHED-D member get auto-population (G-5); CHED-D cross-org isolation is untraced (G-6).

---

## 5. GOV.UK component inventory + non-standard patterns

**Standard components in use** (union across 41 pages; counts = pages using them): Button (41), Heading (40), Fieldset (27), Label (22), Text input (21), Caption (20), Select (18), Hint (15), Back link (14), Form group (12), Radios (11), Table (10), Date input (8), Body text (7), Error summary (7), Details (5), Section break (5), Summary list (5), Warning text (5), Grid (4), Notification banner (4), Panel (4), List (3), Tag (3), File upload (3), Checkboxes (2), Textarea (1), Task list (1), Error message (1). Plus Link (30).

**Non-standard patterns — the "don't port this" list** (120 instances across pages, families):

| Pattern family | GOV.UK alternative |
|---|---|
| `defra-datepicker` / `accessible-datepicker` calendar overlay (8+ pages) | Plain `govuk-date-input` (3 text fields, no calendar) |
| `notification-list` dt/dd result grid + bespoke `pagination` | `govuk-table` / summary card + `govuk-pagination` |
| `link-button` (submit styled as link) + `notification-button` + `clear-link` | `govuk-button` / `govuk-button--secondary` / real link |
| duplicate mobile/desktop DOM (`-desktop`/`-mobile`, shared `name`) | single responsive `govuk-table` |
| `review-summary-list` + `copy-button` + `audit-flag` + `presentation-table` | `govuk-summary-list` (+ `__actions`) |
| `summary-card` (un-prefixed) | `govuk-summary-card` |
| `info-summary` / `alert-dashboard-summary` widgets | summary list / inset text (likely out of scope) |
| `span.heading-tertiary` reference/version folded into the H1 | `govuk-caption-xl` above the H1 |
| `panel--inspection-required` / `notification-banner--inspection-required` with no `govuk-panel__title` (no H1) | standard Panel WITH an H1 |
| `additional-documents` CSS-grid faux-table | `govuk-table` + add-another |
| `region-code` inline ISO-prefix widget | 'Text input with prefix' |
| `govuk-radios__conditional` bound to a `<select>` | radios reveal, or follow-on page |
| commodity-tree drill-down (submit-button chapters, POST-for-nav) | accessible-autocomplete / progressive-enhancement list |
| Date-input markup reused for time (Hour/Minutes) | two text inputs in a fieldset |
| `phase-tag` on task-list; all statuses (incl. 'To do') as coloured tags | `govuk-task-list` default status rendering |
| Error summary repurposed as a non-form 'no match' warning | Warning text / Notification banner |
| `panel panel-border-narrow` (legacy prototype-kit inset) | `govuk-inset-text` |
| `sr-only` (duplicate of `govuk-visually-hidden`) | standardise on `govuk-visually-hidden` |

---

## 6. Five most consequential decisions (this run)

1. **Reversed the legacy-exclusion rule.** Legacy IPAFFS source is now a first-class confidence tier above `inferred`. This is what moved validation coverage from ≈8 to **313/325** and retro-resolved c-017 (the 16 consignor messages are now legitimately `legacy`, not out-of-scope `inferred`). Everywhere legacy carries mandatoriness it is flagged "as the old system had it", so the rebuild can revisit policy.
2. **Folded in the DoA model as a journey-level `authorization` section** — while being explicit that **the entire CHED-D DoA story is inferred** (zero CHED-D DoA traces). Ownership + visibility (OWN/VIS) are adopted as CHED-D requirements-to-verify; delegated-agent creation + the Trade Partner badge (AGT-1/BDG-1) are **excluded** from CHED-D as legacy CHEDPP-only; POP-1 org auto-population is recorded as a non-contradiction against observed CHED-D hand-entry (c-043).
3. **Honoured `confirmed > legacy` on the two disagreements.** Where the current template gates `region-code` OFF for CED yet a trace rendered it (c-037), and where the page object references a confirmation variant that is dead code (c-020), the **rendered** value was kept and the drift logged as a finding — IPAFFS source lagging what it serves is exactly what the precedence rule anticipates.
4. **Let legacy settle three long-open human conflicts** (c-006 package-types 25-canonical; c-014 the 2-option CTC is a separate page; c-030/c-031 the authoritative file allow-list) — and **surfaced a hidden feature-flag variant** (`enableCheddLandbridge`, c-011/c-042) that reframes the point-of-exit obligation as flag-dependent rather than page-object leakage.
5. **Surfaced the systemic frontend-vs-model mandatoriness divergence** (c-038, `frontend-vs-model-mandatoriness-divergence`). For CHED-D the frontend Joi form is the ONLY mandatoriness layer — the backend CED validation group has no `@NotNull` on the address, contact-details, or document-row fields. A rebuild that trusts the persisted model would drop fields the current UI makes mandatory. This is now an explicit rebuild decision, not a silent assumption.

---

## 7. Files

- `journey-spec.json` — the canonical machine-readable spec (41 pages, 283 fields, 325 validation messages with legacy provenance, `authorization` DoA section, 13 modelGaps, 7 journeyBehaviours, `meta` counts).
- `conflicts.json` — the conflict register (39 entries; 26 needsHuman; 8 new; 3 flipped to settled by legacy).
- `authorization-rules.md` — the delegated-authority source artefact folded into the spec.
- `page-inventory.json` — canonical page order (source input).
- `pages/*.json` — the 41 enriched per-page specs (source input).
