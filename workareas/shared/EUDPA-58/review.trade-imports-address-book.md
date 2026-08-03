# Repository Review: trade-imports-address-book

**PR:** #1
**Commit:** bbf547c
**Reviewed:** 2026-08-01
**Refreshed:** 2026-08-03 (`6ae0c82` → `bbf547c`)
**Verdict:** NEEDS MORE WORK

## Summary

Tip `bbf547c` closed most of the prior open Majors: locked contract minLength /
Problem `required`, 409 coverage (unit + IT + OpenAPI), `updateEntity` test,
town/postcode search ITs, and compliance-gate hardening.

**Still open (4 Major + 2 Minor):** Relative Location (#188 — create now uses
`UriComponentsBuilder.fromPath`), stale AddressRequest countryCode Javadoc (#189),
springdoc comment vs `enabled: false` (#193), EMF NaN-skip assertion (#199), plus
new Minors #200 (ProxySelector cleanup) and #201 (addressLine1 search exclusion).

## Refresh Summary (2026-08-03)

**Files refreshed:** 14 (List A) + 3 real List D coverage gaps  
**New items added:** 2 (#200, #201)  
**Auto-resolved this pass:** 8 (#185–186, #190–192, #196–198)

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `.github/workflows/check-pull-request.yml` | SAFE | 0 | 0 | 0 |
| `.github/workflows/publish-branch.yml` | NEEDS ATTENTION | 0 | 2 | 0 |
| `.github/workflows/sonarcloud.yml` | SAFE | 0 | 0 | 0 |
| `Dockerfile` | NEEDS ATTENTION | 0 | 1 | 1 |
| `README.md` | NEEDS ATTENTION | 0 | 1 | 4 |
| `compose.yml` | SAFE | 0 | 0 | 0 |
| `docker/dev-run.sh` | NEEDS ATTENTION | 0 | 3 | 1 |
| `docs/openapi/api-contract.locked.yaml` | RISKY | 2 | 4 | 1 |
| `docs/openapi/operators.yml` | RISKY | 2 | 4 | 2 |
| `pom.xml` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/configuration/FeignLoggingConfig.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/configuration/RestClientConfig.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/controller/ExampleController.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/domain/Example.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/domain/repository/ExampleRepository.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/exceptions/ConflictException.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/exceptions/GlobalExceptionHandler.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/address/book/service/ExampleService.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/Application.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/Address.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/AddressRequest.java` | NEEDS ATTENTION | 0 | 2 | 2 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/AddressStatus.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorController.java` | SAFE | 0 | 0 | 5 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorMapper.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorPageResponse.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorRepository.java` | NEEDS ATTENTION | 0 | 2 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorResponse.java` | RISKY | 1 | 2 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorService.java` | NEEDS ATTENTION | 0 | 3 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/AwsConfig.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/JacksonConfig.java` | RISKY | 1 | 0 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/LoggingConfig.java` | NEEDS ATTENTION | 0 | 1 | 3 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/MetricsConfig.java` | NEEDS ATTENTION | 0 | 1 | 2 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/MongoConfig.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/OpenApiConfig.java` | RISKY | 1 | 2 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/ProxyConfig.java` | NEEDS ATTENTION | 0 | 3 | 4 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/tls/CertificateLoader.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/configuration/tls/TrustStoreConfiguration.java` | NEEDS ATTENTION | 0 | 1 | 4 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/exceptions/BadRequestException.java` | SAFE | 0 | 0 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/exceptions/GlobalExceptionHandler.java` | RISKY | 1 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/exceptions/NotFoundException.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/exceptions/Problem.java` | NEEDS ATTENTION | 0 | 2 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/exceptions/ValidationProblem.java` | NEEDS ATTENTION | 0 | 2 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/filter/HealthCheckFilter.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/filter/IdentityHeaderFilter.java` | RISKY | 1 | 3 | 3 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/filter/RequestTracingFilter.java` | SAFE | 0 | 0 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/interceptor/TraceIdPropagationInterceptor.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/addressbook/service/EmfMetricsPublisher.java` | RISKY | 1 | 3 | 3 |
| `src/main/resources/application-local.yml` | SAFE | 0 | 0 | 0 |
| `src/main/resources/application.yml` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/main/resources/logback-spring.xml` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/address/book/controller/ExampleControllerTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/address/book/exceptions/GlobalExceptionHandlerTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/address/book/integration/ExampleComplianceIT.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/address/book/integration/IntegrationBase.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/address/book/service/ExampleServiceTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/address/AddressRequestValidationTest.java` | NEEDS ATTENTION | 0 | 3 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/address/OperatorMapperTest.java` | NEEDS ATTENTION | 0 | 3 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/address/OperatorServiceTest.java` | NEEDS ATTENTION | 0 | 2 | 4 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/configuration/MetricsConfigTest.java` | SAFE | 0 | 0 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/configuration/MetricsConfigurationPropertiesTest.java` | SAFE | 0 | 0 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/configuration/tls/CertificateLoaderTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/exceptions/GlobalExceptionHandlerTest.java` | NEEDS ATTENTION | 0 | 2 | 3 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/filter/IdentityHeaderFilterTest.java` | NEEDS ATTENTION | 0 | 2 | 2 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressDeleteIT.java` | NEEDS ATTENTION | 0 | 2 | 4 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressGetIT.java` | NEEDS ATTENTION | 0 | 3 | 2 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressScopingIT.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java` | NEEDS ATTENTION | 0 | 5 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressUpdateIT.java` | NEEDS ATTENTION | 0 | 3 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/EcsLoggingIT.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/HealthCheckConfigIT.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/IntegrationBase.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/MongoConfigIT.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/OperatorComplianceIT.java` | RISKY | 1 | 5 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/OperatorCrudIT.java` | NEEDS ATTENTION | 0 | 2 | 5 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/OperatorIndexIT.java` | NEEDS ATTENTION | 0 | 2 | 3 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/OperatorListIT.java` | NEEDS ATTENTION | 0 | 4 | 2 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/OperatorRepositoryIT.java` | NEEDS ATTENTION | 0 | 2 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/ProxyConfigIT.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/integration/TrustStoreConfigurationIT.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/interceptor/TraceIdPropagationInterceptorTest.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/addressbook/service/EmfMetricsPublisherTest.java` | SAFE | 0 | 0 | 1 |
| `src/test/resources/application-integration-test.yml` | SAFE | 0 | 0 | 0 |

**File verdict spread:** 36 SAFE · 37 NEEDS ATTENTION · 9 RISKY

## Positive Observations

- **Endpoint-per-class integration testing.** `AddressGetIT`, `AddressUpdateIT`,
  `AddressDeleteIT`, `AddressSearchIT`, `AddressScopingIT` and `OperatorListIT`
  each own an endpoint and run against a real Mongo via Testcontainers, rather
  than mocking the repository. Assertions go through JSONPath on the wire body,
  so they pin the actual contract shape.
- **Cross-tenant behaviour is treated as a first-class case.** `AddressScopingIT`
  asserts that a cross-org `GET` returns 404 identical to an unknown id — the
  right call (no existence oracle), and explicitly tested rather than assumed.
- **Field smuggling is guarded at the mapper.** `AddressRequest` annotates
  server-owned fields `@Null` and `OperatorMapper` refuses to carry
  `organisationId`/`status` from the request body.
- **Consistent RFC 7807 problem responses** via `Problem`/`ValidationProblem`
  and a single `GlobalExceptionHandler`, with `instance` and a trace id — not
  ad-hoc error maps per handler.
- **A compliance IT exists at all.** `OperatorComplianceIT` is the right idea in
  the right place; the finding against it is that its comparison is too narrow,
  not that the concept is wrong.
- **Soft delete via tombstone + `status`**, with reads filtered, rather than
  hard deletes — appropriate for address PII with downstream references.

## Test Coverage

- **Unit tests:** Good breadth. `OperatorServiceTest`, `OperatorMapperTest`,
  `GlobalExceptionHandlerTest`, `IdentityHeaderFilterTest`,
  `AddressRequestValidationTest`, `TraceIdPropagationInterceptorTest`. Two
  specific weaknesses: `OperatorMapperTest`'s two smuggling assertions are
  vacuous (the JSON under test carries neither key, so neither can fail), and
  `TraceIdPropagationInterceptorTest` calls `intercept()` directly, so it stays
  green even though the interceptor is registered nowhere.
- **Integration tests:** Strong per-endpoint coverage via Testcontainers, but
  with named gaps rather than uniform depth — no DELETE case in
  `AddressScopingIT` (the one `authoriseOrg` call site with no test), no
  cross-org or tombstone case for the two hand-written `@Query` methods, no
  malformed-JSON-body case, and no concurrency test anywhere in the repo.
  `OperatorCrudIT` duplicates roughly two thirds of four sibling ITs, several
  times asserting less than its twin.
- **Structural gap:** pagination tests assert sizes and counts but never
  disjointness or coverage, which masks a real non-unique-sort defect
  (`createdAt DESC` only, ties expected).

## Risk Assessment

**Overall Risk:** High
**Rationale:** An unestablished trust boundary on the org-scoping header exposes
all address PII to any caller that can reach the service, and the published
contract does not describe the API that was built.

## Items

6 open findings: 4 Major · 2 Minor. Closed findings are archived in
`items.trade-imports-address-book.closed-archive.json` (not shown here).
This table is a rendered view of `items.trade-imports-address-book.json`.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 188 | docs/openapi/operators.yml | 209 | Major | location-header | New Location header block (POST 201) documents the header as a 'Relative URI', but a relative URI in Location on 201 Created is non-conformant with RFC 9110; the doc now faithfully exposes a real defect in OperatorController.create, which builds the header via URI.create(...) instead of an absolute URI | Fix OperatorController.create to build an absolute Location URI via ServletUriComponentsBuilder.fromCurrentRequest(), then update the header description here to 'Absolute URI of the created address' and regenerate with -Dopenapi.generate=true |  |  |  |
| 189 | src/main/java/uk/gov/defra/trade/imports/addressbook/address/AddressRequest.java | 28 | Major | documentation | The class Javadoc still claims countryCode has 'no length ... check' (cv-011) but this diff adds @Size(max = 2), so the documented contract is now false and contradicts Address.java's correct cv-011 description (ISO 3166-1 alpha-2) | Update the Javadoc to state countryCode is capped at 2 characters (ISO 3166-1 alpha-2, cv-011) with no list check, matching Address.java's wording |  |  |  |
| 193 | src/main/resources/application.yml | 104 | Major | stale-comment | The comment above the new springdoc block says '/v3/api-docs stays enabled everywhere', but the code directly below it sets api-docs.enabled: false in the base config (it's now only re-enabled via application-local.yml and application-integration-test.yml overrides) -- the comment now says the opposite of what the code does. | Rewrite the comment to describe the actual behaviour: api-docs and swagger-ui are both disabled by default in application.yml and explicitly re-enabled per-profile in application-local.yml (local dev) and application-integration-test.yml (OperatorComplianceIT). |  |  |  |
| 199 | src/test/java/uk/gov/defra/trade/imports/addressbook/service/EmfMetricsPublisherTest.java | 50 | Major | test-quality | publishMetrics_shouldSkipNonFiniteValues sets up one finite and one NaN measurement but its only assertion is verify(mockMeter).measure() — this passes identically even if the isFinite check in EmfMetricsPublisher.publishMetrics is deleted, so the test does not actually verify that NaN values are skipped | Assert the skip behaviour directly, e.g. extract the finite-value filter into a small package-visible/static method (or inject a mockable metrics sink so putMetric can be verified as called once with the finite metric key and never with the NaN one) |  |  |  |
| 200 | src/test/java/uk/gov/defra/trade/imports/addressbook/configuration/ProxyConfigTest.java | 21 | Minor | test-isolation | @AfterEach cleanup calls ProxySelector.setDefault(ProxySelector.getDefault()), which is a no-op and leaves the selector installed by configureProxy_validUrl / proxySelector_bypassesLocalhost in place for later tests in the JVM. | Capture ProxySelector.getDefault() in a field before configureProxy mutates it, and restore that saved selector in @AfterEach. |  |  |  |
| 201 | src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java | 66 | Minor | test-coverage | Town/postcode q-match ITs were restored, but nothing still asserts that q does not match addressLine1-only hits (the exclusion half of prior item 196). | Seed an addressLine1-only hit (e.g. addressLine1 'Green Lane') alongside town/postcode matches and assert it is absent from q=green results. |  |  |  |

## Cross-File Themes

Full analysis in
[`file-reviews/trade-imports-address-book/_consistency-check.md`](file-reviews/trade-imports-address-book/_consistency-check.md).
Twelve themes, each raised independently by 2+ per-file reviewers:

| # | Theme | Files | Worst |
|---|---|---|---|
| T1 | Locked contract contradicts the implementation field-for-field | 14 | Critical ×5 |
| T2 | The compliance gate is too narrow to catch T1 | 6 | Critical ×2 |
| T3 | `Operator*` vs `Address*` naming split for one resource | 9 | Minor (systemic) |
| T4 | Package-rename residue leaves live code unwired | 4 | Critical ×1 |
| T5 | Org-scoping split across filter + controller, asymmetric tests | 7 | Critical ×1 |
| T6 | No `@Version` — read-modify-write is last-write-wins | 5 | Major |
| T7 | No `@EnableScheduling` — the whole EMF path is dead | 3 | Critical ×1 |
| T8 | No `@Schema` on any DTO — no `required`, no descriptions | 5 | Major |
| T9 | Test-convention drift (Given/When/Then, naming) | 8 | Minor (systemic) |
| T10 | `OperatorCrudIT` duplicates the four `Address*IT` classes | 3 | Major |
| T11 | Mongo auditing silently overwrites fixture timestamps | 3 | Minor |
| T12 | Dev/hot-reload tooling is unreachable | 3 | Major |

**One confirmed cross-repo gap:** `trade-imports-address-book` appears nowhere in
the workspace repo's `docker/`, `scripts/` or `Makefile`. The README's entire
"Workspace stack (recommended)" section — port 8089, `-b`/`-d`/`-e`,
`bounce-backend.sh` — documents an integration that does not exist. Either a
companion workspace PR is missing from this PR set, or the section must be
withdrawn.

**Sleeper worth calling out:** T4 — correcting the `application.yml` logger key
from the non-existent `…address.book` package to the real `…addressbook`
*activates a previously inert DEBUG default*. Every environment not setting
`LOG_LEVEL` now logs the whole application package at DEBUG. It reads as a
harmless rename fix.

## Refresh Summary (2026-08-03)

Re-reviewed the developer fix window `6f1134b` → `87f2f7b` (42 changed files
in List A; List D ghost `address/book` paths skipped — package rename only).

**Files refreshed:** 42 (+ earlier batch from this window)
**New items added:** 17 (#183–#199)
**Auto-resolved:** 78 (including 10 of 11 prior Criticals)
**Spot-check (Fix+Done regressions):** 0

| # | Change | File:Line | Severity | Issue |
|---|--------|-----------|----------|-------|
| 1 | ➕ New | `README.md:44` | Major | bounce-backend fix now documents recreate of a non-existent stack service (#184) |
| 2 | ➕ New | `api-contract.locked.yaml:257` | Major | required @NotBlank fields dropped to minLength:0 (#185) |
| 3 | ➕ New | `api-contract.locked.yaml:305` | Major | Problem/ValidationProblem lost `required` arrays (#186) |
| 4 | ➕ New | `operators.yml:209` | Major | Location documented as relative URI (#188) |
| 5 | ➕ New | `AddressRequest.java:28` | Major | Javadoc still claims no countryCode length check (#189) |
| 6 | ➕ New | `OperatorMapper.java:51` | Major | new updateEntity untested (#190) |
| 7 | ➕ New | `GlobalExceptionHandler.java:109` | Major | new 409 OptimisticLocking handler untested (#191) |
| 8 | ➕ New | `GlobalExceptionHandler.java:108` | Major | 409 not in locked contract (#192) |
| 9 | ➕ New | `application.yml:104` | Major | springdoc comment contradicts api-docs.enabled:false (#193) |
| 10 | ➕ New | `AddressRequestValidationTest.java:23` | Major | stale countryCode Javadoc (#194) |
| 11 | ➕ New | `AddressSearchIT.java:66` | Major | town/postcode search coverage removed (#196) |
| 12 | ➕ New | `OperatorComplianceIT.java:213` | Major | generate flag still skips assertion gates (#197) |
| 13 | ➕ New | `OperatorComplianceIT.java:274` | Major | schema gate fails open (#198) |
| 14 | ➕ New | `EmfMetricsPublisherTest.java:50` | Major | NaN-skip test doesn't assert skip (#199) |

Prior Criticals resolved in this window: #14, #15, #21, #22, #46, #53, #63, #80,
#95, #154. Remaining Critical: **#86** (header trust boundary — documented in
README, still not enforced in code).

Snyk: skipped (`snyk auth` not available in this environment).

## Repository Verdict

**Status:** NEEDS MORE WORK

Substantial progress on the first review — the locked/generated contract
divergence, EMF scheduling, malformed-JSON 400, and most filter hardening are
fixed. Still blocking merge:

1. **Own the trust boundary for `Trade-Imports-Organisation-Id`** (#86) —
   README now documents CDP ingress/BFF expectation, but nothing in-repo
   enforces it.
2. **New Major deltas from the fix commits** (#184–#199) — notably the
   optimistic-locking 409 without tests/contract coverage, schema-gate fail-open,
   and stale Javadoc after the countryCode `@Size` fix.
3. **Remaining prior Majors** not touched by this window (still open for walker
   triage) — e.g. workspace-stack docs (#5), OpenAPI description gaps, ProxyConfig
   coverage.
