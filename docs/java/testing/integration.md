# Integration Testing — trade-imports-animals-backend

## Overview

Integration tests use a real Spring Boot context with Testcontainers for all external dependencies. There are no mocks of infrastructure — MongoDB, OAuth2, and external HTTP services all run as real containers.

**Run with:**
```bash
mvn verify          # unit + integration tests
mvn test            # unit tests only
mvn verify -DskipTests=true  # skip all tests
```

---

## File naming convention

| Pattern | Runner | Phase |
|---------|--------|-------|
| `*Test.java` | Maven Surefire | `test` |
| `*IT.java` | Maven Failsafe | `integration-test` / `verify` |

No `@Tag` or `@Category` annotations are used. The `IT` suffix is the only distinction.

---

## Architecture

### `IntegrationBase` — the only base class

All IT classes extend `IntegrationBase`. Never instantiate containers or configure Spring properties in an IT class itself.

```
IntegrationBase (abstract)
├── @SpringBootTest(webEnvironment = RANDOM_PORT)
├── @ActiveProfiles("integration-test")
├── 3 static Testcontainers (shared across all subclasses)
├── @DynamicPropertySource (wires container URLs into Spring)
└── Helper methods: webClient(), getToken(), usingStub(), getJsonFromFile()

NotificationIT extends IntegrationBase
MongoConfigIT extends IntegrationBase
HealthCheckConfigIT extends IntegrationBase
EcsLoggingIT extends IntegrationBase
ProxyConfigIT extends IntegrationBase
TrustStoreConfigurationIT extends IntegrationBase
```

### Containers

Three containers start once, shared across all IT classes via static fields and `Startables.deepStart()`:

| Container | Image | Purpose |
|-----------|-------|---------|
| `MONGO_CONTAINER` | `mongo:7.0` | Primary data store |
| `OAUTH_CONTAINER` | `ghcr.io/navikt/mock-oauth2-server:2.1.10` | JWT token generation |
| `MOCK_SERVER_CONTAINER` | `mockserver/mockserver` | Stub external HTTP services |

Containers are started in parallel:
```java
static {
    Startables.deepStart(OAUTH_CONTAINER, MONGO_CONTAINER, MOCK_SERVER_CONTAINER).join();
}
```

Their URLs are wired into the Spring context via `@DynamicPropertySource` before the context starts — this is how Testcontainers integrates with Spring Boot's property system.

### Spring profile

`@ActiveProfiles("integration-test")` activates `application-integration-test.yml` in `src/test/resources/`. Key settings in that file:

- MongoDB SSL disabled
- `admin.secret` set to `test-admin-secret`
- Actuator: only `/health` exposed, no component details
- MongoDB health check disabled
- AWS EMF metrics disabled

---

## Writing an IT class

### Minimal structure

```java
class MyFeatureIT extends IntegrationBase {

    @Autowired
    private MyRepository myRepository;

    @BeforeEach
    void setUp() {
        myRepository.deleteAll();
    }

    @Test
    void post_shouldCreateRecord() {
        // Given
        MyDto dto = new MyDto("value");

        // When / Then
        webClient("NoAuth")
            .post()
            .uri("/my-endpoint")
            .bodyValue(dto)
            .exchange()
            .expectStatus().isOk()
            .expectBody(MyEntity.class)
            .returnResult();
    }
}
```

### Test method naming

```
{subject}_{shouldDoWhat}
{subject}_{shouldDoWhat}_{whenContext}
```

Examples:
```
post_shouldCreateNewNotification
delete_shouldReturn401_whenAdminSecretHeaderIsMissing
findAll_shouldReturnEmptyList_whenNoNotifications
fullCrudFlow_shouldWorkEndToEnd
```

Use the HTTP method or operation as the subject prefix (`post_`, `delete_`, `findAll_`). For multi-step scenarios use a descriptive name (`fullCrudFlow_`).

### Given / When / Then

All tests use explicit `// Given`, `// When`, `// Then` comments. For short tests the When and Then can be combined via the fluent chain, but the comment blocks must still be present.

---

## HTTP testing

### Primary client — `WebTestClient`

Use `webClient(clientType)` from `IntegrationBase` for all HTTP calls. It binds to the Spring Boot server on the random port and injects a Bearer token automatically.

```java
// GET — list
List<Notification> result = webClient("NoAuth")
    .get()
    .uri("/notifications")
    .exchange()
    .expectStatus().isOk()
    .expectBodyList(Notification.class)
    .returnResult().getResponseBody();

// POST — create
EntityExchangeResult<Notification> result = webClient("NoAuth")
    .post()
    .uri("/notifications")
    .bodyValue(dto)
    .exchange()
    .expectStatus().isOk()
    .expectBody(Notification.class)
    .returnResult();

// DELETE — with headers
webClient("NoAuth")
    .method(HttpMethod.DELETE).uri("/notifications")
    .header("Trade-Imports-Animals-Admin-Secret", "test-admin-secret")
    .header("x-cdp-request-id", "trace-001")
    .header("User-Id", "user-001")
    .bodyValue(List.of(ref1, ref2))
    .exchange()
    .expectStatus().isNoContent();
```

### When to use `TestRestTemplate` instead

Use `TestRestTemplate` (not `WebTestClient`) when testing actuator endpoints. MockMvc only exercises the Spring MVC layer and misses actuator's separate servlet context. See `HealthCheckConfigIT` for the pattern.

### When to use `MockMvc` instead

Use `MockMvc` (with `@AutoConfigureMockMvc` on the class) when you need to verify behaviour that requires capturing side effects like log output. See `EcsLoggingIT` for the pattern.

---

## Database

### Clean state per test

`@BeforeEach` must delete all relevant repositories. Never rely on test execution order.

```java
@BeforeEach
void setUp() {
    notificationRepository.deleteAll();
    auditRepository.deleteAll();
}
```

### Direct repository assertions

Inject Spring Data repositories to assert persistence directly — don't infer DB state from HTTP responses alone for critical business logic:

```java
@Autowired
private NotificationRepository notificationRepository;

// After the HTTP call:
Notification persisted = notificationRepository.findById(id).orElse(null);
assertThat(persisted).isNotNull();
assertThat(persisted.getOrigin().getCountryCode()).isEqualTo("BE");
```

---

## Authentication

### JWT tokens

`webClient("NoAuth")` calls `getToken("NoAuth")` internally, which POSTs to the OAuth mock container and returns a JWT. The token is set as `Authorization: Bearer {token}` on every request.

The `clientType` string maps to mock OAuth client configurations. `"NoAuth"` is the standard test client.

### Admin secret

Endpoints protected by the admin secret header require:
```java
.header("Trade-Imports-Animals-Admin-Secret", "test-admin-secret")
```

`test-admin-secret` matches the value configured in `application-integration-test.yml`. Always use the constant rather than hardcoding the string in each test:

```java
private static final String ADMIN_SECRET_HEADER = "Trade-Imports-Animals-Admin-Secret";
private static final String VALID_ADMIN_SECRET = "test-admin-secret";
```

---

## Stubbing external services

Use `usingStub()` to get a `MockServerClient` for any external HTTP dependency declared in `SERVICES_TO_MOCK`:

```java
usingStub()
    .when(request().withMethod("GET").withPath("/some/external/path"))
    .respond(response().withStatusCode(200).withBody(getJsonFromFile("response.json")));
```

Put stub JSON fixtures in `src/test/resources/`. Use `getJsonFromFile("filename.json")` to load them.

The base class `@AfterEach tearDown()` resets all stubs after each test — you do not need to clean up stubs manually.

---

## Assertions

### AssertJ — primary

```java
assertThat(created).isNotNull();
assertThat(created.getReferenceNumber()).startsWith("DRAFT.IMP.");
assertThat(created.getReferenceNumber()).matches("DRAFT\\.IMP\\.\\d{4}\\..+");

// Collections
assertThat(notifications).hasSize(3);
assertThat(notifications)
    .extracting(n -> n.getOrigin().getCountryCode())
    .containsExactlyInAnyOrder("GB", "IE", "FR");

// With context label (use on non-obvious assertions)
assertThat(duration)
    .as("Health check should respond quickly without database connectivity checks")
    .isLessThan(1000L);
```

### WebTestClient — HTTP response assertions

```java
.expectStatus().isOk()
.expectStatus().isNoContent()
.expectStatus().isNotFound()
.expectStatus().isBadRequest()
.expectStatus().isUnauthorized()

// JSON path assertions on error responses
.expectBody()
.jsonPath("$.status").isEqualTo(404)
.jsonPath("$.detail").value(Matchers.containsString("DRAFT.IMP.2026.DOESNOTEXIST"))
```

---

## Coverage

JaCoCo enforces **65% line coverage** at the `verify` phase. Build fails if coverage drops below this threshold. No exclusions are configured — all production code counts.

---

## What the existing ITs cover

| Class | Tests | What it covers |
|-------|-------|---------------|
| `NotificationIT` | 15 | Full CRUD, upsert semantics, reference number generation, audit trail, admin auth, atomic delete, input validation |
| `MongoConfigIT` | 5 | MongoDB connection, read preference, write concern, basic document operations |
| `HealthCheckConfigIT` | 8 | Actuator endpoint exposure, security (no details, no env/metrics/info), CDP path requirements, response time |
| `EcsLoggingIT` | 3 | ECS JSON log format, required CDP fields, trace ID propagation, health endpoint log filtering |
| `ProxyConfigIT` | 3 | HTTP proxy env var handling, system property propagation, graceful handling when proxy absent |
| `TrustStoreConfigurationIT` | 3 | SSLContext creation, X509 certificate loading, null certificate handling |
