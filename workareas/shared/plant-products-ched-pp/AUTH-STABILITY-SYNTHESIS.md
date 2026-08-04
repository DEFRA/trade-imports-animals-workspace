# SYNTHESIS — auth-stability change set

I re-verified the load-bearing claims against source and against the live `frontend-test` container log. Three planner claims are wrong, two contradict each other outright, and one interaction is a direct conflict on the same function. New runtime evidence below settles most of it.

---

## 0. NEW EVIDENCE — the frontend-test log settles four disputes

Dump used (read-only): `docker logs trade-imports-animals-trade-imports-animals-frontend-test-1` → `/private/tmp/claude-501/-Users-samfarrington-git-defra-trade-imports-animals/de55f342-54cb-421f-87b1-63c777acdbaa/scratchpad/fe-test-all.log`

| Counter (`grep -c`) | Count |
|---|---|
| `"url": "/auth/sign-in-oidc` | **8536** |
| `"statusCode": 500` | 648 |
| `AggregateError` | **234** |
| `ETIMEDOUT` | 182 |
| `Invalid key` | **348** |
| `No set context` | **64** |
| `oauth2/v2.0/token` (in any error trace) | **64** |
| `discovery/v2.0/keys` | **0** |
| `openid-configuration` | **0** |
| `Server started successfully` / `server started` | 196 (nodemon restarts) |

Container lifecycle: `Created 2026-08-03T20:28:19Z`, `StartedAt 2026-08-04T12:39:02Z`, `RestartCount 0`. Only **2** sign-in callbacks appear after 12:39 — no suite has run since the restart.

**E1 — the Happy Eyeballs diagnosis is confirmed at the stack-frame level.** Every `AggregateError` carries verbatim:
```
[21:42:29.295] ERROR (85): AggregateError [ETIMEDOUT]:
    at internalConnectMultiple (node:net:1134:18)
    at internalConnectMultiple (node:net:1210:5)
    at Timeout.internalConnectMultipleTimeout (node:net:1742:5)
    at listOnTimeout (node:internal/timers:607:11)
```
`internalConnectMultipleTimeout` **is** the `autoSelectFamilyAttemptTimeout` callback. This is not inference. 116 of the 234 have `"url": "/auth/sign-in-oidc"` within 12 lines; **2 have `"url": "/live-animals…"` or `"/plant-products…"`** — so the fault is *not* confined to sign-in, it is merely concentrated there (three fresh connects per callback vs pooled connects on app pages).

**E2 — Planner 3's "NEW FINDING" is confirmed at runtime, 64 times:**
```
bellError: { "data": { "code": "ETIMEDOUT", "trace": [ { "method": "POST",
  "url": "http://host.docker.internal:3007/dcidmtest.onmicrosoft.com/b2c_1a_cui_cpdev_signupsigninsfi/oauth2/v2.0/token" } ] … }
[21:42:30.498] ERROR (85): Error: No set context — no active set and more than one mounted
    at currentSetId (…/src/server/app/shared/set-context.js:20:11)
    at Object.current (…/src/server/app/shared/set-context.js:76:21)
    at journeyLayout (…/src/server/app/flow/journey-flow.js:34:42)
    at base (…/src/server/app/shared/kit.js:103:23)
```
The Bell-failure branch has been hit 64 times and 500'd 64 times. It has **never once rendered**.

**E3 — the three-calls split is now quantified.** The only outbound URL that appears in any error trace is the Bell token POST (64). The JWKS URL and the discovery URL appear **zero** times — `verifyToken`'s two calls throw a bare `AggregateError` with no Boom `trace` decoration, so they are the unlabelled remainder. Read: **~64 of ~180 sign-in ETIMEDOUTs are the Bell token POST (≈35%); the other ~65% are inside `verifyToken`.**

**E4 — `Invalid key` fires 348 times.** Planner 3's Edit 3 is not a theoretical hardening; it is the most frequently-firing defect in the log.

**E5 — I verified the template resolution myself.** `src/config/nunjucks/nunjucks.js:44` is `relativeTo: path.resolve(dirname, '../..')` (→ `src/`) with `path: ['server/app', 'server/app/sets']`; `find` returns the template at `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/auth/unauthorised.njk` only. `'auth/unauthorised'` is unresolvable. Planner 3 is right.

**E6 — `base()`'s `layout` key is dead data.** All 59 `.njk` files under `src/server/app` use a static `{% extends "shared/layout.njk" %}`; nothing reads a `layout` variable, and Vision's `layout` is an *options* key, not a *context* key. So `journeyLayout()` is being invoked purely to populate a value nobody consumes. Planner 3's fix (pass `layout: 'shared/layout.njk'`) is correct and matches `errors.js:35`, but note the value is inert — do not spend review time on which layout string is "right".

---

## 1. ⚠ PLANNER CLAIMS I BELIEVE ARE WRONG, AND WHERE TWO PLANNERS CONTRADICT

### C1 — Planner 1 vs Planner 3 on whether the tests-repo retry is live code. **Planner 3 is right.**

Planner 1 §2a:
> "So this retry has never once caught the failure being diagnosed. → **still necessary** (it covers a genuinely different transient), **not redundant**, **not harmful**."

Planner 3:
> "**NEW** — `h.view('auth/unauthorised')` cannot resolve the template at all — **CONFIRMED — a second, independent 500 on the same line**"

Verified (E2, E5): the branch throws at `base()` before `h.view` is even called, 64 times in this log. `base-page.ts:60-68` is **100% dead code today** — it has never fired for *any* transient. Planner 1's §2a premise ("it covers a genuinely different transient") is false, and it is the premise on which he declines to touch those lines. This matters because it means the current E2E flake rate contains **zero** benefit from the retry, so any "the retry already handles some of this" reasoning is unfounded.

### C2 — Planner 1's log-window arithmetic is wrong; his conclusion survives.

Planner 1 §0:
> "The 8536 figure is an **aggregate over every suite run since 12:39 today**"

`docker inspect` gives `Created 2026-08-03T20:28:19Z`, `StartedAt 2026-08-04T12:39:02Z`, `RestartCount 0`. `docker logs` survives a restart; it is truncated only on recreate. The window is **~16 hours from 2026-08-03 20:28**, not from 12:39 — and only **2** callbacks post-date 12:39, i.e. no suite has run since the restart. His *conclusion* (the 8536 denominator is cumulative and cannot be divided into runs) is right and, if anything, stronger.

**Consequence for the brief:** "171 HTTP 500s against 7735 successes (2.2%)" cannot be reproduced from this log and cannot be attributed to a single suite run. **Nobody should size or claim credit against "171 per run" until a clean baseline delta is taken (Step 0 below).** ⚠ I could not determine where the 171/7735 sample came from.

### C3 — Planner 1 and Planner 2 recommend *opposite* Node flags.

Planner 1 §8: "*pin `NODE_OPTIONS=--no-network-family-autoselection`*"
Planner 2 §3: "**Left open, and this is the reason I don't recommend it:** correctness becomes silently dependent on resolver ordering… turns a 2.2 % flake into a **100 % outage with no fallback**."

**Side with Planner 2.** Planner 1 mentions the flag only in passing in a "what this doesn't fix" list; Planner 2 measured both flags end-to-end inside the container and reasoned about the failure mode of each. Take `--network-family-autoselection-attempt-timeout=5000`.

### C4 — Planner 3's estimate of what Fix A buys is now measurable, and it is ~35%, not "roughly the Bell-token share" (unquantified).

Planner 3 §5: *"Expect the E2E flake to be reduced by roughly the Bell-token share, not eliminated."* — Correct. Quantified by E3: **64 of ~180**. The other ~65% land on the generic error page and stay unretried.

### C5 — the brief's own repo/branch premise is wrong.

The brief says *"All are on branch spike/trace-to-requirements except the workspace itself."* Measured:

| Repo | Actual branch |
|---|---|
| workspace `~/git/defra/trade-imports-animals` | `spike/trace-to-requirements` |
| `repos/trade-imports-animals-frontend` | `spike/trace-to-requirements` |
| `repos/trade-imports-animals-tests` | `spike/trace-to-requirements` |
| `repos/trade-imports-defra-id-stub` | **`main`** |

The workspace *is* on the spike branch; **the defra-id-stub is on `main`**. Planner 4's Edits B and C must not be committed onto `main` — CLAUDE.md rule 2 requires `fix/EUDPA-XXXX[-slug]`.

---

## 2. ⚠ INTERACTIONS THE PLANNERS COULD NOT SEE

### I1 — **Planner 1 §6.7 disables the retry that Planner 3 §4 exists to switch on.** Direct conflict, same function.

Planner 1 replaces the 5 s probe in `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-tests/page-objects/base/base-page.ts:50-58` with:
```ts
if (!signInPage.expectedUrl.test(this.page.url())) return;
```
`expectedUrl` is `/\/dcidmtest\.onmicrosoft\.com\/oauth2\/authresp$/` (`page-objects/auth/sign-in-page.ts:4`).

Trace the three cases:

| Case | Settled URL after `goto` | Planner 1 guard | Retry at :60-68 reachable? |
|---|---|---|---|
| Cold, no session | IdP authresp | falls through → `signIn()` | **yes** — and Planner 3's fix makes it fire |
| Warm, valid session (post-storageState) | app page | early return | no — but nothing failed |
| Warm, frontend session evicted, **stub cookie still valid** → silent SSO → callback ETIMEDOUTs | `/auth/sign-in-oidc` (error page) | **early return** | **no** |

Row 3 is the one that matters. Today's 5 s probe *also* returns without retrying in that case (`base-page.ts:56`), so §6.7 is not a regression — but the combined effect is: **once `storageState` lands, Planner 3's Fix A stops buying anything for E2E**, because the only sign-ins left are cold ones and silent-SSO re-auths, and the retry can never see the latter. Fix A's remaining value is a real production defect fix, not an E2E-stability fix. Say that out loud in the PR so nobody credits Fix A with a flake reduction it did not deliver.

**Answer to your question (a):** yes, the retry behaves differently, and yes, if sessions are reused the retry largely stops mattering.

### I2 — **`storageState` concentrates all auth risk into a single point of failure. The Node flag is therefore a PREREQUISITE, not an alternative.**

Neither Planner 1 nor Planner 2 saw this. Today, a 2.2% callback failure costs one flaky test. After `storageState`, the run makes ~2 sign-ins (the setup project) and **every test depends on them**. A setup failure fails the entire run. `retries: 1` from `shared-config.ts:17` covers it to ~0.1% — but the failure *shape* changes from "one red test" to "whole suite red for a reason that looks nothing like auth". Land the flag first.

### I3 — **The tests repo's grep-based lanes are structurally incompatible with a Playwright `setup` project.** This is the single biggest hole in Planner 1's plan.

Measured from `package.json`:
```
"_test_integration": "playwright test --config=playwright.integration.config.ts",
"test:integration": "npm run _reset_and_clean_and_test_integration -- --grep '@integration'",
"test:local": "npm run test:integration",
"test:cdp": "npm run _clean_and_test -- --grep-invert '@agent|@compose|@a11y|@integration|@cross-browser'",
"test:a11y":  "npm run _clean_and_test -- --grep '@a11y'",
```
`--grep` / `--grep-invert` filter **all** projects, including setup projects. Planner 1's setup tests are titled `'authenticate frontend'` / `'authenticate admin'` with no tags.

- `test:local` / `test:integration` (`--grep '@integration'`) → **setup filtered out → no state file written → every dependent test dies at context creation with ENOENT on the `storageState` path.** `test:local` is the standard invocation in this workspace.
- Tag the setup `@integration` to fix that, and `test:cdp`'s `--grep-invert '…|@integration|…'` then drops it instead.

**No tag set satisfies both lanes.** Do not use a setup project. Use one of:
1. **`globalSetup`** — a module, not a test; immune to `--grep` and `--project` filtering. Costs traces/retries on the sign-in itself.
2. A **worker-scoped fixture** in `fixtures/ui.ts` that signs in via `browser.newContext()` only when the state file is missing or stale, and hands `storageState` to the page fixture. More code, but it is self-healing and never leaves an ENOENT.

⚠ Separately: `npm test` → `_test_e2e` passes three explicit `--project=` flags. Playwright 1.61 does auto-include dependency projects under `--project` filtering, so that lane would be fine — but **verify with `playwright test --config=… --list` before trusting it**; do not verify by running the suite.

### I4 — **Attribution is solvable, because the three changes move three orthogonal log counters.**

**Answer to your question (b):** you do not have to serialise on the suite pass rate. Use these as the primary metrics, all deltas across one suite run on the frontend-test container log:

| Change | Primary metric | Must NOT move |
|---|---|---|
| Node flag | `grep -c AggregateError` → toward 0; the 257 ms response-time floor disappears | `sign-in-oidc` count |
| Planner 3 frontend fixes | `grep -c 'No set context'` → **0**, `grep -c 'Invalid key'` → **0** | `AggregateError` count (stays roughly constant) |
| `storageState` | `grep -c '"url": "/auth/sign-in-oidc'` → order of magnitude down | — |

The suite **pass rate** is the one metric all three move, so it can never be apportioned. Do not use it as the headline for any individual change.

### I5 — **`frontend` and `frontend-test` share one bind-mounted source tree.** You cannot A/B a frontend fix between :3000 and :3100.

`docker/stack/dev.compose.yml:10-11` and `:23-24` both mount `../../repos/trade-imports-animals-frontend/src:/home/node/src`. Editing the frontend repo changes both containers simultaneously, live. Corollary (good news, §3): **Planner 3's changes need no container recreate.** Corollary (bad news): edit atomically — a half-saved file is immediately live in both containers, and 196 nodemon restarts are already in this log.

### I6 — Planner 4's stub logging has been largely superseded.

Planner 4 §7 predicted the diagnostic signal would be an *absence* ("the connect never reaches the stub"). E1 shows we already have the *presence* signal client-side, at frame level, with the failing URL named (E2). The marginal value of turning stub logging on is now low, and it costs a stub recreate (which regenerates signing keys and invalidates live sessions — Planner 4 §7). **Downgrade Edit A to optional.** Planner 4's **Edit C (the `req.query` password / `id_token_hint` redaction hole) stands entirely on its own merits** and should be raised regardless of whether logging is ever turned up.

### I7 — Planner 2's mutation target is the E2E target.

Planner 2 §6 Step 3: *"Run the mutation on `:3100` so the mutated container is never the one a human is signing in to."* Correct that no human is on it — but `:3100` is exactly what `playwright.e2e.config.ts` and `playwright.integration.config.ts` point at. The mutation run will deliberately turn the suite red. That is the intent (you need load), but say so, or someone will treat the red as a regression.

---

## 3. ORDERED PLAN, GROUPED BY STACK DISTURBANCE

**Recreate accounting.** A container recreate is needed **only** for compose `environment` changes. Frontend/admin source edits hot-reload through the bind mount (I5). Tests-repo changes disturb nothing.

| Step | Change | Repo | Recreates | Lands alone? |
|---|---|---|---|---|
| **0** | none — baseline suite run | — | 0 | yes |
| **1** | `NODE_OPTIONS` on 4 services | workspace | **1** (frontend, frontend-test, admin, cdp-uploader) | **yes** |
| **2** | mutation control `=1` on frontend-test, then revert | workspace | **2** (frontend-test only, twice) | yes |
| **3** | frontend auth-page fixes | frontend | 0 (nodemon) | can pair with 4 |
| **4** | stub redaction + log default | defra-id-stub | 0 (repo-only PR) | can pair with 3 |
| **5** | `storageState` + probe fix | tests | 0 | **yes, last** |

### Step 0 — baseline (no change, no recreate)

The log is cumulative with no run marker, so absolute counts are meaningless. Snapshot all six counters, run the suite once, snapshot again. The **deltas** are the only baseline anyone may quote. This also produces the first defensible per-run callback count, replacing the unreproducible "7735/171".

### Step 1 — Node flag. **Lands alone. Highest value, smallest diff, one recreate.**

Take Planner 2's four edits verbatim — line numbers verified:
- `~/git/defra/trade-imports-animals/docker/stack/frontend.compose.yml` after `- PORT=3001` / `NODE_ENV` (admin, l.12-13), after `- PORT=3000` (frontend, l.46-47), after `- PORT=3100` (frontend-test, l.75-76)
- `~/git/defra/trade-imports-animals/docker/stack/infrastructure.compose.yml` after `NODE_ENV: development` (cdp-uploader, l.18-19), **quoted**, mapping style

Value: `--network-family-autoselection-attempt-timeout=5000` (C3).

⚠ `frontend-test` is `profiles: [test-target]` (verified, `frontend.compose.yml:69`) and is excluded from the default all-profiles run. **The re-run must pass `--profile test-target` or the flag never reaches the container the E2E suite targets.**

Verify Planner 2's way — `/proc/<pid>/environ` of the *server* process, not `docker exec node -p` (which inherits `NODE_OPTIONS` itself and proves nothing) — **for all four containers, before running anything.**

### Step 2 — the mutation. This is the only step that can *refute* the diagnosis.

`--network-family-autoselection-attempt-timeout=1` on frontend-test alone, recreate that one container, re-run. Expect `AggregateError` count to climb sharply and the response-time floor to move from ~257 ms to ~7 ms. If the floor does not track the flag, stop — the diagnosis is wrong and Steps 3-5 are being built on sand. Then revert (second single-container recreate).

### Steps 3 + 4 — safe to land together (orthogonal counters, zero recreates)

**Step 3, frontend repo**, Planner 3's Edits 1-3 as written. Two additions:
- His Edit 1 changes the view name to `'shared/unauthorised'` and Edit 2 `git mv`s the template into `src/server/app/shared/`. Both are inside the bind-mounted `src` tree, so they go live on nodemon restart. Confirmed there is exactly one reference to the view name.
- The `layout` argument is inert (E6). Keep it for consistency with `errors.js:35`, but the load-bearing part is that `??` short-circuits `journeyLayout()`.

**Step 4, defra-id-stub repo**: **branch off `main` first** (C5). Raise Edit C (redaction) and Edit B (log default) as one PR. Skip Edit A unless a stub-side trace is genuinely still wanted (I6); if you do take it, `LOG_LEVEL=info` **lowercase** — Planner 4's crash warning is real and `config.validate()` is never called.

### Step 5 — `storageState`. **Last, alone, and only after Step 1 is proven.**

Reasons for last, in order of force:
1. It collapses the sign-in denominator by ~10-20×, destroying the instrument that measures the Node flag (I4). Once it lands you can no longer demonstrate anything about ETIMEDOUT rates from a suite run.
2. It concentrates auth risk into a single point of failure (I2).
3. Its per-run benefit is unknown until Step 0 gives a real denominator (C2).

Rework required before it can be written:
- **Replace the setup project with `globalSetup` or a worker fixture (I3).** Planner 1's §6.3/§6.5 setup-project design is broken on `test:local`.
- Keep §6.4 (`with-project-base-urls.ts:41-46` guard) only if a named project is still added — with `globalSetup` it is unnecessary. Verified: `playwright.integration.config.ts` and `playwright.docker-compose.config.ts` pass `sharedConfig` straight into `withProjectBaseUrls`, so an unmapped project name **does** throw; `playwright.e2e.config.ts` uses `withServiceBaseUrls` and is unaffected; `playwright.cross-browser.config.ts` overrides `projects` wholesale and is unaffected.
- Keep §6.6's three opt-outs (`auth.spec.ts`, `admin-auth.spec.ts`, `co-residency.spec.ts`). ⚠ I did not independently verify the `co-residency.spec.ts:69` `/signout` shared-`sessionId` argument, but it is credible and cheap to honour.
- Keep §6.7 (the 5 s probe) but **reconcile it with I1** — guard on "URL is neither the IdP form nor a settled `/auth/sign-in-oidc`", or check the error heading before returning, so the retry Planner 3 just resurrected is not immediately re-buried.
- Keep §6.8 (`/playwright/.auth/` in `.gitignore`) — non-negotiable, the files hold live session cookies.
- ⚠ Planner 1's §6.2 flags his own vacuity risk correctly: asserting a bare `level: 1` heading passes on the unauthorised page too, silently writing an unauthenticated state file. Use the admin dashboard page object's own heading locator.

---

## 4. REPO / COMMIT MAP

| Commit | Repo | Path | Branch |
|---|---|---|---|
| 1 | **workspace** `~/git/defra/trade-imports-animals` | `docker/stack/frontend.compose.yml`, `docker/stack/infrastructure.compose.yml` | `spike/trace-to-requirements` (already checked out) |
| 2 | *(mutation — do not commit; local edit, reverted)* | same | — |
| 3 | **frontend** `repos/trade-imports-animals-frontend` | `src/server/auth/controller.js`, `git mv src/server/auth/unauthorised.njk → src/server/app/shared/unauthorised.njk`, `src/config/nunjucks/context/context.js`, + tests T1/T2/T3 | `spike/trace-to-requirements` |
| 4 | **defra-id-stub** `repos/trade-imports-defra-id-stub` | `src/config/config.js` (redact + level default) | ⚠ currently **`main`** — cut `fix/EUDPA-XXXX-stub-log-redaction` first |
| 5 | **tests** `repos/trade-imports-animals-tests` | `fixtures/`, `tests/setup/` or `globalSetup`, 3 spec opt-outs, `page-objects/base/base-page.ts`, `.gitignore`, possibly the 3 configs | `spike/trace-to-requirements` |

`docker/stack/dev.compose.yml` needs **no** change — it overrides `build`/`image`/`volumes`/`healthcheck` only, and compose merges `environment` additively. `docker/stack/shared.env` needs no change and must not be used (it would leak `NODE_OPTIONS` onto the Java services and does not reach `cdp-uploader` anyway). Nothing goes in `docker/stack/.staged/` — it is generated.

If Step 4 is ever wanted in the *running* stack, note it needs a published image; the local repo edit alone does nothing (`stubs.compose.yml:19` runs `defradigital/trade-imports-defra-id-stub:latest`).

---

## 5. ⚠ THE SINGLE MOST LIKELY WAY THIS GOES WRONG

**`NODE_OPTIONS` lands on `:3000`/`:3001`/`cdp-uploader` but not on `frontend-test` `:3100`, because the re-run omitted `--profile test-target`. The suite metric does not move, and someone concludes the Happy Eyeballs diagnosis is wrong and abandons the correct fix.**

`frontend-test` is the *only* container the E2E lanes talk to (`playwright.e2e.config.ts:7` → `:3100`, `playwright.integration.config.ts` → `:3100`) and it is the *only* one of the four behind a non-default profile.

**What catches it early, before any suite run:**
```
docker exec …frontend-test-1 ps -eo pid,args
docker exec …frontend-test-1 cat /proc/<server-pid>/environ > <scratch>/environ.txt
grep -a NODE_OPTIONS <scratch>/environ.txt
```
Do this for all four containers and refuse to run the suite until all four show the flag. Use `/proc/<pid>/environ`, never `docker exec … node -p` — a fresh `node` inherits `NODE_OPTIONS` from the exec and will happily report success on a server that never got it.

**Runner-up:** `run-stack.sh` in non-dev mode uses `up --pull always` (Planner 2 §5, l.198), so re-running it pulls newer `:latest` images for everything — an uncontrolled second change riding along with your one-line config edit. Record `docker inspect -f '{{.Image}}'` for all services before and after, or stay in `-d` mode where images are built from the pinned local source.

---

## 6. ⚠ WHAT CANNOT BE VERIFIED LOCALLY AT ALL

1. **That any of this matters in CDP or any deployed environment.** The entire mechanism depends on Docker Desktop's dual-stack `host.docker.internal` record. That name does not exist in CDP. **Steps 1 and 2 are dev-tooling only and buy production nothing.** Conversely, **Step 3's two frontend defects are real production bugs** (`base()` throwing on a server-wide route; `cache.get(undefined)` on every Bell-authenticated error render) and are the only part of this change set with deployed value. Do not let the compose fix's visibility eclipse that.
2. **The 171/7735 sample.** Not reproducible from this log (C2). Any "we cut failures by 99%" claim measured against it is unearned until Step 0 supplies a baseline delta.
3. **Whether the published `defradigital/trade-imports-defra-id-stub:latest` was built from the local repo source.** Planner 4's Edits B/C are written against local source; the running image may differ. His V4/V5 curls test the image, not the source — they are the only way to close this, and they were not run.
4. **The natively-run path (`run-stack.sh -e frontend`).** A compose env var reaches containers only. Planner 2 §7 reasons about it; he explicitly did not test it. Nor did I.
5. **Whether any Netty/Reactor client in the Java services implements its own happy-eyeballs.** Planner 2 §8 did not run a JVM probe; neither did I. The JVM's own `InetAddress` path is sequential and cannot exhibit this failure, and `getent ahosts` returns IPv4 first — but "no Netty resolver does this" is unverified.
6. **Whether Playwright 1.61 runs dependency projects under `--project` filtering in this exact config.** Assert with `--list`, not with a suite run.
7. **Anything requiring a test run.** Read-only brief: I ran no tests, started/recreated no containers, and changed no files. Every "expected" figure above is a prediction to be checked, not a result.
