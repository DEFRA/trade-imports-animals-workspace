# EUDPA-312 — Step 4: Scoring the surviving flavours

**Date:** 2026-08-06
**Criteria source:** `step-3-scoring-criteria.md`
**Flavours source:** `step-3.5-flavour-enumeration.md`

Scoring: **1a** (dual-write + reconciliation), **2a** (folded aggregate), **2b** (two collections + service-layer transaction). 1b conditional on EUDPA-314 Posture B (not scored here — will be added if that posture lands).

---

## Criterion 1 — Transactional guarantees

*How atomic is a save? What happens on partial failure? Do retries converge?*

### 1a — Dual-write + reconciliation
Two independent HTTP writes with no shared transaction boundary. Partial failure leaves the aggregates diverged (notification saved, fulfilment not — or vice versa). Both endpoints are idempotent from the code side, so a client retry converges for the common case. The reconciler compensates for cases the client retry doesn't reach, bounded by its cadence. **The divergence window is non-zero and observable.**

Outbox consideration: notification-side outbox fires on save. If the notification side succeeds and the fulfilment side fails, downstream consumers see a `NOTIFICATION_SUBMITTED` (etc.) event for a state that isn't fully persisted; the fulfilment side eventually catches up.

Posture-independence: EUDPA-314's outcome doesn't move this score — Posture A cleans up retry semantics and concurrent-edit LWW, but doesn't make a single save atomic. The reconciler is still required.

Score: **eventual consistency with a bounded divergence window.**

### 2a — Folded aggregate
Single Mongo document write. Atomic by definition. Partial failure impossible at the persistence layer. Outbox event and state transition land in one transaction (same pattern as `writeWithOutbox` today, just on the merged aggregate).

Score: **strong. No divergence window.**

### 2b — Two collections + service-layer transaction
Two document writes wrapped in one `@Transactional` boundary via the existing `MongoTransactionManager` bean (`MongoConfig.java:91-92`). Both writes commit atomically or neither does. Outbox event appended in the same transaction — pattern already in production use in `writeWithOutbox`. Transient transaction errors handled by Spring's transaction template.

Score: **strong. No divergence window.**

**Winner:** 2a = 2b > 1a.

---

## Criterion 2 — Layering / ownership

*Does the backend own a concern that properly belongs to the frontend?*

All three flavours preserve the load-bearing layering rule: the backend never learns the obligation model. The frontend maps obligations to notification-shape (via `fulfilmentToNotification`) and sends notification-shape fields to the backend as opaque top-level attributes. The differences are more about ownership clarity than layering breach.

### 1a — Dual-write + reconciliation
Backend has two aggregates (`Notification` and `NotificationFulfilments`) plus a reconciler component whose only reason to exist is to compensate for the frontend-choreographed dual-write. **The reconciler is a "backend service that exists to prop up a frontend design choice"** — a mild ownership smell. Two data models for backend readers to reason about.

### 2a — Folded aggregate
One aggregate on the backend, storing notification-shape fields as opaque top-level attributes alongside the opaque fulfilment payload. Cleanest possible mental model for backend readers, admins, and downstream event consumers. Only caveat: admin surfaces that currently query `Notification` separately need repointing (small dev cost, not layering).

### 2b — Two collections + service-layer transaction
Two aggregates retained on the backend, but their write coordination is entirely internal to a single backend service method. From the frontend perspective it looks the same as 2a (one merged endpoint, combined payload). The two concepts stay separately queryable and mentally distinct on the backend — good for admin surfaces and downstream systems that only care about one side.

**Winner:** 2a > 2b > 1a — but the margin between 2a and 2b is small (personal preference for "one thing" vs "two things kept clean"). 1a is meaningfully behind because of the reconciler-as-compensation smell.

---

## Criterion 3 — Round-trips per save / lifecycle transition

*How many HTTP calls per operation from the frontend? What's the failure surface?*

Current baseline (dual-write): 2 round-trips per save, 2 per lifecycle transition. Parallelised via `Promise.all` in `mutate.js` and `transition.js` — latency dominated by the slower call, but any single-call failure fails the whole operation. **Failure surface is 2× a single call.**

### 1a — Dual-write + reconciliation
Unchanged from today: 2 round-trips per save, 2 per lifecycle transition. Failure surface is 2×. The reconciler doesn't reduce round-trips; it compensates when things go wrong.

### 2a — Folded aggregate
1 round-trip per save, 1 per lifecycle transition. Failure surface halved.

### 2b — Two collections + service-layer transaction
1 round-trip per save, 1 per lifecycle transition (same as 2a — merged endpoint takes combined payload). Failure surface halved.

**Winner:** 2a = 2b > 1a.

---

## Criterion 4 — Operational cost

*What new infrastructure, on-call surface, or observability burden does each add?*

### 1a — Dual-write + reconciliation
Adds a reconciler component to the backend. New concerns: scheduling (or on-startup sweep), error handling, alerting on repair events, divergence metrics, tuning cadence. **A new failure mode to diagnose** — "why is the reconciler silently doing nothing / silently repairing more than expected?". Ongoing operational load.

No data migration required (dual-write is the status quo).

### 2a — Folded aggregate
No new components. **No data migration cost** (updated 2026-08-06 — user confirmed: no live data, no test data worth keeping; drop existing dual-collection state at release). Retention and indexing become simpler (one collection instead of two). Small backend dev cost: admin's `/notifications/reference-numbers` endpoint would need repointing to the merged collection; outbox-events and replay endpoints are unaffected (outbox is a separate collection).

### 2b — Two collections + service-layer transaction
No new components. No data migration required — collections stay in place. Retention and indexing unchanged. Small backend dev cost for the new merged endpoint; admin endpoints unaffected. Uses existing `@Transactional` machinery (`MongoTransactionManager` already configured, multi-collection transactions already in production use via `writeWithOutbox`).

**Winner:** 2a = 2b > 1a. With the migration cost dropped, 2a and 2b tie on operational cost — both add zero components, both need only minor dev work (2a repoints one admin endpoint; 2b adds one new merged endpoint). 1a is meaningfully behind because of the reconciler's ongoing operational burden.

---

## Summary matrix

|| Criterion || 1a — Reconcile || 2a — Folded || 2b — Split + txn ||
| Transactional guarantees | Eventual consistency (divergence window) | Strong (single doc) | Strong (single txn) |
| Layering / ownership | Reconciler as compensation (mild smell) | Cleanest (one aggregate) | Clean (two aggregates, domain-separated) |
| Round-trips / failure surface | 2 (as today) | 1 (halved) | 1 (halved) |
| Operational cost | New reconciler component (ongoing) | No new component, no migration cost | No new component, no migration required |

## Observations

**Option 2 dominates option 1 on three of four criteria.** Option 1's only real defence would be "we already have the dual-write in place, so this is the smaller change" — but even that's undermined by the fact that adding a reconciler is a non-trivial change with ongoing operational cost. The atomicity, round-trip, and layering wins for option 2 are all real and load-bearing.

**Within option 2, 2a is the pick** (revised 2026-08-06 following the "drop existing data" clarification):
- Same strong-atomicity and single-round-trip benefits as 2b.
- Cleaner layering — one aggregate is a smaller mental model than two.
- **No transaction machinery needed** — a single Mongo document write is naturally atomic. 2b's `@Transactional` is proven and cheap but non-zero code.
- **Aligns with the notification-shape analysis's provisional direction** ([`workareas/shared/EUDPA-288/notification-shape-persistence-analysis.md`|../EUDPA-288/notification-shape-persistence-analysis.md]) — that spike provisionally recommends dropping the notification-shape as a data model entirely. If it lands, 2a is halfway there already; 2b preserves a distinction that's on borrowed time.
- Only concrete 2b advantage remaining is "admin endpoints unaffected" — but only `/notifications/reference-numbers` needs repointing under 2a; outbox and replay endpoints are unaffected either way.

Earlier version of this document (superseded 2026-08-06) recommended 2b on the strength of a "no migration event" tie-breaker; that tie-breaker no longer applies now migration cost is confirmed to be zero either way.

**Recommendation preview** (to be finalised in step 6):
- **Reject option 1** — dominated on atomicity, round-trips, and operational cost. Layering-wise, the reconciler is an ownership smell.
- **Recommend option 2, sub-flavour 2a** — single aggregate, naturally atomic, cleanest mental model, aligned with the notification-shape analysis direction. 2b remains defensible but no longer preferred.

**EUDPA-314 dependency handling:**
None of the four criteria change ranking between Posture A and Posture B. Posture A tightens retry semantics and adds concurrent-edit safety across all three flavours equally; Posture B leaves them as-is. The recommendation is stable across postures.

## Open items before step 6

- If EUDPA-314 lands on Posture B, add 1b to the score sheet — but the ranking above suggests 1b would score even lower than 1a on transactional guarantees (no reconciliation, so divergence is unbounded not just windowed) while matching on the others. Very unlikely to change the recommendation.
- Consider whether a small PoC for 2a's merged endpoint (a vertical slice showing the frontend can hit one endpoint per save with the same functional coverage) would strengthen the recommendation, or whether the paper analysis is sufficient. My leaning is *sufficient* — the write shape is a straightforward reshape of what's already in place, so the PoC would be low-information.
