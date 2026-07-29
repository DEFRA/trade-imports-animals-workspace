# pr-005 scoping — backend ownership + owner-scoped paged list (SCOPED, NOT BUILT)

*Written 2026-07-24 by the promotion orchestrator after pr-002..pr-004 landed. This is
build-ready scoping for the FIRST cross-repo (backend) increment. Read before briefing Codex.*

## Big discovery — the backend lifecycle already largely exists

The `spike/EUDPA-288-model-retrofit` backend is far more built-out than the frontend
increments assumed. `notification/NotificationController.java` already exposes:
`POST /notifications` (origin), `PUT /{ref}`, `POST /{ref}/copy`, `/submit`, `/amend`,
`/cancel-amend`, `GET /{ref}` (findByRef), **`GET /notifications` findAll — PAGED with
`page` + `sort` (arrivalDate,desc default / arrivalDate,asc / createdAt,desc / createdAt,asc)**,
`GET /notifications/reference-numbers` (paged), `/outbox-events`, `/replay`,
**`POST /{ref}/soft-delete`**, `DELETE`. There is already a `User-Id` header
(`HEADER_USER_ID`) used for audit on replay/delete.

`fulfilment/FulfilmentController.java` (canonical): `POST /fulfilments` (create),
`PUT /{id}` (replace), `GET /{id}`, `POST /{id}/submit`, `POST /{id}/amend`. **No list, no
owner.** `Fulfilment` entity = id, fulfilment(List<Document>), status, createdAt, submittedAt —
**no owner field**. `FulfilmentService` create/replace/findById/submit/amend — **no owner
enforcement**; `assertWritable` blocks writes on SUBMITTED.

**Implication:** pr-005..pr-009 are mostly WIRING the frontend to existing backend endpoints
+ adding OWNERSHIP, not building the backend lifecycle from scratch. pr-007 (DRAFT/SUBMITTED/
AMEND/DELETED status) likely already exists on the notification side (copy/cancel-amend/
soft-delete imply a full NotificationStatus). Re-scope pr-006..pr-010 against this reality when
you reach them — check `NotificationStatus.java`, `Notification.java`, `NotificationService.java`
before assuming backend work is needed.

## The ownership contract decision (orchestrator call — FLAG to Sam)

Sam ruled the owner key = **Defra ID `sub` + organisation (composite)** (handoff ruling #3).
Concrete contract I am proposing for the build:

- **Owner = composite {sub, organisation}.** Frontend supplies it; backend persists + enforces.
- **Trust boundary:** the frontend (Hapi) is the AUTHENTICATION point (Defra ID session); the
  backend is the ENFORCEMENT point. The frontend passes the authenticated owner to the backend
  **server-to-server** (a trusted header — extend the existing `User-Id` to carry sub+org, or a
  new `X-Owner-*` pair). The backend does NOT independently validate the Defra ID token in
  pr-005 (that is heavier and not required — production is server-to-server). "Don't trust a
  user-supplied userId" = don't trust a browser query param; the frontend-server-supplied
  authenticated owner IS trusted. FLAG this trust model to Sam.
- **Where owner lives:** on the canonical `Fulfilment` (the source of truth) AND on the
  Notification projection (so list/detail authorization agree — the plan requires ownership to
  flow through canonical + both projections). Persist on create; carry through replace.
- **Enforcement:** every read/write/lifecycle op (findById, replace, submit, amend,
  cancel-amend, copy, soft-delete, + document status/download/remove) checks the request owner
  against the stored owner; **404 (not 403)** on mismatch — never confirm another owner's record
  exists.
- **Owner-scoped paged list:** filter the existing paged `findAll` by owner BEFORE paging
  (backend-side filter, never client-side). Decide: add owner filtering to the notification
  `findAll`, OR add an owner-scoped list on the canonical fulfilment. LEAN: filter the existing
  notification `findAll` (it already has the page/sort contract the plan wants) — but confirm the
  dashboard rows the frontend needs come from the notification projection. The frontend replaces
  real.js `list({journeyIds})` (N GETs of `getFulfilment`) with ONE owner-filtered page call.
- **Legacy unowned records:** existing fulfilments/notifications have no owner. Policy (FLAG):
  hidden from every owner's list (not shown to anyone) — safest; no silent leak. Confirm w/ Sam.

## Frontend touch points (services/persistence/records/real.js)

- `headers()` (line 28) currently sends only Content-Type + tracing. Add the owner header(s).
- `create({userId})` → POST /fulfilments: pass the owner so the backend stamps it on create.
  Owner comes from the frontend session: `session.userId` = Defra ID sub; organisation from
  `request.auth.credentials` (the currentRelationshipId / organisationId — see auth.js profile
  mapping `organisationId: payload.currentRelationshipId`). The engine/journey.js `startJourney`
  already passes `userId: await session.userId(request)`; extend to the composite owner.
- `load({journeyId})` / `getFulfilment` → owner-scoped GET (backend 404s on mismatch).
- `list({journeyIds})` (N GETs) → ONE owner-filtered paged call. Removes the KNOWN_JOURNEYS
  reliance as real-mode authority (engine/journey.js listKnownJourneys / dashboard).
- marshal() already carries `userId`; extend to the composite owner.

## Still to read before briefing (do this first)

`NotificationStatus.java`, `Notification.java`, `NotificationService.java` (findAll query +
status model + copy/cancel-amend/soft-delete semantics), `NotificationRepository.java`,
`FulfilmentRepository.java`, `NotificationPageResponse.java` / `NotificationSort.java`, and the
frontend dashboard/list path (features/dashboard + engine/journey.js listKnownJourneys). Confirm
whether owner belongs on notification, fulfilment, or both, and how findAll builds its Mongo
query (to add the owner filter). Backend verify = `mvn -f repos/...-backend test` (SLOW) + the
FE↔BE HTTP contract by inspection + the frontend suites.

## Cross-repo mechanics

Same branch name both repos: `spike/EUDPA-288-model-retrofit`. The backend Lane-D worktree does
not exist yet — either create one (mirror the frontend promotion-loop worktree pattern) or brief
Codex against a backend worktree. Backend + frontend land together (contract must not drift).
Guard rails for Codex on Java: `mvn -f <path>` not cd; one command per Bash call; no sonar in
the loop; leave uncommitted; tests to a file.
