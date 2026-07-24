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
