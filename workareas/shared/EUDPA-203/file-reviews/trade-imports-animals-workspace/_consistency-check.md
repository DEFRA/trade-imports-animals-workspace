# Consistency Check: trade-imports-animals-workspace

**Ticket:** EUDPA-203
**All repos in scope:** trade-imports-animals-workspace, trade-imports-dynamics-gateway
**PR:** #6 | **Commit:** 43093a3

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Gateway service registration (port 8088, label `gateway`, image env `TRADE_IMPORTS_DYNAMICS_GATEWAY`) | gateway repo exposes 8088 ✅ | ✅ Makefile, CLAUDE.md, setup.sh, run-stack.sh, flags.sh, AGENTS.md, backend.compose.yml, dev.compose.yml all updated coherently | CONSISTENT |
| `TRADE_IMPORTS_DYNAMICS_GATEWAY_BASE_URL` → `http://host.docker.internal:8088` | gateway `application-local.yml` default matches exactly ✅ | ✅ Set in backend.compose.yml | CONSISTENT |
| Healthcheck style (`CMD curl -f http://localhost:<port>/health`, interval 5s, retries 10) | n/a (workspace-internal peers: backend, reference-data) | ✅ Gateway block mirrors backend exactly incl. `start_period: 60s` | CONSISTENT |
| Dev overlay `target: development` | gateway Dockerfile has `AS development` stage (Dockerfile:24) ✅ | ✅ dev.compose.yml entry matches stub/reference-data pattern; AGENTS.md no-hot-reload note updated to include gateway | CONSISTENT |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` / `AZURE_SERVICE_BUS_QUEUE` | gateway repo: declared in `application.yml` (`@NotBlank`-validated config), defaulted in repo-local `compose.yml` (emulator), documented in README ✅ | ❌ Not set in backend.compose.yml or `shared.env`; no Service Bus emulator service in `docker/stack/` | INCONSISTENT (see Missing Changes) |
| Service Bus emulator infra (`mssql` + `servicebus-emulator` + `servicebus-config.json`) | gateway repo `compose.yml` ✅, Testcontainers ITs ✅ | ❌ Absent from `docker/stack/` | INCONSISTENT (same root cause as above) |

## Missing Changes

1. **`docker/stack/backend.compose.yml` — gateway container has no Service Bus configuration and the workspace stack has no emulator.**
   The gateway repo's own `compose.yml` adds `mssql` + `servicebus-emulator` services and defaults `AZURE_SERVICE_BUS_CONNECTION_STRING` to the emulator endpoint (gateway PR diff, compose.yml hunks). The workspace stack's new gateway block (backend.compose.yml, PR hunk adding `trade-imports-dynamics-gateway`) passes neither variable and adds no emulator tier, so the container falls back to the `application-local.yml` placeholder pointing at `sb://local.servicebus.windows.net/` — an unreachable host. The service will boot and pass its `/health` healthcheck (the AMQP connection is lazy), but every `POST /events` through the workspace stack will return 502.
   *Assessment:* plausibly intentional for this first slice (the gateway is not yet wired to journey outboxes, and the E2E suite doesn't exercise it), but it means the workspace stack runs a service whose sole endpoint cannot succeed, with no comment or AGENTS.md note saying so. Either add the emulator tier (mirroring the gateway repo's compose) or document the limitation where the gateway service is declared.

## Unique Changes

- All workspace changes are registration plumbing for the new repo (clone list, Make targets, stack labels, doc counts 5→6 services / 6→7 repos). Each is mirrored across every file that enumerates repo-backed services — no enumeration point was missed (checked: Makefile `REPOS`/`JAVA_REPOS`, setup.sh, run-stack.sh `services` array, flags.sh usage text, AGENTS.md tables/ports, CLAUDE.md repo map, dev.compose.yml). Intentional and in-scope.

## Verdict

**Status:** INCONSISTENCIES FOUND
**Issues:** 1 inconsistency found
**Summary:** Gateway registration is mirrored cleanly across every workspace enumeration point, but the stack provides neither Service Bus credentials nor an emulator, leaving the gateway's only endpoint guaranteed to 502 in the workspace stack — needs a deliberate decision (add an emulator tier or document the gap).
