# Consistency Check: trade-imports-address-book

**Ticket:** EUDPA-186
**All repos in scope:** trade-imports-address-book, trade-imports-ins-frontend
**PR:** #2 | **Commit:** 73113b2

## Cross-Repo Pattern Analysis

Both PRs are small additive top-ups on already-merged EUDPA-287 work. The
shared contract is `GET /organisation/{orgId}/addresses?q={term}&countryCode={alpha2}&page={n}`
with the cv-048 split: the frontend resolves a country *name* to an alpha-2
code, the backend matches `countryCode` exactly and ORs it with the `q` regex.

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| List/search contract `q` param | ins-frontend ✅ forwards trimmed `q` (`list/controller.js:58,74`) | ✅ `OperatorController` → `OperatorService.list(..., q, ...)`, trimmed at `OperatorService.java:110` | CONSISTENT |
| List/search contract `countryCode` param (cv-048 FE-resolve) | ins-frontend ✅ `resolveCountryCodeFromSearchTerm` (`address-countries.js:39`) | ✅ `searchByCountryCode` / `searchByQueryAndCountryCode` (`OperatorRepository.java:33,37`) | CONSISTENT |
| AC3 multi-word + case-insensitive proof | ins-frontend ⚠️ added only `'United Kingdom' → 'GB'` (exact case) in `address-countries.test.js:9` | ✅ `multiWordSearchMatchesNameCaseInsensitively` covers `"green valley"` **and** `"GREEN"` (`AddressSearchIT.java:83-113`) | INCONSISTENT (mirror gap on the frontend side) |
| AC1 clear-search affordance | ins-frontend ✅ `index.njk` `{% if hasSearch %}` block | N/A — presentation concern, no server-side counterpart | EXPECTED |
| Production-code change | ins-frontend: 1 template block only | None — test-only PR | CONSISTENT (both are top-ups, no contract movement) |
| Page size 25 from server config | ins-frontend ✅ consumes `pageSize` from the response, never sets it | ✅ `@Value("${address-book.list.page-size:25}")` (`OperatorService.java:39`) | CONSISTENT (single pagination rule, per tech notes) |
| E2E coverage | ins-frontend ❌ none | ❌ none | CONSISTENT but both absent (see Missing Changes) |
| OpenAPI artifact update | N/A (Node) | ✅ Not needed — no controller/param change, so `OpenApiArtifactGeneratorIT` output is unmoved | EXPECTED |

## Missing Changes

1. **AC2 "country" is only half-served, and neither PR closes it.** The
   frontend search hint (`ins-frontend src/server/address-book/list/index.njk:39`)
   promises "Search by name, town or city, postcode or country", but
   `searchByQuery` (`src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorRepository.java:25-31`)
   regexes only `name`, `townOrCity` and `postcode`. A country only matches
   when the whole trimmed term is an *exact* country name that the frontend
   resolves to a code — so `"Fran"` or `"french"` returns nothing while the
   hint says country is searchable. Pre-existing from EUDPA-287, not
   introduced here, but this PR pair is the AC-coverage top-up and leaves the
   gap unproven either way. There is no IT asserting the partial-country
   behaviour in either direction. The ticket's tech notes call for a text
   index across `countryCode` as well.

2. **No end-to-end proof of the search journey anywhere in the workspace.**
   `repos/trade-imports-animals-tests` has no address-book coverage at all
   (grep for `address-book` returns nothing), and ins-frontend has no E2E
   suite of its own. AC1 (submit → filtered list → clear), AC4 (no-results)
   and AC7 (paging keeps the term) are proven only by this repo's ITs plus
   the frontend's injected-server tests. Consistent across both repos, so
   not an asymmetry — but it is a shared gap, and it was the same at
   EUDPA-287.

## Unique Changes

1. **`multiWordSearchMatchesNameCaseInsensitively` (`AddressSearchIT.java:83-113`)** —
   the AC3 verbatim case ("Green Valley Livestock Farm" / `green valley` /
   `GREEN`). Intentional and in scope; it is the only change in this PR.
   Style note: it is the only test in the file formatted to ~100 columns
   (the peers at lines 51, 70, 118, 133 run to ~118 chars on one line). The
   pom declares no spotless/checkstyle/fmt plugin, so nothing enforces
   either style — cosmetic divergence only, the new block is the more
   google-java-format-conformant of the two.

2. **Second `mockMvc.perform` in one `@Test`** — the new test asserts two
   requests (multi-word, then uppercase) in a single method, where every
   other test in `AddressSearchIT` is one request per test. Two ACs
   (multi-word, case-insensitivity) in one method means a failure does not
   name which one broke. Deviates from the file's own one-scenario-per-test
   convention.

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 2 cross-repo (AC2 country-search gap between the frontend hint and
the backend query; AC3 proven here but only half-mirrored in the frontend
resolver test), plus 1 in-file convention deviation.
**Summary:** The shared search contract stays aligned — this PR moves no
production code — but the backend proves AC3 fully while the frontend's
matching assertion covers only the exact-case form, and the "country is
searchable" promise in the frontend hint is still not met by
`searchByQuery`'s three-field regex.
