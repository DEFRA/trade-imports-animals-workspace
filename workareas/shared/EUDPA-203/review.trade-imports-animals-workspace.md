# Repository Review: trade-imports-animals-workspace

**PR:** #6
**Commit:** f144c4f8e1555b49dba53067d3f0bb0cdb5048e1
**Refreshed:** 2026-06-11
**Files Changed:** 11 (current PR diff; `scripts/setup.sh` from the first pass has since landed via main)

## Summary

Registers the new `trade-imports-dynamics-gateway` repo across every workspace enumeration point, and — new since the first review — adds a Service Bus emulator tier to the workspace stack (`infrastructure.compose.yml`: `sqledge` + `servicebus-emulator`, a `servicebus` profile in `lib/compose.sh`, emulator-targeting ASB env defaults in `backend.compose.yml`, and the emulator config under `docker/stack/scripts/servicebus/`). All six first-pass items were fixed by the author (marked Fix/Done on the handoff branch) and independently verified in the refresh; seven new items were found, two of them Major.

## File Analysis Summary

| File | Verdict | Critical | Major | Minor |
|------|---------|----------|-------|-------|
| `.gitignore` | SAFE | 0 | 0 | 1 |
| `CLAUDE.md` | SAFE | 0 | 0 | 0 |
| `Makefile` | SAFE | 0 | 0 | 0 |
| `docker/stack/AGENTS.md` | SAFE | 0 | 0 | 1 |
| `docker/stack/backend.compose.yml` | NEEDS ATTENTION | 0 | 1 | 1 |
| `docker/stack/dev.compose.yml` | SAFE | 0 | 0 | 0 |
| `docker/stack/infrastructure.compose.yml` | NEEDS ATTENTION | 0 | 1 | 1 |
| `docker/stack/scripts/servicebus/servicebus-config.json` | SAFE | 0 | 0 | 0 |
| `scripts/setup.sh` | SAFE | 0 | 0 | 0 |
| `scripts/stack/lib/compose.sh` | SAFE | 0 | 0 | 1 |
| `scripts/stack/lib/flags.sh` | SAFE | 0 | 0 | 0 |
| `scripts/stack/run-stack.sh` | SAFE | 0 | 0 | 0 |

## Refresh Summary (2026-06-11)

**Window:** 43093a3 → f144c4f (PR branch merged main in via `b3467ac`; hand-resolved files `.gitignore`/`CLAUDE.md`/`Makefile` were re-reviewed in MERGE_RESOLVED mode)
**Files refreshed:** 5 (+ 4 new PR files reviewed fresh)
**Prior items resolved:** 6 / 6 (author-marked Fix/Done on the handoff branch; independently verified in the refresh — notes record what was checked)
**New items added:** 7 (2 Major, 5 Minor — ids 7–13)
**Spot-check (Fix+Done items in refreshed files):** all 6 verified, none regressed

| # | Change | File:Line | Severity | Issue |
|---|--------|-----------|----------|-------|
| 9 | ➕ New | `docker/stack/backend.compose.yml:52` | Major | Default connection string targets the emulator, but the emulator is AMQP-TCP-only while the gateway now hardcodes `AMQP_WEB_SOCKETS` — out-of-the-box local sends cannot connect |
| 11 | ➕ New | `docker/stack/infrastructure.compose.yml:78` | Major | `servicebus-emulator` has no healthcheck, so the gateway can accept POSTs before the emulator's AMQP endpoint is up (~30s+ after stack-up) |
| 7 | ➕ New | `.gitignore:29` | Minor | Shared .gitignore rule for a personal local-only script (`tools/review/prepare-ac-check.sh`) |
| 8 | ➕ New | `docker/stack/AGENTS.md:110` | Minor | Gateway --dev bullet promises "picked up on restart like the backend" but only `bounce-backend.sh` exists |
| 10 | ➕ New | `docker/stack/backend.compose.yml:53` | Minor | `AZURE_SERVICE_BUS_QUEUE` pass-through is read by nothing (queue comes from `EntityPath`) |
| 12 | ➕ New | `docker/stack/infrastructure.compose.yml:80` | Minor | Emulator image unpinned `:latest` while siblings pin versions |
| 13 | ➕ New | `scripts/stack/lib/compose.sh:15` | Minor | `servicebus` profile added but `--profile` docs in flags.sh/AGENTS.md still list five |

## Positive Observations

- All six first-pass items were addressed exactly as suggested — doc counts, `.PHONY`, the `dev-run` wiring with src volume mount, and the ASB env pass-through.
- The new emulator tier directly resolves the first review's consistency finding (workspace stack had no way to exercise `POST /events`); the emulator config matches Microsoft's sample shape and `EntityPath=local-queue` lines up across compose and config.
- The `servicebus` profile is correctly wired into `ALL_PROFILES`, so default up/stop/bounce all include the emulator.

## Test Coverage

- Unit tests: n/a — shell/compose/docs changes only.
- Integration tests: manual stack bring-up remains the de-facto verification; note new item 9 means the out-of-the-box emulator send path currently cannot work, so stack-level verification of the gateway send is blocked until the transport is configurable.

## Risk Assessment

**Overall Risk:** Medium
**Rationale:** The new emulator tier is wired in but cannot currently complete a send (transport mismatch, item 9) and has a startup-ordering gap (item 11) — the headline feature of the refresh doesn't work end-to-end yet.

## Repository Verdict
**Status:** NEEDS ATTENTION

## Items
| # | File | Line | Severity | Category | Issue | Fix | Disposition | Status | Notes |
|---|------|------|----------|----------|-------|-----|-------------|--------|-------|
| 1 | CLAUDE.md | 103 | Minor | stale-doc | Workspace stack section still says '-d/--dev (build the 5 repo-backed services)' but this PR adds the gateway as a 6th repo-backed service and updates the same count to 6 in scripts/stack/lib/flags.sh | Change 'the 5 repo-backed services' to 'the 6 repo-backed services' in the Workspace stack section to match flags.sh and run-stack.sh | Fix | Done | Verified fixed in refresh at f144c4f: count updated to 6 |
| 2 | Makefile | 13 | Minor | consistency | New start-gateway target is not listed in .PHONY, unlike its siblings start-frontend/start-backend/start-admin; a file or directory named start-gateway at the workspace root would silently turn the target into a no-op | Add start-gateway to the .PHONY line alongside the other start-* targets | Fix | Done | Verified fixed at f144c4f: start-gateway added to .PHONY |
| 3 | docker/stack/AGENTS.md | 12 | Minor | doc-accuracy | Usage example comment still says 'build the 5 repo-backed services from local source' but the PR adds a 6th repo-backed service (gateway) and updates the count to 6 at line 38 and in scripts/stack/lib/flags.sh usage text | Change '5 repo-backed services' to '6 repo-backed services' in the run-stack.sh -d example comment on line 12 | Fix | Done | Verified fixed at f144c4f: line 12 example now says 6 repo-backed services |
| 4 | docker/stack/AGENTS.md | 106 | Minor | doc-accuracy | The --dev caveat added by this PR lumps gateway in with stub/reference-data as 'Dockerfiles only have an AS development stage... A dev-run stage in those repos would unlock that', but the gateway Dockerfile created under this same ticket already has an AS dev-run stage (Maven + source, line 46); it is dev.compose.yml targeting 'development' with no source mount that prevents hot-reload | Reword to note gateway already has a dev-run stage but dev.compose.yml does not use it yet, or wire dev.compose.yml to target dev-run with a src volume like the backend | Fix | Done | Verified fixed at f144c4f: gateway split into its own --dev bullet; dev-run now wired (restart-script gap tracked as new item 8) |
| 5 | docker/stack/backend.compose.yml | 43 | Minor | configurability | Gateway service environment block has no AZURE_SERVICE_BUS_CONNECTION_STRING / AZURE_SERVICE_BUS_QUEUE pass-through, so the container is locked to the dummy local-profile defaults and the stack cannot be pointed at the real TST namespace for the ticket's manual connectivity testing without editing the file | Add value-less pass-through entries '- AZURE_SERVICE_BUS_CONNECTION_STRING' and '- AZURE_SERVICE_BUS_QUEUE' to the environment list; when unset on the host they are omitted and the local-profile defaults still apply | Fix | Done | Verified fixed at f144c4f: ASB env pass-through added (follow-ups: new items 9 transport mismatch, 10 dead AZURE_SERVICE_BUS_QUEUE) |
| 6 | docker/stack/dev.compose.yml | 45 | Major | consistency | Gateway is wired to 'target: development' (pre-built JAR, no source mount) even though the gateway Dockerfile in this ticket's PR set provides a 'dev-run' stage built for source-mounted live recompile; the stage is left unreachable, the new service gets no --dev source-pickup loop, and the PR's own AGENTS.md edit (which claims the gateway only has an 'AS development' stage) is made inaccurate | Wire the gateway like the backend: 'target: dev-run' plus volume '../../repos/trade-imports-dynamics-gateway/src:/app/src' (and correct the AGENTS.md hot-reload note), or drop the unused dev-run stage from the gateway Dockerfile if 'development' is the deliberate choice | Fix | Done | Verified fixed at f144c4f: gateway now targets dev-run with src volume mount, mirroring the backend |
| 7 | .gitignore | 29 | Minor | scope-hygiene | PR adds a shared .gitignore rule for a personal local-only script (tools/review/prepare-ac-check.sh) inside the shared tools/review/ namespace — unrelated to EUDPA-203, and it blocks every clone from ever committing a script at that path (a name that parallels the committed prepare-review.sh review tooling) | Drop the entry from the shared .gitignore; ignore the personal script locally via .git/info/exclude instead, or commit it as shared review tooling if it is genuinely useful |  |  |  |
| 8 | docker/stack/AGENTS.md | 110 | Minor | doc-accuracy | New gateway --dev bullet says source changes are 'picked up on restart like the backend', but the doc's only documented restart mechanism (bounce-backend.sh, lines 20/46/50) is hard-coded to trade-imports-animals-backend — there is no scripted or documented way to restart the gateway container | Either document the gateway restart command (or extend bounce-backend.sh to take a service arg / add bounce-gateway.sh) and reference it from the gateway bullet and the 'Pick up edited Java source' rows |  |  |  |
| 9 | docker/stack/backend.compose.yml | 52 | Major | integration | Default AZURE_SERVICE_BUS_CONNECTION_STRING targets servicebus-emulator, but the emulator supports AMQP TCP only (no WebSockets per MS docs) while the gateway's ServiceBusSenderClient hardcodes AmqpTransportType.AMQP_WEB_SOCKETS (AzureServiceBusClientConfig.java), so the out-of-the-box local emulator path cannot connect and sends fail unless the host overrides the connection string | Coordinate with trade-imports-dynamics-gateway to make the AMQP transport configurable (AMQP TCP for the local/emulator profile, WebSockets for CDP) and expose the knob via this environment block; verify a send against the emulator succeeds from the stack |  |  |  |
| 10 | docker/stack/backend.compose.yml | 53 | Minor | dead-config | AZURE_SERVICE_BUS_QUEUE pass-through is read by nothing — the gateway has no reference to this env var anywhere and derives the queue solely from EntityPath in the connection string, so setting it on the host silently does nothing (added per prior item 5's suggested fix, but the var is unused) | Remove the '- AZURE_SERVICE_BUS_QUEUE' line; the target queue is selected via EntityPath in AZURE_SERVICE_BUS_CONNECTION_STRING (or wire the gateway to actually read AZURE_SERVICE_BUS_QUEUE if independent queue config is wanted) |  |  |  |
| 11 | docker/stack/infrastructure.compose.yml | 78 | Major | healthcheck | New servicebus-emulator service has no healthcheck, so dependents can only wait on service_started — trade-imports-dynamics-gateway (backend.compose.yml:41-43) can come up and accept POSTs before the emulator's AMQP endpoint is ready (emulator boots only after mssql turns healthy, ~30s+), giving avoidable 5xx on first sends after stack-up | Add a healthcheck to servicebus-emulator (TCP fallback per the doc, e.g. nc -z localhost 5672, or the emulator's HTTP health endpoint if available) and upgrade the gateway's depends_on to condition: service_healthy |  |  |  |
| 12 | docker/stack/infrastructure.compose.yml | 80 | Minor | image-pinning | servicebus-emulator uses an unpinned :latest tag with no documented trade-off comment, while sibling infra images are pinned (localstack 3.0.2, redis 7.2.3-alpine3.18) — the best-practice doc requires either a pin or a '# tracked: ...' comment so upstream breaking changes don't pull silently | Pin mcr.microsoft.com/azure-messaging/servicebus-emulator to a specific version tag (MS publishes versioned tags), or add a '# tracked-by: EUDPA-XX' comment documenting why :latest is acceptable |  |  |  |
| 13 | scripts/stack/lib/compose.sh | 15 | Minor | stale-doc | ALL_PROFILES gains a sixth profile (servicebus) but the --profile docs were not updated: scripts/stack/lib/flags.sh usage still says 'Valid: database, infrastructure, stubs, backend, frontend. Defaults to all five.' and docker/stack/AGENTS.md line 67 says the same, so users cannot discover --profile servicebus from --help | Add servicebus to the valid-profile list and change 'all five' to 'all six' in both the flags.sh usage() text and the AGENTS.md '--profile semantics' section |  |  |  |
