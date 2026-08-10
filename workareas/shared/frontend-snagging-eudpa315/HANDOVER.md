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

## In flight — three PRs, land together or not at all

**EUDPA-317, "Copy as new is broken".** Branch
`fix/EUDPA-317-copy-as-new-missing-notification` in **all three** repos.

- backend#74 — backend owns the write, both aggregates in one idempotent call
- frontend#191 — session guard removed, `?actionUnavailable=` banner, dead
  `?copied=1` deleted
- tests#106 — content carries over, actions on session-foreign rows, banner

Full E2E **160 passed** locally with all three repos on that branch. A merge of
any one alone leaves the button broken in a different way.

**This was originally split across EUDPA-317 and EUDPA-325 and that was wrong.**
One reported defect became two branch pairs that had never been tested together.
EUDPA-325 is now CLOSED and folded in; PRs frontend#192 and tests#107 closed.
Do not re-split it.

`review` skill was running against these branches at handover; its findings had
not landed. **Verify anything it reports before relaying it.**

## Waiting

| Work | Ticket | Next step |
|---|---|---|
| Date restrictions | EUDPA-316 | `snag-004` is `todo` and buildable — run the build loop |
| Full-width layout | EUDPA-322 | Needs a decision: which pages opt in. Not started |
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
