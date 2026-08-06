# Code Review: EUDPA-186

**Ticket:** Filtering the address book
**Reviewer:** Claude Code Agent
**Date:** 2026-08-06
**Verdict:** PASS WITH NOTES

## Summary

Two small, additive, test-heavy PRs — 4 files, +100 lines, no deletions, CI
green on both. The address-book PR is test-only (one AC3 integration test); the
frontend PR adds a six-line "Clear search" template block plus tests either side
of it. Neither moves the API contract. The bulk of the search feature they
cover already landed on `main` under EUDPA-287, so most of EUDPA-186's ACs are
verified against merged code rather than against these diffs.

No Critical findings. Three Major items: two are test-hardening on the frontend
diff, and one is a ticket-level AC gap (country is not in the backend's search
regex) that sits in already-merged code and needs a decision rather than a code
change.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-address-book | [#2](https://github.com/DEFRA/trade-imports-address-book/pull/2) | 73113b2 | 1 (+32/-0) | SAFE | [review.trade-imports-address-book.md](review.trade-imports-address-book.md) |
| trade-imports-ins-frontend | [#17](https://github.com/DEFRA/trade-imports-ins-frontend/pull/17) | 2e759fe | 3 (+68/-0) | NEEDS ATTENTION | [review.trade-imports-ins-frontend.md](review.trade-imports-ins-frontend.md) |

Both PRs are authored by `tarun-palisetty`, target `main` from
`feat/EUDPA-186-address-book-search`, and share the branch name across repos as
the workspace rules require.

## Scope Note

EUDPA-186's implementation is spread across ticket boundaries. The search
endpoint, the Mongo queries, the search input, the results label, pagination
and the no-results state all merged earlier under EUDPA-287 (address-book #1,
ins-frontend #1) and EUDPA-286 (ins-frontend #2). These two PRs are top-ups.
The AC table below therefore assesses the ticket as a whole, marking which ACs
these PRs actually touch — a reviewer looking only at the diffs would otherwise
conclude the story is barely built.

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| AC1 | Search the address book | Yes | Search input, results label ("Showing 1-1 of 1") and clear-search all present. **This PR pair** adds the clear affordance to the has-results branch. Item #1 (frontend): the clear link's `href` is asserted only as a substring, so "return to the full list" is not pinned. |
| AC2 | Name / town or city / postcode / country are searched | **Partial** | `searchByQuery` regexes `name`, `townOrCity`, `postcode` only. Country matches only when the whole term is an exact country name the frontend resolves to an alpha-2 code — `"Fran"` returns nothing, while the UI hint promises country is searchable. See item #3 (address-book). Pre-existing from EUDPA-287. |
| AC3 | Case-insensitive, partial-word | Yes | Proven by `AddressSearchIT` — `.*\Q…\E.*` with `$options: 'i'`. **This PR pair** adds the multi-word case. Items #1/#2 (address-book): the test does not discriminate phrase vs token matching, and packs two ACs into one `@Test`. |
| AC4 | No results — message, term shown, clearable | Yes | `noSearchResults` branch renders all three. Item #2 (frontend): its clear link carries no `data-testid`, unlike the new one, so the two branches expose different selectors. |
| AC5 | Organisation-scoped | Yes | `organisationId` is pinned in the Mongo query document itself, not post-filtered — exactly as the tech notes require. Org id comes from the trusted forwarded header (cv-010). |
| AC6 | Deleted addresses excluded | Yes | Every search query pins `status: ACTIVE`, so soft-delete tombstones cannot surface. |
| AC7 | Results paginate, 25/page, paging keeps the term | Yes | Page size is server-side config (`@Value("${address-book.list.page-size:25}")`), consumed by the frontend from the response. `buildPaginationLinks` round-trips `q` and `countryCode`. No second pagination rule. Not exercised end-to-end. |
| — | No filter-by-type | Yes | Correctly absent, per the ticket's explicit D21 instruction. |

## Test Coverage Assessment

- **Unit tests:** Present. One assertion added to `address-countries.test.js`;
  item #5 notes the multi-word *lowercase* form is still untested.
- **Integration tests:** Present. `AddressSearchIT` covers name, town/city,
  postcode and now multi-word/uppercase search.
- **Controller/view tests:** Present. Two new injected-server tests around the
  clear-search link; items #1 and #2 concern their strength and coverage.
- **E2E:** **Missing.** `trade-imports-animals-tests` has no address-book
  coverage at all and neither frontend repo has its own suite. AC1's full round
  trip, AC4 and AC7's "paging keeps my search term" are proven only below the
  browser. Unchanged since EUDPA-287 and symmetric across both repos, so not a
  regression — but it is the largest gap in the story's proof.

## Configuration & Environment

- **New environment variables:** none.
- **Database changes:** none in these PRs. Worth flagging for later: the
  ticket's tech notes call for a **MongoDB text index** across the searched
  fields, but the merged implementation uses a leading-`.*` regex, which cannot
  use an index and forces a collection scan per search. Fine at current data
  volumes; it will not stay fine as organisations accumulate addresses.
- **API contract / OpenAPI:** unchanged — no controller or param movement, so
  the generated artifact is unmoved.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Low |
| Code Quality | Low |
| Security | Low — user input is `Pattern.quote`d before reaching `$regex`, org scoping is in the query, no user input interpolated into HTML |
| Test Coverage | Medium — solid below the browser, no E2E anywhere |
| Performance | Medium — unindexed leading-wildcard regex scan (pre-existing, out of scope here) |

## Items

8 items total, none Critical. Full detail, with fixes, in the per-repo reviews:

| Repo | Critical | Major | Minor | Total |
|------|----------|-------|-------|-------|
| trade-imports-address-book | 0 | 1 | 2 | 3 |
| trade-imports-ins-frontend | 0 | 2 | 2 | 5 |

Canonical state is `items.{repo}.json`; the `## Items` tables in the per-repo
reviews are rendered views. Run `walk review EUDPA-186` to triage.

## Conclusion

Both PRs are safe to merge on their own terms — small, additive, tested and
green. The frontend one would benefit from the template fix first, since it
introduces a test-hook convention it applies to only one of the two branches
rendering the same affordance, and that inconsistency gets more expensive once
E2E selectors are written against it.

The two findings worth raising beyond the diffs are AC2's country-search gap
and the absent E2E coverage. Neither was introduced here, but EUDPA-186 is the
ticket that owns them, and this PR pair is its AC-coverage top-up.
