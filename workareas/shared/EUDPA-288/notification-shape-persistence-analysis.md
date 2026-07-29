# Notification-shape persistence — analysis and recommendation

**Status:** For discussion. Not a decision.
**Audience:** Team, ahead of a design meeting that would land an ADR.
**Author:** Paul (+ Claude in session)
**Date:** 2026-07-29
**Branch under analysis:** `spike/EUDPA-288-model-retrofit` (frontend + backend + tests + workspace).

## Purpose

The branch reshapes the frontend around the obligations-and-fulfilments model developed in prior spikes. Fulfilments are the durable aggregate; notification events flow separately for downstream integration. The **notification shape** — the data structure served by `GET /notifications/{referenceNumber}` and `GET /notifications?…` — persists in parallel as a projection that the frontend writes at the end of each user action (via `putProjection` in `services/persistence/records/real.js`).

The question the team needs to close:

> Do we continue to durably persist the notification shape, or can we remove that persistence and rely on fulfilments (with a mapper on read, if a notification-shape endpoint is ever required)?

This document lays out what was found in the codebase, the trade-offs, and a provisional recommendation.

## What we found in the workspace

Grep across all eight repos + workspace, for callers of the notification-shape GET endpoints (`GET /notifications/{ref}` and `GET /notifications?page&sort&referenceNumber`).

### On `main` (currently deployed)

Two callers, both in the frontend, both user-facing:

- `src/server/home/controller.js:56` — the dashboard listing, via `notificationClient.findAll(_request, traceId, { page, sort, referenceNumber })`.
- `src/server/notification-view/controller.js:19` — the `/notification-view/{ref}` page, via `notificationClient.get(request, referenceNumber, traceId)`.

### On `spike/EUDPA-288-model-retrofit`

**Zero callers.** The equivalent flows read via `/fulfilments`:

- Dashboard at `/` — `features/dashboard/controller.js:134` → `listKnownJourneys` (`engine/journey.js:98-101`) → `records.list({ journeyIds, owner, page, sort })` → `GET /fulfilments?page=&sort=`.
- Journey resume / individual-record read — `records.load({ journeyId })` → `GET /fulfilments/{journeyId}`.

The `/notifications/{journeyId}/...` paths that appear in the branch frontend are either the frontend's own URL routes (wizard pages) or **write** targets on the backend (document uploads, projection PUTs). No GET reads of the notification shape.

### On other repos

- **Admin** — hits `/notifications/reference-numbers`, `/notifications/{ref}/outbox-events`, `/notifications/{ref}/replay`. These are admin-specific sub-resources, not the notification-shape data.
- **Tests** — `notification-api-client.ts` operates entirely against `/fulfilments/{id}/...`. Zero calls to notification-shape GETs.
- **Dynamics gateway** — dead-letter-queue endpoints only.
- **Stubs, reference-data, defra-id-stub** — none.

### On the backend

The notification-shape endpoints still exist on the branch's backend (`NotificationController.java:170` and `:189`). They are defined but nothing in the workspace on this branch calls them.

## Fulfilment read/write model on the branch

Worth naming what the branch actually does, because it affects how the trade-offs land.

**Reads happen on every HTTP request.** The engine's `currentJourney(request, h)` in `engine/journey.js` reads the fulfilment from the backend on each wizard page GET. It memoises within a single request via `request.app[JOURNEY_MEMO]` — that memo is a hapi per-request scratch object, destroyed at the end of the response. **No cross-request cache exists** for the fulfilment: session (yar → Redis) holds `KNOWN_JOURNEYS`, `OPENING_RUN`, `FLOW_ONLY_ANSWERS`, and the owner cache, but not the fulfilment itself.

**Writes happen at state transitions:**

- `records.create` at journey start (`startJourney`).
- `records.replaceFulfilment` on save-and-continue (`replaceJourneyFulfilment`).
- `records.amend` / `records.cancelAmend` / `records.copy` / `records.softDelete` on those transitions.
- `records.finalise` on submit.

**The dashboard listing** is a separate read: `records.list({ journeyIds, owner, page, sort })` filtered to the session's known journey ids.

Implications for the notification-shape decision:

- The branch's read model is already "read the durable store on every page render". There is no session-level cache that a materialised projection would be feeding. So the "materialise to avoid re-reading" argument does not apply here — the fulfilment is re-read anyway.
- Correspondingly, running the mapper at read time to derive a notification-shape response would add trivial in-request compute on top of a read that is already happening. It would not add a new IO round-trip.
- The manual test session confirmed the durable-read path works end-to-end: save-and-continue, resume across browsers, cross-session amend + update all render coherent state. Mongo really is the source of truth for the fulfilment layer; the branch's engine honours it on every render.

## What the team told us

Five load-bearing answers from the design discussion this document is built on:

1. **Dashboard query patterns** — planned to be served by a separate dashboard backend consuming events. Multiple services will integrate via the same event pattern for different journeys.
2. **Non-fulfilment mutators** — none required today. Possible future case: data migrations during system upgrades. Only matters if the notification shape is persisted.
3. **Read:write ratio, mapper cost** — writes happen more often than reads; mapper is in-memory and cheap.
4. **External contract on notification shape** — internal only, and not clear it is needed at all.
5. **Amend / submit-history story** — events emitted at amend/submit; fulfilment snapshots at those points optional if needed later.

## Analysis

### Reads exceed writes framing (answer 3)

Materialising a projection is a *good* trade only when reads exceed writes AND the mapper is expensive. Yours is the opposite on both axes. Persisting the notification shape means paying an extra write per user action to save a cheap in-memory transform per read — pessimising the hot path (write) to help a cold path (read) whose cost is already negligible.

The read/write model section above reinforces this: the fulfilment is already re-read from Mongo on every page render. A mapper running on the response adds trivial in-request compute on top of an IO round-trip that is already happening. There is no "cache the projection to avoid IO" story to tell — the branch has already committed to per-request re-reads.

### Consumer coverage (findings + answer 1)

Nothing on the branch reads the persisted shape. The dashboard is planned to be served by an events-consuming dashboard backend, not by GET queries into the fulfilment backend. Every observed read path (dashboard listing, individual record view) already goes through `/fulfilments/…` on this branch.

The persisted notification shape on this branch is currently a write-only artifact — the `putProjection` code path in `real.js` produces output that no code in the workspace consumes.

### Coupling coverage (answer 2)

No mutation path exists outside the fulfilment flow. The "data migration" hedge is self-neutralising: it is only a concern if the notification shape is persisted separately. Any future migration writing directly to notification shape would be bypassing the fulfilment aggregate — arguably a code smell we would want to avoid regardless.

### Contract coverage (answer 4)

The notification API is internal. No external system reads it (per what we know today). This removes the "external contract" reason for materialising the shape, which is often the load-bearing reason in similar decisions elsewhere.

### Audit coverage (answer 5)

The event stream carries amend / submit history. Fulfilment snapshots at those points are available as an optional extension if point-in-time reconstruction is required. Neither depends on persisting the notification shape.

## Options

### Option 1 — status quo: keep the notification shape persisted

Continue with the current `putProjection`-per-user-action model. Backend persists notification shape + proposed-notification shape as separate collections. Two writes per user action, two collections to reason about.

**When this is right:** if the dashboard's planned events-driven backend proves too slow to build, and we need a materialised read model on the fulfilment backend as a stopgap; or if an external consumer of `/notifications/{ref}` emerges.

**Costs today:** ~100 lines of production code (`putProjection` + retry) + associated tests + backend persistence machinery, producing output no code currently reads.

### Option 2 — drop persistence, keep the API endpoint

Delete the projection writes. Keep `GET /notifications/{referenceNumber}` as a thin backend endpoint that internally does `findFulfilmentByReferenceNumber(ref)` → `notification-mapper` → response. Notification-shape becomes derived-on-read.

**When this is right:** if we expect an external consumer of the notification shape to arrive within a reasonable window and want the API surface preserved; or if the frontend continues to need notification-shape data at some point.

**Costs:** small back-end change (one endpoint's implementation swaps to derive-from-fulfilment); the mapper stays. The projection-write code goes.

### Option 3 — drop the shape as a data model entirely

Delete the projection writes AND the notification-shape endpoints. The 437-line `notification-mapper.js` retires. The frontend consumes fulfilment data directly wherever notification-shape data is currently used.

**When this is right:** if we're confident the notification shape is a legacy affordance rather than a design element with a future purpose. Given no current reader and no known future consumer, this is the shape most consistent with the branch's "rewrite in terms of obligations and fulfilments" narrative.

**Costs:** any frontend view still consuming notification-shape needs a small adapter (or its template swap to fulfilment shape). No such view is known to exist on this branch, but a scoped check is worth doing before commitment.

## Recommendation

**Option 3 — drop the notification shape as a data model, subject to a code check.**

Reasoning:

- Write:read ratio + cheap mapper make materialised projection a poor trade.
- No current reader in the workspace (confirmed by grep across 8 repos).
- Dashboard's planned architecture removes the anticipated primary consumer.
- No external contract to preserve.
- Audit / history is covered by events.
- Consistent with the branch's model narrative — the persisted notification shape reads as an artefact of main's world, not the new one.

**Fallback if Option 3 turns out to be premature:**

If the code check surfaces a frontend view that would need real work to unwind from notification shape, drop to Option 2 (keep the endpoint, derive on read). That still deletes the projection-write code (the load-bearing simplification) and buys optionality without commitment.

**Not recommended:** Option 1 (status quo). No reason to continue paying the projection-write cost given zero current readers and no active external consumer.

## What the team should discuss

1. **Does anyone know of a consumer of the notification shape we haven't found?** External systems, planned integrations, data-science / analytics, admin tooling not yet built.
2. **Is the notification shape a design element the team wants to preserve for future flexibility, or a legacy shape to be retired?** Answer changes the choice between Options 2 and 3.
3. **Are there any user-facing views on this branch that currently render from notification-shape data structures?** If yes, a small adapter is needed for Option 3; the code check finds them.
4. **Is there a scenario in which the events-consuming dashboard backend would need a fallback path via GET into the fulfilment backend?** If yes, Option 2 preserves that path cheaply.
5. **Migration path from main.** How do we handle the transition when main is retired? Any notifications-shape data in production Mongo becomes read-only history at that point; the fulfilment-model deployment doesn't consume it. Do we preserve, migrate, or drop it?

## Related documents

- Branch's persistence design doc: `repos/trade-imports-animals-frontend/src/server/live-animals/docs/persistence.md`.
- Fulfilments read/write shape (branch): `repos/trade-imports-animals-frontend/src/server/live-animals/services/persistence/records/real.js`.
- Notification-mapper (branch): `repos/trade-imports-animals-frontend/src/server/live-animals/services/persistence/records/notification-mapper.js`.
- Main's notification client (for contrast): `repos/trade-imports-animals-frontend/src/server/common/clients/notification-client.js` (on `main`).

## Session context

This analysis emerged during a manual-test session on the branch. It was produced by working through the concrete callers of the notification GETs across the workspace + a design conversation covering the five open questions listed under "What the team told us". It is not an ADR: the team should discuss, decide, and produce the ADR from the decision.
