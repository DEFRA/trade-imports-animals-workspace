# DR2.1 walker — worker brief

You are writing one slice of the Design release 2.1 cartographer for EUDPA-328. Read
this whole file before touching anything, then read `README.md` next to it.

## What you are producing

A Playwright spec that walks your assigned DR2.1 screens and captures a page model for
each, so the designer prototype can be diffed screen-by-screen against the real
frontend.

**This is a capture harness, not an assertion suite.** The models are the deliverable.
But every step must assert the journey actually landed where it should — a
silently-rejected page that leaves a mislabelled capture behind is the single worst
outcome here, because it produces a plausible finding that is wrong.

## Files you own

Create exactly two, both in this directory:

- `e2e/<slug>.spec.js` — your walker
- `<slug>.config.js` — your own Playwright config, so you can run in parallel with the
  other workers

Do not edit any file another worker owns. Do not edit `e2e/page-model.js`,
`README.md`, `playwright.config.js` or `e2e/canary.spec.js`.

## Your config

Copy `playwright.config.js` and change exactly two things: `PORT` (use the one assigned
in your task) and add `testMatch` so it runs only your spec. Everything else stays —
the settings encode gotchas that cost real time to find.

```js
testMatch: '**/<slug>.spec.js',
```

Each worker gets its own port, so each boots its own kit. That is deliberate: the kit's
dev server races journey/session state across concurrent requests, so workers must not
share one.

## Capturing

```js
const { capture } = require('./page-model')

await page.goto(`${BASE}${path}`)
const model = await capture(page, 'dr21-<screen-name>')
```

`BASE` is `/design-release-2.1`. Name captures `dr21-<screen>`, matching the view
filename where there is one (`dr21-consignment-details`, not `dr21-consignmentDetails`).
`capture()` writes the model, the raw HTML and a full-page PNG; the config adds a trace.

## Reuse the prototype's own helpers

The prototype ships helpers that drive its bespoke widgets — autocompletes, the MoJ date
picker, the commodity control. **Use them rather than re-deriving selectors.**

```js
const journeyHelpers = require('~/git/defra/defra-design/GB-notification-service/journey-demo/e2e/journey.js')
```

(Use the real absolute path in code — the tilde above is only to keep this doc portable.)

Exports: `JOURNEYS`, `fillOrigin`, `fillCommodity`, `fillReason`,
`fillConsignmentDetails`, `fillAnimalIdentification`, `fillAdditionalAnimalDetails`,
`fillArrivalDetails`, `fillTransitCountries`, `fillTransporter`, `fillUploadDocuments`,
`fillAddressSections`, `fillRolesAndAddresses`, `fillContactAddress`, `fillReview`,
`fillDeclaration`.

They were written for Design release 1 at root URLs. Where DR2.1 differs, wrap or
replace them locally in your spec — do **not** edit the prototype repo. See
`../prior/harness/e2e/dr2.spec.js` for how the DR2 walker did exactly this (e.g. its
`clickContinue` fallback, and prefixing `addressSections` hrefs with `BASE`).

## Gotchas that will bite you

- The kit compiles Sass on the **first request**, not at boot. Your first navigation
  absorbs ~15s. Do not shorten the timeouts.
- The MoJ date picker must be **Escape-dismissed** after filling, or its calendar
  overlays the next control.
- Not every DR2.1 page has the `action=continue` button group; some use a plain submit.
  Fall back to the button's accessible name.
- `/address-book*` is deliberately shared with DR1 and is **not** prefixed by the mount.
- Prefer role/label locators over CSS. Never add fixed waits — use auto-waiting
  assertions.

## Verify before you report

Run your config and iterate until green:

```
~/git/defra/defra-design/GB-notification-service/node_modules/.bin/playwright test --config <abs path to your config> --reporter=list
```

Then confirm your models actually landed in `capture/model/` and that each has a
non-empty `h1`. A green run that captured nothing is a failure.

If a screen genuinely cannot be reached — it needs state you cannot construct, or the
route 404s — **do not fake it and do not silently drop it.** Capture what you can and
report the screen as blocked, with the reason and what you tried.

## GUARD RAILS

- **The prototype repo `~/git/defra/defra-design/GB-notification-service` is READ-ONLY.**
  Read it freely; never write to it. It is the designers' repo.
- Bash: **one command per call.** No `&&`, no `;`, no `cd`. `env`, `node`, `bash` and
  `sh` are denied — you cannot set an env var inline, which is why ports live in configs.
- Use `~/` in Bash commands, never a literal `/Users/…` path. Use absolute paths for
  Read and Write.
- Do not run `sonar`, do not touch `docker/`, do not start or stop the workspace stack,
  do not run `git commit`.
- Do not install packages. `node_modules` here is a symlink to the prototype's install
  and already has everything.
