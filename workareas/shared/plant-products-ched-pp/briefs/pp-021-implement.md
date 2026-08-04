# pp-021 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-021** — "Commodity collection model extension — depth-3 obligations".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Full spec in `backlog.json` under this id — the obligation inventory, the staging decision, the
rulings, the four open questions. Read it there; it is the contract.

---

## 1. THIS INCREMENT CARRIES A HALT-FOR-REVIEW GATE

**Build the model, land nothing beyond it, and STOP.** No commodity page, no flow section, no task
row, no hub spoke, no copy. The gate exists so Sam reviews the depth-3 model before any m3 commodity
page is built on top of it — and a page built now would have to be unpicked if the model changes.

Your report is the evidence package. Make it good: state what the model expresses, what the
characterisation suite proves, and specifically **what it would fail to catch**.

## 2. THE STAGING DECISION IS THE RISKIEST THING HERE — prove it, don't trust it

The plan deliberately leaves the **live manifest untouched**: the section files, binding bundle and
mapper land and are proven through a **set-as-fixture** suite, but `obligations/index.js` and
`features/evaluation.js` are NOT wired. The stated reason is that `flow/dispatch.js`
`assertFullCoverage` throws `Obligations collected by no page` for any manifest obligation without an
owning page, and the first owner of `commodityLines` is pp-023's commodity-search — so wiring now
would leave the set **unbootable between increments**.

**Verify that claim by mutation rather than accepting it.** Wire one commodity obligation into the
live manifest, boot, and confirm it throws with that message; then revert byte-identically and
confirm green. If it does **not** throw, the staging decision is unnecessary and you should say so —
that would be a genuine finding, and more useful than compliance.

This matters because a plan's confident claim about the incumbent implementation has been **wrong
eleven times in this build** — including pp-010, where a load-bearing claim about how set context
resolves was simply false and had already propagated into the recipe.

## 3. Obligation purity — the model must contain no display logic

No copy, labels, options, hints, route names, or IO at module load, in any section file. This is
enforced (`obligation-purity`) and it is load-bearing: copy belongs in `.njk` and copy bundles,
options come from the real reference data. The `varietyClass` allowlist must resolve **lazily at
gate execution** from the pp-014 commodities service — not at module load, which would both break
purity and capture state before set context exists (the pp-058 tripwire's concern).

`within` references must be **object identity**, not string names: `species.within === commodityLines`
const, `varieties.within === species` const, each leaf's `within` its group const. If you can pass a
string and have it work, the model is weaker than it looks — check.

## 4. The two negative tests are the point of the suite

The acceptance criteria require both, and they are what make this more than a shape assertion:

- **a depth-mismatch binding is rejected** — a `grouped()` binding whose chain length does not equal
  its within-chain depth (1 for line leaves, 2 for species, 3 for varieties);
- **an out-of-range parent index is refused.**

Note the second is close to a defect pp-012 pinned: an out-of-range parent index at either ancestor
level **persisted a sparse fulfilment map before `projectAnswers` threw**. pp-070 fixed the depth-N
engine defects and pp-012's `it.fails` cases became plain green tests. **Make sure this suite
exercises the real fixed behaviour** rather than re-asserting the shape — and if you find any of
pp-012's four defects still live, stop and report it, because pp-070 claimed them fixed.

## 5. Mapper round-trip — the details that rot silently

Per SCHEMA-DESIGN §1.1: `commoditySelection ⇄ commodityCode`, `commodityDescription`
**derived-not-stored**, `uniqueComplementId` passthrough (server-assigned; absent for new lines —
pp-025 relies on this), varieties nesting preserved, **transient `add-species-<id>` keys asserted
ABSENT**, and empty lines → empty `commodityComplement` array.

That transient-key assertion is an absence proof: make sure it would fail if such a key leaked
through, rather than passing because nothing looked.

## 6. Two-sided safety and the count rule

BOTH sets must still serve from the same process: `co-residency.test.js` green and
`test:features:all` green (both Playwright projects, one server). **No existing suite's test count
may drop.** No test may be deleted or renamed without being reported — if a count moves, name every
change. This has caught a real regression once already (pp-017 silently dropped three browser tests).

## 7. Hygiene

- Baseline first: `npm run test:plant-products`, expect **198**. Red baseline = stop and report.
- `lint:arch` is **0 errors / 6 warnings**. This increment consumes the pp-014 commodities service;
  report whether the count changes and do not "fix" the warnings.
- Baseline SHA-1 stays `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
- `filesToTouch` is a hypothesis; open the real files first and report anything already delivered,
  missing or extra. **Never invent data** — the varietyClass values come from the pp-014 fixture; if
  something is genuinely absent, stop at `ok:false` and say where you looked.

## 8. Verification ladder

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, expect 198
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:all
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**: plant units, full `npm test`, `test:live-animals`, `test:features:all`, lint:arch
errors/warnings. Baseline: plant units **198**, `npm test` **1,787 passed / 8 skipped**,
`test:live-animals` **559** (must stay 559), `test:features:all` **275 + the plant additions since**,
lint:arch **0 / 6**.
