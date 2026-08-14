# Retrofit spec — make the real frontend match DESIGN RELEASE 2

> **Re-diffed 2026-07-31** against frontend `66e69c81`. Since the first pass:
> **A4 is done** (MoJ date picker adopted, `d952d49c`); **B1/B7/B8/B2 moved
> *away* from DR2** — `accessible-autocomplete` was deliberately dropped
> (`bc285d71`, per `workareas/shared/promotion/AUTOCOMPLETE-ASSESSMENT.md`), so
> country/port are plain selects and transit-countries and commodities are now
> checkbox groups; **E1 moved toward DR2** (dashboard gained keyword search and
> Amend / View / Cancel-amendment actions). Everything else is unchanged.
> Per-section status is marked inline below.

Every change below is stated as: **what DR2 does** → **what the frontend does
today** → **the change**. Citations are `file:line` on both sides.

Paths: DR2 = `~/git/defra/defra-design/GB-notification-service/app/…`;
frontend = `repos/trade-imports-animals-frontend/src/server/live-animals/…`.

---

## A. Cross-cutting

These land on nearly every screen. Do them first — they are the cheapest and
they change the most pixels.

### A1. Rename the hub from "hub" to "overview" in all save actions

DR2's shared action group (`views/partials/design-release-2/journey-form-actions.html:62,82`):

- primary **Save and continue**
- secondary **Save and return to overview**
- link **Cancel and return to overview**

Frontend (`shared/copy.en.js:43-45`) says *hub*, not *overview*:
`saveAndContinue` / `saveAndReturnToHub: 'Save and return to hub'` /
`cancelAndReturnToHub: 'Cancel and return to hub'`.

**Change**: retitle to "…to overview" in `shared/copy.en.js` (+ `copy.cy.js`).
The hub page itself is already titled "Overview" (`features/hub/copy.en.js:2`),
so today's wording is internally inconsistent — DR2 fixes that.

### A2. Add the amend-state action group

DR2 renders a **different button group while amending**
(`journey-form-actions.html:31-43,71-79`): primary **Save and return** (→ review),
secondary **Save and continue**, and a link-styled submit **Save and return to
overview**. The frontend's `shared/save-actions.njk` has one variant only.

**Change**: give `saveActions()` an amend branch driven by journey status. The
frontend already tracks the state (`shared/copy.en.js:50` `amend: 'Amending'`),
so this is a template + copy change, not a model change.

### A3. Section numbering is now shown to the user

DR2 numbers its groups in both the hub and the review page — "1. About the
consignment", "2. Description of the goods", …, "6. Contact address". The
frontend already numbers hub groups (`features/hub/copy.en.js:41-48`) but uses a
**different set of six**, and its check-answers page uses a **different set of
four** (`features/check-answers/copy.en.js:37-42`). See C1 and C2.

### A4. ✅ DONE — Date inputs are now the MoJ date picker

Was: the frontend used the govuk 3-field date input (`exitDate-day`/`-month`/
`-year` and friends); DR2 used the MoJ single-field picker.

Now matching. Verified on the 2026-07-31 render: `exitDate`,
`arrivalDateAtPort` and `accompanyingDocumentDateOfIssue` are each a single
input with the MoJ calendar (Choose date / Previous month / Next year / Select
/ Close). `@ministryofjustice/frontend` 10.0.1 is a runtime dependency.

Landed as `d952d49c` — "adopt the MoJ date picker for all date inputs (p-234)".

Only DR2's **dashboard filter** dates remain unbuilt, and they arrive with E1.

---

## B. Journey pages

### B1. `origin-of-the-import` — region code becomes a suffix

Both h1s are "Origin of the import".

| | DR2 | Frontend |
|---|---|---|
| Country | bespoke type-ahead writing hidden `countryOfOrigin`, under an h2 "Country of origin" | **plain `govukSelect`**, 31 countries, no enhancement (see the note below) |
| Region radios | `regionOfOriginRequired` — "Does the consignment have a region of origin code?" | `regionOfOriginCodeRequirement`, **same legend** |
| Region code | `regionOfOriginCodeSuffix`, label **"Enter the region of origin code"**, hint **"Enter up to 5 characters."** | `regionOfOriginCode`, label "Region of origin code", hint "For example, FR-75" |
| Internal ref | identical label and hint | identical |

**Change**: relabel the region-code field and its hint. DR2's naming
(`…Suffix`) implies the country prefix is rendered alongside the input rather
than typed by the user — confirm with the designer (see open questions).

**Country picker — the gap widened on 2026-07-31.** The first pass found the
frontend progressively enhancing its `govukSelect` into a type-ahead, matching
DR2's interaction. `bc285d71` deliberately removed that:
`accessible-autocomplete`, its bundle entry, its scss import and every
`data-select-autocomplete` attribute are gone, on the ruling recorded in
`workareas/shared/promotion/AUTOCOMPLETE-ASSESSMENT.md`. Country of origin and
port of entry are now plain selects.

So DR2 has a type-ahead here and the frontend does not. That is a **known,
deliberate divergence**, not an oversight — the commit says "enhanced search
returns as a later round". Treat it as scheduled work, not a spec item, and
pick it up when that round starts. See open question 11.

### B2. `what-are-you-importing` — DR2 is a leaner page

DR2 shows: h1, inset text, a single search box, a "Help with commodity codes"
details block, and the action group.

- inset: *"A separate notification is required for each health certificate.
  Consignments that do not require a health certificate must still be notified."*
- search label: *"Search for a commodity"*, hint *"You can search by common name
  (for example, cattle), commodity code (0102), or Latin name (Bos taurus)."*
- details summary *"Help with commodity codes"*, body covering commodity codes
  and a **"Trade Tariff tool (opens in a new tab)"** link.

Frontend — **changed on 2026-07-31**. `bc285d71` removed the whole
search/filter/carry/summary apparatus. The page is now all eight
commodity-species pairs rendered as a single grouped `species` checkbox list,
with no search input and no Search button. The inset and the one-line "Help
with commodity codes" details remain.

So the two are now closer in one respect and further in another: DR2's *results*
are checkboxes too (`#commodity-species-<id>`), so the selection mechanism
matches — but DR2 reaches them through a 3-character type-ahead with removable
chips, and the frontend now shows the full list up front.

**Change**: adopt DR2's longer inset and the expanded help text with the Trade
Tariff link — those are safe now. **Do not** rebuild the search yet: the commit
says "enhanced search returns as a later round", so DR2's type-ahead + chips
belongs to that round. Fold it in there rather than duplicating the decision.

### B3. `reason-for-import` — five frontend pages collapse into one ⚠️

The largest structural change in the release.

DR2 asks everything on `/reason-for-import` with conditional reveals:

| Field | Control | Revealed by |
|---|---|---|
| `importReason` | radios — "What is the main reason for importing the animals?" | always |
| `internalMarketPurpose` | radios — "Purpose in the internal market" (11 options, Slaughter/Fattening/Restocking etc.) | Internal market |
| `transhipmentDestinationCountry` | select — "Destination country" | Transhipment or onward travel |
| `transitExitBorderControlPost` | select — "Port of exit" | Transit |
| `transitDestinationCountry` | select — "Destination country" | Transit |
| `temporaryAdmissionExitDate` | MOJ date picker — "Exit date" | Temporary admission horses |
| `temporaryAdmissionPortOfExit` | select — "Port of exit" | Temporary admission horses |

Server-side, DR2 nulls every field that does not belong to the chosen reason and
validates the revealed set in one pass (`app/routes.js:9035-9127`).

The frontend spreads the same data across **five separate pages** in the
`consignment` section (`flow/flow.js:47-57`): `import-reason`, `import-purpose`,
`destination-country`, `port-of-exit`, `exit-date`.

**The option sets are already identical** — verified by comparing renders.
`reasonForImport` and DR2's `importReason` offer the same five values;
`purposeInInternalMarket` and DR2's `internalMarketPurpose` offer the same
eleven. So this is purely a page-shape change: no new answers, no new
validation rules, only a different arrangement.

**Heading correction.** The frontend renders each fieldset legend as the page
heading (`isPageHeading: true`), so the real h1s are **"What is the main reason
for importing the animals?"** and **"Purpose in the internal market"** — the
`copy.title` values ("Reason for import" etc.) are only the `<title>`. DR2 puts
a distinct h1 **"Main reason for import"** above a legend reading "What is the
main reason for importing the animals?". The merged page therefore needs a real
h1, and the reason radios lose `isPageHeading`.

**Change**: merge them into one page. Concretely:

1. New page `import-reason` owning all seven answers; retire
   `import-purpose`, `destination-country`, `port-of-exit`, `exit-date` as
   routed pages.
2. Move the purpose radios in as a conditional reveal on "Internal market".
   Copy already exists at `features/import-purpose/copy.en.js` — the 11 purpose
   hints are long and DR2 does not render them; decide whether they survive.
3. Reveal destination-country / port-of-exit / exit-date per the table above.
4. Give the merged page an h1 of **"Main reason for import"** and demote the
   reason legend (see the heading correction above).
5. Move the exit date onto the merged page — and note it changes component at
   the same time (A4): three date boxes become one MOJ picker.
6. The hub loses its separate "Exit details" row (see C1).
7. The obligations model still needs each field; only the *page* merges. Check
   `obligation-purity.js` stays green — this is a page-shape change, not a model
   change.

**Note**: DR2's reason hints are absent. The frontend has substantial reason
hints (`features/import-reason/copy.en.js:4-14`) explaining internal market,
transhipment, transit, re-entry, temporary admission. Losing them would be a
content regression — treat DR2's omission as prototype shorthand unless the
designer says otherwise.

### B4. `consignment-details` — retitle

DR2 h1 **"Commodity details"**; frontend **"Consignment details"**
(`features/commodities/copy.en.js:31`).

Field labels: DR2 "Number of animals" / **"Number of packages (when required)"**;
frontend "Number of animals" / **"Number of packages (optional)"**
(`copy.en.js:41-46`).

**Change**: retitle the page, and change the packages label from "(optional)" to
"(when required)".

### B5. `animal-identification-details` — retitle

DR2 h1 **"Identification details"**; frontend **"Animal identification details"**
(`features/commodities/copy.en.js:58`).

DR2's per-animal counter reads *"Enter details for Bos taurus 1 of 2"* — the
frontend has the same shape (`copy.en.js:100-101`). Buttons match: **Save and
add another** plus the standard group.

**Change**: retitle only.

### B6. `additional-animal-details` — retitle

DR2 h1 **"Additional details"**; frontend **"Additional animal details"**.

Both legends match exactly, and the **16 "certified for" options are identical
in both**, in the same order (Further keeping · Slaughter · Confined
establishment · … · Other) — verified by comparing renders.

The unweaned question (`unweanedAnimals` / DR2's same) is conditional: the
frontend's empty page renders certified-for only.

**Change**: retitle only. Note the review page keeps the longer card title
"Additional animal details" in both — do not rename that.

### B7. `arrival-details` — already matching

DR2 fields, in order: `arrivalDateAtPort` (MOJ date picker), port-of-entry
type-ahead, `meansOfTransport` select, `transportIdentification`,
`transportDocumentReference`.

Verified: the frontend has all five with **identical labels and hints**, and
both h1s are "Arrival details". As of 2026-07-31:

- **Arrival date** — ✅ now matching, both the MoJ picker (A4).
- **Means of transport** — DR2 a `select`, the frontend radios (same four
  options). Unchanged.
- **Port of entry** — DR2 a type-ahead, the frontend now a plain select
  (`bc285d71`, see B1). Deferred to the enhanced-search round.

**Change**: nothing here now. **Decide** on radios vs select for four options;
GDS guidance favours radios, so the frontend is arguably already right (open
question).

### B8. `transit-countries` — component swap

DR2 renders a single type-ahead ("Enter a country") that appends chosen
countries to a list.

Frontend — **changed on 2026-07-31**. `bc285d71` replaced the add-another flow
with a single 31-country `transitedCountries` checkbox group, legend *"Select
all countries the consignment will travel through"*. The dedupe, membership
check and 12-country cap are retained; canonical list order replaces entry
order. Both h1s still read "Which countries will the consignment travel
through?".

The gap therefore widened: DR2 is a type-ahead that appends to a list, the
frontend is now a flat 31-item checkbox group.

**Change**: defer. This belongs with the same "enhanced search returns as a
later round" decision as B1 and B2 — three inputs, one ruling. Keep the
explanatory copy and the 12-country cap when it is picked up: DR2 shows
neither, but both are substantive.

### B9. `transporter` — three frontend pages collapse into one ⚠️

DR2 `/transporter` — h1 **"Transporter details"** — is a search box plus a radio
list of approved transporters (`transporterId`), with a route to
`/transporter/add` ("Choose a transporter type" — `transporterType` radios) and
then `/transporter/add/private` or `/transporter/add/commercial`.

The frontend has three routed pages (`flow/flow.js:66-75`), verified:

1. `transporters` — h1 **"What type of transporter will move the animals?"**
   (the legend is the page heading; `<title>` is "Transporter"), radios
   Commercial/Private with hints, plus a substantial authorisation guidance
   block and a gov.uk link (`features/transport/copy.en.js:58-87`)
2. `transporters/select` — h1 "Search for an approved commercial transporter",
   a `commercialTransporter` **radio list** (not a search box)
3. `transporters/private` — "Private transporter details", a nine-field address
   form (name · address 1 · address 2 (optional) · town or city · county
   (optional) · postal or zip code · country select · telephone · email)

DR2 inverts the order: **pick from the list first**, fall through to "add" only
if the transporter is not listed.

**Change**:

1. Make `transporters` the search-plus-select list, titled **"Transporter
   details"**, with an "add a transporter" escape hatch.
2. Move the type choice behind that escape hatch as `transporters/add`
   ("Choose a transporter type").
3. Keep `transporters/private` for the private address form; add the commercial
   equivalent DR2 has (`transporter-add-commercial.html`).
4. **Retain the authorisation guidance block.** DR2 does not render it, but it
   is regulatory content, not decoration. Re-home it on the new list page.

### B10. `upload-documents` — matching

DR2: `documentReference`, `documentType` select, `dateOfIssue`, `attachment`
file input; buttons **Save and add another** / **Save and continue** / **Save and
return to overview**.

Frontend, verified: same h1 and the same fields
(`accompanyingDocumentReference`, a 3-box date of issue, `file`), plus richer
virus-scan handling (`scanTags`, `refreshStatus`, `announce`) DR2 does not
model, and a file hint spelling out the size and type limits.

One delta left, as of 2026-07-31:
- **Date of issue** — ✅ now matching, both the MoJ picker (A4).
- The frontend's primary button still reads **"Continue"**; DR2's reads **"Save
  and continue"**. DR2 is the consistent one — every other journey page in both
  says "Save and continue".

**Change**: the button label. Keep the scan behaviour.

### B11. `roles-and-addresses` and the party pickers

DR2 hub page — h1 **"Consignment addresses"** — lists Place of origin,
Consignor, Consignee, Importer, Place of destination, then either **"County
parish holding number (CPH)"** or **"Permanent address"** depending on the
commodity.

Frontend matches (`features/addresses/copy.en.js:3,16-38`) — same h1, same five
parties, same CPH row — including the warning *"Providing a false address is an
act of fraud."*, which DR2 does not render. Its primary button reads
**"Continue"** where DR2 says **"Save and continue"**.

The frontend renders its party pickers **inside** `/addresses` rather than as
separate routed pages, so they have no standalone URL to compare; the
description below comes from `features/addresses/party-picker.njk` and
`_address-picker.njk`.

Each DR2 party page (`/consignee` etc.) is: h1 = party name, a **Search** box, an
h2 **"Select an address"**, then radios whose visible labels read **"Select
&lt;name&gt;"**, and a **Save and continue** submit. Option ids are role-suffixed
(`northern-livestock-imports-consignee`).

The frontend's party picker is a **table** with a select column, "View details"
links, and a `resultsCaption` ("Showing N of M addresses") —
`features/addresses/copy.en.js:41-63`.

**Change**: swap the table picker for DR2's search + radio list. Keep the
frontend's "Add a new address" affordance and the fraud warning.

Casing: DR2 writes **"County parish holding number (CPH)"** (sentence case);
the frontend writes **"County Parish Holding number (CPH)"**
(`copy.en.js:10`) on the hub and **"County Parish Holding (CPH)"**
(`features/cph-number/copy.en.js:2`) on the page. Pick one — DR2's sentence case
matches GDS style.

### B12. `permanent-address` — a separate DR2 sub-journey

DR2 has `/permanent-address` → `/permanent-address/select` → `/permanent-address/enter-address`,
reached from the addresses hub. The select page shows, per animal
(e.g. "Felis catus 1"), an h2 **"Where will their permanent address be?"**,
radios `permanentAddressChoice[<species>:<index>]` (including a "same as place of
destination" option), and a revealed manual-address form
`permanentAddressDetails[<species>:<index>][name|addressLine1|addressLine2|townOrCity|county|postcode|email|phone]`.

The frontend folds permanent address into the **animal identification** page
(`features/commodities/copy.en.js:104-107,109-120`).

**Change**: decide whether to promote it to its own sub-journey off the
addresses hub, as DR2 does. This is a real UX difference, not just copy — DR2
groups it with addresses, the frontend groups it with the animal record.

Field naming note: DR2 uses **`postcode` / "Postcode or Zip code"**; the frontend
uses **`postalOrZipCode` / "Postal or zip code"**. Align the label; the field
name is internal.

### B13. `contact-address-for-consignment` — matching

DR2: h1 "Contact address for consignment", h2 "Select an address", radios
`contactAddressId`. Frontend identical (`features/contact/copy.en.js`), plus a
hint *"Selecting a contact copies their name and address into this
notification."* and an **"Add a new contact address"** link that DR2 lacks.

**Change**: none. Keep the frontend's hint and add-link.

### B14. `declaration` — matching

Verified on both: h1 "Declaration", three body blocks, an accountability list, a
single confirmation checkbox. The only delta is the second clause — DR2 reads
*"I confirm I am responsible for this consignment."*, the frontend *"I confirm I
am responsible for this consignment until it has cleared border control checks
or reached the place of destination."*.

**Change**: none — DR2's shorter wording is prototype truncation, not a content
decision. Confirm with the designer.

### B15. `notification-submitted` — one extra section

DR2 sections: **Before the consignment is imported** · Transporting the
consignment · How to view or amend this notification · Getting help.

Frontend (`features/confirmation/copy.en.js`): panel · Transporting the
consignment · How to view or amend this notification · Getting help — **no
"Before the consignment is imported"**.

**Change**: add the "Before the consignment is imported" section. Content needs
to come from the designer.

---

## C. Hub and review

### C1. Hub — regroup ⚠️

DR2 (`views/design-release-2/notification-hub.html`), h1 "Overview", with a
"Your commodities" summary and an h2 **"Notification tasklist"**:

| Group | Rows |
|---|---|
| 1. About the consignment | Where is this consignment coming from? · What are you importing? · Main reason for import |
| 2. Description of the goods | Commodity details · Identification details · Additional details |
| 3. Transport and arrival | Arrival details · Transport details |
| 4. Documents | Upload documents |
| 5. Consignment parties | Roles and addresses |
| 6. Contact address | Contact address for this consignment |
| — | Review and submit · Return to dashboard |

Frontend, verified on the rendered hub — h1 "Overview", `govukTaskList`, groups
exactly as `features/hub/copy.en.js:41-48,50-107` describes:

| Group | Rows |
|---|---|
| 1. About the consignment | Where is this consignment coming from? · What are you importing? · Main reason for importing · Exit details |
| 2. Commodity details | Additional commodity details · Animal identification details |
| 3. Movement | Arrival details · Transit countries · Transporter |
| 4. Addresses | Roles and addresses |
| 5. Documents | Uploaded documents |
| 6. Check and submit | Check and submit |
| — | Contact address · Return to dashboard |

**Change**:

1. Rename groups 2–6: "Commodity details" → "Description of the goods";
   "Movement" → "Transport and arrival"; "Addresses" → "Consignment parties";
   "Documents" stays but moves to position 4; "Check and submit" → "Contact
   address" at position 6, with review demoted to a standalone
   "Review and submit" link.
2. Drop the **Exit details** row — it is absorbed by the merged
   reason-for-import page (B3).
3. Move **Contact address** out of the tail and into its own numbered group 6,
   retitled "Contact address for this consignment".
4. Fold **Transit countries** and **Transporter** into a single "Transport
   details" row.
5. Rename rows to DR2's wording: "Main reason for importing" → "Main reason for
   import"; "Additional commodity details" → "Additional details"; "Animal
   identification details" → "Identification details"; "Uploaded documents" →
   "Upload documents".
6. Keep the frontend's row hints — DR2 renders none, but they are useful and
   there is no sign DR2 means to drop them.

Component note: the frontend uses `govukTaskList`
(`features/hub/template.njk:39`). DR2 uses a bespoke list. **Keep
`govukTaskList`** — stay inside the govuk toolbox.

### C2. Review page — retitle and regroup ⚠️

DR2 h1 **"Review your notification"** with **six** numbered sections; the
frontend h1 is **"Check your answers"** with **four**
(`features/check-answers/copy.en.js:2,37-42`).

DR2 structure (verified from the captured render):

| Section | Cards → rows |
|---|---|
| 1. About the consignment | **Import details** (Country of origin · Region of origin code · Internal reference number) · **Animal details** (Commodity code · Common name · Species) · **Main reason for import** (Reason for import · Purpose in the market) |
| 2. Description of the goods | per-commodity card, e.g. "Cattle (0102) / Bos Taurus" (Number of animals · Number of packages (when required) · Animal · Ear tag · Passport) · **Additional details** (Certified for · Includes unweaned animals) |
| 3. Transport and arrival | **Arrival details** (Port of entry · Arrival date at destination · Means of transport to the port of entry · Transport identification · Transport document reference) · *Transit countries* (when applicable) · **Transport details** (Name · Address · Country · Approval number · Type) |
| 4. Documents | **Uploaded documents** → "Document 1" (Document reference …) |
| 5. Consignment parties | **Addresses** (Place of origin · Consignor · Consignee · Importer · Place of destination · County parish holding number (CPH)) |
| 6. Contact address | **Contact address** |

Frontend, verified on the rendered page:

| Section | Cards |
|---|---|
| 1. About the consignment | Consignment details · Import details · Commodity details · Additional animal details |
| 2. Movement | Arrival details · Transport details |
| 3. Addresses | Roles and addresses · Contact address for this consignment |
| — | "Now submit your notification" + Continue |

A **4. Documents** section exists in copy (`copy.en.js:41`) but did not render
on a notification with no documents — so the frontend has four sections defined,
three shown here.

**Change**:

1. Retitle the page to **"Review your notification"**.
2. Re-cut four sections into DR2's six, per the table above.
3. Row label deltas: DR2 **"Arrival date at destination"** vs frontend
   **"Arrival date at port of entry"** (`copy.en.js:70`) — these disagree about
   *which* date is shown; resolve with the designer, it may be a prototype slip.
   DR2 **"Means of transport to the port of entry"** vs frontend **"Means of
   transport"** (`copy.en.js:71`).
4. Section-5 card is titled **"Addresses"** in DR2, **"Roles and addresses"** in
   the frontend.

### C3. Review page gains a status header ⚠️ NEW

DR2 wraps the review page in a header partial
(`views/partials/design-release-2/review-page-header.html`) that the frontend has
no equivalent of:

- h1 = the **notification reference** (not the page title)
- a status tag: Draft · Submitted · Submission complete · **Submitted action
  required**
- a `govukWarningText` when action is required, with text derived from what is
  missing — "You need to complete animal identifiers", "You need to upload a
  health certificate", or both (`app/routes.js:4638-4658`)
- "Date created" / "Date submitted"
- action buttons: **Amend this notification** (submitted or action-required
  only), **Copy as new**, **Delete**

**Change**: build this header. It is the single richest new component in the
release and it drives the whole amend/copy/delete surface.

---

## D. Amend and cancel-amend

### D1. Amend behind a confirmation modal ⚠️ NEW

DR2: **Amend this notification** opens a modal
(`views/partials/design-release-2/amend-notification-modal.html`) headed *"Are
you sure you want to amend this consignment?"* with **Yes, amend consignment**
(→ `/notifications/amend`) and a **Go back** dismiss.

`showAmendButton` is true only for `submitted` or `action-required`
(`app/routes.js:4693`).

Frontend: amend is a plain dashboard action with no confirmation.

**Change**: add the confirmation step. **Modal vs interstitial page is a
decision** — see open questions; a modal needs JS and a no-JS fallback, an
interstitial page does not.

### D2. Cancel-amend becomes a modal

DR2: a **Cancel amendment** trigger on the review page
(`views/design-release-2/review-notification.html:118`) opens
`cancel-amend-modal.html` — *"Are you sure you want to cancel this amendment?"* →
**Yes, cancel amendment**.

Frontend: a full page, `features/cancel-amend/` — h1 "Cancel this amendment?",
body *"Your changes since you started amending will be discarded and the
submitted version restored."*, **Yes, cancel amendment** / **No, return to
notification**.

**Change**: same decision as D1. If modals are adopted, `features/cancel-amend/`
becomes a partial; if not, no change is needed here at all.

---

## E. Dashboard ⚠️ Largest new surface

### E1. Dashboard rebuild

DR2 (`views/design-release-2/dashboard.html`) — h1 "Import notification service"
under a caption "Dashboard", with an Alpha phase banner:

1. **Actions**: **Create new notification** (primary) · **Use notification
   template** (secondary)
2. **At a glance** — three cards, each a count plus a link:
   - *Action needed* — "Tasks requiring your attention" → `/actions`
   - *Status updates* — "Changes in the past 24 hours" → `/changes`
   - *Inspection required* — "Consignments due at the BCP" → `/inspection`
3. **My notifications**:
   - a search input labelled **"Search by"**, hint *"Keyword, notification
     number, commodity or consignee/importer"*, with an icon submit button
   - a **Sort by** select
   - a collapsible **Additional filters** panel: `dateRange` radios, MOJ start/end
     date pickers ("For example, 27/3/2026"), a **By type** select, a **Status**
     select
   - two inline radio filters: **Needs action to avoid delays**, **Status changes**
   - a results count
   - notification cards
   - `govukPagination`

Card (`views/partials/design-release-2/dashboard-notification-card.html`):
category label (e.g. "Live animals") · reference as h3 · **Copy as new** and
**View notification** links · optional error marker and message · two rows of
fields — Commodity · Arrival date · Consignee · Notification status (tag) //
Number of animals · Origin · Consignor · Inspection (tag, when required).

Frontend, verified on the 2026-07-31 render — h1 "Import notification service",
an intro paragraph, a **Start a new notification** start-button, a **Filter
notifications** section (a `referenceNumber` input labelled "Keyword or
reference" plus a **Search** button, alongside the Sort-by select and its
**Update sort** button), `govuk-summary-card` rows, `govukPagination`.

Its card: reference as h3, fields Commodity · Origin · Arrival at destination //
Consignee · Consignor · Status // Date created · Date submitted. Actions vary by
status and now cover **Resume · Delete · Copy as new · Amend · View notification
· Cancel amendment**.

Two things changed since the first pass, both toward DR2: **keyword search
arrived**, and the card gained **Amend**, **View notification** and **Cancel
amendment**. The frontend's action set is now a superset of DR2's, so the
earlier worry that "Resume has no DR2 equivalent" resolves the other way — it is
DR2 that is missing draft-resume, not the frontend that has a stray action.

**Change**:

1. Add the caption + **Use notification template** secondary button; retitle
   **Start a new notification** → **Create new notification**.
2. Build the **At a glance** trio (needs counts from the backend).
3. Extend the existing **Filter notifications** section: keyword search and sort
   are in place; still missing are the additional-filters panel (date range, MoJ
   start/end pickers, type, status) and the two inline radio filters.
4. Restructure the card: add the category label and the **Inspection** tag; add
   **Number of animals**; drop **Date created** / **Date submitted** from the
   card face; rename **Status** → **Notification status** and **Arrival at
   destination** → **Arrival date**; surface **Copy as new** and **View
   notification** as the card actions — and resolve what happens to **Resume**
   and **Delete**.
5. Keep `govukPagination` and `govuk-summary-card` — DR2's card is bespoke CSS,
   the summary-card is the govuk-toolbox equivalent and already in place.

### E2. `/actions` — "Tasks requiring your attention" ⚠️ NEW

h2 "Notifications needing action", then the same notification cards filtered to
those needing action.

### E3. `/changes` — "Changes in past 24 hours" ⚠️ NEW

Cards grouped under change headings: **Passed inspection**, **Needs
inspection**, **Delayed**.

### E4. `/inspection` — "Consignments due at the border control post (BCP)" ⚠️ NEW

h2 "Notifications chosen for inspection", cards all carrying the Inspection tag,
plus a link *"what you need to do at a border inspection"*.

---

## F. Templates ⚠️ NEW

A whole feature with no frontend counterpart.

| Screen | Content |
|---|---|
| `/templates` — "Manage templates" | h2 "My templates", **Create new template**, then per-template cards (category label + name; Commodity · Origin · Consignee · Consignor) with **Use template** and **View template** |
| `/templates/create` — "Enter template name" | single `templateName` text input |
| `/templates/:id` — "Review your template" | a cut-down review: 1. About the consignment (Import details · Animal details · Main reason for import) · 2. Description of the goods (Additional details / Additional animal details — Certified for) · 3. Consignment parties (Addresses — Place of origin · Consignor · Consignee · Importer · CPH), with **Change** links and **Cancel and return to dashboard** |
| `/templates/:id/use` | resets the journey session and seeds it from the template, then lands on the hub (`app/routes.js:8433-8448`) |

Note the template review has **three** sections, not six — no transport, no
documents, no contact address. Templates carry the stable parts of a
notification only.

**Change**: build the feature. It needs a persisted template entity, so this is
backend work too — the largest single item in the release.

---

## G. Address book ⚠️ NEW

DR2 promotes address creation into a standalone address book shared across
releases (`app/lib/version-mount.js:45`):

| Screen | Content |
|---|---|
| `/address-book` — "Address book" | the saved addresses |
| `/address-book/add` — "What is the new address for?" | category radios |
| `/address-book/add/lookup` — "Add address details" | the address form |
| `/address-book/add/usage` | how the address may be used |

The frontend has an in-journey "Add a new address" only
(`features/addresses/create-address.njk`).

**Change**: this overlaps the **EUDPA-58 Address Book programme** (handover at
`workareas/shared/address-book-eudpa58/`). Reconcile before building — do not
implement DR2's address book independently.

---

## H. Suggested sequencing

0. ~~**A4**~~ — done (`d952d49c`).
1. **A1–A3, B4–B6, B10 button label, B14** — pure copy. Cheap, low risk,
   visible.
2. **C1** — hub regrouping. Unblocks the shape of everything else.
3. **B3** — the reason-for-import merge. The biggest journey change; do it
   before C2 so the review page has its final answer set.
4. **B9, B11** — transporter page split, address pickers. (**B1, B2, B7 and B8**
   are held for the enhanced-search round — see open question 6.)
5. **C2 + C3** — review page regroup and the status header.
6. **D1/D2** — amend confirmation, once C3 exists to host it.
7. **E1–E4** — dashboard family. Needs backend counts.
8. **F** — templates. Needs a backend entity.
9. **G** — address book, folded into EUDPA-58.
