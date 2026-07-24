# CHED-P trace-mined requirements — completeness critique

_Adversarial review of the trace/test-derived CHED-P specification. This is not a quality summary.
It identifies what the evidence cannot support and where the artefacts still overstate completeness.
Counts below come directly from `pages/*.json`, `page-inventory.json`, `journey-spec.json`,
`trace-index.json`, `target-model.md`, `backlog.json`, `integrations.md`, and the current
`ipaffs-qa-automation` tests/workflows/page objects. Legacy IPAFFS application source was deliberately
not mined for requirements._

## Headline numbers

| Dimension | confirmed | inferred | gap | total | confirmed proportion |
|---|---:|---:|---:|---:|---:|
| **Fields — all 74 page specs** | 478 | 35 | 6 | 519 | **92.1%** |
| **Validation-message records — all 74 page specs** | 11 | 4 | 65 | 80 | **13.8%** |
| **Page confidence — all 74 page specs** | 72 | 0 | 2 | 74 | **97.3%** |
| **Fields — 44 create/CUC page sets** | 246 | 23 | 0 | 269 | **91.4%** |
| **Validation-message records — 44 create/CUC page sets** | 7 | 2 | 47 | 56 | **12.5%** |

The 92.1% field-confidence number is flattering and unsafe. It says that controls were rendered or
otherwise corroborated; it does **not** say that requiredness, allowed values, conditionality,
cross-field rules, persistence semantics, or error behaviour are known. Validation is the honest
counter-number: only 11 of 80 records are confirmed, representing just **six distinct strings**.
Sixty-one of the 65 gap records are blank or explicitly say that exact copy was not observed.

The canonical combined artefact is also already out of sync: `page-inventory.json` and `pages/`
contain 74 specs, while `journey-spec.json` contains 73. It silently omits
`decision-redispatch-deadline` after the reconciliation note concluded that it was an over-split alias.
That may be the correct semantic ruling, but leaving the source page and inventory entry in place
without an alias/tombstone makes counts depend on which file a reader chooses.

---

## 1. Uncovered journey surface

### Accessibility walk: no missing named page, but no accessibility evidence in the corpus

`ched-p-accessibility-tests.spec.ts` performs 46 accessibility checks (including repeat states) across
the create journey. Every page it names has a corresponding inventory/page spec. There is therefore
**no BLOCKER caused by a page named in that test being absent**.

That is only a page-name reconciliation. `trace-index.json` says there are **zero**
`accessibility/ched-p-*` traces in the 96-trace corpus. The mining cannot show which Axe rules were
enabled, what violations were suppressed, how conditional/repeat/error states behaved, or whether
the current test actually passed in the captured environment. Treating the a11y test source as
rendered accessibility evidence would be false.

### Workflow branches the tests/traces did cover

The corpus is broader than one happy path: EU and ROW origins, high/medium/low risk, re-entry,
internal market/animal feedingstuff, a Transit page stop, low-risk health-certificate skipping,
one and ten approved establishments, CUC billing, GVMS Yes/No, CTC No/Yes-now/Yes-later, and all five
early-exit hooks are exercised by scoped tests. Those branches must not be reported as wholly absent.

### Branches that remain unexercised or only inspected before completion

- **Transhipment/onward travel is never completed.** Its destination-country control rendered in a
  collapsed conditional block, but no scoped CHED-P workflow selects the purpose, fills it, saves it,
  or proves the next route.
- **Transit is not an end-to-end route.** `ched-p-holyhead.spec.ts` selects Transit, stops on the
  consignment page, and inspects the Exit BCP options. It does not complete exit BCP, exit date/time,
  transited-country repeat, destination country, validation, cleanup, or submission.
- **Internal-market sub-purposes Human consumption and Other are never chosen.** Only Animal
  feedingstuff is submitted.
- **Origin variants are effectively fixed.** The automation always chooses regulatory conformity
  Yes and change of means after the BCP Yes. It never drives conformity No, change-after-BCP No,
  region-code Yes, a different country of consignment, or the optional local reference. The actual
  onward-transport gate is therefore not proved.
- **Multi-commodity and multi-species non-fish behaviour is absent.** Every create workflow selects
  “No” to add another commodity. The grain, limits, removal, totals, and dependency cleanup in the
  proposed nested collection remain model design, not mined behaviour.
- **Containers are not exercised.** The Yes reveal and first container/seal row are visible in DOM
  evidence, but add/remove, maximum count, per-row requiredness, official-seal meaning, and persistence
  are unknown.
- **Trader alternatives are not exercised.** Workflows create new consignor, consignee and
  transporter records, copy consignee to importer/destination, and add a new branch address. Existing
  party search/selection, manual importer/destination entry, editing, no-results, duplicate records,
  and stale selections remain untested.
- **Document collection boundaries are absent.** The tests cover one health certificate, one
  accompanying-document row, file-type/size variants, and successful upload formats. They do not
  establish multiple-row commit/removal, attachment replacement, exact 10MB boundary, maximum files,
  or submission without required metadata.
- **Approved-establishment limits are not bounded.** One and ten additions prove repetition, not the
  maximum, duplicates, removals, expired results, commodity eligibility, or zero-establishment path.
- **CUC has one coupled fixture.** The test varies Sevington and `isCuc` together, so neither the real
  chargeability trigger nor the negative path is known. Manual address, no postcode results, invalid
  billing contact details, and address-change failure are absent.
- **Contact details are largely bypassed.** Responsible-person values are pre-populated, nominated
  contacts are skipped, and no five-row/contactability/partial-row condition is exercised.

### The named CSV / Article 72 / DoA surfaces are not CHED-P branches in the inspected workflow

The current `ched-p-workflows.ts` has `isCuc` and the early-exit flags, but has **no**
`isCSVUpload`, Article 72, organisation-selection, or DoA-agent branch. Repository search places:

- CSV upload and its `CsvUploadPage` controls in `ched-pp-workflows.ts`;
- Article 72 tests in `tests/notification/ched-pp/ched-pp-article72.spec.ts`;
- organisation selection / DoA-agent notification creation in CHED-PP workflows and DoA tests.

The CHED-P backlog correctly labels CSV bulk upload, Article 72 and DoA/agent as later candidates,
not first-pass increments. That is honest scope control, but it is **zero CHED-P evidence**, not proof
that these capabilities do not apply to CHED-P. If any is intended for the CHED-P rebuild, it needs a
separate verified journey wave before requirements or backlog acceptance criteria can be authored.

### Page-object controls with no accepted CHED-P page obligation

Shared page objects expose more controls than the accepted CHED-P specs. The unresolved set includes:

- About the consignment: Non-internal market, Transfer of ownership – Rescue, Temporary admission
  horses, its BCP, Point of exit, and BCP or Port of exit;
- Declaration: “I/We have read and understood” checkbox;
- Review: Amend, Review and submit, Split consignment, organisation, Permanent addresses, and
  Transport contacts;
- Goods movement: binary CTC Yes plus Save and review / Save and return variants whose condition is
  not established;
- dashboard: Yesterday, decision-date, and table-result locators absent from the rendered card UI;
- whole page-object classes without a CHED-P page spec: CSV upload, GMS declaration, organisation
  selection, permanent address, split consignment, transport contact details, and the delivery
  economic-operator chain.

Repository usage strongly suggests several are CHED-PP or CHED-A controls, and the spec is right not
to promote them. The gap is that the shared-object directory cannot establish applicability. A
legacy supplementary pass must classify them as stale, other-CHED, or live CHED-P variants.

---

## 2. Validation coverage — the weakest area

Only 4 of 96 selected traces have a non-zero trace `errors` count, and that count is not a reliable
proxy for rendered GOV.UK validation: several useful validation snapshots are in traces whose metadata
still says `errors=0`. The only safe measure is the page-spec validation record itself.

Across all 74 page specs:

- **11 confirmed records (13.8%)**, but only six distinct strings;
- **4 inferred records (5.0%)**, three distinct strings;
- **65 gap records (81.3%)**;
- only **7 pages** contain any confirmed validation record;
- **48 pages** contain validation records but none is confirmed;
- **19 pages** have no validation record at all.

The seven pages with confirmed validation are `attachments-tab`, `document-upload`,
`documentary-check`, `means-of-transport-after-bcp`, `notification-search-view`,
`notifications-dashboard`, and `transport-details`. Evidence is clustered around file upload, the
arrival/departure date window, one documentary-check character limit, and dashboard warning copy.
It is not representative of the journey.

Pages with no validation record at all:

| Page | Why this is still a completeness concern |
|---|---|
| amend-notification-hub | actions/state changes can fail even if it collects no field |
| bip-decision-confirmation | terminal UI, but authorisation/idempotency failures remain invisible |
| bip-notification-hub | task/action eligibility has no error evidence |
| bip-notifications-dashboard | search/date-range validation not specified |
| ched-overview-replace-certificate | replacement failure states absent |
| common-user-charge | read-back page, but eligibility/state conflicts absent |
| confirmation | submission outcome failures cannot appear because only success reaches it |
| decision-conclusion | conditional requiredness is substantial but untested |
| decision-reason-for-refusal | conditional follow-up validation untested |
| declaration | submit-time validation, stale ETag, duplicate submit, and authorisation untested |
| health-certificate-required | legitimately input-free interstitial |
| identity-physical-check | many conditional decision fields, no validation evidence |
| laboratory-test-required | selection requiredness not evidenced |
| laboratory-test-results | dates/results/conclusion validation not evidenced |
| laboratory-test-setup | sample and laboratory validation not evidenced |
| notification-hub | task completeness/routing errors not evidenced |
| override-risk-decision | role/state rejection not evidenced |
| record-decision-search | search failures not evidenced |
| review-notification | aggregate/submission-blocking errors not evidenced |

For the **44 create/CUC page sets**, only 7 of 56 validation records are confirmed, on four pages:
dashboard, document upload, transport details, and means of transport after BCP. Six in-scope page
sets have zero records (`common-user-charge`, `confirmation`, `declaration`,
`health-certificate-required`, `notification-hub`, `review-notification`); another 34 have
validation records but none is confirmed.

This means the spec cannot safely answer basic implementation questions such as which fields are
required for each route, exact empty/invalid copy, numeric ranges, cross-field dates, conditional
cleanup, row limits, duplicate rules, or whether validation occurs on page save versus final
submission. Validation is a **BLOCKER**, not polishing work.

---

## 3. Confidence honesty

The actual all-page field split is:

- **478 / 519 confirmed — 92.1%**
- **35 / 519 inferred — 6.7%**
- **6 / 519 gap — 1.2%**

That tagging is internally consistent for what it measures. The overstatement comes from the word
“confirmed”. A trace can confirm that a hidden input, collapsed conditional control, option label, or
button existed in one rendered state. It does not confirm:

- that the control is valid for every CHED-P branch;
- that it is mandatory, editable, persisted, or accepted by the server;
- the stable code behind a label;
- the rule that makes it appear;
- behaviour when its upstream dependency changes;
- permissions, concurrency, or failure handling.

Page confidence is even more misleading: 72 of 74 page specs are called confirmed, while 67 of those
74 pages have **no confirmed validation message at all**. `select-risk-category` is correctly a page
gap, but dozens of other pages with unknown rules remain page-confirmed because their structure
rendered. Readers must not turn 97.3% page-confirmed or 92.1% field-confirmed into “build-ready”.

The confidence denominator is also polluted by out-of-scope evidence: the three IUU catch-certificate
pages contribute 12 confirmed fields, and fish values remain embedded in shared commodity specs.
The requested “all page specs” numbers above are therefore exact, but they are not a clean measure of
the non-fish CHED-P obligation set.

---

## 4. Backlog fidelity — mechanically complete, substantively blocked

The page-to-increment accounting is clean:

- orders 0–39 map one-for-one to `inc-017`–`inc-056`;
- the three CUC page sets map to `inc-057`–`inc-059`;
- `transit-exit-bcp` is correctly folded into the same About-the-consignment obligation
  (`inc-023`) rather than double-counted as a second page;
- post-submission, clone, border/decision, and IUU pages are explicitly excluded.

The target-model field map names every one of the 269 fields in the 44 create/CUC page sets. No
direct input is orphaned. The page-less model properties are identifiable as server-generated,
resolved, or persistence metadata: identity/version/status/timestamps, draft/submitted references,
commodity row IDs, resolved establishment/operator snapshots, upload/scan metadata, and derived
confirmation values.

That mechanical completeness should not be mistaken for fidelity. Of 59 increments, **28 are
blocked**, and all 28 are repeated in `bornBlocked`; the journey also carries 11 model gaps and 37
conflicts, six requiring human judgement. The blocked increments are concentrated exactly where
traces cannot determine behaviour: routing, collection grain, risk, conditional documents,
establishment eligibility, transport, CTC/GVMS, contactability, summary linkage, and outcomes.

There is no missing in-scope page increment and no unexplained model-field orphan. The attack is
different: the backlog accurately packages a structure whose decisive business rules are still
unknown. Removing the `blocked` state would be fabrication.

---

## 5. Integration completeness — lookup touchpoints are covered, ownership is not fully closed

`integrations.md` accounts for every obvious external lookup used by the create journey:

- countries/territories and UK regions;
- CVEDP commodity tree, type and biological species;
- approved establishments plus section/type/status filters;
- BCPs, ports of entry and control points;
- saved parties/contact addresses and CUC postcode results;
- persistence, upload, risk, Trade Charge, SOAP read-back, queues, auth, and deferred services.

The SSR limitation is stated correctly: browser traces prove that options rendered, not the hidden
server-to-server request or response schema. Most call shapes are therefore code-derived/inferred.

Residual integration/provenance gaps:

- **Risk-category selection is not sourced.** The document describes a declaration-time risk call,
  but not the rule that computes “highest risk”, allows or forbids a lower user selection, or routes
  low-risk pages.
- **Eligibility filters are opaque.** The endpoint names do not establish which commodity/origin
  combinations permit health certificates, approved establishments, POEs, control points, CTC/GVMS,
  CUC, or automatic clearance.
- **Stable codes are missing for rendered static vocabularies.** Transport means, purpose,
  temperature, package types, document types, establishment types, and transporter types are partly
  labels only. The target model correctly warns against storing labels, but the owning canonical
  code sets are not all proven.
- **Saved-address and dashboard option provenance is broad rather than page-specific.** The customer/
  economic-operator and BIP entries plausibly cover them, but the exact filter, tenancy, ordering,
  deduplication, and visibility rules are not evidenced.
- **Failure contracts are absent.** Timeout, unavailable reference data, pagination drift, expired
  establishment, rejected lookup, retry, fallback, and stale-cache behaviour were not rendered.

So every lookup page has a plausible system owner, but not every option set or eligibility rule has a
proven owner and contract. `integrations.md` is an architecture hypothesis with some strong wire
evidence, not a complete integration specification.

---

## 6. Fish / IUU boundary — ruled out, but not cleanly curated out

The programme ruling is clear and correctly repeated in `target-model.md`, `backlog.json`, and
`integrations.md`: fish/IUU is outside CHED-P; catch-certificate pages and data, chapter 03, fish
sub-codes in mixed chapters, and Anguilla species must not be implemented or seeded here.

The evidence artefacts do **not** fully enact that ruling:

- the fish trace `db2d277c…` remains one of the 96 selected CHED-P traces, despite conflict `c-005`
  saying the canonical set should be 95;
- `page-inventory.json` and `journey-spec.json` still contain
  `catch-certificate-needed`, `attach-catch-certificate`, and
  `add-catch-certificate-details` as confirmed pages;
- those pages contribute 12 confirmed fields and six validation gaps to the CHED-P-wide metrics;
- `review-notification.json` retains an inferred `catch-certificate-summary`;
- shared commodity specs still carry `03019230`, chapter 03, Farmed/Wild fish types, and
  Anguilla values in ordinary option/observed-value arrays.

The records are heavily labelled as boundary evidence, and the target model/backlog exclude them, so
this is not a hidden implementation requirement. It is still a curation failure: a consumer reading
`trace-index.json`, `page-inventory.json`, `journey-spec.json`, or raw page options can ingest fish as
CHED-P. The canonical CHED-P output needs either physical removal with a separate IUU handoff
artefact, or a machine-readable `scope: IUU` filter applied consistently to traces, pages, fields,
options, counts, and generated outputs.

---

## 7. Method critique — requirements structurally invisible to rendered-frontend mining

The rendered frontend can reveal page order, labels, controls, some payloads, option samples, and
the few failures the tests deliberately trigger. It cannot reveal the following classes of
requirement unless the test happens to activate a visible consequence:

1. **Business rules with no UI.** Commodity/origin admissibility, Article 72 applicability,
   auto-clearance, risk-rate selection, CUC chargeability, establishment eligibility, POE/control
   point filtering, split rules, and status transitions can execute entirely server-side.
2. **Server-side validation never triggered.** Requiredness, cross-field dependencies, numeric
   ranges, date relationships, duplicates, cardinality, submission-wide checks, stale versions, and
   invariant enforcement are invisible on happy paths.
3. **Authorisation and ownership.** Which roles can create, view, amend, clone, delete, submit,
   replace, override or act for another organisation; draft versus submitted visibility; DoA
   attribution; tenancy boundaries; and field-level redaction cannot be inferred from one B2C
   notifier journey.
4. **Why a field exists.** Legal basis, policy intent, operational consumer, whether a value is
   declarative or computed, and whether legacy copy remains lawful/current are not encoded by DOM
   markup.
5. **Data-dependent behaviour outside fixtures.** The corpus uses a small set of origins,
   commodities, species, risks, BCPs, establishments, addresses and dates. It cannot enumerate the
   production domains or expose boundary cases it never selected.
6. **Persistence semantics.** Transaction boundaries, partial saves, idempotency, concurrency,
   optimistic-lock conflict handling, cleanup when upstream answers change, audit history, and
   recovery after interrupted uploads are mostly hidden.
7. **Integration contracts behind SSR.** Authentication between services, request/response schemas,
   caching, timeouts, retries, fallback, pagination, eventual consistency, failure mapping, and
   observability are not browser-visible.
8. **Downstream consequences.** Events, Trade Charge, risk decisions, notifications, inspection
   routing, SOAP mappings, PDFs, analytics, and later amendments may have no create-page surface.
9. **Security, privacy and records management.** Retention, deletion, subject access, encryption,
   malware handling, audit, fraud controls, rate limiting, CSRF/session policy, and sensitive-data
   exposure are structurally outside page mining.
10. **Non-functional requirements.** Performance, concurrency/load, availability, disaster recovery,
    browser/device support, accessibility of unvisited conditional/error states, monitoring and
    supportability cannot be derived from a screenshot/DOM trace.
11. **Negative space.** A control absent from one state does not prove it is forbidden. A control in
    a shared page object does not prove it applies to CHED-P. A successful test does not prove the
    fixture is the only valid path.

Those are gaps by definition under the deliberately restricted method. The DoA pass is needed for
role, delegation, organisation ownership and visibility. The authorised legacy supplementary pass is
needed for validators, route predicates, stable enum codes, service contracts, persistence and
server-only business logic. Even legacy cannot decide future policy or explain contradictory legacy
implementations; those require product/legal/operational rulings.

---

## Severity-counted gap register

| ID | Severity | Gap |
|---|---|---|
| B-1 | **BLOCKER** | Validation truth is missing: 65/80 records are gaps; only 11 records/six strings are confirmed and only 7/74 pages have any confirmed message. |
| B-2 | **BLOCKER** | Executable routing/eligibility rules are invisible: risk, documents, establishments, onward transport, POE/control points, CTC/GVMS, CUC and submission outcomes. |
| B-3 | **BLOCKER** | CSV, Article 72 and DoA/agent have zero verified CHED-P journey evidence; current evidence is CHED-PP-only or absent. |
| M-1 | **MAJOR** | Major create branches are not completed: transhipment, full Transit, internal-market alternatives, origin alternatives, multi-commodity, containers, document/establishment boundaries and contact variants. |
| M-2 | **MAJOR** | Shared page-object-only controls/pages are unresolved and cannot be classified as stale, other-CHED, or live CHED-P without supplementary evidence. |
| M-3 | **MAJOR** | Page/field confidence overstates rule completeness: 92.1% of fields and 97.3% of pages are “confirmed” while validation is only 13.8% confirmed. |
| M-4 | **MAJOR** | Fish/IUU is ruled out but remains embedded in selected traces, inventory, combined spec, confirmed-field counts and shared option arrays. |
| M-5 | **MAJOR** | Integration owners are plausible, but eligibility filters, stable codes and failure contracts remain unproved behind SSR. |
| M-6 | **MAJOR** | The corpus contains zero CHED-P accessibility traces; source test page names do not prove accessibility outcomes or conditional/error-state coverage. |
| M-7 | **MAJOR** | Authorisation, policy intent, persistence/concurrency, server-only rules and NFRs are structurally invisible until the DoA + legacy supplementary pass and human rulings. |
| m-1 | **MINOR** | Artefact drift: inventory/pages contain 74 specs while `journey-spec.json` contains 73, omitting the reconciled decision-redispatch alias without a machine-readable tombstone. |

**Total: 11 gaps — 3 BLOCKER, 7 MAJOR, 1 MINOR.**

**Weakest area: validation.** A rebuild can reproduce much of the rendered structure from this
material. It cannot reproduce faithful CHED-P behaviour when 81.3% of validation records are gaps and
most route-dependent mandatoriness was never exercised.
