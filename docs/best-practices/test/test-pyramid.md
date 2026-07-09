# Test Pyramid — Testing Across the Stack

```
        /\
       /  \  <- E2E
      /____\
     /      \
    /        \  <- Integration
   /__________\
  /            \
 /              \  <- Unit
/________________\
```

- **Unit** — isolated logic, no server, no DB, no broker.
- **Integration** — real DB / broker / server behind the boundary.
- **E2E** — full browser stack, Playwright.

Fewer, broader tests at the top; more, narrower tests at the base —
each concern lives at the lowest tier that can verify it confidently.

---

This workspace has tests at several levels across 8 repos: unit and
integration tests in the Java/Spring Boot backends (`trade-imports-animals-backend`,
`trade-imports-stub`, `trade-imports-reference-data`,
`trade-imports-dynamics-gateway`), unit and controller tests in the
Node/Hapi frontends (`trade-imports-animals-frontend`,
`trade-imports-animals-admin`, `trade-imports-defra-id-stub`), and
Playwright E2E tests in `trade-imports-animals-tests`.

The patterns below are about **where** a given concern should be
tested, not how to write the test itself — see
[`java/testing/`](../java/testing/) and [`node/testing/`](../node/testing/)
for language-specific conventions.

---

## Each concern belongs at the lowest level that can cover it confidently

Logic belongs in unit tests. Data and HTTP behaviour belongs in
integration tests. Only what genuinely requires the full stack — UI
rendering, navigation, user journeys — belongs in Playwright. Keeping
E2E lean avoids duplication and makes the suite faster and less
fragile.

---

## Testing levels, per stack

Each stack implements this principle differently — here's what
belongs where in each one.

### Backend (Java / Spring Boot)

- **Unit tests** — test individual classes in isolation: parameter
  parsing, controller pass-through, service logic. No database, no
  HTTP.
- **Integration tests (ITs)** — spin up a real database and exercise
  the full backend slice end-to-end. The right place to assert data
  ordering, NULL handling, and persistence behaviour.

### Frontend (Node.js / Hapi) — Vitest

The frontend has two kinds of test, all colocated as `.test.js` files
alongside the source:

- **Unit tests** — pure functions tested in isolation: schema
  validators, Nunjucks filters, auth helpers, sort parsers. No server
  involved.
- **Controller tests** — despite living in the same suite, these are
  effectively **integration tests with mocks**. They spin up a real
  Hapi server via `createServer()` and fire requests through it using
  Hapi's built-in `server.inject()`, exercising the full
  request/response cycle: routing, auth plugin, session, and Nunjucks
  rendering. Only the outbound HTTP clients are mocked at the module
  boundary.

If you wanted to go further, you could use **nock** to intercept
outbound HTTP at the network layer rather than mocking the client
modules — exercising the real client code paths. The additional value
would be marginal though: any bug in the outbound HTTP clients would
surface behaviourally in the Playwright E2E suite anyway, and the
client modules themselves have their own unit tests. The current
approach — real Hapi server, mocked external clients — is already the
right level for this repo.

### E2E (Playwright — `trade-imports-animals-tests`)

Full browser tests against a running stack. The right place for UI
rendering concerns, user interactions, and smoke-testing that the
application responds without error. Not the right place for asserting
business logic, data ordering, or behaviour that lower levels already
cover reliably.

---

## Map coverage before writing E2E tests

Before writing any E2E tests, map existing coverage against the
acceptance criteria across all levels first. For each AC, check what
is already proven at unit and integration level before deciding what,
if anything, needs an E2E test. This prevents duplicating coverage
that lower levels already provide, and surfaces gaps that belong lower
down rather than being papered over with E2E tests.

That mapping will often reveal missing unit or integration tests worth
addressing in their own right. Those gaps should be fixed at the
appropriate level — not compensated for with E2E tests. Writing E2E
tests to fill lower-level gaps makes the suite slower, more
data-dependent, and harder to maintain, without adding meaningful
confidence over what a well-placed unit or integration test would
provide.

---

## In practice — notification dashboard sorting

The sorting feature illustrates how this plays out across the stack.

**Backend unit tests** handled the logic in isolation — sort
parameter parsing and its default fallback, controller pass-through to
the service, and the service correctly constructing the `Pageable`
passed to the repository.

**Backend integration tests** covered the data concerns that only a
real database can verify — correct ordering for `arrivalDate,desc` and
`createdAt,asc`, and NULL `arrivalDate` values appearing last. This is
where ordering assertions belong; E2E data is dynamic and would make
these assertions fragile.

**Frontend unit tests** covered `parseNotificationSort()` — default
and validation behaviour, and that sort is preserved correctly in
pagination links.

**Frontend controller tests** (integration with mocks) verified the
data flow through the Hapi server — that the default `arrivalDate,desc`
is forwarded to the API, that a user-chosen sort option is passed
through correctly, and that sort is preserved across page navigation.
Also covered at this level: the notification client encoding `sort`
correctly as a URL query parameter.

**Playwright E2E** was reserved for what only the full stack can
verify — that the sort dropdown renders with the correct default
option selected, that all four sort options are present, and that
selecting each one submits and reloads the page without error. Order
assertions, NULL placement, and sort persistence across pages were
explicitly left out of E2E — all already proven at lower levels.
