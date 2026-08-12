# Handover prompt — EUDPA-315 frontend snagging

Paste the block below to the next orchestrator.

---

Pick up the EUDPA-315 frontend snagging session. Read in order:

1. `~/git/defra/trade-imports-animals-workspace/workareas/shared/frontend-snagging-eudpa315/HANDOVER.md`
2. The `snag-007` entry in `backlog.json` in that directory — it is the next build

RAILS — every one of these cost real time in previous sessions.

- BRANCHES, NEVER WORKTREES. A worktree detaches work from the stack, which bind-mounts `repos/<repo>`, and hides it from `git status`. Run `git worktree list` in each repo before you start. The two under `workareas/` belong to older programmes — leave them.
- `args` never reaches a workflow script. The `FALLBACK` const is the switch — AND you must launch by `scriptPath`, never by `name`. `Workflow({name})` runs a registry snapshot taken at session start and silently ignores your edit. That has caused two wrong-target runs, the worse one burning 57 agents and ~4.7M tokens rebuilding an already-merged increment. After launching, grep the snapshot path the tool reports back and confirm your value is in it before telling anyone what is building.
- One workflow at a time — they all write `backlog.json` and will race. If you need to add a backlog entry while one runs, stage it to a separate file and merge it in after.
- npm lockfile work needs `npx npm@11.6.2`. The wrong npm produces a lockfile `npm ci` rejects, and it passes `npm ci --dry-run` locally, so CI is the only place it shows.
- Do not edit anything under `src/` while an E2E run is in flight. The frontend hot-reloads from the bind mount, so saving a spec restarts the server and scatters `ERR_CONNECTION_RESET` across unrelated specs. It looks exactly like a real regression.

JOB 1 — remove "What are you importing?". The only unstarted item; nothing blocks it.

EUDPA-324, `snag-007`, status `todo`, `respecced: true`, `openQuestions: []`. Fully specified — read the entry rather than re-deriving it. The ticket is In Dev and assigned to Sam.

RULED 2026-08-12 (Sam): the first page when creating a notification becomes the **origin page** ("Where is this consignment coming from?"). The import-type selection moving upstream is explicitly OUT OF SCOPE — build no picker anywhere, and add no compensating default. Do not reopen either question.

THE TICKET'S SEAM LIST IS INCOMPLETE, AND THE MISSING PIECE IS THE ONE THAT WILL SINK YOU. EUDPA-324 names four seam points (`isEntrySurface`, `entryGuardTarget`, the dashboard create-POST redirect, the flow page order). There is a fifth:

`beginOpeningRun` (`flow/run-state.js:9`) has EXACTLY ONE caller in the whole tree — `import-type-filter/controller.js:99`, on the POST of the page being deleted. Verified by repo-wide grep against `origin/main`. Delete the page without moving that call and the opening run never begins for any journey. Nothing throws. It fails silently and behaviourally:

- `kit.js:91` — `runTarget` returns null when `inOpeningRun` is false, so `nextTarget` falls back to `nextInSection`. Users get raw section order instead of `RUN_STEPS` order, and the gate-skipping in `flowPageTarget` is bypassed, so pages that should be skipped are shown.
- `entry-guard.js:55` — `hasEnteredThroughFilter` really means "has the opening run begun". With no opener it is always false, so the deep-link guard stops trusting legitimate entries.

The origin controller must take that call over, and `origin/controller.test.js` must pin it — written FIRST and watched to fail, because on today's tree a passing version of that test asserts nothing.

SECOND TRAP, same file. `guardedJourneyPath` (`entry-guard.js:25-27`) deliberately excludes the entry surface from guarding so it never redirects to the page you are on. Re-point `isEntrySurface` at the origin slug in the SAME edit as `entryGuardTarget`, or a fresh journey deep-linked to origin redirects to origin forever.

WHAT NEEDS NO WORK, so nobody spends time proving it again: `importType` is not an obligation and never reaches the manifest — `bridge/scope.js:34`, `scope.js:125` and `status/completeness/leaf.js:27` all say so explicitly. No fulfilment migration, no schema change, no backfill. `FLOW_ONLY_KEYS` SURVIVES as `['declaration']` — this removes one user of the mechanism, not the mechanism, and its tests must stay alive against `declaration`.

Blast radius, measured against `origin/main`: 38 frontend files, 16 in tests, 54 total. Nine in-src E2E specs drive the filter inline via `input[name="importType"]` rather than through the `e2e/live-animals-journey.js` helper, so fixing the helper alone will not be enough.

Cut `chore/EUDPA-324-remove-import-type-page` from CURRENT `origin/main` in BOTH repos, same name in both. `main` moved twice today.

JOB 2 — copy-as-new is BLOCKED ON PAUL. Sam's instruction: ignore it until Paul is done.

He is delivering EUDPA-323 (single Mongo collection), PR frontend#195 / backend#76. `backend#74` is PARKED — close it once EUDPA-323 lands, having checked nothing is lost. `frontend#191` and `tests#106` rebase on top. On rebase, `frontend#191` edits `docs/persistence.md` to describe a canonical-then-projection write order, which is wrong under a single record — rewrite it.

There is a verified divergence in Paul's branch, drafted and NOT sent, at `workareas/.../paul-copy-divergence.md`: `NotificationCopyMapper.toCopyDto` keeps its reset rules while copying `fulfilments` verbatim, so a copy carries every answer in `fulfilments` and nulls in the typed fields on the SAME document — the journey shows a complete copy, the dashboard shows blanks. Verified at backend `1066cfac`. Re-verify against his current head before raising it; he is committing daily.

Prior review analysis is banked at `workareas/reviews/EUDPA-317/` — 62 findings, 14 confirmed, 44 refuted. Re-triage against Paul's shape first; much of the backend surface is being deleted. The refutations are the valuable half.

JOB 3 — the rest.

- **Notifications search — SETTLED, do not re-triage.** Ruled WON'T FIX 2026-08-10 (Sam) and deliberately never raised as a ticket. It lives as a comment at the foot of `snags.txt` so the loader cannot re-report it. Earlier handovers wrongly called it an open product decision; it is not.
- `dashboard-one-third.png` is still untracked at the workspace root — Sam's to bin or keep.

WHAT LANDED THIS SESSION

EUDPA-316, the arrival-date restriction, merged as frontend `6cbdd3be` and tests `3f013932`. `arrivalDateAtPort` is restricted to 1 week back / 6 months ahead, inclusive, in the picker AND on the server. `exitDate` and `accompanyingDocumentDateOfIssue` are untouched per the ruling. The full `review` skill ran against it: PASS WITH NOTES, 23 items, all resolved — 18 fixed, 2 declined on Sam's rulings, 3 dropped.

STANDING RULES — several were violated across these sessions and corrected.

- **Do not pile explanatory comments into the code.** Rationale belongs in the commit message, the ticket and `docs/`. Roughly a dozen justification blocks had to be reviewed out. Default to remove.
- **Do not spray `govuk-!-` overrides.** Four repeated across eight elements is a component rebuilt from utilities. State a repeated pattern once in the component's stylesheet. Note govuk styles by CLASS, not element — a bare `<dt>`/`<dd>` renders in Times, so something must style it; the only question is where.
- **Never say "pre-existing", "not mine" or "separate issue".** In the file you're touching? Fix it.
- **Do not invent parallel workstreams.** No "belongs to a follow-up pass", no proposing tickets for things you could just do.
- **No tolerance-based layout tests.** Visual baselines for appearance; binary checks like horizontal overflow are fine. Card action wrapping is accepted behaviour.
- Run E2E locally — `npm run test:docker-compose` against a `tim docker dev` stack. Don't wait for CI.
- **Red-first or a test proves nothing.** This codebase encodes bugs as expected behaviour; a test agreeing with you is not evidence.
- Rebuild assets and hard-refresh. The unhashed `application.css` has a 7-day cache, and a stale bundle against new markup produces layouts that exist nowhere in the code.
- Reference work by headline, not ticket number. Don't claim something is verified unless you ran it.
- Sam makes the product and style calls. Where something is relatively obvious, make the call and flag it rather than gating on him — but genuine trade-offs go to him.

ASSUME YOUR OWN NEW TESTS ARE VACUOUS UNTIL YOU HAVE WATCHED THEM FAIL.

Two written this session passed while proving nothing. One built its expected value by calling the same production function that rendered the cell it asserted against, so a format regression moved both sides together. The other re-entered a page via `journey.toArrivalDetails()` to check a rejected value had not saved — but that helper starts a NEW notification, so the field was empty either way. The fix pins the URL as unchanged across the round trip. Neither was caught by reading; both were caught by forcing a failure.

CI IS UTC, SO IT CANNOT SEE A TIMEZONE BUG.

A broken version of the date helpers passed the FULL CI suite and was caught only by running the features suite locally under BST. date-fns' `startOfDay` and `format` normalise to LOCAL time; `test:features` sets no `TZ`, so the Playwright drivers run on the developer's clock, and a midnight-UTC date became 23:00 the previous day — 12 September rendered as 11 September. GitHub runners are UTC, so it could not surface there.

- `TZ=UTC` on every vitest script makes the unit suite blind to this by construction. The features suite is the only guard, and only because it does NOT set `TZ`. If someone adds it there for determinism, the guard disappears.
- `calendar.js` states its invariant at the top: every Date is midnight UTC regardless of process timezone. date-fns survives only where it is timezone-safe — `addDays`/`addMonths` preserve wall-clock time. Do not reintroduce `startOfDay` or `format` there.
- The service container runs UTC while users keep London days, so `startOfDayInZone(now, 'Europe/London')` in `arrival-window.js` is load-bearing, not ceremony. Removing it reintroduces a one-hour-a-day window error for half the year.

THE CI TRAP, because it will bite again.

A branch-tagged Docker image in a peer repo pins E2E to whenever that image was last built. `run-stack.sh` probes Dockerhub (`docker manifest inspect defradigital/<image>:<sanitised-branch>`), not git, so the tag outlives the branch and ages while `main` moves.

- Deleting the git branch makes it worse — the tag survives and nothing can refresh it. Recreate from `main` and re-publish (`gh workflow run publish-branch.yml --ref <branch>`; pull_request/workflow_dispatch only, a bare push publishes nothing). Prove the overwrite with a manifest fingerprint.
- A `workflow_dispatch` E2E run won't update the PR check — `report-e2e-status` is gated on a `pull_request` trigger. Close and reopen the PR. Concurrency is keyed on branch with `cancel-in-progress`, so a second dispatch kills the first. **A `gh run rerun --failed` DOES update the check**, because it keeps the original event — use that for a flake.
- Diagnostic: the same tests image passing then failing, with the branch head unmoved, means the variable is a peer repo's `:latest`.
- Not every red is a defect. One E2E failure this session was a Docker Hub registry timeout pulling a peer image, so the stack never came up and nothing was tested. Read the failure before diagnosing the branch.
