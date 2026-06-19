# Code Review: EUDPA-229

**Ticket:** Process outbox event and publish to SNS Topic
**Reviewer:** Claude Code Agent
**Date:** 2026-06-19
**Verdict:** CONCERNS

## Summary

Implements the publish half of the transactional outbox pattern (ADR-EUDP-001) — a scheduled poller reads unpublished events from MongoDB under a distributed lock and publishes each to SNS. The architecture is sound and the code is well-structured, but a critical cross-repo consistency issue (FIFO topic requires `MessageGroupId`) will cause runtime failures in deployed environments, and the publish service has null-safety gaps that could cause NPEs.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------|---------------|---------|--------|
| cdp-app-config | #3764 | 66c07e4 | 2 | SAFE | [review.cdp-app-config.md](review.cdp-app-config.md) |
| trade-imports-animals-backend | #49 | 4b73a20 | 15 | NEEDS ATTENTION | [review.trade-imports-animals-backend.md](review.trade-imports-animals-backend.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | Unpublished event is published to SNS and `publishedAt` set | Partial | Code is correct but will fail on FIFO topics without `MessageGroupId` (item #20) |
| 2 | Already-published events are not republished | Yes | `findByPublishedAtIsNull` query excludes them |
| 3 | Failed publishes are retried on next run | Yes | `break` on failure leaves event unpublished; poller retries next cycle |
| 4 | Events published in ascending `aggregateVersion` order | Yes | Repository query sorts by `aggregateId ASC, aggregateVersion ASC` |
| 5 | Message attributes for eventType and correlation/schema metadata | Yes | `buildMessageAttributes` sets all three |
| 6 | ShedLock distributed lock prevents concurrent polling | Yes | `LockingTaskExecutor` with configurable lock timings |
| 7 | Poll interval (2s) and batch size (10) are configurable | Yes | Via `OutboxConfig` with defaults matching ADR-EUDP-001 |
| 8 | Topic ARN set per environment via env var | Yes | `${OUTBOX_SNS_TOPIC_ARN:}` in YAML, set in cdp-app-config |
| 9 | Unit tests and integration test present | Yes | 3 test files; integration test uses Testcontainers + LocalStack |

## Test Coverage Assessment

- **Unit Tests:** Present — `OutboxPollerTest` and `OutboxPublishServiceTest` cover core paths. Quality improvements needed (mock-focused assertions, missing return value checks, no Given/When/Then structure).
- **Integration Tests:** Present — `OutboxPollerIT` exercises the full LocalStack path. Has resource leak and missing ordering assertion.

## Configuration & Environment

- **New Environment Variables:** `OUTBOX_SNS_TOPIC_ARN` (set in cdp-app-config for dev and test)
- **Database Changes:** New `publishedAt` field on `OutboxEvent` with partial compound index `unpublished_poll`

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | High — FIFO topic `MessageGroupId` missing (item #20) will cause runtime failures |
| Code Quality | Low — clean separation, follows existing patterns |
| Security | Low — no secrets, proper credential resolution |
| Test Coverage | Medium — tests present but quality issues and missing ordering assertion |

## Conclusion

The implementation is architecturally sound and follows established patterns well. However, a critical cross-repo gap — the deployed environments use FIFO SNS topics but the publish code doesn't set the required `MessageGroupId` — will cause `InvalidParameterException` at runtime. This must be fixed before merge. The null-safety issues in `OutboxPublishService` and config validation gaps in `OutboxConfig` should also be addressed. The 20 review items break down as: 3 critical, 11 major, 6 minor.
