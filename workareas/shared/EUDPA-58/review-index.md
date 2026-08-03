# Code Review: EUDPA-58

**Ticket:** Address Book (Epic — "requirements and proposed solution for addresses visible to users in the IMP journey")
**Reviewer:** Claude Code Agent
**Date:** 2026-08-01
**Last Updated:** 2026-08-03
**Verdict:** NEEDS MORE WORK

**Scope:** `trade-imports-address-book` PR #1 **only**. The other five repos in
the epic's PR set (`animals-frontend`, `ins-frontend`, `animals-backend`,
`animals-tests`, `animals-workspace`) were excluded by instruction — see
`.review-meta.full.json` for the full set.

## Summary

Refresh of the developer fix commits (`6f1134b` → `87f2f7b`) on
[DEFRA/trade-imports-address-book#1](https://github.com/DEFRA/trade-imports-address-book/pull/1).

**Good progress:** 10 of 11 prior Criticals are gone — locked contract aligned to
camelCase, schema property-name gate added, malformed JSON → 400, EMF scheduling
enabled, IdentityHeaderFilter rewritten (`OncePerRequestFilter`, path/header
match, regex validation), repository unscoped CRUD removed.

**Still blocking:** Critical #86 (header trust boundary documented but not
enforced) plus 14 new Major findings from the fix window (409 optimistic-lock
coverage/contract, schema-gate fail-open, stale countryCode Javadoc, README
recreate of a non-existent stack service, and related).

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-address-book | [#1](https://github.com/DEFRA/trade-imports-address-book/pull/1) | 87f2f7b | 82 | NEEDS MORE WORK | [review.trade-imports-address-book.md](review.trade-imports-address-book.md) |

## Findings

| Severity | Open | Auto-Resolved (this refresh) |
|---|---|---|
| Critical | 1 | 10 |
| Major | 67 | — |
| Minor | 53 | — |
| **Total open** | **121** | **78 auto-resolved** |
| **Total items** | **199** | (182 prior + 17 new) |

### Remaining Critical

| # | File:Line | Issue |
|---|---|---|
| 86 | `IdentityHeaderFilter.java` | `Trade-Imports-Organisation-Id` is still a client-supplied header with no in-repo trust boundary (gateway/auth). README now documents the CDP/BFF expectation; enforcement is still outstanding. |

### Notable new Majors from this refresh (#183–#199)

| # | File | Issue |
|---|---|---|
| 184 | README.md | bounce fix points at a workspace-stack service that does not exist |
| 185–186 | api-contract.locked.yaml | minLength:0 on @NotBlank fields; Problem `required` arrays dropped |
| 191–192 | GlobalExceptionHandler.java | new 409 OptimisticLocking handler — no tests, not in locked contract |
| 197–198 | OperatorComplianceIT.java | generate flag still skips gates; schema assert fails open |
| 199 | EmfMetricsPublisherTest.java | NaN-skip test does not assert skip behaviour |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| — | — | N/A | EUDPA-58 is an **Epic** with an empty Acceptance Criteria section. No AC exist to check this PR against. |

## Next steps

1. Address Critical #86 (enforce or formally Won't-Fix with an ADR/runbook).
2. Walk the new Majors (#183–#199) via `walk review EUDPA-58`.
3. Drain remaining prior Majors that the fix window did not touch.
