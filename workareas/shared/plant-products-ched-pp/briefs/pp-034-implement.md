# pp-034 — accompanying-documents (document metadata + sub-resource projection)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times so far, and **twice it would have
destroyed shipped work**.

---

## 1. ⚠ THE PLAN SAYS `create` FOR A FILE THAT EXISTS AND IS FULL OF WORKING CODE

`backlog.json` marks `services/records/mapper/to-dto.js` as **`action: "create"`**. **It exists.** It
carries the whole plant DTO projection built across pp-008, pp-021 and m3 — origin, purpose, the full
depth-3 `commodityComplement[]` subtree with species and varieties, and pp-028's additional-details.
Writing it fresh would silently delete all of it.

**The action is EDIT.** This is the third time this exact pattern has appeared — pp-020 (a reference
fixture with verified provenance) and pp-022 (pp-021's gate-approved bindings) — and it is the most
expensive kind of plan error, because the suite would go red in ways that look like your own bug.

**Read the file before you touch it, and check your diff is a net addition.**

## 2. This increment DECLARES obligations — manifest before registration

Like pp-028 and unlike the m3 commodity pages, this creates
`obligations/sections/documents.js` and must:

1. Create the section file.
2. Add its obligations to `obligations/index.js` — import, re-export, append to the array.
3. Create `features/documents/evaluation.js` with a **distinct** feature name, and register it in
   `features/evaluation.js`.
4. Have your page `collects` them.

**Order is enforced by two independent guards**, both established by mutation earlier in this build:
`bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own object
by identity, so **manifest exports land BEFORE registration**; and `flow/dispatch.js`
`assertFullCoverage` rejects a manifest obligation no page collects. Registering two bundles under one
feature name throws `feature name "..." is registered twice`.

**Obligation names are path-safe camelCase** — they are answer keys and DOM field names. Kebab in the
plan is the page-slug namespace.

**c-015: the minEntries-1 floor.** At least one accompanying document is required. Pin it from both
sides — blocked with none, satisfied with one — and make sure the floor is enforced at the task-row
level, not only in the controller.

## 3. ⚠ `lint:arch` SHOULD FALL 1 → 0. That would be the first fully-clean run.

The single remaining advisory `no-orphans` warning is `document-types` — pp-016's fixture, which this
page is the **first and only consumer of**. So expect **0 errors / 0 warnings**.

That drop is structural proof the wiring is real: a count that cannot move if the fixture were
re-declared locally or imported by a copy file. **State the expected number.** If it does not fall,
you have not really consumed the fixture — do not "fix" it by deleting or force-importing, and do not
adjust anything to make the number match. pp-027 correctly told me my predicted number was wrong
rather than bending the code; do the same if you believe this one is.

## 4. The sub-resource projection is the unusual part

Accompanying documents are a **separate backend resource**, not a branch of the notification document
— which is why `services/records/real.js`, `real.test.js` and `records-port.test.js` are in scope
while nothing else in m3 needed them.

**Test at the network boundary, not the module boundary.** The house rule and the existing
`real.test.js` both do this: mock HTTP, assert on request/response, never on "was this function
called". A `toHaveBeenCalledWith` assertion here tests the implementation, not the contract.

Read the shipped backend contract rather than the plan's description of it. pp-008 found **two** places
where the plan disagreed with the real Java contract and reality won — PUT requires `referenceNumber`
in the body matching the path, and copy idempotency is keyed globally. Assume nothing about how the
sub-resource is addressed; verify it.

## 5. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-029, `21e6d4f4`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **426** |
| `npm test` | **2,033 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **144** |
| `lint:arch` | **0 errors / 1 warning** → expect **0 / 0** |

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
teardown race with no violation reported, seen in 2 of 6 observed runs. **If you hit it, say so and
re-run. Do not rationalise a genuine failure as this flake, and do not quietly re-run and report only
the clean pass.**

## 6. Hub spoke and its number

This adds a new flow section, task row and hub spoke. Current hub captions are numbered `1.` Origin,
`2.` Purpose, `3.` Commodity, `4.` Additional details, `5.` Transport, `12.` Review. **Use the
canonical spoke number for documents from §2.1 — do not renumber the others to make the sequence
contiguous.** The gaps are deliberate scaffolding while m4 and m5 fill in.

**State what the hub renders before and after, row by row.** Row states have twice moved by accident
here (pp-018 and pp-023, both via `policy.enforcedAtContinue`), and a mandatory row with a minEntries
floor is exactly the shape that does it.

## 7. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** pp-026's case was called 'exposes
  renumbered indices' and could not detect a removal that always hit the wrong row. Ask what each test
  would do if the behaviour were broken. **If this page repeats per-document controls, remove a
  MIDDLE entry, not the last** — that is the exact gap.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation. Assert computed accessible names
  directly, and make repeated per-document controls name which document they act on.
- **NEVER INVENT DATA.** Document types come from pp-016's `document-types.js` as shipped — 16 entries
  in trace order with the c-016 normalisations already applied. Four increments have stopped rather
  than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report before/after.
  `co-residency.test.js` pins the plant `sectionIds` array and will need your new section.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
