# CHED-PP completeness critique — over the ENRICHED spec

Supersedes the earlier trace-only critique. Scope: everything is built. This is an honest audit of
what is STILL missing after the DoA traces and the legacy IPAFFS source were folded in — and what
even the enriched method cannot know.

Sources audited: `journey-spec.json` (39 page rows + confidence counts + modelGaps + conflicts),
`backlog.json` (inc-001..inc-042), `target-model.md`, `authorization-rules.md`, `integrations.md`,
cross-checked against `ipaffs-qa-automation/tests/accessibility/ched-pp-accessibility-tests.spec.ts`
and `workflows/notification/ched-pp-workflows.ts`.

---

## 1. Page inventory — one genuine page still missing

The DoA fold-in closed the biggest earlier hole: `consignment-for` and `consignment-organisation`
now have increments (inc-033, inc-034) behind the DoA gate (inc-032). Mapping all 39 spec pages to
increments, **38 of 39 map cleanly, one is deliberately excluded, and one real page is entirely
absent from the backlog**:

- **`gms-declaration` — MISSING (blocker).** The journey-spec knows this page
  (`journey-spec.json:255`, `9200-9206`, `9235`) as a CHED-PP-scoped interstitial —
  a single radio "Yes, I confirm the above" confirming "CDS has asked you to make a GMS application"
  (`GMSDeclarationPage.ts:6-7`) — interposed between `commodity-additional-details` and
  `transport-before-bip` **only when `gmsDeclaration='Yes'`**. The workflow drives it
  (`ched-pp-workflows.ts:383-386`), so it is real, not hypothetical. It is:
  - **not one of the 39 `pages[]` entries** (it appears only inside `modelGaps` / other pages' notes),
  - **not an increment** in the backlog (no inc-*), and
  - **not in the target model** (`grep gmsDeclaration target-model.md` → nothing; the constraint
    `Confirm that CDS has asked you to make a GMS application` lives on `Commodities.java:55-59`
    `@ChedppGmsDeclaration`, `ValidationMessages.properties:90` — legacy, CHED-PP-only single group).

  It is skipped in nearly every trace because `DEFAULT_CONFIG.gmsDeclaration='No'`
  (`ched-pp-workflows.ts:159`), which is exactly why it slipped the net: an evidence-led inventory
  under-weights a page the corpus almost never enters. This is a page + a field + a validation
  message with no home anywhere in the build. **Needs a human ruling on whether a GMS declaration
  step is in scope for pass 1 at all** (the spec itself flags "the rebuild may revisit whether a GMS
  declaration step is needed") — but it must be a decision, not an omission.

- **`split-consignment-confirm` — deliberately excluded (not a gap).** `scopeExclusions` names it a
  post-submission action (separate remit); `fieldMap` maps it to a lifecycle action with no data.
  Correctly out of scope.

Everything the a11y walk and the workflow exercise is otherwise covered. The QA page object
`commodityExtendedDescription` blurs two pages (`commodity-bulk-details` +
`commodity-additional-details`) into one object (`journey-spec.json:9236`); the backlog correctly
splits them (inc-018/inc-019), so that is a test-suite artefact, not a backlog gap.

**Answer to Ask 1:** the inventory is complete against the a11y walk + workflow with the single
exception of the `gms-declaration` interstitial, plus its unmodelled field.

---

## 2. Validation coverage — the headline improvement, quantified

| Confidence | This pass | Previous pass |
|---|---|---|
| confirmed (observed in an error render) | 9 | 8 |
| legacy (read from Joi / Jakarta catalogue) | 219 | 0 |
| inferred (from QA tests/page objects) | 74 | 128 |
| gap (no evidence) | 8 | 19 |
| **total** | **310** | **155** |

**Grounded coverage (confirmed + legacy) moved from 8/155 (~5%) to 228/310 (~74%)** — a ~15x lift,
entirely from authorising the frontend `en.js` Joi catalogue and the backend
`ValidationMessages.properties` Jakarta catalogue. The improvement is real and the copy is now
trustworthy. **But two caveats an honest read must keep:**

1. **Confirmed-RENDERED coverage barely moved: 8 → 9.** Only nine validation messages in the entire
   journey have ever been seen in an actual error state. The other 219 "grounded" messages are
   trustworthy for COPY and for "mandatoriness as the old system had it" — they are NOT proof the
   new app should render that string, or enforce that requirement, in that place.
2. **219 legacy messages carry a live two-layer contradiction.** c-018/c-019: the same field's error
   reads `Enter the…`/`Select the…` at the frontend Joi layer and `Add the…` at the backend Jakarta
   layer (e.g. BCP: `Select the entry border control post` en.js:76 vs `Add the entry Border Control
   Post` ValidationMessages.properties:36). Neither was observed rendered — it is legacy-vs-legacy.
   The backlog handles this correctly (inc-003 records "one canonical string per field") but it
   remains a copy decision the team owns, not a settled fact.

**Pages still lacking any GROUNDED (confirmed or legacy) validation evidence:**

- **`import-type` — the standout (major).** 3 messages, all `inferred`. This is the app's entry gate,
  and its `Select the type of import` (en.js:94) is explicitly flagged in inc-008 as "the single most
  valuable message to confirm manually". Still not grounded.
- **`commodity-summary`** — 1 inferred (low risk; read-only echo page, minimal validation surface).
- **`notification-hub`** — 0 (gap page; no create trace exercised the hub — expected, see §5/inc-020).
- **`consignor-confirmation`, `confirmation`, `delete-notification`** — 0 each, but these are
  confirmation/terminal/confirm-only pages with no data inputs, so legitimately no validation.
- **`sign-in`** — 2 inferred + 1 gap, but out of the create journey (auth handshake, inc-042).

The `gms-declaration` page's own message (`Confirm that CDS has asked you to make a GMS application`)
IS legacy-grounded, but the page has no increment (§1), so that grounding is orphaned.

---

## 3. Confidence honesty across all fields

| Layer | confirmed | legacy | inferred | gap | total |
|---|---|---|---|---|---|
| Pages | 23 | 1 | 13 | 2 | 39 |
| Fields | 312 | 7 | 29 | 6 | 354 |
| Validation messages | 9 | 219 | 74 | 8 | 310 |

Honest reading:

- **Field/page confidence is genuinely high** — 312/354 fields and 23/39 pages are confirmed because
  the traces rendered the controls. Solid ground.
- **Validation confidence is legacy-dominated, not confirmed** — the 74% headline is 219 legacy +
  9 confirmed. The distinction matters: legacy tells you the string and the old mandatoriness, not
  that it renders here now. Treat mandatoriness as a policy to re-ratify, per the taxonomy.
- **The 2 gap PAGES are the real unknowns:** `notification-hub` (task-list structure/gating never
  traced) and `commodity-search` (the one un-hardcodeable lookup). Both are born-blocked (inc-020,
  inc-014) — correctly.
- **The 6 gap FIELDS** are honestly surfaced: `csv-upload` Variety/Class columns, and four
  `notification-hub` conditional sections (Transport H2, `catch-certificatesIUU`,
  `latest-health-cert-status`, `charity`). All flow into the inc-020 blockedQuestion.
- **The 7 legacy FIELDS** include two correctly EXCLUDED as Animals-only (`animal-certified-as`,
  `including-non-ablacted` — CHED-P/D fieldConfig, not CHED-PP), showing the method discriminates
  rather than over-includes.

No dishonest confidence inflation found. The one soft spot is rhetorical: a reader skimming "74%
grounded" could mistake it for "74% verified against the running system", which it is not (that
number is 9/310, ~3%).

---

## 4. Backlog fidelity

**Every page → an increment:** 38/39 spec pages map (list in §1); `split-consignment-confirm` is a
documented exclusion; **`gms-declaration` is the one unmapped page.** So the "every page → increment"
invariant holds for 38 of the 40 real pages, fails for one.

**Every model field → a page:** the `target-model.md` fieldMap asserts full coverage bar server-set
fields (`id`/`referenceNumber`/`status`/`created`/`updated`) and the derived Trade Partner badge.
That holds — with one inverse gap: **the `gmsDeclarationAccepted` field has a PAGE
(`gms-declaration`) but no MODEL home and no increment.** It maps nowhere in `target-model.md`. So
the accurate statement is "every model field has a page, but not every page field has a model field"
— the GMS field is the lone orphan.

Coherent, non-gaps worth noting (not defects):
- Server-filled parties (`importer`/`consignee`/`responsiblePerson` via POP-1/2/3) have pass-through
  pages (traders-addresses, contact-details) that ARE increments, with auto-population deferred to
  inc-032. Consistent.
- Billing's four pages fold into one increment (inc-036); consignor-create+confirmation into inc-027;
  three cloning pages into inc-041. All deliberate and documented.
- 10 born-blocked increments (inc-014, 020, 025, 032, 033, 034, 036, 037, 040, 041) match the
  `bornBlocked` list exactly.

---

## 5. Method critique — what is STILL structurally invisible

Legacy source is now authorised, and it delivered on COPY, ENUM VALUES and field MANDATORINESS. What
it cannot deliver is **conditional business logic that lives in backend Java + fieldConfig + the risk
engine, with no template, no message key, and no page object.** The enriched method can see the
message a rule EMITS but never the predicate that FIRES it. These are the residual human/policy
questions — each a rule whose OUTPUT was traced but whose LOGIC was not:

- **Article 72 eligibility (inc-040).** Born-blocked with no UI of its own; traces show rule outputs,
  never the country×commodity classification or what it gates. Pure backend rule.
- **Risk categorisation.** Stubbed always-low for pass 1. The real keying (country × commodity ×
  `varietyId` — Open Q 2 notes the risk engine keys on varietyId) is invisible; only the stubbed
  low-risk OUTPUT on `confirmation` is seen. The predicate is unseen.
- **HMI / PHSI auto-completion + the check regime.** The decision-app checks are out of scope, but
  the trigger that auto-completes or requires Documentary/Identity/Physical checks (and which
  commodities require which — `ched-pp-workflows.ts:593-604` shows the tests themselves discovering
  this dynamically) is backend logic, not a page.
- **CUC billing trigger (c-007, inc-036).** Is billing gated by a free-standing `isCuc` flag or by
  the Sevington/Folkstone port chosen on `transport-before-bip`? Every CUC test pairs the two; no
  trace or assertion pins the server rule. Structurally invisible.
- **Split-consignment generation.** The rule partitioning commodities into valid/rejected tabs is
  post-submission backend logic; the UI (`expectSplitTabCommodities`) only reads the outcome.
- **Control-point ↔ BCP filtering.** Confirmed that filtering HAPPENS (135 vs 52 control points for
  different BCPs); the RULE mapping BCP → control points was never exercised. `gap` on the rule,
  `confirmed` on the existence.
- **`isSpeciesACheckbox` control-type variance (modelGap control-type-varies-by-data).** For some
  commodity codes species render as checkboxes, others as a searchable list. Which codes get which is
  a backend fieldConfig decision, not a template the method can read.
- **POP-2 "which member becomes Responsible person" (G-1).** The contact auto-populates from a member
  of the owning org; the rule choosing WHICH member is backend, never rendered.
- **`reasonForImport` branching (Open Q 5).** Only "Internal market" is ever chosen; whether Re-entry
  / Re-conformity branch the journey is untraceable and unseen in logic.
- **Species-id stability across ref-data refreshes (Open Q 1).** A data-governance fact about
  `add-species-<id>` that no template, message or test can show — only the owning data pipeline knows.

The common shape: **legacy source raised the floor on "what the field is and what it says", but the
ceiling on "when does this rule fire, what does it change, and how does it classify" is unchanged.**
Those answers are not in IPAFFS templates or catalogues — they are in service code and reference-data
pipelines the method does not read — so they remain questions for a human, correctly flagged as
born-blocked or open-question rather than invented.

---

## Bottom line

The enriched pass is materially more complete and honest than the trace-only baseline: DoA pages are
now covered, validation grounding went 5% → 74%, and confidence tags are not inflated. The residual
gaps are: (1) the **`gms-declaration` interstitial page, field and validation message have no model
home and no increment** — the one real page still missing; (2) **`import-type` is the only live form
page with no grounded validation** and it is the app's entry gate; (3) the confirmed-RENDERED
validation floor is still only 9 messages, so mandatoriness must be re-ratified not inherited; and
(4) a well-defined set of **backend business rules remains structurally invisible** and is correctly
parked for humans rather than guessed.
