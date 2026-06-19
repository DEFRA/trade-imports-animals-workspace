# Repository Review: trade-imports-animals-backend

**PR:** #49
**Commit:** 4b73a20b313d707925157ad47b1782f571e5d237
**Files Changed:** 15

## Summary

Implements the publish half of the transactional outbox pattern per ADR-EUDP-001. A scheduled poller (`OutboxPoller`) reads unpublished events from the `outbox` MongoDB collection under a ShedLock distributed lock and publishes each to an SNS topic via `OutboxPublishService`. The `OutboxEvent` entity gains a `publishedAt` timestamp (null until published), backed by a partial compound index for efficient polling. Configuration is externalised via `OutboxConfig` (poll interval, batch size, lock timings, topic ARN). The `AwsConfig` is extended with an `SnsClient` bean. LocalStack scripts and YAML config are updated for local/test environments.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `compose/start-localstack.sh` | SAFE | 0 | 0 | 0 |
| `pom.xml` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/Application.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/configuration/AwsConfig.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/configuration/OutboxConfig.java` | NEEDS ATTENTION | 0 | 3 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxEvent.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxEventRepository.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPoller.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishService.java` | NEEDS ATTENTION | 2 | 2 | 0 |
| `src/main/resources/application-local.yml` | SAFE | 0 | 0 | 0 |
| `src/main/resources/application.yml` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/integration/outbox/OutboxPollerIT.java` | NEEDS ATTENTION | 1 | 2 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java` | NEEDS ATTENTION | 0 | 3 | 3 |
| `src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishServiceTest.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/test/resources/application-integration-test.yml` | SAFE | 0 | 0 | 0 |

## Positive Observations

- Clean separation of concerns: `OutboxPoller` handles scheduling/locking, `OutboxPublishService` handles publishing logic
- ShedLock distributed lock prevents concurrent polling across replicas — meets AC exactly
- `@ConditionalOnProperty` allows disabling the poller in tests and per-environment
- `OutboxEvent.publishedAt` as a timestamp (not boolean) provides audit value — good design choice
- Partial compound index `unpublished_poll` on `{publishedAt: null}` is efficient for the polling query
- Repository query method `findByPublishedAtIsNullOrderByAggregateIdAscAggregateVersionAsc` ensures correct ordering per AC
- `SnsClient` bean follows the same builder pattern as `S3Client` — consistent retry strategy and timeouts
- Integration test (`OutboxPollerIT`) exercises the full LocalStack-backed path end-to-end
- Configuration defaults (2s poll, batch 10, 1s lock-at-least, 30s lock-at-most) align with ADR-EUDP-001 baseline

## Test Coverage

- Unit tests: Present — `OutboxPollerTest` (lock acquisition, delegation) and `OutboxPublishServiceTest` (publishing, failure handling, ordering). Some quality improvements needed (mock-focused assertions, missing return value checks).
- Integration tests: Present — `OutboxPollerIT` exercises the full flow with Testcontainers + LocalStack. Needs attention on resource cleanup and ordering assertion.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** The production code is well-structured and correct, but `OutboxPublishService` has a critical null-safety gap on `event.getData()` and the integration test has a resource leak. The config validation gaps in `OutboxConfig` could allow silent misconfigurations.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/main/java/uk/gov/defra/trade/imports/animals/configuration/OutboxConfig.java | 15 | Major | validation | Nested record fields (poller and sns) lack @Valid and @NotNull constraints; inconsistent with sibling config classes like CdpConfig | Add @Valid @NotNull annotations to poller and sns fields to enforce validation of nested record fields, matching CdpConfig pattern (line 35-36) |  |  |  |
| 2 | src/main/java/uk/gov/defra/trade/imports/animals/configuration/OutboxConfig.java | 37 | Major | validation | Poller compact constructor does not validate intervalMs > 0; allows zero or negative values which would break scheduling | Add validation after intervalMs reassignment: if (intervalMs <= 0) throw new IllegalArgumentException(...) or use @Positive annotation |  |  |  |
| 3 | src/main/java/uk/gov/defra/trade/imports/animals/configuration/OutboxConfig.java | 41 | Major | validation | batchSize lacks validation; allows zero or negative values which would cause OutboxPublishService.publishUnpublishedEvents() to fail | Add validation: if (batchSize <= 0) batchSize = 10; then add constraint annotation @Positive |  |  |  |
| 4 | src/main/java/uk/gov/defra/trade/imports/animals/configuration/OutboxConfig.java | 25 | Minor | config | Empty string default for topicArn (line 26) allows silent configuration misses; should be validated to prevent runtime surprises in SNS publishing | Add @NotBlank constraint to Sns.topicArn() to validate at bootstrap and fail fast if not configured |  |  |  |
| 5 | src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishService.java | 53 | Critical | null-safety | event.getData() could be null, risking NPE in objectMapper.writeValueAsString() | Add null check: if (event.getData() == null) { log error and skip event } |  |  |  |
| 6 | src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishService.java | 77 | Major | missing-null-check | event.getMetadata() is not null-checked before calling metadata.getCorrelationId() in buildMessageAttributes | Add null check for metadata in buildMessageAttributes or validate in OutboxEvent that metadata is always present |  |  |  |
| 7 | src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishService.java | 65 | Major | error-handling | Both JsonProcessingException and SnsException are caught with identical handling (log + break), but JsonProcessingException indicates data serialization failure while SnsException indicates transient publish failure; these warrant different retry strategies per AC | Handle separately: JsonProcessingException should be logged as ERROR with event details for manual investigation; SnsException should skip to retry on next poll (current logic is OK for SnsException but muddies intent for both) |  |  |  |
| 8 | src/test/java/uk/gov/defra/trade/imports/animals/integration/outbox/OutboxPollerIT.java | 66 | Critical | resource-leak | SnsClient created in static block is never closed, causing a resource leak | Store the SnsClient as a static field or close it in a static cleanup block |  |  |  |
| 9 | src/test/java/uk/gov/defra/trade/imports/animals/integration/outbox/OutboxPollerIT.java | 245 | Major | null-safety | messages() can return null; receiveMessages() should handle this case to avoid NPE | Change '.messages()' to '.messages() != null ? .messages() : Collections.emptyList()' |  |  |  |
| 10 | src/test/java/uk/gov/defra/trade/imports/animals/integration/outbox/OutboxPollerIT.java | 48 | Minor | duplication | String literal 'trace-outbox-it-' appears 3+ times across test constants and test methods (S1192) | Extract as a private static final constant: TRACE_PREFIX = 'trace-outbox-it-' |  |  |  |
| 11 | src/test/java/uk/gov/defra/trade/imports/animals/integration/outbox/OutboxPollerIT.java | 171 | Major | test-coverage | Test publishUnpublishedEvents_shouldPublishAggregateVersionsInOrder does not assert message ordering by aggregateVersion as required by AC | Add assertion to verify aggregateVersion fields in payload: firstPayload.get('aggregateVersion').asInt() < secondPayload.get('aggregateVersion').asInt() |  |  |  |
| 12 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 58 | Major | test-quality | Test asserts only that mocks were called, not the actual behavior. The shouldPublishUnpublishedEvents_whenLockAcquired test does not verify any observable result beyond a verify() call, which is against testing best practices. | Add an assertion on the return value of poll() or on a side effect that would actually be observable in production. For a void method, consider if this test should be an integration test instead that verifies the SNS message was actually published. |  |  |  |
| 13 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 65 | Major | test-quality | The shouldStillInvokePublish_whenNoEventsPublished test is redundant and tests the mock framework rather than behavior. Like the previous test, it only verifies the mock was called, not that poll() correctly handles a zero-result case. | Remove this test or replace it with a meaningful assertion. The behavior that matters is that poll() doesn't throw or crash when no events exist -- but that's already covered by other tests. Consider if this adds real value. |  |  |  |
| 14 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 74 | Minor | test-completeness | The test shouldAcquireOutboxPollerLock only verifies lock acquisition but does not verify the lock configuration (lockAtLeastFor, lockAtMostFor values). The AC requires specific lock timing per ADR-EUDP-001 baseline. | Enhance the assertion to check that captor.getValue() has lockAtLeastFor = Duration.ofSeconds(1) and lockAtMostFor = Duration.ofSeconds(30), matching the OutboxConfig defaults. |  |  |  |
| 15 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 82 | Major | test-coverage | No test verifies the critical behavior that poll() logs published event counts. The AC requires observable logging for operational monitoring, but no test asserts on log output. | Add a test or extend an existing test that captures or verifies log calls (via Logback test appender or SLF4J spy) when publishUnpublishedEvents() returns > 0, or use a more integrated testing approach. |  |  |  |
| 16 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 39 | Minor | test-structure | Test uses raw mock() inline (line 51) in BeforeEach for a SimpleLock that is used across multiple tests. Per best practices, repeatedly-used mocks should be declared as @Mock fields to avoid repeated mock() calls. | Declare SimpleLock as a @Mock field at class level (e.g. @Mock private SimpleLock simpleLock;) and reference it in acquireLock() BeforeEach, or keep inline but note it is used only once. |  |  |  |
| 17 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPollerTest.java | 20 | Minor | test-structure | OutboxPollerTest lacks Given/When/Then comments in test methods. Per best practices, all tests should have explicit comment blocks to structure the logic. | Add // Given, // When, // Then comments to each test method to improve readability and align with project conventions. |  |  |  |
| 18 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishServiceTest.java | 52 | Minor | testing | Missing Given/When/Then comment blocks in test methods | Add explicit // Given, // When, // Then comment blocks to each test method for clarity, per best practices |  |  |  |
| 19 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishServiceTest.java | 114 | Major | testing | Missing return value assertion in shouldPublishEventsInAggregateVersionOrder_whenAllSucceed | Add assertThat(outboxPublishService.publishUnpublishedEvents()).isEqualTo(2) to verify the correct count of published events is returned |  |  |  |
| 20 | src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxPublishService.java | 68 | Critical | correctness | PublishRequest does not set MessageGroupId, but cdp-app-config configures a FIFO topic ARN (*.fifo). FIFO SNS topics require MessageGroupId on every publish; without it, snsClient.publish() will throw InvalidParameterException at runtime. Additionally, MessageDeduplicationId may be required unless content-based deduplication is enabled on the topic. | Add .messageGroupId(event.getAggregateId()) to the PublishRequest builder to group events by aggregate. Consider also setting .messageDeduplicationId(event.getEventId()) for exactly-once delivery semantics. |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION
