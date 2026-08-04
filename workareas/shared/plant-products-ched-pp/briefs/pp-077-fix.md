# pp-077 — FIX pass: build case (a) only

**Your stop was correct on case (b) and I have acted on it. Case (a) is still owed.**

---

## 1. You were right and my brief was wrong — case (b) is now `pp-078`

My brief suspected MABSD already reached the variety page. **It does not, and you established why.**
I verified your reading myself rather than taking it: `services/commodities/index.js:80-81` is

```js
export const hasVarietyAndClass = (eppoCode) =>
  varietiesFor(eppoCode).length > 0 && classesFor(eppoCode).length > 0
```

— an **AND** — and the controller repeats that gate at `:78` (`qualifyingSpecies`), `:198` (the GET
redirect) and `:225` (target validation), with `requiredOneOf` on `varietyClass` at `:240`. So a
varieties-without-classes species can never reach the page, another such fixture row would behave
identically, and fabricating a class would have broken the increment's own rule. **Stopping was the
right call.**

**That is the third time in this build an implementor has correctly pushed back on an orchestrator
instruction** (pp-023's manifest boundary, pp-031's axe carve-out, now this). It is recorded.

**Case (b) is out of scope for pp-077.** I have raised **`pp-078`** to own it — it is a
controller/validation change with a product ruling attached, not fixture data. **Do not attempt it
here and do not touch the variety controller.**

## 2. Case (a) is owed, and I verified your source before asking for it

You found a real source and stopped without using it. **Build it now.** I checked every citation
against the working tree rather than trusting the report:

- `~/git/defra/ipaffs/ipaffs-commoditycode-microservice` is at exactly
  `c445e7cd234ae0041c4061992509d70e1f602a3e`. ✓
- `species.csv` lines **1002 / 1006 / 1007** are `MABAN` / `MABSD` / `MABZU`, with species UUIDs
  `055CA471-…` / `A8025BC6-…` / `13638316-…`. ✓
- `certification_nomenclature.csv` lines **533 / 542 / 546** carry those same three species UUIDs with
  *Malus angustifolia* / **1319830**, *Malus domestica* / **1391442**, *Malus x zumi* / **1327015** —
  and **all three share the one nomenclature id `0713E424-5B5C-18D6-FB63-A949B70C1477`**, which is
  what makes them three species of the *same* commodity rather than three unrelated rows. ✓

**Two things about this that make it the right choice, and both should be in the commit body:**

1. **`1391442` is already our MABSD `speciesId`** for `0808108010`. The source agrees with shipped
   data, so this is genuinely an extension of an existing verified row rather than a competing claim.
2. **In source order MABSD becomes the MIDDLE entry** (MABAN, MABSD, MABZU). That is exactly what the
   increment exists for — the existing verified entry is *surrounded*, not moved, and a middle-entry
   removal becomes expressible for the first time at depth 3.

**State the provenance honestly, including its limitation.** These rows live under
`service/src/test/resources/integration/data/` — the IPAFFS microservice's **integration-test
dataset**, not its production reference data. It is real IPAFFS-shaped data from the owning service
and it is the best source available locally, but say what it is. Record it in `docs/README.md`
alongside pp-027's `plantsForPlanting` entry (around line 145), in the same voice.

## 3. Everything else from the original brief still stands

- **PURE ADDITION.** Existing entries byte-identical — including MABSD's own row, which is now
  surrounded rather than rewritten. **Report the `git diff` stat on `fixture.js`.**
- **The tests must read the REAL exported fixture**, never a literal re-declaration compared to
  itself. **Pin stable ORDER**, because a middle entry means nothing without it — assert the three
  EPPO codes in source order by identity.
- **`lint:arch` must stay 0 / 0.** You are adding rows to an already-consumed fixture.
- **If adding two species to `0808108010` moves any existing test's expected value** — a row count, a
  species picked by position, a browser assertion — **report it before/after and explain why the new
  value is correct.** Never adjust an assertion to make a number match; that is how a real regression
  gets absorbed. Expect this: `0808108010` currently has exactly one species and something may well
  depend on that.
- **State what now becomes testable and where**, so pp-063's follow-up has a named target. A fixture
  with no consuming assertion is the dead-spec pattern.

## 4. Baselines — verified by me at HEAD (`76f25186`)

| Leg | Baseline |
|---|---|
| plant unit | **652** |
| `npm test` | **2,283 passed / 8 skipped** (210 test files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| plant Playwright | **243 passed, zero flaky** |
| `lint:arch` | **0 errors / 0 warnings** (660 modules) |

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

**NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
`git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`.

Run `npm run format`. **Stage everything but do NOT commit** — leave it staged and report.
