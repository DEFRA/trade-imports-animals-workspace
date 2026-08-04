# pp-036 — consignor-create (+ confirmation), hand-entered consignor

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

Nine obligations. **pp-035 deliberately deferred the consignor to you** — its enforcement becomes
manifest mandatoriness rolling into the traders row, not a controller rule.

---

## 1. Obligations — manifest before registration, camelCase names

Two independent guards enforce the order, both established by mutation in this build:
`bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own object
by identity, so **manifest exports land BEFORE registration**; `flow/dispatch.js` `assertFullCoverage`
rejects a manifest obligation no page collects. Two bundles under one feature name throws.

**⚠ Obligation NAMES are camelCase, not the kebab display ids in `backlog.json`.** pp-028, pp-031,
pp-032 and pp-035 all met this trap. **Obligations stay pure data** — `obligation-purity` enforces it
at boot.

**Every gated leaf passes its gate obligation BY OBJECT IDENTITY and PURGES on leaving scope.** I have
proved that class of gate load-bearing in pp-028, pp-031 and pp-035 — prove each of yours the same way
and report the named failure.

## 2. pp-035 handed you the mandatoriness, not a controller rule

The consignor's *'Add a consignor or exporter'* enforcement is **manifest mandatoriness that rolls
into the traders row** — not a check inside this page's POST. Read `obligations/sections/parties.js`
and `flow/task-rows.js` as pp-035 left them before adding anything, and make the traders row reflect
consignor completeness.

**Pin the row from both sides**: incomplete without a consignor, complete with one. And **state what
the hub renders before and after, row by row** — row states have twice moved by accident in this build
(pp-018 and pp-023, both via `policy.enforcedAtContinue`).

## 3. The confirmation step is where this shape usually goes wrong

A create-then-confirm flow has two failure modes worth explicit tests:

- **Confirming must persist exactly what was entered** — not a re-read that silently drops a field.
  Assert the persisted DTO, not just the rendered confirmation.
- **Abandoning or going back must not leave a half-written consignor.** Prove nothing is persisted
  until confirmation, if that is the specified behaviour; if the plan says otherwise, follow the plan
  and say so.

## 4. The mappers are EDITS holding everything built so far

`to-dto.js` and `from-dto.js` carry origin, purpose, the depth-3 commodity subtree, additional details,
documents, goods movement, responsible person and parties. **Your diff to both must be a net addition —
check it**, and add a named section helper to the frozen `SECTION_MAPPERS` list rather than inline
logic, as pp-032 and pp-035 did. Five increments have passed this check since pp-034's plan called
`to-dto.js` a `create`.

**Note pp-035 added `mapParties`** — the consignor may belong inside it rather than in a new helper.
Check before adding a parallel one.

## 5. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-035, `f24d9a15`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **527** |
| `npm test` | **2,150 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **196** |
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
reported. **If you hit it, say so and re-run.** pp-034 and pp-035 both handled it correctly.

**On the conditional-radio axe false positive:** established narrow handling exists in six shipped
specs. **Only apply it if this page renders a conditional radio**, and keep every part of its
discipline. pp-032 correctly used none because it had none.

## 6. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation. Assert computed accessible names
  directly; repeated per-party controls must name which party they act on.
- **NEVER INVENT DATA.** Country codes come from pp-013's `countries.js` as shipped. Six increments
  have stopped rather than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. If an assertion's expected value changes because behaviour genuinely changed, keep it
  an exact equality — pp-035 did this correctly when POP-1 made `to-dto` always emit an importer.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS. Validation copy is one
  canonical string per rule in the Enter/Select voice (c-018), GDS 'There is a problem' summary,
  visually-hidden 'Error:' prefix (c-004 / c-014).
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
