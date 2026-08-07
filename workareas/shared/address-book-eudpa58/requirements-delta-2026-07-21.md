# EUDPA-58 requirements re-digest & delta — 2026-07-21

**Supersedes** `requirements-delta-2026-07-17.md` (which correctly found NIL delta — the
tickets had not yet been rewritten). The epic's tickets were comprehensively rewritten on
**2026-07-21**. This is the real delta.

**Baseline for the diff:** `extracts/jira.json` (2026-07-14 capture) + `spec/address-book-spec.json`
+ `spec/conflicts.json` (21 rulings). **Method:** Atlassian MCP is org-blocked; all reads via
`tools/jira/{search,ticket}.sh` (live REST, authenticated as Sam). Every child fetched verbatim.

---

## Verdict — WHOLESALE RE-ARCHITECTURE. ~8 locked rulings inverted. Delivered build materially misaligned.

The rewrite keeps the *field validation table* and the *page flows* but changes almost everything
structural underneath: the service topology, the domain model, the scoping model, the API surface,
the country representation, the copy-vs-reference semantics, and the terminology. The delivered
build (M1/M1.5/M2/M3, green) is now **substantially out of alignment** with the tickets.

### Ticket-set delta
- **NEW: EUDPA-295** — "Freeze address details onto the notification on submit" (Task, High). A brand-new child.
- **RETITLED: EUDPA-294** — was "Replace hardcoded operators with created operators" → now "Link notifications to addresses from the address book".
- **STALE/SUPERSEDED: EUDPA-185** — its description was **not** rewritten (still says "operators", "type" column, per-user), Priority still Lowest while everything else was re-prioritised. Its whole scope (nav + list + pagination) is now absorbed into **EUDPA-287** (AC3/AC4/AC6). Looks like a leftover to be closed as a duplicate — **confirm with the team.**
- **EUDPA-187** — still empty (parked). Unchanged.
- **Related tickets now cited** (not children of 58, context/deps): **EUDPA-198** (Standardise address format — "replace addressLine3 with postcode"; 294 says absorb it as a duplicate), **EUDPA-142** (INS / routing into journeys), **EUDPA-119** (approved transporter list), **EUDPA-59** (Defra ID auth), **EUDPA-271** (type-ahead select — still "impacts" 186).
- **New design-decision authority:** the tickets cite decision IDs **D3, D13, D21, D23, D24, D26** (and a Confluence "Live Animals Data Fields V4 — Common Attributes" page as the Standard Address Block source). This is a canonical decisions log the spec does not yet ingest — **we need it.**

---

## The structural inversions (with evidence and which ruling each overturns)

### 1. Service topology: TWO new services, and the UI leaves `trade-imports-animals-frontend`
- **Was:** one new Java service `trade-imports-operators` (:8089) + address-book UI built into the existing `trade-imports-animals-frontend`.
- **Now (EUDPA-287):** stand up **`trade-imports-ins-frontend`** — a *new* "Import Notification Service" shell (CDP Node template: sign-in, dashboard, address-book page) — **and** **`trade-imports-address-book`** — a new Java/Spring-Boot API (model on `trade-imports-reference-data`, Mongo, no messaging), the "system of record" for addresses. The address-book UI lives in the **new INS frontend**, not in the animals frontend. 287.AC1 requires both to run in the workspace stack + dev overlay, with a workspace PR (`docker/stack`, dev overlay, `make setup` clone list, CLAUDE.md repo map).
- **Impact:** our `trade-imports-operators` service is renamed/reconceived as `trade-imports-address-book`; the M2/M3 UI we built into `trade-imports-animals-frontend` is now supposed to live in a brand-new `trade-imports-ins-frontend`. Major topology rework.

### 2. Addresses are UNTYPED — the role is applied at selection (D3, D21)
- **Was:** operator has `operator_type` (7 types); type-scoped select pages (an operator shows only on its type's page — b-009, j-002/003/004); filter-by-type (EUDPA-186.AC2); "or divider before Branch address"; a type-selection page opening the add flow.
- **Now:** addresses have **no type**. The service "knows nothing about roles". The role ("consignment party") is chosen when the address is *selected into a notification*, so one address can be consignor on one notification and consignee on the next. 287.AC8 note: **"the current prototype opens this flow with an 'operator type' selection page. That page is removed."** 186 **removes filter-by-type entirely** ("there is no filter-by-type … addresses are untyped, D21") — text search only.
- **Inverts:** the `operator_type` field, c-005's type-scoped select semantics, b-009/j-002/j-003/j-004 type-scoping, EUDPA-186.AC2, and the type-selection add page. Our conditional-render logic and the "operator only appears on the matching page" behaviour are all contradicted.

### 3. Org-scoping, not per-user/crn (D23) — **inverts c-001**
- **Was:** c-001 — scope reads by `crn`; store `organisation_id` but don't filter by it; org-sharing is "future".
- **Now:** addresses **belong to the organisation**. Every user in the org sees/edits them (286.AC6 delete is org-wide; 287.AC11 available to the org; 294.AC1 "saved by anyone in my organisation, not just my own"). `orgId` from Defra ID `currentRelationshipId`, read from session. API is **path-scoped**: `/organisation/{orgId}/addresses`.
- **Inverts:** c-001. Org-wide sharing is now the requirement *now*, not future, and scoping is path-based not header-based.

### 4. API surface + country representation — **inverts c-004**
- **Was:** `/operators`, `/operators/{id}`, header-scoped (`Trade-Imports-Crn`/`-Organisation-Id`), `?q=&operator_type=&page=&page_size=`; **country stored as MDM display-name string** (c-004, a deliberate deviation from ISO alpha-2); snake_case JSON; RFC 9457 two-400 anyOf.
- **Now:** `GET/POST /organisation/{orgId}/addresses`, `GET/PUT/DELETE /organisation/{orgId}/addresses/{id}`, `?q=`; **country stored as ISO 3166-1 alpha-2 `countryCode`, NOT validated against a list** ("store what you're given"; matches `Origin.countryCode`); page size is **server-side config, not a query param**; body carries no type/role. Fields: `name, email, phone, addressLine1, addressLine2?, townOrCity, county?, postcode, countryCode`.
- **Inverts:** **c-004** head-on (display-name → the very ISO alpha-2 `countryCode` c-004 rejected). Also changes path shape, scoping mechanism, and field names (`townOrCity` not town/city, `countryCode` not country, `phone` not telephone).

### 5. Reference + resolve-on-read, NOT copy — **inverts c-017; EUDPA-293.AC1 is now MET by design**
- **Was:** c-017 — store the operator **COPY + reference**, **NO re-sync**, staleness **accepted**; EUDPA-293.AC1 ("auto-use latest") **accepted-not-met** (b-007/j-005), ticket "must be amended", and an **E2E staleness pin asserts the OLD values still render**.
- **Now (EUDPA-294):** AC3 "the notification holds a **reference**, not a copy"; AC4 "a draft reflects a later edit … with no action from me" (resolve-on-read). EUDPA-293 rule 1: edited+draft → shows latest, a **model guarantee**. Explicit tech note: **"Do not implement by pushing updates into drafts … reference plus resolve-on-read gives it for free."**
- **Inverts:** **c-017** (the biggest one), b-007 & j-005 (both "accepted-not-met"), and the staleness E2E pin — **that test now asserts the wrong behaviour**. The dropped inc-028 ("amend EUDPA-293") is moot: the ticket was rewritten instead. 293.AC1's intent is now designed-in, not waived.

### 6. Freeze-on-submit snapshot (NEW EUDPA-295) — additive, keeps the reference — **inverts c-017's "no freeze"**
- **Was:** c-017 — no freeze-at-submit hydration; c-018 existence-check only; our M1.5 submit-guard fails closed but does **not** snapshot.
- **Now:** on submit, capture the **resolved** address details as a **frozen snapshot** in the **same transaction** as the status change; **keep `addressId` alongside** (additive) so an amend re-resolves live; reading a submitted notification shows the snapshot; cancel-amend restores it. Reuse `NotificationContentSnapshot` (`submittedBaseline`). Hard gate before go-live. Also fixes an amend-start capture bug that 294 introduces.
- **Inverts:** c-017 ("no freeze"). Our M1.5 submit-guard must become a **snapshot-writer** (validate-then-freeze; 293.AC2 runs *before* the snapshot).

### 7. Transporter DEFERRED out of the address book — **inverts c-007 & c-019**
- **Was:** c-007/c-019 — TRANSPORTER operators live in the address book with `approval_number` + `transporter_category`, conditionally rendered on add/edit; transporter select page in scope (j-003).
- **Now (287 note):** "**Transporter is deferred out of the address book for now.**" It doesn't fit the Standard Address Block (approval number; found via the approved-transporter list, EUDPA-119, not typed). Rhys following up with Syed/Michael. "Nothing in this ticket handles transporters."
- **Inverts:** c-007, c-019, j-003. Our transporter work (extra fields, conditional form, transporter select swap) is now out of scope.

### 8. place-of-origin (D24) & consignment contact (D26) stay INLINE — never references
- **Was:** j-002 swapped place-of-origin to an operator select; j-004/c-014 mapped the consignment contact to a BRANCH_ADDRESS operator.
- **Now:** `placeOfOrigin` is "entered inline in the journey"; `consignment` is a per-notification field, inline. Neither is ever a reference; both are "already frozen".
- **Inverts:** j-002 (place-of-origin) and j-004/c-014 (consignment contact = BRANCH_ADDRESS). The select-page swap now covers only the referenceable roles (consignor/consignee/importer/place-of-destination), **not** place-of-origin or the consignment contact. (BRANCH_ADDRESS as an operator type disappears with the untyping.)

### 9. Terminology: "operator" retired → "address" / "consignment party" (D13) — **inverts c-016**
- **Was:** c-016 — UI copy says "operator", overriding the UX's "address".
- **Now:** the **"Operator" name is retired (D13)**. The address book stores **addresses**; a notification's reference-plus-role is a **consignment party**. The prototype's "operator" wording is explicitly called out as wrong ("they are addresses"; the operator-type page "is removed").
- **Inverts:** **c-016** completely. Our build uses "operator" pervasively — copy, routes, model, API, tests. This is a wide rename.

### 10. EUDPA-293 rewritten & expanded (deleted-address gate)
- **Now:** three explicit rules (edited+draft→latest [294], deleted+draft→replace [this], submitted→frozen [295]). **AC1** review-page deleted-validation (draft or amend); **AC2** the **backend** rejects a submit that references a deleted address (authoritative, even for a direct API call — status stays unchanged); **AC3** replace-a-deleted-address (click the inline message → taken to the relevant part of the notification → choosing a valid one clears it → submit). "Deleted" = a reference that resolves to a **soft-deleted** address.
- **vs build:** our b-008/j-006 (backend submit-guard + review flag) is aligned in *spirit*, but the mechanism differs — resolve-a-reference-returns-soft-deleted vs our stored-copy + existence-check-by-id — and **AC3's replace flow** is new and more specific.

### 11. EUDPA-286 expanded — endpoints + full-replace PUT + AC7/AC8
- **Now:** AC7 (by-id returns soft-deleted; **PUT is a full replace** — omitted optionals are *cleared*, not left; DELETE sets `deleted` flag → 204, record kept, by-id still resolves, 404 unknown, cross-org not returned); AC8 (edits reach drafts, never submitted — works *because* of 295's snapshot). Built in the Address Book API + INS frontend.
- **vs build:** our PUT/DELETE + tombstone are directionally aligned (soft-delete, by-id resolves deleted), but **PUT-clears-omitted-optionals** and the **org-scoped path** are new, and country is now `countryCode`.

---

## What is still aligned (don't rebuild these)
- **Field validation table** — name 255, line1 255, line2 opt 255, town 100, county opt 100, postcode 12, phone 20, email 254 — **unchanged** (only country representation + field *names* changed).
- **25 per page**, server-side page size (now explicitly config, not a query param — matches our D2).
- **Soft-delete semantics**: excluded from list/search, still resolvable by id, 404 for unknown/cross-scope — matches our tombstone model (c-003/c-018), now org-scoped.
- **Server-side search only** (c-012) — though now free-text over name/town/postcode/country only (no type filter).
- **Add / edit / delete page flows + GDS validation** — same shapes (modulo terminology and which frontend hosts them).
- **"3 seconds" success-banner wording** — still in 286.AC3 / 287.AC10 (c-006 amend still pending).
- **Address-lookup out of scope** (EUDPA-290) — still out (c-008 aligned).

---

## Impact on the delivered build (M1/M1.5/M2/M3, green)
Materially misaligned and needing rework on: service topology (2 new services incl. a new INS
frontend; UI moves out of `trade-imports-animals-frontend`); untyped addresses (drop `operator_type`,
type-scoping, type filter, the type-selection page); org-scoping not crn; `countryCode` (alpha-2) not
display-name; reference+resolve-on-read not copy+staleness (and the staleness E2E now asserts the
wrong thing); a new freeze-on-submit snapshot; transporter removed from the address book;
place-of-origin + consignment contact no longer address-book-backed; and the operator→address rename
throughout. **Aligned and reusable:** field validation lengths, pagination size, soft-delete-by-id
semantics, server-side search, and the add/edit/delete page flows.

This is a large enough shift that the honest framing is **re-plan the epic against the rewritten
tickets**, not "patch the delta". The next step is a fresh spec+design gate, not incremental edits.

---

## Open questions for Sam / the team
1. **EUDPA-185** — is it dead (superseded by 287) and to be closed, or does it still carry independent scope? Its text wasn't rewritten.
2. **The decisions log (D3, D13, D21, D23, D24, D26, D23…)** and the **"Live Animals Data Fields V4 — Common Attributes"** Standard Address Block — where do these live? The spec must ingest them to be authoritative again.
3. **EUDPA-198** — absorb into 294/287 as the tickets suggest, or track separately?
4. **Reuse vs restart** — how much of the delivered `trade-imports-operators` service + animals-frontend UI is salvageable into `trade-imports-address-book` + `trade-imports-ins-frontend`? (Model/validation/soft-delete port cleanly; scoping, API paths, typing, terminology, and the host frontend do not.)
5. **Sequencing** — the new blocking graph is 287 (skeleton) → {286, 186, 294} → 293 & 295. Build order is now dictated by the tickets.
