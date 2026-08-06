# EUDPA-312 — Step 3.5: Flavour enumeration

**Date:** 2026-08-06
**Purpose:** Enumerate all viable implementable shapes under options 1 and 2 before scoring. Prune obviously-dominated flavours here; step 4 scores only the survivors. Scored against the criteria fixed in `step-3-scoring-criteria.md`.

## How to read the flavours

Each entry describes a specific implementable shape — what the code looks like end-to-end — with enough detail that step 4 can score it against the four criteria (transactional guarantees, layering/ownership, round-trips, operational cost) without further elaboration. Where a flavour depends on EUDPA-314's outcome, that is called out explicitly.

Flavour labels: `1a`, `1b` for keep-and-mitigate; `2a`–`2d` for single-backend-write. Numbering is not a preference ranking.

---

## Option 1 — Keep dual-write

The frontend continues to write to both `/notifications` and `/notification-fulfilments`. The choice within option 1 is what atomicity mitigation (if any) is added on top.

### 1a — Dual-write + explicit reconciliation

A background job scans for notifications whose fulfilment state has diverged (e.g. fulfilment has been submitted but notification hasn't, or vice versa) and repairs the divergence.

- **Frontend:** unchanged from today's dual-write pattern.
- **Backend:** new reconciliation job (scheduled task or on-startup sweep). Reads both collections, applies a defined convergence rule ("if fulfilment is SUBMITTED, notification must also be SUBMITTED", etc.), fires missing outbox events for repaired transitions.
- **Divergence window:** bounded by the reconciler's cadence.
- **Compatible with either EUDPA-314 posture:** with Posture A (`@Version`), reconciliation is smaller because retries converge cleanly; with Posture B, reconciliation carries more weight.

### 1b — Dual-write + no reconciliation

Accept transient (or permanent) divergence as a known behaviour. Rely on client retry to converge for the common cases and on support intervention for the corner cases.

- **Frontend:** unchanged.
- **Backend:** unchanged from today.
- **Support burden:** any diverged notification needs manual repair via admin tooling (some already exists — outbox replay, reference-number lookup).
- **Only coherent under EUDPA-314 Posture B.** If Posture A lands, adding `@Version` while explicitly refusing to reconcile is an odd stance.

### Considered and folded into 1a

- **Compensating writes** (on failure of one side, actively undo the other) — a sub-flavour of 1a; the reconciler's convergence rule can include compensating actions.
- **Saga pattern** — heavier version of compensating writes; not called out as a top-level flavour because the current dual-write is too simple to warrant orchestration machinery.

---

## Option 2 — Single backend write

A user save results in one backend write, from the frontend's perspective. Sub-flavours differ in *API shape* and *backend storage layout*.

*Load-bearing constraint that binds all option-2 flavours*
The backend deliberately does not know the obligation model — this is a layering rule inherited from EUDPA-288. Two reasons:
* The obligation model is a frontend concern.
* Coupling the obligation model to the backend would tie frontend and backend releases: a change to the obligation model (a new field, a renamed obligation) would become a breaking backend change.

Consequence: **in every option-2 flavour, the frontend continues to compute notification-shape data from the obligation-fulfilment** via the existing `fulfilmentToNotification` mapper (see `lifecycle/mutate.js` on the branch). The backend cannot derive notification-shape from the opaque fulfilment payload. The options differ in how the mapped notification-shape data reaches the backend and how the backend stores both parts atomically — not in who does the mapping.

### 2a — Folded aggregate (frontend maps; backend stores combined payload)

The two aggregates collapse into one on the backend. The frontend sends a single combined payload (notification-shape fields + opaque fulfilment blob) to a single endpoint; the backend stores it as one document. **Backend gains a field, not an understanding.**

- **Single collection:** a merged aggregate carries both parts (top-level notification-shape fields alongside the opaque fulfilment blob).
- **Single transaction:** one atomic Mongo write per save.
- **Outbox:** one aggregate = one outbox event source; notification-scoped events (`NOTIFICATION_SUBMITTED` etc.) fire from the merged aggregate's lifecycle transitions.
- **API reshape:** one endpoint per operation, taking a combined payload. `NotificationController` collapses or repoints; admin surfaces that read `Notification` need updating.
- **Frontend reshape:** the mapper output no longer travels as a separate POST — it becomes part of the combined payload sent to the merged endpoint.
- **Ref-number generation:** could stay on the notification-shape side of the payload (the frontend continues to trigger a mint via the merged endpoint's first call) or move onto the fulfilment side. Design detail — flag for the recommendation.
- **Layering preserved:** backend sees notification-shape fields as opaque top-level attributes; the fulfilment payload remains opaque. No obligation-model knowledge crosses the boundary.

### 2b — Two collections + service-layer transaction

Both aggregates and both collections survive on the backend. The frontend sends the same combined payload as 2a to a single merged endpoint; the backend service method wraps both saves in one `@Transactional` boundary and stores them in the two existing collections.

- **Two collections:** unchanged from today.
- **Single transaction:** Spring `@Transactional` backed by the existing `MongoTransactionManager` bean (`MongoConfig.java:91-92`). Multi-collection transactions are *already in production use* in this codebase — `submitNotification`, `amendNotification` etc. atomically save the notification aggregate and append the outbox event (two collections). Adding `notification_fulfilments` to the same transaction is business as usual. No new infrastructure.
- **Prerequisite:** Mongo replica set. Satisfied — dev stack uses `rs0` (`docker/stack/scripts/mongodb/10-database-setup.js`); CDP per-service Mongo is replica-set by default.
- **API:** one merged endpoint per operation, taking the same combined payload as 2a. Existing two-endpoint API can be deprecated in favour of the merged one.
- **Frontend:** identical shape to 2a — mapper still runs frontend-side, combined payload sent to one endpoint.
- **Outbox:** notification-side outbox continues to fire; fulfilment side doesn't need its own.
- **Preserves the aggregate separation** — admin surfaces that read `Notification` separately continue to work; retention, indexing, and access patterns can differ per collection.
- **Layering preserved:** same as 2a.

**Consequence — 2a vs 2b is a narrower choice than it first appears.** From the frontend's perspective the two are identical (same combined payload, one endpoint). The choice is purely: *do we preserve the two-collection separation on the backend?* — a question about backend readers (admin, downstream consumers) and separation-of-concerns preference, not about atomicity or performance.

### 2c — Cascade via event listener (revised)

The frontend writes only to the fulfilment endpoint, but includes notification-shape data in the payload. On save, the fulfilment save fires a domain event carrying the notification-shape portion; a listener component consumes the event and writes the notification collection.

- **Two collections:** unchanged from today.
- **Two writes, not atomic:** async via the event bus.
- **Eventual-consistency window:** notification lags fulfilment by however long the event takes to process.
- **Layering compromise:** the fulfilment endpoint's payload carries notification-shape data it doesn't itself use, purely as a courier for the listener. The layering isn't *broken* (backend still doesn't understand obligations) but it becomes muddier — the fulfilment endpoint stops being a pure fulfilment endpoint.
- **New component:** the listener adds a service with its own reliability, monitoring, and retry story. Concern 4 from the follow-up draft.
- **Ordering hazard:** two events for the same notification (e.g. submit then amend) must be processed in order — needs partitioning by aggregate id.
- **Compared to 2b:** this is essentially 2b done async — losing the transaction, gaining an eventual-consistency window, and requiring the fulfilment API to carry data it doesn't use. Independent virtues of the event-listener pattern (isolation, extensibility) largely evaporate because the listener is doing plumbing, not domain work.

### 2d — Reverse source-of-truth (notification canonical, fulfilment as projection)

The write path becomes: frontend writes to `/notifications`; a projector maintains `notification_fulfilments` as a read-side view derived from the notification.

- **Two collections:** unchanged in shape but reversed in role.
- **Materially reverses the EUDPA-288 decision** that the fulfilment aggregate is canonical.
- **Not scored** unless we want to reopen EUDPA-288 — probably out of scope for EUDPA-312.

### Considered and dropped

- **2e — Single backend endpoint, no transaction (backend-side dual-write).** Just moves the current frontend dual-write to the backend without solving atomicity. Dominated by 2b (which adds the transaction) unless multi-document transactions are impossible in our Mongo deployment — should confirm during scoring but not score as its own thing.
- **2f — Change data capture via Mongo change stream.** Same shape as 2c but different trigger mechanism. Sub-flavour of 2c, not a top-level option.

---

## Pruning before step 4

Flavours to score:
- **1a** — always in.
- **2a**, **2b** — always in.

Flavours pruned:
- **1b** — score *only if* EUDPA-314 recommends Posture B, otherwise drop as dominated by 1a.
- **2c** — pruned 2026-08-06. Under the option-2 layering constraint (frontend does the mapping, backend doesn't learn obligations), 2c degenerates into "2b done async with an API layering compromise" — dominated by 2b on transactional guarantees (2b is atomic, 2c is eventual) and on layering (2b keeps the endpoints clean, 2c muddies the fulfilment endpoint). Its putative virtue (event-listener isolation) is hollow because the listener does plumbing, not domain work.
- **2d** — drop as out of scope (reverses EUDPA-288).

That gives step 4 either **3 flavours** (if EUDPA-314 lands on Posture A or hasn't landed yet) or **4 flavours** (if Posture B lands, 1b joins the score sheet).

## Cross-flavour notes for step 4

- **The layering rule is load-bearing.** All option-2 flavours must satisfy "backend does not learn the obligation model". 2a and 2b satisfy it cleanly; 2c satisfies it but muddies the fulfilment API by making it a courier for notification-shape data. This is worth surfacing in the "layering / ownership" scoring axis.
- **Ref-number ordering (concern 3):** in 2a the mint could stay on either side of the combined payload — design detail. 1a, 1b, 2b, 2c preserve the current notification-side mint.
- **Outbox exactly-once:** 1a and 2c both risk duplicate events under adverse conditions (reconciler firing an event that has already fired; listener processing twice) — the recommendation must address this or defer it to EUDPA-314.
- **Read path unchanged for all flavours.** The frontend reads fulfilments via `GET /notification-fulfilments/{id}` today; that stays the same regardless of write shape (except 2d, which is pruned).
- **Migration for 2a:** existing dual-collection data would need consolidating during release. Not blast-radius (dropped criterion) but part of "operational cost" in the strict sense that a data migration is an operational event.
