# pp-091 review brief — pinning the full journey profile's own shape

This brief OVERRIDES the generic `review.md`. **Small, test-only.** One staged file:
`sets/plant-products/journeys/linear/features/check-answers/review-notification.e2e.spec.js`.
Work is **staged, not committed**.

## What the increment did, and why

`tableExpectations()` derives every collection expectation by mapping over `fullJourneyValues` — **the
same object the journey driver fills the pages from**. Input and expectation move together, so
**thinning the profile is invisible**: my pp-085 mutation removed the middle nominated contact and the
whole review spec stayed green, including a test named *'pins collection order'*.

The coupling is **pre-existing**, not introduced by pp-085 — HEAD already derived identically. But
pp-085 centralised the profile, so one edit now reduces coverage for **three** specs at once, and
pp-086 edited this object one commit later.

The new test pins the profile's own shape: **≥3 entries** and **distinct identifiers** per collection,
plus **boolean variation** on the fields that alternate.

## ⚠ WHAT I HAVE ALREADY VERIFIED — do not re-tread it

- **The pin's completeness.** `tableExpectations()` derives from exactly three collections — commodity
  lines, `nominatedContacts`, `documents` — and **all three are covered**. `containers` is also pinned;
  it is not derived there but feeds the transport page, so it guards driver richness. **I checked there
  is no fourth derived collection missed.**
- **The identifiers are real discriminators**: `contact1/2/3@example.com`, `DOC-1/2/3`, `CONT-1/2/3`,
  distinct commodity codes. Distinct codes matter beyond the pin — `tableExpectations()` calls
  `lines.indexOf(line)` for the varieties table, so duplicates would silently mis-index it.
- **The boolean-variation half is MY finding, proven by mutation**: flattening all three contacts to
  `agent: false` left the review spec **5 passed, nothing failed**. The three fields that genuinely
  alternate are `containers[].officialSeal`, `nominatedContacts[].agent`,
  `commodities.lines[].testAndTrial`.
- **`controlledAtmosphereContainer` is deliberately excluded** — it is `false` on all three full-profile
  lines. I ruled that the fixture must **not** be widened to make it vary, because that would be
  inventing journey data on an object that drives real page interactions. The exclusion is documented in
  the test.
- The implementor proved all six original mutations by name (middle removal × 4 collections, a
  first-entry removal, a duplicate that keeps length 3), and all three boolean flattenings by name.
  `journey.e2e-helper.js` was restored byte-identically.

## ⚠ THE AXES I WANT FROM YOU

1. **Is the pin defeatable while still passing?** Find a way to reduce the profile's coverage that this
   test does **not** catch. That is the whole point of the increment, and I have only probed two axes
   (cardinality, boolean flatness). Consider: replacing an entry's *identifying* value while keeping
   distinctness; collapsing a non-boolean discriminating field (`packageType`, `quantityType`,
   `document.type`) to the same value across entries; a collection that exists in the profile but is
   consumed by declaration or confirmation rather than review.

2. **Does it over-constrain?** Acceptance criterion 4 requires that **adding** a fourth entry, or
   reordering, must NOT fail. Verify both by actually doing them, not by reading.

3. **Were any existing derived read-back assertions weakened or removed?** Criterion 3 says they are
   kept, not replaced. This is the pp-080 shape — a rewrite strengthening one axis while silently
   weakening another. `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.

4. **The other two specs.** `declaration` and `confirmation` consume the same shared profile through the
   `minimal`/`full` profiles. Does the pin protect them, or only the review spec? If a thinning would
   still silently shrink *their* coverage, say so — it may be a separate increment rather than a defect
   here.

5. **Assertion-message quality.** `expect(a && b, msg).toBe(true)` reports which field failed but not
   which value is missing. Is that good enough for a future reader, or worth sharpening? Low stakes —
   judgement, not a defect.

## Things you do NOT need to raise

- **Welsh** — machine-draft, covered. One mention at most.
- **`controlledAtmosphereContainer`'s unexercised `true` branch** — already ruled and documented. If you
  think it deserves its own increment, say so in the summary; **do not propose widening the fixture.**
- **Production code** — none was touched and none should be. A forced production change is a finding
  with evidence, not an edit.

## Baselines — I ran these myself at `ba4e6c57`

plant Playwright **259** (pp-091 added one; adding assertions to the existing test must not change it);
plant unit **728**; npm test **2,366** / 8 skipped (217 files); `test:live-animals` **559** — a change
is a REGRESSION; `lint:arch` **0/0**, **671** modules, **2,127** dependencies; shasum
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

## Report

Findings as JSON per the schema. For each: file and line, what is wrong, **how you verified it — a
mutation you ran, not an inference** — and severity. **Restore anything you mutate; the staged diff
must be unchanged when you finish.** Review only; do not fix.

**Zero findings is an acceptable and useful answer.** ⚠ **On this build the last two reviews produced
one clean result and one FALSE POSITIVE that I confirmed with an inert mutation before an implementor
correctly refused it.** So if you claim a gap, **prove your mutation actually changed observable
behaviour**, and state what else might already be enforcing the property.
