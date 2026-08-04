# pp-061 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-061** — "Tests repo: plant-products API client, domain models and Mongo seed fixtures".
Repo: **tests** (`repos/trade-imports-animals-tests`) — **not the frontend**. Branch
`spike/trace-to-requirements`.

Full spec in `backlog.json` under this id — the transposition trap, the copy-idempotency contract,
the constants rule, the scope fence. Read it there; it is the contract.

This is the harness every later plant suite depends on. Build it right and the first plant UI spec
debugs the UI, not the harness.

---

## 1. ⚠ THE VERIFICATION LADDER HAS A DEFECT — do not run it as written

The ladder says:

```
scripts/stack/run-stack.sh -d -b spike/trace-to-requirements
```

**`-d/--dev` and `-b/--branch` are mutually exclusive.** This was found and recorded at pp-059,
where the stack had to be run as plain `tim docker dev`. Passing both will fail or silently pick
one. Use **`tim docker dev`** from the workspace root.

**More importantly, think before restarting anything.** A full stack is already up and healthy and
pp-060 confirmed it serves the migrated `/live-animals` route. But **its frontend container predates
today's five increments** (pp-016, pp-017, pp-018, pp-019, pp-020 — reference fixtures, the
import-type entry filter, both origin pages and the purpose page).

That matters for this increment's own acceptance bar, which requires an API-seeded plant draft to be
loadable at `/plant-products/notifications/{ref}` and render the hub. The hub itself predates today,
so a stale container might satisfy the letter of the bar while proving nothing about current code —
and pp-062, which is next, tests the origin and purpose pages directly and **cannot** pass against a
stale container.

So: **rebuild the frontend from local source before you rely on that bar** (`tim docker dev` builds
the repo-backed services from `repos/`). Report explicitly which you did — reused the running stack,
or rebuilt — and if a rebuild fails, **stop at `ok:false`** rather than testing against the old one.
Building on a stale stack is the same class of error as building on a broken one.

## 2. Real canned data only — never invented lookalikes

Every constant must trace to the frontend set's actual fixture services. Read and transcribe from:

```
repos/trade-imports-animals-frontend/src/server/app/sets/plant-products/services/reference/*.js
repos/trade-imports-animals-frontend/src/server/app/sets/plant-products/services/commodities/
```

Those fixtures landed today with stated provenance — EPPO codes matched by exact species name,
document types deduped per c-016, enum codes byte-matched to the backend. **An invented lookalike
throws all of that away.** pp-014 stopped rather than invent an EPPO association and was right; the
plan had named the wrong commodity. **Spot-check at least the EPPO codes and the document types
against those files and say so in your report** — the acceptance criteria require it.

If a value you need genuinely is not in the fixtures, **stop at `ok:false`** and say what you looked
for and where. Do not mint one. Stopping twice carries no penalty; inventing one row does.

## 3. The transposition trap — the reason this increment is not a copy-paste

Live-animals persists to `/fulfilments` and maintains **two** projections; its `api-journey.ts`
documents that a UI save writes all three and an API seed must too. **Plant-products has ONE
notification resource** plus an accompanying-documents sub-resource.

- **Copying `seedProjections()` invents endpoints that do not exist.** Do not.
- **Copying nothing loses the lesson.** The plant analogue of that caveat is that documents are a
  **separate aggregate**, so a whole-document PUT does not create them. Record that in a comment
  where the live-animals file records its own.
- Copy idempotency: `POST /plant-products/notifications/{ref}/copies` with an `Idempotency-Key`
  header. **Transpose the pattern, not the path.** Note for accuracy — the backend keys that header
  GLOBALLY, not scoped to the source reference; that is a known shipped-code design question in
  TICKETS-TO-RAISE.md, so model what the backend actually does, not what the plan's wording implies.
- **No plant domain file may import from or extend `domain/live-animals/**`.** The two
  `commodity-codes.ts` / `document-types.ts` pairs are genuinely separate.

## 4. Scope fence

No page object, no UI flow, no journey spec — those are pp-062 onwards. Do not add a placeholder
file a reader would mistake for coverage.

## 5. `filesToTouch` IS A HYPOTHESIS

Ten consecutive increments have found the plan wrong about existing code — most recently pp-020,
where a file marked `create` had already shipped and creating it would have destroyed verified work.
pp-060 reshaped this repo hours ago, so `fixtures/ui.ts`, `flows/` and `domain/` are not where this
plan was written against. **Open them first.** Report anything already done, missing or extra.

## 6. Test accounting

The live-animals suite must be **unaffected: same count, still green**. pp-060 established the
technique — if a count moves, extract the test TITLES from `playwright --list`, sort them and diff
those, because raw list output is unusable once paths change. **No test may be deleted or renamed
without being reported.**

## 7. Hygiene

- Rollback is **`git stash push -u`** — never `reset --hard`, never `clean -fd`.
- **Do not commit** — the orchestrator lands it. **Never push.**
- Test failures are yours; "pre-existing" is not available.
- Seed files: flat in `seeds/mongodb/`, numerically prefixed, following the live-animals fixture's
  activation convention. Every seeded document carries an ownership organisation matching the auth
  stub, and one is DELETED.

## 8. Verification ladder (corrected)

```
git -C ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests branch --show-current
# stack: `tim docker dev` from the workspace root — NOT run-stack.sh -d -b (mutually exclusive)
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run database:reseed
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run typecheck
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run lint
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run format:check
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-tests run test
```

**Report numbers**, not "green": the E2E suite count, `test:live-animals` (must be unchanged from
pp-060's 138 passed / 1 skipped), `test:plant-products`, and whether you reused or rebuilt the
stack. pp-060's reference points: E2E 155 passed / 1 skipped of 156 selected; `test:local` 127;
docker-compose a11y 11.
