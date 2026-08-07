# Screen map — DR2 → real frontend

URL shapes differ throughout. DR2 is flat (`/design-release-2/<page>`); the real
frontend is journey-scoped (`/notifications/{journeyId}/<slug>`, hub at
`/notifications/{journeyId}`, dashboard at `/`) — `src/server/live-animals/config.js:6`.

Verdicts: **MATCH** (same screen, cosmetic deltas only) · **COPY** (same
structure, different words) · **RESTRUCTURE** (pages split/merged or components
swapped) · **NEW** (no counterpart in the real frontend) · **FE-ONLY** (real
frontend has it, DR2 does not).

## Journey spine

Frontend h1s below are the **rendered** ones. Four pages render their fieldset
legend as the page heading, so the h1 differs from `copy.title`.

| # | DR2 | Real frontend | Verdict |
|---|---|---|---|
| 1 | `/origin-of-the-import` — "Origin of the import" | `origin` — "Origin of the import" | COPY |
| 2 | `/what-are-you-importing` — "What are you importing?" | `commodities` — "What are you importing?" | RESTRUCTURE |
| 3 | `/reason-for-import` — "Main reason for import" | `import-reason` — "What is the main reason for importing the animals?" + `import-purpose` + `destination-country` + `port-of-exit` + `exit-date` | **RESTRUCTURE (5 → 1)** |
| 4 | `/consignment-details` — "Commodity details" | `consignment-details` — "Consignment details" | COPY |
| 5 | `/animal-identification-details` — "Identification details" | `commodities/identification` — "Animal identification details" | COPY |
| 6 | `/additional-animal-details` — "Additional details" | `additional-details` — "Additional animal details" | COPY |
| 7 | `/arrival-details` — "Arrival details" | `port-of-entry` — "Arrival details" | RESTRUCTURE (date component) |
| 8 | `/transit-countries` — "Which countries…" | `transit-countries` — "Which countries…" | RESTRUCTURE |
| 9 | `/transporter` — "Transporter details" | `transporters` — "What type of transporter will move the animals?" + `transporters/select` + `transporters/private` | **RESTRUCTURE (3 → 1 + `/transporter/add`)** |
| 10 | `/upload-documents` — "Upload documents" | `accompanying-documents` — "Upload documents" | MATCH |
| 11 | `/roles-and-addresses` — "Consignment addresses" | `addresses` — "Consignment addresses" | MATCH |
| 11a | `/place-of-origin`, `/consignor-or-exporter`, `/consignee`, `/importer`, `/place-of-destination` | `addresses` party-picker (one template, party-parameterised) | RESTRUCTURE |
| 11b | `/cph-number` — "County parish holding number (CPH)" | `cph-number` — "County Parish Holding (CPH)" | COPY |
| 11c | `/permanent-address/select` — "Permanent address" | folded into `commodities/identification` | RESTRUCTURE |
| 12 | `/contact-address-for-consignment` | `consignment/contact/select` | MATCH |
| 13 | `/notification-hub` — "Overview" | hub — "Overview" | RESTRUCTURE |
| 14 | `/review-notification` — "Review your notification" | `notification-view` — "Check your answers" | **RESTRUCTURE** |
| 15 | `/declaration` — "Declaration" | `declaration` — "Declaration" | COPY |
| 16 | `/notification-submitted` | `confirmation` — "Import notification submitted" | COPY |

## Dashboard family

| DR2 | Real frontend | Verdict |
|---|---|---|
| `/design-release-2` — dashboard with "At a glance", search, sort, filters, cards, pagination | `/` — dashboard with intro, start button, sort, cards, pagination | **RESTRUCTURE** |
| `/actions` — "Tasks requiring your attention" | — | **NEW** |
| `/changes` — "Changes in past 24 hours" | — | **NEW** |
| `/inspection` — "Consignments due at the border control post (BCP)" | — | **NEW** |

## Templates

| DR2 | Real frontend | Verdict |
|---|---|---|
| `/templates` — "Manage templates" | — | **NEW** |
| `/templates/create` — "Enter template name" | — | **NEW** |
| `/templates/:id` — "Review your template" | — | **NEW** |
| `/templates/:id/use` — seeds a notification from a template | — | **NEW** |

## Amend / copy

| DR2 | Real frontend | Verdict |
|---|---|---|
| "Amend this notification" button → confirmation **modal** → `/notifications/amend` | dashboard `Amend` action | RESTRUCTURE (modal) |
| Cancel-amend **modal** on the review page | `cancel-amend` — full page "Cancel this amendment?" | **RESTRUCTURE (page → modal)** |
| `/notifications/copy-as-new` link on every card | dashboard `Copy` action | MATCH |

## Address book

| DR2 | Real frontend | Verdict |
|---|---|---|
| `/address-book` — "Address book" | — | **NEW** |
| `/address-book/add` — "What is the new address for?" | — | **NEW** |
| `/address-book/add/lookup` — "Add address details" | `addresses` create-address — "Add a new address" | RESTRUCTURE |
| `/address-book/add/usage` | — | **NEW** |

Note: the real frontend already has an in-journey "Add a new address" screen
(`features/addresses/create-address.njk`). DR2 promotes address creation into a
standalone, reusable address book with categories and a usage step. EUDPA-58
covers the address-book programme — reconcile before building this section.

## Real-frontend-only

| Real frontend | In DR2? | Note |
|---|---|---|
| `import-type` — "What are you importing?" (import-type filter, with a "You cannot use this service" dead end) | No | DR2 starts at origin. Decide whether DR2 drops the filter or simply does not model it. |
| `delete-notification` — "Delete this notification?" | Partially — DR2 renders a **Delete** button on the review header (`review-page-header.html:36`) but wires no route | DR2 shows intent without a screen. |
