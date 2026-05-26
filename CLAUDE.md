# trade-imports-animals workspace

This is a local workspace aggregating 6 independent GitHub repos for the DEFRA trade imports animals service. It is **not** a monorepo — each repo has its own git history, remotes, and CI. This folder provides shared tooling and cross-repo context.

## Repo map

| Folder | GitHub repo | Role | Stack |
|--------|------------|------|-------|
| `repos/trade-imports-animals-frontend` | DEFRA/trade-imports-animals-frontend | User-facing web application | Node.js |
| `repos/trade-imports-animals-backend` | DEFRA/trade-imports-animals-backend | API / business logic service | Java / Spring Boot |
| `repos/trade-imports-animals-tests` | DEFRA/trade-imports-animals-tests | End-to-end / integration test suite | Node.js |
| `repos/trade-imports-animals-admin` | DEFRA/trade-imports-animals-admin | Internal admin interface | Node.js |
| `repos/trade-imports-stub` | DEFRA/trade-imports-stub | Stub of upstream trade-imports services | Java / Spring Boot |
| `repos/trade-imports-reference-data` | DEFRA/trade-imports-reference-data | Reference data service | Java / Spring Boot |

## How to navigate

Work on a specific repo by entering its directory:

```bash
cd repos/trade-imports-animals-frontend   # then use claude, git, npm etc. as normal
```

Each repo has its own `CLAUDE.md` with repo-specific context.

Run `make help` from this directory to see all cross-repo commands.

## Make targets

| Target | What it does |
|--------|-------------|
| `make setup` | Clone all 4 repos (idempotent — safe to re-run) |
| `make update` | `git pull --rebase` all repos |
| `make status` | `git status -sb` across all repos |
| `make install` | `npm install` in all Node repos |
| `make lint` | Lint all Node repos |
| `make test` | Run tests across all repos |
| `make docker-compose-up` | Start full stack from published Docker Hub images |
| `make docker-compose-dev` | Start full stack built from local source (hot-reload for Node, volume mount for Java) |
| `make docker-compose-down` | Stop the stack and wipe all volumes (mongo data, localstack state) for a clean slate |
| `make docker-compose-bounce` | Wipe and restart the dev stack (`docker-compose-down` then `docker-compose-dev`) |
| `make docker-logs` | Tail frontend + admin + backend logs (`Ctrl-C` to stop) |
| `make docker-restart-backend` | Restart backend container after Java source changes |
| `make start-frontend` | Start frontend dev server from source (outside Docker) |
| `make start-backend` | Start backend from source (outside Docker) |
| `make start-admin` | Start admin dev server from source (outside Docker) |

## Common workflows

**First-time setup:**
```bash
make setup    # clone all repos
make install  # npm install in Node repos
```

Scripts under `tools/` assume the workspace lives at
`~/git/defra/trade-imports-animals/` — the path is hardcoded. Clone here
and nothing further is needed. See
[`docs/agent-onboarding.md`](docs/agent-onboarding.md) for the JIRA /
GitHub / Confluence credentials the tools still need.

**Daily update:**
```bash
make update   # pull latest on all repos
make status   # check for anything uncommitted
```

**Run the full stack from source (cross-service development):**
```bash
make docker-compose-dev   # build + start all services from local source
make docker-logs          # tail logs (Ctrl-C to stop)
# After changing Java source:
make docker-restart-backend
```

**Run the E2E tests:**
```bash
cd repos/trade-imports-animals-tests
npm run test:local
```

**Run unit tests:**
```bash
make test
```

**Work on a single repo:**
```bash
cd repos/trade-imports-animals-frontend
git checkout -b my-feature
# make changes, commit, push as normal
git push origin my-feature
```

## Workspace stack (alongside `make docker-compose-*`)

`scripts/stack/run-stack.sh` brings up the full stack from Dockerhub.
Supports `-b <branch>` (probe for branch-tagged images), `-d/--dev` (build
the 5 repo-backed services from local source under `repos/`),
`-e <service>` (exclude one so you can run it natively), and
`--profile <name>` (run only a subset of tiers). `bounce-backend.sh` picks
up edited Java source in `--dev` mode.

See `docker/stack/AGENTS.md` for the full index — flag reference, file
layout (5 role overlays + dev overlay), env knobs that must use
`host.docker.internal`, and the running-E2E recipe.

## Docs

- `docs/` — project documentation. Architecture notes, ADRs, runbooks.
- [`docs/agent-skills.md`](docs/agent-skills.md) — agentskills.io
  conventions used in this workspace (path conventions,
  `find_workspace_root` helper, subagent format, cross-host notes).
- [`docs/agent-onboarding.md`](docs/agent-onboarding.md) — auth /
  credential setup for the agent skills.
- `docs/best-practices/` — tech-specific practice guides
  (gds/, java/, node/, playwright/, k6/, rest-api/, doc-comments/,
  docker-compose.md). Cited by SKILL.md files via
  `~/git/defra/trade-imports-animals/docs/best-practices/<topic>/<file>`.

## Skills

Agent capabilities live as
[agentskills.io](https://agentskills.io/specification)-format folders at
the workspace root, auto-discovered by Claude Code (and Cursor). See
[`docs/agent-skills.md`](docs/agent-skills.md) for the format.

### Skills (`.claude/skills/<name>/SKILL.md`)

| Skill | Triggers | Purpose |
|---|---|---|
| `ticket-creator` | "create ticket", "raise ticket", "new ticket", "file a bug" | Create a new Jira ticket end-to-end (Bug/Story/Task). |
| `ticket-refiner` | "is ticket ready", "pre-refinement", "refinement check" | Assess whether a ticket is READY / NEEDS WORK / SPIKE REQUIRED. |
| `ticket` | "plan EUDPA-", "implement EUDPA-", "refactor", "tidy up" | Plan / implement / refactor an existing ticket. |
| `review` | "review EUDPA-", "re-review", "walk review", "implement review" | Code review across all languages and repos (correctness, security, tests). |
| `code-style` | "style review EUDPA-", "walk style EUDPA-", "triage style", "fix style EUDPA-", "lint review" | JS code-style review + remediation against the 17-rule guide. |
| `npm-upgrade` | "upgrade npm deps", "upgrade dependencies" | Three-phase non-govuk-frontend npm upgrade workflow. |
| `govuk-upgrade` | "upgrade govuk-frontend", "govuk upgrade", "walk govuk EUDPA-X", "implement govuk EUDPA-X" | Per-version govuk-frontend upgrade with CHANGELOG-driven plans (JSON-state, dispatcher, walker). |

### Worker references (per-skill fan-out personas)

Long-running fan-out workers live as `references/<NAME>.md` prose inside
the owning skill and are spawned as `general-purpose` Task subagents
(`Follow ~/git/defra/trade-imports-animals/.claude/skills/<owner>/references/<NAME>.md.`).
`general-purpose` carries `Tools: *` so workers can write the on-disk
artifacts that downstream `tools/` scripts consume.

| Owner skill | Worker reference | Used for |
|---|---|---|
| `review` | `references/FILE_REVIEWER.md` | Per-file review (parallel, up to 10) |
| `review` | `references/CONSISTENCY_REVIEWER.md` | Per-repo consistency check |
| `review` | `references/REVIEW_ITEM_FIXER.md` | One Fix-disposition item at a time |
| `code-style` | `references/STYLE_FILE_REVIEWER.md` | Per-`.js` file style review |
| `code-style` | `references/STYLE_WALKER.md` | Batch triage walker for pending items |
| `code-style` | `references/STYLE_IMPLEMENTOR.md` | Per-file batched style fixes |
| `npm-upgrade` | `references/PACKAGE_PLANNER.md` | Per-package research + auto/manual classification |
| `govuk-upgrade` | `references/VERSION_PLANNER.md` | Per-version CHANGELOG analysis + per-repo plan |
| `govuk-upgrade` | `references/PLAN_WALKER.md` | Batch triage of pending version plans before Phase 3 |

Cursor reads `.claude/skills/` natively (per
<https://cursor.com/docs/context/skills>). It has no parallel subagent
primitive, so worker prose still works but runs serially in the active
session rather than fanning out.

## Tools (`tools/`)

Shared shell scripts called by skills via
`~/git/defra/trade-imports-animals/tools/<domain>/<script>`. Environment:
`JIRA_USER`, `JIRA_TOKEN`, `JIRA_BASE_URL`, `JIRA_PROJECT_KEY`.

| Script | Args | Purpose |
|---|---|---|
| **auth** | | |
| `tools/auth.sh` | | All services umbrella |
| `tools/jira/auth.sh` | | Jira |
| `tools/github/auth.sh` | | GitHub |
| `tools/confluence/auth.sh` | | Confluence |
| **jira** | | |
| `tools/jira/ticket.sh` | EUDPA-X [full\|summary\|json] | Get ticket |
| `tools/jira/comments.sh` | EUDPA-X | Get comments |
| `tools/jira/create-ticket.sh` | [-t Type][-p Parent][-P Priority][-l Label][-a] "Summary" | Create ticket |
| `tools/jira/add-subtask.sh` | EUDPA-X "Summary" ["Desc"] | Add subtask |
| `tools/jira/add-comment.sh` | EUDPA-X "Comment" | Add comment |
| `tools/jira/update-ticket.sh` | EUDPA-X field=value | Update fields |
| `tools/jira/transition-ticket.sh` | EUDPA-X "Status"\|--list | Change status |
| `tools/jira/get-issues-for-board.sh` | board-id [list\|summary\|json] | Board issues |
| **github** | | |
| `tools/github/prs.sh` | EUDPA-X [list\|json\|urls] | Find PRs |
| `tools/github/pr-details.sh` | repo pr-num [full\|files\|json] | PR details |
| `tools/github/diff.sh` | repo pr-num | PR diff |
| `tools/github/file-diff.sh` | repo pr-num file-path | PR diff filtered to one file |
| **confluence** | | |
| `tools/confluence/page.sh` | page-id [summary\|json] | Get page |
| `tools/confluence/update-page.sh` | page-id "Title" content-file | Update page |
| `tools/confluence/sync-docs.sh` | [--dry-run] [--root-id ID] | Sync Confluence tree to docs/confluence/ |
| `tools/confluence/clean-docs.sh` | [args forwarded] | Wipe + re-sync docs/confluence/ |
| **github-actions** | | |
| `tools/github-actions/get-logs.sh` | repo run-id-or-url | Workflow run logs |
| `tools/github-actions/get-failure.sh` | repo run-id-or-url | Failed step logs |
| `tools/github-actions/run-status.sh` | repo run-id-or-url | Run status |
| `tools/github-actions/wait-for-run.sh` | repo run-id-or-url [timeout] | Wait for run |
| `tools/github-actions/trigger-workflow.sh` | repo workflow-file [branch] [key=value...] | Trigger workflow |
| `tools/github-actions/list-runs.sh` | repo [branch] [workflow] | List recent runs |
| **review** | | |
| `tools/review/start-review.sh` | EUDPA-X | Step 0 — detect FRESH/REFRESH and exec the appropriate setup script |
| `tools/review/prepare-review.sh` | EUDPA-X [--json] | Setup workspace |
| `tools/review/verify-coverage.sh` | EUDPA-X [--json] | Check coverage |
| `tools/review/verify-consistency.sh` | EUDPA-X [--json] | Check consistency |
| `tools/review/verify-style-coverage.sh` | EUDPA-X [--json] | Check JS style review coverage |
| `tools/review/diff-since-review.sh` | EUDPA-X [--json] | Diff since last review |
| `tools/review/file-review-init.sh` | EUDPA-X --repo R --file F --commit SHA --pr N --mode M | Initialise per-file `.review.json` placeholder |
| `tools/review/file-review-add-item.sh` | EUDPA-X --repo R --file F --line L --severity S --category C --issue "..." --fix "..." [--best-practice PATH] | Append a finding to a per-file JSON |
| `tools/review/file-review-set-verdict.sh` | EUDPA-X --repo R --file F --verdict V [--reason "..."] | Set verdict (marks file as reviewed) |
| `tools/review/aggregate-file-reviews.sh` | EUDPA-X --repo R [--write-items] [--section ...] [--json] | Populate `items.{repo}.json` + emit File Analysis Summary / Items markdown |
| `tools/review/review-items.sh` | EUDPA-X [--repo R] [--filter ...] [--status ...] [--json] | List items from `## Items` table |
| `tools/review/review-mark.sh` | EUDPA-X --repo R --item N --disposition V [--note "..."] | Set Disposition (auto-sets Status) |
| `tools/review/review-set-status.sh` | EUDPA-X --repo R --item N --status V [--note "..."] | Set Status only |
| `tools/review/review-add-item.sh` | EUDPA-X --repo R --file F --line L --severity S --category C --issue "..." --fix "..." | Append new item; prints new ID |
| `tools/review/review-counts.sh` | EUDPA-X [--repo R] [--json] | Summary by Disposition+Status |
| `tools/review/render-items.sh` | EUDPA-X --repo R | Render `items.{repo}.json` as the `## Items` markdown view |
| `tools/review/refresh/scope.sh` | EUDPA-X [--repo R] [--no-pull] [--write-snapshot] [--human] | Refresh: pull + diff + lists A/B/C/D |
| `tools/review/refresh/reconcile.sh` | EUDPA-X --repo R [--dry-run] [--json] [--force] | Refresh Step R5 — fold `.review.json` findings into items.json + emit Fix+Done spot-check advisory |
| `tools/review/refresh/pull-repos.sh` | EUDPA-X [--repo R] [--json] | Refresh helper |
| `tools/review/refresh/list-merge-resolved.sh` | REPO_DIR PRIOR_SHA HEAD_SHA [--tsv\|--json] | Refresh helper |
| `tools/review/refresh/list-coverage-gaps.sh` | REVIEW_DIR REPO PR_NUM [--tsv\|--json] | Refresh helper |
| **style** | | |
| `tools/style/start-style.sh` | EUDPA-X | Step 0 — detect FRESH/REFRESH and exec the appropriate setup script |
| `tools/style/prepare-style.sh` | EUDPA-X [--json] | Fresh Step 1 — init `.style.json` placeholders + per-repo rules bundle |
| `tools/style/bake-rules-bundle.sh` | EUDPA-X REPO | Concatenate `docs/best-practices/` into `style-rules.{repo}.md` |
| `tools/style/aggregate-file-reviews.sh` | EUDPA-X --repo R [--write-items] [--section ...] [--json] | Write `items.{repo}.json` from per-file `.style.json` + emit markdown sections |
| `tools/style/render-items.sh` | EUDPA-X --repo R | Render `items.{repo}.json` as the `## Items` markdown view |
| `tools/style/style-items.sh` | EUDPA-X [--repo R] [--file F] [--filter ...] [--status ...] [--by-file] [--json] | List items |
| `tools/style/style-mark.sh` | EUDPA-X --repo R --item N --disposition V [--note "..."] | Set Disposition |
| `tools/style/style-set-status.sh` | EUDPA-X --repo R --item N --status V [--note "..."] | Set Status only |
| `tools/style/style-add-item.sh` | EUDPA-X --repo R --file F --line L --rule R --severity S --issue "..." --fix "..." [--best-practice PATH] | Append new item |
| `tools/style/style-counts.sh` | EUDPA-X [--repo R] [--json] | Summary by Disposition+Status |
| `tools/style/file-style-init.sh` | EUDPA-X --repo R --file F --commit SHA --pr N --mode M | Initialise per-file `.style.json` placeholder |
| `tools/style/file-style-add-item.sh` | EUDPA-X --repo R --file F --line L --rule R --severity S --issue "..." --fix "..." [--best-practice PATH] | Append a finding to a per-file `.style.json` |
| `tools/style/file-style-set-verdict.sh` | EUDPA-X --repo R --file F --verdict V [--reason "..."] | Set per-file verdict (marks file as reviewed) |
| `tools/style/refresh/scope.sh` | EUDPA-X [--repo R] [--no-pull] [--write-snapshot] [--human] | Refresh, filtered to `.js` |
| `tools/style/refresh/reconcile.sh` | EUDPA-X --repo R [--dry-run] [--json] [--force] | Refresh Step R5 — fold `.style.json` findings into items.json + emit Fix+Done spot-check advisory |
| **npm** | | |
| `tools/npm/start-upgrade.sh` | EUDPA-X --phase 1\|2\|3 [--repo R ...] [--strategy LEVEL] | Single dispatcher — phase 1 discovers + emits PACKAGE_PLANNER spawn manifest, phase 2 fans out per-repo runners, phase 3 emits WALKER handoff |
| `tools/npm/verify-classification-coverage.sh` | --run-id TICKET [--repo R] [--json] | Phase 1 coverage gate — fail iff any package.classification == null |
| `tools/npm/prebake-context.sh` | --run-id TICKET --repo R --package PKG | Best-effort fetch of changelog + grep usages; updates `context_baked` field |
| `tools/npm/bake-best-practices.sh` | --run-id TICKET --repo R | Concatenate dependency-relevant best-practices into per-repo bundle |
| `tools/npm/discover-upgrades.sh` | repo-path --run-id TICKET [--strategy LEVEL] [--json] | Discover outdated deps + seed `packages.{repo}.json` |
| `tools/npm/packages-init.sh` | --run-id TICKET --repo R --repo-path PATH --strategy LEVEL --ncu-version VER (--ncu-json JSON \| --ncu-file PATH) | Seed `packages.{repo}.json` from ncu output |
| `tools/npm/packages-list.sh` | --run-id TICKET [--repo R] [--package PKG] [--classification ...] [--risk ...] [--status ...] [--json] | List packages with filters |
| `tools/npm/packages-counts.sh` | --run-id TICKET [--repo R] [--json] | Counts by classification × status × risk |
| `tools/npm/packages-set-classification.sh` | --run-id TICKET --repo R --package PKG --classification auto\|manual --risk LOW\|MEDIUM\|HIGH --safe-for-automation true\|false --rationale "..." [--files-affected CSV] [--changes-required "..."] [--changelog-url URL] [--migration-guide-url URL] [--demoted-from-auto true\|false] | Set PACKAGE_PLANNER fields on one package |
| `tools/npm/packages-set-status.sh` | --run-id TICKET --repo R --package PKG --status todo\|inprogress\|done\|failed [--failure-reason "..."] [--commit-sha SHA] | Set implementation_status (+ commit_sha / failure_reason) |
| `tools/npm/run-automated-upgrades.sh` | repo-name --run-id TICKET [--no-discover] | Phase 2 per-repo runner |
| `tools/npm/upgrade-status.sh` | --run-id TICKET [--repo NAME] [--json] | Combined status (legacy — prefer `packages-counts.sh`) |
| `tools/npm/analyze-migration-plans.sh` | --run-id TICKET [--json] | Legacy planning status (will be removed) |
| `tools/npm/discover-implementations.sh` | --run-id TICKET [--repo NAME] [--json] | Legacy: marker-file population (replaced by JSON state) |
| `tools/npm/discover-manual-upgrades.sh` | --run-id TICKET [--repo NAME] [--json] | Legacy manual list (use `packages-list.sh --classification manual`) |
| **govuk** | | |
| `tools/govuk/start-upgrade.sh` | --ticket EUDPA-X \| --branch B [--target V] | Phase 1 dispatcher: `.run-meta.json` + branch setup + version discovery |
| `tools/govuk/discover-repos.sh` | --run-id TICKET [--branch B] [--target V] [--json] | Phase 1: write run-level `.run-meta.json` (in-scope repos) |
| `tools/govuk/setup-branch.sh` | --branch B --repo R | Phase 1: idempotent `git checkout` for one repo |
| `tools/govuk/discover-versions.sh` | repo-path --run-id TICKET [--target V] [--json] [--force] | Phase 1: seed `versions.{repo}.json` + cache CHANGELOG + pre-bake per-version sections + best-practices bundle |
| `tools/govuk/version-classify.sh` | --run-id TICKET --repo R --version V --classification todo\|noop [--summary "..."] | VERSION_PLANNER: set classification |
| `tools/govuk/version-add-change.sh` | --run-id TICKET --repo R --version V --file F --why "..." --change "..." | VERSION_PLANNER: append change entry |
| `tools/govuk/apply-version.sh` | --run-id TICKET --repo R --version V [--final] | Phase 3 per-version: package.json + install + test + commit + mark-implemented |
| `tools/govuk/version-mark-implemented.sh` | --run-id TICKET --repo R --version V [--commit SHA] | Phase 3: mark version applied |
| `tools/govuk/version-mark-failed.sh` | --run-id TICKET --repo R --version V --reason "..." | Phase 3: mark version failed |
| `tools/govuk/render-version-plan.sh` | --run-id TICKET --repo R --version V | Markdown view of one version's plan |
| `tools/govuk/list-plan-summaries.sh` | --run-id TICKET [--repo R] [--json] | PLAN_WALKER: one summary row per pending version |
| `tools/govuk/list-plans.sh` | --run-id TICKET [--repo R] [--filter F] [--sort-semver] [--json] | Filterable Phase 1/2 status |
| `tools/govuk/upgrade-status.sh` | --run-id TICKET [--repo R] [--filter F] [--sort-semver] [--json] | Combined Phase 1/2/3 status (delegates to list-plans.sh) |

## Workareas (runtime cache, gitignored)

`workareas/` holds per-ticket state generated by the skills as they
run. It is **gitignored** — never checked into the repo. **Exception:**
`workareas/shared/` IS tracked (via a `.gitignore` negation) so the
review skill's handoff helper can publish artifacts on a workspace
branch for the PR owner to pick up.

```
workareas/reviews/EUDPA-X/                         → ticket.md, repos/, review-index.md, review.{repo}.md
workareas/reviews/EUDPA-X/file-reviews/{repo}/     → {file}.review.md, _consistency-check.md
workareas/code-style-reviews/EUDPA-X/              → .style-meta.json, items.{repo}.json, style-review.{repo}.md, style-rules.{repo}.md
workareas/code-style-reviews/EUDPA-X/file-reviews/{repo}/ → {file}.style.json
workareas/ticket-creation/<slug>/                  → draft.md
workareas/ticket-planning/EUDPA-X/                 → plan.md
workareas/ticket-refinement/EUDPA-X/               → review.md, repos/
workareas/npm-upgrades/EUDPA-X/{repo}/             → upgrade__{pkg}__{cur}__{tgt}.{auto|manual}.md, .upgrades-meta.json
workareas/npm-implementations/EUDPA-X/{repo}/      → implement__{pkg}__{current}.{todo|done|failed}
workareas/govuk-upgrades/EUDPA-X/                  → .run-meta.json
workareas/govuk-upgrades/EUDPA-X/{repo}/           → versions.{repo}.json, CHANGELOG.md, version__{v}.changelog.md, best-practices.md
workareas/shared/EUDPA-X/                          → review handoff artifacts (tracked; committed to chore/EUDPA-X-review-handoff)
```

## Conventions

- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- PRs: raise against `main` in the relevant repo
- Cross-repo changes: coordinate via the tests repo
