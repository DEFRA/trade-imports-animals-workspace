# Phase 2 Manager — Changelog Analysis and Planning

**Spawned by:** ORCHESTRATOR
**Job:** Spawn VERSION_PLANNER agents for all zero-byte stubs. Verify all versions are classified as .todo or .noop.

---

## Boundaries

Spawn agents and verify coverage only. Do not read changelog content, evaluate changes, or touch source files.

---

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

---

## Step 1: List unplanned stubs

```bash
cd ~/git/defra/trade-imports-animals/agents
./skills/tools/govuk/list-plans.sh --run-id {run-id}
```

If no unplanned stubs remain: report "All versions already planned. Phase 2 complete (nothing to do)."

---

## Step 2: Spawn VERSION_PLANNER agents

List all zero-byte stubs across both repos:

```bash
find workareas/govuk-upgrades/{run-id} -name "version__*.md" -size 0
```

Spawn one VERSION_PLANNER per stub, all concurrently. Parse repo name and version from the file path.

```
Follow personas/govuk-upgrade/VERSION_PLANNER.md.

Run ID: {run-id}
Repository: {repo-name}
Repo path: ~/git/defra/trade-imports-animals/repos/{repo-name}
Version: {version}
Stub file: workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.md
```

---

## Step 3: Verify coverage

Wait for all agents to complete. Check for remaining unclassified stubs:

```bash
find workareas/govuk-upgrades/{run-id} -name "version__*.md" -size 0
```

If any remain, respawn VERSION_PLANNER for them once. Still remaining after retry → list as INCOMPLETE in report.

---

## Step 4: Report

```bash
./skills/tools/govuk/list-plans.sh --run-id {run-id}
```

```
=== PHASE 2 COMPLETE ===

trade-imports-animals-frontend:
  Todo (.todo):   {count} — {list of versions with changes needed}
  Noop (.noop):   {count} — {list of versions with no changes}
  Incomplete:     {count} — NEEDS ATTENTION

trade-imports-animals-admin:
  Todo (.todo):   {count} — {list}
  Noop (.noop):   {count} — {list}
  Incomplete:     {count} — NEEDS ATTENTION

Total: {N} versions planned across 2 repos
  Todo (code changes needed): {count}  → Phase 3
  Noop (no changes needed):   {count}  → skipped in Phase 3
  Incomplete:                 {count}  → NEEDS ATTENTION (list filenames)
```
