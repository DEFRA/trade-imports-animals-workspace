# pp-098 — copy idempotency keys are global, in both packages

This brief **OVERRIDES** the generic `implement.md`. Repo: **trade-imports-animals-backend**, branch
`spike/trace-to-requirements`. Rollback is `git stash push -u`. **Stage, do not commit. Never run
`sonar`.**

⚠ **BACKEND INTEGRATION TESTS NEED `mvn verify`, NOT `mvn test`.** `*IT` classes run under Failsafe at
`verify`; `mvn test` runs only Surefire units and silently skips them. The plant ITs live under
`animals/integration/`. **Establish and report the baseline yourself** — the last recorded figures were
**552 unit + 219 IT**, but that was several increments ago and you must not quote it forward.

## The defect, and why it is a ruling rather than a patch

`FulfilmentService.java:114` resolves `findByCopyIdempotencyKey(key)` and returns the existing copy
**before** it resolves `findById(id)` at `:121`. So the key is **global**, not scoped to the source
resource: a client that copies notification X with key `abc`, then copies notification **Y** with the
same key, gets **X's copy** back — silently the wrong resource, with a **201 and no error**.

`PlantProductsNotificationService.copy()` behaves identically — `findCopy(idempotencyKey)` at **:152**
returns before `findByReferenceNumber` at **:159**. **So R4 holds and nothing has diverged.** This is a
**shared design question**, not a transposition defect, which is why it is one increment covering both
packages.

## ⚠ STEP 1 IS A WRITTEN DECISION, BEFORE ANY CODE

**Write the chosen semantics, the rejected options and the reason** into
`workareas/shared/plant-products-ched-pp/` as a short design note, and summarise it in your report.
**Do not start with the code.** The three options, with the trade-off stated honestly:

- **(a) Leave it.** Strict idempotency — *same key, same result* — **is** satisfied. Doing nothing is
  defensible.
- **(b) Scope the lookup to the source reference.** The same key against a different notification is
  simply a different operation. **The smaller change.**
- **(c) Compare a request fingerprint and reject a reused key carrying a different source with 422** —
  the Stripe / IETF idempotency-key practice, so a client's key-reuse bug surfaces as an **error**
  rather than as the wrong resource. **This is the practice the original investigation cited.**

**Pick one. Say why. And say what a client relying on today's behaviour would experience.** I am not
pre-ruling this — if your reading of the code makes (a) the right answer, say so and stop; a
well-argued "leave it" is a perfectly good outcome and cheaper than a wrong change.

## ⚠⚠ THIS DELIBERATELY TOUCHES SHIPPED LIVE-ANIMALS BEHAVIOUR

The standing rule that production code outside `sets/plant-products/` is off limits **is being set aside
here by Sam's explicit ruling** — *"seems worth a design and fix"*. That makes two obligations:

1. **Both packages move together, or R4 is explicitly and deliberately broken with a stated reason.**
2. **The commit body must say plainly that this changes behaviour on a shipped live-animals API
   surface**, so a future reader does not think the boundary was crossed casually.

## The test that does not exist yet

**The discriminating case is: same key, DIFFERENT source.** Today it returns the first source's copy.
Whatever the design rules, **that case must be pinned in both packages**, and the **existing
same-key-same-source replay must keep passing unchanged** — the current guarantee must not weaken.

⚠ **THERE IS ALREADY A DOWNSTREAM CONSUMER OF THIS DECISION.** pp-067 (tests repo, landed) pins **today's**
global-key behaviour with an inline comment naming pp-098:
`expect(secondLocation).toBe(firstLocation)` plus assertions that the reused key returns the **first**
source's copy. **If you change the semantics, that spec becomes wrong** — and flipping it is precisely
what proves pp-098 worked. **Do not edit the tests repo yourself.** Report exactly which assertions must
flip and I will handle it in the same session.

## Java house rules

Follow `~/git/defra/trade-imports-animals-workspace/docs/best-practices/java/`. Mirror the existing
`uk.gov.defra.trade.imports.animals` package idiom. **Compact-constructor null guards on public records
at API boundaries.** One round-trip test plus one unknown-value negative per enum — **never a test per
enum constant.**

## The mutation I expect, by failing test NAME

**Revert the scoping** so the lookup resolves the key before the source again. The new
different-source test must fail **by name, in both packages**. If it fails in only one, the two
packages have diverged and R4 is broken silently.

Report the verdict honestly, **including an INERT result**.

## Constraints

- **`mvn verify` green end to end**, both packages, and **report unit and IT counts separately**.
- **Confirm the frontend adapter needs no change rather than assuming it** — read it and say so.
- ⚠ **Do not restart or rebuild any container.** Do not touch the tests repo.
- **Any count that moves must be explained.**

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME.** If the source contradicts this brief — for
instance if the ordering is not as I describe, or if one package already scopes the lookup — **stop and
report it rather than making the source match my brief.**
