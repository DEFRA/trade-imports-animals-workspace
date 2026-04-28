# CODE_STYLE_IMPLEMENTOR

Role: Implement **one** code style fix from a EUDPA-XXXXX style review todo list. Verify the violation exists, confirm tests are green, make the minimal change, confirm tests are still green, update the doc, commit.

Spawned by `CODE_STYLE_ORCHESTRATOR`. Your prompt specifies the ticket, item, repo, file, and issue.

---

## Inputs (from orchestrator prompt)

- **Ticket:** EUDPA-XXXXX
- **Item:** #N (row number in the repo's todo section)
- **Repo:** trade-imports-animals-{frontend|admin|...}
- **File:** path/to/file.js (relative to repo root)
- **Rule:** N
- **Issue:** [description from todo list]

---

## Step 1: Verify the Violation Exists

Read the file at:
```
../repos/{repo}/{file}
```

Check whether the specific violation described in the issue is actually present in the current file. Look for the exact pattern named (function name, variable name, literal value, etc.).

**If the violation is NOT present** (already fixed by earlier work or inapplicable):
- Return immediately: `SKIPPED: #N — violation not found in current file`
- Do NOT update the doc or commit

**If the violation IS present**: continue to Step 2.

---

## Step 2: Run Tests (Pre-check)

Run unit tests in the relevant repo:

```bash
cd ../repos/{repo} && npm test
```

Run E2E tests:

```bash
cd ../repos/trade-imports-animals-tests && npm run test:local
```

**If any tests fail:** do NOT proceed. Return:
```
CANNOT START: #N — pre-existing test failures
Unit: [pass/fail]
E2E: [pass/fail]
```

For E2E failures, read `../repos/trade-imports-animals-tests/test-results/*/error-context.md` to understand what failed before returning.

---

## Step 3: Make the Change

Make the **minimal** change required to address the violation. Do not fix anything else in the file. Do not reformat unrelated code.

Common patterns (refer to `../docs/node/code-style.md` for the relevant rule if unsure):

| Rule | Typical change |
|------|---------------|
| 2 | `function foo()` → `const foo = () =>` |
| 5 | Extract duplicated block into named helper |
| 6 | Rename single-char or generic variable |
| 12 | `\|\|` → `??` for nullish defaults; remove redundant `?? null` when value is already nullable |
| 13 | Replace bare literal with named `const` |

After editing, run Prettier to avoid pre-commit hook failures:

```bash
cd ../repos/{repo} && npx prettier --write {file}
```

---

## Step 4: Run Tests (Post-check)

Run unit tests:

```bash
cd ../repos/{repo} && npm test
```

Run E2E tests:

```bash
cd ../repos/trade-imports-animals-tests && npm run test:local
```

**If unit tests fail:**
- Revert the file: `cd ../repos/{repo} && git checkout -- {file}`
- Return: `FAILED: #N — unit tests broke after change, reverted`

**If E2E tests fail:**
- Read `../repos/trade-imports-animals-tests/test-results/*/error-context.md` to determine if the failure is related to this change
- If related: revert and return `FAILED: #N — E2E tests broke after change, reverted. Failure: [summary]`
- If unrelated (pre-existing flaky test or different feature): note it and continue

---

## Step 5: Update the Review Doc

In `workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md`, find the row for this item and mark it addressed:

Change:
```
| N | `path/to/file.js` | Rule | Issue | [ ] | [ ] |
```
To:
```
| N | `path/to/file.js` | Rule | Issue | [x] | [ ] |
```

---

## Step 6: Commit

```bash
cd ../repos/{repo}
git add {file}
git commit -m "style(EUDPA-XXXXX): [concise description of what was fixed]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

If the pre-commit hook fails due to Prettier, run:
```bash
npx prettier --write {file}
git add {file}
```
Then retry the commit.

---

## Output

Return one of:

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
```

```
WON'T FIX: #N — [reason this change would be harmful or incorrect]
Review doc NOT updated. Orchestrator should mark Won't Address.
```
