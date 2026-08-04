# pp-038 — FIX pass

**`git status` FIRST. Your work is present but UNSTAGED. Do NOT start over and do NOT revert anything.**
`features/check-answers/` is untracked; `features/index.js`, `flow/flow.js` and
`features/hub/controller.test.js` are modified. Preserve all of it.

Three items. **Item 1 is the important one** — it is a gap in what your tests prove, not a broken
test. Items 2 and 3 are the two red Playwright tests, and I have already diagnosed both to the line so
you do not need to re-investigate.

The work itself is good: 22/22 unit tests, the container mutation failed by name
(*'omits orphaned container rows when usesContainers is false'*), and you correctly rejected an
earlier mutation because it preserved behaviour. That is the standard.

---

## 1. ⚠ THE FLOW WIRING IS UNPINNED — I PROVED IT, AND WHAT YOU REPORTED AS A PIN IS A MOCK

You reported: *"The hub assertion remains pinned and changed exactly from `/notification-view` to
`/review-notification`."*

**That edit discriminates nothing.** `hub/controller.test.js:62-66` is
`mocks.sectionEntry.mockReturnValue('/plant-products/notifications/journey-1/…')`. You changed the
**mock's return value** and the matching expectation together. A test that mocks the very function
under question, then asserts the mock's own return value, passes for any string — including the
previous one, which was `notification-view`, the **live-animals** page id sitting in a plant test.

**I ran the decisive mutation myself.** I reverted `flow/flow.js` to `pages: []` — removing
`reviewNotificationPage` from the review section entirely — and ran the plant unit suite:
**650 passed, zero failures.** So the single line that makes this page part of the journey, reachable
from the hub and reachable by `nextInSection`, is protected by **no unit assertion at all**. Restored.

This is the pp-026 class exactly: a test named for a behaviour that cannot detect the behaviour
breaking. **Add a real assertion that does not go through a mock**, proving the review section's
`pages` array contains `reviewNotificationPage` — that reverting `flow.js` to `pages: []` fails it by
name. Assert against the real `sections` export from `flow.js`, not a mocked `sectionEntry`.

**Do not weaken or delete the existing hub controller test** — its mock edit is fine as far as it
goes. Add the missing coverage alongside it. Report the new test's name.

While you are there: consider whether the hub controller test mocking `sectionEntry` at all is
hiding more than this one case. **Report what you find; do not embark on a refactor.**

## 2. `destinationCountry: 'GB-ENG'` IS NOT AN OPTION ON THAT PAGE — spec setup bug

`review-notification.e2e.spec.js:397` sets `destinationCountry: 'GB-ENG'`, and
`selectOption` times out because the option does not exist.

**Diagnosed to the line, so do not go looking:** the destination select is built from
`countryOptions()` (`traders-addresses.controller.js:121`, validated the same way at `:270`), and
`countryOptions()` **excludes all four UK subdivisions**
(`services/reference/countries.js:271-273` filters out `UK_SUBDIVISION_CODES`). `GB-ENG` exists in the
fixture but is only offered through `ukSubdivisionOptions()`, which this page does not use.

**Fix:** use a country the select actually offers. The shipped pp-035 spec uses `'FR'`
(`traders-addresses.e2e.spec.js:71`).

**⚠ But do NOT simply copy `'FR'` — your `packerCountry` is already `'FR'`.** If the destination and
the packer carry the same country, a review card that renders the packer's address under the
destination heading (or vice versa) **passes the test**. Give them **different** valid codes so a
card mix-up is detectable, and assert both cards' country values distinctly. This is the same reason
pp-024's accessible-name assertion asserts the set of names is *distinct*.

**This is NOT yours to fix, but confirm you have not worked around it:** the destination select offers
no way to express a UK delivery address at all — no UK subdivision and no plain `GB`/`United Kingdom`
entry exists in `COUNTRIES`. I verified that in the shipped source. It is a real pp-035 defect and I
am reporting it to Sam separately. **Do not change `traders-addresses` production code to fix your
test.**

## 3. TWO CRITICAL AXE VIOLATIONS — a real defect in your template, one wrong argument

`review-notification.e2e.spec.js:618` fails with `button-name` (critical, *"Buttons must have
discernible text"*) on
`<button type="submit" value="hub" name="exit" class="govuk-button govuk-button--secondary">` with
empty inner text, plus an empty `<a class="govuk-link" href="/plant-products/notifications/…">`.

**Root cause, diagnosed to the line.** `template.njk:41` calls:

```njk
{{ saveActions(hubHref, { text: copy.continue }, sharedCopy) }}
```

The macro (`shared/save-actions.njk:3`) is `saveActions(hubHref, primary, copy)` and reads
`copy.saveAndReturnToHub` and `copy.cancelAndReturnToHub`. Those live at
**`sharedCopy.saveActions.*`**, not at `sharedCopy.*` — so both resolve undefined and render empty.
Every shipped plant template passes `copy = sharedCopy.saveActions`
(`contact/template.njk:54`, `goods-movement/template.njk:105`).

**Fix:** pass `sharedCopy.saveActions` as the copy argument, keeping your primary-button override so
the review page reads *Continue* rather than the *Save and continue* misnomer (nothing is saved here —
`meta.collects` is `[]`). Match the house call style.

**⚠ THE REAL LESSON HERE, AND I WANT IT IN YOUR REPORT.** 22/22 unit tests passed while the page
rendered a button with no accessible name and a link with no text. **The controller test asserts view
data, not rendered markup**, so nothing at unit level could catch it. The axe scan did — which is what
the ladder is for. **Do not "fix" this by relaxing the axe assertion or filtering the rule.** There is
no carve-out on this page and there must not be one; this is a genuine violation, correctly caught.

## 4. Ladder

Run the full ladder this time — the previous pass stopped before reaching it.

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

Baselines at HEAD (`753482a0`), all verified by me:

| Leg | Baseline | Expected after pp-038 |
|---|---|---|
| plant unit | 628 | up (650 with your work, +1 for item 1) |
| `npm test` | 2,256 / 8 skipped | up by the same |
| `test:live-animals` | **559** | **559 — a change is a REGRESSION** |
| plant Playwright | 241 | up |
| `lint:arch` | **0 / 0** | **0 / 0** — a new warning means an orphan |

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**Use the pp-076 shared axe helper** (`features/axe.e2e-helper.js`) — do not reintroduce an inline
`new AxeBuilder` block, and pass no `permittedConditionalRadio` (this page renders no conditional
radio).

**NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
`git diff -U0` and `grep -cE "^- *(it|test|describe)\("`.

Run `npm run format`. **Stage everything but do NOT commit** — leave it staged and report.
