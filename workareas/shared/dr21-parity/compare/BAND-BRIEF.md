# Phase 3 / 4 — band reviewer brief

You are turning mechanical deltas into a reviewed, evidence-backed parity backlog for
EUDPA-328. Read this whole file first.

## What already exists

Both sides have been captured and mined into page models in one shared schema:

- Frontend models: `fe-miner/capture/model/fe-*.json` — recovered from the frontend's
  own `features` Playwright traces, captured from `main` at `32f6106c`.
- Prototype models: `harness/capture/model/dr21-*.json` — captured by the DR2.1
  cartographer from the prototype at `7da4f70`.
- Raw DOM for every frontend screen: `fe-miner/capture/html/*.html`.
- Raw HTML, screenshots and traces for every prototype screen: `harness/capture/`.

A mechanical differ has already compared every paired screen. **Your starting point is
`compare/deltas/<frontend>__<prototype>.json`** — one file per pair, listing every
concrete difference in headings, fields, options, buttons, links, service navigation,
summary rows, task lists, tables, inset/warning/details text, tags and paragraphs.

`compare/pairs.js` holds the pairing and, at its foot, the screens that exist on only
one side. Those are findings in their own right.

## What you produce

Findings. A delta is not a finding — a delta is a fact, and many are noise (a hidden
CSRF field, a trivially reworded button). A **finding** is a delta that implies work.

Every finding must carry:

- **Evidence on both sides.** `file:line` in the frontend repo AND in the prototype
  repo. Not "the dashboard template" — the actual file and line. Open them and read
  them; do not cite from the model alone.
- **A proposed increment type**, in the vocabulary the `frontend-change` skill already
  understands: `add-field`, `add-page`, `add-section`, `add-collection`,
  `obligation-change`, `flow-change`, or `copy-change`.
- **A band**: `frontend-only`, `needs-backend`, or `needs-design-decision`.
- **A confidence**, and what would falsify it.

## Where to look

- Frontend pages: `repos/trade-imports-animals-frontend/src/server/app/sets/live-animals/journeys/linear/features/<feature>/`
  — each feature folder owns its `.njk` template, its model and its `*.e2e.spec.js`.
- Prototype views: `~/git/defra/defra-design/GB-notification-service/app/views/design-release-2.1/`
- Prototype routing and data: `app/routes.js` (10,497 lines — grep it, don't read it)
  and `app/data/`.

## Rules that matter

- **Verify against the captured artefacts, not from memory.** Both codebases move
  weekly. A plausible-but-stale finding is the single biggest risk to this work's
  credibility. If you cannot point at a file and a line, you do not have a finding.
- **Do not invent parity.** If the prototype does something the frontend does not, that
  is the finding. Do not soften it into "consider aligning".
- **Ignore the `url` field.** Frontend models are recovered from trace snapshots whose
  location is the trace viewer's, so it is not comparable across sides.
- **Hidden fields, CSRF tokens (`crumb`) and framework plumbing are not findings.**
- Watch for **service-wide patterns** rather than reporting the same thing 20 times.
  One known example: the frontend says "hub" where the prototype says "overview". That
  is one copy/vocabulary finding across the service, not one per page.

## GUARD RAILS

- Both repos are **READ-ONLY** for you. Read freely; write nothing. You are producing
  analysis, not changes.
- Bash: **one command per call.** No `&&`, no `;`, no `cd`. `env`, `node`, `bash` and
  `sh` are denied.
- Use `~/` in Bash commands, never a literal `/Users/…` path. Absolute paths for Read.
- Do not run `sonar`, do not touch `docker/`, do not start or stop the stack, do not
  run any `git` command that writes.
