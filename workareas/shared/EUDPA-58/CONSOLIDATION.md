# EUDPA-58 — review consolidation

Merge of two independent machine-generated reviews of the EUDPA-58 PR set.

- **Review A (Sam)** — six repos, 472 items, none triaged. `trade-imports-address-book`
  refreshed 2026-08-04 against PR head `bbf547c`; the other five sit at their
  2026-07-29 commits.
- **Review B (Amir, @ami-nav)** — `trade-imports-address-book` only, 201 items across
  five refresh rounds, also ending at `bbf547c`. 195 closed (92 Auto-Resolved,
  103 Fix/Done, each with a commit sha), 6 still open.

**Overlap exists only on `trade-imports-address-book`.** The other five repos in
Review A — `trade-imports-animals-backend` (41), `trade-imports-animals-frontend` (2),
`trade-imports-animals-tests` (48), `trade-imports-animals-workspace` (30) and
`trade-imports-ins-frontend` (153) — have no counterpart in Review B at all. They
were excluded from Amir's review by instruction, so there is nothing to
deduplicate there: all 274 items carry across untouched and untriaged.

## Counts

| Repo | Items in A | Items in B | DUP-CLOSED | DUP-OPEN | UNIQUE-MINE | CONTRADICTS | Live after merge |
|---|---:|---:|---:|---:|---:|---:|---:|
| trade-imports-address-book | 198 | 201 | 73 | 5 | 106 | 14 | **126** |
| trade-imports-animals-backend | 41 | 0 | — | — | — | — | 41 |
| trade-imports-animals-frontend | 2 | 0 | — | — | — | — | 2 |
| trade-imports-animals-tests | 48 | 0 | — | — | — | — | 48 |
| trade-imports-animals-workspace | 30 | 0 | — | — | — | — | 30 |
| trade-imports-ins-frontend | 153 | 0 | — | — | — | — | 153 |
| **Total** | **472** | **201** | **73** | **5** | **106** | **14** | **400** |

The four address-book buckets sum to 198 — every one of Sam's address-book items is
classified into exactly one. The live address-book set of 126 is
UNIQUE-MINE (106) + CONTRADICTS (14) + DUP-OPEN merged (5) + Amir-only open (1, his #188).
The closed archive grows from 195 to 268: Amir's 195 preserved verbatim, plus the
73 DUP-CLOSED entries appended at ids 202–274.

Live severity split after the merge: 4 Critical / 50 Major / 72 Minor on
address-book; 17 / 185 / 198 across all six repos.

## How items were matched

Matching is by `file` plus the substance of `issue`, never by id — the two
numbering schemes are independent and line numbers have drifted across 17 commits.
Both `issue` texts were read for every candidate pair.

One structural fact makes the address-book classification tractable, and it is
worth stating because it is not obvious from the item files:

- Sam's items **1–100** were raised at `6f1134b` (2026-07-29) and were **never
  re-verified** against `bbf547c`. This is the cohort his refresh reported as
  "roughly 60 fixed but not auto-drained".
- Sam's items **101–198** are the delta review at `bbf547c`.

So a Sam item in the 1–100 range that Amir closed is a straightforward
DUP-CLOSED, not a disagreement — Sam simply did not re-check it. A Sam item in
the 101–198 range that contradicts a closed Amir item is a real disagreement,
because both reviews were looking at the same commit.

## DUP-CLOSED (73)

Same defect as an item in Amir's closed archive. All 73 are from Sam's stale
1–100 cohort. They have been moved out of the live backlog into
`items.trade-imports-address-book.closed-archive.json` with Amir's disposition
preserved and a note recording that both reviews found it.

**37 of the 73 are closed by an Amir item carrying a commit sha** — that is
evidence enough to drain them without a walker pass. The other 36 are closed by
Amir's refresh verification ("violation no longer present" at `bbf547c`), which is
weaker evidence than a sha but was produced against the same head Sam reviewed.

| Sam # | Sev | File | Amir # | Disposition | Evidence |
|---|---|---|---|---|---|
| 1 | Major | `publish-branch.yml` | 2 | Auto-Resolved | refresh |
| 2 | Major | `publish-branch.yml` | 1 | Auto-Resolved | refresh |
| 5 | Major | `README.md` | 6 | Auto-Resolved | refresh |
| 6 | Major | `README.md` | 5 | Fix | `8bb4343` |
| 7 | Minor | `README.md` | 9 | Auto-Resolved | refresh |
| 8 | Major | `dev-run.sh` | 10 | Auto-Resolved | refresh |
| 9 | Major | `dev-run.sh` | 3 | Fix | `8bb4343` |
| 13 | Critical | `api-contract.locked.yaml` | 16 | Auto-Resolved | refresh |
| 14 | Critical | `api-contract.locked.yaml` | 14 | Auto-Resolved | refresh |
| 15 | Critical | `api-contract.locked.yaml` | 15 | Auto-Resolved | refresh |
| 16 | Critical | `api-contract.locked.yaml` | 14 | Auto-Resolved | refresh |
| 17 | Major | `api-contract.locked.yaml` | 19 | Auto-Resolved | refresh |
| 18 | Major | `api-contract.locked.yaml` | 20 | Auto-Resolved | refresh |
| 19 | Major | `api-contract.locked.yaml` | 17 | Auto-Resolved | refresh |
| 20 | Minor | `api-contract.locked.yaml` | 20 | Auto-Resolved | refresh |
| 21 | Minor | `api-contract.locked.yaml` | 20 | Auto-Resolved | refresh |
| 22 | Critical | `operators.yml` | 21 | Auto-Resolved | refresh |
| 23 | Major | `operators.yml` | 23 | Auto-Resolved | refresh |
| 24 | Major | `operators.yml` | 25 | Fix | `9525e4e` |
| 25 | Major | `operators.yml` | 28 | Fix | `9525e4e` |
| 26 | Major | `operators.yml` | 22 | Auto-Resolved | refresh |
| 27 | Minor | `operators.yml` | 24 | Fix | `9525e4e` |
| 28 | Minor | `operators.yml` | 27 | Fix | `9525e4e` |
| 29 | Minor | `operators.yml` | 26 | Fix | `9525e4e` |
| 30 | Minor | `operators.yml` | 39 | Fix | `9525e4e` |
| 32 | Major | `RestClientConfig.java` | 29 | Auto-Resolved | refresh |
| 35 | Major | `AddressRequest.java` | 32 | Fix | `9525e4e` |
| 36 | Major | `AddressRequest.java` | 27 | Fix | `9525e4e` |
| 37 | Major | `AddressRequest.java` | 34 | Auto-Resolved | refresh |
| 38 | Major | `AddressRequest.java` | 14 | Auto-Resolved | refresh |
| 39 | Minor | `AddressRequest.java` | 24 | Fix | `9525e4e` |
| 40 | Major | `OperatorController.java` | 36 | Auto-Resolved | refresh |
| 42 | Major | `OperatorController.java` | 22 | Auto-Resolved | refresh |
| 43 | Minor | `OperatorController.java` | 39 | Fix | `9525e4e` |
| 45 | Minor | `OperatorController.java` | 91 | Auto-Resolved | refresh |
| 46 | Major | `OperatorMapper.java` | 40 | Auto-Resolved | refresh |
| 47 | Major | `OperatorPageResponse.java` | 41 | Fix | `9525e4e` |
| 48 | Minor | `OperatorPageResponse.java` | 42 | Auto-Resolved | refresh |
| 50 | Major | `OperatorRepository.java` | 43 | Auto-Resolved | refresh |
| 53 | Major | `OperatorResponse.java` | 48 | Fix | `9525e4e` |
| 54 | Minor | `OperatorResponse.java` | 49 | Fix | `954247a` |
| 55 | Major | `OperatorService.java` | 62 | Fix | `954247a` |
| 56 | Minor | `OperatorService.java` | 52 | Auto-Resolved | refresh |
| 58 | Minor | `BadRequestException.java` | 79 | Fix | `954247a` |
| 59 | Critical | `GlobalExceptionHandler.java` | 80 | Auto-Resolved | refresh |
| 63 | Major | `ValidationProblem.java` | 85 | Auto-Resolved | refresh |
| 64 | Major | `IdentityHeaderFilter.java` | 87 | Auto-Resolved | refresh |
| 65 | Major | `IdentityHeaderFilter.java` | 15 | Auto-Resolved | refresh |
| 66 | Major | `TraceIdPropagationInterceptor.java` | 94 | Auto-Resolved | refresh |
| 67 | Minor | `application.yml` | 102 | Fix | `8bb4343` |
| 68 | Major | `AddressRequestValidationTest.java` | 107 | Fix | `e4e3e67` |
| 70 | Minor | `OperatorMapperTest.java` | 108 | Fix | `e4e3e67` |
| 71 | Major | `OperatorServiceTest.java` | 112 | Fix | `e4e3e67` |
| 72 | Minor | `OperatorServiceTest.java` | 115 | Fix | `e4e3e67` |
| 73 | Minor | `OperatorServiceTest.java` | 114 | Fix | `e4e3e67` |
| 74 | Major | `GlobalExceptionHandlerTest.java` | 120 | Fix | `e4e3e67` |
| 75 | Major | `GlobalExceptionHandlerTest.java` | 121 | Fix | `e4e3e67` |
| 76 | Major | `IdentityHeaderFilterTest.java` | 124 | Auto-Resolved | refresh |
| 77 | Minor | `IdentityHeaderFilterTest.java` | 126 | Fix | `e4e3e67` |
| 80 | Major | `AddressDeleteIT.java` | 132 | Fix | `6ae0c82` |
| 81 | Major | `AddressGetIT.java` | 135 | Fix | `6ae0c82` |
| 82 | Minor | `AddressGetIT.java` | 137 | Fix | `6ae0c82` |
| 83 | Major | `AddressScopingIT.java` | 139 | Fix | `6ae0c82` |
| 84 | Minor | `AddressScopingIT.java` | 135 | Fix | `6ae0c82` |
| 86 | Major | `AddressSearchIT.java` | 143 | Auto-Resolved | refresh |
| 87 | Minor | `AddressSearchIT.java` | 144 | Auto-Resolved | refresh |
| 88 | Major | `AddressUpdateIT.java` | 149 | Fix | `6ae0c82` |
| 90 | Major | `IntegrationBase.java` | 152 | Fix | `6ae0c82` |
| 91 | Major | `MongoConfigIT.java` | 153 | Fix | `6ae0c82` |
| 93 | Critical | `OperatorComplianceIT.java` | 154 | Auto-Resolved | refresh |
| 97 | Minor | `OperatorCrudIT.java` | 162 | Fix | `6ae0c82` |
| 98 | Minor | `OperatorIndexIT.java` | 170 | Fix | `6ae0c82` |
| 99 | Major | `OperatorListIT.java` | 174 | Fix | `6ae0c82` |

Two of these were spot-checked against the current tree rather than trusted:

- **Sam #91 / Amir #153** (`MongoConfigIT` read-preference). `application-integration-test.yml`
  now carries only `write-concern`; the duplicated `read-preference` key is gone, so
  the assertion does inherit from `application.yml`. Genuinely fixed.
- **Sam #98 / Amir #170** (index directions). `OperatorIndexIT` line 43 now reads
  `.extracting(IndexField::getKey, IndexField::getDirection)`. Genuinely fixed.

## DUP-OPEN (5)

Both reviews raised these and both still have them open. Merged into one live
entry each, carrying Sam's text (written at `bbf547c`, so the line numbers are
current) with a note citing Amir's id.

| Sam # | Amir # | File | Defect |
|---|---|---|---|
| 112 | 189 | `AddressRequest.java` | Class Javadoc still says countryCode has no length check, but `@Size(max = 2)` was added |
| 144 | 193 | `application.yml` | Comment says `/v3/api-docs` stays enabled everywhere; the config below it sets `api-docs.enabled: false` |
| 159 | 200 | `ProxyConfigTest.java` | `@AfterEach` `ProxySelector.setDefault(ProxySelector.getDefault())` is a no-op |
| 179 | 201 | `AddressSearchIT.java` | Nothing asserts that `q` does not match addressLine1-only hits |
| 195 | 199 | `EmfMetricsPublisherTest.java` | NaN-skip test's only assertion is `verify(mockMeter).measure()`, so it cannot detect the guard's removal |

Amir's sixth open item, **#188** (`operators.yml` — the 201 `Location` header is
documented as a relative URI, which RFC 9110 does not permit, exposing a real
defect in `OperatorController.create`), has no counterpart in Sam's set and is
carried forward live unchanged.

## CONTRADICTS (14)

These are the places where the two reviews disagree about whether the code is
correct. All 14 are Sam items from the `bbf547c` delta set against Amir items he
had already closed — so both reviews were looking at the same commit.

A pattern runs through eleven of them: **Amir's review prescribed a fix, the fix
landed, Amir closed the item, and Sam's later pass found that the fix either did
not achieve its purpose or introduced a new defect.** Neither review is
systematically wrong; they disagree about whether the post-fix state is acceptable.

All 14 remain live. Every one needs a human ruling.

---

### C-1 · Critical · `AddressRequestValidationTest.java:200` — cv-011 country-code validation

The head-on one. Both reviews looked at the same test and reached opposite verdicts.

> **Amir #105 (Auto-Resolved)** — "countryCodeIsPresenceOnlyAndAcceptsAnyNonBlankValueRegardlessOfLength
> pins a 300-character countryCode as VALID, turning an unvalidated field into an
> asserted contract … **fix:** Add `@Size(max = 2)` (or `@Pattern("^[A-Za-z]{2}$")`) to
> AddressRequest.countryCode and rewrite this test as an over-length/malformed
> rejection case."
> (Amir #194, also Auto-Resolved, then endorsed the matching Javadoc: "AddressRequest.countryCode
> now carries `@Size(max = 2)` and a 3-char value is rejected.")

> **Sam #145 (Critical)** — "The cv-011 guard test … was deleted and replaced with
> countryCodeRejectsValuesLongerThanTwoCharacters … so the suite now pins the exact
> opposite of the ruled spec (design-v2.md:426 '@NotBlank only. No @Size, no list
> validation, no ISO pattern — stored-as-given (cv-011)') … `max=2` is a de-facto
> ISO-alpha-2 format check."

Verified in the tree: `countryCodeRejectsValuesLongerThanTwoCharacters` is at line 200,
the presence-only test is gone, and the class Javadoc line 24 now reads
"countryCode is ISO 3166-1 alpha-2 (`@Size(max = 2)`)". The in-repo
`api-contract.locked.yaml:25` still says "Stored as-given with presence-only
validation (cv-011)", so the repo's own contract document sides with Sam.
**This is a spec question, not a code question, and only a human can settle it.**

### C-2 · Critical · `EmfMetricsPublisher.java:23` — Spring cannot construct the bean

> **Amir #99 (Fix `954247a`)** — "MetricsLogger is constructed inline inside
> publishMetrics(), so nothing published to EMF can be asserted … **fix:** Inject a
> `Supplier<MetricsLogger>` (or a thin MetricsLoggerFactory bean) so tests can capture
> the logger."

> **Sam #140 (Critical)** — "Two constructors and neither is annotated `@Autowired`, so
> Spring has no candidate constructor for this `@Service`; with `aws.emf.enabled`
> defaulting to true in application.yml the context fails to refresh with
> BeanInstantiationException ('No default constructor found') at startup."

Verified: the class now has two package-private constructors, neither annotated,
and `application.yml:42` sets `enabled: ${AWS_EMF_ENABLED:true}` against a
`@ConditionalOnProperty(matchIfMissing = false)` — so the bean *is* selected and
*cannot* be built. Amir's fix is the direct cause; his review never raised it.

### C-3 · Critical · `ProxyConfig.java:102` — proxy credentials returned to every host

> **Amir #71 (Fix `954247a`)** — "Any userinfo in the proxy URL is silently discarded …
> **fix:** Read `proxyUri.getUserInfo()`; if present, install an Authenticator (and set
> `jdk.http.auth.tunneling.disabledSchemes=""` for HTTPS CONNECT)."

> **Sam #123 (Critical)** — "configureProxyAuthentication installs a JVM-global
> Authenticator that returns the proxy username/password for EVERY authentication
> challenge, not just proxy ones — any external host the service calls can trigger a
> 401 WWW-Authenticate and receive the CDP proxy credentials."

Verified: the anonymous `Authenticator` returns the credentials with no
`getRequestorType() == RequestorType.PROXY` guard and no host/port check, and
`jdk.http.auth.tunneling.disabledSchemes` is cleared. Amir asked for exactly this
change, including the `disabledSchemes` clear; the missing requestor-type guard was
not part of his instruction and he did not review the result.

### C-4 · Major · `OperatorComplianceIT.java:151` — the camelCase invariant was traded away

> **Amir #156 (Fix `6ae0c82`)** — "apiDocsCarryTheWholeCamelCaseAndAnyOfContractSurface
> … asserts its own property names match `[a-z][a-zA-Z0-9]*` — the live doc is generated
> from the implementation's Jackson naming, so the check is self-referential …
> **fix:** Drive the expected property names from api-contract.locked.yaml … rather
> than from a regex."

> **Sam #185 (Major)** — "This delta deleted the self-contained camelCase invariant …
> and replaced it with assertSchemaPropertyNamesMatch, which only checks that the live
> property-name sets equal those in the *editable* docs/openapi/api-contract.locked.yaml.
> A snake_case rename mirrored into the locked file now passes."

Verified: no regex loop survives; `assertSchemaPropertyNamesMatch(live, locked)` is
the only property-name gate. Amir's fix is what Sam is objecting to. Both are right
about their own half — Amir's regex was self-referential, Sam's replacement is
defeatable by editing an in-repo file. The gate needs both, or a ruling.

### C-5 · Major · `OperatorComplianceIT.java:243` — the documented regeneration command

> **Amir #197 (Auto-Resolved)** — "apiDocsMatchTheCommittedArtifactAndTheLockedContract
> still early-returns when `-Dopenapi.generate=true` … **fix:** Remove the early-return
> branch entirely from the assertion test; regeneration already lives in
> regenerateCommittedOpenApiArtifact."

> **Sam #186 (Major)** — "The early return … was removed, so under
> `-Dopenapi.generate=true` the staleness assertion still runs and compares against the
> pre-regeneration file; JUnit's default method order is unspecified, so
> `mvn verify -Dopenapi.generate=true` (this class's own Javadoc line 41 and README
> line 225) fails whenever the staleness test happens to run before
> regenerateCommittedOpenApiArtifact."

Verified: the early return is gone, the staleness gate runs unconditionally, and
regeneration sits in a separate `@EnabledIfSystemProperty` test with no
`@TestMethodOrder` on the class. Amir's prescribed fix broke the documented command.

### C-6 · Major · `OperatorIndexIT.java:61` — the explain plan tests the wrong query shape

> **Amir #167 (Fix `6ae0c82`)** — "The test asserts only that the index is DECLARED …
> it never runs an explain plan, so it cannot detect the failure it claims to guard.
> **fix:** Add a behavioural assertion alongside the metadata one: run an explain."

> **Sam #189 (Major)** — "The explain command sorts by `{createdAt:-1}` only, but the
> same commit changed OperatorService.list to sort by createdAt DESC .and(id DESC), so
> the test explains a query shape production never issues. Verified against mongo:7.0
> with 200 seeded docs: the test's shape wins LIMIT/FETCH/IXSCAN(org_status_created),
> while the real shape wins a blocking SORT stage … The assertions still pass under
> both shapes, so the test gives false assurance."

Verified: line 58 is `.append("sort", new Document("createdAt", -1))`, and the
comment above it claims "explain a production-shaped list query". The explain Amir
asked for landed and does not guard what he wanted it to guard.

### C-7 · Major · `OperatorListIT.java:71` — the ordering fixture still cannot fail

> **Amir #174 (Fix `6ae0c82`)** — "the class javadoc says the IT pins a 'newest-first'
> listing, but no test asserts ordering … **fix:** Give the seeds distinct, controlled
> createdAt values, then assert the concrete order."

> **Sam #190 (Major)** — "seedActiveWithDistinctCreatedAt assigns `base.plusSeconds(i + 1)`
> so createdAt ascends in step with insertion order, and OperatorService.list sorts
> createdAt DESC then id DESC over monotonically-increasing Mongo ObjectIds — deleting
> createdAt from the sort entirely leaves items[0].name still 'Address 29' and the test
> still green."

Verified at `OperatorListIT.java:71`. The distinct timestamps Amir asked for landed;
they are collinear with insertion order, so the assertion still cannot distinguish
the two sort keys.

### C-8 · Major · `IdentityHeaderFilterTest.java:276` — the no-PII test still cannot fail

> **Amir #124 (Auto-Resolved, "Verified gone in refresh")** — "The no-PII-in-logs
> assertion is vacuous: IdentityHeaderFilter only logs inside reject(), so on this happy
> path appender.list is empty and allSatisfy() passes over zero events. **fix:** Exercise
> the path that actually logs … and add `assertThat(appender.list).isNotEmpty()`."

> **Sam #167 (Major)** — "this commit deleted both the PII-bearing request body and the
> meaningful `assertThat(chain.mdcDuringChain()).containsOnlyKeys(MDC_ORGANISATION_ID)`
> line, so nothing now pins the MDC key set … and the surviving
> `doesNotContain("Highland Livestock Ltd"/"secret@example.com")` checks strings that
> exist nowhere in the SUT — the test would still pass if the filter logged the entire
> request."

Verified: `isNotEmpty()` is present at line 276 (Amir's fix landed), the request
carries no org header and no body, and the two `doesNotContain` strings are seeded
nowhere. Amir's specific complaint is fixed; the test is still substantially vacuous.

### C-9 · Major · `MetricsConfigTest.java:51` — half the fix landed

> **Amir #117 (Fix `e4e3e67`)** — "**Both** tests are tautological: the declared return
> types are TimedAspect/CountedAspect, so isNotNull() plus isInstanceOf() can only fail
> if the factory returns null."

> **Sam #157 (Major)** — "countedAspect_isCreatedWithTheSuppliedRegistry asserts only
> isNotNull … unlike the sibling timedAspect test which this same diff upgraded to a
> real behavioural assertion."

Verified: `timedAspect` now drives the aspect and asserts
`meterRegistry.find("test.timed.operation").timer()`; `countedAspect` is still
`assertThat(result).isNotNull()`. Amir closed both halves; one is still open.

### C-10 · Major · `AddressDeleteIT.java:31` — `@SpyBean` is deprecated for removal

> **Amir #130 (Fix `6ae0c82`)** — "**fix:** Assert the write itself rather than its
> timestamp side effect — e.g. wrap OperatorRepository in a `@SpyBean` and
> `verify(repository, times(1)).save(any())` across the two DELETEs."

> **Sam #174 (Major)** — "`@SpyBean` (org.springframework.boot.test.mock.mockito.SpyBean)
> is deprecated for removal as of Spring Boot 3.4 and the project is on 3.5.5; the unit
> best-practice already prescribes the bean-override family (`@MockitoBean`). It also …
> forces a second full application context boot for the whole IT run."

Verified: `import org.springframework.boot.test.mock.mockito.SpyBean;` at line 17.
The two reviews disagree about the right mechanism, not about the coverage gap.

### C-11 · Major · `RequestTracingFilter.java:48` — the ECS status field

> **Amir #93 (Auto-Resolved, "dead http.response.status_code MDC put removed")** —
> "http.response.status_code is put into MDC after chain.doFilter returns and is wiped
> by MDC.clear() … **fix:** Either drop the MDC_HTTP_STATUS put, or emit a single
> request-completion log line."

> **Sam #139 (Major)** — "Rewrite dropped the http.response.status_code MDC field and
> replaced it with a `log.debug` 'request completed' line, but the app package logs at
> INFO in application.yml and application-integration-test.yml, so response status is
> never emitted in deployed envs … the log also sits after chain.doFilter outside any
> catch, so a request that throws logs nothing."

Verified: no `status_code` MDC put remains; the only log statement is `log.debug` at
line 48. Amir's item is correctly closed on its own terms; Sam says the option Amir
allowed leaves the ECS field permanently absent.

### C-12 · Minor · `OperatorMapperTest.java:203` — the added keys still cannot fail

> **Amir #109 (Fix `e4e3e67`)** — "**fix:** Add `"organisationId": "OTHER-ORG"`,
> `"status": "DELETED"`, createdAt/modifiedAt values to the body so the null assertions
> can actually fail."

> **Sam #149 (Minor)** — "The server-field keys added to the request body … cannot fail:
> AddressRequest declares no such components, so Jackson drops them at deserialisation
> whatever the mapper does, and OperatorMapper's `@Mapping(ignore = true)` rules are
> already compiler-enforced by unmappedTargetPolicy = ERROR."

Verified: the keys are present at lines 180–184 exactly as Amir asked, `AddressRequest`
has no `organisationId`/`status` component, and the test mapper sets
`failOnUnknownProperties(false)`. The fix was applied literally and does not pin the
cv-010 tenant-smuggling guard it was meant to pin.

### C-13 · Minor · `EmfMetricsPublisher.java:42` — cumulative vs per-interval metrics

> **Amir #98 (Auto-Resolved)** — "The publisher destructively mutates the shared
> application MeterRegistry every 60s, removing every meter whose name startsWith
> 'controller' … **fix:** Drop the removal and let CloudWatch derive rates from
> cumulative counters."

> **Sam #143 (Minor)** — "Dropping the per-cycle removal of `controller.*` meters changes
> published semantics: counters are now re-emitted every 60s as cumulative totals rather
> than per-interval deltas, so any CloudWatch alarm or dashboard built on the old values
> now reads a monotonically rising series."

Amir prescribed the removal; Sam asks whether the downstream dashboards were checked.
Not a code defect on either side — an operational question nobody has answered.

### C-14 · Minor · `OperatorServiceTest.java:63` — test naming convention

> **Amir #116 (Fix `e4e3e67`)** — "Test method names drop the documented
> `{subject}_{shouldDoWhat}` prefix … **fix:** Rename to the subject-prefixed form
> (create_stampsOrganisationIdFromTheHeader, update_appliesTheNewFieldValues,
> delete_isIdempotentForATombstone, list_…)."

> **Sam #156 (Minor)** — "bbf547c renamed all 22 tests to a subject_ prefix but stopped
> short of the documented form: the bundle specifies `{subject}_{shouldDoWhat}` and every
> example carries *should*, as do the IT classes renamed in the same commit … so the repo
> now carries two naming conventions, split unit vs integration."

The names that landed are the ones Amir's fix text spelled out, and they are the ones
Sam objects to. A one-line convention ruling settles it.

## The four new Criticals from Sam's 2026-08-04 refresh

Every one was verified against the checked-out tree at `bbf547c` rather than trusted.

| # | Finding | Did Amir's review see it? |
|---|---|---|
| 1 | `EmfMetricsPublisher.java:23` — two constructors, neither `@Autowired`; context fails to refresh at startup with `aws.emf.enabled=true` | **No.** His #99 (Fix `954247a`) asked for the injectable `Supplier<MetricsLogger>` that added the second constructor, and he did not review the result. See C-2. |
| 2 | `ProxyConfig.java:102` — JVM-global `Authenticator` returns proxy credentials to every auth challenge | **No.** His #71 (Fix `954247a`) asked for the Authenticator and for clearing `jdk.http.auth.tunneling.disabledSchemes`; the missing requestor-type guard was never raised. See C-3. |
| 3 | `docs/openapi/operators.yml:184` — `page` regenerated as `type: string`, losing `format: int32` | **No.** His #27 (Fix `9525e4e`) asked for a `page` minimum, and the `@Schema` override that satisfied it is what replaced the inferred integer type. His later refresh looked at the same regenerated block and caught only the `countryCode` `minLength` change (#187). |
| 4 | `AddressRequestValidationTest.java:200` — cv-011 guard test deleted and inverted to pin `@Size(max=2)` | **Yes — and reached the opposite verdict.** His #105 asked for `@Size(max = 2)` and closed it Auto-Resolved when it landed; #194 endorsed the matching Javadoc. See C-1. |

Three of the four are unseen by Amir, and in all three cases his own prescribed fix is
the proximate cause. The fourth is seen and actively disputed.

Verification detail for #3: `operators.yml` lines 179–185 now read
`type: string` / `minimum: 1` for the `page` query parameter — no `format: int32`,
no `default: 1`. `minimum` is a numeric JSON Schema keyword, so it is inert on a
string; the constraint the fix intended is still not expressed.

## Draining the "~60 fixed but not auto-drained"

Sam's refresh reported roughly 60 prior address-book items as genuinely fixed but
could not auto-drain them. Cross-referencing that cohort (his items 1–100) against
Amir's archive resolves 73 of them:

- **37 are closed by an Amir item carrying a commit sha** — `8bb4343`, `9525e4e`,
  `954247a`, `e4e3e67` or `6ae0c82`. That is evidence enough to drain without a
  walker pass; the sha names the commit that fixed it.
- **36 are closed by Amir's refresh verification** at `bbf547c` — "violation no
  longer present". No sha, but the check was run against the same head Sam
  reviewed, so it is the same class of evidence Sam's own refresh produces.

All 73 have been moved to the closed archive. The remaining 27 items from Sam's
1–100 cohort have no counterpart in Amir's review at all and stay live untriaged —
they were raised at `6f1134b` and have not been re-verified by anyone, so a walker
pass is still needed for those.

## Housekeeping notes

Carried forward as-is, but worth knowing before the walker runs:

- **Stale file paths.** One Sam item (#97) and seven Amir archive items are filed
  against `OperatorCrudIT.java`, which was renamed to `AddressCrudIT.java` at
  `bbf547c`. Sam's own new items (#170–173) use the new path.
- **Sam #3 needs re-scoping.** It asks for a workflow-level `concurrency` block on
  `.github/workflows/publish-branch.yml`. That file is now a six-line caller of the
  shared workspace workflow (verified), so the concern belongs upstream.
- **Four intra-Sam duplicate pairs** survive the merge because each pair is filed
  against two different files, and deduplicating within a single review was out of
  scope here: #116/#132 (409 reachable from DELETE but undeclared), #120/#153
  (the `id` sort tie-breaker is unasserted), #124/#160 (the credentialed-proxy path
  is untested) and #175/#183 (the tombstone-resurrection IT exists twice).
- **Schema note.** Amir's items carry optional `repo` and `best_practice` keys that
  Sam's do not. Every source key is preserved on every carried item; only `id`,
  `notes` and (for archived items) `disposition`/`status` were rewritten.
