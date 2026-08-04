# pp-037 — notifications-dashboard (full build)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

---

## 1. ⚠ THE BUILD-BREAKER: route-shape builders vs link builders, in the SAME file

**This is the page the whole URL-namespace split exists for.** The dashboard uses its path builders in
two different ways in one file, and under a mount prefix those two uses must produce **different
strings**:

- **Route paths** (evaluated at module load, when the controller builds its route table):
  **`dashboardRoutePath()`** and **`createRoutePath()`** — prefix-FREE.
- **Rendered links** (evaluated per request): **`dashboardPath()`** and **`createPath()`** —
  prefix-BEARING. Use these for `startAction`, `listAction`, the redirect, the form action, and
  **every pagination, sort and filter href**.

Get it backwards and you get either a route registered at `/plant-products/plant-products` (page
unreachable) or a link that drops the prefix and **lands the user on the live-animals dashboard**.
Both are near-silent — unit tests catch them only if you pin them.

**So pin BOTH families by assertion.** Mirror
`sets/live-animals/journeys/linear/features/dashboard/controller.js:114,126`, which is the twin doing
the same thing for its own set. Under symmetric mounts `dashboardRoutePath()` is `/` while
`dashboardPath()` is `/live-animals` there and `/plant-products` here — so neither set can hide a
mix-up any more.

**The plant dashboard renders at `/plant-products`, NOT at `/`.** The root belongs to neither set — it
is a server-wide 302 to `/live-animals` (FD-18). **The e2e spec must carry the co-residency canary
asserting all three in one run**: the plant dashboard at `/plant-products`, the live-animals dashboard
at `/live-animals`, and `/` redirecting.

There is **no SERVED_SET env var** — that framing was deleted by ruling R3. `PLANT_PRODUCTS_MODE`
selects the plant records stub and nothing else.

## 2. No flow changes, no contract case — and say so

The dashboard page is **already inside the flow `start` section** from pp-007 (FD-13), so
`flow.js`, `task-rows.js` and the entry guard need **no change** — the plan's `flowChanges` is `{}`.
`meta.collects` stays `[]`, so **no `contract.plant-products.test.js` case is due**; the create POST is
engine `startJourney`, already covered by engine behaviour.

**Report these as deliberate non-changes with the evidence**, rather than leaving them unexplained.
pp-029 did this well; pp-009 did not, and that is why the rule exists.

## 3. Deliberately excluded — do not port them

The page spec condemns these and they stay out: the bespoke datepicker; the `dl`-card grid (**source of
both serious axe violations**); the persistent error-summary banner; the 'hidden-search' toggle; the
pipe-separated account bar; the implied-consent cookie banner; and `button.govuk-link` actions.

Also omitted by decision: date shortcut buttons (Today / Tomorrow / Next seven days) as pure
convenience, and all DoA surfaces (Trade Partner badge, org switcher, cross-org visibility) which are
pp-048's. Pass 1 is single-org own-behalf; row actions are limited to Continue-into-hub for DRAFT and
AMEND — delete, amend and copy-as-new are pp-045's.

Rulings applied: **c-026** (real optgroups on the country select, data from pp-013), **c-027** (one
GDS-sentence-case status vocabulary shared by tags AND filter — implement as `view-model/statuses.js`
so both surfaces read one map), **c-012** ('Republic of Ireland'), **c-018** (one canonical validation
string per rule; the legacy `"Search" must be 255 characters or less` quoted-label defect is **not**
inherited).

## 4. Filtering is controller-side, and that is a known limitation

Status, country and date filters run **controller-side over the listed page**, because the engine
records port only supports page, sort and referenceNumber. That is decision (1) in the plan and it has
a consequence worth asserting: filtering does not reach beyond the current page. **Pin whatever the
behaviour actually is** rather than leaving it implied — and if it looks wrong to you, say so.

## 5. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-033, `e611e8cc`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **585** |
| `npm test` | **2,213 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **235** |
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
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**⚠ live-animals must stay at 559.** This increment touches shared path builders' *consumers*; if the
live-animals count moves at all, stop and report — that is the regression this whole split exists to
prevent.

**⚠ pp-076 flake, not yours to fix:** axe-core occasionally throws `Cannot read properties of null
(reading 'documentElement')` in an unchanged commodity axe test. **If you hit it, say so and re-run.**

## 6. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing; the count must
  match the renames you report.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken — especially for the two path families above.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation in this build. Assert computed
  accessible names directly. This page has repeated per-row actions and sortable column headers: each
  must name **which notification** or **which column** it acts on.
- **NEVER INVENT DATA.** Countries come from pp-013's `countries.js` as shipped. Six increments have
  stopped rather than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. Keep exact equalities exact.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS, no datepicker.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

## 7. Note

This increment **unblocks `pp-075`**, the parked tests-repo dashboard coverage (search, sort,
pagination) that pp-062 had to descope because these controls did not exist. Build the controls so
that coverage has something real to assert against.

Exemplars to imitate file-for-file:
`sets/live-animals/journeys/linear/features/dashboard/{controller.js, notification-helper.js,
view-model/row/index.js, view-model/sort-options.js, template.njk, dashboard.e2e.spec.js}`.
