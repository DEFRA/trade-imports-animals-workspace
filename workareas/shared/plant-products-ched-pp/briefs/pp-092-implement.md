# pp-092 — re-base the tests repo's duplicated commodity constants on the corrected data

This brief OVERRIDES the generic `implement.md`. **The `-tests` repo — a SEPARATE git repo** with its
own remote, branch, CI and `package.json`. Rollback is `git stash push -u`, never `reset --hard`.

**This is a REGRESSION I INTRODUCED TODAY**, not a pre-existing gap. pp-078 and pp-086 changed the
commodity variety/class model in the frontend; the tests repo carries its **own hand-maintained
duplicate** of that data, and nothing keeps the two in agreement.

## The evidence — I ran this myself, do not re-derive it before starting

Against the rebuilt stack: **28 passed, 3 failed.** The failure is
`locator.selectOption ... did not find some options` — the spec selects variety `'NONE'` and the
frontend now offers `C5E27C5A-D13B-E9F5-B4B0-7234A7941208`.

Failing:
- `tests/e2e/pages/plant-products/varieties.spec.ts:29` and `:46`
- `tests/e2e/features/plant-products/commodity-depth-3.spec.ts:104`

**The other 28 pass, which also proves the stack is serving this session's frontend.**

## ⚠ THE STACK IS ALREADY UP AND HEALTHY. Do not rebuild it

The integration lane targets a **dedicated real-mode frontend on `:3100`**, behind the **opt-in
`test-target` profile** that `tim docker dev` does **not** start. It is running now, built from local
source. **Prove you are hitting the rebuilt app** — name a page you loaded and a value that could only
come from the corrected fixture (e.g. the Royal Gala variety, which did not exist before today).

If you find it down, the incantation is `scripts/stack/run-stack.sh -d` with **all seven** profiles
named (`--profile` REPLACES the default set): `database infrastructure servicebus stubs backend
frontend test-target`. Its compose entry pulls a **published image tag** — only `-d` rebuilds it from
local source, so without `-d` you would silently test Dockerhub's `:latest`.

## What the frontend now holds — copy from it, invent nothing

`src/server/app/sets/plant-products/services/commodities/fixture.js` at frontend `8c309b57`:

- `VARIETIES_BY_COMMODITY` — keyed by **commodity, then EPPO**:
  - `'08059000'` → `CIDAC` → one variety, id **`C5E27C5A-D13B-E9F5-B4B0-7234A7941208`**, label `None`
  - `'0808108090'` → `MABSD` → **three**: McIntosh Red `03107EFA-9BCD-1089-565E-B28F73994DEC`,
    Spartan `035ECF9F-7B6C-078D-60D5-D2947C23A366`, Royal Gala `0C245190-A316-5B88-F38E-360FBBFB208F`
- `CLASSES_BY_COMMODITY` — keyed by **commodity alone**: `'0808108090'` → `CLASS_I`, `CLASS_II`,
  `EXTRA_CLASS`. **CIDAC has no classes at all.**
- `SPECIES_BY_CODE['0808108010']` → **MABAN, MABSD, MABZU** in that order (pp-077, pinned by pp-084)
- `SPECIES_BY_CODE['0808108090']` → MABSD, `1391442`

**Read the file yourself and copy from it. Every value must be traceable there. If something you need
is missing, STOP and report `ok:false`** — nine increments have refused to fabricate and every one was
right.

## ⚠ HAZARD 1 — MIRROR THE FRONTEND'S SHAPE, DO NOT INVENT A THIRD

The frontend now keys **varieties by commodity+EPPO** and **classes by commodity**, because the IPAFFS
source does: `commodity_class.csv` has no `eppo_code` column at all. The tests repo currently keys both
by EPPO. **Re-key it the same way.** A third shape means three things to keep in sync instead of two.

`eppo-species.ts` has drifted **further back than pp-086** — it lacks `0808108090` entirely and shows
only MABSD under `0808108010`, missing the MABAN and MABZU **pp-077** added. **Check every entry in all
three constants files against the fixture, not just the ones I named.** I have not audited the others.

## ⚠ HAZARD 2 — ONE PREMISE INVERTS. Do not "fix" it by making the test pass

`varieties.spec.ts` ~`:81` is titled *'MABSD has real varieties but no classes, so the UI correctly
creates no variety entry instead of fabricating a class'*. **That is now wrong twice over:**

- **pp-078** made varieties-without-classes a **reachable, persistable** state. The page renders **no
  class control at all** and the entry saves with the class absent. The UI no longer refuses.
- **pp-086** moved MABSD's varieties to `0808108090`, where classes **do** exist.

So the roles swap: **CIDAC under `08059000` is now the no-class case; MABSD under `0808108090` is the
with-class case.** Rewrite the test to assert pp-078's actual behaviour — no class control renders, and
the entry persists without a class. **Do not delete it**; that behaviour is the point of pp-078.

## ⚠ HAZARD 3 — THE DEPTH-3 MIDDLE-REMOVAL PROPERTY MUST SURVIVE, AND CAN GET STRONGER

`commodity-depth-3.spec.ts:15-16` builds three variety rows as `varietyClasses.CIDAC.map(...)` over
`varieties.CIDAC[0]` — **one variety × three classes** — and `:123` says *"CIDAC has one real variety
ID and three real classes, so index 1 is a genuine middle removal."* pp-086 removed those classes, so
that construction is gone.

**Rebuild it on MABSD under `0808108090`: three REAL varieties, and three classes.** That is strictly
better — the rows now differ by **variety identity**, not merely by class, so a middle removal is
discriminated on the field that actually identifies the row.

**The middle-removal property is load-bearing and must be PROVED, not asserted.** pp-026 shipped a bug
that always removed index 0 and passed 360 unit tests and 108 of 109 browser tests. **Remove the middle
entry and show the spec fails by name. Report that name.**

## ⚠ HAZARD 4 — A NEW AMBIGUITY: TWO COMMODITIES NOW DISPLAY 'Other'

`0808108090`'s description is **`'Other'`** — the same display string as `08059000`. Any locator that
picks a commodity by description alone now resolves **two** nodes. **Check every commodity locator in
the plant specs and page objects**, not just the ones you edit. This is the pp-024/pp-079 class: a
locator that reads as specific but is not.

## Constraints

- **No plant page object may import from `page-objects/live-animals/`.** Standing rule.
- **Do not touch the frontend repo.** If you believe a frontend change is needed, `ok:false` with
  evidence.
- **The live-animals suite must be unchanged** in count and result in the same run — it shares the
  stack.
- Any test count that moves must be explained:
  `git diff -U0` then `grep -cE "^- *(it|test|describe)\("`.
- `npm run typecheck`, `npm run lint`, `npm run format:check` all green.
- **Do not commit** — the orchestrator lands it.

## The decisive mutations I expect, reported by failing test NAME

1. Remove the **middle** variety from the depth-3 case → must fail by name.
2. Revert one constant to its stale value (e.g. CIDAC's id back to `'NONE'`) → the varieties spec must
   fail, proving the specs genuinely consume these constants rather than duplicating literals inline.

**Say what changed before believing any green run.** On this build an inert mutation has falsely
*confirmed* a finding, and a malformed one has falsely *refuted* — both within the last two increments.
