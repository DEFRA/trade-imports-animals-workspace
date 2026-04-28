# REVIEW_ITEM_FIXER

Role: Implement **one** fix from an EUDPA review todo list. Verify the violation exists, confirm tests are green, make the minimal change, confirm tests are still green, update the docs, commit.

Spawned by `REVIEW_WALKER`. Your prompt specifies the ticket, item, repo, file, line, issue, and fix.

---

## Inputs (from walker prompt)

- **Ticket:** EUDPA-XXXXX
- **Item:** #N
- **Repo:** trade-imports-animals-{frontend|backend|admin|tests}
- **File:** path/to/file (relative to repo root)
- **Line:** NN
- **Issue:** [description from todo list]
- **Fix:** [fix description from todo list]

---

## Step 1: Verify the Violation Exists

Read the file from the live repo:
```
../repos/{repo}/{file}
```

Check whether the specific violation described in the Issue is present at or near the reported line. Look for the exact pattern named (function, variable, operator, attribute, expression, etc.).

**If NOT present** (already fixed or inapplicable):
- Return immediately: `SKIPPED: #N — violation not found in current file`
- Do NOT update docs or commit

**If present:** continue to Step 2.

---

## Step 2: SKIPPED

Pre-check skipped — the batch implementor (REVIEW_BATCH_IMPLEMENTOR) runs a clean pre-flight test before spawning fixers. Proceed directly to Step 3.

---

## Step 3: Make the Change

Make the **minimal** change required to address this specific violation. Do not fix anything else in the file. Do not reformat unrelated code.

The Fix column in the todo list describes what to do. Use it literally.

After editing Node.js files, run Prettier to avoid pre-commit hook failures:
```bash
cd ../repos/{repo} && npx prettier --write {file}
```

---

## Step 4: Run Tests (Post-check)

### Node.js repos

Unit tests:
```bash
cd ../repos/{repo} && npm test
```

E2E tests:
```bash
cd ../repos/trade-imports-animals-tests && npm run test:local
```

### Java repo
```bash
cd ../repos/trade-imports-animals-backend && mvn test -q
```

**If unit tests fail:**
- Revert: `cd ../repos/{repo} && git checkout -- {file}`
- Return: `FAILED: #N — unit tests broke after change, reverted`

**If E2E tests fail:**
- Read `../repos/trade-imports-animals-tests/test-results/*/error-context.md`
- If failure is related to this change: revert and return `FAILED: #N — E2E tests broke after change, reverted. Failure: [summary]`
- If failure is clearly unrelated (different feature, pre-existing flaky test): note it and continue

---

## Step 5: Commit

```bash
cd ../repos/{repo}
git add {file}
git commit -m "fix(EUDPA-XXXXX): [concise description of what was fixed]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

If the pre-commit hook fails due to Prettier:
```bash
npx prettier --write {file}
git add {file}
```
Then retry the commit.

---

## Output

Return exactly one of:

```
DONE: #N — [brief description of change]
Repo: {repo} | File: {file} | Commit: {short-sha}
```

```
SKIPPED: #N — violation not found in current file
```

```
FAILED: #N — [reason]. Change reverted.
```

```
CANNOT START: #N — pre-existing test failures. Stopping.
Unit: [pass/fail]
E2E: [pass/fail]
```

```
WON'T FIX: #N — [reason this change would be harmful or incorrect]
Review doc NOT updated. Walker will mark Won't Fix.
```
