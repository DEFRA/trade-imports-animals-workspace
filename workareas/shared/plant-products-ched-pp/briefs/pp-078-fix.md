# pp-078 fix brief — one finding on STAGED, UNLANDED work

**⚠ RUN `git status` FIRST. The pp-078 work is STAGED and must be PRESERVED.** Six files are already
modified in the index. **DO NOT start over, do not revert, do not re-implement pp-078.** You are adding
to work that is already correct.

**This is a TEST-ONLY fix. The production code is RIGHT — do not change
`variety-of-genus-and-species.controller.js`.** If you believe it needs changing, stop and report
`ok:false` with evidence.

Do not commit. The orchestrator lands it.

## The finding — the coercion is correct but UNPINNED

`validateRow` builds the committed entry as:

```js
const entry = {
  variety: committedVariety,
  ...(classesFor(target.species.entry.eppoCode).length > 0
    ? { varietyClass: value[names.varietyClass] }
    : {})
}
```

For a species with no classes the key is **omitted entirely** — correct, and the acceptance criteria
permit absent or null.

**But nothing proves it.** `schemaFor` no longer adds `requiredOneOf` for `varietyClass` on a no-class
species, so **nothing validates that field at all** on that path. A crafted POST carrying
`varietyClass-0-0: CLASS_I` for a species with no applicable classes is silently dropped **by this one
conditional and by nothing else** — and if that conditional regressed, the forged value would round-trip
all the way to the backend on a species where no class is valid.

**I verified the gap myself with two mutations, and the distinction matters:**

- I replaced the whole conditional with an unconditional `varietyClass: value[names.varietyClass]` —
  **caught**, by *'persists and round-trips a no-class variety without a class leaf'*.
- I then replaced the class-existence check with a **truthiness** check on the submitted value —
  `...(value[names.varietyClass] ? { varietyClass: … } : {})` — which accepts a forged class while
  still omitting the key when nothing is submitted. **727/727 GREEN.**

So the existing test proves *"we do not invent a key we were not given"*. It does **not** prove *"we
drop a key we WERE given but must not accept"*. That second half is the security-adjacent one and it is
the increment's own centre — **the pp-082 shape, where a real strengthening ships with an unpinned
middle and a later simplification silently reinstates the defect.**

## What to do

In `variety-of-genus-and-species.controller.test.js`, the no-class persistence test around **line 248**
currently submits **no** `varietyClass`. **Add `varietyClass-0-0: 'CLASS_I'` to that payload** — a
forged value for a species that has no classes — and assert the saved and round-tripped entry has **no
`varietyClass` property at all**.

Use `CLASS_I` because it is a real class code already used elsewhere in these fixtures; do not invent a
code. Assert **absence of the property**, not `undefined` equality — `toHaveProperty` semantics differ
from `toEqual({...})` when a key is present with an `undefined` value, and that difference is exactly
what the first of my two mutations turned on.

**Prove it with my second mutation:** change the conditional to the truthiness check above and show the
test now fails **by name**. Report that name. Then restore the production code exactly — `git diff` for
`controller.js` must be identical to its staged state when you finish.

**Consider whether the same gap exists for the no-class species on the browser leg**
(`e2e/variety-of-genus-and-species.e2e.spec.js`). A forged field cannot be typed into a control that is
not rendered, so a DOM-level test may be unable to express this — **if so, say that plainly rather than
contriving one**. The controller-level pin is the right home.

## Constraints

- **Do not touch the check-answers page.** I raised a concern that the blank Class cell was uncovered;
  **the review refuted it with evidence and I verified the refutation** — `check-answers.test.js:30-33`
  already carries classless MABSD rows and `:474-479` pins the blank cell explicitly as
  `['Commodity 3', 'Malus domestica, MABSD', 'McIntosh Red', '']`. It is covered. Leave it alone.
- **Do not pin MABSD's variety ids, labels or count.** pp-086 is the very next increment and has
  verified those varieties belong to `0808108090`. Pin behaviour, not data.
- **Never invent a fixture value.** Ask what each is a copy of.
- No test may be deleted, renamed or weakened. Report the count before and after:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- **Baselines to hold** (I ran these myself): plant unit **727** (58 files), npm test **2,365** / 8
  skipped (217 files), `test:live-animals` **559** (a change is a REGRESSION), plant Playwright
  **258**, `lint:arch` **0/0** with **671** modules / **2,126** dependencies, shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. A test-only change should move none of these except the
  unit count. **Derive that yourself; correct me with evidence rather than making the code match.**
- Run `npm run format` before finishing.
