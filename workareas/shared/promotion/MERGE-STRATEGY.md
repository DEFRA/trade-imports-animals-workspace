# EUDPA-288 same-day merge strategy

Assessment time: 2026-07-31 09:35 BST.

Scope: `spike/EUDPA-288-model-retrofit` in the backend, frontend, tests, and
workspace repositories. This is a read-only assessment. `origin/main` was fetched
in all four repositories before measuring divergence. No PR, workflow, image, or
repository content was changed.

## Executive verdict

Do not merge any repository yet. The frontend is integration-ready, but the
backend and tests branches require semantic conflict resolution, the workspace
has an uncommitted tracked backlog change, no PR checks have run, and none of the
three branch images currently exists. Open coordinated PRs to publish and test
the branch images, prove the full branch stack and parity lane, then merge in
this order:

1. backend;
2. frontend;
3. tests;
4. workspace.

The backend-first order is safe because its new contracts are additive and
actor request bodies remain optional. The old frontend can continue to use the
old contracts while the reworked frontend cannot operate correctly without the
backend branch.

## Status by repository

`git rev-list --left-right --count origin/main...HEAD` is reported as
**behind / ahead**.

| Repository | HEAD | Behind / ahead | Merge base and age | Both sides touched | Predicted textual conflicts | CI readiness |
|---|---:|---:|---|---:|---:|---|
| backend | `1e7004a` | **3 / 13** | `3b702a2`, 2026-07-20 11:05 BST, **10.9 days** | 14 of 37 branch-touched files | **8** | **Blocked.** Clean working tree, but main must be merged and the eight conflicts resolved. PR checks are `mvn clean verify`, a no-cache Docker build, then SonarCloud. PR publication also builds a branch image and triggers workspace E2E. No PR/run exists; branch image is missing. |
| frontend | `64e5215` | **0 / 448** | `df3b5b4`, 2026-07-30 14:35 BST, **0.8 days** | 0 of 883 branch-touched files | **0** | **PR-ready, not merge-ready.** The fetched `origin/main` is already an ancestor of the branch. PR checks build assets, check formatting, lint (including dependency-cruiser), run Vitest with coverage, build the Docker image, scan with SonarCloud, and run the separate security audit. No PR/run exists; branch image is missing. The 448-commit/883-file review surface is still large even though Git conflict risk is zero. |
| tests | `efe6ca7` | **9 / 34** | `726ab44`, 2026-07-21 15:47 BST, **9.7 days** | 11 of 262 branch-touched files | **5** | **Blocked.** Clean working tree, but main must be merged and five conflicts resolved. The ordinary PR check only runs `npm ci`, format, lint, and TypeScript; the journey-test job is commented out. Functional acceptance therefore depends on the published tests image plus workspace E2E/parity. No PR/run exists; branch image is missing. Linux visual baselines are committed. |
| workspace | `d8fbbb3` | **8 / 49** | `1fecae3`, 2026-07-18 09:53 BST, **13.0 days** | 1 of 50 branch-touched files | **0** (clean merge predicted) | **Blocked.** `docker/stack/dev.compose.yml` changed on both sides but merges without markers. The tracked `workareas/shared/promotion/BACKLOG.json` has an uncommitted local change, alongside many untracked runtime artifacts; preserve the backlog change before merging main. The PR E2E workflow contains the dual-frontend parity job. `tim CI` will not run because this branch changes no `tim/**` path. No PR/run exists, and parity would currently fall back to `:latest` because all branch images are missing. |

All four local branch tips match their corresponding remote branch tips. There
are currently no open or closed PRs for this branch and no recorded GitHub
Actions runs on this branch in any of the four repositories.

### Conflict detail

The overlap test is the intersection of:

```text
git diff --name-only <merge-base>..origin/main
git diff --name-only <merge-base>..HEAD
```

A read-only `git merge-tree <merge-base> origin/main HEAD` simulation narrows
the overlap to these files with actual conflict markers.

**Backend — 14 overlaps, 8 predicted textual conflicts**

- `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java`
- `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationMapper.java`
- `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java`
- `src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java`
- `src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java`
- `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java`
- `src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java`
- `src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java`

The hot production files are the four `notification/*` classes. Resolution must
retain all three main-side changes—actor/status-change envelopes (`8b6bd0b`),
notification search (`7afa481`), and non-production expiry (`4e656e1`)—while
also retaining the branch's canonical fulfilment/projection APIs, exact
fulfilment reference filter, optional actor bodies, and withdrawn event on
soft-delete. `ActorRequest`, `Actor`, `StatusChange`, `OutboxEvent`, and
`OutboxService` overlap but the branch and main actor/event model is already
equivalent; `application.yml` is predicted to merge cleanly. Do not resolve the
hot files wholesale with “ours” or “theirs.”

**Tests — 11 overlaps, 5 predicted textual conflicts**

- `README.md`
- `package.json`
- `page-objects/notification/notification-dashboard-page.ts`
- `tests/e2e/features/notification-delete.spec.ts`
- `tests/e2e/pages/notification-dashboard.spec.ts`

The hot files are `package.json` and the dashboard/delete specs. Keep main's
EUDPA-73 search behaviour and anti-flake changes while retaining the branch's
dual-suite scripts, reworked dashboard locators, actor/withdrawn assertions, and
parity coverage. The overlapping outbox model and persistence specs are
predicted to auto-merge.

**Workspace — 1 overlap, no predicted textual conflict**

- `docker/stack/dev.compose.yml`

Retain both main's native frontend/admin development build change and the
branch's frontend test-target overlay. Validate the combined Compose model even
though Git predicts a clean merge.

**Frontend — no overlap**

`origin/main` is the merge base, so there is no two-sided file conflict.

## CI and cross-repository readiness

### Published-image gate

At assessment time, all required tags are absent:

```text
MISSING defradigital/trade-imports-animals-backend:spike-eudpa-288-model-retrofit
MISSING defradigital/trade-imports-animals-frontend:spike-eudpa-288-model-retrofit
MISSING defradigital/trade-imports-animals-tests:spike-eudpa-288-model-retrofit
```

This is expected while there are no PRs: each service/tests repository's
`Publish Branch Image` workflow runs on `pull_request` and sanitises
`spike/EUDPA-288-model-retrofit` to
`spike-eudpa-288-model-retrofit`.

The absence is nevertheless a hard block. The stack deliberately falls back to
`:latest` when a tag is missing. A green E2E run is not evidence for this branch
unless its log says that backend, frontend, and tests selected
`spike-eudpa-288-model-retrofit`; the parity job additionally requires the
frontend test target on `:3100` to select that same frontend tag. The frozen
main frontend on `:3200` intentionally remains `:latest`.

### Workflow coupling

- Backend, frontend, and tests PRs publish their branch image, then use
  `DEFRA/trade-imports-animals-workspace/.github/workflows/e2e-tests.yml@main`.
  They pass the PR branch name into that reusable workflow.
- The reusable workspace workflow checks out workspace `main` when called from
  another repo, probes the same branch tag for service images and for the tests
  image, and otherwise falls back per image to `latest`.
- A direct workspace PR checks out the workspace PR branch. That is the only PR
  which exercises the branch's new dual-frontend parity job before the
  workspace changes reach main.
- Stack init staging also probes the same Git branch in the tests repo
  (`seeds/mongodb`) and backend repo (`compose/start-floci.sh`), falling back to
  each default branch if the branch ref is unavailable.
- The tests branch contains committed Linux baselines:
  `main-suite/.../origin-of-import-main-linux.png` and
  `tests/.../origin-of-import-reworked-linux.png`. The macOS baselines are also
  present. Do not regenerate snapshots during conflict resolution; let the
  Ubuntu parity job verify the committed Linux files.

## Contract coupling and merge order

| Order | Repository | Why it goes here | What breaks if the order is violated |
|---:|---|---|---|
| 1 | backend | Adds the `/fulfilments` canonical store and lifecycle endpoints, current/proposed projection endpoints, enriched listing with `referenceNumber`, optional actor request bodies on submit/amend/soft-delete, and withdrawn outbox events. These additions do not remove the contracts used by the old frontend. | Merging frontend first makes create/load/save/list/search and lifecycle actions call contracts not available on backend main. Actor bodies and soft-delete would fail or lose the expected event semantics. Tests spanning the new frontend/backend would fail. |
| 2 | frontend | Consumes `POST/PUT/GET /fulfilments`, `GET /fulfilments?...&referenceNumber=`, `/fulfilments/{id}/{submit,amend,cancel-amend,soft-delete}`, `PUT /notifications/{id}`, and `PUT /proposed-notifications/{id}`. It sends the actor body on submit, amend, and soft-delete. | Before backend: runtime 4xx/404/5xx failures and no canonical persistence. After tests but before frontend: tests main would target UI routes, controls, MoJ date picker, selects, checkbox groups, and event behaviour that old frontend main does not provide. |
| 3 | tests | Coordinates the cross-repo release and asserts both UI and stored/event contracts, including actor/status changes and the withdrawn event. It carries the reworked suite, frozen main suite, parity config, and Linux snapshots. | If merged before the services, the tests `latest` image becomes incompatible with the old service stack and can make unrelated main/PR E2E red. |
| 4 | workspace | Adds the `:3100` reworked test target, `:3200` frozen-main sibling, branch-image lockstep, and the parity job. It is operational orchestration, not an application contract. | If merged before branch/service readiness, every caller starts using the new parity orchestration while branch images are absent or application contracts are incomplete, producing false-latest coverage or widespread CI failures. |

Backend can remain deployed if the frontend needs to be rolled back: its new
contracts are additive and its actor bodies are optional. That makes this order
also the cleanest rollback order.

## PR shape

Use one PR to `main` in each repository, all from the exact branch
`spike/EUDPA-288-model-retrofit`. Use the tests PR as the coordination hub:
its description should link the other three PRs, state the required merge
order, and hold a checklist for branch-image publication, per-repo checks,
branch-stack E2E, and dual-frontend parity.

| Repository | Suggested title | Suggested one-line body |
|---|---|---|
| backend | `feat(EUDPA-288): add canonical fulfilment contracts for the model retrofit` | `Adds additive canonical persistence, lifecycle, search, actor and withdrawn-event contracts; merge 1/4 and coordinate verification in the tests PR.` |
| frontend | `feat(EUDPA-288): promote the model-retrofit live-animals journey` | `Promotes the reworked journey onto the production routes using the EUDPA-288 backend contracts; merge 2/4 after backend and coordinate verification in the tests PR.` |
| tests | `test(EUDPA-288): coordinate model-retrofit journey and parity coverage` | `Coordination hub for all four PRs; carries reworked/main parity suites, actor/withdrawn/search expectations and committed Linux visual baselines; merge 3/4.` |
| workspace | `ci(EUDPA-288): add the dual-frontend parity stack and gate` | `Adds branch-image test-target orchestration and the temporary frozen-main parity lane; merge 4/4 after backend, frontend and tests.` |

Open the tests, backend, and frontend PRs as drafts first. Draft PRs are enough
to publish their branch images. Create the workspace PR as non-draft only after
all three manifests exist so its initial PR run cannot silently validate
`latest` instead. Mark the other three ready once their images and first checks
exist.

## DECISION — what happens to `main-suite` after merge?

After the frontend PR merges, the reworked frontend is main. The frozen
`main-suite` no longer represents a separate product path, so the parity lane's
original purpose ends.

**Option A — retire it in a follow-up PR.** After the four merges and one
post-merge smoke run, remove `main-suite/`, `playwright.parity.config.ts`, the
`_test_parity_main`/dual-suite package scripts, the workspace parity job, and
the `:3200` frozen-main service. Repoint the ordinary test command at the
reworked-now-main suite. This removes duplicated tests, snapshots, runtime, and
maintenance.

**Option B — keep it until the old frontend is decommissioned.** Keep the
frozen suite and `:latest` sibling only if the old frontend remains a real,
supported deployment/rollback target. Set an owner and deletion date; otherwise
the frozen suite will drift and become misleading.

**Recommendation: choose Option A.** Retire the main-suite/parity machinery in
a focused follow-up immediately after the post-merge smoke gate. Deployment
rollback should use a previously published frontend image, not an indefinitely
forked source-level acceptance suite. If Sam confirms that the old frontend
must remain supported after today's merge, choose Option B temporarily and
tie deletion to its explicit decommission date.

## Five `blocked-on-sam` backlog items

These are the five items currently carrying that exact status in
`workareas/shared/promotion/BACKLOG.json`. None blocks today's merge.

| Item | Backlog title | Merge judgement |
|---|---|---|
| `p-201` | Promotion needs a dedicated tests-repo (E2E) update theme | **Does not block.** The branch has performed the tests-repo takeover (`c996502` and subsequent parity/reworked-suite commits). The remaining backlog status is stale planning state. |
| `p-202` | Where do the prototype's canned-data “E2E” tests fit after promotion? | **Does not block.** The frontend branch currently retains fast co-located/canned feature tests and the tests repo supplies cross-service coverage. The long-term duplication decision is housekeeping after functional parity, not a prerequisite to merge. |
| `p-203` | If a canned-data layer stays in the frontend repo, host a11y tests there too? | **Does not block.** Accessibility coverage exists in the tests-repo lane and the frontend branch added a canned accessibility layer. The permanent ownership choice can follow the `p-202` decision. |
| `p-204` | Future theme: documentation + custom skills — configure the repo agentic-AI-first | **Does not block.** Its own detail says it is a future lane after the codebase reaches gold standard, not an implementor item. |
| `p-217` | Multi-tab session interference: the active journey id is a single yar value, not carried in the URL | **Does not block.** The frontend branch addressed the stated fix direction in `e2211b7` by carrying journey IDs in every URL and removing session-global navigation pointers. Verify the multi-tab behaviour in the frontend gate, then update the stale backlog status separately. |

## Runbook for today

The commands below are for the person performing the merge. They intentionally
avoid rebasing or force-pushing this large shared branch.

### 0. Set paths and recheck facts

```bash
BRANCH='spike/EUDPA-288-model-retrofit'
TAG='spike-eudpa-288-model-retrofit'
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

Gate: every repository must still be on `$BRANCH`; backend, frontend, and tests
must be clean. In the workspace, inspect and preserve the tracked backlog
change before continuing:

```bash
git -C "$WORKSPACE" diff -- workareas/shared/promotion/BACKLOG.json
```

If that change is intended branch state, checkpoint it:

```bash
git -C "$WORKSPACE" add workareas/shared/promotion/BACKLOG.json
git -C "$WORKSPACE" commit -m 'chore(EUDPA-288): checkpoint promotion backlog before merge'
```

If it is unfinished personal state, stash only that tracked file instead:

```bash
git -C "$WORKSPACE" stash push -m 'EUDPA-288 backlog before main merge' -- workareas/shared/promotion/BACKLOG.json
```

Do not add the untracked runtime artifacts. If the choice is unclear, stop for
Sam; this is the only local-state blocker.

Rollback posture: before any merge commit exists, nothing has changed. During
an unresolved merge, use `git merge --abort`. Do not reset the shared branch.

### 1. Merge current main into each branch

Backend:

```bash
git -C "$BACKEND" merge --no-ff origin/main
git -C "$BACKEND" diff --name-only --diff-filter=U
# Resolve the eight files listed above, retaining both contract sets.
git -C "$BACKEND" add \
  src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java \
  src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationMapper.java \
  src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationRepository.java \
  src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationService.java \
  src/test/java/uk/gov/defra/trade/imports/animals/integration/NotificationIT.java \
  src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationControllerTest.java \
  src/test/java/uk/gov/defra/trade/imports/animals/notification/NotificationServiceTest.java \
  src/test/java/uk/gov/defra/trade/imports/animals/outbox/OutboxServiceTest.java
git -C "$BACKEND" diff --check
git -C "$BACKEND" merge --continue
(cd "$BACKEND" && mvn clean verify)
```

Gate: Maven unit/integration/Testcontainers verification is green; tests cover
actor/status changes, withdrawn soft-delete, both search paths, and canonical
fulfilment lifecycle. If resolution is wrong, add a corrective branch commit;
do not rewrite published history.

Frontend:

```bash
git -C "$FRONTEND" merge --ff-only origin/main
(cd "$FRONTEND" && npm ci)
(cd "$FRONTEND" && npm run build:frontend)
(cd "$FRONTEND" && npm run format:check)
(cd "$FRONTEND" && npm run lint)
(cd "$FRONTEND" && npm test)
```

Gate: main is already contained, all frontend PR-equivalent checks are green,
and focused lifecycle request tests still send actor bodies and
`referenceNumber`.

Tests:

```bash
git -C "$TESTS" merge --no-ff origin/main
git -C "$TESTS" diff --name-only --diff-filter=U
# Resolve the five files listed above, retaining main search plus branch parity.
git -C "$TESTS" add \
  README.md \
  package.json \
  page-objects/notification/notification-dashboard-page.ts \
  tests/e2e/features/notification-delete.spec.ts \
  tests/e2e/pages/notification-dashboard.spec.ts
git -C "$TESTS" diff --check
git -C "$TESTS" merge --continue
(cd "$TESTS" && npm ci)
(cd "$TESTS" && npm run format:check)
(cd "$TESTS" && npm run lint)
(cd "$TESTS" && npm run typecheck)
```

Gate: the static PR checks are green and `package.json` still exposes
`test:parity`, both `_test_parity_*` scripts, and
`test:visual:update:linux`. Confirm the two Linux origin snapshots remain
tracked.

Workspace:

```bash
git -C "$WORKSPACE" merge --no-ff origin/main
git -C "$WORKSPACE" diff --check
bash -n "$WORKSPACE/scripts/stack/run-stack.sh"
git -C "$WORKSPACE" diff --name-only --diff-filter=U
```

Gate: no unresolved path; the merged `dev.compose.yml` retains both native dev
builds and `trade-imports-animals-frontend-test`; the workflow retains both E2E
and parity jobs. If the backlog was stashed, restore it now and resolve only
that file:

```bash
git -C "$WORKSPACE" stash pop
```

Rollback posture for this phase: use `git merge --abort` while a merge is in
progress. After a merge commit, correct forward on the branch. No main branch
has changed yet.

### 2. Push the reconciled branch

```bash
git -C "$BACKEND" push origin "$BRANCH"
git -C "$FRONTEND" push origin "$BRANCH"
git -C "$TESTS" push origin "$BRANCH"
git -C "$WORKSPACE" push origin "$BRANCH"
```

Gate: each remote head equals its local head:

```bash
for repo in "$BACKEND" "$FRONTEND" "$TESTS" "$WORKSPACE"; do
  test "$(git -C "$repo" rev-parse HEAD)" = "$(git -C "$repo" rev-parse "origin/$BRANCH")"
done
```

Rollback posture: no main branch has changed. Fix any problem with a new commit
on the PR branch.

### 3. Open the image-producing draft PRs

Create the tests coordination PR first, then backend and frontend:

```bash
gh pr create --repo DEFRA/trade-imports-animals-tests \
  --base main --head "$BRANCH" --draft \
  --title 'test(EUDPA-288): coordinate model-retrofit journey and parity coverage' \
  --body 'Coordination hub for all four PRs; carries reworked/main parity suites, actor/withdrawn/search expectations and committed Linux visual baselines; merge 3/4.'

gh pr create --repo DEFRA/trade-imports-animals-backend \
  --base main --head "$BRANCH" --draft \
  --title 'feat(EUDPA-288): add canonical fulfilment contracts for the model retrofit' \
  --body 'Adds additive canonical persistence, lifecycle, search, actor and withdrawn-event contracts; merge 1/4 and coordinate verification in the tests PR.'

gh pr create --repo DEFRA/trade-imports-animals-frontend \
  --base main --head "$BRANCH" --draft \
  --title 'feat(EUDPA-288): promote the model-retrofit live-animals journey' \
  --body 'Promotes the reworked journey onto the production routes using the EUDPA-288 backend contracts; merge 2/4 after backend and coordinate verification in the tests PR.'
```

Edit the tests PR once to add the three application/workspace PR links, merge
order, and checklist. This is the workspace-rule coordination point.

Wait for each `Publish Branch Image` run, then enforce the manifest gate:

```bash
docker manifest inspect "defradigital/trade-imports-animals-backend:$TAG" >/dev/null
docker manifest inspect "defradigital/trade-imports-animals-frontend:$TAG" >/dev/null
docker manifest inspect "defradigital/trade-imports-animals-tests:$TAG" >/dev/null
```

Gate: all three commands return zero. In each E2E log, verify the branch tag was
selected rather than `latest`. A manifest existing is necessary but the log is
proof that the tested run consumed it.

Rollback posture: close a draft PR or push a corrective commit. Images are
branch-scoped and have not changed `latest`.

### 4. Run the full branch stack and parity gate

Create the workspace PR only after the manifest gate:

```bash
gh pr create --repo DEFRA/trade-imports-animals-workspace \
  --base main --head "$BRANCH" \
  --title 'ci(EUDPA-288): add the dual-frontend parity stack and gate' \
  --body 'Adds branch-image test-target orchestration and the temporary frozen-main parity lane; merge 4/4 after backend, frontend and tests.'
```

The workspace PR must run:

- sharded branch-stack E2E using the branch tests image;
- the reworked suite against the branch frontend on `:3100`;
- a database reseed;
- the frozen main suite against frontend `:latest` on `:3200`;
- report merging.

Optional local reproduction using the same published artifacts:

```bash
"$WORKSPACE/scripts/stack/run-stack.sh" \
  --branch "$BRANCH" \
  --profile stubs --profile backend --profile frontend --profile test-target
(cd "$TESTS" && npm test)
"$WORKSPACE/scripts/stack/stop-stack.sh"
```

Gate: backend, frontend, and tests branch tags are printed in stack selection;
both parity suites pass; Ubuntu visual comparisons use the committed Linux
snapshots; general E2E and all per-repo PR checks are green. Then mark the first
three PRs ready:

```bash
gh pr ready "$BRANCH" --repo DEFRA/trade-imports-animals-backend
gh pr ready "$BRANCH" --repo DEFRA/trade-imports-animals-frontend
gh pr ready "$BRANCH" --repo DEFRA/trade-imports-animals-tests
```

Recheck all PR checks after the `ready_for_review` event. Do not merge on an
earlier green commit.

Rollback posture: if parity fails, keep every PR open and add fixes to the
owning branch. No production/main rollback is required.

### 5. Merge backend (1/4)

Gate immediately before merge:

```bash
gh pr checks "$BRANCH" --repo DEFRA/trade-imports-animals-backend
gh pr view "$BRANCH" --repo DEFRA/trade-imports-animals-backend \
  --json mergeable,mergeStateStatus,statusCheckRollup
```

Merge only when mergeable, current, approved, and green. Wait for backend main
publish/deploy, then run the branch-stack E2E once more. The old frontend should
still work because contracts are additive.

Rollback posture: revert only the backend PR through a new GitHub revert PR if
backend health or old-frontend smoke fails. Nothing else has merged, so there
is no cross-repo rollback.

### 6. Merge frontend (2/4)

Gate immediately before merge:

```bash
gh pr checks "$BRANCH" --repo DEFRA/trade-imports-animals-frontend
gh pr view "$BRANCH" --repo DEFRA/trade-imports-animals-frontend \
  --json mergeable,mergeStateStatus,statusCheckRollup
```

After merge/deploy, run a smoke covering sign-in, create/save/reload, dashboard
exact-reference search, submit, amend/cancel, copy, soft-delete, withdrawn
outbox event, document upload/scan, and a two-tab journey check.

Rollback posture: redeploy the previous frontend image and revert the frontend
PR if the smoke fails. Leave the additive backend changes in place unless they
independently fail backend health.

### 7. Merge tests (3/4)

Gate immediately before merge:

```bash
gh pr checks "$BRANCH" --repo DEFRA/trade-imports-animals-tests
gh pr view "$BRANCH" --repo DEFRA/trade-imports-animals-tests \
  --json mergeable,mergeStateStatus,statusCheckRollup
```

Because the ordinary tests PR job does not execute journeys, require the
workspace branch E2E/parity run against the already merged backend/frontend as
an explicit external gate. After merge, wait for the tests `latest` image and
rerun main-stack E2E.

Rollback posture: revert the tests PR if the new tests `latest` destabilises
main or unrelated PR E2E. Application services do not need rollback.

### 8. Merge workspace (4/4)

Gate immediately before merge:

```bash
gh pr checks "$BRANCH" --repo DEFRA/trade-imports-animals-workspace
gh pr view "$BRANCH" --repo DEFRA/trade-imports-animals-workspace \
  --json mergeable,mergeStateStatus,statusCheckRollup
```

Require the current workspace PR commit to have run with all three branch tags;
then merge. Run one post-merge main-stack E2E and verify the reusable
`@main` workflow from a service context.

Rollback posture: revert only the workspace PR if orchestration breaks; the
already merged application and tests contracts remain valid. Then make the
`main-suite` decision above and open the recommended cleanup PR.

## Go/no-go checklist

Go only when all are true:

- backend's eight and tests' five conflicts were resolved semantically, not by
  choosing an entire side;
- the workspace backlog modification was deliberately preserved;
- all three branch image manifests exist;
- CI logs prove the branch tags, including frontend `:3100`, were actually
  selected;
- backend Maven, frontend unit/lint/build, tests static checks, general E2E,
  both parity suites, and Linux visuals are green at the current PR heads;
- the tests PR links all four PRs and records the order;
- Sam has made or explicitly deferred the post-merge `main-suite` decision.

The single biggest operational risk is a false green caused by per-image
fallback to `:latest`. Treat image-selection log lines as release evidence.
