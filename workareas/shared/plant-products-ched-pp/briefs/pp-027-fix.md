# pp-027 FIX — the fixture flag is named for a different field than the one it gates

Your pp-027 work is staged and **the behaviour is correct**. **Do not start over, do not revert, do not
re-run the increment.** `git status` first: the tree is staged and matches the index. Two focused
changes, both about making the new fixture attribute honest.

I checked your conditional against the spec before writing this. `increments/pp-027.json:151` requires
that **`finishedOrPropagated`** "renders and validates only for lines the commodities fixture flags",
and `:172` records that the legacy gate is `commodity.group.showIntendedUseDropdown` ('Plants for
Planting'). Your `view-model.js:81` does exactly that —
`showFinishedOrPropagated: requiresIntendedUseFor(code)`. **The gate is right and the fixture flag was
sanctioned, not invented.** Two problems remain.

## 1. The name says the wrong field, next to a real field of nearly that name

`requiresIntendedUse` / `requiresIntendedUseFor` gates **`finishedOrPropagated`**. But this same page
also renders **`intendedForFinalUsers`** — a genuinely different obligation with its own control and
its own copy keys. A reader meeting `requiresIntendedUseFor(code)` beside an `intendedForFinalUsers`
radio group will reasonably conclude it gates that field. It does not.

The name is inherited from the legacy `showIntendedUseDropdown`, which is faithful but misleading: the
legacy name is itself wrong about what it controls, and we are not obliged to carry a bad name across.
House rule is to name things for what they do.

**Rename throughout to name the real condition** — the commodity being *plants for planting*.
Suggested: `plantsForPlanting` on the fixture node and `isPlantsForPlanting(code)` in
`services/commodities/index.js`; use whatever reads best, but the name must refer to the
plants-for-planting condition or to `finishedOrPropagated`, never to "intended use". Update every
call site, and the test names that inherited the confusion:

- `'flags only fixture commodities that require the intended-use question'`
- `'requires finished or propagated only for the fixture-flagged line'` (this one is already fine)
- `'does not validate or commit finishedOrPropagated for an unflagged non-zero line'` (fine)
- the browser case `'renders and requires the domain intended-use question only for the fixture-flagged line'`

Renames are fine here — **report each one with its replacement**, as you correctly did for the three
redirect renames in this increment.

## 2. Record WHY 06011010 carries the flag and the other two do not

You added `requiresIntendedUse: true` to `06011010` Hyacinths and left `0603197090` and `06042090`
without it. **That is a factual claim about real commodities and it currently has no stated source.**
pp-014's fixture is the file in this set with per-file stated provenance — it is the increment that
refused to invent an EPPO association — so a new data attribute on it needs its basis written down.

The derivation appears sound and I want it stated rather than assumed: the flag tracks *plants for
planting*, and the CN chapters already in the fixture carry that distinction — **0601** is bulbs,
tubers and roots (plants for planting), while **0603** is cut flowers and **0604** is foliage and
branches (neither is for planting). If that is your reasoning, say so. If you had a different source,
give it.

**Write it into `src/server/app/sets/plant-products/docs/README.md`**, alongside the deviation log
pp-024 added there — not as a code comment (rationale lives in docs, not in the source). One or two
sentences: what the flag means, which commodities carry it, and why.

**If you cannot justify the assignment from data already in the fixture or from a real source, say so
plainly** and we will treat the applicability list as an open question for Sam rather than shipping an
unsourced one. Stopping costs nothing here; an unsourced applicability rule that renders perfectly is
exactly the pp-014 failure mode.

## Rules for this pass

- **Rename and document only.** No behaviour change — the gate logic is correct as staged. If you find
  yourself changing what renders, stop and report.
- **NO TEST DELETED.** Renames are expected here; report each with its replacement.
- Re-run the ladder and confirm the counts are unchanged against these, which I verified myself at the
  staged state: plant unit **397**, `npm test` **2,000 passed / 8 skipped**, live-animals **559**,
  plant Playwright **128**, `lint:arch` **0 errors / 2 warnings** (`document-types`,
  `gross-volume-units`).
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

## Noted, no action needed

Your correction to my brief was right and I have accepted it: I said `lint:arch` should fall to one
warning naming `gross-volume-units` as consumed here. It is not — `grossVolume`/`grossVolumeUnit`
belong to pp-028. 4 → 2 with `document-types` and `gross-volume-units` remaining is the correct
outcome, and I verified it myself.
