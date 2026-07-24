# Target model for the standalone IUU journey

## Scope and evidence

This is the simplest document that holds the values collected or displayed by the verified journey. The durable shape is `IuuNotificationDocument`; `IuuPageState` and `IuuPageRequest` are typed but deliberately not stored in Mongo. This boundary is **confirmed** by the page inventory (43 pages, 199 declared fields) and **inferred** as the target design from the neighboring service patterns described below. The principal rendered evidence is trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, actions 9–175.

Dates are ISO `YYYY-MM-DD`, date-times are ISO 8601 strings, counts and weights are numbers, questions with two answers are booleans where the page meaning is truly binary, and repeating things are arrays. Country, commodity, species, package, BCP, transport and establishment values are codes/IDs, not copied display labels. **Confirmed** reference-data evidence: `integrations.md`, reference-data sources 1–13; trace actions 15, 17, 22, 33, 47, 83, 115–119.

## Target JSON/TypeScript shape

```ts
type ISODate = string       // YYYY-MM-DD
type ISODateTime = string   // ISO 8601 date and time
type ReferenceCode = string

interface AttachmentMetadata {
  id: string
  fileName: string
  contentType?: string
  sizeBytes?: number
}

interface Address {
  line1: string
  line2?: string
  line3?: string
  cityOrTown: string
  postcode?: string
  countryCode: ReferenceCode
}

interface Contact {
  name: string
  email?: string
  telephone?: string
}

interface Party {
  name: string
  address: Address
  email?: string
  telephone?: string
}

interface CommoditySpeciesLine {
  speciesCode: ReferenceCode
  netWeight?: number
  numberOfPackages?: number
  packageTypeCode?: ReferenceCode
}

interface CommodityItem {
  commodityCode: ReferenceCode
  commodityTypeCode?: ReferenceCode
  speciesLines: CommoditySpeciesLine[]
}

interface CatchCertificate {
  reference?: string
  issueDate?: ISODate
  flagStateCountryCode?: ReferenceCode
  species: Array<{
    commodityCode: ReferenceCode
    speciesCode: ReferenceCode
  }>
  attachmentId: string
}

interface SupportingDocument {
  documentTypeCode: ReferenceCode
  reference?: string
  issueDate?: ISODate
  attachmentId?: string
}

interface ContainerOrTrailer {
  number: string
  sealNumber?: string
  officialSeal: boolean
}

interface TransportLeg {
  meansCode?: ReferenceCode
  identification?: string
  documentReference?: string
  departureAt?: ISODateTime
}

interface IuuNotificationDocument {
  id: string
  referenceNumber?: string
  notificationType: 'IUU'
  status: 'DRAFT' | 'SUBMITTED'
  createdAt: ISODateTime
  updatedAt: ISODateTime
  submittedAt?: ISODateTime

  origin?: {
    countryCode?: ReferenceCode
    requiresRegionCode?: boolean
    regionCode?: string
    consignedCountryCode?: ReferenceCode
    conformsToRegulations?: boolean
    localReferenceNumber?: string
  }

  purpose?: {
    reason?:
      | 'internalMarket'
      | 'transhipment'
      | 'transit'
      | 'reEntry'
    internalMarketUse?: 'animalFeedingstuff' | 'humanConsumption' | 'other'
    transhipmentDestinationCountryCode?: ReferenceCode
    transit?: {
      exitBcpCode?: ReferenceCode
      leavesGreatBritainAt?: ISODateTime
      transitedCountryCodes: ReferenceCode[]
      destinationCountryCode?: ReferenceCode
    }
  }

  commodities: CommodityItem[]
  totalGrossWeight?: number
  temperatureCode?: 'ambient' | 'chilled' | 'frozen'

  risk?: {
    selectedCategory?: 'High' | 'Medium' | 'Low'
    computedHighestCategory?: 'High' | 'Medium' | 'Low'
  }

  catchCertificatesRequired?: boolean
  attachments: AttachmentMetadata[]
  catchCertificates: CatchCertificate[]

  documents: {
    latestHealthCertificate?: SupportingDocument & {
      documentTypeCode: 'veterinaryHealthCertificate'
    }
    accompanying: SupportingDocument[]
  }

  approvedEstablishments: Array<{
    establishmentId: string
  }>

  parties: {
    consignor?: Party
    consignee?: Party
    importer?: Party
    placeOfDestination?: Party
    transporter?: Party
  }

  transport?: {
    afterBcpRequired?: boolean
    toPort?: {
      portOfEntryCode?: ReferenceCode
      meansCode?: ReferenceCode
      identification?: string
      consignmentInContainers?: boolean
      containers: ContainerOrTrailer[]
      documentReference?: string
      estimatedArrivalAt?: ISODateTime
      entryBcpCode?: ReferenceCode
      inspectionPremisesCode?: ReferenceCode
    }
    afterBcp?: TransportLeg & {
      estimatedJourneyTimeHours?: number
    }
    goodsMovement?: {
      ctcUse?: 'yesAddMrnNow' | 'yesAddMrnLater' | 'no'
      movementReferenceNumber?: string
      usesGvms?: boolean
    }
  }

  responsibleContact?: Contact
  nominatedContacts: Contact[]
  contactAddress?: Party

  confirmation?: {
    customsDeclarationReference?: string
    customsDocumentCode?: string
    inspectionOutcome?:
      | 'required'
      | 'notRequired'
      | 'checkGvms'
      | 'goToDestination'
    inspectionLocation?: string
  }
}

// Request/search state is typed so every page-spec field has a home, but it is
// not part of the Mongo notification document.
interface IuuPageState {
  dashboardFilters: {
    keywordsOrNotificationNumber?: string
    commodity?: string
    bcpCode?: ReferenceCode
    status?: string
    countryOfOriginCode?: ReferenceCode
    consigneeOrImporter?: string
    notificationType?: string
    microchipNumber?: string
    dateShortcut?: 'today' | 'tomorrow' | 'nextSevenDays' | 'clear'
    startDate?: ISODate
    endDate?: ISODate
    sort?: string
  }
  commoditySearch: {
    mode: 'code' | 'tree'
  }
  traderSearch: {
    role: 'consignor' | 'consignee' | 'transporter'
    name?: string
    address?: string
    approvalNumber?: string
    postcode?: string
  }
  establishmentSearch: {
    countryCode: ReferenceCode
    name?: string
    approvalNumber?: string
    sectionCode?: ReferenceCode
    typeCode?: ReferenceCode
    statusCode?: ReferenceCode
    sort?: string
  }
  unsupportedVariants: {
    temporaryAdmissionExitBcpCode?: ReferenceCode
  }
}

interface IuuPageRequest {
  csrfToken?: string
  etag?: string
  action?: string
}
```

**Confirmed:** commodity/species/package repetition is visible at actions 22 and 33; catch-certificate repetition, metadata, species association and upload looping are visible at actions 40, 47, 51, 53, 60 and 64. **Inferred design:** one certificate has one `attachmentId`, while several certificates may share that same attachment ID. That is the smallest shape supporting both the rendered multi-certificate-per-attachment editor and the tested one-certificate-per-upload pattern. The unresolved reverse cardinality is retained as an open question.

Optional properties make the same shape honest for a part-complete `DRAFT`; arrays are created empty and filled as repeating items are added. Submission applies the stricter completeness rules once, rather than preventing draft save/resume. **Inferred house pattern:** the neighboring frontend only adds values that exist in session (`trade-imports-animals-frontend/src/server/common/clients/notification-client.js:19-144`), while the backend persists draft status before submission (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java:89-110`).

## Rationale

- **Confirmed — trace actions 17, 22, 33 and 36:** commodities are a collection; each chosen fish species becomes a line with its own net weight, package count and package type, while total gross weight and temperature apply to the consignment.
- **Confirmed — trace actions 47 and 60; trace request 3987:** each catch certificate has a reference, issue date, flag-state country code and a set of commodity/species pairs. Species are referenced using the same codes as the commodity lines, rather than copied names.
- **Confirmed — trace actions 40, 47, 51, 53, 60 and 64:** attachments and certificates are separate concepts. The certificate carries the attachment relation so one uploaded file can describe more than one certificate.
- **Confirmed — trace actions 91–111 and 139–149:** consignor, consignee and transporter share the same name/address/contact shape. Importer and place of destination can be copied from consignee, so the document stores role snapshots rather than address-book UI IDs.
- **Confirmed — trace actions 115–136:** transport to the port, optional transport after the BCP, containers/trailers and goods-movement answers are nested under one transport object.
- **Confirmed — trace actions 12 and 15:** the two page-level occurrences of Country of origin are one obligation and both map to `origin.countryCode`; this preserves 199 page-field rows while producing 198 distinct obligations, as recorded by `journey-spec.json`.
- **Inferred — page specs plus the first-pass boundary in `integrations.md`:** search criteria, navigation controls, CSRF and ETags are request state, not notification facts. They are typed separately and excluded from Mongo.
- **Gap:** the page label says “kg/units” but no quantity-unit selector was rendered at action 33. The model therefore stores the numeric weights without inventing a unit field.

## Persistence

Use one Mongo collection named `notification`, matching the neighboring backend. A document gets an opaque Mongo `id` and a unique public `referenceNumber`; it begins in `DRAFT` and changes to `SUBMITTED` on declaration. **Inferred house pattern:** the existing entity is a single `@Document(collection = "notification")` with a Mongo `@Id` (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/Notification.java:12-21`), and its document embeds origin, commodity, parties and transport (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationBase.java:20-51`).

On each successful page POST, update the complete notification projection by stable `referenceNumber`, refresh `updatedAt`, and keep status `DRAFT`. Resume by GETting that document and repopulating journey state. **Inferred house pattern:** the frontend builds a nested notification payload from session values (`trade-imports-animals-frontend/src/server/common/clients/notification-client.js:19-144`), posts JSON to the backend (`trade-imports-animals-frontend/src/server/common/clients/notification-client.js:245-275`), and hydrates the session after a GET (`trade-imports-animals-frontend/src/server/common/clients/notification-client.js:353-379`). The backend supports whole-projection replacement and retrieval by reference (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:58-79`, `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:144-155`) and looks up the document through a Mongo repository (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java:7-19`).

Submission is a separate operation: validate the complete draft, set `submittedAt`, allocate/finalise the public reference transactionally, and transition to `SUBMITTED`. **Inferred house pattern:** the neighbor exposes a dedicated submit endpoint (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:95-109`) and restricts submission to draft/amend states before saving the status transition (`trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java:150-168`). **Confirmed legacy browser behavior:** declaration request 4636 redirects from `DRAFT.GB.2026.1525979` to `CHEDP.GB.2026.1525979`.

## House patterns followed

- **Inferred:** server-rendered handlers keep page answers in session and save a complete nested JSON projection, rather than one persistence model per page: `trade-imports-animals-frontend/src/server/origin/controller.js:80-103` and `trade-imports-animals-frontend/src/server/common/clients/notification-client.js:110-144`.
- **Inferred:** frontend-to-backend writes are plain JSON over one notification API: `trade-imports-animals-frontend/src/server/common/clients/notification-client.js:245-275`.
- **Inferred:** resume reloads the notification and restores session values: `trade-imports-animals-frontend/src/server/common/clients/notification-client.js:353-379`.
- **Inferred:** one Mongo document embeds nested domain objects and uses a stable identity/reference: `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/Notification.java:12-21` and `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationBase.java:20-51`.
- **Inferred:** Spring Data Mongo repository methods find by public reference and persist the whole aggregate: `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java:7-19` and `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java:89-110`.
- **Inferred:** draft and submit are separate lifecycle operations: `trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:58-109`.

## Field map

Every entry in every page spec's `fields` array appears below. “Page state” and “request” paths are typed but non-persisted; all other paths are in `IuuNotificationDocument`.

| Page | Page-spec field (rendered label) | Target model path | Confidence | Citation |
|---|---|---|---|---|
| `notifications-dashboard` | `certificate-number` (Keywords or notification number) | `IuuPageState.dashboardFilters.keywordsOrNotificationNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `commodity-code-or-desc` (Commodity) | `IuuPageState.dashboardFilters.commodity` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `bcp` (BCP or POE) | `IuuPageState.dashboardFilters.bcpCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `certificate-status` (Status) | `IuuPageState.dashboardFilters.status` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `country-of-origin` (Country of origin) | `IuuPageState.dashboardFilters.countryOfOriginCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `consignee` (Consignee / Importer) | `IuuPageState.dashboardFilters.consigneeOrImporter` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `certificate-type` (Notification type) | `IuuPageState.dashboardFilters.notificationType` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `microchip-number` (Microchip number (CHED-A only)) | `IuuPageState.dashboardFilters.microchipNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `(unnamed)` (Arrival / Import date range) | `IuuPageState.dashboardFilters.dateShortcut` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `start-date-day / start-date-month / start-date-year` (Start date range) | `IuuPageState.dashboardFilters.startDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `end-date-day / end-date-month / end-date-year` (End date range) | `IuuPageState.dashboardFilters.endDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `notifications-dashboard` | `orderBy` (Sort by:) | `IuuPageState.dashboardFilters.sort` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `9` |
| `import-type` | `cert-type` (What are you importing?) | `notificationType` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `10` |
| `country-of-origin` | `origin-country` (Country of origin) | `origin.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `12` |
| `origin-of-import` | `origin-country` (Country of origin) | `origin.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `region-code-option` (Does the consignment require a region of origin code?) | `origin.requiresRegionCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `region-code` (Enter the region code) | `origin.regionCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `consigned-country` (Country from where consigned) | `origin.consignedCountryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `conform-uk-regulations` (Does this consignment conform to regulatory requirements?) | `origin.conformsToRegulations` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `transport-details-required` (Will the consignment change vehicles or means of transport after the Border Control Post (BCP)?) | `transport.afterBcpRequired` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `origin-of-import` | `local-reference-number` (Add a reference number for this consignment (optional)) | `origin.localReferenceNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `15` |
| `search-commodity` | `commodity-text-input` (Enter commodity code) | `commodities[].commodityCode (after code validation)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `17` |
| `search-commodity` | `action=search` (Search) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `17` |
| `search-commodity` | `linkCommodityCodeSearch (Commodity code search tab)` (Commodity code search) | `IuuPageState.commoditySearch.mode = code` | inferred | `SearchCommodityPage.ts:14-16` |
| `search-commodity` | `parent_XX (commodity tree)` (Find the commodity in the commodity tree) | `IuuPageState.commoditySearch.mode = tree` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `17` |
| `commodity-basic-description` | `type` (Type of commodity) | `commodities[].commodityTypeCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `22` |
| `commodity-basic-description` | `species` (Select species of commodity) | `commodities[].speciesLines[].speciesCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `22` |
| `commodity-basic-description` | `addCommodity` (Do you want to add another commodity?) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `22` |
| `about-the-consignment` | `purpose` (What is the main reason for importing the consignment?) | `purpose.reason` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `internal-market` (Purpose in the internal market) | `purpose.internalMarketUse` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `third-country-transhipment` (Destination country) | `purpose.transhipmentDestinationCountryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `bcp-transit-third-country` (Exit border control post) | `purpose.transit.exitBcpCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `estimated-arrival-at-port-of-exit-date-day / -month / -year` (When the consignment will leave Great Britain) | `purpose.transit.leavesGreatBritainAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `estimated-arrival-at-port-of-exit-time-hour / -minutes` (Time entry:) | `purpose.transit.leavesGreatBritainAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `transit-third-countries (id transit-third-countries-last)` (Transited country) | `purpose.transit.transitedCountryCodes[]` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `third-country-transit` (Destination country) | `purpose.transit.destinationCountryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `25` |
| `about-the-consignment` | `save-and-return-to-hub (secondary submit, variant)` (Save and return to hub) | `IuuPageRequest.action (not persisted)` | inferred | `AboutTheConsignmentPage.ts:50-52` |
| `about-the-consignment` | `bcp-temporary-admission (variant — CHED-A only, not IUU)` (Exit border control post (temporary admission of horses)) | `IuuPageState.unsupportedVariants.temporaryAdmissionExitBcpCode` | inferred | `AboutTheConsignmentPage.ts:42-44` |
| `select-risk-category` | `risk-category` (Select the highest risk category for the commodities in this consignment) | `risk.selectedCategory` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `27` |
| `select-risk-category` | `highest-risk-category` ((hidden field — pre-computed highest risk category of the consignment's commodities)) | `risk.computedHighestCategory` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `27` |
| `notification-hub` | `origin-of-the-import` (Origin of the import) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `purpose-of-consignment` (Main reason for importing the consignment) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `commodity-details-link` (Commodity) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Additional details) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Catch certificates) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Latest health certificate) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Accompanying documents) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Approved establishment of origin (where required)) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Addresses) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Transport to the port of entry) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Transport after the Border Control Post (BCP)) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Goods movement services) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Transporter) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Contact details) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Nominated contacts (optional)) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Contact address for consignment) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `notification-hub` | `(unnamed)` (Review and submit) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `30` |
| `commodity-extended-description` | `{commodityCode}-{lineId}.net-weight (observed: 03019230-1756325.net-weight)` (Net weight (kg/units)) | `commodities[].speciesLines[].netWeight` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `33` |
| `commodity-extended-description` | `{commodityCode}-{lineId}.num-packages (observed: 03019230-1756325.num-packages)` (Number of packages) | `commodities[].speciesLines[].numberOfPackages` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `33` |
| `commodity-extended-description` | `{commodityCode}-{lineId}.package-type (observed: 03019230-1756325.package-type)` (Type of package) | `commodities[].speciesLines[].packageTypeCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `33` |
| `commodity-extended-description` | `gross-weight` (Total gross weight (kg/units)) | `totalGrossWeight` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `33` |
| `commodity-additional-details` | `temperature` (Temperature) | `temperatureCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `36` |
| `catch-certificate-needed` | `catch-certificate-needed` (Do you need to add catch certificates?) | `catchCertificatesRequired` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `38` |
| `attach-catch-certificate` | `fileUpload` (Choose files) | `attachments[]` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `40` |
| `manage-catch-certificates` | `upload-catch-certificates` (Do you need to upload more catch certificates?) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `51` |
| `manage-catch-certificates` | `(attachment card action)` (Add details) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ManageCatchCertificatesPage.ts:6-8` |
| `manage-catch-certificates` | `(attachment card action)` (View or amend details) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `51` |
| `manage-catch-certificates` | `(attachment card action)` (Remove) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `51` |
| `add-catch-certificate-details` | `number-of-catch-certificates` (Number of catch certificates in this attachment) | `catchCertificates[] (derived count per attachmentId)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `add-catch-certificate-details` | `catch-certificate-reference-1` (Catch certificate reference) | `catchCertificates[].reference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `add-catch-certificate-details` | `date-of-issue-day-1 / date-of-issue-month-1 / date-of-issue-year-1` (Date of issue) | `catchCertificates[].issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `add-catch-certificate-details` | `flag-state-1 (select) / flag-state-1-select id, autocomplete input id=flag-state-1` (Flag state of catching vessel(s)) | `catchCertificates[].flagStateCountryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `add-catch-certificate-details` | `select-all-checkbox-1` (Select all) | `catchCertificates[].species[] (selection action; not stored separately)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `add-catch-certificate-details` | `species-1756325-1` (Select species being imported under this catch certificate) | `catchCertificates[].species[] { commodityCode, speciesCode }` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `47` |
| `latest-health-certificate` | `latest-vet-health-cert-reference` (Document reference) | `documents.latestHealthCertificate.reference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `66` |
| `latest-health-certificate` | `Document type (static)` (Document type) | `documents.latestHealthCertificate.documentTypeCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `68` |
| `latest-health-certificate` | `latest-vet-health-cert-issue-date-day` (Day) | `documents.latestHealthCertificate.issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `67` |
| `latest-health-certificate` | `latest-vet-health-cert-issue-date-month` (Month) | `documents.latestHealthCertificate.issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `68` |
| `latest-health-certificate` | `latest-vet-health-cert-issue-date-year` (Year) | `documents.latestHealthCertificate.issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `69` |
| `latest-health-certificate` | `add-attachment-latest-health-cert` (Add attachment) | `documents.latestHealthCertificate.attachmentId + attachments[]` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `70` |
| `latest-health-certificate` | `latest-vet-health-cert-attachment-link` (View <filename>) | `documents.latestHealthCertificate.attachmentId + attachments[]` | inferred | `LatestHealthCertificatePage.ts:23-25` |
| `document-upload` | `fileUpload` (Select a document) | `attachments[] + parent document/certificate attachmentId` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `71` |
| `accompanying-documents` | `document-type` (Document type) | `documents.accompanying[].documentTypeCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `accompanying-documents` | `document-reference` (Document reference) | `documents.accompanying[].reference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `accompanying-documents` | `document-issue-date-day` (Day) | `documents.accompanying[].issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `accompanying-documents` | `document-issue-date-month` (Month) | `documents.accompanying[].issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `accompanying-documents` | `document-issue-date-year` (Year) | `documents.accompanying[].issueDate` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `accompanying-documents` | `(attachment upload)` (Add attachment) | `documents.accompanying[].attachmentId + attachments[]` | inferred | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `76` |
| `approved-establishment-of-origin` | `add-establishment` (Search for an approved establishment) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `80` |
| `search-for-approved-establishment` | `establishment-country-code` (Country (required)) | `IuuPageState.establishmentSearch.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `establishment-name` (Name) | `IuuPageState.establishmentSearch.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `establishment-number` (Approval number) | `IuuPageState.establishmentSearch.approvalNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `establishment-section` (Section) | `IuuPageState.establishmentSearch.sectionCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `establishment-type` (Type) | `IuuPageState.establishmentSearch.typeCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `establishment-status` (Status) | `IuuPageState.establishmentSearch.statusCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `order-by` (Sort by:) | `IuuPageState.establishmentSearch.sort` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `add-id` (Select) | `approvedEstablishments[].establishmentId` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `83` |
| `search-for-approved-establishment` | `save-and-continue` (Save and continue) | `IuuPageRequest.action (not persisted)` | inferred | `SearchForApprovedEstablishmentPage.ts:18-20` |
| `search-for-approved-establishment` | `search-for-an-approved-establishment` (Search for an approved establishment) | `IuuPageRequest.action (not persisted)` | inferred | `SearchForApprovedEstablishmentPage.ts:6-8` |
| `traders-addresses` | `add-consignor / edit-consignor` (Consignor or exporter) | `parties.consignor` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `98` |
| `traders-addresses` | `add-consignee / edit-consignee` (Consignee) | `parties.consignee` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `98` |
| `traders-addresses` | `populate_importer / add-importer / edit-importer` (Importer) | `parties.importer` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `98` |
| `traders-addresses` | `populate_place_of_destination / add-place-of-destination` (Place of destination) | `parties.placeOfDestination` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `98` |
| `search-existing-consignor` | `name` (Name) | `IuuPageState.traderSearch.name (role = consignor)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `86` |
| `search-existing-consignor` | `address` (Address) | `IuuPageState.traderSearch.address (role = consignor)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `86` |
| `consignor-creation` | `company-name` (Consignee name) | `parties.consignor.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `87` |
| `consignor-creation` | `address-line-1` (Address line 1) | `parties.consignor.address.line1` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `88` |
| `consignor-creation` | `address-line-2` (Address line 2 (optional)) | `parties.consignor.address.line2` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `89` |
| `consignor-creation` | `address-line-3` (Address line 3 (optional)) | `parties.consignor.address.line3` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `90` |
| `consignor-creation` | `city-or-town` (City or town) | `parties.consignor.address.cityOrTown` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `91` |
| `consignor-creation` | `postcode` (Postcode or ZIP code) | `parties.consignor.address.postcode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `92` |
| `consignor-creation` | `telephone` (Telephone number) | `parties.consignor.telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `93` |
| `consignor-creation` | `country` (Country) | `parties.consignor.address.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `91` |
| `consignor-creation` | `email` (Email address) | `parties.consignor.email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `95` |
| `consignor-confirmation` | `button-add (submit) / crumb + etag (hidden)` (Add to notification) | `IuuPageRequest.action + csrfToken + etag (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `97` |
| `search-existing-consignee` | `name` (Name) | `IuuPageState.traderSearch.name (role = consignee)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `99` |
| `search-existing-consignee` | `address` (Address) | `IuuPageState.traderSearch.address (role = consignee)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `99` |
| `search-existing-consignee` | `results-table-row` (Traders search results table) | `parties.consignee (selected Party snapshot)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `99` |
| `search-existing-consignee` | `create-new-consignee-link` (Create a new consignee) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `99` |
| `consignee-creation` | `company-name` (Consignee name) | `parties.consignee.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `address-line-1` (Address line 1) | `parties.consignee.address.line1` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `address-line-2` (Address line 2 (optional)) | `parties.consignee.address.line2` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `address-line-3` (Address line 3 (optional)) | `parties.consignee.address.line3` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `city-or-town` (City or town) | `parties.consignee.address.cityOrTown` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `postcode` (Postcode or ZIP code) | `parties.consignee.address.postcode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `telephone` (Telephone number) | `parties.consignee.telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `country` (Country) | `parties.consignee.address.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `consignee-creation` | `email` (Email address) | `parties.consignee.email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `104` |
| `transport-details` | `bcp (select id=bcp-select; visible autocomplete input id=bcp)` (Port of entry) | `transport.toPort.portOfEntryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `transport-means-before` (Choose from:) | `transport.toPort.meansCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `117` |
| `transport-details` | `identification` (Transport identification) | `transport.toPort.identification` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `118` |
| `transport-details` | `consignment-in-container (radios id are-consignments-in-containers-yes / are-consignments-in-containers-no)` (Are any road trailers or shipping containers being used to transport the consignment?) | `transport.toPort.consignmentInContainers` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `container-number-1` (Container or trailer number) | `transport.toPort.containers[].number` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `seal-number-1` (Seal number) | `transport.toPort.containers[].sealNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `official-seal-1` (Official seal) | `transport.toPort.containers[].officialSeal` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `document` (Transport document reference) | `transport.toPort.documentReference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `119` |
| `transport-details` | `arrival-date-day / arrival-date-month / arrival-date-year` (Estimated arrival at port of entry) | `transport.toPort.estimatedArrivalAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, actions `120-122` |
| `transport-details` | `arrival-time-hour / arrival-time-minutes` (Time of estimated arrival) | `transport.toPort.estimatedArrivalAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, actions `123-124` |
| `transport-details` | `bcp-or-port-of-entry (variant combobox, label 'BCP or Port of entry')` (BCP or Port of entry) | `transport.toPort.portOfEntryCode` | inferred | `TransportDetailsPage.ts:12-14` |
| `transport-details` | `entry-border-control-post (variant select, label 'Entry border control post')` (Entry border control post) | `transport.toPort.entryBcpCode` | inferred | `TransportDetailsPage.ts:20-22` |
| `transport-details` | `inspection-premises (variant select, label 'Inspection premises')` (Inspection premises) | `transport.toPort.inspectionPremisesCode` | inferred | `TransportDetailsPage.ts:24-26` |
| `transport-details` | `means-of-transport-after-bcp-or-poe (variant select, label 'Means of transport after BCP or Port of entry')` (Means of transport after BCP or Port of entry) | `transport.afterBcp.meansCode` | inferred | `TransportDetailsPage.ts:36-38` |
| `transport-details` | `estimated-journey-time-hours (variant text, label 'Hours')` (Estimated journey time (Hours)) | `transport.afterBcp.estimatedJourneyTimeHours` | inferred | `TransportDetailsPage.ts:63-65` |
| `means-of-transport-after-bcp` | `transport-means-after` (Choose from:) | `transport.afterBcp.meansCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `130` |
| `means-of-transport-after-bcp` | `identification` (Transport identification) | `transport.afterBcp.identification` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `130` |
| `means-of-transport-after-bcp` | `document` (Transport document reference) | `transport.afterBcp.documentReference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `130` |
| `means-of-transport-after-bcp` | `departure-date-day / departure-date-month / departure-date-year` (Date and time of departure from BCP) | `transport.afterBcp.departureAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `130` |
| `means-of-transport-after-bcp` | `departure-time-hour / departure-time-minutes` (Date and time of departure from BCP) | `transport.afterBcp.departureAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `130` |
| `goods-movement-services` | `ctc-question` (Are you using the Common Transit Convention (CTC) to move goods between countries?) | `transport.goodsMovement.ctcUse` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `136` |
| `goods-movement-services` | `ncts-mrn` (Movement Reference Number (MRN)) | `transport.goodsMovement.movementReferenceNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `136` |
| `goods-movement-services` | `gvms-question` (Will the transport use the Goods Vehicle Movement Service (GVMS)?) | `transport.goodsMovement.usesGvms` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `136` |
| `search-existing-transporter` | `name` (Name) | `IuuPageState.traderSearch.name (role = transporter)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `139` |
| `search-existing-transporter` | `approvalNumber` (Approval Number) | `IuuPageState.traderSearch.approvalNumber (role = transporter)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `139` |
| `search-existing-transporter` | `postcode` (Post Code) | `IuuPageState.traderSearch.postcode (role = transporter)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `139` |
| `search-existing-transporter` | `add-id` (Select) | `parties.transporter (selected Party snapshot)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `139` |
| `search-existing-transporter` | `view-id` (View) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `139` |
| `transporter-creation` | `company-name` (Transporter name) | `parties.transporter.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `address-line-1` (Address line 1) | `parties.transporter.address.line1` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `address-line-2` (Address line 2 (optional)) | `parties.transporter.address.line2` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `address-line-3` (Address line 3 (optional)) | `parties.transporter.address.line3` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `city-or-town` (City or town) | `parties.transporter.address.cityOrTown` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `postcode` (Postcode or ZIP code) | `parties.transporter.address.postcode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `telephone` (Telephone number) | `parties.transporter.telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `country` (Country) | `parties.transporter.address.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-creation` | `email` (Email address) | `parties.transporter.email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `144` |
| `transporter-confirmation` | `crumb` ((hidden CSRF token — no visible label)) | `IuuPageRequest.csrfToken (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `150` |
| `transporter-confirmation` | `etag` ((hidden optimistic-concurrency etag — no visible label)) | `IuuPageRequest.etag (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `150` |
| `contact-details` | `name` (Name) | `responsibleContact.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `152` |
| `contact-details` | `email` (Email address) | `responsibleContact.email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `152` |
| `contact-details` | `telephone` (Mobile number) | `responsibleContact.telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `152` |
| `nominated-contacts` | `name` (Name) | `nominatedContacts[].name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `153` |
| `nominated-contacts` | `email` (Email address) | `nominatedContacts[].email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `153` |
| `nominated-contacts` | `telephone` (Mobile number) | `nominatedContacts[].telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `153` |
| `contact-address` | `branch-address-select` (Select an address) | `contactAddress (selected Party snapshot)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `154` |
| `branch-address-creation` | `company-name` (Branch address name) | `contactAddress.name` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `address-line-1` (Address line 1) | `contactAddress.address.line1` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `address-line-2` (Address line 2 (optional)) | `contactAddress.address.line2` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `address-line-3` (Address line 3 (optional)) | `contactAddress.address.line3` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `city-or-town` (City or town) | `contactAddress.address.cityOrTown` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `postcode` (Postcode or ZIP code) | `contactAddress.address.postcode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `telephone` (Telephone number) | `contactAddress.telephone` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `country` (Country) | `contactAddress.address.countryCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-creation` | `email` (Email address) | `contactAddress.email` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `159` |
| `branch-address-confirmation` | `crumb` ((hidden CSRF token)) | `IuuPageRequest.csrfToken (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `165` |
| `branch-address-confirmation` | `etag` ((hidden concurrency token)) | `IuuPageRequest.etag (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `165` |
| `review-notification` | `save-and-continue` (Save and continue) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `170` |
| `review-notification` | `change-link` (Change) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ReviewNotificationPage.ts:29-31` |
| `review-notification` | `add-contact-address` (Add the contact address for consignment) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ReviewNotificationPage.ts:157-159` |
| `review-notification` | `amend` (Amend) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ReviewNotificationPage.ts:14-16` |
| `review-notification` | `review-and-submit` (Review and submit) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ReviewNotificationPage.ts:18-20` |
| `review-notification` | `split-consignment` (Split consignment) | `IuuPageRequest.action (not persisted)` | inferred | `page-objects/notification/ReviewNotificationPage.ts:22-28` |
| `review-notification` | `copy-reference` (Copy) | `IuuPageRequest.action (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `170` |
| `declaration` | `crumb` ((hidden CSRF token)) | `IuuPageRequest.csrfToken (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `174` |
| `declaration` | `etag` ((hidden optimistic-concurrency token)) | `IuuPageRequest.etag (not persisted)` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `174` |
| `declaration` | `submissionDate` ((hidden submission date)) | `submittedAt` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `174` |
| `confirmation` | `reference-number` (CHED reference) | `referenceNumber` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `175` |
| `confirmation` | `reference-number-customs` (Reference for your customs declaration) | `confirmation.customsDeclarationReference` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `175` |
| `confirmation` | `reference-number-document` (Customs document code) | `confirmation.customsDocumentCode` | confirmed | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `175` |
| `confirmation` | `risk-assessment-outcome` (Inspection status) | `confirmation.inspectionOutcome + confirmation.inspectionLocation` | inferred | trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, action `175` |

### Supplemental field-like page metadata

The two `approved-establishment-of-origin.relatedFields` entries do not add fields: `approvedEstablishmentCountry` maps to `IuuPageState.establishmentSearch.countryCode`, and `approvedEstablishmentCount` is `approvedEstablishments.length` (**inferred:** `SearchForApprovedEstablishmentPage.ts:10-12`; `ched-p-workflows.ts:148,374-383`). The five `review-notification.assertedReviewValues` are restatements, not new inputs: Consignment reference number → `origin.localReferenceNumber`; Import risk category → `risk.selectedCategory`; Country of origin → `origin.countryCode`; Port of entry → `transport.toPort.portOfEntryCode`; Catch certificate summary row → `catchCertificates[]` plus `attachments[]` (**inferred:** `ReviewNotificationPage.ts:33-35,65-84`; `ched-p-notification.spec.ts:210-217`).

## Open questions

1. **Gap — unit semantics:** does “Net weight (kg/units)” / “Total gross weight (kg/units)” mean kilograms for every chapter-03 fish commodity, or is the unit derived per commodity? No unit selector was rendered at trace action 33, so no `unit` field is invented.
2. **Gap — catch-certificate attachment cardinality:** the rendered editor supports more than one certificate under one attachment (trace action 47), while the automated path uploads one file per certificate (trace actions 40 and 53). Can one certificate also have multiple attachments? The proposed singular `attachmentId` does not assume that unobserved direction.
3. **Gap — IUU exemptions:** review shows “No exemptions specified”, but no page spec collects an exemption and neither trace nor tests show the populated shape. No exemption property is added until a collecting page is evidenced.
4. **Gap — standalone scope:** confirm whether the new IUU service retains the generic CHED-P purpose branches, approved-establishment, trader, transporter, health-certificate and dashboard surfaces. They remain mapped because they are present in the verified page specs; removing them is a product ruling, not a modeling inference.
5. **Gap — unsupported variants:** confirm that the CHED-A temporary-admission BCP field and CHED-A-only dashboard microchip filter are excluded. They are mapped only to non-persisted page/request state and do not contaminate the IUU notification.
6. **Gap — reference contracts:** confirm the authoritative chapter-03 commodity/species/package datasets, the flag-state inclusion rule, establishment IDs and BCP eligibility rules. `integrations.md` identifies these contracts but the single trace does not establish their full cardinality.
7. **Gap — risk output:** only “Required at London Tilbury” was rendered (trace action 175). Until the risk-assessment contract is agreed, `confirmation.inspectionOutcome` and `inspectionLocation` must remain absent; the first pass must not manufacture a regulatory result.
8. **Gap — search persistence:** this model treats dashboard/trader/establishment search values as request state. Confirm whether the product needs saved searches; nothing in the page specs or neighboring notification aggregate evidences that requirement.
9. **Gap — draft concurrency:** the legacy pages carry ETags, while the neighboring backend replaces the full projection by reference without an exposed ETag. Decide whether the new app needs optimistic locking before implementation; CSRF and ETag values must never be stored as notification facts.
10. **Gap — public reference allocation:** declaration confirms the DRAFT-to-CHEDP reference transition (trace request 4636), but the standalone IUU prefix/format is not specified. Keep `referenceNumber` opaque until that convention is decided.

## Coverage check

The field map contains **199 rows**, exactly matching the **199 fields** declared across all 43 `pages/*.json` files. These are **198 distinct obligations** because the two Country-of-origin entries intentionally share `origin.countryCode`, matching `journey-spec.json.metrics`. Every row has a target path, confidence tag and evidence citation. Pages with no declared fields (`health-certificate-required`, `consignee-confirmation`, `transporter`) correctly contribute no field rows.
