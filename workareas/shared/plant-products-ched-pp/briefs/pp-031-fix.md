# pp-031 FIX — the axe finding has established house handling; my brief failed to say so

Your pp-031 work is staged and **correct**. **Do not start over, do not revert, do not re-run the
increment.** `git status` first: the tree is staged. This is one focused change to the e2e spec, plus a
mutation to prove it.

**You were right to stop rather than suppress a critical axe finding on your own judgement.** That is
the behaviour these briefs ask for and I would rather have this stop than a silent waiver. But the
conclusion — that a platform or upstream increment is needed first — is wrong, and that is my fault:
my brief never mentioned the established handling for this exact defect.

## This is a known GOV.UK Frontend false positive with a precedent in six shipped specs

GOV.UK Frontend's stock conditional-radio script adds ARIA attributes to the controlling radio, and
axe 4.12's `aria-allowed-attr` rejects that generated node. **It is not our markup and not our defect.**

The house pattern already exists in **pp-030**, which I reviewed and landed —
`sets/plant-products/journeys/linear/features/transport/transport-before-bip.e2e.spec.js:132-152` —
and in **five live-animals specs**:

- `features/transport/e2e/arrival-transit.e2e.spec.js`
- `features/transport/e2e/transporters.e2e.spec.js`
- `features/commodities/e2e/identification.e2e.spec.js`
- `features/addresses/e2e/hub-picker.e2e.spec.js`
- `features/origin/origin.e2e.spec.js`

So following it is house practice, not inventing an exemption.

## What the filter must look like, and why each part matters

Copy pp-030's shape and scope it to **your** radio. Its discipline is the whole point:

```js
const stockConditionalRadioFalsePositive =
  id === 'aria-allowed-attr' &&
  nodes.every(
    ({ html, target }) =>
      html.includes('class="govuk-radios__input"') &&
      html.includes('aria-controls="conditional-<yourFieldName>"') &&
      target.length === 1 &&
      target[0] === '#<yourFieldName>'
  )
```

- **The rule id must be exactly `aria-allowed-attr`.** Any other rule stays fatal.
- **EVERY node must be the one specific radio**, matched on its class, its exact `aria-controls`
  target, and a single-element `target` array. If axe reports the same rule on any other node, the
  whole finding stays fatal.
- **The unfiltered list is still returned** and still printed in the failure message, so nothing is
  hidden from a human reading a failure.

**Match the node that is ACTUALLY generated for your page.** You reported `aria-expanded`; pp-030's
code matches `aria-controls` (its comment says `aria-expanded`, which is a stale comment). Read your
real axe output and match what is really there — do not copy pp-030's literals blindly, and do not
broaden the match to cover both attributes unless both genuinely appear on that node.

## Prove the filter does not over-suppress

A carve-out that hides more than the one false positive is worse than the failing test. **Run this
mutation and report the result:**

Introduce a genuine, different accessibility defect on the same page — the cleanest is emptying a
fieldset legend, which is the exact defect ruling c-014 exists to prevent — and confirm your axe test
**still fails**. Then restore byte-identically and confirm `git diff` is clean against the index.

Note what pp-017 proved: an empty legend leaves axe green at serious/critical while an explicit
accessible-name assertion catches it. So if the axe scan does not go red on that mutation, use a defect
axe *does* detect (a duplicate id, or an input with no label at all) — the point is to prove the filter
does not swallow real findings, not to re-prove pp-017.

**Also keep asserting computed accessible names directly**, as the original brief required. The axe
scan is necessary and not sufficient, and that is exactly why a narrow filter is acceptable: the
accessible-name assertions are doing the real work.

## Rules for this pass

- **Spec change only.** The production template and controller are correct as staged — do not alter
  what renders to dodge the axe rule.
- **NO TEST DELETED.** All three axe states (collapsed, expanded, error) must remain and must pass.
- Re-run the ladder and confirm these, which I verified myself at the staged state: plant unit **478**,
  `npm test` **2,093 passed / 8 skipped**, live-animals **559**, `lint:arch` **0 errors / 0 warnings**.
  Plant Playwright should reach **170** (158 baseline + 9 functional + 3 axe).
- **⚠ pp-076 flake:** axe-core occasionally throws `Cannot read properties of null (reading
  'documentElement')` in an unchanged commodity axe test — a teardown race, not a violation. If you hit
  it, say so and re-run. Do not confuse it with the finding you are fixing.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
