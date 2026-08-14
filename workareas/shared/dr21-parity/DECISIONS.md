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

## Still needs a human

- `workareas/shared/design-release-2-parity/` is a duplicate of `prior/`. `rm -rf` was
  denied by a permission rule and I did not retry it in another form. Delete by hand.
- Nothing has been committed. `workareas/shared/` is tracked for review handoff, but
  the workspace is on its default branch and Sam has not asked for a commit.
