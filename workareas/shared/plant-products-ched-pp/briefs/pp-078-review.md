# pp-078 review brief — splitting the variety/class gate

This brief OVERRIDES the generic `review.md`. Work is **staged/modified, not committed**, in
`repos/trade-imports-animals-frontend`. Six files:
`services/commodities/index.js`, `commodities.test.js`, the variety-of-genus-and-species
`controller.js` / `controller.test.js` / `.njk`, and its `e2e/*.e2e.spec.js`.

## What the increment did

`hasVarietyAndClass` (varieties **AND** classes) was wrong: in the IPAFFS source, class is keyed by
**commodity** and variety by **commodity + species**, so they are independent lookups and 2 of 31
variety-bearing commodities have zero class rows. The gate is now `hasVarieties`; the class control and
its `requiredOneOf` rule became conditional on the species actually having classes.

## ⚠ WHAT I HAVE ALREADY CHECKED — do not re-tread it

- **`hasVarietyAndClass` is removed outright**, not left dangling beside `hasVarieties`, so nothing can
  accidentally keep using the AND gate. Both production callers (`controller.js:78` filter and `:225`
  target validation) were switched.
- **`schemaFor` no longer applies `requiredOneOf` on an empty class list** — it returns the variety
  rule alone when `classValues.length === 0`. That was my hazard 2 (an empty `requiredOneOf` would
  make a no-class species reach the page and then be **unsubmittable**).
- **The template gates the whole `govukSelect`** in an `{% if card.hasClasses %}` — no control at all,
  not an empty one and no invented "None" option. That was hazard 3.
- **`validateRow` commits `varietyClass: null`** when the species has no classes.
- `mapper.test.js:210` already carried `{ variety: 'NONE', varietyClass: null }`, and both mappers use
  `defined(entry, ['variety','varietyClass'])`.

## ⚠ FINDING I ALREADY HAVE — judge it, do not rediscover it

**pp-078 makes `varietyClass: null` reachable for the first time, and the check-your-answers page
renders it as an indistinguishable blank.**
`check-answers/view-model/cards/commodities.js:98` calls `cell(classText(entry.varietyClass))`, and
`view-model/rows/value-text.js:37` is `classLabelFor(value) ?? value ?? ''`. So `null` → **`''`**: an
empty cell under a **"Class"** column header, which reads as *"we forgot to ask"* rather than *"not
applicable"*. The CYA fixture (`check-answers.test.js:24`) uses `varietyClass: 'CLASS_I'`, so **nothing
covers the null case there.**

**I want your judgement on two things, with evidence:**
1. Is a blank cell the right user-facing outcome, or should the column say "Not applicable" / be
   omitted when no species in the consignment has classes? **Do not invent copy** — if new copy is
   needed, that is a reason to raise it as a separate increment, not to write a string.
2. **Does this belong in pp-078 or in a new increment?** The CYA card is landed pp-038/pp-080 code, so
   §7 says findings on landed work become new increments — **but the reachability of `null` is being
   introduced by pp-078 right now**, so the blank cell is a consequence of this increment rather than a
   pre-existing defect. Argue it either way, but argue it.

## ⚠ ASK WHAT EVERY FIXTURE IS A COPY OF — and check one instruction was OBEYED

**Nine instances of hand-authored fixtures standing in for what the system produces on this build.**

**⚠ I explicitly instructed the implementor NOT to pin MABSD's variety ids, labels or count**, because
**pp-086 is the very next increment** and has already verified those varieties belong to `0808108090`,
not the `0808108010` we attached them to. Pinning them would enshrine known-wrong data **and put a test
directly in pp-086's way**. **Check the test diffs and report whether that instruction was obeyed.** If
it was violated, say so plainly. If the implementor pushed back with a reason, evaluate the reason —
on this build the implementor has been right every time it disagreed with me.

Also verify the **three L1 assertions** at `commodities.test.js:151-153` (`hasVarietyAndClass('CIDAC')`
`=== true`, `('MABSD') === false`, `('UNKNOWN') === false`). **MABSD flipping `false` → `true` is the
POINT of the increment, not a regression.** L1 shape assertions are in scope to **UPDATE, never to
WEAKEN** — confirm exact equalities stayed exact and report before/after.

## ⚠ THE THREE THINGS THAT MUST NOT HAVE MOVED — verify by mutation, not by reading

1. **A species with NO varieties at all still must not reach the page** — the redirect for a fully
   non-qualifying line is unchanged.
2. **A species that DOES have classes is unaffected** — class control still renders, still required.
   CIDAC is the worked case.
3. **`to-dto.js` / `from-dto.js` diffs must be NET ADDITIONS.** They are not in the changed-file list,
   so confirm they are untouched — and separately confirm `varietyClass: null` genuinely round-trips.
   **Check what `defined()` does with `null`**: if it drops the key, the value round-trips as *absent*
   rather than *null*, which the acceptance criteria permit — but say which it is rather than assuming.

## Other axes I have NOT covered

- **A crafted POST sending `varietyClass` for a no-class species.** `validateRow` forces `null`, so it
  should be dropped — but **is that pinned?** An unpinned coercion is the pp-082 shape.
- **The duplicate check** at `controller.js:~331` compares `saved.varietyClass === entry.varietyClass`.
  With `null` on both sides, do two same-variety rows now collide correctly?
- **Dead view-model data:** `classAccessibleName` and `classItems` are still computed when
  `hasClasses` is false. Harmless if nothing renders them — **confirm nothing does**, including any
  other template or the review page.
- **The e2e spec must use the shared axe helper**
  (`sets/plant-products/journeys/linear/features/axe.e2e-helper.js`) — never a new inline `AxeBuilder`
  block, and `permittedConditionalRadio` only where a conditional radio actually renders.
- **pp-063's `varietyClass: null` acceptance clause** was previously unsatisfiable because no UI path
  could produce the value. **Name the test that now covers it** — do not accept a claim that the clause
  is met without a named covering assertion.

## Baselines at `cba97014`, which I ran myself

plant unit **725** (58 files), npm test **2,363** / 8 skipped (217 files), `test:live-animals` **559**
(a change is a REGRESSION), plant Playwright **257**, `lint:arch` **0/0** (**671** modules, **2,126**
dependencies), shasum `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
Any test count that moves must be explained, especially downward.

## Report

Findings as JSON per the schema. For each: file and line, what is wrong, **how you verified it** — a
mutation you ran or a file you read, not an inference — and severity. **Restore anything you mutate;
`git diff` must be unchanged when you finish.** Do not modify code as a fix; this is review only.
**Zero findings is an acceptable and useful answer** — two increments on this build earned one. Do not
manufacture findings. If you disagree with a ruling of mine, say so with evidence.
