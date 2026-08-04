# pp-026 FIX — the removal tests cannot tell which row was removed

Your pp-026 work is staged and otherwise good. **Do not start over, do not revert, do not re-run the
whole increment.** `git status` first: the tree is staged and matches the index. This is one focused
addition.

## The finding, proved by mutation

I replaced the removal target in
`commodity-summary/remove/post-remove.js` with a hardcoded index:

```js
await state.removeEntryAt(
  request, h,
  ['commodityLines', lineIndex, 'species'],
  0                       // was: speciesIndex
)
```

That is a production bug that **always removes the FIRST species of the line regardless of which
Remove button was pressed** — exactly the positional-renumbering hazard the brief named.

**Result: plant units 360/360 PASSED. Playwright 108 of 109 passed.** The single failure was
`has no serious or critical axe violations in multi-row and single-row states`, which only broke
because its setup state was disturbed — an incidental catch, not an assertion about which row went.

**Nothing in the suite detects a removal that targets the wrong row.**

## Why the existing test does not catch it

`commodity-summary.e2e.spec.js:206`, *'pins distinct names, removes one species, persists it and
exposes renumbered indices'*, is a good test that happens to be blind here. It seeds two species and
then clicks:

```js
await buttons.nth(0).click()   // removes index 0
```

**It only ever removes index 0.** A bug that always removes index 0 cannot fail it. The renumbering
half that follows re-adds a species and re-checks names — that exercises renumbering after an
*append*, not removal at a non-zero index.

Your report listed "post-removal-index" coverage, and the test name says "exposes renumbered indices",
so this reads as covered when it is not. That gap between the name and the discrimination is the whole
problem.

## What to add

**Remove at a NON-ZERO index and assert the surviving rows are the right ones, in the right order.**
Concretely, with three species seeded on one line (A, B, C):

- Click the Remove control for **B** (index 1).
- Assert **A and C survive, in that order** — not merely that the count fell to 2. Assert by the rows'
  content and by the surviving Remove controls' accessible names, which encode the species position
  (`... species 1 ...`, `... species 2 ...`), so the renumbering is pinned too.
- Assert **C's control has renumbered to species 2**, proving indices were rebuilt rather than left
  stale.
- Reload and re-assert, so persistence is proved rather than the rendered view alone.

Three species is required: with only two, removing either index leaves one row and several wrong
implementations still look right.

**Then prove your own test bites.** Re-apply the hardcoded-`0` mutation above, confirm your new test
fails, restore `post-remove.js` byte-identically, and confirm `git diff` is clean against the index.
**Report the exact failure message your new test produces under the mutation.** A test added for this
that does not go red under it is worth nothing.

A unit-level equivalent in `commodity-summary.controller.test.js` is welcome as well as, not instead
of, the browser case — but the browser case is the one that proves the rendered control maps to the
right entry.

## Fixture constraint — do not invent data

pp-025 established that only `CIDAC` carries both varieties and classes, and I verified that against
`services/commodities/fixture.js` myself. If three species on one commodity line is not achievable
with the shipped fixture, **say so and state exactly what you used instead** — do not fabricate a
species, EPPO code or association to make the scenario work. Two species with removal at index 1
(leaving index 0) still discriminates the bug and is an acceptable fallback; say which you used and
why.

## Rules for this pass

- **Add tests only.** Do not change production code — `post-remove.js` is correct as staged; the
  mutation was mine and is reverted.
- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** If you strengthen the existing `:206` test in
  place rather than adding a new one, that is fine, but report it as a rename with its replacement and
  keep every existing assertion.
- Re-run the ladder and report the new counts against these, which I verified myself at the staged
  state: plant unit **360**, `npm test` **1,962 passed / 8 skipped**, live-animals **559**, plant
  Playwright **109**, `lint:arch` **0 errors / 4 warnings**.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
