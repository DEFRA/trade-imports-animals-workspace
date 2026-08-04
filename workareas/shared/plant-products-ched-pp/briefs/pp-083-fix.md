# pp-083 — fix brief

**`git status` FIRST. Your predecessor's work is STAGED and must be PRESERVED. Do not start over, do
not unstage, do not revert, do not commit.**

**One finding to fix.** Three other review findings are on already-landed pp-039 copy and are being
raised as a separate increment — **do not touch any copy bundle or `declaration/copy/copy.test.js`.**

## The finding — the caption assertions pin CSS mechanics, not the announced outcome

`review-notification.e2e.spec.js:1002-1010` asserts a duplicate caption is hidden via:

```js
await expect(duplicateCaption).toHaveClass(/govuk-visually-hidden/)
await expect(duplicateCaption).toHaveCSS('position', 'absolute')
await expect(duplicateCaption).toHaveCSS('width', '1px')
await expect(duplicateCaption).toHaveCSS('height', '1px')
await expect(duplicateCaption).not.toHaveClass(/govuk-table__caption--s/)
```

**This does not discriminate the outcome it exists to protect.** The intent is *"the caption is still
announced once, and is not shown twice visually"*. These assertions pin the CSS recipe instead.

**⚠ I VERIFIED THE HOLE EMPIRICALLY IN A BROWSER — do not re-derive it, and note it refutes the
obvious objection.** I rendered two tables and took the accessibility snapshot:

| Caption style | Table accessible name | Caption node in a11y tree |
|---|---|---|
| `display:none` | **"Hidden Caption" — still named** | **ABSENT** |
| `position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0)` | named | **PRESENT** |

I had assumed a `display:none` caption would cost the table its accessible name and make the
`getByRole('table', { name: caption, exact: true })` locator fail to resolve. **It does not** —
Chromium still computes the table's name from a `display:none` caption. So the locator does **not**
guard against it, and a caption that keeps the class but gains `display:none` would satisfy every
assertion above while **disappearing from the accessibility tree entirely** — announced zero times
rather than once, which is a worse regression than the one the increment fixed.

**Fix:** keep the class assertion, and add an assertion that the caption **is present in the
accessibility tree** — an ARIA snapshot of the table containing the caption node is the shape the
review recommends and my table above shows it discriminates cleanly. Also pin the clipping/overflow
properties that actually distinguish a clipped caption from a fully visible one, since
`position/width/height` alone do not.

**Prefer assertions that pin the announced outcome over ones that pin CSS mechanics.**

**Do not weaken the visible-commodity-caption side while you are in here.** Both directions must stay
pinned independently: a duplicate caption hidden-but-announced, and the distinct commodity captions
visible.

## Mutations you must run and report, by test name

1. Give a duplicate caption `display:none` **in addition to** `govuk-visually-hidden` → your new
   assertion must fail. This is the hole; prove it is closed.
2. Make a duplicate caption fully visible → must still fail (the existing direction).
3. Hide a commodity caption → must still fail (the opposite direction).

For each, **say what the page now does differently before believing the result.** Restore each
byte-identically and confirm an empty worktree diff against the index.

## Out of scope — do not touch

- **`declaration/copy/copy.en.js`, `copy.cy.js` and `declaration/copy/copy.test.js`.** The unmatched
  closing quotes and the "used issued" typo are **faithful transcriptions of upstream IPAFFS
  defects**, confirmed against `workareas/shared/trace-requirements/ched-pp/pages/declaration.json`
  lines 39, 52, 60 and 484. They are landed pp-039 copy and are a content-designer plus legal
  decision, not a developer tidy-up. **They are being raised as their own increment. Leave the
  literal pins exactly as they are** — pinning the current text is correct and deliberate.
- Any production file outside `sets/plant-products/`.

## Verification

Re-run and report exact numbers. Pre-fix state: plant unit **698** (58 files), full **2,336 passed /
8 skipped** (217 files), live-animals **559**, plant Playwright **257**, `lint:arch` **0/0** (671
modules, 2,131 dependencies), known-violations shasum
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Plus the plant Playwright suite with **`PORT=3201`**. **live-animals must stay at exactly 559.**

Leave the work **staged, not committed.** Report the three mutation results by test name, every count,
any assertion you changed with before/after, and anything you could not verify yourself.
