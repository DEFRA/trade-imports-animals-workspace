# pp-029 — notification-hub, full task-list build

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far, twice destructively.

This is an **idempotent reconciliation**, not a build from scratch. Much of the hub already exists.

---

## 1. ⚠ The plan's own row list is stale by one — pp-030 landed out of numeric order

`backlog.json`'s decision (1) says GROUPS at this increment contains "origin, purpose, commodities,
additional-details, review". **That is wrong: `transport` also exists.** pp-030 (transport-before-bip)
landed early, before the m3 commodity pages. I verified the current state at HEAD —
`features/hub/controller.js` `GROUPS` is:

```
origin, purpose, commodities, additional-details, transport
```

and `features/hub/copy/copy.en.js` captions are numbered `1.`, `2.`, `3.`, `4.`, `5.`.

So decision (2)'s predicted rendered sequence of **1,2,3,4,12** is actually **1,2,3,4,5,12**. The
principle is unchanged and still correct — canonical numbers stay stable and the middle fills in at
m4/m5 — but do not "fix" the sequence to be contiguous, and do not drop transport.

**`taskRowById` on a missing row throws**, so the frame must still reference only rows that exist.
That constraint is the reason decision (1) exists and it still applies to every row you do NOT add.

## 2. Report what was ALREADY delivered before doing anything

Increments pp-018 through pp-030 each added their own GROUPS entry, row copy and task row per recipe
§3.6. **A large part of this increment's target state is therefore already in place.**

**Open your report by stating what already exists and what you actually changed.** pp-009 delivered
five fewer files than its plan listed and reported `ok:true` without saying so; the rule since then is
that silent under-delivery is as dangerous as scope creep. Here under-delivery is the *expected*
outcome for several files — so name them and the evidence, rather than either redoing the work or
quietly skipping it.

If a planned change is already present and correct, say so and move on. If it is present and
**different** from the target state described in the plan, that is a finding — report which is right
before changing it.

## 3. What this increment actually has to add

The parts of the ruled hub experience the per-section increments did not deliver:

- **FD-12: review is a flow SECTION with the authored gate `scope.readyForCheckYourAnswers`, NOT a
  task row.** This is the page spec's clearest defect fix — the legacy hub hardcodes a 'To do' review
  tag that never reflects reality. Pin it from both sides: blocked while a mandatory row is
  incomplete, available once every one is complete.
- **`isHiddenRow`, `CANNOT_START`, `STATUS_TAG` and `buildReviewItem`** brought to the live-animals
  exemplar's shape where they are not already.
- **`journeyStrip` caption** replacing any legacy-style heading flip — one stable id with status moves.
- **Real-href back links** — no `href='#'`, no back-link plus breadcrumbs duplication.

Transpose file-for-file from `sets/live-animals/journeys/linear/features/hub/`
(`controller.js`, `template.njk`, `copy/copy.en.js`, `copy/copy.cy.js`, `hub.e2e.spec.js`), plus
`shared/kit.js` for `journeyStrip`, `flow/navigation.js` for `rowEntry`/`rowGatePasses`/`sectionEntry`,
`flow/section-status.js` and `bridge/status/index.js`.

**Deliberately NOT built** (each evidence-backed in the plan, do not add them): commodityTotals summary
cards, the Attachments shortcut, legacy prerequisite-gating that redirects away from the hub, and the
'Expired' status.

## 4. ⚠ The hub is where row states have twice changed by accident

`countryOfOrigin` in pp-018 made the Purpose row read 'Cannot start yet' on a fresh notification;
`commoditySelection` in pp-023 did the same to Transport. Neither was designed — both fell out of
`policy.enforcedAtContinue`. Sam has been flagged about both.

**You are rebuilding the surface that renders those states.** State exactly what the hub renders before
and after your change, row by row, on a fresh notification and on a partly-complete one. **Any change
in a row's status or link is a finding to report, not a detail to absorb** — this increment is the one
place a silent status regression would look like intended work.

## 5. Baselines and the numbers you must hit

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-028, `38ca8670`) — every figure verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **420** |
| `npm test` | **2,027 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **140** |
| `lint:arch` | **0 errors / 1 warning** (`document-types`, clears with pp-034) |

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

This increment consumes no reference fixture, so **`lint:arch` must stay 0 errors / 1 warning** —
movement in either direction is a finding. **NEVER "fix" that warning.** `shasum
.dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**⚠ Known intermittent flake, raised as pp-076 and not yours to fix:** axe-core occasionally throws
`Cannot read properties of null (reading 'documentElement')` in an unchanged commodity axe test — a
teardown race, no violation reported. It appeared in 2 of 4 observed runs. **If you hit it, say so
explicitly and re-run; do not rationalise a genuine failure as this flake, and do not quietly re-run
and report only the clean pass.**

## 6. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. pp-017
  silently deleted three browser specs and reported `ok:true`; the tell was a Playwright count falling
  13 → 11. Run `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** pp-026's case was called 'exposes
  renumbered indices' and could not detect a removal that always hit the wrong row.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation. Assert computed accessible names
  directly. The hub is a task list of repeated status rows and links: each row's link accessible name
  must identify its row, not just read 'Origin of the import'.
- **L1 shape assertions are IN SCOPE** (`indexed.plant-products.test.js`, `co-residency.test.js`,
  `routes-plant-products.test.js`, `contract.plant-products.test.js`): update expected values, **never
  weaken a pin, never truncate a journey to dodge a moved assertion, prefer the strictly stronger
  form, report before/after.**
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit.
- **Stay inside the govuk-frontend toolbox** — no phase-tag, no action-button or button-small, no
  bespoke CSS.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report; the
  orchestrator verifies and lands it.
