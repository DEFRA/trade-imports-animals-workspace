# EUDPA-328 — DR2.1 parity

Bringing the live-animals frontend into line with the designer prototype's Design
release 2.1.

**Outcome: 97 verified increments.** Every one raised from a captured artefact, carrying
`file:line` evidence on both sides, and survived an independent verifier whose
instruction was to refute it.

## The deliverable is the backlog JSON

`workareas/journey-builder/EUDPA-328/backlog.json` — canonical state, in the shape the
build loop already consumes.

```bash
tools/journey-builder/backlog-counts.sh EUDPA-328          # total: 97 — M0 8 blocked/2 todo, M1 25 todo, M2 41 blocked, M3 21 blocked
tools/journey-builder/next-increment.sh EUDPA-328 --claim  # pop the next runnable one
tools/journey-builder/backlog-set-status.sh EUDPA-328 inc-012 done
```

**The implementor is the `frontend-change` skill**, invoked with the increment's `type`
as its mode (`add-field`, `add-page`, `add-section`, `add-collection`, obligation change,
flow change). One increment per invocation, and it runs its own verification ladder.

> `verify-increment.sh` does **not** apply here — it targets the prototype
> (`prototypes/standalone/live-animals`, `npm run test:prototype`). These increments
> target the real frontend at `src/server/app`.

Milestones: **M0** cross-cutting chrome (do first — it touches every page), **M1**
buildable now, **M2** born blocked on a design ruling (`gate: "sam"`), **M3** born
blocked on backend work (`gate: "backend"`). Clearing a gate is a status flip from
`blocked` to `todo`; nothing needs regenerating.

## Human-readable views of the same data

| | |
|---|---|
| [Backlog page](https://claude.ai/code/artifact/f089a914-2ae2-4732-9f60-f3ec12bf9734) | Filterable by band, type and domain. Shows the same `inc-nnn` ids the loop returns |
| [`BACKLOG.md`](BACKLOG.md) | Flat markdown, banded and grouped by increment type |

## How it was built

| Document | What it is |
|---|---|
| [`DECISIONS.md`](DECISIONS.md) | Calls made without asking, and what still needs a human |
| [`PLAN.md`](PLAN.md) | The agreed approach. Written before anything ran |
| [`PHASE-0.md`](PHASE-0.md) | Sizing: what coverage existed on each side |
| [`PHASE-1.md`](PHASE-1.md) | Building the DR2.1 walker, and the corpus it produced |

## Capture manifest

| | |
|---|---|
| Frontend | `main` at `32f6106c` |
| Prototype | `7da4f70` |
| Playwright | `1.61.0` |
| Page models | 103 — 33 frontend, 70 prototype |
| Paired screens | 29, plus 4 frontend-only and 23 prototype-only |
| Mechanical deltas | 468 |

## Refreshing the corpus

Both codebases move weekly, so the corpus is built to be re-run rather than trusted
indefinitely. All four steps are idempotent.

```bash
# 1. Frontend — needs the stack DOWN, the features suite binds port 3000
tim docker down
npm --prefix repos/trade-imports-animals-frontend run test:features -- --trace on

# 2. Mine the frontend traces into page models
npm --prefix workareas/shared/dr21-parity/fe-miner run mine

# 3. Prototype — the walker boots its own kit on 3010, stack can be up
~/git/defra/defra-design/GB-notification-service/node_modules/.bin/playwright test \
  --config workareas/shared/dr21-parity/harness/playwright.config.js --reporter=list

# 4. Diff every pair
npm --prefix workareas/shared/dr21-parity/compare run diff-all
```

Then re-run the Phase 3 workflow (`compare/phase3.workflow.js`) and rebuild. Order
matters — the increments file is the source the page reads:

```bash
npm --prefix workareas/shared/dr21-parity/compare run build-backlog -- <workflow-output.json>
npm --prefix workareas/shared/dr21-parity/compare run build-increments   # canonical JSON
npm --prefix workareas/shared/dr21-parity/compare run build-page         # reads the JSON
```

Regenerating renumbers `inc-nnn`, so do it before work starts rather than mid-loop —
statuses are not carried across a regeneration.

## Layout

```
workareas/journey-builder/EUDPA-328/backlog.json    ← THE DELIVERABLE (canonical state)

dr21-parity/
├── backlog.json      raw verified findings — the input to build-increments
├── BACKLOG.md · backlog-page.html                  human-readable views
├── harness/          DR2.1 cartographer — 9 walker specs + the shared extractor
├── fe-miner/         mines the frontend's own traces into models, same extractor
├── compare/          differ, pairing, the Phase 3 workflow, the generators
├── prior/            the recovered 2026-07-30 attempt (findings are stale)
└── phase0/           run logs and canary artefacts
```

`harness/e2e/page-model.js` is the single extractor both sides use. That matters: if the
two sides ran different extractors, the diff would measure the extractors rather than
the pages.

## Two hazards worth remembering

**`trace snapshot -- eval --filename` writes JSON, not raw text.** A DOM dumped that way
arrives as a quoted string with every attribute quote escaped. jsdom parses it without
complaint — tag selectors work, so models look healthy — but every class selector
silently returns nothing. `fe-miner/mine.js` decodes before parsing.

**The prototype builds its spine screens from bespoke `app-*` markup**, not
`govuk-task-list` / `govuk-summary-list`. Compared component-to-component that reads as
"the prototype has no task list at all" on the two most important screens in the service.
The extractor captures the concept instead, under `taskItems`, `summaryRows` and
`allFields`.
