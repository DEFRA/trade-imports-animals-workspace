# p-235 — accessible-autocomplete and commodity search assessment

## Scope and count

There are **3 logical accessible-autocomplete usages in 3 templates**:

1. country of origin;
2. port of entry;
3. transited countries.

The transited-countries template contains two literal `data-select-autocomplete`
attributes because it renders the first and subsequent rows in separate Nunjucks
branches. At runtime it can enhance between 1 and 12 selects. Thus the source
inventory is 3 input surfaces, 3 templates, 4 attribute occurrences, and a
variable number of enhanced controls.

The other two known candidates are not usages: destination country and port of
exit are already plain `govukSelect` controls with no autocomplete data
attribute and no autocomplete bundle include.

## Shared implementation

- `package.json:95` declares `accessible-autocomplete` 3.0.1 as a development
  dependency; `package-lock.json:57` and `package-lock.json:5746-5759` pin it.
- `src/client/javascripts/select-autocomplete.js:1-11` is the shared client
  initialiser. On `DOMContentLoaded` it finds every
  `select[data-select-autocomplete]` and calls
  `enhanceSelectElement({ selectElement, showAllValues: true })`.
- `webpack.config.js:26-28` builds that file as the `selectAutocomplete`
  entry.
- `src/client/stylesheets/application.scss:3` includes the package stylesheet
  in the global application CSS.
- Each opted-in template renders a real GOV.UK select first, adds the data
  attribute, and includes `selectAutocomplete.js` in `bodyEnd`. JavaScript
  changes the visible affordance only; the select remains the submitted data
  control.

## Inventory

| Input | Template wiring | Controller wiring | Dataset and captured/stub count | Cardinality | Current no-JS behaviour |
| --- | --- | --- | --- | --- | --- |
| Country of origin (`countryOfOrigin`) | `src/server/live-animals/features/origin/template.njk:15-23` renders the select; `:22` opts in; `:61-64` includes the client bundle. | `src/server/live-animals/features/origin/controller.js:17` imports the countries service; `:56-60` builds the items; `:98-110` passes them to the view. Shared client init: `src/client/javascripts/select-autocomplete.js:3-10`. | `services/countries/index.js:15-16` returns `originCountries()` from labels seeded by `services/countries/stub.js:1-5`; real mode primes the same service from `/countries?blocks=GBNAG_SPS_EX` at `services/countries/index.js:7-10` and `services/countries/client.js:4-25`. The committed capture `services/_capture/fixtures/countries-origin.json` has **31 countries**. The rendered select has 33 rows: placeholder + disabled divider + 31 data options. | Single value; stored as one country code. | Fully working `govukSelect`. It displays all 31 countries and submits the selected code. The controller validates against the current service list. This path is pinned by `features/origin/controller.test.js:100-115` and the tests-repo no-JS spec. |
| Port of entry (`portOfEntry`) | `src/server/live-animals/features/transport/port-of-entry/port-of-entry.njk:18-27` renders the select; `:26` opts in; `:65-68` includes the bundle. | `features/transport/port-of-entry/port-of-entry.controller.js:16` imports the ports service; `:38-46` builds `Name (CODE)` options; `:74-90` passes them to the view. Shared client init: `src/client/javascripts/select-autocomplete.js:3-10`. | `services/ports/index.js:12` returns the list seeded by `services/ports/stub.js:1-3`; real mode primes it from `/ports-of-entry` at `services/ports/index.js:7-10` and `services/ports/client.js:4-17`. The committed capture `services/_capture/fixtures/ports-of-entry.json` has **78 ports**. The rendered select has 80 rows: placeholder + disabled divider + 78 data options. | Single value; stored as one port code. | Fully working `govukSelect`. It displays all 78 name-and-code options and submits the code. The controller validates against the current service list. This path is pinned by `features/transport/port-of-entry/port-of-entry.controller.test.js:86-107`. |
| Transited countries (`transitedCountries`) | `src/server/live-animals/features/transport/transit-countries/transit-countries.njk:17-37` loops over select rows; `:26` opts in the first row and `:34` opts in later rows; `:52-55` includes the bundle. | `features/transport/transit-countries/transit-countries.controller.js:9` imports the countries service; `:14` declares the collected array; `:17` caps it at 12; `:21-35` builds one option list per selected/blank row; `:71-75` de-duplicates submitted codes. Shared client init: `src/client/javascripts/select-autocomplete.js:3-10`. | The same blocked origin-country service and **31-country** committed capture as country of origin. Each rendered select has 32 rows: placeholder + 31 data options. | Multi-valued; a de-duplicated array of 1 to 12 country codes. | Fully server-driven add-another flow. Each row is a plain `govukSelect`; “Add another country” posts the current values, commits them, redirects back, and renders another row. “Save and continue” validates at least one, membership, and the 12-country cap. No JavaScript is needed for adding, submitting, or persisting rows. |

### Checked known candidates that are already plain

| Input | Evidence | Dataset | Result |
| --- | --- | --- | --- |
| Destination country (`destinationCountry`) | `features/destination-country/template.njk:13-21` renders `govukSelect` with no opt-in attribute or bundle. `features/destination-country/controller.js:7,19-23,34-46` supplies the items. | Same **31-country** service capture; single-valued. | Already complies with the plain-select ruling. No replacement work is needed. |
| Port of exit (`portOfExit`) | `features/port-of-exit/template.njk:13-21` renders `govukSelect` with no opt-in attribute or bundle. `features/port-of-exit/controller.js:7,17-25,36-48` supplies the items. | Same **78-port** service capture; single-valued. | Already complies with the plain-select ruling. No replacement work is needed. |

Other `autocomplete` matches in address and transporter templates are HTML
autofill attributes such as `autocomplete="postal-code"`; they are unrelated to
the `accessible-autocomplete` package.

## Commodity search assessment

### Interaction today

The surface at `features/commodities/search/` is server-rendered and does not use
`accessible-autocomplete`.

1. On initial GET, `search.njk:22-36` shows a text search input and a secondary
   Search button. There are no results until a non-blank query is posted.
2. `services/commodities/index.js:60-89` searches case-insensitively over common
   commodity name, commodity code, and species scientific name. A species match
   returns its whole commodity group.
3. `search.njk:38-64` renders matching groups as small GOV.UK checkboxes, one
   checkbox per commodity/species pair. For the only multi-type commodity,
   Cow, `:40-54` also renders a plain type-filter select and Filter button.
4. Hidden `shown` and `selected` values preserve selection across server
   round-trips. `selection/selected-keys.js:6-13` treats a shown-but-unposted
   checkbox as deselected and carries selected pairs that were not in the latest
   result set.
5. `search.njk:69-86` shows a selected-items summary with an individual Remove
   button. Saving requires at least one pair and
   `actions/commit-selection.js:27-41` reconciles one `commodityLines` entry per
   selected commodity/species pair.

There is **no table on the commodity search page**. The table appears on the
following consignment-details page after selection is saved
(`features/commodities/e2e/search.e2e.spec.js:99-104`).

### Dataset and cardinality

The current selection dataset is a static prototype service, not a live
primed-MDM service:

- `services/commodities/stub.js:1-10`: **5 commodity names** — Cow, Horse, Cat,
  Dog, Fish — representing 4 distinct codes because Cat and Dog share
  `01061900`;
- `services/commodities/stub.js:15-28`: **8 species options / 8 selectable
  commodity-species pairs** — 4 for Cow and 1 each for Horse, Cat, Dog, Fish;
- `services/commodities/stub.js:39-48`: Cow has 2 types, Domestic and Game; each
  other commodity has 1 type;
- `services/commodities/index.js` has no client or `prime()` path, so real mode
  does not enlarge this selection list.

Selection is multi-valued: zero or more unique commodity/species pairs in the
form, with at least one required on save. With the current data the practical
maximum is 8. The separate 54-entry `PACKAGE_COUNT_COMMODITIES` list at
`services/commodities/stub.js:50-105` drives downstream conditional questions;
it is not the search selection dataset and must not be counted as search
options.

## Recommendations under the agreed ruling

| Input | Recommendation |
| --- | --- |
| Country of origin | Keep the existing server-rendered `govukSelect` and remove only its autocomplete opt-in and script include. A plain select over the 31 captured country options is the required replacement regardless of list size. |
| Port of entry | Keep the existing server-rendered `govukSelect`, including the useful `Name (CODE)` option text, and remove only its autocomplete opt-in and script include. A plain select over the 78 captured ports is the required replacement. |
| Transited countries | Do not replace a multi-valued answer with one single select or preserve the repeated autocomplete/add-another pattern. Render one GOV.UK checkboxes group over the 31-country list, pre-check stored values, retain de-duplication/membership validation and the 12-country maximum, and save the checked code array. Thirty-one is a modest list for checkboxes. |
| Destination country | No change: it is already a plain `govukSelect` over 31 countries. |
| Port of exit | No change: it is already a plain `govukSelect` over 78 ports. |
| Commodity/species selection | “Drop back” means remove the search box, Search/Filter actions, type filter, hidden cross-search state, selected-summary/remove interaction, and no-match state. Render all **8 current commodity/species pairs** as GOV.UK checkboxes, grouped under commodity name and code, with stored pairs checked. Save continues to reconcile one line per checked pair and require at least one. The Cow type filter is unnecessary for four visible species because the selected species already determines its type. |

The commodity recommendation is valid for the current eight-pair prototype
dataset. A future complete MDM commodity/species list is likely to be too large
for one checkbox page, but this repository contains no complete selection
dataset from which to state its size. That is a real tension between
multi-selection and list length: flag it for the later enhanced-search work
rather than turning a multi-valued answer into a single select or inventing a
new widget in this change.

## Knock-on effects

### Dead client and package code

Once the three enhanced templates are converted, remove:

- `src/client/javascripts/select-autocomplete.js`;
- the `selectAutocomplete` webpack entry at `webpack.config.js:26-28`;
- the global accessible-autocomplete CSS import at
  `src/client/stylesheets/application.scss:3`;
- `accessible-autocomplete` from `package.json:95` and its lockfile entries;
- all four `data-select-autocomplete` attributes and all three
  `selectAutocomplete.js` template script includes listed in the inventory.

Update the now-stale progressive-enhancement documentation at
`src/server/live-animals/docs/features.md:362-389` and the autocomplete testing
claim at `src/server/live-animals/docs/testing.md:115`.

### Frontend-repository specs

- `features/origin/origin.e2e.spec.js:22-25,74-86,112,131,140` drives a combobox,
  reads `select#countryOfOrigin-select`, and expects the visible country name.
  Change it to drive/read the plain select while retaining option-order,
  validation, persistence, and accessibility coverage.
- `features/transport/e2e/arrival-transit.e2e.spec.js:28-38,89-102,119-122,163,189-191`
  pins the port combobox/renamed select, while `:205-282` pins repeated transit
  autocompletes and add-another. Rewrite port assertions for the plain select
  and transit assertions for the checkbox group.
- `features/origin/controller.test.js:100-115` and
  `features/transport/port-of-entry/port-of-entry.controller.test.js:86-107`
  are useful server-select tests and should remain. Transit controller tests
  at `features/transport/transit-countries/transit-countries.controller.test.js`
  should retain membership, required, and maximum validation but drop the
  add-another branch.
- Commodity behaviour is pinned by
  `features/commodities/search/search.controller.test.js:16-174` and
  `features/commodities/e2e/search.e2e.spec.js:23-125`. Replace search,
  filtering, hidden carry, summary/removal, and no-match cases with render-all,
  checked-state, multi-selection, validation, canonical ordering, reconcile,
  and persistence cases.

### `trade-imports-animals-tests` reworked lane

Direct autocomplete contracts to retire or rewrite:

- `tests/e2e/features/country-of-origin-enhancement.spec.ts:3-42`;
- `tests/e2e/features/port-of-entry-enhancement.spec.ts:7-60`;
- `tests/e2e/features/task-page-exits.spec.ts:18-36`, which directly asserts the
  generated input and renamed hidden select;
- `tests/e2e/features/country-of-origin-no-js.spec.ts:3-20`; its plain-select
  behaviour remains correct, but the “fallback” distinction and explicit
  absence-of-enhancement assertion become redundant.

Shared page objects also pin the generated autocomplete DOM and affect many
otherwise unrelated journeys:

- `page-objects/notification/origin-of-import-page.ts:14-21`;
- `page-objects/notification/arrival-details-page.ts:13-15`;
- `page-objects/notification/transited-countries-page.ts:16-24`.

Change origin and port helpers to `selectOption`; replace the transit row helper
with checkbox selection. This keeps ordinary reworked specs such as
`tests/e2e/pages/origin.spec.ts` and the scope/a11y journeys working without
embedding the implementation detail in each spec.

Commodity search is pinned by:

- `tests/e2e/pages/commodities.spec.ts:8-24`;
- `page-objects/notification/commodity-selection-page.ts:4-33`, especially
  `searchAndSelect`;
- all reworked tests that call `searchAndSelect`, including the animal
  identifier, additional-details, CPH, and reference-strip feature specs.

Replace the shared commodity helper with direct checkbox selection first, then
update the page spec to assert the full grouped checklist and multi-selection.

### Frozen main lane

The tests repository deliberately runs different suites against different
frontends: `README.md:73-76` describes the reworked suite on `:3100` and the
frozen `main-suite/` on `:3200`; `playwright.parity.config.ts:7-17,41-52`
enforces that split. The follow-up is a rewrite-only UI change:

- update the reworked `tests/e2e` specs and page objects;
- do **not** change `main-suite/` expectations or snapshots;
- the main lane remains against the separate main frontend and is unaffected.
