# REVIEW_BATCH_IMPLEMENTOR

Role: Apply all queued `FIX` decisions from a completed walker session. Reads `decisions.{repo}.md` files, spawns a fixer agent per item, and updates `review.{repo}.md` with results — no user input required during the run.

**Trigger:** `"implement review EUDPA-XXXXX"` or `"implement review EUDPA-XXXXX {repo}"` (optional repo filter).

See `CLAUDE.md` for helper scripts.

---

## Step 1: Load Decisions

Read all per-repo decisions files:
```
workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md   (one per repo, e.g. decisions.trade-imports-animals-frontend.md)
```

If no decisions files exist or none contain `FIX` rows:
```
No fix decisions found for EUDPA-XXXXX. Run `walk review EUDPA-XXXXX` first.
```
And stop.

Build the fix list: every row where the first field is `FIX`, across all decisions files.

Apply any filters from the trigger:
- `{repo}` — only read `decisions.{repo}.md` for that specific repo

If the fix list is empty after filtering:
```
No queued fixes for EUDPA-XXXXX [{repo filter}].
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

For each `FIX` row, spawn a `general-purpose` agent via the Task tool:

```
Follow the instructions in skills/personas/review/REVIEW_ITEM_FIXER.md.

**Ticket:** EUDPA-XXXXX
**Item:** #{N}
**Repo:** {repo-name}
**File:** {path/to/file}
**Line:** {NN}
**Issue:** {issue text from decisions.md}
**Fix:** {fix text from decisions.md}
```

Wait for the agent to return before spawning the next one (fixes within the same repo may affect shared files or tests).

### Handling fixer results

| Result | Action |
|--------|--------|
| `DONE` | Mark Fixed `[x]` in `review.{repo}.md` (item's row). Mark Fixed `[x]` in the per-file `.review.md` at `workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/{filename}.review.md`. Update the row in `decisions.{repo}.md` from `FIX` to `DONE`. Log success. |
| `SKIPPED` | Auto-mark Fixed `[x]` (already resolved). Update row in `decisions.{repo}.md` to `AUTO_RESOLVED`. Log as auto-resolved. |
| `FAILED` | Log failure with reason. Update row in `decisions.{repo}.md` to `FAILED`. Leave `review.{repo}.md` row unchanged. Continue to next item. |
| `CANNOT START` | **Stop immediately.** Report pre-existing failures. Ask user to resolve before re-running. |
| `WON'T FIX` | Mark Won't Fix `[x]` in `review.{repo}.md` and in the per-file `.review.md`. Update row in `decisions.{repo}.md` to `WONT_FIX`. Log the fixer's reason. Continue. |

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

Failed (not committed — still in decisions.{repo}.md as FAILED):
  #{N} [{repo}] — {reason}
  ...

Remaining queued: N items (run `implement review EUDPA-XXXXX` to retry)
```

If all items succeeded, the decisions file retains the history with `DONE`/`AUTO_RESOLVED` statuses.
