# CHED-PP trace-to-requirements — HANDOFF

**Read this first.** It hands the CHED-PP requirements work to a fresh agent or reviewer and says
exactly what to do next. Last updated 2026-07-18.

---

## TL;DR

The IPAFFS **CHED-PP** journey (plants pre-notification) has been reverse-engineered from its
Playwright trace corpus into a reviewable requirements spec, a target data model, and a buildable
backlog for a new CDP app. **The mining pipeline is COMPLETE, and the spec gate is now PASSED** —
Sam ruled all 8 conflicts, set first-pass scope, and resolved every born-blocked increment on
2026-07-18. **What remains is to BUILD.**

- Branch: **`spike/trace-to-requirements`** (pushed to origin).
- Everything here: `workareas/shared/trace-requirements/ched-pp/`.
- **The decisions are in `RULINGS.md`** (human decision log) — read it with `SPEC-GATE.md` (review
  artefact). Machine form: `conflicts.json` (`humanRuling` per conflict) + `backlog.json`
  (`scopeDecisions`, per-increment `ruling`, `bornBlockedResolution`).

### The decisions in one glance (2026-07-18)

- **Conflicts:** c-004 → GDS 'There is a problem'; c-007 → free-standing `isCuc` flag (provisional,
  confirm with IPAFFS); c-013 → visible H1 wording; c-014 → fix radios (legend-as-heading);
  c-015 → documents MANDATORY; c-018 → frontend Joi copy voice; c-023 → GDS sentence case;
  c-024 → overdue-debtor gate OUT (report bug to IPAFFS).
- **Scope:** DoA **out**, CUC billing **in**, cloning **out**.
- **Born-blocked (all cleared):** inc-014 (build real search + `eppoCode`), inc-020 (12 spokes,
  hub-owned, all-mandatory gating), inc-025 (mandatory docs), inc-036 (CUC in, `isCuc`),
  inc-040 (placeholder rule hook) → unblocked; inc-032/033/034 (DoA), inc-037 (file bytes),
  inc-041 (cloning) → deferred.
- **Follow-ups outside the build:** report c-024 bug to IPAFFS; confirm c-007 CUC trigger with
  IPAFFS; QA migration for c-004 guard `ched-a-workflows.ts:505`. See `RULINGS.md` §4.

---

## Where things are

| Path | What |
|---|---|
| `workareas/shared/trace-requirements/ched-pp/` | **The committed deliverables (this dir).** |
| `SPEC-GATE.md` | Human review artefact — confidence breakdown, conflict register, open questions. **Read first.** |
| `journey-spec.json` | Canonical spec: 39 pages, 354 fields, with per-field confidence/provenance/conflicts. |
| `conflicts.json` | The 28-entry `c-NNN` conflict register (8 need a human ruling). |
| `target-model.md` | The proposed JSON document shape (journey → JSON → Mongo, `trade-imports-animals` house style). |
| `backlog.json` / `backlog.md` | 42 increments in 6 milestones; 10 born-blocked behind rulings. |
| `integrations.md` | 15 external systems (4 needed first-pass), 12 reference-data lists. |
| `authorization-rules.md` | Delegated-authority (DoA) ownership/visibility model — 19 rules. |
| `completeness-critique.md` | What is still missing / structurally un-mineable. |
| `pages/*.json` | Per-page specs (verbatim copy, fields, GOV.UK components, validation). |
| `journeys/*.json`, `doa-findings/*.json` | Raw per-trace evidence. |
| `../workflows/*.js` | The reusable pipeline (parameterised by `args.chedType`). |

**Note the two locations:** the live run wrote to the gitignored workarea
`workareas/trace-requirements/ched-pp/` (still on disk, includes ~200MB `work/` scratch). The curated
copy committed to git is here under `shared/`. Trust the `shared/` copy.

---

## What was produced (final, post-enrichment)

- **39 pages, 354 fields.** Field confidence: 312 confirmed (rendered) / 7 legacy / 29 inferred / 6 gap.
- **Validation coverage ~74%** (228/310 grounded), up from ~5% before the legacy-enrichment pass.
  Split: 9 confirmed / 219 legacy / 74 inferred / 8 gap.
- **42 increments, 6 milestones.** Post-submission (inspector/PHSI/decisions) is OUT of scope.
- **DoA folded in** — 10 delegated-authority traces mined; `authorization-rules.md` written.

The method (in the workflow README): Index → Extract → Inventory → Comb → Corroborate → Verify →
Reconcile → Integrations → Model → Backlog → Critic, then a supplementary DoA + legacy-enrichment
pass. Both passes have already run for CHED-PP.

---

## WHAT TO DO NEXT (the actual "continue" steps)

### 1. Review the spec gate — DONE (2026-07-18)
`SPEC-GATE.md` reviewed. Weak parts noted (two `gap` pages `notification-hub` + `commodity-search`;
source-only behaviours). Those informed the rulings below.

### 2. Rule the 8 conflicts — DONE (2026-07-18)
All 8 ruled by Sam. See `RULINGS.md` §1 and `conflicts.json` (`humanRuling` per conflict).
Summary: c-004 GDS 'There is a problem'; c-007 free-standing `isCuc` (provisional); c-013 visible
H1; c-014 fix radios; c-015 documents MANDATORY; c-018 frontend Joi voice; c-023 GDS sentence case;
c-024 debtor gate OUT + report to IPAFFS.

### 3. Confirm first-pass scope — DONE (2026-07-18)
DoA **out**, CUC billing **in**, cloning **out**. All 10 born-blocked increments resolved
(5 unblocked, 5 deferred) — see `RULINGS.md` §3 and `backlog.json` `bornBlockedResolution`.

**Data questions still open (do NOT block the pass-1 build, confirm as the pages are built):**
`commodity-class` is ONE page (a dropdown on variety-of-genus-and-species — c-001, already ruled);
whether "intended use" is a Yes/No or the FINISHED/PROPAGATED enum; and the full value-sets +
branching for `reasonForImport` and `finishedOrPropagated` (only one option of each was ever
exercised — Open Q 5). These are per-page confirmations, not gate blockers.

### 4. Then build — THIS IS NOW THE NEXT STEP
`backlog.json` is the build plan for the new CHED-PP CDP app: a journey that builds up the
`target-model.md` JSON object and persists it to Mongo, in `trade-imports-animals` house style.
Options: raise tickets from the backlog, or run a journey-builder-style serial build loop.
Milestone 0 is scaffolding + persistence spine; the m0→m4 own-org happy path is fully unblocked.
Remember the follow-ups outside the build (`RULINGS.md` §4): report the c-024 bug to IPAFFS,
confirm the c-007 CUC trigger, and the c-004 QA-guard migration.

### 5. Residual policy questions (not mineable)
`completeness-critique.md` lists business rules with no UI and no message key — Article 72
eligibility, risk categorisation, HMI auto-completion, CUC trigger, split generation,
control-point↔BCP filtering. These need a human/policy source; the tooling cannot recover them.

---

## Re-running or extending

- **Re-run / resume** a workflow: `Workflow({ scriptPath: ".../workflows/trace-to-requirements.workflow.js", args:{ chedType:"ched-pp" } })`. Workflow `resumeFromRunId` only works within the same session; a fresh session re-runs from scratch (page specs on disk are preserved regardless — the fine-tooth waves write files, not just return values).
- **Other CHED types** (A/D/P): same tooling, `args:{ chedType:"ched-d" }`, then the supplementary
  pass. **Unverified — run one as a canary first** (see workflows/README.md).

## Operational gotchas that cost real time — heed these

- **Permission hooks are strict.** In Bash use `~/` paths ONLY (a literal `/Users/…` is DENIED, not
  prompted, since the guard hardening). No `&&` even inside awk/jq (`head -n E f | tail -n +S` for
  line ranges). One command per Bash call. `node`/`python`/`curl` denied — a freshly-written script
  can't be run. These are baked into the workflow `GUARD_RAILS`; if you edit prompts, keep them.
- **Runs hit session limits + transient API drops.** Every wave has a null-guard that fails loudly;
  just resume. Budget for a multi-hour, multi-resume run per type (~13M tokens for the main pass).
- **The `playwright trace` CLI is stateful + cwd-scoped** — parallel agents each need their own
  `cd` dir. Output is text, not JSON. See `reference_playwright_trace_cli` memory.
- **The ched-p / ched-pp trap:** `ched-p` is a substring of `ched-pp`. Encoded per-type in `CHED_CONFIG`.
- **Traces are a lower bound** — confirm/legacy/inferred/gap tags are load-bearing; treat `gap` and
  low-confidence pages as questions, not facts. Rendered (`confirmed`) beats legacy beats inferred.
