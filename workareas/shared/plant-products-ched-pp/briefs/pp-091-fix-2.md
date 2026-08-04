# pp-091 second fix brief — one review finding, verified by the orchestrator

**⚠ RUN `git status` FIRST. The pp-091 work is STAGED and must be PRESERVED** — one file,
`check-answers/review-notification.e2e.spec.js`, carrying the test *'full journey profile keeps a
middle entry and distinct identifiers in every collection'*, which already pins ≥3 entries, distinct
identifiers, and boolean variation on three fields.

**DO NOT start over or re-implement pp-091. You are adding ONE more assertion to that same test.**
**Test-only. No production code, no fixture change.** Do not commit.

## The finding — a categorical field can be collapsed while the pin still passes

`fullJourneyValues.documents` ships three **distinct types** (Air waybill, Phytosanitary certificate,
Commercial invoice). The pin guards the **references** (`DOC-1/2/3`) but not the **types**.

**Verified by me, not just relayed.** Setting DOC-2's type to `AIR_WAYBILL` — changing **both**
`type.value` and `type.text` so the entry stays internally consistent — leaves the review spec
**5 passed**. The reviewer independently confirmed observable behaviour changed with a DOM canary that
failed, so the mutation is **not inert**.

**⚠ A detail that sharpens the defect, and you should preserve it in how you think about the fix:**
when I first changed only `type.value` and left `type.text` alone, a test **DID** fail — because input
and expectation diverged. **The profile is only unguarded when the edit is internally consistent**,
which is exactly what a real refactor or a careless "simplification" looks like. A half-edit is caught;
a tidy one is not.

## What to do

Add to the **existing** test: assert `fullJourneyValues.documents` carries **at least three distinct
`type.value`s**.

**Frame it as a minimum, not as today's contents** — consistent with the `≥3 entries` rule. Adding a
fourth document that repeats an existing type must **not** fail; collapsing to fewer than three
distinct types must.

**Prove it:** set two documents to the same type (changing `value` **and** `text` together) and show
the new assertion fails **by name**. Report the name and message.

## ⚠ ALSO CHECK TWO MORE FIELDS — evidence first, do not guess

Two other line-level fields genuinely vary in the full profile:

- `commodities.lines[].finishedOrPropagated` — populated on line 1, empty on lines 2 and 3
- `commodities.lines[].intendedForFinalUsers` — `true` on line 1, `null` on lines 2 and 3

**Flatten each in turn (consistently) and see whether anything fails.** If flattening is **undetected**,
add a variation assertion for it in the same loop. If something already catches it, **leave it alone and
say what caught it.** Do not add an assertion for a property that is already guarded elsewhere — that is
how a redundant assertion quietly makes a real one look unnecessary (pp-084's lesson).

## ⚠ DO NOT PIN `packageType` OR `quantityType`, AND DO NOT WIDEN THE FIXTURE

I checked: both are **already uniform** across all three full-profile lines — `BOX/BOX/BOX` and
`PIECES/PIECES/PIECES`. A "must vary" assertion on either would fail immediately.

**Do NOT change the fixture to make them vary.** That would be inventing journey data on an object that
drives real page interactions, to satisfy a test. The full journey is not the place to sweep an
enumeration — the per-page specs cover those dropdowns.

Same standing exclusion for `controlledAtmosphereContainer` (`false` on all three lines), already
documented in the test. **Leave that note intact.**

**If you think the uniform `packageType`/`quantityType` coverage deserves its own increment, say so in
your report — do not raise it yourself and do not widen the fixture.**

## Keep everything already there

The ≥3 pin, the distinctness pin, the three boolean-variation assertions, the *why three* comment
citing pp-026, the `controlledAtmosphereContainer` exclusion note, and **every existing derived
read-back assertion**. If you find yourself deleting or loosening one, **stop** — that is the pp-080
shape.

## Restore discipline

**`journey.e2e-helper.js` is NOT part of the staged change and must end byte-identical to HEAD.**
`git status` must show **only** `review-notification.e2e.spec.js` modified when you finish, with **no
`.bak` file** left behind — I have already had to delete one this session.

**Say what changed before believing any result.** On this build an inert mutation falsely *confirmed* a
finding on pp-078, and my own malformed mutation falsely *refuted* this one an hour ago. Both
directions are live.

## Baselines — I ran these myself

plant Playwright **259** — adding assertions to an existing test must not change it; plant unit **728**;
npm test **2,366** / 8 skipped (217 files); `test:live-animals` **559** — a change is a REGRESSION;
`lint:arch` **0/0**, **671** modules, **2,127** dependencies; shasum
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

Any test count that moves must be explained:
`git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.

Run `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
