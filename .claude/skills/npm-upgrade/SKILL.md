---
name: npm-upgrade
description: 'Upgrade (non-govuk-frontend) npm package upgrades across the EUDP Live Animals repos via a three-phase workflow — discover outdated packages, classify each as auto (no code changes) or manual (breaking changes), run automated upgrades with rollback safety, and produce a handoff report for the remaining manual work. Fans out per-package research in Phase 1 to `general-purpose` Task subagents that follow the `references/PACKAGE_PLANNER.md` worker persona. Use when the user asks to bring npm packages up to date across repos (triggers: "upgrade npm deps", "upgrade npm dependencies", "upgrade dependencies", "run npm upgrades"). NOT for one-off `npm install <pkg>` work, and NOT for govuk-frontend specifically — use the `govuk-upgrade` skill for that (single package, changelog-driven, per-version sequencing).'
---

Three-phase npm dependency upgrade workflow for EUDP Live Animals. Phase
1 discovers + plans, Phase 2 applies the no-code-change upgrades, Phase
3 reports what still needs human work.

## Path conventions

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals/tools/<domain>/`,
`~/git/defra/trade-imports-animals/docs/best-practices/`,
`~/git/defra/trade-imports-animals/workareas/`. Bash expands `~` to
your home directory automatically. Scripts under `tools/` still use
the `$TRADE_IMPORTS_WORKSPACE` env var internally — set it in your
shell profile, see [`docs/agent-onboarding.md`](../../../docs/agent-onboarding.md).
Skill-internal references stay relative
(`references/<NAME>.md`, `assets/<NAME>.md`); subagents are addressed
by name via the Task tool.

**Bash call hygiene** (avoid permission prompts):
- Invoke scripts via the literal `~/git/defra/trade-imports-animals/tools/...` path. Never `cd <workspace> && tools/...` or bare `tools/...` — neither matches the allowlist.
- One Bash call per script invocation. Don't chain with `&&` or `;` — the matcher treats the whole string as a single command, and chained forms aren't allowlisted.
- Don't reach for `python3 -c "..."` or other ad-hoc tools to query workspace JSON — use `jq` or the helpers under `tools/`.

Full rule table: [`docs/agent-skills.md`](../../../docs/agent-skills.md) → "Bash call hygiene".

## Worker references

| Persona | Used in | Artifact |
|---|---|---|
| `references/PACKAGE_PLANNER.md` | `references/PHASE_1_MANAGER.md` Step 2 — one per outdated package, parallel fan-out | per-package `upgrade__*.{auto|manual}.md` |

Spawn idiom inside Phase 1: Task tool with `subagent_type: general-purpose`
and a prompt beginning `Follow the instructions in ~/git/defra/trade-imports-animals/.claude/skills/npm-upgrade/references/PACKAGE_PLANNER.md.`
`general-purpose` carries `Tools: *` so the worker can WebFetch
changelogs, grep the codebase and write its plan file.

## Overview

See `references/COMMON.md` for prerequisites, failure types, file
extension conventions, and global rules shared by all phases.

## Safety features

- Sequential processing — one package at a time per repo (no parallel upgrades within a repo).
- Test before commit — baseline test run before each upgrade attempt.
- Automatic rollback — failed upgrades are reverted and marked `.failed`.
- Cascade detection — stops immediately if rollback itself fails.
- No auto-push — all commits stay local until human review.

## Repos

All EUDP Live Animals Node repos under `~/git/defra/trade-imports-animals/repos/`:

- trade-imports-animals-frontend
- trade-imports-animals-backend
- trade-imports-animals-tests
- trade-imports-animals-admin

## Step 1: Establish Run ID

```bash
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend branch --show-current
```

Parse `EUDPA-XXXXX` from the branch name (e.g.
`feature/EUDPA-20578-...` → `EUDPA-20578`). If not found, ask the user.

## Step 2: Branch Setup

For each repo, ensure it's on `feature/{run-id}-npm-dependency-upgrades`:

```bash
# Check
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} branch -a | grep "feature/{run-id}-npm-dependency-upgrades"

# Create if missing
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout -b "feature/{run-id}-npm-dependency-upgrades"

# Switch if exists
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout "feature/{run-id}-npm-dependency-upgrades"
```

All repos must be on the feature branch before continuing.

## Phase 1: Planning

```
Follow references/PHASE_1_MANAGER.md. Run ID: {run-id}
```

Phase 1 delegates per-package research to `general-purpose` Task
subagents following `references/PACKAGE_PLANNER.md` — one instance per
outdated package, parallel fan-out.

Present its report verbatim. **Gate:** "Phase 1 complete. Proceed to
Phase 2?"

## Phase 2: Automated Upgrades

```
Follow references/PHASE_2_MANAGER.md. Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 2 complete. Proceed to
Phase 3 handoff?"

If cascade failures are reported, flag them and ask how to handle before
proceeding.

## Phase 3: Handoff Report

```
Follow references/PHASE_3_MANAGER.md. Run ID: {run-id}
```

Present its report verbatim. End of automated work.

## Failures

Surface any error to the user with the raw output. Do not retry or
problem-solve. Wait for instruction.

## Scope guidance

The workflow works best when scoped tightly. Running across many repos
and many packages simultaneously generates too much concurrent work for
an agent to coordinate without human guidance.

Recommended scope per run:

- Single repo for initial exploration or high-risk packages.
- All repos, single package (e.g. upgrade lodash everywhere) — works well automated.
- All repos, full audit — use for planning only; implement in smaller batches.

## References

- `references/COMMON.md` — prerequisites, failure types, file extensions, global rules.
- `references/PHASE_1_MANAGER.md` — discovery + fan-out to `PACKAGE_PLANNER.md` workers.
- `references/PHASE_2_MANAGER.md` — automated upgrades.
- `references/PHASE_3_MANAGER.md` — manual handoff report.
- `references/PACKAGE_PLANNER.md` — single-package research + auto/manual classification (spawned per package as `general-purpose`).

Scripts (`~/git/defra/trade-imports-animals/tools/npm/`):

- `discover-upgrades.sh` — Phase 1 stub creation.
- `analyze-migration-plans.sh` — Phase 1 status snapshot.
- `discover-implementations.sh` — Phase 2 todo marker creation.
- `run-automated-upgrades.sh` — Phase 2 per-repo runner.
- `upgrade-one-package.sh` — Phase 2 helper (install + test + commit + rollback).
- `discover-manual-upgrades.sh` — Phase 3 manual list.
- `upgrade-status.sh` — combined status across phases.
