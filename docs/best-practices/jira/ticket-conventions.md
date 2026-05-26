# EUDPA Jira ticket conventions

Project-policy guidance for tickets in the **EUDPA** Jira project.
Shared by the `ticket-creator`, `ticket-refiner`, and `ticket` skills.

For GDS writing style applied to summaries, descriptions, and AC, see
[`../gds/writing.md`](../gds/writing.md).

## Type guidance

| Type | Use when |
|------|----------|
| **Bug** | An existing feature is broken — wrong output, error, regression, deviates from documented behaviour. |
| **Story** | A user-facing capability or behaviour change. Phrased around what the user can do once shipped. |
| **Task** | Technical or operational work with no direct user-visible change — refactor, tech debt, infrastructure, investigation. |

If it could land as either Story or Task, prefer **Story** when there
is observable behaviour for an end user, **Task** otherwise.

## Priority guidance

| Priority | Use when |
|----------|----------|
| **Highest** | Production-blocking or live-incident workstream. |
| **High** | Blocks a sprint goal or another team. |
| **Medium** | Default. Normal sprint work. |
| **Low** | Nice-to-have; can drift without harm. |
| **Lowest** | Backlog hygiene, opportunistic clean-up, Tech Debt Board (see below). |

## Labels

Labels are camelCase by convention in this project — `technicalImprovement`,
not `tech-improvement` or `technical_improvement`. The authoritative
list of accepted EUDPA labels lives in
[`~/git/defra/trade-imports-animals/.claude/skills/ticket-creator/assets/known-labels.md`](../../../.claude/skills/ticket-creator/assets/known-labels.md).
Prefer reusing an existing label over coining a new one.

## Acceptance criteria style

Acceptance criteria are **free-form bullets** — there is no project-wide
Gherkin mandate. Each bullet should be observable and verifiable:

- Good: `Page returns 400 with body "code-too-short" when commodity code <6 digits`
- Bad: `Validation works correctly`

Type-specific templates (`assets/templates/{bug,story,task}.md`) may
suggest a shape (e.g. *Given / When / Then* for some Stories) but do
not enforce one. Bullets are fine across all Types.

## Named conventions (opt-in)

These are bundles the user can opt into during a `ticket-creator`
interview. They are never auto-applied — the skill asks first.

### EUDPA Tech Debt Board (board 862)

| Field | Value |
|-------|-------|
| Type | Task |
| Label | `technicalImprovement` |
| Priority | `Lowest` |
| Suggested parent epic | `EUDPA-17736` (Accessibility) or `EUDPA-20628` (QA Automation), or another Tech Debt Board epic |

The skill asks "Is this an EUDPA Tech Debt Board ticket?" after Type
is set to Task. If yes, the bundle above is applied without re-asking
each field; parent epic is still confirmed with the user.
