# Repository Review: trade-imports-ins-frontend

**PR:** #18
**Commit:** 2a1886372d12abf6b4a5b32db1f6a12dbb6cf368
**Files Changed:** 20
**Scope:** Review limited to this PR only (cdp-app-config / address-book PRs excluded by request)

## Summary

Adds Playwright e2e for address-book list/add, a stub/real client split (`INS_MODE`) for address-book and countries, and `AUTH_STUB_MODE` with a stub sign-in route so CI can run without Defra ID / address-book. Config, Vitest exclude, and CI workflow wiring look sound; main gaps are unit-test coverage of the new auth stub paths and a few e2e assertion holes.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `.github/workflows/check-pull-request.yml` | SAFE | 0 | 0 | 0 |
| `.gitignore` | SAFE | 0 | 0 | 0 |
| `package-lock.json` | SAFE | 0 | 0 | 0 |
| `package.json` | SAFE | 0 | 0 | 0 |
| `playwright.config.js` | SAFE | 0 | 0 | 0 |
| `src/config/config.js` | SAFE | 0 | 0 | 0 |
| `src/server/address-book/e2e/add.e2e.spec.js` | SAFE | 0 | 0 | 0 |
| `src/server/address-book/e2e/list.e2e.spec.js` | NEEDS ATTENTION | 0 | 2 | 0 |
| `src/server/auth/stub-sign-in.js` | NEEDS ATTENTION | 0 | 1 | 1 |
| `src/server/common/clients/address-book-client.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/clients/address-book-client.real.js` | SAFE | 0 | 0 | 1 |
| `src/server/common/clients/address-book-client.stub.js` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/server/common/clients/countries-client.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/clients/countries-client.real.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/clients/countries-client.stub.js` | SAFE | 0 | 0 | 0 |
| `src/server/common/services/mode.js` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/server/common/services/mode.test.js` | SAFE | 0 | 0 | 1 |
| `src/server/plugins/auth.js` | NEEDS ATTENTION | 0 | 1 | 0 |
| `src/server/server.js` | SAFE | 0 | 0 | 0 |
| `vitest.config.js` | SAFE | 0 | 0 | 0 |

## Positive Observations

- Playwright config + CI job mirror animals-frontend patterns (`INS_MODE=stub`, `AUTH_STUB_MODE=true`, health wait).
- `add.e2e.spec.js` thoroughly covers validation, save banner, and cancel with role-based locators.
- Convict `strict-boolean` for `AUTH_STUB_MODE` and production gate in `isAuthStubMode` are the right safety shape.
- Stub/real client facades align with each other and keep real clients covered by existing nock tests.

## Test Coverage

- Unit tests: Partial — real clients covered; new stub auth branches (`stub-sign-in`, `auth.js` early return, `isAuthStubMode` production gate) lack unit tests.
- Integration tests: N/A for this Node frontend PR.
- E2E: Present — list/add Playwright specs + CI job; list suite has AC4/AC8 assertion gaps.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** No critical correctness bugs in the production OIDC path, but the auth stub safety gate and stub-mode branches are untested at unit level, and list e2e leaves AC4/AC8 partially unverified.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/server/address-book/e2e/list.e2e.spec.js | 54 | Major | missing-assertion | AC4 e2e asserts Name cell and column headers but never the Address or Country cell values, so a regression that blanks or mis-maps those columns would still pass. | Also assert table cells for stub address line '1 Stub Way, Stubton, ST1 1UB' and country 'United Kingdom'. |  |  |  |
| 2 | src/server/address-book/e2e/list.e2e.spec.js | 57 | Major | missing-test | AC8 entry from the list is untested: both list cases only assert 'Add a new address' is visible, and no suite clicks it to reach /address-book/add (add.e2e navigates via goto). | Click the Add control and expect navigation to /address-book/add (and the Add address details heading). |  |  |  |
| 3 | src/server/auth/stub-sign-in.js | 40 | Major | testing | New /auth/stub-sign-in route has no colocated stub-sign-in.test.js; session creation, default vs query organisationId, cookie set, and getSafeRedirect behaviour are only exercised indirectly by Playwright e2e | Add a Vitest controller-style test that enables AUTH_STUB_MODE, server.inject()s GET /auth/stub-sign-in with and without organisationId/redirect, and asserts cache session fields, cookieAuth, and Location |  |  |  |
| 4 | src/server/auth/stub-sign-in.js | 54 | Minor | correctness | organisationId uses ?? so an empty query string (?organisationId=) writes an empty organisationId into the session, unlike the real OIDC path which rejects missing org (D23) | Treat blank organisationId as absent (e.g. request.query.organisationId \|\| DEFAULT_STUB_USER.organisationId) or reject empty values before cache.set |  |  |  |
| 5 | src/server/common/clients/address-book-client.real.js | 43 | Minor | error-handling | throwOnError (and the create/update 400 branches) attach error.status and error.body but omit error.statusText required by the fetch-client error shape | Set error.statusText = response.statusText wherever a non-OK response is turned into a thrown Error; ideally fold the 400 branches into throwOnError so there is one construction path |  |  |  |
| 6 | src/server/common/clients/address-book-client.stub.js | 53 | Major | stub-parity | listAddresses ignores q and countryCode that the real client and list controller pass, so stub-mode search never filters and the no-results empty state cannot appear | Accept { page, q, countryCode } and filter the in-memory store (name/address/email/postcode match for q; exact countryCode) before paginating |  |  |  |
| 7 | src/server/common/services/mode.js | 9 | Major | testing | isAuthStubMode is untested, including the production safety gate that must keep AUTH_STUB_MODE from enabling stub sign-in when isProduction is true | Extend mode.test.js to cover isAuthStubMode for stubMode×isProduction combinations (true/false), asserting false whenever isProduction is true |  |  |  |
| 8 | src/server/common/services/mode.test.js | 12 | Minor | test-mocking | mockConfigGet is declared with vi.fn() and closed over by vi.mock(), but sibling tests and the BP require vi.hoisted() for mocks referenced inside a mock factory | Replace with: const mockConfigGet = vi.hoisted(() => vi.fn()) |  |  |  |
| 9 | src/server/plugins/auth.js | 24 | Major | missing-test | New auth.stubMode branches (skip Bell registration; redirectTo /auth/stub-sign-in) are untested in auth.test.js, which still only covers the real OIDC path | Extend auth.test.js: when isAuthStubMode is true, assert register skips getOidcConfig/defra-id strategy; assert redirectTo returns /auth/stub-sign-in?redirect=... |  |  |  |

## Repository Verdict

**Status:** NEEDS ATTENTION
