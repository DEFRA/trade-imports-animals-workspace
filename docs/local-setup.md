# Local Setup

## How the services connect

```
Browser
  │
  ├──▶ Frontend (port 3000)  ──▶ Backend API (port 8085)  ──▶ MongoDB (27017)
  │                                                         ──▶ LocalStack / AWS (4566)
  │
  └──▶ Admin (port 3001)     ──▶ Backend API (port 8085)

All three Node services ──▶ Redis (6379) for sessions
All three Node services ──▶ Defra ID stub (3007) for OIDC auth

Playwright tests (no port) ──▶ Frontend + Admin
```

### Key wiring

| Env var | Set to (in compose) | Purpose |
|---------|---------------------|---------|
| `TRADE_IMPORTS_ANIMALS_BACKEND_URL` | `http://trade-imports-animals-backend:8085` | Frontend → Backend |
| `TRADE_IMPORTS_ANIMALS_BACKEND_URL` | `http://trade-imports-animals-backend:8085` | Admin → Backend |
| `DEFRA_ID_OIDC_CONFIGURATION_URL` | `http://trade-imports-defra-id-stub:3007/...` | OIDC discovery |
| `REDIS_HOST` | `redis` | Session cache |
| `MONGO_URI` | `mongodb://mongodb:27017` | Backend → MongoDB |

---

## Option 1 — Full stack from Docker Hub images (quickest)

The `trade-imports-animals-tests` repo has a `compose.yml` that pulls all published images and wires them together. This is the canonical way to run the full stack.

```bash
cd repos/trade-imports-animals-tests
docker compose up
```

Services started:

| Service | Port | Image |
|---------|------|-------|
| Frontend | 3000 | `defradigital/trade-imports-animals-frontend:latest` |
| Backend | 8085 | `defradigital/trade-imports-animals-backend:latest` |
| Admin | 3001 | `defradigital/trade-imports-animals-admin:latest` |
| Defra ID stub | 3007 | `defradigital/trade-imports-defra-id-stub` |
| MongoDB | 27017 | `mongo:7.0` |
| Redis | 6379 | `redis:7` |
| LocalStack | 4566 | `localstack/localstack` |

To pin specific image versions (e.g. to test a release candidate):
```bash
TRADE_IMPORTS_ANIMALS_FRONTEND=1.2.3 \
TRADE_IMPORTS_ANIMALS_BACKEND=1.2.3 \
TRADE_IMPORTS_ANIMALS_ADMIN=1.2.3 \
docker compose up
```

To also run the Playwright tests:
```bash
docker compose --profile tests up
```

**Note:** Admin has `AUTH_ENABLED=false` in this stack — it's configured for testing, not real auth flows.

---

## Option 2 — Individual services from source

Each repo has its own `compose.yml` for running that service in isolation with local infra (MongoDB, Redis, LocalStack). Use this when actively developing a single service.

### Frontend from source

```bash
cd repos/trade-imports-animals-frontend
docker compose up --build -d
# or: npm run dev (port 3000)
```

Starts: frontend + Redis + LocalStack + MongoDB + Defra ID stub.
Backend is **commented out** in this compose — it's expected to be running separately on `localhost:8085`.

### Backend from source

```bash
cd repos/trade-imports-animals-backend

# Infrastructure only
docker compose --profile infra up -d        # MongoDB, Redis, LocalStack

# Then run app directly (recommended for fast iteration)
mvn spring-boot:run

# Or full stack
docker compose --profile services up --build -d
```

Runs on port **8085**. Swagger UI at `http://localhost:8085/swagger-ui.html`.

### Admin from source

```bash
cd repos/trade-imports-animals-admin
npm run dev
# or: docker compose up --build -d
```

Runs on port **3000** (direct) or **3001** (in compose alongside frontend).

---

## Option 4 — Full stack from source via Docker (recommended for cross-service development)

Builds frontend, admin and backend from their local source directories and starts the full stack in Docker with volume mounts. Node services get webpack `--watch` (hot-reload on `src/` changes); the backend runs `mvn spring-boot:run`.

```bash
make docker-compose-dev   # build images + start stack (takes a few minutes first time)
make docker-logs          # tail frontend + admin + backend logs (Ctrl-C to stop)
```

After the stack is up, the services are available at the same ports as Option 1. Run the E2E tests against it:

```bash
cd repos/trade-imports-animals-tests
npm run test:local
```

### Frontend / admin changes

Node source changes are picked up automatically via webpack `--watch`. No action needed.

### Backend changes (Java)

The backend does **not** hot-reload — you must restart the container after changing Java source:

```bash
make docker-restart-backend
```

This restarts the container, which re-runs `mvn spring-boot:run` and picks up changes in `repos/trade-imports-animals-backend/src/`.

### Switching between source and image builds

`make docker-compose-dev` adds the `docker/local.dev.compose.yml` override on top of `docker/local.compose.yml`. To revert to published images for a service, just run `make docker-compose-up` instead (no dev override).

---

## Option 3 — Mixed: infra from tests compose, services from source

Run the shared infra from the tests repo compose, then start each service directly.
Useful when you want to develop multiple services simultaneously.

```bash
# Terminal 1 — shared infra
cd repos/trade-imports-animals-tests
docker compose up mongodb redis localstack trade-imports-defra-id-stub

# Terminal 2 — backend
cd repos/trade-imports-animals-backend
SPRING_PROFILES_ACTIVE=local mvn spring-boot:run

# Terminal 3 — frontend
cd repos/trade-imports-animals-frontend
TRADE_IMPORTS_ANIMALS_BACKEND_URL=http://localhost:8085 npm run dev

# Terminal 4 — admin (optional)
cd repos/trade-imports-animals-admin
TRADE_IMPORTS_ANIMALS_BACKEND_URL=http://localhost:8085 npm run dev
```

---

## Auth (Defra ID stub)

All environments use `defradigital/trade-imports-defra-id-stub` as a local OIDC provider. It runs on port 3007 and accepts any username with a configurable password (set via `AUTH_PASSWORD` — see the stub image docs for the default).

The OIDC discovery URL is:
```
http://localhost:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
```

If running services inside Docker and the auth redirect needs to hit `localhost:3007` from the browser, add to `/etc/hosts`:
```
127.0.0.1 host.docker.internal
```

---

## Ports summary

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Admin | 3001 |
| Defra ID stub | 3007 |
| Backend | 8085 |
| LocalStack | 4566 |
| MongoDB | 27017 |
| Redis | 6379 |
