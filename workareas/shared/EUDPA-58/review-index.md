# Code Review: EUDPA-58

**Ticket:** Address Book (Epic — "requirements and proposed solution for addresses visible to users in the IMP journey")
**Reviewer:** Claude Code Agent
**Date:** 2026-08-01
**Last Updated:** 2026-08-03
**Verdict:** NEEDS MORE WORK

**Scope:** `trade-imports-address-book` PR #1 **only**. The other five repos in
the epic's PR set were excluded by instruction — see `.review-meta.full.json`
for the full set.

## Summary

Refresh of tip `6ae0c82` → `bbf547c` on
[DEFRA/trade-imports-address-book#1](https://github.com/DEFRA/trade-imports-address-book/pull/1).

The live items table now lists **open findings only** (6). Closed history is
in `items.trade-imports-address-book.closed-archive.json`.

## Repositories Analyzed

| Repository | PR | Commit | Verdict | Review |
|------------|-----|--------|---------|--------|
| trade-imports-address-book | [#1](https://github.com/DEFRA/trade-imports-address-book/pull/1) | bbf547c | NEEDS MORE WORK | [review.trade-imports-address-book.md](review.trade-imports-address-book.md) |

## Open findings (6)

| # | Sev | File | Issue |
|---|-----|------|-------|
| 188 | Major | `operators.yml` / controller | Location still Relative; create now uses `UriComponentsBuilder.fromPath` |
| 189 | Major | `AddressRequest.java` | Javadoc still says countryCode has no length check |
| 193 | Major | `application.yml` | Comment still claims api-docs stays enabled everywhere |
| 199 | Major | `EmfMetricsPublisherTest.java` | NaN-skip test does not assert skip behaviour |
| 200 | Minor | `ProxyConfigTest.java` | `@AfterEach` ProxySelector restore is a no-op |
| 201 | Minor | `AddressSearchIT.java` | No IT that `q` excludes addressLine1-only hits |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| — | — | N/A | EUDPA-58 is an **Epic** with an empty Acceptance Criteria section. |

## Next steps

1. Drain the 4 Majors (#188, #189, #193, #199).
2. Optional Minors #200–#201.
