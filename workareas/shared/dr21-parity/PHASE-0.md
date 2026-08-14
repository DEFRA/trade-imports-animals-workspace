# EUDPA-328 — Phase 0 results

Run 2026-08-14. Serial, no fan-out. Sizing only — nothing here gates the approach.

## Capture manifest (pin these)

| Side | Ref | Detail |
|---|---|---|
| Frontend | `32f6106c` on `main` | `chore(EUDPA-324): remove the import-type page and open the run at notification creation (#198)`, 2026-08-13 |
| Prototype | `7da4f70` | `2.1 dashboard updates`, 2026-08-04. Working tree clean bar an untracked `journey-demo/playwright-report.zip` |
| Playwright | `1.61.0` | pinned in the frontend `package.json` |

The frontend checkout was moved from `feature/EUDPA-124-port-of-entry-type-ahead`
(`077f13f3`) to `main` and **left there**. Nothing was stashed — the tree was clean.

## 1. Prior work recovered ✅

`12c6d4a` → `workareas/shared/dr21-parity/prior/`. 99 files, all present.

Salvage confirmed:

| Asset | Where | Verdict |
|---|---|---|
| Page-model schema | `prior/harness/e2e/page-model.js` (213 lines) | **Use as-is.** Self-contained DOM extractor, no imports beyond `fs`/`path`. Covers headings, captions, field order, labels, hints, option lists, summary/task lists, cards, tables, buttons, links, inset/details/warning text, tags, error summaries |
| DR2 walker | `prior/harness/e2e/dr2.spec.js` (377 lines, 22 `capture()` calls) | **Retarget.** Base for the DR2.1 walker |
| Resolved decisions | `prior/spec.md`, `prior/evidence.md`, `prior/open-questions.md` | Salvage the rulings, ignore the findings |
| ~85 page models | `prior/capture-model/` | Baseline for a DR2→DR2.1 delta only |

One wrinkle: `rm -rf` on the staging copy at
`workareas/shared/design-release-2-parity/` was denied by a permission rule, so it
is still on disk as a duplicate of `prior/`. It is unstaged and harmless. Worth
deleting by hand so no later worker mines the wrong tree.

## 2. Trace skill installed ✅

`.claude/skills/playwright-trace/SKILL.md` — workspace, not the frontend repo.

The material find is `trace snapshot <id> -- eval "<js>"`: it loads the frozen DOM
into a headless browser and runs arbitrary JS against it. **The salvaged extractor
can be run directly against a trace snapshot.** That closes the loop between the
old harness and the new approach — the schema is not re-derived, it is re-hosted.

## 3. Frontend measured on `main` ✅

`npm run test:features -- --trace on --reporter=list`, stack down.

| Metric | Value |
|---|---|
| Specs | 26 |
| Tests | **264 passed, 0 failed** |
| Wall-clock | **1.4 minutes** |
| Traces produced | **264** (one per test) |
| Corpus size | 272 MB |

### Clean-state coverage: 28 of 28 pages — **gap list is empty**

28 pages (32 `.njk` less 4 `_`-prefixed partials). Every one has at least one test
that renders it in a default, non-error state:

| Page | Clean-state test |
|---|---|
| `additional-details` | renders service-backed certification options and conditional copy |
| `addresses` (hub) | renders all five party rows and feature copy |
| `addresses/party-picker` | ×5 roles — "<Role> picker renders its role-specific copy and address table" |
| `addresses/create-address` | renders grounded field copy and an empty country select |
| `cancel-amend` | renders confirmation copy, actions and review back link |
| `check-answers` | renders entered and missing answers in their summary rows |
| `commodities/animal-identification` | shows the identifier fields that apply to each commodity |
| `commodities/consignment-details` | renders grouped species quantities and collection table |
| `commodities/search` | renders all eight pairs in commodity groups with grounded copy |
| `confirmation` | renders the notification reference, all feature copy and no back link |
| `contact` | renders the address-book contacts, feature copy and add link |
| `cph-number` | renders the CPH copy |
| `dashboard` | empty *and* populated states both covered |
| `declaration` | renders every declaration statement and the current date |
| `delete-notification` | renders confirmation copy, actions and dashboard links |
| `destination-country` | renders the captured country options and feature copy |
| `documents` | empty, populated, and three scan-status states |
| `exit-date` | renders the MoJ date picker and feature copy |
| `hub` | renders navigation copy and the task statuses of a newly entered journey |
| `import-purpose` | renders the service-backed purposes and feature copy |
| `import-reason` | renders the service-backed reasons and feature copy |
| `origin` | renders the captured MDM country options and feature copy — **trace-verified** |
| `port-of-exit` | renders the captured port options and feature copy |
| `transport/port-of-entry` | renders captured port options and all feature copy |
| `transport/transit-countries` | transit page renders captured country options and feature copy |
| `transport/transporters` | renders transporter guidance and branch options |
| `transport/transporters-select` | commercial transporter page renders address and approval details |
| `transport/private-transporter-details` | private transporter page renders all address fields and explanatory copy |

`notification-actions` has no template — it is behaviour over the dashboard, so it
is correctly absent from this table.

**Confidence.** The mapping is structural (specs are co-located with the feature
they drive). Seven of the 28 were verified directly against their traces, chosen to
cover every page shape in the service — **all seven rendered clean, zero error
summaries**:

| Page | Shape | Verified from the frozen DOM |
|---|---|---|
| `origin` | select + radios | h1 "Origin of the import", 29,677 bytes of DOM |
| `hub` | task list | h1 "Overview", 0 errors, 11 task rows |
| `check-answers` | summary cards | h1 "Check your answers", 0 errors, 18 rows / 6 cards |
| `dashboard` | dashboard cards | h1 "Import notification service", 0 errors, 1 nav item |
| `commodities/search` | checkbox groups | h1 "What are you importing?", 0 errors, 8 checkboxes / 5 groups |
| `exit-date` | MoJ date picker | h1 "Exit date", 0 errors, 1 `.moj-datepicker` |
| `documents` | table + upload | h1 "Upload documents", 0 errors, 1 table |

The remaining 21 are read from test titles against the same naming convention.
Phase 2 confirms them as a by-product of mining — no separate task needed.

### Three parity signals already visible

Not findings yet — they have had no adversarial pass — but they are artefact-backed
and worth carrying into Phase 3 rather than rediscovering:

- **Service navigation.** The frontend renders a single nav item ("Import
  notification service"). The captured DR2.1 model carries five: Dashboard,
  Templates, Address book, Manage account, Log out. Templates is a whole sub-domain
  (`/templates`, `/templates/create`, `/templates/:id`, `/templates/:id/use`) with no
  frontend equivalent.
- **Dashboard identity.** DR2.1's dashboard h1 is *"Live animals & germinal
  products"*; the frontend's is *"Import notification service"*. The germinal domain
  announces itself on the landing page.
- **Commodity selection is a different interaction.** On first render the frontend's
  `what-are-you-importing` is a static list — 8 checkboxes in 5 species fieldsets
  (Cow, Horse, Cat, Dog, Fish). DR2.1's is search-driven: one `input:search`, four
  hidden fields, a Search / Clear all pair and a link out to the Trade Tariff tool,
  with no checkbox group present at all. *Caveat for Phase 3:* the capture is the
  initial state; DR2.1 may well render results as checkboxes after a search. What is
  established is that the entry interaction differs, not the whole page.

## 4. Prototype inventoried ✅

| Metric | Value |
|---|---|
| DR2.1 views | **31** |
| GET endpoints | **51** (46 explicit + 5 generated from `consignmentAddressSections`) |
| POST endpoints | 31 |
| `routes.js` | 10,497 lines; DR2.1 is a *mount* of the whole router under `/design-release-2.1` |
| **DR2.1 spec coverage** | **0** |

`journey-demo/` contains `journey.js` + `walk.spec.js` only, and `walk.spec.js`
navigates root URLs — Design release 1. Confirmed: no DR2 or DR2.1 coverage exists.

Germinal products are unmodelled on the frontend: three incidental string matches
across the whole of `src/`, none of them a domain model. On the prototype it is 151
lines of commodity data, 32 of package types, and branch logic in
`consignment-details` and `animal-identification-details`. This is the largest
band, as expected.

## The two gap lists

**Frontend — empty** (pending the mechanical confirmation above).

**Prototype — 31 views**, every one of them. This is the whole of Phase 1.

That is a significant reshape: the plan assumed two workstreams and there is one.

## Canary: the mine pipeline works end to end

Proven on `origin`'s clean-render trace:

1. `trace open <trace.zip>` — 30 actions, 1 page, 0 errors
2. `trace actions` — action 11 is the first top-level assertion on the rendered page
3. `trace snapshot 11 -- eval "document.documentElement.outerHTML" --filename=<rel>` → 29,677 bytes of real DOM

Artefacts: `phase0/canary-actions.txt`, `phase0/canary-origin.html`.

### Two mechanical gotchas for the miners

- **`--filename` does not expand `~`.** It resolves relative to cwd; an absolute
  `~/…` path is taken literally and fails with ENOENT. Use relative paths — which
  suits private per-worker cwds anyway.
- **`trace open` extracts to `./.playwright-cli/` and each open replaces the last.**
  Confirmed. Give every parallel miner its own directory under `workareas/`
  (gitignored) or they will silently read each other's traces.

### Recommended mine shape

Dump `document.documentElement.outerHTML` per clean-render action, then run the
salvaged `page-model.js` extractor over the dumps in a batch. Two reasons over
running the extractor inline via `eval`: the extractor contains template literals
and `$` which are hostile to shell quoting, and the HTML dumps are durable evidence
that Phase 4's adversarial verifiers can re-check against — which is exactly the
"verify against artefacts, not memory" rule.

## Canary: the prototype side works too

`harness/` is the DR2.1 cartographer, descended from the recovered DR2 one. The
extractor is carried over unmodified; `node_modules` is a symlink to the prototype's
install (the trick the prior README documents, and the reason the walker can live in
the workspace at all).

`harness/e2e/canary.spec.js` — 3 standalone DR2.1 pages, **3 passed in 5.0s** on the
second run, with the workspace stack up on 3000 and the kit on 3010. Three real page
models are on disk in `harness/capture/model/`.

The first run failed one assertion — my guessed dashboard heading — which is how the
"Live animals & germinal products" signal above was found. Worth noting because it
is the mechanism working as intended: a wrong expectation about the prototype fails
loudly against a captured artefact rather than passing quietly into a backlog.

Every gotcha from the prior README held: dev mode not `serve`, TCP port wait,
`workers: 1`. One to add — the kit compiles its Sass on first request, so the first
navigation absorbs ~15s that boot does not.

## Files

```
workareas/shared/dr21-parity/
├── PLAN.md
├── PHASE-0.md                    ← this
├── prior/                        ← 99 recovered files
├── harness/                      ← DR2.1 cartographer (canary only so far)
│   ├── README.md
│   ├── playwright.config.js      ← kit on 3010, workers 1, trace on
│   ├── node_modules -> prototype's install
│   ├── e2e/page-model.js         ← salvaged extractor, unmodified
│   ├── e2e/canary.spec.js
│   └── capture/model/*.json      ← 3 DR2.1 page models
├── jira-description.txt          ← what was written to EUDPA-328
└── phase0/
    ├── features-run.txt          ← full 264-test run output
    ├── test-titles.txt           ← 264 spec::title pairs
    ├── proto-get-routes.txt      ← 47 prototype GET route lines
    ├── canary-actions.txt
    ├── canary-origin.html
    └── proto-canary.txt          ← DR2.1 canary run output
```

## Recommended Phase 1 shape (for agreement)

Phase 0 reshaped this. The frontend workstream is gone, so Phase 1 is one job:
**write the DR2.1 walker**. Proposed fan-out, roughly 8 workers:

| Worker | Screens |
|---|---|
| Dashboard + templates sub-domain | dashboard, actions, changes, inspection, templates, create-template, view-template |
| Notification spine | notification-hub, review-notification, declaration, notification-submitted, delete-notification |
| Origin + import reason | origin-of-the-import, reason-for-import, cph-number |
| Commodities — live animals | what-are-you-importing, consignment-details, animal-identification-details, additional-animal-details |
| Commodities — germinal branch | the same four pages in the germinal branch |
| Addresses | roles-and-addresses, consignment-address-select ×5, permanent-address, permanent-address-animals, contact-address-for-consignment |
| Transport | arrival-details, transit-countries, transporter, transporter-add, -add-private, -add-commercial |
| Documents | upload-documents |

Each worker owns a private capture directory, reuses the prototype's own journey
helpers for the bespoke widgets, and asserts each step landed where it should so a
silently-rejected page cannot leave a mislabelled capture behind.

Open for Sam: whether the germinal branch is one worker or split per page — it is
the least-known surface and the most likely to need two.
