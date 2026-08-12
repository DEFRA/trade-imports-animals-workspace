# Handover prompt — EUDPA-315 frontend snagging

Paste the block below to the next orchestrator.

---

Pick up the EUDPA-315 frontend snagging session. Read in order:

1. `~/git/defra/trade-imports-animals-workspace/workareas/shared/frontend-snagging-eudpa315/HANDOVER.md`
2. `~/git/defra/trade-imports-animals-workspace/workareas/shared/frontend-snagging-eudpa315/backlog.json` — the `snag-004` entry only, it is the next build

RAILS — every one of these cost real time in previous sessions.

- BRANCHES, NEVER WORKTREES. `git checkout` or `tim workspace branch <name>`. A worktree detaches work from the stack, which bind-mounts `repos/<repo>`, and hides it from `git status`. Two stray worktrees have been found and removed across two sessions; check `git worktree list` before you start.
- `args` never reaches a workflow script. The `FALLBACK` const is the switch — AND you must launch by `scriptPath`, never by `name`. `Workflow({name})` runs a registry snapshot taken at session start and silently ignores your edit. That has now caused two wrong-target runs, the second burning 57 agents and ~4.7M tokens rebuilding an already-merged increment. After launching, grep the snapshot path the tool reports back and confirm your value is in it before telling anyone what is building.
- One workflow at a time — they all write `backlog.json` and will race.
- npm lockfile work needs `npx npm@11.6.2`, not local npm. The wrong npm produces a lockfile `npm ci` rejects, and it passes `npm ci --dry-run` locally, so CI is the only place it shows.
- DO NOT EDIT ANYTHING UNDER `src/` WHILE AN E2E RUN IS IN FLIGHT. The frontend hot-reloads from the bind mount, so saving a spec restarts the server and scatters `ERR_CONNECTION_RESET` across unrelated specs. It looks exactly like a real regression. Cost a full suite run.

JOB 1 — the arrival-date restriction. This is the only unstarted item and nothing blocks it.

EUDPA-316, `snag-004` in `backlog.json`, status `todo`, `respecced: true`, `openQuestions: []`. It is fully specified — read the entry rather than re-deriving it.

Restrict `arrivalDateAtPort` to 1 week back / 6 months ahead, **in the picker AND server-side**. `data-min-date`/`data-max-date` only bind the calendar; the input stays free text, so a server rule is required too.

Already verified, treat as established:
- The MOJ picker swap has LANDED. `port-of-entry.njk:16` already uses `mojDatePicker`. EUDPA-309 is Ready for Dev against Hamid and covers that swap — do not redo it. Scope to the restriction only.
- The MOJ macro takes `minDate`/`maxDate` as `dd/mm/yyyy` strings and maps them to `data-min-date`/`data-max-date`. Confirmed in the installed template.
- `kit.dateField` (`shared/kit.js`) builds the picker view model and currently passes no bounds.
- `dateText` (`lib/validate/validators.js:190`) validates the string is a real calendar date and applies no bound. `integerInRange` in the same file is the house idiom for a range validator — follow it.
- `fields()` in `port-of-entry.controller.js` is called per request, so computing the window there is drift-free.

The respec's own decisions, already made: bounds inclusive; UTC whole-day comparison; `addUtcMonths` clamps to the last day of the target month (31 Aug + 6 months is 28/29 Feb, not 3 Mar); the window computed ONCE per request and threaded into both `fields()` and `render()` so the calendar and the server rule cannot straddle midnight and disagree; frontend only, no backend change.

Red-first anchor the respec identifies: `arrival-transit.e2e.spec.js` fills `03/01/2026`, already outside the new window, so five existing tests go red the moment the server rule lands and stay red until the literal is replaced. If they do not go red, the rule is not wired.

The Welsh error copy in the respec is the author's own phrasing and wants a native-speaker check before merge. It blocks nothing.

JOB 2 — copy-as-new is BLOCKED ON PAUL. Check before touching.

Paul Hodgson is delivering EUDPA-323: `Notification` and `NotificationFulfilments` collapse into one Mongo collection. His branch `feat/EUDPA-323-fold-aggregates` exists and his PR is **frontend#195**, currently red on cross-repo drift within his own branch set.

- **backend#74 — PARKED. Do not merge or polish.** Close it once EUDPA-323 lands, having checked nothing in it is lost.
- **frontend#191 and tests#106 rebase ON TOP of EUDPA-323** when it lands.
- On rebase: `frontend#191` edits `src/server/app/docs/persistence.md` to describe a canonical-then-projection write order. Wrong under a single record. Rewrite it.

**RAISE THIS WITH PAUL — it is the one thing here that is time-critical.** His branch retains `NotificationCopyMapper` with its reset rules intact while now also copying the opaque `fulfilments` blob verbatim. That means a copied notification would carry full answers in `fulfilments` but null `transport`, `consignment`, `internalReference`, animal counts and species in the typed fields — on the SAME document. The journey would show a complete copy; the dashboard would show blanks. That is a divergence inside one record, which is precisely what EUDPA-323's own acceptance criteria promise to remove. It also silently reverses EUDPA-317's ruled gate answer (copy verbatim, AC 5). Verified by reading his branch, not inferred. Both gate answers are now recorded on EUDPA-317 (comment 902441) so the ruling is at least written down.

Prior review analysis is banked at `workareas/shared/frontend-snagging-eudpa315/reviews/EUDPA-317/`. 62 findings, 14 adversarially confirmed, 44 refuted, 4 unverified. **Re-triage against Paul's shape before spending time on any of it** — much of the backend surface it covers is being deleted. The refutations are the valuable half: they record which findings are house idiom mistaken for defect.

JOB 3 — the rest, in rough priority order.

- **EUDPA-324, remove "What are you importing?"** — scoped, not started, ~51 files. See `tickets/import-type-riprout-description.txt`. The real work is the entry seam: `isEntrySurface`, `entryGuardTarget`, the dashboard create-POST redirect and the flow page order all point at that page and must move in one edit.
- **Notifications search** — untriaged, in `snags.txt`, no ticket. Searching for text within a known reference returns nothing because the backend repository has only exact-equality queries on `referenceNumber`. But the field is labelled "Keyword or reference" with a "Search" button. Two honest options of very different sizes: make matching match the label, or make the label match the behaviour. **That is a product decision — do not pick one.**
- **frontend#194 is stuck in the stale-image trap** (see below) and is one republish from green. Fixing it is a two-minute favour to someone else.

WHAT LANDED THIS SESSION

EUDPA-322 layout surfaces, merged as `0f30d8b2`. Pages are now one of two archetypes: forms keep the GOV.UK reading measure, display surfaces take the full container. `SURFACES` in `shared/kit.js`; the notification list is the only display surface and declares it via `surfaceClass('display')`, because it cannot use `kit.base` — that forces breadcrumbs off without a journey and would strip the dashboard's own. Sidebar is `govuk-grid-column-one-third` / `two-thirds`. Card fields, value alignment and a 769px horizontal overflow all fixed.

STANDING RULES — several of these were violated this session and corrected. Do not repeat them.

- **Do not pile explanatory comments into the code.** Code near-bare. Rationale belongs in the commit message, the ticket and `docs/` — not in the source. I wrote roughly a dozen justification blocks and Sam had to review them out. Default to remove.
- **Do not spray `govuk-!-` override classes.** Four overrides repeated across eight elements is a component rebuilt out of utilities. If a pattern repeats, state it once in the component's stylesheet. Note govuk-frontend styles by CLASS, not element — a bare `<dt>`/`<dd>` inherits nothing and renders in Times, so something must style it; the only question is where.
- **Never say "pre-existing", "not mine" or "separate issue".** If it is in the file you are touching, fix it. Sam is explicit and repeated about this.
- **Do not invent parallel workstreams.** No "this belongs to a follow-up pass", no proposing tickets for things you could just do. This is a snagging pass — fix it.
- **No tolerance-based layout tests.** Pixel geometry plus a magic tolerance encodes a design opinion and then argues with you. Visual baselines for appearance; binary checks (horizontal overflow) are fine. Card action wrapping is accepted behaviour, not a defect.
- Run E2E locally: `npm run test:docker-compose` in the tests repo against a `tim docker dev` stack. Do not wait for CI.
- Red-first or a test proves nothing. Two hand-written tests in an earlier session passed with AND without the fix.
- This codebase encodes bugs as expected behaviour. A test agreeing with you is not evidence.
- Hard-refresh the browser, and rebuild assets. The manifest serves an unhashed `application.css` with a 7-day cache, so a working fix looks broken — and a stale bundle against new markup produces layouts that exist nowhere in the code.
- Reference work by headline, not ticket number, when reporting to Sam.
- Do not claim something is verified unless you ran it.

THE CI TRAP, because it will bite again

A branch-tagged Docker image in a peer repo pins E2E to whenever that image was last built. `run-stack.sh` probes **Dockerhub** (`docker manifest inspect defradigital/<image>:<sanitised-branch>`), not git, so the tag outlives the branch and ages while `main` moves.

This session: backend `674b2ac2` started emitting `NotificationEdited` on every page save, so outbox counts went up by exactly 18. Tests main got the matching fix (`9dc1033`) the same minute — but a week-old branch-tagged tests image meant a CSS-only PR ran pre-fix specs against a post-fix backend, and it surfaced as that PR being broken.

Two counter-intuitive parts:
- **Deleting the git branch makes it worse.** The tag survives; you have removed the only thing that could refresh it. Recreate the branch from `main` and re-publish (`gh workflow run publish-branch.yml --ref <branch>` — it is pull_request/workflow_dispatch only, a bare push publishes nothing). Prove the overwrite with a manifest fingerprint.
- **A `workflow_dispatch` E2E run does not update the PR's check.** `report-e2e-status` is gated on a `pull_request` trigger. Close and reopen the PR to fire `reopened`. The workflow's concurrency group is keyed on branch with `cancel-in-progress`, so a second dispatch kills the first.

Diagnostic: the same tests image passing then failing, with the branch head unmoved, means the variable is a peer repo's `:latest`.
