# pp-075 — fix pass

This brief OVERRIDES the generic `fix.md`. **The `-tests` repo**, a separate git repo on
`spike/trace-to-requirements`.

## ⚠ READ THIS FIRST — YOUR WORK IS ALREADY STAGED. DO NOT START OVER

`git -C repos/trade-imports-animals-tests status` shows four staged paths. That is pp-075's
implementation and it is **good work** — the rowheader locator, the `createdAt,asc` anchoring, keeping
the results label away from active filters and the exact-lookup search cases are all correct and stay.
**Preserve them.** You are amending, not rewriting.

The stack is up and healthy; the real-mode frontend on `:3100` serves local source. Do not rebuild it.

---

## What I verified myself before writing this

I triaged all six review findings against the source. **Five are real. One is wrong about its own
mechanism and I have cut it down. And there is a seventh that neither of you found.** Where I have
already done the checking, I say so — do not spend your budget re-deriving it.

---

## FIX 1 — ⚠⚠ THE INCREMENT MADE AN UNRELATED SPEC NON-DETERMINISTIC. THIS IS THE HEADLINE

`dashboard-pagination.spec.ts:18` creates **23** notifications on every run. I measured Mongo before and
after: the dashboard-visible collection went from **32 to 58**, against a page size of 25.

`tests/e2e/features/plant-products/api-seed-loads.spec.ts:40-43` opens the dashboard on the **default
`arrivalDate,desc` sort** and asserts the seeded draft row is visible. I emulated the backend's exact
page-1 query in Mongo: **the three seeded rows now sit at positions 18, 21 and 22 of 25.** Three rows of
headroom.

**The decisive detail, and the reason "it is green" proves nothing:** 55 of the 58 rows have **no
`transport.arrivalDate` at all**, and `PlantProductsNotificationSort.java:38` sorts on that field with
**no secondary key**. The seeded documents are the *first four ever inserted*, yet they sort to 18/21/22
— so insertion order is demonstrably not protecting them. The order among ties is unspecified. The
review adds the point that clinches it: the green run happened to schedule the seed test **before** the
pagination test, and the workers are `fullyParallel`, so that run cannot refute the reverse ordering.

**THE FIX IS TO MAKE THE ASSERTION DETERMINISTIC, NOT TO MANAGE THE VOLUME.** Cleaning up the 23 rows
would restore today's luck and nothing more; the next increment that creates rows re-opens it.

Edit `tests/e2e/features/plant-products/api-seed-loads.spec.ts` so its dashboard test navigates with
`sort=createdAt,asc`, under which SEED01 is row 1 by construction (seeded `created` is 2026-08-01,
older than anything the suite can make).

**⚠ DO NOT change it to a reference search instead.** That is the review's first suggestion and it is
wrong: searching narrows to one row, which would destroy what that test actually proves — that the
seeded draft appears **in the unfiltered list** while the DELETED one does not. Keep both assertions
meaningful.

**This is a deliberate, ruled scope extension beyond `filesToTouch`** — one line, in the same repo and
the same test area, to a spec this increment endangers. Recorded here so it is reviewed as a scope
decision rather than discovered in a diff.

## FIX 2 — THE COUNTRY FILTER TEST PASSES WHETHER OR NOT THE FILTER WORKS

`dashboard-search.spec.ts:114-129`. It sorts `createdAt,asc`, filters `countryOfOrigin=FR`, then asserts
the first three rows are SEED01/02/03. **Under `createdAt,asc` with no filter at all, the first three
rows are already SEED01/02/03** — and I confirmed all four seeded rows carry `countryCode: 'FR'`
(seed file line 26). So a country filter that is completely ignored produces exactly the asserted
result. **The test cannot fail.** This is the pp-038 class again.

It needs a **non-FR row on the same page**, which `createdAt,asc` cannot give you (anything you create
is the newest and sorts last). Use the arrival axis instead, the pattern this increment already
established: create one FR row and one non-FR row with far-future arrival dates, sort
`arrivalDate,desc` so both are at the top of page 1, then filter to FR and assert **the FR reference
survives and the non-FR reference is absent**. `createFullNotification()` already originates in Brazil,
so the non-FR row is nearly free.

**Pick dates that cannot collide with the sort spec's 2099-12-30/31 or the date-range test's
2098-06-15** — and see FIX 4, which governs how you choose dates at all.

## FIX 3 — FOUR TESTS WHOSE NAMES CLAIM MORE THAN THEY PIN

`dashboard-sort.spec.ts:31-38`. Each generated test is named *selecting "&lt;label&gt;" submits the
corresponding sort* but asserts only `url.searchParams.has('sort')`. **All four would pass if every
option submitted the same token**, so nothing pins the label-to-token mapping the names claim. Pair each
label with its expected token (`arrivalDate,desc` / `arrivalDate,asc` / `createdAt,desc` /
`createdAt,asc`) and assert the exact value.

This weakness came from the live-animals exemplar. Do not treat "the exemplar does it this way" as a
defence — that file also explicitly declines to assert order, which is why this increment exists.

## FIX 4 — ⚠ THE ARRIVAL ORDER TEST HAS NO MIDDLE, AND IT CANNOT PASS ON RETRY

Two defects in `dashboard-sort.spec.ts:51-76`, one from the review and one **neither of you found**.

**(a) No middle element.** It asserts two references in order. The house standard is explicit: for any
collection, a **middle** entry must be removable-and-detectable, with survivors asserted by identity and
order. Two elements have no middle. Use **three** rows with three distinct arrival dates.

**(b) ⚠ IT CANNOT PASS ON RETRY, AND `retries: 1` IS CONFIGURED.** The dates are hardcoded
(`2099-12-31`, `2099-12-30`). On a retry the test creates **two more rows with the same two dates**.
Both `12-31` rows then sort above every `12-30` row, so position 2 can never be the `earlier` reference
and the assertion fails with certainty. A retry exists to absorb a transient failure; this converts one
into a permanent failure, and the first attempt's rows poison the second.

**Fix both at once by dropping the absolute-position claim.** Take the rendered references, keep only
the three this test created, and assert that filtered sequence equals `[latest, middle, earliest]` by
identity and order. That is **retry-safe, volume-safe, parallel-safe, and strictly stronger** than "they
are rows 1–3": it still fails if the middle row is misordered or missing, and it stops asserting a
position that was never part of the claim. **Rename the test** — it currently says *puts … first*, and
after this it no longer claims that. Report the before/after name.

## FIX 5 — SNAPSHOTS WHERE WEB-FIRST ASSERTIONS BELONG

`dashboard-sort.spec.ts:47` and `dashboard-pagination.spec.ts:26,37` read `allTextContents()` /
`textContent()` after waiting only for `.first()` to be visible. That is a one-shot snapshot of a
collection whose later members are not waited for — against the Playwright house rule. Use retrying
locator assertions (`toHaveText` on `nth(0)`, `nth(1)`, `nth(2)`, or an equivalent web-first form).
Where FIX 4 needs to filter a list, do the filtering inside `expect.poll` rather than on a snapshot.

## FIX 6 — ASSERT THE PAGE SIZE YOU CLAIM, BUT ONLY THAT

`dashboard-pagination.spec.ts:23`. The review claims the test would pass with a middle row missing.
**I checked and that mechanism is wrong** — `controller.js:122-127` feeds `rows.length` to *both*
`notificationRows` and `buildPageResultsRangeLabel`, so dropping a rendered row changes the label to
*Showing 1 to 24* and the assertion fails. The class **is** caught, just indirectly.

Still worth making explicit, because relying on it is accidental: add
`expect(referenceRowHeaders).toHaveCount(25)` on page 1. **Do NOT also add the first-three-seeded
identity assertions the review asked for** — the sort spec already owns that, and duplicating it here
buys nothing and couples the pagination test to seed data it does not need.

## Also, while you are in the page object

`plant-notification-dashboard-page.ts:77` — `emptyState` targets
`'You have no import notifications.'`. **This dashboard never renders that string**; the real
empty-state copy is `'No notifications found'` (`copy.en.js:79`), which your new
`noNotificationsFound` getter correctly targets. It is dead, it is unused anywhere in the repo (I
grepped), and it now sits beside a working getter for the same concept. **Delete it.**

I checked your change to `open()` — waiting for `resultsLabel` — and I am **keeping it**. The results
paragraph is unconditional in the template (`template.njk:91`) and your regex covers all three strings
`buildPageResultsRangeLabel` can return, so it cannot hang. Say nothing further about it.

---

## Constraints

- **Do not weaken any assertion to make something pass.** Every change here strengthens or makes
  deterministic; if you find one that cannot, stop and report `ok:false`.
- **Do not touch the frontend, the backend or the mongo seed.**
- `api-seed-loads.spec.ts` is the ONLY file outside the original four you may edit, and only as FIX 1
  describes.
- Report the test count before and after with `git diff --staged -U0` and
  `grep -cE "^- *(it|test|describe)\("`. **Any movement must be explained**, and a renamed test is a
  removal plus an addition — say so.
- `npm run typecheck`, `npm run lint`, `npm run format:check` green.
- Re-run the plant suite AND the live-animals suite. **live-animals must stay at 139 collected.**
- **Stage, do not commit.**

## Prove the fixes, do not assert them

For **FIX 2** and **FIX 4** specifically, report the mutation and the failing test **name**:

1. Make the country filter a no-op from the test's point of view (filter to a country no row has, or
   skip applying it) — the rewritten test must fail. **Before this fix it would not have.** That
   contrast is the evidence I want, not a green run.
2. Reorder the middle arrival row — the rewritten test must fail by name.

**Say what the code now does differently before believing any result.** On this build an inert mutation
has falsely confirmed a finding, an inert one has falsely refuted a correct fix, and an
internally-inconsistent one has falsely refuted. **If a mutation goes green, ask what else already
enforces the thing you thought you had broken** rather than concluding the pin is missing.
