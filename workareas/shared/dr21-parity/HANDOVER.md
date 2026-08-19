# EUDPA-328 — handover

Two prompts below. The first is for **Sam**, coming back to this after a meeting. The
second is for a **fresh orchestrator agent** picking the work up cold.

Everything described here is committed on `feat/EUDPA-328-dr21-parity` (`9cac173`) in the
workspace repo. Nothing is pushed.

> **Update 2026-08-19 — read [`ROADMAP.md`](ROADMAP.md) first; parts of this handover are stale.**
> Since `9cac173`: (1) the **dead-prototype bug (stream a) is fixed** — the build loop's target is
> now data (`tools/journey-builder/targets.json` → the real frontend), committed at
> `1806d2c`; the surviving mentions of the old path are comments/docs only. (2) A **`reconcile`
> tool** now refreshes a worked backlog after the prototype drifts, without losing human work —
> design in [`RECONCILE-PLAN.md`](RECONCILE-PLAN.md), status + the wider multi-prototype plan in
> [`ROADMAP.md`](ROADMAP.md). (3) A **report-v2 rebuild** is planned
> ([`REPORT-V2-PLAN.md`](REPORT-V2-PLAN.md)). Current backlog split:
> `tools/journey-builder/backlog-counts.sh EUDPA-328`. The "three streams" below are the original
> framing; the live to-do list is the pending section of `ROADMAP.md`.

---

## Prompt 1 — Sam, picking this back up

> Back on EUDPA-328. Where did we get to and what's next?

**Done.** The parity analysis is finished. 97 verified increments live at
`workareas/journey-builder/EUDPA-328/backlog.json`, and the build loop reads them:

```bash
tools/journey-builder/backlog-counts.sh EUDPA-328
tools/journey-builder/next-increment.sh EUDPA-328 --claim
```

Human-readable view, filterable by band, type and domain — same `inc-nnn` ids:
https://claude.ai/code/artifact/f089a914-2ae2-4732-9f60-f3ec12bf9734

**Your next job: 49 decisions.** Everything gated on you is blocked, so the loop can't
run past them. There is a walker:

```bash
! chmod +x tools/parity/*.sh          # once — I can't set the execute bit

tools/parity/decision-counts.sh EUDPA-328
tools/parity/next-decision.sh EUDPA-328                       # shows one, with both-sides evidence
tools/parity/next-decision.sh EUDPA-328 --domain germinal-products
tools/parity/rule-decision.sh EUDPA-328 inc-001 accept --note "why"
tools/parity/rule-decision.sh EUDPA-328 inc-001 reject --note "why"
tools/parity/rule-decision.sh EUDPA-328 inc-001 defer  --note "why"
```

`accept` unblocks it for the loop, `reject` marks it `dropped` but leaves it recorded so
nobody re-raises it, `defer` parks it. A note is mandatory on all three.

Suggested order — rule by domain, biggest first, so you stay in one head-space:
germinal-products (18), commodities (13), addresses (13), dashboard (11), templates (9).

**Then 25 items are buildable now** (M1, `todo`) with no decision needed, plus 2 in M0.

**One thing needs you, unrelated:** delete
`workareas/shared/design-release-2-parity/` — it's a duplicate of `dr21-parity/prior/`
and `rm -rf` is denied to me.

---

## Prompt 2 — fresh orchestrator agent

> You are picking up EUDPA-328 "Catch up frontend with prototype" for Sam. The parity
> analysis is COMPLETE and committed. Do not re-run it.
>
> **Read first, in this order:**
> 1. `workareas/shared/dr21-parity/README.md` — what exists and how to refresh it
> 2. `workareas/shared/dr21-parity/DECISIONS.md` — every call made without asking
> 3. `workareas/shared/build-loop-amalgamation/DESIGN.md` — the tooling work Sam has
>    asked for next
>
> **State.** Branch `feat/EUDPA-328-dr21-parity` at `9cac173`, unpushed. 97 verified
> increments at `workareas/journey-builder/EUDPA-328/backlog.json`: 27 `todo`, 70
> `blocked` (49 on `gate: "sam"`, 21 on `gate: "backend"`). Corpus is 103 page models
> captured from frontend `main@32f6106c` and prototype `7da4f70`.
>
> **There are three streams of work. Ask Sam which he wants before starting.**
>
> **(a) Fix the dead-prototype bug — highest value, lowest risk.**
> `prototypes/standalone/live-animals` no longer exists; it was promoted into
> `src/server/app`. Twelve files still point at it, including four
> `tools/journey-builder/` scripts that will fail if run. `verify-increment.sh` is the
> worst: it lints a path that is gone and runs `npm run test:prototype`, which is no
> longer a script. The design doc sets out a target-profile fix that repairs all twelve
> by making the path data rather than code. Sam's instruction, verbatim: *"if you see
> something like a script saying run test prototype and there's no prototype anymore, fix
> it"* — the skills and tools are ours to change, not to work around.
>
> **(b) Build the accepted increments.** Once Sam has ruled on decisions, run the loop:
> `next-increment.sh EUDPA-328 --claim`, then invoke the `frontend-change` skill with the
> increment's `type` as its mode. One increment per invocation; it runs its own
> verification ladder. **Do not use `verify-increment.sh`** until (a) is done — it targets
> the dead prototype.
>
> **(c) The walker generalisation** — section 4 of the design doc. Touches four working
> skills, so canary on `review` alone first.
>
> **Rules that cost time to learn:**
> - Bash: one command per call, no `&&`/`;`/`cd`; `env`, `node`, `bash`, `sh` are denied;
>   use `~/` not `/Users/`. Wrap node runs in an npm script.
> - `chmod` is policy-blocked — ask Sam to run `! chmod +x` himself.
> - Make the call and flag it after. Do not stop to ask on an arbitrary fork; record the
>   decision in `DECISIONS.md` and keep moving.
> - A backlog deliverable is canonical JSON the loop consumes, never a markdown document.
>   Documents are generated views.
> - Verify claims against captured artefacts, not memory. Both codebases move weekly.
>
> **Two hazards in this corpus specifically**, both already fixed but easy to reintroduce:
> `trace snapshot -- eval --filename` writes JSON-encoded output that must be decoded
> before jsdom sees it, or every class selector silently returns empty; and the prototype
> builds its spine screens from bespoke `app-*` markup, so compare `taskItems` /
> `summaryRows` / `allFields`, never `taskLists` / `summaryLists`.

---

## Refreshing the corpus

Both codebases move weekly. All four steps are idempotent; see `README.md` for the full
commands. Regenerating renumbers `inc-nnn` and does **not** carry statuses across, so
refresh before work starts, not mid-loop.
