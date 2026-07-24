# CHED-P — Integration points

_Wave: Integration mapping. Sources: Playwright trace network logs (strongest), the QA automation
repo (`ipaffs-qa-automation`), and the IPAFFS application-code outbound boundaries. CHED-P's
internal notification type is **CVEDP**; its submitted reference prefix is **CHEDP**._

## Headline finding — the create journey is server-side rendered

The browser-visible journey is a hapi/Handlebars POST → 302 → GET cycle against
`importnotification-static-snd.azure.defra.cloud`. Its Content-Security-Policy limits `connect-src`
to self and Google Analytics. Consequently, there are no browser-side calls to the countries,
commodity, approved-establishment, BIP or risk services.

The traces therefore provide two different strengths of evidence:

- **confirmed:** a request was present in the trace's network log. This includes all same-origin
  page posts, multipart upload, and the QA SOAP search/poll calls.
- **confirmed touchpoint / inferred call shape:** the trace proves that the page used the data, while
  the server-to-server REST contract comes from `service/src/integration/*.js`.
- **inferred:** code contains an outbound client or queue producer, but it was not visible firing.
- **gap:** the system is suspected or adjacent, but neither a CHED-P call nor a CHED-P-specific
  client was evidenced.

Four rich core traces were inspected:

| Trace | Journey evidence | Actions / network entries |
|---|---|---:|
| `94d29a163f6ab37556cd585b4eabeec9b9c27d84` | RoW, high-risk, lamb, approved establishment, upload, submit, SOAP read-back | 252 / 1,216 |
| `07531e0d159b90b8ecddb13cf441bda4c493d68b` | RoW, ten approved establishments, submit | 263 / 1,261 |
| `0a6f82fcd63c4cd83fcab91687b522f3f865a74e` | EU/high-risk, German establishment, road transport, submit, SOAP read-back | 251 / 2,855 |
| `1ed626a03c53440bd4a4fd8d6af18512937de6b2` | Common User Charge billing/postcode branch, submit, SOAP read-back | 193 / 4,665 |

### Reverse-proxy paths visible on the wire

| Browser path | Serves | Journey use |
|---|---|---|
| `/notification/vnet/protected/notifications/{DRAFT...}/…` | Notification frontend and its store-backed handlers | Every create page |
| `/upload/vnet/protected/upload/{ref}/latest-vet-health/notification/attach` | Upload frontend | Latest veterinary health certificate |
| `/soapsearch/vnet/sanco/traces_ws/searchCertificate` | SOAP certificate search facade | QA post-submission read-back, not a browser journey page |

The reference is `DRAFT.GB.2026.NNNNNNN` while editing and becomes
`CHEDP.GB.2026.NNNNNNN` when the declaration is submitted.

---

## Integrations table

| System | Purpose / pages | Call shape | Confidence | neededForFirstPass | Concrete first-pass stub |
|---|---|---|---|---|---|
| **Notification persistence** (`notification-microservice`) | Creates the draft, saves every page, reloads the latest version and submits it. This is the current equivalent of the new journey's “build JSON and persist to Mongo” boundary. | REST JSON: `POST {notification}/notifications`; `GET …/notifications/{ref}/latest?includeDeleted=false`; `PATCH …/notifications/{ref}` with `Content-Type: application/json-patch+json`, `If-Match: {etag}` and JSON Patch operations. Submit is a patch to `status: SUBMITTED`, returning the CHEDP reference. | confirmed touchpoint on every form post / inferred server call shape | **yes** | Implement the Mongo document and patch/update it locally. Preserve a version/etag-equivalent to stop lost updates. |
| **Countries** (`countries-microservice`) | Country of origin; consignor, consignee, importer and destination addresses; approved-establishment country; transit and destination countries. | REST: `GET {countries}/countries`; `GET …?certificateType=CVEDP`; `GET …?isoCode=AF`; `GET …/ukRegions?certificateType=CVEDP`. Response is an array such as `{code, name, isEu, risk…}` and is cached by the frontend. | confirmed touchpoint and option counts / inferred REST wire shape | **yes** | Seed the 253 rendered country/territory choices (plus UI placeholder), including `GB-ENG`, `GB-SCT`, `GB-WLS`, `GB-NIR` and EU/ROW classification. |
| **Commodity taxonomy and CVEDP species/type** (`commoditycode-microservice`) | Commodity search/tree, validation of the selected tariff code, and the commodity-dependent “type” and biological-species choices on Commodity basic description. | REST: `GET {commodity}/commodity-codes/CVEDP/top-level`; `GET …/parent-code/{code}`; `GET …/commodity-code/{code}`; `GET …/all-parents/{code}`. CVEDP type/species are carried in the returned commodity/nomenclature data; the explicit `commodity-species/chedpp` endpoints are plant-only. | confirmed touchpoint / inferred REST wire shape | **yes** | Seed a small CVEDP tree containing the exercised non-fish codes, initially `0204100010 → type 16 Domestic → species 1736900 Ovis aries`, plus the chosen test variants. |
| **Approved establishments** (`approved-establishment-microservice`) | Search and select establishment(s) of origin; resolve the opaque selected ID; populate Section, Type and Status filters. | REST: `POST {approved}/approved-establishment/search?skip=0&numberOfResults=10` with filter JSON; `GET …/{id}`; `GET …/types`; `GET …/sections`; `POST …/check-expiration` with an establishment array. Search response is paginated establishment records containing ID, name, approval number, section, type, status and country. | confirmed touchpoint, pagination and selected IDs / inferred REST wire shape | **yes** | Return one canned approved establishment per seeded origin country and the static filter lists. Persist the selected establishment inline in the notification JSON. |
| **BCPs, ports of entry and control points** (`bip-microservice`) | Port of entry on Transport details; exit BCP and transit branches; validates/expands BCP codes for risk assessment. | REST: `GET {bip}/ports-of-entry/by/ched-type/CVEDP?canInspect={bool}`; `GET …/bcps?includeControlPoints=true&types=CVEDP`; `GET …/bcps/codes/{codes}` or `/bcp-codes/{codes}`. QA `BipClient` independently confirms the ports-of-entry endpoint and an array response with `code`, `bcpCode` and related fields. | confirmed touchpoint and rendered lists / inferred REST wire shape | **yes** | Hardcode the trace's 33 selectable POEs and a small exit/control-point list. Retain the origin-dependent EU/NI/ROW eligibility branch. |
| **Risk assessment** (`risk-assessment-microservice`) | Called synchronously from declaration submission for CVEDP before the final notification patch. Uses country, arrival, importer, commodity/type/species, establishments, purpose and POE/exit data. | REST JSON: `POST {risk}/risk-assessment`. Request includes `{referenceNumber, countryOfOrigin, arrivalDateTime, importer, certificateType:"CVEDP", journeyRiskCategorisation, pointOfEntry, pointOfEntryIsDummy, commodities, establishments, purpose…}`. Response includes `{assessmentDateTime, inspectionRequired, commodityResults:[{uniqueId,riskDecision,exitRiskDecision,requiredInspectionRate}], sealCheckRequired, fallback}`. | inferred from the active declaration handler; trace confirms submit but cannot see this server call | **yes** | Use a deterministic in-process response with one result per commodity, for example `inspectionRequired:"Required"` and `riskDecision:"REQUIRED"`. No live rules engine in pass one. |
| **File upload, object storage and antivirus** (`frontend-upload`, `file-upload-microservice`, File Store/Symantec scan) | Latest veterinary health certificate and accompanying-document attachments. | Browser-confirmed multipart `POST /upload/vnet/protected/upload/{ref}/latest-vet-health/notification/attach`. Downstream code posts the file to `POST {file-upload}/upload` (or `/upload/multiupload`) and returns attachment metadata such as ID, filename and content type. Scan is either File Store `PUT /syncAv/{collection}/{id}` expecting `Content-Scan: Clean`, or the configured scanner library. | confirmed upload / inferred storage and scan calls | **no** | Record `{filename, contentType, attachmentId:"stub-…"}` without storing bytes; scan always returns clean. |
| **Customer and economic-operator services** | Logged-in organisation/person-responsible data; search/reuse/create consignor, consignee and importer; Common User Charge postcode, billing address and contact pages. | REST: `GET {customer}/customer/{id}?organisations=…`; `GET …/customer/address-lookup/{postcode}`; billing-detail GET/PATCH calls. Economic operator: `POST …/economic-operator/search?skip=&numberOfResults=&includePublic=` with search JSON; `GET …/{id}`; `POST` create; `PUT` update with `If-Match`. | confirmed page touchpoints, including postcode results / inferred server call shapes | **no** | Use a fixed session user/org, allow manual inline party/address entry, and return canned addresses for the CUC test postcode. Do not implement a reusable address book. |
| **Trade Charge** (Azure Service Bus `TRADE_CHARGE_QUEUE_NAME`) | Optional Common User Charge branch. On a chargeable CVEDP submission, sends billing and consignment data to the charging service. | Queue message, JSON body with `ChedNumber`, `ChedType`, `Purpose`, organisation, submission/arrival timestamps, PO number, billing email/telephone/address, risk rating, commodity-line count, version and `IsChargeable`; content type JSON, random correlation/session IDs. | CUC pages confirmed in trace / queue send inferred from CHED-P submission rule | **no** | Persist billing fields only; no queue producer. |
| **Certificate/PDF renderer** (`certificate-microservice`) | Generates the printable certificate/review PDF after creation. | `POST {certificate}/certificate/{reference}?url={baseUrl}`, request body HTML with `Content-Type: text/html`, response `arraybuffer` PDF. | inferred call shape; a PDF navigation is present after submission but the server call is not browser-visible | **no** | Render the HTML review/confirmation only, or expose a simple local print stylesheet. |
| **SOAP certificate search/read-back facade** | QA verifies that the submitted CHED-P can be retrieved and inspects the mapped CVEDProduct. This is a read interface, not evidence that the create frontend itself submits by SOAP. | `POST /soapsearch/vnet/sanco/traces_ws/searchCertificate`, `Content-Type: text/xml`, bearer auth and `INS-ConversationId`. First body is `CertificateRequest` with `SearchCriterionCVEDAnimalProduct/ReferenceNumber`; response supplies `RequestIdentifier`. Second body is `CertificatePoll`; response contains `CVEDProduct`. | **confirmed on the wire** in three traces and corroborated by `SoapSearchClient.ts` | **no** | Omit the SOAP facade. Verify the Mongo document directly in pass one. |
| **Notification event topic / data analytics** (Azure Service Bus `SERVICE_BUS_TOPIC_NAME`) | Status/risk changes are published downstream as the full notification plus properties such as `notification_type=CVEDP`, old/new status, reference and BCP name. No create page consumes the response. | Queue/topic message: JSON notification body; `messageId={reference}_{uuid}`, partition key and subject = reference; application properties include `subscription=data-analytics`, `old_status`, `new_status`, `reference_id`, and optional risk/BCP fields. | inferred from active notification post-processing code; not trace-visible | **no** | No-op event publisher. |
| **GOV.UK Notify pipeline** (`notify-microservice`, `NOTIFY_QUEUE_NAME`) | Downstream status/outcome messages. No create-trace network call or confirmed submission-confirmation email was found. | Notification service can enqueue JSON personalisation; notify service then calls Trade Platform Notify `POST /trade-notify/v1`. | inferred client/queue; no observed CHED-P create call | **no** | No-op. |
| **GVMS / NCTS** (`gvms-microservice`) | Goods movement page records GVMS Yes/No, Common Transit Yes/No and an optional NCTS MRN. | The browser posts plain fields (`ncts-mrn`, `ctc-question`, `gvms-question`). No live validation request exists on the create path. The GVMS service found in code consumes an arrival-time queue asynchronously rather than servicing this form. | confirmed field capture / **gap** for any create-time integration | **no** | Store the booleans/MRN as entered; do not validate externally. |
| **Defra ID / OpenID** | Authenticated access to all protected pages and session-derived user/organisation. | Browser session cookies plus per-form hapi `crumb`; upstream OIDC. The trace's `POST …/ad/sign` calls belong to the QA harness minting a token for SOAP verification, not to the end-user page flow. | confirmed authenticated session / inferred identity-provider call | **no** | Disable auth or install a fixed development user/org. |
| **Dynamics / CRM** (`imports-crm-service`) | Possible upstream source of customer/organisation data. The QA repo has a Dynamics OData client only for CHED-PP plants. No CHED-P notification entity/client was found. | No CHED-P OData method/path or payload is evidenced. | **gap** | **no** | Fixed user/org data. Do not invent a CHED-P Dynamics write. |

`ipaffs-referencedata-microservice` contains legacy/general reference endpoints, but the current CHED-P
frontend boundary calls the dedicated countries, commodity-code, approved-establishment and BIP
services above. It is therefore not counted as a separate live dependency.

---

## Reference-data sources table

| List | Source | Rough size | neededForFirstPass | Rendered/cross-check evidence |
|---|---|---:|---|---|
| **Countries and territories** | countries-microservice, primarily `?certificateType=CVEDP`, plus UK regions | 253 choices + placeholder on origin; 250 choices + placeholder on establishment/address variants | **yes — static seed** | `country-of-origin.json`: `optionCount=254`; `search-approved-establishment.json`: `251`. Includes UK constituent countries, so do not replace blindly with a 249-entry ISO-country list. |
| **Commodity codes** | commoditycode-microservice CVEDP tariff/nomenclature tree | 36 rendered top-level chapters; full eligible leaf set is many thousands (exact current cardinality not exposed by the trace) | **yes — small seeded tree** | `search-commodity.json`: 36 chapters: 02, 03, 04, 05, 06, 09, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 28, 29, 30, 31, 32, 33, 35, 38, 39, 41, 42, 43, 51, 67, 71, 96, 97, 99. Use only non-fish examples in CHED-P pass one. |
| **Commodity type / biological species; EPPO boundary** | CVEDP commodity/nomenclature response and biological taxonomy. EPPO endpoints/data are CHED-PP plant-specific. | Dynamic by commodity: observed 1 type + 1 species for `0204100010`; the global biological taxonomy is large and exact CVEDP cardinality is a gap. EPPO choices required by CHED-P: **0**. | **yes — seed per chosen code; no EPPO** | `commodity-basic-description.json`: `Domestic (16)` and `Ovis aries (1736900)` for lamb. Fish values in that file are boundary evidence only and must not seed this journey. |
| **BCPs / ports of entry** | bip-microservice `ports-of-entry/by/ched-type/CVEDP`, filtered by inspection eligibility and origin branch | 33 choices + placeholder in the main traced transport page; varies for EU, Northern Ireland and RoW | **yes — static seed** | `transport-details.json`: `optionCount=34`, including GBBRS, GBSEV, GBFXT, GBLHRA, GBTIL. QA tests confirm the origin-dependent list, so 34 is not universal. |
| **Control points / exit BCPs** | bip-microservice, including `bcps?includeControlPoints=true&types=CVEDP` and code expansion | Trace variants rendered 33 or 39 choices + placeholder | **yes — small static seed** | `transit-exit-bcp.json` / about-consignment variants: `bcp-transit-third-country` has `optionCount=34` and `40`. Treat this as variant/source drift, not one canonical count. |
| **Approved-establishment filter vocabulary** | approved-establishment-microservice `/sections`, `/types`, search status | 56 sections, 96 types, 1 selectable status, each with a placeholder where rendered | **yes — static seed** | `search-approved-establishment.json`: section `57`, type `97`, status `2`; search returns 10 logical results per page. |
| **Package types** | Static CHED-P/CHED-D frontend map | 26 values + placeholder | **yes — hardcode** | `commodity-extended-description.json`: `optionCount=27` (Bag, Bale, Balloon Protected, Block, Box, Can, …, Vial). |
| **Quantity types** | Not used by CHED-P; CHED-P captures package count, net weight and gross weight in kg/units. Quantity-type mapping is CHED-PP-specific. | **0** CHED-P choices | **n/a** | No quantity-type field in CHED-P page JSON; app code has `QuantityTypeRule` only under CHED-PP processing. |
| **Document types** | Static frontend document-type map with journey/feature filtering | 13 active values + placeholder in the captured CHED-P page; underlying CHEDP map is slightly larger | **yes — hardcode captured active list** | `accompanying-documents.json`: `optionCount=14`, including Veterinary health certificate, Air waybill, Bill of lading, Commercial invoice, Import permit, lab results and Other. Catch certificate is deliberately excluded below. |

---

## Captured request/response examples

All tokens, cookies, CSRF crumbs and user-identification credentials are redacted. The trace archive
contains live-looking authentication material and must not be copied into requirements.

### Create draft — trace `94d29a16`, request 33

```http
POST /notification/vnet/protected/notifications/consignment/page-1
Content-Type: application/x-www-form-urlencoded

crumb=[redacted]&cert-type=CVEDP

HTTP/2 302
Location: /notification/vnet/protected/notifications/consignment-for?type=CVEDP
```

This confirms the internal certificate type `CVEDP`.

### Country page save — trace `94d29a16`, request 70

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525975/consignment/page-2
Content-Type: application/x-www-form-urlencoded

etag=%22000000000000BD2850%22
&navigation-target-page=consignment/page-3
&origin-country=AF
&consigned-country=AF
&conform-uk-regulations=true
&transport-details-required=true

HTTP/2 302
Location: …/consignment/page-3
```

The response is a redirect, not the countries-service response; the backend call is hidden by SSR.

### Commodity lookup and selected CVEDP classification — trace `94d29a16`, requests 86 and 121

```http
POST …/consignment/page-3?tab=commodity-code-search

selectedCommodity=root
&commodity-text-input=0204100010
&action=search

HTTP/2 302
Location: …/consignment/page-4?commodity-selected-code=0204100010
```

```http
POST …/consignment/page-4?commodity-selected-code=0204100010

species=1736900
&commodity-selected-code=0204100010
&type-id=16
&class-id=1736900
&addCommodity=false

HTTP/2 302
Location: …/consignment/page-5
```

The rendered mapping is `0204100010 → Domestic (16) → Ovis aries (1736900)`.

### Approved-establishment selection — trace `94d29a16`, request 318

```http
POST …/notifications/DRAFT.GB.2026.1525975/veterinary-establishments
Content-Type: application/x-www-form-urlencoded

etag=[redacted-for-brevity]&add-id=11b4e363-8839-ccf7-d0ca-7dc35cf50b6e

HTTP/2 302
Location: …/establishment-of-origin
```

Trace `07531e0d…` repeats this pattern ten times. `add-id` is an opaque establishment identifier; it
must be resolved through the service rather than parsed.

### Transport / BCP and goods-movement capture — trace `94d29a16`, requests 537 and 571

```http
POST …/transport/before-bip

bcp=GBTIL
&transport-means-before=plane
&identification=F12345
&consignment-in-container=false
&document=certificate
&arrival-date-day=…
&arrival-date-month=…
&arrival-date-year=…

HTTP/2 302
Location: …/transport/details
```

```http
POST …/transport/goods-movement-services

ncts-mrn=
&ctc-question=NO
&gvms-question=No

HTTP/2 302
```

No GVMS/NCTS API request follows the second post.

### File upload — trace `94d29a16`, request 250

```http
POST /upload/vnet/protected/upload/DRAFT.GB.2026.1525975/
     latest-vet-health/notification/attach?source-page=latest-health-certificate
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary…
Content-Length: 13189

[multipart file and form fields]

HTTP/2 302
Location: …/latest-certificate?success=1
```

The observed duration was about 2.2 seconds. The redirect confirms success but does not expose the
downstream attachment/scan response.

### Common User Charge postcode lookup — trace `1ed626a0`, requests 4493 and 4510

```http
POST …/billing-details/find-address?source=IDM

postalCode=B693NE

HTTP/2 302
Location: …/billing-details/select-address?postcode=B693NE
```

```http
POST …/billing-details/select-address

postalCode=B693NE
&addressListBox=1

HTTP/2 302
Location: …/billing-details/confirm
```

The next page rendered 46 returned address choices plus its prompt. The server-side
`GET /customer/address-lookup/B693NE` is inferred from the outbound client.

### Declaration submit — trace `94d29a16`, request 792

```http
POST …/notifications/DRAFT.GB.2026.1525975/declaration

submissionDate=16+July+2026

HTTP/2 302
Location: …/notifications/CHEDP.GB.2026.1525975/confirmation
```

The handler calls risk assessment before the notification PATCH. The trace confirms the declaration
and reference transition, while the risk call itself remains server-to-server.

### SOAP certificate request and poll — trace `94d29a16`, requests 879 and 881

```http
POST https://importnotification-api-static-snd.azure.defra.cloud/
     soapsearch/vnet/sanco/traces_ws/searchCertificate
Content-Type: text/xml
Authorization: Bearer [redacted]
INS-ConversationId: [redacted]
```

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:trac="traceswsns">
  <soapenv:Body>
    <trac:CertificateRequest>
      <trac:XMLSchemaVersion>2.0</trac:XMLSchemaVersion>
      <trac:UserIdentification>[redacted]</trac:UserIdentification>
      <trac:Request>
        <trac:SearchCriterionCVEDAnimalProduct>
          <trac:ReferenceNumber>CHEDP.GB.2026.1525975</trac:ReferenceNumber>
        </trac:SearchCriterionCVEDAnimalProduct>
      </trac:Request>
    </trac:CertificateRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

```xml
<CertificateRequestResult>
  <OperationCode>0</OperationCode>
  <RequestIdentifier>1784218287912</RequestIdentifier>
</CertificateRequestResult>
```

The client then sends `CertificatePoll` with that identifier. The captured response contains:

```xml
<CVEDProduct>
  <Consignment>
    <Status>new</Status>
    <CVEDReferenceNumber>CHEDP.GB.2026.1525975</CVEDReferenceNumber>
    <BorderInspectionPost>GBTIL1</BorderInspectionPost>
    <CountryOfOrigin>AF</CountryOfOrigin>
    …
  </Consignment>
</CVEDProduct>
```

The same two-call contract appears in traces `0a6f82fc…` and `1ed626a0…`. This is unusually strong
wire evidence for the read-back contract, but it still does **not** prove that the frontend's create
submission is a SOAP call.

### Code-derived risk contract (not visible in the browser trace)

```json
{
  "request": {
    "referenceNumber": "CHEDP.GB.2026.1525975",
    "countryOfOrigin": "AF",
    "certificateType": "CVEDP",
    "pointOfEntry": "GBTIL",
    "commodities": [
      {
        "code": "0204100010",
        "species": "Ovis aries",
        "type": "Domestic"
      }
    ],
    "establishments": ["…"]
  },
  "responseShape": {
    "assessmentDateTime": "ISO-8601",
    "inspectionRequired": "Required",
    "commodityResults": [
      {
        "uniqueId": "commodity UUID",
        "riskDecision": "REQUIRED"
      }
    ],
    "fallback": false
  }
}
```

This example is deliberately labelled **code-derived**, not captured.

---

## Fish / IUU boundary

HS chapter 03, fish-species choices, catch-certificate attachment/weight handling and IUU status
belong to the separate IUU journey, even though legacy code models parts of them under `CVEDP`.
They are **not CHED-P first-pass requirements**.

In particular:

- do not seed chapter-03 examples such as `03019230`, `Anguilla anguilla` or `Anguilla spp.` into
  the CHED-P prototype;
- do not include Catch certificate in CHED-P's document-type seed;
- do not implement `isCatchCertificateRequired`, catch-certificate attachment rules or the
  enotification catch-certificate mapping here;
- the CHED-PP EPPO/species endpoints are also out of scope, but for a different reason: they are
  plant-health reference data, not IUU data.

---

## First-pass recommendation

Six system touchpoints are needed to complete a realistic CHED-P create-and-submit path, but none
needs a live remote dependency:

1. implement notification JSON persistence in Mongo;
2. seed countries, a small non-fish CVEDP commodity/species tree, one or more approved
   establishments, and the BCP/control-point lists;
3. return a deterministic local risk response before the final submit patch.

Defer upload/scanning, customer/economic-operator reuse, postcode lookup beyond a canned result,
Trade Charge, PDF generation, SOAP read-back, event topics, Notify, GVMS/NCTS, auth and
Dynamics/CRM. The first pass should stop at the persisted submitted CHED-P document and confirmation
page.
