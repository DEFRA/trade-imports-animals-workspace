# pp-066 — the plant a11y suite

This brief OVERRIDES the generic `implement.md`. **The `-tests` repo — a SEPARATE git repo** on
`spike/trace-to-requirements`. Rollback is `git stash push -u`.

**pp-064 and pp-065 landed tonight**, so the eleven page objects, the completed
`flows/plant-products/journey.ts` and the API journey are all there. Use them; write no new harness.

**Baselines I ran myself:** tests-repo plant **71** (65 passed + 6 flaky-passing, zero failures),
live-animals **141 collected, 140 passed, zero flaky**. Re-establish both and report yours. The stack is
up on current source — **do not rebuild it.**

## ⚠⚠ HAZARD 1 — THE FAILURE THIS INCREMENT EXISTS TO AVOID IS A GREEN RUN THAT RAN NOTHING

`test:a11y` selects by **grep on the `@a11y` tag**. If the plant a11y subtree is not inside a project's
`testMatch`, the grep finds nothing, the run is **green**, and it has scanned zero plant pages.

**Confirm collection with `playwright test --list` under the same grep and REPORT THE COUNT.** The
increment's own acceptance criterion calls this out by name: *a green a11y run with a zero plant test
count is the specific failure this criterion exists for*. Do not assume `testMatch` covers
`**/tests/a11y/plant-products/**` — check it.

Run it locally as **`npm run test:docker-compose:a11y`**, which targets the workspace stack. Bare
`npm run test:a11y` runs the default config against an undefined CDP environment and only works in CI.

## ⚠ HAZARD 2 — A GREEN AXE SCAN IS NOT EVIDENCE THESE PAGES ARE ACCESSIBLE

The CHED-PP trace work recorded real defects on these exact surfaces **that axe cannot see**:

- **THREE controls sharing the accessible name "Copy"** on the review/notification surface, with nothing
  distinguishing which reference each acts on — and a fourth in a state the traces never captured
  (`trace-requirements/ched-pp/pages/review-notification.json`). Duplicate accessible names on distinct
  actions **pass axe and defeat a screen-reader user completely.**
- A link that **announces as a same-page link when it is not**, plus a bespoke
  `--next-to-breadcrumbs` modifier reaching into a govuk component's own CSS namespace
  (`pages/csv-upload.json:115`).
- **The legacy service's own a11y suite scanned its review page ONLY in the DRAFT state.** That is
  precisely why this increment splits initial / filled / error / view-states.

**Where a page ships one of these, say so in the spec as a comment naming the trace finding.** An
automated pass on a page with a known axe-invisible defect is a **misleading green, not assurance**.
**Where a defect is real it belongs in a ticket, not in an exclusion** — tell me and I will raise it.

## ⚠ HAZARD 3 — `waitForViewportSettle` IS THE SINGLE MOST LIKELY WAY TO GET THIS WRONG

`setViewportSize()` resolves when the browser applies the metrics, **not** when JS reacting to the
change has run. Scanning without settling can see stale layout and produce a **false pass**. Call
`waitForViewportSettle(page)` (`fixtures/a11y.ts:52-53`) after **every** resize, and use
`scanViewports.narrowPortrait` (320×568) and `narrowLandscape` (568×320) from the same file.

## ⚠ HAZARD 4 — EXCLUSIONS ARE NAMED AND SCOPED, NEVER GLOBAL

Follow the live-animals pattern exactly:
`tests/a11y/live-animals/notification-journey-initial-state.spec.ts:6,28` declares
`const conditionalRadioInput = '#regionOfOriginCodeRequirement'` and passes
`runA11yScan({ exclude: conditionalRadioInput })`.

**NEVER `disableRules` globally.** A rule switched off across the suite hides that rule's defects on
every other page too, forever, and nobody revisits it. Every exclusion carries a **selector** and a
**comment naming the upstream reason**.

⚠ **There is already a shared helper for the GOV.UK conditional-radio false positive** in the frontend
set (`features/axe.e2e-helper.js`). This is a different repo with a different harness, so you cannot
reuse that file — but **the same false positive will appear**. Handle it the way live-animals does here,
and do not invent a third mechanism.

## What to build — SIX specs, not five

`tests/a11y/plant-products/` mirroring live-animals **file for file**:
`notification-journey-initial-state`, `-filled-state`, `-error-state`, `notification-dashboard-views`,
`notification-dashboard-viewports`, and **`notification-view-states`** — the sixth, which the plan's
"five specs" line omits and which the increment JSON explains.

Use `flows/plant-products/api-journey.ts` to **seed** the view-states rather than walking the journey
four times. Use the existing `fixtures/a11y.ts` + `utils/a11y-utils.ts` harness **unchanged** — no new
scanning utility, no bespoke axe wiring. Tag every spec `@a11y`. **Introduce no set tag** — sets are a
Playwright project split.

The filled state should carry the depth-3 commodity summary with **at least two lines, two species and
two varieties** — the most structurally complex thing either set renders.

## Constraints

- **No plant page object imports from `page-objects/live-animals/`.**
- **Never invent test data** — values come from `domain/plant-products/constants/` or the frontend
  fixture, and report any disagreement rather than preferring one side silently.
- **If a plant page needs a visual fix to pass a scan, that is a FRONTEND increment, not an exclusion
  here.** Stay inside the govuk-frontend toolbox; tell me and stop.
- `typecheck`, `lint`, `format:check` green. **The live-animals a11y specs must be unchanged and still
  green in the same run.**
- Confirm scan names do not collide between sets — `utils/a11y-utils.ts:29-35` names each scan by
  pathname and both sets now carry a prefix, so they should be distinct. **Confirm in the output rather
  than assuming**; identical names would silently overwrite each other's attachments.
- **E2E is quick here — do not skip or trim the lane on perceived runtime.** The a11y fixture already
  raises the per-test timeout to five minutes because these tests click through several pages; that is
  expected, not a reason to cut coverage.
- **Stage, do not commit.** Never run `sonar`.

## If a scan hangs

`utils/a11y-utils.ts:11-21` documents an axe-core `analyze()` window-open hang
(dequelabs/axe-core-npm#707). If you hit it, set `legacyMode: true` **for that scan only**, citing the
issue inline. **Never suite-wide** — legacy mode drops cross-origin iframe testing.

## The mutations I expect, by failing test NAME

1. **Break a form control's label association** on one scanned page → the relevant scan must fail. If it
   does not, that page is not actually being scanned and you have hit HAZARD 1.
2. **Remove `waitForViewportSettle`** from the viewport spec and report whether the scan still passes.
   Either result is informative: a pass tells us the settle is currently redundant on these pages, a
   failure proves it is load-bearing. **Report which, honestly.**

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME** — my briefs have been wrong twelve times tonight and
every single time the implementor or reviewer was right. If a page cannot pass without a change outside
this repo, **stop and say so** rather than reaching for an exclusion.
