# Testing — trade-imports-animals-frontend

## Overview

All tests use **Vitest** and run in a Node environment. There is no browser test runner — controllers are tested by spinning up the real Hapi server and calling `server.inject()`. End-to-end browser tests (Playwright) live in the separate `trade-imports-animals-tests` repo.

**Run with:**
```bash
npm test            # run once with coverage
npm run test:watch  # watch mode for development
```

`npm test` excludes the `./tests/` directory (Playwright specs) so only unit tests run.

---

## File naming and location

| Convention | Detail |
|------------|--------|
| Pattern | `*.test.js` (no `.spec.js`) |
| Location | Colocated — same directory as the source file |
| Scope | All test files under `src/` |

---

## Test types

Three distinct flavours are used, each with its own setup pattern:

| Type | When to use |
|------|-------------|
| **Pure unit** | Pure functions — filters, utilities, auth helpers, schema validation |
| **Controller** | Hapi route handlers — spins up a real server, uses `server.inject()` |
| **API client** | HTTP client modules — mocks `global.fetch` |

---

## Pure unit tests

For functions with no side effects, import and call directly. No server, no mocks unless the function has dependencies:

```js
import { formatCurrency } from './format-currency.js'

describe('#formatCurrency', () => {
  describe('With defaults', () => {
    test('Currency should be in expected format', () => {
      expect(formatCurrency('20000000')).toBe('£20,000,000.00')
    })
  })
})
```

---

## Controller tests

Controllers are tested via a full Hapi server instance. This exercises routing, auth strategy, session handling, Nunjucks rendering, and error handling in one pass.

### Setup pattern

Create the server once in `beforeAll`, stop it in `afterAll`. Spy on any backend client methods the controller calls before the server starts:

```js
import { notificationClient } from '../common/clients/notification-client.js'
import { createServer } from '../server.js'

vi.mock('../../auth/get-oidc-config.js', () => ({
  getOidcConfig: vi.fn(() => Promise.resolve(mockOidcConfig))
}))

vi.mock('../../config/config.js', async (importOriginal) => {
  const { mockAuthConfig } = await import('../common/test-helpers/mock-auth-config.js')
  return mockAuthConfig(importOriginal)
})

describe('#originController', () => {
  let server

  beforeAll(async () => {
    vi.spyOn(notificationClient, 'get').mockResolvedValue(null)
    vi.spyOn(notificationClient, 'submit').mockResolvedValue({ referenceNumber: 'TEST-REF-123' })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
    vi.restoreAllMocks()
  })
})
```

Always pass `{ timeout: 0 }` to `server.stop()` — without it the test can hang waiting for connections to drain.

Always mock `get-oidc-config.js` and `config.js` using the shared helpers — every controller test requires these two mocks or the server will fail to start.

### Making requests

Use `server.inject()` for all HTTP simulation. Always provide `auth` with a session strategy:

```js
// GET — check rendered HTML
const { result, statusCode } = await server.inject({
  method: 'GET',
  url: '/origin',
  auth: {
    strategy: 'session',
    credentials: { user: {}, sessionId: 'TEST_SESSION_ID' }
  }
})

expect(statusCode).toBe(statusCodes.ok)
expect(result).toEqual(expect.stringContaining('Origin of the import'))

// POST — check redirect
const { statusCode, headers } = await server.inject({
  method: 'POST',
  url: '/origin',
  auth: {
    strategy: 'session',
    credentials: { user: {} }
  },
  payload: {
    countryCode: 'DE',
    requiresRegionCode: 'no'
  }
})

expect(statusCode).toBe(302)
expect(headers.location).toBe('/commodities')
```

Use the `statusCodes` constants (`statusCodes.ok`, etc.) rather than magic numbers for GET assertions. For redirects, `302` inline is fine.

### DOM assertions with Cheerio

When you need to assert on specific HTML elements rather than string content, parse the response with Cheerio:

```js
import { load } from 'cheerio'

const $ = load(result)

// Element count
const selectOptions = $('#countryCode option')
expect(selectOptions.length).toBeGreaterThan(25)

// Form inputs
const regionRadios = $('input[name="requiresRegionCode"]')
expect(regionRadios.length).toBeGreaterThan(0)
```

Use `expect.stringContaining()` for simple content checks; reach for Cheerio only when you need to query by element, attribute, or structure.

### Testing error paths in controllers

Override a spy's return value for a single test with `mockRejectedValueOnce`:

```js
test('Should handle when backend submit fails', async () => {
  notificationClient.submit.mockRejectedValueOnce(
    Object.assign(new Error('Backend error'), { status: 500, statusText: 'Internal Server Error' })
  )

  const { statusCode, headers } = await server.inject({ ... })

  expect(statusCode).toBe(302)
  expect(headers.location).toBe('/commodities')
})
```

`mockRejectedValueOnce` applies only to the next call — subsequent tests get the original `beforeAll` mock value back.

---

## API client tests

HTTP clients that call `global.fetch` directly should mock fetch on `global` and restore it after each test:

```js
beforeEach(() => {
  originalFetch = global.fetch
  global.fetch = vi.fn()
})

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})
```

Mock `fetch` responses by providing the `ok`, `status`, `statusText`, and `json` shape:

```js
// Success
fetch.mockResolvedValueOnce({
  ok: true,
  json: vi.fn().mockResolvedValue({ referenceNumber: 'REF-123' })
})

// Error
fetch.mockResolvedValueOnce({
  ok: false,
  status: 404,
  statusText: 'Not Found',
  json: vi.fn().mockResolvedValue({ message: 'Not found' })
})
```

Assert on what was sent to `fetch` and what came back:

```js
expect(fetch).toHaveBeenCalledWith(
  'http://mock-backend/notifications',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-trace-id': traceId },
    body: JSON.stringify(expectedPayload)
  }
)
expect(result).toEqual(responseBody)
```

For error cases, assert that the client throws and logs:

```js
await expect(
  notificationClient.submit(mockRequest, traceId)
).rejects.toMatchObject({
  message: 'Failed to submit notification',
  status: 500,
  statusText: 'Internal Server Error'
})

expect(mockLoggerError).toHaveBeenCalledTimes(1)
```

---

## Mocking

### Module mocks

Place all `vi.mock()` calls at the top of the file, before any imports of the code under test. Vitest hoists them automatically, but keeping them visually at the top makes dependencies obvious.

```js
vi.mock('../../auth/get-oidc-config.js', () => ({
  getOidcConfig: vi.fn(() => Promise.resolve(mockOidcConfig))
}))
```

For partial mocks (keep real implementation, override one export), use `importOriginal`:

```js
vi.mock('../../config/config.js', async (importOriginal) => {
  const { mockAuthConfig } = await import('../common/test-helpers/mock-auth-config.js')
  return mockAuthConfig(importOriginal)
})
```

### Hoisted mocks

When a mock function needs to be referenced both inside `vi.mock()` and in test assertions, declare it with `vi.hoisted()` before the mock call:

```js
const wreckGetMock = vi.hoisted(() => vi.fn())
const jwtVerifyMock = vi.hoisted(() => vi.fn())

vi.mock('@hapi/wreck', () => ({
  default: { get: wreckGetMock }
}))

vi.mock('@hapi/jwt', () => ({
  default: { token: { verify: jwtVerifyMock } }
}))
```

This pattern is needed because `vi.mock()` factory functions run before module imports, so variables declared with `const` would be in the temporal dead zone.

### Spies

Use `vi.spyOn()` for mocking methods on imported objects where you want to preserve the original module otherwise:

```js
vi.spyOn(notificationClient, 'get').mockResolvedValue(null)
vi.spyOn(notificationClient, 'submit').mockResolvedValue({ referenceNumber: 'TEST-REF-123' })
```

Always call `vi.restoreAllMocks()` in `afterAll` to undo spies.

### Shared test helpers

Reuse the shared helpers in `src/server/common/test-helpers/` rather than duplicating mock config in every test file:

| Helper | Purpose |
|--------|---------|
| `mock-oidc-config.js` | Static OIDC discovery config object for auth mocks |
| `mock-auth-config.js` | Factory that wraps `importOriginal` for the config module |
| `component-helpers.js` | `renderComponent(name, params)` — renders a Nunjucks macro and returns a Cheerio `$` |

---

## Component template tests

Test Nunjucks macros via `renderComponent` from `component-helpers.js`:

```js
import { renderComponent } from '../common/test-helpers/component-helpers.js'

describe('heading component', () => {
  test('renders heading text', () => {
    const $ = renderComponent('heading', { text: 'Page title' })
    expect($('h1').text()).toContain('Page title')
  })
})
```

---

## Describe / test structure

Group related tests with `describe`, one `test` per assertion. Nest describes for method/HTTP verb separation:

```
describe('#controllerName', () => {
  describe('GET /path', () => {
    test('Should render the page', ...)
    test('Should display expected content', ...)
  })
  describe('POST /path', () => {
    test('Should redirect on success', ...)
    test('Should handle backend errors', ...)
  })
})
```

Test descriptions use "Should" + present tense action. Describe blocks use `#functionName` for functions/modules or `METHOD /path` for HTTP handlers.

---

## Test philosophy

**Test behaviour, not implementation.** Assert on observable outputs — HTTP status codes, response body content, session writes, thrown errors — rather than on which internal functions were called.

Avoid bare `toHaveBeenCalled()` and `toHaveBeenCalledTimes(N)` on their own. If a spy call matters, assert *what* it was called with using `toHaveBeenCalledWith(...)`. If only the side-effect matters, assert the side-effect directly (e.g. check the session value was set, not that `setSessionValue` was called).

```js
// ✗ tests implementation — doesn't catch wrong arguments
expect(documentClient.initiate).toHaveBeenCalled()

// ✓ tests behaviour — catches wrong notificationRef, wrong payload shape
expect(documentClient.initiate).toHaveBeenCalledWith(
  'TEST-REF-123',
  expect.objectContaining({ documentType: 'ITAHC', dateOfIssue: '2024-03-10' }),
  expect.any(String)
)

// ✓ also fine — assert the observable effect instead
expect(setSessionValue).toHaveBeenCalledWith(
  expect.anything(),
  'documents',
  expect.arrayContaining([expect.objectContaining({ uploadId: 'TEST-UPLOAD-ID' })])
)
```

---

## Assertions

Vitest's built-in `expect` is used throughout — no additional assertion library.

```js
// Equality
expect(statusCode).toBe(200)
expect(result).toEqual(responseBody)

// String containment
expect(result).toEqual(expect.stringContaining('Origin of the import'))

// Object shape
expect(error).toMatchObject({ message: 'Failed', status: 404 })

// Collections
expect(selectOptions.length).toBeGreaterThan(25)

// Spy calls
expect(fetch).toHaveBeenCalledTimes(1)
expect(fetch).toHaveBeenCalledWith(url, options)
expect(mockFn).not.toHaveBeenCalled()

// Async — resolve/reject
await expect(fn()).resolves.toBeUndefined()
await expect(fn()).rejects.toThrow('message')
await expect(fn()).rejects.toMatchObject({ status: 500 })
```

Prefer `.rejects.toMatchObject()` over `.rejects.toThrow()` when you need to assert on error properties beyond the message.

---

## What the existing tests cover

| Area | Files | What it covers |
|------|-------|---------------|
| Controllers | 7 | Route rendering, form POST handling, redirects, backend error paths |
| Auth | 7 | Token verification, permission extraction, redirect safety, sign-out URL, OIDC config, session state, token refresh |
| API client | 1 | Fetch call shape, session read/write, error propagation and logging |
| Nunjucks filters | 2 | Currency and date formatting |
| Nunjucks context | 2 | Navigation building, global context |
| Plugins | 2 | Auth plugin registration, CSRF protection |
| Helpers | 6 | Redis client, CSP headers, proxy setup, static file serving, error helpers, server startup |
| Session / cache | 1 | Cache engine (ioredis wrapper) |
| Schema validation | 1 | Origin form schema |
| Component templates | 1 | Heading macro rendering |
