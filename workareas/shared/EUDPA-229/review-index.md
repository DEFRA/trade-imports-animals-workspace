# Code Review: EUDPA-229

**Ticket:** Process outbox event and publish to SNS Topic
**Reviewer:** Claude Code Agent
**Date:** 2026-06-19
**Verdict:** CONCERNS → **STILL HAS CONCERNS**
**Last Updated:** 2026-06-19

## Summary

Implements the publish half of the transactional outbox pattern (ADR-EUDP-001). All 20 findings from the initial review have been addressed in the updated commits — FIFO topic `MessageGroupId` added, null-safety gaps closed, config validation hardened, test quality improved. One new critical finding: `compose/start-floci.sh` uses `awslocal` instead of the `aws()` wrapper function for SNS topic creation.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------|---------------|---------|--------|
| cdp-app-config | #3764 | 868aa0b | 2 | SAFE | [review.cdp-app-config.md](review.cdp-app-config.md) |
| trade-imports-animals-backend | #49 | 3545d53 | 15 | STILL HAS CONCERNS | [review.trade-imports-animals-backend.md](review.trade-imports-animals-backend.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | Unpublished event is published to SNS and `publishedAt` set | Yes | FIFO `MessageGroupId` now set when topicArn ends with `.fifo` |
| 2 | Already-published events are not republished | Yes | `findByPublishedAtIsNull` query excludes them |
| 3 | Failed publishes are retried on next run | Yes | `break` on failure leaves event unpublished; poller retries next cycle |
| 4 | Events published in ascending `aggregateVersion` order | Yes | Repository query sorts by `aggregateId ASC, aggregateVersion ASC` |
| 5 | Message attributes for eventType and correlation/schema metadata | Yes | `buildMessageAttributes` sets all three |
| 6 | ShedLock distributed lock prevents concurrent polling | Yes | `LockingTaskExecutor` with configurable lock timings |
| 7 | Poll interval (2s) and batch size (10) are configurable | Yes | Via `OutboxConfig` with defaults matching ADR-EUDP-001 |
| 8 | Topic ARN set per environment via env var | Yes | `${OUTBOX_SNS_TOPIC_ARN:}` in YAML, set in cdp-app-config |
| 9 | Unit tests and integration test present | Yes | 3 test files; integration test uses Testcontainers + LocalStack |

## Test Coverage Assessment

- **Unit Tests:** Present — `OutboxPollerTest` now asserts observable behavior (log output, lock config values, Given/When/Then structure). `OutboxPublishServiceTest` has return value assertions and 5 new tests added.
- **Integration Tests:** Present — `OutboxPollerIT` resource leak fixed (`@AfterAll` teardown), ordering assertion added, string constant extracted.

## Configuration & Environment

- **New Environment Variables:** `OUTBOX_SNS_TOPIC_ARN` (set in cdp-app-config for dev and test)
- **Database Changes:** New `publishedAt` field on `OutboxEvent` with partial compound index `unpublished_poll`

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Low — FIFO `MessageGroupId` now handled; null-safety fixed |
| Code Quality | Low — clean separation, follows existing patterns |
| Security | Low — no secrets, proper credential resolution |
| Test Coverage | Low — all quality issues addressed; ordering assertion added |

## Refresh Summary (2026-06-19)

**Files refreshed:** 20
**Prior items addressed:** 20/20
**New items added:** 2 (1 critical in `start-floci.sh`, 1 noise from shared cdp-app-config repo)

| # | Change | File:Line | Severity | Issue |
|---|--------|-----------|----------|-------|
| 1 | ➕ New | `compose/start-floci.sh:37` | Critical | Uses `awslocal` instead of `aws()` wrapper for SNS topic creation |
| 2 | ➕ New (noise) | `cdp-app-config: grants-ui-backend env` | Major | Out-of-scope change from shared config repo |

## Conclusion

All 20 initial findings have been addressed. The implementation is now production-ready with proper FIFO topic support, null-safety, config validation, and test quality. One remaining critical issue: `compose/start-floci.sh` uses `awslocal` for SNS topic creation instead of the `aws()` wrapper function used by all other AWS CLI calls in the file — this will break in the floci-init container context. Total items: 22 (20 prior + 2 new), all pending triage.
