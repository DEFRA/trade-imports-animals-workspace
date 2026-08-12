# Code Review: EUDPA-287

**Ticket:** Adding a new address via address book
**Reviewer:** Claude Code Agent
**Date:** 2026-08-12
**Verdict:** CONCERNS
**Scope:** [trade-imports-ins-frontend PR #18](https://github.com/DEFRA/trade-imports-ins-frontend/pull/18) only (other ticket PRs excluded by request)

## Summary

PR #18 wires stub/real clients, auth stub mode, and Playwright e2e/CI for the address-book list and add journey. Implementation patterns look solid and consistent with animals-frontend, but several Major items remain — mainly missing unit tests for the auth stub safety paths and e2e gaps on AC4/AC8 for the list page.

## Repositories Analyzed

| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-ins-frontend | #18 | 2a18863 | 20 | NEEDS ATTENTION | [review.trade-imports-ins-frontend.md](review.trade-imports-ins-frontend.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| AC1 | Both services run in stack | Out of scope | Not in this PR |
| AC2 | Sign in with Defra ID stub | Partial (this PR) | Real OIDC path unchanged; PR adds AUTH_STUB_MODE for local/CI e2e (production-gated) |
| AC3 | Service navigation | Yes (e2e) | list.e2e covers Dashboard / Address book nav |
| AC4 | View address book table | Partial | List e2e asserts Name + headers; Address/Country cell values not asserted (item #1) |
| AC5 | List endpoint | Out of scope | Address-book API |
| AC6 | Pagination | Yes (e2e) | Covered in list.e2e |
| AC7 | Empty address book | Yes (e2e) | Covered in list.e2e |
| AC8 | Enter address details | Partial | Add form covered; click from list to add not asserted (item #2) |
| AC9 | Address validation | Yes (e2e) | add.e2e covers required/max-length/email |
| AC10 | Save an address | Yes (e2e) | Save + banner + list row |
| AC11 | Org-shared availability | Out of scope / limited | Relies on API org scoping; not fully exercised in frontend-only stub e2e |
| AC12 | Cancel add | Yes (e2e) | Covered in add.e2e |
| AC13 | Create endpoint | Out of scope | Address-book API |

## Test Coverage Assessment

- **Unit Tests:** Partial — client real paths covered; stub auth / `isAuthStubMode` production gate missing
- **Integration Tests:** N/A (frontend PR)
- **E2E:** Present — Playwright list/add + CI job; a few AC assertion gaps

## Configuration & Environment

- **New Environment Variables:** `AUTH_STUB_MODE`, `INS_MODE` (defaults fail-closed / real)
- **Database Changes:** None in this PR

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Low |
| Code Quality | Low |
| Security | Medium (auth stub production gate untested at unit level) |
| Test Coverage | Medium |

## Conclusion

Ship blockers are not correctness defects in the real Defra ID path, but Major test gaps around stub auth and list e2e assertions should be triaged before merge. Full item list is in [review.trade-imports-ins-frontend.md](review.trade-imports-ins-frontend.md).
