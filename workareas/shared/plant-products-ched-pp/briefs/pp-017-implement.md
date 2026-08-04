# pp-017 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-017** — "import-type — certificate type entry filter (full page build)".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

The full spec — files, acceptance criteria, rulings, headless decisions, verification ladder — is in
`backlog.json` under this id. Read it there; it is the contract. This file adds what the plan cannot
tell you: where it is most likely to be wrong, and which of its claims must be proved rather than
assumed.

This is the **first full page build in the plant-products set**. Everything before it was platform,
fixtures and skeletons. Get the shape right and nine more pages follow it.

---

## 1. `filesToTouch` IS A HYPOTHESIS — six of its nine entries say "edit"

Those six assume pp-007 left a skeleton in a particular shape and pp-009 left the entry guard and
`RUN_STEPS` in another. **Open each file first and record what is actually there** before you plan a
line of work. Five times this session a plan's claim about existing code has been false:

- pp-009's plan listed five production edits that were **already delivered** — it made none of them,
  and the increment was still complete. It just didn't say so.
- pp-010's plan notes contained a confident, load-bearing, **false** claim about how set context
  resolves.
- pp-014's plan named the **wrong commodity** outright.

So: if a file listed as `edit` already contains the behaviour, **do not manufacture a diff to match
the plan** — say so in the report and move on. If a file listed as `create` already exists, say that
too. And if you deliver fewer files than the plan lists, **report it plainly with the reason**;
silent under-delivery is as dangerous as silent scope creep.

Also verify the exemplar before transposing it. The plan claims
`sets/live-animals/journeys/linear/features/import-type-filter/` was "verified live this session"
and describes its controller pattern in detail (`requiredOneOf`, `recoverableSave`,
`NOT_AVAILABLE_SLUG`, `beginOpeningRun`/`inOpeningRun`/`nextRunTarget`/
`hasCommittedNotificationAnswers`). **Read it and confirm.** If the real exemplar differs, follow
the real exemplar and report the divergence.

## 2. The three pins that must be MUTATION-PROVED

Ask of each: *what would this test do if the behaviour were wrong?* Construct the violation, watch
it fail, restore byte-identically, and **report the exact failure message**. If a mutation does not
turn the suite red, the test is decorative — fix the test and report that you found it insensitive.

**(a) FD-8 — `importType` must never reach canonical fulfilment or the backend document.**
This is the highest-value pin in the increment and it is silently violable: writing the answer to
both stores looks completely correct in a browser and passes every functional assertion. Write a
test that fails if `importType` appears in canonical fulfilment or in the outbound document, then
prove it by *actually committing it there* and watching the test go red. A test that only asserts
it *is* in the flow-only store does not prove it is *absent* from the other two.

**(b) c-014 — the radio group has a real accessible name.**
The whole point of this ruling is that IPAFFS shipped a radio group with an empty legend, so the
group had no accessible name. Do not rely on the axe scan alone to hold this — assert the computed
accessible name of the group directly, then mutate the template to drop the H1 out of the legend
and confirm your assertion (not just axe) goes red. An axe pass is necessary, not sufficient.

**(c) Server-side-only validation.**
Prove the negative: a crafted POST carrying a value outside the four allowed tokens must take the
same 400 path. Construct that request in a test — a UI-driven test cannot reach it, because the UI
only ever offers the four.

## 3. c-024 — proving an ABSENCE needs more than a grep

The acceptance says "no overdue-debtor disclosure exists **anywhere** on the page": no disabled
radio, no hint, no debt disclosure, no throw-on-POST. Note pp-057's lesson — **an acceptance grep
written as an exact literal proves that literal is absent, not that the class is.** Assert against
the rendered DOM (no `disabled` attribute on any radio, no hint elements in the group, exactly four
radios and nothing else in the fieldset) rather than grepping the source for a phrase.

## 4. Copy and model boundaries — both are load-bearing here

- **No display logic in the model.** Labels, captions, hints, the button label, the error string and
  the holding-page copy are bilingual copy in `copy.en.js` / `copy.cy.js`. Radio *values* are the
  house tokens `live-animals|poao|hrfnao|plants` (decision 1) — never IPAFFS codes, never the label.
- **Both languages, and they must differ.** `copy-parity` and `copy-convention` are parameterised
  across both sets and will catch an identical Welsh/English leaf. Welsh copy is required; do not
  ship English strings in `copy.cy.js`.
- **c-018:** exactly one canonical error string, `'Select the type of import'`, in Joi voice.
- **c-004:** the shared 'There is a problem' error summary, linking to the `importType` control.
- Stay inside the **govuk-frontend toolbox** — govuk-* components and utility classes, no custom CSS.

## 5. Scope and hygiene

- **No file outside `src/server/app/sets/plant-products/` may change**, with the single named
  exception of `src/server/app/contract.plant-products.test.js`. If you believe another change is
  forced, **stop at `ok:false` and make the argument with evidence** — do not make it. (pp-007 was
  allowed a forced breach, but only after proving it with a mutation that turned 261 tests red.)
- Do **not** regenerate `.dependency-cruiser-known-violations.json` — shasum must stay
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `lint:arch` currently emits **8 advisory orphan warnings** (`countries.js`, `bcps.js` and the six
  pp-016 vocabulary modules) — 0 errors, still green, expected, and they clear as pages consume the
  fixtures. **Do not "fix" them.** This page consumes none of them, so expect 8 still. Report the count.
- Run the **baseline first** (`npm run test:plant-products`, expect **154**). A red baseline means
  stop and report.
- Run `npm run format` before finishing. **Do not commit** — the orchestrator lands the work.
- Both axe states (initial render, error state) must pass wcag2a/wcag2aa with **no rule filters**
  and zero serious/critical violations. Axe checks live in the co-located e2e spec.

## 6. If something needs a decision

Make the call yourself, implement it, and **flag it in the report** — do not stop and wait. The two
things the plan already knows are unreviewed (the not-available holding-page wording, and
'Save and continue' here vs live-animals' 'Continue') are recorded as open questions; you do not
need to resolve them. But **never invent data or a requirement to get past a blocker** — if a
required fact is genuinely unavailable, stop at `ok:false` and say what you could not find and
where you looked. Stopping twice carries no penalty.

## 7. Verification ladder (from the increment)

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE first, expect 154
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**, not "green": plant-products unit count, full `npm test` count,
`test:features:plant-products` count, and lint:arch errors/warnings. Current baseline:
`test:plant-products` **154**, `npm test` **1,733 passed / 8 skipped**, `test:live-animals` **559**
(must be unchanged — set-only work cannot touch it; run it and report it),
`test:features:plant-products` **13**.
