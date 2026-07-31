# Parity / dual-running rip-out plan (p-245 → executed as p-248)

Authorised 2026-07-31: Sam confirmed the folder refactor is complete and QA agreed the
dual-running setup and parity tests are no longer required. One frontend, one suite —
the new gear.

## End state

- The stack runs ONE branch-built frontend for E2E: `frontend-test` on :3100
  (test-target profile). The `:latest` sibling `frontend-main` (:3200) is gone.
- The tests repo has ONE suite: `tests/` (the reworked suite) plus the admin project.
  `main-suite/` (frozen legacy, with its own page-objects/flows) is deleted.
- `npm test` in the tests repo = stack preflight + clean + reseed + the suite vs
  :3100 + admin. No lanes, no `PARITY_ARTIFACT_LANE`.
- Workspace CI's `parity` job becomes a single-lane `e2e` job.
- `MERGE-STRATEGY.md` revised: the merge gate is the single suite, not dual-lane
  parity CI.

## Design calls (flagged, not gated)

1. **Keep :3100/`frontend-test`/test-target profile as-is.** The harness, OIDC
   single-origin wiring, and CI all point at it; the rip-out removes the second lane,
   it does not restructure the surviving harness.
2. **Rename the surviving lane honestly**: `playwright.parity.config.ts` →
   `playwright.e2e.config.ts`; project `reworked` → `e2e`; visual snapshot files
   `git mv`'d to match the new project name (Playwright keys snapshots by project);
   scripts `_test_parity_reworked` → `_test_e2e`, `test:parity` → dropped,
   `test` calls the new chain; `bin/assert-parity-stack.sh` → `bin/assert-stack.sh`
   (drops the :3200 probe).
3. **Historical workarea documents stay as history** (PARITY-MAPPING.md,
   DUAL-FRONTEND-PARITY-PLAN.md, QA-HANDOVER.md record what was done); only
   forward-looking docs (MERGE-STRATEGY.md, README run instructions) are revised.

## Increments

1. **Tests repo** — delete `main-suite/`; remove `_test_parity_main`,
   `PARITY_ARTIFACT_LANE`, main visual arms; renames per design call 2; README update.
   Verify: `npm run typecheck`, lint, then full `npm test` vs the live stack.
2. **Workspace stack** — remove `frontend-main` from `frontend.compose.yml` +
   `dev.compose.yml`. Verify: stack restart, :3200 gone, :3100 healthy.
3. **Workspace CI + docs** — `e2e-tests.yml` parity job → single-lane; revise
   MERGE-STRATEGY.md. Verify: workflow YAML parses; docs accurate.
4. **Final gate** — reseed + full `npm test` (new single-lane definition) green.
