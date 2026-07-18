# CHED-PP — integration points

Scope: what the CHED-PP **create** journey talks to, and what the call looks like. Boundary only —
this is not a review of IPAFFS internals.

## The single most important finding

**The browser makes no cross-origin data calls at all.** Every reference-data lookup, search and
persistence operation in the CHED-PP journey is a server-side call made by the frontend during a
normal form POST → 302 → GET page render.

Evidence (`confirmed`, trace `4d05538473b102fd30b29eefa51e3cfa671f27d1`, request 2091 response headers):

```
Content-Security-Policy: default-src 'self'; ... connect-src 'self' https://*.google-analytics.com;
```

`connect-src 'self'` — the page cannot XHR anywhere but its own origin. Corroborated by the network
logs: filtering 3,746 requests for `json|odata|soap|xml` returns **zero** hits. Even the commodity
code search — which looks like a typeahead — is a full page round-trip:

```
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1526021/consignment/page-3?tab=commodity-code-search
  → 302 Location: .../consignment/page-4?commodity-selected-code=10083000
```

**Consequence for the new app:** the integration surface is entirely a *server-side* concern. The
traces tell us *which pages need which lookup*; they cannot tell us the wire shape. All request/response
shapes below are therefore `inferred` from the frontend's integration clients, and each is cited to
`file:line`.

## Second finding: persistence is JSON-Patch with optimistic concurrency

Every page submit in the journey carries an `etag` in its form body:

```
crumb=QQZ2rAMrWeaLrJGEU6PAW8OCjIwPLtcmIZwAUTucfgf&etag=%220000000000BD2BCB%22&selectedCommodity=root
  &commodityDetailsPage=&commodity-text-input=10083000&action=search
```
(`confirmed` — trace `60687c60…`, request 3225 body)

That `etag` is round-tripped into an `If-Match` header on a JSON-Patch PATCH:

```js
// ipaffs-frontend-notification/service/src/integration/notification.js:46-55
const patchNotification = async (reqMetadata, referenceNumber, etag, patchOperations) => {
  return httpClient.PATCH({
    url: notificationsUrl + '/' + referenceNumber,
    data: patchOperations,
    headers: { 'content-type': PATCH_CONTENT_TYPE, 'if-match': etag, ... }
  })
}
```
with `PATCH_CONTENT_TYPE: 'application/json-patch+json;charset=utf-8'`
(`utils/constants.js:20`).

This is directly relevant to the first pass, which builds a JSON object and persists it to Mongo. It
is a *design decision to make deliberately*, not to inherit: the new app can persist a whole document
per page submit and skip patch-op construction entirely. The `etag`/`If-Match` concurrency control is
the part worth keeping if two tabs editing one draft is a real scenario — that is a question for a
human, not something the traces answer.

## Integrations

| System | Purpose | Direction | Call shape | Confidence | First pass? |
|---|---|---|---|---|---|
| Notification service | Create/read/patch the draft + submit | outbound | `POST /notifications`, `GET /notifications/{ref}/latest`, `PATCH /notifications/{ref}` (`application/json-patch+json`, `If-Match: <etag>`) | inferred — `integration/notification.js:9-55` | **Yes** — this *is* the first pass; replace with Mongo |
| Commodity code | Code tree browse/search; CHED-PP species (EPPO); commodity attributes | outbound | `GET {base}/commodity-codes/{certType}/commodity-code/{code}`, `/top-level`, `/parent-code/{code}`, `/all-parents/{code}`; `GET|POST {base}/commodity-species/chedpp/{code}`; `GET {base}/commodity-codes/chedpp/commodity-attributes?commodityCodes=…` | inferred — `integration/commodity_code.js:10-28,36-243` | **Yes** — journey cannot proceed without a code; stub with a small fixture list |
| Countries | Country of origin, trader address country, UK regions | outbound | `GET {base}/countries?isoCode=…`, `?certificateType=CHEDPP`, `/nonUK`, `/ukRegions?certificateType=…&risk=…` | inferred — `integration/countries.js:14-147` | **Yes** — hardcode a JSON list (254 options observed) |
| BIP / border control post | Entry BCP + inspection premises (control point) | outbound | `GET {base}/organisations?…&countryCodes=GB`, `GET {base}/bcps/customer-ids/{orgIds}` | inferred — `integration/border_inspection_post.js:22-162` | **Yes** — hardcode; 144 BCP + 135 control-point options observed |
| File upload + antivirus | Attach supporting documents; virus scan | outbound | `POST {base}/upload` (multipart) → `{ id, filename, errorMessage }`; scan result is **synchronous** in the response | inferred — `frontend-upload/service/src/services/file_upload.js:12-24`, `routes/handlers/upload/border_notification_upload.js:46-61`; browser leg `confirmed` (trace `60687c60…` req 3482, `POST /upload/vnet/protected/upload/DRAFT.GB.2026.1526021/0/notification/attach`, multipart, 302, 1.4s) | **No** — defer; accept file metadata without storing bytes |
| Economic operator (address book) | Consignor/consignee/importer search + create | outbound | `GET {base}/economic-operator/{id}`, `POST {base}/economic-operator`, `PUT/DELETE {base}/economic-operator/{id}` | inferred — `integration/economic_operator.js:10-89`; browser leg `confirmed` (trace `60687c60…` req 3516 `GET .../traders/consignor/search`) | **No** — first pass: type the address in free-text; no address book |
| Risk assessment | Risk categorisation of the submitted notification | outbound | `POST {base}/journey-risk-categorisation` | inferred — `integration/risk_assessment.js:7-27` | **No** — post-submission; stub as always-low-risk |
| Field config | Drives which fields render/validate per cert type | outbound | `GET {base}/…` | inferred — `integration/field_config.js:10` | **No** — hardcode CHED-PP field set |
| Customer / Defra ID | Signed-in user, org, contact, address lookup | both | `GET {base}/customer/{id}`, `/individual-account/{id}`, `/address-lookup/…` | inferred — `integration/customer.js:6-34` | **No** — stub a fixed signed-in user |
| Permissions | Role → permission; overdue-debtor gate | outbound | `GET {base}/roles/{role}/permissions`, `GET {base}/is-overdue-debtor` | inferred — `integration/permissions.js:12-83` | **No** — stub allow-all |
| Certificate | Generates the CHED PDF | outbound | `GET {base}/certificate/{reference}?url={baseUrl}` | inferred — `integration/certificate.js:10-12` | **No** — defer |
| Dynamics 365 (Plants) | Downstream system of record for CHED-PP | outbound (downstream of submit) | OData: `GET {instance}/api/data/v9.0/trd_plantsimportnotifications?$filter=trd_chedppreference eq '{ref}'` | inferred — `ipaffs-qa-automation/clients/services/DynamicsPlantsClient.ts:5-41` (this is the *test's* read path; the app's write path is not evidenced here) | **No** — out of scope for pass 1 |
| Trade Platform (TRACES, SOAP) | EU certificate exchange | both | SOAP `CertificateRequest`, ns `traceswsns`, `XMLSchemaVersion 2.0`, body `SearchCriterionCHEDPP/ReferenceNumber` | inferred — `ipaffs-qa-automation/resources/soap-search/ched-pp-soap-certificate-request.xml`; client `clients/services/SoapSearchClient.ts:51-117` (token endpoint + 2 SOAP posts) | **No** — out of scope for pass 1 |
| GVMS | — | — | **Not an integration in this journey.** The `goods-movement-services` page captures GVMS answers as notification *data* (`views/importer/goodsMovementServices.html`, `addNctsMrn.html`); no outbound client fires during create. `ipaffs-gvms-microservice` exists but is downstream. | confirmed (browser) / inferred (code) | **No** — it is just two radio answers + an MRN field |
| Notify (email/SMS) | — | outbound | `ipaffs-notify-microservice` exists; **no call evidenced from the create journey** | gap | **No** |

## Reference-data sources

Option counts are `confirmed` — read directly out of the trace snapshots. **Now cross-checked
against the Comb wave's `pages/*.json`** (reconciliation done this wave). The small lists agree
exactly across both waves; the two big lists (countries, BCP) agree on the full DOM count once you
account for the Comb `options` arrays holding a transcribed *sample*, not the full render. The one
genuine divergence is control-points (see note).

| List | Size (options, incl. placeholder) | Where from | Used by | First pass |
|---|---|---|---|---|
| Countries | **~254** — 253 selectable + placeholder. `confirmed` both ways: prior snapshot count 254; Comb evidence confirms 253 selectable (249 flat + 4 GB-* regions, GB optgroup label unselectable) corroborated against `ipaffs-qa-automation/types/country.ts` (253 entries). Comb `options` array holds a 52-item sample, not the full list. | Countries service — `integration/countries.js:14` | country-of-origin, trader address | Hardcode JSON |
| Border control posts | **144** (`bcp`). `confirmed` both ways — prior trace `60687c60…` action 39, and Comb trace `e10b7cd5…` action 47 (DOM: `select#bcp`, 144 options). Comb `options` array is a 25-item sample. | BIP service `/organisations?…&countryCodes=GB` — `border_inspection_post.js:22` | transport-before-bip | Hardcode JSON |
| Control points (inspection premises) | **BCP-dependent — 52 to 135**. `confirmed` but **not a fixed number**: prior trace `60687c60…` action 39 showed 135; Comb trace `e10b7cd5…` action 47 showed 52 (`select#control-point`). The two runs differ because control points are **filtered by the chosen BCP** — so there is no single count to hardcode. | BIP service `/bcps/customer-ids/{orgIds}` — `border_inspection_post.js:162` | transport-before-bip | Hardcode a per-BCP map, or defer the filtering to a stub keyed on the selected BCP |
| Means of transport | **5** (`transport-means-before`). `confirmed` both ways (prior action 39; Comb `transport-before-bip.json`). | Static/reference | transport-before-bip | Hardcode |
| Package types | **24** (`bulk-package-type` / per-commodity `package-type`). `confirmed` both ways (Comb `commodity-bulk-details.json`). | Reference data | commodity-bulk-details | Hardcode |
| Quantity types | **8** (`bulk-quantity-type` / `quantity-type`). `confirmed` both ways. | Reference data | commodity-bulk-details | Hardcode |
| Container / storage conditions | **3** bulk / **2** per-commodity (`bulk-container` / `container`). `confirmed` both ways. | Reference data | commodity-bulk-details | Hardcode |
| Finished-or-propagated (per commodity) | **3** (`finished-or-propagated`). `confirmed` — Comb `commodity-bulk-details.json`; not in prior first-hand list. | Reference data | commodity-bulk-details | Hardcode |
| Document types | **17** — `Air waybill`, `Commercial invoice`, `Cargo Manifest`, `Inspection certificate`, `Phytosanitary certificate`, … `confirmed` both ways (`document-type`; Comb `accompanying-documents.json`). | Reference data | accompanying-documents | Hardcode |
| Consignment purpose | **3** (`purpose`: Internal market / Re-entry / For import re-conformity check). `confirmed` — Comb `about-the-consignment.json`. | Static/reference | about-the-consignment | Hardcode |
| Commodity chapter tree (per-chapter parent codes) | e.g. **11** parent codes under a chapter (`parent_06/07/08`). `confirmed` — Comb `commodity-additional-details.json`. | Commodity code service — `commodity_code.js:30-100` | commodity-additional-details | Fixture |
| Commodity codes | Large — hierarchical tree, not a flat select | Commodity code service — `commodity_code.js:36-100` | commodity-search, commodity-additional-details | **Cannot hardcode wholesale.** Ship a fixture of ~10 CHED-PP codes |
| EPPO / species codes | Large — searched, paged (`page=0`, `page=1` observed) | Commodity code service `/commodity-species/chedpp/{code}` — `commodity_code.js:116-158` | variety-of-genus-and-species | Fixture per fixture-commodity |

### Note on commodity + EPPO

These are the two lists that cannot be hardcoded and are the journey's real integration dependency.
The observed flow (`confirmed`, trace `60687c60…`, actions 17-23 / requests 3208-3279):

1. `GET  …/consignment/page-3?tab=commodity-code-search`
2. `POST …/consignment/page-3?tab=commodity-code-search` — body `commodity-text-input=10083000&action=search`
3. `302 → GET …/consignment/page-4?commodity-selected-code=10083000`
4. `POST …/consignment/page-4?page=1&commodity-selected-code=10083000` — EPPO search (`PHAAN`)
5. `302 → GET …/consignment/page-4?commodity-selected-code=10083000&eppo-code=PHAAN&page=0`
6. `POST …` — body `is-last-of-page=true&commodityDetailsPage=&add-species-1416873=Add`
7. `302 → GET …/consignment/page-5`

Step 6 is worth flagging: the "Add" button's *name* carries the species id (`add-species-1416873`).
So a commodity+species selection resolves to an **internal numeric species id**, not the EPPO code
itself. The new app needs an equivalent stable identifier — a fixture keyed on EPPO code alone may
not be sufficient. `gap`: whether that id is stable across reference-data refreshes.

## Captured examples

### Commodity code search (confirmed)
```
POST https://importnotification-static-snd.azure.defra.cloud/notification/vnet/protected/
     notifications/DRAFT.GB.2026.1526021/consignment/page-3?tab=commodity-code-search
Content-Type: application/x-www-form-urlencoded

crumb=QQZ2rAMrWeaLrJGEU6PAW8OCjIwPLtcmIZwAUTucfgf&etag=%220000000000BD2BCB%22
&selectedCommodity=root&commodityDetailsPage=&commodity-text-input=10083000&action=search

→ 302 Found
  Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1526021/
            consignment/page-4?commodity-selected-code=10083000
  INS-ConversationId: 77f9858a-4cb1-4864-8b4a-a814cfdd932b
```

### EPPO species add (confirmed)
```
POST …/consignment/page-4?page=1&commodity-selected-code=10083000

crumb=QQZ2rAMrWeaLrJGEU6PAW8OCjIwPLtcmIZwAUTucfgf&etag=%220000000000BD2BCB%22
&is-last-of-page=true&commodityDetailsPage=&add-species-1416873=Add
```

### File upload (confirmed browser leg)
```
POST https://importnotification-static-snd.azure.defra.cloud/upload/vnet/protected/
     upload/DRAFT.GB.2026.1526021/0/notification/attach
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary…
→ 302
```
No client JS involved — the upload app is reverse-proxied onto the same origin so the relative 302
resolves. Same pattern as the `fcp-sfd-portal-stub` no-JS uploader.

### Notification persist (inferred — `integration/notification.js:46-55`)
```
PATCH {notification-service}/notifications/DRAFT.GB.2026.1526021
Content-Type: application/json-patch+json;charset=utf-8
If-Match: "0000000000BD2BCB"

[ { "op": "replace", "path": "/partOne/…", "value": … } ]     ← op list not observed
```

### Dynamics read-back (inferred — `DynamicsPlantsClient.ts:38-41`)
```
GET {dynamicsInstanceUrl}/api/data/v9.0/trd_plantsimportnotifications
    ?$filter=trd_chedppreference%20eq%20'CHEDPP.GB.2026.1526021'
```

### Trade Platform SOAP (inferred — `ched-pp-soap-certificate-request.xml`)
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:trac="traceswsns">
  <soapenv:Body>
    <trac:CertificateRequest>
      <trac:XMLSchemaVersion>2.0</trac:XMLSchemaVersion>
      <trac:UserIdentification>[REDACTED]</trac:UserIdentification>
      <trac:UserPassword>[REDACTED]</trac:UserPassword>
      <trac:Request>
        <trac:SearchCriterionCHEDPP><trac:ReferenceNumber>REFERENCE_NUMBER</trac:ReferenceNumber></trac:SearchCriterionCHEDPP>
      </trac:Request>
    </trac:CertificateRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

## First pass — what to build vs stub

Needed for a journey that builds JSON and persists to Mongo:

- **Build**: Mongo persistence (replaces the notification service).
- **Hardcode as JSON fixtures**: countries (254), BCPs (144), control points (135, keyed by BCP),
  package types (24), quantity types (8), containers (3), document types (17), means of transport (5).
  All are small, stable, and observed in full — no service needed.
- **Fixture, not hardcode**: commodity codes + EPPO species. Ship ~10 CHED-PP codes with their
  species. This is the one lookup that will eventually need a real integration.
- **Stub**: auth/Defra ID (fixed user), permissions (allow-all), field config (CHED-PP set inline).
- **Defer entirely**: file upload + antivirus, address book, risk assessment, certificate PDF,
  Dynamics, Trade Platform, Notify.

## Gaps — questions for a human

- The **JSON-Patch op list** is never visible in a trace (server-side). The actual patch document
  shape is unknown. `gap`.
- **Reference-data provenance**: every list above is reached via a service, but where that service
  *gets* its data (MDM? a loader? `ipaffs-referencedataloader-microservice`?) is not evidenced. `gap`.
- **Species id stability** (`add-species-1416873`) across reference-data refreshes. `gap`.
- **Notify** — no call evidenced from the create journey. Does submission trigger an email? `gap`.
- **The app's Dynamics write path** — only the QA test's OData *read* is evidenced. How the
  notification reaches `trd_plantsimportnotifications` is not. `gap`.
- **Control-point ↔ BCP filtering rule** — now **corroborated**: two independent traces render
  different control-point counts (135 vs 52) for the same field, which only makes sense if the list
  is filtered by the chosen BCP. The exact filtering rule (which BCP yields which control points)
  was still not directly exercised. `gap` on the rule; `confirmed` that filtering happens.
- **Comb cross-check**: DONE this wave. `pages/*.json` now exists and was reconciled against the
  first-hand snapshot counts — small lists (doc types 17, package 24, quantity 8, container 3/2,
  transport means 5, purpose 3) agree exactly; countries (~254) and BCP (144) agree on the full DOM
  count. Note the Comb `options` arrays hold a transcribed sample, not the full render, so read the
  field's `evidence` narrative (which cites the DOM `<select>` option count) for the true size.
