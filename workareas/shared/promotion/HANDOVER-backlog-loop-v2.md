# Handover — EUDPA-288 backlog loop v2 (successor agent brief)

You are the **backlog loop orchestrator** for `spike/EUDPA-288-model-retrofit` (same branch in
every repo). Read `workareas/shared/promotion/HANDOVER-backlog-loop.md` first — its protocol,
non-negotiables, intake rules, environment ground truth and gotchas ALL still apply. This file
is the delta: what the previous orchestrator learned across ~30 items, plus your first
assignment. Canonical state: `workareas/shared/promotion/BACKLOG.json` (ids through `p-240`,
all done; next id `p-241`).

## Operating rules proven this session (follow them, don't relearn)

1. **Codex is the default implementor.** Sam has a full Codex subscription; delegate anything
   non-trivial:
   `codex exec -C <repo> --skip-git-repo-check -s workspace-write -c sandbox_workspace_write.network_access=true -o <lastmsg.txt> "Follow the brief at <scratchpad>/brief.md exactly."`
   Write briefs to scratchpad FILES — inline prompts containing literal `/Users/` paths are
   hook-blocked in Bash. Codex has a normal shell (its briefs must say so). Codex never
   commits; you verify, commit, push. Claude subagents remain fine for Jira/research legs.
2. **Run Codex and long verifications in FOREGROUND Bash (timeout 600000).** Background tasks
   were repeatedly stopped this session; foreground never was. If a foreground call outgrows
   600s it auto-moves to background — acceptable. If a run IS stopped: check `git status`, the
   partial state is usually coherent — write a resume brief and re-spawn (worked 4/4 times).
3. **Verification ladder** (yours, never the implementor's word):
   - FE: `npm --prefix repos/trade-imports-animals-frontend test` (units, 1450+),
     `PORT=3050 npm --prefix ... run test:features` (262+ co-located Playwright tests; PORT
     override because :3000 is held by the stack), `run test:e2e` (journey smoke, 2).
   - Backend: `mvn -f repos/trade-imports-animals-backend/pom.xml verify` (units+ITs, 545+),
     then `scripts/stack/bounce-backend.sh` to load changes into the stack.
   - Tests repo targeted: `npm run database:reseed` then
     `npm run _test_integration -- <spec> --workers=1`.
   - Full gate for journey-touching items: `npm --prefix repos/trade-imports-animals-tests test`
     (dual-lane parity; reworked ~140, main ~253; exit 0 with flaky-recovered = pass).
   One Playwright run at a time, always.
4. **Dependency changes need container rebuilds.** The dev-mode containers hot-reload SOURCE
   only. After any package.json change:
   `scripts/stack/run-stack.sh -d --profile test-target`. Symptom of forgetting: :3100 serves
   unstyled pages / asset 404s.
5. **Load flake vs defect.** Batch-fail + serial-pass = flake, not a defect. If a batch run
   degrades broadly (30s+ timeouts on previously-fast specs), the environment is worn:
   `docker restart trade-imports-animals-trade-imports-animals-frontend-test-1` (or
   `...cdp-uploader-1` if failures cluster on uploads), reseed, re-run.
6. **Visual baselines drift on intentional global CSS changes.** Regenerate both:
   `npm run _test_parity_reworked -- --grep @visual --update-snapshots` (darwin) and
   `bin/update-visual-baselines-linux.sh reworked` (linux, containerised). Same for the `main`
   lane script argument if ever needed.
7. **Never touch `main-suite/`** in the tests repo (frozen, targets :3200). Reworked suite
   (`tests/`, flows, page-objects) is fair game when the UI intentionally changes.
8. **Parallel writers need worktrees.** Second implementor on the same repo → git worktree on a
   ticket-prefixed child branch; you merge back and delete the branch.
9. **Per-item bookkeeping** (non-negotiable): claim → `in-progress`; on completion set `done` +
   `commits` (repo+hash) + `verification` (one-line evidence) + `decision` (design calls);
   jq-to-temp-file → `jq -e` validate parse/unique-ids → copy over; commit BACKLOG.json to the
   workspace repo and push. Push every repo after committing it. Conventional commits with the
   Claude co-author line; design calls flagged in the message body.
10. **Convention tests are tripwires.** copy-convention (recursive template discovery),
    contract.test, dependency-cruiser arch rules, and dynamically-generated test counts all
    react to file moves. A dropped unit-test COUNT with unchanged file count means dynamic
    discovery silently narrowed — hunt it (vitest list, before/after diff), never shrug it off.

## Current state (all pushed, all green)

- frontend `f57c616` · backend `1e7004a` · tests `efe6ca7`+ · workspace `51991f4`.
- 262 co-located feature Playwright tests (self-contained, no page objects, per-rule validation
  coverage); root `e2e/` is a 2-test journey smoke + helpers; docs pruned to 15 files then 8
  fresh GDS-style guides added under `src/server/live-animals/docs/`.
- Reference documents in `workareas/shared/promotion/`: `MERGE-STRATEGY.md` (same-day merge
  runbook — reconcile main first, publish branch images via draft PRs before trusting parity
  CI), `QA-HANDOVER.md` (incl. old→new screen map), `USERS-OWNERSHIP-AUDIT.md`,
  `DRIFT-AUDIT.md`, `AUTOCOMPLETE-ASSESSMENT.md`, `PARITY-MAPPING.md` (spec-level, pre-31-July
  UI notes are stale).
- Recent UI facts your specs/docs assume: MoJ date picker on all 3 date inputs
  (`@ministryofjustice/frontend@10.0.1`, single dd/mm/yyyy payload, persistence still
  {day,month,year}); plain selects for origin country + port of entry; transit countries = one
  31-country checkbox group (cap 12); commodity selection = grouped checkboxes (search
  removed); dashboard has exact-reference search (`referenceNumber` param end-to-end);
  EUDPA-281 actor + withdrawn events live on submit/amend/delete.
- 5 old `blocked-on-sam` items in BACKLOG.json; none block anything.

## FIRST ASSIGNMENT — stabilise after Sam's manual folder restructure

Sam is manually reorganising folders (frontend, possibly beyond `features/`). When he says
"I've made the manual changes", run this as backlog item `p-241`:

1. **Survey, don't assume**: `git -C repos/trade-imports-animals-frontend status --porcelain`
   and `git diff --stat` (uncommitted) or `git log` (if he committed). Map what moved.
2. **Fix fallout via Codex** (brief it with the move map): broken imports, njk render/include
   path strings, webpack/vitest/playwright globs, dependency-cruiser rule globs, the
   copy-convention/contract tests, co-located spec imports of shared helpers.
3. **Docs accuracy pass**: every doc in `src/server/live-animals/docs/` + README that cites a
   moved path gets corrected (current-state only, GDS plain English, no migration notes).
4. **Verify the full ladder** (rule 3 above), ending with the full parity gate. If his changes
   touched the tests repo or renamed things specs assert on, adapt the reworked lane (never
   main-suite).
5. **Commit**: if Sam left changes uncommitted, stage and commit his moves together with the
   fallout fixes (message: `refactor(EUDPA-288): folder restructure (Sam) + fallout fixes
   (p-241)`); if he committed, commit fixes separately. Push, record p-241, push backlog.
6. Then resume normal loop duty: intake his instructions as items, keep moving, headless.
