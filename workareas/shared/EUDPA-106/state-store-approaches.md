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

### Both 2 and 3 hit the same plumbing hurdle

`server.app.cache`-keyed-by-uploadId (Option 2) and URL-carried-refs (Option 3) both need the `/upload-successful` handler to identify **which specific upload** just landed, so it can poll cdp-uploader's `/status/<uploadId>` and act on the result. Both approaches assume `uploadId` is available on the request. But cdp-uploader takes the `/initiate` redirect URL as a **static string** and its own generated `uploadId` isn't known when we're configuring that redirect — so we can't just include it. Ways to close that gap (any of these apply equally to options 2 and 3):

- Frontend mints its own identifier and puts it in the redirect (Option 7 shape).
- Nginx sidecar rewrites the 302 `Location` header to append the request-path `uploadId` (Option 5 shape).
- Frontend calls cdp-uploader `/initiate` sequentially and stashes the returned uploadId server-side, so the browser round-trip doesn't need to carry it — but this either lands us back on yar (per-session state) or a shared cache (which is Option 2 itself, still needing uploadId in URL for the lookup).
- Backend tracks upload sessions (Option 8, below).

So **choosing between 2 and 3 doesn't dodge the plumbing decision** — it just moves it around.

### Comparison assuming the plumbing is solved

| Aspect | Option 2 (`server.app.cache` by uploadId) | Option 3 (URL-only, no store) |
|---|---|---|
| Storage | Frontend: new `server.cache({ segment: 'document-uploads' })` at server-init; helper module for read/write. | None. |
| URL shape | `/notifications/<ref>/upload-successful?uploadId=<uuid>` | `/notifications/<ref>/upload-successful?uploadId=<uuid>` |
| Auth middleware hook | `<ref>` in path — trivial. | `<ref>` in path — trivial. |
| statusUrl access | Cache holds `statusUrl`; also reconstructible from `${cdpUploader.baseUrl}/status/${uploadId}`. | Reconstructed from `${cdpUploader.baseUrl}/status/${uploadId}` — no other source. |
| Persist call | Cache-carried notificationRef vs URL-carried — moot, backend authz checks either way. | URL-carried, backend authz check. |
| Cognitive load for future readers | Adds a new catbox segment + a helper module + TTL considerations. | Handler reads a URL param and calls two services — the story is on-screen. |
| Callback-writable | ✅ (arbitrary-key cache, no cookie needed) | ✅ (backend handles the persist call directly) |
| Failure mode if plumbing hits a snag | Cache entry orphaned until TTL, sweeper cleans S3. | Same — the 302 just doesn't fire; user retries. |

Once backend authz is in place, **Option 2's cache adds a layer without earning it**. The cache used to earn its keep for:

1. carrying `notificationRef` between /initiate and /upload-successful (so the URL didn't have to be trusted), and
2. providing cross-user protection at the frontend (the "rogue user with leaked uploadId" attack).

Under the constraint set: (1) is unnecessary because notificationRef is in the URL path and backend authz validates it; (2) is unnecessary because backend authz catches the same attack at the persist call.

**Between 2 and 3, Option 3 wins on simplicity** — same functionality, no state store, less to maintain, aligns with the middleware pattern out of the box.

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

| Property | Option 2 | Option 3 | **Option 8** |
|---|---|---|---|
| notificationId in URL | ✅ | ✅ | ✅ |
| Auth middleware hook | ✅ | ✅ | ✅ |
| No frontend state store | ❌ (cache) | ✅ | ✅ |
| No uploadId-in-redirect plumbing | ❌ | ❌ | ✅ (redirect doesn't need uploadId) |
| Multi-tab safe | ✅ | ✅ | ✅ (backend tracks all pending) |
| Multi-tab UX quality | separate pages per upload | separate pages per upload | **notification-scoped dashboard** — all in-flight docs shown together with status |
| Aligns with AC4 wording | partial | partial | ✅ ("backend persists references … keeps status") |
| Sets up for callback (if adopted) | fine (cache is callback-writable) | fine (backend handles persist) | **best** — callback lands on backend, no frontend involvement |
| Round-trips per upload | 2 (poll + persist) | 2 (poll + persist) | 2–3 (register + poll + confirm) |

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

**Under the go-live constraint set, Option 8 > Option 3 > Option 2.**

- **Between 2 and 3: Option 3.** Same functionality, less code, aligns with the middleware pattern natively.
- **Better than both: Option 8.** Shifts state ownership to the backend where AC4 already wants it. Costs one round-trip on registration and one on confirmation, buys a cleaner architecture end-to-end. Uses URL-carried notificationRef throughout, no uploadId round-trip needed at all — the plumbing question doesn't arise.

If backend authz is available in the same release as this refactor, Option 8 is the shape I'd recommend implementing. The existing backend `DocumentService`/`DocumentController` code already has most of the schema — the follow-up ticket adds the pending/confirmed transition and the frontend calls to match.
