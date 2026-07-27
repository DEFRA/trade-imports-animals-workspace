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
| **AC1** — prove the flow no-JS with a >10 MB file | ✅ green | Test D in `accompanying-documents-large-uploads.spec.ts` uploads 50 MB with JS disabled. The upload form itself is a plain multipart POST to `/upload-and-scan/{uploadId}` — no client-side JS on the submit path. The post-redirect wait page polls via `<meta http-equiv="refresh">` — no client-side JS on the polling path either. Multi-tab E2E test proves two tabs don't step on each other. |
| **AC2** — frontend cdp-uploader enablement | ✅ done | Frontend `src/config/config.js` `cdpUploader` block: baseUrl, s3Bucket, maxFileSize (50 MB), mimeTypes, redirectPath, callbackUrl. Wired in `docker/stack/frontend.compose.yml` for local. `initiateCdpUploaderSession` in `controller/get.js` calls `/initiate` server-side with the callback URL + `metadata: { correlationId, notificationReferenceNumber }`. |
| **AC3** — working-set lifecycle, state & persistence timing | ✅ decided + implemented | Full decision in [state-store-approaches.md](state-store-approaches.md). Option 3-with-callbacks chosen: backend record created by cdp-uploader's scan-result callback (no register call from frontend); frontend `/upload-successful` is a lightweight wait-and-poll page that filters the backend docs list by the tab's own correlationId (multi-tab safe). Option 8 (register + confirm) captured as a follow-up stretch for the "checking your file" UX during scan delays. |
| **AC4** — plan the re-architecture | ✅ documented | Deferred cleanup enumerated in [findings.md](findings.md#deferred-cleanup---for-the-follow-up-ticket), 5 subsections with file:location targets ready for the follow-up ticket. |
| **AC5** — recommendation + raise the ticket | ✅ this doc + follow-up ticket | See "Recommended follow-up implementation" below. |

## Design decisions locked in

Made during the spike and not open for re-litigation in the follow-up ticket (unless new evidence surfaces):

1. **Direct-to-uploader flow, not backend byte-proxy.** Per AC4's language. Backend loses `POST /document-uploads/{uploadId}/file`; `DocumentService.initiate` (which calls cdp-uploader `/initiate`) is moved to the frontend; backend retains persist + status + download + delete.
2. **Callback creates the backend record.** `DocumentService.handleScanResult` now does `.orElseGet(buildDocumentFromScanResult(...))` — under the direct-to-uploader flow the frontend doesn't pre-register anything, so the callback is the first sighting of the upload. See [state-store-approaches.md](state-store-approaches.md#option-8--full-detail) for the Option 8 alternative (register call for in-flight UX) and why it's a stretch, not a prereq.
3. **Metadata sourced from `payload.form.*` on the callback.** cdp-uploader's README documents that text form fields the browser submits are preserved verbatim in `form.*`; backend reads `documentType` / `documentReference` / `dateOfIssue` from there. Every required field is enforced — missing/invalid values throw `BadRequestException`.
4. **correlationId identifies each browser tab's upload.** Frontend mints a UUIDv4 at `/initiate` time, threads it through `metadata.correlationId` (for the callback) and the redirect URL `?corr=<uuid>` (for the wait page). Backend `AccompanyingDocumentDto` exposes `correlationId` so the frontend can filter the list.
5. **Wait page polls the backend, not cdp-uploader.** `/upload-successful` handler does `documentClient.list(referenceNumber)` and looks for a matching correlationId. Meta-refresh at 2s intervals, 10-attempt ceiling (20s). If callback never lands, the user still bails out to `/accompanying-documents`.
6. **Fix 1 minimum-viable** for the size-guard removal (Option A). Client-side preflight fed off `maxFileSize` was stripped from the view model; server-side machinery (hapi `maxBytes`, `handleOversizePayload`, validation.js) is left standing but **unreachable** under Option 3 because the form action targets `/upload-and-scan/<uploadId>` — nothing routes to the old POST handler. Full deletion is part of the follow-up ticket's teardown.

## Recommended follow-up implementation ticket

**One ticket** covering byte-proxy teardown + Option 8 stretch + `/notification-view` hardening. Auth middleware is a hard go-live prerequisite but its own separate work stream (below).

### Scope

**Frontend (`trade-imports-animals-frontend`):**

Full removal enumeration in [findings.md § Deferred cleanup — Frontend](findings.md#frontend--old-backend-proxied-post-flow-dead-under-option-3). Highlights:

- Delete the `POST /accompanying-documents` route + handler + `controller/post/*` module tree + `handleOversizePayload` extension.
- Delete the `GET /accompanying-documents/status` route + `controller/status.js` + client-side JS polling in `client/javascripts/accompanying-documents.js`.
- Delete the size-guard machinery left standing by fix 1 (constants in `document-upload-config.js`, `maxFileSize`/`maxFileSizeLabel` fields on the view model, `data-max-file-size` attribute in `add-document-form.njk`, the "Max file size 10 MB" hint text).
- Delete `sessionKeys.documents`; audit remaining reads of yar for accompanying-document state.
- **(Stretch, Option 8)** Add register call: after `/initiate`, `POST /notifications/<ref>/document-uploads` to backend with `{ uploadId, correlationId, statusUrl }`. Rewrite `/upload-successful` to render a notification-level status dashboard (Checking / Safe / Rejected tags for each pending doc). Gains the "checking your file" UX during scan delay.

**Backend (`trade-imports-animals-backend`):**

Full removal enumeration in [findings.md § Deferred cleanup — Backend](findings.md#backend--byte-proxy-teardown). Highlights:

- Delete `POST /document-uploads/{upload-id}/file` byte-proxy + `DocumentService.proxyFileToUploader`.
- Delete `DocumentService.initiate` (was calling cdp-uploader; frontend does now).
- Delete `POST /notifications/<ref>/document-uploads` initiate endpoint (unless retained for Option 8's register endpoint — in which case refit to accept `{ uploadId, correlationId }` and skip the cdp-uploader call).
- Delete `CdpUploaderClient.initiate` / `.uploadFile` if only used by the removed endpoints.
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
- **Frontend unit tests:** 683/683 green. Six dedicated tests on `GET /accompanying-documents/upload-successful` covering the correlationId match, multi-tab guard, meta-refresh URL construction, give-up-on-MAX behaviour, soft-fail on backend list error, defensive missing-correlationId behaviour.
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
