# Drift audit

## 1. Executive summary

Audit start date: **2026-06-22**. The reconstructed spike lineage is **EUDPA-249 → EUDPA-277 → EUDPA-288**: EUDPA-249 is the earliest predecessor, EUDPA-277 supplied the second model input, and EUDPA-288 consolidated them into the current retrofit.

**Headline: one of 27 code tickets was dropped.** EUDPA-73's exact, complete notification-reference search is absent from the rewrite, with **high confidence**. The dashboard controller propagates only page and sort (`frontend:src/server/live-animals/features/dashboard/controller.js:42`, `:44`, `:79`); its only list-control form is sorting (`frontend:src/server/live-animals/features/dashboard/template.njk:34`, `:38`); and neither relevant backend list endpoint accepts a reference filter (`backend:src/main/java/uk/gov/defra/trade/imports/animals/fulfilment/FulfilmentController.java:117`; `backend:src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:169`).

Sam's other suspicions are resolved as follows:

- **Dashboard sorting EXISTS** (EUDPA-250, high): page and sort are parsed and sent to the list service, and row links no longer carry the legacy query-validation failure (`frontend:src/server/live-animals/features/dashboard/controller.js:42`, `:45`; `frontend:src/server/live-animals/features/dashboard/view-model/row/actions.js:25`, `:39`; `frontend:src/server/live-animals/shared/kit.js:121`).
- **Transited countries EXIST** (EUDPA-50, high): the conditional road/rail obligation, country selection, deduplication and persistence remain (`frontend:src/server/live-animals/model/obligations/sections/transport.js:84`, `:92`; `frontend:src/server/live-animals/features/transport/transit-countries/transit-countries.controller.js:21`, `:71`, `:99`; `frontend:src/server/live-animals/services/countries/index.js:7`).
- **Dashboard searching DROPPED** (EUDPA-73, high), as evidenced above.

Overall verdict: **26 EXISTS, 1 DROPPED**. All verdicts are high confidence except EUDPA-299, which is medium confidence because repository-level auto-merge and branch-protection settings are outside the commit evidence.

## 2. Code-ticket verdicts

| Key | Summary | Verdict | Confidence |
|---|---|---|---|
| EUDPA-50 | Skeleton:Transited Countries | EXISTS | high |
| EUDPA-73 | Skeleton: Search a notification | **DROPPED** | high |
| EUDPA-122 | Arrival details | EXISTS | high |
| EUDPA-154 | Port of entry data integration with MDM | EXISTS | high |
| EUDPA-171 | Amend notification | EXISTS | high |
| EUDPA-194 | Address simple findings from Lighthouse CI report (best effort) | EXISTS | high |
| EUDPA-208 | Consume NotificationSubmitted from SQS in dynamics-gateway and forward to ASB | EXISTS | high |
| EUDPA-213 | Hot-reload Java services in docker-compose-dev (DevTools parity with frontend nodemon) | EXISTS | high |
| EUDPA-232 | Consignment Address page | EXISTS | high |
| EUDPA-239 | Select an Operator | EXISTS | high |
| EUDPA-248 | Cancel an "Amend" | EXISTS | high |
| EUDPA-250 | Dashboard not opening up notifications when sorting by arrival oldest to newest | EXISTS | high |
| EUDPA-251 | Notification dashboard: `<dt>`/`<dd>` elements not contained by a `<dl>` (WCAG 2.2 AA dlitem violation) | EXISTS | high |
| EUDPA-253 | Define retry and DLQ process in trade-imports-dynamics-gateway | EXISTS | high |
| EUDPA-261 | OutboxPublishService publishes only event data, not the full enveloped event | EXISTS | high |
| EUDPA-263 | Upgrade npm dependencies in trade-imports-animals-tests | EXISTS | high |
| EUDPA-264 | Upgrade govuk-frontend to 6.3.0 across the frontend repos | EXISTS | high |
| EUDPA-267 | Reliable event replay, FIFO configuration and message identities | EXISTS | high |
| EUDPA-268 | Include publishedAt timestamp on all events | EXISTS | high |
| EUDPA-272 | Implement Linux snapshot generation for @visual tests | EXISTS | high |
| EUDPA-273 | Add 7-day TTL to app-created notifications in non-prod environments | EXISTS | high |
| EUDPA-274 | Create GBN-AG model and mapper from NotificationSubmittedData in backend | EXISTS | high |
| EUDPA-280 | Extend @a11y accessibility scans to cover all implemented pages | EXISTS | high |
| EUDPA-281 | Add actor (acting-user identity) and state history to the event envelope | EXISTS | high |
| EUDPA-289 | Add API-driven notification seeding for e2e tests | EXISTS | high |
| EUDPA-291 | Replace the remaining LocalStack usages with Floci | EXISTS | high |
| EUDPA-299 | Clear frontend dependabot backlog and enable auto-merge | EXISTS | medium |

## 3. Dropped ticket: EUDPA-73

**Summary:** Skeleton: Search a notification

**Delivered:** Added dashboard search by an exact, complete notification reference, passed the reference to the backend list endpoint, returned only the matching notification, and displayed "No notifications found" for no match while preserving dashboard sorting.

**Verdict:** **DROPPED**  
**Confidence:** **high**

**Evidence:**

- `frontend:src/server/live-animals/features/dashboard/controller.js:42`
- `frontend:src/server/live-animals/features/dashboard/controller.js:44`
- `frontend:src/server/live-animals/features/dashboard/controller.js:79`
- `frontend:src/server/live-animals/features/dashboard/template.njk:34`
- `frontend:src/server/live-animals/features/dashboard/template.njk:38`
- `backend:src/main/java/uk/gov/defra/trade/imports/animals/fulfilment/FulfilmentController.java:117`
- `backend:src/main/java/uk/gov/defra/trade/imports/animals/notification/NotificationController.java:169`

**Reason:** The rewrite dashboard accepts and propagates only page and sort, and its only list-control form is the sort form; there is no keyword/reference field, search action, filtered list call, or search-specific empty state. Both the rewrite fulfilment list API and the retained notification list API likewise accept only page and sort. Dashboard SORTING is present, but dashboard SEARCHING is not, and no replacement mechanism or design reason was found. Discovery of another routed dashboard implementation with reference filtering would change this verdict.

## 4. Non-code tickets

Here, **n/a** means no matching ticket key appeared in the eight scoped `origin/main` histories; it does not prove that no code exists in another repository or on spike ancestry.

- EUDPA-106 — Spike: refactor file upload to allow larger file sizes — **n/a**
- EUDPA-181 — Consolidate workspace docs and agent best-practices under a single docs/ root — **n/a**
- EUDPA-214 — Prepare workspace onboarding sessions and per-skill demo materials — **n/a**
- EUDPA-216 — Require single-turn parallel fan-out emission across all 5 fan-out skills — **n/a**
- EUDPA-217 — Add FAILED return-shape contracts to 4 worker references — **n/a**
- EUDPA-218 — Add NOT-clauses and example invocations to CLAUDE.md tools-index rows — **n/a**
- EUDPA-219 — Polish skill prose — drop ticket don'ts, add skill-creator and govuk-upgrade NOT-clauses — **n/a**
- EUDPA-220 — Add minimal frontmatter (allowed-tools, argument-hint, context) to all 8 SKILL.md files — **n/a**
- EUDPA-221 — Add PreToolUse hooks enforcing destructive-action guardrails and redirecting common foot-guns — **n/a**
- EUDPA-222 — Extract Bash-call-hygiene to .claude/rules/bash-hygiene.md and replace duplicates with pointers — **n/a**
- EUDPA-223 — Split CLAUDE.md into .claude/rules/ topic files via @import; hoist load-bearing rules to top — **n/a**
- EUDPA-224 — Refactor recipe-style worker references into goal + success criteria + artefact shape — **n/a**
- EUDPA-226 — Create CDP Java backend template repository — **n/a**
- EUDPA-229 — Process outbox event and publish to SNS Topic — **n/a**
- EUDPA-233 — Select a Place of origin — **n/a**
- EUDPA-234 — Select a Consignor or exporter — **n/a**
- EUDPA-235 — Select a Consignee — **n/a**
- EUDPA-236 — Select an Importer — **n/a**
- EUDPA-237 — Select a Place of destination — **n/a**
- EUDPA-238 — Select a CPH — **n/a**
- EUDPA-242 — Re-check branch images after the stack is healthy in run-stack.sh — **n/a**
- EUDPA-243 — Create test-stack-analysis skill — find test pyramid gaps and duplication — **n/a**
- EUDPA-244 — Fix update-ticket.sh --add-label: mapfile breaks on macOS bash 3.2 — **n/a**
- EUDPA-249 — Spike - use the obligations model as the basis for a journey driven by commodity code and country of origin — **n/a**
- EUDPA-258 — Update GBN-AG Schema to latest V4 data — **n/a**
- EUDPA-270 — Spike: Assess date picker feasibility and GDS compliance — **n/a**
- EUDPA-275 — Path-scoped rules: auto-inject best-practices by file type via .claude/rules/ paths globs — **n/a**
- EUDPA-276 — Make code-style skill multi-language: Java, GDS/.njk, Playwright and k6 rule sourcing — **n/a**
- EUDPA-277 — Spike: validate the obligations model against Live Animals Data Fields V4 — **n/a**
- EUDPA-278 — Spike: implement a journey fulfilling a subset of obligations from EUDPA-277 — **n/a**
- EUDPA-279 — Move Product Quantity to "Line Level" (Per species) — **n/a**

## 5. Method

- **Start date and lineage:** Git ancestry was reconstructed rather than relying on the current merge-base, which had moved forward after main was merged into the long-running spike. The earliest pre-divergence boundary is frontend commit `85bf0c4d717a319694a60d28d3b262127d4744a2` on **2026-06-22**; the first lineage-only EUDPA-249 commit followed on 2026-06-23. The inventory therefore starts at the full-day boundary `2026-06-22T00:00:00+01:00`. Commit ancestry and Jira descriptions establish EUDPA-249 → EUDPA-277 → EUDPA-288.
- **Inventory:** All eight named `origin/main` refs were fetched and searched from that boundary. Ticket keys were mined from both merge and non-merge commit subjects. This matters because seven repositories use squash-style main commits and had no merge commits in range; Dynamics Gateway contained both PR merges and non-merge ancestry. The result was 27 distinct code tickets.
- **Jira cross-check:** The inventory was checked with `project = EUDPA AND status changed TO Done DURING ("2026-06-22", "2026-07-31") ORDER BY key ASC`. The exclusive 2026-07-31 upper bound covered the audit through 2026-07-30. Jira returned 57 Done-in-range tickets: 26 matched scoped main-log subjects and 31 did not. EUDPA-281 was already present on main while still at Deskcheck, bringing the code inventory to 27 and the combined inventory to **58**.
- **Verdicts:** Each code ticket's delivered behavior was compared with the rewrite and shared-service code paths recorded in `phase-b-verdicts.json`. A capability was marked EXISTS where the implementation or an explicit replacement remained; DROPPED required absence without a replacement or documented design reason. This produced **26 EXISTS / 1 DROPPED**.
