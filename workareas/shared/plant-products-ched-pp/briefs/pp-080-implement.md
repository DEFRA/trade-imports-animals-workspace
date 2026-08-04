# pp-080 — prove the review page reads back EVERY captured value

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong sixteen times, three destructively.

One file, `action: edit`, and it exists — I checked. This is a **test-strengthening increment**: it
adds no production behaviour. **If you find yourself editing production code, stop and report** — a
production change here means you have found a real defect, and that is a finding, not a fix.

pp-038's own acceptance criterion said the review page reads back every stored value. It does not
enforce that. This increment makes the claim true.

---

## 1. What is actually wrong, and why it passed

The fully-populated test asserts with **section-wide substring checks**. That shape cannot see:

- the commodity input method (only now rendered, by pp-079),
- the commodity measures,
- the official-seal values,
- most packer leaves,
- the first and last contact and document rows.

**A blank cell and a column-shifted cell both pass a substring check.** That is the whole defect.

## 2. What "asserted" has to mean here

**Every summary value by its OWN KEY.** The spec already has a `summaryValueByKey` helper — pp-079
used it. Use it, not `page.getByText(...)` over a card.

**Every table as a COMPLETE ORDERED CELL MATRIX.** Not "contains this string somewhere". Assert the
full row array in order so that a blank cell, a shifted column or two columns swapped all fail. The
spec already does this in places — `.locator('tbody tr').nth(1).locator('td')` with `toHaveText([...])`
— that is the shape to generalise, including the **first and last** rows, not just the middle one.

**⚠ ASSERT THE FULL RENDERED CELL SET. Do not filter anything out** to make a matrix line up — not
dividers, not separators, not empty cells. If a cell is empty, the assertion should say it is empty.

## 3. ⚠ THE VALUES MUST BE THE ONES THE JOURNEY ACTUALLY ENTERED

This is the increment's central hazard and it is the pp-038 defect class itself.

pp-038 shipped three defects with a green unit suite and **all three came from one cause: hand-authored
fixtures and mocks standing in for what the system actually produces.** One of them rendered literal
`undefined/undefined/undefined` because a test built `arrivalDate: {day, month, year}` — a shape no
controller writes — and the formatter was then written to match the invention.

pp-079 found a **fourth** instance in this very file's unit fixture: `commodityInputMethod: 'manual'`,
lowercase, when `commodity-input-method.controller.js:23` is `['MANUAL', 'CSV']`. It survived because
nothing rendered the field.

So: **derive every expected value from what `completeJourney` actually submits**, not from a
hand-written list beside it. If you write an expected string, you must be able to name the line in the
journey driver that entered it. **Ask what every expected value is a copy of.**

## 4. The mutation that decides whether this increment worked

AC 3 is the real bar: **blanking any single captured value in the journey must fail a test that names
that value.**

**Run at least three of these, spread across different shapes** — one summary row, one table cell in a
**middle** row, and one table cell in a **first or last** row — and report each by the failing test
name. The first/last case matters: pp-026's *'exposes renumbered indices'* could not detect a removal
that always hit index 0, and it passed 360 unit tests while the bug was live.

⚠ **A GREEN MUTATION RUN IS ONLY EVIDENCE IF THE MUTATION ACTUALLY CHANGES BEHAVIOUR.** Wrong three
times in this build — pp-025, pp-036, and pp-040 where the English fallback string was identical to the
GOV.UK macro default so no English assertion could discriminate. Before believing a green run, say what
the page now renders differently.

Restore byte-identically and confirm `git diff --stat` is empty against the index.

## 5. What pp-079 just landed that you should build on, not duplicate

- `withChange` inside `changeHref`, so **every** Change href and missing-answer href carries `?change=1`.
- A **set-aware** check-answers slug: `journeyCyaSlug()` from the `configureJourneyFlow` bag, so
  save-and-return resolves to `review-notification` in the plant set.
- Three separately-pinned `destinationSameAsConsignee` states.
- A `commodityInputMethod` row, with an exact accessible-name assertion and **a guard that no link has
  the accessible name exactly `Change`** — the scan locator `/^Change /` is otherwise blind to one.
- A named test, `saving an edited country of origin returns to the review page with the new value`.

**Do not weaken or re-do any of these.** L1 shape assertions are in scope to *update*, never to weaken:
keep exact equalities exact and report before/after.

## 6. ⚠ Known and deliberately NOT yours to fix

`summary-row.js:25` builds the missing-answer accessible name as localized copy plus a hardcoded
English `` ` for ${label.toLowerCase()}` ``, so under Welsh it is a mixed-language screen-reader name
that copy-parity cannot see. **Real, and already owned by increment pp-083.** Same for the
intended-final-users connective and the duplicated visible table captions. **Do not touch
`summary-row.js`.** If you think one cannot wait, say so and stop — do not fix it.

## 7. Baselines — verified by ME at HEAD (`4200b1ae`), the ladder I ran to land pp-079

| Leg | Baseline |
|---|---|
| plant unit `test:plant-products` | **677** (57 files) |
| `npm test` | **2,315 passed / 8 skipped** (216 files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 errors / 0 warnings**, 671 modules, 2,128 dependencies |
| plant Playwright | **256 passed, zero flaky** |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Playwright needs `PORT=3201`** — Docker holds 3000 and 3100. Sandboxed Chromium routinely fails first
on macOS Mach-port permissions; the permitted rerun passes. `net::ERR_NETWORK_IO_SUSPENDED` across
unrelated specs is the machine, not your code — report and re-run.

**The Playwright count will move. Explain the delta**, especially any downward move — pp-017 silently
deleted three browser specs and the only tell was 13 → 11. **This test is already slow (`test.slow()`);
if you split it, say why and what each half now discriminates.**

## 8. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with its replacement named. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation (pp-017's emptied fieldset legend,
  pp-024's identical accessible names). Keep the existing `expectAxeClean` calls; do not add a
  conditional-radio carve-out — this page renders no conditional radio.
- Use the **pp-076 shared axe helper**; never write a new inline `AxeBuilder` block.
- **NEVER INVENT DATA.** Eight increments have stopped rather than fabricate and every one was right.
  **Stopping twice carries no penalty; inventing one row does.**
- **REPORT UNDER-DELIVERY PLAINLY** — if some values genuinely cannot be asserted by key, say which and
  why rather than quietly covering the rest.
- **If my brief is wrong, return `ok:false` and say so.** Four of my briefs have been wrong and every
  time the implementor was right.
- Run `npm run format`. **Leave everything staged. Do NOT commit.**
