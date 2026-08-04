# pp-089 — numbers at rest, plus display formatting

This brief **OVERRIDES** the generic `implement.md`. **TWO REPOS**, both on `spike/trace-to-requirements`:
frontend clean at **`781f429c`**, tests repo clean at **`a1afc2a`**. Rollback is `git stash push -u`.
**Stage, do not commit. Never run `sonar`.**

⚠ **THE STACK AND THE TESTS REPO BOTH CHANGED IN THE LAST HOUR** — this is not the tree the earlier
increments ran against. Read the next section before you measure anything.

## What changed under you, and what it means for your baselines

1. **`NODE_OPTIONS=--network-family-autoselection-attempt-timeout=5000`** is now set on the frontend,
   admin, frontend-test and cdp-uploader containers. It mitigates a Docker-Desktop-plus-Node-24 race that
   was making ~2% of OIDC sign-ins fail with `AggregateError [ETIMEDOUT]`.
2. **The tests repo now reuses ONE signed-in session per worker** (`fixtures/auth-state.ts`), instead of
   signing in on every page-object `open()`. Sign-in callbacks fell from **90 → 16** on the plant lane.
3. **`signInWhenRequested` no longer probes with a 5 s timeout** — it reads the settled URL instead.
4. The frontend's sign-in failure page and Bell error render were fixed (`781f429c`).

**Consequences you must not misread:**
- ⚠ **Plant lane timings moved and the plant lane got ~5% SLOWER, deliberately** (53.8s → 56.5s): its
  tests open one page each, so they pay the per-worker sign-in without recovering probe time.
  **Do not treat that as a regression you caused.**
- ⚠ **Six plant specs now POLL the error summary instead of reading it with `evaluateAll` immediately
  after a click** — the probe used to pad the suite and hide a race. **The assertions themselves are
  unchanged. Do not "simplify" them back.**
- ⚠ Any residual `ETIMEDOUT` / `ERR_NETWORK_IO_SUSPENDED` failure is **environmental**, not yours.
  Rerun and say so; do not change code to chase it.

**Re-establish every baseline yourself and report it.** Do not quote mine forward — the last measured
frontend figures were plant unit **770**, `npm test` **2,415 / 8 skipped**, `test:live-animals` **559**,
`PORT=3201 test:features:plant-products` **264**, `lint:arch` 0 (681 modules, 2,184 dependencies),
shasum `0762285ef5bfdd1f06af6fbea491e5e69b53e19a` — **but the tests-repo lane numbers have all moved.**

## What this increment is

`PlantProductsAdditionalDetails.java:15-16` declares `totalGrossWeight` and `grossVolume` as
**BigDecimal**. The frontend writes them as **strings** — `additional-details/controller.test.js:213`
pins the controller writing the string `'12'`, and `to-dto.js:82` / `from-dto.js:68` pass the value
through unconverted in a plain field list.

**The divergence was invisible until pp-082 raised the test double's fidelity**, because both the stub
and the old merging fake preserve whatever JavaScript type they are handed — neither has a Java type
system to coerce through. **Seventh instance of a double standing in for a system whose behaviour it
does not reproduce.**

**User impact is real but small:** a user entering `2.50` sees `2.5` after a reload, and the
decimal-places validation operates on a value whose type depends on whether the page was reloaded.

## ✅ Sam's ruling — both halves are in scope

**NUMBERS AT REST, PLUS DISPLAY FORMATTING.**

- Store `totalGrossWeight` and `grossVolume` as **numbers**, matching what `commodity-bulk-details`
  already does for `numberOfPackages`, `quantity` and `netWeight`, and matching pp-041's canonical
  fixture which already stores them as JSON numbers. **The controller coerces on commit** rather than
  writing a string.
- ⚠ **THE FORMATTING HALF IS PART OF THIS INCREMENT, NOT A FOLLOW-UP.** The reason this surfaced is that
  `2.50` came back as `2.5` and the user watched it change on reload. **Storing a number without
  deciding how it RENDERS just moves the surprise.** Decide and pin the display format for a weight and
  a volume on the **check-answers and review** surfaces, and pin the round-trip of a **trailing-zero**
  value end to end.

## ⚠ CROSS-REPO — THE FRONTEND LADDER ALONE CANNOT SEE THIS

The tests repo pins the current round-trip **against the real backend**, which is the only place the
Java `BigDecimal` coercion actually happens. **A frontend-only change will look green and still be
wrong.** Find the tests-repo assertions that pin these two fields, and handle them in this session.
**The `:3100` target hot-reloads frontend source through a bind mount, so no container restart is
needed** — but if you believe one is, say so rather than doing it.

## Look wider before you finish

Sam's note: *"Consider whether the same string-vs-typed divergence affects any other numeric or date
field crossing this boundary — this was found in additionalDetails but nothing suggests it is confined
there."* **Audit the other numeric and date fields crossing `to-dto`/`from-dto` against their Java
declarations and REPORT what you find.** Fixing them is not necessarily this increment's job — **say
what you found and what you deliberately left**, and I will raise increments for the rest.

## The mutations I expect, by failing test NAME

1. **Write the value back as a string.** A named test must fail. If none does, the coercion is unpinned.
2. **Drop the display formatting** so a trailing zero renders bare. A named test must fail — otherwise
   the half of the ruling that exists *because the user saw a value change* is decorative.

Report each verdict honestly, **including an INERT result**.

## Constraints

- **Production code outside `sets/plant-products/` is off limits** — `ok:false` with evidence.
  **`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.**
- **L1 shape assertions: UPDATE, never WEAKEN.** `npm run format`; `lint`/`lint:arch` green; shasum
  unchanged. **Any count that moves must be explained.** Playwright: **`PORT=3201`**.
- ⚠ **Never invent data** — values come from the real fixtures, and report any disagreement between the
  tests-repo constants and the frontend fixture rather than silently preferring one (that drift is T-7).

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If something here contradicts the source, **stop
and report it rather than making the source match my brief.**
