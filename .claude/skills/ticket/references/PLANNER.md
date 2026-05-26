# Planner — produce an implementation plan

Role: Analyse ticket and create implementation plan. **No implementation work.**

**Critical:** Plan is a **first impression**. Mark uncertainty with `[ASSUMPTION]` and `[NEEDS VERIFICATION]`.

## Bash call hygiene

**Rule: one command per Bash call.** The allowlist matcher sees the
whole command string, so anything that turns the call into a compound
shape doesn't match the prefix rule.

- No `&&` / `;` / `|` between commands — separate Bash calls instead.
- No `cd <dir> && cmd ...` — use `cmd -C <dir>` (for git) or full paths.
- No `$TRADE_IMPORTS_WORKSPACE/...` — use the literal `~/git/defra/trade-imports-animals/...` form.
- No `/Users/<you>/git/...` — type `~/`, don't resolve it.

## Workflow

### 1. Gather Context

```bash
~/git/defra/trade-imports-animals/tools/jira/ticket.sh EUDPA-XXXXX
~/git/defra/trade-imports-animals/tools/jira/comments.sh EUDPA-XXXXX
```

### 2. Explore Codebase

Find: similar functionality, services involved, integration points, configuration.

```bash
~/git/defra/trade-imports-animals/tools/review/detect-tech.sh ~/git/defra/trade-imports-animals/repos/<repo-name>
```

Include detected technologies and best-practices paths in plan.

### 3. Create Plan

Create: `~/git/defra/trade-imports-animals/workareas/ticket-planning/EUDPA-XXXXX/plan.md`

```markdown
# Implementation Plan: EUDPA-XXXXX

**Ticket:** [Summary]
**Date:** [Date]
**Confidence:** High (clear examples) / Medium (some extrapolation) / Low (significant assumptions)

## Summary
[2-3 sentences]

## Repositories & Tech Stack

| Repository | Changes | Technologies | Best Practices |
|------------|---------|--------------|----------------|

## Implementation Steps

### 1. [Step Name]
**Goal:** [What this achieves]
**Files:** `path/to/File.java` - [What changes]
**Pattern:** See `path/to/Example.java:45-80`
**Notes:** [NEEDS VERIFICATION] Check if [thing] applies

## Testing Strategy
| Test File | What to Test |
|-----------|--------------|

## Configuration
| Variable/Flag | Purpose | Where Defined |
|---------------|---------|---------------|

## Risks & Open Questions
| Risk/Question | Mitigation/Notes | Severity |
|---------------|------------------|----------|

## Alternative Approaches (if applicable)
**Option A:** [Pros/Cons]
**Option B (Recommended):** [Pros/Cons/Why]

## References
- `path/to/Similar.java` - [What it does]
```

## Output

```
Plan created: ~/git/defra/trade-imports-animals/workareas/ticket-planning/EUDPA-XXXXX/plan.md
Repos: [list] | Steps: [X] | Confidence: [level]
Items needing verification: [X]
```

## Don'ts

- Don't implement - plan only
- Don't decide for implementer - provide options
- Don't skip uncertainty markers
