# pp-016 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-016** — "Commodity measures + document types reference data (fixture modules)".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Six pure data modules under
`src/server/app/sets/plant-products/services/reference/` plus one Vitest suite. The full spec —
paths, option lists, counts, acceptance criteria, verification ladder — is in `backlog.json`
under this id. Read it there; it is the contract.

---

## 1. TREAT `filesToTouch` AS A HYPOTHESIS — this is the whole risk of this increment

The option lists in the plan were **transcribed by a planner** from trace page specs. Five times
this session a plan's factual claim about real code or real data has turned out to be wrong
(pp-006, pp-010, pp-009, pp-055, pp-014). **Do not type what the plan says. Verify each list
against the real source first, then write what the source says.**

The real sources, all present locally:

| Module | Verify against |
|---|---|
| `package-types.js` | `workareas/trace-requirements/ched-pp/pages/commodity-bulk-details.json` |
| `quantity-types.js` | same file (and the QA repo's quantity-type vocabulary if you can find it) |
| `document-types.js` | `workareas/trace-requirements/ched-pp/pages/accompanying-documents.json` |
| `transport-options.js` | `repos/trade-imports-animals-backend/src/main/java/uk/gov/defra/trade/imports/plantproducts/notification/PlantProductsMeansOfTransport.java` — the enum constants are the codes, **byte-for-byte**. Labels from `pages/transport-before-bip.json`. |
| `gross-volume-units.js` | the backend `GrossVolumeUnit` enum (same package — locate it) for codes; `pages/commodity-additional-details.json` for labels |
| `purposes.js` | the backend `ReasonForImport` enum for codes; `pages/about-the-consignment.json` for labels |

For each list, check **count, order, and every label**. If the source disagrees with the plan on
any of them — a missing option, an extra one, a different count, a different order, a different
label string — **follow the SOURCE, and say so explicitly in your report**, naming the file and
what differed. A divergence you find and report is a good outcome, not a failure.

Where the plan states a deliberate *normalisation* (GDS sentence case, the c-016 sea-waybill
dedupe, c-006 rejecting IPAFFS wire values in favour of backend enum codes), that is a **ruling**,
not a transcription — apply it, and keep the source's own spelling of everything else, including
the `(Directive 2008/61/EC)` suffix and any proper noun.

## 2. NEVER INVENT DATA — stopping is free, inventing is not

If an option, code or label cannot be corroborated in a real source, **do not mint it to round the
list out**. Stop at `ok:false` and report what you could not find and where you looked. On pp-014
an implementor stopped rather than invent an EPPO association and was right — the plan had named
the wrong commodity. An invented identifier typechecks, renders, drives a whole journey, and then
fails a downstream gate looking like a service bug. A missing one fails loudly and immediately.
**Stopping twice carries no penalty. Inventing one row does.**

The one exception the plan already rules: the SCREAMING_SNAKE codes for `packageType`,
`quantityType` and `documentType` are **minted from the labels** by decision (a) in the increment
notes, because backend-side they are opaque `String` codes with no observable master list. Minting
those is expected; minting an *option* is not.

## 3. REPORT UNDER-DELIVERY PLAINLY

If you deliver fewer files, fewer options or fewer test cases than the plan lists — for any reason,
including that something already exists or turns out unnecessary — **say so in the report, with the
reason**. pp-009 silently delivered five fewer files and reported `ok:true`; silent under-delivery
is as dangerous as silent scope creep.

Note one thing that already exists: `reference/` already holds `countries.js` + `countries.test.js`
and `bcps.js` + `bcps.test.js`, which use a **one-test-file-per-module** convention. This increment
specifies a single `reference-data.test.js` covering all six. Follow the increment, but if you
think the local convention argues otherwise, say so in the report rather than changing it.

## 4. MUTATION-PROVE the load-bearing assertions

For every pin that is doing real work, ask: **what would this test do if the data were wrong?**
Construct the violation, watch it fail, revert it byte-identically. At minimum do this for:

- **the c-016 sea-waybill dedupe pin** — add a second `{ value: 'SEA_WAYBILL_CAPITAL_W', text: 'Sea Waybill' }`
  entry and confirm the suite goes red with a message that names the problem; then remove it;
- **the "stored by code, never display string" pin** — change one value to its own text
  (e.g. `value: 'Bag'`) and confirm the regex/inequality assertion rejects it; then revert;
- **one backend-enum pin** — reorder or rename one `meansOfTransport` code and confirm the
  deep-equal fails; then revert.

Report the exact failure message each mutation produced. If a mutation does **not** turn the suite
red, the test is decorative — fix the test, and report that you found it insensitive. A test can
also be insensitive because of how it *sets up*, not only what it asserts (pp-073's lesson).

## 5. Scope and hygiene

- **No file outside `src/server/app/sets/plant-products/` may change.** If you believe a change
  outside that tree is forced, stop at `ok:false` and make the argument with evidence — do not make
  it. (pp-007 was allowed a forced breach, but only after proving it with a mutation.)
- Pure data + lookup functions: **no IO at module load**, no imports from outside the set, no L2
  service imports, no `routes-*.js` imports. dep-cruiser `sets-not-l1` must stay clean.
- Do **not** regenerate `.dependency-cruiser-known-violations.json`. Its shasum must stay
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `lint:arch` currently emits **two expected advisory orphan warnings** (`countries.js`, `bcps.js`)
  because no page consumes those fixtures yet — 0 errors, still green. Your six new modules will
  add more of the same. **That is expected. Do NOT "fix" it** by deleting, force-importing or
  adding exemptions. Report the new count.
- Run the **baseline first** (`npm run test:plant-products`) before editing. A red baseline means
  stop and report.
- Run `npm run format` before you finish — the pre-commit hook runs `format:check && lint && test`.
- **Do not commit.** The orchestrator lands the work.

## 6. Verification ladder (all from the increment)

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, before editing
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**, not "green": the plant-products unit count, the full `npm test` count, the
features count, and the `lint:arch` error/warning counts. Current baseline for comparison:
`test:plant-products` **134**, `npm test` **1,713 passed / 8 skipped**, `test:live-animals` **559**
(must be unchanged — live-animals is provably unaffected by set-only work), `test:features:all` 275.
