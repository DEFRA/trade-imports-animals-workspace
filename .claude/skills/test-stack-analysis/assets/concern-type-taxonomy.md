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
| 5 | Message / event contract (broker message shape, routing/session keys, protocol field-mapping) | Integration for wire-level assertions (needs a real broker — ASB emulator, SQS/LocalStack); unit for message-*construction* logic in isolation (e.g. a Mockito captor asserting what `ServiceBusMessage` gets built) | "publishes," "forwards," "routes," "session ID," "message ID," "delivers to queue/topic" |
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

**Granularity — classify per concern, not per AC bullet.** One AC
bullet routinely decomposes into multiple concerns across different
levels. Reference case (from the source doc's worked example): the
notification-dashboard sorting feature is ONE feature but FIVE
findings across THREE levels — parsing/defaulting (unit), pass-through
to the API (unit + integration), ordering/NULL placement (integration
only), dropdown rendering (E2E only). Classifying at whole-AC
granularity would miss this; decompose first, classify each piece
independently.

## Known limitation — explicitly out of scope

This skill does not evaluate "promote to E2E for cross-service
confidence." A flow can have adequate lower-level coverage (per the
gap/duplication rules above) that still relies on mocked service
boundaries — a team may reasonably want E2E coverage anyway, for
confidence that the mock hasn't drifted from the real upstream
contract. That is a risk-tolerance judgment call, not a fact
derivable from the test inventory, and this skill does not attempt
it. Only report true gaps and true duplication as defined above.

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

- `test/integration/data/s3.test.js` — no Hapi server (S3/localstack
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

Two known-good cases to sanity-check the classification and
gap/duplication logic against, if in doubt about a result:

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
