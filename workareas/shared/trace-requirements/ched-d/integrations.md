# CHED-D — Integration points

_Wave: Integration mapping. Sources: Playwright trace network logs (strongest), the QA
automation repo (`ipaffs-qa-automation`), and the IPAFFS application code (`ipaffs-frontend-notification`,
microservice configs). CHED-D internal type code = **CED** (legacy TRACES "Common Entry Document";
frontend URL slug = `d`)._

## Headline finding — the frontend is fully server-side rendered

Every page in the create journey is a server-rendered hapi + Handlebars POST→302→GET cycle against
the notifier frontend host (`importnotification-static-snd.azure.defra.cloud`). The page's
Content-Security-Policy is `connect-src 'self' https://*.google-analytics.com` — i.e. **there are no
client-side XHR/fetch calls to any backend**. Confirmed on trace `b3742f19` req 1106 (CSP header) and
across the whole non-static request set (453 data requests, all same-origin page navigations).

**Consequence:** the external integrations (countries, commodity codes, BCPs, address lookup, onward
submission) all happen **server-side inside the frontend/notification services and are invisible in the
browser trace.** The trace confirms *which touchpoints are exercised* (a commodity search happened, a
file was uploaded, a submission occurred) but not the wire shape of the backend call. Those shapes are
corroborated from the application code (`ipaffs-frontend-notification/service/src/integration/*.js`,
which is the outbound-call boundary) and the QA repo. Confidence is tagged accordingly.

### Microservice topology visible in trace URL paths (reverse-proxy prefixes)

| Path prefix (from trace) | Serves | Journey side |
|---|---|---|
| `/notification/vnet/protected/notifications/{DRAFT.GB.2026.NNNN}/…` | notification frontend + store — every create-journey page | Notifier (create) |
| `/upload/vnet/protected/upload/{ref}/0/notification/attach` | file upload frontend (multipart) | Notifier (create) |
| `/decision/vnet/protected/bip-notifications/{CHEDD.GB…}/…` | decision/inspector frontend | Inspector (out of create scope) |

Notification reference is `DRAFT.GB.2026.NNNN` while in draft and becomes `CHEDD.GB.2026.NNNN` after
submission — the draft→submitted lifecycle.

The frontend-notification service's downstream dependencies (from
`ipaffs-frontend-notification/service/config/default.json:60-144`): `approvedestablishment-`, `bip-`,
`certificate-`, `cloning-`, `commoditycode-`, `countries-`, `customer-`, `decision-`,
`economicoperator-`, `fieldconfig-`, `file-upload-`, `legacy-notifications-`, `notification-`,
`permissions`, `risk-assessment-`, `in-service-messaging-microservice`.

---

## Integrations table

| System | Purpose | Call shape | Confidence | 1st pass? | Stub |
|---|---|---|---|---|---|
| **Notification store** (notification-microservice) | The draft the journey builds — created, patched page-by-page, submitted. **This IS the "build JSON, persist to Mongo" boundary.** | `POST {notification-svc}/notifications` (create draft); `GET …/{ref}/latest`; `PATCH …/{ref}` with etag optimistic concurrency per page save; submit = PATCH status→SUBMITTED. `ipaffs-frontend-notification/service/src/integration/notification.js:9-94` | inferred | **yes — it is the persistence** | This is Mongo in the new app. Build the JSON object, persist/patch it. |
| **Countries** reference data (countries-microservice) | Country of origin dropdown; country field on every trader/consignor/consignee/branch address. | `GET {countries-svc}/countries` (all); `?isoCode=`; `?certificateType=CED` (CHED-D subset). Cached w/ TTL. `…/integration/countries.js:14-68` | confirmed (touchpoint) / inferred (shape) | **yes** | Seed a static countries collection / hardcode the ISO list (~250). |
| **Commodity code lookup** (commoditycode-microservice) | Commodity search + tree browse (chapter→heading→code); validates the selected HRFNAO code; supplies group metadata. | `GET {cc-svc}/commodity-codes/{certType}/top-level`; `…/{certType}/parent-code/{code}`; `…/commodity-codes/groups?commodityCodes=`. `…/integration/commodity_code.js:17-28,48-110`. Trace: `page-3?tab=commodity-code-search` POST → `page-4?commodity-selected-code=06011010` GET (`b3742f19` req 139/140). | confirmed (touchpoint) / inferred (shape) | **yes** | Seed a small CHED-D commodity tree, or hardcode the exercised chapters (07,08,09,10,11,12,…). Search page rendered 16 top-level chapters. |
| **Border Control Posts / Point of entry** (bip-microservice) | Port-of-entry dropdown on Transport details; filtered by CHED type + inspection facility. | `GET {bip-svc}/bcps?includeControlPoints=true&types={type}`; ports-of-entry cached by `(chedType, hasInspectionFacility)`. `…/integration/border_inspection_post.js:21-77` | confirmed (touchpoint) / inferred (shape) | **yes** | Hardcode the ~31 BCP list (see reference-data table). |
| **File upload + antivirus scan** (frontend-upload + file-upload-microservice + antivirus-stub) | Attach accompanying document(s) (e.g. Health certificate); async virus scan; upload metadata read back. | `POST /upload/vnet/protected/upload/{ref}/0/notification/attach` `multipart/form-data` (trace `b3742f19` req 362, 1.5s). Metadata via `httpClient.UNPROCESSED_GET/DELETE` `…/integration/file_upload.js:10-20`. Scanning is downstream + async. | confirmed (upload) / inferred (scan) | **no** | No-op stub that records a filename; defer real upload + scan. |
| **Address / postcode lookup** (customer-microservice) | CUC billing "find an address" — postcode → address list. | `GET {customer-svc}/customer/address-lookup/{postcode}`. `…/integration/customer.js:14,106-114` | inferred | **no** | CUC is an optional variant. Manual address entry or canned addresses. |
| **Trader / organisation address book** (customer- + economicoperator-microservice) | "Search existing consignor/consignee/importer" and save new addresses to the org's address book. | Search + create trader addresses via customer/economic-operator services. `…/integration/customer.js`, `…/economic_operator.js` | inferred | **no** (partial) | Capture consignor/consignee/importer/branch addresses **inline into the JSON**; skip the address-book search/save-and-reuse. |
| **Onward submission → Trade Platform / TRACES (SOAP)** | On declaration submit, the notification is handed to the EU/Trade Platform; the CHED certificate becomes retrievable. | SOAP `CertificateRequest` in `traceswsns` namespace, `<trac:SearchCriterionCED><trac:ReferenceNumber>…`, `Content-Type: text/xml`, `Bearer` token, `INS-ConversationId` header. See `ipaffs-qa-automation/resources/soap-search/ched-d-soap-certificate-request.xml` + `clients/services/SoapSearchClient.ts`. Driven downstream by enotification-submission / soaprequest microservices. | confirmed (contract via QA) / inferred (trigger) | **no** | First pass persists to Mongo only. Defer/stub the onward SOAP submission entirely. |
| **Dynamics / CRM** (imports-crm-service, customer) | Source of customer organisation / user data behind the session. QA verifies plants via `DynamicsPlantsClient` (CHED-PP); CHED-D has no dedicated Dynamics client. | CRM-backed customer data; no CHED-D-specific Dynamics call evidenced. | gap | **no** | Stub customer/org data. |
| **GOV.UK Notify** (notify-microservice) | Confirmation / status emails after submission. | Not called from the create-journey frontend; downstream of notification-microservice. | gap | **no** | No-op. |
| **GVMS / CTC (Common Transit)** (gvms-microservice) | Goods-movement-services page: GVMS Yes/No + CTC MRN. | Page captures GVMS radio + `ncts-mrn` **free-text MRN** (trace `b3742f19` req 284; page `goods-movement-services.json`). **No live GVMS/NCTS validation call observed** in the create journey. | confirmed (field capture) / gap (live validation) | **no** | Capture the fields into the JSON; defer any MRN validation. |
| **Auth / Defra ID (OpenID)** (openid-token-microservice) | Authenticated notifier session. | Session cookies `returnurl_0`, `new_access_0` + hapi `crumb` CSRF token on every request (trace headers). OIDC sign-in upstream. | confirmed (session) / inferred (provider) | **no** | Stub / no-op auth (mirror FE `AUTH_ENABLED=false`). |
| **Risk assessment** (risk-assessment-microservice) | Risk rules over the notification; drives inspector routing. | `…/integration/risk_assessment.js`; inspector-side. | inferred | **no** | Out of create-journey scope. |

---

## Reference-data sources table

| List | Source | ~Size | 1st pass | Rendered evidence |
|---|---|---|---|---|
| **Countries** | countries-microservice, `?certificateType=CED`; UK floated to top | ~250 | Seed static collection / hardcode | `country-of-origin.json` dropdown (20 visible in trace snapshot, alphabetical A…, truncated view of full list) |
| **Commodity codes** | commoditycode-microservice tree (chapter→heading→code) | thousands (HRFNAO subset) | Seed small tree / hardcode exercised chapters | `search-commodity.json` — 16 top-level chapters (07,08,09,10,11,12,…); codes exercised: `06011010`, `10064000` (broken rice), `0808108010`, `0603197090` |
| **Border Control Posts / Ports of entry** | bip-microservice, `?includeControlPoints=true&types=…`, filtered by CHED type + inspection facility | ~31 | Hardcode the list | `transport-details.json` `bcp` field — 31 options incl. BRISTOL (GBBRS), DOVER EAST (SEVINGTON BCP) (GBSEV), FELIXSTOWE (GBFXT), MANCHESTER AIRPORT (GBMAN) |
| **Package types** | Static in-app map (frontend); not a live service | ~28–37 (25 rendered) | Hardcode | `commodity-extended-description.json` `package-type` — 25 options (Bag, Bale, Block, Box, Can, …) |
| **Document types** | Static in-app map `transformers/maps/document_type` (frontend) | ~26 (14 rendered) | Hardcode | `accompanying-documents.json` `document-type` — 14 options (Health certificate, Air waybill, Bill of lading, …) |
| **Transport methods** | Static enum | 4 (+placeholder) | Hardcode | `transport-details.json` `transport-means-before` — Airplane / Railway / Road vehicle / Vessel |
| **Commodity intended-for** | Static enum | 4 | Hardcode | `commodity-additional-details.json` — Feedingstuff / Further process / Human consumption / Other |
| **Storage temperature** | Static enum | 3 | Hardcode | `commodity-additional-details.json` — Ambient / Chilled / Frozen |
| **CTC / GVMS options** | Static enum | 3 + 2 | Hardcode | `goods-movement-services.json` — CTC: Yes–add MRN now / Yes–add MRN later / No; GVMS: Yes / No |
| **Consignment-in-container / Yes-No** | Static enum | 2 | Hardcode | `transport-details.json` `consignment-in-container` — Yes / No |
| _(inspector-side, out of create scope)_ Lab tests, sample types, laboratories | laboratories-microservice / reference data | — | n/a | present in QA domain (`lab-test.ts`, `sample-type.ts`) but only exercised in the decision/inspector journey |

---

## Captured request/response examples (from traces)

### Commodity code search (server-side lookup) — trace `b3742f19`
```
POST https://importnotification-static-snd.azure.defra.cloud/notification/vnet/protected/
     notifications/DRAFT.GB.2026.1525736/consignment/page-3?tab=commodity-code-search
Content-Type: application/x-www-form-urlencoded   → 302
GET  …/consignment/page-4?commodity-selected-code=06011010   → 200 (commodity details page)
```
The match against the commodity taxonomy happens server-side in commoditycode-microservice; no
client-visible API response.

### File upload — accompanying document (multipart) — trace `b3742f19` req 362
```
POST https://importnotification-static-snd.azure.defra.cloud/upload/vnet/protected/
     upload/DRAFT.GB.2026.1525736/0/notification/attach
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary…
Content-Length: 745   → 302 (duration 1.5s — includes handoff to scan pipeline)
```

### Declaration submit — trace `b3742f19` req 514
```
POST https://importnotification-static-snd.azure.defra.cloud/notification/vnet/protected/
     notifications/DRAFT.GB.2026.1525736/declaration   → 302 → confirmation
```
Reference transitions `DRAFT.GB.2026.NNNN` → `CHEDD.GB.2026.NNNN`.

### Onward TRACES SOAP contract (from QA repo — `ched-d-soap-certificate-request.xml`)
```xml
<soapenv:Envelope xmlns:trac="traceswsns">
  <soapenv:Body>
    <trac:CertificateRequest>
      <trac:XMLSchemaVersion>2.0</trac:XMLSchemaVersion>
      <trac:UserIdentification>…</trac:UserIdentification>
      <trac:Request>
        <trac:SearchCriterionCED>
          <trac:ReferenceNumber>CHEDD.GB.2026.NNNN</trac:ReferenceNumber>
        </trac:SearchCriterionCED>
      </trac:Request>
    </trac:CertificateRequest>
  </soapenv:Body>
</soapenv:Envelope>
```
Headers: `Content-Type: text/xml`, `Authorization: Bearer <soap-token>`, `INS-ConversationId`.
`SearchCriterionCED` confirms CHED-D = "CED" on the wire.

---

## First-pass recommendation

For a first-pass CHED-D app that builds a JSON object and persists to Mongo, only the **reference-data
lookups that populate/validate the create-journey inputs** are genuinely needed — and all of them can
be **stubbed from static seed data**:

- **Needed (as static seed lists):** countries, commodity codes (small CHED-D tree), BCPs/ports of
  entry, package types, document types, transport methods, and the static enums.
- **Deferred/stubbed to no-op:** file upload + antivirus, address/postcode lookup, trader address-book
  reuse, GVMS/CTC validation, Notify, Dynamics/CRM, auth (no-op), and — critically — the **onward SOAP
  submission to Trade Platform/TRACES** (first pass stops at persist-to-Mongo).
- The notification-microservice patch-per-page pattern is the closest analogue to the new app's
  build-JSON-and-persist model.
