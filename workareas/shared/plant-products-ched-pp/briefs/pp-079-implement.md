# pp-079 — review-page correctness: change-return context, unanswered same-as-consignee, missing input-method row

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong sixteen times, three destructively.

All five listed paths are `edit` and **all five exist** — I `ls`'d them. No `create` claims to check.

These are three defects found by the **first code review ever run on this branch** (the pp-038 sweep).
I verified all three against the source myself before writing this. But **§1 below is a fourth thing
the review did not see, and it changes the shape of the increment**: fixing finding 1 as written would
replace a wrong-destination bug with a **404**.

---

## 1. ⚠⚠ READ THIS FIRST — `?change=1` ALONE SHIPS A 404. THE TWO DEFECTS ARE MASKING EACH OTHER

`shared/kit.js:47` is:

```js
export const CYA_SLUG = 'notification-view'
```

and `kit.js:69-73`:

```js
export const exitTarget = (request, fallback) =>
  hubExitTarget(request) ??
  (changeContext(request) ? pagePath(request.params.journeyId, CYA_SLUG) : fallback)
```

**`notification-view` is the LIVE-ANIMALS check-answers slug**
(`sets/live-animals/.../check-answers/page.js:3`). **The plant-products slug is `review-notification`**
(`sets/plant-products/.../check-answers/page.js:2-3`, and it is trace-derived — `review-notification.json`
in the CHED-PP page captures, `recon/chedpp-requirements.md:68`). I grepped the whole plant set: the
string `notification-view` **appears nowhere under `sets/plant-products/`**, so no plant route serves it.

`pagePath` prefixes with `setBase()`, which is set-aware. So the moment a plant page is loaded with
`?change=1` and saved, `exitTarget` redirects to
**`/plant-products/notifications/<id>/notification-view` — a plant-products URL for a page that does not
exist in the plant set.**

**That is why nobody has seen this: the two defects mask each other.** No plant Change link emits
`?change=1` today, so the CYA branch of `exitTarget` is unreachable in the plant set and has never
executed. **Fix finding 1 in isolation and you unmask it — every Change-then-save lands on a 404,
which is worse than the current forward-walk, and pp-079's headline acceptance criterion
("editing a value and SAVING returns the user to the review page") becomes unachievable.**

### The change is sanctioned, and its shape is constrained

Yes, this means touching production code outside `sets/plant-products/`. **I am ruling it in scope** —
the increment cannot meet its own acceptance criteria without it. It is NOT a licence to change
live-animals behaviour: see the bar in §1.2.

**1.1 — Preferred shape (the house pattern).** `flow/journey-flow.js` already holds the per-set config
bag via `setKeyed('journey flow')`, and `routes-plant-products.js:64-72` already calls
`configureJourneyFlow(SET_ID, {...})`. Add the slug there:

- `flow/journey-flow.js` — add `cyaSlug: undefined` to `defaults` and
  `export const journeyCyaSlug = () => store.current().cyaSlug`.
- `shared/kit.js` — **leave `export const CYA_SLUG = 'notification-view'` exactly as it is** (four
  live-animals files import it: `cancel-amend/controller.js:18`, `dashboard/view-model/row/actions.js:33`,
  `declaration/controller.js:39,85`, `dashboard/controller.test.js`). Change only `exitTarget`, to
  `pagePath(request.params.journeyId, journeyCyaSlug() ?? CYA_SLUG)`.
- `routes-plant-products.js` — pass `cyaSlug: 'review-notification'` in the `configureJourneyFlow` bag.
  Source it from the check-answers `page.js` rather than retyping the literal if you can do so without
  an import cycle.

**Direction of the dependency matters:** `kit.js` already imports `flow/journey-flow.js` (line 9), so
this adds no new edge. **Do NOT** make `journey-flow.js` import `kit.js` — that is a cycle and
`lint:arch` must stay 0/0.

**1.2 — The bar this must clear.** Live-animals never configures `cyaSlug`, so it falls through to
`CYA_SLUG` and its behaviour is **byte-identical by construction**. `test:live-animals` must stay at
**exactly 559**, and `npm test` must stay green including `co-residency.test.js`,
`no-set-singletons.test.js` and `seam-keying.test.js` — **read `no-set-singletons.test.js` before you
touch `journey-flow.js`**, it scans files containing `setKeyed(` and has opinions about module-level
state. Co-residency is a **two-sided** bar: both sets serving correctly from one process.

**1.3 — If you think this is wrong, say so and stop.** A better seam may exist. **Four of my briefs
have been wrong and every time the implementor was right** (pp-023's manifest boundary, pp-031's axe
carve-out, pp-077's variety gate, pp-040's omitted `task-rows.test.js`). Return `ok:false` with the
evidence rather than forcing my shape. What is **not** negotiable is the finding itself: `?change=1`
without a set-aware CYA slug is a 404, and shipping that is a failed increment.

## 2. Finding 1 proper — `?change=1` on every generated href

`view-model/rows/change-link.js` has `changeHref` and `changeAction` with **zero** occurrences of
`change=1` in the whole plant check-answers directory. live-animals' equivalent
(`sets/live-animals/.../rows/change-link.js:12`) has `withChange(href)` and applies it inside
`changeHref`, so **every** consumer inherits it.

Do the same: apply it in `changeHref`, not at the call sites. Two things then get fixed for free and
both must be covered by a test:

- `rows/summary-row.js:21` — the **missing-answer** link for a blank value. AC says it too.
- `cards/commodities.js:26` — `changeCell`, the per-commodity-line Change link inside the table.

Check for any consumer of `change-link.js` that must NOT carry the query — I found none, but I looked
by grep, not by reading every card.

## 3. Finding 2 — an unanswered mandatory obligation renders a definite "No"

`cards/traders.js:86`:

```js
const sameAsImporter = answers.destinationSameAsConsignee === true
```

then line 93 passes that boolean to `yesNoText`. An **unanswered** obligation is `undefined` →
`false` → the row states **"No"**, so `summary-row.js:20`'s `isBlank` branch never fires and the user
is never told they have not answered it. The page asserts an answer the user did not give.

Pass the **raw** answer to `yesNoText` so blank stays blank and `row()` emits its missing-answer link.
Keep the strict `=== true` only for choosing the address branch at line 98 — an unanswered value must
still fall to `rowsForFields('destination', ...)`, not to the read-only "same as" copy.

**Explicit `false` must still render "No".** Pin both: undefined → missing-answer link, false → "No".
Those are different states and a fix that collapses them is a new defect.

## 4. Finding 3 — `commodityInputMethod` is captured, persisted, and never read back

It is persisted by pp-022 as `commodity.inputMethod` and listed in pp-038's `schemaFields`, but no card
renders it. Inside the check-answers directory it appears **only** in `check-answers.test.js`'s fixture
— which is the pp-038 failure class exactly: **a hand-authored fixture standing in for what the system
produces.** Add a labelled row on the commodities card with a dispatch-resolved Change action, covering
both `MANUAL` and `CSV`.

⚠ **Do not invent the label or its Welsh.** Take the English from the trace/legacy source or the
existing copy bundles if it is already there; if you cannot find a source, **stop and report** rather
than making one up. Eight increments have stopped rather than fabricate and every one was right —
**stopping twice carries no penalty; inventing one row does.** Carry the `// MACHINE-DRAFT Welsh`
banner on any new leaf and say in your report that the Welsh is unreviewed.

## 5. The e2e must SAVE. `goBack()` is what let this ship

`review-notification.e2e.spec.js`'s existing Change test proves navigation with browser `goBack()`,
which returns to review **whatever the app does** — it cannot detect a missing `?change=1` and it cannot
detect the 404 in §1. **My own acceptance criterion invited the miss.**

Replace it with a real round trip: land on review → click a Change link → change a value → **submit the
form** → assert the resulting URL is the **review page** (`/plant-products/notifications/<id>/review-notification`)
and that the **changed value is rendered back on it**. Assert the resolved URL, not that a link exists.

Use the **pp-076 shared axe helper** (`features/axe.e2e-helper.js`) if you touch axe at all. Pass
`permittedConditionalRadio` **only** if the page you edit actually renders a conditional radio — the
review page does not.

## 6. The mutations I expect you to run

**Two, and report each by the name of the test that fails.**

1. Remove `?change=1` from `withChange` (or whatever you call it) → a named test fails.
2. **The one that actually proves §1**: set the configured plant `cyaSlug` to `'notification-view'` →
   the save-and-return e2e must fail. If it still passes, your e2e is asserting the query string
   rather than the destination and §1 is unpinned.

⚠ **A GREEN MUTATION RUN IS ONLY EVIDENCE IF THE MUTATION ACTUALLY CHANGES BEHAVIOUR.** Wrong three
times in this build — pp-025, pp-036, and pp-040 where the English fallback string was **identical** to
the macro default so no English assertion could discriminate. Ask what the code now does differently
before you believe a green run. Restore byte-identically and confirm `git diff --stat` is empty against
the index.

## 7. Baselines — verified by ME at HEAD (`30d43e7b`), not quoted forward

| Leg | Baseline |
|---|---|
| plant unit `test:plant-products` | **673** (57 files) |
| `npm test` | **2,311 passed / 8 skipped** (214 passed + 2 skipped = 216 files) |
| `test:live-animals` | **559** (65 files) — a change is a REGRESSION |
| `lint:arch` | **0 errors / 0 warnings**, 671 modules, 2,125 dependencies, 3 known violations ignored |
| plant Playwright | **255** (baseline re-running as you start; treat 255 as the number to explain against) |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a` — I checked it and it matches.

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
on macOS Mach-port permissions; the permitted rerun passes. If a run fails with
`net::ERR_NETWORK_IO_SUSPENDED` across unrelated specs that is the machine, not your code — report it
and re-run.

## 8. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`. **Any test count that moves must
  be explained, especially downward** — pp-017 silently deleted three browser specs and the only tell
  was Playwright 13 → 11.
- **⚠ DO NOT MOCK A FUNCTION AND ASSERT THE MOCK'S OWN RETURN VALUE.** pp-038 shipped three defects
  green from that one cause. **Ask what every fixture is a copy of.**
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation (pp-017, pp-024). If a control's
  accessible name matters, assert the computed name directly, and assert repeated names are **distinct**.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- `to-dto.js` / `from-dto.js` are not in scope here. If you find yourself editing either, stop.
- Run `npm run format`. **Do not commit** — leave the work staged and report.
