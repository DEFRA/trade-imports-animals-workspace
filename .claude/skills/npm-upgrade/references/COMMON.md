# Common Reference — NPM Upgrade

Shared reference for all npm-upgrade phases.

All scripts referenced below live at `${WORKSPACE_ROOT}/tools/npm/` per
the parent SKILL.md's path-conventions preamble. The phase managers
invoke them by absolute path.

## Prerequisites

- VPN connected (Defra/Artifactory access)
- On the feature branch with a clean working directory
- Node version correct (`nvm use`)

## Scripts (cheat-sheet)

| Script | Phase | Purpose |
|--------|-------|---------|
| `discover-upgrades.sh` | 1 | Find outdated packages, create stubs |
| `upgrade-status.sh` | All | Combined status across phases |
| `run-automated-upgrades.sh` | 2 | Run automated upgrades for one repo |
| `discover-manual-upgrades.sh` | 3 | List `.manual.md` plans |

## File Extensions (Classification Signal)

- `upgrade__{pkg}.md` — unclassified stub (zero-byte, pending a `PACKAGE_PLANNER.md`-following worker)
- `upgrade__{pkg}.auto.md` — no code changes required, safe to automate
- `upgrade__{pkg}.manual.md` — code changes required, human must implement

Phase 2 implementation markers (in
`${WORKSPACE_ROOT}/workareas/npm-implementations/{run-id}/{repo}/`):

- `.todo` → `.inprogress` → `.done` / `.failed`

## Migration plan format

Plans must include an **Automation Classification** section for the
scripts to categorise them:

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

## Failure Types

| Type | Cause | Action |
|------|-------|--------|
| Connectivity | VPN/Artifactory down | Stop, report to user |
| Baseline failure | Repo tests already broken | Stop, report — not an upgrade issue |
| Install failure | Peer conflict etc. | Auto-demote to `.manual.md` |
| Test failure after upgrade | Breaking change | Rollback, auto-demote to `.manual.md` |
| Cascade failure | Rollback itself fails | Stop immediately, report |

## Workspace Layout

```
${WORKSPACE_ROOT}/workareas/npm-upgrades/{run-id}/{repo}/
  .upgrades-meta.json               — discovery metadata
  upgrade__{pkg}__{cur}__{tgt}.md   — migration plan per package

${WORKSPACE_ROOT}/workareas/npm-implementations/{run-id}/{repo}/
  implement__{pkg}__{cur}.todo      — queued for automation
  implement__{pkg}__{cur}.done      — completed
  implement__{pkg}__{cur}.failed    — failed (with error details)
```

Both directories are ephemeral runtime cache (gitignored).

## Scope guidance

The workflow works best when scoped tightly. Running across many repos
and many packages simultaneously generates too much concurrent work for
an agent to coordinate without human guidance.

Recommended scope per run:

- Single repo for initial exploration or high-risk packages.
- All repos, single package (e.g. upgrade lodash everywhere) — works well automated.
- All repos, full audit — use for planning only; implement in smaller batches.

## Global Rules

- Never push commits — all changes stay local until human review.
- Never skip test runs.
- Summaries in reports, not full logs.