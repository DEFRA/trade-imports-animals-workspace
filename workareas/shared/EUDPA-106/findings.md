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
