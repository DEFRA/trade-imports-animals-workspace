# CHED-PP trace-to-requirements — HANDOFF

**Read this first.** It hands the CHED-PP requirements work to a fresh agent or reviewer and says
exactly what to do next. Last updated 2026-07-18.

---

## TL;DR

The IPAFFS **CHED-PP** journey (plants pre-notification) has been reverse-engineered from its
Playwright trace corpus into a reviewable requirements spec, a target data model, and a buildable
backlog for a new CDP app. **The mining pipeline is COMPLETE.** What remains is human: review the
spec gate, rule the open conflicts, confirm scope — then build.

- Branch: **`spike/trace-to-requirements`** (pushed to origin).
- Everything here: `workareas/shared/trace-requirements/ched-pp/`.
- **Start by reading `SPEC-GATE.md`** — it is the review artefact.

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

### 1. Review the spec gate
Read `SPEC-GATE.md`. It surfaces the weak parts at the top (validation still thin on some pages;
15 of 39 pages have lower confidence). Sanity-check a few `pages/*.json` against your knowledge.

### 2. Rule the 8 conflicts that need a human (`conflicts.json`, `needsHuman: true`)
These cannot be settled by evidence precedence — they are decisions:

- **c-018** — Frontend (Joi) and backend (Jakarta) give **different error copy for the same field**
  ("Enter/Select the …" vs "Add the …"). Pick one voice for the rebuild.
- **c-024** — A DoA overdue-debtor exemption is applied on GET but **dropped on the POST error
  re-render** (import-type). Real IPAFFS bug — decide the correct behaviour.
- **c-015** — Are accompanying documents **mandatory** for CHED-PP? The "yes" reading rested on an
  `isChedp` flag = CHED-**P** (a trap), so this is genuinely unknown — product/legal call.
- **c-007** — What triggers the **CUC billing** sub-journey? (`isCuc` flag vs a "Sevington port" comment.)
- **c-013** — commodity-input-method question wording: visible H1 vs hidden legend differ.
- **c-014** — Radio groups have **no accessible name** (a11y defect). Adopt standard GDS radios?
- **c-004** — Error-summary title "Please fix the following errors" vs GDS "There is a problem".
- **c-023** — AV/upload-failure copy casing.

### 3. Confirm scope for the first pass
The born-blocked increments hinge on these (see `backlog.md`, `status: blocked`):
- Is **delegated authority (DoA)** in scope? If yes, `consignment-for` + `consignment-organisation`
  + the ownership/visibility model (`authorization-rules.md`) are in; if no, drop them.
- Is **CUC billing** in scope? Is **cloning** in scope? (all currently deferred/blocked)
- Data questions: is `commodity-class` one page or two? Is "intended use" a Yes/No or the
  FINISHED/PROPAGATED enum? Full value-sets + branching for `reasonForImport` and
  `finishedOrPropagated` (only one option of each was ever exercised)?

### 4. Then build
Once the above are ruled, `backlog.json` is the build plan for the new CHED-PP CDP app: a journey
that builds up the `target-model.md` JSON object and persists it to Mongo, in `trade-imports-animals`
house style. Options: raise tickets from the backlog, or run a journey-builder-style serial build
loop. Milestone 1 is scaffolding + persistence + the first pages.

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
