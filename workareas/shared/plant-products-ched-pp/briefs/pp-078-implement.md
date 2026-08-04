# pp-078 — a species with varieties but NO applicable class must reach the variety page

This brief OVERRIDES the generic `implement.md`. **Production behaviour change inside
`sets/plant-products/` only.** Anything forced outside the set is `ok:false` with evidence.

## Why this is in, and it is NOT open for relitigation

Sam ruled it in after evidence was gathered from the IPAFFS source
(`ipaffs-commoditycode-microservice` at `c445e7cd`): **31 commodities have varieties and 2 have ZERO
class rows** — `08105000` (kiwifruit) and `08059000` (other citrus). So "has varieties, no applicable
class" is a **real state**, roughly 6% of variety-bearing commodities.

The structural reason is decisive: **`commodity_class.csv` is keyed by `traces_commodity_code` ONLY,
with no `eppo_code` column**, while `commodity_eppo_variety.csv` is keyed by commodity AND eppo. Class
is a property of the **commodity**; variety of **commodity + species**. Independent lookups — so one
can trivially exist without the other. **`hasVarietyAndClass` requiring both is wrong.**

I verified `08059000` is already in our fixture (`fixture.js:55` and `:146`), so the real case is
reachable with the selection we ship.

## The current gate — every line below I read myself at `cba97014`

`services/commodities/index.js:80-81`:
```js
export const hasVarietyAndClass = (eppoCode) =>
  varietiesFor(eppoCode).length > 0 && classesFor(eppoCode).length > 0
```

**Exactly two production callers**, both in
`journeys/linear/features/commodities/variety-of-genus-and-species/variety-of-genus-and-species.controller.js`:
- `:78` — `qualifyingSpecies` filter (drives the GET redirect when zero species qualify)
- `:225` — target validation repeating the same gate

**Plus three test assertions** at `services/commodities/commodities.test.js:151-153`:
`hasVarietyAndClass('CIDAC') === true`, `('MABSD') === false`, `('UNKNOWN') === false`.

The class control and its rule: `:233` `classValues = classesFor(entry.eppoCode)`, `:240`
`requiredOneOf(names.varietyClass, classValues, copy.errors.classRequired)`, view model at
`:147` / `:152` / `:156`, committed entry at `:308` and `:326`.

## ⚠ HAZARD 1 — SPLIT THE CONCEPT, AND UPDATE THE THREE ASSERTIONS RATHER THAN DELETING THEM

Page qualification requires **varieties**. Class applicability is a **separate** question.

**`MABSD` will flip from `false` to `true` — that is the entire point of the increment, not a
regression.** L1 shape assertions are **in scope to UPDATE, never to WEAKEN**: keep exact equalities
exact and **report the before/after for all three**. If the helper is renamed or replaced, the
assertions move with it; they do not get quietly dropped.

**Do not delete the combined helper without checking every caller.** I found two production callers
and three test assertions — **confirm that list yourself before changing anything**, and say if you
find more than I did.

## ⚠ HAZARD 2 — `requiredOneOf` ON AN EMPTY LIST REJECTS EVERYTHING

`:240` currently applies `requiredOneOf(names.varietyClass, classValues, …)` unconditionally. When
`classValues` is `[]`, that rule cannot be satisfied by any submission — so a species with no classes
would reach the page and then become **unsubmittable**, which is worse than the current redirect.

**The class rule must apply only when the species actually has classes. The variety control stays
mandatory in both cases.** Prove both halves.

## ⚠ HAZARD 3 — NO CLASS CONTROL AT ALL, NOT AN EMPTY ONE

The acceptance criterion is explicit: a no-class species renders **NO class control** — *not* a class
control with an empty list, and *not* one carrying a "None" or "Not applicable" option. **Inventing a
"None" option would be inventing data.** Assert its **absence** in the rendered DOM, not merely that
its options array is empty.

## ⚠ HAZARD 4 — DO NOT PIN MABSD'S VARIETY VALUES. pp-086 IS ABOUT TO CHANGE THEM

**This is a standing ruling from pp-084 and it applies here.** pp-086 has **verified** that our
commodities fixture has three data defects: the class map is keyed by species where the source keys by
commodity; our sole class entry (CIDAC) is unsupported; and **MABSD's varieties belong to `0808108090`,
not the `0808108010` we attached them to.**

So: use MABSD as the **worked case for the behaviour**, but **pin the BEHAVIOUR, not the DATA**. Do not
add assertions on MABSD's variety ids, labels or count. Pinning known-wrong values would enshrine them
**and put a test directly in pp-086's way** — pp-086 is the very next increment.

**CIDAC stays the "does have classes" case** proving the unaffected path.

## ⚠ HAZARD 5 — THE THREE THINGS THAT MUST NOT MOVE

1. **A species with NO varieties at all still must not reach the page.** The redirect for a fully
   non-qualifying line is unchanged. Prove it, by mutation.
2. **A species that DOES have classes is unaffected** — class control still renders, still required.
   The acceptance criteria say "proved by mutation". Do that and report the failing test name.
3. **`varietyClass: null` (or absent) must round-trip through `to-dto.js` / `from-dto.js` unchanged.**
   **⚠ Diffs to those two files must be NET ADDITIONS** — standing rule on this build. If a mapper
   change would remove or alter an existing line, stop and report rather than doing it.

## pp-063's clause — say where the assertion lives

pp-063 has a `varietyClass: null` acceptance clause that has been **unsatisfiable** because no UI path
could produce it. State explicitly **where the covering assertion now lives**. Do not claim the clause
is met without naming the test.

## Baselines — I ran all of these myself at `cba97014` (pp-088). Re-run them; do not quote mine forward

- `test:plant-products` — **725** passed, 58 files
- `npm test` — **2,363** passed / 8 skipped, 217 files
- `test:live-animals` — **559** (65 files) — **a change here is a REGRESSION**
- `test:features:plant-products` (**`PORT=3201`**) — **257**
- `lint:arch` — **0/0**, **671** modules, **2,126** dependencies; shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

**My expectation, to refute if wrong:** this increment edits existing files only, so **671 modules
unchanged**; dependencies may move if imports change. `.dependency-cruiser.cjs:181` excludes
`\.test\.js$` only — an `.e2e.spec.js` or `.e2e-helper.js` **does** count.
**⚠ My briefs have been wrong seven times on this build and the implementor or reviewer was right every
time. Correct me with evidence — do NOT make the code match my numbers, and do not echo them back.**

## Rules

- **Stop and report `ok:false` rather than inventing data or touching production code outside the
  set.** Eight-plus increments have stopped rather than fabricate and every one was right. **Stopping
  twice carries no penalty; inventing one row does.**
- The GOV.UK conditional-radio axe false positive has **one** shared helper:
  `sets/plant-products/journeys/linear/features/axe.e2e-helper.js`. **Use it.** Never write a new
  inline `AxeBuilder` block. Pass `permittedConditionalRadio` **only** where a conditional radio
  actually renders.
- Any test count that moves must be explained, especially downward:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **State what the code now does differently before believing any green mutation run.** An inert
  mutation has falsely refuted as well as falsely confirmed on this build.
- Welsh is machine-draft and covered by a Welsh-speaking tech lead. Mention it once at most.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
