# pp-082 — review brief

Review the **staged, uncommitted** change in `trade-imports-animals-frontend`:
`src/server/app/sets/plant-products/services/records/records-port.test.js` (+105 / −5).

`git status` first. **The work is staged. Do not start over, do not unstage, do not commit.**

## What the increment is for

`records-port.test.js:100` used to be `const replaced = { ...notification, ...body }` — the fake
backend **merged** where the shipped backend **wholly replaces the content**. So dropping a whole
section mapper from `to-dto.js` kept this parity suite green while real submission would erase that
section. The increment raises the double's fidelity and adds a populated finalise round-trip.

## Axes I HAVE ALREADY CHECKED — do not re-tread these

1. **The backend's real semantics.** I read `PlantProductsNotificationService.replace()` (`:74-96`)
   and the **generated** `target/generated-sources/annotations/.../PlantProductsNotificationMapperImpl.java:92-128`.
   Confirmed: 400 on path/body reference mismatch before any lookup; create-and-201 when absent; 400
   when found-but-not-writable; `applyContent` assigns all 16 content fields unconditionally so an
   omitted field becomes null; `referenceNumber/status/chedType/ownership/created/updated` survive.
2. **The `nominatedContacts ?? []` normalisation is faithful, not invented** —
   `PlantProductsNotificationResponse:36` normalises null to `List.of()` in its compact constructor,
   and the fixture correctly applies it only on the GET path (the controller returns the *entity*
   from PUT, not the response record). I checked this specifically because it looked like a
   convenience fudge. It is not.
3. **My own mutation, measured before and after.** Removing `referenceNumber: journeyId` from
   `buildNotificationBody` in `real.js` failed **2** tests before this increment (both in
   `real.test.js`) and **11** after (those 2 plus **9 port parity tests**, all on the real-adapter
   leg). Restored byte-identically. So the fixture genuinely enforces the request contract now.
4. **The implementor's two mutations** — deleting `mapTransport` from `SECTION_MAPPERS`, and
   clearing documents during the content PUT.
5. **The +2 test count** is one new test across the two `describe.each` legs. Consistent, explained.

## ⚠ Axes that have had NO review at all — this is where to spend your effort

**A. THE SEEDED ANSWERS IN THE NEW TEST. Highest priority.** The new test hand-writes an `answers`
object (`countryOfOrigin: 'FR'`, `reasonForImport: 'INTERNAL_MARKET'`, `borderControlPost: 'CONPNT'`,
`inspectionPremises: 'INSPBER1'`, `meansOfTransport: 'ROAD_VEHICLE'`, `arrivalDate: '2026-08-03'`,
`arrivalTime: '14:05'`, `usesContainers: true`, `officialSeal: true`, `contactIsAgent: true`, a
`PHYTOSANITARY_CERTIFICATE` document, and more).

**Hand-authored fixtures standing in for what the system actually produces is the dominant failure
mode on this branch — six instances so far.** Real examples from this build: a fixture saying
`commodityInputMethod: 'manual'` where the controller writes `'MANUAL'`; an invented `arrivalDate`
shape of `{day, month, year}` where transport actually persists an ISO string; a test hand-marking a
recoverable error the real adapter cannot produce.

**Go key by key. For every one, name the controller or evaluation module that really writes it and
confirm the value's SHAPE and CASE match.** Are the enum-ish values real option values? Is
`arrivalDate` really a bare ISO date and `arrivalTime` really `'HH:mm'`? Are the container and
nominated-contact field names the ones the collection controllers write? Is `usesContainers` a
boolean at rest, or a `'yes'`/`'no'` string that a converter turns into a boolean — note pp-087 found
a converter re-application bug in exactly this area, so check `features/evaluation.js` bindings.
**Any key whose value the system does not actually produce makes the new test prove less than it
appears to.**

**B. `chedType: 'CHEDPP'` and `STUB_OWNERSHIP` (`'stub-org'` / `'Stubbed organisation'`) are
hand-authored values I have NOT traced.** Check them against the backend enum / real create
response. If they cannot be sourced, say so — the honest options are to source them or drop them,
not to keep an invented value.

**C. Is `CONTENT_FIELDS` right and complete?** I derived the 16 from the generated mapper. Derive it
**independently** and say whether you agree, including order-independence and whether any field in
that list is one the frontend never writes (e.g. `consignee`).

**D. Can the new test pass VACUOUSLY?** It asserts
`projectAnswers(loaded.fulfilment)` `toEqual(answers)`. If `projectAnswers` symmetrically drops a key
on both sides, or if a section never round-trips at all, the equality could hold while proving less
than it claims. **Check that every section named in the answers genuinely survives the full
GET → fromDto → toDto → PUT → load path**, rather than being absent from both sides.

**E. Does `normaliseContent(body)` model absent-vs-explicit-null correctly?** It is
`body[field] ?? null`, which collapses `undefined` and `null`. Is that what the backend does, given
Jackson deserialisation of an absent JSON key versus an explicit `null`?

**F. Is seeding a fresh draft with all 16 content fields explicitly `null` faithful** to what the
real `POST /plant-products/notifications` actually returns over the wire? Depends on the Jackson
null-inclusion config. If the real response omits them, the double now differs from reality in the
opposite direction — a smaller version of the same class of defect this increment exists to fix.

**G. The `const notification` lookup MOVED** — it used to be computed once above the GET/PUT
branches, and is now computed inside GET, inside PUT (as `let`), and again below the PUT block for
the documents/status/copies branches. Confirm no branch changed behaviour, especially
`PUT .../status` and `POST .../copies`.

**H. Did any existing assertion weaken?** The implementor claims nothing was changed or renamed.
**Verify that against the diff rather than taking it.** A rewrite can strengthen one axis while
silently weakening another — that happened on pp-080, where moving substring → exact matching was a
real gain that simultaneously dropped section scoping, invisible in the diff stat and invisible to a
green ladder.

## Standing defect classes to keep in mind

- **A green mutation run is only evidence if the mutation actually changes behaviour** — wrong three
  times on this build.
- **A test name is not evidence of what it discriminates.**
- **Prefer a structural pin that kills the CLASS over a fix that kills the instance.** Is there a
  pin available here that would stop a *future* section mapper being added without round-trip
  coverage — the way `features/evaluation.test.js` asserts the converter list exactly equals the set
  with pinned input shapes? Say so if there is; that is the shape to reach for.
- **Transposition defects run in both directions** — check live-animals' equivalent double for the
  same merge-vs-replace flaw. If live-animals has it too, that is a **separate** finding and a new
  increment, **not** something to fix here.

## Rules

- **This is a test-only increment. Do not edit production code**, and do not propose a production
  edit as part of it. If you find a real production defect, report it as a finding for a **new
  increment** — that is a valuable outcome, not a failure.
- Report each finding as real / real-but-owned-elsewhere / speculative, with file and line.
- **Findings on already-landed code become new increments; only findings on this staged work get
  fixed now.**
