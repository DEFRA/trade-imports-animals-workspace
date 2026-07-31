# CHED-PP obligation → backend field map

Companion to `SCHEMA-DESIGN.md`. For every m0–m4 journey area (backlog increment ids from
`recon/chedpp-requirements.md` §3), the plant-products schema field(s) that back it. Paths are
JSON paths on the `plant_products_notification` document unless marked as the separate
`plant_products_accompanying_documents` collection or as an endpoint/derived concern.
"Derived — never stored" entries are load-bearing: the implementor must NOT add fields for them.

## m0 — spine

| Increment | Journey obligation | Backing schema surface |
|---|---|---|
| inc-001 scaffold | app skeleton | none (frontend); backend counterpart = Stage 1 wiring (`PlantProductsAutoConfiguration`) |
| inc-002 persistence spine | one Mongo document per notification; create + resume | `id`, `referenceNumber` (GBN-PP mint), `chedType` (`"CHEDPP"` const), `status` (DRAFT on create), `ownership.assignedOrganisationId` / `.assignedOrganisationName` (stubbed org), `created`, `updated`, `expireAt`; endpoints `POST /plant-products/notifications`, `PUT/GET …/{reference-number}` |
| inc-003 save/resume + routing spine | whole-document save per page; blank ref ⇒ create, present ⇒ overwrite | `PUT …/{reference-number}` upsert semantics (200/201); no per-page fields — single-layer validation (c-018) means the backend stores whatever the frontend saved |

## m1 — reference data (codes stored, lists live in the frontend fixtures)

| Increment | List | Field(s) storing the code |
|---|---|---|
| inc-004 countries | Countries (~254 incl. GB-ENG/SCT/WLS/NIR) | `origin.countryCode`, `origin.countryOfConsignmentCode`, `*.address.country` (consignor/consignee/importer/destination/packer) |
| inc-005 commodity codes + EPPO + variety | CN tree fixture (~10), EPPO per commodity, variety per species | `commodity.commodityComplement[].commodityCode`, `.commodityDescription`; `…species[].eppoCode` (JOIN KEY), `.genusAndSpecies`, `.speciesId` (round-trip only); `…varieties[].variety` (ID not label), `.varietyClass` |
| inc-006 BCPs + inspection premises | BCPs (144) + per-BCP control points | `transport.borderControlPost`, `transport.inspectionPremises` |
| inc-007 measures + document types | package types (24), quantity types (8), document types (17) | `…commodityComplement[].packageType`, `.quantityType`; `plant_products_accompanying_documents.documentType` |

## m2 — entry pages

| Increment | Page | Backing field(s) |
|---|---|---|
| inc-008 import-type | certificate type radio | `chedType` — server-set constant `"CHEDPP"`; the radio routes, nothing else persists (c-024 overdue-debtor gate: do NOT build) |
| inc-009 country-of-origin | origin of the plants | `origin.countryCode` |
| inc-010 origin-of-import | countries + local reference | `origin.countryCode`, `origin.countryOfConsignmentCode`, `origin.internalReference` (conform/health-cert yes-nos: defaults accepted, no fields — gap recorded upstream) |
| inc-011 about-the-consignment | main reason for import | `reasonForImport` (normalised enum `INTERNAL_MARKET \| RE_ENTRY \| RE_CONFORMITY_CHECK`, c-006) |

## m3 — commodity block

| Increment | Page / concern | Backing field(s) |
|---|---|---|
| inc-012 commodity model extension (GATE) | nested repeating groups commodity → species → variety/class | the whole `commodity.commodityComplement[]` subtree: `CommodityLine` → `species[]` (`PlantSpecies`) → `varieties[]` (`SpeciesVariety`); `uniqueComplementId` = stable row key |
| inc-013 commodity-input-method | manual vs CSV routing | `commodity.inputMethod` (`MANUAL \| CSV`); CSV branch itself is inc-035 (m5) and yields the SAME `commodityComplement[]` lines |
| inc-014 commodity-search | code tree browse + EPPO typeahead | `…commodityComplement[].commodityCode` (+ `.commodityDescription` ref-data-derived); `add-species-<id>` is transient UI state — NOT persisted; `eppoCode` is the join key |
| inc-015 commodity-basic-description | select species | `…species[].eppoCode`, `.genusAndSpecies`, `.speciesId` |
| inc-016 variety-of-genus-and-species | variety + class | `…species[].varieties[].variety` (store the variety ID, not the label — Open Q 2), `.varietyClass` (`CLASS_I \| CLASS_II \| EXTRA_CLASS`, null when N/A) |
| inc-017 commodity-summary | table + remove | read-only echo of the subtree; remove = mutate `commodityComplement[]` keyed by `uniqueComplementId`; no new fields |
| inc-018 commodity-bulk-details | per-commodity measures (+ bulk apply) | `…commodityComplement[].numberOfPackages`, `.packageType`, `.quantity`, `.quantityType`, `.netWeight`, `.controlledAtmosphereContainer`, `.finishedOrPropagated`, `.testAndTrial`; select-all/Apply is UI, not data |
| inc-019 commodity-additional-details | consignment totals | `additionalDetails.totalGrossWeight`, `.grossVolume`, `.grossVolumeUnit`; `…commodityComplement[].intendedForFinalUsers`; Σ netWeight / Σ packages rollups **derived — never stored** |

## m4 — hub, logistics, parties, submit

| Increment | Page / concern | Backing field(s) |
|---|---|---|
| inc-020 notification-hub | 12-spoke task list; all-mandatory-complete unlocks Review | no fields — completeness **derived** from the document + a `GET …/accompanying-documents` count; hub reads `GET …/{reference-number}` (response embeds documents) |
| inc-021 transport-before-bip | BCP, premises, transport, arrival | `transport.borderControlPost`, `.inspectionPremises`, `.meansOfTransport`, `.transportIdentification`, `.transportDocumentReference`, `.arrivalDate`, `.arrivalTime` ("HH:mm" string), `.usesContainers`, `.containers[].{containerNumber, sealNumber, officialSeal}` |
| inc-022 goods-movement-services | CTC / MRN / GVMS (data, not integration) | `goodsMovementServices.commonTransitConvention`, `.movementReferenceNumber` (iff ADD_MRN_NOW — frontend rule), `.usingGvms` |
| inc-023 contact-details | responsible person (POP-2 auto-pop) | `responsiblePerson.{name, email, telephone, isAgent}`; email-OR-telephone is a frontend fieldset rule |
| inc-024 nominated-contact | repeating optional contacts | `nominatedContacts[].{name, email, telephone, isAgent}` |
| inc-025 accompanying-documents | document metadata; MANDATORY ≥1 to submit (c-015) | separate collection `plant_products_accompanying_documents`: `notificationReferenceNumber` (FK from URL path), `documentType`, `documentReference`, `issueDate`, `files[].{fileId, filename}` (metadata only; bytes = inc-037 deferred); endpoints `GET/POST …/accompanying-documents`, `PUT/DELETE …/{document-id}`. The ≥1-document submit gate is **frontend-enforced** (D-13) |
| inc-026 traders-addresses | traders table | `consignor` (hand-entered), `importer` (auto POP-1, stubbed org), `destination` ('Same as consignee' or entered), `packer` (optional); each a `PlantProductsOperator` |
| inc-027 consignor-create (+ confirmation) | hand-entered consignor | `consignor.name`, `.telephone`, `.email`, `.address.{addressLine1, addressLine2, addressLine3, city, postcode, country}`; confirmation page persists nothing |
| inc-028 notifications-dashboard | list own notifications | `GET /plant-products/notifications?page&sort&referenceNumber`; scope = `ownership.assignedOrganisationId` (compound index `org_status_dashboard`); DELETED hidden (`status IN DRAFT, SUBMITTED, AMEND`); sort whitelist `arrivalDate → transport.arrivalDate`, `createdAt → created` |
| inc-029 review-notification | check your answers (PRE-submit) | read-only over the whole document + embedded documents; submitted-by/submission rows **derived** from `status` + `declaration.declaredAt` |
| inc-030 declaration | attestation + submit | `declaration.agreed`, `declaration.declaredAt`; then `PUT …/{reference-number}/status {status: SUBMITTED}` (captures `submittedBaseline`, freezes `ownership` — OWN-3) |
| inc-031 confirmation | submission confirmation | `referenceNumber` read-back; inspection-status **derived** (risk stub always-low) — never stored |

## m5 fields already present in the schema (placeholders — do not re-model later)

| Increment | Backing schema surface (built now, consumed later) |
|---|---|
| inc-035 csv-upload | `commodity.inputMethod = CSV`; parsed rows land in the SAME `commodityComplement[]` subtree (branch-replacement — no new fields) |
| inc-036 CUC billing | `isCuc` (free-standing swappable trigger, c-007), `billing.address.{addressLine1..addressLine4, cityOrTown, county, postalCode}`, `billing.email`, `billing.telephone` |
| inc-038 consignor-search | `consignor.operatorId` (null while free-typed; populated when the address book arrives) |
| inc-039 draft lifecycle | `status` transitions via `PUT …/status` (DELETED soft-delete; AMEND + `submittedBaseline`; cancel-amend = `discardChanges: true`); copy-as-new via `POST …/{reference-number}/copies` |
| inc-040 Article 72 hook | no fields — server-side no-op rule hook reads `origin.countryCode` × `commodityComplement[].commodityCode` when supplied |
| inc-042 auth stub | `ownership.assignedOrganisationId` / `.assignedOrganisationName` set from the fixed signed-in user's org |

## Deferred layers (additive when unblocked — no pass-1 fields)

| Deferred increment | Future schema surface |
|---|---|
| inc-032 DoA layer | `ownership.agencyOrganisationId` (on-behalf-of marker, Trade Partner badge input), `ownership.createdByUserId`; visibility query rule; badge stays **derived — never stored** |
| inc-033/034 consignment-for/-organisation | routing inputs only; outcome persists into the existing `ownership.*` fields |
| inc-037 document bytes + AV | `plant_products_accompanying_documents` gains `scanStatus` (+ compound index `{notificationReferenceNumber, scanStatus}`, house parity) and real `files[].fileId` semantics |
| inc-041 cloning front door | none until the success path is sourced |
