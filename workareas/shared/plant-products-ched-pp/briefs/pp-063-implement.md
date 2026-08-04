# pp-063 — tests repo: m3 commodities coverage, depth-3 end to end

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fourteen times so far.

**This is the first increment to prove m3 against the real backend.** Everything before it proved the
frontend against its own stubs.

---

## 1. ⚠ GATE ONE: THE RUNNING FRONTEND IS STALE. REBUILD BEFORE YOU WRITE A LINE.

A stack is up and healthy, but `trade-imports-animals-frontend-1` has been running **4 hours** — and
**every page this increment tests landed in the last ~3 hours**: pp-022 (input-method), pp-023
(search), pp-024 (basic-description), pp-025 (varieties), pp-026 (summary), pp-027 (bulk-details),
pp-028 (additional-details). **The container almost certainly does not serve any of them.**

pp-061 hit exactly this and got it right: it rebuilt from local source rather than trusting a
7-hour-old container, because otherwise the acceptance bar tests yesterday's app. **Do the same.**

1. Rebuild the stack from local source — `tim docker dev` (note `--dev` and `--branch` are mutually
   exclusive).
2. **Then PROVE the rebuilt app serves m3 before writing specs.** Load the commodity-summary or
   bulk-details page on a notification and confirm it renders. **A stale stack is a stop-and-report,
   not something to work around.** I cannot probe HTTP myself — `curl` is denied to me — so this check
   is yours and I am relying on it.
3. Report what you did and what you observed. "Rebuilt and it worked" is not enough; name the page you
   loaded and what proved it was the new build.

## 2. THE TESTS REPO IS A SEPARATE GIT REPO

Own remote, own branch, own `package.json`, own CI, own scripts. Confirm the branch is
`spike/trace-to-requirements` **before the first edit**. Rollback is `git stash push -u` — never
`reset --hard` or `clean -fd`. **Never push.**

## 3. Establish the baseline, and report counts as NUMBERS

Before editing, run the suite and record what you find. At the last measurement (pp-062) it was:

| Leg | Baseline |
|---|---|
| full E2E | **172 passed / 1 skipped** |
| `test:live-animals` | **138 passed / 1 skipped** |
| plant | **17** |

**Treat those as expected, not as fact** — several increments have landed since and I have not
re-measured. Report what you actually observe, and if it differs, say so rather than assuming I was
wrong or that you broke something.

**Report collection with `playwright test --list`, as a count and by project.** pp-060's whole value
was that a `testMatch` missing a moved subtree is **invisible in a green run** — the suite passes
having silently run fewer tests. A project whose glob selects nothing reports success having run
nothing. Confirm your new specs are collected by **both** the `frontend-plant-products-chromium` and
`e2e-plant-products` projects, with the number, not an assumption.

## 4. The depth-3 bar is the acceptance, and it is deliberately hard

Two commodity lines; two species under one line; two varieties under one species. Then remove a
**middle** entry at species level **and** at variety level. After every mutation, assert **both** the
on-screen tree **and** the persisted `commodityComplement[].species[].varieties[]`, with untouched
lines keeping their `uniqueComplementId`.

**Remove a MIDDLE entry, not the last one.** I proved on pp-026 that a removal hardcoded to index 0
passed 360 unit tests and 108 of 109 browser tests, because the only test that removed anything
removed index 0. A last-entry removal cannot discriminate positional renumbering. Assert which
entries survive and in what order — not counts.

**Removing a parent must remove its children and orphan nothing onto a sibling — asserted explicitly,
never implied by a count.** An orphaned row renders perfectly and only surfaces as junk in the payload;
that is exactly how pp-030's container defect would have shipped.

Also pin, because each is a decision this programme took deliberately:

- **`commodity.inputMethod` is PERSISTED** — the contrast with `importType`, which pp-062 asserts
  ABSENT. The FD-8 distinction gets pinned by test, not by comment.
- **`variety` persists as the ID, not the display label** (Open Q 2).
- **`varietyClass` is asserted null in the not-applicable case** as well as set in the applicable one.
  Note the fixture constraint pp-025 established and I verified: only **CIDAC** carries both varieties
  and classes; **MABSD** deliberately has no classes. If a scenario is impossible with the shipped
  fixture, **say so — do not invent a species, EPPO code or class to make it work.**
- **`grossVolumeUnit` required-iff-`grossVolume` in BOTH directions**, and clearing the volume must
  purge the stored unit rather than orphan it. I proved that gate is load-bearing in pp-028 by flipping
  it open — exactly one test caught it.

## 5. Standing rules

- **No plant page object may import from `page-objects/live-animals/`.** Set-awareness comes through
  the shared `NotificationPage` with base `/plant-products`.
- `flows/plant-products/journey.ts` gains `answerCommodities()` and `answerAdditionalDetails()`,
  parameterised enough that the depth-3 spec never touches a page object directly.
- **Every URL assertion front-anchored on `^/plant-products`** and tolerant of a query string. pp-057
  shipped a bug precisely because an exact-literal URL match missed `/?page=2` — the very case the
  sweep existed to catch.
- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. pp-017
  silently deleted three browser specs and reported `ok:true`.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- `npm run typecheck`, `npm run lint`, `npm run format:check` must be green, and **the live-animals
  suite's count and result must be unchanged in the same run**.
- **E2E flakiness on a freshly rebuilt stack is a known pattern here** — transient 500s in `beforeEach`
  that recover on retry. If you hit it, **record it explicitly and re-run**; do not quietly re-run and
  report only the clean pass, and do not rationalise a genuine failure as the known flake.
- **Do not commit.** Leave the work staged and report; the orchestrator verifies and lands it.

## 6. Verification ladder

```
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests branch --show-current
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run typecheck
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run lint
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run format:check
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test
```

Note `test:a11y` is CI-only and targets an undefined CDP environment locally;
`test:docker-compose:a11y` is the local a11y entry point if you need one.

## 7. The increment itself

Seven page objects, the two journey helpers, and four specs — as specified in `backlog.json`'s
`pp-063` entry. Follow it there, subject to the corrections above. The frontend pages you are driving
all landed this session; read their real templates for the actual labels and control names rather than
guessing from the plan, since several pages deliberately diverge from the legacy service (uppercase
enum values, `plantsForPlanting`-gated finished/propagated, distinct per-row accessible names).
