# Persistence of obligation fulfilments — analysis and recommendation

**Status:** For team discussion, ahead of a design meeting that would land an ADR.
**Audience:** Team.
**Author:** Paul (+ Claude in session).
**Date:** 2026-08-06.
**Branch context:** frontend + tests on `spike/EUDPA-288-model-retrofit`; backend on `main` (which now includes the merged `NotificationFulfilments` module).
**Ticket:** EUDPA-312.

## Purpose

EUDPA-288 introduced the `NotificationFulfilments` aggregate as the canonical page-owned-spine store for the option-e journey. On merge of that spike the team agreed to leave the notification API untouched from `main` and stripped the fulfilment → notification cascade; the frontend now dual-writes to `/notification-fulfilments` and `/notifications` at every save point. The dual-write pattern was accepted as a spike-scope pragmatism, not a long-term architecture.

The question this document closes:

> Where should obligation fulfilments live, and how does a user save reach persistence?

## Context

### Why we are here — the current shape

The dual-write pattern is a load-bearing consequence of the 2026-08-03 rollback decision, not a mistake. On that date the team decided to leave the notification API untouched from `main`, which required:

1. Removing the `PUT /notifications/{ref}` projection endpoint (previously added on the branch).
2. Removing the fulfilment → notification cascade in `FulfilmentService`.
3. The frontend then had to dual-write to keep both aggregates in step.

EUDPA-312 is the *next decision*, not a reversal of that one.

### Scope carved off to EUDPA-314

During analysis, two concerns emerged that are largely orthogonal to where fulfilments live: concurrent-edit safety (the LWW / `@Version` question) and the shape of idempotency guarantees across mutating operations. Those are now scoped into EUDPA-314. This recommendation assumes EUDPA-314 will be resolved separately; the recommendation here is stable across both EUDPA-314 postures.

### Options ruled out before analysis

**Option 3 — Frontend-owned persistence.** Ruled out on 2026-08-06 by CDP platform constraints: CDP does not provision Mongo for frontend services, and CDP frontend redis caching is ephemeral (cannot rehydrate journeys over any significant period). Sources: [CDP caching FAQ|https://portal.cdp-int.defra.cloud/documentation/faq/caching-and-redis.md#when-should-i-use-redis-on-cdp] and [CDP non-relational databases FAQ|https://portal.cdp-int.defra.cloud/documentation/faq/non-relational-databases.md#how-are-mongo-databases-provisioned-per-service-on-cdp]. Both flavours (frontend-owned Mongo, frontend-owned redis) are non-viable.

That leaves two options: keep the dual-write (with mitigation) or move to a single backend write.

## Criteria

Four criteria were fixed before scoring, to avoid drafting criteria that flatter a preferred answer. Blast radius (files touched, migration cost) and reversibility (cost to undo) were considered and dropped — the service is pre-live, so both should not drive a long-term architecture decision.

1. **Transactional guarantees** — atomicity per save, behaviour on partial failure, whether retries converge, whether outbox events reflect real state transitions.
2. **Layering / ownership** — does the backend own a concern that properly belongs to the frontend?
3. **Round-trips per save / lifecycle transition** — HTTP round-trip count and failure surface.
4. **Operational cost** — new components, new failure modes, on-call surface.

## Options and flavours

### Option 1 — Keep the dual-write, add mitigation

**Load-bearing constraint that binds the flavours:** the frontend does the mapping in every viable shape — the `fulfilmentToNotification` mapper stays where it is; the backend never learns the obligation model. This is inherited from EUDPA-288 and is not up for renegotiation.

- **1a — Dual-write + explicit reconciliation.** Background job detects and repairs divergence between the two collections.
- **1b — Dual-write + no reconciliation.** Only coherent if EUDPA-314 lands on Posture B (don't invest in retry safety anywhere). Not scored unless that happens.

### Option 2 — Single backend write

The frontend continues to compute notification-shape data from the obligation-fulfilment via the existing mapper and sends it to the backend. The options differ in API shape and backend storage layout — not in who does the mapping.

- **2a — Folded aggregate.** Frontend sends one combined payload (notification-shape fields + opaque fulfilment blob) to one endpoint per operation; backend stores it as a single document in a single collection.
- **2b — Two collections + service-layer transaction.** Same combined payload from the frontend, but the backend stores the two parts in two collections wrapped in one `@Transactional` boundary via the existing `MongoTransactionManager`.
- **2c — Cascade via event listener.** Dropped: under the layering constraint, degenerates to "2b done async with a muddier API" — dominated by 2b on both atomicity and layering.
- **2d — Reverse source-of-truth (notification canonical, fulfilment as projection).** Dropped: reverses EUDPA-288's decision; out of scope.

## Analysis

Scoring reference: [`step-4-scoring.md`|./step-4-scoring.md] carries the per-criterion detail.

|| Criterion || 1a — Reconcile || 2a — Folded || 2b — Split + txn ||
| Transactional guarantees | Eventual consistency (divergence window) | Strong (single doc) | Strong (single txn) |
| Layering / ownership | Reconciler as compensation (mild smell) | Cleanest (one aggregate) | Clean (two aggregates, domain-separated) |
| Round-trips / failure surface | 2 (as today) | 1 (halved) | 1 (halved) |
| Operational cost | New reconciler component (ongoing) | No new component, no migration cost | No new component, no migration required |

**Option 2 dominates option 1 on three of four criteria** — atomicity, round-trips, operational cost. Option 1's only defence would be "we already have the dual-write", but even that's undermined by the fact that adding a reconciler is non-trivial ongoing work.

**Within option 2, 2a is preferred:**
- Same strong-atomicity and single-round-trip benefits as 2b.
- Cleaner layering — one aggregate is a smaller mental model than two.
- No transaction machinery needed — a single Mongo document write is naturally atomic. 2b's `@Transactional` is proven and cheap but non-zero code.
- Aligns with the [notification-shape persistence analysis|https://github.com/DEFRA/trade-imports-animals-workspace/blob/spike/EUDPA-288-model-retrofit/workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md]'s provisional direction (drop the notification-shape as a data model entirely). If that lands, 2a is halfway there already; 2b preserves a distinction that's on borrowed time.
- 2b's remaining advantage is "admin endpoints unaffected" — but only `/notifications/reference-numbers` needs repointing under 2a; outbox and replay endpoints are unaffected either way.

## Recommendation

**Option 2, sub-flavour 2a — folded aggregate.**

The frontend sends a single combined payload (notification-shape fields + opaque fulfilment blob) to a single merged endpoint per operation. The backend stores it as one document in the `notification_fulfilments` collection (or a suitably-renamed replacement). The `Notification` aggregate collection retires; the notification-shape fields become top-level attributes on the merged document. The backend continues to treat both the notification-shape fields and the fulfilment payload as opaque — the layering rule is preserved.

Reasoning:
- Strong single-save atomicity by construction; no divergence window, no reconciler needed.
- Halves the round-trip count and failure surface for every save and every lifecycle transition.
- Cleanest layering: one aggregate on the backend, mapper stays frontend-side.
- No new components, no data migration cost (existing data is expendable).
- Consistent with the notification-shape analysis's direction, so we don't paint ourselves into a corner if that decision lands the same way.
- Uses only mechanisms already in production use — writes go through the existing aggregate save + outbox pattern.

**Fallback if 2a turns out to be premature.** If we later discover that preserving the `Notification` aggregate as a separately-queryable thing matters for reasons we don't currently anticipate (e.g. a new admin surface, a downstream consumer that queries the aggregate directly rather than the outbox stream), fall back to 2b. The transition from 2a to 2b is straightforward — split the merged document into two collections and add the `@Transactional` boundary; the API and frontend shape don't change.

**Not recommended:** option 1. The reconciler is a backend component that exists to compensate for a frontend-choreographed dual-write — an ownership smell. It leaves the divergence window in place, doesn't reduce round-trips, and adds ongoing operational cost.

## Implementation outline for the follow-up ticket

The follow-up implementation ticket will own the detail. Rough shape:

- **Backend:** design and implement the merged aggregate (a renamed / restructured `NotificationFulfilments` document carrying top-level notification-shape fields alongside the opaque fulfilment payload). Add merged endpoints for save + each lifecycle transition. Repoint `writeWithOutbox` to fire from the merged aggregate. Repoint `/notifications/reference-numbers` (admin) to the merged collection. Deprecate the legacy `/notifications` write endpoints (kept read-only or removed depending on notification-shape analysis's outcome).
- **Frontend:** collapse the two-endpoint dual-write in `lifecycle/{create,mutate,transition}.js` to single-endpoint calls with combined payloads. The `fulfilmentToNotification` mapper output becomes part of the combined payload rather than the body of a separate POST. Remove the `put-projection.js` retry helper (no longer needed under single-endpoint saves).
- **Tests:** update E2E coverage for the merged endpoint and the collapsed save flow. Prune tests that specifically assert dual-write behaviour.
- **Data:** existing dual-collection data is expendable — drop at release. No migration required.
- **Sequencing:** implementation is unlikely to conflict with EUDPA-314; safe to run in parallel. If EUDPA-314 lands first with Posture A (invest in `@Version`), incorporate the version field into the merged aggregate design; if Posture B, don't.

## Interaction with adjacent decisions

- **EUDPA-314 (versioning + idempotency).** Ranking is stable across both postures. If Posture A lands, add `@Version` to the merged aggregate as part of the implementation; if Posture B, skip it. Copy's idempotency-key mechanism is preserved either way (it's create-shaped, not on the mutating path).
- **[Notification-shape persistence|https://github.com/DEFRA/trade-imports-animals-workspace/blob/spike/EUDPA-288-model-retrofit/workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md] (2026-07-29 analysis).** Provisionally recommends dropping the notification-shape as a data model entirely. 2a is compatible with either outcome — if the notification-shape is dropped, the merged aggregate simply doesn't carry notification-shape read endpoints; if it's kept, the merged aggregate serves them from its own fields.

## Follow-up artefacts

- **EUDPA-314** (Analyse versioning and idempotency for notification aggregates) — already raised (2026-08-05). Spun out of this spike; interaction described above.
- **Primary implementation follow-up ticket** — to be raised once this recommendation is accepted. Should carry the implementation outline above as its starting scope, and be parented under EUDPA-79.
- **No PoC branches raised.** The paper analysis is sufficient — the write shape is a straightforward reshape of what's already in place, and no mechanism new to the codebase is introduced.

## What the team should discuss

1. **Is 2a the right pick, or does the aggregate-separation argument for 2b matter more than the scoring suggests?** In particular, are there admin surfaces or downstream consumers that would benefit from the two-aggregate model that we haven't accounted for?
2. **Do we retire the `Notification` aggregate and its API entirely, or keep the read side alive as a thin projection from the merged aggregate?** Depends on the notification-shape analysis decision; may be worth closing both together.
3. **Should the follow-up implementation ticket wait on EUDPA-314, or start in parallel?** No hard dependency, but the merged aggregate design is cleaner if we know whether it carries `@Version` from the start.
4. **Migration sequencing.** With existing data dropped, is there any user-facing implication (e.g. tester journeys mid-flight, deployed environments with fixtures) that needs a communication plan before the release?

## Related documents

- Ticket: EUDPA-312.
- Step artefacts (this session):
  - [`step-1-ingest.md`|./step-1-ingest.md] — ingested source material and prior decisions.
  - [`step-3-scoring-criteria.md`|./step-3-scoring-criteria.md] — fixed the criteria used above.
  - [`step-3.5-flavour-enumeration.md`|./step-3.5-flavour-enumeration.md] — enumerated and pruned the option-2 flavours.
  - [`step-4-scoring.md`|./step-4-scoring.md] — per-criterion scoring detail.
- Adjacent analysis: [`notification-shape-persistence-analysis.md`|https://github.com/DEFRA/trade-imports-animals-workspace/blob/spike/EUDPA-288-model-retrofit/workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md] (2026-07-29, on `spike/EUDPA-288-model-retrofit`).
- Prior draft that seeded this spike (untracked working area): `workareas/ticket-creation/eudpa-followup-fulfilment-persistence/draft.md` — content has since been superseded by EUDPA-312 itself and by this recommendation.
