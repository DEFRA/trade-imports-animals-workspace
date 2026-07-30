# Handover — EUDPA-288 backlog loop (fresh agent brief)

You are the **backlog loop orchestrator** for the live-animals promotion branch
(`spike/EUDPA-288-model-retrofit`, same branch name in every repo). The canonical state is
**`workareas/shared/promotion/BACKLOG.json`** (`promotion-backlog/v1` — the programme's existing
shared backlog: append-only ids `p-NNN`, currently through `p-223`; 39 done / 23 rejected /
5 blocked-on-sam from earlier phases, plus fresh `todo` items). You run a continuous loop: claim the
next todo, implement it, verify against the live stack, commit, record it, repeat — journey-builder
style (subagents implement, YOU verify, commit-or-rollback, serial).

**Sam never edits BACKLOG.json.** Sam gives you instructions in conversation, at any time, including
mid-item. YOU translate each instruction into backlog item(s) and manage all state.

## Intake protocol (Sam speaks → you write items)
- On any new instruction: append item(s) in the file's native shape — next `p-NNN` id (append-only,
  never reuse), `theme: "promotion"`, `type: task|refactor|question|conflict`, `status: "todo"`,
  Sam's words distilled into `title`, your expansion into `detail` (self-contained: repos, approach,
  acceptance), `evidence` refs, empty `decision`.
- Confirm in ONE line ("queued as p-224: <title>") and get back to the loop — never stall the
  current item for intake.
- Claim order is file order of `todo` items. If Sam says "next"/"urgent", move the item ahead of the
  other todos (id unchanged). If Sam's instruction changes/kills an existing item, update it
  (`rejected` + reason in `decision`); if it needs Sam's ruling, `blocked-on-sam` with the question
  in `detail` — surface those questions in conversation, don't sit on them.
- Vague instruction? Make the reasonable interpretation, record it in `detail`, proceed — flag the
  interpretation in the completion summary. Only truly un-actionable items go `blocked-on-sam`.

## NON-NEGOTIABLES
1. **Run headless.** Design calls are yours; flag them in commit messages. Never pause for approval.
   Genuine external blocker → mark the item, take the next one.
2. **Parent orchestrates.** Non-trivial implementation goes to a subagent (or a Workflow for
   parallelizable fan-out — standing opt-in). Trivial one-file edits you may do directly.
3. **Verify before commit, against reality.** Touched repo's unit suite + relevant E2E serially vs
   the live stack. Never commit red. Never mark done without verified evidence.
4. **Non-destructive rollback**: `git stash push -u` (never reset --hard/clean), re-spawn implementor
   with failure notes, max 2 retries, then `status: "failed"` + `failure` reason and move on. Halt
   the loop only after 3 consecutive item failures (systemic signal) — then report to Sam.
5. **One Bash command per call. No `&&`/`;`/pipes/`cd`** — `git -C`, `npm --prefix`, `mvn -f`.
   `~/` not `/Users/` in Bash; absolute paths for Read/Write. Edit BACKLOG.json via jq to a temp
   file, validate (`jq -e` parse + unique ids), then copy over — never hand-edit 100KB JSON.

## The loop
1. Claim: first `status:"todo"` in `.items` file order → set `in-progress`.
2. Size it; brief the implementor precisely (files, ground truth to read, idiom specs, guard rails).
3. Verify (units + targeted E2E `npm --prefix repos/trade-imports-animals-tests run _test_integration
   -- <spec> --workers=1`; E2E strictly serial — one Playwright run at a time; green-with-flaky-
   recovered is a pass). Items touching journey behaviour get the full `npm test` parity gate.
4. Format before staging (`npm --prefix <repo> run format`); `sonar analyze --staged` if available;
   commit (Claude co-author line); push the touched repos.
5. Record: `status:"done"` + add `commits: [{repo, hash}]` and `verification: "<one-line evidence>"`
   fields to the item; commit + push BACKLOG.json (workspace repo).
6. One-paragraph completion summary in conversation (outcome + evidence). Re-check for new Sam
   instructions, then loop to 1.
7. No runnable todos → idle: ScheduleWakeup ~20–30 min, re-check on wake (Sam may have instructed
   mid-idle), loop.

Subagent guard rails (every brief): import from `@fixtures`; never edit `flows/`, `page-objects/`,
`fixtures/`, `main-suite/` or shared files — raw locators + report wanted helpers; ground every
copy string in source with file:line evidence; one Bash command per call, no cd, bash grep (not
Grep/Glob tools); author-only — the parent runs all tests; return a structured report.

## Environment ground truth
- **Stack** (probably up): `tim docker dev` (base), then
  `scripts/stack/run-stack.sh -d --profile test-target` (both parity frontends). `docker ps` to
  check. Java backend changes: `scripts/stack/bounce-backend.sh`; Node hot-reloads. Reseed:
  `npm --prefix repos/trade-imports-animals-tests run database:reseed`.
- **URLs**: :3100 reworked FE (E2E target), :3200 pre-rework `:latest` FE, :3001 admin, :3000
  reworked dev FE. Sign-in `2100010101` / `Password123`.
- **Repos**: frontend (`src/server/live-animals`), backend (Java — ITs need `mvn verify`), tests
  (reworked `tests/`, frozen `main-suite/` — NEVER edit main-suite), workspace (stack/CI/docs).
- **Docs**: `DUAL-FRONTEND-PARITY-PLAN.md` (harness + review record), `PARITY-MAPPING.md` (old→new
  mapping + gap ledger), `HANDOVER-parity-harness.md` (history).
- **`npm test`** in the tests repo = full dual-frontend parity run (preflight, reseed between lanes).
- **Known flakiness**: auth-stub load sensitivity; parity workers capped at 4; batch-fail +
  serial-pass = load flake, not a defect.

## Hard-won gotchas (do not relearn)
- Unhealthy stack bring-up = blocker; diagnose, never build on top.
- Empirical beats source-reading — probe the live app before "fixing" a mismatch.
- Upload document references are alphanumeric-only; fixtures must be real files (synthetic bytes fail
  type-sniffing); mock scanner triggers on "virus" in the FILENAME, ~3s delay.
- Compose rejects cross-profile `depends_on` (test-target frontends can't depend on base services).
- `.gitignore` has `*.png` with root-anchored negations — `git check-ignore` any new binary fixture.
- Pre-commit hooks: tests repo = eslint+prettier on staged; FE = format:check + 3 lints + full unit
  suite. Format first or the hook reverts you.
- Cross-repo changes keep the same branch name in every repo; PRs go to `main` per repo.
