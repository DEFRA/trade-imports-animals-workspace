# Parity tooling — roadmap and status

Turning the one-off DR2.1 parity analysis into tooling that can be pointed at **any**
prototype (DR1, a future release), and keep each backlog current as both codebases drift.

Reconcile (this session) is the first brick. This document is the big picture: what exists,
what is pending, the chosen direction, and how agents and `tim` fit. Living document — update
it as items land.

> Companion docs: [`RECONCILE-PLAN.md`](RECONCILE-PLAN.md) (the reconcile contract),
> [`REPORT-V2-PLAN.md`](REPORT-V2-PLAN.md) (the `tim parity report` family),
> [`DECISIONS.md`](DECISIONS.md) (calls made without asking), [`README.md`](README.md)
> (the DR2.1 deliverable itself).

## Status at a glance

| Area | State |
|---|---|
| `reconcile` — merge fresh findings into a worked backlog after drift | ✅ **built, tested, validated** (this session) |
| `parity-lib` — pure engine shared by the generator and reconcile | ✅ built |
| Parameterise the generators off `EUDPA-328` | ⬜ pending (P1) |
| Capture-side target profile (`parity-targets.json`) | ⬜ pending (P2) |
| `parity-refresh` skill + diff-scoped agent fan-out | ⬜ pending (P3) |
| Migrate the `tim parity` family (report-v2 + reconcile) | ⬜ pending (P4) — report-v2 already planned |
| DR1 baseline (first-pass analysis) | ⬜ pending (P5) — needs P1+P2 |

## What was built this session

All under `dr21-parity/compare/`:

- **`parity-lib.js`** — pure, deterministic engine: increment-shaping (extracted from
  `build-increments`) + `reconcile()` + content-key and fuzzy-match helpers. No filesystem,
  no clock, no randomness — so it lifts into `tim parity reconcile` as a thin adapter later.
- **`reconcile.js`** — CLI: dry-run report, `--json`, `--write`, `--accept-match`/`--reject-match`,
  exit codes. `npm run reconcile -- EUDPA-328`.
- **`build-increments.js`** — refactored to import `parity-lib`, so the generator and reconcile
  mint increments through one code path (no drift between two copies).
- **`parity-lib.test.js` + `reconcile.test.js`** — 27 `node:test` tests (zero dependencies).
  `npm test`; `npm run check` syntax-gates all three sources.

**Validated:** 27 tests pass; a real dry run on the live EUDPA-328 backlog reconciled to
**96 carry / 1 suppressed / 0 needsHuman**, and two `--json` runs were byte-identical
(determinism). The one suppressed item (`inc-014`, `dropped`) proves tombstones are not re-raised.

**Not committed.** Branch `feat/EUDPA-328-dr21-parity`; Sam has not asked for a commit.

## The direction (chosen)

Three options were weighed for productising the pipeline (full exploration in the session; summary):

- **A — Thin:** parameterise + copy the workarea per prototype. Cheapest, but copy-paste drift and stays a gitignored workarea.
- **B — Medium (chosen, incremental):** lift the generic spine (mine, diff, generators, reconcile) into a tested `tim parity` command family driven by a target profile; walker specs + pairing stay hand-authored per-prototype inputs.
- **C — Thick:** B plus a skill that orchestrates the whole capture→verify→backlog run and a `tim parity init <target>` scaffolder.

**B, done incrementally**, because it matches the already-committed report-v2 direction and puts
the reusable spine somewhere durable and tested — while being honest that the walker specs and the
screen pairing are judgement, not mechanism, and can only be scaffolded/validated, not generated.

## Architecture: three lanes

Parity work splits cleanly into three lanes. Keeping them separate is the design.

| Lane | Does | Examples |
|---|---|---|
| **Mechanical** (deterministic) | bookkeeping — *has this gap been seen / decided / built?* | extractor, `fe-miner`, differ, generators, **reconcile** |
| **Agents** (judgement) | *is this gap real?* and building it | Phase-3 band reviewers + adversarial refuters; `frontend-change` implementor |
| **Human** (Sam) | rulings machines must not make | gated design/backend decisions; rename adjudication |

**Reconcile is deliberately in the mechanical lane** — a merge that must be identical every run and
must never silently drop a human decision cannot be an agent. Its job is to *minimise* agent work:
of N findings, the unchanged ones carry untouched and only the genuine deltas route to agents
(`new` → verify) or the human (`needsHuman` → adjudicate).

### Where agents plug in, and the `tim` split

The target architecture (P3/P4):

- **`tim parity …` = the deterministic spine, no agents.** Every command emits/consumes `--json`.
  Reconcile's `--json` buckets (`new`, `needsHuman`) **are** the agent/human work-lists.
- **A skill or Workflow = the agent layer on top.** It calls the tim commands for the mechanical
  bits and fans out agents for the judgement bits — the same pattern `review` / `frontend-change`
  already use. `tim` never calls agents itself; agents live one layer up and treat
  `tim parity … --json` as their substrate.

## Two operating journeys (reference)

**First pass (new prototype, e.g. DR1 baseline) — a small project, agent-heavy.** Size both sides →
author DR1 walker specs (one per journey, agent-drafted, human-verified) → author the DR1 `pairs.js`
→ diff → Phase-3 review+refute fan-out → generators build the DR1 backlog → human rules the gates.
Reconcile plays **no** part here — there is nothing to merge into. Reusable for free: the extractor,
`fe-miner` (+ the two solved hazards), the differ, the review→refute pattern, and the frontend page
models. Bespoke cost: the walker specs and the pairing.

**Refresh (prototype drifted) — the reconcile loop.** Re-capture the changed side → diff names the
changed pairs → fan out verify-agents on **only those** → `reconcile --dry-run` shows the buckets →
human adjudicates any renames → `reconcile --write`. Human work preserved; new increments minted
append-only and queued for verification. (Full turn-by-turn walkthroughs are in the session history;
fold them into the `parity-refresh` skill when P3 lands.)

## Pending work (ordered)

**P1 — Parameterise the generators off `EUDPA-328`.**
`build-increments.js` hardcodes `run_id: 'EUDPA-328'`, the output path, and DR2.1-specific note
text. Make it target-aware (run-id, output path, target label from a profile) so it can build a
DR1 backlog. *Includes fixing the known path bug below, safely.*

**P2 — Capture-side target profile (`parity-targets.json`).**
The harness bakes in `PROTOTYPE_ROOT`, the `design-release-2.1` views path, ports 3011–3019 and the
kit boot command. Lift these to data so a new target is a config edit, not a fork of the harness.
(Distinct from the build-loop `tools/journey-builder/targets.json`, which already exists.)

**P3 — `parity-refresh` skill + diff-scoped fan-out.**
So a fresh agent has a scripted entry point instead of re-reading the handover, and so Phase 3
agents re-verify **only the pairs the diff says changed** — today's documented refresh re-runs
Phase 3 over everything, then reconcile trims it, which wastes the fan-out.

**P4 — Migrate the `tim parity` family.**
Fold report-v2 (already planned: `report`/`normalise`/`seed-anchors`/`check`, 58 increments in
`report-v2-backlog.json`) and reconcile into `tim parity`. Reconcile's core is already a pure
module; the adapter is ~20 lines. `seed-anchors` hardens reconcile's fuzzy tier.

**P5 — DR1 baseline.**
Run the first-pass journey for DR1. Depends on P1+P2 (target-aware generators + capture profile).
Precondition: DR1 must exist as a bootable prototype kit.

### Known issue (tracked, intentionally unfixed)

`build-increments.js` writes to `~/git/defra/trade-imports-animals/workareas/…` — **missing
`-workspace`** — so a regeneration does not overwrite the live backlog at the real path. Left as-is
on purpose: fixing it in isolation would arm a full regeneration to clobber the hand-edited backlog,
the very thing reconcile prevents. Fix it as part of **P1**, when regeneration becomes target-aware
and a worked backlog is refreshed with `reconcile`, never `build-increments`.

## Not in scope of this roadmap

The EUDPA-328 frontend catch-up itself (build the accepted increments — currently ~24 M1 `todo`,
plus gated M2/M3) is separate delivery work driven by `journey-builder` + `frontend-change`. This
document is about the **tooling** that produces and maintains the backlogs, not the building.
