# EUDPA-58 Address Book — Design v2

Single coherent design for the address-book programme, assembled from the five
candidate sections and finalised against the 2026-07-21 spec gate. Authority is
`spec/address-book-spec-v2.json` and `spec/conflicts-v2.json` (all decisions
RULED/superseded/carried-forward, 0 open). Every ruling below is designed **to**,
never re-opened. Reference code is on `feat/EUDPA-58-address-book` under `repos/*`;
every salvage claim is grounded in file:line.

The API contract is a **separate deliverable**: `design/api-contract-v2.yaml`
(OpenAPI 3.0.3). Section 5 is the pointer + the two mechanism reconciliations that
distinguish v2 from the candidate.

---

## 0. Overview

### 0.1 What ships

The address book is delivered as **two new services plus a workspace PR** — never
one:

- **`trade-imports-address-book`** — the org-owned, untyped system of record for
  Standard Address Block records. Produced by **renaming `trade-imports-operators`
  in place** (cv-003), Java/Spring Boot + Mongo, **no messaging** (the
  reference-data shape).
- **`trade-imports-ins-frontend`** — the net-new Import Notification Service
  front-door (CDP Node template, cv-003) that hosts the whole address-book CRUD UI
  and a Dashboard link. It does **not** absorb animals-frontend.
- **The workspace wiring PR** (`trade-imports-animals-workspace` + tests repo) that
  declares both services, renames the operators wiring to address-book (cv-042), and
  boots them from published images (287.AC1).

The **notification journey** (animals-frontend + animals-backend) is reshaped from
copy-on-select to **reference + resolve-on-read** (cv-012), with a deleted-address
submit gate (293), a freeze-on-submit snapshot (295), and the EUDPA-198 model trim
(drop `addressLine3`).

### 0.2 Milestones (see `backlog-v2.json`)

| M | Ticket(s) | Scope |
|---|---|---|
| M0 | EUDPA-287 | Both services stood up, stack wiring, CI/CD publish, list + add + POST + sign-in + nav |
| M1 | EUDPA-286 | View / edit / delete — by-id GET, full-replace PUT, soft-DELETE + the deleted flag |
| M2 | EUDPA-186 | Server-side `?q=` search over the address book |
| M3 | EUDPA-294 (+198) | Reference + resolve-on-read; journey select pages; drop `addressLine3` |
| M4 | EUDPA-293 + 295 | Deleted-address submit gate + freeze-on-submit (validate-then-freeze) + 286.AC8 |

### 0.3 Load-bearing rulings honoured

camelCase wire (cv-001); org-path `/organisation/{orgId}/addresses` with the API
**authorising** the caller session-org against the path orgId, 404 on mismatch
(cv-010/cv-040); `countryCode` ISO alpha-2 stored-as-given (cv-011); reference +
resolve-on-read, not copy (cv-012); transporter deferred out of the book (cv-013);
untyped, `OperatorType` deleted (cv-017); rename operators→address-book in place
keeping history + wiring rename to `TRADE_IMPORTS_ADDRESS_BOOK_URL`/mongo db, port
8089 + `Trade-Imports-Organisation-Id` header kept (cv-003/cv-042); ins-frontend
net-new (cv-003); operator→address/consignment-party rename (cv-015); regex `$or`
search not `$text` (cv-047); country name→code resolution before search (cv-048);
mixed validation — reject stray type/role 400 + email format, phone/countryCode
unvalidated (cv-044); PUT full-replace, soft-delete by-id-resolves-deleted (286.AC7);
freeze reusing `NotificationContentSnapshot`, validate(293)-then-freeze(295)
(cv-012); EUDPA-198 model already realised except DROP `addressLine3` (cv-029).

### 0.4 Corrections applied in this finalisation

Two design-honours-rulings reconciliations and one contract fix change behaviour
vs the candidate; the rest are file:line corrections.

- **cv-044 mechanism reconciled (major).** The candidate api-contract set
  `additionalProperties: false` on `AddressRequest` and said "any unknown property is
  rejected 400", which **contradicts** service.md §7's narrow mechanism and does not
  match cv-044 (which mandates rejecting a stray `type`/`role` **only**, plus email
  format). `additionalProperties: false` also produces a Jackson deserialization
  failure, not the per-field bean-validation `errors` map that 287.AC13 requires, and
  would 400 a benign edit PUT that echoes readOnly fields from a prior GET. **Resolved
  to the narrow `@Null`-component mechanism as the single source of truth** (service.md
  §7 / §2.7): `type` and `role` are modelled as explicitly-rejected properties; any
  other unknown / server-assigned field is silently ignored (Zalando,
  `failOnUnknownProperties(false)`). `api-contract-v2.yaml` drops
  `additionalProperties: false` and models `type`/`role` as `enum: [null]` properties.
- **cv-048 placement pinned (major).** The candidate api-contract exposed only a `q`
  param and said the **server** resolves the country name, while service.md §9 and the
  backlog recommend **FE-resolve (option A)** — the FE maps the name to a code and
  passes an extra `countryCode` term, keeping the backend Mongo-only with no
  reference-data client. **Pinned to FE-resolve (A):** `api-contract-v2.yaml`
  now carries `q` **and** an optional `countryCode` query term; the server ORs `q`
  over name/townOrCity/postcode with the resolved `countryCode` over the stored code.
  cv-048 is `needsHuman: true` — the FE-vs-backend placement is surfaced as a residual
  (Section 7) for UX confirmation.
- **countryCode presence constraint (contract).** `AddressRequest.countryCode` gains
  `minLength: 1` (matching the other six mandatory strings and Java `@NotBlank`). This
  is a **presence** constraint tied to `mandatory: true`, NOT a format/list/length
  check — it does not re-open cv-011/cv-044. No `maxLength`/pattern on countryCode
  anywhere (stored as given).
- **Salvage-reality file:line fixes.** topology §4a/§5 `publish.yml:32`→**:31**;
  topology §5 INS Defra ID config `config.js:175-226`→**:175-244**; service §2/§2.1
  country Javadoc `:16-19`→**:16-20**; service §10 "five handlers"→**"six handlers"**;
  ins-frontend §9 `mapOperatorRow.type (list/controller.js:71,74)`→**:73**.

---

## 1. Topology, workspace wiring, CI/CD & INS bootstrap (EUDPA-58)

Design-to-spec for the two-service split, the EUDPA-287.AC1 workspace PR, per-repo
image publishing, the cv-042 wiring renames, and the INS front-door (sign-in + nav).
Authority: `notes.topology`, `journeyIntegration.ji-workspace-wiring`,
`journeyIntegration.ji-cicd-publish`, `pages.ins-signin`, `pages.ins-shell-nav`;
cv-003, cv-040, cv-042.

### 1.1 Two-service topology

The address book ships as two new services plus a workspace PR — never one. The
system-of-record and its UI are deliberately separated so the address book becomes a
shared front-door concern, not an animals-frontend feature.

**`trade-imports-address-book` — system of record (Java / Spring Boot + Mongo)**

- Produced by renaming `trade-imports-operators` in place (cv-003): evolve the
  service, keep git history. Repo already on `feat/EUDPA-58-address-book`.
- Placement modelled on `trade-imports-reference-data` (`notes.topology`
  "referenceDataShape"): a `profiles: [backend]` Spring Boot + Mongo service with **no
  messaging**. ref-data `pom.xml` has no sqs/sns/kafka/asb (grep clean) — it is the
  correct shape to copy, not the animals-backend (outbox/SNS). The book depends only on
  `mongodb` — the ref-data stanza (`backend.compose.yml:73-106`, `depends_on: mongodb`
  at `:78`).
- Container shape already matches ref-data: same four-stage Dockerfile
  (`build`/`development`/`dev-run`/`production`, operators `Dockerfile:9,35,66,96` vs
  ref-data `Dockerfile:10,36,67,97`). The `dev-run` stage (operators `Dockerfile:89`)
  is what the dev overlay binds to, so hot-reload works unchanged after the rename.
- **Port stays 8089**, header stays `Trade-Imports-Organisation-Id` (cv-042). The
  service compose already binds `8089`/`PORT: 8089`
  (`repos/trade-imports-operators/compose.yml:38,48`).
- **Trust boundary (cv-040):** the API takes `orgId` in the path and **authorises** the
  caller's forwarded session-org against it, 404 on mismatch. The path is never
  trusted alone. `IdentityHeaderFilter`'s role changes from "crn-required-everywhere"
  to "authorise header-org == path-org".

**`trade-imports-ins-frontend` — Import Notification Service front-door (Node.js)**

- Net-new (cv-003), bootstrapped from the CDP Node.js frontend template. It hosts the
  address-book UI and offers a Dashboard link (Dashboard content out of scope).
  animals-frontend keeps the journey select/review/submit pages.
- Placement modelled on `trade-imports-animals-frontend`: a `profiles: [frontend]`
  hapi service behind `redis`, signing in through the Defra ID stub, health at
  `/health`. New host port **3002** (3000 = frontend, 3001 = admin, 3007 =
  defra-id-stub are taken).
- Salvages the address-book UI + clients out of animals-frontend (see §1.5): the
  `src/server/address-book/*` controllers/views, `operators-client.js`,
  `operator-schema.js`, `operator-countries.js`, the `auth.js` org-claim mapping
  (MIRROR not move) and the `build-navigation.js` pattern.

**Deferred: `trade-imports-ins-backend`** — not built. INS calls the Address Book
API directly (`notes.topology`). No BFF this scope.

```
                       Defra ID stub (OIDC)         host :3007  profiles[stubs]
                              ▲  sign-in / org claim (currentRelationshipId)
                              │
   ┌──────────────────────────┼───────────────────────────────────────────────┐
   │ FRONTEND tier profiles[frontend]                                          │
   │  animals-frontend :3000 ─┤   ins-frontend :3002 (NET-NEW)                  │
   │   journey select/review/ │    ├─ /  Dashboard (out of scope content)       │
   │   submit; repoints party │    └─ /address-book  list/add/view/edit/delete  │
   │   select pages to ────────┐   │      (salvaged from animals-frontend)       │
   │   the Address Book API    ││  │  auth: Defra ID stub (mirrored auth.js)     │
   └───────────────────────────┼┼──┼─────────────────────────────────────────────┘
                    orgId in   ││  │ Trade-Imports-Organisation-Id header
                    path +     ▼▼  ▼ (authorised vs path orgId, 404 on mismatch)
   ┌───────────────────────────────────────────────────────────────────────────┐
   │ BACKEND tier profiles[backend]                                             │
   │  animals-backend :8085   reference-data :8086   address-book :8089         │
   │   (outbox→SNS, floci)     (Mongo, no msg)        (RENAMED from operators;   │
   │        │                        │                 Mongo, NO messaging)       │
   │        └── resolve party ───────┼──── /organisation/{orgId}/addresses ◄─────┘
   │            addressId (294)       │      system of record for addresses
   └──────────────────────────────────┼────────────────────────────────────────┘
                                       ▼
                              mongodb :27017  (db: trade-imports-address-book)
                              seeded via tests repo 30-address-book-seed.js
```

The load-bearing shape: address-book sits **beside reference-data** in the backend
tier (Mongo-only, no messaging); ins-frontend sits **beside animals-frontend** in the
frontend tier (redis + Defra ID stub); the animals-frontend journey becomes a
**client** of the Address Book API for party resolution while INS is the **CRUD
owner** of the book.

### 1.2 cv-042 wiring renames (operators → address-book)

Every operators-named wiring string is renamed to the service, **keeping port 8089 and
the `Trade-Imports-Organisation-Id` header** (cv-042, Option 1):

| Wiring | Today | After rename |
|---|---|---|
| Env var (backend→book) | `TRADE_IMPORTS_OPERATORS_URL` (`backend.compose.yml:20`) | `TRADE_IMPORTS_ADDRESS_BOOK_URL` |
| Env var (INS→book) | `TRADE_IMPORTS_OPERATORS_URL` (`frontend.compose.yml:49`) | `TRADE_IMPORTS_ADDRESS_BOOK_URL` on the **ins-frontend** stanza |
| Mongo db | `trade-imports-operators` | `trade-imports-address-book` (mirrors ref-data `MONGO_DATABASE`, `backend.compose.yml:85`) |
| Seed file | `seeds/mongodb/30-operators-seed.js` (tests repo) | `seeds/mongodb/30-address-book-seed.js` |
| Image name | `defradigital/trade-imports-operators` | `defradigital/trade-imports-address-book` |
| Port | 8089 | **8089 (unchanged)** |
| Identity header | `Trade-Imports-Organisation-Id` | **unchanged** |

The two files dirty in the working tree (`backend.compose.yml`, `frontend.compose.yml`)
become the `TRADE_IMPORTS_ADDRESS_BOOK_URL` edits inside the AC1 PR.

### 1.3 EUDPA-287.AC1 — the workspace PR

A separate PR in the workspace repo adding **both** services. Unmeetable until CI has
published images (§1.4) — chicken-and-egg pinned in ji-cicd-publish.

- **`backend.compose.yml`** — add address-book (sibling of ref-data `:73-106`):
  `profiles: [backend]`, `depends_on: mongodb` (no floci-init), `PORT=8089`,
  `SPRING_PROFILES_ACTIVE=local`, `MONGO_DATABASE=trade-imports-address-book`,
  `AWS_EMF_AGENT_ENDPOINT=http://host.docker.internal:4566` (no MDM/trade-platform
  block), health curl `:8089/health`, `image:
  defradigital/trade-imports-address-book`, `ports: ['8089:8089']`. Flip
  animals-backend `TRADE_IMPORTS_OPERATORS_URL` (`:20`) → `TRADE_IMPORTS_ADDRESS_BOOK_URL`.
- **`frontend.compose.yml`** — add ins-frontend (sibling of animals-frontend):
  `profiles: [frontend]`, `depends_on: redis`, `PORT=3002`,
  `SESSION_CACHE_ENGINE=redis`, `TRADE_IMPORTS_ADDRESS_BOOK_URL`, its **own**
  `DEFRA_ID_*` block (`DEFRA_ID_REDIRECT_URL=http://localhost:3002/auth/sign-in-oidc`
  etc., pattern at `frontend.compose.yml:50-53`), `wget` health, image, `3002:3002`.
  Flip animals-frontend `TRADE_IMPORTS_OPERATORS_URL` (`:49`).
- **`dev.compose.yml`** — both get a dev overlay: address-book (Java) mirrors ref-data
  (`:54-60`, `target: dev-run`, `src` mount, `image: ''`); ins-frontend (Node) mirrors
  animals-frontend (`:2-8`, `target: development`, `src` mount, `wget` health).
- **`Makefile`** — `REPOS` (`:2`) +2; `JAVA_REPOS` (`:5`) +1 (address-book);
  `NODE_REPOS` (`:4`) +1 (ins-frontend).
- **`CLAUDE.md`** — two repo-map rows after the ref-data/defra-id-stub rows (`:55-56`).
- **Mongo seed** — via the tests repo (same branch name): rename
  `30-operators-seed.js` → `30-address-book-seed.js`, retarget db, drop `operatorType`
  (untyped, cv-017). Never put seed data in `docker/stack`; never edit
  `docker/stack/.staged/` (banned, generated).

### 1.4 Per-repo CI/CD image publishing (ji-cicd-publish — the AC1 prerequisite)

The workspace PR's `image:` references are unmeetable until each repo publishes. Both
carry the branch-tag parity mechanism (rule 2).

- **address-book**: the main publish uses `DEFRA/cdp-build-action/build@main`
  (`repos/trade-imports-operators/.github/workflows/publish.yml:31`), which derives the
  image name from the **repo name** — renaming the GitHub repo renames the
  `:latest`/release image automatically. Keep `publish.yml` + `publish-hotfix.yml`.
  **Gap:** operators has **no** `publish-branch.yml` (workflows are
  `check-pull-request.yml`, `publish-hotfix.yml`, `publish.yml`, `sonarcloud.yml`).
  reference-data has one (`publish-branch.yml:15,17`, `image-name:
  trade-imports-reference-data`) — **add the equivalent** with `image-name:
  trade-imports-address-book`.
- **ins-frontend** (net-new, no pipeline): add the full set copied from
  animals-frontend — `publish.yml`, `publish-branch.yml` (`image-name:
  trade-imports-ins-frontend`), `check-pull-request.yml`.
- **Ordering gate:** CI publishes first, then the workspace PR sets `image:`.

### 1.5 Component salvage vs rebuild (topology)

| Component | Source (file:line) | Decision | Notes |
|---|---|---|---|
| Repo shell (address-book) | `repos/trade-imports-operators` | salvage-modified | rename-in-place, keep history (cv-003) |
| Backend Dockerfile (4-stage) | operators `Dockerfile:9,35,66,96` | salvage | mirrors ref-data; no change for hot-reload |
| Backend messaging shape | ref-data `pom.xml` (grep clean) | salvage (template) | copy the no-messaging ref-data shape |
| Backend main publish CI | operators `publish.yml:31` (cdp-build-action) | salvage | image auto-renames with the repo |
| Backend branch publish CI | ref-data `publish-branch.yml:15,17` | new | operators lacks it; `image-name: trade-imports-address-book` |
| INS repo | CDP node frontend template | new | net-new (cv-003) |
| INS CI pipeline | animals-frontend `.github/workflows/*` | new | copy publish/publish-branch/check-pr |
| INS auth (org claim) | frontend `src/plugins/auth.js:45-50` (`organisationId: payload.currentRelationshipId` at `:49`) | salvage-modified | **MIRROR not move** |
| INS Defra ID config | frontend `src/config/config.js:175-244` (`defraId` block) | salvage-modified | INS gets its own `DEFRA_ID_*` env block (cv-042) |
| INS nav | frontend `build-navigation.js:1-21` | salvage-modified | keep Dashboard + Address book; **drop "About"** (`:15-19`) — cv-028 |
| Address-book UI (list/add/view/edit/delete) | frontend `src/server/address-book/*` | salvage-modified | port to INS; strip type column/filter |
| Add "type" page | frontend `src/server/address-book/add/type/*` | rebuild (delete) | untyped (cv-017) |
| Address-book API client | frontend `operators-client.js` | rebuild | snake→camelCase, org-path, hydrating resolve (cv-001/cv-012) |
| Add/edit Joi schema | frontend `operator-schema.js` | salvage-modified | drop type + transporter (cv-013/cv-017); mirror Java validation |
| Country picker | frontend `operator-countries.js` | salvage | GB-prepend over ref-data /countries; store countryCode (cv-011) |
| Backend model (Operator→Address) | operators `Operator.java` | salvage-modified | countryCode not display-name (cv-011); org-key not crn (cv-010); drop operatorType/transporter |
| Backend JSON casing | operators `JacksonConfig` (SNAKE_CASE) | rebuild | flip to camelCase (cv-001) |
| Workspace stack wiring | compose/Makefile/CLAUDE.md | new | the AC1 PR (§1.3) |
| Mongo seed | tests `30-operators-seed.js` | salvage-modified | rename, retarget db, drop operatorType |

### 1.6 INS bootstrap, sign-in & nav (ins-signin, ins-shell-nav)

- **Bootstrap:** CDP Node.js frontend template default (GOV.UK
  header/footer/layout/start page, hapi + redis session, `/health`). Phase-0 of the
  net-new repo is the CDP rails, then the salvaged address-book UI.
- **Sign-in (287.AC2):** mirror animals-frontend exactly — sign in through the Defra ID
  stub (OIDC discovery at `:3007`). **MIRROR (not move)** the org-claim mapping
  `auth.js:45-50` (`organisationId: payload.currentRelationshipId` at `:49`). Copy the
  `defraId` config block `config.js:175-244` into INS with its own `DEFRA_ID_*` env
  (own `DEFRA_ID_REDIRECT_URL` on port 3002). **D23:** a signed-in user always has an
  org — do not build null-org handling. **cv-040:** INS forwards the session org as
  `Trade-Imports-Organisation-Id`; the API authorises it against the path orgId.
- **Nav (287.AC3 / cv-028):** two links — Dashboard and Address book. Salvage
  `build-navigation.js:1-21` but **drop the "About" entry** (`:15-19`). Selecting
  "Address book" opens `/address-book` (path-prefix `current` flag at `:13`).

---

## 2. trade-imports-address-book — service internals

The system-of-record, produced by renaming `trade-imports-operators` in place (cv-003).
Java/Spring Boot + Mongo, no messaging. Salvage-vs-rebuild map; every claim grounded in
`repos/trade-imports-operators`. Verdict: operators is a near-exact structural fit — the
port is mostly rename + delete, with three genuine behaviour changes (Jackson
snake→camel, scope-key crn→organisationId, the new path-vs-session authorisation).

### 2.1 Package / collection rename (cv-003, cv-042)

Rename package `uk.gov.defra.trade.imports.operators` →
`uk.gov.defra.trade.imports.addressbook` in place (git-tracked move). The `operator`
sub-package → `address`. `@Document(collection = "operators")` (Operator.java:30) →
`"addresses"`. Port **8089** and the `Trade-Imports-Organisation-Id` header name kept
(cv-042). Mongo db → `trade-imports-address-book`. One rename commit before any
behaviour change.

### 2.2 The Address document (was `Operator.java`) — SALVAGE-MODIFIED

Source `Operator.java:40-81`.

| Field | Decision | Grounding |
|---|---|---|
| `id` | KEEP | Operator.java:43-44 (`@Id`) |
| `name` | KEEP | Operator.java:48 |
| `addressLine1` / `addressLine2` | KEEP | Operator.java:50-52 |
| `town` → **`townOrCity`** | RENAME | Operator.java:54 |
| `county` | KEEP | Operator.java:56 |
| `postcode` | KEEP | Operator.java:58 |
| `country` (display-name) → **`countryCode`** (ISO alpha-2) | CHANGE | Operator.java:60 + display-name Javadoc :16-20 — reverses c-004 "do not fix" (cv-011) |
| `telephone` → **`phone`** | RENAME | Operator.java:62 |
| `email` | KEEP | Operator.java:64 |
| `crn` | **DELETE** | Operator.java:70 — demoted (cv-010) |
| `organisationId` | KEEP, promote to primary scope key | Operator.java:72 |
| `status` (tombstone) | KEEP | Operator.java:74 |
| `createdAt` / `modifiedAt` | KEEP | Operator.java:76-80 |
| `operatorType` | **DELETE** | Operator.java:46 (untyped, cv-017) |
| `approvalNumber` | **DELETE** | Operator.java:66 (transporter deferred, cv-013) |
| `transporterCategory` | **DELETE** | Operator.java:68 (cv-013) |

**Indexes.** Two `@CompoundIndex` today (Operator.java:31-34): `crn_status_type_created`
→ **DELETE** (lead `crn` and `operatorType` both gone); `org_status` → **PROMOTE** and
extend to `{organisationId: 1, status: 1, createdAt: -1}` — the single index behind
every org-scoped, status-bounded, newest-first read. The `Operator.java:16-20`
display-name Javadoc and the `modifiedAt` "audit only" note carry; the two-index
rationale is rewritten to the single-index reality. Keep the Lombok
`@Data/@Builder/@EqualsAndHashCode(onlyExplicitlyIncluded)` shape. Rename `Operator` →
`Address`.

### 2.3 Jackson naming-strategy flip — snake→camel (cv-001) — SALVAGE-MODIFIED

Source `JacksonConfig.java:22-32`. The single load-bearing wire change. Flip
`PropertyNamingStrategies.SNAKE_CASE` (`:29`) → `LOWER_CAMEL_CASE`, matching ref-data
(`Country.java:15-16`, no override). **Keep `failOnUnknownProperties(false)`** (`:30`)
— server-assigned fields in a body are silently dropped, not rejected (Zalando
default), **except** a stray `type`/`role` which cv-044 says to reject 400 (§2.7).

Consequential deletions once camelCase lands: `OperatorRequest.java:31/35` +
`OperatorResponse.java:24-25` `@JsonProperty("address_line_1"/"_2")` **DELETE** (the
digit-bearing snake edge case no longer exists under camelCase);
`GlobalExceptionHandler.wireFieldName` (`:198-210`) **SIMPLIFY** to a direct field-name
key (drop the `SNAKE_CASE.translate` fallback + bean introspection); the
`IdentityHeaderFilter` `problemWriter` (`:64-67`) and the `SNAKE_CASE` constant (`:49-50`)
go with it.

### 2.4 Controller — org-path + path-vs-session authorisation (cv-010, cv-040) — SALVAGE-MODIFIED

Source `OperatorController.java`. Re-base `@RequestMapping("/operators")` (`:37`) →
`@RequestMapping("/organisation/{orgId}/addresses")`. Every handler gains
`@PathVariable String orgId`. The five operations map 1:1 (list `:83`, create `:118`,
get `:153`, update `:198`, delete `:240`) with `operator`→`address` rename.

**The cv-040 authorisation mechanism (two layers, defence in depth):**

- **`IdentityHeaderFilter` (SALVAGE-MODIFIED, `:50-114`):** keep the
  fail-fast-400-problem+json shape. **Change:** require `Trade-Imports-Organisation-Id`
  on **every** `/organisation/**` request; **DELETE the entire crn branch** (`:52`,
  `:80-84`, `:93` MDC) and the POST-only org-id special case (`:86-90`); path prefix
  (`:57`) → `/organisation`; stash `organisationId` in the MDC. This layer proves an org
  identity is present; it does not compare.
- **Authorisation compare (NEW):** each handler receives `@PathVariable String orgId`
  **and** `@RequestHeader("Trade-Imports-Organisation-Id") String sessionOrg`. If
  `!sessionOrg.equals(orgId)` → throw `NotFoundException` → **404** (not 403 — no
  existence disclosure, oi-cross-org-status/cv-040). Do the compare once in a single
  explicit guard `authoriseOrg(orgId, sessionOrg)` at the top of every handler so it
  reads in the diff. After the guard, scope every repository call by `orgId`.

Delete the `operator_type` request param (`:86`), the `operatorType` log/args (`:89-90`,
`:122`), and the immutability-note Javadoc on `update` (`:163-174`).

### 2.5 Repository (was `OperatorRepository.java`) — SALVAGE-MODIFIED

- `findByIdAndCrn(id, crn)` (`:23`) → **`findByIdAndOrganisationId(id, orgId)`** — the
  by-id fetch that **includes** soft-deleted rows (service, not query, gates deletion),
  so notifications resolve old references (286.AC7 / 294.AC2).
- `search(...)` `@Query` (`:48-58`) re-keyed and narrowed: lead `'crn'` →
  `'organisationId'`; **KEEP** `'status': 'ACTIVE'` (excludes tombstones); **DELETE** the
  `'operatorType': {$in}` clause + the `types` param (cv-017); **NARROW** the `$or` from
  7 fields to the **3** the AC names — `name`, `townOrCity`, `postcode` (186.AC2)
  (country is matched via the FE-resolved `countryCode` term, §2.9), dropping
  `addressLine1`, `addressLine2`, `county`. Keep `$options: 'i'` and the `Pattern.quote`
  feed (ReDoS-safe, cv-047 — regex `$or`, not `$text`).

Result: `Page<Address> search(String orgId, String quotedRegex, String countryCode,
Pageable pageable)`. Org-isolation is **in the query** (`organisationId` lead), not a
post-filter (186.AC5).

### 2.6 Soft-delete tombstone (cv-016) — SALVAGE

The behaviour is exactly right; only the representation is a choice. **Recommendation:
keep the `ACTIVE`/`DELETED` enum** (rename `OperatorStatus`→`AddressStatus`) rather
than a boolean — the query pins `'status': 'ACTIVE'` as a literal and the service reads
`status == DELETED`; a boolean would touch every call site for no behavioural gain. The
wire exposes a derived `deleted` boolean on the response (map `status == DELETED`),
keeping storage/query on the enum. Semantics ported verbatim: `get` returns the row
including DELETED, flagged (`OperatorService.java:139-141`); `delete` flips
status→DELETED, idempotent (`:209-222`); list/search exclude DELETED via the query
literal.

### 2.7 Validation (cv-044, "mixed") — SALVAGE-MODIFIED — **single source of truth**

Port `OperatorRequest` → `AddressRequest`, keeping the Bean Validation annotations for
the mandatory + max-length rules (already the V4 table): `@NotBlank`+`@Size(255)` name,
`@Size(255)` addressLine2, `@NotBlank`+`@Size(255)` addressLine1,
`@NotBlank`+`@Size(100)` town→townOrCity, `@Size(100)` county, `@NotBlank`+`@Size(12)`
postcode, `@NotBlank`+`@Size(20)` telephone→phone, `@NotBlank`+`@Email`+`@Size(254)`
email (`OperatorRequest.java:28-54`).

- `country` (`:45-47`) → `countryCode`: **`@NotBlank` only**. No `@Size`, no list
  validation, no ISO pattern — stored-as-given (cv-011). `@NotBlank` is a **presence**
  guard (maps to the contract `minLength: 1`), not a format check.
- `phone` — `@NotBlank`+`@Size(20)` only; **not** format-validated (cv-044).
- `email` — **KEEP `@Email`** (cv-044 explicitly retains it).

**DELETE:** `operatorType` + `@NotNull` (`:27`); `approvalNumber` + `transporterCategory`
(`:55-57`); `@ValidTransporterFields` (`:24`) and **both** validator files
(`ValidTransporterFields.java`, `TransporterFieldsValidator.java`) — the c-007
transporter rule set (cv-013); the `operatorType`-immutability reject in `update`
(`OperatorService.java:171-174`).

**Reject a stray `type`/`role` — the narrow mechanism (cv-044), single source of truth.**
`failOnUnknownProperties(false)` would silently *drop* an incoming `type`/`role`; cv-044
wants a **per-field 400**. A blanket `failOnUnknownProperties(true)` /
`additionalProperties: false` would also reject benign server-assigned fields (breaking
the Zalando ignore-server-fields rule) and produce a deserialization failure, not the
per-field `errors` map 287.AC13 requires. So target it **narrowly**: declare `type` and
`role` as explicit `@Null`-constrained components on `AddressRequest`
(`@Null(message="...")`), so a supplied value lands in the same Bean-Validation `errors`
map keyed `type`/`role`, while genuinely-unknown / echoed-readOnly fields stay ignored.
This routes through the existing `MethodArgumentNotValidException` handler
(`GlobalExceptionHandler.java:59-83`) with no new error shape. **`api-contract-v2.yaml`
matches exactly** — `AddressRequest` has NO `additionalProperties: false`, and `type`/
`role` are `enum: [null]` properties (Section 5).

**PUT full-replace (286.AC7).** Port `OperatorService.update` (`:164-191`) minus the
immutability check: `findByIdAndOrganisationId`, filter out DELETED → 404, set every
mutable field — an omitted optional (`addressLine2`, `county`) is **cleared**, not
preserved (the request record carries `null` for an absent optional and the setter
writes it through). Save bumps `modifiedAt`.

`OperatorMapper` (SALVAGE-MODIFIED): drop the four deleted fields from `toResponse`/
`toEntity`; rename. `OperatorResponse` compact-constructor null-guards keep for
always-present fields (countryCode still guarded as mandatory), drop the deleted-field
guards. `OperatorPageResponse` (camelCase now) ports verbatim →
`AddressPageResponse`.

### 2.8 Config page-size 25 (cv-025) — SALVAGE-MODIFIED

Source `OperatorService.java:33,79-107`. Re-rule page size to a server-side config
property, default 25, not a query param (b-config-page-size), mirroring animals-backend
`notification.list.page-size`: inject `@Value("${address-book.list.page-size:25}") int
pageSize`; drop the `pageSize` method arg + the `page_size` param + `MAX_PAGE_SIZE` range
guard. Keep `page` as the only pagination query param (1-based →
`PageRequest.of(page-1, pageSize, Sort.by(DESC, "createdAt"))`); keep the `page < 1` →
`BadRequestException` guard.

### 2.9 Server-side `?q=` search with country name→code resolution (cv-047, cv-048) — SALVAGE-MODIFIED + one new step

The regex `$or` mechanism ports (cv-047). The narrowing to 3 raw fields is §2.5. The
new part is cv-048: a user typing a country **name** ("France") must match a stored
**code** ("FR").

**Placement — PINNED to FE-resolve, option (A).** The address-book service is modelled
on reference-data and has **no outbound HTTP client**. Two placements were possible:
(A) resolve in ins-frontend and pass a resolved param, or (B) add a reference-data
`/countries` client to the backend. **Adopted (A):** ins-frontend already loads the MDM
country list for the picker (`operator-countries.js`), so it maps a country-name hit in
`q` to its code and sends it as the **optional `countryCode` query term**. The API ORs
the raw `q` (over name/townOrCity/postcode) **and** the resolved code (over the stored
`countryCode` field). This keeps the backend Mongo-only (preserves the ref-data shape)
and puts the MDM dependency where the list already lives. **`api-contract-v2.yaml`
carries both `q` and `countryCode` params** (Section 5). cv-048 is `needsHuman: true` —
placement surfaced as a residual (Section 7).

### 2.10 GlobalExceptionHandler + problem+json — SALVAGE

The RFC-9457 machinery ports verbatim: the two 400 shapes (`ValidationProblem` with an
`errors` map vs bare `Problem`), the CDP problem-family type URIs, the `traceId`
extension (camelCase now, cv-001), and the **six handlers** (validation `:59`,
service-validation `:91`, type-mismatch `:113`, bad-request `:130`, not-found `:143`, 500
`:159`). The `NotFoundException` handler now also serves the cv-040 cross-org 404 and the
unknown-id 404 — same shape, no existence leak. The only change is the `wireFieldName`
simplification under camelCase (§2.3).

### 2.11 Testcontainers ITs — SALVAGE-MODIFIED

`IntegrationBase` (Mongo 7.0 `MongoDBContainer` + replica set, RANDOM_PORT, MockMvc,
`integration-test` profile) ports verbatim (`:26-37`). IT bodies re-key crn→org and drop
typed/transporter cases. **`OperatorScopingIT` → `AddressScopingIT` (load-bearing
rewrite):** today it asserts crn scopes reads, organisationId stored-but-not-used; the
re-scope **inverts** that — `organisationId` scopes every read, crn is gone. Rewrite to:
org B cannot see or reach org A's address (byte-identical 404), **plus a new cv-040
test** — a caller whose `Trade-Imports-Organisation-Id` header disagrees with the path
`orgId` gets 404. Validation/compliance ITs drop the `@ValidTransporterFields`/
`operatorType` cases and **add** the stray-`type`/`role`-rejected-400 case + the
`@Email`-retained / phone-and-countryCode-unvalidated cases (cv-044).

### 2.12 Files to DELETE (net)

`OperatorType.java` (cv-017); `TransporterCategory.java` (cv-013);
`validation/ValidTransporterFields.java` + `validation/TransporterFieldsValidator.java`
+ its test (cv-013); the `crn` field + `crn_status_type_created` index + all crn logic
(cv-010/cv-040); the `operator_type` param + type `$in` + the `operatorType`-immutability
reject (cv-017); the two `@JsonProperty("address_line_*")` overrides + the
`wireFieldName` introspection scaffolding (cv-001). Everything else (CDP infra config,
the problem+json family, auditing timestamps, the Testcontainers harness) ports as-is.

---

## 3. trade-imports-ins-frontend

Net-new Node.js front-door hosting the whole address-book UI. Bootstrapped from the CDP
Node template; modelled on animals-frontend, not absorbing it. All address-book UI is
salvaged from the delivered animals-frontend build, rewritten for the camelCase wire,
the untyped model, and the `address`/`consignment party` vocabulary. The journey stays
in animals-frontend (Section 4).

### 3.1 Repo bootstrap (net-new, cv-003)

New repo from the CDP Node.js frontend template — Hapi + nunjucks + govuk-frontend.
Phase 0 is the CDP scaffold + `.claude/`/CLAUDE.md rails. CI/CD publish is a
prerequisite (ji-cicd-publish, §1.4). Workspace wiring is the separate PR
(ji-workspace-wiring, §1.3). **Config** (`config.js`): rename the operators block
`tradeImportsOperatorsApi` (`config.js:344-351`) → `tradeImportsAddressBookApi`, env
`TRADE_IMPORTS_OPERATORS_URL` → `TRADE_IMPORTS_ADDRESS_BOOK_URL`, keep default port 8089
(cv-042). Add the `defraId` block (mirror `config.js:175-244`).

### 3.2 Sign-in + org-claim mapping (ins-signin, 287.AC2, cv-010)

**MIRROR, do not move**, the Defra ID bell strategy from `src/plugins/auth.js:40-51`:
`profile.crn = payload.contactId` (`:47`); `profile.organisationId =
payload.currentRelationshipId` (`:49`). Salvage the whole `auth.js` bell strategy +
`src/server/auth/controller.js` (signin/signinOidc/signout/signoutOidc) verbatim;
session cache spreads `...profile` onto `credentials` (`auth/controller.js:46-53`), so
downstream reads `request.auth.credentials.organisationId` directly. Stub OIDC discovery
at `:3007`; keep the single-origin rule (`host.docker.internal` end-to-end). **D23:** a
signed-in user always has an org — build no null-org handling. **Salvage: verbatim.**

### 3.3 Navigation (ins-shell-nav, 287.AC3, absorbs 185.AC1/AC2, cv-028)

Salvage `build-navigation.js:4-20` (Dashboard / Address book / About). **Drop the
`About` link** — the shell has exactly two links: `Dashboard` (target out of scope) and
`Address book` (`current` flag via `path.startsWith('/address-book')`, already at
`build-navigation.js:13`). **Salvage: modified.**

### 3.4 API client — REWRITTEN to camelCase (cv-001, cv-040, cv-042)

Salvage `operators-client.js:111-156` **structure** (fetch + `throwOnError` +
`mapApiErrorsToFormErrors`) but this is the most-rewritten component. Rename →
`address-book-client.js`.

| Delete / change | Evidence | Why |
|---|---|---|
| `FIELD_MAP`, `wireToForm`, `toApiOperator`, `fromApiOperator` | `operators-client.js:10-71` | camelCase wire (cv-001) — pass through |
| `toNotificationOperator`, `toTransporter` | `:80-109` | journey-side mappers — belong to animals-frontend |
| Path `…/operators…` → `…/organisation/{orgId}/addresses…` | `:167,201,226,254,281` | org-path REST (cv-010) |
| `operator_type` query param | `:172-174` | untyped (cv-017) |
| Forward `Trade-Imports-Organisation-Id` on **every** call | today only `createOperator` (`:232`) | cv-040 |

List controller reads camelCase (`pageSize`/`totalItems`/`totalPages` + `items`, `page`;
today `list/controller.js:120-123` reads snake). Keep `throwOnError` +
`mapApiErrorsToFormErrors` (mapping becomes identity on the key). Method renames
list/get/create/update/delete-Address; signatures gain `orgId` (from identity).
**Salvage: rebuild.**

### 3.5 Field-name renames

| delivered | ruled | evidence |
|---|---|---|
| `city` | `townOrCity` | `operator-schema.js:54`, `list/controller.js:61`, `view/controller.js:36` |
| `telephone` | `phone` | `operator-schema.js:75`, `view/controller.js:50` |
| `country` (display-name) | `countryCode` (ISO alpha-2, stored-as-given) | `operator-schema.js:67-74`, cv-011 |

The picker option **value** becomes the alpha-2 `code`, not the `name` (cv-011).

### 3.6 Add page — type-selection page REMOVED (cv-017)

**DELETE** `src/server/address-book/add/type/` (`controller.js:34-64` builds the
7-value `OPERATOR_TYPES` radio) + `constants/operator-types.js`. Collapse to a single
add page: `GET /address-book/add` renders the details form directly; `POST
/address-book/add` validates + creates. Remove the `/add/details` sub-route and the
`operator_type` query-param guard (`add/details/controller.js:53-57`). Drop
`operatorType`/`isTransporter` from the view model. Banner copy `"${value.name} operator
added"` → `"${value.name} added to your address book"`. **Salvage: `add/details`
modified; `add/type` deleted.**

### 3.7 Address schema — Joi, untyped, single-source parity (cv-013/017/023/044)

Salvage `buildOperatorSchema` (`operator-schema.js:25-113`) → `buildAddressSchema`.
**Delete** the `operatorType` field (`:33-40`) and both transporter branches
`approvalNumber`/`transporterCategory` (`:91-110`). Rename `city`→`townOrCity`,
`telephone`→`phone`; max-lengths/mandatory unchanged (the V4 table).
`country`→`countryCode`: `Joi.valid(...mdmCodes)` over the alpha-2 **codes**, keep
required; email keeps format validation, phone stays format-unvalidated (cv-044); the
picker enforces `countryCode` membership on the FE, the API stores-as-given (cv-011).
Keep the empty-list throw (`:26-30`) — a missing MDM list is an outage. **Add the
`b-single-source-validation` parity/convention test** asserting identical field
maxLengths + mandatory flags across this Joi schema and the Java Bean Validation
(countryCode mandatory on both sides ↔ contract `minLength: 1`). **Salvage: modified.**

### 3.8 Country picker (cv-011)

Salvage `getOperatorFormCountries` (`operator-countries.js:15-28`) →
`getAddressFormCountries`. GB-prepend logic unchanged — the ref-data SPS list omits the
UK, so `{ code: 'GB', name: 'United Kingdom' }` is prepended when absent (`:22-27`),
**throwing** on an empty/failed list rather than degrading (`:18-20`). Strip the stale
`c-004` display-name Javadoc (`:6-12`); the option **value** now binds `code`.
`buildCountryItems` changes `value: name` → `value: code`. **Salvage: modified.**

### 3.9 List page (address-book-list, 287.AC4/6/7, 186, cv-015/017/021/025/026)

Salvage `list/controller.js` + `list/index.njk`.

- **Untyped strip:** remove the `Type` column (`list/index.njk:66,78`) and
  `mapOperatorRow.type` (`list/controller.js:73`); remove the operator-type filter
  `govukSelect` (`list/index.njk:42-50`) + `buildOperatorTypeOptions` +
  `operatorTypeOptions` + the `operator_type` param throughout
  `buildAddressBookListQueryString` (`list/controller.js:46-51`).
- **Columns** Name / Address / Country: the single `Address` column composes
  `addressLine1, townOrCity, postcode` joined by commas (`buildAddressLine` at
  `list/controller.js:57-67`, narrowed); `Country` renders `countryCode`.
- **Search (186, cv-026):** keep the server-side `?q=` GET form; relabel to the ruled
  field set. The server does the OR-match; the FE resolves country name→code and passes
  `countryCode` (Section 4/§2.9). The FE just submits and renders.
- **No-results DISTINCT from empty-state (186.AC4):** split the two zero-result paths —
  empty-state (`totalItems===0` and no `q` → "no addresses yet" + add action) vs
  no-search-results (`totalItems===0` and `q` present → `no addresses match "<term>"`,
  echoing the submitted term, + a clear-search action). Controller passes `hasSearch =
  Boolean(q)`.
- **Pagination (cv-025):** salvage `buildPaginationLinks(...)` → numbered
  `govukPagination`; page size is server config (default 25) — the FE renders
  `pageSize`/`totalPages` it is handed, never hard-codes 25 or sends a size.
- **Success banner (cv-021):** salvage the one-shot flash (clear-on-read) via
  `govukNotificationBanner`. The 287.AC10 "3 seconds" clause is a knowing ruled
  deviation pending AC amendment.
- **Copy rename (cv-015):** operator → address throughout. **Salvage: modified.**

### 3.10 View page (address-view, 286.AC1, cv-024)

Salvage `view/controller.js` + `view/index.njk`. Remove the transporter rows block +
`TRANSPORTER_CATEGORY_LABELS` (`view/controller.js:12-15,54-66`) and the `Type` row
(`:47`). `buildRows` renders Name / Address / Country(`countryCode`) / Telephone(`phone`)
/ Email as a `govukSummaryList` (`:44-52`). Edit → `/address-book/{id}/edit`, Delete →
`/address-book/{id}/delete` (`:101-102`) — routes already key on an id, rename the param
`operatorId`→`id`. **Salvage: modified.**

### 3.11 Edit page (address-edit, 286.AC2/3/4, cv-021/023)

Salvage `edit/controller.js` + `edit/index.njk`. Same field set as add, prefilled from
`getAddress` (`:73-85`). Drop `operatorType`/`isTransporter` (`:52-53,90,103`); rename
fields (§3.5); PUT is **full-replace** — omitted optionals cleared (286.AC7). Cancel
returns to the list without saving (`:99-101`). Success banner on save. Same
`buildAddressSchema`. **Salvage: modified.**

### 3.12 Delete page (address-delete-confirm, 286.AC5, cv-024)

Salvage `delete/controller.js` + `delete/index.njk` almost verbatim — already a two-step
confirmation interstitial; the soft delete is never reached without the confirmation POST
(`:29-33`). Cancel → details no-op (`:71-72`); Confirm → `deleteAddress` → list + deletion
banner (`:78-86`). Field/param renames + copy operator→address; `PAGE_TITLE` "Delete
operator"→"Delete address". **Salvage: verbatim-modified (copy only).**

### 3.13 Routes (index.js)

`GET /address-book` → list; `GET /address-book/add` → add form (was the type page),
`POST /address-book/add` → validate + create (drop `/add/details` and the type routes);
`GET /address-book/{id}` → view; `GET|POST /address-book/{id}/edit` → edit; `GET|POST
/address-book/{id}/delete` → delete. Rename the route param `operatorId`→`id` and drop the
`add/type` import (`index.js:2`). **Salvage: modified.**

### 3.14 Salvage summary (INS)

| Component | Decision | Source |
|---|---|---|
| Repo scaffold | new | CDP node template |
| Bell strategy + auth controller | salvage | `auth.js:40-51`, `auth/controller.js` |
| Navigation | salvage-modified | `build-navigation.js:4-20` (drop About) |
| Config block | salvage-modified | `config.js:175-244,344-351` |
| API client | rebuild | `operators-client.js` (structure only) |
| Address Joi schema | salvage-modified | `operator-schema.js:25-113` |
| Country picker | salvage-modified | `operator-countries.js:15-28` |
| List controller + view | salvage-modified | `list/controller.js`, `list/index.njk` |
| Add details page | salvage-modified | `add/details/*` |
| Add type page | delete | `add/type/*` |
| View / Edit / Delete pages | salvage-modified | `view/*`, `edit/*`, `delete/*` |
| Routes | salvage-modified | `index.js` |

---

## 4. Journey changes — EUDPA-294 / 293 / 295 (+ EUDPA-198)

Design for the notification-journey side: the four select pages, reference +
resolve-on-read, the deleted-address submit gate, freeze-on-submit, the EUDPA-198 trim.
Repos: `trade-imports-animals-frontend` (FE) and `trade-imports-animals-backend` (BE).
Load-bearing conflicts: cv-012, cv-014, cv-015, cv-016, cv-029, cv-031, cv-040/cv-042.

### 4.1 The salvage baseline

The delivered build implements a **copy + reference** party model with an
**existence-check-only** detection surface — the v1 shape cv-012/cv-016 supersede. The
reshape is: (a) narrow the party set, (b) replace copy-on-select with a reference + a
new **hydrating** resolve path, (c) move the snapshot from amend-start to submit, (d)
drop `addressLine3`, (e) rename operator→address. The detection surface, submit guard,
review-page rendering and select-by-id are all salvageable.

Key baseline anchors: BE party model copy+reference (`Operator.java:12-19`, six party
fields on `NotificationBase.java:31-41` + `transport.transporter`); read-side detection
values-free (`NotificationService.applyOperatorExistenceCheck` `:148-182`, calls
`classify()` `:159-160`, degrades open `:161-166`, emits keys-only onto
`NotificationResponse` `:44-45`); submit gate fail-closed
(`guardOperatorExistenceForSubmit` `:258-304`); snapshot machinery captures at
amend-start (`:317`), nulls on AMEND→SUBMITTED (`:368-371`), restores on cancel
(`:338-344`); FE select pages read the live API by id
(`consignors/select/controller.js` `:29-33,64-66`, type-filter `:19,:32`, copy via
`toNotificationOperator` `:83`); FE review page surfaces detection
(`notification-view/controller.js:30`, `operator-party-view-keys.js:78-87`); FE
submit-error mapping (`declaration/controller.js:19-36,85-97`).

### 4.2 EUDPA-294 — reference + resolve-on-read (cv-012, cv-014, cv-016)

**Party model: a `reference | inline` sum-type.** A referenceable role holds an
`addressId` reference, not a copied block; current details are resolved on read
(294.AC3/AC5). The `Operator` party keeps `operatorId` (→ conceptually `addressId`) but
its copied value fields stop being the persisted source of truth — populated at read
time by resolution, frozen at submit into the snapshot (§4.5). The sum-type: a role
field is *either* a reference (`addressId` present, resolved on read) *or* inline. The
inline roles are **place of origin** (D24) and **consignment** (D26) — no `addressId`,
never resolved. Discriminator = `StringUtils.isNotBlank(operatorId)` (already used at
`NotificationService.java:205-208`). Single-class-with-optional-`addressId` vs a sealed
pair is the dev's call (cv-012); the invariant is: **no referenceable role persists a
value copy in Draft/Amend**.

**Referenceable set narrows to four (cv-014).** `operatorParties` currently walks seven
(`NotificationService.java:184-197`). Drop `placeOfOrigin` (`:186`), `consignment`
(`:191`) — inline (D24/D26); drop `transporter` (`:192-195`) — deferred (cv-013). Result:
four referenceable roles — **consignor / consignee / importer / destination**. This one
method feeds **both** the read check (`:154`) and the submit guard (`:259`). Trim the
review-page key map (`operator-party-view-keys.js:10-45`) to the four roles.

**Resolve-on-read: repurpose `applyOperatorExistenceCheck` into a hydrator** (294.AC4:
Draft/Amend reflect a later address edit automatically, no trader action, **no
fan-out**). The existing read-side check (`:148-182`) already fires only on DRAFT/AMEND
(`:150-153`), walks the parties, degrades open. Reshape from *classify-only* to
*resolve*: for each referenceable party with an `addressId`, call the new hydrating
method (below) instead of `classify()` (`:160`); on success populate the party's value
fields onto `NotificationResponse` (latest details); **do not write back to Mongo**.
Keep the deleted signal (resolved-but-soft-deleted → `deletedOperatorFields`, cv-016; a
404 stays `unresolvedOperatorFields`). Keep degrade-open on `UNAVAILABLE`. **SUBMITTED is
never resolved** — it reads the frozen snapshot (§4.5); the status guard at `:150-153`
already excludes SUBMITTED.

**A NEW hydrating client method** (values, not a verdict). `OperatorsApiClient.classify()`
(`:43-71`) is deliberately values-free (reads only `status`, class Javadoc `:13-17`). Add
`resolve(addressId) → ResolvedAddress` that GETs the by-id address (including
soft-deleted, flagged) from the Address Book API org-path
`/organisation/{orgId}/addresses/{id}` (cv-040/cv-042, camelCase, forwarding the
session org), returns a values-carrying type **plus** the deleted flag (one call serves
both hydration and the deleted signal), and maps `UNAVAILABLE`/404 to the same distinct
outcomes as `classify`. **Do not** widen `classify` to leak values — add `resolve`
alongside.

**Select-page repoint (FE) — four pages, drop type filter, store a reference.** The four
keep-pages are `addresses/{consignors,consignees,importers,destinations}/select`. Per
page: repoint `operatorsClient.listOperators` at the org-path
`/organisation/{orgId}/addresses` (was `/operators`, `operators-client.js:167`),
camelCase response; drop the type filter (`OPERATOR_TYPE`/`operatorType`); store **just
the `addressId`** into the party (replace `toNotificationOperator(selected)`); org-scope
session-sourced (`request.auth.credentials.organisationId` into the **path**, never a
query string; D23/cv-010; forwarded org authorised vs path orgId, cv-040; header name
cv-042). **Remove** `addresses/place-of-origin/select` and
`addresses/consignment/contact/select` (inline now, D24/D26 — cv-014 inverts the v1
j-002/j-004 mapping) and `transporters/select` (cv-013); their routes/controllers/views/
tests go; the inline entry pages stay as the data source.

**Terminology sweep (cv-015).** "Operator" is retired journey-side:
`deletedOperatorFields`/`unresolvedOperatorFields`, the
`toNotificationOperator`/`fromApiOperator` client names, `OPERATOR_SUBMISSION_ERROR`
copy (`declaration/controller.js:9`), the review-page messages → "address"/"consignment
party". Wide rename riding alongside the functional change.

**Performance: N+1 on list views (cv-012 note).** Resolve-on-read is one Address Book
call per referenced party; a notification *list* view is `N × up-to-4`. Dedupe
resolution **once per distinct `addressId` per request** (extend the existing
`.distinct()` at `:159` to the list path `findAll` `:213-221`). Keep the no-fan-out rule
intact. Measure before a cross-request cache.

### 4.3 EUDPA-198 — drop `addressLine3` (cv-029, cv-030)

The notification model already carries the full Standard Address Block (`Address.java`
`county:18` + `postcode:19`; `Operator` `telephone/email` `:16-17`). The only outstanding
198 delta is removing `addressLine3` (`Address.java:16`, verified present) — a breaking
removal. BE: delete the field + its Lombok builder slot (`@Builder/@AllArgsConstructor`
arity changes); sweep `grep -rn addressLine3` across BE main + test before deleting;
verify no consumer reads it first (cv-029). FE: drop the `address.addressLine3` line in
`formatAddress` (`notification-view-helper.js:42`); county/telephone/email are **already**
rendered (cv-030). The notification `Address` keeps its existing `city`/`country` field
names (198 is scoped to dropping `addressLine3` only, not renaming the journey model).

### 4.4 EUDPA-293 — deleted-address submit gate (cv-016, cv-027)

**FE review page (293.AC1/AC3) — salvage in place.** `buildOperatorErrors`
(`notification-view/controller.js:30`, `operator-party-view-keys.js:78-87`) turns
`deletedOperatorFields` into a summary message + a per-role inline entry with an anchor
into the relevant summary card — AC1 + AC3 already built. Reshape: trim
`OPERATOR_PARTY_VIEW_KEYS` to the four roles + retire "operator" copy; **block submit**
while any deleted-address error stands — gate the "Continue to declaration" affordance on
`operatorErrors` having no `deleted` entries (the authoritative block is the BE, but the
FE must not send the user into submit with a known-bad reference); choosing a replacement
clears it (falls out of resolve-on-read). Applies to Draft AND Amend (cv-027).

**BE authoritative submit reject (293.AC2) — salvage `guardOperatorExistenceForSubmit`.**
Already fail-closed and keyed per party field (`OperatorValidationException` `:303`), it
rejects a direct-API submit regardless of the frontend, names each affected role, and
leaves status unchanged (throw at `:235` precedes `writeWithOutbox` `:237`). Reshape: move
from `classify()` (`:268`) to `resolve()` — a soft-deleted address resolves flagged-deleted
→ DELETED leg (`:281-284`); a clean submit passes. The guard walks `operatorParties`,
narrowed to four, so inline place-of-origin never gates. Identity: the required-identity
check stays but keys on the forwarded session **org** (cv-010/cv-040). FE surfacing already
exists (`declaration/controller.js` 400→submission-error, 502→verification-unavailable).

### 4.5 EUDPA-295 — freeze-on-submit (cv-012, cv-031)

Reuse the existing `NotificationContentSnapshot` machinery
(`NotificationContentSnapshot.java`, `NotificationContentSnapshotMapper.java`,
`Notification.submittedBaseline:24-25`). Change **when** and **what** it captures.

- **Move capture from amend-start to submit (AC1).** DELETE the amend-start capture
  (`amendNotification:317`) — amend must re-resolve live (AC5). Capture at submit, in the
  same transaction as DRAFT/AMEND→SUBMITTED — today `writeWithOutbox` nulls the baseline on
  AMEND→SUBMITTED (`:368-371`); replace that null with a **capture of the resolved
  details**, run **after** §4.2 resolution has populated the party values.
  `NotificationContentSnapshot.from(notification)` (`:31-33`) deep-clones whatever values
  are on the parties.
- **Retain the `addressId` alongside (AC2, additive).** `operatorId` is a mapped field on
  the snapshot party — ensure it is not stripped.
- **SUBMITTED reads the snapshot (AC3).** Prefer **service-projection**: keep
  `submittedBaseline` `@JsonIgnore` internal, project the baseline into the
  `NotificationResponse` party fields for SUBMITTED (mirrors the read check), extending the
  status fork at `:150-153`. Wire shape of `NotificationResponse` unchanged.
- **Amend re-resolves; cancel restores the submit-time snapshot (AC5/AC6).** With capture
  removed from `amendNotification`, an AMEND resolves live (correct by construction).
  Cancel-amend (`:328-349`) restores from the submit-time baseline; verify amend leaves it
  intact.
- **Post-submit edit/delete does not change the submitted view and must not error even on a
  dangling id (AC4).** SUBMITTED reads the frozen snapshot, never resolves.

### 4.6 Validate-then-freeze ordering + its integration test (cv-012)

293's deleted-gate and 295's snapshot capture mutate the **same** submit transaction. Hard
invariant: the deleted-address gate runs **before** the snapshot capture — otherwise a
soft-deleted address is frozen into the legal record. Naturally preserved in the current
structure (`guardOperatorExistenceForSubmit` `:235`, then `writeWithOutbox` `:237`).
Whichever of 293/295 lands second must not reorder these. **Pin with a submit-flow
integration test:** a submit referencing a soft-deleted address is **rejected** (400, role
named) **AND no snapshot is written** (baseline unchanged, no SUBMITTED transition, no
outbox event) — the rejection alone doesn't prove the freeze didn't run. Companion: a clean
submit **captures** the resolved snapshot and transitions SUBMITTED.

### 4.7 Outbox `schemaVersion` (cv-031)

`OutboxService.SCHEMA_VERSION` is already `"2"` (`:25`) and `NotificationSubmittedData`
already ships full party PII to Dynamics/ASB. Bump to `"3"` **only if the emitted shape
changes.** The `addressLine3` drop (§4.3) removes a field from the emitted `Operator`/
`Address` payload → shape change → **bump to "3"** + an outbox integration test asserting
the emitted address block has no `addressLine3`. The reference/resolve reshape freezes
resolved values whose JSON keys are unchanged → **no bump on that account** (only bump if a
party gains/loses a wire field, e.g. if `addressId` starts being emitted — confirm the
outbound contract, Section 7). Do the bump + test in the same increment as §4.3.

### 4.8 Salvage & test-impact summary (journey)

| Journey component | Decision | Source |
|---|---|---|
| `operatorParties` walk | salvage-modified — narrow 7→4 | `NotificationService.java:184-197` |
| Read-side detection | salvage-modified — classify→resolve, hydrate | `NotificationService.java:148-182` |
| Submit guard (293.AC2) | salvage-modified — classify→resolve, org identity | `NotificationService.java:258-304` |
| `NotificationContentSnapshot` + mapper | salvage — reuse for freeze | `NotificationContentSnapshot*.java` |
| Snapshot capture point | salvage-modified — amend-start→submit | `NotificationService.java:317,368-371` |
| `submittedBaseline` @JsonIgnore | salvage-modified — project for SUBMITTED read | `Notification.java:24-25` |
| Hydrating client method | new — values-carrying `resolve()` | net-new (`OperatorsApiClient.java:43-71` values-free) |
| `Address.addressLine3` | rebuild — drop field + ripple | `Address.java:16` |
| FE select controllers ×4 | salvage-modified — repoint, drop type, store ref | `addresses/*/select/controller.js` |
| FE place-of-origin/consignment/transporter select | rebuild (remove) | `addresses/{place-of-origin,consignment/contact}/select`, `transporters/select` |
| FE operators client | salvage-modified — org-path, camelCase, ref not copy | `operators-client.js` |
| FE review-page detection | salvage-modified — trim keys, block submit, rename | `notification-view/controller.js:30`, `operator-party-view-keys.js` |
| FE submit-error mapping | salvage — retire "operator" copy | `declaration/controller.js:19-36,85-97` |
| `formatAddress` addressLine3 line | rebuild (remove) | `notification-view-helper.js:42` |
| Outbox schemaVersion | salvage-modified — 2→3 on addressLine3 drop | `OutboxService.java:25` |

**Tests to re-baseline / add:** replace the v1 staleness E2E pin (now asserts the wrong
behaviour under resolve-on-read) with a pin that Draft/Amend reflect the latest values and
SUBMITTED shows frozen values; add the submit-flow validate-then-freeze IT (§4.6); add/
update the outbox IT (no `addressLine3`, `schemaVersion == "3"`); re-baseline
`notification-view` + `declaration` controller tests for the four-role key set and the
address/consignment-party copy; update the four FE select-controller tests (org-path call,
no type param, reference stored).

---

## 5. API contract

The full contract is `design/api-contract-v2.yaml` (OpenAPI 3.0.3), covering
`/organisation/{orgId}/addresses` (GET list + POST create) and
`/organisation/{orgId}/addresses/{id}` (GET by-id, PUT full-replace, DELETE soft-delete),
the `AddressRequest`/`Address`/`AddressPage` schemas, the RFC-9457 `Problem`/
`ValidationProblem` family, and worked examples.

Conventions: verb-free noun paths, camelCase JSON (cv-001), top-level object list responses
(never a bare array), `application/problem+json` errors with camelCase `traceId` and a
per-field `errors` map on validation failures, server-config page size (default 25, `page`
the only pagination param), soft-delete surfaced only by GET-by-id (286.AC7).

**Two mechanism reconciliations distinguish v2 from the candidate:**

- **cv-044 — narrow `@Null` mechanism (single source of truth).** `AddressRequest` has NO
  `additionalProperties: false`. `type` and `role` are modelled as explicitly-rejected
  `enum: [null]` properties, so a supplied value lands in the per-field `errors` map keyed
  `type`/`role` (via Java `@Null` components / the `MethodArgumentNotValidException`
  handler), while any other unknown / server-assigned property (including readOnly fields
  echoed from a prior GET) is silently ignored (Zalando, `failOnUnknownProperties(false)`).
  This matches §2.7 and yields the `errors`-map contract 287.AC13 requires — a blanket
  `additionalProperties: false` / `failOnUnknownProperties(true)` would instead produce a
  deserialization failure and 400 a benign edit PUT.
- **cv-048 — FE-resolve placement (option A).** `list-addresses` exposes `q` **and** an
  optional `countryCode` query term. The FE resolves a typed country name to its alpha-2
  code against the MDM list it already loads for the picker and passes `countryCode`; the
  server ORs `q` (over name/townOrCity/postcode) with `countryCode` (over the stored code).
  The backend holds no reference-data client (keeps the Mongo-only ref-data shape).

**Contract presence fix:** `AddressRequest.countryCode` carries `minLength: 1` (matching the
other six mandatory strings and Java `@NotBlank`) — a **presence** constraint tied to
`mandatory: true`, NOT a format/list/length check, so it does not re-open cv-011/cv-044.
There is no `maxLength`/pattern on `countryCode` anywhere (stored as given). This also keeps
the `b-single-source-validation` parity test honest (`@NotBlank` rejects blank ↔ the contract
rejects `""`).

---

## 6. Consolidated salvage-vs-rebuild index

Per-component decisions live in the section tables: topology §1.5, address-book service
§2.2–§2.12 (+ the DELETE list §2.12), INS frontend §3.14, journey §4.8. Overall shape:

- **address-book service:** mostly **salvage-modified** (rename + delete + three behaviour
  changes — Jackson camel flip, crn→org scope key, the new path-vs-session authorise). Net
  new: the branch-publish workflow. Net deletes: `OperatorType`, `TransporterCategory`, the
  two transporter validators, all crn logic, the `operator_type` param, the two snake
  `@JsonProperty` overrides + `wireFieldName` scaffolding.
- **ins-frontend:** **new** repo scaffold + CI; **salvage** the auth strategy verbatim;
  **salvage-modified** nav/config/schema/picker/list/view/edit/delete pages + routes;
  **rebuild** the API client (structure salvaged, mapping deleted); **delete** the add/type
  page.
- **journey (animals-frontend + backend):** **salvage-modified** the detection surface,
  submit guard, snapshot capture point, select pages, review-page detection; **new** the
  hydrating `resolve()` method; **rebuild** (remove) the `addressLine3` field + the inline/
  deferred select pages.

---

## 7. Residual design risks (deferred to build; NOT re-opened rulings)

- **cv-048 placement is `needsHuman`.** The ruling adopts option (a) (resolve name→code
  before matching) but does not fix FE-vs-backend placement. This design pins **FE-resolve
  (A)** and the contract carries the `countryCode` param accordingly; if UX/BA prefer a
  single-`q` backend-resolve, overrule §2.9 and add a reference-data `/countries` client +
  name→code cache to the backend, and drop the `countryCode` param. Confirm with UX before
  M2 build.
- **Searched-field set (186.AC2 is a flagged inference).** The raw-`q` `$or` runs over
  name/townOrCity/postcode; confirm the exact set with UX at build.
- **Soft-delete representation (cv-016).** Enum `ACTIVE`/`DELETED` recommended internally with
  a derived `deleted` boolean on the wire; if the FE contract needs the raw enum, revisit —
  flagged an openRisk, not a blocker.
- **`@JsonIgnore` vs service-projection for the SUBMITTED read (§4.5).** Design leans to
  service-projection (keep the field internal). If the snapshot must be exposed on the wire
  for a consumer, this touches the `NotificationResponse` contract.
- **Reference id in the outbound outbox contract (§4.7).** Confirm with the Dynamics owner
  whether `addressId` should be emitted alongside the frozen values, or values-only — affects
  whether the reshape (not just `addressLine3`) triggers a schema field-add.
- **Sum-type class layout (cv-012).** Single `Operator` class with an optional `addressId`
  discriminator (recommended, least churn) vs a sealed reference/inline pair — decide at
  build.
- **Cross-request address caching (§4.2).** Per-request dedupe is in scope; a cross-request
  TTL cache is a measure-first optimisation — do not build speculatively.
- **INS port 3002 assumption.** Chosen because 3000/3001/3007 are taken; confirm no other
  stack service claims 3002 when the PR lands.
- **CDP image-name derivation on repo rename.** `cdp-build-action` derives the image from the
  repo name; the GitHub-side operators→address-book rename must complete before `publish.yml`
  produces the new image (ji-cicd-publish sequencing).
- **Seed / cross-repo branch parity.** The tests-repo seed rename lands on the same-named
  branch so the stack's linked-branch pickup stays consistent (rule 2); confirm the branch
  exists at PR time.
- **287.AC10 "3-second banner" deviation.** The one-shot persistent banner (no timed dismiss)
  is a knowing ruled deviation pending an AC amendment.

### Backlog sequencing notes (see `backlog-v2.json`)

- **M2-before-M3 gate is intentional.** The spec blockingGraph makes EUDPA-186 (M2) and
  EUDPA-294 (M3) independent siblings; the backlog nonetheless gates m3-01/m3-02 on the m2-02
  milestone walk-through so the running-stack address-book (CRUD + search) is proven before
  the journey repoints at it. Documented on the M3 milestone `sequencingNote`; drop the m2-02
  edges if parallel delivery is later wanted.
- **m3-04 dependency corrected.** `m3-04` (FE select pages store only `addressId`) now depends
  on `m3-03` (the BE resolve-on-read hydrator) and `m0-06` (the list-addresses API the select
  pages call), not just `m3-02` — storing a reference is unsafe to ship before the hydrator
  that resolves it, else a Draft/Amend read shows blank party details.
- **286.AC4 attribution corrected.** `m3-01` (drop `addressLine3` / notification model) is
  tagged only `EUDPA-294.AC5`; 286.AC4 (edit-page per-field validation) is delivered on the
  address-book service by `m1-02` (update-address) + `m1-05` (edit page), not by a
  notification-model increment on a different surface.
