# IUU completeness critique

## Coverage assessment

**This is a correct lower-bound specification, not a complete IUU specification.** The run is
grounded in one successful legacy CHED-P fish submission plus the QA repository. It is internally
well reconciled, but the evidence base is not capable of establishing most of the rules that make
IUU distinct.

The headline limitation is not subtle:

- IUU has **no dedicated trace slug, test configuration or notification enum** in this corpus.
  Fish is filed under CHED-P, using legacy enum `CVEDP`.
- The selected IUU corpus is exactly one trace,
  `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, titled “Submits Valid CHEDP Fish
  Notification”: 193 actions, 0 errors.
- The trace proves that a happy-path UI exists for commodity `03019230`, `Anguilla spp.`, catch
  certificate upload, reference, issue date, flag state, species association, two uploaded
  certificates, review and submission. It does **not** prove the governing rules.
- Catch-certificate applicability and exemptions, IUU declaration/health-attestation content,
  signatory rules, fish/species eligibility, chapter-03 coverage, mandatory fields, cross-field
  rules and virtually all exact validation copy are therefore unmineable from these traces.
- The real IUU substance is expected in the **legacy catch-certificate templates, legacy
  IUU-declaration/health-attestation templates, policy and Definition of Authorisation (DoA)
  material**. That enrichment pass has not been run.

The primary next action is to run a dedicated legacy/policy/DoA enrichment pass before treating any
IUU backlog item as build-ready. That pass must obtain and map:

1. catch-certificate applicability, exemptions and certificate-to-consignment rules;
2. IUU declaration and health-attestation questions, statements, signatory identity and evidence;
3. species, commodity, flag-state, vessel and country restrictions;
4. mandatory/optional rules, server-side validation and exact error copy;
5. DoA organisation selection, acting-on-behalf-of rules, access and submission authority;
6. the authoritative chapter-03 commodity/species/reference-data contracts; and
7. submission, risk, document-retention and downstream regulatory contracts.

That missing depth is **expected for IUU**. The low coverage is the honest result of the available
corpus, not a pipeline failure.

## Traces coverage

`trace-index.json` selected 1 of 383 traces. Approximately 90 non-fish CHED-P traces were excluded
by design because their titles did not identify the fish journey. The single selected trace is a
B2C importer/not-agent, ROW origin (Afghanistan), farmed-stock `03019230` / `Anguilla spp.`,
re-entry, medium-risk, non-bulk, two-catch-certificate, CTC-No, GVMS-No, create-new-traders,
Tilbury, successful-submit path.

It did not exercise:

- an error state of any kind;
- the “catch certificate not needed” path or any IUU exemption;
- wild stock, another fish commodity, another species or any chapter-03 boundary;
- missing/invalid certificate reference, date, flag state or species;
- one uploaded attachment containing multiple certificates, removal, replacement or upload
  failure;
- EU-origin fish, low/high-risk fish, internal market, transhipment or transit fish;
- CTC “add MRN now”, CTC “add later”, GVMS Yes or hidden-question combinations;
- CUC billing, DoA organisation selection, CSV upload, Article 72 or split consignment;
- existing trader selection, multiple establishments or most edit/amend paths;
- alternative risk/confirmation outcomes; or
- authorisation denial, concurrent update, persistence failure or downstream rejection.

The current `ched-p-workflows.ts` does contain a CUC branch at lines 538-546 and generic CHED-P
branches for EU/ROW, purpose, risk, CTC/GVMS and early exits. It does **not** contain
`isCSVUpload`, Article 72 or DoA organisation-selection logic; those concepts occur in CHED-PP
automation, not in the CHED-P workflow. They are therefore applicability questions for the new IUU
service, not test-backed IUU requirements.

## Uncovered journey surface

### Accessibility inventory cross-check

The CHED-P accessibility spec contains 45 named accessibility states. After collapsing repeated
states such as “after consignor”, “after search” and “returned”, every named page maps to one of
the 43 inventory pages. **No page named by
`tests/accessibility/ched-p-accessibility-tests.spec.ts` is absent from the inventory**, so this
check found no blocker of the narrow “named-but-missing” kind.

That apparent success has a serious IUU caveat: the accessibility journey is a generic CHED-P
boneless-meat path. It never visits:

- `catch-certificate-needed`;
- `attach-catch-certificate`;
- `manage-catch-certificates`; or
- `add-catch-certificate-details`.

The IUU-defining UI therefore has no accessibility-test evidence in this repository.

### Workflow and page-object surface not exercised by the trace

Material unexercised branches and controls include:

- CUC billing: Confirm billing details, Find an address, Select the address and Change billing
  contact details. These have page objects and are driven by `ched-p-workflows.ts:538-546`, but
  have no inventory page spec.
- The catch-certificate “No” route. `CatchCertificateNeededPage.ts` exposes only the Yes locator;
  the fish workflow always selects Yes (`ched-p-workflows.ts:898-900`).
- Catch-certificate removal/replacement and validation failure. The workflow only adds details,
  adds another upload, then selects No-more (`ched-p-workflows.ts:902-928`).
- Species-search commodity entry. It is visible in the rendered commodity-search surface but the
  page object exposes only commodity-code search.
- Existing consignor, consignee and transporter search/select/no-results/pagination. The normal
  workflows immediately choose “Create new”.
- Generic CHED-P purpose, low-risk, CTC/GVMS and non-transit variants. QA code establishes their
  existence for CHED-P, but the fish trace does not establish their applicability or copy for the
  standalone IUU service.
- Shared page-object controls belonging to CHED-A/CHED-D/CHED-PP, including temporary-admission
  horses, EPPO search and plant/bulk controls. Their presence in shared page objects is not evidence
  that IUU needs them. The reconciled page specs correctly retain these only as inferred,
  explicitly unsupported variants where mentioned.

Early-exit hooks (`stopAtHealthCertificate`, `stopAtAccompanyingDocuments`,
`stopAtNotificationHub`, `stopAtConsignment`, `stopAtTransport`) create test setup points, not new
pages. They do reveal that partial-draft/resume behaviour should be specified, but they do not
themselves establish save/resume rules.

## Confidence honesty

Counting the `fields` arrays in all 43 `pages/*.json` files gives:

| Measure | Confirmed | Inferred | Gap | Total |
|---|---:|---:|---:|---:|
| Page-level field rows | 180 (90.5%) | 19 (9.5%) | 0 | 199 |
| Distinct obligations after the duplicated country-of-origin alias is merged | 179 (90.4%) | 19 (9.6%) | 0 | 198 |

Those percentages are easy to misread. “Confirmed” usually means **the control, label or rendered
value existed in one successful state**. It does not confirm why the field exists, whether it is
mandatory, its complete option set, its permissible combinations, its validation, or whether it
belongs in the new standalone IUU service.

The more honest accompanying figures from `journey-spec.json`/`SPEC-GATE.md` are:

- only 5 of 198 distinct obligations are evidenced required;
- 28 have unknown requiredness;
- 341 open questions remain after exact deduplication;
- 13 conflicts remain, 4 needing a human ruling; and
- 7 model gaps remain.

Accordingly, the specification's **field-presence confidence is high**, but its **behavioural,
regulatory and standalone-IUU confidence is low**. Any single overall confidence label higher than
“low / lower-bound” would be overstated.

## Validation coverage

The trace has zero errors. Across all page specs there are 32 validation-message entries:

| Confidence | Count | Share |
|---|---:|---:|
| Confirmed | 1 | 3.1% |
| Inferred | 11 | 34.4% |
| Gap | 20 | 62.5% |

Even the one “confirmed” item is a dashboard data-quality alert, not a form-submission validation
message. Therefore **confirmed form-validation messages: 0**.

Twenty-three pages have an empty `validationMessages` array and thus no recorded validation
evidence at all:

`about-the-consignment`, `approved-establishment-of-origin`, `branch-address-confirmation`,
`branch-address-creation`, `commodity-basic-description`, `confirmation`,
`consignee-confirmation`, `consignee-creation`, `consignor-confirmation`, `consignor-creation`,
`contact-details`, `country-of-origin`, `declaration`, `health-certificate-required`,
`notification-hub`, `origin-of-import`, `review-notification`, `search-existing-consignor`,
`search-existing-transporter`, `search-for-approved-establishment`, `traders-addresses`,
`transporter-confirmation`, `transporter-creation`.

Another 14 pages contain only gap-tagged validation entries:

`add-catch-certificate-details`, `attach-catch-certificate`, `catch-certificate-needed`,
`commodity-additional-details`, `commodity-extended-description`, `contact-address`,
`goods-movement-services`, `import-type`, `manage-catch-certificates`, `nominated-contacts`,
`search-commodity`, `search-existing-consignee`, `select-risk-category`, `transporter`.

Thus 37 of 43 pages (86.0%) have no positive confirmed/inferred validation evidence. The remaining
inferred messages are concentrated in shared file-upload tests and CHED-P transport-date tests.
They do not supply the missing IUU catch-certificate, commodity/species, declaration or
attestation validation.

Validation is the weakest part of the specification and is not implementation-ready.

## Backlog and model fidelity

The generated artifacts are internally closed over the evidence they selected:

- all 43 inventory slugs have a corresponding `pages/*.json` file;
- all 43 verified pages have exactly one ordered `add-page` increment;
- the backlog has 81 increments in total, including 43 page increments;
- all 199 page-field rows have a target-model path and citation;
- the duplicated country-of-origin row is deliberately mapped to one obligation; and
- pages with no fields correctly add no field-map rows.

There is no forward orphan from verified page field to target path. Reverse-only target fields such
as Mongo identity, lifecycle timestamps, attachment metadata and status are inferred system-design
fields rather than user-entered page fields; they must remain labelled as such.

This internal fidelity must not be confused with external completeness. The four CUC billing pages,
DoA organisation-selection surface, any legacy IUU declaration/attestation surface and any
policy-only obligation have no page increment. They are represented only by broad deferred spikes
(`inc-077` and `inc-078`). Those spikes are appropriate placeholders, but not buildable increments.
Also, 51 of 81 increments are blocked, including 32 of 43 page increments; the backlog itself
correctly signals that reconciliation did not make the requirements ready.

## Integration completeness

For the 43 verified pages, `integrations.md` accounts for the visible/deduced lookup families:
commodity/category/species, countries and flag states, BCP/port, approved establishments,
economic operators/address book, field configuration, risk, identity/profile, uploads, persistence,
GVMS and downstream submission surfaces. Its 13 reference-data rows cover all option-bearing
verified page families. No additional verified-page lookup can be named from the current evidence
without invention.

The remaining integration gaps are outside that closed set or are only inferred:

- CUC postcode/address lookup and billing persistence are absent because the CUC pages were not
  inventoried.
- DoA organisation/customer-authorisation lookup is not specified at the acting-on-behalf-of
  workflow level.
- Commodity/species, BCP, establishment and field-configuration service calls are inferred from
  clients; the browser trace sees only server-rendered results.
- Production filtering/versioning contracts are unknown even where an observed option list was
  captured.
- Upload scanning, storage, retention, malware/error handling and document legal status are not
  established by a successful redirect.
- The Dynamics POAO surface is already recorded as a gap; risk, SOAP/TRACES, messaging and Notify
  mappings remain inferred/deferred.

## Gaps

| Severity | Gap | Evidence | Next action |
|---|---|---|---|
| **blocker** | The legacy/policy source of IUU substance has not been mined: catch-certificate rules, exemptions, IUU declaration and health-attestation content are missing. | One zero-error CHED-P fish trace; `SPEC-GATE.md` explicitly defers legacy catch-certificate, IUU-declaration and DoA material. | **Primary next action:** run a legacy catch-certificate + IUU-declaration/health-attestation + policy enrichment pass; map every statement, rule and data item to the target model/backlog with policy owners. |
| **blocker** | Mandatory/optional rules and exact validation are not known. IUU form-validation has zero confirmed messages. | 199 fields but only 5 evidenced required; 28 unknown requiredness; validation 1/11/20 confirmed/inferred/gap, where the one confirmed item is not form validation; 37/43 pages have no positive validation evidence. | Obtain negative/boundary traces or templates and server validation rules; build a validation matrix for every page, especially all catch-certificate, commodity/species, declaration and attestation fields. |
| **blocker** | DoA, authorisation and legal submission authority are absent for IUU. | Selected trace is “B2C Importer (Not Agent)”; current CHED-P workflow has no organisation-selection branch; DoA creation tests in the QA checkout exercise CHED-PP. | Obtain IUU DoA policy and role matrix; specify organisation selection, acting-on-behalf-of attribution, visibility, amend/submit permissions, declaration identity and audit evidence. |
| **blocker** | Authoritative fish eligibility and catch-certificate applicability rules are unknown. | Only `03019230`, Farmed stock, `Anguilla spp.`, Afghanistan and France flag state were exercised. “No certificate”, wild stock, exemptions and other chapter-03 data shapes were not exercised. | Secure the authoritative chapter-03/species/flag-state/country datasets and policy rules; add decision tables and tests for applicability, exemptions and cross-field validation. |
| **major** | Conditional journey variants are untraced or of unproven IUU applicability. | Fish trace is ROW/re-entry/medium/no-CTC/no-GVMS. CHED-P workflow contains EU/ROW, purpose, low-risk, CTC/GVMS and CUC branches; CUC adds four billing pages. CSV, Article 72 and DoA are absent from that CHED-P workflow. | Product and policy owners must decide which variants belong to standalone IUU. For approved variants, mine dedicated traces/tests and create page specs/increments; explicitly reject non-applicable variants. |
| **major** | The IUU-defining pages have no accessibility-journey coverage. | All generic accessibility page names map to inventory, but the accessibility spec never visits the four catch-certificate pages. | Add a dedicated fish/IUU accessibility journey covering initial, populated, error, add-another, remove and review states for all catch-certificate and declaration/attestation pages. |
| **major** | Catch-certificate cardinality, lifecycle and executable routing remain unresolved. | Trace supports two single-certificate uploads; rendered editor supports multiple certificates per attachment. Reverse cardinality, replacement/removal, partial state, exemptions and species reassignment are unproved. `journey-spec.json` records cross-page and nested-repeat model gaps. | Agree aggregate invariants and state transitions; model attachment↔certificate↔species cardinalities explicitly; add lifecycle and routing acceptance tests before implementing the collection. |
| **major** | Production integration contracts and failure semantics are not established. | Most backend calls in `integrations.md` are inferred because the browser trace is server-rendered; upload, risk, establishment, reference data and downstream systems have only happy-path or illustrative shapes. | Obtain owned API/event schemas, version/filter rules, SLAs, security, retention and failure/retry contracts. Add contract tests and explicit first-pass stubs that cannot be mistaken for regulatory decisions. |
| **major** | Shared page-object controls and alternative states have weak or zero test coverage. | Examples: no catch-certificate-No locator, no species-search driver, normal trader workflows always create new, and CUC pages are outside inventory. Shared CHED-A/D/PP controls also risk accidental promotion into IUU. | Produce a page-object/control coverage matrix by IUU applicability; add tests for applicable unexercised controls and remove or explicitly exclude other-CHED controls from the IUU spec. |
| **major** | The model/backlog are complete only relative to the 43-page lower bound. | 43/43 page increments and 199/199 field mappings are internally complete, but legacy IUU/DoA pages and CUC branch pages have only deferred spikes; 51/81 increments are blocked. | Do not start page delivery from the current backlog. Enrich first, then regenerate page/model mappings and split approved deferred spikes into evidenced, testable increments. |
| **minor** | Four source conflicts still need human rulings before exact behaviour/copy is fixed. | `SPEC-GATE.md`: region-code 5-character hint vs maxlength 3; blank/populated review reference; risk initial state; inclusive/exclusive 10 MB boundary. | Resolve each conflict with product/domain owners or a boundary test and update the canonical page spec, model and acceptance criteria together. |

## Questions for humans

1. What legislation, policy and service boundary defines the new standalone IUU journey, and which
   parts of generic CHED-P are deliberately retained or removed?
2. Can the legacy catch-certificate and IUU-declaration/health-attestation templates, validation
   resources and completed examples be supplied for the enrichment pass?
3. What exact declaration/attestation must the user make, who may make it, and what signer,
   organisation, timestamp and audit evidence must be stored?
4. Which DoA roles may create, view, amend, submit, copy or cancel an IUU notification for which
   organisation?
5. What makes a catch certificate required: commodity, species, wild/farmed status, origin,
   processing, exemption or some combination?
6. What exemptions exist, where are they collected, and how must they appear on review and in
   downstream payloads?
7. What are the allowed attachment↔certificate cardinalities, and may a certificate or attachment
   be replaced, removed or shared after details have been entered?
8. Which catch-certificate fields are mandatory, what are their format/date/uniqueness rules, and
   what is the exact GOV.UK error copy for every failure?
9. What are the authoritative chapter-03 commodity, species, package, country/flag-state, BCP and
   approved-establishment datasets and their filtering/versioning rules?
10. Do EU/ROW, internal market, transhipment, transit, low/high risk, CTC/GVMS and CUC variants apply
    to standalone IUU? Do CSV, Article 72 or split consignment apply at all?
11. What post-submit risk outcomes and downstream systems are authoritative for IUU, and what must
    the confirmation page say when those systems are unavailable?
12. What public reference format replaces or retains `CHEDP`/`CVEDP`, and what are the draft,
    submit, amend, cancel and concurrency rules?
13. Are the four unresolved gate conflicts to be decided by preserving legacy behaviour or by
    adopting a new-service rule?

## Method critique

Rendered-frontend mining can prove that particular words, controls, options and state transitions
appeared for one data set. It is valuable evidence of user-visible reality and catches details that
tests omit. It cannot establish the domain contract behind that reality.

Structurally invisible or underdetermined requirements include:

- business rules that do not render a control;
- server-side validation never triggered by the trace;
- the reason a field exists and the legislation/policy it satisfies;
- mandatory rules when happy-path automation always fills the field;
- cross-field, cross-certificate and cross-notification invariants;
- rules selected by commodities, species, origins, roles or feature flags absent from the test data;
- authorisation, tenancy, DoA and data-visibility decisions when only an allowed user is traced;
- anti-malware, retention, audit, privacy and evidential requirements behind a successful upload;
- concurrency, idempotency, retries, partial failure and recovery behind successful redirects;
- performance, volume, pagination and maximum-cardinality requirements;
- reference-data ownership, freshness and filtering behind rendered option lists;
- downstream mapping and regulatory decisions behind a confirmation banner; and
- requirements removed by feature flags or absent because the current data happened not to qualify.

The QA repository narrows some of these gaps by showing intended navigation and asserted outcomes,
but tests are not policy. Shared page objects mix CHED types, setup hooks are not requirements, test
defaults are not UI defaults, and the absence of a negative test does not establish optionality.
Likewise, a field confidence count primarily measures DOM coverage; it is not a measure of domain
completeness.

Because legacy source and policy were deliberately excluded, anything knowable only from catch
certificate/IUU declaration templates, policy, DoA rules, backend validators or integration
contracts is necessarily a gap. For IUU, that excluded material is not peripheral—it is the core
of the service. The current artifacts should therefore be used as a traceable UI lower bound and
an enrichment checklist, not as authority to implement regulatory behaviour.
