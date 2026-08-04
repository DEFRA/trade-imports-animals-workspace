# pp-028 — commodity-additional-details (consignment totals) — CLOSES m3

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far, twice destructively.

---

## 1. ⚠ THIS INCREMENT DECLARES OBLIGATIONS. The last four did not — do not carry their rule over.

pp-024, pp-025, pp-026 and pp-027 all kept `collects: []` and touched no obligation or binding file,
because every commodity obligation was already owned by `commodity-search` through its
`commodityLines` claim. **That does not apply here.** This is a NEW feature with THREE genuinely new
scalar obligations of its own:

- **`totalGrossWeight`** — `status: 'mandatory'`, plain scalar, no gate helper.
- **`grossVolume`** — `status: 'optional'` (matches the rendered '(optional)' label).
- **`grossVolumeUnit`** — `applyTo: presentGate(grossVolume, …)`, the L2 helper at
  `model/obligations/helpers/index.js:83`. In scope, and therefore required, **iff `grossVolume` is
  answered**; leaving scope **wipes** the stored unit. Pass the `grossVolume` obligation **object by
  identity** from the same section file, never a string.

So you MUST:

1. Create `obligations/sections/additional-details.js` with the three obligations.
2. Add them to `obligations/index.js` — import, re-export, and append to the `obligations` array.
3. Create `features/additional-details/evaluation.js` exporting a `feature('additional-details', [...])`
   bundle of three `scalar(...)` bindings, and register it in `features/evaluation.js`.
4. Your page's `meta.collects` names all three.

**Order matters and it is enforced by two independent guards** — established by mutation in pp-023 and
recorded because getting it wrong is a hard boot failure, not a test failure:

- `bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own
  object by identity — so **manifest exports must land BEFORE binding registration**.
- `flow/dispatch.js` `assertFullCoverage` rejects any manifest obligation no page collects — so an
  obligation added to the manifest without your page collecting it will not boot.

**Feature names must be unique.** `feature('commodities', ...)` registered twice throws
`feature name "commodities" is registered twice`. Use a distinct name for this bundle.

**⚠ OBLIGATION NAMES ARE camelCase, NOT the kebab ids in `backlog.json`.** The backlog lists them as
`total-gross-weight`, `gross-volume`, `gross-volume-unit`. Those are display ids in the plan document.
The backlog's own convention note is explicit: obligation names are path-safe camelCase because they
are answer keys and DOM field names. Use **`totalGrossWeight`**, **`grossVolume`**,
**`grossVolumeUnit`**. Kebab belongs to page slugs, a different namespace.

**Obligations stay pure data** — no labels, no hints, no options. `obligation-purity` enforces it at
boot.

## 2. A NEW section, task row and hub spoke — check the numbering

This is not an append to the commodities group; it is its own feature directory, flow section, task
row and hub spoke.

- **`flow/flow.js`** sections currently run: `start`, `origin`, `purpose`, `commodities`, `transport`,
  `review`. This is **spoke 4**, so it goes **after `commodities` and before `transport`**. Add a flow
  test pinning that relative order, as pp-022 did.
- **`flow/task-rows.js`** — same position, between `commodities` and `transport`.
- **`features/hub/controller.js`** `GROUPS` currently: `origin`, `purpose`, `commodities`, `transport`.
  Insert between `commodities` and `transport`.
- **⚠ Hub group captions are NUMBERED.** `features/hub/copy/copy.en.js` currently holds
  `'1. Origin of the import'`, `'2. Purpose'`, `'3. Commodity'`, `'5. Transport to the BCP'`. Yours is
  the missing **`4.`**. Match the convention exactly and mirror it in `copy.cy.js`. (pp-022's plan
  omitted the number and I had to correct it — do not repeat that.)

## 3. ⚠ `lint:arch` MUST FALL from 2 to 1, and that is the wiring proof

It currently reports 2 advisory `no-orphans` warnings: `document-types` and `gross-volume-units`. This
page is the **first consumer of `gross-volume-units.js`** (pp-016's fixture — the unit is persisted by
CODE, not the legacy hardcoded display string 'metres cubed'). So **expect 2 → 1, leaving only
`document-types`**, which clears with pp-034.

That drop is structural proof the wiring is real — a count that cannot move if the fixture were
re-declared locally or imported by a copy file. **State the expected number and the exact remaining
warning.** If it does not fall, you have not really consumed the fixture. **NEVER "fix" these warnings
by deleting or force-importing.**

pp-027 corrected my prediction here and was right to — if you believe my expected number is wrong, say
so with evidence rather than making the count match.

## 4. The cross-field rule and the two-directional gate

- **Gross must exceed net.** One canonical wording, taken from the legacy frontend string:
  *'Total gross weight must be greater than the net weight'*. The backend variant ('is less than') is
  discarded. Net weight is **derived** from the `commodityLines` answers at render — never stored,
  never sent.
- **Volume/unit pairing is validated in BOTH directions.** `presentGate` gives you
  unit-required-iff-volume in the model. The reverse — a unit posted with no volume — is a controller
  fieldset rule per the house D-13 precedent. **Both directions must be validated in POST so no user
  input is silently dropped.** Prove the wipe too: answering volume then clearing it must remove the
  stored unit, not orphan it.
- Rollups (net weight, packages) are derived at render and never persisted.
- The 5-decimal-places rule goes on the **visible** field with an anchorable message — the legacy
  phantom-field a11y defect is deliberately not ported.

## 5. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-027, `3714ebbc`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **397** |
| `npm test` | **2,000 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **128** |
| `lint:arch` | **0 errors / 2 warnings** |

Full ladder after the change:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

Docker occupies 3000 and 3100; pp-027 used **3201** successfully. `shasum
.dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Every count that moves must be explained, especially downward.**

## 6. Hub and readiness — this one WILL move things

`totalGrossWeight` is mandatory, so a new mandatory row joins `readyForCheckYourAnswers`. Two earlier
increments changed hub row states as unplanned consequences (`countryOfOrigin` in pp-018 made Purpose
'Cannot start yet'; `commoditySelection` in pp-023 did the same to Transport). **State exactly what the
hub renders before and after, and pin the new row from BOTH sides** — Not yet started with no answer,
Completed once answered, and blocking readiness until complete.

## 7. Standing rules that have each caught a real defect

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT.** pp-017 silently deleted three browser specs and
  reported `ok:true`; the tell was the Playwright count falling 13 → 11. A test that cannot pass is a
  **stop-and-report**, never a deletion. Name the replacement for every rename.
  Run `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing; use `--staged`.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** pp-026's browser case was called 'exposes
  renumbered indices' and did not detect a removal that always hit the wrong row, because it only ever
  removed index 0. Ask what each test would do if the behaviour were broken.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation (pp-017's empty legend, pp-024's
  collapsed control names, where axe reported **no violation at all**). Assert computed accessible
  names directly alongside the axe scans.
- **NEVER INVENT DATA.** Units come from pp-016's `gross-volume-units.js` as shipped. If something is
  not derivable from a real source, stop and say so — pp-014, pp-025 and pp-027 each did, and each was
  right.
- **NAME THINGS FOR WHAT THEY DO.** pp-027 shipped a flag named for a different field than the one it
  gated and I sent it back. A faithful-to-legacy name that is wrong is still wrong.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `routes-plant-products.test.js`,
  `co-residency.test.js`, `contract.plant-products.test.js`): update expected values, **never weaken a
  pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger form, report
  before/after.** `co-residency.test.js` pins the plant `sectionIds` array — it will need your new
  section.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit. `contract.plant-products.test.js` is the named exception.
- **Stay inside the govuk-frontend toolbox** — `govukSummaryList` without actions replaces the legacy
  presentation table; no bespoke CSS, no client JS.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.

## 8. The increment itself

The twelve decisions — gross weight resolved as model-mandatory with the GDS 'Enter the total gross
weight' wording, the single canonical gross-greater-than-net string, the decimal rule moved onto the
visible field, unit persisted by code, `govukSummaryList` over the legacy table, derived rollups never
stored, the collapsed three-way exit with no GMS interstitial (goods-movement is pp-031's own spoke),
CHED-P/D/A-only controls omitted, check-answers rows deferred to pp-038, `intendedForFinalUsers` owned
by pp-027 and **NOT** collected here, and no etag equivalent — are as specified in `backlog.json`'s
`pp-028` entry. Follow it there, subject to the corrections above. Exemplars: the live-animals
`import-reason` feature for the smallest complete collecting-page shape, the plant `transport` section
for section + task row + hub GROUPS wiring, and the plant `origin` e2e specs for the per-rule
validation and axe pattern.
