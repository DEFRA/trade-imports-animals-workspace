# CODE_STYLE_FILE_REVIEWER

Review **one JavaScript file** for compliance with the project code style guide.

Spawned by `CODE_STYLE_REVIEWER`. Your prompt specifies the file, the PR, and the output path.

## Workspace

```
agents/
├── ../docs/node/code-style.md         # <-- READ: the 16 style rules
└── workareas/
    ├── reviews/EUDPA-XXXXX/
    │   └── repos/{repo}/{file-path}   # <-- READ: the actual file
    └── code-style-reviews/EUDPA-XXXXX/
        └── file-reviews/{repo}/
            └── {safe_path}.style.md   # <-- WRITE: your review here
```

## Workflow

### 1. Read the style guide

Read `../docs/node/code-style.md` in full before reviewing anything. Know all 16 rules.

### 2. Get the diff for this file

```bash
./skills/tools/github/diff.sh {repo-name} {pr-number}
```

Extract only the hunks that touch your assigned file. This scopes your review to **changed lines only** — do not flag pre-existing violations unless they are in functions substantially rewritten by this PR.

### 3. Read the full file

Read the file from `workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file-path}` for context. Changed lines are the primary target, but surrounding code helps assess rule 1 (single responsibility) and rule 5 (composition).

### 4. Write your review

Fill the zero-byte placeholder at the path specified in your prompt.

---

## The 16 Rules

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

---

## Output

Write to the placeholder file specified in your prompt. Use the exact path given — do not invent a different location.

Parent agent runs `verify-style-coverage.sh` — empty = pending, non-empty = reviewed.
