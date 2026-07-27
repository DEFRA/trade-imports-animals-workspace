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

This table is a starting heuristic, not the verdict — it tells you
where to look first. The question that actually decides a gap or
duplication finding is the source doc's
["Ask this first"](../../../../docs/best-practices/test/test-pyramid.md#ask-this-first-what-risk-does-this-test-protect-against):
what production risk does this concern represent, and is it proven
*anywhere* with adequate strength? In practice the table and the risk
question agree almost every time — only depart from the table when
there's a concrete reason a concern's risk isn't actually covered by
its nominal natural home (see concern type 6's note below for a
worked example).

| # | Concern type | Natural home | Signal in flow/AC text |
|---|---|---|---|
| 1 | UI rendering / navigation / user interaction / "responds without error" | **E2E only** — absence at lower levels is correct, not a gap | "renders," "displays," "selects," "navigates," "reloads" |
| 2 | Business logic (parsing, defaulting, validation, pass-through) | Unit | "parses," "defaults to," "validates," "passes through" |
| 3 | Data / persistence semantics (ordering, NULL handling, constraints) | Integration (needs a real DB) | "orders by," "NULL," "persists," "constraint" |
| 4 | HTTP / API contract (query param encoding, request/response shape) | Per-repo convention — see "HTTP-contract convention" below | "encodes," "forwards," "passes as query param" |
| 5 | Message / event contract (broker message shape, routing/session keys, protocol field-mapping) | Integration for wire-level assertions (needs a real broker — ASB emulator, SQS/Floci); unit for message-*construction* logic in isolation (e.g. a Mockito captor asserting what `ServiceBusMessage` gets built) | "publishes," "forwards," "routes," "session ID," "message ID," "delivers to queue/topic" |
| 6 | Auth / session-flow simulation (stateful protocol orchestration — CSRF/state tokens, session-driven redirects, JWT claim mapping across steps) | Unit for token/state/session construction logic in isolation; integration via `server.inject()`-driven route tests for the redirect/session orchestration itself — no real DB or broker needed for either | "issues," "refreshes," "redirects to," "session," "CSRF," "state token," "claims" |
| 7 | Error-handling path | Same home as the success-path logic it's the failure branch of — **not automatically E2E** | mirrors the classification of the corresponding happy path |

**Concern type 6 spot-check** — don't blindly trust "unit + integration,
no E2E" for every auth/session fact. Split it: a fact that's genuinely
determined by the browser mechanism (cookie flags like `Secure`/
`HttpOnly`, an actual redirect chain the browser follows) only becomes
trustworthy via a real browser, so it belongs at E2E per concern type
1's rule, not type 6's. A fact that's a business rule the service alone
decides (session timeout duration, which claims get mapped) stays at
unit/integration as the table says — a browser doesn't make that fact
any more trustworthy. Reclassify the specific sub-fact, don't move the
whole row.

**Gap** = no test anywhere proves this specific risk — not merely
"nothing at the natural-home level." The table above is where to start
looking; only flag a genuine mismatch between the table and reality
rather than silently overriding the table on a hunch (see the
concern-type-6 note above for what a legitimate mismatch looks like). A
UI concern with zero unit/integration coverage is correct, not a gap —
only flag a gap when nothing anywhere proves it.

**Duplication** = a concern proven with equivalent strength (including
the failure path) at more than one place — whether that's a lower
level and a higher level, or two tests at the *same* level. Cross-level
duplication never fires for concern type 1 (UI/navigation), since E2E
is its only legitimate home — there is no higher level to duplicate
into — but same-tier duplication still applies within E2E itself (see
below).

**Same-tier duplication** — flag it too, not just cross-level:
multiple Playwright journeys each re-verifying identical login/
validation behaviour with no distinct scenario between them; a second
unit test asserting the same input/output pair as the first under a
different name; several integration tests re-proving the same
ordering rule against fixture data that doesn't exercise a different
code path. The test is the same as cross-level duplication — does the
second test prove anything the first one doesn't — not "is it at a
different level."

**When a higher-level test crosses an independently-deployed service
boundary that the lower level's test cannot — most commonly when the
higher level is E2E, but the same reasoning applies to a backend
integration test that makes a real call to another service — it is
not automatically exempt from the duplication check.** Apply a
sharper test rather than assuming cross-service confidence excuses it.
Ask: does this specific fact only become trustworthy because it
passed through a real call from an independently-deployed calling
service — a fact neither side can prove alone by testing itself in
isolation — or
is it fully determined by one service's own logic, already proven
against real infrastructure at its own natural home, with the
higher-level test just re-observing the same fact via a longer path?
The former is genuine, non-duplicative confidence: a lower tier cannot
structurally rule out two independently-versioned services disagreeing
on what they exchange, no matter how real its own infrastructure is.
The latter is duplication like any other tier pair, even though the
higher level happens to cross a service boundary — recommend trimming
it to a smoke check, same as unit-vs-integration duplication.

Decompose per sub-concern before applying this, the same way Gaps get
decomposed per the Granularity rule below — a single higher-level
assertion routinely mixes both kinds at once (e.g. a value that only
becomes trustworthy because it arrived from a real caller, bundled
alongside several other fields the callee alone decides and already
proves against real infrastructure). Flag only the sub-concern(s) that
re-observe an already-proven, single-service fact; leave the genuinely
cross-service part alone.

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
This is a risk-tolerance judgment call, not a fact derivable from the
inventory — state a suggested read, not a verdict, and leave the
final call to the requester.

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
