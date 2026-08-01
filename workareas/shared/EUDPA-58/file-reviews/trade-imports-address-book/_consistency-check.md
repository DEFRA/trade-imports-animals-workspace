# Consistency Check: trade-imports-address-book

**Ticket:** EUDPA-58 (epic — Address Book)
**All repos in scope:** trade-imports-address-book *only* (`.review-meta.json` `scope_note`: "Scoped to trade-imports-address-book only; full PR set in .review-meta.full.json")
**PR:** #1 | **Commit:** 6f1134b

## Scope

This review is deliberately scoped to a **single repo**, so classic cross-repo
comparison (config keys, dependency bumps, peer-service parity) is **not
applicable** — the other five repos in `.review-meta.full.json`
(animals-frontend, ins-frontend, animals-backend, animals-tests,
animals-workspace) were excluded by instruction and their diffs were not
analysed for parity.

What *is* in scope, and what this document delivers, is **cross-file
consistency within the PR**: 82 files, 180 findings (11 Critical, 92 Major,
77 Minor), and the same handful of defects recur across many files. Every
theme below was raised independently by ≥2 per-file reviewers, which is the
signal that it is a design-level issue rather than a local slip.

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Any shared config key / dependency / structural pattern | Out of scope by instruction | — | N/A (SINGLE REPO) |
| Workspace stack registration (`docker/stack/*.compose.yml`, `scripts/stack/`) | animals-workspace ✅ registers all 8 existing services | ❌ `address-book` appears **nowhere** in the workspace repo (verified: `grep -ril address-book docker/ scripts/ Makefile` returns nothing) | INCONSISTENT — README documents an integration that does not exist |

That single row is the only genuinely cross-repo observation available, and it
is confirmed rather than inferred: the new service is not wired into the shared
stack, so `run-stack.sh` cannot start it, `-b`/`-d`/`-e` cannot pick it up, and
the README's "runs on port 8089 in the stack" is false. Either the workspace
repo needs an `address-book` service entry (a companion PR outside this review's
scope) or the README section must be withdrawn.

## Cross-File Consistency Themes

| # | Theme | Files affected | Worst severity |
|---|---|---|---|
| T1 | Locked contract contradicts the implementation field-for-field | 14 | Critical ×5 |
| T2 | The compliance gate is too narrow to catch T1 | 6 | Critical ×2 |
| T3 | `Operator*` vs `Address*` naming split for one resource | 9 | Minor (systemic) |
| T4 | Package-rename residue leaves live code unwired | 4 | Critical ×1 |
| T5 | Org-scoping enforcement split across filter + controller, with asymmetric tests | 7 | Critical ×1 |
| T6 | No `@Version` — read-modify-write is last-write-wins | 5 | Major |
| T7 | No `@EnableScheduling` — the whole EMF path is dead | 3 | Critical ×1 |
| T8 | No `@Schema` on any DTO — published contract has no `required`, no descriptions | 5 | Major |
| T9 | Test-convention drift (Given/When/Then, `{subject}_{shouldDoWhat}`) | 8 | Minor (systemic) |
| T10 | `OperatorCrudIT` duplicates the four `Address*IT` classes | 3 | Major |
| T11 | Mongo auditing silently overwrites hand-set fixture timestamps | 3 | Minor |
| T12 | Dev/hot-reload tooling is unreachable | 3 | Major |

---

### T1 — Contract-vs-implementation drift (the headline cluster)

**Files:** `docs/openapi/api-contract.locked.yaml`, `docs/openapi/operators.yml`,
`OperatorResponse.java`, `OperatorPageResponse.java`, `OperatorController.java`,
`JacksonConfig.java`, `OpenApiConfig.java`, `GlobalExceptionHandler.java`,
`Problem.java`, `ValidationProblem.java`, `AddressRequest.java`, `README.md`,
`AddressGetIT.java`, `OperatorListIT.java`

This PR commits **two contract documents that disagree with each other and with
the code**, and 14 independent per-file reviewers each hit the same wall from a
different direction. Consolidated, the divergence is total, not marginal:

| Dimension | `api-contract.locked.yaml` (declared source of truth) | Shipped code + generated `operators.yml` |
|---|---|---|
| Property casing | snake_case throughout (`address_line_1`, `created_at`, `organisation_id`, `trace_id`, `page_size`, `total_items`) | camelCase (`addressLine1`, `createdAt`, `organisationId`, `traceId`, `pageSize`, `totalItems`) — forced by `JacksonConfig` `LOWER_CAMEL_CASE` |
| Identity header | `Trade-Imports-Crn` as `securityScheme`, "required on every request"; organisation-id "required on POST only", "NOT used for read filtering" | No CRN anywhere. `IdentityHeaderFilter` requires `Trade-Imports-Organisation-Id` on **every** `/organisation/**` request and reads are org-scoped |
| Soft delete | `status` enum `ACTIVE`/`DELETED` | derived `deleted` boolean |
| Address fields | `town`, `county`, `country`, `telephone` | `townOrCity`, `county`, `countryCode`, `phone` |
| Country semantics | D1: "MDM **display-name** string, NOT ISO 3166-1 alpha-2 — do not silently 'fix' it" | `countryCode` carrying ISO alpha-2 (`GB`), and `?countryCode=` is the list filter |
| Typed operator fields | `operator_type`, `transporter_category`, `crn`, `approval_number` all required/present | none exist — `OperatorComplianceIT` explicitly asserts their **absence** |
| List params | `operator_type` (enum), `page_size` (1–100, default 25) | `page`, `q`, `countryCode`; `OperatorListIT` pins `page_size` as an **ignored unknown param** |
| Error body | `trace_id`; errors map keyed by "snake_case wire name (`address_line_1`, never `addressLine1`)" | `traceId`; errors keyed `addressLine1` |
| Metadata | title `trade-imports-address-book`, version `1.0.0`, `servers` block | springdoc defaults `OpenAPI definition` / `v0`, no `servers` |
| Validity | Invalid OpenAPI 3.0 — `{orgId}` templated but never declared as a parameter | valid |

The locked file is not merely stale — it is **actively misleading**. Its
"Declared deviations" section instructs the next developer to revert implemented
behaviour (D1 on country), and its preamble still says "this file lives under
`workareas/`, which is gitignored" while sitting committed at `docs/openapi/`.
Its `Location` example, its tag (`operators` vs the controller's `addresses`)
and its operationIds are all pre-rename artefacts.

**Consistency verdict:** this is one decision, not fifteen fixes. Somebody must
rule which document is the contract. Either (a) regenerate/rewrite
`api-contract.locked.yaml` to the shipped camelCase model and record the ruling
that superseded the snake_case lock, or (b) delete it and let the generated
`operators.yml` be the artefact. Fixing the fourteen sites individually without
that ruling will produce a fourteenth inconsistency.

Note the second-order effect: several *tests* have now cemented the drift. The
implementation-side naming is pinned by `AddressGetIT` (`$.countryCode`,
`$.organisationId`, `$.deleted`), `OperatorListIT` (`$.pageSize`,
`$.totalItems`, `$.totalPages`, plus an explicit test that `page_size` is
ignored) and `OperatorComplianceIT`'s camelCase regex sweep. Whichever way the
ruling goes, tests move with it.

### T2 — The gate that was supposed to prevent T1

**Files:** `OperatorComplianceIT.java`, `OpenApiConfig.java`,
`api-contract.locked.yaml`, `JacksonConfig.java`, `OperatorPageResponse.java`,
`GlobalExceptionHandler.java`

Six reviewers independently identified the same root cause for why T1 shipped
green: `OperatorComplianceIT.apiDocsMatchTheCommittedArtifactAndTheLockedContract`
compares **only** path keys, HTTP-method keys, operationIds and the 400 `anyOf`.
It never reads `components.schemas`, `parameters`, response status codes,
headers or `info`. Every divergence in the table above is therefore invisible.

What compounds this into a consistency problem rather than a coverage gap is
that **three separate places overclaim what the gate does**:

- `api-contract.locked.yaml` preamble — "OperatorComplianceIT plus a CI diff check keep it honest".
- `OpenApiConfig` Javadoc — the ModelResolver stops "the exact divergence OperatorComplianceIT fails the build on".
- `OperatorComplianceIT` Javadoc — the live doc is "surface-equivalent to the lock", and "real requests prove the boundary is camelCase" (they are MockMvc, not real HTTP over the RANDOM_PORT server).

Two of the IT's own assertions are self-referential: the camelCase sweep
enumerates schemas from the **live** doc (generated from the implementation's
own Jackson naming) and asserts they look camelCase; `assertAnyOfProblem(locked, …)`
asserts the committed YAML against itself. Neither can fail on an implementation
change. And `-Dopenapi.generate=true` returns before *any* assertion, so both
gates vanish on a green build if that flag ever leaks into a CI profile — which
the README documents as a normal command.

Whatever ruling resolves T1, the gate must be widened (schema-name set equality,
per-schema property-key sets, operation parameter names, status-code sets) or
the three claims must be downgraded to what is actually enforced.

### T3 — `Operator*` vs `Address*` naming split

**Files:** `OperatorController`, `OperatorService`, `OperatorRepository`,
`OperatorMapper`, `OperatorResponse`, `OperatorPageResponse`, plus
`OperatorCrudIT`, `OperatorListIT`, `OperatorIndexIT`, `OperatorRepositoryIT`,
`OperatorComplianceIT` — against `Address`, `AddressRequest`, `AddressStatus`,
`AddressGetIT`, `AddressUpdateIT`, `AddressDeleteIT`, `AddressSearchIT`,
`AddressScopingIT`

One resource carries two names throughout, and the split is not along any
principled line — the entity, request record and status enum are `Address*`
while the controller, service, repository, mapper and both response records are
`Operator*`. It leaks into the published contract: operationIds mix
`list-operators`/`create-operator` with `get-address`/`update-address`/
`delete-address`, the OpenAPI tag says `operators` while the controller declares
`addresses`, the generated artefact is named `operators.yml`, and the path
template mixes camelCase `{orgId}` with kebab-case `{operator-id}` in the same
mapping. `OperatorCrudIT`'s Javadoc still says it tests `/operators`, a route
that does not exist.

This is cosmetic in isolation but consequential here for one reason:
`OperatorComplianceIT` **locks the operationIds**, so shipping makes the
inconsistency permanent and any later tidy-up becomes a contract-breaking
change. Settle on one noun before merge, not after.

### T4 — Package-rename residue

**Files:** `RestClientConfig.java` (deleted), `TraceIdPropagationInterceptor.java`,
`TraceIdPropagationInterceptorTest.java`, `LoggingConfig.java`, `MetricsConfig.java`,
`application.yml`, `MetricsConfigurationPropertiesTest.java`

The PR renames `uk.gov.defra.trade.imports.address.book` →
`…addressbook` and deletes the Example scaffold. Four consequences slipped
through:

- Deleting `RestClientConfig` removed the **only** registration of
  `TraceIdPropagationInterceptor`. The interceptor survives as an orphaned
  `@Component` whose Javadoc still claims it adds `x-cdp-request-id` to every
  outbound call — it now adds it to none. Its 6 unit tests call `intercept()`
  directly, so the suite stays green while the CDP tracing requirement is
  silently unenforced. The 10s connect / 30s read timeouts went with it.
- `LoggingConfig` is a no-op: it sets a JVM system property `service.version`
  that nothing reads (`logback-spring.xml` uses `<springProperty … source="cdp.service-version"/>`,
  which shadows it), from `@PostConstruct`, long after Logback initialises.
- `application.yml` — correcting the logger key from the *non-existent*
  `…address.book` package to the real `…addressbook` **activates a previously
  inert DEBUG default**. Every environment that does not set `LOG_LEVEL` now
  logs the whole application package at DEBUG. This is the most likely
  production surprise in the PR and it looks like a harmless rename fix.
- `MetricsConfig` carries 17 unused imports through the rename;
  `MetricsConfigurationPropertiesTest` names a class that does not exist and
  actually tests `EmfMetricsPublisher`.

### T5 — Org-scoping: split enforcement, asymmetric tests

**Files:** `IdentityHeaderFilter`, `OperatorController`, `OperatorRepository`,
`AddressScopingIT`, `AddressDeleteIT`, `AddressSearchIT`, `OperatorRepositoryIT`

The tenant guard is implemented in **three** places with no single chokepoint,
and the tests cover each place unevenly:

1. `IdentityHeaderFilter` proves the header is *present*, gated on the raw
   string test `getRequestURI().startsWith("/organisation")` — which fails
   **open** under a `server.servlet.context-path`, a path-prefix mount or any
   ingress path rewrite, and over-matches `/organisation-summary`.
2. The actual cross-tenant check (header value == path `orgId`) is hand-repeated
   as the first line of all five controller handlers via `authoriseOrg`. It is
   opt-in per method — a future handler that forgets it gets zero protection and
   nothing fails. `AddressScopingIT` covers GET/list/PUT/POST but **not DELETE**,
   so removing `authoriseOrg` from `delete()` lets org B soft-delete org A's
   address with the whole suite green.
3. `'organisationId': ?0` inside the two hand-written `@Query` strings
   (`searchByCountryCode`, `searchByQueryAndCountryCode`) — compiler-invisible,
   and exercised with cross-org data **nowhere**. `AddressSearchIT` seeds
   `OTHER_ORG` only on the q-only path; `OperatorRepositoryIT` only covers the
   derived `findByIdAndOrganisationId`. Deleting the org lead from either query
   leaks every organisation's addresses with no test failing. The same one-of-three
   gap applies to the literal `'status': 'ACTIVE'` clause, so a country-filtered
   search could resurface tombstones untested.

Above all of it sits the Critical: **nothing establishes the trust boundary** for
`Trade-Imports-Organisation-Id`. No Spring Security, no `SecurityFilterChain`, no
gateway/ingress config, no documented upstream that strips inbound copies. Any
caller who can reach the service can read, create, amend or delete any
organisation's address PII by setting one header. That boundary and its owner
need recording before this ships.

Two smaller notes in the same theme: `OperatorRepository extends MongoRepository`
publishes unscoped id-only CRUD (`findById`, `deleteById`, `findAll`,
`deleteAll`) beside the scoped finders, so the class Javadoc's tenant guarantee
is a convention rather than a constraint; and the `organisationId`/`status`
smuggling guard is asserted only by two vacuous assertions in `OperatorMapperTest`
(the JSON body under test carries neither key, so both assertions are
unfalsifiable).

### T6 — No `@Version`: last-write-wins on every mutation

**Files:** `Address.java`, `MongoConfig.java`, `AddressDeleteIT`,
`AddressUpdateIT`, `OperatorService`

`MongoConfig` adds `@EnableMongoAuditing` (turning on `@CreatedDate`/
`@LastModifiedDate`) but not optimistic locking, and `Address` has no `@Version`.
`OperatorService.update()` and `delete()` are both unguarded read-modify-write
with a whole-document `repository.save()`. Two overlapping PUTs silently lose
one edit; a PUT that loaded an ACTIVE document before a concurrent DELETE
commits writes `status=ACTIVE` back and **resurrects the tombstone**. Three
reviewers reached this independently from the entity, the config and the two
ITs. There is no concurrency test anywhere in the repo (no `@Version`, no
`ExecutorService`/`CountDownLatch` in `src/`), so the whole class of defect is
structurally untestable as written.

### T7 — No `@EnableScheduling`: the EMF path never runs

**Files:** `EmfMetricsPublisher`, `MetricsConfig`, `MetricsConfigurationPropertiesTest`

`@EnableScheduling` appears nowhere in the repo. `Application` carries only
`@SpringBootApplication` + `@EnableConfigurationProperties`, so Spring never
registers a `ScheduledAnnotationBeanPostProcessor` and
`@Scheduled(fixedRate = 60000) publishMetrics()` never fires. No production code
calls it — only tests do. The whole EMF publication path is dead despite the
`aws.emf.*` config and the CDP CloudWatch endpoint being wired up.
`MetricsConfigurationPropertiesTest` asserts the *annotation exists*, which is
exactly the test that lets this pass. Three further latent defects sit behind it
and become live the moment scheduling is switched on: tags and `Statistic` are
discarded (all Timer COUNT/TOTAL_TIME/MAX collapse into one key, eight
differently-tagged `jvm.memory.used` meters merge into one series), an unguarded
`putMetric()` aborts the entire cycle on the first NaN gauge, and the publisher
destructively strips `controller*` meters from the shared registry every 60s
(wiping them from actuator `/metrics` and leaving mixed delta-vs-cumulative
semantics). `OperatorService`'s `OperatorListQuery` timer is PascalCase, so it
misses that `startsWith("controller")` reset and its cumulative totals are
re-emitted every cycle.

### T8 — No `@Schema` on any DTO

**Files:** `AddressRequest`, `OperatorResponse`, `OperatorPageResponse`,
`Problem`, `ValidationProblem`

Not one record in the PR carries `@Schema`, and the effect is uniform: the
published `operators.yml` has no descriptions, no examples and — critically — no
`required` list anywhere. All 14 `OperatorResponse` fields generate as optional
despite 11 being null-guarded in the compact constructor; `ValidationProblem`
does not require `errors`, which makes the two 400 `anyOf` branches structurally
identical open objects and defeats the anyOf-not-oneOf rationale the design
leans on. `AddressRequest` publishes `type` and `role` as ordinary optional
properties while the record annotates both `@Null`, so a consumer following the
contract sends them and gets a 400. Every 2xx response is published under `*/*`
rather than `application/json`, and the POST/PUT 400 schema emits
`type: string` alongside the `anyOf` — so generated clients type the problem
body as `String`. `OpenApiConfig` declares no `@OpenAPIDefinition`, leaving
`title: OpenAPI definition` / `version: v0` / no `servers`. This is a single
consistent omission with a compounding effect on a contract the README
advertises "for downstream consumers".

### T9 — Test-convention drift

**Files:** `OperatorServiceTest`, `GlobalExceptionHandlerTest`,
`IdentityHeaderFilterTest`, `AddressDeleteIT`, `OperatorCrudIT`, `OperatorIndexIT`,
`OperatorListIT` (and by contrast `OperatorMapperTest`, which does comply)

The bundled Java testing guides mandate `{subject}_{shouldDoWhat}[_{whenContext}]`
naming and explicit `// Given` / `// When` / `// Then` blocks. Seven of the new
test classes use free-form sentence names with no GWT blocks; `OperatorMapperTest`
in the *same package* follows the convention, so two files side by side read
differently. Low severity individually, but it is the single most-repeated
finding in the PR and worth fixing in one sweep rather than piecemeal.

### T10 — `OperatorCrudIT` duplicates the four `Address*IT` classes

**Files:** `OperatorCrudIT`, `AddressUpdateIT`, `AddressGetIT`, `AddressScopingIT`

Roughly two thirds of `OperatorCrudIT` re-tests, verbatim, behaviour that sibling
ITs added in the same PR already cover: its GET trio duplicates `AddressGetIT`,
its PUT trio duplicates `AddressUpdateIT`, its DELETE pair duplicates
`AddressDeleteIT`, its missing-header test duplicates `AddressScopingIT`, and its
validation test duplicates `OperatorComplianceIT`. `AddressGetIT`'s
`getCrossOrgIdReturns404IdenticalToUnknownId` is likewise a near-verbatim
duplicate of `AddressScopingIT`'s equivalent, including a copy of the
`problemWithoutInstance` helper — and only one of the two copies carries the
comment explaining why `instance` is excluded. Each duplicate is a second
Testcontainers round trip and a second place to update when the contract moves;
several duplicates already assert *less* than their twin. Pick one home per
endpoint.

### T11 — Auditing overwrites hand-set fixture timestamps

**Files:** `AddressDeleteIT`, `AddressSearchIT`, `OperatorListIT` (consequence)

`saveActive()`/`save()` helpers set `.createdAt(…)`/`.modifiedAt(…)` on seeded
`Address` builders, but with `@EnableMongoAuditing` + `@CreatedDate`/
`@LastModifiedDate` Spring Data overwrites both with `now()` on insert. Those
builder lines have no effect and mislead the reader into thinking the fixture
controls the `createdAt` sort key. It matters beyond tidiness: `OperatorService`
sorts by `createdAt DESC` **only**, and 30 rows saved in a loop all get
millisecond-precision `Instant.now()` stamps, so ties are expected and
Mongo `skip`/`limit` over a non-unique sort has no stable ordering — a document
can appear on both pages or neither. `AddressSearchIT`'s and `OperatorListIT`'s
pagination tests assert only sizes and counts, never disjointness or coverage,
so both a latent flake and a real pagination defect are masked.

### T12 — Dev/hot-reload tooling is unreachable

**Files:** `Dockerfile`, `docker/dev-run.sh`, `compose.yml`, `README.md`

The new `dev-run` Dockerfile stage is unreachable: `compose.yml` uses `build: ./`
with no `target: dev-run` and no `./src:/app/src` bind mount, and the workspace
stack has no address-book service at all (see the cross-repo row above). Inside
the script the DevTools trigger-file mechanism its own header comment describes
is inert — `spring.devtools.restart.trigger-file` is set nowhere in the repo —
so DevTools restarts on the first `.class` the background `mvn compile` writes,
possibly mid-compile, and the trigger `touch` then causes a second redundant
restart. `-Dspring-boot.run.profiles=local` is hard-coded and, as a command-line
argument, silently overrides any `SPRING_PROFILES_ACTIVE` the compose file or
run-stack sets. The README then documents
`bounce-backend.sh trade-imports-address-book`, but that script hardcodes
`trade-imports-animals-backend` and ignores `$@`.

## Missing Changes

Cross-repo "missing change" analysis is not available under the single-repo
scope. One boundary item is nonetheless confirmed:

- **Workspace stack registration** — `trade-imports-address-book` is absent from
  `docker/stack/*.compose.yml`, `scripts/stack/` and the Makefile in
  `trade-imports-animals-workspace`. The README section "Workspace stack
  (recommended)" documents port 8089, `-b`/`-d`/`-e` support and a bounce script
  that all presuppose a registration that has not been made. Either the
  companion workspace PR is missing from this PR set or the README must be cut
  back to `compose.yml`-only instructions.

Within the repo, the following are missing relative to what the PR's own
documents and Javadoc promise:

- `@EnableScheduling` (T7) — promised by `MetricsConfig`, `EmfMetricsPublisher` and the `aws.emf.*` config.
- Re-registration of `TraceIdPropagationInterceptor` (T4) — promised by its Javadoc and the `cdp.tracing.header-name` property.
- `@Version` on `Address` (T6) — implied by the tombstone/soft-delete design.
- Schema-level assertions in `OperatorComplianceIT` (T2) — promised by three separate Javadoc/preamble claims.
- A DELETE case in `AddressScopingIT` (T5) — the only `authoriseOrg` call site with no test.
- Cross-org and tombstone cases for the two raw `@Query` methods (T5).
- A malformed-JSON-body case (`HttpMessageNotReadableException` → 500 not 400) in both `GlobalExceptionHandlerTest` and `OperatorCrudIT`.

## Unique Changes

Everything in this PR is unique — it is the initial build-out of a new service,
so there is no peer to compare against. Two structural choices are worth
flagging as intentional-but-unreconciled rather than suspicious:

- **camelCase at the HTTP boundary** (`JacksonConfig`). Deliberate, tested and
  documented in the code's own Javadoc — but it contradicts both
  `api-contract.locked.yaml` and `docs/best-practices/rest-api/rest-api.md`
  ("snake_case for properties"; "Don't: camelCase in JSON"). If camelCase is the
  team's ruling it needs recording as an accepted deviation, not left as an
  undocumented contradiction of two written standards.
- **`countryCode` as ISO alpha-2** (`OperatorResponse`, `AddressRequest`,
  `OperatorRepository`). This directly reverses declared deviation D1 of the
  locked contract, which rules `country` is an MDM display-name string and
  instructs reviewers not to "fix" it. It is a value-semantics change, not a
  rename — a consumer rendering the address gets `GB` where the contract
  promises `United Kingdom`, and D1 records that no code-to-name conversion
  exists anywhere in the epic. Meanwhile `countryCode` carries `@NotBlank` only,
  and `AddressRequestValidationTest` actively pins a 300-character value as
  valid.

## Verdict

**Status:** SINGLE REPO (N/A for cross-repo) — INCONSISTENCIES FOUND within the repo
**Issues:** 12 cross-file consistency themes; 1 confirmed cross-repo gap (workspace stack registration)
**Summary:** Cross-repo comparison is out of scope, but the PR is internally inconsistent in one dominant way — it ships two committed contract documents that disagree with each other and with the code on casing, identity header, soft-delete representation, field names, country semantics and list parameters, guarded by a compliance gate that compares only paths, methods and operationIds and by three Javadoc claims that overstate what that gate enforces; resolving it needs a single ruling on which document is the contract, not fourteen local fixes.
