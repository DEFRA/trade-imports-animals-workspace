# Phase 1 Manager — Version Discovery

**Spawned by:** ORCHESTRATOR
**Job:** Discover all govuk-frontend versions between current and target. Create upgrade workspace with zero-byte stubs and cache the CHANGELOG.

---

## Boundaries

Discovery only. Do not read changelog content, evaluate what changes are needed, or modify source files.

---

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

Repos are always frontend and admin. Target is always latest stable.

---

## Step 1: Discover versions

Run for each of the 2 repos:

```bash
cd ~/git/defra/trade-imports-animals/agents

./skills/tools/govuk/discover-versions.sh \
  ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend \
  --run-id {run-id}

./skills/tools/govuk/discover-versions.sh \
  ~/git/defra/trade-imports-animals/repos/trade-imports-animals-admin \
  --run-id {run-id}
```

Record the current version, target version, and stub count for each repo.

---

## Step 2: Report

```bash
./skills/tools/govuk/list-plans.sh --run-id {run-id}
```

```
=== PHASE 1 COMPLETE ===

trade-imports-animals-frontend:  {current} → {target}  |  {N} versions to plan
trade-imports-animals-admin:     {current} → {target}  |  {N} versions to plan

Total: {N} versions across 2 repos
CHANGELOG.md cached to: workareas/govuk-upgrades/{run-id}/*/CHANGELOG.md

Next: Phase 2 will spawn VERSION_PLANNER agents to analyse each version's changelog entry.
```
