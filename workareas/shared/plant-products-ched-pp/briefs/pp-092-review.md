# pp-092 review brief — re-basing the tests repo's duplicated commodity constants

This brief OVERRIDES the generic `review.md`. **The `-tests` repo — a SEPARATE git repo.** Work is
**staged, not committed**, across six files. The stack is up, including the **test-target on :3100**
built from local source; **do not rebuild it.**

## What the increment did, and why it existed

pp-078 and pp-086 changed the frontend's commodity variety/class model. The tests repo carries its
**own hand-maintained duplicate** of that data with nothing keeping the two in agreement, so the plant
suite went **28 passed / 3 failed** against the real stack —
`locator.selectOption ... did not find some options`, because the spec selects variety `'NONE'` (the id
pp-086 established was **fabricated**) and the app now offers the real source UUID.

## ⚠ WHAT I HAVE ALREADY VERIFIED — do not re-tread it

- **The constants now mirror the frontend exactly**: `varieties` keyed by commodity → EPPO;
  `varietyClasses` keyed by commodity alone; CIDAC's id corrected to
  `C5E27C5A-D13B-E9F5-B4B0-7234A7941208`; Royal Gala added; `eppo-species.ts` now carries MABAN/MABSD/
  MABZU under `0808108010` (the **pp-077** data missing since then) and `0808108090`.
- **The one off-plan file is forced, not creep.** `flows/plant-products/api-journey.ts` seeded a
  notification with `varietyClasses.CIDAC[0]`, which no longer exists — it now drops the class and
  re-keys the variety by commodity. An API-seeded CIDAC class would be purged by the model anyway.
- Reported: **31/31 plant**, live-animals 138 passed / 1 skip, typecheck + lint + format:check green,
  test count unchanged, Royal Gala seen on the commodity summary page (proving the rebuilt :3100 app).
- Both required mutations reported failing by name.

## ⚠ THE AXES I WANT — I have NOT covered these

**1. The inverted test — was it rewritten or hollowed out?** `varieties.spec.ts` carried a test titled
*'MABSD has real varieties but no classes, so the UI correctly creates no variety entry instead of
fabricating a class'*. **pp-078 made that behaviour false**: a no-class species now renders **no class
control at all** and the entry **persists with the class absent**. The roles swapped — CIDAC is the
no-class case now. **Test count is unchanged, which is consistent with a faithful rewrite AND with a
quiet weakening.** Read the before/after and say which. Does it assert the *absence* of the class
control in the DOM, and the *absence* of the property after persistence — or merely that nothing
crashed?

**2. Is the depth-3 middle-removal genuinely discriminated on variety identity now?** It used to build
three rows as **one variety × three CIDAC classes**; those classes are gone. Rebuilt on MABSD's three
real varieties, the rows should now differ by **variety identity**. **Remove the middle variety
yourself and confirm it fails by name** — pp-026 shipped an always-remove-index-0 bug that passed 360
unit and 108 of 109 browser tests, so this property is load-bearing. Also confirm removing a **first or
last** entry fails, per the standing rule that a collection needs both.

**3. Did any consumer of these constants get missed?** `api-journey.ts` was found and fixed. **Grep
every import of `@domain/plant-products/constants/{varieties,eppo-species,commodity-codes}` across
specs, flows, fixtures, page-objects and adapters**, and confirm each call site matches the new
commodity-keyed shape. A missed one that still compiles (e.g. an index into a now-nested object) would
yield `undefined` and could pass vacuously.

**4. The `'Other'` ambiguity.** `0808108090`'s description is `'Other'` — **the same string as
`08059000`**. The implementor asserts no commodity locator selects on description alone. **Verify that
across the whole plant suite and page objects**, not just the edited files. This is the pp-024/pp-079
class: a locator that reads as specific but resolves two nodes. If one exists, it may pass today by
DOM order and break on reordering.

**5. The live-animals baseline.** The implementor reports 138 passed / 1 skip as "unchanged" — **I never
established that baseline myself.** Confirm it against `git stash`-ed pre-change state or against
origin, and say whether 138 is genuinely the prior number rather than merely today's.

## ⚠ Provenance

Every value must trace to
`repos/trade-imports-animals-frontend/src/server/app/sets/plant-products/services/commodities/fixture.js`
at frontend `8c309b57`. **Spot-check a sample directly against that file** — the whole increment exists
because a duplicate drifted, so a re-based duplicate that is *still* wrong is the worst outcome.
Nine increments on this build have stopped rather than fabricate; check nothing was invented to make a
test pass.

## Things you do NOT need to raise

- **The duplication itself.** That the tests repo hand-maintains a copy of frontend fixture data is a
  known, recorded open question for Sam (generate it, or add a contract test). **Do not propose a
  cross-repo mechanism here** — say so in the summary if you have a view.
- **The frontend repo** — untouched and must stay so. A needed frontend change is a finding with
  evidence, not an edit.
- **Welsh** — not in scope.

## Report

Findings as JSON per the schema. For each: file and line, what is wrong, **how you verified it — a
mutation you ran or a file you read, not an inference** — and severity. **Restore anything you mutate;
the staged diff must be unchanged when you finish.** Review only; do not fix.

**Zero findings is acceptable.** ⚠ But note the recent record on this build: one review finding was a
**false positive** I confirmed with an inert mutation before an implementor correctly refused it, and my
own verification of a later finding was **malformed** and falsely refuted it. **If you claim a gap,
prove your mutation actually changed observable behaviour, and say what else might already be
enforcing the property.**
