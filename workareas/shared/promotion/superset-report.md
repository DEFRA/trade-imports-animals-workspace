# Superset verification report — Lane A of the promotion programme

Verifies that the prototype journey at `prototypes/standalone/live-animals/`
is a behavioural SUPERSET of the existing frontend at `src/server/` before the
old one is deleted. Method: journey-builder-style digest of the current
`src/server` journey (every route, controller, schema, template, client
bundle, and the Mongo notification shape), then a both-sided comparison
against the prototype, per behaviour, with file:line evidence on both sides.

- Old side (baseline): `src/server/` on `spike/EUDPA-288-model-retrofit`
  @ `190661c7946edfd904152a5351cebaa6321bb25c` — identical to origin/main's
  `src/server` at the merge base except for 8 prototype-registration lines in
  `router.js`.
- Deployed drift: `origin/main` @ `350af8cf3e92f3815780d44b36da9ba772adffa5`
  is AHEAD of the branch in `src/server` (EUDPA-50 transited-countries,
  EUDPA-122 Arrival-details rework; EUDPA-154's live POE dropdown turned out
  to be byte-identical on both sides, i.e. not real drift). Digested
  separately in the "Main drift" area below; evidence cited as
  `origin/main:src/server/...`.
- New side: `prototypes/standalone/live-animals/` on the same branch.
- Prior rulings honoured (verified in code, not assumed): auth disabled by
  mirror ruling; unit-count === numberOfAnimals additive-strict; hub/task-list
  replaces the linear wizard (EUDPA-249 spec-gate rulings, e.g. c-019, hub
  ruling); copy lives in feature folders — pure wording differences are not
  conflicts.

Classification: **SUPERSET-OK** (prototype does it, identically or ruled
strictly better) / **ADDITIVE-DELTA** (prototype-only addition) /
**CONFLICT** (current journey does something the prototype does not, or does
differently in a non-additive way — Sam rules on every one).

## Summary

| Area | SUPERSET-OK | ADDITIVE-DELTA | CONFLICT findings |
|---|---|---|---|
| Spine core (origin, commodities, import-reason, additional-details, cph) | 20 | 8 | 7 |
| Arrival + transport (port-of-entry, transporters, consignment contact) | 21 | 8 | 3 |
| Addresses (5 parties + hub) | 11 | 9 | 2 |
| Documents + declaration | 20 | 6 | 7 |
| Lifecycle + dashboard (home, view/amend/cancel/copy/delete) | 8 | 5 | 9 |
| Platform + auth + chrome + client JS | 10 | 6 | 9 |
| Main drift (origin/main ahead of branch) | 13 | 2 | 6 |
| **Total** | **103** | **44** | **43 raw → 35 deduped** |

The 43 raw conflict findings consolidate to **35 backlog items p-001..p-035**
(cross-lane duplicates merged: save-failure handling ×3 lanes, subtotal ×2,
documents client JS ×2, notification-action JS folded into the lifecycle
flows, country block filter ×2). All are appended to
`workareas/shared/promotion/BACKLOG.json` as theme `superset`, type
`conflict`, status `blocked-on-sam`.

Headline: the page-by-page journey spine is a genuine superset — fields,
validation and payload mapping are equal or ruled-stricter almost everywhere,
and the prototype adds a large additive layer (region code, richer
identifiers, new import reasons + gated pages, address create/search/
pagination, CYA + confirmation, Welsh copy seam). The real gaps cluster in
four places: (1) the notification **lifecycle** (no copy/delete/cancel-amend,
no read-only view, collapsed status model, no dashboard pagination/sort/
columns); (2) **payload vocabulary drift** that would break the deployed
backend contract (meansOfTransport, certifiedFor, dropped typeOfCommodity);
(3) **platform chrome and error handling** the prototype currently borrows
from the very `src/server` tree promotion deletes; (4) **client-JS
enhancements** dropped without ruling (scan polling, preflight size check,
live subtotals).

---

## Conflict register (each row = one BACKLOG.json item)

### Payload / data-contract conflicts

**p-001 — `typeOfCommodity` is collected and persisted by the old journey, never collected by the prototype.**
Old: `/commodities/select` renders a Type of commodity select (`src/server/commodities/select/index.njk:49-58`, items `select/controller.js:40-49`), stores it in `commodityComplement[0].typeOfCommodity` (`select/controller.js:148-155`) and ships it in the payload (`common/clients/notification-client.js:120-123`). New: obligation `commodityType` exists (`model/obligations/obligations.js:535-540`) but is declared SYSTEM_POPULATED and no page collects it (`flow/obligation-source.js:25-29`; `bridge/collection-complete.js:20-23` — "no commodityType value is ever stored"); Mapper A's complement emits only totals + species (`services/persistence/records/notification-mapper.js:137-144`). The backend no longer receives `typeOfCommodity`.

**p-002 — `certifiedFor` option vocabulary replaced; old values unreachable, backend receives a different enum.**
Old: three camelCase radio values `approvedBodies` / `breedingAndOrProduction` / `slaughter` (`src/server/additional-details/index.njk:40-54`) → `additionalDetails.certifiedFor` (`notification-client.js:42-55`). New: 16 kebab-case values from the certification-purposes service (`services/certification-purposes/stub.js:1-21`), membership-validated (`features/additional-details/controller.js:29-32`), mapped raw with no vocab bridge entry (`notification-mapper.js:178-184`; `bridge/fulfilments.js:115-125`). Only `slaughter` survives; likely V4-driven but unruled.

**p-003 — `meansOfTransport` payload vocabulary: deployed enum `ROAD_VEHICLE` vs prototype `'Road Vehicle'`.**
Deployed main validates/stores SCREAMING_SNAKE values (`origin/main:src/server/port-of-entry/port-of-entry-schema.js:15-31`) and sends them verbatim (`origin/main:src/server/common/clients/notification-client.js:75-110`). Prototype stores Title Case display strings (`features/transport/port-of-entry.njk:33-38`, `services/transport-reference/stub.js:1-6`); the kebab bridge is internal-only (`bridge/fulfilments.js:122`) and the mapper sends Title Case raw (`notification-mapper.js:414-420`, pinned by `notification-mapper.test.js:66`). Breaking against the deployed backend contract.

**p-004 — CPH validation weakened: required-exactly-9-digits → optional-max-11-any-characters.**
Old: after slash-strip, required, exactly 9 chars, digits only, with messages (`src/server/cph-number/cph-number-schema.js:3-9`, `controller.js:33-58`). New: page validates only max 11 (`features/cph-number/controller.js:23-27`); engine enforces presence-only at submit when commodity-gated (`obligations.js:605-634`); no digit/length-9 rule anywhere (searched `features/`, `model/`, `lib/validate/`, `bridge/`). Malformed CPH now reaches the payload (`notification-mapper.js:166`). Slash-strip parity is intact both sides.

**p-005 — Document reference validation changed non-additively (optional→required, 100→58, charset dropped).**
Old: optional, `^[a-zA-Z0-9]*$`, max 100 (`src/server/accompanying-documents/accompanying-documents-schema.js:22-31`). New: required ("Enter a document reference"), max 58, no character-set rule (`features/documents/controller.js:55,72-75`; `copy.en.js:40,42`). None of the three shifts is a superset of the old rule.

**p-006 — Max upload size 10 MB → 50 MB, past the CDP nginx ingress cap.**
Old caps at 10 MB explicitly to stay under the CDP nginx 10 MiB ingress cap (`src/server/accompanying-documents/document-upload-config.js:43-47`). New sets `MAX_FILE_SIZE_MB = 50` (`features/documents/upload-config.js:40-42`) and sends it to the backend initiate call (`controller.js:253`). Files between 10 MiB and 50 MB pass prototype checks but die at the platform ingress in a real deployment.

**p-007 — Real-mode country options lose the `GBNAG_SPS_EX` block filter (origin AND transit pickers).**
Old fetches `getCountries(traceId, ['GBNAG_SPS_EX'])` for origin (`src/server/origin/controller.js:17-20`) and transit (`origin/main:src/server/transited-countries/controller.js:86-90`), via the blocks query param (`common/clients/countries-client.js:15-22`). New real-mode client fetches unfiltered `GET /countries` (`services/countries/client.js:4-8`; primed `services/countries/index.js:7-16`) and serves the same list to both pickers. Real mode would offer countries not approved for the SPS block; stub list approximates the block.

**p-008 — Transited countries: mandatory-when-applicable on deployed main, optional in the prototype.**
Main blocks continue with "Select at least one country the consignment will travel through" when means ∈ {RAILWAY, ROAD_VEHICLE} (`origin/main:src/server/transited-countries/controller.js:22-23,164-179,252-253`). Prototype models it `status: 'optional'` in scope (`model/obligations/obligations.js:440-442`); page errors only on off-list/&gt;12 (`features/transport/transit-countries.controller.js:33-43`). A rail/road user can submit with zero transited countries — forbidden today.

**p-009 — Prototype caps transited countries at 12; deployed main is unlimited.**
Main: unbounded `.array().items(code).single().unique()` (`origin/main:src/server/transited-countries/transited-countries-schema.js:16-22`). New: `MAX_TRANSITED_COUNTRIES = 12` (`features/transport/transit-countries.controller.js:13,36-41`; hint `copy.en.js:45`). Likely V4-sourced — needs the ruling recorded.

**p-010 — Arrival-date question captures a different datum: final-destination arrival (deployed) vs port-of-entry arrival (prototype), same payload field.**
Main legend: "When will the consignment arrive at its final destination?" (`origin/main:src/server/port-of-entry/index.njk:34`). Prototype: "Arrival date at port of entry" (`features/transport/copy.en.js:5-6`, answer `arrivalDateAtPort`). Both map to `transport.arrivalDate` (`origin/main:...notification-client.js:87-89`; `notification-mapper.js:190`). A prior EUDPA-249 spec-gate ruling (c-096, "V4 wording and validation win") covers the prototype's wording — but the deployed journey now asks the other question, so historical data and new data would mean different things. Needs re-affirmation against deployed main.

**p-011 — `unweanedAnimals`: always-asked with default 'no' (old) vs commodity-gated with no default (new).**
Old: question always shown, radio pre-selects 'no' (`src/server/additional-details/controller.js:17-18`; `index.njk:56-79`), so every journey persists it. New: rendered only when in scope (`features/additional-details/controller.js:60-71`), scope = commodity ∈ {0101, 0102, 0103, 010410, 010420} (`obligations.js:647-670`); no default anywhere. Cat/Dog/Fish consignments never collect it. Gating is V4-cited in the obligation comment (`obligations.js:637-645`) but unruled.

### Lifecycle / dashboard conflicts

**p-012 — Listing scope differs both ways; neither is per-authenticated-user (KNOWN gap).**
Old lists every notification in the backend, unscoped (`common/clients/notification-client.js:439-456` — page/sort only, no user identity): the known unscoped-listing security gap. Prototype lists only journeys recorded in the current yar session (`engine/journey.js:84-85`; `services/persistence/session/real.js:25-33`) and `selectJourney` refuses unknown ids (`engine/journey.js:90-95`) — masking the gap but losing cross-session visibility: after session expiry a user's own submitted notifications vanish from their dashboard.

**p-013 — No pagination or sorting on the prototype dashboard.**
Old: page param, prev/next, "Showing X to Y of Z Results", 4-way sort select defaulting `arrivalDate,desc` (`src/server/home/controller.js:26-61`; `common/helpers/notification-helper.js:34-193`; `home/index.njk:30-51`, `_pagination.njk`). New: full unsorted list in one table (`features/dashboard/controller.js:62-71`; `template.njk:16-55`); real adapter lists via N individual GETs (`services/persistence/records/real.js:113-118`).

**p-014 — Dashboard rows lose Commodity / Origin / Arrival / Consignor / Consignee.**
Old rows show commodity, origin country resolved to a name via countriesClient, arrival date, consignor, consignee placeholder (`home/index.njk:91-135`; `home/controller.js:33-44`). New rows: reference, status, created, submitted only (`features/dashboard/controller.js:54-60`; `template.njk:19-25`).

**p-015 — Status model collapsed: AMEND (and DELETED) do not exist in the prototype.**
Old surfaces DRAFT/SUBMITTED/AMEND with distinct tags (`home/index.njk:118-127`) plus DELETED via soft-delete (`notification-client.js:383-406`). Prototype vocabulary is `in-progress`/`submitted` only (`engine/persistence/records.js:1-2`); the real adapter maps AMEND → `in-progress` (`real.js:28-29`), so an in-flight amendment displays as "Draft" (`shared/kit.js:15-31`), indistinguishable from a never-submitted draft.

**p-016 — No "Copy as new" flow.**
Old: `POST /notification-copy/{ref}` → backend `/copy` → new draft, redirect to its view, `?error=copy` fallback (`src/server/notification-copy/index.js:10-21`, `controller.js:9-22`; `notification-client.js:411-434`; client-JS copy button `src/client/javascripts/notification-view.js:10-27`). New: no copy route, no records-port op (`engine/persistence/records.js:8-32`), no template action (searched features/, engine/, services/persistence/ for copy/duplicate/clone).

**p-017 — Submitted "View" is the editable CYA page, not a read-only detail page.**
Old view suppresses Change links unless DRAFT/AMEND and offers status-appropriate buttons (`src/server/notification-view/index.njk:132-138` et seq.). Prototype's view action redirects to CYA (`features/dashboard/controller.js:80-83`), which always renders Change actions (`features/check-answers/controller.js:74-88,470-520`); the freeze only bites at the adapter (`real.js:68-72`), so Change on a submitted journey leads to a page that errors on save.

**p-018 — No cancel-amendment flow.**
Old: confirmation page + POST → backend `/cancel-amend` restoring the submitted version, success banner, 3s auto-redirect JS (`src/server/notification-cancel-amend/index.js:11-40`, `controller.js:21-42`; `notification-client.js:330-351`; `notification-view/index.njk:24-36,102-109`; `notification-view.js:29-37`). New: once `amend` flips a journey in-progress (`engine/journey.js:97-104`) the only path back is re-submission; no cancel-amend route, port op, or backend call (grep across prototype: zero hits).

**p-019 — No delete flow.**
Old: AJAX `POST /notification-delete/{ref}` → backend `/soft-delete` (→DELETED), confirm `&lt;dialog&gt;`, success/error banners (`src/server/notification-delete/index.js:8-21`, `controller.js:13-26`; `notification-client.js:385-406`; `notification-view/index.njk:12-22,38-48,93-117`; `notification-view.js:39-60`). New: no delete route or records op (`engine/persistence/records.js:8-32`; `clear` is a test-reset no-op in real mode, `real.js:159`).

### Documents conflicts

**p-020 — JS auto-polling of scan status gone (status endpoint + live updates + aria-live announcements).**
Old: client bundle polls `GET /accompanying-documents/status` every 3 s (max 10), rewrites status tags in place, announces via aria-live, auto-reloads when settled (`src/client/javascripts/accompanying-documents.js:3-7,71-130,334-336`; endpoint `src/server/accompanying-documents/controller/status.js:7-16`, registered `index.js:58-65`). New: no client JS and no status route; only the manual "Refresh virus scan status" `?attempt=N` link (`features/documents/controller.js:176-185,379-403`; `template.njk:68-75`). Non-JS fallback parity survives (same MAX 10 attempts); the progressive enhancement and its accessibility layer are lost.

**p-021 — Client-side preflight oversize check gone.**
Old intercepts too-big files in the browser via `data-max-file-size` with a client-built GDS error summary (`accompanying-documents.js:295-325`; `components/add-document-form.njk:11`). New: no data attributes, no JS (`features/documents/template.njk:14`); the user always uploads the full file before server checks fire (`controller.js:86-95`, 413 hook `:363-377`). Server-side protections intact — UX/bandwidth regression.

**p-022 — Document remove became a crumb-less GET; was a CSRF-protected POST with ownership guard.**
Old: POST form per document with crumb + session-ownership 400 guard before backend DELETE (`src/server/accompanying-documents/controller/post/remove.js:19-40`; `components/uploaded-documents.njk:47-56`). New: plain link `GET /accompanying-documents/{index}/remove` deleting backend upload + answers entry, no CSRF token, no POST semantics (`features/documents/controller.js:146-155,341-355,397-402`). Destructive state change on GET — prefetcher/CSRF exposure.

**p-023 — File download / "View file" missing entirely.**
Old: `GET /accompanying-documents/{uploadId}/file` — uploadId pattern check, session ownership (404), streamed backend body, content-type allow-list with octet-stream fallback, `X-Content-Type-Options: nosniff` (`controller/download/index.js:28-54`; `download/content-type.js:1-22`; action link `uploaded-documents.njk:16-22`). New: no download route, no `streamFile` in the service (`features/documents/controller.js:379-403`; `services/document-uploads/real.js:65-89` — upload/scanStatus/remove only). Users cannot verify what they uploaded.

**p-024 — Document-type ruling rests on a false premise; value vocabulary reaching the backend changes.**
The relayed ruling says the old journey "has no separate document-type field" — it demonstrably has a mandatory 2-option select `ITAHC` / `VETERINARY_HEALTH_CERTIFICATE` (`src/server/accompanying-documents/accompanying-documents-schema.js:14-21`; `document-upload-config.js:62-71`; `components/add-document-form.njk:14-23`) sent to the backend initiate call (`controller/post/upload.js:18-26`). New derives type from filename against 14 service types + 'Other' fallback (`features/documents/derive-document-type.js:19-41`; `services/document-types/stub.js:1-16`) and sends human labels ("Veterinary health certificate") instead of enum codes. The select-vs-derivation difference is what was ruled — but the ruling text needs correcting, and the enum→label payload change is unruled.

### Cross-cutting / platform conflicts

**p-025 — Auth disabled by design: the entire defra-id surface is absent (KNOWN, mirror ruling — promotion must restore).**
Old: Bell `defra-id` + session cookie strategies, `server.auth.default('session')` (`src/plugins/auth.js:17-27`); five `/auth/*` routes (`src/server/auth/index.js:9-47`); JWT verify (`src/auth/verify-token.js:8-26`); permissions capture (`src/auth/get-permissions.js:3-21`); 4h credential cache (`src/server/auth/controller.js:46-56`, `server.js:80-84`); refresh-token rotation with 60s skew (`src/plugins/auth.js:102-129`, `src/auth/refresh-tokens.js:6-29`); sign-out with state CSRF + OIDC signout URL (`src/server/auth/controller.js:78-101`, `src/auth/get-sign-out-url.js:11-20`); org switch (`src/plugins/auth.js:79-85`); redirect-back-after-login (`:99-101`, `src/auth/get-safe-redirect.js:1-6`); unauthorised page; signed-in service-header chrome (`common/components/service-header/template.njk:12-26`). New: every route `auth: false` (`shared/kit.js:10,78-81`); only forward-compat hook is `request?.auth?.credentials?.sub ?? STUB_USER` (`services/persistence/session/real.js:13-15`; `x-stub-user` header in stub `stub.js:15-17`). Restoration list: strategy + per-route protection, `session.userId` wiring, per-user listing scope (see p-012), signout surface, signed-in chrome (the prototype layout has no service-header block to put a user name in — `shared/layout.njk:1-61`).

**p-026 — The prototype has no error pages or onPreResponse handler of its own.**
Old: `server.ext('onPreResponse', catchAll)` (`src/server/server.js:86`) renders `error/index.njk` with status-mapped copy + 5xx stack logging (`common/helpers/errors.js:18-39`). New: no onPreResponse, no error template (searched routes.js, shared/, flow/, engine/). Today prototype errors render through the old app's handler in the old chrome; after `src/server` is nuked there is no error handling at all unless carried over.

**p-027 — GDS footer meta links (Privacy / Cookies / Accessibility) and header override missing from the prototype layout.**
Old: `layouts/page.njk:62-81` (govukFooter meta links) and `:24-30` (govukHeader override). New: `shared/layout.njk` (whole file, 1-61) declares neither block — default govuk footer with no meta links. Service-standard expectation, not copy variance.

**p-028 — Prototype journey is mounted behind `features.prototypes.enabled`, default OFF in production and test.**
Old journey routes register unconditionally (`src/server/router.js:41-62`). Prototype registers at `src/server/router.js:69-72` gated on the flag whose default is `!isProduction && !isTest` (`src/config/config.js:255-264`), under the `/prototype-standalone/live-animals` prefix with "Prototypes" breadcrumbs (`prototypes/standalone/live-animals/config.js:1-15`). Promotion must re-home routes and retire the flag or production ships with no journey. (Related: the prototype borrows the entire platform shell — server.js plugin stack, nunjucks context, health, static serving, webpack pipeline — from the tree being deleted; the promotion plan needs an explicit "keep the shell, swap the journey" boundary.)

**p-029 — `/about` page and Home/About service navigation absent (low severity).**
Old: `src/server/about/index.js:13-22`; `src/config/nunjucks/context/build-navigation.js:1-14`. New: no about feature, no nav items (`shared/layout.njk:18-23`). CDP scaffold boilerplate — needs an explicit keep/drop decision.

**p-030 — Transporter authorisation guidance content gone.**
Old `/transporters` carries regulatory guidance: who must hold a transporter authorisation (DAERA/APHA; &gt;65 km; economic activity), gov.uk "Transporting animals in Great Britain" link, DAERA-docs-valid / EU-docs-not-valid statements (`src/server/transporters/index.njk:26-43`). New transporters page is only the Commercial/Private question with two one-line hints (`features/transport/transporters.njk:11-36`; `copy.en.js:55-68`). Searched the whole prototype (DAERA, 65 km, authorisation, economic) — content absent. Content removal, not wording drift.

**p-031 — Reference-data fetch semantics: per-request + trace propagation → boot-time prime cache, no trace header (ports and countries).**
Old fetches `/ports-of-entry` per request with the trace-id header (`src/server/common/clients/ports-of-entry-client.js:11-19`; `port-of-entry/controller.js:41-42,63-64`), likewise countries (`countries-client.js:15-22`). New primes once at boot and serves the cache for the process lifetime, no tracing (`services/ports/index.js:5-12`, `services/ports/client.js:4-8`; `services/countries/index.js:7-12`, `client.js:4-8`). Staleness across process lifetime + lost trace propagation.

**p-032 — Live subtotal display dropped from the quantities page.**
Old `/commodities/details` renders animal/package Subtotal rows (`src/server/commodities/details/index.njk:87-91`), updated live by `commodity-subtotal-autocomplete.js` (`index.njk:106-109`; `src/client/javascripts/commodity-subtotal-autocomplete.js:1-45`) and recomputed server-side (`details/controller.js:69-70`). New consignment-details has per-line inputs only (grep total/subtotal in `features/commodities/consignment-details.njk`, `_species-quantities.njk`: none). Payload totals are preserved exactly by Mapper A (`notification-mapper.js:55-64,140-143`) — lost on-page derived-value behaviour only.

**p-033 — CPH row on the addresses hub is conditional in the prototype, unconditional in the old journey.**
Old hub always renders the CPH section with Add/Change → `/cph-number` (`src/server/addresses/index.njk:83-102`; `addresses/controller.js:30`). New appends it only when `isCphApplicable(answers)` — commodity in `cphCommodities()` (`features/addresses/controller.js:48-50`; `features/cph-number/controller.js:18-21`). Deliberate-looking commodity scoping, but a behavioural narrowing needing a ruling/spec citation.

**p-034 — Validation failures return HTTP 200 where the old journey returned 400.**
Every old select/party POST failure re-renders with `.code(statusCodes.badRequest)` (e.g. `src/server/addresses/consignors/select/controller.js:57-69` and identically ×4 parties; upload failure 500 `accompanying-documents/.../views.js:82-96`). Prototype re-renders with inline errors but never sets a status code (`features/addresses/party-picker.controller.js:183-191`; `create-address.controller.js:132-135`; documents upload failure 200 `features/documents/controller.js:273-282`). User-visible behaviour equivalent; anything relying on 4xx/5xx-on-validation semantics (tests, monitoring) differs.

**p-035 — Backend save/submit failure is an unhandled throw; the in-page failure banner is gone (cross-cutting, every page).**
Old: every POST wraps `saveNotification` in try/catch and re-renders the same page with `SUBMISSION_FAILURE_MESSAGE` at HTTP 500, preserving entries (`src/server/origin/controller.js:106-126`; `port-of-entry/controller.js:98-111`; `transporters/controller.js:64-79`; `addresses/consignment/contact/select/controller.js:87-98`; `additional-details/controller.js:46-60`; `cph-number/controller.js:63-74`; declaration submit `declaration/controller.js:62-73`). New: the real-mode records port throws on non-OK (`services/persistence/records/real.js:19-26,132-138`, finalise `:141-148`) and no commit call site catches (`features/transport/port-of-entry.controller.js:108`; `transporters.controller.js:43`; `features/contact/controller.js:66`; `features/declaration/controller.js:60-62` handles only the domain not-ready case; searched `engine/` for catch/onPreResponse: none). Backend outage → framework's generic 500 instead of a recoverable in-context banner — including on the submit action itself.

---

## Ruled / verified-not-conflict findings

- **unit-count === numberOfAnimals invariant** — verified stricter-by-design
  (`model/obligations/obligations.js:678-719`, cap enforcement
  `flow/obligation-source.js:41-43`); ruled additive-strict. Not a conflict.
- **Hub/task-list replaces the linear wizard** — every old fixed redirect
  chain has a page counterpart in `flow/flow.js:30-96`; ruled paradigm shift
  (c-019, hub ruling). Save-and-continue moves some page-level required
  checks to the submit gate (e.g. contact required check —
  `features/contact/controller.js:16-21` passes empty, enforced at
  `obligations.js:469-473` + `flow/flow.js:82`); the journey cannot be
  submitted without them, but pages no longer block — noted for eyes-on,
  not raised as conflicts.
- **Optional→mandatory strictness** on arrival fields (port, date, transport
  identification/document reference — `obligations.js:410-426,452-462` vs
  `origin/main:src/server/port-of-entry/port-of-entry-schema.js:24,32-46`)
  and enforced selections/date-realness elsewhere — covered by the c-002
  "spec adopts the V4 mandates" ruling and the additive-strict precedent;
  report-only.
- **Arrival-date wording** ruled c-096 — but see p-010: the *datum* diverges
  from deployed main, so the ruling is surfaced for re-affirmation rather
  than silently applied.
- **Document type derived from filename** — ruled, but see p-024: the
  ruling's premise ("no separate type field" old-side) is factually wrong.
- **Copy/wording differences** (declaration statements expanded, per-part
  date messages collapsed to "Enter a real date", guidance hint rewrites,
  documents-page ITAHC/ZIP guidance block dropped) — flagged for copy review,
  not conflicts per the standing ruling. Exception made only where content
  removal is substantive regulatory guidance (p-030).

## Notable additive deltas (no action; listed for completeness)

Region-of-origin code field with retain-on-flip; country/port accessible
autocomplete; commodity search + Horse; per-line reconcile keyed by lineKey;
count-drop guard; expanded identifier types + permanent address (Cat/Dog) +
per-animal records; 3 new import reasons with gated destination-country /
port-of-exit / exit-date pages; import-purpose page (note: persisted only
under Mapper B — `notification-mapper.js:432-434`; default Mapper A drops
it); address-book create flow ×5 parties (the old "add new address" links
were dead `href="#"`), search, pagination, view-details, richer record
shape; mandatory-party CYA gating; CYA + confirmation pages (old journey had
neither — submit redirected back to `/declaration`); documents-in-payload +
attachmentType (Mapper B); adapter-enforced post-submit write freeze;
explicit dashboard Resume + Date-submitted column; import-type-filter entry
step; deep-link entry guard; phase banner; journey strip; Welsh copy seam;
multi-journey session model.

## Coverage and caveats

1. **Baseline split**: branch `src/server` digested from disk; origin/main
   drift digested via `git show origin/main:...`. EUDPA-154 (live POE
   dropdown) proved byte-identical on both sides — treated as branch
   baseline, not drift.
2. **Consignment contact create-variant**: old side never had one (dead
   link); prototype create-address serves only the five parties. Open
   question c-001 in the EUDPA-249 log — not re-raised here.
3. **Line numbers** for old-side evidence refer to the branch checkout
   (`190661c`); `origin/main:` prefixed refs count from `git show` output at
   `350af8c`.
4. **Not compared**: the tests repo's suites (Lane E's takeover concern),
   admin frontend, Welsh translation quality (machine-draft, parity-pinned),
   and visual/layout differences that change no behaviour.
5. **Severity is not encoded** in BACKLOG.json (schema has no field); the
   register above is ordered payload-contract → lifecycle → documents →
   platform, which approximates Sam's likely triage order. Low-severity
   items are p-029, p-031, p-032, p-033, p-034.
6. Counts are per-behaviour as sliced by each area worker; slicing
   granularity varies slightly between areas, so totals are indicative, not
   a metric.
