# EUDPA-project Jira labels — known catalogue

Static catalogue of labels accepted on tickets in the EUDPA Jira
project. Read this at session start so the LLM has visibility into
the full set and stops inventing new labels.

**Snapshot date:** 2026-05-26
**Source:** observed on EUDPA-* tickets via `tools/jira/ticket.sh`
(EUDPA-50/80/90/100/110/120/130/170/179/180 sample).

Casing rule: **camelCase canonical** (e.g. `technicalImprovement`,
not `tech-improvement` or `technical_improvement`). Legacy
hyphenated forms exist on older tickets but should not be used on
new work.

## Active labels

| Label | Use when |
|-------|----------|
| `technicalImprovement` | Tech debt — refactor, dependency upgrade, code-quality clean-up. Pairs with the Tech Debt Board named convention (priority `Lowest`). |
| `Skeleton` | Initial scaffolding story for a new capability slice — usually placed on Stories that put a feature in the codebase before behaviour is wired up. |
| `LiveIncidents` | Issue raised in response to a production incident; tracks remediation. |
| `CAP-<area>.<sub>` | Capability-tracking label tying a Story to a CAP work-stream (e.g. `CAP-01.1`, `CAP-02.5`, `CAP-04.3`, `CAP-06.3`). Use the existing capability index — don't invent new CAP codes. |

## Legacy / deprecated labels (do not use on new tickets)

| Label | Notes |
|-------|-------|
| `tech-improvement` | Legacy hyphenated form of `technicalImprovement`. Replaced. |
| `DevOps` | Previously paired with EUDPA-144 for DevOps work; the convention has been removed. Use a specific descriptive label or the appropriate parent epic instead. |
| `Team-5` | Team-tagging convention removed alongside `DevOps`. |

## Refreshing this catalogue

When labels diverge from this list (a new ticket uses a label not
catalogued, or an existing label falls out of use), refresh by
sampling recent EUDPA tickets:

```bash
~/git/defra/trade-imports-animals/tools/jira/ticket.sh EUDPA-<n> summary | jq '.labels'
```

Update the snapshot date in the header when refreshed.
