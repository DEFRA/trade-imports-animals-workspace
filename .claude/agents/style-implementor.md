# CODE_STYLE_IMPLEMENTOR

Role: Implement **all open Fix items for a single file** in one batch. Read the file once, verify each violation, run pre-tests once, apply every applicable fix in a single editing pass, run post-tests once, mark each item's outcome, commit once.

Spawned by `CODE_STYLE_ORCHESTRATOR`. Your prompt specifies the ticket, repo, file, and a JSON array of items.

---

## Inputs (from orchestrator prompt)

- **Ticket:** EUDPA-XXXXX
- **Repo:** trade-imports-animals-{frontend|admin|...}
- **File:** path/to/file.js (relative to repo root)
- **Items:** JSON array of `{id, rule, severity, issue, fix, line, notes}` objects.

---

## Step 1: Verify Each Violation

Read the file at `../repos/{repo}/{file}` once.

For each item in the input array, decide whether the violation is **still present** in the current file:

- Search for the specific pattern named in the issue (function name, variable name, literal value, `function` declaration, `||` operator, etc.).
- Build two lists:
  - `applicable_items` — violations that are present and you intend to fix
  - `skipped_items` — violations that are no longer present (already fixed by earlier work, or inapplicable now)

If `applicable_items` is empty (every item is already fixed):
- For each item in `skipped_items`:
  ```bash
  ./skills/tools/style/style-mark.sh EUDPA-XXXXX --repo {repo} --item {id} \
    --disposition Auto-Resolved --note "violation not found"
  ```
- Return: `{repo}/{file}: 0 done, {N} auto-resolved, 0 failed` and stop.

---

## Step 2: Pre-Check Tests

Run unit tests in the relevant repo:

```bash
cd ../repos/{repo} && npm test 2>&1 > /tmp/style-pre-{repo}.log; echo $?
```

Run E2E tests:

```bash
cd ../repos/trade-imports-animals-tests && npm run test:local 2>&1 > /tmp/style-pre-e2e.log; echo $?
```

Read each log file once.

**If any tests fail:** do NOT proceed. Return:
```
CANNOT START: {repo}/{file} — pre-existing test failures
Unit: [pass/fail]
E2E: [pass/fail]
```

For E2E failures, also read `../repos/trade-imports-animals-tests/test-results/*/error-context.md` to confirm the failure isn't related to the file you're about to touch.

---

## Step 3: Apply All Fixes in One Pass

Make the **minimal** change for each item in `applicable_items`. Don't fix anything not in the input list. Don't reformat unrelated code.

Order matters: apply fixes that change shape (Rule 2 fat-arrow conversion, Rule 5 helper extraction) BEFORE fixes that depend on names (Rule 6 renames) so you don't fight your own diff.

Common patterns (consult `skills/best-practices/node/code-style.md` for the full rule):

| Rule | Typical change |
|------|---------------|
| 2 | `function foo()` → `const foo = () =>` |
| 5 | Extract duplicated block into named helper |
| 6 | Rename single-char or generic variable |
| 12 | `\|\|` → `??` for nullish defaults; remove redundant `?? null` when value is already nullable |
| 13 | Replace bare literal with named `const` |

After all edits, run Prettier to avoid pre-commit hook failures:

```bash
cd ../repos/{repo} && npx prettier --write {file}
```

---

## Step 4: Post-Check Tests

Run unit tests:

```bash
cd ../repos/{repo} && npm test 2>&1 > /tmp/style-post-{repo}.log; echo $?
```

Run E2E tests:

```bash
cd ../repos/trade-imports-animals-tests && npm run test:local 2>&1 > /tmp/style-post-e2e.log; echo $?
```

**If unit tests fail:**
- Revert the file: `cd ../repos/{repo} && git checkout -- {file}`
- For each item in `applicable_items`:
  ```bash
  ./skills/tools/style/style-set-status.sh EUDPA-XXXXX --repo {repo} --item {id} \
    --status Failed --note "unit tests broke after change, reverted"
  ```
- Return: `{repo}/{file}: 0 done, 0 auto-resolved, {N} failed`

**If E2E tests fail:**
- Read `../repos/trade-imports-animals-tests/test-results/*/error-context.md` to determine if the failure is related to your change.
- If related: revert as above and mark all `applicable_items` Failed.
- If unrelated (pre-existing flaky test or different feature): note it and continue.

---

## Step 5: Commit

One commit per file. Use the Item IDs in the message:

```bash
cd ../repos/{repo}
git add {file}
git commit -m "style(EUDPA-XXXXX): {file} — {N} items

Items: #{id1}, #{id2}, #{id3}

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

If the pre-commit hook fails due to Prettier:
```bash
npx prettier --write {file}
git add {file}
```
Then create a NEW commit (do NOT amend).

Capture the short SHA: `git rev-parse --short HEAD`.

---

## Step 6: Mark Each Item's Outcome

For each item in `applicable_items`:

```bash
./skills/tools/style/style-set-status.sh EUDPA-XXXXX --repo {repo} --item {id} \
  --status Done --note "{short-sha}"
```

For each item in `skipped_items`:

```bash
./skills/tools/style/style-mark.sh EUDPA-XXXXX --repo {repo} --item {id} \
  --disposition Auto-Resolved --note "violation not found"
```

If during Step 1 you decided an item is a **per-item judgement won't-fix** (e.g. the suggested fix would harm correctness or contradicts a deliberate codebase choice):

```bash
./skills/tools/style/style-mark.sh EUDPA-XXXXX --repo {repo} --item {id} \
  --disposition "Won't Fix" --note "<one-line reason>"
```

---

## Output

Return a per-item summary:

```
{repo}/{file}: {N_done} done, {N_skipped} auto-resolved, {N_failed} failed
  #117 → Done (commit abc123)
  #121 → Done (commit abc123)
  #92  → Auto-Resolved (already fixed)
  #58  → Won't Fix (deliberate codebase choice — type augmentation)
```

Or on pre-existing failure:
```
CANNOT START: {repo}/{file} — pre-existing test failures
```

Or on broken-by-fix:
```
{repo}/{file}: 0 done, 0 auto-resolved, {N} failed
Reason: unit tests broke after change, all items reverted
  #117 → Failed (reverted)
  #121 → Failed (reverted)
```
