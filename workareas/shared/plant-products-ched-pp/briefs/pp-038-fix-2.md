# pp-038 — FIX pass 2

**`git status` FIRST. Your work is STAGED. Do NOT start over, do NOT unstage, do NOT revert anything.**

The three ruled items from fix pass 1 are all genuinely closed, and **I verified the important one
myself**: reverting `flow.js` to `pages: []` now fails exactly one test, named for the behaviour —
*'registers review-notification as the review section entry page'* (`flow/task-rows.test.js:218`).
That is a real pin against the real `sections` export. Restored byte-identically.

**You found and reported two further defects rather than fixing them, because the fix workflow limits
a pass to the ruled items. That was the right call and it is why this pass exists.** Both are real.
Two items follow. **Item 1 matters more than the bug it contains.**

---

## 1. ⚠ THE UNIT FIXTURES INVENT SHAPES THE APP NEVER STORES — this is the third time in this increment

The symptom: the review page renders literal **`undefined/undefined/undefined`** for Estimated
arrival date. I reproduced it and read the DOM.

**Diagnosed to the line.** `value-text.js:42-46`:

```js
export const dateText = (value) => isBlank(value) ? '' : `${value.day}/${value.month}/${value.year}`
export const timeText = (value) => isBlank(value) ? '' : `${value.hour}:${value.minute}`
```

Both destructure an object. **The app stores strings.** `transport/controller.test.js:102-103` pins
what is actually persisted: `arrivalDate: utcDay(1).iso` — an **ISO date string** — and
`arrivalTime: '09:05'` — an **`HH:mm` string**.

**And here is the part that matters.** `check-answers.test.js:75-76` builds:

```js
arrivalDate: { day: '3', month: '8', year: '2026' },
arrivalTime: { hour: '14', minute: '05' },
```

**The unit test invented the shape, and the formatter was written to match the invention.** So
651/651 passed while the rendered page was broken. **That test pins its own fixture, not the system.**

**This is the third instance of the same root cause in this one increment:**

1. the hub "pin" was a **mock** returning a hardcoded href — it could not detect the flow wiring
   being removed at all (I proved that: 650/650 green with `pages: []`);
2. two critical axe violations — a nameless button and an empty link — passed 22/22 unit tests,
   because controller tests assert **view data, not rendered markup**;
3. this — a fixture asserting a shape no controller ever writes.

**All three are hand-authored fixtures and mocks standing in for what the system actually produces.**

### What to do

- **Fix both formatters to accept the real stored shapes** (ISO date string, `HH:mm` string) and
  render the display formats the page spec asks for. Do not "fix" this by changing what transport
  persists — `transport/` production code is not yours to touch here.
- **Fix the fixture at `check-answers.test.js:75-76` to use the real shapes**, so the unit test would
  now fail if the formatter regressed.
- **⚠ SWEEP EVERY OTHER FORMATTER IN `value-text.js` AGAINST WHAT IS ACTUALLY PERSISTED, and report
  the sweep leaf by leaf.** Do not assume date and time are the only two. Check in particular
  `yesNoText` (`:39-40`), which tests `value === true` — if any boolean obligation is persisted as a
  string it renders blank, exactly like the date did. Also confirm every reference-lookup text
  helper is being handed the code the app stores, not a label or an object.
- **For each leaf you check, state what the app stores and where you verified it** (the controller or
  its test that pins the persisted value). "Checked and fine" without a source is not a sweep.
- If the sweep finds nothing else wrong, **say so explicitly with the evidence** — that is a good
  outcome and reporting it plainly is the standard here.

**The e2e caught this and the unit suite did not. Do not weaken the e2e assertion to match the
formatter** — the e2e asserting the value the journey actually entered is the only reason this
surfaced.

## 2. The Welsh title is untranslated and `copy-parity` correctly rejects it

`npm test` is red on one assertion:

```
plant-products:check-answers: title must be translated (or allowlisted):
expected 'Review your notification' not to be 'Review your notification'
```

`copy/copy.cy.js:3` still carries the English string.

**House precedent for the wording exists — use it, do not invent from scratch.** The plant hub Welsh
bundle uses **`Adolygu`** for Review and **`hysbysiad`** for notification
(`features/hub/copy/copy.cy.js:25` *'12. Adolygu a chyflwyno'*, `:69-70`). Live-animals'
check-answers Welsh title is *'Gwiriwch eich atebion'* for *'Check your answers'* — **not the right
translation here**, because this page's English title is *'Review your notification'*, which the page
spec fixes.

The **MACHINE-DRAFT banner is already present at line 1 of your `copy.cy.js` and must stay.**

**Run `copy-parity` and fix EVERY leaf it reports, not just `title`.** The assertion may report only
the first failure per run — re-run until it is clean, and **state how many leaves you ended up
translating**. An untranslated leaf that happens to be allowlisted is not the same as a translated
one; do not reach for the allowlist to silence this.

## 3. Ladder — run it fully and report every number

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

Current state, measured by me on your staged work:

| Leg | HEAD baseline | Your staged work | Required |
|---|---|---|---|
| plant unit | 628 | **651 passed** | ≥651, green |
| `npm test` | 2,256 / 8 skipped | **1 failed / 2,281 passed** | green |
| `test:live-animals` | **559** | 559 | **559 — a change is a REGRESSION** |
| plant Playwright | 241 | **242 passed / 1 failed** | green |
| `lint:arch` | **0 / 0** | 0 / 0 | **0 / 0** |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
`git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`.

Keep using the pp-076 shared axe helper with no `permittedConditionalRadio`. **Do not add an axe
carve-out to this page.**

Run `npm run format`. **Stage everything but do NOT commit** — leave it staged and report.
