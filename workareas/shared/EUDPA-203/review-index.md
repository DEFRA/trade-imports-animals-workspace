# Code Review: EUDPA-203

**Ticket:** Create GatewayService POST endpoint to send content to Azure Service Bus
**Reviewer:** Claude Code Agent
**Date:** 2026-06-11
**Verdict:** CONCERNS

## Summary

First slice of the ADR-EUDP-001 centralised gateway: a new `trade-imports-dynamics-gateway` Spring Boot service with a `POST /events` endpoint forwarding JSON to an ASB queue via a SAS send-only connection string, plus workspace registration of the new repo. Implementation quality is high (fail-fast config, no silent-loss error handling, real-emulator integration tests), but one Major connectivity concern — the default AMQP-over-TCP transport bypasses the CDP egress proxy — likely breaks the send-to-ASB AC in deployed environments, and the AC's forwarding-fidelity and not-sent-on-rejection clauses are untested.

## Repositories Analyzed

| Repository | PR | Merge Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-animals-workspace | #6 | 43093a3b29aaa789e12f56c0f8a8fa90f1c38dc0 | 8 | NEEDS ATTENTION | [review.trade-imports-animals-workspace.md](review.trade-imports-animals-workspace.md) |
| trade-imports-dynamics-gateway | #2 | 37b735b0c8d5913b07e01f8db1257b215092a1b8 | 19 | NEEDS ATTENTION | [review.trade-imports-dynamics-gateway.md](review.trade-imports-dynamics-gateway.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | New `trade-imports-dynamics-gateway` repo/service exists and deploys on CDP | ✅ (repo) | Repo exists with CDP scaffold + CI (`mvn clean verify` on every PR/publish); actual CDP deployment is verified outside this review |
| 2 | POST endpoint accepts JSON, sends content to ASB, returns success | ⚠️ | Implemented and proven against the emulator (202 + receive-and-assert IT), but gateway item 7: default AMQP-over-TCP transport bypasses the CDP egress proxy, so the send likely fails from a deployed environment — needs `AMQP_WEB_SOCKETS` |
| 3 | JSON-only; non-JSON/malformed rejected with 4xx, not sent to ASB | ⚠️ | Behaviour implemented (415 non-JSON, 400 malformed/missing); the "not sent to ASB" clause is untested — no rejection test verifies the sender was never invoked (items 14, 21) |
| 4 | Authenticates via SAS send-only connection string from configuration | ✅ | `ServiceBusClientBuilder.connectionString(...)` from `@Validated @ConfigurationProperties`; auth concern isolated per tech note for later swap |
| 5 | Namespace/queue/credentials env-configurable, no TST values hard-coded | ✅ | `AZURE_SERVICE_BUS_CONNECTION_STRING` / `AZURE_SERVICE_BUS_QUEUE` with empty defaults + `@NotBlank` fail-fast; no secrets in either repo |
| 6 | ASB send failure → error response + logged (no silent loss) | ✅ | `DynamicsGatewayException` → 502 with `log.error(..., ex)`; covered at unit, slice and integration levels |

## Test Coverage Assessment

- **Unit Tests:** Present — controller slice, sender, exception handler. Gaps: no forwarding-fidelity assertion (published body == posted body, items 13/16) and no never-sent verification on rejection paths (item 14).
- **Integration Tests:** Present and strong in shape — real Testcontainers Service Bus emulator end-to-end. Same fidelity/negative-path gaps (items 21/23) plus a PEEK_LOCK message-redelivery isolation hazard (item 22) and unpinned emulator image tags (item 26).

## Configuration & Environment

- **New Environment Variables:** `AZURE_SERVICE_BUS_CONNECTION_STRING`, `AZURE_SERVICE_BUS_QUEUE` (gateway). Not passed through by the workspace stack's gateway block (workspace item 5) — workspace-stack `POST /events` always 502s against the unreachable local-profile placeholder (consistency finding).
- **Database Changes:** None for the gateway itself; local compose adds MSSQL purely as the ASB emulator's backing store.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Medium |
| Code Quality | Low |
| Security | Low |
| Test Coverage | Medium |

## Conclusion

Solid first slice with exemplary configuration hygiene and genuinely end-to-end emulator tests, but merge should wait on the AMQP transport/proxy fix (gateway item 7) — the one finding that breaks the core AC where it matters — and ideally the AC-clause test gaps (items 13/14/16/21). Full todo lists and item details are in each `review.{repo}.md` (6 workspace items, 27 gateway items).
