# QA handover — spike/EUDPA-288-model-retrofit

Branch: `spike/EUDPA-288-model-retrofit` (same name in frontend, backend, tests, workspace).

## Environment

Prerequisite: workspace cloned at `~/git/defra/trade-imports-animals-workspace` (or symlinked), Docker running.

```bash
cd ~/git/defra/trade-imports-animals-workspace
scripts/stack/run-stack.sh -d
scripts/stack/run-stack.sh -d --profile test-target
npm --prefix repos/trade-imports-animals-tests run database:reseed
```

| URL | What it is |
|---|---|
| http://localhost:3100 | Reworked frontend under test |
| http://localhost:3200 | Old frontend (reference, unchanged) |
| http://localhost:3001 | Admin (outbox event inspection) |

Sign-in for both frontends: `2100010101` / `Password123`.

## What changed — check these by hand

1. **Date inputs use the MoJ date picker** (exit date, arrival date at port, document date of issue). Check: calendar selection works; typing `dd/mm/yyyy` directly works; with JavaScript disabled the plain input still submits.
2. **Country of origin and port of entry are plain select boxes.** The autocomplete is gone. Check keyboard and screen-reader use.
3. **Transited countries is one checkbox list** (was add-another rows). Check: select several, save, values persist; more than 12 is rejected.
4. **Commodity selection is a grouped checkbox list** (search box removed). All 8 commodity/species pairs show at once. Check select, save, change.
5. **Dashboard search by exact notification reference.** Check: exact match returns one card; no match shows "No notifications found" with the query preserved; clearing returns the full list; sort and pagination still work alongside it.
6. **Deleting a submitted notification writes a withdrawal event** (admin :3001 → outbox events: type `NotificationWithdrawn`, actor block, status history). Deleting a never-submitted draft writes no event.
7. **Submit and amend events carry the signed-in actor** (admin :3001 → outbox events: `actor` with id `2100010101`, displayName `Andrew Farmer`, org `5900001`).
8. **Amend / cancel-amend round trip.** Amend a submitted notification, change a value, cancel: the submitted values are restored.

Compare any behaviour against the old frontend at :3200 if in doubt — it is the pre-rework reference.

## Automated tests — copy-paste

Frontend unit suite (no stack needed):

```bash
npm --prefix repos/trade-imports-animals-frontend test
```

Frontend per-feature Playwright suite, 262 tests — page behaviour, validation, accessibility (no stack needed; starts its own server):

```bash
PORT=3050 npm --prefix repos/trade-imports-animals-frontend run test:features
```

Backend unit + integration (Docker needed for Testcontainers):

```bash
mvn -f repos/trade-imports-animals-backend/pom.xml verify
```

Full dual-frontend parity gate — runs the reworked suite against :3100 and the frozen old suite against :3200 (stack must be up, reseeds itself):

```bash
npm --prefix repos/trade-imports-animals-tests test
```

Expected: all green. Reworked lane ~140 tests, old lane ~253. A test that fails in the batch but passes when run alone is load flake, not a defect:

```bash
npm --prefix repos/trade-imports-animals-tests run _test_integration -- <path-to-spec> --workers=1
```

## Where the tests live

| Location | Contents |
|---|---|
| `repos/trade-imports-animals-frontend/src/server/live-animals/features/**/*.e2e.spec.js` | Per-feature Playwright specs, co-located with the feature they test |
| `repos/trade-imports-animals-frontend/e2e/journey-smoke.spec.js` | Cross-feature journey glue |
| `repos/trade-imports-animals-tests/tests/` | Reworked-frontend integration suite (:3100) |
| `repos/trade-imports-animals-tests/main-suite/` | Frozen old-frontend suite (:3200) — do not edit |
| `repos/trade-imports-animals-backend/src/test/` | Backend unit + `*IT` integration tests |

## Reference documents

All in `workareas/shared/promotion/`: `MERGE-STRATEGY.md` (merge runbook), `USERS-OWNERSHIP-AUDIT.md`, `DRIFT-AUDIT.md`, `AUTOCOMPLETE-ASSESSMENT.md`, `BACKLOG.json` (per-item verification evidence).
