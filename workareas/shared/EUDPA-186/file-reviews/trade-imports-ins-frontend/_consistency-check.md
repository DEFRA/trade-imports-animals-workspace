# Consistency Check: trade-imports-ins-frontend

**Ticket:** EUDPA-186
**All repos in scope:** trade-imports-address-book, trade-imports-ins-frontend
**PR:** #17 | **Commit:** 2e759fe

## Cross-Repo Pattern Analysis

Both PRs are small additive top-ups on already-merged EUDPA-287 work. The
shared contract is `GET /organisation/{orgId}/addresses?q={term}&countryCode={alpha2}&page={n}`
with the cv-048 split: this repo resolves a country *name* to an alpha-2 code
and sends both params; the backend matches `countryCode` exactly and ORs it
with the `q` regex.

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| List/search contract `q` param | address-book ✅ trims and regex-quotes (`OperatorService.java:110`) | ✅ trimmed at `list/controller.js:58`, forwarded at `:74` | CONSISTENT |
| List/search contract `countryCode` param (cv-048 FE-resolve) | address-book ✅ exact match, ORed with `q` (`OperatorRepository.java:37-48`) | ✅ `resolveCountryCodeFromSearchTerm` (`address-countries.js:39-50`) | CONSISTENT |
| AC3 multi-word + case-insensitive proof | address-book ✅ `multiWordSearchMatchesNameCaseInsensitively` asserts both `"green valley"` and `"GREEN"` | ⚠️ new assertion covers only exact-case `'United Kingdom'` (`address-countries.test.js:9-11`) | INCONSISTENT (mirror gap) |
| "Is the list filtered?" model | address-book: `q` and `countryCode` are two independent filters (`OperatorService.queryPage`, 4 branches) | ⚠️ `hasSearch = Boolean(q)` only (`list/controller.js:59`) | INCONSISTENT |
| Page size 25 from server config | address-book ✅ `@Value("${address-book.list.page-size:25}")` | ✅ consumed from the response, never set client-side | CONSISTENT (one pagination rule) |
| E2E coverage | address-book ❌ none | ❌ none, and `repos/trade-imports-animals-tests` has no address-book coverage at all | CONSISTENT but both absent |
| govuk-frontend components, no custom | N/A (Java) | ✅ `govukInput type: "search"`, `govukTable`, `govukPagination` — no bespoke component | CONSISTENT with tech notes |

## Missing Changes

1. **AC3's multi-word *and* case-insensitive pair is only half-mirrored here.**
   The backend PR proves both halves in one IT. The single line added to
   `src/server/address-book/address-countries.test.js:9-11` asserts
   `resolveCountryCodeFromSearchTerm('United Kingdom', countries) === 'GB'`
   — exact case only — yet it sits inside the test named
   *"returns alpha-2 code for a case-insensitive country name match"*, whose
   existing lines do assert both `'France'` and `'france'`. The multi-word
   lowercase form (`'united kingdom'`) is the one that actually exercises
   `toLowerCase()` on a multi-token name and it is untested. One extra
   `expect` closes the gap.

2. **AC2's "country" promise outruns the backend.** The hint at
   `src/server/address-book/list/index.njk:39` reads "Search by name, town or
   city, postcode or country", but the backend's `searchByQuery`
   (`OperatorRepository.java:25-31`) regexes only `name`, `townOrCity` and
   `postcode`. Country only matches when the whole trimmed term is an exact
   country name that this repo resolves to a code — `"Fran"` or `"french"`
   returns nothing. Pre-existing from EUDPA-287 and unaddressed by either PR
   in this pair.

3. **The new `hasSearch` gate is narrower than the backend's filter model.**
   The controller accepts an explicit `countryCode` query param
   (`list/controller.js:69`) and pagination round-trips it
   (`address-book-helper.js:5-16`), so `/address-book?countryCode=FR` is a
   reachable filtered state. But `hasSearch` is `Boolean(q)`, so on that URL
   the new `{% if hasSearch %}` Clear-search block does not render — the user
   is in a filtered list with no way back to the full one. The same gate also
   drives `isEmpty` (`:87`), so a `countryCode`-only search returning nothing
   renders "You have no addresses yet" rather than the no-results state. The
   backend treats the two params as equal filters; this repo treats only `q`
   as "a search". Widening the gate to `Boolean(q || resolvedCountryCode)`
   would align the two.

## Unique Changes

1. **Clear-search link + `data-testid`, results branch (`list/index.njk:74-78`)** —
   in scope for AC1 ("I should be able to clear the search and return to the
   full list"), which previously had an affordance only in the no-results
   branch. Intentional.

   **But it introduces an intra-repo inconsistency:** there are now two
   "Clear search" links in the same template and only the new one carries a
   testid. The pre-existing no-results link at `list/index.njk:65` has no
   `data-testid`, so the AC4 test asserts on the bare string
   (`list/controller.test.js:238` — `toContain('Clear search')`) while the
   AC1 test asserts on the testid (`:180`). Same affordance, two selector
   conventions. Adding `data-testid="address-book-clear-search"` to line 65
   would unify them — and would let the AC4 test stop matching on prose.

2. **Weak paired assertion (`list/controller.test.js:181`)** —
   `expect(result).toContain('Clear search</a>')` is satisfied by *either*
   branch's link, so it adds nothing over the testid assertion on the line
   above. Conversely the negative test at `:152` only asserts the testid is
   absent, so it would still pass if the untestid'd no-results link leaked
   onto an unfiltered page. Not a defect today (the branches are mutually
   exclusive), but the selector split above is what makes the assertions
   awkward.

3. **`'United Kingdom' → 'GB'` assertion (`address-countries.test.js:9-11`)** —
   worth noting it pins the *synthetic* GB entry: `getAddressFormCountries`
   (`address-countries.js:12-14`) drops MDM's own GB row and prepends
   `{ code: 'GB', name: 'United Kingdom' }`. So this asserts the local
   constant, not MDM's naming. If MDM labels GB as e.g. "United Kingdom of
   Great Britain and Northern Ireland", that term will no longer resolve and
   this test will not notice. No backend counterpart exists — the backend
   holds no country reference data — so this is correctly frontend-only.

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 3 cross-repo (AC3 half-mirrored; AC2 country promise vs the
backend's three-field regex; `hasSearch` narrower than the backend's
two-filter model) + 1 intra-repo (two Clear-search links, one testid'd).
**Summary:** The wire contract stays aligned with the backend, but the new
Clear-search affordance is gated on `q` alone while the backend treats
`countryCode` as an equal filter, and the added country-resolution assertion
covers only the exact-case form of the multi-word case the backend PR proves
in full.
