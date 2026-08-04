# pp-039 — FIX pass

**`git status` FIRST. Your work is STAGED. Do NOT start over, do NOT unstage, do NOT revert anything.**

The increment is good. Both adapters were correctly extended rather than recreated, the not-ready
mutation was run properly and reported with what it observed, `to-dto.js` was correctly left alone
with explicit bidirectional omission tests added, and the unbuilt `/confirmation` 404 was reported
honestly rather than papered over. **One blocker and two secondary items.**

---

## 1. ⚠ BLOCKER — THE DOCUMENT PUT OMITS `referenceNumber` AND THE REAL BACKEND WILL REJECT IT

`real.js` `finalise` now does:

```js
const body = toDto(fromDto(await loadResponse.json()))
body.declaration = { agreed: true, declaredAt: new Date().toISOString() }
// PUT ${notificationsUrl}/${journeyId}
```

**`replaceFulfilment` PUTs the same endpoint with the same method, and it does not do that.** At
`real.js:156-160` it builds:

```js
const body = {
  ...toDto(answers),
  // The shipped Java replace endpoint rejects an absent body reference.
  referenceNumber: journeyId
}
```

**That comment is not decoration — it records a fact learned from the real backend** (pp-008, where
"the shipped Java contract differed from the plan and reality won", twice).

**I verified the consequence rather than assuming it: neither `to-dto.js` nor `from-dto.js` mentions
`referenceNumber` at all.** So `toDto(fromDto(loadedDocument))` **cannot** contain it, and your PUT
body has no reference. **Submission will fail against the real backend.**

**And nothing you have would catch it**, which is the part that matters: the unit tests mock `fetch`,
and the stub's `finalise` performs no PUT at all — it mutates `record.declaration` directly. So stub
and real "parity" is green while only one of them would survive contact with the backend. **This is
the pp-063 class exactly** — everything before pp-063 tested against the frontend's own stubs, and the
first increment to test against the real backend found a design decision that had never been
implemented.

**Fix:** construct the finalise body the same way `replaceFulfilment` does, including
`referenceNumber`. **Then pin it** — assert the PUT body carries `referenceNumber` equal to the
journey id, so a future refactor that drops it fails by name rather than in production. Consider
whether both call sites should share one body-builder rather than two constructions that must stay in
step; if you extract one, say so and show it is a net addition.

**⚠ WHAT I CHECKED BEFORE CALLING THIS A DEFECT, so you do not chase it:** `toDto` is
`SECTION_MAPPERS.reduce((dto, mapSection) => ({ ...dto, ...mapSection(answers) }), {})` — a **fresh
object**, never a spread of the source — so the round trip drops every unmodelled backend field. That
sounds alarming but **it is pre-existing and by design**: `replaceFulfilment` already replaces the
whole document with the frontend's projection on every save. **So projection-only persistence is not
your defect and is not in scope.** The missing `referenceNumber` is.

## 2. The journey helper is duplicated, and its home is questionable

You added **`e2e/plant-products-journey.js`, 280 new lines at the repo root**, imported by
`declaration.e2e.spec.js` through **nine** levels of `../`. Meanwhile pp-038's
`review-notification.e2e.spec.js` changed by only +5/−1, so it **still carries its own ~100-line
`completeJourney`**. Two journey drivers for one journey now exist.

`lint:arch` is 0/0 so nothing architectural forbids it, and this is test infrastructure rather than
production code — **so this is a judgement call, not a rule.** Make it deliberately and report it:
either consolidate the two so there is one driver, or state why the review spec's own helper should
stay. **What is not acceptable is leaving it undecided**, because the next page increment will face
the same choice and copy whichever it finds first.

If you do consolidate, the pp-038 lesson applies: **the review spec's assertions must not weaken** to
fit a shared helper. Report any assertion that changes.

## 3. `finalise(journeyId, _actor)` — an unused parameter in both adapters

Both signatures gained `_actor` and neither uses it. Either **drop it**, or **say which increment
needs it** and why it is being introduced now. An unused parameter that outlives its explanation is
how a signature acquires cargo.

## 4. Ladder

Re-run in full after the fix. Numbers you reported, which I will re-verify:

| Leg | HEAD baseline | Your staged work |
|---|---|---|
| plant unit | 653 | **668** |
| `npm test` | 2,284 / 8 skipped | **2,303 / 8 skipped** |
| `test:live-animals` | **559** | 559 — **a change is a REGRESSION** |
| plant Playwright | 243 | **250** |
| `lint:arch` | **0 / 0** (660 modules) | 0 / 0 (666 modules) |

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** Run `git diff --staged -U0` and
`grep -cE "^- *(it|test|describe)\("` — you reported 24 added and 0 removed; keep it that way.

Keep the pp-076 shared axe helper with no `permittedConditionalRadio`. **Do not add a carve-out.**

Run `npm run format`. **Stage everything but do NOT commit** — leave it staged and report.
