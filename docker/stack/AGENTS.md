# Workspace docker stack — agent index

The wrapper-managed stack (this folder + `scripts/stack/`) is the recommended
way to run the full service set during cross-service development. Sits
alongside `make docker-compose-*` while we evaluate.

## Stand up / tear down

```bash
./scripts/stack/run-stack.sh                                # all services on :latest
./scripts/stack/run-stack.sh -b feat/EUDPA-123              # branch tag where published, latest elsewhere
./scripts/stack/run-stack.sh -d                             # build the 5 repo-backed services from local source
./scripts/stack/run-stack.sh -e backend                     # run backend in IntelliJ / npm; rest in docker
./scripts/stack/run-stack.sh --profile frontend --profile infrastructure --profile database
                                                            # only those profiles; intended for "running other tiers natively"

./scripts/stack/stop-stack.sh         # down --volumes --remove-orphans
./scripts/stack/restart-stack.sh ...  # stop then run-stack (forwards -b / -e / -d / --profile)
./scripts/stack/bounce-mongo.sh       # wipe mongo's volume + re-run init scripts
./scripts/stack/bounce-backend.sh     # recreate backend container — picks up edited Java source in --dev mode
```

Images are pulled fresh on every run (`--pull always`).

## Compose file layout

The 10 services live in five overlay files; `compose.yml` is just the project
name anchor. `run-stack.sh` `-f`-stacks all of them automatically.

| File | Services | Profile |
|---|---|---|
| `compose.yml` | (`name:` only) | — |
| `database.compose.yml` | `mongodb` | `database` |
| `infrastructure.compose.yml` | `localstack`, `localstack-init`, `redis`, `cdp-uploader` | `infrastructure` |
| `stubs.compose.yml` | `trade-imports-defra-id-stub`, `trade-imports-stub` | `stubs` |
| `backend.compose.yml` | `trade-imports-animals-backend`, `trade-imports-reference-data` | `backend` |
| `frontend.compose.yml` | `trade-imports-animals-frontend`, `trade-imports-animals-admin` | `frontend` |
| `dev.compose.yml` (--dev only) | build/target/volumes overlay for the 5 repo-backed services | — |

## Choosing between `-d`, `-e`, and `--profile`

| Want to… | Use |
|---|---|
| Run the full stack from published Dockerhub images | `run-stack.sh` (no flags) |
| Pull a published branch tag for one or more repos | `run-stack.sh -b feat/X` |
| Edit source and see changes (Node hot-reload, Java needs `bounce-backend.sh`) | `run-stack.sh -d` |
| Run one repo-backed service natively from your IDE, rest in docker | `run-stack.sh -e backend` |
| Run a whole tier natively (e.g. backend on the host, mongo + frontend in docker) | `run-stack.sh --profile frontend --profile infrastructure --profile database` |
| Reseed mongo before E2E | `bounce-mongo.sh` |
| Pick up edited Java source under `--dev` | `bounce-backend.sh` |

`--branch` and `--dev` are mutually exclusive (hard error). The other flags
compose freely.

## `--exclude` (`-e`) labels

Repeatable. Valid: `frontend`, `backend`, `admin`, `stub`, `reference-data`.
Excluded services skip the Dockerhub probe and stay out of the stack — start
them yourself; the rest of the stack reaches them via
`host.docker.internal:<port>`.

Ports for host-side runs: frontend 3000, admin 3001, backend 8085, stub 8087,
reference-data 8086.

## `--profile` semantics (strict)

Repeatable. Valid: `database`, `infrastructure`, `stubs`, `backend`, `frontend`.
Defaults to all five. Strict — if you pass only `--profile frontend`, compose
won't auto-include `database` even though frontend depends_on redis (which
in turn depends on `infrastructure` services). Spell out the dependency
chain you need.

Intended use: running a tier natively. Example — backend in IntelliJ, rest
in docker:

```bash
./scripts/stack/run-stack.sh --profile frontend --profile infrastructure --profile database --profile stubs
# ... then in IntelliJ: run trade-imports-animals-backend with SPRING_PROFILES_ACTIVE=local
```

## Running E2E tests against this stack

```bash
./scripts/stack/run-stack.sh
cd repos/trade-imports-animals-tests
npm run test:local
```

`database:reseed` (called inside `test:local`) auto-detects whether the
workspace stack or the tests-repo stack owns the mongo on 27017 and reseeds
the right one. Errors out if neither is up.

## Lifecycle scripts live in `scripts/stack/`

- `run-stack.sh` — flag parsing in `lib/flags.sh`; colour output in
  `lib/colour.sh`; compose `-f` list in `lib/compose.sh`.
- `stop-stack.sh`, `restart-stack.sh`, `bounce-mongo.sh`, `bounce-backend.sh`
  — siblings, share `lib/` helpers.

## `--dev` caveats

- Node services (frontend, admin): hot-reload via nodemon on the bind mount
  of `src/`. Just save and refresh.
- Java backend: recompiles on container start. After editing Java source run
  `./scripts/stack/bounce-backend.sh` to pick up the change (~30-45s).
- Java stub and reference-data: their Dockerfiles only have an `AS development`
  stage (pre-built JAR, no source mount). `--dev` rebuilds the image but does
  not hot-reload. A `dev-run` stage in those repos would unlock that.

## Hostname rules — no `/etc/hosts` edits required

Two hostnames, used for different audiences:

- **Browser-visible URLs** use `localhost`. Playwright base URLs,
  `DEFRA_ID_REDIRECT_URL`, `DEFRA_ID_SIGN_OUT_REDIRECT_URL`, and the
  stub's `WELL_KNOWN_HOST_OVERRIDE`. The dev machine resolves these
  natively.
- **Inter-container URLs** use `host.docker.internal` (auto-injected
  inside containers by Docker Desktop). Mongo, redis, localstack, the
  cdp-uploader, the frontend's server-side `DEFRA_ID_OIDC_CONFIGURATION_URL`
  fetch.

The OIDC token endpoint sits across both audiences. The
`trade-imports-defra-id-stub` handles this itself: when
`WELL_KNOWN_HOST_OVERRIDE=http://localhost:3007`, the discovery doc it
returns has `authorization_endpoint`/`end_session_endpoint` on `localhost`
(browser-friendly) AND `token_endpoint`/`jwks_uri`/`issuer` automatically
rewritten to `host.docker.internal` (server-friendly). See
`repos/trade-imports-defra-id-stub/src/open-id/host.js`.

The frontend's `signOutHostnameRewrite` is `enabled: true` so the
sign-out URL (built from `DEFRA_ID_OIDC_CONFIGURATION_URL`, which uses
`host.docker.internal` for the server-side fetch) gets flipped back to
`localhost` before being handed to the browser.

| Service | Env | Value |
|---|---|---|
| frontend / admin | `DEFRA_ID_OIDC_CONFIGURATION_URL` | `http://host.docker.internal:3007/…` (server-side) |
| frontend / admin | `DEFRA_ID_REDIRECT_URL` | `http://localhost:{3000,3001}/auth/sign-in-oidc` (browser) |
| frontend / admin | `DEFRA_ID_SIGN_OUT_REDIRECT_URL` | `…/auth/sign-out-oidc` (browser) |
| frontend / admin | `DEFRA_ID_SIGN_OUT_HOSTNAME_REWRITE_ENABLED` | `true` (flips h.d.i. → localhost for browser-visible sign-out URL) |
| defra-id-stub | `WELL_KNOWN_HOST_OVERRIDE` | `http://localhost:3007` (browser endpoints; token endpoint auto-rewrites to h.d.i.) |

## Files in this folder

- `compose.yml` — base, just `name: trade-imports-animals`.
- `<role>.compose.yml` — per-role service definitions (see layout table above).
- `dev.compose.yml` — build/target/volumes overlay for `--dev`.
- `shared.env` — env vars loaded by multiple services (mongo URIs, AWS test
  creds, localstack endpoints, the truststore cert blob).
- `scripts/mongodb/`, `scripts/localstack/` — init scripts copied into the
  respective containers at boot.
