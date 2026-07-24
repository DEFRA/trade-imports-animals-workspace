# CHED-P journey specification gate — supplementary reconcile re-run

Regenerated from all **79 enriched page specs**, folding in authoritative legacy IPAFFS validation/mandatoriness and the cross-type delegated-authority evidence in `authorization-rules.md`. One false page boundary remains consolidated, producing **78 canonical page records**.

## Read this first — weak parts and headline improvement

- **Validation grounding is the headline:** **11 confirmed / 0 legacy / 65 gap** before (plus 4 inferred; 80 total) → **11 confirmed / 645 legacy / 8 gap** now (0 inferred; 664 total). Grounded coverage is now **656/664 (98.8%)**, up from **11/80 (13.8%)**.
- **8 validation gaps remain:** `approved-establishment-of-origin`, `consignor-confirmation`, `consignee-confirmation`, `transporter`, `transporter-confirmation`, `branch-address-confirmation`, `transit-exit-bcp`, `delete-notification-confirmation`. These are chiefly interstitial/integration failures, the transporter-hub requirement, the approved-establishment empty state, and the unenforced Transit seven-day promise.
- **7 conflicts still need a human.** The most consequential are two-layer validation copy (c-038), the Transit seven-day promise (c-040), upload minimum size (c-041), cloning scope (c-006), CUC eligibility (c-008), risk override semantics (c-027), and review blank-display policy (c-028).
- **DoA is cross-type evidence.** There is no CHED-P/CVEDP delegated-authority notification journey in the corpus. The ownership/visibility mechanism is strong rendered evidence from CHED-PP Plant fixtures, but CHED-P-specific route placement, POAO copy and role policy still need confirmation.
- Field confidence is strong but not complete policy: **481 confirmed / 96 legacy / 32 inferred / 0 gap** across 609 rows. The 32 inferred rows are shared-page-object/QA variants and must not be treated as confirmed unconditional CHED-P controls.

## Counts and full confidence breakdown

| Metric | Count |
|---|---:|
| Enriched source page specs consumed | 79 |
| Canonical page records | **78** |
| Page scopes | 68 CHED-P / 3 IUU / 2 cloning candidate / 5 cross-type DoA |
| Field rows | **609** |
| Accepted distinct CHED-P obligations | 508 |
| Validation-message rows | **664** |
| Conflicts | **47** (7 needsHuman; 2 newly resolved) |
| Model gaps | **14** |
| Open questions after exact whitespace-normalised deduplication | **596** |
| GOV.UK component inventory entries | 68 |
| Non-standard pattern records | 254 |

### Fields

| confirmed | legacy | inferred | gap | total |
|---:|---:|---:|---:|---:|
| 481 | 96 | 32 | 0 | 609 |

### Validation messages — before → after

| Pass | confirmed | legacy | inferred | gap | total | grounded |
|---|---:|---:|---:|---:|---:|---:|
| Previous | 11 | 0 | 4 | 65 | 80 | 11/80 (13.8%) |
| **This pass** | **11** | **645** | **0** | **8** | **664** | **656/664 (98.8%)** |

`legacy` means authoritative IPAFFS source with file:line, not rendered error-state proof. Thirty-six obsolete gap placeholders were removed only where the enriched source supplied the same failure’s exact message or established that no page-level message exists.

## Conflict register — needsHuman first

Newly resolved conflicts are explicitly marked. Full structured evidence is in `conflicts.json`.

| ID | Status | Page | Topic | Sources | Ruling |
|---|---|---|---|---|---|
| c-006 | **NEEDS HUMAN** | clone-certificate-type / clone-search | Cloning intended success path conflicts with rendered HTTP 406 failure | rendered-trace, test-assertion, workflow-config | Out-of-scope candidate — needs human confirmation. Rendered reality wins for the current-state model, so only the type/search form and 406 fallback are confirmed. Do not promise a working clone path unless a human explicitly puts cloning into rebuild scope. |
| c-008 | **NEEDS HUMAN** | common-user-charge | CUC eligibility: Sevington versus explicit isCuc flag | test-assertion, workflow-config | Keep the CUC pages in scope and record their routing as conditional. The actual eligibility rule cannot be settled by precedence because both facts come from the same weaker source tier and were varied together. |
| c-027 | **NEEDS HUMAN** | select-risk-category | Selected risk category differs from hidden highest-risk value | rendered-trace, workflow-config | Model highest-risk-category as computed and risk-category as the explicit user answer. Whether the computed maximum constrains or validates the selection cannot be settled from the admissible evidence. |
| c-028 | **NEEDS HUMAN** | review-notification | Review consignment-reference row is blank while QA expects configured value | rendered-trace, test-assertion | Treat the row as a restatement of origin-of-import.local-reference-number and support blank and populated states. Requiredness/blank-display policy remains a human product decision. |
| c-038 | **NEEDS HUMAN** | country-of-origin / origin-of-import / contact-address / transport-details / decision-reason-for-refusal | Two legacy validation layers use different copy for the same failure | legacy-source:frontend-joi, legacy-source:backend-model | Retain both messages with their distinct triggers in the evidence model. No rendered error establishes which layer reaches the user first; content and architecture owners must choose one user-facing string per failure in the rebuild. |
| c-040 | **NEEDS HUMAN** | about-the-consignment / transit-exit-bcp | Transit exit-date hint promises a seven-day rule that source does not enforce | legacy-source:template, legacy-source:validator | Keep the seven-day statement as legacy copy and keep the missing enforcement as a validation gap. Both facts are the same evidence tier, so a human must decide whether the rebuild implements the promised rule or removes the promise. |
| c-041 | **NEEDS HUMAN** | document-upload / attachments-tab | Upload minimum-size copy says 1KB while implementation rejects below 200 bytes | legacy-source:validation-copy, legacy-source:validator | Preserve the current 200-byte implementation threshold and the 1KB string as conflicting legacy facts. Same-tier evidence cannot establish intended policy; a human must choose one threshold and matching copy for the rebuild. |
| c-001 | Settled | about-the-consignment | Transit exit-BCP option set: rendered list omits HOLYHEAD but QA requires it | rendered-trace, test-assertion | Rendered-trace wins on the captured option set: retain the 34 rendered options and count for this evidence snapshot. Record HOLYHEAD as test-asserted intent and require the rebuild to source the current eligible BCP set from reference data rather than hardcode the trace list. |
| c-002 | Settled | catch-certificate-needed / attach-catch-certificate / add-catch-certificate-details | Fish catch-certificate sub-flow belongs to IUU, not CHED-P | rendered-trace, programme-scope-decision | Out of CHED-P scope → IUU. Keep the three page records and their fields solely as boundary evidence, tag scope=IUU, and do not count them as CHED-P field obligations. This is a settled programme decision. |
| c-003 | Settled | search-commodity | HS chapter 03 and fish sub-codes belong to IUU | rendered-trace, programme-scope-decision | Out of CHED-P scope → IUU for all HS chapter 03 codes and fish sub-codes in mixed chapters such as chapter 16. Meat sub-codes in chapter 16 remain CHED-P. Keep the shared commodity-search page, but tag these value subsets as IUU exclusions. |
| c-004 | Settled | commodity-basic-description | Anguilla species values belong to IUU | rendered-trace, programme-scope-decision | Out of CHED-P scope → IUU for the Anguilla fish species values. Keep the shared page and field as CHED-P, retain the fish values as tagged boundary evidence, and exclude those values from the CHED-P species reference set. |
| c-005 | Settled | journey-set | Fish trace is evidence for IUU and must be removed from the CHED-P journey set | rendered-trace, programme-scope-decision | Drop db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d from the canonical CHED-P journey set (96 mined → 95 in-scope). Retain citations only on scope=IUU boundary records for handoff. |
| c-007 | Settled | common-user-charge | Common User Charge was confused with Common Transit Convention in inventory evidence | page-inventory, rendered-trace, test-assertion | Common User Charge and all billing pages are IN CHED-P scope. Adopt the rendered billing-details/confirm evidence and corrected actions. Treat CTC and CUC as separate features despite the shared word “Common”. |
| c-009 | Settled | decision-datetime-submit / decision-redispatch-deadline | Inspector decision inventory over-splits a single /review page | rendered-trace, legacy-source, page-inventory, workflow-config | Keep one canonical decision-datetime-submit review page and retain decision-redispatch-deadline only as a source alias. Count the six review controls once. Fold the legacy refusal-by validation copy into decision-conclusion and keep its existing combined confirmed refusal-date field rather than inventing a standalone deadline page. |
| c-010 | Settled | decision-datetime-submit | Inspector declaration wording differs from stale page-object locator | rendered-trace, page-object | Adopt the rendered official-inspector wording. Treat the unused certifying-officer locator as stale or a different decision variant. |
| c-011 | **NEWLY RESOLVED** | origin-of-import | Region-code hint and DOM maxlength disagree | rendered-trace, legacy-source | Adopt 3 as the canonical maximum because the confirmed DOM constraint and legacy validator agree. Retain the 5-character rendered hint verbatim as a confirmed copy defect; the rebuild must change the hint to match the 3-character rule. |
| c-012 | Settled | accompanying-documents / attachments-tab | Document-type contextual list is narrower than QA vocabulary | rendered-trace, legacy-source, workflow-config | Rendered evidence wins on this captured page: keep its 14-option set. Keep Catch certificate in the separate IUU flow and do not silently introduce either legacy-only value. Source the rebuilt list from contextual reference data because the legacy constants and rendered deployment demonstrably differ. |
| c-013 | Settled | commodity-extended-description | Package-type contextual list is narrower than QA vocabulary | rendered-trace, workflow-config | Rendered-trace wins for the observed branch. Keep the rendered options/count, record the wider catalogue only as contextual reference data, and do not silently add its extra values to this field. |
| c-014 | Settled | document-upload / attachments-tab | Displayed upload extension list is narrower than test-proven acceptance | rendered-trace, legacy-source, test-assertion | Preserve the rendered copy as current-state evidence and the legacy/test allow-list as accepted behaviour. The rebuild must publish the exact allow-list it enforces and name DOCX/XLSX explicitly if they remain accepted. |
| c-015 | **NEWLY RESOLVED** | document-upload / attachments-tab / attach-catch-certificate | Upload size boundary says “up to 10MB” and “smaller than 10MB” | rendered-trace, legacy-source, test-assertion | Adopt an inclusive 10 MiB boundary as canonical legacy behaviour. Keep the rendered “smaller than 10MB” string as the confirmed copy defect and replace it with unambiguous inclusive wording in the rebuild. |
| c-016 | Settled | notifications-dashboard / notification-search-view | Notification results render as cards while page object addresses a table | rendered-trace, page-object | Rendered-trace wins on current structure: model cards and treat the table locators as stale or variant-only. The rebuild may deliberately choose a GOV.UK table or summary-list pattern. |
| c-017 | Settled | notifications-dashboard / notification-search-view | Yesterday quick-range exists in page object but not rendered dashboard | rendered-trace, page-object | Exclude Yesterday from the confirmed dashboard option set. Retain it only as inferred shared/variant scaffolding until a CHED-P trace or assertion establishes the condition. |
| c-018 | Settled | consignor-creation | Re-entry consignor flow renders consignee copy and route | rendered-trace, page-object, workflow-config | Rendered-trace wins on the re-entry variant copy and route. Preserve it as legacy evidence, tag the role mismatch, and do not generalise the swapped copy to the standard ROW consignor page. |
| c-019 | Settled | contact-details | Contact-details action set differs by trace and page-object variants | rendered-trace, page-object, workflow-config | Keep the trace-rendered actions as confirmed and Save and review as an inferred review-entry variant. Do not model all labels as simultaneously available. |
| c-020 | Settled | origin-of-import | Origin page object exposes a health-certificate question absent from CHED-P traces | rendered-trace, legacy-source, page-object | Legacy outranks the inferred page-object member and corroborates the rendered absence. Retain the field only as excluded stale/cross-type evidence; do not count it as a CHED-P obligation or render it on this page. |
| c-021 | Settled | commodity-additional-details | Commodity-additional controls exist only in shared page object | rendered-trace, page-object | Keep the rendered temperature controls as canonical. Retain the extra controls only as inferred variants with unknown conditions; do not promote them to unconditional requirements. |
| c-022 | Settled | commodity-extended-description | Commodity-extended controls exist only in shared page object | rendered-trace, page-object | Rendered-trace wins on the observed CHED-P commodity branch. Retain the extras only as inferred conditional variants pending evidence of their CHED-P applicability. |
| c-023 | Settled | transporter | Transporter No/Select controls are cross-CHED page-object leakage | rendered-trace, page-object, workflow-config | Exclude both from confirmed CHED-P structure. Preserve only as inferred cross-type variants so the evidence is not lost. |
| c-024 | Settled | decision-conclusion / decision-reason-for-refusal | Invalid-certificate checkbox is attached to the wrong page object | rendered-trace, page-object, workflow-config | Do not add it to decision-conclusion. Treat it as a reason-for-refusal control and the page-object member as misplaced/stale. |
| c-025 | Settled | override-risk-decision | Override-risk radio is workflow-driven but absent from rendered snapshots | rendered-trace, workflow-config | Preserve the radio as an inferred variant-only control with an unknown render condition. The rendered confirmation copy/actions remain canonical for the captured state. |
| c-026 | Settled | search-approved-establishment | Approved-establishment row Select versus terminal Save and continue | rendered-trace, test-assertion, page-object | Model Select as the confirmed row action and Save and continue as the inferred terminal action. Tests establish intent where the trace is silent; they are sequential rather than competing labels. |
| c-029 | Settled | multiple | Inventory action pointers corrected by rendered page evidence | page-inventory, rendered-trace | Use the corrected rendered actions recorded in each verified page spec. Inventory order remains canonical, but its incorrect action/note is not used as provenance for the affected fact. |
| c-030 | Settled | decision-conclusion / decision-reason-for-refusal / laboratory-test-required | Inventory URL/label guesses differ from rendered inspector routes and copy | page-inventory, rendered-trace | Rendered-trace wins on URL and copy. Keep the stable inventory slugs as canonical identifiers, but adopt the rendered routes/headings/labels in page fields. |
| c-031 | Settled | common-user-charge | Common User Charge canonical slug aliases legacy billing-details routes | page-inventory, rendered-trace | Keep common-user-charge as the canonical requirement slug and the rendered /billing-details/* URLs as legacy route evidence. This is a naming alias, not a separate page obligation. |
| c-032 | Settled | attach-catch-certificate | Fish upload-count comment says one while configuration and trace use two | rendered-trace, workflow-config | Treat the comment as stale. Adopt two as the observed/configured fixture count, while keeping actual catch-certificate cardinality as dynamic IUU behaviour rather than a CHED-P requirement. |
| c-033 | Settled | clone-search | Cloning certificate-details primary action: Search versus unused Continue | rendered-trace, page-object, workflow-config | Adopt Search as the confirmed current action. Retain Continue only as inferred stale/other-certificate-type scaffolding; it is not part of the accepted clone candidate without further evidence. |
| c-034 | Settled | border-notification-create / border-notification-review | Border-notification Save and Submit belongs to review, not create page | rendered-trace, page-object, workflow-config | Rendered structure and workflow sequence agree on two stages: Save and continue belongs to create; Submit belongs to review. Treat the page-object ownership as broad/stale rather than duplicating Submit onto the create page. |
| c-035 | Settled | about-the-consignment / transit-exit-bcp | Transit exit BCP inventory record is a conditional facet of About the consignment | rendered-trace, page-inventory | Keep both page records to preserve inventory evidence, but link the eight repeated Transit fields to about-the-consignment and count them once. Treat transit-exit-bcp as a variant facet, not a second obligation-bearing page. |
| c-036 | Settled | notifications-dashboard / notification-search-view | Notification search/view record restates the dashboard search form | rendered-trace, page-inventory | Keep the downstream-state page record, link its repeated search fields to notifications-dashboard, and count only the additional decision-date/detail surface as new. |
| c-037 | Settled | country-of-origin / origin-of-import | Country of origin is collected/restated on two consecutive origin pages | rendered-trace, page-inventory, workflow-config | Preserve both rendered page occurrences but count one obligation. country-of-origin.origin-country is canonical; origin-of-import.origin-country carries a restatementOf link. |
| c-039 | Settled | goods-movement-services / transport-details / latest-health-certificate / commodity-basic-description / consignor-creation | Page-save leniency versus final-submission mandatoriness | legacy-source:frontend-joi, legacy-source:backend-model | Model these as different lifecycle triggers rather than competing booleans: draft page-save may be lenient, but the final CHED-P obligation is required where the model group says so. Preserve required:true with requiredConfidence=legacy and record the save-versus-submit trigger explicitly. |
| c-042 | Settled | bip-notification-hub | BIP hub QA exposes Request amendment but authorised hub template does not | legacy-source, page-object | Legacy source outranks the page-object inference. Exclude Request amendment from the canonical hub controls and retain it only as overview/stale scaffolding until rendered evidence proves a hub variant. |
| c-043 | Settled | notification-hub / health-certificate-required | Rendered deployment URLs include /notification/vnet while legacy app routes do not | rendered-trace, legacy-source | Keep the confirmed rendered URLs in page evidence. Treat /notification/vnet as deployment/context routing rather than a domain requirement; the rebuild must define its own routes and must not infer duplicate pages. |
| c-044 | Settled | nominated-contacts | Nominated-contact control types disagree with the authorised template | rendered-trace, legacy-source | Confirmed trace metadata wins under the requested taxonomy, so retain it in the canonical field rows and preserve the legacy types as provenance. Flag a targeted DOM re-check because the confirmed mapping is internally suspicious; do not silently overwrite it with lower-tier source. |
| c-045 | Settled | record-control | Record-control identification/documentation copy differs from CHED-P legacy template | rendered-trace, legacy-source | Rendered-trace wins on current copy. Retain the template wording as lower-precedence provenance and use the confirmed labels in the canonical current-state model. |
| c-046 | Settled | search-approved-establishment | Approved-establishment Country label says required but handler does not require it | rendered-trace, legacy-source | Keep the rendered label as evidence but set semantic requiredness to false from legacy behaviour. The rebuild should remove “(required)” unless product policy deliberately introduces a real requirement. |
| c-047 | Settled | search-existing-consignee | Legacy consignee search includes Country but rendered CHED-P page omits it | rendered-trace, legacy-source | Rendered-trace wins on the captured CHED-P page. Keep Country as a legacy/shared conditional variant and do not promote it to an unconditional CHED-P search field. |

## Model gaps

### cross-page-conditionality

Page and field availability depends on answers or computed state collected elsewhere: purpose drives Transit fields; risk category gates health-certificate pages; origin drives port eligibility; CTC/GVMS answers affect downstream assessment; CUC eligibility is derived outside the billing pages. The flat page/field schema records these conditions as text but cannot execute the routing graph.

Affected pages: `about-the-consignment`, `transit-exit-bcp`, `select-risk-category`, `health-certificate-required`, `latest-health-certificate`, `transport-details`, `goods-movement-services`, `common-user-charge`, `billing-select-address`, `billing-contact-details`.

### at-least-one-of-sibling-fields

Some requirements are group constraints rather than per-field required flags, including contact email-or-telephone and branch-dependent decision/refusal inputs. The model cannot express “at least one of these siblings” without inventing a validation mechanism.

Affected pages: `contact-details`, `nominated-contacts`, `billing-contact-details`, `decision-conclusion`, `decision-reason-for-refusal`.

### repeating-group-in-repeating-group

Commodity/package rows repeat; documents and contacts repeat; the IUU handoff is deeper (attachments → catch certificates → species rows). A flat fields array cannot express nested cardinality, row identity, add/remove behaviour or partial-row validation.

Affected pages: `commodity-extended-description`, `accompanying-documents`, `attachments-tab`, `nominated-contacts`, `add-catch-certificate-details`.

### summary-restatement-linkage

Review, confirmation and dashboard-state pages restate values gathered or generated elsewhere. Restatement fields carry restatementOf links and are not counted as distinct obligations, but the schema cannot model every derived display row or multi-source summary cleanly.

Affected pages: `notification-search-view`, `review-notification`, `confirmation`, `bip-decision-confirmation`, `border-notification-review`, `border-notification-confirmation`, `common-user-charge`.

### shared-page-variant-alias

transit-exit-bcp is a conditional snapshot of about-the-consignment/page-5, not an independent page. The retained page record links its repeated fields back to the canonical page but preserves variant-only controls and evidence.

Affected pages: `about-the-consignment`, `transit-exit-bcp`.

### inspector-review-over-split

decision-datetime-submit and decision-redispatch-deadline both resolve to one /review page and remain consolidated. Legacy source now locates the real Refusal by date inputs on decision-conclusion; the alias spec is consumed without creating a standalone page.

Affected pages: `decision-datetime-submit`, `decision-conclusion`.

### commodity-dependent-reference-data-and-scope

Commodity code controls available species, package types and establishments. The CHED-P/IUU boundary also applies at value level: chapter 03, fish sub-codes in mixed chapters and Anguilla species move to IUU while the shared pages remain CHED-P. The flat option arrays cannot execute these joins or exclusions.

Affected pages: `search-commodity`, `commodity-basic-description`, `commodity-extended-description`, `approved-establishment-of-origin`, `search-approved-establishment`.

### risk-category-computed-versus-selected

The hidden highest-risk-category can differ from the user-selected risk-category. The flat field model can retain both values but cannot express the constraint, override policy or downstream recomputation semantics.

Affected pages: `select-risk-category`, `health-certificate-required`, `notification-hub`.

### unexercised-multi-commodity-loop

The corpus only submits one commodity and answers No to add another. The existence, upper bound, removal behaviour and cross-commodity risk aggregation of a multi-commodity loop are not expressible or evidenced cleanly.

Affected pages: `search-commodity`, `commodity-basic-description`, `commodity-extended-description`, `select-risk-category`.

### external-outcome-and-status-variants

Task-list statuses, inspection outcomes, decision states and dashboard tags depend on external services and actor actions. The specs record observed and inferred strings, but the flat model cannot encode their state machines.

Affected pages: `notification-hub`, `confirmation`, `bip-notification-hub`, `bip-decision-confirmation`, `border-notifications-dashboard`, `record-decision-search`, `ov-notifications-dashboard`.

### shared-page-object-cross-type-leakage

Several shared page objects expose controls used by other CHED types but absent from CHED-P traces (for example Transporter No/Select, commodity Apply/Number of animals and misplaced decision controls). They remain inferred variants rather than unconditional requirements.

Affected pages: `origin-of-import`, `commodity-additional-details`, `commodity-extended-description`, `transporter`, `decision-conclusion`, `override-risk-decision`.

### two-layer-validation

IPAFFS validates in two legacy layers: per-page frontend Joi on draft save and downstream CHED-P model validation on final submit. Copy and timing differ (c-038/c-039); a flat validationMessages array can retain both triggers but cannot execute the lifecycle.

Affected pages: `country-of-origin`, `origin-of-import`, `contact-address`, `transport-details`, `goods-movement-services`, `latest-health-certificate`, `decision-reason-for-refusal`.

### optimistic-concurrency-etag

Many editable pages round-trip a hidden etag and validate its presence/shape. No trace or QA test establishes the stale-token conflict UX, recovery route or copy. The rebuild must deliberately retain or replace optimistic concurrency.

Affected pages: `commodity-extended-description`, `commodity-additional-details`, `document-upload`, `search-approved-establishment`, `traders-addresses`, `consignee-creation`, `consignee-confirmation`, `importer`, `transporter`, `transporter-creation`, `transporter-confirmation`, `branch-address-creation`, `branch-address-confirmation`, `declaration`, `transit-exit-bcp`, `common-user-charge`, `billing-select-address`, `catch-certificate-needed`, `bip-notifications-dashboard`, `bip-notification-hub`, `documentary-check`, `identity-physical-check`, `laboratory-test-required`, `laboratory-test-setup`, `laboratory-test-results`, `delete-notification-confirmation`.

### delegated-authority-model

Ownership, visibility, draft privacy, post-submit creator access, Trade Partner marking and assigned-organisation auto-population are cross-page, server-enforced rules. They cannot be expressed by the flat page/field spine and all available DoA notification evidence is cross-type CHED-PP/Plant evidence rather than a CHED-P-specific journey.

Affected pages: `choose-your-organisation`, `who-are-you-creating-this-notification-for`, `which-company-is-this-notification-for`, `notifications-dashboard`, `review-notification`, `manage-your-authorisations`.

## Delegated-authority (DoA) model summary

**Evidence boundary:** Cross-type evidence only: the corpus contains no CHED-P/CVEDP delegated-authority notification journey. Notification observations were rendered on CHED-PP Plant fixtures; shared organisation and authorisation-management observations are type-agnostic or Plant-fixture evidence. Apply the mechanism to authorised POAO organisations, not the Plant-specific copy or commodity route.

- Ownership follows the selected `assignedOrg`, not the actor’s employer; the submitter remains a separate audit identity.
- An agent may choose their own POAO agency or only an authorised represented POAO client, and may change that choice before submission.
- Submitted work is visible to assigned-organisation members and the submitting agent; client members cannot see the agent’s draft before submission; unrelated organisations remain isolated.
- On-behalf-of submitted work carries the Trade Partner badge. Importer and responsible-person/contact defaults come from the assigned organisation and must be recalculated after pre-submit reassignment.
- B2B access remains permission/role-scoped and does not itself confer ownership or blanket visibility.
- No direct DoA contradiction was found. Draft/submitted and creator/member differences are modelled as actor/state conditions. AUTH-10 (agency-coworker isolation) is inferred from the combined ownership/isolation model rather than a dedicated trace.

Open DoA questions:

- Which designated member/contact supplies the responsible-person fields for an assigned POAO client?
- Do non-author Amend and Copy controls succeed downstream, and what happens to the Trade Partner badge/ownership on those actions?
- Is agent-draft privacy an intended policy for CHED-P, or an artefact of the legacy implementation?
- What exact B2B permission matrix applies to CHED-P notifications?
- A CHED-P-specific DoA trace is still required to confirm POAO copy, route placement and conditional page presence.

## Fish/IUU, inspector review and cloning rulings carried forward

- Fish/IUU: drop the one fish trace from the CHED-P journey set; retain the three catch-certificate pages as IUU boundary evidence; move HS chapter 03, fish sub-codes in mixed chapters and Anguilla values to IUU.
- Inspector review: keep one decision-datetime-submit page. The refusal By date control is conditional content on decision-conclusion, not a standalone redispatch page.
- Cloning: retain the type/search/HTTP 406 evidence as an out-of-scope candidate. A working clone path remains unpromised pending c-006.

## Five most consequential decisions

1. **Implement DoA as a server-enforced tenancy layer.** Ownership, draft privacy, post-submit visibility and assigned-organisation auto-population are security/data-isolation rules, not page decoration.

2. **Keep a deliberate validation lifecycle.** The legacy system distinguishes lenient draft saves from strict final submission (c-039). The rebuild must either preserve that lifecycle or replace it explicitly, while selecting one user-facing string where the two source layers disagree (c-038).

3. **Adopt the two newly settled constraints and repair their copy.** Region code is 3 characters (c-011); exactly 10 MiB is accepted (c-015). The rendered 5-character and “smaller than” strings are confirmed defects, not alternate rules.

4. **Do not invent missing scope.** Fish goes to IUU, the inspector review remains consolidated, and cloning stays out-of-scope candidate until c-006 is explicitly accepted.

5. **Treat source/reference vocabularies as contextual.** Rendered option sets win over broader legacy/QA catalogues; source dynamic data rather than hardcode CHED-P document, package, country, BCP, commodity or species lists.

## GOV.UK component inventory

Observed count is the sum of numeric per-page counts; entries is the number of component records. The consolidated false redispatch page is not double-counted.

| Component | GOV.UK class | Observed count | Entries | Pages | Modifiers |
|---|---|---:|---:|---|---|
| Accordion | govuk-accordion | 1 | 1 | add-catch-certificate-details | govuk-accordion__section--expanded |
| Back link | (rendered as link "Back" in header region, href="#") | 1 | 1 | import-type |  |
| Back link | govuk-back-link | 21 | 21 | origin-of-import, commodity-basic-description, select-risk-category, health-certificate-required, commodity-extended-description, document-upload, approved-establishment-of-origin, consignee-confirmation, contact-details, nominated-contacts, contact-address, branch-address-creation, branch-address-confirmation, declaration, common-user-charge, catch-certificate-needed, attach-catch-certificate, decision-conclusion, decision-datetime-submit, amend-notification-hub, clone-search | back-link--next-to-breadcrumbs |
| Back link | n/a (rendered in service-info chrome region, not main) | 1 | 1 | clone-certificate-type |  |
| Body | govuk-body | 48 | 18 | select-risk-category, health-certificate-required, latest-health-certificate, accompanying-documents, importer, means-of-transport-after-bcp, declaration, common-user-charge, attach-catch-certificate, attachments-tab, bip-notification-hub, record-decision-search, override-risk-decision, ched-overview-replace-certificate, amend-notification-hub, delete-notification-confirmation, clone-certificate-type, clone-search | govuk-!-margin-bottom-2, govuk-!-margin-bottom-6, govuk-!-margin-bottom-8, govuk-!-padding-left-0, govuk-body-s, govuk-grid-column-full, govuk-grid-column-two-thirds, margin-top-5 |
| Body text | govuk-body | 15 | 11 | notifications-dashboard, notification-hub, consignor-creation, consignee-creation, transporter, nominated-contacts, catch-certificate-needed, bip-decision-confirmation, ov-notifications-dashboard, border-notification-create, border-notification-confirmation | govuk-!-margin-bottom-8 |
| Body text / link | govuk-body | 1 | 1 | laboratory-test-results |  |
| Button |  | 2 | 2 | are-you-a-plants-importer-or-agency, choose-your-organisation |  |
| Button | govuk-button | 116 | 71 | notifications-dashboard, import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, health-certificate-required, commodity-extended-description, commodity-additional-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-approved-establishment, traders-addresses, search-existing-consignor, consignor-creation, consignor-confirmation, search-existing-consignee, consignee-creation, consignee-confirmation, importer, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, transporter-confirmation, contact-details, nominated-contacts, contact-address, branch-address-creation, branch-address-confirmation, review-notification, declaration, confirmation, transit-exit-bcp, common-user-charge, billing-select-address, billing-contact-details, catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details, notification-search-view, attachments-tab, bip-notifications-dashboard, bip-notification-hub, documentary-check, identity-physical-check, laboratory-test-required, laboratory-test-setup, laboratory-test-results, decision-conclusion, decision-reason-for-refusal, decision-datetime-submit, bip-decision-confirmation, record-decision-search, override-risk-decision, ched-overview-replace-certificate, ov-notifications-dashboard, record-control, border-notification-create, border-notification-review, border-notification-confirmation, border-notifications-dashboard, delete-notification-confirmation, clone-certificate-type, clone-search | button-small, copy-button, govuk-!-display-block, govuk-!-margin-0, govuk-!-margin-bottom-0, govuk-!-margin-bottom-2, govuk-!-margin-bottom-4, govuk-!-margin-right-1, govuk-!-margin-right-3, govuk-!-margin-top-5, govuk-!-margin-top-6, govuk-!-margin-top-7, govuk-button--secondary, govuk-button--warning, govuk-button-group, submit-button |
| Caption | govuk-caption-xl | 35 | 34 | import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, commodity-extended-description, commodity-additional-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-approved-establishment, traders-addresses, search-existing-consignor, search-existing-consignee, importer, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, nominated-contacts, contact-address, transit-exit-bcp, common-user-charge, billing-select-address, billing-contact-details, catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details, decision-datetime-submit, ched-overview-replace-certificate, delete-notification-confirmation | govuk-!-font-weight-bold, govuk-caption-l |
| Caption xl | govuk-caption-xl | 0 | 1 | attachments-tab |  |
| Character count | govuk-character-count | 1 | 1 | documentary-check | govuk-js-character-count |
| Checkboxes | govuk-checkboxes | 4 | 4 | commodity-basic-description, transport-details, add-catch-certificate-details, decision-reason-for-refusal | govuk-checkboxes--conditional, govuk-checkboxes__conditional, govuk-checkboxes__conditional--hidden, govuk-checkboxes__input, govuk-checkboxes__item, govuk-checkboxes__label |
| Date input | govuk-date-input | 35 | 21 | notifications-dashboard, about-the-consignment, latest-health-certificate, accompanying-documents, transport-details, means-of-transport-after-bcp, transit-exit-bcp, add-catch-certificate-details, notification-search-view, attachments-tab, bip-notifications-dashboard, laboratory-test-setup, laboratory-test-results, decision-conclusion, decision-datetime-submit, record-decision-search, ov-notifications-dashboard, record-control, border-notification-create, border-notifications-dashboard, clone-search | date-input--picker, govuk-!-width-one-half, govuk-date-input__input, govuk-date-input__item, govuk-date-input__label, govuk-input--width-2, govuk-input--width-4, short-date-input |
| Details | govuk-details | 7 | 6 | accompanying-documents, goods-movement-services, common-user-charge, catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details | govuk-!-margin-bottom-8, govuk-!-margin-top-4, govuk-details__summary, govuk-details__summary-text, govuk-details__text |
| Error message | govuk-error-message | 4 | 5 | document-upload, transport-details, means-of-transport-after-bcp, attachments-tab, decision-datetime-submit | govuk-form-group--error |
| Error summary | govuk-error-summary | 5 | 7 | notifications-dashboard, document-upload, transport-details, means-of-transport-after-bcp, contact-details, notification-search-view, attachments-tab | govuk-error-summary__body, govuk-error-summary__list, govuk-error-summary__title |
| Fieldset | govuk-fieldset | 79 | 44 | notifications-dashboard, import-type, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, commodity-additional-details, latest-health-certificate, accompanying-documents, search-approved-establishment, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, transport-details, means-of-transport-after-bcp, goods-movement-services, search-existing-transporter, transporter-creation, contact-details, nominated-contacts, contact-address, branch-address-creation, transit-exit-bcp, catch-certificate-needed, add-catch-certificate-details, notification-search-view, attachments-tab, bip-notifications-dashboard, identity-physical-check, laboratory-test-required, laboratory-test-setup, laboratory-test-results, decision-conclusion, decision-reason-for-refusal, decision-datetime-submit, record-decision-search, ov-notifications-dashboard, record-control, border-notification-create, border-notifications-dashboard, clone-certificate-type, clone-search | govuk-!-margin-bottom-0, govuk-fieldset__heading, govuk-fieldset__legend, govuk-fieldset__legend--m, govuk-fieldset__legend--s, govuk-fieldset__legend--xl, govuk-visually-hidden |
| Fieldset legend | govuk-fieldset__legend | 1 | 1 | clone-certificate-type | govuk-label--m |
| File upload | govuk-file-upload | 2 | 3 | document-upload, attach-catch-certificate, attachments-tab | govuk-file-upload--error, govuk-file-upload--error (error state only) |
| Form group | govuk-form-group | 108 | 25 | notifications-dashboard, import-type, country-of-origin, search-commodity, select-risk-category, commodity-additional-details, document-upload, accompanying-documents, search-approved-establishment, consignor-creation, consignee-creation, means-of-transport-after-bcp, transporter-creation, nominated-contacts, branch-address-creation, billing-contact-details, attachments-tab, laboratory-test-required, laboratory-test-setup, override-risk-decision, border-notification-create, border-notification-review, border-notifications-dashboard, clone-certificate-type, clone-search | govuk-!-margin-bottom-0, govuk-form-group--error (error state only) |
| Grid | govuk-grid-row | 1 | 3 | notifications-dashboard, search-approved-establishment, border-notifications-dashboard | govuk-grid-column-full, govuk-grid-column-one-third, govuk-grid-column-two-thirds |
| Grid / layout | govuk-grid-row | 0 | 1 | review-notification | govuk-grid-column-full, govuk-grid-column-one-half |
| Heading |  | 2 | 1 | manage-your-authorisations |  |
| Heading | govuk-heading-l | 4 | 3 | catch-certificate-needed, clone-certificate-type, clone-search | govuk-!-margin-bottom-4, govuk-heading-s |
| Heading | govuk-heading-m | 27 | 10 | search-commodity, latest-health-certificate, importer, means-of-transport-after-bcp, decision-reason-for-refusal, decision-datetime-submit, bip-decision-confirmation, override-risk-decision, border-notification-confirmation, amend-notification-hub | govuk-!-margin-bottom-0, govuk-!-margin-top-2, govuk-!-margin-top-6, govuk-!-margin-top-7, govuk-heading-m, text-align-left |
| Heading | govuk-heading-s | 3 | 3 | accompanying-documents, decision-datetime-submit, bip-decision-confirmation | govuk-!-margin-bottom-0, govuk-!-margin-top-4 |
| Heading | govuk-heading-xl | 91 | 53 | import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, select-risk-category, health-certificate-required, commodity-additional-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, search-approved-establishment, traders-addresses, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, importer, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, nominated-contacts, contact-address, branch-address-creation, review-notification, declaration, transit-exit-bcp, common-user-charge, billing-contact-details, catch-certificate-needed, attach-catch-certificate, add-catch-certificate-details, bip-notifications-dashboard, documentary-check, identity-physical-check, laboratory-test-required, laboratory-test-setup, decision-reason-for-refusal, decision-datetime-submit, record-decision-search, override-risk-decision, ched-overview-replace-certificate, border-notification-create, border-notifications-dashboard, amend-notification-hub, delete-notification-confirmation, clone-certificate-type, clone-search | govuk-!-margin-bottom-4, govuk-!-margin-bottom-6, govuk-!-margin-top-5, govuk-!-margin-top-6, govuk-fieldset__heading, govuk-heading-l, govuk-heading-m, govuk-heading-s, govuk-heading-xl, heading-tertiary, heading-with-help |
| Heading | govuk-heading-xl / govuk-heading-m | 9 | 2 | commodity-extended-description, decision-conclusion | govuk-!-margin-bottom-0, govuk-!-margin-top-7 |
| Heading (l/m/s) | govuk-heading-l | 0 | 1 | notification-search-view | govuk-heading-l, govuk-heading-m, govuk-heading-s, govuk-heading-xl |
| Heading (m) | govuk-heading-m | 8 | 2 | notification-hub, bip-notification-hub | govuk-heading-m |
| Heading (M/S) | govuk-heading-m | 0 | 1 | notifications-dashboard | govuk-heading-s |
| Heading (xl) | govuk-heading-xl | 2 | 4 | notification-hub, notification-search-view, bip-notification-hub, ov-notifications-dashboard | govuk-heading-m, govuk-heading-s, govuk-heading-xl |
| Heading (XL) | govuk-heading-xl | 1 | 1 | notifications-dashboard |  |
| Heading l | govuk-heading-l | 0 | 1 | attachments-tab |  |
| Heading L | govuk-heading-l | 2 | 1 | laboratory-test-results |  |
| Heading m | govuk-heading-m | 3 | 2 | attachments-tab, border-notification-review |  |
| Heading M | govuk-heading-m | 1 | 1 | laboratory-test-results |  |
| Heading xl | govuk-heading-xl | 1 | 2 | attachments-tab, border-notification-review | govuk-!-margin-top-5 |
| Heading XL | govuk-heading-xl | 1 | 1 | laboratory-test-results |  |
| Hint | govuk-hint | 80 | 26 | notifications-dashboard, origin-of-import, commodity-basic-description, about-the-consignment, traders-addresses, importer, transport-details, means-of-transport-after-bcp, goods-movement-services, contact-details, contact-address, transit-exit-bcp, billing-contact-details, add-catch-certificate-details, notification-search-view, bip-notifications-dashboard, laboratory-test-required, laboratory-test-setup, laboratory-test-results, decision-conclusion, decision-datetime-submit, record-decision-search, ov-notifications-dashboard, record-control, border-notification-create, clone-search | govuk-!-font-size-27, govuk-!-margin-bottom-0, govuk-!-margin-bottom-6, govuk-!-margin-top-0, govuk-radios__hint, govuk-visually-hidden |
| Input | govuk-input | 44 | 7 | means-of-transport-after-bcp, branch-address-creation, transit-exit-bcp, notification-search-view, attachments-tab, bip-notifications-dashboard, record-decision-search | govuk-!-width-one-half, govuk-input--width-2, govuk-input--width-4 |
| Inset text | govuk-inset-text | 5 | 5 | latest-health-certificate, confirmation, attach-catch-certificate, add-catch-certificate-details, delete-notification-confirmation |  |
| Label | govuk-label | 183 | 30 | notifications-dashboard, import-type, country-of-origin, origin-of-import, search-commodity, commodity-basic-description, about-the-consignment, commodity-extended-description, document-upload, search-approved-establishment, consignor-creation, search-existing-consignee, consignee-creation, means-of-transport-after-bcp, search-existing-transporter, transporter-creation, branch-address-creation, transit-exit-bcp, billing-select-address, billing-contact-details, attachments-tab, bip-notifications-dashboard, laboratory-test-setup, laboratory-test-results, record-decision-search, ov-notifications-dashboard, record-control, border-notification-create, border-notifications-dashboard, clone-search | govuk-!-display-inline-block, govuk-!-font-weight-bold, govuk-checkboxes__label, govuk-date-input__label, govuk-label--m, govuk-label--s, govuk-label--xl, govuk-radios__label |
| Label | govuk-label--s | 3 | 1 | transporter |  |
| Link | govuk-link | 176 | 55 | notifications-dashboard, origin-of-import, search-commodity, notification-hub, commodity-additional-details, latest-health-certificate, document-upload, accompanying-documents, approved-establishment-of-origin, traders-addresses, search-existing-consignor, consignor-creation, consignor-confirmation, search-existing-consignee, consignee-creation, consignee-confirmation, importer, transport-details, means-of-transport-after-bcp, goods-movement-services, transporter, search-existing-transporter, transporter-creation, transporter-confirmation, nominated-contacts, contact-address, branch-address-creation, review-notification, confirmation, common-user-charge, billing-select-address, billing-contact-details, catch-certificate-needed, attach-catch-certificate, attachments-tab, bip-notifications-dashboard, bip-notification-hub, documentary-check, identity-physical-check, laboratory-test-required, laboratory-test-setup, decision-conclusion, decision-reason-for-refusal, decision-datetime-submit, bip-decision-confirmation, record-decision-search, override-risk-decision, ched-overview-replace-certificate, ov-notifications-dashboard, border-notification-create, border-notification-review, border-notifications-dashboard, amend-notification-hub, delete-notification-confirmation, clone-search | ellipsis, govuk-!-font-size-19, govuk-!-font-weight-regular, govuk-!-margin-bottom-0, govuk-link govuk-!-font-size-19, govuk-link--no-visited-state, govuk-task-list__link, link-button |
| List | govuk-list | 10 | 12 | notifications-dashboard, document-upload, accompanying-documents, attach-catch-certificate, notification-search-view, attachments-tab, documentary-check, identity-physical-check, decision-reason-for-refusal, decision-datetime-submit, bip-decision-confirmation, clone-certificate-type | govuk-!-margin-left-5, govuk-!-padding-left-8, govuk-list--bullet |
| List (bullet) | govuk-list govuk-list--bullet | 1 | 1 | bip-notification-hub | govuk-!-margin-left-5 |
| Lists (within Details body copy) | govuk-list | 3 | 1 | goods-movement-services | govuk-list--bullet, govuk-list--number |
| Notification banner | govuk-notification-banner | 10 | 10 | notifications-dashboard, latest-health-certificate, confirmation, notification-search-view, bip-notifications-dashboard, bip-notification-hub, documentary-check, identity-physical-check, record-decision-search, ov-notifications-dashboard | govuk-!-margin-bottom-0, govuk-notification-banner--success, govuk-notification-banner__content, govuk-notification-banner__content (with custom notification-banner__content--full-width), govuk-notification-banner__header, govuk-notification-banner__heading, govuk-notification-banner__link, govuk-notification-banner__title, notification-banner--alert, notification-banner--green, notification-banner--inspection-required, notification-banner--warning, notification-banner__content--full-width |
| Panel | govuk-panel | 7 | 7 | consignor-confirmation, consignee-confirmation, transporter-confirmation, branch-address-confirmation, confirmation, bip-decision-confirmation, border-notification-confirmation | govuk-!-margin-bottom-8, govuk-!-margin-top-8, govuk-!-padding-bottom-4, govuk-panel--confirmation, govuk-panel__title, panel--inspection-not-required, panel--inspection-required |
| Radios |  | 5 | 3 | are-you-a-plants-importer-or-agency, which-company-is-this-notification-for, who-are-you-creating-this-notification-for |  |
| Radios | govuk-radios | 39 | 20 | import-type, origin-of-import, commodity-basic-description, about-the-consignment, select-risk-category, commodity-additional-details, transport-details, goods-movement-services, contact-address, transit-exit-bcp, catch-certificate-needed, documentary-check, identity-physical-check, laboratory-test-required, laboratory-test-results, decision-conclusion, decision-datetime-submit, record-control, border-notification-create, clone-certificate-type | govuk-radios--conditional, govuk-radios__conditional, govuk-radios__conditional--hidden, govuk-radios__divider, govuk-radios__hint, govuk-radios__input, govuk-radios__item, govuk-radios__label |
| Radios conditional reveal | govuk-radios__conditional | 1 | 1 | laboratory-test-setup | govuk-radios__conditional--hidden |
| Section break | govuk-section-break | 41 | 10 | commodity-extended-description, search-approved-establishment, search-existing-consignor, search-existing-consignee, transporter, search-existing-transporter, review-notification, confirmation, notification-search-view, ched-overview-replace-certificate | govuk-!-margin-bottom-4, govuk-section-break--l, govuk-section-break--visible |
| Select | govuk-select | 79 | 29 | notifications-dashboard, country-of-origin, origin-of-import, commodity-basic-description, about-the-consignment, commodity-extended-description, accompanying-documents, search-approved-establishment, consignor-creation, consignee-creation, transport-details, means-of-transport-after-bcp, transporter-creation, branch-address-creation, transit-exit-bcp, billing-select-address, add-catch-certificate-details, notification-search-view, attachments-tab, bip-notifications-dashboard, laboratory-test-setup, decision-conclusion, decision-reason-for-refusal, record-decision-search, ov-notifications-dashboard, record-control, border-notification-create, border-notifications-dashboard, clone-search | govuk-!-margin-bottom-6, govuk-!-width-full, govuk-!-width-one-half, govuk-!-width-one-third, type-of-package |
| Select / combobox |  | 1 | 1 | choose-your-organisation |  |
| Spacing utilities | govuk-!-margin-* | 0 | 1 | review-notification | govuk-!-margin-0, govuk-!-margin-bottom-0, govuk-!-margin-bottom-1, govuk-!-margin-bottom-9, govuk-!-margin-top-9, govuk-!-width-one-quarter, govuk-!-width-one-third |
| Summary list | govuk-summary-list | 8 | 8 | commodity-extended-description, review-notification, confirmation, common-user-charge, add-catch-certificate-details, notification-search-view, laboratory-test-results, border-notification-review | govuk-!-margin-bottom-1, govuk-!-width-one-third, govuk-summary-list--no-border, govuk-summary-list__actions, govuk-summary-list__key, govuk-summary-list__row, govuk-summary-list__row--no-border, govuk-summary-list__value, govuk-summary-list__value-right |
| Table | govuk-table | 87 | 17 | commodity-basic-description, commodity-extended-description, approved-establishment-of-origin, search-approved-establishment, traders-addresses, search-existing-consignor, search-existing-consignee, importer, transporter, search-existing-transporter, nominated-contacts, review-notification, notification-search-view, bip-notification-hub, decision-datetime-submit, ched-overview-replace-certificate, border-notification-review | govuk-!-margin-bottom-0, govuk-!-margin-bottom-2, govuk-!-margin-bottom-4, govuk-!-margin-top-4, govuk-!-margin-top-6, govuk-!-width-quarter, govuk-table__body, govuk-table__caption, govuk-table__caption--m, govuk-table__cell, govuk-table__cell--numeric, govuk-table__head, govuk-table__header, govuk-table__header--half, govuk-table__header--numeric, govuk-table__row, govuk-visually-hidden (caption) |
| Table / list |  | 1 | 1 | manage-your-authorisations |  |
| Tabs | govuk-tabs | 2 | 3 | search-commodity, notification-search-view, ched-overview-replace-certificate | govuk-tabs__list, govuk-tabs__list-item, govuk-tabs__list-item--selected, govuk-tabs__panel, govuk-tabs__panel--hidden, govuk-tabs__tab, govuk-tabs__tab--selected, govuk-tabs__title |
| Tag | govuk-tag | 81 | 12 | notifications-dashboard, notification-hub, notification-search-view, bip-notifications-dashboard, bip-notification-hub, decision-reason-for-refusal, decision-datetime-submit, record-decision-search, ched-overview-replace-certificate, ov-notifications-dashboard, border-notifications-dashboard, amend-notification-hub | govuk-!-margin-right-2, govuk-tag--blue, govuk-tag--green, govuk-tag--grey, govuk-tag--magenta, govuk-tag--orange, govuk-tag--red, govuk-tag--yellow, status-label, tag, tag--fixed-width |
| Task list | govuk-task-list | 8 | 2 | notification-hub, amend-notification-hub | govuk-task-list__item, govuk-task-list__item--with-link, govuk-task-list__link, govuk-task-list__name-and-hint, govuk-task-list__status |
| Text input | govuk-input | 133 | 31 | notifications-dashboard, origin-of-import, search-commodity, about-the-consignment, commodity-extended-description, latest-health-certificate, accompanying-documents, search-approved-establishment, search-existing-consignor, consignor-creation, search-existing-consignee, consignee-creation, transport-details, goods-movement-services, search-existing-transporter, transporter-creation, contact-details, nominated-contacts, billing-contact-details, add-catch-certificate-details, identity-physical-check, laboratory-test-setup, laboratory-test-results, decision-conclusion, decision-reason-for-refusal, decision-datetime-submit, ov-notifications-dashboard, record-control, border-notification-create, border-notifications-dashboard, clone-search | govuk-!-width-full, govuk-!-width-one-half, govuk-!-width-one-quarter, govuk-!-width-one-third, govuk-!-width-three-quarters, govuk-!-width-two-thirds, govuk-input--width-2, govuk-input--width-20, govuk-input--width-3, govuk-input--width-4, govuk-label, govuk-label--s, net-weight, number-of-packages |
| Textarea | govuk-textarea | 3 | 3 | documentary-check, laboratory-test-results, record-control | govuk-!-width-one-half |
| Visually hidden | govuk-visually-hidden | 20 | 9 | search-approved-establishment, search-existing-consignee, importer, transporter, search-existing-transporter, nominated-contacts, review-notification, transit-exit-bcp, border-notification-review |  |
| Warning text | govuk-warning-text | 7 | 8 | latest-health-certificate, traders-addresses, importer, review-notification, confirmation, common-user-charge, notification-search-view, ched-overview-replace-certificate | govuk-warning-text__icon, govuk-warning-text__text |

## Non-standard patterns

Every canonical per-page record is reproduced. Similar patterns remain page-specific when their evidence or concern differs.

### notifications-dashboard

#### notification-list, notification-list__row, notification-list__row-container, notification-list__value, notification-list__heading, notification-list__links, notification-list__grid-column-20/25/30, notification-button

- What it does: Bespoke card/list widget. Each notification is rendered as a definition list (Reference number, Commodity, Arrival at BCP or POE, CHED status, Consignee, Consignor, Origin, Inspection) with per-card action buttons/links (Copy as new, View details, Amend, Show notification).
- Concern: Custom IPAFFS markup and its own 20/25/30 column grid, outside the govuk grid. High-effort bespoke component; not a Design System pattern.
- GOV.UK alternative: GOV.UK Summary card (govuk-summary-card) wrapping a Summary list, or a govuk Table for a denser list view.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt; refs e324-e537

#### search-panel, search-filter-form, search-hidden, hidden-search (button)

- What it does: Collapsible advanced-search filter panel containing the keyword/commodity/BCP/status/country/consignee/type/microchip/date-range filters and Search/Clear actions.
- Concern: Bespoke show/hide panel with a custom toggle button ('hidden-search'), not a Design System disclosure.
- GOV.UK alternative: GOV.UK Details (govuk-details) for progressive disclosure, or a plain always-visible filter section; the fields inside are already standard govuk-input/select.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt; refs e208-e307

#### defra-datepicker, date-input--picker, date-picker__container, date-picker__dialog, date-picker__date-table, date-picker__button__next-month/previous-month/close, date-picker__reveal__icon, date-picker-day/month/year

- What it does: Custom DEFRA calendar-overlay date picker layered on top of the govuk-date-input Day/Month/Year fields (the 'Choose date' button + ❮ ❯ month navigation).
- Concern: There is no GOV.UK Design System date picker; this is a bespoke JS widget with its own dialog, table and navigation. Adds maintenance and a11y burden.
- GOV.UK alternative: Plain govuk-date-input (Day/Month/Year text fields) with no calendar overlay is the Design System stance; a date picker is a deliberate non-standard addition.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt; refs e277-e302

#### info-summary, info-summary__title, info-summary__body, info-summary__list

- What it does: Renders the 'Information' and 'Chosen for inspection' summary boxes (message list + call-to-action links).
- Concern: Bespoke component visually mimicking govuk-error-summary but for informational content; not a Design System component.
- GOV.UK alternative: GOV.UK Notification banner (govuk-notification-banner) for the informational/success variant, or Inset text.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt; refs e162-e184

#### pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: Bespoke pager under the notification list ('Next page', '2 of 4000').
- Concern: Custom pagination markup predating (or ignoring) the Design System Pagination component.
- GOV.UK alternative: GOV.UK Pagination (govuk-pagination) — now a first-class Design System component.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt

#### notification-banner--alert, notification-banner__content--full-width

- What it does: Custom modifier on the govuk notification banner to render the red/alert message list full width.
- Concern: Non-standard modifier extending a govuk component beyond its documented variants (govuk banner has only default/success).
- GOV.UK alternative: Standard govuk-notification-banner (default variant) per message type; or Error summary styling for genuine alerts.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt; refs e50-e161

#### link-button, notification-button, button (bare), clear-link, tag--fixed-width

- What it does: Assorted custom button/link/tag classes: links styled as buttons, bare <button> without govuk-button, a 'Clear' link variant, fixed-width status tags.
- Concern: Mixes native/custom buttons with govuk-button; inconsistent control styling.
- GOV.UK alternative: govuk-button / govuk-button--secondary for actions; govuk-link for links; govuk-tag for status.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt

#### sr-only, aria-live-message, search-hidden

- What it does: sr-only is a visually-hidden helper duplicating govuk-visually-hidden; aria-live-message is a custom live-region for announcements.
- Concern: Minor: sr-only duplicates an existing govuk utility already present on the page (govuk-visually-hidden).
- GOV.UK alternative: govuk-visually-hidden utility class.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 10 nonstd.txt

### country-of-origin

#### (none)

- What it does: The country-of-origin page is built entirely from GOV.UK Design System classes. main [class] returned only govuk-* classes (govuk-grid-row, govuk-grid-column-full, govuk-caption-xl, govuk-heading-xl, govuk-form-group, govuk-label, govuk-label--m, govuk-select, govuk-button, and the govuk-! override utilities). The filter for non-govuk classes returned nothing.
- Concern: No concern — this page is 100% inside the govuk-frontend toolbox and maps cleanly onto a Select component. Note the country dropdown is a plain native <select> (govuk-select), NOT the accessible-autocomplete widget IPAFFS uses elsewhere; the new app can use a govuk Select or add accessible-autocomplete progressive enhancement.
- GOV.UK alternative: govuk-frontend Select (already in use)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 14 (non-govuk class filter returned 'ALL GOVUK')

### origin-of-import

#### region-code-box

- What it does: Custom container class on the conditional-reveal wrapper that holds the 'Enter the region code' text input (shown when region-of-origin = Yes).
- Concern: Bespoke class layered on top of the standard govuk-radios__conditional reveal. Cosmetic; not a Design System class.
- GOV.UK alternative: govuk-radios__conditional (already present) — the box styling can be dropped; the standard conditional reveal covers the behaviour.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 17

#### region-code-divider

- What it does: Custom divider element inside the region-code conditional reveal.
- Concern: Bespoke IPAFFS class, no Design System equivalent used here; purely visual separation.
- GOV.UK alternative: None needed — standard conditional reveal does not require a divider.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 17

#### conform-uk-regulations (used as a CSS class, not just an id)

- What it does: The field id 'conform-uk-regulations' also appears as a class token on an element in the conform question markup.
- Concern: Non-govuk class name (an id reused as a class hook). Minor; likely a JS/styling hook. Does not change component behaviour.
- GOV.UK alternative: No custom class needed — standard Radios covers this.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 17

#### back-link--next-to-breadcrumbs

- What it does: Custom modifier on the GOV.UK back link to position it alongside breadcrumb/dashboard navigation.
- Concern: Bespoke layout modifier outside govuk-frontend.
- GOV.UK alternative: Use the standard govuk-back-link in the normal content position, or a standard breadcrumbs component where hierarchical navigation is needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 17; Back link class is 'govuk-back-link back-link--next-to-breadcrumbs'

### search-commodity

#### button.link-button

- What it does: The whole commodity tree is built from bespoke 'link-button' elements — each chapter row is a pair of <button class="link-button"> (one for the 2-digit chapter code, one with the added class 'commodity-description-link' for the description). Clicking one drills into that HS chapter.
- Concern: Buttons styled to look/behave like links, outside the Design System. In the a11y tree they surface as bare buttons with no grouping semantics. High volume (72 buttons on the top level: two for each of 36 chapters). The new app should not reproduce this custom widget verbatim.
- GOV.UK alternative: Reference data drives this; a govuk-frontend rebuild could use standard links (govuk-link) or the Button component, or replace the whole browse tree with an accessible-autocomplete on the commodity code sourced from a reference-data service.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 19 (class inventory + structure eval)

#### commodity-tree / commodity-list / commodity-code-box / commodity-description-link / commodity-description-links-container / commodity-selection-breadcrumb / all-sections-link

- What it does: Bespoke commodity-browser widget: a navigable HS-code tree with a breadcrumb (commodity-selection-breadcrumb), an 'All commodities' reset link (all-sections-link), and per-node code/description boxes.
- Concern: Entirely IPAFFS-specific markup with no Design System equivalent. It couples presentation to the tariff hierarchy and is the main way a user picks a commodity when they do not already know the code.
- GOV.UK alternative: No direct DS component. The new app should treat commodity selection as reference-data-backed search (autocomplete on code/description) rather than porting the tree; a Summary list / Table could show the chosen commodity afterwards.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 19 (class inventory)

#### search-panel / box-margin / commodity-description-links-container

- What it does: Custom layout/spacing wrappers around the search box and the tree.
- Concern: Custom CSS layer instead of govuk spacing/grid utilities.
- GOV.UK alternative: govuk grid + spacing override utilities (govuk-!-margin-*) already cover this.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 19 (class inventory)

#### govuk-tabs used to split 'Commodity code search' vs 'Species search'

- What it does: The GOV.UK Tabs component is used to switch between two different commodity search methods on the same page.
- Concern: Tabs are documented for splitting related content into sections, not for switching input methods/forms. Using them to toggle which form is active is a slightly non-standard application of the component (the panel content is a form, not passive content).
- GOV.UK alternative: Radios ('How do you want to find the commodity?') revealing the relevant search control, or two distinct pages, would be more idiomatic in a govuk-frontend rebuild.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 19 (govuk-tabs classes + tab labels)

### commodity-basic-description

#### commodity-type

- What it does: Custom class on the wrapper div around the 'Type of commodity' select form-group
- Concern: Bespoke IPAFFS class, not part of the Design System. Likely just a JS/CSS hook for the commodity-type dependent behaviour (type options + species list are driven off the selected commodity code).
- GOV.UK alternative: None needed - the underlying control is a standard govuk-select in a govuk-form-group; the hook can be dropped or replaced with a data attribute in the rebuild.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 24 (class inventory)

#### table-responsive

- What it does: Custom wrapper class around the govuk-table giving it horizontal-scroll/responsive behaviour on small screens
- Concern: Not a Design System class - IPAFFS-specific responsive-table treatment. The GOV.UK Table component does not ship a responsive-scroll wrapper.
- GOV.UK alternative: GOV.UK Table inside an overflow-x scroll container (standard pattern) if horizontal scroll is required; the summary here is only two columns so a plain govuk-table (or a Summary list) would suffice.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 24 (class inventory)

#### back-link--next-to-breadcrumbs

- What it does: Custom modifier on the GOV.UK back link to position it alongside service navigation.
- Concern: Bespoke layout modifier outside govuk-frontend.
- GOV.UK alternative: Use the standard govuk-back-link in the normal content position.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 24; Back link class is 'govuk-back-link back-link--next-to-breadcrumbs'

### about-the-consignment

#### defra-datepicker / date-picker__container / date-picker__dialog / date-picker__date-table / date-picker__button__* / date-input--picker (data-module="accessible-datepicker")

- What it does: A bespoke DEFRA JavaScript calendar-picker overlay bolted onto the govuk-date-input Day/Month/Year fields, with a 'Choose date' reveal button, a modal dialog and a month grid table
- Concern: The GOV.UK Design System deliberately has NO date-picker component; this is a custom widget (extra JS, a modal, a <table role=presentation> calendar) layered over the standard date input. It is the single biggest non-standard surface on the page and carries its own accessibility and maintenance burden.
- GOV.UK alternative: Plain govuk-date-input (three text fields Day/Month/Year) with no picker overlay — the underlying inputs are already standard govuk-date-input markup.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 27 (main.html)

#### link-button (id=add-another-country, type=submit, name=action value=transit-third-countries-add)

- What it does: An 'Add another country' control styled to look like a link but is actually a form submit that posts back to add another transited-country select (multi-value transit routing)
- Concern: Custom class, not a Design System component; a link-styled submit button is a bespoke pattern. In the new app this repeat/add-another behaviour would be a deliberate design decision.
- GOV.UK alternative: GOV.UK 'Add another' pattern (govuk-button--secondary) or a standard secondary button; the add-another pattern is documented in the Design System.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 27 (main.html)

#### purpose / internal-market (marker classes on radio items and form groups)

- What it does: IPAFFS-specific hook classes used to scope JS / styling to the purpose and internal-market groups
- Concern: Non-Design-System marker classes; cosmetically harmless but indicate bespoke client wiring around the conditional reveals.
- GOV.UK alternative: Not needed — govuk-radios--conditional handles the reveal natively via data-module=govuk-radios and aria-controls.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 27 (main.html)

#### sr-only / hidden / aria-live-message

- What it does: sr-only is a visually-hidden helper used by the custom datepicker; 'hidden' hides the visually-hidden time legend; aria-live-message announces datepicker changes
- Concern: GOV.UK uses govuk-visually-hidden; the page mixes both govuk-visually-hidden and a bespoke sr-only, plus a non-govuk 'hidden' utility — inconsistent visibility utilities that come from the custom datepicker code.
- GOV.UK alternative: govuk-visually-hidden for all visually-hidden content.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 27 (main.html)

### select-risk-category

#### back-link--next-to-breadcrumbs (on a.govuk-back-link, href="#", id="back-link")

- What it does: Custom modifier positioning the Back link next to breadcrumbs; the link points at href="#" and is wired up by client-side JS rather than being a real server-rendered previous-page href.
- Concern: Non-govuk modifier class plus a JS-driven back link. The new app should use a standard GOV.UK Back link with a real server-side href to the previous page, not a JS hash link.
- GOV.UK alternative: Back link component with a genuine href to the previous step.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 29 (back-link outerHTML)

#### <input type="hidden" name="highest-risk-category" value="High">

- What it does: Hidden field carrying the system-computed highest risk category across the commodities on the consignment. Observed value 'High' in BOTH the High-risk and the Medium-risk trace, so it reflects the commodities' computed maximum, independent of which radio the user picks.
- Concern: Not a govuk component but a load-bearing requirement: IPAFFS pre-computes a highest-risk-category server-side and posts it back. The rebuild must decide whether the risk category is user-selected, system-derived, or a user override of a system default — the page title says 'Select the highest' yet the system already knows the computed highest.
- GOV.UK alternative: n/a (data-carrying hidden input, not a visual component)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 29 (controls29); trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 27 (hidden still 'High' while user selects Medium)

#### Empty <legend class="govuk-fieldset__legend">

- What it does: The fieldset legend is rendered empty; the visible question is carried entirely by the H1 above the form.
- Concern: Radios sit in a fieldset with no legend text. GOV.UK pattern for a single question per page is legend-as-page-heading (legend contains the H1). Empty legend is a minor accessibility deviation — the fieldset has no accessible name.
- GOV.UK alternative: Radios with the question as the fieldset legend styled as the page heading (govuk-fieldset__legend--xl wrapping an h1).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 29 (main.html)

### health-certificate-required

#### back-link--next-to-breadcrumbs (custom modifier on govuk-back-link) with href="#"

- What it does: IPAFFS-specific positioning modifier; the Back link points at '#' and relies on client-side JS to go back in history
- Concern: Custom CSS modifier outside the Design System, plus a JS-dependent back link that does nothing without JavaScript. The new app should use a real href (govuk Back link with a server-known previous URL) rather than href='#' + JS.
- GOV.UK alternative: govuk Back link with a genuine href to the previous page
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 31

### notification-hub

#### phase-tag

- What it does: A legacy IPAFFS class applied alongside govuk-tag on every task-list status indicator (e.g. class="govuk-tag phase-tag govuk-tag--blue").
- Concern: Not part of the GOV.UK Design System. It is redundant styling carried over from IPAFFS's older phase-banner tag styling and layered onto the modern govuk-tag. The rebuild should drop 'phase-tag' entirely and rely on plain govuk-tag colour modifiers.
- GOV.UK alternative: govuk-tag with colour modifier (govuk-tag--blue / govuk-tag--grey / govuk-tag--green) — no custom class needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 32

#### govuk-task-list__status renders 'Started' as a blue tag and 'To do' as a grey tag

- What it does: IPAFFS wraps both status values observed in these traces in coloured govuk-tag elements: 'Started' uses govuk-tag--blue and 'To do' uses govuk-tag--grey.
- Concern: The traces do not show a completed state, so they cannot support the former claim that every possible state is rendered as a tag. Preserve the two observed treatments unless broader evidence establishes the complete status vocabulary.
- GOV.UK alternative: Use the GOV.UK task-list status treatment appropriate to each evidenced state; do not infer an unobserved completed-state treatment from these traces.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 32; trace 0a6f82fcd63c4cd83fcab91687b522f3f865a74e action 33

### commodity-extended-description

#### commodity-detail-form-desktop / commodity-detail-form-mobile, commodities-table-desktop / commodities-table-mobile, species-table-desktop / species-table-mobile, table-responsive

- What it does: The ENTIRE commodity form (commodities table + species/weights grid + totals + gross weight + buttons) is rendered TWICE in the DOM — a '-desktop' copy and a '-mobile' copy — one hidden per breakpoint via CSS. Every control therefore exists twice with duplicate name attributes (e.g. two inputs named '0204100010-1736900.net-weight', ids suffixed '-desktop' / '-mobile').
- Concern: This is a bespoke responsive strategy that duplicates form controls and shares name attributes across two DOM subtrees. It is fragile, doubles the accessibility surface, and is not how the GOV.UK Design System handles responsive tables. The new app should render each control once and use responsive CSS (or the GOV.UK responsive table pattern) rather than duplicating the form.
- GOV.UK alternative: A single form. For the weights grid, either the standard GOV.UK Table with a stacked-on-mobile CSS treatment, or individual field pages per the 'one thing per page' pattern.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 35 (control inventory shows -desktop and -mobile duplicates of net-weight, num-packages, package-type, gross-weight)

#### link-button

- What it does: The duplicated 'Add commodity' controls are a mobile <input type=submit> and a desktop <button type=submit>, both styled to look like text links.
- Concern: Submit controls dressed as links are non-standard and the two responsive copies use different HTML elements for the same action.
- GOV.UK alternative: govuk-button with govuk-button--secondary, or a real link if it navigates.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 35

#### Two js-hidden 'Keyboard submit' controls

- What it does: Each responsive form starts with a hidden submit control labelled 'Keyboard submit': an <input type=submit> in the mobile form and a <button type=submit> in the desktop form.
- Concern: Bespoke hidden affordances control which action fires on Enter in each duplicated form.
- GOV.UK alternative: Standard button ordering / a single primary submit; no hidden helper button needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 35 (structure outline: BUTTON.js-hidden :: Keyboard submit)

#### species-table-cheda

- What it does: A CHED-A-specific styling class present in the markup even on this CHED-P page.
- Concern: The commodity/species table markup is shared across CHED types and carries CHED-A-flavoured classes. Cross-CHED coupling in a single template; the new per-type app should not inherit sibling-CHED classes.
- GOV.UK alternative: n/a — this is a code-organisation smell, not a component choice.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 35 (class inventory)

#### commodity-overview, subheader, subtotal, net-weight, number-of-packages, type-of-package, species, remove, border-bottom-none

- What it does: IPAFFS-specific classes are present on the commodity tables, cells and controls. In this snapshot the two cells carrying class 'remove' are empty and contain no remove control.
- Concern: The trace confirms bespoke hooks and live total UI, but class names alone do not prove which hooks drive JavaScript. Check CSS and scripts before removing them; do not infer row-removal behaviour from the empty 'remove' cells.
- GOV.UK alternative: Retain the evidenced table and summary-list behaviour while replacing bespoke hooks only after their CSS/JavaScript dependencies are understood.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 35 (class inventory)

### commodity-additional-details

#### class="temperature" (non-govuk class on two elements in main)

- What it does: IPAFFS-specific CSS/JS hook applied to both the govuk-form-group wrapper and the govuk-radios element for the temperature block
- Concern: The trace confirms two occurrences of the custom hook but does not establish whether it is cosmetic or functional. Preserve its observed placement until CSS and JavaScript dependencies are checked.
- GOV.UK alternative: Use the standard Radios + Fieldset markup if dependency analysis confirms the bespoke hook has no functional role.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 38 (class inventory: "govuk-form-group temperature" and "govuk-radios temperature")

### latest-health-certificate

#### additional-documents-table / additional-documents__grid-row / additional-documents__grid-column-15 / __grid-column-35 / __grid-column-doc-date / additional-documents__headers / additional-documents__table-header / additional-documents__caption

- What it does: A bespoke CSS-grid 'table' laying out the document row in columns (Document type | Document reference | Date of issue | Attachments) with a header row. It is NOT a real GOV.UK Table or a <table> element — it is a grid of divs.
- Concern: IPAFFS-specific layout widget. The header labels ('Document type', 'Document reference', 'Date of issue', 'Attachments') are column headers rendered once, and each field sits under its column with no per-field visible <label> — the inputs rely on aria-label instead. This is a single-row 'table' for one fixed document type (Veterinary health certificate), so the tabular framing is arguably unnecessary.
- GOV.UK alternative: For one document this is just a small form: a Text input (Document reference) + Date input (Document issue date) + file-upload flow, each with a proper visible label, no table needed. If multiple documents were ever listed, GOV.UK Summary list or Table with rows would be the standard choice.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 41 (main41.html)

#### date-input--picker / defra-datepicker / date-picker__container / date-picker__dialog / date-picker__reveal__icon / date-picker__date-table / date-picker__button__previous-month / __next-month / __close / date-picker-day/month/year / data-module="accessible-datepicker"

- What it does: A custom JavaScript calendar datepicker (DEFRA 'accessible-datepicker' module) layered on top of the standard govuk-date-input Day/Month/Year fields. Adds a 'Choose date' icon button that opens a dialog (role=dialog, aria-modal) with month navigation and a date grid.
- Concern: Not part of the GOV.UK Design System. The Design System deliberately does NOT ship a calendar datepicker and recommends the plain Day/Month/Year date input for known dates. This is bespoke JS + markup to maintain, with its own dialog/aria-live accessibility surface.
- GOV.UK alternative: GOV.UK Date input (govuk-date-input) alone — the three text fields Day/Month/Year — with no calendar overlay. The new app should drop the datepicker and keep the plain date input.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 41 (main41.html)

#### link-button / no-wrap (button#add-attachment-latest-health-cert)

- What it does: 'Add attachment' is a submit button styled to look like a link (link-button) that POSTs the form with add-attachment-latest-health-cert=latest-vet-health, navigating to the 'Upload a document' page. After upload it is replaced by a filename link (accessible name 'View {filename}') plus 'Remove attachment' / 'Remove row' controls.
- Concern: Custom link-styled button rather than a standard govuk-button or a govuk-link. Behaviour (submit-to-navigate) is a link's job.
- GOV.UK alternative: A GOV.UK Button (secondary) or a standard link to the upload page. The upload itself should use the GOV.UK File upload component.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 41; upload target trace 0a6f82fcd63c4cd83fcab91687b522f3f865a74e actions 45-47

#### latest-health-certificate-text__input / latest-health-certificate-date__input / latest-health-certificate__date-picker / latest-health-certificate__add-document-attachment / aria-live-message / sr-only

- What it does: IPAFFS-specific styling/behaviour hooks on the reference input, date inputs, datepicker container and attachment cell; sr-only / aria-live-message are custom screen-reader helpers (Design System uses govuk-visually-hidden).
- Concern: Bespoke class hooks and a non-standard visually-hidden class (sr-only) duplicating govuk-visually-hidden. Minor, but part of the drift away from the toolbox.
- GOV.UK alternative: govuk-visually-hidden for screen-reader-only text; no bespoke per-field hook classes needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 41 (main41.html)

### document-upload

#### <div data-module="dropzone"> wrapping the govuk-file-upload input

- What it does: IPAFFS-specific client-side JS module that turns the plain file input into a drag-and-drop dropzone (progressive enhancement). The markup itself uses only govuk-* classes; the enhancement is driven by the data-module="dropzone" hook, not a Design System feature.
- Concern: Not part of the GOV.UK Design System. The Design System file upload is a plain input with no drag-and-drop. The rebuild does not need to replicate the dropzone; the standard govuk File upload (or the newer JS-enhanced multiple-file variant) covers the requirement. Only reproduce drag-and-drop if it is a deliberate UX requirement.
- GOV.UK alternative: GOV.UK File upload component (govuk-file-upload) — used as-is without the custom dropzone module.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 45 (main HTML: div data-module="dropzone")

### accompanying-documents

#### additional-documents-table, additional-documents__grid-row, additional-documents__headers, additional-documents__table-header, additional-documents__grid-column-15, additional-documents__grid-column-35, additional-documents__grid-column-doc-date

- What it does: A bespoke CSS-grid layout that renders the list of added documents plus the inline add-document editor as a tabular grid with columns: Document type, Document reference, Date of issue, Attachments.
- Concern: Not a GOV.UK component — hand-rolled grid/table markup and CSS. Mixes data display and an inline editable row in one custom widget; hard to make accessible and inconsistent with the Design System.
- GOV.UK alternative: GOV.UK Summary list (to display added documents) combined with the 'Add another' pattern, or a govuk Table for the list plus a normal fieldset form for adding one document.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 49 (main.html)

#### link-button, no-wrap, additional-documents__add-another-document, additional-documents__add-document-attachment

- What it does: Submit buttons styled to look like text links: "Add attachment" (name=add-attachment), "Add a document" (name=add-additional-document), "Add multiple documents" (name=add-multiple-documents). Each is a real form submit that re-renders the page server-side.
- Concern: "Button that looks like a link" is not a Design System style; GOV.UK provides no link-button variant. Behaviour is server round-trip per add, not client-side row cloning.
- GOV.UK alternative: The GOV.UK 'Add another' pattern with a secondary Button (govuk-button--secondary), or standard links where navigation (not submission) is intended.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 49 (main.html)

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__reveal__icon, date-picker__date-table, date-picker__button__previous-month/next-month/close, date-input--picker, data-module="accessible-datepicker"

- What it does: A custom JavaScript calendar date-picker overlay layered on top of the standard govuk-date-input day/month/year fields, opened by a "Choose date" calendar icon button; renders a modal dialog with a month grid.
- Concern: Bespoke/third-party widget, not part of govuk-frontend. GDS guidance is to NOT use a calendar picker for known dates — the plain three-field Date input is preferred. Adds JS, accessibility and maintenance burden.
- GOV.UK alternative: Plain GOV.UK Date input (day/month/year text fields) with no calendar overlay.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 49 (main.html)

#### additional-documents__date-of-issue-hint, additional-documents__date-of-issue-hint__day/__month/__year

- What it does: Custom column-header hint rendering the words Day / Month / Year under the "Date of issue" table header, in place of per-field govuk-label/govuk-hint.
- Concern: Hint markup is bespoke rather than the standard govuk-date-input labels; the individual date inputs carry only aria-label (Day/Month/Year), no visible per-field labels.
- GOV.UK alternative: Standard govuk-date-input with visible govuk-label per field.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 49 (main.html)

#### aria-live-message, sr-only, margin-top-5

- What it does: Misc utility/helper classes: an aria-live region inside the date picker, a screen-reader-only class (duplicate of govuk-visually-hidden), and a custom top-margin utility.
- Concern: Duplicate/ad-hoc utilities where GOV.UK utilities already exist (govuk-visually-hidden, govuk-!-margin-top-*).
- GOV.UK alternative: govuk-visually-hidden and govuk spacing override classes (govuk-!-margin-top-5).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 49 (main.html)

### approved-establishment-of-origin

#### button.link-button (id=document-add-establishment, name=add-establishment, value=add, type=submit)

- What it does: A form submit button styled to look like a text link. Submits the establishment-of-origin form with add-establishment=add, which routes to the veterinary-establishments search page (observed navigation to .../veterinary-establishments?establishment-country-code=AF).
- Concern: Not a GOV.UK Design System class. IPAFFS uses a submit button dressed as a link to trigger a server round-trip into the search sub-flow. The new app should either use a standard govuk-button (secondary) for 'Search for an approved establishment', or a proper link if the action is idempotent navigation.
- GOV.UK alternative: govuk-button govuk-button--secondary, or a govuk-link if it is pure navigation into the search page
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84, action 54

#### div.table-responsive (wrapper around the govuk-table)

- What it does: Bespoke wrapper div, presumably to allow the establishments table to scroll horizontally on small viewports.
- Concern: Not a GOV.UK Design System class. The Design System table has no responsive-scroll wrapper of its own; IPAFFS added a custom one. The rebuild should wrap wide tables in an overflow-x container per GDS responsive-table guidance rather than a bespoke class name.
- GOV.UK alternative: GOV.UK responsive table guidance (overflow-x:auto container) — no dedicated component class
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84, action 54

#### th.govuk-table__cell (table header cells use the __cell class, not govuk-table__header, and lack scope="col")

- What it does: The thead header cells are marked up with govuk-table__cell instead of the standard govuk-table__header, and have no scope attribute.
- Concern: Non-standard use of the govuk Table component — the correct header class is govuk-table__header with scope="col" for accessibility. The rebuild should use standard header markup.
- GOV.UK alternative: govuk-table__header with scope="col"
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84, action 54

### search-approved-establishment

#### button.link-button (id='select-establishment-N', name='add-id', value=establishment UUID)

- What it does: The per-result 'Select' control. It is a real form submit button styled to look like a link; submitting posts add-id=<establishment UUID> and navigates to establishment-of-origin. Each logical establishment is rendered once in the desktop form and again in the mobile form, so the observed 10 results produce 20 Select buttons.
- Concern: Custom 'link-button' class, not a Design System component. A button dressed as a link is an accessibility/consistency smell. The dual render also duplicates ids select-establishment-1 through select-establishment-10 in the same DOM.
- GOV.UK alternative: Use a standard govuk-button (or govuk-button--secondary) per row, or a genuine link if the action is navigational; keep the submit semantics.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 57 before snapshot (20 button[name='add-id'] controls: 10 under .establishments-search-results-form-desktop and 10 under .establishments-search-results-form-mobile; ids 1-10 are repeated)

#### pagination / pagination-list / pagination-item / pagination-item-next / pagination-link / pagination-link-icon / pagination-link-label / pagination-link-title

- What it does: Bespoke pagination widget rendering 'Next page : 2 of 5' with a link to ?establishment-country-code=AF&page=2.
- Concern: Entirely custom pagination markup — does NOT use the GOV.UK Pagination component.
- GOV.UK alternative: GOV.UK Pagination component (govuk-pagination) covers previous/next and numbered pages out of the box.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 57 (navigation 'Pagination', link 'Next page : 2 of 5')

#### establishments-search-results-form-desktop / establishments-search-results-form-mobile / establishments-table-mobile / table-responsive / no-wrap

- What it does: Dual-renders the results: a govuk-table for desktop and a stacked card list (H3 govuk-label--s field headings + P values per establishment) for mobile, toggled by responsive classes. Each form also repeats its crumb, etag and ten add-id submit controls.
- Concern: Custom responsive dual-render of the same data. GOV.UK tables do not natively transform to mobile cards; two parallel DOM structures increase maintenance and a11y risk, including duplicated Select-control ids.
- GOV.UK alternative: A single responsive govuk-table, or the community responsive-table pattern, rather than two separate rendered structures.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 57 before snapshot (desktop and mobile form class inventory; each contains 10 add-id buttons and hidden crumb/etag inputs)

#### search-panel / establishments-search-results

- What it does: Custom wrapper classes around the filter panel and results table for IPAFFS-specific layout/styling.
- Concern: IPAFFS-specific styling hooks; not part of the Design System. Low risk but should map to govuk grid/spacing utilities in the rebuild.
- GOV.UK alternative: govuk-grid + govuk spacing utilities; no bespoke panel class needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 57 (class inventory)

### traders-addresses

#### <button class="link-button button-margin-right" name="populate_importer" ...>Same as consignee</button> (also populate_place_of_destination)

- What it does: A form-submit button rendered with bespoke 'link-button' styling (button that reads as inline text, not a GOV.UK button). Submits the hub form to copy the consignee's address into the importer / place-of-destination slot. Only rendered once a consignee address exists.
- Concern: Custom 'link-button' and 'button-margin-right' classes sit outside the Design System. It mixes a link-styled control with real submit semantics, which is exactly the ambiguity GOV.UK guidance warns against.
- GOV.UK alternative: govuk-button with the govuk-button--secondary modifier (a genuine secondary action button), keeping the 'Same as consignee' copy.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 85 (main85.html)

#### <div class="table-responsive"><table class="govuk-table ... trader-table">  with column classes col-name / col-address / col-country / col-edit and cell class text-align-right

- What it does: Wraps the per-trader govuk-table in a custom responsive container and applies bespoke column-width / right-align classes. The table itself is a standard govuk-table; only the wrapper and column/alignment helpers are custom.
- Concern: 'table-responsive', 'trader-table', 'col-*' and 'text-align-right' are not Design System classes — they encode column sizing and horizontal scroll behaviour outside govuk-frontend. The empty 'table-responsive' div is also rendered even when a section has no address (importer / place of destination), which is dead markup.
- GOV.UK alternative: Use the Summary list component (govuk-summary-list) per trader rather than a table — it is the Design System idiom for 'a small set of named values with a Change action' and needs no custom responsive/column CSS.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 85 (main85.html)

### search-existing-consignor

#### button.link-button

- What it does: The per-row 'View' and 'Select' actions are rendered as <button> elements styled to look like links (each row is its own mini-form submitting the chosen trader).
- Concern: Custom class, not a Design System component. Buttons masquerading as links is a known GOV.UK anti-pattern (accessibility + visual-affordance mismatch).
- GOV.UK alternative: Use govuk-link anchors for navigation-style actions, or a real govuk-button; a summary/table 'Actions' column with proper links.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 60 (structure eval: BUTTON.link-button 'View'/'Select')

#### search-panel, name-address-and-country, form-group

- What it does: Bespoke wrapper classes around the search fieldset (search-panel) and the input grouping (name-address-and-country); 'form-group' is a non-govuk plain form group (distinct from govuk-form-group which is also present).
- Concern: IPAFFS-specific layout classes carrying their own CSS rather than composing govuk utilities. 'form-group' vs 'govuk-form-group' duplication is a smell.
- GOV.UK alternative: Compose with govuk-form-group + govuk grid utilities; drop bespoke wrappers.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 60 (class inventory)

#### table-responsive, traders-search-results, traders-search-results-form-desktop, traders-search-results-form-mobile, transporter-table-mobile

- What it does: A dual-render responsive-table pattern: the govuk-table is shown on desktop, and the same rows are re-rendered as stacked cards (H3.govuk-label--s Name/Address/Country pairs) for mobile, toggled by CSS media queries. Note the reused 'transporter-table-mobile' class name (copied from the transporter page).
- Concern: Content is duplicated in the DOM (desktop table + mobile cards), driven by bespoke CSS. Not a Design System pattern; brittle and increases markup. The 'transporter-table-mobile' name leaking onto the traders table indicates copy-paste reuse.
- GOV.UK alternative: GOV.UK responsive tables via govuk-table with responsive CSS, or a single govuk-summary-list per result. No component in the toolbox renders a table twice; the new app should render once and let CSS reflow.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 60 (class inventory + structure eval showing duplicated H3 label cards)

#### economic-operator-name, economic-operator-address (ids/classes)

- What it does: Custom identifiers on the search Name/Address inputs tying them to the 'economic operator' domain concept.
- Concern: Legacy IPAFFS domain naming ('economic operator', 'consignee' route even though page is 'consignor'). The 'Create new' link points at /traders/consignee/new — route naming does not match the consignor page label.
- GOV.UK alternative: N/A (naming convention). New app should use consistent, page-matching field names.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 60 (class inventory; action 60 log href .../traders/consignee/new?reimport=true)

### consignor-confirmation

#### H1 / page-title copy 'The consignee has been created' / 'Create consignee confirmation' rendered on the CONSIGNOR confirmation instance

- What it does: A single shared confirmation template is used for both consignor and consignee traders. When a consignor is created it still displays 'The consignee has been created'; only the form's return link (/traders/consignor/search) reflects the actual trader type.
- Concern: The visible confirmation text is hardcoded to 'consignee' regardless of trader type — a genuine IPAFFS copy defect. Confirmed by comparing action 71 (after creating consignor 'Linus George Ltd') and action 84 (after creating consignee 'Global Corp'): both render byte-identical H1 and <title>. The rebuild should parameterise the confirmation copy by trader role (consignor/exporter vs consignee vs importer) rather than hardcode 'consignee'.
- GOV.UK alternative: Standard govuk Panel (confirmation) with role-aware title text — no custom component needed, just correct copy binding.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84, action 71 vs action 84

### search-existing-consignee

#### pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: Bespoke pagination control rendering 'Next page : 2 of 4000' with icon/label/title spans, navigating via ?page=N
- Concern: IPAFFS hand-rolled its own pagination markup instead of using the GOV.UK Pagination component. The '2 of 4000' page count also implies the search returns the entire address book unfiltered by default (4000 pages) — a data-volume / UX concern for the rebuild.
- GOV.UK alternative: GOV.UK Pagination component (govuk-pagination)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 73 (non-govuk class inventory)

#### search-panel

- What it does: Custom wrapper around the Name/Address search fieldset and Search button
- Concern: Custom container class; the enclosed controls are standard govuk-input/govuk-button so the panel itself carries only layout styling and can be dropped in favour of grid + form-group.
- GOV.UK alternative: govuk-form-group + govuk-grid-* columns (no bespoke panel needed)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 73

#### table-responsive, traders-search-results, traders-search-results-form-desktop, traders-search-results-form-mobile, transporter-table-mobile, name-address-and-country

- What it does: Custom responsive results-table scaffolding — separate desktop and mobile renderings of the same trader results (the 'transporter-table-mobile' / mobile-form variants), with a combined name-address-and-country cell
- Concern: IPAFFS ships two parallel table layouts (desktop vs mobile) with bespoke classes rather than a single responsive GOV.UK Table. Duplicated markup is a maintenance and accessibility risk. The reused 'transporter-table-mobile' class shows this widget is shared across trader types (consignor/consignee/transporter).
- GOV.UK alternative: A single GOV.UK Table (govuk-table) with responsive styling, or a Summary card list per result
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 73

#### link-button

- What it does: Styles every per-row 'View' and 'Select' submit button as a link in both the mobile and desktop result renderings; the 'Create a new consignee' anchor does not use this class
- Concern: Custom class makes submit buttons look like links, creating a semantic and visual-affordance mismatch.
- GOV.UK alternative: Use govuk-link anchors for navigation actions or standard govuk-button styling for form submissions
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 73

#### form-group (non-govuk), economic-operator-name, economic-operator-address

- What it does: Custom form-group variant and per-field id-style classes for the trader name/address inputs
- Concern: A bespoke 'form-group' (distinct from govuk-form-group) plus entity-specific field classes; purely for IPAFFS-specific styling/hooks. Replace with standard govuk-form-group.
- GOV.UK alternative: govuk-form-group
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 73

### consignee-confirmation

#### back-link--next-to-breadcrumbs

- What it does: Adds bespoke positioning to the shell-level GOV.UK Back link, whose rendered href is '#'.
- Concern: Custom layout modifier and fragment-only destination rely on client-side/history behaviour rather than a concrete route.
- GOV.UK alternative: Use govuk-back-link with a real previous-step href and standard spacing/layout utilities.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 84 (A#back-link.govuk-back-link.back-link--next-to-breadcrumbs, href=#)

### importer

#### button.link-button.button-margin-right (id=populate-importer, name=populate_importer, value=importer)

- What it does: The "Same as consignee" shortcut. A real <button> submitting the traders form with name=populate_importer, but styled with custom link-button CSS so it renders as an inline text link rather than a GOV.UK button. Clicking it server-populates the Importer address by copying the consignee's details, then re-renders the Addresses page with the Importer table filled in.
- Concern: Non-standard: a submit button masquerading as a link via bespoke CSS (link-button, button-margin-right) that is not in the GOV.UK Design System. Mixes an action button with link styling, which is inconsistent with GDS button/link guidance.
- GOV.UK alternative: In the rebuild, offer the "same as consignee" choice as a genuine control — e.g. a Radios question ("Is the importer the same as the consignee?" Yes/No) or a govuk-button--secondary — rather than a link-styled submit button.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 85 (#populate-importer) + action 86 log (button resolved to link-button class)

#### table.trader-table.table-responsive with col-name / col-address / col-country / col-edit and text-align-right

- What it does: Custom column-width and responsive-wrapping classes layered onto the govuk-table used to render each trader address summary. col-* set fixed column widths; table-responsive/text-align-right adjust layout and align the Change link right.
- Concern: Bespoke table styling outside the Design System. The govuk-table itself is standard but these custom classes add IPAFFS-specific layout that would need re-implementing or dropping.
- GOV.UK alternative: Prefer a GOV.UK Summary list (govuk-summary-list) per trader with a Change action, which natively handles the name/address/change layout without custom column CSS.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 85 (main class inventory: trader-table, table-responsive, col-name, col-address, col-country, col-edit, text-align-right)

### transport-details

#### autocomplete__wrapper / autocomplete__input / autocomplete__menu / autocomplete__option / autocomplete__status (accessible-autocomplete)

- What it does: Progressive-enhancement of the Port of entry <select> (id=bcp-select, name=bcp) into a type-ahead combobox. A visible text input (id=bcp, no name attribute) is layered over the native select; selecting an option writes the value back to the select.
- Concern: Third-party library (alphagov/accessible-autocomplete), not core govuk-frontend. Introduces a text input + select value-sync and its own ARIA live status region.
- GOV.UK alternative: govuk-frontend has no first-party autocomplete; accessible-autocomplete is the GDS-recommended companion. The new app can source the port list from a reference-data service and keep using accessible-autocomplete, or render a plain Select if the BCP list stays short.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 92 (bcp text input + bcp-select select; autocomplete__* classes)

#### defra-datepicker / date-picker__dialog / date-picker__date-table / date-picker__button__* / date-picker__reveal__icon (+ 'Choose date' button)

- What it does: A bespoke calendar-picker overlay bolted onto the standard govuk-date-input Day/Month/Year fields. The 'Choose date' button opens a dialog calendar that writes back to the three text inputs.
- Concern: Custom DEFRA widget, not part of govuk-frontend. Extra JS, a dialog with prev/next-month navigation and its own date-picker-day/month/year hidden inputs. Adds complexity and a11y surface beyond the standard three-field date input.
- GOV.UK alternative: Standard GOV.UK Date input (three text fields, no calendar) is the toolbox pattern. The new app should prefer the plain Date input unless a calendar is an explicit requirement.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 92 (defra-datepicker + date-picker__* classes; 'Choose date' button e111)

#### containers-grid / heading-with-help / link-button / sr-only / aria-live-message / hidden

- What it does: containers-grid is a custom layout wrapper for the conditional container-number / seal-number / official-seal fields. link-button styles a button as a link. sr-only / aria-live-message / hidden are custom screen-reader and visibility utilities. heading-with-help wraps a heading with adjacent help.
- Concern: Bespoke IPAFFS utility/layout classes duplicating things govuk-frontend already provides (govuk-visually-hidden for sr-only; govuk-grid-* for containers-grid; govuk-!-* spacing). Custom CSS to maintain.
- GOV.UK alternative: govuk-visually-hidden replaces sr-only; govuk-grid-row/column replaces containers-grid; a govuk-button--secondary or a real link replaces link-button.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 92 (non-govuk class list)

### means-of-transport-after-bcp

#### defra-datepicker / date-picker__container / date-picker__dialog / date-picker__date-table / date-picker__button__next-month / date-picker__button__previous-month / date-picker__button__close / date-picker__reveal__icon / date-picker__heading / date-picker__header / date-picker-day / date-picker-month / date-picker-year / date-input-day / date-input-month / date-input-year / date-input-hour / date-input-minute

- What it does: A bespoke DEFRA calendar/date-picker widget bolted onto the departure date. Adds a 'Choose date' button that opens a pop-up calendar dialog (month grid with previous/next-month and close controls) to populate the Day/Month/Year govuk-date-input fields.
- Concern: Not part of the GOV.UK Design System. The Design System's Date input pattern is deliberately three plain text inputs with NO calendar picker (GDS research found calendar widgets harm accessibility for date-of-known-value entry). IPAFFS has layered a custom pop-up calendar on top. The new app should drop the calendar widget and use the plain govuk-date-input, unless a specific accessibility-tested picker is mandated.
- GOV.UK alternative: GOV.UK Date input (three text inputs, no calendar), which is already present underneath
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 102 (class inventory)

#### Date input component reused for a time entry (Hour / Minutes)

- What it does: The departure TIME is built from the same govuk-date-input markup (govuk-date-input__item/__input) as the date, giving two 2-digit inputs Hour and Minutes with hint '24 hour format, for example, 14 50'.
- Concern: The GOV.UK Design System has no dedicated time component; using Date input markup for time is a pragmatic reuse rather than a documented pattern. It is acceptable but the new app should treat it as a plain fieldset of two labelled inputs, not a true Date input.
- GOV.UK alternative: Fieldset with two govuk-input --width-2 text inputs (Hour, Minutes)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 102

#### aria-live-message / sr-only / hidden

- What it does: Screen-reader live-region announcement (used by the date picker) plus visually-hidden helper text; 'hidden' toggles the picker dialog. The date/time fieldset legends carry class 'hidden' rather than govuk-fieldset__legend + govuk-visually-hidden.
- Concern: Minor. sr-only/hidden are generic (bootstrap-style) utility classes rather than govuk-visually-hidden; the legends being class='hidden' means they are not rendered via the standard govuk fieldset legend. Rebuild with govuk-fieldset__legend + govuk-visually-hidden.
- GOV.UK alternative: govuk-visually-hidden utility class; govuk-fieldset__legend for the legends
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 102

### transporter

#### transporter-detail-form-mobile / transporter-detail-form-desktop / transporter-table-mobile

- What it does: The entire hub is rendered TWICE inside <main> — a desktop version (a real <table>) and a mobile version (a card layout built from govuk-grid-row divs with govuk-label--s spans and govuk-section-break rules). CSS shows one and hides the other by viewport. Buttons/links are duplicated with -mobile / -desktop id suffixes.
- Concern: Two full copies of the same form and its submit buttons means duplicated markup, duplicated ids, and two POST targets to keep in sync. The rebuild should render the transporter list once and rely on a single responsive component.
- GOV.UK alternative: GOV.UK Table is responsive on its own; or use a Summary list / Summary card per transporter (label:value pairs) which reflows to mobile without a second markup tree.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 (main.html — both forms present)

#### govuk-table applied to <div> elements (mobile card)

- What it does: In the mobile form the class govuk-table is put on a plain <div> and the rows are govuk-grid-row divs — the Table component's visual class reused on non-table markup.
- Concern: Non-semantic use of the table class; not how the Design System intends govuk-table to be used.
- GOV.UK alternative: Summary list (govuk-summary-list) for the label:value card layout.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 (main.html, mobile form)

#### table-responsive

- What it does: Custom wrapper div around the desktop <table>, presumably enabling horizontal scroll / responsive behaviour.
- Concern: Bespoke class, not part of govuk-frontend.
- GOV.UK alternative: Wrap wide tables in an overflow-x:auto container using govuk utilities, or rely on the responsive table pattern.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 (main.html)

#### no-wrap

- What it does: Prevents wrapping on the 'Approval number' column header.
- Concern: Custom CSS utility; not a govuk class.
- GOV.UK alternative: govuk-frontend has no direct equivalent; a small project utility class is acceptable, or govuk-!- spacing utilities where possible.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 (main.html)

#### vertical-align-middle

- What it does: Vertically centres table cell content.
- Concern: Custom CSS utility; not a govuk class.
- GOV.UK alternative: No standard govuk utility; small project CSS acceptable.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 (main.html)

#### name-address-and-country

- What it does: Styles the first cell / mobile block that stacks the transporter name, address (comma-joined) and country as three <p> elements.
- Concern: Custom class; the composite 'name / address / country' cell is an IPAFFS-specific presentation of a single transporter.
- GOV.UK alternative: Summary list row or table cell with a project style; the composite is fine, just needs no bespoke component.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 112 + 125 (main.html / table125.html)

### search-existing-transporter

#### search-panel, traders-search-results, traders-search-results-form-desktop, traders-search-results-form-mobile, transporter-table-mobile, table-responsive, name-address-and-country, economic-operator-name, economic-operator-address, form-group

- What it does: IPAFFS-specific classes for the transporter/trader search widget: a search panel, one desktop results table plus 25 mobile-optimised result cards in the observed page (each reusing the govuk-table class on non-table markup), and cell-content grouping classes that stack name, address and country on mobile.
- Concern: Bespoke responsive-table pattern with duplicated desktop/mobile markup and custom form-group wrappers. Not a Design System component; carries its own CSS. The rebuild should not copy this dual-table approach.
- GOV.UK alternative: GOV.UK Table (govuk-table) with responsive handling, or replace the whole search-and-select-from-a-long-list interaction with a simpler pattern (the 'Create a new transporter' path is the one exercised in the trace).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 113

#### pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: Custom pagination control rendering 'Next page : 2 of 2032' with its own bespoke class set, not the Design System pagination component.
- Concern: Reinvents a component that now exists in govuk-frontend. The '2 of 2032' page count implies the saved-transporter list is unbounded and paginated server-side — a heavy pattern for the rebuild.
- GOV.UK alternative: GOV.UK Pagination (govuk-pagination).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 113

#### link-button

- What it does: Styles each per-row View and Select submit <button> to look like a link. The 'Create a new transporter' action is a separate plain govuk-link and does not use link-button.
- Concern: The row View/Select controls are true submit buttons but visually presented as links, which can obscure their action semantics.
- GOV.UK alternative: GOV.UK Button for true actions, or a plain govuk-link for navigation — choose based on semantics.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 113

### transporter-creation

#### (none)

- What it does: Every class under main is govuk-* — the page is 100% within the GOV.UK Design System toolbox. Class inventory: govuk-!-width-one-half, govuk-body, govuk-button, govuk-fieldset, govuk-fieldset__legend, govuk-fieldset__legend--m, govuk-form-group, govuk-grid-column-full, govuk-grid-row, govuk-heading-xl, govuk-input, govuk-label, govuk-label--m, govuk-link, govuk-select.
- Concern: No custom widgets, no third-party libraries, no accessible-autocomplete on the country select (it is a plain native govuk-select, not an autocomplete). The new app can rebuild this page entirely with standard govuk-frontend components.
- GOV.UK alternative: N/A — already fully standard. Note the country select could optionally be upgraded to accessible-autocomplete in the new app, but IPAFFS uses a plain select here.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 118 (non-govuk class filter returned empty)

### contact-details

#### navigation-links / navigation-links__left-block

- What it does: Custom wrapper above <main> holding the back link and IPAFFS navigation links.
- Concern: Bespoke IPAFFS chrome outside the main content region, not part of the form itself. Platform furniture rather than a page requirement.
- GOV.UK alternative: Standard govuk-back-link is already used within it; no new-app requirement beyond a Back link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 126: rendered .navigation-links containing account links plus Back and Dashboard.

#### common/referenceNumberHeaderDiv partial

- What it does: Renders the notification reference number / status / version header band above main.
- Concern: IPAFFS-specific header widget shown across notification pages; not a Design System component.
- GOV.UK alternative: Could be expressed as a caption / summary line; not required for the new simple app's form itself.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 126: rendered #reference-number with 'DRAFT.GB.2026.1525975'.

### nominated-contacts

#### button.link-button (ids: remove-nominated-contact0, add-nominated-contact)

- What it does: Submit buttons visually styled to look like links — used for the per-row "Remove" action (name=remove-nominated-contact, value=<index>) and the "Add another person" action (name=add-nominated-contact). Both post the form so the server re-renders the table with a row added/removed (no-JS progressive enhancement).
- Concern: link-button is a bespoke IPAFFS class, not part of the GOV.UK Design System. The Design System deliberately does not provide a link-styled button; the accepted pattern for add/remove-another is a govuk-button--secondary, or the 'Add another' add-another component from GDS. Server-round-trip add/remove of rows is an IPAFFS interaction choice.
- GOV.UK alternative: govuk-button--secondary for Remove / Add another (or the GOV.UK 'Add another' pattern). The new app could keep the progressive-enhancement add/remove behaviour but style the controls with standard button classes.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 127 (main.html)

#### div.table-responsive wrapping the govuk-table

- What it does: Custom wrapper around the table, presumably to allow horizontal scroll on narrow viewports.
- Concern: table-responsive is a bespoke/Bootstrap-style class, not govuk-. The Design System table has no built-in responsive-scroll wrapper.
- GOV.UK alternative: Wrap the table in a container with overflow-x:auto using govuk utilities, or reconsider whether a table is the right component (see openQuestions).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 127 (main.html)

#### Text inputs rendered inside <td> cells of a govuk-table with aria-labelledby pointing at column headers

- What it does: Uses a data table as an editable grid — each contact is a row and each field an input cell; the visible label is the column header, associated via aria-labelledby (name-header/email-header/phone-header). There are no per-input govuk-label elements.
- Concern: This is a non-standard use of the Table component. The Design System table is for presenting data, not for collecting it. Inputs-in-a-table has accessibility trade-offs and does not use the standard label/hint/error-message structure of a form field.
- GOV.UK alternative: Repeating fieldset per contact using the GOV.UK 'Add another' pattern, each contact being a group of properly-labelled Text input fields, rather than a table of unlabelled cells.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 127 (main.html)

### contact-address

#### branch-address-select class on each govuk-radios__item

- What it does: Adds a page-specific class to each address choice.
- Concern: The custom class is not a GOV.UK component requirement; the rendered interaction otherwise uses standard GOV.UK radios.
- GOV.UK alternative: Use standard govuk-radios markup unless page-specific scripting or styling genuinely needs the additional hook.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 128: all 16 radio item wrappers rendered class 'govuk-radios__item branch-address-select'.

### branch-address-creation

#### (none)

- What it does: The main content region uses only govuk-* classes: govuk-heading-xl, govuk-body, govuk-form-group, govuk-label/--m, govuk-input, govuk-!-width-one-half, govuk-fieldset/__legend/--m, govuk-select, govuk-button, govuk-link, govuk-grid-row, govuk-grid-column-full.
- Concern: No non-standard markup on this page. It is 100% inside the GOV.UK Design System toolbox and can be rebuilt with govuk-frontend macros as-is. The one thing to note: the Country control is a plain govuk-select with 254 options rather than an accessible-autocomplete; the new app may choose to upgrade this to a typeahead but that is an enhancement, not a migration of a non-standard pattern.
- GOV.UK alternative: n/a - already standard
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 133 (main class inventory returned only govuk-* classes)

### review-notification

#### review-summary-list, review-summary-list__row, review-summary-list__key, review-summary-list__value, review-summary-list__action, review-summary-list__row-border-bottom, review-summary-list__row-border-top, review-summary-list__row-no-action, review-summary-list__row-with-action

- What it does: IPAFFS-bespoke wrapper/skin over the GOV.UK summary list, adding custom border and action-column variants for the check-your-answers rows
- Concern: Custom CSS layered on top of govuk-summary-list; the border/action variants are hand-rolled rather than using the standard component modifiers
- GOV.UK alternative: GOV.UK Summary list component (with actions) — the new app can render check-your-answers rows with the stock govukSummaryList macro; borderless/actionless variants map to the component's built-in options
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (class inventory)

#### presentation-table, presentation-table__row--no-border, presentation-table__section, review-table, table-responsive

- What it does: Bespoke table skins for the commodity/species/weights breakdown, certificate/document tables, establishment table and transport tables — including a responsive/collapsing behaviour and section grouping
- Concern: Custom table styling and responsive behaviour outside the Design System; presentation vs data-table distinction is IPAFFS-specific
- GOV.UK alternative: GOV.UK Table component for the tabular data; simple key/value rows could be Summary lists instead. Responsive stacking is not a stock govuk feature and would need reconsidering
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (class inventory)

#### audit-flag, audit-flag__date, audit-flag__user

- What it does: Renders the 'Last updated <date>, by <user>, Not Submitted' provenance strip near the H1
- Concern: Bespoke widget with no Design System equivalent; encodes draft status + last-editor metadata
- GOV.UK alternative: No direct equivalent — could be plain body paragraphs or a govuk Tag for the status ('Not Submitted'). New app should decide whether draft-status metadata belongs on the review page at all
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (text 'Last updated 16 July 2026, 17:11 / by Michael Scott / Not Submitted')

#### copy-button, copy-button (Copy buttons on CHED reference / customs declaration reference / customs document code)

- What it does: A one-click copy-to-clipboard button beside each reference value
- Concern: Requires client-side JS (clipboard API); not a Design System component
- GOV.UK alternative: No stock govuk component. New app could omit (the reference is selectable text) or implement a small progressive-enhancement copy button — flag as a product decision
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (button 'Copy' x3)

#### link-button, change

- What it does: The Import risk category 'Change' action is a <button> styled as a link; the other 15 visible Change actions in this snapshot are anchors.
- Concern: Buttons-as-links / links-as-buttons is a known GOV.UK accessibility anti-pattern; the change actions are inconsistent (anchors plus one button)
- GOV.UK alternative: Standardise all 'Change' actions as summary-list action links (anchors) per the Summary list pattern
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (button id=change-import-risk-category; the Additional details Change action is an anchor to /consignment/details?fromImporterReview=true)

#### heading-with-change-link

- What it does: Layout helper putting a section H2/H3 and its 'Change' link on the same row
- Concern: Custom layout wrapper; purely presentational
- GOV.UK alternative: Achievable with govuk grid/flex utilities or the Summary list card pattern (govuk-summary-card) which pairs a title with actions
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (class inventory)

#### consignment-net-weight, species, packages, package-type, weight, no-wrap, ellipsis, break-word, border-bottom-none

- What it does: Column-level styling helpers on the commodity/species table (weight/package formatting, text truncation, wrapping control)
- Concern: Fine-grained bespoke CSS for a specific data table; ties presentation tightly to IPAFFS data shape
- GOV.UK alternative: GOV.UK Table with numeric cell modifiers (govuk-table__cell--numeric); truncation/no-wrap are custom and should be avoided or justified
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 141 (class inventory)

### declaration

#### form.review-form (class="review-form" id="declaration-form")

- What it does: Wraps the declaration POST form; carries the hidden crumb, etag and submissionDate inputs and the submit button.
- Concern: 'review-form' is an IPAFFS-specific class, not a GOV.UK Design System component. It appears to be a purely structural/styling hook for the review-and-submit style forms and carries no semantic requirement.
- GOV.UK alternative: No component needed — a plain <form> with a govuk-button is the standard pattern. Drop the custom class in the rebuild.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 142 (main.html)

#### hidden inputs: crumb, etag, submissionDate

- What it does: Carries two opaque values named crumb and etag plus submissionDate, whose value '16 July 2026' mirrors the visible declaration date.
- Concern: The snapshot confirms the names, hidden types and values, but does not establish the server-side semantics or derivation of crumb, etag or submissionDate.
- GOV.UK alternative: n/a — transport concern. The rebuilt service should use its framework's own CSRF/concurrency mechanisms and derive the declaration date server-side rather than trust a client hidden field.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 142 (main.html)

### confirmation

#### notification-banner--inspection-required / notification-banner--green / notification-banner__risk-title

- What it does: Repurposes the GOV.UK notification banner as a colour-coded 'Initial risk assessment' header. The banner has only a custom __risk-title heading and no body; colour swaps by risk outcome.
- Concern: Not a standard notification-banner usage (standard banner has a title 'Important'/'Success' plus content). Custom modifier classes and a bespoke green variant imply custom CSS outside the govuk toolbox.
- GOV.UK alternative: In the rebuild, model the risk-assessment outcome with a standard Panel (green/success for not-required) or a Notification banner with the standard success modifier, plus body copy — rather than an empty header-only banner.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 143; trace 0a6f82fcd63c4cd83fcab91687b522f3f865a74e action 146

#### panel--inspection-required / panel--inspection-not-required (govuk-panel with only __body, inline style border-top:none)

- What it does: Uses the confirmation Panel to display 'Inspection status' + outcome, with no panel title and a custom border/colour per variant.
- Concern: Standard govuk-panel is a large success panel with a title and reference. Here it is restyled (custom modifiers, inline border override) to act as a status tile — bespoke CSS.
- GOV.UK alternative: A standard Panel (title = the status), or Summary list / Tag component to convey inspection status, would keep it inside the toolbox.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 143; trace 0a6f82fcd63c4cd83fcab91687b522f3f865a74e action 146

#### copy-button (custom class on a govuk-button, data-copy-value, data-prevent-double-click)

- What it does: Clipboard-copy widget: copies the reference/code value client-side. Carries 'hidden' class until JS enhances it.
- Concern: Clipboard copy is a bespoke JS behaviour not part of the GOV.UK Design System. Buttons render as govuk-button--secondary but the copy behaviour is custom.
- GOV.UK alternative: No direct Design System equivalent. Keep the govuk-button--secondary styling; the copy-to-clipboard JS is an acceptable progressive enhancement but must degrade gracefully (value already visible in the summary list).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 143

#### link-button (custom class on <a> exit links: 'Return to your dashboard', 'Create a new notification')

- What it does: Styles anchor links as button-like exit actions.
- Concern: Custom class rather than a govuk component; mixes link and button semantics.
- GOV.UK alternative: Use govuk-button (with href, rendered as <a>) for the primary 'Return to your dashboard' action and a plain govuk-link for 'Create a new notification', per Design System guidance.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 143

#### footer_feedback

- What it does: Custom feedback block ('Tell us what we can improve') linking to an external Qualtrics survey.
- Concern: Bespoke IPAFFS feedback widget/class, not a Design System component.
- GOV.UK alternative: Standard 'phase banner' feedback link, or a plain heading + govuk-link, would replace the custom block.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 143

### transit-exit-bcp

#### defra-datepicker / date-picker__dialog / date-picker__reveal__icon / date-picker__button__previous-month / date-picker__button__next-month / date-picker__button__close / date-picker__container / date-picker__header / date-picker__heading / date-picker__date-table / date-input--picker / date-input-day|month|year|hour|minute / date-picker-day|month|year

- What it does: A bespoke DEFRA JavaScript date-picker: a 'Choose date' reveal icon/button next to the standard Day/Month/Year date input that opens a modal calendar dialog with previous-month / next-month / Cancel buttons for point-and-click date selection.
- Concern: Not part of the GOV.UK Design System. GDS has no calendar date-picker component — the recommended pattern is the plain three-field date input, which is already present here (defra-datepicker is layered on top of it). It ships bespoke JS + CSS + a dialog widget that the new app would have to re-implement and accessibility-test. The GDS guidance is that a calendar picker is usually unnecessary for a known date.
- GOV.UK alternative: GOV.UK Date input (govuk-date-input) — the three text fields are already there; drop the calendar overlay. If a picker is genuinely needed, the MoJ Frontend datepicker is the community pattern, but base rebuild should default to the plain date input.
- Evidence: trace 773306e61df143380216615043b6ec3d0ef8b544 action 27 (nonstd.txt: defra-datepicker + date-picker__* classes; structure.txt: BUTTON.date-picker__reveal__icon 'Choose date', Previous month, Next month, Cancel)

#### button.link-button

- What it does: The 'Add another country' control that adds a further Transited country select to the transit block (repeatable list of transited countries).
- Concern: A button styled as a link via a bespoke 'link-button' class rather than a Design System component. The add-another-item pattern is not a core GDS component.
- GOV.UK alternative: Use govuk-button--secondary for the add action, or adopt the 'Add another' MoJ Frontend pattern; the transited-country repetition maps naturally to an add-another list.
- Evidence: trace 773306e61df143380216615043b6ec3d0ef8b544 action 27 (structure.txt: BUTTON.link-button 'Add another country')

#### aria-live-message / sr-only

- What it does: Screen-reader live-region announcement helpers (sr-only is a bespoke visually-hidden class alongside the standard govuk-visually-hidden; aria-live-message is a live region, likely for the datepicker).
- Concern: Duplicate of govuk-visually-hidden under a non-govuk name; the aria-live-message region is tied to the bespoke datepicker.
- GOV.UK alternative: Use govuk-visually-hidden consistently; any live-region needs come free with standard components.
- Evidence: trace 773306e61df143380216615043b6ec3d0ef8b544 action 27 (nonstd.txt)

#### hidden (on the time-entry legend)

- What it does: The 'Time entry:' fieldset legend is hidden via a bespoke 'hidden' class rather than govuk-visually-hidden.
- Concern: Non-standard visibility utility; risks hiding the legend from assistive tech entirely rather than visually-only.
- GOV.UK alternative: govuk-visually-hidden on the legend if it should remain announced.
- Evidence: trace 773306e61df143380216615043b6ec3d0ef8b544 action 27 (structure.txt: LEGEND.hidden 'Time entry:')

### common-user-charge

#### summary-card / summary-card__content / summary-card__title / summary-card__title-wrapper

- What it does: IPAFFS-bespoke card that boxes the govuk-summary-list under a 'Billing details' heading
- Concern: Hand-rolled card wrapper predating the Design System's own Summary card; adds custom CSS outside the govuk-frontend toolbox
- GOV.UK alternative: govuk Summary card (govuk-summary-card) — now a first-class Design System component, use it instead of the custom summary-card markup
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 147

#### summary-list__row--no-actions

- What it does: Non-govuk modifier on a summary-list row that has no Change action (the Name row)
- Concern: Custom BEM modifier not part of govuk-summary-list; layout tweak done outside the toolbox
- GOV.UK alternative: Standard govuk Summary list / Summary card row omitting the actions cell — no custom modifier needed
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 147

#### list-bullet

- What it does: Bulleted list (Port of Dover / Eurotunnel Le Shuttle) inside the Details component
- Concern: Custom class instead of the Design System list utility
- GOV.UK alternative: govuk-list govuk-list--bullet
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 147

#### link-button

- What it does: 'Cancel and return to notification' rendered as a <button> styled to look like a link
- Concern: Custom class for a button-as-link; not a Design System pattern
- GOV.UK alternative: Use a govuk-link (if navigation) or govuk-button--secondary (if a form action); avoid bespoke link-button styling
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 147

### billing-select-address

#### select.govuk-select.select-the-address

- What it does: Adds the custom select-the-address hook class to a standard GOV.UK native select.
- Concern: The custom class is not a Design System modifier; the underlying control is otherwise a standard select.
- GOV.UK alternative: Use a plain govuk-select unless a justified application-specific hook is required.
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 145

#### Native select populated from postcode lookup results

- What it does: Renders 46 runtime address matches plus a '46 addresses found' placeholder.
- Concern: The addresses are runtime lookup data, not a fixed option domain; a long list of near-identical native options may be difficult to scan.
- GOV.UK alternative: Use the GOV.UK address-lookup result-selection pattern, with accessible autocomplete only if user research supports it.
- Evidence: trace 1ed626a03c53440bd4a4fd8d6af18512937de6b2 action 145 (47 options total)

### catch-certificate-needed

#### link-no-underline, link-hover-highlight

- What it does: Custom IPAFFS link styling appears on both the guidance anchor ('importing or moving fish into the UK (opens in new tab).') and the details summary text ('If you do not have catch certificates now') — it removes the default underline and applies a hover highlight.
- Concern: Not GOV.UK Design System classes; overrides standard govuk-link styling and works against the Design System's accessibility guidance that links should be underlined.
- GOV.UK alternative: Use a plain govuk-link with default underlined styling; no custom link classes needed.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 38 after snapshot (guidance anchor class="govuk-link link-no-underline link-hover-highlight"; details summary span class="govuk-details__summary-text link-no-underline link-hover-highlight")

#### back-link--next-to-breadcrumbs

- What it does: IPAFFS layout modifier positioning the back link next to breadcrumbs.
- Concern: Non-standard modifier on govuk-back-link; positioning tweak specific to IPAFFS page furniture.
- GOV.UK alternative: Standard govuk-back-link placed above the page heading per the Design System pattern.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 38

#### Two <h1> elements on one page

- What it does: Page renders both 'Catch certificates' (govuk-heading-xl) and 'Do you need to add catch certificates?' (govuk-heading-l) as <h1>.
- Concern: Two H1s on a single page violates HTML heading hierarchy and the GOV.UK question-page pattern. The govuk-fieldset__legend is empty, so the radios' accessible grouping label is not the visible question heading.
- GOV.UK alternative: Single H1; make the question the fieldset legend (using govuk-fieldset__legend--l with the H1 inside it) per the GOV.UK 'question pages' pattern, or demote the question to an <h2>.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 38

### attach-catch-certificate

#### div[data-module="dropzone"].multi-file-upload__dropzone

- What it does: A JavaScript-enhanced drag-and-drop dropzone wrapping the govuk-file-upload input. Shows 'Drag and drop files here or' + a 'Choose files' label styled as a secondary button. On drop/select, files are (per the surrounding copy) uploaded asynchronously in batches of up to 10 at a time, up to 100 total.
- Concern: Not a GOV.UK Design System component. It is a bespoke multi-file / drag-and-drop uploader with its own JS module ('dropzone') and progressive-enhancement behaviour. The govuk-frontend File upload component is single-file and has no drag-and-drop. The new app cannot reproduce this by dropping in a stock govuk macro; it needs either the MOJ Multi-file upload pattern or a custom component, plus an async upload/virus-scan backend.
- GOV.UK alternative: govuk-frontend File upload (single file, no JS) covers the basic control; for the multi-file drag-and-drop experience the closest standard is the MOJ Frontend 'Multi-file upload' component. A no-JS fallback would be repeated single govuk File upload fields.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 40 (dropzone outerHTML: data-module="dropzone", class multi-file-upload__dropzone, label.govuk-button--secondary for=fileUpload, input#fileUpload multiple)

#### .uploaded-files-list

- What it does: Container class present in main where the list of already-uploaded files renders (empty at this snapshot, before any file was added).
- Concern: Custom, non-govuk class tied to the multi-file uploader. Implies a client-rendered list of uploaded documents with (typically) per-file remove controls — behaviour not provided by any single govuk component.
- GOV.UK alternative: A govuk Summary list or Table listing uploaded files with 'Remove' actions could reproduce the display; the MOJ Multi-file upload pattern renders exactly such a list natively.
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 40 (class inventory)

### add-catch-certificate-details

#### autocomplete__wrapper, autocomplete__input, autocomplete__menu, autocomplete__status (alpinejs/accessible-autocomplete)

- What it does: Overlays the native 'Flag state of catching vessel(s)' <select> with a type-ahead combobox; the a11y tree shows a 'combobox' plus a text input (id=flag-state-1) sitting in front of the real select (name=flag-state-1, id=flag-state-1-select).
- Concern: Third-party accessible-autocomplete progressive-enhancement widget layered over a govuk Select. The new app should decide whether flag-state needs autocomplete over a 251-item list; if so use the GOV.UK accessible-autocomplete pattern deliberately, otherwise a plain govuk Select.
- GOV.UK alternative: GOV.UK 'Select' component, or the GDS accessible-autocomplete enhancement pattern
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 46

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__button__*, date-picker__reveal__icon, short-date-input, date-input--picker

- What it does: A bespoke DEFRA calendar date-picker bolted onto the Date of issue govuk-date-input — adds a 'Choose date' icon button opening a month-grid dialog (Previous month / Next month / Cancel, heading e.g. 'July 2026').
- Concern: Custom calendar widget outside the Design System. GOV.UK guidance prefers the plain three-field Date input for known dates. The new app should default to the standard Date input and only add a picker if there is a proven user need.
- GOV.UK alternative: GOV.UK 'Date input' component (three text fields, no calendar)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 46

#### catch-certificate-details-table, catch-certificate-details__grid-row, catch-certificate-details__grid-column-{15,20,50,60,one-third,two-thirds}, catch-certificate-details__grid-row-border-bottom, catch-certificate-details__table-header, catch-certificate-details__add-document

- What it does: Bespoke IPAFFS grid/table CSS used to lay out the Commodity code / Species checkbox rows and column widths.
- Concern: Custom layout classes duplicate what govuk-grid-* / govuk-table could do. The species picker is a checkbox-per-row table; rebuild with a GOV.UK Table or govuk-grid columns rather than bespoke percentage-width classes.
- GOV.UK alternative: GOV.UK 'Table' or standard govuk-grid-column-* widths
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 46

#### link-button, link-hover-highlight, link-no-underline

- What it does: <button> elements styled to look like links — used for 'Save and return to manage catch certificates' and 'Save and return to hub'.
- Concern: Buttons rendered as links is a GDS anti-pattern for primary/secondary submit actions. Use a real secondary govuk-button (govuk-button--secondary) or a proper link, not a button masquerading as a link.
- GOV.UK alternative: GOV.UK 'Button' with govuk-button--secondary, or a standard link
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 46

#### aria-live-message, sr-only, autocomplete__status

- What it does: Screen-reader live-region / visually-hidden status text for the autocomplete and date-picker widgets.
- Concern: These exist to patch a11y for the custom widgets above; they disappear if the standard govuk components are used. Not a requirement in themselves — a symptom of the bespoke widgets.
- GOV.UK alternative: Not needed once standard govuk Select / Date input are used (they ship their own a11y)
- Evidence: trace db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d action 46

### notification-search-view

#### search-panel / search-filter-form / search-hidden / hidden-search (button)

- What it does: Collapsible/expandable search filter panel wrapping the whole search form; a "hidden-search" toggle button and search-hidden state class show/hide the filters
- Concern: Bespoke show/hide filter widget with its own toggle button, not a Design System component. IPAFFS-specific layout scaffolding.
- GOV.UK alternative: GOV.UK does not ship a filter panel; the MoJ 'Filter a list' pattern (govuk-frontend-compatible) or a plain fieldset of inputs + a Details/disclosure for advanced filters would replace it.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### defra-datepicker / date-picker__* / date-input--picker / date-picker__dialog

- What it does: Custom calendar date-picker overlay (Choose date button opens a dialog with previous/next month controls and a date table) layered on top of the standard govuk-date-input day/month/year fields
- Concern: Custom JS calendar widget — not part of govuk-frontend. Adds a dialog, month navigation and a date grid. Accessibility and maintenance burden.
- GOV.UK alternative: The plain GOV.UK Date input (day/month/year text fields) is the standard; the calendar overlay is an enhancement the new app may choose to drop. No govuk calendar component exists.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### notification-list / notification-list__row / notification-list__row-container / notification-list__value / notification-list__heading / notification-list__grid-column-20|25|30 / notification-list__links

- What it does: Bespoke results-list layout: each search result is a card built from definition-list (term/definition) rows for Reference number, Commodity, Arrival at BCP or POE, CHED status, Consignee, Consignor, Origin, Inspection, plus a links column (Copy as new / View details / Amend / Show notification)
- Concern: Custom grid/card component with its own column-width classes (grid-column-20/25/30). Not a govuk-summary-list nor a govuk-table. Core dashboard listing surface.
- GOV.UK alternative: Could be rebuilt as a govuk Table with a row per notification, or a summary-card pattern; the status column would use govuk-tag and the action column a govuk-button-group.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### pagination / pagination-list / pagination-item / pagination-item-next / pagination-link / pagination-link-icon / pagination-link-label / pagination-link-title

- What it does: Bespoke pagination control ("Next page", ":2 of 4000") for paging the 155438-result set
- Concern: Custom pagination markup predating the official govuk Pagination component.
- GOV.UK alternative: GOV.UK Pagination component (govuk-pagination) is a direct drop-in replacement.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### info-summary / info-summary__title / info-summary__body / info-summary__list

- What it does: "Chosen for inspection" callout box summarising consignments that must go to a BCP, with a link to view them
- Concern: Custom summary/callout component, not a Design System pattern.
- GOV.UK alternative: GOV.UK Inset text or Notification banner could carry the same message.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### notification-banner--alert / notification-banner__content--full-width / notification-button

- What it does: Custom modifier variants of the notification banner used for the dashboard Alert/Information messaging feed, plus a custom notification-button
- Concern: Extends govuk-notification-banner with IPAFFS-specific full-width and alert variants beyond the standard component.
- GOV.UK alternative: Standard govuk-notification-banner (with the built-in success/default variants) covers most of this.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### link-button / clear-link / tag--fixed-width

- What it does: Links styled as buttons (Create a new notification, Clone a certificate), a clear-filter link, and a fixed-width status tag variant
- Concern: Custom link/tag styling on top of or instead of govuk-button / govuk-tag.
- GOV.UK alternative: govuk-button (with href) for link-buttons; govuk-tag for the status tags without the custom fixed-width class.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### sr-only / aria-live-message

- What it does: Screen-reader-only text and an ARIA live region for announcing search/sort updates
- Concern: Duplicates govuk-visually-hidden (which is also present). Minor; keep the live-region behaviour.
- GOV.UK alternative: govuk-visually-hidden for the sr-only text.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 150

#### review-summary-list / review-summary-list__row / review-summary-list__key / review-summary-list__value / review-summary-list__action / review-summary-list__row-border-top / review-summary-list__row-border-bottom

- What it does: VIEW PAGE: bespoke summary-list variant used across the notification review view rows
- Concern: Custom reimplementation of govuk-summary-list with extra border modifiers. The view page mixes real govuk-summary-list with this custom review-summary-list.
- GOV.UK alternative: govuk-summary-list (with __row, __key, __value, __actions) is the direct equivalent.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot

#### review-table / review-additional-documents-table / review-latest-health-certificate-table / presentation-table / presentation-table__section / presentation-table__row--no-border / table-responsive / table--fixed

- What it does: VIEW PAGE / Checks tab: bespoke table wrappers for the accompanying-documents, health-certificate, seal-numbers and decision-information tables
- Concern: Custom table classes layered onto govuk-table for responsive/fixed layouts and presentation-only tables.
- GOV.UK alternative: govuk-table with responsive handling; presentation tables of key/value data are better modelled as govuk-summary-list.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot

#### audit-flag / audit-flag__date / audit-flag__user

- What it does: VIEW PAGE: "Last updated ... by Percy Inspector-Tester" / "Submitted ... by Michael Scott" audit metadata block at the top of the review view
- Concern: Custom audit-trail display component; not a Design System pattern.
- GOV.UK alternative: Could be a govuk-summary-list or plain govuk-body paragraphs.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot

#### copy-button / action-button / action-button-container / button-small / heading-with-change-link / change

- What it does: VIEW PAGE: 'Copy' buttons beside each reference (CHED reference / customs declaration reference / customs document code), small action buttons and inline change-links beside headings
- Concern: Custom copy-to-clipboard and small-button styling not in the Design System.
- GOV.UK alternative: govuk-button--secondary for the copy actions; there is no govuk copy-to-clipboard component so the JS behaviour would remain custom.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot

#### check-status / checks-row-0 / checks-row-1 / checks-row-2 / lab-test-required

- What it does: VIEW PAGE / Checks tab: styling for the inspector check results rows (Documentary check / Full identity Check / Physical check — each Satisfactory) and lab-test-required flag
- Concern: Custom classes for the inspector-check result display.
- GOV.UK alternative: govuk-summary-list or govuk-table with govuk-tag for the Satisfactory status.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot

### attachments-tab

#### defra-datepicker / date-picker__* / date-input--picker / date-picker__dialog / date-picker__button__* / date-picker__reveal__icon

- What it does: Bespoke DEFRA calendar-picker widget layered on the govuk date input — a 'Choose date' button reveals a month-grid dialog (Previous/Next month, Cancel) to pick the issue date.
- Concern: Custom JS/CSS widget with its own dialog markup; not part of govuk-frontend. Adds a whole interactive component to build and a11y-test.
- GOV.UK alternative: GOV.UK Design System has no core datepicker — use the plain Date input (day/month/year) alone, or adopt the MoJ Frontend datepicker if a picker is genuinely required.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 162

#### additional-documents__* (additional-documents-table, additional-documents__headers, additional-documents__table-header, additional-documents__grid-row, additional-documents__grid-column-15/35/doc-date, document-grid-row)

- What it does: Bespoke CSS-grid layout used to render the document listings (catch certificates, health certificate, cloned, additional) and the inspector add-document row as column-aligned tables.
- Concern: Hand-rolled grid instead of a semantic table; harder to make accessible and maintain; the column headers are plain generics not <th>.
- GOV.UK alternative: GOV.UK Table component for the read-only document listings; standard form-group rows for the add-document inputs.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 162

#### link-button / no-wrap

- What it does: Buttons styled to look like links ('Add attachment', 'Add another document', 'Download', 'Download all documents').
- Concern: A <button> or <a> given custom link-button styling rather than a standard component; visual/semantic intent is ambiguous.
- GOV.UK alternative: govuk-button with govuk-button--secondary for actions, or a plain govuk-link for navigation/download links.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 162

#### heading-tertiary

- What it does: Custom tertiary heading style used within the document sections.
- Concern: Non-standard heading class rather than a govuk-heading-* size.
- GOV.UK alternative: govuk-heading-s / govuk-heading-m.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 162

#### sr-only / short-date-input / aria-live-message / add-document-attachment / add-document-content / ellipsis

- What it does: Assorted utility/bespoke classes: sr-only duplicates govuk-visually-hidden; short-date-input sizes the date fields; aria-live-message is a live region for the datepicker; add-document-* wrap the inspector form; ellipsis truncates filenames.
- Concern: Duplication of govuk utilities and project-specific helper classes outside the design system.
- GOV.UK alternative: govuk-visually-hidden for sr-only; govuk width overrides for sizing; govuk-!- spacing utilities.
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 162

### bip-notifications-dashboard

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__date-table, date-picker__button__next-month, date-input--picker, .govuk-date-input with a 'Choose date' calendar button

- What it does: A bespoke DEFRA JS calendar/date-picker widget bolted onto the standard govuk-date-input Day/Month/Year fields, with a 'Choose date' button opening a pop-up calendar dialog and ❮ ❯ month navigation.
- Concern: The GOV.UK Design System has no date-picker component — the standard pattern is the plain three-part Date input with no calendar. This is a custom widget (and a known GDS anti-pattern debate). The new app should decide whether to keep the plain govuk-date-input or adopt the MoJ date-picker component rather than re-implementing DEFRA's bespoke one.
- GOV.UK alternative: govuk-date-input (plain, no calendar) or the MoJ Frontend date-picker component
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 167 (class inventory: defra-datepicker, date-picker__*)

#### notification-list__row, notification-list__row-container, notification-list__heading, notification-list__value, notification-list__links, notification-list__grid-column-20 / -25 / -30

- What it does: Bespoke results-list layout — each search result is a card built from a definition list (dt/dd) with custom grid-column width classes, showing Reference Number, Commodity, Estimated arrival time, CHED status, Consignee, Consignor, Origin, Risk outcome and a 'View CHED' link.
- Concern: Custom card/list markup instead of a Design System component. The new app rebuilding the results view should express this with govuk-summary-list per card, or a govuk-table, rather than bespoke grid-column-NN classes.
- GOV.UK alternative: govuk-summary-list (per result card) or govuk-table for a tabular results view
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 167 (class inventory: notification-list__*)

#### pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: Bespoke pagination control for the results list.
- Concern: GOV.UK ships a standard Pagination component (govuk-pagination) — this hand-rolled one should be replaced by it in the rebuild.
- GOV.UK alternative: govuk-pagination
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 157 (after snapshot: .pagination present); class inventory trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 167

#### alert-dashboard-summary, alert-dashboard-summary-heading, alert-dashboard-summary-list, high-priority-task-banner-list, aria-live-message

- What it does: Bespoke 'My alerts' and 'High priority tasks' dashboard summary widgets — lists of alert-count links (e.g. '82833 notifications require an inspection') within an aria-live region.
- Concern: Custom inspector-dashboard summary markup with no direct Design System equivalent. These are decision-app (B2B) features outside the CHED-P notifier journey; the rebuild scope should confirm whether the new simple CHED-P app owns any of this inspector dashboard at all.
- GOV.UK alternative: No direct equivalent; could be composed from govuk-summary-list / a list of links, but this is inspector-app surface likely out of scope for the CHED-P rebuild.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 167 (class inventory + a11y refs e97-e151)

#### search-and-filter-form, search-panel, form-group, form-label-bold, clear-link, link-button, break-word, sr-only, tag, display-inline-block

- What it does: Assorted bespoke wrapper/utility classes: the search+filter form container, a legacy 'form-group'/'form-label-bold' (pre-govuk naming), a 'link-button' styled anchor, a legacy 'tag' and 'sr-only' (non-govuk visually-hidden), 'break-word' and 'display-inline-block' utilities.
- Concern: A mix of legacy/pre-Design-System class names (form-group, form-label-bold, sr-only, tag) coexisting with modern govuk-* equivalents — evidence the page predates or was partly migrated to govuk-frontend. The rebuild should use govuk-form-group, govuk-label--s, govuk-visually-hidden and govuk-tag consistently.
- GOV.UK alternative: govuk-form-group, govuk-label--s, govuk-visually-hidden, govuk-tag, govuk-!-display-inline-block
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 167 (non-govuk class inventory)

### bip-notification-hub

#### banner banner-info (intensified official control banner above main)

- What it does: Shows the intensified-official-control heading, a linked commodity with establishment/test details, and the instruction 'Select the commodity to view the intensified official control'.
- Concern: This conditional information panel uses legacy custom banner classes rather than a GOV.UK notification banner and sits outside the main element.
- GOV.UK alternative: GOV.UK Notification banner placed within main, preserving the trace-confirmed copy and commodity link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 172 (before snapshot and DOM outerHTML)

#### govuk-table (id=validate-import-notification-table, role=presentation) used to render the inspector task list

- What it does: Lays out the seven checks (Local reference number, Documentary check, Identity and physical checks, Seal numbers, Laboratory tests, Decision, Review and submit) as table rows, each with a navigation link in the left cell and a status tag in the right cell
- Concern: This is semantically a task list but is implemented as a presentation table rather than the GOV.UK Task list component. It hand-rolls the row/tag layout and mixes anchors and form-submit buttons as the row 'titles'.
- GOV.UK alternative: GOV.UK Task list component (govuk-task-list) — each item is a link + status tag, which is exactly this page's intent
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 170

#### link-button (button.govuk-link.link-button inside a POST form)

- What it does: The 'Decision' and 'Review and submit' task rows are submit buttons (POST to 'hub' with name/value decisionNotification / reviewNotification, plus hidden crumb + etag) styled to look like the plain govuk-link anchors used by the other rows
- Concern: Two of the seven task rows are form submissions dressed as links, while the other five are real anchors. Inconsistent interaction model within one list; the POST also carries an etag optimistic-concurrency token.
- GOV.UK alternative: In the new app these can be plain links (GET) within a Task list, or if a POST is genuinely needed, a govuk-button — not a link-styled submit
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 170

#### notification-banner--warning / notification-banner--inspection-required + notification-banner__content--full-width

- What it does: Custom colour/emphasis and full-width modifiers layered onto the govuk-notification-banner to signal the risk-assessment outcome
- Concern: Non-standard visual modifiers on the notification banner; the component is being repurposed as a status/decision panel rather than a plain notification.
- GOV.UK alternative: Standard Notification banner, or an inset text / panel with a govuk-tag for status; keep to the toolbox colours
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 170; trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 172

#### heading-tertiary (span inside the H1)

- What it does: Renders the CHED reference number and ' - V<n>' version at a smaller size within the H1, above the 'Decision Hub' primary title
- Concern: Custom typographic class doing the job of a section caption inside the heading rather than a separate govuk-caption-xl above the H1
- GOV.UK alternative: govuk-caption-xl above the H1 (standard GOV.UK caption-over-heading pattern)
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 170

#### badge-right, tag (legacy)

- What it does: badge-right right-aligns the status tag cell; 'tag' is a legacy tag class carried alongside the standard govuk-tag on every status strong
- Concern: Bespoke alignment helper plus a redundant legacy tag class; both are IPAFFS-specific carryover
- GOV.UK alternative: Task list component handles tag placement natively; drop the legacy 'tag' class and use govuk-tag alone
- Evidence: trace 041c29c39002db28bc43ff85691f757cec6e31db action 170

### documentary-check

#### banner banner-info (intensified official control banner above main)

- What it does: Shows the intensified-official-control heading, linked commodity/establishment/test details and the instruction to select the commodity.
- Concern: This conditional information panel uses legacy custom banner classes rather than a GOV.UK notification banner and sits outside the main element.
- GOV.UK alternative: GOV.UK Notification banner placed within main, preserving the trace-confirmed copy and commodity link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 173; trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 156 (after snapshot)

#### notification-banner--inspection-required

- What it does: Custom BEM modifier on the govuk-notification-banner, styling the 'Inspection required' banner (likely a distinct colour/emphasis from the default grey/blue notification banner)
- Concern: Bespoke IPAFFS styling extending a standard component; the new app would need its own CSS or a govuk-frontend-supported variant to reproduce it
- GOV.UK alternative: Standard Notification banner (with default or --success variant), or Warning text / Inset text depending on intent
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 173

#### notification-banner__content--full-width

- What it does: Custom modifier making the banner content span full width rather than the default constrained width
- Concern: Non-standard layout override on the banner content region
- GOV.UK alternative: Use grid columns to control width instead of overriding the banner internal layout
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 173

#### heading-tertiary

- What it does: Custom class wrapping the reference number + version caption span inside the H1 (CHEDP.GB.2026.1525975 - V1)
- Concern: Bespoke class used as a caption within the heading rather than the standard govuk-caption-* pattern
- GOV.UK alternative: govuk-caption-xl / govuk-caption-l above the heading
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 173 (main.html)

#### govuk-radios__conditional wrapping a Character count whose label is an <h1>

- What it does: The 'Additional details (optional)' character-count field sits inside the conditional reveal; its govuk-label-wrapper is an <h1> element (govuk-frontend default macro markup when labelIsPageHeading is set), producing a second, visually-styled-as-label <h1> in the DOM
- Concern: Two <h1> elements exist on the page (the real page H1 and this label-wrapper H1). Semantically a page should have one H1; the label should not be an H1 when it is not the page heading
- GOV.UK alternative: Render the character-count label as a plain govuk-label (labelIsPageHeading=false)
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 173 (main.html)

### identity-physical-check

#### banner banner-info (intensified official control banner above main)

- What it does: Shows the intensified-official-control heading, linked commodity/establishment/test details and the instruction to select the commodity.
- Concern: This conditional information panel uses legacy custom banner classes rather than a GOV.UK notification banner and sits outside the main element.
- GOV.UK alternative: GOV.UK Notification banner placed within main, preserving the trace-confirmed copy and commodity link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

#### alert-info-white-bg

- What it does: Applied to the conditional reveal panel that holds the identity-check result radios; adds a bespoke info/alert background styling on top of the standard govuk-radios__conditional reveal.
- Concern: Custom (non-govuk) styling wrapper on a conditional reveal — not part of the Design System. Implies IPAFFS visually distinguishes the revealed result block from the surrounding form.
- GOV.UK alternative: None needed — the govuk-radios conditional reveal already handles show/hide; drop the custom background or replace with Inset text if visual separation is genuinely required.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

#### form-control-1-2

- What it does: Legacy width utility on the "Reason" text input, duplicating govuk-!-width-one-half which is also present.
- Concern: Bootstrap-era / legacy class carried alongside the govuk width utility; redundant. Signals mixed styling heritage.
- GOV.UK alternative: govuk-!-width-one-half (already applied) — drop form-control-1-2.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

#### heading-tertiary

- What it does: Wraps the reference-number + version caption span inside the H1.
- Concern: Custom class for the caption-within-heading pattern rather than the standard govuk-caption-xl placed above the H1.
- GOV.UK alternative: govuk-caption-xl / govuk-caption-l as a sibling caption above the H1.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

#### notification-banner--inspection-required / notification-banner__content--full-width

- What it does: IPAFFS-specific modifier of the govuk-notification-banner giving the inspection-required banner a full-width content area and bespoke colour.
- Concern: Extends the standard notification banner with custom modifiers; the rebuild should decide whether a plain notification banner (or Warning text) conveys the same intent.
- GOV.UK alternative: Notification banner (standard) or Warning text for the non-override message.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

#### identity-check-type / identity-check-result / physical-check-result / physical-check-not-done-reason

- What it does: Hook classes on the govuk-form-group / radios__item wrappers used to bind the app's conditional-reveal JavaScript.
- Concern: Non-govuk hook classes driving bespoke client-side reveal logic (on top of the standard data-module=govuk-radios). The nested conditional-within-conditional pattern (type -> result, physical Not Done -> reason -> Other free text) is more deeply nested than the Design System's single-level conditional reveal recommends.
- GOV.UK alternative: govuk-radios conditional reveal handles one level natively; deeper nesting may be better split across pages in the rebuild.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 176

### laboratory-test-required

#### banner banner-info (intensified official control banner above main)

- What it does: Shows the intensified-official-control heading, linked commodity/establishment/test details and the instruction to select the commodity.
- Concern: This conditional information panel uses legacy custom banner classes rather than a GOV.UK notification banner and sits outside the main element.
- GOV.UK alternative: GOV.UK Notification banner placed within main, preserving the trace-confirmed copy and commodity link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 180 (after snapshot); trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 164 (after snapshot)

#### span.heading-tertiary (nested inside the govuk-heading-xl H1, wrapping span#reference-number and span#cved-version-number)

- What it does: Renders the CHED reference number and version ('CHEDP.GB.2026.1525975 - V1') as a small caption line above the visible page title, but placed INSIDE the H1 element rather than as a separate caption before it.
- Concern: Non-standard IPAFFS-specific class instead of the Design System caption pattern. Putting the reference inside the H1 means the accessible name of the heading includes the reference string. The new app should render the caption with govuk-caption-xl as a sibling before the heading text, not nested inside it.
- GOV.UK alternative: govuk-caption-xl (or govuk-caption-l) placed as a <span> immediately before the heading text
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 180 (main180.html)

#### div#container-seals-hint.govuk-hint.govuk-visually-hidden with text 'Choose from:'

- What it does: A visually-hidden hint associated with the radio group; the id 'container-seals-hint' is left over from a different (container seals) template.
- Concern: The stale id indicates template copy-paste; the hint is not aria-describedby-linked to the fieldset in the observed markup, so its 'Choose from:' text may not be announced. Minor, but the rebuild should either drop it or wire a real hint properly.
- GOV.UK alternative: govuk-hint correctly associated via aria-describedby on the fieldset, or omit it
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 180 (main180.html)

#### Two submit buttons ('Save and return' + 'Save and continue') sharing name='save-button', with no govuk--secondary modifier

- What it does: Both actions render as identical primary green buttons distinguished only by their submit value.
- Concern: Two primary buttons side by side is against GOV.UK guidance (one primary action per page). 'Save and return' would normally be a secondary button.
- GOV.UK alternative: govuk-button--secondary on the 'Save and return' action, or a Button group with one primary + one secondary
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 180 (main180.html)

### laboratory-test-setup

#### banner banner-info (intensified official control banner above main)

- What it does: Shows the intensified-official-control heading, linked commodity/establishment/test details and the instruction to select the commodity.
- Concern: This conditional information panel uses legacy custom banner classes rather than a GOV.UK notification banner and sits outside the main element.
- GOV.UK alternative: GOV.UK Notification banner placed within main, preserving the trace-confirmed copy and commodity link.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187

#### defra-datepicker / date-picker__* / date-input--picker (data-module="accessible-datepicker")

- What it does: A bespoke JavaScript calendar widget layered on top of the govuk-date-input for Sample date. Adds a 'Choose date' icon button that opens a role=dialog calendar (previous/next month, a date table, Cancel) with aria-live announcements.
- Concern: Not a GOV.UK Design System component — custom DEFRA widget with its own dialog, table grid and script. Adds JS/markup the standard date-input does not have, and the new app would have to reproduce or drop it.
- GOV.UK alternative: GOV.UK Date input (three text fields, no calendar). The Design System deliberately has no date picker; a plain govuk-date-input meets the need.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187 (main.html: div.govuk-date-input.date-input--picker data-module=accessible-datepicker, div.defra-datepicker dialog)

#### govuk-date-input#sample-time with date-input-hour / date-input-minute items

- What it does: Reuses the govuk-date-input component structure to collect an Hour and Minutes value (24 hour format) rather than a date.
- Concern: Repurposing the Date input component for time is a non-standard usage — the Design System has no time input pattern. The visually-hidden 'Time entry:' legend and '24 hour format' hint carry the intent.
- GOV.UK alternative: Two govuk-input text fields (Hour, Minutes) inside a govuk-fieldset — effectively what this is, but without borrowing the date-input class semantics.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187

#### heading-tertiary

- What it does: Custom span class inside the H1 that renders the reference number + version ('CHEDP.GB.2026.1525975 - V1') as a caption above the 'Laboratory tests' title.
- Concern: Bespoke class rather than the standard govuk-caption-xl/-l caption pattern.
- GOV.UK alternative: govuk-caption-xl / govuk-caption-l inside the page heading block.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187 (main.html: span.heading-tertiary)

#### sr-only / aria-live-message / hidden

- What it does: Non-govuk visually-hidden and hidden utility classes used by the custom datepicker and the Time entry legend.
- Concern: Duplicates govuk-visually-hidden; the page mixes both (the Time legend actually uses 'hidden govuk-visually-hidden').
- GOV.UK alternative: govuk-visually-hidden.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187

#### select title="Select option from"

- What it does: Every native select carries a title="Select option from" attribute.
- Concern: Cosmetic non-standard attribute, not a Design System convention; harmless but unnecessary in a rebuild.
- GOV.UK alternative: Plain govuk-select with no title attribute.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 187

### laboratory-test-results

#### defra-datepicker + date-picker__container / date-picker__dialog / date-picker__date-table / date-picker__button__* / date-picker__reveal__icon / date-picker__heading

- What it does: IPAFFS-specific graphical calendar date picker bolted onto each govuk-date-input. Adds a 'Choose date' reveal button that opens a dialog calendar grid with previous/next-month navigation and a Cancel button.
- Concern: Not part of the GOV.UK Design System. The Design System deliberately ships a plain three-box Date input with no calendar widget (GDS research shows calendars are worse for known dates). This is bespoke JS + CSS the new app should not copy.
- GOV.UK alternative: govuk-date-input (the plain day/month/year input) is already present underneath — drop the custom picker and keep just the standard component.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 201

#### heading-tertiary

- What it does: Custom heading style class applied within the page (non-govuk heading typography).
- Concern: Bespoke class rather than a govuk-heading-* utility; inconsistent with the Design System type scale.
- GOV.UK alternative: govuk-heading-s / govuk-heading-m
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 201

#### form-group (bare, no govuk- prefix)

- What it does: A non-namespaced form-group wrapper appearing alongside the standard govuk-form-group.
- Concern: Duplicate/legacy grouping class; should be the standard govuk-form-group only.
- GOV.UK alternative: govuk-form-group
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 201

#### sr-only / aria-live-message

- What it does: Visually-hidden text and an ARIA live region (used by the custom datepicker for screen-reader announcements).
- Concern: sr-only is a common utility but the Design System uses govuk-visually-hidden; the aria-live-message region is tied to the bespoke picker.
- GOV.UK alternative: govuk-visually-hidden
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 201

### decision-conclusion

#### heading-tertiary

- What it does: Wraps the CHED reference and version inside the H1 before the static "Decision" title.
- Concern: Uses a custom caption-within-heading class instead of a standard GOV.UK caption.
- GOV.UK alternative: Use govuk-caption-xl as a caption associated with govuk-heading-xl.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 206 (span.heading-tertiary contains #reference-number and #cved-version-number)

#### decision-acceptable-for / acceptChannelledAction / acceptMarketFreeCirculation / acceptSpecificWarehouse / notAcceptAction

- What it does: Adds content-specific hook classes to the overall decision form group and the nested radio items/fieldsets for conditional styling or JavaScript.
- Concern: Couples presentation and reveal behaviour to domain-specific class names. The notAcceptAction items are direct children of a fieldset and omit a govuk-radios container entirely.
- GOV.UK alternative: Use the documented govuk-radios conditional reveal markup, with stable data attributes only where application behaviour needs them.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 206 and trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 197 (all classes present in main; raw DOM shows refusal .govuk-radios__item elements without a .govuk-radios parent)

#### alert-info-white-bg

- What it does: Adds bespoke white information-panel styling to the Not acceptable conditional reveal and its nested Destruction/Other Reason reveals.
- Concern: Custom styling is layered onto govuk-radios__conditional and is not a GOV.UK Design System modifier.
- GOV.UK alternative: Use the standard govuk-radios conditional reveal without the custom background; use Inset text only if the revealed content genuinely needs additional visual separation.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 206 and trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 197 (class on #refusal, #not-acceptable-destruction-reason and #not-acceptable-other-reason)

#### form-control / form-date

- What it does: form-control supplies legacy styling to the two refusal Reason inputs; form-date wraps the standard date input.
- Concern: Legacy/custom form classes overlap with govuk-input, govuk-!-width-one-half and govuk-date-input already present on the same controls.
- GOV.UK alternative: Use govuk-input with GOV.UK width modifiers and govuk-date-input without the legacy wrappers.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 206 (raw DOM: both Reason inputs have form-control + govuk-input + govuk-!-width-one-half; date wrapper has form-date + govuk-date-input)

#### date-input-day / date-input-month / date-input-year / date-picker-day / date-picker-month / date-picker-year / defra-datepicker / date-picker__container / date-picker__container--icon / date-picker__dialog / date-picker__dialog--hidden / date-picker__header / date-picker__heading / date-picker__date-table / date-picker__reveal__icon / date-picker__button__previous-month / date-picker__button__next-month / date-picker__button__close / aria-live-message / sr-only

- What it does: Implements a custom calendar dialog over the standard Day/Month/Year fields, including reveal, month navigation, date table, close control and screen-reader live region.
- Concern: The GOV.UK Design System has no date-picker component. This custom interaction needs separate keyboard, focus, announcement and date-selection testing.
- GOV.UK alternative: Use the standard GOV.UK Date input alone. If a calendar is retained it remains a custom accessible component; govuk-visually-hidden can replace sr-only.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 197 (all classes present in main; structure exposes Choose date, Previous month, July 2026, Next month, SuMoTuWeThFrSa and Cancel)

#### hidden

- What it does: Visually hides the Channelled "Choose from:" text; it appears alongside govuk-visually-hidden.
- Concern: Duplicates a standard GOV.UK visually-hidden utility with a local class.
- GOV.UK alternative: Use govuk-visually-hidden only.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 206 (span.hidden.govuk-visually-hidden contains "Choose from:")

#### back-link--next-to-breadcrumbs

- What it does: Positions the standard Back link alongside the application's breadcrumb/navigation area outside main.
- Concern: Custom layout modifier ties the Back link to a combined navigation treatment rather than one clear GOV.UK navigation pattern.
- GOV.UK alternative: Use a standard GOV.UK Back link or Breadcrumbs according to the hierarchy.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 197 (a#back-link has classes govuk-back-link back-link--next-to-breadcrumbs)

### decision-reason-for-refusal

#### banner / banner-info

- What it does: Wraps the intensified-official-control heading, commodity bullet and explanatory text in a bespoke information banner.
- Concern: Custom information-banner styling rather than a GOV.UK Design System component; the instance-specific commodity, trader and laboratory-test text is embedded in this block.
- GOV.UK alternative: Notification banner for non-critical information, or Warning text if the intensified-control message requires stronger emphasis.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 200 (div class="banner banner-info" containing the H2, bullet list and explanatory text); trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 169 (same classes and copy)

#### heading-tertiary

- What it does: Wraps the CHED reference number and version as the first span inside the H1.
- Concern: Custom caption-within-heading pattern; a govuk-caption-xl span is also present but empty.
- GOV.UK alternative: Populate a standard govuk-caption-xl sibling above the H1 text and remove the custom heading-tertiary wrapper.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 200 (heading-tertiary contains #reference-number and #cved-version-number; following govuk-caption-xl is empty)

#### link-button

- What it does: Styles the submit control "Save and set as in progress" as a link above the page heading.
- Concern: A state-changing POST action is visually presented through bespoke link-like button styling.
- GOV.UK alternative: GOV.UK Button, using the secondary button treatment if it should be visually subordinate.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 200 (button#set-in-progress type=submit, name=setInProgress, value=IN_PROGRESS, class=link-button)

#### refusal-reasons

- What it does: Adds a page-specific hook to the standard conditional checkbox group.
- Concern: Non-GOV.UK hook class may bind page-specific behaviour or styling beyond data-module=govuk-checkboxes.
- GOV.UK alternative: The standard govuk-checkboxes--conditional component and data-module=govuk-checkboxes already provide conditional reveal behaviour; retain a data attribute only if an application hook is required.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 200 (div class="govuk-checkboxes govuk-checkboxes--conditional refusal-reasons")

#### results-div / status-label / tag

- What it does: Builds the status strip containing the blue "New" tag and the "Save and set as in progress" action; status-label and tag are additional hooks on the standard govuk-tag.
- Concern: Custom structural and hook classes surround a status already expressible with the standard Tag component and spacing utilities.
- GOV.UK alternative: GOV.UK Tag for "New", standard grid/spacing utilities for layout, and a standard secondary Button for the action.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 200 (results-div wrapper; strong classes include govuk-tag tag govuk-tag--blue status-label)

### decision-datetime-submit

#### back-link--next-to-breadcrumbs / breadcrumbs--next-to-back / navigation-links / navigation-links__divider / navigation-links__left-block / information-banner / information-banner__content

- What it does: Lays out the Back link beside Dashboard / Decision Hub breadcrumbs and styles the signed-in inspector account links above them.
- Concern: Custom navigation and account-banner layout inside main; the account links and breadcrumbs are page furniture and were excluded from the page content, while the required Back link was captured.
- GOV.UK alternative: GOV.UK Back link and Breadcrumbs without the bespoke side-by-side wrapper; service header or standard account-navigation pattern for the account links.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### results-div / status-label / tag / link-button

- What it does: Creates the decision status strip containing the blue "New" tag and makes the "Save and set as in progress" submit button look like a link.
- Concern: The status-strip layout and link-styled button are bespoke; a button that submits a state change is visually presented as navigation.
- GOV.UK alternative: GOV.UK Tag with standard spacing plus a Secondary button for "Save and set as in progress".
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### banner / banner-info

- What it does: Styles the full-width intensified-official-control information block above the review.
- Concern: Custom information banner rather than a Design System component.
- GOV.UK alternative: Notification banner, or Warning text if the control requirement needs stronger emphasis.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### heading-tertiary / heading-with-help

- What it does: Places the CHED reference and version as custom caption-like content inside the H1 and marks the H1 as supporting help content.
- Concern: The visible caption bypasses the standard caption span, while an empty govuk-caption-xl remains in the DOM.
- GOV.UK alternative: A populated govuk-caption-xl immediately before the H1 text; remove the empty caption and custom heading classes.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### audit-flag

- What it does: Groups four submission/update audit lines under the H1.
- Concern: Custom wrapper with no semantic list or description-list structure.
- GOV.UK alternative: Summary list or plain GOV.UK body paragraphs, depending on whether the labels and values need programmatic association.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### review-table / presentation-table / table--presentation / table--fixed / presentation-table__section / review-additional-documents-table / overflow-x-auto

- What it does: Provides bespoke review-table column sizing, presentation variants, document-table fixed layout, section styling and horizontal overflow.
- Concern: A large custom table system sits on top of govuk-table; several tables present label/value review data better suited to summary lists.
- GOV.UK alternative: Summary list for label/value/change rows; standard responsive GOV.UK Table for genuinely tabular document data.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### change / check-status / check-type / divider-bottom / divider-top / break-word / badge-right / ellipsis / text-align-left

- What it does: Controls review-table label, value and Change columns, row borders, wrapping, right alignment, filename truncation and the Seal numbers heading alignment.
- Concern: Bespoke table-cell utilities encode a summary-list-like layout and include truncation that can hide attachment filenames visually.
- GOV.UK alternative: Summary list key/value/actions classes; GOV.UK width and text-alignment overrides only where a true table remains.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### documentary-check-row-0 / identity-physical-checks-row-0 / identity-physical-checks-row-1 / identity-physical-checks-row-2 / identity-physical-checks-row-3 / lab-test-required / lab-test-reason

- What it does: Adds row-specific hooks for documentary, identity, physical and laboratory review results.
- Concern: Domain-specific CSS/JavaScript hooks are coupled to row order and repeated numeric suffixes.
- GOV.UK alternative: Stable semantic ids or data attributes for behaviour; standard table or summary-list classes for presentation.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### date-input--picker / date-input-day / date-input-month / date-input-year / date-picker-day / date-picker-month / date-picker-year

- What it does: Connects the standard three-part date input to the bespoke calendar picker and identifies each date part for picker synchronisation.
- Concern: Custom picker hooks augment a component designed for typed date entry; duplicated day/month/year hook sets increase coupling.
- GOV.UK alternative: Standard GOV.UK Date input without a picker, unless user research demonstrates the calendar is necessary.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### defra-datepicker / date-picker__container / date-picker__container--icon / date-picker__reveal__icon / date-picker__dialog / date-picker__dialog--hidden / date-picker__header / date-picker__heading / date-picker__date-table / date-picker__button__previous-month / date-picker__button__next-month / date-picker__button__close / aria-live-message / sr-only

- What it does: Implements an accessible calendar-dialog enhancement: "Choose date" reveal, previous/next month navigation, July 2026 heading, Sunday-to-Saturday date table, "Cancel" close control and assertive live-region announcements.
- Concern: Entirely custom DEFRA date-picker component with focus, keyboard, dialog and live-region behaviour that must be revalidated if retained.
- GOV.UK alternative: Standard GOV.UK Date input; there is no GOV.UK Design System calendar-picker component.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210 (dialog was hidden in this snapshot)

#### hidden

- What it does: Duplicates govuk-visually-hidden on the "Choose from:" and "Date entry:" fieldset legends.
- Concern: Redundant legacy visually-hidden class alongside the standard utility.
- GOV.UK alternative: govuk-visually-hidden (already present).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### submit-button

- What it does: Application-specific hook on the primary "Submit decision" GOV.UK button.
- Concern: Non-GOV.UK hook is unnecessary for styling if it only identifies the action.
- GOV.UK alternative: Standard GOV.UK Button; use the existing id or a data attribute if scripting needs a hook.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

#### govuk

- What it does: Extra class on the Dashboard breadcrumb link.
- Concern: Not a valid GOV.UK component class and appears accidental; breadcrumb is page furniture.
- GOV.UK alternative: govuk-breadcrumbs__link (already present).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 210

### bip-decision-confirmation

#### footer_feedback

- What it does: A custom-named wrapper div around the 'Tell us what we can improve' heading and the Qualtrics survey link at the foot of the confirmation page
- Concern: Non-govuk snake_case class used purely as a styling/layout hook for the feedback block. It is a cosmetic wrapper, not a bespoke widget — the content inside is standard govuk-heading-s and govuk-link. Low risk.
- GOV.UK alternative: No dedicated component needed; the feedback block can be plain govuk-body + govuk-link inside a govuk-grid-row with spacing utilities, no custom class required.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 217

#### a.govuk-button used inside <li> as a navigation link (id=print, target=_blank, rel=noopener noreferrer)

- What it does: 'View or print CHED' is an anchor styled as a primary button that opens the certificate PDF in a new browser tab
- Concern: A govuk Button component rendered as a link rather than a real button/form submit — acceptable govuk practice for a call-to-action link, but worth noting it is navigation (PDF download), not a form action. The new app should decide whether this is a button-styled link or a plain link.
- GOV.UK alternative: govuk Button component supports being rendered as a link (element: 'a'); this is a supported pattern.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 217

### record-decision-search

#### defra-datepicker / date-picker__dialog / date-picker__date-table / date-input--picker / date-picker__reveal__icon ("Choose date") / date-picker__button__previous-month / __next-month / __close

- What it does: A bespoke JS calendar/date-picker overlay bolted onto each govuk-date-input, with a 'Choose date' reveal icon, month navigation and a grid dialog.
- Concern: Not part of the GOV.UK Design System — custom widget with its own dialog markup and JS. Adds accessibility and maintenance burden the new app should avoid.
- GOV.UK alternative: GOV.UK Date input (three text fields) is already present underneath; the new app can drop the overlay and use the plain Date input, or the MoJ Date Picker component if a calendar is genuinely required.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### notification-list__row-container / notification-list__row / notification-list__grid-column-20 / -25 / -30 / notification-list__heading / notification-list__value / notification-list__links

- What it does: Bespoke CSS-grid layout for the paginated results list — each CHED rendered as a row of labelled fields (Reference Number, Commodity, Estimated arrival time, CHED status, Consignee, Consignor, Origin, Risk outcome) with a View CHED link.
- Concern: Custom grid classes, not a Design System component. Rebuild will need a deliberate decision on how to present a searchable results list.
- GOV.UK alternative: No exact match; GOV.UK does not ship a results-list component. Could be built from govuk-summary-list per card, or a govuk Table, or documented as an intentional bespoke pattern.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### pagination / pagination-list / pagination-item / pagination-item-next / pagination-link / pagination-link-icon / pagination-link-label / pagination-link-title ("Next page", "2 of 4000")

- What it does: Custom pagination control for the results list.
- Concern: Predates / diverges from the official GOV.UK Pagination component (which uses govuk-pagination* classes).
- GOV.UK alternative: GOV.UK Pagination component (govuk-pagination).
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### link-button (Today / Tomorrow / Next seven days / Clear filter)

- What it does: <button> elements styled to look like links for quick date-range presets and clearing the filter.
- Concern: Custom class; a button-styled-as-link is not a standard Design System pattern.
- GOV.UK alternative: GOV.UK Button (govuk-button--secondary) or a govuk-link, depending on intended affordance.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### alert-dashboard-summary / alert-dashboard-summary-heading / alert-dashboard-summary-list / high-priority-task-banner-list / aria-live-message

- What it does: Bespoke 'My alerts' and 'High priority tasks' dashboard summary widgets listing counts of notifications in various states.
- Concern: IPAFFS-specific dashboard markup, not Design System components.
- GOV.UK alternative: Could be composed from govuk-summary-list or a simple list; no direct DS equivalent.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### form-group / form-label-bold / tag / sr-only / break-word / display-inline-block

- What it does: Legacy non-govuk form and utility classes coexisting with the govuk-* equivalents (govuk-form-group, govuk-label--s, govuk-tag, govuk-visually-hidden).
- Concern: Duplicate legacy styling primitives indicate an older toolkit layered under the Design System; drop in favour of the govuk-* equivalents.
- GOV.UK alternative: govuk-form-group, govuk-label--s (bold label), govuk-tag, govuk-visually-hidden, govuk utility classes.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

#### search-and-filter-form / search-panel / clear-link

- What it does: Container/wrapper classes for the search+filter panel and the 'Clear' reset link.
- Concern: Layout wrappers specific to IPAFFS; harmless but non-standard.
- GOV.UK alternative: Plain govuk-grid layout wrappers; no dedicated component needed.
- Evidence: trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 221

### override-risk-decision

#### <span class="heading-tertiary"> wrapping the reference number and version inside the govuk-heading-xl H1

- What it does: Renders the reference-number + version caption ('CHEDP.GB.2026.1525976 - V1') as a smaller line above the primary title, inside the same H1 element. Contains nested spans #reference-number and #cved-version-number.
- Concern: Non-govuk class. The GOV.UK Design System pattern for a caption above a heading is a separate govuk-caption-xl element preceding the H1, not a custom span nested inside the H1. Nesting the caption inside the H1 also folds the reference number into the accessible heading name ('CHEDP.GB.2026.1525976 - V1 Override risk decision'), which is a minor a11y smell.
- GOV.UK alternative: govuk-caption-xl rendered as a sibling element immediately before the govuk-heading-xl H1 (the standard caption+heading pattern).
- Evidence: trace fcc30b8d4ec79bdb61c2af3732c13f296ba15f50 action 157; main.html — <h1 class="govuk-heading-xl"><span class="heading-tertiary">...</span><span id="page-primary-title">Override risk decision</span></h1>

#### <input name="override-decision" type="hidden" value="Required">

- What it does: A hidden form input carrying the fixed value 'Required'. There is no visible control bound to it; the actual decision is expressed by which submit action the user takes (the Yes button submits, the No link cancels).
- Concern: The override is captured as a form-submit choice (submit button value 'Yes, override risk decision') plus a hidden field rather than as an explicit radio/confirm control. This is an IPAFFS-specific server-side form convention, not a Design System pattern. The new app should model this as an explicit confirmation decision rather than a hidden field + button value.
- GOV.UK alternative: None needed as a component; the confirm/cancel intent is well served by the standard Button + Link pattern already used. The hidden field is an implementation detail to drop, not to replicate.
- Evidence: trace fcc30b8d4ec79bdb61c2af3732c13f296ba15f50 action 157; main.html

### ched-overview-replace-certificate

#### presentation-table / table--presentation / presentation-table__row--no-border / presentation-table__row--no-border-bottom / presentation-table__section

- What it does: Bespoke table styling used to render read-only key/value consignment data (About the consignment, Traders, Transport, Goods movement services, Transporter, Contact) as borderless two-column tables.
- Concern: IPAFFS renders summary key/value data as custom-styled <table> markup rather than the GOV.UK Summary list component. The new app should present this data with govuk Summary list rows, not bespoke presentation tables.
- GOV.UK alternative: Summary list (govuk-summary-list)
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### copy-button (with id copy-notification-reference-number / copy-customs-declaration-reference-number / copy-customs-doc-code)

- What it does: Client-side copy-to-clipboard buttons next to the CHED reference, customs declaration reference and customs document code.
- Concern: Copy-to-clipboard is a bespoke JS widget with no GOV.UK Design System equivalent. If retained in the new app it needs custom progressive-enhancement JS; otherwise drop it and let users select the text.
- GOV.UK alternative: None (not in the Design System)
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### tag status-label (extra classes on the govuk-tag)

- What it does: Redundant custom classes layered onto the govuk-tag status badge ('Rejected').
- Concern: The status badge is a standard govuk Tag with an extra bespoke 'tag'/'status-label' class; near-standard but the custom classes should be dropped in the rebuild.
- GOV.UK alternative: Tag (govuk-tag--red / --green etc keyed off notification status)
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### review-table / review-latest-health-certificate-table / review-additional-documents-table / check-status / check-type / documentary-check-row-0 / identity-physical-checks-row-*

- What it does: Bespoke class hooks on the document and inspector-check result tables (mostly test/selector hooks and styling).
- Concern: These are IPAFFS-specific table variants and row identifiers; the underlying markup is govuk-table so they can be replaced with plain govuk Table rows in the rebuild.
- GOV.UK alternative: Table (govuk-table)
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### heading-with-change-link / heading-tertiary / badge-right

- What it does: Custom heading layout helpers (heading with inline change link, tertiary heading style, right-aligned badge).
- Concern: Bespoke heading/layout CSS outside the govuk typography scale; the rebuild should use govuk heading classes and standard layout utilities.
- GOV.UK alternative: govuk-heading-* classes
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### divider-top / divider-bottom / divider-no-top / divider-no-bottom / border-top-none / section-break-margin

- What it does: Custom divider/border utilities used between summary sections.
- Concern: Hand-rolled dividers where govuk-section-break already exists; standardise on govuk-section-break in the rebuild.
- GOV.UK alternative: Section break (govuk-section-break)
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

#### table-responsive / overflow-x-auto / table--fixed / ellipsis / break-word / numeric / weight / packages / package-type / text-align-left

- What it does: Custom layout/utility classes for responsive scrolling tables, fixed layout, text truncation and numeric/weight cell alignment.
- Concern: Bespoke CSS utilities; some overlap govuk width/spacing overrides. Wide tables should scroll inside an overflow container but via standard patterns, not custom classes.
- GOV.UK alternative: govuk width/spacing override classes + Table
- Evidence: trace ba5323fd63dcda25ee5e37c013c511d2949410bc action 178

### ov-notifications-dashboard

#### defra-datepicker, date-picker__container, date-picker__dialog, date-picker__date-table, date-picker__button__next-month, date-picker__button__previous-month, date-picker__button__close, date-picker-day/month/year, date-picker__reveal__icon, date-picker__container--icon

- What it does: A bespoke DEFRA calendar-picker widget layered over each govuk-date-input, giving a 'Choose date' button that opens a pop-up month calendar dialog with prev/next navigation.
- Concern: Not part of the GOV.UK Design System — custom JS + CSS component. Adds a calendar overlay on top of the standard three-box date input. The new app should decide whether a calendar picker is needed at all; the GOV.UK date input alone covers manual entry.
- GOV.UK alternative: GOV.UK Date input (govuk-date-input) for manual entry; no first-party GOV.UK calendar picker exists, so a calendar overlay would remain a custom addition if required.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### date-range, search-and-filter-form, search-panel

- What it does: Layout/styling wrappers for the search-and-filter form and the date-range sub-panel.
- Concern: Custom layout classes rather than standard govuk grid/spacing utilities. Cosmetic; easily replaced with govuk-grid + govuk-!- spacing utilities in the rebuild.
- GOV.UK alternative: govuk-grid-row / govuk-grid-column-* plus govuk-!- spacing utilities.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### notification-list__row, notification-list__row-container, notification-list__grid-column-20/25/30, notification-list__grid-column--control-status, notification-list__heading, notification-list__value, notification-list__links

- What it does: A bespoke results-list grid: each consignment is rendered as a definition-list-style card (term/definition pairs) inside a custom column grid, with a Reference Number link and a 'Show CHED' link.
- Concern: This is a custom listing/table component, not a GOV.UK component. It is the core results surface of the dashboard. The new app must reproduce the same result fields but should choose a standard presentation.
- GOV.UK alternative: GOV.UK Table, or Summary card / Summary list per result, depending on desired density; the search-results pattern from the GOV.UK/DfE design catalogue.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory; result cards e229-e601)

#### pagination, pagination-list, pagination-item, pagination-item-next, pagination-link, pagination-link-icon, pagination-link-label, pagination-link-title

- What it does: A custom pagination control for the 39,673-result list.
- Concern: Not the standard govuk-pagination component. With ~40k results across pages, pagination is load-bearing and must be reproduced.
- GOV.UK alternative: GOV.UK Pagination (govuk-pagination).
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### notification-banner--alert, notification-banner__content--full-width

- What it does: Custom modifier on the govuk notification banner to render a red/critical 'Alert' variant spanning full width.
- Concern: GOV.UK notification banner has no first-party 'alert/error' colour variant beyond the success variant; this is a bespoke extension.
- GOV.UK alternative: GOV.UK Notification banner (standard or success variant); for critical system messages consider the Warning text component or a plain notification banner.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### link-button, clear-link

- What it does: Anchor styled to look like / behave as a button ('Clear all' reset), and a custom clear-link class.
- Concern: Mixing link and button semantics via custom classes; minor. Rebuild should use a proper button or link consistently.
- GOV.UK alternative: govuk-link for a reset link, or govuk-button--secondary if it should be a button.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### tag--fixed-width

- What it does: Custom modifier forcing a fixed width on the status tags so the Valid/Rejected/Control required tags align in a column.
- Concern: Non-standard tag sizing; purely cosmetic alignment.
- GOV.UK alternative: govuk-tag with layout handled by the containing grid column rather than a width override on the tag.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

#### aria-live-message, sr-only

- What it does: Screen-reader-only live-region announcements (e.g. result count / datepicker changes).
- Concern: sr-only duplicates govuk-visually-hidden (both are present). Accessibility helper; consolidate on govuk-visually-hidden in the rebuild.
- GOV.UK alternative: govuk-visually-hidden.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 221 (class inventory)

### record-control

#### defra-datepicker / date-picker__container / date-picker__dialog / date-picker__date-table / date-picker__button__* / date-input--picker (data-module="accessible-datepicker")

- What it does: A custom JavaScript calendar-popup date picker (DEFRA's own widget) layered onto the standard govuk-date-input day/month/year text fields — adds a 'Choose date' icon button that opens a modal month grid.
- Concern: The GOV.UK Design System deliberately has no date-picker component; it recommends three plain text inputs. This is a bespoke widget with its own dialog, ARIA live region and month-navigation buttons that the new app would have to reimplement or drop.
- GOV.UK alternative: govuk-date-input (three text inputs, day/month/year) with no calendar popup — already present underneath; the new app can keep just the govuk-date-input and drop the custom picker.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 228 (classes: defra-datepicker, date-picker__dialog, aria-live-message, sr-only)

#### Two <h1> elements on one page (govuk-heading-xl 'Record control' and govuk-heading-l 'Declaration')

- What it does: The page renders a second <h1> ('Declaration') styled as heading-l, in addition to the main 'Record control' h1.
- Concern: Two h1s per page is an accessibility anti-pattern (one h1 per page). Combined with fieldset legends rendered as <h3> and no <h2>, the heading hierarchy skips levels.
- GOV.UK alternative: Single h1 per page; 'Declaration' should be an <h2> and the question legends <h2>/<h3> in a consistent order.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 228 (<h1 class="govuk-heading-l">Declaration</h1>)

#### Reference number rendered as govuk-hint with govuk-!-font-size-27 inside the H1

- What it does: The consignment reference + version ('CHEDP.GB.2026.1526061 - V1') is a govuk-hint span inside the h1 with a hard-coded 27px font-size override, acting as a caption.
- Concern: IPAFFS does not use the standard govuk-caption-xl caption pattern; it hard-codes a font size and nests the caption inside the h1.
- GOV.UK alternative: govuk-caption-xl / govuk-caption-l above the h1 (the standard section-caption pattern).
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 228 (class govuk-hint govuk-!-font-size-27)

#### Reason textarea label uses govuk-!-font-weight-bold instead of govuk-label--m

- What it does: The 'Reason' textarea label applies a bold font-weight utility rather than the standard medium label modifier used by the other fields on the page.
- Concern: Inconsistent label styling within the same page; minor deviation from the standard label size scale.
- GOV.UK alternative: govuk-label--m (as used by the sibling fields).
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 228 (label class govuk-label govuk-label govuk-!-font-weight-bold for consignment-no-arrival-reason)

#### data-country-code attributes on <option> elements (Exit BCP, transport, country selects)

- What it does: Each select option carries a data-country-code attribute used by client-side JS (e.g. to filter Exit BCPs to GB).
- Concern: Custom data-attribute-driven client filtering; not part of a standard Design System component.
- GOV.UK alternative: Server-side filtered option lists sourced from a reference-data service; no client data attributes needed.
- Evidence: trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 228 (option data-country-code="GB")

### border-notification-create

#### date-picker-day, date-picker-month and date-picker-year on the Use by date and Best before date govuk-date-input__input fields

- What it does: Adds non-standard class hooks to the day/month/year inputs for the two full-date variants. The trace contains no calendar button, dialog or other picker UI, so whether these hooks have active JavaScript behaviour is not established. The Best before end month/year inputs do not carry these classes.
- Concern: These are custom classes on otherwise standard GOV.UK Date input fields. Do not treat a calendar picker as a confirmed requirement without behavioural evidence; determine whether the hooks are active or vestigial before carrying them into the rebuild.
- GOV.UK alternative: GOV.UK Date input (plain 3-box day/month/year, or month/year for 'Best before end')
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 243 (Use by date and Best before date inputs have date-picker-day/month/year classes; Best before end has only GOV.UK classes; the only main-page button is 'Save and continue')

#### <textarea id="other-labelling"> and <textarea id="other-information"> styled with class="govuk-input govuk-!-width-one-third"

- What it does: Two free-text fields ('Other labelling', 'Other information') are rendered as HTML <textarea> elements but given the single-line govuk-input class rather than govuk-textarea.
- Concern: Mismatched element/class: a textarea styled as a single-line input. In the rebuild decide intent — if multi-line free text is wanted use the GOV.UK Textarea (or Character count if a limit applies); if single-line, use a Text input with a real <input>. Do not copy the textarea-as-input hybrid.
- GOV.UK alternative: GOV.UK Textarea (or Character count), or Text input — pick to match the intended input length
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 243 (control inventory: TEXTAREA|textarea|other-labelling, TEXTAREA|textarea|other-information)

#### Top-of-form read-only key/value block built from govuk-form-group + govuk-label--m + govuk-body (and a link), NOT a govuk-summary-list

- What it does: Displays the six CHED-derived read-only values (CHED number, Commodity, Approved establishment number, Net weight, Laboratory tests, Country) as a stack of label+value form-groups. CHED number is a link to the certificate PDF; Commodity carries a 'Change' link.
- Concern: Read-only summary data is presented using form-group/label markup (labels pointing at non-form elements — the 'Commodity' label's for=commodity targets a <p>). This is semantically off. A Summary list is the Design System component for read-only key/value data with per-row 'Change' actions.
- GOV.UK alternative: GOV.UK Summary list (with actions column for the Commodity 'Change' link)
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 243 (top block HTML: label for=commodity + <p id=commodity>)

### border-notification-review

#### heading-with-change-link

- What it does: Custom flex container that places a section H2 and a 'Change' link on the same row
- Concern: GOV.UK provides this natively via the Summary card component (a titled card with an actions bar) or via per-row __actions Change links inside a summary list. IPAFFS hand-rolls the heading+link layout instead.
- GOV.UK alternative: Summary card (govuk-summary-card with __title + __actions), or govuk-summary-list__actions per row
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 251 (class inventory)

#### summary-list, summary-list__row--bottom-border

- What it does: Bespoke summary-list variant classes used alongside the standard govuk-summary-list, adding a bottom border per row
- Concern: Duplicates govuk-summary-list styling with custom CSS; the border treatment can be achieved with the standard component's default borders rather than a custom modifier.
- GOV.UK alternative: govuk-summary-list (default bordered rows)
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 251 (class inventory)

#### additional-documents-table, table-responsive

- What it does: Custom classes wrapping the documents table to make it horizontally scroll / reflow on small screens
- Concern: Not part of the GOV.UK toolbox; the Design System table has no built-in responsive wrapper. A rebuild should decide whether a table is the right pattern at all (documents could be a summary list or file list) and, if a table is kept, provide its own overflow container.
- GOV.UK alternative: govuk-table (with an overflow-x wrapper), or restructure documents as a summary list / file-upload list
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 251 (class inventory)

#### document-type, document-reference, document-attachment

- What it does: Custom column-header classes on the documents table <th> elements for per-column width/styling
- Concern: Presentation styling outside govuk-table; achievable with govuk width utility classes on the header cells.
- GOV.UK alternative: govuk-table__header + govuk-!-width-* utilities
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 251 (class inventory)

#### button-small

- What it does: Custom modifier shrinking the 'Delete Border notification' button below the standard GOV.UK button size
- Concern: GOV.UK Design System has no small-button variant; a smaller button is a deliberate deviation. A rebuild should use the standard button size, or express delete as a warning link/secondary button.
- GOV.UK alternative: govuk-button (standard size) or a warning link
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 251 (class inventory)

### border-notifications-dashboard

#### defra-datepicker / date-picker__dialog / date-picker__date-table / date-picker__button__next-month / date-picker__button__previous-month / date-picker__button__close / date-input--picker / date-picker__reveal__icon

- What it does: A bespoke DEFRA calendar-picker widget bolted onto each govuk-date-input, with a 'Choose date' reveal icon that opens a month-grid dialog (heading e.g. 'July 2026', previous/next-month and Cancel buttons).
- Concern: Not part of the GOV.UK Design System. The Design System deliberately ships only the manual day/month/year Date input and advises against calendar pickers. Reproducing this couples the rebuild to bespoke JS and an accessibility surface that must be re-tested.
- GOV.UK alternative: GOV.UK Date input (manual day/month/year) with no calendar overlay — already present underneath; the picker could simply be dropped.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

#### notification-list / notification-list__row-container / notification-list__row / notification-list__heading / notification-list__value / notification-list__links / notification-list__grid-column-20 / __grid-column-25 / __grid-column-30

- What it does: A bespoke results-list widget: each border notification is a card built from a definition list (Reference Number, CHED Number, Country, Status, Hazard Category, Commodity, Approval Number) with a 'View details' link, laid out with custom 20/25/30 grid-column classes.
- Concern: Custom card/grid markup outside the Design System. IPAFFS uses its own column-width classes rather than govuk-grid or a govuk-summary-list.
- GOV.UK alternative: GOV.UK Summary list per card, or a responsive GOV.UK Table, could present the same fields; govuk-grid-column-* replaces the bespoke column widths.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

#### pagination / pagination-list / pagination-item / pagination-item-next / pagination-link / pagination-link-icon / pagination-link-label / pagination-link-title

- What it does: A bespoke pagination control rendering 'Next page : 2 of 99' with an icon; the standard Pagination component was not used.
- Concern: The GOV.UK Design System has a first-class Pagination component; this hand-rolled one duplicates it with custom classes.
- GOV.UK alternative: GOV.UK Pagination component.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

#### link-button

- What it does: Applied to the 'Today' / 'Yesterday' / 'Last seven days' date-range shortcut buttons — a <button> visually styled as a link.
- Concern: A button-styled-as-link is a non-standard pattern; the Design System distinguishes buttons (actions) from links (navigation).
- GOV.UK alternative: A govuk-button--secondary group, or plain govuk-link elements if they act as navigation.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

#### search-form / search-panel

- What it does: Wrapper classes around the whole filter form / search panel region.
- Concern: Bespoke container styling; not itself harmful but indicates custom CSS scaffolding around the filters rather than pure Design System layout.
- GOV.UK alternative: Plain govuk-grid layout with a fieldset; no bespoke panel class needed.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

#### sr-only / aria-live-message / tag--fixed-width / clear-link / break-word / link-button

- What it does: Assorted utility classes: sr-only/aria-live-message for screen-reader-only live regions, tag--fixed-width to normalise status tag widths, clear-link for the 'Clear' link, break-word for long values.
- Concern: Minor bespoke utilities layered on top of govuk-*; each is small but they accumulate into an IPAFFS-specific CSS layer the rebuild should avoid inheriting.
- GOV.UK alternative: govuk-visually-hidden replaces sr-only; govuk-tag needs no fixed-width override; govuk-!-* spacing utilities cover the rest.
- Evidence: trace b33079fe57217f74816f788ca3251fc2828669c0 action 257

### amend-notification-hub

#### phase-tag (applied alongside govuk-tag govuk-tag--blue / govuk-tag--grey on the status <strong>)

- What it does: IPAFFS-specific extra class layered onto the standard GOV.UK Tag used for the per-section status indicator. Presentational/hook class; the visible styling still comes from the govuk-tag colour modifiers.
- Concern: Not part of the GOV.UK Design System — a bespoke class name that likely exists as a CSS/selector hook or for legacy styling. Carries no additional semantics beyond the govuk-tag it decorates.
- GOV.UK alternative: Plain GOV.UK Tag (govuk-tag with a colour modifier) inside the Task list status slot — no extra class needed in the rebuild.
- Evidence: trace 78e362e35633d0c3356e5ed742f2c440551412ba action 153

### clone-search

#### defra-datepicker, date-input--picker, date-input-{day,month,year}, date-picker-{day,month,year}, date-picker__container, date-picker__dialog, date-picker__header, date-picker__heading, date-picker__date-table, date-picker__button__*, date-picker__reveal__icon

- What it does: Adds a bespoke calendar picker to the standard three-part Certificate date of issue input. 'Choose date' reveals a modal month grid with Previous month, Next month and Cancel controls; the hidden snapshot is labelled 'July 2026'.
- Concern: Custom calendar widget outside the GOV.UK Design System, with substantial bespoke interaction and accessibility code. This is unnecessary for a known certificate issue date unless research demonstrates a need.
- GOV.UK alternative: GOV.UK Date input (Day / Month / Year) without a calendar picker
- Evidence: trace a8789bdec815686e1bab99b8d980755a3e678bd6 action 18 (main class inventory and raw HTML)

#### aria-live-message, sr-only

- What it does: Provides the custom date-picker's visually hidden 'Choose date' label and assertive live-region announcements.
- Concern: Bespoke accessibility support required by the custom calendar widget; sr-only is a legacy custom utility rather than govuk-visually-hidden.
- GOV.UK alternative: govuk-visually-hidden where hidden text is still required; remove the custom live region if the standard GOV.UK Date input is used
- Evidence: trace a8789bdec815686e1bab99b8d980755a3e678bd6 action 18 (button span.sr-only and p.aria-live-message.sr-only)

#### notification-button

- What it does: Adds IPAFFS-specific styling to the 'Create a new notification with attachment' govuk-button on the Unable to clone outcome.
- Concern: Custom modifier on a standard GOV.UK button; its purpose is not expressed semantically and may duplicate standard button styling.
- GOV.UK alternative: GOV.UK Button, using a standard modifier only if the action hierarchy requires one
- Evidence: trace a8789bdec815686e1bab99b8d980755a3e678bd6 action 22 (after frame snapshot: button#create-notification)

### manage-your-authorisations

#### Toggle

- What it does: Controls whether delegation requests from importers/exporters are automatically accepted.
- Concern: The finding records the accessible text and current Yes state but not the underlying markup, keyboard behaviour or save interaction.
- GOV.UK alternative: Confirm whether this should be a GOV.UK radios question or another accessible persisted setting.
- Evidence: trace cc6cea8221f684d1090a9a3f0f15cf782b46de84 action 20

## All open questions — exact-deduped

All 596 whitespace-normalised unique source `openQuestions` are retained below. Similar page-specific questions are not collapsed because they concern different facts. Questions from the consolidated redispatch source are carried under decision-datetime-submit.

### notifications-dashboard

- This is the IPAFFS all-types dashboard, not a CHED-P-specific page. For the new CHED-P app the load-bearing requirement is the journey ENTRY POINT: the 'Create a new notification' link -> /notification/vnet/protected/notifications/consignment/page-1?source=dashboard. Whether the new app also needs a full notifications list/search/dashboard, or just an entry point + list of the user's own CHED-P drafts, is a product-scope question.

- The search filter form spans all CHED types (BCP/POE, status, country, notification type incl. CHED-A microchip). How much of this filtering the simple CHED-P app needs is undecided — much of it (microchip, cross-type filters, 254-entry BCP list) may be out of scope.

- Notification-card data shape (observed on each list item): Reference number, Commodity (code), Arrival at BCP or POE (date), CHED status (tag), Consignee, Consignor, Origin (country), Inspection (Required / Not required / Check GVMS). This is the summary model for a submitted/draft CHED-P and should corroborate the review/confirmation pages.

- Per-card actions observed: Copy as new, View details, Amend, Show notification (PDF certificate). 'Clone a certificate' is a separate top-level action -> /cloning/type. Cloning was ruled OUT of first-pass CHED-P scope (see RULINGS.md).

- The BCP/POE and Country-of-origin selects are reference data (284 and 257 options in the cited trace); representative options are captured verbatim and counts recorded. The new app must source these from a reference-data service, not hardcode. Note the BCP list is polluted with test/sandbox orgs in this sandbox environment.

- No back link and no section caption on this page (it is the journey entry point / home).

- Alert and Information message banners at the top are operator broadcast messages (dismissible), not part of the CHED-P data model — platform chrome, likely out of scope.

- The QA page object exposes a 'Yesterday' quick-date button at page-objects/notification/NotificationDashboardPage.ts:56, but the trace rendered only Today, Tomorrow, Next seven days and Clear date range, and no CHED-P test invokes Yesterday. Confirm whether Yesterday is a role/environment variant or a stale locator.

- No QA page-object counterpart was found for the rendered BCP or POE, Consignee / Importer, Notification type, Microchip number or Sort by fields. Their trace-confirmed definitions are preserved, but QA independently corroborates only keyword, commodity, status, country and date filtering.

- DELEGATED AUTHORITY / CROSS-TYPE: there is no CHED-P DoA dashboard journey in the corpus. Current Organisation, Trade Partner ownership, agent/client-member access and normal post-submit actions were rendered on CHED-PP Plant or type-agnostic fixtures and are carried into CHED-P for POAO organisations. Draft non-visibility is supported by the catalogued CHED-PP trace b701cc405623fb2d2e2b2dedcf2bec3d10dfb954 in doa-findings/_discovery.md.

### import-type

- The rendered radio label for the CHED-P option is 'Products of animal origin, germinal products or animal by-products' (with 'or') — the task brief and other docs say '...and animal by-products (POAO)'. The verbatim UI copy uses 'or', not 'and', and has no '(POAO)' suffix.

- The fieldset legend is empty in the DOM; the H1 doubles as the question label. A rebuild using govuk-frontend Radios would normally put the question in the legend (as an H1 inside the legend) rather than a separate H1 with an empty legend.

- RESOLVED FROM LEGACY: no error-state trace captured the missing-selection copy, but the authorised legacy validator supplies 'Select the type of import' (ipaffs-frontend-notification/service/src/validation/messages/en.js:94; wired at validation/routes/handlers/importer/consignment_importing.js:13-18 and asserted at test/validation/routes/handlers/importer/consignment_importing_test.js:9-18).

- The radio option values are IPAFFS internal codes (CVEDA / CVEDP / CED / CHEDPP); the new app need not reuse these codes but must map the same four choices.

- A near-identical import-type page exists in the cloning journey (page-objects/notification/cloning/CloningTypePage.ts) — same 'Products of animal origin' / 'Plants, plant products and' radios but a 'Continue' button (not 'Save and continue'). Cloning is out of CHED-P scope per RULINGS, so this variant is noted only, not specced. Confirm cloning stays out for the rebuild.

- Legacy policy point: this shared journey makes cert-type mandatory in frontend Joi, but Notification.type has no downstream-model @NotNull annotation (ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/representation/Notification.java:89-90). A CHED-P-only rebuild may not need a four-way type-selection page at all; if retained, the legacy required rule is clear.

### country-of-origin

- RESOLVED FROM LEGACY: although the country select has no HTML required attribute, server-side Joi requires it for CVEDP and supplies 'Select the country of origin of the animal or product' for both missing and empty submissions (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/consignment_origin.js:10-24; messages/en.js:64; asserted at test/validation/routes/handlers/importer/consignment_origin_test.js:9-32). The downstream model separately uses 'Country of origin' (ValidationMessages.properties:86).

- The page object exposes THREE submit buttons — 'Save and continue' (create), 'Save and review', and 'Save and return to hub' (both edit/amend contexts) (CountryOfOriginPage.ts:10-19). Only 'Save and continue' was rendered in our CHED-P corpus. Confirm the new app's edit/hub flows need the two variant submit labels, or whether a single 'Save and continue' plus a task-list return suffices.

- Northern Ireland (GB-NIR) is treated as NON-EU (isEu:false) for POE-list purposes but is distinct from pure ROW (it retains Scotland dummy POEs) (ched-p-poe-validation.spec.ts:21-24). Confirm the intended NI classification rule in the new app — it is a three-way branch (EU / NI / ROW), not a binary EU/ROW split, at least for downstream POE behaviour.

- Changing country of origin clears the downstream Purpose selection (ched-p-manipulation.spec.ts:44-48). Confirm this cascade/clear-on-change rule is a deliberate requirement to carry forward, and enumerate exactly which downstream answers are invalidated when country changes (Purpose observed; POE and risk are also re-derived).

- Evidence pointer for the second confirmed pair described 'EU (Austria)' but the trace actually selects Germany (DE). Same page and same action id (14), so not a wrong-page issue — just a country-value mismatch in the pointer note.

- The URL query param is type=CVEDP (IPAFFS's internal code for CHED-P). The route is /protected/notifications/consignment-origin. The select has 254 total options: one empty-value 'Select a country' placeholder plus 253 reference-data choices, including England/Scotland/Wales/Northern Ireland as separate options (GB-ENG/GB-SCT/GB-WLS/GB-NIR). The new app should source the choices from a reference-data service, not hardcode them. Only the first 20 options are transcribed verbatim here; the full list was observed in the trace DOM.

- Page has a single field. No hint text, no inset/warning/body copy, no error summary present on the happy-path snapshot.

- Legacy policy point: countryOfOrigin is mandatory in the page Joi validator and in CHED-P model validation groups, but the rendered control has no HTML required attribute. Preserve server-side enforcement; decide separately whether the rebuild permits incomplete draft saves before final submission.

### origin-of-import

- RESOLVED FROM LEGACY: the two persisted countries are mandatory in CHED-P model validation (Commodities.java:168-180,189-201; ValidationMessages.properties:86-87). The page validator supplies 'Select the country of origin of the animal or product' for an empty origin select and 6-character maximum messages for both country codes (validation/routes/handlers/importer/consignment_countries.js:31-65).

- Per-option radio HINTS on the conform question are rendered as govuk-radios__hint: Yes -> 'The consignment conforms to the regulatory requirements and the goods are for the internal market, transit, transshipment or movement for ship supply.'; No -> 'The consignment does not conform to regulatory requirements. Transits, transshipments, or movement for ship supply may not need to meet the regulatory requirements, if not intended for the internal market.' (both confirmed at trace 94d29... action 17).

- The country dropdowns carry 254 options (incl. placeholder). This is reference data — the new app should source it from a reference-data/country service, not hardcode. Note the ordering quirk: the four UK constituent countries (England, Northern Ireland, Scotland, Wales) appear mid-list between 'United Arab Emirates' and 'United States Minor Outlying Islands' rather than alphabetically, and their order differs between the two selects (origin: England, Northern Ireland, Scotland, Wales; consigned: England, Scotland, Wales, Northern Ireland).

- LEGACY-VS-RENDERED COPY/CONSTRAINT DISCREPANCY: the trace-confirmed and legacy-template hint says 'Enter up to 5 characters.' (consignmentCountries.html:80-82), but the CHED-P template input maxlength and server validator both enforce 3 characters (template:88-90; routes/handlers/importer/consignment_countries.js:62-69; validation/.../consignment_countries.js:40-43), with error 'Region code must be 3 characters or fewer'. Keep the confirmed hint, but the rebuild must choose and align one limit. Legacy also confirms region code is not required even when Yes is selected because empty is explicitly allowed.

- The <title> is 'Add a reference number for this consignment' — IPAFFS derives the page title from the last field rather than the H1 'Origin of the import'. Recorded verbatim; the new app should title by the page heading.

- RESOLVED FROM LEGACY AS NOT A CHED-P PAGE CONTROL: the authorised CHED-P template and validator contain no health-certificate-required field (consignmentCountries.html:122-175; validation/routes/handlers/importer/consignment_countries.js:31-94). The QA-only inferred locator is stale or belongs to another historical variant; do not add this control to the CHED-P rebuild without separate evidence.

- The QA page object corroborates only the regulatory-conformity and change-after-BCP groups plus Continue (page-objects/notification/OriginOfImportPage.ts:6-18). It has no counterparts for the two country selects, region-code controls or optional local reference; those remain trace-only confirmed requirements.

- Legacy policy point: countryOfOrigin and consignedCountry are @NotNull in CHED-P model validation, while conform-uk-regulations and transport-details-required are required only by frontend Joi. The latter two persisted booleans have no model @NotNull. Preserve the observed legacy journey enforcement but decide whether incomplete draft saves should remain blocked.

### search-commodity

- RESOLVED FROM LEGACY: no error state rendered in the trace, but the authorised validator supplies 'Enter a commodity code' for an empty search and 'Commodity code must be a number' for non-numeric input (validation/routes/handlers/importer/consignment_select.js:13-22; asserted at test/validation/routes/handlers/importer/consignment_select_test.js:24-48).

- RESOLVED FROM LEGACY: the trace did not open 'Species search', but the authorised tab template adds species-text-input labelled 'Enter species', hint 'Use the full scientific name. This will be in Latin, for example, Ovis aries', an autocomplete container, Search and Clear actions (views/partials/consignment/speciesSearchTab.html:12-85). Empty CHED-P species search copy is 'Enter a species'.

- The full drill-down behaviour after selecting a chapter (child levels, the commodity-selection-breadcrumb, final commodity/CN8/TARIC pick and any 'Add commodity' step) is downstream of this action and not captured here — a gap for a later page.

- RESOLVED FROM LEGACY: commodity-text-input is required only when action=search and must coerce to a number; no minimum/maximum code length is enforced by this Joi schema (validation/routes/handlers/importer/consignment_select.js:13-22). Tree selection and species search are alternative routes, so the text field is not globally required to proceed.

- The commodity chapter list is a subset filtered by IPAFFS for POAO/CHED-P eligibility — confirm the eligibility ruleset against reference data rather than treating this 36-chapter list as canonical.

- The QA page object has no Species search locator or fields (page-objects/notification/SearchCommodityPage.ts:3-16), while the trace confirms the tab exists. Legacy now supplies the missing tab-panel details and required message; runtime autocomplete result behaviour is still reference-data driven.

- Legacy model point: Commodities.commodityComplement is @NotNull only for NotificationLowRiskFieldValidation (Commodities.java:149-155; message 'A commodity must be selected' at ValidationMessages.properties:91), not a CHED-P/CVEDP group. CHED-P commodity choice is enforced by the page interaction and downstream journey rather than that model annotation.

### commodity-basic-description

- RESOLVED FROM LEGACY: Type of commodity is not a user-mandatory selection because the handler defaults the hierarchy; species is required only when species options exist ('Select at least one species'); and addCommodity is required for CVEDP ('Select yes if you want to add another commodity') (validation/routes/handlers/importer/consignment_commodity_attributes.js:10-50; messages/en.js:42,141).

- The 'Type of commodity' select and 'Select species of commodity' checkboxes are both dynamically populated from the selected commodity code (reference data). The new app must source these from a reference-data service keyed on commodity code, not hardcode them. The full taxonomy is not enumerable from the admissible evidence — only the lamb, fish and boneless-beef variants are captured.

- CONFIRMED FROM LEGACY: choosing addCommodity='true' redirects back to the commodity selection page to add another commodity (routes/handlers/importer/consignment_commodity_attributes.js:188-195).

- Hidden inputs present on the form (commodity-selected-code, commodityDetailsPage, typeButtonId, class/class-select-hidden, etag, complement-id, type-id, class-id, family-id, crumb, returnUrl, fromFooterHeader) are mostly IPAFFS state/CSRF plumbing. However, the legacy template also confirms Class of commodity and Family of commodity can be visible user selects when reference data provides meaningful options (consignmentCommodityAttributes.html:71-119); those two missed fields are now captured.

- For commodity code 96020000, the CHED-P test supplies empty type and species values (tests/notification/ched-p/ched-p-auto-clearance.spec.ts:55-57) and the generic workflow skips both controls (workflows/notification/ched-p-workflows.ts:293-299). Legacy defines the rendering rule: type/class/family selects are replaced by hidden values for exactly one blank option, while species is hidden for exactly one blank entry (consignmentCommodityAttributes.html:46-125). The precise 96020000 reference-data response is still not captured.

- Legacy policy point: species and addCommodity mandatoriness is enforced by frontend Joi, while CommodityComplement.speciesID/speciesType/speciesClass/speciesFamily carry no @NotNull annotations (CommodityComplement.java:18-46). The ValidationMessages.properties commodity-selection key at line 91 applies only to NotificationLowRiskFieldValidation via Commodities.java:149-155, not CHED-P. Preserve journey enforcement but revisit incomplete-draft policy separately.

### about-the-consignment

- No required=true attribute is present on ANY control (radios and selects all report required=false in the DOM); the purpose radio is functionally mandatory but validation is server-side. Which of the conditional Transit fields (exit BCP, exit date, exit time, transited country, destination country) and the internal-market sub-choice are actually mandatory, and what are the exact validation messages? Not observed in this passing corpus — mine the 38 error traces to confirm.

- The 'Add another country' link-button posts action=transit-third-countries-add to repeat the transited-country select (multi-value transit routing). How many transited countries can be added, and how are already-added ones displayed/removed? Only the single 'last' select was present in the snapshot.

- The form posts to 'page-5' (returnUrl shows /consignment/page-5). Confirm the canonical URL slug — the task's '/purpose' pattern is a friendly name, not the actual path.

- The three country selects (transhipment 251, transit-destination 251, transited 254) and the BCP select (34 in the rendered trace) are reference data — the new app should source these from a reference-data service, not hardcode them. The transited-country list uniquely includes a UK optgroup (England/NI/Scotland/Wales) that the destination lists do not. There is a source disagreement for the BCP list: the confirmed trace snapshot omits HOLYHEAD (GBHLY), while the current QA test requires it for EU CHED-P Transit (tests/notification/ched-p/ched-p-holyhead.spec.ts:11; tests/notification/ched-p/ched-p-holyhead.spec.ts:21). What is the current complete option set and count?

- The exit date/time + exit BCP fields overlap with the separate 'transit-exit-bcp' page in the journey map — confirm whether these are the same fields rendered inline here vs a distinct downstream page.

- The shared AboutTheConsignmentPage exposes 'Non-internal market', 'Transfer of ownership – Rescue', 'Temporary admission horses', a temporary-admission BCP, 'Point of exit', and 'BCP or Port of exit' controls (page-objects/notification/AboutTheConsignmentPage.ts:22; page-objects/notification/AboutTheConsignmentPage.ts:26; page-objects/notification/AboutTheConsignmentPage.ts:34; page-objects/notification/AboutTheConsignmentPage.ts:42; page-objects/notification/AboutTheConsignmentPage.ts:54; page-objects/notification/AboutTheConsignmentPage.ts:86), but no permitted CHED-P workflow or CHED-P spec drives them. Are any valid CHED-P variants, or are they controls for other CHED journeys? They have not been added as CHED-P fields without journey-specific evidence.

- The amendment test states that changing country of origin clears the purpose, then reselects Re-entry and uses 'Save and return to hub' (tests/notification/ched-p/ched-p-manipulation.spec.ts:42; tests/notification/ched-p/ched-p-manipulation.spec.ts:47; tests/notification/ched-p/ched-p-manipulation.spec.ts:48; tests/notification/ched-p/ched-p-manipulation.spec.ts:49). Is clearing the purpose an intentional dependency rule that the replacement service must preserve?

- RESOLVED FROM LEGACY: all eight recorded data controls are server-side mandatory in their applicable branch: purpose always; internal-market only for Internal market; destination for Transhipment; and exit BCP, exit date, exit time, at least one transited country, and destination for Transit (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/consignment_purpose_validation.js:14-20,32-50,74-103,133-143,222-230,284-305). These are legacy journey rules and the rebuild may revisit incomplete-draft timing.

- Legacy discrepancy/policy gap: the template hint says the Transit exit date 'must be within 7 days of arrival in Great Britain' (ipaffs-frontend-notification/service/src/views/importer/consignmentPurpose.html:180-191), but this page's dateValidation call sets required:true without a seven-day, future-date, or arrival-relative check (service/src/validation/routes/handlers/importer/consignment_purpose_validation.js:284-296). Confirm whether the rebuild must enforce that hinted rule and what error copy applies.

- RESOLVED FROM LEGACY: repeatable transited countries are capped at 12 in the template; Remove controls appear when more than one row exists, and Add another country disappears at 12 (ipaffs-frontend-notification/service/src/views/partials/purpose/transitThirdCountries.html:7-43). The one-row trace therefore correctly showed no Remove control.

### select-risk-category

- The QA workflow treats risk category as user-selected and persists it to review (workflows/notification/ched-p-workflows.ts:315; tests/notification/ched-p/ched-p-manipulation.spec.ts:68), but the hidden 'highest-risk-category' trace field remains 'High' even when the user selects Medium. Clarify whether that hidden computed maximum constrains or validates the user's selection.

- The empty fieldset legend means the radio group has no accessible name — confirm whether the new app should adopt the standard legend-as-heading pattern.

- RESOLVED FROM LEGACY: no error-state trace captured the missing/invalid-selection copy, but the authorised legacy validators supply three branch-specific messages: High/Medium/Low, Medium/Low, and the cloning-only High/Medium copy (ipaffs-frontend-notification/service/src/validation/messages/en.js:138-140; wired at service/src/validation/routes/handlers/importer/select_risk_category.js:14-43).

- Values posted are 'High'/'Medium'/'Low' (not 'High risk' etc.) — confirm the canonical enum the new backend should store.

- Legacy policy point: risk-category is mandatory in the frontend Joi validator (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/select_risk_category.js:14-31), while the choice set is shaped by risk-service output (:180-209). The rebuild should decide whether users may override the computed category and which options should be offered; this enrichment records the old-system rule without treating it as immutable policy.

### health-certificate-required

- RESOLVED FROM LEGACY: the interstitial is shown after High or Medium risk and skipped for Low; the normal Continue target is the overview. The legacy handlers also reveal two return-flow variants: commodityDetailsPage=true continues to commodity details, while changeRiskCategory=true continues to review (ipaffs-frontend-notification/service/src/routes/handlers/importer/select_risk_category.js:99-128 and service/src/routes/handlers/importer/health_certificate_required.js:13-31). RESIDUAL POLICY QUESTION: risk can be user-selected or system-derived in the legacy handler (:47-65,99-112); confirm the rebuild's intended ownership of categorisation.

- The Back link (href='#', JS-driven) sits in the page furniture above main; its true target/behaviour is not observable from the frozen snapshot and is not driven by any test (no page-object locator for it).

- No validation messages exist for this page and none could exist — it is a read-only interstitial with a single navigation link and no form input. Confirmed by the legacy template (ipaffs-frontend-notification/service/src/views/importer/healthCertificateRequired.html:11-20) and the page object exposing only linkContinue (page-objects/notification/HealthCertificateRequiredPage.ts:6-8). Recorded here so a human does not treat the empty validationMessages array as an unmined gap.

- Legacy-vs-rendered URL discrepancy: the rendered spec records /notification/vnet/protected/notifications/{notificationId}/health-certificate-required, while the legacy route is /protected/notifications/{referenceNumber}/health-certificate-required (ipaffs-frontend-notification/service/src/routes/routes.js:1234-1238). The rendered, confirmed URL is retained; establish whether /notification/vnet is an external context path rather than part of the application route.

### notification-hub

- The 'fields' array here models the 16 task-list ITEMS (not form inputs) — the hub is a navigation/status page, not a data-entry page. Each item's 'label' is the link text and 'observedValues' is the status tag observed.

- RESOLVED FROM LEGACY: the hub status vocabulary is exactly 'Started', 'To do', and 'Expired' (ipaffs-frontend-notification/service/src/utils/constants.js:107-111). To do maps to a grey tag, Expired to red, and Started/default to blue (service/src/utils/handlebars.js:778-786). There is no 'Completed' status in this legacy hub vocabulary. Status means data has been started, not that a task is complete: the handler derives Started/To do from whether any section field has a value (service/src/routes/handlers/importer/overview.js:170-232).

- RESOLVED FROM LEGACY: the visible 16-item trace is not the complete conditional CHED-P hub. Latest health certificate is hidden for Low risk; Transport after the BCP and Transporter depend on transport flags; Catch certificates has two commodity-dependent placements/routes; and billable notifications gain Billing details (ipaffs-frontend-notification/service/src/views/importer/overview.html:103-119,212-255,365-395,497-514; handler conditions at service/src/routes/handlers/importer/overview.js:62-118,130-142). The two unrendered task controls are now recorded as legacy fields.

- The caption 'DRAFT.GB.2026.1525975 - CHEDP' and the 'Attachments' link sit in a sub-header bar ABOVE <main>, not inside it. They are notification-context chrome rather than page body, but the reference number + CHEDP type label are meaningful and likely wanted on the rebuilt hub.

- There is no primary 'Continue'/submit button inside <main> on the hub — progression is entirely via the per-section task links. The 'Review and submit' task link (under 'Complete notification') is the route to submission.

- Evidence pointer for trace 0a6f82fcd63c4cd83fcab91687b522f3f865a74e was action 32, but that action is the 'Continue' click that NAVIGATES to the hub; its before-snapshot is the previous page. Used action 33 ('Commodity' link click) instead, whose before-snapshot is the hub. Content matched trace 94d29a... exactly.

- No validation messages apply to the hub itself: the authorised legacy template contains links and status tags but no data-entry form (ipaffs-frontend-notification/service/src/views/importer/overview.html:21-534). Requiredness belongs to the destination pages and underlying model fields, not to the 16 confirmed navigation links. The two newly discovered conditional tasks record required=null because their applicability is configuration/commodity dependent.

- Legacy-vs-rendered URL discrepancy: the confirmed trace records a /notification/vnet prefix, while the legacy overview route is /protected/notifications/{referenceNumber}/overview (ipaffs-frontend-notification/service/src/routes/routes.js:248-258) and its task routes likewise start at /protected/notifications/... (for example service/src/views/importer/overview.html:41-43 and :517-520). Retain the rendered URL and confirm whether /notification/vnet is deployment context rather than application routing.

- DELEGATED AUTHORITY / CROSS-TYPE: the hub itself was not captured in a CHED-P DoA journey. The three added entries describe confirmed cross-page delegated state that the CHED-P hub must retain: createdFor/assignedOrg, a pre-submit organisation change, and organisation-derived defaults. They do not claim that a new organisation widget was rendered inside the traced CHED-P hub.

### commodity-extended-description

- Legacy validation supplies the verbatim row-level and gross-weight errors now recorded in validationMessages (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/commodity_details.js:65-103; ipaffs-frontend-notification/service/src/validation/messages/en.js:90,113-123). Total gross weight is mandatory at CVEDP final validation, although the page-level validator permits it to be empty until that stage; the rebuild should confirm whether to surface the required error on this page immediately.

- The 'net-weight' and 'num-packages' inputs are plain text (type=text), not type=number, and no field carries a required attribute (validation is server-side). Confirm the accepted format — the column header reads '(kg/units)', implying weight OR unit-count depending on the commodity, and net weight '1' with 2 packages and gross weight '22' were the observed values.

- The entire commodity form is rendered twice (desktop + mobile DOM copies sharing name attributes). Confirm this responsive-duplication pattern is not to be reproduced in the new app — a single form is the intended target.

- The rendered CHED-P trace confirms 26 real package options plus the placeholder, but the shared QA vocabulary also includes Bottle/flask and other glass packages, Bulk solid granular particles, Container, and four wooden-package values (types/package-type.ts:6, :8, :14, :31-34). Rendered reality remains authoritative; confirm whether those extra QA values are valid only on other commodity branches or are CHED-P options missed by this trace.

- 'Subtotal' (per species table), 'Total for this consignment' (Net weight + Number of packages) and the 'Update total' button are computed client-side. Confirm the new app computes these server-side rather than via in-page JS.

- Is more than one species/type row ever present per commodity, and can more than one commodity code be added? The markup supports both (Add commodity button, per-row line ids), but only single-commodity / single-species journeys were traced.

- The page object exposes Number of animals, a row-scoped Package type input, Select all, and Apply (page-objects/notification/CommodityExtendedDescriptionPage.ts:14, :22, :30, :38), none of which appears in the rendered traces or CHED-P workflows. Confirm the CHED-P commodity conditions that reveal them, or whether they are shared-page controls for other CHED types.

### commodity-additional-details

- Legacy CVEDP model validation makes temperature mandatory and supplies the error copy 'Temperature of the consignment' (ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/representation/Commodities.java:114-122; ipaffs-notification-microservice/service/src/main/resources/ValidationMessages.properties:81). This is legacy policy for the rebuild to confirm.

- The shared page object exposes a Feedingstuff radio, Total gross weight textbox, and Save and review action (page-objects/notification/CommodityAdditionalDetailsPage.ts:10, :14, :22), but none is used by the inspected CHED-P workflows or CHED-P tests. They have been retained as inferred variant controls rather than discarded; confirm whether any CHED-P commodity branch renders them and, if so, their full option set, requiredness, units, and condition.

- HTML name/id are singular: name=temperature, id=productTemperature (radio ids productTemperature / productTemperature-2 / productTemperature-3, values ambient/chilled/frozen). Confirm the backend field name for the rebuild.

- The value maps to POAO storage/transport temperature. Confirm whether the three-way Ambient/Chilled/Frozen is the complete domain, or if per-commodity variants exist.

- This 'Additional details' step is part of the Consignment Details / 'Description of the goods' flow (page title 'Consignment Details'); confirm exact URL/route in the rebuild — observed returnUrl referenced /consignment/details?commodityDetailsPage=1.

- The legacy template explicitly suppresses its total gross weight control for CHED-P (isChedp) at ipaffs-frontend-notification/service/src/views/importer/consignmentDetails.html:46-54, while rendering temperature for CVEDP at lines 95-107. The inferred Total gross weight field in this spec therefore belongs to another shared-page variant or another point in the CHED-P flow, not this rendered CHED-P page.

### latest-health-certificate

- Validation copy is unknown (gap): neither trace rendered an error and no admissible CHED-P QA test asserts one. Is Document reference mandatory? Is the issue date mandatory or prohibited from being in the future? Is at least one attachment required?

- Second evidence pointer partial: trace 0a6f82... action 42 was the same 'Fill Day' on the health-certificate page, NOT the attachment upload. The attachment upload flow is actions 45-48 in that trace (Add attachment -> Set input files -> Continue -> back on page). Captured from there.

- The 'Upload a document' page (title 'Upload a document', file input name=fileUpload, constraints 'smaller than 10MB', 'a DOC, JPEG, PDF, PNG or XLS file', label 'Select a document', Continue/Cancel) is a SEPARATE page reached via 'Add attachment'. It is documented here as the attachment destination but may warrant its own page spec if not already covered elsewhere in the journey.

- Document type on this page is fixed ('Veterinary health certificate') — unlike the generic additional-documents page where document type is a select. Confirm the new app models the latest health certificate as a single fixed-type document row.

- The trace markup has no required attributes, but every non-low-risk QA workflow fills reference/date and uploads a file before continuing (workflows/notification/ched-p-workflows.ts:341-353), and the fish workflow calls the certificate required (workflows/notification/ched-p-workflows.ts:930). Clarify business requiredness separately from HTML required attributes.

- LEGACY RESOLUTION / POLICY POINT: the authorised page validator makes reference and the complete issue date mandatory once any certificate value is supplied or Add attachment is used; all-blank page submission does not trigger those local rules. Separately, the notification model requires a latest-veterinary-health-certificate document for both High and Medium CHED-P risk categories (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/documents_validation.js:35-38,69-89,109-118; ipaffs-notification-microservice/service/src/main/java/uk/gov/defra/tracesx/notification/validators/field/PartOneFieldValidator.java:176-190; ValidationMessages.properties:141). Confirm whether the rebuild should enforce this immediately on this page rather than only at notification validation.

- LEGACY RESOLUTION / POLICY POINT: an uploaded file is not what the legacy model uses to satisfy latest-certificate mandatoriness—the constraint checks for documentType LATEST_VETERINARY_HEALTH_CERTIFICATE, while attachmentId and attachmentFilename have no CVEDP constraint (ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/validation/annotations/LatestHealthCertificateRequiredValidator.java:14-29; representation/AccompanyingDocument.java:30-44). The page itself warns users to upload manually; decide whether the rebuild should make the attachment mandatory.

- The legacy single-file upload accepts DOCX and XLSX as well as the displayed DOC/JPEG/PDF/PNG/XLS set, while the validation copy omits DOCX and XLSX; its "larger than 1KB" message is also backed by a 200-byte threshold (ipaffs-frontend-upload/service/src/utils/validation_constants.js:3-23; service/src/validation/file_upload_validation.js:92-108). Confirm corrected rebuild copy and thresholds.

- The custom accessible-datepicker (calendar overlay) and the bespoke CSS-grid pseudo-table are non-standard; recommend the rebuild uses the plain GOV.UK Date input + a simple labelled form + GOV.UK File upload, dropping both.

### document-upload

- Evidence pointer for the error-state trace 9a0dedd668a877c909f76fa5c6cac6d56a34412e was WRONG: action 30 is a click on the 'Commodity' task-list link, not the document upload page. The document-upload validation error actually renders at action 45 (Expect toContainText on getByRole('alert')), after action 43 (Set input files, the large invalid file) and action 44 (Click Continue). All error-state evidence cited above uses action 45.

- The file input has no `required` HTML attribute and the empty-submit error was not observed in a trace. The authorised legacy validator nevertheless confirms server-side mandatoriness and the exact empty-submit copy is "Select a file" (ipaffs-frontend-upload/service/src/utils/validation_constants.js:3-5; service/src/validation/file_upload_validation.js:73-90). Confirm whether the rebuild should retain that copy or align it with the rendered label "Select a document".

- The rendered body copy says DOC, JPEG, PDF, PNG or XLS, but CHED-P upload tests explicitly accept DOCX as well (tests/document/document-upload-valid-health-certificate.spec.ts:6-6,26-36 and tests/document/document-upload-valid-commercial-invoice.spec.ts:8-8,43-53). The authorised legacy constants confirm that docx and xlsx are accepted while the displayed list omits them (ipaffs-frontend-upload/service/src/utils/validation_constants.js:19-23). Confirm whether the copy should name DOCX and XLSX explicitly.

- The authorised legacy minimum-size error says "larger than 1KB", but the single-file validator actually rejects only content smaller than TWO_HUNDRED_B (200 bytes) (ipaffs-frontend-upload/service/src/utils/validation_constants.js:7,14-17; service/src/validation/file_upload_validation.js:101-108). Confirm the intended rebuild threshold and copy.

- This page uses a custom data-module="dropzone" drag-and-drop enhancement on top of the standard govuk file input. Confirm whether drag-and-drop is a genuine UX requirement or can be dropped in the rebuild.

- The govuk-hint element carrying the notification reference ('DRAFT.GB.2026.1525975 - CHEDP') sits OUTSIDE the main content region (page chrome), so it is treated as chrome and not captured as a page field.

### accompanying-documents

- The inventory pointer for trace a9c0e770a621c1fa587ad4f5f15a32e8a564e975 action 20 is WRONG: action 20 is the commodity 'Type of commodity' select on H1 "Commodity". However, the same trace does independently reach H1 "Accompanying documents": action 46 selects Commercial invoice, action 47 fills REF-124, and actions 48-50 fill 04/03/2023. Action 38's REF-123 belongs to the sibling Latest Health Certificate page; action 46 does not.

- The details-panel copy ('In some cases, you’ll also need to upload...' referencing animals, livestock transiting bluetongue territories, and rodents for research) reads as generic/shared cross-CHED content and looks out of place on a CHED-P (products of animal origin) page — confirm whether this copy is correct for CHED-P or a shared-template artefact.

- The document-type option list mixes generic transport docs (Air waybill, Bill of lading) with animal-specific items (Veterinary health certificate, Letter of authority (Directive 2008/61/EC)). Confirm the correct CHED-P set for the rebuild; the new app should source this from reference data, not hardcode it.

- No HTML control on this page is marked required and no validation was observed. The QA workflow always supplies type, reference and all three date parts (workflows/notification/ched-p-workflows.ts:357-359), but no CHED-P test asserts what happens when any are absent. Mandatory-ness and validation copy therefore remain a gap.

- LEGACY RESOLUTION / POLICY POINT: additional documents are optional as a section, but once the user starts a row, requests an attachment, or submits Add a document, document-type is mandatory; reference and the entire issue date are optional for CHED-P. A partially entered date is nevertheless validated for completeness and validity (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/documents_validation.js:30-67,95-107,123-129). Confirm whether the rebuild should retain this conditional row-level mandatoriness.

- Legacy source currently defines 15 CHED-P document types, including both Catch certificate and Health certificate (ipaffs-frontend-notification/service/src/utils/document_type_constants.js:37-52), while the confirmed rendered trace exposed 14 options and omitted those two values. Keep the confirmed rendered list for this page; decide whether catch certificates remain exclusively in the separate IUU section and whether Health certificate is intentionally feature/configuration-dependent.

- 'Add a document' vs 'Add multiple documents' vs 'Add attachment' are three distinct server submits (names add-additional-document / add-multiple-documents / add-attachment). QA workflows fill the inline row and click Save and continue without first clicking Add a document (workflows/notification/ched-p-workflows.ts:357-363), implying that Save and continue commits the current row, but no test asserts the resulting document list. Confirm when each explicit add action is required and whether Save and continue always persists a partially or fully entered row.

- The page object exposes a Success region plus user and inspector attachment links (page-objects/notification/AccompanyingDocumentsPage.ts:28, page-objects/notification/AccompanyingDocumentsPage.ts:32 and page-objects/notification/AccompanyingDocumentsPage.ts:36), but no CHED-P test exercises an accompanying-document upload. Their exact success copy, timing, table/list placement and inspector availability remain inferred.

### approved-establishment-of-origin

- This is a landing/summary page with no data-entry fields — the only interactive controls are the 'Search for an approved establishment' trigger (which enters a separate country + establishment search sub-flow, observed navigating to .../veterinary-establishments?establishment-country-code=AF), plus Save and return to hub / Save and continue / Cancel. The actual establishment selection happens on downstream pages not covered by this page spec.

- The heading qualifier '(where required)' implies conditional mandatory behaviour. The QA workflow always selects at least one establishment and normalises the configured count to a minimum of one (workflows/notification/ched-p-workflows.ts:371-385), but neither source attempts Save and continue with an empty selection. Does the application require at least one establishment for all CHED-P commodities, only for some commodities, or never?

- LEGACY RESOLUTION / POLICY POINT: the landing page itself allows an empty table and simply navigates onward, but the notification microservice applies NotificationVeterinaryApprovedEstablishmentValidation to CVEDP and the schema then requires a non-empty establishmentsOfOrigin list with message "Approved establishment" (ipaffs-notification-microservice/service/src/main/java/uk/gov/defra/tracesx/notification/validators/field/PartTwoFieldValidator.java:70-77; schema VeterinaryInformation.java:30-37; ValidationMessages.properties:142). This is mandatory as the old system had it; confirm whether the rebuild should preserve that blanket CHED-P downstream rule despite the heading saying "where required".

- Table columns for a selected establishment are Name, Country, Type, Approval Number, plus a Remove action column (visually-hidden header). The exact Remove control markup and behaviour remain unknown because the trace's table was empty and the QA page objects expose no Remove locator or removal test.

- LEGACY RESOLUTION: every selected row renders a submit button named remove-establishment whose value is the establishment id; the handler removes the matching object, patches the notification, and returns to this page (ipaffs-frontend-notification/service/src/views/importer/establishmentOfOrigin.html:42-66; service/src/routes/handlers/importer/establishment_of_origin.js:48-54,81-84).

- The workflow and CHED-P spec prove that at least 10 distinct establishments can be added (workflows/notification/ched-p-workflows.ts:369-385; tests/notification/ched-p/ched-p-notification.spec.ts:307-313). What is the maximum allowed count, how are rows ordered, and does the application itself prevent duplicate selections?

- The primary 'Search' button is a POST submit (name=add-establishment, value=add) rather than a GET link — i.e. searching is a server round-trip that re-renders into the veterinary-establishments page carrying establishment-country-code.

### search-approved-establishment

- Results-table columns (Name, Section, Type, Approval Number, Status, Country, Select) and per-row data are trace-confirmed, but neither the traces nor the QA page object exercise the Name/Approval-number free-text filters, Section/Type/Status dropdowns, or Sort control. The QA page object only exposes Country, Search, row selection and pagination (page-objects/notification/SearchForApprovedEstablishmentPage.ts:10-31). Their filtering/sorting behaviour and validation remain gaps.

- No error/validation states were captured in the traces. The authorised legacy source resolves the behaviour: no-results renders "No establishments have been found. Re-try by amending your search criteria.", while country has no server-side required rule even though its label says "Country (required)" (ipaffs-frontend-notification/service/src/views/partials/importer/establishmentSearchDesktop.html:58-67; service/src/routes/handlers/importer/veterinary_establishments.js:28-52,83-98). Confirm whether the rebuild should make Country genuinely required or remove '(required)' from the label.

- The country select is pre-selected to the notification's country of origin ('Afghanistan (country of origin)'); whether the user can freely change country to search other countries' establishments, and how 'country of origin' is derived, is inferred not confirmed.

- Pagination shows 10 results per page and 'Next page : 2 of 5'; total-count / previous-page / numbered-page rendering was not exercised.

- Above the main region a notification-reference banner renders 'DRAFT.GB.2026.1525975 - CHEDP' (govuk-caption-l style, outside <main>) and a 'Back' link with href='#'. Treated as chrome; the Back target is JS-driven and its destination was not traced.

- The Section and Type reference lists contain obvious data-quality duplicates (e.g. two near-identical 'Blood and blood products...' entries, 'Frogs legs' vs "Frogs' legs"). The rebuild should dedupe/canonicalise this reference data at source.

### traders-addresses

- Legacy CVEDP model validation makes all four hub sections mandatory and supplies their exact messages (PartOne.java:192-292; ValidationMessages.properties:8,12,13,15). The traders POST handler routes onward without local validation, so these messages can surface at notification validation/review rather than necessarily on Save and continue. This legacy policy should be confirmed for the rebuild.

- The 'Same as consignee' buttons (#populate-importer / #populate-place-of-destination) appear once a consignee address exists in the trace and QA only drives them after adding a consignee. Confirm whether each button is additionally conditional on its target section still being empty.

- Two submit buttons ('Save and return to hub' vs 'Save and continue') both POST to 'traders' with different names/values — confirm the routing difference (return to overview hub vs advance to next journey page) server-side.

- DELEGATED AUTHORITY / CROSS-TYPE: no CHED-P DoA traders page exists in the corpus. The assigned-organisation and branch-address isolation behaviours above are shared mechanisms confirmed on CHED-PP Plant or type-agnostic fixtures; the CHED-P rebuild substitutes the authorised POAO organisation without inferring different trader fields.

### search-existing-consignor

- No validation behaviour observed — is an empty Name+Address search allowed (as here, returning all saved traders), or is at least one filter required? The QA page object exposes only the create-new link and does not model either search input or the Search button (page-objects/notification/SearchExistingConsignorOrExporterPage.ts:3-8), so an error-state trace or explicit test is still needed.

- The 'Create a new consignor or exporter' link routes to /traders/consignee/new?reimport=true — the ?reimport=true query and the 'consignee' route segment on a consignor page are legacy artefacts; confirm whether re-import context is always set here or only in the re-import journey.

- Country column is display-only in the results table; there is no country search filter — confirm the search only filters on Name/Address.

- The results table renders both a desktop table and duplicated mobile cards in the DOM; confirm the new app should render results once (govuk-table or govuk-summary-list) rather than replicate this dual-render pattern.

- QA covers only the create-new branch on this page (workflows/notification/ched-p-workflows.ts:390-394); it does not exercise searching, viewing, selecting, empty results, or pagination, so those trace-observed behaviours remain independently unasserted by automation.

- DELEGATED AUTHORITY / CROSS-TYPE: the organisation-isolation observation comes from a type-agnostic address-book trace, not this CHED-P consignor screen. Apply it only to organisation-owned branch data; the finding does not establish that the shared operator address book is wholly organisation-scoped.

### consignor-creation

- The evidence pointer names 'consignor creation' but this trace rendered the REIMPORT variant: URL /traders/consignee/new?reimport=true, page title & H1 'Add consignee', legend 'Consignee', name label 'Consignee name'. The 'Return to search' link, however, points to /traders/consignor/search and the page object is ConsignorCreationPage.ts. In reimport journeys the consignor becomes a UK ('consignee') party, so consignor/consignee copy is swapped. The standard (non-reimport, ROW) consignor page — expected H1 'Add consignor', legend/label 'Consignor' — was not exercised in this trace; its exact copy is a gap.

- Country <select> here holds only GB nations (5 options) because reimport=true. The standard consignor (ROW) country list — full reference-data country list — was not observed; treat as reference data the new app sources from a reference-data service, not hardcoded.

- No field carries an HTML required attribute; all validation is server-side and no validation/error state was captured in this (error-free) trace. QA fills every property of its non-optional Address payload (types/address.ts:1-10; page-objects/notification/ConsignorCreationPage.ts:47-56) but has no omission or invalid-value assertion, so logical required-field rules and error copy remain a gap.

- Hidden inputs present: crumb (CSRF), etag (optimistic concurrency), reimport, returnUrl, fromFooterHeader — these are platform/state plumbing, not user-entered requirements.

- Legacy-vs-rendered requiredness: the trace confirmed that none of the visible controls has an HTML required attribute, but the authorised server validator requires company-name, address-line-1, city-or-town, telephone, country and email (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/economic_operator.js:26-59). Treat the enriched required flags as server-side journey rules, not claims about native HTML validation.

- Legacy policy point: all six required visible values are enforced by the shared frontend Joi validator, while the CHED-P model only requires the overall consignor/consignee objects and does not place CVEDP @NotNull constraints on their individual address/contact properties (PartOne.java:192-239; EconomicOperatorAddress.java:23-53). The rebuild may revisit which fields block an incomplete draft.

### consignor-confirmation

- This page carries no user-editable fields — it is a post-create confirmation interstitial with two actions: 'Add to notification' (attach the just-created trader to the notification) and 'Return to search'. In the rebuilt simple app this interstitial may be unnecessary (the trader could be added directly from the create form), but its two behaviours must be preserved.

- The confirmation H1/title is hardcoded to 'consignee' even for consignors (IPAFFS defect). The correct trader role is only inferable from the return link URL. Rebuild must display role-correct copy (consignor / exporter).

- The original route is exposed by the trace-rendered Cookie Settings and Manage account returnUrl values as /notification/vnet/protected/notifications/{notificationId}/consignee/confirmation/{traderId}?fromCreate=true&reimport=true. The form has no explicit action attribute and posts back to that route; on submit it navigated to /notification/vnet/protected/notifications/DRAFT.GB.2026.1525975/traders. Hidden fields observed: crumb (CSRF) and etag (optimistic-concurrency token).

- A shell-level 'Back' link is present above <main>; no caption or body copy is present inside <main>, which contains only the panel, submit button and return link.

- QA independently corroborates only the 'Add to notification' button and happy-path transition (page-objects/notification/ConsignorConfirmationPage.ts:6-8; workflows/notification/ched-p-workflows.ts:397-400). It does not expose or assert the 'Return to search' link, confirmation heading/title, stale-etag handling, or an add failure state.

- Legacy-source clarification to the trace-based copy concern: the template is not literally hardcoded to 'consignee'; it renders 'The {{displayType}} has been created' (ipaffs-frontend-notification/service/src/views/importer/traders/confirmation.html:17-34), and the handler derives displayType from the route trader type (service/src/routes/handlers/importer/economic_operator/confirmation.js:22-30). The confirmed consignee wording on this consignor journey therefore results from the re-import route using type=consignee. Keep the observed copy as confirmed, but the rebuild should bind display copy to the business role rather than the route workaround.

- No user-entered fields or page validator exist for this confirmation step. The POST handler injects the route economicOperatorId as add-id and immediately delegates to selectTheTrader (ipaffs-frontend-notification/service/src/routes/handlers/importer/economic_operator/confirmation.js:52-67); the template's only submitted values are platform/state inputs crumb, etag and optional fromImporterReview (service/src/views/importer/traders/confirmation.html:42-51). Consequently there is no applicable field mandatoriness or legacy validation-message copy to add for this page.

### search-existing-consignee

- No validation was observed on this page — the Name and Address search inputs are both optional at the HTML level (required=false) and an empty search appears to return all saved traders (pagination shows '2 of 4000'). QA does not model either input or the Search button (page-objects/notification/SearchExistingConsigneePage.ts:3-8), so whether an empty search is intentionally allowed and what its result set should be remain gaps.

- The results table renders both a 'View' and a 'Select' action per row. 'Select' presumably attaches the saved trader to the consignee slot on the notification; 'View' presumably opens the saved trader detail. Their exact target routes/behaviour were not exercised in this trace (the test clicked 'Create a new consignee' instead) — marked as inferred behaviour, a gap.

- The 4000-page result count strongly suggests the search is unscoped / returns the whole address book. Whether the new app should require at least one search term before returning results is a design decision for a human.

- No hint text was present on any field (govuk-hint query returned empty).

- This page is shared markup across trader types (consignor/consignee/transporter) — the reused 'transporter-table-mobile' class confirms it. The new app should decide whether to keep one shared search page or split per trader role.

- QA independently covers only the create-new branch (workflows/notification/ched-p-workflows.ts:403-407). Searching, viewing, selecting an existing consignee, pagination, empty results and error states have no CHED-P automation assertion.

- Legacy-vs-rendered discrepancy: the authorised shared consignee settings include a Country search control and the template renders it for non-re-import notifications (ipaffs-frontend-notification/service/src/utils/economic_operator.js:54-57; service/src/views/importer/traders/search.html:73-83; service/src/routes/handlers/importer/traders/search.js:187), but the confirmed trace inventory contains only Name and Address. Keep the trace observations as confirmed and verify whether the served legacy build/version intentionally suppressed Country before carrying it into the rebuild.

- DELEGATED AUTHORITY / CROSS-TYPE: the organisation-isolation observation comes from a type-agnostic address-book trace, not this CHED-P consignee screen. Apply it only to organisation-owned branch data; the finding does not establish that the shared operator address book is wholly organisation-scoped.

### consignee-creation

- Legacy submitted-form validation makes consignee name, address line 1, city or town, telephone, country and email mandatory; address lines 2 and 3 and postcode remain optional (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/economic_operator.js:26-59). This reflects legacy policy and should be confirmed for the rebuild; postcode is notably optional despite lacking an '(optional)' label suffix.

- The HTML name/id for the consignee-name field is 'company-name' (not 'consignee-name'), while the visible label is 'Consignee name'. Rebuild should decouple the internal name from the label.

- Country is a plain native <select> (govuk-select) here, NOT an accessible-autocomplete widget — worth confirming this is consistent across the address forms; some IPAFFS pages use the autocomplete enhancement.

- Two hidden inputs 'returnUrl' and 'fromFooterHeader' plus 'crumb'/'etag' are present (CSRF/state plumbing) — platform mechanics, not user-facing requirements.

### consignee-confirmation

- This page is a GOV.UK confirmation panel ('The consignee has been created'), NOT a review/summary of the consignee's details — the journey-map description ('review created consignee') is not borne out by the trace. There is no summary-list of the consignee address/details on this page; it only confirms creation and offers to attach the record to the notification. Confirm whether a details review is expected elsewhere (e.g. the preceding consignee-search or a separate view) or whether the description is simply imprecise.

- Only one action (the 'Add to notification' click) was ever exercised in the trace corpus for this page. The 'Return to search' link and the back link were never followed in any CHED-P trace, so their destinations are read from the rendered href only, not observed as navigations.

- The form has no visible user-editable fields — only hidden crumb (CSRF) and etag (optimistic concurrency). The new app must preserve the ETag/optimistic-concurrency semantics when attaching a consignee to a notification.

- Legacy confirms there is no validation branch or editable-field mandatoriness on this interstitial: POST adds the economic-operator id and delegates trader selection (ipaffs-frontend-notification/service/src/routes/handlers/importer/economic_operator/confirmation.js:52-67). The form can additionally carry a conditional hidden fromImporterReview flag (ipaffs-frontend-notification/service/src/views/importer/traders/confirmation.html:45-47).

- The original confirmation route is exposed in the trace-rendered Cookie Settings and Manage account returnUrl values as /notification/vnet/protected/notifications/{notificationId}/consignee/confirmation/{traderId}?fromCreate=true. The form has no explicit action and posts back to that route; the successful response navigates to /notification/vnet/protected/notifications/{notificationId}/traders.

- QA independently corroborates only the 'Add to notification' control and happy-path transition (page-objects/notification/ConsigneeConfirmationPage.ts:6-8; workflows/notification/ched-p-workflows.ts:410-413). It does not model the return/back links, panel copy, hidden crumb/etag fields, or any stale-etag/add failure behaviour.

### importer

- The evidence pointer (action 86) actually resolved to the Place of destination "Same as consignee" button (strict getByRole matched it because the Importer populate button had already been clicked at action 85). The Importer section itself is confirmed via action 85 (#populate-importer) and the action-86 snapshot (Importer table populated). Both are the same Addresses page, so the page spec is sound; noting the pointer landed one section over.

- The Importer section is one of four sections on a single shared "Addresses" (Traders) page (Consignor/exporter, Consignee, Importer, Place of destination). H1 is "Addresses", not "Importer". Journey position 24 targets the Importer sub-section specifically.

- The actual importer address entry/selection (name, address lines, city, postcode, telephone, country, email) happens on the /traders/importer/search sub-page (address-book search or manual create), which is NOT in this trace evidence. Those individual field controls are inferred from the consignor/consignee create flows on the same page family (actions 63-82 use: name, Address line 1, Address line 2 (optional), Address line 3 (optional), City or town, Postcode or ZIP code, Telephone number, Country select, Email address) — corroborate against the importer/search template.

- Legacy CVEDP model validation makes both Importer and Place of destination mandatory and supplies the messages 'Who is the importer' and 'What is the place of destination' (PartOne.java:241-292; ValidationMessages.properties:8,15). The page handler itself does not block Save; these constraints can surface at notification validation/review. This is legacy policy for the rebuild to confirm.

- The importer "Same as consignee" control is a link-styled submit button (#populate-importer), corroborated by page-objects/notification/TradersAddressesPage.ts:26-28. It is now modelled as control=button; see nonStandardPatterns for the recommended Radios/secondary-button rebuild.

- A variant-only 'Save and review' button exists when Traders is opened via Change from notification review and is exercised by the cloned CHED-P workflow (page-objects/notification/TradersAddressesPage.ts:22-24; workflows/notification/ched-p-workflows.ts:1338-1340). Its rendered styling, ordering relative to other actions, and coexistence with Save and return to hub were not trace-observed.

- DELEGATED AUTHORITY / CROSS-TYPE: the importer auto-population rule is confirmed only on the CHED-PP Plant-organisation fixture in trace 545412266caaec96b0aae12262fecfee3e099888 actions 94 and 97-98. It carries the shared assigned-organisation mechanism into CHED-P for a POAO organisation; it does not establish CHED-P-specific trader copy or layout.

### transport-details

- Evidence pointer for the error state was wrong: trace d489100009fddf53558185871da40a04539605b6 action 30 is the hub 'Commodity' task-list link, not the transport page. Found the real error state at action 97 (Save and continue) / action 98 (error rendered) in the same trace and used that instead.

- Which fields are mandatory is not directly observable — no control carries the HTML required attribute (all required=false), so validation is server-side. The QA workflow fills Port of entry, Means of transport, Transport identification, Transport document reference, arrival date and arrival time before continuing (workflows/notification/ched-p-workflows.ts:421-428), but no scoped test submits any of them blank. Mandatory-ness and exact blank-field validation copy therefore remain gaps.

- The conditional container fields are present but hidden because No was selected. The raw DOM confirms labels 'Container or trailer number', 'Seal number', section heading 'Official seal', the anomalous checkbox label 'official-seal-1', all three hints, and the 'Add another container or trailer' button. A visible Yes-branch trace is still needed to confirm branch interaction, validation and multi-row behaviour.

- The rendered trace contained 34 Port of entry options, but QA proves the list is conditional on origin: EU, Northern Ireland and ROW journeys receive different real/dummy-port sets (tests/notification/ched-p/ched-p-poe-validation.spec.ts:11-31,54-82). Treat optionCount=34 as the confirmed count for the traced journey, not a universal count. The new app should source this list and its eligibility rules from reference data rather than hardcode it.

- The custom defra-datepicker calendar overlay and accessible-autocomplete are progressive enhancements; the underlying native controls (govuk-date-input three fields, govuk-select) are what submit. New app can drop the datepicker and keep plain govuk Date input.

- RESOLVED FROM LEGACY: CHED-P submission requires port of entry, means of transport type, transport identification, transport document reference, estimated arrival date and estimated arrival time. The authorised model/message evidence is PartOne.java:138-141,424-467,503-529; MeansOfTransportBeforeBip.java:65-69,89-93,132-138; ValidationMessages.properties:38,49,54,59,64,70. The page Joi validator deliberately allows blank drafts, so the rebuild must decide whether to retain that draft/submission distinction.

- Legacy policy point: the old system enforced the six transport values at final CHED-P model validation even though the rendered controls had no HTML required attributes and page saves could be incomplete. Preserve final-submission completeness unless policy explicitly changes; separately decide whether the rebuild should allow incomplete task-list drafts.

- Legacy conditionality: selecting Yes makes each container/trailer row's container number mandatory, but the seal number and official-seal checkbox remain optional for CHED-P (transport_before_bip.js:102-111,196-203; NotificationSealsContainers.java:33-68). Confirm whether the rebuild should retain that asymmetric container-required/seal-optional rule.

### means-of-transport-after-bcp

- Legacy CHED-P completion validation makes onward transport, identification, document, departure date and departure time mandatory only when transporterDetailsRequired is true (PartOneFieldValidator.java:188-192), while the page-level Joi schema allows every one of them to be blank so users can save progress (transport_details.js:16-30,84-93). The rebuild should explicitly decide whether to preserve this deferred-validation policy.

- The legacy template contains a conditional 'Person who is responsible for the journey' input when partOne.responsibleForTransport already exists and field configuration exposes it (transportDetails.html:100-114), but it was absent from the rendered CHED-P trace. Confirm whether this legacy-only branch remains reachable for CHED-P or should be retired.

- Evidence pointer for the second pair was wrong: trace 7e0ed9c74ab869a443bab5cc5357a70994f8907f action 30 is a click on the 'Commodity' task-list link, not this page. The actual departure-date validation error is triggered at action 106 (Save and continue) and asserted at action 107 in that same trace — I used action 107 for the error-state snapshot.

- All inputs report required=false at the DOM level (HTML5 required attribute absent). The QA workflow fills the mode-of-transport select, identification, document, date and time before continuing (workflows/notification/ched-p-workflows.ts:446-452), but no scoped test submits any field blank. Server-side mandatory-ness and exact blank-field validation copy remain gaps; the only tested validation is the date range rule.

- The evidence described action 102 as filling a 'second-leg' Transport document reference. This page shows a SINGLE onward-transport leg (one means-of-transport select, one identification, one document reference). 'Second leg' most likely refers to onward transport being the second transport stage overall (transport-to-BCP being the first), not a repeatable second leg on this page. No 'add another leg' control was observed.

- Hint text for the departure DATE ('For example, 27 3 2023') and TIME ('24 hour format, for example, 14 50') sit on govuk-hint elements with no id, associated with the fieldset group rather than individual inputs; I attributed them to the group in the field records.

- Field maxlengths observed: identification=50, document=32, day/month/hour/minutes=2, year=4. minlength on document was 0 (i.e. optional-length).

### goods-movement-services

- Legacy completion validation requires provideCtcMrn and isGVMSRoute for CVEDP (PartOne.java:649-668; PartOneFieldValidator.java:176-180), but the legacy page-level Joi schema marks both radio payloads optional and rendered inputs have no HTML required attribute (goods_movement_services_validation.js:32-34; confirmed trace action 110). The rebuild should decide whether to enforce selection immediately on this conditional page or only before submission; this legacy policy may be revisited.

- QA exercises 'Yes – add MRN now' with a generated valid 18-character MRN (workflows/notification/ched-p-workflows.ts:615-617; utils/reference-utils.ts:1-8), but neither admissible source submits an empty or malformed MRN. Conditional required-ness and exact MRN format-validation copy remain gaps.

- QA exercises GVMS Yes and No across multiple downstream risk-assessment scenarios (tests/notification/ched-p/ched-p-inspection-non-transit.spec.ts:19-75,81-102), but exposes no follow-up field after Yes. Confirm whether GVMS Yes only changes downstream assessment or can lead to another input/page in an untested combination.

- The page/questions are genuinely conditional: the workflow defensively catches absence of either question and only clicks Save and continue when at least one is present (workflows/notification/ched-p-workflows.ts:603-642). Confirm the exact eligibility matrix by BCP/port, incoming transport mode and journey type; QA comments describe the dependency but do not enumerate it.

- The page object and workflows indicate two CTC variants: binary Yes/No (page-objects/notification/GoodsMovementServicesPage.ts:6-11; workflows/notification/ched-p-workflows.ts:486-492) and three-way Yes-add-now / Yes-add-later / No (page-objects/notification/GoodsMovementServicesPage.ts:13-19; workflows/notification/ched-p-workflows.ts:615-622). Confirm which journey conditions select each variant and whether binary Yes leads to MRN capture elsewhere.

- No validation/error messages were captured in traces or asserted by scoped QA tests. Required-selection and MRN error copy are represented as explicit gaps.

- The CTC and GVMS 'Details' explainers contain body copy with embedded links to external guidance (e.g. 'Find out more about using transit to move goods (opens in new tab)', GVMS port/registration links). Link hrefs were not extracted; the visible link text was captured in bodyCopy of the Details components.

### transporter

- Authorised legacy source resolves the empty-submit question for the old system: this page has no page-level validator, its POST performs a no-op update, and PartOne.transporter is not @NotNull for the CVEDP transporter-details validation group (transport.js:29-47; PartOne.java:461-482). A transporter was therefore not enforced on this page for CHED-P; whether the rebuild should retain that policy is an explicit product decision.

- The shared page-object-only 'No' radio and 'Select' button do not appear anywhere in the authorised CHED-P transporter template or its mobile/desktop partials (transport.html:12-25; transporterTableMobile.html:1-97; transporterTableDesktop.html:1-22). Keep them documented as inferred cross-CHED artefacts, not CHED-P requirements.

- Is at least one transporter mandatory? The empty state offers 'Save and continue', but neither the trace nor QA exercises it without a transporter. The CHED-P workflow always follows Add -> create -> confirm before clicking Save and continue (workflows/notification/ched-p-workflows.ts:503-517), so mandatory-ness and exact validation copy remain gaps.

- The observed journey added exactly one transporter and the 'Add a transporter' link then disappeared (replaced by a per-row 'Change' link). Confirm whether the hub is single-transporter-only or whether multiple transporters can be added (would the add link reappear? does the table grow rows?).

- 'Approval number' column was blank for a 'private transporter'. Confirm when an approval number is captured/displayed (likely only for approved/authorised transporter types).

- 'Type' showed 'private transporter'. The full set of transporter types is defined on the transporter search/create page, not this hub.

- No back link was present in <main>; confirm whether IPAFFS renders a back link in page chrome for this hub.

- The shared Transporter page object exposes a 'No' radio and a 'Select' button (page-objects/notification/TransporterPage.ts:9-14), neither rendered in the CHED-P trace nor used by CHED-P workflows/tests. 'Select' is used by CHED-A (workflows/notification/ched-a-workflows.ts:435). Confirm whether either control belongs to a live CHED-P transporter variant; their parent question/row semantics are otherwise unknown.

### search-existing-transporter

- Legacy validation confirms that all three transporter filters are optional and an empty search is allowed (traders/search.js:19-34); the former requiredness gap is resolved. Product policy should still decide whether returning the entire saved-transporter catalogue on an empty search is desirable in the rebuild.

- This is a search-and-select-from-saved-transporters page. The trace and QA both exercise only the 'Create a new transporter' escape hatch (trace action 113; page-objects/notification/SearchExistingTransporterPage.ts:6-8; workflows/notification/ched-p-workflows.ts:503-510). The Search submit, per-row View, per-row Select, no-results state and pagination are not exercised by either source.

- The results table shows a 'Status' column (all rows 'New') and a 'Type' column ('private transporter' / 'commercial transporter - user added'). The distinction between private vs commercial transporter and how it is set is not established from this page alone.

- Pagination reports '2 of 2032' pages of saved/reference transporters — the source and scope of this list (address book, shared reference data, or seeded test data) is a gap; the rebuild must decide whether such a searchable saved-transporter store is a requirement at all.

- No hint text and no validation messages were observed on this page (govuk-hint query returned none, no error summary in the captured snapshot). The QA page object also models none of the three search inputs or their results (page-objects/notification/SearchExistingTransporterPage.ts:3-8), so required-ness, matching semantics and exact validation/no-results copy remain gaps.

### transporter-creation

- Legacy validation resolves the mandatoriness discrepancy: postcode is optional despite lacking '(optional)' in the rendered label; transporter name, address line 1, city or town, telephone, country and email are required, while address lines 2 and 3 are optional (economic_operator.js:24-58). The rebuild should decide whether to make postcode visibly optional for consistency.

- Exact validation message copy for required fields (transporter name, address line 1, city, postcode, telephone, country, email) and for email/telephone format errors is not observed. The QA helper always fills every property before submission (page-objects/notification/TransporterCreationPage.ts:47-57), and no scoped test exercises missing or malformed input.

- Which fields are truly mandatory server-side beyond the explicitly optional address lines 2 and 3 remains inferred from GDS '(optional)' labelling convention. HTML required attributes are false, while the QA Address type declares every property (including address lines 2 and 3) as a string (types/address.ts:1-11), so it does not establish server validation.

- This is the 'private transporter' variant (URL .../private-transporter/new, input title='private transporter', name field id=company-name). There is a preceding transporter search page ('Return to search' -> .../traders/transporter/search). Confirm whether a 'company/registered transporter' path exists with different/extra fields (e.g. EORI, approval number) that this address-entry form does not cover.

- Country select carried exactly 254 options in the observed trace, including the placeholder. The list should still come from reference data; only the first 20 options are captured in this spec.

### transporter-confirmation

- Authorised legacy source confirms there is no page-level validation schema or validation-message copy for this confirmation interstitial; POST immediately injects the transporter id and performs the notification patch (economic_operator/confirmation.js:52-66; economic_operator.js:95-111). Stale-etag and attach failures therefore remain integration-error behaviour rather than field validation that can be specified from this page.

- This is a confirmation interstitial, not a data-entry page: no user-facing form fields, no caption, no back link. The only two form inputs are hidden infrastructure tokens (crumb = hapi CSRF, etag = optimistic concurrency).

- In the new app this whole interstitial may be unnecessary — a created transporter could be attached to the notification in one step without a separate confirmation panel + 'Add to notification' click. Flag as a candidate for simplification rather than a hard requirement.

- Only one action is covered by QA: 'Add to notification' (page-objects/notification/TransporterConfirmationPage.ts:6-8; workflows/notification/ched-p-workflows.ts:513-517). 'Return to search', panel text, duplicate submission and stale-etag/failure behaviour are not asserted. The page has no editable user inputs, so ordinary field validation is not expected; failed-attach copy remains a gap.

### contact-details

- RESOLVED FROM LEGACY: the rendered trace did not establish server-side validation. The authorised legacy source requires name, requires at least one of email or telephone, caps name/email/telephone at 32/255/30 characters, and supplies the exact messages recorded above (ContactDetails.java:21-40; responsible_person_contact_details.js:24-46; ValidationMessages.properties:194,196,198). An error-state trace would still be useful to confirm whether the served legacy deployment rendered these source-defined messages unchanged.

- Legacy policy point: the old CHED-P/CVEDP model requires name and at least one of email or mobile number (ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/representation/ContactDetails.java:21-40). Confirm whether the rebuild retains this mandatoriness; it is recorded here as the old system had it.

- Review-mode-only actions such as Save and review were not rendered in this create-flow snapshot and remain source-derived rather than trace-confirmed.

- The review-mode Change link is scoped to #review-table-organisation-address and is exercised after 'Add contact address' from review (page-objects/notification/ContactDetailsPage.ts:6-8; workflows/notification/ched-p-workflows.ts:1342-1344). Confirm the displayed organisation-address row contents and the destination page because QA asserts only the interaction, not the rendered copy.

- DELEGATED AUTHORITY / CROSS-TYPE: assigned-organisation contact auto-population is rendered on the CHED-PP review page, not on a CHED-P-specific DoA contact-details page. Trace 545412266caaec96b0aae12262fecfee3e099888 actions 94-96 confirms the shared behaviour; POAO-specific values and copy remain unobserved.

### nominated-contacts

- RESOLVED FROM LEGACY: the whole CHED-P page is optional, but an entered contact requires name plus at least one of email or telephone; the source-defined format and length messages are recorded above (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/nominated_contact.js:26-60). The five-contact maximum is implemented by hiding the input row and Add another person control once partOne.nominatedContacts.length reaches 5, not by a validation message (service/src/transformers/notification_to_view/importer/nominated_contact.js:3-5; service/src/views/importer/nominatedContact.html:90-138).

- LEGACY-VS-RENDERED DISCREPANCY: the existing confirmed field metadata says name control=email, email control=tel and telephone control=text. The authorised template says name is the default text input, email is type=email and telephone is type=tel (ipaffs-frontend-notification/service/src/views/importer/nominatedContact.html:90-125). Per evidence precedence, the confirmed control values were retained and the legacy values were added separately; the trace/control mapping should be rechecked.

- Legacy policy point: the old CHED-P page makes the contact list optional but makes name plus one contact channel mandatory within any row the user starts (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/nominated_contact.js:45-57). Confirm whether the rebuild retains that partial-row policy.

- The captured page shows one existing-contact row (Remove button, value=0) with empty cells above the input row. The exact relationship between saved rows and the entry row (and how many rows the server pre-renders) was not fully exercised — the test only used the single entry row then Save and continue without adding a contact. Behaviour of 'Add another person' (up to 5) and 'Remove' is inferred from markup, not observed being clicked in this trace.

- Hidden fields on the form: crumb (CSRF), etag (optimistic-concurrency), returnUrl, fromFooterHeader. These are IPAFFS session/plumbing, not user-facing requirements.

- Column header 'Mobile number' but the underlying field name is 'telephone' (type=tel) — confirm whether the new app treats this as a mobile-specific field or a general phone number.

- The evidence pointer (action 126) was the Save-and-continue that NAVIGATED to this page; the actual nominated-contact page DOM is action 127's snapshot (its before/input phase). Used action 127 instead.

- The QA page object exposes only Save and continue (page-objects/notification/NominatedContactsPage.ts:3-8), and all CHED-P workflows skip the optional contact inputs (workflows/notification/ched-p-workflows.ts:522-523, 794-795, 1000-1001). QA therefore does not independently establish input locators, add/remove behaviour, the five-contact limit, or validation rules.

### contact-address

- RESOLVED FROM LEGACY: a branch-address selection is server-side mandatory. A missing POST value produces '"Organisation Branch Address" is required' in the page validator, while model validation of an absent CHED-P personResponsible.address produces 'Add the contact address for consignment' (organisation_branch_address_validation.js:17-28; ValidationMessages.properties:6; Party.java:48-53). The source validates presence, not whether a submitted address identifier is still present in the current address-book list, so stale-selection handling remains open.

- Legacy policy point: the old CHED-P journey and model require a contact address (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/organisation_branch_address_validation.js:17-28; ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/representation/Party.java:48-53). Confirm that the rebuild retains this requirement.

- The trace rendered 16 choices but only three distinct address-label bodies because many entries were duplicates. Confirm whether duplicate branch addresses should be deduplicated upstream.

- The inline add-address href contains the literal path segment 'organisation branch address/new', while the current form action is the relative string 'organisation-branch-address'. Preserve route behaviour independently of the display requirements.

- Action 128 is the correct contact-address selection page. The former contents of this file described the next page, H1 'Add branch address' at action 129, and have been moved out of this slug rather than retained as contact-address evidence.

### branch-address-creation

- Legacy submitted-form validation makes branch name, address line 1, city or town, telephone, country and email mandatory; address lines 2 and 3 and postcode remain optional (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/economic_operator.js:26-59). This reflects legacy policy and should be confirmed for the rebuild. Notably postcode is optional even though its rendered label lacks an '(optional)' suffix.

- The section caption 'DRAFT.GB.2026.1525975 - CHEDP' is rendered as plain text above the H1 (not a govuk-caption-* class). Confirm whether the new app renders the notification reference as a govuk-caption-l/xl above the page heading.

- The 'Branch address name' field's HTML name attribute is 'company-name' (legacy naming) while its visible label is 'Branch address name'. The new app should map this to a clearly-named field (e.g. branchAddressName), not reuse 'company-name'.

- Two 'Back'-style navigations exist: a platform 'Back' link (href='#', JS-driven, above main - chrome) and an in-main 'Return to notification' link that points to the organisation-branch-address route. The primary in-content way back is 'Return to notification'.

- The URL path segment is literally 'organisation branch address/new' (space-separated, URL-encoded as %2520 - double-encoded space) in the legacy app; the new app should use a clean slug like /branch-address.

- The QA Address payload is variant-configurable at journey level (workflows/notification/ched-p-workflows.ts:91-94) and the default provides all nine values (workflows/notification/ched-p-workflows.ts:198-207), but that does not establish that every field is server-side mandatory. Only Address line 2 and Address line 3 are explicitly labelled optional in both trace and page-object locators.

- After Branch Address Confirmation, QA calls Return to notification and identifies the resulting page again as Branch Address Creation Page, then clicks Save and continue without refilling (workflows/notification/ched-p-workflows.ts:532-536; tests/accessibility/ched-p-accessibility-tests.spec.ts:267-273). Does the route return to this populated form, or is the page-object name being reused for a distinct selection/summary page?

### branch-address-confirmation

- This page has no user-editable fields — it is a pure confirmation interstitial shown after a branch address is saved to the address book, with a single 'Return to notification' submit button. The four inputs are all hidden (crumb x2, etag, returnUrl, fromFooterHeader).

- No section caption or body paragraph is rendered in main; main contains only the confirmation Panel and the submit button. A standard 'Back' link is rendered above main. For the rebuild this page could be collapsed into a flash/notification-banner on the destination page rather than a standalone interstitial.

- No error/validation state was observed for this page in the corpus (this is the address-book save confirmation, not a form).

- Legacy template confirms that this branch-address variant has no user-editable fields and therefore no field-validation copy: it posts only hidden state and the 'Return to notification' action (ipaffs-frontend-notification/service/src/views/importer/traders/confirmation.html:42-50). It can additionally carry a conditional hidden fromImporterReview flag, which the rendered trace did not expose (lines 45-47).

- QA corroborates only the Return to notification button and immediate journey transition (page-objects/notification/BranchAddressConfirmationPage.ts:6-8; workflows/notification/ched-p-workflows.ts:532-536; tests/accessibility/ched-p-accessibility-tests.spec.ts:267-273). It does not inspect the confirmation heading, hidden fields, destination URL, or selectedBranchAddressId behaviour.

### review-notification

- Legacy source confirms that the editable importer review state adds no user-data fields: it POSTs only the Save and continue button plus hidden crumb and etag tokens (ipaffs-frontend-notification/service/src/views/importer/review.html:344-350). The handler refreshes whole-notification validations before continuing, so any errors shown here belong to fields captured on earlier pages rather than to review-page inputs (ipaffs-frontend-notification/service/src/routes/handlers/importer/review.js:459-461).

- This is a read-only check-your-answers (ReviewNotificationPage) — it gathers no new input; the only interactive controls are Save and continue, three Copy buttons and per-section Change links. There are no form fields to validate, hence no validationMessages observed.

- The page is a full aggregate summary of every section captured earlier in the journey (import type, country of origin/consignment, regulatory conformance, consignment reference, reason for import, risk category, commodity code + species/weights/packages, temperature, health certificate, additional documents, approved establishment, traders [consignor/consignee/importer/place of destination], transport to & after the BCP, transporter, goods movement services [CTC/GVMS], contact details, nominated contacts, contact address). The new app must render the same aggregate but should use the stock GOV.UK Summary list / Summary card + Table components rather than the bespoke review-summary-list / presentation-table / review-table skins.

- Evidence pointer for the 2nd trace (action 143) landed on the page BEFORE review — action 143 navigates TO /review. The review page is the before-state of action 144 in that trace; used action 144 to corroborate (identical H1 'Review your notification' and title). This does not change the mining, just noting the pointer.

- The 'Change' actions are rendered inconsistently — most as anchor links (?fromImporterReview=true deep-links) but at least Import risk category and Additional details render as <button> (link-button). Confirm intended behaviour; recommend standardising as summary-list action links.

- Some values were empty in this trace (Region of origin code, Consignment reference number, Transporter Country/Approval number) — these are conditional/optional and rendered blank rather than omitted. Gap: whether blank vs 'Not entered' text is intended.

- Both evidence traces are the happy-path B2C importer high-risk journey (ROW + EU) with zero errors — no error-state variant of the review page was observed. The certificate/GVMS/goods-movement sections may vary for EU vs ROW consignments (this is a High risk journey); a low-risk or GVMS=Yes variant was not mined.

- The shared ReviewNotificationPage page object also exposes Amend, Review and submit, Split consignment, a commodity-split message, organisation/contact/importer values, Permanent addresses and Transport contacts (page-objects/notification/ReviewNotificationPage.ts:14-58, 93-103). The admissible CHED-P workflow/specs do not establish that these belong to the importer review route: Review and submit is demonstrably clicked while still on the amendment hub (tests/notification/ched-p/ched-p-manipulation.spec.ts:61). Their CHED-P applicability and state/role conditions remain unresolved, so they have not been promoted to review-page fields.

- The fish review row is asserted by QA but absent from the mined traces. Confirm the table heading/caption and whether the flag-state and attachment columns are always present; the tests only assert row content (tests/notification/ched-p/ched-p-notification.spec.ts:209-217).

- DELEGATED AUTHORITY / CROSS-TYPE: the responsible-person, organisation, importer and submitter rows were rendered on a CHED-PP Plant fixture in trace 545412266caaec96b0aae12262fecfee3e099888 actions 94-98. They define the shared assigned-organisation model for CHED-P, but POAO values and a CHED-P-specific DoA review layout were not observed.

### declaration

- Legacy source resolves the acknowledgement-checkbox question for CHED-P: the shared declaration validator requires declaration-agree only for CHEDPP and CHED-A, while CVEDP bypasses it and submits directly (ipaffs-frontend-notification/service/src/routes/handlers/importer/declaration.js:36-58; validation/routes/handlers/importer/declaration.js:9-18). The rebuild should confirm this legacy policy remains intended.

- The rendered trace did not show the billable-consignment paragraph or its two external links, but the authorised CHED-P template includes them when isBillable is true (ipaffs-frontend-notification/service/src/views/importer/declaration.html:17-38; routes/handlers/importer/declaration.js:73-79). This is a conditional-state coverage addition, not a legacy/rendered-copy conflict.

- This is the final journey step: clicking 'Submit notification' POSTs the form and navigates to /notifications/{chedRef}/confirmation (observed redirect to CHEDP.GB.2026.1525975/confirmation). The declaration copy references 'the consignment detailed above' but no summary/Part I detail is rendered on this page itself — the review/summary lives on the preceding page(s), so the declaration page is copy + submit only.

- The declaration text cites 'assimilated Regulation 2017/625'. Verify this is the current/correct legal reference for the rebuilt CHED-P (it is verbatim from IPAFFS as of the 2026-07-16 trace).

- No error state was captured for this page in this trace (0 errors). Any submit-time validation (e.g. record already submitted, etag conflict, double-click) is unobserved — marked as a gap for error copy. The button has data-prevent-double-click='true', implying double-submit is handled client-side.

- submissionDate is sent from a client hidden field in IPAFFS; the new app should derive the declaration date server-side rather than trust the client value.

- The shared DeclarationPage exposes an 'I/We have read and understood' checkbox (page-objects/notification/DeclarationPage.ts:6-8), but no admissible CHED-P workflow or test checks it: CHED-P clicks Submit notification directly (workflows/notification/ched-p-workflows.ts:552; tests/notification/ched-p/ched-p-notification.spec.ts:221). The checkbox is therefore not added as a CHED-P field; confirm that direct submission without an acknowledgement control is intentional.

### confirmation

- Legacy source resolves the Check GVMS gap: for CHED-P it uses the heading 'Notification submitted', status 'Check GVMS', body 'The Goods Vehicle Movement Service (GVMS) will notify the driver of all entry inspections.' and inset instruction 'The driver must check GVMS before arriving at the border location to find out if entry inspections are required.' (ipaffs-frontend-notification/service/src/views/importer/common/confirmationCheckGvms.html:11-40; selected at routes/handlers/importer/chedp/confirmation.js:79-82).

- Legacy source adds four transit confirmation variants not represented by the two rendered snapshots. All show separate Entry inspection status and Exit inspection status values; the branch is selected from inspectionRequired and sealCheckRequired (ipaffs-frontend-notification/service/src/routes/handlers/importer/chedp/confirmation.js:64-76; views/importer/chedp/confirmationTransitEntryAndExitInspection.html:13-45, confirmationTransitEntryInspection.html:13-42, confirmationTransitExitInspection.html:13-37, confirmationTransitNoInspection.html:21-36). Rebuild policy should confirm whether both status rows remain required display output.

- This confirmation page gathers no user input. The three reference display fields are read-only summary-list values (dd elements), recorded so the rebuild preserves the exact reference triplet (CHED reference, customs declaration reference, customs document code N853). It also contains Copy buttons and exit/feedback links.

- There is no govuk-heading-xl H1 on this page. The only H1-equivalent is the H2 'Initial risk assessment' (notification-banner__risk-title). The document <title> is 'Import notification sent - Import and export applications - GOV.UK'. Recorded 'Initial risk assessment' as heading; flag for a11y in the rebuild (a confirmation page should have a proper H1).

- Two outcome variants confirmed by traces: (a) inspection REQUIRED — banner --inspection-required, panel 'Required at London Tilbury', copy = 'must go directly to London Tilbury' + BCP fallback paragraph; (b) inspection NOT required — banner --green, panel 'Not required', copy = 'does not need an inspection' + inset 'Initial risk assessments can change.' QA adds an inferred third CHED-P outcome, exact status text 'Check GVMS' (tests/notification/ched-p/ched-p-inspection-non-transit.spec.ts:19-27,98-101). The accompanying banner colour and full instructional copy for Check GVMS were not captured and remain a gap.

- Copy-to-clipboard buttons are progressive enhancement (marked 'hidden' until JS in the green-variant trace). The reference values are always visible in the summary list regardless.

- The feedback link URL uses ched=CVEDP in the Qualtrics query string (legacy 'CVED' naming for CHED-P); recorded verbatim from the trace.

- ConfirmationPage recognises exact text 'Go to place of destination' as a fourth risk-assessment state (page-objects/notification/ConfirmationPage.ts:26-28,50-51), but no admissible CHED-P workflow/spec produces or asserts it. Confirm whether this state applies to CHED-P and, if so, its trigger, banner/panel styling and full guidance copy.

- The QA reference regex permits a 7- or 8-digit numeric suffix (types/ched-type.ts:17), whereas both traces show 7 digits. Confirm whether the rebuilt service must accept and render legacy/exhausted 8-digit CHED-P references.

### transit-exit-bcp

- The authorised legacy template states that exit must be within 7 days of arrival, but no corresponding 7-day validator or ValidationMessages.properties entry was found in the consignment-purpose route or model; only requiredness and date-shape validation are implemented (consignmentPurpose.html:181-190; consignment_purpose_validation.js:284-305). Treat the 7-day rule/error copy as an unresolved legacy discrepancy rather than inventing a message.

- Legacy source resolves the conditional requiredness: for Transit, exit BCP, at least one transited country, destination country, complete date and complete time are required (consignment_purpose_validation.js:43-103,284-305). This is old-system policy and should be explicitly accepted or revisited for the rebuild.

- No error state was captured in this trace (0 errors) — validation messages for the Transit conditional fields (missing exit BCP, missing/invalid exit date, exit date outside the 7-day window, missing/invalid time, missing transited/destination country) are gaps. The CHED-P QA test stops on this page and inspects only the option list (tests/notification/ched-p/ched-p-holyhead.spec.ts:14-25).

- The exit date hint states 'This must be within 7 days of arrival in Great Britain' — this is a cross-field business rule (exit within 7 days of arrival). Confirm the exact rule and its error message against templates/backend.

- 'Add another country' implies the transited-country list is repeatable (unbounded?); no trace exercised adding a second country, so the max count and the removal UX are a gap.

- Sibling conditionals on the same DOM are included in the field inventory to avoid omitting controls: Internal market reveals sub-radios 'Purpose in the internal market' (Animal feedingstuff / Human consumption / Other, name=internal-market); Transhipment reveals a single 'Destination country' select (name=third-country-transhipment, 251 opts). Re-entry revealed no extra fields. They are not part of the Transit block itself.

- The platform-chrome back link has the verbatim text 'Back' and href '#'; the trace does not establish its eventual history-navigation target.

- The bespoke defra-datepicker overlay is a rebuild decision point — recommend dropping it for the plain govuk-date-input in the new app.

- The shared page object also exposes a free-text 'Point of exit' and a combobox labelled 'BCP or Port of exit' (page-objects/notification/AboutTheConsignmentPage.ts:54-56,86-92). No admissible CHED-P workflow/spec uses these locators; CHED-P specifically inspects the 'Exit border control post' select (tests/notification/ched-p/ched-p-holyhead.spec.ts:21). Confirm whether the alternative controls are legacy/other-CHED variants rather than CHED-P requirements.

- The QA automation neither fills nor submits the CHED-P Transit conditional block. Requiredness is therefore not corroborated for exit BCP, exit date/time, transited countries or destination country; their existing required=false values mean 'not proven required', not confirmed optionality.

### common-user-charge

- EVIDENCE POINTER WAS WRONG: the supplied pointer (trace 1ed626a0..., action 110) lands on the 'Goods movement services' page — the Common TRANSIT Convention (CTC) / GVMS question (radio group 'Are you using the Common Transit Convention (CTC)...'), NOT the Common USER Charge. The two were conflated on the word 'Common'. I located the actual CUC page myself: action 142/147, the 'Confirm billing details' page (caption 'Billing'), confirmed by its links to gov.uk/guidance/common-user-charge-rates-and-eligibility and .../paying-the-common-user-charge-terms-and-conditions.

- URL/slug mismatch: IPAFFS serves this under /billing-details/confirm (with sub-pages find-address, select-address, and a 'Change billing contact details' contact page), not /common-user-charge. The new app's 'common-user-charge' slug maps to this IPAFFS 'billing-details' feature.

- Journey position is corroborated by QA: the CUC/billing-details flow appears near the END of the journey, after transporter, contact, nominated contacts and branch-address steps, and immediately before Review notification (workflows/notification/ched-p-workflows.ts:503-549).

- This 'Confirm billing details' page itself has no editable form controls — the visible summary (name/address/email/phone) is read-only; the page form contains hidden billing values, three Change links and three submit buttons, plus two guidance links and a Details disclosure. Editable postcode/address-result/email/telephone controls occur on separate sub-pages and are deliberately not represented as fields of this URL.

- No validation error state was captured for this confirmation page — the trace is a clean happy path (0 errors), and the CUC test only asserts successful submission/status (tests/notification/ched-p/ched-p-cuc.spec.ts:11-31). Validation on the separate address/contact sub-pages must be specified on those pages.

- Legacy confirms this confirmation page performs no field validation: its handler supplies an empty errors array and POST directly persists hidden billing data before routing by the pressed action (ipaffs-frontend-notification/service/src/routes/handlers/importer/confirm_billing_details.js:23-47,50-70). There are therefore no applicable validation messages or editable mandatory fields on this page.

- The exact label/state of #confirm-billing-address before any billing address exists was not snapshotted or asserted. QA identifies it only as linkChangeAddress (page-objects/notification/ConfirmBillingDetailsPage.ts:6-8); resolve through another admissible trace or human confirmation.

- QA sets both portOfEntry=Sevington and isCuc=true (tests/notification/ched-p/ched-p-cuc.spec.ts:14-20), while the workflow comment says the CUC branch is triggered by Sevington but gates automation on isCuc (workflows/notification/ched-p-workflows.ts:538-539). The test does not isolate whether Sevington alone triggers the UI or whether another eligibility rule/flag is also required.

### billing-select-address

- WRONG PAGE POINTER: inventory action 143 is the preceding 'Find an address' page (H1 'Find an address'), not this slug's select-address page. The target is independently re-established at action 145 with H1 'Select the address' and title 'Select billing address - Import and export applications - GOV.UK'.

- The Find an address page is a separate URL and is no longer merged into this spec. Its editable postalCode field, Find address button, Details copy and Enter address manually link must be specified on that page.

- Validation copy for continuing without a selected address is unknown because no error state was captured.

- LEGACY RESOLUTION: addressListBox is mandatory and both an empty placeholder and a missing value produce "Select address from the list" (ipaffs-frontend-notification/service/src/validation/validation_messages.js:50; service/src/validation/routes/handlers/importer/select_billing_address_validation.js:11-19).

- Legacy also requires the hidden postalCode to remain present and valid because POST re-fetches the address list and uses addressListBox as its array index (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/select_billing_address.js:31-35). Missing/empty copy is "Enter postcode" and pattern copy is "Enter valid UK postcode" (select_billing_address_validation.js:20-24). This hidden-state trust model should be reconsidered in the rebuild so the selected result is bound safely to the lookup session.

- The 46 address rows are runtime postcode-lookup data. The rebuilt service must integrate an address-lookup provider rather than hardcode these observed options.

- The manual fallback link goes to /billing-details/address, which is a separate manual-address page.

### billing-contact-details

- The page-inventory description says "billing contact name / email / phone", but both admissible sources show only Email address and Phone number: the rendered trace has two inputs and BillingChangeContactDetailsPage exposes only those two textboxes (page-objects/notification/BillingChangeContactDetailsPage.ts:6-12). Was contact name retired, or does an untested variant add it? The unsupported placeholder field has been removed from this spec pending evidence.

- No `required` attribute is set on either input (both required=false in the DOM). The QA page object always fills both fields before continuing (page-objects/notification/BillingChangeContactDetailsPage.ts:18-22), but no test exercises missing/invalid input. Are either fields server-side required, and what exact validation copy applies?

- LEGACY RESOLUTION / POLICY POINT: both email and telephone are required by server-side Joi. Email is lowercased, format-validated and capped at 100 characters; telephone must be 9–20 characters and match the billing telephone regex (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/billing_contact_details_validator.js:22-37). Retain equivalent server-side enforcement even though the legacy HTML has no required attributes.

- Legacy BillingInformation also declares contactName @NotBlank alongside emailAddress and phoneNumber (ipaffs-imports-notification-schema/notification-schema-java/src/main/java/uk/gov/defra/tracesx/notificationschema/representation/BillingInformation.java:15-30), but this page's authorised template and handler expose only email and telephone and appear to source initial values from IDM (billingContactDetails.html:19-40; billing_contact_details.js:62-86). Do not add a contact-name control to this page without a separate policy decision about how the rebuild supplies that model value.

- The HTML input name for phone is `telephone` (type=tel) while email uses `email` (type=text). The new app should preserve these two billing-contact fields; capture server-side validation rules separately.

- The page is reached from the CUC billing flow (action 142 clicked #confirm-billing-address, action 147 clicked #confirm-billing-address-email). The workflow gates the billing sub-flow on isCuc (workflows/notification/ched-p-workflows.ts:538-545), and the CUC test sets both Sevington and isCuc=true (tests/notification/ched-p/ched-p-cuc.spec.ts:14-20). Confirm whether Sevington alone determines CUC in production or whether other conditions/ports can also make isCuc true.

- Hidden form fields present: crumb (CSRF), etag, returnUrl, fromFooterHeader — platform plumbing, not user-facing requirements.

### catch-certificate-needed

- This is an IUU (fish) boundary page that has moved to a separate IUU journey. Preserve the behaviour and copy captured here, but confirm the hand-off contract and whether this page should be implemented or owned outside the core CHED-P journey.

- The radio inputs have no HTML required attribute and the 'no option chosen' state was never exercised in the trace, but the authorised legacy Joi validator enforces a selection server-side and supplies the copy "Select if you need to add catch certificates" (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/catch_certificate_exemption.js:20-29). The IUU handoff should confirm whether to retain this exact copy.

- The visible URL/slug is 'catch-certificates' (plural), the field name is 'catch-certificate-needed', and returnUrl points to '/catch-certificates'. Selecting 'Yes' presumably routes to a catch-certificate document-add flow; that downstream page is a separate spec.

- Two <h1> elements and an empty fieldset legend — confirm intended heading structure for the rebuild.

- The 'No' option copy is specifically about wild fish exempt from IUU controls, while the QA fish workflow reaches this page after selecting type 'Farmed stock' with species 'Anguilla spp.' (workflows/notification/ched-p-workflows.ts:866-900; types/commodity-type.ts:4; types/species.ts:10). Confirm the exact commodity/species condition that surfaces the IUU boundary and whether the option wording is correct for farmed-stock consignments.

### attach-catch-certificate

- No back link was rendered on this page — only a 'Cancel' link to the notification overview. Confirm whether a GOV.UK back link is expected in the rebuild.

- The file input has no 'accept' attribute; the DOC/PDF/XLS/JPEG/PNG, smaller-than-10MB, 10-at-a-time and 100-total constraints are stated in rendered copy, but their enforcement and exact error copy were not exercised by either source. All four validation messages remain gaps.

- LEGACY RESOLUTION: all rendered constraints are server-enforced with exact messages. The accepted extension set also includes DOCX and XLSX even though the display/error copy collapses them under DOC and XLS (ipaffs-frontend-upload/service/src/utils/validation_constants.js:81-100; service/src/validation/file_upload_validation.js:113-156,179-205). Confirm whether the IUU rebuild should name DOCX/XLSX explicitly.

- The trace captured an empty .uploaded-files-list before upload. The QA workflow selects one valid PNG per visit at workflows/notification/ched-p-workflows.ts:910 and immediately continues at workflows/notification/ched-p-workflows.ts:911, so multi-selection, the completed uploaded-file list, per-file removal, and any upload or scan states remain uncorroborated.

- The DOM has no required attribute and the trace records required=false, while the QA workflow always supplies a file before Continue (workflows/notification/ched-p-workflows.ts:910-911). The details copy explicitly contemplates not having certificates yet; confirm whether continuing with no file is intentionally allowed and, if not, capture the empty-submit error.

- LEGACY RESOLUTION / POLICY POINT: Continue with no selected filename is rejected with "Select at least 1 document" before any upload attempt (ipaffs-frontend-upload/service/src/routes/handlers/upload/catch_certificates_upload.js:42-46; service/src/validation/file_upload_validation.js:179-193). The details disclosure explains delay but the legacy route still requires a file to leave this page; a user without certificates must Cancel/back out.

- The 'Continue' primary button submits the upload page; the QA workflow then opens Add details from the manage page (workflows/notification/ched-p-workflows.ts:913-919). Catch certificate reference, date of issue, flag state and species therefore belong to the separate catch-certificate-details page, not this upload page.

- The fish-workflow comment says the catch-certificate count defaults to 1 (workflows/notification/ched-p-workflows.ts:816), but DEFAULT_FISH_CONFIG actually sets it to 2 (workflows/notification/ched-p-workflows.ts:825). This affects how many times the upload page is exercised; confirm which default is intended.

- IUU boundary: this trace-derived page is reached from the CHED-P fish workflow at workflows/notification/ched-p-workflows.ts:898-911, but catch certificates have moved to a separate IUU journey. Confirm the rebuild ownership and handoff boundary rather than treating this as a core CHED-P page; the standard CHED-P accessibility sequence moves directly from Commodity Additional Details to Latest Health Certificate at tests/accessibility/ched-p-accessibility-tests.spec.ts:80-86 and does not exercise this page.

### add-catch-certificate-details

- Validation copy is unknown — no errored trace was mined for this page. Which of reference / date of issue / flag state / species are mandatory, and what are the exact error messages?

- LEGACY RESOLUTION / POLICY POINT: each catch-certificate reference and flag state is mandatory; date of issue is optional but validated when supplied; neither Select all nor the dynamic species checkbox keys are validated, so zero species is accepted by this legacy page handler (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/add_catch_certificate_details_validation.js:42-73,107-145). Confirm whether the IUU rebuild should intentionally make date and at least one species mandatory.

- LEGACY RESOLUTION: changing the attachment count requires a numeric value from 1 to 20 and cannot reduce it below the number of detail records already saved (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/add_catch_certificate_details_validation.js:76-105; constants at service/src/utils/validation_constants.js:334-346).

- The page uses a per-attachment loop: each attachment can hold N catch certificates (number-of-catch-certificates), each an accordion section with its own reference/date/flag-state/species. After saving, the journey returns to 'Manage catch certificates' (ManageCatchCertificatesPage) with an 'Upload more catch certificates? Yes/No' loop — confirm the loop boundary and how 'Save and return to manage catch certificates' vs 'Save and continue' differ.

- Species checkbox set is derived from the consignment's commodities (only fishery-product commodity codes). Confirm the filter rule and whether species can be zero.

- Date of issue and Flag state use custom widgets (defra-datepicker, accessible-autocomplete). Confirm whether the rebuild keeps the calendar picker / autocomplete or reverts to the plain GOV.UK Date input + Select.

- This whole page is conditional on the consignment containing fishery products; confirm the exact commodity/IUU trigger that gates it.

- IUU JOURNEY BOUNDARY: this catch-certificate page has moved to a separate IUU journey and should be treated as a CHED-P-to-IUU boundary page, not an ordinary page in the core CHED-P rebuild. Confirm which service owns the page, the hand-off/navigation contract, and whether this legacy CHED-P-shaped URL remains part of the integration boundary.

- The main CHED-P accessibility workflow does not traverse the fish/IUU catch-certificate branch: it goes from Commodity Additional Details to Latest Health Certificate (tests/accessibility/ched-p-accessibility-tests.spec.ts:80-89). Where is equivalent accessibility coverage for this IUU boundary page?

### notification-search-view

- This is a post-submission notifier view, not part of the CHED-P creation journey. The search dashboard (/notification/vnet/protected/notifications) is a shared surface across ALL CHED types — the field list here filters every notification type, not just CHED-P. The new simple CHED-P app may need only a much thinner listing/search of its own notifications, but must still expose: search by reference/keyword, by commodity, by BCP/POE, by status, by country of origin, by consignee/importer, by notification type, and by arrival date range; sort by arrival date; and a results list showing Reference number, Commodity, Arrival at BCP or POE, CHED status, Consignee, Consignor, Origin and Inspection outcome.

- The notifier's Checks tab (trace 041c29c39002db28bc43ff85691f757cec6e31db action 197 after snapshot; the input snapshot still shows the Notification tab) shows READ-ONLY inspector output the notifier consumes: Border Control Post reference number, IUU, check results (Documentary check / Full identity Check / Physical check — each Satisfactory), Seal numbers, Laboratory tests (Required: No), Accompanying documents table (Document type / Document reference / Date of issue / Attachments — with a downloadable attachment link e.g. example.xlsx), and Decision information (Decision result: Acceptable for internal market / Decision recorded by / date / time / Declaration date / Consignment use: Animal feeding stuff). The new app must be able to DISPLAY this inspector decision + attachment to the notifier, even though the notifier does not author it.

- The view page also shows a top summary of three references the notifier must copy onto the customs declaration: CHED reference (CHEDP.GB.2026.1525746), Reference for your customs declaration (GBCHD2026.1525746) and Customs document code (N853), each with a Copy button and a warning that the correct reference/code must be used or the consignment will be delayed. This copy-references-with-warning requirement is a distinct requirement for the new app.

- Option counts for BCP/POE (284) and Country of origin (257) are large reference-data lists in the cited snapshot; only a representative subset is captured verbatim and both are marked optionsTruncated. The new app should source these from a reference-data service, not hardcode them.

- No validation-error state for the search form itself was captured in the rendered traces, but the authorised legacy frontend establishes max-length, allowed-value, invalid-date and date-order validation copy. The rebuild should decide whether to retain these legacy constraints.

- The QA page object exposes a per-notification decision date at page-objects/notification/NotificationDashboardPage.ts:240, whereas the traced result card showed Arrival at BCP or POE but no Decision date. No CHED-P test invokes the locator; confirm the statuses or dashboard variant for which it appears.

- The QA page object models both bespoke result-card actions by ID (Copy as new / View details / Amend at page-objects/notification/NotificationDashboardPage.ts:100, page-objects/notification/NotificationDashboardPage.ts:104 and page-objects/notification/NotificationDashboardPage.ts:128) and table rows under #notifications-page tbody at page-objects/notification/NotificationDashboardPage.ts:244. The trace rendered custom definition-list cards, so confirm whether the table locator belongs to a role/responsive variant or is stale.

### attachments-tab

- Evidence pointer for the error state (trace 683661143a13d261e21f9f2552580756bc4d2350 action 20) was WRONG — action 20 is a 'Type of commodity' select on a commodity page, not the Attachments tab. The real invalid-empty-upload error renders on the 'Upload a document' sub-page at action 163 (alert 'The selected file is empty'), reached via Attachments tab (action 154) -> fill document-type/reference/date (155-159) -> Add attachment (160) -> set empty file (161) -> Continue (162). Used action 163 instead.

- The Attachments 'Documents' page and the 'Upload a document' sub-page are two distinct pages sharing one workflow — the add-document row (type/reference/date + Add attachment) lives on the Documents page; the actual file picker + validation lives on the Upload sub-page. Both captured here.

- Only 'Other' was observed as the selected document-type default; whether the empty 'Select document type' placeholder triggers its own required-validation was not exercised in these traces (gap).

- LEGACY RESOLUTION: once any inspector document metadata is entered, Add another document is submitted, or Add attachment is used, document type is required and the empty/invalid copy is "Select a document type" (ipaffs-frontend-decision/service/src/validation/documents_validation.js:18-42; messages/en.js:3).

- Required flags: all inspector add-document controls report required=false in the DOM (client-side); server-side conditional requirements (e.g. reference/date mandatory once a type is chosen) were not exercised — gap.

- LEGACY RESOLUTION / POLICY POINT: for a new inspector document, type, reference, and the complete issue date are mandatory; the reference maximum is 32 characters and the issue year is restricted to 2020–2050 (ipaffs-frontend-decision/service/src/validation/documents_validation.js:18-59,78-81). This is the inspector-side rule as the old system had it and is stricter than notifier-side CHED-P additional documents, where reference/date are optional.

- File-size (10MB) and file-type (DOC/JPEG/PDF/PNG/XLS) validation messages were not captured — only the empty-file error rendered; their exact copy is a gap.

- LEGACY RESOLUTION: the upload service supplies exact empty-selection, type, size, empty-file and minimum-size messages (ipaffs-frontend-upload/service/src/utils/validation_constants.js:3-23; service/src/validation/file_upload_validation.js:73-110,159-169). As elsewhere, DOCX/XLSX are accepted but omitted from the display/error list, and the minimum-size copy says 1KB while the single-file validator threshold is actually 200 bytes; confirm corrected rebuild copy and thresholds.

- The Importer section (catch certificates, latest health certificate, cloned documents, additional documents) is read-only display of the notifier's documents; the notifier-side upload flow was not exercised in these two traces.

- The QA domain vocabulary is broader than the 14-option list rendered in the trace: types/document-type.ts:1-29 also defines values such as Cargo Manifest, Certificate of origin, Ingredients list, Packing list and Road consignment (CMR) note. The trace-confirmed option list is retained; confirm whether the broader values belong only to other CHED/document variants or can appear on this page.

- The shared page object exposes a Success region and separate notifier/inspector attachment-link locators (page-objects/notification/AccompanyingDocumentsPage.ts:27-37), but the scoped CHED-P workflow only fills document metadata and continues without uploading an accompanying document (workflows/notification/ched-p-workflows.ts:356-363). Exact success-banner copy and the post-upload state on this submitted-notification tab remain ambiguous.

- The QA evidence names and drives the pre-submission Accompanying Documents page, while this spec covers the post-submission Documents/Attachments tab. The matching locators, inspector-specific #inspector-documents-table locator (page-objects/notification/AccompanyingDocumentsPage.ts:35-37), and rendered trace indicate a shared component, but the scoped CHED-P tests do not explicitly prove that every pre-submission behaviour is available on the post-submission tab.

### bip-notifications-dashboard

- This is the inspector / decision app (B2B) dashboard, NOT part of the CHED-P notifier (importer) journey. It is journey position -1 and out of the core rebuild scope for the simple CHED-P notifier app. Confirm whether the new app owns any of this inspector search dashboard, or only needs to expose CHED data that this dashboard reads.

- The search form is a SINGLE shared form across all four CHED types (CHED-A/P/PP/D); the CHED-A ('Microchip number') and CHED-P ('Risk category') facets are always rendered and labelled with their type. If the new app rebuilds any inspector search, decide whether to keep one shared form or split per type.

- No validation states were captured in the traces, but legacy source resolves the gap: all search fields are optional; the text searches have 255-character limits, partial/invalid dates and times have specific validation copy, and cross-field ordering is enforced (ipaffs-frontend-decision/service/src/validation/home.js:35-68; service/src/validation/datetime_form_validator.js:34-82,117-147).

- The BCP select (284 options in the observed trace) and Country of origin select (257 options in the observed trace) are reference data heavily polluted with test entries (e.g. 'ABC Legal - ...', 'test Victor - 789', 'thisistest2kelabaal'). The new app sources these from a reference-data service.

- The page uses several bespoke, non-govuk widgets (defra-datepicker, notification-list__* results cards, custom .pagination, alert-dashboard-summary) — all replaceable by standard Design System components (plain date input / MoJ date-picker, govuk-summary-list or govuk-table, govuk-pagination) if this surface is in scope.

- The page also carries legacy pre-govuk class names (form-group, form-label-bold, sr-only, tag) alongside modern govuk-* equivalents, indicating a partially-migrated legacy page.

- The QA DecisionDashboardPage independently exposes only Keywords or CHED number, Commodity, CHED status, Country of origin and start/end date controls (plus quick-date buttons) from the trace-confirmed search form. No QA page-object counterpart was found for Select BCP, CHED type, Consignee, Decision, Risk outcome filter, Microchip number, Risk category, start/end time or Sort by; preserve the rendered definitions, but treat their second-source corroboration as a gap.

- Legacy validation also defines lower/upper-year and non-numeric component variants in the shared date helper (ipaffs-frontend-decision/service/src/validation/date_validation.js:155-190). The principal user-facing dashboard messages are captured here; exhaustive combinations of every malformed date component remain an honest gap because no dashboard-specific rendered or test trace establishes which duplicate Joi error survives mapping.

- No missed CHED-P dashboard controls were found: the authorised search template's complete visible field set at ipaffs-frontend-decision/service/src/views/partials/common/searchAndFilter.html:10-72 matches the rendered inventory.

### bip-notification-hub

- This is a decision/inspector-app hub (journey position -1), not part of the CHED-P importer pre-notification submission journey. Confirm it is in scope for the rebuilt importer-facing app, or whether it belongs to a separate decision/BCP-inspector service.

- Only the 'To do' status tag was observed (both traces were fresh notifications). The other task states (e.g. In progress / Completed / Cannot start yet and their tag colours) were not exercised in these two traces and are a gap — mine an in-progress decision trace to capture the full status vocabulary and colours.

- The task list is fixed at seven rows in both traces, and the CHED-P QA workflows consistently traverse Documentary check -> Identity and physical checks -> Seal numbers -> Laboratory tests -> Decision for both permit and reject outcomes (workflows/notification/ched-p-workflows.ts:1161 and workflows/notification/ched-p-workflows.ts:1187). No test explicitly asserts that all seven rows remain visible for every risk outcome, so conditional visibility is still a gap.

- The banner has two observed states (No inspection required / Inspection required). Other risk outcomes or an override-applied state may exist and were not seen — gap.

- The 'Save and set as in progress' button, 'New' status tag, 'Override Responsible Person' and 'Attachments' links render in decision-app chrome ABOVE <main>, not inside it. Recorded as secondaryActions; confirm whether they are page requirements or shared decision-app chrome.

- The shared DecisionHubPage also exposes CHED-D-only 'Checks' / 'Cancel CHED' controls and CHED-PP-only 'Record PHSI checks' / notification-overview variants. They were not added as CHED-P requirements because their QA usages are confined to other CHED types.

- Request amendment is exposed by the shared decision-hub page object but no CHED-P test invokes it, so its exact eligibility condition and placement are a gap.

- Legacy source resolves the ordinary CHED-P task status vocabulary: each task is 'Started' when any field in that section has a value, otherwise 'To do'; Review and submit is deliberately always 'To do' (ipaffs-frontend-decision/service/src/routes/handlers/bip/notification_hub.js:102-119). Started is blue and the default/To do state grey (service/src/utils/handlebars.js:566-571). 'Completed' and 'In progress' apply to the separate CHED-PP hub-status helper, not these CVEDP rows (service/src/utils/handlebars.js:573-581).

- Legacy source adds a feature- and commodity-dependent 'IUU' task row for CHED-P that neither supplied trace rendered (ipaffs-frontend-decision/service/src/views/bip/notificationHub.html:186-200; handler condition at service/src/routes/handlers/bip/notification_hub.js:275-278). Its mandatoriness remains configuration/policy dependent.

- Legacy-vs-QA discrepancy: the authorised hub template contains no 'Request amendment' control; that link is in the separate notification overview template (ipaffs-frontend-decision/service/src/views/bip/overview.html:29). Preserve the inferred item but confirm whether the rebuild should treat it as overview-only.

- No validation messages apply to the hub itself: its visible controls are navigation links or action-selection submits, and the POST handler only dispatches by the presence of those action keys (ipaffs-frontend-decision/service/src/routes/handlers/bip/notification_hub.js:172-209). Field-level checks are enforced on the destination task pages.

### documentary-check

- RESOLVED FROM LEGACY: CHED-P model validation requires documentCheckResult and emits the terse message "Documentary check" when it is absent (ConsignmentCheck.java:100-109; ValidationMessages.properties:150). The page-specific validator does not enforce the radio selection itself, so no friendlier page-level "select an outcome" copy exists in the authorised source.

- RESOLVED FROM LEGACY: the over-limit message is "Additional details must be 150 characters or less" (ipaffs-frontend-decision/service/src/validation/consignment_eu_doc_check_validation.js:18-25; exact test assertion at service/test/validation/consignment_eu_doc_check_validation_test.js:16-24).

- The 'Additional details' conditional textarea (revealed only under 'Satisfactory following official intervention', value 8) was never exercised in these two traces — its behaviour/persistence is confirmed structurally but not through a filled value.

- 'Save and continue' is corroborated by the CHED-P QA workflow and proceeds to Identity and physical checks (workflows/notification/ched-p-workflows.ts:1081). 'Save and return' has no page-object locator or CHED-P test, so its return-to-hub behavior remains inferred from its label.

- The 'Inspection required' notification banner content (commodities list, 'cannot override' message) is data-driven by the consignment's risk decision; it may not appear for consignments with no inspection required — that conditional was not varied across the two traces.

- The shared DocumentaryCheckPage exposes #documentaryCheck1 and #documentaryCheck2 checkboxes at page-objects/decision/DocumentaryCheckPage.ts:14 and page-objects/decision/DocumentaryCheckPage.ts:18, but all usages are confined to CHED-D workflows. They were not added as CHED-P fields.

- QA independently corroborates only the Satisfactory and Not satisfactory radio options. It has no locator or CHED-P test for Satisfactory following official intervention, Not done, or Additional details; those trace-confirmed definitions remain second-source gaps.

- Legacy policy point: confirm that the rebuild should retain model-level mandatory documentary-check selection and replace or contextualise the old source message "Documentary check", which is exact but not instructive.

- The complete authorised CHED-P branch in ipaffs-frontend-decision/service/src/views/bip/consignmentEuDocCheck.html:33-197 contains the four outcomes and optional 150-character Additional details field already captured. The extra intervention-reason radio set at lines 58-143 is guarded by isCveda and is not a missed CHED-P field; no missed field was added.

### identity-physical-check

- This is the decision (inspector) app, not the importer notification journey — page URL is /decision/vnet/protected/bip-notifications/{chedRef}/identity-physical-checks. The stated url pattern /decision/.../identity-check was approximately right.

- RESOLVED FROM LEGACY: CHED-P model validation normally requires the identity type/result pair and a physical result, conditionally requires the Not Done reasons, and the page validator requires Other free text. The exact legacy messages are now recorded. No errored rendered trace was supplied, so they remain confidence=legacy rather than confirmed.

- Legacy/rendered mandatoriness finding: none of the controls has an HTML required attribute, but model/page validation supplies the requirements. The model exceptionally permits missing identity and physical checks when the documentary check is Not satisfactory and the decision is not acceptable (ChedpIdentityCheckValidator.java:23-32; ChedpPhysicalCheckValidator.java:22-29). Confirm this old-system exemption for the rebuild.

- Only one commodity/check block was present in this trace (single identity-check-type group, ids ...Full5/6/7 map to Seal/Full/NotDone options of ONE group, not three commodities). Whether the page repeats the whole Identity+Physical block per commodity on multi-commodity consignments is a gap — not exercised here.

- The Identity check 'Not Done' result options (Reduced checks regime / Not required / Chilled equine semen facilitation scheme) and Physical 'Not Done' reasons (Reduced checks regime / Other + free text) were read from the hidden conditional markup, not observed being selected. Verbatim but not user-exercised in this trace.

- 'Save and set as in progress' and the intensified-official-control banner sit outside main in the page chrome/status region; they are captured above because they are present in the cited page snapshot.

- This decision-app inspector page is likely OUT OF SCOPE for the new importer-facing CHED-P rebuild (it records the BCP inspector's identity/physical check outcome, not importer pre-notification data). Flag for scope ruling.

- QA independently corroborates only Full identity check, its Satisfactory result, Physical check = Satisfactory, Save and continue, and the presence of Save and return. It has no CHED-P locator/test for Seal check only, either Not Done branch, either Not satisfactory option, or the Other reason text field; those trace-confirmed definitions remain second-source gaps.

- IdentityAndPhysicalChecksPage is shared with CHED-A and exposes animal-count fields plus CHED-A identity/physical/welfare controls at page-objects/decision/IdentityAndPhysicalChecksPage.ts:14 and page-objects/decision/IdentityAndPhysicalChecksPage.ts:61. They were not added because no CHED-P workflow uses them.

- Legacy policy point: confirm the normal identity/physical mandatoriness, both Not Done reason dependencies, the rejected-after-documentary-failure exemption and whether Other reason should be length-validated rather than silently truncated at 255 characters.

- The complete authorised CHED-P branches at ipaffs-frontend-decision/service/src/views/bip/consignmentEuIDPhysicalChecks.html:46-111 and :187-230 contain only the controls already captured. Animal-count and welfare fields are CHED-A-only branches; no missed CHED-P field was added.

### laboratory-test-required

- Evidence pointer said url pattern '/decision/.../lab-test-question' and label 'Laboratory test required?'; the rendered page slug is 'lab-tests-required', H1 is 'Laboratory tests', and the question legend is 'Would you like to record laboratory tests?'. The 'No' radio is default-checked. Both traces confirm this.

- RESOLVED FROM LEGACY: CHED-P model validation requires laboratoryTestsRequired and emits "Are laboratory tests required" when absent (PartTwo.java:79-87; PartTwoFieldValidator.java:89-96; ValidationMessages.properties:183). No errored rendered trace exists, so this remains confidence=legacy rather than confirmed.

- Legacy/rendered mandatoriness finding: neither radio has an HTML required attribute, but the handler defaults the view value to false and therefore normally preselects No, while later model validation requires a Boolean. Confirm whether the rebuild should preserve a default No or require an explicit Yes/No choice.

- Page is served in the inspector/decision context (Cancel link href '/decision/vnet/protected/bip-notifications/{ref}/hub'). QA confirms routing rather than an on-page reveal: Yes proceeds to laboratory-test reason/setup (workflows/notification/ched-p-workflows.ts:1093), while No bypasses that setup and proceeds to the decision scope (workflows/notification/ched-p-workflows.ts:1174).

- The shared LabTestsIntroPage also exposes a Random radio at page-objects/decision/LabTestsIntroPage.ts:14, but its only QA usages are CHED-A workflows. It was not added as a CHED-P option.

- The complete authorised template at ipaffs-frontend-decision/service/src/views/bip/labTestsRequired.html:21-38 contains only the captured Yes/No field and shared actions. Random belongs to a subsequent CHED-A flow, not this CHED-P template; no missed CHED-P field was added.

### laboratory-test-setup

- RESOLVED FROM LEGACY: all ten visible data controls are mandatory, with Laboratory name/address conditional on Other; Number of samples is 1-100000; Sample reference is max 58; custom lab name/address are max 255; sample date is complete/real and 1970-9999; sample time is 00:00-23:59. Exact source messages are recorded from the handler/shared date rules and authorised tests.

- The 'Other' laboratory conditional was never exercised in the trace, but legacy confirms both fields are conditionally required/max 255. Authorised tests also reveal a legacy Joi quirk: omitting Laboratory emits required errors for Laboratory, Laboratory name and Laboratory address together (service/test/handlers/bip/lab_tests/lab_test_applicant_information_test.js:288-306). The rebuild should show the conditional errors only when Other is explicitly chosen.

- This is the 'lab-test/.../applicant-information' page reached in the DECISION workflow (recording a lab test decision on a consignment under intensified official control), URL /decision/.../lab-test/0/1549/applicant-information — matching the page's -1 journey position. It is not part of the importer's create-notification (CHED-P pre-notification) happy path. Confirm this lab-test setup belongs in the rebuild's scope, or whether it is BCP/inspector-side decision recording that the new importer app does not need.

- 'Number of samples' is a free-text HTML input, but the legacy server already enforces an integer from 1 to 100000. The rebuild should use an appropriate numeric input mode while retaining server validation.

- The Laboratory list contains an apparent duplicate ('The Centre for Environment, Fisheries and Aquaculture Science (CEFAS)' twice, values 21 and 19) and the Sample type list contains verbatim IPAFFS quirks ('Sperme', 'Food Water and Environmental Laboratories (FWE)PA)'); reference-data cleanup for the new app.

- Analysis type default 'Initial analysis' is pre-selected; whether Counter/Second expert analysis are only offered on subsequent lab-test rounds is unknown.

- The relevant QA page object exposes only Laboratory, Sample reference number, Number of samples, Sample type, Storage temperature and Save and continue. It has no counterpart for Analysis type, the Other-laboratory name/address branch, or sample date/time; legacy source now supplies their requiredness and error copy, while user-interaction coverage remains absent.

- Legacy policy point: confirm all ten field requirements and limits, especially whether analysis type/date/time should remain prefilled yet mandatory, and correct the missing-Laboratory branch that also errors hidden name/address fields.

- The complete authorised setup template/handler exposes exactly the captured CHED-P controls. CHED-PP-only commodity display differences do not add fields; no missed CHED-P field was added.

### laboratory-test-results

- Evidence pointer for trace c90eb05a1adbcbd0b9adfd55eeb7f3f323a7f645 action 150 was WRONG — action 150 is a 'Keywords or CHED number' search-box fill on the notification search page, not the lab-test-results/pending state. The actual pending-lab-test blocking evidence is action 180 (decision review page, error-summary link 'Lab results pending for this consignment' -> #parttwo/laboratorytestsrequired). Used 180 instead.

- RESOLVED FROM LEGACY: both dates are mandatory and receive complete-date, numeric, range and real-date validation; Test method is optional/max 250; Results is optional/max 1000; Conclusion is not validated by the page or @NotNull model annotations (ipaffs-frontend-decision/service/src/routes/handlers/bip/lab_tests/lab_test_results.js:78-103; LaboratoryTestResult.java:22-36). No error-state trace was supplied, so the messages are legacy rather than confirmed.

- The exact submitted field names are established by the authorised handler/template and recorded on the fields. The decision-review summary shows Conclusion='Pending' and blank dates until this page is completed, but the legacy source surprisingly permits a blank Conclusion, method and Results.

- The bespoke defra-datepicker (Choose date calendar dialog) wraps both govuk-date-input controls — the new app should keep only the plain govuk Date input and drop the custom picker.

- Page furniture note: the page header strip above main carries a status control ('New' + 'Save and set as in progress') which is decision-workflow chrome, captured under secondaryActions.

- QA fills both dates, Laboratory test method, Results and either Satisfactory or Not satisfactory before continuing, but it never submits the page incomplete. Legacy resolves the field rules and exact source copy; no rule compares sample-use-by date with released date, so cross-date ordering remains an intentional source gap rather than an undocumented assumption.

- The trace confirms a third Conclusion option, Not interpretable, but RecordLaboratoryTestInformationPage has no locator and no CHED-P workflow/test selects it; its second-source behavior is a gap.

- The downstream decision-review messages 'The following mandatory fields have not been completed' and 'Lab results pending for this consignment' are trace-confirmed at action 180, but they are not components or validation messages on this laboratory-test-results page and are therefore not listed as this page's requirements.

- Legacy policy point: confirm mandatory sample-use-by/released dates, the 250/1000 limits, the absence of date-order validation, and whether Conclusion/method/Results should remain optional. In particular, an optional Conclusion conflicts with the page's purpose and pending-results gate.

- The complete authorised results form at ipaffs-frontend-decision/service/src/views/bip/labTestResults.html:172-256 contains only the captured two dates, method, Results and Conclusion controls. No missed CHED-P field was added.

### decision-conclusion

- The real route is /decision/vnet/protected/bip-notifications/{chedRef}/decisions (plural), confirmed by navigation in trace 94d29a163f6ab37556cd585b4eabeec9b9c27d84 action 205 and trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 196. This differs from the stated /decision/.../conclusion pattern.

- The H1's CHED reference and version are dynamic instance data: the accept trace renders "CHEDP.GB.2026.1525975 - V1" and the reject trace renders "CHEDP.GB.2026.1526061 - V1". The static template title is "Decision".

- For both supplied actions the trace CLI reported snapshots before/input/after, but `snapshot <action> --name before` returned "No snapshot found". The post-action snapshots were used because they are the relevant rendered states: Internal market revealed after action 206 and Not acceptable revealed after action 197.

- The supplied accept action 206 selects Internal market; the immediately following action 207 selects Animal feedingstuff. The supplied reject action 197 selects Not acceptable; the immediately following action 198 selects Re-dispatching. Those adjacent same-page actions are cited only to record the stated observed nested values.

- No error summary was present in either supplied state and every user control has required=false in the rendered DOM. Server-side validation copy and which combinations are mandatory are therefore a gap; mine a failed submission snapshot to capture exact messages.

- The five hidden select lists are reference data and were truncated as required: border control post lists have 199 options; Destination country lists have 251; Transited country has 254. Only the first 20 rendered options are stored, with optionsTruncated=true. The trace environment contains many duplicate test BCP labels such as "ABC Legal", distinguished by different option values.

- The Not acceptable action fieldset has an empty legend, so its field label is recorded as an empty string rather than inventing copy. Its four visible option labels are confirmed from the reject reveal.

- The hidden Transhipment / Onward travel, Transit, Specific warehouse procedure, Destruction and Other conditional controls were present in raw DOM but were not exercised by the supplied actions. Their observedValues are null. The hidden Channelled group retains Re-import of UK products (Article 15) as a checked value in both supplied after snapshots, so that value is recorded rather than null.

- The refusal "By date" inputs are present on this conclusion page but were left empty in the reject trace; action 199 proceeds without filling them. Whether the empty deadline is intentionally permitted for every refusal action, or only for Re-dispatching pending later workflow handling, needs product confirmation.

- QA automation corroborates only the Internal market + Animal feedingstuff and Not acceptable + Re-dispatching paths (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionScopePage.ts:6-20; /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1138-1151). It has no locators or branch coverage for the other traced decision choices, conditional BCP/country selects, warehouse details, destruction/other reasons, or By date controls, so their server-side requiredness remains uncorroborated rather than inferred.

- DecisionScopePage exposes an `invalidCertificate` checkbox locator at /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionScopePage.ts:22-24, but the rejection workflow uses `decisionRefusal.checkboxInvalidCertificate` only after leaving this page (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1146-1151). No checkbox was rendered in either conclusion trace, so this appears to be a stale/misplaced page-object member and is not added as a conclusion-page field.

- "Save and set as in progress" and the intensified-official-control banner sit outside main in the inspector status/page-chrome region and were excluded per the mining instructions.

- RESOLVED FROM LEGACY: the authorised model supplies nine page-relevant CHED-P decision messages and conditional requirements: overall decision, two transhipment details, three transit details, Channelled choice, Internal market detail and Specific warehouse choice (ValidationMessages.properties:165,171-172,174,177-181; Decision.java:86-147; PartTwoFieldValidator.java:89-96). The legacy frontend additionally requires the Destruction and CVEDP Other reason inputs (consignment_decisions.js:141-168).

- Legacy policy point: the rebuild should confirm all eleven old-system requirements recorded on this page. They are server-side/handler requirements even though every rendered control had required=false.

- HONEST LEGACY GAP: the source property `Select follow up action` exists at ValidationMessages.properties:166, but no schema annotation references its key, and this page declares notAcceptAction as Joi.any() (consignment_decisions.js:120). A legacy handler test explicitly redirects successfully when a refused consignment has no action (service/test/handlers/bip/consignment_decisions_test.js:471-486). The field therefore remains required=false; confirm rebuild policy.

- HONEST LEGACY GAP: an entirely blank refusal By date is accepted because date rules are only activated when at least one date part is present (consignment_decisions.js:229-233; date_validation.js:41-57,72-109), matching the rendered trace. Partial or malformed dates do produce Joi-generated numeric/required errors, but no single ValidationMessages.properties entry governs this composite control.

- The legacy template contains no additional CHED-P decision control absent from this spec: the complete operative form is ipaffs-frontend-decision/service/src/views/bip/consignmentDecisions.html, with its dynamic field-config controls sourced by consignment_decision_field_config_driver.js. No missed field was added.

### decision-reason-for-refusal

- The real route is /decision/vnet/protected/bip-notifications/{chedRef}/refusal, confirmed by document.baseURI and the resolved form action in both traces. The supplied /decision/.../reason-for-refusal pattern does not match the rendered route segment.

- The requested before snapshots for action 200 and action 169 were reported as unavailable by the trace CLI even though each action reported before/input/after snapshots. The available after snapshots were used; both are the intended page and both show Absence/Invalid Certificate checked.

- No control has a required attribute (all required=false). Neither trace contains a govuk-error-summary or any govuk-hint, so validation/error copy is a gap even though server-side validation may still require at least one refusal reason and may validate conditional follow-ups.

- Country is a 251-option reference-data select including the default Select country. Per the mining rule for huge lists, only the first 40 rendered options are included and optionsTruncated=true; the full country dataset should come from maintained reference data.

- The Country, Name and Reason follow-up controls are present in hidden conditional markup but were not revealed or populated in either trace. Their labels, names, types and empty observed values are confirmed from the DOM; user interaction with those branches remains unobserved.

- QA automation covers only Absence/Invalid Certificate and Save and continue (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionRefusalPage.ts:6-12; /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1148-1151). It has no locators or branch coverage for the other 11 traced refusal reasons or the Country, Name and Reason conditional follow-ups, so those branches' server-side requiredness and validation remain gaps.

- The H1's CHED reference and version are dynamic instance data: action 200 renders CHEDP.GB.2026.1526061 - V1 and action 169 renders CHEDP.GB.2026.1525989 - V1. Reason for refusal is the static page-template text.

- The intensified-official-control banner contains instance-specific data: 02: MEAT AND EDIBLE MEAT OFFAL, Cashmere Fibere Afghan Ltd and .AMINOGLYCOSIDE/AMINOSIDE. Both supplied traces happen to render the same values, so which banner segments can vary is inferred from their commodity/trader/test roles rather than demonstrated by these two snapshots.

- RESOLVED FROM LEGACY: the page requires at least one refusal reason and conditionally requires Country, establishment Name and Other Reason; Other Reason is capped at 255 characters (ipaffs-frontend-decision/service/src/validation/refusal_reasons.js:19-35). The CHED-P model independently enforces the same four dependencies (Decision.java:53-80; the four NotAcceptable* validators cited on the fields).

- Legacy copy discrepancy: direct page submission says "Select at least one reason for refusal", while later model validation says "At least one reason for refusal must be selected" (refusal_reasons.js:21-23 versus ValidationMessages.properties:167). Both authorised legacy messages are retained with their distinct triggers; confirm the rebuild's single preferred wording.

- Legacy copy discrepancy: direct page submission uses Joi labels (for example, "Non-Approved Country" is not allowed to be empty), while later model validation uses the noun phrase "Not acceptable country refusal reason details" (refusal_reasons_test.js:44-78 versus ValidationMessages.properties:168-170). Both are recorded rather than treating either as rendered-confirmed.

- Legacy policy point: confirm whether the rebuild retains all four old-system requirements. The source requirements are conditional/server-side even though the rendered controls had no HTML required attributes.

- The complete non-CHEDPP refusal partial at ipaffs-frontend-decision/service/src/views/partials/bip/refusal/nonChedppRefusal.html:1-63 contains exactly the checkbox-driven controls already captured here. No missed field was added.

### decision-datetime-submit

- Action 210 is the requested decision-date/time state: it fills the Month control after Day was filled, and the same snapshot contains "Now submit your decision", "Date and time of checks" and "Submit decision". No substitute action was needed.

- The trace does not show a separate /decision/.../decision-submit page. The target section is embedded in the full "Review outcome decision" page; its enclosing form has action="review", so the observed route is recorded as /decision/vnet/protected/bip-notifications/{chedRef}/review rather than inventing the supplied approximate /decision/.../decision-submit pattern.

- Corroboration finding for the shared-page ambiguity: CHED-P QA automation likewise models this as DecisionReviewPage at `{chedReference}/review` (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionReviewPage.ts:11-14). Its rejection workflow goes directly from DecisionScopePage (Not acceptable + Re-dispatching), through DecisionRefusalPage, to DecisionReviewPage; there is no standalone re-dispatch/refusal-by-date page or step (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1203-1213). The trace places the refusal "By date" inputs on the decision-conclusion page, while this review page owns only the checks date/time.

- The page object's certification-radio locator expects text matching "I, the undersigned certifying officer" (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionReviewPage.ts:40-42), whereas the rendered trace says "I, the undersigned official inspector for the entry point...". The workflow never uses that locator, so the trace-confirmed wording is retained and the locator appears stale or shared with a different decision variant.

- RESOLVED FROM LEGACY: the normal Submit decision handler requires signAndSubmit, hour and minute. It also validates all checks-date parts as integers and, once any date part is supplied, applies a complete-date rule with day 1-31, month 1-12 and year at least 1970 (ipaffs-frontend-decision/service/src/routes/handlers/bip/review.js:115-148; service/src/validation/date_validation.js:41-57,100-109). No errored rendered trace was supplied, so the source-defined messages remain confidence=legacy rather than confirmed.

- Legacy/rendered mandatoriness finding: every visible control had required=false in the HTML snapshot, but the server-side handler requires the declaration, hour and minute. The source schema does not mark the initial day/month/year rules required, although browser-posted empty strings are rejected as non-numeric and any supplied date part activates complete-date validation. The rebuild should choose and document a coherent required-date policy rather than reproducing that old-system distinction.

- Legacy missed branch: when officialOptions is non-empty, the template adds a signed-on-behalf declaration and a conditional Choose the represented official radio group; the latter is mandatory for that branch (ipaffs-frontend-decision/service/src/views/partials/bip/common/review.html:310-363; service/src/routes/handlers/bip/review.js:134-141). The trace did not render this permission/data-dependent branch, so its option values remain a genuine dynamic-data gap.

- Legacy policy point: confirm whether the rebuild retains old-system mandatoriness for signAndSubmit, checks hour/minute and the conditional represented-official selection, and whether checks date should become explicitly mandatory rather than relying on posted empty-string behaviour.

- The custom DEFRA date picker was closed. Its hidden DOM contains Previous month, July 2026, Next month, weekday headings Su/Mo/Tu/We/Th/Fr/Sa and Cancel, but no populated day buttons in this snapshot; dynamic calendar-day behaviour is not evidenced.

- The reference/version, timestamps, inspector/importer names, commodity, laboratory and document values are consignment-specific examples from this trace, not fixed copy.

- Beta banner, GOV.UK/service header, signed-in account links, Dashboard/Decision Hub breadcrumbs, intensified-control status region outside the rebuild's core submit task, footer and support links are page furniture. The Back link was retained as required; the visible "New", "Save and set as in progress" and intensified-control banner were still documented because they sit immediately above the review form.

- Both supplied evidence actions are on the review page, not a re-dispatch deadline page. trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 203 and trace b33079fe57217f74816f788ca3251fc2828669c0 action 220 both resolve to page title "Review assessment - Import and export applications - GOV.UK", H1 "CHEDP.GB.2026.[dynamic] - V1 Review outcome decision", and the Month input id/name=date-of-checks-month.

- The confirmed route is /decision/vnet/protected/bip-notifications/{chedRef}/review, not /decision/.../re-dispatch. The cookie returnUrl contains /protected/bip-notifications/{chedRef}/review and the raw DOM form action is "review". The complete action lists contain no navigation or control whose URL or accessible name identifies a standalone re-dispatch page; the flows go Decisions -> Reason for refusal -> Review.

- The only date/time heading rendered is "Date and time of checks". The controls are named date-of-checks-day, date-of-checks-month, date-of-checks-year, time-of-checks-hour and time-of-checks-minute. There is no rendered label, hint, heading or control name containing "re-dispatch", "redispatch", "deadline", "refusal by" or equivalent.

- Corroboration finding: the CHED-P QA model contains no standalone re-dispatch/refusal-by-date page object or workflow step. Its rejection path selects Re-dispatching on DecisionScopePage, saves, selects a refusal reason on DecisionRefusalPage, then fills the checks date/time on DecisionReviewPage (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1203-1213). DecisionReviewPage constructs only `{chedReference}/review` (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionReviewPage.ts:11-14). Together with the trace, the admissible sources indicate that CHED-P has no separate re-dispatch page: the refusal "By date" controls are embedded on the decision-conclusion page, while this file's captured controls are review submission date/time.

- The Decision information table does render "Refusal decision" = "Re-dispatching" and a "Refusal by date" row, but the value cell is empty in both snapshots. It is therefore not possible to identify the observed date/time inputs as the re-dispatch/refusal-by deadline without inventing semantics contradicted by their heading and names.

- The caption/reference is instance-specific: "CHEDP.GB.2026.1525937 - V1" in trace b33079fe57217f74816f788ca3251fc2828669c0 action 220 and "CHEDP.GB.2026.1526061 - V1" in trace 189085ad930266a48c024dc1d447e1c2055d6fe9 action 203 are dynamic. The static H1 text is "Review outcome decision".

- RESOLVED FROM LEGACY: the refusal deadline is the conditional By date dynamic-date control embedded on the decision-conclusion page, with names not-acceptable-day/month/year (ipaffs-frontend-decision/service/src/utils/consignment_decision_field_config_driver.js:253-280; service/src/views/bip/consignmentDecisions.html:403-454). It is not a standalone page and is not the review-page checks date/time. The three correct controls are now added as legacy missed fields; the six mis-targeted review fields are preserved as gaps rather than deleted.

- Legacy mandatoriness finding: the old decision-conclusion handler and CHED-P model do not require notAcceptableActionByDate. The handler accepts a refused payload without any date fields (service/test/handlers/bip/consignment_decisions_test.js:472-485); if a date part is supplied, it validates day 1-31, month 1-12 and year no earlier than the runtime current year (service/src/routes/handlers/bip/consignment_decisions.js:229-240). Confirm whether an actual re-dispatch deadline must be mandatory in the rebuild.

- Legacy validation gap: no source-defined missing-date message exists because all three refusal-by date parts are optional when absent. Exact numeric/integer/range messages are recorded from authorised tests. The source does not reject impossible combinations such as 31 February at this page layer; decide whether the rebuild should add real-date validation.

- The refusal-by year message embeds the runtime current year. The recorded 2026 copy is verbatim for the enrichment year, but the implementation requirement is dynamic and must roll forward.

- The fields originally in this file remain marked gap for this slug because they belong to /review. Product stakeholders should treat the three legacy not-acceptable-* fields as the actual refusal-by-date controls and obtain a rendered decision-conclusion trace if confirmed evidence is required.

### bip-decision-confirmation

- This is a read-only confirmation page in the DECISION (BIP inspector) app, not the notification-submission confirmation. It has no form controls — the three 'fields' captured are display-only spans (reference number, version, decision outcome) rendered into the panel body, not inputs. The page gathers no information.

- The trace confirms 'Acceptable for Internal Market'. QA suggests the variant-only outcome 'Not Acceptable' (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/tests/notification/ched-p/ched-p-notification.spec.ts:245-250), but it is not included in observedValues because it was not observed in the supplied trace. No admissible evidence establishes whether more granular refusal actions such as Re-dispatching or Destruction appear in this confirmation panel, so any additional outcome strings remain a gap.

- DecisionConfirmationPage also exposes shared-journey links named 'Show CHED' and 'Record decision' (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionConfirmationPage.ts:10-20), but no CHED-P test uses them and neither appears in the supplied CHED-P trace. They are not added as CHED-P requirements; their CHED-type/role conditions remain ambiguous.

- No back link is present (expected — it is a terminal confirmation). The primary CTA is 'View or print CHED' (opens the certificate PDF in a new tab); the secondary link returns to the decision dashboard.

- Journey position -1 and slug 'bip-decision-confirmation' concern the BIP/decision app. Note this is distinct from the notification-submitter's own submission-confirmation page; both may share the 'View or print CHED' affordance but this one is the inspector's post-decision screen.

- Legacy enrichment found no applicable validation messages because this confirmation template has no data-entry form. It did reveal a conditional 'Create border notification' CTA and 'Next steps' refusal copy not exercised by the rendered trace (ipaffs-frontend-decision/service/src/views/bip/confirmation.html:28-44). Rebuild policy should confirm which CHED-P refusal reasons enable it.

### record-decision-search

- This page is the IPAFFS decision-app dashboard/search ('Assess consignments', H1 'Import notifications'), not a page in the CHED-P notification-creation journey. Journey position -1 and the task ('search and open CHED to verify recorded decision status') describe an internal caseworker tool: after recording a decision the user re-searches the CHED (by number in 'Keywords or CHED number') and reads the CHED status tag in the results to confirm the recorded status. The evidence pointer (action 221) was correct — it is the Fill of the CHED number into the keywords box on this page.

- The new simple CHED-P app is being rebuilt for the IMPORTER pre-notification journey; whether this decision-maker search/dashboard is in scope for the rebuild at all is a scope question for a human. If in scope, the results-list, pagination and datepicker are the main bespoke patterns to redesign inside the govuk toolbox.

- The supplied result rows expose the rendered tag mappings directly: Cancelled=grey, Inconclusive=yellow, Valid=green, Modify=orange, Risk pending=grey, Replaced=magenta, Inspect=red, New=blue, and No inspection has no colour modifier. No supplied row renders Rejected, so that status-to-colour mapping remains a gap.

- No validation/error copy was observable in the trace, but legacy resolves the gap: all search fields are optional; text searches have 255-character limits, and partial/invalid dates and times have specific validation copy plus cross-field ordering rules (ipaffs-frontend-decision/service/src/validation/home.js:35-68; service/src/validation/datetime_form_validator.js:34-82,117-147).

- The riskCategory field is labelled 'CHED-P only', confirming CHED-P consignments carry a High/Medium/Low risk category that is searchable here — relevant to the CHED-P data model.

- The CHED-P workflows and tests corroborate reference-number search, Search, opening the result by its reference link, and reading result-row status/risk tags (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionDashboardPage.ts:18-24, :124-160; /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1240-1244). They do not exercise the BCP filter, most advanced search fields, arrival time parts, sort control, pagination, or Clear actions, so those traced controls have no independent behavioural coverage.

- DecisionDashboardPage's `openNotificationDetails` retries Search and the reference link for up to 120 seconds by default (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionDashboardPage.ts:128-155), while notification-visibility polling can run for three minutes (:7 and :47-59). This is test resilience for eventual result availability, not evidence that the user-facing page displays a timeout or retry state.

- Legacy validation also defines lower/upper-year and non-numeric date-component variants in the shared helper (ipaffs-frontend-decision/service/src/validation/date_validation.js:155-190). The principal user-facing dashboard messages are captured here; exhaustive duplicate-message ordering for every malformed combination remains an honest gap because the record-decision trace never rendered errors.

- No missed CHED-P search controls were found: the authorised dashboard search template's complete visible field set (ipaffs-frontend-decision/service/src/views/partials/common/searchAndFilter.html:10-72) matches the rendered field inventory.

### override-risk-decision

- This page is a pure confirmation interstitial ('Are you sure...?') — it has no visible input controls; the decision is a binary Yes-button / No-link. The only form element is a hidden input override-decision=Required.

- RESOLVED FROM LEGACY: the shared validator requires override-decision and accepts only Required or Not required. Exact missing, invalid and empty-value copy is recorded from the validator/tests. Error rendering is relevant to the Inconclusive radio branch even though the traced confirmation branch supplies a hidden value.

- The second evidence pointer (trace 26153fb3e2abd20e0bde40d9c311ebb672ebebea action 155) was an expect('toMatch') assertion, not a page action. The override page in that EU-notification journey was captured at action 151 instead and is byte-for-byte identical to the first trace (same H1 pattern, same H2, same two paragraphs, same Yes button and No link) — only the reference number differs (CHEDP.GB.2026.1525977 vs .1525976). Recorded as evidenceWasWrong.

- RESOLVED FROM LEGACY: the radio branch appears exactly when the current risk decision is Inconclusive and the consignment is not under reinforced checks. It contains two override-decision options: Required / "Override risk decision as inspection required" and Not required / "Override risk decision as no inspection", each with explanatory hint copy (override_risk_decision.js:64-100; overrideRiskDecision.html:26-30). The supplied traces rendered the alternate hidden-value confirmation branch.

- The primary submit navigates to the notification hub (/decision/.../{ref}/hub) on success — i.e. overriding returns the inspector to the hub, it does not advance to a further step. Confirmed from action 157 log (navigated to .../CHEDP.GB.2026.1525976/hub).

- After confirmation, QA waits for the hub's risk-assessment banner and accepts the headings 'Inspection required', 'No inspection required', or 'Inspection not required' (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1232-1233; /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/tests/notification/ched-p/ched-p-notification.spec.ts:170-177). Which pre-override state maps to each post-override heading is not established.

- Section caption and H1 are dynamic (reference number + version). Captured verbatim from trace 1 as 'CHEDP.GB.2026.1525976 - V1'; the static primary title is 'Override risk decision'.

- This is an inspector/decision-side page (Record decision area), not part of the importer's create-notification journey.

- Legacy policy point: confirm whether the rebuild retains both the Inconclusive two-radio selection branch and the direct opposite-state confirmation branch, plus the irreversible-override warning.

- No additional CHED-P field was missing: the inferred variant field has been upgraded in place with its exact shared name, both options, values and condition. One previously missed option (Override risk decision as no inspection) was added to that field.

### ched-overview-replace-certificate

- This is a read-only CHED overview/summary page — it has NO user-editable form fields. The 'fields' entries above comprise two display values and three top-bar action links rendered as GOV.UK secondary buttons; there is no primary Continue button.

- Evidence pointer landed exactly on the right page (action 178 = click on the 'Copy as replacement' / #replace-certificate button on the CHED overview).

- Discrepancy with the page brief: the rendered action is labelled 'Copy as replacement' (element id=replace-certificate), not 'Replace certificate'. The trace confirms Rejected before replacement; QA then asserts the replacement CHED is In progress and the original CHED becomes Replaced (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/tests/notification/ched-p/ched-p-replace-notification.spec.ts:47-54 and :80-87).

- Only Rejected is trace-observed in #Status-Label. QA suggests the lifecycle variants Valid, In progress and Replaced (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/tests/notification/ched-p/ched-p-replace-notification.spec.ts:42-54 and :77-87), but they are not included in observedValues because they were not observed in the supplied trace.

- Replacement is not completed by the overview link alone: QA models a subsequent confirmation surface and clicks #replace-certificate again through ReplaceChedPage (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/ReplaceChedPage.ts:3-8; /Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/workflows/notification/ched-p-workflows.ts:1251-1255). That confirmation page was not captured in this slug, so its heading, warning copy, cancel action, and exact visible confirm label are gaps.

- The overview has a second tab 'Checks' (id=tab_decision, #decision) carrying the inspector's documentary/identity/physical-check results (Not Satisfactory / Satisfactory / Not acceptable etc). Only the 'Notification' tab content was mined here; the Checks tab is a separate surface worth its own page spec.

- All the consignment summary data (About the consignment, Traders, Transport, Transporter, Goods movement services, Contact) is the full read-only CHED-P dataset — the same fields captured on the individual entry pages. The rebuild should render it via govuk Summary list rather than IPAFFS's bespoke presentation-table markup.

- DecisionCHEDOverviewPage exposes possible 'Permanent addresses', 'Transport contacts', Request amendment, and Inspector documents surfaces (/Users/samfarrington/git/defra/ipaffs/ipaffs-qa-automation/page-objects/decision/DecisionCHEDOverviewPage.ts:22-24, :43-45, :52-62), but no CHED-P workflow/test in scope uses them and the trace does not render the first two headings or Request amendment. They are not added as unconditional CHED-P overview requirements; their variant/role conditions remain unknown.

- Legacy source confirms this overview has no editable business fields and therefore no field-validation copy: the page is rendered by GET, its exported POST is empty, and its forms contain only action selection plus hidden crumb/etag (ipaffs-frontend-decision/service/src/routes/handlers/bip/certificate_overview.js:42-185; service/src/views/bip/certificateOverview.html:15-18,82-93). Validation belongs to the downstream action pages.

- Legacy adds seven conditional controls/data-lineage links not exercised by this rendered rejected-CHED snapshot: Enter laboratory test results, Complete follow up action, Enter documentary check, Cancel CHED, Control tab, Replaced by, and Replaced certificate (ipaffs-frontend-decision/service/src/views/bip/certificateOverview.html:36-52,60-74,82-110,127-147).

- Legacy refines Copy as replacement eligibility: it requires copy permission and status VALIDATED or REJECTED, plus editability and update permission for the non-CHED-PP action (ipaffs-frontend-decision/service/src/routes/handlers/bip/certificate_overview.js:68-70,103-105,192-194; template lines 25-35). This legacy permission/status matrix is policy for the rebuild to confirm.

### ov-notifications-dashboard

- No validation messages were observed in the trace, but legacy source establishes 255-character limits for Keywords, Commodity and Consignee, composite date validity errors, and a Start date/End date ordering error. Selects and quick filters still have no established field-specific error copy.

- Legacy mandatoriness makes both Start date and End date optional when wholly blank, but once any date part is supplied all three parts are conditionally required (ipaffs-frontend-control/service/src/validation/date_validation.js:3-39). Confirm whether the rebuild should retain this legacy interaction policy.

- This is the SHARED OV/LVU 'Record control' dashboard covering ALL four CHED types (CHED type filter offers CHED-A/P/D/PP). It is not CHED-P-specific — it is the caseworker's control-search entry point. The new CHED-P app may or may not own this surface; it may belong to a separate control/caseworker app. Confirm scope ownership with a human.

- BCP list (221 options) and Country of origin (250 options) are reference data captured truncated (first 20 verbatim); the BCP list contains many obvious test/dummy entries (e.g. 'ABC Legal - ...', 'Automation9 Testing - TEST123', 'PopCorn Christmas LTD - TOK321'). The new app should source both from the reference-data service, not hardcode.

- The results list, pagination, and calendar datepicker are all custom (non-govuk) components — see nonStandardPatterns. The page title is generic ('Assess consignments') and does not match the H1 ('Consignments requiring control').

- Broadcast Alert/Information notification banners at the top are a system-message feature (dismissable per-message via /messages/{id}/{n}/dismiss), independent of the search — flagged as a separate cross-cutting concern.

- Result-card status (CHED status, Control status) rendered in <strong> in the a11y tree; the govuk-tag--green/orange/red classes are present in the class inventory so these are almost certainly rendered as coloured tags, but the exact class-to-value mapping (e.g. Rejected=red, Valid=green, Control required=orange) was inferred from convention, not read from the HTML per element.

- The active Today test permits displayed Date of decision values from either the selected date or the preceding date (tests/dashboard/dashboard-search.spec.ts:410-440), while the Tomorrow and Yesterday control-dashboard tests are commented out with a note that this dashboard behaves differently (tests/dashboard/dashboard-search.spec.ts:443-509). Confirm the intended timezone/date-boundary rule before reproducing quick-date filtering.

- No QA page-object counterpart was found for the trace-rendered BCP, CHED status, CHED type, Consignee, Control status, Decision, Seal check required, Last 7 days or Sort by controls. Their trace-confirmed definitions are preserved, but their option sets and behaviours remain independently unasserted by automation.

### record-control

- Legacy validation establishes that the top-level outcome is required; departure date is required on the Yes branch; destruction date is required on the destruction branch; other branch controls are optional in the old system. This is legacy policy and should be confirmed for the rebuild, particularly the surprising optional controlled-destination radio, Exit BCP and destination country.

- Rendered CHED-P copy for identification/documentation conflicts with the CHED-P-gated legacy template: the trace confirms 'Identification' / 'Documentation' with short hints, while ipaffs-frontend-control/service/src/views/ov/consignmentLeave.html:54-94 specifies 'Transport identification' / 'Transport document reference' and expanded hints. Confirm which copy the rebuild should use; rendered values remain authoritative in the primary label/hint fields.

- The top question offers three mutually exclusive outcomes (consignment left / did not leave / has been destroyed). 'Did the consignment reach the controlled destination?' is a nested sub-question revealed only under 'No'. Confirm the new app models this as one radio with conditional reveals vs. separate pages.

- Exit BCP list (199 options) is heavily polluted with synthetic 'ABC Legal - <code>' test entries in this environment; the real production list is the named GB BCPs only. New app should source from the BCP reference-data service.

- The declaration block (Name, Registered location, Date control added) is read-only pre-filled data about the signed-in inspector/officer, not user input — the new app needs the source of the officer's registered location.

- This is the control-app (LVU/inspector) surface, journey position -1 (after the notification is submitted). Confirm it is in scope for the CHED-P rebuild vs. handled by a separate control service.

- QA independently covers only consignment-leave = No, consignment-arrival = Yes and Submit control (page-objects/control/RecordControlPage.ts:6-15; workflows/notification/ched-p-workflows.ts:1271-1274). It has no locators or CHED-P assertions for the Yes/departure branch, destruction branch, arrival = No reason, transport type, identification, documentation, departure date, Exit BCP, destination country or destruction date; all of those definitions remain trace-confirmed but independently unasserted.

### border-notification-create

- RESOLVED FROM LEGACY: in the rejected-CHED-P entry path, Notification type, Notification basis, Product category, Risk decision, Impact on and Hazard category are required; those same fields are optional in direct-dashboard creation (ipaffs-frontend-bordernotification/service/src/routes/handlers/border-notifications/create_border_notification.js:155-200). All other ordinary text/select fields are optional, while a chosen durability-date branch makes its corresponding date required (lines 214-245). This conditional legacy policy should be confirmed for the rebuild.

- This is the border-notification INSPECTOR app (/bordernotification/vnet/...), a separate hapi app from the main CHED-P importer journey. It is reached only when an inspector creates a border notification for a REJECTED CHED-P. Confirm the new CDP app is expected to cover this inspector flow, or whether it is out of scope for the importer-facing rebuild.

- 'Other labelling' and 'Other information' are <textarea> elements styled with the single-line govuk-input class — confirm whether these are intended to be multi-line free text (Textarea) or single-line (Text input), and whether any character limit applies.

- Only the Use by date and Best before date inputs carry custom date-picker-* class hooks; the trace contains no calendar button, dialog or other picker UI, and Best before end uses only GOV.UK classes. Determine whether those hooks have active behaviour or are vestigial; a calendar-picker requirement is not established.

- The read-only CHED-derived summary block (CHED number, Commodity, Approved establishment number, Net weight, Laboratory tests, Country) is pre-populated data carried in from earlier inspector steps (commodity choice, establishment selection, laboratory-test selection, country). Its provenance/data model sits upstream of this page and should be traced from those preceding inspector screens.

- Product category, Hazard category and Measure taken are long reference-data lists captured verbatim here; the new app should source them from a reference-data service rather than hardcode them.

- The QA workflow proves two entry variants: raising from a rejected CHED-P, where CHED-derived values are already present (workflows/notification/border-notification-workflows.ts:4-20), and creating directly from the dashboard, where Commodity, Approved establishment, Laboratory test, Net weight and Country are editable/selected (workflows/notification/border-notification-workflows.ts:23-46). Confirm whether one rebuilt page must support both modes or the modes should be separated.

- The QA page object exposes Save and Submit alongside Save and continue (page-objects/border-notification/CreateBorderNotificationPage.ts:128-138), but the workflow clicks Save and Submit only after Save and continue has navigated to the review page (workflows/notification/border-notification-workflows.ts:16-18,72-74). They are therefore downstream review actions, not additional controls on this create-page trace.

- Legacy source adds a from-review variant missed by the rendered trace: the primary button becomes 'Save and return', successful submission redirects back to review, and the cancel link also targets review (ipaffs-frontend-bordernotification/service/src/views/border-notifications/create_border_notification.html:435-448; handler lines 102-105).

- Direct-dashboard net weight has an HTML min=0 and step=0.01 constraint, but the server schema only accepts any string including empty and defines no custom message (ipaffs-frontend-bordernotification/service/src/views/border-notifications/create_border_notification.html:141-146; handler line 152). Browser-native invalid-number copy therefore remains an honest gap and should not be treated as authorised legacy service copy.

### border-notification-review

- This page belongs to the BORDER NOTIFICATION app (/bordernotification/... a BCP inspector rejecting/recording a decision on a consignment), NOT the CHED-P importer pre-notification. Journey position -1. It is downstream of the CHED-P notification and reviews the border decision before Submit. Confirm whether it is in scope for the CHED-P rebuild or is a separate service surface.

- Evidence pointer was action 250 (a 'Save' click) but action 250's own page is the 'Accompanying documents' form; the review page is captured by action 251's before/input snapshot (URL .../BN.2026.1001967/review), which clicks 'Submit' and navigates to /confirmation. Used 251 accordingly.

- The trace CLI returned 'No snapshot found' for the explicit --name before/after phases; the default (input) snapshot was the correct review page, so that was used.

- No editable form controls exist on this page — it is a read-only review/summary. All 'fields' captured are display-only summary-list rows and the documents table, plus status/submit actions and Change links. Legacy confirms the Draft review POST has no field validation and simply changes status to New (ipaffs-frontend-bordernotification/service/src/routes/handlers/border-notifications/review_border_notification.js:53-63).

- The 'Additional documents' table had a header row but no data rows in this trace (no accompanying documents were attached). The row structure, per-row 'Change'/remove actions, and any attachment upload UI are a gap — never exercised here.

- Status tag 'Draft' and reference 'BN.2026.1001967' render in the service header strip above <main> (not platform chrome, but not inside main either). Captured in bodyCopy. The tag classes were not in the main[class] inventory, so the specific govuk-tag colour/modifier is a gap.

- The 'Back' link points to href='#' (JS-driven history back), not a server route.

- Delete confirmation flow (what 'Delete Border notification' leads to) not exercised in this trace — gap.

- Legacy resolves more of the role/status/action matrix: Draft has Delete and Submit; New has Set in progress; In Progress has both Reject and Validate; Valid can offer Create intensified official control when the user has reinforced-check permission and the certificate is not CED (ipaffs-frontend-bordernotification/service/src/views/border-notifications/review_border_notification.html:11-53,293-305). Change links remain available only while status is Draft, New or In Progress and the user can create/modify (handler lines 65-80; template lines 57-67,226-234). Rebuild policy should confirm whether this legacy matrix remains.

- QA asserts only the BN reference, status values and New -> In Progress -> Valid actions on the post-submission view; it does not independently inspect any of the 18 border-notification summary rows, the accompanying-documents table, Last updated values, Change links or Delete action.

- Legacy adds two controls absent from the supplied trace and field inventory: 'Reject' for In Progress and 'Create intensified official control' for eligible Valid notifications (ipaffs-frontend-bordernotification/service/src/views/border-notifications/review_border_notification.html:16-45).

### border-notification-confirmation

- This is the confirmation page of the separate Border Notification (VNET) app (/bordernotification/vnet/protected/*), which submits to the FSA — distinct from the main IPAFFS CHED-P pre-notification submission confirmation. The trace title is 'B2C Inspector: Creates border notification for rejected CHEDP Notification', so this page is reached after a CHEDP notification is rejected and a border notification is raised. Confirm whether this border-notification flow is in scope for the rebuilt CHED-P app or belongs to a separate FSA/inspector surface.

- The reference number (BN.2026.1001967) is display-only, generated server-side; format appears to be BN.<year>.<sequence>. No field inputs on this page — it is a pure confirmation/terminal page.

- Page has no back link and no section caption (confirmation panel replaces the H1/caption pattern), consistent with the standard GOV.UK confirmation-page pattern.

- QA independently asserts the generated reference format and Return-to-dashboard navigation, but does not assert the confirmation heading or the FSA next-steps copy (tests/notification/ched-p/ched-p-border-notification.spec.ts:39-48,63-69). Those texts remain trace-confirmed only.

- Legacy source confirms there are no missed controls or applicable validation messages: this is a GET-only terminal page containing one generated reference display and one dashboard link (ipaffs-frontend-bordernotification/service/src/views/border-notifications/confirmation.html:4-22; service/src/routes/routes.js:137-141).

### border-notifications-dashboard

- This page belongs to the BCP/inspector-facing 'border notification' app (Percy Inspector-Tester; test title 'B2C Inspector: Creates border notification for rejected CHEDP Notification'), NOT the importer's CHED-P pre-notification submission journey. Journey position is -1. Confirm with a human whether this inspector dashboard is in scope for the CHED-P rebuild at all — it may be a separate service surface.

- The results list is keyed to a fixed set of columns (Reference Number, CHED Number, Country, Status, Hazard Category, Commodity, Approval Number). CHED Number shows 'N/A' when a notification has no CHED; confirm which of these columns the rebuilt dashboard must retain.

- Legacy resolves the validation gap: every search filter is optional, the six date components enforce numeric ranges, real-calendar dates are required when supplied, and Start date cannot follow End date (ipaffs-frontend-bordernotification/service/src/routes/handlers/border-notifications/home.js:54-103). The non-date text/select filters have no legacy frontend validation messages.

- Country and Hazard category option lists are reference data; the full Country list (251 including 'All') was truncated to the first 20. The new app should source both from a reference-data service rather than hardcoding.

- The 'Create new border notification' action, 'View details' per-row link and pagination ('99' pages) are inspector workflows outside the importer CHED-P journey; flag whether any are required in the rebuild.

- QA independently covers only Border notification number search, Create new border notification, first-result reference and View details (page-objects/border-notification/BorderNotificationDashboardPage.ts:12-43). It has no page-object counterparts for CHED number, Approved establishment number, Commodity code, Status, Country, Hazard category, quick-date buttons, manual date range, Clear or pagination; those trace-confirmed controls and option sets remain independently unasserted.

- The exact-reference search is asserted to return the created reference as the first result before View details (tests/notification/ched-p/ched-p-border-notification.spec.ts:50-57), but QA does not assert zero-result behaviour, partial matching, multiple results, sorting or pagination semantics.

- No missed CHED-P dashboard fields were found: the authorised search partial's complete visible control set (ipaffs-frontend-bordernotification/service/src/views/partials/dashboard/search.html:1-121) matches the trace-derived field inventory.

### amend-notification-hub

- This page is the amend Notification Hub — a GOV.UK Task list of the CHED-P sections, not a form. It has zero form controls (verified: main input/select/textarea count = 0). The 'fields' array is therefore empty; the requirement content is the section list, its grouping, the status semantics (blue 'Started' vs grey 'To do'), and the ?source=hub navigation contract, all captured in structure/govukComponents.

- The 'amend section pages' half of this page's remit (Origin, Purpose, Risk category, Transport, Review re-entered from the hub) are separate section pages reached from the hub — they are their own page specs and are not detailed here. This spec covers only the hub itself (action 153's available input snapshot is the hub and the action clicks the 'Origin of the import' link; that action has no before snapshot).

- Task-list statuses observed on THIS notification instance: 14 sections 'Started', 2 'To do' (Nominated contacts (optional); Review and submit). Statuses are per-notification runtime state (Started / To do / possibly Completed / Cannot start yet), not fixed page copy — the full set of possible status values was not exercised in this trace and is a gap.

- LEGACY RESOLUTION: the hub's complete status vocabulary is exactly Started, To do, and Expired (ipaffs-frontend-notification/service/src/utils/constants.js:107-110). The handler derives Started/To do from whether section fields contain values and can return Expired for commodity or approved-establishment data (service/src/routes/handlers/importer/overview.js:170-175,196-259); the tag helper maps these to blue, grey and red (service/src/utils/handlebars.js:778-786). Completed and Cannot start yet are not statuses on this legacy hub.

- Task-list links carry aria-describedby (e.g. id='origin-of-the-import' aria-describedby='origin-of-import') wiring the status/hint to the link for screen readers, consistent with the govuk Task list macro. No visible hint text was rendered under the section names in this trace.

- No primary 'Continue'/submit button on the hub itself — completion is via the 'Review and submit' task-list link. Back link text is 'Back'.

- LOW-RISK VARIANT GAP: the QA workflow proves that Low risk skips both the 'Health certificate required' interstitial and later health-certificate data entry (workflows/notification/ched-p-workflows.ts:318-326,339-354), but it does not assert how the hub renders the 'Latest health certificate' task-list item for Low risk (hidden, disabled, omitted, or a different status). A human or rendered low-risk trace must confirm this.

- LEGACY RESOLUTION: the Latest health certificate task-list item is omitted entirely when the CHED-P risk level is Low; it is not rendered disabled or with a different status (ipaffs-frontend-notification/service/src/views/importer/overview.html:235-255; risk-level context at service/src/routes/handlers/importer/overview.js:93,106-107). This is legacy journey policy for the rebuild to confirm.

- Legacy conditionals add two CHED-P task links that were absent from the confirmed instance: Catch certificates when non-SPS IUU commodities are present, with destination selected from current certificate state (ipaffs-frontend-notification/service/src/views/importer/overview.html:212-234), and Billing details when common-user-charge logic says the notification is billable (overview.html:497-514; handler overview.js:135-142).

- AMEND DEPENDENCY GAP: the CHED-P manipulation test states that purpose is cleared after amending country of origin and then reselects purpose and risk category (tests/notification/ched-p/ched-p-manipulation.spec.ts:43-53), but there is no explicit expect asserting the cleared state. Treat the dependency as inferred pending a focused assertion or rendered amend trace.

### delete-notification-confirmation

- The evidence pointer (action 153) was the 'Delete notification' LINK on the notification review/details page that navigates to the /delete route, not the confirmation page itself. The confirmation page is captured in the 'before' snapshot of action 154 (the 'Delete notification' warning button click). Spec built from action 154.

- The govuk-caption-xl (notification reference) renders AFTER the H1 in DOM order rather than the conventional above-the-heading placement; recorded as observed. Rebuild should decide whether to keep the reference as a caption above the H1 or below.

- The page is 100% govuk-frontend — no non-standard markup. Directly rebuildable inside the govuk-frontend toolbox.

- No error/validation states were exercised for this page in this trace (0 errors) or the CHED-P QA test. The authorised legacy handler confirms there is no field-level validator on POST; instead, GET refuses a notification whose status/type is not deletable by routing to the shared 404 handler before this page renders (ipaffs-frontend-notification/service/src/routes/handlers/importer/delete.js:12-18). Any rebuild-specific conflict or stale-etag copy remains a gap.

- The two account-bar/dashboard links (review page target of the secondary link uses ?source=dashboard) imply the delete flow is entered from the dashboard; the same page may also be reachable from other contexts (gap — not exercised here).

- QA covers only the destructive branch: it enters through the review-page Delete notification link, clicks the confirmation button, then verifies the reference is absent from dashboard results (tests/notification/ched-p/ched-p-manipulation.spec.ts:16-27). It does not exercise the 'Do not delete notification' link, the Back link, double-click prevention, delayed deletion, or a server-side rejection.

- The trace says deletion can take up to 1 minute, but the QA test performs an immediate dashboard search and expects the result not to be visible (tests/notification/ched-p/ched-p-manipulation.spec.ts:24-27). This is not necessarily contradictory, but the test does not poll for the documented asynchronous delay; confirm expected consistency semantics.

### clone-certificate-type

- This is the cloning ENTRY page. Selecting 'Products of animal origin, germinal products or animal by-products' (value CVEDP) and pressing Continue leads to a certificate-search page (Country of origin, Certificate reference, Date of issue, Consignor/consignee/importer name, Search) then a 'Clone' button. In this corpus the later summary GET returned HTTP 406 at trace action 22 and rendered a fallback page titled 'Unable to clone' with H2 'You cannot clone this certificate', followed by 'This certificate is missing some of the details needed to create a new notification', 'What you can do instead', a PDF download link, and 'Create a new notification with attachment'. The expected cloned-notification happy path timed out. Treat this flow as KNOWN BROKEN and OUT OF SCOPE rather than assuming the intended happy path works.

- The three radio VALUES map to CHED types: CVEDA = CHED-A (live animals), CVEDP = CHED-P (products of animal origin — THIS journey), CHEDPP = CHED-PP (plants). No CHED-D option is offered on this cloning entry page.

- No validation error copy was observed in the rendered trace; the radios also have no HTML required attribute and QA always selects Products of animal origin before Continue (workflows/notification/ched-p-workflows.ts:1305-1306). The authorised legacy server validator nevertheless makes cert-type mandatory and returns 'Select the type of import' when omitted (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/cloning/cert_type_validation.js:15-18). This rendered-markup-versus-server-mandatoriness discrepancy should be resolved accessibly in the rebuild.

- Page has NO section caption (govuk-caption) — the H1 stands alone.

- This page is a CLONING-flow entry, flagged OUT-OF-SCOPE candidate for the CHED-P rebuild. It is 100% govuk-frontend (no non-standard markup).

- QA describes the intended success path and asserts that cloning ultimately creates a new CHED-P reference (tests/notification/ched-p/ched-p-cloning.spec.ts:18-21), skipping only the snd environment because no certificate is available there (tests/notification/ched-p/ched-p-cloning.spec.ts:11-14). That intended test contract conflicts with the trace's HTTP 406 response and rendered 'You cannot clone this certificate' fallback. Rendered reality wins for current-state requirements; confirm whether cloning should be repaired in a later scope or the QA test quarantined.

- The cloning-type page object exposes Products of animal origin and Plants controls but no Live animals locator (page-objects/notification/cloning/CloningTypePage.ts:6-15). The trace-confirmed Live animals option is preserved, but only the CHED-P option is exercised by the CHED-P workflow.

- The QA workflow's clone payload is fixed by default to New Zealand, certificate NZL2026/AGL18/3 dated 20/04/2026, and party ALLIANCE GROUP (NZ) LTD (workflows/notification/ched-p-workflows.ts:1287-1295). These are test data for the downstream search, not options or defaults on this type-selection page.

### clone-search

- The supplied action 18 is on the intended page. The trace confirms GET /notification/vnet/protected/notifications/cloning/search?certType=CVEDP and POST /notification/vnet/protected/notifications/cloning/search; action 21 redirects to /notification/vnet/protected/notifications/cloning/summary with the entered search values in the query string.

- The clone action itself was never reached. After Search, the summary request returns HTTP 406 'Unable to clone' and renders the page title 'Unable to clone - Import and export applications - GOV.UK' with 'You cannot clone this certificate'. Action 22 then waits 30 seconds for getByRole('button', { name: 'Clone' }) and times out because no Clone button rendered. Treat this as a KNOWN BROKEN, OUT-OF-SCOPE candidate.

- No result list, result table, matching-certificate details or empty-results state rendered in this trace. The only post-search state captured is the Unable to clone outcome with 'Download the certificate (PDF)' and 'Create a new notification with attachment'. A working result/Clone state remains a gap.

- The Unable to clone outcome has no H1 in main: 'You cannot clone this certificate' is an H2 (govuk-heading-l), despite being the page's primary visible heading.

- The search form has no section caption. Its H1 'Certificate details' contains no instance-specific data and appears to be entirely static template copy.

- Only two country options render for the CHED-P certificate type in this trace: 'Select a country' and 'New Zealand'. Whether other countries become available under different certificate types, environments or reference-data states is a gap.

- No validation/error-summary state was exercised in the trace, and all visible fields have required=false in the DOM. The authorised legacy V2 server validator nevertheless requires all four visible fields (ipaffs-frontend-notification/service/src/validation/routes/handlers/importer/cloning/search_validation.js:32-67). Preserve this rendered-DOM versus server-validation discrepancy: the rebuild should decide whether to add native required semantics while retaining server validation.

- Legacy requiredness on cloning search reflects the old system's policy: country, reference, issue date and party name are all mandatory when enableCloningUpdates selects validateV2 (ipaffs-frontend-notification/service/src/routes/handlers/importer/cloning/search.js:24-43). Confirm that the out-of-scope rebuild, if later adopted, should retain all four mandatory search criteria.

- The custom date-picker dialog exists in the DOM but was not opened. Its hidden structure and labels were captured verbatim; no calendar date was selected through it.

- This cloning feature is a KNOWN OUT-OF-SCOPE CANDIDATE for the CHED-P rewrite. The corpus provides evidence for the search form and the HTTP 406 Unable to clone fallback only; it does not provide evidence of a working clone journey.

- QA encodes an intended working path: it searches with the same four values, expects a Clone button on the summary page (workflows/notification/ched-p-workflows.ts:1308-1317), completes a notification, and asserts a new CHED-P reference (tests/notification/ched-p/ched-p-cloning.spec.ts:18-21). This conflicts with the rendered HTTP 406 outcome; rendered reality wins for current-state requirements. The test skips only snd because no clonable certificate exists there (tests/notification/ched-p/ched-p-cloning.spec.ts:11-14), so confirm whether tst data/service availability has regressed.

- The QA page object exposes both Search and Continue controls for the certificate-details form (page-objects/notification/cloning/CloningCertificateDetailsPage.ts:30-35). The active CHED-P workflow uses Search, matching the trace; the alternate helper uses Continue but has no CHED-P test call. Confirm whether Continue belongs to another certificate type/older implementation or is stale.

- A working summary page is modelled with Clone, Data and documents, and Confirm and continue controls (page-objects/notification/cloning/CloningSummaryPage.ts:6-15), but the active CHED-P workflow uses only Clone and the trace reaches none of them because of HTTP 406. The conditions and copy for the Data and documents branch remain gaps and should not be pulled into first-pass CHED-P scope.

### are-you-a-plants-importer-or-agency

- The selected finding does not record the URL, browser title, back link, No-path outcome or validation state.

- Product copy must be adapted for CHED-P/POAO. Only the rendered shared branch, Yes/No choices and continuation are carried across.

### choose-your-organisation

- The finding does not record the URL, browser title, back link or validation state.

- This fixture demonstrates login-time organisation context only. Represented-client permission is separately evidenced by the delegated owner/company pages and Manage your authorisations.

### manage-your-authorisations

- The selected finding does not record the URL, browser title, back link, update/save interaction, request flow or removal flow.

- The agent code and organisation names are fixture data. CHED-P uses a POAO agency and authorised POAO businesses.

- The rendered toggle's markup and persistence behaviour were not exercised.

### which-company-is-this-notification-for

- The selected findings do not record the URL, browser title, back link, continuation control, empty-company state or validation state.

- The rendered Plant Organisation name and address are fixture evidence. CHED-P must substitute the selected authorised POAO organisation without carrying Plant-specific copy.

### who-are-you-creating-this-notification-for

- The selected findings do not record the URL, browser title, back link, continuation control or validation state; those values are intentionally null rather than inferred.

- The fixture label 'IPAFFS Plant Agency C' is evidence, not CHED-P product copy. The corresponding CHED-P option is the signed-in agent's POAO organisation.

