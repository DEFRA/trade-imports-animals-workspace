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

Auto-detected at Phase 1 by `discover-repos.sh` — any repo under
`repos/*` whose `package.json` lists `govuk-frontend` is in scope. The
list is written to
`workareas/govuk-upgrades/{run-id}/.run-meta.json` as `repos[]`.
Phase 2 and Phase 3 iterate that list; no skill prose hard-codes repo
membership.

## Worker references

| Persona | Used in | Mutation surface |
|---|---|---|
| `references/VERSION_PLANNER.md` | `references/PHASE_2_MANAGER.md` Step 2 — one per unplanned version, parallel fan-out | `version-classify.sh` + `version-add-change.sh` against `versions.{repo}.json` |

Spawn idiom inside Phase 2: Task tool with `subagent_type: general-purpose`
and a prompt beginning `Follow the instructions in ~/git/defra/trade-imports-animals/.claude/skills/govuk-upgrade/references/VERSION_PLANNER.md.`
`general-purpose` carries `Tools: *` so the worker can Read the pre-baked
changelog, Grep the repo, and call the `version-*` helpers.

## Step 1: Establish ticket + branch

Ask the user which ticket this upgrade tracks. Three paths:

1. **Existing ticket** — they give an `EUDPA-XXXXX`. Branch is
   `chore/EUDPA-XXXXX`. Proceed to Step 2.
2. **Create a new ticket** — call
   `~/git/defra/trade-imports-animals/tools/jira/create-ticket.sh`
   with DevOps conventions: parent `EUDPA-144`, labels
   `DevOps` + `tech-improvement`, priority Medium, type Task. See the
   `ticket-creator` skill for the GDS question-gathering flow. Capture
   the new ticket key, then Branch is `chore/EUDPA-XXXXX`.
3. **Custom branch name (no Jira ticket)** — accept the user-supplied
   branch verbatim. Use this only when there's a deliberate reason not
   to track work in Jira.

## Step 2: Run Phase 1 dispatcher

```bash
~/git/defra/trade-imports-animals/tools/govuk/start-upgrade.sh --ticket EUDPA-XXXXX [--target 6.1.0]
```

Or with a custom branch:

```bash
~/git/defra/trade-imports-animals/tools/govuk/start-upgrade.sh --branch <branch-name> [--target 6.1.0]
```

`start-upgrade.sh` writes `.run-meta.json`, ensures every in-scope repo
is on the branch, and seeds `versions.{repo}.json` + pre-bakes the
per-version changelog and best-practices files. It prints `PHASE: 1`
on the first line so you can confirm the dispatch.

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

- `start-upgrade.sh` — Phase 1 dispatcher: `.run-meta.json`, branch setup, version discovery.
- `discover-repos.sh` — write run-level `.run-meta.json` (in-scope repos).
- `discover-versions.sh` — seed `versions.{repo}.json` + cache CHANGELOG + pre-bake per-version sections + best-practices bundle.
- `setup-branch.sh` — idempotent `git checkout` for one repo + branch.
- `version-classify.sh` / `version-add-change.sh` — VERSION_PLANNER's mutation surface for `versions.{repo}.json`.
- `apply-version.sh` — Phase 3 per-version: update package.json, `npm install`, `npm test`, commit, mark implemented (last action).
- `version-mark-implemented.sh` / `version-mark-failed.sh` — state transitions used by `apply-version.sh`.
- `render-version-plan.sh` — read-only markdown view of one version's plan.
- `list-plans.sh` / `upgrade-status.sh` — filterable status views of the canonical JSON.