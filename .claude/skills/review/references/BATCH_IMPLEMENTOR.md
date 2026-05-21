# Batch implementor — apply queued fixes

Apply all queued `Fix`-disposition items from a completed walker session.
Reads the consolidated items table, delegates to the `review-item-fixer`
subagent one item at a time, and updates the table with results — no
user input required during the run.

**Trigger:** `"implement review EUDPA-XXXXX"` or `"implement review
EUDPA-XXXXX {repo}"` (optional repo filter).

All script paths are anchored on `${WORKSPACE_ROOT}` per the parent
SKILL.md's path-conventions preamble.

---

## Step 1: Load the Fix List

Pull every item with Disposition=`Fix` and Status=`Not Done` (or
`Failed` from a prior run that should be retried):

```bash
${WORKSPACE_ROOT}/tools/review/review-items.sh EUDPA-XXXXX --filter fix --status not-done --json
```

Apply any filters from the trigger:
- `{repo}` — add `--repo {repo}`

If the fix list is empty:
```
No Fix-disposition items pending for EUDPA-XXXXX [{repo filter}]. Run `walk review EUDPA-XXXXX` first or hand-mark items.
```
And stop.

---

## Step 2: Report Starting State

```
Implementing fixes for EUDPA-XXXXX [{repo filter}]
Queued fixes: [N] ([breakdown by repo])

Order: [list of item numbers]

No input needed — running all fixes now.
```

---

## Step 3: Pre-flight Test Check

Before making any changes, run tests for each repo that has queued
fixes. Always redirect output to a tmp file and read it once — never
grep streaming output or re-run to check partial results.

### Node.js repos (frontend, admin, tests)

Unit tests:
```bash
cd ${WORKSPACE_ROOT}/repos/{repo} && npm test > /tmp/{repo}-unit-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created.

E2E tests:
```bash
cd ${WORKSPACE_ROOT}/repos/trade-imports-animals-tests && npm run test:local > /tmp/e2e-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created for the summary. If failures exist,
do NOT grep the console output — find and read the structured Playwright
artifacts instead:
```bash
find ${WORKSPACE_ROOT}/repos/trade-imports-animals-tests/test-results -name "error-context.md"
```

### Java repo (backend)
Runs surefire (unit `*Test`) and failsafe (integration `*IT`,
Testcontainers-backed) in one pass:
```bash
cd ${WORKSPACE_ROOT}/repos/trade-imports-animals-backend && mvn verify > /tmp/backend-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created. Confirm both `Tests run:` totals
(surefire and failsafe) and `BUILD SUCCESS`.

**If tests fail in any repo:**
```
CANNOT START: pre-existing test failures in {repo}
Unit: [pass/fail summary]
Integration: [pass/fail summary, backend only]
E2E: [pass/fail summary]

Resolve failures before running the implementor.
```
And stop. Do not attempt any fixes.

---

## Step 4: Apply Fixes (one at a time, sequential)

Process fixes in item-number order within each repo.

For each item, delegate to the `review-item-fixer` subagent via the Task
tool with `subagent_type: review-item-fixer`. Spawn prompt:

```
**Ticket:** EUDPA-XXXXX
**Item:** #{N}
**Repo:** {repo-name}
**File:** {path/to/file}
**Line:** {NN}
**Issue:** {issue text from the items table}
**Fix:** {fix text from the items table}
```

Wait for the subagent to return before spawning the next one (fixes
within the same repo may affect shared files or tests).

### Handling fixer results

| Result | Action |
|--------|--------|
| `DONE` | `${WORKSPACE_ROOT}/tools/review/review-set-status.sh EUDPA-XXXXX --repo {repo} --item {N} --status Done --note "{short-sha}"` |
| `SKIPPED` | `${WORKSPACE_ROOT}/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Auto-Resolved" --note "{what was found}"` |
| `FAILED` | `${WORKSPACE_ROOT}/tools/review/review-set-status.sh EUDPA-XXXXX --repo {repo} --item {N} --status Failed --note "{reason}"` |
| `CANNOT START` | **Stop immediately.** Report pre-existing failures. Ask user to resolve before re-running. |
| `WON'T FIX` | `${WORKSPACE_ROOT}/tools/review/review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Won't Fix" --note "{reason}"` |

---

## Step 5: Final Report

```
Implementation complete for EUDPA-XXXXX [{filters}].

Results:
  ✅ Fixed:          N items
  🔍 Auto-resolved:  N items (already fixed in code)
  ❌ Won't Fix:      N items (fixer determined not applicable)
  🔥 Failed:         N items

Fixed:
  #{N} [{repo}] — {description} ({short-sha})
  ...

Failed (Status=Failed in the items table — re-run to retry):
  #{N} [{repo}] — {reason}
  ...

Run `${WORKSPACE_ROOT}/tools/review/review-counts.sh EUDPA-XXXXX` for the updated breakdown.
```
