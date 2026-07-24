# IUU journey specification gate

## Grounding & confidence

This specification is **approximately one-trace-grounded**: essentially all rendered evidence comes from the single db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d happy-path CHED-P fish submission, supplemented by the QA automation repository. Most validation rules and mandatoriness are **gaps, not requirements**. The fish/catch-certificate delta is the load-bearing IUU content and is where the real mined requirements live. Substantial remaining IUU substance — catch-certificate and IUU-declaration legacy templates, plus DoA material — is deferred to a separate legacy/DoA enrichment pass that **has not been run**. Coverage must not be read as complete; a high open-question/gap count is the honest outcome for this corpus.

## Gate summary

- Pages: **43** (all inventory specs merged)
- Page-level field entries: **199**
- Distinct field obligations after deduplication: **198**
- Field confidence: **179 confirmed / 19 inferred / 0 gap**
- Requiredness: **5 required / 165 not required / 28 unknown**
- Validation-message confidence: **1 confirmed / 11 inferred / 20 gap**
- Conflicts: **13**, of which **4 need a human ruling**
- Model gaps: **7**
- Open questions after exact whitespace-normalised deduplication: **341**

The field-level `gap` count is zero because a rendered control can be confirmed even when its mandatory rule and validation copy are unknown. The requiredness and validation-message figures above are the more honest indicators of weakness: 28 obligations have unknown requiredness and 20 validation messages are gap-tagged.

## Conflict register

Rows needing a human are deliberately first.

| ID | Human? | Page | Topic | Sources | Detail | Ruling |
|---|---:|---|---|---|---|---|
| c-004 | **YES** | origin-of-import | Region-code maximum length | rendered-trace | The rendered hint says “Enter up to 5 characters.” while the same rendered input has maxlength="3". | Preserve both facts: hint copy remains verbatim and maxlength remains 3 in the mined legacy model. The rebuild must choose one consistent maximum and matching copy. |
| c-011 | **YES** | review-notification | Consignment reference on review | rendered-trace, test-assertion | The review trace rendered Consignment reference number empty. ched-p-notification.spec.ts:47 asserts #reference-number contains the configured reference number. | Treat the review row as a restatement of origin-of-import.local-reference-number that supports both blank and populated states. Requiredness cannot be decided from these sources and remains unknown. |
| c-012 | **YES** | select-risk-category | Risk-category initial state | rendered-trace, workflow-config | The trace shows hidden highest-risk-category=High and a user selection of Medium. Different CHED-P workflow defaults carry mediumRisk and highRisk; these are test data, not proof of a UI default. | Model highest-risk-category as a separate computed value and risk-category as an explicit user answer. Do not infer a canonical preselection from workflow defaults. |
| c-013 | **YES** | document-upload | Document-upload 10 MB boundary | rendered-trace, test-assertion | User-facing copy describes files “up to 10MB”; asserted error copy says “The selected file must be smaller than 10MB”. The available tests exercise oversize files but do not establish whether exactly 10MB is accepted. | Preserve both verbatim strings and leave the inclusive/exclusive 10 MB boundary unresolved until a boundary test or product ruling supplies it. |
| c-001 | No | notifications-dashboard | Notification listing layout | rendered-trace, page-object | The rendered trace (db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9) shows notification-list__row cards in a bespoke card grid. NotificationDashboardPage.ts:244-250 addresses #notifications-page tbody tr and td using table semantics; those locators are not used by a CHED-P test. | Adopt the rendered card-grid structure in the evidence model because rendered-trace wins on structure. Treat the table locators as stale or variant-only scaffolding; the rebuild may deliberately replace the legacy cards with a standard GOV.UK pattern. |
| c-002 | No | accompanying-documents | Accompanying-document type option set | rendered-trace, workflow-config | The trace rendered 14 document-type options on the CHED-P fish page. types/document-type.ts contains 27 values, including values absent from the rendered list. | Keep the 14 rendered options as the observed page set. Treat the 27-value catalogue as a wider vocabulary filtered by CHED type/context, not as 13 additional IUU options. |
| c-003 | No | commodity-extended-description | Package-type option set | rendered-trace, workflow-config | The trace rendered 26 package types for commodity 03019230. types/package-type.ts contains 33 package types, seven of which did not render for this commodity. | Keep the 26 rendered values for the observed commodity and model the list as reference data filtered by commodity/CHED context. Do not promote the wider 33-value catalogue to this field. |
| c-005 | No | origin-of-import | Country-of-origin page boundary | rendered-trace, test-assertion, page-object, workflow-config | Trace action 15 renders origin-country together with the Origin of import fields on one page. CountryOfOriginPage.ts, OriginOfImportPage.ts, the workflow’s two Save-and-continue clicks, and two named accessibility checks model Country of origin and Origin of import as separate pages. | Retain both inventory pages to preserve canonical journey order, but count country-of-origin.origin-country once. Mark origin-of-import.origin-country as a linked restatement/alias. Rendered-trace wins on observed structure; the conflict remains visible because the QA journey spine is split. |
| c-006 | No | consignor-creation | Consignor creation role copy | rendered-trace, page-object, workflow-config | The consignor/exporter workflow navigates through ConsignorCreationPage, but the rendered page says “Add consignee”, labels company-name “Consignee name”, uses title="consignee", and posts through /traders/consignee/new?reimport=true. | Preserve the rendered labels and heading in the legacy evidence model because rendered-trace wins on copy. Record the trader-role mismatch prominently; the new IUU design should correct the role language rather than inherit this apparent shared-template defect. |
| c-007 | No | contact-details | Contact-details action matrix | rendered-trace, page-object, workflow-config | The trace renders “Save and return to hub”, “Save and continue”, and “Cancel and return to hub”. The page object/workflow uses “Save and continue” or the amend/review variant “Save and review”, and does not expose “Save and return to hub”. | Keep the trace-rendered create/hub actions and retain “Save and review” only as an inferred entry-context variant. Do not collapse these labels into one unconditional button set. |
| c-008 | No | document-upload | General document-upload extensions | rendered-trace, test-assertion | Rendered copy and the wrong-type error name DOC, JPEG, PDF, PNG and XLS. Valid-upload tests accept jpg, png, doc, docx, xls and pdf, proving JPG and DOCX aliases/extensions work although the copy does not list them. | Preserve the rendered copy verbatim and record the test-proven accepted extensions as behavioural intent. The rebuild must make its displayed extension list exactly match the implemented allow-list. |
| c-009 | No | goods-movement-services | GVMS “No” radio identifier | rendered-trace, page-object | The rendered No radio id is gvms-question-2. GoodsMovementServicesPage.ts:35-37 contains a //todo locator for #gvms-question-no. | Adopt gvms-question-2 as the observed legacy identifier and treat #gvms-question-no as stale scaffolding. Accessible labels, not the legacy id, should drive the rebuild. |
| c-010 | No | search-for-approved-establishment | Approved-establishment terminal action | rendered-trace, page-object, workflow-config | The captured trace action is a per-row “Select” that adds an establishment. SearchForApprovedEstablishmentPage.ts:18-20 and every CHED-P workflow use a separate “Save and continue” to finalise the selected list; that terminal control was not rendered in the captured snapshot. | Model “Select” as the confirmed per-row add action and “Save and continue” as the inferred terminal action. Set the canonical continue label to “Save and continue”; tests establish intent where the trace is silent. |

## Model gaps

### cross-page-conditionality

Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph.

Affected pages: `catch-certificate-needed`, `attach-catch-certificate`, `manage-catch-certificates`, `add-catch-certificate-details`, `select-risk-category`, `health-certificate-required`, `latest-health-certificate`, `origin-of-import`, `means-of-transport-after-bcp`.

### nested-catch-certificate-repeats

An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities.

Affected pages: `attach-catch-certificate`, `manage-catch-certificates`, `add-catch-certificate-details`, `review-notification`.

### repeating-row-groups

Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model.

Affected pages: `accompanying-documents`, `nominated-contacts`, `transport-details`, `approved-establishment-of-origin`, `search-for-approved-establishment`.

### commodity-dependent-reference-data

Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins.

Affected pages: `search-commodity`, `commodity-basic-description`, `commodity-extended-description`, `add-catch-certificate-details`.

### legacy-page-boundary-alias

Country of origin appears as its own inventory page and inside the rendered Origin of import page. The second field occurrence links to the first canonical obligation; the model cannot represent two alternative legacy page spines simultaneously.

Affected pages: `country-of-origin`, `origin-of-import`.

### review-restatement-linkage

The review page restates answers from many earlier pages, including catch-certificate and IUU data. These summaries are links to existing obligations, not new fields; the current model captures their structure/copy but does not map every summary row to its source field.

Affected pages: `review-notification`.

### external-risk-outcome-variants

Confirmation content branches on an externally produced risk-assessment outcome. Only “Inspection required” rendered; other asserted outcomes are retained as gaps, and the flat model cannot encode the external decision contract.

Affected pages: `confirmation`.

## Open questions

All source-spec `openQuestions` are retained below. Exact whitespace-normalised duplicates were removed; page-specific questions with similar themes remain separate because they concern different obligations.

### 1. notifications-dashboard

- The dashboard is a listing + search + data-quality-alert surface for ALL CHED types, not an IUU-specific page. The only load-bearing requirement for the IUU rebuild is the entry point: the 'Create a new notification' primary action (href /notification/vnet/protected/notifications/consignment/page-1?source=dashboard) that begins the journey, plus 'Clone a certificate' (out of scope per the CHED-PP ruling that cloning is out).

- The Notification type filter has no 'IUU' option — IUU fishery products are filed as CHED-P today. Confirm the new standalone IUU app still needs a dashboard entry point at all, or whether IUU pre-notifications will be created from a different surface.

- Search/filter, sort, pagination, per-notification cards and the 'My alerts' digest are dashboard-management features. GAP: whether the new IUU app must reproduce any of these list-management capabilities, or only the create-notification entry point. This needs a human product decision.

- IPAFFS uses a bespoke defra-datepicker, notification-list card grid, custom pagination and info-summary box — all outside the GOV.UK Design System. If the rebuild needs a listing/pagination it should use govuk Table/Summary list + govuk Pagination + the plain Date input, not copy these widgets.

- The 'Recover notifications from archive' and archived-notifications surface, and the 'Consignments to be inspected' / 'Chosen for inspection' banners, are adjacent features not exercised by the IUU create flow — scope TBD.

- LAYOUT DISCREPANCY (finding): the trace renders the results as a bespoke card grid (notification-list__row cards), but the page object addresses the same list via TABLE semantics — #notifications-page tbody tr and td (page-objects/notification/NotificationDashboardPage.ts:244-250). Either the markup is a table styled as cards, or the tbody/tr locators are stale/unused (they are not referenced by any ched-p test). Rendered reality (cards) wins; confirm which the real DOM is before the rebuild picks a govuk Table vs Summary-list listing.

- SEARCH BEHAVIOUR (inferred requirements from tests/dashboard/dashboard-search.spec.ts): searching by an exact reference returns a result count of exactly 1 and renders that notification's View-details control (:93-95); a non-matching commodity code returns a count of 0 (:119-122); filters compose (Status=NEW + Country=AF narrows to the single expected row, :101-112). The result count is surfaced in an element #notification-count (page object :260-262). If the IUU app keeps a listing it should honour these count/compose semantics.

- TRADE-PARTNER INTERSTITIAL (inferred, out of IUU scope): the 'Manage trade partners' secondary action leads through a Yes/No radio + Continue confirmation to a 'Manage your authorisations' page (page-objects/notification/NotificationDashboardPage.ts:36-42,252-254; tests/tradePartner/manage-trade-partner.spec.ts:7-10). Not part of the create-notification entry point; recorded only so the surface is not mistaken for a dashboard field.

- A 'Yesterday' date shortcut exists on the shared dashboard page object (btnSearchByYesterday) but was never rendered in our notification-dashboard trace and is only exercised (in a currently commented-out test) against the record-control dashboard. Confirm whether 'Yesterday' is a notification-dashboard control at all, or control/decision-dashboard-only.

### 2. import-type

- Evidence-pointer route mismatch: the prompt's inferred URL '.../{chedReference}/import-type' was NOT observed. The real form action is '/notification/vnet/protected/notifications/consignment/page-1' and the page container id is 'import-type-page'. There is no {chedReference} in the path at this stage (the notification does not yet have a CHED reference — this page CREATES the notification). The rebuilt IUU app URL should be decided fresh.

- Required-field validation copy is unknown (gap) — no error-state trace was in this evidence pair. What message renders when no option is selected?

- There is no standalone 'IUU' or 'fishery products' radio. IUU is entered by selecting 'Products of animal origin, germinal products or animal by-products' (CVEDP / CHED-P), then the fish/IUU sub-journey diverges downstream. For the NEW standalone IUU app this whole CHED-type selector page likely disappears (the app is IUU-only) — flag to spec author: page 1 in IPAFFS is a type-router that the rebuild does not need.

- The legend is empty and the question is a sibling H1 (non-standard GDS radios markup) — rebuild should use the page-heading-legend pattern.

- SOURCE 2 corroborates the page structure fully but adds no new fields or behaviours: ImportTypePage.ts:3-24 exposes exactly the 4 radios + Save-and-continue already captured by the trace, so this page has no variant-only branch and the traced picture is complete.

- A11y note (inferred, ched-p-accessibility-tests.spec.ts:23,27 + ched-a/-d/-pp equivalents): the QA accessibility suite drives checkPageAccessibility() on this page both before and after selecting a radio and expects it to PASS axe checks — i.e. the empty-legend / sibling-H1 deviation did not trip automated a11y in the tests. That is not a clean bill of health (axe cannot detect a missing group label reliably); the manual GDS finding above still stands. Flag: the rebuild's page-heading-legend version should also pass axe, so adopting it costs nothing.

- For the NEW standalone IUU app, this whole CHED-type router page is very likely OUT OF SCOPE — the app is IUU-only, so there is no 'what are you importing?' choice to make. Source 2 confirms this page exists purely to fork the four CHED journeys (one radio per type). Confirm with the spec author that page 1 is dropped in the rebuild.

### 3. country-of-origin

- URL/route: the real hapi route is `/notification/vnet/protected/notifications/consignment-origin` with a `?type=CVEDP` query param (CVEDP = CHED-P, the fish/IUU type) — the form id is `country-of-origin` but the URL slug is `consignment-origin`. The task's assumed url pattern `.../country-of-origin` is NOT the real route. Confirmed from the form action attribute and cookie-settings returnUrl in the snapshot.

- `required`: set to true inferred, not confirmed. The <select> carries NO HTML `required` attribute and there is a placeholder first option `Select a country` (value=""), so mandatory-ness is enforced server-side. No trace in this corpus exercised submitting the page empty, so the exact validation message is unknown (validationMessages is empty). This is a candidate to mine from one of the 38 error-bearing traces if one covers this page.

- Option list is reference data (254 options = 1 placeholder + 253 country entries). Notable: the UK is rendered as a single <optgroup label="United Kingdom of Great Britain and Northern Ireland"> containing four constituent-nation options — England (GB-ENG), Northern Ireland (GB-NIR), Scotland (GB-SCT), Wales (GB-WLS) — rather than a single 'United Kingdom' value. Values are ISO-ish 2-letter codes with some bespoke extensions (ES-CN Canary Islands, GB-ENG/NIR/SCT/WLS, XK Kosovo). The new app should source this from a reference-data service, not hardcode it.

- No hint text, no body copy, no inset/warning/details, no error summary rendered on this page in the happy-path trace. Single-field page: caption + H1 + one Select + Save and continue.

- The only 'Back' link is in platform chrome (header nav, href="#"), not a govuk-back-link inside main. Recorded as backLink 'Back' but it is header furniture, not an in-main Back link component.

- VARIANT-ONLY SUBMIT BUTTONS (inferred, not trace-observed): the SHARED page object exposes three submit buttons — 'Save and continue' (create journey + CHED-P amend, the only one the IUU happy-path trace rendered), 'Save and review' and 'Save and return to hub'. CORRECTION to earlier drafts: the latter two are NOT exercised by any CHED-P/IUU test — 'Save and review' is clicked only in the out-of-scope CHED-PP journey and 'Save and return to hub' only in the out-of-scope CHED-A journey (grep of countryOfOrigin.btnSaveAndReview / btnSaveAndReturnToHub across the suite returns only ched-pp and ched-a hits, plus ched-a-workflows.ts:1191). For the IUU journey there is therefore NO evidence either button renders on this page. The new IUU app should default to a single consistent primary action unless a product decision reintroduces entry-point-dependent submit labels. Cite ipaffs-qa-automation/page-objects/notification/CountryOfOriginPage.ts:10-19.

- DOWNSTREAM-CLEAR BEHAVIOUR (inferred, not trace-observed): amending the country of origin CLEARS the downstream consignment purpose — after re-selecting country and Save and continue, the About-the-consignment purpose must be re-entered. Asserted implicitly by the amend spec, which re-selects the re-entry purpose immediately after changing country ('Purpose is cleared after amending country of origin'). Cite ipaffs-qa-automation/tests/notification/ched-p/ched-p-manipulation.spec.ts:47-48. This is a cross-page invalidation rule the new app must reproduce or consciously drop.

- VALIDATION MESSAGE STILL A GAP: no trace in this corpus submitted the page empty, and the QA suite always drives selectOption before Save (never an empty submit), so the mandatory-field error copy remains unknown. validationMessages is empty by design — this is an honest gap and a question for a human / a later error-copy mining pass over the 38 error-bearing traces, none of which were confirmed to cover this page.

- AMEND ENTRY POINT (inferred): this page is reached in the amend flow via the amend/hub page. NOTE the locator naming is misleading — pages.amendNotification.linkAmendCountryOfOrigin actually resolves to a link named 'Origin of the import' (getByRole link name 'Origin of the import'), NOT a link literally captioned 'Amend country of origin'. There is also a distinct change-link locator #country-of-origin-change-link (amendNotification.linkCountryOfOriginChangeLink). Cite ipaffs-qa-automation/page-objects/notification/AmendNotificationPage.ts:6-12 and ipaffs-qa-automation/tests/notification/ched-p/ched-p-manipulation.spec.ts:42.

- REVIEW-PAGE RENDER (inferred): the review page renders the chosen country under a GOV.UK summary-list row whose dt is 'Country of origin' and whose value is the HUMAN-READABLE COUNTRY NAME, not the ISO code — the amend test asserts reviewNotification.countryOfOriginValue toHaveText('India') both before and after submission. The dd carries a bespoke class review-summary-list__value (non-govuk class name on the review page, though out of scope for this page's own rebuild). This corroborates that the <option> visible label on THIS page is the country name (selectOption('India') at ched-p-manipulation.spec.ts:44 matches by that label). Cite ipaffs-qa-automation/page-objects/notification/ReviewNotificationPage.ts:60-67 and ipaffs-qa-automation/tests/notification/ched-p/ched-p-manipulation.spec.ts:67,80.

### 4. origin-of-import

- No error/validation state was captured for this page in this trace (0 errors). Verbatim validation copy for a missing origin-country, consigned-country, or unselected radio group is a gap — mine an errored trace if one exercised this page.

- region-code maxlength is CONFIRMED 3 (input attribute), but its hint reads 'Enter up to 5 characters.' — an in-app copy/attribute mismatch a human should resolve for the rebuild. required-when-shown remains a gap (no error state captured).

- Page title '<title>Add a reference number for this consignment</title>' matches the last field, not the H1 'Origin of the import' — likely an IPAFFS title-generation quirk; flag for the rebuild.

- URL pattern derived from the returnUrl in page chrome ('.../DRAFT.GB.2026.1525979/consignment/page-2'); the canonical route name for the new app is a gap.

- The conform-to-regulations 'No' branch and the region-of-origin 'Yes' branch were not exercised in this trace (defaults kept), so any downstream conditional pages they open are not evidenced here.

- PAGE-BOUNDARY DISCREPANCY (finding): the rendered trace (action 15) shows ONE page (page-2) carrying origin-country, region-code-option, region-code, consigned-country, conform-uk-regulations, transport-details-required and local-reference-number together. But the QA suite models these as TWO separate pages — a 'Country of Origin Page' (country dropdown + its own Save and continue) followed by an 'Origin of Import Page' (conform + change-after-BCP radios + Save and continue). Both the workflow (two sequential Save-and-continue clicks: ched-p-workflows.ts:279 then :284) and the accessibility spec (distinct checkPageAccessibility snapshots 'Country of Origin Page' at :32 and 'Origin of Import Page' at :38) treat them as distinct pages. Either the trace corpus was recorded against a newer IPAFFS build that merged the two, or the getByLabel selectors resolve across a navigation. Rendered reality (merged single page) is kept as confirmed; a human should confirm whether the NEW app should present one merged page or preserve the split — and where consigned-country / region-code / local-reference-number actually live in the split version (they have no page-object counterpart at all).

- The OriginOfImportPage page object (page-objects/notification/OriginOfImportPage.ts:10-12) also exposes radioHealthCertificateNo — group 'Does your consignment require a health certificate?' → 'No'. This control is NOT on the origin-of-import page: the accessibility spec shows a SEPARATE downstream 'Health Certificate Required Page' (ched-p-accessibility-tests.spec.ts:64) reached after Select Risk Category. The page object simply groups it here for convenience. Recorded as a cross-reference so it is NOT mistaken for an origin-of-import field; it belongs to its own later page in the journey and no workflow ever drives it (dead locator in the suite).

- Four of the seven fields (region-code-option, region-code, consigned-country, local-reference-number) have NO QA page-object or workflow counterpart — the automated suite never touches them and accepts the rendered defaults. Their required/optional flags and any conditional/validation behaviour rest on trace evidence alone and cannot be corroborated by a test assertion. Human confirmation needed on: is consigned-country required and must it differ from origin-country; is region-code mandatory + maxlength when region-code-option=Yes.

### 5. search-commodity

- Back link text not captured — it sits outside <main> (platform chrome) and was not in the snapshot; marked gap.

- The 'Species search' tab is an alternative search mode (find commodity by species). Its fields were not exercised in this trace — a separate page/mode worth mining. For IUU (fish), species search may be the more natural entry point.

- No validation copy captured (happy-path trace, 0 errors). Empty-code and unknown-code error messages are a gap — mine an errored trace if one exists.

- The full HS commodity tree renders for all CHED types. For the scoped IUU/fish journey the relevant surface is CN code 03019230 (Anguilla spp.) under chapter 03; the new app almost certainly should not reproduce the whole HS tree browser.

- URL is inferred from page objects (/notifications/{chedReference}/commodities); the trace uses prototype-style form action 'page-3', so the real route is not directly confirmed from this snapshot.

- The 'Species search' tab is not exercised by ANY test — no page object getter exists for a species-search field (SearchCommodityPage exposes only the code input, Search button and the 'Commodity code search' tab link). So species search is trace-present chrome but has zero source-2 corroboration for its fields/behaviour. For IUU (fish) it may be the more natural entry point; confirm with a human whether the new app needs it at all.

- Default active tab varies by CHED journey: the fish/product flow lands on 'Commodity code search' (types the code with no tab click, ched-p-workflows.ts:866-868), whereas CHED-A/CHED-PP tests click 'Commodity code search' to switch to it first (ched-a-workflows.ts:272; ched-pp-workflows.ts:299) — implying a different default there. Confirm the intended default landing mode for the IUU journey.

- Is the commodity code a required field? No HTML required attr was observed and no test drives the empty-submit path; functionally the user must either enter a code or drill the tree. Confirm the intended required/validation rule with a human.

- The Search Commodity page is included in the CHED-P accessibility sweep (ched-p-accessibility-tests.spec.ts:41-44 runs an axe check on 'Search Commodity Page'), so WCAG compliance is an asserted requirement — but the bespoke commodity tree and off-label Tabs are exactly the patterns the new app should not reproduce.

### 6. commodity-basic-description

- VALIDATION COPY IS A GAP. The `required` attribute is false on all three controls in the DOM, but validation is almost certainly server-side (this trace is a happy path with no error state). No CHED-P test asserts any validation/error-message string for this page (grep of tests/notification/ched-p/* and tests/accessibility/* found only happy-path field fills, no expect() on error copy), so we have NEITHER trace nor test evidence for error messages. The species selection and add-another-commodity radio are likely mandatory when their controls render — but their exact error copy needs a trace with a validation error to confirm. Left as an honest gap for a human.

- The species checkbox list is commodity-code-specific reference data (here Anguilla anguilla / Anguilla spp. for code 03019230). Both the species list AND the Type-of-commodity option list are keyed on commodity code, and both controls are ENTIRELY ABSENT for non-taxonomy codes (tests pass typeOfCommodity='' and species='' for code 96020000 — ched-p-auto-clearance.spec.ts:56-57). Confirm the full species taxonomy and the type option-set against the reference-data service; not derivable from traces alone (traces are a lower bound — only Anguilla-code species were exercised).

- The 'Type of commodity' select for fish codes offers Farmed stock (20) / Wild stock (61). The wider CHED-P domain vocabulary the tests use has four labels — Domestic, Farmed game, Farmed stock, Wild game (types/commodity-type.ts) — which apply to meat/other codes, NOT fish. Confirm the fish/IUU code set only ever offers Farmed stock / Wild stock, and how 'Farmed' vs 'Wild' feeds downstream (IUU catch-certificate applicability likely turns on wild-caught).

- The shared page object (CommodityBasicDescriptionPage.ts) exposes a CHED-PP (plants) variant of this page — an EPPO-code textbox + Search + 'Add ' button + a #{species}-checkbox locator (lines 14,22-32). These are NOT used by the IUU/fish flow (which renders species as a fixed checkbox list). Excluded from this IUU page's fields because it is CHED-PP-only and was not rendered in the IUU trace. Confirm the IUU journey never needs EPPO-code species search.

- A hidden input name=class (id=class-select-hidden) and hidden ids type-id/class-id/family-id/complement-id carry the taxonomy identifiers — the visible select only exposes 'type'; the class/family layer of the IPAFFS commodity taxonomy is not surfaced on this page in this trace. The separate CommodityClassPage page object (a 'Select class' dropdown) suggests class can be its own page for some commodities — confirm whether IUU/fish codes ever route through a class-selection step.

- IPAFFS ARCHITECTURE the new app should NOT copy: this single page contains TWO separate <form>s. The Type-of-commodity <select> sits in its own GET form (id=categories, action=page-4) with a hidden name=class; the species checkboxes + add-another-commodity radios + Save-and-continue button sit in a SECOND POST form (action=page-4). Changing the type therefore triggers a GET page reload (page-4?commodity-selected-code=…&type=…) that re-renders the species checkbox list for the newly-selected type. This is a legacy round-trip/repopulation pattern; the new CDP app should populate species reactively from a reference-data service keyed on (commodity code, type) without a full-page GET reload. Confirmed: DOM at action 22 shows both forms; the network shows GET page-4?commodity-selected-code=03019230 (request 3791) followed by a GET with &type appended (request 3808).

### 7. about-the-consignment

- Evidence trace db2d277c... is a CHED-P (Fish) notification, not a dedicated IUU trace. This 'About the consignment / purpose of import' page is shared across CHED-P (and CHED types); it is a strong proxy for the IUU journey since IPAFFS files IUU fishery products as CHED-P. Confirm the IUU rebuild keeps the same four-purpose model (Internal market / Transhipment / Transit / Re-entry) or simplifies it — the new standalone IUU app may not need all four purposes.

- The shared page object exposes extra purpose radios that belong to OTHER CHED types and were never rendered in the CHED-P/IUU corpus: 'Non-internal market' (AboutTheConsignmentPage.ts:22-24), 'Transfer of ownership – Rescue' (:26-28) and 'Temporary admission horses' (:34-36), plus a select#bcp-temporary-admission (:42-44). These are CHED-A live-animals options. Confirm none of them apply to IUU — the IUU purpose set should be the four CHED-P purposes only.

- The 'purpose' radio group and all conditional sub-fields showed required=false in the DOM (client-side/JS-driven validation, not the HTML required attribute). No error state was captured in this passing trace, and no CHED-P test asserts a validation-message string for this page, so all validation copy ('Select a reason' / country / date / time messages) is a gap — mine an error trace or the legacy ValidationMessages in a later integration wave.

- Behaviour rule (inferred, ched-p-manipulation.spec.ts:47-49): selecting the purpose is CLEARED when the country of origin is amended upstream, forcing the user to re-answer this page. Confirm whether the IUU rebuild should reset purpose on an upstream change, or preserve it.

- The Transhipment ('Destination country', third-country-transhipment) branch renders in the DOM but is never driven by any CHED-P workflow or test — its options are trace-confirmed but the branch is un-exercised. Likewise 'Human consumption' and 'Other' under Internal market are rendered but never selected. Confirm these branches are still required for IUU.

- An accessible-autocomplete variant of the exit-BCP control exists (combobox 'BCP or Port of exit' / textbox 'Point of exit' with role=option suggestions — AboutTheConsignmentPage.ts:54-92) alongside the plain govuk-select seen in the trace. Confirm which control the IUU rebuild should use (recommend a plain govuk-select, or the GOV.UK accessible-autocomplete if type-ahead is needed).

- INFERRED requirement from ched-p-holyhead.spec.ts:11-26 — HOLYHEAD (GBHLY) must be present in the Transit exit-BCP list; the observed 34-option snapshot was truncated. Confirm the full exit-BCP set against the reference-data service.

- The page runs an axe accessibility scan in the CHED-P a11y suite (ched-p-accessibility-tests.spec.ts:54-56, titled 'About The Consignment Page') — the rebuilt page must pass WCAG 2.1 AA; the bespoke date-picker overlay and link-button 'Add another' are the main a11y risks to retire.

- The 'Transited country' select is repeatable via a bespoke 'Add another country' link-button (add-another pattern). Confirm max cardinality and whether the new app models transited countries as a list.

- The date input uses a custom '--picker' JS overlay (date-picker-* classes) on top of govuk-date-input; recommend the new app drop the picker overlay (known click-interception issue) and use the plain three-field GOV.UK Date input.

- url is inferred — not directly observed; the snapshot page is a frozen /snapshot/ URL. Confirm the real route path.

### 8. select-risk-category

- Exact required-field validation copy (error summary title + inline message) was never rendered in this trace — needs an error-state trace or template corroboration. No test in the QA repo asserts a validation message for this page (grep of tests/notification/ched-p/*.spec.ts found none), so this remains a genuine gap, not merely un-traced.

- INFERRED BEHAVIOUR — low-risk is a routing branch: selecting 'Low risk' skips downstream pages the medium/high paths visit. The workflow gates two later pages on the value: ched-p-workflows.ts:318-321 skips the 'Health Certificate Required' page ('skipped on low-risk path, which routes straight to the Notification Hub') and ched-p-workflows.ts:339-340 skips the 'Latest Health Certificate' page on low-risk. This page's answer therefore drives journey routing, not just a stored attribute. The rebuild must decide how risk level gates the health-certificate sub-journey. (No trace in our corpus exercised the low-risk branch, so this is inferred from test code, not observed.)

- INFERRED — the selected risk category is persisted and echoed verbatim on the Review notification page: expect(pages.reviewNotification.riskCategoryValue).toHaveText('High risk') (ched-p-notification.spec.ts:48, :99) and toHaveText('Low risk') (ched-p-manipulation.spec.ts:68, :81). The stored value round-trips as the same human label shown here. The review summary-list ROW LABEL differs from this page's question, however: ReviewNotificationPage.ts:69-70 reads the value from a summary row keyed 'Import risk category' (getSummaryValue('Import risk category')) — so the rebuild's review/CYA page should label this answer 'Import risk category', not the full question text.

- INFERRED — ACCESSIBILITY: this page is asserted to pass an axe accessibility scan with no violations. ched-p-accessibility-tests.spec.ts:60-61 selects the medium-risk radio then calls checkPageAccessibility(pages.page, 'Select Risk Category Page'). The rebuild must keep this page axe-clean (correct fieldset/legend association even though the visible legend is empty and the question is carried by the H1 — confirm the radios are programmatically associated with the H1 via aria-describedby or an aria-labelledby'd fieldset).

- INFERRED — the risk category is one of the inputs that drives the post-submission risk-assessment / auto-clearance outcome: ched-p-auto-clearance.spec.ts:24 (mediumRisk) and :58 (lowRisk) both drive this page and then assert the notification is 'autocleared' (inspectorPages.decisionDashboard.getNotificationRiskOutcome() matches /autocleared/i at :46, :80). So this answer feeds downstream inspector-side risk logic, not only the health-certificate routing.

- INFERRED — the risk category is amendable after initial submission: ched-p-manipulation.spec.ts:52-53 re-selects 'Low risk' on this page during an amend flow and the change is asserted on review (:68). The rebuild's IUU journey should confirm whether risk level is editable post-creation.

- The QA config carries two different DEFAULT_CONFIG risk defaults for different CHED-P sub-flows — mediumRisk (ched-p-workflows.ts:129) vs highRisk (ched-p-workflows.ts:656) — but these are test-data defaults, not a page default; the radio itself renders with no pre-selection beyond what the user/hidden-computed value implies. Confirm the intended initial state (blank vs pre-selected to the computed highest) in the rebuild.

- The caption reads 'DRAFT.GB.2026.1525979 - CHEDP' — IUU fish is filed under the CHED-P (CHEDP) type in IPAFFS, confirming this risk-category page belongs to the IUU/CHED-P journey.

- There is a hidden 'highest-risk-category' field pre-computed from the commodities (value 'High' here) alongside the user-selectable 'risk-category' radio (user chose 'Medium'). Confirm in the rebuild whether the new app should pre-select/suggest the computed highest risk vs leave the radio blank, and how the user overriding it downward (High computed -> Medium selected) is intended to behave.

- Page uses only govuk-frontend components for the interactive controls — the risk-category question is 100% inside the Design System toolbox (Radios + Fieldset macros). The reference caption is IPAFFS's own 'heading-tertiary' banner rather than a govuk-caption component (see structure note).

- Beyond 'risk-category' and the pre-computed 'highest-risk-category', the form also carries plumbing hidden inputs confirmed in the DOM (trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 27): 'etag' = '0000000000BD28AC' (optimistic-concurrency / record-version token — the rebuild must decide its concurrency-control strategy), plus framework fields 'crumb' (hapi CSRF), 'returnUrl' and 'fromFooterHeader'. These are not user requirements but the rebuild needs equivalent CSRF and, for etag, concurrency handling.

### 9. health-certificate-required

- CORROBORATED — no input fields on this page. The page object exposes a single control (linkContinue) and no form inputs, matching the trace: this is a purely informational interstitial with nothing to fill in and therefore no client- or server-side validation. Empty fields[] and validationMessages[] are correct, not gaps. Evidence (inferred): ~/git/defra/ipaffs/ipaffs-qa-automation/page-objects/notification/HealthCertificateRequiredPage.ts:3-9

- CORROBORATED — this interstitial is CONDITIONAL: shown only when the consignment's risk category is NOT low risk (i.e. 'High risk' or 'Medium risk'), and skipped entirely on the low-risk path, which routes straight from Select Risk Category to the Notification Hub. Firmed up from the body copy's 'high or medium risk commodities' to an explicit routing rule in test code (inferred, not trace-observed — no low-risk branch was exercised in our corpus): the workflow gates the click on riskCategory !== lowRisk — ~/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:318-321 (comment: 'skipped on low-risk path, which routes straight to the Notification Hub') and again at :701-704. Risk-category label enum { 'High risk', 'Medium risk', 'Low risk' } — ~/git/defra/ipaffs/ipaffs-qa-automation/types/risk-category.ts:1-5. Note the same gate also controls whether the later 'Latest Health Certificate' upload page appears (ched-p-workflows.ts:339-340 / :720-721) — this interstitial and that upload page are two halves of the same health-certificate sub-journey. The rebuild's IUU journey must decide how (or whether) risk level gates a health-certificate interstitial + upload.

- CORROBORATED (journey position) — the page sits immediately after 'Select Risk Category Page' and before the 'Notification Hub Page'. The accessibility spec exercises the medium-risk path and names it verbatim as 'Health Certificate Required Page' in journey order — ~/git/defra/ipaffs/ipaffs-qa-automation/tests/accessibility/ched-p-accessibility-tests.spec.ts:59-70 (linkContinue.click at :66). No page-specific behavioural assertions (no expect on any message or status) were found for this interstitial across the ched-p test suite; the only interaction asserted anywhere is clicking Continue to proceed. Second-pass verification (2026-07-21): re-grepped the whole ched-p test dir + accessibility spec for health-certificate references — the only hits are the accessibility a11y check + the Continue click; no assertion on the body copy or heading exists, so the 'confirmed' body copy rests solely on the rendered trace (rendered reality), which is the correct basis. The page object still exposes exactly one control (linkContinue) and no form inputs, so there are no trace-missed fields or hidden variant-only controls to add — the lower bound and the page object agree.

- The section caption 'DRAFT.GB.2026.1525979 - CHEDP' is rendered as a banner element ABOVE the <main> region, not as a govuk-caption-xl inside main. It shows the draft CHED reference and type. For the IUU rebuild this is the notification-reference caption; confirm whether it should be a standard govuk-caption-xl inside the page heading block.

- This is a CHED-P (fish) trace — IPAFFS files IUU/fishery products as CHED-P, so this interstitial is the closest observed evidence for the IUU journey. The copy references 'high or medium risk commodities' and a health certificate; confirm whether the standalone IUU journey (catch certificate + IUU declaration) needs an equivalent interstitial and, if so, whether the copy differs.

- The 'Back' link (href='#') sits in the page chrome above main and is non-functional (anchor to '#'); confirm expected back-navigation target for the rebuild.

- Discrepancy to note (not blocking): the trace's Continue link navigates to .../overview, while the workflow's next step after Continue drives the Notification Hub (pages.notificationHub — ched-p-workflows.ts:325-326). These are consistent — 'overview' IS the notification hub / task-list URL — but confirm the rebuild's canonical name/URL for that destination.

### 10. notification-hub

- This trace is the CHED-P Fish (IUU) journey — spec title 'B2C Importer (Not Agent): Submits Valid CHEDP Fish Notification'. The hub is a CHED-P notification hub; IUU is filed as CHED-P. The task groups shown include CHED-P-specific tasks (Latest health certificate, Approved establishment of origin) that the new standalone IUU app may not need. Which of these 17 tasks are in-scope for the rebuilt IUU journey is a scoping decision for a human — traces confirm they render, not that IUU requires them.

- The page has NO primary continue button — it is a hub; navigation is via the 17 task links. The primary user actions are the task links and the final 'Review and submit' link.

- Status tag vocabulary observed here is only 'Started' (govuk-tag--blue) and 'To do' (govuk-tag--grey). A 'Completed' status (and possibly 'Cannot start yet' for gated tasks) is expected but was NOT rendered in this snapshot because all downstream sections were still to-do/in-progress. Marked as a gap — corroborate against a later-in-journey hub snapshot where sections are complete.

- No hint text (govuk-task-list__hint) rendered on any task — the class was absent from the inventory. IPAFFS uses bare task names with no sub-hints on the hub.

- The 'phase-tag' class is the only non-govuk-* class on the page: a cosmetic override on the standard Tag. Confirm the new app can drop it and use vanilla govuk-task-list statuses.

- The 'Catch certificates' task (href .../catch-certificates) is the IUU/fish-specific document task and is the most load-bearing IUU element on this hub — it maps to the catch certificate + IUU declaration the new standalone journey centres on.

- 'source=hub' query param appended to the first two task links (consignment/page-2, page-5) but not the others — indicates IPAFFS routes 'return to hub' behaviour differently per section. Likely because those two are the only 'Started' sections. Note for the routing/spine model.

- A secondary navigation banner sits ABOVE the caption/H1 and OUTSIDE <main>, with three links: 'Back' (href='#', JS history back), 'Dashboard' (href=/notification/vnet/protected/notifications — the notifications list), and 'Attachments' (href=.../documents/page-1 — SAME target as the 'Accompanying documents' task link). Confirmed: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 30. An earlier draft dropped 'Dashboard'; both Dashboard and Attachments are now in secondaryActions. This whole banner is IPAFFS chrome, not part of the task-list content model — the new IUU app need not reproduce it verbatim.

- Page-object corroboration is PARTIAL: NotificationHubPage.ts exposes only 5 named links (Additional details, Commodity, Commodity non-bulk #commodity-details-link, Goods movement services, Transport to the port of entry). It reveals NO hub control the traces missed — the tests navigate the hub purely by clicking task links, so the page object neither adds a field nor asserts a status. The other 12 tasks are trace-confirmed but page-object-silent; this is a lower-bound corroboration, not a contradiction.

- No test anywhere asserts the hub status vocabulary — there is no status getter on NotificationHubPage.ts and no expect() on 'Started'/'To do'/'Completed'/'Cannot start yet' in the ched-p tests. So the missing 'Completed' status remains a genuine GAP with neither trace nor test evidence; a later-in-journey hub snapshot (or a new test asserting statuses) is the only way to firm it up. Honest gap — a question for a human.

- The hub is confirmed to be a journey SPINE / return point, not a one-shot page: ched-p-workflows.ts:99-100 defines a stopAtNotificationHub config flag and ched-p-workflows.ts:323 returns control at the hub, and the fish/POE flows re-enter it between task groups. The new IUU app must model 'save progress and return to the hub' as first-class navigation.

- IUU scope corroboration from the fish workflow (createChedPFishNotificationUpToReview, ched-p-workflows.ts:840-1009): the IUU/fish happy path exercises Commodity, Catch certificates, Latest health certificate, Accompanying documents, Addresses (consignor+consignee), Transport to/after BCP, Transporter and Contact address (organisation-branch-address). It does NOT exercise Goods movement services, Nominated contacts (optional) or Approved establishment of origin. Notably the fish flow fills Latest health certificate on the medium-risk path (ched-p-workflows.ts:930-932) — so 'health certificate' is NOT automatically out-of-scope for IUU. Which of the 17 hub tasks the rebuilt standalone IUU journey requires remains a scoping decision for a human; traces + workflow confirm they render/are-driven under CHED-P Fish, not that a minimal IUU app needs all of them.

### 11. commodity-extended-description

- Validation copy is a GAP: the evidence trace is a happy-path (0 errors) and no test asserts any error string for this page. Need an error-bearing trace to capture verbatim error messages for net weight, number of packages, package type and total gross weight (required? numeric? must-be-positive? kg vs units?).

- The page (H1 'Commodity', title 'Commodity details', URL .../commodity/details) is a COMBINED page that also carries the commodities table + Add commodity + Add species. The 'commodity-extended-description' slug (net weight/packages/package type/gross weight) is one section of this larger page — confirm the new IUU app should split commodity selection from the weights/packages capture, or keep them on one page.

- 'required' is reported false on every input in the DOM (no client-side required attribute); required-ness is enforced server-side. The IUU fish workflow (ched-p-workflows.ts:889-893) fills ALL FOUR fields on every run with no optional branch, and the ChedPNotificationConfig marks netWeight/numberOfPackages/packageType/totalGrossWeight as always-populated defaults — strongly implying all four are mandatory for IUU submission. Confirm with the business.

- Net weight and Number of packages are per-SPECIES per-COMMODITY (repeating grid); Total gross weight is per-consignment. Confirm the new app's data model captures weights/packages at the species-line level and gross weight at consignment level.

- The label reads 'Net weight (kg/units)' — units are ambiguous (kg OR units depending on commodity). CHED-PP uses 'Net weight (kg)' (page-object :47) and a separate Quantity + quantity-type pair (:59-65); CHED-A uses 'Number of animals' (:14). Confirm whether IUU fishery products are captured in kg, units, or both, and whether the unit is derived from the commodity code.

- The package-type list rendered 26 values for this commodity, but the QA domain catalogue types/package-type.ts holds 33 (7 extra: Bottle/flask glass packages, Bulk solid granular particles, Container [short], Wood bundle, Wood crate, Wooden barrel, Wooden case with pallet base). Confirm the visible subset is commodity/CHED-type driven reference data and that the IUU app sources the package-type list from the reference-data service rather than hardcoding either the 26 or the 33.

- The shared page object exposes a 'Select all' checkbox (page-object :30) + an 'Apply' button (:38) — a bulk-apply widget (set one package-type/weight across all selected species rows) that NO IUU trace in our corpus rendered (single-species journeys only). Confirm whether IUU needs bulk-apply for multi-species catches, or whether per-row entry suffices.

- The single page object drives all four CHED types (CHED-A number-of-animals, CHED-P/IUU net-weight, CHED-PP net-weight-kg + quantity + quantity-type + controlled-atmosphere + intended-use + test-and-trial, CHED-D desktop/mobile dual-form). The standalone IUU app should model ONLY the fish/IUU fields (net weight kg/units, number of packages, package type, total gross weight) and must not inherit the plant/animal/feed variant controls.

### 12. commodity-additional-details

- Exact URL and route: the page renders under the consignment 'Consignment Details' flow. The returnUrl hidden field shows the surrounding route is /protected/notifications/{chedReference}/consignment/details?commodityDetailsPage={n}. The storage-temperature step's own path was not directly observed via a Navigate action — confirm the exact URL and whether commodityDetailsPage indexes per-commodity.

- Validation copy: no error-state trace was captured and no test asserts a temperature error, so the 'select a temperature' error summary/message text is a gap.

- The client-side required attribute is false on all three radios; server-side mandatory enforcement is assumed but not observed, and no test asserts it — confirm the temperature radio is genuinely mandatory for IUU/fish.

- Options are a fixed 3-value list (Ambient/Chilled/Frozen), corroborated complete + static by types/temperature.ts and the page object. Tests only ever select Ambient — confirm Chilled/Frozen are both offered and valid for IUU/fish, and whether the choice is ever pre-selected/defaulted.

- Variant controls exposed by the page object are OUT of the IUU journey and should NOT be built: (a) 'Feedingstuff' radio group is CHED-D-only (ched-d-workflows.ts:235-236); (b) 'Total gross weight' textbox on this page object is never filled here for CHED-P — gross weight is on the Extended Description page. Confirm the IUU 'Additional details' page carries the Temperature radio and nothing else.

- The page object also exposes a 'Save and review' primary-submit variant (amend/review return). Confirm whether the IUU journey needs a review-return path and, if so, that the primary button relabels to 'Save and review' in that context.

- There are TWO storage-temperature controls in the CHED-P journey: (a) the Temperature RADIO group on this 'Commodity Additional Details' page, and (b) a separate storage-temperature DROPDOWN on the 'Lab Tests Commodity Sample' page (ched-p-workflows.ts:1051,:1112 select temperature.ambient). Both share the same Ambient/Chilled/Frozen vocabulary (types/temperature.ts). The lab-tests page is likely an inspection/sampling-outcome control rather than importer pre-notification — confirm whether the IUU rebuild needs both, one, or neither, and whether they should be reconciled to a single temperature field.

- Journey order corroborated by the CHED-P a11y test (ched-p-accessibility-tests.spec.ts:70-83): Commodity Extended Description → Commodity Additional Details → Latest Health Certificate. Gross weight, net weight, number of packages and package type are all gathered on the preceding Extended Description page, leaving Additional Details carrying only the Temperature radio for CHED-P/IUU. Confirm this split is intended for the new IUU service (or whether temperature should fold into the preceding page).

### 13. catch-certificate-needed

- The radio inputs carry no `required` attribute in the DOM (HTML5), but selecting one is functionally mandatory to progress. What is the verbatim validation error when neither radio is chosen and "Save and continue" is clicked? No error-state trace was mined and no QA test asserts it — mark gap.

- The url slug in the rendered page is .../catch-certificates (confirmed via the returnUrl hidden field /protected/notifications/DRAFT.GB.2026.1525979/catch-certificates and the cancel link /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/overview), not the field id catch-certificate-needed. Note the internal page div id is catch-certificate-exemption-page. The page-position url pattern in the brief should read /notification/vnet/protected/notifications/{chedReference}/catch-certificates.

- The question H1 sits outside the form and the fieldset legend is empty (confirmed, action 38). In the rebuild, decide whether to move the question into the legend (legend-as-H1) so the radio group is properly labelled.

- Two submit buttons are present ("Save and return to hub" id=save-and-return-button and "Save and continue" id=button-save-and-continue). No QA test exercises "Save and return to hub" or the "Cancel and return to hub" link (the workflow only clicks "Save and continue", ched-p-workflows.ts:900). Confirm both submit buttons perform a save and differ only in the post-save destination (hub vs next page); the new app should decide whether to keep the dual-button pattern.

- The "No – all the wild fish in this consignment are exempt from IUU fishing controls" branch (radio value=false, id catch-certificate-needed-2) is never selected by any QA workflow — every driven journey picks Yes (ched-p-workflows.ts:899) and proceeds into the attach-catch-certificate upload flow (attachCatchCertificate → manageCatchCertificates → addCatchCertificateDetails). The downstream route for No (presumably skipping the upload flow entirely) is uncovered by both traces and tests — confirm the conditional route for No.

- Post-Yes flow evidence (inferred, ched-p-workflows.ts:898-928, plus subsequent trace actions 43/47/51 on the same trace: reference field #catch-certificate-reference-1, a 'Flag state of catching vessel(s)' combobox typed 'France', and a 'Do you need to upload more catch certificates?' Yes/No group): selecting Yes leads to an Attach catch certificate page, then a Manage catch certificates page, then an Add catch certificate details page (reference, flag state, etc.). These are separate pages/steps in the IUU document-gathering flow and are NOT part of this page — flagged here only to bound where the Yes branch goes.

### 14. attach-catch-certificate

- RESOLVED (was: 'POST URL not observed'). Both GET and POST endpoints ARE directly observed in the trace network log: GET request 3942 (200) and POST request 3953 (302) both target https://importnotification-static-snd.azure.defra.cloud/upload/vnet/protected/upload/DRAFT.GB.2026.1525979/notification/upload-catch-certificates. The POST is Content-Type multipart/form-data (Content-Length 13088 ≈ the example.png payload), i.e. the file is submitted synchronously with the form on Continue. The prior 'inferred /notification/vnet/protected/notifications/...' path was WRONG — the real prefix is /upload/vnet/protected/upload/...

- The file-upload input has no HTML required attribute (required=false). Whether a catch certificate is mandatory to proceed is enforced server-side (if at all) and was not exercised — the trace uploaded files without hitting any 'must upload' validation. The Details block ('If you do not have catch certificates now') and the copy 'If you do not have catch certificates now' imply proceeding without documents is permitted. Confirm the mandatory/optional rule and any warning path.

- No validation/error copy was captured — this is a mostly-passing corpus with 0 errors on this trace. Error messages for: no file selected, file too large (>10MB), disallowed file type (non DOC/PDF/XLS/JPEG/PNG), too many files (>10 at once / >100 total), and virus-scan failure are all GAPS. Mine an error-bearing trace or the page object/template to recover them.

- PARTIALLY RESOLVED: the file IS submitted synchronously on Continue — POST request 3953 to upload-catch-certificates is multipart/form-data carrying the file (Content-Length 13088). So the primary upload is a normal form POST, not a pre-Continue AJAX upload. The dropzone JS still renders the client-side uploaded-files-list and provides drag-and-drop as a progressive enhancement, but the actual persist happens on Continue. The per-file remove control and any virus-scan status lifecycle were still not observed (gap).

- 'up to 10 documents at a time, and up to 100 documents in total' — the 10-per-batch and 100-total limits are stated in copy but their enforcement (client vs server) and error messaging were not observed.

- The multi-file-upload__dropzone / uploaded-files-list widget is bespoke IPAFFS JS. Recommend the new app decide up-front between plain govuk-file-upload (multiple), the MOJ Multi file upload component, or an add-another repeated-upload pattern — this is a deliberate rebuild decision, not a copy.

- Although the #fileUpload input is multiple and the copy advertises 'up to 10 documents at a time', every observed and tested path uploads a SINGLE file per attach-page visit and adds further certificates by re-entering the page via the manage-page loop. Confirm whether the real requirement is genuine multi-file single-selection (10-at-a-time batch) or the one-file-per-visit loop the tests exercise — the two imply different UI and validation.

### 15. manage-catch-certificates

- Is the 'Do you need to upload more catch certificates?' radio group server-side required? No HTML required attribute was set and no validation error was captured (this is a clean happy-path trace), and NO test asserts any validation message for this page — so the 'Select an option'-style message remains a genuine gap, not merely un-traced. Needs an error-state trace or the frontend template to confirm.

- Our trace captured only the single-certificate state ('Attachment 1 of 1'). The QA workflow's DEFAULT_FISH_CONFIG uploads catchCertificateCount: 2 (ched-p-workflows.ts:825), and the manage page loops (radioMoreCatchCertificateNeeded → re-attach) to accrue N attachment cards. So the page must render a repeating list of N cards ('Attachment 1 of N' … 'Attachment N of N'), not just one. The new app must support the multi-certificate list, not assume a single upload.

- The per-certificate action link has TWO states on the same slot: 'Add details' (details not yet captured — inferred from ManageCatchCertificatesPage.ts:6-8, driven at ched-p-workflows.ts:914) and 'View or amend details' (details present — confirmed in the trace). The rebuild should model this as one 'complete/edit' affordance whose label reflects completion state.

- The page fuses a certificate LIST (with per-item Add/View details + Remove) and a Yes/No question onto one URL, producing two H1s. The rebuild should decide whether these are one page or two.

- Attachment card fields observed (filename, Reference, Flag state, '1 species added') are dynamic per-certificate content — flag state and species come from the earlier 'add catch certificate details' page. The '1 species added' count and 'Flag state' summary are derived, not entered here. Confirmed source controls on that details page: reference = #catch-certificate-reference-1, date of issue = #date-of-issue-{day,month,year}-1, flag state = combobox 'Flag state of catching vessel(s)' (autocomplete, value 'France'), species = 'select all species' checkbox #select-all-checkbox-1 (page-objects/notification/AddCatchCertificateDetailsPage.ts:7-30) — so '1 species added' is the count of species selected there. The downstream Review page asserts each certificate row shows its reference, flag state ('France') and attachment filename (ched-p-notification.spec.ts:210-217), corroborating these three as the load-bearing per-certificate data.

- Attachment-card FILENAME is not a fixed string. The trace captured a single card reading 'example.png', but the QA workflow re-uploads the SAME source file (resources/file-upload/example.png) for every certificate, and the tests assert the review-page filenames match /example(\(\d+\))?\.png/ — i.e. the app de-duplicates repeated uploads as example.png, example(1).png, example(2).png, … (ched-p-notification.spec.ts:215-216, comment: 'Re-uploading the same file produces example.png, example(1).png, example(2).png, etc.'). The rebuild must handle duplicate-filename disambiguation across multiple uploads. confidence: inferred (test assertion, not observed in our single-cert trace).

- COVERAGE GAP: this page is NOT listed in tests/accessibility/ched-p-accessibility-tests.spec.ts (grep for 'manage catch' / 'catch certif' returns nothing there) — so no axe/a11y assertion covers it, despite the trace showing it emits TWO h1 elements and uses a heading ('Reference:') as an inline label. The a11y anti-patterns flagged in nonStandardPatterns are therefore un-caught by the QA suite.

- URL confirmed as /notification/vnet/protected/notifications/{chedReference}/manage-catch-certificates (the evidence-brief inferred '/catch-certificate/manage', which is wrong).

- The notification-reference banner 'DRAFT.GB.2026.1525979 - CHEDP' shows this IUU journey is filed under a CHED-P (CHEDP) draft reference in IPAFFS — consistent with the brief that fish IUU is filed as CHED-P.

- The page object drives only 'Save and continue' (btnSaveAndContinue); the trace-confirmed secondary actions 'Save and return to hub', 'Cancel and return to hub' and 'Remove' are never exercised by the tests, so their behaviour/validation is untested by QA (trace-confirmed for existence only).

### 16. add-catch-certificate-details

- Two distinct 'multiple certificate' axes exist and only one is test-exercised. (a) Multiple ATTACHMENTS, each with its own details screen: exercised — DEFAULT_FISH_CONFIG.catchCertificateCount defaults to 2 and the workflow loops, uploading a separate file + filling a separate details page per cert (ched-p-workflows.ts:825,902-924). (b) Multiple certificates WITHIN one attachment, rendered as N accordion sections driven by the number-of-catch-certificates editor: NOT exercised by any test and NOT exposed by the page object — only structurally observed in the trace at count=1 ('Catch certificate 1 of 1'). The per-attachment multi-section render is therefore inferred structural behaviour, not confirmed happy-path.

- No validation/error states were captured and no CHED-P test asserts any error on THIS page (grep of the ched-p spec suite for catch/flag/date validation returned nothing; ched-p-date-validations.spec.ts does not cover date-of-issue). All error copy — missing catch certificate reference, invalid/future issue date, no flag state selected, no species selected — remains a gap. Mine one of the 38 error traces for this page's validation messages before pinning the required:true inferences.

- required:true on catch-certificate-reference, date-of-issue, flag-state and species is INFERRED from 'the workflow always populates them and the Review page asserts reference+flag-state+attachment persist' (ched-p-notification.spec.ts:211-217) — NOT from an observed validation firing. Confirm each field's true mandatory status with a human / an error trace.

- The page is one screen per uploaded attachment/document ('Attachment 1', filename shown). The exact URL was reconstructed from the cookie returnUrl: '/protected/notifications/DRAFT.GB.2026.1525979/add-catch-certificate-details/attachment/51fefd89-e6dc-405d-8766-30c87166d000' — the leading '/notification/vnet' prefix is inferred from sibling links.

- Species checkbox rows come from the consignment's already-added commodities; the id pattern is 'species-{commodityId}-{certIndex}'. The workflow selects species only via the 'Select all' master checkbox (ched-p-workflows.ts:922) — individual species checkboxes are never driven, so per-species selection behaviour and any >=1 mandatory rule are unverified.

- The number-of-catch-certificates field is a free-text numeric box (maxlength 2) rather than a govuk Select or radios, is not exposed by the page object and is never driven by a test — confirm the allowed range and whether the new app should cap/validate it, or whether the per-attachment-multi-cert concept survives into the new IUU journey at all.

### 17. latest-health-certificate

- The real URL slug is 'latest-certificate' (form action='latest-certificate'; returnUrls end .../DRAFT.GB.2026.1525979/latest-certificate), NOT 'latest-health-certificate' as the page slug/url-pattern in the task suggested. The page is titled/headed 'Latest Health Certificate' but the route is /latest-certificate.

- This page is the FIXED health-certificate variant of the shared additional-documents table: Document type is hard-coded to 'Veterinary health certificate' (static text, no select). The generic supporting-documents page immediately after (action 74) DOES render a 'Document type' <select> — so the two share markup (additional-documents-table) but differ in whether Document type is editable.

- No field is marked required in HTML; validation is server-side and no error state was captured in this passing trace. Whether Document reference / issue date / attachment are mandatory, and the exact error copy, are GAPS needing an error-state trace or the page object / template to confirm.

- The task placed this at journey position 16 and noted the trace mislabels it 'Supporting documents (1st)'. Confirmed: it sits AFTER the catch-certificate loop (actions 42-65) and BEFORE the generic supporting-documents page (action 74). It is its own dedicated 'Latest Health Certificate' page.

- The Date of issue uses a bespoke defra-datepicker (calendar dialog) over the govuk-date-input; the new app should confirm whether a calendar widget is required or the plain GOV.UK Date input suffices.

- Only one row is present (single health certificate). Whether multiple attachments per health certificate are supported was not exercised — after 'Add attachment' the flow returns to a row showing the attachment; not captured here.

- PAGE-LEVEL CONDITIONALITY (inferred, high-value): the whole Latest Health Certificate page is gated on risk category. It is rendered only when riskCategory !== 'Low risk' (default journeys use 'Medium risk'); on the low-risk path the page is skipped entirely and the journey routes straight to Accompanying Documents. Confirmed by the QA workflow guards ched-p-workflows.ts:339-354, 720-732 and the comment at :930 ('required after catch certificates on medium risk'). The new IUU app must decide whether this page appears unconditionally or is risk-gated. Trace corpus only exercised the medium/high-risk (page-present) path.

- The attachment upload is a two-step flow: 'Add attachment' submits to a separate Document Upload sub-page (govuk file input + Continue/Next). Accepted types per the valid-upload test are jpg, png, doc, docx, xls, pdf; the error copy 'The selected file must be a DOC, JPEG, PDF, PNG or XLS' names DOC/JPEG/PDF/PNG/XLS (note DOCX and XLS/XLSX phrasing differs between the accepted-list and the error string — worth confirming exact allowed extensions with a human). Max size is 10MB and empty files are rejected. These validations live on the Document Upload sub-page, not on this page.

- Required rule for Document reference and issue date is a GAP: no error-state trace and no QA test drives an empty field to assert an error on this page. Every workflow fills both (values REF-123 and 04/03/2023 from DEFAULT_CONFIG), which suggests they are expected/mandatory, but the actual server-side rule and its error copy are unconfirmed and need a human or an error-state trace.

- After a successful upload the Attachments column renders a 'View <filename>' link (LatestHealthCertificatePage.ts:23-25, asserted in document-upload-valid-health-certificate.spec.ts). No corpus trace captured this returned state — it is inferred from the page object and test only.

### 18. document-upload

- The file input carries no HTML required attribute; the 'select a file' / oversize / wrong-type validation messages are enforced server-side. The wrong-type ('The selected file must be a DOC, JPEG, PDF, PNG or XLS'), empty ('The selected file is empty') and oversize ('The selected file must be smaller than 10MB') copies are now captured (inferred from QA assertions), but the no-file-selected message remains a GAP — no test or trace exercises it. Confirm the verbatim empty-submit copy against an error trace or a human.

- Accepted-types discrepancy: the rendered copy names 'DOC, JPEG, PDF, PNG or XLS', but the valid-upload tests prove DOCX and JPG are also accepted (jpg,png,doc,docx,xls,pdf all pass). Decide, for the new IUU app, the canonical accepted set and make the on-screen copy match exactly (GOV.UK guidance: list every accepted extension).

- Button label is inconsistent in IPAFFS ('Continue' for CHED-P, 'Next' for CHED-A/D/PP — see notes). The new app should standardise on 'Continue'. Confirm no downstream behaviour depends on the label.

- Exact server route/URL for this upload sub-page is inferred; the DOM only exposes the div id 'add-attachment-page' and a Cancel link to .../latest-certificate. Confirm the canonical path (e.g. .../document-upload vs .../add-attachment) against the frontend route table.

- IPAFFS drives the catch-certificate attachment through a distinct page object (AttachCatchCertificatePage, '#fileUpload' + 'Continue') that is structurally identical to this document-upload sub-page. Confirm whether these are one physical page or two, and whether the IUU app needs a single reusable upload sub-page for catch certificate + IUU declaration + any accompanying document.

- The accepted-types list rendered here is 'DOC, JPEG, PDF, PNG or XLS'; confirm whether IUU (catch certificate / IUU declaration) attachments should accept the same set or a narrower list in the new app.

- Success feedback is inconsistent (a 'View <filename>' link vs a 'document uploaded' success banner). Decide one confirmation pattern for the new app (GOV.UK notification banner is the toolbox option).

### 19. accompanying-documents

- RESOLVED (was wrongly reported as empty): the govuk-details 'Check which documents you should upload' body IS fully captured in this snapshot — it is merely collapsed, so it does not appear in main innerText but is present in the DOM. Its verbatim content is transcribed in disclosureContent and includes the IUU-specific <h3> 'Illegal, unreported and unregulated (IUU) documents', 'Most wild caught fishery products will need IUU documents.', a catch-certificates-section link, and an 'importing or moving fish to the UK' guidance link. NOTE the generic animals/livestock/rodents bullet list in the disclosure is shared boilerplate, not IUU copy.

- Row-level document type / reference / issue date are optional — the CHED-P accessibility journey saves the page empty (ched-p-accessibility-tests.spec.ts:97-98). But partial-row validation (reference without type, or an incomplete Day/Month/Year) is UNTESTED and unobserved — a gap. No inline error copy for these controls was captured; needs an error-bearing trace.

- The page repeats document rows via a bespoke grid + 'Add a document' / 'Add multiple documents' custom flow. NEITHER the multi-row add nor 'Add multiple documents' is exercised by any test — the page object exposes only btnAddAttachment and btnSaveAndContinue, no 'Add a document'/'Add multiple documents' locators. So that repetition behaviour (row count limits, CSV/bulk semantics of 'Add multiple documents') is a gap corroborated by neither traces nor tests.

- Document type option list DISCREPANCY: the trace rendered 14 options (a CHED-P-specific subset), but the QA domain vocabulary types/document-type.ts holds 27 document-type values (e.g. healthCertificate, cargoManifest, phytosanitaryCertificate, heatTreatmentCertificate, packingList, roadConsignmentNote, originCertificate) that were NOT in the rendered set. The rendered list is filtered per CHED type / context. The IUU rebuild must confirm which document types apply to catch-certificate / IUU declaration imports — do not assume either the 14-option trace set or the full 27-value domain set is the IUU list.

- The 'Add attachment' file-upload is a SEPARATE DocumentUpload page (input[type=file] + 'Next'/'Continue'), not an inline control — confirmed via the page object + workflow. Accepted types (DOC/JPEG/PDF/PNG/XLS), non-empty and <10MB constraints are asserted in tests (inferred). The exact wording of the file-picker page, its hint text, and whether multiple files per row are allowed were not captured — a gap.

- The page object exposes a 'Success' banner region (locatorSuccessBanner, getByRole('region', { name: 'Success' })) and an inspector-only documents table (#inspector-documents-table with 'View <filename>' links). Neither was exercised in our IUU trace — the success-banner copy and the inspector view are inferred-only (AccompanyingDocumentsPage.ts:27-37) and worth confirming for the rebuild's confirmation UX.

- This trace is labelled a CHED-P fish notification; IPAFFS files IUU as CHED-P, so this page is the IUU accompanying-documents page. The IUU rebuild should confirm which document types apply to catch-certificate / IUU declaration imports specifically (note that catch-certificate attachment is handled on a DISTINCT set of pages — AttachCatchCertificate / AddCatchCertificateDetails / ManageCatchCertificates — not on this accompanying-documents page; ched-p-workflows.ts:899-928).

### 20. approved-establishment-of-origin

- This is a LANDING/list page with no data-entry fields of its own — the only interactive control the page object drives is the 'Search for an approved establishment' button (ApprovedEstablishmentOfOriginPage.ts:6-8). Selection happens on the downstream veterinary-establishments search page (out of scope here; captured in relatedFields for journey context).

- URL is inferred: the observed page rendered under the Documents flow (pageTitle 'Documents...'), and the search button navigated to .../veterinary-establishments?establishment-country-code=AF. The exact GET route for THIS landing page was not directly observed as a Navigate action. The strongest evidence is the form's POST target action="establishment-of-origin" (relative) plus the container div id="establishment-of-origin", so the path segment is most likely 'establishment-of-origin' rather than the task-supplied guess 'approved-establishment' (which appears nowhere in the DOM). Corrected the url field accordingly.

- Hidden form controls present but not user-facing fields: crumb (CSRF token) and etag (optimistic-concurrency ETag, value '0000000000BD2903') are hidden inputs inside the establishment-of-origin form (trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 80). A rebuild must handle CSRF and the etag concurrency check; they are intentionally excluded from fields[] (not data-entry) but recorded here.

- The evidence pointer was correct: action 80 is on the page whose H1 is 'Approved establishment of origin (where required)'.

- '(where required)' in the H1 and the empty-state text imply this section is conditional/optional per commodity. No CHED-P test exercises the skip/empty path — every test (workflow ched-p-workflows.ts:366, accessibility spec:108-109) adds at least one establishment. The condition under which the section becomes MANDATORY, and whether 'Save and continue' with an empty table is permitted (or blocks with a validation message), is not observable from traces or tests (gap — question for a human).

- Table columns confirmed (Name, Country, Type, Approval Number, Remove) but no populated row was observed in this trace, and no test asserts row contents. In the tested flow the user clicks 'Search for an approved', selects on the search page, then clicks 'Save and continue' ON THE SEARCH PAGE (ched-p-workflows.ts:385) — bypassing any return to this landing page — so the populated-table state and the 'Remove' action are never rendered/exercised. Rendered populated-row format and Remove behaviour are gaps.

- The landing page's own 'Save and continue' and 'Save and return to hub' buttons are CONFIRMED in the trace snapshot but are never clicked by any CHED-P test (the tests submit from the downstream search page instead). No validation-message behaviour for this page was observed or asserted; validationMessages is honestly empty rather than assumed absent.

- Journey position 19 corroborated: accessibility spec orders Accompanying Documents -> Approved Establishment of Origin -> Search For Approved Establishment -> Traders Addresses (ched-p-accessibility-tests.spec.ts:97-123); same order in the main workflow (ched-p-workflows.ts:356-388).

### 21. search-for-approved-establishment

- Evidence-pointer/url-pattern mismatch: the brief's inferred url was /approved-establishment/search, but the observed page path is .../{chedReference}/veterinary-establishments (with ?establishment-country-code={cc}&page={n}), and the Select submit navigates to .../establishment-of-origin. The new IUU app must confirm the true route names.

- No hint text and no HTML `required` attribute were rendered on any control — 'Country (required)' is a label convention only. Server-side validation copy for the required Country filter was not exercised in this trace, so 'required' is inferred from the label, not observed. Validation messages: gap.

- The Country select defaults to the notification's country of origin, annotated '(country of origin)'. Country / Section / Type option lists are large establishment reference data (251 / 57 / 97 options) — the new app should source these from a reference-data service, not hardcode them. Only the first ~20 of each are transcribed.

- IPAFFS renders results as a desktop govuk-table AND a duplicate mobile card layout (hence 20 Select buttons for 10 rows — two forms of select-establishment-1..10), plus bespoke pagination — none of these are Design System components. Whether the IUU rebuild needs a full approved-establishment search at all (vs a simpler lookup) is a scope question, given IUU is fishery-products-specific.

- Continue-action discrepancy (finding): the trace-derived spec labelled the page's continue as 'Select', but the page object (SearchForApprovedEstablishmentPage.ts:18-20) and every workflow (ched-p-workflows.ts:385,742-743,948-949) show the terminal action is a separate 'Save and continue' button. 'Select' only ADDS a row to a running list of chosen establishments; 'Save and continue' finalises. The corpus trace happened to capture only the per-row Select navigation, not the final continue. Confirmed via test code, inferred (not trace-observed) for this page.

- Multi-select behaviour the corpus never exercised: the page supports selecting MORE THAN ONE establishment before continuing. The workflow loops approvedEstablishmentCount times (ched-p-workflows.ts:369-385, config field lines 58-60, DEFAULT_CONFIG=1 at line 147-148), each iteration clicking 'Search for an approved establishment' → re-selecting Country → 'Search' → 'Select' another row, before 'Save and continue'. selectFirstEstablishmentNotStartingWithQuote (page object lines 50-82) skips already-chosen names and pages through results. The IUU rebuild must decide whether multiple approved establishments per notification are in scope.

- Validation messages: gap. No trace rendered a validation/error message for this page, and no ched-p test asserts an error string on it (the page objects and workflows only drive happy-path selection). The behaviour of the required Country filter when Search is pressed empty, and of Save and continue with no establishment selected, is unobserved — a question for a human, not to be back-filled from legacy source.

- Page-object corroboration summary: SearchForApprovedEstablishmentPage.ts exposes exactly these controls — dropdownCountry (line 10, 'Country (required)'), btnSearch (14), btnSaveAndContinue (18), the per-row Select via #select-establishment-1 / getByRole('button',{name:'Select'}) (22,27,46,68), btnSearchForApproved (6), and Pagination Next-page link (30-32). It exposes NO locator for the Name / Approval number / Section / Type / Status filters or the Sort controls — the tests never drive those, so their 'required:false' rests on trace evidence alone (the a11y label carried no HTML required attribute); this is consistent, not contradictory.

### 22. traders-addresses

- URL pattern in the page brief was /traders-addresses; the real observed path is /notification/vnet/protected/notifications/{chedReference}/traders (spec url corrected accordingly).

- This is a hub, not a form: it has no free-text/select inputs of its own. The only real form controls are the two "Same as consignee" submit buttons (populate_importer, populate_place_of_destination) and Save and return / Save and continue. Add/Change links navigate to per-operator search+select sub-journeys (consignor/consignee/importer/final-destination /search) which are separate pages not mined here.

- No validation error state was captured for this hub in this trace (0 errors), and NEITHER the page object (page-objects/notification/TradersAddressesPage.ts) NOR any CHED-P test or the accessibility test (tests/accessibility/ched-p-accessibility-tests.spec.ts:123-181) asserts any error message or any mandatory-operator rule on this hub — every test drives the happy path and always populates consignor + consignee + importer + place of destination before Save and continue. So whether Save and continue enforces mandatory operators (e.g. consignee / place of destination required) is a genuine GAP for a human to confirm; the happy-path habit is a weak signal that all four are expected but is not an asserted rule.

- RESOLVED: Empty-state copy for the consignor section is "Add a consignor or exporter" (link id=add-consignor -> /traders/consignor/search). This IS directly observed in a trace — action 85 of trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d clicks this link on the hub while the consignor slot is still empty (confidence: confirmed, not merely inferred from the page object as an earlier draft stated).

- The 'Change link' column header text and the visually-hidden usage on the trader-table need checking against the template for accessibility; consider a Summary list in the rebuild.

- Variant primary button 'Save and review' (page-objects/notification/TradersAddressesPage.ts:22-24 btnSaveAndReview) replaces 'Save and continue' when this hub is reached from the review page's 'Change traders' amend flow (workflows/notification/ched-p-workflows.ts:1338-1340). Not observed in this create-flow trace — inferred. A human should confirm the button label and that it is a straight swap for 'Save and continue' in amend mode.

- The shared page object also exposes btnSelect (getByRole('button', {name:'Select'}), page-objects/notification/TradersAddressesPage.ts:34-36), but it is used ONLY by the CHED-A journey (workflows/notification/ched-a-workflows.ts:353-355,1008-1010) — CHED-A presents pre-existing addresses with 'Select' buttons rather than add/search links. It is NOT part of the CHED-P/IUU rendering and no CHED-P trace or test exercises it; out of scope for IUU, noted only to explain a page-object member that does not apply here.

- Both 'Same as consignee' buttons (importer and place of destination) share the identical accessible name and are only distinguishable by id — a recorded accessibility concern for the rebuild (see nonStandardPatterns).

### 23. search-existing-consignor

- The evidence-pointer URL pattern in the brief said '/consignor/search'; the trace (action 85, navigated-to) confirms the real path is '/notification/vnet/protected/notifications/{chedReference}/traders/consignor/search' — note the '/traders/' segment. There was NO '?page=1' query string on the observed navigation (a prior version of this spec asserted one; it is not evidenced by the trace and has been removed). The 'Create a new consignor or exporter' link, however, points at '/traders/consignee/new?reimport=true' — consignee, not consignor — suggesting IPAFFS re-uses one trader-search/create page for both consignor and consignee roles, parameterised by role in the path.

- The two-row sample implies a bounded result set that fit one page; no pagination control (Next/Previous or govuk-pagination) was rendered in this snapshot, and no page query param was present on the URL. Whether server-side pagination and a pagination component appear for larger result sets is a pure gap — never exercised in this trace.

- No validation was observed on this page. Behaviour when the search returns zero matches (empty-state copy), or when Search is pressed with both filters blank, is a gap — not exercised in this trace.

- The results are existing address-book / trade-partner traders. Reference data (the list of selectable traders) is user/account-scoped, not a fixed enum; the new app will source it from the trader/address-book service rather than hardcode it.

- In this trace the user did not use the search filters or Select an existing trader — they clicked 'Create a new consignor or exporter' directly, so no observedValues were captured for the Name/Address inputs.

### 24. consignor-creation

- CONFIRMED (not a gap): the consignor/exporter creation flow renders the SAME 'Add consignee' form as the consignee flow. Action 91 is inside the consignor block (action 85 'Add a consignor or exporter' -> 86 'Create a new consignor or exporter', source ConsignorCreationPage.ts:48/52), yet the rendered H1 is 'Add consignee', the name label is 'Consignee name', inputs carry title="consignee", and the form posts to (returnUrl) .../traders/consignee/new?reimport=true. Proven distinct from the later consignee form by differing frozen values (action 91 name='Linus George Ltd'/address-line-1='101 Main St' vs empty at action 100), so this is NOT snapshot bleed. The earlier framing that the trace 'accidentally captured the consignee variant and a consignor trace is needed' is a MISDIAGNOSIS: this IS the consignor trace, and it shows consignee copy. Open item for humans: is this a genuine IPAFFS mislabel/shared-template bug, and how should the new IUU service correctly title/label the consignor vs consignee pages?

- Country <select> option set: both the trace and every test that drives either variant only ever use England ('GB-ENG'). The rendered dropdown is GB-nations-only (England/Scotland/Wales/Northern Ireland + placeholder). Whether a fuller country reference-data list appears on any unexercised code path is a gap — treat the list as reference data sourced from a service either way.

- Required set: address lines 2 and 3 are explicitly optional (label '(optional)'). Name, address line 1, city/town, postcode, country, telephone and email carry no optional marker and no HTML required attr; which are actually mandatory (and their validation copy) is server-side and was never exercised — a gap for a human.

- No field carries an HTML required attribute; mandatory-field enforcement and validation copy are server-side and were not exercised in this zero-error trace and are asserted by no test — validation messages are a gap.

- No hint text, error summary or error message on the page (0 .govuk-hint, 0 .govuk-error-summary, 0 .govuk-error-message at action 91).

### 25. consignor-confirmation

- CORRECTED (was: 'consignor copy inferred by symmetry with consignee, not directly observed'). The consignor confirm page IS directly observed in this trace: resource 017ca62de205c25ba4607d5bffe02d2e452bf2f8.html is the consignor-or-exporter confirmation DOM snapshot (URL .../DRAFT.GB.2026.1525740/consignor/confirmation/9bd9a670-...?fromCreate=true). Its verbatim strings are: page title 'Create consignor or exporter confirmation  - Import and export applications - GOV.UK' (note double space before the dash), H1 panel 'The consignor or exporter has been created'. The earlier grep for 'The consignor has been created' returned zero hits ONLY because the real trader-type label is 'consignor or exporter', not 'consignor' — consistent with the link text throughout the flow ('Add a consignor or exporter', 'Create a new consignor or exporter', search-page title 'Search for an existing consignor or exporter'). The consignee ('The consignee has been created', 6x) and transporter ('The transporter has been created', 3x) variants are also directly present; the three confirm pages share one layout template but the trader-type copy differs per variant (NOT byte-identical).

- CORRECTED (was: 'Return to search href is HARD-CODED to /traders/consignor/search on ALL three confirm variants — likely an IPAFFS partial-reuse bug'). This claim is FALSE. The 'Return to search' href is correctly parameterised by trader type on each variant: consignor confirm -> .../traders/consignor/search (resource 017ca62d), consignee confirm -> .../traders/consignee/search (resource 9a40e7e1), transporter confirm -> .../traders/transporter/search (resource 26eb4c0b). There is no hard-coded-to-consignor bug; each confirm page routes 'Return to search' to its own trader-type search page.

- The {traderUuid} path segment is the newly-created trader's id (observed value 9bd9a670-552b-479f-8b14-df7e8f2abf86 on the consignor instance). The {chedReference} is the notification reference (this trace spans multiple notifications — the consignor confirm resource is on DRAFT.GB.2026.1525740, while action 97's live click flow was on DRAFT.GB.2026.1525979).

- No section caption sits inside <main>; the 'DRAFT.GB.<ref> - CHEDP' text recorded as 'caption' is the notification-context banner rendered ABOVE main, between the account bar and the main wrapper. Treat it as page context, not a govuk-caption-xl. There is no govuk caption element on this page.

- This is a CHED-P (fish) trace, which is how IPAFFS files the IUU journey. The consignor-confirmation interstitial is generic trader-management chrome shared across all CHED types — the rebuilt standalone IUU app need not reproduce this two-step 'create then confirm/add' interstitial; a single create-and-attach step would gather the same information.

- INFERRED accessibility requirement: this page must pass automated axe accessibility checks. The accessibility suite runs checkPageAccessibility on it as a named step ('Consignor Confirmation Page') between the create page and the traders-addresses page — tests/accessibility/ched-p-accessibility-tests.spec.ts:147. The ched-d suite exercises the same page-object step (ched-d-accessibility-tests.spec.ts:110). No axe violations are asserted as expected, so the standing requirement is zero violations. Not a data requirement, but a quality bar the rebuild must also meet.

- The tests only ever CLICK 'Add to notification' on this page (workflows/notification/ched-p-workflows.ts:398, :750, :956; ched-d-workflows.ts:264; ched-pp-workflows.ts:474). No test asserts the H1, the panel copy, or the 'Return to search' link on this interstitial — those are trace-only observations (now directly confirmed from resource 017ca62d). The page object exposes no 'Return to search' locator (ConsignorConfirmationPage.ts), so the tests never interact with it.

- GAP — validation messages: no page object, workflow, or test in the QA repo defines or asserts any error/validation copy for this confirmation interstitial, and none rendered in-trace. This is consistent with a page that has no user input to validate. validationMessages stays empty; if the rebuild adds any confirm-step failure states, their copy must come from a human, not from these sources.

### 26. search-existing-consignee

- QA automation NEVER exercises the search-and-select path: every ched-p/ched-d/ched-a workflow and both accessibility specs reach the consignee via the 'Create a new consignee' escape hatch (ched-p-workflows.ts:404, :753, :959). The Name/Address search inputs, the results table, and the per-row Select/View buttons are therefore trace-confirmed rendered reality but have ZERO test corroboration — their filter, selection and validation behaviour is a lower bound only. For the new IUU app this is the key finding: decide whether 'select an existing consignee' is a required capability at all, or whether create-new is the primary/only path.

- URL confirmed as /traders/consignee/search (page=1) with the primary-page prompt saying /consignee/search — but the 'Create a new consignee' link routes to /traders/consignee/new. The provided url-pattern slug guessed /consignee/search; actual observed path is /notification/vnet/protected/notifications/{chedRef}/traders/consignee/search.

- The consignee search is over the whole address book (pagination reads '2 of 4000') — the new app needs a real search that narrows, not a paginated dump. Confirm whether Name/Address are AND-combined and whether an empty search is allowed.

- Both Name and Address inputs are optional (required=false). Behaviour and any validation message when both are blank is unobserved — gap.

- Country appears only as a results column, not a search field — confirm there is no country filter on this page.

- Internal domain term for a consignee is 'economic operator' (ids economic-operator-name/address, add-economic-operator) — relevant to the new app's data model naming.

- This IUU journey is filed by IPAFFS as CHED-P (trace title: 'Submits Valid CHEDP Fish Notification'); the consignee-search page is shared CHED chrome, so it is a generic traders/address-book page rather than IUU-specific.

### 27. consignee-creation

- Which fields are truly required? No field carries an HTML 'required' attribute — IPAFFS validates server-side. 'Consignee name' and 'Address line 1' appear mandatory (no '(optional)' suffix); lines 2/3 are explicitly optional. Postcode/telephone/country/email required-ness could not be confirmed from the DOM, and the QA tests always fill every field (fillAddress populates all 9), so no test asserts required-ness either. No validation-error trace was captured on this page. GAP.

- This trace is CHED-P Fish (the IPAFFS route the IUU journey is carved from). The consignee creation form is generic across CHED types — the same ConsigneeCreationPage page object and Address type drive CHED-P and CHED-D (ched-d-workflows.ts:272-274). Confirm the IUU rebuild needs the same consignee capture step at journey position 26.

- The country <select> lists 254 options and splits the UK into England/Scotland/Wales/Northern Ireland as distinct options; option VALUES are country codes (GB-ENG/GB-NIR/GB-SCT/GB-WLS, etc. — types/country.ts:238-241) while option TEXT is the country name. New app should confirm the canonical country reference set and code scheme from a reference-data service, and decide whether the UK-split is retained.

- No hint text and no error summary rendered on this snapshot (happy-path, mid-form fill), and no test asserts any validation message for this page. Validation copy for the consignee form remains entirely unmined — no error-state trace and no test-level expectation exist. GAP; a question for a human.

- The consignee creation form is reached only via the 'create new consignee' branch (searchExistingConsignee.linkCreateNewConsignee) after an address-book search misses — ched-p-workflows.ts:403-407. The IUU rebuild should confirm whether it retains the search-existing-then-create address-book pattern or captures the consignee inline.

### 28. consignee-confirmation

- This is an interstitial confirmation/success page shown after creating a new consignee (fromCreate=true), not a data-entry page — it has no user-input fields, only two actions (Add to notification / Return to search) plus a JS 'Back' link. Corroborated: the QA page object (ConsigneeConfirmationPage.ts) exposes only btnAddToNotification. In the rebuilt IUU app this success-then-add step may be unnecessary if consignee selection is inlined into the trader/consignee flow.

- The 'Return to search' secondary link is trace-confirmed as rendered (href /notification/vnet/protected/notifications/{chedReference}/traders/consignee/search) but is never exercised by any QA test (the page object omits it). Its behaviour is therefore unasserted by the automation — flagged for a human to confirm whether the rebuilt app needs a 'return without adding' escape hatch here.

- RESOLVED (was: caption wrapper unverified). The caption 'DRAFT.GB.2026.1525979 - CHEDP' is rendered by legacy IPAFFS markup, not a GDS caption: div.govuk-!-padding-top-6 > span.heading-tertiary > span#reference-number + span, sitting in div.govuk-width-container above the grid row, outside <main>. See nonStandardPatterns. Rebuilt IUU app should use a standard govuk-caption-* inside the page.

- The form carries hidden crumb (CSRF) and etag (optimistic-concurrency) inputs — infrastructure, not user requirements.

- The confirmation copy is CHED-P specific in provenance ('The consignee has been created'); wording is generic to consignee creation and not IUU-specific. No test asserts this string, so it is trace-observed only and could change without breaking the suite.

- This page corroborates from the CHED-P workflow because IPAFFS files IUU (fishery products) as CHED-P; the identical consignee-confirmation step also appears in the CHED-D accessibility flow (ched-d-accessibility-tests.spec.ts:136), confirming it is a shared economic-operator sub-journey rather than a CHED-P-specific page.

- This confirmation page is reached only when a NEW consignee is created; the QA suite never exercises the 'select an existing consignee from search results' branch, so we have no trace or test evidence for what a returning user selecting an existing consignee sees. For the rebuilt IUU app, a human should confirm whether the create-vs-reuse split (and this success interstitial) is worth preserving or should collapse into an inline consignee selection.

### 29. transport-details

- Required-ness for each field is inferred from the page role, not from an observed validation error — this trace had zero errors, so no error summary or inline messages were captured. An error-state trace should be mined to confirm the exact validation copy and which fields are mandatory (particularly seal number and official seal, which may be optional).

- The captured BCP <select> held all 34 options INCLUDING TILBURY (GBTIL) (option 32), which the user typed and selected at actions 115-116. The port list is still a reference-data concern — the corroborating tests (see the bcp field evidence) show it is filtered per country of origin (real POEs always, dummy POEs conditionally). The new app should source the port/BCP list from a reference-data service parameterised by CHED type + origin.

- The 'Are any road trailers or shipping containers being used...' Yes branch reveals a repeatable container/trailer sub-form (Container or trailer number, Seal number, Official seal, 'Add another container or trailer'). This trace chose 'No', so the revealed fields were captured from the DOM but never filled — a Yes-path trace should be mined to confirm repeat behaviour and per-row field names beyond -1.

- The custom defra-datepicker calendar overlay and the accessible-autocomplete on Port of entry are the two significant non-govuk widgets; both are IPAFFS-specific enhancements the rebuild should reconsider (plain govuk-date-input; keep autocomplete only for the long BCP list).

- This page is IPAFFS's CHED-P (fish) transport page reached at .../transport/before-bip — it is the 'before BCP' leg. Actions 126-134 in the same trace show a SECOND means-of-transport leg (another Choose from / Transport identification / document / date / time) plus a follow-on page with 'Are you using the Common...' and 'Will the transport use the...' radios (actions 135-136) — i.e. onward-transport / GVMS questions that likely belong to adjacent pages, not this one.

- CORROBORATED (from tests): the arrival-date validation window is -30 days..+180 days inclusive, same for EU and non-EU origins, message 'You cannot enter a date more than 30 days in the past or 180 days in the future' (ched-p-date-validations.spec.ts). The IUU rebuild should carry this rule but the exact boundary semantics (is it calendar days or 24h windows? relative to submission or to 'now'?) are not pinned by the tests — a human should confirm for the new service.

- CORROBORATED (from tests): the Port of entry list is filtered by COUNTRY OF ORIGIN (real POEs always; dummy POEs conditionally; Scotland GBSCOT dummy excluded for EU except Northern Ireland) — not by commodity as originally guessed. This confirms the list MUST come from a reference-data service parameterised by CHED type + origin, and that 'dummy' test ports exist in the data. The IUU service needs the equivalent real/dummy + origin filtering rules defined.

- The page object exposes several controls NO trace in our corpus rendered, added here as inferred variant-only fields: 'BCP or Port of entry' (relabelled port field on the CTC/GVMS entry-BCP branch), 'Entry border control post' select, 'Inspection premises' select, 'Means of transport after BCP or Port of entry' (relabelled means select), and an 'Estimated journey time (Hours)' text field. A human should confirm which of these belong on the IUU transport page vs adjacent pages, and their required-ness and copy — an entry-BCP-branch trace would settle it.

- The page object also exposes btnSaveAndReview ('Save and review') alongside 'Save and continue' / 'Save and return to hub' (TransportDetailsPage.ts:74-76). This appears on the amend/review path (used by ched-p-workflows.ts:1328). Confirm whether the IUU page needs a distinct 'Save and review' action for amend journeys.

### 30. means-of-transport-after-bcp

- URL: the real path observed in the cookie returnUrl is /notification/vnet/protected/notifications/{chedReference}/transport/details (segment 'transport/details'), NOT the inferred '/means-of-transport-after-bcp'. The evidence pointer landed on the correct page (MeansOfTransportAfterBcpPage.ts:49) but the slug/url in the brief differs from the live route.

- Conditionality: the brief says this page is 'shown when consignment changes destination after BCP (origin-of-import = Yes)'. Not verifiable from a single happy-path snapshot — this CHED-P fish trace reached the page in a normal submit flow. Whether it is gated needs corroboration from the page object / route config.

- Required fields + validation copy are a gap: no error state was rendered (0 errors in this trace) and all inputs report required=false in the DOM. Which of the five fields are mandatory, and their exact error messages, are unknown. Mine an error-bearing trace or the page object for these.

- This page was captured from a CHED-P (fish) notification — the same journey IPAFFS files IUU/fishery products under. Confirm the field set is identical for the standalone IUU rebuild (transport after BCP is a shared 'onward leg' concept).

- The defra-datepicker calendar widget is custom JS layered on a standard govuk-date-input; the rebuild should drop it and use the plain three-box Date input.

- The two primary buttons ('Save and return to hub' and 'Save and continue') share identical styling; which is visually primary vs secondary is not distinguished by class here — both are plain govuk-button. Worth confirming intended hierarchy. NOTE: the page object (MeansOfTransportAfterBcpPage.ts:39-41) only models `btnSaveAndContinue` — the tests never exercise 'Save and return to hub' on this page, though the trace confirms it renders.

- Departure-date validation window is CHED-P-specific: -30 days (past) / +180 days (future), inclusive (ched-p-date-validations.spec.ts:9,26-38). This is the window IPAFFS applies to the CHED-P journey that fish/IUU is filed under. The IUU rebuild must confirm whether the same 30/180 window applies — the other CHED types use different windows (CHED-A 7/180, CHED-PP 0/90), so this is a genuine per-journey rule to nail down, not a copy-across default.

- Departure time (hour + minute) is always filled together with the date by the tests (fillMeansOfTransportDateTime → DateTimeInput, MeansOfTransportAfterBcpPage.ts:47-53), but no test asserts whether time is mandatory, nor whether the date+time is validated as one unit. Combined with the nonStandardPatterns note that GDS has no Time input, the rebuild should decide deliberately whether departure time is captured at all and how.

- Page passes an axe accessibility scan in journey context (ched-p-accessibility-tests.spec.ts:190-200, checkPageAccessibility 'Means of Transport After Bcp Page'), confirming this page sits between Transport Details and Goods Movement Services in the CHED-P journey order — corroborating journey position 29.

### 31. goods-movement-services

- The 'required' attribute is false on all controls (server-side validation, not HTML required). Whether CTC and GVMS answers are mandatory, and the exact validation copy for missing answers or an invalid/empty MRN, was not exercised in this happy-path trace and is not asserted by any test — mine an error-state trace or confirm with a human.

- The MRN format/length is enforced by hint only (18 chars, 2 digits + 2-letter country code + 14 alphanumeric, e.g. 24GB123456789AB012); no maxlength attribute is set. The exact server-side MRN validation message is a gap. Tests only ever supply valid MRNs via generateNctsMrn() (utils/reference-utils.ts:5-9).

- CTC question — TWO renderings appear to exist: the three-option 'Yes – add MRN now' / 'Yes – add MRN later' / 'No' variant (captured in the trace), and a plain 'Yes' / 'No' variant that the main BCP CHED-P flow drives via getByLabel('Yes', exact) (page-objects/notification/GoodsMovementServicesPage.ts:9-11 vs :13-19; ched-p-workflows.ts:488 vs :615-616). Which BCP / transport combinations produce which variant — and whether the new IUU app needs both — is a question for a human.

- Conditional page/question presence: the CHED-P and CHED-A workflows treat both questions as optionally-rendered and even reorderable ('GVMS ports may show, hide, or reorder these questions', ched-p-workflows.ts:605-607). Confirm the exact rule that governs when the Goods movement services page (and each question) is shown for IUU — traces only captured the both-questions-shown case.

- The primary button label is 'Save and continue' on the standard journey but 'Save and review' when the page is reached via a Change link from the Review notification page (page-objects/notification/GoodsMovementServicesPage.ts:49-51; ched-p-workflows.ts:1330-1333). Confirm the new app's amend-flow button labelling.

- Details help copy for 'What is the CTC?' and 'What is the GVMS?' captured verbatim (contains external gov.uk guidance links opening in new tabs); confirm whether the new app carries this same help content.

- Page is 100% GOV.UK Design System components (only non-standard item is the back-link--next-to-breadcrumbs positioning modifier) — cleanly rebuildable in govuk-frontend.

### 32. transporter

- This is a LIST/LANDING page, not a data-entry page: it holds zero user-input controls (only hidden crumb/etag/returnUrl/fromFooterHeader inputs). The actual transporter data is captured on the downstream 'Create a new transporter' page (reached via 'Add a transporter' -> /transport/transporter/search -> 'Create a new transporter'), which is a separate page in this journey (see actions 139-149, and inferredBehaviours[2] for the field list corroborated against TransporterCreationPage.ts).

- The transporter table has FOUR columns in the DOM: 'Name, address and country', 'Approval number', 'Type', plus an unlabelled fourth (actions) column. Only the empty state was observed in this trace. The page object + CHED-A workflow confirm the actions column holds a per-row 'Select' button (see inferredBehaviours[0]); whether it ALSO holds Change/Remove links, and the vocabulary of the 'Type' column value, remain gaps — never rendered in our corpus.

- Is a transporter MANDATORY? Every workflow adds exactly one before continuing, so we have no evidence of what 'Save and continue' does with an empty table (no validation trace, no test assertion). Human question — see validationMessages[0].

- TransporterPage.ts:8 defines an unused getter radioNo = getByRole('group', { name: 'No' }).getByLabel('No', { exact: true }) that no workflow or test references. It hints at a 'No' radio group on or near this page (e.g. 'Do you want to add another transporter?'), but nothing in the corpus or tests exercises it — unverified, a gap for a human to confirm or discard.

- Two primary submit buttons are rendered ('Save and return to hub' and 'Save and continue') both as default govuk-button (neither is styled secondary), which is a non-standard GOV.UK choice — the Design System expects one primary action.

- URL is inferred from the form action='transport' (relative) and the parent page context; the landing page itself was not reached via an observed Navigate action in this trace (it was already loaded when 'Add a transporter' was clicked at action 138). chedReference in this trace = DRAFT.GB.2026.1525979.

- No govuk-back-link exists in the main content region; in-content navigation back is via 'Cancel and return to hub' (-> /overview). A platform 'Back' link (id=back-link, href='#') IS confirmed present in page furniture outside main (out of scope per instructions).

### 33. search-existing-transporter

- No search terms were typed in this trace: the journey landed on the results page (pre-populated with address-book transporters) and clicked 'Create a new transporter' directly. Validation behaviour for the search fields (e.g. empty search, no-results copy) is UNOBSERVED — gap.

- The desktop results table in the captured 'before' snapshot contained only the header row (Name / Address / Country); the populated result rows were present only in the bespoke mobile stacked layout. Whether the desktop table also renders Status / Approval Number / Type columns and the View/Select actions is inferred from the mobile card fields, not directly observed in the desktop table body.

- The URL pattern is taken from the cookie-settings returnUrl (.../transport/transporter/search?page=1) and the POST form action (.../traders/transporter/search); the search GET form uses a relative action='search'. Exact canonical path may differ (transport/transporter vs traders/transporter both appear).

- Pagination: URL carries ?page=1 but no govuk-pagination component was present in this snapshot (all results fit one page). Paged behaviour for large result sets is a gap.

- Transporter 'Type' values observed: 'private transporter', 'commercial transporter - user added'. Status observed: 'New'. These are result-row data, not form fields — noted for the create/select downstream pages.

- QA-corroboration: the search/select path is UNEXERCISED by tests, not just missing from our trace subset. The page object (SearchExistingTransporterPage.ts:3-9) exposes ONLY the 'Create a new transporter' link — no locators for the name/approvalNumber/postcode inputs, the Search button, or the per-row View/Select buttons. All three ched-p journey workflows (ched-p-workflows.ts:506-507, 784-785, 993-994) and the accessibility spec (ched-p-accessibility-tests.spec.ts:213-215) reach this page and immediately click create-new. So the search-and-select-existing branch has zero QA coverage and its validation/no-results/pagination behaviour stays a genuine gap for a human — inferred from the absence of page-object methods.

- Accessibility is a stated requirement here: ched-p-accessibility-tests.spec.ts:214 calls checkPageAccessibility(page, 'Search Existing Transporter Page'), i.e. an axe assertion that this page must pass a11y checks — a human-authored rule (inferred, ched-p-accessibility-tests.spec.ts:214). Note this axe pass covers the create-new-then-leave state actually rendered; the populated-results and error states are not asserted.

- The TransporterPage page object (TransporterPage.ts:12, btnSelect getByRole('button', {name: 'Select'})) DOES expose a 'Select' button, but that is the upstream Transporter list page (position ~31), not this search-results page — the per-row Select buttons on THIS page (name=add-id) are driven by no test. Do not conflate the two.

- Two hidden framework inputs are present in the search form and are deliberately omitted from the fields list as plumbing, not user-facing requirements: name=crumb (hapi CSRF token) and name=etag (optimistic-concurrency tag, value '"0000000000BD293F"'). Confirmed in trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 139 before snapshot. The rebuild owns its own CSRF/concurrency mechanism; these do not carry over as requirements.

### 34. transporter-creation

- MANDATORINESS IS A GAP. No required attributes are set on any control (all required=false, trace-observed); IPAFFS validates server-side. The QA suite does not exercise validation on this page — fillAddress (TransporterCreationPage.ts:47-57) always populates all 9 fields, and no test submits the form empty or partially, so no error state was ever rendered or asserted. Which of these fields are mandatory for a private transporter (name? address line 1? country?) cannot be answered from traces or tests — a question for a human / the domain rules.

- VALIDATION COPY IS A GAP. validationMessages is empty and honestly so: no trace rendered a field error on this page and no test asserts an error string here. Do not fabricate; the new app's validation messages for the transporter address are undefined by these two sources.

- No hint text on any field (0 govuk-hint elements) in the trace; the page object exposes no hint-bearing controls either.

- COMPLETENESS CORROBORATED (not just a lower bound here). TransporterCreationPage.ts:7-45 exposes exactly the 9 inputs + Save-and-continue already captured in the trace and no others — so for this page the trace is not undercounting fields. The address model is the flat 9-field Address type (types/address.ts:1-11): name, addressLine1, addressLine2, addressLine3, cityOrTown, postcode, telephone, country, email.

- PARALLEL 'EXISTING TRANSPORTER' PATH CONFIRMED (resolves prior open question). This 'Add private transporter' creation form is only one branch. It is reached via Transporter Page 'Add a transporter' -> Search Existing Transporter Page 'Create a new transporter' (SearchExistingTransporterPage.ts:6-8; ched-p-workflows.ts:504-511). The Transporter Page also offers selecting a pre-existing transporter (TransporterPage.ts:12 btnSelect 'Select', TransporterPage.ts:9 radioNo group) — exercised in CHED-A (ched-a-accessibility-tests.spec.ts:133-140) which selects an existing transporter and skips creation. The new IUU app must decide whether to support both a free-text create form and a saved-transporter picker.

- Page URL confirmed from returnUrl as .../{chedReference}/traders/private-transporter/new — the task's inferred '.../transporter/create' pattern is not what IPAFFS uses. The related search page is .../{chedReference}/traders/transporter/search.

- This is specifically the 'Add private transporter' variant (inputs carry title='private transporter'). The 'search existing / select known transporter' path exists (see above); the creation form for a private transporter is the only variant a trace exercised.

- This page sits AFTER the Goods Movement Services page (Common Transit + 'use a transport service' radios, ched-p-workflows.ts:487-501). Whether those upstream answers gate the transporter section at all is not evidenced here — a gap for a human.

- Postcode field is free text ('Postcode or ZIP code') and the sample value '10000' is not a UK postcode — no format validation was observed. Country + postcode format coupling (UK vs ROW) is undefined by these sources.

- Evidence is from a CHED-P Fish notification (ched-p-notification.spec.ts:206 'B2C Importer ... Submits Valid CHEDP Fish Notification'), which is the IPAFFS filing route for IUU fishery products. The transporter form is shared journey furniture (same page object drives CHED-P and CHED-A); no IUU-specific transporter fields were observed.

### 35. transporter-confirmation

- This is an interstitial confirmation with NO user-input fields — it only acknowledges that the transporter record was created and offers two routes: 'Add to notification' (POST → attaches the transporter and navigates to /transport, the transport details page, action 150) or 'Return to search' (discard and go back to transporter search). It gathers no new information.

- The task's assumed url pattern ('.../transporter/confirm') differs from the OBSERVED path: the page lives at '.../{chedReference}/private-transporter/confirmation/{transporterId}?fromCreate=true' (derived from the cookie-settings and manage-account returnUrl query params in the snapshot). The 'transporter' entity here is a 'private-transporter' and the URL segment is 'confirmation', not 'confirm'.

- The evidence pointer (action 150) was CORRECT — it is on this page. The 'Back' link in the service-info region points to href='#' (a JS/history back), so no static back target was captured.

- Whether the new IUU journey even needs a standalone create-then-add-to-notification transporter flow is a scope question: IPAFFS models transporter as a reusable address-book-style entity created separately then attached. A simpler IUU app may collect transporter details inline on the transport page, removing this confirmation entirely.

- The hidden 'etag' input indicates IPAFFS uses optimistic-concurrency control on the notification when attaching the transporter — a backend concern the new app must decide whether to replicate.

- QA corroboration is complete and agrees with the trace: the page object exposes only 'Add to notification', the CHED-P workflows always take that path (ched-p-workflows.ts:514,788,997), and the accessibility suite lists this page in journey order as 'Transporter Confirmation Page' (ched-p-accessibility-tests.spec.ts:233) but asserts only axe-clean accessibility — no test asserts the panel copy 'The transporter has been created', so that heading remains trace-confirmed only.

- The 'Return to search' escape-hatch link is never exercised by any test and is absent from the page object, so its href/target and behaviour (does it truly discard the just-created transporter record?) is a gap — trace shows the link and its href, but no behavioural evidence of what happens on click. A question for a human if the IUU app keeps a create-then-attach flow.

- No validation messages exist for this page in either source — it has no inputs to validate. Confirmed empty, not a gap: page object exposes no fields and no test asserts any error string here.

### 36. contact-details

- None of the three inputs carry an HTML required attribute (required=false in the DOM), yet they are core contact details pre-populated from the account. The QA tests confirm this is treated as accept-the-defaults: every ched-p journey clicks Save and continue without touching the fields, and none assert any required/format rule. So server-side required/format (email, phone) rules are unverified by BOTH sources — a genuine gap. Mine an error-state trace to capture the messages, or confirm with a human.

- This page is the 'responsible-person/contact-details' variant (returnUrl and hint id both carry the 'responsible-person-contact-details' prefix); after 'Save and continue' the journey navigates to '/nominated-contact'. The QA workflows confirm the sequence Contact Details -> Nominated Contacts -> Contact Address. Confirm whether the new IUU service needs both a responsible-person contact page and a separate nominated-contact page, or can collapse them.

- The Name, Email address and Mobile number inputs were pre-filled from the signed-in user (Michael Scott) and the QA tests never edit them. Confirm whether these are editable free-text on every visit or read-only confirmations of account data.

- Both submit buttons render with identical primary govuk-button styling — 'Save and return to hub' is not visually a secondary button. Confirm intended visual treatment for the rebuild (GOV.UK convention would make the return-to-hub action a secondary button or link).

- VARIANT the trace missed: the page object exposes a 'Save and review' primary button (ContactDetailsPage.ts:14) used when the page is entered from the review screen (amend flow, ched-p-workflows.ts:1336,1344) — it replaces 'Save and continue'. The happy-path create trace only rendered 'Save and continue'. Confirm whether the IUU rebuild needs the same review/amend entry variant (return-to-review after editing an answer).

- VARIANT the trace missed: the page object references an organisation-address review table (#review-table-organisation-address) with a 'Change' link (ContactDetailsPage.ts:6-8), and the amend workflow reaches it via reviewNotification.linkAddContactAddress -> contactDetails.linkChangeContactAddress (ched-p-workflows.ts:1342-1344). This organisation/contact-address block on the contact-details page was never rendered in our IUU trace. Confirm whether the IUU contact-details page also surfaces an organisation address section (and its Change action), or whether contact address is a wholly separate page in the rebuild.

- DISCREPANCY: the QA page object drives this page only via 'Save and continue' / 'Save and review' and never references a 'Save and return to hub' button, whereas the trace rendered 'Save and return to hub' + 'Save and continue' + a 'Cancel and return to hub' link. The two button sets are journey-variant (create-with-hub vs amend-from-review). Kept the trace values (confirmed) and recorded the amend variant as inferred; confirm the full button matrix per entry point with a human.

### 37. nominated-contacts

- The whole page is marked '(optional)' and no field has required=true; confirm whether any contact detail is conditionally mandatory once a partial row is started (e.g. name entered but email blank).

- Body copy caps at 'up to 5 contacts' but the max-rows enforcement / disabling of 'Add another person' at 5 was not exercised in this trace — gap.

- No inline field labels/hints exist (inputs borrow labels from table headers). Confirm intended field-level hint copy for the rebuild (e.g. email format, mobile number format).

- 'Mobile number' is the visible column/label but the input name/id is 'telephone' (type=tel) — confirm whether landline numbers are acceptable or mobile-only.

- No back link was rendered in main on this page (navigation is via 'Cancel and return to hub' / 'Save and return to hub'); confirm the hub-return model is intended vs a standard GOV.UK back link.

- This page was reached as an intermediate 'Save and continue' with empty fields; validation rules and error copy are unconfirmed (gap) — mine an errored trace if one exercises this page.

- QA automation NEVER drives this page's fields — the page object exposes only 'Save and continue', DEFAULT_CONFIG has no nominated-contacts key, and every CHED-P/PP/D workflow clicks straight through empty. So the entire add-row / 'Add another person' / 'Remove' / max-5 behaviour is trace-derived and has zero test coverage. Confirm the rebuild's intended max-contacts cap and per-row partial-completion rules with a human, since no automated test pins them.

- For the IUU rebuild: confirm whether a Nominated contacts page is even in scope. It carries no required data (optional, always skipped by tests) and appears mid-journey in the CHED-P flow (between Contact details and Contact address); a simpler service may fold or drop it.

### 38. contact-address

- The radio inputs report required=false at the DOM level, yet a contact address selection is functionally mandatory (the org main address is pre-checked so a value is always present). Confirm whether IPAFFS enforces selection server-side and what the validation message reads — never observed because no error trace exists for this page and no QA test asserts on it.

- The address options are user/address-book reference data (16 seeded radios collapse to 3 distinct address strings in the test account). The new app will source these from a real address/address-book service rather than hardcode them — count and content are account-specific, not a fixed enum.

- URL is inferred from the returnUrl hidden field (…/DRAFT.GB.2026.1525979/organisation-branch-address) and the 'add a new branch address' href; the page's own GET route was not directly captured as a Navigate action in this trace.

- Two submit buttons ('Save and return to hub' vs 'Save and continue') both post the selection — confirm the distinct routing/behaviour of each in the rebuild. Only 'Save and continue' is exercised by the QA suite; 'Save and return to hub' and 'Cancel and return to hub' are trace-only.

- COVERAGE GAP: the QA automation never selects an existing address on this page — every CHED-P/CHED-P-fish/accessibility flow immediately clicks 'add a new branch address', creates one, and returns. So the primary control of the page (choosing from the saved-address radio list) has NO test corroboration; it is entirely trace-evidenced. The rebuild should add coverage for the select-existing-address path.

- IUU RELEVANCE CONFIRMED: the CHED-P fish (catch-certificate) flow — createChedPFishNotificationUpToReview, ched-p-workflows.ts:840,1003 — walks this same Contact Address page identically (add new branch address → creation → confirmation → save and continue), so the page is in scope for the standalone IUU journey.

### 39. branch-address-creation

- CAPTION: an earlier draft of this spec claimed a caption 'DRAFT.GB.2026.1525979 - CHEDP' rendered above the H1. This was FABRICATED — the frozen DOM at action 159 has zero elements matching [class*=caption] anywhere in the document, and the H1 (id=page-primary-title) contains only 'Add branch address' with no caption span. The notification reference DRAFT.GB.2026.1525979 appears only inside the 'Return to notification' href, and '- CHEDP' appears nowhere on this page. caption is now null.

- URL pattern: the header-provided pattern (.../branch-address/create) was not observed. The form posts to action='new' relative to '/notification/vnet/protected/notifications/{chedReference}/traders/organisation branch address/new' (with a literal space in the path segment). The page object does not assert a URL, so this is unconfirmed by source 2 — verify against legacy source in a later wave.

- No field carries an HTML 'required' attribute (all client-side required=false) and no hint text is rendered. Required/optional semantics for Branch address name, Address line 1, City/town, Postcode, Telephone, Country and Email are enforced server-side only — not observed here. Address line 2/3 are labelled '(optional)' (confirmed by trace and page object), implying the others may be mandatory, but no test asserts any validation and no error-state trace for this page exists in the corpus. Validation copy is a genuine GAP — mine an error-state trace or read legacy source (separate wave) to confirm which fields are required and to capture exact messages.

- Country list nests England/Scotland/Wales/Northern Ireland inside an <optgroup label='United Kingdom of Great Britain and Northern Ireland'> (ISO codes GB-ENG/GB-SCT/GB-WLS/GB-NIR), while the rest of the world is a flat option list. Confirm whether the new app's reference-data country list should preserve this optgroup grouping and the UK constituent-nation options, and whether it should submit ISO codes (as the legacy select does) rather than display names.

- The field name 'company-name' backs the visible label 'Branch address name' — a legacy naming carry-over. New app should use a semantically accurate field name.

- Journey has a double Save-and-continue on this page (create -> confirmation -> return to notification -> land back on creation -> Save-and-continue again). Confirm whether the new app needs this create/confirm/return loop or whether a single submit should persist the branch address directly — this is legacy navigation architecture the new app is explicitly told NOT to copy.

### 40. branch-address-confirmation

- This is a confirmation interstitial shown after a branch address is created from within a notification (fromCreate=true). It carries no user-input fields — only the hidden crumb + etag tokens and the single 'Return to notification' button. fieldCount is therefore effectively 0 real data-entry fields. CORROBORATED: the page object (page-objects/notification/BranchAddressConfirmationPage.ts) exposes ONLY btnReturnToNotification and no field getters at all, independently confirming there is nothing to enter on this page.

- Trace corpus is CHED-P (fish) — the journey IPAFFS files as CHED-P and which the new service splits into the standalone IUU journey; the caption reads 'DRAFT.GB.2026.1525979 - CHEDP'. The branch-address address-book flow is journey-type-agnostic, so this page is expected to be identical in the IUU rebuild. CORROBORATED: the identical page object + button is driven by BOTH ched-p-workflows.ts (lines 533,801,1006) AND ched-d-workflows.ts (line 350) with no per-type branching, confirming the confirmation page is shared and journey-agnostic across CHED types.

- The submit returns to /organisation-branch-address?selectedBranchAddressId={id} (not a generic /branch-address/confirm path). The url pattern given in the task brief was inferred and did not match; the real confirmation URL observed is /{chedReference}/organisation branch address/confirmation/{branchAddressId}?fromCreate=true.

- No error state was observed for this page in this trace (0 errors), and NO test asserts any validation/error message for this page — the accessibility specs only run an a11y check and click the button, and the workflows only click the button. Any validation copy is therefore a genuine gap (none is expected: the page has no inputs to validate).

- The 'Back' link href is '#' (no-op / JS or history back) — behaviour not exercised in the trace and not exercised by any test (no page object getter for it).

- INFERRED accessibility requirement: tests/accessibility/ched-p-accessibility-tests.spec.ts:268 (and ched-d-accessibility-tests.spec.ts) run checkPageAccessibility() on the 'Branch Address Confirmation Page' before clicking through. A human test therefore asserts this page must pass the WCAG/axe accessibility scan — a requirement the IUU rebuild must also meet.

- INFERRED post-submit navigation nuance: in the notification (fromCreate=true) flow, the workflows show 'Return to notification' lands back on the Branch Address Creation Page ('returned to'), where Save and continue is then clicked again (ched-p-workflows.ts:533-536; accessibility spec 269-273) — i.e. the just-saved address is pre-selected and the user confirms selection, rather than returning straight to the review page. This selection-confirm step should be preserved in the rebuild's address-book return flow.

### 41. review-notification

- This is a check-your-answers / review page with NO data-entry controls — the only interactive form control is the 'Save and continue' button; all other interactivity is Copy buttons, Change links and attachment download links. Recorded 'fields' accordingly.

- The 'IUU exemptions' section (H3, 'No exemptions specified' when none) is the IUU-specific block on this page — in this trace no exemptions were entered so the populated-state copy/table is a gap (never exercised here). Needs an error/populated trace to capture the exemption row format.

- The catch-certificate summary table columns are confirmed: 'Catch certificate reference', 'Flag state of catching vessel', 'Date of issue', 'Attachments'. Each certificate additionally renders its own H3 'Reference: <ref>' and a commodity table (Commodity code | Species, description). Two certificates rendered here (1 of 2, 2 of 2) proving the multi-certificate assertion.

- This is a CHED-P/fish trace, so the page carries POAO/health-certificate, approved-establishment, traders and transport review sections. For the standalone IUU rebuild it is a gap which of these sections carry over — the IUU-relevant blocks are the catch-certificate tables, IUU exemptions, and the reference/customs-code block; the approved-establishment and full POAO trader/transport review may not all apply.

- Region of origin code and Consignment reference number rendered empty in this trace — confirms the fields exist on the review but not their populated format.

- The 'Not Submitted' status and 'Last updated ... by ...' audit line are review-page furniture; whether the rebuild surfaces a status/audit line is a product decision (gap).

- IUU exemptions populated-state remains a GAP: the entire QA automation repo (page-objects, workflows, tests) contains NO reference to 'exemption' — grep -rin 'exemption' returns nothing. So neither trace nor test exercises an entered exemption. The 'No exemptions specified' empty-state is confirmed from the trace only; the populated exemption row format is unknown and is a question for a human.

- DISCREPANCY (finding, not a correction): the test ched-p-notification.spec.ts:47 asserts the Consignment reference number (#reference-number) renders with a value on review, but the corroborated trace rendered this field EMPTY. Trace (rendered reality) wins and stays confirmed-empty; the disagreement is recorded here. Likely the trace's notification had no consignment reference entered while the test's did — needs a human to confirm the field is optional.

- Change-link count is a stated rule: ched-p-manipulation.spec.ts:63-64 asserts the review page renders AT LEAST 14 'Change' links. For the standalone IUU rebuild the exact set of editable sections (and therefore change links) will differ — this is the CHED-P/fish count, an upper-bound reference not an IUU requirement.

- Page-object exposes review-page controls never rendered in the corroborated trace, added as inferred fields: 'Amend' button (post-submission amend mode), 'Review and submit' link (hub/amend entry), 'Split consignment' link + 'commodities split into -' message (split-consignment variant), and 'Add the contact address for consignment' link (shown only when no contact address entered yet). Which of these carry into the standalone IUU journey is a product decision (gap) — IUU is a new simple app and may not have amend/split flows.

- Named change-link ids in the page object (#country-of-origin-change-link, #goods-movement-services-change-link, #transporter-contacts-change-link, #transport-to-bip-change-link, #traders-change-link, #organisation-change-link, #responsible-person-contact-details-change-link, #commodity-change-bulk-link-0) reveal the editable review sections IPAFFS groups by. These are POAO/transport-oriented; the IUU-relevant editable sections are the catch-certificate details, commodity, and contact — the transporter/traders/goods-movement change targets may not all apply to the rebuilt IUU journey (gap).

### 42. declaration

- CORROBORATED: the task brief anticipated 'declaration checkboxes' on this page, but NONE exist for CHED-P/IUU. This is now confirmed from THREE sources, not just the single trace: (1) the trace rendered only the static certification paragraph + a lone 'Submit notification' button; (2) the CHED-P workflow submits with a bare declaration.btnSubmitNotification.click() and no .check() anywhere (ched-p-workflows.ts:552, 808, 1348); (3) the CHED-P notification/manipulation/accessibility specs do the same (ched-p-notification.spec.ts:221, ched-p-manipulation.spec.ts:73, ched-p-accessibility-tests.spec.ts:281). The act of clicking Submit constitutes the declaration — there is no tick-box to acknowledge/agree. The rebuild should NOT invent an agreement checkbox unless a requirement is found elsewhere.

- VARIANT (other CHED types, NOT IUU): the DeclarationPage page object is SHARED across all four CHED types and exposes two checkbox controls that CHED-P/IUU never uses — checkboxReadAndUnderstood 'I/We have read and understood' (used by CHED-PP: ched-pp-workflows.ts:495, ched-pp-accessibility-tests.spec.ts:180) and checkboxIConfirm 'I confirm that I have' (used by CHED-A: ched-a-workflows.ts:466, 482, 532, 658). Page object refs: DeclarationPage.ts:6-8 and DeclarationPage.ts:10-12. So plants (CHED-PP) and live-animals (CHED-A) DO gate submission behind an explicit agreement checkbox, whereas CHED-P (fish/IUU) and CHED-D (food/feed) deliberately do not. QUESTION for a human: is the checkbox-less declaration correct/desired for the new IUU app, or should IUU adopt an explicit 'I confirm' checkbox for legal robustness? Not answerable from traces/tests — it's a product decision. confidence: inferred (page object + workflows), not a trace-observed IUU behaviour.

- ACCESSIBILITY (inferred): the CHED-P accessibility suite runs an axe scan on the Declaration Page (ched-p-accessibility-tests.spec.ts:280). The rebuilt page must pass WCAG/axe with no violations. confidence: inferred (test asserts it; no trace snapshot of a11y results in our corpus).

- POST-SUBMIT (inferred): clicking 'Submit notification' navigates to the confirmation page, which renders the allocated CHED reference (ched-p-notification.spec.ts:222 asserts confirmation.locatorReferenceNumber matches chedReferencePattern(chedType.chedP)). The declaration page has no other outcome on the happy path.

- The certification copy hardcodes 'assimilated Regulation 2017/625' — verify whether the new IUU app should reproduce this exact legal text verbatim or source it from configuration/reference data. This regulatory reference is load-bearing legal wording. No test asserts this string, so it is trace-confirmed copy only (gap on whether it is the intended final wording for IUU).

- 'Date of declaration' shows the current date (16 July 2026) and is mirrored in the hidden submissionDate field — confirm whether this must be the server submission date (set at render) versus captured at POST time.

- The 'Back' link href is "#" (history/JS driven). Confirm the intended prior page in the IUU journey (expected: the check-answers / review summary page).

- Only one trace exercised this page and it had zero errors, so no validation/error state was observed. Whether submission can fail client-side (e.g. stale etag concurrency conflict) and what error copy renders is a gap — not observed.

- The section caption 'DRAFT.GB.2026.1525979 - CHEDP' and the 'Back' link render in service chrome above <main>, not inside it; captured here per brief but they are shared layout furniture, not page-specific content.

### 43. confirmation

- This confirmation page is read-only (post-submission) — it has NO form controls, back link, or primary submit button, and (unusually for GOV.UK) NO H1/panel title. The three 'fields' captured are read-only OUTPUT reference codes shown in a summary list, not inputs. fieldCount reflects those outputs.

- The captured trace is a CHED-P fish notification and the evidence is the exact IUU carrier (IPAFFS files IUU/fishery products as CHED-P). References use the CHEDP prefix and customs document code N853. The new standalone IUU app will need its own reference-number scheme/prefix and to confirm the correct customs document code(s) for IUU catch-certificate consignments.

- This is the INSPECTION-REQUIRED variant (panel--inspection-required / notification-banner--inspection-required, 'Inspection status: Required at London Tilbury'). The QA repo confirms there are at least FOUR distinct post-submission risk-assessment outcomes rendered on this page — 'Check GVMS', 'Inspection required' (traced), 'Inspection not required' ('Not required'), and 'Go to place of destination' (page-objects/notification/ConfirmationPage.ts:14-54; tests/notification/ched-p/ched-p-inspection-non-transit.spec.ts:19-101 asserts all four). Only 'Inspection required' was in our trace corpus; the exact banner/panel/guidance copy for the other three outcomes is a GAP a human must supply. The new IUU app must decide how to signal each outcome (the traced variant uses a bespoke custom-modifier banner+panel rather than the standard green confirmation panel).

- Corroboration of the outcome inputs (from the workflow, for context on how the outcome is driven — NOT a requirement of this page): risk category + entry BCP + GVMS-transport + CTC selection determine the resulting risk assessment (ched-p-workflows.ts:645-651; ChedPNonTransitConfig at :586-601). This is legacy IPAFFS risk-engine behaviour; the confirmation page only DISPLAYS the outcome.

- ACCESSIBILITY REQUIREMENT (inferred): the confirmation page must pass an axe accessibility scan — tests/accessibility/ched-p-accessibility-tests.spec.ts:283-284 runs checkPageAccessibility(page, 'Confirmation Page'). Note this is in tension with the nonStandardPatterns finding that the traced variant has NO H1/panel title; the a11y test passed, so the accessible page name is carried by the document <title> alone. A rebuild should give the confirmation a proper H1.

- The 'Return to your dashboard' exit link IS corroborated as a real, exercised control (page-objects/notification/ConfirmationPage.ts:10-12 linkReturnToDashboard by role 'link'; clicked in ched-p-workflows.ts:1351 after reading the reference). The Copy buttons, 'Create a new notification' link and Qualtrics feedback link are trace-only (no test drives them) — treat as legacy chrome to confirm.

- Reference formats observed: CHED reference = CHEDP.GB.2026.1525979 (regex ^CHEDP\.GB\.\d{4}\.\d{7,8}$), customs declaration reference = GBCHD2026.1525979, customs document code = N853. Whether the second/third are derived from the first is not shown here.

- The 'Return to your dashboard' and 'Create a new notification' exit links, the Copy buttons, and the Qualtrics feedback link are all IPAFFS-specific navigation/enhancement — a rebuild should confirm which of these are actual requirements vs legacy chrome.

## GOV.UK component inventory

Counts are sums of the per-page observed counts where numeric; “entries” is the number of page-spec component records.

| Component | GOV.UK class | Observed count | Entries | Pages | Modifiers observed |
|---|---|---:|---:|---|---|
| Accordion | govuk-accordion | 1 | 1 | add-catch-certificate-details | govuk-accordion__section--expanded, govuk-accordion__show-all |
| Back link | (rendered as 'Back' link with href='#') | 1 | 1 | attach-catch-certificate |  |
| Back link | (rendered as link "Back" to #) | 1 | 1 | commodity-extended-description |  |
| Back link | govuk-back-link | 8 | 8 | import-type, about-the-consignment, commodity-additional-details, add-catch-certificate-details, approved-establishment-of-origin, goods-movement-services, contact-details, branch-address-confirmation | back-link--next-to-breadcrumbs |
| Back link | n/a (rendered above main as link 'Back' with href='#') | 1 | 1 | select-risk-category |  |
| Back link | n/a (rendered as link 'Back' with href="#" in service chrome, above <main>) | 1 | 1 | declaration |  |
| Body | govuk-body | 18 | 10 | notification-hub, attach-catch-certificate, latest-health-certificate, document-upload, accompanying-documents, means-of-transport-after-bcp, transporter-creation, nominated-contacts, review-notification, declaration | govuk-!-margin-bottom-8, govuk-body-s |
| Body / Link | govuk-body | 1 | 1 | commodity-additional-details | govuk-link |
| Body text | govuk-body | 5 | 4 | select-risk-category, health-certificate-required, catch-certificate-needed, manage-catch-certificates |  |
| Button | govuk-button | 68 | 42 | notifications-dashboard, import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, health-certificate-required, commodity-extended-description, commodity-additional-details, catch-certificate-needed, attach-catch-certificate, manage-catch-certificates, add-catch-certificate-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-for-approved-establishment, traders-addresses, search-existing-consignor, consignor-creation, consignor-confirmation, search-existing-consignee, consignee-creation, consignee-confirmation, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, transporter-confirmation, contact-details, nominated-contacts, contact-address, branch-address-creation, branch-address-confirmation, review-notification, declaration, confirmation | govuk-!-display-block, govuk-!-margin-bottom-0, govuk-!-margin-bottom-2, govuk-!-margin-bottom-4, govuk-!-margin-right-1, govuk-!-margin-top-3, govuk-button--secondary, govuk-button--secondary (Choose files ONLY), govuk-button-group |
| Caption | govuk-caption-m | 0 | 1 | review-notification | govuk-caption-m |
| Caption | govuk-caption-xl | 29 | 27 | import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, commodity-extended-description, commodity-additional-details, catch-certificate-needed, attach-catch-certificate, manage-catch-certificates, add-catch-certificate-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-for-approved-establishment, traders-addresses, search-existing-consignor, search-existing-consignee, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, nominated-contacts, contact-address | govuk-!-font-weight-regular, govuk-caption-l, govuk-caption-m |
| Checkboxes | govuk-checkboxes | 3 | 3 | commodity-basic-description, add-catch-certificate-details, transport-details | govuk-checkboxes__input, govuk-checkboxes__item, govuk-checkboxes__label |
| Date input | govuk-date-input | 11 | 7 | notifications-dashboard, about-the-consignment, add-catch-certificate-details, latest-health-certificate, accompanying-documents, transport-details, means-of-transport-after-bcp | govuk-date-input__input, govuk-date-input__item, govuk-date-input__label, govuk-input--width-2, govuk-input--width-4 |
| Details | govuk-details | 6 | 5 | catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details, accompanying-documents, goods-movement-services | govuk-!-margin-bottom-8, govuk-!-margin-top-2, govuk-details__summary, govuk-details__summary-text, govuk-details__text |
| Error summary | govuk-error-summary | 1 | 2 | notifications-dashboard, document-upload | govuk-error-summary__body, govuk-error-summary__list, govuk-error-summary__title |
| Fieldset | govuk-fieldset | 40 | 27 | notifications-dashboard, import-type, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, commodity-additional-details, catch-certificate-needed, manage-catch-certificates, add-catch-certificate-details, latest-health-certificate, accompanying-documents, search-for-approved-establishment, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, transport-details, means-of-transport-after-bcp, goods-movement-services, search-existing-transporter, transporter-creation, contact-details, nominated-contacts, contact-address, branch-address-creation | govuk-fieldset__heading, govuk-fieldset__legend, govuk-fieldset__legend--m, govuk-fieldset__legend--s, govuk-fieldset__legend--xl, govuk-label--m, govuk-visually-hidden |
| File upload | govuk-file-upload | 2 | 2 | attach-catch-certificate, document-upload |  |
| Form group | govuk-form-group | 60 | 18 | import-type, country-of-origin, commodity-basic-description, select-risk-category, commodity-additional-details, manage-catch-certificates, latest-health-certificate, document-upload, accompanying-documents, search-for-approved-establishment, consignor-creation, consignee-creation, means-of-transport-after-bcp, transporter-creation, contact-details, nominated-contacts, contact-address, branch-address-creation | govuk-!-margin-bottom-0 |
| Grid | govuk-grid-row | 3 | 3 | manage-catch-certificates, consignee-creation, declaration | govuk-grid-column-full, govuk-grid-column-one-half, govuk-grid-column-three-quarters, govuk-grid-column-two-thirds |
| Heading | govuk-heading-l | 2 | 2 | catch-certificate-needed, attach-catch-certificate | govuk-!-margin-bottom-4 |
| Heading | govuk-heading-m | 9 | 5 | search-commodity, commodity-extended-description, latest-health-certificate, transport-details, means-of-transport-after-bcp | govuk-!-margin-bottom-0, heading-with-help |
| Heading | govuk-heading-xl | 45 | 35 | import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, health-certificate-required, commodity-extended-description, commodity-additional-details, catch-certificate-needed, attach-catch-certificate, manage-catch-certificates, add-catch-certificate-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-for-approved-establishment, traders-addresses, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, nominated-contacts, contact-address, branch-address-creation, review-notification, declaration | govuk-!-margin-bottom-4, govuk-fieldset__heading, govuk-heading-l, govuk-heading-m, govuk-heading-s, govuk-heading-xl |
| Heading (m) | govuk-heading-m | 7 | 1 | notification-hub |  |
| Heading (xl) | govuk-heading-xl | 1 | 1 | notification-hub |  |
| Hint | govuk-hint | 34 | 10 | notifications-dashboard, origin-of-import, commodity-basic-description, about-the-consignment, traders-addresses, transport-details, means-of-transport-after-bcp, goods-movement-services, contact-details, contact-address | govuk-!-margin-bottom-6, govuk-body, govuk-radios__hint |
| Input | govuk-input | 3 | 1 | commodity-extended-description | govuk-!-width-full, govuk-!-width-one-half, govuk-!-width-one-quarter, net-weight, number-of-packages |
| Inset text | govuk-inset-text | 3 | 3 | attach-catch-certificate, add-catch-certificate-details, latest-health-certificate |  |
| Label | govuk-label | 78 | 19 | import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, select-risk-category, commodity-extended-description, document-upload, search-for-approved-establishment, search-existing-consignor, consignor-creation, consignee-creation, transport-details, means-of-transport-after-bcp, goods-movement-services, search-existing-transporter, transporter-creation, contact-details, branch-address-creation | , govuk-!-display-inline-block, govuk-date-input__label, govuk-label--m, govuk-label--s, govuk-radios__label |
| Label | govuk-label--s | 3 | 1 | transporter |  |
| Link | govuk-link | 56 | 30 | origin-of-import, search-commodity, notification-hub, catch-certificate-needed, attach-catch-certificate, manage-catch-certificates, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, traders-addresses, search-existing-consignor, consignor-creation, consignor-confirmation, search-existing-consignee, consignee-creation, consignee-confirmation, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, transporter-confirmation, contact-details, nominated-contacts, contact-address, branch-address-creation, review-notification, confirmation | all-sections-link, govuk-!-font-size-19, govuk-task-list__link |
| List | govuk-list | 5 | 3 | document-upload, accompanying-documents, goods-movement-services | govuk-list--bullet, govuk-list--number |
| List (bullet) | govuk-list | 1 | 1 | attach-catch-certificate | govuk-list--bullet |
| Notification banner | govuk-notification-banner | 4 | 2 | notifications-dashboard, confirmation | govuk-!-margin-bottom-0, notification-banner--alert, notification-banner--inspection-required, notification-banner__content--full-width |
| Panel | govuk-panel | 5 | 5 | consignor-confirmation, consignee-confirmation, transporter-confirmation, branch-address-confirmation, confirmation | govuk-!-margin-bottom-8, govuk-panel--confirmation, govuk-panel__title, panel--inspection-required |
| Radios | govuk-radios | 15 | 11 | import-type, origin-of-import, commodity-basic-description, about-the-consignment, select-risk-category, commodity-additional-details, catch-certificate-needed, manage-catch-certificates, transport-details, goods-movement-services, contact-address | govuk-!-margin-bottom-8, govuk-!-width-one-half, govuk-radios--conditional, govuk-radios__conditional, govuk-radios__conditional--hidden, govuk-radios__input, govuk-radios__item, govuk-radios__label |
| Section break | govuk-section-break | 37 | 8 | commodity-extended-description, search-for-approved-establishment, search-existing-consignor, search-existing-consignee, transporter, search-existing-transporter, review-notification, confirmation | govuk-!-margin-bottom-4, govuk-section-break--l, govuk-section-break--visible |
| Select | govuk-select | 28 | 15 | notifications-dashboard, country-of-origin, origin-of-import, commodity-basic-description, about-the-consignment, commodity-extended-description, add-catch-certificate-details, accompanying-documents, search-for-approved-establishment, consignor-creation, consignee-creation, transport-details, means-of-transport-after-bcp, transporter-creation, branch-address-creation | govuk-!-display-inline-block, govuk-!-margin-right-3, govuk-!-width-full, govuk-!-width-one-half, type-of-package |
| Summary list | govuk-summary-list | 3 | 4 | commodity-extended-description, add-catch-certificate-details, review-notification, confirmation | govuk-!-margin-bottom-1, govuk-!-margin-bottom-4, govuk-!-width-one-half, govuk-summary-list__actions, govuk-summary-list__key, govuk-summary-list__row, govuk-summary-list__row--no-border, govuk-summary-list__value |
| Table | govuk-table | 12 | 11 | commodity-basic-description, commodity-extended-description, approved-establishment-of-origin, search-for-approved-establishment, traders-addresses, search-existing-consignor, search-existing-consignee, transporter, search-existing-transporter, nominated-contacts, review-notification | commodity-overview, govuk-!-margin-bottom-2, govuk-table__body, govuk-table__cell, govuk-table__cell--numeric, govuk-table__head, govuk-table__header, govuk-table__header--half, govuk-table__header--numeric, govuk-table__row, species-table-cheda, table-responsive, traders-search-results (custom) |
| Table (or summary list) — INFERRED | govuk-table or govuk-summary-list | 1 | 1 | contact-details |  |
| Tabs | govuk-tabs | 1 | 1 | search-commodity | govuk-tabs__list-item--selected |
| Tag | govuk-tag | 18 | 2 | notifications-dashboard, notification-hub | govuk-tag--blue, govuk-tag--green, govuk-tag--grey, govuk-tag--orange, govuk-tag--red, govuk-tag--yellow, phase-tag, tag--fixed-width |
| Task list | govuk-task-list | 7 | 1 | notification-hub | govuk-task-list__item, govuk-task-list__item--with-link, govuk-task-list__link, govuk-task-list__name-and-hint, govuk-task-list__status |
| Text input | govuk-input | 80 | 19 | notifications-dashboard, origin-of-import, search-commodity, add-catch-certificate-details, latest-health-certificate, accompanying-documents, search-for-approved-establishment, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, transport-details, means-of-transport-after-bcp, goods-movement-services, search-existing-transporter, transporter-creation, contact-details, nominated-contacts, branch-address-creation | govuk-!-width-one-half, govuk-!-width-one-third, govuk-!-width-three-quarters, govuk-!-width-two-thirds, govuk-input--width-2, govuk-input--width-20, govuk-input--width-3, govuk-input--width-4 |
| Visually hidden | govuk-visually-hidden | 4 | 3 | search-for-approved-establishment, means-of-transport-after-bcp, nominated-contacts |  |
| Visually hidden text | govuk-visually-hidden | 1 | 1 | search-existing-consignor |  |
| Warning text | govuk-warning-text | 4 | 4 | latest-health-certificate, traders-addresses, review-notification, confirmation | govuk-warning-text__icon, govuk-warning-text__text |

## Non-standard patterns

Every per-page non-standard-pattern record is reproduced; similarly named records are not collapsed when their page-specific evidence or concern differs.

### notifications-dashboard

#### defra-datepicker / date-picker__* / date-input--picker

- What it does: A bespoke pop-up calendar widget attached to each date-range Day/Month/Year triplet, with previous/next-month navigation, a heading (e.g. 'July 2026'), a date table and a Choose date reveal icon
- Concern: Custom JS calendar not part of the GOV.UK Design System; the DS only ships the plain Date input pattern. Adds JS, a11y and maintenance burden the rebuild should avoid.
- GOV.UK alternative: GOV.UK Date input (three text fields) with no calendar overlay; if a picker is essential, the moj-date-picker from the MoJ Design System is the DS-adjacent choice
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9 (non-govuk class inventory)

#### notification-list / notification-list__row / notification-list__grid-column-20|25|30 / notification-list__value

- What it does: Bespoke card-per-notification grid; each card is a definition list (Reference number, Commodity, Arrival at BCP or POE, CHED status, Consignee, Consignor, Origin, Inspection) with Copy as new / View details / Amend / Show notification actions. Per-row elements carry stable ids the tests key off: reference-number-0, status-0, inspection-status-0, arrival-date-{ref}, decision-date-{ref}, and the per-row action controls view-details-{ref}, copy-as-new-{ref}, amend-details-{ref} (inferred).
- Concern: Custom layout + column classes rather than a GOV.UK component. The new IUU app needs a listing but should express it with a standard component. NOTE a possible layout discrepancy: the page object also addresses the list via table semantics (#notifications-page tbody tr / td), which conflicts with the card-grid seen in the trace — see openQuestions.
- GOV.UK alternative: govuk Summary list per item, or a responsive Table; MoJ 'sortable table' if column sorting is needed
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9 (snapshot cards e324+). Row/action id scheme inferred from page-objects/notification/NotificationDashboardPage.ts:100-106,128-130,224-250

#### search-panel / search-filter-form / search-hidden / hidden-search button

- What it does: A bespoke collapsible 'Search notifications by' filter panel wrapping the keyword/commodity/BCP/status/country/type/microchip/date controls
- Concern: Custom show/hide filter container, not a DS component. Fine as plain markup but the collapse behaviour is bespoke JS.
- GOV.UK alternative: Plain form inside govuk-grid layout; use Details for progressive disclosure of advanced filters if collapse is required
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9

#### pagination / pagination-list / pagination-item / pagination-link / pagination-link-icon

- What it does: Bespoke pager rendering 'Next page : 2 of 4000'
- Concern: Predates / does not use the official govuk-pagination component (added to the DS later). Custom markup and icons.
- GOV.UK alternative: GOV.UK Pagination component
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9 (.pagination innerText)

#### info-summary / info-summary__title / info-summary__body / info-summary__list

- What it does: Bespoke 'My alerts' summary box listing counts of notifications by status change (awaiting amendment, In Progress, Valid, Rejected, Cancelled, Replaced) as links
- Concern: Custom summary widget, not a DS component; visually resembles error-summary but is an informational digest.
- GOV.UK alternative: Summary card or a plain list of links; Summary list for the count digest
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9

#### notification-button / link-button / clear-link / tag--fixed-width

- What it does: notification-button overrides the Create-a-new-notification button; link-button styles the date shortcut buttons (Today/Tomorrow/Next seven days) as inline text buttons; clear-link styles the Clear reset link; tag--fixed-width forces uniform tag width
- Concern: Small bespoke style overrides layered onto govuk-button/govuk-tag — deviations from standard component styling.
- GOV.UK alternative: Standard govuk-button (and govuk-button--secondary) and govuk-tag without width/appearance overrides
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9

#### aria-live-message / sr-only / search-hidden

- What it does: Live-region and screen-reader-only helpers for the search/results interaction
- Concern: Bespoke a11y plumbing; acceptable in principle but hand-rolled rather than provided by a component.
- GOV.UK alternative: No direct DS component; keep as an ARIA live region if a live count is needed
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 9

### import-type

#### govuk-fieldset__legend with empty content; question carried by a separate H1 above the fieldset

- What it does: The radios sit in a fieldset whose legend is blank; the visible question 'What are you importing?' is a standalone govuk-heading-xl H1 rather than being the legend text.
- Concern: Minor GDS-pattern deviation. The GOV.UK 'one question per page' pattern puts the H1 INSIDE the legend (legend > h1). Here the H1 is outside the fieldset and the legend is empty, so the accessible name of the radio group is not the question. Screen-reader users hear the radios without the grouping question announced from the legend.
- GOV.UK alternative: Standard GOV.UK radios pattern: page-heading legend — <legend class="govuk-fieldset__legend--xl"><h1 class="govuk-fieldset__heading">What are you importing?</h1></legend>. The rebuild should adopt this.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 10 (main.html — legend empty, h1 sibling)

#### govuk-back-link component with href='#'

- What it does: 'Back' navigation uses the govuk-back-link component (class='govuk-back-link back-link--next-to-breadcrumbs') but points its href at '#' (JS/history-driven) rather than a real server-side href to the previous step.
- Concern: The govuk-back-link component IS used, but its href is '#' so it goes nowhere without JS — not progressive-enhancement friendly. It also carries a non-standard custom modifier class 'back-link--next-to-breadcrumbs'.
- GOV.UK alternative: Keep the govuk-back-link component but give it a real href to the previous step (only the href needs changing; the component is already in use).
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 10 (a11y tree ref e48, /url: '#'; DOM class='govuk-back-link back-link--next-to-breadcrumbs')

### country-of-origin

#### (none)

- What it does: Every class in the main content region is prefixed govuk-* (govuk-grid-row, govuk-grid-column-full, govuk-caption-xl, govuk-heading-xl, govuk-form-group, govuk-label, govuk-label--m, govuk-select, govuk-!-width-one-half, govuk-button, govuk-!-margin-right-1, govuk-!-margin-bottom-4).
- Concern: None — this page is 100% inside the GOV.UK Design System toolbox and can be rebuilt as a plain govuk-frontend Select page with no custom CSS or bespoke widgets.
- GOV.UK alternative: n/a — already standard
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 12 (class inventory: all govuk-*)

### origin-of-import

#### region-code / region-code-box / region-code-divider

- What it does: Custom classes on the conditional 'Enter the region code' reveal that appears when 'Does the consignment require a region of origin code?' = Yes. region-code wraps the conditional block, region-code-box wraps the input, and region-code-divider is a visual separator element.
- Concern: Bespoke IPAFFS styling layered on top of the standard govuk-radios--conditional reveal. Not part of the Design System — the divider in particular is decoration the toolbox does not ship.
- GOV.UK alternative: The reveal itself is already a standard Radios conditional (govuk-radios--conditional / govuk-radios__conditional). The new app can drop the custom box/divider classes and use the plain conditional reveal with a govuk-input for the code.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 15 — class inventory

#### conform-uk-regulations (used as a class)

- What it does: The name/id 'conform-uk-regulations' also appears as a CSS class on the conform-to-regulations markup — an IPAFFS-specific selector hook rather than a Design System class.
- Concern: Field-name-as-class is a bespoke hook, likely for JS or targeted styling; it is not a govuk-* utility.
- GOV.UK alternative: No replacement needed — the group is a standard Radios with per-item govuk-radios__hint. Drop the custom class in the rebuild.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 15 — class inventory

### search-commodity

#### govuk-tabs used with href navigation (page-3?tab=commodity-code-search / ?tab=species-search)

- What it does: Renders two search modes ('Commodity code search', 'Species search') as GOV.UK tabs, but each tab is a server-side navigation link that reloads the page rather than the standard JS-toggled in-page tab panels.
- Concern: GOV.UK Tabs are intended for progressive-enhancement in-page panels of the SAME content, not for switching between two different server-rendered search forms. This is an off-label use of the component.
- GOV.UK alternative: For the new app, model the two search modes as separate pages/routes, or a single search field, rather than Tabs. If both modes are kept, radios or two distinct pages are more idiomatic than Tabs.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 17 (main.html)

#### .commodity-tree / .commodity-list / .commodity-selection-breadcrumb / .box-margin / .commodity-code-box / .commodity-description-links-container

- What it does: A bespoke, expandable HS commodity-code tree browser. Lists all top-level HS chapters (02 MEAT..., 03 FISH..., ... 99) and lets the user drill down; a 'commodity-selection-breadcrumb' nav shows the current position with an 'All commodities' root link.
- Concern: Entirely custom markup with no GOV.UK equivalent. Each chapter row is a <p> containing two submit buttons (code + description). The tree is the full HS classification (reference data), not IUU-specific — for a fish/IUU journey only chapter 03 (and arguably 16) is relevant, yet the whole tree renders.
- GOV.UK alternative: No direct Design System component for a hierarchical code tree. The new IUU app should source commodity codes from a reference-data service and, given IUU is scoped to fish CN codes (e.g. 03019230 Anguilla spp.), likely replace the whole tree with a scoped autocomplete or a short pre-filtered list rather than the full HS tree.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 17 (main.html)

#### .link-button and .commodity-description-link

- What it does: <button type=submit> elements styled to look like inline text links (chapter code and chapter description each submit the form with name=parent_XX value=XX to drill into that chapter).
- Concern: Buttons-as-links is a bespoke pattern; it relies on custom CSS to strip button chrome. Two submit buttons carry the same name/value per row (redundant).
- GOV.UK alternative: GOV.UK guidance is a real link for navigation or a govuk-button for actions. If drilling into the tree is navigation, use anchors; if it must POST, a single button per row.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 17 (main.html)

#### .search-panel

- What it does: Bespoke container wrapper around the search fieldset and around the commodity tree.
- Concern: Custom layout class, not a Design System pattern; purely presentational grouping.
- GOV.UK alternative: Standard govuk-form-group / govuk-grid layout, or govuk-inset-text if visual separation is wanted.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 17 (classes inventory)

### commodity-basic-description

#### table-responsive

- What it does: Custom wrapper class around the govuk-table for horizontal-scroll / responsive behaviour on narrow viewports
- Concern: Not part of the GOV.UK Design System — bespoke responsive-table shim. The commodity summary is a fixed 2-column table (code + description) that fits comfortably; a plain govuk-table needs no custom wrapper.
- GOV.UK alternative: Standard GOV.UK Table (govuk-table) with no wrapper; if wide-table scrolling is genuinely needed, wrap in a simple overflow-x container rather than a bespoke class.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 22

#### commodity-type

- What it does: IPAFFS-specific class applied to the Type-of-commodity <select> (alongside govuk-select and govuk-!-width-one-half)
- Concern: Bespoke hook class on an otherwise-standard govuk-select. Likely a CSS/JS selector hook rather than a distinct component; carries no design intent beyond the standard govuk-!-width-one-half modifier already present.
- GOV.UK alternative: Standard GOV.UK Select with width utility only; drop the bespoke class or replace with data-* hook if JS binding is required.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 22

### about-the-consignment

#### button.link-button ("Add another country")

- What it does: A button styled to look like a link that adds another 'Transited country' select row within the Transit reveal, so a consignment can list multiple transited countries.
- Concern: Not a GOV.UK Design System component — a bespoke link-styled button plus client-side JS to clone the country select. The add/remove-item pattern is not in govuk-frontend.
- GOV.UK alternative: No direct component. Rebuild as a server-rendered repeatable-item pattern (add/remove) using standard govuk Select rows and a govuk-button--secondary 'Add another', or the GOV.UK 'add another' pattern from the design system community backlog.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 25 (class 'link-button', label 'Add another country')

#### date-input--picker, date-picker-day, date-picker-month, date-picker-year, date-input-day/month/year/hour/minute

- What it does: Custom classes hooking a JavaScript calendar date-picker enhancement onto the estimated-arrival date input, plus per-segment hook classes.
- Concern: The govuk-date-input is standard, but the '--picker' overlay is a bespoke IPAFFS JS widget layered on top — not part of govuk-frontend, and a known accessibility/overlay complication (per workspace memory, IPAFFS date-picker overlays intercept clicks).
- GOV.UK alternative: Use the plain GOV.UK Date input (three text fields) with no JS picker overlay; that is the Design System's recommended pattern for a known date.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 25 (non-govuk classes date-input--picker, date-picker-*)

#### class="purpose" and class="internal-market" wrapper divs

- What it does: Name-derived wrapper classes on the radio group containers (used as JS hooks for the conditional show/hide logic).
- Concern: Harmless custom hook classes, not visual styling; flagged only for completeness. They imply client-side JS drives the conditional reveals in addition to the govuk-radios--conditional behaviour.
- GOV.UK alternative: govuk-radios--conditional already handles conditional reveal natively; no bespoke hook needed.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 25 (non-govuk classes 'purpose', 'internal-market')

#### accessible-autocomplete exit-BCP variant (combobox 'BCP or Port of exit' / textbox 'Point of exit' + role=option suggestions)

- What it does: An alternative type-ahead control for choosing the exit border control post / point of exit — a combobox with a suggestion list rather than the plain govuk-select seen in the trace.
- Concern: Accessible-autocomplete is a common IPAFFS enhancement layered over a native select; it is not a core govuk-frontend component and adds JS + a11y surface. Not observed in the corpus trace (which rendered the plain select), so this is an inferred variant only.
- GOV.UK alternative: GOV.UK accessible-autocomplete component (progressive enhancement over a plain govuk-select) if a type-ahead is genuinely needed for the BCP list; otherwise keep the plain select.
- Evidence: AboutTheConsignmentPage.ts:54-56 (textbox 'Point of exit'), :82-84 (option suggestions), :86-92 (combobox 'BCP or Port of exit')

### health-certificate-required

#### Continue rendered as <a class="govuk-button"> (link, not <button>)

- What it does: The primary Continue action is an anchor styled as a GOV.UK button that performs a GET navigation to the notification overview / task-list hub, rather than a form-submitting button.
- Concern: Minor. This is a purely informational interstitial with no form to submit, so a link styled as a button is an acceptable GOV.UK pattern (the Design System permits button-styled links for navigation). No custom CSS involved.
- GOV.UK alternative: GOV.UK Button component used as a link (govuk-button on an <a>) — already the standard pattern; the new app can keep it as a button-link.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 29 (main.html). Corroborated (inferred) by the page object, which drives it via getByRole('link', { name: 'Continue' }): ~/git/defra/ipaffs/ipaffs-qa-automation/page-objects/notification/HealthCertificateRequiredPage.ts:6-8

### notification-hub

#### phase-tag (applied alongside govuk-tag govuk-tag--blue / govuk-tag--grey on the <strong> status element)

- What it does: IPAFFS-specific styling hook layered onto the standard GOV.UK Tag component used for task statuses. The visible tags are 'Started' (blue) and 'To do' (grey).
- Concern: Only non-govuk-* class on the entire page. It is a cosmetic override on top of the standard Tag, not a new widget. Suggests IPAFFS restyles the standard task-list status tag rather than using default colours/text.
- GOV.UK alternative: Standard GOV.UK Task list component ships its own status styling (Cannot start yet, Completed, etc.); the new app should use the vanilla govuk-task-list status without the phase-tag override.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 30 (tasklist.html: class="govuk-tag phase-tag govuk-tag--blue")

#### Section-group headings rendered as govuk-heading-m ABOVE each govuk-task-list, rather than the Task list component's own grouped heading slot

- What it does: Splits the tasks into 7 named groups (About the consignment, Description of the goods, Document, Traders, Transport, Contact, Complete notification), each an independent govuk-task-list.
- Concern: This is a valid GOV.UK pattern (task list with sections) but implemented as separate lists + manual h2s. Worth confirming the new app groups IUU tasks the same way — note the CHED-P grouping here mixes CHED-P-only concepts (Latest health certificate, Approved establishment of origin) that IUU may not need.
- GOV.UK alternative: GOV.UK Task list with sections (each section a heading + its own ul.govuk-task-list) — which is effectively what is used; no custom code needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 30

### commodity-extended-description

#### commodity-detail-form-desktop / commodity-detail-form-mobile + commodities-table-desktop / commodities-table-mobile + species-table-desktop / species-table-mobile + table-responsive + js-hidden

- What it does: The entire commodity form is rendered TWICE — a desktop variant and a mobile variant — with duplicate input names (e.g. two inputs named 03019230-1756325.net-weight, one id ...-desktop one id ...-mobile). One variant is hidden via js-hidden depending on viewport. This is a bespoke responsive-table strategy.
- Concern: Duplicated form controls with identical name attributes is fragile, doubles the DOM, and depends on client JS to hide one copy; a no-JS user could submit ambiguous data. The new app should render each field ONCE and rely on standard responsive CSS / the govuk Table's own responsive behaviour instead of duplicating the form.
- GOV.UK alternative: A single govuk Table with responsive styling, or restructure weights/packages capture as one govuk form per species (govuk-form-group per field) rather than an editable grid.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 33 — controls.txt shows -desktop and -mobile duplicate inputs; classes include commodity-detail-form-desktop/mobile, table-responsive, js-hidden. Corroborated by page-object CommodityExtendedDescriptionPage.ts:88-106 — the CHED-D locators (.commodity-detail-form-desktop input.net-weight, #gross-weight-desktop, save-and-continue-desktop) confirm the desktop/mobile dual-form is a shared pattern, not a one-off.

#### link-button

- What it does: "Add commodity" and "Add species" are <button> elements styled with a custom link-button class (rendered to look like text links, not govuk buttons).
- Concern: A custom class instead of either a real govuk Button or a real link blurs the semantic/visual contract. In the rebuild these are add-another actions.
- GOV.UK alternative: govuk Button (govuk-button--secondary) for the action, or the GOV.UK 'Add another' pattern if the new app keeps an editable list of species/commodities.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 33 — structure.txt BUTTON.link-button 'Add species' / 'Add commodity'. Page-object CommodityExtendedDescriptionPage.ts:34 (btnAddCommodity, role=button name 'Add commodity').

#### species-table-cheda, commodity-overview, subtotal, subheader, net-weight, number-of-packages, type-of-package, remove, species, border-bottom-none

- What it does: IPAFFS-specific styling/behaviour hooks bolted onto govuk-table cells and controls (subtotal row, per-column widths, remove-row action, CHED-A-shared table class 'species-table-cheda').
- Concern: These are app-specific CSS/JS hooks, not Design System classes. The 'species-table-cheda' name shows the table markup is shared across CHED types — the new standalone IUU app should model its own weights/packages capture cleanly rather than inheriting the shared editable-grid widget.
- GOV.UK alternative: govuk Table for read-only display; standard govuk-form-group fields for the editable net weight / number of packages / package type; a separate 'remove' link per row (GOV.UK add-another pattern).
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 33 — nonstd.txt. Corroborated: the single shared page-object CommodityExtendedDescriptionPage.ts exposes controls for CHED-A (inputNumberOfAnimals :14), CHED-P/IUU (inputNetWeight :6, inputNumberOfPackages :10), CHED-PP (inputNetWeightinKgs :47, inputQuantity :59, dropdownQuantityType :63, dropdownControlledAtmosphereContainer :67, dropdownIntendedUse :71, checkboxTestAndTrial :75) and CHED-D (:88-106) — one template drives all four CHED types.

#### Keyboard submit (button.js-hidden)

- What it does: A visually/js-hidden helper submit button included so pressing Enter in a text field submits the intended form.
- Concern: A workaround for the multi-form / editable-grid layout. Not needed with a conventional single-form GOV.UK page.
- GOV.UK alternative: Standard single <form> with one primary govuk Button — native Enter-to-submit needs no helper.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 33 — structure.txt BUTTON.js-hidden 'Keyboard submit'

### commodity-additional-details

#### class="temperature" on the govuk-form-group div

- What it does: Bespoke IPAFFS hook class on the form-group wrapping the temperature radios; likely a JS/CSS selector hook, no visual role observed
- Concern: Non-Design-System class but purely additive — carries no styling or behaviour visible in the trace. The new app does not need it.
- GOV.UK alternative: None required — drop the bespoke class; use the standard govuk-form-group as-is
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 36 (.temperature resolves to DIV.govuk-form-group temperature)

#### back-link--next-to-breadcrumbs modifier on govuk-back-link, with href="#"

- What it does: IPAFFS-specific positioning modifier on the standard Back link; the href='#' plus id=back-link implies JS-driven history navigation rather than a real server route
- Concern: Non-standard modifier class and a JS-dependent back link (href='#'). The Design System Back link should point to the actual previous page URL and work without JavaScript.
- GOV.UK alternative: GOV.UK Back link component with a real href to the previous page
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 36 (<a href="#" id="back-link" class="govuk-back-link back-link--next-to-breadcrumbs">Back</a>)

### catch-certificate-needed

#### Two <h1> elements on one page: "Catch certificates" (govuk-heading-xl) and "Do you need to add catch certificates?" (govuk-heading-l), the second sitting outside the form above the fieldset

- What it does: The page carries an introductory H1 ("Catch certificates") with explanatory copy and a Details disclosure, then a SECOND H1 that is the actual radios question. That second H1 is rendered as a plain sibling immediately before the <form> — it is NOT inside the fieldset legend, and the fieldset legend is left empty.
- Concern: Two problems compound here: (a) GOV.UK guidance is one H1 per page, and this is an intro-plus-question hybrid; (b) the fieldset legend is empty, so the radio group has no programmatic accessible name — the H1 is not associated with the group. This is worse than the recommended legend-as-H1 pattern.
- GOV.UK alternative: Question page pattern: single H1 rendered INSIDE the fieldset legend (govuk-fieldset__legend--l), with intro copy as govuk-body paragraphs and the disclosure as a Details component beneath. Do not leave the legend empty; do not carry two H1s forward.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 38 (main outerHTML: <h1 class="govuk-heading-l govuk-!-margin-bottom-4"> precedes <form>; <legend class="govuk-fieldset__legend "> contains only whitespace)

#### link-hover-highlight, link-no-underline

- What it does: Custom link-styling classes applied to the external guidance link and the Details summary text (non-govuk hover/underline behaviour).
- Concern: Bespoke link styling outside the Design System link component; introduces custom CSS the new app should avoid.
- GOV.UK alternative: Use the standard govuk-link component and its default styling; do not override underline/hover.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 38 (classes 'link-no-underline link-hover-highlight' on the guidance <a> and on the govuk-details__summary-text span)

### attach-catch-certificate

#### <div data-module="dropzone" class="multi-file-upload__dropzone"> wrapping the govuk-file-upload input, with a <label class="govuk-button govuk-button--secondary" for="fileUpload">Choose files</label> and a 'Drag and drop files here or' prompt

- What it does: A bespoke client-side JavaScript enhancement (data-module="dropzone") that turns the standard multiple-file <input type=file> into a drag-and-drop zone. Files can be dropped onto the region or chosen via the button; selected files are rendered into an adjacent uploaded-files-list container.
- Concern: Not part of the GOV.UK Design System. It is a custom widget bound by an IPAFFS 'dropzone' JS module; drag-and-drop is a progressive enhancement not offered by the core govuk-file-upload. The look-and-feel resembles the MOJ Frontend 'Multi file upload' component but the class prefix (multi-file-upload__*, no moj- prefix) indicates a hand-rolled IPAFFS implementation rather than the packaged MOJ component. Behaviour (drag/drop, multi-file, JS-rendered file list, async/AJAX upload) must be deliberately reimplemented in the new app rather than assumed from govuk-frontend.
- GOV.UK alternative: GOV.UK Design System 'File upload' component (govuk-file-upload) with the multiple attribute covers plain multi-file selection. If drag-and-drop + a client-rendered file list is a requirement, the MOJ Frontend 'Multi file upload' component is the closest supported pattern; otherwise a simple repeated govuk-file-upload / add-another pattern.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 40 (dropzone form-group outerHTML)

#### <div class="uploaded-files-list"></div>

- What it does: Empty container that the dropzone JS module populates client-side with the list of files the user has added/uploaded (name, size, remove control). Rendered empty in the trace because the snapshot is captured at the moment files are set, before the JS list renders.
- Concern: Client-rendered, non-standard markup with no GOV.UK class. Implies the upload list (with per-file remove/delete and likely async upload + virus-scan status) is built in bespoke JS, not server-rendered. The new app needs an explicit design for showing added files and removing them.
- GOV.UK alternative: GOV.UK 'Summary list' (govuk-summary-list) or a table with per-row 'Remove' actions to list uploaded files server-side; or the MOJ Multi file upload component's built-in file list if that component is adopted.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 40 (uploaded-files-list is empty <div>)

### manage-catch-certificates

#### .attachment-block

- What it does: Bespoke card container that renders one uploaded catch certificate: 'Attachment N of M' caption, filename link (opens in new tab), 'Reference:' value, a two-column row of 'Flag state' and 'N species added', and 'View or amend details' / 'Remove' action links.
- Concern: Custom IPAFFS widget, not a Design System component. Repeats per uploaded certificate. The new app should render each certificate with a standard component rather than a bespoke div.
- GOV.UK alternative: Summary card (govuk-summary-card) with a Summary list and card actions, or a Summary list per certificate. A Task list is a weaker fit since these are completed items with edit/remove actions.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 51 (.attachment-block outerHTML)

#### link-no-underline, link-hover-highlight

- What it does: Custom link styling on the attachment filename link — removes the default underline and adds a hover highlight instead.
- Concern: Overrides the standard govuk-link appearance (underlined by default). Deviates from GOV.UK link accessibility guidance.
- GOV.UK alternative: Use a plain govuk-link (keep the default underline). No custom CSS needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 51 (.attachment-block outerHTML)

#### Two <h1> elements on one page

- What it does: The page has both a govuk-heading-xl H1 ('Manage catch certificates') AND a fieldset legend rendered as an H1 via govuk-fieldset__heading ('Do you need to upload more catch certificates?').
- Concern: Two H1s on a single page is an accessibility anti-pattern. It arises from combining a page-title H1 with the standard 'legend as page heading' radios pattern (which also emits an H1). The list part and the question part are effectively two pages fused into one.
- GOV.UK alternative: Split into a list page (H1 = 'Manage catch certificates') and a separate question page, OR demote the legend to a normal fieldset legend (not an H1) so there is a single page H1.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 51 (a11y tree shows two level=1 headings)

#### <h2 class="govuk-heading-s govuk-!-display-inline">Reference: </h2> followed by an inline value span

- What it does: Uses a heading element as an inline label prefix ('Reference:') sitting on the same line as the certificate reference value.
- Concern: A heading is being used for inline labelling, not document structure — semantically incorrect and confuses the heading outline.
- GOV.UK alternative: Represent the reference as a row in a Summary list (key 'Reference', value 'CatchCertificateRef-...'), not a heading.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 51 (.attachment-block outerHTML)

#### Two govuk-button elements with no govuk-button--secondary

- What it does: 'Save and return to hub' and 'Save and continue' render as two equally-weighted primary buttons side by side.
- Concern: GOV.UK guidance is one primary action per page; a secondary/lower-priority action should use govuk-button--secondary or be a link. Two primary buttons compete for attention.
- GOV.UK alternative: Make 'Save and continue' the single primary button and demote 'Save and return to hub' to govuk-button--secondary or a link.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 51

### add-catch-certificate-details

#### autocomplete__input, autocomplete__wrapper, autocomplete__menu, autocomplete__status, autocomplete__input--default

- What it does: accessible-autocomplete (alphagov) progressively enhances the flag-state <select> into a type-ahead combobox with a listbox of matching countries; a visually-hidden aria-live status region announces result counts.
- Concern: Third-party JS library, not a core GOV.UK Design System component (it is an official alphagov add-on, but still an extra dependency and client-JS dependency). The underlying <select id='flag-state-1-select', name='flag-state-1'> remains as the no-JS fallback.
- GOV.UK alternative: Keep as-is: accessible-autocomplete is the GDS-endorsed pattern for long country lists (250 options). The new app can source the country list from a reference-data service and enhance a plain govuk Select. A plain Select is the graceful-degradation baseline.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 47 (combobox id=flag-state-1, controls47/classes47)

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__date-table, date-picker__button__previous-month, date-picker__button__next-month, date-picker__button__close, date-picker__reveal__icon, date-input--picker, short-date-input, date-input-day/month/year, date-picker-day/month/year

- What it does: A bespoke DEFRA calendar datepicker overlay bolted onto the govuk-date-input. Adds a 'Choose date' reveal icon that opens a month-grid dialog (Previous month / July 2026 heading / Next month / SuMoTuWeThFrSa table / Cancel).
- Concern: Custom widget with its own class namespace, not a GOV.UK Design System component. Client-JS dependency; introduces a calendar-dialog interaction the Design System deliberately omits (GDS guidance is a plain three-box date input for known dates like an issue date).
- GOV.UK alternative: GOV.UK Date input (three text boxes, Day/Month/Year) with no calendar — the base govuk-date-input is already present underneath. The new app should drop the datepicker overlay and use the plain Date input.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 47 (classes47, structure47)

#### catch-certificate-details-table, catch-certificate-details__table-header, catch-certificate-details__grid-row, catch-certificate-details__grid-column-15/20/50/60/one-third/two-thirds, catch-certificate-details__grid-row-border-bottom, catch-certificate-details__grid-row-no-padding, catch-certificate-details__add-document

- What it does: A bespoke IPAFFS grid/table layout used to render the species-selection rows (checkbox | commodity code | species) with fixed-percentage column widths and border-bottom row separators, rather than a semantic table or the govuk grid.
- Concern: Custom CSS grid classes outside the Design System; percentage-width columns and hand-rolled row borders duplicate what GOV.UK Table or the govuk-grid system already provide. Not responsive in the standard GDS way.
- GOV.UK alternative: GOV.UK Table for the commodity-code/species columns, or the govuk-grid-row/govuk-grid-column-* system, with govuk-checkboxes for the row selectors.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 47 (nonstd47)

#### link-button, link-hover-highlight, link-no-underline

- What it does: <button> elements styled to look like links — used for the two footer-level actions 'Save and return to manage catch certificates' and 'Save and return to hub'.
- Concern: Buttons dressed as links is a non-standard pattern; GDS uses either a real govuk-button or a genuine link. Mixing submit semantics with link appearance can confuse users and assistive tech.
- GOV.UK alternative: GOV.UK Button with the govuk-button--secondary modifier, or a real link if the action navigates without submitting.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 47 (structure47)

#### sr-only, aria-live-message

- What it does: Screen-reader-only live-region paragraph used to announce dynamic state (alongside the autocomplete/datepicker).
- Concern: Not a govuk-* class; govuk-visually-hidden is the Design System equivalent and is also present on the page, so there are two parallel visually-hidden conventions in use.
- GOV.UK alternative: govuk-visually-hidden for hidden labels; a standard aria-live region for announcements.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 47 (nonstd47)

### latest-health-certificate

#### additional-documents-table / additional-documents__grid-row / additional-documents__grid-column-15 / __grid-column-35 / __grid-column-doc-date / additional-documents__headers / additional-documents__table-header / additional-documents__caption

- What it does: A bespoke CSS-grid 'table' laying out the document row into four columns (Document type | Document reference | Date of issue | Attachments) with a header row. On this page it holds a SINGLE fixed row for the veterinary health certificate.
- Concern: Not a GOV.UK Design System component — it is a hand-rolled grid masquerading as a table, with custom column-width classes (15/35/doc-date). Reused across the supporting/additional-documents pages. The header/hint markup (Day Month Year spans) is bespoke rather than govuk date-input hints.
- GOV.UK alternative: For a single fixed-type document the row could be a plain set of govuk form fields (govuk-input + govuk-date-input) under headings, or the Summary list / Table component if a genuine multi-row list is needed. The new IUU app should model 'the health certificate' as one document object with reference + issue date + attachment, not as a generic editable table.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 68 (main.html)

#### defra-datepicker / date-picker__container / date-picker__dialog / date-picker__reveal__icon / date-picker__date-table / date-input--picker / date-picker-day|month|year / data-module="accessible-datepicker"

- What it does: A custom JavaScript accessible date picker (calendar dialog with previous/next month, choose-date button, close/Cancel) layered on top of the govuk-date-input Day/Month/Year fields.
- Concern: Third-party / bespoke widget, not part of govuk-frontend. Adds a modal calendar dialog, an SVG calendar icon (uses #calendar sprite), aria-live regions and sr-only utility classes. Progressive-enhancement JS dependency; behaviour and a11y are IPAFFS-specific.
- GOV.UK alternative: GOV.UK guidance for a known date is the plain Date input component (three text fields) with no calendar widget. The new app can drop the picker and keep the standard govuk-date-input.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 68 (main.html)

#### button.link-button.no-wrap (id=add-attachment-latest-health-cert)

- What it does: A submit button styled to look like a link, used as the 'Add attachment' action inside the Attachments column. Submits the form with name=add-attachment-latest-health-cert value=latest-vet-health to route to the file-upload sub-page.
- Concern: Custom 'link-button' styling is not a Design System class; a link-styled submit button mixes button and link affordances. 'no-wrap' is a bespoke utility to keep the label on one line.
- GOV.UK alternative: GOV.UK Button (optionally govuk-button--secondary) for an action that submits, or a proper button-as-link only via the documented pattern. In the new app, adding the attachment is a form submit and should use a govuk-button.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 68 (main.html)

#### latest-health-certificate-text__input / latest-health-certificate-date__input / latest-health-certificate__date-picker / latest-health-certificate__add-document-attachment

- What it does: Page-specific styling hooks appended to the govuk-input / date-input / attachment elements.
- Concern: Bespoke per-page class overrides sitting alongside govuk-* classes — styling divergence from the toolbox. Low risk individually but signals custom CSS.
- GOV.UK alternative: Rely on govuk-input / govuk-date-input defaults and govuk spacing utilities instead of page-specific override classes.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 68 (main.html)

#### sr-only / aria-live-message

- What it does: Screen-reader-only utility classes used by the custom datepicker (Choose date label, live-region announcements).
- Concern: Non-govuk visually-hidden utility (GOV.UK uses govuk-visually-hidden); introduced by the bespoke datepicker rather than the app itself.
- GOV.UK alternative: govuk-visually-hidden — becomes moot if the custom datepicker is removed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 68 (main.html)

### document-upload

#### <div data-module="dropzone"> wrapping the govuk-file-upload input

- What it does: IPAFFS wraps the standard GOV.UK file input in a JS module (data-module="dropzone") that layers a drag-and-drop dropzone enhancement over the native file picker.
- Concern: The dropzone is a bespoke IPAFFS client-side widget, not part of the GOV.UK Design System. It has no CSS classes of its own (only the data-module hook), so it is invisible to a class inventory but is progressive-enhancement JS the new app would have to reimplement or drop.
- GOV.UK alternative: The plain GOV.UK File upload component (govuk-file-upload). GOV.UK now offers a JS-enhanced File upload with a built-in drop zone, so drag-and-drop can be achieved inside the toolbox without a bespoke module.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 71 (main.html: div data-module="dropzone")

### accompanying-documents

#### additional-documents-table, additional-documents__headers, additional-documents__table-header, additional-documents__grid-row, additional-documents__grid-column-15, additional-documents__grid-column-35, additional-documents__grid-column-doc-date

- What it does: A bespoke repeating-row grid that lays out each accompanying-document row as columns: Document type | Document reference | Date of issue | Attachments. Column headers are rendered as a custom header row, not a govuk table header.
- Concern: Hand-rolled table/grid layout with fixed-width column classes (15/35) instead of govuk-table or the GOV.UK 'Add another' pattern. The add-another repetition (Add a document / Add multiple documents) is entirely custom.
- GOV.UK alternative: govuk-table for display, and the GOV.UK 'Add another' component pattern (repeated fieldset per document) for the multi-row add flow — the new app can express each document as a single sub-form rather than an editable grid.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 76 (class inventory)

#### defra-datepicker, date-picker__container, date-picker__reveal__icon, date-picker__dialog, date-picker__date-table, date-picker__button__previous-month, date-picker__button__next-month, date-picker__button__close, date-picker__heading, date-input--picker, date-picker-day/month/year, short-date-input

- What it does: A bespoke JavaScript calendar date picker layered over the standard three govuk-date-input fields. Provides a 'Choose date' reveal button that opens a month-grid dialog ('July 2026', Previous/Next month, Cancel).
- Concern: Custom widget outside the Design System — the GOV.UK Design System deliberately has NO date-picker component and recommends three plain text inputs. This adds a maintenance/accessibility burden the rebuild should not inherit.
- GOV.UK alternative: Plain govuk-date-input (three text fields Day/Month/Year) with no calendar overlay — drop the defra-datepicker entirely.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 76 (class inventory + structure outline showing Previous month / July 2026 / Next month / Cancel)

#### link-button, no-wrap

- What it does: Buttons styled to look like links for the row-level 'Add attachment', 'Add a document' and 'Add multiple documents' actions.
- Concern: Non-standard button styling; GOV.UK provides govuk-button--secondary or a proper link, not a 'link-button' hybrid. Note the page object drives 'Add attachment' via role=button, so it is a real <button> despite the link styling.
- GOV.UK alternative: govuk-button (secondary) or a genuine govuk-link within the add-another pattern.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 76 (structure outline); page-objects/notification/AccompanyingDocumentsPage.ts:39-41 (btnAddAttachment = getByRole('button', { name: 'Add attachment' }))

#### aria-live-message, sr-only

- What it does: A visually hidden ARIA live region announcing dynamic changes (rows added/removed) to assistive tech.
- Concern: Uses 'sr-only' rather than 'govuk-visually-hidden'; the mechanism is fine but the class is non-standard. Confirms the page mutates the DOM client-side (add/remove rows).
- GOV.UK alternative: govuk-visually-hidden for the class; the live-region behaviour is legitimate.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 76 (class inventory)

#### margin-top-5, govuk-clearfix (custom spacing)

- What it does: Ad-hoc spacing utility class (margin-top-5) alongside layout helpers.
- Concern: Bespoke margin utility instead of the govuk spacing overrides (govuk-!-margin-top-5).
- GOV.UK alternative: govuk-!-margin-top-5 spacing override.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 76 (class inventory)

#### Attachment upload sub-page (DocumentUpload) — separate route reached from 'Add attachment'

- What it does: 'Add attachment' navigates away to a separate document-upload page with a raw file input (input[type="file"]) and a 'Next' / 'Continue' button, then returns to the accompanying-documents grid with the attachment linked. This is NOT an inline file input on the accompanying-documents page.
- Concern: Multi-page attach flow with its own navigation; the rebuild can use the GOV.UK file-upload component inline within an 'Add another' sub-form rather than a separate hand-rolled page with 'Next'/'Continue' variants.
- GOV.UK alternative: govuk-file-upload within the add-another sub-form; single 'Continue' verb (the legacy page inconsistently uses both 'Next' and 'Continue', hence the page object's btnNextOrContinue regex).
- Evidence: page-objects/notification/DocumentUploadPage.ts:6-24 (btnNext / btnContinue / inputFile input[type=file]); workflows/notification/ched-p-workflows.ts:346-350 (Add attachment -> documentUpload.inputFile.setInputFiles -> btnContinue)

### approved-establishment-of-origin

#### button.link-button (id=document-add-establishment, name=add-establishment, value=add, type=submit)

- What it does: A form submit button visually styled as a hyperlink, labelled 'Search for an approved establishment'. Submits the form which navigates to the veterinary-establishments search page (observed nav to .../veterinary-establishments?establishment-country-code=AF).
- Concern: IPAFFS-specific 'link-button' class — a <button> restyled to look like an anchor. Not a Design System component; couples visual link appearance to a submit control.
- GOV.UK alternative: GOV.UK Button with the govuk-button--secondary modifier for a secondary/add action, or a genuine link if no form submission is required.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 80; corroborated by page object ApprovedEstablishmentOfOriginPage.ts:6-8 which drives this control by accessible name 'Search for an approved'

#### table-responsive (wrapper class on/around the govuk-table)

- What it does: Custom responsive-table wrapper class for horizontal overflow handling on narrow viewports.
- Concern: Non-govuk class; the Design System table has no built-in responsive wrapper, so IPAFFS added its own.
- GOV.UK alternative: GOV.UK Table (govuk-table) with a scrollable container, or the newer responsive-table pattern; no direct one-to-one component.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 80

#### Cancel action rendered as <a class=govuk-link> inside a <p class=govuk-body>, sibling to the submit <button>s

- What it does: 'Cancel and return to hub' navigation styled as a body-text link rather than a button.
- Concern: Mixing a navigational link with primary submit buttons in the same action row is an IPAFFS layout convention, not a standard button-group pattern.
- GOV.UK alternative: GOV.UK Button group (govuk-button-group) pairing a primary button with a 'secondary' link, e.g. 'Cancel'.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 80

### search-for-approved-establishment

#### link-button

- What it does: Each result row's 'Select' control is a <button type=submit name=add-id value={GUID} class=link-button> styled to look like a link, inside a per-row form; clicking submits the chosen establishment GUID and navigates to the establishment-of-origin page.
- Concern: Bespoke 'button styled as link' class, not a Design System component. Functionally it is a per-row submit that carries the selected establishment id. The rebuild should model this as a normal choice action (radio + continue, or a govuk-button per row) rather than a custom link-button.
- GOV.UK alternative: govuk-button (or a Radios list of results with a single Continue button)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 83 (buttons.txt; action 83 log shows button name=add-id id=select-establishment-1 value=11b4e363-...)

#### search-panel

- What it does: Wrapper class around the filter criteria panel.
- Concern: Custom container styling, not a Design System component. Purely presentational; a govuk-grid-row/column layout can achieve the same.
- GOV.UK alternative: govuk-grid-row + govuk-grid-column-* / govuk-form-group
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 83 (nonstd.txt)

#### table-responsive / establishments-search-results / establishments-search-results-form-desktop / establishments-search-results-form-mobile / establishments-table-mobile

- What it does: IPAFFS renders the results twice — a desktop govuk-table and a separate mobile card layout (paragraph-per-field) — toggled by CSS breakpoints. This is why 20 'Select' buttons exist for 10 visible rows (two forms of select-establishment-1..10).
- Concern: Bespoke dual-render responsive table pattern with duplicated markup and duplicated submit buttons. Adds DOM weight and a11y duplication. The Design System responsive-table pattern (single table with data-labels) covers this without duplicate rendering.
- GOV.UK alternative: govuk-table with the GOV.UK responsive-table (stacking) pattern
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 83 (verified: 20 buttons with accessible name 'Select' in the before snapshot; controls.txt shows two identical add-id button sets select-establishment-1..10 — desktop form + mobile form)

#### pagination / pagination-list / pagination-item / pagination-item-next / pagination-link / pagination-link-icon / pagination-link-label / pagination-link-title

- What it does: Custom pagination widget rendering 'Next page : 2 of 5' with an icon, linking to ?establishment-country-code=AF&page=2.
- Concern: Bespoke pagination markup, not the Design System Pagination component (govuk-pagination). Predates or ignores the standard component.
- GOV.UK alternative: govuk-pagination (Pagination component)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 83 (nonstd.txt; a11y snapshot navigation 'Pagination' e196)

#### no-wrap

- What it does: Prevents text wrapping (likely on the Select column / approval number cells).
- Concern: Utility class outside the govuk-* namespace; low-risk but should use govuk-!-* utilities or table styling.
- GOV.UK alternative: govuk table cell styling / govuk-!-* width utilities
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 83 (nonstd.txt)

### traders-addresses

#### button.link-button.button-margin-right (id=populate-importer name=populate_importer value=importer; id=populate-place-of-destination name=populate_place_of_destination value=place-of-destination)

- What it does: A real form submit <button> styled to look like a text link, labelled "Same as consignee". Clicking POSTs to /traders and copies the consignee address into the importer / place-of-destination role. Appears only once a consignee has been added. Both roles carry their own 'Same as consignee' button and both are populated this way in the standard happy-path flow (workflows/notification/ched-p-workflows.ts:414-416 clicks #populate-importer first, then the role-named 'Same as consignee' button which — now that the importer button is consumed — uniquely resolves to the place-of-destination one).
- Concern: govuk-frontend has no "link styled as button" component; this is bespoke CSS (link-button). It is a state-changing POST, so presenting it as a link is misleading for keyboard/AT users and outside the toolbox. Two buttons share the identical accessible name "Same as consignee" (disambiguated only by id), which is itself an accessibility smell.
- GOV.UK alternative: govuk-button with the govuk-button--secondary modifier (a secondary Button), keeping it as a form submit, with a distinct accessible name per role (e.g. "Importer same as consignee"). The new app should model "same as consignee" as an explicit secondary button or a radio-driven copy choice.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 111 (button inventory); corroborated by page-objects/notification/TradersAddressesPage.ts:14-16,26-32 and workflows/notification/ched-p-workflows.ts:414-416

#### table.trader-table.table-responsive with th/td classes col-name, col-address, col-country, col-edit, text-align-right

- What it does: Custom layout/responsive styling layered on top of govuk-table to lay out the Name / Address / Country / Change columns and right-align the Change link.
- Concern: Bespoke responsive-table and column-width classes are outside govuk-frontend. Note: 'table-responsive' is a wrapping <div> around the table, not a class on the <table> itself (the table carries govuk-table govuk-!-margin-bottom-2 trader-table). The whole table also has a govuk-visually-hidden <caption>Addresses</caption>, and the Change-column header is a govuk-visually-hidden <span>Change link</span> — i.e. screen-reader-only, NOT a visible column header (it only appears in innerText because govuk-visually-hidden clips rather than display:none).
- GOV.UK alternative: GOV.UK Summary list (govuk-summary-list) with an actions column is the idiomatic pattern for showing a captured entity with a Change action, and removes the need for custom table CSS. Alternatively a plain govuk-table with responsive utilities.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 98/111 (class inventory: col-address, col-country, col-edit, col-name, table-responsive, text-align-right, trader-table)

### search-existing-consignor

#### link-button

- What it does: The per-row 'View' and 'Select' actions are rendered as <button class="link-button"> — real submit buttons styled to look like links, each posting the chosen trader id back to the server.
- Concern: Not a GOV.UK Design System class. Buttons-styled-as-links is a bespoke IPAFFS pattern; behaviour (a POST that mutates the draft notification) is a button, but the visual is a link, which muddies the affordance.
- GOV.UK alternative: Either a govuk-button--secondary per row, or standard govuk-link anchors inside the table cells if the action can be a GET. The new app should pick one honest affordance per action.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 86 (before) — the DOM contains 8x BUTTON.link-button: View/Select per row for 2 rows, duplicated across the desktop table and the mobile stacked-card layout (4 per layout)

#### traders-search-results / traders-search-results-form-desktop / traders-search-results-form-mobile / transporter-table-mobile / table-responsive

- What it does: A bespoke responsive-table widget. It renders the results twice — a desktop <table> (traders-search-results-form-desktop) AND a mobile stacked-card view (traders-search-results-form-mobile / transporter-table-mobile) where each result becomes a series of H3.govuk-label--s + P pairs (Name / Address / Country). CSS shows/hides one or the other by viewport.
- Concern: Not a Design System component. It duplicates the results markup for two layouts, is IPAFFS-specific, and re-uses a 'transporter-table-mobile' class here on a traders table (copy-paste smell). It also introduces H3 headings inside table data purely for the mobile card layout.
- GOV.UK alternative: GOV.UK Table is already responsive-friendly with sensible column widths; if card-stacking on mobile is genuinely needed the new app can use a single responsive table or the community 'responsive table' pattern rather than emitting two parallel DOM trees.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 86 (before) — classes.txt

#### search-panel / name-address-and-country / economic-operator-name / economic-operator-address

- What it does: Custom container/layout classes wrapping the search fieldset and the results cells.
- Concern: IPAFFS-specific styling hooks, not Design System utilities. Cosmetic but each is a bespoke CSS dependency the rebuild would otherwise inherit.
- GOV.UK alternative: govuk-grid-row / govuk-grid-column-* and govuk-!-* spacing utilities cover the layout without bespoke class names.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 86 (before) — classes.txt

#### form-group (bare, not govuk-form-group)

- What it does: A non-namespaced 'form-group' class appears alongside the standard 'govuk-form-group'.
- Concern: Bare 'form-group' collides conceptually with Bootstrap-style naming and is not a GOV.UK class; likely legacy markup.
- GOV.UK alternative: govuk-form-group (already present) is the standard wrapper.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 86 (before) — classes.txt

### consignor-creation

#### none

- What it does: Every class under main is govuk-* (govuk-heading-xl, govuk-body, govuk-link, govuk-form-group, govuk-label, govuk-label--m, govuk-input, govuk-!-width-one-half, govuk-fieldset, govuk-fieldset__legend, govuk-fieldset__legend--m, govuk-select, govuk-button, govuk-grid-row, govuk-grid-column-full).
- Concern: No non-standard markup on this page — it is 100% inside the GOV.UK Design System toolbox. Directly rebuildable with govuk-frontend components; the country <select> should source its list from a reference-data service rather than hardcoding.
- GOV.UK alternative: n/a
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 91 (structure eval — every listed class is govuk-*)

#### consignor / consignee creation render an identical, consignee-labelled form

- What it does: The consignor/exporter creation flow (Add a consignor or exporter -> Create a new consignor or exporter, driven by ConsignorCreationPage.ts) renders a form whose H1 is "Add consignee", whose name label is "Consignee name", whose inputs carry title="consignee", and which posts to (and carries a returnUrl of) .../traders/consignee/new?reimport=true. The consignee creation flow renders the same form. The two trader types are NOT distinguished by any visible copy on this page in this trace.
- Concern: Legacy IPAFFS reuses/mislabels the address-creation template so the consignor page is titled and labelled 'consignee'. The new IUU service MUST label the consignor/exporter page correctly (heading and name label should name the actual trader role being added) rather than copying this shared-template behaviour.
- GOV.UK alternative: Distinct, correctly-labelled page headings and field labels per trader role (still standard govuk-heading-xl / govuk-label components).
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d actions 85-96 (consignor flow) — runtime action logs 87 and 91 show target inputs with title="consignee"; snapshot 87/91 form action + hidden returnUrl = .../traders/consignee/new?reimport=true; frozen values at action 91 (name=Linus George Ltd, address-line-1=101 Main St) differ from the empty consignee form at action 100, proving no snapshot bleed.

### consignor-confirmation

#### (none)

- What it does: The main content region is 100% govuk-* classes — a govuk Panel (confirmation) plus a form containing a govuk Button and a govuk Link. Full main class inventory: govuk-!-display-block, govuk-!-font-size-19, govuk-!-margin-bottom-2, govuk-!-margin-bottom-8, govuk-button, govuk-grid-column-two-thirds, govuk-grid-row, govuk-link, govuk-panel, govuk-panel--confirmation, govuk-panel__title.
- Concern: No concern — this page is fully inside the GOV.UK Design System toolbox and can be rebuilt verbatim with govukPanel + govukButton + a govuk link. Only quirk worth flagging: the primary action is a form-POST submit button (not a link), and the secondary 'Return to search' link is inside the same <form>; the confirm page is a distinct interstitial whose only purpose is the 'Add to notification' commit step.
- GOV.UK alternative: govukPanel (confirmation), govukButton, govuk-link
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, resource 017ca62de205c25ba4607d5bffe02d2e452bf2f8.html — the consignor confirm DOM is entirely govuk-* classes; no non-govuk class present.

### search-existing-consignee

#### button.link-button (View / Select buttons in each results row)

- What it does: Per-result-row action buttons styled to look like links; 'View' opens the trader detail, 'Select' picks that existing consignee for the notification.
- Concern: Buttons visually restyled as links — not a standard Design System pattern. Each row is its own mini-form (multiple crumb/etag hidden inputs observed), so View/Select are POST submits, not links.
- GOV.UK alternative: GOV.UK Table with an actions column using govuk-link (for View) and a govuk-button or govuk-button--secondary (for Select), or a plain link column.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 99 (structure eval — repeated BUTTON.link-button View/Select)

#### custom pagination widget — classes pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: Bespoke pagination control rendering 'Next page : 2 of 4000' with an icon and label.
- Concern: Entirely custom, not the GOV.UK Pagination component. Note '4000' pages of results implies an unfiltered/very large address book — the search must actually narrow results.
- GOV.UK alternative: GOV.UK Pagination component (govuk-pagination).
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 99 (non-govuk class inventory + before snapshot Pagination nav)

#### table-responsive / transporter-table-mobile / traders-search-results-form-desktop / traders-search-results-form-mobile

- What it does: Dual rendering of the same results — a desktop table and a mobile stacked-card layout (H3 Name/Address/Country per card) toggled by CSS, each wrapped in its own form.
- Concern: Bespoke responsive-table implementation with duplicated desktop/mobile markup and duplicate forms. Adds markup weight and two code paths for one dataset.
- GOV.UK alternative: A single GOV.UK Table (which is responsive by default) or the responsive-table pattern from the Design System, rendered once.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 99 (non-govuk class inventory)

#### search-panel / name-address-and-country / economic-operator-name / economic-operator-address / form-group

- What it does: IPAFFS-specific wrapper/id classes around the search panel and per-column result content.
- Concern: App-specific hooks for styling/JS; harmless but not portable. The 'economic-operator' naming reveals the internal domain term for consignee (economic operator).
- GOV.UK alternative: Standard govuk-form-group / govuk-grid-* wrappers; no bespoke classes needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 99 (non-govuk class inventory)

### consignee-confirmation

#### Legacy reference-number caption (span.heading-tertiary)

- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 110 (ancestor chain: SPAN.heading-tertiary < DIV.govuk-!-padding-top-6 < DIV.govuk-width-container app-width-container--wide < BODY)

### transport-details

#### autocomplete__wrapper, autocomplete__input, autocomplete__menu, autocomplete__option, autocomplete__status (with visible input#bcp layered over hidden select#bcp-select)

- What it does: accessible-autocomplete (alphagov) enhances the Port of entry <select> into a type-ahead combobox — the trace shows the user typing 'TILBURY (GBTIL)' and picking an option.
- Concern: Third-party JS widget outside the core govuk-frontend component set; degrades to a plain select without JS. Adds ARIA live-region status nodes (aria-live-message).
- GOV.UK alternative: govuk-frontend has no autocomplete, but accessible-autocomplete is the DfE/GDS-endorsed companion. The new app can keep it for the BCP list (reference data), or fall back to a plain Select for a small list.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory)

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__reveal__icon, date-picker__button__previous-month/next-month/close, date-picker__date-table, date-picker__heading

- What it does: A bespoke DEFRA calendar date-picker overlaying the govuk-date-input, revealed by a 'Choose date' icon button; shows a month grid ('July 2026') with previous/next-month and cancel controls.
- Concern: Fully custom widget — not part of govuk-frontend. Significant bespoke JS/CSS and its own accessibility surface. This is the classic IPAFFS date-picker overlay.
- GOV.UK alternative: GOV.UK Design System recommends a plain govuk-date-input (three text fields, no calendar) for known dates. The new app should default to the bare date-input and drop the calendar overlay unless there is a proven user need.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory + structure outline: 'Choose date', 'Previous month', 'July 2026', 'Next month', 'Cancel')

#### containers-grid

- What it does: Custom layout class wrapping the revealed container/trailer number + seal number + official seal fields (a repeatable row set with 'Add another container or trailer').
- Concern: Bespoke grid, not a govuk layout utility; drives the repeatable container/trailer sub-form.
- GOV.UK alternative: Rebuild the repeatable block with govuk grid rows/columns or a govuk-summary-list 'add another' pattern; no custom grid class needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory)

#### link-button

- What it does: A <button> styled as a link — the 'Add another container or trailer' control.
- Concern: Non-standard button/link hybrid; govuk-frontend has no link-button class.
- GOV.UK alternative: Use a govuk-button--secondary or a plain govuk-link styled action for 'Add another', per the GOV.UK 'add another' pattern.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (structure outline: BUTTON.link-button 'Add another container or trailer')

#### heading-with-help

- What it does: Modifier on the 'Means of transport to port of entry' h2, presumably to attach inline help.
- Concern: IPAFFS-specific heading treatment, not a govuk class.
- GOV.UK alternative: Use govuk-heading-m plus govuk-hint, or a Details component for help text.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory)

#### sr-only, aria-live-message, hidden

- What it does: Screen-reader-only text, an ARIA live-region message node (from the autocomplete), and a hidden-toggle utility.
- Concern: Minor utility classes; sr-only duplicates govuk-visually-hidden (which is also present), a small redundancy.
- GOV.UK alternative: Standardise on govuk-visually-hidden; live-region handling comes from the autocomplete library.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory)

#### date-input-day/month/year/hour/minute (custom classes alongside govuk-date-input__input)

- What it does: Extra per-part classes on the arrival date and time inputs, used to wire up the custom datepicker and the time sub-fields.
- Concern: Custom hooks layered on the govuk-date-input; the time entry (Hour/Minutes) reuses the date-input component rather than a dedicated time component.
- GOV.UK alternative: Plain govuk-date-input for the date; for time, two govuk-input width-2 fields in a fieldset (GOV.UK has no time component) — no custom part-classes required.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 119 (class inventory + control inventory)

### means-of-transport-after-bcp

#### defra-datepicker / date-picker__container / date-picker__dialog / date-picker__date-table / date-picker__button__next-month / date-picker__button__previous-month / date-picker__button__close / date-picker__heading / date-picker__reveal__icon / date-picker-day / date-picker-month / date-picker-year

- What it does: A bespoke JavaScript calendar/date-picker widget bolted onto the departure-date govuk-date-input. Adds a 'Choose date' button that opens a month-grid dialog ('July 2026', previous/next month, close) and writes the chosen day/month/year back into the three text inputs. Includes an aria-live-message element for screen-reader announcements.
- Concern: Not part of the GOV.UK Design System. The Design System deliberately ships the Date input as three plain text boxes with no calendar picker (GDS research shows manual entry is faster and more accessible). This custom widget is extra JS surface, its own accessibility contract, and a maintenance burden the rebuild should not inherit.
- GOV.UK alternative: GOV.UK Date input (three text inputs: Day/Month/Year) with no JS picker — exactly what already sits underneath this widget.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 130 (class inventory)

#### date-input-day / date-input-month / date-input-year / date-input-hour / date-input-minute

- What it does: Custom hook classes on the individual date/time text inputs, used by the datepicker JS and by client-side date/time validation.
- Concern: IPAFFS-specific class names layered on top of govuk-date-input__input. Purely behavioural hooks; carry no visual meaning and would not be needed in a rebuild that uses plain govuk Date input.
- GOV.UK alternative: govuk-date-input__input (standard) — no custom hook class needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 130 (class inventory)

#### Time captured via a repurposed govuk-date-input fieldset (Hour / Minutes)

- What it does: The 'Date and time of departure from BCP' time entry reuses the Date input markup pattern (govuk-date-input__item) for Hour and Minutes rather than any dedicated time component.
- Concern: The GOV.UK Design System has no Time input component, so IPAFFS repurposed Date input. This is an accepted community pattern but worth flagging: the rebuild should decide deliberately whether departure time is required and how to model it, rather than copying the twin-fieldset date+time layout.
- GOV.UK alternative: No official Time input; two width-2 text inputs (Hour, Minutes) inside a fieldset with a hint is the conventional GDS approach — which is what IPAFFS does.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 130 (class inventory + structure)

#### sr-only / hidden / aria-live-message

- What it does: sr-only is a non-GDS visually-hidden utility (GDS uses govuk-visually-hidden); hidden toggles element visibility; aria-live-message is the datepicker's live-region announcer.
- Concern: Minor: sr-only duplicates govuk-visually-hidden with a different name (likely from the datepicker's own CSS). Consolidate on govuk-visually-hidden in the rebuild.
- GOV.UK alternative: govuk-visually-hidden
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 130 (class inventory)

### goods-movement-services

#### back-link--next-to-breadcrumbs (on the govuk-back-link element)

- What it does: Positioning modifier that offsets the Back link so it sits alongside the breadcrumb/account bar
- Concern: Non-standard IPAFFS-specific modifier class layered on the standard govuk-back-link; purely a layout tweak for the legacy chrome
- GOV.UK alternative: Standard govuk-back-link with no custom modifier; the new CDP app has its own layout and will not need this offset
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 136

### transporter

#### transporter-detail-form-mobile and transporter-detail-form-desktop (two parallel <form> elements)

- What it does: The entire page content is duplicated into two sibling forms — one shown on mobile, one on desktop — toggled by CSS. Both POST to action='transport'.
- Concern: Duplicated DOM (two copies of the table, add link, both save buttons and hidden crumb/etag) is not the GOV.UK pattern and doubles the maintenance surface; screen readers may encounter both. The rebuild should render a single responsive region.
- GOV.UK alternative: A single GOV.UK Table using the responsive-table stacking pattern, or a Summary list per transporter — one DOM tree, CSS-only responsiveness.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 138; main.html

#### transporter-table-mobile / name-address-and-country (bespoke stacked card built from govuk-grid-row + govuk-label--s + hr dividers)

- What it does: Hand-rolled mobile 'card' that stacks each transporter's Name/address/country, Approval number and Type as label + value grid rows separated by section breaks, instead of a real table.
- Concern: Reimplements responsive table behaviour with grid utilities and visually-hidden semantics; not a Design System component.
- GOV.UK alternative: GOV.UK Table responsive variant, or Summary list per transporter card.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 138; main.html

#### table-responsive (wrapper), no-wrap, vertical-align-middle (custom utility classes)

- What it does: Custom CSS: table-responsive wraps the desktop table for horizontal scroll; no-wrap prevents the 'Approval number' header wrapping; vertical-align-middle aligns cells.
- Concern: Bespoke utility classes outside the govuk-* toolbox.
- GOV.UK alternative: govuk-!-* spacing utilities and the standard Table component; overflow handled by the responsive-table pattern rather than a custom wrapper.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d, action 138; main.html

### search-existing-transporter

#### traders-search-results-form-desktop / traders-search-results-form-mobile / transporter-table-mobile

- What it does: IPAFFS renders the SAME result set twice: a desktop govuk-table plus a completely separate mobile 'stacked card' layout built from grid rows, one shown/hidden per breakpoint via bespoke CSS.
- Concern: Two parallel DOM copies of every result row (the mobile copy carries Status/Approval Number/Type fields the desktop header row does not expose). Doubles markup, duplicates action buttons, and diverges from the single-source GOV.UK responsive table pattern.
- GOV.UK alternative: A single govuk-table with the GOV.UK responsive-table pattern (data-label cells) — one DOM copy that reflows on small screens.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 139 (body.html — both desktop and mobile forms present)

#### link-button

- What it does: Per-result 'View' and 'Select' actions are native <button type=submit> elements (name=view-id / name=add-id, value=<transporterId>) styled by a custom 'link-button' class to look like links; each submits the surrounding results form.
- Concern: Custom class outside the govuk-frontend toolbox; a button visually disguised as a link. Selecting/viewing is modelled as a form POST carrying the row id in the submit button name rather than a distinct control.
- GOV.UK alternative: GOV.UK Button (secondary) for the action, or a plain govuk-link if navigation-only. In the rebuild, 'select existing' vs 'view' can be per-row links/buttons within a standard responsive table.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 139 (main.html — <button class='link-button' name='add-id'>Select</button> and name='view-id'>View</button>)

#### search-panel / form-group (non-govuk) / table-responsive / traders-search-results / name-address-and-country

- What it does: Bespoke IPAFFS wrapper/layout classes: 'form-group' (a non-govuk duplicate of govuk-form-group) wraps the search fieldset; 'name-address-and-country' styles the value cells in mobile cards.
- Concern: Custom presentational classes require bespoke CSS the new app would otherwise avoid. 'form-group' shadows the real govuk-form-group and can cause confusion.
- GOV.UK alternative: govuk-form-group + govuk-grid utilities; no bespoke wrapper needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 139 (non-govuk class inventory)

#### Create-new link rendered outside <main>

- What it does: The 'Create a new transporter' link (id=add-economic-operator) is not inside the main content region in the captured snapshot — it lives in surrounding page furniture around the results form.
- Concern: The primary alternative action (create vs select-existing) sits outside the main landmark, which is an accessibility/structure smell. In the rebuild the create-new option should be a first-class in-main action.
- GOV.UK alternative: Place the 'Create a new transporter' link/button inside <main>, e.g. above or below the results table as a govuk-link or govuk-button--secondary.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 139 (querySelectorAll('main a') empty; link resolved via click log)

### transporter-creation

#### Country as a native <select> (govuk-select) rather than accessible-autocomplete

- What it does: Plain 254-option native select for choosing the transporter's country
- Concern: Not itself non-govuk (govuk-select is a real Design System component), but a 254-long native select is a poor UX for a long reference-data list. Other IPAFFS pages use accessible-autocomplete for country pickers; here it is a bare select.
- GOV.UK alternative: govuk Select is acceptable; the new app should source the country list from a reference-data service and consider accessible-autocomplete for typeahead
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 144

#### Caption 'DRAFT.GB.2026.1525979 - CHEDP' rendered in the page-header block above <main>, not via a govuk-caption-* class inside main

- What it does: Shows the draft CHED reference as a section caption
- Concern: The reference caption sits outside <main> in a bespoke header region rather than as a govuk-caption-xl inside the content column. Minor structural deviation.
- GOV.UK alternative: govuk-caption-xl / govuk-caption-l placed above the H1 inside main
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 144

### transporter-confirmation

#### main [class] inventory = 100% govuk-*

- What it does: Whole page is a confirmation Panel + a Button + a Link inside a two-thirds grid column; no custom classes, no third-party widgets.
- Concern: None — this page is entirely within the GOV.UK Design System toolbox and rebuilds 1:1 with govuk-frontend macros (Panel, Button, plain link).
- GOV.UK alternative: n/a — already standard
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 150; non-govuk class filter returned 'ALL GOVUK'

#### govuk-panel--confirmation used for an interstitial (not a journey-end) confirmation

- What it does: IPAFFS uses the green confirmation Panel to acknowledge a sub-entity (transporter) was created mid-journey, then offers 'Add to notification' to continue — rather than reserving the Panel for a terminal 'application complete' page.
- Concern: Not a markup defect, but a UX pattern choice: the Design System Panel is conventionally a journey-end success banner. The new IUU app may prefer a lighter acknowledgement (e.g. a notification banner or simply routing straight to transport details) rather than a full green Panel for an intermediate step.
- GOV.UK alternative: Notification banner (success), or skip the interstitial entirely
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 150; main.html (govuk-panel govuk-panel--confirmation with 'Add to notification' continue button)

### nominated-contacts

#### link-button (buttons #remove-nominated-contact0 'Remove' and #add-nominated-contact 'Add another person')

- What it does: Submit-type buttons styled to look like inline links, used for the row-level 'Remove' action and the 'Add another person' action. The add button also carries a bare 'govuk' class (no such utility exists — likely a template artefact).
- Concern: 'link-button' is a bespoke IPAFFS class, not a GOV.UK Design System class. GOV.UK guidance is that buttons should look like buttons; link-styled submit buttons are a custom pattern that the rebuild should not copy.
- GOV.UK alternative: GOV.UK 'Add another' pattern (govuk-frontend / hmrc add-to-a-list) with a secondary govuk-button for 'Add another' and a proper remove control per item; or a govuk-button--secondary.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 153

#### table-responsive (wrapper div around #nominated-contacts-table)

- What it does: Custom responsive-table wrapper class around the contacts table.
- Concern: Not a govuk-* class; bespoke IPAFFS styling. The whole approach of embedding editable text inputs inside a data table is non-standard for GOV.UK forms — column headers double as input labels (aria-labelledby to <th>), so there are no per-field govuk-label elements or hints.
- GOV.UK alternative: Replace the editable-table layout with the GOV.UK 'Add another' repeated-fieldset pattern: one fieldset per contact with proper govuk-label + govuk-hint for Name, Email address and Mobile number.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 153

#### Text inputs labelled by aria-labelledby to table column headers (name-header / email-header / phone-header) instead of govuk-label

- What it does: Each row input borrows its accessible name from the column <th> rather than having a dedicated label element.
- Concern: Field-level labels and hints are absent; accessibility relies on the table header association. Fine as a table but atypical for a GOV.UK form and loses per-field hint capacity.
- GOV.UK alternative: Dedicated govuk-label (and optional govuk-hint) per input in an 'Add another' fieldset.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 153

### contact-address

#### branch-address-select

- What it does: A bespoke hook class on the address radio group / container (radio inputs share name=branch-address-select). Serves as a CSS/JS selector hook, not a Design System component.
- Concern: Only non-govuk class on the page. Harmless namespacing hook rather than a bespoke widget — the underlying control is a standard govuk Radios group.
- GOV.UK alternative: None needed — the radios are already the standard GOV.UK Radios component; drop the hook class or replace with a data attribute in the rebuild.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 154 — nonstd class inventory returned only 'branch-address-select'

### branch-address-confirmation

#### <main> content is 100% govuk-* classes (govuk-main-wrapper, govuk-grid-row, govuk-grid-column-two-thirds, govuk-panel, govuk-panel--confirmation, govuk-panel__title, govuk-button plus spacing utilities)

- What it does: Renders the confirmation panel and the return button entirely from the GOV.UK Design System toolbox.
- Concern: None — this page is fully inside the govuk-frontend toolbox and rebuilds trivially as a Panel + Button. Recorded explicitly as a good finding.
- GOV.UK alternative: Direct 1:1 — Panel (confirmation) + Button.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 165 — non-govuk class filter returned ALL-GOVUK

### review-notification

#### review-summary-list, review-summary-list__row, review-summary-list__key, review-summary-list__value, review-summary-list__action, review-summary-list__row-border-bottom, review-summary-list__row-border-top, review-summary-list__row-no-action, review-summary-list__row-with-action

- What it does: a bespoke IPAFFS re-skin of the GOV.UK summary list used for the check-your-answers rows, with its own border and action-column modifiers
- Concern: parallel component to govuk-summary-list; the rebuild should use the standard Summary list with a boolean per row for whether a Change action shows, rather than a custom class family
- GOV.UK alternative: Summary list (govuk-summary-list with govuk-summary-list__actions)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170 (main non-govuk class inventory)

#### presentation-table, presentation-table__row--no-border, presentation-table__section, review-table, review-additional-documents-table, review-latest-health-certificate-table, table-responsive

- What it does: custom table variants for the commodity/species weight breakdown and the document/certificate summary tables, plus a responsive-table wrapper
- Concern: IPAFFS-specific table styling layered on top of (or instead of) govuk-table; the catch-certificate and health-certificate tables are load-bearing IUU data and should be rebuilt as standard GOV.UK Tables
- GOV.UK alternative: Table (govuk-table)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170

#### audit-flag, audit-flag__date, audit-flag__user

- What it does: renders the 'Last updated <date>' / 'by <user>' audit metadata block under the H1
- Concern: bespoke widget with no Design System equivalent; can be plain body paragraphs in the rebuild
- GOV.UK alternative: Body text (govuk-body paragraphs)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170 (refs e60-e63)

#### copy-button, link-button

- What it does: the 'Copy' buttons beside the CHED reference / customs declaration reference / customs document code that copy the value to the clipboard, and link-styled action buttons
- Concern: requires client-side JS clipboard behaviour; a govuk-button styled as a link is standard, but the copy-to-clipboard interaction is custom and must be re-decided (progressive-enhancement) in the rebuild
- GOV.UK alternative: Button styled as a link (govuk-button--secondary or a govuk-link) plus bespoke clipboard JS
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170 (refs e71, e76, e81)

#### heading-with-change-link

- What it does: lays a section heading and its 'Change' link on the same row
- Concern: layout helper; achievable with GOV.UK grid/utility classes in the rebuild
- GOV.UK alternative: govuk grid / flex utilities
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170

#### heading-tertiary reference banner (span.heading-tertiary inside div.govuk-!-padding-top-6)

- What it does: renders the '<CHED reference> - <CHED type>' banner ('DRAFT.GB.2026.1525979 - CHEDP') in the page header ABOVE <main>, wrapping the reference in span#reference-number and appending ' - CHEDP'
- Concern: bespoke header widget, not a GOV.UK Caption; the reviewer of an earlier draft mislabelled it as a govuk-caption-m Caption above the H1. For the IUU rebuild this reference/CHED-type identifier is a product decision (whether to surface it and how)
- GOV.UK alternative: govuk-caption-l/-xl caption paired with the H1, or plain govuk-body
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170 (#reference-number.closest('div') = <div class="govuk-!-padding-top-6"><span class="heading-tertiary"><span id="reference-number">DRAFT.GB.2026.1525979</span><span> - CHEDP</span></span></div>, located before <main>)

#### no-wrap, ellipsis, break-word, border-bottom-none, consignment-net-weight, species, weight, packages, package-type, change

- What it does: utility/formatting classes controlling text wrapping, truncation and column widths in the review tables
- Concern: custom CSS utilities; GOV.UK width-override utilities (govuk-!-width-*) already cover most of this and are also present on the page
- GOV.UK alternative: govuk-!-* width/spacing utilities
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 170

### declaration

#### form.review-form (id="declaration-form", method="POST")

- What it does: IPAFFS-specific form wrapper class on the <form> that posts the declaration/submission. Carries no visible styling in this page; it is a namespacing/hook class shared with other review-style pages.
- Concern: The only non-govuk-* class on the page. It is benign markup with no styling implication — not a widget or third-party library. It does not need replacing; a plain <form> (or a govuk pattern page form) suffices in the rebuild.
- GOV.UK alternative: None needed — a standard HTML <form> element wrapping govuk components.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 174 (form.review-form outerHTML)

### confirmation

#### notification-banner--inspection-required / notification-banner__risk-title

- What it does: Custom modifier + title class on the GOV.UK notification banner, used to render the 'Initial risk assessment' header and colour-code the banner by inspection outcome.
- Concern: Bespoke IPAFFS styling layered on the standard component; the confirmation outcome is expressed via a custom banner+panel combination rather than a standard confirmation panel/H1. The new app will need an equivalent way to signal inspection-required vs not-required outcomes.
- GOV.UK alternative: govuk-notification-banner (default or --success variant) with a standard govuk-panel--confirmation title; the risk/inspection state can be conveyed through banner variant + heading copy without custom CSS.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 175 (nonstandard.txt, main.html)

#### panel--inspection-required (with inline style="border-top: none;")

- What it does: Custom-styled govuk-panel showing 'Inspection status / Required at London Tilbury'; strips the top border and overrides the standard green confirmation panel look.
- Concern: Non-standard panel styling + an inline style attribute. This variant has NO H1/panel title at all, which is unusual for a GOV.UK confirmation page (the accessible page name relies solely on the <title>).
- GOV.UK alternative: Standard govuk-panel--confirmation with a govuk-panel__title (H1) e.g. 'Notification sent', plus body text for the inspection status.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 175 (main.html)

#### copy-button class + data-copy-value attribute on govuk-button

- What it does: Client-side clipboard-copy widget: each reference row has a 'Copy' button carrying data-copy-value; JS copies that value to the clipboard. (The only copy-related attribute in the DOM is data-copy-value — there is no data-copy attribute.)
- Concern: Requires bespoke client JS and degrades without it (button is type=submit). Not part of the GOV.UK Design System — a rebuild would need to decide whether copy-to-clipboard is worth a custom progressive-enhancement component.
- GOV.UK alternative: No native GOV.UK component; the reference is already selectable text in the summary list, so the Copy buttons are an optional enhancement rather than a requirement.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 175 (main.html: id=copy-customs-declaration-reference-number / copy-customs-doc-code)

#### link-button (id=manage-notifications, and the 'Create a new notification' link)

- What it does: Anchor styled to look like/behave as an action link for the two exit navigation options.
- Concern: Custom class rather than a standard govuk-link or govuk-button; mixes link and button semantics.
- GOV.UK alternative: govuk-link for navigation, or govuk-button (data-module=govuk-button) if it should read as a primary action.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 175 (main.html)

#### footer_feedback

- What it does: Custom wrapper block holding the 'Tell us what we can improve' heading and external feedback link.
- Concern: Bespoke IPAFFS layout class; the underlying content is standard govuk-heading-s + govuk-link so it is easily reproducible.
- GOV.UK alternative: Plain govuk-grid-row / govuk-body markup — no custom class needed.
- Evidence: db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 175 (main.html)

## Five most consequential mapping decisions

1. Counted 198 distinct obligations from 199 page-level field entries by linking origin-of-import.origin-country to the canonical country-of-origin.origin-country obligation; the trace/workflow page-boundary conflict remains explicit as c-005.

2. Applied rendered-trace precedence to exact copy, option subsets, structure and identifiers, including the legacy consignee-labelled consignor form; legacy defects are preserved as evidence but explicitly not endorsed for the rebuild.

3. Kept the fish/catch-certificate delta load-bearing: catch-certificate applicability, upload, per-certificate reference/date/flag state/species, management loop, IUU exemptions and catch-certificate review structures are not generalised into generic CHED-P requirements.

4. Treated wider QA catalogues (document types and package types) as reference-data vocabularies, not page options, whenever the rendered fish page exposed a smaller contextual subset.

5. Did not promote happy-path habit into mandatory rules: only 5 of 198 obligations are evidenced required, 28 have unknown requiredness, 20 validation messages remain gap-tagged, and the unexercised IUU/validation surface stays visible in the gate.

