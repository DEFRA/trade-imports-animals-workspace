# Workspace docker stack — agent index

The wrapper-managed stack (this folder + `scripts/stack/`) is the recommended
way to run the full service set during cross-service development. Sits
alongside `make docker-compose-*` while we evaluate.

## Stand up / tear down

```bash
./scripts/stack/run-stack.sh                              # all services on :latest
./scripts/stack/run-stack.sh -b feat/EUDPA-123            # branch tag where published, latest elsewhere
./scripts/stack/run-stack.sh -e backend                   # run backend in IntelliJ / npm; rest in docker
./scripts/stack/run-stack.sh -b feat/EUDPA-123 -e backend # combine

./scripts/stack/stop-stack.sh         # down --volumes --remove-orphans
./scripts/stack/restart-stack.sh ...  # stop then run-stack (forwards -b / -e)
./scripts/stack/bounce-mongo.sh       # wipe mongo's volume + re-run init scripts
```

Images are pulled fresh on every run (`--pull always`).

## `--exclude` (`-e`) labels

Repeatable. Valid: `frontend`, `backend`, `admin`, `stub`, `reference-data`.
Excluded services skip the Dockerhub probe and stay out of the stack — start
them yourself; the rest of the stack reaches them via
`host.docker.internal:<port>`.

Ports for host-side runs: frontend 3000, admin 3001, backend 8085, stub 8087,
reference-data 8086.

## Running E2E tests against this stack

```bash
./scripts/stack/run-stack.sh
cd repos/trade-imports-animals-tests
npm run test:local
```

`database:reseed` (called inside `test:local`) auto-detects whether the
workspace stack or the tests-repo stack owns the mongo on 27017 and reseeds
the right one. Errors out if neither is up.

## Files in this folder

- `compose.yml` — the stack definition. Keys alpha-sorted at every depth
  (services + every nested map).
- `shared.env` — env vars loaded by multiple services (mongo URIs, AWS test
  creds, localstack endpoints, the truststore cert blob).
- `scripts/mongodb/`, `scripts/localstack/` — init scripts copied into the
  respective containers at boot.

## Lifecycle scripts live in `scripts/stack/`

- `run-stack.sh` — flag parsing in `lib/flags.sh`; colour output in
  `lib/colour.sh`.
- `stop-stack.sh`, `restart-stack.sh`, `bounce-mongo.sh` — siblings.

## Single-hostname rule

Every browser-visible URL — playwright base, OIDC redirect, stub well-known —
must use `host.docker.internal`. Mixing localhost and h.d.i. produces
`net::ERR_TOO_MANY_REDIRECTS` and intermittent Bell auth 500s under parallel
load. The relevant env knobs:

| Service | Env | Value |
|---|---|---|
| frontend / admin | `DEFRA_ID_REDIRECT_URL` | `http://host.docker.internal:{3000,3001}/auth/sign-in-oidc` |
| frontend / admin | `DEFRA_ID_SIGN_OUT_REDIRECT_URL` | `…/auth/sign-out-oidc` |
| frontend / admin | `DEFRA_ID_SIGN_OUT_HOSTNAME_REWRITE_ENABLED` | `false` (otherwise frontend rewrites h.d.i. → localhost on sign-out) |
| defra-id-stub | `WELL_KNOWN_HOST_OVERRIDE` | `http://host.docker.internal:3007` |
