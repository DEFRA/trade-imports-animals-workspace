# CHED-PP target data model

The JSON document the new CHED-PP app builds up across the journey and persists to MongoDB.

Derived from **what the journey COLLECTS** — the enriched per-page specs in `journey-spec.json`
(39 pages, 354 field rows) and the delegated-authority model in `authorization-rules.md` — and
shaped to mirror the **`trade-imports-animals`** (CHED-A / live-animals) service in this workspace
(`repos/trade-imports-animals-backend`), **not** IPAFFS's architecture: journey → one JSON object →
Mongo, whole-document save per page, no JSON-Patch, no per-microservice split.

Every field carries a confidence tag per the taxonomy:
`confirmed` (rendered in a trace) · `legacy` (read from authoritative IPAFFS source — trustworthy
for values/copy, "as the old system had it" for mandatoriness) · `inferred` (deduced from QA
tests/page objects) · `gap` (no evidence — a question for a human).

## What changed this regeneration

Two things the earlier revision did not carry:

1. **An ownership / delegated-authority layer** (`ownership.*`). The trace-only pass could not see
   it; `authorization-rules.md` supplies it. A CHED-PP is owned by the **organisation it was created
   FOR**, not the user who authored it (OWN-1). This is a genuine extension — the house
   `NotificationBase` is **single-tenant and has no org field at all**
   (`NotificationBase.java:18-52`), so tenancy is new surface the rebuild must own, not inherit.
2. **Auto-population provenance** (POP-1..4). Importer, Consignee and the Responsible-person contact
   are populated *from the owning org*, not typed; only the Consignor is hand-entered. The fields
   still land in the same operators — but the model records which are server-filled so the rebuild
   does not build data-entry pages for pass-through data.

The house neighbour we copy is CHED-A: `Notification extends NotificationBase`
(`NotificationBase.java:18-52`) → `origin`, `commodity` → `commodityComplement[]` → `species[]`,
`additionalDetails`, `consignor`/`consignee`/`importer`/`destination`/`placeOfOrigin`/`consignment`
(each an `Operator` → `Address`), `transport`, `status`, `created`, `updated`, plus a
`submittedBaseline` snapshot on `Notification` for the amend flow (`Notification.java:24-26`). Same
nesting, same naming, same enums where they carry over; only the plant leaves and the ownership
layer differ.

---

## Target shape (annotated TS / JSON)

```ts
// MongoDB collection: "notification"  (house parity — Notification.java @Document(collection = "notification"))
// One document == one CHED-PP notification (draft or submitted).
interface Notification {
  id: string                     // Mongo @Id (ObjectId hex). Not user data.  [Notification.java:22-23]
  referenceNumber: string        // server-minted on first save; @Indexed(unique, sparse).  [NotificationBase.java:20-21]
                                 //   house format GBN-AG-{YY}-{XXXXXX}; CHED-PP needs its own discriminator — OPEN Q 4.
  status: 'DRAFT' | 'SUBMITTED' | 'AMEND' | 'DELETED'   // reuse house enum verbatim (NotificationStatus.java:4). confirmed — all 4 exercised by the corpus (delete-notification → DELETED; amend → AMEND)
  chedType: 'CHEDPP'             // constant; app is CHED-PP-only. confirmed (import-type cert-type radio "Plants, plant products and other objects")

  // ─── OWNERSHIP / DELEGATED AUTHORITY ─── NEW. Not on the house model. Server-enforced tenancy.
  //     Sources: authorization-rules.md (OWN-1..3, AGT-1..4, BDG-1); legacy persisted field
  //     agencyOrganisationId at Notification.java:68 (IPAFFS schema) + notification-schema.json:977-979.
  ownership: {
    assignedOrganisationId: string      // THE OWNING TENANT — the org this notification was created FOR.
                                         //   Every visibility/dashboard query scopes on this. @Indexed. Enforced server-side, never a form field.
                                         //   confirmed OWN-1 (co-member sees a shared-org submission; agent route owner = selected delegated org)
    assignedOrganisationName: string     // display name of the owning org. confirmed (review #responsible-organisation-name)
    agencyOrganisationId?: string        // LEGACY NAME kept deliberately (Notification.java:68) — the ACTING AGENT'S OWN org id,
                                         //   set ONLY when an agent creates on behalf of a DIFFERENT org; null for own-org and member-created.
                                         //   This is the on-behalf-of marker and the sole input to the Trade Partner badge. confirmed BDG-1
    createdByUserId?: string             // author (audit only — NOT the owner). inferred (POP-2 shows author ≠ owner ≠ contact)
  }
  // NOT persisted: the `for-own-organisation` boolean from consignment-for is a ROUTING input the
  // frontend consumes to decide the owning org (Joi.boolean().required(), consignment_for.js:15-17);
  // its OUTCOME is persisted as ownership.agencyOrganisationId. legacy (field note, consignment-for).
  // DERIVED, never stored: tradePartnerBadge = (chedType == 'CHEDPP' && ownership.agencyOrganisationId != null).
  //   confirmed render condition (legacy notificationList.html:28-30); compute at read time. See §Trade Partner badge.

  // Country of origin / consignment + internal reference.  Mirrors house Origin (Origin.java:12-18).
  origin?: {
    countryCode?: string              // ISO-2 country of origin. confirmed (country-of-origin origin-country; origin-of-import origin-country). ref-data: Countries (~254)
    countryOfConsignmentCode?: string // "Country from where consigned". confirmed (origin-of-import consigned-country). ref-data: Countries. OPEN Q 9 (always == countryCode in traces)
    internalReference?: string        // optional local reference, max 30. confirmed (origin-of-import local-reference-number); never filled (optional)
    // house Origin.requiresRegionCode is NOT rendered for CHED-PP (origin-of-import template gate excludes CHEDPP) — omitted.
  }

  // Main reason for import. House top-level name verbatim (NotificationBase.java:27).
  reasonForImport?: 'INTERNAL_MARKET' | 'RE_ENTRY' | 'RE_CONFORMITY_CHECK'
                                 // confirmed (about-the-consignment purpose, 3 radios). Legacy wire values internalmarket|import|reconformity — normalise; do not inherit the inconsistent vocab. OPEN Q 5

  // The heart of CHED-PP. Mirrors house Commodity → commodityComplement[] (Commodity.java, CommodityComplement.java).
  commodity?: {
    name?: string                      // house Commodity.name (Commodity.java:14). inferred — a group label; CHED-PP shows a per-leaf description instead
    inputMethod?: 'MANUAL' | 'CSV'      // confirmed (commodity-input-method input-method). Routing choice; kept for provenance. The CSV branch REPLACES the manual pages and yields the SAME lines (modelGap: branch-replacement)
    commodityComplement: CommodityLine[]  // nested repeating group: commodity[] → species[] → variety/class[] (modelGap: nested-repeating-groups)
  }

  // Consignment-level totals. House additionalDetails (AdditionalDetails.java) — livestock leaves dropped, plant leaves added.
  additionalDetails?: {
    totalGrossWeight?: number           // kg, real number. confirmed (commodity-additional-details gross-weight)
    grossVolume?: number                // optional. confirmed (commodity-additional-details gross-volume)
    grossVolumeUnit?: 'LITRES' | 'METRES_CUBED'   // required iff grossVolume set. confirmed (gross-volume-unit)
    // read-only rollups (Σ netWeight, Σ packages) are DERIVED and rendered read-only — never stored.
  }

  // Parties. Each is a house Operator (Operator.java:12-19) → operatorId/name/telephone/email/Address.
  consignor?: Operator            // "consignor or exporter" — HAND-ENTERED. confirmed POP-4 (full address form, consignor-create)
  consignee?: Operator            // AUTO-POPULATED as the owning org (never typed). confirmed POP-3 ('IPAFFS Plant Organisation 1' / 'Test Org Ltd')
  importer?: Operator             // AUTO-POPULATED as the owning org + its registered address (agent never types it). confirmed POP-1. House name kept.
  destination?: Operator          // "place of destination". Set via 'Same as consignee' (#populate-place-of-destination) or entered. confirmed (traders-addresses). House name (house calls it destination, not placeOfDestination)
  packer?: Operator               // "Add a packer (optional)". confirmed present (traders-table-packer); optional, never filled in any trace. CHED-PP addition — house has no packer
  // house placeOfOrigin / consignment operators: no CHED-PP page collects them — omitted (see Deviations).

  // Contacts.
  responsiblePerson?: Contact     // AUTO-POPULATED from a MEMBER of the owning org, not the acting agent (agent page is pass-through). confirmed POP-2; WHICH member is chosen = gap G-1. Fields: name/email/telephone (+ isAgent). name required; "email OR telephone" at fieldset level (modelGap: at-least-one-of-siblings)
  nominatedContacts?: Contact[]   // repeating ("Add another nominated contact" / remove). confirmed (nominated-contact add/remove buttons). Each optional; same email-or-telephone rule

  // Transport to the BCP.  Mirrors house Transport (Transport.java:14-24); reuses MeansOfTransport enum.
  transport?: {
    borderControlPost?: string          // BCP code, e.g. GBFXT1PP. confirmed (transport-before-bip bcp). ref-data: BCPs (144). House field is portOfEntry — renamed (see Deviations)
    inspectionPremises?: string         // control-point code, e.g. INSPBAR1. confirmed (transport-before-bip control-point). ref-data: per-BCP list (52-135; filtering rule is a gap)
    meansOfTransport?: 'AIRPLANE' | 'RAILWAY' | 'ROAD_VEHICLE' | 'VESSEL'  // reuse house enum (MeansOfTransport.java). confirmed (transport-means-before, 5 options incl. placeholder)
    transportIdentification?: string    // flight/train/reg/vessel. confirmed (identification)
    transportDocumentReference?: string // confirmed (document)
    arrivalDate?: string                // ISO "YYYY-MM-DD". house stores LocalDate. confirmed (arrival-date-day/month/year)
    arrivalTime?: string                // "HH:mm" 24h. CHED-PP addition (house has no time). confirmed (arrival-time-hour/minutes)
    usesContainers?: boolean            // "Are any road trailers or shipping containers being used?" confirmed (consignment-in-container). server-defaults to No; reveal never exercised
    containers?: Array<{                // repeating group ("Add another container or trailer"). confirmed field defs; hidden reveal never filled in any trace
      containerNumber?: string          // container-number-N
      sealNumber?: string               // seal-number-N
      officialSeal?: boolean            // official-seal-N checkbox
    }>
  }

  // GVMS / Common Transit Convention answers. DATA, not an integration (integrations.md: no client fires; two radios + an MRN).
  goodsMovementServices?: {
    commonTransitConvention?: 'ADD_MRN_NOW' | 'ADD_MRN_LATER' | 'NO'  // confirmed (goods-movement-services ctc-question, 3 options)
    movementReferenceNumber?: string    // NCTS MRN, 18-char pattern. confirmed (ncts-mrn); required iff ADD_MRN_NOW
    usingGvms?: boolean                 // "Will the transport use the GVMS?" confirmed (gvms-question)
  }

  // Common User Charge billing — CUC notifications only. confirmed pages exist (confirm-billing-details, billing-*).
  billing?: {
    address?: {                         // confirm-billing-details hidden fields + billing-find/select-the-address
      addressLine1?: string; addressLine2?: string; addressLine3?: string; addressLine4?: string   // addressLine4 legacy (confirm-billing-details)
      cityOrTown?: string; county?: string; postalCode?: string
    }
    email?: string                      // confirmed (billing-change-contact-details email)
    telephone?: string                  // confirmed (billing-change-contact-details telephone)
    // scope of CUC billing for pass 1 = OPEN Q 11
  }

  // Final declaration. confirmed (declaration declaration-agree checkbox + submissionDate + Submit).
  declaration?: { agreed: boolean; declaredAt?: string }   // house records submission via status + snapshot only; explicit attestation kept — OPEN Q 6

  // Amend baseline — house parity (Notification.java:24-26 submittedBaseline). Captures submitted content when an amendment begins.
  submittedBaseline?: NotificationContentSnapshot   // supports OWN-3 (owner changeable in Draft, fixed at submit) + the id-flip at submission

  created?: string                      // ISO timestamp, set on create.  [NotificationBase.java:49]
  updated?: string                      // ISO timestamp, set on every save. [NotificationBase.java:51]
}

// One commodity line = one CN code plus its species. Mirrors house CommodityComplement (CommodityComplement.java:13-20).
interface CommodityLine {
  commodityCode: string                 // CN/HS code, e.g. "06011010" / "10083000". confirmed (commodity-search commodity-text-input). ref-data: Commodity codes
  commodityDescription?: string         // leaf desc, e.g. "Hyacinths". confirmed (commodity-summary column). ref-data-derived, not typed
  numberOfPackages?: number             // confirmed (commodity-bulk-details <uuid>.num-packages / bulk-num-packages)
  packageType?: string                  // code, e.g. "Box". confirmed (package-type / bulk-package-type). ref-data: Package types (24)
  quantity?: number                     // confirmed (quantity / bulk-quantity)
  quantityType?: string                 // code, e.g. "Bulbs". confirmed (quantity-type / bulk-quantity-type). ref-data: Quantity types (8)
  netWeight?: number                    // kg. confirmed (net-weight / bulk-net-weight)
  controlledAtmosphereContainer?: boolean   // confirmed (container / bulk-container Yes/No — store boolean, not 'on'/'off')
  finishedOrPropagated?: 'FINISHED' | 'PROPAGATED'  // plants-for-planting lines only. confirmed (finished-or-propagated). OPEN Q 6
  intendedForFinalUsers?: boolean       // "Intended for final users (or commercial flower production)". inferred (commodity-additional-details commodity-intended-for; CSV column)
  testAndTrial?: boolean                // per-line flag. inferred (commodity-bulk-details <uuid>.test-and-trial)
  uniqueComplementId?: string           // internal row id behind commodity-<uuid> / remove_species_<id>. inferred — persist as the stable line key
  species: Species[]
}

// One genus/species selected against a commodity line. House Species (Species.java) leaves (value/text/noOfAnimals/earTag/passport)
// replaced with plant leaves; the container name `species[]` is kept for house parity.
interface Species {
  eppoCode: string                      // e.g. "CIDAC", "PHAAN". confirmed (commodity-basic-description eppo-code / <EPPO>-checkbox / add-species). ref-data: EPPO codes
  genusAndSpecies?: string              // scientific name, e.g. "Citrus australasica". confirmed (commodity-basic-description genus; commodity-summary read-back). ref-data-derived
  speciesId?: string                    // internal numeric id behind add-species-<id> (integrations.md). gap: stability across ref-data refreshes — see OPEN Q 1
  varieties?: Array<{                   // per-species variety/class rows. confirmed (variety-of-genus-and-species). Only species carrying variety/class ref-data reach this page
    variety?: string                    // add-variety-<eppo> select, or add-varietyother-<eppo> free-text when "Other". Persist a variety ID, not the display string (risk engine keys on varietyId) — OPEN Q 2
    varietyClass?: 'CLASS_I' | 'CLASS_II' | 'EXTRA_CLASS'   // add-class-<eppo>, 3-value enum ("Extra Class" observed). confirmed; blank when N/A
  }>
}

// House Operator (Operator.java:12-19) reused unchanged.
interface Operator {
  operatorId?: string                   // address-book id when picked; null when free-typed (address book DEFERRED for pass 1 — integrations.md)
  name?: string; telephone?: string; email?: string   // confirmed (consignor-create company-name/telephone/email)
  address?: Address
}

// House Address (Address.java:12-21) reused. House has `county`; the CHED-PP consignor form has line 3 instead — use addressLine3.
interface Address {
  addressLine1?: string                 // confirmed (consignor-create address-line-1)
  addressLine2?: string                 // optional. confirmed
  addressLine3?: string                 // optional. confirmed (house uses `county`)
  city?: string                         // "City or town". confirmed (city-or-town)
  postcode?: string                     // "Postcode or ZIP code". confirmed (postcode)
  country?: string                      // ISO / GB-subdivision code. confirmed (country, ~254 options). ref-data: Countries. OPEN Q 10 (region codes vs ISO in one field)
}

interface Contact {
  name?: string                         // confirmed (contact-details/nominated-contact name)
  email?: string                        // confirmed
  telephone?: string                    // confirmed
  isAgent?: boolean                     // contact-details "agent" field. inferred
}
// email/telephone individually optional; "Enter an email address or mobile number" enforced at the fieldset (modelGap: at-least-one-of-siblings). NOTE the mobile field is named three ways in one validator (conflict c-020).

// SEPARATE COLLECTION — house parity + separate-app boundary (modelGap: separate-app-boundary).
// Attachments are handled by a distinct /upload/ app (ipaffs-frontend-upload); the scan is async, so embedding
// would make the scan callback rewrite the notification. Joined on referenceNumber, re-attached at read.
interface AccompanyingDocument {
  id: string
  notificationReferenceNumber: string   // indexed FK
  documentType?: string                 // 17-option list. confirmed (accompanying-documents document-type). ref-data: Document types
  documentReference?: string            // confirmed (document-reference)
  issueDate?: string                    // ISO "YYYY-MM-DD". confirmed (document-issue-date-day/month/year)
  files?: Array<{ fileId?: string; filename?: string }>   // bytes handled by the SEPARATE upload app — DEFERRED for pass 1 (metadata only)
}
```

---

## Ownership, visibility & auto-population (the DoA layer)

The three cross-page behaviours the page-owned spine cannot express as per-field rules
(modelGap: `delegated-authority-model`). All rendered-confirmed; sources in `authorization-rules.md`.

### Ownership — persisted on the document
| Rule | Effect on the model | Confidence |
|---|---|---|
| OWN-1 | `ownership.assignedOrganisationId` is the owning tenant; every visibility query scopes on it; enforce server-side | confirmed |
| OWN-2 | member-created ⇒ `assignedOrganisationId` = their org, `agencyOrganisationId` = null, no badge, no org-selection page | confirmed |
| OWN-3 | owner is changeable while `status == DRAFT`, fixed at submit; `submittedBaseline` captures the pre-amend content | confirmed |
| AGT-1/2 | agent may create for a delegated org (→ `agencyOrganisationId` set) or own org (→ null) | confirmed |

### Visibility — a QUERY rule, not a stored field
Dashboard visibility is scoped by a **current-organisation context** the user switches
(VIS-6). It is **session state, not notification data** — do not store it on the document. The
read rule: a notification is visible to a user when `ownership.assignedOrganisationId` ∈ {the
user's member orgs ∪ the user's delegated orgs} **and** equals the currently-selected org context.
Drafts are private to the author until submitted (VIS-4). Non-authors who can see a notification
get the **full** action set — no read-only downgrade (CAP-1). This drives the `notification`
index on `assignedOrganisationId` and, for the dashboard filter, `status`.

### Trade Partner badge — DERIVED at read time, never stored
`badge = (chedType == 'CHEDPP' && ownership.agencyOrganisationId != null)` — teal
`govuk-tag--teal` beneath the CHED status tag (BDG-1, legacy `notificationList.html:28-30`).
Compute it; do not persist it. Gap G-2: whether an org-member amend/copy strips
`agencyOrganisationId` (and so the badge) is unexercised.

### Auto-population — which parties are server-filled vs typed
| Party | Source | Model note | Confidence |
|---|---|---|---|
| `importer` | owning org + registered address (POP-1) | server-filled; no data-entry page | confirmed |
| `consignee` | owning org (POP-3) | server-filled | confirmed |
| `responsiblePerson` | a MEMBER of the owning org (POP-2) | server-filled; WHICH member = gap G-1 | confirmed |
| `consignor` | hand-entered (POP-4) | the ONE party the notifier types in full | confirmed |

---

## Reference data (stored by code, never as free text)

Cross-referenced to `integrations.md`. All are server-side lookups in the house style (frontend
clients → backend), matching the `countries-client` / `ports-of-entry-client` pattern already in
`-frontend/src/server/common/clients/`.

| List | Field(s) | Source (integrations.md) | Pass 1 |
|---|---|---|---|
| Countries (ISO + GB-ENG/SCT/WLS/NIR) | `origin.countryCode`, `origin.countryOfConsignmentCode`, `Address.country` | Countries service | hardcode JSON (~254) |
| Commodity codes (CN tree) | `CommodityLine.commodityCode`, `.commodityDescription` | Commodity code service | fixture (~10 codes) |
| EPPO / species codes | `Species.eppoCode`, `.genusAndSpecies`, `.speciesId` | Commodity-species service | fixture per commodity |
| Variety / class | `Species.varieties[].variety`, `.varietyClass` | Commodity attributes / ref-data | class = fixed 3-enum; variety = per-species ref-data |
| Border control posts | `transport.borderControlPost` | BIP service | hardcode JSON (144) |
| Control points (inspection premises) | `transport.inspectionPremises` | BIP service, keyed by BCP | hardcode per-BCP map (52-135, filtered) |
| Package types | `CommodityLine.packageType` | Reference data | hardcode (24) |
| Quantity types | `CommodityLine.quantityType` | Reference data | hardcode (8) |
| Means of transport | `transport.meansOfTransport` | Static enum | in model (4) |
| Document types | `AccompanyingDocument.documentType` | Reference data | hardcode (17) |
| Volume unit | `additionalDetails.grossVolumeUnit` | Static enum | in model |
| Billing addresses | `billing.address` | Address-lookup service (postcode) | stub/defer (CUC) |
| Organisations (own + delegated) | `ownership.assignedOrganisationId` / `.agencyOrganisationId` | Customer / Defra ID (per-user, NOT ref-data) | stub a fixed agent + delegated set |

---

## Persistence (Mongo, house style)

- **Collections:** `notification` (singular, `Notification.java @Document`) and
  `accompanying_documents` (separate — async scan boundary). No microservice split.
- **Document identity:** Mongo `@Id id` (ObjectId); business key `referenceNumber` with
  `@Indexed(unique = true, sparse = true)` (`NotificationBase.java:20-21`) — minted on first create,
  sparse because an in-flight document may briefly have none.
- **Tenancy index (NEW):** `ownership.assignedOrganisationId` — every dashboard/visibility query
  scopes on it (VIS-1..6). Compound with `status` for the dashboard filter.
- **Draft save + resume:** the frontend holds each page's answers in session; on every *Save and
  continue* / *Save and return to hub* it rebuilds the **whole** document and `POST /notifications`
  — no per-page partial write. Blank `referenceNumber` ⇒ create (`status = DRAFT`, `created = now`,
  mint ref); present ⇒ update (overwrite, `updated = now`). The draft is minted by the first page
  that saves.
- **Submit / lifecycle:** declaration → `SUBMITTED`; `AMEND` (with `submittedBaseline` snapshot),
  cancel-amend, copy-as-new, and soft-delete (`DELETED`, via delete-notification) reuse the house
  transitions — all exercised by the corpus. The owning org is fixed at submit (OWN-3).
- **No JSON-Patch, no ETag.** IPAFFS round-trips an `etag` into `If-Match` on a JSON-Patch PATCH
  (the `etag` hidden field appears on ~12 editable pages — modelGap `optimistic-concurrency-etag`);
  its op-shape was never observable. Whole-document POST drops that layer. Cost: two tabs editing
  one draft is last-write-wins — a **deliberate** concurrency decision, see OPEN Q 3 (the house
  `Notification` has no `@Version` today either).
- **No dual-id URL scheme.** IPAFFS flips the id `DRAFT.GB.… → CHEDPP.GB.…` at submit and serves
  pages under both (modelGap `id-flip-draft-to-ched`); the rebuild keeps one stable id and moves
  `status` instead.

---

## fieldMap — every page field → target model path

Covers all 39 pages. Hidden plumbing (`crumb` CSRF, `etag` concurrency token, `type`/`orgId`/
`returnUrl`/`fromFooterHeader`/`commodityDetailsPage`/`selectedCommodity`/`is-last-of-page`/routing
hidden inputs) is **not** data and maps nowhere by design — noted once here, not per row.

| Page (slug) | Field | Target path |
|---|---|---|
| import-type | cert-type radio | `chedType` (const `CHEDPP`) |
| consignment-for | for-own-organisation (own vs different) | routing input → `ownership.agencyOrganisationId` (set on "different") |
| consignment-organisation | organisation (which delegated org) | `ownership.assignedOrganisationId` / `.assignedOrganisationName` |
| *(server, both above)* | resolved owning org | `ownership.assignedOrganisationId`; agent's own org → `ownership.agencyOrganisationId` |
| country-of-origin | origin-country | `origin.countryCode` |
| origin-of-import | origin-country | `origin.countryCode` |
| origin-of-import | consigned-country | `origin.countryOfConsignmentCode` |
| origin-of-import | local-reference-number | `origin.internalReference` |
| origin-of-import | conform / health-cert / change-after-BCP (yes/no) | — (defaults accepted; uncovered surface, gap) |
| commodity-input-method | input-method (manual/csv) | `commodity.inputMethod` |
| csv-upload | fileUpload → parsed rows | `commodity.commodityComplement[]` (same 12 obligations as manual) |
| csv-upload | csvColumn:Commodity code | `…commodityComplement[].commodityCode` |
| csv-upload | csvColumn:Genus and Species / EPPO code | `…commodityComplement[].species[].genusAndSpecies` / `.eppoCode` |
| csv-upload | csvColumn:Variety / Class | `…species[].varieties[].variety` / `.varietyClass` |
| csv-upload | csvColumn:Intended for final users | `…commodityComplement[].intendedForFinalUsers` |
| csv-upload | csvColumn:Number of packages / Type of package | `…commodityComplement[].numberOfPackages` / `.packageType` |
| csv-upload | csvColumn:Quantity / Quantity type | `…commodityComplement[].quantity` / `.quantityType` |
| csv-upload | csvColumn:Net weight (kg) | `…commodityComplement[].netWeight` |
| csv-upload | csvColumn:Controlled atmosphere container | `…commodityComplement[].controlledAtmosphereContainer` |
| commodity-search | commodity-text-input (code) / parent_<chapter> browse | `…commodityComplement[].commodityCode` |
| commodity-search | species-text-input (EPPO search tab) | → resolves species on next page |
| commodity-basic-description | genus | `…species[].genusAndSpecies` |
| commodity-basic-description | eppo-code / `<EPPO>-checkbox` / add-species-<id> | `…species[].eppoCode` (+ `.speciesId`) |
| variety-of-genus-and-species | add-variety-<eppo> / add-varietyother-<eppo> | `…species[].varieties[].variety` |
| variety-of-genus-and-species | add-class-<eppo> | `…species[].varieties[].varietyClass` |
| commodity-summary | table columns (code/genus/eppo/variety/class) + remove_species_<id> | — (read-only echo; `uniqueComplementId` is the row key) |
| about-the-consignment | purpose | `reasonForImport` |
| notification-hub | task-list links/sections | — (navigation + derived completeness; no data) |
| commodity-bulk-details | select-all / commodity-<uuid> / Apply | — (bulk-apply UI, not data) |
| commodity-bulk-details | (bulk-)num-packages | `…commodityComplement[].numberOfPackages` |
| commodity-bulk-details | (bulk-)package-type | `…commodityComplement[].packageType` |
| commodity-bulk-details | (bulk-)quantity | `…commodityComplement[].quantity` |
| commodity-bulk-details | (bulk-)quantity-type | `…commodityComplement[].quantityType` |
| commodity-bulk-details | (bulk-)net-weight | `…commodityComplement[].netWeight` |
| commodity-bulk-details | (bulk-)container | `…commodityComplement[].controlledAtmosphereContainer` |
| commodity-bulk-details | finished-or-propagated | `…commodityComplement[].finishedOrPropagated` |
| commodity-bulk-details | test-and-trial | `…commodityComplement[].testAndTrial` |
| commodity-additional-details | gross-weight | `additionalDetails.totalGrossWeight` |
| commodity-additional-details | gross-volume | `additionalDetails.grossVolume` |
| commodity-additional-details | gross-volume-unit | `additionalDetails.grossVolumeUnit` |
| commodity-additional-details | commodity-intended-for | `…commodityComplement[].intendedForFinalUsers` |
| commodity-additional-details | (computed) totalNetWeight / numberOfPackages | — (derived, not stored) |
| transport-before-bip | bcp | `transport.borderControlPost` |
| transport-before-bip | control-point | `transport.inspectionPremises` |
| transport-before-bip | transport-means-before | `transport.meansOfTransport` |
| transport-before-bip | identification | `transport.transportIdentification` |
| transport-before-bip | document | `transport.transportDocumentReference` |
| transport-before-bip | arrival-date-day/month/year | `transport.arrivalDate` |
| transport-before-bip | arrival-time-hour/minutes | `transport.arrivalTime` |
| transport-before-bip | consignment-in-container | `transport.usesContainers` |
| transport-before-bip | container-number-N / seal-number-N / official-seal-N | `transport.containers[].{containerNumber,sealNumber,officialSeal}` |
| goods-movement-services | ctc-question | `goodsMovementServices.commonTransitConvention` |
| goods-movement-services | ncts-mrn | `goodsMovementServices.movementReferenceNumber` |
| goods-movement-services | gvms-question | `goodsMovementServices.usingGvms` |
| contact-details | name / email / telephone / agent | `responsiblePerson.{name,email,telephone,isAgent}` (auto-populated, POP-2) |
| nominated-contact | name / email / telephone (+ add/remove) | `nominatedContacts[].{name,email,telephone}` |
| accompanying-documents | document-type | `AccompanyingDocument.documentType` |
| accompanying-documents | document-reference | `AccompanyingDocument.documentReference` |
| accompanying-documents | document-issue-date-* | `AccompanyingDocument.issueDate` |
| document-upload | fileUpload | `AccompanyingDocument.files[]` (deferred — metadata only) |
| traders-addresses | consignor (add/change) | `consignor.*` (hand-entered) |
| traders-addresses | importer (populate-importer "Same as consignee") | `importer.*` (auto-populated, POP-1) |
| traders-addresses | place-of-destination (#populate/#edit) | `destination.*` |
| traders-addresses | packer (add/remove, optional) | `packer.*` |
| consignor-search | name / address / country | — (address-book search; DEFERRED pass 1) |
| consignor-create | company-name | `consignor.name` |
| consignor-create | telephone / email | `consignor.telephone` / `.email` |
| consignor-create | address-line-1/2/3 | `consignor.address.addressLine1/2/3` |
| consignor-create | city-or-town | `consignor.address.city` |
| consignor-create | postcode | `consignor.address.postcode` |
| consignor-create | country | `consignor.address.country` |
| consignor-confirmation | (confirm) | — (no data) |
| confirm-billing-details | addressLine1-4 / cityOrTown / county / postalCode / email / telephone | `billing.address.*` / `billing.email` / `billing.telephone` |
| billing-find-an-address | postalCode | `billing.address.postalCode` (lookup key) |
| billing-select-the-address | addressListBox | `billing.address.*` (resolved) |
| billing-change-contact-details | email / telephone | `billing.email` / `billing.telephone` |
| review-notification | (all rows display-only) | — (read-back; `submitted-by-name`/`submission-date`/`submission-time` are derived from status+audit) |
| declaration | declaration-agree | `declaration.agreed` (+ `declaredAt` from submissionDate) |
| confirmation | reference-number(-customs/-document) / inspection-status | `referenceNumber` (server); inspection-status derived (risk assessment, stubbed) |
| delete-notification | (confirm delete) | `status` → `DELETED` (lifecycle, no field) |
| split-consignment-confirm | (confirm split) | lifecycle action (no data captured here) |
| sign-in | amrExecuted / authenticationMethodsEnabledString | — (auth handshake, not notification data) |
| cloning-search / cloning-summary / cloning-type | search + clone params | — (separate front door; see Excluded) |

Nothing in a page spec is left unmapped; nothing in the model lacks a page except the server-set
`id` / `referenceNumber` / `status` / `created` / `updated` and the derived Trade Partner badge.

**Off the create journey, deliberately excluded (flagged, not modelled):** every `decision-*` page
(the BIP inspector app — a wholly separate service, modelGap `separate-app-boundary`), the whole
`cloning-*` front door (searches TRACES; all three corpus traces hit the 406 "cannot clone"), and
`sign-in` (auth). Both inspector and cloning are separate remits.

---

## Deviations from the house (each deliberate)

| Deviation | House | Here | Why |
|---|---|---|---|
| `ownership.*` added (assignedOrganisationId, agencyOrganisationId, …) | **no org field at all — single-tenant** (`NotificationBase.java:18-52`) | full tenancy layer | CHED-PP is multi-tenant with delegated authority; owner ≠ author (OWN-1..3, BDG-1) |
| `commodity.inputMethod` added | not present | CSV vs MANUAL kept | provenance of a CSV-sourced line; may be dropped if parsed lines are the whole truth |
| `Species` leaves | `value/text/noOfAnimals/earTag/passport` (Species.java) | `eppoCode/genusAndSpecies/speciesId/varieties[]` | livestock leaves replaced with plant identity; container name kept |
| `CommodityLine` leaves | `typeOfCommodity/totalNoOfAnimals/totalNoOfPackages` | plant measures + `finishedOrPropagated` + `intendedForFinalUsers` | plants count packages/weight/quantity, not animals |
| `AdditionalDetails` leaves | `certifiedFor/unweanedAnimals` | `totalGrossWeight/grossVolume/grossVolumeUnit` | livestock attestations replaced with plant totals |
| `transport.borderControlPost` | `Transport.portOfEntry` | renamed | CHED-PP collects two locations (BCP + inspection premises); `portOfEntry` beside `inspectionPremises` misreads |
| `transport.arrivalTime`, `containers[]`, `usesContainers` added | `arrivalDate` only | added | CHED-PP collects a time + a container/seal repeating group |
| `packer` added | not present | optional `Operator` | CHED-PP traders page offers "Add a packer (optional)" |
| `destination` name kept | `destination` | `destination` | house name reused verbatim (not `placeOfDestination`) |
| `nominatedContacts[]` as array | — | repeating | page offers add/remove nominated contacts |
| `placeOfOrigin`, `consignment`, `cphNumber`, `transitedCountries`, `transporter` omitted | present on house | absent | no CHED-PP page collects them; don't carry livestock fields into a plants model |
| accompanying docs = separate collection | already separate | same | async scan callback must not rewrite the notification |
| declaration stored explicitly | house records via `status` + snapshot only | `declaration{agreed,declaredAt}` | legal may want the attestation explicit — OPEN Q 6 |
| single stable id, `status` moves | house already does this | same | reject IPAFFS's DRAFT→CHEDPP id-flip + dual-id URLs |

---

## Open questions

1. **Species identity (changes the model).** Selection resolves to an internal numeric id
   (`add-species-<id>`), not the EPPO code (integrations.md). Stable across ref-data refreshes? If
   not, `species[].speciesId` is unsafe as a stored key and `eppoCode` must be the join key.
2. **Variety identity.** The page posts a variety *display name*; the risk engine keys on a
   `varietyId`. Persist a variety code/id, not the label, where ref-data allows.
3. **Concurrency.** Dropping ETag/`If-Match` (used on ~12 editable pages) means two tabs editing one
   draft silently last-write-wins. Is two-tab editing real? The house `Notification` has no
   `@Version` either — the gap exists in the neighbour. A **deliberate** decision, not a free
   simplification (modelGap `optimistic-concurrency-etag`).
4. **Reference-number format.** House is `GBN-AG-{YY}-{XXXXXX}`. CHED-PP needs its own discriminator
   (e.g. `GBN-PP-…`) or the IPAFFS `CHEDPP.GB.YYYY.NNNNNNN` shape — the latter matters if downstream
   (Dynamics filters `trd_chedppreference`) is in scope.
5. **`reasonForImport` enum.** Only "Internal market" ever chosen. Confirm the other two values and
   whether any branch the journey.
6. **`finishedOrPropagated` / declaration.** Only "Finished" observed — confirm the full value set
   (control has no accessible name, an a11y defect to fix not port). And confirm whether the
   attestation should be stored explicitly vs implied by `status`.
7. **Ownership: which member becomes 'Responsible person' (G-1).** POP-2 auto-populates the contact
   from a member of the owning org, but the rule choosing WHICH member is unshown. Blocks building
   the auto-population.
8. **Badge lifecycle (G-2).** Does an org-member amend/copy of an agent-created notification strip
   `ownership.agencyOrganisationId` (and so the Trade Partner badge)? Unexercised.
9. **Co-member action success (G-3).** VIS-1/VIS-5 prove the controls RENDER for non-authors; they
   don't prove Amend/Copy SUCCEED. Confirm the write path honours the same visibility.
10. **Draft privacy intent (G-4).** Drafts are private to the author pre-submit — deliberate policy
    (agents own WIP) or an artefact that stops the owning org intervening? Affects the visibility
    query.
11. **≥8 delegations (G-5).** The org picker flips from radios to an autocomplete `<select>` at ≥8
    delegated orgs — never traced. Doesn't change the model (still one `assignedOrganisationId`) but
    the frontend must handle it.
12. **Collapse the two-page org selector (G-6).** `consignment-for` + `consignment-organisation` are
    one logical question over two pages; the rebuild could list own-org alongside delegated orgs as
    sibling radios, replacing the `for-own-organisation` boolean with one required "Select an
    organisation".
13. **Unexercised parties / auto-population surface.** `importer`, `destination`, `consignee`,
    `responsiblePerson`, `nominatedContacts`, `packer` are on rendered pages but no trace fills them
    by hand (several are server-filled per POP-1..3). Confirm which are entry pages vs pass-through.
14. **CUC billing** shape is provisional (thin evidence, no captured URLs). Decide whether CUC is in
    scope for pass 1.
15. **Country-of-consignment independence (Q9) & trader region codes (Q10).** In every trace
    `countryOfConsignmentCode == countryCode`; and `Address.country` mixes ISO codes (`FR`) with
    GB-subdivision codes (`GB-ENG`). Confirm both before finalising the two country fields.
