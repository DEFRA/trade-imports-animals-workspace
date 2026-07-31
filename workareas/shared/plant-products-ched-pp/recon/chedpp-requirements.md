# CHED-PP requirements digest (planning-ready)

Recon re-load of the trace-mined CHED-PP corpus at
`workareas/shared/trace-requirements/ched-pp/` (RULINGS.md, backlog.json, target-model.md,
integrations.md, authorization-rules.md, journey-spec.json + pages/*.json).
Ruled by Sam 2026-07-18; spec gate CLOSED, all 10 born-blocked increments settled.

Per-page specs live at `workareas/shared/trace-requirements/ched-pp/pages/<slug>.json` —
one file per journey-spec page, **all 39 slugs have a spec file** (confirmed by `ls`).
journey-spec.json: 39 pages, 354 field rows, 310 validation messages (228 grounded).

---

## 1. The 8 conflict rulings (and what each means for planning)

| id | topic | ruling + downstream consequence |
|---|---|---|
| **c-004** | Error-summary title | CONFIRMED — GDS 'There is a problem' everywhere. Not a per-page blocker: every page ships the GDS default, signed off once (sequencingNotes). Side task outside the rebuild: migrate the CHED-A QA guard `ched-a-workflows.ts:505` (`/fix the following errors/i`) so error detection keeps working. |
| **c-007** | CUC billing trigger | PROVISIONAL — billing gated on a free-standing `isCuc` flag; the real rule (possibly Sevington-port-derived) is unconfirmed with IPAFFS. Planning consequence: inc-036 builds against `isCuc`; the hub's Billing spoke is conditional on it; the trigger condition must stay swappable, and confirmation with IPAFFS is an open external action. |
| **c-013** | commodity-input-method wording | CONFIRMED — one canonical question, the visible H1 'How do you want to add your commodity details?'; drop the divergent hidden legend; fold into legend-as-heading. Consequence: inc-013 copy is settled; no dual-string carry. |
| **c-014** | Radio a11y defect | CONFIRMED — FIX, don't port: standard GDS radios with the H1 inside the fieldset legend and caption above, on every affected page. A deliberate behaviour change; like c-004 it is a once-recorded default, not re-litigated per increment. |
| **c-015** | Accompanying docs mandatory? | RULED MANDATORY — at least one document (a phytosanitary certificate) is required to submit; `required=true`. Consequence: inc-025 builds with a submit-blocking required-document error; the earlier isChedp/CHED-P trap reading is moot. |
| **c-018** | Validation copy voice | RULED — adopt the frontend Joi voice ('Enter/Select the …') as the single canonical string per field; ship ONE string, not the frontend+backend pair. Consequence: inc-003 records the one-layer decision once; per-page ACs cite the backend 'Add the …' variants only to reject them. |
| **c-023** | AV/upload-failure copy | RULED — standardise on GDS sentence case, porting neither legacy casing. Consequence: only bites when deferred inc-037 (file bytes + AV) is built; carried as a stub note. |
| **c-024** | Overdue-debtor gate | RULED OUT of first pass — not implemented (the GET/POST inconsistency is a latent IPAFFS bug, reported independently). Consequence: inc-008 carries a do-NOT-port flag; if ever added, derive the flag once per request and never render a permitted option disabled. |

## 2. scopeDecisions carried forward (backlog.json)

- **Delegated authority (DoA): OUT.** First pass is a single-org, own-behalf journey. inc-032 (ownership/visibility/auto-population layer), inc-033 (consignment-for) and inc-034 (consignment-organisation) deferred to a later programme; G-1..G-6 stay open for it.
- **CUC billing: IN.** inc-036 built, gated provisionally on `isCuc` (c-007); Billing spoke conditional on the hub.
- **Cloning: OUT.** inc-041 deferred; the success path was never observed (all three corpus traces hit the 406 'cannot clone').
- **residualBlockersResolved:** inc-014 = build the REAL commodity search now (tree browse + EPPO typeahead, server round-trip; `eppoCode` is the join key, `add-species-<id>` is transient UI state; fixture-backed in pass 1). inc-020 = 12-spoke hub (see §6). inc-040 = server-side no-op Article 72 rule hook in pass 1.
- **scopeExclusions:** post-submission is OUT entirely (BIP inspector decision-* app, post-submit Checks/Valid-Rejected tabs, inspection-required confirmation variants, split-consignment-confirm); file bytes + AV out (metadata only); address book out (free-typed consignor); integrations stubbed per §7.
- **deviations (standing build rules):** whole-document Mongo POST, no JSON-Patch/etag (last-write-wins is deliberate — Open Q 3); one stable id, `status` moves (reject the DRAFT→CHEDPP id flip); govuk-frontend toolbox only, CDP cookie banner; c-004 + c-014 adopted everywhere; real-href back links.

## 3. m0–m4 increments (all status `todo`)

| id | title | kind | ms | dependsOn | pages/*.json consumed | per-increment ruling |
|---|---|---|---|---|---|---|
| inc-001 | Scaffold the CDP CHED-PP app skeleton | scaffold | m0 | — | — | — (agent rails Phase 0 first) |
| inc-002 | Notification Mongo document + persistence spine | persistence | m0 | inc-001 | — | — (Open Q 4 ref-number format recorded here) |
| inc-003 | Session draft save/resume + page-owned routing/validation spine | scaffold | m0 | inc-002 | — | — (records single-layer validation + no-etag decisions once) |
| inc-004 | Countries reference data | reference-data | m1 | inc-001 | — | — (c-012 'Republic of Ireland'; c-026 optgroups) |
| inc-005 | Commodity codes + EPPO species + variety/class fixture | reference-data | m1 | inc-001 | — | — (~10-code fixture; eppoCode join key per Open Q 1) |
| inc-006 | BCPs + inspection premises reference data | reference-data | m1 | inc-001 | — | — (144 BCPs; per-BCP control-point map, rule is a gap) |
| inc-007 | Commodity measures + document types reference data | reference-data | m1 | inc-001 | — | — (c-016 dedupe 'Sea waybill') |
| inc-008 | import-type — certificate type | page | m2 | inc-003 | import-type.json | FLAG c-024: do NOT port the overdue-debtor gate |
| inc-009 | country-of-origin — origin of the plants | page | m2 | inc-004, inc-008 | country-of-origin.json | — |
| inc-010 | origin-of-import — countries + local reference | page | m2 | inc-004, inc-008 | origin-of-import.json | — (Open Q 9; overlap with inc-009 to confirm) |
| inc-011 | about-the-consignment — main reason for import | page | m2 | inc-008 | about-the-consignment.json | — (normalised enum, not IPAFFS wire values; c-006) |
| inc-012 | Commodity collection model extension (nested repeating group) | model-extension | m3 | inc-002, inc-005 | — | **GATE: model-extension — halt for review before commodity pages** |
| inc-013 | commodity-input-method — manual vs CSV routing | page | m3 | inc-003 | commodity-input-method.json | c-013 wording adopted; CSV branch deferred to inc-035 |
| inc-014 | commodity-search — code tree browse + EPPO species search | page | m3 | inc-005, inc-012, inc-013 | commodity-search.json | RESOLVED: build the REAL search now (POST→302→GET, no XHR); eppoCode is the join key; add-species-<id> transient |
| inc-015 | commodity-basic-description — select species | page | m3 | inc-005, inc-012 | commodity-basic-description.json | — (control-type-varies-by-data variance recorded) |
| inc-016 | variety-of-genus-and-species — variety + class | page | m3 | inc-005, inc-012, inc-015 | variety-of-genus-and-species.json | — (store variety ID not label — Open Q 2) |
| inc-017 | commodity-summary — commodity table + remove | page | m3 | inc-012, inc-015, inc-016 | commodity-summary.json | — |
| inc-018 | commodity-bulk-details — per-commodity measures | page | m3 | inc-007, inc-012, inc-017 | commodity-bulk-details.json | — (FIX labelless-input a11y defect; c-018/c-019 one canonical string) |
| inc-019 | commodity-additional-details — consignment totals | page | m3 | inc-007, inc-018 | commodity-additional-details.json | — (rollups derived, never stored) |
| inc-020 | notification-hub — task-list hub | page | m4 | inc-011, inc-019 | notification-hub.json | RESOLVED: 12 spokes (§6); hub owns navigation; all-mandatory-complete unlocks Review and submit; optional spokes don't gate; catch-cert/charity/health-cert-status omitted |
| inc-021 | transport-before-bip — BCP, premises, transport, arrival | page | m4 | inc-006, inc-003 | transport-before-bip.json | — (arrivalTime + containers[] are CHED-PP additions) |
| inc-022 | goods-movement-services — CTC / MRN / GVMS | page | m4 | inc-003 | goods-movement-services.json | — (data, not an integration) |
| inc-023 | contact-details — responsible person | page | m4 | inc-003 | contact-details.json | — (c-020 'Mobile number' single term; entry page in pass 1, POP-2 auto-pop deferred to inc-032) |
| inc-024 | nominated-contact — repeating optional contacts | page | m4 | inc-023 | nominated-contact.json | — |
| inc-025 | accompanying-documents — document metadata | page | m4 | inc-007, inc-003 | accompanying-documents.json | RESOLVED c-015: MANDATORY — ≥1 document (phytosanitary certificate) required to submit; required=true; separate `accompanying_documents` collection |
| inc-026 | traders-addresses — traders table | page | m4 | inc-004, inc-003 | traders-addresses.json | — (importer defaults to stubbed user's org in pass 1) |
| inc-027 | consignor-create (+ confirmation) — hand-entered consignor | page | m4 | inc-004, inc-026 | consignor-create.json, consignor-confirmation.json | — (c-010/c-011 label fixes) |
| inc-028 | notifications-dashboard — list own notifications | page | m4 | inc-002, inc-004 | notifications-dashboard.json | — (c-026 optgroups; c-027 one status vocab; scoped to stubbed org in pass 1) |
| inc-029 | review-notification — check your answers | page | m4 | inc-019, 021, 022, 023, 025, 026, 027 | review-notification.json | — (PRE-submission only; post-submit tabs out of scope) |
| inc-030 | declaration — attestation + submit | page | m4 | inc-029 | declaration.json | — (explicit declaration{agreed,declaredAt} kept — Open Q 6) |
| inc-031 | confirmation — submission confirmation | page | m4 | inc-030 | confirmation.json | — (FIX missing-H1 defect: real govuk-panel) |

## 4. m5 increments

### m5 `todo` (buildable in pass 1's tail)

| id | title | kind | dependsOn | pages consumed | ruling |
|---|---|---|---|---|---|
| inc-035 | csv-upload — CSV commodity branch | variant | inc-013, inc-018 | csv-upload.json | — (branch-replacement: same 12 obligations as manual; Variety/Class CSV columns gap-confidence) |
| inc-036 | CUC billing sub-journey | variant | inc-004, inc-029 | confirm-billing-details.json, billing-find-an-address.json, billing-select-the-address.json, billing-change-contact-details.json | RESOLVED: IN scope; gated provisionally on `isCuc` (c-007) — trigger NOT settled, confirm with IPAFFS |
| inc-038 | consignor-search — address-book search | variant | inc-027 | consignor-search.json | — (thin stub / bypassed to 'Create new'; address book deferred) |
| inc-039 | Draft lifecycle — delete, amend, copy-as-new | lifecycle | inc-002, inc-030 | delete-notification.json | — (soft-delete; AMEND + submittedBaseline; c-028 own URL scheme; split-consignment OUT) |
| inc-040 | Article 72 business rule | business-rule | — | — | RESOLVED: server-side no-op placeholder rule hook in pass 1; country×commodity condition + effect supplied by product later |
| inc-042 | Auth stub / sign-in | stub | inc-001 | sign-in.json | — (fixed signed-in user; sign-in short-circuited, not a data page) |

### The 5 `deferred` increments (carry as stubs)

| id | title | ruling |
|---|---|---|
| inc-032 | DoA ownership/visibility/auto-population layer (model-extension, L) | DEFERRED — DoA OUT of first pass; single-org own-behalf journey. The `ownership.*` tenancy layer, VIS query rule, POP auto-population and the Trade Partner badge become a later programme; G-1..G-6 open for it. |
| inc-033 | consignment-for — who are you creating this for? | DEFERRED — behind DoA (inc-032). A non-delegated user never sees the page (AGT-4). G-6 (collapse the two-page selector) settled with the DoA programme. |
| inc-034 | consignment-organisation — which delegated org | DEFERRED — behind DoA. G-5 (≥8-delegation autocomplete variant) settled with the DoA programme. |
| inc-037 | document-upload — file bytes + antivirus | DEFERRED — bytes out of pass 1 (metadata only via inc-025); separate same-origin-reverse-proxied /upload/ app when built; c-023 GDS sentence case ruled for then. |
| inc-041 | cloning front door | DEFERRED — success path never observed (all traces hit the 406); when re-opened, source the success-state flow first. |

## 5. Target model — field tree (target-model.md)

Mongo collection `notification`; one document per CHED-PP. House-parity with
CHED-A `Notification extends NotificationBase`; plant leaves + (deferred) ownership layer differ.
Whole-document save per page; blank referenceNumber ⇒ create+mint, present ⇒ overwrite.

```
Notification
├─ id (Mongo @Id) · referenceNumber (server-minted, unique sparse — format Open Q 4)
├─ status: DRAFT|SUBMITTED|AMEND|DELETED · chedType: 'CHEDPP' (const)
├─ ownership { assignedOrganisationId*, assignedOrganisationName, agencyOrganisationId?, createdByUserId? }   [inc-032 — DEFERRED layer]
├─ origin { countryCode, countryOfConsignmentCode, internalReference }
├─ reasonForImport: INTERNAL_MARKET|RE_ENTRY|RE_CONFORMITY_CHECK
├─ commodity { name?, inputMethod: MANUAL|CSV,
│   commodityComplement[]: CommodityLine
│     { commodityCode, commodityDescription, numberOfPackages, packageType,
│       quantity, quantityType, netWeight, controlledAtmosphereContainer(bool),
│       finishedOrPropagated: FINISHED|PROPAGATED, intendedForFinalUsers(bool),
│       testAndTrial(bool), uniqueComplementId,
│       species[]: { eppoCode (JOIN KEY), genusAndSpecies, speciesId?,
│                    varieties[]: { variety (store ID not label), varietyClass: CLASS_I|CLASS_II|EXTRA_CLASS } } } }
├─ additionalDetails { totalGrossWeight, grossVolume?, grossVolumeUnit: LITRES|METRES_CUBED }
├─ consignor: Operator (HAND-ENTERED, POP-4)  · consignee: Operator (auto, POP-3)
├─ importer: Operator (auto, POP-1) · destination: Operator ('Same as consignee' or entered) · packer?: Operator (CHED-PP addition, optional)
├─ responsiblePerson: Contact (auto POP-2; which member = G-1) · nominatedContacts[]: Contact
│    Contact { name, email, telephone, isAgent? } — email-OR-telephone at fieldset level
├─ transport { borderControlPost (renamed from house portOfEntry), inspectionPremises,
│   meansOfTransport: AIRPLANE|RAILWAY|ROAD_VEHICLE|VESSEL, transportIdentification,
│   transportDocumentReference, arrivalDate, arrivalTime (CHED-PP addition),
│   usesContainers(bool), containers[] { containerNumber, sealNumber, officialSeal } }
├─ goodsMovementServices { commonTransitConvention: ADD_MRN_NOW|ADD_MRN_LATER|NO,
│   movementReferenceNumber (18-char, iff ADD_MRN_NOW), usingGvms(bool) }
├─ billing { address { addressLine1-4, cityOrTown, county, postalCode }, email, telephone }   [CUC / isCuc only]
├─ declaration { agreed, declaredAt } · submittedBaseline (amend snapshot, OWN-3)
└─ created · updated

Operator { operatorId?, name, telephone, email, address }
Address  { addressLine1, addressLine2?, addressLine3?, city, postcode, country }

SEPARATE collection `accompanying_documents` (async-scan boundary, FK notificationReferenceNumber):
AccompanyingDocument { id, notificationReferenceNumber, documentType (17 opts),
                       documentReference, issueDate, files[] { fileId, filename } — bytes deferred }
```

Derived, never stored: Trade Partner badge, net-weight/package rollups, dashboard visibility
(query rule on assignedOrganisationId — deferred with inc-032).

## 6. The 12-spoke hub (inc-020 ruling) — spoke → pages behind it

Hub page: `notification-hub` (pages/notification-hub.json). Hub OWNS navigation
('Save and return to hub'); every mandatory spoke must be Completed before spoke 12 unlocks;
optional/conditional spokes don't gate. Catch certificates / charity / latest-health-cert-status OMITTED.

| # | Spoke | Pages behind it |
|---|---|---|
| 1 | Origin of the import | country-of-origin, origin-of-import |
| 2 | Purpose | about-the-consignment |
| 3 | Commodity | commodity-input-method, commodity-search, commodity-basic-description, variety-of-genus-and-species, commodity-summary, commodity-bulk-details (+ csv-upload variant, m5) |
| 4 | Additional details | commodity-additional-details |
| 5 | Transport to the BCP | transport-before-bip |
| 6 | Goods movement services | goods-movement-services |
| 7 | Contact details | contact-details |
| 8 | Nominated contacts *(optional — does not gate)* | nominated-contact |
| 9 | Accompanying documents *(mandatory ≥1 doc, c-015)* | accompanying-documents (+ document-upload, deferred m5) |
| 10 | Traders | traders-addresses, consignor-create, consignor-confirmation (+ consignor-search stub, m5) |
| 11 | Billing *(conditional on isCuc)* | confirm-billing-details, billing-find-an-address, billing-select-the-address, billing-change-contact-details |
| 12 | Review and submit *(unlocks when all mandatory Completed)* | review-notification, declaration, confirmation |

Off-hub: notifications-dashboard, import-type (entry), delete-notification (lifecycle),
sign-in (auth stub), cloning-* (deferred), split-consignment-confirm (out of scope).

## 7. Integration / auth stub decisions constraining m0–m4

- **Everything is server-side.** `connect-src 'self'` — the browser makes zero cross-origin data calls; even commodity search is POST→302→GET. Consequence: no client XHR anywhere in m0–m4; searches/lookups are full page round-trips (inc-014 AC).
- **Persistence = build.** Mongo whole-document POST replaces the IPAFFS notification service; deliberately drop JSON-Patch + etag/If-Match (last-write-wins accepted, Open Q 3).
- **Hardcode as JSON fixtures** (small, stable, observed in full): countries ~254 (incl. GB-ENG/SCT/WLS/NIR; optgroups on dashboard), BCPs 144, control points as a per-BCP map (52–135; filtering rule is a gap — record the association per fixtured BCP), package types 24, quantity types 8, container options 3/2, means of transport 4+placeholder, gross-volume units 2, document types 17, purpose 3.
- **Fixture, not hardcode:** commodity codes + EPPO species (+ per-species variety) — ~10 CHED-PP codes with species; the ONE lookup that will eventually need a real integration (inc-005 backs inc-014/015/016).
- **Stub:** Defra ID / customer = fixed signed-in user (inc-042; supplies the org the dashboard scopes on); permissions = allow-all; field config = CHED-PP set inline; risk assessment = always low (drives confirmation's inspection-status, inc-031).
- **Defer entirely:** file upload bytes + AV (inc-037; synchronous-scan /upload/ app, same-origin reverse proxy when built), economic-operator address book (inc-038 stub; free-typed consignor), certificate PDF, Dynamics 365, TRACES SOAP, Notify (no call even evidenced from create).
- **GVMS is not an integration** — two radios + an MRN captured as data (inc-022).
- **Species id caveat:** IPAFFS resolves species to an internal numeric id (`add-species-1416873`) whose stability is a gap — hence the ruling to persist `eppoCode` as the join key and treat the id as transient.
