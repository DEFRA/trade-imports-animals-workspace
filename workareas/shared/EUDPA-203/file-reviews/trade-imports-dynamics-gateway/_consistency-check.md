# Consistency Check: trade-imports-dynamics-gateway

**Ticket:** EUDPA-203
**All repos in scope:** trade-imports-animals-workspace, trade-imports-dynamics-gateway
**PR:** #2 | **Commit:** 37b735b

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| Port 8088 / `/health` endpoint | workspace stack maps `8088:8088` and healthchecks `http://localhost:8088/health` ✅ | ✅ Service listens on `PORT=8088`, CDP-standard `/health` present from skeleton | CONSISTENT |
| `TRADE_IMPORTS_DYNAMICS_GATEWAY_BASE_URL` | workspace backend.compose.yml sets `http://host.docker.internal:8088` ✅ | ✅ `application-local.yml` default is the identical value | CONSISTENT |
| `SPRING_PROFILES_ACTIVE=local` startup contract | workspace stack + `make start-gateway` both run profile `local` ✅ | ✅ `application-local.yml` provides placeholder Service Bus defaults so the service can boot without real credentials | CONSISTENT |
| Dockerfile `AS development` stage for `--dev` overlay | workspace dev.compose.yml builds `target: development` ✅ | ✅ Stage exists (Dockerfile:24); matches the stub/reference-data "no hot-reload" pattern AGENTS.md documents | CONSISTENT |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` / `AZURE_SERVICE_BUS_QUEUE` consumption | workspace stack passes neither and has no emulator ❌ | ✅ Declared, `@NotBlank`-validated, defaulted per-environment | INCONSISTENT — gap is on the workspace side (see workspace check); noted here because the `application-local.yml` fallback (`sb://local.servicebus.windows.net/`) silently masks the missing wiring |
| Service Bus emulator config (`servicebus-config.json`) | workspace stack has no equivalent | ✅ Two near-identical copies in this repo: `compose/servicebus-config.json` (queue `local-queue`) and `src/test/resources/servicebus-config.json` (queue `test-queue`) | CONSISTENT cross-repo; within-repo duplication noted below |

## Missing Changes

*None identified.* The workspace-side registration (compose block, Make targets, stack labels, docs) is the counterpart of this PR and is fully present in workspace PR #6. No change exists in the workspace repo that implies a missing change here.

## Unique Changes

- **All feature code is unique to this repo by design** — controller, sender, config, exception handler, Testcontainers ITs. This matches the ticket scope (first slice of the gateway lives entirely in this service).
- **`pom.xml` re-enables `jacoco-check` at 0.65** — unique, intentional (the skeleton had it excluded pending feature code, which this PR adds). No peer-repo coverage-gate convention is violated.
- **`ApplicationTest` deleted / `TrustStoreConfigurationIT` trimmed** — unique test cleanup; the deleted cases were either redundant with the new `IntegrationBase` context start or unit-level `CertificateLoader` tests living in an IT. Single-repo concern, covered by per-file reviews.
- **No tests-repo (E2E) change** — expected: the gateway is not yet reachable from any user journey (EUDPA-168 outbox wiring is a separate ticket), and this repo carries its own end-to-end IT (`EventsSendControllerIT` against a real emulator).
- **Local-default divergence within this repo (advisory):** the repo-local `compose.yml` defaults the connection string to the emulator (`Endpoint=sb://servicebus-emulator;...UseDevelopmentEmulator=true`), while `application-local.yml` falls back to a fake real-Azure endpoint (`sb://local.servicebus.windows.net/`). Anyone running the `local` profile outside this repo's compose (e.g. the workspace stack, or `make start-gateway`) gets a sender that boots but can never deliver. Worth a README sentence or aligning the `application-local.yml` fallback with the emulator endpoint.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 inconsistencies found (1 advisory: local-profile fallback masks the workspace stack's missing Service Bus wiring — actionable gap recorded against the workspace repo)
**Summary:** The gateway's contract (port, base URL, profile, Docker stages, env-var names) lines up exactly with the workspace registration; the only cross-repo gap — no Service Bus emulator or credentials in the workspace stack — belongs to the workspace PR and is recorded there.
