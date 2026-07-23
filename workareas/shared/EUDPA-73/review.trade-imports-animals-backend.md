# Repository Review: trade-imports-animals-backend

**PR:** #65
**Commit:** 6a828aec3265de0ce246e3653c0af6b34f0be24b
**Files Changed:** 8

## Summary

Adds an optional `referenceNumber` query parameter to `GET /notifications`,
resolved via a new `findByReferenceNumberAndStatusIn` derived repository
method so the search honours the same DRAFT/SUBMITTED/AMEND filter the
dashboard list already applies. The single Optional result is wrapped in a
`PageImpl` so the endpoint keeps returning a `NotificationPageResponse`.
Alongside this, `GlobalExceptionHandler` gains a
`ConstraintViolationException` handler, which converts `@Validated`
method-parameter failures into RFC 7807 400s instead of letting them fall
through to the `RuntimeException` handler's 500.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/main/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandler.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java` | SAFE | 0 | 0 | 1 |
| `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java` | RISKY | 1 | 1 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandlerTest.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java` | SAFE | 0 | 0 | 2 |
| `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java` | NEEDS ATTENTION | 0 | 1 | 1 |

## Positive Observations

- Search reuses the existing dashboard status filter, so soft-deleted
  notifications correctly disappear from search results — and there is an
  integration test (`findAll_shouldReturnEmptyPage_whenReferenceNumberIsDeleted`)
  that proves it.
- `StringUtils.trimToNull` gives clean "blank means no search" semantics
  and there is a unit test pinning the trimming behaviour.
- The `ConstraintViolationException` handler is a genuine latent-bug fix:
  the controller is `@Validated` with `@Min(1) int page`, so before this PR
  a `page=0` request produced a 500 rather than a 400.
- The `@Operation` description was updated so the OpenAPI document
  documents the new parameter.
- `verify(notificationRepository, never()).findAllByStatusIn(...)` in the
  new service tests correctly proves the search path short-circuits the
  list query.

## Test Coverage

- **Unit tests:** Good breadth — `NotificationServiceTest` covers match,
  no-match and trimming; `NotificationControllerTest` verifies the new
  parameter reaches the service and updates every existing `findAll` stub
  for the new arity. All three new service tests use page 1, so the paging
  defect below is unexercised.
- **Integration tests:** Four new `NotificationIT` cases cover AC1
  (exact match returns only that notification), AC2 (unknown reference
  returns an empty page), soft-deleted references, and free-text input.
  Nothing combines `referenceNumber` with `page` or `sort`.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** The happy path is correct and well covered, but the
`PageImpl` construction returns a wrong `totalElements`/`totalPages` and
repeats the match on every page when the client asks for `page > 1`, and
the endpoint's validation contract disagrees with what the frontend and
this repo's own exception-handler test assume.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/main/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandler.java | 67 | Major | duplication | handleConstraintViolationException duplicates ~30 lines of handleValidationException verbatim (same type URI, title, detail, traceId property and errors map assembly), differing only in how the field name is derived | Extract a private buildValidationProblemDetail(Map<String, List<String>> errors) helper and have both handlers call it |  |  |  |
| 2 | src/main/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandler.java | 84 | Minor | correctness | Field name is derived by taking the substring after the last '.' in the property path, which collapses nested paths (e.g. 'save.dto.origin.countryCode' becomes 'countryCode') and can silently merge two distinct violations under one key | Strip only the leading method-name segment (substring after the first '.') so nested paths stay distinguishable |  |  |  |
| 3 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java | 141 | Major | validation | referenceNumber is accepted with no @Pattern/@Size constraint even though every other reference-number parameter on this controller carries @Pattern(ReferenceNumberGenerator.REFERENCE_NUMBER_PATTERN), so arbitrary free text of unbounded length reaches the Mongo query | Decide the contract: either add @Pattern (and let the new ConstraintViolationException handler return 400) or document that free text deliberately yields an empty page and add @Size to cap length |  |  |  |
| 4 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java | 142 | Minor | logging | The debug log line interpolates the raw referenceNumber query param, echoing unvalidated user input into logs | Drop referenceNumber from the log line or log it only once validated/trimmed by the service |  |  |  |
| 5 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java | 15 | Minor | performance | findByReferenceNumberAndStatusIn queries referenceNumber + status but the Notification document declares no @Indexed/@CompoundIndex, so the dashboard search is a collection scan on every keystroke-driven request | Add an index on referenceNumber (it is already the natural key) via @Indexed on the Notification field or a compound index definition |  |  |  |
| 6 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 130 | Critical | correctness | PageImpl is built with the caller's pageable (offset = (page-1)*25), so a reference search on page>1 self-corrects total to offset+1 — GET /notifications?referenceNumber=X&page=2 reports totalElements=26, totalPages=2 and repeats the same single match on every page | Build the single-hit page against page 0 (e.g. PageRequest.of(0, listPageSize, sort)), or return Page.empty(pageable) when page > 1 |  |  |  |
| 7 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 115 | Major | dead-code | The two-arg findAll(page, sort) overload now has no production caller — NotificationController calls the three-arg form; only NotificationServiceTest still exercises it | Delete the two-arg overload and update NotificationServiceTest to call findAll(page, sort, null) |  |  |  |
| 8 | src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java | 126 | Minor | logging | Unsanitised user-supplied referenceNumber is written straight into two debug log statements, so arbitrary free text (including newlines) reaches the log stream | Log the trimmed reference only after it passes a format check, or cap/sanitise it before logging |  |  |  |
| 9 | src/test/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandlerTest.java | 89 | Major | test-fidelity | The test fixture mocks a violation on 'findAll.referenceNumber' with a REFERENCE_NUMBER_PATTERN message, but findAll's referenceNumber param carries no @Pattern — the scenario under test cannot occur in production and gives false confidence that search input is validated | Either add @Pattern to the controller param (making the fixture real) or rewrite the fixture around a violation that actually fires, e.g. @Min(1) on page |  |  |  |
| 10 | src/test/java/uk/gov/defra/trade/imports/animals/exceptions/GlobalExceptionHandlerTest.java | 110 | Minor | coverage | The new test asserts only status, title and the errors map — unlike the sibling MethodArgumentNotValid tests it never checks the null-traceId branch or the problem type URI/content type | Add a handleConstraintViolationException_shouldHandleNullTraceId case mirroring the existing handleValidationException_shouldHandleNullTraceId |  |  |  |
| 11 | src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java | 159 | Major | coverage | No integration test covers reference search combined with page>1 or with a sort, which is exactly where the PageImpl total self-correction defect surfaces (totalElements becomes 26) | Add findAll_shouldReturnSinglePage_whenReferenceNumberProvidedWithPageTwo asserting content is empty and totalElements is 1 |  |  |  |
| 12 | src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java | 1492 | Minor | correctness | findAllNotificationsPage appends referenceNumber to the query string without URL-encoding, so any test value containing '&' or a space would silently build a different request | Build the URI with UriComponentsBuilder or URLEncoder.encode so the helper is safe for arbitrary search terms |  |  |  |
| 13 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java | 4 | Minor | unused-import | New static import of org.mockito.ArgumentMatchers.anyInt is never used anywhere in the file | Remove the unused anyInt import |  |  |  |
| 14 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java | 546 | Minor | test-naming | findAll_shouldPassInvalidReferenceNumberToService is functionally identical to findAll_shouldPassReferenceNumberParam (same stub, same verify) — the only difference is the literal, so it asserts nothing about invalid input beyond pass-through | Merge into a parameterised test, or make the intent explicit by asserting the response status is 200 and no ConstraintViolationException path is taken |  |  |  |
| 15 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java | 407 | Major | coverage | The three new findAll tests all use page 1, so none catches the PageImpl total self-correction that makes reference search return totalElements=26 on page 2 | Add findAll_shouldNotRepeatMatch_whenReferenceNumberProvidedWithPageTwo asserting totalElements is 1 (or content empty) for page 2 |  |  |  |
| 16 | src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java | 448 | Minor | assertion | findAll_shouldTrimReferenceNumber_beforeLookup stubs an empty Optional and only verifies the repository call, so it would still pass if the returned page were built incorrectly | Stub a match and additionally assert the returned content resolves to the trimmed reference |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION

One Critical (`PageImpl` pagination totals) plus five Major items. The
Critical is a contained, one-line fix; the Major items are mostly about
deciding and then encoding a single validation contract for the new
parameter, and removing the now-orphaned two-arg `findAll` overload.
