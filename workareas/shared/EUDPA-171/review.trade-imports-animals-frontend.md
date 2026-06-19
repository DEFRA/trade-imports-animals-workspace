# Repository Review: trade-imports-animals-frontend

**PR:** #138
**Commit:** 9b2c9696c11c6d20e7c7e7cdacc4fa6d792ddcf8
**Files Changed:** 13

## Summary
Wires the amend journey into the frontend: a new `amend()` client method and
`amendNotification` helper, a `POST /notification-amend/{referenceNumber}` route
+ controller that calls the backend and redirects to the notification view, and
template changes adding an "Amend" action (dashboard + view), a yellow `AMEND`
status tag, and per-section Change links + a resubmit CTA while in AMEND state.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `src/server/common/clients/notification-client.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/clients/notification-client.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/helpers/__mocks__/notification-helpers.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/helpers/notification-helpers.js` | NEEDS ATTENTION | 0 | 2 | 0 |
| `src/server/common/helpers/notification-helpers.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/home/controller.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/home/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/notification-amend/controller.js` | NEEDS ATTENTION | 0 | 2 | 1 |
| `src/server/notification-amend/controller.test.js` | NEEDS ATTENTION | 1 | 1 | 0 |
| `src/server/notification-amend/index.js` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/server/notification-view/controller.test.js` | SAFE | 0 | 0 | 0 |
| `src/server/notification-view/index.njk` | SAFE | 0 | 0 | 0 |
| `src/server/router.js` | SAFE | 0 | 0 | 0 |

## Positive Observations
- `amend()` client method mirrors the existing `submitNotification`/`copy`
  patterns exactly (fetch, trace header, status-enriched error, logging) and has
  full success/error test coverage.
- Template status-tag refactor (inline ternary → explicit if/elif/else with
  `statusTagClass`) is clearer and makes AMEND support explicit and extensible.
- Strong controller-test coverage for amend visibility across DRAFT / SUBMITTED /
  AMEND states on both the dashboard and view screens.

## Test Coverage
- Unit tests: Good for client + helpers + templates. The new amend controller
  test has a setup gap (see item 6) and a weak assertion (item 7).
- Integration tests: Covered by the tests repo E2E specs.

## Risk Assessment
**Overall Risk:** Medium
**Rationale:** Two items warrant attention before merge — route-level param
validation is missing (the sibling `notification-view` route validates it) and
the amend POST controller lacks explicit `crumb` config that the
`notification-delete` controller carries. Both are worth the author confirming;
the rest are logging-style and a test-setup fix.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/server/common/helpers/notification-helpers.js | 56 | Major | logging | Log message uses string concatenation instead of structured object; violates static message pattern | Change to: logger.info({ referenceNumber }, 'Notification moved to amend') |  |  |  |
| 2 | src/server/common/helpers/notification-helpers.js | 59 | Major | logging | Error log passes only err.message instead of full error object; loses stack trace and type information | Change to: logger.error({ err, referenceNumber }, 'Failed to amend notification') |  |  |  |
| 3 | src/server/notification-amend/controller.js | 15 | Major | validation | Route has a path parameter {referenceNumber} but no format validation; malformed IDs reach the handler unchecked | Add validate.params with Joi schema to index.js route config to reject malformed reference numbers at the routing layer before the handler runs |  |  |  |
| 4 | src/server/notification-amend/controller.js | 9 | Major | security | POST endpoint lacks CSRF protection via crumb option; similar POST endpoints in the codebase (notification-delete) use crumb: { restful: true } | Add options object with crumb CSRF configuration to the controller export to protect against cross-site request forgery |  |  |  |
| 5 | src/server/notification-amend/controller.js | 14 | Minor | error-handling | amendNotification is called but its exceptions are not specifically logged with context; the error message is generic and doesn't surface whether the failure was a 404 or other error to help debugging | Log the error with request context or referenceNumber before falling through to error view, or improve the generic error message to distinguish failure modes |  |  |  |
| 6 | src/server/notification-amend/controller.test.js | 13 | Critical | missing-mock | Missing config.js mock — every controller test must mock both get-oidc-config.js and config.js per best-practices | Add vi.mock('../../config/config.js', ...) with mockAuthConfig helper as shown in notification-view controller test |  |  |  |
| 7 | src/server/notification-amend/controller.test.js | 64 | Major | weak-assertion | Uses expect.anything() for request and logger arguments instead of asserting structure — passes even if critical arguments are malformed | Replace first two expect.anything() with expect.objectContaining() to assert request and logger shapes match what amendNotification needs |  |  |  |
| 8 | src/server/notification-amend/index.js | 15 | Major | validation | Path parameter 'referenceNumber' lacks route-level format validation; should be validated via Joi schema in options.validate.params | Add options object with validate.params Joi schema to match the {referenceNumber} pattern, similar to notificationView route (notification-view/index.js) |  |  |  |

## Repository Verdict
**Status:** NEEDS ATTENTION (medium — param validation + CSRF config worth confirming before merge)
