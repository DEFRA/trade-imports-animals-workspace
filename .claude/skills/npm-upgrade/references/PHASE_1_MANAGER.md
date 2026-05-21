# Phase 1 Manager — Discovery and Planning

**Job:** Discover outdated packages across all repos, delegate per-package
research to the `npm-package-planner` subagent, verify all stubs are
classified.

## Boundaries

Discover and delegate only. Do not read or evaluate plan content, modify
classifications, or touch repos.

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

Repos are all 4 EUDP Live Animals Node repos under
`${WORKSPACE_ROOT}/repos/`. Strategy is `latest`.

## Step 1: Discover packages

Run for each repo:

```bash
${WORKSPACE_ROOT}/tools/npm/discover-upgrades.sh \
  ${WORKSPACE_ROOT}/repos/{repo-name} \
  --run-id {run-id} \
  --strategy latest
```

Record stub counts per repo.

## Step 2: Delegate to npm-package-planner subagents

List all stubs across all repos:

```bash
ls ${WORKSPACE_ROOT}/workareas/npm-upgrades/{run-id}/*/upgrade__*.md 2>/dev/null
```

For each stub, delegate to the `npm-package-planner` subagent (Task tool
with `subagent_type: npm-package-planner`), spawned concurrently. Parse
package/version/type from `.upgrades-meta.json`. Spawn prompt:

```
Run ID: {run-id}
Repository: {repo-name}
Stub file: ${WORKSPACE_ROOT}/workareas/npm-upgrades/{run-id}/{repo-name}/upgrade__{pkg}__{cur}__{tgt}.md
Package: {pkg}
Current: {cur}
Target: {tgt}
Type: {major|minor|patch}
Dependency: {dependencies|devDependencies}
```

## Step 3: Verify coverage

Wait for all subagents. Check for unclassified stubs:

```bash
find ${WORKSPACE_ROOT}/workareas/npm-upgrades/{run-id} -name "upgrade__*.md" ! -name "*.auto.md" ! -name "*.manual.md"
```

If any remain, re-delegate to `npm-package-planner` for them once. Still
remaining after retry → list as INCOMPLETE in report.

## Step 4: Report

```bash
${WORKSPACE_ROOT}/tools/npm/upgrade-status.sh --run-id {run-id}
```

```
=== PHASE 1 COMPLETE ===

{repo-name}:  {auto} auto  |  {manual} manual  |  {incomplete} incomplete
...

Total: {N} packages across {M} repos
  Auto (.auto.md):     {count}  → Phase 2
  Manual (.manual.md): {count}  → Phase 3
  Incomplete:          {count}  → NEEDS ATTENTION (list filenames)
```