---
name: govuk-upgrade
description: 'Upgrade the govuk-frontend package across the EUDP Live Animals Node.js repos (frontend, admin) using a three-phase workflow — discover all intermediate semver versions between current and latest stable, fetch each version''s CHANGELOG section and plan per-repo changes (Phase 2 fans out one `general-purpose` Task subagent per version following `references/VERSION_PLANNER.md`), then apply changes in strict semver order with npm install, tests and a per-version commit. Stays inside the govuk-frontend toolbox — Nunjucks macros, govuk-* utility classes, no custom CSS or hand-rolled components. Use when the user wants to bump or upgrade govuk-frontend specifically (triggers: "upgrade govuk-frontend", "govuk upgrade", "govuk-frontend upgrade", "bump govuk-frontend"). NOT for (non-govuk-frontend) npm package upgrades — for that, use the npm-upgrade skill.'
---

Upgrade `govuk-frontend` across the Node.js repos that consume it. The
workflow walks every intermediate semver between current and target,
plans per-repo code changes from each release's CHANGELOG, and applies
them in strict order with a commit per version.

## Path conventions

Cross-workspace paths use the literal home-relative form —
`~/git/defra/trade-imports-animals/tools/<domain>/`,
`~/git/defra/trade-imports-animals/docs/best-practices/`,
`~/git/defra/trade-imports-animals/workareas/`. Bash expands `~` to
your home directory automatically. Scripts under `tools/` hardcode the workspace path as
`$HOME/git/defra/trade-imports-animals/...` — no env var needed.
Skill-internal references stay relative
(`references/<NAME>.md`, `assets/<NAME>.md`); subagents are addressed
by name via the Task tool.

**Bash call hygiene** — the rule: **one command per Bash call**.
The allowlist matcher sees the whole command string, so a chain or
pipe doesn't match even when each piece would. Specifically:

- No `&&` / `;` / `|` between commands — separate Bash calls instead.
- No `cd <dir> && cmd ...` — use `cmd -C <dir>` (for git) or full paths.
- No `find ... -exec cmd ...` — use Glob + Read for find-then-read.
- No `$TRADE_IMPORTS_WORKSPACE/...` — use literal `~/git/defra/trade-imports-animals/...` (the `$VAR` trips Claude Code's expansion check).
- No `/Users/<you>/git/...` either — the matcher treats `~/git/...` and `/Users/<you>/git/...` as different prefixes. Type the `~/` form, don't resolve it.
- No `python3 -c` / ad-hoc tools for JSON — use `jq` or the workspace helpers under `tools/`.

**Prefer LLM-native tools over Bash combos:**

- File inspection → Read (with `offset` / `limit`), not `awk`/`sed`/`grep -n`.
- File location → Glob, not `find -exec`.
- Output filtering → script flag (`--file`, `--filter`, `--repo`), not `| awk`.

Full rule table: [`docs/agent-skills.md`](../../../docs/agent-skills.md) → "Bash call hygiene".

## When to use

This is for `govuk-frontend` specifically (Nunjucks macros + GDS
components + the SCSS utility classes). For non-govuk-frontend npm bumps,
use the `npm-upgrade` skill.

Triggers: "upgrade govuk-frontend", "govuk upgrade", "govuk-frontend
upgrade", "bump govuk-frontend".

## Repos in scope

govuk-frontend is consumed by 2 of the 4 EUDP Live Animals Node repos:

- `~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend`
- `~/git/defra/trade-imports-animals/repos/trade-imports-animals-admin`

(Not backend / stub / reference-data / tests.)

## Worker references

| Persona | Used in | Artifact |
|---|---|---|
| `references/VERSION_PLANNER.md` | `references/PHASE_2_MANAGER.md` Step 2 — one per version stub, parallel fan-out | per-version `version__*.{todo|noop}` |

Spawn idiom inside Phase 2: Task tool with `subagent_type: general-purpose`
and a prompt beginning `Follow the instructions in ~/git/defra/trade-imports-animals/.claude/skills/govuk-upgrade/references/VERSION_PLANNER.md.`
`general-purpose` carries `Tools: *` so the worker can fetch the
changelog, grep the repo and write its plan file.

## Step 1: Establish Run ID

```bash
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend branch --show-current
```

Parse `EUDPA-XXXXX` from the branch name. If not found, ask the user.

## Step 2: Branch Setup

For each repo, ensure it's on `feature/{run-id}-govuk-frontend-upgrade`:

```bash
# Check
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} branch -a | grep "feature/{run-id}-govuk-frontend-upgrade"

# Create if missing
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout -b "feature/{run-id}-govuk-frontend-upgrade"

# Switch if exists
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} checkout "feature/{run-id}-govuk-frontend-upgrade"
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

Phase 2 delegates per-version analysis to `general-purpose` Task
subagents following `references/VERSION_PLANNER.md` — one instance per
version stub, parallel fan-out.

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
- `references/PHASE_2_MANAGER.md` — fan-out to `VERSION_PLANNER.md` workers.
- `references/PHASE_3_MANAGER.md` — implementation in strict semver order.
- `references/VERSION_PLANNER.md` — single-version CHANGELOG analysis + per-repo plan classification (spawned per version as `general-purpose`).

Best-practices (load when the changelog warrants):

- `~/git/defra/trade-imports-animals/docs/best-practices/node/govuk-frontend.md` — primary technical reference.
- `~/git/defra/trade-imports-animals/docs/best-practices/gds/components.md` — GDS component rules.
- `~/git/defra/trade-imports-animals/docs/best-practices/gds/patterns.md` — question-page / task-list patterns.
- `~/git/defra/trade-imports-animals/docs/best-practices/gds/accessibility.md` — WCAG / a11y.
- `~/git/defra/trade-imports-animals/docs/best-practices/gds/styles.md` — typography + colour utilities.

Scripts (`~/git/defra/trade-imports-animals/tools/govuk/`):

- `discover-versions.sh` — Phase 1 stub creation + CHANGELOG cache.
- `fetch-changelog-section.sh` — Phase 2 helper (per-version section extraction; consumed by the subagent).
- `list-plans.sh` — Phase 1 + 2 status snapshot.
- `upgrade-status.sh` — combined status across phases.