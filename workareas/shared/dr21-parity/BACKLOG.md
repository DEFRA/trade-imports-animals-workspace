# EUDPA-328 — DR2.1 parity backlog

Generated from the verified findings. Every item was raised from a captured
artefact, carries file:line evidence on both sides, and survived an independent
verifier whose instruction was to refute it.

Capture refs: frontend `main` at `32f6106c`, prototype at `7da4f70`.

**97 items** across 3 bands. 1 finding(s) refuted and dropped — listed at the foot.

## Summary

| Band | Items | Increment types |
|---|---|---|
| Frontend-only — buildable now | 27 | add-section, add-field, obligation-change, flow-change, copy-change |
| Needs a design decision first | 49 | add-page, add-section, add-collection, add-field, obligation-change, flow-change, copy-change |
| Needs backend work first | 21 | add-page, add-section, add-collection, add-field, obligation-change, flow-change |

## Frontend-only — buildable now

### add-section

**1. Identification details is missing the selected-commodities summary block and its Change / Add another commodity / Change number of animals links.**

The prototype opens the identification page with a four-column summary of what is being imported — Commodity code, Common name, a quantity column whose header switches between 'Number of animals' and 'Number of packages' (`quantityColumnLabel`, animal-identification-details.html:65), and a Change link per row pointing back to the search with `?resetSearch=1` (:75). Below it sits an 'Add another commodity' link (:81-83), and each species panel carries a 'Change number of animals' link back to consignment-details (:98, label set at routes.js:1624).

The frontend's page goes h1 → inset text → straight into the identification cards (animal-identification.njk:9-23). There is no summary, and the only 'Add a commodity' link lives in the `{% else %}` empty-state branch (:29-31), so a user who has commodities never sees it. The three navigational escape hatches — change the commodity, add another, change the count — are all absent, which matters most on the count: the frontend enforces record-count-equals-numberOfAnimals (obligations/sections/commodities/identifiers.js:98-101) and shows an over-count error (copy.en.js:83-84) with no link to the page where the count can be fixed.

`frontend-only` — every value needed is already in the view model (the cards carry species, code and cap), and the same summary table already exists one page earlier at consignment-details/_selected-commodities-table.njk.

- Screens: fe-animal-identification / dr21-animal-identification-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/animal-identification/animal-identification.njk:6-33`
- Prototype: `GB-notification-service/app/views/design-release-2.1/animal-identification-details.html:56-98`
- Confidence: high
- Falsified by: A selected-commodities summary rendered by a shared layout partial rather than the feature template — shared/layout.njk would have to be carrying it, and the captured DOM for fe-animal-identification shows no such block.

**2. The prototype hub shows each role's full selected address under its own h2 section heading; the frontend hub shows only the party name in a summary-list row.**

Frontend: `rows()` maps each party to a summary-list row whose value is `answers[party.id]?.name` or 'Not added yet' (features/addresses/controller.js:31-52), rendered as one `govukSummaryList` (features/addresses/template.njk:11). The name is all the user sees — no address lines, no country. The delta records five `summaryRows` on the frontend and none on the prototype.

Prototype: each role is a `<section>` with its own h2 heading, hint paragraph (and bullet hint-list for permanent address), and when an address is held an inset block carrying the name plus every address line and a 'Change' link (roles-and-addresses.html:47-99, sections built in routes.js:2040-2120). The captured populated hub proves it renders the whole block: harness/capture/html/dr21-roles-and-addresses-complete.html:287-300 shows name 'Green Valley Farm' followed by five address lines inside `govuk-inset-text`.

The delta lists the six prototype h2s as only-prototype precisely because the frontend has collapsed all six roles into one summary list. Restating the address on the hub is the difference that matters for checking work before submission.

- Screens: fe-addresses-hub, dr21-roles-and-addresses
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/controller.js:47-52`
- Prototype: `GB-notification-service/app/views/design-release-2.1/roles-and-addresses.html:47-99`
- Confidence: high
- Falsified by: The frontend hub rendering address lines (e.g. `hubRow` taking an address summary rather than `.name`), or a captured populated frontend hub showing more than the party name. The capture available is the empty state, so the value shape is evidenced from the controller, not the DOM.

### add-field

**3. DR2.1 asks the user to choose a document type; the frontend guesses it from the uploaded filename.**

The frontend's upload form collects only reference, date of issue and file (template.njk:31-58); type is inferred by token-matching the filename against the document-types enum, falling back to 'OTHER' (derive-document-type.js:19-23; the docstring at :10-11 states outright 'The trader does not pick a type; the filename carries it'). DR2.1 renders a `Document type` govukSelect (upload-documents.html:116-129) whose options (routes.js:8512-8530) are the same enum the frontend already owns, minus HEALTH_CERTIFICATE and with ITAHC relabelled 'Intra Trade Animal Health Certificate (ITAHC)'. The obligation model already declares `accompanyingDocumentType` mandatory (obligations/sections/documents.js:30-35), so this is a missing collection surface for a field the model already requires — no backend change needed.

> **Corrected by verification:** Trivial citation slip: the 'The trader does not pick a type; the filename carries it' docstring is at derive-document-type.js:7-8, not :10-11. The primary citation (:19) is correct.

- Screens: fe-documents-empty, dr21-upload-documents
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/documents/derive-document-type.js:19`
- Prototype: `app/views/design-release-2.1/upload-documents.html:116`
- Confidence: high
- Falsified by: A backend contract that will not accept a trader-supplied document type, or a decision that filename derivation is the intended UX.

**4. Microchip is missing as an identifier type across the whole service — the prototype offers it for horses and for all 01061900 commodities.**

The prototype's identifier map lists `microchip` twice: for 01061900 — Cat, Dog, Ferret, Other live mammals (commodity-identifiers.js:4-8) — and for 0101 Horse (:13-17). The frontend has four typed identifier allowlists and none of them is microchip: PASSPORT_COMMODITIES, TATTOO_COMMODITIES, EAR_TAG_COMMODITIES, HORSE_NAME_COMMODITIES (stub.js:107-113), matched one-for-one by four obligations in obligations/sections/commodities/identifiers.js:113-155. A case-insensitive grep for 'microchip' across the frontend's whole src/ returns only three hits, all of them free-text fixture *values* in characterisation-corpus.js:49 and characterisation-oracles.json — never a field.

This is `frontend-only` and cleanly shaped as one add-field increment because the pattern to copy already exists: add a MICROCHIP_COMMODITIES allowlist to the stub, a fifth `allowListed` obligation beside passport/tattoo/earTag/horseName, its id into unitRecord.requires.anyOfIds (identifiers.js:88-96), its label into copy.en.js typeFields, and — importantly — its allowlist into `specificIdentifierWhitelists` (identifiers.js:167-172), which the file's own comment at :163-166 warns must be widened or the free-text fallback will double-gate.

- Screens: fe-animal-identification / dr21-animal-identification-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:107-113`
- Prototype: `GB-notification-service/app/data/commodity-identifiers.js:4-17`
- Confidence: high
- Falsified by: Finding a microchip field or allowlist anywhere in the frontend's commodities service or identifier obligations, or a decision record ruling microchip out of scope for GB import notifications.

**5. The frontend's port-of-entry hint promises type-to-search but the control is a plain 80-option select; DR2.1 ships an actual typeahead.**

port-of-entry.njk:18-26 renders `govukSelect` with `items: portItems` — the delta file records 80 options — and attaches the hint 'Choose where the transporter will enter with the consignment. Start typing to search by port or airport name or code.' (copy.en.js:11). Nothing enhances that select: `accessible-autocomplete` is absent from the frontend's package.json and there is no client module touching portOfEntry. The hint therefore describes behaviour the page does not have. DR2.1 uses the same hint text (arrival-details.html:54-56) over a `data-module="app-airport-search"` search input with a live results listbox and a hidden `portOfEntry` value (arrival-details.html:63-107). This is a control replacement on an existing field, not a new question.

> **Already in progress:** Already in progress on `feature/EUDPA-124-port-of-entry-type-ahead` (3 commits ahead of main at capture time). Do not schedule as new work — confirm the branch covers it.

- Screens: fe-arrival-details, dr21-arrival-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/port-of-entry/port-of-entry.njk:18`
- Prototype: `app/views/design-release-2.1/arrival-details.html:63`
- Confidence: high
- Falsified by: Finding an autocomplete enhancement bound to #portOfEntry in the frontend's client bundle, or a decision to reword the hint rather than build the typeahead.

**6. The germinal review card lists Net weight, Type of package and Number of packages where the frontend species card always lists Number of animals**

The prototype branches the review rows on entry.isGerminalProduct: Net weight (formatted '<n> kg'), Type of package, Number of packages for germinal; Number of animals plus any packagingFields otherwise (routes.js:4118-4147, mirrored for the template review at routes.js:4733-4757). The frontend row set is fixed — commodity code, common name, species, number of animals, then number of packages only when packagesApply (species-card-rows.js:11-22) — so a germinal line would render an empty Number of animals row and drop the three fields that matter. Listed separately from the field findings because check-answers has its own applicability module (check-answers/view-model/applicability.js:25) that must learn the same gate.

- Screens: dr21-consignment-details-germinal, dr21-consignment-details-germinal-mixed
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/check-answers/view-model/cards/consignment/species/species-card-rows.js:11`
- Prototype: `GB-notification-service/app/routes.js:4118`
- Confidence: high
- Falsified by: species-card-rows already branching on commodity family, or the germinal review rows matching the live-animal set.

**7. The prototype captures the CPH number as three labelled parts sized 2/3/4; the frontend takes it as one free-text field.**

The prototype uses the govukDateInput macro as a three-part number input under the legend "CPH number" - County (width-2, maxlength 2), Parish (width-3, maxlength 3), Holding number (width-4, maxlength 4), each inputmode=numeric with pattern [0-9]* (cph-number-input.html:17-54), posting as cphNumber-county / -parish / -holding and canonicalising to CC/PPP/HHHH (routes.js:2770-2793). The frontend renders one govukInput at width-10 (template.njk:11-23) and normalises by stripping slashes to 9 bare digits (controller.js:75-78). The stored value is 9 digits either way, so the three parts can be joined in the controller without touching the wire contract.

> **Corrected by verification:** Two details are loose. The prototype does not enforce 9 digits at all - validateCphNumber (routes.js:2797-2820) returns an empty errors object and only joins the parts as `${county}/${parish}/${holding}` at :2817; the 2/3/4 shape rests on the maxlength attributes alone. And the stored values are not identical: the prototype stores the slashed string "12/345/6789" while the frontend stores 9 bare digits, so joining the three parts in the controller is still contained but needs an explicit strip. The cited range routes.js:2770-2793 covers splitCphNumber and parseCphNumberBody; the canonicalising join is at :2817.

- Screens: fe-cph-number, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/cph-number/template.njk:11`
- Prototype: `app/views/partials/cph-number-input.html:17`
- Confidence: high
- Falsified by: If GDS guidance for this service has ruled against splitting a single reference number across three boxes - the same argument that applies to splitting a National Insurance number - the frontend's single field is the correct pattern and only the hint needs fixing.

**8. The prototype composes the region of origin code from a country-derived prefix plus a 5-character suffix; the frontend asks for the whole code in a single 5-character field.**

The prototype shows a read-only govuk-input__prefix carrying the ISO alpha-2 code for the chosen country (region-of-origin-code-input.html:18, fed by getCountryRegionPrefix at routes.js:73-79 over app/data/country-region-prefixes.js) and takes only the suffix in an input capped at maxlength=5 (:22-29). On POST it upper-cases the suffix and joins the two as `${prefix}-${suffix}` (routes.js:8759-8764), so a stored code can be up to 8 characters. The frontend takes the whole code as one free-text field labelled "Region of origin code" hinted "For example, FR-75" (origin/copy/copy.en.js:13-16) and caps the entire string at REGION_CODE_MAX_LENGTH = 5 (controller.js:37, applied at :71-75). "FR-75" fits by exactly one character; any country whose region suffix is longer than two characters cannot be entered at all. The composed value is still a single string on the wire, so the change is contained in the origin feature.

> **Corrected by verification:** "FR-75" is exactly 5 characters, so it fits with zero characters to spare, not "by exactly one character". Note also the prototype's suffix box itself allows up to 5 characters (not 2), so a composed code runs up to 8; the frontend's whole-string cap of 5 blocks any suffix longer than 2. Everything else stands.

- Screens: fe-origin, dr21-origin-of-the-import
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/origin/controller.js:37`
- Prototype: `app/views/partials/region-of-origin-code-input.html:18`
- Confidence: high
- Falsified by: If the reference-data service defines region-of-origin codes without a country prefix, or if the accepted format really is capped at 5 characters end to end, the prototype's prefix affix is decoration and only the max-length is wrong.

### obligation-change

**9. Germinal species take exactly one identification record regardless of quantity, while the frontend requires one unit record per animal counted**

getIdentificationEntryCount returns a hard 1 for germinal commodities and numberOfAnimals[speciesId] otherwise (routes.js:1464-1477), and the germinal panel heading drops the counter — 'Enter details for Bos taurus' rather than 'Enter details for X n of total' (routes.js:1588-1590), which the capture confirms. The frontend models the opposite invariant: unitRecord.requires.recordCountEquals points at numberOfAnimals.id (identifiers.js:98-101), the card caps entry at collectionCapAt (card/view-model.js:54-63) and the copy is counter/overCount/allEntered (copy.en.js:80-86). With numberOfAnimals no longer applicable on germinal lines (previous finding) recordCountEquals has no field to read, so the cardinality rule needs a germinal branch of its own.

> **Corrected by verification:** Slightly overstated in one place. copy.en.js:80 already carries a counterNoCap variant ('Enter details for {species}') and view-model.js:30-33 selects it when cap === null, and collectionCapAt (engine/evaluate/cardinality.js:21-33) deliberately returns null — i.e. uncapped, not broken — when the count field is unanswered. So dropping numberOfAnimals on germinal lines degrades to an unlimited add-another loop with the no-counter heading already rendering correctly; what is missing is a rule that pins the cap at exactly 1, not the heading copy.

- Screens: dr21-animal-identification-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/commodities/identifiers.js:98`
- Prototype: `GB-notification-service/app/routes.js:1464`
- Confidence: high
- Falsified by: getIdentificationEntryCount returning numberOfPackages rather than 1 for germinal, or a germinal capture showing an 'n of total' counter.

**10. numberOfAnimals is unconditionally mandatory in the frontend but is never asked or validated on a germinal line**

The frontend obligation numberOfAnimals is within commodityLine with status 'mandatory' and no applyTo (lines.js:61-66), and fieldsFor always adds an integerInRange check for every line (consignment-details/fields.js:18-34). In DR2.1 the Number of animals input lives only in the non-germinal else-branch of the template (consignment-details.html:157-169) and validateNumberOfAnimals returns early for germinal species (routes.js:811-816). Adding germinal lines therefore requires numberOfAnimals to gain an applyTo that excludes germinal commodities — it is not enough to hide the input, because the obligation drives hub/check-answers completeness and the unit-record count check.

- Screens: dr21-consignment-details-germinal, dr21-consignment-details-germinal-mixed
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/commodities/lines.js:61`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:157`
- Confidence: high
- Falsified by: A germinal capture showing a Number of animals input, or validateNumberOfAnimals not short-circuiting for germinal.

**11. numberOfPackages carries opposite obligation statuses on the two sides: mandatory for germinal in DR2.1, optional for everything in the frontend, and never validated for live animals in DR2.1**

Lead 2 confirmed exactly: validateNumberOfPackages returns early for any species whose commodity is not germinal (routes.js:894-899), so the live-animal 'Number of packages (when required)' input is parsed and stored (routes.js:8916, 8952) but never checked, while the germinal one demands a whole number greater than 0. The frontend goes the other way — the obligation is status:'optional' gated by the package-count allowlist (lines.js:76-84) and integerInRange permits '' via Joi .allow('') (validators.js:126-128), so it is optional for every commodity on the list. Building germinal means one field name whose status is decided per line by the line's commodity, which the current single-status obligation cannot express. Copy differs three ways too: germinal 'Number of packages' with no hint (consignment-details.html:144-156), DR2.1 live 'Number of packages (when required)' hint 'Such as crates, bags or boxes' (commodities.js:22), frontend 'Number of packages (optional)' with the same hint (copy.en.js:31-34).

- Screens: dr21-consignment-details-germinal, dr21-consignment-details-germinal-mixed, dr21-consignment-details-germinal-errors
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/commodities/lines.js:76`
- Prototype: `GB-notification-service/app/routes.js:890`
- Confidence: high
- Falsified by: validateNumberOfPackages applying to non-germinal species, or the frontend numberOfPackages obligation being status:'mandatory'.

### flow-change

**12. 'Use template' is a redirect, not a page — the fourth templates screen is the notification hub, and the frontend already has this exact flow shape in copy-as-new.**

Verified: GET /templates/:templateId/use renders nothing. It calls resetNotificationJourneySession, then seedNotificationSessionFromTemplate, then redirects to /notification-hub (routes.js:9088-9101). The capture confirms it — dr21-use-template-landing.json:2 records the url as /design-release-2.1/notification-hub and its h1 as 'Overview'. So the templates band is three new pages, not four; the fourth is an entry point onto a screen that already has a frontend counterpart (fe-hub). The frontend already implements this shape: copyPost calls copyJourney and redirects to hubPath(copied.journeyId) with no new page (notification-actions/controller.js:26-42), and engine/journey.js:136-144 shows copyJourney creating the record and registering it in the session. A use-template action is the same handler with a template as the source instead of a journey. Banded frontend-only for the flow wiring; the template it reads from is the needs-backend piece above.

- Screens: dr21-use-template-landing
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/notification-actions/controller.js:26-42`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:9088-9101`
- Confidence: high
- Falsified by: A DR2.1 view rendered at /templates/:id/use, or a captured use-template screen whose url is not the notification hub.

**13. The frontend's read-only notification view still renders 'Now submit your notification' and a POST Continue button; the prototype suppresses the submit form on every non-draft variant.**

check-answers/template.njk is reused for the submitted notification view (controller.js:72-88 sets readOnly when journey.status === SUBMITTED, and the template already guards copy/delete actions on it at lines 31-52). The submit block at 108-114 has no such guard, so a submitted, read-only notification still shows 'Now submit your notification', 'Continue to the declaration to submit your notification.' and a live Continue button. The prototype is explicit that this block is variant-scoped. Worth noting this is arguably a defect in its own right, not only a parity gap.

> **Corrected by verification:** Substance stands. Two tightenings: the finding's `screens` list includes fe-cancel-amend, which is the frontend's separate cancel-amend confirm page, not the read-only notification view — only fe-check-answers is relevant. And the corpus contains no capture of the read-only view, so the defect is evidenced by code inspection rather than by a captured DOM.

- Screens: fe-check-answers, fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/check-answers/template.njk:108-114 (submit heading, body and form are outside any readOnly guard); check-answers/controller.js:78 (readOnly is computed and passed but only reaches the card actions)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/review-notification.html:138-153 (the Continue form renders only for reviewVariant 'journey' or 'draft'; 'action-required' gets a link to the hub instead and the submitted variant gets nothing)`
- Confidence: high
- Falsified by: A route-level guard elsewhere that rejects the POST for submitted journeys and a separate template used for the read-only view — I found only one template and one POST handler (check-answers/controller.js:92-95).

**14. The prototype confirmation page offers 'Create a new notification' as an onward route; the frontend offers only 'Return to your dashboard'.**

A small but real onward-journey gap: a user who has just submitted and wants to raise another must go via the dashboard in the frontend. The prototype gives a direct route. Cheap increment; the only question is where the frontend's create-notification entry point lives (DR2.1 has dr21-create-notification as an unpaired screen, so the destination may not exist yet).

- Screens: fe-confirmation
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/confirmation/template.njk:23-27; confirmation/copy/copy.en.js:19-23 (viewOrAmend has heading, body and dashboardLink only)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/notification-submitted.html:56-58 (link to /design-release-2.1/create-notification)`
- Confidence: high
- Falsified by: The frontend having no standalone create-notification route to link to, which would make this dependent on the 'entry' band instead.

**15. The prototype hub ends with a 'Review and submit' primary button and has no review task row; the frontend hub has a 'Check and submit' task row and only a secondary 'Return to dashboard' button.**

DR2.1 moved the route into review from a task row to a page-level call to action, which also removes the sixth task-list group and its 'Cannot start yet' gating (buildReviewItem in hub/controller.js:72-91). This travels with the section-spine finding above — the prototype's six sections are six content sections precisely because review is no longer one of them — but it is a separable increment: add the primary button and drop the review row.

- Screens: fe-hub
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/hub/template.njk:37-41 (only govukButton for Return to dashboard, classes govuk-button--secondary); hub/copy/copy.en.js:24 ('6. Check and submit' group) and :75-78 (rows.review); hub/controller.js:48 (the check-and-submit group holds the review row)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/notification-hub.html:103-114 (primary 'Review and submit' then secondary 'Return to dashboard'); routes.js:5485-5577 (sections stop at '6. Contact address' — no review item)`
- Confidence: high
- Falsified by: A ruling to keep review as a task row so its readiness status stays visible on the hub; the prototype's button gives no completeness signal.

**16. The prototype offers a 'Same as consignee' one-click copy on the hub for importer and place of destination; the frontend only tells the user they are usually the same and makes them pick again.**

Lead CONFIRMED. Prototype: sections flagged `canUseSameAsConsignee` (consignment-address-sections.js:53 importer, :67 place-of-destination) render a submit button styled as a link beside the normal Add link when a consignee address is already held (routes.js:2108-2114; roles-and-addresses.html:83-92). Posting it copies the consignee's id, name, address lines and country straight into the target section and re-renders the hub (routes.js:10433-10438 → copyConsigneeAddressToSection, routes.js:2124-2140). The captured screen shows both buttons live: harness/capture/model/dr21-roles-and-addresses-same-as-consignee.json:92-100 (`same-as-consignee:importer`, `same-as-consignee:place-of-destination`).

Frontend: the hub's only per-row action is a single Add/Change link to the party picker (features/addresses/controller.js:31-45, rendered by features/addresses/template.njk:11). The importer hint already says 'This is usually the same as the consignee. You can select a different person if needed.' (features/addresses/copy/copy.en.js:32) — the frontend states the shortcut in prose but never offers it. Nothing named `sameAs` exists anywhere under features/addresses or features/contact.

All the data needed is already in journey state, so this is frontend-only work.

- Screens: fe-addresses-hub, dr21-roles-and-addresses, dr21-roles-and-addresses-same-as-consignee
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/controller.js:31-45`
- Prototype: `GB-notification-service/app/views/design-release-2.1/roles-and-addresses.html:83-92`
- Confidence: high
- Falsified by: A 'Same as consignee' control, or any copy-from-another-party action, appearing in the frontend addresses feature — or design ruling that the shortcut was a prototype experiment rejected in research.

### copy-change

**17. DR2.1 hints that international phone numbers need a country code on both transporter forms; the frontend gives no phone hint anywhere.**

private-transporter-details.njk:73-81 renders the telephone input with a label and no hint, and copy.en.js:107-110 has no hint key for it. DR2.1 attaches `hint: { text: 'For international numbers include the country code' }` to the phone input on both add-transporter forms (partials/transporter-add-private-fields.html:98-110 and partials/transporter-add-commercial-fields.html:221-233). Given the transporter stub data is dominated by non-UK parties (services/address-book/stub/commercial-transporter.js:1-23 is Swiss and Belgian), this is a substantive hint, not decoration. Raising as one finding across both prototype screens rather than per-page.

- Screens: fe-transporter-private, dr21-transporter-add-private, dr21-transporter-add-commercial
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/private-transporter-details/private-transporter-details.njk:73`
- Prototype: `app/views/partials/transporter-add-private-fields.html:102`
- Confidence: high
- Falsified by: Finding the hint already present in another frontend phone field's copy, in which case this is a per-page omission rather than a service-wide one.

**18. Four of the eleven internal-market purpose hints carry grammar and GDS style defects in the frontend that the prototype has already corrected.**

Both sides offer the same eleven purposes in the same order with the same labels. The hints differ on four. Sale/gift: the frontend has "has as it's aim," (possessive/contraction error) and "(e.g. a gift)" where the prototype has "has as its aim" and "(for example a gift)." - the GDS style guide bans e.g. (copy.en.js:6 vs internal-market-purposes.js:7). Breeding (copy.en.js:9-10 vs :17), Racing/competition/show/training (copy.en.js:12-13 vs :27) and Production (copy.en.js:18-19 vs :42) each end without a full stop in the frontend and with one in the prototype. The remaining seven hints match exactly.

> **Corrected by verification:** Sharpen what each defect is: only the sale/gift hint carries actual errors (possessive "it's", a spurious comma, "e.g."). The other three are a missing terminal full stop, which is best argued as an internal inconsistency in the frontend's own copy file - 7 of its 11 hints end with a full stop and these 4 do not - rather than as a GDS rule breach.

- Screens: fe-import-purpose, dr21-reason-for-import-internal-market-revealed
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/import-purpose/copy/copy.en.js:6`
- Prototype: `app/data/internal-market-purposes.js:7`
- Confidence: high
- Falsified by: If the frontend copy is the signed-off content-designer wording and the prototype's edits are unreviewed, the direction of travel reverses - but "it's" for "its" is wrong either way.

**19. The commodity search page omits the Trade Tariff tool link and the three-paragraph explanation of what a commodity code is.**

Both sides render a `govukDetails` summarised 'Help with commodity codes'. The bodies are not comparable in kind: the frontend's is a single sentence, 'Commodity codes are used to classify goods for import and export.' (copy.en.js:9, rendered at search.njk:31-34). The prototype's is three paragraphs ending in an outbound link — 'You can look up commodity codes using the [Trade Tariff tool](https://www.gov.uk/trade-tariff) (opens in a new tab)' (what-are-you-importing.html:119-125, the anchor at :123 carrying `target="_blank" rel="noreferrer noopener"`).

The inset text differs the same way: the frontend's 'Each health certificate requires a separate notification.' (copy.en.js:6) drops the second obligation the prototype states — 'Consignments that do not require a health certificate must still be notified.' (what-are-you-importing.html:43). That sentence tells a user with no health certificate that they are still in scope; its absence could plausibly cause a missed notification.

Separated from the search-control finding because it lands independently — the help content and inset are useful whether or not the search box is ever built. `frontend-only`: the frontend's copy module already supports it, and the details macro is already wired.

- Screens: fe-commodity-search / dr21-what-are-you-importing
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/copy/copy.en.js:5-10`
- Prototype: `GB-notification-service/app/views/design-release-2.1/what-are-you-importing.html:119-132`
- Confidence: high
- Falsified by: The Trade Tariff link or the 'must still be notified' sentence appearing elsewhere in the frontend journey — a grep for 'Trade Tariff' and 'trade-tariff' across the whole live-animals set returns nothing.

**20. The CPH page heading is a bare label in the frontend and an instruction in the prototype.**

The frontend uses "County Parish Holding (CPH)" as both the input label and the page heading via isPageHeading (copy.en.js:2-4, template.njk:14-18). The prototype heads the page "Add the county parish holding number (CPH)" and keeps "CPH number" as the field legend (cph-number.html:33, cph-number-input.html:9). The prototype's version tells the user what to do and uses sentence case; the frontend's is title-cased and names a thing rather than asking for one.

- Screens: fe-cph-number, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/cph-number/copy/copy.en.js:2`
- Prototype: `app/views/design-release-2.1/cph-number.html:33`
- Confidence: high
- Falsified by: If the h1 is being carried as an accessible label for the input and changing it would orphan the field, the split needs the three-part input from the related finding to land first.

**21. The frontend's CPH hint shows a 3/3/3 grouping, which is not the CPH format.**

The frontend hints "For example, 123456789 or 123/456/789." (copy.en.js:5). A CPH is county 2 digits, parish 3, holding 4 - the prototype hints "For example 12/345/6789" (cph-number-input.html:14) and its parser only accepts that shape, /^(\d{1,2})\/(\d{1,3})\/(\d{1,4})$/ (routes.js:2772). The frontend's example teaches users a grouping that does not exist. It still validates, because the controller strips slashes before checking for 9 digits (controller.js:77), so the wrong example is invisible to the tests and only misleads the user.

> **Corrected by verification:** One sub-claim is mischaracterised: the regex /^(\d{1,2})\/(\d{1,3})\/(\d{1,4})$/ is at routes.js:2771 (not 2772) and it belongs to splitCphNumber, which splits an already-stored value back into three boxes for re-display. It is not an input validator - the prototype validates nothing (see the CPH three-part finding). The finding's conclusion is unaffected: the 2/3/4 shape is evidenced by the three inputs' maxlengths and the prototype hint.

- Screens: fe-cph-number, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/cph-number/copy/copy.en.js:5`
- Prototype: `app/views/partials/cph-number-input.html:14`
- Confidence: high
- Falsified by: If APHA publishes CPH numbers in a 3/3/3 grouping, the frontend hint is right and the prototype's is wrong.

**22. The prototype shows an Alpha phase banner on every page; the frontend's shared layout renders none anywhere in the service.**

Raised once as a service-wide pattern. The prototype's beforeContent block renders govukPhaseBanner with tag "Alpha" and the text "This is a new service. Help us improve it and give your feedback by email." on origin (origin-of-the-import.html:14-19), reason for import (reason-for-import.html:11-16) and CPH (cph-number.html:12-17), and it drove the phaseBanner delta on all four of my pairs. The frontend's shared layout beforeContent renders breadcrumbs and a back link only (shared/layout.njk:41-53); grepping the whole of src/server for phaseBanner or govukPhaseBanner returns nothing. The feedback link in the prototype is href="#", so the real destination is unresolved.

- Screens: fe-origin, fe-import-reason, fe-import-purpose, fe-cph-number, dr21-origin-of-the-import, dr21-reason-for-import, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/layout.njk:41`
- Prototype: `app/views/design-release-2.1/origin-of-the-import.html:14`
- Confidence: high
- Falsified by: If the service has been assessed past alpha, the banner text and tag are wrong and the work is to add a beta banner instead - the gap stands either way.

**23. The prototype's contact page explains what a contact address is; the frontend only explains what selecting one does.**

Frontend hint, rendered as the radios' hint (features/contact/template.njk:20): 'Selecting a contact copies their name and address into this notification.' — a description of the mechanism.

Prototype intro paragraph: 'This is the contact address of the person responsible for the consignment from when it enters Great Britain until authorities complete their checks.' (contact-address-for-consignment.html:50-52) — a definition of the role, which is what the user needs to choose correctly. The prototype also heads the list 'Select an address' (contact-address-for-consignment.html:62, the only-prototype h2 in the delta) and puts the add-address route in a help line: 'If the correct address is not shown, add a new branch address, then return to this page.' (contact-address-for-consignment.html:64-66) versus the frontend's bare link 'Add a new contact address' (contact/copy/copy.en.js:5, template.njk:25-27).

Note the vocabulary split: the prototype calls the thing a 'branch address', the frontend a 'contact address'. That needs a ruling alongside the copy.

- Screens: fe-contact, dr21-contact-address-for-consignment
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/contact/copy/copy.en.js:4`
- Prototype: `GB-notification-service/app/views/design-release-2.1/contact-address-for-consignment.html:50-52`
- Confidence: high
- Falsified by: The definition sentence appearing in features/contact copy, or content design ruling the prototype's sentence inaccurate.

**24. The prototype's CPH page carries a "What is a CPH number?" details block explaining the number and where to find it; the frontend page has no help content at all.**

The prototype renders a govukDetails summarised "What is a CPH number?" containing two paragraphs - "A county parish holding (CPH) number is a unique 9-digit number used to identify land and buildings where livestock are kept, moved or handled." and "You can find your CPH number on documents from the Animal and Plant Health Agency (APHA) or by checking your holding details on GOV.UK." with the last clause as a link (cph-number.html:45-51). The frontend template opens straight from the error summary onto the form and the single input (template.njk:8-23) and its copy file holds no help strings at all (cph-number/copy/copy.en.js:1-12). The prototype's link href is "#", so the real GOV.UK destination is still an open question.

- Screens: fe-cph-number, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/cph-number/template.njk:8`
- Prototype: `app/views/design-release-2.1/cph-number.html:45`
- Confidence: high
- Falsified by: If the GOV.UK holding-details page the link points at does not exist, the second paragraph cannot be shipped as written and the finding shrinks to the first paragraph only.

**25. The whole DR2.1 documents guidance block — ITAHC intro, 'other documents you may need', and the expandable 'which additional documents' table — is absent from the frontend.**

template.njk:16 puts the h1 straight above the form; documents/copy/copy.en.js:1-16 has no guidance keys at all. DR2.1 carries, before the form: an intro paragraph covering ITAHC attachment, adding later, uploading before arrival at the UK port, English-language and all-pages requirements (upload-documents.html:38-40); a bulleted 'Other documents you may need to attach include' list (:43-48); and a `govukDetails` 'Check which additional documents you must upload' containing a two-column Consignment / Documents needed table with three rows (animals not needing a health certificate, livestock transiting bluetongue restricted territories, rodents for research) and a 'Check the documents you need' GOV.UK link opening in a new tab (:51-82). None of that content exists anywhere in the frontend documents feature.

- Screens: fe-documents-empty, dr21-upload-documents
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/documents/template.njk:16`
- Prototype: `app/views/design-release-2.1/upload-documents.html:38`
- Confidence: high
- Falsified by: Finding this guidance rendered from a shared layout or an interstitial page in the frontend, or a content-design decision to drop it.

**26. Destructive-confirm pages use a warning button plus a secondary button in the frontend and a warning button plus a text link in the prototype.**

Raised once for both confirm screens rather than twice. Two coupled changes: the secondary action becomes a link rather than a button (matching GDS guidance for a single primary action), and its text collapses from a full 'No, return to X' sentence to 'Go back'. The link form loses the destination, so the copy half is a judgement call on a destructive page; the button-to-link half is straightforwardly in the govuk toolbox.

> **Corrected by verification:** One precision point: the frontend's secondary action is already an anchor (govukButton is passed an href — fe-cancel-amend.json records it under `links` with isButton: true), so the change is button-styling to link-styling on an element that is a link either way, not a genuine button-to-link element swap. That makes the visual half a pure class change; the copy half ('No, return to X' collapsing to 'Go back', losing the named destination) remains the judgement call.

- Screens: fe-delete-notification, fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/delete-notification/template.njk:15-19 (govukButton with govuk-button--secondary, text 'No, return to dashboard'); features/cancel-amend/template.njk:12-16 (same pattern, 'No, return to notification')`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/delete-notification.html:36 (a plain govuk-link 'Go back'); app/views/partials/design-release-2.1/cancel-amend-modal.html:26-28 (a link-styled 'Go back' dismiss)`
- Confidence: medium
- Falsified by: An accessibility or research decision favouring an explicit named destination on destructive confirms, which would keep the frontend wording.

**27. The prototype captions the addresses hub and every address spoke 'Consignment parties'; the frontend captions only the spokes, and captions them 'Consignment addresses'.**

The differ reported the prototype caption as null on every picker; that is a mining artefact, not a missing caption — the prototype uses a bespoke class rather than `govuk-caption-l`, so the miner did not pick it up. Checked against the raw capture: harness/capture/html/dr21-address-select-consignee.html:265 renders `<p class="app-consignment-address-select-page__caption">Consignment parties</p>`, and fe-miner/capture/html/fe-address-picker-consignee.html renders `govuk-caption-l">Consignment addresses`.

So the real deltas are (a) the section is called 'Consignment parties' in the prototype and 'Consignment addresses' in the frontend (features/addresses/copy/copy.en.js:42, rendered at party-picker/party-picker.njk:7 — versus consignment-address-select.html:41), and (b) the prototype also carries that caption above the hub's own h1 (roles-and-addresses.html:30-32) whereas the frontend hub has no caption at all (features/addresses/template.njk:7). The prototype's permanent-address pages carry the same caption (permanent-address.html:31, permanent-address-animals.html:34), so 'Consignment parties' is the prototype's name for this whole cluster.

Medium confidence because it is a small change with a large blast radius if the section name feeds task-list rows and check-answers card titles elsewhere.

- Screens: fe-addresses-hub, fe-address-picker-place-of-origin, fe-address-picker-consignor-or-exporter, fe-address-picker-consignee, fe-address-picker-importer, fe-address-picker-place-of-destination, dr21-roles-and-addresses, dr21-address-select-consignee
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/copy/copy.en.js:42`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-address-select.html:41`
- Confidence: medium
- Falsified by: The frontend's journey strip or task list already calling the section 'Consignment parties' (making this consistent), or design confirming 'Consignment addresses' as the settled section name.

## Needs a design decision first

### add-page

**1. Template lifecycle after creation is undefined: the Change links are dead anchors, 'Save and continue' saves nothing, and there is no rename or delete.**

Each of the five review cards on view-template carries a Change link pointing at `${changeBase}#<slug>` (routes.js:6698 with :6690, :6706, :6724, :6738, :6750-6752), but the id the card actually renders is `template-<slug>` (routes.js:6685/6694/6712/6730/6748 fed through review-summary-card.html:17). The anchors resolve to nothing — the links reload the same page. The captured DOM agrees: dr21-view-template.json:327-352 lists five Change hrefs all pointing back at /design-release-2.1/templates/rice-lane-city-farm. The page's primary button, 'Save and continue' (view-template.html:57-61), posts to handleViewTemplatePage, which sets session templateName and redirects to /templates (routes.js:6808-6823) — nothing is saved and nothing continues. The card on the list offers only View and Use (dashboard-template-card.html:10-11); there is no delete, rename or duplicate route among the six mounted at routes.js:9068-9101. Contrast the frontend's notification cards, which carry a full action vocabulary — View, Amend, Resume, Cancel amendment as links plus copy and delete as POST forms (dashboard/template.njk:90-111, copy/copy.en.js:49-54). Templates need the equivalent decided before the view page has a purpose.

> **Corrected by verification:** The detail's inline line citations are largely wrong and should be replaced. The Change hrefs are at routes.js:6706, 6718, 6730, 6741 and 6751 (not ':6690, :6706, :6724, :6738, :6750-6752'); the card ids are at 6703, 6715, 6727, 6738 and 6748 (not '6685/6694/6712/6730/6748'). changeBase at :6698 and handleViewTemplatePage at 6809-6823 are right. Also the card link text is 'View template' / 'Use template', not 'View' / 'Use'.

- Screens: dr21-view-template, dr21-dashboard-templates
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:90-111`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:6808-6823`
- Confidence: high
- Falsified by: A DR2.1 route handling template edit or delete, or ids on view-template matching the Change anchors.

**2. The prototype collects permanent address as a consignment-level address role with its own two-page flow off the addresses hub; the frontend collects it as free-text address fields inside each animal identification record.**

Frontend: `permanentAddressApplies(commodity)` (features/commodities/animal-identification/identifier/fields.js:32-33, whitelist `PERMANENT_ADDRESS_COMMODITIES = ['Cat','Dog']` in services/commodities/stub.js:115) switches on a block of address inputs rendered inside the per-animal identification card (card/view-model.js:92,110-112; _identification-card.njk:43-69). There is no permanent-address row on the addresses hub — `PARTIES` has exactly five entries (features/addresses/parties.js:15-51) and the hub builds its rows from that list plus a conditional CPH row (features/addresses/controller.js:47-52).

Prototype: `permanent-address` is a seventh entry in `consignment-address-sections.js:78-96`, activated for commodity code 01061900 when a selected species carries `requiresPermanentAddress` (routes.js:2006-2029; app/data/commodities.js:150,170,190). It renders as a hub section with its own bullet-list hint, and behind it sits a two-page flow the frontend has no equivalent of: `/permanent-address` asks 'Are all the animals going to the place of destination?' as Yes/No, with the destination address shown as the Yes hint (views/design-release-2.1/permanent-address.html:57-74; routes.js:2210-2232, 10303-10332), then `/permanent-address/select` asks 'Where will their permanent address be?' once per animal, each animal offering 'Same as the place of destination (POD)' or 'Enter a new address' with a revealed address form (views/design-release-2.1/permanent-address-animals.html:64-97; routes.js:10335-10349; harness/capture/model/dr21-permanent-address-select.json:78-155).

The applicability rule itself agrees on both sides (01061900 / Cat and Dog) — the divergence is entirely about where the answer is collected and that the frontend offers no 'same as place of destination' reuse. The prototype's permanent-address form also omits Country, which the frontend collects (features/commodities/copy/copy.en.js:103).

> **Corrected by verification:** The prototype collects permanent address as a consignment-level address role off the addresses hub, on a SINGLE page (/permanent-address/select) that asks 'Where will their permanent address be?' once per animal, each offering 'Same as the place of destination (POD)' or 'Enter a new address'; the frontend collects it as free-text fields inside each animal identification card. Drop all reference to a two-page Yes/No flow — views/design-release-2.1/permanent-address.html is dead code at 7da4f70 (renderPermanentAddressPage is never called; routes.js:10303-10332 force 'no' and redirect to /select), and the harness captured the same /select page under all three dr21-permanent-address* names. Also drop 'the applicability rule agrees': the prototype additionally requires it for Ferret (commodities.js:190), which the frontend has neither in PERMANENT_ADDRESS_COMMODITIES nor in COMMODITY_OPTIONS. Surviving gaps: (i) where the answer is collected, (ii) no 'same as place of destination' reuse in the frontend, (iii) the prototype form omits Country.

- Screens: fe-addresses-hub, dr21-roles-and-addresses, dr21-permanent-address, dr21-permanent-address-select, dr21-permanent-address-animals, fe-animal-identification
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/animal-identification/_identification-card.njk:43-69`
- Prototype: `GB-notification-service/app/data/consignment-address-sections.js:78-96`
- Confidence: high
- Falsified by: A permanent-address entry appearing in features/addresses/parties.js, or a frontend page under features/addresses answering 'are all the animals going to the place of destination'. Conversely, if design has since ruled that permanent address stays per-animal, only the POD-reuse half of this finding survives.

**3. The prototype defines no way to author a template's content — creation captures a name and nothing else.**

POST /templates/create trims req.body.templateName, writes it to the session and redirects to /templates (routes.js:7008-7017). No template is created; the list is unchanged. The view is a single text input with novalidate and no error summary (create-template.html:28-45). Every field a template actually carries — country of origin, region code, commodity code, species, reason for import, purpose, certified-for, five party addresses, CPH — exists only as fixture data (dashboard-templates.js:10-31), authored by hand. So the journey from 'Enter template name' to a populated template is undesigned. The frontend has no analogue to lean on: its only creation path is createPost, which starts an empty journey and sends the user to the first question (dashboard/controller.js:115-119); there is no 'save these answers as a named thing' action anywhere in the app. Someone has to rule on where template content comes from — a fresh guided pass, a save-as-template action on an existing notification, or a save-as-template action at the point of submission — before this page can be built.

- Screens: dr21-create-template
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/controller.js:115-119`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:7008-7017`
- Confidence: high
- Falsified by: A prototype route or view that captures template content beyond the name, or a DR2.1 screen offering 'save as template' from a notification.

**4. The prototype links each picker row to a full address-book record page; the frontend expands the address inline in a details disclosure and has no address record page at all.**

Frontend: the last table cell is a `<details>` element whose summary reads 'View details' with visually-hidden ' for <name>', expanding to the address lines already on the page (party-picker/_address-picker.njk:28-41). The deltas record these as only-frontend `detailsSummaries` ('View details for Origin Farm', etc.) while the same rows appear as only-prototype `links` named 'View details'.

Prototype: the cell is an anchor to `/address-book/<id>?return=<section path>` (consignment-address-select.html:151-153; href built by routes.js:7298-7306 and attached per row at routes.js:3516-3519). That is a navigation away to the address book's own record page and back, not an in-page expander.

The frontend has no address-book UI whatsoever — `services/address-book/index.js` is an in-process stub with no routes, and nothing under src/server/app serves an `/address-book` path. So this is not a template tweak: it is a decision about whether the record page belongs to this frontend or to the INS front-door that owns the address book.

- Screens: fe-address-picker-place-of-origin, fe-address-picker-consignor-or-exporter, fe-address-picker-consignee, fe-address-picker-importer, fe-address-picker-place-of-destination, dr21-address-select-place-of-origin, dr21-address-select-consignee
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/party-picker/_address-picker.njk:28-41`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-address-select.html:151-153`
- Confidence: high
- Falsified by: An address-book record route existing in trade-imports-animals-frontend, or a ruling that the address book UI lives entirely in ins-frontend and the journey should keep the inline disclosure.

### add-section

**5. The frontend has no commodity search control at all — it renders five fixed checkbox fieldsets, where the prototype runs a type-ahead search over the whole commodity catalogue with a selected-items panel.**

VERIFIED — this is the largest interaction gap in the band, and the capture worker's lead is correct in substance but imprecise in detail. The frontend loops `commodityGroups` and emits one `govukCheckboxes` fieldset per commodity (search.njk:19-29), fed by commodity-groups.js:3-14, which maps `commodities.list()` — five entries — into five legends holding eight species checkboxes in total. There is no text input, no search button, no results region and no selected-items list; grepping the whole commodities feature for `data-module` returns nothing, so there is no client-side enhancement of any kind.

The prototype's control is a JS-driven combobox: what-are-you-importing.html:66 inlines the catalogue as `commoditiesSearchJson`, :73-82 is the `input[type=search]` named `commoditySearch` with `aria-controls="commodity-search-results"`, :91-97 the live results `<ul>`, :100-108 the selected-items panel with its `Clear all` button, and :111-114 the four hidden fields (`commodityId`, `commodityCode`, `selectedSpecies`, `commoditySelections`) that carry the selection across the POST. The behaviour lives in app/assets/javascripts/commodity-search.js (694 lines). The post-search state confirms the shape: dr21-what-are-you-importing-results shows a `commodity-selection` checkbox group of 18 options appearing after a 'cattle' search, i.e. the checkboxes are the *result* of a search, not the whole catalogue.

The design decision this needs: the prototype's search is JS-only — the search button is `type="button"` (:83) and the results list is injected by script, so with JS off the user can select nothing. The frontend cannot copy that posture as-is, so someone must rule on the no-JS fallback (server-rendered search POST, or a progressively-enhanced accessible autocomplete) before this is buildable.

- Screens: fe-commodity-search / dr21-what-are-you-importing, dr21-what-are-you-importing-results
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/search/search.njk:19-29`
- Prototype: `GB-notification-service/app/views/design-release-2.1/what-are-you-importing.html:62-116`
- Confidence: high
- Falsified by: Finding a search input, results region or `data-module` attribute anywhere under features/commodities/search/ in the frontend; or the prototype's search working with JavaScript disabled (which would mean a server-rendered fallback already exists to copy).

**6. The frontend renders a service navigation bar with no navigation links, so the prototype's Dashboard / Templates / Address book / Manage account / Log out cross-service nav has no counterpart.**

The frontend calls govukServiceNavigation with serviceName and serviceUrl only and passes no `navigation` array, so the captured model's serviceNav contains a single entry — the service name link to '/' (fe-dashboard-populated.json:7-11). The DR2.1 layout passes five nav items with an `active` flag driven by `serviceNavActive`. Three of the five have no destination in the frontend today: Templates is an unbuilt band, Address book lives in trade-imports-ins-frontend, and Manage account / Log out are auth-shell concerns (the frontend has its own appServiceHeader at layout.njk:34-39 which may already own sign-out). This is a service-wide finding, not a dashboard one — it fires on every paired screen — so it should be raised once and not per page.

> **Corrected by verification:** Four of the five prototype nav items have no counterpart — Dashboard, Templates, Address book and Manage account. Log out does have a counterpart: appServiceHeader (src/server/common/components/service-header/template.njk:21) renders a 'Sign out' link to /auth/sign-out for authenticated users, invoked from layout.njk:34-39; it is absent from the capture only because the mined trace was unauthenticated. The work is therefore 'add a navigation array plus decide whether sign-out relocates from the app header into the service nav', not 'no counterpart at all'.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/layout.njk:27-32`
- Prototype: `GB-notification-service/app/views/layouts/main.html:69-101`
- Confidence: high
- Falsified by: A `navigation:` array being passed to govukServiceNavigation anywhere in the frontend layout chain, or the appServiceHeader partial already rendering an equivalent link set.

**7. The prototype's submitted-notification view opens with an 'Import reference numbers' block (notification reference, customs document code C640, copy buttons and a customs warning); the frontend view has no equivalent.**

This is the block behind the two only-prototype warningText entries in the cancel-amend delta. It carries information the frontend never surfaces anywhere: the customs document code, and the warning that the wrong reference or code delays the consignment. The code is hardcoded to C640 in the prototype, so the design decision is whether it is a constant for live animals or must come from reference data. The Copy buttons are a JS affordance and need a no-JS position.

- Screens: fe-cancel-amend, fe-check-answers
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/check-answers/template.njk:29-58 (h1, then copy/delete buttons, then straight into the sections loop — no reference block); src/server/app/shared/layout.njk:65-70 (the journey strip shows the reference as a bare tag plus text, with no customs code and no copy affordance)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/review-notification.html:45-69 ('Import reference numbers', govukWarningText 'You must use the correct reference and code on the customs declaration or your consignment will be delayed.', notification reference row and 'Customs document code' C640 row, each with a Copy button)`
- Confidence: high
- Falsified by: C640 turning out to be prototype placeholder data with no agreed source, or a ruling that customs guidance lives outside this service.

**8. No page in the frontend renders a phase banner, where every DR2.1 page carries an Alpha banner with a feedback link.**

The frontend's beforeContent block renders breadcrumbs and an optional back link and nothing else; govukPhaseBanner is not imported anywhere in the frontend's Nunjucks. All 34 captured frontend models have phaseBanner: null. Every DR2.1 view renders the banner in beforeContent with tag "Alpha" and the text "This is a new service. Help us improve it and give your feedback by email", the feedback target being a placeholder href="#". This is a service-wide finding, not a dashboard one, and needs a decision on the correct phase label and a real feedback destination before it can be built. Confidence is medium only because the banner's absence may be a deliberate call rather than an oversight.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/layout.njk:41-53`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:16-28`
- Confidence: medium
- Falsified by: A prior decision recorded against the frontend to omit the phase banner, or a phase banner rendered by a layer outside src/server/app.

**9. The frontend renders no phase banner and an empty service navigation; every DR2.1 screen carries an Alpha banner and a five-item nav.**

Raised once as a service-wide pattern, not six times — it appears in all six of my pairs and will appear in every other band's too, so it needs a single owner. The phase banner is unambiguous and cheap. The navigation is not: Templates and Address book point at capabilities the frontend does not have (dr21-dashboard-templates and friends are unpaired prototype screens), and 'Manage account' / 'Log out' overlap with the frontend's existing appServiceHeader (layout.njk:34-39), so the increment needs a ruling on which items are in scope now. Deduplicate against whichever band claims the service chrome.

- Screens: fe-hub, fe-check-answers, fe-declaration, fe-confirmation, fe-delete-notification, fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/layout.njk:27-32 (govukServiceNavigation is given a serviceName only, no navigation array), :41-53 (beforeContent has breadcrumbs and a back link, no phase banner)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/declaration.html:13-19 (govukPhaseBanner, repeated verbatim in every DR2.1 view); app/views/layouts/main.html:70-100 (navigation: Dashboard, Templates, Address book, Manage account, Log out)`
- Confidence: medium
- Falsified by: Another band already owning this, or a ruling that the alpha phase banner is deliberately omitted until the service reaches beta.

### add-collection

**10. Germinal products (semen, embryos and ova) are a whole commodity class the frontend has no concept of, and they change what three of the four pages in this band ask for.**

The prototype defines 15 germinal-product commodities (Cattle Semen 05111000, Cattle Embryos/Ova 05119985, and the same pairs for Cat, Dog, Goat, Horse, Pig, Sheep, plus Rabbit/Rodent Semen), each flagged `isGerminalProduct: true` (commodities-germinal-products.js:11) and each with `packagingFields: []` and its own reduced certification-purpose list (:3-7). routes.js:49 concatenates them into `allCommodities`, and routes.js:55-63 makes the combined set searchable specifically for the design-release-2.1 session.

A single grep for `germinal`, `netWeight` or `packageType` across the whole of the frontend's live-animals set returns exactly one hit — an email sentence in features/confirmation/copy/copy.en.js:27. The frontend's commodity data (stub.js:1-48) has no germinal entries and its COMMODITY_TYPE_DATA carries no such flag.

This one gap is the root of three separate downstream findings in this band (germinal quantity fields on Commodity details, germinal identifier set on Identification details, the Temperature question and certification-purpose suppression on Additional details). It is listed as its own increment because those three cannot land until a commodity can be marked as a germinal product at all. The design decision: whether germinal products are in scope for the live-animals service at all, or belong to a separate notification type.

> **Corrected by verification:** Two traces of germinal products DO exist in the frontend, just outside the grepped path/terms, and neither weakens the finding: stub.js:50-105 (PACKAGE_COUNT_COMMODITIES) names semen and embryo/ova commodities such as '05111000 - Semen - Cattle' and '05119985 - Embryos/Ova - Cattle', and src/server/app/services/certification-purposes/stub.js:5 carries a 'Germinal products' certification purpose. Neither is a selectable commodity and neither carries a germinal flag, so the class remains unrepresentable — but 'no concept of' should read 'no selectable germinal commodity and no germinal flag'.

- Screens: fe-commodity-search / dr21-what-are-you-importing, fe-consignment-details / dr21-consignment-details, fe-animal-identification / dr21-animal-identification-details, fe-additional-details / dr21-additional-animal-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:1-48`
- Prototype: `GB-notification-service/app/data/commodities-germinal-products.js:19-147`
- Confidence: high
- Falsified by: A decision record placing germinal products out of scope for this service, or any `isGerminalProduct`-equivalent flag already present in the frontend's commodity model.

### add-field

**11. A template writes one address into five party roles, contradicting the consignor and consignee its own card advertises.**

The seed fans review.placeOfOrigin out across placeOfOrigin, consignor, consignee, importer and placeOfDestination (routes.js:6664-6681), and the review view model shows that same address for four of them (routes.js:6753-6758). But the list card for the same template advertises Consignee 'Glen Keen Farm' and Consignor 'Rice Lane City Farm' (dashboard-templates.js:8-9) — two different parties. The captured screens show both halves of the contradiction: dr21-dashboard-templates.json:196-206 has the differing card values, dr21-view-template.json:296-315 has one address repeated four times. Acorn Farm disagrees with itself the same way: card origin 'Republic of Ireland' (dashboard-templates.js:69) against review countryOfOrigin 'France' (:73) and a Romanian place of origin (:82-92). The card fields and the template body are simply not derived from one another. That matters because the frontend has no shared-address concept to inherit: each party commits its own {name, address} snapshot under its own key (party-picker.controller.js:66-71), and the picker re-finds the source record by name within that role's book (party-picker/selection.js:3-8). A template must state, per role, what it carries — and whether a template address the user has never had in that role's book is legitimate.

> **Corrected by verification:** Three refinements. (1) The card/body contradiction holds for three of the four fixtures — glen-keen-farm has consignor = consignee = 'Glen Keen Farm' = its own place of origin, so it is self-consistent. (2) The review card displays the shared address in four roles; placeOfDestination is seeded but never shown, so 'five roles' is the session write and 'four' the rendered evidence. (3) The fixtures do carry useSameAddressForParties: true (dashboard-templates.js:29, 60, 93, 125), but grep shows routes.js never reads it — the fan-out is unconditional, so the flag is dead data, not the 'same address for all parties' control the falsifier calls for. It is worth flagging as evidence of design intent that was never wired.

- Screens: dr21-view-template, dr21-dashboard-templates
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/party-picker/party-picker.controller.js:66-71`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:6664-6681`
- Confidence: high
- Falsified by: A prototype template whose card consignor/consignee are derived from its review body, or a DR2.1 'same address for all parties' control on the template itself.

**12. Additional details is missing the storage-temperature question, and unlike the prototype the frontend always asks the certification-purpose question.**

Two linked gaps on the same page.

First, a missing question: the prototype renders a `storageTemperature` radio group legended 'Temperature', hinted 'How will the products be stored', with options Ambient / Chilled / Frozen (additional-animal-details.html:65-85; options at routes.js:43; wired at routes.js:8394-8397). A grep for 'temperature' across the whole frontend live-animals set returns nothing.

Second, an obligation difference: the prototype computes `showCertificationPurposeQuestion: !showTemperatureQuestion` (routes.js:1182), where `showTemperatureQuestion = hasGerminalProductsOnly(sessionData)` (routes.js:1179, defined at routes.js:3775-3787). So a germinal-only consignment is asked Temperature *instead of* 'What are the animals certified for?', never both. The frontend renders the certification radios unconditionally — template.njk:13-24 has no `{% if %}` guard, and controller.js:66-69 always builds `certifiedOptions` and always validates the field (controller.js:100).

Worth recording as a negative result: the certification-purpose option list itself is an exact match — 16 options in identical order and wording, frontend services/certification-purposes/stub.js:1-20 against prototype app/data/certification-purposes.js:3-20. There is no work there.

- Screens: fe-additional-details / dr21-additional-animal-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/additional-details/template.njk:13-39`
- Prototype: `GB-notification-service/app/views/design-release-2.1/additional-animal-details.html:65-85`
- Confidence: high
- Falsified by: Finding a temperature or storage field in the frontend's additional-details model; or the prototype showing both the certification and temperature questions together (the `!showTemperatureQuestion` expression at routes.js:1182 makes them mutually exclusive).

**13. Identification details has no germinal identifier set — the prototype asks for Donor ID, Collection date and Identification number, including a date picker the frontend has no equivalent of on this page.**

The prototype maps both germinal CN codes (05119985 and 05111000) to a three-field identifier set: `donor-id` (text), `collection-date` (type `date`, hint 'For example, 27/3/2026') and `identification-number` (text) — commodity-identifiers.js:21-30. The date field is rendered with the MoJ date picker: animal-identification-details.html:115-132 branches on `field.type == "date"` and calls `mojDatePicker`. Germinal panels also behave differently — routes.js:1595-1602 gives them a single editable form rather than the per-animal save-and-add-another loop, and routes.js:1610 suppresses the saved-animals table for them.

The frontend's identifier vocabulary is fixed at six fields — passport, tattoo, ear tag, horse name, identification details, description (copy.en.js:58-79) — all rendered as plain `govukInput` (_identification-card.njk:31-41). There is no donor ID, no collection date and no identification number, and no date control on this page at all.

The design decision beyond the fields themselves: the germinal single-form panel is a different interaction from the frontend's counter-driven 'record N of M' card, so someone must rule on whether the frontend's unitRecord model (which requires record count to equal numberOfAnimals — obligations/sections/commodities/identifiers.js:98-101) even applies when the quantity is packages rather than animals.

> **Corrected by verification:** The falsifier parenthetical is wrong and should be struck: validateAnimalIdentifiers (routes.js:1766-1776) returns `{ errors: {}, errorList: [], values }` unconditionally — the prototype never raises an error for a missing identifier, germinal or otherwise. So germinal identifier fields ARE effectively optional in the prototype (completeness only drives the save-and-add-another flow via isAnimalIdentifierEntryComplete). This does not touch the finding: the gap is that the fields and the date control do not exist frontend-side at all.

- Screens: fe-animal-identification / dr21-animal-identification-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/copy/copy.en.js:58-79`
- Prototype: `GB-notification-service/app/data/commodity-identifiers.js:21-30`
- Confidence: high
- Falsified by: Finding a donor-ID / collection-date identifier in the frontend's copy or identifier obligations; or germinal identifier fields turning out to be optional in the prototype (validateAnimalIdentifiers at routes.js:1766 treats them like any other field, so they are not).

**14. The prototype picks country of origin with a type-ahead search over a full country list; the frontend uses a govukSelect dropdown of 33 fixed options.**

The prototype renders an h2 "Country of origin" (origin-of-the-import.html:46), a type=search input with placeholder "Search for a country" (:65-74), a search button (:75), a live results list (:83-89) and a hidden countryOfOrigin input that carries the chosen value (:91-96). It is driven client-side from countriesJson injected at routes.js:8344. The frontend renders a plain govukSelect whose items come from countries.originCountries() (features/origin/controller.js:57-61, services/countries/index.js:17-18). This is the same app-commodity-search component the prototype uses for commodity lookup, and the frontend has adopted it nowhere - its commodity page is a checkbox list (fe-commodity-search.json:52-53). Adopting it needs a ruling on the no-JS fallback and on the assistive-tech behaviour of a search-plus-hidden-input, neither of which the prototype implements.

> **Corrected by verification:** The prototype searches a curated 41-entry list (27 EU member states, 11 territories, 3 crown dependencies - app/data/countries.js:1-28, :31-50), not a full country list. The frontend's govukSelect renders 33 options = 31 countries plus a "Select a country" placeholder and a disabled divider, and the list is not hard-coded: it comes from the countries service, which fetches from reference data in real mode (services/countries/index.js:7-13) and is stubbed only in the capture. The real gap is the interaction pattern (search-plus-hidden-input vs select) and the open no-JS/assistive-tech questions, which stand.

- Screens: fe-origin, dr21-origin-of-the-import
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/origin/template.njk:15`
- Prototype: `app/views/design-release-2.1/origin-of-the-import.html:65`
- Confidence: high
- Falsified by: If the design team has since reverted DR2.1's country search to a govukSelect or an accessible-autocomplete, or if a no-JS fallback exists in the prototype that I did not find, this is not work the frontend needs to take on.

**15. Transit countries is a full checkbox list capped at 12 in the frontend, and an unbounded typeahead with an add/remove selected-list in DR2.1.**

transit-countries.njk:16-23 renders `govukCheckboxes({ name: 'transitedCountries', classes: 'govuk-checkboxes--small', items: countryItems })` under the legend 'Select all countries the consignment will travel through' with the hint 'Select up to 12 countries'; the cap is enforced at transit-countries.controller.js:18 and :33-35 (MAX_TRANSITED_COUNTRIES = 12). DR2.1 replaces the whole list with a `data-module="app-transit-country-search"` search field labelled 'Enter a country' plus a running summary table of chosen countries, each with a 'Remove' link, backed by a hidden `transitCountries` input (transit-countries.html:71-139). Intro copy is identical on both sides. Two rulings needed: whether to adopt the typeahead-plus-chosen-list pattern, and whether the 12-country cap survives — DR2.1 imposes none (routes.js:1932-1936 normalises the list with no length check). Note the prototype's hidden input starts empty, so its no-JS path submits nothing; any adopted version needs a progressive-enhancement fallback the prototype does not demonstrate.

> **Already in progress:** Already in progress on `feature/EUDPA-124-port-of-entry-type-ahead` (3 commits ahead of main at capture time). Do not schedule as new work — confirm the branch covers it.

- Screens: fe-transit-countries, dr21-transit-countries
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/transit-countries/transit-countries.njk:16`
- Prototype: `app/views/design-release-2.1/transit-countries.html:71`
- Confidence: high
- Falsified by: A DR2.1 route showing a 12-country limit, or a decision to keep the checkbox list.

**16. Means of transport is four radios in the frontend and a select in DR2.1.**

port-of-entry.njk:28-38 is `govukRadios` with a fieldset legend and four items (AIRPLANE, RAILWAY, ROAD_VEHICLE, VESSEL). arrival-details.html:110-120 is `govukSelect` with a label and a 'Select one' placeholder plus the same four values. Raising this as a finding rather than noise because it is a real, deliberate component divergence — but flagging that GDS guidance prefers radios over a select for four options, so the correct resolution may be to change the prototype rather than the frontend. Adopting the select would also convert a legend into a label, which the delta already records.

- Screens: fe-arrival-details, dr21-arrival-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/port-of-entry/port-of-entry.njk:28`
- Prototype: `app/views/design-release-2.1/arrival-details.html:110`
- Confidence: medium
- Falsified by: A design decision record choosing the select deliberately, or confirmation that the prototype's select is incidental and radios remain the pattern.

**17. Templates carry a category label with no germinal-products example, so what a template is scoped to is unspecified.**

Verified: all four seeded templates are categoryLabel 'Live animals' (dashboard-templates.js:4, :35, :66, :99), rendered as the card's category strapline (dashboard-template-card.html:5) and captured as the first heading of every card (dr21-dashboard-templates.json:185-187, :221-223, :257-259, :293-295). Nothing filters or branches on the label — it is display-only. Yet DR2.1's dashboard is titled 'Live animals & germinal products' (dashboard.html:49) and the release carries five germinal screens (dr21-what-are-you-importing-germinal and friends). So the one attribute that says what regime a template belongs to has a single worked value and no counter-example, which leaves the discriminator's meaning and its effect on the Use flow undefined. The frontend has nothing to map it onto: src/server/app/sets/ holds one set, live-animals, and germinal products exists only as a certification purpose (certification-purposes/stub.js:5), not as a regime. The discriminator question is shared with the germinal-products band; what is specific here is that templates surface it and the prototype never exercises it.

> **Corrected by verification:** Two scope corrections. (1) 'No counter-example' is true of templates only. The notification fixture does carry the other value — dashboard-notifications.js:24, :41, :76, :111 are all 'Germinal products' — and routes.js:6110-6116 derives categoryLabel for notification cards (falling back to 'Germinal products' when hasGerminalProductsOnly). That is display derivation, not behavioural branching, so the finding stands, but the claim must be stated as 'no germinal TEMPLATE exists', not 'the label has no worked counter-example anywhere'. (2) The release carries eight germinal captures, not five (three what-are-you-importing variants, three consignment-details variants, animal-identification-details-germinal and additional-animal-details-germinal).

- Screens: dr21-dashboard-templates
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/services/certification-purposes/stub.js:5`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/data/dashboard-templates.js:4`
- Confidence: medium
- Falsified by: A germinal template in dashboard-templates.js, or DR2.1 code that branches on categoryLabel.

### obligation-change

**18. A germinal-only notification can never mark Commodity details complete in DR2.1, because completeness is defined solely in terms of numberOfAnimals**

hasConsignmentDetails requires numberOfAnimals[speciesId] to be a whole number >= 1 for every selected species (routes.js:1191-1204), but germinal lines never render or store numberOfAnimals (consignment-details.html:157, routes.js:811-816), so it is permanently false for a germinal-only consignment. It gates the hub task status (routes.js:5512), the review card error state (routes.js:4512) and hasNotificationComplete (routes.js:4274) — so the prototype has no definition of a complete germinal consignment. The frontend will inherit exactly this trap if numberOfAnimals stays a bare mandatory obligation (lines.js:61-66) while germinal lines stop answering it: the completeness rule for a germinal line (net weight + package type + package count, presumably) has to be stated before the obligation change can be made safely. No germinal hub or review capture exists to check the rendered outcome, so this is a source reading, not an observed one.

- Screens: dr21-consignment-details-germinal, dr21-animal-identification-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/commodities/lines.js:61`
- Prototype: `GB-notification-service/app/routes.js:1191`
- Confidence: high
- Falsified by: A germinal-only hub or review capture showing Commodity details as Complete, or hasConsignmentDetails branching on germinal.

**19. A mixed live-animal and germinal consignment renders both question sets on one page, so numberOfPackages carries two different obligation statuses simultaneously**

Lead 6 confirmed. The mixed capture shows, in one form, numberOfAnimals[cattle-bos-taurus] + numberOfPackages[cattle-bos-taurus] labelled 'Number of packages (when required)' (optional, unvalidated) directly above netWeight/packageType/numberOfPackages[cattle-semen-bos-taurus] labelled 'Number of packages' (all three mandatory). The per-species loop branches on species.isGerminalProduct inside a shared group loop (consignment-details.html:99-188). The frontend cannot express this: buildGroups computes one showPackages boolean per commodity group from packagesApply(name) (groups.js:24-33), the field list is built from a single flat lines array (consignment-details/fields.js:18-34), and the error copy is one message per field kind (copy.en.js:35-40). This is a cardinality-and-status question about the commodity-line collection, not a template tweak.

> **Corrected by verification:** Real but partly derivative and one supporting claim is imprecise. The status conflict itself is finding 4; what this adds is the observed fact that DR2.1 renders both field sets in a single form rather than splitting the pages. Note also that buildGroups' per-group showPackages is not itself the blocker — a mixed consignment already yields different showPackages per commodity group — so 'the frontend cannot express this' is really about the per-line optional/mandatory status split and the differing field sets, not about group construction.

- Screens: dr21-consignment-details-germinal-mixed, dr21-what-are-you-importing-germinal-mixed
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/view-model/groups.js:24`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:99`
- Confidence: high
- Falsified by: The mixed capture showing germinal and live commodities on separate pages, or a per-line status mechanism already present in buildGroups.

**20. Document count cap disagrees: the frontend obligation allows 10, DR2.1 states and enforces 15.**

obligations/sections/documents.js:19-28 declares `requires.maxEntries: 10` with error code `obligation.accompanyingDocument.tooMany`, and the comment at :5 records the spec as '0 and 10 accompanying documents'. contracts/max-documents.js:3 re-exports it, so the page cap and the invariant are the same number. DR2.1 sets `MAX_UPLOADED_DOCUMENTS = 15` (routes.js:8537) and tells the user 'up to a maximum of 15 files' (upload-documents.html:168). One of the two is wrong; the frontend comment notes the Confluence source still reads as if there is at most one document, so the authoritative figure needs establishing before either side moves.

- Screens: fe-documents-empty, dr21-upload-documents
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/documents.js:25`
- Prototype: `app/routes.js:8537`
- Confidence: high
- Falsified by: A Confluence or spec source naming one figure, at which point the other side is simply out of date.

**21. Number of animals is mandatory in the prototype but saves blank in the frontend, which its own test asserts as intended behaviour.**

The prototype rejects an empty count outright: validateNumberOfAnimals pushes 'Enter the number of animals' when `!value` (routes.js:821-828) and 'Enter a whole number greater than 0' for a non-integer or zero (:830-836), for every non-germinal species.

The frontend validates with `integerInRange(animalsField(index), { min: 1, ... })` (fields.js:21-24), and that validator's Joi chain is `Joi.string().trim().allow('')` before the custom integer check (lib/validate/validators.js:126-131) — `allow('')` short-circuits, so blank passes. This is not an oversight: the frontend's own controller test names it, 'Should leave a blank count out of the drop check — unanswered means uncapped, not zero', and asserts the post succeeds with `numberOfAnimalsQuantity` stored as `''` (consignment-details.controller.test.js:150-168).

So the two sides hold deliberately opposite positions and the frontend's is load-bearing for its identifier-cap logic: obligations/sections/commodities/identifiers.js:98-101 requires the unit-record count to equal numberOfAnimals, and a blank count is what currently means 'uncapped'. Making the field mandatory has a knock-on into that invariant, which is why this is `needs-design-decision` rather than a one-line validator change.

- Screens: fe-consignment-details / dr21-consignment-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/fields.js:21-24`
- Prototype: `GB-notification-service/app/routes.js:821-828`
- Confidence: high
- Falsified by: Joi's `allow('')` not short-circuiting the `.custom()` chain, which would mean the frontend already rejects blanks — the controller test at :150-168 asserting a successful save with `''` rules that out.

**22. The prototype hub never blocks a task: every row is always a link with a two-state tag, while the frontend gates rows behind entry conditions and shows 'Cannot start yet'.**

The frontend's hub is a gated task list: rowGatePasses/sectionGatePasses can strip the link and render 'Cannot start yet', and the status vocabulary has five values. DR2.1's hub has no gating at all — every row links out immediately and the only two tags are 'Complete' and 'To do'. This is not a copy tweak; removing gating changes what a user can reach out of order, and collapsing to two states removes 'In progress' and 'Optional' signalling. Note the prototype's hub is bespoke app-notification-hub-tasklist markup (notification-hub.html:82-97) rather than govukTaskList, which is why the gated variant simply has no representation there — treat the two-state model as an intentional design position to confirm, not as prototype sloppiness, because it matches the two-state model used on the review page too.

- Screens: fe-hub
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/hub/controller.js:65-68 (CANNOT_START_STATUS), :95 (blockedRowItem drops the href), :120-122 (rowGatePasses decides); hub/copy/copy.en.js:11-17 (five statuses: Completed, Optional, In progress, Not yet started, Cannot start yet)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/routes.js:5472-5473 (only statusComplete/statusTodo exist), :5489-5504 (every item carries an unconditional href)`
- Confidence: high
- Falsified by: Confirmation that DR2.1's ungated hub is a prototype convenience (so testers can jump anywhere) rather than the intended behaviour; the frontend gating would then stand.

**23. A mixed consignment is never asked the storage Temperature question even though it contains germinal goods**

showTemperatureQuestion is hasGerminalProductsOnly, which requires every selected species to be germinal (routes.js:3775-3787, used at routes.js:1179). On a mixed consignment the flag is false, so storageTemperature is never asked and is actively nulled on save (routes.js:9038-9040) — the germinal goods in that consignment carry no temperature at all. Either temperature belongs per commodity line rather than per consignment, or mixed consignments are not a supported combination; the prototype does not say which. This has to be settled before the temperature field is modelled, because the answer decides whether it is a scalar or a line-scoped obligation. Marked medium because the prototype may simply not have exercised the mixed case rather than having ruled on it.

> **Corrected by verification:** The screens list is loose: dr21-additional-animal-details-germinal is a germinal-only capture and the two mixed captures are consignment-details/what-are-you-importing, so no captured screen actually shows the mixed additional-details page. The claim rests entirely on the source, as the finding's own caveat concedes.

- Screens: dr21-consignment-details-germinal-mixed, dr21-what-are-you-importing-germinal-mixed, dr21-additional-animal-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/additional-details/template.njk:13`
- Prototype: `GB-notification-service/app/routes.js:3775`
- Confidence: medium
- Falsified by: A mixed-consignment additional-details capture showing the Temperature radios, or a per-line storageTemperature in the session shape.

**24. The prototype gives commodities with no typed identifier no identification panel at all; the frontend asks them for free-text Identification details and Animal description.**

A divergence running the other way, recorded because it will surface the moment the catalogue is filled out.

The frontend has an inverse-gated fallback pair: `identificationDetails` and `description` apply on units whose commodity is in none of the four typed-identifier allowlists (identifiers.js:174-198, using `notInUnionOf`). With today's five-commodity stub that fires only for Fish, which is why the captured screen shows 'Identification details' and 'Animal description' inputs under Salmo salar.

The prototype has no such fallback. buildAnimalIdentificationSpeciesPanels returns `null` when `getIdentifierFieldsForSpecies(speciesId)` is empty (routes.js:1563-1567), so the nine prototype commodities with `identifiers: []` — chicken, turkey, duck, goose, guinea fowl, rabbit, camel, ostrich, parrot, reptile, bees, ornamental fish — get no identification panel and are never asked for an identifier.

Confidence `medium` on the interpretation, not the facts: the code on both sides is unambiguous, but which behaviour is right is a policy question about whether every animal in a consignment must be individually identified. Raising it now because filling the catalogue turns a one-commodity edge case into a twelve-commodity behaviour difference.

> **Corrected by verification:** Two factual slips to fix, neither changing the conclusion. (1) The early return is not in buildAnimalIdentificationSpeciesPanels — that function is at routes.js:1683 and drops nulls via `.filter(Boolean)` at :1716. The `if (fields.length === 0) return null` is in getSpeciesIdentificationState at routes.js:1564-1566 (the cited 1563-1567 window is right, the function name is not). (2) 'the nine prototype commodities with identifiers: []' should be twelve — the finding itself then lists twelve and later says 'twelve-commodity behaviour difference'. I confirmed twelve: chicken, turkey, duck, goose, guinea fowl, rabbit, camel, ostrich, parrot, reptile, bees, ornamental fish. Sheep and goat are NOT in that set (they carry an inline ear-tag identifier), and germinal commodities are not either (they resolve by code).

- Screens: fe-animal-identification / dr21-animal-identification-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/commodities/identifiers.js:174-198`
- Prototype: `GB-notification-service/app/routes.js:1563-1567`
- Confidence: medium
- Falsified by: A default identifier field applied by the prototype to commodities with an empty `identifiers` array — the early `return null` at routes.js:1565-1567 rules that out, so this would only be falsified by a policy source saying poultry and fish need no per-animal identifier.

**25. The two sides disagree about which commodities get a Tattoo field — the frontend offers it for cattle, the prototype does not.**

The frontend's `TATTOO_COMMODITIES = ['Cat', 'Dog', 'Cow']` (stub.js:109), gating the tattoo obligation at obligations/sections/commodities/identifiers.js:127-135. The prototype's 0102 entry lists exactly two identifiers, `ear-tag` and `passport` (commodity-identifiers.js:9-12) — no tattoo. The two sides agree on 01061900 (Cat/Dog: prototype gives microchip, passport, tattoo — the frontend gives passport and tattoo, the microchip gap being the previous finding).

So the frontend renders a Tattoo input on cattle identification records that the prototype's design does not. Confidence is `medium` rather than `high` because a divergence in this direction may be the frontend being right and the prototype's cattle entry being incomplete — this needs a ruling from whoever owns the IPAFFS identifier mapping, not a unilateral removal.

- Screens: fe-animal-identification / dr21-animal-identification-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:109`
- Prototype: `GB-notification-service/app/data/commodity-identifiers.js:9-12`
- Confidence: medium
- Falsified by: A source of truth (the V4 data-fields spec or an IPAFFS extract) showing tattoo is a valid cattle identifier, which would make the prototype the stale side and close this with no frontend change.

**26. The unweaned-animals question applies to different commodities on each side — the frontend asks it for horses, the prototype does not, and the prototype asks it for pigs.**

The frontend gates the question on `UNWEANED_ANIMAL_COMMODITIES = ['Cow', 'Horse']` (stub.js:117), consumed by `unweanedApplies` in features/additional-details/controller.js:31-34.

The prototype drives it from per-commodity `unweanedOptions` data, and only two commodities declare it: Cattle (commodities.js:20) and Pig (commodities.js:54). The horse entry at commodities.js:26-43 has no `unweanedOptions` key at all, so horses do not trigger it. The prototype adds a second suppression the frontend has no equivalent of: routes.js:1159-1161 returns no options when every selected commodity code is 01061900, so a Cat/Dog/Ferret-only consignment skips the question even if some other rule would have fired.

Cattle agrees on both sides. The horse divergence is a straight contradiction and needs a ruling. The pig half is blocked behind the catalogue finding — the frontend has no pig commodity to gate.

- Screens: fe-additional-details / dr21-additional-animal-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:117`
- Prototype: `GB-notification-service/app/data/commodities.js:20`
- Confidence: medium
- Falsified by: A `unweanedOptions` key on the prototype's horse commodity (there is none at commodities.js:26-43), or a spec source confirming unweaned applies to equines — either would make the frontend correct and close the horse half.

### flow-change

**27. Adding an address from a picker returns to the picker with the new address pre-selected and a success banner in the prototype; the frontend commits it and drops the user back on the hub with no confirmation.**

This is the ruling on the unpaired `fe-create-address`. The page bodies are NOT comparable — the prototype's Add flow is the shared, unversioned `/address-book/add` (reached as `/address-book/add?from=<section>`, consignment-address-select.html:161-165 via routes.js:3549, and `?from=contact-address` at routes.js:1972) which is a multi-step address-book journey (type → lookup → manual fallback → usage: routes.js:9222-9330), whereas the frontend's is a single in-journey form (create-address.njk / create-address.controller.js:39-49). Diffing those page bodies would be comparing a service-level address book against a journey page.

What IS comparable, and is a real gap, is the hand-off contract. Prototype: `setAddressBookConsignmentReturn` stashes the section id, path, heading and a suggested address type (routes.js:7681-7702); on completion it writes the address into the section's session keys — i.e. pre-selects it — and sets a success message (routes.js:7796-7818, specifically 7808 and 7817), which the picker renders as a `govukNotificationBanner` (consignment-address-select.html:31-38). Frontend: after saving, `create-address.controller.js:213-214` adds the record to the stub book and redirects to `party.returnSlug`, which is `'addresses'` — the hub — for all five parties (features/addresses/parties.js:19,26,33,40,48). The user lands on the hub with no confirmation message and, if they wanted a different row, no selection carried.

- Screens: fe-create-address, fe-address-picker-consignee, fe-contact, dr21-address-select-consignee, dr21-contact-address-for-consignment
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/create-address/create-address.controller.js:213-214`
- Prototype: `GB-notification-service/app/routes.js:7796-7818`
- Confidence: high
- Falsified by: `returnSlug` pointing back at the party's own picker slug, or a success/notification banner appearing on the frontend picker after create. Falsified as a frontend task if the ruling is that add-address belongs wholly to the address book service.

**28. DR2.1 restructured the notification into a six-part spine (About the consignment / Description of the goods / Transport and arrival / Documents / Consignment parties / Contact address); the frontend hub uses a different six and the check-answers page uses only four.**

Three separate structural moves, all consistent across the prototype's hub and review page: (a) commodity/species content becomes its own top-level section '2. Description of the goods' instead of living inside section 1; (b) Documents moves from last to 4th, ahead of the address sections, and renders unconditionally — the frontend drops the whole Documents section when no documents exist (check-answers/view-model/sections/documents.js:10-12); (c) 'Addresses' splits into '5. Consignment parties' (roles and addresses) and '6. Contact address'. Card grouping moves with it: the prototype has a distinct 'Main reason for import' card (Reason for import + Purpose in the market) under section 1 and an 'Additional details' card (Certified for + Includes unweaned animals) under section 2, whereas the frontend puts all four rows in one 'Additional animal details' card (check-answers/view-model/cards/consignment/additional-animal-details.js:16-56). The hub and the check-answers page must move together — today they already disagree with each other (six groups vs four sections), so this is one restructure across both.

- Screens: fe-hub, fe-check-answers, fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/hub/copy/copy.en.js:18-25 (groups: 1. About the consignment, 2. Commodity details, 3. Movement, 4. Addresses, 5. Documents, 6. Check and submit); hub/controller.js:33-49 (GROUPS row assignment); features/check-answers/copy/copy.en.js:35-40 (sections: 1. About the consignment, 2. Movement, 3. Addresses, 4. Documents); check-answers/view-model/index.js:14-19`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/routes.js:5485-5577 (hub sections 1-6); app/views/design-release-2.1/review-notification.html:72, 85, 98, 108, 125, 132 (same six on the review page)`
- Confidence: high
- Falsified by: A design ruling that the DR2.1 section spine is presentational only and the frontend's grouping is the agreed target; or evidence that DR2.1 has since reverted to a four-section review.

**29. Germinal identification is a single always-editable form with no add-another loop, no saved-records table, and it never reports itself complete**

For germinal, getSpeciesIdentificationState forces an active editable form even when every field is filled (routes.js:1596-1603), returns savedAnimals: [] and savedAnimalsTable: null, and hardcodes isComplete: false (routes.js:1610-1628). The captured germinal page has no saved-records table and no 'Save and add another'. The frontend card is built entirely around the opposite shape: a saved-units summary list, a counter, an at-max message and a 'Save and add another' button (_identification-card.njk:26-77), with the page-level 'Save and finish' at animal-identification.njk:19-25. The isComplete: false constant is the part needing a ruling — it means a germinal panel can never settle, which reads as an unfinished prototype branch rather than an intended rule.

- Screens: dr21-animal-identification-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/animal-identification/_identification-card.njk:71`
- Prototype: `GB-notification-service/app/routes.js:1596`
- Confidence: high
- Falsified by: isComplete being computed rather than constant for germinal, or a germinal capture showing a saved-records table.

**30. The prototype address picker shows the whole role list on one page and filters it live as the user types; the frontend paginates five per page behind a Search submit button.**

Frontend: `PAGE_SIZE = 5` (services/address-book/index.js:26) with server-side slicing (index.js:56-72), a `govukPagination` block (party-picker/_address-picker.njk:64-66, view-model/pagination/index.js:11-13) and a secondary 'Search' submit that re-posts the form (_address-picker.njk:86-91). The template comment at _address-picker.njk:8-12 states the no-JS constraint explicitly. The deltas show this as only-frontend links '1','2','8','Next page' and only-frontend button 'Search' on all five pickers.

Prototype: no pagination anywhere in consignment-address-select.html; the search control is `type="search"` with a `type="button"` icon and a `data-module="app-consignment-address-search"` hook (consignment-address-select.html:70-91) whose JS hides non-matching rows on every `input` event and rewrites a live count (app/assets/javascripts/consignment-address-search.js:31-47). Above the table sits an h2 'Select an address' and 'Showing X out of Y results' (consignment-address-select.html:93-98) — the h2 is the only-prototype heading in every picker delta.

This needs a ruling because the prototype's filter has no server fallback: adopting it verbatim would drop the frontend's no-JS baseline. The portable half is 'one page, no pagination, count above the table'.

> **Corrected by verification:** Keep the finding; amend the rationale sentence. The prototype does have server-side filtering (routes.js:3507-3524, driven by a `?search=` query string at :3570) — what it lacks is any no-JS control on the page that reaches it (the search button is `type="button"`, and a no-JS Enter POST discards the query and redirects to the hub). Adopting the prototype's picker verbatim would therefore still drop the frontend's stated no-JS baseline; the portable half remains 'one page, no pagination, count above the table'.

- Screens: fe-address-picker-place-of-origin, fe-address-picker-consignor-or-exporter, fe-address-picker-consignee, fe-address-picker-importer, fe-address-picker-place-of-destination, dr21-address-select-place-of-origin, dr21-address-select-consignor-or-exporter, dr21-address-select-consignee, dr21-address-select-importer, dr21-address-select-place-of-destination
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/party-picker/_address-picker.njk:64-91`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-address-select.html:70-98`
- Confidence: high
- Falsified by: Pagination appearing in the prototype's consignment-address-select template, or a progressive-enhancement fallback in consignment-address-search.js. Also falsified if the frontend's address book is expected to grow past a size where a single page is viable.

**31. The prototype asks reason for import and all four of its follow-up questions on one page as conditional reveals; the frontend spreads them across five sequential pages.**

Verifying the capture lead: the frontend does offer the same four branches, so no question is missing. buildImportReasonItems (routes.js:8290-8333) attaches reveals to Internal market, Transhipment or onward travel, Transit and Temporary admission horses; the frontend's obligation gates fire on exactly the same reasons - purposeInInternalMarket on internalMarket, destinationCountry on transit or transhipmentOrOnwardTravel, portOfExit on transit or temporaryAdmissionHorses, exitDate on temporaryAdmissionHorses (obligations/sections/import-reason.js:43-116). The five radio labels and all five hints are word-for-word identical (import-reason/copy/copy.en.js:4-14 vs app/data/import-reasons; see fe-import-reason.json:49-79 against dr21-reason-for-import.json:69-99). The divergence is purely presentational: the frontend's consignment section is importReason, importPurpose, destinationCountry, portOfExit, exitDate as separate pages (flow.js:48-58), the prototype has one page. Folding them in reverses the frontend's one-thing-per-page structure, changes back-link and hub task-row behaviour (flow/task-rows.js:34-37 currently groups importReason with importPurpose and the three movement pages as a separate row), and needs a ruling before any code moves.

> **Corrected by verification:** Two path/scope nits that do not change the finding: the obligations file is at sets/live-animals/obligations/sections/import-reason.js, not under journeys/linear/; and flow.js:48-58 defines a six-page consignment section - importReason, importPurpose, destinationCountry, portOfExit, exitDate and additionalDetails - of which five are the reason plus its four gated follow-ups.

- Screens: fe-import-reason, fe-import-purpose, dr21-reason-for-import, dr21-reason-for-import-internal-market-revealed
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/flow/flow.js:48`
- Prototype: `app/views/design-release-2.1/reason-for-import.html:47`
- Confidence: high
- Falsified by: If the design intent is that DR2.1's reveal layout is a prototype-only convenience and the built service should keep one question per page, this is a no-op and only the h1/caption copy carries over.

**32. The prototype's part-complete hub after using a template cannot be reproduced: the frontend's commodities task row spans two pages the template only half-fills.**

Verified: using a template does pre-complete hub tasks. Against a fresh hub where all ten rows read 'To do' (dr21-notification-hub.json:134-179), the post-template hub shows eleven rows with five Complete — 'Where is this consignment coming from?', 'What are you importing?', 'Main reason for import', 'Additional details' and 'Roles and addresses' (dr21-use-template-landing.json:134-190). That falls out of the seed at routes.js:6626-6686. But the split does not map onto the frontend. The prototype completes 'What are you importing?' while leaving 'Commodity details' To do; the frontend has ONE commodities row covering both commoditiesPage and consignmentDetailsPage, statused as a whole (task-rows.js:29-33, rowStatus at :66-67). The seed writes a species selection (routes.js:6647) and no commodity-line quantities anywhere in :6626-6686, so that single row would resolve to IN_PROGRESS, not FULFILLED (bridge/status/index.js:66-70 — required parts present, some started, none complete). The prototype's clean 'three green then a blue' hub is therefore not achievable without either splitting the commodities row or accepting a part-done tag. Someone has to rule which.

> **Corrected by verification:** One nuance worth carrying: the IN_PROGRESS outcome is a sound inference from the row's declared parts, not something observed — nobody has run a seeded frontend journey. The row's status derives from the commodityLines collection parts rather than from page completion, so the ruling needed is specifically about that collection's quantity leaves. Cite bridge/status/index.js:68-76 for requiredPartsStatus.

- Screens: dr21-use-template-landing
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/flow/task-rows.js:29-33`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:6626-6686`
- Confidence: high
- Falsified by: A template fixture that carries commodity-line quantities, or a ruling that an IN_PROGRESS commodities row is the intended reading.

**33. The transporter pairing in pairs.js is wrong: fe-transporter-type's counterpart is dr21-transporter-add, not dr21-transporter, and DR2.1 sits the type question one step deeper in the flow.**

transporters.njk:23-48 renders `govukRadios({ name: 'transporterType', ... Commercial / Private })` under the legend 'What type of transporter will move the animals?'. dr21-transporter-add.html:32 is `<h1>Choose a transporter type</h1>` over the same `transporterType` radios (transporter-add.html:60-81, options from app/data/transporter-types.js:1-11). That, not dr21-transporter, is the same question. Consequently the 16 deltas on the fe-transporter-type / dr21-transporter pair are almost entirely an artefact of comparing two unrelated pages (a type question against a selection table) and should not be treated as page-level findings. The real flow delta: DR2.1 asks type only after the user has failed to find the transporter in the list, as a sub-flow of 'add a new transporter' (routes.js:10086-10118 -> /transporter/add/private | /transporter/add/commercial, each with `backLink: '/transporter/add'` at routes.js:3328 and 3364), and each add-form ends in 'Cancel and return to dashboard' (transporter-add-private.html:51, transporter-add-commercial.html:55) rather than the journey's overview link — the add sub-flow is deliberately outside the notification journey. The frontend asks type first and treats both branches as in-journey pages.

> **Corrected by verification:** Corrected claim: fe-transporter-type has TWO DR2.1 counterparts, not one — dr21-transporter for its guidance block and dr21-transporter-add for its type question. Keep the existing pair and additionally pair fe-transporter-type against dr21-transporter-add rather than swapping. The surviving, actionable finding is the flow-change alone: DR2.1 asks transporter type only after the user has failed to find the transporter in the /transporter list, inside an 'add a new transporter' sub-flow whose cancel exits to the dashboard (routes.js:3308-3320 returns '/'), whereas the frontend asks type first as an in-journey page. Note this substantially overlaps finding 1 and should be merged with it. Drop the 'the 16 deltas are almost entirely an artefact' de-scoping — it is inverted.

- Screens: fe-transporter-type, dr21-transporter, dr21-transporter-add
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/transporters/transporters.njk:23`
- Prototype: `app/views/design-release-2.1/transporter-add.html:32`
- Confidence: high
- Falsified by: dr21-transporter-add turning out to collect a different question from fe-transporter-type, or the DR2.1 route table showing /transporter/add reachable before /transporter.

**34. The prototype confirms cancelling an amendment in an in-page modal on the notification view; the frontend navigates to a dedicated confirm page.**

The pairing fe-cancel-amend / dr21-notifications-cancel-amend is materially mismatched — the captured prototype screen is the submitted-notification view with the amend modal, not a cancel-amend page — so nearly all of that delta file's 33 only-prototype summaryRows and 32 headings are pairing artefacts, not gaps. The real difference underneath is the interaction pattern: a modal that requires JavaScript versus a server-rendered page. GDS guidance favours a page, so this is a design ruling on which pattern DR2.1 actually intends, plus a no-JS position if the modal wins. Note the prototype is itself inconsistent here: delete is a page (delete-notification.html) while cancel-amend is a modal.

- Screens: fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/cancel-amend/template.njk:4-18 (a full page with h1, body and a POST form); check-answers/template.njk:54-58 (a 'Cancel amendment' link that navigates away)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/review-notification.html:143-147 (a button with data-modal-open) and :158-160 (the modal include); app/views/partials/design-release-2.1/cancel-amend-modal.html:20-31 ('Are you sure you want to cancel this amendment?' with 'Yes, cancel amendment' and a 'Go back' dismiss button)`
- Confidence: medium
- Falsified by: A DR2.1 cancel-amend page view existing that the cartographer did not capture; I found only the modal partial and its include.

### copy-change

**35. DR2.1 promises a 50MB upload limit that the frontend cannot deliver — its 10MB cap is set by the CDP ingress, not by choice.**

upload-config.js:40-45 sets MAX_FILE_SIZE_MB = 10 with the comment '10 MB decimal (not MiB) so the user-facing "10 MB" hint is literally accurate and we stay ~485 KB clear of the CDP nginx ingress 10 MiB cap'. The hint the user sees is built from that constant (template.njk:43-49). DR2.1's hint bullets are 'files that are smaller than 50MB', the same eight file types, 'up to a maximum of 15 files' and 'ZIP files are not allowed for security reasons' (upload-documents.html:166-169). The 50MB figure is not a design preference the frontend has failed to implement — it is unachievable without changing the platform ingress configuration, so the prototype copy is making a promise the service cannot keep. Note the allowed type list matches exactly (upload-config.js:3-18: PDF, DOC, DOCX, JPEG, JPG, PNG, XLS, XLSX), and ZIP is already excluded by that allowlist; only the explicit ZIP callout is missing from the frontend hint.

> **Corrected by verification:** One evidential caveat for whoever rules on this: the '10 MiB CDP nginx ingress cap' is asserted solely by the frontend's own code comment (upload-config.js:40-41). I did not verify any platform configuration, and per the guard rails could not. Everything mechanical — 10 vs 50, the identical type list, the missing ZIP callout — is verified.

- Screens: fe-documents-empty, dr21-upload-documents
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/documents/upload-config.js:42`
- Prototype: `app/views/design-release-2.1/upload-documents.html:166`
- Confidence: high
- Falsified by: An ingress configuration change raising the CDP cap, or DR2.1 being corrected to 10MB.

**36. DR2.1 tells the user commercial transporters can only be Northern Irish; the frontend states no such restriction.**

Frontend hint for the Commercial option: 'A business approved to transport animals — you will choose one from a list' (copy.en.js:78-81). DR2.1 hint: 'This can only be a commercial transporter from Northern Ireland.' (transporter-types.js:7-10). That is a policy assertion, not a rewording — it narrows who may be selected and contradicts the frontend's own stub data, which contains Swiss and Belgian commercial transporters (services/address-book/stub/commercial-transporter.js:1-23). DR2.1 also reverses the option order (Private first) and renames the option to 'Private transporter'.

> **Corrected by verification:** If anything understated. DR2.1 does not merely hint the restriction, it enforces it: routes.js:2915 sets COMMERCIAL_TRANSPORTER_COUNTRY = 'Northern Ireland', the commercial add form's Country select is rendered disabled over a hidden fixed value (transporter-add-commercial-fields.html:185-201), and the address lookup is fed northernIrelandAddresses (routes.js:3374-3378). One counter-note for the ruling: the hint also contradicts DR2.1's own saved-transporter data — app/data/transporters.js carries Romanian, Irish and Danish Commercial records — so the contradiction is not only with the frontend stub.

- Screens: fe-transporter-type, dr21-transporter-add
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/copy/copy.en.js:80`
- Prototype: `app/data/transporter-types.js:9`
- Confidence: high
- Falsified by: Confluence or policy confirming the NI restriction is prototype-only exploratory copy, or confirming it and showing the frontend's non-NI stub records are placeholders.

**37. Every prototype journey page carries a section caption above the h1; no frontend journey page has one.**

Raised once as a service-wide pattern, not per page. In my four screens the prototype captions are "About the consignment" on origin (origin-of-the-import.html:39) and reason for import (reason-for-import.html:41), and "Consignment parties" on CPH (cph-number.html:32). The same construction appears on 24 further DR2.1 views with captions "Movement", "Transport and arrival", "Commodity details", "Documents", "Description of the goods" and "Add a new transporter". The frontend's journey templates go straight to the h1 (origin/template.njk:10, cph-number/template.njk:14-18, import-reason/template.njk:13-19) and the only govuk-caption-l anywhere in the live-animals set is on the address party picker (features/addresses/party-picker/party-picker.njk:7). Adopting captions needs the caption vocabulary agreed against the hub's task-group names first, or the two will drift apart.

> **Corrected by verification:** Not "every" prototype journey page: 6 of the 31 design-release-2.1 views carry no caption at all - contact-address-for-consignment, declaration, review-notification, notification-submitted, delete-notification and view-template. And "24 further views" overstates: 25 view files in total mention a caption (the 3 cited plus 22 others), and several of those are card or summary captions such as "Total number of packages in this consignment", "Action needed" and "Dashboard", not page-header section captions. Also note the mined models record caption: null on both sides for all three pages, because the miner keys on govuk-caption-* and the prototype uses app-*-page__caption - the evidence here is source and raw-DOM level, not model level.

- Screens: fe-origin, fe-import-reason, fe-import-purpose, fe-cph-number, dr21-origin-of-the-import, dr21-reason-for-import, dr21-cph-number
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/origin/template.njk:10`
- Prototype: `app/views/design-release-2.1/origin-of-the-import.html:39`
- Confidence: high
- Falsified by: If the prototype's captions do not map onto the hub's existing task groups, adopting them creates two competing section taxonomies and the finding becomes a hub-restructuring question rather than a copy one.

**38. Every prototype page in this band carries a section caption above the H1; the frontend has captions on one page in the entire service.**

SERVICE-WIDE — raised once here, not once per page, and it reaches well beyond this band.

All four prototype pages in the band open with a caption paragraph naming the journey section: 'About the consignment' (what-are-you-importing.html:38), 'Description of the goods' (consignment-details.html:45), 'About the consignment' (animal-identification-details.html:47), 'Commodity details' (additional-animal-details.html:37). Grepping the prototype's design-release-2.1 views for 'caption' shows the same pattern on origin-of-the-import, roles-and-addresses, transporter, transit-countries, permanent-address and the dashboards — it is the release's standard page header.

The frontend renders a bare `<h1 class="govuk-heading-l">` on all four (search.njk:10, consignment-details.njk:9, animal-identification.njk:9, additional-details/template.njk:8). A grep for `govuk-caption` across the whole live-animals set returns exactly one hit: features/addresses/party-picker/party-picker.njk:7.

The mechanical differ could not see this — it records `caption: null` on both sides, because the prototype's caption uses a bespoke `app-*__caption` class rather than `govuk-caption-l`, so the cartographer did not classify it as one. Flagged `needs-design-decision` because the section names themselves are a content-design artefact (they must match whatever the hub/overview calls each section), not a mechanical copy port.

- Screens: fe-commodity-search / dr21-what-are-you-importing, fe-consignment-details / dr21-consignment-details, fe-animal-identification / dr21-animal-identification-details, fe-additional-details / dr21-additional-animal-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/search/search.njk:10`
- Prototype: `GB-notification-service/app/views/design-release-2.1/what-are-you-importing.html:38`
- Confidence: high
- Falsified by: A caption rendered by the frontend's shared/layout.njk for all journey pages — the captured DOM for all four frontend screens shows none, and the models record `caption: null`.

**39. On a germinal-only identification page the grid header switches to 'Number of packages' but the per-panel change link still reads 'Change number of animals'**

Lead 4 confirmed and I rule it a prototype defect, not a design intent. quantityColumnLabel is computed per consignment — 'Number of packages' when there are germinal rows and no live-animal rows (routes.js:8415-8419) — and drives the grid header (animal-identification-details.html:65). changeCountLabel next to it is the string literal 'Change number of animals' with no germinal branch (routes.js:1624), rendered at animal-identification-details.html:98; the capture shows both, inconsistent, on the same page. The frontend has neither element — its identification page is a list of per-line cards with no selected-commodities grid and no per-card change link (animal-identification.njk:21-23) — so the ruling matters only as an instruction not to copy the prototype string when the grid is built. Raised because it is the one place where copying DR2.1 verbatim would import a bug.

> **Corrected by verification:** Correct as evidence, but it implies no frontend change today — the frontend has neither the grid nor the link, so this is a note not to copy the prototype string if and when a selected-commodities grid is built, rather than a parity gap to close.

- Screens: dr21-animal-identification-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/animal-identification/animal-identification.njk:21`
- Prototype: `GB-notification-service/app/routes.js:1624`
- Confidence: high
- Falsified by: A germinal capture where the change link reads 'Change number of packages', or a germinal branch on changeCountLabel in routes.js.

**40. The dashboard doubles as the service start page — h1, intro paragraph and start button — where the prototype's dashboard is a named landing page with two entry actions and no service description.**

The frontend h1 is the service name "Import notification service" (copy.en.js:2), followed by a service-description paragraph (copy.en.js:3-6) and a govuk start button "Start a new notification" posting to /notifications (template.njk:30-33, controller.js:115-119). The prototype uses a caption "Dashboard" over an h1 naming the commodity scope, "Live animals & germinal products", drops the service description entirely, and offers two side-by-side actions: a primary "Create new notification" and a secondary "Use notification template". The h1 wording is a design decision the frontend cannot simply adopt — it names germinal products, which the frontend does not yet support (that is the germinal-products band) — and the secondary action belongs to the unbuilt templates band. The caption/h1 pattern and dropping the intro paragraph are independently actionable.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:27-33`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:46-63`
- Confidence: high
- Falsified by: A decision to keep the frontend dashboard as the service start page, in which case only the caption pattern applies.

**41. The delete-confirmation page names the notification and sets an expectation about delayed effect in the prototype; the frontend page is generic and instant.**

Two changes. The h1 becomes reference-bearing, which matters on a destructive confirm reached from a dashboard row — the user should see which notification they are deleting. And the prototype promises eventual consistency: up to a minute, refresh the dashboard. That second paragraph is only honest copy if the frontend's delete is also asynchronous; if the frontend deletes synchronously the sentence must not be copied across, so the increment needs a ruling on the actual delete semantics rather than a straight lift.

- Screens: fe-delete-notification
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/delete-notification/copy/copy.en.js:2-3 (title 'Delete this notification?', body 'This cannot be undone.')`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/delete-notification.html:24 (h1 'Confirm you want to delete {{ notificationReference }}'), :26-27 ('You will not be able to undo this action.' and 'It will take up to 1 minute for the action to take effect. Refresh your dashboard page to see the change to this notification's status.')`
- Confidence: high
- Falsified by: The frontend's delete being synchronous and immediately reflected on the dashboard, which would make the one-minute paragraph wrong to port.

**42. The DR2.1 declaration text has been substantively rewritten and expanded; the frontend still carries the shorter earlier wording.**

Three concrete differences. (1) The prototype adds 'I am complying with the requirements of Regulation (EU) 2017/625 including on animal health and welfare.' under the contact heading (declaration.html:42) — absent from the frontend entirely. (2) The frontend compresses responsibility into one sentence ('...until it has cleared border control checks or reached the place of destination.', copy.en.js:5-6); the prototype splits it into a short heading plus 'I am responsible from the submission of this notification to when it enters Great Britain. And I am responsible until it has either:' and a two-item list ('cleared official checks at the border' / 'reached the Place of Destination as stated on the health certificate or notification') — declaration.html:46-51. The 'from submission to entry into GB' start point is new. (3) The accountable-for bullets are reworded and qualified: 'any payment for the official controls at the border', 'any arrangements to re-dispatch the consignment', 'any costs needed for quarantine or isolation of consignments', 'any costs needed for destruction and disposal of consignments, when instructed by the authorities' (declaration.html:57-60) against the frontend's terser four (copy.en.js:8-13). This is legal declaration text, so it needs a policy sign-off rather than a straight copy lift. Note the mechanical differ did not surface (2) or (3): it does not diff the `lists` key, and its `paragraphs` selector missed the prototype's app-declaration-page__section-text paragraphs, which is why the delta file wrongly shows those paragraphs as frontend-only.

- Screens: fe-declaration
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/declaration/copy/copy.en.js:3-18 (three headings, one four-item bullet list, no supporting paragraphs under the first two headings); declaration/template.njk:10-24`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/declaration.html:40-64 (three sections, each heading followed by supporting text and/or bullets)`
- Confidence: high
- Falsified by: Confirmation that the frontend's declaration wording is the legally approved version and DR2.1's is an unreviewed draft.

**43. The frontend calls the second party 'Consignor or exporter'; the prototype calls it 'Consignor' on the hub, in the picker heading and in the add link.**

Frontend: `consignor: { title: 'Consignor or exporter', … }` (features/addresses/copy/copy.en.js:21-22), which supplies both the hub row key and the picker h1 (features/addresses/controller.js:33, party-picker/party-picker.controller.js:39,45).

Prototype: the same section is `heading: 'Consignor'` with `linkText: 'Add a consignor'` (consignment-address-sections.js:17,19), fed to both the hub section heading (roles-and-addresses.html:49) and the picker h1 (consignment-address-select.html:42 via routes.js:3537). Only the internal section id retains `consignor-or-exporter`.

The delta records this as a scalar h1 mismatch — it is the one h1 disagreement in the whole band, and it is a term change, not a rewording: 'or exporter' names a second legal role that the prototype has dropped from the user-facing label. That is a content-design call, not a mechanical rename, because the hint on both sides says only 'This is the sender of the consignment.'

- Screens: fe-addresses-hub, fe-address-picker-consignor-or-exporter, dr21-roles-and-addresses, dr21-address-select-consignor-or-exporter
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/copy/copy.en.js:21-22`
- Prototype: `GB-notification-service/app/data/consignment-address-sections.js:16-19`
- Confidence: high
- Falsified by: The prototype using 'Consignor or exporter' anywhere user-facing, or a data-fields source (Live Animals Data Fields V4) that mandates the longer term.

**44. The reason-for-import page heading is the question itself in the frontend and a short topic heading in the prototype, with the question demoted to a visually hidden legend.**

The frontend's h1 is the radios legend promoted with isPageHeading - "What is the main reason for importing the animals?" (copy.en.js:3, template.njk:13-19). The prototype heads the page "Main reason for import" (reason-for-import.html:42) and marks the same question as a govuk-visually-hidden legend (:52-54). This is consequential on the one-page-with-reveals decision: once four follow-up question groups share the page, the h1 can no longer be one of the questions. Ruling on the reveal layout rules on this heading too.

> **Corrected by verification:** Worth adding for the ruling: the frontend already owns a short topic string - copy.en.js:2 is title: 'Reason for import', which is what the document title and breadcrumb use (fe-import-reason.json title). So the change is which existing string becomes the h1, not the authoring of new copy.

- Screens: fe-import-reason, dr21-reason-for-import
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/import-reason/copy/copy.en.js:3`
- Prototype: `app/views/design-release-2.1/reason-for-import.html:42`
- Confidence: high
- Falsified by: If the reveal layout is rejected and the frontend keeps a page per question, GDS guidance favours the question as the h1 and the prototype's heading is the wrong pattern to copy.

**45. Three of the four page titles in the band differ, and the two sides disagree on how the packages field's optionality is worded.**

Bundled as one copy increment because these are the same decision made four times, not four decisions.

H1 and page title: 'Consignment details' vs 'Commodity details' (frontend copy.en.js:16 rendered at consignment-details.njk:9; prototype consignment-details.html:3 and :46). 'Animal identification details' vs 'Identification details' (copy.en.js:43; animal-identification-details.html:3 and :48). 'Additional animal details' vs 'Additional details' (additional-details/copy/copy.en.js:2; additional-animal-details.html:9 and :38). The prototype consistently drops the 'animal' qualifier — consistent with germinal products being in its catalogue, where 'animal' would be wrong. Only 'What are you importing?' matches on both sides.

The packages label carries a different signal on each side: 'Number of packages (optional)' (copy.en.js:32) against 'Number of packages (when required)' (app/data/commodities.js:22, repeated per commodity). Under GDS conventions '(optional)' is a specific promise; '(when required)' says something different and vaguer, so the two cannot simply be reconciled by picking the shorter.

Also in scope for the same increment: the certification hint, "You'll find this on the health certificate." (additional-details/copy/copy.en.js:5) against 'This information can be found on the ITAHC.' (additional-animal-details.html:54) — a plain-English versus domain-abbreviation choice a content designer should make once.

- Screens: fe-consignment-details / dr21-consignment-details, fe-animal-identification / dr21-animal-identification-details, fe-additional-details / dr21-additional-animal-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/copy/copy.en.js:16`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:3`
- Confidence: high
- Falsified by: A content-design source ruling the frontend's titles correct and the prototype's stale, which would close the H1 half — the packages and ITAHC halves would still stand.

**46. Address entry forms disagree on two field labels service-wide: the frontend says 'Postal or zip code' and 'Telephone number', the prototype says 'Postcode or Zip code' and 'Phone number'.**

Raised once as a service-wide pattern. Frontend: `postalOrZipCode: 'Postal or zip code'`, `telephoneNumber: 'Telephone number'` (features/addresses/copy/copy.en.js:74,76-77) with matching error text 'Enter a postal or zip code' (copy.en.js:85) and 'Enter a telephone number' (copy.en.js:87); the same labels are repeated for the per-animal permanent address at features/commodities/copy/copy.en.js:102,105.

Prototype: 'Postcode or Zip code' and 'Phone number' in every address form it has — address-book-manual-address-fields.html:64,102, permanent-address-new-address-fields.html:64,86, transporter-add-private-fields.html:62,100 and transporter-add-commercial-fields.html:176,223. It also hints the phone field with 'For international numbers include the country code' (address-book-manual-address-fields.html:105), which the frontend has no equivalent of. The prototype's own 'Zip' mid-sentence capital is not sentence case, so this needs a content-design ruling rather than a straight copy of the prototype string.

The transporter forms carry the same labels, so this overlaps the transport band — it should be one ticket, not two.

> **Corrected by verification:** Trim the frontend citation to features/addresses/copy/copy.en.js:74,76 (line 77 is emailAddress, not part of the claim). Everything else stands as written.

- Screens: fe-create-address, dr21-permanent-address-select
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/addresses/copy/copy.en.js:74-77`
- Prototype: `GB-notification-service/app/views/partials/address-book-manual-address-fields.html:64,102`
- Confidence: medium
- Falsified by: Either side changing its labels, or content design ruling the frontend's wording correct — in which case the finding inverts into a prototype defect rather than frontend work.

**47. Dashboard sort offers a different option set from the prototype and requires an explicit "Update sort" submit the prototype does not have.**

The frontend offers four explicit sorts — Arrival (newest to oldest), Arrival (oldest to newest), Date created (newest to oldest), Date created (oldest to newest) — mapped to backend sort values arrivalDate,desc|asc and createdAt,desc|asc, with a default of arrivalDate,desc and a secondary "Update sort" button to apply them (template.njk:63-82, copy.en.js:27-36). The prototype offers a "Select one" placeholder plus Newest first / Oldest first / Arrival date, labelled "Sort by:", inside the same GET form as the search with no dedicated sort submit (dashboard.html:118-129). The prototype set is ambiguous ("Newest first" by what date? "Arrival date" in which direction?) so this is a design decision, not a straight copy swap — but the frontend's default sort and the presence of a placeholder option are genuinely different behaviours. Confidence is medium because the prototype's own testing variant (routes.js:6431-6437) uses the frontend's four-option wording, suggesting the DR2.1 set may not be settled.

> **Corrected by verification:** Two corrections. (1) The testing variant is at routes.js:6430-6437 (buildDashboardSortItems), not 6431-6437, and it does NOT use 'the frontend's four-option wording' — it uses ['Arrival (newest to oldest)', 'Arrival (oldest to newest)', 'Newest first', 'Oldest first']. Only two of the four labels match the frontend; the frontend's 'Date created (newest to oldest)/(oldest to newest)' appear nowhere in the prototype. That weakens, but does not remove, the 'DR2.1 set may not be settled' argument. (2) The prototype does still require a submit — the icon search button at dashboard.html:111 posts the whole GET form including the sort select. The accurate claim is that the frontend has two independent forms with two submit buttons where the prototype has one combined form with one submit; there is no auto-apply on either side.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/notification-helper.js:7-12`
- Prototype: `GB-notification-service/app/data/dashboard-notifications.js:147-152`
- Confidence: medium
- Falsified by: A design note confirming DR2.1's three-option sort is illustrative only and the frontend's four explicit sorts are the intended pattern.

**48. The prototype's review page labels the arrival date 'Arrival date at destination' while its own input page labels the same field 'Arrival date at port of entry' — a prototype inconsistency that leaves the correct frontend label undecided.**

The prototype reads one value, sessionData.arrivalDateAtPort, and labels it two different ways: 'at port of entry' where it is captured, 'at destination' on the review page. The frontend is internally consistent ('at port of entry' in both places). So this is not a frontend gap until someone rules which date is meant — and if 'at destination' is correct, it is a data-model question, not a label. The neighbouring row is a plain rewording in the same area: prototype 'Means of transport to the port of entry' (routes.js:4417) against frontend 'Means of transport'. Report back to the design team as a prototype defect alongside the ruling.

- Screens: fe-check-answers
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/check-answers/copy/copy.en.js:70-71 (arrivalDate 'Arrival date at port of entry', meansOfTransport 'Means of transport'), consistent with features/transport/copy/copy.en.js:5`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/routes.js:4413 (review row key 'Arrival date at destination' reading sessionData.arrivalDateAtPort) against app/views/partials/arrival-date-picker.html:9 (the input for that same field is labelled 'Arrival date at port of entry')`
- Confidence: medium
- Falsified by: DR2.1 intending two distinct dates (arrival at port and arrival at destination) with the prototype simply not yet capturing the second — in which case this becomes an add-field, not a copy change.

**49. The templates list's sort control is inert and borrows notification vocabulary that does not apply to a template.**

The govukSelect on dashboard-templates.html:48-59 sits outside any form, so nothing submits it, and the view model reads query.sort only to echo it back into sortItems — templates is a straight map over the fixture and is never ordered (routes.js:6767-6782). The options come from the notification dashboard's list (routes.js:6438 -> dashboardData.sortItems) and the capture records them as Newest first / Oldest first / Arrival date (dr21-dashboard-templates.json:161-179); a template has no arrival date. There is also no search or filter on the templates page at all. The frontend dashboard by contrast has a working GET sort form with four notification-specific options (dashboard/template.njk:63-82, copy/copy.en.js:27-36) and a keyword search aside (template.njk:38-56). Building the templates list means deciding what a template sorts and searches by — last used, created, name, commodity — rather than porting the notification set.

> **Corrected by verification:** Two small factual tightenings: the captured select also carries a leading empty 'Select one' option (four options in total, not three), and the templates page does have one working control — a 'Create new template' button at dashboard-templates.html:35-38 — so 'inert' applies to the sort select specifically, not to the page's controls generally.

- Screens: dr21-dashboard-templates
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:63-82`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/dashboard-templates.html:48-59`
- Confidence: medium
- Falsified by: A DR2.1 change that wraps the templates sort select in a form and orders the list, which would make the options a deliberate choice rather than a copy artefact.

## Needs backend work first

### add-page

**1. DR2.1 opens the transporter journey with a searchable list of saved transporters; the frontend has no such page and jumps straight to the type question.**

The `transport` flow section (flow.js:69-75) is portOfEntry -> transitCountries -> transporters -> transportersSelect -> privateTransporterDetails. `transportersPage` (features/transport/page.js:11-14) renders the type radios (transporters.njk:23-48) as the first transporter screen. DR2.1's first transporter screen is `/transporter` (routes.js:10078), which renders a search box plus a table of saved transporters with columns Select / Name / Address / Approval number / Type / Status, a green `Approved` or blue `New` tag per row, a `View details` link per row, and an `Add a transporter` secondary button (transporter.html:75-165). The list is fed by `getAllTransporters` (routes.js:2861) = session-added transporters concatenated with `app/data/transporters.js`, which holds BOTH Commercial and Private records, each with an approval number and a status. The frontend has no equivalent surface: the only transporter list it owns is a two-record commercial-only stub (services/address-book/stub/commercial-transporter.js:1-23) rendered as radios inside transportersSelect. Building this needs a persisted, org-scoped transporter store with approval-number and approval-status attributes, which does not exist today.

> **Corrected by verification:** Two cosmetic overreaches: the 'New' tag is purple, not blue (application.scss:3933-3936 sets #491644 on #efdfed), and getAllTransporters is defined at routes.js:2860 (the return is 2861). Also worth scoping precisely: the frontend transporters page already carries DR2.1's transporter-page guidance block verbatim (transporters.njk:8-18 vs transporter.html:48-62), so the missing surface is the search field, the saved-transporter table and the 'Add a transporter' affordance — not the page's guidance content.

- Screens: fe-transporter-type, dr21-transporter
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/flow/flow.js:70`
- Prototype: `app/views/design-release-2.1/transporter.html:108`
- Confidence: high
- Falsified by: Finding a route or template in the frontend that lists saved transporters of both types with an approval status, or a decision record retiring the DR2.1 transporter book in favour of the type-first flow.

**2. The frontend cannot add a commercial transporter at all — DR2.1 has a full create form including a transporter authorisation number the frontend never collects.**

fe-transporter-commercial ('Search for an approved commercial transporter', copy.en.js:89) is a closed radio set: `oneOf('commercialTransporter', addressBook.parties('commercialTransporter').map(o => o.id), ...)` (transporters-select.controller.js:22-28), rendered from the same fixed list (:55-67) and committed by copying name/address/approvalNumber off the chosen stub record (:77-83). There is no escape hatch when the transporter is absent. DR2.1's dr21-transporter-add-commercial is a create form (transporter-add-commercial.html:45-61) whose fields (partials/transporter-add-commercial-fields.html) are: Transporter authorisation number (:8-17), Name or organisation name (:19-28), an address-book address lookup with 'Enter address manually' fallback (:30-123), Address line 1/2, Town or city, County, Postcode or Zip code, Country (:130-201), then an 'Enter contact details' section with Email address and Phone number (:204-233). Validation is enforced (routes.js:3150-3193). The authorisation number in particular is user-entered in DR2.1 and read-only-from-stub in the frontend. Delivering this needs a write path to a transporter/address-book store, not just a page.

- Screens: fe-transporter-commercial, dr21-transporter-add-commercial
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/transporters-select/transporters-select.controller.js:22`
- Prototype: `app/views/partials/transporter-add-commercial-fields.html:8`
- Confidence: high
- Falsified by: Finding a frontend route that creates a commercialTransporter record, or a ruling that commercial transporters remain a reference-data-only list the trader can never extend.

**3. The frontend has no templates capability at all: six prototype routes and four screens have no counterpart in the route registry or the path space.**

features/index.js:55-85 is the complete route registry for the live-animals journey — 29 controllers spread over allRoutes, none of them templates. shared/paths.js:1-15 is the whole path space the frontend knows: `/notifications/{journeyId}[/slug]`, `/notifications`, and `/`. There is no /templates helper and nothing to hang one on. The prototype mounts six routes at routes.js:9068-9101 (list, create GET+POST, view GET+POST, use) backed by three views under app/views/design-release-2.1/ (dashboard-templates.html, create-template.html, view-template.html) plus a card partial. Entry to all of it is the DR2.1 service nav 'Templates' item (app/views/layouts/main.html:82-84) and a secondary dashboard button 'Use notification template' (app/views/design-release-2.1/dashboard.html:57-61); the frontend dashboard offers exactly one action, 'Start a new notification' (features/dashboard/copy/copy.en.js:7). This is the umbrella increment — three new non-journey pages registered in allRoutes but not dispatchPages, in the manner of the existing dashboard and notification-actions features.

> **Corrected by verification:** Two corrections. (1) 'Four screens' is inherited from compare/pairs.js onlyPrototype, but the fourth — dr21-use-template-landing — is the notification hub in a seeded state (its capture records url /design-release-2.1/notification-hub, h1 'Overview'), which does have a frontend counterpart in fe-hub. The finding's own detail is right where its headline is wrong: this is three new non-journey pages plus one entry-point redirect. (2) The path-space file is at src/server/app/shared/paths.js (16 lines), not under journeys/linear/shared/ as the detail implies; its content is as described — pagePath / hubPath / createPath / dashboardPath only, no /templates helper. Also the prototype's dashboard button block is dashboard.html:56-60.

- Screens: dr21-dashboard-templates, dr21-create-template, dr21-view-template, dr21-use-template-landing
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/index.js:55-85`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/routes.js:9068-9101`
- Confidence: high
- Falsified by: A templates controller appearing in allRoutes in features/index.js, or a /templates path helper in shared/paths.js.

**4. There is no "Changes in past 24 hours" view — the prototype's /changes page, grouping recently-changed notifications by status-change category, has no frontend counterpart.**

The prototype mounts GET /changes (routes.js:9196-9198) rendering h1 "Changes in past 24 hours" under the caption "Status updates", described as "Notifications that have progressed, or been validated, rejected, cancelled, or replaced in the past 24 hours". Unlike the other dashboard views it has no search, sort or filter — it is a set of headed sections looped from `sections`, each holding notification cards, with category headings including "Passed inspection" and "Needs inspection" (routes.js:5730-5731). The frontend has no notion of a status-change event: the list DTO carries a current status only, no transition history or change timestamp (real/marshal/list-item.js:7-18, which sets submittedAt to null unconditionally). This needs a backend status-history feed before the page can exist.

- Screens: dr21-dashboard-changes
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/paths.js:3-10`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard-changes.html:27-49`
- Confidence: high
- Falsified by: The backend already exposing notification status-transition events with timestamps.

**5. There is no "Tasks requiring your attention" view — the prototype's /actions page, reached from the At a glance card, has no frontend counterpart.**

The frontend's path surface is journey pages, the hub, create and the dashboard at '/' — there is no list view scoped to notifications needing action. The prototype mounts GET /actions (routes.js:9192-9194) rendering h1 "Tasks requiring your attention" with the description "Add missing information or upload documents to prevent your consignment from being delayed", the same search + sort toolbar as the dashboard, and an extra `delayFilter` radio group "Needs action to avoid delays" with counted options Today / Next 3 days / Already delayed (dashboard-actions.html:86-103, routes.js:6928-6940). Both the needs-action predicate and the delay buckets are new backend concepts — the marshalled list row has no such flags (real/marshal/list-item.js:7-18).

- Screens: dr21-dashboard-actions
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/paths.js:3-10`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard-actions.html:31-41`
- Confidence: high
- Falsified by: A frontend route serving a filtered action-needed list, or a backend field marking a notification as needing action.

**6. There is no "Consignments due at the border control post" view — the prototype's /inspection page, including its BCP guidance details, has no frontend counterpart.**

The prototype mounts GET /inspection (routes.js:9200-9202) rendering h1 "Consignments due at the border control post (BCP)" under the caption "Inspection required", with the description "Consignments that must go to your chosen BCP for inspection", a govukDetails "What to do at a border inspection" carrying an outbound link to the GOV.UK SPS-checks-at-BCPs guidance, and the standard search + sort toolbar over a filtered card list (routes.js:7081-7105). The frontend has no inspection concept anywhere in the journey or the list DTO. Confidence is medium rather than high on the increment shape only: the prototype dashboard computes a `chosenForInspection` glance count (routes.js:6918) but the dashboard template does not render a third glance card, so it is unclear whether this page is reachable in the intended DR2.1 IA or is a stranded view.

- Screens: dr21-dashboard-inspection
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/shared/paths.js:3-10`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard-inspection.html:31-49`
- Confidence: medium
- Falsified by: Finding a link to /inspection from the DR2.1 dashboard or nav, which would raise confidence; or a decision that inspection outcomes are out of scope for the importer-facing service.

### add-section

**7. The dashboard has no "At a glance" section — the prototype's two counted summary cards (Action needed, Status updates) and their onward links do not exist in the frontend.**

The frontend template goes straight from the h1 and intro paragraph (template.njk:27-28) to the start-button form and then "Your notifications" (template.njk:35). The prototype inserts a section with h2 "At a glance" and two article cards carrying a title, a description, a live count and a link — Action needed / "Tasks requiring your attention" → /actions, and Status updates / "Changes in the past 24 hours" → /changes. The counts come from routes.js:6914-6921 (`glanceCounts.actionNeeded`, `glanceCounts.statusChange`), derived from getDashboardActionNotifications and getDashboardStatusChangeNotifications. The frontend's list DTO carries no equivalent aggregate: the real persistence read passes only page, sort and referenceNumber (services/persistence/records/real/lifecycle/read.js:23-31) and the marshalled row has no action or status-change flags (real/marshal/list-item.js:7-18). Both counts need new backend aggregation before the section can show real numbers.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:27-35`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:65-83`
- Confidence: high
- Falsified by: A backend /notifications endpoint already returning per-user counts of notifications needing action or changed in the last 24 hours.

**8. The dashboard has no additional-filters panel — the prototype's date-range radios, start/end date pickers, By type select and Status select are all absent.**

The frontend's entire filter surface is an aside headed "Filter notifications" containing one text input (referenceNumber) and a Search button. The prototype wraps four controls in a govuk details "Additional filters": dateRange radios (Today / Tomorrow / Next seven days, routes.js:6825-6831), two mojDatePicker inputs startDate and endDate, a `type` select (Live animals / Plants / Products of animal origin, routes.js:6833-6840) and a `status` select (Draft / Action required / Submitted / Completed, routes.js:6842-6849), each defaulting to a "Select one" placeholder. The panel opens automatically when any filter is set (dashboard.html:132, routes.js:6960). None of these query parameters are accepted by the frontend list call (read.js:23-31), so each filter needs a backend predicate. Note also the moj date picker is a new component dependency for the frontend.

> **Corrected by verification:** Strike the closing sentence 'the moj date picker is a new component dependency for the frontend'. The frontend already ships it: @ministryofjustice/frontend 10.0.1 in package.json:72, the MOJ views path is on the Nunjucks search path at src/config/nunjucks/nunjucks.js:14, the DatePicker JS is imported at src/client/javascripts/application.js:9, and its SCSS at src/client/stylesheets/application.scss:2. The date pickers are drop-in; no new dependency work.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard, dr21-dashboard-filters-open
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:38-56`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:132-211`
- Confidence: high
- Falsified by: The backend /notifications endpoint already supporting date-range, commodity-type and status query parameters.

**9. The dashboard notification list is undivided — the prototype's In progress / Drafts / Completed tabs, with a count on the active tab and a matching section subheading, have no frontend counterpart.**

The frontend renders one flat list of all non-deleted journeys (controller.js:61, template.njk:85-159) under a single "Your notifications" h2, with only a results-range label as a toolbar. The prototype splits the same list into three govuk-tabs partitions plus a per-partition h3 subheading ("Notifications in progress" / "Draft notifications" / "Completed notifications", dashboard.html:227 fed by routes.js:6909-6913), with the in-progress tab carrying a bold count. The partition predicate is `reviewVariant` (routes.js:6870-6874). The frontend's list call has no tab/status parameter (engine/journey.js:89-95 → real/lifecycle/read.js:23-31) and would need either a status filter on the backend query or a total-count-per-status response to render the counts correctly across pages.

> **Corrected by verification:** The bold count renders on the In progress tab specifically — dashboard.html:220 guards it with `{% if tabItem.id == "in-progress" %}`, so it shows regardless of which tab is active — not 'on the active tab'. tabItems (routes.js:6889-6908) computes a count for all three tabs, but only the in-progress one is rendered.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:59-83`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:215-227`
- Confidence: high
- Falsified by: The backend /notifications list already accepting a status filter and returning per-status totals, which would make this frontend-only.

**10. The prototype models a post-submission 'action required' state — outstanding items listed on the confirmation page, a distinct status tag and a warning on the notification view — which the frontend does not model at all.**

DR2.1 lets a user submit before everything is done and then tracks the residue: the confirmation page lists what is outstanding, the notification carries a 'Submitted action required' status, and the notification view shows a warning ('You need to upload a health certificate' in the captured DOM). The frontend has none of this — its readiness gate requires the whole task list to be satisfied before check-answers is even reachable, so an incomplete submission cannot exist. This is the single biggest behavioural gap in the band and it is not frontend-only: the status and the outstanding-item set have to be persisted or derived server-side. The 'Submission complete' status (routes.js:5028-5031) is a fourth state with no frontend counterpart either.

- Screens: fe-confirmation, fe-check-answers, fe-cancel-amend
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/confirmation/template.njk:4-12 (panel then straight to 'Transporting the consignment' — no outstanding-items block); src/server/app/shared/copy.en.js:47-52 (statuses are only Draft, Submitted, Amending, Deleted); src/server/app/flow/section-status.js:11-15 (readyForCheckYourAnswers demands every row be FULFILLED/NA/OPTIONAL — submission is all-or-nothing)`
- Prototype: `~/git/defra/defra-design/GB-notification-service/app/routes.js:5410-5428 (getConditionalSubmissionItems: missing documents, incomplete animal identifiers), :5444-5455 (isIncompleteSubmission); app/views/design-release-2.1/notification-submitted.html:27-37 ('Before the consignment is imported' / 'You still need to:'); routes.js:5032-5035 ('Submitted action required' status), :5047-5049 (warning text on the notification view)`
- Confidence: high
- Falsified by: A ruling that live animals will not permit incomplete submission (unlike DR2.1), or evidence that the backend already returns a status set including an action-required value.

### add-collection

**11. Nothing on either side can persist a template — the records port is entirely notification-shaped and the prototype's templates are a hard-coded fixture.**

'Collection' here means a new persisted resource on the records port, NOT a repeating journey collection in the add-a-collection.md sense — that recipe does not apply. The records port exposes create/load/list/has/replaceFulfilment/finalise/amend/cancelAmend/copy/softDelete/clear (real/index.js:11-23), every one of them keyed to a notification reference. The backend agrees: NotificationController.java:32 mounts /notifications, NotificationFulfilmentsController.java:30 mounts /notification-fulfilments, and grep over src/main/java finds no template resource. On the prototype side the four templates are a module-level literal (dashboard-templates.js:1-129) read only through getDashboardTemplateById (routes.js:6446-6448); no code path ever writes to it. So the prototype demonstrates the shape of a template record without demonstrating that one can be stored. Templates need an org-scoped store of their own, in the way the address book got one, before any of the three pages can do more than render fixtures.

- Screens: dr21-dashboard-templates, dr21-create-template, dr21-view-template
- Frontend: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/app/services/persistence/records/real/index.js:11-23`
- Prototype: `/Users/samfarrington/git/defra/defra-design/GB-notification-service/app/data/dashboard-templates.js:1-129`
- Confidence: high
- Falsified by: A template endpoint in trade-imports-animals-backend, or a prototype route that mutates dashboardTemplates.

**12. The frontend commodity catalogue contains no germinal-product commodities, so every germinal screen in DR2.1 is unreachable from the real frontend**

COMMODITY_OPTIONS is ['Cow','Horse','Cat','Dog','Fish'] (stub.js:1) with 8 species total (stub.js:15-26); the captured frontend picker offers exactly those 8 checkboxes. DR2.1 adds 15 germinal commodities under CN codes 05119985 and 05111000, each with 1-4 species carrying a Latin label plus an optional commonName (commodities-germinal-products.js:19-147), concatenated onto the live catalogue at routes.js:49. The frontend already anticipates them: PACKAGE_COUNT_COMMODITIES lists 12 germinal entries such as '05119985 - Embryos/Ova - Cattle' and '05111000 - Semen - Cattle' (stub.js:58-62, 96-102), and the obligation comment at lines.js:74-75 states outright that 'only entries that are picker names can ever match a stored selection'. So the gate exists and is permanently dead. Nothing else in this band can be built until the catalogue can express a germinal commodity+species selection. Where that catalogue comes from (the stub, or trade-imports-reference-data) is the backend question.

> **Corrected by verification:** Real, but the banding is loose in one respect: the catalogue is a frontend-owned stub file (services/commodities/stub.js), so making germinal commodities selectable is itself a frontend edit, not a backend-blocked one. The genuine backend question is where the real germinal catalogue comes from (reference-data vs stub) and how a germinal line maps into the notification payload — not whether the picker can be extended. Increment type 'add-collection' also reads oddly for what is a catalogue-data extension plus the downstream field/obligation work.

- Screens: dr21-what-are-you-importing-germinal-catalogue, dr21-what-are-you-importing-germinal, dr21-what-are-you-importing-germinal-mixed
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:1`
- Prototype: `GB-notification-service/app/data/commodities-germinal-products.js:19`
- Confidence: high
- Falsified by: Any germinal commodity, or any 05119985/05111000 code, being selectable from the frontend commodity picker.

**13. The frontend's commodity catalogue is a five-entry stub; the prototype carries 21 live-animal commodities under their real IPAFFS names, so the frontend cannot express most consignments.**

The frontend's `COMMODITY_OPTIONS` is `['Cow', 'Horse', 'Cat', 'Dog', 'Fish']` (stub.js:1), with 8 species across all five (stub.js:15-26) — and the file's own comment at :12-14 admits the non-Cow entries 'carry one representative species each so the batch search can select across commodity codes', i.e. it was never meant to be the real catalogue.

The prototype's commodities.js holds 21: Cattle 0102, Horse 0101, Pig 0103, Sheep 010410, Goat 010420, Chicken/Turkey/Duck/Goose/Guinea fowl 0105xx, Cat/Dog/Ferret/Other live mammals 01061900, Rabbit 010614, Camel 010613, Ostrich 010633, Parrot 010632, Reptile 010620, Bees 01064100, Ornamental fish 030111 — each with its own species list, identifier set and certification-purpose options. Species depth differs by an order of magnitude too: prototype cattle carry 11 species (commodities-0102-species.js, visible in the results capture as African buffalo / Banteng / Bison / Musk ox / Yak / Water buffalo …) against the frontend's four for Cow.

The naming vocabulary also diverges and will show on every screen in the band: the frontend renders `Cow (0102)` and the bare Latin name `Bos taurus`, the prototype renders `Cattle (0102)` and `Domestic cattle (Bos taurus)` (commodities.js:12, and getSpeciesSortLabel in app/utils/commodity-search-data.js:1-7 which composes commonName + label). Filling the catalogue from a real reference-data source is the backend half; the naming convention is a design call that rides along with it.

> **Corrected by verification:** One phrase is overstated: 'the naming vocabulary ... will show on every screen in the band'. It shows on three — search, commodity details, identification (dr21 headings 'Cattle (0102)' vs fe 'Cow (0102)'). Additional details renders no commodity or species name on either side, so it is unaffected. Also note the prototype's identification panel heading uses the bare Latin 'Bos taurus' too, same as the frontend — the commonName composition only applies to the search list and summary labels.

- Screens: fe-commodity-search / dr21-what-are-you-importing, fe-consignment-details / dr21-consignment-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/services/commodities/stub.js:1-26`
- Prototype: `GB-notification-service/app/data/commodities.js:9-291`
- Confidence: high
- Falsified by: A commodities service in the frontend that reads a real reference-data feed at runtime with stub.js used only as a test fixture — the stub is imported directly by services/commodities/index.js:1-15, so this would be visible there.

### add-field

**14. Commodity details is missing the germinal-product quantity fields — the prototype asks for net weight, type of package and number of packages instead of number of animals.**

The capture worker's lead is CORRECT but needs one important correction: DR2.1 does validate netWeight, packageType and numberOfPackages, but those three are germinal-product-only, not universal, and they *replace* numberOfAnimals rather than sitting alongside it.

Proof on the prototype side: consignment-details.html:108 branches on `species.isGerminalProduct` — the true branch renders `netWeight[<speciesId>]` with a `kg` suffix (:113-128), a `packageType[<speciesId>]` govukSelect (:130-142) and `numberOfPackages[<speciesId>]` (:144-156); the false branch renders only `numberOfAnimals[<speciesId>]` plus optional packaging fields (:160-187). Every one of the three validators guards on germinal: validateNumberOfPackages (routes.js:897-899), validateNetWeight (routes.js:932-934) and validatePackageType (routes.js:967-969) all `return` early unless `isGerminalProductCommodity(match.commodity)`. The package-type list is 26 options (app/data/package-types.js:3-30).

The frontend renders only Number of animals and Number of packages (_species-quantities.njk:11-33) and validates only those two (consignment-details/fields.js:18-34). There is no net weight and no package type anywhere in the set. `needs-backend` because net weight and package type are new persisted commodity-line attributes, not view-layer work.

- Screens: fe-consignment-details / dr21-consignment-details
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/_species-quantities.njk:11-33`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:108-156`
- Confidence: high
- Falsified by: Finding netWeight or packageType handling in the frontend's commodity-line model or backend payload mapping; or finding that the prototype applies these three fields to live animals as well as germinal products (which the three early-return guards rule out).

**15. Dashboard search is scoped to reference number only, where the prototype searches keyword, notification number, commodity and consignee/importer.**

The frontend field is named `referenceNumber`, labelled "Keyword or reference", carries no hint, and is passed straight through as a `referenceNumber` query parameter to the backend list endpoint (real/lifecycle/read.js:27-31). The prototype field is named `search`, labelled "Search by", and carries the hint "Keyword, notification number, commodity or consignee/importer" — a materially wider predicate. The current label already over-promises ("Keyword") relative to what the backend matches, so this is a correctness gap as well as a parity one: the copy cannot honestly change until the backend widens the match. The prototype also submits via an icon-only button with aria-label "Search" inside the input (dashboard.html:111-115) rather than the frontend's separate govukButton.

- Screens: fe-dashboard-empty, fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/copy/copy.en.js:9-14`
- Prototype: `GB-notification-service/app/views/design-release-2.1/dashboard.html:98-110`
- Confidence: high
- Falsified by: The backend's referenceNumber parameter already performing a free-text match across commodity and party names rather than a reference match.

**16. Germinal identification asks Donor ID, Collection date and Identification number — none of the six frontend identifier fields, and the frontend has no date-typed identifier**

commodityIdentifiersByCode gives both germinal codes the same three fields: donor-id (text), collection-date (type 'date', hint 'For example, 27/3/2026') and identification-number (text) (commodity-identifiers.js:21-30), resolved ahead of the commodity's own empty identifiers array by getIdentifierFieldsForSpecies (routes.js:1455-1461). The capture shows collection-date rendered through the MOJ datepicker (moj-js-datepicker-toggle plus a full calendar grid). The frontend's identifier set is passport, tattoo, ear tag, horse name, identification details, description (copy.en.js:58-79), every one a plain text input capped at 58 characters by maxText (identifier/fields.js:35-44) — there is no date-typed identifier anywhere. The datepicker itself is not the gap: @ministryofjustice/frontend 10.0.1 is already a dependency (package.json:72). The backend gap is real though — the mapper carries only earTag and passport off the first unit (species-entry.js:16-17), so donor ID, collection date and identification number have nowhere to go.

- Screens: dr21-animal-identification-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/copy/copy.en.js:58`
- Prototype: `GB-notification-service/app/data/commodity-identifiers.js:21`
- Confidence: high
- Falsified by: A date-typed identifier field or a donorId/collectionDate key existing in the frontend identifier set or notification mapper.

**17. Germinal lines ask Net weight in kilograms — a field the frontend has neither in its form nor in its backend payload**

Per donor species: a govukInput named netWeight[<speciesId>] with label 'Net weight', a govuk suffix of 'kg' and width-5 (consignment-details.html:113-128). It is mandatory — validateNetWeight requires a value matching /^\d+(\.\d+)?$/ greater than 0, with errors 'Enter the net weight' and 'Enter a number greater than 0' (routes.js:925-958); the errors capture shows both firing. Values are also summed into a consignment total (getTotalNetWeight, routes.js:3760-3773) and rendered as '<n> kg' on review (routes.js:4122). The frontend's quantity block renders only numberOfAnimals plus an optional packages input (_species-quantities.njk:11-33), and no source file under src/ mentions netWeight at all; the persistence mapper's per-species entry carries only value/text/noOfAnimals/noOfPackages/earTag/passport (species-entry.js:9-19), so there is no payload key to carry it.

> **Corrected by verification:** One sub-claim is wrong: 'the errors capture shows both firing'. dr21-consignment-details-germinal-errors.json's error summary contains 'Enter the net weight' twice (once per species) — the 'Enter a number greater than 0' message appears in no capture at all. The mandatory-ness is observed; the range message is a source reading only.

- Screens: dr21-consignment-details-germinal, dr21-consignment-details-germinal-mixed, dr21-consignment-details-germinal-errors
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/_species-quantities.njk:11`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:113`
- Confidence: high
- Falsified by: A netWeight key appearing in notification-mapper/shared/lines/species-entry.js, or a net-weight input in any live-animals feature template.

**18. Germinal lines ask Type of package from a fixed 26-item list — the frontend has no package-type field and no such reference list**

A govukSelect named packageType[<speciesId>], label 'Type of package', items built by buildPackageTypeItems (routes.js:574-587) = a 'Select one' placeholder plus the 26 entries of app/data/package-types.js:3-30 (Bag … Vial, including 'Container, not otherwise specified as transport equipment' and 'In Bulk'). Mandatory: validatePackageType rejects anything not in the list with 'Select a type of package' (routes.js:960-984). The frontend has no select on this page at all — the only conditional element in the quantity block is a second number input (_species-quantities.njk:22-33) — and no package-type list exists in the commodities service (services/commodities/index.js:17-61). Like net weight there is no payload key for it (species-entry.js:9-19).

- Screens: dr21-consignment-details-germinal, dr21-consignment-details-germinal-mixed, dr21-consignment-details-germinal-errors
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/commodities/consignment-details/_species-quantities.njk:22`
- Prototype: `GB-notification-service/app/views/design-release-2.1/consignment-details.html:130`
- Confidence: high
- Falsified by: A package-type list in services/commodities or a packageType key in the notification mapper.

**19. The dashboard notification card omits the quantity, the commodity category label and the inspection tag that the prototype card carries.**

The frontend card shows Commodity, Origin, Arrival at destination, Consignee, Consignor, Status, Date created and Date submitted, built from view-model/row/index.js:10-29. The prototype card shows Commodity, Arrival date, Consignee, Notification status, then a quantity field whose key varies by commodity type ("Number of animals" for live animals, "Number of packages" for germinal products — card partial:52-53, data/dashboard-notifications.js:15/33), Origin, Consignor, and a conditional Inspection field rendering a "Required" tag (card partial:63-70). It also puts a category label — "Live animals" or "Germinal products" — above the reference (card partial:9-10). None of quantity, category or inspection is present in the frontend's marshalled list row (real/marshal/list-item.js:7-18), even though numberOfAnimals exists in the journey's own consignment-details data — so the list endpoint has to start returning them. The prototype card also has an error variant with a marker and an errorMessage line (card partial:2-22) that the frontend has no equivalent for.

- Screens: fe-dashboard-populated, dr21-dashboard
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/dashboard/template.njk:113-153`
- Prototype: `GB-notification-service/app/views/partials/design-release-2.1/dashboard-notification-card.html:24-72`
- Confidence: high
- Falsified by: The backend NotificationDto list shape already carrying an animal/package count and an inspection flag, which would make the quantity and inspection rows frontend-only.

### obligation-change

**20. On a germinal-only consignment DR2.1 removes the certification-purpose question entirely and asks a mandatory Temperature question instead; the frontend asks certification unconditionally and has no temperature field**

getAdditionalAnimalDetailsConfig sets showTemperatureQuestion = hasGerminalProductsOnly(sessionData) and showCertificationPurposeQuestion = !showTemperatureQuestion (routes.js:1177-1189), so the two are mutually exclusive. The captured germinal page carries a single radio group, storageTemperature, legend 'Temperature', options Ambient/Chilled/Frozen (routes.js:43), and it is required for the section to count complete (routes.js:1223-1227). storageTemperature is a consignment-level scalar, not per line. The frontend renders animalsCertifiedFor unconditionally (additional-details/template.njk:13-24) and the obligation is a bare status:'mandatory' scalar with no applyTo (misc.js:26-30). Two changes: gate animalsCertifiedFor on 'not every line germinal', and add a storageTemperature scalar gated the other way — which also needs a payload home, as additional-details currently binds only containsUnweanedAnimals and animalsCertifiedFor (additional-details/evaluation.js:10-16).

- Screens: dr21-additional-animal-details-germinal
- Frontend: `trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/sections/misc.js:26`
- Prototype: `GB-notification-service/app/routes.js:1177`
- Confidence: high
- Falsified by: A germinal capture showing the certification-purpose radios, or storageTemperature appearing per line rather than per consignment.

### flow-change

**21. DR2.1 saves an added private transporter into a reusable transporter book (and optionally the address book); the frontend stores it only on the notification.**

The two forms are field-for-field equivalent (frontend private-transporter-details.njk:16-90 vs prototype partials/transporter-add-private-fields.html:5-110 — same nine fields, only the internal name prefixes and two label wordings differ), so the 29 mechanical deltas on this pair are overwhelmingly naming noise. The real difference is what happens on submit. The frontend builds `privateTransporterRecord(values)` and commits it into journey answers (private-transporter-details.controller.js:140-158) — one-shot, per-notification, never reusable. DR2.1's `saveAddedTransporter` (routes.js:3267-3306) unshifts the record onto `sessionData.addedTransporters` so it appears in the /transporter table on every subsequent notification (surfaced via getAllTransporters, routes.js:2861), and when the flow was entered from the address book it also writes an address-book entry under `category: 'transporter'` (routes.js:3222-3264, 3282-3298). DR2.1 therefore treats private transporters as reusable party records; the frontend treats them as free text.

> **Corrected by verification:** The aside understates the form differences slightly: beyond the internal name prefixes and the two label wordings ('Postal or zip code' vs 'Postcode or Zip code', 'Telephone number' vs 'Phone number'), DR2.1 also inserts an 'Enter contact details' h2 (transporter-add-private-fields.html:85), swaps the email/phone order relative to the frontend, and attaches the phone hint that finding 13 covers. The nine fields themselves are the same set, and the submit-behaviour claim — the substance of the finding — is fully verified.

- Screens: fe-transporter-private, dr21-transporter-add-private
- Frontend: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/transport/private-transporter-details/private-transporter-details.controller.js:140`
- Prototype: `app/routes.js:3267`
- Confidence: high
- Falsified by: A frontend call to addressBook.addParty (or equivalent) on the private transporter path, or a decision that transporter reuse is out of scope for this service.

## Dropped by verification

- **The prototype dashboard shows a back link where the frontend dashboard, being the service root, shows breadcrumbs.**
  - The finding's own falsifier fires, and I confirmed it independently. dashboard.html:24-27 is exactly govukBackLink({ text: 'Back', href: '/' }). The prototype's '/' is its own prototype chooser, not a service page — dr21-index.json (url /design-release-2.1/index) carries caption 'Prototypes', and routes.js mounts router.get('/index') rendering the chooser. So the back link is prototype-harness navigation. The frontend side is also accurate (paths.js:10 dashboardPath() === '/', fe-dashboard-populated.json backLink: null, breadcrumbs present in the captured HTML), but a back link that exists only to escape the prototype index is a delta, not work. Per the band brief ('a delta is not a finding'), this should be dropped rather than carried at low confidence. One imprecision worth noting if it is kept for the record: the default breadcrumb trail on the dashboard comes from layout.njk:42-49 using sharedCopy.layout.breadcrumbs.serviceHome, not from paths.js:12-15 (that helper is for journey pages).

## Deltas deliberately not raised

Recorded so the decision is visible rather than implicit.

- dr21-index is listed in pairs.js as a prototype-only 'entry' screen, but it is not a service screen at all — it is the prototype's own version chooser. routes.js:9204-9206 renders it, and its model (harness/capture/model/dr21-index.json:39-76) is four cards headed 'Design release 1', 'Design release 2', 'Design release 2.1' and 'Testing version' with links to /create-notification, /design-release-2, /design-release-2.1 and /testing, and 'In design' / 'Testing' tags. Prototype-harness scaffolding, no frontend counterpart is wanted. pairs.js onlyPrototype should drop it.
- dr21-create-notification is not a screen either. routes.js:8735-8739 is a GET redirect that resets the journey session, sets notificationStatus to 'Draft' and redirects to /origin-of-the-import — which is why the captured model (harness/capture/model/dr21-create-notification.json:2-4) has url /design-release-2.1/origin-of-the-import and h1 'Origin of the import'. The frontend already has the equivalent behaviour in dashboard/controller.js:115-119 (startJourney, beginOpeningRun, redirect to the origin page). The only difference is verb: the prototype entry is a GET link, the frontend a POST from a start button — not worth a finding on its own, and it is already covered by the dashboard entry-actions copy finding. pairs.js onlyPrototype should drop it.
- dr21-dashboard-filters-open is a state of dashboard.html, not a separate screen. The template opens the same details element conditionally (dashboard.html:132) from routes.js:6960, which sets additionalFiltersOpen when any of dateRange, startDate, endDate, type or status is present. Its content is already covered by the additional-filters finding, so raising it separately would double-count. pairs.js onlyPrototype should drop it.
- The frontend card's 'Date created' and 'Date submitted' rows have no prototype counterpart (template.njk:144-153 vs the two-row prototype card). This is the frontend having more than the prototype, which is a design decision to remove, not a parity gap, and the brief's rule is to report what the prototype has that the frontend lacks. Flagged here so it is not lost.
- The frontend's per-card actions are richer than the prototype's — View, Delete, Amend and Copy as new (view-model/row/actions.js via template.njk:90-111) against the prototype's Copy as new and View notification (card partial:12-17). No gap; the label wording differs ('View notification' vs 'View') but that is trivial rewording, not work.
- The ~100 date-picker button labels and the Mon/Tue/... table headings in both delta files are the MoJ date-picker calendar's internal DOM, captured twice because the panel holds two pickers. They are component internals, not design content, and are already covered by the additional-filters finding.
- The 'Use notification template' secondary button on the prototype dashboard (dashboard.html:57-61) belongs to the templates band and is being raised there; it is mentioned in the dashboard entry-actions finding only as context so the two are not built in isolation.
- The crumb, idempotencyKey and copyOrigin hidden inputs reported as frontend-only (template.njk:31, 95-98) are CSRF and idempotency plumbing, excluded by the brief.
- Service navigation. DR2.1 renders a five-item service nav (Import notification service / Dashboard / Templates / Address book / Manage account / Log out) on every templates screen (app/views/layouts/main.html:75-95, captured at dr21-dashboard-templates.json:7-32); the frontend has no service navigation at all — common/components/service-header/template.njk:9-29 renders a user name and a sign-out link and nothing else, and the captured fe serviceNav is a single home link (fe-dashboard-populated.json:7-12). A real gap, but service-wide and not templates-specific. It belongs in one navigation finding for the whole parity backlog; templates only needs a slot once that lands.
- Phase banner. Every prototype templates screen carries the Alpha banner (dashboard-templates.html:11-16, create-template.html:11-16, view-template.html:11-16); no frontend screen has one (fe-dashboard-populated.json:13 phaseBanner null). Service-wide, not a templates finding.
- Page titles and heading copy — 'Manage templates', 'Enter template name', 'Review your template', 'My templates', 'Create new template'. There is no frontend copy to compare against, so these are content for the pages when built, not deltas. Raising them as copy-change findings would fabricate a comparison.
- The synthetic address ids the seed writes, `template-<templateId>-<role>` (routes.js:6679). Prototype plumbing. The frontend commits an address as a copy with no id at all — party-picker/selection.js:3-8 says so in terms and re-finds the source record by name — so nothing about these ids transfers.
- templateId and templateName written into the session (routes.js:6637-6638) but never read by any DR2.1 view: grep over app/views/design-release-2.1/ finds templateName only as create-template.html's own form field. Dead state, and it causes a side effect that is plainly a bug rather than a requirement — after using a template, opening Create new template prefills the last template's name (routes.js:7003). The underlying question, whether a notification should record which template produced it, has no evidence on either side, so I have not dressed it as a finding.
- "A template-seeded journey would be bounced by the entry guard." Checked and false. flow/entry-guard.js:45-57 returns null — no redirect — as soon as the journey has committed user answers (hasCommittedNotificationAnswers, :37-40), and a seeded journey has them by definition. No guard work is implied.
- "Using a template needs a new opening-run mode." Checked and false. notification-actions/controller.js:40 already redirects a copied journey straight to hubPath without ever calling beginOpeningRun, and flow/run-state.js:25 tolerates a journey with no run record. The template entry point inherits this.
- create-template.html:28-45 has novalidate, a visually-hidden label and no error summary, and routes.js:7013 accepts an empty name. Real, but it is the default state of every form in the prototype and the frontend's own add-a-page recipe supplies validation and an error summary as a matter of course. Not worth a line of its own.
- resultsText on the templates page reusing buildDashboardResultsText to render 'Showing 1 of 4 Results' (routes.js:6782, dashboard-templates.html:46). Cosmetic and already covered by the list-controls finding.
- LEAD CHECK — renderDeleteNotificationPage hardcodes a design-release-2/ view path: CONFIRMED at app/routes.js:5362 (res.render('design-release-2/delete-notification')) reached from the only GET route at :9559-9561, so app/views/design-release-2.1/delete-notification.html is never rendered. But `diff` of the two files returns no output — they are byte-identical. So the DR2.1 file is a dead duplicate with zero functional effect, the captured dr21-delete-notification DOM is accurate, and my delete-notification findings stand on it. Reported to the design team as prototype hygiene (delete the dead copy or fix the render path before they diverge), not as parity work and not as a finding.
- LEAD CHECK — bespoke app-* markup instead of govuk-task-list / govuk-summary-list: CONFIRMED (notification-hub.html:82-97 uses app-notification-hub-tasklist; review-notification.html uses app-dr2-review-card-wrapper definition lists). Comparing taskItems/summaryRows as instructed was correct. The markup choice itself is not a finding — the frontend's govukTaskList and govukSummaryList are the right components and the prototype is just hand-rolling visuals. Only the behaviour the bespoke markup encodes (no gating, two-state tags) is raised, as its own finding.
- The check-answers delta's eighteen only-prototype summaryRows (Commodity code, Common name, Species, Purpose in the market, Number of animals, Animal, Ear tag, Includes unweaned animals, Name, Country, Approval number, Document reference, CPH, Contact address) are NOT gaps. The frontend has every one of them in check-answers/copy/copy.en.js:55-90 and builds them in view-model/cards/consignment/species/ and cards/documents.js; they simply did not render because the captured trace fixture had no commodity lines and no uploaded documents. Reporting these would have been the classic stale-finding failure the brief warns about.
- 'Passport' and 'Ear tag' identifier column labels appearing only on the prototype: both sides drive identifier columns from commodity reference data (frontend identifier-columns.js:9-16 via IDENTIFIER_LABELS; prototype app/data/commodities.js:67,86). A fixture difference, and commodities-band territory either way.
- 'Number of packages (when required)' vs the frontend's 'Number of packages': a commodity field label from app/data/commodities.js:22, owned by the commodities band, not the notification spine.
- Change-link text ('Change country of origin (Import details)' vs bare 'Change'): the frontend's is the govuk-summary-list visuallyHiddenText pattern rendered into the accessibility tree. The frontend is more accessible, not less complete. Not work.
- The crumb hidden field on four of my six pairs, and the absent form action on frontend snapshots — framework plumbing, excluded by the brief.
- backLink present on fe-hub and absent on dr21-notification-hub: the hub is a landing page in both models and the frontend also gives it breadcrumbs. Trivial.
- 'Region of origin code required' as its own frontend CYA row where the prototype shows only 'Region of origin code: Not applicable': this is the frontend surfacing a gate answer as a review row. It implies a one-row removal at most, and the origin band owns the underlying question.
- Frontend confirmation showing 'Date of declaration: 14 August 2026' where the prototype does not, and 'view or amend ... and resubmit it' vs 'view or change ... from your dashboard': the frontend has more here, and the reword carries no obligation change.
- Prototype hub task rows carrying almost no hints while every frontend row has one: the frontend is more helpful and hint text is cheap to tune later. Not an increment worth booking.
- The prototype's germinal hub variant (packages/net weight cards instead of animals/packages, notification-hub.html:30-49): germinal-products band, listed as such in pairs.js onlyPrototype.
- The prototype's 'Copy as new' / 'Amend this notification' / 'Delete' action bar on the submitted view (review-page-header.html:10-26): those map to dr21-notifications-copy-as-new and dr21-notifications-amend, which pairs.js assigns to the 'notification actions' band. The frontend already has copy and delete equivalents at check-answers/template.njk:31-52, so the gap there is amend-specific and belongs to that band.
- The frontend's 'Exit details' hub task row (hub/copy/copy.en.js:39-42, controller.js:36) having no DR2.1 counterpart: real, but it is the hub-side symptom of the fe-exit-date / fe-port-of-exit / fe-destination-country unpaired screens already logged in pairs.js onlyFrontend:51-53. Whoever rules on those three rules on the row.
- Hidden crumb field on all four frontend screens - CSRF plumbing, excluded by the brief.
- The 47 MoJ datepicker buttons and the seven day-name table headings that dominate the fe-import-reason and fe-import-purpose deltas. They come from the prototype rendering the temporary-admission reveal into the DOM at page load. The frontend has the identical MoJ datepicker on its own exit-date page (fe-exit-date.json:49-52; moj-datepicker present in fe-miner/capture/html/fe-exit-date.html), so this is a consequence of the one-page-vs-five-pages finding, not a separate control gap.
- Country option-list content on the origin select - the prototype's list carries Azores, Canary Islands, Ceuta, Melilla, Madeira, French Guiana, Guadeloupe, Martinique, Mayotte, Reunion, Saint Martin, Guernsey, Jersey, Isle of Man and Republic of Ireland, and the frontend's carries Iceland, Liechtenstein, Norway and Switzerland instead. The frontend's list is served by the reference-data service in real mode (services/countries/index.js:7-13) and the captured 33 entries are stub fallback data (services/countries/stub.js), so this is a reference-data question, not a frontend increment.
- "hub" vs "overview" in the save button and cancel link on all four pairs - the brief names this as the already-catalogued service-wide vocabulary finding.
- The prototype's origin page omits the secondary save and the cancel link entirely (origin-of-the-import.html:167-170 sets showHub:false, showCancel:false) and its CPH page shows only "Save and continue" outside amend mode (cph-number.html:60-65), while the frontend has both on every page. The frontend is ahead; not a parity gap.
- The "Draft" tag missing from the captured fe-origin. The frontend renders the journey strip only once answers have been committed (origin/controller.js:88-89) and origin is the first page, so the capture is a fresh-notification artefact - fe-import-reason.json:29-34 shows the tag present once the journey has started.
- The region-of-origin fieldset hint, reported as null on both sides by the miner. Both render it identically: "If a region of origin code is required it will be shown on your health certificate." (origin/copy/copy.en.js:9 and origin-of-the-import.html:129-131). A miner blind spot on fieldset-level hints, not a delta.
- The prototype's service navigation (Dashboard, Templates, Address book, Manage account, Log out) against the frontend's single "Import notification service" item. It follows from the templates and address-book features not existing in the frontend and is owned by those bands.
- Field name differences - regionOfOriginCode vs regionOfOriginCodeSuffix, internalReferenceNumber vs internalReference, reasonForImport vs importReason, countyParishHoldingCph vs cphNumber-county/parish/holding, and the frontend storing codes where the prototype stores display strings. Internal wire names, invisible to users.
- The prototype's journey pages sit in govuk-grid-column-full with bespoke app-origin-page / app-reason-for-import-page / app-cph-number-page layout classes and an app-eu-heading-m type scale, where the frontend uses the default govuk-grid-column-two-thirds (shared/layout.njk:56-57). A whole-service visual-design question, and the workspace rule is to stay inside the govuk-frontend toolbox.
- The frontend renders breadcrumbs on journey pages (shared/layout.njk:42-49) which the prototype does not. A frontend extra, not a prototype gap - though it is worth a separate look, since breadcrumbs mid-journey run against GDS guidance.
- serviceNav (Dashboard / Templates / Address book / Manage account / Log out) appears as only-prototype in all four of my deltas. It is service-wide chrome present on every prototype page in every band, not a commodities concern — it belongs to whoever owns the header/navigation band. Raising it here would be one of ~30 duplicates.
- phaseBanner ('Alpha This is a new service…') is only-prototype in all four deltas. Same reasoning: service-wide chrome, one finding for whoever owns the page layout, not four findings here.
- 'Save and return to hub' / 'Cancel and return to hub' vs '…to overview' appears in all four deltas. The band brief names this explicitly as the known service-wide hub/overview vocabulary finding, so it is already accounted for and I have not restated it.
- fe-consignment-details shows 'Add another commodity' as an only-frontend paragraph. This is a differ artefact, not a gap: both sides have it. The frontend renders it as a link inside a <p> (consignment-details.njk:20-22) and the prototype as a link (consignment-details.html:83-85, and it is present in the prototype model's links array). The differ bucketed one as a paragraph and the other as a link.
- The crumb hidden field on every frontend page, and the prototype's commodityId / commodityCode / selectedSpecies / commoditySelections hidden fields, are CSRF and framework plumbing. Excluded by the brief. The prototype's four hidden fields are described inside the search finding as mechanism, not raised as fields to add.
- Form field naming shape — numberOfAnimalsQuantity-0 / animalIdentifierPassport-0 (positional index) against numberOfAnimals[cattle-bos-taurus] / identifiers[cattle-bos-taurus][ear-tag] (species-keyed). Both address one value per species line; the difference is an implementation choice with no user-visible consequence.
- Certification-purpose options. I checked these expecting a gap and found an exact match — 16 options, identical wording and identical order, frontend services/certification-purposes/stub.js:1-20 against prototype app/data/certification-purposes.js:3-20. Recording the negative result: there is no work here.
- 'Remove Cow' / 'Remove Cat' vs a bare 'Remove'. The frontend puts the commodity name in the button's accessible name (_selected-commodities-table.njk:8, via a visually-hidden span); the prototype's button is just 'Remove' (consignment-details.html:76). The frontend is the more accessible of the two, so there is nothing to port.
- 'Save and finish' / 'Save and add another' vs 'Save and continue'. Same family as the hub/overview vocabulary finding — save-action button wording is set by shared/save-actions.njk service-wide, not per page.
- The identification counter heading. The frontend's h3 read 'Enter details for Bos taurus' in the capture only because no count had been entered; its copy function produces 'Enter details for {species} {n} of {cap}' (copy.en.js:81-82), the same shape as the prototype's 'Enter details for Bos taurus 1 of 2' (routes.js:1591). No difference.
- The 'Draft' status tag and the 'Help with commodity codes' details summary text are present and identical on both sides. Only the details body differs, which is covered by the Trade Tariff finding.
- The frontend's per-record identifier summary list (_identification-card.njk:13-23) versus the prototype's saved-animals partial. Both render previously entered identifiers with a per-row remove/edit affordance; the markup differs but the capability is present on both sides.
- Lead 1 is partly wrong. A DR2.1 live-animal commodity does NOT ask only 'Number of animals' — it also asks 'Number of packages (when required)' with hint 'Such as crates, bags or boxes', from the commodity's packagingFields (commodities.js:21-23, rendered at consignment-details.html:171-187, present in the dr21-consignment-details capture). The germinal difference is the addition of Net weight and Type of package plus a status flip on the packages field, not the introduction of a packages field.
- Lead 1's 'Net weight (kg)' is not the label. The label is 'Net weight'; 'kg' is a govukInput suffix (consignment-details.html:113-126), which is why the capture records the label as 'Net weight' with no unit.
- Lead 1's '27-option select' counts the placeholder. package-types.js:3-30 holds 26 package types; buildPackageTypeItems prepends a 'Select one' empty option (routes.js:574-587), giving 27 rendered options.
- Lead 3 is mostly wrong and I did not raise it. Aggregating across species into one row per commodity is NOT germinal-specific — non-germinal commodities sum numberOfAnimals across their species into a single row in exactly the same way (routes.js:658-671). Nor is Remove-by-commodity germinal-specific: removeBy is 'commodity' for every commodity except CN 01061900 'other live mammals', which alone removes by species (routes.js:616-637, template branch at consignment-details.html:68-74). The frontend already behaves the same way — postRemove drops every line of a commodity group (consignment-details/remove/post-remove.js:33-36). Also, the Selected commodities block on consignment-details has no quantity column at all (consignment-details.html:56-57); the quantity aggregation the lead describes surfaces on animal-identification-details (animal-identification-details.html:63-73), which is where I anchored the related findings instead.
- Lead 5 is factually correct — germinal packaging fields are a hardcoded if-branch (consignment-details.html:108-156) while live-animal ones come from the data-driven packagingFields loop (consignment-details.html:171-187) — but I did not raise it as a finding on its own. It is prototype internal structure; the frontend has exactly one mechanism (packagesApply / showPackages) and the parity consequence is already carried by the field and obligation findings.
- The germinal commodities' own certificationPurposeOptions ('Breeding and/or production', 'Approved bodies', 'Other', commodities-germinal-products.js:3-13) are dead data — every read site uses the global list from data/certification-purposes via getAdditionalAnimalDetailsConfig (routes.js:1185, 1218, 9018). Nothing renders them, so there is nothing to build parity with.
- Duplicate species labels in the germinal search results and selected chips ('Domestic cattle (Bos taurus)' three times, 'Remove Bos taurus' twice in the mixed capture) are an artefact of the flat capture model, not a defect. Both the results list and the chip list are grouped under commodity header rows carrying name and code (commodity-search.js:518-527, 412-423), so the live DOM disambiguates them.
- The germinal hub summary — Packages/boxes and Kilograms cards replacing the Animals card when hasGerminalProductsOnly (routes.js:5477-5484, notification-hub.html:30-49) — is not raisable in this band. The frontend hub has no commodity summary cards of any kind (fe-hub capture has no such content), so the germinal variant is a sub-case of a hub-band gap and should not be double-counted here.
- The DR2.1 commodity search input, the Selected commodities grid on the identification page, and the identification page's 'Change' / 'Add another commodity' links are all present for live animals too. They belong to the commodity-search and animal-identification bands, not here. I cited them only where germinal changes their content.
- The MOJ datepicker used by the germinal Collection date field is not a library gap: trade-imports-animals-frontend already depends on @ministryofjustice/frontend 10.0.1 (package.json:72), a newer major than the prototype's ^9.0.0. Folded into the identifier-fields finding as a note rather than raised separately.
- The germinal error summary repeats identical, non-species-qualified messages ('Enter the net weight' twice, etc. — dr21-consignment-details-germinal-errors) because validateNetWeight and friends push the same text per species (routes.js:940-944). That is a GDS error-summary quality issue in the prototype; the frontend's own error copy would be authored fresh, so copying it is not on the table and it is not a parity gap.
- hub vs overview vocabulary ('Save and return to hub' / 'Cancel and return to hub' vs '…to overview'), present in the fe-addresses-hub delta: the brief names this as the known service-wide example, so re-raising it per band would produce one ticket per screen. Not raised here.
- Primary button label mismatches: the hub is 'Continue' (frontend) vs 'Save and continue' (prototype), while contact is the exact reverse — 'Save and continue' (frontend) vs 'Continue' (prototype). The disagreement runs in both directions, so it is a save-actions consistency question for whoever owns the shared save-actions macro, not an addresses parity gap.
- Article-only link rewording on the hub: 'Add place of origin' vs 'Add a place of origin', 'Add consignee' vs 'Add a consignee', etc. Trivial rewording. Note that the frontend does not use these strings at all — it renders 'Add'/'Change' with a visually-hidden role name (features/addresses/controller.js:38-40); the substantive half of that difference is folded into the hub-restructure finding.
- Warning text full stop: 'Providing a false address is an act of fraud.' (features/addresses/copy/copy.en.js:4) vs no full stop (roles-and-addresses.html:35). Punctuation only.
- CPH heading and hint capitalisation: 'County Parish Holding number (CPH)' (features/addresses/copy/copy.en.js:10-11) vs 'County parish holding number (CPH)' (consignment-address-sections.js:71-72). Sentence-case housekeeping, not addresses parity work — belongs with the CPH band if one exists.
- CPH applicability. LEAD CHECKED AND AGREEING: the prototype gates CPH by commodity code (0102 and 0103, consignment-address-sections.js:107-122) and the frontend by commodity name (CPH_COMMODITIES = ['Cow'], services/commodities/stub.js:119). On every commodity both sides actually offer — Horse/0101, Cow/0102, Cat and Dog/01061900 — the two rules give identical answers. The prototype's extra 0103 (swine) and its cph-bearing default list only bite for commodities the frontend does not offer at all, so there is no frontend work here. Reporting it would be a false gap.
- Permanent-address applicability. Also checked and agreeing: prototype requires 01061900 plus a species carrying requiresPermanentAddress (routes.js:2006-2029, app/data/commodities.js:150,170,190); frontend uses PERMANENT_ADDRESS_COMMODITIES = ['Cat','Dog'] which is exactly 01061900. The only divergence is the prototype's extra Ferret commodity, which is a commodities-band gap, not an addresses one.
- Table header 'Actions' vs 'Action' on all five pickers — both are visually hidden (party-picker/_address-picker.njk:59; consignment-address-select.html:119-121). Screen-reader-only singular/plural.
- Field name differences ('party' vs '<role>AddressId', 'q' vs 'search', 'contactAddress' vs 'contactAddressId'). Form-field naming is implementation, invisible to users, and the frontend's shared-picker design deliberately uses one field name across all five roles (party-picker.controller.js:116-129).
- Hidden crumb and page inputs, and the phase banner present on every prototype screen and absent from every frontend screen — framework plumbing, excluded by the brief.
- Address field ORDER on create-address: frontend ends telephone-then-email (features/addresses/copy/copy.en.js:76-77), prototype ends email-then-phone (address-book-manual-address-fields.html:91,102). No behavioural or content consequence.
- Row counts and address names in the picker tables (e.g. 9 'View details' rows vs 5 frontend details summaries) — these are stub-data differences between the two services' seed lists, not design deltas.
- The pairs.js onlyFrontend questions for fe-exit-date, fe-port-of-exit and fe-destination-country are answered but NOT raised as gaps: DR2.1 has neither dropped them nor folded them into arrival-details. It folds all three onto reason-for-import as conditional reveals, scoped by reason — Transhipment or onward travel reveals Destination country (partials/transhipment-destination-country-select.html:5-11), Transit reveals Port of exit + Destination country (partials/transit-options-select.html:8,18), Temporary admission horses reveals Exit date + Port of exit (partials/temporary-admission-horses-select.html:6-33). renderReasonForImportPage (routes.js:8431) pre-renders all four reveal blobs and injects them into the reason-for-import radios (routes.js:8493-8503). The gating is IDENTICAL to the frontend's obligations (obligations/sections/import-reason.js:61-116: destinationCountry on transit|transhipmentOrOnwardTravel, portOfExit on transit|temporaryAdmissionHorses, exitDate on temporaryAdmissionHorses), and the frontend already places all three pages inside the import-reason flow section immediately after importReasonPage (flow/flow.js:50-58). So this is presentational only — three pages vs three reveals on one page — with no obligation, field or content change, and it is the same collapse already paired for fe-import-purpose. It belongs to the import-reason band's reveal finding, not to transport-and-documents; raising it here would double-count.
- Prototype-only phase banner ('Alpha This is a new service…') on every one of my six pairs — prototype-wide chrome from layouts/main.html, not a per-page gap.
- Prototype-only serviceNav (Dashboard / Templates / Address book / Manage account / Log out) on all six pairs — service-wide shell, owned by whichever band rules on the header.
- 'Save and return to hub' / 'Cancel and return to hub' vs '…to overview' on all six pairs — the known service-wide hub/overview vocabulary finding; the brief explicitly says to raise it once, not per page.
- The hidden `crumb` field, listed as field-only-frontend on all six pairs — CSRF plumbing.
- Field-name prefix differences on the private and commercial transporter forms (nameOrOrganisationName vs transporterPrivateName, postalOrZipCode vs transporterPrivatePostcode, and so on) — internal form names with no user-visible consequence. These alone account for most of the 27 and 29 delta counts on the two transporter pairs.
- 'Search' buttons appearing as prototype-only on fe-arrival-details, fe-transit-countries and fe-transporter-commercial — they are the submit affordance inside the typeahead widgets, already covered by the port-of-entry and transit-countries findings.
- transportIdentification hint: identical wording on both sides, but DR2.1 marks it up as a bulleted list (arrival-details.html:127-129) where the frontend concatenates it into one semicolon-separated hint string (copy.en.js:25). The differ saw two strings; the content is the same. Presentational-only, and a trivially better rendering the frontend can pick up in passing.
- arrivalDateAtPort hint: the frontend states the actual permitted window ('Enter a date between 7/8/2026 and 14/2/2027', copy.en.js:6-7) where DR2.1 only gives an example format. The frontend does MORE here; both use mojDatePicker with minDate/maxDate (port-of-entry.njk:16 vs partials/arrival-date-picker.html:16-17). No gap.
- 'Draft' tag appearing as frontend-only on fe-transporter-private — notification-status chrome. The prototype's transporter-add-private.html simply omits the notification-status partial that its own transporter-add-commercial.html includes at line 29; that is prototype inconsistency, not a frontend gap.
- Document virus-scan tag wording (frontend Checking / Safe / Virus found / Unknown, copy.en.js:52-57; DR2.1 'Scanning for virus' / 'Check completed', routes.js:8594-8595). The frontend models strictly more states, including the failure case DR2.1 has no tag for. No gap.
- 'You have not added any documents yet.' as frontend-only (copy.en.js:49, template.njk:89) — DR2.1 just hides its table when empty (upload-documents.html:190). The frontend does more.
- Documents button wording 'Continue' vs 'Save and continue' — service-wide save-action copy, same class as hub/overview.
- The h2 section headings the differ flags as prototype-only ('File upload', 'Enter contact details', 'Select a transporter', 'Important', 'Help with transporter authorisation') — page furniture around questions that already exist on both sides, except where they introduce a genuinely new surface, which is covered by the transporter-registry and add-commercial findings.
- The frontend's DAERA/APHA authorisation guidance appearing as only-frontend on the fe-transporter-type pair — it is present in DR2.1, just on different pages (transporter.html:48-62 and, via partials/transporter-authorisation-banner.html, on transporter-add-commercial.html:43). Same content, relocated by the flow change; not a content gap. Only the link text differs ('opens in new tab' vs 'opens in a new tab') and the link targets differ (gov.uk/guidance/transporting-animals-in-great-britain vs an animal-welfare-in-transport deep link) — too small to bill separately, but worth folding into whoever implements the flow change.
- Document type enum differences inside the DR2.1 select: HEALTH_CERTIFICATE absent and ITAHC relabelled. Reported inside the document-type finding rather than separately; the enum is otherwise identical and the prototype's testing-mode variant (routes.js:8532-8535) explains the HEALTH_CERTIFICATE split.

