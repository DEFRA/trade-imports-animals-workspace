# Phase 3 Manager — Implementation

**Bash call hygiene** — one command per Bash call. Full rule table: `~/git/defra/trade-imports-animals-workspace/docs/agent-skills.md` → "Bash call hygiene".

**Job:** Apply every `todo`-classified version per repo in strict semver
ascending order. Stop a repo on first failure.

## Boundaries

Edit source files per the plan in `versions.{repo}.json`. Hand off the
package.json / install / test / commit / state-transition cycle to
`apply-version.sh`. Do not skip versions, reorder them, or modify
`noop`-classified entries.

## Inputs

- `{run-id}` — Jira ticket e.g. EUDPA-20578

## Step 1: Snapshot work

```bash
~/git/defra/trade-imports-animals-workspace/tools/govuk/upgrade-status.sh --run-id {run-id}
```

If `Todo: 0 Failed: 0`: report "Nothing to implement. Phase 3 complete."

## Step 2: Per-repo, per-version loop

Read the in-scope repo list from `.run-meta.json`:

```bash
jq -r '.repos[]' ~/git/defra/trade-imports-animals-workspace/workareas/govuk-upgrades/{run-id}/.run-meta.json
```

For each repo, list pending versions in semver order:

```bash
~/git/defra/trade-imports-animals-workspace/tools/govuk/upgrade-status.sh \
  --run-id {run-id} --repo {repo-name} --filter pending --sort-semver --json
```

For each pending entry in that order:

### 2a. Make source-file changes

Read the plan (renders the JSON entry as markdown):

```bash
~/git/defra/trade-imports-animals-workspace/tools/govuk/render-version-plan.sh \
  --run-id {run-id} --repo {repo-name} --version {version}
```

Apply every change listed under `## Changes Required` to the files
named. Don't touch files not in the list. (No source edits are needed
for `noop`-classified versions — `apply-version.sh` short-circuits
them in Step 2b.)

### 2b. Apply

```bash
~/git/defra/trade-imports-animals-workspace/tools/govuk/apply-version.sh \
  --run-id {run-id} --repo {repo-name} --version {version}
```

`apply-version.sh` handles everything from here:

- Mutates `package.json` (exact version for intermediates, recorded
  `original_constraint_prefix + version` for the final target — it
  auto-detects "final" by comparing to `target_version` in the JSON).
- Runs `npm install` (output to `/tmp/govuk-install-...txt`).
- Runs `npm test` (output to `/tmp/govuk-test-...txt`).
- On success: `git add -A`, commits with
  `chore({run-id}): upgrade govuk-frontend to {version}`, then calls
  `version-mark-implemented.sh` with the new SHA as its LAST action.
- On failure: calls `version-mark-failed.sh` with the log path as
  the reason, exits non-zero.

If `apply-version.sh` exits non-zero, Read the referenced `/tmp/...txt`
log file, surface the failing test/error to the user, and **stop this
repo**. Do not proceed to its next pending version.

## Step 3: Report

```bash
~/git/defra/trade-imports-animals-workspace/tools/govuk/upgrade-status.sh --run-id {run-id}
```

```
=== PHASE 3 COMPLETE ===

{repo}:
  Done:   {versions}
  Noop:   {versions}
  Failed: {version — reason}

Summary:
  Applied: {N} versions committed locally (not pushed)
  Noop:    {N}
  Failed:  {N}

{If failures: name the version and repo; the test log path is in the
versions.{repo}.json failure_reason field.}
```

## Step 4: E2E (only after the last commit lands)

Per Decision 3: run E2E once after the final version commit. From the
workspace:

```bash
npm --prefix ~/git/defra/trade-imports-animals-workspace/repos/trade-imports-animals-tests run test:local
```

On E2E failure, halt and prompt the user — don't auto-revert across N
commits.
