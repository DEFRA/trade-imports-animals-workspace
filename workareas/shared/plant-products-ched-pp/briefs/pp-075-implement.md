# pp-075 — tests repo: plant dashboard search, sort and pagination coverage

This brief OVERRIDES the generic `implement.md`. **The `-tests` repo — a SEPARATE git repo** with its
own remote, branch, CI and `package.json`. Rollback is `git stash push -u`, never `reset --hard`.

**The stack is ALREADY UP and healthy**, including the `test-target` real-mode frontend on `:3100`,
built from **local source** (I checked the container: it bind-mounts
`repos/trade-imports-animals-frontend/src` → `/home/node/src`). **Do not rebuild it.** Baselines I ran
myself tonight, twice: plant `31/31`, live-animals `137 passed + 1 flaky-passing + 1 skipped = 139`.
The plant suite passing `varieties.spec.ts` is itself proof the app is current — that spec selects the
real source UUID pp-092 corrected, which did not exist before.

## Step 1 of your work is NOT writing a spec. It is reading §2 below.

Four of pp-075's eight acceptance criteria are unsatisfiable by a naive transposition of the
live-animals exemplars, for reasons that are invisible until you look at the data and the config. I
have done that reading. **Every number below I measured or read myself — none is quoted forward from a
plan.**

---

## §2 — The six facts that decide this increment

### FACT 1 — ⚠⚠ THE DASHBOARD IS NOT SESSION-SCOPED, AND THE SUITE ALREADY OVERFLOWS PAGE 1

`sets/plant-products/services/records/real.js:108-128` — `list()` builds its query from `page`, `sort`
and `referenceNumber` **only**. The `journeyIds` that `engine/journey.js:88` computes from the session
are **passed in and silently ignored** by the real adapter. The backend
(`PlantProductsNotificationService.findAll`) returns **every** non-DELETED notification for the org.

So every dashboard row created by **any other spec, in any other worker**, is on your page.

Backend page size is **25** (`application.yml:159`,
`PLANT_PRODUCTS_NOTIFICATION_LIST_PAGE_SIZE:25`). I measured Mongo immediately after a full plant run:
**33 documents, 32 dashboard-visible, exactly 1 with an arrival date.** `shared-config.ts` sets
`fullyParallel: true` with default local workers.

**Consequence, and it is the whole increment:** you may not assert a total, a row count, an exact
`Showing X to Y of N` string, or any absolute row position — *except* where anchored per FACT 2.
Use `\d+` for totals, exactly as the live-animals pagination exemplar already does.

### FACT 2 — THE ONLY DETERMINISTIC ANCHOR IN THE SYSTEM IS `sort=createdAt,asc`

`seeds/mongodb/30-seed-plant-products-notifications.js:60` gives the four seeded rows
`created` of `2026-08-01T08/09/10/11:00:00Z` — SEED01, SEED02, SEED03, SEED04 in that order.
Today is 2026-08-03. **Nothing the suite creates can be older.**
`PlantProductsNotificationSort.java:32` maps the `createdAt` token to the entity's `created` field.
SEED04 is `DELETED` and `DASHBOARD_STATUSES` (`PlantProductsNotificationService.java:32-35`) is
`DRAFT, SUBMITTED, AMEND`, so it is filtered **server-side**.

**Therefore under `?sort=createdAt,asc` the first three result rows are always, in this order:**
`GBN-PP-26-SEED01` (DRAFT), `GBN-PP-26-SEED02` (SUBMITTED), `GBN-PP-26-SEED03` (AMEND).
That is immune to volume and to parallel workers. **Anchor every order-sensitive assertion there.**

### FACT 3 — ⚠ THE SEEDED ROWS HAVE NO `transport` AT ALL

Read the seed file: there is no `transport` key. So for all three visible seeded rows:
- the **Arrival** cell renders empty (`marshal.js:27` → `dto.transport?.arrivalDate ?? null` →
  `formatDisplayDate(null)` → `''`);
- the **default sort is `arrivalDate,desc`** (`notification-helper.js:12`), so they sort with a missing
  key and their order under the default sort is **not defined by anything you can assert**;
- the **arrival date-range filter excludes them entirely** — `applyArrivalRangeFilter`
  (`notification-helper.js:159-169`) drops any row whose arrival string is empty.

**Do not edit the seed to add arrival dates.** I considered it and ruled it out: it would silently
re-order the default-sorted dashboard that every existing spec sees, and FACT 2 already gives the
determinism without touching shipped fixture data. If you want an arrival-dated row, create one
(FACT 5).

### FACT 4 — ⚠ THE SEARCH IS AN EXACT REFERENCE LOOKUP, NOT A KEYWORD SEARCH

`PlantProductsNotificationService.findAll:108-113` — a non-blank `referenceNumber` becomes
`findByReferenceNumberAndStatusIn(trimmedReference, DASHBOARD_STATUSES)`, wrapped as a one-element
page, or `Page.empty` when absent. There is **no substring or keyword matching**, despite the field
label being *"Keywords or reference"* (`copy.en.js:28`). Assert what the system does:

- exact seeded reference → **1 row**;
- a partial reference or free text → **0 rows**, `No notifications found`, results label `0 results`;
- **`GBN-PP-26-SEED04` → 0 rows.** That is the AC's "the DELETED row never appears in any search
  result", and it is enforced in the repository query, not in the controller's defensive filter.

### FACT 5 — THE API JOURNEY ALREADY CREATES REAL ROWS. USE IT INSTEAD OF 22 UI ROUND-TRIPS

`flows/plant-products/api-journey.ts` gives you `createEmptyNotification()`,
`createFullNotification()` (which sets `transport.arrivalDate` to **today + 14** and origin **Brazil**)
and `createSubmittedNotification()`; `adapters/http/plant-products-api-client.ts` gives you raw
`create()` / `replace()` / `setStatus()`. The live-animals pagination exemplar drives **21 UI
creations**; you do not have to, and should not — go through the API.

**These rows are produced by the system.** A hand-authored Mongo row would be the dominant failure mode
on this build (nine instances). Use the API.

### FACT 6 — ⚠ THE LIVE-ANIMALS SORT EXEMPLAR EXPLICITLY REFUSES TO ASSERT ORDER

`tests/e2e/features/live-animals/notification-dashboard-sort.spec.ts:32`:
*"Sort order correctness is covered by lower-level tests; this spec validates sort option submission
only."* pp-075's fourth acceptance criterion — *"Sort specs assert row ORDER, not mere presence — a
sort that returns the same set unordered must fail"* — **cannot be met by transposing that file.**
You must go beyond the exemplar. That is the point of this increment.

---

## §3 — Rulings. These are decided; do not re-open them, and do not decide them by omission.

**R1 — Anchor on FACT 2.** Order assertions use `?sort=createdAt,asc` and the three seeded references.

**R2 — The sort spec asserts order in two directions, both anchored:**
- `createdAt,asc` → the first three reference cells are exactly
  `['GBN-PP-26-SEED01','GBN-PP-26-SEED02','GBN-PP-26-SEED03']`, as an **ordered** array assertion.
- A second case that discriminates **direction**, not merely that a sort ran. My suggestion, which you
  may replace with something better if you can justify it: create two notifications through
  `plantProductsApi` whose `transport.arrivalDate` values are far beyond anything else in the system
  (everything else is today+14 or absent), then under the default `arrivalDate,desc` assert those two
  are the first two rows, later date first.
  **⚠ I do not know whether the backend accepts an arrival date that far out.** Find out. If it
  rejects it, say so in `notes` and use the largest it accepts. **Do not invent a date and hope.**
- Keep the cheap exemplar-style cases too (the four options are present, in order, and the default
  selected option is *"Arrival (newest to oldest)"*). They are real and they transpose cleanly.

**R3 — Reuse `@domain/shared/constants/sort-by-values`.** It lives under `domain/shared/`, not
`domain/live-animals/`, so it is not a cross-set import, and its four labels are byte-identical to the
plant bundle's (`copy.en.js:61-66`). **Note in your report that it is a second hand-maintained
duplicate of frontend copy** — the same class as the commodity-constants drift pp-092 fixed. Do not fix
it here; it spans two repos and is Sam's call.

**R4 — Pagination.** Create the headroom yourself through the API; do not rely on the suite's
incidental volume, because your spec may run first. Page size is **25**, not live-animals' 20, and the
plant results copy is lower-case: `Showing ${start} to ${end} of ${total} results`
(`copy.en.js:72-73`) — the exemplar's `/^Showing 1 to 20 of \d+ Results$/` is wrong twice over.
Assert: Next visible → click → URL front-anchored on `/plant-products` with `page=2` → Previous
visible → the first reference on page 2 differs from page 1 → `GBN-PP-26-SEED04` on neither page.

**R5 — ⚠ DO NOT ASSERT THE RESULTS LABEL WHILE A STATUS / COUNTRY / DATE FILTER IS ACTIVE.**
`buildPageResultsRangeLabel` (`notification-helper.js:87-100`) combines the **unfiltered**
`totalElements` from the backend with the **filtered** row count, because pp-037 applies those three
filters controller-side to the current page only. Filtering 25 rows down to 5 renders
*"Showing 1 to 5 of 32 results"*. **This is the recorded pass-1 consequence of pp-037's first
`openQuestion` and is already parked for Sam. Do not fix it, do not raise it, and do not pin it as if
it were correct.** Keep the results label and the three controller-side filters in separate tests.

**R6 — Scope is the four paths in `filesToTouch` and nothing else.** No seed edit (R/FACT 3), no
frontend edit, no backend edit. If you believe one is required, stop with `ok:false` and the evidence.

**R7 — `internalReference` is NOT searchable; the increment's open question is closed.**
`controller.js:89-93` passes only `page`, `sort`, `referenceNumber` to `listKnownJourneys`, and
`PlantProductsNotificationController:132-137` accepts only those three. pp-037 did not add it. **No
case is gained.** Record the closure in `notes`.

**R8 — ⚠ DO NOT DERIVE YOUR EXPECTED ORDER FROM `plantProductsApi.list()`.** It is available and it is
a trap: comparing the UI against the same backend call the UI makes passes even when both are wrong.
That is the pp-038 class, eight instances and counting. Expectations come from the **seed file's known
`created` values** and from **dates you chose when creating a row**.

---

## §4 — Two locator traps I found by reading the template

**⚠ THE REFERENCE CELL IS A `<th scope="row">`, NOT A `<td>`.** `template.njk:129`. In the accessibility
tree that is `rowheader`, not `cell`. So `row.getByRole('cell').first()` returns the **Status** cell,
and a sort-order assertion built on it would compare the wrong column while looking correct. The
existing page object's `resultRows` getter relies on this too — it filters rows `{ has: cell }`, which
correctly excludes the header row because header cells are `columnheader`.

**⚠ THE RESULTS PARAGRAPH HAS NO ROLE.** `template.njk:91` is a bare `<p>`. The live-animals page
object's locator for it will not transpose. Pick something that reads as content, not as CSS.

Also worth knowing while you write the page object: the **filter form does not carry `page`**
(`template.njk:20-88` has no page hidden input) so a new search resets to page 1, while the **sort form
does** carry page and every filter (`template.njk:93-101`). Both are correct; pin the round-trip.

---

## §5 — Constraints

- **No plant page object may import from `page-objects/live-animals/`.** Standing rule, and an AC.
- **All three specs must be collected by BOTH `frontend-plant-products-chromium` and
  `e2e-plant-products`.** I checked both `testMatch` blocks and the paths in `filesToTouch` satisfy
  them — **confirm it with `playwright test --list` and report the counts, do not assume it.**
- Every URL assertion front-anchored on `/plant-products` and tolerant of a query string (pp-057).
- `npm run typecheck`, `npm run lint`, `npm run format:check` green.
- **The live-animals suite must be unchanged in count and result in the same run** — it shares the
  stack and the reseed. My baseline is **139** (137 + 1 flaky-passing + 1 skipped). A flaky journey spec
  that recovers on retry is a pass, not a failure.
- Run suites **to a file** under `<workarea>/logs/` and read it once. For Playwright failures read
  `test-results/*/error-context.md`, not the tail of the run.
- **Stage, do not commit.** The orchestrator lands it.
- At most 3 self-repair attempts on a red step, then `ok:false` with what is red and what you tried.
  **Never weaken a test to make it pass.**

## §6 — The decisive mutations I expect, each reported by failing test NAME

1. **Swap two adjacent expected references** in the `createdAt,asc` array — must fail by name. This is
   what proves the assertion is order-sensitive rather than set-sensitive, which is the AC.
2. **Point the sort control at the default token** instead of the one under test (i.e. make the spec
   navigate without the `sort` param) — the order case must fail, proving the spec exercises the sort
   rather than passing on whatever order the backend happened to return.
3. **Search for `GBN-PP-26-SEED04`** and show it returns zero rows — then show that searching
   `GBN-PP-26-SEED01` returns one, so the zero is the DELETED filter and not a broken search.

**⚠ SAY WHAT THE CODE NOW DOES DIFFERENTLY BEFORE BELIEVING ANY RESULT.** On this build an inert
mutation has falsely **confirmed** a finding (pp-078, caught only by an implementor's refusal), an
inert one has falsely **refuted** a correct fix (pp-083), and an internally-inconsistent one has
falsely refuted (pp-091). All three directions have bitten.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME HERE, AND I MEAN IT.** My briefs have been wrong
seven times and every time the implementor or reviewer was right. If FACT 2's anchor does not hold when
you run it, or the arrival-date ceiling makes R2's second case impossible, **stop and report** rather
than inventing data or weakening the criterion.
