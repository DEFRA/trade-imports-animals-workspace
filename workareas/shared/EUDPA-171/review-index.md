# Code Review: EUDPA-171

**Ticket:** Amend notification
**Reviewer:** Claude Code Agent
**Date:** 2026-06-19
**Verdict:** PASS WITH NOTES

## Summary
Adds the end-to-end "amend a submitted notification" journey across backend,
frontend, and E2E tests. The cross-repo contract (HTTP endpoint, `AMEND` status,
outbox event wire string, yellow status tag) is consistent and well-tested. No
genuine blocking defects; a handful of non-blocking items to tidy before merge.

## Repositories Analyzed
| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-backend | #50 | e2ce89c | 9 | NEEDS ATTENTION (low) | [review.trade-imports-animals-backend.md](review.trade-imports-animals-backend.md) |
| trade-imports-animals-frontend | #138 | 9b2c969 | 13 | NEEDS ATTENTION (med) | [review.trade-imports-animals-frontend.md](review.trade-imports-animals-frontend.md) |
| trade-imports-animals-tests | #64 | e4be28b | 5 | NEEDS ATTENTION (low) | [review.trade-imports-animals-tests.md](review.trade-imports-animals-tests.md) |

## Acceptance Criteria Check
| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| AC1 | Amend action on dashboard for SUBMITTED notifications | Yes | `home/index.njk` + controller tests gate it to SUBMITTED only |
| AC2 | Amend action on notification-view screen for SUBMITTED | Yes | `notification-view/index.njk` + controller tests |
| AC3 | Amend → view page, status "Amend", Change links, persisted edits | Yes | Backend transitions SUBMITTED → AMEND; Change links shown in AMEND state |
| AC4 | CTAs on view page in AMEND state | Yes | Confirm-and-submit CTA shown for AMEND |
| AC4 (resubmit) | Confirm and submit → declaration → status back to Submitted | Yes | `submitNotification` accepts AMEND as source; E2E lifecycle spec covers round-trip |

## Test Coverage Assessment
- **Unit Tests:** Present — strong on backend service/outbox and frontend client/helpers/templates; two amend-controller-test gaps (missing config mock, weak assertion).
- **Integration Tests:** Present — E2E amend entry points, lifecycle round-trip, and outbox events.

## Configuration & Environment
- **New Environment Variables:** None.
- **Database Changes:** None (additive enum value `AMEND`; no schema migration).

## Risk Matrix
| Category | Risk Level |
|----------|------------|
| Correctness | Low |
| Code Quality | Low |
| Security | Medium |
| Test Coverage | Low |

Security is Medium only because the amend POST controller lacks explicit route
param validation and `crumb` config that the sibling delete/view routes carry —
worth the author confirming whether global crumb covers the form POST.

## Conclusion
A clean, well-tested three-repo feature with a consistent cross-service contract.
The two backend "critical" findings were false positives (auto-resolved — the
methods/enum exist). Real items are non-blocking: frontend route param
validation + CSRF config, two pino-logging style fixes, an amend-controller-test
setup gap, and minor test-isolation/page-object polish. Item details live in
each `review.{repo}.md`.
