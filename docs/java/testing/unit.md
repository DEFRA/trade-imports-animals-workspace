# Unit Testing — trade-imports-animals-backend

## Overview

Unit tests run in isolation — no Spring context, no database, no HTTP server. External dependencies are replaced with Mockito mocks. Tests execute in the Maven `test` phase via Surefire.

**Run with:**
```bash
mvn test             # unit tests only
mvn verify           # unit + integration tests
```

---

## File naming convention

| Pattern | Runner | Phase |
|---------|--------|-------|
| `*Test.java` | Maven Surefire | `test` |
| `*IT.java` | Maven Failsafe | `integration-test` / `verify` |

No `@Tag` or `@Category` annotations are used. The `Test` suffix is the only distinction.

---

## Test types

There are three distinct flavours of unit test in this codebase:

| Approach | When to use |
|----------|-------------|
| Pure unit — direct instantiation | Services, exception handlers, interceptors, config classes with no Spring dependencies |
| `@WebMvcTest` slice | Controllers — exercises the full Spring MVC dispatch chain without a real server |
| Annotation-contract tests | Verifying that production classes carry required annotations (`@ConditionalOnProperty`, `@Scheduled`, etc.) |

---

## Pure unit tests

### Setup pattern

Construct the class under test in `@BeforeEach` using its real constructor. Never use `@InjectMocks` — explicit construction makes dependencies visible and avoids silent injection failures.

```java
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AuditRepository auditRepository;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, auditRepository);
    }
}
```

Use `@ExtendWith(MockitoExtension.class)` whenever the class under test has collaborators that need mocking. For classes with no dependencies (e.g. a simple exception handler), omit the extension and instantiate directly:

```java
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }
}
```

### Mocks

Declare mocks as fields with `@Mock`. Use inline `mock()` only for objects that are local to a single test (e.g. a `BindingResult` created by a test helper):

```java
// Field mock — used across multiple tests
@Mock
private NotificationRepository notificationRepository;

// Inline mock — local to one test or helper
BindingResult bindingResult = mock(BindingResult.class);
when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldErrors));
```

Use `lenient()` stubs in `@BeforeEach` for stubs that not every test exercises — this avoids `UnnecessaryStubbingException` without suppressing the extension:

```java
@BeforeEach
void setUp() throws IOException {
    interceptor = new TraceIdPropagationInterceptor("x-cdp-request-id");
    headers = new HttpHeaders();
    lenient().when(request.getHeaders()).thenReturn(headers);
    lenient().when(execution.execute(any(), any())).thenReturn(response);
}
```

### ArgumentCaptor

Prefer `ArgumentCaptor.forClass()` declared inline for one-off captures. For tests that capture repeatedly, declare `@Captor` fields:

```java
// Inline — for a single capture assertion
ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
verify(auditRepository).save(auditCaptor.capture());
Audit saved = auditCaptor.getValue();
assertThat(saved.getResult()).isEqualTo(Result.SUCCESS);

// Field — when capture is needed across multiple tests
@Captor private ArgumentCaptor<HttpRequest> requestCaptor;
@Captor private ArgumentCaptor<byte[]> bodyCaptor;
```

### State cleanup

If a test modifies global state (e.g. SLF4J MDC), clean it up in `@AfterEach`:

```java
@AfterEach
void tearDown() {
    MDC.clear();
}
```

---

## Controller tests — `@WebMvcTest`

Use `@WebMvcTest` (not `@SpringBootTest`) for controller unit tests. It starts the Spring MVC layer only — no database, no full context. MockMvc is auto-configured.

Wire the admin secret via `@TestPropertySource` so the security filter has a value to compare:

```java
@WebMvcTest(NotificationController.class)
@TestPropertySource(properties = "admin.secret=test-secret")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NotificationService notificationService;
}
```

Use `@MockitoBean` (not `@Mock`) for service dependencies — Spring needs to inject these into the controller bean.

### HTTP assertions

```java
// GET list
mockMvc.perform(get("/notifications")
        .contentType(MediaType.APPLICATION_JSON))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$").isArray())
    .andExpect(jsonPath("$.length()").value(2))
    .andExpect(jsonPath("$[0].id").value("507f1f77bcf86cd799439011"));

// POST with body
mockMvc.perform(post("/notifications")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(dto)))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.referenceNumber").value(expectedRef));

// DELETE with header
mockMvc.perform(delete("/notifications")
        .contentType(MediaType.APPLICATION_JSON)
        .header("Trade-Imports-Animals-Admin-Secret", "test-secret")
        .content(objectMapper.writeValueAsString(referenceNumbers)))
    .andExpect(status().isNoContent());
```

`@WebMvcTest` also exercises `@ControllerAdvice` handlers. Use it to verify that exceptions thrown by mocked services map to the correct HTTP status codes — this is cheaper than an integration test for basic exception-to-status mapping:

```java
// Validates that NotFoundException → 404 through GlobalExceptionHandler
doThrow(new NotFoundException("not found"))
    .when(notificationService).deleteByReferenceNumbers(any(), any());

mockMvc.perform(delete("/notifications")...)
    .andExpect(status().isNotFound())
    .andExpect(jsonPath("$.detail").value("not found"));
```

---

## Annotation-contract tests

When a production class must carry specific annotations for the application to work correctly (e.g. `@Scheduled`, `@ConditionalOnProperty`), verify this with reflection. Prefer this over integration tests for annotation presence — it runs faster and fails with a clear message.

```java
@Test
void metricsPublisher_shouldHaveScheduledAnnotation() {
    Method publishMethod = EmfMetricsPublisher.class.getMethod("publishMetrics");
    Scheduled scheduled = publishMethod.getAnnotation(Scheduled.class);
    assertThat(scheduled).isNotNull();
    assertThat(scheduled.fixedRate()).isEqualTo(60000L);
}
```

---

## Test method naming

```
{subject}_{shouldDoWhat}
{subject}_{shouldDoWhat}_{whenContext}
```

Use the method name or operation as the subject prefix. Examples:

```
saveOriginOfImport_shouldSaveNewNotificationAndGenerateReferenceNumber
saveOriginOfImport_shouldUpdateExistingNotification
findAll_shouldReturnEmptyList
deleteByReferenceNumbers_shouldThrowNotFoundException_whenOneIsMissing
handleValidationException_shouldReturnBadRequestWithFieldErrors
handleValidationException_shouldHandleNullTraceId
intercept_shouldAddTraceIdHeader_whenMdcContainsTraceId
intercept_shouldNotAddHeader_whenMdcTraceIdIsBlank
post_shouldCreateNotificationAndReturnReferenceNumber
delete_shouldReturn401_whenAdminSecretHeaderIsMissing
```

Do not use `testXxx()` naming — this is an older JUnit 3 convention found in some tests but it is not the standard going forward.

---

## Given / When / Then

All tests use explicit `// Given`, `// When`, `// Then` comment blocks. For short tests `// When & Then` can be combined. Inline comments can supplement the blocks for non-obvious steps:

```java
@Test
void deleteByReferenceNumbers_shouldDeleteAll_whenAllFound() {
    // Given
    String ref1 = "DRAFT.IMP.2026.111";
    Notification n1 = Notification.builder().id("111").referenceNumber(ref1).build();
    when(notificationRepository.findAllByReferenceNumberIn(List.of(ref1))).thenReturn(List.of(n1));
    when(auditRepository.save(any(Audit.class))).thenReturn(new Audit());

    // When
    notificationService.deleteByReferenceNumbers(List.of(ref1), headers);

    // Then — deleteAll is called with the found notifications
    verify(notificationRepository).deleteAll(List.of(n1));

    // And an audit record is saved with SUCCESS
    ArgumentCaptor<Audit> auditCaptor = ArgumentCaptor.forClass(Audit.class);
    verify(auditRepository).save(auditCaptor.capture());
    assertThat(auditCaptor.getValue().getResult()).isEqualTo(Result.SUCCESS);
}
```

---

## Assertions

### AssertJ — primary

AssertJ is the standard assertion library. Do not use JUnit's `assertEquals` / `assertNotNull` — these exist in some older tests but are not the standard going forward.

```java
// Object assertions
assertThat(result).isNotNull();
assertThat(result.getReferenceNumber()).startsWith("DRAFT.IMP." + currentYear + ".");
assertThat(result.getReferenceNumber()).endsWith(generatedId);

// Exception assertions
assertThatThrownBy(() -> service.doSomething(arg))
    .isInstanceOf(NotFoundException.class)
    .hasMessageContaining("DRAFT.IMP.2026.MISSING");

// Collection assertions
assertThat(result).hasSize(3);
assertThat(result).extracting(Notification::getCommodity)
    .containsExactly("Live cattle", "Live sheep", "Live pigs");

// Map assertions
assertThat(errors).hasSize(2);
assertThat(errors.get("origin")).isEqualTo("must not be null");
```

### Mockito verification

```java
// Verify exact call count
verify(notificationRepository, times(2)).save(any(Notification.class));
verify(notificationRepository, times(1)).findAll();

// Verify never called
verify(notificationRepository, never()).deleteAll(anyList());

// Verify call with specific argument
verify(notificationRepository).deleteAll(List.of(n1, n2));
```

---

## Helper methods

Extract repeated setup into private helpers — do not inline complex construction in every test:

```java
// Private helper for audit-relevant headers
private HttpHeaders headersWithAuditFields() {
    HttpHeaders headers = new HttpHeaders();
    headers.add("x-cdp-request-id", "test-trace-id");
    headers.add("User-Id", "test-user-id");
    return headers;
}

// Private helper for constructing hard-to-create exceptions
private MethodArgumentNotValidException createValidationException(FieldError... fieldErrors) {
    // ...
}
```

---

## What the existing unit tests cover

| Class | Tests | What it covers |
|-------|-------|----------------|
| `NotificationControllerTest` | 8 | MVC dispatch, request/response serialisation, admin secret enforcement, NotFoundException → 404, empty-list validation |
| `NotificationServiceTest` | 10 | Save new (two-phase: ID then reference), save existing (upsert), findAll, delete all-found, delete with missing (NotFoundException + FAILURE audit), delete empty list (no-op) |
| `GlobalExceptionHandlerTest` | 9 | Validation → 400, NotFoundException → 404, ConflictException → 409, generic Exception → 500, traceId from MDC, null traceId handling |
| `TraceIdPropagationInterceptorTest` | 6 | Header set when MDC populated, not set when null/blank/empty, overwrites existing header, body passed through unchanged |
| `EmfMetricsPublisherTest` | ~4 | Metrics publish scheduling, meter registry interactions |
| `MetricsConfigTest` | ~3 | MeterRegistry bean creation, publisher registration |
| `MetricsConfigurationPropertiesTest` | ~3 | Annotation contracts: `@ConditionalOnProperty`, `@Service`, `@Scheduled(fixedRate=60000)` |
| `CertificateLoaderTest` | ~5 | null/empty/valid/invalid certificate paths |
| `CacheConfigTest` | ~3 | Caffeine spec construction, CacheManager bean |
| `ApplicationTest` | 0 | Placeholder only — no assertions |
