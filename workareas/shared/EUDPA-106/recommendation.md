# EUDPA-106 — spike recommendation

**Ticket:** [EUDPA-106 — Spike: refactor file upload to allow larger file sizes](https://eaflood.atlassian.net/browse/EUDPA-106)
**Date:** 2026-07-27
**Author:** Paul Hodgson

Executive summary of the spike's outcome, the design decisions locked in, and the recommended shape of the follow-up implementation ticket that AC5 asks us to raise. Detailed evidence lives in [findings.md](findings.md) and [state-store-approaches.md](state-store-approaches.md); this document is the "what next" prescription.

## Bottom line

**50 MB uploads are supportable on the direct-to-uploader flow.** Proven end-to-end on the local stack via a Playwright test uploading a 50 MB synthetic file (`accompanying-documents-large-uploads.spec.ts`). No CDP platform request needed — the 10 MB cap is enforced by the CDP `nginx-upstreams` sidecar's `client_max_body_size 10M` on `/`, and the same sidecar auto-configures a `/upload-and-scan` bypass at `2304M` proxying direct to `cdp-uploader`. Our fix is a routing change (form action to `/upload-and-scan/<uploadId>`) plus the frontend/backend refactor to move `/initiate` off the backend and let cdp-uploader's callback create the record.

**Recommendation:** raise one follow-up implementation ticket for the byte-proxy teardown and the frontend cleanup. Backend ownership authz on notification endpoints is a **hard go-live prerequisite** — separately tracked as required work but not blocking on this ticket's shape.

## AC coverage

| AC | Status | Where |
|---|---|---|
| **AC1** — prove the flow no-JS with a >10 MB file | ✅ green | Test D in `accompanying-documents-large-uploads.spec.ts` uploads 50 MB with JS disabled. The upload form itself is a plain multipart POST to `/upload-and-scan/{uploadId}` — no client-side JS on the submit path. Post-upload the browser lands directly on `/accompanying-documents` which renders the pending upload row on first paint. Manual "Refresh virus scan status" link covers polling — no meta-refresh anywhere in the flow. Multi-tab E2E test proves two tabs don't step on each other. |
| **AC2** — frontend cdp-uploader enablement | ✅ done | Frontend `src/config/config.js` `cdpUploader` block: baseUrl, s3Bucket, maxFileSize (50 MB), mimeTypes, redirectPath, callbackUrl. Wired in `docker/stack/frontend.compose.yml` for local. `initiateCdpUploaderSession` in `controller/get.js` calls `/initiate` server-side with the callback URL + `metadata: { correlationId, notificationReferenceNumber }`. |
| **AC3** — working-set lifecycle, state & persistence timing | ✅ decided + implemented | Full decision in [state-store-approaches.md](state-store-approaches.md). **Minimal Option 8 Path Y chosen** — see [Path X vs Path Y — where the cdp-uploader redirect lands](state-store-approaches.md#path-x-vs-path-y--where-the-cdp-uploader-redirect-lands). Frontend calls the backend register endpoint after cdp-uploader `/initiate`, backend writes a `PENDING` record immediately, and cdp-uploader's redirect target is `/accompanying-documents` — no wait page. Callback still transitions `PENDING → COMPLETE / REJECTED` on scan result (two-state model retained; expansion to the full state machine is a follow-up extension). Multi-tab safe by construction — each tab's register call creates its own record; no cross-tab filter needed. |
| **AC4** — plan the re-architecture | ✅ documented | Deferred cleanup enumerated in [findings.md](findings.md#deferred-cleanup---for-the-follow-up-ticket), 5 subsections with file:location targets ready for the follow-up ticket. |
| **AC5** — recommendation + raise the ticket | ✅ this doc + follow-up ticket | See "Recommended follow-up implementation" below. |

## Design decisions locked in

Made during the spike and not open for re-litigation in the follow-up ticket (unless new evidence surfaces):

1. **Direct-to-uploader flow, not backend byte-proxy.** Per AC4's language. Backend loses `POST /document-uploads/{uploadId}/file`; `DocumentService.initiate` (which called cdp-uploader `/initiate`) is moved to the frontend; backend retains persist + status + download + delete.
2. **Register-then-callback (minimal Option 8 Path Y).** Frontend calls the backend register endpoint immediately after cdp-uploader `/initiate` with `{ uploadId, correlationId }`; backend writes a `PENDING` `AccompanyingDocument` record on that call. The scan-result callback later transitions the same record to `COMPLETE / REJECTED`. Under this shape the record exists from the moment the form is submitted, not from the moment the callback lands — so `/accompanying-documents` can render the "Checking" tag on first paint without a wait page. Full progression to state-machine / confirm-endpoint / TTL-sweeper is documented as an incremental extension (see [state-store-approaches.md § Building from minimal Path Y to full Option 8](state-store-approaches.md#building-from-minimal-path-y-to-full-option-8)).
3. **Metadata sourced from `payload.form.*` on the callback.** cdp-uploader's README documents that text form fields the browser submits are preserved verbatim in `form.*`; backend reads `documentType` / `documentReference` / `dateOfIssue` from there. Every required field is enforced — missing/invalid values throw `BadRequestException`.
4. **correlationId identifies each browser tab's upload.** Frontend mints a UUIDv4 at `/initiate` time and threads it through `metadata.correlationId` (for the callback) and the register-call body (so the backend can correlate the register record with the eventual callback). Backend `AccompanyingDocumentDto` exposes it for downstream audit; **no longer used to filter a wait page's docs list** because the wait page no longer exists.
5. **No wait page.** cdp-uploader's redirect target is `/accompanying-documents` directly, not `/upload-successful`. The docs page renders the `PENDING` record with a `Checking` tag on first paint (because the register call put it there) and uses the existing manual "Refresh virus scan status" link pattern for polling — matching the pattern already in use for post-callback pending states. This eliminates the WCAG 3.2.5 (AAA) failure and screen-reader disorientation flagged by review item #15 by removing meta-refresh from the flow entirely.
6. **Two Path Y controller guards.** Post-upload UX depends on `/accompanying-documents` responding fast enough to be perceived as immediate feedback. Two small guards keep the failure surface aligned with the deleted wait page's inherent robustness: (a) when `documentClient.list` errors, render an explicit "Your upload was received and is being processed" notification banner instead of the silent empty-list degradation; (b) decouple `cdpUploaderClient.initiate` from the docs-list render — if `/initiate` fails, disable the Add form with an inline error while the docs list still renders. See [state-store-approaches.md § Path X vs Path Y](state-store-approaches.md#path-x-vs-path-y--where-the-cdp-uploader-redirect-lands) for the analysis these guards address.
7. **Fix 1 minimum-viable** for the size-guard removal (Option A). Client-side preflight fed off `maxFileSize` was stripped from the view model; server-side machinery (hapi `maxBytes`, `handleOversizePayload`, validation.js) is left standing but **unreachable** because the form action targets `/upload-and-scan/<uploadId>` — nothing routes to the old POST handler. Full deletion is part of the follow-up ticket's teardown.

## Recommended follow-up implementation ticket

**One ticket** covering byte-proxy teardown + Option 8 stretch + `/notification-view` hardening. Auth middleware is a hard go-live prerequisite but its own separate work stream (below).

### Scope

**Frontend (`trade-imports-animals-frontend`):**

Full removal enumeration in [findings.md § Deferred cleanup — Frontend](findings.md#frontend--old-backend-proxied-post-flow-dead-under-option-3). Highlights:

- Delete the `POST /accompanying-documents` route + handler + `controller/post/*` module tree + `handleOversizePayload` extension.
- Delete the `GET /accompanying-documents/status` route + `controller/status.js` + client-side JS polling in `client/javascripts/accompanying-documents.js`.
- Delete the size-guard machinery left standing by fix 1 (constants in `document-upload-config.js`, `maxFileSize`/`maxFileSizeLabel` fields on the view model, `data-max-file-size` attribute in `add-document-form.njk`, the "Max file size 10 MB" hint text).
- Delete `sessionKeys.documents`; audit remaining reads of yar for accompanying-document state.
- **Minimal Option 8 Path Y is landed in this spike** — register endpoint refit, wait-page deletion, docs-page fallback guard, and `initiate`-decoupling guard are all in. The follow-up ticket's Option-8 work is now the *incremental extension*: state-machine split (`COMPLETE` → `READY / PERSISTED`), `POST .../confirm` endpoint, opportunistic confirm-on-docs-page-load, and (optional operational hardening) lazy-poll + TTL sweeper. See [state-store-approaches.md § Building from minimal Path Y to full Option 8](state-store-approaches.md#building-from-minimal-path-y-to-full-option-8) for the ordered extension steps.

**Backend (`trade-imports-animals-backend`):**

Full removal enumeration in [findings.md § Deferred cleanup — Backend](findings.md#backend--byte-proxy-teardown). Highlights:

- Delete `POST /document-uploads/{upload-id}/file` byte-proxy + `DocumentService.proxyFileToUploader`.
- `DocumentService.initiate` has been refit for minimal Option 8 Path Y — accepts `{ uploadId, correlationId }` from the frontend and creates a `PENDING` record; the cdp-uploader call within it is removed. Follow-up work: rename to `registerPending` and expand as the state machine grows.
- `POST /notifications/<ref>/document-uploads` register endpoint stays (refit in this spike).
- Delete `CdpUploaderClient.initiate` / `.uploadFile` if only used by the removed byte-proxy endpoints.
- HMAC-authenticate the scan-result callback endpoint (`EUDPA-35`, tracked separately but bundled here because it touches the same file). Spec HMAC in cdp-uploader lands as a separate CDP platform effort — the backend side is ready when the platform side is.

**`/notification-view/{ref}` frontend hardening:**

Currently `notificationClient.get()` populates yar with victim's fields on visiting `/notification-view/<victim-ref>` — see [findings.md § Pre-existing auth gaps](findings.md#pre-existing-auth-gaps-surfaced-by-the-state-store-discussion). Even with backend authz on document endpoints, this poisoning primitive is worth removing for defence-in-depth: don't populate yar without validating the caller owns the notification (backend response would need an owner claim to compare against).

**E2E test inversions:**

Enumerated in [findings.md § E2E test inversions](findings.md#e2e-tests--assertion-inversions-and-skip-reason-updates). Broad shape: the size-limit specs that today assert "rejected at 10 MB + 1 byte" invert to assert success; the `skipIfComposeEnvironment` skip reason on the 11 MiB test is now false as of step 1's sidecar.

### Not in scope for this follow-up ticket

- **Backend ownership authz middleware.** Hard go-live prerequisite, see below. Separate work stream. Both the callback (bypassing frontend) and the direct persist endpoint need it — the shape of the auth integration determines what other endpoints look like, so this needs to land first.
- **Two-step form flow for metadata capture at page-render time.** Not needed — cdp-uploader's callback carries the form fields, so metadata timing is handled server-side without a UX change.
- **cdp-uploader callback HMAC (EUDPA-35).** Already tracked separately, blocked on platform support.
- **Orphan cleanup infrastructure.** cdp-uploader has no delete; scanned files reach S3 before the record is confirmed. Recommendation: **tag-on-write** (backend writes an `unclaimed` tag when it hasn't seen a callback confirming the doc within N hours) + S3 lifecycle rule to sweep tagged objects. Backend already has S3 access. Scoped as a follow-up-of-the-follow-up unless it blocks go-live volume expectations.

## Go-live prerequisites (out of this ticket's scope, but required before production)

These block go-live regardless of the direct-to-uploader flow. Called out here so nothing gets missed.

1. **Backend ownership authz on document endpoints.** Currently `POST /notifications/<ref>/document-uploads` and every peer accepts any authenticated caller with no ownership check. Direct-to-uploader flow doesn't fix or worsen this — it inherits the same primitive. Auth middleware verifying the logged-in user owns the notification in the URL path is a hard prerequisite. Full detail in [findings.md § Pre-existing auth gaps](findings.md#pre-existing-auth-gaps-surfaced-by-the-state-store-discussion).
2. **HMAC verification on the scan-result callback (EUDPA-35).** Already tracked separately, blocked on cdp-uploader platform support. Applies to today's production flow, will apply to the direct-to-uploader flow.
3. **Frontend `/notification-view` hardening.** Companion to (1) — don't poison yar without verifying ownership.

None of the three is a spike-scope concern; the spike works around them by relying on the same trust primitives the current production flow relies on.

## Verification evidence

- **Test D (single-tab happy path):** `/upload-and-scan → cdp-uploader → callback → backend record → frontend list → docs page` uploads 50 MB in ~7 seconds. Green in three consecutive runs against the workspace stack. See `tests/e2e/features/accompanying-documents-large-uploads.spec.ts:16`.
- **Multi-tab happy path:** two browser tabs on the same notification, each uploading their own 50 MB file, both end up on `/accompanying-documents` seeing their own file tagged Safe. Green. Directly verifies the correlationId filter's multi-tab safety. See `tests/e2e/features/accompanying-documents-large-uploads.spec.ts:41`.
- **View file (download) path:** `accompanying-documents-view.spec.ts` — asserts the View file link on a `Safe` doc downloads the original bytes, and that the link is not rendered on `REJECTED` docs. Includes an href regression guard checking the URL does not leak the callback URL's `pending` placeholder segment (see the item-2 note in [findings.md § AC3 pivot](findings.md#ac3-state-store-decision--pivot-from-option-3-to-minimal-option-8-path-y)). Required-green as part of spike close-out.
- **Full `accompanying-documents-*.spec.ts` family:** the whole per-feature spec family runs green against the local stack via `npm run test:docker-compose -- accompanying-documents`. Broader than just `large-uploads` — the download, file-types, no-JS, removal, and file-size-limit specs share the same upload/callback plumbing and each surfaces distinct regressions. Required-green as part of spike close-out.
- **Frontend unit tests:** 684/684 green. Six dedicated tests on `GET /accompanying-documents/upload-successful` covering the correlationId match, multi-tab guard, meta-refresh URL construction, give-up-on-MAX behaviour, soft-fail on backend list error, defensive missing-correlationId behaviour. Download ownership check re-sourced from backend list (was reading an empty yar slot); tests cover happy path, unknown uploadId, no session referenceNumber, and fail-closed on backend list throw.
- **Backend unit tests:** 354/354 green. `DocumentServiceTest.HandleScanResult` covers the create-or-update branch, missing/invalid metadata handling (7 BadRequestException cases), and file-status resolution. New `DocumentTypeTest` and dedicated `RequireCallbackField` + `ParseIssueDate` unit tests cover the helpers directly.

## Appendices

- [findings.md](findings.md) — running log of everything learned during the spike, including the deferred-cleanup enumeration for the follow-up ticket, the pre-existing auth gaps, and the wait-page design trade-offs.
- [state-store-approaches.md](state-store-approaches.md) — full analysis of the seven state-store options, the decision (Option 3-with-callbacks primary, Option 8 stretch), the concrete Option 8 detail if the follow-up wants the register-call UX.

## Estimated effort for the follow-up ticket

Ballpark, for a single-engineer implementation with the spike code as reference:

- **Frontend cleanup + Option 8 register:** ~3-5 days. Bulk is deleting dead paths + updating tests, plus the register-call plumbing if Option 8 lands.
- **Backend byte-proxy teardown:** ~2-3 days. Endpoint deletions + `DocumentService` refit + associated test updates.
- **E2E assertion inversions:** ~1-2 days.
- **`/notification-view` hardening:** ~1 day.
- **Total:** ~1-2 weeks including PR reviews across three repos + cross-repo branch coordination.

Assumes the backend authz work is happening in parallel or has already landed. If it hasn't, that's a separate ~1 week for the middleware + integration.
