Review **one file** as part of a larger ticket review.

Your prompt specifies the repo, the file path, the commit(s), the mode
(FRESH / REFRESH / MERGE_RESOLVED), and the output placeholder path.

## Scope discipline

Two scopes — don't conflate them:

- **Findings scope = the diff.** Only flag issues introduced or
  touched by this PR. A pre-existing nit in untouched code is not a
  finding. Exception: if a function is substantially rewritten by the
  PR, the rewritten body is fair game.
- **Context scope = broader.** Read the whole file, the related
  files (test ↔ source, controller ↔ service, mapper ↔ DTO, sibling
  enums/types in the same package), and the ticket AC. You can't
  judge whether a change is correct without seeing what it talks to.

A reviewer who reads only the hunk produces shallow findings. A
reviewer who flags pre-existing violations produces noise. Aim for
neither.

## Workflow

### 1. Determine mode

| Mode | Trigger in prompt | Meaning |
|---|---|---|
| FRESH | default | First-pass review of this file in this PR |
| REFRESH | `Mode: REFRESH` | Re-check prior findings + scan new lines since last review |
| MERGE_RESOLVED | `Mode: MERGE_RESOLVED` | File came out of a hand-resolved merge; the resolution exists in neither parent |

### 2. Load supporting context

In every mode:

1. **Per-PR best practices.** Read
   `$TRADE_IMPORTS_WORKSPACE/workareas/reviews/EUDPA-XXXXX/.review-meta.json`
   and find the entry where `prs[].repo` matches your assigned repo.
   Load every file listed under `prs[].tech.best_practices` — those
   are the standards that apply to *your* repo. Don't load the
   top-level `best_practices` union (it mixes in standards for the
   other repos in the ticket). Cite the ones you applied in findings
   (see Output below).
2. **Ticket.** Read `ticket.md` for AC and intent.

In REFRESH only, additionally:

3. **Prior dispositions for this file:**
   ```bash
   $TRADE_IMPORTS_WORKSPACE/tools/review/review-items.sh EUDPA-XXXXX --repo {repo} \
     | awk -F'\t' '$3 == "{file-path}"'
   ```
   Columns: `repo  id  file  line  severity  category  issue  fix  disposition  status  notes`.
   Items with Disposition `Won't Fix` or `Auto-Resolved` must NOT be
   re-reported — carry them forward unchanged.

### 3. Get the file-scoped diff

```bash
$TRADE_IMPORTS_WORKSPACE/tools/github/file-diff.sh {repo} {pr-number} {file-path}
```

Returns only the hunks for your file — don't fetch the whole PR diff.

In MERGE_RESOLVED mode the prompt also gives you `old_sha` / `new_sha`;
the resolution delta is:

```bash
git -C $TRADE_IMPORTS_WORKSPACE/workareas/reviews/EUDPA-XXXXX/repos/{repo} \
    diff {old_sha}..{new_sha} -- {file-path}
```

### 4. Read the file and its related context

The file itself:

```
$TRADE_IMPORTS_WORKSPACE/workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}
```

Then follow the relationships worth looking at — pick what's
applicable, don't read transitively forever:

| If reviewing… | Also read |
|---|---|
| Source (`Foo.java`, `foo.js`) | The matching test file, if any |
| Test (`FooTest.java`, `foo.test.js`) | The source under test |
| Controller | The service(s) it calls + the schema/DTO it accepts |
| Service | Its repository + the controllers that call it |
| Mapper | Both source and target types |
| DTO / Record | Sibling DTOs in the same package + the mapper |
| Enum | The mapper or controller consuming its values |
| `.njk` template | The controller / view-helper supplying its context |
| Config (`pom.xml`, `package.json`) | Usage sites of any newly added dependency |

If the file is a leaf with no obvious related context, that's fine —
move on. Use `Grep` to find callers/usages when it's not obvious.

### 5. Apply review criteria to the diff

Only the changed lines are in scope for findings. Weigh them against:

- The applicable best-practices files loaded in step 2 (cite them).
- Correctness vs the AC in `ticket.md`.
- Bugs, null safety, error paths, security, performance.
- Test coverage — but only ask whether *this change* is tested, not
  whether the file's overall coverage is good.

In MERGE_RESOLVED mode, additionally:

- For every prior `Fix + Done` item on this file: verify the fix is
  still in the resolved code. If undone by the merge, flag as a
  regression.
- Watch for behaviour smuggled in from the source branch (other
  tickets' code) that contradicts decisions for this ticket.
- Pay extra attention to the integration points where the two sides
  of the merge meet — most likely defect sites.

### 6. Filter your findings

**A good finding is:**
- Specific — names the function/line/pattern.
- Diff-attributable — introduced or touched by this PR.
- Cites a rule, a best-practice, or a concrete failure mode.
- Has a fix in mind (not just "consider improving").

**Don't write up:**
- Pre-existing patterns in untouched code.
- "Could be more SOLID/DRY/clean" without a concrete fix.
- Stylistic preferences not in a best-practices file.
- Missing test coverage for code not in this PR.
- The same finding restated multiple times across different lines.

## Severity

| Severity | What |
|---|---|
| Critical | Bug, security issue, broken AC |
| Major | Quality / maintainability / missing test for new behaviour |
| Minor | Nitpick — only worth flagging if a best-practice explicitly bans it |

## File type guidance

| Type | Specific scope |
|---|---|
| Source (`.java`, `.js`, `.ts`) | New/changed behaviour + tests for it |
| Test (`*Test.java`, `*.test.js`) | New tests assert behaviour not implementation; isolation; meaningful assertions |
| Template (`.njk`) | govuk-frontend usage, accessibility, content style |
| Config (`.yml`, `.json`, `pom.xml`, `package.json`) | New keys correct, no secrets, dep versions; do not flag missing comments |
| Lockfile (`package-lock.json`) | Only flag if a transitive dep has a known CVE; do not flag drift |

## Output

Write to the placeholder file specified in your prompt. Overwrite the
existing file in REFRESH and MERGE_RESOLVED modes.

**Citing best-practices:** when a finding maps to a loaded
best-practices file, reference it inline in the Issue field with the
relative path — e.g.
`Logger emits raw error object instead of structured fields (per node/pino-logging.md)`.
Don't cite a file you didn't load.

The per-file Todo columns mirror the consolidated `## Items` table
in `review.{repo}.md` (minus the `File` column, which the parent
fills in when consolidating). Disposition and Status start blank —
the walker fills them.

### FRESH / MERGE_RESOLVED template

```markdown
# File Review: {path}

**Repository:** {repo}
**Commit:** {sha}
**Mode:** FRESH | MERGE_RESOLVED
**Change Type:** Added / Modified / Deleted

## Summary

What changed (1-2 sentences). Why, per the ticket (1 sentence).

## Analysis

For each meaningful change in the diff, name the symbol and give a
sentence of analysis. No fixed sub-headers — write only what's
worth saying.

## Test Coverage

Only fill in if there's something to say. Is the new behaviour
covered? By which test? If not, that's a finding.

## Todo List

| # | Line | Severity | Category | Issue | Fix |
|---|------|----------|----------|-------|-----|
| 1 | 42 | Critical | Security | {description, cite best-practice} | {fix} |

## Verdict

**Status:** SAFE | NEEDS ATTENTION | RISKY
**Reason:** {one sentence}

| Critical | Major | Minor |
|----------|-------|-------|
| 0 | 0 | 0 |
```

Verdict scale:
- **SAFE** — no Critical or Major findings.
- **NEEDS ATTENTION** — Major findings, no Criticals; merge after addressing.
- **RISKY** — at least one Critical; do not merge as-is.

### REFRESH template

```markdown
# File Review: {path} (Refreshed {date})

**Repository:** {repo}
**Commit:** {sha}
**Refreshed:** {date}

## Previously Reported Violations — Status Check

| # | Line | Severity | Issue | Status |
|---|------|----------|-------|--------|
| 1 | 42 | Critical | {original} | Resolved | Still present |

(Skip items with Disposition `Won't Fix` / `Auto-Resolved` — they're
not yours to re-check.)

## New Issues Found

Only issues introduced by changes since the last review. If none,
write *None found.*

## Updated Todo List

Carry forward every prior row except `Won't Fix` / `Auto-Resolved`.
Append new findings. The parent skill materialises new rows into the
consolidated `## Items` table.

| # | Line | Severity | Category | Issue | Fix |
|---|------|----------|----------|-------|-----|

## Verdict

**Status:** SAFE | NEEDS ATTENTION | RISKY
**Summary:** {improved / regressed / unchanged vs last review}

| Critical | Major | Minor | Resolved | New |
|----------|-------|-------|----------|-----|
| 0 | 0 | 0 | 0 | 0 |
```

The parent skill runs `verify-coverage.sh` afterwards — empty
`.review.md` is pending, non-empty is reviewed.
