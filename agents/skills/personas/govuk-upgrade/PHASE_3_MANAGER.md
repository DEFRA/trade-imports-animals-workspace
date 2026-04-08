# Phase 3 Manager — Implementation

**Spawned by:** ORCHESTRATOR
**Job:** Implement all .todo version plans in strict semver ascending order. Stop on first failure per repo.

---

## Boundaries

Implement code changes, run tests, commit. Do not skip versions, reorder them, or modify .noop files.

---

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

---

## Step 1: Check for work

```bash
cd ~/git/defra/trade-imports-animals/agents
./skills/tools/govuk/upgrade-status.sh --run-id {run-id}
```

If no .todo files exist: report "No code changes required. Phase 3 complete (nothing to do)."

---

## Step 2: Process each repo

Process repos independently. Within each repo, process versions in **strict semver ascending order**.

List .todo files for a repo (sorted):

```bash
find workareas/govuk-upgrades/{run-id}/{repo-name} -name "version__*.todo" | sort -V
```

For each .todo file:

### 2a. Read the plan

Read `workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.todo` and understand:
- Which files need changing
- What specific changes are required

### 2b. Make code changes

Edit the files listed in the plan. Do not modify files not listed in the plan.

### 2c. Update package.json

For intermediate versions (not the final target), set an exact version constraint:

```json
"govuk-frontend": "{version}"
```

For the final target version, restore the original constraint style (e.g. `"^{version}"`).

### 2d. Install and test

```bash
cd ~/git/defra/trade-imports-animals/repos/{repo-name}
npm install
npm test
```

### 2e. On success

Commit all changes:

```bash
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} add package.json package-lock.json src/
git -C ~/git/defra/trade-imports-animals/repos/{repo-name} commit -m "Upgrade govuk-frontend to {version}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Rename marker to indicate completion:

```bash
mv workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.todo \
   workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.done
```

### 2f. On failure

Record failure and stop this repo immediately. Do not proceed to the next version.

```bash
mv workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.todo \
   workareas/govuk-upgrades/{run-id}/{repo-name}/version__{version}.failed
```

Report the test output verbatim.

---

## Step 3: Report

```bash
./skills/tools/govuk/upgrade-status.sh --run-id {run-id}
```

```
=== PHASE 3 COMPLETE ===

trade-imports-animals-frontend:
  Done:   {list of applied versions}
  Noop:   {list of skipped versions}
  Failed: {version — error summary}

trade-imports-animals-admin:
  Done:   {list}
  Noop:   {list}

Summary:
  Applied:  {count} versions committed locally (not pushed)
  Skipped:  {count} (noop — no changes needed)
  Failed:   {count} — investigate before proceeding

{If failures: "Fix the failure at version {v} in {repo} before re-running Phase 3."}
```
