# pp-083 — pin the declaration legal copy independently, and fix two copy-rendering defects

This brief OVERRIDES the generic `implement.md`. Four files, three separate problems. All four
plan claims below I verified against source myself before writing this — they are current, not stale.

## Problem 1 — the legal copy is not independently protected

`declaration/copy/copy.test.js:31-34`, in a test named **'pins every legal list and APHA address
line'**, asserts only:

```js
expect(en.terms.items).toHaveLength(6)
expect(en.legal.regulations).toHaveLength(4)
expect(en.enquiries.aphaAddressLines).toHaveLength(7)
```

**Lengths only.** And the browser test derives its expectations from the same production copy module.
So any change to wording, ordering, a regulation citation, an address line or external link text
alters production **and its own expectations together**, and every test stays green. On a page
carrying **statutory declarations, legal conditions and data-protection text**, that is the copy
least safe to leave underpinned.

**Fix:** assert the complete English intro, terms, regulations, address lines and external-link text
against **literal contractual values written into the test**, including order and punctuation.

⚠ **The failure mode to avoid is subtle and it is the whole increment.** An assertion that reads the
value out of `copy.en.js` and compares it to itself — directly, or via a helper, or by building the
expected array from the module — proves nothing. **The expected strings must be literals in the test
file.** If a value is genuinely too long to inline, say so rather than deriving it.

**Your acceptance test:** changing **one word** in `copy.en.js` must fail a test **naming it**.

## Problem 2 — hardcoded English connectors inside accessible names

Two places build a screen-reader link name by concatenating an English word outside the copy bundles:

- `check-answers/view-model/rows/summary-row.js:25` —
  `<span class="govuk-visually-hidden"> for ${escapeHtml(label.toLowerCase())}</span>`
- `check-answers/view-model/cards/commodities.js:153` —
  `` `${cardCopy.columns.intendedForFinalUsers.toLowerCase()} for ${cardCopy.commodity(index + 1).toLowerCase()}` ``

Under Welsh this yields a **mixed-language accessible name**, and **copy-parity cannot see it because
the connector is not a copy leaf**. This is the same class as the `govukWarningText`
`iconFallbackText` defect pp-040 found.

**Fix:** move the link-name formatter into **both** bundles so each locale builds the whole string
from its own copy.

⚠ **Assert the COMPUTED ACCESSIBLE NAME, and assert names DISTINCT.** Axe is necessary and not
sufficient — proven twice by mutation on this build. And beware the locator trap that caught pp-024
and pp-079: `getByRole('link', { name: /^Change / })` puts the space **in the filter**, so a link
named exactly `Change` never enters the collection and every following assertion passes without it.
**Scope by row and assert the exact accessible name.**

⚠ **A Welsh-rendered assertion is the only one that can discriminate here** — pp-040's lesson. In
English the connector and the correct value may coincide; in Welsh they cannot. Pin it in Welsh.

## Problem 3 — every table caption is visible, so two headings are announced twice

`check-answers/template.njk:23-24` applies one hardcoded `captionClasses: "govuk-table__caption--s"`
to **every** table, and every caption is visible. For **nominated contacts** and **accompanying
documents** the caption duplicates the adjacent card heading, so it is announced twice.

**Fix:** make caption classes part of **each table model**, `govuk-visually-hidden` where the caption
equals its card heading, **keeping visible captions for the distinct commodity tables.**

⚠ **Do not hide all captions and do not leave all visible.** Both are one-line changes that make the
suite green and get the increment wrong. The commodity tables' captions are genuinely distinct from
their card heading and must stay visible. **Pin both sides** — a test that only proves the hidden
case cannot detect a later change that hides the commodity captions too.

## Standing rules that apply here

- **This increment touches production code inside `sets/plant-products/`, which is in scope.**
  Anything outside that directory is not: report it as `ok:false` with evidence rather than editing.
- **L1 shape assertions are in scope to UPDATE, never to WEAKEN.** Keep exact equalities exact and
  report before/after for anything you change.
- **Welsh: keep writing machine-draft Welsh and keep the MACHINE-DRAFT banner.** There is a
  Welsh-speaking tech lead who reviews the copy once it is complete. **Mention it once at most** —
  it is covered and does not need escalating.
- **Do not weaken an assertion to fit a refactor.** pp-080 moved substring → exact matching, a real
  gain, and silently dropped section scoping at the same time; the diff stat and a green ladder both
  hid it. **Report every assertion you change, before and after.**
- **Any test count that moves must be explained**, especially downward.

## Baselines — I ran these myself at `348cbd00`. Re-run them; do not quote them forward

- plant unit `test:plant-products` — **693 (58 files)**
- `npm test` — **2,331 passed / 8 skipped (217 files)**
- `test:live-animals` — **559**. **Unchanged for the entire build; movement is a REGRESSION.**
- `lint:arch` — **0/0, 671 modules, 2,128 dependencies**; known-violations shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a` must not change
- plant Playwright `test:features:plant-products` — **256** (use **`PORT=3201`**)

**Do not predict a `lint:arch` module count for a new `.test.js`** — `.dependency-cruiser.cjs:181`
excludes `\.test\.js$`. **If anything in this brief contradicts the source, the source wins — say so
with file and line rather than making the code match my number.** Five orchestrator briefs on this
build have been wrong and the implementor was right every time.

## Decisive mutations to run and report

1. Change one word in a `copy.en.js` legal string → must fail a test **by name**.
2. Restore the hardcoded ` for ` connector in **one** of the two sites → must fail a
   **Welsh-rendered** accessible-name assertion by name.
3. Make a commodity table's caption visually hidden → must fail by name.

For each: **say what the code now does differently before believing the result.** A green-then-red
run proves nothing if the mutation did not change behaviour — got wrong three times on this build.
Restore each byte-identically and confirm an empty diff against the index.

## Verification

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint:arch
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Plus the plant Playwright suite with `PORT=3201`, and copy-parity / copy-convention must stay green.

Leave the work **staged, not committed.** Report every count, every assertion changed with
before/after, the three mutation results by test name, anything you deliberately did not do, and
**anything you could not verify yourself.**
