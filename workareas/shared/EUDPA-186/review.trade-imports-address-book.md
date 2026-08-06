# Repository Review: trade-imports-address-book

**PR:** #2 — "EUDPA-186: AC3 multi-word search integration test"
**Commit:** 73113b260e0a676211a2c749122168afaf094e8c
**Branch:** feat/EUDPA-186-address-book-search → main
**Files Changed:** 1 (+32 / -0)
**CI:** green (PR checks + branch image publish)

## Summary

A test-only PR. It adds a single integration test,
`multiWordSearchMatchesNameCaseInsensitively`, transcribing AC3 verbatim: save
"Green Valley Livestock Farm" plus a non-matching "Blue Barn", then assert that
`q=green valley` and `q=GREEN` each return exactly that one address. No
production code moves, so the wire contract, the OpenAPI artifact and the
pagination rule are all untouched.

The search implementation this test exercises already landed on `main` under
EUDPA-287 (PR #1): `OperatorService.toPartialMatchRegex` builds
`".*" + Pattern.quote(q.trim()) + ".*"` and `OperatorRepository.searchByQuery`
applies it with `$options: 'i'` across `name`, `townOrCity` and `postcode`,
always ANDed with `organisationId` and `status: ACTIVE`. The assertions were
traced through that path and they hold.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java | 84 | Minor | test-quality | multiWordSearchMatchesNameCaseInsensitively does not discriminate the search semantics it claims to pin: the only non-matching row is 'Blue Barn', which contains neither 'green' nor 'valley', so the test passes equally under the implemented contiguous-substring regex (.*\Qgreen valley\E.*) and under a token-OR or token-AND implementation — the very semantics AC3 is about. | Add a discriminating control row that matches one token but not the phrase (e.g. save(ORGANISATION_ID, ACTIVE, "Green Barn", "Perth", ...)) and keep the totalItems 1 / items[0].id assertion; token-OR would then return 2 and the test fails, pinning contiguous-phrase matching. |  |  |  |
| 2 | src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java | 83 | Minor | test-structure | The new test packs two acceptance criteria (multi-word phrase match, and case-insensitivity) into a single @Test with two mockMvc.perform calls, whereas every other test in AddressSearchIT is one request per test. A failure will not name which half broke, and the second perform never runs if the first assertion fails. | Split into two tests — multiWordSearchMatchesName (q='green valley') and multiWordSearchIsCaseInsensitive (q='GREEN') — sharing the same save() fixture setup, matching the file's one-scenario-per-test convention. |  |  |  |
| 3 | src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorRepository.java | 25 | Major | acceptance-criteria | AC2 lists country as a searchable field and AC3 requires partial-word, case-insensitive matching, but searchByQuery regexes only name, townOrCity and postcode. Country matches only when the whole trimmed term is an EXACT country name the frontend can resolve to an alpha-2 code (cv-048), so 'Fran' or 'french' returns nothing while the frontend hint (ins-frontend list/index.njk:39) promises 'Search by name, town or city, postcode or country'. The ticket's tech notes call for countryCode to be in the searched field set. Pre-existing from EUDPA-287, but EUDPA-186 is the ticket that owns AC2/AC3 and this PR pair is its AC-coverage top-up — the gap is proven in neither direction. | Either (a) add countryCode to the searchByQuery $or so a partial term can match it, or (b) confirm with UX that exact-country-name resolution is the agreed behaviour and amend AC2 plus the frontend hint copy to say so. Add an IT pinning whichever is chosen. |  |  |  |

## Positive Observations

- **AC-traceable test.** The fixture is lifted straight from AC3's wording
  ("Green Valley Livestock Farm", `green valley`, `GREEN`), so the link between
  criterion and proof is obvious to a later reader.
- **Test isolation is sound.** `IntegrationBase.cleanDatabase()` runs
  `@BeforeEach`, so the `totalItems == 1` assertions are not order-dependent
  and the added rows cannot leak into sibling tests.
- **Org scoping and soft-delete stay enforced in the query itself**, not by
  post-filtering — the tech note's explicit requirement. `searchByQuery` pins
  `organisationId` and `status: ACTIVE` in the Mongo query document, so AC5 and
  AC6 hold for search by construction rather than by convention.
- **Regex injection is already handled.** `Pattern.quote` wraps the user term in
  `\Q…\E`, so a term such as `.*` or `(a+)+` is matched literally rather than
  compiled as a pattern. Worth recording as a deliberate positive, since a raw
  `$regex` over user input is the usual place this goes wrong.
- **No contract drift.** Being test-only, the PR cannot move
  `OpenApiArtifactGeneratorIT`'s output, and the reviewer confirmed it does not.

## Test Coverage

- **Unit tests:** unchanged by this PR.
- **Integration tests:** this PR *is* the integration test. `AddressSearchIT`
  now covers partial-word matching on name, town/city and postcode, plus this
  new multi-word + uppercase case.
- **E2E:** none, in this repo or anywhere in the workspace —
  `trade-imports-animals-tests` has no address-book coverage at all. AC1
  (submit → filtered list → clear), AC4 (no-results) and AC7 (paging keeps the
  term) rest entirely on these ITs plus the frontend's injected-server tests.
  Symmetric with the frontend repo and unchanged since EUDPA-287, so it is a
  shared gap rather than an asymmetry introduced here.

## Consistency With the Frontend

Full analysis in
[`file-reviews/trade-imports-address-book/_consistency-check.md`](file-reviews/trade-imports-address-book/_consistency-check.md).
The shared contract
`GET /organisation/{orgId}/addresses?q={term}&countryCode={alpha2}&page={n}`
stays aligned — this PR moves no production code. Two asymmetries surfaced:

1. This repo proves AC3 in full (multi-word **and** uppercase); the frontend's
   matching assertion covers only the exact-case form (item #5 on the frontend).
2. The frontend hint promises country is searchable, but `searchByQuery` does
   not regex `countryCode` (item #3 below).

## Risk Assessment

**Overall Risk:** Low
**Rationale:** Test-only, additive, CI green, and the behaviour it asserts is
already shipped — the worst case is a test that passes for weaker reasons than
intended, not a production regression.


## Items

Items #1 and #2 are on the diff. Item #3 is a ticket-level AC gap found by the
consistency reviewer; it lives in already-merged code, so it is a scope
question for the author rather than a change request against this PR.

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java | 84 | Minor | test-quality | multiWordSearchMatchesNameCaseInsensitively does not discriminate the search semantics it claims to pin: the only non-matching row is 'Blue Barn', which contains neither 'green' nor 'valley', so the test passes equally under the implemented contiguous-substring regex (.*\Qgreen valley\E.*) and under a token-OR or token-AND implementation — the very semantics AC3 is about. | Add a discriminating control row that matches one token but not the phrase (e.g. save(ORGANISATION_ID, ACTIVE, "Green Barn", "Perth", ...)) and keep the totalItems 1 / items[0].id assertion; token-OR would then return 2 and the test fails, pinning contiguous-phrase matching. |  |  |  |
| 2 | src/test/java/uk/gov/defra/trade/imports/addressbook/integration/AddressSearchIT.java | 83 | Minor | test-structure | The new test packs two acceptance criteria (multi-word phrase match, and case-insensitivity) into a single @Test with two mockMvc.perform calls, whereas every other test in AddressSearchIT is one request per test. A failure will not name which half broke, and the second perform never runs if the first assertion fails. | Split into two tests — multiWordSearchMatchesName (q='green valley') and multiWordSearchIsCaseInsensitive (q='GREEN') — sharing the same save() fixture setup, matching the file's one-scenario-per-test convention. |  |  |  |
| 3 | src/main/java/uk/gov/defra/trade/imports/addressbook/address/OperatorRepository.java | 25 | Major | acceptance-criteria | AC2 lists country as a searchable field and AC3 requires partial-word, case-insensitive matching, but searchByQuery regexes only name, townOrCity and postcode. Country matches only when the whole trimmed term is an EXACT country name the frontend can resolve to an alpha-2 code (cv-048), so 'Fran' or 'french' returns nothing while the frontend hint (ins-frontend list/index.njk:39) promises 'Search by name, town or city, postcode or country'. The ticket's tech notes call for countryCode to be in the searched field set. Pre-existing from EUDPA-287, but EUDPA-186 is the ticket that owns AC2/AC3 and this PR pair is its AC-coverage top-up — the gap is proven in neither direction. | Either (a) add countryCode to the searchByQuery $or so a partial term can match it, or (b) confirm with UX that exact-country-name resolution is the agreed behaviour and amend AC2 plus the frontend hint copy to say so. Add an IT pinning whichever is chosen. |  |  |  |

## Repository Verdict

**Status:** SAFE

The PR does what its title says and does it correctly. Both on-diff items are
Minor and concern how sharply the test discriminates, not whether it passes:
the control row "Blue Barn" shares no token with the search term, so the test
would pass identically under contiguous-phrase, token-OR and token-AND
matching — the very distinction AC3 turns on. Adding a "Green Barn" control
would make it fail under token-OR and pin the intended semantics.

Item #3 (country not in the search regex) is the one substantive finding, and
it is a gap in EUDPA-186's ACs rather than a defect in this PR. It needs a
decision, not a code change here.

