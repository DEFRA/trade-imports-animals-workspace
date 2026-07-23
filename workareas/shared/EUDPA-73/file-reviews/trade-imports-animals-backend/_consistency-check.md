# Consistency Check: trade-imports-animals-backend

**Ticket:** EUDPA-73
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #65 | **Commit:** 6a828ae

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `referenceNumber` search query param | frontend ✅ (`notification-client.js` sets `url.searchParams`), tests ✅ (`?referenceNumber=` asserted in URL) | ✅ `@RequestParam(required = false) String referenceNumber` | CONSISTENT |
| Trim-before-use of the search term | frontend ✅ (`parseReferenceNumber` trims, blank → `undefined`) | ✅ `StringUtils.trimToNull` | CONSISTENT |
| Dashboard status filter (DRAFT/SUBMITTED/AMEND) applied to search | frontend ❌ (relies on backend), tests ✅ (soft-delete case) | ✅ `findByReferenceNumberAndStatusIn` | CONSISTENT |
| **400 response for a malformed reference** | frontend ✅ (`err.status === statusCodes.badRequest` → empty-search view; test asserts it) | ❌ No `@Pattern` on the param; `NotificationIT.findAll_shouldReturnEmptyPage_whenReferenceNumberInvalid` asserts **200 + empty page** | **INCONSISTENT** |
| Reference-number `@Pattern` validation on API params | n/a (Java-only pattern) | ⚠️ Applied to all 8 `@PathVariable referenceNumber` params but **not** to the new `@RequestParam referenceNumber` | **INCONSISTENT (internal)** |
| Pagination metadata contract (`totalElements`/`totalPages`) | frontend ✅ consumes via `mapPaginatedResponse` and builds next/prev links carrying `referenceNumber` | ⚠️ `PageImpl` self-corrects total to `offset + 1` when `page > 1` | **INCONSISTENT** |
| Search-term URL encoding | frontend ✅ (`URLSearchParams`) | ⚠️ `NotificationIT.findAllNotificationsPage` concatenates raw string | Test-only gap |
| Test changes accompany logic changes | frontend ✅, tests ✅ | ✅ unit + controller + IT all updated | CONSISTENT |
| Dependency bumps | frontend ⚠️ (`hapi-pulse` 3→4, `@defra/cdp-auditing` 0.6.0→0.6.1) | ❌ No `pom.xml` change | Expected — unshared deps |
| API documentation | n/a | ✅ `@Operation` description updated for `referenceNumber` | CONSISTENT |

## Missing Changes

1. **`@Pattern` on the new `referenceNumber` request param.** Every other
   reference-number parameter on `NotificationController` (lines 62, 78, 95,
   111, 125, 166, 182, 200) carries
   `@Pattern(regexp = ReferenceNumberGenerator.REFERENCE_NUMBER_PATTERN)`.
   The new `findAll` param (line 141) does not. Two artifacts in this PR
   assume it does:
   - `GlobalExceptionHandlerTest.handleConstraintViolationException_...`
     mocks a violation on `findAll.referenceNumber` with the
     REFERENCE_NUMBER_PATTERN message — a scenario the controller cannot
     currently produce.
   - The frontend's `controller.js` 400-handling branch and its test
     `Should show No notifications found when backend rejects search with
     bad request`.

   The team needs to pick one contract. Either is defensible (200 + empty
   page is arguably friendlier for a free-text box labelled "Keyword or
   reference"), but three of the four artifacts currently encode the
   *other* one.

2. **Index on `referenceNumber`.** `Notification` carries no `@Indexed`
   annotation and no index is created in resources, so the new
   `findByReferenceNumberAndStatusIn` is a collection scan. Pre-existing
   for `findByReferenceNumber`, but this PR puts it on a user-triggered
   hot path.

## Unique Changes

- **`GlobalExceptionHandler.handleConstraintViolationException`** — new and
  backend-only, as expected. It is a genuine improvement (previously a
  `@Validated` param failure such as `page=0` fell through to the
  `RuntimeException` handler and returned 500), but it is not what the
  ticket asked for and is untested against a violation that can actually
  fire on this controller.
- **`NotificationService.findAll(int, String)` two-arg overload retained** —
  now has no production caller. Kept only so the existing unit tests
  compile unchanged. Intentional-looking but leaves dead API surface.

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 3 inconsistencies found (400-vs-200 contract, missing `@Pattern`
parity with sibling params, pagination total contract)
**Summary:** The search param is wired through correctly and well tested on
page 1, but the backend's actual error contract (200 + empty page) disagrees
with what the frontend, the frontend's tests and this repo's own
`GlobalExceptionHandlerTest` fixture assume (400), and `PageImpl` reports a
wrong `totalElements` when a reference search is requested beyond page 1.