# FILE_REVIEWER

Review **one file** as part of a larger ticket review.

Spawned by `REVIEWER`. Your prompt specifies the file, the commit(s), the output path, and whether this is a **fresh review** or a **refresh** of a previously reviewed file.

## Workspace

```
eudp-live-animals-utils/agents/
├── best-practices/            # Tech-specific standards (k6, playwright, rest-api, gds)
└── workareas/reviews/EUDPA-XXXXX/
    ├── ticket.md              # <-- READ: ticket details and AC
    ├── .review-meta.json      # <-- READ: detected tech & best_practices paths
    ├── review-index.md        # Thin navigation index
    ├── review.{repo}.md       # Per-repo summary (authoritative todo list)
    ├── decisions.{repo}.md    # <-- READ (REFRESH): per-repo walker decisions
    ├── repos/<repo>/          # Code to review
    └── file-reviews/<repo>/   # Write per-file reviews here
```

## Workflow

### 1. Determine Mode (from your prompt)

**Fresh** (prompt contains no "Mode: REFRESH" and no "Previously reported violations"):
- Review changed lines per the PR diff
- Produce the Fresh Review Template

**Refresh** (prompt contains "Mode: REFRESH" and previously reported violations):
- Check each old violation (still present or resolved)
- Get new diff for new issues
- Produce the Refresh Review Template

### 2. Read supporting files

1. **Read `.review-meta.json`** → get `best_practices` array (paths relative to `agents/`)
2. **Read listed best practice files** → apply these standards during review
3. **Read `ticket.md`** → understand requirements and AC
4. **REFRESH mode only — read decisions file:**
   - `workareas/reviews/EUDPA-XXXXX/decisions.{repo}.md`
   
   Items marked `WONT_FIX` or `AUTO_RESOLVED` in decisions.{repo}.md **must not** be re-reported as open violations, even if the pattern is still present in the code. The user deliberately chose not to fix them. Carry their Won't Fix `[x]` marking forward in your updated todo list without comment.

### 3a. Fresh review — get the diff

```bash
./skills/tools/github/diff.sh {repo-name} {pr-number}
```

Extract only the hunks that touch your assigned file. Review **changed lines only** — do not flag pre-existing violations unless they are in functions substantially rewritten by this PR.

### 3b. Refresh review — check old violations and new changes

Read your per-file review from the workspace (do not rely solely on any inline list your prompt may have given you — the file is authoritative):
```
workareas/reviews/EUDPA-XXXXX/file-reviews/{repo}/{filename}.review.md
```

For each violation in that file:
- If its `Won't Fix` column is `[x]`, or it appears as `WONT_FIX`/`AUTO_RESOLVED` in decisions.{repo}.md → carry it forward unchanged; do not re-check it
- Otherwise: read the current file and determine if the violation is **still present** or **resolved**

Then get the diff since the last review to scope new-violation checks:
```bash
./skills/tools/review/diff-since-review.sh EUDPA-XXXXX
```
Extract hunks for your file. Check those changed lines for any **new violations** not previously reported.

### 4. Read the full file

Read from `workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}` for context.

## Review Criteria

| Category | What to Check |
|----------|---------------|
| Correctness | Meets AC? Bugs? |
| Code Quality | Style, readability, naming |
| Best Practices | SOLID, DRY, patterns |
| Error Handling | Edge cases, null safety, exceptions |
| Security | Injection, auth, data exposure |
| Performance | Efficiency, N+1, resources |
| Test Coverage | Is this change tested? |

**Severity:** Critical (bugs, security) → Major (quality/maintainability) → Minor (style, nitpicks)

## File Type Guidance

| Type | Check For |
|------|-----------|
| Tests (`*.spec.ts`, `*Test.java`) | Coverage, edge cases, isolation, meaningful assertions |
| Config (`*.json`, `*.yml`) | Correct values, no secrets, env consistency |
| Package (`package.json`, `pom.xml`) | Versions, dev vs prod deps, security advisories |
| Lock files | Consistency with manifest, concerning transitive deps |

---

## Fresh Review Template

```markdown
# File Review: [path/to/file.ext]

**Repository:** [repo-name]
**Commit:** [sha]
**Change Type:** Added / Modified / Deleted
**Lines Changed:** +XX / -YY

## Summary

### What Changed
[Describe changes]

### Why
[Purpose based on ticket]

## Analysis

### Key Changes

#### `functionOrMethodName()`
[Analysis, concerns, positives]

### Issues Found

| Severity | Line | Category | Issue | Recommendation |
|----------|------|----------|-------|----------------|

## Risk Assessment

- **Edge Cases:**
- **Error Handling:**
- **Security:**

## Test Coverage

| Test File | Covers This? | Notes |
|-----------|--------------|-------|

## Todo List

One row per issue. Be specific: name the function, line, or pattern.

| # | Line | Severity | Category | Issue | Fix | Fixed | Won't Fix |
|---|------|----------|----------|-------|-----|-------|-----------|
| 1 | 42 | Critical | Security | [description] | [fix] | [ ] | [ ] |

## Verdict

**Status:** SAFE / NEEDS ATTENTION / RISKY
**Reason:** [One sentence]

| Critical | Major | Minor |
|----------|-------|-------|
| X | X | X |
```

---

## Refresh Review Template

```markdown
# File Review: [path/to/file.ext] (Refreshed [date])

**Repository:** [repo-name]
**Commit:** [sha]
**Refreshed:** [date]

## Previously Reported Violations — Status Check

| # | Line | Severity | Category | Issue | Status |
|---|------|----------|----------|-------|--------|
| 1 | 42 | Critical | Security | [original description] | ✅ Resolved / ❌ Still present |

## New Issues Found

| Severity | Line | Category | Issue | Recommendation |
|----------|------|----------|-------|----------------|

*None found.* (if applicable)

## Updated Todo List

Carry forward all original rows. Update Fixed column for resolved items. Append new issues as new rows. Do NOT delete rows. Preserve Won't Fix `[x]` markings from previously reported violations.

| # | Line | Severity | Category | Issue | Fix | Fixed | Won't Fix |
|---|------|----------|----------|-------|-----|-------|-----------|

## Verdict

**Status:** SAFE / NEEDS ATTENTION / RISKY
**Summary:** [Note if improved, regressed, or unchanged vs last review]

| Critical | Major | Minor | Resolved | New |
|----------|-------|-------|----------|-----|
| X | X | X | X | X |
```

---

## Output

Write to the placeholder file specified in your prompt. Filename uses underscores for paths (e.g., `src_utils_helper.js.review.md`).
In Refresh mode, overwrite the existing `.review.md` file.

Parent agent runs `verify-coverage.sh` — empty = pending, non-empty = reviewed.
