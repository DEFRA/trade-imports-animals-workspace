## PLAN — Playwright `storageState` session reuse (tests repo)

Repo: `/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-tests`, branch `spike/trace-to-requirements`.

---

## 0. ⚠ Where the evidence contradicts the brief — read this first

**(a) "a full suite performed 7906 sign-in callbacks" does not reconcile with the repo.**

Measured, not inferred:

| Measurement | Value |
|---|---|
| `test(` call sites under `tests/**/*.spec.ts` | **334** |
| `"url": "/auth/sign-in-oidc` entries in the frontend test-target container log | **8536** |
| `"url": "/live-animals` entries in the same log | **90266** |
| Container `StartedAt` | `2026-08-04T12:39:02Z` (today) |

Commands used: `docker logs trade-imports-animals-trade-imports-animals-frontend-test-1 > <file> 2>&1`, then `grep -c '"url": "/auth/sign-in-oidc' <file>`.

The page-request : sign-in ratio is **10.6 : 1**, exactly the shape of *one sign-in per test context*. With 334 test call sites, a single full run should produce order **300–700** callbacks (tests + `retries: 1`), not 7906. The 8536 figure is an **aggregate over every suite run since 12:39 today** — the log has no run boundary, so a per-run figure cannot be extracted from it. I could not verify how many runs that spans.

Consequence for the brief: the direction of the fix is right, but **"~171 failures per suite" and "cut exposure by 99%"** rest on a denominator I cannot confirm. If the real per-run count is ~400, the expected per-run failures at 2.2% is ~9, not 171 — still worth fixing, but it is a flake-rate reduction, not an outage fix. Say this out loud before anyone sizes the work off 171.

**(b) The existing retry never protected against the failure you diagnosed.** See §2 — it targets a different, 200-status failure page.

**(c) A far larger, unrelated cost is sitting in the same function, and `storageState` makes it worse.** See §2.

---

## 1. How the suite is structured

**Five configs**, two different project-naming schemes:

| Config | Projects | Frontend base | Admin base |
|---|---|---|---|
| `playwright.config.ts` (CDP) | `frontend-live-animals-chromium`, `frontend-plant-products-chromium`, `admin-chromium` | `https://…-frontend.<env>.cdp-int.defra.cloud` | `https://…-admin.<env>.…` |
| `playwright.integration.config.ts` | same three (spreads `sharedConfig`) | `http://localhost:3100` | `http://localhost:3001` |
| `playwright.docker-compose.config.ts` | same three | `http://localhost:3000` | `http://localhost:3001` |
| `playwright.e2e.config.ts` ← **`npm test`** | `e2e-live-animals`, `e2e-plant-products`, `admin` (own array, does **not** spread `sharedConfig.projects`) | `http://localhost:3100` | `http://localhost:3001` |
| `playwright.cross-browser.config.ts` | `frontend-chromium/-firefox/-webkit` | `http://localhost:3100` | — |

`utils/playwright/shared-config.ts` supplies `testDir: './tests'`, `fullyParallel: true`, `retries: 1`, reporters, and the three chromium projects. **There is no `globalSetup`, no `storageState`, no auth fixture anywhere** — verified by `grep -rn "newContext\|storageState\|clearCookies"` which returns only three hits, none of them `storageState`.

`fixtures/ui.ts` is the only fixture surface (`fixtures/index.ts` just re-exports it). It builds page objects, flows and API clients off the built-in `page`/`request` fixtures. `fixtures/a11y.ts` extends it. **Neither touches auth.**

**Who calls `open()` with `attemptSignIn` defaulting to `true`:**
- `page-objects/base/base-page.ts:99` — `NotificationPage.open()`. Every journey page object in `page-objects/live-animals/` and `page-objects/plant-products/` inherits this (~50 classes via `factory.ts`).
- Four page objects override `open()` and call `signInWhenRequested` themselves: `live-animals/notification-dashboard-page.ts:211`, `plant-products/plant-notification-dashboard-page.ts:143`, `admin/admin-dashboard-page.ts:23`, `admin/admin-notifications-page.ts:77`, `admin/admin-dlq-events-page.ts:7`.
- `notification-dashboard-page.ts:215-226` and `admin-dashboard-page.ts:35` add a second sign-in attempt on top.

Only three call sites ever pass `false`, all via `flows/live-animals/journey.ts:19 toSignIn()`.

---

## 2. `base-page.ts:44-69` — what the hand-rolled retry actually does

```ts
44	  protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
45	    if (!attemptSignIn) return;
46	    const signInPage = new SignInPage(this.page);
47	    // Under concurrent load the auth stub can be slow; the caller may retry
...
50	    try {
51	      await signInPage.inputUserId.waitFor({
52	        state: 'visible',
53	        timeout: SIGN_IN_FORM_PROBE_MS,      // 5_000
54	      });
55	    } catch (error) {
56	      if (error instanceof errors.TimeoutError) return;
57	      throw error;
58	    }
59	    await signInPage.signIn();
60	    const transientError = this.page.getByRole('heading', {
61	      level: 1,
62	      name: 'Sorry, we are unable to sign you in.',
63	    });
64	    if (await transientError.isVisible()) {
65	      await this.page.getByRole('link', { name: 'try again' }).click();
```

Three findings, all verified against the frontend source:

**2a. The retry does not cover the ETIMEDOUT 500.** The heading it looks for is rendered by `repos/trade-imports-animals-frontend/src/server/auth/unauthorised.njk:6` (`<h1>Sorry, we are unable to sign you in.</h1>`, with the `try again` link on line 7 → `/auth/sign-in`). That view is returned by `authController.signinOidc` **only when `!request.auth.isAuthenticated`** (`src/server/auth/controller.js:19-33`) — a Bell state/nonce/token-exchange failure, HTTP 200. Your 500s come from further down the same handler: `await verifyToken(token)` (line 37) → `Wreck.get(jwks_uri)` (`src/auth/verify-token.js:11`) throws `AggregateError [ETIMEDOUT]`, which is unhandled and renders the generic error page — **no `try again` link, no matching h1**. So this retry has never once caught the failure being diagnosed. → **still necessary** (it covers a genuinely different transient), **not redundant**, **not harmful**.

**2b. The retry is racy.** `transientError.isVisible()` (line 64) does not auto-wait and runs immediately after `btnSignIn.click()` on line 59, before the callback navigation has settled. It will frequently evaluate against the pre-navigation DOM and return `false` even when the error page is about to render. Flag it; do not fix it in this change.

**2c. THE BIG ONE — the probe costs 5 s on every `open()` where no sign-in is needed, and `storageState` makes that *every* `open()`.** `waitFor({ timeout: 5000 })` on a locator that will never match burns the full 5 s and then returns via line 56. Today the first `open()` in a test signs in (fast) and every subsequent `open()` pays 5 s. `flows/live-animals/journey.ts` calls `overview.open()`, `originOfImport.open()`, `notificationView.open()` etc. inside almost every reach helper — so a typical test already burns 10–15 s here. **Introduce `storageState` without changing this and you convert the first `open()` of every test into another 5 s stall too, adding ~28 min of pure dead wait across 334 tests.** The `storageState` change is *net-negative on runtime* unless §5 lands with it.

---

## 3. Cookie topology — why one shared state file is wrong, and where it is *dangerously* wrong

Verified from source, not assumed:

| Cookie | Set by | Name | Domain in local lanes |
|---|---|---|---|
| Auth session pointer | `@hapi/cookie` default (`node_modules/@hapi/cookie/lib/index.js:33` → `'sid'`); frontend passes no `name` (`src/plugins/auth.js:92-98`) | `sid` | `localhost` |
| Yar session | `src/server/common/helpers/session-cache/session-cache.js:13` → `session.cache.name` → **`session`** | `session` | `localhost` |
| Defra-ID stub yar | `repos/trade-imports-defra-id-stub/src/plugins/session.js:7` → `cookie.name` default `trade-imports-defra-id-stub-session` | distinct — no collision | `localhost` |

**Cookies are not port-scoped.** In every local lane the frontend (`:3000`/`:3100`), admin (`:3001`) and the Defra-ID stub (`:3007` — confirmed from a captured redirect `location` in the container log) all sit on domain **`localhost`**. A `sid` written by one is sent to all of them.

Server-side, they do *not* share a store: `redis.keyPrefix` defaults to `trade-imports-animals-frontend:` (frontend `config.js:278`) vs `trade-imports-animals-admin:` (admin `config.js:284`). So a frontend `sid` presented to admin resolves to a cache **miss** → `isValid: false` → redirect to sign-in → admin signs in → **overwrites the shared `sid`**. Frontend `:3000` and `:3100` *do* share (same image, same prefix, same Redis, `SESSION_CACHE_ENGINE=redis` on both — `docker/stack/frontend.compose.yml:48,77`).

→ **Per-role state files are mandatory. Key them by role *and* base URL**, so the docker-compose lane (`:3000`) and integration/e2e lanes (`:3100`) and CDP never load each other's file.

**The stub's yar cookie will be captured in the saved state, and that is deliberate.** `repos/trade-imports-defra-id-stub/src/routes/auth.js:19-33`: if `yar.get(AUTHENTICATED)` is set and `prompt !== 'login'`, the authorize endpoint **skips the form entirely** and redirects to `/organisations`, which auto-completes for a single-org person (`auth.js:102-104`). CRN `2100010101` has exactly one org — `Gatwick Airport` / `5900001` (`repos/trade-imports-defra-id-stub/src/data/mock.json:4-13`) — so there is never a picker. Keeping that cookie makes any *mid-test* re-authentication silent and fast. It is also precisely why the auth specs must opt out (§4).

---

## 4. ⚠ Which specs must NOT reuse a session

**MUST opt out — whole file:**

1. **`tests/e2e/features/live-animals/auth.spec.ts`** — tests the form itself (lines 22-25), invalid user ID (33), invalid password (39), sign-out (45), re-open after sign-out (57), and unauthenticated deep entry (66-96). With the stub cookie restored, the form never renders and every one of these fails.
2. **`tests/e2e/features/admin/admin-auth.spec.ts`** — same set for admin (lines 8-49) plus the unauthenticated-entry describe at 51-66.

**MUST opt out — and this is the one that will bite you:**

3. **`tests/e2e/features/co-residency.spec.ts`**. It does **not** test sign-in and its `session`-cookie assertion (lines 51-52, exactly one yar `session` cookie at path `/`) survives restoration fine. But **line 69**:
   ```ts
   const signout = await page.request.get('/signout', { maxRedirects: 0 });
   ```
   `page.request` shares the context cookie jar. `/signout` (`frontend/src/server/signout/controller.js`) delegates straight to `authController.signoutOidc`, which calls `cache.drop(request.auth.credentials.sessionId)` (`controller.js:100-102`). Under a shared `storageState` **every parallel worker holds that same `sessionId`** — so this single line kills the shared session for the whole run mid-flight. Everything still *passes* (they silently re-sign-in), but the benefit evaporates non-deterministically and the run becomes unreproducible. Opt it out; it is the only remaining spec that signs out on a session it did not create.

**Does NOT need changing, but do not "helpfully" wire state into it:**

4. **`tests/e2e/features/plant-products/entry-guard-deep-link.spec.ts`** — this is the co-residency-style spec that deliberately exercises both sets. It builds its own contexts (`browser.newContext({ baseURL })`, lines 16-17) which **do not inherit project `storageState`**, and it calls `new SignInPage(plantPage).signIn()` unconditionally (lines 24, 28) with no form probe. It therefore *requires* two cold contexts. It is unaffected by this change and must stay that way. Leave a comment saying so.

**Degrades but does not break — call it out in the PR:**

5. **`tests/e2e/features/admin/admin-notifications.spec.ts:11-34`** (`finds and deletes a submitted notification by reference number`) runs under the `admin` project but calls `journey.submitNotification()`, driving the **frontend** in the same context (line 16) before `adminNavigation.toNotifications()` (line 19). Because `sid` is port-agnostic on `localhost`, the frontend sign-in overwrites the admin `sid`, and the admin nav then re-signs-in. This spec gets **zero** benefit from `storageState` and performs two live sign-ins either way. Do not try to fix it here.

---

## 5. Identity — verified, not assumed

Every sign-in in the suite uses the same default: `page-objects/auth/sign-in-page.ts:29-30`, `userId = '2100010101'`, `password = process.env.AUTH_PASSWORD ?? 'Password123'`. `grep -rn "userId\|2100010101"` across the repo shows the only overrides are the deliberately-invalid ones inside the two auth specs (`auth.spec.ts:34`, `admin-auth.spec.ts:20`, `:26`). That CRN maps to a single organisation, `Gatwick Airport`/`5900001`.

Separately, `grep -rn "organisationId\|userId\|contactId"` over `frontend/src/server/app/services/persistence/records/real/{http,projections}` returns **nothing** — the notification list request carries no user or org filter. So the list is org-wide *and* effectively unscoped, and sharing one identity changes nothing about what any test sees. **Sharing a session is safe on identity grounds.** (This is also the open security concern already on record — unchanged by this work.)

---

## 6. The changes

### 6.1 NEW `fixtures/auth-state.ts`

```ts
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export type AuthRole = 'frontend' | 'admin';

const AUTH_STATE_DIR = resolve(process.cwd(), 'playwright/.auth');

const slug = (baseUrl: string): string => baseUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-');

/**
 * Per-role, per-base-URL storage state. Both are load-bearing: the frontend and admin
 * apps share the `localhost` cookie domain (cookies ignore ports) but keep separate
 * Redis key prefixes, so one file for both would authenticate neither; and the
 * docker-compose (:3000), integration/e2e (:3100) and CDP lanes each mint sessions in a
 * different store.
 */
export function authStatePath(role: AuthRole, baseUrl: string): string {
  mkdirSync(AUTH_STATE_DIR, { recursive: true });
  return resolve(AUTH_STATE_DIR, `${role}-${slug(baseUrl)}.json`);
}
```

Add the alias to `tsconfig.json` — it already has `"@fixtures/*": ["fixtures/*"]`, so `@fixtures/auth-state` resolves with no change.

### 6.2 NEW `tests/setup/auth.setup.ts`

```ts
import { test as setup, expect } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';
import { SET_BASES } from '@page-objects/base/sets';
import { authStatePath } from '@fixtures/auth-state';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set; the auth setup project cannot sign in.`);
  return value;
};

setup('authenticate frontend', async ({ page }) => {
  const baseUrl = requireEnv('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
  await page.goto(`${baseUrl}${SET_BASES.liveAnimals}`);
  await new SignInPage(page).signIn();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.context().storageState({ path: authStatePath('frontend', baseUrl) });
});

setup('authenticate admin', async ({ page }) => {
  const baseUrl = requireEnv('TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL');
  await page.goto(baseUrl);
  await new SignInPage(page).signIn();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.context().storageState({ path: authStatePath('admin', baseUrl) });
});
```

Two separate `setup()` calls ⇒ two separate contexts ⇒ the two `sid` cookies never meet. Reads env vars rather than `baseURL`, so the one file serves all five configs. `retries: 1` from `shared-config.ts:17` covers a flaky setup sign-in.

⚠ Unverified: the exact `<h1>` on the admin landing page after sign-in. Before writing this, confirm against `page-objects/admin/admin-dashboard-page.ts` and use that page object's `heading` locator rather than a bare `level: 1` — a generic heading assertion would pass on the *unauthorised* page too, producing a silently-unauthenticated state file. **This is the vacuity risk in the setup itself.**

### 6.3 `utils/playwright/shared-config.ts` — add the setup project and wire dependencies

CURRENT (lines 25-29 and 65):
```ts
  projects: [
    {
      name: 'frontend-live-animals-chromium',
      // Set-neutral specs exercise both mounts and live at features/*.spec.ts.
      testMatch: [
```
```ts
  ],
});
```

PROPOSED — insert a setup project first, and add `dependencies` + `storageState` to each of the three:
```ts
  projects: [
    {
      name: 'setup',
      testDir: './tests/setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'frontend-live-animals-chromium',
      dependencies: ['setup'],
      // Set-neutral specs exercise both mounts and live at features/*.spec.ts.
      testMatch: [
```
and inside each project's `use`, after the viewport line:
```ts
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 1000 },
        storageState: authStatePath('frontend', process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL ?? ''),
      },
```
(`'admin'` + `TRADE_IMPORTS_ANIMALS_ADMIN_BASE_URL` for `admin-chromium`.)

⚠ **Ordering hazard.** `shared-config.ts` is imported *before* `withProjectBaseUrls()` runs, but `applyProjectBaseUrlEnvVars` (`with-project-base-urls.ts:37`) is what sets those env vars. Reading them at module-evaluation time yields `undefined` in the CDP/integration/docker-compose lanes. **Either** make `storageState` a function-free late binding by moving the assignment into `withProjectBaseUrls`, **or** set the env vars in `shared-config.ts` before the projects array. The `playwright.e2e.config.ts` lane is fine (its npm script exports both vars). This is the single most likely way to ship a change that appears to work and silently reuses nothing.

### 6.4 `utils/playwright/with-project-base-urls.ts` — stop it throwing on the setup project

CURRENT (lines 41-46):
```ts
    projects: baseConfig.projects.map((project) => {
      const baseURL = projectBaseUrls[project.name];
      if (!baseURL) {
        throw new Error(`No ${context} baseURL configured for project: ${project.name}`);
      }
```

PROPOSED:
```ts
    projects: baseConfig.projects.map((project) => {
      // The setup project drives both services off absolute env-var URLs and owns no baseURL.
      if (project.name === 'setup') return project;
      const baseURL = projectBaseUrls[project.name];
      if (!baseURL) {
        throw new Error(`No ${context} baseURL configured for project: ${project.name}`);
      }
```

Without this, **all three** of `playwright.config.ts`, `playwright.integration.config.ts` and `playwright.docker-compose.config.ts` fail to load.

### 6.5 `playwright.e2e.config.ts` — the `npm test` lane

CURRENT (lines 25-31):
```ts
    projects: [
      {
        name: 'e2e-live-animals',
        testDir: './tests/e2e',
        testMatch: ['**/live-animals/**/*.spec.ts', '**/tests/e2e/features/*.spec.ts'],
        use: { ...devices['Desktop Chrome'], viewport, baseURL: frontendUrl },
      },
```

PROPOSED:
```ts
    projects: [
      {
        name: 'setup',
        testDir: './tests/setup',
        testMatch: /auth\.setup\.ts/,
      },
      {
        name: 'e2e-live-animals',
        testDir: './tests/e2e',
        testMatch: ['**/live-animals/**/*.spec.ts', '**/tests/e2e/features/*.spec.ts'],
        dependencies: ['setup'],
        use: {
          ...devices['Desktop Chrome'],
          viewport,
          baseURL: frontendUrl,
          storageState: authStatePath('frontend', frontendUrl),
        },
      },
```
Same for `e2e-plant-products` (frontend) and `admin` (`authStatePath('admin', adminUrl)`).

**Leave `playwright.cross-browser.config.ts` alone** — three tests, and browser-specific *sign-in* regression is explicitly what that lane exists to catch (its own doc comment, lines 10-15).

### 6.6 The three opt-outs

`tests/e2e/features/live-animals/auth.spec.ts` — CURRENT lines 1-3:
```ts
import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

```
PROPOSED:
```ts
import { test, expect } from '@fixtures';
import { SET_BASES } from '@page-objects/base/sets';

// Signs in, signs out and enters unauthenticated by design — a reused session would
// skip the form (the Defra-ID stub auto-completes for an already-authenticated session).
test.use({ storageState: { cookies: [], origins: [] } });

```

`tests/e2e/features/admin/admin-auth.spec.ts` — identical insert after line 1.

`tests/e2e/features/co-residency.spec.ts` — insert after line 2:
```ts
// GET /signout drops the server-side session for whichever sessionId the context holds.
// On a shared storageState that is every parallel worker's session, so this spec runs cold.
test.use({ storageState: { cookies: [], origins: [] } });
```

Use the explicit empty-state object, not `storageState: undefined` — `undefined` inherits the project value.

### 6.7 `page-objects/base/base-page.ts:44-58` — make the probe free (see §2c; **not optional**)

CURRENT:
```ts
44	  protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
45	    if (!attemptSignIn) return;
46	    const signInPage = new SignInPage(this.page);
47	    // Under concurrent load the auth stub can be slow; the caller may retry
48	    // after a goto that landed directly on a post-auth page. Only sign in if
49	    // the sign-in form is actually present.
50	    try {
51	      await signInPage.inputUserId.waitFor({
52	        state: 'visible',
53	        timeout: SIGN_IN_FORM_PROBE_MS,
54	      });
55	    } catch (error) {
56	      if (error instanceof errors.TimeoutError) return;
57	      throw error;
58	    }
```

PROPOSED:
```ts
  protected async signInWhenRequested(attemptSignIn: boolean): Promise<void> {
    if (!attemptSignIn) return;
    const signInPage = new SignInPage(this.page);
    // The identity provider is a separate origin, so the settled post-goto URL is a
    // free, exact test for "is a sign-in actually needed". Probing for the form
    // instead costs SIGN_IN_FORM_PROBE_MS on every open() that is already signed in.
    if (!signInPage.expectedUrl.test(this.page.url())) return;
    await signInPage.inputUserId.waitFor({
      state: 'visible',
      timeout: SIGN_IN_FORM_PROBE_MS,
    });
```
`errors` then becomes an unused import on line 1 — drop it.

`SignInPage.expectedUrl` is `/\/dcidmtest\.onmicrosoft\.com\/oauth2\/authresp$/` (`sign-in-page.ts:4`). The anchored `$` is safe: `auth.spec.ts:23` and `admin-auth.spec.ts:9` already assert `toHaveURL(pages.signIn.expectedUrl)` against that exact settled URL, so it is known to match with no query string. All redirects in the chain are server 302s, which `page.goto()` follows before resolving.

⚠ Behaviour change: if a `goto` lands on the 500 error page, this returns immediately instead of after 5 s. Either way no sign-in happens and the caller's `heading.waitFor()` is what fails — but the failure now surfaces 5 s sooner and with a URL in the trace that names the real problem.

### 6.8 `.gitignore`

CURRENT (Playwright block):
```
/test-results/
/playwright-report/
/playwright/.cache/
/blob-report/
/.playwright-cli/
```
PROPOSED — add after `/playwright/.cache/`:
```
/playwright/.auth/
```
State files contain a live session cookie. Never commit them.

---

## 7. How to prove it worked

**The measurement** (frontend test-target container; adapt the name for other lanes):

```bash
docker logs trade-imports-animals-trade-imports-animals-frontend-test-1 > /tmp/fe-before.log 2>&1
grep -c '"url": "/auth/sign-in-oidc' /tmp/fe-before.log
# ... run the suite: npm test
docker logs trade-imports-animals-trade-imports-animals-frontend-test-1 > /tmp/fe-after.log 2>&1
grep -c '"url": "/auth/sign-in-oidc' /tmp/fe-after.log
```

The **delta** is the per-run callback count. Take a baseline delta on `main` (unchanged) and a delta on the branch, from the same `npm test` invocation. The log is cumulative and has no run marker, so **only the delta is meaningful** — do not read the absolute number.

**Expected:** baseline delta ≈ one per test context (334 tests + retries + the ~10 opted-out sign-ins). Post-change delta should collapse to roughly: 2 (setup) + the opted-out auth specs (~13 sign-ins across the two files) + `entry-guard-deep-link` (2) + `admin-notifications` cross-app thrash (~2 per affected test) + genuine mid-test re-auth. Call it **an order of magnitude down**, and state the observed numbers rather than a predicted percentage.

**Secondary, and the one that actually matters to the bug:** count the 500s.
```bash
grep -c 'AggregateError' /tmp/fe-after.log
```
⚠ Unverified — I did not confirm the exact string the frontend logs for the unhandled `verifyToken` rejection. Pin it from `/tmp/fe-before.log` first.

**Runtime:** wall-clock of `npm test` before vs after. §6.7 should dominate here; if wall-clock does not drop materially, §6.7 did not take effect.

### The mutation that proves the verification is not vacuous

The whole change can "pass" while authenticating nothing — the state file is written, restored, rejected server-side, and every test silently re-signs-in via `signInWhenRequested`. Green suite, zero benefit. Three mutations, run one at a time:

1. **Break the state file, expect the count to return to baseline.** Point `authStatePath` at a nonexistent filename for the frontend role. Playwright errors on a missing `storageState` path — so instead write `{"cookies":[],"origins":[]}` into the frontend state file *after* setup runs. The suite must still pass **and** the callback delta must climb back to the baseline figure. If the delta does not move, `storageState` was never being applied and the "improvement" you measured was noise.
2. **Prove the opt-outs are real.** Delete the `test.use({ storageState: … })` line from `live-animals/auth.spec.ts` and run just that file. It **must fail** — the stub's silent SSO means `pages.signIn.heading` never renders. A pass means the state file holds no stub cookie, i.e. the reuse is shallower than intended and the callback reduction is smaller than reported.
3. **Prove §6.7 is doing work, not just the state file.** Revert only `base-page.ts` and re-run. Wall-clock should jump by roughly 5 s × (number of `open()` calls across the suite). If it does not, the URL guard was never on the hot path and the runtime claim is wrong.

---

## 8. What this does NOT fix, and the risks

- **It does not fix the Happy Eyeballs bug.** Every remaining sign-in — setup, the opted-out auth specs, `entry-guard-deep-link`, the admin cross-app thrash, and every graceful re-auth after a dropped session — still makes the three `host.docker.internal` calls (Bell token POST, `getOidcConfig()` at `verify-token.js:9`, `Wreck.get(jwks_uri)` at `:11`) and is still exposed at 2.2%. This reduces the number of dice rolls; it does not change the die. The actual fixes (pin `NODE_OPTIONS=--no-network-family-autoselection`, or cache the discovery doc, or strip the AAAA record) are unaffected and still worth doing.
- **`getOidcConfig()` refetching uncached on every callback is untouched.** Worth its own ticket.
- **Shared-session fragility.** Every worker holds the same `sessionId`. Anything that drops it server-side poisons the run. §4.3 removes the only current offender; a future spec adding a sign-out on a reused session would silently reintroduce it. Consider a lint rule or a comment in `co-residency.spec.ts`.
- **TTL.** `session.cache.ttl` defaults to 4 h (`frontend/src/config/config.js:135-140`). A run longer than that degrades to re-signing-in, gracefully.
- **Stale state files across lanes.** Keyed by base URL, so lanes cannot cross-contaminate. A stale file whose session has been evicted from Redis degrades to re-sign-in — `setup` overwrites on every invocation, so staleness is bounded to one run.
- **CDP.** Untested here. The CDP lane has real hostnames per service, so the `localhost` port-collision problem disappears — but CDP runs multiple frontend replicas behind a load balancer. That is fine (shared Redis), but `test:cdp` also uses `--grep-invert` filters that may exclude the auth specs entirely; check that the opt-outs still make sense there before enabling `storageState` on `playwright.config.ts`. ⚠ I did not verify CDP replica or Redis topology.
- **`admin-notifications.spec.ts` gains nothing** and will look like a failure of the change if anyone measures per-project. Document it.
## PLAN — Node Happy Eyeballs mitigation in the workspace stack compose files

Everything below was verified against the live stack (all containers up, dev mode, 4 Aug). Where I could not verify something I say so.

---

## 1. Inventory: every Node service, and which actually talk to `host.docker.internal`

| Compose service | File | Node | dual-stack `host.docker.internal` in `/etc/hosts`? | Calls out to `host.docker.internal`? | Needs the fix |
|---|---|---|---|---|---|
| `trade-imports-animals-frontend` | `frontend.compose.yml` | 24.11.1 | **yes** (`192.168.65.254` + `fdc4:f303:9324::254`) | yes — backend :8085, reference-data :8086, operators :8089, OIDC :3007, plus `REDIS_HOST` and `MONGO_URI` from `shared.env` | **YES** |
| `trade-imports-animals-admin` | `frontend.compose.yml` | 24.11.1 | **yes** | yes — backend :8085, dynamics-gateway :8088, OIDC :3007, redis via `shared.env` | **YES** |
| `trade-imports-animals-frontend-test` | `frontend.compose.yml` | 24.11.1 | **yes** | same as frontend (`:3100`) | **YES** |
| `cdp-uploader` | `infrastructure.compose.yml` | **22.13.1** | **yes** | yes — `REDIS_HOST`, `S3_ENDPOINT`, `SQS_ENDPOINT`, `SQS_SCAN_RESULTS_CALLBACK` all on `host.docker.internal` | **YES — this one was missed** |
| `trade-imports-defra-id-stub` | `stubs.compose.yml` | 24.12.0 | **NO** — its `/etc/hosts` has no `host.docker.internal` entry at all (it is the only service with no `extra_hosts:` block) | no — no `host.docker.internal` in its env | no |

`cdp-uploader` is the addition to your known set. Verified directly:

```
$ docker exec trade-imports-animals-cdp-uploader-1 node -p "…"
{"v":"v22.13.1","as":true,"t":250}
```

Same defect surface: Happy Eyeballs on, 250 ms attempt timeout, dual-stack `host.docker.internal`, four outbound endpoints on that name. Happy Eyeballs has been on by default since Node 20, so 22.13.1 is in scope.

Non-Node services in the stack (`floci`, `floci-init` (aws-cli), `redis`, `mongodb`, `mssql`, `servicebus-emulator`, `toxiproxy`) are out of scope.

---

## 2. ⚠ Is `NODE_OPTIONS` already set anywhere? — **No. Nowhere.**

Checked four independent ways so an append-vs-replace mistake is not possible:

1. `grep -rn NODE_OPTIONS` over `docker/`, `scripts/`, `Makefile` → **no hits**.
2. `docker/stack/shared.env` (read in full, 21 lines) → not present.
3. Live `env` dump of all five Node containers (`frontend`, `frontend-test`, `admin`, `cdp-uploader`, `defra-id-stub`) → `NODE_ENV` and `NODE_VERSION` only; **no `NODE_OPTIONS` on any of them**.
4. `grep NODE_OPTIONS` in the frontend and admin `Dockerfile` and `package.json` → **no hits**.

**Conclusion: a plain assignment is safe on all four services.** No append syntax needed. (If that ever changes, the compose list form has no append operator — you would have to inline the full value.)

---

## 3. ⚠ Which flag — both exist in Node 24 and both are accepted via `NODE_OPTIONS`

Confirmed from `node --help` inside `trade-imports-animals-frontend-test-1` (Node 24.11.1):

```
183:  --network-family-autoselection-attempt-timeout=...
215:  --enable-network-family-autoselection, --no-network-family-autoselection
```

`NODE_OPTIONS` has an allowlist, so "the flag exists" is not enough — I tested both end-to-end. Both are accepted and both take effect:

```
$ docker exec -e NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000 …frontend-test-1 node -p …
{"as":true,"t":5000}

$ docker exec -e NODE_OPTIONS=--no-network-family-autoselection …frontend-test-1 node -p …
{"as":false,"t":250}
```

Also verified on Node 22 (`cdp-uploader`): `{"v":"v22.13.1","as":true,"t":5000}`. Neither flag will fail the container at boot.

### Recommendation: `--network-family-autoselection-attempt-timeout=5000`

Address ordering, measured inside the container:

```
$ node -p "dns.lookup('host.docker.internal',{all:true},…)"
[{"address":"192.168.65.254","family":4},{"address":"fdc4:f303:9324::254","family":6}]
```

IPv4 sorts first (RFC 6724 puts the `fc00::/7` ULA at precedence 3, below IPv4's 35).

**What each flag leaves open:**

- `--network-family-autoselection-attempt-timeout=5000` — IPv4 is still attempted first; the IPv6 attempt only starts 5 s later. Successful connects here take 13–38 ms, so in practice the IPv6 attempt is never started and the AggregateError path is never reachable. **Left open:** if IPv4 genuinely goes away, a connect now stalls ~5 s before falling back instead of ~250 ms — slow failure rather than fast failure. And it is a *widening*, not an elimination: a pathological >5 s IPv4 stall would reproduce the same bug.
- `--no-network-family-autoselection` — Node uses only the first resolved address, no fallback. Works today because IPv4 sorts first. **Left open, and this is the reason I don't recommend it:** correctness becomes silently dependent on resolver ordering. A Docker Desktop change, a base-image libc change (these images are Debian-based; an Alpine/musl rebuild sorts differently), or anything that flips the order turns a 2.2 % flake into a **100 % outage with no fallback**. It also disables a network-resilience feature for every other hostname the process ever talks to, not just `host.docker.internal`.

A tuning knob whose worst case is "slower" beats a kill switch whose worst case is "total, and order-dependent". Take the timeout.

---

## 4. Exact YAML edits

### `/Users/samfarrington/git/defra/trade-imports-animals/docker/stack/frontend.compose.yml`

**Edit 1 — `trade-imports-animals-admin`, insert after line 13.** Current lines 12–13:

```yaml
      - PORT=3001
      - NODE_ENV=development
```

Proposed:

```yaml
      - PORT=3001
      - NODE_ENV=development
      - NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000
```

**Edit 2 — `trade-imports-animals-frontend`, insert after line 47.** Current lines 46–47:

```yaml
      - PORT=3000
      - NODE_ENV=development
```

Proposed:

```yaml
      - PORT=3000
      - NODE_ENV=development
      - NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000
```

**Edit 3 — `trade-imports-animals-frontend-test`, insert after line 76.** Current lines 75–76:

```yaml
      - PORT=3100
      - NODE_ENV=development
```

Proposed:

```yaml
      - PORT=3100
      - NODE_ENV=development
      - NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000
```

(The three `- NODE_ENV=development` lines are byte-identical; anchor each edit on the preceding `PORT` line, which is unique.)

### `/Users/samfarrington/git/defra/trade-imports-animals/docker/stack/infrastructure.compose.yml`

**Edit 4 — `cdp-uploader`, insert after line 18.** This block is mapping style, not list style, and is alphabetically ordered — `NODE_OPTIONS` sorts between `NODE_ENV` and `PORT`, so the same insertion point keeps the ordering. Current lines 18–19:

```yaml
      NODE_ENV: development
      PORT: 7337
```

Proposed:

```yaml
      NODE_ENV: development
      NODE_OPTIONS: '--network-family-autoselection-attempt-timeout=5000'
      PORT: 7337
```

Quote the mapping-style value. A bare scalar beginning with `-` parses fine here (the sequence indicator requires `- ` with a space) but quoting removes the question. The list-style entries in `frontend.compose.yml` need no quoting — the whole `KEY=value` string is the scalar.

**No change needed to `dev.compose.yml`.** It overrides only `build`, `platform`, `image`, `volumes` and `healthcheck` for these services; compose merges `environment` additively, so the new var survives `run-stack.sh -d`. **No change to `shared.env`** — putting it there would leak `NODE_OPTIONS` onto the four Java services and the aws-cli init container (harmless but misleading), and `cdp-uploader` doesn't load `shared.env` anyway, so it wouldn't even cover the full set.

---

## 5. ⚠ Applying this requires recreating containers

Adding an env var changes the service config hash, so `docker compose up` **recreates** (not restarts) each of the four containers. Cost:

- **Sessions are lost on the frontend and admin.** Session state is in redis (`SESSION_CACHE_ENGINE=redis`, `REDIS_HOST=host.docker.internal`) and redis is *not* being recreated, so the session records survive — but the recreated app process gets a fresh in-memory OIDC/Bell state and every in-flight sign-in dies. Anyone mid-journey re-authenticates. Do it when nobody is mid-flow.
- **In-flight cdp-uploader scans die.** Recreating it drops any upload/scan in progress; those requests fail rather than resume.
- **In `--dev` mode the frontend/admin containers rebuild** (webpack) — that is the slow part, not the recreate.
- The stack is currently up (frontend/admin/backend etc. 16 h; mongodb and frontend-test 9 min).

Apply by re-running the wrapper with the same flags you originally used, e.g. `~/git/defra/trade-imports-animals/scripts/stack/run-stack.sh -d --profile … `. Compose recreates only the services whose config changed. Two caveats: (a) `frontend-test` is on the `test-target` profile, which is **excluded from the default all-profiles run** (`run-stack.sh:29-30`) — you must pass `--profile test-target` or its new env var is never applied; (b) in non-dev mode `run-stack.sh` uses `up --pull always` (line 198), so a re-run will also pull newer `:latest` images for everything — that is a second, unrelated change riding along. `restart-stack.sh` is a full stop-then-start; more disruptive, not needed here.

---

## 6. Verification, and the mutation that proves it isn't vacuous

**Step 1 — the env var reached the *running server process*, not just a fresh `docker exec` shell.** This distinction matters: `docker exec … node -p "net.getDefaultAutoSelectFamilyAttemptTimeout()"` spawns a *new* node that also inherits `NODE_OPTIONS`, so it proves nothing about the server. Read the real process env instead:

```
docker exec …frontend-1 ps -eo pid,args        # find the server node pid (may be a nodemon child in dev)
docker exec …frontend-1 cat /proc/<pid>/environ > <scratch>/environ.txt
grep -a NODE_OPTIONS <scratch>/environ.txt
```

Repeat for admin, frontend-test, cdp-uploader.

**Step 2 — behavioural.** Re-run whatever produced the 171/7735 sample, and check the `/auth/sign-in-oidc` outcomes for: zero HTTP 500s, zero `AggregateError [ETIMEDOUT]`, and — the sharper signal — **no responses in the 257 ms band at all**. The floor is the fingerprint; if 257 ms disappears and everything sits at 13–38 ms, the mechanism is confirmed dead.

**Step 3 — the mutation, and this is the important one.** On `frontend-test` (`:3100`) *only*, set the value to `--network-family-autoselection-attempt-timeout=1`, recreate that one container, and re-run the same load.

- If the diagnosis is right, the 500 rate should climb sharply (toward 100 %) and the hard floor should move from ~257 ms down to ~7 ms — it tracks the flag.
- **If the failure rate and the 257 ms floor do not move, the 250 ms timer is not the mechanism and the whole diagnosis is wrong.** A green run at 5000 with no mutation control is worth very little: a 2.2 % failure rate can vanish for a dozen unrelated reasons.

Run the mutation on `:3100` so the mutated container is never the one a human is signing in to.

---

## 7. ⚠ Services run natively (`run-stack.sh -e <service>`)

A compose env var applies only to the container. `run-stack.sh -e frontend` removes the frontend from `up_services` entirely (lines 94–116) and the developer runs it on the host — **that process gets none of this.**

What it means in practice:

- A natively-run frontend cannot use `host.docker.internal` at all — on macOS the host does not resolve that name (only containers get the Docker Desktop `/etc/hosts` injection; this is what `AGENTS.md` "no `/etc/hosts` edits required" is describing). The native config points at `localhost:*` instead.
- `localhost` on macOS is **also dual-stack** (`127.0.0.1` + `::1`), so Happy Eyeballs is still in play. The difference is that `::1` normally works, so the failure is unlikely rather than impossible. It becomes possible again if the target is a natively-run process bound only to `127.0.0.1`.
- ⚠ **I did not test the native path.** I am reasoning about it, not reporting a measurement.

Recommendation: a developer running the frontend natively should export the same flag in their shell / `.env` / IDE run configuration, and this should be written down next to the "Hostname rules" section of `docker/stack/AGENTS.md` (around line 174) so the compose fix and the native fix stay together. That is a follow-up doc change, deliberately not part of this edit.

---

## 8. Do the Java services need anything analogous? — Almost certainly not

Evidence gathered:

- The Java containers resolve the same dual-stack name — `docker exec …backend-1 getent ahosts host.docker.internal` returns `192.168.65.254` **first**, then `fdc4:f303:9324::254`. Same RFC 6724 ordering the Node resolver produced.
- The JVM has **no Happy Eyeballs**. `InetAddress.getAllByName` returns the addresses in resolver order and the standard connect paths try them **sequentially**, each with the full connect timeout — there is no 250 ms cancel-the-set race. The specific failure mode cannot occur.
- No `JAVA_TOOL_OPTIONS`, `JDK_JAVA_OPTIONS`, `JAVA_OPTS` or `preferIPv6Addresses` in the backend container's env, so nothing is flipping the JVM to IPv6-first.

⚠ **Honest limits:** I did not run a JVM probe. `jshell` is present in the backend container (`/usr/bin/jshell`, Corretto 25) — `InetAddress.getAllByName("host.docker.internal")` there would settle it in one line, and I'd take that before declaring Java clear. Also unverified: whether any Netty/Reactor-based client in these services implements its own happy-eyeballs resolver (Netty's `DnsAddressResolverGroup` has family-preference settings). If a Java service ever *did* start showing sub-second connect failures to `host.docker.internal`, that is where I'd look, and the mitigation would be `-Djava.net.preferIPv4Stack=true`, not `NODE_OPTIONS`.

---

## 9. Risks, trade-offs, and what this does **not** fix

- **It does not remove the unroutable IPv6 record.** It makes Node stop tripping over it. The record is still there, and a real IPv4 outage now costs 5 s per connect instead of 250 ms.
- **It does not fix the three-calls-per-callback problem.** `src/auth/verify-token.js:9` calls `getOidcConfig()` — an uncached refetch of the discovery doc on *every* token verification — and line 11 then fetches `jwks_uri`. Each sign-in makes three `host.docker.internal` round-trips where one would do. Widening the timeout lowers the per-call failure probability; caching the discovery doc would cut the *number of exposed calls* by two thirds. That is a change in the frontend repo, not the stack, and it is the more durable fix. Both are worth doing; neither substitutes for the other.
- **It is workspace-local.** These compose files are dev tooling. Nothing here protects CI, another developer's own compose, or a CDP-deployed environment. If the same class of failure can occur in a deployed environment, this plan does not address it — the app-side fix would.
- **`NODE_OPTIONS` is inherited by every child process** in the container — `nodemon`, webpack, npm scripts in dev mode. Harmless for this flag, but it is process-wide, not server-only.
- **It is a probabilistic mitigation presented as a fix.** The observed rate is 2.2 %. Even a well-targeted change can look successful across one test run by luck. Step 3's mutation control is what turns "the errors went away" into evidence.
- ⚠ **The precise abort mechanism is the weakest link in the chain.** For Node to raise `AggregateError`, *all* attempts in the set must fail — so a story where only the IPv6 attempt stalls does not, on its face, explain the IPv4 attempt also failing. The 257 ms hard floor is very strong evidence the 250 ms timer is involved, and undici 8.9.0's own `maybeNormalizeConnectError` (`node_modules/undici/lib/core/connect.js:153-176`) exists precisely to normalise this `AggregateError` shape. But whether widening the window *eliminates* the fault or merely makes it 20× rarer depends on that mechanism, and I could not confirm it from the compose layer. The mutation test in Step 3 is what distinguishes the two.
I read every cited file plus the surrounding machinery. Both claims hold — and there is a **third, independent break on the same line** that neither claim mentions.

---

# VERDICT

| Claim | Verdict |
|---|---|
| A — `base()` throws "No set context" on `/auth/sign-in-oidc` | **CONFIRMED** |
| A′ — tests-repo retry never fires | **CONFIRMED, with an important scope caveat** (see §5) |
| B — `cache.get(undefined)` throws "Invalid key" and masks the real error | **CONFIRMED**, with one correction to the wording (the real error *is* still logged) |
| **NEW** — `h.view('auth/unauthorised')` cannot resolve the template at all | **CONFIRMED — a second, independent 500 on the same line** |

---

## 1. FIX A — confirmed, quoted chain

`/Users/samfarrington/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend/src/server/auth/controller.js:29-32`
```js
        return h.view(
          'auth/unauthorised',
          base('Sorry, we are unable to sign you in')
        )
```
`base(...)` is an argument — it is evaluated **before** `h.view`, so it throws first.

`.../src/server/app/shared/kit.js:87-97` (`base` starts at 87):
```js
export const base = (
  title,
  { backLink, journey, journeyId = journey?.journeyId, recoverableError = false, layout } = {}
) => {
  const hasJourney = journeyId != null
  return {
    layout: layout ?? journeyLayout(),
```
With no `layout` option, `??` evaluates `journeyLayout()`.

`.../src/server/app/flow/journey-flow.js:34`:
```js
export const journeyLayout = () => store.current().layout
```
`store` is `setKeyed('journey flow')` — `.../src/server/app/shared/set-context.js:75-76`:
```js
    current: () => {
      const setId = currentSetId()
```
`.../src/server/app/shared/set-context.js:17-23`:
```js
export const currentSetId = () => {
  const id = storage.getStore()?.setId ?? soleSetId()
  if (!id) {
    throw new Error('No set context — no active set and more than one mounted')
  }
```

Two sets are **always** mounted — `.../src/server/router.js:22-27` registers both `liveAnimals` and `plantProducts` unconditionally; each calls `registerSetMount` (`routes-live-animals.js:56`, `routes-plant-products.js:53`). So `soleSetId()` is `undefined`.

`/auth/sign-in-oidc` is registered server-wide via plain `server.route` (`src/server/auth/index.js:7-23`) — no `routeWithSetContext`, and each set's `enterSetContext` ext is `{ sandbox: 'plugin' }` (`routes-plant-products.js:62`), so it does not apply. **No ALS store → throw.** Confirmed.

Corroborating evidence that this is the odd one out: the *only* two non-set importers of `kit.js` are this controller and `src/server/common/helpers/errors.js` — and `errors.js:35` already passes an explicit layout:
```js
      ...base(errorMessage, { layout: 'shared/layout.njk' }),
```
which short-circuits `??` and never calls `journeyLayout()`. The catch-all error page therefore works; the sign-in failure page is the single unprotected caller.

## 2. ⚠ NEW FINDING — the template is unreachable even if `base()` is fixed

`src/config/nunjucks/nunjucks.js:44` (Vision config):
```js
    relativeTo: path.resolve(dirname, '../..'),   // → src/
    path: ['server/app', 'server/app/sets'],
```
`@hapi/vision/lib/manager.js:322-343` resolves `relativeTo + path[i] + template` and throws `Boom.badImplementation('View file not found: ...')` when none stat as a file. So `'auth/unauthorised'` is searched at:
- `src/server/app/auth/unauthorised.njk` — **does not exist**
- `src/server/app/sets/auth/unauthorised.njk` — **does not exist**

The file is at `src/server/auth/unauthorised.njk` (verified: it is the *only* `.njk` outside `src/server/app` other than the two `service-header` component partials, which are loaded by the nunjucks environment searchpath, not by Vision).

This is a regression from the restructure. `git show 52602a62 -- src/config/nunjucks/nunjucks.js`:
```diff
-    path: ['server', 'server/obligation-based-app/obligation-sets'],
+    path: ['server/app', 'server/app/sets'],
```
`'server'` used to resolve it. The template itself was not moved in that commit. **Fixing `base()` alone leaves this route at 500.**

## 3. FIX B — confirmed, with a wording correction

`src/config/nunjucks/context/context.js:27-29`:
```js
  const authData = request.auth?.isAuthenticated
    ? await request.server.app.cache.get(request.auth.credentials.sessionId)
    : null
```
Bell's credentials shape is set in `src/plugins/auth.js:41-49` — `credentials.profile = { ...payload, crn, name, organisationId }`. `sessionId` comes from the JWT payload, i.e. it lives at `credentials.profile.sessionId`, which is exactly how `controller.js:50` and `:60` read it. There is no top-level `credentials.sessionId` on a Bell-authenticated request. (Under the **session** strategy there is, because `auth.js:126` returns `credentials: userSession` and `userSession` spreads `...profile` — `controller.js:50-56`.)

The throw is real. `@hapi/catbox/lib/policy.js:116-119` wraps a falsy key as `{ id: undefined, string: true }`, then `client.js:50-52` calls `validate`, and `client.js:105-111`:
```js
        const isValidKey = (key && typeof key.id === 'string' &&
                            key.segment && typeof key.segment === 'string');

        if (!isValidKey && key !== allow) {
            throw Boom.internal('Invalid key');
        }
```
No `generateFunc` is configured (`server.js:80-84`), so `policy.js:178-182` takes the `!this.rule.generateFunc` branch and `_send(key, report.error, ...)` **rejects** the pending promise. Confirmed: `await cache.get(undefined)` rejects.

**Correction to the premise:** the real `ETIMEDOUT` is *not* lost from the logs. `errors.js:29-31` logs `response.stack` **before** calling `h.view`, and `h.view`'s render happens later, in the marshal cycle. What is masked is the **response**: `@hapi/hapi/lib/transmit.js:29-33` catches the marshal failure and calls `internals.fail`, which replaces the styled error page with the Boom JSON body. So the user gets a bare `{"statusCode":500,"error":"Internal Server Error",...}` instead of the GOV.UK error page. Say "masks the rendered error page", not "masks the real error".

---

## 4. The plan

### Edit 1 — `src/server/auth/controller.js:29-32`

CURRENT
```js
        return h.view(
          'auth/unauthorised',
          base('Sorry, we are unable to sign you in')
        )
```
PROPOSED
```js
        return h.view(
          'shared/unauthorised',
          base('Sorry, we are unable to sign you in', {
            layout: 'shared/layout.njk'
          })
        )
```

### Edit 2 — move the template
`git mv src/server/auth/unauthorised.njk src/server/app/shared/unauthorised.njk` (no content change). Its `{% extends 'shared/layout.njk' %}` is resolved by the **nunjucks environment** searchpath (`nunjucks.js:16` → `src/server/app`), not by Vision, so the move does not affect it. Grep confirms exactly one reference to the view name, the line above.

### Edit 3 — `src/config/nunjucks/context/context.js:27-29`

CURRENT
```js
  const authData = request.auth?.isAuthenticated
    ? await request.server.app.cache.get(request.auth.credentials.sessionId)
    : null
```
PROPOSED
```js
  const sessionId =
    request.auth?.credentials?.sessionId ??
    request.auth?.credentials?.profile?.sessionId

  const authData =
    request.auth?.isAuthenticated && sessionId
      ? await request.server.app.cache.get(sessionId)
      : null
```
The `&& sessionId` guard is what removes the crash; the `profile.sessionId` fallback is what lets a Bell-authenticated render still show the signed-in header once the session has been written. The same defensive idiom already exists at `controller.js:79` and `:98` (`request.auth.credentials?.sessionId`) — `context.js` is the outlier.

### Why A1 over the alternatives

- **Explicit layout (chosen).** Byte-for-byte the pattern `errors.js:35` already uses and proves in production. `??` short-circuits, so `journeyLayout()` is never reached. Both sets define `LAYOUT = 'shared/layout.njk'` (`sets/live-animals/journeys/linear/config.js:2`, `sets/plant-products/.../config.js:3`), so the value is *identical* to what a set context would have produced — zero behavioural delta. And for this view the value is inert anyway: `unauthorised.njk` extends its layout statically. Do **not** import `LAYOUT` from a set — that would couple a server-wide auth route to one set.
- **Establish a set context.** Rejected: picks a set arbitrarily for a route that belongs to neither, and makes `currentSetId()` lie. Would also need `withSetContext` around a handler that later touches the session cache.
- **Make `currentSetId()` tolerant.** Rejected: the throw is a deliberate invariant with a whole test file guarding it (`no-set-singletons.test.js`); relaxing it silently degrades ~60 set-scoped call sites.
- **try/catch around `base()`.** Rejected: hides the defect and yields an untitled page.

**Single-set and active-set cases are unaffected** because `base()` itself is not touched. Passing `layout` only changes the branch taken *inside this one call*; every set-scoped caller still resolves `journeyLayout()` exactly as before.

---

## 5. ⚠ Scope: what this does NOT fix

- **Neither fix reduces the 2.2% `ETIMEDOUT` rate.** They change what the user and the E2E harness see when it fires. The IPv6/Happy-Eyeballs cause is untouched.
- **Only one of the three `host.docker.internal` calls reaches the retry-able page.** Bell's token POST failing → `@hapi/bell/lib/oauth.js:294` returns `h.unauthenticated(...)` → `mode: 'try'` → `isAuthenticated === false` → the fixed sign-in-failure page renders → the tests-repo retry at `base-page.ts:60-68` fires. But `getOidcConfig()` (`verify-token.js:9`) and `Wreck.get(jwks_uri)` (`verify-token.js:11`) fail **after** Bell has succeeded, inside the handler at `controller.js:37` — that path never reaches `h.view('shared/unauthorised')`. It lands on the generic `shared/error` page whose `<h1>` is `500`. **The retry will still not fire for those two.** Expect the E2E flake to be reduced by roughly the Bell-token share, not eliminated. If you want all three self-healing, that is a separate, explicitly-named change: wrap `verifyToken`/`getPermissions` in `controller.js` and route failures to the same view. Do not slip it in with these fixes.
- `base-page.ts:63-68` calls `transientError.isVisible()` with **no wait** immediately after `signIn()`. Even with the page rendering correctly, a slow callback can lose that race. Out of scope, but it caps how much these fixes buy you.
- The failure branch returns HTTP **200**. Arguably wrong, but changing it is a behaviour change the tests repo does not expect. Leave it; flagging only.

## 6. Blast radius on live-animals

| Change | Live-animals exposure | Confidence needed |
|---|---|---|
| `controller.js:29-32` | Shared auth route, both sets equally. Failure branch only; the success branch (`h.redirect`) is untouched. | Low risk. |
| Template move | One reference in the codebase (grepped). Nothing else loads it. | Low risk. |
| `context.js:27-29` | **Every rendered page in both sets.** This is the real exposure. | Highest. |

For `context.js`, today's session-strategy behaviour is provably unchanged: `credentials.sessionId` is always a string there (`controller.js:50-56` spreads `...profile` into the cached session; `auth.js:126` returns it as credentials), so the `??` fallback never fires and the `&& sessionId` guard never trips. The only behaviour that changes is on requests that previously **crashed**.

To be confident: full frontend vitest suite; then the tests-repo E2E for **both** sets (live-animals and plant-products) against a running stack — not just plant-products. A `context.js` regression would be service-wide and would not show up in a set-scoped unit test.

---

## 7. Tests, and the mutations that prove them

**T1 — sign-in failure page renders (covers Edits 1 + 2).** New file `src/server/auth/controller.test.js`, modelled on `src/server/common/helpers/errors.test.js:16-27` (`createServer()` + `server.inject`, with `vi.mock('../../auth/get-oidc-config.js')` → `mockOidcConfig`).
```
server.inject('/auth/sign-in-oidc?error=access_denied')
→ statusCode 200
→ body contains 'Sorry, we are unable to sign you in.</h1>'
→ body contains 'Sorry, we are unable to sign you in | Import notification service'
```
Mutations, each independently detected: (a) drop the `layout:` argument → `base()` throws → 500, no `<h1>`; (b) revert the template move / view name → `View file not found` → 500, no `<h1>`. The assertion pins *rendered output*, not a call.
⚠ Unverified by execution: that `?error=access_denied` lands in the handler rather than a 302. The code path says it does — `@hapi/bell/lib/oauth.js:160-164` bails to `h.unauthenticated` **before** the `!request.query.code` sign-in-initialisation branch at line 176 — but I did not run it. If it 302s, use `Bell.simulate()` (present at `@hapi/bell/lib/index.js:172`) or inject credentials directly.

**T2 — context tolerates Bell-shaped credentials (unit, covers Edit 3).** Add to `src/config/nunjucks/context/context.test.js`. Stub the cache so it **reproduces catbox's contract**, which is what makes the test non-vacuous:
```js
cache: { get: async (key) => {
  if (typeof key !== 'string') throw new Error('Invalid key')   // mirrors catbox client.js:105-111
  return key === 'S' ? { displayName: 'A B', email: 'a@b' } : null
} }
```
Call with `{ auth: { isAuthenticated: true, credentials: { profile: { sessionId: 'S' }, token: 't' } } }` → expect `userSession` `{ isAuthenticated: true, displayName: 'A B', email: 'a@b' }`.
Mutation: revert to `credentials.sessionId` → the stub receives `undefined` → throws → test fails. A stub that silently returns `null` for any key would make this vacuous; the `typeof` throw is the load-bearing part.
Second case: `credentials: { profile: {} }` → resolves with `{ isAuthenticated: false }`, no throw. Mutation: remove the `&& sessionId` guard → throws → fails.

**T3 — the mask itself (integration, covers Edit 3 end-to-end).** In `controller.test.js`, `vi.mock('../../auth/verify-token.js', () => ({ verifyToken: () => { throw new Error('ETIMEDOUT') } }))`, then inject `/auth/sign-in-oidc` with `auth: { strategy: 'defra-id', credentials: { profile: { sessionId: 'S' }, token: 't', refreshToken: 'r' } }` → expect 500 **and** `body` contains `'>500</h1>'` and `'Something went wrong | Import notification service'`.
Mutation: revert `context.js` → the marshal fails, `transmit.js:29-33` swaps in the Boom JSON body → `'>500</h1>'` absent → fails. This is the only test that pins *what the user actually receives* on the real timeout path.
⚠ Unverified: whether hapi's `inject({ auth: { strategy: 'defra-id' } })` is accepted on a route configured `{ strategy: 'defra-id', mode: 'try' }`. The `strategy: 'session'` form is used at `router.test.js:14-17` and `co-residency.test.js:577-580`; I did not confirm the `defra-id` variant. Fall back to `Bell.simulate()` if it is rejected.

**Optional T4 — regression fence.** `src/server/app/no-set-singletons.test.js` already has a `describe('server-wide routes')` block (line ~398) with a live server. A test that every server-wide route in `server.table()` renders without a set context would stop this whole class recurring. Useful, but T1 covers the actual defect.

---

## 8. What I could not verify

- I ran no tests and started no stack (read-only brief). Every mechanism above is traced through source in `node_modules` (catbox `client.js`/`policy.js`, vision `manager.js`, hapi `transmit.js`/`request.js`, bell `oauth.js`), not observed at runtime.
- The two `⚠` test-harness assumptions in §7.
- I did not verify the runtime claims you supplied (Node 24.11.1, `autoSelectFamily=true`, the 257 ms floor, the dual-stack `/etc/hosts`). I took those as given and reasoned only about the frontend error paths.
- Minor: the prompt cites `journey-flow.js:34` as calling `currentSetId()`. Line 34 is `journeyLayout`, which calls `store.current()`; `currentSetId()` is called one hop further on at `set-context.js:76`. Same chain, one extra frame.
# Plan — make the Defra ID stub log

## 1. CONFIRMED: the log-level claim

**`repos/trade-imports-defra-id-stub/src/config/config.js:86-91`**
```js
    level: {
      doc: 'Logging level',
      format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'warn',
      env: 'LOG_LEVEL'
    },
```

**`src/common/helpers/logging/logger-options.js:19-27`** feeds that straight into pino:
```js
export const loggerOptions = {
  enabled: logConfig.enabled,
  ignorePaths: ['/health'],
  redact: { paths: logConfig.redact, remove: true },
  level: logConfig.level,
```
…and `request-logger.js:4-7` hands the same object to `hapi-pino`.

Everything the stub emits is at `info`:
- request completion — `node_modules/hapi-pino/index.js:182` `request.logger.info({... res, responseTime}, '[response] ...')`
- server start/stop — `hapi-pino/index.js:198`, `:202`
- `src/common/helpers/start-server.js:12-13,18` `server.logger.info('Server started successfully')`

`warn` suppresses all of it. There is no `error`-level path on a healthy stub, so the container is silent by construction. **Claim confirmed.**

Contrast: the frontend's `src/config/config.js:91` defaults to `'info'`; `docker/stack/stubs.compose.yml:37` sets `LOG_LEVEL=INFO` for the sibling `trade-imports-stub`. The defra-id-stub is the only service with neither.

---

## 2. 🚨 SECURITY — read this before anything else

Redaction is **on**, but it has **two holes**, and one of them is a plaintext password.

### What I verified

`docker inspect` of the running container returns `NODE_ENV=production`. That matters, because redaction is gated on it (`config.js:98-104`):
```js
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
```
So in the running stack the three paths **are** active with `remove: true`.

I checked the one thing that could have made that a paper guarantee: hapi-pino binds `req` as a **child binding** (`hapi-pino/index.js:90` — `getChildBindings = (request) => ({ req: request })`), and pino bakes child bindings into a string at child-creation time. Redaction still applies — `pino/lib/tools.js:221-222` runs the serializer *then* the redaction stringifier:
```js
value = serializers[key] ? serializers[key](value) : value
value = (stringifiers[key] || wildcardStringifier || stringify)(value, stringifySafe)
```
So `req.headers.cookie` and `req.headers.authorization` really are removed, and `res.headers` removes the **whole** response-header object — which kills both `set-cookie` and the `Location: <redirect_uri>?code=…&state=…` emitted by `src/routes/auth.js:183`. **The authorization code is not logged.** Good.

Request **payloads** are not logged either: `hapi-pino/index.js:184` gates on `options.logPayload`, which is never set. So the sign-in password (`POST /…/authresp`) and the `client_secret` + `code` (`POST /…/token`) stay out. Good.

### The holes: `req.query` is NOT redacted

`pino-std-serializers/lib/req.js:80-81` logs the full parsed query object, and no redact path covers it.

**Hole 1 — plaintext password.** `src/routes/open-id.js:41-42` accepts credentials on the authorize URL:
```js
        crn: Joi.string(),
        password: Joi.string()
```
gated by `allowLoginQueryParams`, which **defaults to `true`** (`config.js:286-291`). Anyone hitting `/…/authorize?crn=2100010101&password=Password123` writes that password to the log in clear.

⚠ The E2E suite does **not** do this — `repos/trade-imports-animals-tests/page-objects/auth/sign-in-page.ts:28-40` fills the form and POSTs. So turning logging on does not, today, leak the suite's password. It is a live footgun, not an active breach.

**Hole 2 — full ID token.** `src/routes/open-id.js:103` takes the ID token as a query param on sign-out:
```js
        id_token_hint: Joi.string(),
```
Any sign-out flow logs a complete, signed JWT.

Lower severity: `state` and `nonce` also land in `req.query` (single-use, low value).

### Verdict

**Turning on `info` today does not leak passwords, codes, tokens or cookies for the E2E suite.** But it is one query-param sign-in or one sign-out away from doing so, and if `NODE_ENV` is ever not `production` (the `development` image stage, a local `npm start`) the redact list collapses to `[]` and cookies *and* the authorization code both start logging. **The redact list must be fixed as part of this work — see Edit C.**

---

## 3. The two changes — both, not either

They are not alternatives.

| | (a) compose env var | (b) repo default |
|---|---|---|
| Effect on running stack | Immediate | None — stack runs `defradigital/trade-imports-defra-id-stub:latest` (`stubs.compose.yml:19`), not local source |
| Effect on next person | None — still lands on a silent `warn` | Fixes it permanently |
| Needs an image publish | No | Yes |

**Recommendation: do (a) now to unblock diagnosis, raise (b) + Edit C as a PR on the stub repo.** Doing only (a) leaves the silent default and both `req.query` holes in place.

---

## 4. Exact edits

### Edit A — immediate, works against the published image

**`~/git/defra/trade-imports-animals/docker/stack/stubs.compose.yml:4-8`**

Current:
```yaml
    environment:
      - PORT=3007
      - AUTH_PASSWORD=${AUTH_PASSWORD:-Password123}
      - SECURE_COOKIE=false
      - WELL_KNOWN_HOST_OVERRIDE=http://localhost:3007
```

Proposed — append two lines after `:8`:
```yaml
      - LOG_LEVEL=info
      - LOG_FORMAT=pino-pretty
```

🚨 **`info` must be lowercase — do NOT copy `LOG_LEVEL=INFO` from line 37.** Line 37 is the Java Spring stub, where uppercase is correct. Here it would **crash the stub at boot**: `config.validate()` is never called anywhere in the repo (grepped `src/`), so convict passes the raw `'INFO'` through its enum unchecked, straight into pino, which throws at `pino/lib/levels.js:83` — `throw Error('unknown level ' + level)`.

`LOG_FORMAT=pino-pretty` is optional but worth it: `NODE_ENV=production` makes `config.js:95` select `ecs`, i.e. dense single-line JSON. `pino-pretty` is a **runtime** dependency (`package.json`, `dependencies`), so it is present in the production image. It does **not** affect redaction — that is keyed off `isProduction`, not the format.

### Edit B — durable default

**`repos/trade-imports-defra-id-stub/src/config/config.js:89`**

Current: `      default: 'warn',` → Proposed: `      default: 'info',`

### Edit C — 🚨 required security fix, same PR

**`repos/trade-imports-defra-id-stub/src/config/config.js:98-104`**

Current:
```js
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: isProduction
        ? ['req.headers.authorization', 'req.headers.cookie', 'res.headers']
        : []
    }
```

Proposed — close the query holes and drop the `isProduction` gate so dev/test runs are covered too:
```js
    redact: {
      doc: 'Log paths to redact',
      format: Array,
      default: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.query.password',
        'req.query.crn',
        'req.query.id_token_hint',
        'res.headers'
      ]
    }
```

Trade-off, stated plainly: keeping `res.headers` wholesale-removed costs you `Location` in the logs, which is otherwise useful for tracing OIDC redirects. Narrowing to `res.headers["set-cookie"]` would restore it — but `Location` is exactly where the authorization code lives (`auth.js:183`). **Keep it removed.** You do not need it for this diagnosis.

---

## 5. ⚠ Volume

Sign-in flow, per callback: browser hits `/…/authorize` → `/…/authresp` (GET, then POST) → `/organisations`; frontend server-side hits `/token`, `/.well-known/openid-configuration`, `/…/discovery/v2.0/keys`. Plus static assets — `/public/{param*}` is served by `serve-static-files.js:34` and **is** logged (only `/health` is in `ignorePaths`, so the 10s healthcheck stays silent).

≈10 lines per sign-in. Against the ~7735 successful callbacks in your dataset that is **~75-80k lines, order of 100 MB** of ECS JSON per full suite run (each line carries the full request header set). `stubs.compose.yml` sets no `logging:` block, so that is one unrotated json-file.

**Acceptable for a diagnostic run — this is the right setting, don't narrow it.** `info` is the *only* level that gives you the per-request line you need. If you want a bound, add to the stub service:
```yaml
    logging:
      driver: json-file
      options: { max-size: "200m", max-file: "3" }
```
⚠ but rotation discards the *oldest* lines, and a suite run is long — you could lose the start of the run. My advice: leave it unbounded for the diagnostic run and `docker logs > file` once, then revert Edit A.

---

## 6. Verification, and the mutations that prove it isn't vacuous

**V1 — it logs at all.** Recreate the stub, then `docker logs trade-imports-animals-trade-imports-defra-id-stub-1`. Expect `Server started successfully` (`start-server.js:12`) and hapi-pino's `server started` (`index.js:198`).

**V2 — requests log.** `curl -s -o /dev/null http://localhost:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration`, then `docker logs --since 30s`. Expect one `[response] get /idphub/… 200 (Nms)`.

**V3 — mutation proving the env var is what did it.** Set `LOG_LEVEL=warn` back, recreate, repeat V2. The line must **disappear**. If it still logs, the env var never reached the app and V2 proved nothing. Second, cheaper mutation: `curl http://localhost:3007/health` must produce **no** line (`ignorePaths`) — if health lines appear, `loggerOptions` is not the config in play.

**V4 — 🚨 the security proof. Do not skip this; it is the one claim I derived from source rather than observed.**
```
curl -s -o /dev/null -H 'Cookie: sess=CANARYCOOKIE' -H 'Authorization: Bearer CANARYAUTH' -H 'X-Probe: CANARYPROBE' http://localhost:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
```
Then `docker logs --since 30s`. Required result: **`CANARYCOOKIE` and `CANARYAUTH` absent, `CANARYPROBE` present.**
The `X-Probe` header is the mutation — it is *not* on the redact list, so it must show. If all three are absent your grep or your `--since` is wrong, not the redaction, and you have proved nothing.

**V5 — demonstrates the gap Edit C closes.**
```
curl -s -o /dev/null 'http://localhost:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/signout?id_token_hint=CANARYTOKEN'
```
Before Edit C: `CANARYTOKEN` **appears** in the log. After Edit C ships: it must not.

---

## 7. Risks and what this does NOT fix

- **🚨 It does not touch the ETIMEDOUT root cause.** Pure observability.
- **⚠ The diagnostic signal you are looking for is an ABSENCE, and you must expect that.** A connect aborted by Happy Eyeballs at 250ms **never reaches the stub** — there is no socket, no request, no log line. For the ~171 failing callbacks the stub will show the discovery / JWKS / token call simply **missing**, not erroring. Do not read "no errors in the stub log" as "the change didn't work" or "the stub is fine" — the missing line *is* the evidence, and it corroborates the client-side diagnosis rather than contradicting it.
- **⚠ Recreating the container regenerates the signing keys.** `keysDirectory` defaults to `/home/node/keys` (`config.js:255`) and `stubs.compose.yml` mounts **no volume** for the stub; `src/auth/keys.js:13-33` reads-or-generates. Adding an env var forces a recreate, not a restart, so existing frontend sessions and any cached JWKS break — sign in again. A plain `docker restart` would preserve keys but would not pick up the new env var.
- Uppercase `INFO` crashes the stub (see Edit A). This is the most likely way to get this wrong.
- Log volume as above; revert Edit A when done.

## 8. Could not verify

- I did **not** run anything against the stack, restart any container, or execute the curls above — all read-only, per the brief. `NODE_ENV=production` and the container env are from `docker inspect` (observed); everything about redaction behaviour is derived from reading `pino`/`hapi-pino`/`pino-std-serializers` source in the repo's own `node_modules`. **V4 is what turns that from inference into fact — run it.**
- The running container is `defradigital/trade-imports-defra-id-stub:latest`, and I read the **local repo** source. I did not confirm the published image was built from this commit. If the image is older, line numbers in Edits B/C still apply to the repo (which is what you'd change), but the *runtime* behaviour — including whether `allowLoginQueryParams` and the redact list match — could differ. V4 and V5 test the image, not the source, which is another reason to run them.
- The ~10-lines-per-sign-in figure is a reasoned estimate from the route list, not a measurement; static-asset count depends on Playwright's per-context cache behaviour.
