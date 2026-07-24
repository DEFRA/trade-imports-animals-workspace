# IUU build backlog

This backlog contains **81 increments**: **30 todo** and **51 born blocked** across **7 milestones**.

> First-pass boundary: build one standalone IUU journey JSON aggregate and persist it to Mongo. Reference data is versioned local data. Inspector/PHSI checks/decisions are outside this service.

## m-01 — Service foundation

Create the CDP service skeleton, persisted IUU JSON aggregate, routing spine, task-list machinery and first-pass integration seams.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-001 | Scaffold the standalone IUU CDP service | scaffold | M | todo | — |
| inc-002 | Implement the IUU JSON document and draft lifecycle | add-model | M | todo | inc-001 |
| inc-003 | Persist and resume the aggregate in Mongo | add-persistence | L | todo | inc-002 |
| inc-004 | Build the journey routing spine | scaffold | M | todo | inc-003 |
| inc-005 | Create reusable task-list hub status machinery | scaffold | M | todo | inc-004 |
| inc-006 | Add a metadata-only upload adapter | add-integration-stub | M | todo | inc-005 |
| inc-007 | Enforce the first-pass integration boundary | add-integration-stub | M | todo | inc-006 |

### inc-001 — Scaffold the standalone IUU CDP service

- [inferred] The repository contains runnable frontend and backend services, unit/component test commands, linting, GOV.UK Frontend assets, health endpoints and local-development configuration. (Backlog phase brief and `target-model.md`).
- [inferred] The service identity is IUU throughout; the legacy `CVEDP`/CHED-P enum is accepted only at an explicitly named legacy adapter boundary. (Backlog phase brief and `target-model.md`).
- [inferred] A development-only identity adapter supplies a fixed prototype user/organisation without copying trace cookies, credentials or tokens (`integrations.md`, system 10).

### inc-002 — Implement the IUU JSON document and draft lifecycle

- [inferred] The typed `IuuNotificationDocument` matches the fenced TypeScript shape in `target-model.md`, including embedded commodities, attachments, catch certificates, documents, parties, transport and contacts.
- [inferred] A new document starts with `notificationType: "IUU"`, `status: "DRAFT"`, empty repeating arrays and ISO timestamps; optional fields remain absent until answered. (Backlog phase brief and `target-model.md`).
- [inferred] Dashboard filters, search state, CSRF tokens, ETags and actions use `IuuPageState`/`IuuPageRequest` and are excluded from the Mongo document. (Backlog phase brief and `target-model.md`).

### inc-003 — Persist and resume the aggregate in Mongo

- [inferred] One Mongo collection named `notification` stores the complete `IuuNotificationDocument` aggregate (`target-model.md`, Persistence).
- [inferred] Each successful page POST updates by stable reference, refreshes `updatedAt`, preserves `DRAFT`, and a GET resumes and repopulates all completed answers. (Backlog phase brief and `target-model.md`).
- [inferred] Submission is a separate idempotent operation that validates the whole draft, sets `submittedAt`, allocates/finalises the public reference and changes status to `SUBMITTED`. (Backlog phase brief and `target-model.md`).
- [inferred] Repository integration tests cover create, update, optimistic concurrency, resume and one-way DRAFT-to-SUBMITTED transition. (Backlog phase brief and `target-model.md`).

### inc-004 — Build the journey routing spine

- [inferred] Every canonical page slug in `journey-spec.json` has a named route descriptor in order 0–42 without yet inventing conditional rulings.
- [inferred] Back, save-and-continue, save-and-return-to-hub and resume navigation preserve the stable draft reference. (Backlog phase brief and `target-model.md`).
- [inferred] Conditional route predicates are isolated behind a typed routing policy so human rulings can be added without changing page handlers. (Backlog phase brief and `target-model.md`).

### inc-005 — Create reusable task-list hub status machinery

- [inferred] The hub renderer uses `govuk-task-list` and `govuk-tag`, derives status from persisted completion state and links each task to its first incomplete page. (Backlog phase brief and `target-model.md`).
- [inferred] Only verified status copy “Started” and “To do” is initially available; unverified “Completed”/gating labels cannot be enabled without the notification-hub ruling. (Backlog phase brief and `target-model.md`).
- [inferred] Returning to the hub after saving does not discard partially completed collection items. (Backlog phase brief and `target-model.md`).

### inc-006 — Add a metadata-only upload adapter

- [inferred] The first-pass upload adapter returns only `AttachmentMetadata` (`id`, `fileName`, optional `contentType`, optional `sizeBytes`) and does not store file bytes (`integrations.md`, system 6).
- [inferred] The UI never claims antivirus scanning occurred; production object storage, scan callbacks and retention remain explicit adapter seams. (Backlog phase brief and `target-model.md`).
- [inferred] Attachment metadata is persisted in the notification aggregate and can be linked by catch and supporting documents. (Backlog phase brief and `target-model.md`).

### inc-007 — Enforce the first-pass integration boundary

- [inferred] Mongo persistence is the only required live integration in the first pass (`integrations.md`: 16 systems, 1 needed).
- [inferred] Commodity, countries, BCP, establishment, trader and risk dependencies are injected adapters backed by versioned local fixtures. (Backlog phase brief and `target-model.md`).
- [inferred] Service Bus, SOAP/TRACES, Dynamics, GVMS arrival consumption, Notify and certificate PDF generation are disabled seams with contract tests proving page handlers do not call them. (Backlog phase brief and `target-model.md`).

## m-02 — Start, origin and commodity selection

Start a draft and capture its origin, purpose, fish commodity, species and risk inputs in canonical journey order.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-008 | Add page 00: Notifications dashboard (`notifications-dashboard`) | add-page | L | **BLOCKED — gate: sam** | inc-007 |
| inc-009 | Add page 01: Import type / notification type (CHED type selection) (`import-type`) | add-page | M | **BLOCKED — gate: sam** | inc-008 |
| inc-010 | Seed countries, territories and UK nations | add-reference-data | M | todo | inc-009 |
| inc-011 | Resolve and implement model extension: legacy-page-boundary-alias | add-model | M | **BLOCKED — gate: sam** | inc-010 |
| inc-012 | Add page 02: Country of origin (`country-of-origin`) | add-page | S | **BLOCKED — gate: sam** | inc-009, inc-010, inc-011 |
| inc-013 | Resolve and implement model extension: cross-page-conditionality | add-model | M | **BLOCKED — gate: sam** | inc-012 |
| inc-014 | Add page 03: Origin of import (conformance + change of destination after BCP) (`origin-of-import`) | add-page | M | **BLOCKED — gate: sam** | inc-012, inc-010, inc-011, inc-013 |
| inc-015 | Resolve and implement model extension: commodity-dependent-reference-data | add-model | M | **BLOCKED — gate: sam** | inc-014 |
| inc-016 | Seed the verified chapter-03 fish commodity path | add-reference-data | M | todo | inc-014 |
| inc-017 | Add page 04: Search commodity (enter commodity code) (`search-commodity`) | add-page | M | **BLOCKED — gate: sam** | inc-014, inc-015, inc-016 |
| inc-018 | Seed fish commodity stock/type values | add-reference-data | S | todo | inc-017 |
| inc-019 | Seed species for fish commodity 03019230 | add-reference-data | S | todo | inc-018 |
| inc-020 | Add page 05: Commodity basic description (type + species selection) (`commodity-basic-description`) | add-page | M | **BLOCKED — gate: sam** | inc-017, inc-015, inc-016, inc-019 |
| inc-021 | Add page 06: About the consignment (purpose of import) (`about-the-consignment`) | add-page | M | todo | inc-020 |
| inc-022 | Seed the risk-category vocabulary | add-reference-data | S | todo | inc-021 |
| inc-023 | Add page 07: Select risk category (risk level) (`select-risk-category`) | add-page | M | **BLOCKED — gate: sam** | inc-021, inc-013, inc-022 |
| inc-024 | Add page 08: Health certificate required (interstitial to task list) (`health-certificate-required`) | add-page | S | **BLOCKED — gate: sam** | inc-023, inc-013, inc-022 |
| inc-025 | Add page 09: Notification hub (task list) (`notification-hub`) | add-page | L | **BLOCKED — gate: sam** | inc-024 |

### inc-008 — Add page 00: Notifications dashboard

- [confirmed] The H1 reads exactly “Your import notifications” (journey-spec.json page `notifications-dashboard`, verified `confirmed`).
- [confirmed] The rendered page uses the verified component classes `govuk-notification-banner`, `govuk-button`, `govuk-select`, `govuk-input`, `govuk-date-input`, `govuk-fieldset`, `govuk-error-summary`, `govuk-tag`, `govuk-hint` in the roles recorded by journey-spec.json page `notifications-dashboard`.
- [confirmed] Controls or read-only values are labelled exactly “Keywords or notification number”, “Commodity”, “BCP or POE”, “Status”, “Country of origin”, “Consignee / Importer”, “Notification type”, “Microchip number (CHED-A only)”, “Arrival / Import date range”, “Start date range”, “End date range”, “Sort by:” (journey-spec.json page `notifications-dashboard`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Notification type”: “All”, “CHED-A”, “CHED-P”, “CHED-D”, “CHED-PP”, “Import from the EU”, “IMP-Animals”, “IMP-POAO”, “IMP-HRFNAO”; “Arrival / Import date range”: “Today”, “Tomorrow”, “Next seven days”, “Clear date range”; “Sort by:”: “Arrival (newest to oldest)”, “Arrival (oldest to newest)” (journey-spec.json page `notifications-dashboard`).
- [confirmed] The primary onward action reads exactly “Create a new notification” and successful use saves the current draft before routing onward (journey-spec.json page `notifications-dashboard`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Does the standalone IUU service need the full listing/search/dashboard surface, or only a create-notification entry point? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-009 — Add page 01: Import type / notification type (CHED type selection)

- [confirmed] The H1 reads exactly “What are you importing?” (journey-spec.json page `import-type`, verified `confirmed`).
- [confirmed] The caption reads exactly “About the consignment” (journey-spec.json page `import-type`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-radios`, `govuk-form-group`, `govuk-label`, `govuk-button`, `govuk-back-link` in the roles recorded by journey-spec.json page `import-type`.
- [confirmed] Controls or read-only values are labelled exactly “What are you importing?” (journey-spec.json page `import-type`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “What are you importing?”: “Live animals”, “Products of animal origin, germinal products or animal by-products”, “High risk food and feed of non-animal origin”, “Plants, plant products and other objects” (journey-spec.json page `import-type`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `import-type`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: Submitting 'Save and continue' with no CHED type selected. Rule mandatory/optional semantics for: What are you importing?. Is the legacy four-CHED “What are you importing?” router removed from the standalone IUU service? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-010 — Seed countries, territories and UK nations

- [confirmed] Versioned JSON contains 253 selectable entries plus the exact placeholder “Select a country” (254 rendered options), using submitted codes and display names (`integrations.md`, reference data 1).
- [inferred] The United Kingdom group contains “England” (`GB-ENG`), “Northern Ireland” (`GB-NIR`), “Scotland” (`GB-SCT`) and “Wales” (`GB-WLS`). (Backlog phase brief and `target-model.md`).
- [inferred] A reference-data test proves country selects render labels but persist codes. (Backlog phase brief and `target-model.md`).

### inc-011 — Resolve and implement model extension: legacy-page-boundary-alias

- [inferred] A human-approved executable shape replaces the flat-model limitation: Country of origin appears as its own inventory page and inside the rendered Origin of import page. The second field occurrence links to the first canonical obligation; the model cannot represent two alternative legacy page spines simultaneously. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `country-of-origin`, `origin-of-import`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `legacy-page-boundary-alias`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “legacy-page-boundary-alias”? Country of origin appears as its own inventory page and inside the rendered Origin of import page. The second field occurrence links to the first canonical obligation; the model cannot represent two alternative legacy page spines simultaneously. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-012 — Add page 02: Country of origin

- [confirmed] The H1 reads exactly “Origin of the animal or product” (journey-spec.json page `country-of-origin`, verified `confirmed`).
- [confirmed] The caption reads exactly “About the consignment” (journey-spec.json page `country-of-origin`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-form-group`, `govuk-label`, `govuk-select`, `govuk-button` in the roles recorded by journey-spec.json page `country-of-origin`.
- [confirmed] Controls or read-only values are labelled exactly “Country of origin” (journey-spec.json page `country-of-origin`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `country-of-origin`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `legacy-page-boundary-alias`.

**Open question (gate: sam):** [gap] legacy-page-boundary-alias: Country of origin appears as its own inventory page and inside the rendered Origin of import page. The second field occurrence links to the first canonical obligation; the model cannot represent two alternative legacy page spines simultaneously. Rule mandatory/optional semantics for: Country of origin. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-013 — Resolve and implement model extension: cross-page-conditionality

- [inferred] A human-approved executable shape replaces the flat-model limitation: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `catch-certificate-needed`, `attach-catch-certificate`, `manage-catch-certificates`, `add-catch-certificate-details`, `select-risk-category`, `health-certificate-required`, `latest-health-certificate`, `origin-of-import`, `means-of-transport-after-bcp`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “cross-page-conditionality”? Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-014 — Add page 03: Origin of import (conformance + change of destination after BCP)

- [confirmed] The H1 reads exactly “Origin of the import” (journey-spec.json page `origin-of-import`, verified `confirmed`).
- [confirmed] The caption reads exactly “About the consignment” (journey-spec.json page `origin-of-import`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-select`, `govuk-radios`, `govuk-fieldset`, `govuk-input`, `govuk-hint`, `govuk-label`, `govuk-link`, `govuk-button` in the roles recorded by journey-spec.json page `origin-of-import`.
- [confirmed] Controls or read-only values are labelled exactly “Country of origin”, “Does the consignment require a region of origin code?”, “Enter the region code”, “Country from where consigned”, “Does this consignment conform to regulatory requirements?”, “Will the consignment change vehicles or means of transport after the Border Control Post (BCP)?”, “Add a reference number for this consignment (optional)” (journey-spec.json page `origin-of-import`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Does the consignment require a region of origin code?”: “Yes”, “No”; “Does this consignment conform to regulatory requirements?”: “Yes”, “No”; “Will the consignment change vehicles or means of transport after the Border Control Post (BCP)?”: “Yes”, “No” (journey-spec.json page `origin-of-import`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `origin-of-import`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Conflicts: `c-004`.

**Open question (gate: sam):** [gap] c-004 (Region-code maximum length): Preserve both facts: hint copy remains verbatim and maxlength remains 3 in the mined legacy model. The rebuild must choose one consistent maximum and matching copy. legacy-page-boundary-alias: Country of origin appears as its own inventory page and inside the rendered Origin of import page. The second field occurrence links to the first canonical obligation; the model cannot represent two alternative legacy page spines simultaneously. cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Rule mandatory/optional semantics for: Country of origin; Country from where consigned; Does this consignment conform to regulatory requirements?; Will the consignment change vehicles or means of transport after the Border Control Post (BCP)?. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-015 — Resolve and implement model extension: commodity-dependent-reference-data

- [inferred] A human-approved executable shape replaces the flat-model limitation: Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `search-commodity`, `commodity-basic-description`, `commodity-extended-description`, `add-catch-certificate-details`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `commodity-dependent-reference-data`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “commodity-dependent-reference-data”? Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-016 — Seed the verified chapter-03 fish commodity path

- [confirmed] Versioned JSON contains the exact top-level label “03 FISH AND CRUSTACEANS, MOLLUSCS AND OTHER AQUATIC INVERTEBRATES” and traced code `03019230` (`integrations.md`, reference data 3).
- [inferred] The dataset identifies itself as a traced first-pass subset and does not claim full chapter-03 coverage. (Backlog phase brief and `target-model.md`).
- [inferred] Code search and tree traversal return the same stable commodity identifier. (Backlog phase brief and `target-model.md`).

### inc-017 — Add page 04: Search commodity (enter commodity code)

- [confirmed] The H1 reads exactly “Commodity” (journey-spec.json page `search-commodity`, verified `confirmed`).
- [confirmed] The caption reads exactly “Description of the goods” (journey-spec.json page `search-commodity`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-m`, `govuk-tabs`, `govuk-fieldset`, `govuk-input`, `govuk-label`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `search-commodity`.
- [confirmed] Controls or read-only values are labelled exactly “Enter commodity code”, “Search”, “Commodity code search”, “Find the commodity in the commodity tree” (journey-spec.json page `search-commodity`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Search” and successful use saves the current draft before routing onward (journey-spec.json page `search-commodity`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `commodity-dependent-reference-data`.

**Open question (gate: sam):** [gap] commodity-dependent-reference-data: Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. Supply verbatim validation copy and rules for: Likely empty / invalid commodity code on Search, but no error state was captured in this trace (0 errors).. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-018 — Seed fish commodity stock/type values

- [confirmed] The list contains exactly “Farmed stock” and “Wild stock” (`integrations.md`, reference data 4).
- [inferred] Stable prototype codes are persisted; no legacy category ID mapping is claimed. (Backlog phase brief and `target-model.md`).

### inc-019 — Seed species for fish commodity 03019230

- [confirmed] The list for `03019230` contains exactly “Anguilla anguilla” and “Anguilla spp.” (`integrations.md`, reference data 5).
- [inferred] The stable legacy-observed species ID `1756325` maps to “Anguilla spp.”. (Backlog phase brief and `target-model.md`).
- [inferred] Catch-certificate species choices are derived from species already present in commodity lines, not from an independent list. (Backlog phase brief and `target-model.md`).

### inc-020 — Add page 05: Commodity basic description (type + species selection)

- [confirmed] The H1 reads exactly “Commodity” (journey-spec.json page `commodity-basic-description`, verified `confirmed`).
- [confirmed] The caption reads exactly “Description of the goods” (journey-spec.json page `commodity-basic-description`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-table`, `govuk-select`, `govuk-checkboxes`, `govuk-radios`, `govuk-fieldset`, `govuk-hint`, `govuk-label`, `govuk-button`, `govuk-form-group` in the roles recorded by journey-spec.json page `commodity-basic-description`.
- [confirmed] Controls or read-only values are labelled exactly “Type of commodity”, “Select species of commodity”, “Do you want to add another commodity?” (journey-spec.json page `commodity-basic-description`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Type of commodity”: “Farmed stock”, “Wild stock”; “Select species of commodity”: “Anguilla anguilla”, “Anguilla spp.”; “Do you want to add another commodity?”: “Yes”, “No” (journey-spec.json page `commodity-basic-description`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `commodity-basic-description`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `commodity-dependent-reference-data`.

**Open question (gate: sam):** [gap] commodity-dependent-reference-data: Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-021 — Add page 06: About the consignment (purpose of import)

- [confirmed] The H1 reads exactly “What is the main reason for importing the consignment?” (journey-spec.json page `about-the-consignment`, verified `confirmed`).
- [confirmed] The caption reads exactly “About the consignment” (journey-spec.json page `about-the-consignment`).
- [confirmed] The rendered page uses the verified component classes `govuk-back-link`, `govuk-caption-xl`, `govuk-heading-xl`, `govuk-radios`, `govuk-fieldset`, `govuk-select`, `govuk-date-input`, `govuk-button`, `govuk-hint` in the roles recorded by journey-spec.json page `about-the-consignment`.
- [confirmed] Controls or read-only values are labelled exactly “What is the main reason for importing the consignment?”, “Purpose in the internal market”, “Destination country”, “Exit border control post”, “When the consignment will leave Great Britain”, “Time entry:”, “Transited country”, “Save and return to hub”, “Exit border control post (temporary admission of horses)” (journey-spec.json page `about-the-consignment`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “What is the main reason for importing the consignment?”: “Internal market”, “Transhipment or onward travel”, “Transit”, “Re-entry”; “Purpose in the internal market”: “Animal feedingstuff”, “Human consumption”, “Other” (journey-spec.json page `about-the-consignment`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `about-the-consignment`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-022 — Seed the risk-category vocabulary

- [confirmed] The list contains exactly “High risk”, “Medium risk” and “Low risk” (`integrations.md`, reference data 13).
- [inferred] The selected category is stored separately from `computedHighestCategory`; no regulatory outcome is calculated. (Backlog phase brief and `target-model.md`).

### inc-023 — Add page 07: Select risk category (risk level)

- [confirmed] The H1 reads exactly “Select the highest risk category for the commodities in this consignment” (journey-spec.json page `select-risk-category`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `select-risk-category`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-body`, `govuk-fieldset`, `govuk-radios`, `govuk-label`, `govuk-form-group`, `govuk-button` in the roles recorded by journey-spec.json page `select-risk-category`.
- [confirmed] Controls or read-only values are labelled exactly “Select the highest risk category for the commodities in this consignment”, “(hidden field — pre-computed highest risk category of the consignment's commodities)” (journey-spec.json page `select-risk-category`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Select the highest risk category for the commodities in this consignment”: “High risk”, “Medium risk”, “Low risk” (journey-spec.json page `select-risk-category`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `select-risk-category`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Conflicts: `c-012`.

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] c-012 (Risk-category initial state): Model highest-risk-category as a separate computed value and risk-category as an explicit user answer. Do not infer a canonical preselection from workflow defaults. cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Supply verbatim validation copy and rules for: Submitting with no radio selected — inferred required-field validation, exact copy unknown. Rule mandatory/optional semantics for: Select the highest risk category for the commodities in this consignment. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-024 — Add page 08: Health certificate required (interstitial to task list)

- [confirmed] The H1 reads exactly “Health certificate required” (journey-spec.json page `health-certificate-required`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `health-certificate-required`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-body`, `govuk-button` in the roles recorded by journey-spec.json page `health-certificate-required`.
- [confirmed] No user-input field is added; this remains the verified informational/navigation page (journey-spec.json page `health-certificate-required`).
- [confirmed] The primary onward action reads exactly “Continue” and successful use saves the current draft before routing onward (journey-spec.json page `health-certificate-required`; persistence contract in `target-model.md`).

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Does standalone IUU retain the high/medium-risk health-certificate interstitial and its verified CHED-P copy? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-025 — Add page 09: Notification hub (task list)

- [confirmed] The H1 reads exactly “Notification Hub” (journey-spec.json page `notification-hub`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `notification-hub`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-heading-m`, `govuk-body`, `govuk-task-list`, `govuk-tag`, `govuk-link` in the roles recorded by journey-spec.json page `notification-hub`.
- [confirmed] Controls or read-only values are labelled exactly “Origin of the import”, “Main reason for importing the consignment”, “Commodity”, “Additional details”, “Catch certificates”, “Latest health certificate”, “Accompanying documents”, “Approved establishment of origin (where required)”, “Addresses”, “Transport to the port of entry”, “Transport after the Border Control Post (BCP)”, “Goods movement services”, “Transporter”, “Contact details”, “Nominated contacts (optional)”, “Contact address for consignment”, “Review and submit” (journey-spec.json page `notification-hub`); search-only and read-only fields are not persisted as notification facts.
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Which of the 17 legacy CHED-P hub tasks belong in the standalone IUU journey, and what are the ruled status names beyond observed “Started” and “To do”? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

## m-03 — Commodity detail and IUU documents

Capture commodity quantities and the repeating catch-certificate, health-certificate, supporting-document and establishment collections.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-026 | Seed the commodity-filtered IUU package types | add-reference-data | M | todo | inc-025 |
| inc-027 | Implement the repeating commodity/species-line collection | add-collection | L | **BLOCKED — gate: sam** | inc-026, inc-015 |
| inc-028 | Add page 10: Commodity extended description (weights, packages) (`commodity-extended-description`) | add-page | L | **BLOCKED — gate: sam** | inc-025, inc-015, inc-016, inc-026, inc-027 |
| inc-029 | Seed storage-temperature values | add-reference-data | S | todo | inc-028 |
| inc-030 | Add page 11: Commodity additional details (storage temperature) (`commodity-additional-details`) | add-page | M | **BLOCKED — gate: sam** | inc-028, inc-029 |
| inc-031 | Add page 12: Catch certificate needed? (`catch-certificate-needed`) | add-page | M | **BLOCKED — gate: sam** | inc-030, inc-013 |
| inc-032 | Resolve and implement model extension: nested-catch-certificate-repeats | add-model | L | **BLOCKED — gate: sam** | inc-031 |
| inc-033 | Define and seed catch-certificate flag states | add-reference-data | M | **BLOCKED — gate: sam** | inc-032, inc-010 |
| inc-034 | Implement the catch-certificate attachment collection | add-collection | L | **BLOCKED — gate: sam** | inc-032, inc-006 |
| inc-035 | Add page 13: Attach catch certificate (file upload) (`attach-catch-certificate`) | add-page | M | **BLOCKED — gate: sam** | inc-031, inc-013, inc-032, inc-034 |
| inc-036 | Implement the add-another/manage catch-certificate loop | add-collection | L | **BLOCKED — gate: sam** | inc-035, inc-034 |
| inc-037 | Add page 14: Manage catch certificates (list + upload more?) (`manage-catch-certificates`) | add-page | L | **BLOCKED — gate: sam** | inc-035, inc-013, inc-032, inc-034, inc-036 |
| inc-038 | Rule attachment-to-certificate cardinality | spike | S | **BLOCKED — gate: sam** | inc-037 |
| inc-039 | Implement repeating per-certificate details | add-collection | L | **BLOCKED — gate: sam** | inc-038 |
| inc-040 | Associate a per-certificate set of consignment species | add-collection | M | **BLOCKED — gate: sam** | inc-039, inc-019 |
| inc-041 | Add page 15: Add catch certificate details (reference, issue date, flag state, species) (`add-catch-certificate-details`) | add-page | L | **BLOCKED — gate: sam** | inc-037, inc-013, inc-015, inc-019, inc-032, inc-033, inc-036, inc-040 |
| inc-042 | Add page 16: Latest health certificate (document reference, date, attachment) (`latest-health-certificate`) | add-page | M | **BLOCKED — gate: sam** | inc-041, inc-013, inc-022 |
| inc-043 | Add page 17: Document upload (attachment sub-page) (`document-upload`) | add-page | M | **BLOCKED — gate: sam** | inc-042 |
| inc-044 | Resolve and implement model extension: repeating-row-groups | add-model | M | **BLOCKED — gate: sam** | inc-043 |
| inc-045 | Seed accompanying-document types | add-reference-data | M | todo | inc-044 |
| inc-046 | Implement the supporting-document row collection | add-collection | L | **BLOCKED — gate: sam** | inc-044, inc-045, inc-006 |
| inc-047 | Add page 18: Accompanying documents (document type, reference, date) (`accompanying-documents`) | add-page | M | **BLOCKED — gate: sam** | inc-043, inc-044, inc-046 |
| inc-048 | Provide clearly labelled approved-establishment fixtures | add-reference-data | M | todo | inc-047 |
| inc-049 | Add page 19: Approved establishment of origin (landing) (`approved-establishment-of-origin`) | add-page | S | **BLOCKED — gate: sam** | inc-047, inc-044, inc-048 |
| inc-050 | Add page 20: Search for approved establishment (results + select) (`search-for-approved-establishment`) | add-page | M | **BLOCKED — gate: sam** | inc-049, inc-044, inc-048 |

### inc-026 — Seed the commodity-filtered IUU package types

- [confirmed] The dataset contains the exact 26-value IUU package seed in `integrations.md`, from “Bag” through “Vial”, plus the exact placeholder “Select type of package”.
- [inferred] It is keyed to the traced commodity/context and does not substitute the wider 33-value QA catalogue (conflict `c-003`).

### inc-027 — Implement the repeating commodity/species-line collection

- [inferred] Users can add another commodity and add/remove species lines without overwriting earlier lines. (Backlog phase brief and `target-model.md`).
- [inferred] Each `CommodityItem` owns `commodityCode`, optional `commodityTypeCode` and repeated `speciesLines`; each line owns species, net weight, package count and package type (`target-model.md`).
- [inferred] Collection tests cover two commodities, multiple species, edit/remove, save/resume and stable identity. (Backlog phase brief and `target-model.md`).

Model gap: `commodity-dependent-reference-data`.

**Open question (gate: sam):** [gap] What authoritative commodity-to-type/species/package joins and weight-unit rule should the repeating collection execute? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-028 — Add page 10: Commodity extended description (weights, packages)

- [confirmed] The H1 reads exactly “Commodity” (journey-spec.json page `commodity-extended-description`, verified `confirmed`).
- [confirmed] The caption reads exactly “Description of the goods” (journey-spec.json page `commodity-extended-description`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-m`, `govuk-table`, `govuk-select`, `govuk-input`, `govuk-button`, `govuk-summary-list`, `govuk-label`, `govuk-section-break` in the roles recorded by journey-spec.json page `commodity-extended-description`.
- [confirmed] Controls or read-only values are labelled exactly “Net weight (kg/units)”, “Number of packages”, “Type of package”, “Total gross weight (kg/units)” (journey-spec.json page `commodity-extended-description`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `commodity-extended-description`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `commodity-dependent-reference-data`.

**Open question (gate: sam):** [gap] commodity-dependent-reference-data: Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. Supply verbatim validation copy and rules for: Submitting the commodity details page with missing or non-numeric weight/package values. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-029 — Seed storage-temperature values

- [confirmed] The list contains exactly “Ambient”, “Chilled” and “Frozen” (`integrations.md`, reference data 12).
- [confirmed] The persisted codes are exactly `ambient`, `chilled` and `frozen` as modelled in `target-model.md`.

### inc-030 — Add page 11: Commodity additional details (storage temperature)

- [confirmed] The H1 reads exactly “Additional details” (journey-spec.json page `commodity-additional-details`, verified `confirmed`).
- [confirmed] The caption reads exactly “Description of the goods” (journey-spec.json page `commodity-additional-details`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-radios`, `govuk-form-group`, `govuk-button`, `govuk-back-link`, `govuk-body` in the roles recorded by journey-spec.json page `commodity-additional-details`.
- [confirmed] Controls or read-only values are labelled exactly “Temperature” (journey-spec.json page `commodity-additional-details`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Temperature”: “Ambient”, “Chilled”, “Frozen” (journey-spec.json page `commodity-additional-details`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `commodity-additional-details`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: submitting without selecting a storage temperature. Rule mandatory/optional semantics for: Temperature. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-031 — Add page 12: Catch certificate needed?

- [confirmed] The H1 reads exactly “Catch certificates” (journey-spec.json page `catch-certificate-needed`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `catch-certificate-needed`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-l`, `govuk-body`, `govuk-details`, `govuk-fieldset`, `govuk-radios`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `catch-certificate-needed`.
- [confirmed] Controls or read-only values are labelled exactly “Do you need to add catch certificates?” (journey-spec.json page `catch-certificate-needed`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Do you need to add catch certificates?”: “Yes”, “No – all the wild fish in this consignment are exempt from IUU fishing controls” (journey-spec.json page `catch-certificate-needed`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `catch-certificate-needed`; persistence contract in `target-model.md`).
- [confirmed] IUU-specific copy includes verbatim “You must add catch certificates for all fish species unless they are exempt from illegal, unreported and unregulated (IUU) fishing controls.”, “For help with catch certificates, check the guidance on importing or moving fish into the UK (opens in new tab).” (journey-spec.json page `catch-certificate-needed`); it is not generalised into generic CHED-P copy.
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Supply verbatim validation copy and rules for: "Save and continue" clicked with neither radio selected. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-032 — Resolve and implement model extension: nested-catch-certificate-repeats

- [inferred] A human-approved executable shape replaces the flat-model limitation: An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `attach-catch-certificate`, `manage-catch-certificates`, `add-catch-certificate-details`, `review-notification`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “nested-catch-certificate-repeats”? An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-033 — Define and seed catch-certificate flag states

- [confirmed] The select has the exact placeholder “Select flag state” and 250 selectable country labels, persisting ISO codes such as `FR` for “France” (`integrations.md`, reference data 2).
- [inferred] The country-to-flag-state inclusion rule is versioned, documented and tested independently from the general country dataset. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] What is the authoritative rule that projects the general country catalogue into the 250 catch-certificate flag states? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-034 — Implement the catch-certificate attachment collection

- [inferred] Uploading two files creates two stable `AttachmentMetadata` items and both survive save/resume. (Backlog phase brief and `target-model.md`).
- [inferred] Each uploaded item can be selected for “Add details”; file bytes and scan claims remain outside the first-pass adapter. (Backlog phase brief and `target-model.md`).
- [inferred] Tests cover add, remove, replace metadata and the observed upload-more loop without assuming one certificate per file. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] What attachment-to-certificate cardinality and deletion behaviour should the collection enforce? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-035 — Add page 13: Attach catch certificate (file upload)

- [confirmed] The H1 reads exactly “Upload catch certificates” (journey-spec.json page `attach-catch-certificate`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `attach-catch-certificate`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-l`, `govuk-body`, `govuk-inset-text`, `govuk-list`, `govuk-details`, `govuk-file-upload`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `attach-catch-certificate`.
- [confirmed] Controls or read-only values are labelled exactly “Choose files” (journey-spec.json page `attach-catch-certificate`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Continue” and successful use saves the current draft before routing onward (journey-spec.json page `attach-catch-certificate`; persistence contract in `target-model.md`).
- [confirmed] IUU-specific copy includes verbatim “You can select up to 10 documents at a time, and up to 100 documents in total. You can include multiple catch certificates in one document.”, “Each document must be:” (journey-spec.json page `attach-catch-certificate`); it is not generalised into generic CHED-P copy.
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] nested-catch-certificate-repeats: An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Supply verbatim validation copy and rules for: Likely: no file provided on Continue, file over 10MB, or a file type outside DOC/PDF/XLS/JPEG/PNG. Not captured in a trace here.. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-036 — Implement the add-another/manage catch-certificate loop

- [inferred] “Yes” to “Do you need to upload more catch certificates?” routes to upload and returns to the same managed collection. (Backlog phase brief and `target-model.md`).
- [inferred] “No” preserves every attachment and routes to the next incomplete certificate-details task. (Backlog phase brief and `target-model.md`).
- [inferred] The manage view exposes each attachment once with deterministic add/edit/remove actions and does not lose completed certificate metadata. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] Confirm loop exit rules and whether an attachment with zero, one or several certificate records can be saved. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-037 — Add page 14: Manage catch certificates (list + upload more?)

- [confirmed] The H1 reads exactly “Manage catch certificates” (journey-spec.json page `manage-catch-certificates`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `manage-catch-certificates`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-radios`, `govuk-button`, `govuk-form-group`, `govuk-link`, `govuk-body`, `govuk-grid-row` in the roles recorded by journey-spec.json page `manage-catch-certificates`.
- [confirmed] Controls or read-only values are labelled exactly “Do you need to upload more catch certificates?”, “Add details”, “View or amend details”, “Remove” (journey-spec.json page `manage-catch-certificates`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Do you need to upload more catch certificates?”: “Yes”, “No” (journey-spec.json page `manage-catch-certificates`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `manage-catch-certificates`; persistence contract in `target-model.md`).
- [confirmed] IUU-specific copy includes verbatim “Attachment 1 of 1”, “Reference: CatchCertificateRef-qf90m0il” (journey-spec.json page `manage-catch-certificates`); it is not generalised into generic CHED-P copy.
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. nested-catch-certificate-repeats: An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. Supply verbatim validation copy and rules for: Submitting 'Save and continue' with no radio selected is the likely validation, but no error state was captured in this trace (the radio was always selected before submit).. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-038 — Rule attachment-to-certificate cardinality

- [inferred] A signed decision states minimum/maximum certificates per attachment, whether one certificate may reference multiple attachments, and delete/reassign behaviour. (Backlog phase brief and `target-model.md`).
- [confirmed] The decision is reconciled with trace actions 40, 47, 51, 53, 60 and 64 and request 3987 without treating the tested one-file/one-certificate habit as a rule.
- [inferred] The approved examples become executable collection contract tests. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] Can one attachment describe multiple certificates, can one certificate have multiple attachments, and what cardinality is mandatory? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-039 — Implement repeating per-certificate details

- [inferred] Each catch certificate stores its own reference, ISO issue date, flag-state country code, species set and attachment ID (`target-model.md`).
- [inferred] Adding a second certificate does not overwrite the first; edit/remove operations retain stable identities through save/resume. (Backlog phase brief and `target-model.md`).
- [inferred] Date and reference validation are enabled only with human-approved rules and verbatim error copy. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] Confirm per-certificate requiredness, validation copy and the approved attachment cardinality before building the editor. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-040 — Associate a per-certificate set of consignment species

- [inferred] Species checkboxes are derived only from the notification’s commodity/species lines and persist `{commodityCode, speciesCode}` pairs. (Backlog phase brief and `target-model.md`).
- [inferred] “Select all” affects only the current certificate; two certificates may retain different species sets. (Backlog phase brief and `target-model.md`).
- [inferred] Removing a commodity/species line exposes a deterministic, human-approved reconciliation path rather than silently orphaning certificate links. (Backlog phase brief and `target-model.md`).

Model gap: `nested-catch-certificate-repeats`.

**Open question (gate: sam):** [gap] How should existing catch certificates be reconciled when a referenced commodity/species line changes or is removed? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-041 — Add page 15: Add catch certificate details (reference, issue date, flag state, species)

- [confirmed] The H1 reads exactly “Add catch certificate details” (journey-spec.json page `add-catch-certificate-details`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `add-catch-certificate-details`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-summary-list`, `govuk-details`, `govuk-accordion`, `govuk-input`, `govuk-date-input`, `govuk-select`, `govuk-inset-text`, `govuk-checkboxes`, `govuk-fieldset`, `govuk-button`, `govuk-back-link` in the roles recorded by journey-spec.json page `add-catch-certificate-details`.
- [confirmed] Controls or read-only values are labelled exactly “Number of catch certificates in this attachment”, “Catch certificate reference”, “Date of issue”, “Flag state of catching vessel(s)”, “Select all”, “Select species being imported under this catch certificate” (journey-spec.json page `add-catch-certificate-details`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `add-catch-certificate-details`; persistence contract in `target-model.md`).
- [confirmed] IUU-specific copy includes verbatim “Attachment 1”, “example.png (opens in new tab)” (journey-spec.json page `add-catch-certificate-details`); it is not generalised into generic CHED-P copy.
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] nested-catch-certificate-repeats: An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. commodity-dependent-reference-data: Commodity code controls the available commodity type, species, package types and catch-certificate species rows. The model stores observed samples and textual conditions but cannot encode the external reference-data joins. Supply verbatim validation copy and rules for: No error state was captured in this trace (0 errors on the snapshot). Validation copy for missing reference / invalid date / missing flag state / no species selected is unknown from this evidence.. Rule mandatory/optional semantics for: Catch certificate reference; Date of issue; Flag state of catching vessel(s); Select species being imported under this catch certificate. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-042 — Add page 16: Latest health certificate (document reference, date, attachment)

- [confirmed] The H1 reads exactly “Latest Health Certificate” (journey-spec.json page `latest-health-certificate`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `latest-health-certificate`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-m`, `govuk-body`, `govuk-warning-text`, `govuk-inset-text`, `govuk-fieldset`, `govuk-date-input`, `govuk-input`, `govuk-form-group`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `latest-health-certificate`.
- [confirmed] Controls or read-only values are labelled exactly “Document reference”, “Document type”, “Day”, “Month”, “Year”, “Add attachment”, “View <filename>” (journey-spec.json page `latest-health-certificate`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Document type”: “Veterinary health certificate” (journey-spec.json page `latest-health-certificate`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `latest-health-certificate`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Supply verbatim validation copy and rules for: Whether Document reference and the issue date are mandatory on THIS page could not be confirmed: the corpus trace has 0 errors, there are no HTML5 required attributes, and no QA test drives an empty reference/date to assert an error. Every workflow fills both, which suggests they are expected, but the required rule and its error copy are unconfirmed.. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-043 — Add page 17: Document upload (attachment sub-page)

- [confirmed] The H1 reads exactly “Upload a document” (journey-spec.json page `document-upload`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `document-upload`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-body`, `govuk-list`, `govuk-form-group`, `govuk-label`, `govuk-file-upload`, `govuk-button`, `govuk-link`, `govuk-error-summary` in the roles recorded by journey-spec.json page `document-upload`.
- [confirmed] Controls or read-only values are labelled exactly “Select a document” (journey-spec.json page `document-upload`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Continue” and successful use saves the current draft before routing onward (journey-spec.json page `document-upload`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Conflicts: `c-013`.

**Open question (gate: sam):** [gap] c-013 (Document-upload 10 MB boundary): Preserve both verbatim strings and leave the inclusive/exclusive 10 MB boundary unresolved until a boundary test or product ruling supplies it. Supply verbatim validation copy and rules for: Continue pressed with no file selected. Rule mandatory/optional semantics for: Select a document. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-044 — Resolve and implement model extension: repeating-row-groups

- [inferred] A human-approved executable shape replaces the flat-model limitation: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `accompanying-documents`, `nominated-contacts`, `transport-details`, `approved-establishment-of-origin`, `search-for-approved-establishment`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “repeating-row-groups”? Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-045 — Seed accompanying-document types

- [confirmed] The dataset contains exactly the 13 selectable values in `integrations.md`, beginning “Veterinary health certificate” and ending “Other”, plus the observed placeholder.
- [inferred] Catch certificates and latest health certificates remain separate document categories; the wider 27-value catalogue is not rendered (conflict `c-002`).

### inc-046 — Implement the supporting-document row collection

- [inferred] Users can add, edit and remove repeated accompanying-document rows without overwriting other rows. (Backlog phase brief and `target-model.md`).
- [confirmed] Each row stores exact document type code, optional reference, ISO issue date and optional attachment ID; latest health certificate remains a distinct slot (`target-model.md`).
- [inferred] Tests cover partially completed rows, attachment return navigation, save/resume and deterministic row identity. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] What row cardinality, partial-row validation and mandatory-document rules apply to IUU supporting documents? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-047 — Add page 18: Accompanying documents (document type, reference, date)

- [confirmed] The H1 reads exactly “Accompanying documents” (journey-spec.json page `accompanying-documents`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `accompanying-documents`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-body`, `govuk-list`, `govuk-details`, `govuk-select`, `govuk-input`, `govuk-date-input`, `govuk-fieldset`, `govuk-button`, `govuk-link`, `govuk-form-group` in the roles recorded by journey-spec.json page `accompanying-documents`.
- [confirmed] Controls or read-only values are labelled exactly “Document type”, “Document reference”, “Day”, “Month”, “Year”, “Add attachment” (journey-spec.json page `accompanying-documents`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `accompanying-documents`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] repeating-row-groups: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. Supply verbatim validation copy and rules for: This trace snapshot has zero errors and no error summary; no inline field-validation copy for the document type/reference/date row was captured. The accessibility test proves the page can be saved with these EMPTY (ched-p-accessibility-tests.spec.ts:97-98), so there is likely no required-field validation on the row itself — but partial-row validation (e.g. a reference with no type, or an incomplete date) is untested. Mine an error-bearing trace to confirm.. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-048 — Provide clearly labelled approved-establishment fixtures

- [inferred] A small versioned fixture list supports search and selection and is visibly labelled as prototype data, not the live approval register (`integrations.md`, reference data 10).
- [inferred] Selected values persist stable `establishmentId` entries and round-trip to the landing page. (Backlog phase brief and `target-model.md`).
- [inferred] The adapter exposes a manual-entry/future-live seam without inventing the unknown register size. (Backlog phase brief and `target-model.md`).

### inc-049 — Add page 19: Approved establishment of origin (landing)

- [confirmed] The H1 reads exactly “Approved establishment of origin (where required)” (journey-spec.json page `approved-establishment-of-origin`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `approved-establishment-of-origin`).
- [confirmed] The rendered page uses the verified component classes `govuk-back-link`, `govuk-caption-xl`, `govuk-heading-xl`, `govuk-table`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `approved-establishment-of-origin`.
- [confirmed] Controls or read-only values are labelled exactly “Search for an approved establishment” (journey-spec.json page `approved-establishment-of-origin`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `approved-establishment-of-origin`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] repeating-row-groups: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-050 — Add page 20: Search for approved establishment (results + select)

- [confirmed] The H1 reads exactly “Search for an approved establishment” (journey-spec.json page `search-for-approved-establishment`, verified `confirmed`).
- [confirmed] The caption reads exactly “Documents” (journey-spec.json page `search-for-approved-establishment`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-form-group`, `govuk-label`, `govuk-select`, `govuk-input`, `govuk-button`, `govuk-table`, `govuk-section-break`, `govuk-visually-hidden` in the roles recorded by journey-spec.json page `search-for-approved-establishment`.
- [confirmed] Controls or read-only values are labelled exactly “Country (required)”, “Name”, “Approval number”, “Section”, “Type”, “Status”, “Sort by:”, “Select”, “Save and continue”, “Search for an approved establishment” (journey-spec.json page `search-for-approved-establishment`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Status”: “Select status”, “Approved”; “Sort by:”: “Default search order”, “Name (A to Z)”, “Name (Z to A)” (journey-spec.json page `search-for-approved-establishment`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `search-for-approved-establishment`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] repeating-row-groups: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

## m-04 — Traders

Capture consignor, consignee, importer and place-of-destination party snapshots through the observed search/create/confirm loops.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-051 | Add page 21: Traders addresses (economic operators hub) (`traders-addresses`) | add-page | M | **BLOCKED — gate: sam** | inc-050 |
| inc-052 | Add page 22: Search existing consignor / exporter (`search-existing-consignor`) | add-page | M | todo | inc-051 |
| inc-053 | Add page 23: Consignor / exporter creation (address form) (`consignor-creation`) | add-page | M | todo | inc-052, inc-010 |
| inc-054 | Add page 24: Consignor confirmation (add to notification) (`consignor-confirmation`) | add-page | S | todo | inc-053 |
| inc-055 | Add page 25: Search existing consignee (`search-existing-consignee`) | add-page | M | **BLOCKED — gate: sam** | inc-054 |
| inc-056 | Add page 26: Consignee creation (address form) (`consignee-creation`) | add-page | M | **BLOCKED — gate: sam** | inc-055, inc-010 |
| inc-057 | Add page 27: Consignee confirmation (add to notification) (`consignee-confirmation`) | add-page | S | todo | inc-056 |

### inc-051 — Add page 21: Traders addresses (economic operators hub)

- [confirmed] The H1 reads exactly “Addresses” (journey-spec.json page `traders-addresses`, verified `confirmed`).
- [confirmed] The caption reads exactly “Traders” (journey-spec.json page `traders-addresses`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-hint`, `govuk-table`, `govuk-warning-text`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `traders-addresses`.
- [confirmed] Controls or read-only values are labelled exactly “Consignor or exporter”, “Consignee”, “Importer”, “Place of destination” (journey-spec.json page `traders-addresses`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Consignor or exporter”: “Add a consignor or exporter”, “Change”; “Consignee”: “Add a consignee”, “Change”; “Importer”: “Same as consignee”, “Add an importer”; “Place of destination”: “Same as consignee”, “Add a place of destination” (journey-spec.json page `traders-addresses`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `traders-addresses`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Rule mandatory/optional semantics for: Consignor or exporter; Consignee; Importer; Place of destination. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-052 — Add page 22: Search existing consignor / exporter

- [confirmed] The H1 reads exactly “Search for an existing consignor or exporter” (journey-spec.json page `search-existing-consignor`, verified `confirmed`).
- [confirmed] The caption reads exactly “Traders” (journey-spec.json page `search-existing-consignor`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-input`, `govuk-label`, `govuk-button`, `govuk-table`, `govuk-link`, `govuk-section-break`, `govuk-visually-hidden` in the roles recorded by journey-spec.json page `search-existing-consignor`.
- [confirmed] Controls or read-only values are labelled exactly “Name”, “Address” (journey-spec.json page `search-existing-consignor`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Search” and successful use saves the current draft before routing onward (journey-spec.json page `search-existing-consignor`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-053 — Add page 23: Consignor / exporter creation (address form)

- [confirmed] The H1 reads exactly “Add consignee” (journey-spec.json page `consignor-creation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `consignor-creation`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-input`, `govuk-label`, `govuk-fieldset`, `govuk-select`, `govuk-form-group`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `consignor-creation`.
- [confirmed] Controls or read-only values are labelled exactly “Consignee name”, “Address line 1”, “Address line 2 (optional)”, “Address line 3 (optional)”, “City or town”, “Postcode or ZIP code”, “Telephone number”, “Country”, “Email address” (journey-spec.json page `consignor-creation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Country”: “Please select your country”, “England”, “Scotland”, “Wales”, “Northern Ireland” (journey-spec.json page `consignor-creation`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `consignor-creation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-054 — Add page 24: Consignor confirmation (add to notification)

- [confirmed] The H1 reads exactly “The consignor or exporter has been created” (journey-spec.json page `consignor-confirmation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525740 - CHEDP” (journey-spec.json page `consignor-confirmation`).
- [confirmed] The rendered page uses the verified component classes `govuk-panel`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `consignor-confirmation`.
- [confirmed] Controls or read-only values are labelled exactly “Add to notification” (journey-spec.json page `consignor-confirmation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Add to notification” and successful use saves the current draft before routing onward (journey-spec.json page `consignor-confirmation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-055 — Add page 25: Search existing consignee

- [confirmed] The H1 reads exactly “Search for an existing consignee” (journey-spec.json page `search-existing-consignee`, verified `confirmed`).
- [confirmed] The caption reads exactly “Traders” (journey-spec.json page `search-existing-consignee`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-input`, `govuk-button`, `govuk-table`, `govuk-link`, `govuk-section-break` in the roles recorded by journey-spec.json page `search-existing-consignee`.
- [confirmed] Controls or read-only values are labelled exactly “Name”, “Address”, “Traders search results table”, “Create a new consignee” (journey-spec.json page `search-existing-consignee`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Traders search results table”: “Name”, “Address”, “Country”, “View”, “Select” (journey-spec.json page `search-existing-consignee`).
- [confirmed] The primary onward action reads exactly “Search” and successful use saves the current draft before routing onward (journey-spec.json page `search-existing-consignee`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: the unexercised invalid state. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-056 — Add page 26: Consignee creation (address form)

- [confirmed] The H1 reads exactly “Add consignee” (journey-spec.json page `consignee-creation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `consignee-creation`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-fieldset`, `govuk-form-group`, `govuk-label`, `govuk-input`, `govuk-select`, `govuk-button`, `govuk-link`, `govuk-grid-row` in the roles recorded by journey-spec.json page `consignee-creation`.
- [confirmed] Controls or read-only values are labelled exactly “Consignee name”, “Address line 1”, “Address line 2 (optional)”, “Address line 3 (optional)”, “City or town”, “Postcode or ZIP code”, “Telephone number”, “Country”, “Email address” (journey-spec.json page `consignee-creation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `consignee-creation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Rule mandatory/optional semantics for: Consignee name; Address line 1; City or town; Country. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-057 — Add page 27: Consignee confirmation (add to notification)

- [confirmed] The H1 reads exactly “The consignee has been created” (journey-spec.json page `consignee-confirmation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `consignee-confirmation`).
- [confirmed] The rendered page uses the verified component classes `govuk-panel`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `consignee-confirmation`.
- [confirmed] No user-input field is added; this remains the verified informational/navigation page (journey-spec.json page `consignee-confirmation`).
- [confirmed] The primary onward action reads exactly “Add to notification” and successful use saves the current draft before routing onward (journey-spec.json page `consignee-confirmation`; persistence contract in `target-model.md`).

## m-05 — Transport and contacts

Capture transport legs, goods-movement answers, transporter details, responsible contacts and the branch contact address.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-058 | Seed ports of entry / BCP fixtures | add-reference-data | M | todo | inc-057 |
| inc-059 | Seed means-of-transport values | add-reference-data | S | todo | inc-058 |
| inc-060 | Add page 28: Transport details to BCP (port of entry + arrival leg) (`transport-details`) | add-page | L | **BLOCKED — gate: sam** | inc-057, inc-044, inc-059, inc-058 |
| inc-061 | Add page 29: Means of transport after BCP (onward leg) (`means-of-transport-after-bcp`) | add-page | M | **BLOCKED — gate: sam** | inc-060, inc-013, inc-059 |
| inc-062 | Add page 30: Goods movement services (Common Transit / GVMS) (`goods-movement-services`) | add-page | M | **BLOCKED — gate: sam** | inc-061 |
| inc-063 | Add page 31: Transporter (landing / add) (`transporter`) | add-page | M | **BLOCKED — gate: sam** | inc-062 |
| inc-064 | Add page 32: Search existing transporter (`search-existing-transporter`) | add-page | M | todo | inc-063 |
| inc-065 | Add page 33: Transporter creation (address form) (`transporter-creation`) | add-page | M | todo | inc-064, inc-010 |
| inc-066 | Add page 34: Transporter confirmation (add to notification) (`transporter-confirmation`) | add-page | S | todo | inc-065 |
| inc-067 | Add page 35: Contact details (`contact-details`) | add-page | M | todo | inc-066 |
| inc-068 | Add page 36: Nominated contacts (`nominated-contacts`) | add-page | M | **BLOCKED — gate: sam** | inc-067, inc-044 |
| inc-069 | Add page 37: Contact address (branch address landing) (`contact-address`) | add-page | M | **BLOCKED — gate: sam** | inc-068 |
| inc-070 | Add page 38: Branch address creation (address form) (`branch-address-creation`) | add-page | M | todo | inc-069, inc-010 |
| inc-071 | Add page 39: Branch address confirmation (return to notification) (`branch-address-confirmation`) | add-page | S | todo | inc-070 |

### inc-058 — Seed ports of entry / BCP fixtures

- [confirmed] Versioned JSON contains the 33 captured selectable ports plus the observed placeholder; “TILBURY (GBTIL)” persists code `GBTIL` (`integrations.md`, reference data 9).
- [inferred] The fixture adapter explicitly does not claim live BCP eligibility filtering. (Backlog phase brief and `target-model.md`).

### inc-059 — Seed means-of-transport values

- [confirmed] The list contains exactly “Airplane”, “Railway”, “Road vehicle” and “Vessel”, plus the observed placeholder (`integrations.md`, reference data 11).
- [inferred] The same stable codes serve the to-port and after-BCP legs. (Backlog phase brief and `target-model.md`).

### inc-060 — Add page 28: Transport details to BCP (port of entry + arrival leg)

- [confirmed] The H1 reads exactly “Transport to the port of entry” (journey-spec.json page `transport-details`, verified `confirmed`).
- [confirmed] The caption reads exactly “Transport” (journey-spec.json page `transport-details`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-m`, `govuk-select`, `govuk-label`, `govuk-hint`, `govuk-input`, `govuk-radios`, `govuk-checkboxes`, `govuk-fieldset`, `govuk-date-input`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `transport-details`.
- [confirmed] Controls or read-only values are labelled exactly “Port of entry”, “Choose from:”, “Transport identification”, “Are any road trailers or shipping containers being used to transport the consignment?”, “Container or trailer number”, “Seal number”, “Official seal”, “Transport document reference”, “Estimated arrival at port of entry”, “Time of estimated arrival”, “BCP or Port of entry”, “Entry border control post”, “Inspection premises”, “Means of transport after BCP or Port of entry”, “Estimated journey time (Hours)” (journey-spec.json page `transport-details`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Choose from:”: “Select means of transport to port of entry”, “Airplane”, “Railway”, “Road vehicle”, “Vessel”; “Are any road trailers or shipping containers being used to transport the consignment?”: “Yes”, “No”; “Official seal”: “Official seal” (journey-spec.json page `transport-details`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `transport-details`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] repeating-row-groups: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. Supply verbatim validation copy and rules for: the unexercised invalid state. Rule mandatory/optional semantics for: Port of entry; Choose from:; Transport identification; Are any road trailers or shipping containers being used to transport the consignment?; Container or trailer number; Transport document reference; Estimated arrival at port of entry; Time of estimated arrival. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-061 — Add page 29: Means of transport after BCP (onward leg)

- [confirmed] The H1 reads exactly “Transport after the Border Control Post (BCP)” (journey-spec.json page `means-of-transport-after-bcp`, verified `confirmed`).
- [confirmed] The caption reads exactly “Transport” (journey-spec.json page `means-of-transport-after-bcp`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-heading-m`, `govuk-body`, `govuk-select`, `govuk-input`, `govuk-label`, `govuk-hint`, `govuk-fieldset`, `govuk-date-input`, `govuk-form-group`, `govuk-button`, `govuk-link`, `govuk-visually-hidden` in the roles recorded by journey-spec.json page `means-of-transport-after-bcp`.
- [confirmed] Controls or read-only values are labelled exactly “Choose from:”, “Transport identification”, “Transport document reference”, “Date and time of departure from BCP” (journey-spec.json page `means-of-transport-after-bcp`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Choose from:”: “Select means of transport after the BCP”, “Airplane”, “Railway”, “Road vehicle”, “Vessel” (journey-spec.json page `means-of-transport-after-bcp`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `means-of-transport-after-bcp`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `cross-page-conditionality`.

**Open question (gate: sam):** [gap] cross-page-conditionality: Several page/field obligations depend on an answer collected on a different page: catch-certificate-needed drives the catch-certificate sub-journey; risk-category gates health-certificate pages; transport-details-required drives the after-BCP transport leg. The flat page/field model records these conditions as text but cannot execute the routing graph. Supply verbatim validation copy and rules for: Required-ness and error copy for the select, both text inputs, and the departure time are unverified. No trace rendered an error state (0 errors) and no test drives an empty/partial submit of this page, so no 'enter/select …' required-field message was ever observed or asserted.. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-062 — Add page 30: Goods movement services (Common Transit / GVMS)

- [confirmed] The H1 reads exactly “Goods movement services” (journey-spec.json page `goods-movement-services`, verified `confirmed`).
- [confirmed] The caption reads exactly “Transport” (journey-spec.json page `goods-movement-services`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-radios`, `govuk-fieldset`, `govuk-input`, `govuk-label`, `govuk-hint`, `govuk-details`, `govuk-button`, `govuk-back-link`, `govuk-list`, `govuk-link` in the roles recorded by journey-spec.json page `goods-movement-services`.
- [confirmed] Controls or read-only values are labelled exactly “Are you using the Common Transit Convention (CTC) to move goods between countries?”, “Movement Reference Number (MRN)”, “Will the transport use the Goods Vehicle Movement Service (GVMS)?” (journey-spec.json page `goods-movement-services`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Are you using the Common Transit Convention (CTC) to move goods between countries?”: “Yes – add MRN now”, “Yes – add MRN later”, “No”; “Will the transport use the Goods Vehicle Movement Service (GVMS)?”: “Yes”, “No” (journey-spec.json page `goods-movement-services`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `goods-movement-services`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: Likely submitting with no radio selected, or 'Yes – add MRN now' with an empty/invalid MRN; Selecting 'Yes – add MRN now' and submitting an empty or malformed MRN. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-063 — Add page 31: Transporter (landing / add)

- [confirmed] The H1 reads exactly “Transporter” (journey-spec.json page `transporter`, verified `confirmed`).
- [confirmed] The caption reads exactly “Transport” (journey-spec.json page `transporter`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-table`, `govuk-button`, `govuk-link`, `govuk-section-break`, `govuk-label--s` in the roles recorded by journey-spec.json page `transporter`.
- [confirmed] No user-input field is added; this remains the verified informational/navigation page (journey-spec.json page `transporter`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `transporter`; persistence contract in `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: the unexercised invalid state. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-064 — Add page 32: Search existing transporter

- [confirmed] The H1 reads exactly “Search for an existing transporter” (journey-spec.json page `search-existing-transporter`, verified `confirmed`).
- [confirmed] The caption reads exactly “Transport” (journey-spec.json page `search-existing-transporter`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-input`, `govuk-label`, `govuk-button`, `govuk-table`, `govuk-section-break`, `govuk-link` in the roles recorded by journey-spec.json page `search-existing-transporter`.
- [confirmed] Controls or read-only values are labelled exactly “Name”, “Approval Number”, “Post Code”, “Select”, “View” (journey-spec.json page `search-existing-transporter`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Search” and successful use saves the current draft before routing onward (journey-spec.json page `search-existing-transporter`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-065 — Add page 33: Transporter creation (address form)

- [confirmed] The H1 reads exactly “Add private transporter” (journey-spec.json page `transporter-creation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `transporter-creation`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-fieldset`, `govuk-form-group`, `govuk-label`, `govuk-input`, `govuk-select`, `govuk-button`, `govuk-link`, `govuk-body` in the roles recorded by journey-spec.json page `transporter-creation`.
- [confirmed] Controls or read-only values are labelled exactly “Transporter name”, “Address line 1”, “Address line 2 (optional)”, “Address line 3 (optional)”, “City or town”, “Postcode or ZIP code”, “Telephone number”, “Country”, “Email address” (journey-spec.json page `transporter-creation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `transporter-creation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-066 — Add page 34: Transporter confirmation (add to notification)

- [confirmed] The H1 reads exactly “The transporter has been created” (journey-spec.json page `transporter-confirmation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `transporter-confirmation`).
- [confirmed] The rendered page uses the verified component classes `govuk-panel`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `transporter-confirmation`.
- [confirmed] Controls or read-only values are labelled exactly “(hidden CSRF token — no visible label)”, “(hidden optimistic-concurrency etag — no visible label)” (journey-spec.json page `transporter-confirmation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Add to notification” and successful use saves the current draft before routing onward (journey-spec.json page `transporter-confirmation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-067 — Add page 35: Contact details

- [confirmed] The H1 reads exactly “Contact details” (journey-spec.json page `contact-details`, verified `confirmed`).
- [confirmed] The rendered page uses the verified component classes `govuk-fieldset`, `govuk-input`, `govuk-label`, `govuk-hint`, `govuk-form-group`, `govuk-button`, `govuk-back-link`, `govuk-link`, `govuk-table or govuk-summary-list` in the roles recorded by journey-spec.json page `contact-details`.
- [confirmed] Controls or read-only values are labelled exactly “Name”, “Email address”, “Mobile number” (journey-spec.json page `contact-details`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `contact-details`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-068 — Add page 36: Nominated contacts

- [confirmed] The H1 reads exactly “Nominated contacts (optional)” (journey-spec.json page `nominated-contacts`, verified `confirmed`).
- [confirmed] The caption reads exactly “Contacts” (journey-spec.json page `nominated-contacts`).
- [confirmed] The rendered page uses the verified component classes `govuk-fieldset`, `govuk-caption-xl`, `govuk-heading-xl`, `govuk-body`, `govuk-table`, `govuk-input`, `govuk-form-group`, `govuk-button`, `govuk-link`, `govuk-visually-hidden` in the roles recorded by journey-spec.json page `nominated-contacts`.
- [confirmed] Controls or read-only values are labelled exactly “Name”, “Email address”, “Mobile number” (journey-spec.json page `nominated-contacts`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `nominated-contacts`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `repeating-row-groups`.

**Open question (gate: sam):** [gap] repeating-row-groups: Accompanying documents, nominated contacts, container/trailer details, selected establishments and several result/action rows repeat. Fields are represented once (or with an observed “-1” suffix), so row cardinality and per-row partial validation remain outside the model. Supply verbatim validation copy and rules for: the unexercised invalid state. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-069 — Add page 37: Contact address (branch address landing)

- [confirmed] The H1 reads exactly “Contact address for consignment” (journey-spec.json page `contact-address`, verified `confirmed`).
- [confirmed] The caption reads exactly “Complete notification” (journey-spec.json page `contact-address`).
- [confirmed] The rendered page uses the verified component classes `govuk-caption-xl`, `govuk-heading-xl`, `govuk-fieldset`, `govuk-form-group`, `govuk-radios`, `govuk-hint`, `govuk-link`, `govuk-button` in the roles recorded by journey-spec.json page `contact-address`.
- [confirmed] Controls or read-only values are labelled exactly “Select an address” (journey-spec.json page `contact-address`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Select an address”: “34 GREYSTONE PARK, CREWE, CHESHIRE EAST, CW1 2AL United Kingdom of Great Britain and Northern Ireland”, “43 West Hague Extension Main street Castlereagh Belfast 78145 Switzerland”, “43 East Hague Extension Delectus sit odio p Laborum Odio tempor Quas occaecat ut ear 30055” (journey-spec.json page `contact-address`).
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `contact-address`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Supply verbatim validation copy and rules for: Submitting 'Save and continue' with no address selected (expected — a selection is functionally required to set the consignment contact address). (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-070 — Add page 38: Branch address creation (address form)

- [confirmed] The H1 reads exactly “Add branch address” (journey-spec.json page `branch-address-creation`, verified `confirmed`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-fieldset`, `govuk-input`, `govuk-select`, `govuk-label`, `govuk-form-group`, `govuk-button`, `govuk-link` in the roles recorded by journey-spec.json page `branch-address-creation`.
- [confirmed] Controls or read-only values are labelled exactly “Branch address name”, “Address line 1”, “Address line 2 (optional)”, “Address line 3 (optional)”, “City or town”, “Postcode or ZIP code”, “Telephone number”, “Country”, “Email address” (journey-spec.json page `branch-address-creation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `branch-address-creation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

### inc-071 — Add page 39: Branch address confirmation (return to notification)

- [confirmed] The H1 reads exactly “The address has been added to your address book” (journey-spec.json page `branch-address-confirmation`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `branch-address-confirmation`).
- [confirmed] The rendered page uses the verified component classes `govuk-panel`, `govuk-button`, `govuk-back-link` in the roles recorded by journey-spec.json page `branch-address-confirmation`.
- [confirmed] Controls or read-only values are labelled exactly “(hidden CSRF token)”, “(hidden concurrency token)” (journey-spec.json page `branch-address-confirmation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Return to notification” and successful use saves the current draft before routing onward (journey-spec.json page `branch-address-confirmation`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

## m-06 — Review and submit

Render a traceable review, record the declaration, submit the Mongo draft and show a bounded confirmation.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-072 | Resolve and implement model extension: review-restatement-linkage | add-model | L | **BLOCKED — gate: sam** | inc-071 |
| inc-073 | Add page 40: Review notification (check your answers) (`review-notification`) | add-page | L | **BLOCKED — gate: sam** | inc-071, inc-019, inc-022, inc-032, inc-059, inc-058, inc-072 |
| inc-074 | Add page 41: Declaration (submit notification) (`declaration`) | add-page | S | **BLOCKED — gate: sam** | inc-073 |
| inc-075 | Resolve and implement model extension: external-risk-outcome-variants | add-model | M | **BLOCKED — gate: sam** | inc-074 |
| inc-076 | Add page 42: Confirmation (reference number) (`confirmation`) | add-page | L | **BLOCKED — gate: sam** | inc-074, inc-075 |

### inc-072 — Resolve and implement model extension: review-restatement-linkage

- [inferred] A human-approved executable shape replaces the flat-model limitation: The review page restates answers from many earlier pages, including catch-certificate and IUU data. These summaries are links to existing obligations, not new fields; the current model captures their structure/copy but does not map every summary row to its source field. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `review-notification`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `review-restatement-linkage`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “review-restatement-linkage”? The review page restates answers from many earlier pages, including catch-certificate and IUU data. These summaries are links to existing obligations, not new fields; the current model captures their structure/copy but does not map every summary row to its source field. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-073 — Add page 40: Review notification (check your answers)

- [confirmed] The H1 reads exactly “Review your notification” (journey-spec.json page `review-notification`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `review-notification`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-caption-m`, `govuk-warning-text`, `govuk-summary-list`, `govuk-table`, `govuk-button`, `govuk-section-break`, `govuk-link`, `govuk-body` in the roles recorded by journey-spec.json page `review-notification`.
- [confirmed] Controls or read-only values are labelled exactly “Save and continue”, “Change”, “Add the contact address for consignment”, “Amend”, “Review and submit”, “Split consignment”, “Copy” (journey-spec.json page `review-notification`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Save and continue” and successful use saves the current draft before routing onward (journey-spec.json page `review-notification`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Conflicts: `c-011`.

**Open question (gate: sam):** [gap] c-011 (Consignment reference on review): Treat the review row as a restatement of origin-of-import.local-reference-number that supports both blank and populated states. Requiredness cannot be decided from these sources and remains unknown. nested-catch-certificate-repeats: An attachment may describe multiple catch certificates; certificates repeat inside attachments, and each certificate contains a commodity/species selection. The flat fields array can only show indexed examples and cannot faithfully represent the nested cardinalities. review-restatement-linkage: The review page restates answers from many earlier pages, including catch-certificate and IUU data. These summaries are links to existing obligations, not new fields; the current model captures their structure/copy but does not map every summary row to its source field. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-074 — Add page 41: Declaration (submit notification)

- [confirmed] The H1 reads exactly “Declaration” (journey-spec.json page `declaration`, verified `confirmed`).
- [confirmed] The caption reads exactly “DRAFT.GB.2026.1525979 - CHEDP” (journey-spec.json page `declaration`).
- [confirmed] The rendered page uses the verified component classes `govuk-heading-xl`, `govuk-body`, `govuk-button`, `govuk-grid-row` in the roles recorded by journey-spec.json page `declaration`.
- [confirmed] Controls or read-only values are labelled exactly “(hidden CSRF token)”, “(hidden optimistic-concurrency token)”, “(hidden submission date)” (journey-spec.json page `declaration`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] The primary onward action reads exactly “Submit notification” and successful use saves the current draft before routing onward (journey-spec.json page `declaration`; persistence contract in `target-model.md`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Should standalone IUU retain the observed checkbox-less declaration, or require an explicit legal confirmation checkbox? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-075 — Resolve and implement model extension: external-risk-outcome-variants

- [inferred] A human-approved executable shape replaces the flat-model limitation: Confirmation content branches on an externally produced risk-assessment outcome. Only “Inspection required” rendered; other asserted outcomes are retained as gaps, and the flat model cannot encode the external decision contract. (Backlog phase brief and `target-model.md`).
- [inferred] Unit tests cover every affected page: `confirmation`. (Backlog phase brief and `target-model.md`).
- [inferred] No cardinality, route, alias, summary linkage or external outcome is inferred beyond the recorded evidence. (Backlog phase brief and `target-model.md`).

Model gap: `external-risk-outcome-variants`.

**Open question (gate: sam):** [gap] What approved executable rule and data shape closes model gap “external-risk-outcome-variants”? Confirmation content branches on an externally produced risk-assessment outcome. Only “Inspection required” rendered; other asserted outcomes are retained as gaps, and the flat model cannot encode the external decision contract. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-076 — Add page 42: Confirmation (reference number)

- [confirmed] The page title reads exactly “Import notification sent - Import and export applications - GOV.UK”; no H1 is invented because the verified page has no H1 (journey-spec.json page `confirmation`).
- [confirmed] The rendered page uses the verified component classes `govuk-notification-banner`, `govuk-panel`, `govuk-summary-list`, `govuk-warning-text`, `govuk-button`, `govuk-section-break`, `govuk-link` in the roles recorded by journey-spec.json page `confirmation`.
- [confirmed] Controls or read-only values are labelled exactly “CHED reference”, “Reference for your customs declaration”, “Customs document code”, “Inspection status” (journey-spec.json page `confirmation`); search-only and read-only fields are not persisted as notification facts.
- [confirmed] Finite options are exactly “Inspection status”: “Required at London Tilbury”, “Not required”, “Check GVMS”, “Go to place of destination” (journey-spec.json page `confirmation`).
- [inferred] A request test proves valid answers round-trip through the single `IuuNotificationDocument` Mongo aggregate and repopulate on resume; CSRF and request-only search state are not stored as notification facts. (Backlog phase brief and `target-model.md`).

Model gap: `external-risk-outcome-variants`.

**Open question (gate: sam):** [gap] external-risk-outcome-variants: Confirmation content branches on an externally produced risk-assessment outcome. Only “Inspection required” rendered; other asserted outcomes are retained as gaps, and the flat model cannot encode the external decision contract. (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

## m-07 — Deferred variants and enrichment

Keep unmined legacy/DoA substance, first-pass-excluded variants, production reference data and downstream processing outside the initial build.

| ID | Increment | Kind | Size | Status | Depends on |
|---|---|---|:---:|---|---|
| inc-077 | Run the legacy catch-certificate, IUU-declaration and DoA enrichment pass | spike | L | **BLOCKED — gate: sam** | inc-076 |
| inc-078 | Specify deferred CSV, Article 72, CUC, split-consignment and DoA variants | spike | L | **BLOCKED — gate: sam** | inc-077 |
| inc-079 | Replace prototype reference data with production contracts | add-reference-data | L | **BLOCKED — gate: sam** | inc-078 |
| inc-080 | Commission deferred submission integrations | add-integration-stub | L | **BLOCKED — gate: sam** | inc-079 |
| inc-081 | Keep inspector, PHSI checks and decisions outside this service | scaffold | S | todo | inc-080 |

### inc-077 — Run the legacy catch-certificate, IUU-declaration and DoA enrichment pass

- [inferred] Legacy catch-certificate and IUU-declaration templates and Delegation of Authority evidence are mined in a separate, cited evidence pass. (Backlog phase brief and `target-model.md`).
- [inferred] The pass produces verbatim copy, field rules, validation messages, variants and citations without rewriting the one-trace lower-bound spec. (Backlog phase brief and `target-model.md`).
- [inferred] Resulting decisions update model gaps and unblock affected IUU-specific increments through explicit rulings. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] This enrichment pass has not been run. Which legacy templates, IUU declaration sources and DoA scenarios are authoritative and available to mine? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-078 — Specify deferred CSV, Article 72, CUC, split-consignment and DoA variants

- [inferred] CSV bulk upload, Article 72 low-risk, CUC billing, split consignment and DoA agent flows each have a separately approved scope and evidence set. (Backlog phase brief and `target-model.md`).
- [inferred] No first-pass route, field or model property is added from these variants before that evidence and ruling exist. (Backlog phase brief and `target-model.md`).
- [inferred] Each accepted variant receives its own later milestone and executable dependency chain. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Which of CSV, Article 72, CUC, split-consignment and DoA variants should be commissioned after the first pass, and from what evidence? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-079 — Replace prototype reference data with production contracts

- [inferred] Authoritative contracts cover the full chapter-03 commodity/species hierarchy, commodity-to-package joins, flag-state inclusion, BCP eligibility and establishment search semantics. (Backlog phase brief and `target-model.md`).
- [inferred] Versioned contract tests prove stable codes and display labels and identify changes without silently altering saved drafts. (Backlog phase brief and `target-model.md`).
- [inferred] Prototype fixture banners are removed only after parity and failure-mode tests pass. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Who owns and supplies the authoritative production contracts for chapter 03, species, package types, flag states, BCPs and approved establishments? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-080 — Commission deferred submission integrations

- [inferred] Separate approved contracts exist for Service Bus, TRACES SOAP, POAO Dynamics, GVMS arrival events, GOV.UK Notify and certificate PDF generation (`integrations.md`, systems 11–16).
- [inferred] Outbox/idempotency, retry, audit, privacy and failure behaviour are contract-tested before any adapter is enabled. (Backlog phase brief and `target-model.md`).
- [inferred] Page handlers continue to depend on interfaces so downstream delivery does not change the journey JSON shape. (Backlog phase brief and `target-model.md`).

**Open question (gate: sam):** [gap] Which downstream deliveries are mandatory at submit, and what is the current POAO Dynamics contract (or has it been retired)? (Source: `SPEC-GATE.md` and `journey-spec.json` open questions.)

### inc-081 — Keep inspector, PHSI checks and decisions outside this service

- [inferred] The IUU create service exposes no inspector dashboard, PHSI-check or decision-writing route. (Backlog phase brief and `target-model.md`).
- [inferred] The bounded confirmation may show only stored references and an explicitly “not assessed” first-pass risk state; it makes no live inspection or GVMS claim. (Backlog phase brief and `target-model.md`).
- [inferred] Architecture documentation names post-submission inspection and decisions as a different service boundary. (Backlog phase brief and `target-model.md`).

## Sequencing notes

Increments are ordered and IDs are stable. Every page from journey-spec.json appears exactly once and page increments retain canonical order 0–42. Foundation establishes one IuuNotificationDocument persisted to Mongo. Reference data and model extensions appear before their first page consumer. A page may be born blocked for its own unresolved human conflict, model gap, validation-copy gap, mandatory/optional gap or explicit standalone-IUU scope question. Downstream increments remain todo only when they have no gate of their own, even if a dependency is blocked. The catch-certificate collection is deliberately split into attachment metadata, manage/add-another loop, cardinality ruling, repeated certificate details and per-certificate species association. First pass uses versioned local reference fixtures and only Mongo as a live integration. CSV, Article 72, CUC, split consignment and DoA are later work. The legacy catch-certificate + IUU-declaration templates and DoA enrichment pass has not been run; most additional IUU-specific depth is expected from that pass. Inspector/PHSI checks/decisions are excluded as a different service. No requirement in this backlog authorises implementing them.
