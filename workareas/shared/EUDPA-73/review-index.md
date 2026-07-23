# Code Review: EUDPA-73

**Ticket:** Skeleton: Search a notification
**Reviewer:** Claude Code Agent
**Date:** 2026-07-23
**Verdict:** CONCERNS

## Summary

Adds exact-reference search to the GBN-AGN dashboard across all three
repos: an optional `referenceNumber` query parameter on
`GET /notifications`, a server-rendered GET search form on the frontend
that preserves search state across sort and pagination, and e2e plus a11y
coverage for both acceptance criteria. Both AC are met on the happy path
and are tested at every level of the pyramid. Two things hold it back: a
pagination defect that makes a reference search beyond page 1 report a
wrong `totalElements` and repeat the match, and an unresolved disagreement
between the repos about whether a malformed reference should produce a
400 or a 200 with an empty page.

## Repositories Analyzed

| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-backend | #65 | 6a828ae | 8 | NEEDS ATTENTION | [review.trade-imports-animals-backend.md](review.trade-imports-animals-backend.md) |
| trade-imports-animals-frontend | #157 | 5c778bd | 10 | NEEDS ATTENTION | [review.trade-imports-animals-frontend.md](review.trade-imports-animals-frontend.md) |
| trade-imports-animals-tests | #90 | 631e185 | 4 | SAFE | [review.trade-imports-animals-tests.md](review.trade-imports-animals-tests.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| AC1 | Search by complete notification reference returns only the matching notification | ✅ Yes | Covered end-to-end: `NotificationIT.findAll_shouldReturnMatchingNotification_whenReferenceNumberProvided`, the frontend controller test, and the e2e `returns matching notification when searching by complete reference number`. Caveat: correct only on page 1 — see backend item 6. |
| AC2 | No matching notification shows "No notifications found" and no results | ✅ Yes | Covered at all three levels. The frontend also suppresses the error summary for free-text input, and the e2e asserts that negative explicitly. |
| — | Search is a tactical, non-strategic implementation | ✅ Yes | Exact match only, no index, no scoring — appropriately minimal for a skeleton story. |
| — | Ticket comment: use search to de-flake status-dependent dashboard tests | ❌ No | Addressed with `seedNotifications(1)` and visibility waits instead; the `// TODO: once dashboard filtering exists` comment and the commented-out `copyAsNew` assertion both remain. Reasonable to defer, but should be an explicit decision. |

## Test Coverage Assessment

- **Unit Tests:** Present — new cases in `NotificationServiceTest`,
  `NotificationControllerTest`, `GlobalExceptionHandlerTest`,
  `notification-client.test.js`, `notification-helper.test.js` and
  `controller.test.js`. Well distributed, no logic duplicated upward.
- **Integration Tests:** Present — four new `NotificationIT` cases
  (match, unknown reference, soft-deleted reference, free text) and a
  five-case Playwright search spec plus two new axe scans.
- **Notable gap:** nothing at any level exercises reference search
  combined with `page > 1`. That is exactly where the backend defect
  lives, which is why three test suites all passed over it.

## Configuration & Environment

- **New Environment Variables:** None.
- **Database Changes:** None. A new derived query
  (`findByReferenceNumberAndStatusIn`) runs against `referenceNumber` +
  `status` with no index declared on the `Notification` document, so the
  dashboard search is a collection scan.
- **Dependencies:** `hapi-pulse` 3.0.1 → 4.0.0 (major) and
  `@defra/cdp-auditing` 0.6.0 → 0.6.1 in the frontend, plus wide
  transitive lockfile drift. Unrelated to this ticket.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Medium |
| Code Quality | Medium |
| Security | Low |
| Test Coverage | Medium |

## Conclusion

The feature is well built and genuinely satisfies both acceptance criteria,
with test coverage at the right levels and no duplication between them.
Before merge, two things want a decision rather than just a fix: the
`PageImpl` construction in `NotificationService.findAll` (one Critical, a
one-line change), and which error contract the team wants for a malformed
reference — the backend currently returns 200 with an empty page, while the
frontend's fallback branch, the frontend's test for it, and the backend's
own `GlobalExceptionHandlerTest` fixture all assume a 400. Full item lists
and per-file detail are in each `review.{repo}.md`.