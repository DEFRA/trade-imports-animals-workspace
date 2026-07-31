# Plant-products (CHED-PP) backend schema design

Designed 2026-07-31 (headless overnight run). Self-contained: an implementor needs this file,
the backend repo, and nothing else. Sources: `recon/backend-model.md` (house shapes),
`recon/chedpp-requirements.md` (rulings + scope), `trace-requirements/ched-pp/target-model.md`
(field truth), `docs/best-practices/rest-api/rest-api.md` (Zalando), plus a live read of
`animals/Application.java` (component-scan root confirmation).

**Prime directive:** a NEW sibling domain package `uk.gov.defra.trade.imports.plantproducts`
inside `repos/trade-imports-animals-backend`. The `uk.gov.defra.trade.imports.animals` package is
**never edited** (importing from it is also avoided — see D-6). Mirror the house patterns; replace
livestock leaves with plant leaves per target-model.md.

---

## 0. Recorded decisions (headless — decided, not asked)

| id | Decision | Rationale |
|---|---|---|
| D-1 | REST base path **`/plant-products/notifications`** | The default expectation confirmed: kebab-case, plural noun, no collision with animals' `/notifications`; sub-resources stay within Zalando's 3-level limit. |
| D-2 | Collections **`plant_products_notification`** + **`plant_products_accompanying_documents`** | Mirrors the house names (`notification`, `accompanying_documents`) with an unambiguous prefix; same Mongo database, zero collision. Accompanying documents SEPARATE per target-model ruling (async-scan boundary). |
| D-3 | Lifecycle = **`PUT …/{ref}/status`** (noun sub-resource) + **`POST …/{ref}/copies`** | `feedback_rest_nouns_not_action_paths` bans copying the house `/submit`, `/amend`, `/cancel-amend`, `/soft-delete`, `/copy` action paths. One status sub-resource carries all four transitions; copy is creation in a `copies` collection. |
| D-4 | Cancel-amend = `PUT /status {status: SUBMITTED, discardChanges: true}` | AMEND→SUBMITTED is ambiguous (complete vs cancel); an explicit `discardChanges` flag disambiguates without reintroducing an action path. |
| D-5 | Reference numbers **`GBN-PP-{YY}-{XXXXXX}`** | House mechanics verbatim (Crockford base32, SecureRandom, caller-side 3-retry on `DuplicateKeyException`); only the `AG`→`PP` discriminator changes. Open Q 4's `CHEDPP.GB.YYYY.NNNNNNN` alternative rejected for pass 1 — Dynamics is out of scope and the format lives in one constant + one regex, swappable later. |
| D-6 | **Zero imports from the animals package** in production code | Never-touched AND never-imported: an animals refactor must not break plants. Shared shapes (status enum, means of transport, Operator/Address) are redeclared in `plantproducts`. Exception: test infra (ITs extend the existing `integration/IntegrationBase` — test-tree pragmatism, recorded). |
| D-7 | Every Spring-stereotyped class is prefixed **`PlantProducts`** | Spring's default bean name is the uncapitalized simple name; a second `NotificationService` in a different package fails boot with `ConflictingBeanDefinitionException`. Value/model classes get the prefix only where the simple name exists in animals (prevents wrong-package auto-imports); genuinely new names (`CommodityLine`, `PlantSpecies`, …) go bare. |
| D-8 | Wiring via **auto-configuration imports**, not an Application edit | `@SpringBootApplication` lives at `animals.Application` — a sibling package is invisible to its scan. `PlantProductsAutoConfiguration` (@AutoConfiguration + @ComponentScan + @EnableMongoRepositories) registered in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` wires everything with no animals-package edit. **HAZARD:** `@EnableMongoRepositories` makes Boot's repository auto-config back off, so it MUST list BOTH base packages (`…animals`, `…plantproducts`) or animals repositories vanish. Verify by running the existing animals ITs after wiring. |
| D-9 | Domain model = **Lombok `@Data`/`@SuperBuilder` base split, NOT records** | The task brief said "Java records"; the house says Lombok mutable classes with an abstract entity/DTO base and records only at boundaries (recon §1, §5.1–5.2). Mirroring wins: records cannot use `@SuperBuilder` inheritance and an all-nullable draft aggregate is hostile to records. Records (with compact-constructor null guards) are used for every API request/response and service-internal result — exactly the house split. |
| D-10 | JSON is **camelCase**, query params are house-style (`page`, `sort`, `referenceNumber`) | Deviation from Zalando snake_case, recorded: the same platform/frontend consumes both APIs and target-model.md is camelCase; intra-service consistency beats guideline purity. Paths remain kebab-case per Zalando. |
| D-11 | **No outbox, no audit, no ActorRequest** in pass 1 | Dynamics/TRACES/Notify integrations are deferred entirely (requirements §7); the outbox exists solely to feed them. Add later as its own increment. |
| D-12 | **Minimal ownership now** (`assignedOrganisationId`, `assignedOrganisationName`), rest of DoA deferred | DoA is OUT (inc-032 deferred) but the dashboard is "scoped to stubbed org in pass 1" (inc-028) — so the scoping field must exist and be indexed now. `agencyOrganisationId` / `createdByUserId` arrive with inc-032. |
| D-13 | Backend does **not** enforce obligations (incl. c-015 ≥1 document at submit) | House principle: draft-by-default, everything nullable, the frontend enforces obligations. The submit-blocking required-document error is inc-025's frontend concern. Backend guards only lifecycle legality (status transitions) and referential shape. |
| D-14 | Measures are **`BigDecimal`**; counts are `Integer`; `arrivalTime` is a `String "HH:mm"` | Never float/double for quantities. Spring Data Mongo stores BigDecimal as String by default — acceptable (no numeric queries/sorts on measures in pass 1; no `MongoCustomConversions` edit allowed since animals' `MongoConfig` owns it). `LocalTime` maps awkwardly in Mongo; target-model already specifies `"HH:mm"`. Dates: `LocalDate`; timestamps: `LocalDateTime` (house parity). |
| D-15 | `chedType` persisted as constant `"CHEDPP"` (server-set on create) | Cheap forward-compatibility for any future shared reader/Dynamics filter; never a form field. |
| D-16 | Expiry sweep mirrored (`expireAt` plain index + conditional sweeper, cascade to documents) | Non-prod hygiene parity with the house; property `plant-products.notification.ttl.sweep.enabled` (no matchIfMissing). |
| D-17 | Own exceptions + **`@RestControllerAdvice(basePackages = "…plantproducts")`** | The animals `GlobalExceptionHandler` only maps `animals.exceptions.*` types; D-6 forbids importing them. A scoped advice keeps the two error surfaces independent; RFC-9457-style problem body, never stack traces. |
| D-18 | `isCuc : Boolean` free-standing flag + `billing` subdocument | c-007: the CUC trigger is unconfirmed with IPAFFS; a free-standing flag keeps the trigger swappable. Placeholder only in m0–m4; consumed by inc-036 (m5). |
| D-19 | Copy retain/reset rules live in a **plain-Java `PlantProductsNotificationCopyMapper`** | House pattern (MapStruct deliberately rejected there so per-field retain/reset is explicit and auditable). Reset: `id`, `referenceNumber` (re-mint), `status`→DRAFT, `declaration`, `submittedBaseline`, `expireAt`, `created`/`updated`→now. Retain: all content fields + `ownership` (pass-1 stubbed org). Accompanying documents are NOT copied (house-consistent; a copy starts documentless — c-015 will force re-attachment before submit). |
| D-20 | `application.yml` gains a `plant-products:` block | The yml is a shared resource file, not the animals package; additive-only edit is in-bounds. |

---

## 1. Domain model — the aggregate, field by field

Package `uk.gov.defra.trade.imports.plantproducts.notification` unless stated. All domain classes:
Lombok `@Data @SuperBuilder @NoArgsConstructor @AllArgsConstructor` (abstract base) or
`@Data @Builder @NoArgsConstructor @AllArgsConstructor` (nested value classes). **Every domain field
is nullable** (draft-by-default) — null-guarding appears only on boundary records (§4) and in
service lifecycle guards. Server-set fields (`id`, `referenceNumber`, `chedType`, `status`,
`created`, `updated`, `expireAt`, `submittedBaseline`, `ownership`) are rejected/ignored on input
by the MapStruct mapping, mirroring the house.

### 1.1 `PlantProductsNotificationBase` (abstract, shared by entity + DTO)

```
PlantProductsNotificationBase (abstract @Data @SuperBuilder)
├── referenceNumber : String                  @Indexed(unique = true, sparse = true) — GBN-PP-…, server-minted
├── chedType : String                         server-set constant "CHEDPP" (D-15)
├── status : PlantProductsNotificationStatus  enum DRAFT | SUBMITTED | AMEND | DELETED
├── ownership : Ownership                     (D-12 — server-set from the auth stub, never a form field)
│   ├── assignedOrganisationId : String       owning tenant; dashboard scope key (indexed via compound, §2)
│   └── assignedOrganisationName : String     display name
│   (agencyOrganisationId, createdByUserId — DEFERRED to inc-032; additive later)
├── origin : PlantProductsOrigin
│   ├── countryCode : String                  ISO-2 / GB subdivision (Countries ref-data)
│   ├── countryOfConsignmentCode : String     Countries ref-data (Open Q 9 noted, both kept)
│   └── internalReference : String            optional local reference, max 30 (frontend-enforced)
├── reasonForImport : ReasonForImport         enum INTERNAL_MARKET | RE_ENTRY | RE_CONFORMITY_CHECK
├── commodity : PlantProductsCommodity
│   ├── name : String                         group label (house parity; CHED-PP renders per-leaf desc)
│   ├── inputMethod : CommodityInputMethod    enum MANUAL | CSV (provenance of CSV-sourced lines)
│   └── commodityComplement : List<CommodityLine>     ← repeating group level 1
│       CommodityLine
│       ├── uniqueComplementId : String       stable row key (server-assigned UUID on first save of a line)
│       ├── commodityCode : String            CN/HS code (Commodity-codes fixture)
│       ├── commodityDescription : String     ref-data-derived leaf description, not typed
│       ├── numberOfPackages : Integer
│       ├── packageType : String              code (Package types, 24)
│       ├── quantity : BigDecimal
│       ├── quantityType : String             code (Quantity types, 8)
│       ├── netWeight : BigDecimal            kg
│       ├── controlledAtmosphereContainer : Boolean
│       ├── finishedOrPropagated : FinishedOrPropagated   enum FINISHED | PROPAGATED
│       ├── intendedForFinalUsers : Boolean
│       ├── testAndTrial : Boolean
│       └── species : List<PlantSpecies>      ← repeating group level 2
│           PlantSpecies
│           ├── eppoCode : String             THE JOIN KEY (Open Q 1 ruling — speciesId is transient-ish)
│           ├── genusAndSpecies : String      scientific name, ref-data-derived
│           ├── speciesId : String            internal ref-data id; persisted for round-trip, never joined on
│           └── varieties : List<SpeciesVariety>   ← repeating group level 3
│               SpeciesVariety
│               ├── variety : String          variety ID (not display label — Open Q 2 ruling)
│               └── varietyClass : VarietyClass    enum CLASS_I | CLASS_II | EXTRA_CLASS (null when N/A)
├── additionalDetails : PlantProductsAdditionalDetails
│   ├── totalGrossWeight : BigDecimal         kg
│   ├── grossVolume : BigDecimal              optional
│   └── grossVolumeUnit : GrossVolumeUnit     enum LITRES | METRES_CUBED (required-iff-grossVolume: frontend rule)
├── consignor : PlantProductsOperator         HAND-ENTERED (POP-4) — the one typed party
├── consignee : PlantProductsOperator         auto-populated = owning org (POP-3, server/stub-filled)
├── importer : PlantProductsOperator          auto-populated = owning org + registered address (POP-1)
├── destination : PlantProductsOperator       'Same as consignee' or entered (house name kept)
├── packer : PlantProductsOperator            OPTIONAL — CHED-PP addition, house has no packer
│   PlantProductsOperator
│   ├── operatorId : String                   address-book id when picked; null when free-typed (book deferred)
│   ├── name : String
│   ├── telephone : String
│   ├── email : String
│   └── address : PlantProductsAddress
│       ├── addressLine1 : String
│       ├── addressLine2 : String
│       ├── addressLine3 : String             (house has `county`; CHED-PP form has line 3 — deliberate)
│       ├── city : String
│       ├── postcode : String
│       └── country : String                  ISO / GB-subdivision code (Open Q 10 noted)
├── responsiblePerson : PlantProductsContact  auto-populated from owning-org member (POP-2; which member = G-1)
├── nominatedContacts : List<PlantProductsContact>    repeating, optional
│   PlantProductsContact
│   ├── name : String
│   ├── email : String                        email-OR-telephone rule is a frontend fieldset rule (D-13)
│   ├── telephone : String
│   └── isAgent : Boolean
├── transport : PlantProductsTransport
│   ├── borderControlPost : String            BCP code (144) — RENAMED from house portOfEntry (deliberate)
│   ├── inspectionPremises : String           control-point code, per-BCP ref-data
│   ├── meansOfTransport : PlantProductsMeansOfTransport   enum AIRPLANE | RAILWAY | ROAD_VEHICLE | VESSEL
│   ├── transportIdentification : String
│   ├── transportDocumentReference : String
│   ├── arrivalDate : LocalDate
│   ├── arrivalTime : String                  "HH:mm" 24h (D-14) — CHED-PP addition
│   ├── usesContainers : Boolean
│   └── containers : List<TransportContainer>          repeating
│       TransportContainer { containerNumber : String, sealNumber : String, officialSeal : Boolean }
├── goodsMovementServices : GoodsMovementServices
│   ├── commonTransitConvention : CommonTransitConvention   enum ADD_MRN_NOW | ADD_MRN_LATER | NO
│   ├── movementReferenceNumber : String      18-char MRN, required-iff-ADD_MRN_NOW (frontend rule)
│   └── usingGvms : Boolean
├── isCuc : Boolean                           free-standing CUC billing trigger (D-18, c-007 provisional)
├── billing : PlantProductsBilling            CUC only (placeholder in m0–m4; consumed by inc-036)
│   ├── address : BillingAddress { addressLine1..addressLine4, cityOrTown, county, postalCode }
│   ├── email : String
│   └── telephone : String
├── declaration : Declaration { agreed : Boolean, declaredAt : LocalDateTime }   (Open Q 6: kept explicit)
├── created : LocalDateTime                   server-set on create
└── updated : LocalDateTime                   server-set on every save
```

Omitted vs house, deliberately (target-model deviations table): `placeOfOrigin`, `consignment`,
`cphNumber`, `transitedCountries`, `transporter`, `Origin.requiresRegionCode` — no CHED-PP page
collects them; livestock fields do not ride along.

### 1.2 Entity / DTO / snapshot

```java
// @Document(collection = "plant_products_notification")
// @CompoundIndex(name = "org_status_dashboard", def = "{'ownership.assignedOrganisationId': 1, 'status': 1}")
public class PlantProductsNotification extends PlantProductsNotificationBase {
    @Id private String id;                                          // Mongo ObjectId hex, auto
    @JsonIgnore private PlantProductsNotificationContentSnapshot submittedBaseline;  // amend restore point
    @JsonIgnore @Indexed private LocalDateTime expireAt;            // PLAIN index (sweep cascades to docs) — NOT Mongo TTL
}

public class PlantProductsNotificationDto extends PlantProductsNotificationBase { }  // empty — API body
```

`PlantProductsNotificationContentSnapshot` — Lombok `@Value` immutable copy of the **16 amendable
content fields**: `origin`, `reasonForImport`, `commodity`, `additionalDetails`, `consignor`,
`consignee`, `importer`, `destination`, `packer`, `responsiblePerson`, `nominatedContacts`,
`transport`, `goodsMovementServices`, `isCuc`, `billing`, `declaration`. Excludes `id`,
`referenceNumber`, `chedType`, `status`, `ownership` (fixed at submit — OWN-3), `created`,
`updated`, `submittedBaseline`, `expireAt`. Static `from(PlantProductsNotification)` and
`applyTo(PlantProductsNotification)` delegating to a MapStruct DeepClone mapper; null lists
normalised to `List.of()` (house parity).

### 1.3 Accompanying documents — separate aggregate

Package `uk.gov.defra.trade.imports.plantproducts.accompanyingdocument`. Separate collection
(async-scan boundary ruling; file **bytes + AV deferred** — metadata only, so no `scanStatus`
in pass 1; additive when inc-037 lands).

```java
// @Document(collection = "plant_products_accompanying_documents")
public class PlantProductsAccompanyingDocument {
    @Id private String id;
    @Indexed private String notificationReferenceNumber;   // FK, GBN-PP-…
    private String documentType;                           // code (Document types, 17)
    private String documentReference;
    private LocalDate issueDate;
    private List<DocumentFile> files;                      // DocumentFile { fileId, filename } — metadata only
    private LocalDateTime created;
    private LocalDateTime updated;
}
```

`notificationReferenceNumber` is nullable on the entity (house style) but **service-guarded**: the
create path derives it from the URL path, never the body (a body value is ignored by the mapper).

### 1.4 Nullability rules

- **Domain classes: everything nullable, no guards** (draft-by-default; frontend owns obligations — D-13).
- **Boundary records: compact-constructor guards** — `StatusChangeRequest` requires non-null
  `status` (`Objects.requireNonNull` + Bean Validation `@NotNull`); page responses defensively copy
  lists (`List.copyOf`); response records normalise null lists to empty.
- **Service guards** (throw `PlantProductsBadRequestException`): status-transition legality table
  (§3.3); path/body referenceNumber mismatch; body-supplied server-set fields on create.

---

## 2. Mongo persistence

| Collection | Class | Id strategy | Indexes |
|---|---|---|---|
| `plant_products_notification` | `notification/PlantProductsNotification` | `@Id String` (auto ObjectId) | unique+sparse on `referenceNumber`; compound `org_status_dashboard` `{'ownership.assignedOrganisationId':1,'status':1}`; plain `@Indexed` on `expireAt` |
| `plant_products_accompanying_documents` | `accompanyingdocument/PlantProductsAccompanyingDocument` | `@Id String` (auto ObjectId) | `@Indexed` on `notificationReferenceNumber` |

- `spring.data.mongodb.auto-index-creation: true` is already set globally — annotation-declared
  indexes materialise at boot; nothing to configure.
- Nested objects persist as plain subdocuments; **no custom converters** (D-14: BigDecimal→String
  default accepted; `arrivalTime` is already a String).
- Whole-document replace per save (no JSON-Patch, no `@Version`/ETag — last-write-wins is the
  recorded Open-Q-3 decision, same as the house).
- Expiry: `expireAt` plain-indexed; `PlantProductsNotificationExpirySweeper`
  (`@ConditionalOnProperty plant-products.notification.ttl.sweep.enabled`, no matchIfMissing;
  shedlock-locked via the existing app-level `LockingTaskExecutor` bean — a bean, not an animals
  class import; batch-bounded) deletes expired notifications and **cascades to
  `plant_products_accompanying_documents`** by `notificationReferenceNumber`. Non-prod only.
- Transactions: the existing app-level `MongoTransactionManager` bean makes `@Transactional` work
  for multi-write ops (status change + snapshot; expiry cascade).

---

## 3. REST surface — nouns only

Base: **`/plant-products/notifications`**. Path variables validated with
`@Pattern(regexp = PlantProductsReferenceNumberGenerator.REFERENCE_NUMBER_PATTERN)`. Every method
carries OpenAPI `@Operation`/`@ApiResponse` + Micrometer `@Timed("controller.<op>.time")` (house
controller shape). Optional `x-cdp-request-id` trace header. No `User-Id`/audit headers in pass 1
(D-11). Error bodies via `PlantProductsExceptionHandler` (D-17).

### 3.1 `PlantProductsNotificationController`

| Method + path | Body in | Out | Codes |
|---|---|---|---|
| `POST /plant-products/notifications` | `PlantProductsNotificationDto` (referenceNumber must be blank) | `PlantProductsNotification` | **201** +Location / 400 body carries a referenceNumber |
| `PUT /plant-products/notifications/{reference-number}` | `PlantProductsNotificationDto` (ref must match path) | `PlantProductsNotification` | **200** replaced / **201** created (+Location) / 400 mismatch or not writable (SUBMITTED/DELETED) |
| `GET /plant-products/notifications/{reference-number}` | — | `PlantProductsNotificationResponse` (record; embeds `accompanyingDocuments`) | 200 / 404 |
| `GET /plant-products/notifications?page&sort&referenceNumber` | — | `PlantProductsNotificationPageResponse` (record; content = DTO list; 1-based page; DELETED hidden — `status IN (DRAFT, SUBMITTED, AMEND)`) | 200 |
| `PUT /plant-products/notifications/{reference-number}/status` | `StatusChangeRequest { status!, discardChanges? }` | `PlantProductsNotification` | 200 / 400 illegal transition / 404 |
| `POST /plant-products/notifications/{reference-number}/copies` | — | `PlantProductsNotification` (new DRAFT, new ref) | **201** +Location / 400 not copyable (DRAFT/DELETED source) / 404 |

**The status transition table** (service-enforced; anything else → 400):

| From → To (`discardChanges`) | Meaning | Side effects |
|---|---|---|
| DRAFT → SUBMITTED | submit | require `declaration.agreed == true` is **frontend's** job (D-13); capture `submittedBaseline`; ownership frozen (OWN-3) |
| SUBMITTED → AMEND | start amendment | `submittedBaseline = Snapshot.from(current)` (captured at amend-start, house parity) |
| AMEND → SUBMITTED (null/false) | complete amendment | re-capture `submittedBaseline` from the amended content |
| AMEND → SUBMITTED (true) | **cancel amendment** | `submittedBaseline.applyTo(notification)`, restore, keep old baseline |
| DRAFT/SUBMITTED/AMEND → DELETED | soft delete | idempotent on already-DELETED (200) |

`discardChanges` on any other transition → 400.

### 3.2 `PlantProductsAccompanyingDocumentController`

Base: `/plant-products/notifications/{reference-number}/accompanying-documents` (3 path levels —
at the Zalando max, fine).

| Method + path | Body in | Out | Codes |
|---|---|---|---|
| `GET …/accompanying-documents` | — | `PlantProductsAccompanyingDocumentListResponse { documents: [...] }` (never a bare array) | 200 / 404 notification unknown |
| `POST …/accompanying-documents` | `PlantProductsAccompanyingDocumentDto` | dto | **201** +Location / 400 / 404 notification unknown |
| `PUT …/accompanying-documents/{document-id}` | dto | dto | 200 / 404 (doc not under this notification) |
| `DELETE …/accompanying-documents/{document-id}` | — | — | **204** / 404 |

Documents are writable only while the notification is writable (DRAFT/AMEND) — 400 otherwise.

### 3.3 Skeleton signatures (implementor contract)

```java
// notification/
@Component  class PlantProductsReferenceNumberGenerator {
    public static final String REFERENCE_NUMBER_PATTERN = "^GBN-PP-\\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$";
    String generate();                       // GBN-PP-{YY}-{6 Crockford base32 chars}, SecureRandom
}

interface PlantProductsNotificationRepository extends MongoRepository<PlantProductsNotification, String> {
    Optional<PlantProductsNotification> findByReferenceNumber(String referenceNumber);
    Page<PlantProductsNotification> findAllByStatusIn(Collection<PlantProductsNotificationStatus> statuses, Pageable pageable);
    Optional<PlantProductsNotification> findByReferenceNumberAndStatusIn(String referenceNumber, Collection<PlantProductsNotificationStatus> statuses);
    @Query("{'expireAt': {$ne: null, $lte: ?0}}")
    List<PlantProductsNotificationReferenceOnly> findExpired(LocalDateTime now, Pageable batch);
}
interface PlantProductsNotificationReferenceOnly { String getReferenceNumber(); }   // slim projection

final class PlantProductsNotificationSort { /* private ctor; whitelist switch:
    arrivalDate -> transport.arrivalDate, createdAt -> created; default arrivalDate,desc */ }

@Service  class PlantProductsNotificationService {
    record ReplaceResult(PlantProductsNotification notification, boolean created) {}
    PlantProductsNotification create(PlantProductsNotificationDto dto);            // mint ref (3-retry loop), DRAFT, chedType, ownership from stub, created/updated
    ReplaceResult replace(String referenceNumber, PlantProductsNotificationDto dto); // upsert; guard writable status
    Optional<PlantProductsNotification> find(String referenceNumber);
    PlantProductsNotificationPageResponse findAll(int page, String sort, String referenceNumber);
    @Transactional PlantProductsNotification changeStatus(String referenceNumber, StatusChangeRequest request);  // table §3.1
    PlantProductsNotification copy(String referenceNumber);                        // CopyMapper + new mint
}

@RestController @RequestMapping("/plant-products/notifications") @Validated
class PlantProductsNotificationController { /* six endpoints of §3.1; Location via AppConfig.baseUrl() bean */ }

// Boundary records — compact-constructor guards (D-9)
record StatusChangeRequest(@NotNull PlantProductsNotificationStatus status, Boolean discardChanges) {
    StatusChangeRequest { Objects.requireNonNull(status, "status"); } }
@Builder(toBuilder = true)
record PlantProductsNotificationResponse(/* base fields */, List<PlantProductsAccompanyingDocumentDto> accompanyingDocuments) { /* null lists -> List.of() */ }
record PlantProductsNotificationPageResponse(List<PlantProductsNotificationDto> content, int page, int pageSize,
        long totalElements, int totalPages) { PlantProductsNotificationPageResponse { content = content == null ? List.of() : List.copyOf(content); } }

// Mappers (MapStruct, spring component model, unmappedTargetPolicy = ERROR + unmappedSourcePolicy = ERROR)
@Mapper interface PlantProductsNotificationMapper { /* dto -> entity, entity -> dto; explicit ignores for server-only */ }
@Mapper(mappingControl = DeepClone.class) interface PlantProductsNotificationContentSnapshotMapper { … }
@Component class PlantProductsNotificationCopyMapper { PlantProductsNotification copyFrom(PlantProductsNotification source); }  // D-19 rules

// accompanyingdocument/
interface PlantProductsAccompanyingDocumentRepository extends MongoRepository<PlantProductsAccompanyingDocument, String> {
    List<PlantProductsAccompanyingDocument> findByNotificationReferenceNumber(String referenceNumber);
    Optional<PlantProductsAccompanyingDocument> findByIdAndNotificationReferenceNumber(String id, String referenceNumber);
    void deleteByNotificationReferenceNumber(String referenceNumber);              // expiry cascade
}
@Service  class PlantProductsAccompanyingDocumentService {
    List<PlantProductsAccompanyingDocument> list(String notificationReferenceNumber);
    PlantProductsAccompanyingDocument create(String notificationReferenceNumber, PlantProductsAccompanyingDocumentDto dto);
    PlantProductsAccompanyingDocument replace(String notificationReferenceNumber, String documentId, PlantProductsAccompanyingDocumentDto dto);
    void delete(String notificationReferenceNumber, String documentId);
}
record PlantProductsAccompanyingDocumentDto(String id, String documentType, String documentReference,
        LocalDate issueDate, List<DocumentFile> files) { /* files -> List.of() when null */ }
record PlantProductsAccompanyingDocumentListResponse(List<PlantProductsAccompanyingDocumentDto> documents) { /* copyOf guard */ }

// exceptions/
class PlantProductsBadRequestException extends RuntimeException {}   // -> 400
class PlantProductsNotFoundException  extends RuntimeException {}    // -> 404
@RestControllerAdvice(basePackages = "uk.gov.defra.trade.imports.plantproducts")
class PlantProductsExceptionHandler { /* problem-style bodies, no stack traces */ }
```

---

## 4. Reference-number minting

- Format **`GBN-PP-{YY}-{XXXXXX}`**, e.g. `GBN-PP-26-4XKPMQ`.
- `REFERENCE_NUMBER_PATTERN = "^GBN-PP-\\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$"` — shared constant used by
  both controllers' `@Pattern` guards and the accompanying-document FK validation.
- Body = 6 chars of Crockford base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ` — no I, L, O, U) from a
  static `SecureRandom`; `YY` = two-digit current year.
- Generator is a dumb `@Component`; **collision handling is caller-side**: unique sparse index +
  save loop catching `DuplicateKeyException`, `MAX_REF_RETRIES = 3`, then `IllegalStateException`
  (`create` and `copy` paths). Mechanics identical to the house; only the prefix differs (D-5).

---

## 5. Wiring (the one non-obvious bit)

1. `plantproducts/PlantProductsAutoConfiguration.java`:
   ```java
   @AutoConfiguration
   @ComponentScan("uk.gov.defra.trade.imports.plantproducts")
   @EnableMongoRepositories(basePackages = {
       "uk.gov.defra.trade.imports.animals",          // MUST stay — auto-config backs off once we declare this (D-8 hazard)
       "uk.gov.defra.trade.imports.plantproducts"})
   @EnableConfigurationProperties(PlantProductsNotificationTtlConfig.class)
   public class PlantProductsAutoConfiguration { }
   ```
2. `src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
   — one line: `uk.gov.defra.trade.imports.plantproducts.PlantProductsAutoConfiguration`.
3. `application.yml` — additive block:
   ```yaml
   plant-products:
     notification:
       ttl:
         sweep:
           enabled: false   # non-prod overlays turn it on, mirroring the animals knob
   ```
4. **Wiring verification gate:** boot the app and run the existing animals ITs (`mvn -f … verify`)
   BEFORE building features — proves the dual-package repository scan didn't orphan animals repos.

---

## 6. Obligation → field map

Full map in the sibling file `obligation-field-map.md` (every m0–m4 increment → backing schema
fields, plus the m5 fields already present in the schema). That file is the contract the frontend
planners build against.

---

## 7. Ordered file list for the implementor

All paths relative to
`repos/trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/plantproducts/`
unless prefixed. Order = build order; each stage compiles before the next. Tests colocated per
house pattern (one unit test class per production class under `src/test/java/...plantproducts/...`;
ITs under the existing `integration/` package extending `IntegrationBase` — D-6 test exception).

**Stage 1 — wiring (then run the animals ITs: the D-8 gate)**
1. `PlantProductsAutoConfiguration.java`
2. `src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (new resource)
3. `src/main/resources/application.yml` (additive `plant-products:` block)

**Stage 2 — enums** (all in `notification/`)
4. `notification/PlantProductsNotificationStatus.java`
5. `notification/ReasonForImport.java`
6. `notification/CommodityInputMethod.java`
7. `notification/FinishedOrPropagated.java`
8. `notification/VarietyClass.java`
9. `notification/GrossVolumeUnit.java`
10. `notification/PlantProductsMeansOfTransport.java` (@Schema descriptions per constant, house style)
11. `notification/CommonTransitConvention.java`

**Stage 3 — value classes**
12. `notification/PlantProductsAddress.java`
13. `notification/PlantProductsOperator.java`
14. `notification/PlantProductsContact.java`
15. `notification/Ownership.java`
16. `notification/PlantProductsOrigin.java`
17. `notification/SpeciesVariety.java`
18. `notification/PlantSpecies.java`
19. `notification/CommodityLine.java`
20. `notification/PlantProductsCommodity.java`
21. `notification/PlantProductsAdditionalDetails.java`
22. `notification/TransportContainer.java`
23. `notification/PlantProductsTransport.java`
24. `notification/GoodsMovementServices.java`
25. `notification/BillingAddress.java`
26. `notification/PlantProductsBilling.java`
27. `notification/Declaration.java`

**Stage 4 — aggregate spine**
28. `notification/PlantProductsNotificationBase.java`
29. `notification/PlantProductsNotification.java`
30. `notification/PlantProductsNotificationDto.java`
31. `notification/PlantProductsNotificationContentSnapshotMapper.java`
32. `notification/PlantProductsNotificationContentSnapshot.java`

**Stage 5 — exceptions**
33. `exceptions/PlantProductsBadRequestException.java`
34. `exceptions/PlantProductsNotFoundException.java`
35. `exceptions/PlantProductsExceptionHandler.java`

**Stage 6 — notification feature**
36. `notification/PlantProductsReferenceNumberGenerator.java`
37. `notification/PlantProductsNotificationReferenceOnly.java`
38. `notification/PlantProductsNotificationRepository.java`
39. `notification/PlantProductsNotificationMapper.java`
40. `notification/PlantProductsNotificationCopyMapper.java`
41. `notification/PlantProductsNotificationSort.java`
42. `notification/StatusChangeRequest.java`
43. `notification/PlantProductsNotificationPageResponse.java`
44. `notification/PlantProductsNotificationResponse.java`
45. `notification/PlantProductsNotificationService.java`
46. `notification/PlantProductsNotificationController.java`

**Stage 7 — accompanying-documents feature**
47. `accompanyingdocument/DocumentFile.java`
48. `accompanyingdocument/PlantProductsAccompanyingDocument.java`
49. `accompanyingdocument/PlantProductsAccompanyingDocumentDto.java`
50. `accompanyingdocument/PlantProductsAccompanyingDocumentListResponse.java`
51. `accompanyingdocument/PlantProductsAccompanyingDocumentRepository.java`
52. `accompanyingdocument/PlantProductsAccompanyingDocumentMapper.java`
53. `accompanyingdocument/PlantProductsAccompanyingDocumentService.java`
54. `accompanyingdocument/PlantProductsAccompanyingDocumentController.java`

**Stage 8 — expiry sweep**
55. `configuration/PlantProductsNotificationTtlConfig.java`
56. `configuration/PlantProductsNotificationExpirySweeper.java`

**Stage 9 — tests** (unit per class, house naming; ITs last)
57. `…/test/java/…plantproducts/notification/PlantProductsReferenceNumberGeneratorTest.java`
58. `…/test/java/…plantproducts/notification/PlantProductsNotificationSortTest.java`
59. `…/test/java/…plantproducts/notification/PlantProductsNotificationMapperTest.java`
60. `…/test/java/…plantproducts/notification/PlantProductsNotificationCopyMapperTest.java`
61. `…/test/java/…plantproducts/notification/PlantProductsNotificationServiceTest.java`
62. `…/test/java/…plantproducts/notification/PlantProductsNotificationControllerTest.java`
63. `…/test/java/…plantproducts/accompanyingdocument/PlantProductsAccompanyingDocumentServiceTest.java`
64. `…/test/java/…plantproducts/accompanyingdocument/PlantProductsAccompanyingDocumentControllerTest.java`
65. `…/test/java/…plantproducts/configuration/PlantProductsNotificationExpirySweeperTest.java`
66. `…/test/java/…animals/integration/PlantProductsNotificationIT.java` (extends IntegrationBase; run via `mvn verify`)
67. `…/test/java/…animals/integration/PlantProductsAccompanyingDocumentIT.java`
68. `…/test/java/…animals/integration/PlantProductsNotificationExpiryIT.java`

One enum round-trip test + one unknown-value negative test per enum (never per-constant tests);
snapshot capture/restore and the five-row status-transition table are the highest-value service
tests; ITs prove end-to-end create → save → submit → amend → cancel-amend → copy → soft-delete plus
the document sub-resource CRUD and the dual-package wiring.
