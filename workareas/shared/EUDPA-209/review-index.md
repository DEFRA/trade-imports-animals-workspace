# Code Review: EUDPA-209

**Ticket:** Update govuk parent layout to use govuk-grid-column-full
**Reviewer:** Claude Code Agent
**Date:** 2026-06-09
**Last Updated:** 2026-06-10 (refresh)
**Verdict:** NEEDS MORE WORK

## Summary

A clean layout-centralisation refactor: column width moves into the shared `layouts/page.njk` (`govuk-grid-column-full`), all views migrate to `{% block pageContent %}`, and the `appHeading` component is reworked with renamed params (a latent empty-heading bug fixed in passing). The companion tests PR keeps the transporter E2E locator in sync.

**Refresh 2026-06-10:** follow-up commit 2ddf65e ("fixed a11y issues") resolved all 7 first-pass findings — including the three Majors (invalid `<p>`-in-`<h1>`, spacer paragraphs, orphaned `content`-block pages). However, it introduced a new Major issue in `reference-number-caption/macro.njk`: an unconditional wrapper `<p>` that renders an empty 30px-margin paragraph on every page without a reference number, with no test pinning the behaviour (items #8/#9), plus a Minor missing `govuk-body` class on the error page (#10).

## Repositories Analyzed

| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-frontend | #126 | 2ddf65e | 26 | NEEDS ATTENTION | [review.trade-imports-animals-frontend.md](review.trade-imports-animals-frontend.md) |
| trade-imports-animals-tests | #56 | c330fae (merged) | 1 | SAFE | [review.trade-imports-animals-tests.md](review.trade-imports-animals-tests.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | Update parent layout `layouts/page.njk` to `govuk-grid-column-full` | ✅ | Width now owned in one place |
| 2 | Remove duplicated per-page `govuk-grid-column-*` wrappers | ✅ | All 23 views migrated as of 2ddf65e — `about`, `error`, `auth/unauthorised` now on `pageContent` (item #7 resolved) |
| 3 | Remove width ownership from `appHeading` component | ✅ | Component grid wrapper removed |

The ticket has no explicit AC section and two open refinement questions (which pages stay two-thirds, whether visual checks are in scope) — finding #7 maps directly onto the first unresolved question.

## Test Coverage Assessment

- **Unit Tests:** Present — `heading/template.test.js` updated to the new macro contract.
- **Integration Tests:** Present — transporter E2E locator updated (tests PR #56).

## Configuration & Environment

- **New Environment Variables:** None
- **Database Changes:** None

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Low |
| Code Quality | Medium |
| Security | Low |
| Test Coverage | Low |

## Conclusion

The refactor achieves its goal and is well-coupled across the two repos, and the follow-up commit cleanly resolved every first-pass finding. Before merge, address the new unconditional caption wrapper in `reference-number-caption/macro.njk` (#8) and pin it with a test (#9); the missing `govuk-body` class on the error page (#10) is non-blocking. Full item details are in `review.trade-imports-animals-frontend.md`.
