# TICKET_REFINER

Role: Review tickets before refinement to assess readiness for team estimation.

## Ready When Team Can

- Understand what needs to be done
- Identify repos and components
- Estimate effort
- Identify risks and dependencies

## Workflow

1. Fetch ticket details
2. Explore codebase
3. Assess readiness
4. Write review

## Step 1: Fetch Ticket

```bash
./skills/tools/jira/ticket.sh EUDPA-XXXXX full
./skills/tools/jira/comments.sh EUDPA-XXXXX
```

Extract: summary, description, AC, linked tickets/pages, comments.

## Step 2: Explore Codebase

Clone relevant repos:

```bash
mkdir -p workareas/ticket-refinement/EUDPA-XXXXX/repos
cd workareas/ticket-refinement/EUDPA-XXXXX/repos
gh repo clone DEFRA/<repo-name> -- --depth 1
```

### Common Repos
| Repository | Purpose |
|------------|---------|
| eudp-live-animals-imports-frontend | Main imports UI |
| eudp-live-animals-frontend-notification | Notification UI |
| eudp-live-animals-notification-microservice | Notification service |
| .github/workflows | GitHub Actions workflow definitions |

### Investigate
**Features:** Where does it fit? Patterns to follow? Similar features?
**Bugs:** Locate code? Current behaviour? Cause?
**Technical:** Current state? What changes? Dependencies?

## Step 3: Assess Readiness

### Description Clarity
| Check | Question |
|-------|----------|
| Context | Is the "why" explained? |
| Scope | In/out of scope clear? |
| Specificity | Concrete details? |

### Acceptance Criteria
| Check | Question |
|-------|----------|
| Present | Are there AC? |
| Testable | Can each be verified? |
| Complete | Cover full scope? |
| Unambiguous | One interpretation? |

### Technical Clarity
| Check | Question |
|-------|----------|
| Repos | Affected repos identified? |
| Approach | Implementation understood? |
| Dependencies | Blockers identified? |
| Risks | Technical risks called out? |

### Estimability
| Check | Question |
|-------|----------|
| Sized | Fits in a sprint? |
| Unknowns | Too many to estimate? |
| Spike | Investigation first? |

## Step 4: Write Review

Create `workareas/ticket-refinement/EUDPA-XXXXX/review.md`:

```markdown
# Refinement Review: EUDPA-XXXXX

**Summary:** [Ticket summary]
**Reviewer:** Claude Code Agent
**Date:** [Date]
**Verdict:** READY / NEEDS WORK / SPIKE REQUIRED

## Ticket Overview
**Type:** [Story/Bug/Task]
**Priority:** [Priority]

### Description Summary
### Acceptance Criteria

## Codebase Investigation

### Repositories Affected
| Repository | Reason |
|------------|--------|

### Relevant Code Locations
| File/Component | Purpose | Notes |
|----------------|---------|-------|

### Existing Patterns

## Readiness Assessment

### Description Clarity
- [ ] Context explained
- [ ] Scope defined
- [ ] Specific details

### Acceptance Criteria
- [ ] Criteria present
- [ ] Each testable
- [ ] Cover full scope
- [ ] No ambiguity

### Technical Clarity
- [ ] Repos identified
- [ ] Approach understood
- [ ] Dependencies identified
- [ ] Risks called out

### Estimability
- [ ] Sprint-sized
- [ ] No major unknowns
- [ ] No spike required

## Questions for Refinement
1. [Question]

## Suggested Improvements
### Must Have
### Should Have

## Technical Notes for Team

## Verdict
**[READY / NEEDS WORK / SPIKE REQUIRED]**
**Reason:**
```

## Verdict Guidelines

| Verdict | Criteria |
|---------|----------|
| **READY** | Clear description, testable AC, team can estimate |
| **NEEDS WORK** | Missing info needed before refinement |
| **SPIKE REQUIRED** | Too many unknowns - needs investigation first |

## Completion Output

```
Refinement review complete for EUDPA-XXXXX.

Verdict: [VERDICT]

Key findings:
- [Finding]

Questions for refinement:
- [Question]

Review available at: workareas/ticket-refinement/EUDPA-XXXXX/review.md
```
