# NPM Dependency Upgrade Workflow

Automated workflow for upgrading npm dependencies across EUDP Live Animals frontend repositories.

## Overview

**Three-phase workflow:**

1. **Phase 1: Planning** — AI agents research packages and create migration plans
2. **Phase 2: Automated implementation** — Bash scripts upgrade no-code-change packages
3. **Phase 3: Manual implementation** — AI agents handle packages requiring code changes

See `personas/npm-upgrade/ORCHESTRATOR.md` for the full workflow.

---

## Key Scripts

| Script | Purpose | When |
|--------|---------|------|
| `tools/npm/discover-upgrades.sh` | Find outdated packages, create plan stubs | Phase 1 start |
| `tools/npm/analyze-migration-plans.sh` | View planning progress and classifications | Phase 1 review |
| `tools/npm/discover-implementations.sh` | Find plans classified as no-code-change | Phase 2 start |
| `tools/npm/run-automated-upgrades.sh` | Execute automated upgrades sequentially | Phase 2 |
| `tools/npm/discover-manual-upgrades.sh` | Find plans requiring code changes | Phase 3 start |
| `tools/npm/upgrade-status.sh` | Combined status across all phases | Any time |

---

## Workspace Layout

```
workareas/npm-upgrades/{repo}/
  .upgrades-meta.json               — discovery metadata
  upgrade__{pkg}__{cur}__{tgt}.md   — migration plan per package

workareas/npm-implementations/{repo}/
  implement__{pkg}__{cur}.todo      — queued for automation
  implement__{pkg}__{cur}.done      — completed
  implement__{pkg}__{cur}.failed    — failed (with error details)
```

Both directories are ephemeral — they are created at the start of an upgrade run and cleared afterwards. Do not commit them.

---

## Migration Plan Format

Plans must include an **Automation Classification** section for the scripts to categorise them:

```markdown
## Automation Classification

**Code Changes Required:** YES / NO
**Risk Level:** LOW / MEDIUM / HIGH
**Safe for Automated Implementation:** YES / NO

**Rationale:** One sentence.
```

And the code changes section must start with `**None**` or `**Required**`:

```markdown
### Code Changes Required

**None** — backwards compatible, no modifications needed.
```

```markdown
### Code Changes Required

**Required** — the following changes must be made: ...
```

---

## Safety Features

- **Sequential processing** — one package at a time per repo (no parallel upgrades within a repo)
- **Test before commit** — baseline test run before each upgrade attempt
- **Automatic rollback** — failed upgrades are reverted and marked `.failed`
- **Cascade detection** — stops immediately if rollback itself fails
- **No auto-push** — all commits stay local until human review

---

## Scope Guidance

The workflow works best when scoped tightly. Running across many repos and many packages simultaneously generates too much concurrent work for an agent to coordinate without human guidance.

Recommended scope per run:
- **Single repo** for initial exploration or high-risk packages
- **All repos, single package** (e.g. upgrade lodash everywhere) — works well automated
- **All repos, full audit** — use for planning only; implement in smaller batches
