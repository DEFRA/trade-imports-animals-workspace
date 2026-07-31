# EUDPA-288 merge strategy

Revised 2026-07-31 after retiring the temporary comparison harness.

Scope: `spike/EUDPA-288-model-retrofit` in the backend, frontend, tests, and
workspace repositories.

## Executive verdict

Merge in this order:

1. backend;
2. frontend;
3. tests;
4. workspace.

The merge acceptance gate is the one E2E suite in the tests repository:

```bash
cd repos/trade-imports-animals-tests
npm test
```

Run it against the branch frontend on `http://localhost:3100`. The command
performs the stack preflight, removes old results, reseeds Mongo, and runs the
`e2e` and `admin` Playwright projects. There is no second frontend or comparison
lane.

The backend-first order remains safe because the new contracts are additive and
actor request bodies remain optional. The frontend depends on those contracts;
the tests then pin the combined behaviour; the workspace orchestration comes
last.

## Merge gate

The tests repository defines the authoritative sequence:

```text
npm run _assert_stack
npm run _clean
npm run database:reseed
npm run _test_e2e
```

`npm test` is the supported way to run that sequence. A passing run proves the
branch frontend, admin, backend, persistence, and event contracts exercised by
the suite.

For a local-source gate, start the stack from the four checked-out branch
working trees and include the opt-in test target:

```bash
./scripts/stack/run-stack.sh -d \
  --profile database \
  --profile infrastructure \
  --profile servicebus \
  --profile stubs \
  --profile backend \
  --profile frontend \
  --profile test-target

(cd repos/trade-imports-animals-tests && npm test)
```

The workspace workflow mirrors this chain in its single-suite `e2e` job. The
reseed runs from the workspace checkout because it needs Docker and the stack
scripts; `_assert_stack` and `_test_e2e` run from the tests image.

## Contract coupling and merge order

| Order | Repository | Why it goes here | What breaks if the order is violated |
|---:|---|---|---|
| 1 | backend | Adds the canonical fulfilment store and lifecycle endpoints, current/proposed projection endpoints, enriched listing with `referenceNumber`, optional actor bodies, and withdrawn outbox events. | Merging the frontend first makes it call contracts not yet available on backend main. |
| 2 | frontend | Consumes the new fulfilment, projection, search, lifecycle, and actor contracts. | Before the backend, create/load/save/list/search and lifecycle actions can fail or lose required event semantics. |
| 3 | tests | Asserts the combined UI, stored model, actor/status-change, search, and withdrawn-event behaviour. | If merged before the services, the tests image can become incompatible with the service versions on main. |
| 4 | workspace | Supplies the branch test target and CI orchestration. | If merged before the service and tests contracts, callers can begin using orchestration that the published components do not yet satisfy. |

Backend can remain deployed if the frontend needs to be rolled back: its new
contracts are additive and its actor bodies are optional. That also makes this
the cleanest rollback order.

## Conflict-resolution requirements

Fetch `origin/main` immediately before reconciling each branch. Do not resolve
the hot files wholesale with “ours” or “theirs”.

For the backend notification conflicts, retain all of the following:

- actor and status-change envelopes;
- notification search and non-production expiry;
- canonical fulfilment and projection APIs;
- exact fulfilment reference filtering;
- optional actor request bodies;
- the withdrawn event on soft-delete.

For tests conflicts, retain main's search behaviour and anti-flake changes
alongside the branch dashboard locators and actor, withdrawn, persistence, and
visual assertions. The resolved `package.json` must expose `_assert_stack`,
`_test_e2e`, and `test`, where `test` runs the single authoritative sequence.

For the workspace, preserve local working-tree changes and runtime artifacts.
The combined `dev.compose.yml` must retain the native development overlays and
`trade-imports-animals-frontend-test`.

## Branch images and deployment evidence

Branch image publication is not a substitute for the local-source `npm test`
merge gate. It remains relevant in two places:

- CI uses the sanitised branch tag for backend, frontend, and tests images when
  those tags exist. Check the workflow log to confirm the intended tags were
  selected rather than a per-image `latest` fallback.
- deployment readiness requires the exact candidate images to be published and
  identifiable before promotion.

For `spike/EUDPA-288-model-retrofit`, the expected tag is
`spike-eudpa-288-model-retrofit`:

```bash
docker manifest inspect \
  defradigital/trade-imports-animals-backend:spike-eudpa-288-model-retrofit
docker manifest inspect \
  defradigital/trade-imports-animals-frontend:spike-eudpa-288-model-retrofit
docker manifest inspect \
  defradigital/trade-imports-animals-tests:spike-eudpa-288-model-retrofit
```

If a CI run is offered as merge evidence, its image-selection log must identify
the branch backend, frontend, and tests images. If the local-source `npm test`
run is the merge evidence, branch manifests are not a prerequisite for that
run; they are still required before deployment of those candidates.

## PR shape

Use one PR to `main` in each repository from
`spike/EUDPA-288-model-retrofit`. Use the tests PR as the coordination hub: its
description should link the other three PRs, state the merge order, and record
the per-repository checks plus the single-suite gate.

| Repository | Suggested title | Suggested one-line body |
|---|---|---|
| backend | `feat(EUDPA-288): add canonical fulfilment contracts for the model retrofit` | `Adds additive canonical persistence, lifecycle, search, actor and withdrawn-event contracts; merge 1/4 and coordinate verification in the tests PR.` |
| frontend | `feat(EUDPA-288): promote the model-retrofit live-animals journey` | `Promotes the live-animals journey onto the production routes using the EUDPA-288 backend contracts; merge 2/4 after backend.` |
| tests | `test(EUDPA-288): gate the model-retrofit journey` | `Coordination hub for all four PRs; carries the single E2E suite and actor, withdrawn, search, persistence, accessibility, and visual expectations; merge 3/4.` |
| workspace | `ci(EUDPA-288): run the branch frontend E2E gate` | `Runs the single tests-repository suite against the branch frontend test target; merge 4/4 after backend, frontend, and tests.` |

Open the tests, backend, and frontend PRs as drafts first so their ordinary
checks and image publication can run. Create the workspace PR once the branch
commits it must exercise are available. Mark each PR ready only after its
current head has completed the required checks.

## Runbook

### 0. Set paths and recheck state

```bash
BRANCH='spike/EUDPA-288-model-retrofit'
WORKSPACE='/Users/samfarrington/git/defra/trade-imports-animals'
BACKEND="$WORKSPACE/repos/trade-imports-animals-backend"
FRONTEND="$WORKSPACE/repos/trade-imports-animals-frontend"
TESTS="$WORKSPACE/repos/trade-imports-animals-tests"

for repo in "$BACKEND" "$FRONTEND" "$TESTS" "$WORKSPACE"; do
  git -C "$repo" fetch origin main
  git -C "$repo" status --short --branch
  git -C "$repo" rev-list --left-right --count origin/main...HEAD
done
```

Gate: every repository is on the intended branch. Deliberately preserve any
tracked workspace change and do not add untracked runtime artifacts.

### 1. Reconcile current main

Merge current `origin/main` into backend, tests, and workspace with merge
commits. Fast-forward the frontend if possible. Resolve semantically using the
requirements above, then run each repository's static and unit checks.

Minimum checks before pushing:

```bash
(cd "$BACKEND" && mvn clean verify)
(cd "$FRONTEND" && npm run build:frontend && npm run format:check && npm run lint && npm test)
(cd "$TESTS" && npm run format:check && npm run lint && npm run typecheck)
(cd "$WORKSPACE" && git diff --check && bash -n scripts/stack/run-stack.sh)
```

If a merge is unresolved, use `git merge --abort`. Do not reset or rewrite the
shared branch.

### 2. Push and open the coordinated PRs

Push each reconciled branch normally. Record all four PRs and the required
order in the tests PR. Wait for the current PR heads to complete their
repository checks.

Where CI uses published branch images, check both the manifests and the
image-selection log. Treat fallback to `latest` as an invalid CI run for the
branch component that fell back.

### 3. Run the single-suite gate

Start the local-source stack with the `test-target` profile as shown above,
then run:

```bash
(cd "$TESTS" && npm test)
```

Gate: `_assert_stack` confirms the branch frontend on `:3100` and admin on
`:3001`; reseeding succeeds; the `e2e` and `admin` projects pass; committed
Linux visual snapshots pass in Ubuntu CI.

The workspace PR's single-suite `e2e` job must also pass at its current head.
The existing sharded journey job and per-repository checks remain independent
required evidence where branch protection requires them.

### 4. Merge backend (1/4)

Merge only when the backend PR is current, approved, mergeable, and green.
After publish/deploy, smoke backend health and the additive contracts.

Rollback: revert the backend PR through a new PR if backend health fails.

### 5. Merge frontend (2/4)

After merge/deploy, smoke sign-in, create/save/reload, exact-reference search,
submit, amend/cancel, copy, soft-delete, the withdrawn outbox event, document
upload/scan, and a two-tab journey.

Rollback: redeploy the previous frontend image and revert the frontend PR if
the smoke fails. Leave the additive backend changes unless they independently
fail.

### 6. Merge tests (3/4)

Require the successful single-suite gate against the already merged backend
and frontend. After merge, wait for the tests `latest` image and rerun the
main-stack E2E workflow.

Rollback: revert the tests PR if the new tests image destabilises main or
unrelated PR E2E. Application services do not need rollback.

### 7. Merge workspace (4/4)

Require the current workspace PR head to pass its Compose validation and both
E2E jobs, with the single-suite job selecting the intended branch images. Run
one post-merge main-stack E2E and verify the reusable `@main` workflow from a
service context.

Rollback: revert only the workspace PR if orchestration breaks; the already
merged application and tests contracts remain valid.

## Go/no-go checklist

Go only when all are true:

- backend and tests conflicts were resolved semantically, not by choosing an
  entire side;
- local workspace changes were deliberately preserved;
- backend Maven, frontend unit/lint/build, tests static checks, and workspace
  checks are green at the current heads;
- `npm test` passes against the branch frontend on `:3100`;
- the workspace single-suite `e2e` job passes at its current head;
- any CI run used as evidence selected the intended branch images rather than
  silently falling back to `latest`;
- deployment candidates have published, identifiable images before promotion;
- the tests PR links all four PRs and records the order.

The biggest operational risk is testing different component versions from the
ones intended for merge. Record the exact commits or image tags used for the
successful gate.
