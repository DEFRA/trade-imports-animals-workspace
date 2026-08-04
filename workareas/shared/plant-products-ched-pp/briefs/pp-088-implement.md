# pp-088 — the recoverable-save path is dead on every plant page except declaration

This brief OVERRIDES the generic `implement.md`. **Production code inside `sets/plant-products/` plus
its tests.** Nothing outside `sets/plant-products/` may change — a forced change there is `ok:false`
with evidence, not a quiet edit.

## The defect, verified by me at HEAD — every line reference below I read myself

`src/server/app/sets/plant-products/services/records/real.js`:

- `failed()` (`:23`) returns a **plain `Error`**. `expectStatus()` (`:28`) throws it unmarked.
- `expectStatus` is used by **every operation except `finalise`**: `create` **`:99`**,
  `replaceFulfilment` **`:175`**, `reloadNotification` **`:89`**, `getNotification` **`:51`**,
  `listDocuments` **`:63`**, `deleteDocument` **`:72`**, `createDocument` **`:81`**, `list` **`:120`**,
  `has` **`:137`**, `transition` **`:192`** (amend / cancelAmend / softDelete), `copy` **`:254`**.
- Only `finalise` marks anything: `expectRecoverableStatus` (`:32`) and pp-081's `recoverableFetch`
  (`:38`).

`shared/kit.js:114` `recoverableSave` returns the recoverable branch **only** when
`isRecoverableBackendError(error)` (`:118`). At least ten plant controllers call it. So that branch is
**unreachable in production** on every page except declaration: a backend 500 mid-save gives a bare
500 where the equivalent live-animals page recovers.

**⚠ The plan's line numbers are ~2 low (it says create `:97`, replaceFulfilment `:173`, reload `:87`).
Trust the symbol, not the line number.**

## ⚠ THE OPEN QUESTION IS RULED. Reads ARE recoverable. Do not re-open it

The increment carries: *"Should a failed GET (reload, list, check) be recoverable, or only writes?"*
**Answer: read-vs-write is the wrong axis.** Every **backend-response failure** is recoverable;
every **programming or state error** is not. Three reasons, each verified by me against source:

1. **`replaceFulfilment` — the exact path this increment exists to fix — is mostly reads.** Its thunk
   runs GET (`resolveStatus` `:165`) → PUT (`:170`) → GET (`listDocuments` `:176`) → N DELETE → N POST
   → GET (`reloadNotification` `:183`). **A writes-only policy leaves three of the six legs of a page
   save unrecoverable**, so a backend that 500s on the reload leg still yields a bare 500 and the
   increment fails its own first acceptance criterion.
2. **Live-animals marks reads.** `services/persistence/records/real/http/get-fulfilment.js:11` and
   `lifecycle/read.js:31` (list) both throw `failed()` → `BackendRequestError`, whose **constructor**
   sets the symbol (`records/errors.js:9`). And live-animals' own `replaceFulfilment`
   (`real/lifecycle/mutate.js:35`) opens with `resolveStatus` — a read — inside the save.
3. The discriminator that matters is pp-081's: **backend said no** vs **we called it wrong**.

## ⚠ HAZARD 1 — SIX THINGS MUST STAY NON-RECOVERABLE, AND A BLANKET try/catch SWALLOWS ALL SIX

This is the trap pp-081's review found one level down: the first version of that fix caught the whole
fetch promise and would have made a **permanent misconfiguration** look like "try again" forever.

Must remain **not** recoverable, and say in your report which mechanism keeps each one so:

1. `assertWritable` — `Journey "X" is SUBMITTED — writes blocked` (`:150`). The backend answered fine.
2. `resolveStatus` — `Unknown journey "X"` (`:144`). The GET succeeded; 404 became `undefined`.
3. `copy` — `Idempotency-Key must not be blank` (`:248`). No request is made.
4. `clear` — `records.clear is not supported in real mode` (`:264`).
5. **JSON parse failures** — already pinned at `real.test.js:577`.
6. **Request-construction failures** — already pinned at `real.test.js:591`. **`new Request(...)` must
   stay constructed OUTSIDE the `.catch`** (`:39`). That structural boundary is the whole reason
   pp-081's fix is safe; do not replace it with a guess at error types or message text.

## ⚠ HAZARD 2 — KILL THE CLASS: DELETE THE UNMARKED VARIANT, DO NOT ADD CALLS BESIDE IT

The weak fix marks the eleven call sites and leaves `expectStatus` in place — then the twelfth
operation added next month is unmarked again, exactly as `usingGvms` was the one converter without the
guard (pp-087).

**The shape I want: after this increment there is exactly ONE way to reach the backend and ONE way to
check a status, and both mark.** Concretely — delete the plain-`Error` status path entirely so it
cannot be called, and route every operation through the marking pair. Names are yours; the invariant
is that **the unmarked variant does not exist**. If deleting it is impossible for a reason I have not
seen, that is an `ok:false` with evidence — not a silent retreat to marking call sites.

**Pin it structurally, in the pp-087 shape.** `real.js:267` exports a `records` object with 11 keys.
Enumerate them in a test and assert **both**: (a) each operation surfaces a **recoverable** error when
the backend returns 500, and (b) the operation key set **exactly equals** the pinned set — so a new
operation cannot be added without proving it. `clear` is the one deliberate exception (it never calls
the backend); pin it explicitly as non-recoverable rather than filtering it out silently.

## ⚠ HAZARD 3 — I AM RULING IN A SECOND AXIS, AND IT GOES BEYOND LIVE-ANIMALS

Marking **statuses** is only half. `expectRecoverableStatus` inspects a **response**; a refused
connection never produces one — that is pp-081's entire premise, and it applies verbatim to a page
save. Today: backend down → declaration recovers, **every other page 500s**. That inconsistency was
created by pp-081 scoping correctly to `finalise`.

**So `recoverableFetch` extends to every operation too.** Note this is plant going **beyond**
live-animals, which has **no** fetch-rejection handling anywhere in `records/real/` — I grepped; the
only `catch`es there are projection-failure collection (`mutate.js:23`, `put-projection.js:11`). I am
ruling it in deliberately: it is inside `sets/plant-products/`, and half-fixing this leaves the
increment's headline criterion unmet for the likeliest production failure. **Pin the network-rejection
case for `replaceFulfilment` specifically** — the every-page-save path with the widest blast radius.

## ⚠ HAZARD 4 — `load` AND `has` MUST KEEP THEIR NOT-FOUND CONTRACT

`getNotification:50` returns `undefined` on 404 **before** the status check; `has:136` returns `false`
the same way. Both branches sit *above* the check and must stay there. `load` returning `undefined` is
load-bearing for the dashboard. A 404 is **not** a recoverable error — it is a successful answer of
"no". Only *other* non-200 statuses throw. Keep a test that a 404 still returns `undefined`/`false`.

## ⚠ HAZARD 5 — THE DASHBOARD TEST INVENTS THE ERROR IT NEEDS. FIX IT, DO NOT DELETE IT

`sets/plant-products/journeys/linear/features/dashboard/controller.test.js:262`,
*'re-renders the dashboard at 500 for a recoverable create failure'*, stubs `create` to throw
`markRecoverableBackendError(new Error('create unavailable'))` at `:267` — **an error the real adapter
cannot produce**, because `create` uses the unmarked `expectStatus`. Sixth instance of the pp-038
class: a hand-authored fixture standing in for what the system produces.

Once the adapter marks its own failures, this test must exercise **an error the adapter actually
produces** — drive it from a 500 response through the real adapter, or throw exactly what the adapter
now throws. **Do not delete the test and do not keep the hand-marking.** Report the before/after.

## Baselines — I ran all five myself at frontend `691cea18`. Re-run them; do not quote mine forward

- `test:plant-products` — **698** passed, 58 files
- `npm test` — **2,336** passed / 8 skipped, 217 files
- `test:live-animals` — **559** passed, 65 files (**a change here is a REGRESSION**)
- `test:features:plant-products` (**`PORT=3201`**) — **257**
- `lint:arch` — **0 errors / 0 warnings**, **671** modules, **2,126** dependencies;
  `shasum .dependency-cruiser-known-violations.json` = `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

**My expectation, which you should refute if it is wrong:** if everything stays inside `real.js` there
is **no new module**, so 671/2,126 unchanged — `.dependency-cruiser.cjs:181` excludes `\.test\.js$`,
so new test files do not count, but an `.e2e-helper.js` or any new non-test module **does**.
**⚠ My briefs have been wrong seven times on this build and every time the implementor or reviewer was
right. Correct my numbers with evidence — do NOT make the code match them, and do not echo them back
as confirmed.** Derive the count from that config yourself.

`test:live-animals` staying at 559 is **necessary but not sufficient** evidence that nothing outside
the set moved — say so rather than implying it proves byte-identity.

## The decisive mutations I expect you to run, and to report by failing test NAME

1. Revert `replaceFulfilment`'s status check to the unmarked variant → the new page-save pin must fail
   **by name**.
2. Revert the fetch wrapping on `replaceFulfilment` → the network-rejection pin must fail **by name**.
3. **State what the code now does differently before believing any green run.** A green mutation run
   is evidence only if the mutation actually changed behaviour — and on this build an inert mutation
   has falsely *refuted* as well as falsely confirmed.

## Rules that apply

- **Stop and report rather than fix production code you were not sent to touch.** An `ok:false` with
  evidence is often the most valuable outcome here and carries **no penalty**. Inventing data or
  quietly widening scope does.
- **Never invent a fixture value.** Ask what every fixture is a copy of; if you cannot name the
  controller or adapter that produces it, stop.
- Any test count that moves must be **explained**, especially downward:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- `npm run format` before finishing. Do not commit — the orchestrator lands it.
- Welsh is covered (machine-draft, reviewed by a Welsh-speaking tech lead). Mention it once at most.
