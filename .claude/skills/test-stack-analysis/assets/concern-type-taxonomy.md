# Concern-type taxonomy and per-repo classification

Operationalizes the pyramid-placement principle in
[`docs/best-practices/test/test-pyramid.md`](../../../../docs/best-practices/test/test-pyramid.md)
into rules `REPO_TEST_DISCOVERER` and the parent-session analysis step
can apply mechanically. Read this file in full before classifying
anything — the exceptions below are as load-bearing as the primary
rules.

## Concern-type taxonomy

Every test asserts one or more **concerns**. Each concern has a
**natural home** — the lowest pyramid level that can verify it
confidently, per the source doc's principle. Classify each concern
found in a flow/AC description against this table before checking
coverage.

| # | Concern type | Natural home | Signal in flow/AC text |
|---|---|---|---|
| 1 | UI rendering / navigation / user interaction / "responds without error" | **E2E only** — absence at lower levels is correct, not a gap | "renders," "displays," "selects," "navigates," "reloads" |
| 2 | Business logic (parsing, defaulting, validation, pass-through) | Unit | "parses," "defaults to," "validates," "passes through" |
| 3 | Data / persistence semantics (ordering, NULL handling, constraints) | Integration (needs a real DB) | "orders by," "NULL," "persists," "constraint" |
| 4 | HTTP / API contract (query param encoding, request/response shape) | Per-repo convention — see "HTTP-contract convention" below | "encodes," "forwards," "passes as query param" |
| 5 | Message / event contract (broker message shape, routing/session keys, protocol field-mapping) | Integration for wire-level assertions (needs a real broker — ASB emulator, SQS/Floci); unit for message-*construction* logic in isolation (e.g. a Mockito captor asserting what `ServiceBusMessage` gets built) | "publishes," "forwards," "routes," "session ID," "message ID," "delivers to queue/topic" |
| 6 | Auth / session-flow simulation (stateful protocol orchestration — CSRF/state tokens, session-driven redirects, JWT claim mapping across steps) | Unit for token/state/session construction logic in isolation; integration via `server.inject()`-driven route tests for the redirect/session orchestration itself — no real DB or broker needed for either | "issues," "refreshes," "redirects to," "session," "CSRF," "state token," "claims" |
| 7 | Error-handling path | Same home as the success-path logic it's the failure branch of — **not automatically E2E** | mirrors the classification of the corresponding happy path |

**Gap** = no coverage at the concern's own natural home level. A UI
concern with zero unit/integration coverage is correct, not a gap —
only flag a gap when the natural home level itself has nothing.

**Duplication** = a concern whose home is a lower level, but which is
*also* asserted with equivalent strength (including the failure path)
at a higher level. Never fires for concern type 1 (UI/navigation),
since E2E is its only legitimate home — there is no higher level to
duplicate into.

**When the higher level is E2E, it is not automatically exempt —
apply a sharper test rather than assuming cross-service confidence
excuses it.** Ask: does this specific fact only become trustworthy
because it passed through a real call from an independently-deployed
calling service — a fact neither side can prove alone by testing
itself in isolation — or
is it fully determined by one service's own logic, already proven
against real infrastructure at its own natural home, with the
higher-level test just re-observing the same fact via a longer,
UI-driven path? The former is genuine, non-duplicative confidence: a
lower tier cannot structurally rule out two independently-versioned
services disagreeing on what they exchange, no matter how real its own
infrastructure is. The latter is duplication like any other tier pair,
even though the higher level happens to be E2E — recommend trimming it
to a smoke check, same as unit-vs-integration duplication.

Decompose per sub-concern before applying this, the same way Gaps get
decomposed per the Granularity rule below — a single higher-level
assertion routinely mixes both kinds at once (e.g. a value that only
becomes trustworthy because it arrived from a real caller, bundled
alongside several other fields the callee alone decides and already
proves against real infrastructure). Flag only the sub-concern(s) that
re-observe an already-proven, single-service fact; leave the genuinely
cross-service part alone. This is a different question from the
"promote to E2E for cross-service confidence" known limitation below,
which is about whether to *add* E2E coverage on top of adequate
mocked-boundary coverage — this test is about whether an *existing*
higher-level assertion of an already-proven, single-service fact is
worth keeping.

Decomposing per sub-concern sharpens the verdict, not the finding
count — report one Duplication entry per higher-level test, naming
which specific assertions to trim and which to leave alone, rather
than a separate finding per sub-concern. A test mixing both kinds is
one finding with a mixed recommendation, not several.

**Granularity — classify per concern, not per AC bullet.** One AC
bullet routinely decomposes into multiple concerns across different
levels. Reference case (from the source doc's worked example): the
notification-dashboard sorting feature is ONE feature but FIVE
findings across THREE levels — parsing/defaulting (unit), pass-through
to the API (unit + integration), ordering/NULL placement (integration
only), dropdown rendering (E2E only). Classifying at whole-AC
granularity would miss this; decompose first, classify each piece
independently.

## Gap severity is not uniform

A reported gap is not automatically a required fix. Coverage can
never be complete, and treating every gap as equally urgent turns
every PR into an unbounded checklist — that's neither realistic nor
useful. Read each gap against one question: **if this concern silently
broke in production, would it have a real consequence** (a missing
safety control the feature's own rationale depends on, a data-integrity
or duplicate/lost-side-effect risk, a security or compliance failure),
**or would it just be a missing assertion for something that already
behaves correctly by construction** (a completeness/pyramid nit)? The
former is worth flagging as blocking; the latter is advisory at most.
This is the same category of risk-tolerance judgment as the "known
limitations" below — state a suggested read, not a verdict, and leave
the final call to the requester.

## Known limitation — explicitly out of scope

This skill does not evaluate "promote to E2E for cross-service
confidence." A flow can have adequate lower-level coverage (per the
gap/duplication rules above) that still relies on mocked service
boundaries — a team may reasonably want E2E coverage anyway, for
confidence that the mock hasn't drifted from the real upstream
contract. That is a risk-tolerance judgment call, not a fact
derivable from the test inventory, and this skill does not attempt
it. Only report true gaps and true duplication as defined above.

## Known limitation #2 — automation scope: which tier, and whether at all

The Gaps/Duplication rules above only compare against an *existing*
test inventory — they say nothing about **proposed, not-yet-built**
tests (this comes up when a run is used to scope tests for new,
unimplemented work, not just to audit an existing suite). Scoping
proposed tests needs three kinds of judgment, none of which this
skill can supply mechanically:

1. **Does a higher-tier proposal prove anything a lower-tier one for
   the same concern structurally can't?** (UI rendering, cross-service
   auth/secret wiring, real broker/config behaviour distinct from what
   a mock already covers). If not — if it would just re-prove the same
   mechanism with equivalent strength — flag it as a duplication
   candidate, the same way an *existing* higher-level test would be
   flagged above.
2. **Is the technique/cost proportionate to what's gained, and does it
   match how this class of test is conventionally scoped?** Driving a
   downstream effect through a real front-door action — an API call or
   a UI journey, anything that exercises the system's actual entry
   points and real application logic — and then observing the
   resulting state is the normal, expected default technique for
   gaining cross-service confidence at E2E. That includes cases where
   the downstream effect is a realistic failure: degrading or
   interrupting a real dependency at the infrastructure boundary, while
   the system's own logic still runs and decides the outcome, is still
   front-door — it needs no special justification. What *does* warrant
   a proportionality question is a technique that bypasses the
   system's own logic to fabricate state directly — seeding
   infrastructure by hand, or reaching into internals through a
   test-only hook that skips the code path which would normally
   produce that state — a rarer pattern usually reserved for a
   scenario a front-door action structurally can't produce.
   None of this crowns one technique as universally better — which one
   is right follows from the concern's natural home, already defined
   in the table above, not from a blanket preference either way. A
   unit-tier construction concern needs a mock and no justification,
   exactly as an E2E cross-service concern needs a front-door action
   and no justification; the only question is which one matches the
   concern in front of you.
3. **Does this concern make sense to automate at all, at any tier — or
   is manual/periodic verification the industry-standard answer
   instead?** (e.g. a rare, expensive-to-drive real-infra scenario
   where a lower tier already gives adequate confidence via a mock,
   and the only way to gain more is a real, high-cost, low-frequency
   check better done by hand than kept as a routine automated test —
   this is what a "Manual" verification step captures, alongside
   Unit/Integration/E2E, not a gap in automated coverage.)

All three are genuinely risk-tolerance/convention judgments, not facts
derivable from an inventory — same category as the "promote to E2E"
limitation above. When a run surfaces any of these — multiple tiers
proposed for one concern, a disproportionate technique, or a concern
that looks better suited to manual verification than to any automated
tier — **flag it**, don't silently recommend building everything (or
demote/cut anything unilaterally). Name the concern, what was
proposed, and which of the three questions applies. Leave the
build-or-skip-or-manual call to the requester.

## Pyramid-level classification, per repo

### Node (`trade-imports-animals-frontend`, `trade-imports-animals-admin`)

Colocated `*.test.js`, no separate integration folder. Filename
`controller.test.js` → integration-with-mocks (real `createServer()` +
`server.inject()`, only outbound HTTP mocked); anything else → unit.

**Do not trust the filename alone** — grep the file content
(`createServer(`, `server.inject(`) for the exception paths below
before finalising the tag:

- **False positives** (named `controller.test.js`, but call the
  handler directly with no server — actually unit), confirmed in
  `trade-imports-animals-frontend`:
  `src/server/cph-number/controller.test.js`,
  `src/server/addresses/controller.test.js`,
  `src/server/declaration/controller.test.js`,
  `src/server/port-of-entry/controller.test.js`,
  `src/server/additional-details/controller.test.js`,
  `src/server/commodities/details/controller.test.js`,
  `src/server/commodities/identification/controller.test.js`,
  `src/server/commodities/select/controller.test.js`.
  `trade-imports-animals-admin` has no confirmed false positives on
  this side.
- **False negatives** (not named "controller," but do call
  `createServer()`/`server.inject()` — actually integration),
  confirmed in both repos: `src/server/common/helpers/errors.test.js`,
  `src/server/common/helpers/content-security-policy.test.js`,
  `src/server/common/helpers/serve-static-files.test.js`,
  `src/server/common/helpers/start-server.test.js`.

If a candidate file's path resembles these but isn't an exact match,
grep it too rather than assuming the general rule holds — these lists
are what's been confirmed, not an exhaustive guarantee.

### Node (`trade-imports-defra-id-stub`)

Directory split `test/integration/` vs `test/unit/` — trust the
directory as the primary signal (different convention from
frontend/admin above; this repo is not colocated). **Known
exceptions**, grep-confirm before trusting the directory alone:

- `test/integration/data/s3.test.js` — no Hapi server (S3/Floci
  only) despite living under `integration/`.
- `test/unit/common/helpers/errors.test.js`,
  `test/unit/common/helpers/serve-static-files.test.js` — both
  actually call `createServer()`/`startServer()` + `server.inject()`
  despite living under `unit/`.

### Java (`trade-imports-animals-backend`, `trade-imports-stub`, `trade-imports-reference-data`, `trade-imports-dynamics-gateway`)

`*Test.java` = unit, `*IT.java` = integration, `*IT.java` segregated
into an `integration/` sub-package. Verified 100% reliable across all
four repos (93 files sampled, zero exceptions) and tool-enforced —
`maven-surefire-plugin` only picks up `**/*Test.java`,
`maven-failsafe-plugin` only picks up `**/*IT.java`, no repo overrides
the default include patterns. **Trust the filename alone — no
content-grep fallback needed for Java**, unlike the Node case above.

One documentation caveat, not an exception to trust: some
`*Test.java` files use `@WebMvcTest` (a partial Spring context +
MockMvc — simulated HTTP, no real network, no DB). These are still
correctly **unit**-level. If you're ever tempted to add a
content-check ("Spring annotation present → integration"), don't —
`@WebMvcTest` + `@MockitoBean` is unit, full stop.

### Playwright E2E (`trade-imports-animals-tests`)

All specs are concern type 1 (UI/E2E) by definition — the pyramid
question doesn't apply here, only flow **attribution** does (which
spec/test covers which flow, for cross-referencing against gaps found
at lower levels).

Filename + top-level `describe()` name maps reliably 1:1 to a
feature/flow under `tests/e2e/features/*` (e.g.
`notification-dashboard-sort.spec.ts` →
`test.describe('Notification dashboard sort', ...)`). This is the
primary signal and covers the bulk of the suite.

**Known-exception categories — fall back to parsing nested
`describe`/`test.step` names instead of the top-level describe:**

- `tests/a11y/*` (e.g. `default-journey.spec.ts`,
  `admin-journey.spec.ts`) are journey-style sweeps where the
  file/describe name is the *test type* ("Accessibility WCAG 2.2 AA"),
  not the feature. The actual pages/flows covered only appear in
  nested `test.step` names.
- `tests/e2e/features/admin/admin-auth.spec.ts` nests two distinct
  flows (`'Authentication (admin)'` and
  `'Notifications (admin) (unauthenticated entry)'`) under one file —
  attribute by the nested describe, not the file as a whole.

Playwright tags (`@a11y`, `@integration`, `@mongodb`, `@compose`,
`@auth`, `@visual`, `@slow`, `@no-js`) are execution/environment
filters only — never feature-named, not usable for attribution.
`tests/e2e/journeys/` and `tests/cross-browser/` currently contain
only README placeholders — treat as "nothing here," not a parsing
edge case.

## HTTP-contract convention, per repo

Concern type 4's natural home is a house-style convention, not a
structural fact — it must be looked up per repo, not inferred fresh
each run. Confirmed conventions:

| Repo | Convention |
|---|---|
| `trade-imports-animals-frontend` | Client query-param/request encoding tested at controller (integration-with-mocks) level, not pure unit |
| `trade-imports-animals-backend` | Request/response shape tested at both `@WebMvcTest` unit level (status/body via MockMvc) and integration level (via `WebTestClient` against the real context) |
| `trade-imports-dynamics-gateway` | Inbound `POST /events` (`EventsSendController`) tested at both unit (`@WebMvcTest`) and integration level (real request against the `ServiceBusEmulatorContainer`-backed context) — same pattern as backend |
| `trade-imports-animals-admin` | **Not independently verified — assumed same as frontend** (colocated `.test.js`, same Hapi stack). Confirm before relying on this for a real gap/duplication finding. |
| `trade-imports-reference-data` | **Not independently verified — assumed same as backend** (same Spring Boot/Maven stack). Confirm before relying on this for a real gap/duplication finding. |
| `trade-imports-stub` | No product HTTP contract to test — its controllers (`CountriesController`, `TradeAuthController`) return hardcoded fixtures. If a run finds zero tests for these controllers, that is a real, correctly-reported gap, not a taxonomy miss — see meta-finding below. |
| `trade-imports-defra-id-stub` | OIDC-specific endpoints classify under concern type 6 (auth/session-flow), not type 4 — see `test/integration/routes/*.test.js` |

## Verification fixtures

Known-good cases to sanity-check the classification, gap/duplication,
and severity logic against, if in doubt about a result:

1. **Notification dashboard sorting** (source doc's worked example) —
   full coverage, no gaps or duplication expected: unit (parsing,
   pass-through), integration (ordering, NULL placement), E2E
   (dropdown rendering only). If a run against this flow reports a
   gap or duplication finding, the classification logic has a bug.
2. **`trade-imports-stub`'s own fixture-serving behaviour** — a known,
   pre-existing, real gap. None of its 15 test files exercise
   `CountriesController` or `TradeAuthController` at all; the suite is
   entirely inherited platform/infra plumbing. A correct run against
   this repo's fixture-serving flow should report this as a gap. If it
   doesn't, the discovery step is over-matching unrelated platform
   tests as coverage.
3. **Severity calibration pair** — two ticket-agnostic patterns to
   sanity-check Blocking vs Advisory tagging specifically, deliberately
   not anchored to one real ticket (a live feature's "missing check"
   today becomes "implemented and tested" tomorrow, which would make a
   ticket-specific fixture stale the moment it ships):
   - **Known-Blocking pattern**: an AC states a precondition that
     *must* be enforced before some action proceeds (a check, a guard,
     an authorisation gate). Grep the service that owns the action and
     find no such check anywhere in source — not merely untested, but
     structurally absent — while the AC's own rationale names a
     concrete harm (duplicated processing, data corruption,
     unauthorised access) that results from skipping it. A correct run
     tags this **Blocking**. If it comes out Advisory, severity tagging
     is under-weighting a missing safety control the feature's own
     rationale depends on.
   - **Known-Advisory pattern**: an AC describes a scenario (e.g. "a
     retried operation must reuse the same identifier") with no test
     naming it explicitly, but the invariant holds by construction from
     adjacent, already-tested code (the identifier is assigned once,
     upstream, and structurally never reassigned) — no code path exists
     that could violate it, even though nothing exercises the scenario
     directly. A correct run tags this **Advisory**. If it comes out
     Blocking, severity tagging is over-weighting a completeness gap
     with no demonstrated defect.
