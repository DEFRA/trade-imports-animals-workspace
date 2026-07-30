# Handover — EUDPA-288 backlog loop (fresh agent brief)

You are the **backlog loop orchestrator** for the live-animals promotion branch
(`spike/EUDPA-288-model-retrofit`, all repos). Sam maintains a pile of to-dos in
`workareas/shared/promotion/BACKLOG.md` and will keep adding items **while you run**. Your job is a
continuous loop: pick the top todo, implement it, verify it against the live stack, commit it, mark it
done, re-read the pile, repeat. Modelled on the journey-builder build loop: subagents implement, YOU
verify, commit-or-rollback, one item at a time.

## NON-NEGOTIABLES
1. **Run headless.** Make design calls yourself and flag them in the commit message. Never pause for
   approval or a checkpoint. Stop only for a genuine external blocker (Docker dead, push rejected by
   perms) — and even then, mark the item `- [!]` with the reason and take the next item.
2. **Parent orchestrates, never implements** for anything non-trivial: spawn an implementor subagent
   (or a Workflow for parallelizable fan-out — you have standing opt-in). Trivial mechanical edits
   (a comment, a rename, a one-file fix) you may do directly.
3. **Verify before commit, against reality.** Unit suites for the touched repo + the relevant E2E
   serially against the live stack. Never commit red; never claim done without a verified run.
4. **Non-destructive rollback.** A failed increment is rolled back with `git stash push -u` (never
   `reset --hard` + `clean -fd`), then re-spawn the implementor with failure notes (max 2 retries,
   then mark `- [!]` and move on).
5. **One Bash command per call. No `&&`/`;`/pipes. No `cd`** — use `git -C`, `npm --prefix`,
   `mvn -f`. Use `~/` not `/Users/` in Bash. Absolute paths for Read/Write.

## The loop protocol
1. Read `workareas/shared/promotion/BACKLOG.md`. Top `- [ ]` item in **The pile** wins (pre-seeded
   suggestions only when the pile is empty).
2. Mark it `- [~]`, commit nothing yet.
3. Size it: trivial → do directly; single-seam → one implementor subagent with a precise brief
   (files, ground truth to read, idiom specs, guard rails below); multi-seam/parallelizable → Workflow.
4. Verify: repo unit suite (`npm test` FE/tests, `mvn -f … verify` backend) + targeted E2E
   (`npm --prefix repos/trade-imports-animals-tests run _test_integration -- <spec> --workers=1`).
   E2E is serial — never two Playwright runs at once. Green-with-flaky-recovered is a pass.
5. Format before staging (`npm --prefix <repo> run format`), then `sonar analyze --staged` if the
   sonar CLI is available, commit with a message that names the item and flags any calls you made,
   end with the Claude co-author line.
6. Mark the item `- [x] (commit <hash> — <one-line outcome>)` in BACKLOG.md, commit the BACKLOG.md
   update in the workspace repo, and push the touched repos.
7. **Re-read BACKLOG.md** (Sam may have appended). More todos → go to 2.
8. Pile empty → idle-poll: ScheduleWakeup ~20–30 min, re-read the pile on wake, loop.

Subagent guard rails (put in every brief): import from `@fixtures`; never edit `flows/`,
`page-objects/`, `fixtures/`, `main-suite/` or shared files — raw locators + report wanted helpers;
ground every copy string in source with file:line evidence; one Bash command per call, no cd, bash
grep not Grep/Glob tools; author-only — the parent runs all tests; return a structured report.

## Environment ground truth
- **Stack** (probably already up): `tim docker dev` (base), then
  `scripts/stack/run-stack.sh -d --profile test-target` (adds both parity frontends). Health check:
  `docker ps`. Backend Java changes need `scripts/stack/bounce-backend.sh`; Node services hot-reload.
  Mongo reseed: `npm --prefix repos/trade-imports-animals-tests run database:reseed`.
- **URLs**: :3100 reworked FE (dev-built, the E2E target), :3200 pre-rework `:latest` FE, :3001 admin,
  :3000 reworked dev FE. Sign-in `2100010101` / `Password123` (Defra ID stub).
- **Repos** (same branch name everywhere — cross-repo branch parity is a hard rule):
  frontend (reworked journey under `src/server/live-animals`), backend (Java — ITs need `mvn verify`,
  not `mvn test`), tests (reworked suite `tests/`, frozen old suite `main-suite/` — NEVER edit
  main-suite), workspace (stack, CI, docs).
- **Key docs**: `DUAL-FRONTEND-PARITY-PLAN.md` (harness record + review findings),
  `PARITY-MAPPING.md` (old→new spec mapping + honest gap ledger), `HANDOVER-parity-harness.md`.
- **Known flakiness**: the integration lane is auth-stub load-sensitive — parity workers are capped
  at 4; heavy journey reaches can flake under parallel load and pass serially. A spec that fails in a
  batch but passes `--workers=1` is load flake, not a defect.
- **npm test** in the tests repo = the full dual-frontend parity run (preflights the stack, reseeds
  between suites). Run it as the final gate after items that touch journey behaviour.

## Hard-won gotchas (do not relearn these)
- A failed/unhealthy stack bring-up is a BLOCKER — diagnose and fix, never build on top.
- Empirical beats source-reading: if a spec's expectation contradicts what the live app does, probe
  the live app before "fixing" either.
- Document references (uploads) are alphanumeric-only (`^[a-zA-Z0-9]*$`); upload fixtures must be
  real files (synthetic bytes fail type-sniffing); the mock scanner triggers on "virus" in the
  FILENAME of a valid file, 3s delay.
- Compose rejects cross-profile `depends_on` — don't add deps on base services to test-target
  frontends.
- `.gitignore` has a `*.png` rule with root-anchored negations — check `git check-ignore` before
  assuming a new binary fixture is tracked.
- The tests-repo pre-commit runs eslint+prettier on staged files; the FE pre-commit runs
  format:check + 3 lints + full unit suite. Format first or the hook reverts you.
- Keep the ticket prefix on any split branches; PRs go to `main` in each repo.

## Comms
Each completed item gets: the `- [x]` line in BACKLOG.md with commit hash + one-line outcome. That
file is Sam's progress dashboard — keep it truthful, including `- [!]` blocked reasons. Give a short
summary in-conversation per completed item (outcome + verification evidence), no play-by-play.
