# Repository Review: trade-imports-animals-workspace

**PR:** #6
**Commit:** 43093a3b29aaa789e12f56c0f8a8fa90f1c38dc0
**Files Changed:** 8

## Summary

Registers the new `trade-imports-dynamics-gateway` repo across every workspace enumeration point: `Makefile` (`REPOS`, `JAVA_REPOS`, new `start-gateway` target), `scripts/setup.sh` (clone), the stack scripts (`run-stack.sh` service map, `flags.sh` usage text), the stack overlays (`backend.compose.yml` service on port 8088, `dev.compose.yml` build block), and the docs (`CLAUDE.md`, `docker/stack/AGENTS.md`). The wiring follows the existing per-service patterns closely; findings are mostly stale counts in docs plus one real dev-mode wiring gap.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `CLAUDE.md` | SAFE | 0 | 0 | 1 |
| `Makefile` | SAFE | 0 | 0 | 1 |
| `docker/stack/AGENTS.md` | SAFE | 0 | 0 | 2 |
| `docker/stack/backend.compose.yml` | SAFE | 0 | 0 | 1 |
| `docker/stack/dev.compose.yml` | NEEDS ATTENTION | 0 | 1 | 0 |
| `scripts/setup.sh` | SAFE | 0 | 0 | 0 |
| `scripts/stack/lib/flags.sh` | SAFE | 0 | 0 | 0 |
| `scripts/stack/run-stack.sh` | SAFE | 0 | 0 | 0 |

## Positive Observations

- Every consumer of the `run-stack.sh` `services` array (exclude labels, branch probing, dev builds, image-tag env vars) was verified to resolve correctly for the new entry — the `label|image|ENV_VAR` registration pattern was followed exactly.
- `backend.compose.yml`'s new gateway block is not cargo-culted: each env var (`AWS_EMF_AGENT_ENDPOINT`, `APP_AWS_ENDPOINT_OVERRIDE`, `TRADE_IMPORTS_DYNAMICS_GATEWAY_BASE_URL`) is genuinely consumed by the gateway, and `mongodb` is correctly omitted from `depends_on`.
- Port 8088 is unique across all overlays and matches the gateway Dockerfile's `EXPOSE` and the AGENTS.md port table.
- No secrets and no TST-specific values hard-coded anywhere in the stack changes.

## Consistency Check

One cross-repo inconsistency (see `file-reviews/trade-imports-animals-workspace/_consistency-check.md`): the workspace stack passes neither `AZURE_SERVICE_BUS_CONNECTION_STRING` nor `AZURE_SERVICE_BUS_QUEUE` and has no Service Bus emulator tier — unlike the gateway repo's own `compose.yml`, which adds `mssql` + `servicebus-emulator`. In the workspace stack the gateway falls back to the unreachable `application-local.yml` placeholder, so it boots and passes `/health` but every `POST /events` is guaranteed to 502. Needs a deliberate decision: add the emulator tier, pass through the env vars (item 5), or document the limitation.

## Test Coverage

- Unit tests: n/a — shell/compose/docs changes only; no test harness exists for the stack scripts.
- Integration tests: manual stack bring-up is the de-facto verification; the gateway's own repo carries the automated coverage.

## Risk Assessment

**Overall Risk:** Low
**Rationale:** Additive registration changes following established patterns; the one Major (dev overlay not using the gateway's `dev-run` stage) degrades dev ergonomics but breaks nothing.

## Items

| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | CLAUDE.md | 103 | Minor | stale-doc | Workspace stack section still says '-d/--dev (build the 5 repo-backed services)' but this PR adds the gateway as a 6th repo-backed service and updates the same count to 6 in scripts/stack/lib/flags.sh | Change 'the 5 repo-backed services' to 'the 6 repo-backed services' in the Workspace stack section to match flags.sh and run-stack.sh |  |  |  |
| 2 | Makefile | 13 | Minor | consistency | New start-gateway target is not listed in .PHONY, unlike its siblings start-frontend/start-backend/start-admin; a file or directory named start-gateway at the workspace root would silently turn the target into a no-op | Add start-gateway to the .PHONY line alongside the other start-* targets |  |  |  |
| 3 | docker/stack/AGENTS.md | 12 | Minor | doc-accuracy | Usage example comment still says 'build the 5 repo-backed services from local source' but the PR adds a 6th repo-backed service (gateway) and updates the count to 6 at line 38 and in scripts/stack/lib/flags.sh usage text | Change '5 repo-backed services' to '6 repo-backed services' in the run-stack.sh -d example comment on line 12 |  |  |  |
| 4 | docker/stack/AGENTS.md | 106 | Minor | doc-accuracy | The --dev caveat added by this PR lumps gateway in with stub/reference-data as 'Dockerfiles only have an AS development stage... A dev-run stage in those repos would unlock that', but the gateway Dockerfile created under this same ticket already has an AS dev-run stage (Maven + source, line 46); it is dev.compose.yml targeting 'development' with no source mount that prevents hot-reload | Reword to note gateway already has a dev-run stage but dev.compose.yml does not use it yet, or wire dev.compose.yml to target dev-run with a src volume like the backend |  |  |  |
| 5 | docker/stack/backend.compose.yml | 43 | Minor | configurability | Gateway service environment block has no AZURE_SERVICE_BUS_CONNECTION_STRING / AZURE_SERVICE_BUS_QUEUE pass-through, so the container is locked to the dummy local-profile defaults and the stack cannot be pointed at the real TST namespace for the ticket's manual connectivity testing without editing the file | Add value-less pass-through entries '- AZURE_SERVICE_BUS_CONNECTION_STRING' and '- AZURE_SERVICE_BUS_QUEUE' to the environment list; when unset on the host they are omitted and the local-profile defaults still apply |  |  |  |
| 6 | docker/stack/dev.compose.yml | 45 | Major | consistency | Gateway is wired to 'target: development' (pre-built JAR, no source mount) even though the gateway Dockerfile in this ticket's PR set provides a 'dev-run' stage built for source-mounted live recompile; the stage is left unreachable, the new service gets no --dev source-pickup loop, and the PR's own AGENTS.md edit (which claims the gateway only has an 'AS development' stage) is made inaccurate | Wire the gateway like the backend: 'target: dev-run' plus volume '../../repos/trade-imports-dynamics-gateway/src:/app/src' (and correct the AGENTS.md hot-reload note), or drop the unused dev-run stage from the gateway Dockerfile if 'development' is the deliberate choice |  |  |  |

## Repository Verdict
**Status:** NEEDS ATTENTION
