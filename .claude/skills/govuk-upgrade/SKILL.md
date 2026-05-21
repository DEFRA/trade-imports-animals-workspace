---
name: govuk-upgrade
description: 'Upgrade the govuk-frontend package across the EUDP Live Animals Node.js repos (frontend, admin) using a three-phase workflow — discover all intermediate semver versions between current and latest stable, fetch each version''s CHANGELOG section and plan per-repo changes (one govuk-version-planner subagent per version, parallel fan-out), then apply changes in strict semver order with npm install, tests and a per-version commit. Stays inside the govuk-frontend toolbox — Nunjucks macros, govuk-* utility classes, no custom CSS or hand-rolled components. Use when the user wants to bump or upgrade govuk-frontend specifically (triggers: "upgrade govuk-frontend", "govuk upgrade", "govuk-frontend upgrade", "bump govuk-frontend"). NOT for (non-govuk-frontend) npm package upgrades — for that, use the npm-upgrade skill. Orchestrates 1 subagent: govuk-version-planner.'
---

Upgrade `govuk-frontend` across the Node.js repos that consume it. The
workflow walks every intermediate semver between current and target,
plans per-repo code changes from each release's CHANGELOG, and applies
them in strict order with a commit per version.

## Path conventions

Resolve the workspace root once per session using the `find_workspace_root`
helper defined in `${WORKSPACE_ROOT}/docs/agent-skills.md` (marker:
co-presence of `.claude/skills/` and `docs/`):

```bash
WORKSPACE_ROOT="$(find_workspace_root)" || exit 1
```

Cross-workspace references use absolute paths:

- Scripts: `${WORKSPACE_ROOT}/tools/govuk/<script>`
- Best-practices: `${WORKSPACE_ROOT}/docs/best-practices/<topic>/<file>`
- Workareas: `${WORKSPACE_ROOT}/workareas/govuk-upgrades/{run-id}/...`
- Repos: `${WORKSPACE_ROOT}/repos/<service>/`

Skill-internal references stay relative: `references/<NAME>.md`.
Subagents are addressed by name through the Task/Agent tool.

Never use bare `git rev-parse --show-toplevel` — sub-repos under
`repos/` trap it (see `docs/agent-skills.md`).

## When to use

This is for `govuk-frontend` specifically (Nunjucks macros + GDS
components + the SCSS utility classes). For non-govuk-frontend npm bumps,
use the `npm-upgrade` skill.

Triggers: "upgrade govuk-frontend", "govuk upgrade", "govuk-frontend
upgrade", "bump govuk-frontend".

## Repos in scope

govuk-frontend is consumed by 2 of the 4 EUDP Live Animals Node repos:

- `${WORKSPACE_ROOT}/repos/trade-imports-animals-frontend`
- `${WORKSPACE_ROOT}/repos/trade-imports-animals-admin`

(Not backend / stub / reference-data / tests.)

## Subagents owned

| Subagent | Used in | Tools |
|---|---|---|
| `govuk-version-planner` | `references/PHASE_2_MANAGER.md` Step 2 — one per version stub, parallel fan-out | `Read, Bash, WebFetch` |

Spawn idiom inside Phase 2: `Delegate to the govuk-version-planner
subagent` — Task tool with `subagent_type: govuk-version-planner`.

## Step 1: Establish Run ID

```bash
git -C ${WORKSPACE_ROOT}/repos/trade-imports-animals-frontend branch --show-current
```

Parse `EUDPA-XXXXX` from the branch name. If not found, ask the user.

## Step 2: Branch Setup

For each repo, ensure it's on `feature/{run-id}-govuk-frontend-upgrade`:

```bash
# Check
git -C ${WORKSPACE_ROOT}/repos/{repo-name} branch -a | grep "feature/{run-id}-govuk-frontend-upgrade"

# Create if missing
git -C ${WORKSPACE_ROOT}/repos/{repo-name} checkout -b "feature/{run-id}-govuk-frontend-upgrade"

# Switch if exists
git -C ${WORKSPACE_ROOT}/repos/{repo-name} checkout "feature/{run-id}-govuk-frontend-upgrade"
```

Both repos must be on the feature branch before continuing.

## Phase 1: Version Discovery

```
Follow references/PHASE_1_MANAGER.md. Run ID: {run-id}
```

Present its report verbatim. **Gate:** "Phase 1 complete. Proceed to
Phase 2 (changelog analysis)?"

## Phase 2: Changelog Analysis and Planning

```
Follow references/PHASE_2_MANAGER.md. Run ID: {run-id}
```

Phase 2 delegates per-version analysis to the `govuk-version-planner`
subagent — one instance per version stub, parallel fan-out.

Present its report verbatim. **Gate:** "Phase 2 complete. Proceed to
Phase 3 (implementation)?"

If any versions are marked INCOMPLETE, flag them and ask how to handle
before proceeding.

## Phase 3: Implementation

```
Follow references/PHASE_3_MANAGER.md. Run ID: {run-id}
```

Present its report verbatim. End of automated work.

## Failures

Surface any error to the user with the raw output. Do not retry or
problem-solve. Wait for instruction.

## References

- `references/PHASE_1_MANAGER.md` — version discovery + CHANGELOG cache.
- `references/PHASE_2_MANAGER.md` — fan-out to `govuk-version-planner` subagent.
- `references/PHASE_3_MANAGER.md` — implementation in strict semver order.

Best-practices (load when the changelog warrants):

- `${WORKSPACE_ROOT}/docs/best-practices/node/govuk-frontend.md` — primary technical reference.
- `${WORKSPACE_ROOT}/docs/best-practices/gds/components.md` — GDS component rules.
- `${WORKSPACE_ROOT}/docs/best-practices/gds/patterns.md` — question-page / task-list patterns.
- `${WORKSPACE_ROOT}/docs/best-practices/gds/accessibility.md` — WCAG / a11y.
- `${WORKSPACE_ROOT}/docs/best-practices/gds/styles.md` — typography + colour utilities.

Scripts (`${WORKSPACE_ROOT}/tools/govuk/`):

- `discover-versions.sh` — Phase 1 stub creation + CHANGELOG cache.
- `fetch-changelog-section.sh` — Phase 2 helper (per-version section extraction; consumed by the subagent).
- `list-plans.sh` — Phase 1 + 2 status snapshot.
- `upgrade-status.sh` — combined status across phases.

Delegated subagents (`.claude/agents/`):

- `govuk-version-planner` — single-version CHANGELOG analysis + per-repo plan classification.