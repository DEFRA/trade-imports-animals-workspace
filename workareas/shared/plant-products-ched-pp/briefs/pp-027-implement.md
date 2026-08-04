# pp-027 — commodity-bulk-details (per-commodity measures)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far, twice destructively.

**The heaviest contract/validation increment of m3.** Nine measure leaves per commodity line, bulk-apply
semantics, and a copy bundle large enough that en/cy parity is the first thing that goes red.

---

## 1. Declare NO obligations and NO bindings — `collects` stays empty

All nine measure obligations (`numberOfPackages`, `packageType`, `quantity`, `quantityType`,
`netWeight`, `controlledAtmosphereContainer`, `finishedOrPropagated`, `intendedForFinalUsers`,
`testAndTrial`) are pp-021's and were manifested and bound by pp-023 (`11682527`). Verified at HEAD:
`obligations/index.js` holds all 18 commodity obligations; `features/commodities/evaluation.js` exports
ONE merged 16-binding bundle; `features/evaluation.js` registers exactly that bundle.

**Do not touch `obligations/index.js` or either `evaluation.js`** — the plan's `filesToTouch` correctly
omits them. **Keep `collects: []`**: `commodity-search` collects `['commodityLines']` and
`ownerOfObligation` (`flow/dispatch.js:33`) walks **up** the ancestor chain, so every measure leaf
already has an owner. Declaring one would throw `Obligation "..." is collected by two pages`. pp-024,
pp-025 and pp-026 all did this correctly.

## 2. What exists now — verify before trusting the plan

- **`features/commodities/page.js` is an edit** already exporting five identities: input-method,
  search, basic-description, variety-of-genus-and-species, commodity-summary. Append yours. The file
  imports NOTHING (recipe hard rule).
- **The three copy files under `features/commodities/copy/` are edits** carrying five page blocks
  already. Namespace yours alongside. **This is where the increment is most likely to go red** — see §4.
- **The `commodities` flow section and task row exist**, after `purpose`, before `transport`, holding
  input-method → search → basic-description → variety-of-genus-and-species → commodity-summary.
  **Append into both. Do not create a second section or row, and do not move the section.**
- **The mapper needed no change in pp-023, pp-024, pp-025 or pp-026.** The plan says the
  `commodityComplement[]` subtree already round-trips. **Verify the nine measure leaves specifically
  appear in `mapper.test.js` and extend ONLY if a leaf is genuinely uncovered** — omission-assertion
  discipline, and report any addition as a plan gap rather than delivering silently.
- **Appending a page shifts redirect targets.** Each of the last three increments moved an existing
  assertion for this reason, and each correctly narrowed it to the new exact path. Expect the same.
  Update such assertions to the **more specific** value; never loosen one to a pattern that passes
  either way.

## 3. ⚠ The two hazards this page shape invites

**(a) Per-line in-place edits address a specific line — prove the addressing.** Writes go through
`state.updateEntryAt` at `['commodityLines', i]`. I proved on pp-026 that a removal hardcoded to index
0 passed **360/360 unit tests and 108 of 109 browser tests**, because the only test that removed
anything removed index 0 and therefore could not discriminate. **Do not repeat that shape here.** Any
test that exercises an edit must edit a line **other than index 0** and assert that the *other* lines
are unchanged, cell by cell. Asserting "the value I typed came back" on a single-line fixture proves
nothing about addressing.

**(b) Bulk-apply is copy-per-line then sum (ruling v16), and it can silently apply to the wrong set.**
Assert which lines received the applied values AND which did not, not just that a total changed. A
total is a lossy assertion — several wrong implementations produce the same number.

**Repeated controls need distinct accessible names.** Now proven necessary twice by mutation (pp-017's
empty legend, pp-024's collapsed Remove labels — the latter left the axe scan reporting **no violation
at all**). Every per-line control must identify which line it acts on: pin each exact accessible name
AND assert the set is distinct. Axe scans remain necessary and not sufficient.

## 4. The copy bundle is the predictable failure

The plan says so explicitly and it is worth heeding: **en/cy parity is the first thing to go red.**
`copy-parity` requires structure-identical bundles — same leaf paths, same value kinds. With nine
fields plus bulk-apply controls plus validation strings, that is a large surface. Build both locales
together rather than en-first, and run the copy tests early rather than at the end.

Copy rulings that apply: **c-018** (one canonical string per rule, in the Enter/Select voice — the
backend's 'Add the …' variants are explicitly rejected), **c-004** ('There is a problem'), **c-014**
(single H1).

## 5. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-026, `40377153`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **360** |
| `npm test` | **1,962 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **110** |
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

**⚠ `lint:arch` should MOVE this time, and that is the point.** It currently reports 4 advisory
`no-orphans` warnings: `document-types`, `gross-volume-units`, `package-types`, `quantity-types`. This
page consumes package types, quantity types and gross-volume units, so **expect the count to FALL** as
those fixtures gain their first consuming page. That drop is structural proof the wiring is real — a
count that cannot move if a fixture were re-declared locally or imported by a copy file. **State the
expected post-increment number and the exact remaining warnings.** If it does not fall, you have not
really consumed them. **NEVER "fix" these warnings by deleting or force-importing.**
`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Every count that moves must be explained, especially downward.**

## 6. Hub and readiness

Two increments changed hub row states as an unplanned consequence (`countryOfOrigin` in pp-018 made
Purpose 'Cannot start yet'; `commoditySelection` in pp-023 did the same to Transport). pp-024, pp-025
and pp-026 each checked and reported no shift. **Do the same: state what the hub renders before and
after, even if unchanged.**

## 7. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the tell was the Playwright count falling 13 → 11. A test that cannot pass is a
  **stop-and-report**, never a deletion. Name the replacement for every rename. Before finishing, run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` over it; use `--staged`.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** pp-026's browser case was called 'exposes
  renumbered indices' and did not detect a removal that always hit the wrong row. Before claiming
  coverage for a behaviour, ask what the test would do if that behaviour were broken.
- **NEVER INVENT DATA.** Every commodity code, EPPO code, species, variety and reference-data option
  comes from the shipped fixtures. pp-025 correctly reported a scenario impossible with the fixture
  rather than fabricating one. Stopping twice carries no penalty; inventing one row does.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so and name the evidence.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. `contract.plant-products.test.js` is the named exception.
- **Stay inside the govuk-frontend toolbox** — macros only, no bespoke CSS, no client JS. The legacy
  page's class corruption and `aria-labelledby` defects are macro-impossible, which is the point.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 8. The increment itself

The deliberate non-ports — 'Update total' button (totals derived fresh; the legacy stale-display
defect), Clear-by-page-reload replaced with a scoped clear action, the '499 lines remaining' cap
counter (`MAX_COMMODITY_LINES` never verified and the plant model declares no cap), etag/If-Match
concurrency (last-write-wins per Open Q 3), the single mega-form with seven submit buttons plus its
'Keyboard submit' hack (one form, three named actions: apply / clear / continue), and the bespoke
'Save and return to hub' / 'Cancel' buttons (standard kit behaviour instead) — are as specified in
`backlog.json`'s `pp-027` entry, each evidence-backed. Follow it there, subject to the corrections
above. Transposition exemplar:
`sets/live-animals/journeys/linear/features/commodities/consignment-details/` (`collects: []`,
per-line in-place edits via `state.updateEntryAt`, the fields/lines/validation/view-model split — note
`remove/` is NOT needed here, Remove lives on commodity-summary from pp-026), with
`contract.test.js:213` as the contract case shape.
