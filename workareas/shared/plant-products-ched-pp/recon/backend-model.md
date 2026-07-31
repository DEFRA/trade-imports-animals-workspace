# Backend animals notification model — recon map

Source repo: `repos/trade-imports-animals-backend`, package root
`src/main/java/uk/gov/defra/trade/imports/animals/`. Captured 2026-07-31 from branch
`spike/EUDPA-288-model-retrofit`-merged `spike/trace-to-requirements` state (this checkout is
mid-spike; treat as current working truth for the plant-products sibling design).

Package layout at the root (one folder per aggregate/concern):
`notification/`, `fulfilment/`, `proposednotification/`, `accompanyingdocument/` (+ `file/`),
`outbox/` (+ `gbnag/` event payload model), `audit/`, `exceptions/`, `configuration/` (+ `tls/`),
`filter/`, `interceptor/`, `cdp/uploader/`, `s3/`, `service/`.

---

## 1. Field-and-type inventory — notification aggregate

All model classes are **Lombok `@Data` mutable classes** (not records) with
`@Builder`/`@SuperBuilder` + `@NoArgsConstructor` + `@AllArgsConstructor`. There are **no
compact-constructor null guards in the domain model** — everything is nullable (draft-by-default
journey; the frontend enforces obligations). Records + null guards appear only at
service/API boundaries (see section 5).

```
NotificationBase (abstract, @Data @SuperBuilder — shared by entity + DTO)  [NotificationBase.java]
├── referenceNumber : String        @Indexed(unique = true, sparse = true)
├── origin : Origin
│   ├── countryCode : String
│   ├── requiresRegionCode : String
│   └── internalReference : String
├── commodity : Commodity
│   ├── name : String
│   └── commodityComplement : List<CommodityComplement>
│       ├── typeOfCommodity : String
│       ├── totalNoOfAnimals : Integer
│       ├── totalNoOfPackages : Integer
│       └── species : List<Species>
│           ├── value : String          (MDM option value)
│           ├── text : String           (MDM option display text)
│           ├── noOfAnimals : Integer
│           ├── noOfPackages : Integer
│           ├── earTag : String
│           └── passport : String
├── reasonForImport : String
├── additionalDetails : AdditionalDetails
│   ├── certifiedFor : String
│   └── unweanedAnimals : String
├── placeOfOrigin : Operator            (Operator = { name : String, address : Address })
├── consignor : Operator
├── consignee : Operator
├── importer : Operator
├── destination : Operator
├── consignment : Operator              (consignment contact — reused Operator shape)
│   └── address : Address
│       ├── addressLine1 : String
│       ├── addressLine2 : String
│       ├── addressLine3 : String
│       ├── city : String
│       └── country : String
├── cphNumber : String
├── transport : Transport
│   ├── portOfEntry : String
│   ├── arrivalDate : LocalDate
│   ├── meansOfTransport : MeansOfTransport  (enum: AIRPLANE, RAILWAY, ROAD_VEHICLE, VESSEL;
│   │                                          @Schema descriptions per constant)
│   ├── transportIdentification : String
│   ├── transportDocumentReference : String
│   ├── transitedCountries : List<String>
│   └── transporter : Transporter
│       ├── name : String
│       ├── address : Address
│       ├── approvalNumber : String
│       └── type : String
├── status : NotificationStatus         (enum: DRAFT, SUBMITTED, AMEND, DELETED)
├── created : LocalDateTime
└── updated : LocalDateTime

Notification extends NotificationBase   [Notification.java] — @Document(collection = "notification")
├── id : String                         @Id (Mongo ObjectId string, auto-assigned)
├── submittedBaseline : NotificationContentSnapshot   @JsonIgnore (amend-cancel restore point)
└── expireAt : LocalDateTime            @JsonIgnore @Indexed (plain index, NOT Mongo TTL —
                                        sweep cascades to accompanying documents; non-prod only)

NotificationDto extends NotificationBase [NotificationDto.java] — API body; adds nothing.

NotificationContentSnapshot [NotificationContentSnapshot.java] — Lombok @Value (immutable) copy of
the 12 amendable fields (origin, commodity, reasonForImport, additionalDetails, placeOfOrigin,
consignor, consignee, importer, destination, consignment, cphNumber, transport). Excludes
id/referenceNumber/status/created/updated/submittedBaseline/expireAt. Has static `from(Notification)`
and `applyTo(Notification)` delegating to a MapStruct DeepClone mapper.
```

Key inheritance trick: **entity and DTO share one abstract base** (`NotificationBase`) so field
declarations are never duplicated; the entity layer adds only `@Id` + Mongo/Jackson annotations.

## 2. Mongo mapping

- Collections (all via Spring Data `@Document`; `application.yml` sets
  `spring.data.mongodb.auto-index-creation: true` so annotation-declared indexes are created at boot):
  | Collection | Class | Id strategy | Indexes |
  |---|---|---|---|
  | `notification` | `notification/Notification.java` | `@Id String` (auto ObjectId) | unique+sparse on `referenceNumber`; plain `@Indexed` on `expireAt` |
  | `fulfilment` | `fulfilment/Fulfilment.java` | `@Id String` = **the GBN reference itself** (no separate ObjectId) | `@CompoundIndexes`: `created_at` `{'createdAt':-1}`, `submitted_at` `{'submittedAt':-1}`, unique partial `copy_idempotency_key` `{'copyIdempotencyKey':1}` with `partialFilter {'$type':'string'}` |
  | `outbox` | `outbox/OutboxEvent.java` | — | unique compound `aggregate_version_uq`, compound `unpublished_poll`, `@Indexed` field |
  | `audit` | `audit/Audit.java` | — | none |
  | `accompanying_documents` | `accompanyingdocument/AccompanyingDocument.java` | — | compound `{notificationReferenceNumber, scanStatus}`, `@Indexed` + two `@Indexed(unique=true)` fields |
  | `proposedNotification` | `proposednotification/ProposedNotification.java` | — | — |
- No custom converters registered. Nested objects persist as plain subdocuments.
  `Fulfilment.fulfilment` is `List<org.bson.Document>` — **schema-free canonical journey payload**
  stored verbatim (the obligation-model frontend owns its shape).
- `configuration/MongoConfig.java`: `@EnableMongoAuditing`, `@EnableScheduling`, connection-pool +
  SSL/truststore beans, `MongoTransactionManager` bean (enables `@Transactional`), and shedlock
  `MongoLockProvider`/`LockingTaskExecutor` beans (used for outbox-write and expiry-sweep locking).
- `configuration/NotificationTtlConfig.java` + `NotificationExpirySweeper.java`: non-prod-only
  scheduled sweep (`@ConditionalOnProperty notification.ttl.sweep.enabled=true`, no matchIfMissing),
  shedlock-locked, batch-bounded, deletes expired notifications **and cascades to documents** —
  the reason `expireAt` is a plain index, not a Mongo TTL index.

## 3. REST surface

### `/notifications` — `notification/NotificationController.java`
`@RestController @RequestMapping("/notifications") @Validated`; path variables validated with
`@Pattern(regexp = ReferenceNumberGenerator.REFERENCE_NUMBER_PATTERN)`. Headers:
`x-cdp-request-id` (trace, optional) and `User-Id` (required on replay/delete → `AuditContext`).

| Method + path | Body in | Out | Codes |
|---|---|---|---|
| POST `/notifications` | `NotificationDto` | `Notification` | 200 (create if blank ref, else update) |
| PUT `/notifications/{referenceNumber}` | `NotificationDto` (ref must match path) | `Notification` | 200 replaced / 201 created (+Location) / 400 mismatch |
| POST `/notifications/{ref}/copy` | — | `Notification` (new DRAFT) | 200 / 400 not copyable / 404 |
| POST `/notifications/{ref}/submit` | optional `ActorRequest` | `Notification` | 200 / 400 / 401 / 404 / 500 |
| POST `/notifications/{ref}/amend` | optional `ActorRequest` | `Notification` | 200 / 400 / 401 / 404 / 500 |
| POST `/notifications/{ref}/cancel-amend` | — | `Notification` | 200 / 400 / 401 / 404 |
| POST `/notifications/{ref}/soft-delete` | — | `Notification` | 200 / 400 / 401 / 404 |
| GET `/notifications/{ref}` | — | `NotificationResponse` (record; + accompanyingDocuments) | 200 / 401 / 404 |
| GET `/notifications?page&sort&referenceNumber` | — | `NotificationPageResponse` (record; content = `NotificationDto` list, 1-based page) | 200 |
| GET `/notifications/reference-numbers?page` | — | `ReferenceNumberPageResponse` (record; 0-based page) | 200 / 401 |
| GET `/notifications/{ref}/outbox-events` | — | `List<OutboxEvent>` | 200 / 401 |
| POST `/notifications/{ref}/replay` | — (headers) | `ReplayResponse(int eventsReplayed)` | 200 / 401 / 404 |
| DELETE `/notifications` | `List<String>` refs (headers req'd) | void | 204 / 400 empty / 404 missing refs (audited) |

Note: `/submit`, `/amend`, `/copy` etc. are **action-path style** — Sam's REST ruling
(`feedback_rest_nouns_not_action_paths`) says NEVER copy these action paths into a new API; a
plant-products sibling should use noun endpoints/HTTP verbs (flagged, decided by the design phase).

Listing behaviour: dashboard list filters to `status IN (DRAFT, SUBMITTED, AMEND)` (DELETED hidden);
`sort` parsed by `NotificationSort.toSort` — `arrivalDate` → `transport.arrivalDate`, `createdAt` →
`created`, default `arrivalDate,desc`; optional `referenceNumber` = exact-match single-row page.

### `/fulfilments` — `fulfilment/FulfilmentController.java`
Ids ARE reference numbers (same `@Pattern` guard). `Idempotency-Key` header required on copy.

| Method + path | Body in | Out | Codes |
|---|---|---|---|
| POST `/fulfilments` | — | `Fulfilment` (empty DRAFT, minted id) | 201 +Location |
| PUT `/fulfilments/{id}` | `FulfilmentDto { id, @NotNull fulfilment: List<Document> }` | `Fulfilment` | 200 / 201 / 400 (id mismatch or not writable) |
| GET `/fulfilments/{id}` | — | `Fulfilment` | 200 / 404 |
| GET `/fulfilments?page&sort&referenceNumber` | — | `FulfilmentPageResponse` (record + nested `Item` record) | 200 |
| POST `/fulfilments/{id}/copy` | — (`Idempotency-Key` header) | `Fulfilment` | 201 (idempotent re-create returns same copy) / 400 / 404 |
| POST `/fulfilments/{id}/submit` | optional `ActorRequest` | `Fulfilment` | 200 / 400 / 404 |
| POST `/fulfilments/{id}/amend` | optional `ActorRequest` | `Fulfilment` | 200 / 400 / 404 |
| POST `/fulfilments/{id}/cancel-amend` | — | `Fulfilment` | 200 / 400 / 404 |
| POST `/fulfilments/{id}/soft-delete` | — | `Fulfilment` | 200 (idempotent on already-DELETED) / 404 |

Dual-write model: **fulfilment is canonical** (option (e), p-101); every fulfilment lifecycle op
cascades to the notification *projection* when one exists (`notificationProjectionExists` logs+skips
otherwise). `FulfilmentService.findAll` runs a MongoTemplate **aggregation `$lookup`** joining
`fulfilment._id` → `notification.referenceNumber`, projecting display fields (commodity,
originCountryCode, arrivalDate, consignor/consignee names) into `FulfilmentPageResponse.Item`
(count + skip/limit pagination, tiebreak sort `_id asc`).

Errors: `exceptions/GlobalExceptionHandler.java` + typed exceptions (`BadRequestException` → 400,
`NotFoundException` → 404, `ConflictException` → 409, `ServiceUnavailableException`,
`OutboxWriteException` → 500).

## 4. Reference-number scheme — `notification/ReferenceNumberGenerator.java`

- Format: `GBN-AG-{YY}-{XXXXXX}` — e.g. `GBN-AG-26-4XKPMQ`. Validation regex constant
  `REFERENCE_NUMBER_PATTERN = "^GBN-AG-\\d{2}-[0-9A-HJ-KM-NP-TV-Z]{6}$"` (shared by both controllers).
- `YY` = two-digit current year; body = 6 chars of **Crockford base32**
  (`0123456789ABCDEFGHJKMNPQRSTVWXYZ` — excludes I, L, O, U) from a static `SecureRandom`.
- Generator is dumb (`@Component`, no persistence); **collision handling is caller-side**: unique
  index on the ref + save/insert in a loop catching `DuplicateKeyException`, `MAX_REF_RETRIES = 3`,
  then `IllegalStateException` (`NotificationService.createNotification`, `FulfilmentService.create`
  and `.copy` — copy additionally re-checks the idempotency key on collision).
- Plant-products sibling would presumably mint `GBN-PP-{YY}-{XXXXXX}` — the `AG` segment is the only
  commodity-specific part; pattern + generator are otherwise reusable verbatim.

## 5. House patterns to replicate

1. **Entity/DTO via shared abstract base** — `NotificationBase` (@Data @SuperBuilder abstract) +
   `Notification` (adds @Id/@Document/@JsonIgnore server-only fields) + `NotificationDto` (empty
   subclass). One place to add a field.
2. **Records at boundaries, Lombok classes in the domain** — API responses are Java records
   (`NotificationResponse` with `@Builder(toBuilder=true)`, `NotificationPageResponse`,
   `ReferenceNumberPageResponse`, `FulfilmentPageResponse` + nested `Item`, `ReplayResponse`);
   service-internal results are local records (`NotificationService.ReplaceResult`,
   `FulfilmentService.ReplaceResult`). **Compact-constructor null guards** on records at
   service/audit boundaries: `AuditContext` (`Objects.requireNonNull` both fields),
   `FulfilmentPageResponse` (`items = List.copyOf(items)` defensive copy). Domain model classes get
   NO guards (everything draft-nullable).
3. **Mapper layering** (three deliberate flavours, all in `notification/`):
   - `NotificationMapper` — MapStruct, `unmappedTargetPolicy = ERROR` + `unmappedSourcePolicy =
     ERROR` (compile-time break when a field is added but not wired), explicit
     `@BeanMapping(ignoreUnmappedSourceProperties=...)` for server-only fields; documents are
     assembled by the service after mapping (no @DBRef).
   - `NotificationContentSnapshotMapper` — MapStruct with `mappingControl = DeepClone.class` for
     the amend baseline capture/restore; normalises null lists to `List.of()`.
   - `NotificationCopyMapper` — deliberately **plain Java** `@Component` where retain/reset rules
     per field must be explicit and auditable (MapStruct rejected in its Javadoc rationale).
   - MapStruct processor configured in `pom.xml` with `-Amapstruct.defaultComponentModel=spring`
     (mappers are injectable beans; snapshot mapper uses `Mappers.getMapper` statically).
4. **Repository shape** — `MongoRepository<Entity, String>` + derived queries; interface-based
   projection for slim reads (`NotificationReferenceOnly { String getReferenceNumber(); }` used by
   list/delete/expiry paths); `@Query` JSON only when derived names can't express it (documented:
   `findExpired` `{'expireAt': {$ne: null, $lte: ?0}}`); MongoTemplate aggregation lives in the
   service (FulfilmentService), not the repository.
5. **Service shape** — constructor injection with `@Value` config params (page sizes, lock
   durations) as constructor args; `@Transactional` on multi-write ops; status-guard →
   `BadRequestException` before every transition; `writeWithOutbox` wraps save+outbox-append in a
   shedlock `LockingTaskExecutor` lock keyed `outbox-write:{aggregateId}`; audit record written for
   admin deletes.
6. **Sort parsing** — tiny final utility class with private ctor (`NotificationSort`,
   `FulfilmentSort`): whitelist switch of field names, default sort on any parse failure.
7. **Controller shape** — `@RestController` + `@RequestMapping(noun)` + `@Validated`;
   `@Pattern`-guarded path variables; OpenAPI `@Operation`/`@ApiResponse` on every method;
   Micrometer `@Timed("controller.<op>.time")` on every method; Location URIs built from
   `AppConfig.baseUrl()`.
8. **Package layout** — flat feature packages under the service root; controller, service,
   repository, entity, DTOs, mappers, enums all siblings in the one package (package-private access
   used e.g. `NotificationContentSnapshot.from`).

## 6. Test patterns

- **Units** (Surefire, `mvn test`): colocated per-package under
  `src/test/java/.../notification/` and `.../fulfilment/` — one test class per production class
  (`NotificationServiceTest`, `NotificationControllerTest`, `NotificationMapperTest`,
  `NotificationCopyMapperTest`, `NotificationSortTest`, `ReferenceNumberGeneratorTest`,
  `NotificationExpirySweeper[Condition]Test`, `FulfilmentServiceTest`, `FulfilmentControllerTest`,
  `FulfilmentSortTest`).
- **Integration** (`*IT`, Failsafe — **run only under `mvn verify`**, never `mvn test`): all under
  `src/test/java/.../integration/`, extending `integration/IntegrationBase.java` —
  `@SpringBootTest(RANDOM_PORT)` + `@ActiveProfiles("integration-test")`, three shared static
  Testcontainers started once in a static block (`Startables.deepStart`): MongoDB `mongo:7.0` with
  replica set (transactions work), a MockServer container for downstream HTTP stubbing
  (`usingStub()`), and an OAuth mock server; wired via `@DynamicPropertySource`; `@AfterEach`
  resets MockServer expectations. Full-stack ITs per aggregate: `NotificationIT`, `FulfilmentIT`,
  `NotificationProjectionIT`, `NotificationExpiryIT`, `outbox/ReplayIT`, `outbox/OutboxPollerIT`,
  `document/*IT`.
- Testcontainers 2.0.2 BOM + `testcontainers-mongodb`/`-mockserver`/`-junit-jupiter`/`-floci` in
  `pom.xml`; MapStruct 1.6.3 + lombok-mapstruct-binding annotation processing.
