# pp-080 — second fix brief (post-review)

## ⚠ FIRST: run `git status`. YOUR WORK IS STAGED AND MOSTLY RIGHT. DO NOT START OVER.

The staged spec is +478/−228 with zero test declarations added or removed, all three blanking mutations
proved, and the full ladder green. **Preserve it.** Two review findings, both verified by me against the
source. Both are on staged, unlanded work, so both get fixed now.

---

## 1. ⚠ MAJOR — the rewrite WEAKENED an assertion while strengthening others

This is the one that matters, and it is worse than the review states.

**What you strengthened, correctly, and must keep:** `toContainText` → exact `toHaveText`, and the loose
key match → the anchored exact-key regex in `summaryValueByKey`. Both are real gains and are the point
of the increment.

**What you dropped:** the old `expectCardValues(page, heading, values)` resolved
`cardFor(page, heading)` — a `section` located by an **exact level-2 heading** — and asserted every
value **inside that section**. The new `expectSummaryValues(page, values)` locates every row
**globally across the page**.

**I checked how far this goes: `grep -n "level: 2"` on the current spec returns NOTHING.** There are now
**zero card-heading assertions in the entire file.** So today:

- deleting or renaming a card's `<h2>` passes,
- rendering a keyed row under the **wrong card** passes.

**That is an L1 shape assertion weakened, inside the increment whose whole purpose is to strengthen
them.** The standing rule is explicit: shape assertions are in scope to **UPDATE, never to WEAKEN** —
keep exact equalities exact.

**The fix:** group the summary expectations **by card**; locate each card through its **exact level-2
heading**; resolve each exact key/value row **within that section**. Keep the exact `toHaveText` and the
anchored key regex — this is additive to what you built, not a revert of it.

**Report before/after for any expected value that changes.** If grouping reveals that a row is
currently rendered under a different card than you expect, **stop and report it** — that would be a
production defect, and it becomes its own increment exactly as pp-087 did. **Do not move production
code to match the test.**

## 2. Minor — one hand-authored expected value, in the increment built to forbid them

Line ~728:

```js
[`${cards.commodities.columns.intendedForFinalUsers} (commodity 1)`, 'Yes'],
```

`'Yes'` is a literal. Meanwhile `fullJourneyValues` line 63 holds `intendedForFinalUsers: true`, and
line 326 already derives the radio label from that same value when driving the journey. **So this is
the one expected display value disconnected from what the journey submits** — the precise failure mode
this increment exists to kill, and the third instance in this file's history (pp-038's invented
`arrivalDate` shape, pp-079's `'manual'` for a controller that writes `'MANUAL'`).

Derive it, e.g. `yesNo(fullJourneyValues.commodities.lines[0].intendedForFinalUsers)`, preferably via a
named reference to that first commodity line rather than repeating the index.

**Then sweep for the same shape.** If any other expected value is a literal that should be derived, fix
it or say why it must stay literal. A value that agrees with the page because both were typed by hand
proves nothing.

## 3. What I raised and the review talked me out of — do NOT act on it

I flagged that all three blanking mutations fail the same omnibus test,
*'reads back the fully populated journey, pins collection order and exposes distinct Change names'*,
whose name no longer describes what it discriminates. **The review declined to treat that as a finding
and gave a reason I accept:** splitting would duplicate a slow full journey run, *'reads back the fully
populated journey'* does cover the new assertions, and the custom assertion messages
(`Summary value for "<key>"`, `Nominated contacts row 2`) carry the value-level failure context.

**So do not split the test and do not rename it.** Fixing §1 groups the expectations by card, which
improves how it reads anyway.

## 4. Verification

Re-run the **full ladder**. Baselines at HEAD `2ee0999d`:

| Leg | Baseline |
|---|---|
| plant unit | **682** (58 files) |
| `npm test` | **2,320 / 8 skipped** (217 files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| `lint:arch` | **0 / 0**, **671 modules**, 2,128 dependencies |
| plant Playwright | **256 passed, zero flaky** |

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**⚠ Re-run ONE blanking mutation after the §1 change** — a summary-row one — and confirm it still fails
with the value named. Regrouping the assertions could plausibly change which locator fires; the mutation
evidence must survive the fix, not just precede it.

**Add one NEW mutation that §1 exists to catch:** rename a card's level-2 heading and confirm a test
fails. If nothing fails, §1 is not actually fixed.

**Playwright needs `PORT=3201`.** Sandboxed Chromium routinely fails first on macOS Mach-port
permissions; the permitted rerun passes.

## 5. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** `git diff --staged -U0` then
  `grep -cE "^- *(it|test|describe)\("` is **0** now — keep it explainable.
- **Do not touch `summary-row.js`** — owned by pp-083.
- **Do not weaken anything pp-079 or pp-087 landed.**
- Run `npm run format`. **Leave everything staged. Do NOT commit.**
- **If either finding is wrong, return `ok:false` with evidence.** You were right to stop on pp-087 and
  the build is better for it.
