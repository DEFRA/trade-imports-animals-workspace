# Live-animals frontend promotion plan

Planning date: 2026-07-24  
Lane: E — promotion planning  
Status: **APPROVED by Sam 2026-07-24 — build authorised ("go for gold"). Increments run in order via the Codex loop, verified per the programme discipline.**

## Sam's rulings on the 8 open decisions (2026-07-24)

1. **Target layout + URL scheme** — APPROVED (`src/server/live-animals/`, `/notifications/{journeyId}/…`).
2. **No real-mode `ACTIVE_JOURNEY` fallback + legacy-URL policy** — APPROVED (id-less legacy URLs → dashboard; journey id in the path).
3. **Canonical owner identity** — **Defra ID `sub` + organisation** (a composite owner key). Ownership flows through canonical fulfilment + both projections; backend enforces.
4. **Backend-owned atomic lifecycle** — APPROVED (lifecycle ops update canonical fulfilment + status/history + projections as one backend operation; idempotent copy/submit/delete).
5. **Status/action policy, DELETED visibility, dashboard rows/paging** — **mirror the existing skeleton / old `src/server` implementation** (do not invent; match the deployed journey's status tags, action gating, `DELETED` handling, paging/sort defaults and row columns — consistent with the superset thrust).
6. **p-002 (16-value certifiedFor) + p-024 (14-value doc-type) enum extensions** — CONFIRMED release blockers (already ruled earlier; ship the frontend values, backend contract extends to match).
7. **Two-layer test model** — APPROVED (fast canned browser + a11y in the frontend repo; real-integration + cross-browser in the tests repo).
8. **Cutover / rollback / legacy links** — breaking changes are FINE (not in production): no maintenance window or legacy-link redirects required beyond the id-less→dashboard fallback; proceed to full cutover + old-journey deletion. "Go for gold."

The 14 increments (`promotion-backlog-items.json`, `pr-001`–`pr-014`) are the approved queue; they run in dependency order, one commit each, unit + E2E verified, cross-repo (backend/tests) coordination flagged as each lands.

## Executive recommendation

Promote the complete live-animals system into `src/server/live-animals/`.
Keep the existing Hapi/CDP platform shell in `src/`, but delete the old
notification journey and its journey-specific helpers, templates, clients,
tests and browser bundles at the final cutover. Do not run the promoted
journey from `prototypes/`, and do not leave production route registration
behind `FEATURES_PROTOTYPES_ENABLED`.

The target URL makes every tab self-identifying:

| Purpose | Target URL |
|---|---|
| Dashboard | `GET /` |
| Create | `POST /notifications` |
| Journey hub | `GET /notifications/{journeyId}` |
| Journey page | `GET\|POST /notifications/{journeyId}/{pageSlug}` |
| Document status/file | `/notifications/{journeyId}/accompanying-documents/...` |
| Read/amend/cancel/copy/delete | `/notifications/{journeyId}/{action}` |

Only the create endpoint creates a journey. A request without a
`journeyId` must never infer or create one. This is the foundation for
multi-tab correctness, ownership checks and lifecycle routing.

The promotion is not one big code move. It is a gated series: physical
re-home; journey-ID URLs and session repair; error handling; Defra ID auth;
backend ownership and contract work; status and lifecycle; dashboard;
frontend and tests-repo takeovers; then one production cutover that deletes
the old journey, prototype flag and prototype banner.

## Preconditions and binding rulings

- Lane E's durable precondition is met: the supplied backlog has no
  `blocked-on-sam` item in the `superset` or `merge-artifact` themes.
- p-028 binds the programme to **keep the shell, swap the journey**.
- p-029 drops the scaffold About page and Home/About navigation.
- p-114 retires the “non-functional prototype” banner only at promotion.
- p-105 binds the cutover to Mapper A's storable notification shape. Mapper B
  remains aspirational; the dual-mapper/`LIVE_ANIMALS_MAPPER` compatibility
  surface survives.
- p-031 keeps ports and countries boot-prime caching.
- No implementation increment starts until Sam approves this document and
  rules the open decisions at the end.

## 1. Target layout and keep-the-shell boundary

### From-scratch target

`src/server/live-animals/` becomes one cohesive journey package. Move the
entire current `prototypes/standalone/live-animals/` tree there, preserving
its feature-owned controllers/templates/copy, model, bridge/projection,
flow, engine, services, shared kit, docs and unit tests. New lifecycle and
dashboard work belongs in that package, not in resurrected old route
folders.

The location is deliberate:

- The production Docker stage copies only `src/` and `.public/`
  (`Dockerfile:41-43`), so code left in `prototypes/` cannot be the deployed
  application.
- `src/server/live-animals/` keeps the journey together while separating it
  from `src/server/server.js`, `router.js`, auth, health and reusable shell
  helpers.
- Nunjucks can resolve the promoted templates from the existing `src/server`
  template root; the prototype-specific search roots can be removed
  (`src/config/nunjucks/nunjucks.js:13-19,44-46`).

### Exact `src/` files and groups that live

These are the target survivors, with normal edits and their companion tests:

- Process and platform entry:
  - `src/index.js`
  - `src/server/server.js`
  - `src/server/router.js`
- Identity:
  - every file under `src/auth/`
  - `src/plugins/auth.js`
  - `src/plugins/csrf.js`
  - every file under `src/server/auth/`
  - every file under `src/server/signout/`
- Health:
  - every file under `src/server/health/`
- Configuration and view engine:
  - `src/config/config.js`
  - `src/config/nunjucks/nunjucks.js`
  - `src/config/nunjucks/context/context.js`
  - keep `src/config/nunjucks/globals/globals.js` only as the existing
    extension point; do not carry unused old-journey filters into the target
- Platform helpers:
  - `src/server/common/constants/status-codes.js`
  - `src/server/common/helpers/content-security-policy.js`
  - `src/server/common/helpers/errors.js`, rewritten to render the promoted
    error view
  - every file under `src/server/common/helpers/logging/`
  - every file under `src/server/common/helpers/proxy/`
  - `src/server/common/helpers/pulse.js`
  - `src/server/common/helpers/redis-client.js`
  - `src/server/common/helpers/request-tracing.js`
  - `src/server/common/helpers/serve-static-files.js`
  - every file under `src/server/common/helpers/session-cache/`
  - `src/server/common/helpers/start-server.js`
  - the retained helpers' tests
- Signed-in chrome:
  - every file under
    `src/server/common/components/service-header/`, integrated into the
    promoted layout
  - the component test support still used by that component
- Browser assets:
  - `src/client/javascripts/application.js`
  - `src/client/javascripts/select-autocomplete.js`
  - `src/client/stylesheets/application.scss`
  - `src/client/stylesheets/_govuk-frontend.scss`
  - all files under `src/client/stylesheets/variables/`,
    `helpers/`, `core/` and `partials/`
  - `src/client/stylesheets/components/_index.scss` and
    `_task-list.scss`
  - `_notification-list.scss` and `_notifications-pagination.scss` only if
    the promoted dashboard consumes them; the dashboard increment must make
    that decision and remove them otherwise
- Promoted journey:
  - the full contents of `prototypes/standalone/live-animals/`, moved to
    `src/server/live-animals/`

The shell list is supported by `src/server/server.js:24-86`: host/port,
route security including HSTS, cache engine, request logging/tracing,
metrics, secure context, pulse, yar, Nunjucks, Scooter, CSP, CSRF, Cookie,
Bell/auth, routing and `onPreResponse` all remain. Static serving remains in
`src/server/router.js:74-77`; `/health` remains unauthenticated
(`src/server/health/index.js:7-12`).

### Exact old `src/` content that dies

Delete at the final cutover, including tests and nested files:

- Old journey routes:
  - `src/server/about/` (p-029)
  - `src/server/accompanying-documents/`
  - `src/server/additional-details/`
  - `src/server/addresses/`
  - `src/server/commodities/`
  - `src/server/cph-number/`
  - `src/server/declaration/`
  - `src/server/error/` (replaced by the promoted error view)
  - `src/server/home/`
  - `src/server/import-reason/`
  - `src/server/notification-amend/`
  - `src/server/notification-cancel-amend/`
  - `src/server/notification-copy/`
  - `src/server/notification-delete/`
  - `src/server/notification-view/`
  - `src/server/origin/`
  - `src/server/port-of-entry/`
  - `src/server/transporters/`
- Old journey support:
  - every file under `src/server/common/clients/`
  - `src/server/common/components/address-section/`
  - `src/server/common/components/heading/`
  - `src/server/common/components/reference-number-caption/`
  - `src/server/common/constants/messages.js`
  - `src/server/common/constants/session-keys.js`
  - `src/server/common/helpers/notification-helper.js`
  - `src/server/common/helpers/notification-helpers.js`
  - `src/server/common/helpers/notification-view-helper.js`
  - `src/server/common/helpers/object-helpers.js`
  - `src/server/common/helpers/session-helpers.js`
  - `src/server/common/helpers/validation-helpers.js`
  - their `__mocks__` and tests
  - `src/server/common/templates/layouts/page.njk`, after auth/unauthorised
    and error views use the promoted layout
  - obsolete common READMEs/placeholder partials that describe the deleted
    journey
- Old browser code:
  - `src/client/javascripts/accompanying-documents.js` and its test
  - `src/client/javascripts/commodity-subtotal-autocomplete.js`
  - `src/client/javascripts/notification-view.js` and its test
  - unused custom Nunjucks filter files after the promoted-template usage
    check

`src/config/nunjucks/context/build-navigation.js` and its test also die:
p-029 explicitly drops Home/About navigation. The context keeps
`getAssetPath` and authenticated user data (`context.js:26-50`) but no
scaffold navigation.

### Migration approach

1. Move, do not duplicate, the live-animals package into
   `src/server/live-animals/`; fix imports, test paths and template paths.
2. Point the Webpack document client entry at the new location.
3. Register the moved plugin from `src/server/router.js` while the old
   journey still exists on the branch; keep production release gated until
   the final cutover.
4. Complete URL/auth/lifecycle/dashboard work in the promoted package.
5. In the cutover increment, replace the old route list with health,
   promoted routes and the signout surface; then delete the old tree and
   unused support.

### Risks and interlocks

- A copy instead of a move creates two sources of truth and is forbidden.
- The physical move changes hundreds of imports and test locations but
  should not change behaviour; it needs its own reviewable increment.
- Root dashboard routes cannot coexist in production. Mixed old/new
  production deployment is not a supported steady state.
- Auth/unauthorised and error templates must move to the promoted chrome
  before the old base layout is deleted.
- p-217's URL rewrite must precede lifecycle and dashboard links, otherwise
  those features would be built twice.

### Open question for Sam

Approve `src/server/live-animals/` as the physical home and the canonical
`/notifications/{journeyId}/...` URL family. The alternative—placing feature,
model and engine folders directly under `src/server/`—has no behavioural
benefit and weakens the shell/journey boundary.

## 2. Authentication restoration and per-user ownership

### From-scratch target

Every service route except health, static assets and the OIDC handshake is
protected by the default `session` strategy. The existing Defra ID surface
survives intact:

- Bell `defra-id` and Cookie `session` strategies, with `session` as the
  default (`src/plugins/auth.js:17-27`)
- `/auth/sign-in`, `/auth/sign-in-oidc`, `/auth/sign-out`,
  `/auth/sign-out-oidc`, `/auth/organisation`
  (`src/server/auth/index.js:7-47`)
- JWT verification and permission capture before the cached session is
  created (`src/server/auth/controller.js:31-56`)
- safe redirect-back-after-login (`controller.js:58-63`)
- refresh-token rotation with 60-second clock skew
  (`src/plugins/auth.js:102-128`)
- OIDC signout URL/state handling and session-cache removal
  (`src/server/auth/controller.js:66-100`)
- organisation reselection (`src/plugins/auth.js:71-87`)
- signed-in name and signout link in the promoted service chrome

Delete `open = { auth: false }` from the promoted kit
(`prototypes/standalone/live-animals/shared/kit.js:10,78-80`). In real mode,
`session.userId(request)` must return the authenticated canonical owner id
and must never fall back to `STUB_USER`; the fallback/header remains only in
the explicitly injected canned-data test adapter. The current fallback is
visible at `services/persistence/session/real.js:21-24`.

### Per-user scoping (p-012), sequenced after auth

Auth restoration must land first. Then:

1. Agree the canonical owner key with backend/PO.
2. On create, persist that owner on the canonical fulfilment and Mapper A
   notification/projection.
3. Replace session-known listing with one backend list request filtered by
   the authenticated owner.
4. Apply the same ownership rule to load, amend, copy, cancel-amend,
   soft-delete, submit and document download/remove/status. Return 404 for
   an inaccessible id to avoid confirming another user's record exists.
5. Treat frontend filtering as presentation only. The backend must enforce
   ownership; a user-supplied `userId` query parameter is not a security
   boundary.

`KNOWN_JOURNEYS` may remain in the canned-data adapter, but it is removed as
real-mode authority. Today the prototype lists only session-known ids
(`engine/journey.js:95-99`) while the old client list is globally unscoped;
neither is the target.

### Risks and interlocks

- Owner identity may mean Defra ID `sub`, contact id, organisation, or a
  composite. Choosing the wrong key either hides legitimate records or leaks
  them.
- Existing unowned notifications need an explicit migration/visibility
  policy; silently showing them to everyone is not acceptable.
- The authenticated owner must flow through canonical fulfilment and both
  projections, otherwise list and detail authorization will disagree.
- Auth callback, signout and organisation-switch redirects must preserve a
  full journey-ID URL.
- This depends on p-217's URL identity and precedes dashboard/list work.

### Open questions for Sam

1. Is “per-user” exactly Defra ID `sub`, or should ownership include the
   selected organisation?
2. What happens to records created before ownership exists: backfill,
   admin-only recovery, or hidden legacy records?
3. Should local development keep a first-class Defra ID stub path, with
   auth disabled only in isolated tests?

**Cross-repo coordination: BACKEND.** The backend must persist and enforce
ownership before the unscoped frontend adapter is retired.

## 3. Session and multi-tab correctness (p-217)

### Size and sequence

Size: **XL**. Place it immediately after the physical re-home and before auth
ownership, lifecycle, dashboard or tests-repo rewriting. It touches route
generation, every controller redirect/link, engine loading, opening-run
state, session ports, document actions and most browser journeys.

### From-scratch target

The current defect is structural:

- real session has one `ACTIVE_JOURNEY` and one `OPENING_RUN`
  (`services/persistence/session/real.js:3-6,26-31,48-53`)
- `currentJourney` reads the active id instead of a route id and even creates
  a journey when it cannot load one (`engine/journey.js:64-75`)
- flow-only answers are already correctly keyed by journey id
  (`session/real.js:56-68`)

Replace that design as follows:

1. Every journey route carries `{journeyId}`.
2. A request-scoped resolver validates the path id, obtains the authenticated
   owner, loads `{ journeyId, userId }`, memoises that record only for the
   request, and returns 404 when absent/inaccessible.
3. Delete `activeJourneyId`, `setActiveJourney`, `clearActive`,
   `ACTIVE_JOURNEY` and the journey-id cookie interface.
4. The create endpoint creates a record and redirects to its explicit hub
   URL. No page implicitly starts a journey.
5. Replace the one `OPENING_RUN` value with per-journey run state, preferably
   folded into the existing `FLOW_ONLY_ANSWERS[journeyId]` session envelope.
   Do not create a second session-global pointer.
6. Make `pagePath`, `hubPath`, CYA/change-context, next-page navigation,
   breadcrumbs and every dashboard/lifecycle action require a journey id.
7. Real-mode listing comes from the owner-scoped backend and no longer uses
   the known-journey session list as authority.

### Document-upload interlock

Document status, file, remove and page POST paths all carry the journey id.
Load that journey before applying `ownsUpload`; the present check only works
against whichever journey state `state.get` resolved
(`features/documents/controller.js:301-307,316-336`). Upload initiation
continues to carry `journeyId` (`controller.js:339-349`), and the backend
must enforce that the authenticated owner owns both journey and upload.

Acceptance must include two browser contexts/tabs in one authenticated
session:

- tab A opens notification X and tab B opens Y
- alternating edits persist only to their URL's notification
- CYA, amend and opening-run navigation remain independent
- an upload in X cannot appear, download or remove from Y
- copying/deleting Y does not alter X

### Risks and open questions

- Legacy URLs without an id cannot safely infer one. Recommendation: route
  them to the dashboard with a neutral message; only legacy links that
  already contain a reference may redirect after an ownership check.
- Query-string ids are easier to drop during navigation; use a path segment.
- Session cleanup needs a bounded policy for per-journey flow-only state
  after submit/delete.

Sam must approve the no-active-pointer rule and the legacy URL behaviour.

## 4. Lifecycle and status model

### Status foundation first (p-015)

Make `DRAFT`, `SUBMITTED`, `AMEND` and `DELETED` canonical statuses across:

- engine record constants and read models
- real/stub adapters and backend DTOs
- dashboard/view tags and action policy
- write guard and submit transitions
- Mapper A and Mapper B projections

The current adapter collapses every non-submitted backend state to
`IN_PROGRESS` (`services/persistence/records/real.js:41-52`); remove that
loss. Define one transition table:

| Current | Allowed actions | Result |
|---|---|---|
| DRAFT | edit, submit, copy, soft-delete | SUBMITTED / new DRAFT / DELETED |
| SUBMITTED | view, amend, copy, soft-delete | AMEND / new DRAFT / DELETED |
| AMEND | edit, submit, cancel-amend | SUBMITTED / restored SUBMITTED |
| DELETED | none in normal UI | terminal and omitted from normal list |

Backend and Sam must confirm any action differences from the deployed
journey before implementation.

### Lifecycle flows after the foundation

- **p-017 read-only submitted view:** reuse the promoted CYA summary builders,
  but render a read-only mode with no Change links for `SUBMITTED`. `DRAFT`
  and `AMEND` retain editable CYA. Never rely on a late adapter write failure
  as the user experience.
- **p-018 cancel amendment:** confirmation GET plus CSRF-protected POST;
  invoke the backend cancel-amend operation, restore the submitted snapshot,
  show a success banner and return to the read-only view/dashboard.
- **p-016 copy as new:** CSRF-protected POST from dashboard and view; backend
  `/copy` produces a new owned `DRAFT`; redirect to the new journey-ID URL.
  Retry must not create duplicate copies.
- **p-019 delete:** confirmation plus CSRF-protected POST to backend
  soft-delete; surface success/failure in the promoted chrome, remove
  `DELETED` from the normal dashboard and reject further journey actions.

Split implementation into two increments: read-only/amend/cancel first, then
copy/delete. This keeps each acceptance surface coherent and reviewable.

### Persistence risk

The prototype's canonical record is a fulfilment, while Mapper A writes the
current notification projection and Mapper B writes the proposed projection
(`services/persistence/records/real.js:161-176`). Existing notification
`/copy`, `/cancel-amend` and `/soft-delete` endpoints cannot be called
blindly if they mutate only the projection. Lifecycle operations must update
the canonical fulfilment, status/history and required projections as one
backend-owned operation, or expose explicit idempotent reconciliation.

### Open questions for Sam/backend

1. Is `DELETED` recoverable/admin-visible or fully terminal?
2. Which statuses allow copy and delete?
3. Does cancel-amend restore a backend-held submitted snapshot, and does that
   include documents?
4. What idempotency contract prevents duplicate copies or ambiguous submits
   on retry?

**Cross-repo coordination: BACKEND.** The existing endpoint names are useful,
but their source-of-truth and atomicity must be aligned to canonical
fulfilments before frontend wiring.

## 5. Dashboard (p-013, p-014)

### From-scratch target

Replace `records.list({ journeyIds })` and its N individual GETs
(`services/persistence/records/real.js:146-150`) with one owner-scoped,
paginated backend list endpoint. The frontend accepts only an allow-list of:

- `arrivalDate,desc` (default)
- `arrivalDate,asc`
- `createdAt,desc`
- `createdAt,asc`

These match the existing deployed choices
(`src/server/common/helpers/notification-helper.js:34-49`). Invalid page and
sort values are normalised. The response contains page, size, total elements,
total pages and dashboard summary rows so the frontend does not fetch each
record.

Each row shows:

- reference
- full status tag
- commodity display name
- origin display name, resolved from the boot-primed countries cache
- arrival date
- consignor display name
- consignee display name
- created and submitted dates where applicable
- status-appropriate view/resume/amend/cancel/copy/delete actions

Country and port reference data continue boot-prime caching per p-031; no
per-request refetch or trace propagation is reintroduced.

### Migration approach

1. Agree and land the backend owner-scoped page contract.
2. Build a dashboard DTO adapter in the promoted services layer.
3. Add pagination range, previous/next and sort controls.
4. Add richer rows and lifecycle actions after the status/lifecycle
   increments are stable.
5. Remove known-session/N-GET real listing.

### Risks and open questions

- The list endpoint must filter in the backend before paging; client-side
  filtering can leak counts and page contents.
- Define commodity display for multi-line/multi-species notifications.
- Define blank/missing legacy values and date/time-zone formatting.
- Sam should confirm page size and whether `DELETED` is excluded or available
  behind a separate view.

**Cross-repo coordination: BACKEND.** Paging, sorting, ownership and the row
projection should be agreed as one list contract, not four frontend
workarounds.

## 6. Error handling (p-026 and p-035: one increment)

### From-scratch target

One promotion increment owns both failure classes:

1. A promoted `onPreResponse` catch-all renders 400/401/403/404/5xx in the
   promoted layout, preserves the original HTTP status, logs 5xx errors
   without payload/token leakage, and leaves normal responses/redirects
   alone. The existing handler's essential behaviour is at
   `src/server/common/helpers/errors.js:18-38`.
2. Expected backend save/submit failures are caught at the feature boundary
   and re-render the same page with:
   - HTTP 500
   - a consistent in-page failure banner
   - the user's submitted entries
   - validation errors, if any
   - a CSRF-protected retry action

The declaration path must re-render instead of its current redirect to CYA on
backend failure (`features/declaration/controller.js:60-66`). Apply the same
policy to every commit path and document uploads where the failure is
recoverable in context.

### Migration approach

- Put failure copy in the owning feature/shared chrome, not the model.
- Use a small controller helper that distinguishes validation, expected
  backend failure and unexpected programming failure; do not add a blanket
  catch that hides bugs.
- Preserve the cleaned POST view model in memory for the response; do not
  persist unvalidated/raw payloads to yar just to render an error.
- Make retry idempotent. The current record adapter can save the canonical
  fulfilment before a projection failure and exposes that partial state
  (`services/persistence/records/real.js:91-123,179-195`), so the banner and
  retry logic must tolerate “canonical saved, projection failed”.

### Risks and open questions

- Submit/copy retries can duplicate effects without backend idempotency.
- A generic 500 page is still correct for unexpected failures; not every
  error is safe to retry in-page.
- Sam should approve the exact shared banner wording and whether partial
  projection failure receives a distinct message for supportability.

## 7. Persistence, mappers and backend contracts

### Binding Mapper A target (p-105)

Mapper A remains the production/current notification shape at promotion.
Mapper B stays aspirational/non-authoritative. Preserve both mappers and the
`LIVE_ANIMALS_MAPPER` compatibility/config boundary; do not use promotion to
switch the backend schema to Mapper B or delete parity coverage.

The inspected adapter currently writes Mapper A to `/notifications` and
Mapper B to `/proposed-notifications`
(`services/persistence/records/real.js:166-176`). The backend contract must
document how this parallel projection behaviour and the retained selection
surface coexist. In every case:

- canonical fulfilment remains the editable source of truth
- Mapper A is the production notification contract
- Mapper B cannot silently become authoritative
- projection failure/reconciliation is observable and retryable

### Backend/PO contract extensions

- **p-002 `certifiedFor`:** extend the backend enum to all 16 V4 values
  already emitted by the frontend. The exact frontend vocabulary is at
  `services/certification-purposes/stub.js:1-19`. This is a release blocker,
  not a frontend remapping exercise.
- **p-024 document type:** retain current enum casing and extend beyond
  `ITAHC` and `VETERINARY_HEALTH_CERTIFICATE` to all 14 values at
  `services/document-types/stub.js:1-16`. Confirm the derivation-to-enum
  mapping and `OTHER` fallback with PO/backend.
- **p-031 reference data:** keep the boot-prime design in `routes.js:29-31`;
  no change.
- **Ownership/list/lifecycle:** define owner enforcement, paged list DTO and
  canonical lifecycle operations as described above.

### Migration approach

Use contract tests on both sides of each backend change. Do not remove
Mapper-A skeleton equivalence until the old journey has been deleted and an
equivalent Mapper-A/backend contract pin exists. The old-vs-new browser
parity test can then retire, but Mapper A payload coverage must remain.

### Risks and open questions

- Backend enum deployment must precede frontend traffic emitting new values.
- Dual writes can leave canonical, current and proposed records inconsistent.
- The backend needs a reconciliation/monitoring story for projection failure.
- Sam/backend must decide whether `LIVE_ANIMALS_MAPPER` selects a response,
  a write target, or remains a compatibility/testing boundary; p-105 forbids
  removing it during promotion.

**Cross-repo coordination: BACKEND and PO.** This conversation starts from
the already-ruled Mapper A shape; it must not reopen Mapper B as the promotion
target.

## 8. Configuration, assets and deploy cutover

### `src/config` that carries over

Keep these `src/config/config.js` groups:

- `serviceVersion`, `host`, `port`, `root`, `assetPath`,
  `staticCacheTimeout`, service name and environment markers
- logging, HTTP proxy and secure-context settings
- session cache/cookie and Redis settings
- all `defraId` and `auth` settings
- Nunjucks, CSRF and tracing settings
- `tradeImportsAnimalsBackendApi.baseUrl`
- `tradeImportsReferenceDataApi.baseUrl`

Delete only `features.prototypes.enabled` and its
`FEATURES_PROTOTYPES_ENABLED` environment variable
(`src/config/config.js:255-263`). `AUTH_ENABLED` remains for controlled
local/test use, with production authentication on.

Move direct prototype environment reads into typed config:

- `TRADE_IMPORTS_ANIMALS_BACKEND_URL` -> existing backend config
- `REFERENCE_DATA_URL` -> existing reference-data config
- `TRACING_HEADER` -> existing tracing config
- `LIVE_ANIMALS_MAPPER` -> a validated Mapper A/B setting retained per p-105

Production always uses real services. Retire deployed use of
`LIVE_ANIMALS_MODE`; stub/real selection becomes explicit test dependency
injection. Keep `LIVE_ANIMALS_IT` test-only if the integration harness still
needs it.

### Webpack and browser bundles

Keep the Webpack pipeline and manifest. Its current live-animals document
entry points back into `prototypes/`
(`webpack.config.js:20-41`); change it to the promoted feature and give it a
non-prototype asset name. The bundle contains the p-020 scan polling and
p-021 preflight upload-size enhancement and therefore survives.

Target entries:

- `application`
- `selectAutocomplete`
- promoted `documents`
- any new feature-owned lifecycle bundle only if progressive enhancement
  genuinely needs one

Remove old `commoditySubTotal`, `accompanyingDocuments` and
`notificationView` entries. Update templates and the asset manifest together.

### CDP and health

- Keep Docker build/start shape; moving the app into `src/` makes it present
  in the production image (`Dockerfile:41-50`).
- Keep `/health`, pulse, metrics, request tracing, CSP/HSTS, CSRF, Redis yar,
  static serving and assets manifest.
- Update CDP environment/config to remove the prototype flag and prototype
  run-mode variables; verify Defra ID, backend, ref-data, Redis and cookie
  secrets in each environment.
- Keep countries/ports boot-prime. Decide whether boot failure should fail
  readiness/startup or use a bounded retry; do not silently serve empty
  reference data.

### Final cutover

The final release increment:

1. registers promoted routes unconditionally
2. makes `/` the promoted dashboard
3. removes prototype prefixes/breadcrumbs
4. removes the prototype phase banner and “standalone” service naming
   (`shared/layout.njk:9,33-45`; `shared/copy.en.js:10-20`)
5. removes About/Home navigation per p-029
6. deletes the old journey and assets listed in section 1
7. deletes prototype scripts/registration and
   `FEATURES_PROTOTYPES_ENABLED`
8. runs deployment smoke/health/auth checks and the approved test gates

### Risks and open questions

- Route and asset changes make rollback a release-level operation. Retain the
  previous deployable image; do not preserve two live journey implementations
  as rollback code.
- Sam must choose whether cutover needs a maintenance window and whether
  legacy URLs get owned redirects or dashboard fallbacks.
- CDP config may still define prototype variables outside this repo; remove
  them in the deployment configuration as part of the same change.

## 9. Tests-repo takeover and in-repo test fate

### Recommendation for p-202

Keep a permanent, renamed frontend-repo **canned-data browser journey
contract layer**. Do not call it “prototype E2E” after promotion. It is fast,
deterministic and feature-specific; the current Playwright `prototype`
project already runs the stub server and full journeys
(`playwright.config.js:36-68,81-87`).

Its responsibility:

- route/navigation and page contracts
- conditional obligations, purge and validation
- lifecycle UI/state policy using canned adapters
- multi-tab isolation
- document client behaviour with canned uploads
- fast accessibility scans

Do not duplicate those detailed assertions in the tests repo.

After cutover, retire `skeleton-vs-prototype-mongo.spec.js` as an
old-vs-new journey comparison. Replace the protection it supplied with:

- Mapper A unit/contract fixtures in the frontend
- a real backend projection contract/integration test
- a small integrated happy path in the tests repo

### Recommendation for p-203

Yes: if the canned-data layer stays, run automated accessibility checks
there on every distinct page/state because it is the fastest place to catch
template regressions. Keep a smaller tests-repo accessibility suite for
deployed integration, authentication, headers/assets and critical
cross-browser journeys. Share a page/state coverage matrix so “a11y in both”
does not become duplicate ownership.

### Tests-repo takeover (p-201)

In `trade-imports-animals-tests`, create the same branch name as the frontend
promotion branch, following workspace rules. Repoint/rewrite the suites only
after canonical URLs, auth, statuses, lifecycle and dashboard contracts are
stable.

The tests repo owns:

- real Defra ID/stub handshake and session expiry/refresh/signout/org switch
- backend ownership and negative cross-user access
- full integrated create/submit/amend/cancel/copy/delete flows
- paged/sorted dashboard with real DTOs
- document upload/scan/download/remove across actual services
- CDP-like browser/assets/security headers
- agreed cross-browser matrix
- deployed a11y smoke and critical-path regression

Use a responsibility matrix per behaviour: frontend canned, frontend
contract/integration, tests-repo integrated, or backend contract. Every
behaviour has a primary owner; no test is copied merely because the old suite
had it.

### Cutover gates

- Frontend unit/model/feature suite green from its moved location.
- Canned browser suite green under authenticated test injection.
- Multi-tab and canned a11y coverage green.
- Backend contract/integration checks green for ownership, lifecycle,
  paging, enums and Mapper A.
- Same-name tests-repo branch green for e2e/a11y/cross-browser.
- Old-vs-new parity may be removed only in the cutover commit after the
  replacement Mapper A contract pin is green.

### Open question for Sam

Approve the permanent two-layer model: detailed fast canned journeys and
a11y in the frontend; smaller real-integration/cross-browser suites in the
tests repo.

**Cross-repo coordination: TESTS REPO and BACKEND.**

## 10. Future-lane sequencing (p-204)

After production cutover, replacement tests and post-cutover acceptance are
green, declare the promoted frontend “gold-standard eligible”. Only then
start the separate documentation/custom-skills/agentic-AI-first lane. This
plan reserves that gate and does not design the lane's contents.

## Programme-level risks

1. **Identity/ownership:** an incorrect owner key or legacy-data policy can
   cause data leakage or apparent data loss.
2. **Multi-tab routing:** leaving even one active-session fallback recreates
   the p-217 defect and can attach document actions to the wrong journey.
3. **Canonical/projection lifecycle:** existing notification endpoints may
   mutate Mapper A without updating canonical fulfilment/Mapper B.
4. **Partial saves and retries:** canonical writes can succeed before a
   projection fails; submit/copy/delete need idempotent contracts.
5. **Backend enums:** p-002 and p-024 are cutover blockers if backend
   validation is not deployed first.
6. **Cross-repo timing:** deleting old routes before the tests-repo is
   rewritten removes the principal production-similar safety net.
7. **Big-bang deletion:** the final deletion is intentionally late, but it is
   still a broad diff. The earlier re-home and replacement test gates keep it
   mostly subtractive.

## Decisions Sam must make before increments start

1. Approve `src/server/live-animals/` and
   `/notifications/{journeyId}/...`.
2. Approve no real-mode `ACTIVE_JOURNEY` fallback and the legacy URL policy.
3. Choose the canonical owner identity and legacy-record migration policy.
4. Approve backend-owned atomic lifecycle operations over canonical
   fulfilment plus projections, including idempotency.
5. Confirm status/action policy, `DELETED` visibility and dashboard page
   size/multi-commodity display.
6. Confirm the p-002 16-value and p-024 14-value backend/PO extensions are
   release blockers.
7. Approve the permanent frontend canned browser+a11y layer alongside the
   narrower tests-repo layer.
8. Choose cutover/rollback and legacy-link handling.

## Ordered implementation increments

No increment runs until this plan is approved.

1. **Re-home the system under `src/server/live-animals/`** `[FRONTEND]`  
   Move the entire package; update imports, Nunjucks/test paths and the
   document bundle path. Keep behaviour and old routes unchanged. Foundation
   for every later increment.

2. **Make journey id part of every journey URL; remove session-global
   journey/run pointers** `[FRONTEND, p-217, XL]`  
   Depends on 1. Introduce the canonical URL builders and request resolver,
   delete `ACTIVE_JOURNEY`, make opening-run state per journey, keep
   flow-only answers sub-keyed, and prove two-tab/document isolation.

3. **Add promoted-chrome error handling and recoverable backend-failure
   banners** `[FRONTEND, p-026+p-035]`  
   Depends on 1-2. One coherent increment across `onPreResponse`, all save
   call sites and declaration submit; preserve entries and support
   idempotent retry.

4. **Restore full Defra ID auth and signed-in chrome** `[FRONTEND, p-025]`  
   Depends on 1-2. Protect promoted routes, wire authenticated
   `session.userId`, retain refresh/signout/org-switch/redirect behaviour,
   and remove the real-mode stub fallback.

5. **Land backend ownership and owner-scoped paged-list contract**
   `[BACKEND + FRONTEND, p-012 and p-013 foundation]`  
   Depends on 2 and 4. Persist/enforce the approved owner on all record and
   document operations; replace session-known/N-GET real listing with one
   filtered page request. Auth explicitly precedes scoping.

6. **Land Mapper-A-compatible backend contract extensions**
   `[BACKEND + PO + FRONTEND CONTRACTS, p-105, p-002, p-024]`  
   Depends on the binding Mapper A ruling and should follow the backend
   ownership contract review. Extend certified/document enums, pin Mapper A
   as production shape, retain Mapper B/mapper switch, and define projection
   reconciliation. This may proceed in parallel with frontend increment 3-4
   after plan approval, but blocks cutover.

7. **Introduce the full status model** `[BACKEND + FRONTEND, p-015]`  
   Depends on 5-6. Add DRAFT/SUBMITTED/AMEND/DELETED without lossy mapping;
   define transition and action policy. Foundation for all lifecycle flows.

8. **Add read-only view, amend and cancel-amend** `[BACKEND + FRONTEND,
   p-017+p-018]`  
   Depends on 7. Reuse promoted summaries, enforce read-only submitted state,
   and restore the submitted snapshot through a canonical backend operation.

9. **Add copy-as-new and soft-delete** `[BACKEND + FRONTEND, p-016+p-019]`  
   Depends on 7-8. Add owned/idempotent copy and terminal soft-delete with
   confirmation, banners and correct URL routing.

10. **Replace the dashboard adapter and add paging, sorting and rich rows**
    `[BACKEND + FRONTEND, p-013+p-014]`  
    Depends on 5 and 7-9. Use one owner-filtered page DTO; add country display
    resolution and status-appropriate lifecycle actions.

11. **Re-home and define the frontend canned browser+a11y layer**
    `[FRONTEND, p-202+p-203]`  
    Depends on stable URLs/status/lifecycle/dashboard (2, 7-10), while unit
    tests move with increment 1. Rename prototype scripts/projects, add
    multi-tab and page-state a11y coverage, and replace old parity with
    Mapper A/backend contract protection.

12. **Take over the integrated suites in the tests repo**
    `[TESTS REPO, p-201]`  
    Depends on 4-11. Use the same-name branch; rewrite e2e/a11y/cross-browser
    suites for new URLs, auth, ownership, lifecycle, dashboard and documents.
    Green status is a cutover gate.

13. **Production route/config/deletion cutover** `[FRONTEND + CDP]`  
    Depends on 3-12 and all backend/PO blockers. Register promoted routes,
    remove prototype prefix/flag/banner, switch `/`, prune old Webpack
    entries, delete the complete old journey/support list, keep shell/health,
    and deploy with a previous-image rollback.

14. **Gold-standard acceptance and future-lane handoff** `[PROGRAMME,
    p-204]`  
    Depends on 13 plus production acceptance. Record whether the gold-standard
    gate is met, then hand off to the separate docs/custom-skills lane without
    planning or implementing that lane here.

