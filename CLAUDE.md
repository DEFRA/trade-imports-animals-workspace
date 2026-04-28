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
| `make docker-compose-up` | Start full stack from published Docker Hub images |
| `make docker-compose-dev` | Start full stack built from local source (hot-reload for Node, volume mount for Java) |
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

## Docs

`docs/` — project documentation. Add architecture notes, ADRs, runbooks etc. here as the project develops.

## Skills

`skills/` — agentic skill definitions for use with Claude Code across this workspace.

## Conventions

<!-- TODO: fill in once established -->
- Branch naming: `feat/`, `fix/`, `chore/` prefixes
- PRs: raise against `main` in the relevant repo
- Cross-repo changes: coordinate via the tests repo
