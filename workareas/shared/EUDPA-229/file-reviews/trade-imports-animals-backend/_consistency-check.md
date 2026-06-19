# Consistency Check: trade-imports-animals-backend

## Internal Consistency

### Configuration Flow
- `OutboxConfig` record binds `outbox.poller.*` and `outbox.sns.*` from `application.yml` — **consistent**.
- `OutboxPoller` reads `outboxConfig.poller()` for lock timings and `@Scheduled` uses `${outbox.poller.interval-ms:2000}` — **consistent** with YAML defaults.
- `OutboxPublishService` reads `outboxConfig.sns().topicArn()` and `outboxConfig.poller().batchSize()` — **consistent**.

### Entity and Repository Alignment
- `OutboxEvent.publishedAt` (Instant, nullable) aligns with `findByPublishedAtIsNullOrderByAggregateIdAscAggregateVersionAsc` query — **consistent**.
- Partial compound index `unpublished_poll` on `{publishedAt: 1, aggregateId: 1, aggregateVersion: 1}` with filter `{publishedAt: null}` matches the repository query exactly — **consistent**.
- `OutboxPublishService` sets `event.setPublishedAt(Instant.now())` after successful publish and saves — ensures the event is not re-fetched on next poll.

### Lock Configuration
- `OutboxPoller` creates `LockConfiguration` with `lockAtMostFor` and `lockAtLeastFor` from config — **consistent** with `OutboxConfig.Poller` record fields.
- Lock name `outbox-poller` is distinct from the existing `outbox-write` lock (from EUDPA-168) — **no collision**.

### AWS Client Wiring
- `AwsConfig.snsClient()` bean uses the same credential resolution and retry/timeout config as `s3Client()` — **consistent**.
- `applyEndpointOverride(SnsClientBuilder)` correctly uses `appAwsConfig.endpointOverride()` for LocalStack — **consistent** with S3 pattern.

### Test Environment
- `application-integration-test.yml` disables the poller (`enabled: false`) and sets `lock-at-least-for: 0ms` — matches the existing pattern from `notification.submit` section — **consistent**.
- `OutboxPollerIT` uses Testcontainers LocalStack with SNS + SQS — exercises the full publish path.

### Error Handling
- `publishUnpublishedEvents()` breaks on first failure (both `JsonProcessingException` and `SnsException`) — events after the failed one are retried next poll. This preserves ordering per aggregate but means a single poison event blocks the batch.

## Cross-Repo Consistency

### FIFO Topic Mismatch (CRITICAL)
The `cdp-app-config` environments configure a FIFO SNS topic (`*.fifo`), but `OutboxPublishService.publishToSns()` does not set `MessageGroupId` or `MessageDeduplicationId` on the `PublishRequest`. FIFO topics require `MessageGroupId`; without it, the publish call fails at runtime.

### LocalStack Alignment
- `compose/start-localstack.sh` creates the SNS topic with `awslocal sns create-topic` — matches the `application-local.yml` ARN `arn:aws:sns:eu-west-2:000000000000:trade-imports-animals-outbox` — **consistent** (note: local topic is not `.fifo`, only deployed envs use FIFO).

## Findings

1. **CRITICAL**: FIFO topic contract not met — see item #20.
2. **Note**: LocalStack topic is not FIFO (`trade-imports-animals-outbox` without `.fifo` suffix), while deployed environments use FIFO topics. This means the FIFO-specific failure (missing `MessageGroupId`) would not surface locally, only in deployed environments. Consider making the local topic FIFO as well to catch this class of bug earlier.

## Verdict

**NEEDS ATTENTION** — internal consistency is good, but the FIFO topic contract gap is a runtime-breaking issue in deployed environments.
