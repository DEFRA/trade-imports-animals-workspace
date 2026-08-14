# EUDPA-328 — Catch up frontend with prototype

Plan for the trace-based parity rebuild.
Status: **plan agreed, nothing run.** Written 2026-08-14.

## 0. Decisions (agreed 2026-08-14)

| Decision | Ruling |
|---|---|
| Parity target | **Design release 2.1**, germinal products **included** |
| Frontend capture ref | **`main`** |
| Prototype walker home | **Workspace** — drift accepted |
| Backlog scope | **Whole surface, clearly banded**: frontend-only / needs-backend / needs-design-decision |
| Missing test coverage | **Write the tests.** Gaps are a phase of work, never a reason to drop trace-mining |

Consequences:

- Germinals is in scope. It is *why* `consignment-details` and
  `animal-identification-details` are the two most-changed DR2.1 pages, so
  including it removes the awkward job of unpicking germinal-driven changes from
  live-animal ones on those pages. It does mean the frontend gains a commodity
  domain it does not model at all — expect that to be the largest band.
- Capturing from `main` means the in-flight `feature/EUDPA-124-port-of-entry-
  type-ahead` work will show up as an open finding. Tag it as *already in
  progress* rather than dropping it, so nobody builds it twice.
- Workspace-hosted walker will drift when the prototype moves; accepted. Pin the
  prototype commit in the capture manifest anyway, so a stale run is detectable
  rather than silent.
- **Coverage gaps are build work, not a gate.** See §5.

## 1. Where the last attempt got to, and where it lives

The 2026-07-30/31 parity work was committed to the workspace repo and later
deleted from the working tree. It is recoverable:

```
git -C ~/git/defra/trade-imports-animals show --stat 12c6d4a
git -C ~/git/defra/trade-imports-animals checkout 12c6d4a -- workareas/shared/design-release-2-parity
```

`12c6d4a docs(design-release-2): preserve the frontend parity handover` contains
the spec, screen map, evidence, open questions, ~85 captured page models
(`dr2-*`, `fe-*`) and the cartographer harness (a Playwright config plus a
generic GDS page-model extractor).

**It is now substantially stale** — see §2 — but three things in it are still
worth salvaging rather than re-deriving:

- the **page-model schema** (h1, caption, headings, field order, labels, hints,
  option lists, summary/task lists, cards, tables, buttons, links, inset/details
  text). It proved diffable across two unrelated codebases.
- the **resolved decisions** (MoJ date picker adopted; region-of-origin prefix
  mechanism; the `accessible-autocomplete` ruling and its assessment doc).
- the **DR2 screen inventory**, which is a valid baseline for a DR2 → DR2.1
  delta rather than a from-scratch read.

## 2. What has moved since — read this before anything else

### 2.1 The target has changed: DR2 → **Design release 2.1**

`app/views/design-release-2.1/` now exists (31 views, mounted by
`app/lib/design-release-2.1-version.js`), added in `c442009 germinals` and
refreshed in `7da4f70 2.1 dashboard updates`.

Diffing DR2.1 against DR2 view-by-view, the delta concentrates in six pages;
everything else differs only by the path prefix (a 4-line diff):

| View | Δ lines vs DR2 |
|---|---|
| `consignment-details.html` | 120 |
| `dashboard.html` | 80 |
| `notification-hub.html` | 64 |
| `animal-identification-details.html` | 56 |
| `additional-animal-details.html` | 26 |
| `review-notification.html` | 12 |

Plus a new commodity domain: `app/data/commodities-germinal-products.js`,
`package-types.js`, extra commodity identifiers, and ~930 lines of new routing.

**So the parity target is DR2.1, and germinal products is a new domain the
frontend does not model at all.** Any backlog built against DR2 would be wrong
on its most-changed pages.

### 2.2 The frontend has moved a long way

`main` is now well ahead of the branch the old spec was written against —
e.g. `32f6106c` removed the import-type page entirely (which retires one of the
old open questions outright), `0f30d8b2` split form and display surfaces and
fixed the notification card, `6cbdd3be` constrained the arrival date.

The working checkout is on `feature/EUDPA-124-port-of-entry-type-ahead`, three
commits ahead of main, which begins the "enhanced search round" that the
`accessible-autocomplete` ruling deferred.

**Decision needed:** capture from `main`, or from the feature branch. Default
recommendation is `main` — a backlog written against unmerged work goes stale
the moment the branch changes shape.

### 2.3 The frontend now has 26 per-page E2E specs

Your instinct is right, and the setup is better than you may remember:

- 26 `*.e2e.spec.js` files, co-located with their features under
  `src/server/app/sets/live-animals/journeys/linear/features/`.
- They run as the `features` Playwright project (`playwright.config.js:43-51`).
- The suite is **self-contained**: `webServer` boots `npm run e2e:start`, which
  is `AUTH_ENABLED=false NODE_ENV=development node .` with
  `LIVE_ANIMALS_MODE=stub`. No workspace stack, no OIDC dance, no Mongo, no
  reference-data service. Deterministic stub data.
- `trace: 'retain-on-failure'` today — but `--trace on` on the CLI overrides it,
  so **no config edit is needed** to get a trace per spec.

That last point is what makes your idea work: the frontend side of the capture
becomes *the repo's own test suite plus one CLI flag*, with nothing bespoke to
maintain. The hand-written frontend walker in the old harness broke the moment
the tree was restructured; this cannot, because the specs move with the code.

### 2.4 The prototype has no DR2.1 suite

`journey-demo/` still contains only `journey.js` + `walk.spec.js`, which drive
**Design release 1** at the root URLs. There is no DR2 or DR2.1 coverage.

So the symmetry is imperfect and there is no way around it: the frontend side
comes free from its own specs; the prototype side needs a walker written once.

## 3. Is trace-mining actually the right foundation?

Yes, with two caveats worth stating up front rather than discovering later.

**Why it is better than the previous approach.** `npx playwright trace` (v1.59+,
first-party) gives per-action a11y snapshots, arbitrary DOM eval against the
frozen DOM, the network log and console — a strictly richer artefact than the
bespoke extractor, in a format both sides can produce. And on the frontend side
it is generated by tests that are already maintained.

**Caveat 1 — a trace shows what the test did, not what the page is.** Specs
exercise particular states, often error and edge cases. A page whose spec only
tests a validation failure will yield a trace with no clean-state render.

This is **not** a reason to weaken the approach. Where coverage is missing, the
answer is to write the test — on both sides. See §5: coverage is measured, and
whatever is missing becomes a build phase. That work is durable beyond this
exercise: the frontend ends up with clean-state coverage per page, and the
prototype gains a real DR2.1 spec suite where today it has none.

**Caveat 2 — the trace CLI is stateful and cwd-scoped.** `playwright trace open`
extracts to `.playwright-cli/` relative to the current directory and each new
`open` replaces the previous one. Any parallel mining **must** give each worker
its own directory. Get this wrong and workers silently read each other's traces
— findings would look plausible and be wrong. There is also no `--json` on any
subcommand: output is text, so it must be redirected and read.

Playwright ships its own agent skill for this — `playwright trace install-skill`
drops a `SKILL.md`. Worth installing in Phase 0 so workers follow the
first-party guidance rather than my paraphrase of it.

## 4. Proposed shape

Seven phases. Phases 1, 2, 3 and 4 fan out; the rest are serial.
Phase 0 is serial and cheap — I would run it with you in the loop, then use a
workflow from Phase 1 onward.

### Phase 0 — Foundations and sizing (serial)
1. Recover `12c6d4a` into `workareas/shared/dr21-parity/prior/`.
2. `playwright trace install-skill` so the miners use first-party guidance.
3. Measure the `features` suite on `main` and inventory the DR2.1 route table.
   **Output: two gap lists** — the tests that need writing on each side. See §5.

### Phase 1 — Close the coverage gaps (fan-out, one worker per gap)
Driven by the Phase 0 coverage table. Two workstreams, both writing tests:

- **Frontend**: for every page whose spec never renders a clean default state,
  add that coverage to the existing `*.e2e.spec.js`. These are real tests that
  belong in the repo on their own merit, following the repo's Playwright
  best-practices — not capture scaffolding wearing a test costume.
- **Prototype**: write the DR2.1 walker as a proper spec suite in the workspace,
  covering every DR2.1 page including germinals. Salvage the old cartographer's
  journey helpers, retarget at `/design-release-2.1`, and extend for the new
  commodity domain.

Exit criterion: **every page on both sides has a spec that renders it clean.**
That is what makes the trace corpus complete, and it is the phase that gives
this work value even if the parity backlog were never built.

### Phase 1b — Capture (serial, two runs)
- **Frontend**: `npm run test:features -- --trace on` on `main`. One trace per
  spec, self-contained — no stack, no OIDC, stub data.
- **Prototype**: boot the kit on a non-clashing port, run the DR2.1 suite with
  tracing on. Record the prototype commit in the capture manifest.

### Phase 2 — Mine (fan-out, one worker per trace)
Each worker: private cwd, `trace open`, then `actions` + `snapshot` + targeted
`snapshot -- eval` for what the a11y tree omits (hints, `name`/`required`, full
`<select>` options, `govuk-*` classes). Emits one page model per screen in the
salvaged schema. Structured output, so the models are validated not parsed.

### Phase 3 — Diff (fan-out, one worker per screen pair)
Frontend model vs prototype model → findings, each with file:line evidence on
both sides and a proposed increment type.

### Phase 4 — Verify (fan-out, adversarial)
Independent workers try to **refute** each finding against the artefacts, not
from memory. Both codebases move weekly; a plausible-but-stale finding is the
main risk to credibility on a high-visibility piece. Majority-refuted findings
are dropped, and what was dropped is reported rather than silently binned.

### Phase 5 — Backlog (serial synthesis)
Express every surviving finding as an increment in the vocabulary the
`frontend-change` skill already understands — add-field / add-page / add-section
/ add-collection / obligation change / flow change — so the backlog is directly
executable rather than needing translation. Order by dependency, mark what needs
backend work or a design decision, and keep a visible "deferred and why" list.

## 5. Phase 0 in detail — sizing, not gating

Phase 0 does **not** decide whether to use traces. That is settled. Its job is
to size the test-writing in Phase 1, so the fan-out is planned against real
numbers instead of an assumption.

1. **Recover the prior work.**
   `git checkout 12c6d4a -- workareas/shared/design-release-2-parity`, then move
   it to `workareas/shared/dr21-parity/prior/`. Salvage the page-model schema and
   the resolved decisions; treat the findings as stale.

2. **Install the first-party trace skill.**
   `playwright trace install-skill`, so Phase 2 workers follow Playwright's own
   guidance rather than a paraphrase.

3. **Measure the frontend suite on `main`.**
   Run `features` with `--trace on`. Record wall-clock, pass/fail, and one row
   per spec: which page it drives, and **whether it renders that page in a clean
   default state** or only in an error/edge state.

4. **Inventory the prototype.** Every DR2.1 page and state, from the mounted
   route table — the denominator the walker has to cover.

**Output: two gap lists**, one per side, each item being a test to write. Those
lists *are* the Phase 1 backlog, and they size the fan-out. There is no branch
in this plan where a gap causes retreat.

## 6. Operating the machine

This runs on Sam's local dev machine, and we have latitude to start and stop the
workspace stack as needed. Use `tim`:

| Need | Command |
|---|---|
| Stop everything (frees all ports) | `tim docker down` |
| Stack from Dockerhub images | `tim docker up` |
| Stack built from local source | `tim docker dev` |

The stack owns 3000/3001/3007/3100/3200. The frontend's `features` suite binds
`PORT` (default 3000) with `reuseExistingServer: false`, so it collides with a
running stack — **stop the stack rather than working around it**. The suite
needs nothing from the stack anyway (`AUTH_ENABLED=false`,
`LIVE_ANIMALS_MODE=stub`, no OIDC, no Mongo).

Capture runs are sequential, so port contention between the two sides is not an
issue: run the frontend suite on its default 3000, and the prototype kit on 3010
(the port the recovered harness already uses). Bring the stack back up afterwards
if other work needs it.

Note `PORT=… npm run …` is blocked by a Bash deny rule on `env *` — which is
why stopping the stack is the right move rather than re-porting the suite.

## 7. Why this is worth doing even before the parity backlog exists

Phase 1 leaves behind clean-state E2E coverage for every frontend page and a
DR2.1 spec suite for a prototype that currently has none. Both are assets in
their own right. If EUDPA-328 were cancelled after Phase 1, the repos would
still be better off — which is a good property for high-visibility work to have.
