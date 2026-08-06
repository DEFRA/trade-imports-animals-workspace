# EUDPA-312 — Step 3: Scoring criteria

**Date:** 2026-08-06
**Purpose:** Fix the criteria against which the two remaining options are scored in step 4. Fixing them here (not during scoring) avoids the temptation to draft criteria that flatter a preferred answer.

## Criteria

### 1. Transactional guarantees

How atomic is a save? What happens on partial failure? Does a client-side retry converge on a consistent state, and under what assumptions?

Scoring should cover:
- Whether the notification and fulfilment writes for a single user action land as one transaction or as two independent operations.
- Behaviour on partial failure — which side succeeds, what state the aggregates end up in, whether a user can resume from a diverged state.
- Whether retries (user F5, browser auto-retry) converge on the intended state.
- Whether outbox events emitted downstream reflect real state transitions exactly once.

Not to be confused with EUDPA-314's concurrent-edit safety concern. EUDPA-312 is about *a single save's atomicity*; EUDPA-314 is about *two concurrent editors racing*. Both matter, but keep them scored under the right tickets.

### 2. Layering / ownership

Does the backend own a concern that properly belongs to the frontend?

Scoring should cover:
- Where the obligation model lives — in whose codebase does the shape of "what fields does this journey have" get defined and evolved?
- Whether the backend has data structures whose only reason to exist is to support the frontend journey.
- Whether making a frontend-only change (e.g. adding a page to the journey) requires a backend change.
- Whether the split-of-concerns is one a fresh engineer joining the team would find surprising.

### 3. Round-trips per save / lifecycle transition

How many HTTP calls does a save or a lifecycle transition require from the frontend?

Scoring should cover:
- Number of HTTP round-trips per `saveOriginOfImport`-equivalent save.
- Number of HTTP round-trips per lifecycle transition (`submit`, `amend`, `cancelAmend`, `softDelete`).
- Whether calls are parallelised via `Promise.all` (halving effective latency but doubling failure surface) or serialised (safer, slower).
- The failure-surface implication — if we have N calls, an intermittent-failure rate of `p` per call gives an overall save failure rate of ~`Np`.

### 4. Operational cost

What new infrastructure, on-call surface, or observability burden does each option add?

Note: this criterion is unlikely to strongly discriminate between option 1 and option 2 overall (both use the existing backend Mongo, neither adds new infrastructure). Kept in the list because it *does* discriminate between option-2 sub-flavours — sub-flavour (a) collapses to a single aggregate and is operationally simpler than sub-flavour (c) which adds an event-listener component with its own reliability and monitoring surface.

Scoring should cover:
- Any new component introduced (background job, event listener, additional collection, additional index).
- Any change to backup / disaster-recovery scope.
- Any change to on-call burden — new failure modes to diagnose, new dashboards to watch.

## Criteria explicitly dropped from the earlier proposal

- **Blast radius** (files touched, migration required, test coverage displaced) — dropped 2026-08-06. Pre-live service; migration cost is low; small-vs-large edit size shouldn't drive the recommendation.
- **Reversibility** (cost to undo if the choice turns out wrong) — dropped 2026-08-06. Pre-live service; everything is reversible before go-live.

## Conditional scoring — dependency on EUDPA-314

Option 1's shape genuinely changes with EUDPA-314's posture recommendation. If step 4 is done before EUDPA-314 has a recommendation, option 1 should be scored twice:

- **Option 1a — under EUDPA-314 Posture A (invest in retry safety via `@Version`).** Adds `@Version` on both aggregates + optional state-guard mirror on the fulfilment side. Transactional-guarantees score materially better; other criteria mostly unchanged.
- **Option 1b — under EUDPA-314 Posture B (don't invest).** Accepts current atomicity gap; recommendation would say "the option 1 shape is only defensible if we also decide not to invest in retry safety anywhere".

If EUDPA-314 resolves first, score option 1 only under the recommended posture.
