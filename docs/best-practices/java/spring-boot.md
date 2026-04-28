# Spring Boot — Best Practices

Project baseline: Spring Boot 3.5, Java 25, Maven, Lombok. This doc covers the patterns used in `trade-imports-animals-backend`.

---

## 1. Application structure

Use **feature-based packages**, not layer-based. Each feature owns its controller, service, repository, model, and DTO.

```
src/main/java/uk/gov/defra/tradeimportsanimals/
├── TradeImportsAnimalsApplication.java
├── notification/
│   ├── NotificationController.java
│   ├── NotificationService.java
│   ├── NotificationRepository.java
│   ├── Notification.java           ← MongoDB document
│   └── dto/
│       ├── NotificationDto.java
│       └── NotificationRequest.java
├── audit/
│   ├── AuditRepository.java
│   └── Audit.java
├── config/
│   ├── SecurityConfig.java
│   ├── CacheConfig.java
│   ├── MongoConfig.java
│   └── MetricsConfig.java
├── common/
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── NotFoundException.java
│   │   └── ConflictException.java
│   └── filter/
│       ├── RequestTracingFilter.java
│       └── AdminSecretFilter.java
└── metrics/
    └── EmfMetricsPublisher.java
```

---

## 2. Entry point

```java
@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({ AppConfig.class, MetricsConfigurationProperties.class })
public class TradeImportsAnimalsApplication {
    public static void main(String[] args) {
        SpringApplication.run(TradeImportsAnimalsApplication.class, args);
    }
}
```

---

## 3. REST controllers

```java
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/notifications")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Timed("notification.find_all")
    public List<NotificationDto> findAll() {
        log.info("Finding all notifications");
        return notificationService.findAll();
    }

    @GetMapping("/{referenceNumber}")
    @Timed("notification.find_by_reference")
    public NotificationDto findByReferenceNumber(@PathVariable String referenceNumber) {
        return notificationService.findByReferenceNumber(referenceNumber);
    }

    @PostMapping
    @Timed("notification.save")
    public NotificationDto save(
            @Valid @RequestBody NotificationRequest request,
            @RequestHeader HttpHeaders headers) {
        return notificationService.save(request, headers);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByReferenceNumbers(
            @Valid @RequestBody List<String> referenceNumbers,
            @RequestHeader HttpHeaders headers) {
        notificationService.deleteByReferenceNumbers(referenceNumbers, headers);
    }
}
```

Key points:
- `@RequiredArgsConstructor` (Lombok) — constructor injection, never `@Autowired` on fields
- `@Slf4j` (Lombok) — provides `log` field
- `@Timed` — Micrometer metric per endpoint
- `@RequestHeader HttpHeaders` — captures all headers for audit trail

---

## 4. Request / response

```java
// Path variable
@GetMapping("/{id}")
public ResponseEntity<NotificationDto> getById(@PathVariable String id) {
    return ResponseEntity.ok(service.findById(id));
}

// Query params
@GetMapping
public ResponseEntity<List<NotificationDto>> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    return ResponseEntity.ok(service.findAll(page, size));
}

// Request headers
@PostMapping
public ResponseEntity<NotificationDto> create(
        @Valid @RequestBody NotificationRequest body,
        @RequestHeader HttpHeaders headers) {
    var result = service.create(body, headers);
    return ResponseEntity.status(HttpStatus.CREATED).body(result);
}

// No content response
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable String id) {
    service.delete(id);
}
```

---

## 5. Bean validation

```java
public record NotificationRequest(
    @NotBlank(message = "Reference number is required")
    String referenceNumber,

    @NotNull(message = "Origin is required")
    @Valid
    Origin origin,

    @Size(max = 500)
    String notes
) {}
```

Constraint annotations:

| Annotation | Description |
|-----------|-------------|
| `@NotNull` | Value must not be null |
| `@NotBlank` | String must not be null, empty, or whitespace |
| `@NotEmpty` | Collection/String must not be null or empty |
| `@Size(min, max)` | Collection/String size bounds |
| `@Min` / `@Max` | Numeric bounds |
| `@Pattern(regexp)` | Regex match |
| `@Email` | Valid email format |
| `@Valid` | Cascade validation to nested objects |
| `@Positive` | Number > 0 |

Use `@Valid` on `@RequestBody` parameters to trigger validation. Failures throw `MethodArgumentNotValidException` — handled by `@ControllerAdvice`.

---

## 6. Exception handling

```java
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidationException(
            MethodArgumentNotValidException ex) {
        var traceId = MDC.get("traceId");
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fe -> Objects.requireNonNullElse(fe.getDefaultMessage(), "Invalid"),
                        (a, b) -> a));

        var problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setType(URI.create("/problems/validation-error"));
        problem.setProperty("errors", errors);
        problem.setProperty("traceId", traceId);
        return ResponseEntity.badRequest().body(problem);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ProblemDetail> handleNotFoundException(NotFoundException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setType(URI.create("/problems/not-found"));
        problem.setProperty("traceId", MDC.get("traceId"));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ProblemDetail> handleConflictException(ConflictException ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setType(URI.create("/problems/conflict"));
        problem.setProperty("traceId", MDC.get("traceId"));
        return ResponseEntity.status(HttpStatus.CONFLICT).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleException(Exception ex) {
        log.error("Unexpected error", ex);
        var problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        problem.setType(URI.create("/problems/internal-error"));
        problem.setProperty("traceId", MDC.get("traceId"));
        return ResponseEntity.internalServerError().body(problem);
    }
}
```

Custom exceptions:

```java
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
}

public class ConflictException extends RuntimeException {
    public ConflictException(String message) { super(message); }
}
```

`ProblemDetail` produces RFC 7807 JSON:
```json
{
  "type": "/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Notification DRAFT.IMP.2026.123 not found",
  "traceId": "abc-123"
}
```

---

## 7. Dependency injection

Always use **constructor injection** via `@RequiredArgsConstructor`. Never use `@Autowired` on fields.

```java
// Correct — constructor injection via Lombok
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final AuditRepository auditRepository;
}

// Wrong — field injection
@Service
public class NotificationService {
    @Autowired  // ← Never do this
    private NotificationRepository notificationRepository;
}
```

Stereotype annotations:

| Annotation | Use |
|-----------|-----|
| `@Component` | Generic Spring-managed bean |
| `@Service` | Business logic layer |
| `@Repository` | Data access layer (enables exception translation) |
| `@Controller` / `@RestController` | Web layer |
| `@Configuration` | Config class with `@Bean` methods |

```java
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        var caffeine = Caffeine.newBuilder()
                .maximumSize(500)
                .expireAfterWrite(10, TimeUnit.MINUTES);
        var manager = new CaffeineCacheManager();
        manager.setCaffeine(caffeine);
        return manager;
    }
}
```

---

## 8. Configuration

```yaml
# application.yml
app:
  backend-url: ${BACKEND_URL:http://localhost:8085}
  admin-secret: ${ADMIN_SECRET:dev-secret}
  aws:
    region: ${AWS_REGION:eu-west-2}
    endpoint-override: ${AWS_ENDPOINT_OVERRIDE:}

spring:
  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017/trade-imports-animals}
  cache:
    type: caffeine

server:
  port: ${PORT:8085}
  forward-headers-strategy: framework
  shutdown: graceful
```

```yaml
# application-local.yml — overrides for local dev
app:
  aws:
    endpoint-override: http://localhost:4566
logging:
  level:
    root: DEBUG
```

`@ConfigurationProperties`:

```java
@ConfigurationProperties(prefix = "app")
@Validated
public record AppConfig(
    @NotBlank String backendUrl,
    @NotBlank String adminSecret,
    AwsConfig aws
) {
    public record AwsConfig(
        @NotBlank String region,
        String endpointOverride
    ) {}
}
```

Register: `@EnableConfigurationProperties(AppConfig.class)` on the application class.

---

## 9. Conditional beans

```java
@Service
@ConditionalOnProperty(name = "metrics.emf.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class EmfMetricsPublisher {

    private final MeterRegistry meterRegistry;

    @Scheduled(fixedRateString = "${metrics.publish-interval-ms:60000}")
    public void publishMetrics() {
        log.info("Publishing EMF metrics");
        // ...
    }
}
```

`@ConditionalOnProperty` disables the bean entirely — no stub, no `if` check needed. In `application-test.yml`, set `metrics.emf.enabled=false`.

---

## 10. Caching

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        var caffeine = Caffeine.newBuilder()
                .maximumSize(1000)
                .expireAfterWrite(Duration.ofMinutes(10))
                .recordStats();
        var manager = new CaffeineCacheManager("notifications", "commodities");
        manager.setCaffeine(caffeine);
        return manager;
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class CommodityService {

    @Cacheable(value = "commodities", key = "#code")
    public Commodity findByCode(String code) {
        // Only called on cache miss
        return commodityRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Commodity not found: " + code));
    }

    @CacheEvict(value = "commodities", key = "#commodity.code")
    public void update(Commodity commodity) {
        commodityRepository.save(commodity);
    }

    @CachePut(value = "commodities", key = "#result.code")
    public Commodity save(Commodity commodity) {
        return commodityRepository.save(commodity);
    }
}
```

**Self-invocation caveat**: `@Cacheable` is AOP-based — calling a cached method from within the same bean bypasses the cache. Extract to a separate bean if needed.

---

## 11. Scheduling

```java
@Configuration
@EnableScheduling
public class SchedulingConfig {}
```

```java
@Service
@ConditionalOnProperty(name = "scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class MetricsPublisher {

    // Fixed rate in milliseconds
    @Scheduled(fixedRate = 60_000)
    public void publishEveryMinute() { ... }

    // Cron expression
    @Scheduled(cron = "0 0 * * * *")  // top of every hour
    public void publishHourly() { ... }

    // From property — allows env-specific intervals
    @Scheduled(fixedRateString = "${metrics.publish-interval-ms:60000}")
    public void publishConfigurable() { ... }
}
```

Disable in tests via `application-integration-test.yml`:
```yaml
scheduling:
  enabled: false
```

---

## 12. Security — JWT resource server

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
            JwtDecoder jwtDecoder,
            JwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
        return http
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .sessionManagement(sm -> sm
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
            @Value("${jwt.audience}") String audience) {
        var decoder = JwtDecoders.fromIssuerLocation(issuerUri);
        var audienceValidator = new JwtClaimValidator<List<String>>(
                JwtClaimNames.AUD, aud -> aud != null && aud.contains(audience));
        var validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerUri), audienceValidator);
        ((NimbusJwtDecoder) decoder).setJwtValidator(validator);
        return decoder;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        var converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("roles");
        converter.setAuthorityPrefix("ROLE_");
        var authConverter = new JwtAuthenticationConverter();
        authConverter.setJwtGrantedAuthoritiesConverter(converter);
        return authConverter;
    }
}
```

Admin secret filter (shared-secret auth for internal endpoints):

```java
@Component
@RequiredArgsConstructor
public class AdminSecretFilter extends OncePerRequestFilter {

    private final AppConfig appConfig;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request instanceof HttpServletRequest req
                && req.getRequestURI().startsWith("/admin")) {
            var secret = req.getHeader("Trade-Imports-Animals-Admin-Secret");
            if (!appConfig.adminSecret().equals(secret)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
```

---

## 13. Servlet filters

```java
@Component
@Order(1)
public class RequestTracingFilter extends OncePerRequestFilter {

    private static final String TRACE_HEADER = "x-cdp-request-id";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        var traceId = request.getHeader(TRACE_HEADER);
        if (traceId != null && !traceId.isBlank()) {
            MDC.put("traceId", traceId);
        }
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();  // always clear — prevents bleed between requests in thread pools
        }
    }
}
```

Outbound trace propagation via `RestClient` interceptor:

```java
@Component
public class TraceIdPropagationInterceptor implements ClientHttpRequestInterceptor {

    private static final String TRACE_HEADER = "x-cdp-request-id";

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body,
            ClientHttpRequestExecution execution) throws IOException {
        var traceId = MDC.get("traceId");
        if (traceId != null && !traceId.isBlank()) {
            request.getHeaders().add(TRACE_HEADER, traceId);
        }
        return execution.execute(request, body);
    }
}
```

---

## 14. Actuator

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
      show-components: when-authorized
  health:
    defaults:
      enabled: true
```

```yaml
# application-local.yml — expose everything locally
management:
  endpoints:
    web:
      exposure:
        include: "*"
```

Custom health indicator:

```java
@Component
public class BackendHealthIndicator implements HealthIndicator {

    private final NotificationRepository notificationRepository;

    @Override
    public Health health() {
        try {
            notificationRepository.count();
            return Health.up().build();
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }
}
```

---

## 15. Logging

```java
@Slf4j  // Lombok — provides log field
@Service
public class NotificationService {

    public NotificationDto save(NotificationRequest request, HttpHeaders headers) {
        // Parameterised — correct
        log.info("Saving notification for reference: {}", request.referenceNumber());

        // Structured with context
        log.debug("Save request received: referenceNumber={}, userId={}",
                request.referenceNumber(), headers.getFirst("User-Id"));

        try {
            var result = doSave(request);
            log.info("Notification saved: referenceNumber={}", result.referenceNumber());
            return result;
        } catch (Exception ex) {
            // Always log with exception object — not ex.getMessage()
            log.error("Failed to save notification: referenceNumber={}",
                    request.referenceNumber(), ex);
            throw ex;
        }
    }
}
```

Log levels:
- `TRACE` — very fine-grained, never in production
- `DEBUG` — diagnostic detail for troubleshooting
- `INFO` — normal operations (default production level)
- `WARN` — unexpected but handled
- `ERROR` — operation failed, needs attention

`logback-spring.xml` — switch format by Spring profile:

```xml
<configuration>
  <springProfile name="!local">
    <!-- ECS format for deployed environments -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
      <encoder class="co.elastic.logging.logback.EcsEncoder">
        <serviceName>trade-imports-animals-backend</serviceName>
      </encoder>
    </appender>
  </springProfile>

  <springProfile name="local">
    <!-- Human-readable for local dev -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
      <encoder>
        <pattern>%d{HH:mm:ss} %-5level [%X{traceId}] %logger{36} - %msg%n</pattern>
      </encoder>
    </appender>
  </springProfile>

  <!-- Suppress health check noise -->
  <logger name="org.springframework.web.servlet.DispatcherServlet" level="WARN"/>

  <root level="${LOG_LEVEL:-INFO}">
    <appender-ref ref="STDOUT"/>
  </root>
</configuration>
```

---

## 16. Spring Data MongoDB (brief)

Full reference: `docs/java/spring-data-mongodb.md`.

```java
@Document(collection = "notifications")
@Builder
@Data
public class Notification {

    @Id
    private String id;

    @Indexed(sparse = true, unique = true)
    private String referenceNumber;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
```

```java
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Optional<Notification> findByReferenceNumber(String referenceNumber);

    List<Notification> findAllByReferenceNumberIn(List<String> referenceNumbers);

    boolean existsByReferenceNumber(String referenceNumber);
}
```

---

## 17. HTTP clients (RestClient)

```java
@Configuration
@RequiredArgsConstructor
public class HttpClientConfig {

    private final TraceIdPropagationInterceptor traceInterceptor;

    @Bean
    public RestClient backendRestClient(
            @Value("${app.backend-url}") String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestInterceptor(traceInterceptor)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class BackendClient {

    private final RestClient backendRestClient;

    public NotificationDto getNotification(String referenceNumber) {
        return backendRestClient.get()
                .uri("/notifications/{ref}", referenceNumber)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                    throw new NotFoundException("Notification not found: " + referenceNumber);
                })
                .body(NotificationDto.class);
    }

    public NotificationDto saveNotification(NotificationRequest request) {
        return backendRestClient.post()
                .uri("/notifications")
                .body(request)
                .retrieve()
                .body(NotificationDto.class);
    }
}
```

Prefer `RestClient` (Spring 6.1+). Do not use `RestTemplate` for new code.

---

## 18. OpenAPI (brief)

Full reference: `docs/java/openapi-springdoc.md`.

```java
@Tag(name = "Notifications", description = "Manage import notifications")
@RestController
public class NotificationController {

    @Operation(summary = "Get all notifications")
    @ApiResponse(responseCode = "200", description = "Notifications retrieved")
    @GetMapping("/notifications")
    public List<NotificationDto> findAll() { ... }
}
```

---

## 19. Micrometer metrics

```java
@Configuration
public class MetricsConfig {

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    @Bean
    public CountedAspect countedAspect(MeterRegistry registry) {
        return new CountedAspect(registry);
    }
}
```

`@Timed` on controller/service methods:
```java
@Timed(value = "notification.save", percentiles = { 0.5, 0.95, 0.99 })
public NotificationDto save(NotificationRequest request, HttpHeaders headers) { ... }
```

Programmatic metrics:
```java
@Service
@RequiredArgsConstructor
public class EmfMetricsPublisher {

    private final MeterRegistry meterRegistry;

    @Scheduled(fixedRateString = "${metrics.publish-interval-ms:60000}")
    public void publishMetrics() {
        var notificationCount = meterRegistry.find("notification.save").timer();
        if (notificationCount != null) {
            // Emit CloudWatch EMF JSON
            log.info("{\"_aws\":{\"Timestamp\":{},\"CloudWatchMetrics\":[...]},\"Count\":{}}",
                    System.currentTimeMillis(), notificationCount.count());
        }
    }
}
```

---

## 20. Testing

Full reference: `docs/java/testing/unit.md` and `docs/java/testing/integration.md`.

Key pattern — Testcontainers `@DynamicPropertySource`:

```java
@SpringBootTest
@Testcontainers
class NotificationServiceIT {

    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7");

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }
}
```

---

## 21. Project conventions

| Convention | Value |
|-----------|-------|
| Base package | `uk.gov.defra.tradeimportsanimals` |
| Java version | Java 25 (Amazon Corretto) |
| Spring Boot | 3.5.x |
| Build tool | Maven |
| Coverage minimum | 65% (JaCoCo enforced in `verify`) |
| HTTP port | 8085 |
| Shutdown | Graceful (`server.shutdown=graceful`) |
| Proxy headers | `server.forward-headers-strategy=framework` |

**Lombok annotations to use:**

| Annotation | Purpose |
|-----------|---------|
| `@RequiredArgsConstructor` | Constructor injection |
| `@Slf4j` | Provides `log` field |
| `@Builder` | Builder pattern |
| `@Data` | Getters + setters + equals + hashCode (use on mutable entities) |
| `@Value` | Immutable value class (all fields final) |
| `@With` | Generates `withX()` copy methods |

**Error type URI convention:** `/problems/{problem-type}` (e.g. `/problems/not-found`, `/problems/validation-error`)