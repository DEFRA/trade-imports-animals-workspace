# Code Review: EUDPA-317

**Ticket:** Restore the notification-side write when copying a notification as new
**Reviewer:** Claude Code Agent
**Date:** 2026-08-10
**Verdict:** CONCERNS

## Summary

The EUDPA-317 fix itself is sound and complete. The PR set resolves the ticket's open decision gate as **option (b)** — the backend dual-writes both aggregates at one reference inside a real transaction, preserving the Idempotency-Key retry semantics — and simultaneously rules the second gate question as **copy verbatim, no logistical reset**, which is what the acceptance criteria demand. The contract is stated identically in all three repos and proved end-to-end.

The concern is not the fix. It is that the frontend and tests PRs carry a merged `fix/EUDPA-325-known-journey-guard` branch (16 of 17 frontend files, 3 of 4 tests commits) that removes the last client-side barrier to mutating any notification by reference, with **no compensating server-side scoping in any repo in scope**.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-backend | #74 | 3703e11 | 10 | NEEDS ATTENTION | [review.trade-imports-animals-backend.md](review.trade-imports-animals-backend.md) |
| trade-imports-animals-frontend | #191 | bbd8583 | 17 | RISKY | [review.trade-imports-animals-frontend.md](review.trade-imports-animals-frontend.md) |
| trade-imports-animals-tests | #106 | b1f165e | 6 | NEEDS ATTENTION | [review.trade-imports-animals-tests.md](review.trade-imports-animals-tests.md) |

## The decision gate, as resolved

The ticket parked two questions. Both are answered by the code, neither is recorded in the ticket:

| Question | Resolution in this PR set | Evidence |
|---|---|---|
| Which side mints the reference, and where does the dual write live? | **Option (b)** — backend. `NotificationFulfilmentsService.copy` calls `NotificationService.createCopyAtReference` inside the existing `@Transactional`. | `MongoTransactionManager` is configured; the fulfilments insert rolls back on a notification-side failure. |
| Does copy-as-new reset logistical fields? | **No — verbatim copy.** `NotificationCopyMapper` and `POST /notifications/{ref}/copy` deleted; `toContentDto` carries every content field. | Mandated by AC 5; aligns real mode with the stub that defines current product behaviour. |

Worth writing both rulings back into the ticket before merge — the ticket still presents them as open.

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | Copy from dashboard, return, search reference, see Draft card | Yes | `notification-dashboard.spec.ts` + backend IT asserting the copy in `GET /notifications`. Frontend `COPYABLE_STATUSES` is only exercised for DRAFT, not the SUBMITTED case the AC names (frontend item 3). |
| 2 | Open copy, change an answer, save — no error page | Yes | `notification-view-states.spec.ts`. The test never asserts the edit persisted (tests item 10). |
| 3 | Copy can be submitted, shows Submitted on dashboard | Yes (E2E only) | No backend IT proves the copy accepts `POST /notifications/{ref}/submit` — the snag's actual symptom (backend item 5). |
| 4 | Copy can be deleted, disappears from dashboard | **No** | The new delete spec deletes a fresh draft, not a copy, and duplicates an existing spec (tests item 6). |
| 5 | Copy carries the source's answers | Yes | Pinned twice in the tests repo. Comparison can pass vacuously if the seed never landed (tests item 3); `toContentDto` has no drift guard (backend item 1). |
| 6 | New reference, source unchanged | Yes | Structurally guaranteed — `createCopyAtReference` builds a new entity with a null `@Id` and never saves the source. |
| 7 | Retry behaviour stated and tested | Yes | Option (b) preserves Idempotency-Key dedupe; replay pinned in all three repos. |

## Test Coverage Assessment

- **Unit Tests:** Partial. Backend adds a solid `CreateCopyAtReference` suite; the `NotificationFulfilmentsServiceTest` mock is unasserted on three collision paths. Frontend dropped every session-scoping negative assertion across three files without replacement.
- **Integration Tests:** Present. Seven new copy ITs; missing the submit-against-a-copy leg.
- **E2E:** Present and the strongest evidence in the set, though three assertions can pass without proving what their names claim.

## Configuration & Environment

- **New Environment Variables:** None.
- **Database Changes:** None schema-side. Behavioural: copies now appear in `trade-imports-animals-admin` (which reads `/notifications`) for the first time — no code change needed, but untested in any repo in scope.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Low |
| Code Quality | Low |
| Security | **High** |
| Test Coverage | Medium |

## Findings

42 items total across three repos — 1 Critical, 8 Major, 33 Minor. Full detail and per-item fixes in each `review.{repo}.md`.

**Critical (1)**

- `frontend #4` — `engine/journey.test.js` inverts every session-scoping assertion, so the suite now certifies that any signed-in user can amend, copy or delete another user's notification by reference number.

**Major (8)**

- `frontend #2` — the guard removal itself: no per-user or per-org check remains on any mutating action.
- `frontend #9`, `#17` — the two controller tests that pinned ownership were rewritten into existence checks.
- `frontend #3`, `#5` — `COPYABLE_STATUSES` only tested for DRAFT; cancel-amend and soft-delete lost their only negatives.
- `backend #1` — `toContentDto` hand-lists 12 fields with no drift guard, so a new field on `NotificationBase` is silently dropped from every copy.
- `backend #2` — `createCopyAtReference` is public with no `@Transactional`, while its Javadoc asserts the atomicity guarantee that is the whole point of option (b).
- `backend #5`, `#8` — missing submit-against-a-copy IT; unasserted collision paths.
- `tests #3`, `#4`, `#6`, `#10` — vacuous comparison, invented test data, wrong delete subject, unasserted edit.

## Conclusion

Merge the backend PR on its own merit — it is the ticket's actual fix, it is correct, and its findings are hardening rather than blockers. The frontend and tests PRs need a decision first: the bundled EUDPA-325 work is genuinely entangled with EUDPA-317 (the new dashboard-row copy spec fails without it, because in real mode the dashboard lists rows the session never adopted), but it lands an unscoped-mutation change under a `Lowest`-priority snagging ticket with no compensating scoping anywhere. Either split it out with its own authorisation decision recorded, or record the exposure explicitly against the standing unscoped-notifications ticket before merging.
