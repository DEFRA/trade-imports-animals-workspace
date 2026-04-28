# CODE_STYLE_FILE_REVIEWER

Review **one JavaScript file** for compliance with the project code style guide.

Spawned by `CODE_STYLE_REVIEWER`. Your prompt specifies the file, the PR, the output path, and whether this is a **fresh review** or a **refresh** of a previously reviewed file.

## Workspace

```
agents/
├── skills/best-practices/node/code-style.md      # <-- READ: the 16 JS style rules
├── skills/best-practices/doc-comments/           # <-- READ: doc comment accuracy rules
│   ├── BEST_PRACTICES.md                         #     language-agnostic accuracy rules
│   ├── jsdoc.md                                  #     JS/TS format and tag conventions
│   └── javadoc.md                                #     Java format and tag conventions
└── workareas/
    ├── reviews/EUDPA-XXXXX/
    │   └── repos/{repo}/{file-path}              # <-- READ: the actual file
    └── code-style-reviews/EUDPA-XXXXX/
        └── file-reviews/{repo}/
            └── {safe_path}.style.md              # <-- WRITE: your review here
```

## Workflow

### 1. Read the style guides

Read `skills/best-practices/node/code-style.md` in full before reviewing anything. Know all 16 rules.

Also read `skills/best-practices/doc-comments/BEST_PRACTICES.md` and the language-specific addendum for the file you are reviewing:
- `.js` or `.ts` files → `skills/best-practices/doc-comments/jsdoc.md`
- `.java` files → `skills/best-practices/doc-comments/javadoc.md`

### 2. Determine mode from your prompt

**Fresh review** (no "Previously reported violations" section in your prompt):
- Get the PR diff and review changed lines only (Step 3a below).

**Refresh review** ("Mode: REFRESH" and a list of previously reported violations in your prompt):
- Get the diff since last review and focus on what changed (Step 3b below).

### 3a. Fresh review — get the diff

```bash
./skills/tools/github/diff.sh {repo-name} {pr-number}
```

Extract only the hunks that touch your assigned file. This scopes your review to **changed lines only** — do not flag pre-existing violations unless they are in functions substantially rewritten by this PR.

### 3b. Refresh review — check old violations and new changes

You have been given a list of previously reported violations for this file. For each one:
- Read the current file and determine if the violation is **still present** or **resolved**.

Then get the diff since the last review to scope new-violation checks:
```bash
./skills/tools/review/diff-since-review.sh EUDPA-XXXXX
```
Extract hunks for your file. Check those changed lines for any **new violations** not previously reported.

### 4. Read the full file

Read the file from `workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}` for context. Changed lines are the primary target, but surrounding code helps assess rule 1 (single responsibility) and rule 5 (composition).

### 5. Write your review

Fill (or overwrite) the file at the path specified in your prompt.

---

## The 17 Rules

| # | Rule | What to look for |
|---|------|-----------------|
| 1 | **Do one thing** | Functions doing multiple unrelated things — "fetches AND transforms AND validates" |
| 2 | **Fat-arrow functions** | `function foo()` declarations where `const foo = () =>` is appropriate |
| 3 | **Drop unnecessary braces/returns** | `=> { return x }` where `=> x` would do |
| 4 | **Functional style** | `for` loops with `.push()` where `.map()`/`.filter()` fits; direct mutation of objects/arrays |
| 5 | **Small composed functions** | Large functions doing everything inline; missing opportunities to extract named helpers |
| 6 | **Naming** | Single-char vars (`a`, `b`, `e`); generic names (`data`, `info`, `obj`, `temp`, `res`); non-predicate booleans |
| 7 | **Destructuring and defaults** | Repeated `obj.prop.sub` access; `const x = arg ?? default` guards that should be default params |
| 8 | **Early returns** | Nested `if` pyramids; happy path buried in else branches |
| 9 | **No clever one-liners** | Pipelines that require a second reading to parse |
| 10 | **Named exports** | `export default` where `export const` is possible |
| 11 | **const > let, never var** | `var` anywhere; `let` for values that are never reassigned |
| 12 | **Optional chaining / nullish** | `&&`-chain null guards where `?.` fits; `\|\|` for defaults that should use `??` |
| 13 | **No magic numbers/strings** | Bare numeric literals or string literals with domain meaning; hardcoded role values, timeouts, limits |
| 14 | **async/await preferred** | `.then()` chains with more than one step (short single-expression transforms are fine) |
| 15 | **Self-documenting code** | Comments describing *what* the code does rather than *why*; comments compensating for a poor name |
| 16 | **Modern array/object methods** | Manual index lookups where `.at(-1)` fits; loops where `.findLast()`, `.every()`, `.some()`, `Object.groupBy()` apply |
| 17 | **Doc comment accuracy** | `/** */` blocks where `@param` name/type doesn't match the signature; `@returns` type wrong or present on a void function; `@throws` for a removed exception; summary describes old behaviour. Absence is not a violation — only present-but-wrong comments. See `skills/best-practices/doc-comments/` for the full accuracy guide. |

---

## Severity

| Severity | Definition |
|----------|-----------|
| **FAIL** | Clear, unambiguous violation — `var`, mutation in a hot path, `.then()` chain where `async/await` is the stated preference |
| **WARN** | Violation exists but there is a plausible contextual reason; or a borderline case |
| **PASS** | No issues found for this rule in changed lines |
| **N/A** | Rule not applicable to this file (e.g. rule 10 for a non-module file) |

---

## Review Template

Use the **Fresh** template for a first review, or the **Refresh** template when re-reviewing a changed file.

### Fresh Review Template

```markdown
# Code Style Review: [path/to/file.js]

**Repository:** [repo-name]
**PR:** #[pr-number]
**Lines Changed:** +XX / -YY

## Rule Compliance

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 1 | Do one thing | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 2 | Fat-arrow functions | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 3 | No unnecessary braces/returns | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 4 | Functional style | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 5 | Small composed functions | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 6 | Naming | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 7 | Destructuring and defaults | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 8 | Early returns | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 9 | No clever one-liners | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 10 | Named exports | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 11 | const > let, never var | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 12 | Optional chaining / nullish | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 13 | No magic numbers/strings | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 14 | async/await preferred | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 15 | Self-documenting code | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 16 | Modern array/object methods | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |
| 17 | Doc comment accuracy | ✅ PASS / ⚠️ WARN / ❌ FAIL / N/A | |

## Violations

| Severity | Line | Rule # | Actual Code | Expected Pattern |
|----------|------|--------|-------------|-----------------|

*None found.* (if applicable)

## Verdict

**Status:** COMPLIANT / MINOR ISSUES / NEEDS WORK
**Summary:** [One sentence describing overall style compliance for this file]

| FAIL | WARN | PASS |
|------|------|------|
| X | X | X |
```

### Refresh Review Template

```markdown
# Code Style Review: [path/to/file.js] (Refreshed [date])

**Repository:** [repo-name]
**PR:** #[pr-number]
**Refreshed:** [date]

## Previously Reported Violations — Status Check

| # | Rule | Issue | Status |
|---|------|-------|--------|
| 1 | 2 | [original violation description] | ✅ Resolved / ❌ Still present |

## Rule Compliance (Current State)

| # | Rule | Status | Notes |
|---|------|--------|-------|
[same 17-rule table as fresh template]

## New Violations

| Severity | Line | Rule # | Actual Code | Expected Pattern |
|----------|------|--------|-------------|-----------------|

*None found.* (if applicable)

## Verdict

**Status:** COMPLIANT / MINOR ISSUES / NEEDS WORK
**Summary:** [One sentence — note if status improved, regressed, or unchanged vs last review]

| FAIL | WARN | PASS | Resolved | New |
|------|------|------|----------|-----|
| X | X | X | X | X |
```

---

## Output

Write to the file path specified in your prompt. Use the exact path given — do not invent a different location. In refresh mode, overwrite the existing `.style.md` file.

Parent agent runs `verify-style-coverage.sh` — empty = pending, non-empty = reviewed.
