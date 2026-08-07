# EUDPA-58 Address Book — engineer handover (2026-07-24)

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
| **Build — M0 service core (m0-02→m0-06)** | ✅ BUILT + independently verified green (74 unit + 62 IT). Local commits only (see §6). |
| **Build — rest of M0 (INS frontend, infra)** | ⛔ NOT started. Needs infra (§5). |
| **Build — M1–M4** | ⛔ NOT started. |

**Two things you MUST internalise before writing any more code:**

1. **`main` has moved a lot since this was planned (2026-07-21).** The requirements are
   fine, but the design/backlog cite `file:line` salvage references against the *old*
   main. Before building M1+, do a **reconcile-against-current-main** pass (§4). This is
   the single biggest trap.
2. **The M0 code lives in a local-only repo with no remote.** It's shipped here as a
   git bundle (§6). It cannot be `git clone`d from a remote until someone creates the
   GitHub repo.

---

## 2. What EUDPA-58 is (the re-plan context)

The epic's child tickets were **comprehensively rewritten on 2026-07-21**, inverting ~8
earlier design rulings. A prior delivery existed against the *old* tickets; it is now
**reference only**. This handover is the product of a fresh spec → design → backlog
re-plan against the **rewritten** tickets, plus a start on the build.

The shape you are building toward:

- **Two NEW services.** `trade-imports-ins-frontend` — a net-new "Import Notification
  Service" shell (CDP Node template: sign-in, dashboard, and the address-book UI lives
  here, NOT in `trade-imports-animals-frontend`). `trade-imports-address-book` — a new
  Java/Spring API (modelled on `trade-imports-reference-data`), the system of record for
  addresses, produced by **renaming `trade-imports-operators` in place**.
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
| `operators-address-book-m0.bundle` | git bundle of the M0 service-core build (§6) | The built code |

> These are a **snapshot as of 2026-07-24**. The live working copies are in the (gitignored)
> `workareas/address-book/EUDPA-58/` on the origin machine. Treat these as authoritative for handover.

**How to read them:** start with the spec's `acCoverage` + `blockingGraph`, then
`conflicts-v2.json` `_meta` (the ruling index), then `backlog-v2.json` `increments`.
`design-v2.md` is the deep reference you consult per-increment.

---

## 4. ⚠️ The drift — reconcile before building M1+

Planned 2026-07-21; `main` was pulled 2026-07-24 and had advanced substantially:

- **backend** `d345a38 → 3b702a2`: **`NotificationContentSnapshot` is now on `main`**
  (good — it's the 295 reuse target), plus large gbnag-outbox + replay work.
- **frontend** `6b09da1 → 350af8c`: EUDPA-50 transited-countries, EUDPA-73 search,
  port-of-entry, cancel-amend.
- **tests** `a9fe2aa → 726ab44`: **restructured `ui/` → `flows/` + `page-objects/`** moved
  to repo root, new a11y suites.

**Consequence:** the design-v2 / backlog-v2 `file:line` salvage references for backend,
frontend, and tests are stale. **Before building M1+:**

1. Rebase/merge each parked feat branch onto current `main` (§7).
2. Re-verify the design's backend/frontend/tests reference citations against the new main
   (especially backend `NotificationService`/outbox and the tests `ui/`→`flows/` move).
3. The spec/conflicts and the address-book API contract are **unaffected** (the operators
   service has its own repo; no main churn there).

This is a refresh, not a re-plan — structure, order, and AC coverage all hold.

---

## 5. Blockers that need infra / a decision (not code)

**Infrastructure (someone with DEFRA org access):**

1. **Create `trade-imports-ins-frontend`** (net-new, CDP Node frontend template) — needed
   for M0 increments m0-07…m0-13.
2. **Rename `trade-imports-operators` → `trade-imports-address-book`** on GitHub (keeps
   history), or create it fresh and push the bundle (§6). The service is local-only today.
3. **CI/CD + Dockerhub publishing** for both services (m0-14) — the prerequisite for
   287.AC1's "boot from published images". For **local dev only**, `make docker-compose-dev`
   builds from source, so you can progress without this.

**Residual design risks for UX/BA (recommendations set in conflicts-v2, need sign-off):**

- **cv-048** — country search resolves the typed name → alpha-2 code in the **frontend**
  (adopted). Confirm before M2.
- **cv-044 / 186.AC2** — exact searched-field set (name/townOrCity/postcode/country).
- Soft-delete wire shape (enum internal + derived `deleted` boolean), sum-type class
  layout (dev's call), outbox `addressId` emission (confirm with the Dynamics owner),
  INS port (3002 assumed).

---

## 6. The M0 service core — what's built, and how to get it

Built **in place** in `trade-imports-operators` (deferring only the repo/package rename).
Five atomic commits on top of the old-delivery baseline `e15f832`, each TDD, each
independently verified:

| SHA | Increment |
|---|---|
| `1326dce` | m0-02 — Jackson snake_case → camelCase (cv-001) |
| `4a2ab38` | m0-03 — reshape `Operator`→`Address`, untyped, `countryCode`, org-keyed index |
| `550c023` | m0-04 — org-path controller + cv-040 authorise-header-vs-path-`orgId` → 404 |
| `a3dc411` | m0-05 — POST create + mixed validation (`@Null` type/role, `@Email`) |
| `a4211a4` | m0-06 — list + `@Value` config page-size + exclude soft-deleted |

**Independently verified:** `mvn clean verify` at `a4211a4` = **74 unit + 62 IT, BUILD
SUCCESS**. (Count is down from the 82+67 baseline because the reshape deleted the
typed/transporter/crn surface and its tests.)

**Note:** only the *model* was renamed (`Address`/`AddressStatus`); the
controller/service/mapper/request/response classes are still `Operator*`. The full class
rename rides the repo/package rename (increment m0-01).

**To get this code (it has no remote):**
```
git clone operators-address-book-m0.bundle trade-imports-address-book
cd trade-imports-address-book
git checkout feat/EUDPA-58-address-book   # tip a4211a4
```
When the real GitHub repo exists, `git remote set-url origin <new-repo>` and push.

---

## 7. Branch / state map

| Repo | Branch now | Feat tip (M0/prior work) | Note |
|---|---|---|---|
| `trade-imports-operators` | `feat/EUDPA-58-address-book` | `a4211a4` | **No remote** — local-only. M0 service core. Shipped as the bundle. |
| `trade-imports-animals-frontend` | `main` (350af8c) | `feat/…` tip `d3d85b5` | Switched to main 2026-07-22 for other work; feat commits unpushed, safe. |
| `trade-imports-animals-backend` | `main` (3b702a2) | `feat/…` tip `54f9f3f` | Same. |
| `trade-imports-animals-tests` | `main` (726ab44) | `feat/…` tip `7fcd979` | Same. |
| `trade-imports-ins-frontend` | — | — | Does not exist yet (§5.1). |

To resume the journey-side work (M3+), `git checkout feat/EUDPA-58-address-book` in
frontend/backend/tests, **then reconcile onto main (§4)**. Nothing is pushed anywhere —
all feat work is local to the origin machine (that's why the operators code is bundled).

---

## 8. Build plan — order of work

Blocking graph (from the spec): **287 → {286, 186} → 294 → 293 & 295**, with 286.AC8
gated behind 295. Milestones in `backlog-v2.json`:

- **M0 (287)** — skeleton: both services + stack wiring + CI/CD + list + add + POST + sign-in + nav.
  *Service core (m0-02→m0-06) DONE.* Remaining: m0-01 repo rename, m0-07→m0-13 INS frontend, m0-14 CI/CD, m0-15 workspace PR.
- **M1 (286)** — view/edit/delete + by-id/PUT/DELETE endpoints.
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
- **Stack:** `make docker-compose-dev` (or `tim docker dev`) builds the 6 repo-backed
  services from local source with hot-reload. Add the two new services to `docker/stack`,
  the dev overlay, the `make setup` clone list, and the CLAUDE.md repo map (that's m0-15).
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
