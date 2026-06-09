# Code Review: EUDPA-209

**Ticket:** Update govuk parent layout to use govuk-grid-column-full
**Reviewer:** Claude Code Agent
**Date:** 2026-06-09
**Verdict:** PASS WITH NOTES

## Summary

A clean layout-centralisation refactor: column width moves into the shared `layouts/page.njk` (`govuk-grid-column-full`), 16 views migrate to `{% block pageContent %}`, and the `appHeading` component is reworked with renamed params (a latent empty-heading bug fixed in passing). The companion tests PR keeps the transporter E2E locator in sync. Three Major findings warrant attention before merge — two on the heading component (invalid `<p>`-in-`<h1>` markup, empty spacer paragraphs) and one consistency gap (three pages still on the old `content` block bypass the new full-width wrapper).

## Repositories Analyzed

| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-frontend | #126 | 1d810fb | 22 | NEEDS ATTENTION | [review.trade-imports-animals-frontend.md](review.trade-imports-animals-frontend.md) |
| trade-imports-animals-tests | #56 | c330fae | 1 | SAFE | [review.trade-imports-animals-tests.md](review.trade-imports-animals-tests.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | Update parent layout `layouts/page.njk` to `govuk-grid-column-full` | ✅ | Width now owned in one place |
| 2 | Remove duplicated per-page `govuk-grid-column-*` wrappers | ⚠️ Partial | 16 views migrated; `about`, `error`, `auth/unauthorised` still on old `content` block (item #7) |
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

The refactor achieves its goal and is well-coupled across the two repos. Before merge, address the heading component's invalid `<p>`-inside-`<h1>` markup (#5) and empty spacer paragraphs (#6), and decide the fate of the three orphaned pages (#7). The minor items (caption drop on `commodities/select`, hardcoded heading on `destinations/select`, leftover indentation) are non-blocking. Full item details are in `review.trade-imports-animals-frontend.md`.
