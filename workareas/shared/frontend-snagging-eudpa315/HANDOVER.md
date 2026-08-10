# EUDPA-315 frontend snagging — handover

State as at 2026-08-10. Parent ticket **EUDPA-315**, epic **EUDPA-144**.
Everything below was verified against Jira, `backlog.json` and the repos at
handover time — not recalled.

## How this works

- **Input:** `snags.txt` in this directory, one complaint per line, verbatim
  including typos. **Claude maintains it**, not Sam — he reports in chat, it
  gets appended. Lines are only ever appended: the loader dedupes on exact
  text, so rewording a line after its ticket exists raises a second one.
- **State:** `backlog.json` here. One increment per snag.
- **Workflows** in `.claude/workflows/`:
  - `snag-triage.js` — new snags → investigated, refuted, ticketed, branched
  - `snag-respec.js` — a blocked increment whose gate has since been ruled
  - `increment-build-loop.js` — builds a `todo` increment end to end
  - `dig-design-implement.js` — a defect where the *design* is the question
- **`args` does not reach a workflow script in this runtime.** The `FALLBACK`
  const at the top of each is the only switch that works. Getting this wrong
  already caused one run to build an already-merged increment.
- Only one workflow at a time — they all write `backlog.json` and will race.

## Done

| Snag | Ticket | State |
|---|---|---|
| Obligation UUIDs in the seed | — | Paul's `97ee841`, pre-existing, recorded only |
| Copy as new CSS is off | EUDPA-320 | **Merged** `30efd515` |
| Commodities boxes ugly | EUDPA-319 | **Merged** `e54b22c5` |
| A11y tests failing | EUDPA-321 | **Closed** — CDP environment, not code |

## In flight — EUDPA-317, "Copy as new is broken"

Branch `fix/EUDPA-317-copy-as-new-missing-notification` in all three repos. Full
E2E **160 passed** locally with all three on that branch.

**The plan changed after a Slack exchange with Paul Hodgson on 2026-08-10.**

- **backend#74 — PARKED, do not merge.** Superseded by **EUDPA-323** (Paul, In
  Dev): `Notification` and `NotificationFulfilments` collapse into a single
  Mongo collection behind a single write/delete API, per the EUDPA-312 spike.
  That removes the dual-write problem rather than fixing it, so this PR's fix
  has nothing left to fix. Agreed with Paul to leave it alone. Close it once
  EUDPA-323 lands, after checking nothing in it is lost.
- **frontend#191 and tests#106 — rebase onto EUDPA-323 when it lands.** Paul
  expected a PR out 2026-08-10 or the morning after. These two carry the work
  that actually makes the button work.

**Note the review's suggested merge order is now inverted.** It said land
backend#74 on its own merit and hold the other two. In fact backend#74 is the
one being dropped.

**Carry-across:** frontend#191 updates `src/server/app/docs/persistence.md` to
describe a canonical-then-projection write order. That is wrong under
EUDPA-323, where there is no projection. Rewrite it during the rebase.

**This was originally split across EUDPA-317 and EUDPA-325 and that was wrong.**
One reported defect became two branch pairs never tested together. EUDPA-325 is
CLOSED and folded in; PRs frontend#192 and tests#107 closed. Do not re-split it.

### Review outcome — CONCERNS, 42 items (1 Critical, 8 Major, 33 Minor)

Index: `workareas/reviews/EUDPA-317/review-index.md` plus three per-repo files.

**Critical:** removing `isKnownJourney` leaves no check on any mutating action.
Verified independently: there is no org/user scoping anywhere in the backend
main source (zero hits for owner/orgId), and the Notification model has no owner
field — so there was never per-user scoping to lose, and the old guard was
bypassable anyway because `currentJourney` auto-adopts any loadable reference.

The part that stands regardless: the rewritten `engine/journey.test.js` now
CERTIFIES unscoped mutation as intended behaviour. That is the same failure that
caused this ticket — five tests asserting the silent redirect was correct — in
the opposite direction. Needs Sam's ruling, and a scoping ticket against the
auth work either way.

**Also flagged:** AC 4 uncovered (the delete spec deletes a fresh draft, not a
copy); `toContentDto` hand-lists 12 fields with no drift guard where sibling
mappers use MapStruct with `unmappedTargetPolicy=ERROR`; `createCopyAtReference`
is public with no `@Transactional` while its Javadoc asserts atomicity. Several
of these live in backend#74 and may evaporate with EUDPA-323 — check before
spending time on them.

## Waiting

| Work | Ticket | Next step |
|---|---|---|
| Date restrictions | EUDPA-316 | `snag-004` is `todo` and buildable — run the build loop |
| Full-width layout | EUDPA-322 | **Half done** — production change pushed, visual baseline outstanding. See below |
| Remove "What are you importing?" | EUDPA-324 | Scoped, not started. Big — see below |
| Notifications search | none yet | **Untriaged.** In `snags.txt`, no ticket |

### Date restrictions (EUDPA-316)
Ruled: restrict `arrivalDateAtPort` to 1 week back / 6 months ahead, **in the
picker and server-side** — `data-min-date`/`data-max-date` only bind the
calendar, the input stays free text. `exitDate` and
`accompanyingDocumentDateOfIssue` get **no** restriction.
**Coordination risk:** EUDPA-309 is Ready for Dev against Hamid and covers
swapping the arrival input to the MOJ picker. Read the code first and scope to
the restriction only — do not redo a control swap that has landed.

### Full-width layout (EUDPA-322) — half done, and there is a trap

**Done and pushed** on `fix/EUDPA-322-full-width-layout`: `layout.njk:57` is now
`govuk-grid-column-full`, plus a `layout.test.js` guard asserting it. Units 1459
passed. Ruling was: full width everywhere, consistency first, no opt-in.

**Outstanding:** the tests-repo visual baseline. Not started.

**THE TRAP — read before running any E2E or baseline for this ticket.** The
change is in a WORKTREE at `repos/trade-imports-animals-frontend-eudpa-322`. The
stack builds and bind-mounts the CANONICAL checkout
`repos/trade-imports-animals-frontend`, which is on another branch still reading
`two-thirds`. The tests repo drives `localhost:3000` — the stack's frontend. So
regenerating baselines as-is captures the UN-widened layout and commits
byte-plausible screenshots of the wrong thing while reporting the ACs green.
Nobody reviewing the images could tell.

Resolution: `scripts/stack/run-stack.sh -d -e frontend` and serve the worktree
natively on :3000 with `frontend.compose.yml`'s env transposed
`host.docker.internal` → `localhost`. Gate it mechanically first —
`curl -sL http://localhost:3000/this-route-does-not-exist` renders the 404 page,
which extends the shared layout, so assert the served HTML has
`govuk-grid-column-full` once and `two-thirds` zero times **before** touching
`--update-snapshots`. Baselines go on a same-named branch in its own worktree.

**Reported, not fixed** (the ticket bans restyling): ten proportional
`govuk-!-width-*` overrides across six files now scale against a full-width
container. Listed in the ticket comment.

**Generalisable lesson:** a worktree protects other agents' checkouts but
detaches you from the stack. If work in a worktree needs the stack, you must
either serve it natively or accept that every stack-driven check is testing
something else.

### Notifications search — untriaged
Reported: searching for text within a known reference returns nothing.
Preliminary dig (not a triage): the frontend just trims and forwards the term;
the backend repository has **only** exact-equality queries on
`referenceNumber` — no `Containing`, `Like` or regex. So a substring search
returns nothing by construction. But the field is labelled **"Keyword or
reference"** with a **"Search"** button, so the control does not do what it
says. Two honest options, very different sizes: make matching match the label
(backend work, and "keyword" implies more than one field), or make the label
match the behaviour. **That is a product decision — do not pick one.**

### Remove "What are you importing?" (EUDPA-324)
Scoped in `tickets/import-type-riprout-description.txt`. Key findings:
`importType` is already flow-only and never reaches the manifest, so "nothing
on the end result carries this" needs **no work**. `FLOW_ONLY_KEYS` survives as
`['declaration']`. The real work is the entry seam — `isEntrySurface`,
`entryGuardTarget`, the dashboard create-POST redirect and the flow page order
all point at that page and must move in one edit. ~51 files. Nine in-src E2E
specs drive the filter inline and bypass the journey helper.

## Standing lessons from this session

- **Run E2E locally.** `npm run test:docker-compose` in the tests repo against
  a `tim docker dev` stack. Do not wait for CI, and do not claim a test works
  without running it.
- **Red-first or it proves nothing.** Two hand-written tests here passed with
  *and* without the fix. Only running them against an unfixed build found it.
- **This codebase encodes bugs as expected behaviour.** Five tests asserted the
  silent redirect was correct; another propped up a dead `?copied=1` path. When
  a test agrees with you, check it can fail.
- **Rebuilding the stack does not prove a fix.** The asset manifest serves an
  unhashed `application.css` with a 7-day cache, so a browser shows stale CSS
  and a working fix looks broken. Hard-refresh. Ticket exists for it.
- **A second diagnosis is not a second ticket** when it explains the same
  reported symptom. Fold it into the work in flight.

## Environment at handover

All three repos on `fix/EUDPA-317-copy-as-new-missing-notification`, everything
else on `main`. Stack built from that source and healthy. Workspace repo on
`chore/EUDPA-315-snagging-workflow`, pushed.

There is a stray git worktree at `repos/trade-imports-animals-tests-eudpa-325`
holding the now-closed branch. Its commits are merged into the EUDPA-317 branch;
it can be removed with `git worktree remove`.
