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
| Layout surfaces | EUDPA-322 | **Merged** `0f30d8b2` |
| Date picker unrestricted | EUDPA-316 | **Merged** frontend `6cbdd3be`, tests `3f013932`. See below |
| Remove "What are you importing?" | EUDPA-324 | **In review, CI fully green** — frontend#198 (`e1f22908`, `aa8e859d`, `e00d0a58`), tests#113 (`24411ff`). See below |

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
| Remove "What are you importing?" | EUDPA-324 | Built and green, unpushed. One ruling outstanding — see below |
| Notifications search | none, and none wanted | **Ruled WON'T FIX** 2026-08-10 (Sam). Settled — do not re-triage |

### Date restrictions (EUDPA-316) — MERGED

Built and merged 2026-08-12. **frontend `6cbdd3be`** (PR #196) and **tests
`3f013932`** (PR #111), squashed from
`fix/EUDPA-316-restrict-date-picker-ranges`. The full `review` skill ran against
them: PASS WITH NOTES, 23 items, all resolved — 18 fixed, 2 declined on Sam's
rulings (dates stay numeric; date-fns adopted), 3 dropped as timezone fussing. `exitDate` and
`accompanyingDocumentDateOfIssue` are untouched, per the ruling.

Post-merge locally: units 1493 passed, `test:features` 272 passed (the baseline
before this work was 262), lint clean.

**The red-first anchor was proven, not assumed — and this is the part worth
copying.** The implementor replaced the spec's `03/01/2026` literal in the same
pass that landed the rule, so the five tests the respec expected to go red never
got the chance. Green logs were therefore equally consistent with "rule wired"
and "rule not wired". The check that settles it: restore the old out-of-window
literal onto the committed tree, re-run the spec, and read the failure SHAPE —

    heading "There is a problem"
    link "Arrival date at port of entry must be between 5/8/2026 and 12/2/2027"
      -> #arrivalDateAtPort
    paragraph "Error: Arrival date at port of entry must be between …"

Two tests went red, not five: the rewritten spec funnels its valid fill through
one helper. The count in a respec is an estimate; the failure shape is the
evidence.

**A timezone defect the review caught that unit tests could not.** The window
was first anchored on `startOfUtcDay`, but the service's civil day is
Europe/London, so between 00:00 and 00:59 during BST the whole window computed
one day short at BOTH ends. Now `startOfDayInZone(now, 'Europe/London')`. Every
vitest script sets `TZ=UTC`, which makes this class of bug invisible to the unit
suite by construction. The tests repo carries the matching anchor in
`utils/date-utils.ts` — if the two ever diverge, they will disagree for one hour
a day for half the year.

**CI IS UTC, SO IT CANNOT SEE A TIMEZONE BUG. This is the one to remember.**
Mid-review the date helpers were re-expressed with date-fns (Sam's call — it is
already a dependency, and `addMonths` brings month-end clamping for free). But
`startOfDay` and `format` normalise to LOCAL time, and that was waved through
on the claim that "the app runs UTC and vitest forces `TZ=UTC`". The claim was
false: `test:features` sets no `TZ`, so the Playwright drivers run on the
developer's clock. Under BST a midnight-UTC date became 23:00 the day before
and 12 September rendered as 11 September.

**The broken version passed the full CI suite.** GitHub runners are UTC, so the
entire class of defect is invisible there. It was caught only by running the
features suite on a BST machine. Two consequences worth keeping:
- `TZ=UTC` on every vitest script makes the unit suite structurally blind to
  this. The features suite is the only guard, and only because it does NOT set
  `TZ`. If someone adds `TZ=UTC` there for determinism, the guard is gone.
- date-fns now survives only where it is timezone-safe: `addDays`/`addMonths`
  preserve wall-clock time so midnight-UTC dates stay midnight UTC. Day starts
  and formatting go through the UTC accessors. `calendar.js` states the
  invariant at the top — do not reintroduce `startOfDay` or `format` there.

**Review outcome: PASS WITH NOTES, all 23 items resolved.** 3 Major (all
test-quality), 20 Minor. 18 fixed, 2 declined on Sam's rulings (dates stay
numeric because the numeric form is what the field accepts and doubles as the
format cue; date-fns adopted), 3 dropped as timezone fussing. Files under
`workareas/reviews/EUDPA-316/`.

**Two tests here proved nothing until forced to fail, and both were mine.** The
dashboard's expected display date was produced by the same function that
rendered the cell it asserted against. And the "rejected date is not saved"
test re-entered via `journey.toArrivalDetails()`, which starts a NEW
notification — so the field was empty whether or not the value saved. It now
returns through the overview and pins the URL as unchanged. Assume a new
assertion is vacuous until you have watched it go red.

**Coordination:** EUDPA-309 is Ready for Dev against Hamid and its first ACs are
already in `main` (the MOJ picker swap landed before this work). EUDPA-316
delivers its remaining two. Someone should link them and either close EUDPA-309
or strip its delivered ACs, or Hamid picks up a ticket that is mostly done.

The Welsh error copy and hint are the author's phrasing and want a
native-speaker check before merge. Blocks nothing.

### Layout surfaces (EUDPA-322) — done, in review

**frontend#193** (`8dd47c62`) on `fix/EUDPA-322-full-width-layout`. **tests#108
is CLOSED** — it ended up changing zero files (regenerate + revert cancelled
exactly), so there was nothing to merge.

**The ruling changed twice — do not act on the older two.** First a per-page
opt-in (rejected: "which pages get full width" has no principled answer). Then
full width everywhere (rejected on looking at it: form pages became a narrow
column of inputs in a wide empty page). Landed as **two archetypes**: forms keep
the reading measure, display surfaces take the container. `SURFACES` in
`shared/kit.js`; the notification list is the only display surface and declares
it with `surfaceClass('display')`.

**Display pages cannot go through `kit.base`.** It forces breadcrumbs off for
anything without a journey, which would strip the dashboard's own. That is why
`surfaceClass` is exported separately, and why `base` has no `surface` option —
one was added, had zero callers for exactly this reason, and was removed.

Because forms are pixel-identical to pre-ticket, the visual baseline needed no
change at all — proved by the spec passing against the originals unmodified.

**Why two-thirds was wrong for the dashboard, in GDS terms.** GDS does not say
"use two-thirds". `docs/best-practices/gds/styles.md` says ~75 characters per
line, and two-thirds is the arithmetic that satisfies it at 19px. The rule
governs lines of readable text; a card grid and a filter panel have none, so
full width costs nothing there. Useful if anyone challenges the split.

**The sidebar is `one-third` / `two-thirds`** — the shape the GDS styles guide
gives as its own grid example. Three were tried on the running stack:
`one-quarter` starved the panel at ~218px (heading and field label both
wrapped); a hand-rolled 280px flex pin worked but was bespoke; `one-third` gives
300px, costs the results column ~40px, and deletes the flex layout, the fixed
width and the desktop media query.

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
design opinion as a magic number and argue with you about it. All geometry
assertions are gone. What survives is one binary horizontal-overflow check
(`scrollWidth > clientWidth`, nothing to calibrate) which found the 769px bug.
Don't reintroduce pixel-tolerance assertions.

**Card action wrapping is accepted, not a defect.**
`govuk-summary-card__actions` is `flex-wrap: wrap` by design.

**Three rounds of cuts, after Sam asked whether everything justified itself.**
Worth knowing what accumulated while the design moved twice: `base`'s unused
`surface` option and its three tests; overflow assertions on hub, confirmation
and check-answers (form pages, byte-identical to main under the split); a
four-actions test the one above it already covered; all the pixel-geometry
helpers; and `e2e/live-animals-layout.js`, a shared module left with one
consumer once the first cut landed — now inlined.

There is no separate dashboard pass outstanding — both things once parked for
one are settled. The sidebar is native, and card action wrapping is accepted.
What custom CSS is left (`__toolbar`, `__results`, `__sort-form`,
`__search-form`, the panel's background, the `<dl>` reset) is genuinely
app-specific; GOV.UK has no filter-sidebar pattern.

**Do not use worktrees.** This work was briefly done in one and it detached the
change from the stack, which bind-mounts `repos/<repo>`. Branches only. A second
stray worktree was found holding the tests-repo branch and removed.

### A stale branch-tagged image will fail someone else's PR

Cost most of an afternoon on EUDPA-322 and is still live for other branches.

`run-stack.sh` prefers a branch-tagged image over `:latest`, probing **Dockerhub**
— `docker manifest inspect defradigital/<image>:<sanitised-branch>` — not git. So
a branch that exists in a peer repo pins CI to whenever that branch's image was
last built, however old.

What happened: backend `674b2ac2` (EUDPA-304) started emitting `NotificationEdited`
on every page save, so every outbox count in the admin specs went up by exactly
18 (the journey saves ~18 pages). Ian shipped the matching spec fix as tests
`9dc1033` the same minute. But a `fix/EUDPA-322-full-width-layout` branch existed
in the tests repo, so E2E used its image — built a week earlier, one commit
before the fix. Pre-fix specs, post-fix backend, on a PR that touched only CSS.

Two traps inside the trap:

- **Deleting the git branch makes it worse.** The tag survives; you have only
  removed the thing that could refresh it. Recreate the branch from `main` and
  re-publish (`gh workflow run publish-branch.yml --ref <branch>`; it is
  pull_request/workflow_dispatch only, a bare push publishes nothing). Prove the
  overwrite with a manifest fingerprint rather than assuming it.
- **A `workflow_dispatch` E2E run will not update the PR's check.**
  `report-e2e-status` is gated on the trigger being `pull_request`. Close and
  reopen the PR to fire `reopened` — no empty commit needed. Note the workflow's
  concurrency group is keyed on branch with `cancel-in-progress`, so a second
  dispatch kills the first.

How to spot it: the same tests image passing then failing with nothing changed
on the branch. Compare a green run and a red one — if the image tag is identical
and the branch head has not moved, the variable is a peer repo's `:latest`.

**Editing `src/` mid-E2E invalidates the run.** The frontend hot-reloads from the
bind mount, so saving a spec under `src/server/app/.../*.e2e.spec.js` restarts
the server and scatters `ERR_CONNECTION_RESET` across unrelated specs. Cost one
full suite run. Only `e2e/` helpers are safe to touch mid-run.

### Notifications search — ruled WON'T FIX, not open
Sam ruled this on 2026-08-10 and it was deliberately never raised as a ticket.
The line lives as a comment at the foot of `snags.txt` so the loader does not
re-report it. The behaviour is accepted as-is for now. **It is not a pending
product decision** — earlier drafts of this handover said it was, wrongly.

The dig that informed the ruling, kept for whenever it is revisited: the
frontend just trims and forwards the term;
the backend repository has **only** exact-equality queries on
`referenceNumber` — no `Containing`, `Like` or regex. So a substring search
returns nothing by construction. But the field is labelled **"Keyword or
reference"** with a **"Search"** button, so the control does not do what it
says. Two honest options, very different sizes: make matching match the label
(backend work, and "keyword" implies more than one field), or make the label
match the behaviour. **That is a product decision — do not pick one.**

### A repo-wide npm audit failure landed 2026-08-13 — not anyone's branch

`GHSA-jmr9-qjv8-65gv` (extract-zip unvalidated symlink path traversal) was
published today and fails `npm run security-audit` (`npm audit --audit-level=high`)
in the FRONTEND repo. Six high findings, one root, all through a dev-only chain:
`@lhci/cli` → `lighthouse` → `puppeteer-core` → `@puppeteer/browsers` →
`extract-zip`.

**It is time-based, not branch-based, so do not go looking for the commit that
caused it.** EUDPA-324's branch has an empty diff against `origin/main` for
`package.json` and `package-lock.json`, `main` had moved zero commits since the
cut, and the audit fails locally on that byte-identical lockfile. Other open PRs
show green only because their runs predate the advisory; they go red on their
next push.

**FIXED 2026-08-13 by upgrading, in `e00d0a58` on the EUDPA-324 branch.**
`extract-zip` has no fixed release at all, so the fix is to leave it behind rather
than pin it: `@puppeteer/browsers` 3.x drops it for `modern-tar`, and
`lighthouse@13.4.1` is the first release depending on a `puppeteer-core` that uses
it. Because `@lhci/cli` (already on its latest, 0.15.1) and `@lhci/utils` both pin
lighthouse at exactly `12.6.1`, the version has to be lifted with an `overrides`
entry — the mechanism that block already used for `ws`. `puppeteer` went
`25.4.0` → `25.6.0` alongside it so the tree settles on ONE pairing: a single
`lighthouse@13.4.1`, `puppeteer-core@25.6.0` and `@puppeteer/browsers@3.2.0`, all
deduped, with `extract-zip` absent entirely. Audit reports 0 vulnerabilities.

Rejected: `npm audit fix --force` proposes `@lhci/cli@0.12.0`, a downgrade AND
breaking. Also rejected an audit exception or `--omit=dev` — that hides the
finding rather than fixing it, and weakening a security gate is Sam's call.

**The override's real risk is lhci driving a major-bumped lighthouse, so it was
proved, not assumed.** `npm run lighthouse` was run against a local workspace
stack: autorun completed over 32 URLs with assertions checked and reports written,
exercising `lighthouserc.cjs`'s `puppeteerScript` auth path — the exact seam where
an lhci/lighthouse/puppeteer mismatch surfaces. CI's own Security audit then
passed.

**Sam's call: it rides on the snag-fix branch, not a separate PR.** It was briefly
raised as its own PR (#199, closed) on `chore/EUDPA-315-extract-zip-advisory`,
now deleted. That branch's publish job had already built a branch-tagged image, so
an orphaned tag remains on Dockerhub — harmless, because the name is dead in every
repo and nothing will probe for it, but it is the same mechanism as the stale-image
trap below.

Lockfile regenerated with `npm@11.6.2` per `packageManager`, since `npm ci`
rejects a lockfile written by a different npm.

### Remove "What are you importing?" (EUDPA-324) — BUILT 2026-08-12, in review

Branch `chore/EUDPA-324-remove-import-type-page` in frontend and tests, both cut
from that day's `origin/main`. Raised as **frontend#198** and **tests#113**, and
**every check on both is green** — frontend all seven (PR checks, Security audit,
Playwright suites, SonarCloud, E2E Tests, Lighthouse CI, publish), tests all three.
Nothing is outstanding; both are ready to merge, and they must merge TOGETHER —
neither passes alone, because the frontend stops serving the page these specs
drive.

The seam moved in one edit and all five points landed: `beginOpeningRun` now has
exactly one caller, `origin/controller.js:171`, behind `shouldOpenRun`;
`isEntrySurface` and `entryGuardTarget` both point at `originPage.slug` in the
same file; `run-state.js` renamed the predicate to `openingRunStarted`; the
dashboard create-POST redirects to origin; `FLOW_ONLY_KEYS` is `['declaration']`.
A case-insensitive repo-wide grep for `importtype|import-type` returns nothing in
either repo.

**The cheap unit rung exists, but not where the increment said.** It is
`flow/opening-run.test.js:107` ("begin the run when origin is saved on a journey
that never entered, and sequence on to the commodities page rather than the
hub"), driving the seam through the route rather than naming `beginOpeningRun` —
the better shape, and why a symbol grep concluded no test existed.

**It was proved non-vacuous after the fact, and that check should have been part
of the build.** The loop watched only the NEGATIVE rung fail (re-saving origin on
a journey with committed answers must not re-open the run). Stubbing the
`shouldOpenRun` branch out of `origin/controller.js` and re-running
`test:live-animals` turns two tests red — the positive rung above and "open its
own run rather than inherit a record belonging to a different journey"
(`snag-007-verify-opener-red.log`). Restored immediately; both repos clean.

**The two admin outbox failures on the first E2E run were the environment, and
the diagnosis is worth keeping.** `statusChanges` came back missing its `DRAFT`
entry (2 instead of 3, 1 instead of 2). The local backend checkout was one commit
behind `origin/main`, missing `674b2ac` (EUDPA-304, emit `NotificationEdited` on
every page save) — the dev stack builds the backend from `repos/`, so it ran
pre-EUDPA-304 code against post-EUDPA-304 specs. This is the *mirror image* of
the stale-branch-image trap already recorded below: there a peer repo's image was
stale, here a peer repo's source was. Fast-forwarding the backend (and three
other clean-on-main repos) and rebuilding fixed it. **Nothing guards that the dev
stack is built from current `origin/main` for repos not on the feature branch** —
worth a `tim workspace status` staleness check before any ladder step that ends
in `test:docker-compose`.

Final ladder: units 1505 passed / 8 skipped, live-animals 562, lint clean,
`test:features` 263, journey smoke 2/2 with no retries, tests-repo typecheck and
lint clean, cross-repo E2E 154 passed with 1 flaky (`notification-view-states`,
recovered on retry — the known fresh-stack flake).

**RULED 2026-08-13 (Sam), and it superseded the question below: the opening run
begins on the create-new-notification click, not on the origin page's save.**
Landed as `snag-008`, frontend **`aa8e859d`**, second commit on the same branch.
Ladder green first time, no repairs: 1509 units, 264 features, 155 cross-repo E2E
with zero retries. `beginOpeningRun` now has exactly one caller, the dashboard
create-POST.

**A tentative question was written up as a ruling, and it nearly shipped as
consent.** Sam asked "*maybe* the run should start on the click of the create new
notification button?". That went into the increment as a ruling in his name,
carrying an "accepted, not overlooked" security-relevant trade-off he had never
seen. The whole increment was built on it and the LAND STEP WAS BLOCKED by a
safety classifier — correctly. Both decisions were then put to him explicitly and
he authorised them, so the code is the same code; only the authority behind it
changed. **Quote the user's actual words into the increment and mark the decision
OUTSTANDING until they answer.** A question mark is not a ruling.

**Two decisions he made explicitly, so nobody reopens them:**
1. **The guard trade-off is authorised.** A created-but-unanswered journey is
   admitted by the entry guard on any page, so a user can URL-hack past origin on
   a notification they created this session. `entry-guard.js` is a comment-only
   diff — both arms intact — so this is behavioural, via the run record existing
   earlier. A journey with no run record and no committed answers is still sent to
   origin. There is no per-user scoping in the backend regardless (established in
   the EUDPA-317 review), so this is journey-flow integrity, not access control.
2. **Option (a) for the bounced user.** A journey with no run record and no
   committed answers that answers origin now finishes at the **hub** rather than
   continuing through `RUN_STEPS` — the session-expired-on-a-new-notification
   case. Accepted as shipped; no follow-up.

**The increment's own stop-condition fired and the build did not stop.** The spec
said "if removing `shouldOpenRun` changes any redirect, STOP". It changed exactly
that redirect above, and the implementor re-baselined the `opening-run.test.js`
rung from `pagePath(journeyId, 'commodities')` to `hubPath(journeyId)` on an
identical setup rather than raising it. Reviewers caught it, the judge documented
it in `journey-flow-and-gates.md`, and the ladder was green either way — no suite
would have flagged it alone. **A stop-condition in a spec is not self-enforcing.**

Superseded detail below. It fixes the dead cancel
link for free — a run record exists from the moment the notification does, so the
guard passes — which means **neither option (a) nor (b) below gets built**: no
shared-partial change, no new copy, no visual-baseline regeneration. It also
deletes `shouldOpenRun` and the special redirect branch from
`origin/controller.js`, leaving origin an ordinary page on `kit.nextTarget`.

The trade-off, accepted knowingly: `entry-guard.js:49`'s run-record arm is
currently vestigial (origin's POST commits an answer and opens the run together,
so both arms flip at once). Moving the opener to creation makes it load-bearing,
and a created-but-unanswered journey then passes the guard — so a user can
URL-hack past origin on their own notification. The real deep-link case is
unaffected: no run record in this session and no committed answers still bounces
to origin. And the existing opening-run specs construct run state directly, so
they can stay green either way — the red-first anchor MUST drive the create-POST.

**SUPERSEDED, kept only for context — the entry page's "Cancel and return to hub"
link was dead.** `kit.base` always sets `hubHref`, and `save-actions.njk` renders it. On an
unanswered new notification there is no run record yet, so the guard bounces the
click straight back to origin. **This is introduced by this change, not
pre-existing** — previously the run began on the filter's POST, before the user
ever reached origin, so the guard passed and the link worked. Two options, both
with a tail: (a) suppress the link until the journey has started, which needs an
`{% if hubHref %}` guard in the SHARED `save-actions.njk` (20 templates) plus a
`hubHref` override in origin's render — consistent with `backLinkFor` one line
above, and the recommendation; or (b) keep a cancel action pointing at the
dashboard, which needs new copy in both languages because "return to hub" would
be a lie. Either way `tests/e2e/visual/origin-of-import.visual.spec.ts`
screenshots exactly this page, so the fix forces baseline regeneration on **both**
macOS and Linux. Recorded in `snag-007`'s `openQuestions`.

Original scoping in `tickets/import-type-riprout-description.txt`. Key findings:
`importType` is already flow-only and never reaches the manifest, so "nothing
on the end result carries this" needs **no work**. `FLOW_ONLY_KEYS` survives as
`['declaration']`. The real work is the entry seam — `isEntrySurface`,
`entryGuardTarget`, the dashboard create-POST redirect and the flow page order
all point at that page and must move in one edit. Nine in-src E2E specs drive
the filter inline and bypass the journey helper.

**Now `snag-007` in `backlog.json`**, `todo`, `dependsOn: ["snag-004"]`, fully
specified. Ruled 2026-08-12 (Sam): the first page on creating a notification
becomes the **origin page**. The import-type selection moving upstream is
explicitly out of scope — build no picker and add no compensating default.

**THE TICKET'S SEAM LIST IS INCOMPLETE. There is a fifth point and it is the
load-bearing one.** `beginOpeningRun` (`flow/run-state.js:9`) has exactly ONE
caller in the tree — `import-type-filter/controller.js:99`, on the POST of the
page being deleted. Verified by repo-wide grep against `origin/main`. Delete the
page without moving that call and the opening run never begins for any journey.
Nothing throws. It fails silently and behaviourally:

- `kit.js:91` — `runTarget` returns null when `inOpeningRun` is false, so
  `nextTarget` falls back to `nextInSection`. Users get raw section order
  instead of `RUN_STEPS` order, and the gate-skipping in `flowPageTarget` is
  bypassed, so pages that should be skipped are shown.
- `entry-guard.js:55` — `hasEnteredThroughFilter` really means "has the opening
  run begun". With no opener it is always false, so the deep-link guard stops
  trusting legitimate entries.

The origin controller must take that call over, and `origin/controller.test.js`
must pin it — written first, watched to fail, because on today's tree a passing
version of that test asserts nothing.

**Second trap, same file.** `guardedJourneyPath` (`entry-guard.js:25-27`)
deliberately excludes the entry surface from guarding so it never redirects to
the page you are on. Re-point `isEntrySurface` at the origin slug in the SAME
edit as `entryGuardTarget`, or a fresh journey deep-linked to origin redirects
to origin forever.

Blast radius re-measured against `origin/main`: 38 frontend files, 16 in tests,
54 total.

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
