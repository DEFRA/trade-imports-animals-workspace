# REVIEW_BATCH_IMPLEMENTOR

Role: Apply all queued `Fix`-disposition items from a completed walker session. Reads the consolidated items table, spawns a fixer agent per item, and updates the table with results — no user input required during the run.

**Trigger:** `"implement review EUDPA-XXXXX"` or `"implement review EUDPA-XXXXX {repo}"` (optional repo filter).

See `CLAUDE.md` for helper scripts.

---

## Step 1: Load the Fix List

Pull every item with Disposition=`Fix` and Status=`Not Done` (or `Failed` from a prior run that should be retried):

```bash
./skills/tools/review/review-items.sh EUDPA-XXXXX --filter fix --status not-done --json
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

Before making any changes, run tests for each repo that has queued fixes. Always redirect output to a tmp file and read it once — never grep streaming output or re-run to check partial results.

### Node.js repos (frontend, admin, tests)

Unit tests:
```bash
cd ../repos/{repo} && npm test > /tmp/{repo}-unit-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created.

E2E tests:
```bash
cd ../repos/trade-imports-animals-tests && npm run test:local > /tmp/e2e-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created for the summary. If failures exist, do NOT grep the console output — find and read the structured Playwright artifacts instead:
```bash
find ../repos/trade-imports-animals-tests/test-results -name "error-context.md"
```

### Java repo (backend)
```bash
cd ../repos/trade-imports-animals-backend && mvn test > /tmp/backend-unit-tests-$(date +%Y%m%d-%H%M%S).txt 2>&1
```
Then read the file you just created.

**If tests fail in any repo:**
```
CANNOT START: pre-existing test failures in {repo}
Unit: [pass/fail summary]
E2E: [pass/fail summary]

Resolve failures before running the implementor.
```
And stop. Do not attempt any fixes.

---

## Step 4: Apply Fixes (one at a time, sequential)

Process fixes in item-number order within each repo.

For each item, spawn a `general-purpose` agent via the Task tool:

```
Follow the instructions in skills/personas/review/REVIEW_ITEM_FIXER.md.

**Ticket:** EUDPA-XXXXX
**Item:** #{N}
**Repo:** {repo-name}
**File:** {path/to/file}
**Line:** {NN}
**Issue:** {issue text from the items table}
**Fix:** {fix text from the items table}
```

Wait for the agent to return before spawning the next one (fixes within the same repo may affect shared files or tests).

### Handling fixer results

| Result | Action |
|--------|--------|
| `DONE` | `review-set-status.sh EUDPA-XXXXX --repo {repo} --item {N} --status Done --note "{short-sha}"` |
| `SKIPPED` | `review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Auto-Resolved" --note "{what was found}"` |
| `FAILED` | `review-set-status.sh EUDPA-XXXXX --repo {repo} --item {N} --status Failed --note "{reason}"` |
| `CANNOT START` | **Stop immediately.** Report pre-existing failures. Ask user to resolve before re-running. |
| `WON'T FIX` | `review-mark.sh EUDPA-XXXXX --repo {repo} --item {N} --disposition "Won't Fix" --note "{reason}"` |

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

Run `review-counts.sh EUDPA-XXXXX` for the updated breakdown.
```
