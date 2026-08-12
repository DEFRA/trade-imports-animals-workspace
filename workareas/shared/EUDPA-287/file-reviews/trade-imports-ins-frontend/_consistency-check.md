# Consistency Check: trade-imports-ins-frontend

**Ticket:** EUDPA-287
**All repos in scope:** cdp-app-config, trade-imports-address-book, trade-imports-ins-frontend
**PR:** #18 | **Commit:** 2a188637

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `TRADE_IMPORTS_ADDRESS_BOOK_URL` (rename from misnamed `TRADE_IMPORTS_ANIMALS_BACKEND_URL`) | cdp-app-config ✅ (dev + test `.env`), address-book N/A | ✅ Present — `config.js` maps `tradeImportsAddressBookApi.baseUrl` → `TRADE_IMPORTS_ADDRESS_BOOK_URL`; client reads that key | CONSISTENT |
| Address list API contract `GET /organisation/{orgId}/addresses` (+ `page` / optional `q`) | address-book ✅ (search IT exercises `q`), cdp-app-config N/A | ✅ Present — real client builds same path/query; stub mirrors paginated response shape (`pageSize: 25`) | CONSISTENT |
| Multi-word `q` search behaviour | address-book ✅ (new IT only), cdp-app-config N/A | ✅ Client already forwards `q`; no UI/filter in this PR | Expected — filtering is EUDPA-186 (out of scope) |
| `INS_MODE` / `AUTH_STUB_MODE` (local/CI stub gating) | cdp-app-config ❌, address-book N/A | ✅ Present (`runMode` / `auth.stubMode`) | Expected — CDP envs stay on real APIs + real Defra ID; stub flags default off |
| Playwright e2e + CI job + `@playwright/test` | address-book N/A (Java IT instead), cdp-app-config N/A | ✅ Present | Expected — Node frontend-only test surface |
| Shared npm/Java dependency bump | none across peers | Playwright / axe only | CONSISTENT — no shared dependency to align |
| Feature flag / toggle for address-book create/list | none in peers | none | CONSISTENT — no shared feature flag introduced |

## Missing Changes

*None identified.*

- CDP config correctly renamed the URL this service already consumes; no further env keys from peers are required in this PR.
- Absence of multi-word search UI / stub filtering matches ticket out-of-scope (EUDPA-186).
- Absence of `INS_MODE` / `AUTH_STUB_MODE` from cdp-app-config is correct for deployed environments.

## Unique Changes

- **Stub/real client split** (`address-book-client.{js,real.js,stub.js}`, `countries-client.*`, `mode.js`) — intentional; mirrors animals-frontend mode pattern so Playwright can run without the stack (`INS_MODE=stub`).
- **`AUTH_STUB_MODE` + `stub-sign-in` routes** — intentional for self-contained e2e; production path unchanged when flag is false / in production.
- **In-repo Playwright suite + workflow job** — intentional coverage for AC3–AC12 without depending on address-book or Defra ID stub containers.
- Hard-coded stub `PAGE_SIZE = 25` — intentional mirror of address-book server page size (ticket AC5/AC6); real client does not send a size query param.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found
**Summary:** PR #18 aligns with the cdp-app-config URL rename and the address-book list API contract; stub/auth modes and Playwright are frontend-local and correctly absent from peer repos.
