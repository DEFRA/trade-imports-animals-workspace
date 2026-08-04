# pp-038 — review-notification (check your answers)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

This is the largest increment left in m4: one page that reads back **every** area captured by
pp-018..pp-037.

---

## 1. The `create` trap — I CHECKED IT AND IT PASSES THIS TIME

`backlog.json` marks 22 files as `create`. Three times in this build a `create` action named a file
that already held shipped work, and following it literally would have destroyed it. **I ran the check
before briefing: `features/check-answers/` does not exist in `sets/plant-products/`.** All 22 creates
are genuine.

**Two are `edit` and both must be NET ADDITIONS** — check the diff stat and report it:
`features/index.js` and `flow/flow.js`.

## 2. ⚠ YOU WILL CHANGE A PIN pp-029 DELIBERATELY LEFT — report it, don't weaken it

`flow/flow.js:87-91` currently reads:

```js
{
  id: 'review',
  gate: (scope) => scope.readyForCheckYourAnswers,
  pages: []
}
```

**The review section has no pages.** pp-029 recorded that consequence explicitly: a Review row that
becomes available currently **falls back to the hub itself**, and it pinned that transient behaviour
rather than leaving it implicit. **This increment is what ends it** — once `reviewNotificationPage`
becomes the section's first page, the hub's Review row links to the real page.

So expect an existing hub assertion to change. **That is correct and expected.** Update the expected
value, **report before and after**, and keep the pin exact — do not delete it, do not loosen it to a
regex, do not truncate the journey to dodge it. This is the standing L1 ruling and pp-035 is the
worked example.

`answerSections` (`flow.js:101`) filters `review` out, so **no task row and no hub GROUPS change is
due** (FD-12). If you find yourself editing `task-rows.js` or `entry-guard.js`, stop and report.

## 3. ⚠ THE DECISIVE SURFACE IS SCOPE-DRIVEN OMISSION — and it fails silently in both directions

This page has seven conditional rows. Each can fail two ways, and **both are near-invisible**:

- a row that should be hidden but renders → the page reads back a value the user never entered, or an
  orphan left behind by a scope wipe;
- a row that should render but is hidden → a captured answer silently disappears from review, which
  is the one thing a check-your-answers page exists to prevent.

The seven: `movementReferenceNumber` (only when CTC = `ADD_MRN_NOW`), container rows (only when
`usesContainers` true), `grossVolumeUnit` (only when `grossVolume` answered), destination leaves (only
when `destinationSameAsConsignee` false), variety rows (only when captured),
`intendedForFinalUsers` (only for the applicable commodity group), packer rows (only when answered).

**Run a mutation on at least one of these and prove a test fails BY NAME.** The strongest is the
container rows, because pp-030 already proved orphaned container data survives a scope wipe and
renders perfectly — so a review page that renders containers regardless of `usesContainers` would
display junk the user cannot see anywhere else.

**⚠ Before you believe a green mutation, ask what the code now does differently.** This build has
twice run a mutation that preserved the behaviour it meant to break — pp-025 (optional chaining
introduced in the same edit still rejected the bad input) and pp-036 (downgrading one of six
mandatory fields could not move row completeness). **Both false versions looked exactly like
findings.** If you break an omission rule and nothing goes red, the likeliest explanation is that
your test fixture never exercised that branch — say so rather than recording it as a coverage gap.

## 4. Derived rollups must be DERIVED

Total net weight and Total packages are computed from the commodity lines at render time. **They are
never stored and carry no Change link.** The failure mode is a rollup that gets persisted as an
answer — it would then go stale the moment a line changes and nothing would catch it. Assert both
that the arithmetic is right **and** that nothing new appears in persistence.

## 5. ⚠ USE THE pp-076 SHARED AXE HELPER — do not roll a new inline one

pp-076 landed one increment ago (`753482a0`). Every plant e2e spec now imports
`journeys/linear/features/axe.e2e-helper.js`, which waits for the document to settle before
`analyze()` and returns `{ all, seriousOrCritical }`. **Import it. Do not write a new
`new AxeBuilder({ page })` block** — a fresh inline one reintroduces the teardown race the previous
increment just removed, and it would not be obvious in review.

**Pass NO `permittedConditionalRadio` argument.** This page renders no conditional radio, so it needs
no carve-out — and a carve-out copied where it is not needed silently widens the suppression surface.
pp-032 got this right for exactly this reason and it is worth repeating.

**AXE IS NECESSARY, NOT SUFFICIENT — proven twice by mutation here.** pp-024 collapsed every repeated
Remove control's `aria-label` to one identical name and **axe reported no violation at all.** This
page has **one Change link per row across nine cards** — the single most repeated-control-heavy
surface in the set. Every Change link must carry a computed accessible name naming **which row** it
changes, asserted directly, with the set of names asserted **distinct**. An axe pass alone does not
close this.

## 6. Collections are read back — the pp-026 rule applies to rendering too

Commodity lines, species, varieties, nominated contacts, accompanying documents and containers all
render as repeated structures. **pp-026's lesson was that a test named for a behaviour need not
discriminate it**: its *'exposes renumbered indices'* test only ever touched index 0, so a bug that
always hit index 0 passed 360 unit tests and 108 of 109 browser tests.

For every collection rendered here, **assert a MIDDLE entry by identity and by order**, not just that
the right number of rows appeared. A card that renders entry 0 three times would otherwise pass a
row-count assertion.

## 7. Three plan corrections — apply them, do not stop for them

1. **`verification` says `PORT=3050`. Use `PORT=3201`.** Docker holds 3000 and 3100; 3201 is what the
   whole build uses.
2. **`dependsOn` omits pp-020 (purpose) and pp-033 (nominated contacts)**, whose data this page reads
   back. `backlog.json` flags this itself. **Both are landed and done**, so there is nothing to wait
   for — proceed.
3. **No `contract.plant-products.test.js` case is due.** `meta.collects` is `[]`, so this is not a
   collecting controller. **Say so explicitly as a deliberate non-change with the reason** — pp-029
   did this well, pp-009 did not, and that is why the rule exists.

## 8. Out of scope — do not transpose them

The live-animals exemplar carries `readOnly`, `copyAction`, `deleteHref`, `cancelAmendHref` and
`amendmentCancelled` branches. **None are transposed.** No tabs, no Checks/Valid/Rejected content, no
split messages, no Copy / Copy-as-new / View-CHED / Amend / Delete controls, no Submission-information
table, no etag hidden input. This is a pre-submission draft page; lifecycle actions are pp-045+.

Legacy patterns the page spec condemns and which stay out: presentation-table, review-summary-list
clone, audit-flag, heading-with-change-link, phase-tag, ellipsis truncation. **govuk-summary-list for
all name/value content; govuk-table only where the data is genuinely tabular.** Stay inside the
govuk-frontend toolbox — no custom CSS, no client JS.

## 9. NEVER INVENT DATA

Every code→label resolution comes from the shipped reference services (`countries`, `bcps`,
`package-types`, `quantity-types`, `document-types`, `transport-options`, `gross-volume-units`,
`purposes`, `commodities`) as they are. **Seven increments have stopped rather than fabricate a
commodity, an EPPO association, a species or a fixture scenario, and every one was right.** If a
scenario the acceptance criteria ask for cannot be built from shipped fixture data, **say so and
build the nearest honest thing** — stopping twice carries no penalty; inventing one row does.

Note in particular: the fixture cannot currently produce a three-species commodity or a
`varietyClass: null` entry through the UI (that is what pp-077 exists to fix). If a review assertion
needs either, report the limitation rather than working around it.

## 10. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-076, `753482a0`) — **every one verified by me in this session**, not quoted from
a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **628** |
| `npm test` | **2,256 passed / 8 skipped** (209 test files) |
| `test:live-animals` | **559** (unchanged for the entire build — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **241 passed, zero flaky** |
| `lint:arch` | **0 errors / 0 warnings** (642 modules) |

Full ladder:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**`lint:arch` must stay 0/0.** Every reference fixture now has a consuming page, so **a new warning
means an orphan was created** — never "fix" one by deleting or force-importing a fixture. `shasum
.dependency-cruiser-known-violations.json` must stay `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**⚠ `test:live-animals` must stay at 559.**

## 11. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`; the count must match the renames
  you report. **Any test count that moves must be explained, especially downward** — pp-017 silently
  deleted three browser specs and the only tell was Playwright 13 → 11.
- **REPORT UNDER-DELIVERY PLAINLY.** If a planned file needs no change, say so with evidence.
- **`requires.maxEntries` is NOT enforced at write time** (pp-033) — only `policy.maxEntriesFrom` is.
  Irrelevant here since this page writes nothing, but do not assume the reverse anywhere.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence, not a silent edit.
- **If my brief is wrong, return `ok:false` and say so.** Two of my briefs have been wrong and both
  times the implementor was right to push back — pp-023's manifest boundary and pp-031's axe
  carve-out. A wrong orchestrator instruction costs as much as a wrong plan.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.

Exemplars to open while building:
`sets/live-animals/journeys/linear/features/check-answers/{controller.js, template.njk,
view-model/index.js, view-model/rows/*.js, view-model/cards/consignment/species/species-cards.js,
view-model/sections/documents.js}` and `sets/live-animals/.../flow.js:83-86` for the section wiring.
