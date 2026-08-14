# DR2 cartographer

Walks every DESIGN RELEASE 2 screen and captures a normalised structural model,
raw HTML, a full-page PNG and a Playwright trace per screen.

## Run it

The prototype lives outside this workspace, at
`~/git/defra/defra-design/GB-notification-service`. Playwright resolves
`@playwright/test` from there, so either run the binary from that repo or
symlink its `node_modules` next to this config:

```
ln -sfn ~/git/defra/defra-design/GB-notification-service/node_modules <this-dir>/node_modules
~/git/defra/defra-design/GB-notification-service/node_modules/.bin/playwright \
  test --config <this-dir>/playwright.config.js --reporter=list
```

`webServer` boots the kit itself (dev mode, port **3010** — kept clear of the
workspace stack's 3000/3001/3007/3100/3200). Artefacts land in `capture/`
alongside the config; traces and screenshots in `test-results/`.

## Gotchas (hard-won)

- Boot with `npm run dev`, **not** `serve` — production mode forces http→https
  on a plaintext server and sets secure-only cookies that break kit sessions.
- `webServer` waits on the **TCP port**, not an HTTP GET: the kit accepts
  connections before an HTTP probe settles under Node 24.
- Run **serially** (`workers: 1`) — the kit dev server races journey/session
  state across concurrent requests and silently drops a page's data.
- The MOJ date picker must be Escape-dismissed after filling, or its calendar
  overlays the port dropdown.
- Every navigation goes through `BASE = '/design-release-2'`. The only
  unprefixed URLs are `/address-book*`, which DR2 deliberately shares with
  DR1 (`app/lib/version-mount.js:45`).

## The real frontend

`fe.config.js` + `fe/` drive the workspace stack's **test-target** frontend on
`localhost:3100` (`docker/stack/frontend.compose.yml`, profile `test-target`).
Same extractor, captures prefixed `fe-`:

```
~/git/defra/defra-design/GB-notification-service/node_modules/.bin/playwright \
  test --config <this-dir>/fe.config.js --reporter=list
```

- Sign-in uses the tests repo's canned Government Gateway user
  (`2100010101`); override the password with `AUTH_PASSWORD`.
- The OIDC redirect is registered on `localhost:3100`, so the whole dance must
  stay on that host — do not mix in `host.docker.internal`.
- `frontend.spec.js` creates one draft notification and reaches every journey
  page by direct navigation (the entry guard permits it). It does **not**
  submit, so no downstream events fire.
- `extras.spec.js` re-captures the dashboard (the first walk caught it
  mid-navigation) plus the delete and cancel-amend pages.

Not yet captured: `confirmation` (needs a real submission) and `cancel-amend`
in its live state (needs a notification actually being amended).
