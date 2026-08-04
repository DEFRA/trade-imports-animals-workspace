# pp-033 — nominated-contact (repeating optional contacts)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

Five obligations. A **repeating collection of OPTIONAL contacts** — the combination is what makes this
one distinctive.

---

## 1. Optional AND repeating — the interaction is the risk

Most collections in this set have a `minEntries` floor (documents, commodity lines). This one does
not: zero nominated contacts must be a **valid, complete** state.

**Pin that explicitly from both sides**: the row completes with zero contacts, and still completes with
several. A collection whose floor is accidentally 1 looks correct until someone submits without one —
and pp-034's floor mutation showed how precisely those tests bite when they exist.

**And prove the repeat actually repeats**: add two contacts and assert both persist with their own
values, not one overwriting the other.

## 2. ⚠ Removal must target the right entry — the recurring blind spot

If this page offers Remove per contact, **remove a MIDDLE entry, not the last**, and assert **which
entries survive and in what order** — not counts.

This is the single most repeated defect class in this build. I proved on pp-026 that a removal
hardcoded to index 0 passed **360 unit tests and 108 of 109 browser tests**, because the only test that
removed anything removed index 0. pp-034 and pp-063 both carry tests named for this fix. Positional
renumbering means a control rendered from a stale index acts on the wrong row.

**Every repeated control's accessible name must identify which contact it acts on** — pin each exact
name AND assert the set is distinct. I proved on pp-024 that collapsing those names left axe reporting
**no violation at all** while the explicit assertion caught it immediately.

## 3. Obligations — manifest before registration, camelCase names

Two guards enforce the order: `bridge/fulfilment-registry.js:31` (obligation identity against the
manifest) and `flow/dispatch.js` `assertFullCoverage`. Two bundles under one feature name throws.
**Names are camelCase, not the kebab display ids** — pp-028, pp-031, pp-032, pp-035 and pp-036 all met
that trap. Obligations stay pure data.

Gated leaves pass their gate **by object identity** and **purge on leaving scope** — proved
load-bearing in pp-028, pp-031, pp-035 and pp-036.

## 4. The mappers are EDITS holding everything built so far

`to-dto.js` and `from-dto.js` carry every section built to date. **Your diff to both must be a net
addition — check it.** Six increments have passed this check since pp-034's plan called `to-dto.js` a
`create`. Add a **named section helper** to the frozen `SECTION_MAPPERS` list, or extend an existing
one where the data genuinely belongs there — pp-036 correctly extended pp-035's `mapParties` rather
than adding a parallel helper. Check before adding.

## 5. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-036, `36e86881`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **558** |
| `npm test` | **2,182 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **221** |
| `lint:arch` | **0 errors / 0 warnings** |

Full ladder:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**Expect `lint:arch` 0/0 unchanged.** `shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. **Every count that moves must be explained.**

**⚠ pp-076 flake, not yours to fix:** axe-core occasionally throws `Cannot read properties of null
(reading 'documentElement')` in an unchanged commodity axe test — a teardown race, no violation
reported. **If you hit it, say so and re-run.**

## 6. Hub

New flow section, task row and hub spoke — captions are numbered and **deliberately non-contiguous**;
use the canonical number and do not renumber the others. **State what the hub renders before and after,
row by row.** An optional row that reads 'Cannot start yet' or blocks readiness would be a defect worth
catching here.

## 7. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing; the count must
  match the renames you report, as pp-036's five did.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation.
- **NEVER INVENT DATA.** Six increments have stopped rather than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. Keep exact equalities exact.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS. Validation copy is one
  canonical string per rule in the Enter/Select voice (c-018), GDS 'There is a problem' summary,
  visually-hidden 'Error:' prefix (c-004 / c-014).
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
