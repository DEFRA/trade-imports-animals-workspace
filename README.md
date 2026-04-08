# trade-imports-animals workspace

Local workspace aggregating the DEFRA trade imports animals service repos. Not a monorepo — each repo has its own git history, remotes, and CI. This folder provides shared tooling and cross-repo context.

## Repos

| Folder | GitHub | Role | Stack |
|--------|--------|------|-------|
| `repos/trade-imports-animals-frontend` | [DEFRA/trade-imports-animals-frontend](https://github.com/DEFRA/trade-imports-animals-frontend) | User-facing web application | Node.js |
| `repos/trade-imports-animals-backend` | [DEFRA/trade-imports-animals-backend](https://github.com/DEFRA/trade-imports-animals-backend) | API / business logic service | Java / Spring Boot |
| `repos/trade-imports-animals-tests` | [DEFRA/trade-imports-animals-tests](https://github.com/DEFRA/trade-imports-animals-tests) | End-to-end / integration tests | Node.js / Playwright |
| `repos/trade-imports-animals-admin` | [DEFRA/trade-imports-animals-admin](https://github.com/DEFRA/trade-imports-animals-admin) | Internal admin interface | Node.js |

## Quickstart

```bash
make setup    # clone all repos into repos/
make install  # npm install in all Node repos
```

## Common commands

| Command | What it does |
|---------|-------------|
| `make setup` | Clone all repos (idempotent) |
| `make update` | `git pull --rebase` all repos |
| `make status` | `git status` across all repos |
| `make install` | `npm install` in all Node repos |
| `make test` | Run tests across all repos |
| `make start-frontend` | Start frontend from source |
| `make start-backend` | Start backend from source |
| `make start-admin` | Start admin from source |

## Working on a single repo

```bash
cd repos/trade-imports-animals-frontend
git checkout -b feat/my-feature
# make changes, commit, push as normal
```

Each repo has its own `CLAUDE.md` with repo-specific context.

## Structure

```
agents/     AI agent skills and workflows (Jira, GitHub, review, upgrade orchestration)
docs/       Architecture notes, setup guides, ADRs
scripts/    Shell scripts used by make targets
skills/     Claude Code skill definitions
```

## Docs

- [Local setup](docs/local-setup.md) — how to run the full stack locally
