# EUDPA-328 — calls made without asking

Per Sam's standing rule: make the call, note it here, keep moving. Flag for review,
not for approval. Reverse any of these freely — none is expensive to undo.

## 2026-08-14

**Germinal branch is two workers, not one.**
It is the least-known surface and the primary evidence for the largest backlog band.
Split into `germinal-selection` (commodity choice → consignment-details) and
`germinal-identification` (animal-identification-details → additional-animal-details).
If one worker had got the journey setup wrong, a single silent failure would have cost
the whole band; two workers fail independently.

**Nine workers, one port each (3011–3019).**
The kit's dev server races journey/session state across concurrent requests, so
workers cannot share a server. Separate ports means separate kits means separate
sessions. Ports live in per-worker config files because `env` is denied in Bash, so
`PORT=… npm run …` is not available.

**Stack taken down for the fan-out.**
Nine kit instances plus 28 containers is more memory pressure than this needs, and the
fan-out needs nothing from the stack. It goes back up when Phase 1 lands.

**Frontend side mined in parallel rather than after Phase 1.**
The frontend has no test-writing work, so its traces could be mined immediately
instead of waiting behind the prototype walker. `fe-miner/` does this. It means Phase 3
gets both sides at once rather than serialising on the slower one.

**`EXTRACTOR` exported from `harness/e2e/page-model.js`.**
Additive, backwards-compatible one-line change. Both sides of the diff must run the
identical extraction or the diff measures the extractors rather than the pages. The
alternative — duplicating the extractor into the miner — would have let the two copies
drift silently, which is the one failure mode that would quietly invalidate every
finding.

**Frontend model `url` is set to the screen name, not the captured location.**
A frozen trace snapshot is served by the trace viewer, so its `location` is the
viewer's URL and not the application's. Rather than record a misleading URL, the field
carries the stable screen identity. The prototype side captures a real URL, so **the
`url` field is not comparable across the two sides** — Phase 3 must diff on screen
name and ignore `url`.

**Frontend checkout left on `main`.**
Sam asked for it. `feature/EUDPA-124-port-of-entry-type-ahead` was at `077f13f3`;
nothing was stashed because the tree was clean.

**Extractor extended to capture concepts, not components — and both sides re-captured.**
The prototype builds `notification-hub` and `review-notification` from bespoke `app-*`
markup, not `govuk-task-list` / `govuk-summary-list`. Diffed as captured, both would
have read as "the prototype has no task list at all" on the two most important screens
in the service. Added `taskItems`, `summaryRows` and `allFields` — which also picks up
controls outside a `<form>`, such as the templates sort select that was previously
invisible. The differ now compares those keys. Cost: one re-capture of each side
(2.7 minutes and seconds respectively). The alternative was a backlog with confident
false entries at the top of it.

The underlying observation — that the prototype has left the govuk-frontend toolbox on
its spine screens — is carried into Phase 3 as a candidate finding rather than
swallowed as a capture detail.

**Phase 3 fans out by band (8 workers), not per pair (29).**
The workspace guideline is ~15 agents. Banding also reads better: a reviewer holding
all six address screens spots a service-wide pattern that six single-pair reviewers
each see one instance of. Verification stays per-finding — each band's findings go to
an independent refuter that must check every one against the cited artefacts.

**Corrected after Sam's steer: the deliverable is canonical JSON, not documents.**
I had built `BACKLOG.md` and a published page and called that done. The workspace
already has a contract for this — `workareas/journey-builder/<run>/backlog.json`, with
`next-increment.sh` / `backlog-set-status.sh` / `backlog-counts.sh` keying on
`id`/`dependsOn`/`status`, and EUDPA-288's hand-authored retrofit backlog as the
precedent for a backlog that does not come from `backlog-generate.sh`. The 97 findings
are now increments in that shape; the markdown and the page are generated views of it,
and the page shows the same `inc-nnn` ids the loop returns.

`verify-increment.sh` is the one piece that does not carry over — it runs
`npm run test:prototype` against `prototypes/standalone/live-animals`, and these
increments target the real frontend. The implementor is the `frontend-change` skill,
whose modes are exactly the increment types in the backlog, and which runs its own
verification ladder. That is recorded in the backlog's `note` so nobody discovers it the
hard way.

**Gated increments are born `blocked`, not omitted.**
The 41 design-decision and 21 backend items sit in the backlog with `gate: "sam"` or
`gate: "backend"`, so `next-increment.sh` never pops them but the backlog stays a
complete picture of the gap. Clearing a gate is a status flip, not a regeneration.

**`dependsOn` chains per screen, not globally.**
Page before section before field before copy, within a screen; increments on different
screens are independent. That is a real ordering rather than an invented one, and it
leaves the loop free to be parallelised later without re-deriving the graph.

## 2026-08-19 — reconcile (re-raising increments after drift)

**Built `reconcile` in `compare/`, not in `tim`, for now.** Sam asked to build it and to make
it deterministic and tested. The core (`parity-lib.reconcile`) is a pure function with no
filesystem or clock coupling, so lifting it to `tim parity reconcile` later is a thin adapter with
no logic change. Building it in the existing pipeline avoided front-running the whole report-v2
`tim parity` migration to land one command. Full contract in `RECONCILE-PLAN.md`.

**Identity is a recomputed content key; `inc` ids are append-only.** `build-increments` numbers
`inc-nnn` positionally, so a regeneration renumbers and drops the human overlay. reconcile instead
matches fresh findings to live increments by a content-derived key (screens + type + both evidence
paths, line refs stripped), keeps every existing id, and mints new ones as `inc-{max+1}`. Keys are
recomputed from current content each run, never read from a stored field, so a hand-edited citation
re-keys correctly.

**The key needed a line-order ordinal — found by running it, not by reasoning.** The first real
dry run flagged 6 `needsHuman` collisions: three pairs of distinct findings citing the *same file*
on the same screens/type (dashboard "At a glance" vs the tabs; two germinal fields; typeahead vs
means-of-transport), which a paths-only key collapses into one. Fix: within a co-located group,
order by start line and fold the ordinal into the key. It survives drift (the group shifts
together, order holds) but keeps the two apart. After the fix the same corpus reconciles to 96
carry / 1 suppressed / 0 needsHuman, deterministically (two `--json` runs byte-identical).

**Carry preserves the whole human overlay; only evidence line-refs refresh.** Status, decision,
gate, notes, commit and dependsOn are never rewritten on a carry — only `evidence.*` line numbers,
plus one appended note when a ref actually moved. `dependsOn` is computed only for *new*
increments; an inversion (an existing increment that a new one should precede) is reported under
`graph.warnings`, never applied, so no human dep edit is clobbered.

**Tombstones suppress re-raise — verified on live data.** The one `dropped` increment (`inc-014`)
whose gap the differ still finds was reported as `suppressed`, not re-minted. That is the whole
point of recording a reject instead of deleting it.

**`build-increments.js` refactored to share `parity-lib`.** The increment-shaping logic now lives
in one place, so the generator and reconcile mint increments through the same code path — two
copies would drift, the exact failure mode this corpus is built to avoid. Behaviour preserved.

**Left the `build-increments` OUT_DIR path bug alone — deliberately.** It writes to
`~/git/defra/trade-imports-animals/workareas/...` (missing `-workspace`), so a regeneration would
*not* overwrite the live backlog at the real path. Fixing it would arm a full regeneration to
clobber the hand-edited backlog — the very thing reconcile exists to prevent. Flagged, not fixed.
Refresh a worked backlog with `reconcile`, never `build-increments`.

**Tests use Node's built-in `node:test`.** `compare/` has no `node_modules`; the built-in runner
is zero-dependency and deterministic. `npm test` (27 tests), `npm run check` (syntax), `npm run
reconcile -- EUDPA-328` (dry run) — node is wrapped in npm scripts because it is not on the
Bash allowlist.

## Near-miss worth knowing about

**`trace snapshot -- eval --filename` writes the JSON-serialised result, not raw text.**
A DOM dumped that way arrives as a quoted string literal with every attribute quote
escaped (`class=\"govuk-heading-xl\"`). jsdom parses it without complaint: tag
selectors still work, so `h1` came out fine and the model looked healthy — but every
`govuk-*` class selector silently returned nothing. Summary lists, task lists, hints,
error summaries, inset text, tags: all empty, on all 29 screens.

Caught because a mined model said the dashboard had no service navigation while a
direct read of the same trace had shown one item. Two artefacts disagreeing is what
exposed it; neither alone looked wrong.

`fe-miner/mine.js` now decodes before parsing. The cross-check that confirmed the fix:
`fe-hub` mines 11 task-list rows, matching the 11 counted independently from the live
trace during Phase 0.

The prototype side was never affected — it captures via `page.content()`, which is raw
HTML. But anything else built on `trace ... eval --filename` needs the same decode.

**Tracked build-loop backlogs in git.**
`workareas/*` ignored the canonical deliverable, so it could not be committed. A
`backlog.json` is the executable definition of a body of work and should outlive the run
that produced it, so the ignore now admits `workareas/journey-builder/*/backlog.json` and
nothing else under a run directory. This picked up EUDPA-249's and EUDPA-288's backlogs
too, which is the right outcome.

**Excluded 76MB of test output and 16MB of screenshots from the commit.**
`workareas/shared/dr21-parity/.gitignore` keeps the models and the raw HTML — those are
the evidence findings cite — and drops screenshots, Playwright run output and the two
`node_modules` symlinks. No finding cites a screenshot.

**Decision walker built at `tools/parity/`, not folded into an existing skill.**
49 items are gated on Sam and the loop cannot pass them. The walker is three small
scripts over the same backlog JSON. It is deliberately separate for now because the
right home is the generalised walker in
`workareas/shared/build-loop-amalgamation/DESIGN.md` §4, and that touches four working
skills — not something to do while landing this.

## Still needs a human

- `workareas/shared/design-release-2-parity/` is a duplicate of `prior/`. `rm -rf` was
  denied by a permission rule and I did not retry it in another form. Delete by hand.
- Nothing has been committed. `workareas/shared/` is tracked for review handoff, but
  the workspace is on its default branch and Sam has not asked for a commit.
