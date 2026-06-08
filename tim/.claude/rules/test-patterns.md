---
paths:
  - "**/*.test.js"
  - "**/*.test.jsx"
  - "**/*.spec.js"
---

# Test conventions

## Behavioural assertions only

- Pure function → call it, assert the return value or thrown error.
- Hook + UI → render with `ink-testing-library`, assert against `lastFrame()`.
- HTTP client → mock the network with `undici` MockAgent, call the client, assert the returned data shape or thrown `TimError`.
- CLI command → spawn `node src/cli.js <cmd> --json`, parse stdout, validate with the command's zod schema.

`toHaveBeenCalled` / `toHaveBeenCalledWith` / `toHaveBeenCalledTimes` are blocked by `forbid-spy-assertions.sh`. The rare valid case (outbound webhook, analytics event) opts out with `// allow-spy-assertion: <why>` on the line above the assertion AND asserts on the captured payload (collected via a fake), not the spy call record.

## Mock at the outermost deterministic boundary

- Network → `undici` MockAgent. Not the client module.
- Filesystem → real temp dirs (`node:fs/promises` + `os.tmpdir()`). Not `vi.mock('node:fs')`.
- Clock → real time, or `vi.useFakeTimers()` only when the assertion depends on time advancing.

## Structure

- Arrange-Act-Assert. Blank line between each.
- One assertion per concern. A test that "renders the screen, advances time, asserts two unrelated things" is two tests.
- Avoid `beforeEach` that obscures the test's facts. If the setup is reused in 3+ tests, factor a named helper called from inside each test.
- Test names describe the behaviour, not the function: "lists matching PRs for the given ticket id", not "findPrsForTicket works".

## Fixtures

- Co-locate fixtures next to the test (`./__fixtures__/<name>.json` or `./fixtures/<name>.json`).
- A fixture is real captured data, lightly trimmed. Don't hand-author a fake shape — the test stops catching upstream drift.
