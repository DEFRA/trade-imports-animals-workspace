# CHED-D target data model

The JSON document the new CHED-D app builds up across the notifier create journey and persists to
MongoDB.

Derived from **what the journey COLLECTS** — the 41 enriched per-page specs in `journey-spec.json`
(283 field entries; the linear notifier create journey is orders 0-28, plus the Common User Charge
(CUC) billing variant and the inspector/decision surface at order -1) and the delegated-authority
model in `authorization-rules.md` — and shaped to mirror the **`trade-imports-animals`**
(CHED-A / live-animals) service in this workspace
(`repos/trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/`),
**not** IPAFFS's architecture: journey → one JSON object → Mongo, whole-document save per page, no
JSON-Patch, no per-microservice split, one stable id.

Every field carries a confidence tag per the run taxonomy:
`confirmed` (rendered in a CHED-D trace) · `confirmed (CHED-PP DoA)` (rendered only in the shared
DoA corpus — NOT confirmed *for CHED-D*) · `legacy` (read from authoritative IPAFFS source —
trustworthy for values/copy, "as the old system had it" for mandatoriness) · `inferred` (deduced
from QA tests/page objects or the system-wide model applied to CHED-D by architecture) · `gap` (no
CHED-D evidence — a question for a human).

## What this regeneration adds over the trace-only pass

Three things the frontend-only trace pass could not carry:

1. **An ownership / delegated-authority layer** (`ownership.*`) — `authorization-rules.md`. A
   notification is owned by the **organisation it was created FOR**, not the user who authored it
   (OWN-1); a co-member of that org sees it as their own (VIS-1). This is a genuine **new surface**:
   the house `NotificationBase` is **single-tenant and has no org field at all**
   (`NotificationBase.java:19-53`), so tenancy is something the rebuild must own, not inherit. **For
   CHED-D the ownership/visibility rules apply (inferred, testable) but the delegated-agent creation
   route and the Trade Partner badge do NOT** — they are CHED-PP-only in legacy (AGT-1, BDG-1). The
   on-behalf-of field is therefore carried in the schema but **dormant for CHED-D as-is** (see §Ownership).
2. **Legacy mandatoriness + validation copy.** The trace pass saw only happy-path renders; the Joi
   validators, `ValidationMessages`, and the Java `@NotNull` groups now supply per-field
   requiredness and the verbatim error copy. Two caveats the model records: mandatoriness is
   **server-side everywhere** (no page sets HTML `required` — JB-1), and for CHED-D the **frontend
   Joi form is stricter than the backend CED `@NotNull` group** (JB-2, c-038) — the backend has no
   CED `@NotNull` on the address/contact/document rows at all, so the rebuild must pick which layer
   is canonical (OPEN Q 2).
3. **Reference data comes from services, never hardcoded lists** (JB-3) — the two country lists, BCP/
   port lists, the CN commodity tree, 25 CHED-D package types, 14 CHED-D document types, and the
   inspector-side sample/lab taxonomies (§Reference data).

The house neighbour we copy is **CHED-A** (`Notification extends NotificationBase`,
`Notification.java:72`): `origin`, `commodity → commodityComplement[] → species[]`,
`additionalDetails`, `consignor`/`consignee`/`importer`/`destination` (each an `Operator` →
`Address`), `transport` (house `portOfEntry` reused verbatim), `status`, `created`, `updated`, plus
the `submittedBaseline` snapshot for amend (`Notification.java:78-79`). Same nesting, same naming,
same enums where they carry over; the livestock leaves are dropped, the HRFNAO leaves and the
ownership layer added.

---

## Target shape (annotated TS / JSON)

```ts
// MongoDB collection: "notification"  (house parity — Notification.java @Document(collection = "notification"))
// One document == one CHED-D notification (draft or submitted).
interface Notification {
  id: string                     // Mongo @Id (ObjectId hex). Not user data.  [Notification.java:74-75]
  referenceNumber: string        // server-minted on first save; @Indexed(unique, sparse).  [NotificationBase.java:21-22]
                                 //   IPAFFS shape DRAFT.GB.{yyyy}.{7-8 digits} → CHEDD.GB.{yyyy}.{…} at submit (confirmed review/confirmation).
                                 //   Rebuild keeps ONE id + moves status (reject the id-flip). House format is GBN-AG-{YY}-{XXXXXX} — CHED-D needs its own discriminator. OPEN Q 1
  status: 'DRAFT' | 'SUBMITTED' | 'AMEND' | 'DELETED'   // reuse house enum verbatim (NotificationStatus.java:5). confirmed DRAFT+SUBMITTED (review shows "Not Submitted"/DRAFT.*, confirmation shows CHEDD.*); AMEND/DELETED inferred (house transitions; amend-from-hub + delete-notification untraced — inventory-pages-without-specs)
  chedType: 'CED'                // constant; app is CHED-D-only. confirmed (import-type radio value CED = "High risk food and feed of non-animal origin"). Legacy display name "CHED-D" (constants.js). On the wire CHED-D = CED (SOAP SearchCriterionCED, integrations.md)

  // ─── OWNERSHIP / DELEGATED AUTHORITY ─── NEW. Not on the house model. Server-enforced tenancy.
  //     Sources: authorization-rules.md (OWN-1/2, VIS-1/2, AGT-1/2, BDG-1). Ownership + visibility
  //     APPLY to CHED-D (inferred, testable); delegated creation + the badge DO NOT (legacy gate).
  ownership: {
    assignedOrganisationId: string       // THE OWNING TENANT — the org this notification was created FOR (== createdFor).
                                         //   Every dashboard/visibility query scopes on this. @Indexed. Enforced server-side, never a form field.
                                         //   inferred for CHED-D (OWN-1): keys on org identity in the record, not the CHED type — the CHED-D dashboard is the identical list. confirmed (CHED-PP DoA) trace 065de8c5
    assignedOrganisationName: string     // display name of the owning org. inferred (dashboard chrome; not rendered in a CHED-D DoA trace)
    createdByUserId?: string             // author (audit only — NOT the owner). For the corpus's plain B2C importer, author's org == owner. inferred
    onBehalfOfOrganisationId?: string    // ON-BEHALF-OF marker (IPAFFS legacy name: agencyOrganisationId, Notification.java:68 in the IPAFFS schema).
                                         //   Set ONLY when a delegated AGENT creates FOR a different org. **DORMANT FOR CHED-D as-is** — the org-selector
                                         //   (consignment-for / consignment-organisation) is CHED-PP-only (AGT-1, consignment_for.js:33-39 gates on type===CHEDPP),
                                         //   so a CHED-D notification never populates this today. Carried in the schema so DoA can be extended to CHED-D without a migration. legacy; policy G-1
  }
  // NOT persisted for CHED-D: no `for-own-organisation` routing boolean (no org-selection page renders — AGT-1).
  // NEVER modelled: the teal Trade Partner badge. Render condition is (type=='CHEDPP' && agencyOrganisationId) — a CHED-D
  //   row satisfies NEITHER, so it never renders (BDG-1, legacy notificationList.html:28). Do not add a CHED-D badge. Confirmed absent for CHED-D.

  // Country of origin / consignment + region + internal reference. House Origin (Origin.java:99-105);
  // IPAFFS holds these consignment-level on Commodities — flattened to origin.* for house parity.
  origin?: {
    countryCode?: string              // ISO country of origin. confirmed (country-of-origin origin-country; origin-of-import origin-country — one logical field over two pages, modelGap duplicate-origin-country). ref-data: third-country list (219, !country.eu for CED)
    countryOfConsignmentCode?: string // "Country from where consigned". confirmed (origin-of-import consigned-country). ref-data: Countries. In every trace == countryCode (OPEN Q 12)
    regionCode?: string               // "Enter the region code" — IPAFFS Commodities.regionOfOrigin. confirmed (origin-of-import region-code); optional even when "Yes" chosen (no @NotNull). legacy
    requiresRegionCode?: boolean      // house Origin.requiresRegionCode (Origin.java:102). The region-code-option Yes/No radio — but IPAFFS DERIVES it (regionOfOriginOption = !isEmpty(regionOfOrigin), consignment_countries.js:163), so persist regionCode and derive this, or store the boolean. confirmed ("No" observed)
    internalReference?: string        // "Your internal reference number (optional)" → IPAFFS PartOne.importerLocalReferenceNumber. confirmed (origin-of-import local-reference-number); optional, never filled
  }

  // Main reason for import. House top-level name verbatim (NotificationBase.java:28). IPAFFS Purpose.purposeGroup.
  reasonForImport?: 'INTERNAL_MARKET' | 'NON_INTERNAL_MARKET'
                                 // confirmed (about-the-consignment purpose, 2 radios; wire values internalmarket|noninternalmarket — normalise). Mandatory (Joi .required()). Only the FLAG-ON transit variant was traced (feature-flag-page-variant, c-011)

  // Transit / landbridge block — CHED-D specific. Rendered ONLY when reasonForImport = NON_INTERNAL_MARKET
  // (cross-page-conditionality). IPAFFS Purpose.{pointOfExit, leaveDate}. Absent when INTERNAL_MARKET.
  transit?: {
    pointOfExit?: string              // free-text (flag-ON variant). confirmed (about-the-consignment point-of-exit, "Manchester"); required when NON_INTERNAL_MARKET (Joi.when)
    exitDate?: string                 // ISO "YYYY-MM-DD" — "when the consignment will leave Great Britain". confirmed (estimated-arrival-at-port-of-exit-date d/m/y); required when NON_INTERNAL_MARKET
    exitTime?: string                 // "HH:mm". confirmed (estimated-arrival-at-port-of-exit-time hour/minutes); required when NON_INTERNAL_MARKET
    exitBorderControlPost?: string    // FLAG-OFF (tranship) variant ONLY — the "For transfer to" #bcp-transfer-to SELECT. legacy (never traced; feature flag enableCheddLandbridge OFF). ref-data: UK BCPs
  }

  // The heart of CHED-D. House Commodity → commodityComplement[] (Commodity.java, CommodityComplement.java).
  // commodityIntendedFor + temperature are consignment-level in IPAFFS (Commodities wrapper), so they sit on the
  // wrapper here, not per line.
  commodity?: {
    commodityIntendedFor?: 'FEEDINGSTUFF' | 'FURTHER_PROCESS' | 'HUMAN_CONSUMPTION' | 'OTHER'
                                       // confirmed (commodity-additional-details commodity-intended-for, 4 radios). @NotNull under NotificationSingleCedValidation (CED) — mandatory server-side. legacy (mandatoriness)
    temperature?: 'AMBIENT' | 'CHILLED' | 'FROZEN'   // confirmed (commodity-additional-details temperature, 3 radios). @NotNull under CED group — mandatory. legacy
    commodityComplement: CommodityLine[]  // repeating: "Do you want to add another commodity?" (addCommodity Yes/No). Multi-commodity "Yes" branch untraced (single-line corpus). Depth-2: line → species[] (modelGap repeating-group-in-repeating-group)
  }

  // Consignment-level totals. House additionalDetails (AdditionalDetails.java) — livestock leaves dropped.
  additionalDetails?: {
    totalGrossWeight?: number           // "Total gross weight (kg/units)". confirmed (commodity-extended-description gross-weight; review goodsTotals "Total gross weight 11"). Consignment-level. required (Joi)
    // read-only rollups (Σ netWeight, Σ packages — review goodsTotals) are DERIVED, never stored.
  }

  // Parties. Each is a house Operator (Operator.java:199-206) → operatorId/name/telephone/email/Address.
  // CHED-D HAND-ENTERS consignor + consignee (POP-1 conflict, c-046) — there is NO org auto-population on this
  // route (that is the CHED-PP delegated route only). Importer + destination use the "Same as consignee" shortcut.
  consignor?: Operator            // "Consignor or exporter" — HAND-ENTERED. confirmed (traders-addresses / consignor-creation; "Linus George Ltd"). required
  consignee?: Operator            // "Consignee" — HAND-ENTERED. confirmed (consignee-creation; "Global Corp"). required
  importer?: Operator             // "Importer" — set via #populate-importer "Same as consignee" OR entered. confirmed (review importer == consignee value). required. House name kept
  destination?: Operator          // "Place of destination" — set via #populate-place-of-destination "Same as consignee" OR entered. confirmed (traders-addresses). House name (destination, not placeOfDestination)
  contactAddress?: Operator       // "Contact address for consignment" (branch address) — DISTINCT from destination. confirmed (contact-address / branch-address-creation; "Green Systems, 105 Broadway"). CHED-D addition — see Deviations
  // house placeOfOrigin / consignment / transporter / cphNumber operators: no CHED-D page collects them — omitted.

  // Contacts.
  responsiblePerson?: Contact     // contact-details. PRE-POPULATED from the SIGNED-IN account ("Michael Scott"), not from a delegated org (POP-1 resolution). confirmed. name required; email + telephone each optional (frontend at-least-one is NOT enforced for CED — the backend has no CED @NotNull either, c-038)
  nominatedContacts?: Contact[]   // "Nominated contacts (optional)" — repeating (add/remove, capped by contactsCount). confirmed page exists; all fields optional; never filled in a trace

  // Transport to the port of entry. House Transport (Transport.java:243-253); house portOfEntry + meansOfTransport REUSED.
  transport?: {
    portOfEntry?: string                // "Port of entry" BCP code, e.g. GBMAN. confirmed (transport-details bcp, "MANCHESTER AIRPORT (GBMAN)"). HOUSE FIELD reused verbatim. ref-data: BCPs (~31). required
    meansOfTransport?: 'AIRPLANE' | 'RAILWAY' | 'ROAD_VEHICLE' | 'VESSEL'  // reuse house enum (MeansOfTransport.java). confirmed (transport-means-before, 4 + placeholder). required
    transportIdentification?: string    // flight/train/reg/vessel id. confirmed (identification, "F12345"). required
    transportDocumentReference?: string // confirmed (document, "certificate"). required
    arrivalDate?: string                // ISO "YYYY-MM-DD" — "Estimated arrival at port of entry". house stores LocalDate. confirmed (arrival-date-d/m/y). required
    arrivalTime?: string                // "HH:mm". CHED-D addition (house has no time). confirmed (arrival-time-hour/minutes). required
    usesContainers?: boolean            // "Are any road trailers or shipping containers being used?" confirmed (consignment-in-container Yes/No; server-defaults to No — reveal never exercised)
    containers?: Array<{                // repeating reveal (hidden; never filled in any trace — confirmed field defs only)
      containerNumber?: string          // container-number-N
      sealNumber?: string               // seal-number-N
      officialSeal?: boolean            // official-seal-N checkbox
    }>
    // transport-details variant fields (bcp-or-port-of-entry, entry-border-control-post, inspection-premises,
    //   means-of-transport-after-bcp, estimated-journey-time-hours) are CHED-PP/other-CHED page-object LEAKAGE
    //   (shared-page-object-cross-type-leakage; control-point/inspection-premise is CHEDPP-only, c-012/c-013) — EXCLUDED for CHED-D.
  }

  // GVMS / Common Transit Convention answers. DATA, not an integration (integrations.md: no live GVMS/NCTS call fires).
  goodsMovementServices?: {
    commonTransitConvention?: 'YES' | 'YES_ADD_LATER' | 'NO'  // confirmed (goods-movement-services ctc-question, 3 radios). required
    movementReferenceNumber?: string    // NCTS MRN free-text. confirmed (ncts-mrn); required iff CTC == YES. No live validation (integrations.md)
    usingGvms?: boolean                 // "Will the transport use the GVMS?" confirmed (gvms-question Yes/No). required
  }

  // Common User Charge billing — CUC notifications only (billable, isCuc derived upstream — cross-page-conditionality).
  billing?: {
    address?: {                         // cuc-confirm-billing-details hidden fields + cuc-find-an-address (postcode lookup + select)
      addressLine1?: string; addressLine2?: string; addressLine3?: string; addressLine4?: string   // addressLine4 legacy (confirm-billing hidden)
      cityOrTown?: string; county?: string; postalCode?: string
    }
    email?: string                      // confirmed (cuc-billing-contact-details email, required)
    telephone?: string                  // confirmed (cuc-billing-contact-details telephone, required)
    // CUC scope for pass 1 = OPEN Q 11. Postcode lookup is deferred/stubbed (integrations.md)
  }

  // Final declaration. CHED-D has NO acknowledgement checkbox — the declaration POST validator runs only for
  // CHEDPP/CHED-A; CHED-D submits straight through (JB-5, c-019). A conditional CUC declaration paragraph applies
  // when billable (unobserved). So there is no `agreed` boolean to store for CHED-D.
  declaration?: { declaredAt?: string }   // submissionDate rendered on the declaration page (confirmed "16 July 2026"); submission recorded via status + snapshot

  // Server-derived customs references (shown read-only on review + confirmation — not user input).
  customsDeclarationReference?: string  // "Reference for your customs declaration" e.g. GBCHD2026.1526057. confirmed; server-derived from referenceNumber
  customsDocumentCode?: string          // "Customs document code" e.g. C678. confirmed; server-derived/static

  // Amend baseline — house parity (Notification.java:78-79 submittedBaseline). Captures submitted content when amend begins.
  submittedBaseline?: NotificationContentSnapshot

  created?: string                      // ISO timestamp, set on create.  [NotificationBase.java:50]
  updated?: string                      // ISO timestamp, set on every save. [NotificationBase.java:52]
}

// One commodity line = one CN code plus its type/class/family hierarchy and species.
// House CommodityComplement (CommodityComplement.java:139-146); livestock leaves (totalNoOfAnimals) dropped.
interface CommodityLine {
  commodityCode: string                 // CN/HS code, e.g. "10064000" (broken rice), "09081100". confirmed (search-commodity commodity-text-input / parent_<chapter> tree browse). ref-data: CN commodity tree
  commodityDescription?: string         // leaf desc, e.g. "Broken rice". confirmed (review commodityCode row / lab-tests "Broken rice"). ref-data-derived, not typed
  typeOfCommodity?: string              // house CommodityComplement.typeOfCommodity (CommodityComplement.java:141). confirmed (commodity-basic-description typeOfCommodity select). ref-data: category 'types' for the code. required when >1 option
  classOfCommodity?: string             // "Class of commodity". confirmed (commodity-basic-description classOfCommodity). ref-data: 'classes' filtered by type. required when >1. CHED-D addition
  familyOfCommodity?: string            // "Family of commodity". confirmed (commodity-basic-description familyOfCommodity). ref-data: 'families' filtered by class. required when >1. CHED-D addition
  netWeight?: number                    // kg/units, per line. confirmed (commodity-extended-description {code}-.net-weight). required
  numberOfPackages?: number             // per line. confirmed (commodity-extended-description {code}-.num-packages). required
  packageType?: string                  // code, e.g. "Bag". confirmed (commodity-extended-description {code}-.package-type). ref-data: CHED-D package types (25, isCed). required
  species?: Species[]                   // per-line species checkboxes; only when the commodity carries species. confirmed (commodity-basic-description species). required when species options exist
  uniqueComplementId?: string           // internal row id behind the {commodityCode}-. field prefix / remove controls. inferred — persist as the stable line key
}

// One species selected against a commodity line. House Species (Species.java:159-168) leaves
// (noOfAnimals/earTag/passport) dropped; value/text kept, EPPO leaves added for HRFNAO species-bearing commodities.
interface Species {
  value?: string                        // house Species.value — the species option value/id. confirmed (commodity-basic-description species checkbox value). inferred as the stored key
  text?: string                         // house Species.text — display name. confirmed (species checkbox label)
  eppoCode?: string                     // EPPO code, shown in the "EPPO code" column when species carry one. confirmed (commodity-basic-description species table). ref-data-derived. Present only for species that have one (many HRFNAO commodities have none — lab-tests "(no species)")
  genusAndSpecies?: string              // scientific name, "Genus (and Species)" column. confirmed (commodity-basic-description table). ref-data-derived
}

// House Operator (Operator.java:199-206) reused unchanged.
interface Operator {
  operatorId?: string                   // address-book id when picked; null when free-typed (address-book search/save DEFERRED for pass 1 — integrations.md)
  name?: string                         // "…name" (company-name / consignee-name / branch-address-name). confirmed. required
  telephone?: string                    // confirmed (telephone). required on the create sub-forms
  email?: string                        // confirmed (email). required on the create sub-forms
  address?: Address
}

// House Address (Address.java:219-228) reused. House `county` is NOT collected by any CHED-D trader form —
// CHED-D uses addressLine3 instead (county kept null); the 4-nation UK split means `country` carries GB-ENG/SCT/WLS/NIR.
interface Address {
  addressLine1?: string                 // confirmed (address-line-1). required
  addressLine2?: string                 // optional. confirmed (address-line-2)
  addressLine3?: string                 // optional. confirmed (address-line-3)
  city?: string                         // "City or town". confirmed (city-or-town). required
  county?: string                       // house field — NOT collected by CHED-D trader forms (CUC billing uses it; trader forms do not)
  postcode?: string                     // "Postcode or ZIP code". confirmed (postcode); optional
  country?: string                      // ISO or GB-subdivision code (GB-ENG observed). confirmed (country select). ref-data: full country list (254, 4-nation UK split — no single "United Kingdom", JB-3). required
}

// Contact — contact-details / nominated-contacts. No `isAgent` field (CHED-D contact-details has name/email/telephone only).
interface Contact {
  name?: string                         // confirmed. required (frontend)
  email?: string                        // "Email address". confirmed. optional at model level (no CED @NotNull, c-038)
  telephone?: string                    // "Mobile number". confirmed. optional at model level
}

// SEPARATE COLLECTION — house-style + separate-app boundary (modelGap separate-app-boundary).
// Attachments go through a distinct /upload/ app (frontend-upload); the virus scan is async, so embedding would
// make the scan callback rewrite the notification. Joined on referenceNumber, re-attached at read.
interface AccompanyingDocument {
  id: string
  notificationReferenceNumber: string   // indexed FK
  documentType?: string                 // 14-option CHED-D list (documentTypeMap keys, JB-3). confirmed (accompanying-documents document-type, "Health certificate"). required
  documentReference?: string            // confirmed (document-reference, "REF-124"). required
  issueDate?: string                    // ISO "YYYY-MM-DD". confirmed (document-issue-date-d/m/y). required
  files?: Array<{ fileId?: string; filename?: string }>   // bytes handled by the SEPARATE upload app (allow-list {csv,doc,docx,jpg,jpeg,pdf,png,xlsx,xls,gif}, >10MB / <200B rejected, virus scan — JB-4). DEFERRED pass 1 (metadata only)
}
```

---

## Ownership, visibility & the delegated route (the DoA layer)

The cross-page behaviours the page-owned spine cannot express as per-field rules
(modelGap `org-level-tenancy`). **Provenance:** the CHED-D corpus has ZERO auth/DoA traces; the model
is adapted from the shared IPAFFS authorization layer exercised by the CHED-PP DoA corpus. What
transfers to CHED-D and what does not:

### Applies to CHED-D — persisted / enforced
| Rule | Effect on the model | Confidence for CHED-D |
|---|---|---|
| OWN-1 | `ownership.assignedOrganisationId` is the owning tenant (== createdFor); every visibility query scopes on it; enforce server-side for every CHED type | inferred (system-wide model; confirmed CHED-PP DoA) |
| OWN-2 | member-created ⇒ `assignedOrganisationId` = their own org, `onBehalfOfOrganisationId` = null, no org-selection page. **This is the ONLY creation shape CHED-D has.** | inferred |
| VIS-1 | same-org co-members share visibility with the **full** action set (View/Copy/Amend/Show) — no read-only downgrade for a non-author | inferred (identical CHED-D dashboard row cluster) |
| VIS-2 | dashboard scoped by a **Current Organisation** context switcher — **session state, not notification data**; do not store on the document | inferred |
| AGT-2 | "Address book" / "Manage trade partners" account-bar links render for the CHED-D importer — **service chrome**, NOT a delegated-create affordance | **confirmed (CHED-D)** |

### Does NOT apply to CHED-D as-is (carried in the schema, dormant)
| Rule | Why it does not transfer | Confidence |
|---|---|---|
| AGT-1 | delegated-agent creation FOR another org (consignment-for → consignment-organisation) is CHED-PP-only; `consignment_for.js:33-39` gates the org-selector on `type===CHEDPP`, CHED-D redirects past it. **No `consignment-for`/`consignment-organisation` page exists for CHED-D.** `onBehalfOfOrganisationId` is never populated today. | legacy; policy G-1 |
| BDG-1 | the teal **Trade Partner badge NEVER renders for CHED-D** — condition is `type=='CHEDPP' && agencyOrganisationId` (notificationList.html:28). **Do not model it.** | legacy (confirmed absent for CHED-D) |
| OWN-3 | in-draft owner-switch (agent changes responsible org) — no org-selection surface exists for CHED-D | legacy |
| VIS-3 | delegated-org / cross-org / draft-privacy visibility — arises only through the CHED-PP delegated route | legacy; gaps G-3, G-6 |
| POP-1 | Importer/Consignee/Contact org auto-population — CHED-PP delegated route only. **CHED-D hand-enters consignor + consignee and pre-populates the contact from the signed-in account** (c-046). Do NOT carry org auto-population into CHED-D. | legacy; gap G-5 |

**Visibility is a QUERY rule, not a stored field:** a notification is visible when
`ownership.assignedOrganisationId` ∈ {the user's member orgs} and equals the currently-selected org
context. This drives the `notification` index on `assignedOrganisationId`, compound with `status`
for the dashboard filter. If the rebuild ever extends DoA to CHED-D, the `onBehalfOfOrganisationId`
field, the badge condition, and the org-auto-population must all be **designed in** — they cannot be
ported, because they do not exist for CHED-D today (G-1, G-4).

---

## Reference data (stored by code, never as free text)

Cross-referenced to `integrations.md`. All are server-side lookups in the house style (frontend
clients → backend), matching the `countries-client` / `ports-of-entry-client` pattern in
`-frontend/src/server/common/clients/`. JB-3: **come from services, not hardcoded lists.**

| List | Field(s) | Source (integrations.md) | Pass 1 |
|---|---|---|---|
| Countries — third-country (CED, `!country.eu`) | `origin.countryCode`, `origin.countryOfConsignmentCode` | Countries svc `?certificateType=CED` | hardcode JSON (~219) |
| Countries — full, 4-nation UK split | `Address.country` (GB-ENG/SCT/WLS/NIR; no single "United Kingdom") | Countries svc (all) | hardcode JSON (~254) |
| CN commodity tree (chapter→heading→code) | `CommodityLine.commodityCode`, `.commodityDescription` | Commodity code svc | fixture (chapters 07-23, 39; codes 10064000, 09081100…) |
| Commodity type / class / family | `CommodityLine.typeOfCommodity` / `.classOfCommodity` / `.familyOfCommodity` | Commodity category ref-data | per-code fixture (dynamic hierarchy) |
| Species / EPPO | `Species.value/.text/.eppoCode/.genusAndSpecies` | Commodity-species ref-data | per-commodity fixture (many HRFNAO codes have none) |
| Border control posts / Ports of entry | `transport.portOfEntry`, `transit.exitBorderControlPost` | BIP svc `?includeControlPoints=true&types=CED` | hardcode (~31) |
| Package types (CHED-D, isCed — excludes Balloon Protected + Pallet Box) | `CommodityLine.packageType` | Reference data | hardcode (25) |
| Document types (CHED-D, documentTypeMap) | `AccompanyingDocument.documentType` | Reference data | hardcode (14) |
| Means of transport | `transport.meansOfTransport` | Static enum | in model (4) |
| Commodity intended-for | `commodity.commodityIntendedFor` | Static enum | in model (4) |
| Storage temperature | `commodity.temperature` | Static enum | in model (3) |
| CTC / GVMS options | `goodsMovementServices.*` | Static enum | in model (3 + 2) |
| Consignment-in-container / Yes-No | `transport.usesContainers` | Static enum | in model (2) |
| Billing address (postcode lookup) | `billing.address` | Address-lookup svc (customer-) | stub/defer (CUC) |
| Organisations (own + delegated) | `ownership.assignedOrganisationId` / `.onBehalfOfOrganisationId` | Customer / Defra ID (per-user, NOT ref-data) | stub a fixed org |
| _(inspector-side, out of create scope)_ Sample types, laboratories, lab-test taxonomy | inspector pages | laboratories- / ref-data | n/a pass 1 |

---

## Persistence (Mongo, house style)

- **Collections:** `notification` (singular, `Notification.java @Document`) and
  `accompanying_documents` (separate — async scan boundary). No microservice split.
- **Document identity:** Mongo `@Id id` (ObjectId); business key `referenceNumber` with
  `@Indexed(unique = true, sparse = true)` (`NotificationBase.java:21-22`) — minted on first create,
  sparse because an in-flight document may briefly have none.
- **Tenancy index (NEW):** `ownership.assignedOrganisationId` — every dashboard/visibility query
  scopes on it (OWN-1, VIS-1/2). Compound with `status` for the dashboard filter.
- **Draft save + resume:** the frontend holds each page's answers in session; on every *Save and
  continue* / *Save and return to hub* it rebuilds the **whole** document and saves — no per-page
  partial write. Blank `referenceNumber` ⇒ create (`status = DRAFT`, `created = now`, mint ref);
  present ⇒ overwrite (`updated = now`). The notification-hub (task list) is navigation +
  derived completeness — no data.
- **Submit / lifecycle:** declaration → `SUBMITTED` (CHED-D submits straight through — no
  acknowledgement checkbox, JB-5); `AMEND` (with `submittedBaseline` snapshot), copy-as-new, and
  soft-delete (`DELETED`) reuse the house transitions. The submitted ref surfaces as
  `CHEDD.GB.{yyyy}.{…}`; the rebuild keeps ONE stable id and moves `status` (reject IPAFFS's
  DRAFT.*→CHEDD.* id-flip + dual-id URLs).
- **No JSON-Patch, no ETag.** IPAFFS round-trips an `etag` into `If-Match` on a JSON-Patch PATCH (the
  hidden `etag` field appears on the confirmation/declaration/CUC pages — modelGap
  `optimistic-concurrency-etag`); its op-shape was never observable. Whole-document save drops that
  layer — two tabs editing one draft is last-write-wins, a **deliberate** decision (the house
  `Notification` has no `@Version` either). OPEN Q 10.
- **Frontend-vs-backend mandatoriness (JB-2, c-038):** the shipped CHED-D requiredness comes
  **entirely from the frontend Joi form** — the backend CED `@NotNull` group is materially looser
  (no CED `@NotNull` on address / contact / accompanying-document rows). The rebuild must decide
  which layer is canonical and enforce it in one place. OPEN Q 2.

---

## fieldMap — every page field → target model path

Covers all 41 pages. Hidden plumbing (`crumb` CSRF, `etag` concurrency token, `returnUrl`/
`fromFooterHeader`/`fromImporterReview`/`source`/routing hidden inputs) is **not** data and maps
nowhere by design — noted once here, not per row.

### Notifier create journey (orders 0-28)

| Page (slug) | Field | Target path |
|---|---|---|
| notifications-dashboard | keywords / commodity / bcp / status / country / consignee / type / microchip / date-range / orderBy | — (search+filter over `ownership.assignedOrganisationId`+`status`; no data captured) |
| import-type | cert-type radio | `chedType` (const `CED`) |
| country-of-origin | origin-country | `origin.countryCode` |
| origin-of-import | origin-country | `origin.countryCode` (restatement — duplicate-origin-country) |
| origin-of-import | region-code-option (Yes/No) | `origin.requiresRegionCode` (or derived from `regionCode` presence) |
| origin-of-import | region-code | `origin.regionCode` |
| origin-of-import | consigned-country | `origin.countryOfConsignmentCode` |
| origin-of-import | local-reference-number | `origin.internalReference` |
| search-commodity | commodity-text-input / parent_<chapter> tree browse | `commodity.commodityComplement[].commodityCode` |
| search-commodity | linkCommodityCodeSearch | — (tab switch, navigation) |
| commodity-basic-description | addCommodity (Yes/No) | — (routing: repeat the line loop; multi-commodity branch untraced) |
| commodity-basic-description | typeOfCommodity / classOfCommodity / familyOfCommodity | `…commodityComplement[].typeOfCommodity` / `.classOfCommodity` / `.familyOfCommodity` |
| commodity-basic-description | species (checkboxes; Genus / EPPO columns) | `…commodityComplement[].species[].{value,text,eppoCode,genusAndSpecies}` |
| about-the-consignment | purpose | `reasonForImport` |
| about-the-consignment | point-of-exit | `transit.pointOfExit` (when NON_INTERNAL_MARKET) |
| about-the-consignment | estimated-arrival-at-port-of-exit-date | `transit.exitDate` |
| about-the-consignment | estimated-arrival-at-port-of-exit-time | `transit.exitTime` |
| about-the-consignment | bcp-transfer-to (flag-OFF tranship variant) | `transit.exitBorderControlPost` |
| notification-hub | task-list links (commodity/additional/GMS/transport/review/billing/…) | — (navigation + derived completeness; no data) |
| commodity-extended-description | {code}-.net-weight | `…commodityComplement[].netWeight` |
| commodity-extended-description | {code}-.num-packages | `…commodityComplement[].numberOfPackages` |
| commodity-extended-description | {code}-.package-type | `…commodityComplement[].packageType` |
| commodity-extended-description | gross-weight | `additionalDetails.totalGrossWeight` |
| commodity-additional-details | commodity-intended-for | `commodity.commodityIntendedFor` |
| commodity-additional-details | temperature | `commodity.temperature` |
| accompanying-documents | document-type | `AccompanyingDocument.documentType` |
| accompanying-documents | document-reference | `AccompanyingDocument.documentReference` |
| accompanying-documents | document-issue-date-* | `AccompanyingDocument.issueDate` |
| accompanying-documents | fileUpload | `AccompanyingDocument.files[]` (deferred — metadata only) |
| document-upload | fileUpload | `AccompanyingDocument.files[]` (separate upload app; deferred) |
| traders-addresses | consignor (add/create/select) | `consignor.*` (hand-entered) |
| traders-addresses | consignee (add/create/select) | `consignee.*` (hand-entered) |
| traders-addresses | populate_importer "Same as consignee" | `importer.*` (copied from consignee) |
| traders-addresses | placeOfDestination + populate_place_of_destination | `destination.*` |
| traders-addresses | company-name/address-line-1/2/3/city-or-town/postcode/telephone/country/email (add-address sub-form) | `<party>.name` / `<party>.address.{addressLine1,2,3,city,postcode,country}` / `<party>.telephone` / `<party>.email` (party depends on which sub-form) |
| traders-addresses | consignee-name / branch-address-name (sub-form headings) | `consignee.name` / `contactAddress.name` |
| traders-addresses | economic-operator-name / -address / country (address-book search) | — (address-book search; DEFERRED pass 1) |
| traders-addresses | approval-number (transporter-only field) | — (transporter not collected for CHED-D; leakage) |
| search-existing-consignor | name / address / country | — (address-book search; DEFERRED) |
| consignor-creation | company-name | `consignor.name` |
| consignor-creation | telephone / email | `consignor.telephone` / `.email` |
| consignor-creation | address-line-1/2/3 | `consignor.address.addressLine1/2/3` |
| consignor-creation | city-or-town / postcode / country | `consignor.address.city` / `.postcode` / `.country` |
| consignor-confirmation | (confirm add to notification) | — (no data) |
| search-existing-consignee | name / address / country / view / select | — (address-book search; DEFERRED) |
| consignee-creation | company-name | `consignee.name` |
| consignee-creation | address-line-1/2/3 / city-or-town / postcode / country / telephone / email | `consignee.address.*` / `consignee.telephone` / `consignee.email` |
| consignee-confirmation | (confirm) | — (no data) |
| transport-details | bcp | `transport.portOfEntry` |
| transport-details | transport-means-before | `transport.meansOfTransport` |
| transport-details | identification | `transport.transportIdentification` |
| transport-details | document | `transport.transportDocumentReference` |
| transport-details | arrival-date-* | `transport.arrivalDate` |
| transport-details | arrival-time-* | `transport.arrivalTime` |
| transport-details | consignment-in-container | `transport.usesContainers` |
| transport-details | container-number-N / seal-number-N / official-seal-N | `transport.containers[].{containerNumber,sealNumber,officialSeal}` |
| transport-details | bcp-or-port-of-entry / entry-border-control-post / inspection-premises / means-of-transport-after-bcp / estimated-journey-time-hours | — (CHED-PP/other-CHED page-object leakage; EXCLUDED — c-012/c-013) |
| goods-movement-services | ctc-question | `goodsMovementServices.commonTransitConvention` |
| goods-movement-services | ncts-mrn | `goodsMovementServices.movementReferenceNumber` |
| goods-movement-services | gvms-question | `goodsMovementServices.usingGvms` |
| contact-details | name / email / telephone | `responsiblePerson.{name,email,telephone}` (pre-populated from signed-in account) |
| nominated-contacts | name / email / telephone (+ add/remove, contactsCount cap) | `nominatedContacts[].{name,email,telephone}` |
| contact-address | branch-address-select (pick existing) | `contactAddress.*` (resolved from selection) |
| contact-address | company-name/address-line-1/2/3/city-or-town/postcode/telephone/country/email | `contactAddress.name` / `contactAddress.address.*` / `contactAddress.telephone` / `.email` |
| branch-address-creation | company-name/address/city/postcode/telephone/country/email | `contactAddress.name` / `contactAddress.address.*` / `contactAddress.telephone` / `.email` |
| branch-address-confirmation | (confirm) | — (no data) |
| review-notification | all read-back rows (importType/countryOfOrigin/commodity/traders/transport/GMS/contacts/…) | — (read-back of fields collected elsewhere; audit.lastUpdated + submissionStatus derived) |
| review-notification | chedReference / customsDeclarationReference / customsDocumentCode | `referenceNumber` / `customsDeclarationReference` / `customsDocumentCode` (server) |
| review-notification | goodsTotals (Total net weight / packages / gross weight) | — (Σ derived; only `additionalDetails.totalGrossWeight` is stored) |
| declaration | submissionDate | `declaration.declaredAt` |
| declaration | (no acknowledgement checkbox — JB-5) | `status` → `SUBMITTED` |
| confirmation | reference-number / -customs / -document | `referenceNumber` / `customsDeclarationReference` / `customsDocumentCode` (server) |
| confirmation | risk-assessment-status ("Required at Manchester Airport") | — (derived; risk assessment, stubbed — integrations.md) |

### CUC billing variant (order -1 — part of the notifier journey when billable)

| Page (slug) | Field | Target path |
|---|---|---|
| cuc-billing-contact-details | email / telephone | `billing.email` / `billing.telephone` |
| cuc-confirm-billing-details | addressLine1-4 / cityOrTown / county / postalCode (hidden) | `billing.address.*` |
| cuc-confirm-billing-details | email / telephone (hidden) | `billing.email` / `billing.telephone` |
| cuc-confirm-billing-details | Name / Organisation (display) / add-billing-address link | — (display + navigation) |
| cuc-find-an-address | postalCode | `billing.address.postalCode` (lookup key) |
| cuc-find-an-address | addressListBox | `billing.address.*` (resolved from selection) |

### Inspector / decision + lab-test surface (order -1 — OUT of create-journey scope)

**Deliberately EXCLUDED from the notification model** — the BIP inspector/decision app is a wholly
separate service (modelGap `separate-app-boundary`; integrations.md `/decision/…` reverse-proxy
prefix, decision-/risk-assessment- microservices). Flagged, not modelled: `consignment-checks`
(documentary/identity/physical), `inspector-attachments-upload`, `lab-tests-choose-test`,
`lab-tests-commodity-select`, `lab-tests-required`, `lab-tests-review`, `lab-tests-sample-details`,
`record-decision-status`, `record-lab-test-information`, and the 4 spec-less decision pages
(decision-notifications-search / -hub / -outcome / -confirmation — inventory-pages-without-specs).
Their fields (check results, sample type, laboratory, analysis type, lab-test taxonomy, decision,
risk outcome) belong to a decision document, not the notification the create journey builds.

Nothing in a create-journey page spec is left unmapped; nothing in the model lacks a page except the
server-set `id` / `referenceNumber` / `status` / `created` / `updated` / `customsDeclarationReference`
/ `customsDocumentCode`, and the query-only `ownership.*` tenancy layer.

---

## Deviations from the house (each deliberate)

| Deviation | House | Here | Why |
|---|---|---|---|
| `ownership.*` added (assignedOrganisationId, onBehalfOfOrganisationId, …) | **no org field at all — single-tenant** (`NotificationBase.java:19-53`) | tenancy layer (owner + dormant on-behalf-of) | ownership/visibility are org-level and type-agnostic (OWN-1/VIS-1); owner ≠ author |
| `onBehalfOfOrganisationId` carried but **dormant** | n/a | present, never populated for CHED-D | delegated creation is CHED-PP-only (AGT-1); schema-ready for a future DoA extension without migration (G-1) |
| Trade Partner badge **not modelled** | n/a | absent | never renders for CHED-D (BDG-1) — modelling it would be wrong |
| `transit.*` block added (pointOfExit, exitDate, exitTime, exitBorderControlPost) | not present | added | CHED-D "Non-internal market" collects a GB-exit point + date/time (IPAFFS Purpose); no house equivalent |
| `reasonForImport` values | free String | `INTERNAL_MARKET` / `NON_INTERNAL_MARKET` (normalise from internalmarket/noninternalmarket) | CHED-D's 2-radio purpose; drives the transit block |
| `origin.regionCode` added; `requiresRegionCode` reused | `requiresRegionCode` only | `regionCode` value + reuse the boolean | CHED-D collects both the Yes/No and the code; IPAFFS derives the flag from the code |
| `origin.countryOfConsignmentCode` added | not present | added | CHED-D collects "country from where consigned" separately from country of origin |
| `commodity.commodityIntendedFor` + `.temperature` on the wrapper | not present | added at wrapper level | consignment-level HRFNAO attributes (IPAFFS Commodities wrapper), mandatory for CED |
| `CommodityLine` leaves | `typeOfCommodity/totalNoOfAnimals/totalNoOfPackages` | `commodityCode/commodityDescription/typeOfCommodity/classOfCommodity/familyOfCommodity/netWeight/numberOfPackages/packageType` | HRFNAO counts packages/weight + a type/class/family hierarchy, not animals |
| `Species` leaves | `value/text/noOfAnimals/noOfPackages/earTag/passport` | `value/text/eppoCode/genusAndSpecies` | livestock leaves dropped; EPPO identity added for species-bearing commodities; container name kept |
| `AdditionalDetails` leaves | `certifiedFor/unweanedAnimals` | `totalGrossWeight` | livestock attestations replaced with the consignment gross-weight total |
| `transport.portOfEntry` **kept** | `portOfEntry` | `portOfEntry` | house name fits CHED-D "Port of entry" verbatim (no rename needed — unlike CHED-PP) |
| `transport.arrivalTime`, `usesContainers`, `containers[]` added | `arrivalDate` only | added | CHED-D collects a time + a container/seal repeating group |
| `contactAddress` (Operator) added | not present | added | CHED-D collects a "Contact address for consignment" (branch address) distinct from place of destination |
| `goodsMovementServices` added | not present | added | CTC + GVMS answers (data, not an integration) |
| `billing` added | not present | added | CUC billing variant of the notifier journey |
| `customsDeclarationReference` / `customsDocumentCode` added | not present | added | CHED-D surfaces a customs declaration reference + document code (server-derived) |
| declaration has **no `agreed` checkbox** | house records via status + snapshot | `declaration.declaredAt` only | CHED-D submits straight through — no acknowledgement (JB-5, c-019) |
| `placeOfOrigin`, `consignment`, `cphNumber`, `transporter`, `transitedCountries` omitted | present on house | absent | no CHED-D page collects them; don't carry livestock fields into an HRFNAO model |
| accompanying docs = separate collection | already separate | same | async scan callback must not rewrite the notification |
| single stable id, `status` moves | house already does this | same | reject IPAFFS's DRAFT.*→CHEDD.* id-flip + dual-id URLs |
| inspector/lab surface excluded | n/a | separate decision document | BIP decision app is a separate service (separate-app-boundary) |

---

## Open questions (a human must resolve)

1. **Reference-number format.** House is `GBN-AG-{YY}-{XXXXXX}`. CHED-D shows
   `DRAFT.GB.{yyyy}.{7-8}` → `CHEDD.GB.{yyyy}.{…}`, plus a `GBCHD{yyyy}.{…}` customs reference and a
   `C678` document code. Pick the discriminator; matters if downstream (customs/Dynamics) filters on
   the IPAFFS shape.
2. **Which mandatoriness layer is canonical (JB-2, c-038).** The frontend Joi form requires far more
   than the backend CED `@NotNull` group (which has NO CED rule on address/contact/document rows).
   The rebuild must enforce requiredness in one place — decide frontend-parity or a tightened backend.
3. **DoA scope for CHED-D (G-1).** Delegated-agent creation + the Trade Partner badge are CHED-PP-only
   in legacy. Deliberate permanent boundary, or incomplete rollout? Decides whether
   `onBehalfOfOrganisationId` stays dormant or the whole on-behalf-of surface (org selector +
   owning-tenant + badge + auto-population) must be designed in for CHED-D.
4. **Org-member CHED-D auto-population (G-5).** The corpus only has a plain B2C importer hand-entering
   consignor/consignee. Would a registered-org CHED-D member get org auto-population of
   importer/consignee/contact (as the CHED-PP delegated route does)? Untraced.
5. **CHED-D co-member visibility (OWN-1/VIS-1, G-2/G-6).** Ownership/visibility are inferred for CHED-D
   from the shared layer, never rendered in a CHED-D trace. Add rebuild tests: a CHED-D by member A
   appears on co-member B's dashboard with the full action set; a different org's member cannot see it.
6. **`reasonForImport` / feature-flag variant (c-011).** Only the flag-ON transit variant was traced;
   the flag-OFF "tranship / For transfer to" variant (with `exitBorderControlPost`, no free-text
   point-of-exit) is legacy-only. Confirm which variant the rebuild ships (and whether
   `enableCheddLandbridge` survives).
7. **Commodity intended-for / temperature scope.** Modelled at the `commodity` wrapper
   (consignment-level, matching IPAFFS Commodities). Confirm they are not intended per-commodity-line
   when the multi-commodity "Yes" branch (untraced) is exercised.
8. **Species identity + EPPO.** `Species.value` is the assumed stored key; many HRFNAO commodities
   carry no species at all ("(no species)"). Confirm the stable key (value vs eppoCode) and that
   species is genuinely optional per line.
9. **Contact required-ness.** contact-details enforces `name` (frontend) with email + telephone each
   individually optional and NO at-least-one rule for CED (unlike CHED-PP). Confirm the rebuild's
   contactability rule.
10. **Concurrency.** Dropping ETag/`If-Match` means two tabs editing one draft last-write-wins — a
    deliberate decision (house `Notification` has no `@Version` either). Is two-tab editing real?
11. **CUC billing scope.** The billing shape is provisional (postcode lookup deferred/stubbed). Decide
    whether CUC is in scope for pass 1.
12. **Country fields.** `countryOfConsignmentCode == countryCode` in every trace; `Address.country`
    mixes ISO (`AU`) with 4-nation GB-subdivision codes (`GB-ENG`) and there is no single "United
    Kingdom". Confirm both country fields and the UK-split handling before finalising.
