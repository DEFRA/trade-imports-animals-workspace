# Tickets to raise — defects in SHIPPED code found during the plant-products build

Nothing here has been raised in Jira. Each entry is a paste-ready draft: the description bodies are in
**Jira wiki markup, not markdown**, because `tools/jira/create-ticket.sh` passes the description raw.

These are all defects in **live-animals code that is already shipped** — not plant-products programme work.
They were found by transposition: the plant-products build copied a live-animals implementation, and
reviewing the copy surfaced faults nobody had looked for in the original. Each is tracked in
`backlog.json` as an increment too (so the build can fix it), but each also deserves a ticket in its own
right because it is a defect in the product rather than in this programme.

| Draft | Increment | Severity | Code fixed? | One line |
|---|---|---|---|---|
| T-1 | pp-069 | High | **Yes — `c4c8eb6`** | Concurrent copy replay can error instead of returning the existing copy |
| T-2 | pp-071 | High | **Yes — `1f77efc`** | Malformed request bodies return 500 instead of 400 across the API |

**T-2 grew when it was investigated — update the draft below before raising.** The catch-all was not
downgrading one exception but a whole class. Under Spring 6.2.10 it swallowed `TypeMismatchException` and
`MethodArgumentTypeMismatchException` (400), `ConversionNotSupportedException` (500),
`HttpMessageNotReadableException` (400), `HttpMessageNotWritableException` (500),
`MethodValidationException` (500), `HandlerMethodValidationException` (400 input / 500 return-value),
`AsyncRequestTimeoutException` (503), `ErrorResponseException` and `ResponseStatusException` with their
declared status (covering 405, 406, 413, 415, 400, 500), and any `RuntimeException` carrying
`@ResponseStatus`. **Two of this ticket's own assumptions were wrong:** the Servlet-side exceptions
(`HttpRequestMethodNotSupported`, `HttpMediaTypeNotSupported`, `MissingServletRequestParameter` and
friends) are *checked* exceptions and were never caught by a `RuntimeException` catch-all at all; and the
predicted `@WebMvcTest` slice defect **does not exist in animals** — all four slice classes already
discover `GlobalExceptionHandler`, 0 assertions ran on an incomplete stack, all 84 passed unchanged. So
**drop the slice-audit half of this ticket**: that gap was specific to the plant-products slices and is
already fixed by `e2fbdaf`.

**The fix landing does not remove the need for the ticket.** These are defects that reached shipped code
and were live in whatever environments run this branch's predecessor; they want a record with a cause and
a date, not just a commit buried in a spike branch. Raise them, then link the commit.

---

## T-1 — Fulfilment-copy idempotency recovery runs inside an aborted Mongo transaction

**Type:** Bug · **Repo:** trade-imports-animals-backend · **Increment:** pp-069

**Summary:** `Idempotency-Key` replay of a fulfilment copy can return an error instead of the existing copy under concurrency

**Description (Jira wiki markup):**

```
h2. What happens

Two concurrent {{POST}} copy requests carrying the same {{Idempotency-Key}} can both miss the
existence check. One insert wins; the other receives a {{DuplicateKeyException}}. The recovery
lookup that is supposed to return the winning copy then runs *inside the same Mongo transaction
that the failed insert has already aborted*, so it fails rather than returning the existing copy
with 201.

h2. Why it is not caught today

The copy method is {{@Transactional}} and {{MongoTransactionManager}} is registered
unconditionally ({{animals/configuration/MongoConfig.java:91}}), so this is a real transaction
rather than a no-op. No test reaches the path: the replay test is sequential, the index test
inserts directly, and the unit test mocks a successful post-exception lookup — which proves the
catch block compiles, not that the contract holds under a race.

h2. Impact

The idempotency guarantee is exactly what a race is supposed to preserve. A client retrying a
copy during contention can receive an error for an operation that in fact succeeded.

h2. How it was found

The plant-products package transposed this implementation per ruling R4 ("match live-animals
exactly"). Reviewing the copy surfaced the flaw; the original had never been reviewed for it. The
corrected implementation and a genuinely concurrent regression test landed in plant-products as
commit {{4ebf8b3}} and are the reference for this fix.

h2. Acceptance criteria

* The duplicate-key recovery lookup cannot execute inside a transaction aborted by the failed insert.
* A genuinely concurrent integration test proves the losing request returns the existing copy with 201 and that exactly one document is persisted. A Mockito-fabricated post-exception lookup does not satisfy this.
* Sequential replay, the unique partial index and header validation are unchanged.
* {{mvn verify}} is green end to end.
```

**Note when raising:** check first whether the same aborted-transaction pattern appears elsewhere in the
animals package — any `@Transactional` method that catches `DuplicateKeyException` and then reads. If it
does, this is a bug class and the ticket should say so.

---

## T-2 — GlobalExceptionHandler's RuntimeException catch-all downgrades framework exceptions to 500

**Type:** Bug · **Repo:** trade-imports-animals-backend · **Increment:** pp-071

**Summary:** Malformed request bodies return 500 instead of 400 because a catch-all swallows Spring's own exceptions

**Description (Jira wiki markup):**

```
h2. What happens

A malformed JSON request body returns 500 instead of 400. Confirmed against a running server for
{{POST /notifications}}.

h2. Root cause

{{GlobalExceptionHandler}} carries a {{RuntimeException}} catch-all. Spring raises
{{HttpMessageNotReadableException}} for an unreadable body, which the framework would resolve to
400 on its own, but the catch-all intercepts it first and maps it to 500.

{{HttpMessageNotReadableException}} is not special — it is simply the instance that surfaced. Any
Spring framework exception extending {{RuntimeException}} is liable to the same downgrade:
unsupported media type, method not allowed, missing request parameter, argument type mismatch. The
set actually affected needs enumerating.

h2. Impact

On shipped API surface a client cannot distinguish "your request was malformed" from "the server
broke". A 500 also implies a server fault to monitoring and alerting when the cause is client
input.

h2. Why it is not caught today

The {{@WebMvcTest}} controller slices omit {{GlobalExceptionHandler}}, so they exercise Spring's
default exception resolution rather than production's. A slice therefore asserts 400 and passes
while the running application returns 500. This was proved in the plant-products package: adding
the production advice to the slice made a previously-green test fail exactly as production does.

h2. How it was found

The identical defect was fixed in the plant-products package as commit {{e2fbdaf}}; probing the
animals endpoints while proving the root cause showed animals shares it.

h2. Acceptance criteria

* A malformed body, a literal-null body and a missing body each return 400 with the problem-style shape and no stack-trace content, proved by integration tests over the real HTTP stack for every endpoint family that accepts a body.
* The catch-all no longer downgrades framework exceptions that carry a correct status of their own; the set it was swallowing is enumerated in the fix.
* The {{@WebMvcTest}} slices load the same exception-handling stack as production, so a slice cannot be green where the application is broken. The number of assertions previously running on the incomplete stack is reported.
* No behaviour change for well-formed requests; existing tests pass without their assertions being edited.
```

**Note when raising:** the slice-context half is arguably a second ticket — it is a test-quality defect
across the suite rather than an API bug. Raise as one if the fix is one change; split if the audit turns
out to be large.

---

## Upstream report, not a ticket for this programme

- **IPAFFS renders a misspelled port name: "Folkstone - GBFOL4PP".** The English port is **Folkestone**.
  This is live, user-visible reference-data copy naming a real port, confirmed in the rendered DOM (the
  CHED-PP trace `pages/transport-before-bip.json`, and `ched-pp-cuc.spec.ts:19` selects by that literal
  label, so it matches real rendered text). The trace work ruled that the rebuild should NOT carry the
  misspelling over, and pp-015 (`5a65d46c`) accordingly ships the correct spelling with the code
  `GBFOL4PP` unchanged. **Nothing is broken here and no ticket is needed against this programme** — but the
  defect is real in IPAFFS and worth reporting to whoever owns that reference data, since our fixture now
  deliberately differs from the live service on that one string.

## ⏸ M5 SCOPE DECISIONS — SAM RULED 2026-08-04

**IN, and in this order:** pp-097 (check-answers `readOnly` mode) → pp-045 (draft lifecycle, with
pp-052 folded in) → pp-067 (lifecycle coverage). Then **pp-051 document upload** — Sam ruled it in as a
lift-and-shift, and he was right that live-animals already does it: `features/documents/` there is a
full cdp-uploader integration (`client/`, `contracts/`, `form/`, `handlers/`, `scan/`, `scan-poll.js`,
`upload-config.js`), not a stub. My earlier "greenfield spike" framing was wrong. **Matching it closely
is the point** — it brings the layout and the antivirus scan across rather than re-deriving them.

**ALSO IN, both ruled "match live-animals" 2026-08-04:**

- **pp-044** — transpose `features/addresses/party-picker/`. live-animals does
  **pick-from-a-list-or-create-new**, not a search box, and plant already has the create half.
  ⚠ **Retitle it** — "consignor-search" describes something that does not exist. ⚠ It inserts a **page**,
  so it moves journey order, task rows and review rows; do not group it with thin changes.
- **pp-047** — ⚠ **this is about the ORGANISATION, not auth.** live-animals has no auth-stub feature at
  all: real OIDC via the defra-id-stub, an `AUTH_ENABLED=false` short-circuit for local e2e, and the
  shared `buildActor(credentials)` helper. Matching it means **deriving the org from the authenticated
  credentials** and retiring plant's hardcode (`services/stub-org.js` plus the backend's
  `STUB_ORGANISATION_ID`). ⚠ **The mongo seed pins `assignedOrganisationId: 'stub-org'`, so a
  frontend-only change diverges from seeded data and turns the tests repo red — both repos in one
  session.**

**DEFERRED — raise tickets, do not build:**

- **T-8 — Delegated authority (pp-048 → pp-049 → pp-050).** ⚠ Sam: *"we don't have the auth to do it
  yet anyway."* Three sequential increments, pp-048 spans **both repos**, and it changes ownership,
  dashboard visibility and auto-population. Every m4 increment was scoped single-org own-behalf
  *because* this was deferred. It is not a feature to bolt on at the end — it touches the record model
  and the list query. If it comes back, it wants its own trace-to-requirements pass, not three stubs
  written before m4 existed.
- **T-9 — CSV commodity branch (pp-042).** Deferred, **and the radio is to be removed now** — see the
  increment raised for that. The branch wholesale replaces commodity-search / basic-description /
  bulk-details and must re-derive the same twelve obligations; it is the single most likely remaining
  increment to end half-complete, so it does not belong in an overnight loop.
- **T-11 — CUC billing sub-journey (pp-043).** ⚠ Sam: *"no idea what CUC is."* **The ticket's job is to
  find out before anyone builds it.** What is known: the trace ruling **c-007** is marked
  **PROVISIONAL** — billing is modelled as gated by a free-standing `isCuc` flag, *"not settled —
  confirm with IPAFFS whether the real server rule derives CUC from the **Sevington** port"*. CUC
  billing was **in** first-pass scope and **Billing is spoke 11**, conditional on `isCuc` — which is
  precisely why the hub renders groups 1–10 and 12 with no eleventh. The backend model already carries
  `isCuc` and `PlantProductsBilling billing`, and the port round-trips both, so the data layer is
  half-wired and only the frontend surface is missing. **Do not build a conditional whose condition is
  guessed** — that is the invention this build has refused eleven times.
- **T-10 — Article 72 business rule hook (pp-046).** Sam: *"basically, is this required now?"* — that
  is the ticket. ⚠ Worth stating in it: the hook has **no behaviour**, so its verification is
  inherently weak whether or not it is built. An increment that implied the ladder proved anything
  about Article 72 would be misleading.

## ⏸ DEFERRED BY SAM 2026-08-04 — RAISE TICKETS, DO NOT BUILD

Sam has ruled these **deferred for now, with tickets to be raised**. They are not open questions any
more; the decision is "not now, but recorded". **Raising them is still human-only — Sam has not approved
the raise itself.**

- **T-3 — the review page has no GET guard, in either set.** A deep link renders the review page for an
  incomplete notification. Submit is blocked by `engine/write/submit.js:9`, so it is view-only.
- **T-4 — the dashboard renders a bare 500 when its list read fails, in either set.** `renderDashboard`
  awaits `listKnownJourneys` with no recoverable branch, so a backend hiccup surfaces as a server error
  rather than the recoverable re-render pp-088 built for writes.
- **T-5 — asking one set for the other set's notification returns 500, not 404, in both directions.**
  Both entry guards call `get(request, h)` before establishing the journey exists or belongs to that set
  (`live-animals/…/entry-guard.js:54`, `plant-products/…/entry-guard.js:47`).
- **T-6 — co-resident sets share ONE root-scoped session cookie.** Isolation holds via Yar keys and the
  cross-set visibility case proves it, but a leaked cookie for one set carries the other.

⚠ **RAISE T-3 TO T-6 AS ONE TICKET OR AS FOUR WITH A SHARED PARENT.** All four surfaced from the
co-residency work, all are identical in both sets, and all are the same shape: **the shared engine and
guard layer answers "not found" or "not yours" by erroring.** Four separate tickets would hide that.

- **T-7 — the tests repo hand-maintains a duplicate of the frontend's commodity fixture data**
  (`domain/plant-products/constants/`). It drifted silently from pp-077 and was only caught when a stack
  rebuild surfaced it; pp-092 re-based it, which fixes today's drift and nothing about tomorrow's.
  Either those constants are **generated** from the frontend fixture, or a **contract test** fails when
  the two disagree. Spans two repos. ⚠ **pp-092 checked only 3 of the 11 constants files — the other 8
  may have drifted identically and nobody has looked.**

## Ruled, no action needed

- **CSV silently routing into the manual branch — RULED TEMPORARY by Sam 2026-08-04.** Known and
  accepted until pp-042 builds the branch. No ticket, no interim guard.
- **No plain `GB` country code — RESOLVED 2026-08-04, nothing is missing.** The four UK subdivisions sit
  in alphabetical position where "United Kingdom" would sort (`countries.js:238-241`), so the IPAFFS
  source models the UK **as** four subdivisions rather than as one country. Adding a `GB` would invent a
  code the source does not have. Live-animals is not a model to copy: its `addressCountries()`
  (`services/countries/index.js:18-21`) returns `['United Kingdom', ...labels]` — plain **strings**, not
  codes — so it stores the display name and never codes address countries at all. pp-095 as shipped is
  the faithful representation.
- **Copy idempotency keys being global — PROMOTED to increment pp-098** by Sam's ruling ("worth a design
  and fix"), with the design as its first deliverable. No longer a conversation item.
- **The missing read-only view — ANSWERED and PROMOTED to increment pp-097.** live-animals has no
  separate view feature; its read-only view is `check-answers` in a `readOnly` mode gated on
  `status === SUBMITTED`. Plant's controller contains **zero** occurrences of `readOnly` — the
  transposition dropped the mode. **Third transposition defect where the fault is in the copy.**

## Also worth a conversation, not yet a ticket

- **⚠ CSV is a live, selectable radio option that silently routes the user into the MANUAL branch.**
  Found 2026-08-04 by a staleness audit of the remaining backlog, not by a test.
  `commodity-input-method.controller.js:23` ships `INPUT_METHODS = ['MANUAL', 'CSV']` with a real label
  in `copy.en.js:12`, so a user can choose **CSV** today — and the POST falls straight through to
  `kit.nextTarget` with no branch, landing them in the manual commodity-search flow with no indication
  anything was ignored.
  **This is not future work being tracked as future work.** pp-042 (the CSV branch) is an m5 stub and
  correctly unbuilt, but the *option* shipped ahead of it. The honest choices are to hide or disable the
  CSV radio until pp-042 lands, or to route it to an interim "not yet available" page. **Silently
  behaving as if the user had picked something else is the one option that should not stand.**
  Recorded rather than fixed: which of those you want is a product call, and it touches a page whose
  obligations are already ruled.

- **Asking one set for another set's notification returns 500, not 404 — in BOTH sets.** Found
  2026-08-04 by the pp-065 co-residency spec, and **it had been masked**: the cookie assertion earlier in
  the same test was failing first, so this assertion never ran until the cookie criterion was corrected.
  `GET /live-animals/notifications/{a-GBN-PP-reference}` returns **500**.
  **The mechanism, traced by me:** both entry guards call `const { journey, answers } = await get(request, h)`
  **before** anything establishes that the journey exists or belongs to this set —
  `sets/live-animals/journeys/linear/flow/entry-guard.js:54` and
  `sets/plant-products/journeys/linear/flow/entry-guard.js:47` are the same shape. An unknown or
  foreign notification id on a guarded path therefore produces an unhandled error rather than a
  not-found.
  **The isolation property itself HOLDS** — the other set's notification is not served — so this is
  about the **error shape**, not a leak. But a 500 tells a user (and monitoring) that the server broke
  when the honest answer is that the notification does not exist here, and it is the same
  "defensive construct applied too broadly" family as T-1 and T-2.
  **Why it is here and not in the backlog:** identical in both sets, so a plant-only fix would diverge,
  and the natural home is the shared guard seam rather than either set. **Your call.**
  ⚠ **This is the fourth shared-design finding this session** — with the review page having no GET
  guard, the dashboard's bare 500 on a failed list read, and the single shared session cookie. They are
  all the same shape: the co-residency work keeps surfacing places where the shared engine and guard
  layer answers "not found" or "not yours" by erroring. **Worth looking at as one question rather than
  four.**

- **Co-resident sets share ONE root-scoped session cookie; there are no per-set cookies.** Found
  2026-08-04 when the pp-065 implementor returned `ok:false` rather than fake a cookie or weaken an
  assertion, and verified at source rather than relayed.
  `src/server/common/helpers/session-cache/session-cache.js` registers a single `@hapi/yar` session with
  one root-scoped cookie named from `sessionConfig.cache.name`. Both `:3100` and `:3000` expose only
  root-scoped auth / CSRF / session cookies. Per-set isolation is achieved by **Yar keys inside that one
  session**, not by cookie naming or path scoping.
  **The user-facing guarantee holds and is now pinned:** the co-residency spec's cross-set draft
  visibility case passes, so one set cannot see the other's drafts.
  **The question is whether that is the isolation you want.** Distinct per-set cookies would be
  stronger — a leaked or fixated cookie for one set would not also carry the other, and signing out of
  one set would not necessarily end the other's session. Today both sets ride the same cookie.
  **Why it is here and not in the backlog:** it spans both sets and lives in `src/server/common/`, which
  the standing rules put off limits to a plant increment, so it is not this programme's to decide. The
  pp-065 acceptance criterion that asserted per-set cookie names and paths has been corrected to assert
  what the application actually does — **the plan described a design that was never built**, and that is
  worth knowing independently of whether you change it.

- **The review page has NO entry guard in EITHER set — a deep link renders it for an incomplete
  notification.** Found 2026-08-04 when the pp-041 implementor returned `ok:false` rather than make an
  unplanned production change, and verified at the source rather than relayed. `sectionGatePasses` has
  exactly **two** production consumers in the whole application —
  `sets/live-animals/journeys/linear/features/hub/controller.js:81` and
  `sets/plant-products/journeys/linear/features/hub/controller.js:77`. Both are the **hub**. Nothing
  enforces the section gate on a page GET, so `GET /<set>/notifications/<id>/review-notification`
  renders a review page for a notification whose mandatory rows are not complete.
  **Severity is limited and should not be overstated:** `engine/write/submit.js:9` genuinely refuses to
  finalise when `readyForCheckYourAnswers` is false, so such a notification can be **viewed** but never
  **submitted**. This is a UX/consistency gap, not a data-integrity hole — the hub correctly withholds
  the link, and only a hand-typed or bookmarked URL reaches the page.
  **Why it is here and not in the backlog:** plant-products is a faithful transposition of live-animals
  on this point, so it is not a defect in this programme, and fixing only the plant set would create the
  divergence the standing rules exist to prevent. **It spans both sets, so it is Sam's call.** If it is
  worth closing, the natural home is the shared entry-guard seam rather than either controller, and it
  would want the same treatment in both sets in one change.

- **Copy idempotency keys are GLOBAL, not scoped to the source resource — in BOTH packages.** Found while
  building the plant-products frontend adapter (pp-008), which had to model the real backend contract.
  `FulfilmentService.copy(id, idempotencyKey)` looks up `findByCopyIdempotencyKey(key)` and returns the
  existing copy BEFORE it ever resolves `findById(id)`
  (`animals/fulfilment/FulfilmentService.java:114` vs `:121`). So a client that copies notification X with
  key `abc`, then later copies notification **Y** with the same key, gets **X's copy** back — silently the
  wrong resource, with a 201 and no error. Plant-products behaves identically, so **R4 holds and nothing
  has diverged**; this is a shared design question, not a transposition defect, which is why it is here and
  not a ticket draft.
  **The judgement call is yours.** Strict idempotency semantics ("same key, same result") are satisfied.
  But the common practice (Stripe, the IETF idempotency-key draft) is to also compare the request
  fingerprint and reject a reused key carrying a different body with 422, precisely so a client's
  key-reuse bug surfaces as an error rather than as the wrong resource. Doing nothing is defensible; if you
  want it changed it is one ticket covering both packages, and the frontend adapter would need no change.

- **Do T-1 and T-2 share a house pattern?** Both are cases where a defensive construct (a transaction, a
  catch-all) is applied broadly enough to break the narrower case it encloses. If the same shapes were
  copied across packages, fixing the pattern once beats fixing instances.
- **The slice-context gap is a suite-wide question.** ~68 MockMvc assertions in the plant-products slices
  ran without production's advice. The animals slices have not been audited.
