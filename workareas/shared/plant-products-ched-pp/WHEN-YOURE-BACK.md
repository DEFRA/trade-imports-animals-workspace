# WHEN YOU'RE BACK — plant-products/CHED-PP planning run

Running log of decisions the overnight orchestrator made and things Sam needs to look at.
Newest at the top. Each item is 3–4 sentences: what, why, what to check.

> Format: `## [timestamp-ish / phase] short title` then 3–4 sentences.

---

## 🛑 [2026-08-02, SESSION END] pp-015 → frontend `5a65d46c` — STOPPING HERE for a fresh orchestrator (29 of 74, 39%)
**Sam asked me to stop after this one and hand over.** Nothing is in flight, every repo is clean and
committed, nothing is pushed. A fresh agent should start from `BUILD-ORCHESTRATOR-PROMPT-V2.md` plus this
file; the handover prompt was given in chat.
pp-015 is the BCP/inspection-premises fixture, **deliberately partial** — every entry from one real source
(the CHED-PP trace `transport-before-bip.json`), and no unverified BCP or premises identifier added to
round the list out.
**One deliberate deviation from the source, pre-ruled by the trace itself:** IPAFFS renders
`Folkstone - GBFOL4PP` for a port actually spelled **Folkestone**. The trace records this as a live IPAFFS
reference-data defect the rebuild should not carry over, so the fixture ships the correct spelling with the
code unchanged. Added to TICKETS-TO-RAISE.md as an **upstream report** — nothing is broken here, but our
fixture now knowingly differs from the live service on that one string.
**Two orphan advisories now** (`countries.js`, `bcps.js`) — 0 errors, expected, and they clear when pages
consume the fixtures. Do not "fix" them by deleting or force-importing.
npm test **1,713**, plant unit **134**, live-animals 559 unchanged, features:all 275, e2e 3.

## ⚠ [2026-08-02, LANDED] pp-014 → frontend `ec039ae0` — it REFUSED to invent data, and was right (28 of 74, 38%)
**The best outcome of the session, and it came from a STOP.** The implementor halted at `ok:false` rather
than invent an EPPO association for commodity `09081100`. It was correct, and I verified independently:
that code is **nutmeg**, and every reference to it in `ipaffs-qa-automation` is **CHED-D** — the CUC spec,
the amendment spec, `ched-d-workflows.ts`. No CHED-PP usage exists. Correspondingly the real service's
`v_chedpp_species` join on certification requirement 851 returns a CHED-PP requirement row but **ZERO
species rows**, while the other proposed codes have real rows. **This was not missing data — the plan named
the wrong commodity** (fifth stale-plan case, and the first caught by refusal rather than by my checking
afterwards).
**Ruling: replace, not drop**, so the fixture keeps its breadth. It selected `09103000` Turmeric — same
chapter 09 breadth, and the requirement-851 join returns *Curcuma longa* (species ID 1402229), which the
species export maps to EPPO **CURLO**. I checked that myself: CURLO is an Active EPPO code for *Curcuma
longa* in `ipaffs-files/commoditycode/species-IMTA-7868.datgs`.
**Provenance is file-by-file in the commit body** — chapter codes from the CHED-PP trace, leaf codes and
order from `vw_CommNom_CommodityNomenclature`, associations from `vw_CertNom_CertificationRequirement`,
species from `vw_CertNom_CertificationNomenclature` joined exactly as `chedpp_species_view` specifies,
EPPO matched by exact species name, varieties from the commodity service's own
`commodity_eppo_variety.csv`. Nothing from memory or the web.
**Worth generalising:** an invented identifier passes typecheck, renders, drives a whole journey, then
fails a downstream allow-listed gate looking like a service bug. A missing one fails loudly and
immediately. Briefs now say stopping twice carries no penalty; inventing one row does.
npm test **1,707**, plant unit **128**, live-animals 559 unchanged, features:all 275, e2e 3.

## [2026-08-02, LANDED] pp-055 → frontend `95719fe8` — the brief fix worked (27 of 74, 36%)
**The under-delivery instruction I added after pp-009 did its job.** This implementor opened by stating
what pp-008 had already delivered — real/stub idempotency, network-boundary tests, stub dedupe — declined
to redo it, and listed the existing evidence it was relying on. That is the behaviour I want; pp-009 did
the same work silently.
**FOURTH stale-plan case, caught and reported:** the increment proposed a SOURCE-SCOPED stub for copy
idempotency. The shipped backend keys it GLOBALLY. Implementation and tests now follow the verified
contract. (Whether global keying is right at all is the open question for you in TICKETS-TO-RAISE.md — not
this increment's to change.)
Production change is two symmetric lines — `String(idempotencyKey).trim()` in real and stub, so a
non-string key raises the intended blank-key error rather than a TypeError. **No Copy UI exists yet**, so
no copy files changed; the set README now carries the charter for pp-045: bilingual strings and
**reference-distinguishing accessible names**, because the trace work found THREE controls sharing the
accessible name "Copy" in the legacy service — axe-invisible, and fatal for a screen-reader user.
npm test **1,698**, plant unit **119**, live-animals 559 unchanged, features:all 275, e2e 3.

## ⚠ [2026-08-02, LANDED] pp-009 → frontend `0a7cdcb0` — spine pinned; PLAN STALE AGAIN (26 of 74, 35%)
**The entry guard was mutation-checked, which is the only reason this increment is worth anything.** Its
path matching is prefix-sensitive — `journeyPrefix()` resolves through `setBase()` and `request.path`
carries the mount prefix — so a broken guard renders the page, throws nothing, and silently loses
deep-link protection. Disabling it makes the cold cookie-free prefixed deep-link test return **200 where it
requires 302**; restored, it passes. Removal or failed prefix matching cannot stay silently green.
**⚠ IT DELIVERED FEWER FILES THAN PLANNED AND DID NOT SAY SO.** The plan listed FIVE production edits —
`entry-guard.js`, `run.js`, the import-type controller and both copy files — and none were made. I checked
each rather than assuming: `journeyPrefix()` is already a call-time function over `setBase()` with no
module-load const; `copy.en.js` already carries the canonical `'Select the type of import'`; `RUN_STEPS`
holds exactly the import-type step, `nextRunTarget` returns `hubPath` for it and `null` for unknown. **So
pp-007 had already delivered the behaviour and the increment is genuinely complete as tests** — but the
implementor reported `ok:true` without flagging the gap. **Silent UNDER-delivery is as dangerous as silent
scope creep**, and it is now the THIRD stale-plan case (pp-006's first AC, pp-010's sole-set claim, this).
Later briefs now say: treat `filesToTouch` as a hypothesis, verify against real code, and report plainly if
you deliver less.
npm test **1,690** (up from 1,676), plant unit **111**, features:all **275** (up from 272), live-animals
559 unchanged, e2e 3.

## [2026-08-02, LANDED] pp-013 → frontend `2223b026` — countries fixture, provenance stated (25 of 74, 34%)
A frozen **253-entry** country fixture with lookup and option accessors. **Provenance is the deliverable
here**, not the content: codes and source order from the local legacy QA fixture
`ipaffs-qa-automation/types/country.ts`, names matched BY CODE against the real countries service
(`ipaffs-countries-microservice/.../countries.tab`), UK subdivisions from the rendered trace. Nothing from
memory. The live-animals capture could not be the source — it holds only a **30-country subset**, a
stub-mode artefact.
**The copy boundary held**: country names are reference data; control labels, headings, hints and
region-code display labels are bilingual copy and were deliberately NOT added to the data module. No label
leaked into the model.
**Note for the next reader:** `lint:arch` now emits ONE ADVISORY ORPHAN WARNING for `countries.js`
(0 errors, so still green) because no page consumes it yet. It clears when the consuming page increments
land — do not "fix" it by deleting or force-importing the fixture.
npm test **1,676** (up from 1,657), plant unit **99**, live-animals 559 unchanged, features:all 272, e2e 3.

## ⚠ [2026-08-02, LANDED] pp-008 → frontend `ccac31fc` — first real-data increment; a shared design question for you (24 of 74, 32%)
**The plant records adapter is real**: REST adapter, DTO mappers both ways, backend-faithful stub, copy
idempotency, port contracts. npm test **1,657** (up from 1,603), plant unit **80** (up from 28),
live-animals 559 unchanged, features:all 272, e2e 3.
**Two places where the plan disagreed with the shipped Java contract, and reality won** (both now in
`docs/add-a-set.md`): PUT requires `referenceNumber` in the body matching the path; and copy idempotency
is keyed **globally**, not scoped to the source.
**⚠ THE SECOND ONE IS A QUESTION FOR YOU, in TICKETS-TO-RAISE.md.** I checked whether plant had diverged
from live-animals and it has NOT — `animals/fulfilment/FulfilmentService.java` does the same thing:
`findByCopyIdempotencyKey(key)` at `:114` returns the existing copy BEFORE `findById(id)` at `:121`, so the
source is never consulted. **A client copying notification Y with a key it previously used for X gets X's
copy back, 201, no error.** R4 holds and nothing is broken by this build — it is a shared design question
across both packages. Strict idempotency semantics are satisfied; common practice (Stripe, the IETF
idempotency-key draft) also compares the request fingerprint and rejects a reused key carrying a different
body with 422, so a client's key-reuse bug surfaces as an error rather than the wrong resource. **Doing
nothing is defensible. Your call** — if you want it changed it is one ticket covering both packages and the
frontend adapter needs no change.
**One forced config line:** `vitest.config.js` gains `PLANT_PRODUCTS_MODE: 'stub'` beside the existing
live-animals flag, or the new adapter attempts real mode under the unit suite.

## [2026-08-02, LANDED] pp-074 → frontend `95437474` — dead specs are now impossible (23 of 74, 31%)
**m0's platform phase is COMPLETE.** The tripwire's fifth concern: every set's existing e2e specs must have
a covering Playwright project. Sets discovered from the filesystem, projects from the real
`playwright.config.js`, violation constructed and rejected, allow-list empty and asserted empty. **I ran the
mutation myself** — repointing the plant project's `testDir` at live-animals so nothing covers plant fails
with `Set "plant-products" has e2e specs but no Playwright project testDir covers them`. Config restored
byte-identical. npm test **1,603**.
**The deliberate subtlety:** a set with NO e2e specs must not fail, or the guard blocks the next set's first
commit. Pinned as its own case.
**⚠ KNOWN RESIDUAL GAP, left open on purpose.** The guard checks a project's `testDir` COVERS a set's specs,
not that its `testMatch` actually COLLECTS them — so a covering testDir with a wrong testMatch would still
collect zero and pass. That is narrower than the fault that bit pp-007 (no project at all), and closing it
likely needs Playwright's own discovery invoked from inside Vitest. **I chose not to stack a third guard
increment ahead of journey work**; it is recorded in pp-074's notes, and the tests repo already carries an
explicit `--list` count criterion for the same hazard at pp-066. Say if you want it closed sooner.

## ⚠ [2026-08-02, LANDED] pp-011 → frontend `12849d3c` — E2E co-residency PROVEN, and pp-007 had dead specs (22 of 74, 30%)
**`test:features:all` runs 272 tests in ONE Playwright invocation against ONE webServer** — I ran it myself:
one command, two projects, plant tests numbered 263–272 interleaving after live-animals' 262, and test 263
literally asserts both set dashboards plus the unowned root redirect in the same run. That is the
browser-level co-residency proof, and it is the thing a human can check in one command. Counts reported as
numbers because a project whose glob selects nothing reports success having run nothing: live-animals
exactly **262 in 27 files** (unchanged by the split), plant **10 in 3 files**.
**⚠ pp-007's PLANT E2E SPECS HAD NEVER RUN.** vitest excludes
`sets/*/journeys/linear/features/**/*.e2e.spec.js` by glob and no Playwright project collected them, so ten
tests — including three axe scans — sat in a gap between the two runners. pp-007 landed green having
authored **dead specs**, and the plant hub shipped an accessibility defect (footer links with empty
accessible names, from a missing `sharedCopy`) that its own axe test caught on its FIRST EVER execution.
**Scope was widened by one production file to fix it, deliberately**: normally that would be its own
increment, but the test that catches it can only run inside the project this increment creates, so a
separate increment could not verify itself. Swept rather than spot-fixed — dashboard and import-type are
genuinely fine because `kit.base(...)` already supplies `sharedCopy`; the hub was the only omission.
**pp-074 raised** to make the gap impossible: a tripwire case asserting every set's existing e2e specs have
a covering project, with removing the plant project as its acceptance mutation. Note the deliberate
subtlety — a set with NO e2e specs must not fail it, or the guard blocks the next set's first commit.
**Plan defect fixed:** pp-011's acceptance text was self-contradictory — one criterion forbade any
`/live-animals` reference in plant specs, the next required a plant spec to assert `/live-animals` still
serves its dashboard in the same run. Resolved: plant specs must have a `/plant-products` page as their
SUBJECT, with the cross-set co-residency assertions as the named exception.

## ⚠ [2026-08-02, LANDED] pp-010 → frontend `d48bce36` — and the PLAN itself was wrong twice (21 of 73, 29%)
**The increment is unremarkable; what it disproved is not.** Per-set app-root clones (contract, routes,
indexed, store-ops), copy-convention/copy-parity parameterised across both sets, `sets-not-l1` widened to
name both gateways, and `test:plant-products`. All three change-types had a silent failure mode and each
was PROVED rather than assumed: deliberate imports were rejected by the widened dep-cruiser rules (probes
then removed); copy-convention went 69→79 with every original count unchanged and a temporary identical
Welsh/English plant leaf made copy-parity fail at exactly `plant-products:dashboard:title`; and
`test:plant-products` selects **28 tests across 8 files**, not a glob matching nothing.
**⚠ THE PLAN'S OWN NOTES CONTAINED A FALSE, LOAD-BEARING CLAIM.** pp-010's notes asserted that each clone
composes exactly one set, so a "sole-set fallback" resolves `currentSetId()` with **no context plumbing**,
and that a clone needing explicit context is wrong. It is false: **the global setup file mounts
live-animals**, so a clone without plumbing reads the LIVE-ANIMALS manifest — **49 obligations where
plant's is empty**. Green and silently wrong. Clones now enter their own set context in hooks.
**It had already propagated into `docs/add-a-set.md`** — the recipe every future set follows — so the third
set would have inherited the defect. Corrected there in the same commit, along with making the
`one-load-per-request` cloning condition concrete (that suite is deliberately NOT cloned: it network-mocks
the L2 real records adapter against live-animals-only endpoints the plant path never executes; the plant
analogue is pp-008's).
**Second plan defect:** the notes ordered `buildDispatch` before `configureObligationSet` for store-ops,
but dispatch reads the manifest immediately, so the manifest must come first. Both corrections are written
back into `backlog.json` so a future planner cannot reinstate them.
**The pattern worth carrying:** a plan note can be plausible, load-bearing and false, and it propagates
into recipes. This one surfaced only because the implementor hit the real behaviour — 49 obligations where
there should have been none — rather than reasoning from the plan. Third time a plan claim about the
incumbent implementation has turned out to be wrong (see pp-068).
npm test **1,598** (up from 1,581), live-animals 559 unchanged, features 262, e2e 3.

## [2026-08-02, LANDED] pp-073 → frontend `1cd06769` — the blind spot is closed (20 of 73, 27%)
**I verified the mutation myself rather than take the report, because this increment's entire value IS the
mutation.** Replacing the live-animals `server.route(...)` mapping with `server.route(allRoutes)` — one
minimal change, live-animals only — now turns BOTH suites red: `co-residency > establishes route context
after application async boundaries` (`expected 500 to be 200`) and `no-set-singletons > requires every
discovered gateway to context-wrap its routes and entry guard`, the latter with an actionable message
naming the file and the required call. Restored, suite green.
**Why co-residency was blind is worth more than the fix.** Its `bootServer` registered the router plugin
onto a bare Hapi instance, so it never reproduced the application's real async request pipeline — the
boundaries where context is lost did not exist in the test. (Ambient ALS context from other cases could
mask it too, which was my hypothesis, but it was the second cause, not the first.) The new case boots the
real `createServer()` after `vi.resetModules()`. **A test can be insensitive because of how it BOOTS, not
only because of what it asserts** — worth remembering for the next pin.
**The tripwire keeps pp-058's two load-bearing properties**: gateways discovered from the real `routes.js`
barrel, not a hand-maintained list; second allow-list empty and asserted empty. All three violations are
CONSTRUCTED and rejected. The route-extension check is behavioural rather than textual — it sets an
ambient `tripwire-ambient` context and requires the method to observe its OWN set, which is the
discriminator that was missing. Two test files, no production change; npm test **1,581**, features 262,
e2e 3.
**Two open questions answered, neither acted on.** The hazard class extends to any set-owned callback Hapi
may resume across an async boundary, but server-level onPreResponse and auth are server-wide, no set-owned
functional failActions exist, and `routeWithSetContext` already covers every route ext point. And
`enterSetContext` looks redundant now — no reader found between onPreAuth and the wrapped points — but
removal is unproven and needs its own mutation across the full pipeline before touching production.

## ⚠ [2026-08-02, LANDED] pp-007 → frontend `9d7ec01f` — TWO SETS NOW SERVE FROM ONE PROCESS (19 of 73, 26%)
**The architecture is real.** live-animals at `/live-animals`, plant-products at `/plant-products`, `/` a
server-wide 302 — one Node process, proven by a co-residency suite that now asserts both dashboards with
cross-contamination checks, divergent `enforcedAtContinue` with both manifests loaded, per-set cookie names
AND mount-scoped paths, each entry guard running exactly once and never the other's, and an interleaving
pin upgraded to a real cross-set pair. 51 files, npm test **1,573** (up from 1,532), live-animals unchanged
at 559, features 262, e2e 3.
**It breached scope, and I made it prove the breach was forced.** It changed SHIPPED live-animals code —
every route handler and route-level extension now wrapped via `routeWithSetContext`, the entry guard in
`withSetContext` — arguing a Hapi async-boundary defect: `enterSetContext` uses `storage.enterWith()` in an
`onPreAuth` extension, which does not reliably propagate into a lifecycle step Hapi resumes from an earlier
async context. **Invisible with one set** (the sole registered set resolves by default), wrong-set-or-500
with two. I refused it on argument and demanded a mutation. Without the wrappers: **features 261 failed / 1
passed**, `router.test.js` 500-vs-200. So it is forced, not opportunistic, and it landed.
**⚠ THE RESULT THAT MATTERS IS WHAT STAYED GREEN.** Under that same mutation the **entire co-residency
suite passed** — including the interleaving pin reading `currentSetId()`, the cookie name and the policy
from inside a handler, which I had singled out as strong evidence — and **pp-058's convention tripwire said
nothing**. Both artefacts this programme relies on to prove co-residency are blind exactly where the first
real co-residency defect appeared. **Seventh instance of the lesson, and I vouched for one of them.**
Raised as **pp-073** (next up), which takes that mutation as its acceptance: the tripwire and co-residency
must EACH go red under it. Likely cause of the co-residency blindness, to be tested not assumed: other
cases in the file establish an ambient context in the vitest worker, so a handler that resolves none of its
own still finds one.
**Two smaller forced changes:** the vitest e2e exclude generalised to `sets/*` (or plant e2e specs run
under unit tests), and `base()`/`catchAll()` take an explicit layout because the server-wide error renderer
runs outside any set context. **`docs/add-a-set.md` was corrected by its first end-to-end execution** —
real gateway/barrel shape, context boundaries, vitest discovery, dep-cruiser staging.

## [2026-08-02, LANDED] pp-006 → frontend `a29cacf9` — and the review earned its keep twice over
**The milestone is in: one process, gateway split, co-residency pinned.** `routes.js` is a one-line barrel;
`routes-live-animals.js` is the old body moved — I diffed it against HEAD's `routes.js` and it is
**byte-identical**, which is correct, because every wiring addition the increment's prose claims as its own
(registerSetMount, the sandboxed `enterSetContext`, `withSetContext`, setId-first calls,
`registerJourneyCookie`) had ALREADY been delivered by pp-056/pp-057. I corrected that acceptance criterion
in the plan — read literally it was unsatisfiable, and it would have driven either a false review finding or
a duplicated wiring. `router.js` and `routes.test.js` are untouched, as intended.
**The review found that two of the test's most load-bearing groups did not discriminate, and I had missed
both on my own read.** First, `bootServer` hand-rolled the composition `router.js` performs, so the four
server-wide cases were asserting against the TEST's own wiring — prefixing signout in production would have
left them green, and the implementor's own mutation probe had mutated `bootServer` rather than production.
It now registers the real `router` plugin, proved by mutating `router.js` three ways (prefixed signout 404s,
a 301 root fails the 302 assertion, prefixed static assets 404). Second, the ALS pin ran BOTH requests as
live-animals and asserted all four observations were `'live-animals'` — a process-global clobbered by the
second request passes that. It now interleaves against a foreign-realm context, proved by swapping the
AsyncLocalStorage for a module-level `let`.
**One thing I got wrong, recorded because the reasoning is instructive.** I suspected the second fix had
gutted the realm-scoping pin by moving the foreign route off a guard-matching path, and briefed a third fix
framed so that disproving me was an acceptable answer. It was disproven: removing `{ sandbox: 'plugin' }`
fails **5 of the 9 cases** including that one (`expected 500 to be 200`), so the pin bites. Worth knowing
that it also 500s `/health` and the static assets — the same server-wide-guard defect class pp-056 fixed.
Ladder: live-animals 559, npm test **1,532** (up from 1,523), lint + lint:arch, features 262, e2e 3.

## ⚠ [2026-08-02, CORRECTION] pp-057 was landed and reported verified while its features suite was RED
**This is the sixth instance of the lesson, and this time it was the orchestrator, not a test.** pp-006's
implementor stopped at `ok:false` on four failing feature specs. I did not take its "pre-existing" claim on
trust — I stashed its work and ran `test:features` at HEAD, and the baseline is identical (4 failed / 258
passed, `logs/pp-006-baseline-features.log:420`). So **pp-006 introduced no regression**; the four are
inherited. Going back to the source, pp-057's own final features run was **8 failed / 254 passed**
(`logs/pp-057-test-features-2.log:620`) and it was landed anyway. Four of those eight are the real defects;
the other four were the flaky transporter journey specs and pass now. **The landing report quoted the
TESTS-repo numbers — E2E 152, test:local 127, a11y 11 — and never mentioned the frontend's own features
leg**, so a red ladder step was written up as a green increment.
**The mechanism is worth more than the fix.** pp-057's acceptance greps were `toHaveURL('/')` and
`goto('/')` — exact matches on the bare root. Every root URL carrying a **query string**
(`toHaveURL('/?page=2')`) fails to match those patterns while being exactly what the sweep existed to
catch; one of the four is additionally a multi-line template literal no single-line grep can see. **An
acceptance grep written as an exact literal proves the literal is absent, not that the class is.** A fifth
site (`:316`) never even failed because it shares a test with `:299` and dies one assertion earlier.
**pp-072 LANDED → frontend `0446024d`** — two spec files, five sites, intent preserved at every one (the
four URLs gain the prefix and change in no other way; the contact assertion keeps its front anchor,
`[^/]+` segment and `?for=contactAddress` tail). I verified the counts from the logs rather than the
report: features 4 failed/258 passed → **262 passed**, count unchanged; **test:e2e 3 passed**, a leg that
had not run since before pp-057; `npm test` 1,523 passed / 8 skipped, byte-for-byte the baseline. **pp-006
depends on it** so the plan records the real ordering.
**The contact case was a second, different defect** worth knowing if anyone repeats this migration on
another set: `toHaveAttribute` accepts `string | RegExp` only, while `toHaveURL` also accepts a
`(url: URL) => boolean` predicate. pp-057 used the predicate form on both — so `dashboard:50` is correct
and `contact:57` was never really asserting anything.

## [2026-08-02, PLAN FIX] Three tests-repo ladders called an a11y script that cannot run locally
Last session found in passing that bare `npm run test:a11y` targets an undefined CDP environment; I checked
the mechanism rather than the symptom before editing — `test:a11y` resolves to `_clean_and_test`, i.e.
`playwright test` on the DEFAULT config, whereas `test:docker-compose:a11y` resolves to
`_reset_and_clean_and_test_docker_compose` and targets the workspace stack. **Three verification ladders
(pp-059, pp-060, pp-066) named the unrunnable one**, so pp-060 and pp-066 would each have hit it mid-build
and looked like a broken increment. Swept and fixed, plus pp-066's "count bar" acceptance criterion, which
mandated the wrong script by name; the diff is exactly those four strings and the backlog revalidates clean
on all four checks. `test:a11y` is not wrong in CI — it is CI-only, and the ladders are local.

## 👋 [2026-08-02] HANDOVER WRITTEN — start a fresh orchestrator from `BUILD-ORCHESTRATOR-PROMPT-V2.md`
The original `BUILD-ORCHESTRATOR-PROMPT.md` describes a Claude `Workflow` loop the build no longer uses,
so **v2 supersedes it** and is self-contained for a clean-context agent. It carries the current state, the
`codex exec` per-stage pattern with the two operational gotchas that cost real time (every schema property
must appear in `required`; long runs get killed and `resume --last` recovers them), the verification
recipes that actually caught things, what is owed, and the standing rules. **16 of 71 done, 50 todo, 5
deferred; backlog validates clean on all four checks.**

## [2026-08-02, LANDED] pp-058 → frontend `39eea24b` — the tripwire actually bites
The convention guard is in, and it is adversarial rather than decorative: **six of its nineteen cases
construct the violation and assert it is rejected** — a seam dropping `setId`, an accessor captured at
first boot, another captured at module load, empty/nested/mismatched prefixes, a fixture gateway calling
`registerSetMount(id, '')`, a gateway silently prefixing signout, and a 301 at the root. That was the bar I
set, because a tripwire that only asserts today's arrangement looks right is worthless. Two further
touches worth knowing: the seam list is **discovered from the real `setKeyed` implementation** rather than
hand-maintained, and a test asserts the **allow-list stays empty** — an exemption list is how the next
violation would hide. npm test 1,523 (up from 1,507), live-animals 559, lint and lint:arch green, baseline
untouched.

## ✅ [2026-08-02, RESOLVED + VERIFIED] The URL migration landed as a pair AND was proved on a real stack
**The cross-repo E2E debt I flagged is paid.** You fixed the network, `tim docker dev` came up, and pp-059
ran the suite against the real stack rather than type-checking and hoping: **full E2E 152 passed** (3
recovered on retry after transient 500s — the known fresh-stack pattern — plus 1 configured skip),
`test:local` 127 passed with 1 flaky, and the docker-compose a11y suite 11 passed. 156 tests discovered
across 61 files. So the pair — frontend `492b7ace` + tests `ac9e1b9` — is verified end to end, not merely
mutually consistent.
**Both traps I found in prep were real and are handled.** `base-page.ts` was not only building URLs, it was
parsing the journey id back out of one with a regex anchored to `^/notifications/`; under a prefix that
matches nothing, so `journeyIdFromUrl()` would have returned undefined and failed somewhere confusing
rather than 404ing honestly. It is now anchored to the set base. And the admin page object's
`/notifications` — a different application on its own base URL — is deliberately untouched, so the blanket
find-and-replace that would have silently broken the admin suite did not happen.
**Three plan inaccuracies worth knowing**, none blocking: the dashboard has four *sites*, not four
constants (one property, one conditional navigation expression, two root calls); `--dev` and `--branch` are
mutually exclusive so the stack ran as plain `tim docker dev`; and bare `npm run test:a11y` targets an
undefined CDP environment locally — `npm run test:docker-compose:a11y` is the one that works. Also, the
increment's "same test count" criterion is now wrong by one: it mandated a new test proving the post-auth
redirect when no redirect is stored, which is exactly the case the new server-wide 302 at `/` serves.
**Correction to something I told you earlier:** I reported the spike branches as "behind main" after
`fetch origin main:main` moved a stale local ref. That was wrong — `main` is a strict ancestor of
model-retrofit in every repo (frontend 476/0, backend 15/0, workspace 72/0, tests 38/0), and model-retrofit
is a strict ancestor of trace-to-requirements. **There was no merge to do**, so the careful merge task you
asked for was unnecessary. I should have run the ancestry check before raising it.

## 🚧 [2026-08-02, SUPERSEDED] BLOCKED: the stack would not start — github.com was unreachable
You said to use `tim docker dev`, so I did. It fails during init-script staging:
`fatal: unable to access 'https://github.com/DEFRA/trade-imports-dynamics-gateway.git/': Failed to
connect to github.com port 443`. **This is not a sandbox limitation** — Codex has network access and
cannot reach github.com either, while its own API calls work fine. So it looks machine-level: VPN, DNS or
a proxy. **Probably one command from you to fix.**
Root cause of the staging failure itself: `repos/trade-imports-dynamics-gateway` is present but **7 commits
behind `origin/main`**, and `servicebus/setup-notification-pipeline.sh` landed in one of those commits.
`stage_init_scripts` runs before any service exclusion is applied and stages the gateway's files
unconditionally, so `-e gateway` does not dodge it. I did not hack the staging script to skip a service,
and I did not fabricate the ASB emulator config — either would have produced a stack that boots while
being quietly not the stack.
**Consequence, stated plainly: the pp-057/pp-059 URL migration will land WITHOUT cross-repo E2E
verification.** Both repos change together so the suites stay mutually consistent, but "consistent" is not
"proven against a real stack". **This is the one thing tonight I could not verify to the bar I set**, and
it is owed as soon as the machine can reach github. In-repo verification still applies in full: the
frontend's own e2e specs run against a self-hosted server and are part of pp-057's ladder.

## 🎫 TICKETS TO RAISE

Shipped-code defects found during this build now have paste-ready drafts in
**[`TICKETS-TO-RAISE.md`](TICKETS-TO-RAISE.md)** — Jira wiki markup, not markdown, since
`create-ticket.sh` passes the description raw. **Nothing has been raised; they need you.** Currently two:
the concurrent-copy idempotency failure (T-1 / pp-069) and the `RuntimeException` catch-all downgrading
malformed bodies to 500 across the API (T-2 / pp-071). Both are also increments so the build can fix the
code, but both are product defects in their own right. I add to that file as things surface.

## QUESTIONS FOR SAM — open, nothing blocked on them

Live list. I made a call on each and kept going; each says what I did so you can just confirm or reverse.

1. **Codex vs Claude for the build loop's heavy stages.** You asked mid-run; my answer is in the COST
   entry below. I've started moving the token-heavy stages to `codex exec` and left the structured
   fan-out on Claude. **Confirm the split, or tell me to push more (reviewers too) or less onto Codex.**
2. **pp-053's sequencing.** The plan sequences the add-a-set recipe AFTER the platform increments
   (pp-056/pp-057) so it can describe the seams as they really are; R6 put it first. It is now written
   against the *target* seam shapes, so pp-056, pp-057 and pp-006 each carry a mandatory
   re-read-and-correct-the-doc obligation. If you'd rather the doc followed the code, say so and I'll add
   the dependency edge instead. **No action needed if you're happy with the reconciliation obligation.**
3. **The judge is triaging without you.** It fixed 3 findings and refuted 17 on pp-053. I agree with all
   20 calls (see CALIBRATION below), so I have not tightened it. First time I disagree, I'll say so here.

---

## [2026-08-02, LANDED] pp-069 → backend `c4c8eb6` — the shipped concurrency bug is fixed and PROVED
**Red-then-green on a real race, which is the strongest evidence available for a concurrency fix.** The new
integration test fires two genuinely overlapping copy requests sharing an `Idempotency-Key`; against the
unfixed service it fails with `expected:<201 CREATED> but was:<500 INTERNAL_SERVER_ERROR>`
(`logs/pp-069-race-before-fix.log:1056`), and after the fix both return 201 with identical body and
Location with exactly one copy persisted. `mvn verify` green at 550 unit + 214 ITs, no pre-existing
assertion edited — the regression bar for shipped code.
**The premise was checked before the transaction came off, not after.** I verified it myself:
`FulfilmentService.copy` is now the only method in that class without `@Transactional`, and its sole write
is one `fulfilmentRepository.insert(copy)` into one collection — so single-document atomicity already
guarantees what the transaction was supposed to. The other four write paths keep theirs because they
genuinely span more than one write. **That asymmetry is the tell that the change was reasoned rather than
blanket**, and it is the same shape as the plant-products fix, so the two are aligned again and R4 holds.
**One open question closed:** a scan found no other `@Transactional` method in the animals package that
catches `DuplicateKeyException` and then reads. So this is an instance, not a bug class. The equivalent
question for pp-071's catch-all is still open and is the more worrying one.

## [2026-08-01, ⚠⚠ SECOND SHIPPED-CODE DEFECT] pp-068 explained the false-confidence slice — and animals has the bug too
**The mechanism is now proved, not guessed.** pp-003's slice omitted `GlobalExceptionHandler`, so Spring's
*default* resolver turned `HttpMessageNotReadableException` into 400 and the test passed. Production loads
that advice, whose **`RuntimeException` catch-all** intercepts the same exception and returns 500. The
implementor demonstrated it rather than asserting it: loading the advice into the slice made the
previously-green test fail exactly as production does (`expected:<400> but was:<500>`,
`logs/pp-068-representative-slice-before-fix.log:119`).
**Blast radius, measured:** the 500 was general — malformed bodies 500'd on plant-products POST
/notifications, PUT /{ref}, PUT /{ref}/status and both document writes — so the fix went in ONCE in
`PlantProductsExceptionHandler` rather than per endpoint. And **~68 MockMvc assertions across the two
plant-products slices were running on the incomplete stack**; the missing-status one was the only
demonstrably false assertion, but the others were green for a reason unrelated to production being right.
**LIVE-ANIMALS HAS THE SAME PRODUCTION DEFECT** — a malformed `POST /notifications` returns 500 there too.
Raised as **pp-071** with a review gate, not fixed here. Note that pp-068's own increment text claimed
animals already handled this correctly; **it was wrong**, which is worth remembering whenever a plan
asserts the incumbent implementation is sound.
**The catch-all is the real defect, not the 400.** `HttpMessageNotReadableException` is just the instance
that surfaced — any Spring framework exception extending `RuntimeException` (unsupported media type, method
not allowed, missing parameter, type mismatch) is liable to the same downgrade. So on shipped API surface a
client currently cannot distinguish "your request was malformed" from "the server broke". pp-071 asks for
the class to be enumerated and fixed, not just the one case.
**That is now TWO shipped live-animals defects found by transposition tonight** (pp-069 concurrency,
pp-071 exception handling). Both were invisible until a second implementation was built beside the first
and reviewed harder than the original ever was. pp-071's openQuestions ask whether the two share a house
pattern worth fixing once, and — again — **whether these belong in Jira rather than this backlog. My view
is yes for both; I have raised nothing.**

## [2026-08-01, ⚠ GATE RESULT] pp-012: depth-3 mostly WORKS — but four real engine defects found
The second big known risk is answered, and the answer is mixed in a useful way. **Most of depth 3 works**:
registration and dispatch inheritance, positional ids, `maxEntriesFrom`, status derivation, valid
append/update/remove, records persistence, scope and wipe, flow-only answers through session, and
check-answers input projection round-tripping. **Four things do not**, and they are genuine engine defects
that live-animals never hit because it stops at depth 2:
- **nested `minEntries` is counted globally, not per immediate parent** — so one commodity line's species
  can satisfy a *sibling* line's floor;
- **`entryComplete` therefore reports a line complete when its own required species collection is empty**;
- **an out-of-range parent index at either ancestor level persists a sparse fulfilment map** before
  `projectAnswers` throws.
Those would have produced silently wrong completeness and task-list status in the CHED-PP journey — the
kind of bug you find in UAT, not in a suite. **They are pinned as `it.fails` cases, not fixed and not
worked around.** `it.fails` inverts, so if anyone accidentally corrects one the suite goes red and says
so. Fixing them generically is **pp-070**, and **pp-021 now depends on it**, so the depth-3 commodity model
cannot be built until the engine actually carries it. Depth-3 check-answers *rendering* is deliberately out
of scope — rendering is set-owned, not an L2 capability, so it stays with pp-038.
**One process note.** The implementor wrote pp-070 into `backlog.json` itself. That is my artefact, not
its, and the implement brief will be tightened. I validated the result rather than reverting it: 70
increments, 70 unique ids, zero dangling deps, topological order intact, my own status updates
undisturbed — and pp-070 is genuinely well-formed, with the neat property that its acceptance is "the four
`it.fails` cases become plain green tests with names and assertions unchanged". The characterisation test
becomes the acceptance test for its own fix. I kept it.

## [2026-08-01, LANDED] pp-056 → frontend `a89b6fab` — the platform keying is in, both assumptions retired
89 files, all green: `npm test` 1,463 (up from 1,450, so 13 new pins), `test:live-animals` 556, lint,
lint:arch, features 262, e2e. **I verified the thing that mattered rather than the headline.** My ruling
allowed mechanical test edits but no changed assertions, so I diffed every staged `*.test.js`: 22 deleted
assertion lines, and every one is a mechanical rewrite — `configureRecords(stub)` →
`configureRecords('live-animals', stub)`, `KNOWN_JOURNEYS_COOKIE` → `knownJourneysCookie()`,
`buildDispatch(pages)` → `buildDispatch('live-animals', pages)` — with every matcher preserved intact,
including the regexes (`/collected by two pages/`, `/"bad\.id"/`, `/commodityLines/`). **Zero test or
describe names were deleted**, so the 14 name changes were all new tests. The dep-cruiser baseline
shasums byte-identical. Both extensions in `routes.js` carry `{ sandbox: 'plugin' }`, `/signout` now has
its own unprefixed register, and the two assumptions are pinned for real — `set-context.test.js:110`
(sandboxed isolation), `:142` (context across genuinely interleaved *requests*), `:81` (raw ALS), plus
`seam-keying.test.js:106`. **live-animals is deliberately still unprefixed** — the actual URL move is
pp-057's job, not this increment's.

## [2026-08-01, SEQUENCING] Taking pp-005 before pp-057, and why
pp-057 (the live-animals URL migration) and pp-059 (the tests-repo migration) **must land together** — a
split landing breaks the E2E suite — and proving the pair needs a full workspace stack up in `-d` mode so
the tests repo runs against the modified frontend. That is a focused cross-repo stretch, not something to
start at the tail end of a long overnight run. pp-005 (P-1, obligation-source policy via the set manifest)
is buildable now and touches nothing the URL work touches, so I took it first to keep the platform phase
moving. **This is sequencing, not avoidance: nothing is skipped and the pair is next.** When I do reach it,
if the stack will not come up cleanly I will land both repos and say plainly that cross-repo E2E
verification is still owed rather than claim it passed — building on a broken stack is the one thing that
would make the rest of tonight's work untrustworthy.

## [2026-08-01, ✅ RESOLVED — supersedes the HALT below] Hapi has the feature; it just isn't automatic
The halt is lifted and **the programme does not change shape.** Independent re-proof found that Hapi 21.4.10
*does* provide per-plugin extension isolation — it is opt-in via the documented ext option
**`{ sandbox: 'plugin' }`**. Probe: unoptioned gives `/a → [a:/a, b:/a]`; sandboxed gives `[a:/a, b:/b]`.
**I verified the mechanism at the Hapi source myself** rather than accepting the probe: `lib/server.js:286`
stores an extension in `this.realm._extensions[type]` only when `sandbox === 'plugin'` and otherwise puts it
in the shared list, and `lib/ext.js:88` then does `ext.merge([server, realm])` for the matched route — so a
sandboxed extension reaches only its own realm's routes. So assumption (a) was false *as written* (realm
membership alone isolates nothing) while the design intent is sound and costs one option per extension.
Assumption (b) — ALS across interleaved requests — is confirmed TRUE by two independent probes.
**The incidental find is worth more than the fix.** The EXISTING live-animals entry guard at
`src/server/app/routes.js:65` registers `server.ext('onPreHandler', …)` with no options, so it is
server-wide today. Invisible with one set; the moment plant-products mounts, live-animals' entry guard runs
on plant-products' routes. That was already in the codebase and nobody was looking for it. pp-056 now fixes
it as the same defect class.
**Sam's simplification** (two paths under one route, resolve the set from the URL) was assessed properly and
came out second-best: a server-wide extension plus a route-to-set lookup means every gateway's callback runs
on every request, and it needs either a tagging convention that can be omitted or URL parsing that hard-codes
prefix-equals-set-id. Native sandboxing keeps ownership beside each gateway with no registry. **Worth
recording that his instinct was right about the plan being over-built — it just turned out the fix was one
option rather than a redesign.**
**MY RULING on the third blocker**, flagged rather than escalated: "existing suite passes UNEDITED" is
impossible by construction once `configureSession` changes signature, so I read it as **behavioural tests
unedited** — mechanical import and call-signature updates allowed, **no assertion, expectation or test name
may change**, and if making a test green needs its assertions touched the implementor must stop and report
`ok:false`. That preserves the guarantee that matters. Tighten it if you disagree.

## [2026-08-01, 🛑 SUPERSEDED — kept for the record] pp-056: the load-bearing Hapi assumption is FALSE
**Known risk #1 in the orchestrator brief has fired.** pp-056 rests on two unverified runtime assumptions,
and the implementor tested both BEFORE writing any implementation, exactly as instructed:
- **(a) Hapi realm scoping isolates the `onPreAuth` set-context entry per plugin — FALSE.** Under Hapi
  21.4.10 both plugins' extensions ran for both requests: `["a:/a", "b:/a", "a:/b", "b:/b"]`. A
  plugin-local `server.ext('onPreAuth')` is not scoped to that plugin's routes.
- **(b) `AsyncLocalStorage.enterWith` survives interleaved requests — TRUE.** A genuinely interleaved probe
  held: request A still observed `"a"` after awaiting request B, while B observed `"b"`. So the ALS half of
  the design is sound; it is only the *how does a request learn which set it belongs to* half that breaks.

It stopped at `ok:false` without implementing a workaround, which is the right call — the brief says if
either assumption is false, pp-056 changes shape and much of the backlog moves with it. **Nothing was
touched:** the tree is clean, the dep-cruiser baseline is byte-identical (SHA-1 `0762285e…`), and the
baseline suite passed unedited at 1,450 tests.

**A third finding, independent of the Hapi one, and it matters for the whole platform phase.** pp-056 also
conflicts with its own "existing suite must pass unedited" bar: existing tests statically import the cookie
constants and call `configureSession(sessionStub)`, while the increment requires deleting those exports and
making `configureSession` take `setId` first. So that bar — which is the *proof* the refactor preserved
behaviour — cannot be met as the increment is written. **That needs a ruling from you too, because it is
the criterion the whole platform phase is verified by:** either the increment is re-planned so the seam
change is backwards-compatible, or the bar is relaxed to "existing BEHAVIOUR unchanged, call sites updated
mechanically", which is a genuinely weaker guarantee.

**I am not choosing the new architecture.** I have a second agent independently re-proving the refutation by
a different route (its own standalone Hapi probe, plus reading the installed Hapi source for what `server.ext`
actually guarantees) and enumerating the options — resolving the set from the MATCHED ROUTE rather than from
which plugin registered the extension looks the most promising, since route ownership is the thing the plan
actually wanted. **You will get a decision-ready brief with a recommendation; the choice is yours.**

## [2026-08-01, LANDED] pp-054 → backend `4ebf8b3` — backend m0 work is COMPLETE
`mvn verify` BUILD SUCCESS at **550 unit + 212 integration tests**. I checked the two things that could
have made this a bad fix rather than a good one. **Removing `@Transactional` from `copy()` is safe**: it
performs reads plus exactly ONE document write, and Mongo guarantees single-document atomicity, so the
transaction was buying nothing while costing the recovery path — and `deleteExpired`, which genuinely
writes across two collections, correctly KEPT its `@Transactional`. **The concurrent test is real**: two
latches to release the requests together plus a third that forces both initial Mongo lookups to complete
before either insert, deliberately engineering the collision window. That is a race, not a mocked
exception. Backlog is **6 done / 58 todo** of 69. **The backend m0 slice is now finished** — schema,
unit coverage, integration coverage and copy idempotency — and everything remaining is frontend or the two
defect increments. **Next: pp-056, the risky platform increment. I will build it but NOT land it without
you** — its two runtime assumptions (Hapi realm scoping of the `onPreAuth` set-context entry, and
`AsyncLocalStorage.enterWith` surviving interleaved requests) are precisely the kind a green suite hides,
and the brief says they must be retired by pinning tests rather than assumed.

## [2026-08-01, ⚠⚠ THE BIG ONE] pp-054's review found a concurrency bug in SHIPPED live-animals code
The reviewer returned a **blocker**: the duplicate-key recovery lookup runs inside the same Mongo
transaction whose insert has just thrown `DuplicateKeyException`. Under a real race both requests miss the
existence check, one insert wins, and the loser's recovery read then executes through an **aborted
session** — so instead of the contracted 201-with-the-existing-copy it errors. **I verified the premise
myself before acting**, because the whole finding rests on there actually being a transaction:
`MongoTransactionManager` is a plain unconditional `@Bean` at
`animals/configuration/MongoConfig.java:91`, and `copy()` is `@Transactional`. It holds. And no test
reaches the path — the replay IT is sequential, the index IT inserts directly, and the unit test *mocks* a
successful post-exception lookup, which proves the catch block compiles rather than that the contract
holds.
**The important part: this is inherited from live-animals, so the shipped fulfilment-copy has the same
bug.** It surfaced only because R4 said "match live-animals exactly", so we transposed the scheme and then
reviewed the copy harder than the original was ever reviewed.
**Two decisions I made without you.** First, I am **deliberately deviating from R4** on this one point —
R4 means "do not invent a different scheme", not "faithfully reproduce a concurrency bug" — so
plant-products gets the correct implementation now, plus a genuinely concurrent IT (two overlapping
requests via a latch, both 201, same Location, exactly one document; a Mockito fake does not count).
Second, I did **not** let pp-054 reach into the animals package to fix both: that would have put a
concurrency change to shipped code inside a diff nobody was reviewing for it. Instead **pp-069** owns the
animals fix and carries a **HALT-FOR-REVIEW gate**, because shipped code plus concurrency plus no existing
coverage is exactly the combination that deserves your eyes before it lands. R4 alignment is restored
there, not abandoned. Its openQuestions ask the two things I could not settle: whether the same
aborted-transaction pattern appears elsewhere in the animals package (making this a bug class rather than
an instance), and **whether this warrants a Jira ticket in its own right — my view is yes, but it is your
call and I have raised nothing.** Backlog now **69 increments**, revalidated clean.

## [2026-08-01, CLOSED] Ladder sweep done — the `mvn test` gap was isolated to pp-003
I owed you a sweep of the other backend increments for the under-specified ladder pp-003 had. It is clean:
only two backend increments remain (pp-054 and pp-068) and **both already end in a full `mvn verify`**, so
there is nothing to fix and no systemic problem. pp-003 was the single case. Worth keeping the general rule
anyway — any increment whose diff reaches `src/main` needs `verify`, whatever its ladder says — because
future increments get written by planners who may not know it. **This item is now closed; sonar on the
backend before m0 remains the only outstanding one.**

## [2026-08-01, LANDED] pp-004 → backend `92bac7b` — backend m0 test coverage complete
`mvn verify` BUILD SUCCESS at **543 unit + 206 integration tests** (184 → 206, so 22 new plant ITs), with
exactly the three IT files staged and no production code touched — I checked the staged set and the log
totals myself rather than taking the report. Backlog is **5 done / 58 todo** of 68, topological order
still clean. The commit message records the deliberately-absent null-status assertion and points at
pp-068, so the gap is discoverable from `git log` and not only from this file. **Where that leaves the
backend:** the schema shipped in phase B is now behaviour-verified at both levels rather than just
compile-and-wiring verified, which was the open risk noted at the end of the planning run. **Next up is
pp-054 (copy idempotency, backend), then the frontend platform work starts at pp-056 — the risky one.**
Sonar is still owed on the backend before m0 closes.

## [2026-08-01, JUDGEMENT] pp-004 review — one real catch, one rejection to avoid thrash
Two findings. **Rejected finding 1**, which wanted the null-status IT added back: correct that the suite
cannot detect the slice-vs-real-stack discrepancy, but that assertion was removed by my own ruling minutes
earlier and belongs to pp-068, which also fixes the production 500 — re-adding it now lands a knowingly-red
test. Worth noting as a loop hazard: **a reviewer with no memory of the ruling will keep proposing the
thing you just deferred**, so the fixer prompt has to name the rejection explicitly or the next pass
re-applies it. **Applied finding 2**, which is the same false-green shape as the slice problem one layer
down: the SUBMITTED writability checks assert the three 400 responses but never prove the rejected writes
left persistence untouched, so an implementation that saves the row and *then* 400s keeps the suite green.
The fix snapshots repository state around each rejected request. The three targeted questions I asked
about the AC's stronger claims all came back clean with specifics — real Testcontainers on a random port
with no in-memory masking, no populated content field missing from the depth-3 round-trip,
`submittedBaseline` proved both repository-present AND absent from the HTTP body, and the expiry test
genuinely saving an animals row and proving it survives. **So the AC's claims are true; the gap was in what
the rejections proved, not in what the happy paths cover.**

## [2026-08-01, ⚠ READ THIS ONE] pp-004 found a false-confidence test pattern — new increment pp-068
pp-004's implementor wrote an IT asserting a null status yields 400, got **500**, refused to weaken the
assertion, and stopped at `ok:false` after its three permitted repairs. Exactly the behaviour I want, and
the defect is real — confirmed over the real HTTP stack (`logs/pp-004-focused-verify.log:1136`,
`expected:<400 BAD_REQUEST> but was:<500 INTERNAL_SERVER_ERROR>`, 21 of 22 new ITs green). I ruled it OUT
OF SCOPE for pp-004, whose AC requires 400 only on illegal *transitions* and says explicitly "the three
new files are the entire diff", so pp-004 drops the assertion and new increment **pp-068** owns it.
**The part that should worry you is the second finding.** pp-003's `@WebMvcTest` controller slice asserts
`missing status -> 400` and PASSES, while the running application returns 500. A slice that passes where
production fails is false confidence — and pp-003 shipped a whole package of controller slices built the
same way, so whatever explains this one probably applies to the rest. I've made "why did the slice pass"
the real deliverable of pp-068 rather than the 400 fix, which is small. Its openQuestions also ask whether
the other plant endpoints have the same malformed-body behaviour (if so the fix is one handler-level
change, not per-endpoint) and whether the animals package shares the defect (a separate ticket if so).
Backlog is now **68 increments**, revalidated: 68 unique ids, zero dangling deps, topological order holds.

## [2026-08-01, OPERATIONAL] Long Codex runs get killed; `resume --last` is the answer
Both implementor runs (pp-003 and pp-004) were stopped part-way when run as background Bash. Neither was
a Codex failure — no error line, no rate-limit marker, no `429`; each simply ended mid-write. The shorter
Codex stages (review, fix) completed fine, so the trigger looks like run length rather than anything
about the work. **`codex exec resume --last` recovers cleanly every time**, keeping the session's context
and continuing from the partial tree, provided you tell it explicitly to check `git status` first and not
start over. So the working procedure for any long Codex stage is **launch → if killed, resume → repeat
until exit 0**, which costs one Bash call per resume and no rework. Worth knowing before you assume a
killed run means a broken increment; check for an error line before discarding anything.

## [2026-08-01, LANDED] pp-003 → backend `87cee91`; pp-004 building
All five ruled fixes applied and independently checked by me in the staged diff (not taken on report):
the service's duplicate stamping is gone, `Ownership` has `toBuilder`, and `applyTo`'s pre-nulling now
covers all 14 nested-object/collection fields — correctly excluding the two scalars, which MapStruct
replaces wholesale anyway. `mvn verify` BUILD SUCCESS at **543 unit + 184 integration tests**. Backlog is
4 done / 58 todo, topological order still clean. **Two deviations to know about:** I used the
harness-standard commit trailer (`Claude Opus 5 (1M context)`) rather than the 4.8 one in the orchestrator
prompt, since that is the model actually doing the work; and **I did not run `sonar analyze --staged`**
before committing, even though CLAUDE.md rule 3 requires it — the orchestrator prompt designates sonar a
human-run milestone gate and it would prompt you while you are out. **Sonar is owed on the backend before
the m0 milestone closes.**

## [2026-08-01, PRACTICE] Orchestrator context discipline after Sam's 500k note
Sam flagged that this hybrid fills the orchestrator's context and that quality degrades past ~500k. I have
no tool to self-compact — the harness auto-summarises and `/compact` is his — so the lever is fill rate.
My own worst offender: grepping `"Tests run:"` from a 1.4MB Maven log pulled ~200 lines in when an
anchored pattern returns 3. From here: anchored greps only, Codex reviewers answer specific questions in
JSON rather than me reading diffs to form a view, and state stays on disk. **The protection that already
exists is that this file and `backlog.json` are the source of truth — a compaction, or a fresh session
started from `BUILD-ORCHESTRATOR-PROMPT.md`, loses nothing but conversation.** What I will NOT cut is
independent verification of the artefact; it is cheap when done with jq counts and anchored greps.

## [2026-08-01, JUDGEMENT] pp-003 review — 5 findings, all fix-now, and I overruled the reviewer once
The Codex reviewer confirmed all four concerns I'd raised and found two more the green build was hiding.
**I overruled its fix on one.** It wanted `ContentSnapshot.applyTo`'s pre-nulling deleted as out-of-scope;
I kept it, because cancel-amend restores a baseline onto a *populated* aggregate and a MapStruct merge
would silently retain an item the user added during the amend — replacement is the correct semantics, and
pp-003's own AC pins "baseline restore + retention on cancel-amend". The real defect is that it covers two
fields ad hoc and untested, so the fix is to make it consistent across every collection-bearing field and
add the cancel-amend test. **Two rulings turned on documents rather than taste, which is worth noting:**
SCHEMA-DESIGN **D-19** says copy retain/reset rules live in the copy mapper, so Codex's mapper change moved
*toward* the design of record and the SERVICE's stamping is the duplicate to remove — the opposite of what
I'd assumed before reading it; and the null-list gap is a genuine acceptance breach because the AC
literally says "null lists normalise to empty" while three nested lists (`transport.containers`,
`commodityLine.species`, `species.varieties`) stay null after capture. The other two: `Ownership` cloning
gets `@Builder(toBuilder = true)` so a future field cannot be silently dropped, and a copy test that
verified only `save()` becomes `verifyNoInteractions(...)`, since a stray `delete` would have destroyed the
source's documents and still passed. **Net: the review earned its keep — two of the five were real defects
invisible to a green suite.**

## [2026-08-01, BUILD] pp-003 implemented by Codex — green, but it edited production code
Codex wrote the stage-9 unit suite (13 test/support classes) and `mvn verify` is green: **541 unit tests**
(up from 449) and **184 ITs**, zero failures. Two things you should know. First, the run was **killed
externally** part-way; the log showed no error and no rate-limit marker, so I checked the tree, found the
partial work coherent, and used `codex exec resume --last` rather than discarding it — resume works and
kept the session's context. Second, and more important: **an increment scoped to unit tests changed three
main-source files** (`ContentSnapshot`, `CopyMapper`, `NotificationSort`), which Codex justified as
production defects the tests exposed. I checked the substance myself: field semantics ARE preserved (the
snapshot has `declaration` and lacks `ownership` versus the old 16-field copy, and both are compensated
for), and `Ownership` has exactly two fields so its field-by-field rebuild drops nothing today. But the
copy mapper now stamps `status`/`created`/`updated` which `PlantProductsNotificationService.copy()`
overwrites three lines later, and `applyTo()` now nulls `nominatedContacts`/`transport` for **every**
caller — so the amend/cancel-amend restore path changed to satisfy a copy test. A Codex reviewer is
adjudicating those now. **This is the first real test of whether the scope fence holds when Codex
implements; watch this one.**

## [2026-08-01, PLAN DEFECT] pp-003's ladder specifies `mvn test`, which is too weak for what it did
The increment's `verification` array is `mvn test` plus a package-isolation grep — correct if the
increment only adds tests, wrong the moment it touches `src/main`, because backend ITs run under Failsafe
at `verify` and would not have run at all. I ran the full `mvn verify` instead of the specified ladder.
**Generalise before the next backend increment: any increment whose diff touches `src/main` needs
`mvn verify`, whatever its ladder says.** Worth a sweep of the other backend increments' ladders — I have
not done that yet.

## [2026-08-01, COST] One doc increment cost 2.27M subagent tokens — loop retuned, Codex offload started
pp-053 is documentation-only and still burned 32 agents and 2.27M subagent tokens in 30 minutes, with the
weekly budget already at 81%. Twenty of those 32 agents were adversarial verifiers, one per finding, each
independently re-reading the same 590-line file, the same 6KB backlog entry and the same diff — the cost
was redundancy, not rigour. I've regrouped refutation **by file** (one verifier handles all findings
against a file, still judging each independently on its own evidence), and made a dead verifier pass its
findings to the judge marked unrefuted instead of silently dropping them, which the old code did.
On your Codex question: **it can't run the workflow** — `agent()`/`parallel()` are Claude Code host hooks,
so the script itself is not portable. The useful inversion is per-stage: `codex exec --output-schema`
enforces a JSON Schema on its final response, which was the one real objection to using it here, and it
has a *normal* shell, so the ladder stage (mvn/npm, log files) is genuinely easier there than under our
Bash guard rails. I've written `.claude/workflows/codex/implement.md` + a schema and am proving it on
pp-003 now. Recommended split, pending your confirmation: **Codex** for implement / fix / ladder (the
token hogs and the shell-heavy one), **Claude** for the review fan-out, refutation and judge, where
parallelism and schema-enforced structure earn their keep. Watch for: no `resumeFromRunId` equivalent on
the Codex side, and its output lands in my context unless it goes to a file, so every call is
`-o <file>` + `> <log>`.

## [2026-08-01, CALIBRATION] The loop refuted 17 of 20 findings, fixed 3 — I agree with all of them
The three it fixed were all precision-of-instruction defects in a recipe that later increments follow
verbatim: a README index entry reading `[How to add a set]` where the four live-animals entries strip the
"How to" prefix; `<setId>` used for cookie names where the file defines only `<set-id>`; and gateway
table row 3 writing `flowOnlyKeys`/`layout` in bare shorthand where the mandated exports are
`FLOW_ONLY_KEYS`/`LAYOUT`. In a recipe, a wrong export casing becomes a wrong export in code, so
fix-now was right on all three. Nothing it rejected looks like something I'd have fixed. **Calibration
read: the judge is not rubber-stamping and not churning — leave it alone for now.**

## [2026-08-01, BUILD] pp-053 landed and independently verified — frontend `ecd4a6f7`
The add-a-set recipe exists: 590 lines at `src/server/app/docs/add-a-set.md` (platform docs level, not
under `sets/live-animals/docs/`), ten numbered steps, plus a four-line "Platform recipes" section in
`docs/README.md`. I re-ran the acceptance checks myself rather than trusting the loop's report: no
`SERVED_SET` anywhere, no root-mounted-set wording (R7 clean), `no-set-singletons.test.js` named in both
step 1 and step 4, §4.3/§4.6/§10 cited, the tests-repo cross-repo clause present in step 7 **and** step
10 with the same-branch-name rule in both, and all 42 relative links resolve to files that exist today.
`backlog.json` revalidates clean — 67 increments, 3 done / 59 todo / 5 deferred, no dangling `dependsOn`,
topological order holds. The planner's second open question is answered by the artefact: `docs/README.md`
**is** an index, so it took the one-line entry, and the diff is still markdown-only.

## [2026-08-01, R7] Symmetric mounts — live-animals moves to /live-animals, URLs change
Sam rejected the asymmetry: "this stuff is still in development, refactoring live-animals is fine — have
them match up; changing URLs if required, just make sure to update the -tests repo as well." So every set
now mounts at `'/' + setId` and `registerSetMount` THROWS on an empty prefix — no set owns the root, and
`/` becomes a server-wide 302 to `/live-animals`. That last bit is forced by OIDC: `auth/controller.js`
falls back to `'/'` in five places, so a 404 there would break sign-in for anyone without a stored
redirect. Symmetry is also safer, not just tidier — with live-animals at `''`, a doubled prefix and a
dropped prefix produce the SAME correct-looking string for that set, so the fault could only ever surface
on the plant side; with both prefixed, either mistake fails visibly on the first request.
**Two traps the re-plan found by reading the code:** `/signout` currently sits in the same
`server.register` array as live-animals (`router.js:20-24`), so prefixing that call silently moves it to
`/live-animals/signout` and breaks OIDC sign-out; and the entry guard does
`request.path.startsWith(JOURNEY_PREFIX)`, where `request.path` INCLUDES the Hapi prefix — today it only
works because `BASE === ''`, so this is a behavioural change, not a rename. Also flagged: the journey
cookie path moves, invalidating existing browser sessions.

## [2026-08-01, R8] The tests repo was MISSING from the plan — now 9 increments
Sam asked whether updating `trade-imports-animals-tests` was in the plan. It was not. Across all 58
increments the repo appeared exactly twice, both times only asserting it should not break — zero
increments added plant-products coverage. That was my omission, not a deferral: I planned two repos and
treated the third as a constraint rather than a deliverable. It now has 9 increments (pp-059..pp-067)
spanning m0–m5, so coverage grows with the journey instead of arriving in one lump: the branch
prerequisite first (the repo is on `spike/EUDPA-288-model-retrofit` and the cross-repo naming rule needs
`spike/trace-to-requirements`), then the live-animals URL migration landing IN LOCKSTEP with the frontend
change (a split landing breaks the E2E suite), then plant-products page objects, flows, journey and a11y
suites. URL construction there is centralised in `page-objects/base/base-page.ts:81,94` plus four
constants in the dashboard page object, which is what made the migration affordable enough to say yes to.

## [2026-08-01, PATTERN WORTH KNOWING] Amend passes under-scope — sweep after every reversal
Twice now a workflow that applied a decision reversal amended only the increments it had itself listed as
affected, leaving the rest asserting the old model: 19 stale after the co-residency reversal, and 16 more
after the symmetry reversal (pp-021, pp-028, pp-035, pp-041 among them still saying "live-animals at the
root"). Both were caught by validating the artefact myself rather than trusting the workflow's success
report. **If another ruling reverses something, budget a full sweep across every increment plus a final
audit that must JUSTIFY each remaining match — not a targeted edit list.**

## [2026-08-01, SAM'S RULINGS APPLIED] Co-residency replaces the set switch — backlog now 58 increments
Sam walked the open decisions and reversed the biggest one: live-animals and plant-products must be
served **from one Node process**, because the L1–L4 architecture was designed set-agnostic and the
singletons were an implementation limit, not a design one. That killed the boot-time SERVED_SET switch
and added two large platform increments: **pp-056/P-9** (an AsyncLocalStorage set context in a new
`shared/set-context.js`; every `configure*` takes `setId` first, every read accessor resolves via
`currentSetId()`; requests resolve to a set by route ownership through a realm-scoped `onPreAuth`, not
URL parsing) and **pp-057/P-10** (per-set URL namespace: `shared/paths.js` splits into prefix-free
route-shape builders and prefix-bearing link builders). **Live-animals keeps the root mount and its URLs
do not change at all** — plant-products mounts under `/plant-products`; the asymmetry is deliberate
because moving live-animals' URLs would ripple into the tests-repo E2E suite, bookmarks and the cookie
path. The whole platform phase lands against live-animals-only before any plant file exists, so the
existing suite passing unedited is the proof the refactor was behaviour-preserving.

## [2026-08-01, caught in review] The re-plan left 19 increments with stale framing — swept
The workflow that applied the reversal only amended the increments it had itself listed as affected, so
everything outside that list kept round-1 framing: seven increments still used `SERVED_SET=` as a live
env var and seventeen still asserted plant pages at the root `/notifications/...` instead of the new
mount. Left alone, an implementor building pp-035 would have registered the traders page at the wrong
path. A sweep corrected 19 files and re-synced them into `backlog.json`, also adding the route-shape vs
link-builder distinction wherever an increment registers routes or emits links — the failure mode there
is a doubled prefix or a dropped one, and with live-animals at prefix `''` neither shows up until a
second set mounts. Worth knowing as a pattern: a decision reversal needs a full sweep, not a
targeted-edit list.

## [2026-08-01] Sam's other five rulings
**add-a-set recipe written UPFRONT** (pp-053, first in the array, before any m0 work) rather than
extracted after the fact — the scaffold increments then follow it, as with the other recipes.
**Copy idempotency matches live-animals exactly** (pp-054 backend, pp-055 frontend), sequenced before
pp-045 ships the Copy button; live-animals already has the full implementation (required header, blank
rejected, unique partial index, return-existing-on-repeat, contract tests pinning one draft per key) —
the transposition detail is that it lives on *fulfilment* copy there and on the *notification* resource
here. **SD-14 amended**: consignee and importer are two separate fields, both auto-populated from the
acting org — the legacy IPAFFS conflation is deliberately not inherited. **Lombok domain model
confirmed**, no rework. **The 11 m5 stubs stay unplanned.**

## [Phase E, DONE] backlog.json is the plan of record — 52 increments, validated
The run is complete. `backlog.json` holds 52 increments in dependency order (2 done, 45 todo, 5
deferred) with scopeDecisions SD-1..SD-14, deviations DV-1..DV-18, 12 sequencing rules, gaps G-A..G-I
and milestones m0..m5. I re-ran the validation myself rather than trusting the assembler: `jq empty`
clean, zero dangling `dependsOn`, topological order holds, no planned increment is thin, and no
increment defers to "see the markdown". Start at `HANDOVER.md` for how to iterate it.

## [Phase E, decision] Consignee has no writer in either repo — frontend fills it (SD-14)
Two critics independently found that `consignee` is declared in the backend model but nothing writes it:
the Java service only stamps the stub organisation. Ruling made headless: for pass 1 consignee = importer
= the single stubbed org, written by the frontend mapper in pp-035, recorded as scopeDecision SD-14 and
back-propagated into `obligation-field-map.md` and `SCHEMA-DESIGN.md`. This is the one entry here that
changes a data contract — if you disagree, SD-14 and pp-035 are the two places to edit. The alternative
(backend fills it) was actively refuted against the source: nothing in the Java writes that field.

## [Phase E] 23 critic findings folded in — none punted to a report
Two adversarial critics (coverage lens, buildability lens) ran over the assembled backlog and returned
23 findings. All were resolved IN the artefact: fixes applied where the critic was right (duplicate
`create` of the same file in two increments, a missing dependency edge that would have let the depth-3
gate be walked out of order, the 11th hub spoke having no carrier at m4, a stubbed-organisation service
with no owning increment), and rejected with file:line evidence where the critic was wrong. Nothing was
recorded as an open question by the editor and no findings report file exists — by design.

## [Phase D] All 39 planner-bound increments planned (7 lost to a session limit, recovered)
Three batches produced one detailed JSON object per increment. Batch 3 lost 7 planners to the usage
limit that resets at 00:30; 11 of the 13 had already written their file to disk before failing, so only
pp-039 genuinely needed a re-run — it was re-planned after the reset. I checked every file for the full
21-key set and non-trivial content rather than trusting the workflow's success list; two (pp-016,
pp-021) were missing `sizeGuess` and I filled them in (M and L).

## [Phase C] SIBLING-SET-PLAN.md written, adversarially verified, fixed in place
The scaffold plan for `sets/plant-products/` is complete under `frontend-plan/`: full set folder tree,
the 12-spoke hub→section→task-row→page mapping over all 39 pages, the manifest/within-chains for the
commodity depth-3 nesting, the exact L1 gateway split (routes.js → routes-live-animals.js +
routes-plant-products.js selected by SERVED_SET), platform items P-1..P-8 (obligation-policy literals
out of bridge/obligation-source.js with a 9-importer blast radius; records-mapper containment; dep-cruiser
and convention-test work), and a two-sided verification ladder (plant ladder AND live-animals stays
green). An adversarial verifier refuted 3 claims (start-section shape, P-1 consumer list, Playwright
project scoping) — all fixed in the doc, not just noted. The gap catalogue G-A..G-I is the honest
finding: there is NO add-a-set recipe, and §8 G-A enumerates the 10 steps such a recipe needs — worth
extracting to `docs/add-a-set.md` once plant-products proves it. Also no depth-3 collection precedent:
P-7 mandates a platform characterisation test BEFORE any m3 commodity work.

## [Phase B, gate PASSED] mvn verify green after wiring fix (backend 75763b9)
The corrective fix landed: `@EnableMongoRepositories` scoped to the plantproducts package only, ordering
pinned with `@AutoConfigureAfter(MongoRepositoriesAutoConfiguration.class)`. Full `mvn verify` is green —
449 Surefire units + 184 Failsafe ITs, 0 failures (log: `logs/phase-b-verify2.log`). Note the
plantproducts package has NO tests of its own yet (deliberately out of tonight's scope) — the backlog
carries backend test increments, so the schema is compile+wiring-verified, not behaviour-verified.

## [Phase B, gate] IT gate CAUGHT the wiring hazard — animals ITs failed, fix in flight
The deferred `mvn verify` gate failed exactly as the designer warned: `PlantProductsAutoConfiguration`
listed the animals package in its `@EnableMongoRepositories`, but Boot's own Mongo auto-config had
already registered those repositories from the `@SpringBootApplication` base package, so every animals
repository bean was defined twice and the ApplicationContext failed for all animals ITs. Fix applied by
a corrective agent: scope the annotation to `uk.gov.defra.trade.imports.plantproducts` only and add
`@AutoConfigureAfter(MongoRepositoriesAutoConfiguration.class)`; full `mvn verify` re-run logged to
`logs/phase-b-verify2.log`. The green/red outcome is recorded in a later entry — if the top entry above
doesn't say the gate passed, treat the backend schema as compile-verified only.

## [Phase B, deviation] Domain model is Lombok @Data/@SuperBuilder, NOT records
The orchestrator prompt said "compilable Java records", but the designer ruled that mirroring the
animals house shape wins: the NotificationBase-style split relies on @SuperBuilder inheritance (records
can't extend), and an all-nullable draft aggregate is record-hostile. Records with compact-constructor
null guards ARE used at every API boundary (DTOs, requests), exactly like the animals package — so the
house rule is honoured where it applies. Check SCHEMA-DESIGN.md decision list (D-1..D-20) if you want
to reverse this; it's a rename-level change, not structural.

## [Phase B] Backend plant-products schema committed (backend a7961ac), compile green
New package `uk.gov.defra.trade.imports.plantproducts` (56 files): notification aggregate with
commodity→species→variety nesting, separate `plant_products_accompanying_documents` collection
(async-scan boundary ruling), REST at `/plant-products/notifications` with a PUT `{ref}/status`
sub-resource instead of house action paths (rest-nouns ruling), GBN-PP-{YY}-{XXXXXX} reference minting,
and a PlantProductsAutoConfiguration registered via AutoConfiguration.imports (animals package
untouched). Its `@EnableMongoRepositories` lists BOTH packages — Boot's repo auto-config backs off, so
if this is mis-wired the animals repositories silently vanish; the designer's mandated gate (run the
animals ITs) was deferred by the implementor, so the orchestrator is running `mvn verify` as a
background gate now — result logged in a later entry. Design + obligation→field map under
`backend-schema/`.

## [Phase A, decision] Sibling set planned as boot-time set switch, not co-residency
Recon found every L1 injection seam (manifest, fulfilment-registry, journey-flow, dispatch, records,
session, commodity-reference) is a module-level singleton — one obligation set per Node process — and
`shared/paths.js` claims a global URL namespace both sets would collide on. Decision: plan m0 around a
boot-time set switch (env-selected served set, precedent `LIVE_ANIMALS_MODE` in `services/mode.js`), so
plant-products runs as *the* set in its own process; true co-residency is recorded as an open question,
not planned tonight. The known L2 leaks (obligation NAMES hardcoded in `bridge/obligation-source.js`,
the live-animals-shaped records mapper, `router.js` registering only `[liveAnimals]`, dep-cruiser's
`routes-is-the-gateway` whitelist, and app-root convention tests hardcoding live-animals paths) become
explicit platform increments in the backlog rather than surprises mid-build.

## [Phase A, decision] m5 todo increments carried as thin stubs, not re-planned
The source CHED-PP backlog is 37 todo + 5 deferred, not "5 unblocked" as the orchestrator prompt said —
the m0–m4 own-org happy path is 31 increments and each gets a full planner agent. The six m5 todos
(CSV branch, CUC billing, consignor-search, draft lifecycle, Article 72, auth stub) are carried into the
new backlog as thin `todo` stubs with their rulings but no detailed plan, alongside the 5 `deferred`
stubs (DoA layer, consignment-for, consignment-organisation, document-upload bytes+AV, cloning).
Rationale: the prompt scopes detailed planning to m0–m4; planning m5 tonight would burn agents on work
behind unbuilt dependencies.

## [Phase A] Recon complete — 4 maps under recon/
Four parallel readers mapped: the frontend platform (13-step boot sequence, exact `configure*`
signatures, boot-time purity/coverage assertions that fail a mis-wired set at server start), the six
recipes distilled into a planner-sufficient cheat-sheet (`recon/recipe-cheatsheet.md`), the backend
animals notification aggregate (field tree, 6 Mongo collections, REST surface, reference-number
scheme), and the CHED-PP requirements digest (8 rulings, 39 page specs all present, 354 fields,
12-spoke hub). Notable for planning: Nunjucks is already multi-set ready; dep-cruiser set-isolation
rules generalise to a second set with no config change; the L1 contract table and set-scoped
`test:plant-products` npm script are manual artefacts every increment/scaffold must add to explicitly.

## [setup, pre-run] Branches merged + created, foundation pushed
The evening session merged `spike/EUDPA-288-model-retrofit` into `spike/trace-to-requirements`
in the workspace repo (clean, disjoint paths — the merge only added the model-retrofit platform on
top of the trace-requirements docs) so the branch now carries the `frontend-change` skill and the
EUDPA-288 obligation-model + promotion corpus. New `spike/trace-to-requirements` branches were cut off
`spike/EUDPA-288-model-retrofit` in both the frontend and backend repos and pushed. Nothing to check
here — this is the starting state; the orchestrator's own decisions follow above this line.
