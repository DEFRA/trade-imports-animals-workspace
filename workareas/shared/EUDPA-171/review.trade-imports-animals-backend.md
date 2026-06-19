# Repository Review: trade-imports-animals-backend

**PR:** #50
**Commit:** e2ce89cec2ffa9f630c89feb60db071901cee072
**Files Changed:** 9

## Summary
Adds the amend workflow to the notification domain: a new `AMEND` status, a
`POST /notifications/{ref}/amend` endpoint, an `amendNotification()` service
method that transitions SUBMITTED → AMEND and emits an outbox event, and a new
`OutboxEventType` enum so the outbox can distinguish submitted vs amended
events. `submitNotification()` now accepts AMEND as a source state to support
the AMEND → SUBMITTED resubmission round-trip.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java` | RISKY* | 2 | 1 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationStatus.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxEventRepository.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxEventType.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/outbox/OutboxService.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java` | SAFE | 0 | 0 | 3 |

\* The 2 "Critical" findings on `NotificationController.java` are **false
positives** (auto-resolved below). The per-file reviewer claimed
`amendNotification()` and the `AMEND` enum value don't exist; both were verified
present in the clone (`NotificationService.java:146`, `NotificationStatus.java:4`).
The consistency reviewer independently confirmed the contract is intact.

## Positive Observations
- `writeWithOutbox()` helper cleanly extracts the shared save+outbox pattern so
  submit and amend share one transactional path.
- `OutboxEventType` carries the wire-format string as an enum value — type-safe
  and asserted byte-for-byte by the tests repo.
- Removing the redundant `@Query` on `findTopByAggregateIdOrderByAggregateVersionDesc`
  (it projected only `aggregateVersion` while returning the full entity) is a
  correct simplification to the derived-name query.
- Comprehensive service-level error-path coverage (DRAFT rejection, already-AMEND,
  missing ref, lock failure, outbox failure).

## Test Coverage
- Unit tests: Strong. `NotificationServiceTest` covers the AMEND happy path,
  ordering, and 5+ error paths; `OutboxServiceTest` covers both event types and
  version-increment regression.
- Integration tests: E2E coverage lives in the tests repo (outbox-event spec).

## Risk Assessment
**Overall Risk:** Low
**Rationale:** Core logic is sound and well-tested; remaining real findings are a
doc-string wording nit, one thin controller-test assertion, and Given/When/Then
comment-style nits.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java | 95 | Critical | correctness | Call to notificationService.amendNotification() which does not exist in NotificationService | Implement amendNotification() method in NotificationService that transitions notification from SUBMITTED to AMEND status and appends outbox event | Auto-Resolved | — | False positive: NotificationService.amendNotification() exists at line 146 (verified in clone). Reviewer didn't read the service file. |
| 2 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java | 82 | Critical | correctness | AMEND status is used in endpoint but NotificationStatus enum only defines DRAFT, SUBMITTED, DELETED; AC3 requires AMEND status | Add AMEND value to NotificationStatus enum to support the amend workflow per AC3 | Auto-Resolved | — | False positive: AMEND is in NotificationStatus enum line 4 (DRAFT, SUBMITTED, AMEND, DELETED), verified in clone. |
| 3 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java | 67 | Major | correctness | submit endpoint description no longer accurately reflects the sole source state; updated description mentions both DRAFT and AMEND but should clarify the state machine | Update description to: 'Transitions notification status from DRAFT or AMEND to SUBMITTED' for clarity |  |  |  |
| 4 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java | 349 | Major | test-completeness | Test amend_shouldPassTraceIdAsCorrelationId only verifies the service was called; it lacks assertions on the response body to verify behaviour | Add body assertions like in test 1: .andExpect(jsonPath("$.referenceNumber").value(REF_1)) and .andExpect(jsonPath("$.status").value("AMEND")) |  |  |  |
| 5 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java | 168 | Minor | style | Missing comment block before invocation of appendEvent in new amend test | Add // When comment block before line 168 for consistency with other tests |  |  |  |
| 6 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java | 156 | Minor | style | New test missing explicit // When comment block between setup and invocation | Add // When comment on line 167 before the outboxService.appendEvent() call for consistency with other tests in this class |  |  |  |
| 7 | src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java | 177 | Minor | style | Second new test also missing explicit // When comment block | Add // When comment before line 199 (outboxService.appendEvent() call) for consistency with established test pattern |  |  |  |

## Repository Verdict
**Status:** NEEDS ATTENTION (low — real findings are minor; both criticals are false positives)
