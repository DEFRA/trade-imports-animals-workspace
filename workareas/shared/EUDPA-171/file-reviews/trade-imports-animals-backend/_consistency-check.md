# Consistency Check: trade-imports-animals-backend

**Ticket:** EUDPA-171
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #50 | **Commit:** e2ce89c

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Amend HTTP contract `POST /notifications/{ref}/amend` | frontend ✅ (client calls it), tests ✅ (exercises via UI) | ✅ Endpoint defined in `NotificationController.amend` | CONSISTENT |
| `AMEND` lifecycle status | frontend ✅ (`status === 'AMEND'` templates), tests ✅ (`amendStatusTag`) | ✅ New `NotificationStatus.AMEND` enum value | CONSISTENT |
| Outbox event wire string `…NotificationSubmissionAmended` | tests ✅ (`NOTIFICATION_SUBMISSION_AMENDED_EVENT_TYPE` constant) | ✅ `OutboxEventType.NOTIFICATION_SUBMISSION_AMENDED` value | CONSISTENT |
| Status round-trip SUBMITTED → AMEND → SUBMITTED | frontend ✅ (submit accepts AMEND view), tests ✅ (lifecycle spec) | ✅ `submitNotification` now accepts DRAFT or AMEND | CONSISTENT |
| AMEND added to allow-lists (copy/delete/findAll) | frontend ✅ (dashboard renders AMEND rows), tests N/A | ✅ copy, softDelete, findAll all include AMEND | CONSISTENT |

## Missing Changes

*None identified.* The backend is the source of the HTTP contract, the new
status enum, and the new outbox event type. Every cross-repo dependency
on these (frontend client + templates, tests' wire-string constant) is
present and matches the backend definitions.

## Unique Changes

- **`OutboxEventRepository` `@Query` removal** — the explicit
  `@Query(value/sort/fields)` annotation on
  `findTopByAggregateIdOrderByAggregateVersionDesc` is deleted, leaving the
  derived query method. Backend-internal refactor with no cross-repo
  surface; the backend unit test
  `appendEvent_shouldIncrementFromHighestVersion…` and the tests-repo E2E
  aggregate-version assertions confirm behaviour is preserved. Not
  suspicious — flag for the per-file reviewer to confirm the derived method
  still returns the highest version (projection was previously narrowed to
  `aggregateVersion` only; the full document is now hydrated).
- **`writeWithOutbox` extraction** — submit/amend now share a private
  helper. Backend-internal; no peer-repo equivalent expected.
- **Trailing newline** — `OutboxEventType.java` ends without a final
  newline (`\ No newline at end of file`). Style nit for the per-file
  reviewer, not a consistency issue.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found
**Summary:** Backend defines the amend contract, AMEND status, and the new
outbox event type; all three are correctly mirrored by the frontend and
tests repos with no gaps.
