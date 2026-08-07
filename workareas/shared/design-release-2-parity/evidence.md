# Evidence base

Both sides are now captured from a **live render** and diffed model-to-model.

## The cartographer

One extractor drives both, so the two sides produce directly comparable JSON:
h1, `<title>`, headings, field order, labels, hints, option lists,
summary/task lists, cards, tables, buttons, links, inset/warning/details text.

Harness: `harness/` — `playwright.config.js` (DR2), `fe.config.js` (frontend),
`e2e/page-model.js` (the shared extractor), `e2e/dr2.spec.js`,
`fe/frontend.spec.js`, `fe/extras.spec.js`. Page models for both sides are in
`capture-model/` (`dr2-*` and `fe-*`).

## DR2 side

GOV.UK Prototype Kit booted in **dev** mode on port **3010** — clear of the
workspace stack's 3000/3001/3007/3100/3200. 8 walks, all green: dashboard
surfaces, address book, reason-for-import error state, full cattle-by-air
journey, transit-countries branch, permanent-address branch, view-submitted →
amend → cancel-amend, empty hub/review. **58 captures across 40 screens.**

### Scope check — DR2 only

Every navigation goes through `BASE = '/design-release-2'`. The only unprefixed
URLs are `/address-book`, `/address-book/add`, `/address-book/add/lookup` — and
that is DR2's own design: `app/lib/version-mount.js:45` (`isSharedExternalPath`)
deliberately excludes the address book from prefixing so DR1 and DR2 share one.

The design repo's existing `journey-demo/` suite drives **Design release 1**
(root URLs) and was **not** run. Its per-page fill helpers were imported as a
widget-driving library only — and they broke against DR2 in five places
(reason-for-import, arrival-details, address sub-pages, contact address, animal
identification), which is itself evidence the two releases diverge.

## Frontend side

**Re-captured 2026-07-31 against `66e69c81`.** Working tree clean and the
`:3100` image was built after HEAD, so the capture is exactly that commit.
Baseline for the diff was the 2026-07-30 capture of the same screens.

The workspace stack's **test target** on `localhost:3100`
(`docker/stack/frontend.compose.yml`, profile `test-target`,
`LIVE_ANIMALS_MODE=real`). Its OIDC redirect is registered on `localhost:3100`,
so the whole sign-in dance stays on that host.

### What moved between the two captures

Three commits account for all of it:

| Commit | Effect on parity |
|---|---|
| `d952d49c` adopt the MoJ date picker for all date inputs (p-234) | **closes A4** — all three journey dates now match DR2 |
| `bc285d71` drop accessible-autocomplete for plain selects; commodity checkboxes (p-236) | **widens B1, B2, B7, B8** — country/port become plain selects, transit-countries and commodities become checkbox groups |
| dashboard work | **narrows E1** — keyword search plus Amend / View notification / Cancel amendment card actions |

`bc285d71` is a deliberate ruling, recorded in
`workareas/shared/promotion/AUTOCOMPLETE-ASSESSMENT.md`, with "enhanced search
returns as a later round" stated in the commit. The spec treats the resulting
gaps as scheduled work rather than defects.

Unchanged: hub grouping, review-page title and sections, the reason-for-import
and transporter page splits, and the "Save and return to hub" wording
(`src/server/app/shared/copy.en.js:44`).

### Harness note

`fe/` specs run alphabetically, so `extras.spec.js` lands before
`frontend.spec.js` and its good dashboard capture gets overwritten by the
mid-navigation one. Re-run with `--grep "dashboard and notification-level"`
after a full pass, or rename the specs to fix the order.

Sign-in uses the tests repo's canned Government Gateway user
(`repos/trade-imports-animals-tests/page-objects/auth/sign-in-page.ts` —
`2100010101`). **27 captures across 26 screens**, walked on notification
`GBN-AG-26-CEFJ7D`.

One draft notification was created on the test target to walk the journey.
Nothing was submitted, so no downstream events were emitted.

### What is still source-derived

- **`confirmation`** — reachable only after a real submission; not captured.
  Its content in the spec comes from `features/confirmation/copy.en.js`.
- **`cancel-amend`** — redirects to the dashboard unless the notification is
  actually being amended. Content from `features/cancel-amend/copy.en.js`.
- **Populated states** — the walk captured empty pages. Conditional fields that
  only appear once a commodity is chosen (the unweaned-animals question, the
  per-species quantity inputs, the identification rows) are read from
  `features/*/copy.en.js` and `template.njk`.
- **Party pickers** — the real frontend renders these inside `/addresses`
  rather than as separate routed pages, so they were not captured standalone.

Every other claim in `spec.md` is verified against a captured render on both
sides.

## Corrections the live capture forced

The first pass derived the frontend side from source. Five claims changed once
it was actually rendered — recorded here because they show the *kind* of thing
source reading misses:

1. **Page headings are legends.** `import-reason`, `import-purpose`,
   `transporters` and `import-type` render their fieldset legend as the h1
   (`isPageHeading: true`). `copy.title` is only the `<title>`. So the real h1s
   are "What is the main reason for importing the animals?" and "What type of
   transporter will move the animals?", not "Reason for import" / "Transporter".
2. **Date components differ.** The frontend uses the govuk 3-field date input
   (day/month/year); DR2 uses the MOJ single-field date picker with a calendar.
   Invisible in the copy files. See spec A4.
3. **Country/port pickers already match.** The frontend progressively enhances
   its `govukSelect` into a type-ahead, so it renders as text input + select —
   the same interaction DR2 has, not the plain dropdown source reading implied.
4. **The commodity type filter is not rendered** on the empty search page,
   though it exists in copy. The earlier claim that DR2 drops a filter the
   frontend shows was overstated.
5. **Dashboard card actions differ more than expected**: the frontend offers
   Resume / Delete / Copy as new; DR2 offers Copy as new / View notification.
