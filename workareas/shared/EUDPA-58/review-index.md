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
[DEFRA/trade-imports-address-book#1](https://github.com/DEFRA/trade-imports-address-book/pull/1)
(4 fix commits addressing the prior open Majors).

**Strong progress:** 8 prior open items Auto-Resolved this pass (locked
`minLength` / Problem `required`, 409 contract + unit coverage, `updateEntity`
test, town/postcode search ITs, compliance generate early-return + schema
fail-open). No Criticals remain open.

**Still open:** 4 Majors (#188 Location relative, #189 AddressRequest Javadoc,
#193 springdoc comment, #199 EMF NaN-skip assertion) and 2 new Minors
(#200 ProxySelector cleanup, #201 addressLine1 search exclusion IT).

## Repositories Analyzed

| Repository | PR | Commit | Verdict | Review |
|------------|-----|--------|---------|--------|
| trade-imports-address-book | [#1](https://github.com/DEFRA/trade-imports-address-book/pull/1) | bbf547c | NEEDS MORE WORK | [review.trade-imports-address-book.md](review.trade-imports-address-book.md) |

## Findings (current disposition)

| Bucket | Count |
|---|---|
| Fix \| Done | 103 |
| Auto-Resolved | 92 |
| Still open | **6** (4 Major, 2 Minor) |
| **Total items** | **201** |

### Remaining open

| # | Sev | File | Issue |
|---|-----|------|-------|
| 188 | Major | `operators.yml` / controller | Location still Relative; create now uses `UriComponentsBuilder.fromPath` |
| 189 | Major | `AddressRequest.java` | Javadoc still says countryCode has no length check |
| 193 | Major | `application.yml` | Comment still claims api-docs stays enabled everywhere |
| 199 | Major | `EmfMetricsPublisherTest.java` | NaN-skip test does not assert skip behaviour |
| 200 | Minor | `ProxyConfigTest.java` | `@AfterEach` ProxySelector restore is a no-op |
| 201 | Minor | `AddressSearchIT.java` | No IT that `q` excludes addressLine1-only hits |

### Auto-Resolved this refresh

| # | Notes |
|---|---|
| 185–186 | Locked AddressRequest `minLength: 1`; Problem/ValidationProblem `required` restored |
| 190 | `updateEntity` unit test added |
| 191–192 | 409 optimistic-lock unit test + locked/OpenAPI 409 on update |
| 196–198 | Town/postcode search ITs; compliance generate early-return removed; schema assert fails closed |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| — | — | N/A | EUDPA-58 is an **Epic** with an empty Acceptance Criteria section. |

## Next steps

1. Drain the 4 remaining Majors (#188, #189, #193, #199) — mostly docs/test assertion.
2. Optional Minors #200–#201.
3. Re-share or walk only the open set when ready.
