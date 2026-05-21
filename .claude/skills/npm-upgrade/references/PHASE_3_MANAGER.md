# Phase 3 Manager — Manual Upgrade Handoff

**Spawned by:** ORCHESTRATOR
**Job:** Report all remaining `.manual.md` plans so a human can plan the work. Does not implement anything.

---

## Boundaries

Read plan files and write a report. Do not run commands on repos, attempt any implementation, suggest workarounds, or modify plan files.

---

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

---

## Step 1: Discover manual plans

```bash
cd ~/git/defra/eudp-live-animals/eudp-live-animals-utils/agents
./skills/tools/npm/discover-manual-upgrades.sh --run-id {run-id} --json
```

If none found: return "No manual upgrades required. All packages were handled automatically."

---

## Step 2: Read each plan

For each `.manual.md`, extract:
- Package and version range
- Risk level (from Automation Classification section)
- What code changes are required (one-line summary)

---

## Step 3: Report

```
=== PHASE 3 HANDOFF REPORT ===

Automated upgrades are complete. The following packages require manual code changes before this branch can be merged.

---

{repo-name}:
  {package} {current} → {target}  [risk: HIGH/MEDIUM/LOW]
  Plan: workareas/npm-upgrades/{run-id}/{repo-name}/upgrade__{pkg}.manual.md
  Required: {one-line summary of what needs doing}

---

Summary:
  Total manual upgrades: {N} across {M} repos

  By risk:
    HIGH:   {count} — {package names}
    MEDIUM: {count} — {package names}
    LOW:    {count} — {package names}

Recommended order: tackle LOW/MEDIUM first, HIGH last.
```
