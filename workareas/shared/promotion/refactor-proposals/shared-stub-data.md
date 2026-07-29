> **Provenance.** Produced by a read-only investigation agent (2026-07-28) fleshing out Sam's rough
> idea ("services + stub.js stand up the full UI — use __mocks__ so the same stub data drives unit
> tests?"). All claims grounded in file:line against the live-animals frontend. Not yet actioned —
> a proposal for Sam to react to.

# Proposal: one canned dataset for stub-mode UI + unit tests (live-animals)

## 1. Assessment (verdict)

Sam's instinct is **half right, and the good half is already built**. The goal — one canned dataset behind both the stub-mode UI and the tests, so they can't drift — is sound. But a literal vitest `__mocks__` directory is the **wrong mechanism**: it swaps whole modules at the boundary Sam actually wants tested, which directly contradicts this repo's load-bearing rule "mock at the network boundary, not the module boundary". More importantly, for the *option-list* services the repo has **already achieved the one-source goal by a different route** — the run-mode seam. Controller/service unit tests import the real service interface (`services/<name>/index.js`), which in stub mode is backed by `stub.js`; they do not re-declare the dataset. So there is little duplication to remove there.

The one genuine, narrow opportunity is the **write-only `_capture/fixtures/*.json`** (real MDM response shapes) that nothing currently reads: wiring those into the network-boundary mocks (and, optionally, as `stub.js`'s seed) would give a single canned dataset feeding both runtime stub mode and the `real.js`/`client.js` boundary tests — **without any module substitution**. That is the shape to build, if anything.

## 2. Current state (with evidence)

**The service shape** (`docs/services.md:9-42`): each `services/<name>/` has `index.js` (sync interface controllers call), `stub.js` (canned data), and — only where a real backend exists — `client.js` or `real.js` (the HTTP caller). Two wiring patterns behind `LIVE_ANIMALS_MODE` (`services/mode.js:1-3`, default `stub`):
- **Prime-at-boot** (`countries`, `ports`): `index.js` holds module state seeded from `stub.js`; `prime()` fetches via `client.js` in real mode, no-op in stub. See `services/countries/index.js:5-11`.
- **Module switch at import** (`document-uploads`, `persistence/records`, `persistence/session`): `index.js` picks `real.js` or `stub.js` by `isRealMode()` — e.g. `services/document-uploads/index.js:5` (`isRealMode() ? realUploads : stubUploads`).

**Where the canned data physically lives:** inline in each `stub.js` as literal maps/arrays — `services/countries/stub.js:1-33` (`COUNTRY_LABELS`), `services/ports/stub.js:1-80` (`PORTS`, 79 entries), `services/address-book/stub.js` (416 lines of saved parties). This is deliberate: `docs/decisions.md:246-252` (principle 6) says options come from the MDM services precisely so "the prototype shows the same real option lists as production, from one source, with no duplicated list to drift."

**How unit tests get service data today — three distinct patterns, and NONE is a whole-dataset copy:**

1. **Option-list/interface tests import the real interface** (backed by stub). `features/transport/port-of-entry.controller.test.js:19` → `import * as ports from '../../services/ports/index.js'`; `features/check-answers/check-answers.test.js:4` → `import { commodityCodeFor } from '../../services/commodities/index.js'`; `services/address-book/address-book.test.js:3` → `import * as addressBook from './index.js'`. They assert **single expected literals** (`port-of-entry...test.js:103-104` expects `{ value: 'GB ABD', text: 'Aberdeen Harbour (GB ABD)' }`), not a re-declared list. That literal is the only "duplication", and it's an assertion oracle, not a dataset.

2. **Store tests import the persistence stubs directly** as the configured store, per the boot-replication rule (`docs/testing.md:122-142`): `port-of-entry.controller.test.js:15-16` imports `records/stub.js` + `session/stub.js` and feeds them to `configureRecords`/`configureSession`. Again, the stub *is* the seam, not a copy.

3. **Network-boundary tests use a fetch mock with *synthetic* data — deliberately NOT the stub dataset.** `services/document-uploads/real.test.js:1-6` uses `vitest-fetch-mock` (`createFetchMock(vi)`); `services/run-mode.test.js:7` uses `vi.stubGlobal('fetch', …)`. Crucially, `run-mode.test.js:81,93` feed `{ code: 'ZZ', name: 'Zedland' }` — synthetic values chosen *because they differ from the stub* — so that `run-mode.test.js:96,99-101` can prove `prime()` **replaced** the stub (`originLabel('ZZ')` becomes defined, `originLabel('AT')` becomes undefined). Feeding real stub data here would make that assertion unfalsifiable.

**The unused capture mechanism.** `package.json:36` (`capture:live-animals`) runs `_capture/capture.js`, which fetches live reference-data and writes `_capture/fixtures/{countries,countries-origin,ports-of-entry}.json` (`capture.js:9-20,47-57`). Grep confirms **no test or source module reads those fixtures** — they are write-only today. So the repo already holds a second, real-shape representation of the same country/port lists that `stub.js` hand-maintains — the true latent divergence risk.

**E2E vs unit sharing.** The stub-mode `journeys` Playwright project is the "frontend canned" owner (`docs/test-responsibility-matrix.md:22-23`). The E2E journey selects **single happy-path values** (e.g. `GB ABD`), driven by `flow/fixtures/happy-path.json`. It shares no *dataset* with the unit tests — both simply run against the same stub-mode server / same `stub.js`, which is the single source. There is no divergent copy to reconcile.

**Net:** duplication today is essentially zero for the dataset itself; the redundancy Sam senses is (a) the assertion literals scattered in tests (irreducible — tests need oracles) and (b) the **two representations of the same reference lists**: `stub.js` (hand-authored) vs `_capture/fixtures/*.json` (captured, unused).

## 3. The network-boundary principle vs `__mocks__`

A vitest `__mocks__/<module>.js` next to a module makes `vi.mock('<module>')` substitute the **whole module**. If applied to `client.js`/`real.js`, the test would replace the very code that builds the URL, sets the tracing header, checks `response.ok`, and parses the body — i.e. it would stop testing the thing the boundary test exists to prove. `real.test.js:34-51` earns its keep precisely because the real `fetch` is exercised and the test inspects the outgoing URL, method, `FormData` and headers. Module substitution throws that away and leaves a coupling check. This is exactly what `tim/CLAUDE.md:18` forbids ("Don't `vi.mock()` your own modules — it leaves them untested"), and what `docs/best-practices/node/testing/frontend.md` codifies as the "API client" pattern (mock `global.fetch`, assert call shape).

So: **sharing the `__mocks__` *mechanism* is rejected.** **Sharing the canned *data* is endorsed** — but delivered by feeding a shared fixture into the existing network-boundary mocks and into `stub.js`, never by substituting modules.

**Precedent that this is the house style:** the bridge/persistence layer already does shared-canned-data-without-module-mocking — `services/persistence/records/notification-mapper.test.js:3` and `fulfilment-codec.test.js:2` both import a single `bridge/fixtures/characterisation-corpus.js`, and `mapper-a-contract.test.js:8` `readFileSync`s a shared skeleton fixture. That is the template to copy: a shared **data** module/JSON, consumed by many tests, with no `vi.mock()` of first-party modules.

## 4. Recommended shape

Two moves. The first is essentially free and closes the only real divergence gap; the second is optional polish.

### Move A (recommended) — make the captured fixture the single canned reference dataset, feeding both the boundary mock and (optionally) the stub seed

Give the write-only `_capture/fixtures/*.json` a home so one dataset drives runtime stub mode *and* the boundary tests.

- **Network-boundary tests** for `countries`/`ports`/`document-uploads` stop hand-typing `'Zedland'`/`'Zed Port'` and instead load the captured real-shape fixture as the mock's response body — realistic MDM shapes, one source. The prime-replacement assertions still work because the *fixture* (real MDM codes) differs from *stub.js* by construction, which is exactly the property those tests need.
- **`stub.js` seed** (optional, higher-value, higher-cost): derive `COUNTRY_LABELS` / `PORTS` from the same captured fixture at module load, so the hand-authored list and the real list can no longer drift. This is the literal realisation of principle 6's "one source".

**Before** (`services/run-mode.test.js:81`, synthetic, unrelated to any real data):
```js
stubFetch(async () => okResponse([{ code: 'ZZ', name: 'Zedland' }]))
// …asserts prime() installs 'Zedland' and drops the stub's 'AT'
```

**After** (one shared fixture; still a network-boundary mock; prime-replacement still provable because fixture ≠ stub seed):
```js
import realCountries from '../_capture/fixtures/countries-origin.json' with { type: 'json' }
// or a tiny loader in services/_capture/fixtures.js
stubFetch(async () => okResponse(realCountries))
// asserts prime() installs a code from realCountries and drops a stub-only code
```

And, if Move A's stub-seed half is taken (`services/countries/stub.js`):
```js
// Before: hand-authored 31-entry map
export const COUNTRY_LABELS = { AT: 'Austria', /* …hand-typed… */ }

// After: one source — the same captured reference list the boundary mock uses
import reference from '../_capture/fixtures/countries-origin.json' with { type: 'json' }
export const COUNTRY_LABELS = Object.fromEntries(
  reference.map(({ code, name }) => [code, name])
)
```

### Move B (do NOT do) — a `__mocks__/client.js`

Explicitly rejected per §3. Note it isn't even needed: because `LIVE_ANIMALS_MODE` defaults to `stub` (`mode.js:1`), any test that imports `services/<name>/index.js` **already gets the stub-backed interface for free** — the run-mode seam is the module-swap, done in production code and covered by `run-mode.test.js`. Tests get "the same stub data" today by importing the interface; no `__mocks__` layer buys anything.

**What changes in each layer under Move A:**
- `services/_capture/` — add a tiny `fixtures.js` loader (or rely on JSON import assertions) so tests and stubs share one read path; keep `capture.js` as the refresh tool.
- `services/*/real.test.js`, `services/run-mode.test.js` — swap synthetic literals for the shared fixture; assertions restructure from "installs `ZZ`" to "installs a fixture code, drops a stub-only code".
- (optional) `services/countries/stub.js`, `services/ports/stub.js` — seed from the fixture instead of a hand-authored list.
- Controllers, `index.js` interfaces, E2E, `happy-path.json` — **unchanged**.

## 5. Increment plan (each landable with unit + E2E green)

1. **Add the shared fixture loader.** Introduce `services/_capture/fixtures.js` exporting the captured `countries`, `countries-origin`, `ports-of-entry` datasets (fail loud if a fixture is missing). Unit test the loader. No behaviour change. *(Verify: `npm run test:live-animals`.)*
2. **Repoint one boundary test (canary).** Rewrite `services/run-mode.test.js`'s countries cases to feed the shared fixture instead of `'Zedland'`, keeping the prime-replacement assertion intent (use a stub-only code as the "dropped" oracle). Prove the boundary is still exercised. *(Verify: unit suite; E2E unaffected.)*
3. **Fan out to remaining boundary tests.** Apply the same swap to the ports cases and `document-uploads/real.test.js` where a realistic body helps (upload IDs stay synthetic — they aren't reference data). *(Verify: unit suite.)*
4. **(Optional, gated on §6 answers) Seed `stub.js` from the fixture.** Derive `COUNTRY_LABELS` then `PORTS` from the captured fixtures. This is the divergence-killer but couples the stub to a committed capture — do it only if Sam accepts committing the fixtures as canonical. *(Verify: full unit suite + `npm run test:e2e` — the stub-mode journey must stay green since the option lists still render.)*
5. **Document the seam** in `docs/services.md` (one paragraph: "`_capture/fixtures` is the single canned reference dataset; stub seed and boundary mocks both read it").

## 6. Risks / tradeoffs / open questions for Sam

- **Rejected as designed:** literal `__mocks__` module substitution — it would gut the boundary tests and break the load-bearing network-boundary rule. Confirm you're happy dropping the `__mocks__` framing in favour of a shared **data** fixture.
- **The prime-replacement tests need fixture ≠ stub.** If Move A step 4 seeds `stub.js` *from* the fixture, the stub and the "fetched" data become identical, and tests like `run-mode.test.js:96` ("`prime()` replaces the stub") lose their oracle. Mitigation: keep the boundary mock's "real" payload a **distinct slice** (or a mutated copy) of the fixture, or assert replacement via a code present in one and not the other. This is a real design point, not a detail — it's why steps 1-3 (mock only) are safe and step 4 (stub seed) needs care.
- **Committing captured fixtures.** `_capture/fixtures/*.json` are currently produced by hitting live reference-data (`capture.js:5-6`). Making them canonical means committing them and treating a stale capture as a review concern. Acceptable? Or keep them dev-only and let Move A cover boundary tests only?
- **Scope of benefit is small.** Because principle 6 + the run-mode seam already give option lists a single source, the payoff is mostly (a) realistic boundary-mock payloads and (b) closing the `stub.js`-vs-captured-list drift. If that drift isn't hurting today, steps 1-3 alone (a couple of hours) capture most of the value; step 4 is optional.
- **Not every stub is reference data.** `address-book/stub.js` (saved parties) and the `persistence` stubs are *behavioural* fakes with search/paging logic, not option lists — there is no MDM capture for them and no divergence risk. Leave them as-is; this proposal is only about the reference-data services.

**Bottom line:** endorse the intent, reject the `__mocks__` mechanism, and — if worth the effort — realise "one canned dataset" by giving the already-present `_capture/fixtures` a consumer: the network-boundary mocks (safe, cheap) and optionally the `stub.js` seed (higher value, needs the fixture≠stub care above).
