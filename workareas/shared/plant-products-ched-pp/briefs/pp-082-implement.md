# pp-082 — make the records-port test double REPLACE like the real backend, not merge

This brief OVERRIDES the generic `implement.md` wherever they differ.

**One file is in scope:**
`src/server/app/sets/plant-products/services/records/records-port.test.js`

This is a **test-only** increment. It changes no production code. See hazard 5 — that constraint is
load-bearing, not boilerplate.

---

## The defect, stated precisely

`records-port.test.js:100` is:

```js
const replaced = { ...notification, ...body }
```

The fake backend **merges**. The shipped backend **wholly replaces the content**. So a field — or an
entire section — omitted from the PUT body survives in the double and is **nulled** in production.
Consequence: **deleting a whole section mapper from `to-dto.js` keeps this parity suite green while
real submission erases that section.** A parity pin is only as strong as the fidelity of the double.

## Hazard 1 — the merge is INVISIBLE on a fresh draft. Only the second write, or finalise, can see it

For a single `replaceFulfilment` against a newly-created empty draft, merge and replace are
**indistinguishable**: `{ ...emptyDraft, ...body }` is just `body` plus the server fields. Every
existing parity test does exactly that, which is why they are all green.

The sequence that discriminates is **populate → finalise**, and it is a real production path:

`real.js:196` `finalise` does GET → `fromDto(loaded)` → `buildNotificationBody` (→ `toDto`) → **PUT**.
If `toDto` omits a section, finalise's PUT omits it, and the real backend nulls it — **the user's
submitted notification silently loses that section.** The merging double hands the old value straight
back, so nothing fails.

**Seed representative populated content, then finalise, then load, and assert the content survived.**
That is the shape the acceptance criteria are asking for.

## Hazard 2 — the exact backend semantics, VERIFIED. Copy these; do not invent them

I read `PlantProductsNotificationService.replace()` (backend `:74-96`) and the **generated**
`target/generated-sources/annotations/.../PlantProductsNotificationMapperImpl.java:92-128`. Not
MapStruct defaults from memory — the generated code.

**Order of checks in `replace`:**
1. Path reference ≠ body `referenceNumber` → **400**, *before any lookup*.
2. Not found → **creates** it and returns **201** (stamping server fields).
3. Found but not writable (status not `DRAFT`/`AMEND`) → **400**.

**`applyContent` assigns all 16 content fields unconditionally from the DTO** — an absent field
becomes **null**:

`origin, reasonForImport, commodity, additionalDetails, consignor, consignee, importer, destination,
packer, responsiblePerson, nominatedContacts, transport, goodsMovementServices, isCuc, billing,
declaration`

(`nominatedContacts` has collection-specific generated code — clear-and-addAll, or set-null when the
DTO's is null. It nets to the same null-on-absent. Do not treat it as an exception.)

**`applyContent` does NOT touch these, so they SURVIVE a replace:**
`id, referenceNumber, chedType, status, ownership, created, updated, copyIdempotencyKey,
submittedBaseline, expireAt`

**So the fixture must replace CONTENT while PRESERVING the server-owned fields.** A blanket
`notifications.set(referenceNumber, body)` is wrong in the *other* direction — it would drop `status`
and `created`, breaking the writable checks and the submitted-instant test. Getting this wrong in
either direction is the whole increment.

## Hazard 3 — `accompanyingDocuments` are NOT part of the content replace

Documents are a **separate subresource** (`PlantProductsAccompanyingDocumentController`), and
`PlantProductsNotificationMapper.toResponse` explicitly `@Mapping(target = "accompanyingDocuments",
ignore = true)` — the controller grafts them on at GET (`:114-118`). The current fixture already
models this with `documentsByReference`, correctly.

**A whole-content replace must NOT clear the documents map.** `real.js:176-182` manages documents
explicitly: list, delete each, recreate each. If your replace wipes documents, the
`round-trips two accompanying documents` test will fail and the *fixture* is what is wrong.

## Hazard 4 — the STUB leg structurally CANNOT see a `to-dto.js` change. Do not force it to

`stub.js:132-137` is `record.fulfilment = clone(fulfilment ?? {})`. **The stub never touches the
mappers at all.** So the acceptance criterion "deleting a section mapper fails a parity test by name"
can only ever fail on the **`— real HTTP adapter`** parameterisation of `describe.each`. That is
correct and expected.

Three things follow, and they are the most likely way this increment goes wrong:

- **Do NOT weaken or genericise a shared assertion so both legs pass trivially.** That is the pp-038
  class — a test that asserts something the system does not actually hold — and it is the dominant
  failure mode on this branch.
- **Do NOT route the stub through `to-dto.js`** to make the legs symmetric. That is production code
  and out of scope.
- If a populated round-trip genuinely cannot hold on both legs, **say so and report it**. A real
  behavioural divergence between stub and real is a finding worth having, not a thing to paper over.

Note also `stub.js:139` `finalise` sets `record.declaration` directly and does **no** PUT, so it
cannot lose data at finalise. The real adapter can. That asymmetry is the point.

## Hazard 5 — if this exposes a real defect, STOP. Do not fix production code

The round trip `answers → fulfilments → DTO → answers` has **never been verified to be a fixed
point** — that is recorded explicitly as unverified in the standing method. This increment is the
first thing likely to expose it.

If seeding populated content and finalising shows that **`fromDto`/`toDto` lose or mangle data the
frontend legitimately holds** — an asymmetry, a section `toDto` writes that `fromDto` cannot read
back, anything of that kind — that is a **real shipped defect and a new increment**.

**Return `ok:false` with the evidence. Do not edit `real.js`, `to-dto.js`, `from-dto.js`, `stub.js`
or any other production file to make the suite pass.** Eight increments on this build have stopped
rather than proceed, and every one was right. **Stopping twice carries no penalty; quietly patching
production to go green is the worst outcome available here.** An `ok:false` naming a real defect is
the most valuable thing you can return.

## Hazard 6 — ask what every seeded value is a copy of

Hand-authored fixtures standing in for what the system actually produces is the **dominant failure
mode on this branch — six instances so far.** A fixture value no controller writes (`'manual'` where
the controller writes `'MANUAL'`), an invented `arrivalDate` shape, a mock asserting its own return
value.

So: build the populated content by putting **real answer keys through `assembleFulfilments`**, the
way the existing tests at `:248` and `:268-293` already do. Do **not** hand-write DTO-shaped objects
into the fixture. Every value should be traceable to something a controller really writes. If you
cannot source a value, leave that section out and say which and why — **do not invent one.**

## Acceptance criteria (from the plan, unchanged)

1. The network fixture replaces rather than merges, matching the backend's whole-content semantics
   set out in hazard 2 — including reference matching, the writable check and response normalisation.
2. The parity suite runs against a **populated** notification, not an empty one.
3. **Deleting a section mapper from `to-dto.js` fails a parity test BY NAME** — the regression the
   current double cannot see.
4. Existing parity assertions still pass **unchanged**, or every change is reported with
   before/after. Report any test renamed, and any test count that moves in either direction.

## The decisive mutation I expect you to run and report

**Delete `mapTransport` from `SECTION_MAPPERS` (`to-dto.js:224`)** — the frozen 9-entry array at
`:219-229` — run `test:plant-products`, and report **the exact failing test name(s)**. Then restore
it **byte-identically** and confirm the diff against the index is empty.

**A green-then-red run is only evidence if the mutation actually changes behaviour.** Before you
believe it, state in one sentence what the code now does differently — i.e. that the PUT body no
longer carries a `transport` key, so the backend nulls it. That check has been got wrong three times
on this build (pp-025, pp-036, pp-040), each time producing a finding that was not real.

Run a second mutation of your own on a **different axis** if you see a good one, and say what it
proved.

## Baselines — I RAN THESE MYSELF just now at `c45e8fc0`. Do not quote them forward; re-run them

- plant unit `test:plant-products` — **687 passed (58 files)**
- `npm test` — **2,325 passed / 8 skipped (215 passed + 2 skipped = 217 files)**
- `test:live-animals` — **559 passed (65 files)**. **Unchanged for the entire build. Any movement
  here is a REGRESSION** and this increment touches nothing that could legitimately move it.
- `lint:arch` — **0 errors / 0 warnings, 671 modules, 2,128 dependencies**, 3 known violations
  ignored. `shasum .dependency-cruiser-known-violations.json` =
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a` — must not change.
- plant Playwright `test:features:plant-products` — 256 (**use `PORT=3201`**; Docker holds 3000/3100)

**Do not predict a `lint:arch` module-count change for a `.test.js` edit.** `.dependency-cruiser.cjs:181`
excludes `\.test\.js$` from the graph. An orchestrator predicted a count here before and was refuted
from that config — correctly. **If any number in this brief contradicts what you find in the source,
the source wins: say so with the file and line rather than making the code match my number.** Five
orchestrator briefs on this build have been wrong and the implementor was right every time.

## Verification

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Leave your work **staged, not committed**. Report: what you changed and why, the mutation result with
exact test names, every count above, anything you deliberately did not do, and **anything you could
not verify yourself.**
