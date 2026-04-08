# trade-imports-animals workspace

This is a local workspace aggregating 4 independent GitHub repos for the DEFRA trade imports animals service. It is **not** a monorepo — each repo has its own git history, remotes, and CI. This folder provides shared tooling and cross-repo context.

## Repo map

| Folder | GitHub repo | Role | Stack |
|--------|------------|------|-------|
| `repos/trade-imports-animals-frontend` | DEFRA/trade-imports-animals-frontend | User-facing web application | Node.js |
| `repos/trade-imports-animals-backend` | DEFRA/trade-imports-animals-backend | API / business logic service | TBD |
| `repos/trade-imports-animals-tests` | DEFRA/trade-imports-animals-tests | End-to-end / integration test suite | Node.js |
| `repos/trade-imports-animals-admin` | DEFRA/trade-imports-animals-admin | Internal admin interface | Node.js |

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
| `make start` | Start full stack via tests repo compose (Docker Hub images) |
| `make start-infra` | Start shared infra only (MongoDB, Redis, LocalStack, Defra ID stub) |
| `make start-frontend` | Start frontend dev server from source |
| `make start-backend` | Start backend from source (needs `make start-infra` first) |
| `make start-admin` | Start admin dev server from source |
| `make stop` | Stop full stack |

## Common workflows

**First-time setup:**
```bash
make setup    # clone all repos
make install  # npm install in Node repos
make start    # start all services
```

**Daily update:**
```bash
make update   # pull latest on all repos
make status   # check for anything uncommitted
```

**Run the full test suite:**
```bash
make test
```

**Work on a single repo:**
```bash
cd repos/trade-imports-animals-frontend
# make changes, commit, push as normal
git checkout -b my-feature
# ...
git push origin my-feature
```

## Docs

`docs/` — project documentation. Add architecture notes, ADRs, runbooks etc. here as the project develops.

## Skills

`skills/` — agentic skill definitions for use with Claude Code across this workspace.

## Conventions

<!-- TODO: fill in once established -->
- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- PRs: raise against `main` in the relevant repo
- Cross-repo changes: coordinate via the tests repo
