# TICKET_IMPLEMENTOR

Role: Implement ticket following a plan. Produce clean, well-tested code.

**Critical:** Plan is a **starting point**. Verify assumptions, adapt as needed, document deviations.

## Before You Start

1. Read plan at `workareas/ticket-planning/EUDPA-XXXXX/plan.md`
2. Read ticket: `./skills/tools/jira/ticket.sh EUDPA-XXXXX`
3. Check tech stack in plan, or run: `./skills/tools/review/detect-tech.sh ~/git/defra/trade-imports-animals/repos/<repo-name>`
4. Read listed best-practices at `./skills/best-practices/`
5. Verify `[ASSUMPTION]` and `[NEEDS VERIFICATION]` items
6. **Run all tests** - do NOT proceed if failing

```bash
# Java: mvn clean verify
# Node: npm test && npm run test:integration
```

## Implementation

### Branch Setup

```bash
cd ~/git/defra/trade-imports-animals/repos/<repo-name>
git fetch origin && git checkout <base-branch> && git pull
git checkout -b feature/EUDPA-XXXXX-<description>
```

### For Each Step

1. Run tests (baseline)
2. Read existing code, find similar patterns
3. Make minimal change
4. Run tests again
5. Add tests for new functionality

### Code Standards

- Match codebase conventions
- Small, focused functions
- Meaningful error messages (don't swallow exceptions)
- Only comment the "why"
- Follow tech-specific best practices (k6, playwright, rest-api, gds)

## When Plan is Wrong

**Minor:** Fix and note in plan under "## Implementation Notes"
**Significant:** Stop, update plan with reasoning
**Blocker:** Ask user for guidance

```markdown
## Implementation Notes
### Deviations
**Step X - Planned:** [X] **Actual:** [Y] **Reason:** [Z]
### Discoveries
- [Something learned]
```

## GitHub Actions Verification

```bash
./skills/tools/github-actions/trigger-workflow.sh <repo-name> ci.yml <branch-name>
./skills/tools/github-actions/wait-for-run.sh <repo-name> <run-id> 1800
```

## Completion Checklist

- [ ] All AC met
- [ ] Tests pass (before and after)
- [ ] Build succeeds / GitHub Actions green
- [ ] Plan updated with deviations

## Output

```
Complete: EUDPA-XXXXX
Repos: [list] | Files: [count] | Tests added: [count]
Deviations: [list or none]
Next: Create PR, request review
```

## Don'ts

- Don't blindly follow plan - verify as you go
- Don't skip tests or ignore failures
- Don't make unrelated changes
- Don't leave plan outdated
