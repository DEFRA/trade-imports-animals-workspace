# trade-imports-animals workspace

Local workspace aggregating the DEFRA trade imports animals service repos. Not a monorepo — each repo has its own git history, remotes, and CI. This folder provides shared tooling and cross-repo context.

## Repos

| Folder | GitHub | Role | Stack |
|--------|--------|------|-------|
| `repos/trade-imports-animals-frontend` | [DEFRA/trade-imports-animals-frontend](https://github.com/DEFRA/trade-imports-animals-frontend) | User-facing web application | Node.js |
| `repos/trade-imports-animals-backend` | [DEFRA/trade-imports-animals-backend](https://github.com/DEFRA/trade-imports-animals-backend) | API / business logic service | Java / Spring Boot |
| `repos/trade-imports-animals-tests` | [DEFRA/trade-imports-animals-tests](https://github.com/DEFRA/trade-imports-animals-tests) | End-to-end / integration tests | Node.js / Playwright |
| `repos/trade-imports-animals-admin` | [DEFRA/trade-imports-animals-admin](https://github.com/DEFRA/trade-imports-animals-admin) | Internal admin interface | Node.js |
| `repos/trade-imports-stub` | [DEFRA/trade-imports-stub](https://github.com/DEFRA/trade-imports-stub) | Stub of upstream trade-imports services | Java / Spring Boot |
| `repos/trade-imports-reference-data` | [DEFRA/trade-imports-reference-data](https://github.com/DEFRA/trade-imports-reference-data) | Reference data service | Java / Spring Boot |

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

## Branch-aware stack (alpha)

`./scripts/run-stack.sh` brings up the full stack from Dockerhub, optionally
mixing in branch-tagged images for any service whose repo has published one
(see EUDPA-175):

```bash
./scripts/run-stack.sh                                              # all services on :latest
./scripts/run-stack.sh --branch feat/EUDPA-123                      # branch where published, latest elsewhere
./scripts/run-stack.sh --exclude backend                            # skip backend; run it locally
./scripts/run-stack.sh --branch feat/EUDPA-123 --exclude backend    # combine: branch tags + local backend
```

`--branch` probes Dockerhub for `defradigital/<svc>:<sanitised-branch>` per
repo-backed service and prints a per-service `branch / latest / excluded`
summary. Branch-name sanitisation matches the per-repo `publish-branch.yml`
workflows.

`--exclude` is repeatable. Valid labels: `frontend`, `backend`, `admin`,
`stub`, `reference-data`. Excluded services skip the probe and stay out of
the stack — start them yourself in IntelliJ / `npm` and the rest of the
stack reaches them via `host.docker.internal`.

Sibling scripts manage the same stack:

```bash
./scripts/stop-stack.sh       # docker compose down --volumes --remove-orphans
./scripts/restart-stack.sh    # stop then run-stack.sh (forwards --branch and --exclude)
```

### Swap a service into IntelliJ

The stack routes all inter-service URLs through `host.docker.internal`, and
every service publishes its port to the host. To run one repo-backed service
from source instead of from Docker:

```bash
./scripts/run-stack.sh --exclude backend
# now run trade-imports-animals-backend in IntelliJ on port 8085
# frontend / admin reach the IntelliJ instance via host.docker.internal:8085
```

This sits alongside (not in place of) the existing `make docker-compose-*`
flow while we evaluate the approach. EUDPA-178 will consolidate.

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
