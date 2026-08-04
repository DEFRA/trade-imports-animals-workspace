# pp-024 — commodity-basic-description (select species per commodity line)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — it has been wrong fourteen times, twice in ways that would
have destroyed shipped work.

---

## 1. The wiring is DONE. Do not repeat it, and do not be misled by pp-024's own notes

pp-024's `notes` field opens with an ordering warning about pp-021 leaving the commodity obligations
unwired and pp-023 owning the manifest exports. **That is now history. pp-023 landed (`11682527`) and
the handshake is complete.** Verified by me at HEAD:

- **All 18 commodity obligations are in `obligations/index.js`** — imported, re-exported and in the
  `obligations` array.
- **`features/commodities/evaluation.js` exports ONE merged bundle**, `evaluationBindings`, with 16
  entries (the input-method scalar plus pp-021's 15 grouped leaves). `inputMethodBindings` no longer
  exists. `features/evaluation.js` registers that one bundle.
- **`commoditySelection` is in `policy.enforcedAtContinue`**, alongside `countryOfOrigin`.

**So this increment does NO manifest work and NO binding work.** If you find yourself editing
`obligations/index.js` or either `evaluation.js`, stop and re-read this section — the plan's
`filesToTouch` correctly does **not** list them.

**Why your page's `collects: []` is correct and not an oversight.** `ownerOfObligation`
(`flow/dispatch.js:33`) walks **up** the ancestor chain. `commodity-search` collects
`['commodityLines']`, so every descendant — `commodityLines.species`,
`commodityLines.species.speciesId`, and the rest — already resolves to an owning page through that
one claim. I proved this by mutation: setting `commodity-search`'s `collects` to `[]` fails naming all
eighteen paths. **Declaring `collects` on your page for an obligation `commodity-search` already owns
would throw** `Obligation "..." is collected by two pages`. Keep `collects: []`.

## 2. What actually exists now — check these before trusting the plan

- **`features/commodities/page.js` is an edit.** It exports `commodityInputMethodPage` (pp-022) and
  `commoditySearchPage` (pp-023). Append your identity. The file imports NOTHING (recipe hard rule).
- **The three copy files under `features/commodities/copy/` are edits**, already carrying
  `inputMethod.*` and `commoditySearch.*` blocks. Namespace yours alongside them.
- **The `commodities` flow section and task row already exist** — positioned after `purpose`, before
  `transport`, currently holding `commodity-input-method` then `commodity-search`. **Append your page
  into both; do not create a second section or row, and do not move the section.**
- **`services/records/mapper/` needed NO edit in pp-023** — `to-dto.js`, `from-dto.js` and
  `mapper.test.js` already carry depth-three mapping, inverse resume and round-trip coverage for the
  species subtree. The plan does not list them here either. **Verify that holds for your fields rather
  than assuming; if a mapper edit IS forced, report it as a plan gap rather than delivering silently.**
- **`docs/README.md` is listed as an edit** for the deviation log (decision 3's recorded-not-built
  machinery-checkbox and hidden-block renderings). Do that — a recorded deviation that never gets
  written down is just an undocumented gap.

## 3. ⚠ The hub already shows 'Cannot start yet', and you are about to change it again

pp-023 put `commoditySelection` into `enforcedAtContinue`. The observed consequence: **the Transport
row now reads 'Cannot start yet' with no link until a commodity is selected.** pp-018 produced the same
shape of accidental ordering constraint on the Purpose row. Sam has been flagged about both.

Your page sits inside the same section, so row states and the readiness gate may shift again.
**Check what the hub renders before and after your change and report any difference explicitly**, even
if you judge it correct. Do not let a changed row state arrive silently — twice now these have been
consequences nobody designed.

## 4. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-023, `11682527`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **285** |
| `npm test` | **1,884 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **78** |
| `lint:arch` | **0 errors / 4 warnings** |

Full ladder after the change:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3050 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

The 4 advisory `no-orphans` warnings are `document-types`, `gross-volume-units`, `package-types` and
`quantity-types`. This increment consumes none of them, so **expect 0 errors / 4 warnings, unchanged**;
explain any movement in either direction. **NEVER "fix" these warnings.** `shasum
.dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Every count that moves must be explained, especially downward.**

## 5. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the only tell was the Playwright count falling 13 → 11. A test that cannot pass
  is a **stop-and-report**, never a deletion. If you rename, name the replacement for each — pp-023
  renamed three and reported all three, which is the standard. Before finishing, run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` over it; use `--staged`.
- **AXE IS NECESSARY, NOT SUFFICIENT.** pp-017 proved axe stays green at serious/critical while a
  fieldset legend is empty — the exact defect c-014 exists to fix. **Assert computed accessible names
  directly.** This page is a card-per-line surface with repeated Remove controls, so assert that each
  control's accessible name distinguishes WHICH line it acts on. Three controls sharing the accessible
  name "Remove" is axe-invisible and fatal for a screen-reader user — the same defect the trace work
  found in the legacy service's three "Copy" controls.
- **NEVER INVENT DATA.** Every commodity code, EPPO code and species row comes from pp-014's fixture as
  shipped. pp-014 stopped rather than invent an EPPO association and was right — the plan had named a
  CHED-D commodity. Stopping twice carries no penalty; inventing one row does.
- **Parent-index guards are load-bearing here.** pp-012 found a real engine defect where an
  out-of-range or non-integer parent index corrupted persistence, and pp-070 fixed it. Your
  `appendEntryAt`/`removeEntryAt` calls must refuse both, at both ancestor levels, **without
  persistence corruption** — and prove it, since a phantom parent renders perfectly and only surfaces
  as junk in the payload.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so and name the evidence.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. `contract.plant-products.test.js` at the app root is the named
  exception. (pp-023 did force one — `createAll(Tabs)` in the shared client bundle — and reported it
  with a blast-radius check. That is the bar: forced, evidenced, scoped.)
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 6. The increment itself

The eight headless decisions — single-page all-lines card layout per the `animal-identification`
exemplar, the CHED-PP-specific error string *'Select at least one Genus (and Species)'*, the legacy
anti-patterns deliberately not copied (data-derived control names, link-buttons, hand-rolled
pagination, bespoke CSS), Remove always available including the last species, no Cancel link,
case-insensitive AND-combined substring filtering, already-added species excluded from results, and no
species/line cap — are as specified in `backlog.json`'s `pp-024` entry. Follow it there, subject to the
corrections above. Exemplars to transpose rather than invent:
`sets/live-animals/journeys/linear/features/commodities/animal-identification/` (the proven depth-2
nested-loop surface) and `contract.test.js:251-275` for the depth-2 contract case shape.
