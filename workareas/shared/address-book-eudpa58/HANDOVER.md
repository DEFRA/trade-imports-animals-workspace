# EUDPA-58 Address Book — engineer handover (2026-07-24, updated 2026-08-04)

You are picking up **EUDPA-58 "Address Book"** cold. This folder is the front door.
Read this file top-to-bottom, then the artifacts it points at. Everything you need to
continue is here or referenced here.

---

## 1. TL;DR — current state

| Phase | State |
|---|---|
| **Requirements (spec + conflicts)** | ✅ DONE + gated. 30 rulings, **0 open**. Stable — built against the tickets + the V4 Standard Address Block, which don't drift. |
| **Design + API contract** | ✅ DONE + gated. Topology, OpenAPI, reference/resolve + freeze-on-submit models, deleted gate, stack wiring. |
| **Backlog** | ✅ DONE + verified. 33 increments, M0–M4, valid topo-sort, every in-scope AC covered. |
| **Build — M0 address-book API** | ✅ SHIPPED — [`trade-imports-address-book`](https://github.com/DEFRA/trade-imports-address-book) merged ([PR #1](https://github.com/DEFRA/trade-imports-address-book/pull/1)); clone under `repos/trade-imports-address-book`. |
| **Build — M0 INS frontend + stack** | 🔄 IN PROGRESS — [`trade-imports-ins-frontend`](https://github.com/DEFRA/trade-imports-ins-frontend) [PR #1](https://github.com/DEFRA/trade-imports-ins-frontend/pull/1) (list/add/sign-in); workspace stack wiring [PR #42](https://github.com/DEFRA/trade-imports-animals-workspace/pull/42). |
| **Build — M1 (286 view/edit/delete)** | 🔄 IN PROGRESS — ins-frontend [PR #2](https://github.com/DEFRA/trade-imports-ins-frontend/pull/2). |
| **Build — M2–M4** | ⛔ NOT started (search, journey reference/resolve, deleted gate + freeze-on-submit). |

**Two things you MUST internalise before writing any more code:**

1. **`main` has moved a lot since this was planned (2026-07-21).** The requirements are
   fine, but the design/backlog cite `file:line` salvage references against the *old*
   main. Before building M3+ journey integration, do a **reconcile-against-current-main**
   pass (§4). This is the single biggest trap.
2. **The canonical service code lives in GitHub repos, not in this handover folder.**
   `repos/trade-imports-address-book` and `repos/trade-imports-ins-frontend` are the only
   sources of truth. This folder holds planning artefacts only (spec, design, backlog,
   contract).

---

## 2. What EUDPA-58 is (the re-plan context)

The epic's child tickets were **comprehensively rewritten on 2026-07-21**, inverting ~8
earlier design rulings. A prior delivery existed against the *old* tickets; it is now
**reference only**. This handover is the product of a fresh spec → design → backlog
re-plan against the **rewritten** tickets, plus delivery of M0/M1.

The shape you are building toward:

- **Two NEW services.** `trade-imports-ins-frontend` — a net-new "Import Notification
  Service" shell (CDP Node template: sign-in, dashboard, and the address-book UI lives
  here, NOT in `trade-imports-animals-frontend`). `trade-imports-address-book` — a new
  Java/Spring API (modelled on `trade-imports-reference-data`), the system of record for
  addresses (`uk.gov.defra.trade.imports.addressbook`).
- **Addresses are UNTYPED** (D3/D21). No operator_type, no type-scoped pages, no filter.
  The role ("consignment party") is applied when an address is selected into a
  notification.
- **Org-scoped** (D23), path-based: `/organisation/{orgId}/addresses`. `orgId` from Defra
  ID `currentRelationshipId`. The API **authorises** the caller's forwarded org against
  the path `orgId` (404 on mismatch — cv-040).
- **Country = MDM-picked, stored as ISO alpha-2 `countryCode`**, not server-validated.
- **Reference + resolve-on-read** (294): a notification holds a *reference* and resolves
  it on read, so Draft/Amend always show latest. **Freeze-on-submit snapshot** (295):
  on submit, capture resolved details as a frozen snapshot (reusing
  `NotificationContentSnapshot`) while keeping the `addressId`. **Deleted-address gate**
  (293): backend rejects a submit referencing a soft-deleted address.
- **Transporter is DEFERRED** out of the book. **"Operator" is retired → "address" /
  "consignment party"** (D13). place-of-origin + consignment-contact stay INLINE.

Full change analysis: `requirements-delta-2026-07-21.md` (in this folder).

---

## 3. The artifact set (all in this folder)

| File | What it is | Status |
|---|---|---|
| `address-book-spec-v2.json` | Requirements: entities, pages, API ops, behaviours, journey integration, per-AC coverage map | Gate-passed, authoritative |
| `conflicts-v2.json` | 30 rulings (4 ruled re-plan, 6 gate-ruled, 8 superseded, 12 carried-forward). **0 open.** All 21 old rulings accounted for. | Gate-passed |
| `design-v2.md` | Full design: topology, per-component salvage-vs-rebuild, reference/resolve, freeze-on-submit, deleted gate, stack wiring | Gate-passed; **code anchors need refresh (§4)** |
| `api-contract-v2.yaml` | OpenAPI 3.0.3 for `/organisation/{orgId}/addresses` (list/create/get/put/delete), camelCase, problem+json | Gate-passed |
| `backlog-v2.json` | 33 ordered increments, M0–M4, each with acRefs/conflictRefs/dependsOn/tddTargets/gate | Verified |
| `requirements-delta-2026-07-21.md` | What the ticket rewrite changed vs the old delivery | Context |

> Planning snapshot rooted in 2026-07-24. **Live code:** clone
> `repos/trade-imports-address-book` and `repos/trade-imports-ins-frontend` (or
> `make setup`). Do not use any vendored pre-rewrite operators tree — it was removed
> from this folder because it contradicted the shipped service.

**How to read them:** start with the spec's `acCoverage` + `blockingGraph`, then
`conflicts-v2.json` `_meta` (the ruling index), then `backlog-v2.json` `increments`.
`design-v2.md` is the deep reference you consult per-increment.

---

## 4. ⚠️ The drift — reconcile before building M3+

Planned 2026-07-21; `main` was pulled 2026-07-24 and had advanced substantially:

- **backend** `d345a38 → 3b702a2`: **`NotificationContentSnapshot` is now on `main`**
  (good — it's the 295 reuse target), plus large gbnag-outbox + replay work.
- **frontend** `6b09da1 → 350af8c`: EUDPA-50 transited-countries, EUDPA-73 search,
  port-of-entry, cancel-amend.
- **tests** `a9fe2aa → 726ab44`: **restructured `ui/` → `flows/` + `page-objects/`** moved
  to repo root, new a11y suites.

**Consequence:** the design-v2 / backlog-v2 `file:line` salvage references for backend,
frontend, and tests are stale. **Before building M3+ (journey integration):**

1. Rebase/merge each affected feat branch onto current `main` (§7).
2. Re-verify the design's backend/frontend/tests reference citations against the new main
   (especially backend `NotificationService`/outbox and the tests `ui/`→`flows/` move).
3. The spec/conflicts and the address-book API contract are **unaffected**.

This is a refresh, not a re-plan — structure, order, and AC coverage all hold.

---

## 5. Remaining infra / decisions (not code in this folder)

**Most M0 infra is done** — both GitHub repos exist, the address-book API is merged, the
INS frontend and workspace stack wiring are on open PRs. Still outstanding:

1. **Merge** ins-frontend PR #1 and workspace PR #42 to close M0 skeleton.
2. **CI/CD branch images** — ensure `run-stack.sh -b feat/EUDPA-58-address-book` resolves
   branch tags for address-book and ins-frontend (workspace tooling extended in PR #42).
3. **Journey integration (M3+)** — `trade-imports-animals-backend` does not yet call the
   address-book API; do not wire `TRADE_IMPORTS_ADDRESS_BOOK_URL` on the backend container
   until that client lands in a backend PR.

**Residual design risks for UX/BA (recommendations set in conflicts-v2, need sign-off):**

- **cv-048** — country search resolves the typed name → alpha-2 code in the **frontend**
  (adopted). Confirm before M2.
- **cv-044 / 186.AC2** — exact searched-field set (name/townOrCity/postcode/country).
- Soft-delete wire shape, sum-type class layout, outbox `addressId` emission (confirm with
  the Dynamics owner), INS port **3002** (wired in stack).

---

## 6. The address-book service — where the code lives

**Canonical repo:** `DEFRA/trade-imports-address-book` — package
`uk.gov.defra.trade.imports.addressbook`, port **8089**, merged to `main`.

```bash
make setup   # clones repos/trade-imports-address-book if missing
make start-address-book   # native Spring Boot on :8089 (needs Mongo on :27017)
```

Or from the stack:

```bash
./scripts/stack/run-stack.sh -b feat/EUDPA-58-address-book
./scripts/stack/run-stack.sh -d -b feat/EUDPA-58-address-book   # build from repos/
```

The pre-rewrite `trade-imports-operators` / `uk.gov.defra.trade.imports.operators`
delivery is **obsolete**. The parked animals-backend reference PR #67 was built against
that model — do not treat it as the integration template.

---

## 7. Branch / state map (2026-08-04)

| Repo | Branch | Status |
|---|---|---|
| `trade-imports-address-book` | `main` (merged) | System of record API — canonical |
| `trade-imports-ins-frontend` | `feat/EUDPA-58-address-book` | M0 PR #1 + M1 PR #2 open |
| `trade-imports-animals-workspace` | `feat/EUDPA-58-address-book` | Stack wiring PR #42 open |
| `trade-imports-animals-frontend` | reference PR #159 | First-pass only — journey work is M3+ |
| `trade-imports-animals-backend` | reference PR #67 | **Parked** — pre-rewrite operators model |
| `trade-imports-animals-tests` | reference PR #94 | First-pass only |

Cross-repo branch parity: use **`feat/EUDPA-58-address-book`** on every affected repo
when running the stack with `-b`.

---

## 8. Build plan — order of work

Blocking graph (from the spec): **287 → {286, 186} → 294 → 293 & 295**, with 286.AC8
gated behind 295. Milestones in `backlog-v2.json`:

- **M0 (287)** — skeleton: both services + stack wiring + CI/CD + list + add + POST + sign-in + nav.
  *Address-book API DONE; INS frontend + workspace wiring in flight.*
- **M1 (286)** — view/edit/delete + by-id/PUT/DELETE endpoints. *INS frontend PR #2 open.*
- **M2 (186)** — server-side `?q=` search.
- **M3 (294)** — reference + resolve-on-read + select pages + EUDPA-198 addressLine3 trim.
- **M4 (293 + 295)** — deleted-address submit gate + freeze-on-submit. **295 lands second**,
  so the validate-then-freeze ordering + its integration test live in m4-04.

Milestone walk-through gates at m0-15, m1-06, m2-02, m3-05, m4-05; a **model-extension halt**
at m3-01 (before the breaking `addressLine3` removal + outbox `schemaVersion 2→3`).

---

## 9. Environment + working notes

- **Workspace conventions:** see the root `CLAUDE.md`. Branch naming `feat/EUDPA-XXXX`;
  cross-repo branches share the **same name** across every affected repo (the stack's
  `--branch` flag depends on it). Raise PRs against `main` per repo.
- **Stack:** `make docker-compose-dev` (or `tim docker dev`) builds the **8** repo-backed
  services from local source with hot-reload. Address-book on `:8089`, ins-frontend on
  `:3002`. Both repos are in `make setup`, `run-stack.sh` branch probe, and `--exclude`
  labels (`address-book`, `ins-frontend`).
- **Java tests need Docker running** (Testcontainers/Mongo). `mvn -f <pom> clean verify`.
- **If you drive this with agents/build-loops:** roll back a failed increment with
  `git stash push -u`, **never** `git reset --hard` + `git clean -fd` — the harness safety
  classifier blocks the destructive form and leaves the tree dirty. Keep one command per
  bash call; defer `sonar analyze` to a milestone gate.
- **Before committing:** the frontend/admin repos have pre-commit hooks (format + lint +
  vitest); the Java repos run `mvn` gates. Run `sonar analyze --staged` and fix
  BLOCKER/CRITICAL before committing (per CLAUDE.md).

---

## 10. Pointers

- **Jira epic:** EUDPA-58. Children: **287** (skeleton), **286** (view/edit/delete), **186**
  (search), **294** (link/reference/resolve), **293** (deleted gate), **295** (freeze-on-submit).
  **185** → recommend close as duplicate of 287 (cv-041). **187** parked. **198** absorbed into 294 (cv-003).
- **Standard Address Block:** Confluence "Live Animals Data Fields V4 — Common Attributes"
  (page id `6497338582`; local mirror `docs/confluence/live-animals-data-fields-v4/index.md`).
- **Related deps:** 142 (INS routing), 119 (approved transporter list), 59 (Defra ID auth), 271 (type-ahead, impacts 186).
- **Fetch tickets live:** `tools/jira/ticket.sh EUDPA-<n>`.

Questions on any ruling → `conflicts-v2.json` records the ruling, its rationale, and which
old ruling it supersedes. Every in-scope AC → `address-book-spec-v2.json` `acCoverage`
maps it to the node(s) that satisfy it.
