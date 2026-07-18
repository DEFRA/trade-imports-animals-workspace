# trace-to-requirements

Reusable multi-agent tooling that mines an existing app's **Playwright trace corpus** into a
requirements spec, a target data model and a buildable backlog for a rewrite. Built to reverse-engineer
the IPAFFS CHED journeys (CHED-A / CHED-D / CHED-P / CHED-PP) as inputs to their CDP-based rebuilds.

The premise, proven on CHED-PP: **the information needed to reconstruct a journey as requirements is
already in the traces** — every page, field, label, option and (where an error rendered) validation
message. A trace snapshot even captures controls that no test ever filled, which the action log alone
cannot show. Traces are a *lower bound* on requirements (they only cover what was exercised); the tests
and — where authorised — the legacy source raise that bound.

## What's here

```
trace-requirements/
  README.md                          ← this file
  workflows/
    trace-to-requirements.workflow.js   ← main pipeline (Index → … → Backlog → Critic)
    doa-and-legacy-enrich.workflow.js   ← supplementary pass (delegated-authority + legacy enrichment)
  ched-pp/                           ← the CHED-PP worked example (the proven reference output)
    SPEC-GATE.md  journey-spec.json  conflicts.json  target-model.md
    backlog.json  backlog.md  integrations.md  authorization-rules.md
    completeness-critique.md  page-inventory.json  trace-index.json
    pages/  journeys/  doa-findings/
```

## How the pipeline works

`trace-to-requirements.workflow.js` runs eleven waves. Each fine-tooth wave fans out one subagent per
trace or per page and adversarially verifies its own output:

1. **Index** — classify every trace; select this CHED type's subset (title-based; self-identifying).
2. **Extract** — per-trace action timeline (the journey story, with real values + accessible names).
3. **Inventory** — dedup actions into a distinct, ordered page inventory.
4. **Comb** — per-page DOM mining: verbatim copy, every field, GOV.UK components, non-standard markup, structure.
5. **Corroborate** — cross-check each page against the QA tests; add controls/behaviours the traces missed.
6. **Verify** — adversarial refutation of every page claim (hunts invented copy, confidence inflation, uncited claims).
7. **Reconcile** — canonical `journey-spec.json` + `conflicts.json` (c-NNN register, precedence-ruled) + `SPEC-GATE.md`.
8. **Integrations** — external systems + reference-data lists, from trace network logs + clients.
9. **Model** — the target JSON object, in `trade-imports-animals` house style (journey → JSON → Mongo).
10. **Backlog** — ordered increments, born-blocked behind conflicts/gaps that need a human ruling.
11. **Critic** — completeness sweep: what's still missing and structurally un-mineable.

`doa-and-legacy-enrich.workflow.js` is a **supplementary pass** run *after* the main one for the same
type, once two things are authorised: folding in the delegated-authority (DoA) traces the main filter
skips, and reading the legacy IPAFFS source for validation copy + field mandatoriness. On CHED-PP this
moved grounded validation-message coverage from ~5% to ~74%.

## Running it

Invoke via the Workflow tool, parameterised by `chedType`:

```
Workflow({ scriptPath: ".../workflows/trace-to-requirements.workflow.js", args: { chedType: "ched-d" } })
```

then, once you've authorised DoA + legacy reading:

```
Workflow({ scriptPath: ".../workflows/doa-and-legacy-enrich.workflow.js", args: { chedType: "ched-d" } })
```

`chedType` ∈ `ched-a | ched-d | ched-p | ched-pp` (defaults to `ched-pp`). The supplementary pass
auto-discovers the DoA traces for the type from the index; pass `args.doaHashes: [...]` to override.

**Prerequisites**
- The trace corpus present at `ipaffs-playwright-traces/playwright-report/data/` (gitignored, ~2.5GB,
  pulled from the ipaffs-qa-automation Jenkins job). A raw index at
  `workareas/trace-requirements/<type>/trace-index.raw.txt` — build it by running
  `playwright trace open` over every zip and capturing Title/Actions/Pages/Errors (see `trace-index.json`).
- `npx @playwright/test@1.61.1` (the `playwright trace` CLI — v1.59+; the extractor).
- Local clones of `ipaffs-qa-automation` and (for the supplementary pass) the IPAFFS app repos.

**Outputs** land in the gitignored workarea `workareas/trace-requirements/<type>/`. Copy the curated
deliverables into `workareas/shared/trace-requirements/<type>/` (as done for `ched-pp/`) for the
review handoff — `SPEC-GATE.md` is the artefact a human reviews.

## Per-type config and the sharp edge

Each type differs in what it imports, its legacy notification-type enum (CHED-A=`CVEDA`, CHED-P=`CVEDP`,
CHED-D=`CED`, CHED-PP=`CHEDPP` — legacy naming rot, do not inherit), where its IPAFFS templates live,
its Dynamics/SOAP client, and its trace-selection filter. All of this lives in the `CHED_CONFIG` map at
the top of each script.

**The trace-selection trap** is the one thing to get exactly right: `ched-p` is a substring of `ched-pp`.
Selecting CHED-P must *include* `ched-p`/`chedp` **and exclude** anything matching `ched-pp`/`chedpp`;
selecting CHED-PP is safe with `ched-pp` (it never matches CHED-P). The config encodes the exact
boundary rule per type.

## Verification status — read before trusting a non-PP run

**Only CHED-PP has been run end-to-end.** It is the proven reference: 39 pages, 354 fields, 42
increments, validation coverage ~74% after enrichment. Its outputs are in `ched-pp/`.

**CHED-A / CHED-D / CHED-P are wired but UNVERIFIED.** The pipeline is parameterised for them, but no
run has exercised those paths — per-type template layouts, filter boundaries and DoA discovery could
surprise. **Run one as a canary, verify its `SPEC-GATE.md`, then trust the others** (canary-first, not
spot-check). A first run for a new type may need a small config tweak once its real trace/template
shape is seen.

## What a trace cannot tell you

Even with legacy source authorised, some requirements are structurally invisible to this method:
business rules with no UI and no message key (eligibility rules, risk categorisation, downstream
generation logic, cross-entity filtering). The Critic wave names these as the residual human/policy
questions — they are a finding, not a gap the tooling can close.
