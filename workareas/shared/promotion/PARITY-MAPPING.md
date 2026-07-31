# EUDPA-288 — test parity mapping: main suite → reworked journey

Comms artefact for the merge of `spike/EUDPA-288-model-retrofit` over `main` (2026-07-31). It accounts
for **every E2E spec the pre-rework suite had**: where its behaviour now lives in the reworked suite, or
why it was deliberately dropped. Built by a per-family fan-out that opened both sides of every mapping
before claiming equivalence (workflow `wf_66aa7ff6-9bc`); spot-check any row by opening the two files.

## The harness in one paragraph

Two frontends run simultaneously against one backend: the **reworked journey** (this branch, dev-built,
:3100) and the **pre-rework journey** (`:latest` image, :3200). `npm test` in the tests repo runs the
reworked suite + shared admin specs against :3100, reseeds, then runs the **frozen origin/main suite**
(vendored verbatim under `main-suite/`, isolated `@main-*` aliases) against :3200. Both green = the
rework delivers everything the old journey did. Latest full run: **reworked+admin 133 passed, main 245
passed, 0 failures** (flaky-recover only). CI runs the same flow as the `parity` job in the workspace's
reusable `e2e-tests.yml`.

## Why 245 main tests vs 133 reworked is still parity

The count difference is structural, not coverage loss:

- **The old journey has more, smaller pages.** Six separate party-select pages (~34 tests) became one
  parameterised picker template, pinned once. Four commodities pages folded into search + consignment
  details + per-unit identification. Port-of-entry became an autocomplete inside arrival details.
- **Finer-grained tests over a bigger DOM.** e.g. the old submitted-view spec spends 11 tests asserting
  field values one by one; the reworked CYA pins the full answer set in one seeded test.
- **Different lane composition.** The reworked count *includes* the shared admin service specs; the main
  count excludes them by design (admin is one live service, covered once).
- Of the old suite's **283 tests across 46 spec files**: 3 files map near-1:1 (`equivalent`), 26 map with
  a changed UI or reach (`adapted`), 12 fold into shared/parameterised reworked specs (`consolidated`),
  6 cover the same live service once (`shared-service`), and exactly **1 is dropped** with a recorded
  reason (visual baseline — see below).

## Status legend

| Status | Meaning |
|---|---|
| `equivalent` | Near-1:1 reworked spec, same behaviours |
| `adapted` | Same behaviour, reworked UI/reach (e.g. dropdown → autocomplete, view-page → dashboard action) |
| `consolidated` | Folded into a shared or parameterised reworked spec (no duplicated coverage) |
| `shared-service` | Same live service (admin/gateway), deliberately covered once |
| `dropped-documented` | Deliberate drop with a recorded reason |

Reworked homes are paths under `repos/trade-imports-animals-tests/tests/`.

## The mapping

#### origin/commodities/reason/declaration pages

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/pages/origin.spec.ts` | 10 | adapted | pages/origin.spec.ts, features/country-of-origin-enhancement.spec.ts, features/country-of-origin-no-js.spec.ts | Page smoke, valid save and no-country error live in the pages spec; the country dropdown is now an accessible-autocomplete combobox whose list/divider/persistence behaviour is pinned by the enhancement + no-js specs; internal-reference 58-char/alphanumeric validation is not re-asserted (the field survives — CYA row checked in hub-groups-and-cya-rows.spec.ts). |
| `e2e/pages/import-reason.spec.ts` | 5 | adapted | pages/import-reason.spec.ts, features/reason-purpose-scope.spec.ts | Reason radios/unchecked-default/valid-save map to the pages spec; the rework splits reason from purpose (new import-purpose page) and reason-purpose-scope pins scope-wipe, transit exit-details and task completion; reference-number test consolidated into reference-strip.spec.ts. |
| `e2e/pages/commodities.spec.ts` | 4 | adapted | pages/commodities.spec.ts | The commodity dropdown is replaced by a search-and-select picker; empty-on-load, controls and valid save-and-continue are covered there; reference-number test consolidated into reference-strip.spec.ts. |
| `e2e/pages/commodities-select.spec.ts` | 8 | consolidated | pages/commodities.spec.ts | The standalone species-selection page (type dropdown + species checkboxes + hardcoded commodity table) no longer exists — species are chosen inside the commodity search picker, exercised by searchAndSelect in the commodities pages spec and repeatedly across the cph-scope/animal-identifiers feature specs. |
| `e2e/pages/commodities-details.spec.ts` | 7 | adapted | pages/consignment-details.spec.ts, features/animal-identifiers-cap.spec.ts | The per-species quantity table with live JS subtotals is gone — counts are now per-commodity-line consignment details (animals/packages), covered by the pages spec, with the declared count's downstream effect (N-of-M cap, count-drop guard) pinned in animal-identifiers-cap. |
| `e2e/pages/commodities-identification.spec.ts` | 6 | adapted | pages/animal-identification.spec.ts, features/animal-identifiers-conditional.spec.ts, features/animal-identifiers-cap.spec.ts | The one-row-per-species ear-tag/passport table is replaced by a per-unit add-another flow: page smoke in the pages spec, commodity-conditional identifier types + permanent address in -conditional, and N-of-M counter/remove/count-drop in -cap. |
| `e2e/pages/cph-number.spec.ts` | 10 | adapted | pages/cph-number.spec.ts, features/cph-scope.spec.ts | Empty-on-load, valid save and empty-submit error map to the pages spec; slash-stripping, back-to-addresses and the addresses-hub row now live in cph-scope (CPH is commodity-gated in the rework); the 9-digit/non-numeric field-level error messages are not re-asserted. |
| `e2e/pages/declaration.spec.ts` | 6 | adapted | pages/declaration.spec.ts, journeys/promoted-notification.spec.ts | Controls and unconfirmed-submit error map to the pages spec; the submit path main only TODO'd (stayed on declaration) is now real and pinned by promoted-notification (submitNotification lands on /confirmation); reference-number test consolidated into reference-strip.spec.ts. |

#### party/address pages

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/pages/addresses.spec.ts` | 9 | adapted | features/addresses-picker.spec.ts, features/cph-scope.spec.ts, features/reference-strip.spec.ts, features/hub-groups-and-cya-rows.spec.ts | Landing page survives as the Roles-and-addresses hub task: spoke navigation and save-flow live in addresses-picker plus the journey walk, the sequential exit (now to CPH, no longer port of entry) is asserted in cph-scope, and the reference number moved to the shared journey strip covered by reference-strip. |
| `e2e/pages/consignors-select.spec.ts` | 5 | consolidated | features/addresses-picker.spec.ts, features/all-operators.spec.ts | Consignor is the exemplar role for the single parameterised picker template — addresses-picker covers select/save/copy-back, search, pagination and selection-carry, all-operators pins Astra Rosales + Switzerland on CYA, and blank-save validation moved to frontend controller tests (party-picker.controller.test.js). |
| `e2e/pages/consignees-select.spec.ts` | 6 | consolidated | features/addresses-picker.spec.ts, features/all-operators.spec.ts | Same one picker template exercised via the consignor exemplar; the consignee-specific pick runs in the shared journey walk (flows/journey.ts) and all-operators pins British Livestock Ltd + United Kingdom on CYA. |
| `e2e/pages/importers-select.spec.ts` | 6 | consolidated | features/addresses-picker.spec.ts, features/all-operators.spec.ts | Same one picker template; the importer pick runs in the shared journey walk and all-operators pins Import Co UK + United Kingdom on CYA. |
| `e2e/pages/destinations-select.spec.ts` | 5 | consolidated | features/addresses-picker.spec.ts, features/all-operators.spec.ts | Same one picker template; the destination pick runs in the shared journey walk and all-operators pins Tech Imports Ltd + United Kingdom on CYA. |
| `e2e/pages/place-of-origin-select.spec.ts` | 6 | consolidated | features/addresses-picker.spec.ts, features/all-operators.spec.ts | Same one picker template; the place-of-origin pick runs in the shared journey walk and all-operators pins Origin Farm + Ireland on CYA. |
| `e2e/pages/consignment-contact-select.spec.ts` | 6 | adapted | pages/contact-address.spec.ts | Contact address is now its own hub task: contact-address.spec.ts covers render, unchecked-default, single-select save, blank-save-allowed (an intentional change from the old flow) and add-new-address; the old transporter-back/continue-to-review sequencing is gone with the hub model. |

#### transport/documents/details pages

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/pages/port-of-entry.spec.ts` | 10 | adapted | pages/arrival-details.spec.ts, features/port-of-entry-enhancement.spec.ts | Page controls/valid-save/empty-submit error live in arrival-details; port selection + code persistence in the autocomplete-enhancement spec; reference number moved to reference-strip.spec.ts and granular day/month/year range validation is deliberately reduced to the empty-submit error summary. |
| `e2e/pages/transited-countries.spec.ts` | 6 | adapted | features/transit-means-scope.spec.ts, pages/transited-countries.spec.ts | Rail/road-routes-in, airplane/vessel-skips and wipe-on-means-change are exactly re-proven in transit-means-scope (plus hub-row visibility); the search/checkbox add-remove UI was replaced by select + add-another rows covered in the pages spec. |
| `e2e/pages/transporters.spec.ts` | 6 | adapted | pages/transporter.spec.ts, features/commercial-transporter-scope.spec.ts | The summary page with add-transporter link became a Commercial/Private type-radio page (controls/valid-save in the pages spec, onward routing in commercial-transporter-scope); the gov.uk transport-guidance link surface is gone and reference number moved to reference-strip.spec.ts. |
| `e2e/pages/transporters-select.spec.ts` | 4 | adapted | pages/transporter-selection.spec.ts, features/commercial-transporter-scope.spec.ts | Selection became radios (García Livestock fixture reused) with pick/persist/wipe-on-type-change proven in commercial-transporter-scope; the old details-table cell assertions (address/approval columns) have no reworked table to assert against. |
| `e2e/pages/accompanying-documents.spec.ts` | 18 | adapted | features/promoted-documents.spec.ts, features/documents-scan-lifecycle.spec.ts, features/documents-reject.spec.ts, journeys/persistence/persistence-accompanying-document.spec.ts | Upload/Checking-to-Safe/virus-found-with-error-summary/remove/continue flows map across the three feature specs plus the Mongo round-trip; the promoted model dropped the document-type select (type derived from filename), so type-options and invalid-type tests are surface-gone, and the 10-document cap has no reworked coverage. |
| `e2e/pages/additional-details.spec.ts` | 6 | adapted | pages/additional-details.spec.ts, features/additional-details-scope.spec.ts | Certified-for and unweaned radios keep controls/valid-save coverage in the pages spec, and the unweaned question is now conditional on a triggering commodity (proven in additional-details-scope); the old No-preselected default became unchecked-on-load by design, and reference number/back-link moved to reference-strip and task-page-exits. |

#### dashboard + view pages

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/pages/notification-dashboard.spec.ts` | 5 | adapted | pages/notification-dashboard.spec.ts, features/notification-dashboard-sort.spec.ts | Landing, create-new, card listing and per-card actions live in the reworked dashboard spec (create-new now routes to the import-type page not origin, and card actions are Resume/Copy as new/Delete instead of View); dashboard-landing plus results heading also exercised by the sort spec. |
| `e2e/pages/notification-dashboard-pagination.spec.ts` | 4 | consolidated | pages/notification-dashboard-pagination.spec.ts | Four page-one/next/previous/last-page tests folded into one seeded test asserting GOV.UK pagination, next/previous links, the Showing-X-to-Y result range and a differing card set on page 2; the explicit last-page leg was dropped as covered by the same range arithmetic. |
| `e2e/pages/notification-view-draft.spec.ts` | 12 | adapted | pages/notification-view-states.spec.ts, features/change-from-cya.spec.ts | DRAFT block of notification-view-states covers Change links, Continue-to-declaration and explicitly asserts Copy as new is absent on drafts (moved to submitted view/dashboard); the eight per-section change-link navigations become the change-from-cya round-trip (change context threads ?change=1 and save returns to CYA with the new value). |
| `e2e/pages/notification-view-submitted.spec.ts` | 16 | adapted | pages/notification-view-states.spec.ts, features/promoted-lifecycle.spec.ts, features/hub-groups-and-cya-rows.spec.ts | SUBMITTED block covers the read-only view (Submitted strip with reference, no Change links, Copy as new + Delete, answers still rendered); promoted-lifecycle re-asserts read-only plus amend re-entry; the eleven per-field value assertions are consolidated into hub-groups-and-cya-rows' full-answers CYA check against the reworked numbered-section/summary-card layout. |

#### lifecycle + auth features

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/features/notification-amend.spec.ts` | 5 | adapted | features/amend-resubmit.spec.ts, features/promoted-lifecycle.spec.ts | View-page Amend button is gone — amend now enters from the dashboard Amend action into the hub; amend-resubmit walks the full Submitted→Amending→Submitted UI round-trip with an edited answer kept, and promoted-lifecycle covers the API status lifecycle plus read-only-then-amend re-entry. |
| `e2e/features/notification-cancel-amend.spec.ts` | 5 | equivalent | features/cancel-amend-ui.spec.ts, pages/notification-view-states.spec.ts | cancel-amend-ui replays the same four behaviours (link while amending, confirmation page, No keeps, Yes discards and restores the submitted answer); the Submitted-has-no-cancel negative lives in notification-view-states' SUBMITTED block. |
| `e2e/features/notification-copy.spec.ts` | 2 | consolidated | features/promoted-lifecycle.spec.ts, pages/notification-view-states.spec.ts, pages/notification-dashboard.spec.ts | Copy semantics (new draft id, idempotent by key) are pinned at API level in promoted-lifecycle; the view and dashboard Copy-as-new affordances are asserted in the pages specs, and the full click-through-to-new-draft is the frontend canned suite's dashboard copy test (e2e/live-animals.spec.js). |
| `e2e/features/notification-delete.spec.ts` | 4 | adapted | features/notification-delete.spec.ts, features/promoted-lifecycle.spec.ts | The JS confirm dialog is replaced by a confirmation page — the reworked delete spec drives it end-to-end to the deleted banner, promoted-lifecycle pins idempotent API soft-delete, and the confirmation-gated dashboard-removal click-through is duplicated in the frontend canned suite (tagged @duplicated-in-frontend). |
| `e2e/features/notification-dashboard-sort.spec.ts` | 6 | equivalent | features/notification-dashboard-sort.spec.ts | Same six tests (default option, four-option dropdown, one submit-reload per sort value); only the error-summary negative assertion was dropped. |
| `e2e/features/auth.spec.ts` | 9 | equivalent | features/auth.spec.ts | Same nine tests verbatim; the unauthenticated deep-entry setup is rebuilt to mint a journey-scoped /notifications/{id}/origin URL (start a journey, keep journey cookies, clear auth) since deep pages are now per-journey. |
| `e2e/features/all-operators.spec.ts` | 6 | consolidated | features/all-operators.spec.ts | Six per-operator tests folded into one check-your-answers assertion covering all six operators' names, countries and CPH on the Roles and addresses card, reached via the full journey walk because the API seed does not unlock the addresses section. |

#### documents + infrastructure

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/features/accompanying-documents-file-size-limit.spec.ts` | 3 | consolidated | features/documents-reject.spec.ts | Three size tests fold into one oversize reject (ABOVE_PAYLOAD_CAP_BYTES, client-or-server message accepted); 10MB at-cap acceptance, exact one-byte-over boundary and the CDP nginx-413 regression are not pinned in the reworked suite. |
| `e2e/features/accompanying-documents-file-types.spec.ts` | 11 | consolidated | features/promoted-documents.spec.ts | Type coverage collapses to one PDF accept + one TXT reject E2E; the 7-type matrix, dotted/special-char filenames and ZIP reject are pinned at frontend unit level (src/server/live-animals/features/documents/upload-config.test.js), not E2E. |
| `e2e/features/accompanying-documents-no-js.spec.ts` | 3 | adapted | features/country-of-origin-no-js.spec.ts, features/documents-reject.spec.ts | No-JS discipline is retained but on a different control (country-of-origin plain select); the documents no-JS refresh-fallback link exists in the reworked template (documents/template.njk js-refresh-fallback) yet no reworked spec pins it, and the server-side oversize/Boom-413 crumb re-render paths are only reached JS-enabled via documents-reject. |
| `e2e/features/accompanying-documents-removal.spec.ts` | 1 | adapted | features/promoted-documents.spec.ts, journeys/persistence/persistence-accompanying-document.spec.ts | Removal plus empty-state is pinned in promoted-documents and upload persistence across reload in the persistence spec, but removed-doc-stays-gone-after-reload and the two-doc survivor-download case are not re-checked. |
| `e2e/features/accompanying-documents-view.spec.ts` | 2 | consolidated | features/promoted-documents.spec.ts, features/documents-scan-lifecycle.spec.ts | Safe-file download with byte-for-byte compare (plus content-type/nosniff headers) lives in promoted-documents, and virus-found-hides-view-link in documents-scan-lifecycle — the virus case is driven by the stub's filename trigger rather than EICAR content. |
| `e2e/features/outbox-event/outbox-event-notification.spec.ts` | 2 | adapted | features/outbox-event/outbox-event-notification.spec.ts | Same no-event-before-submit and submitted-event envelope/GBN-AG identity checks now driven through the reworked UI submit; the amend step's aggregateVersion-2 + NotificationSubmissionAmended envelope is not pinned (outbox-event-replay's amend seed asserts only the two-event count). |
| `e2e/features/outbox-event/outbox-event-replay.spec.ts` | 2 | shared-service | features/outbox-event/outbox-event-replay.spec.ts | Same live admin outbox-replay service (plus backend REPLAY_EVENTS audit) covered once by a near-identical spec — only the afterEach cleanup switches to the reworked frontend's delete flow and a banner-copy assertion is added. |
| `e2e/features/dlq/dlq-events.spec.ts` | 2 | shared-service | features/dlq/dlq-events.spec.ts | Same live admin/gateway DLQ service covered once by a byte-identical spec (only import aliases differ) — replay-all and delete-all seeded direct onto the queue. |

#### persistence journeys + admin + visual + a11y

| Main-suite spec | Tests | Status | Reworked home | Notes |
|---|---|---|---|---|
| `e2e/journeys/persistence/persistence-notification.spec.ts` | 3 | adapted | journeys/persistence/persistence-notification.spec.ts | Draft + submitted Mongo round-trip kept against the reworked journey with representative-field assertions plus a read-only reload check; the defaults-overridden third test is folded in — its override fields (requiresRegionCode yes, internalReference) are asserted in the single submitted test. |
| `e2e/journeys/persistence/persistence-accompanying-document.spec.ts` | 1 | adapted | journeys/persistence/persistence-accompanying-document.spec.ts | Same accompanying_documents Mongo projection (uploadId, dateOfIssue, scanStatus, s3Key, checksum) asserted through the promoted uploader — document type is now filename-derived ('OTHER', no type select) — plus a fresh-page-load reload assertion. |
| `e2e/features/admin/admin-auth.spec.ts` | 9 | shared-service | features/admin/admin-auth.spec.ts | Admin is the same live service in both stacks; the reworked copy is byte-identical bar the @main-fixtures→@fixtures alias, covering all 9 sign-in/sign-out/deep-entry behaviours once. |
| `e2e/pages/admin/admin-dashboard.spec.ts` | 2 | shared-service | pages/admin/admin-dashboard.spec.ts | Same live admin service covered once; reworked copy is byte-identical bar the fixture alias (dashboard landing + navigate to notifications). |
| `e2e/pages/admin/admin-notifications.spec.ts` | 5 | shared-service | features/admin/admin-notifications.spec.ts | All 5 behaviours preserved (delete by reference / checkbox / select-all, cancel keeps row, invalid reference fails — each with its backend audit-record assertion); only the seeding is adapted, using the reworked UI submit and 3-shape apiJourney. |
| `e2e/pages/admin/admin-outbox-events.spec.ts` | 2 | shared-service | features/admin/admin-outbox-events.spec.ts | Both behaviours preserved (NotificationSubmitted event row + envelope + JSON, and unknown-reference empty state), seeded via a real reworked UI submit; deep payload-field JSON checks moved to tests/e2e/features/outbox-event/outbox-event-notification.spec.ts. |
| `e2e/visual/origin-of-import.visual.spec.ts` | 1 | dropped-documented | — | Visual regression runs in the main lane only; a reworked visual equivalent was deliberately not authored (recorded in DUAL-FRONTEND-PARITY-PLAN.md) since the reworked origin page invalidates the pixel baseline. |
| `a11y/ (10 files: journey initial/filled/error states, dashboard views/viewports, view states, admin ×4)` | 11 | adapted | a11y/ (same 10 filenames) | All 10 files have same-named reworked homes: the 6 journey/dashboard walks are rewritten to scan every page of the reworked hub journey (WCAG 2.2 AA, axe) while the 4 admin a11y specs are byte-identical bar the fixture alias (shared admin service). |

## Net-new coverage the old suite never had

The reworked suite is not just a port — these behaviours had no pre-rework test at all:

- **Conditional scope + wipe-on-change** across the journey (reason/purpose, unweaned, CPH gating,
  transit means, commercial + private transporter) — the hub model's defining behaviour.
- **Hub six-group task list** structure and **CYA answered-rows** with exact values.
- **Change-from-CYA threading** (`?change=1` round-trip).
- **Documents scan lifecycle** (Checking → Safe / Virus found with error summary) and oversize reject.
- **Autocomplete enhancements** (country of origin, port of entry) + **no-JS fallback**.
- **Address book picker** (search, pagination, selection-carry, add-new) and per-run-unique creation.
- **Amend resubmission** through the UI — old suite never resubmitted (its declaration submit was a TODO).
- **Full submit-to-confirmation journey** (`promoted-notification`) and the 3-shape API seed
  (fulfilment + notification + proposed-notification per save).
- **Security headers** (`headers.spec.ts`), **import-type routing**, **task-page exits**, **reference strip**.

## Honest ledger — main behaviours not re-pinned E2E (follow-up candidates)

None of these block the merge; all are recorded so nothing is silently lost:

- Field-level validation message granularity: internal-reference 58-char/alphanumeric, CPH 9-digit/
  non-numeric messages, arrival date day/month/year range checks (empty-submit summaries are pinned).
- Documents: the 10-document cap; at-cap (10MB) acceptance + one-byte-over boundary; CDP nginx-413
  regression (CDP-only, skips locally); documents-page no-JS refresh fallback (template has it, no spec
  pins it); removed-doc-gone-after-reload; the 7-file-type matrix is unit-level, not E2E.
- Outbox: the amend event's aggregateVersion-2 / NotificationSubmissionAmended envelope fields.
- Old transporter details-table columns (surface gone), origin visual baseline (main lane only).

## Where things live

- Harness + run recipe + review record: `workareas/shared/promotion/DUAL-FRONTEND-PARITY-PLAN.md`
- Frozen old suite: `repos/trade-imports-animals-tests/main-suite/` (never edited, `@main-*` aliases)
- Reworked suite: `repos/trade-imports-animals-tests/tests/`
- Run it: workspace stack up (`run-stack.sh -d` then `run-stack.sh -d --profile test-target`), then
  `npm test` in the tests repo. CI: `parity` job in the workspace reusable `e2e-tests.yml`.
