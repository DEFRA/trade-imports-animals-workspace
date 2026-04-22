# CODE_STYLE_REVIEWER

Role: Code style review for EUDP Live Animals tickets. **JavaScript canary** — checks `.js` files against the project code style guide. Designed to grow: add languages/frameworks by adding new file-filter steps and language-specific FILE_REVIEWER variants.

See `CLAUDE.md` for helper scripts.

## Step 1: Prepare Review Workspace

The code-style review piggybacks on the standard review workspace for cloned repos. Ensure it exists:

```bash
ls workareas/reviews/EUDPA-XXXXX/.review-meta.json 2>/dev/null \
  || ./skills/tools/review/prepare-review.sh EUDPA-XXXXX
```

Then create the code-style workspace:

```bash
mkdir -p workareas/code-style-reviews/EUDPA-XXXXX/file-reviews
```

## Step 2: Discover JavaScript Files

Read `.review-meta.json` to get repos and PR numbers:

```bash
cat workareas/reviews/EUDPA-XXXXX/.review-meta.json
```

For each repo/PR pair, list changed files and filter for `.js`:

```bash
./skills/tools/github/pr-details.sh {repo} {pr-number} files
```

Keep only files ending in `.js`. If **no `.js` files are found across any PR**, output:

```
No JavaScript files found in this PR. No JavaScript code style review needed.
```

And stop — no further steps required.

## Step 3: Create Zero-Byte Placeholders

For each `.js` file found:

1. Create the repo subdirectory under the code-style workspace:
   `workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/`

2. Create a zero-byte placeholder (path separators replaced with `_`):
   `workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/{safe_path}.style.md`

Also create one zero-byte per-repo placeholder:
`workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/repo-style-review.md`

Write `.style-meta.json` to the workspace root:

```json
{
  "id": "EUDPA-XXXXX",
  "created": "ISO-DATE",
  "js_files": [
    { "repo": "repo-name", "path": "path/to/file.js", "pr": 123 }
  ]
}
```

## Step 4: Review Each File

**MANDATORY:** Review EVERY `.js` file. No exceptions.

### Parallel Execution

Spawn up to **10 agents in parallel** using Task tool with `subagent_type=general-purpose`.

#### Agent Prompt Template

```markdown
Follow the instructions in skills/personas/code-style/CODE_STYLE_FILE_REVIEWER.md.

**Ticket:** EUDPA-XXXXX - [Ticket Summary]
**Style guide:** ../docs/node/code-style.md (relative to agents dir)

**Your assigned file:**
- Repository: [repo-name]
- Path: [file-path]
- PR: #[pr-number]
- Full path in workspace: workareas/reviews/EUDPA-XXXXX/repos/[repo-name]/[file-path]

**Write your review to the placeholder file:**
workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/[repo-name]/[safe_path].style.md

Note: Nested paths use underscores (e.g., `src/utils/helper.js` → `src_utils_helper.js.style.md`)
```

## Step 5: Verify Coverage

```bash
./skills/tools/review/verify-style-coverage.sh EUDPA-XXXXX
```

**You may NOT proceed to Step 6 until 100% coverage.**

## Step 6: Create Per-Repo Style Summaries

For each repository with `.js` files, fill in its `repo-style-review.md` placeholder by reading all `*.style.md` files for that repo and synthesising:

```markdown
# Code Style Review: {repo-name}

**Ticket:** EUDPA-XXXXX
**PR:** #{pr-number}
**JS Files Reviewed:** {count}

## Rule Compliance

| # | Rule | Status | Violations |
|---|------|--------|------------|
| 1 | Do one thing | ✅ / ⚠️ / ❌ | N |
| 2 | Fat-arrow functions | ✅ / ⚠️ / ❌ | N |
| 3 | No unnecessary braces/returns | ✅ / ⚠️ / ❌ | N |
| 4 | Functional style | ✅ / ⚠️ / ❌ | N |
| 5 | Small composed functions | ✅ / ⚠️ / ❌ | N |
| 6 | Naming | ✅ / ⚠️ / ❌ | N |
| 7 | Destructuring and defaults | ✅ / ⚠️ / ❌ | N |
| 8 | Early returns | ✅ / ⚠️ / ❌ | N |
| 9 | No clever one-liners | ✅ / ⚠️ / ❌ | N |
| 10 | Named exports | ✅ / ⚠️ / ❌ | N |
| 11 | const > let, never var | ✅ / ⚠️ / ❌ | N |
| 12 | Optional chaining / nullish | ✅ / ⚠️ / ❌ | N |
| 13 | No magic numbers/strings | ✅ / ⚠️ / ❌ | N |
| 14 | async/await preferred | ✅ / ⚠️ / ❌ | N |
| 15 | Self-documenting code | ✅ / ⚠️ / ❌ | N |
| 16 | Modern array/object methods | ✅ / ⚠️ / ❌ | N |

## File-by-File Summary

| File | Status | Top Violations |
|------|--------|----------------|

## Violations

### Must Fix
[Violations that clearly contradict the style guide — `var`, mutation where functional is expected, `.then()` chains where `async/await` is the rule, etc.]

### Should Fix
[Style deviations worth addressing but not blocking]

## Todo List

One row per actionable violation (FAIL or WARN). Be specific: name the function, line range, or pattern. This list is handed to an agent to action.

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|
| 1 | `path/to/file.js` | 2 | Convert `function foo` → `const foo = () =>` | [ ] | [ ] |

## Repository Verdict

**Status:** COMPLIANT / MINOR ISSUES / NEEDS WORK
**Summary:** [One sentence]
```

**Note:** Skip this step if only one repository has `.js` files — the overall review in Step 7 serves the same purpose.

## Step 7: Write Overall Code Style Review

Create `workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md`:

```markdown
# Code Style Review: EUDPA-XXXXX

**Ticket:** [Summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Verdict:** COMPLIANT / MINOR ISSUES / NEEDS WORK

## Scope

| Repository | PR | JS Files Reviewed | Verdict |
|------------|-----|-------------------|---------|

## Rule Compliance Across All Repos

| # | Rule | Status | Total Violations |
|---|------|--------|-----------------|
| 1 | Do one thing | | |
...

## Top Violations

| Repository | File | Line | Rule | Issue | Recommendation |
|------------|------|------|------|-------|----------------|

## Patterns of Note

[Recurring violations that suggest a team habit to address, or consistent good practice to call out]

## Recommendations

### Must Fix
### Should Fix

## Todo List

Concatenation of all per-repo todo lists. Each row is one actionable item. An agent can work through this list top to bottom.

### {repo-name-1}

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|

### {repo-name-2}

| # | File | Rule | Issue | Addressed | Won't Address |
|---|------|------|-------|-----------|---------------|

## Conclusion
[2-3 sentences]
```

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **COMPLIANT** | All reviewed JS follows the style guide, or only trivial deviations |
| **MINOR ISSUES** | Some deviations but nothing systemic; 1-3 isolated violations |
| **NEEDS WORK** | Multiple or systematic violations of the style guide |

## Completion Output

```
Code style review complete for EUDPA-XXXXX.

Summary:
- Verdict: [VERDICT]
- JS files reviewed: [X] (verified 100% coverage)
- Repositories: [list]
- Per-repo summaries: [X repo-style-review.md files]
- Total violations: [X]

Per-repo reviews: workareas/code-style-reviews/EUDPA-XXXXX/file-reviews/{repo}/repo-style-review.md
Overall review:   workareas/code-style-reviews/EUDPA-XXXXX/code-style-review.md
```
