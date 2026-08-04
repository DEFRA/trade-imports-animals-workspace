# pp-082 — fix brief

**`git status` FIRST. Your predecessor's work is STAGED and must be PRESERVED. Do not start over, do
not unstage, do not revert, do not commit.** You are extending one file:
`src/server/app/sets/plant-products/services/records/records-port.test.js`.

Three review findings. **I verified all three myself by mutation — they are real, not speculative.**
Measured results are below so you do not have to re-derive them.

---

## Finding 1 (MAJOR) — the increment's central change has NO pin. Fix this first

The whole point of pp-082 is that the fake backend now **replaces** content instead of **merging** it.
**Nothing tests that.**

**Measured:** I reverted the fixture's replace to the old merge — changing
`...normaliseContent(body)` back to `...body` at the PUT branch — and the plant suite was
**689/689 GREEN**. So a future "simplification" back to a merge reintroduces the exact defect this
increment exists to remove, silently.

**Fix:** add a parity case that writes populated content, then replaces it with a **strict subset**,
and asserts every omitted section is **absent** after load — not merely that the kept ones survived.

This works on **both** legs, so it belongs in the shared `describe.each` body: the stub also replaces
wholesale (`stub.js:135` `record.fulfilment = clone(fulfilment ?? {})`). Assert absence explicitly
(the key is gone), not just that some other value is present.

**Your acceptance test for the fix:** with your new case in place, changing
`...normaliseContent(body)` to `...body` must **fail by name**. Run that mutation, report the failing
test name, and restore byte-identically.

## Finding 2 (MAJOR, REAL BUT OWNED ELSEWHERE) — remove the `totalGrossWeight` seed. Do NOT fix the type

`totalGrossWeight: '20'` in the seeded answers **cannot round-trip through the real backend in the
shape asserted.** I verified the chain:

- `PlantProductsAdditionalDetails.java:15` — the field is **`BigDecimal`**.
- The frontend controller writes a **string**: `additional-details/controller.test.js:213` pins
  `expect(result.after).toEqual({ totalGrossWeight: '12' })`.
- `to-dto.js:82` and `from-dto.js:68` pass it through **unconverted**, in a plain field list.

So the real backend deserialises `"20"` into `BigDecimal` and serialises it back as the JSON **number**
`20`, while the stub and the fake both preserve the string. The fixture is asserting a fidelity the
real system does not have.

**Do this:** remove `totalGrossWeight` from the seeded answers. **Do not add a conversion, do not
change any mapper, do not "normalise" the fake to coerce numbers.** The canonical weight type is a
production question that needs a ruling, and **I am raising it as its own increment (pp-089).**

**Keep the `additionalDetails` section covered anyway** — and you can, without touching a numeric
field. That section has exactly three fields (`totalGrossWeight`, `grossVolume`, `grossVolumeUnit`);
the first two are `BigDecimal`, but **`grossVolumeUnit` is an enum and round-trips as a string
safely**. `to-dto.js:87-90` emits the whole `additionalDetails` section when **any** of the three is
defined, so seeding `grossVolumeUnit` alone keeps the section covered. Use a real option value —
check the controller/copy for what it actually writes (`'LITRES'` appears in the e2e, verify it).

**If you find any other seeded value with the same string-vs-number problem, treat it the same way:
drop it and report it. Do not invent a value to make a round trip look clean.**

## Finding 3 (MAJOR) — the seed covers only some sections, so it kills instances not the class

`SECTION_MAPPERS` (`to-dto.js:219-229`) has nine entries. The seed exercises only some of them.

**Measured — I deleted each of these from `SECTION_MAPPERS` and ran the plant suite:**

| Deleted mapper | Tests failed | Where |
|---|---|---|
| `mapCommodity` | 7 | **all in `mapper.test.js`, ZERO in `records-port.test.js`** |
| `mapGoodsMovementServices` | 3 | **all in `mapper.test.js`, ZERO in `records-port.test.js`** |
| `mapResponsiblePerson` | 2 | **all in `mapper.test.js`, ZERO in `records-port.test.js`** |

The parity suite is blind to all three. Separate mapper unit tests do **not** make the parity
contract structural — they test the mapper in isolation, not that a section survives the real
GET → `fromDto` → `toDto` → PUT → load path the backend actually nulls on omission.

**Fix:** extend the seeded answers so the populated round-trip covers **every** section a real
journey writes — including commodity, goods movement and responsible person.

**Source every added key.** Name the controller or evaluation module that writes it and match shape
and case exactly. **Hand-authored fixtures standing in for what the system actually produces is the
dominant failure mode on this branch — six instances so far**, including a fixture that said
`'manual'` where the controller writes `'MANUAL'`, and an invented `arrivalDate` object shape where
transport actually persists an ISO string. **Note pp-087 specifically: `usingGvms` is a boolean at
rest via a converter — check `features/evaluation.js` bindings for anything similar before you seed
it.** If you cannot source a value, leave that section out and **say which and why**.

**Then reach for a structural pin that kills the class.** The model is `features/evaluation.test.js`,
which asserts every converter is idempotent **and** that the converter list exactly equals the set
with pinned input shapes — so a new converter cannot be added unpinned. The equivalent here is
something that fails when a **new** section mapper is added without round-trip coverage.

⚠ **`SECTION_MAPPERS` is not exported, and this is a TEST-ONLY increment.** A pin over the key set
that `toDto` produces from the full seed needs no production change and is the preferred shape.
**If you conclude the only real structural pin requires a production edit, STOP and report it with
your reasoning rather than making it** — that is a valuable outcome, not a failure. Do not add an
export purely to let a test reach inside.

## Verification

Re-run all of these and report exact numbers. My pre-fix baselines at this staged state: plant
**689**, full **2,327 passed / 8 skipped (217 files)**, live-animals **559**, `lint:arch` **0/0**
(671 modules, 2,128 dependencies).

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

**live-animals must stay at exactly 559** — nothing here can legitimately move it.

**Report:** the finding-1 mutation result by test name; every key you added with its source; anything
you dropped and why; every count above; and anything you could not verify yourself. Leave the work
**staged, not committed.**
