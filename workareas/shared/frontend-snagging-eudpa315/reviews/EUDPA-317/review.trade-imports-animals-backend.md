# Repository Review: trade-imports-animals-backend

**PR:** #74
**Commit:** 3703e11cfb546a99d9bf3ef4f38eeecaf54f387e
**Files Changed:** 10

## Summary

This repo carries the whole of the EUDPA-317 fix. It resolves the ticket's open decision gate as **option (b)** — `NotificationFulfilmentsService.copy` now calls the new `NotificationService.createCopyAtReference(sourceRef, newRef)` inside its existing `@Transactional` boundary, so one Idempotency-Key-guarded call leaves both the fulfilments document and the paired Notification at one shared reference. In the same stroke it rules the ticket's second gate question — whether copy-as-new resets logistical fields — as **no, copy verbatim**: `NotificationCopyMapper` (and its 296-line test) is deleted, `POST /notifications/{ref}/copy` is retired from the controller, and the replacement `toContentDto` carries every content field across unchanged. That ruling is the one the acceptance criteria demand ("the copied notification carries the source's answers") and it aligns real mode with the stub that defines current product behaviour.

The deletions are clean — no dangling references to `NotificationCopyMapper`, `copyNotification` or the retired endpoint survive anywhere in `src/`, in the frontend adapter, or in the tests repo.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationCopyMapper.java` | SAFE | 0 | 0 | 0 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java` | NEEDS ATTENTION | 0 | 2 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notificationfulfilments/NotificationFulfilmentsService.java` | SAFE | 0 | 0 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationFulfilmentsIT.java` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java` | SAFE | 0 | 0 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationCopyMapperTest.java` | SAFE | 0 | 0 | 0 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java` | SAFE | 0 | 0 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notificationfulfilments/NotificationFulfilmentsServiceTest.java` | NEEDS ATTENTION | 0 | 1 | 0 |

## Positive Observations

- **The dual write is genuinely transactional.** `MongoConfig` registers a `MongoTransactionManager` and `IntegrationBase` starts `mongo:7.0` with a replica set, so the `@Transactional` boundary on `copy()` is real rather than decorative — a failure on the notification-side write rolls back the fulfilments insert.
- **No dependency cycle** introduced: `NotificationService` has no reference back to the fulfilments package.
- **Idempotency semantics preserved**, which was the whole argument for option (b) over option (a). The replay path returns early on the idempotency-key lookup, and a new IT pins that a replayed key creates exactly one notification.
- **Coverage was relocated, not lost.** Every assertion in the deleted `NotificationCopyMapperTest` and the five deleted `NotificationIT` copy tests maps onto a surviving test — the retained-fields nest onto `createCopyAtReference_shouldCarryTheSourceContentVerbatim`, the status guard onto the fulfilments-side `isCopyable`, and the excluded-fields/null-safety nests are obsolete by the verbatim ruling.
- **The new IT suite is stronger against the AC than what it replaced** — `copy_shouldCreateTheNotificationAtTheCopyReference` asserts the copy appears in `GET /notifications`, which is the dashboard list source and the exact assertion whose absence let the snag ship.
- The fixture rename from `INTERNAL-DO-NOT-COPY` to `INTERNAL-REF-1` is correct: the old name encoded the now-deleted reset semantics and would have been actively misleading. The tests repo asserts the same literal.

## Test Coverage

- **Unit tests:** Good. `NotificationServiceTest.CreateCopyAtReference` adds four tests including the unknown-source empty-draft case, and `verify(referenceNumberGenerator, never()).generate()` correctly guards against the service re-minting a reference. The gap is `NotificationFulfilmentsServiceTest`, where the new `NotificationService` mock exists only to satisfy the constructor — the three reference-collision paths an IT cannot induce have no assertion on the notification-side write (item 8).
- **Integration tests:** Good but incomplete. Seven new copy tests in `NotificationFulfilmentsIT` cover creation-at-reference, dashboard listing, idempotent replay, orphan-source and the 400 paths. The missing leg is a submit against the copy — the snag's actual reported symptom and AC 3 (item 5).

## Risk Assessment

**Overall Risk:** Low
**Rationale:** The implementation is correct, transactional and well covered; the findings are a maintainability drift-guard, an unenforced-by-annotation atomicity contract, and three test-coverage gaps — none of which breaks the shipped behaviour.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 373 | Major | maintainability | toContentDto hand-lists the 12 content fields of NotificationBase with no drift guard, so a field added to NotificationBase (which both Notification and NotificationDto extend) is silently dropped from every copy, breaking the AC 'the copied notification carries the source answers' with no compile or test failure; it also shallow-shares the source entity's Commodity/Operator/Transport/Origin instances with the copy, which both sibling mappers deliberately avoid. | Express the copy as a MapStruct method on a mapper interface (NotificationDto toCopyDto(Notification)) with unmappedTargetPolicy=ERROR, unmappedSourcePolicy=ERROR and mappingControl=DeepClone, mirroring NotificationContentSnapshotMapper; the deleted NotificationCopyMapper only avoided MapStruct because of the per-field reset rules this PR removes. |  |  |  |
| 2 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 101 | Major | transactions | createCopyAtReference is public and carries no @Transactional, yet its Javadoc asserts 'It runs in the caller's transaction, so a failure here rolls back the fulfilments insert; the two aggregates are only ever written together'. That guarantee is the whole point of the option (b) fix and is enforced by convention alone: every other write path in this class is annotated, and any caller that is not transactional (a future controller, a batch path) silently recreates the orphaned-fulfilments state this ticket exists to fix while the Javadoc still claims atomicity. | Annotate with @Transactional(propagation = Propagation.MANDATORY) so the documented precondition fails loudly at runtime instead of degrading to a non-atomic write; plain REQUIRED would be wrong here as it would open its own transaction and give per-aggregate rather than cross-aggregate atomicity. |  |  |  |
| 3 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 107 | Minor | logging | The empty-draft fallback on line 104 is invisible: log.info('Copying notification {} to {}') fires unconditionally and reads as a successful content copy even when no source notification existed. Orphaned fulfilments are reachable in production (deleteByReferenceNumbers and deleteExpired both remove notifications and documents but never touch the fulfilments collection), so a copy of one silently yields a blank notification with no trace to diagnose from. | Log at WARN inside the orElseGet branch naming the source reference (WARN is the level for 'unexpected but handled'), and keep the INFO line for the normal path. |  |  |  |
| 4 | src/main/java/uk/gov/defra/trade/imports/animals/notificationfulfilments/NotificationFulfilmentsService.java | 132 | Minor | error-handling | The new notificationService.createCopyAtReference call sits outside the try, so a notification-side DuplicateKeyException (NotificationBase.referenceNumber is @Indexed(unique=true, sparse=true)) is not caught by the MAX_REF_RETRIES loop; a reference that already exists as an orphan Notification with no paired fulfilments passes the fulfilments insert and then fails the whole copy instead of re-minting. | Move the createCopyAtReference call inside the same try block so a notification-side collision retries with a fresh reference like the fulfilments-side one already does. |  |  |  |
| 5 | src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationFulfilmentsIT.java | 453 | Major | test-coverage | copy_shouldCreateTheNotificationAtTheCopyReference stops at existence and dashboard listing; no backend IT proves the copied notification is usable via POST /notifications/{ref}/submit, which is the snag's actual symptom (first submit 404'd onto the recoverable-error page) and is named in the ticket fix list and AC 3 | Add a submit leg after the GET /notifications assertion — POST /notifications/{copyRef}/submit expecting 200 and NotificationStatus.SUBMITTED, mirroring NotificationIT.submit_shouldTransitionStatusFromDraftToSubmitted (line 815) |  |  |  |
| 6 | src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java | 1741 | Minor | test-coverage | Deleting copy_shouldReturn404_whenSourceNotificationDoesNotExist drops the only test of copy-against-a-missing-source; the replacement suite in NotificationFulfilmentsIT covers 400-for-deleted and 400-for-missing-key but never 404-for-unknown-ref on POST /notification-fulfilments/{id}/copy | Add copy_shouldReturn404ForUnknownSource to NotificationFulfilmentsIT asserting isNotFound and the ref in $.detail, mirroring the existing GET 404 test at line 173 |  |  |  |
| 7 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java | 1433 | Minor | test-assertion-strength | createCopyAtReference_shouldCarryTheSourceContentVerbatim pins transport with assertThat(copy.getTransport()).isEqualTo(source.getTransport()), but production aliases the same Transport instance onto the copy, so this is a self-comparison; transport is the one retained group the deleted NotificationCopyMapper used to reset, and every other retained field here is pinned against an independently built expected value. | Assert against an independently constructed Transport (portOfEntry GBDVR, arrivalDate 2026-05-01, transporters().getFirst()), as the neighbouring CommodityComplement assertion already does. |  |  |  |
| 8 | src/test/java/uk/gov/defra/trade/imports/animals/notificationfulfilments/NotificationFulfilmentsServiceTest.java | 293 | Major | test-coverage | The NotificationService mock was added only to satisfy the new constructor arg — no unit test pins the notification-side write on the three collision paths that NotificationFulfilmentsIT cannot reach: copy_shouldRetryWhenCollisionHasNoConcurrentCreator (line 290) does not assert the Notification is created at the SURVIVING reference GBN-AG-26-NEW002 rather than the discarded GBN-AG-26-DUP001; copy_shouldReturnConcurrentlyCreatedCopyWhenCollisionResolvesToExisting (line 260) does not assert createCopyAtReference is never called, so a future change that clobbers the concurrent creator's Notification would stay green; copy_shouldThrowWhenReferenceRetriesAreExhausted (line 297) does not assert no orphan Notification write occurs. | Add verify(notificationService).createCopyAtReference(ID, "GBN-AG-26-NEW002") to the retry test, and verify(notificationService, never()).createCopyAtReference(any(), any()) to the concurrent-copy and retries-exhausted tests. |  |  |  |

## Consistency Notes

Full analysis in `file-reviews/trade-imports-animals-backend/_consistency-check.md` — verdict **CONSISTENT**, 0 inconsistencies. The copy contract lines up across all three repos: endpoint retirement is clean with no dangling caller, the copyable-status triple (DRAFT / SUBMITTED / AMEND) is identical to the frontend's new `COPYABLE_STATUSES`, idempotency semantics are pinned in all three, and the shared `INTERNAL-REF-1` fixture literal is used consistently.

Two cross-repo consequences worth naming:

1. **Notification-side reference collisions escape the retry loop** (item 4). Because `createCopyAtReference` runs after the `DuplicateKeyException` catch, the retry loop guards only the fulfilments unique index. Under option (b) the frontend makes exactly one call with no compensating retry, so this surfaces to the user as the recoverable-error page rather than being re-minted.
2. **Copies now become visible in `trade-imports-animals-admin`**, which reads `/notifications` and needs no code change — but that new visibility is untested in any repo in scope. Worth a line in the PR description.

## Repository Verdict

**Status:** NEEDS ATTENTION
