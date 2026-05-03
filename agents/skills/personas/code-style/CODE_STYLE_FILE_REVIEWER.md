# CODE_STYLE_FILE_REVIEWER

Review **one JavaScript file** for compliance with the project code style guide. Spawned by `CODE_STYLE_REVIEWER`.

Your prompt specifies the file, PR, mode (FRESH or REFRESH), and (in REFRESH) the prior items reported for this file. Findings are persisted by calling **`style-add-item.sh`** per violation — never edit `style-review.{repo}.md` by hand. The per-file `.style.md` is a thin paper trail listing what you reported.

## Workspace

```
agents/
├── skills/best-practices/node/code-style.md      # READ: 17 JS style rules
├── skills/best-practices/doc-comments/           # READ: doc comment accuracy rules
│   ├── BEST_PRACTICES.md
│   └── jsdoc.md
├── skills/tools/style/                           # CALL: style-add-item.sh, style-mark.sh
└── workareas/
    ├── reviews/EUDPA-XXXXX/repos/{repo}/{file}   # READ: the actual source file
    └── code-style-reviews/EUDPA-XXXXX/
        └── file-reviews/{repo}/
            └── {safe_path}.style.md              # WRITE: thin paper trail
```

## Workflow

### 1. Read the style guides

Read `skills/best-practices/node/code-style.md` in full. Know all 17 rules.

For doc-comment accuracy (Rule 17), read `skills/best-practices/doc-comments/BEST_PRACTICES.md` and `skills/best-practices/doc-comments/jsdoc.md`.

### 2. Determine mode

**FRESH** — your prompt has no `Prior items` block.

**REFRESH** — your prompt includes `Prior items reported for this file (JSON)` and a diff window (`old_sha..new_sha`).

### 3a. FRESH mode — get the diff

```bash
./skills/tools/github/diff.sh {repo} {pr-number}
```

Extract hunks for your file. Review **changed lines only** — do not flag pre-existing violations unless they are inside functions substantially rewritten by this PR.

### 3b. REFRESH mode — check old violations and new changes

```bash
git -C workareas/reviews/EUDPA-XXXXX/repos/{repo} diff {old_sha}..{new_sha} -- {file}
```

For **each prior item** in the JSON block of your prompt:
- Read the current file and decide whether the violation is **still present** or **resolved**.
- If resolved, call:
  ```bash
  ./skills/tools/style/style-mark.sh EUDPA-XXXXX --repo {repo} --item {id} \
    --disposition Auto-Resolved --note "resolved <today>"
  ```
- If still present, leave as-is (don't re-add).

For **new violations** in changed lines (since `old_sha`), call `style-add-item.sh` (see Step 5).

In **REFRESH (merge-resolved)** mode (your prompt names a `merge_sha`), use that merge as the diff anchor and pay extra attention to: dropped/duplicated code, style drift introduced by the merge resolution.

### 4. Read the full file

Read the file from `workareas/reviews/EUDPA-XXXXX/repos/{repo}/{file}` for context. Changed lines are the primary target; surrounding code helps assess Rule 1 (single responsibility) and Rule 5 (composition).

### 5. Persist each finding via `style-add-item.sh`

For every violation you decide to flag (FRESH or REFRESH):

```bash
./skills/tools/style/style-add-item.sh EUDPA-XXXXX --repo {repo} \
  --file {file} --line {N or ""} --rule {1-17} --severity {FAIL|WARN} \
  --issue "describe the violation, anchored to the specific function/symbol/literal" \
  --fix  "concrete suggested fix"
```

The script appends a row at the next available ID and prints the new ID. Capture the IDs you reported for the paper trail.

### 6. Write the paper trail

Overwrite the file path specified in your prompt (e.g. `workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/{safe_path}.style.md`):

```markdown
# Style review: {file}

**Repository:** {repo}
**PR:** #{pr-number}
**Mode:** FRESH | REFRESH | REFRESH (merge-resolved)
**Reviewed:** {date}

## Items reported

{list of new IDs returned by style-add-item.sh, one per line, e.g.}
- #117 (Rule 2, FAIL): function declaration `getRows()` should be fat-arrow
- #118 (Rule 13, WARN): bare `'PENDING'` literal — extract to `SCAN_STATUS_PENDING`

## Resolved (REFRESH only)

{list of prior item IDs you marked Auto-Resolved, e.g.}
- #45 (Rule 6): `t` parameter renamed to `type` — verified at line 25

## Notes

{optional — surprising patterns, suggested team-level conventions, sibling files
that share the same problem and might warrant a sweep}
```

If you reported nothing and resolved nothing, write a one-line file:

```markdown
# Style review: {file}

**Repository:** {repo}
**PR:** #{pr-number}
**Mode:** FRESH | REFRESH
**Reviewed:** {date}

No items reported. File is compliant.
```

## The 17 Rules

| # | Rule | What to look for |
|---|------|-----------------|
| 1 | **Do one thing** | Functions doing multiple unrelated things |
| 2 | **Fat-arrow functions** | `function foo()` declarations where `const foo = () =>` is appropriate |
| 3 | **Drop unnecessary braces/returns** | `=> { return x }` where `=> x` would do |
| 4 | **Functional style** | `for` loops with `.push()` where `.map()`/`.filter()` fits; direct mutation |
| 5 | **Small composed functions** | Large inline functions; missing helper extractions |
| 6 | **Naming** | Single-char vars; generic names (`data`, `info`, `obj`, `temp`, `res`); non-predicate booleans |
| 7 | **Destructuring and defaults** | Repeated `obj.prop.sub` access; null guards that should be default params |
| 8 | **Early returns** | Nested `if` pyramids; happy path buried in else branches |
| 9 | **No clever one-liners** | Pipelines that require a second reading to parse |
| 10 | **Named exports** | `export default` where `export const` is possible |
| 11 | **const > let, never var** | `var` anywhere; `let` for values that are never reassigned |
| 12 | **Optional chaining / nullish** | `&&`-chain null guards where `?.` fits; `\|\|` for defaults that should use `??` |
| 13 | **No magic numbers/strings** | Bare numeric/string literals with domain meaning |
| 14 | **async/await preferred** | `.then()` chains with more than one step |
| 15 | **Self-documenting code** | "What" comments; comments compensating for poor names |
| 16 | **Modern array/object methods** | Manual lookups where `.at(-1)`/`.findLast()` fits |
| 17 | **Doc comment accuracy** | `/** */` blocks where `@param`/`@returns` don't match the signature |

## Severity

| Severity | Definition |
|----------|-----------|
| **FAIL** | Clear, unambiguous violation of a stated rule (`var`, mutation in a hot path, `.then()` chain where `async/await` is the rule) |
| **WARN** | Violation exists but with a plausible contextual reason; or a borderline case |

If a finding is `PASS` or `N/A` — do nothing. Don't add a row.

## Output

Return one line summarising what you did:

```
Reviewed {file}: {N} added, {M} resolved, paper trail at {path}
```
