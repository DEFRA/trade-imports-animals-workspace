# EUDPA-312 — Step 1: Ingest existing material

**Date:** 2026-08-05
**Purpose:** Capture what already exists on disk so steps 3–6 (define criteria, score options, prototype, write recommendation) don't rediscover it.

## Sources ingested

| Source | Date | Bearing on EUDPA-312 |
|---|---|---|
| `workareas/ticket-creation/eudpa-followup-fulfilment-persistence/draft.md` | Post-EUDPA-288 sign-off | Primary input. Enumerates 8 concerns and 3 option families under concern 1. |
| `workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md` | 2026-07-29 | Adjacent decision — whether to keep persisting the notification shape at all. Interacts with option 3 here. |
| Memory: `eudpa-288-persistence-decision.md` | 2026-08-03, 2026-08-04 | Records the rollback decision that created the dual-write shape, and the 2026-08-04 rename to `NotificationFulfilments`. |
| Backend PR https://github.com/DEFRA/trade-imports-animals-backend/pull/70 | Merged | Ships `NotificationFulfilments` module — Controller, Service, Repository, aggregate, DTO, Status. Verified merged on backend `main`. |

## Origin framing (must appear in the recommendation)

The current dual-write is not a mistake — it is a spike-scope pragmatism from the 2026-08-03 rollback decision. On merge of EUDPA-288 the team agreed to leave the notification API untouched from `main`, and stripped:

- the `PUT /notifications/{ref}` projection endpoint (previously added on the branch);
- the fulfilment → notification cascade in `FulfilmentService`.

Dual-write from the frontend is the load-bearing consequence. EUDPA-312 is the next decision, not a reversal of the previous one.

## Concerns from the follow-up draft — scoping into EUDPA-312

Reproduced here so scoring in step 4 can reference them by number.

| # | Concern | In scope for EUDPA-312? | Notes |
|---|---|---|---|
| 1 | Dual-write atomicity | **Yes** | Central. Client-side retry converges (both writes idempotent) but no eventual-consistency guarantee. |
| 2 | Two round-trips per save | **Yes** | Parallelised via `Promise.all` but doubles the failure surface. |
| 3 | Shared-id mint location (reframed from "order-dependent creation") | **Yes** | The two aggregates share a reference number. Ref is `GBN-AG-{YY}-{XXXXXX}`, minted server-side by `ReferenceNumberGenerator` with a caller-side collision loop, currently on the notification side. Sharing the id is load-bearing; ordering is a consequence of *where* the collision-safe mint runs. Constraint on option 2 flavours that invert or eliminate the notification side. |
| 4 | Cascade may be worth reintroducing (as event listener rather than direct service call) | **Yes, as an option-2 sub-flavour** | Explicitly a sub-flavour of "single backend write". |
| 5 | `POST /notification-fulfilments` + copy endpoint unused by frontend post-rollback | **No — known baseline** | Removal was already known-cheap and was part of the pragmatism for merging dual-write. Not a scoring concern. |
| 6 | Lifecycle-transition idempotency gap | **Yes, coupled with option 1** | Today: no JS auto-retry on lifecycle path; only user retries. Impact of a partial-failure user retry is a spurious "already submitted" (state-guarded on notification side) — annoying, not corruptive. Notification-side guard exists for two reasons: state-machine correctness AND exactly-once outbox emission (guard sits above `writeWithOutbox`, ShedLock'd, event+save in one transaction). Fulfilment side has no state guard on lifecycle endpoints today. Existing fulfilment idempotency (UUID from `randomUUID`, stored inline on aggregate via partial unique index, `NotificationFulfilments.java:42-45,79`) is `copy`-only and does not generalise to state-mutating transitions. If option 1 adds JS retry: cheapest closure is a state-guard mirror on the fulfilment side (symmetric with notification, naturally idempotent). An operation-ledger keyed by idempotency id is possible but overkill. Outbox concern on fulfilment side is NOT load-bearing today — no such link exists — but becomes so if an option-2 flavour adds outbox emission there. |
| 7 | Frontend engine-facing `.fulfilment` key rename | **No — out of scope** | Naming concern, tangential to persistence. Mark explicitly to prevent scope creep. |
| 8 | `records.replaceFulfilment` / `records.finalise` naming | **No — out of scope** | As above. Probably one ticket alongside concern 7, but neither belongs in EUDPA-312. |

## Interaction with the notification-shape decision

The notification-shape analysis (2026-07-29) is a separate open decision — whether to keep persisting the notification shape, keep only the endpoint (derive on read), or drop the shape as a data model entirely. Its provisional recommendation is option 3 (drop entirely).

Interaction with EUDPA-312:

- If notification-shape option 3 lands (drop the shape as a data model), the notification API becomes much thinner — arguably the notification "aggregate" becomes just an event emitter for ref number + status transitions. That materially weakens the case for keeping fulfilment persistence on the backend (EUDPA-312 option 2).
- If notification-shape option 1 lands (keep persisted projection), the backend keeps a substantial notification-shape responsibility and it becomes more natural to also keep fulfilments there.
- Recommendation: acknowledge the interaction explicitly in step 4 scoring. Neither spike should silently commit the team to the other's decision.

## Load-bearing constraints and prior code (input for step 4)

- **Existing retry helper** — `repos/trade-imports-animals-frontend/src/server/persistence/records/real/projections/put-projection.js:17-36`. `MAX_PROJECTION_ATTEMPTS` bounded idempotent retry. Direct build-on point for option 1.
- **Redis already wired** — `docker/stack/frontend.compose.yml:14` sets `SESSION_CACHE_ENGINE=redis`; abstraction at `src/server/common/helpers/redis-client.js`. Direct build-on point for option 3 (redis flavour).
- **CDP Mongo per-service** — RESOLVED 2026-08-06 (user confirmed against CDP docs): **option 3 ruled out on platform constraints.** (1) CDP documentation states only backend services can have a Mongo instance — rules out the frontend-owned Mongo flavour. (2) CDP frontend redis caching is ephemeral — can't rely on it for persistence that must rehydrate journeys over any significant period. Both option-3 flavours dead. Sources: the CDP FAQ URLs already linked in EUDPA-312's description ([caching-and-redis|https://portal.cdp-int.defra.cloud/documentation/faq/caching-and-redis.md#when-should-i-use-redis-on-cdp], [non-relational-databases|https://portal.cdp-int.defra.cloud/documentation/faq/non-relational-databases.md#how-are-mongo-databases-provisioned-per-service-on-cdp]).
- **Backend fulfilments module already carries idempotency machinery** — `NotificationFulfilmentsRepository.findByIdempotencyKey` + `MAX_REF_RETRIES=3` collision loop in `NotificationFulfilmentsService`. Option 2 flavours can build on this; option 1 does not need it changed.

## Follow-up ticket check — DONE

Checked 2026-08-05 via `tools/jira/search.sh` for a child of EUDPA-79 matching "fulfilment persistence" / "persisting obligation" / "fulfilment(s)". Only two hits: EUDPA-312 itself and EUDPA-278 (a prior Done spike, unrelated to persistence architecture). The follow-up draft has NOT been raised as a Jira ticket. EUDPA-312 is not a duplicate. Safe to proceed.

## Deltas the ticket description doesn't currently capture

Comment-worthy additions to EUDPA-312 (subject to user approval):

1. Origin framing paragraph — pragmatism from 2026-08-03 rollback, not a bug.
2. Concern 3 — load-bearing ref-number ordering.
3. Concern 5 — unused endpoints post-rollback.
4. Concern 6 — lifecycle idempotency gap.
5. Out-of-scope markers — concerns 4, 7, 8.
6. Related work — link `workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md` and note the interaction.
