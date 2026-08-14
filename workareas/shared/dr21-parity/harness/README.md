# DR2.1 cartographer

Walks DESIGN RELEASE 2.1 screens in the designer prototype and captures a
normalised structural model, raw HTML, a full-page PNG and a Playwright trace per
screen — the prototype half of the EUDPA-328 parity corpus.

Descended from the DR2 cartographer recovered at
`../prior/harness/`. The extractor (`e2e/page-model.js`) is carried over
**unmodified** — it proved diffable across two unrelated codebases and there is no
reason to re-derive it. What changes is the mount prefix and the screen list.

## Status

Phase 0 canary only (`e2e/canary.spec.js`, 3 standalone pages). The full DR2.1
walker — 31 views including germinal products — is Phase 1.

## Run it

The prototype lives outside this workspace, so `node_modules` here is a symlink to
its install. Recreate it if it goes stale:

```
ln -sfn ~/git/defra/defra-design/GB-notification-service/node_modules <this-dir>/node_modules
```

Then:

```
~/git/defra/defra-design/GB-notification-service/node_modules/.bin/playwright \
  test --config <this-dir>/playwright.config.js --reporter=list
```

`webServer` boots the kit itself on **3010** — clear of the workspace stack's
3000/3001/3007/3100/3200, so the stack can stay up. Models land in `capture/model/`,
HTML in `capture/html/`, screenshots in `capture/screens/`, traces in
`test-results/`.

## Gotchas (carried forward, all still true)

- Boot with `npm run dev`, **not** `serve` — production mode forces http→https on a
  plaintext server and sets secure-only cookies that break kit sessions.
- `webServer` waits on the **TCP port**, not an HTTP GET: the kit accepts
  connections before an HTTP probe settles under Node 24.
- Run **serially** (`workers: 1`) — the kit dev server races journey/session state
  across concurrent requests and silently drops a page's data.
- The MoJ date picker must be Escape-dismissed after filling, or its calendar
  overlays the next control.
- First run is slow: the kit compiles its Sass on the first request, which lands
  inside the first test's navigation rather than during boot.

## What changed from DR2

- `BASE` is `/design-release-2.1`.
- The mount is defined by `app/lib/design-release-2.1-version.js`, which re-mounts
  the *whole* router under the prefix — so the screen list is the route table, not a
  separate views directory.
- Germinal products are new and in scope. They branch `consignment-details` and
  `animal-identification-details`, so those two pages need capturing in **both**
  commodity branches, not just the live-animal one.
- DR2.1 defines four service-navigation destinations (dashboard, service, templates,
  address book). Templates is a sub-domain — `templates`, `templates/create`,
  `templates/:id`, `templates/:id/use` — with no frontend equivalent.

## Not carried over

The old `fe.config.js` + `fe/` specs drove the workspace stack's test-target
frontend on `localhost:3100` through a full OIDC sign-in. That is obsolete: the
frontend side of the corpus now comes from the repo's own `features` Playwright
project plus `--trace on`, which needs no stack, no sign-in and no bespoke walker.
