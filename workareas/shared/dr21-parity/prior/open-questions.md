# Open questions

Ordered by how much they change the build. Resolved items are kept at the foot
of the file so the decisions stay findable.

## Blocking

1. **Modal or interstitial page for amend / cancel-amend?** (spec D1, D2)
   DR2 uses JS modals. The frontend has a real `cancel-amend` page today. A modal
   needs a no-JS fallback; an interstitial page does not. If we choose pages, D2
   becomes a no-op and D1 is a small new page.

2. **Does the reason-for-import merge survive contact with the model?** (B3)
   Five pages become one. The obligations model still needs every field, so this
   should be page-shape only — but `obligation-purity.js` and the hub
   task-row derivation both key off pages. Worth a spike before committing.

3. **Templates need a persisted entity.** (F) DR2 fakes them from fixtures. Real
   templates need backend storage, ownership and lifecycle. Is that in scope for
   this release, or does the frontend ship the screens against a stub?

4. **"At a glance" counts need a backend.** (E1) Action-needed, status-change and
   inspection counts do not exist in the API today.

5. **Address book vs EUDPA-58.** (G) DR2's address book overlaps the existing
   programme. Which one is canonical?

6. **When does the "enhanced search round" happen, and does DR2 set its
   target?** (B1, B2, B7, B8) `bc285d71` stripped `accessible-autocomplete` and
   the commodity search on a deliberate ruling, with "enhanced search returns as
   a later round". Four inputs wait on it: country of origin, port of entry,
   transit countries, commodity selection. DR2 shows an intended end-state for
   all four (3-character type-ahead, checkbox results, removable chips). Should
   that round be specced against DR2, or is DR2's own widget under review? Its
   a11y is weak — no combobox/listbox roles, no arrow-key navigation,
   `aria-expanded` on the wrapper — so "match DR2" and "do it properly" are not
   the same instruction.

## Content — needs the designer

7. **"Arrival date at destination" vs "Arrival date at port of entry".** (C2)
   The DR2 review page and the DR2 arrival-details page disagree with each other.
   Which is right?

8. **"Before the consignment is imported"** — new confirmation-page section
   (B15). No content in the prototype.

9. **Did DR2 mean to drop these, or is it prototype shorthand?**
   Each is real content the frontend has and DR2 does not render:
   - the five import-reason hints (B3)
   - the 11 internal-market purpose hints (B3)
   - the transporter authorisation guidance and gov.uk link (B9)
   - the "Providing a false address is an act of fraud" warning (B11)
   - transit-countries explanatory copy and the 12-country cap (B8)
   - hub row hints (C1)
   - the longer declaration clause (B14)

   The spec assumes **shorthand** and keeps them. Confirm.

10. **Resume has no DR2 equivalent.** (E1) The frontend's card now offers
    Resume · Delete · Copy as new · Amend · View notification · Cancel
    amendment — a superset of DR2's Copy as new / View notification. So this is
    the reverse of how it first looked: DR2 appears to have no way to resume a
    draft. Confirm that is an omission in the prototype, not an intended removal.

## Design-system

11. **Means of transport: select or radios?** (B7) DR2 uses a select for four
    options; the frontend uses radios. GDS guidance favours radios here.
    Recommend keeping radios.

12. **Dashboard cards.** (E1) DR2's card is bespoke CSS; the frontend uses
    `govuk-summary-card`. The spec keeps the summary-card and adds DR2's fields.
    Confirm.

13. **CPH casing.** (B11) Three spellings in play. Recommend DR2's sentence case:
    "County parish holding number (CPH)".

## Scope

14. **Import-type filter.** The frontend has an `import-type` screen with a "You
    cannot use this service" dead end. DR2 has no equivalent — it starts at
    origin. Does DR2 drop the filter, or simply not model it?

15. **Delete.** DR2's review header renders a **Delete** button but wires no
    route. The frontend has a full `delete-notification` page. Assume the
    frontend's is correct and DR2 is incomplete?

## Resolved

- **govuk date input → MoJ date picker?** — **decided and done** (`d952d49c`,
  2026-07-31). All three journey dates use the MoJ picker;
  `@ministryofjustice/frontend` 10.0.1 is a runtime dependency. Only DR2's
  dashboard filter dates remain, and they arrive with E1.

- **Region of origin code as a "suffix"** — the prefix is rendered beside the
  input. `country-search.js:106-115` looks the chosen country up in
  `app/data/country-region-prefixes.js` (an ISO 3166-1 alpha-2 map — France →
  `FR`, Ceuta → `XC`, …) and writes it into a `govuk-input__prefix`
  (`partials/region-of-origin-code-input.html:18`). The user types only the
  suffix. So B1 is not a rename: it needs the prefix map, the input-prefix
  markup and a country-change handler. Note DR2's prefix element is
  `aria-hidden="true"`, so screen-reader users never hear it — fix that rather
  than copying it.

- **Commodity type filter** — moot. `bc285d71` removed the frontend's whole
  commodity search apparatus, type filter included.
