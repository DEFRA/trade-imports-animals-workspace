# EUDPA-106 — state-store approaches for the direct-to-uploader flow

Reference sheet for the design discussion on step 5 of the EUDPA-106 spike (frontend refactor to allow >10 MB uploads).

## Context

The spike proves the `browser → /upload-and-scan → cdp-uploader` direct flow. When cdp-uploader receives the file it returns a 302 to a static redirect URL configured at `/initiate` time. Our `/upload-successful` handler needs to identify **which upload** just landed so it can poll status, persist against the correct notification, and update the docs list.

The current step-4 implementation stores the in-flight upload as a single yar slot (`currentUpload`), which fails silently under multi-tab workflows. This document compares seven ways to structure that state.

**Assumed constants across all options:**
- User is already authenticated (Defra ID via hapi-auth-cookie).
- The CDP nginx sidecar (added by step 1 of this spike) is in place, bypassing the 10 MB cap on `/upload-and-scan`.
- `/initiate` is called on the accompanying-documents GET; the returned `uploadId`/`statusUrl` are handed off to the form.
- Metadata capture (documentType, documentReference, dateOfIssue) is handled by reading `status.form.*` from cdp-uploader post-scan — orthogonal to the state-store question.

## The seven approaches

| # | Approach | What lives where | uploadId → state lookup at /upload-successful |
|---|---|---|---|
| 1 | yar single slot (**current step 4 code**) | `yar['currentUpload'] = {uploadId, statusUrl, ...}` | Read yar's single slot; `notificationRef` comes from yar's separate `referenceNumber` |
| 2 | `server.app.cache` keyed by uploadId | `server.app.cache[uploadId] = {notificationRef, statusUrl, ...}` | uploadId from URL (via nginx rewrite) → cache |
| 3 | URL-carried `notificationRef` — no server-side state at all | Nothing stashed. Redirect includes notificationRef verbatim. | notificationRef from URL forwarded straight to backend |
| 4 | yar keyed by `notificationId` | `yar['upload:${notificationRef}'] = {uploadId, statusUrl}` | notificationRef from URL → yar |
| 5 | yar keyed by `uploadId` via nginx `proxy_redirect` (Option A) | `yar['upload:${uploadId}'] = {notificationRef, statusUrl}` | uploadId from URL (nginx appends `?uploadId=` to cdp-uploader's static redirect) → yar |
| 6 | yar keyed by `notificationRef` in URL (Option B) | `yar['upload:${notificationRef}'] = {uploadId, statusUrl}`. Redirect set at /initiate to `?notificationRef=<ref>`. | notificationRef from URL → yar |
| 7 | yar keyed by server-generated token in URL (Option C) | `yar['upload:${uploadToken}'] = {uploadId, notificationRef, statusUrl}`. Redirect set at /initiate to `?token=<uuid>`. | token from URL → yar |

## Functional + security comparison

| # | Multi-tab, different notifications | Multi-tab, same notification (parallel uploads) | Cross-user attack (rogue authenticated user with a leaked identifier) | URL leaks |
|---|---|---|---|---|
| 1 | ❌ collides (second /initiate overwrites `currentUpload`) | ❌ collides (same reason) | ✅ safe (yar cookie-scoped) | none |
| 2 | ✅ works (distinct uploadIds → distinct keys) | ✅ works | ❌ vulnerable — rogue user hits `/upload-successful?uploadId=<victim>`, cache lookup succeeds cross-session, victim's ref is served, attacker's file → victim's notification. Requires leaked uploadId (UUIDv4, high entropy). | uploadId in URL (opaque) |
| 3 | ✅ works | ✅ works | ❌ trivially vulnerable — attacker just types `?notificationRef=<victim-ref>`; backend accepts (no ownership check). Requires guessing/knowing ref format (`GBN-AG-YY-XXXXX`). | notificationRef in URL (semantic) |
| 4 | ✅ works | ❌ collides (both tabs write `yar['upload:${sharedRef}']`) | ✅ safe (yar cookie-scoped) | notificationRef in URL (semantic) |
| 5 | ✅ works | ✅ works | ✅ safe (yar cookie-scoped) | uploadId in URL (opaque) |
| 6 | ✅ works | ❌ collides (both tabs write `yar['upload:${sharedRef}']`) | ✅ safe (yar cookie-scoped) | notificationRef in URL (semantic) |
| 7 | ✅ works | ✅ works (each GET mints its own token) | ✅ safe (yar cookie-scoped) | token in URL (opaque, per-request) |

## Explicitness / discoverability (how easy to trace by reading code)

| # | Traceable in frontend code alone? | Notes |
|---|---|---|
| 1 | ✅ fully — `get.js` sets, `upload-successful.js` reads | but silently buggy under multi-tab |
| 2 | ⚠️ partial — needs nginx sidecar rewrite too, plus new `server.cache()` segment at server-init | |
| 3 | ✅ fully — but the "state" is just URL params, no store to read | |
| 4 | ✅ fully | |
| 5 | ❌ requires reading `docker/stack/config/nginx/frontend.conf` to understand where uploadId comes from | spooky action at a distance |
| 6 | ✅ fully — redirect URL construction is one line in `get.js` next to /initiate | |
| 7 | ✅ fully — token generation + storage + URL construction all in one block in `get.js` | |

## Concerns that apply to **all** approaches

These are orthogonal to the state-store choice — they would remain issues regardless of which approach lands, and they're captured in [findings.md](findings.md) as follow-up-ticket work.

- **Pre-existing URL-poisoning via `/notification-view/{ref}`.** Any authenticated user visiting `/notification-view/<VICTIM_REF>` populates *their own* yar with victim's notification fields (including `referenceNumber`, `commodity`, etc.). Downstream code — including any /initiate call — then treats their session as if editing the victim's notification. Attacker uploads → file lands on victim's notification, mediated by the attacker's own valid session. **Vector 1 of the auth gap.** Not introduced by any of the above designs.

- **Backend has no ownership authz.** `POST /notifications/<ref>/documents` and its peers accept any authenticated caller with no check that the caller owns the notification. **Vector 2 of the auth gap.** All seven designs eventually forward a notificationRef to that endpoint; whichever we pick, the file eventually lands wherever the frontend tells it to.

Neither is fixable in this ticket without significant scope creep. Both belong in the follow-up implementation ticket.

## Trade-off summary

- **Best functionality:** 5 or 7 (both handle every multi-tab case).
- **Most explicit:** 3, 4, 6, or 7 (fully readable in frontend JS alone).
- **Best both:** **7** (server-generated per-form token) — full multi-tab safety AND fully explicit AND doesn't leak refs into browser history/logs.
- **Worst:** 3 (URL-carried `notificationRef`, no store) — trivially exploitable given today's backend authz gap; not worth considering unless backend authz lands first.
- **Currently shipped:** 1 (single slot) — will collide silently under any multi-tab workflow.

## What changes if backend ownership authz were in place?

Suppose we had a working auth integration on the backend such that `POST /notifications/<ref>/documents` (and its peers) reject any request where the authenticated caller doesn't own the referenced notification. What would that change?

### Which options gain security safety they didn't have before

| # | Was vulnerable to | With backend authz |
|---|---|---|
| 2 | Rogue user with leaked uploadId hits `/upload-successful?uploadId=<victim>` — server reads victim's cached `notificationRef` and calls backend to persist attacker's file against victim. | ✅ **closed** — backend now rejects the persist call because the caller isn't the notification owner. Attacker's authenticated identity ≠ victim's identity, and there's no way to forge that (cookie-derived, not URL-derived). |
| 3 | Trivially — attacker types `?notificationRef=<victim>`, backend accepts. | ✅ **closed** — backend rejects for the same reason. Option 3 goes from "trivially exploitable" to "safe". |
| 1, 4, 5, 6, 7 | Already safe on this vector (yar cookie-scoping). | No change on this vector. |

### The pre-existing `/notification-view/{ref}` URL-poisoning vector also gets closed

The attack chain (attacker visits `/notification-view/VICTIM_REF` → their own yar gets poisoned with victim's fields → they upload → frontend forwards `referenceNumber=VICTIM` to backend on persist) **ends at the same backend authz check**. Attacker's identity ≠ victim's, backend rejects. Their yar can be poisoned all day; it doesn't matter because the backend won't act on the poisoned ref.

That's a big win: **backend authz alone closes both auth-gap vectors identified in findings.md** without any frontend changes required.

### Does the recommendation change?

**Not fundamentally, but the case for options 2 and 3 strengthens and the case for option 7's "extra security" weakens.**

- **Option 3 becomes viable** — no state store at all. The `notificationRef` in the URL is untrustworthy, but backend authz makes untrustworthy inputs safe by treating them as untrusted (which is what all backend inputs should be). The frontend becomes very simple: construct the redirect URL with `notificationRef`, on landing forward it straight to the backend. **Caveat:** as originally described, option 3 skips polling — but polling needs statusUrl, and statusUrl needs uploadId. So option 3 in practice becomes "put both `notificationRef` and `uploadId` in the URL, poll cdp-uploader server-side, persist via backend". That's essentially a stateless variant of option 5/7.
- **Option 2 becomes viable** — a clean `server.cache` segment for upload state, keyed by uploadId, still needs the nginx rewrite (or an equivalent path plumbing) to get uploadId onto the redirect URL. It's now safe, but doesn't gain a discoverability advantage over option 7.
- **Options 1, 4, 6 are still broken** on multi-tab functionality (nothing about backend authz fixes the frontend state collision).
- **Options 5 and 7 remain fully safe** — but the yar-cookie-scoping defence-in-depth is no longer load-bearing. It becomes belt-and-braces rather than sole line of defence.

### The key argument that survives regardless

**Option 7 is safe *whether or not* backend authz ever lands.**

Options 2 and 3 require backend authz to be safe. If we ship 2 or 3 in this ticket and the backend authz work slips or gets deprioritised, we've shipped a vulnerable frontend that trusts URL params. Option 7 has no such dependency — the yar-cookie-scoping does the heavy lifting frontend-side, and backend authz (when it lands) becomes additional protection rather than the load-bearing element.

For a **spike** in a codebase where the backend authz work isn't yet scheduled, that independence is valuable. If we were confident backend authz would land in the same release, options 2, 3, and 7 would be roughly equivalent on security and the choice would come down to code shape.

### Practical implication for the follow-up implementation ticket

If backend authz is expected to land alongside the direct-to-uploader work in the follow-up ticket, then either option 3 (simplest) or option 2 (cleanest architecturally) becomes attractive. Option 7 remains the safe default if there's any uncertainty about the auth-integration timing.

The auth-integration work should be treated as a **prerequisite** for options 2 and 3, and as **defence-in-depth** for options 5 and 7.

## Recommendation for the discussion

**Option 7 — server-generated per-form token.**

Framing:

- The token is a **frontend-owned identifier** for one form-render/upload cycle, opaque to cdp-uploader and stored in yar under `upload:<token>`.
- The redirect URL sent to cdp-uploader includes `?token=<uuid>` — one line of URL construction in `get.js` right next to the /initiate call, immediately readable.
- Same conceptual pattern as CSRF tokens: server mints a per-request opaque value, embeds it in the round-trip artifact (here, the cdp-uploader redirect), validates on return.
- Full multi-tab safety at essentially the same complexity as the collide-under-parallel Options 4/6.
- Doesn't rely on nginx magic (Option 5) or on cdp-uploader's uploadId making it back to us via URL.
- Neither backend authz nor `/notification-view` hardening is a prerequisite — those remain out-of-scope follow-ups.

The extra concept a future reader has to internalise: `uploadToken` is *ours*; `uploadId` is *cdp-uploader's*; they identify the same thing from different angles. A doc-comment on the field and a clear name mitigates that.

---

## Follow-up: narrowing to options 2 and 3 under the "backend authz + notification-id-in-URL + middleware" constraint set

Working assumptions this section holds fixed (per the go-live plan):

- **Backend authz will be in place** before go-live — user ownership of any notificationRef is determinable for the logged-in user.
- The authz check **lives in middleware/filter** using the notificationRef in the URL path (per-controller checks are the exception, not the rule).
- **Shareable URLs contain the notificationId** (`/notifications/<ref>/…`) — adopted as a codebase practice.

### Options 2 and 3 have *distinct* hurdles — corrected from an earlier framing

An earlier draft of this doc claimed options 2 and 3 shared "the same plumbing hurdle" of needing uploadId in the URL. That was wrong. They have **different** hurdles that need to be addressed differently.

**Option 2's hurdle: getting `uploadId` into the redirect URL.**

Option 2 stores upload state in `server.app.cache` keyed by uploadId. For the `/upload-successful` handler to look up the entry, `uploadId` has to appear on the incoming request. But cdp-uploader takes the `/initiate` redirect URL as a **static string** and its own uploadId isn't known when we're configuring that redirect — so we can't just include it. Ways to close that gap:

- Frontend mints its own identifier and puts it in the redirect (Option 7 shape) — but then the identifier isn't the cdp-uploader uploadId, so the cache would need to be keyed by our token instead, at which point Option 2 has quietly become Option 7.
- Nginx sidecar rewrites the 302 `Location` header to append the request-path `uploadId` (Option 5 shape) — "spooky action at a distance", rejected earlier in the discussion.
- Backend tracks upload sessions and hands back a session identifier at register-time — that's Option 8.

**Option 3's hurdle: identifying the specific upload without a state store.**

Option 3 as originally defined has notificationRef in the URL and **nothing stashed anywhere**. When the browser lands on `/notifications/<ref>/upload-successful`, the handler knows the notification but has no way to look up which specific upload just landed or fetch its scan status. Ways to close that gap:

- **(a) cdp-uploader callback fires to the backend.** Backend already has the callback endpoint (`DocumentController.java:160-176`, unauthenticated per `EUDPA-35` — HMAC when cdp-uploader supports it). Callback creates the document record. `/upload-successful` just redirects to the docs list; the record is already there. Works cleanly; requires committing to callbacks.
- **(b) cdp-uploader has a query-by-metadata API.** Handler asks cdp-uploader for uploads matching this notification's metadata. Unknown whether the API exists — not observed among the endpoints probed (`/initiate`, `/upload-and-scan/<id>`, `/status/<id>`). Would need confirmation.

**If neither (a) nor (b) is available, pure Option 3 collapses into one of the other options:**

- Add backend pre-registration → **Option 8**.
- Add a state store keyed by notificationRef (yar) → **Options 4/6** — which has a real functional cost. See "The last-write-wins hazard" below.

### The last-write-wins hazard for yar-keyed-by-notificationRef (Options 4/6)

If pure Option 3 collapses to storing upload state under `yar['upload:<notificationRef>']`, multi-tab uploads on the **same notification** don't just look ugly — they silently swap files. Concretely:

- Tab 1: `/initiate` → uploadId=A. Writes `yar['upload:REF'] = { uploadId: A, statusUrl: URL_A }`.
- Tab 2: `/initiate` → uploadId=B. Writes `yar['upload:REF'] = { uploadId: B, statusUrl: URL_B }` — **overwrites Tab 1's entry** in the same session's yar.
- Tab 1 uploads its file to `/upload-and-scan/A` (cdp-uploader now holds Tab 1's file under A).
- Tab 1 lands on `/upload-successful?notificationRef=REF` → reads `yar['upload:REF']` → gets `{ uploadId: B, statusUrl: URL_B }` — **Tab 2's session**.
- Handler polls URL_B, eventually returns ready with Tab 2's filename/metadata (once Tab 2 uploads).
- If Tab 1 confirms based on that, **Tab 2's file lands committed as if it were Tab 1's** — wrong file, wrong documentType/reference/date.

Not a security concern (both tabs are the same user, same notification) but a real data-integrity bug that would be very hard to reproduce in support.

Adding a second tab uploading to the same notification isn't contrived — "let me open a second tab so I can upload the next big file while this one's still scanning" is a real workflow.

### Comparison of the actually-viable shapes under the constraint set

| Shape | State | Multi-tab same-notif safe? | What it requires |
|---|---|---|---|
| **Option 2** — `server.app.cache` by uploadId | Frontend cache, keyed by uploadId | ✅ | Solve the uploadId-in-URL hurdle (nginx or Option-7-style token, at which point Option 2 becomes Option 5 or Option 7 respectively) |
| **Option 3 with callbacks** | None frontend; backend records via callback | ✅ | Wire cdp-uploader callbacks to the existing backend endpoint. Authenticate the callback (HMAC per EUDPA-35). |
| **Option 3 collapsed to yar-by-notificationRef** (Options 4/6) | yar entry per notification | ❌ silent file-swap on same-notif multi-tab | Nothing beyond what we have — but the bug is real |
| **Option 8** — backend as source of truth | Backend record per upload | ✅ | New/refit backend endpoints for register + confirm |

### What this changes about the recommendation

The earlier framing suggested Option 3 was strictly simpler than Option 2 once backend authz landed. That holds **only** if we commit to route (a) — cdp-uploader callbacks. If we do, Option 3 is very clean:

- Frontend: `/initiate` with `callback` URL pointing at backend, no other server-side work.
- Cdp-uploader posts scan result to backend → backend creates document record.
- `/upload-successful` handler: nothing except `h.redirect('/notifications/<ref>/documents')`. The docs list reads from backend and shows the new record.
- Fully multi-tab safe (each upload has its own callback fire).

That's genuinely simpler than Option 8. **But it makes callbacks a hard dependency for this design to work.** Callbacks are currently unauthenticated (`EUDPA-35`) and the ticket for HMAC authentication is separate.

Option 8 avoids that dependency: works today with polling; if callbacks eventually land, they slot into the same backend endpoint that already exists, no frontend changes needed.

So the honest position:

- **If callbacks are landing alongside this work** — Option 3 with callbacks is the simplest and cleanest.
- **If callbacks aren't guaranteed** — Option 8 is the safest bet. It works without callbacks, and adopts them transparently later.
- **Options 4/6 (yar-keyed-by-notificationRef) should be avoided** because of the silent file-swap bug on same-notif multi-tab.
- **Option 2 without solving its plumbing hurdle collapses into either Option 5, 7, or 8**, and Option 8 is strictly cleaner than either.

### Recommended alternative — Option 8: backend as source of truth for upload sessions

Given the constraint set, there's an option that side-steps the plumbing decision entirely by shifting upload-session tracking to the backend. This aligns with the ticket's AC4 language: "the backend persists references (state/timing per AC3) and keeps status/download/delete".

**Shape:**

- **New backend endpoints** (or refit of the existing `/notifications/<ref>/document-uploads` machinery — the schema is already there):
  - `POST /notifications/<ref>/document-uploads` — frontend calls this right after its `/initiate` call to cdp-uploader, passing `{ uploadId, statusUrl, metadata }`. Backend records as `pending`. Auth middleware protects.
  - `GET /notifications/<ref>/document-uploads` — returns all pending + confirmed uploads for the notification. Backend polls cdp-uploader status when serving pending entries (or exposes `statusUrl` for the frontend to poll — the reader's choice; backend polling gives cleaner separation).
  - `POST /notifications/<ref>/document-uploads/<uploadId>/confirm` — invoked when scan is complete; transitions pending → persisted.
- **Frontend flow:**
  1. GET `/notifications/<ref>/documents` (or wherever the page lives) — frontend calls cdp-uploader `/initiate`, then registers the pending upload with the backend.
  2. Renders form with `action="/upload-and-scan/<uploadId>"` and `/initiate` redirect set to `/notifications/<ref>/upload-successful` — **no uploadId in the redirect URL needed.**
  3. User uploads.
  4. Cdp-uploader 302s to `/notifications/<ref>/upload-successful`.
  5. Auth middleware verifies caller owns `<ref>`.
  6. Handler calls backend `GET /notifications/<ref>/document-uploads` → gets list of pending uploads. Handler polls each (or backend does). Confirms any that are `ready`. Renders a status view showing all in-flight uploads for the notification.
  7. Meta-refresh until all done, then continue to the next wizard step.

**What this buys us:**

Table below columns Option 3 as the "with callbacks" variant, since pure Option 3 without callbacks collapses into either Option 8 or the buggy Options 4/6 per the correction above.

| Property | Option 2 | Option 3 (with callbacks) | **Option 8** |
|---|---|---|---|
| notificationId in URL | ✅ | ✅ | ✅ |
| Auth middleware hook | ✅ | ✅ | ✅ |
| No frontend state store | ❌ (cache) | ✅ | ✅ |
| No uploadId-in-redirect plumbing | ❌ | ✅ | ✅ (redirect doesn't need uploadId) |
| Multi-tab safe | ✅ | ✅ (each upload gets its own callback) | ✅ (backend tracks all pending) |
| Requires cdp-uploader callbacks wired + auth'd | no | **yes (hard dependency)** | no (callbacks slot in optionally later) |
| Backend callback endpoint auth status today | n/a | unauthenticated (`EUDPA-35`) — HMAC pending | n/a (works with polling; callbacks optional) |
| Multi-tab UX quality | separate pages per upload | separate pages per upload | **notification-scoped dashboard** — all in-flight docs shown together with status |
| Aligns with AC4 wording | partial | ✅ (backend receives callback, persists) | ✅ ("backend persists references … keeps status") |
| Round-trips per upload | 2 (poll + persist) | 1 (redirect + backend has record from callback) | 2–3 (register + poll + confirm) |

**Cost:**

- New backend endpoints — or repurposing of the existing `/notifications/<ref>/document-uploads` shape that backend has today, which already tracks documents and just needs the "pending vs confirmed" state transition added. Existing schema at `DocumentService.java:79-106` is already halfway there.
- Slightly more chatty per upload (extra HTTP round-trip to register/confirm).
- Backend has a foot in the direct-to-uploader flow — but per the ticket that's expected (backend "persists references … keeps status"). This is *why* the ticket kept persist on the backend.

**What it avoids:**

- No nginx `proxy_redirect` magic. No spooky action at a distance.
- No frontend-owned tokens or session-scoped caches to reason about.
- No plumbing to smuggle uploadId through cdp-uploader's static redirect — because the redirect URL doesn't need uploadId at all.
- No "which of the pending uploads just landed" question — the /upload-successful handler shows all pending, statuses update via meta-refresh, users continue when all are safe.

### Verdict

**Depends on whether we commit to cdp-uploader callbacks alongside this work.**

- **If callbacks land in the same release (with HMAC auth on the receiver, per `EUDPA-35`) — Option 3 with callbacks.** Simplest shape end-to-end: frontend has no upload state at all; backend record is created by the callback; `/upload-successful` is `h.redirect(...)`. Every property in the table above is a ✅.
- **If callbacks aren't guaranteed — Option 8.** Works without callbacks (frontend polls; backend as source of truth). If callbacks do eventually land, they slot into the same backend record with no frontend changes needed. Independence from the callback decision is the key advantage.
- **Options 2, 4, 5, 6 are all inferior under the constraint set** — either they carry a state store that no longer earns its keep (Option 2), or they collapse into the file-swap bug on same-notif multi-tab (Options 4, 6), or they rely on infrastructure trickery that's hard to trace from application code (Option 5).

The two remaining candidates (Option 3-with-callbacks and Option 8) differ mainly on **when** the backend gets the record: at scan-completion via callback, or at initiate-time via frontend register call.

- Option 3-with-callbacks needs the callback path robust before go-live.
- Option 8 needs backend endpoints and can defer callbacks.

If backend authz is available in the same release as this refactor, either is a defensible choice. The existing backend `DocumentService`/`DocumentController` code already has most of the schema for Option 8, and already has the callback endpoint (unauthenticated) that Option 3 needs to harden — so a **combined direction** is entirely feasible: implement Option 8 now, add HMAC auth to the callback endpoint alongside, and once callbacks are trusted, allow them to update the backend record directly (reducing polling to a UI-refresh nicety rather than a functional requirement).

---

## Option 8 — full detail

### Backend API contract

Three endpoints (or refits of existing shapes). All sit under `/notifications/<ref>/…`, so the auth middleware runs uniformly on ownership of `<ref>`.

**`POST /notifications/<ref>/document-uploads`** — register a pending upload.

- Body: `{ uploadId, statusUrl, metadata?: { documentType, documentReference, dateOfIssue } }`
- Backend writes: `{ upload_id, notification_ref, status: PENDING, status_url, metadata, owner_user_id, created_at }`
- Response: `201 Created` with the persisted record.
- **Idempotent** — if the record already exists for `(notification_ref, upload_id)`, return `200` with the existing record. Frontend retries don't create duplicates.

**`GET /notifications/<ref>/document-uploads`** — list uploads for a notification.

- Returns `[ { uploadId, status, filename?, documentType?, documentReference?, dateOfIssue?, statusUrl }, ... ]`.
- Backend variants:
  - **Lazy-poll**: on serving each `PENDING` entry, backend calls `cdpUploaderClient.getStatus(statusUrl)`, refreshes `status`/`filename`/etc from the response, and persists the updated state before returning. Adds latency but keeps the read fresh.
  - **Passive**: return whatever's in the database. Requires a background worker (or callbacks — see below) to keep pending entries fresh.
- For a spike-adjacent scope, lazy-poll is simpler. For scale, a background worker is friendlier to the request path.

**`POST /notifications/<ref>/document-uploads/<uploadId>/confirm`** — transition `PENDING`/`READY` → `PERSISTED`.

- Backend re-checks cdp-uploader status server-side (belt-and-braces), refuses if not actually ready.
- Reads `status.form.file.filename` and `status.form.*` metadata from cdp-uploader (findings.md notes cdp-uploader exposes the multipart fields there), backfills the record if not already set.
- Response: `200` with the persisted record.
- **Idempotent** — repeated calls no-op after the transition.

**`DELETE /notifications/<ref>/document-uploads/<uploadId>`** — user-initiated removal (existing endpoint, already there).

### Backend state machine

```
   INITIATED (client-side transient — cdp-uploader has returned uploadId; no DB record yet)
        |
        v [frontend POST /notifications/<ref>/document-uploads]
        |
   PENDING ─────────────────────────────────────────┐
        |                                            |
        v (browser POSTs file to /upload-and-scan)   |
        |                                            |
        v (backend polls cdp-uploader status)        |
        |                                            |
        +──> READY (uploadStatus=ready, clean)       |
        |         |                                  |
        |         v [frontend POST .../confirm]      |
        |     PERSISTED (final, appears in list      |
        |                 as "Safe")                 |
        |                                            |
        +──> REJECTED (uploadStatus=ready, infected) |
        |         (renders "Virus found — remove"    |
        |          with a delete button)             |
        |                                            |
        +──> ABANDONED ◄──────────────────────────────┘
                 (TTL sweep on stale PENDING that never got a file,
                  or on READY entries where user never confirmed within N hours)
```

The two failure modes (`REJECTED`, `ABANDONED`) both leave clean states in the DB and let the S3 orphan-cleanup path (AC4) reclaim the file.

### Backend data model (or refit of the existing `AccompanyingDocument`)

The backend already has `AccompanyingDocument` (referenced in `DocumentService.java:103` via `saveOrThrowOnDuplicate`). The refit adds a small state enum and a `status_url`:

| Column | Notes |
|---|---|
| `id` | PK — existing |
| `upload_id` (uuid) | cdp-uploader's id — likely already there, unique |
| `notification_ref` | FK — existing |
| `status` | enum: `PENDING`, `READY`, `REJECTED`, `PERSISTED`, `ABANDONED` — **new or refit of existing state** |
| `status_url` | text — **new**, cached for lazy-polling |
| `filename` | text — existing |
| `document_type`, `document_reference`, `date_of_issue` | existing |
| `owner_user_id` | text — **new or repurposed** for ownership check by middleware |
| `created_at`, `updated_at` | timestamps — existing |

Most of the schema is there; the changes are additive.

### Frontend flow

**On GET `/notifications/<ref>/documents`** (or wherever the accompanying-documents page lands):

```js
// pseudo-controller
export const getHandler = async (request, h) => {
  const { ref } = request.params  // notificationRef from URL
  // Auth middleware has already verified ownership of `ref`.

  // 1. Fetch existing uploads (pending + persisted) for the notification.
  const uploads = await backendClient.listDocumentUploads(ref, request.traceId)

  // 2. Initiate a fresh cdp-uploader session for the next upload.
  const cdpSession = await cdpUploaderClient.initiate({
    redirect: `/notifications/${ref}/upload-successful`,  // <-- note: no uploadId in URL
    s3Bucket: config.get('cdpUploader.documentsBucket'),
    maxFileSize: config.get('cdpUploader.maxFileSize'),
    mimeTypes: config.get('cdpUploader.mimeTypes').split(','),
    metadata: { notificationRef: ref }
  })

  // 3. Register the pending upload with the backend.
  await backendClient.registerDocumentUpload(ref, {
    uploadId: cdpSession.uploadId,
    statusUrl: cdpSession.statusUrl
  }, request.traceId)

  // 4. Render form with action=/upload-and-scan/<uploadId>.
  return h.view('accompanying-documents/index', {
    ref,
    uploads,  // status-decorated list from backend
    uploadUrl: `/upload-and-scan/${cdpSession.uploadId}`
  })
}
```

Nothing in frontend state. Cdp-uploader session lives on the backend record.

**On GET `/notifications/<ref>/upload-successful`** (cdp-uploader's redirect target):

```js
export const uploadSuccessfulHandler = async (request, h) => {
  const { ref } = request.params
  // Auth middleware has already verified ownership.

  // 1. Query backend for all uploads under this notification.
  //    Backend lazy-polls cdp-uploader on any PENDING entries and refreshes.
  const uploads = await backendClient.listDocumentUploads(ref, request.traceId)

  // 2. Confirm any READY entries that haven't been confirmed yet.
  const readyToConfirm = uploads.filter(u => u.status === 'READY')
  await Promise.all(readyToConfirm.map(u =>
    backendClient.confirmDocumentUpload(ref, u.uploadId, request.traceId)
  ))

  const anyPending = uploads.some(u => u.status === 'PENDING')
  if (anyPending) {
    // Show polling dashboard with meta-refresh.
    return h.view('accompanying-documents/upload-in-progress', {
      ref, uploads, nextAttempt: getAttempt(request) + 1
    })
  }

  // All done — bounce back to the documents page which will render Safe/Rejected as expected.
  return h.redirect(`/notifications/${ref}/documents`)
}
```

No `uploadId` from the URL — the handler doesn't need one because it operates on **all** in-flight uploads for the notification.

### The "which upload just landed" question

Under Option 8, there isn't one. The handler doesn't try to identify a specific upload; it renders the notification-level dashboard and lets meta-refresh loop until all are resolved. Multi-tab, same-notification, whatever — all in-flight uploads are visible together with their statuses. The user sees:

```
Uploading your files
────────────────────
target-50mb.pdf     [Checking]
invoice.pdf         [Safe]
covid-cert.pdf      [Virus found — Remove]

This page will refresh automatically.
```

Once all `PENDING` entries clear, the handler redirects back to `/notifications/<ref>/documents` and the standard docs list renders the outcome.

### Multi-tab race resolution

Tab 1 uploads doc X; Tab 2 concurrently uploads doc Y. Both hit `/upload-successful` at some point.

- Both handlers call `listDocumentUploads(ref)` → each sees `[X, Y]`.
- Both poll cdp-uploader status for whichever entries are `PENDING`.
- Both may hit `confirmDocumentUpload` for the same ready entry — **idempotent, second call is a no-op**.
- Backend polling is cheap (small JSON per request); duplicate polls are safe.
- Neither tab "owns" the notification state — the backend does.

No collision, no last-writer-wins hazard.

### What backend already has vs. what's new

Reusing what's there:

- `AccompanyingDocument` entity + `AccompanyingDocumentRepository` (survey confirmed these exist).
- `DocumentService.java:79-106` `initiate()` — currently calls cdp-uploader itself + saves the doc. **Refit:** stop calling `/initiate` (frontend does that now); keep the `save` half. Rename to `registerPending()` or similar to reflect the new semantics.
- `DocumentController.java` list + get + delete — largely unchanged.
- `DocumentController.java:160-176` scan-results callback — **stays**. If we eventually adopt cdp-uploader callbacks (rather than lazy-poll), this endpoint receives them and updates the DB. Removes frontend polling.

New work:

- Add `status` enum values + `status_url` column to `AccompanyingDocument` (migration).
- New `confirm()` service method + `POST .../confirm` controller endpoint.
- Backend calls `cdpUploaderClient.getStatus()` server-side — backend already talks to cdp-uploader for `initiate` today, so credentials + baseUrl are in place.

Removed:

- The frontend byte-proxy path (`DocumentController.java:185-203` `POST /document-uploads/{upload-id}/file`) — same as AC4 already prescribes.

### If we adopt cdp-uploader callbacks later

Backend already has the callback endpoint (`DocumentController.java:160-176`), currently unauthenticated per `EUDPA-35` (HMAC-when-cdp-uploader-supports-it). Under Option 8, adopting callbacks becomes a drop-in change:

- Cdp-uploader posts scan result to backend callback URL.
- Backend updates the record's `status` (PENDING → READY / REJECTED).
- Frontend polling is no longer strictly needed; frontend can still poll `GET .../document-uploads` for a UI refresh (cheap), or use a shorter meta-refresh cadence.

Because upload state lives on the backend, callbacks land where the state is — no frontend involvement at all. Options 5 and 7 would need to route callbacks through the frontend or split state across both tiers, which is exactly the "callback carries no cookie" problem the original plan was worried about.

### Cost summary

**Backend work:**
- Add `status` enum + `status_url` column + migration.
- Refit `initiate()` service (drop cdp-uploader call, keep DB save).
- Add `confirm()` service + controller endpoint.
- (Optional but recommended) background worker for stale PENDING sweep.
- Auth middleware wiring (this is happening regardless for go-live).

**Frontend work:**
- Call backend `registerDocumentUpload` after cdp-uploader `/initiate` — one extra HTTP call.
- Rewrite `upload-successful.js` to operate on the notification-level list rather than a single upload.
- Add `documentUpload` client methods (`register`, `list`, `confirm`) — thin wrappers on top of the existing backend base URL.
- Rewrite the `upload-in-progress` view to show a multi-item status list.
- Remove the yar `currentUpload` slot introduced in step 4.

**Removed work (vs Options 5/7):**
- No nginx `proxy_redirect` rule to write, review, or debug.
- No frontend token generation + storage layer.
- No yar entries to reason about for upload state.
- No "we're going to change this again when auth lands" caveat.

### The one caveat

Option 8 assumes backend authz **and** frontend↔backend calls for register/confirm are cheap enough that adding two round-trips per upload is acceptable. On CDP with the backend and frontend co-located in the same private network, these are single-digit-millisecond calls — negligible against the multi-second AV scan. In practice this is invisible to the user.

If backend/frontend latency ever becomes a concern (e.g. calls routed through the internet-facing gateway), the register call can be async fire-and-forget with client-side retry, or replaced with cdp-uploader metadata pre-registration.
