# pp-066 — fix pass. Three specs wait on something that also renders in the wrong state.

**Tests repo.** **`git status` first — your six specs are staged and correct. Preserve them.** Stack is
up; do not rebuild.

**Your three workarounds were all checked and all cleared.** The review verified against the frontend
source that the hub really does expose groups 1–10 and 12, that the review route only varies its status
strip, and that empty/no-match genuinely share one zero-row branch. It also confirmed **the rebuilt
review has no Copy controls** and that the legacy same-page-link and `--next-to-breadcrumbs` defects are
absent — so your documentation of those limitations is accurate, not an excuse. Exclusions and viewport
settling are compliant. **No whole spec is redundant.**

**All three findings below are the same shape:** the spec waits on something that ALSO renders in the
state it is supposed to be excluding, so it can scan the wrong page and pass.

---

## FIX 1 — ⚠ the dashboard "populated" scans can be scanning the EMPTY page

`notification-dashboard-views.spec.ts:49`. You wait on `resultsLabel`. I checked the page object: that
locator is

```
/^(?:0 results|1 result|Showing \d+ to \d+ of \d+ results)$/
```

**It matches `0 results`.** So the populated, sorted and search-match scans are satisfied by the
zero-row rendering — the exact state the spec has a *separate* case for. A regression that hid every
row, or a missing seed, would leave three named "populated" scans quietly scanning an empty page and
passing axe.

Assert a visible row (or a non-zero count) **before** each populated and sorted scan, and for the
search-match scan assert `dashboard.row(created.referenceNumber)` **and** `1 result` specifically.

## FIX 2 — ⚠⚠ the view-states spec reproduces the exact gap it was written to close

`notification-view-states.spec.ts:12`. DRAFT, SUBMITTED and AMEND each wait only on the shared heading.
**All three routes render the same editable template** — you established that yourself — so nothing in
this spec distinguishes them. A regression rendering every request as Draft would scan essentially the
same DOM three times and pass.

**This increment exists because the legacy service's own a11y suite scanned its review page ONLY in the
DRAFT state.** As written, this spec has the same coverage as that one while appearing to have three
times as much. That is worse than the legacy gap, because it looks covered.

Assert the visible journey-strip tag is **`Draft`**, **`Submitted`** and **`Amending`** respectively,
immediately before each scan. **Keep your comment documenting that SUBMITTED is not a read-only view** —
that limitation is real and correctly recorded.

## FIX 3 — the filled state skips the pages it walks through

`notification-journey-filled-state.spec.ts:86`. `answerCommodities()` and `answerTraders()` traverse
several pages and you only reopen the input-method, summary, bulk-details and traders overview. So
commodity search results, the selected-species controls, populated variety rows, and the filled consignor
create/confirmation surfaces are **never scanned in their answered state** — which is what this spec is
for.

Drive those subflows step by step and scan commodity search, basic description, variety, consignor
create and consignor confirmation **after filling them, before navigating away**. **Keep the existing
two-line / three-species / three-variety summary scan** — that is the structurally richest thing either
set renders and it stays.

**This will make the spec slower. Take it.** The a11y fixture already allows five minutes per test
precisely because these walk several pages, and unscanned pages are the whole risk this suite addresses.

---

## Constraints

- **Do not weaken or remove any existing scan**, and do not convert an exact assertion into a looser one
  to make a step fit.
- **No global `disableRules`.** Any new exclusion is named, scoped to a selector, and commented with its
  upstream reason.
- **Keep `waitForViewportSettle` after every resize** even though you proved it is currently redundant —
  that is a property of today's markup, not a guarantee.
- Live-animals a11y specs stay untouched.
- `typecheck`, `lint`, `format:check` green.
- **Report the `@a11y --list` count again** — it was 20 (8 plant, 8 live-animals, 4 admin). If your
  changes alter it, explain why.
- Run `npm run test:docker-compose:a11y` and report passes, skips and flakes.
- Also re-run the plant suite and `test:live-animals`; report both counts and the flaky count.
- **Stage, do not commit.** Never run `sonar`. At most 3 self-repair attempts, then `ok:false`.

## Prove it, by failing test NAME

1. Point the search-match scan at a reference that does not exist → it must now **fail** rather than
   scan the zero-row page and pass.
2. Force the SUBMITTED step to open the DRAFT notification → the status assertion must **fail**.
3. Break a label association on one of the newly-scanned pages (commodity search or consignor create) →
   that scan must **fail**, proving the page is genuinely being scanned rather than merely visited.

**If any of those passes, the spec is not discriminating and you have more to do.**
