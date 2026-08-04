# pp-032 — contact-details (responsible person)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three of them destructively.

A three-field collecting page with its own obligations, section, task row and hub spoke.

---

## 1. Declares obligations — manifest before registration

Three new obligations in `obligations/sections/contacts.js`, manifest entries, a **distinct** feature
bundle in `features/evaluation.js`, and a page that `collects` all three.

**Order is enforced by two independent guards**, both established by mutation in this build:
`bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own object
by identity, so **manifest exports land BEFORE registration**; `flow/dispatch.js` `assertFullCoverage`
rejects a manifest obligation no page collects. Two bundles under one feature name throws.

**⚠ Obligation NAMES are camelCase, not the kebab display ids in `backlog.json`.** Use
**`responsiblePersonName`**, **`responsiblePersonEmail`**, **`responsiblePersonTelephone`** — they are
answer keys and DOM field names. pp-028 and pp-031 both hit this trap.

**Obligations stay pure data** — no labels, hints or options. `obligation-purity` enforces it at boot.

## 2. The mappers are EDITS holding everything built so far

`to-dto.js` and `from-dto.js` carry the whole projection: origin, purpose, the depth-3 commodity
subtree, additional details, documents, goods movement. **Your diff to both must be a net addition —
check it.** pp-034's plan called `to-dto.js` a `create`; following that literally would have deleted
all of it, and that was the third time this pattern appeared.

## 3. `lint:arch` is 0 errors / 0 warnings — keep it there

pp-034 consumed the last orphaned fixture and the architecture run has been fully clean since. This
increment consumes no reference fixture, so **expect 0/0 unchanged**. A new warning means you created
an orphan; **never "fix" one by deleting or force-importing.**

## 4. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-031, `dc9817de`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **478** |
| `npm test` | **2,093 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **170** |
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

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. **Every count that moves must be explained.**

## 5. Two axe facts you need, so you neither suppress wrongly nor stop wrongly

- **The GOV.UK conditional-radio false positive has established handling** — a narrowly scoped filter
  in six shipped specs (pp-030's `transport-before-bip.e2e.spec.js:132-152`, pp-031's
  `goods-movement.e2e.spec.js`, and five live-animals specs). **Only use it if this page actually
  renders a conditional radio**, and if you do, keep every part of its discipline: rule id exactly
  `aria-allowed-attr`, EVERY node the one `govuk-radios__input` with that exact `aria-controls` target
  and a single-element `target` array, any other node or rule fatal, unfiltered list still printed.
  pp-031 stopped rather than apply this on its own judgement, which was right — but the handling
  exists, so you do not need to stop for it. **Do not widen it to any other finding.**
- **⚠ pp-076 flake, not yours to fix:** axe-core occasionally throws `Cannot read properties of null
  (reading 'documentElement')` in an unchanged commodity axe test — a teardown race, no violation
  reported, seen in 3 of ~12 observed runs. **If you hit it, say so and re-run.** Do not rationalise a
  genuine failure as this flake, and do not quietly re-run and report only the clean pass.

**AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation in this build. Assert computed
accessible names directly alongside the scans.

## 6. Hub spoke

New flow section, task row and hub spoke. Captions are numbered and **deliberately non-contiguous**
(`1.` Origin, `2.` Purpose, `3.` Commodity, `4.` Additional details, `5.` Transport, plus the documents
and goods-movement spokes, and `12.` Review). **Use the canonical spoke number from §2.1 — do not
renumber the others to make the sequence contiguous.**

**State what the hub renders before and after, row by row.** Row states have twice moved by accident
here (pp-018 and pp-023, both via `policy.enforcedAtContinue`).

## 7. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- **NEVER INVENT DATA.** Five increments have stopped rather than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. `co-residency.test.js` pins the plant `sectionIds` array and will need your section.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS.
- **Validation copy is one canonical string per rule in the Enter/Select voice (c-018)**, with the GDS
  'There is a problem' summary and the visually-hidden 'Error:' prefix (c-004 / c-014). Email and
  telephone rules each get exactly one message, not a layered set.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

## 8. The increment itself

Follow `backlog.json`'s `pp-032` entry for the field rules and copy. Exemplar for a small multi-field
collecting page: `sets/plant-products/journeys/linear/features/additional-details/` (pp-028 — three
fields, one of them gated, per-rule validation, axe and accessible-name assertions).
