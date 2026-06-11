# Code Review: EUDPA-203

**Ticket:** Create GatewayService POST endpoint to send content to Azure Service Bus
**Reviewer:** Claude Code Agent
**Date:** 2026-06-11
**Last Updated:** 2026-06-11 (refresh)
**Verdict:** NEEDS MORE WORK

## Summary

First slice of the ADR-EUDP-001 centralised gateway. The refresh shows excellent responsiveness — 32 of 33 first-pass items resolved (31 author-marked Fix/Done on the handoff branch, 1 Auto-Resolved; all independently verified): every test-fidelity Major, all dependency/pinning Minors, plus a new workspace-stack emulator tier that resolves the original consistency finding. But two of those fixes introduced new Criticals: the `AMQP_WEB_SOCKETS` transport (the fix for the CDP proxy issue) cannot connect to the AMQP-TCP-only Service Bus emulator, so **CI is red on the current gateway commit**, and the new emulator healthcheck probes with `nc` inside a distroless image, permanently blocking the gateway's compose startup.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------|---------------|---------|--------|
| trade-imports-animals-workspace | #6 | f144c4f8e1555b49dba53067d3f0bb0cdb5048e1 | 11 | NEEDS ATTENTION | [review.trade-imports-animals-workspace.md](review.trade-imports-animals-workspace.md) |
| trade-imports-dynamics-gateway | #2 | 4c1e7455fc98eb387cc277a66ad3874a2b8a3fc3 | 19 | RISKY | [review.trade-imports-dynamics-gateway.md](review.trade-imports-dynamics-gateway.md) |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| 1 | New `trade-imports-dynamics-gateway` repo/service exists and deploys on CDP | ✅ (repo) | Repo + CDP scaffold + CI present; deployment verified outside this review |
| 2 | POST endpoint accepts JSON, sends content to ASB, returns success | ❌ (regressed) | The proxy fix (`AMQP_WEB_SOCKETS`, gateway item 30) breaks the emulator path — `EventsSendControllerIT` times out and CI is red on 4c1e745. Transport must be configurable: WebSockets for CDP, plain AMQP for emulator/local |
| 3 | JSON-only; non-JSON/malformed rejected with 4xx, not sent to ASB | ✅ | Now fully pinned: `verifyNoInteractions` in unit slice + queue-empty assertions in the ITs (prior items 14/21 fixed) |
| 4 | Authenticates via SAS send-only connection string from configuration | ✅ | Connection-string-only config with `EntityPath` carrying the queue; `toString()` now redacts the SAS key (pinning test outstanding, item 31) |
| 5 | Namespace/queue/credentials env-configurable, no TST values hard-coded | ✅ | Single `AZURE_SERVICE_BUS_CONNECTION_STRING` env var, empty default + `@NotBlank` fail-fast; workspace stack now passes it through |
| 6 | ASB send failure → error response + logged (no silent loss) | ✅ | Unchanged; catch-all 500 handler added too (untested — items 32/34) |

## Test Coverage Assessment

- **Unit Tests:** Strong after refresh — content-fidelity captors and never-sent guards landed. Remaining gap: the new catch-all `handleException` 500 path is untested (gateway items 32/34).
- **Integration Tests:** Structurally strong (real emulator, queue-empty negative assertions, RECEIVE_AND_DELETE isolation) but **failing in CI** on the current commit due to the WebSockets/emulator transport mismatch (gateway item 30, independently verified via run 27358009070).

## Configuration & Environment

- **Environment Variables:** `AZURE_SERVICE_BUS_CONNECTION_STRING` (now the single ASB knob; queue rides in `EntityPath`). The workspace stack's `AZURE_SERVICE_BUS_QUEUE` pass-through is dead config (workspace item 10). A transport-type knob will be needed to resolve item 30.
- **Database Changes:** None for the gateway; MSSQL added in both compose stacks purely as the emulator's backing store.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | High |
| Code Quality | Low |
| Security | Low |
| Test Coverage | Medium |

## Conclusion

The first-pass feedback was addressed thoroughly (32/33 items verified fixed), but the two headline fixes — WebSockets transport and emulator healthcheck — each break the local/emulator path while solving their original problem, leaving CI red and compose unable to start the gateway. Both Criticals plus the untested 500 handler need rework before merge; 15 items remain open (2 Critical, 5 Major, 8 Minor) across the two `review.{repo}.md` files.
