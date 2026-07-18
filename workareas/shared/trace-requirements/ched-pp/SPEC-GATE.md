# CHED-PP journey spec — review gate

Regenerated 2026-07-17 from the **enriched** page specs (`pages/*.json`), folding in two new
evidence streams the earlier trace-only pass could not produce:

1. **Legacy IPAFFS source enrichment** — the two authoritative validation layers read first-hand:
   the frontend per-page **Joi** catalogue (`ipaffs-frontend-notification/.../validation/messages/en.js`
   + `labels/en.js`, client-side per-page save) and the backend **Jakarta** submission-model
   catalogue (`ipaffs-notification-microservice/.../ValidationMessages.properties` + the
   `@NotNull`/`@NotEmpty` `NotificationChedppFieldValidation` groups on the schema-java model).
2. **Delegated-authority (DoA) trace findings** — 10 findings under `doa-findings/*.json`, reconciled
   in `authorization-rules.md`, captured as the journey-level **`authorization`** section.

Artefacts: `journey-spec.json` (39 pages, ordered), `conflicts.json` (28 conflicts), this gate.

---

## READ THIS FIRST — the weak parts

The spec is strong on **structure and copy** and now strong on **validation copy**, but three areas
carry real uncertainty and two whole behaviours are asserted from source alone.

- **Two pages are wholly `gap`-confidence** — no rendered trace ever landed on them cleanly:
  - **`notification-hub`** — the task-list hub. 4 of its 7 fields are `gap`, 3 `inferred`; no
    validation messages. It is the spine of the whole journey and the least evidenced page in the set.
  - **`commodity-search`** — page-level `gap`; the manual commodity-code search surface is inferred
    from page objects, with 1 `gap` validation message.
- **Both new behaviours rest on *source only*, with ZERO trace and ZERO QA coverage:**
  - The **overdue-debtor gate** on `import-type` (conflict **c-024**) — and it is not even
    self-consistent in IPAFFS (GET exempts DoA agents, the POST error re-render does not). There is
    no overdue-debtor persona anywhere in the QA repo, so nothing catches it today.
  - The **etag optimistic-concurrency** scheme on ~12 editable pages (modelGap `optimistic-concurrency-etag`)
    — the conflict/stale-token UX and copy are unobserved everywhere.
- **The two validation layers disagree** (conflicts **c-018** copy, **c-019** mandatoriness). Because
  no error-state trace exists, precedence *cannot* pick a winner for c-018 — which string a user sees
  depends on where validation fires first, never observed.
- **Inferred-heavy validation pages** (the messages are legacy-read, not seen rendered):
  `consignor-create` (16 inferred VMs), `commodity-bulk-details` (13), `transport-before-bip` (10),
  `contact-details` (8), `commodity-additional-details` (7). A single targeted error-state trace run
  per page would upgrade most of these `inferred`→`confirmed`.
- **Inferred field surface** (fields believed present but not driven): `cloning-summary` (7),
  `commodity-summary` (4), `commodity-additional-details` (3), `csv-upload` (3 inferred + 2 gap).

---

## Counts

| Metric | This pass | Previous pass |
|---|---:|---:|
| Pages | 39 | 39 |
| Field rows | 354 | 348 |
| Validation-message rows | **310** | 155 |
| Distinct data obligations | ~86 (carried, not recomputed) | 86 |
| Conflicts | 28 (11 new) | 17 |
| Model gaps | 14 (3 new) | 11 |
| GOV.UK component usages catalogued | 383 | — |
| Non-standard patterns catalogued | 279 | — |

---

## Confidence breakdown — the full picture

Taxonomy: **confirmed** (observed rendered in a trace) > **legacy** (read from an authoritative
IPAFFS source, not seen rendered — trustworthy for copy/values; for a *rule* it is "as the old system
had it") > **inferred** (deduced from tests/page-objects) > **gap** (no evidence, a question for a human).

### Pages (n=39)
| confirmed | inferred | legacy | gap |
|---:|---:|---:|---:|
| 23 | 13 | 1 | 2 |

Gap pages: `notification-hub`, `commodity-search`. Legacy page: `nominated-contact`.

### Fields (n=354)
| confirmed | legacy | inferred | gap |
|---:|---:|---:|---:|
| 312 | 7 | 29 | 6 |

Gap fields: `csv-upload` (2), `notification-hub` (4).

### Validation messages (n=310) — the headline improvement
| | confirmed | legacy | inferred | gap | total |
|---|---:|---:|---:|---:|---:|
| **This pass** | 9 | **219** | 74 | 8 | **310** |
| Previous pass | 8 | — | 128 | 19 | 155 |

**Grounded validation coverage moved from 8/155 (~5%) to 228/310 (~74%).** "Grounded" = confirmed
rendered (9) + read from an authoritative source (219 legacy). Only 74 remain inferred and 8 gap.
The 219 legacy messages are trustworthy for **copy**; where a legacy message contradicts another
legacy message across the two validation layers it is booked as a **conflict** (c-018/c-019), not
silently adopted. 8 VM gaps remain, spread thin: `cloning-summary` (2), and one each on
`cloning-search`, `commodity-search`, `commodity-basic-description`, `notifications-dashboard`,
`origin-of-import`, `sign-in`.

---

## Conflict register (28) — needsHuman first

`needsHuman:true` means precedence genuinely cannot settle it, or a content/product/a11y sign-off is
required. Full detail + evidence in `conflicts.json`.

### Needs a human (8) — ALL RULED 2026-07-18 (see `RULINGS.md` / `conflicts.json` `humanRuling`)

> Resolved: c-004 → GDS 'There is a problem'; c-007 → free-standing `isCuc` (provisional); c-013 →
> visible H1; c-014 → fix radios; c-015 → documents MANDATORY; c-018 → frontend Joi voice; c-023 →
> GDS sentence case; c-024 → overdue-debtor gate OUT (report bug to IPAFFS). Scope: DoA out, CUC in,
> cloning out. The table below is the original review framing.

| id | topic | why a human |
|---|---|---|
| **c-004** | Error-summary title 'Please fix the following errors' vs GDS 'There is a problem' | Content-designer sign-off on the deliberate copy change; **QA migration dependency** — the CHED-A guard `ched-a-workflows.ts:505` matches `/fix the following errors/i` and would silently pass a page full of errors if the title changes. |
| **c-007** | What triggers the CUC billing sub-journey (free-standing `isCuc` flag vs derived from the Sevington port) | Both sources are workflow-tier; no trace/assertion pins the server rule. Product/IPAFFS answer needed before wiring the condition. |
| **c-013** | `commodity-input-method` question — visible H1 vs hidden legend ask it differently | Content design must pick one canonical wording. |
| **c-014** | Radio groups have **no accessible name** (empty legend, H1 outside fieldset) — `import-type` +4 | a11y/design lead should confirm the rebuild *fixes* the defect (legend-as-heading) rather than porting it. axe passes — it is a blind spot, not a clearance. |
| **c-015** | Are accompanying documents mandatory for CHED-PP? (`isChedp` = CHED-P, not CHED-PP — a trap) | Neither trace nor test establishes it; product/legal answer required. |
| **c-018** | *(new)* Two-layer validation **copy** divergence — frontend Joi 'Enter/Select the …' vs backend Jakarta 'Add the …', same field | Precedence cannot settle: both legacy, no trace; which the user sees depends on where validation fires first (unobserved). Content design must choose one string per field. |
| **c-023** | *(new)* Upload/AV-failure copy casing — 'could not be uploaded - **T**ry again' vs '- **t**ry again' | Both legacy, neither observed on this page; which constant is wired to the single-file accompanying-document surface is unevidenced. |
| **c-024** | *(new)* **DoA overdue-debtor gate** — exemption applied on GET, dropped on the POST error re-render (locks a permitted DoA agent out of CHED-PP) | Latent IPAFFS bug with zero coverage. Product must decide whether the simple rebuild inherits the gate at all, and how the POST-throw becomes a graceful GDS error. Report the inconsistency to IPAFFS independently. |

### Ruled by precedence (20)

Carried forward: **c-001** (commodity-class is a dropdown, not a page), **c-002/c-003** (page-number
lags are extraction artefacts), **c-005** (rendered CHED labels win over type-constants), **c-006**
(re-entry radio value `import`; flag the id/value/label mismatch), **c-008** (own-org radio label is
dynamic user data), **c-009** ('Date of issue' visible copy wins), **c-010/c-011** (visible
'Postcode or ZIP code' / 'Telephone number' win; fix error copy), **c-012** ('Republic of Ireland'
wins), **c-016** (dedupe 'Sea waybill'), **c-017** (billing button 'Continue' visible wins).

New this wave: **c-019** (mandatoriness split reconciled as draft-save-lenient / submit-strict →
`required:true`), **c-020** (mobile field named three ways — rendered 'Mobile number' wins, fix error
copy), **c-021** (rendered `required=false` file input is not optional — server enforcement is the
requirement), **c-022** ('The selected file is empty' wins; the ipaffs-release-tests feature file is
stale), **c-025** ('Manage trade partners'/address-book are service chrome, **not** agent-gated),
**c-026** (dashboard country list is real `<optgroup>`s flattened by the a11y tree — model the
groups), **c-027** (status casing — adopt one GDS-sentence-case vocabulary), **c-028** (cancel-link
`/notification/vnet` prefix is a deployment artefact, not semantic).

---

## Model gaps (14)

The page-owned spine cannot express these; recorded as findings for the rebuild's architecture.

**Carried forward (11):** `cross-page-conditionality`, `nested-repeating-groups`,
`branch-replacement` (CSV replaces the 3 manual commodity pages), `one-question-split-across-pages`
(consignment-for + consignment-organisation), `same-page-multiple-states` (hub/review/accompanying/
confirmation), `id-flip-draft-to-ched`, `separate-app-boundary` (the `/upload/` app + the whole BIP
inspector decision app), `control-type-varies-by-data`, `at-least-one-of-siblings` (email OR mobile),
`reference-data-truncation`, `uncovered-surface-findings`.

**New this wave (3):**
- **`optimistic-concurrency-etag`** — a hidden `etag` (quoted HTTP ETag, 16–18 chars) round-tripped
  through ~12 editable pages; IPAFFS version-checks the draft on write. The stale-token conflict UX
  and copy are a **GAP everywhere** (zero trace, zero QA). The rebuild must take a deliberate
  concurrent-edit decision; silently dropping it is a behaviour change, not a simplification.
- **`two-layer-validation`** — frontend Joi (per-page save, often `.allow('').optional()`) vs backend
  Jakarta `@NotNull` groups (submission). They disagree on copy (c-018) and mandatoriness (c-019).
- **`delegated-authority-model`** — org-level ownership, membership-scoped visibility, and owning-org
  auto-population are cross-page, server-enforced behaviours the pages assume; the rebuild must own an
  authorization/tenancy layer (see below). Six open questions remain (G-1..G-6).

---

## Open questions — deduped clusters

780 raw `openQuestions` across the page specs collapse into these themes (highest-priority first):

1. **Negative-path coverage is absent by construction.** The QA suite treats a rendered error summary
   as a *thrown test failure* (`ched-a-workflows.ts:506-509`), so no page has negative-path coverage.
   Every one of the 74 inferred + the composed VMs would be settled by a targeted error-state trace run.
2. **The overdue-debtor gate** (c-024) — inherit it at all? graceful error for the POST throw? and
   report the GET/POST inconsistency to IPAFFS.
3. **Concurrent edits** — what does the rebuild do on a stale draft (etag)? conflict copy + recovery.
4. **CUC billing trigger** (c-007) — free-standing flag or Sevington-derived?
5. **DoA questions G-1..G-6** — which member becomes the Responsible person; badge lifecycle on
   member amend/copy; whether a non-author's Amend/Copy actually *succeeds*; is draft-privacy
   deliberate; the ≥8-delegation select variant; collapse the two-page own-vs-delegated split?
6. **Error-summary copy + a11y** (c-004, c-014) — adopt 'There is a problem' and legend-as-heading.
7. **Reference data to source** — country/BCP/inspection-premises/package-type/document-type lists,
   with the country `<optgroup>` grouping modelled explicitly (c-026).
8. **Vestigial surface** — `?source=dashboard` query param; dead button `value` attributes; the
   dual DRAFT/CHEDPP id URL scheme; bespoke cookie banner (implied-consent, no Reject — a compliance
   decision being made by default).
9. **Uncovered surface** — gms-declaration, the consignee sub-journey, origin-of-import's three
   yes/no questions, the successful clone path, the BIP inspector decision app.

---

## GOV.UK component inventory

Distinct components in use (usage counts across the 39 pages):

| Component | uses | | Component | uses |
|---|---:|---|---|---:|
| Button | 40 | | Warning text | 7 |
| Heading | 28 | | List | 6 |
| Back link | 27 | | Details | 5 |
| Link | 25 | | Body | 4 |
| Caption | 22 | | Breadcrumbs | 4 |
| Form group | 22 | | Checkboxes | 4 |
| Label | 19 | | Date input | 4 |
| Text input | 18 | | Notification banner | 4 |
| Fieldset | 17 | | Error message | 3 |
| Error summary | 15 | | Inset text | 3 |
| Hint | 15 | | Section break | 3 |
| Select | 13 | | Summary list | 3 |
| Grid | 11 | | Tag | 3 |
| Radios | 10 | | File upload | 2 |
| Visually hidden | 10 | | Panel | 2 |
| Body text | 9 | | Phase banner | 2 |
| Table | 9 | | Tabs | 2 |

Also present: Button group, Footer, Header, Optgroup, Service navigation, Skip link, Task list,
Typography/spacing utilities. All are standard GDS components — the rebuild can stay inside the
govuk-frontend toolbox for the visible surface.

### Non-standard patterns (279 catalogued) — recurring themes

- **Empty fieldset legend + H1 outside the fieldset** → radio groups with no accessible name (c-014).
  The shared `govuk/radios` partial already supports the correct pattern; this is per-page misuse.
- **Error-summary fallback title** 'Please fix the following errors' instead of 'There is a problem' (c-004).
- **Bespoke cookie banner** (`.global-cookie-message`) with implied-consent copy and no Reject — not
  the GDS Cookie banner component; a compliance decision, likely superseded by the CDP platform banner.
- **`.navigation-links` custom BEM chrome** wrapping a back link with `href="#"` — inert without JS.
  GDS wants a real href in `beforeContent`.
- **`role="alert"` on non-live containers** and a borrowed `govuk-error-summary__body` class in the
  overdue-debt disclosure — markup smells the rebuild should not copy.
- **Hidden `etag` / `crumb`** infrastructure fields the rebuild must not mistake for data.
- **Server-generated radio/checkbox lists** (`createCertificateTypes`, `isSpeciesACheckbox`) — hidden
  business logic a naive port would miss.

---

## Delegated-authority (DoA) model — summary

The new `authorization` section in `journey-spec.json` captures who owns, sees and auto-populates a
CHED-PP. All statements are **confirmed** from DoA traces unless noted.

- **Ownership is org-level, not author-level** (OWN-1): a CHED-PP is owned by the org it was created
  *for*, enforced server-side. A member creating in their own right owns it via their org, with no
  Trade Partner badge (OWN-2). Ownership is fixed at submit but changeable while Draft (OWN-3).
- **Delegated agents** may create for any org they hold authority over (AGT-1, rendered as radios on
  `consignment-organisation`) or for their own org (AGT-2, chosen on `consignment-for`). The two-step
  org selector is the **only** delegated-only surface (AGT-4) — 'Manage trade partners' and the
  address book are service chrome shown to everyone (AGT-3 / conflict c-025).
- **Visibility follows org membership** (VIS-1..6): agent-submitted notifications are visible to the
  owning org's members *and* the agent, with the **same** action set (no read-only downgrade, CAP-1);
  cross-org isolation holds (VIS-3); a **draft is private to the agent** until submit (VIS-4); the
  dashboard is scoped by a **Current-Organisation context switcher** (VIS-6).
- **Trade Partner badge** (BDG-1): a teal dashboard tag when `type=='CHEDPP' AND agencyOrganisationId`
  is set — i.e. agent-on-behalf-of; absent for own-org/member-created.
- **Owning-org auto-population** (POP-1..4): **Importer**, **Consignee** and the **Responsible-person
  contact** are auto-populated from the owning org (the agent never types them); only the **Consignor**
  is hand-entered.
- **Open (G-1..G-6):** which member becomes Responsible person; badge lifecycle on member amend/copy;
  whether a non-author's Amend/Copy *succeeds*; draft-privacy intent; the ≥8-delegation select
  variant; whether to collapse the two-page own-vs-delegated split.

**Rebuild consequence:** this is a tenancy/authorization layer the pages assume but cannot express.
It must be built deliberately, server-enforced, not reconstructed field-by-field from the journey.

---

## The 5 most consequential decisions

1. **Own a delegated-authority / tenancy layer.** Org-level ownership (OWN-1), membership-scoped
   visibility with a current-org switcher (VIS-1..6), and owning-org auto-population of
   Importer/Consignee/Responsible-person (POP-1..3) are server-enforced cross-page behaviours. The
   simple rebuild must implement this as a first-class layer, not infer it from the page flow —
   getting it wrong is a data-isolation (security) failure, not a cosmetic one.
2. **Reconcile the two validation layers (c-018/c-019).** Ship **one** copy string and **one**
   mandatoriness per field, and decide whether to keep IPAFFS's two-stage *save-lenient / submit-strict*
   model or validate once. Today the frontend Joi and backend Jakarta layers disagree on both, and no
   trace can pick a winner — this is a content + architecture decision, not a port.
3. **Fix, don't port, the radios accessibility defect (c-014).** Adopt the standard GDS
   legend-as-heading composition (H1 inside the fieldset legend, caption above) across `import-type`,
   `consignment-for`, `consignment-organisation`, `about-the-consignment`, `sign-in`. axe's green run
   is a blind spot; the missing group name is real.
4. **Do NOT inherit the overdue-debtor gate as-is (c-024).** It is a latent IPAFFS bug (GET exempts
   DoA agents, the POST error re-render does not) with zero coverage. Decide whether the CHED-PP
   rebuild needs the gate at all; if so, derive the flag once per request, never render a permitted
   option disabled, and give the POST-throw a graceful GDS error page. Report the bug to IPAFFS.
5. **Adopt GDS-standard error handling and take a deliberate concurrency decision.** Use 'There is a
   problem' everywhere (c-004 — noting the QA guard that will silently stop matching), and make an
   explicit choice on optimistic-concurrency (the `etag` scheme): keep version-checking on write with
   a proper conflict UX, or drop it knowingly. Both are silent requirements the legacy app encodes and
   a naive simplification would quietly break.
