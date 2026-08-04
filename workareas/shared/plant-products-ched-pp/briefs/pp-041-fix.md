# pp-041 — fix pass. The blocker was MY acceptance criterion, not your work.

**FRONTEND repo.** **Your work is already staged across five files — `git status` first and preserve all
of it.** Playwright needs **`PORT=3201`**.

## You were right, and I checked it myself rather than taking your word for it

You returned `ok:false` because a direct GET of `review-notification` renders for an incomplete
notification instead of redirecting. **That is correct, and the criterion demanding otherwise was
wrong.**

I traced it: `sectionGatePasses` has exactly **two** production consumers in the whole application —
`live-animals/.../features/hub/controller.js:81` and `plant-products/.../features/hub/controller.js:77`.
**Both are the hub. Neither set enforces the section gate on a page GET.** So the behaviour you found is
a faithful transposition, not a plant defect, and no set has ever done what the criterion asked.

I wrote that criterion during my own re-plan a few hours ago by carrying it forward from the round-1
plan without checking it against the source. **Tenth correct implementor pushback on this build.** The
acceptance criteria in `backlog.json` are amended and the finding is recorded for Sam as a shared design
question.

**Your second blocker was right too.** `commodity-bulk-details.controller.js:215-217` commits
`finishedOrPropagated` only when `isPlantsForPlanting(commoditySelection)` — which `0808108090` is not.
Omitting a field the system cannot store, rather than claiming a false stored shape, is exactly right.
**Leave the fixture as you built it** and keep whatever note you put there explaining the omission.

## The one change: assert what the system actually guarantees

Rewrite the gating test so it pins the two real guarantees instead of the imaginary one:

1. **The hub withholds the review link** while a mandatory row is incomplete, and **exposes it exactly
   when the last one completes.** You already have this half working — keep it, and make sure it runs in
   **both** directions in one test: incomplete → no usable link; complete the missing row → link
   appears. A lock test that only ever observes the locked state proves nothing about unlocking.
2. **An incomplete notification cannot be submitted.** `engine/write/submit.js:9` returns `ok: false`
   when `readyForCheckYourAnswers` is false. Reach that through the UI: with a mandatory row incomplete,
   go to the review URL by deep link (which, as you found, renders) and attempt to submit — the
   notification must **not** reach confirmation and must **not** be finalised.

**Name the test for what it now proves.** The old name promised a redirect; if yours still implies one,
rename it and report before/after.

**Do NOT add a production guard.** Not in the entry guard, not in `check-answers/controller.js`, not in
`kit`. That is Sam's call because it spans both sets, and a plant-only fix would create exactly the
divergence the standing rules prevent. **If you find yourself editing anything outside a test or the
fixture, stop and report `ok:false` again.**

**Do not assert the deep link redirects.** It does not. If you want to record the current behaviour,
assert it plainly — that the page renders — and let the submit guard carry the protection claim. Do not
dress a known gap up as intended behaviour.

## Everything else stays

Your five staged files, the `happy-path.json` fixture, the five re-based task-row objects with the
transport one deliberately left inline, the `journeys-plant-products` project, both npm scripts, and the
mount assertion you restored after proving the shared-content version stopped discriminating — all
correct, all keep.

## Verify, and re-run what this change can affect

- `PORT=3201 npm run test:e2e:plant-products` — must now be **fully green**, not 1 passed / 1 failed.
- `PORT=3201 npm run test:e2e:all` — must be fully green.
- `npm run test:plant-products` (**729** after your change), `npm test`, `npm run test:live-animals`
  (**559** — necessary but **not** sufficient, say so), `npm run lint`, `npm run lint:arch`,
  `co-residency.test.js`, then `npm run format`.
- Report the test count and explain any movement. A rename is a removal plus an addition — say so.
- **Stage, do not commit.** Never run `sonar`.

## Prove it

Report by failing test **name**:

1. With the mandatory row restored, break the hub's link-withholding expectation — the test must fail.
2. Make the submit attempt succeed in your test's setup (i.e. complete the row) and show the
   "cannot submit" assertion fails — proving it discriminates readiness rather than passing because
   submission is hard to reach.

**Say what the code does differently before believing any result.** An inert mutation has falsely
confirmed and falsely refuted on this build, so verify the vehicle, not just the outcome.
