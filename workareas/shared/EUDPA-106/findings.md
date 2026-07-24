# EUDPA-106 spike — findings

Running log of things learned during implementation that don't fit the initial plan cleanly. Feeds into the final `recommendation.md` and the follow-up implementation ticket. Update as new discoveries land.

## Enforcement chain for the old upload path

The current `POST /accompanying-documents` route enforces the 10 MB cap at four layers, only the first of which fires for a browser-driven request today. Discovered while scoping fix 1 (step 2 in the plan).

For a 50 MB upload attempt via the old form action, once the sidecar from step 1 is in place, the layers fire in this order:

| Order | Layer | File | What it does |
|-------|-------|------|--------------|
| 1 | Client-side preflight (JS) | `page-model.js:84-86` feeds `maxFileSize` / `oversizeFileMessage` into the view model consumed by client JS | Alerts, no form submit. **Currently the only layer the test hits.** |
| 2 | Nginx sidecar (added by step 1) | `docker/stack/config/nginx/frontend.conf` (`client_max_body_size 10M` on `/`) | Returns nginx 413 HTML page. Would fire if layer 1 removed. |
| 3 | Hapi route `maxBytes` + `handleOversizePayload` | `index.js:78` + `index.js:12-41` | Boom 413 caught by onPreResponse, renders the oversize form. Unreachable for >10 MB requests once layer 2 catches them. |
| 4 | Server-side validation | `controller/post/validation.js:54-55` | Only fires in the tight window between MAX_FILE_SIZE_BYTES and MAX_PAYLOAD_BYTES (~10 MB..10 MB + 1 KB). Never fires for 50 MB. |

## Constants blast radius

`document-upload-config.js` exports six size-related identifiers that are consumed across four files. The plan assumed they were self-contained; they aren't.

| Constant | Consumers |
|---|---|
| `MAX_FILE_SIZE_MB` (unexported) | Feeds `MAX_FILE_SIZE_BYTES`, `MAX_FILE_SIZE_LABEL` |
| `MAX_FILE_SIZE_BYTES` | `page-model.js:84`, `validation.js:54`, `upload.js:22` |
| `MAX_FILE_SIZE_LABEL` | `page-model.js:85` |
| `OVERSIZE_FILE_MESSAGE` | `page-model.js:86`, `validation.js:55`, `views.js:76-77` |
| `MULTIPART_OVERHEAD_BYTES` (unexported) | Feeds `MAX_PAYLOAD_BYTES` |
| `MAX_PAYLOAD_BYTES` | `index.js:78` |

Removing all six requires editing at least six files. For a spike PR, that's a lot of blast radius that mostly duplicates what the follow-up implementation ticket will do anyway when it removes the old path entirely.

## Fix 1 — chosen approach: minimal (Option A)

Rather than the full deletion the plan called for, fix 1 removes **only the client-side preflight feed** — enough to flip test D's failure mode from "client alert" to "nginx 413", which is the diagnostic value the plan wanted. Everything else stays for now.

The rest of the cleanup — deleting the constants, removing hapi `maxBytes`, deleting `handleOversizePayload`, deleting `oversizeFileView`, purging validation.js checks, updating templates, deleting or inverting existing tests that assert 10 MB rejection — is deferred to the follow-up implementation ticket, where it lands naturally alongside removing the old POST route entirely.

## Nginx sidecar caches upstream IP — recreate frontend requires nginx restart

Discovered while verifying step 3. `docker compose up -d --force-recreate` on the frontend service gives the container a fresh IP. The sidecar's nginx worker resolves `trade-imports-animals-frontend:3000` **once at startup** and caches the result, so requests through nginx to a recreated frontend fail with `502 Bad Gateway` / `Host is unreachable` even though the frontend container itself is healthy and reachable from `docker exec`.

Workaround for the spike: `docker restart <sidecar>` after any frontend recreate. Cleaner fix for the follow-up ticket or a workspace chore:
- Add a `resolver 127.0.0.11 valid=5s;` directive to the nginx config and use a variable in `proxy_pass` (e.g. `set $upstream "http://trade-imports-animals-frontend:3000"; proxy_pass $upstream;`) so nginx re-resolves DNS at request time instead of caching at worker init.

Impacted local dev loops for anyone iterating on the frontend service; not a production concern (CDP's sidecar has its own reload cadence).

## Pre-commit hook glob is too permissive (frontend repo)

Discovered while committing fix 1. `npm run format:check` (invoked by the frontend repo's husky `pre-commit` hook) runs `prettier --check "src/**/*.js" "**/*.{js,cjs,md,json,config.js,test.js}"`. The second glob sweeps up **untracked** JS/JSON/MD files anywhere in the working tree — including artifacts from Playwright's HTML report (minified trace-viewer bundles under `playwright-report/`) — and fails the commit if they're not Prettier-formatted.

The immediate fix is to add `playwright-report/` to `.gitignore` (done on this branch alongside fix 1). `test-results/` was already ignored — this is its natural companion.

Broader observation for the follow-up ticket or a separate chore:
- The `format:check` glob shouldn't include untracked-output directories at all. Either use lint-staged style tracked-only filtering, or explicitly restrict globs to source dirs (`src/**` + `tests/**` + top-level config files). Not a spike deliverable, but worth surfacing.

## cdp-uploader /status URL needs server-side host rewrite

The `statusUrl` returned by `POST /initiate` is absolute against cdp-uploader's own host binding (e.g. `http://localhost:7337/status/<uploadId>`) — a URL shaped for the **browser** to follow. Server-side polling (from the frontend container) hits its own loopback and the fetch fails.

Spike workaround (in `cdp-uploader-client.js:getStatus`): parse the returned `statusUrl`, keep the pathname + search, and prepend the configured `cdpUploaderBaseUrl` before fetching. Follow-up ticket should either (a) surface this in a shared helper, or (b) request cdp-uploader emit a relative statusUrl (or two — one for the browser, one for server-side).

## cdp-uploader's /status DOES expose the multipart form fields

Discovered while diagnosing test D. The `/status/<uploadId>` response includes a `form` object populated with every non-file field the browser sent to `/upload-and-scan`:

```json
{
  "uploadStatus": "ready",
  "form": {
    "documentType": "ITAHC",
    "documentReference": "TARGET50MB01",
    "issueDate-day": "24", "issueDate-month": "01", "issueDate-year": "2026",
    "file": { "filename": "target-50mb.pdf", "contentType": "application/pdf", ... }
  }
}
```

**Implication:** the "metadata is lost when the browser POSTs directly to cdp-uploader" concern is unfounded — cdp-uploader preserves it. The follow-up ticket can and should read documentType/documentReference/dateOfIssue from `status.form.*` on the /upload-successful landing rather than doing a two-step form or per-doc /initiate-with-metadata.

The spike currently uses hardcoded metadata (`documentType: 'ITAHC'`, `documentReference: 'SPIKE-UPLOAD'`, `dateOfIssue: today`) in `upload-successful.js:commitToDocumentsList` because test D doesn't assert on metadata — real capture is a small follow-up edit, not an architectural change.

## State-store design — session-scoped, uploadId-keyed yar

Chosen shape for step 5, after ruling out three alternatives.

**Design:** in-flight upload state lives in yar under keys of the form `upload:<uploadId>`. The value is `{ notificationRef, statusUrl, createdAt, scanStatus }`. On `/upload-successful?uploadId=A`, the handler reads `request.yar.get('upload:A')`, polls cdp-uploader for status, and on `ready` persists the doc via the backend using the yar-carried `notificationRef` before dropping the entry.

**Alternatives considered and rejected:**

| Design | Why not |
|---|---|
| yar single slot (`currentUpload`) — spike's step-4 code | Multi-tab collision: Tab 2's `/initiate` overwrites Tab 1's slot; Tab 1's upload lands on `/upload-successful` but reads Tab 2's state. Real bug, invisible in single-tab test D. |
| `server.app.cache` segment keyed by uploadId | No cookie scoping: a rogue authenticated user with a leaked uploadId can hit `/upload-successful?uploadId=<victim>` from their own session and cause the victim's file to commit against the victim's notification. yar's cookie-scoping closes this at the frontend without waiting for backend authz. |
| URL-carried `notificationRef` | Fully user-tamperable given today's backend has no ownership check — attacker's file trivially lands on any notification whose ref they know. See "Pre-existing auth gaps" below. |
| yar keyed by `notificationId` (user's initial suggestion) | Better than the single-slot but still collides on multi-tab-same-notification, which is a real workflow (open a second tab to upload extra docs faster). uploadId-keyed handles this. |

**Load-bearing properties of the chosen shape:**

- **Session-cookie ambient auth.** Every read/write happens through `request.yar`, which yar transparently scopes to the caller's session cookie. An attacker without the victim's cookie cannot read or write the victim's upload state — even if they know the uploadId.
- **Per-upload isolation.** Each `/initiate` mints a distinct uploadId; entries under `upload:A` and `upload:B` never collide. Multi-tab safe both for different notifications *and* same-notification.
- **No cache write actually strictly needed for `statusUrl`** — it's reconstructible as `${cdpUploader.baseUrl}/status/${uploadId}`. The load-bearing datum in the value is `notificationRef`, which has to come from server-side state to prevent URL tampering (see auth-gap discussion). Storing `statusUrl` and `createdAt` alongside is convenience, not correctness.

**Trade-offs / limits to name:**

- **Still needs backend authz for full safety** — see "Pre-existing auth gaps" below. yar-scoping closes the "attacker with uploadId, no cookie" attack but not the "attacker with own cookie, poisoned wizard state" attack chain.
- **Callback-driven design is closed off** while state lives in yar — a cdp-uploader callback carries no cookie and can't reach yar. Sticking to polling remains fine for the spike; if the follow-up ticket adopts callbacks it would need to migrate `notificationRef` to `server.app.cache` under uploadId. Cheap migration when the time comes.

## Pre-existing auth gaps surfaced by the state-store discussion

Two vulnerabilities exist in `main` today, unrelated to EUDPA-106's code changes but relevant to the state-store discussion because they constrain what "safe" client-side plumbing means. **Not introduced by the spike** — surfaced by asking "can we simplify the state store?" and discovering that the ambient assumption (backend enforces ownership) doesn't hold.

### Vector 1 — URL-poisoning via `/notification-view/{ref}`

`src/server/notification-view/controller.js:14-19` reads `referenceNumber` from `request.params` and passes it to `notificationClient.get(request, referenceNumber, traceId)`. That client method (`notification-client.js:404-431`) fetches the notification from the backend and calls `setNotificationSessionValues(request, notification)`, which loops through `NOTIFICATION_SESSION_KEYS` (line 249-259 — includes `referenceNumber`, `commodity`, `consignor`, `consignee`, `importer`, `destination`, `cphNumber`, etc.) and calls `setSessionValue(request, key, notification[key])` for each.

Consequence: visiting `/notification-view/VICTIM_REF` as any authenticated user overwrites *their own* yar with victim's notification-in-progress state. Then any downstream wizard page, including `/accompanying-documents` and both the current-main and my spike upload flows, treats the caller's session as if it's editing the victim's notification.

### Vector 2 — Backend accepts any authenticated caller

`DocumentController.java` (initiate, list, get, delete) and its peers take path parameters and proceed. No Spring Security annotations anywhere in the backend; `User-Id` is captured as a header for audit only, never checked for ownership. `EUDPA-35` comment at `DocumentController.java:157-159` explicitly acknowledges the callback endpoint is unauthenticated; the broader gap on the CRUD endpoints is implied by omission.

### End-to-end attack (works today, on main, no changes)

1. Attacker signs in with any legitimate Defra ID account.
2. Attacker visits `/notification-view/GBN-AG-26-VICTIM` — their yar is poisoned with victim's referenceNumber.
3. Attacker navigates to `/accompanying-documents`, fills the form, uploads a file.
4. Frontend reads `yar['referenceNumber']` = VICTIM, calls backend to persist.
5. Backend accepts (no ownership check).
6. Attacker's file is now attached to victim's notification.

### Testable

The workspace has a Defra ID stub and multi-user auth fixtures. An E2E can prove the vector in a few lines. **Recommended: don't write it in this ticket** — the test only earns its keep once the fix is in (protects against regression), and starting-red-on-main-and-turning-green-in-a-follow-up-ticket is the wrong shape for a landing merge. Test lives with the fix, in the follow-up implementation ticket.

### Recommendation for the follow-up ticket

- Backend: add real ownership checks — either Spring Security wiring for `POST /notifications/<ref>/documents` (and peers) or an inline `assertUserOwnsNotification(ref, userId)` helper. Natural work to bundle with the byte-proxy removal that AC4 already prescribes.
- Frontend: defence-in-depth — `notification-view` should only populate yar if the backend response confirms the caller owns the notification. Requires the backend to include an owner identity in the response and the frontend to compare; adds a check, doesn't add complexity.
- E2E: add the multi-user "attach to someone else's notification is rejected" test in the same commit as the backend fix.

## Deferred cleanup — for the follow-up ticket

When the follow-up ticket removes the old POST route + backend byte-proxy, it should also clean up the frontend size-guard machinery left behind by the spike:

- [ ] Delete `MAX_FILE_SIZE_MB`, `MAX_FILE_SIZE_BYTES`, `MAX_FILE_SIZE_LABEL`, `OVERSIZE_FILE_MESSAGE`, `MULTIPART_OVERHEAD_BYTES`, `MAX_PAYLOAD_BYTES` from `document-upload-config.js`.
- [ ] Remove `maxBytes: MAX_PAYLOAD_BYTES` from the old route in `index.js` (or delete the whole POST route as part of the byte-path removal).
- [ ] Delete `handleOversizePayload` from `index.js` — no longer needed once the byte upload doesn't go through hapi.
- [ ] Delete `oversizeFileView` from `controller/post/views.js`.
- [ ] Remove the size check in `controller/post/validation.js:50-55`.
- [ ] Remove `maxFileSize`/`maxFileSizeLabel`/`oversizeFileMessage` from `controller/post/upload.js:22` and `controller/page-model.js:84-86` if not already dropped by fix 1.
- [ ] Update the "Max file size 10 MB" hint in the template — either to reflect the new cdp-uploader `CDP_UPLOADER_MAX_FILE_SIZE` (50 MB) or remove entirely if the new flow makes it redundant.
- [ ] Existing E2E tests to invert or delete:
  - `accompanying-documents-file-size-limit.spec.ts:37` — client-side preflight test (assertion inverts to success after fix).
  - `accompanying-documents-file-size-limit.spec.ts:52` — 11 MiB "not raw nginx 413" test; assertion becomes moot since `/upload-and-scan` bypasses the sidecar cap.
  - `accompanying-documents-no-js.spec.ts:60,78` — server-side 10 MB rejection tests; inverts to success.
- [ ] The existing 11 MiB test's `skipIfComposeEnvironment('Compose stack has no nginx ingress in front of the frontend pod.')` skip reason is now false as of workspace step 1 — Compose has the sidecar. Either remove the skip or update the reason.
- [ ] Frontend unit tests for the deleted files — `validation.test.js`, `views.test.js`, `page-model.test.js`, `controller.test.js` all likely have assertions that will fail once the machinery is removed. Update or delete accordingly.
