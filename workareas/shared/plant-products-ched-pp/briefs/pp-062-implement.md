# pp-062 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-062** — "Tests repo: plant-products m0/m2 coverage".
Repo: **tests** (`repos/trade-imports-animals-tests`) — **not the frontend**. Branch
`spike/trace-to-requirements`.

Full spec in `backlog.json` under this id. Read it there; it is the contract.

Seven specs and six page objects against the **real workspace stack** — real backend, real Mongo,
real OIDC. That is the whole point: the frontend's own in-repo specs run against the records **stub**,
so only these prove the set actually works.

---

## 1. ⚠ THE JOURNEY CHANGED TODAY — this plan predates it

The plan says `startNotification()` "lands on the HUB (not on the first question page — that is the
live-animals sequencing and must not be transposed)". **That was true when the plant opening run was
just import-type.** Since then pp-018, pp-019 and pp-020 landed, and the opening run is now:

```
import-type -> country-of-origin -> origin-of-import -> hub
```

So starting a notification lands on **import-type**, and you reach the hub only after answering the
opening-run pages. **Verify the real current flow before writing `startNotification()`** — read
`sets/plant-products/journeys/linear/flow/run.js` in the frontend — and shape the helper around what
the application actually does. Report what you found.

**A second consequence you must account for.** Because pp-018 put `countryOfOrigin` in
`policy.enforcedAtContinue`, the **Purpose row shows 'Cannot start yet' on a fresh notification** and
only becomes startable once country-of-origin is saved. Any spec that walks to purpose must satisfy
that ordering. This is a real behaviour, not a bug to work around — do not "fix" it by reaching the
page some other way; assert it if it is convenient to do so.

`filesToTouch` is otherwise a hypothesis as always: pp-060 reshaped this repo and pp-061 added the
client, models, fixtures and seeds hours ago, so `fixtures/ui.ts` and `page-objects/factory.ts` are
not as this plan describes. Open them first; report anything already delivered, missing or extra.
**Eleven consecutive increments have found the plan wrong about existing code.**

## 2. The entry-guard spec is the most valuable file here — treat it that way

Co-residency puts two entry guards in one process. Under a mount prefix, `request.path` includes the
prefix, so a guard whose journey prefix was captured at module load, or built without `setBase()`,
**silently stops matching** — the page renders, nothing throws, and deep-link protection is simply
gone. No frontend unit test catches it, because each in-repo suite composes one set. **A cold-context
deep link from outside is the only proof.**

Assert **both halves and both directions**: a cold plant deep link reaches the plant filter under
`/plant-products`, and a cold live-animals deep link reaches the live-animals filter under
`/live-animals`. Neither crosses.

## 3. Assert what the stub cannot prove

Every spec here should earn its place by asserting something the frontend's stub-backed specs
cannot:

- **Persisted codes and enums via `plantProductsApi.load(ref)`** — not rendered labels. A page that
  stores a display string renders identically and only breaks at the backend.
- **`importType` ABSENT from the persisted document** (FD-8, flow-only). This is an absence proof:
  make sure it would fail if the value were persisted, not merely pass because you did not look.
- **Draft resume across a real save**, dashboard scoping, and cross-set isolation.
- **The DELETED seeded row never appears in a dashboard list.** pp-061 seeds `GBN-PP-26-SEED04` as
  DELETED and `GBN-PP-26-SEED01` as DRAFT; those are real, verified references you can rely on.

## 4. URL assertions must be FRONT-anchored

Every URL assertion anchors on `^/plant-products`. **No suffix-anchored regex** — one that would also
pass with the prefix dropped proves nothing about the mount, and the mount is what co-residency is.
This exact class of defect was found and fixed at pp-057, where an acceptance grep written as an
exact literal proved the literal absent rather than the class.

## 5. Do NOT share page objects across sets

The ruling is that the URL layer is parameterised and everything above it is cloned. Two files named
`import-type-page.ts` under different set directories is the **intended outcome**, not duplication to
refactor away — the plant page has different copy, different options and a different next page. **No
plant page object may import from `page-objects/live-animals/`.**

## 6. Prove the specs are actually collected

`playwright test --list` — **confirm, do not assume**. pp-060 lost a test to exactly this: a spec
sitting in a subtree no project's `testMatch` covered, invisible in a green run because a project
whose glob selects nothing reports success having run nothing. Report the discovered count for the
plant projects, and the technique if you need it: extract test TITLES, sort, diff.

## 7. The bar, and the stack

**Green against a stack running BOTH sets co-resident, with the live-animals suite's count and result
unchanged in the same run.** pp-061 rebuilt the stack and the port-3100 target from local source, so
it currently contains today's frontend work — **verify that is still true** before trusting results,
and if you rebuild, say so. Do not build on a stale or broken stack; stop and report instead.

Reference points to compare against: live-animals **138 passed / 1 skipped** (discovery 139 tests in
59 files), full E2E **157 passed / 1 skipped**, plant-products **2 passed**.

## 8. Hygiene

- Rollback is **`git stash push -u`** — never `reset --hard`, never `clean -fd`.
- **Do not commit** — the orchestrator lands it. **Never push.**
- Test failures are yours; "pre-existing" is not available. A failing plant spec here is a finding
  about the frontend, and a real one — report it rather than weakening the assertion.
- **No test may be deleted or renamed without being reported.** If a count moves, explain it.
- Never invent data. Genuinely blocked → `ok:false` with what you looked for and where.

## 9. Verification ladder

```
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests branch --show-current
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run typecheck
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run lint
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run format:check
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test
```

**Report numbers**, not "green": plant-products count, live-animals count (must be unchanged), full
E2E count, and the `--list` discovery counts for the plant projects.
