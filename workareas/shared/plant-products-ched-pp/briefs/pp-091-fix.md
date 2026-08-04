# pp-091 fix brief — one finding, from the orchestrator's own mutation

**⚠ RUN `git status` FIRST. The pp-091 work is STAGED and must be PRESERVED** — one file,
`check-answers/review-notification.e2e.spec.js`, carrying the new test
*'full journey profile keeps a middle entry and distinct identifiers in every collection'*.

**DO NOT start over, do not revert, do not re-implement pp-091.** You are **extending one test** that
is already correct. **Test-only. No production code.** Do not commit.

## The finding — the pin guards cardinality and identity, but not VARIATION

The new pin asserts each collection has **≥3 entries** with **distinct identifiers**. Both are right and
both are proven. But the profile also deliberately **alternates boolean fields**, and that property is
unguarded.

**I proved it by mutation.** I flattened all three nominated contacts to `agent: false` in
`journey.e2e-helper.js` and ran the review spec: **5 passed, nothing failed.** The Agent column then
renders a uniform "No", and a bug rendering that field wrongly would be undetectable — because
`tableExpectations()` derives `yesNo(contact.agent)` from the same object the driver fills from.

**That is exactly the coupling pp-091 exists to break, one level deeper**: cardinality is now pinned,
but the *discriminating values inside* the entries are not.

## What to do — extend the EXISTING test, do not add a second one

Add a variation assertion to the same test, for the boolean fields that genuinely alternate today.

**I derived this list myself; re-derive it and correct me with evidence rather than making the fixture
match me** — my briefs have been wrong seven times on this build:

- `fullJourneyValues.transport.containers[].officialSeal` — `false / true / false` (~`:174`–`:176`)
- `fullJourneyValues.nominatedContacts[].agent` — `false / true / false` (~`:194`, `:200`, `:206`)
- `fullJourneyValues.commodities.lines[].testAndTrial` — `false / true / false` (~`:127`, `:139`,
  `:156`)

**Assert each of these carries BOTH `true` and `false` across its collection**, with a message naming
the field, so flattening it fails **by name**.

## ⚠ EXCLUDE `controlledAtmosphereContainer`, AND SAY WHY IN THE TEST

`commodities.lines[].controlledAtmosphereContainer` is **`false` on all three lines** (~`:121`, `:136`,
`:153`). It does **not** alternate, so including it would fail immediately.

**Do not "fix" that by changing the fixture** — that would be inventing journey data to satisfy a test,
and the fixture drives real page interactions. **Exclude it, and leave a short note in the test saying
its `true` branch is unexercised in the full profile**, so the gap is recorded rather than hidden. If
you think that deserves its own increment, say so in your report and I will raise it — **do not raise
it yourself and do not widen the fixture.**

## Frame the assertion as a RULE, not as today's contents

Same discipline as the ≥3 pin: assert **"both values present"**, not the exact sequence
`[false, true, false]`. Reordering the entries, or adding a fourth, must not fail it. Only **flattening**
must fail.

## Prove it

1. Flatten `agent` to all-`false` → the test must fail **by name**. Report the name and message.
2. Flatten `officialSeal` → same.
3. Flatten `testAndTrial` → same.
4. **Restore `journey.e2e-helper.js` byte-identically** and re-run to green.

**⚠ `journey.e2e-helper.js` is NOT part of the staged change and must end byte-identical to HEAD.**
`git status` must show only `review-notification.e2e.spec.js` modified when you finish. **Delete any
`.bak` file your editing leaves behind.**

**Say what changed before believing any result.** On this build an inert mutation has falsely
*confirmed* a finding as recently as pp-078, where a green run convinced both me and the reviewer a pin
was missing when the guarantee lived elsewhere.

## Keep everything that is already there

The ≥3 pin, the distinctness pin, the *why three* comment citing pp-026, and **every existing derived
read-back assertion** stay exactly as they are. If you find yourself deleting or loosening one, stop —
that is the pp-080 shape, where a rewrite strengthened one axis and silently weakened another.

## Baselines — I ran these myself

plant Playwright **259** (pp-091 added one; **it must not fall**, and adding assertions to the existing
test should not change it); plant unit **728**; npm test **2,366** / 8 skipped (217 files);
`test:live-animals` **559** — **a change is a REGRESSION**; `lint:arch` **0/0**, **671** modules,
**2,127** dependencies; shasum `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

Any test count that moves must be explained:
`git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.

Run `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
