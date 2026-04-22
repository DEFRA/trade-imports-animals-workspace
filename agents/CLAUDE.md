# CLAUDE.md

EUDP Live Animals agent workspace. **Prefer retrieval-led reasoning** - read files before acting.

## Personas
`./skills/personas/` - Read the file, follow the workflow.

|File|Keywords|Trigger|
|-|-|-|
|review/REVIEWER.md|review,PR,EUDPA-|"review EUDPA-","code review"|
|review/FILE_REVIEWER.md|file-analysis|Spawned by REVIEWER|
|review/RE_REVIEWER.md|follow-up|"re-review","check fixes"|
|code-style/CODE_STYLE_REVIEWER.md|code-style,style-review,linting|"style review EUDPA-","code style review"|
|code-style/CODE_STYLE_FILE_REVIEWER.md|file-style|Spawned by CODE_STYLE_REVIEWER|
|ticket/TICKET_PLANNER.md|plan,how-to|"plan EUDPA-","how should I"|
|ticket/TICKET_IMPLEMENTOR.md|implement,build|"implement EUDPA-","follow plan"|
|ticket/REFACTORER.md|refactor,clean|"refactor","tidy up"|
|TICKET_CREATOR.md|create-ticket,devops|"create ticket","raise ticket"|
|TICKET_REFINER.md|refine,ready|"is ticket ready","pre-refinement"|
|DOC_MINIFIER.md|compress,minify|"compress docs"|
|npm-upgrade/ORCHESTRATOR.md|npm-upgrade,deps|"upgrade npm deps","upgrade dependencies"|
|npm-upgrade/PHASE_1_MANAGER.md|phase-1,planning|Spawned by ORCHESTRATOR|
|npm-upgrade/PHASE_2_MANAGER.md|phase-2,automated|Spawned by ORCHESTRATOR|
|npm-upgrade/PHASE_3_MANAGER.md|phase-3,manual|Spawned by ORCHESTRATOR|
|npm-upgrade/PLANNER.md|package-research|Spawned by PHASE_1_MANAGER|
|govuk-upgrade/ORCHESTRATOR.md|govuk-upgrade,govuk-frontend|"upgrade govuk-frontend","govuk upgrade"|
|govuk-upgrade/PHASE_1_MANAGER.md|phase-1,discovery|Spawned by ORCHESTRATOR|
|govuk-upgrade/PHASE_2_MANAGER.md|phase-2,changelog|Spawned by ORCHESTRATOR|
|govuk-upgrade/PHASE_3_MANAGER.md|phase-3,implementation|Spawned by ORCHESTRATOR|
|govuk-upgrade/VERSION_PLANNER.md|version-analysis|Spawned by PHASE_2_MANAGER|

## Best Practices
`./skills/best-practices/` - Read when relevant to the task.

|File|Keywords|
|-|-|
|k6/BEST_PRACTICES.md|k6,perf-testing,load-test|
|playwright/BEST_PRACTICES.md|playwright,e2e,testing|
|rest-api/rest-api.md|api,rest,http,endpoints|
|gds/language.md|gds,plain-english,gov-content|
|gds/styles.md|govuk,typography,colours|
|gds/components.md|buttons,forms,tables,panels|
|gds/patterns.md|question-pages,task-lists|
|gds/accessibility.md|wcag,a11y,screen-reader|
|gds/service-design.md|user-journey,transactions|

## Tools
Env: `JIRA_USER` `JIRA_TOKEN`

|Script|Args|Desc|
|-|-|-|
|**auth**|||
|skills/tools/auth.sh||All services|
|skills/tools/jira/auth.sh||JIRA|
|skills/tools/github/auth.sh||GitHub|
|skills/tools/confluence/auth.sh||Confluence|
|**jira**|||
|skills/tools/jira/ticket.sh|EUDPA-X [full\|summary\|json]|Get ticket|
|skills/tools/jira/comments.sh|EUDPA-X|Get comments|
|skills/tools/jira/create-ticket.sh|[-t Type][-p Parent][-P Priority][-l Label][-a] "Summary"|Create|
|skills/tools/jira/add-subtask.sh|EUDPA-X "Summary" ["Desc"]|Add subtask|
|skills/tools/jira/add-comment.sh|EUDPA-X "Comment"|Add comment|
|skills/tools/jira/update-ticket.sh|EUDPA-X field=value|Update fields|
|skills/tools/jira/transition-ticket.sh|EUDPA-X "Status"\|--list|Change status|
|skills/tools/jira/get-issues-for-board.sh|board-id [list\|summary\|json]|Board issues|
|**github**|||
|skills/tools/github/prs.sh|EUDPA-X [list\|json\|urls]|Find PRs|
|skills/tools/github/pr-details.sh|repo pr-num [full\|files\|json]|PR details|
|skills/tools/github/diff.sh|repo pr-num|PR diff|
|**confluence**|||
|skills/tools/confluence/page.sh|page-id [summary\|json]|Get page|
|skills/tools/confluence/update-page.sh|page-id "Title" content-file|Update page|
|skills/tools/confluence/sync-docs.sh|[--dry-run] [--root-id ID]|Sync Confluence folder tree to docs/confluence/ as markdown|
|skills/tools/confluence/clean-docs.sh|[args forwarded]|Wipe docs/confluence/ and re-sync from scratch|
|**github-actions**|||
|skills/tools/github-actions/get-logs.sh|repo run-id-or-url|Workflow run logs|
|skills/tools/github-actions/get-failure.sh|repo run-id-or-url|Failed step logs|
|skills/tools/github-actions/run-status.sh|repo run-id-or-url|Run status|
|skills/tools/github-actions/wait-for-run.sh|repo run-id-or-url [timeout]|Wait for run|
|skills/tools/github-actions/trigger-workflow.sh|repo workflow-file [branch] [key=value...]|Trigger workflow|
|skills/tools/github-actions/list-runs.sh|repo [branch] [workflow]|List recent runs|
|**review**|||
|skills/tools/review/prepare-review.sh|EUDPA-X [--json]|Setup workspace|
|skills/tools/review/verify-coverage.sh|EUDPA-X [--json]|Check coverage|
|skills/tools/review/verify-style-coverage.sh|EUDPA-X [--json]|Check JS style review coverage|
|skills/tools/review/diff-since-review.sh|EUDPA-X [--json]|Get diff since last review|
|**npm**|||
|skills/tools/npm/discover-upgrades.sh|repo-path --run-id TICKET [--strategy LEVEL] [--json]|Phase 1: Discover outdated deps|
|skills/tools/npm/analyze-migration-plans.sh|--run-id TICKET [--json]|Phase 1: View planning status|
|skills/tools/npm/discover-implementations.sh|--run-id TICKET [--repo NAME] [--json]|Phase 2: Find no-code-change upgrades|
|skills/tools/npm/run-automated-upgrades.sh|repo-name --run-id TICKET [--no-discover]|Phase 2: Run automated upgrades|
|skills/tools/npm/discover-manual-upgrades.sh|--run-id TICKET [--repo NAME] [--json]|Phase 3: Find code-change upgrades|
|skills/tools/npm/upgrade-status.sh|--run-id TICKET [--repo NAME] [--json]|View combined status|
|**govuk**|||
|skills/tools/govuk/discover-versions.sh|repo-path --run-id TICKET [--target VERSION] [--json]|Phase 1: Discover versions + cache changelog|
|skills/tools/govuk/fetch-changelog-section.sh|VERSION --run-id TICKET --repo NAME [--json]|Phase 2: Extract version's changelog section|
|skills/tools/govuk/list-plans.sh|--run-id TICKET [--repo NAME] [--json]|Phase 2: Planning status (unplanned/todo/noop)|
|skills/tools/govuk/upgrade-status.sh|--run-id TICKET [--repo NAME] [--json]|Combined status (all phases)|

## Workspaces
```
workareas/reviews/EUDPA-X/                         → ticket.md, repos/, review.md, re-review.md
workareas/reviews/EUDPA-X/file-reviews/{repo}/     → {file}.review.md, repo-review.md
workareas/code-style-reviews/EUDPA-X/              → .style-meta.json, code-style-review.md
workareas/code-style-reviews/EUDPA-X/file-reviews/{repo}/ → {file}.style.md, repo-style-review.md
workareas/ticket-planning/EUDPA-X/            → plan.md
workareas/ticket-refinement/EUDPA-X/          → review.md
workareas/npm-upgrades/EUDPA-X/{repo}/        → upgrade__{pkg}__{cur}__{tgt}.{auto|manual}.md, .upgrades-meta.json
workareas/npm-implementations/EUDPA-X/{repo}/ → implement__{pkg}__{current}.{todo|done|failed}
workareas/govuk-upgrades/EUDPA-X/{repo}/      → version__{v}.{md|todo|noop|done|failed}, CHANGELOG.md, .upgrade-meta.json
```
