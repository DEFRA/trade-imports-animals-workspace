> **Provenance.** Read-only design (2026-07-29) of a fresh testing approach for `trade-imports-animals-tests`
> after the promotion gutted it (see `tests-repo-forensics.md`). Grounded against both repos + the stack.
> Corrects the forensics' "restore all 44" recommendation. Nothing implemented. Two infra findings
> orchestrator-verified: `LIVE_ANIMALS_MODE=real` is set nowhere in committed `docker/stack`/`scripts/stack`
> (grep empty); the `test:local` script has drifted out of the tests-repo package.json.

# Fresh testing approach — trade-imports-animals-tests after the EUDPA-288 promotion

## 0. What the evidence actually shows (grounding)

- **The frontend canned suite is comprehensive and healthy.** `repos/trade-imports-animals-frontend/e2e/live-animals.spec.js` is ~3,100 lines / **38 tests** + a no-JS describe, plus `e2e/a11y.spec.js` (3 axe tests, ~12 page states). It walks the entire journey — dashboard, import-type filter, linear run, hub, origin (+autocomplete), commodities (batch search, per-species counts, add/remove), animal identification (typed vs free-text, N-of-M), import reason/purpose, additional details, **all address roles via the generic party picker**, arrival/transport, port-of-entry autocomplete, transit countries, transporters (commercial + private), contact, CPH, documents (file-type/oversize/virus/removal/view/scan-poll/no-JS 413), check-and-submit, **declaration → submit → confirmation**, read-only submitted view, and **dashboard copy/delete/amend/cancel-amend**. Runs **stub mode** via its own Playwright `webServer` — **no docker stack**.
- **The responsibility matrix is real** (`src/server/live-animals/docs/test-responsibility-matrix.md`): frontend-canned owns routes/validation/gating/lifecycle-UI/documents/dashboard/a11y; tests-repo owns real Defra ID + session, cross-browser, deployed a11y smoke; backend owns persistence/lifecycle invariants.
- **The 5 added specs are thin integration** (`promoted-*`, all `@compose`/`@integration`).
- **Two infra findings the forensics missed (both orchestrator-verified):**
  1. `LIVE_ANIMALS_MODE=real` is **set nowhere** in `docker/stack/`/`scripts/stack/` (grep empty). The stack frontend runs default **stub** mode — so the `@compose` "real mode" specs' core premise is **not delivered by the stack today**, a large part of why they're brittle/red.
  2. `docker/stack/AGENTS.md` + memory reference `npm run test:local`, but the tests-repo `package.json` has **no such script** — the standard-runner contract drifted during the takeover.

**Decisive fact:** ~35 of the 44 deleted specs are **already covered by the frontend canned suite**. Restoring them to the tests repo would duplicate the matrix's frontend-canned owner. Only **~6 genuinely re-home to the tests repo**.

## 1. Verdict on the strategy

**Rip-and-redesign — do NOT restore-and-re-port the 44.** The forensics' "restore all 44" predates the ownership analysis and is wrong (it would rebuild the frontend canned suite inside the tests repo). But the takeover's own framing was also wrong (5 happy-path smokes ≠ equivalent replacement; two real defects hidden as expected-failures).

Correct model is **programme-level, not repo-level**: the deterministic journey safety net now legitimately lives in the **frontend** repo (stub-mode canned suite, no stack). The tests repo should be rebuilt as a **pure integration suite** covering only the matrix's seams — genuinely thin (~6 specs + hardening survivors).

**Keep (confirmed good, reuse):** all `page-objects/*`, `flows/{journey,api-journey,notification-actions}.ts`, `adapters/{db,http,queue}/*`, `domain/*`, `fixtures/*`, `utils/*`, `config/*`, `resources/*`, `seeds/*` — genuinely re-ported to `/notifications/{journeyId}/…` + `/fulfilments`.

## 2. Target test architecture

| Layer | Owner | Runs where | Owns |
|---|---|---|---|
| Deterministic journey net | **frontend canned** (`e2e/`) | frontend repo, stub, own webServer, **no stack** | Routes, gating/validation, lifecycle UI, documents client, dashboard, journey a11y |
| Mapper A contract / units | **frontend** (vitest) | frontend repo | `PUT /notifications` payload, enum vocabularies |
| Backend invariants | **backend ITs** (`mvn verify`) | backend, Testcontainers | Persistence ownership, lifecycle transitions |
| **Integration seams** | **tests-repo** | dedicated real-mode frontend + full stack | Real Defra ID + session, real persistence round-trips, outbox/DLQ events, admin operator UI over real data, cross-browser smoke, deployed a11y smoke |

**Re-homing of the 44 deleted specs:**

| Deleted spec(s) | Re-home | Reason |
|---|---|---|
| origin, port-of-entry, import-reason, additional-details, cph-number, transited-countries, transporters(+select) | **already frontend-canned** | 1:1 with named frontend tests |
| commodities(+select/details/identification) | **already frontend-canned** | batch search + per-species + N-of-M |
| addresses, consignees/consignors/destinations/importers/place-of-origin/consignment-contact-select | **already frontend-canned** | generic party-picker; addresses + contact tests cover every role |
| declaration, notification-view-draft/submitted | **already frontend-canned** | declaration→confirmation; CYA; read-only view |
| accompanying-documents (+file-size-limit/file-types/removal/view) | **already frontend-canned** | documents tests cover type/oversize/removal/view/scan |
| accompanying-documents-no-js | **frontend-canned (audit/extend)** | verify no-JS *document-removal* path asserted |
| all-operators | **frontend-canned (audit)** | confirm no operator role unasserted |
| notification-copy/delete | **both layers** | UI = frontend; real API idempotent-copy/soft-delete = tests-repo `promoted-lifecycle` |
| notification-amend/cancel-amend | **both layers** | UI = frontend; real transition = `promoted-lifecycle` |
| journey a11y initial/filled/error/view states | **already frontend-canned** | `a11y.spec.js` scans those states |
| **persistence-notification** | **TESTS-REPO — rebuild** | real UI-create → backend/Mongo round-trip + reload; core truly-lost |
| **persistence-accompanying-document** | **TESTS-REPO — rebuild** | real uploader → persisted doc + reload |
| **outbox-event-notification** | **TESTS-REPO — rebuild** | submit → outbox event on the queue (`promoted-lifecycle` asserts status, not emission) |
| **outbox-event-replay** | **TESTS-REPO — reconcile** | DLQ replay; extend surviving `dlq-events.spec.ts` |
| **admin-notifications, admin-outbox-events** | **TESTS-REPO or ADMIN-repo canned** | operator UI over real data; ownership open (§6) |
| origin visual baseline | **DROP** (or frontend `@visual`) | pixel regression owned nowhere post-promotion |

Net: **~35 already-frontend-canned · ~6 genuine tests-repo rebuilds · 1 drop-or-decide.**

## 3. The harness — pressure-tested

**Sam's idea (dedicated frontend on a second port, alongside dev mode, build parity test-by-test) is right in shape but should be REAL mode, not a stub parity workhorse** (a stub target would rebuild what the frontend canned suite owns). Corrected = **two lanes**:

### Lane B (primary) — pinned REAL-mode dedicated frontend
A second frontend service as a `test-target` compose profile so it never fights dev mode:

```yaml
# frontend.compose.yml — new service / test-target overlay
trade-imports-animals-frontend-test:
  profiles: [test-target]
  image: defradigital/trade-imports-animals-frontend:${FRONTEND_TEST_TAG:-<deploy-readiness-digest>}
  environment:
    - PORT=3100
    - LIVE_ANIMALS_MODE=real            # explicit — the missing piece today
    - SESSION_CACHE_ENGINE=redis
    - TRADE_IMPORTS_ANIMALS_BACKEND_URL=http://host.docker.internal:8085
    - DEFRA_ID_REDIRECT_URL=http://localhost:3100/auth/sign-in-oidc
    - DEFRA_ID_SIGN_OUT_REDIRECT_URL=http://localhost:3100/auth/sign-out-oidc
    - DEFRA_ID_SIGN_OUT_HOSTNAME_REWRITE_ENABLED=true
  ports: ['3100:3100']
```

Tests-repo gets `playwright.integration.config.ts` with `frontend-chromium` baseURL `http://localhost:3100`, reusing the existing base-url plumbing + real backend/Mongo/SQS URLs the docker-compose config already wires.

**How it kills each root cause:**
- **Cross-repo-SHA brittleness:** target **pinned to an explicit image tag/digest** (deploy-readiness build) via `${FRONTEND_TEST_TAG}` and **sets `LIVE_ANIMALS_MODE=real` on itself** — no longer depends on "all three repos at exact SHAs in `:latest`."
- **Port-3000 contention:** dedicated **3100**; dev `-d` keeps 3000; different ports + profiles = coexist.
- **No-stack safety-net gap:** accept the programme truth — the deterministic net is the **frontend canned suite** (`npm run test:e2e`, no stack). Re-tag the tests repo so plain `npm test` runs only the deterministic layer it legitimately owns; `npm run test:integration` runs the stack-dependent seams; restore a `test:local` alias.

**Seeding:** Lane B via the backend `/fulfilments` API (owner headers, already in `flows/api-journey.ts`) + Mongo seed fixtures (`seeds/mongodb`). 

### Lane A (secondary) — stub-mode target for cross-browser + deployed smoke
Cross-browser needs the frontend rendering across the browser set, not a real backend — point a thin happy-path spec at a **stub-mode** frontend on its own port (reuse the frontend `e2e:start` recipe). The only legitimate stub target in the tests repo, and a thin smoke, not a parity workhorse.

**Refinements over baseline:** pin to a **digest** not a floating tag; make it an opt-in **compose profile**; a **stable pinned image, not a hot-reload dev container** (the point of "stable dedicated target").

## 4. Parity-rebuild plan

Tracked against the **re-homed tests-repo checklist** (§2), not the raw 44.

| Inc | Deliverable | Verify | Recovers |
|---|---|---|---|
| **0 — harness** | `test-target` real-mode frontend (3100, pinned, real); `playwright.integration.config.ts`; re-tag `@compose`→`@integration`; restore `test:local`/`test:integration`; register 3100 in defra-id-stub redirect allow-list | existing 5 promoted specs pass against 3100 real-mode | infra; all 3 root causes |
| **1** | Persistence round-trip — real UI-create → backend/Mongo + reload | green Lane B | persistence-notification |
| **2** | Document persistence round-trip via real uploader | green Lane B | persistence-accompanying-document |
| **3** | Submit → outbox event on the queue (`sqs-client`) | green Lane B | outbox-event-notification |
| **4** | DLQ replay, reconciled with surviving `dlq-events.spec.ts` | green Lane B | outbox-event-replay |
| **5** | Harden `auth.spec.ts` — sign-in, org-switch, session continuity, **sign-out clears session** (known defect) | green / fixed | matrix: Defra ID + session |
| **6** | Admin operator UI over real data | green Lane B | admin-notifications, admin-outbox-events |
| **7** | Cross-browser thin happy-path smoke on Lane A | green across browsers | matrix: cross-browser |
| **8 (opt)** | Deployed a11y smoke | green | matrix: deployed a11y smoke |
| **9 (audit)** | Confirm frontend-canned parity for the ~35; extend the frontend spec where a genuine assertion is missing (no-JS doc removal, any unasserted party role) | frontend `test:e2e` green | closes the "already-frontend" column |

## 5. Rip-out list

**Delete/retire:** the **misframing** (stop treating the 5 `promoted-*` as the journey suite; rename `promoted-lifecycle`→`lifecycle-integration`, `promoted-documents`→`documents-integration`; fold `promoted-notification` into the Lane A smoke); the `@compose`-only tagging that leaves `npm test` empty → the `@integration` + deterministic-`npm test` split; `origin-of-import.visual` baseline (drop unless product wants pixel regression → frontend `@visual`).

**Do NOT restore** (frontend-canned's job — audit only): all per-page, journey-a11y, documents, lifecycle-UI specs (~35).

**Keep & reuse:** every `page-objects/*`, `flows/*`, `adapters/*`, `domain/*`, `fixtures/*`, `utils/*`, `config/*`, `resources/*`, `seeds/*`; surviving `auth.spec.ts` (harden), `ownership.spec.ts`, `headers.spec.ts`, `dlq-events.spec.ts`, `admin-auth.spec.ts`, dashboard sort/pagination + dashboard-a11y survivors.

## 6. Open questions for Sam

1. **defra-id-stub redirect allow-list** — is `localhost:3100` registerable as a valid OIDC redirect URI? The real-mode auth lane can't sign in otherwise (OIDC-single-origin: 3100 consistent across redirect, sign-out, `WELL_KNOWN_HOST_OVERRIDE`).
2. **Pin strategy** — pin the test-target to an explicit **digest** (recommended) vs floating deploy tag vs build-from-ref `-b`?
3. **Target ownership** — `test-target` as a workspace-owned compose profile in `docker/stack/`, or a tests-repo-owned overlay? (Affects the never-edit-`.staged/` boundary.)
4. **Admin operator specs** — tests-repo integration, or a new **admin-repo canned suite** mirroring the frontend pattern? (Admin is a separate repo, arguably owns its own net.)
5. **Visual regression** — drop, or re-home to a frontend `@visual` project?
6. **Cross-browser set** — which browsers? The `wdio.browserstack.*` stubs are unimplemented — BrowserStack in or out?
7. **Deterministic tests-repo layer** — accept the no-stack journey net lives entirely in the frontend repo, or does the tests repo also want a fast contract/API-client layer on plain `npm test`?
8. **Fix-first blockers** — the sign-out-doesn't-clear-session defect + the missing `LIVE_ANIMALS_MODE=real` in the stack: fix these (frontend + stack config) as part of inc-0, since the integration lane is meaningless until real mode is actually delivered.
