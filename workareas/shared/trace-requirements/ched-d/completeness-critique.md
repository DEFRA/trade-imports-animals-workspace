# CHED-D trace-mined requirements — completeness critique (ENRICHED spec)

_Adversarial review of the **legacy-enriched** spec (target-model regenerated 2026-07-20/21, backlog
2026-07-21, `journey-spec.json` now carrying legacy validation copy + mandatoriness). Purpose: find
what is STILL missing after enrichment and state honestly what even the enriched method cannot know.
All numbers counted directly from `journey-spec.json`, `conflicts.json`, `backlog.md`,
`target-model.md` and the ipaffs-qa-automation sources — not re-derived from prose._

_Supersedes the 2026-07-18 pre-enrichment critique (git history holds it) — the "8-confirmed" and
"18% validation" figures below are that pass's baseline._

## Headline numbers (counted, enriched vs the pre-enrichment baseline)

| Tag dimension | confirmed | legacy | inferred | gap | total | with-evidence¹ |
|---|---|---|---|---|---|---|
| **Validation messages — all 41 pages** | 9 | 303 | 1 | 12 | 325 | 96.0% |
| **Validation messages — in-scope create pages (order 0–28)** | 8 | 222 | 1 | 10 | 241 | **95.4%** |
| **Fields** (`.fields[].confidence`) | 238 | 29 | 15 | 1 | 283 | 94.3% |
| **Pages** (`.pages[].confidence`) | 41 | 0 | 0 | 0 | 41 | 100% |
| **Combined (all tags)** | 288 | 332 | 16 | 13 | 649 | 95.5% |

¹ with-evidence = confirmed + legacy (both are real, trustworthy sources; inferred/gap are not).

**The one number that matters.** Validation coverage on in-scope create pages moved from **8
trace-confirmed messages (18% of the then-50)** to **230 of 241 messages backed by a real source
(95.4%)** — legacy enrichment added **~275 verbatim validation messages** lifted from Joi
validators / `ValidationMessages` / the Java `@NotNull` groups. This is the whole point of the
enrichment and it worked: the spec is no longer a structure-only spec, it now carries the actual
error copy and per-field requiredness for essentially every data-collecting page.

**But read the tag, not just the total.** 303 of 312 with-evidence validation messages are `legacy`,
not `confirmed` — read from IPAFFS source, never seen rendered in a CHED-D trace. For VALUES and COPY
that is trustworthy. For MANDATORINESS it is "as the old system had it" — and the old system is
**internally inconsistent** about requiredness (JB-2/c-038: the frontend Joi form is materially
stricter than the backend CED `@NotNull` group), so even the legacy mandatoriness is a **policy
question the rebuild must settle**, not a settled fact. Confirmed-only validation is unchanged at 9
(the corpus still only ever fired the arrival-date window + file-upload rules).

---

## 1. Page inventory — complete against the a11y walk + workflow

The DoA-fold-in did not add or remove a notifier page; it enriched the existing 41. Cross-checked:

- **A11y walk** (`ched-d-accessibility-tests.spec.ts`) walks 29 create pages — dashboard → import-type
  → country-of-origin → origin-of-import → search-commodity → commodity-basic-description →
  about-the-consignment → hub → commodity-extended → commodity-additional → accompanying-documents →
  document-upload → traders-addresses → consignor search/create/confirm → consignee
  search/create/confirm → transport-details → goods-movement-services → contact-details →
  nominated-contacts → contact-address → branch-address create/confirm → review → declaration →
  confirmation. **Every one is present in the spec (orders 0–28). No a11y page is missing.**
- **41 page specs** = 29 create + CUC billing + inspector/decision/lab (12 pages at `order=-1`).
  The inspector/lab surface is out of scope by design (separate BIP decision service).

**Branches the workflow never drove (unchanged from the pre-enrichment pass — enrichment did NOT
close these; legacy copy is a lower bound):**

- **Multi-commodity "add another"** — `ched-d-workflows.ts:211` always checks `radioNo` on
  commodity-basic-description. The depth-2 repeating group (`commodityComplement[] → species[]`) and
  the per-line-vs-per-consignment placement of `intendedFor`/`temperature` (Open Q 7) remain
  single-line-only. `inc-012`/`inc-016` carry this correctly as a model-extension gate.
- **Containers / trailers grid** — `usingContainersOrTrailers=Yes` never driven; the container/seal
  repeating controls are `confirmed` from one collapsed DOM only. Max-count + per-row required rules
  unknown.
- **CTC "Yes"** (`useCommonTransit`), **GVMS "Yes"** (`useTransportService`) — traces took "No"; the
  MRN field and its validation were never exercised.
- **Non-internal-market / transit variant** — the only variant traced (feature-flag-ON). The flag-OFF
  **tranship** variant (Exit-BCP select, no free-text point-of-exit) is legacy-only (inc-032 ⛔).
- **CUC billing** — 2 traces; the trigger is invisible (see §5).
- **Amend + delete** — the notifier-side amend re-submit reuses review + declaration, but the
  *"request amendment"* trigger (`linkRequestAmendment` / `inputEnterAmendmentReason`) is a
  **decision-app action** (`decisionChedOverview` / `decisionDashboard` page objects, `:528-540`) that
  has **no notifier page spec** — out of scope by design. **Delete-notification has no page spec at
  all.** `inc-036` bundles delete + amend + copy-as-new; only copy-as-new has trace evidence.

**Verdict:** the notifier page inventory is complete against both the a11y walk and the notifier
surface of the workflow. Nothing is silently missing; every unobserved branch is either a born-blocked
increment or an explicit scope exclusion.

---

## 2. Validation coverage — the enrichment's big win, quantified

**Pages that STILL lack any validation evidence** (0 messages), after enrichment:

| Page | order | Why it is legitimately empty |
|---|---|---|
| notification-hub | 7 | navigation + derived completeness — collects no data |
| consignor-confirmation | 15 | confirm-only, no input |
| consignee-confirmation | 18 | confirm-only, no input |
| branch-address-confirmation | 25 | confirm-only, no input |
| confirmation | 28 | terminal read-back, no input |
| cuc-confirm-billing-details | −1 | hidden-field carry page (values echoed from earlier) |
| lab-tests-commodity-select / lab-tests-review | −1 | inspector app — out of scope |

**Every data-collecting create page now has at least one legacy validation message.** The pre-enrichment
critique's "22 pages with an empty validationMessages array" and "consignor-creation: 16 inferred, 0
confirmed" complaints are resolved — consignor-creation, consignee-creation and branch-address-creation
each now carry **16 `legacy`** messages (the real Joi address-form copy), not inferred guesses.

**Residual validation gaps (13 `gap`-tagged rules) — rules with NO message key even in legacy**, because
they are computed/cross-field, not messaged: region-code conditional requirement (origin-of-import),
commodity-code validity (search-commodity), the per-line weight/packages/package-type combination
(commodity-extended-description), the document-type/reference/date set (accompanying-documents),
nominated-contacts at-least-one, contact-address, the traders-addresses composite, the declaration
gate, cuc-find-an-address postcode lookup, and lab-tests-sample-details. These are the true residual —
§5 explains why legacy cannot reach them.

---

## 3. Confidence honesty across all fields

- **Fields (283): 84% confirmed, 94.3% with-evidence.** Directly-observed DOM controls with
  trace+action citations; 29 `legacy` (values/copy from source), 15 `inferred`, **1 `gap`**. Not
  overstated.
- **Validation (325): 2.8% confirmed, 96% with-evidence, 93% of it `legacy`.** Honest *provided the
  reader weights `legacy` correctly* — it is real copy, but for mandatoriness it is "as the old system
  had it", and the old system contradicts itself (JB-2). The model says this explicitly (§Persistence,
  Open Q 2).
- **Pages: all 41 `confirmed`.** This is the same flattery the pre-enrichment critique flagged and it
  **persists**: a page-level `confirmed` means "we saw it render and captured its fields", NOT "we know
  its rules". A skim-reader still over-trusts. The honest reading is unchanged: **page/field confidence
  measure structure; the validation table measures rules — and 93% of that is legacy, not rendered.**
- **Conflicts: 39 total, 26 `needsHuman` (13 now resolved).** Up from the pre-enrichment 31 (all
  unresolved) — enrichment both surfaced more conflicts AND closed 13. Honest and improved.

---

## 4. Backlog fidelity — clean, one carried nit

- **Every create page (orders 0–28) + the CUC pages → an increment** (`inc-008`..`inc-030`, `inc-033`).
  No create page is orphaned.
- **Every model leaf in `target-model.md`'s fieldMap → a page.** The only page-less model fields are the
  declared server-set ones (`id`/`referenceNumber`/`status`/`created`/`updated`/`customsDeclarationReference`
  /`customsDocumentCode`) and the query-only `ownership.*` tenancy layer — both called out as such.
- **Inspector/decision/lab (12 `order=-1` pages minus CUC) → `scopeExclusions`.** Excluded, not dropped.
- **4 born-blocked increments** (inc-031 DoA, inc-032 tranship, inc-033 CUC, inc-034 file bytes) each
  state their human question. Honest.
- **Nit (carried):** `inc-036` merges delete + amend + copy-as-new; only copy-as-new has trace
  evidence, the amend trigger is a decision-app surface and delete has no spec page. That increment
  carries unquantified risk.

---

## 5. Method critique — what is STILL structurally invisible with legacy authorised

Legacy source closed the copy/mandatoriness gap. It did **not** — and cannot — close the class of
requirement that lives in **backend business logic, not in a template or a message key**. These have no
rendered surface AND no validation string, so neither trace-mining nor legacy-copy-mining can see them.
They are the residual human/policy questions:

1. **HRFNAO scope / allow-list (the CHED-D analogue of Article 72 eligibility).** *Which* commodity
   codes and *which* origin countries are valid HRFNAO inputs is a ref-data filter + rule
   (`?certificateType=CED`, `!country.eu`), computed server-side. The fixtures only used broken rice
   (`10064000`) from Afghanistan — no allow-list boundary was ever exercised or messaged.
2. **Risk categorisation / risk engine routing.** Confirmation shows "Risk assessment — Required at
   Manchester Airport"; *what* routes a consignment to a required physical check, and to which BCP, is
   backend risk logic (stubbed in integrations.md). No UI, no message.
3. **HMI / auto-completion of checks.** Which checks auto-complete vs require an officer is decision-app
   logic — invisible to the notifier journey entirely.
4. **CUC eligibility trigger.** `isCuc` is a test flag derived upstream; there is no control on any
   create page and no validation message that fires it. Both CUC traces were non-billable — the rule is
   unobservable (inc-033 ⛔, Open Q 11).
5. **Split generation.** Whether/when a notification splits (per-BCP, per-commodity) is server logic
   with no notifier-side surface.
6. **Control-point ↔ BCP filtering.** The BCP list is filtered `?includeControlPoints=true&types=CED`;
   the filtering *rule* (which control points attach to which BCP for CED) is a ref-data query, not a
   rendered choice (c-012/c-013 rule the leaked control-point select out of CHED-D).
7. **Which mandatoriness layer is canonical (JB-2/c-038).** Legacy hands us BOTH the strict frontend
   Joi requiredness AND the looser backend CED `@NotNull` group — and they disagree. Legacy cannot tell
   you which the *rebuild* should adopt; that is a policy decision (Open Q 2), the single biggest
   blocker to a faithful requiredness spec.
8. **Data-dependent conditionality.** Does a different commodity code make a health certificate
   mandatory? Does a different origin change the region-code requirement or the valid-country list? The
   fixed fixture (broken rice / Afghanistan) never varied, so none of the data-driven branching is
   exercised — and none of it surfaces as copy.
9. **DoA scope for CHED-D (inc-031 ⛔, G-1..G-6).** The CHED-D corpus has ZERO auth/DoA traces; the
   ownership layer is adapted from the CHED-PP corpus and tagged `inferred`/`confirmed (CHED-PP DoA)`,
   never `confirmed (CHED-D)`. Whether delegated creation, org auto-population and the badge are a
   permanent CHED-D boundary or an incomplete rollout is a policy question no source in remit answers.
10. **Integration wire-shapes.** The frontend is 100% server-side rendered (CSP `connect-src 'self'`) —
    no integration call is visible in any trace. Every request/response contract is `inferred` from the
    legacy `integration/*.js` source; the one real contract (TRACES SOAP) is a QA XML fixture, not a
    trace. The integration map is an architecture sketch, not trace-evidenced fact.
11. **Why-a-field-exists / legal basis, retention, NFRs, concurrency semantics (dropped ETag).** Outside
    the evidence class entirely, legacy included.

**Bottom line.** Enrichment did exactly what it should: it took validation from 8 trace-confirmed
messages to 230/241 source-backed on in-scope create pages, and closed 13 conflicts. The field
inventory (94% with-evidence) and the backlog/model (no orphans) are trustworthy. What remains is
**not** a mining defect and **not** fixable with more legacy — it is the class of business rule that has
no UI and no message key: HRFNAO/allow-list scope, risk categorisation, HMI auto-completion, the CUC
trigger, split generation, control-point↔BCP filtering, the canonical-mandatoriness policy choice, and
DoA scope. Those 26 `needsHuman` conflicts + 12 Open Questions + 4 born-blocks are the honest residue.
Anyone treating this as build-ready must get a human/policy source for them first.
