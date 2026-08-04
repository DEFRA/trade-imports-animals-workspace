# pp-060 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-060** — "Tests repo: per-set tree + per-set Playwright projects (the symmetry half of R7)".
Repo: **tests** (`repos/trade-imports-animals-tests`) — **NOT the frontend**. Branch
`spike/trace-to-requirements`.

Full spec in `backlog.json` under this id: the file moves, sixteen acceptance criteria, the two
config traps, the scope fence, the verification ladder. Read it there; it is the contract.

**This is a different repo from everything else this session** — its own remote, its own CI under
`.github/workflows/`, its own npm scripts. There is no `test:features` and no `lint:arch` here.

---

## 0. BEFORE YOU TOUCH ANYTHING — two gates, in this order

**(a) Confirm the branch** is `spike/trace-to-requirements` in the tests repo.

**(b) Prove the running stack is the CURRENT one.** A full stack is already up and healthy, but its
frontend container has been running for about seven hours and I could not probe it myself (curl is
not available to me). The live-animals URL migration (pp-057/pp-059) moved the service to
`/live-animals` with `/` as a server-wide 302 — **if the running frontend predates that, the whole
E2E suite fails wholesale and nothing you do here is trustworthy.** So before any edit, check that
the stack serves `/live-animals` and that `/` redirects to it (the tests repo's own
`npm run _assert_stack` is the natural gate; a direct HTTP probe is fine too).

If the stack is stale or unhealthy, **stop at `ok:false` and say so.** Do not work around it, do not
skip the E2E legs, and do not rationalise past it. Bringing it up is `tim docker dev` from the
workspace root (`--dev` and `--branch` are mutually exclusive) — you may run that if you judge it
right, but report that you did. Building on a broken stack is the one thing that would make this
increment worthless.

**(c) Capture the `--list` baseline BEFORE the first edit.** It is the first verification command
for exactly this reason. Everything below depends on it.

## 1. THE BAR IS AN IDENTICAL TEST COUNT — and that is the whole point

This is a **pure move**. The acceptance criterion is not "green", it is **the same number of tests
before and after**, because the specific defect this reorganisation risks is a `testMatch` that
misses a moved subtree — which is **invisible in a green run**. A project whose glob selects nothing
reports success having run nothing. pp-011 already found exactly this in the frontend: ten
plant-products specs, including three axe scans, had never executed because no project collected
them, and one of them was catching a real accessibility defect on its first ever run.

So: `--list` before, `--list` after, diff them, and if the count moved **report it and stop** rather
than explaining it. Report the numbers, not "green".

## 2. PURE MOVE DISCIPLINE

- Use **`git mv`** so history follows the files.
- Inside a moved file, change **nothing except import paths and fixture destructuring**.
- If you find yourself improving a page object while moving it — better locator, tidier helper,
  fixing something that looks wrong — **stop**. That is a different increment, and it destroys the
  "identical count, identical assertions" proof this increment rests on. Note it in your report
  instead; I will raise it separately.
- **No test may be deleted or renamed.** If a spec seems to have no home, report it; do not drop it.

## 3. The two config traps — both verified live, neither in the recipe

1. **`utils/playwright/with-project-base-urls.ts`** has a hardcoded project-name → env-var map at
   `:3-6`, and throws at `:39-43` for any project missing from the passed `projectBaseUrls`.
   Renaming a project without updating **both** places fails either at config load (loud, fine) or
   at first navigation with `TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL is not set` (confusing).
2. **`playwright.e2e.config.ts:25-38` and `playwright.cross-browser.config.ts:17-36` REPLACE
   `projects` wholesale** rather than inheriting shared-config's. Editing only `shared-config.ts`
   leaves the workspace E2E lane and the cross-browser lane running the old shape — green locally,
   wrong in CI.

**Both frontend projects map to the SAME frontend base URL** in every config. Both sets share one
server; the project is a *selector*, not an environment. No base URL anywhere may end in a set
prefix — that was checked and fixed once already at pp-059 and must not regress.

## 4. Scope fence

- **No plant-products page object, flow, spec or seed lands here.** This increment creates the
  symmetry, not the content.
- Create an empty per-set directory **only** where a later increment fills it immediately, and
  **never commit a placeholder file** a future reader would mistake for coverage.
- `page-objects/{base,auth,admin}/`, `flows/admin-navigation.ts`, every `**/admin/` subtree and
  `tests/cross-browser/` all stay exactly where they are.
- **Set-neutral specs** (co-residency — exercising both sets) live at `tests/e2e/features/*.spec.ts`
  with no set directory, matched by the live-animals project. Decided here so pp-065 need not
  reopen it.

## 5. `filesToTouch` IS A HYPOTHESIS

Nine consecutive increments have found the plan wrong about existing code — most recently pp-019,
where five forced files were missing from the list. Open the real files first. Report anything
already done, missing, or extra. **Report under-delivery plainly**; silent under-delivery is as
dangerous as silent scope creep.

## 6. Visual baselines

Renaming a Playwright project changes snapshot filenames. If visual baselines need regenerating,
use `npm run test:visual:update:macos`, and **call the regeneration out explicitly** — a silently
regenerated baseline is a deleted assertion wearing a disguise.

## 7. Hygiene

- Rollback is **`git stash push -u`** — never `reset --hard`, never `clean -fd`.
- **Do not commit** — the orchestrator lands it. **Never push.**
- Test failures are yours; "pre-existing" is not available. If a moved spec fails, that is a finding
  about the move, not an inherited problem.
- Never invent data or a fixture. Genuinely blocked → `ok:false` with what you looked for and where.
  Stopping twice carries no penalty.

## 8. Verification ladder (from the increment — run it in this order)

```
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests branch --show-current
# --list BEFORE any edit, then typecheck / lint / format:check, then --list AFTER, then diff them
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run typecheck
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run lint
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run format:check
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:local
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:docker-compose:a11y
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:live-animals
```

Note `npm run test:docker-compose:a11y` is the a11y entry point — bare `test:a11y` targets an
undefined CDP environment locally and will look like a broken increment.

**Report numbers**: the `--list` count before and after, the E2E suite count, `test:local`,
the a11y count, and `test:live-animals`. Known reference points from pp-059's verified run against a
real stack: full E2E **152 passed** (3 recovered on retry after transient 500s — the known
fresh-stack pattern — plus 1 configured skip), `test:local` **127 passed**, docker-compose a11y
**11 passed**, 156 tests discovered across 61 files.
