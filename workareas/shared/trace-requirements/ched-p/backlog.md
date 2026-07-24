# CHED-P — build backlog (SUPPLEMENTARY re-run)

**Generated:** 2026-07-24 from the enriched `journey-spec.json` first, then `conflicts.json`, `SPEC-GATE.md`, `target-model.md`, `integrations.md`, `authorization-rules.md`, `iuu-boundary-findings.md` and the CHED-PP backlog exemplar.

A CDP-based CHED-P notifier built like trade-imports-animals: server-rendered journey pages build one CVEDP Notification JSON document and persist it wholly to Mongo. The first pass is the manual own-organisation journey through submission confirmation; validations are legacy-grounded and later delegated-authority/variant work is explicitly separated.

- **9 milestones**, **108 increments**: **34 todo**, **74 born blocked**.
- The 40 canonical create pages remain one page increment each in order; **32** explicit add-validation increments use the enriched legacy/confirmed catalogue.
- ⛔ means born blocked with `gate: "sam"`; the question is recorded and the ruling is not authored.

## Milestones

| id | Milestone | Goal |
|---|---|---|
| m0 | Scaffold & persistence spine | A CDP-style CHED-P service, one resumable Notification JSON document, whole-document Mongo persistence, a page-owned journey spine and the task-list hub engine. |
| m1 | Reference data | Independent server-side fixtures/clients for countries, non-fish commodity codes, non-fish species/types, BCPs, package types, approved establishments and document types. |
| m2 | Model-extension gates | Human-approved executable policies for restatements, routing, commodity collections, risk, validation lifecycle, concurrency and shared-page variants before the first consuming page. |
| m3 | Journey entry & consignment basics | Dashboard through the task-list hub in canonical order, including origin, commodity selection/add-another, purpose, risk and health-certificate routing. |
| m4 | Commodity details & documents | Per-commodity POAO weights/packages, consignment temperature, health-certificate metadata, upload stub, accompanying documents and approved establishments. |
| m5 | Traders | Consignor, consignee, importer and destination selection/creation using verified address fields and hub loops. |
| m6 | Transport, contacts, review & submit | Transport, goods movement, transporter, responsible/nominated contacts, contact address, review, declaration and Mongo-backed submission confirmation. |
| m7 | Delegated authority & ownership (later) | A separate later DoA milestone for assigned organisation, on-behalf-of ownership, auto-population, Trade Partner marking and organisation-scoped visibility under AUTH-01..AUTH-12. |
| m8 | Other later variants | CUC billing, CSV bulk upload, Article 72 low-risk and split-consignment candidates after the manual own-organisation first pass. |

## Scope and sequencing

- POST-SUBMISSION is OUT of scope: notification-search-view, attachments-tab, BIP/inspector documentary/identity/physical/laboratory/decision pages, risk override/replacement, OV/control, border-notification pages, amend-notification-hub and delete-notification-confirmation are not increments.
- FISH/IUU is OUT of scope: catch-certificate-needed, attach-catch-certificate and add-catch-certificate-details are excluded; HS chapter 03, fish sub-codes in mixed chapters and fish species including Anguilla are rejected by CHED-P reference data, per iuu-boundary-findings.md.
- CLONING is an out-of-scope candidate under needsHuman c-006. clone-certificate-type, clone-search and the HTTP 406 fallback are evidence only; no working clone increment is promised.
- Live file bytes/antivirus, reusable address-book integrations, live risk, Trade Charge, PDF, SOAP, events, Notify, live GVMS/NCTS, Defra ID and Dynamics are deferred. First pass uses metadata, fixtures or deterministic stubs as stated.

- m0 lands first in this order: skeleton, Notification JSON + Mongo persistence, page-owned journey spine, task-list hub engine. m1 reference-data clients can then proceed independently.
- m2 model-extension gates precede every first page that consumes the corresponding unresolved modelGap. A later increment may depend on a blocked predecessor without receiving a second gate unless its own acceptance criteria consume unresolved evidence.
- Canonical create pages remain in journey order 0..39. A page-specific add-validation increment follows each page with grounded validation evidence; pure interstitial gap placeholders do not become invented validation work.
- The commodity collection is deliberately split across reference data, collection model, add/edit/remove loop, search, type/species selection, per-line weights/packages and consignment temperature.
- The first pass ends when declaration changes the Mongo-backed notification to SUBMITTED and confirmation renders. m7 delegated authority and m8 CUC/CSV/Article-72/split work are later.
- Every blocked increment has gate "sam" and states an open question; no human ruling is authored.

## Deliberate adaptations

- Use govuk-frontend/CDP patterns and clean routes; do not reproduce bespoke IPAFFS CSS widgets, duplicated responsive DOM, JavaScript-history Back links or the legacy datepicker overlay.
- Persist one complete Notification document per save. Do not reproduce IPAFFS JSON Patch or browser ETag fields; concurrency/recovery is explicitly gated before consuming pages.
- Use stable Mongo/business identity. Submission changes status rather than replacing the document or breaking accompanying-document joins.
- Store reference codes/opaque ids and minimal snapshots, never display labels as identity.
- Legacy validation copy is implemented at its recorded trigger only after the validation-lifecycle ruling; gap copy is never invented.
- Exactly 10 MiB is accepted (settled c-015) and region code is capped at 3 characters (settled c-011); the known contradictory legacy hints are repaired.

## Increments

### m0 — Scaffold & persistence spine

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-001 | Scaffold the CDP CHED-P app | scaffold | M | todo | — |
| inc-002 | Notification JSON document and Mongo persistence | persistence | L | todo | inc-001 |
| inc-003 | Session, page-owned routing and draft-resume spine | scaffold | M | todo | inc-002 |
| inc-004 | Task-list hub engine and section contract | scaffold | M | todo | inc-003 |

#### inc-001 — Scaffold the CDP CHED-P app

**Status:** todo · **Size:** M · **Depends on:** none

Acceptance criteria:

- A Node.js service is scaffolded in the trade-imports-animals house style with hapi, Nunjucks, govuk-frontend, unit/integration test commands and a GET /health route.

- A shared GOV.UK page template renders the service name, Beta phase banner, CDP cookie banner, main landmark, real-href govuk-back-link slot and govuk-button/link components without IPAFFS bespoke CSS widgets.

- GET /notifications renders an authenticated-development entry route and GET /notifications/create starts the CHED-P journey; the development identity is fixed locally and no live Defra ID dependency is required.

- Automated smoke tests prove the service starts, /health returns success and an unknown route renders a GOV.UK-styled 404.

#### inc-002 — Notification JSON document and Mongo persistence

**Status:** todo · **Size:** L · **Depends on:** inc-001

Acceptance criteria:

- A Mongo collection named notification stores one target-model.md Notification document with stable id/referenceNumber, status DRAFT|SUBMITTED|AMEND|DELETED, chedType CVEDP, ownership, origin, commodity, purpose/risk, parties, transport, contacts, billing, declaration and audit timestamps; drafts may omit page-owned properties.

- CommodityLine, ApprovedEstablishment, Operator, Address, Transporter, Contact, Container and BillingAddress use the target-model.md shapes; draft properties may be absent until their page is saved.

- A separate accompanying_documents collection stores AccompanyingDocument metadata keyed by notificationReferenceNumber; scanner-managed file state is never accepted in a notification page payload.

- The first durable save creates a stable business reference and own-organisation ownership context; every later page save replaces the complete document rather than issuing JSON Patch operations.

- Repository tests prove create/read/whole-document-update, draft rehydration, unique sparse referenceNumber indexing and accompanying-document lookup; stale-save behaviour is added only after the inc-020 concurrency ruling.

_Notes: First pass persists the complete JSON document to Mongo. Legacy JSON Patch and ETag wire contracts are not reproduced._

#### inc-003 — Session, page-owned routing and draft-resume spine

**Status:** todo · **Size:** M · **Depends on:** inc-002

Acceptance criteria:

- Each successful page POST normalises its page-owned answers into session state, rebuilds the complete Notification JSON and wholly saves it to Mongo; reopening a draft rehydrates the journey from Mongo.

- A route registry records canonical page order 0–39, conditional branches, real-href Back destinations, Save and continue, Save and return to hub and Cancel and return to hub destinations.

- Every validation failure uses govuk-error-summary and govuk-error-message with links to fields. Only copy confirmed or inferred in journey-spec.json is asserted verbatim; gap-confidence validation copy is not invented.

- Radios and checkboxes use govuk-fieldset with a meaningful legend; page captions use govuk-caption-xl and primary headings use govuk-heading-xl unless the verified page component says otherwise.

#### inc-004 — Task-list hub engine and section contract

**Status:** todo · **Size:** M · **Depends on:** inc-003

Acceptance criteria:

- A single section registry supplies task-list labels, routes, applicability and status derivation for the canonical create journey; business task status is derived from the Mongo document and is not persisted.

- The engine can render the verified legacy status vocabulary exactly as "Started", "To do" and "Expired", using the GOV.UK task-list pattern and aria-describedby links.

- The hub shell supports real-href section navigation plus "Save and return to hub" without creating a second routing graph.

- Unit tests prove section ordering, status derivation and draft-resume behaviour with a minimal own-organisation notification; conditional availability remains behind the model gates in m2.

### m1 — Reference data

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-005 | Countries and territories reference data | reference-data | S | todo | inc-001 |
| inc-006 | Non-fish CHED-P commodity-code reference data | reference-data | M | todo | inc-001 |
| inc-007 | Non-fish commodity type and species reference data | reference-data | M | todo | inc-006 |
| inc-008 | BCP, port-of-entry and control-point reference data | reference-data | M | todo | inc-001, inc-005 |
| inc-009 | CHED-P package-type reference data | reference-data | S | todo | inc-001 |
| inc-010 | Approved-establishment reference data | reference-data | M | todo | inc-001, inc-005, inc-006 |
| inc-011 | CHED-P document-type reference data | reference-data | S | todo | inc-001 |

#### inc-005 — Countries and territories reference data

**Status:** todo · **Size:** S · **Depends on:** inc-001

Acceptance criteria:

- A server-side countries client serves the verified CVEDP country/territory fixture: 253 choices plus the page placeholder, stored by code rather than label.

- The fixture includes GB-ENG, GB-SCT, GB-WLS and GB-NIR and supports country-of-origin, country-of-consignment, purpose destination, transit countries, addresses and establishment filters.

- Country selects render their page-specific prompts exactly: "Select a country", "Select country from where consigned", "Select destination country", "Select transited country" and "Please select your country".

- Tests prove an entered code round-trips through Mongo and an unknown code is rejected server-side.

#### inc-006 — Non-fish CHED-P commodity-code reference data

**Status:** todo · **Size:** M · **Depends on:** inc-001

Acceptance criteria:

- A server-side CVEDP commodity client serves a small hierarchical fixture supporting typed-code search and chapter-tree browsing, including 0204100010 "Of domestic lamb".

- The captured 36 top-level chapter labels are the evidence baseline, but every HS chapter 03 code is excluded from CHED-P and mixed chapters such as 16 exclude fish sub-codes while retaining meat sub-codes, as required by iuu-boundary-findings.md and c-003.

- The client returns stable commodity codes and descriptions; user-facing labels are never used as stored identifiers.

- Tests prove 0204100010 resolves, 03019230 and any chapter-03 code are rejected from CHED-P, and a seeded meat sub-code in chapter 16 remains eligible.

#### inc-007 — Non-fish commodity type and species reference data

**Status:** todo · **Size:** M · **Depends on:** inc-006

Acceptance criteria:

- A selected commodity code resolves its allowed type and biological-species choices; the seed maps 0204100010 to "Domestic" (code 16) and "Ovis aries" (code 1736900).

- Species and type are stored by stable code. Codes with no type or species can return an empty list without inventing a selection.

- Fish values including Anguilla anguilla and Anguilla spp. are excluded from the CHED-P client and handed to IUU, per iuu-boundary-findings.md and c-004.

- Tests prove type/species choices are commodity-dependent and a species code cannot be saved against the wrong commodity.

#### inc-008 — BCP, port-of-entry and control-point reference data

**Status:** todo · **Size:** M · **Depends on:** inc-001, inc-005

Acceptance criteria:

- A server-side BCP client serves CVEDP port and exit/control-point fixtures by stable code, including GBBRS, GBSEV, GBFXT, GBLHRA, GBTIL and test-asserted GBHLY.

- The port-of-entry query supports the verified origin-dependent branches for EU, Northern Ireland and rest-of-world consignments instead of hardcoding one universal 34-option page list.

- The exit-BCP query can represent the verified 34/40-option source drift; c-001 is honoured by sourcing current eligibility rather than freezing the trace list.

- Tests prove an ineligible BCP is rejected for the selected origin and that display labels are resolved from codes.

#### inc-009 — CHED-P package-type reference data

**Status:** todo · **Size:** S · **Depends on:** inc-001

Acceptance criteria:

- The package-type client returns exactly the verified placeholder plus 26 active labels: Bag, Bale, Balloon Protected, Block, Box, Can, Carton, Case, Cask, Coffer, Container, not otherwise specified as transport equipment, Crate, Drum, In Bulk, Jar, Other, Package, Pail, Pallet, Pallet Box, Polystyrene Box, Tank, Tote, Tray, Tube and Vial.

- Each option has a stable stored code and a display label; the page never persists the label as identity.

- Tests prove all 26 active options render once and an unknown package-type code is rejected.

#### inc-010 — Approved-establishment reference data

**Status:** todo · **Size:** M · **Depends on:** inc-001, inc-005, inc-006

Acceptance criteria:

- A server-side establishment client provides paged search results and the verified filter vocabularies: Country, Name, Approval number, Section, Type, Status and Sort by.

- The fixture returns at least one non-fish establishment with opaque establishmentId, name, countryCode, typeCode and approvalNumber, plus the only confirmed status option "Approved".

- Selecting an opaque id resolves and snapshots the five target-model.md fields in approvedEstablishments[]; ids are not parsed.

- Tests prove country filtering, paging, selection and duplicate-id rejection.

#### inc-011 — CHED-P document-type reference data

**Status:** todo · **Size:** S · **Depends on:** inc-001

Acceptance criteria:

- The document-type client returns exactly the verified placeholder plus 13 active choices: Veterinary health certificate, Air waybill, Bill of lading, Commercial invoice, Customs declaration, Import permit, Laboratory Sampling results for Aflatoxin (Reg 2019/1793), Letter of authority (Directive 2008/61/EC), Processing statement, Proof of storage, Rail waybill, Sea waybill and Other.

- Catch certificate is not present: it belongs to the separate IUU journey.

- Each document type has a stable stored code; tests prove all 13 active choices render and round-trip.

### m2 — Model-extension gates

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-012 ⛔ | Derived/restated-value model extension | model-extension | M | blocked | inc-002, inc-005 |
| inc-013 ⛔ | Cross-page conditional routing model extension | model-extension | L | blocked | inc-002, inc-003, inc-005, inc-008 |
| inc-014 ⛔ | Commodity collection and repeated-row model extension | model-extension | L | blocked | inc-002, inc-006, inc-007, inc-009 |
| inc-015 ⛔ | Commodity add-another, edit and remove loop | model-extension | M | blocked | inc-014 |
| inc-016 ⛔ | Computed and selected risk-category model extension | model-extension | M | blocked | inc-002, inc-015 |
| inc-017 ⛔ | Contactability and partial-row constraint extension | model-extension | S | blocked | inc-002 |
| inc-018 ⛔ | Submission outcome/status adapter extension | model-extension | M | blocked | inc-002, inc-013 |
| inc-019 ⛔ | Draft-save and final-submit validation lifecycle | model-extension | M | blocked | inc-002, inc-003 |
| inc-020 ⛔ | Whole-document concurrency and stale-save recovery | model-extension | M | blocked | inc-002, inc-003 |
| inc-021 ⛔ | Shared-page variant and inferred-control boundary | model-extension | M | blocked | inc-003 |

#### inc-012 ⛔ — Derived/restated-value model extension

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-002, inc-005

**Open question:** MODEL GAP "summary-restatement-linkage" and c-028: confirm canonical source paths and the blank-display policy for review/confirmation restatements. Do not author the ruling.

Acceptance criteria:

- After a ruling, define one canonical source path for values restated across origin, review and confirmation; a restatement cannot create a second conflicting business value.

- Country of origin is stored once at origin.countryCode and re-rendered on origin-of-import and review; review rows read country, risk and port values from canonical paths.

- Server-derived CHED/customs references are read-only and rejected if posted by a browser.

- Persistence tests prove saving a restatement page cannot fork the canonical value and blank display follows the approved policy.

#### inc-013 ⛔ — Cross-page conditional routing model extension

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-002, inc-003, inc-005, inc-008

**Open question:** MODEL GAP "cross-page-conditionality": define executable purpose/Transit, risk/health-certificate, origin/POE, onward-transport, CTC/GVMS and CUC rules plus answer-change cleanup. Do not author the ruling.

Acceptance criteria:

- After a ruling, encode a table-driven routing/clearing matrix for purpose branches, health-certificate applicability, origin-dependent POEs, onward transport, CTC/GVMS and CUC eligibility.

- Changing a controlling answer removes now-inapplicable child values from the Notification before whole-document save.

- The route registry answers both next-page navigation and task-list availability from the same rule set.

- Tests cover every accepted branch, Back/resume behaviour and answer-change cleanup.

#### inc-014 ⛔ — Commodity collection and repeated-row model extension

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-002, inc-006, inc-007, inc-009

**Open question:** MODEL GAPS "repeating-group-in-repeating-group" and "commodity-dependent-reference-data-and-scope": confirm the CommodityLine grain, stable row identity, reference-data joins, cardinality and aggregation. Do not author the ruling.

Acceptance criteria:

- After a ruling, commodity.commodityComplement[] uses stable uniqueComplementId identities and the accepted grain: commodityCode, type/class/family codes, species[], netWeight, numberOfPackages and packageTypeCode.

- Selecting several species expands according to the approved row/species grain; a code with no species can still create the approved line shape.

- Gross weight and temperature remain consignment-level; net weight and package totals are derived from commodity rows.

- The repeated-row infrastructure supports documents and nominated contacts without parsing array indexes from field names.

- Round-trip tests cover two codes, multiple species, edit-one-row isolation, totals, removal and non-fish reference-data enforcement.

#### inc-015 ⛔ — Commodity add-another, edit and remove loop

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-014

**Open question:** MODEL GAP "unexercised-multi-commodity-loop": the corpus submits one commodity and answers No. Confirm the non-fish add-another upper bound, remove/re-entry behaviour and cross-commodity risk aggregation. Do not author the ruling.

Acceptance criteria:

- After a ruling, selecting Yes on commodity-basic-description returns to search without losing saved CommodityLine rows; selecting No advances to purpose.

- Editing or removing one row uses uniqueComplementId and cannot overwrite a sibling commodity/species row.

- At least two commodity codes and two species can round-trip through whole-document Mongo persistence, with deterministic ordering and derived totals.

- Changing/removing a commodity recomputes dependent risk/establishment state according to the accepted cleanup rule and never introduces IUU values.

#### inc-016 ⛔ — Computed and selected risk-category model extension

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-002, inc-015

**Open question:** c-027, page-confidence gap and MODEL GAP "risk-category-computed-versus-selected": decide whether a user may select below the computed highest category and what validation/routing follows. Do not author the ruling.

Acceptance criteria:

- After a ruling, persist the user answer at risk.selectedCategory and keep risk.computedHighestCategory server-derived/read-only.

- The browser cannot alter the computed highest category through a hidden field.

- Routing to health-certificate pages and task availability uses the approved relationship between selected and computed category.

- Tests cover High, Medium and Low plus the approved behaviour when selection differs from the computed maximum.

#### inc-017 ⛔ — Contactability and partial-row constraint extension

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-002

**Open question:** MODEL GAP "at-least-one-of-sibling-fields": confirm email/telephone rules for responsible person, nominated contacts and later CUC billing, including partial-row handling. Do not author the ruling.

Acceptance criteria:

- After a ruling, one reusable server-side rule validates the approved relationship between email and telephone without accidentally making both mandatory.

- The rule applies independently to responsiblePerson, each nominatedContacts row and later billing contact details.

- Tests cover neither, email-only, telephone-only, both and a partially entered repeating row using the approved outcomes and exact copy.

#### inc-018 ⛔ — Submission outcome/status adapter extension

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-002, inc-013

**Open question:** MODEL GAP "external-outcome-and-status-variants": decide which deterministic first-pass confirmation outcomes are supported. Inspector/decision state remains outside this service. Do not author the ruling.

Acceptance criteria:

- After a ruling, declaration submission calls a deterministic local risk adapter and stores only the approved server-derived confirmation result; no inspector/decision state enters the create document.

- The confirmation presenter maps the stored result to approved status/guidance variants and rejects outcome fields posted by a browser.

- Tests cover every approved first-pass confirmation outcome and reject unsupported external status transitions.

#### inc-019 ⛔ — Draft-save and final-submit validation lifecycle

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-002, inc-003

**Open question:** MODEL GAP "two-layer-validation" and c-038: choose the rebuild lifecycle and one user-facing string where legacy page-save Joi and final CHED-P model validation differ. c-039 confirms the triggers differ; it does not choose the rebuild copy. Do not author the ruling.

Acceptance criteria:

- After a ruling, one validation catalogue marks every rule as page-save, final-submit or both and maps it to one approved user-facing message.

- Partial drafts remain persistable only to the extent allowed by the accepted lifecycle; final submission rejects every missing legacy submission obligation listed in target-model.md.

- For c-038 pages, tests demonstrate the chosen copy at the chosen trigger and preserve the alternate legacy string as evidence only, not a second simultaneous error.

- The same rule catalogue drives inline govuk-error-message content, linked govuk-error-summary entries and final submission checks.

#### inc-020 ⛔ — Whole-document concurrency and stale-save recovery

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-002, inc-003

**Open question:** MODEL GAP "optimistic-concurrency-etag" and target-model.md Open Q20: confirm version/CAS policy and the user-visible recovery route/copy for a stale long-journey or multi-tab save. Do not reproduce legacy ETag wire fields or invent the ruling.

Acceptance criteria:

- After a ruling, the Mongo repository and page-save contract implement the accepted whole-document concurrency policy without JSON Patch or browser-trusted ETags.

- If compare-and-swap is retained, a stale replace cannot overwrite newer data and returns a deterministic, accessible recovery page or message using approved copy.

- Tests cover two concurrent sessions, successful retry/reload and preservation of accompanying-document joins and stable notification identity.

#### inc-021 ⛔ — Shared-page variant and inferred-control boundary

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-003

**Open question:** MODEL GAPS "shared-page-variant-alias" and "shared-page-object-cross-type-leakage": confirm which inferred shared controls can render for CHED-P and keep transit-exit-bcp as a same-page facet rather than a second URL. Do not author the ruling.

Acceptance criteria:

- After a ruling, the route registry treats transit-exit-bcp as conditional fields on about-the-consignment and counts/persists each obligation once.

- Unrendered shared controls such as number of animals, feedingstuff and Transporter No/Select remain absent unless explicitly accepted for CHED-P.

- Variant projection tests prove CHED-A/CHED-D/CHED-PP-only fields cannot be posted into a CHED-P Notification.

### m3 — Journey entry & consignment basics

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-022 | notifications-dashboard page | page | M | todo | inc-004 |
| inc-023 | Add notifications-dashboard validation | validation | S | todo | inc-022 |
| inc-024 | import-type page | page | S | todo | inc-022 |
| inc-025 | Add import-type validation | validation | S | todo | inc-024 |
| inc-026 | country-of-origin page | page | S | todo | inc-024, inc-005 |
| inc-027 ⛔ | Add country-of-origin validation | validation | S | blocked | inc-026, inc-019 |
| inc-028 ⛔ | origin-of-import page | page | M | blocked | inc-026, inc-005, inc-021 |
| inc-029 ⛔ | Add origin-of-import validation | validation | S | blocked | inc-028, inc-019 |
| inc-030 ⛔ | search-commodity page | page | L | blocked | inc-028, inc-006, inc-014, inc-015 |
| inc-031 ⛔ | Add search-commodity validation | validation | S | blocked | inc-030, inc-014, inc-015 |
| inc-032 ⛔ | commodity-basic-description page | page | M | blocked | inc-030, inc-007, inc-014, inc-015 |
| inc-033 ⛔ | Add commodity-basic-description validation | validation | S | blocked | inc-032, inc-014, inc-015 |
| inc-034 ⛔ | about-the-consignment page | page | L | blocked | inc-032, inc-005, inc-008, inc-013, inc-021 |
| inc-035 ⛔ | Add about-the-consignment validation | validation | M | blocked | inc-034, inc-013 |
| inc-036 ⛔ | select-risk-category page | page | M | blocked | inc-034, inc-013, inc-016, inc-015 |
| inc-037 ⛔ | Add select-risk-category validation | validation | S | blocked | inc-036, inc-016, inc-013, inc-015 |
| inc-038 ⛔ | health-certificate-required page | page | S | blocked | inc-036, inc-013, inc-016 |
| inc-039 ⛔ | notification-hub page | page | M | blocked | inc-038, inc-016, inc-018 |

#### inc-022 — notifications-dashboard page

**Status:** todo · **Size:** M · **Depends on:** inc-004

Acceptance criteria:

- H1 reads exactly "Your import notifications" using govuk-heading-xl and the primary entry action reads exactly "Create a new notification".

- The first-pass dashboard lists the current own organisation’s CHED-P drafts/submissions with Reference number, Commodity, Arrival at BCP or POE, CHED status, Consignee, Consignor, Origin and Inspection; use a stock govuk-table or govuk-summary-card pattern rather than the legacy notification-list CSS.

- Search controls are labelled exactly "Keywords or notification number", "Commodity", "BCP or POE", "Status", "Country of origin" and "Consignee / Importer"; date shortcuts are exactly ["Today", "Tomorrow", "Next seven days", "Clear date range"], followed by "Search" and "Clear".

- CHED-A-only "Microchip number", "Clone a certificate", split-consignment actions and post-submission inspector alerts are absent from the CHED-P first pass.

- Selecting "Create a new notification" routes to import-type.

#### inc-023 — Add notifications-dashboard validation

**Status:** todo · **Size:** S · **Depends on:** inc-022

Acceptance criteria:

- Server-side, table-driven tests cover all 8 grounded validation rows for notifications-dashboard in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Some of your notification details are missing or do not match the customs declarations. These consignments may be delayed.", "\"Search\" must be 255 characters or less", "\"Commodity\" must be 255 characters or less", "\"Consignee\" must be 255 characters or less".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

- The CHED-A-only Microchip number rule is not implemented; a regression test proves that filter is neither rendered nor accepted by the CHED-P search endpoint.

#### inc-024 — import-type page

**Status:** todo · **Size:** S · **Depends on:** inc-022

Acceptance criteria:

- Caption reads exactly "About the consignment" using govuk-caption-xl and H1 reads exactly "What are you importing?".

- A govuk-radios group in a govuk-fieldset offers exactly ["Live animals", "Products of animal origin, germinal products or animal by-products", "High risk food and feed of non-animal origin", "Plants, plant products and other objects"].

- Selecting "Products of animal origin, germinal products or animal by-products" persists chedType="CVEDP"; the button reads exactly "Save and continue".

- The real Back link returns to "Your import notifications".

#### inc-025 — Add import-type validation

**Status:** todo · **Size:** S · **Depends on:** inc-024

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for import-type in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select the type of import", "Certificate type must be a string", "Enter a valid certificate type".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-026 — country-of-origin page

**Status:** todo · **Size:** S · **Depends on:** inc-024, inc-005

Acceptance criteria:

- Caption reads exactly "About the consignment" and H1 reads exactly "Origin of the animal or product".

- A govuk-select labelled exactly "Country of origin" begins with "Select a country" and is populated by inc-004.

- Save and continue persists the selected code to origin.countryCode, re-renders it on resume and rejects unknown codes server-side.

- Back returns to import-type.

#### inc-027 ⛔ — Add country-of-origin validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-026, inc-019

**Open question:** needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for country-of-origin in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select the country of origin of the animal or product", "Country of origin must be a string", "Country of origin".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-028 ⛔ — origin-of-import page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-026, inc-005, inc-021

**Open question:** MODEL GAP(S): shared-page-object-cross-type-leakage; c-011 is settled at 3 characters; only the listed model decisions remain open. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "About the consignment" and H1 reads exactly "Origin of the import".

- The page renders "Country of origin"; govuk-radios "Does the consignment require a region of origin code?" with exactly ["Yes","No"]; conditional govuk-input "Enter the region code"; govuk-select "Country from where consigned"; and radios "Does this consignment conform to regulatory requirements?" and "Will the consignment change vehicles or means of transport after the Border Control Post (BCP)?" with exactly ["Yes","No"].

- The optional govuk-input label reads exactly "Add a reference number for this consignment (optional)"; values persist to origin.* and transport.onwardTransportRequired.

- The inferred health-certificate radio absent from both CHED-P traces is not rendered.

- The region-code input enforces the settled 3-character maximum (c-011), uses matching hint/copy, and accepts only alphanumeric values.

#### inc-029 ⛔ — Add origin-of-import validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-028, inc-019

**Open question:** needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 12 grounded validation rows for origin-of-import in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select the country of origin of the animal or product", "Country of origin must be 6 characters or fewer", "Country of origin", "Consigned country".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-030 ⛔ — search-commodity page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-028, inc-006, inc-014, inc-015

**Open question:** MODEL GAP(S): commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Description of the goods" and H1 reads exactly "Commodity".

- The default tab is "Commodity code search"; a govuk-input labelled exactly "Enter commodity code" and a govuk-button "Search" resolve seeded codes, while "Find the commodity in the commodity tree" supports hierarchical browsing.

- The tree never offers HS chapter 03; mixed-chapter fish sub-codes are unavailable; direct entry of an IUU code is rejected.

- Choosing 0204100010 persists a stable pending commodity selection and routes to commodity-basic-description; invalid/not-found input renders a linked GOV.UK error using approved copy.

#### inc-031 ⛔ — Add search-commodity validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-030, inc-014, inc-015

**Open question:** validation depends on model gap(s) commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 6 grounded validation rows for search-commodity in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a commodity code", "Commodity code must be a number", "Invalid commodityID", "You cannot add the same commodity code twice".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-032 ⛔ — commodity-basic-description page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-030, inc-007, inc-014, inc-015

**Open question:** MODEL GAP(S): commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Description of the goods" and H1 reads exactly "Commodity".

- A govuk-table shows the selected Commodity code and Description; govuk-select "Type of commodity" and govuk-checkboxes "Select species of commodity" are populated only from the selected code.

- For 0204100010 the choices include exactly "Domestic" (16) and "Ovis aries" (1736900); no Anguilla/fish value is available.

- A govuk-radios fieldset asks exactly "Do you want to add another commodity?" with exactly ["Yes","No"]. Yes loops to search and appends; No continues without overwriting existing rows.

- Save/resume proves the stable CommodityLine identities defined by inc-013.

#### inc-033 ⛔ — Add commodity-basic-description validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-032, inc-014, inc-015

**Open question:** validation depends on model gap(s) commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 4 grounded validation rows for commodity-basic-description in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select at least one species", "Select yes if you want to add another commodity", "Commodity lines must be fewer than 501".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-034 ⛔ — about-the-consignment page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-032, inc-005, inc-008, inc-013, inc-021

**Open question:** MODEL GAP(S): cross-page-conditionality, shared-page-variant-alias. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "About the consignment" and the H1/legend reads exactly "What is the main reason for importing the consignment?".

- govuk-radios options are exactly ["Internal market", "Transhipment or onward travel", "Transit", "Re-entry"]. Internal market reveals exactly ["Animal feedingstuff","Human consumption","Other"].

- Transhipment reveals govuk-select "Destination country". Transit reveals "Exit border control post", govuk-date-input "When the consignment will leave Great Britain", Hour/Minutes, repeatable "Transited country", "Add another country" and "Destination country".

- Only the selected branch persists to reasonForImport, purpose.* and transit.*; changing branch clears inapplicable values.

- Save and continue and Back follow the accepted route matrix.

#### inc-035 ⛔ — Add about-the-consignment validation

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-034, inc-013

**Open question:** needsHuman conflict(s) c-040; validation depends on model gap(s) cross-page-conditionality. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 29 grounded validation rows for about-the-consignment in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select the purpose of the consignment", "What is the purpose of the consignment? is not valid", "Purpose", "Purpose group".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-036 ⛔ — select-risk-category page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-034, inc-013, inc-016, inc-015

**Open question:** page confidence is gap for select-risk-category; MODEL GAP(S): cross-page-conditionality, risk-category-computed-versus-selected, unexercised-multi-commodity-loop; needsHuman conflict(s): c-027. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Select the highest risk category for the commodities in this consignment".

- Body copy reads exactly "We need to know this so we can collect the correct details for your notification. You can check the risk categories on GOV.UK (opens in new tab)."

- A govuk-radios fieldset offers exactly ["High risk","Medium risk","Low risk"] and Save and continue persists only the accepted user-answer value.

- No browser-controlled hidden highest-risk value is trusted; validation and routing follow Sam’s ruling.

#### inc-037 ⛔ — Add select-risk-category validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-036, inc-016, inc-013, inc-015

**Open question:** validation depends on model gap(s) cross-page-conditionality, risk-category-computed-versus-selected, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for select-risk-category in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select if the highest risk category is high risk, medium risk or low risk", "Select if the highest risk category is medium risk or low risk", "Select if the highest risk category is high risk or medium risk".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-038 ⛔ — health-certificate-required page

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-036, inc-013, inc-016

**Open question:** MODEL GAP(S): cross-page-conditionality, risk-category-computed-versus-selected. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Health certificate required".

- Body paragraphs read exactly "You'll need a health certificate for this consignment as it includes high or medium risk commodities." and "You must upload the health certificate to your notification before the consignment arrives in Great Britain."

- The only primary action reads exactly "Continue" and routes to the notification hub; Back returns to risk category.

- The page appears only for the risk routes accepted in inc-012/inc-014.

#### inc-039 ⛔ — notification-hub page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-038, inc-016, inc-018

**Open question:** MODEL GAP(S): risk-category-computed-versus-selected, external-outcome-and-status-variants. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Notification Hub"; the caption displays the current draft reference followed by " - CHEDP"; body copy reads exactly "These sections can be completed in any order. You can save your progress and return at any time."

- A govuk-task-list groups the exact headings "About the consignment", "Description of the goods", "Document", "Traders", "Transport", "Contact" and "Complete notification".

- Task links are exactly Origin of the import; Main reason for importing the consignment; Commodity; Additional details; Latest health certificate; Accompanying documents; Approved establishment of origin (where required); Addresses; Transport to the port of entry; Transport after the Border Control Post (BCP); Goods movement services; Transporter; Contact details; Nominated contacts (optional); Contact address for consignment; Review and submit.

- Statuses are derived from the saved document and render with govuk-task-list status text; clicking each link uses the route registry.

- No CSV bulk-upload task, IUU/catch-certificate task, CUC task or post-submission task appears in the first-pass hub.

### m4 — Commodity details & documents

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-040 ⛔ | commodity-extended-description page | page | L | blocked | inc-039, inc-009, inc-014, inc-015, inc-021, inc-020 |
| inc-041 ⛔ | Add commodity-extended-description validation | validation | S | blocked | inc-040, inc-014, inc-015 |
| inc-042 ⛔ | commodity-additional-details page | page | S | blocked | inc-040, inc-021, inc-020 |
| inc-043 | Add commodity-additional-details validation | validation | S | todo | inc-042 |
| inc-044 ⛔ | latest-health-certificate page | page | M | blocked | inc-042, inc-011, inc-013 |
| inc-045 ⛔ | Add latest-health-certificate validation | validation | M | blocked | inc-044, inc-019, inc-013 |
| inc-046 ⛔ | document-upload page and attachment metadata stub | page | M | blocked | inc-044, inc-020 |
| inc-047 ⛔ | Add document-upload validation | validation | S | blocked | inc-046, inc-020 |
| inc-048 ⛔ | accompanying-documents page | page | L | blocked | inc-046, inc-011, inc-014 |
| inc-049 ⛔ | Add accompanying-documents validation | validation | M | blocked | inc-048, inc-014 |
| inc-050 ⛔ | approved-establishment-of-origin page | page | M | blocked | inc-048, inc-010, inc-014 |
| inc-051 ⛔ | Add approved-establishment-of-origin validation | validation | S | blocked | inc-050, inc-014 |
| inc-052 ⛔ | search-approved-establishment page | page | L | blocked | inc-050, inc-010, inc-014, inc-020 |
| inc-053 ⛔ | Add search-approved-establishment validation | validation | S | blocked | inc-052, inc-014 |

#### inc-040 ⛔ — commodity-extended-description page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-039, inc-009, inc-014, inc-015, inc-021, inc-020

**Open question:** MODEL GAP(S): repeating-group-in-repeating-group, commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop, shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Description of the goods" and H1 reads exactly "Commodity".

- A govuk-table lists commodity code/description and one editable row per accepted species/type with columns exactly "Species and type", "Net weight (kg/units)", "Number of packages" and "Type of package".

- Each row persists netWeight, numberOfPackages and packageTypeCode by stable uniqueComplementId; the package select contains the inc-008 options.

- The page computes read-only total net weight and total packages, provides "Update total", and persists one govuk-input labelled exactly "Total gross weight (kg/units)" to additionalDetails.totalGrossWeight.

- "Add commodity" re-enters the loop without losing rows; Save and continue round-trips at least two commodities independently.

#### inc-041 ⛔ — Add commodity-extended-description validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-040, inc-014, inc-015

**Open question:** validation depends on model gap(s) repeating-group-in-repeating-group, commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 10 grounded validation rows for commodity-extended-description in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter the net weight (kg/units)", "Net weight must be 0.001 or more", "Net weight cannot have more than 16 digits, including decimals", "Net weight cannot have more than 3 decimals".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-042 ⛔ — commodity-additional-details page

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-040, inc-021, inc-020

**Open question:** MODEL GAP(S): shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Description of the goods" and H1 reads exactly "Additional details".

- A govuk-radios fieldset legend reads exactly "Temperature" with exactly ["Ambient","Chilled","Frozen"].

- Save and continue persists commodity.temperature as AMBIENT|CHILLED|FROZEN and resume selects the saved value.

- Inferred shared-page "Feedingstuff" and duplicate "Total gross weight" controls are not rendered.

#### inc-043 — Add commodity-additional-details validation

**Status:** todo · **Size:** S · **Depends on:** inc-042

Acceptance criteria:

- Server-side, table-driven tests cover all 1 grounded validation rows for commodity-additional-details in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Temperature of the consignment".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-044 ⛔ — latest-health-certificate page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-042, inc-011, inc-013

**Open question:** MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Documents" and H1 reads exactly "Latest Health Certificate".

- The verified warning/inset copy renders, including "Make sure the health certificate covers all commodities in this notification, or the consignment may be rejected." and "If the attachments field is blank, your document is missing. You must upload it manually."

- A GOV.UK table/summary-card row fixes Document type to "Veterinary health certificate" and provides "Document reference", a Day/Month/Year govuk-date-input and "Add attachment".

- Reference/date persist in a LATEST_VETERINARY_HEALTH_CERTIFICATE accompanying document; after upload the filename, "Remove attachment" and "Remove row" states round-trip.

- Page availability and submission requiredness follow the accepted cross-page rule.

#### inc-045 ⛔ — Add latest-health-certificate validation

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-044, inc-019, inc-013

**Open question:** validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 21 grounded validation rows for latest-health-certificate in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a reference", "Document reference must be 100 characters or fewer", "Enter a date of issue", "Date of issue must include a month and year".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-046 ⛔ — document-upload page and attachment metadata stub

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-044, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Documents", H1 reads exactly "Upload a document", the file label reads exactly "Select a document", and the primary button reads exactly "Continue".

- The first-pass upload boundary stores selected-file metadata only. When live upload is enabled later, exactly 10 MiB is accepted and larger files are rejected, following settled c-015; the unresolved minimum-size rule remains in the separate validation increment.

- Pass one stores stub metadata {uploadId, filename, contentType, contentLength, scanStatus:"COMPLETE"} in accompanying_documents and does not store file bytes or call antivirus.

#### inc-047 ⛔ — Add document-upload validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-046, inc-020

**Open question:** needsHuman conflict(s) c-041. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 6 grounded validation rows for document-upload in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "The selected file must be smaller than 10MB", "Please fix the following errors", "The selected file must be a DOC, JPEG, PDF, PNG or XLS", "The selected file is empty".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

- The settled maximum accepts exactly 10 MiB and rejects values above it (c-015); c-041 must choose the minimum-size threshold and matching copy before that minimum rule is implemented.

#### inc-048 ⛔ — accompanying-documents page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-046, inc-011, inc-014

**Open question:** MODEL GAP(S): repeating-group-in-repeating-group. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption and H1 both read exactly "Documents" / "Accompanying documents"; the page renders the verified explanatory bullets and GOV.UK details disclosure.

- A row contains govuk-select "Document type", govuk-input "Document reference", Day/Month/Year issue date and "Add attachment", with the inc-010 option set.

- Actions read exactly "Add a document", "Add multiple documents", "Save and return to hub", "Save and continue" and "Cancel and return to hub".

- Adding multiple rows creates stable separate ACCOMPANYING_DOCUMENT records; editing/removing one does not alter another; the H2 count changes from "Showing 0 additional documents".

- No Catch certificate option or IUU-specific control is present.

#### inc-049 ⛔ — Add accompanying-documents validation

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-048, inc-014

**Open question:** validation depends on model gap(s) repeating-group-in-repeating-group. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 13 grounded validation rows for accompanying-documents in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select a document type", "Document reference must be 100 characters or fewer", "Date of issue must include a month and year", "Date of issue must include a day and year".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-050 ⛔ — approved-establishment-of-origin page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-048, inc-010, inc-014

**Open question:** MODEL GAP(S): commodity-dependent-reference-data-and-scope. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Documents" and H1 reads exactly "Approved establishment of origin (where required)".

- The empty govuk-table state reads exactly "There are no establishments currently selected" and its columns are Name, Country, Type, Approval Number and Remove.

- The action reads exactly "Search for an approved establishment"; selected establishments render from approvedEstablishments[] and can be removed by stable id.

- Save and continue and Save and return to hub persist the collection; duplicates are prevented.

#### inc-051 ⛔ — Add approved-establishment-of-origin validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-050, inc-014

**Open question:** the page has a gap-confidence validation state; validation depends on model gap(s) commodity-dependent-reference-data-and-scope. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for approved-establishment-of-origin in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Approved establishment", "Veterinary Information", "Chosen establishment no longer in the establishment list".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-052 ⛔ — search-approved-establishment page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-050, inc-010, inc-014, inc-020

**Open question:** MODEL GAP(S): commodity-dependent-reference-data-and-scope, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Documents" and H1 reads exactly "Search for an approved establishment" (including the verified non-breaking space).

- A govuk-fieldset legend "Filter" contains Country (required), Name, Approval number, Section, Type and Status; Search and Sort controls use the inc-009 client.

- A govuk-table has columns exactly Name, Section, Type, Approval Number, Status, Country and Select; each logical result renders one accessible Select action and pagination uses current result metadata.

- Selecting an establishment resolves its opaque id, appends its snapshot and returns to approved-establishment-of-origin.

- The implementation avoids duplicated desktop/mobile action DOM.

#### inc-053 ⛔ — Add search-approved-establishment validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-052, inc-014

**Open question:** validation depends on model gap(s) commodity-dependent-reference-data-and-scope. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for search-approved-establishment in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "No establishments have been found. Re-try by amending your search criteria.", "Approved establishment".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

### m5 — Traders

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-054 ⛔ | traders-addresses page | page | M | blocked | inc-052, inc-020 |
| inc-055 | Add traders-addresses validation | validation | S | todo | inc-054 |
| inc-056 | search-existing-consignor page | page | M | todo | inc-054, inc-005 |
| inc-057 | Add search-existing-consignor validation | validation | S | todo | inc-056 |
| inc-058 | consignor-creation page | page | M | todo | inc-056, inc-005 |
| inc-059 | Add consignor-creation validation | validation | M | todo | inc-058 |
| inc-060 | consignor-confirmation page | page | S | todo | inc-058 |
| inc-061 | search-existing-consignee page | page | M | todo | inc-060, inc-005 |
| inc-062 | Add search-existing-consignee validation | validation | S | todo | inc-061 |
| inc-063 ⛔ | consignee-creation page | page | M | blocked | inc-061, inc-005, inc-020 |
| inc-064 | Add consignee-creation validation | validation | M | todo | inc-063 |
| inc-065 ⛔ | consignee-confirmation page | page | S | blocked | inc-063, inc-020 |
| inc-066 ⛔ | importer and destination page state | page | M | blocked | inc-065, inc-020 |
| inc-067 | Add importer validation | validation | S | todo | inc-066 |

#### inc-054 ⛔ — traders-addresses page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-052, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Traders" and H1 reads exactly "Addresses".

- Sections are exactly "Consignor or exporter", "Consignee", "Importer" and "Place of destination", with their verified hint/warning copy.

- Empty states link to "Add a consignor or exporter", "Add a consignee", "Add an importer" and "Add a place of destination"; populated states use govuk-table columns Name, Address, Country and Change.

- Both importer and destination support a button labelled exactly "Same as consignee"; copying creates independent inline Operator snapshots in importer/destination.

- Save and continue persists all four party homes and returns through the canonical route.

#### inc-055 — Add traders-addresses validation

**Status:** todo · **Size:** S · **Depends on:** inc-054

Acceptance criteria:

- Server-side, table-driven tests cover all 4 grounded validation rows for traders-addresses in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Who is the consignor or exporter", "Who is the consignee", "Who is the importer", "What is the place of destination".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-056 — search-existing-consignor page

**Status:** todo · **Size:** M · **Depends on:** inc-054, inc-005

Acceptance criteria:

- Caption reads exactly "Traders" and H1 reads exactly "Search for an existing consignor or exporter".

- A govuk-fieldset legend "Search" contains optional govuk-inputs "Name" and "Address" and a govuk-button "Search".

- Results use a govuk-table with Name, Address, Country, View and Select; the fixed local economic-operator fixture supports at least one result.

- The link reads exactly "Create a new consignor or exporter"; Select stores an inline consignor snapshot and returns to Addresses.

#### inc-057 — Add search-existing-consignor validation

**Status:** todo · **Size:** S · **Depends on:** inc-056

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for search-existing-consignor in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Name must be 255 characters or fewer", "Address must be 255 characters or fewer", "Country is not valid".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-058 — consignor-creation page

**Status:** todo · **Size:** M · **Depends on:** inc-056, inc-005

Acceptance criteria:

- For the verified re-entry variant, H1 reads exactly "Add consignee", the leading label reads exactly "Consignee name" and the link reads exactly "Return to search" (c-018).

- The form contains Address line 1, Address line 2 (optional), Address line 3 (optional), City or town, Postcode or ZIP code, Telephone number, Country and Email address using GOV.UK inputs/select.

- Despite the rendered re-entry copy, the route maps the saved Operator to consignor and never overwrites consignee.

- Save and continue persists the inline address/contact values and routes to consignor-confirmation.

#### inc-059 — Add consignor-creation validation

**Status:** todo · **Size:** M · **Depends on:** inc-058

Acceptance criteria:

- Server-side, table-driven tests cover all 16 grounded validation rows for consignor-creation in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a consignee name", "Consignee name must be 255 characters or fewer", "Enter an address line 1", "Address line 1 must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-060 — consignor-confirmation page

**Status:** todo · **Size:** S · **Depends on:** inc-058

Acceptance criteria:

- The govuk-panel heading reads exactly "The consignee has been created" for the verified re-entry variant.

- The primary button reads exactly "Add to notification" and the secondary link reads exactly "Return to search".

- Add to notification attaches the pending Operator as consignor and returns to the Addresses hub; refresh/double-submit does not create duplicates.

#### inc-061 — search-existing-consignee page

**Status:** todo · **Size:** M · **Depends on:** inc-060, inc-005

Acceptance criteria:

- Caption reads exactly "Traders" and H1 reads exactly "Search for an existing consignee".

- A govuk-fieldset legend "Search" contains optional govuk-inputs "Name" and "Address" and a govuk-button "Search".

- Results use a govuk-table with Name, Address, Country, View and Select plus pagination.

- The creation link reads exactly "Create a new consignee"; Select stores an inline consignee snapshot and returns to Addresses.

#### inc-062 — Add search-existing-consignee validation

**Status:** todo · **Size:** S · **Depends on:** inc-061

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for search-existing-consignee in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Name must be 255 characters or fewer", "Address must be 255 characters or fewer", "Country is not valid".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-063 ⛔ — consignee-creation page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-061, inc-005, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Add consignee"; the first label reads exactly "Consignee name"; the fieldset legend reads exactly "Consignee".

- The form contains Address line 1, Address line 2 (optional), Address line 3 (optional), City or town, Postcode or ZIP code, Telephone number, Country and Email address.

- Country uses the inc-004 list with prompt "Please select your country".

- Save and continue persists consignee.* and routes to consignee-confirmation; resume re-renders every value.

#### inc-064 — Add consignee-creation validation

**Status:** todo · **Size:** M · **Depends on:** inc-063

Acceptance criteria:

- Server-side, table-driven tests cover all 16 grounded validation rows for consignee-creation in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a consignee name", "Consignee name must be 255 characters or fewer", "Enter an address line 1", "Address line 1 must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-065 ⛔ — consignee-confirmation page

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-063, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The govuk-panel heading reads exactly "The consignee has been created".

- The primary button reads exactly "Add to notification" and the link reads exactly "Return to search".

- Add to notification attaches the pending Operator as consignee and returns to Addresses without duplicates.

#### inc-066 ⛔ — importer and destination page state

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-065, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Traders" and H1 reads exactly "Addresses"; the existing consignor/consignee tables remain visible.

- The Importer hint reads exactly "This is usually the same as the consignee. You can select a different person if needed." and offers "Same as consignee" and "Add an importer".

- Place of destination renders Warning text "Providing a false address is an act of fraud.", the verified final-unloading copy, "Same as consignee" and "Add a place of destination".

- Populating importer/destination copies the consignee into separate target-model homes; Change links and Save and continue round-trip them.

#### inc-067 — Add importer validation

**Status:** todo · **Size:** S · **Depends on:** inc-066

Acceptance criteria:

- Server-side, table-driven tests cover all 2 grounded validation rows for importer in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Who is the importer", "What is the place of destination".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

### m6 — Transport, contacts, review & submit

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-068 ⛔ | transport-details page | page | L | blocked | inc-066, inc-008, inc-013 |
| inc-069 ⛔ | Add transport-details validation | validation | M | blocked | inc-068, inc-019, inc-013 |
| inc-070 | means-of-transport-after-bcp page | page | M | todo | inc-068 |
| inc-071 | Add means-of-transport-after-bcp validation | validation | M | todo | inc-070 |
| inc-072 ⛔ | goods-movement-services page | page | M | blocked | inc-070, inc-013 |
| inc-073 ⛔ | Add goods-movement-services validation | validation | S | blocked | inc-072, inc-019, inc-013 |
| inc-074 ⛔ | transporter page | page | M | blocked | inc-072, inc-021, inc-020 |
| inc-075 | search-existing-transporter page | page | M | todo | inc-074 |
| inc-076 | Add search-existing-transporter validation | validation | S | todo | inc-075 |
| inc-077 ⛔ | transporter-creation page | page | M | blocked | inc-075, inc-005, inc-020 |
| inc-078 | Add transporter-creation validation | validation | M | todo | inc-077 |
| inc-079 ⛔ | transporter-confirmation page | page | S | blocked | inc-077, inc-020 |
| inc-080 ⛔ | contact-details page | page | M | blocked | inc-079, inc-017 |
| inc-081 ⛔ | Add contact-details validation | validation | S | blocked | inc-080, inc-017 |
| inc-082 ⛔ | nominated-contacts page | page | L | blocked | inc-080, inc-017, inc-014 |
| inc-083 ⛔ | Add nominated-contacts validation | validation | S | blocked | inc-082, inc-017, inc-014 |
| inc-084 | contact-address page | page | M | todo | inc-082 |
| inc-085 ⛔ | Add contact-address validation | validation | S | blocked | inc-084, inc-019 |
| inc-086 ⛔ | branch-address-creation page | page | M | blocked | inc-084, inc-005, inc-020 |
| inc-087 | Add branch-address-creation validation | validation | M | todo | inc-086 |
| inc-088 ⛔ | branch-address-confirmation page | page | S | blocked | inc-086, inc-020 |
| inc-089 ⛔ | review-notification page | page | L | blocked | inc-088, inc-012 |
| inc-090 ⛔ | declaration page and submission transition | page | M | blocked | inc-089, inc-020 |
| inc-091 ⛔ | confirmation page | page | M | blocked | inc-090, inc-012, inc-018 |

#### inc-068 ⛔ — transport-details page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-066, inc-008, inc-013

**Open question:** MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Transport" and H1 reads exactly "Transport to the port of entry".

- Controls are Port of entry; means select with exactly ["Select means of transport to port of entry","Airplane","Railway","Road vehicle","Vessel"]; Transport identification; container/trailer Yes/No; Transport document reference; Estimated arrival Day/Month/Year; and Time of estimated arrival Hour/Minutes.

- Yes to "Are any road trailers or shipping containers being used to transport the consignment?" reveals Container or trailer number, Seal number, Official seal and Add another container or trailer using stable Container rows.

- Port choices come from the origin-dependent inc-007 query and persist to transport.*; date/time use plain GOV.UK inputs without the legacy datepicker overlay.

- The confirmed out-of-window error reads exactly "You cannot enter a date more than 30 days in the past or 180 days in the future".

#### inc-069 ⛔ — Add transport-details validation

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-068, inc-019, inc-013

**Open question:** needsHuman conflict(s) c-038; validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 25 grounded validation rows for transport-details in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Please fix the following errors", "You cannot enter a date more than 30 days in the past or 180 days in the future", "Add the port of entry", "Add the means of transport to port of entry".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-070 — means-of-transport-after-bcp page

**Status:** todo · **Size:** M · **Depends on:** inc-068

Acceptance criteria:

- Caption reads exactly "Transport" and H1 reads exactly "Transport after the Border Control Post (BCP)".

- Body copy reads exactly "We need these details in the event that the consignment is chosen for inspection."

- The means select options are exactly ["Select means of transport after the BCP","Airplane","Railway","Road vehicle","Vessel"], followed by Transport identification, Transport document reference, departure Day/Month/Year and Hour/Minutes.

- Values persist to transport.onwardTransport.*; the confirmed date error reads exactly "You cannot enter a date more than 30 days in the past or 180 days in the future".

- Save and continue, Save and return to hub and Cancel and return to hub have real destinations.

#### inc-071 — Add means-of-transport-after-bcp validation

**Status:** todo · **Size:** M · **Depends on:** inc-070

Acceptance criteria:

- Server-side, table-driven tests cover all 19 grounded validation rows for means-of-transport-after-bcp in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "You cannot enter a date more than 30 days in the past or 180 days in the future", "Please fix the following errors", "Means of transport after the BCP", "Add the means of transport after the BCP".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-072 ⛔ — goods-movement-services page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-070, inc-013

**Open question:** MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Transport" and H1 reads exactly "Goods movement services".

- The CTC govuk-radios question reads exactly "Are you using the Common Transit Convention (CTC) to move goods between countries?" with the verified three-option variant ["Yes – add MRN now","Yes – add MRN later","No"].

- Selecting "Yes – add MRN now" reveals govuk-input "Movement Reference Number (MRN)"; the GVMS question reads exactly "Will the transport use the Goods Vehicle Movement Service (GVMS)?" with ["Yes","No"].

- The "What is the CTC?" and "What is the GVMS?" details components render the verified guidance; values persist without any live GVMS/NCTS call.

- Page/question availability and the binary CTC variant follow the accepted routing matrix.

#### inc-073 ⛔ — Add goods-movement-services validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-072, inc-019, inc-013

**Open question:** validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for goods-movement-services in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Select if using the Common Transit Convention (CTC)", "Enter a valid Movement Reference Number", "Select if using the Goods Vehicle Movement Service (GVMS)".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-074 ⛔ — transporter page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-072, inc-021, inc-020

**Open question:** MODEL GAP(S): shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Transport" and H1 reads exactly "Transporter".

- A govuk-table has columns exactly "Name, address and country", "Approval number", "Type" and an accessible action column.

- The empty state shows "Add a transporter"; the populated state shows one transporter snapshot and "Change".

- Save and continue persists one transporter in the target model; inferred cross-CHED "No" and "Select" controls are not rendered.

#### inc-075 — search-existing-transporter page

**Status:** todo · **Size:** M · **Depends on:** inc-074

Acceptance criteria:

- Caption reads exactly "Transport" and H1 reads exactly "Search for an existing transporter".

- A govuk-fieldset legend "Search" contains optional fields exactly "Name", "Approval Number" and "Post Code", followed by "Search".

- Results use a govuk-table with Name, Address, Country, Status, Approval Number, Type, View and Select and accessible pagination.

- The link reads exactly "Create a new transporter"; Select stores an inline transporter snapshot.

#### inc-076 — Add search-existing-transporter validation

**Status:** todo · **Size:** S · **Depends on:** inc-075

Acceptance criteria:

- Server-side, table-driven tests cover all 3 grounded validation rows for search-existing-transporter in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Name must be 255 characters or fewer", "Approval number must be 255 characters or fewer", "Post code must be 10 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-077 ⛔ — transporter-creation page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-075, inc-005, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Add private transporter"; the first field label reads exactly "Transporter name" and the fieldset legend reads exactly "Transporter".

- Fields are Address line 1, Address line 2 (optional), Address line 3 (optional), City or town, Postcode or ZIP code, Telephone number, Country and Email address.

- Country uses inc-004 and Save and continue persists transporter.* then routes to transporter-confirmation.

- Server-side requiredness follows the inferred page obligations without inventing gap-confidence error text.

#### inc-078 — Add transporter-creation validation

**Status:** todo · **Size:** M · **Depends on:** inc-077

Acceptance criteria:

- Server-side, table-driven tests cover all 16 grounded validation rows for transporter-creation in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a transporter name", "Transporter name must be 255 characters or fewer", "Enter an address line 1", "Address line 1 must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

- Legacy "ETAG is not valid" and "reimport is not valid" rows are transport-plumbing evidence only: the rebuild renders neither field and rejects posted legacy plumbing without promising that obsolete user-facing copy.

#### inc-079 ⛔ — transporter-confirmation page

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-077, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The govuk-panel heading reads exactly "The transporter has been created".

- The primary button reads exactly "Add to notification" and the link reads exactly "Return to search".

- Add to notification attaches the pending transporter and returns to the Transporter page without duplicates.

#### inc-080 ⛔ — contact-details page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-079, inc-017

**Open question:** MODEL GAP(S): at-least-one-of-sibling-fields. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The govuk-fieldset legend/H1 reads exactly "Contact details".

- Hints read exactly "These are the details we have for you. Make sure they are up to date." and "We will use these details if your consignment is chosen for inspection."

- Inputs are labelled exactly "Name", "Email address" and "Mobile number"; values persist to responsiblePerson.

- Save and continue, Save and return to hub and Cancel and return to hub work; contactability validation follows Sam’s group-rule ruling.

#### inc-081 ⛔ — Add contact-details validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-080, inc-017

**Open question:** validation depends on model gap(s) at-least-one-of-sibling-fields. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 8 grounded validation rows for contact-details in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter your name", "Name must be 32 characters or fewer", "Enter an email address in the correct format, like name@example.com", "Email address must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-082 ⛔ — nominated-contacts page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-080, inc-017, inc-014

**Open question:** MODEL GAP(S): at-least-one-of-sibling-fields, repeating-group-in-repeating-group. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- Caption reads exactly "Contacts" and the fieldset H1 reads exactly "Nominated contacts (optional)".

- Body copy reads exactly "Nominate up to 5 contacts. They will be notified if your consignment is chosen for inspection."

- A GOV.UK table has columns Name, Email address, Mobile number and accessible Remove; "Add another person" appends up to five stable Contact rows.

- Save and continue persists nominatedContacts[] and round-trip tests cover add, remove and edit-one-row isolation.

- Per-row contactability follows Sam’s ruling.

#### inc-083 ⛔ — Add nominated-contacts validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-082, inc-017, inc-014

**Open question:** validation depends on model gap(s) at-least-one-of-sibling-fields, repeating-group-in-repeating-group. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 7 grounded validation rows for nominated-contacts in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a name", "Name must be 32 characters or fewer", "Enter an email address in the correct format, like name@example.com", "Email address must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-084 — contact-address page

**Status:** todo · **Size:** M · **Depends on:** inc-082

Acceptance criteria:

- Caption reads exactly "Complete notification" and H1 reads exactly "Contact address for consignment".

- The verified explanatory copy renders and a govuk-radios fieldset legend reads exactly "Select an address".

- Address options come from the fixed local organisation/address fixture; the link reads exactly "add a new branch address".

- Save and continue stores the selected Operator snapshot in contactAddress and resume selects it.

#### inc-085 ⛔ — Add contact-address validation

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-084, inc-019

**Open question:** needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy.

Acceptance criteria:

- Server-side, table-driven tests cover all 2 grounded validation rows for contact-address in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "\"Organisation Branch Address\" is required", "Add the contact address for consignment".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-086 ⛔ — branch-address-creation page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-084, inc-005, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The draft reference caption ends " - CHEDP" and H1 reads exactly "Add branch address".

- The leading label reads exactly "Branch address name"; the fieldset legend reads exactly "Branch address".

- Fields are Address line 1, Address line 2 (optional), Address line 3 (optional), City or town, Postcode or ZIP code, Telephone number, Country and Email address.

- The link reads exactly "Return to notification"; Save and continue persists the local branch-address fixture and routes to confirmation.

#### inc-087 — Add branch-address-creation validation

**Status:** todo · **Size:** M · **Depends on:** inc-086

Acceptance criteria:

- Server-side, table-driven tests cover all 16 grounded validation rows for branch-address-creation in journey-spec.json, preserving each recorded trigger and exact message (including recorded no-error outcomes).

- At minimum the asserted verbatim catalogue includes "Enter a branch name", "Branch name must be 255 characters or fewer", "Enter an address line 1", "Address line 1 must be 255 characters or fewer".

- Every rejected POST renders a GOV.UK govuk-error-summary and field-level govuk-error-message with summary links targeting the invalid controls; entered values and conditional reveals are preserved.

- Unknown reference-data values and browser-posted derived/hidden business state are rejected server-side; successful input is normalised before the whole Notification document is saved.

#### inc-088 ⛔ — branch-address-confirmation page

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-086, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The govuk-panel/H1 reads exactly "The address has been added to your address book".

- The primary action reads exactly "Return to notification".

- Returning makes the newly-created address selectable and does not duplicate it on refresh.

#### inc-089 ⛔ — review-notification page

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-088, inc-012

**Open question:** MODEL GAP(S): summary-restatement-linkage; needsHuman conflict(s): c-028. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The caption displays the draft reference followed by " - CHEDP" and H1 reads exactly "Review your notification".

- The page renders the reference triplet (CHED reference, Reference for your customs declaration, Customs document code), warning "You must use the correct reference and code on the customs declaration or your consignment will be delayed.", and Copy progressive-enhancement buttons.

- Stock govuk-summary-list, govuk-summary-card and govuk-table components restate every in-scope section shown in journey-spec.json: consignment, commodity/totals/temperature, documents, establishments, traders, transport, transporter, goods movement and contacts.

- Every editable section has an accessible "Change" link to its canonical page; no fish/catch-certificate row, Split consignment action, amend control or post-submission inspector section appears.

- The consignment-reference row supports blank/populated display exactly as Sam rules; Save and continue routes to declaration.

#### inc-090 ⛔ — declaration page and submission transition

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-089, inc-020

**Open question:** MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- H1 reads exactly "Declaration".

- The declaration paragraph is verbatim from journey-spec.json, beginning "I, the undersigned operator responsible for the consignment detailed above" and including "assimilated Regulation 2017/625 on official controls".

- The page renders "Date of declaration: {server date}" and the primary button reads exactly "Submit notification"; there is no acknowledgement checkbox.

- Submission validates the accepted route, sets status=SUBMITTED and declaration.declaredAt server-side, runs the deterministic risk stub once and prevents double submission.

- Successful submission routes to confirmation with the stable reference and persisted whole document.

#### inc-091 ⛔ — confirmation page

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-090, inc-012, inc-018

**Open question:** MODEL GAP(S): summary-restatement-linkage, external-outcome-and-status-variants. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling.

Acceptance criteria:

- The page title is exactly "Import notification sent - Import and export applications - GOV.UK" and the primary H1 reads exactly "Initial risk assessment".

- A GOV.UK notification banner/panel renders the accepted "Inspection status" outcome; confirmed variants are "Required at {BCP}" and "Not required", with their exact journey-spec.json guidance.

- A govuk-summary-list shows CHED reference, Reference for your customs declaration and Customs document code with Copy buttons; the warning about using the correct reference/code renders exactly.

- Headings read exactly "What you need to do", "What happens next" and "How to view or amend this notification"; links read exactly "Return to your dashboard" and "Create a new notification".

- No inspector action, decision data, border/control action or live SOAP/PDF/Notify integration is added.

### m7 — Delegated authority & ownership (later)

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-092 ⛔ | Delegated-authority tenancy and ownership model extension | model-extension | L | blocked | inc-002 |
| inc-093 ⛔ | POAO importer-or-agency eligibility page (later DoA) | page | S | blocked | inc-092 |
| inc-094 ⛔ | choose-your-organisation page (later DoA) | page | S | blocked | inc-093 |
| inc-095 ⛔ | manage-your-authorisations page (later DoA) | page | M | blocked | inc-094 |
| inc-096 ⛔ | who-are-you-creating-this-notification-for page (later DoA) | page | S | blocked | inc-095 |
| inc-097 ⛔ | which-company-is-this-notification-for page (later DoA) | page | S | blocked | inc-096 |
| inc-098 ⛔ | Assigned-organisation importer and responsible-person defaults | authorization | M | blocked | inc-097, inc-066, inc-080 |
| inc-099 ⛔ | Organisation-scoped draft and submitted visibility | authorization | L | blocked | inc-098, inc-022 |
| inc-100 ⛔ | Trade Partner marking and ownership audit | authorization | M | blocked | inc-099, inc-089, inc-091 |

#### inc-092 ⛔ — Delegated-authority tenancy and ownership model extension

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-002

**Open question:** MODEL GAP "delegated-authority-model": obtain/approve a CHED-P POAO journey and decide route placement/copy, designated responsible contact, Trade Partner lifecycle, draft privacy and the B2B/co-member permission matrix. Evidence is cross-type; do not author the POAO ruling.

Acceptance criteria:

- After a ruling, Notification.ownership persists createdFor, assignedOrg, onBehalfOf and createdBy; submittedByAgent is server-written according to the approved timing. AUTH-01..AUTH-05 are covered by tests.

- assignedOrg, not the creator’s employer, is the owning tenant and source of importer/responsible-person defaults; pre-submit reassignment recalculates those snapshots. AUTH-04, AUTH-05, AUTH-11 and AUTH-12 are covered.

- Server-side read/write policies enforce creator-only delegated drafts, assigned-org member access after submit, submitting-agent retained access and unrelated-org isolation. AUTH-07..AUTH-10 are covered.

- Trade Partner is derived from onBehalfOf and shown only under the approved lifecycle; it is not accepted as a browser-posted ownership flag. AUTH-06 is covered.

- No Plant fixture labels, organisation names, commodity routes or blanket B2B access are carried into CHED-P.

#### inc-093 ⛔ — POAO importer-or-agency eligibility page (later DoA)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-092

**Open question:** Cross-type page are-you-a-plants-importer-or-agency has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it.

Acceptance criteria:

- After approval, the page uses the evidenced GOV.UK component family (Radios, Button) and preserves the evidenced interaction shape.

- The evidence heading is "Are you a plants importer or agency?" with observed options ["Yes","No"]; CHED-P product copy and POAO organisation labels follow the approved replacement, never the Plant fixture.

- All eligible organisations are resolved server-side from the authenticated agency/authorisation relationship; a posted unrelated organisation id is rejected.

- The route, Back/Continue contract, empty state and validation copy are acceptance-tested only after the CHED-P-specific evidence/ruling supplies them.

#### inc-094 ⛔ — choose-your-organisation page (later DoA)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-093

**Open question:** Cross-type page choose-your-organisation has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it.

Acceptance criteria:

- After approval, the page uses the evidenced GOV.UK component family (Select / combobox, Button) and preserves the evidenced interaction shape.

- The evidence heading is "Choose your organisation" with observed options ["Select an organisation","ANGEL IMPORTING LTD"]; CHED-P product copy and POAO organisation labels follow the approved replacement, never the Plant fixture.

- All eligible organisations are resolved server-side from the authenticated agency/authorisation relationship; a posted unrelated organisation id is rejected.

- The route, Back/Continue contract, empty state and validation copy are acceptance-tested only after the CHED-P-specific evidence/ruling supplies them.

#### inc-095 ⛔ — manage-your-authorisations page (later DoA)

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-094

**Open question:** Cross-type page manage-your-authorisations has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it.

Acceptance criteria:

- After approval, the page uses the evidenced GOV.UK component family (Heading, Table / list) and preserves the evidenced interaction shape.

- The evidence heading is "Manage your authorisations"; CHED-P product copy and POAO organisation labels follow the approved replacement, never the Plant fixture.

- All eligible organisations are resolved server-side from the authenticated agency/authorisation relationship; a posted unrelated organisation id is rejected.

- The route, Back/Continue contract, empty state and validation copy are acceptance-tested only after the CHED-P-specific evidence/ruling supplies them.

#### inc-096 ⛔ — who-are-you-creating-this-notification-for page (later DoA)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-095

**Open question:** Cross-type page who-are-you-creating-this-notification-for has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it.

Acceptance criteria:

- After approval, the page uses the evidenced GOV.UK component family (Radios) and preserves the evidenced interaction shape.

- The evidence heading is "Who are you creating this notification for?" with observed options ["Agent's own organisation (fixture: IPAFFS Plant Agency C)","A different organisation"]; CHED-P product copy and POAO organisation labels follow the approved replacement, never the Plant fixture.

- All eligible organisations are resolved server-side from the authenticated agency/authorisation relationship; a posted unrelated organisation id is rejected.

- The route, Back/Continue contract, empty state and validation copy are acceptance-tested only after the CHED-P-specific evidence/ruling supplies them.

#### inc-097 ⛔ — which-company-is-this-notification-for page (later DoA)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-096

**Open question:** Cross-type page which-company-is-this-notification-for has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it.

Acceptance criteria:

- After approval, the page uses the evidenced GOV.UK component family (Radios) and preserves the evidenced interaction shape.

- The evidence heading is "Which company is this notification for" with observed options ["Companies the agency is authorised to represent"]; CHED-P product copy and POAO organisation labels follow the approved replacement, never the Plant fixture.

- All eligible organisations are resolved server-side from the authenticated agency/authorisation relationship; a posted unrelated organisation id is rejected.

- The route, Back/Continue contract, empty state and validation copy are acceptance-tested only after the CHED-P-specific evidence/ruling supplies them.

#### inc-098 ⛔ — Assigned-organisation importer and responsible-person defaults

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-097, inc-066, inc-080

**Open question:** target-model.md Open Q5 and AUTH-11/AUTH-12: which designated POAO member/contact supplies responsiblePerson, and when do assigned-org defaults replace or coexist with manual values? Do not author the ruling.

Acceptance criteria:

- After a ruling, selecting assignedOrg populates importer identity/address/telephone/email and responsible-person name/telephone/email/organisation from that POAO organisation.

- Changing assignedOrg before submission removes stale organisation-derived snapshots and recalculates both defaults atomically in the whole Notification document.

- The submitting agent remains a separate audit identity and is never substituted into client importer/contact fields.

- Tests cover own organisation, represented client, reassignment and rejection of browser-posted defaults for an unassigned organisation.

#### inc-099 ⛔ — Organisation-scoped draft and submitted visibility

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-098, inc-022

**Open question:** target-model.md Open Q7/Open Q8 and AUTH-03/AUTH-07..AUTH-10: confirm CHED-P draft privacy, co-member actions and exact B2B role permissions. Do not author the ruling.

Acceptance criteria:

- After approval, an agent-created client draft is readable only by createdBy; merely belonging to assignedOrg does not expose it before submit.

- After submit, assignedOrg members and the specific submitting agent can find/read the notification; unrelated organisations and agency coworkers cannot.

- Every repository/dashboard query applies the same server-side tenant/creator policy; direct-id access cannot bypass it.

- Role-matrix integration tests cover own-org member, client member, submitting agent, agency coworker, unrelated org and B2B roles.

#### inc-100 ⛔ — Trade Partner marking and ownership audit

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-099, inc-089, inc-091

**Open question:** target-model.md Open Q4/Open Q6 and AUTH-06: confirm submittedByAgent timing and Trade Partner/onBehalfOf behaviour on amend/copy. Do not author the ruling.

Acceptance criteria:

- After approval, an on-behalf-of submitted dashboard card displays the exact "Trade Partner" badge and assigned client organisation; own-org work does not.

- Review and confirmation expose the assigned organisation and audit submitter without transferring ownership to the agency.

- Badge state is derived from ownership.onBehalfOf; submittedByAgent records the specific agent and agency at the approved lifecycle point.

- Tests cover submit, approved amend/copy behaviour and an attempted browser mutation of badge/owner/audit fields.

### m8 — Other later variants

| id | Increment | Kind | Size | Status | Depends on |
|---|---|---|---|---|---|
| inc-101 ⛔ | common-user-charge confirmation page (later variant) | page | M | blocked | inc-072, inc-013 |
| inc-102 ⛔ | billing-select-address page (later variant) | page | M | blocked | inc-101, inc-013 |
| inc-103 ⛔ | Add billing-select-address validation (later CUC) | validation | S | blocked | inc-102 |
| inc-104 ⛔ | billing-contact-details page (later variant) | page | M | blocked | inc-102, inc-013, inc-017 |
| inc-105 ⛔ | Add billing-contact-details validation (later CUC) | validation | S | blocked | inc-104, inc-017 |
| inc-106 ⛔ | CSV commodity bulk-upload variant | variant | L | blocked | inc-091 |
| inc-107 ⛔ | Article 72 low-risk variant | variant | L | blocked | inc-091 |
| inc-108 ⛔ | Split-consignment variant | variant | L | blocked | inc-091 |

#### inc-101 ⛔ — common-user-charge confirmation page (later variant)

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-072, inc-013

**Open question:** c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed.  Do not author the ruling.

Acceptance criteria:

- If enabled by the ruling, caption reads exactly "Billing" and H1 reads exactly "Confirm billing details".

- The page renders the verified rates/eligibility and terms links, details disclosure, additional-fees paragraph and the warning that changed billing details apply to previous notifications in the invoicing period.

- A govuk-summary-card titled "Billing details" shows Name, Address, Email address and Phone number with Change actions.

- Actions read exactly "Save and return to hub", "Save and continue" and "Cancel and return to notification"; values persist to billing.* without a Trade Charge queue producer.

#### inc-102 ⛔ — billing-select-address page (later variant)

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-101, inc-013

**Open question:** c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed.  Do not author the ruling.

Acceptance criteria:

- If CUC is enabled, caption reads exactly "Billing" and H1/label reads exactly "Select the address".

- The page shows "Postcode: {postcode}", a Change link, result count, a govuk-select labelled "Select the address", "I cannot find the address in the list", "Continue" and "Cancel and return to notification".

- A canned postcode lookup returns deterministic address records; selecting one stores the resolved address fields rather than the result index.

- The missing Find-an-address/manual-address pages are not invented from this page spec and require their own verified specification before implementation.

#### inc-103 ⛔ — Add billing-select-address validation (later CUC)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-102

**Open question:** This validation depends on unresolved CUC eligibility c-008. Do not author the ruling.

Acceptance criteria:

- Table-driven tests implement all 6 grounded billing-select-address validation rows in journey-spec.json with their recorded triggers and exact copy.

- The verbatim catalogue includes "Select address from the list", "Enter postcode", "Enter valid UK postcode", "ETAG is missing".

- Errors render through linked govuk-error-summary and govuk-error-message components and preserve the entered billing values.

- Successful values normalise into Notification.billing and survive whole-document Mongo save/resume.

#### inc-104 ⛔ — billing-contact-details page (later variant)

**Status:** BLOCKED · **Size:** M · **Depends on:** inc-102, inc-013, inc-017

**Open question:** c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed. Also confirm billing contact requiredness. Do not author the ruling.

Acceptance criteria:

- If CUC is enabled, caption reads exactly "Billing" and H1 reads exactly "Change billing contact details".

- The only editable controls are govuk-inputs labelled exactly "Email address" and "Phone number"; no unsupported contact-name field is added.

- The primary action reads exactly "Continue" and the secondary link reads exactly "Cancel and return to notification"; values persist to billing.email and billing.telephone.

- Requiredness/group validation follows Sam’s contactability ruling.

#### inc-105 ⛔ — Add billing-contact-details validation (later CUC)

**Status:** BLOCKED · **Size:** S · **Depends on:** inc-104, inc-017

**Open question:** This validation depends on unresolved CUC eligibility c-008 and the at-least-one-of-sibling-fields model gap. Do not author the ruling.

Acceptance criteria:

- Table-driven tests implement all 6 grounded billing-contact-details validation rows in journey-spec.json with their recorded triggers and exact copy.

- The verbatim catalogue includes "Enter an email address", "Email address must be 100 characters or fewer", "Enter an email address in the correct format, like name@example.com", "Enter a telephone number".

- Errors render through linked govuk-error-summary and govuk-error-message components and preserve the entered billing values.

- Successful values normalise into Notification.billing and survive whole-document Mongo save/resume.

#### inc-106 ⛔ — CSV commodity bulk-upload variant

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-091

**Open question:** CSV bulk upload is not present in the enriched CHED-P page/model evidence. Confirm file schema, limits, error report, mapping into CommodityLine and reconciliation with manual add/edit/remove before build. Do not author the ruling.

Acceptance criteria:

- After a separately verified specification, CSV rows map into the same non-fish CommodityLine model and reference-data validation used by the manual path.

- The import is atomic or supplies an approved row-error correction contract; invalid/IUU codes never enter Mongo.

- Manual and CSV paths converge before risk/category, weights/packages and review without duplicate model shapes.

#### inc-107 ⛔ — Article 72 low-risk variant

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-091

**Open question:** No verified CHED-P UI/business rule defines Article 72 eligibility or its journey effect. Confirm country×commodity classification, persisted/derived state and skipped/required pages. Do not author the ruling.

Acceptance criteria:

- After verified rules, a server-side classifier derives Article 72 eligibility from approved inputs and cannot be overridden by a browser field.

- Table-driven tests cover eligible/ineligible boundaries and exact routing/task-list effects.

- The variant reuses the canonical Notification model and does not weaken final submission validation outside the approved exemptions.

#### inc-108 ⛔ — Split-consignment variant

**Status:** BLOCKED · **Size:** L · **Depends on:** inc-091

**Open question:** Split consignment is post/submission-adjacent and has no verified first-pass create journey or target-model contract. Confirm actor, lifecycle point, parent/child identity, commodity allocation and ownership before build. Do not author the ruling.

Acceptance criteria:

- After a verified specification, parent/child references, status transitions and commodity allocation are explicit and preserve audit/ownership.

- Tests prove no commodity quantity is lost or duplicated and the original notification remains traceable.

- The feature is not exposed in the manual first-pass dashboard/review before that specification is approved.

## Born-blocked register

| id | Increment | Open question |
|---|---|---|
| inc-012 | Derived/restated-value model extension | MODEL GAP "summary-restatement-linkage" and c-028: confirm canonical source paths and the blank-display policy for review/confirmation restatements. Do not author the ruling. |
| inc-013 | Cross-page conditional routing model extension | MODEL GAP "cross-page-conditionality": define executable purpose/Transit, risk/health-certificate, origin/POE, onward-transport, CTC/GVMS and CUC rules plus answer-change cleanup. Do not author the ruling. |
| inc-014 | Commodity collection and repeated-row model extension | MODEL GAPS "repeating-group-in-repeating-group" and "commodity-dependent-reference-data-and-scope": confirm the CommodityLine grain, stable row identity, reference-data joins, cardinality and aggregation. Do not author the ruling. |
| inc-015 | Commodity add-another, edit and remove loop | MODEL GAP "unexercised-multi-commodity-loop": the corpus submits one commodity and answers No. Confirm the non-fish add-another upper bound, remove/re-entry behaviour and cross-commodity risk aggregation. Do not author the ruling. |
| inc-016 | Computed and selected risk-category model extension | c-027, page-confidence gap and MODEL GAP "risk-category-computed-versus-selected": decide whether a user may select below the computed highest category and what validation/routing follows. Do not author the ruling. |
| inc-017 | Contactability and partial-row constraint extension | MODEL GAP "at-least-one-of-sibling-fields": confirm email/telephone rules for responsible person, nominated contacts and later CUC billing, including partial-row handling. Do not author the ruling. |
| inc-018 | Submission outcome/status adapter extension | MODEL GAP "external-outcome-and-status-variants": decide which deterministic first-pass confirmation outcomes are supported. Inspector/decision state remains outside this service. Do not author the ruling. |
| inc-019 | Draft-save and final-submit validation lifecycle | MODEL GAP "two-layer-validation" and c-038: choose the rebuild lifecycle and one user-facing string where legacy page-save Joi and final CHED-P model validation differ. c-039 confirms the triggers differ; it does not choose the rebuild copy. Do not author the ruling. |
| inc-020 | Whole-document concurrency and stale-save recovery | MODEL GAP "optimistic-concurrency-etag" and target-model.md Open Q20: confirm version/CAS policy and the user-visible recovery route/copy for a stale long-journey or multi-tab save. Do not reproduce legacy ETag wire fields or invent the ruling. |
| inc-021 | Shared-page variant and inferred-control boundary | MODEL GAPS "shared-page-variant-alias" and "shared-page-object-cross-type-leakage": confirm which inferred shared controls can render for CHED-P and keep transit-exit-bcp as a same-page facet rather than a second URL. Do not author the ruling. |
| inc-027 | Add country-of-origin validation | needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-028 | origin-of-import page | MODEL GAP(S): shared-page-object-cross-type-leakage; c-011 is settled at 3 characters; only the listed model decisions remain open. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-029 | Add origin-of-import validation | needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-030 | search-commodity page | MODEL GAP(S): commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-031 | Add search-commodity validation | validation depends on model gap(s) commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-032 | commodity-basic-description page | MODEL GAP(S): commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-033 | Add commodity-basic-description validation | validation depends on model gap(s) commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-034 | about-the-consignment page | MODEL GAP(S): cross-page-conditionality, shared-page-variant-alias. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-035 | Add about-the-consignment validation | needsHuman conflict(s) c-040; validation depends on model gap(s) cross-page-conditionality. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-036 | select-risk-category page | page confidence is gap for select-risk-category; MODEL GAP(S): cross-page-conditionality, risk-category-computed-versus-selected, unexercised-multi-commodity-loop; needsHuman conflict(s): c-027. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-037 | Add select-risk-category validation | validation depends on model gap(s) cross-page-conditionality, risk-category-computed-versus-selected, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-038 | health-certificate-required page | MODEL GAP(S): cross-page-conditionality, risk-category-computed-versus-selected. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-039 | notification-hub page | MODEL GAP(S): risk-category-computed-versus-selected, external-outcome-and-status-variants. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-040 | commodity-extended-description page | MODEL GAP(S): repeating-group-in-repeating-group, commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop, shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-041 | Add commodity-extended-description validation | validation depends on model gap(s) repeating-group-in-repeating-group, commodity-dependent-reference-data-and-scope, unexercised-multi-commodity-loop. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-042 | commodity-additional-details page | MODEL GAP(S): shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-044 | latest-health-certificate page | MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-045 | Add latest-health-certificate validation | validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-046 | document-upload page and attachment metadata stub | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-047 | Add document-upload validation | needsHuman conflict(s) c-041. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-048 | accompanying-documents page | MODEL GAP(S): repeating-group-in-repeating-group. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-049 | Add accompanying-documents validation | validation depends on model gap(s) repeating-group-in-repeating-group. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-050 | approved-establishment-of-origin page | MODEL GAP(S): commodity-dependent-reference-data-and-scope. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-051 | Add approved-establishment-of-origin validation | the page has a gap-confidence validation state; validation depends on model gap(s) commodity-dependent-reference-data-and-scope. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-052 | search-approved-establishment page | MODEL GAP(S): commodity-dependent-reference-data-and-scope, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-053 | Add search-approved-establishment validation | validation depends on model gap(s) commodity-dependent-reference-data-and-scope. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-054 | traders-addresses page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-063 | consignee-creation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-065 | consignee-confirmation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-066 | importer and destination page state | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-068 | transport-details page | MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-069 | Add transport-details validation | needsHuman conflict(s) c-038; validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-072 | goods-movement-services page | MODEL GAP(S): cross-page-conditionality. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-073 | Add goods-movement-services validation | validation depends on model gap(s) cross-page-conditionality, two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-074 | transporter page | MODEL GAP(S): shared-page-object-cross-type-leakage, optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-077 | transporter-creation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-079 | transporter-confirmation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-080 | contact-details page | MODEL GAP(S): at-least-one-of-sibling-fields. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-081 | Add contact-details validation | validation depends on model gap(s) at-least-one-of-sibling-fields. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-082 | nominated-contacts page | MODEL GAP(S): at-least-one-of-sibling-fields, repeating-group-in-repeating-group. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-083 | Add nominated-contacts validation | validation depends on model gap(s) at-least-one-of-sibling-fields, repeating-group-in-repeating-group. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-085 | Add contact-address validation | needsHuman conflict(s) c-038; validation depends on model gap(s) two-layer-validation. Apply the verified catalogue only after the ruling; do not invent missing copy or policy. |
| inc-086 | branch-address-creation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-088 | branch-address-confirmation page | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-089 | review-notification page | MODEL GAP(S): summary-restatement-linkage; needsHuman conflict(s): c-028. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-090 | declaration page and submission transition | MODEL GAP(S): optimistic-concurrency-etag. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-091 | confirmation page | MODEL GAP(S): summary-restatement-linkage, external-outcome-and-status-variants. Confirm the executable CHED-P rule before this page consumes it. Do not author the ruling. |
| inc-092 | Delegated-authority tenancy and ownership model extension | MODEL GAP "delegated-authority-model": obtain/approve a CHED-P POAO journey and decide route placement/copy, designated responsible contact, Trade Partner lifecycle, draft privacy and the B2B/co-member permission matrix. Evidence is cross-type; do not author the POAO ruling. |
| inc-093 | POAO importer-or-agency eligibility page (later DoA) | Cross-type page are-you-a-plants-importer-or-agency has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it. |
| inc-094 | choose-your-organisation page (later DoA) | Cross-type page choose-your-organisation has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it. |
| inc-095 | manage-your-authorisations page (later DoA) | Cross-type page manage-your-authorisations has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it. |
| inc-096 | who-are-you-creating-this-notification-for page (later DoA) | Cross-type page who-are-you-creating-this-notification-for has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it. |
| inc-097 | which-company-is-this-notification-for page (later DoA) | Cross-type page which-company-is-this-notification-for has no CHED-P route/copy/validation evidence and consumes MODEL GAP "delegated-authority-model". Confirm the POAO-specific contract; do not copy Plant wording or invent it. |
| inc-098 | Assigned-organisation importer and responsible-person defaults | target-model.md Open Q5 and AUTH-11/AUTH-12: which designated POAO member/contact supplies responsiblePerson, and when do assigned-org defaults replace or coexist with manual values? Do not author the ruling. |
| inc-099 | Organisation-scoped draft and submitted visibility | target-model.md Open Q7/Open Q8 and AUTH-03/AUTH-07..AUTH-10: confirm CHED-P draft privacy, co-member actions and exact B2B role permissions. Do not author the ruling. |
| inc-100 | Trade Partner marking and ownership audit | target-model.md Open Q4/Open Q6 and AUTH-06: confirm submittedByAgent timing and Trade Partner/onBehalfOf behaviour on amend/copy. Do not author the ruling. |
| inc-101 | common-user-charge confirmation page (later variant) | c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed.  Do not author the ruling. |
| inc-102 | billing-select-address page (later variant) | c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed.  Do not author the ruling. |
| inc-103 | Add billing-select-address validation (later CUC) | This validation depends on unresolved CUC eligibility c-008. Do not author the ruling. |
| inc-104 | billing-contact-details page (later variant) | c-008 and MODEL GAP "cross-page-conditionality": decide what makes CHED-P chargeable (Sevington, isCuc or another rule) before this later CUC page is routed. Also confirm billing contact requiredness. Do not author the ruling. |
| inc-105 | Add billing-contact-details validation (later CUC) | This validation depends on unresolved CUC eligibility c-008 and the at-least-one-of-sibling-fields model gap. Do not author the ruling. |
| inc-106 | CSV commodity bulk-upload variant | CSV bulk upload is not present in the enriched CHED-P page/model evidence. Confirm file schema, limits, error report, mapping into CommodityLine and reconciliation with manual add/edit/remove before build. Do not author the ruling. |
| inc-107 | Article 72 low-risk variant | No verified CHED-P UI/business rule defines Article 72 eligibility or its journey effect. Confirm country×commodity classification, persisted/derived state and skipped/required pages. Do not author the ruling. |
| inc-108 | Split-consignment variant | Split consignment is post/submission-adjacent and has no verified first-pass create journey or target-model contract. Confirm actor, lifecycle point, parent/child identity, commodity allocation and ownership before build. Do not author the ruling. |

## Evidence receipt

- Enriched spec: 78 canonical page records, 609 field rows, 664 validation rows (656 grounded), 47 conflicts and 14 model gaps.
- Backlog: 9 milestones, 108 increments, 34 todo and 74 blocked.
- First pass: manual own-organisation create journey, whole-document Mongo persistence, ending at submission confirmation.
- Later: delegated authority/ownership in m7; CUC, CSV, Article 72 and split consignment in m8.
- Excluded: all post-submission inspector/decision/border/control work, Fish/IUU and cloning.
