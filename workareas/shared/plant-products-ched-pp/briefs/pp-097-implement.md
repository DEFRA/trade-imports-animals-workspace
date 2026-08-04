# pp-097 — check-answers has no `readOnly` mode

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-frontend**, branch
`spike/trace-to-requirements`, clean at `ec44dfde`. Rollback is `git stash push -u` — never
`reset --hard`/`clean -fd`. **Stage, do not commit. Never run `sonar`.**

**Baselines I ran myself just now — re-establish them and report yours:**

- `npm test` → **2,369 passed / 8 skipped**, 217 files
- `test:plant-products` → **731**, 58 files
- `test:live-animals` → **559**, 65 files (**a change here is a REGRESSION**)
- `PORT=3201 test:features:plant-products` → 259 expected; my baseline run is in flight, I will tell you
  the number if it differs
- `lint:arch` → 0/0

## What this increment is

live-animals has **no separate notification-view feature**. Its read-only view **is** check-answers in a
`readOnly` mode gated on `journey.status === SUBMITTED`. Plant's transposition dropped the mode
entirely — `sets/plant-products/.../check-answers/controller.js` contains **zero** occurrences of
`readOnly`, so a SUBMITTED plant notification renders the fully editable page. Build the mode.

## ⚠ THREE THINGS THE INCREMENT JSON GETS WRONG — I CHECKED THEM, YOU DO NOT NEED TO RE-LITIGATE

1. **`filesToTouch` names `check-answers/e2e/review-notification.e2e.spec.js`. There is no `e2e/`
   directory.** The file is `check-answers/review-notification.e2e.spec.js` (568 lines).
2. **`filesToTouch` omits `check-answers/controller.test.js`** (82 lines), and that is the file where the
   `readOnly` **derivation** has to be pinned — it is the only plant CYA test that drives the handler
   (`driveHandler` + the records stub). `check-answers.test.js` calls `buildSections` **directly** and
   never sees a journey status, so a test written there can only prove *suppression given readOnly*, not
   *derivation*. **You need both files.**
3. **⚠ ACCEPTANCE CRITERION 3 IS OUT OF SCOPE AND I AM RULING IT OUT, WITH EVIDENCE.** It demands the
   copy-idempotency key be exposed in readOnly "as live-animals does". live-animals can do that because
   it has a `copy` route: `features/notification-actions/`, `features/delete-notification/` and
   `features/cancel-amend/` all exist there. **`ls sets/plant-products/journeys/linear/features/` has
   none of the three.** `pagePath(journeyId, 'copy')` in plant today resolves to a route that does not
   exist, so emitting `copyAction` would ship a form posting into a 404 — the exact "surface invented
   ahead of its consumer" class this build keeps refusing. **pp-045 builds the copy route and the button
   together; it takes the key with it.** Do **not** add `copyAction`, `deleteHref` or `cancelAmendHref`
   here. If you disagree, `ok:false` with the evidence and I will re-rule.

## ⚠⚠ HAZARD 1 — PLANT HAS **FOUR** EDIT-AFFORDANCE FAMILIES. THE PLAN MENTIONS ONE.

Plant's check-answers is **not** shaped like live-animals'. live-animals has sections → groups → cards
and one row helper; plant has **nine flat cards** (`view-model/index.js:11-21`) with tables. "Suppress
the Change links" is therefore four distinct edits, and **a partial suppression is worse than none** —
the page would claim to be read-only and not be. All four, with the evidence:

- **A — row-level actions.** `view-model/rows/summary-row.js:35` attaches `actions: changeAction(...)`
  to every answered in-scope row. **~28 `row({...})` call sites across the nine cards** (`about-consignment`
  4, `additional-details` 3, `commodities` 2, `contact` 3, `goods-movement` 3, `traders` 2, `transport`
  11).
- **B — ⚠ THE MISSING-ANSWER LINK, WHICH IS INSIDE THE VALUE CELL.** `summary-row.js:22-33`: when an
  in-scope obligation is blank, the **value** renders as
  `<a class="govuk-link" href="…?change=1">Add a missing answer…</a>`. It carries **no `actions` key at
  all**, so any suppression that only strips `actions` leaves this link live and a test that only counts
  `actions` will not see it. This is the single most likely way to ship a half-read-only page.
- **C — card-level action links.** `cards/documents.js:33-37` and `cards/nominated-contacts.js:37-41`
  each emit `action: { href: changeHref(...), text: 'Change' }`, rendered by `template.njk`'s
  `{% if section.action %}` block.
- **D — the commodity table's "Action" COLUMN.** `cards/commodities.js:28-34` builds `changeCell()` — a
  raw `<a>` in `value.html` — and `:43` adds the `Action` **header**. In readOnly, drop the cell **and**
  the header; a suppressed cell under a surviving header is a defect, not a fix.

## ⚠ HAZARD 2 — THE BOTTOM OF THE PAGE IS AN EDIT AFFORDANCE TOO, AND HERE PLANT DELIBERATELY DIVERGES

`template.njk`'s last block renders `saveActions(hubHref, { text: copy.continue }, …)` inside a POST
form. That **Continue** button is the only route into the declaration page
(`journey.e2e-helper.js:739-755` drives exactly that), so on a SUBMITTED notification it offers to
re-submit something already submitted. **Suppress the whole form when `readOnly`.**

⚠ **This diverges from live-animals and I am ruling the divergence in deliberately.** `grep -rn readOnly
… --include=*.njk` across the entire application returns **nothing**: `readOnly` reaches no template in
either set. live-animals' own `check-answers/template.njk` renders its `copy.submit` heading, form and
button **unconditionally**, so a SUBMITTED live-animals notification appears to still offer submission.
**Verify that claim yourself before relying on it** — read the template, and if you can, render it — and
**report what you find**, because if it is true it is a live-animals defect I will record for Sam. Either
way plant suppresses its form: acceptance criterion 1 says "no other edit affordance" and I am holding
it to that.

## The exemplar mechanism — copy the shape, not the file

live-animals `view-model/rows/change-link.js` ends with:

```js
export const editableActions = (readOnly, actions) => (readOnly ? {} : { actions })
```

and `summary-row.js` spreads it. **Mirror that helper in plant's `rows/change-link.js`** and use it at
family A. Families B, C and D have no live-animals equivalent — they are plant's own shapes — so handle
each explicitly and keep the choke point as narrow as you can.

**Threading:** `buildSections(answers, scope, evaluation, journeyId, readOnly = false)` mirroring
live-animals `view-model/index.js:6-12`, then a defaulted `readOnly = false` parameter down through the
nine cards. **The default matters** — `check-answers.test.js:158-166` calls `buildSections` with four
arguments and must stay green untouched.

**Blank rows in readOnly:** family B cannot just vanish, or the row loses its value. Render the label
with **"Not provided"**. ⚠ **Do not invent the Welsh.** Plant already ships this string:
`features/transport/copy/copy.en.js:54` `notProvided: 'Not provided'` and
`features/transport/copy/copy.cy.js:50` `notProvided: 'Heb ei ddarparu'`. Add the same pair to
`check-answers/copy/copy.en.js` and `copy.cy.js`. This also matches live-animals, whose CYA copy has
`notProvided: 'Not provided'` at `copy/copy.en.js:3`.

## Where each test goes

- **`controller.test.js`** — derivation. Drive the GET handler for a DRAFT journey and for a SUBMITTED
  one and assert `result.view.context.readOnly` is `false` / `true`. Look at how
  `sets/live-animals/.../check-answers/check-answers.test.js:32-44` reaches SUBMITTED (`store.submit`)
  and at plant's own `records` stub (`services/records/stub.js`) — use whichever plant already supports.
  **Do not add a query param, a session flag or a new field to force the state.**
- **`check-answers.test.js`** — suppression, **both directions, by identity and count**. Collect every
  affordance across all nine cards — row `actions` hrefs (A), `value.html` containing `href=` (B), card
  `action.href` (C), and the commodity table's action header and cells (D) — and assert the readOnly
  collection is **exactly `[]`** while the editable collection is **non-empty and contains named
  hrefs you spell out**. ⚠ **A test that asserts "fewer links" or "some links absent" does not
  discriminate** and this build has been bitten three times by a query that matched the wrong thing.
- **`review-notification.e2e.spec.js`** — browser proof. `completeJourney` + `submitDeclaration` from
  `features/journey.e2e-helper.js:727-755` reach SUBMITTED through the UI; then `page.goto` the
  review URL. Prefer that to seeding, and **say which you did**.
  ⚠ **The e2e must also assert the page still RENDERS THE ANSWERS.** "No Change links" passes trivially
  on a blank page, an error page, or a redirect — that is the `resultsLabel`-matching-`0 results` class
  from this build's own history. Pin at least one real answered value visible alongside the absence.

## The decisive mutations, by failing test NAME

Run these yourself, report each verdict, and **report an INERT or falsely-CONFIRMING result honestly**
(this build has hit five distinct ways a mutation lies):

1. **Invert the derivation** — `journey.status === SUBMITTED` → `!== SUBMITTED` in `controller.js`. The
   `controller.test.js` derivation test must fail **by name**, and so must the e2e.
2. **Suppress family A only** — leave B, C and D live. The suppression test must **still fail**. If it
   passes, your collector is not seeing families B–D and the test is decorative. **This is the mutation
   I most expect to be informative.**
3. **Restore the commodity "Action" header without its cells.** Report whether anything fails. If
   nothing does, say so — a ragged table is a real defect that no test guards.

## Constraints

- **Production code outside `sets/plant-products/` is off limits.** A forced change there is `ok:false`
  with evidence. **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so in your
  report**; it does not prove you left the shared engine alone.
- Stay inside the **govuk-frontend toolbox** — no custom CSS, no hand-rolled components.
- **L1 shape assertions are in scope to UPDATE, never to WEAKEN.**
- `npm run format` before you finish. `lint`, `lint:arch` green, and
  `shasum .dependency-cruiser-known-violations.json` **unchanged** at
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- **Any test count that moves must be explained**, especially downward.
- Playwright: **`PORT=3201`**. Docker holds 3000, 3001 and 3100.

## Finally

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** My briefs were wrong twelve times last session and
**every single time the implementor or the reviewer was right** — twice they found acceptance criteria
asserting behaviour the application has never had. If something here contradicts the source, **stop and
report it rather than making the source match my brief.** Never invent data. Never weaken an assertion
to get green.
