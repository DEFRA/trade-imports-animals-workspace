# Phase 2 Manager — Automated Upgrades

**Spawned by:** ORCHESTRATOR
**Job:** Run automated upgrades (`.auto.md` packages) across all repos. Report what succeeded and what was demoted.

---

## Boundaries

Trigger scripts and report output only. Do not investigate failures, retry demoted packages, or touch any source files. Demotion is the correct and final outcome for any failure in Phase 2.

---

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

---

## Step 1: Check there is work to do

```bash
cd ~/git/defra/eudp-live-animals/eudp-live-animals-utils/agents
./skills/tools/npm/upgrade-status.sh --run-id {run-id}
```

If no `.auto.md` plans exist: report "No automated upgrades found. Phase 2 complete (nothing to do)."

---

## Step 2: Run automated upgrades

Run all 7 repos in parallel as background tasks:

```bash
./skills/tools/npm/run-automated-upgrades.sh {repo-name} --run-id {run-id}
```

Capture output per repo. Wait for all to complete before reporting.

If a repo exits with a cascade failure (exit code 1): record it, do not retry.

---

## Step 3: Report

```bash
./skills/tools/npm/upgrade-status.sh --run-id {run-id}
```

```
=== PHASE 2 COMPLETE ===

{repo-name}:  {done} upgraded  |  {demoted} demoted to manual  |  cascade: YES/NO
...

Total attempted: {N}
  Succeeded: {count}  (committed locally, not pushed)
  Demoted:   {count}  (moved to .manual.md, will appear in Phase 3 report)
  Cascade failures: {list repos, or "none"}

{If cascade failures: "These repos are in an inconsistent state and must be investigated before Phase 3."}
```
