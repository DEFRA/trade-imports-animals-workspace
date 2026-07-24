# CHED-P target data model

The JSON document built by the CHED-P (products of animal origin / internal type `CVEDP`) notifier
journey and persisted to MongoDB.

This regeneration is derived from the ENRICHED `journey-spec.json`, including its legacy-sourced
mandatoriness and delegated-authority evidence, plus `authorization-rules.md`, `integrations.md`
and `iuu-boundary-findings.md`. It follows the neighbouring `trade-imports-animals` service:
journey answers are normalised into one JSON notification, the whole document is saved to the
backend, and Mongo is the durable store. It does **not** reproduce IPAFFS JSON Patch documents,
IPAFFS entity names, or the legacy service split.

The `fieldMap` accounts for **326 create-surface field entries**:

- `f-018`–`f-335`: the notifier create journey, its same-page transit variant and its Common User
  Charge (CUC) variant;
- `f-602`–`f-609`: the cross-type delegated-authority evidence, mapped either to notification
  ownership or explicitly to identity/authorisation context outside the notification.

Of those entries, the enriched spec marks 113 required, 186 optional and 27 unknown. Those figures
include navigation, hidden transport fields, displays and restatements; they are not a count of
Mongo properties. The model applies the old system's requiredness to business fields at submission,
while allowing partial drafts. This is deliberately labelled **legacy policy**: the rebuild may
revisit it rather than treating it as timeless business policy.

Two hard boundaries apply:

- Fish/IUU is excluded. Catch-certificate pages, chapter 03, fish sub-codes in mixed chapters and
  fish species such as *Anguilla* do not enter this model. Shared commodity/species pages remain,
  but their CHED-P reference-data results must exclude the IUU set.
- Post-submission notifier views, attachments-tab activity, inspection, laboratory, decision,
  replacement, control and border-notification data are outside this create document. Amend may
  reuse create fields, but it does not add inspector/decision fields to this model.

## Target shape (typed and annotated)

All user-answer properties remain optional while `status = 'DRAFT'`. Comments use:

- `[R legacy]`: required at submission as the old system had it;
- `[C legacy]`: required only when the stated route/control is active;
- `[O legacy]`: optional as the old system had it;
- `[G]`: requiredness or applicability is not established.

Dates are ISO `YYYY-MM-DD`; local journey times are `HH:mm`; audit timestamps are UTC ISO-8601.
Reference-data IDs/codes are stored instead of display labels.

```ts
// Mongo collection: "notification"
// One document = one resumable CHED-P notification.
interface Notification {
  id: string                         // Mongo @Id; stable and server-set
  version: number                    // Mongo optimistic-lock version; replaces legacy ETag/If-Match
  referenceNumber: string            // unique, sparse business key; server-minted
  status: 'DRAFT' | 'SUBMITTED' | 'AMEND' | 'DELETED'
  chedType: 'CVEDP'                  // [R legacy] constant in a CHED-P-only app

  ownership: NotificationOwnership   // server-resolved before the first durable draft save

  origin?: {
    countryCode?: string                 // [R legacy] country of origin
    requiresRegionCode?: boolean         // [O legacy] Yes/No route answer
    regionCode?: string                  // [C legacy] present when requiresRegionCode = true; max 3 in legacy UI
    countryOfConsignmentCode?: string    // [R legacy] country from where consigned
    conformsToRegulatoryRequirements?: boolean // [R legacy]
    healthCertificateRequired?: boolean  // [O legacy/G] shared-page variant, not rendered in CHED-P traces
    internalReference?: string           // [O legacy] notifier's reference
  }

  // House Commodity -> commodityComplement[] nesting retained.
  commodity?: {
    commodityComplement: CommodityLine[] // at least one selected line at submission
    temperature?: 'AMBIENT' | 'CHILLED' | 'FROZEN' // [R legacy]
  }

  additionalDetails?: {
    totalGrossWeight?: number            // [R legacy] kg/units, consignment-level
    // `feedingstuff` is not added: the field is an unrendered shared-page gap, not CHED-P evidence.
  }

  reasonForImport?: 'INTERNAL_MARKET' | 'TRANSHIPMENT' | 'TRANSIT' | 'RE_ENTRY' // [R legacy]
  purpose?: {
    internalMarketPurpose?: 'ANIMAL_FEEDINGSTUFF' | 'HUMAN_CONSUMPTION' | 'OTHER' // [C legacy]
    destinationCountryCode?: string      // [C legacy] transhipment/transit
  }
  transit?: {
    exitBorderControlPostCode?: string   // [C legacy] transit
    exitDate?: string                    // [C legacy] transit
    exitTime?: string                    // [C legacy] transit
    transitedCountryCodes?: string[]     // [C legacy] transit, repeating
  }

  risk?: {
    selectedCategory?: 'HIGH' | 'MEDIUM' | 'LOW' // [R legacy] notifier selection
    computedHighestCategory?: 'HIGH' | 'MEDIUM' | 'LOW' // [O legacy] server/reference-data result
  }

  approvedEstablishments?: ApprovedEstablishment[] // [G] required "where required"

  // House party homes retained. Values are inline snapshots, even when selected from a service.
  consignor?: Operator
  consignee?: Operator
  importer?: Operator                 // assigned-org default on an on-behalf-of journey
  destination?: Operator
  contactAddress?: Operator

  transport?: {
    portOfEntry?: string              // [R legacy] BCP/POE code
    meansOfTransport?: MeansOfTransport // [R legacy]
    transportIdentification?: string  // [R legacy]
    transportDocumentReference?: string // [R legacy]
    arrivalDate?: string              // [R legacy]
    arrivalTime?: string              // [R legacy]
    usesContainers?: boolean          // [O legacy]
    containers?: Container[]          // [C legacy] containerNumber required for an entered row

    onwardTransportRequired?: boolean // [R legacy] origin-page Yes/No
    onwardTransport?: {
      meansOfTransport?: MeansOfTransport // [C legacy]
      transportIdentification?: string    // [C legacy]
      transportDocumentReference?: string // [C legacy]
      departureDate?: string              // [C legacy]
      departureTime?: string              // [C legacy]
      responsibleForTransport?: string    // [O legacy]
    }

    transporterRequired?: boolean     // [G] provisional home for the unrendered "No" variant
    transporter?: Transporter
  }

  goodsMovementServices?: {
    commonTransitConvention?: 'ADD_MRN_NOW' | 'ADD_MRN_LATER' | 'YES' | 'NO' // [C legacy]
    movementReferenceNumber?: string  // [C legacy] required for ADD_MRN_NOW
    usingGvms?: boolean               // [C legacy]
  }

  responsiblePerson?: Contact         // assigned-org default for delegated work
  nominatedContacts?: Contact[]       // [O legacy]; entered rows have conditional validation

  billing?: {                         // CUC only
    address?: BillingAddress           // [C legacy]
    email?: string                     // [C legacy]
    telephone?: string                 // [C legacy]
  }

  declaration?: {
    declaredAt?: string                // server timestamp; never trust hidden submissionDate
  }

  // Server-derived confirmation values, not accepted from a page POST.
  customsDeclarationReference?: string
  customsDocumentCode?: string

  // House amend pattern: submitted content captured when an amendment begins.
  submittedBaseline?: NotificationContentSnapshot

  created: string
  updated: string
}

interface NotificationOwnership {
  // Exact DoA surface required by this pass:
  createdFor: OrganisationRef
  assignedOrg: OrganisationRef
  onBehalfOf: boolean
  submittedByAgent?: AgentRef

  // Creator identity is additionally required to enforce agent-draft privacy before submission.
  createdBy: ActorRef
}

interface OrganisationRef {
  id: string
  name: string
}

interface ActorRef {
  userId: string
  displayName?: string
}

interface AgentRef extends ActorRef {
  agencyOrg: OrganisationRef
  submittedAt: string
}

type MeansOfTransport = 'AIRPLANE' | 'RAILWAY' | 'ROAD_VEHICLE' | 'VESSEL'

// Grain = one editable commodity/type/species row on the weights page.
interface CommodityLine {
  uniqueComplementId: string
  commodityCode: string               // [R legacy] non-IUU CN/HS code
  commodityDescription?: string       // reference-data snapshot/derived display
  typeOfCommodityCode?: string        // [O legacy] commodity-dependent
  classOfCommodityCode?: string       // [O legacy] commodity-dependent
  familyOfCommodityCode?: string      // [O legacy] commodity-dependent
  species?: Species[]                 // [C legacy] at least one when species choices exist
  netWeight?: number                  // [R legacy]
  numberOfPackages?: number           // [R legacy]
  packageTypeCode?: string            // [R legacy]
}

interface Species {
  code: string                        // stable biological taxonomy id/code
  scientificName?: string             // reference-data label, e.g. Ovis aries
}

interface ApprovedEstablishment {
  establishmentId: string             // opaque service ID selected by `add-id`
  name: string
  countryCode: string
  typeCode?: string
  sectionCode?: string
  approvalNumber: string
  statusCode?: string
}

interface Operator {
  operatorId?: string
  organisationId?: string             // assignedOrg id for organisation-derived importer
  source?: 'ASSIGNED_ORGANISATION' | 'ADDRESS_BOOK' | 'MANUAL' | 'COPIED_FROM_CONSIGNEE'
  name?: string
  address?: Address
  telephone?: string
  email?: string
}

interface Address {
  addressLine1?: string
  addressLine2?: string
  addressLine3?: string
  city?: string
  postcode?: string
  countryCode?: string
}

interface Transporter extends Operator {
  approvalNumber?: string
  transporterTypeCode?: string
}

interface Contact {
  name?: string
  email?: string
  telephone?: string
  organisationId?: string
  source?: 'ASSIGNED_ORGANISATION' | 'USER_ENTERED'
}

interface Container {
  containerNumber?: string
  sealNumber?: string
  officialSeal?: boolean
}

interface BillingAddress {
  addressLine1?: string
  addressLine2?: string
  addressLine3?: string
  addressLine4?: string
  cityOrTown?: string
  county?: string
  postalCode?: string
}

// Mongo collection: "accompanying_documents"
// Separate because upload/scan callbacks update documents independently.
interface AccompanyingDocument {
  id: string
  version: number
  notificationReferenceNumber: string
  documentKind: 'LATEST_VETERINARY_HEALTH_CERTIFICATE' | 'ACCOMPANYING_DOCUMENT'
  documentTypeCode: string
  documentReference?: string
  dateOfIssue?: string
  uploadId?: string
  correlationId?: string
  scanStatus?: 'PENDING' | 'COMPLETE' | 'REJECTED'
  files?: UploadedFile[]
  created?: string
  updated?: string
}

interface UploadedFile {
  fileId?: string
  filename?: string
  contentType?: string
  contentLength?: number
  fileStatus?: string
  hasError?: boolean
}
```

## Legacy submission requiredness

Drafts are partial. The following is the submission policy evidenced by the enriched spec, using
the old system's rules rather than inventing new mandatoriness.

| Area | Required at submission (legacy policy) | Optional / conditional / unresolved |
|---|---|---|
| Ownership | `createdFor`, `assignedOrg`, `onBehalfOf`, `createdBy`; `submittedByAgent` when an agent submits for a different org | Which POAO member supplies assigned-org contact defaults is unresolved |
| Origin | country of origin, country of consignment, conformity answer, onward-transport answer | region choice/code and internal reference optional; health-certificate-required variant optional/unconfirmed |
| Commodity | at least one code; species when the selected code offers species; per line net weight, package count and package type; total gross weight; temperature | type/class/family are commodity-dependent and optional in the legacy handlers |
| Purpose | main purpose; internal-market sub-purpose on that route; destination/exit/date/time/transited countries on their routes | exact wire-value normalisation remains open |
| Risk | selected risk category | computed highest category is server/reference-data state |
| Health certificate | reference and issue date on the applicable health-certificate route; selected upload file | low-risk/applicability and whether a file is mandatory at final submit remain open |
| Accompanying documents | document type for an entered row | reference and issue date optional in legacy; loop/file requirements remain open |
| Establishments | an `add-id` must be selected when the search/select page is used | the rule behind “where required” is unresolved |
| Consignor form | name, address line 1, city, telephone, country, email | lines 2/3 and postcode optional |
| Consignee form | name, address line 1, address line 2, postcode, country, email | address line 3, city and telephone optional. This surprising legacy policy should be reviewed |
| Importer/destination | both trader slots required | may be assigned-org defaults, selected/created, or copied from consignee |
| Inbound transport | POE, means, identification, document reference, arrival date/time | containers optional; container number required for an entered container row |
| Onward transport | all means/identification/document/date/time fields when onward transport is required | responsible-for-transport optional |
| CTC/GVMS | each displayed question; MRN when “add now” | questions/page are conditional on route/port/transport |
| Transporter form | name, address line 1, city, telephone, country, email | address lines 2/3 and postcode optional; overall transporter applicability unresolved |
| Responsible contact | name; at least one of email/telephone | values default from assignedOrg for delegated work |
| Nominated contact | whole section optional | once a row is started, name plus at least one of email/telephone |
| Branch/contact address | selection required; create form requires name, address lines 1/2, postcode, country and email | address line 3, city and telephone optional. Another surprising legacy policy to review |
| CUC | resolved address, email and telephone on a billable route | billing address line 4 optional |

## Ownership, delegated authority and visibility

The ownership block is persisted and server-controlled. It is not a cosmetic copy of authentication
session data.

| Rule | Target behaviour |
|---|---|
| Own-organisation creation | `createdFor` and `assignedOrg` are the current POAO org; `onBehalfOf = false`; no `submittedByAgent` |
| Client creation by authorised agent | `createdFor` and `assignedOrg` are the selected authorised POAO client; `onBehalfOf = true`; submission writes `submittedByAgent` with the acting user's and agency's identity |
| Reassignment before submit | An agent may change `createdFor`/`assignedOrg` while `status = DRAFT`; importer/responsible-person defaults are recalculated from the final assigned org |
| Ownership | `assignedOrg`, not the creator's employer, is the notification-owning tenant and dashboard organisation |
| Draft visibility | Before submission, only `createdBy.userId` can read the agent's client-assigned draft |
| Submitted visibility | Members of `assignedOrg` and the specific `submittedByAgent.userId` can see the submitted notification; unrelated orgs and agency coworkers do not inherit access |
| Trade Partner marker | `tradePartner = ownership.onBehalfOf`; render the Trade Partner badge at read time. The display marker is derived, not a second stored boolean |
| Audit | `submittedByAgent` is audit identity only. It never replaces `assignedOrg` as owner |

`createdFor` and `assignedOrg` both identify the selected notification-owning organisation, matching
the authorization evidence. `assignedOrg` is the canonical tenancy/index field; `createdFor` keeps
the creation contract explicit. They remain synchronised while a draft may be reassigned and are
frozen at submission. `onBehalfOf` records whether that owner differs from the acting agent's
agency. This avoids using an agency ID as an ownership proxy.

The available evidence is cross-type CHED-PP/Plant evidence. Applying the mechanism to POAO is the
required target design, but CHED-P-specific copy, placement and conditional rendering remain an
open verification item.

## Commodity and IUU boundary

The commodity selection loop resolves code, optional type/class/family and zero or more biological
species. The later details page collects net weight, package count and package type per editable
row. Therefore each selected code/type/species combination becomes a `CommodityLine`; a selection
with several species becomes several stable line identities, while `species[]` retains the house
nesting.

Gross weight and temperature are consignment-level. Total net weight and total packages are derived
by summing lines and are not duplicated in Mongo. Search text, tree navigation, “add another” and
bulk selection controls mutate the line collection but are not business properties.

The CHED-P reference-data adapter must reject:

- all chapter-03 codes;
- fish sub-codes in mixed chapters such as chapter 16, while retaining non-fish codes;
- fish species and values handed to IUU, including *Anguilla*;
- catch-certificate document relationships and catch-certificate task-list state.

## Reference data and integration ownership

| List / integration | Stored target | Source / treatment |
|---|---|---|
| Countries and UK regions | `origin.*Code`, purpose/transit countries, party addresses, establishment countries | Countries service with `certificateType=CVEDP`; store codes |
| CHED-P commodities | `CommodityLine.commodityCode` | Commodity-code service CVEDP tree, filtered by IUU boundary |
| Commodity type/class/family/species | `CommodityLine.*OfCommodityCode`, `species[].code` | Commodity/nomenclature response; dynamic by code |
| Package types | `CommodityLine.packageTypeCode` | CHED-P package-type reference map; store stable code |
| Approved establishments | `approvedEstablishments[]` | Approved-establishment service; resolve opaque `add-id`, inline a minimal snapshot |
| BCP/POE and exit BCP | `transport.portOfEntry`, `transit.exitBorderControlPostCode` | BIP service, origin/inspection filtered |
| Documents/uploads | separate `accompanying_documents` collection | Existing uploader/object-store/virus-scan boundary; metadata only in first pass |
| Operators and organisations | party snapshots and `ownership.assignedOrg` | Customer/economic-operator/Defra ID; assigned-org values are server-derived |
| Risk assessment | `risk.computedHighestCategory` during the journey; confirmation outcome derived | deterministic local stub first pass, live service later |
| GVMS/NCTS | answers/MRN only | no live create-time integration; store entered values |
| CUC address and charge | `billing.*` | address lookup may be stubbed; persist billing, defer Trade Charge queue |
| SOAP, PDF, analytics, Notify, Dynamics | none | outside first-pass create persistence |

## Persistence (Mongo, house style)

- **Collections:** `notification` and `accompanying_documents`, matching the neighbouring backend.
  There is no page-per-collection or IPAFFS microservice decomposition.
- **Journey to JSON:** handlers validate/normalise page answers into journey session state. A save
  builds the complete notification JSON and sends it to the backend; the backend creates or replaces
  the whole Mongo document.
- **Identity:** `id` is stable Mongo identity. `referenceNumber` is a unique sparse business key.
  Submission changes `status`; it does not replace Mongo identity.
- **Ownership indexes:** index `ownership.assignedOrg.id` with `status` and arrival/updated sorting.
  A second creator/agent access index supports private drafts and retained agent visibility without
  broadening access to the whole agency.
- **Concurrency:** unlike the current house notification entity, this target adds Mongo `version`
  because the enriched CHED-P journey repeatedly carries a legacy ETag and `integrations.md`
  explicitly requires lost-update protection. A stale whole-document replace returns a conflict.
- **Draft/resume:** Mongo is durable state. Reopening a draft loads it into the journey session.
  Task-list completion is derived, not stored.
- **Submission:** server sets `declaredAt`, `status = SUBMITTED` and `submittedByAgent` when
  applicable. It runs submission validation and risk assessment without trusting hidden display
  inputs.
- **Amend/delete:** reuse house lifecycle values and `submittedBaseline`; inspector/decision data
  never enters the snapshot.
- **Attachments:** the uploader/scan callback updates `accompanying_documents`, joined by
  notification reference, without replacing the notification.

## fieldMap

This table maps every one of the **326** counted entries. `R`, `O` and `?` reproduce the enriched
spec's required `true`, `false` and `null`; “legacy” means “as the old system had it”. `—` means
deliberately no persisted notification property (navigation, display, search state, security/
routing plumbing, or excluded scope). A field range is inclusive.

| Field ID(s) | Page | Field | Model path / treatment | Requiredness |
|---|---|---|---|---|
| f-018 | import-type | `cert-type` | `chedType = CVEDP` | R legacy |
| f-019 | country-of-origin | `origin-country` | `origin.countryCode` | R legacy |
| f-020 | origin-of-import | `origin-country` | `origin.countryCode` (restatement) | R legacy |
| f-021 | origin-of-import | `region-code-option` | `origin.requiresRegionCode` | O legacy |
| f-022 | origin-of-import | `region-code` | `origin.regionCode` | O/C legacy |
| f-023 | origin-of-import | `consigned-country` | `origin.countryOfConsignmentCode` | R legacy |
| f-024 | origin-of-import | `conform-uk-regulations` | `origin.conformsToRegulatoryRequirements` | R legacy |
| f-025 | origin-of-import | `transport-details-required` | `transport.onwardTransportRequired` | R legacy |
| f-026 | origin-of-import | `health-certificate-required` | `origin.healthCertificateRequired` (unrendered shared variant) | O legacy |
| f-027 | origin-of-import | `local-reference-number` | `origin.internalReference` | O legacy |
| f-028–f-029 | search-commodity | code input / commodity tree | resolve `commodity.commodityComplement[].commodityCode` | R/O legacy |
| f-030 | search-commodity | code-search tab | — search-method UI | O legacy |
| f-031 | search-commodity | `species-text-input` | lookup resolving `commodity.commodityComplement[].species[].code` | R on species-search action, legacy |
| f-032 | commodity-basic-description | `type` | `…commodityComplement[].typeOfCommodityCode` | O legacy |
| f-033 | commodity-basic-description | `class` | `…commodityComplement[].classOfCommodityCode` | O legacy |
| f-034 | commodity-basic-description | `family` | `…commodityComplement[].familyOfCommodityCode` | O legacy |
| f-035 | commodity-basic-description | `species` | `…commodityComplement[].species[]` | R when options exist, legacy |
| f-036 | commodity-basic-description | `addCommodity` | — loop control; mutates `commodityComplement[]` | R legacy |
| f-037 | about-the-consignment | `purpose` | `reasonForImport` | R legacy |
| f-038 | about-the-consignment | `internal-market` | `purpose.internalMarketPurpose` | R/C legacy |
| f-039 | about-the-consignment | transhipment destination | `purpose.destinationCountryCode` | R/C legacy |
| f-040 | about-the-consignment | transit exit BCP | `transit.exitBorderControlPostCode` | R/C legacy |
| f-041 | about-the-consignment | exit date parts | `transit.exitDate` | R/C legacy |
| f-042 | about-the-consignment | exit time parts | `transit.exitTime` | R/C legacy |
| f-043 | about-the-consignment | transited country | `transit.transitedCountryCodes[]` | R/C legacy |
| f-044 | about-the-consignment | transit destination | `purpose.destinationCountryCode` | R/C legacy |
| f-045 | select-risk-category | `risk-category` | `risk.selectedCategory` | R legacy |
| f-046 | select-risk-category | `highest-risk-category` | `risk.computedHighestCategory` (server-owned hidden state) | O legacy |
| f-047–f-061 | notification-hub | task-list section links | — navigation; completeness derived from model | ? gap |
| f-062 | notification-hub | Catch certificates | — IUU boundary; never persisted in CHED-P | ? legacy |
| f-063 | notification-hub | Billing details | — conditional CUC navigation | ? legacy |
| f-064 | notification-hub | Review and submit | — navigation | ? gap |
| f-065 | notification-hub | created-for organisation context | `ownership.createdFor`, `ownership.assignedOrg` (restatement) | R confirmed |
| f-066 | notification-hub | change organisation | updates `ownership.createdFor`/`assignedOrg` while DRAFT and refreshes defaults | O confirmed |
| f-067 | notification-hub | assigned-org defaults | `importer`, `responsiblePerson` with assigned-org provenance | R confirmed |
| f-068 | commodity-extended-description | line net weight | `…commodityComplement[].netWeight` | R legacy |
| f-069 | commodity-extended-description | line package count | `…commodityComplement[].numberOfPackages` | R legacy |
| f-070 | commodity-extended-description | line package type | `…commodityComplement[].packageTypeCode` | R legacy |
| f-071 | commodity-extended-description | gross weight | `additionalDetails.totalGrossWeight` | R legacy |
| f-072 | commodity-extended-description | `number-of-animals` | — shared-page leakage; no verified CHED-P model field | ? gap |
| f-073 | commodity-extended-description | free-text package type variant | provisional alternate input for `…packageTypeCode`; do not store raw label | ? gap |
| f-074 | commodity-extended-description | `select-all` | — bulk-selection UI | ? gap |
| f-075 | commodity-extended-description | `crumb` | — CSRF | O legacy |
| f-076 | commodity-extended-description | `etag` | HTTP precondition / `version` | O legacy |
| f-077 | commodity-extended-description | `commodityDetailsPage` | — pagination/UI state | O legacy |
| f-078 | commodity-extended-description | remove commodity | deletes matching `commodityComplement[]` rows | O legacy |
| f-079 | commodity-extended-description | remove species row | deletes matching `CommodityLine` | O legacy |
| f-080 | commodity-extended-description | add species | — navigation; appends a resolved line | O legacy |
| f-081 | commodity-additional-details | `temperature` | `commodity.temperature` | R legacy |
| f-082 | commodity-additional-details | `feedingstuff` | — unrendered shared-page leakage (OPEN Q 9) | ? gap |
| f-083 | commodity-additional-details | gross-weight variant | `additionalDetails.totalGrossWeight` if this variant is confirmed | ? gap |
| f-084 | commodity-additional-details | `crumb` | — CSRF | O legacy |
| f-085 | commodity-additional-details | `etag` | HTTP precondition / `version` | O legacy |
| f-086 | latest-health-certificate | fixed certificate type | `AccompanyingDocument.documentKind = LATEST_VETERINARY_HEALTH_CERTIFICATE` | O legacy |
| f-087 | latest-health-certificate | certificate reference | `AccompanyingDocument.documentReference` | R legacy |
| f-088–f-090 | latest-health-certificate | issue date parts | `AccompanyingDocument.dateOfIssue` | R legacy |
| f-091 | latest-health-certificate | add attachment | creates upload for matching document | O legacy |
| f-092 | latest-health-certificate | uploaded file link | read-back of `AccompanyingDocument.files[]` | O legacy |
| f-093 | latest-health-certificate | remove attachment | deletes/removes matching `files[]` item | O legacy |
| f-094 | latest-health-certificate | remove row | deletes matching `AccompanyingDocument` | O legacy |
| f-095 | latest-health-certificate | add attachment | creates upload for matching document | O legacy |
| f-096 | latest-health-certificate | current page | — pagination state | O legacy |
| f-097–f-098 | document-upload | `returnUrl`, `crumb` | — routing / CSRF | O legacy |
| f-099 | document-upload | `etag` | `AccompanyingDocument.version` / HTTP precondition | O legacy |
| f-100–f-101 | document-upload | document index / request source | — routing state | O legacy |
| f-102 | document-upload | `fileUpload` | `AccompanyingDocument.files[]` after scan callback | R legacy |
| f-103 | document-upload | footer/header source | — routing state | O legacy |
| f-104 | accompanying-documents | document type | `AccompanyingDocument.documentTypeCode` | R legacy |
| f-105 | accompanying-documents | document reference | `AccompanyingDocument.documentReference` | O legacy |
| f-106–f-108 | accompanying-documents | issue date parts | `AccompanyingDocument.dateOfIssue` | O legacy |
| f-109–f-110 | accompanying-documents | row-shown / current-page state | — UI state | O legacy |
| f-111 | approved-establishment-of-origin | remove establishment | removes matching `approvedEstablishments[]` item | O legacy |
| f-112 | search-approved-establishment | `crumb` | — CSRF | O legacy |
| f-113 | search-approved-establishment | `etag` | HTTP precondition / `version` | O legacy |
| f-114–f-120 | search-approved-establishment | filters and sort | — search state, not notification data | O legacy |
| f-121 | search-approved-establishment | `add-id` | resolve and append `approvedEstablishments[]` snapshot | R legacy |
| f-122–f-125 | search-approved-establishment | return/context fields | — routing state | O legacy |
| f-126 | traders-addresses | `crumb` | — CSRF | O confirmed |
| f-127 | traders-addresses | `etag` | HTTP precondition / `version` | O confirmed |
| f-128 | traders-addresses | consignor section | `consignor` | R legacy |
| f-129 | traders-addresses | consignee section | `consignee` | R legacy |
| f-130 | traders-addresses | importer section | `importer` | R legacy |
| f-131 | traders-addresses | destination section | `destination` | R legacy |
| f-132–f-134 | traders-addresses | save/return/context controls | — navigation/routing | O legacy/confirmed |
| f-135 | traders-addresses | assigned-org context | `ownership.assignedOrg` (restatement) | R confirmed |
| f-136 | traders-addresses | org-scoped branch visibility | — query/authorisation rule, not data | O confirmed |
| f-137–f-140 | search-existing-consignor | name/address/results/country | — search state; selection resolves inline `consignor` | O legacy |
| f-141 | search-existing-consignor | org-scoped results | — query rule using `ownership.assignedOrg.id` | O confirmed |
| f-142 | consignor-creation | company name | `consignor.name` | R legacy |
| f-143–f-145 | consignor-creation | address lines 1–3 | `consignor.address.addressLine1/2/3` | R/O/O legacy |
| f-146 | consignor-creation | city | `consignor.address.city` | R legacy |
| f-147 | consignor-creation | postcode | `consignor.address.postcode` | O legacy |
| f-148 | consignor-creation | telephone | `consignor.telephone` | R legacy |
| f-149 | consignor-creation | country | `consignor.address.countryCode` | R legacy |
| f-150 | consignor-creation | email | `consignor.email` | R legacy |
| f-151–f-153 | search-existing-consignee | name/address/country | — search state; selection resolves inline `consignee` | O legacy |
| f-154 | search-existing-consignee | org-scoped results | — query rule using `ownership.assignedOrg.id` | O confirmed |
| f-155 | consignee-creation | company name | `consignee.name` | R legacy |
| f-156–f-158 | consignee-creation | address lines 1–3 | `consignee.address.addressLine1/2/3` | R/R/O legacy/confirmed |
| f-159 | consignee-creation | city | `consignee.address.city` | O legacy |
| f-160 | consignee-creation | postcode | `consignee.address.postcode` | R confirmed |
| f-161 | consignee-creation | telephone | `consignee.telephone` | O legacy |
| f-162 | consignee-creation | country | `consignee.address.countryCode` | R legacy |
| f-163 | consignee-creation | email | `consignee.email` | R legacy |
| f-164 | consignee-creation | `crumb` | — CSRF | O legacy |
| f-165 | consignee-creation | `etag` | HTTP precondition / `version` | O legacy |
| f-166–f-169 | consignee-creation | return/footer/review/reimport | — routing state | O legacy |
| f-170 | consignee-confirmation | `crumb` | — CSRF | O confirmed |
| f-171 | consignee-confirmation | `etag` | HTTP precondition / `version` | O confirmed |
| f-172 | consignee-confirmation | review return flag | — routing state | O legacy |
| f-173 | importer | importer selection | `importer` | R legacy |
| f-174 | importer | destination selection | `destination` | R legacy |
| f-175 | importer | `crumb` | — CSRF | O confirmed |
| f-176 | importer | `etag` | HTTP precondition / `version` | O confirmed |
| f-177 | importer | same as consignee | copies `consignee` to `importer` with provenance | O confirmed |
| f-178 | importer | add importer | — navigation to select/create `importer` | O confirmed |
| f-179–f-181 | importer | importer display values | read-back of `importer.*` | O confirmed |
| f-182 | importer | change importer | — navigation | O confirmed |
| f-183 | importer | destination same as consignee | copies `consignee` to `destination` with provenance | O confirmed |
| f-184 | importer | add destination | — navigation to select/create `destination` | O confirmed |
| f-185–f-188 | importer | save/cancel/review actions | — navigation | O confirmed/inferred |
| f-189 | importer | assigned-org importer | `importer` with `source = ASSIGNED_ORGANISATION` | R confirmed |
| f-190 | transport-details | port of entry | `transport.portOfEntry` | R legacy |
| f-191 | transport-details | means before | `transport.meansOfTransport` | R legacy |
| f-192 | transport-details | identification | `transport.transportIdentification` | R legacy |
| f-193 | transport-details | consignment in container | `transport.usesContainers` | O legacy |
| f-194 | transport-details | container/trailer number | `transport.containers[].containerNumber` | R/C legacy |
| f-195 | transport-details | seal number | `transport.containers[].sealNumber` | O legacy |
| f-196 | transport-details | official seal | `transport.containers[].officialSeal` | O legacy |
| f-197 | transport-details | document reference | `transport.transportDocumentReference` | R legacy |
| f-198 | transport-details | arrival date parts | `transport.arrivalDate` | R legacy |
| f-199 | transport-details | arrival time parts | `transport.arrivalTime` | R legacy |
| f-200 | means-of-transport-after-bcp | means after | `transport.onwardTransport.meansOfTransport` | R/C legacy |
| f-201 | means-of-transport-after-bcp | identification | `transport.onwardTransport.transportIdentification` | R/C legacy |
| f-202 | means-of-transport-after-bcp | document reference | `transport.onwardTransport.transportDocumentReference` | R/C legacy |
| f-203–f-205 | means-of-transport-after-bcp | departure date parts | `transport.onwardTransport.departureDate` | R/C legacy |
| f-206–f-207 | means-of-transport-after-bcp | departure time parts | `transport.onwardTransport.departureTime` | R/C legacy |
| f-208 | means-of-transport-after-bcp | responsible for transport | `transport.onwardTransport.responsibleForTransport` | O legacy |
| f-209 | goods-movement-services | CTC question | `goodsMovementServices.commonTransitConvention` | R/C legacy |
| f-210 | goods-movement-services | MRN | `goodsMovementServices.movementReferenceNumber` | R/C legacy |
| f-211 | goods-movement-services | GVMS question | `goodsMovementServices.usingGvms` | R/C legacy |
| f-212 | transporter | add transporter | — navigation to select/create `transport.transporter` | O legacy |
| f-213 | transporter | transporter table | read-back of `transport.transporter.*` | O legacy |
| f-214 | transporter | unrendered “No” variant | `transport.transporterRequired = false` if confirmed | O legacy |
| f-215 | transporter | Select variant | resolves `transport.transporter` | O legacy |
| f-216 | transporter | `crumb` | — CSRF | O legacy |
| f-217 | transporter | `etag` | HTTP precondition / `version` | R legacy plumbing |
| f-218–f-220 | search-existing-transporter | name/approval/postcode | — search state; selection resolves transporter | O legacy |
| f-221 | transporter-creation | name | `transport.transporter.name` | R legacy |
| f-222–f-224 | transporter-creation | address lines 1–3 | `transport.transporter.address.addressLine1/2/3` | R/O/O legacy |
| f-225 | transporter-creation | city | `transport.transporter.address.city` | R legacy |
| f-226 | transporter-creation | postcode | `transport.transporter.address.postcode` | O legacy |
| f-227 | transporter-creation | telephone | `transport.transporter.telephone` | R legacy |
| f-228 | transporter-creation | country | `transport.transporter.address.countryCode` | R legacy |
| f-229 | transporter-creation | email | `transport.transporter.email` | R legacy |
| f-230 | transporter-creation | `crumb` | — CSRF | O legacy |
| f-231 | transporter-creation | `etag` | HTTP precondition / `version` | O legacy |
| f-232–f-233 | transporter-creation | review/reimport context | — routing state | O legacy |
| f-234 | transporter-confirmation | `crumb` | — CSRF | O legacy |
| f-235 | transporter-confirmation | `etag` | HTTP precondition / `version` | R legacy plumbing |
| f-236 | transporter-confirmation | review context | — routing state | O legacy |
| f-237 | contact-details | name | `responsiblePerson.name` | R legacy |
| f-238 | contact-details | email | `responsiblePerson.email` | O; at least one contact method, legacy |
| f-239 | contact-details | telephone | `responsiblePerson.telephone` | O; at least one contact method, legacy |
| f-240 | contact-details | review change link | — navigation | O inferred |
| f-241 | contact-details | assigned-org contact | `responsiblePerson` with assigned-org provenance | R confirmed |
| f-242–f-244 | nominated-contacts | name/email/telephone | `nominatedContacts[].{name,email,telephone}` | O/conditional legacy |
| f-245 | contact-address | selected branch | resolves `contactAddress` inline snapshot | R legacy |
| f-246 | contact-address | add branch | — navigation to create `contactAddress` | O confirmed |
| f-247 | branch-address-creation | branch name | `contactAddress.name` | R legacy |
| f-248–f-250 | branch-address-creation | address lines 1–3 | `contactAddress.address.addressLine1/2/3` | R/R/O legacy/confirmed |
| f-251 | branch-address-creation | city | `contactAddress.address.city` | O legacy |
| f-252 | branch-address-creation | postcode | `contactAddress.address.postcode` | R confirmed |
| f-253 | branch-address-creation | telephone | `contactAddress.telephone` | O legacy |
| f-254 | branch-address-creation | country | `contactAddress.address.countryCode` | R legacy |
| f-255 | branch-address-creation | email | `contactAddress.email` | R legacy |
| f-256 | branch-address-creation | `crumb` | — CSRF | O legacy |
| f-257 | branch-address-creation | `etag` | HTTP precondition / `version` | O legacy |
| f-258–f-259 | branch-address-creation | review/reimport context | — routing state | O legacy |
| f-260 | branch-address-confirmation | `crumb` | — CSRF | O confirmed |
| f-261 | branch-address-confirmation | `etag` | HTTP precondition / `version` | O confirmed |
| f-262–f-264 | branch-address-confirmation | return/footer/review context | — routing state | O confirmed/legacy |
| f-265 | review-notification | save and continue | — navigation to declaration | O confirmed |
| f-266–f-267 | review-notification | change actions | — navigation to editable fields | O confirmed |
| f-268 | review-notification | copy references | — client-side UI | O confirmed |
| f-269 | review-notification | attachment link | read-back of `AccompanyingDocument.files[]` | O confirmed |
| f-270 | review-notification | origin value | read-back of `origin.countryCode` | R confirmed restatement |
| f-271 | review-notification | risk value | read-back of `risk.selectedCategory` | R confirmed restatement |
| f-272 | review-notification | POE value | read-back of `transport.portOfEntry` | R confirmed restatement |
| f-273 | review-notification | catch-certificate summary | — IUU boundary | O inferred restatement |
| f-274 | review-notification | add contact address | — missing-data navigation | O inferred |
| f-275 | review-notification | delegated responsible person/org | read-back of `responsiblePerson`, `ownership.assignedOrg`, `ownership.onBehalfOf` | R confirmed restatement |
| f-276 | review-notification | delegated importer | read-back of `importer` | R confirmed restatement |
| f-277 | review-notification | notification submitted by | read-back of `ownership.submittedByAgent` | R confirmed restatement |
| f-278 | declaration | hidden submission date | `declaration.declaredAt`, server-set; client value ignored | O legacy |
| f-279 | declaration | `crumb` | — CSRF | O legacy |
| f-280 | declaration | `etag` | HTTP precondition / `version` | O legacy |
| f-281 | declaration | submit | lifecycle action: `status = SUBMITTED` | O legacy |
| f-282–f-283 | declaration | CUC guidance links | — content/navigation | O legacy |
| f-284 | confirmation | CHED reference | `referenceNumber`, server-set | O legacy |
| f-285 | confirmation | customs declaration reference | `customsDeclarationReference`, server-derived | O legacy |
| f-286 | confirmation | customs document code | `customsDocumentCode`, server-derived | O legacy |
| f-287 | confirmation | risk status | — derived risk response/display; not create input | R legacy display |
| f-288–f-291 | confirmation | dashboard/new/copy/feedback controls | — navigation/UI | O legacy |
| f-292–f-293 | confirmation | risk-status variants | — derived risk response/display | O legacy |
| f-294–f-295 | confirmation | transit entry/exit statuses | — derived risk response/display | R legacy display |
| f-296 | transit-exit-bcp | `crumb` | — CSRF | O legacy |
| f-297 | transit-exit-bcp | `etag` | HTTP precondition / `version` | R legacy plumbing |
| f-298 | transit-exit-bcp | purpose | `reasonForImport` (restatement) | R legacy |
| f-299 | transit-exit-bcp | internal-market sub-purpose | `purpose.internalMarketPurpose` (restatement) | R/C legacy |
| f-300 | transit-exit-bcp | transhipment destination | `purpose.destinationCountryCode` (restatement) | R/C legacy |
| f-301 | transit-exit-bcp | exit BCP | `transit.exitBorderControlPostCode` (restatement) | R/C legacy |
| f-302 | transit-exit-bcp | exit date parts | `transit.exitDate` (restatement) | R/C legacy |
| f-303 | transit-exit-bcp | exit time parts | `transit.exitTime` (restatement) | R/C legacy |
| f-304–f-305 | transit-exit-bcp | date-picker controls | — presentation UI | O legacy |
| f-306 | transit-exit-bcp | transited country | `transit.transitedCountryCodes[]` (restatement) | R/C legacy |
| f-307 | transit-exit-bcp | add country | appends entry to `transit.transitedCountryCodes[]` | O legacy |
| f-308 | transit-exit-bcp | transit destination | `purpose.destinationCountryCode` (restatement) | R/C legacy |
| f-309 | transit-exit-bcp | save and continue | — save action | O legacy |
| f-310 | transit-exit-bcp | remove country | removes entry from `transit.transitedCountryCodes[]` | O legacy |
| f-311 | common-user-charge | `crumb` | — CSRF | O confirmed |
| f-312 | common-user-charge | `etag` | HTTP precondition / `version` | O confirmed |
| f-313 | common-user-charge | hidden billing address | read-back of `billing.address` | O confirmed restatement |
| f-314 | common-user-charge | hidden billing email | read-back of `billing.email` | O confirmed restatement |
| f-315 | common-user-charge | hidden address line 4 | `billing.address.addressLine4` | O legacy |
| f-316 | common-user-charge | hidden telephone | read-back of `billing.telephone` | O confirmed restatement |
| f-317–f-325 | common-user-charge | guidance/change/save/cancel controls | — content/navigation/save actions | O confirmed |
| f-326 | billing-select-address | `crumb` | — CSRF | O legacy |
| f-327 | billing-select-address | `etag` | HTTP precondition / `version` | R legacy plumbing |
| f-328 | billing-select-address | postcode | `billing.address.postalCode` lookup key | R legacy |
| f-329 | billing-select-address | selected address | resolves complete `billing.address`; do not store list index | R legacy |
| f-330–f-333 | billing-select-address | change/manual/continue/cancel | — navigation/save actions | O legacy |
| f-334 | billing-contact-details | email | `billing.email` | R/C legacy |
| f-335 | billing-contact-details | telephone | `billing.telephone` | R/C legacy |
| f-602 | are-you-a-plants-importer-or-agency | `isImporterOrAgency` | — Plant-specific profile/setup evidence; not CHED-P notification data | ? gap/restatement |
| f-603 | choose-your-organisation | `currentOrganisation` | — authenticated session context; not persisted on notification | ? gap/restatement |
| f-604 | manage-your-authorisations | agency | — authorisation-management context, not notification data | R confirmed/restatement |
| f-605 | manage-your-authorisations | agent code | — read-only account/agency data, not notification data | R confirmed/restatement |
| f-606 | manage-your-authorisations | auto-accept toggle | — authorisation preference, not notification data | O confirmed/restatement |
| f-607 | manage-your-authorisations | represented companies | — authorisation relationship list; constrains eligible `assignedOrg` values | O confirmed/restatement |
| f-608 | which-company-is-this-notification-for | `assignedOrg` | `ownership.assignedOrg` | ? gap/restatement; target requires selection |
| f-609 | who-are-you-creating-this-notification-for | `createdFor` | resolves `ownership.createdFor` to the own/client org and sets `ownership.onBehalfOf` | ? gap/restatement; target requires selection |

### Excluded source fields

The following enriched-spec material is deliberately outside the 326-field create map:

- dashboard search/sort inputs `f-001`–`f-017`;
- IUU catch-certificate pages;
- submitted-notification search/view and attachments-tab fields;
- all BIP inspector, documentary, identity, physical, laboratory and decision fields;
- override-risk, replace-certificate, control and border-notification fields;
- draft/submitted deletion controls and the non-working cloning candidate.

They do not justify properties on the notifier-created CHED-P Mongo document.

## Deliberate adaptations from the house model

| House neighbour | CHED-P target | Reason |
|---|---|---|
| `owner{sub, organisation}` couples actor and organisation | `ownership{createdFor, assignedOrg, onBehalfOf, submittedByAgent, createdBy}` | delegated work separates owner, creator, agency and submitter; exact fields required by this pass |
| owner index scopes by user + org | assigned-org tenant index plus creator/agent exception indexes | client members share submitted work; only the specific agent retains creator access |
| `Commodity.commodityComplement[]` with livestock leaves | same wrapper, POAO code/type/class/family/species and package/weight leaves | mirrors house nesting at the journey's actual editable row grain |
| simple `Origin` | consignment country, region, conformity and health-cert route fields | collected by CHED-P origin pages |
| one transport stage | inbound, conditional onward transport, containers and transporter | collected by CHED-P create pages |
| basic `Operator` | contact fields, postcode, IDs and provenance | manual/select/copy/assigned-org routes converge on one snapshot |
| no notification `@Version` | optimistic `version` | long journey carries ETags and integration findings require lost-update protection |
| separate accompanying documents | same separate collection | asynchronous upload/scan lifecycle |
| house livestock fields | omitted | no CHED-P page collects animals, CPH, ear tags, passports or livestock certifications |

## Open questions

1. **CHED-P reference format.** Confirm the externally visible reference format and whether a draft
   alias is needed while keeping Mongo identity and document joins stable.
2. **CHED-P DoA evidence.** Obtain a CHED-P/POAO delegated trace to confirm page copy, route placement
   and conditional presence; current mechanism evidence is cross-type.
3. **`createdFor` contract.** The target keeps `createdFor` and `assignedOrg` synchronised to the
   selected owner. Confirm whether consumers genuinely need both names or whether one can become a
   derived API alias without duplicating the value in Mongo.
4. **Agent audit timing.** Confirm whether `submittedByAgent` is written only on submit or retained
   on an abandoned draft; the target writes it on submit and uses `createdBy` for drafts.
5. **Assigned-org contact.** Define which POAO member/contact supplies `responsiblePerson` defaults.
6. **Trade Partner lifecycle.** Confirm how copy and a non-agent member's amend affect
   `onBehalfOf` and the Trade Partner badge.
7. **Draft privacy.** Confirm that creator-only client draft visibility is intentional CHED-P
   policy rather than a legacy artefact.
8. **Co-member/B2B permissions.** Confirm that rendered View/Copy/Amend actions succeed and define
   the exact B2B role matrix without granting blanket cross-org access.
9. **Commodity variants.** Confirm the non-fish multi-commodity/multi-species loop and whether
   `number-of-animals`, free-text package type or `feedingstuff` can ever render for CHED-P.
10. **Commodity identities.** Confirm stable service codes for type/class/family/species and all
    package types; never persist labels as keys.
11. **Purpose and country semantics.** Confirm wire-value normalisation for re-entry/transhipment,
    and whether country of consignment may differ from origin.
12. **Health-certificate applicability.** Reconcile low-risk skipping with the unrendered
    `health-certificate-required` variant and define final attachment requirements.
13. **Approved establishments.** Define “where required”, cardinality, duplicates and the snapshot
    fields needed across reference-data refreshes.
14. **Document loop.** Confirm add/save semantics and whether reference, date and file become
    mandatory at final submission even though accompanying-document legacy fields are optional.
15. **Onward transport.** Confirm exact gating and clearing behaviour when the origin answer changes
    from Yes to No.
16. **Transporter.** Confirm applicability, cardinality, type/approval codes and the unrendered
    No/Select variant before keeping `transporterRequired`.
17. **Party alternatives.** Confirm create/edit shapes for importer/destination and precisely when
    assigned-org defaults replace, versus coexist with, manual/Same-as-consignee values.
18. **Containers.** Confirm add-another cardinality, row validation and official-seal semantics.
19. **CTC/GVMS.** Confirm the eligibility matrix, binary-vs-three-option CTC variants and any MRN
    format validation.
20. **CUC and concurrency UX.** Confirm chargeability/manual-address scope and define the user
    experience for stale-version conflicts during long or multi-tab drafts.
