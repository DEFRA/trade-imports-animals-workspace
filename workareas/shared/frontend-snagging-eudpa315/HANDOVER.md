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
- **Editing `FALLBACK` is necessary but NOT sufficient. You must also launch by
  `scriptPath`, never by `name`.** `Workflow({name: 'increment-build-loop'})`
  resolves a registry snapshot taken at session start, so it runs the script as
  it was when the session opened and silently ignores your edit. This is the
  same trap as the bullet above and it has now fired twice: on 2026-08-10 it
  rebuilt already-merged `snag-003` and ran a full review pass over parked
  `snag-001` — 57 agents, ~4.7M tokens, nothing committed, nothing wanted. The
  edit was in the file; the executed copy still had the old value. Always:

      Workflow({ scriptPath: '<abs>/.claude/workflows/increment-build-loop.js' })

  and before trusting the run, `grep -n "const FALLBACK"` the snapshot the tool
  reports back. Do not tell anyone what the loop is building until you have.
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
| Date restrictions | EUDPA-316 | `snag-004` is `todo` and buildable — the only thing left not started |
| Layout surfaces | EUDPA-322 | **Done, in review.** frontend#193 + tests#108. See below |
| Dashboard display pass | none yet | Amending-card wrap + the sidebar's remaining custom CSS. See below |
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

### Layout surfaces (EUDPA-322) — done, in review

**frontend#193** (`576df6bd`) and **tests#108** (`41f8e2d`), both on
`fix/EUDPA-322-full-width-layout`. Land together.

**The ruling changed twice — do not act on the older two.** First a per-page
opt-in (rejected: "which pages get full width" has no principled answer). Then
full width everywhere (rejected on looking at it: form pages became a narrow
column of inputs in a wide empty page). Landed as **two archetypes**: forms keep
the reading measure, display surfaces take the container. `SURFACES` in
`shared/kit.js`; `kit.base` takes `surface`, defaulting to `form`; the
notification list is the only display surface.

Because forms are now pixel-identical to pre-ticket, tests#108 is a **revert** of
the baselines regenerated for the abandoned version — proved by the visual spec
passing against the originals.

**Three defects fixed on the way, all found by looking rather than by tests:**
- Card fields left a fifth of the card blank: the grid declared four columns
  (`30% 25% 25% 20%`) while every row had three children. The count lived in CSS
  and the children in markup, so they drifted. Now `govuk-grid-row` +
  `govuk-grid-column-one-third`.
- Card values sat 40px right of their titles — the user-agent `<dd>` indent,
  unmasked when a custom rule was swapped for `govuk-!-margin-bottom-0`.
- 7px horizontal overflow at 769px: `flex-shrink: 0` pinned the sort form at
  content width so its own `flex-wrap` never fired.

**Sam ruled tolerance-based layout tests are not worth having** — they encode a
design opinion as a magic number and argue with you about it. Geometry
assertions were pulled back, not extended. What survives is the binary
horizontal-overflow check and the one pre-existing wrap check the ACs name.
Don't reintroduce pixel-tolerance assertions.

### Dashboard display pass — not started

Two known items, both deliberately left:

- **The amending card's four actions wrap** (Resume, Copy as new, Cancel
  amendment, Delete). Present on `main` and never detected, because no check
  existed. "Cancel amendment" is much longer than the submitted card's labels.
  This is the original snag surviving on a different status.
- **The filter sidebar is the last custom CSS block** — `__layout`, `__filters`
  (280px), `__main`, `__toolbar`, `__sort-form`, `__search-form`. GOV.UK has no
  sidebar-filter pattern, but `__filters`/`__main` could plausibly become
  `govuk-grid-column-one-quarter` / `three-quarters`.

**Do not use worktrees.** This work was briefly done in one and it detached the
change from the stack, which bind-mounts `repos/<repo>`. Branches only. A second
stray worktree was found holding the tests-repo branch and removed.

**Editing `src/` mid-E2E invalidates the run.** The frontend hot-reloads from the
bind mount, so saving a spec under `src/server/app/.../*.e2e.spec.js` restarts
the server and scatters `ERR_CONNECTION_RESET` across unrelated specs. Cost one
full suite run. Only `e2e/` helpers are safe to touch mid-run.

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

**Branches, not worktrees.** Both worktrees this session created have been
removed. Use `git checkout` or `tim workspace branch <name>`. A worktree
detaches the work from the stack's bind-mount of `repos/<repo>` and hides it
from `git status` in the canonical checkout — both bit this session. The two
worktrees remaining under `workareas/` belong to older programmes; leave them.
