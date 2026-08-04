# pp-031 — goods-movement-services (CTC / MRN / GVMS)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, and three of those would have
destroyed shipped work.

---

## 1. This increment DECLARES obligations — manifest before registration

Three new obligations in `obligations/sections/goods-movement.js`, plus manifest entries, a **distinct**
feature bundle registered in `features/evaluation.js`, and a page that `collects` them.

**Order is enforced by two independent guards**, both established by mutation in this build:
`bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own object
by identity, so **manifest exports land BEFORE registration**; `flow/dispatch.js` `assertFullCoverage`
rejects a manifest obligation no page collects. Registering two bundles under one feature name throws
`feature name "..." is registered twice`.

**⚠ Obligation NAMES are camelCase, not the kebab display ids in `backlog.json`.** Use
**`commonTransitConvention`**, **`movementReferenceNumber`**, **`usingGvms`**. They are answer keys and
DOM field names; kebab is the page-slug namespace. pp-028 had the same trap.

**`movementReferenceNumber` is conditional on `commonTransitConvention = ADD_MRN_NOW`.** Model that
gate with the L2 helper by **object identity**, never a string, and prove the wipe: switching away from
`ADD_MRN_NOW` must purge a stored MRN rather than orphan it. pp-028's equivalent gate was pinned by
exactly one test and I confirmed it bites — do the same here.

## 2. `to-dto.js` and `from-dto.js` are EDITS holding everything built so far

The plan marks them `edit` and that is correct — but note that pp-034's plan marked `to-dto.js`
`create` when it holds the entire DTO projection (origin, purpose, the depth-3 commodity subtree,
additional details, documents). **Your diff to both mappers must be a net addition.** Check it.

## 3. `lint:arch` is now 0 errors / 0 WARNINGS — keep it there

pp-034 consumed the last orphaned fixture. The architecture run is fully clean for the first time in
this build. **This increment consumes no reference fixture, so expect 0/0 unchanged.** A new warning
means you created an orphan; **never "fix" one by deleting or force-importing.**

## 4. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-034, `339e39b8`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **460** |
| `npm test` | **2,071 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **158** |
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

**⚠ Known intermittent flake, raised as pp-076, not yours to fix:** axe-core occasionally throws
`Cannot read properties of null (reading 'documentElement')` in an unchanged commodity axe test — a
teardown race with no violation reported, seen in 3 of 8 observed runs. **If you hit it, say so and
re-run.** pp-034 handled it exactly right: reported it, re-ran, said so. Do not rationalise a genuine
failure as this flake, and do not quietly re-run and report only the clean pass.

## 5. Hub spoke and its number

New flow section, task row and hub spoke. Current captions: `1.` Origin, `2.` Purpose, `3.` Commodity,
`4.` Additional details, `5.` Transport, plus the documents spoke pp-034 added, and `12.` Review. **Use
the canonical spoke number from §2.1 — do not renumber the others to make the sequence contiguous.**
The gaps are deliberate scaffolding.

**State what the hub renders before and after, row by row.** Row states have twice moved by accident
here (pp-018 and pp-023, both via `policy.enforcedAtContinue`).

## 6. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation in this build. Assert computed
  accessible names directly alongside the axe scans.
- **NEVER INVENT DATA.** Five increments have stopped rather than fabricate; each was right. If a
  scenario is not expressible with shipped fixtures, say so.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence. pp-029
  did this well.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. `co-residency.test.js` pins the plant `sectionIds` array and will need your section.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

## 7. The increment itself

The CTC / MRN / GVMS decisions are as specified in `backlog.json`'s `pp-031` entry — follow them there,
subject to the corrections above. Exemplar for a small conditional collecting page:
`sets/plant-products/journeys/linear/features/purpose/` (single radio group, normalised enum,
`requiredOneOf`, 400-with-raw-values re-render, single Joi-voice error string) and
`features/additional-details/` (pp-028) for the gated-field shape.
