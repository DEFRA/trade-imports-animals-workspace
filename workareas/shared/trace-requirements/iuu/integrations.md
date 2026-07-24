# IUU create journey: integrations and reference data

## Scope and evidence

This report covers the standalone IUU rebuild of the legacy CHED-P fish journey. Its primary
evidence is trace `db2d277c5c8bfcf2dc0f2278bc92dc7aa8fdf42d`, created by
`notification/ched-p/ched-p-notification.spec.ts:206` and containing the complete successful fish
submission.

The browser-facing application is server rendered. The trace shows full-page, same-origin
`GET -> POST -> 302 -> GET` navigation and no browser XHR/fetch calls to the backend
microservices. Consequently:

- a browser request or rendered option is **confirmed** and cites a trace request/action;
- a backend service call found only in an outbound client is **inferred**, even where the trace
  confirms the page needed the resulting data;
- an expected system for which the current sources contain no applicable client is a **gap**.

No cookie, token, CSRF value, username, password, subscription key or client secret is reproduced
below. Such values are shown only as `[REDACTED]`.

## Integration points

| # | System | Purpose and pages | Shape | Example request -> response | Direction | `neededForFirstPass` and approach | Confidence and evidence |
|---:|---|---|---|---|---|---|---|
| 1 | Notification persistence and reference allocation (legacy notification API; target MongoDB) | Saves the draft assembled by every create page, reloads it for later pages, and finalises `DRAFT...` as `CHEDP...` on `declaration`; used by all create pages, `review-notification`, `declaration`, `confirmation`. | Legacy REST: `GET {notifications}/notifications/{reference}/latest?includeDeleted=false`; `PATCH {notifications}/notifications/{reference}` with JSON Patch and `If-Match`; final submit `POST {notifications}/notifications` with notification JSON. Target first pass: direct Mongo insert/update of one journey JSON document. | Browser: `POST .../DRAFT.GB.2026.1525979/declaration` with `submissionDate=16 July 2026&crumb=[REDACTED]` -> `302 Location: .../CHEDP.GB.2026.1525979/confirmation`. Backend response shape is not visible in the trace. | outbound | **true**. Replace the legacy API with a Mongo repository. Store the whole journey JSON under a stable draft ID, support upsert on each page, and allocate/finalise the public reference transactionally on submit. | **inferred** for the legacy API hop; **confirmed** for the browser submit and reference transition. Evidence: trace request `4636`; `ipaffs-frontend-notification/service/src/integration/notification.js:10,29-53`. |
| 2 | Commodity code and category/species lookup | Supplies the CHED-P commodity tree, validates fish code `03019230`, and supplies stock type and species options; used by `search-commodity`, `commodity-basic-description`, `commodity-extended-description`, `add-catch-certificate-details`. | REST: `GET .../commodity-codes/{certType}/top-level`; `GET .../commodity-codes/{certType}/commodity-code/{code}`; `GET .../commodity-codes/{certType}/parent-code/{code}`; `GET .../commodity-categories/{certType-lower}-{code}`. Code DTO fields are `code`, `displayCode`, `displayCodeFull`, `description`, `certificateType`, `parentCode`, `isCommodity`, `isParent`; category DTO is `{certificateType, commodityCode, data}`. | Browser: `POST .../consignment/page-3` with `selectedCommodity=root&commodity-text-input=03019230&action=search&crumb=[REDACTED]` -> `302 .../page-4?commodity-selected-code=03019230`; then species selection posts `species=1756325&commodity-selected-code=03019230&type-id=20&class-id=1729499...` -> `302 .../page-5`. Illustrative backend response schema: `[{"code":"03019230","description":"<description>","certificateType":"CVEDP","isCommodity":true,...}]`. | outbound | **false**. Seed a versioned static chapter-03 JSON containing `03019230`, its hierarchy, `Farmed stock`/`Wild stock`, and the two traced eel species. Reject codes outside the seed with a clear “not available in prototype” result; do not call the legacy service. | **inferred** for backend calls; browser selection is **confirmed**. Evidence: trace requests `3790`, `3825`; trace actions `17`, `22`; `ipaffs-frontend-notification/service/src/integration/commodity_code.js:30-43,54-73,94-105,163-184`; `ipaffs-commoditycode-microservice/.../CommodityCodeDto.java:13-22`; `.../CommodityCategoryDto.java:15-24`. |
| 3 | Countries reference service | Supplies origin/consigned countries, trader-address countries, transit/destination countries and catch-certificate flag states; used by `country-of-origin`, `origin-of-import`, trader creation pages, `about-the-consignment`, `add-catch-certificate-details`. | REST: `GET {countries}/countries`; `GET .../countries?certificateType=CVEDP`; `GET .../countries?isoCode={code}`; `GET .../countries?risk={risk}&certificateType={type}`; `GET .../countries/nonUK`. Response is a list of country records with at least a submitted code and rendered name. | No backend country call is visible in the browser trace. Confirmed rendered examples include `France -> FR`, `Afghanistan -> AF`, and UK nation codes such as `England -> GB-ENG`. | outbound | **false**. Seed one versioned static country JSON with `{code,name,group?}`. Derive page-specific lists locally, preserving the UK-nations optgroup for address/origin pages and a separate flag-state projection. | **inferred** for the call; rendered options are **confirmed**. Evidence: trace actions `15`, `47`, `60`, `104`, `107`, `159`, `162`; `pages/add-catch-certificate-details.json`; `pages/origin-of-import.json`; `ipaffs-frontend-notification/service/src/integration/countries.js:14-18,37-40,43-68,74-90`. |
| 4 | Border Control Post / port-of-entry service | Provides ports/BCPs allowed for CHED-P and the chosen origin; used by `transport-details`, `about-the-consignment`, `review-notification`. | REST: `GET {bip}/ports-of-entry/by/ched-type/{chedType}` with optional `canInspect`; `GET {bip}/bcps?includeControlPoints=true&types={type}`; `GET {bip}/organisations?...`. QA response shape is `[{code,bcpCode,...}]`. | Illustrative backend request: `GET .../ports-of-entry/by/ched-type/CVEDP?canInspect=true` -> `[{"code":"<port-code>","bcpCode":"<bcp-code>",...}]`. Browser action selected `TILBURY (GBTIL)` from the rendered list. | outbound | **false**. Seed the 33 traced selectable entries as `{code,name}` and apply a local origin/CHED-type filter. Mark the seed as prototype data because real/dummy and inspection eligibility can change. | **inferred** for the call; option set and selected value are **confirmed**. Evidence: trace actions `115-116`; `pages/transport-details.json`; `ipaffs-frontend-notification/service/src/integration/border_inspection_post.js:60-86`; `ipaffs-qa-automation/clients/services/BipClient.ts:6-9,27-51`. |
| 5 | Approved/veterinary establishments | Finds and selects an establishment of origin; used by `approved-establishment-of-origin`, `search-for-approved-establishment`, `review-notification`. | REST: `POST {approvedEstablishment}/approved-establishment/search?skip={n}&numberOfResults={n}` with search criteria; `GET .../approved-establishment/{id}`; `GET .../types`; `GET .../sections`. The browser route is server rendered and country-filtered. | Browser: `POST .../veterinary-establishments` with `add-id=<establishment-id>&crumb=[REDACTED]` -> `302 .../establishment-of-origin`. The exact backend search response was not visible. | outbound | **false**. Use a small fixture list with stable IDs and the fields needed by the review JSON, plus manual-entry fallback. Do not pretend the fixture is an authoritative approval register. | **inferred** for the service call; selection is **confirmed**. Evidence: trace request `4164`; `pages/search-for-approved-establishment.json`; `ipaffs-frontend-notification/service/src/integration/approved_establishment.js:9-42`. |
| 6 | Catch-certificate file upload, blob storage and antivirus scanning | Accepts one or more catch-certificate files, scans them, stores them and returns attachment metadata; used by `attach-catch-certificate`, `manage-catch-certificates`, `add-catch-certificate-details`, `review-notification`. | Browser multipart POST to the upload frontend. Backend REST: `POST {fileUpload}/upload/multiupload` with repeated `attachments` parts, maximum 10. Response: HTTP `207` with `{fileResponses:[{filename,id,contentType,status,messageStatus?,errorMessage?}],metadata:{total,success,failure}}`. Each file is antivirus-scanned before blob upload. | Browser: `POST /upload/.../notification/upload-catch-certificates`, `Content-Type: multipart/form-data`, `Content-Length: 13088` -> `302 .../manage-catch-certificates?source=add&success=1`. Binary content and security headers are omitted. | outbound | **false**. For the first pass, accept filename/content type/size only and return a deterministic fake attachment ID; persist `{id,filename,contentType,scanStatus:"stubbed"}` in Mongo. Do not store bytes and do not claim a scan occurred. | **inferred** for the backend upload/scan hops; browser upload and successful redirect are **confirmed**. Evidence: trace requests `3953`, `4016`; `ipaffs-frontend-upload/service/src/services/file_upload.js:30-47`; `.../routes/handlers/upload/catch_certificates_upload.js:36-99`; `ipaffs-file-upload-microservice/.../UploadResource.java:85-113`; `.../AttachmentStorageService.java:58-99`; `.../FileResponse.java:12-27`. |
| 7 | Economic-operator address book | Searches, creates and reuses consignor, consignee and transporter records; used by `search-existing-consignor`, `consignor-creation`, `search-existing-consignee`, `consignee-creation`, `search-existing-transporter`, `transporter-creation`, confirmation pages and `traders-addresses`. | REST: `GET .../economic-operator/{id}`; `POST .../economic-operator/search?skip={n}&numberOfResults={n}&includePublic={bool}`; `POST .../economic-operator`; `PUT .../economic-operator/{id}` with ETag. | The trace confirms the server-rendered search/new/confirmation pages, but no backend request or response body. Illustrative create request: `POST .../economic-operator {name,address,contact,...}` -> an operator record containing its stable ID. | outbound | **false**. Capture the three parties inline in the journey JSON. Offer an in-memory “use these details again” convenience only; defer the shared address book and deduplication. | **inferred**. Evidence: trace actions `91-111`; `pages/search-existing-consignor.json`, `pages/search-existing-consignee.json`, `pages/search-existing-transporter.json`; `ipaffs-frontend-notification/service/src/integration/economic_operator.js:11-52`. |
| 8 | Field-configuration service | Determines commodity-specific pages, fields and option visibility, including the fish/catch-certificate branch; used by `commodity-basic-description`, `commodity-extended-description`, `catch-certificate-needed`, `accompanying-documents`. | REST: `GET {fieldConfig}/configurations/v2/{certType}-{commodityCode}?complementName={optional}` -> configuration JSON containing pages/sections/components/options. | Illustrative request: `GET .../configurations/v2/CVEDP-03019230` -> `{...commodity-specific configuration...}`. It was not visible in the browser trace. | outbound | **false**. Replace it with a checked-in, versioned IUU configuration for the traced `03019230` path. Keep routing rules explicit in application code rather than recreating a general dynamic-form engine. | **inferred**. Evidence: `ipaffs-frontend-notification/service/src/integration/field_config.js:11-25`; fish routing confirmed by trace actions `17-47`. |
| 9 | Risk assessment / journey categorisation | Produces the post-submission inspection outcome and may support the risk category flow; used by `select-risk-category`, `declaration`, `confirmation`. | REST: `POST {riskAssessment}/risk-assessment` with notification JSON, or `POST .../journey-risk-categorisation`; response includes a risk decision/categorisation used to update the notification. | Browser confirmation rendered `Inspection required` and `Required at London Tilbury`; the backend request/response was not visible. | outbound | **false**. Keep the user’s selected category in JSON and return a clearly labelled deterministic stub such as `{status:"not-assessed", source:"prototype"}`. Do not imply a regulatory decision. | **inferred** for the service call; the resulting confirmation state is **confirmed**. Evidence: trace action `175`; `pages/select-risk-category.json`; `pages/confirmation.json`; `ipaffs-frontend-notification/service/src/integration/risk_assessment.js:7-42`. |
| 10 | Defra identity, permissions and customer profile | Authenticates the user, authorises page/actions and resolves their organisation/contact context; used by every protected page and the declaration. | OIDC/JWT session inbound; outbound profile/authorisation REST includes `GET {permissions}/roles/{role}/permissions` and customer calls such as `GET {customer}/customer/organisations/{id}?enrolled=true&reduced=true`. | Every protected trace request carries session cookies and every form carries a CSRF crumb; all values are `[REDACTED]`. Backend profile responses were not visible. | both | **false**. Run first pass with a fixed local prototype user and organisation behind an explicit development-only auth adapter. Persist `submittedBy` from that adapter; do not copy trace identities or tokens. | **inferred** for OIDC/profile calls; authenticated session and CSRF usage are **confirmed**. Evidence: trace requests `3790`, `3953`, `4636`; `ipaffs-frontend-notification/service/src/integration/permissions.js:13-55`; `.../customer.js:6-21,49-59`. |
| 11 | CHED certificate PDF generation | Renders a submitted CHED-P certificate as PDF; used after creation from the notification/certificate view, not to complete data capture. | REST: `POST {certificate}/certificate/{reference}?url={baseUrl}` with rendered HTML; response is binary PDF/arraybuffer. CVEDP selects view `certificate/cvedp_certificate`. | Illustrative request: `POST .../certificate/CHEDP.GB.2026.1525979?url=<base-url>` with HTML -> `%PDF-...` bytes. No such call fired in this trace. | outbound | **false**. Defer PDF generation. First pass confirmation shows the stored reference and offers JSON download only. | **inferred**. Evidence: `ipaffs-frontend-notification/service/src/integration/certificate.js:9-19`; `.../routes/handlers/importer/certificates.js:49`; no certificate call in the fish trace request log. |
| 12 | Azure Service Bus notification event topic | Publishes notification state changes for asynchronous downstream consumers after persistence/submission; used by `declaration`/post-submit processing. | Queue/topic message body is the notification JSON. Properties include `notification_type`, `old_status`, `new_status`, `reference_id`, `subscription`; message ID and partition key are based on the reference. Physical topic name comes from `SERVICE_BUS_TOPIC_NAME`. | Illustrative event: body `{...notification...}`, properties `{notification_type:"CVEDP",old_status:"<old-status>",new_status:"<new-status>",reference_id:"CHEDP.GB.2026.1525979",subscription:"data-analytics"}`. Exact status values for this trace were not captured. | outbound | **false**. Defer publishing. Record an internal outbox field `{status:"not-published"}` only if later phases need to model downstream state; first pass ends at Mongo. | **inferred**. Evidence: `ipaffs-notification-microservice/.../NotificationDispatchService.java:42-80`; `.../NotificationConfiguration.java:137-141,254-261`; `.../application-k8s.yml:131-138`. |
| 13 | EU Trade Platform / TRACES SOAP search and submission surface | Makes submitted CVEDP/CHED-P certificates available to the legacy Trade Platform and allows downstream verification; post-submit, not required to assemble the journey. | SOAP/XML. QA posts `CertificateRequest` containing `SearchCriterionCVEDAnimalProduct/ReferenceNumber`, receives `OperationCode` and `RequestIdentifier`, then polls for certificate XML. Auth headers and SOAP credentials are `[REDACTED]`. | `POST <SOAP endpoint>` with `<CertificateRequest>...<UserIdentification>[REDACTED]</UserIdentification>...<ReferenceNumber>CHEDP.GB.2026.1525979</ReferenceNumber>...</CertificateRequest>` -> first response containing `<OperationCode>0</OperationCode><RequestIdentifier>...</RequestIdentifier>`, followed by certificate poll XML. | outbound | **false**. Defer SOAP completely. Add an explicit integration test seam so a later adapter can map the persisted IUU JSON without changing page handlers. | **inferred**. Evidence: `ipaffs-qa-automation/clients/services/SoapSearchClient.ts:69-128,139-150`; `ipaffs-qa-automation/resources/soap-search/ched-p-soap-certificate-request.xml:1-16`; CHED-P downstream assertion in `tests/notification/ched-p/ched-p-cuc.spec.ts:34`. |
| 14 | Microsoft Dynamics 365 POAO certificate surface | Expected downstream reporting/verification for a submitted CHED-P/IUU certificate; no create page directly uses it. | Expected OData entity `cvedp_certificate`, but the applicable base URL, auth flow, entity path, request mapping and response shape are not present in the current QA checkout. The only current Dynamics client is plants-specific. | No defensible request/response example can be given. `cvedp_certificate` in current application code is also the name of an HTML certificate view, not evidence of an OData entity call. | outbound | **false**. Defer. Before implementation, obtain the POAO Dynamics client/contract or confirm that this downstream has been retired. | **gap**. The phase brief names `cvedp_certificate` and “same POAO Dynamics client as CHED-P”, but `ipaffs-qa-automation/clients/services/` contains only `DynamicsPlantsClient.ts`, and `workflows/dynamics/` only `dynamics-plants-workflows.ts`. Application evidence for the same string is an HTML view mapping: `ipaffs-frontend-notification/service/src/routes/handlers/importer/certificates.js:49`. |
| 15 | Goods Vehicle Movement Service (GVMS) arrival feed | The create page records whether GVMS/CTC will be used; later an inbound arrival event can update arrival time and influence the confirmation outcome; used by `goods-movement-services` and post-submit processing. | Browser form data is persisted with the notification. Separately, `gvms-microservice` consumes `GVMS_QUEUE_NAME` messages shaped `{referenceNumber,entryReference,localDateTimeOfArrival}` and patches the notification. | Browser: `POST .../goods-movement-services` with `ncts-mrn=&ctc-question=NO&gvms-question=No&crumb=[REDACTED]` -> `302 .../transport`. Inbound queue example: `{"referenceNumber":"CHEDP...","entryReference":"<entry>","localDateTimeOfArrival":"<ISO datetime>"}`. | inbound | **false**. Persist the page answers and optional MRN in JSON; do not consume GVMS events. Confirmation must not display a live-GVMS claim in the prototype. | **inferred** for the GVMS feed; browser answers are **confirmed**. Evidence: trace request `4417`; `pages/goods-movement-services.json`; `ipaffs-gvms-microservice/.../GvmsMessage.java:10-15`; `.../KedaJobRunner.java:23-24,61-87`; `.../ConsumeLocalTimeOfArrivalService.java:23-55`. |
| 16 | GOV.UK Notify / Trade Platform notifications | Sends downstream email or text messages triggered by notification state; no create page directly calls it. | Azure Service Bus `NOTIFY_QUEUE_NAME` message `{messageType,emails,phoneNumbers,messageTemplateId,messagePersonalisation}`; the consumer can call the Trade Platform Notify API. | No notify event appears in the browser trace. Illustrative queue payload: `{"messageType":"EMAIL","emails":["<recipient>"],"messageTemplateId":"<template>","messagePersonalisation":{...}}`. | outbound | **false**. Defer delivery. In non-production, log a structured “notification suppressed” event without recipient personal data. | **inferred**. Evidence: `ipaffs-notify-microservice/.../KedaJobRunner.java:33-35,49-66`; `.../model/QueueMessage.java:13-19`; no notify call in the fish trace request log. |

EPPO lookup is deliberately absent: it is a CHED-PP plants concern, and neither the fish trace nor
the CHED-P clients/pages provide an IUU EPPO requirement.

## Reference-data sources

Counts distinguish selectable values from placeholders. Where a page JSON stores only a sample of a
long list, the count comes from its trace-backed `evidence` field rather than the truncated
`options` sample.

| # | List | Source and approximate size | Used by pages | First-pass approach | Confidence and evidence |
|---:|---|---|---|---|---|
| 1 | General countries/territories and UK nations | Countries service. **253 selectable entries + 1 placeholder = 254 rendered options**. Submitted values are codes; the list includes `GB-ENG`, `GB-NIR`, `GB-SCT`, `GB-WLS` within a UK optgroup. | `country-of-origin`, `origin-of-import`, trader/branch creation, transit/destination country fields | Seed versioned `{code,name,group?}` JSON from the captured list; retain the UK grouping and codes. | **confirmed** count/shape: trace actions `15`, `104`, `107`, `159`, `162`; `pages/origin-of-import.json`; `pages/consignee-creation.json`; source call **inferred** from `countries.js:37-68`. |
| 2 | Catch-certificate flag states | Countries service projection. **250 selectable countries + 1 “Select flag state” placeholder = 251 options**. | `add-catch-certificate-details` | Derive from the static country seed using a separately versioned inclusion rule. For the traced first pass, include all 250 captured values and submit ISO code (for example `FR`). | **confirmed**: trace actions `47`, `60`; `pages/add-catch-certificate-details.json` field evidence says 251 and confirms `France -> FR`. |
| 3 | CHED-P commodity hierarchy and chapter-03 fish codes | Commodity-code service. **14 top-level CHED-P chapters rendered**, including `03 FISH AND CRUSTACEANS, MOLLUSCS AND OTHER AQUATIC INVERTEBRATES`; descendant cardinality is not captured. Exact code used: **`03019230`**. | `search-commodity`, `commodity-basic-description`, `commodity-extended-description` | Seed the traced chapter-03 path and code `03019230` only, with stable IDs and labels. Record broader chapter-03 coverage as backlog rather than inventing a size. | **confirmed** rendered list/code: trace actions `17`, `22`; `pages/search-commodity.json`. Source **inferred** from `commodity_code.js:30-43,54-73,94-105`. |
| 4 | Commodity stock/type attributes | Commodity category data. **2 options: `Farmed stock`, `Wild stock`**. The trace selected a category ID but the persisted display/value contract was not directly captured. | `commodity-basic-description` | Store the two exact labels with stable prototype codes; map to legacy IDs only when the real adapter is introduced. | **confirmed** options: trace action `22`; `pages/commodity-basic-description.json`. Source **inferred** from `commodity_code.js:163-184`. |
| 5 | Species for commodity `03019230` | Commodity category/species data. **2 options: `Anguilla anguilla`, `Anguilla spp.`**; traced selected species ID `1756325` is `Anguilla spp.`. Catch-certificate species rows are derived from species already added to the consignment, not from an independent flag-state call. | `commodity-basic-description`, `add-catch-certificate-details`, `review-notification` | Seed both exact species as `{id,name,commodityCode}` and derive catch-certificate checkboxes from the notification’s commodity lines. | **confirmed**: trace actions `22`, `47`; trace request `3987`; `pages/commodity-basic-description.json`; `pages/add-catch-certificate-details.json`. Backend entity shape **inferred** from `ipaffs-commoditycode-microservice/.../ChedpSpecies.java:21-29`. |
| 6 | Package types for the traced fish commodity | Commodity/field configuration. **26 selectable values + 1 placeholder = 27 rendered options**. The wider QA catalogue contains 33, so it must not replace the rendered fish subset. | `commodity-extended-description` | Seed the exact 26-value rendered subset listed below. Keep the commodity-to-package-list mapping versioned. | **confirmed**: trace action `33`; `pages/commodity-extended-description.json`. Wider catalogue: `ipaffs-qa-automation/types/package-type.ts:1-34`. |
| 7 | Quantity types / weight units | **No selectable quantity-type list was rendered (0 options)** for `03019230`. The page instead has numeric `Net weight (kg/units)`, `Number of packages`, and `Total gross weight` fields. The intended kg-versus-units derivation is unresolved. | `commodity-extended-description`, `review-notification` | Do not invent a dropdown. Persist the numeric values exactly as captured and leave `quantityUnit` unset/`null` in the prototype pending a product/domain decision. | **confirmed** absence and labels: trace action `33`; `pages/commodity-extended-description.json`. CHED-PP-only quantity-type behaviour is not applicable evidence for IUU. |
| 8 | Accompanying-document types | CHED-P static/feature-flag map. **13 selectable values + 1 placeholder = 14 rendered options**. The `NONSPSIUU_CHEDP_DOCUMENT_TYPES` code map has 14 entries including `Health certificate`, but the rendered page omitted that entry in this context; catch certificates have their own upload flow. | `accompanying-documents`, `document-upload`, `review-notification` | Seed the exact 13 rendered values below. Keep catch certificates and the latest health certificate as separate document categories, matching the observed journey. | **confirmed** rendered list: trace action `76`; `pages/accompanying-documents.json`. Static source/filter **inferred**: `document_type_constants.js:37-68`; `transformers/maps/document_type.js:16-31`. |
| 9 | Border Control Posts / ports of entry | BIP service. **33 selectable ports + 1 placeholder = 34 rendered options**; `TILBURY (GBTIL)` selected. | `transport-details`, `about-the-consignment`, `review-notification` | Seed all 33 captured `{code,name}` entries. Treat eligibility filtering as a prototype rule until the live service is integrated. | **confirmed**: trace actions `115-116`; `pages/transport-details.json`. Service source **inferred** from `border_inspection_post.js:60-86`. |
| 10 | Approved/veterinary establishments | Approved-establishment service. Large searchable register; total size was not exposed by the trace. | `approved-establishment-of-origin`, `search-for-approved-establishment`, `review-notification` | Supply a small labelled fixture list and manual-entry fallback; never present it as the live approval register. | **confirmed** that a selection was made: trace request `4164`; total size **gap**. Source call **inferred** from `approved_establishment.js:9-42`. |
| 11 | Means of transport to port of entry | Rendered/static vocabulary. **4 selectable values + 1 placeholder = 5 options**: `Airplane`, `Railway`, `Road vehicle`, `Vessel`. | `transport-details`, `means-of-transport-after-bcp`, `review-notification` | Seed the four exact values in local JSON. | **confirmed**: trace action `119`; `pages/transport-details.json`. |
| 12 | Storage temperature | Rendered/static vocabulary. **3 options: `Ambient`, `Chilled`, `Frozen`**. | `commodity-additional-details`, `review-notification` | Seed the three exact values. | **confirmed**: trace action `36`; `pages/commodity-additional-details.json`. |
| 13 | Risk category | Journey/risk vocabulary. **3 options: `High risk`, `Medium risk`, `Low risk`**. This is the user-facing list, separate from the downstream risk-decision response. | `select-risk-category`, health-certificate branch, `review-notification` | Seed the three exact values and persist the chosen value; do not calculate a regulatory outcome. | **confirmed**: `pages/select-risk-category.json`; selection flow corroborated by `ipaffs-qa-automation/types/risk-category.ts:1-5`. |

### Exact IUU package-type seed (26 values)

`Bag`; `Bale`; `Balloon Protected`; `Block`; `Box`; `Can`; `Carton`; `Case`; `Cask`;
`Coffer`; `Container, not otherwise specified as transport equipment`; `Crate`; `Drum`;
`In Bulk`; `Jar`; `Other`; `Package`; `Pail`; `Pallet`; `Pallet Box`; `Polystyrene Box`;
`Tank`; `Tote`; `Tray`; `Tube`; `Vial`.

Evidence: trace action `33`; `pages/commodity-extended-description.json`.

### Exact accompanying-document seed (13 values)

`Veterinary health certificate`; `Air waybill`; `Bill of lading`; `Commercial invoice`;
`Customs declaration`; `Import permit`;
`Laboratory Sampling results for Aflatoxin (Reg 2019/1793)`;
`Letter of authority (Directive 2008/61/EC)`; `Processing statement`; `Proof of storage`;
`Rail waybill`; `Sea waybill`; `Other`.

Evidence: trace action `76`; `pages/accompanying-documents.json`.

## Captured browser request/response examples

These are the real browser-facing calls. They must not be mistaken for direct browser-to-microservice
calls.

### Commodity-code search

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/consignment/page-3
Content-Type: application/x-www-form-urlencoded

crumb=[REDACTED]&etag=<etag>&selectedCommodity=root&commodityDetailsPage=&commodity-text-input=03019230&action=search

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/consignment/page-4?commodity-selected-code=03019230
```

Evidence: trace request `3790`.

### Catch-certificate upload

```http
POST /upload/vnet/protected/upload/DRAFT.GB.2026.1525979/notification/upload-catch-certificates
Content-Type: multipart/form-data; boundary=[REDACTED]
Content-Length: 13088

[multipart file content omitted]

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/manage-catch-certificates?source=add&success=1
```

Evidence: trace requests `3953`, `4016`.

### IUU catch-certificate metadata and species association

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/add-catch-certificate-details/attachment/<attachment-id>
Content-Type: application/x-www-form-urlencoded

crumb=[REDACTED]
&etag=<etag>
&attachmentId=<attachment-id>
&number-of-catch-certificates=1
&catch-certificate-reference-1=CatchCertificateRef-qf90m0il
&date-of-issue-day-1=04
&date-of-issue-month-1=03
&date-of-issue-year-1=2024
&flag-state-1=FR
&select-all-checkbox-1=select-all-checkbox
&species-1756325-1=1756325
&button-save-and-continue=Save+and+continue

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/manage-catch-certificates
```

Evidence: trace request `3987`. A second certificate follows the same shape in request `4050`.

### Establishment selection

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/veterinary-establishments
Content-Type: application/x-www-form-urlencoded

crumb=[REDACTED]&etag=<etag>&add-id=11b4e363-8839-ccf7-d0ca-7dc35cf50b6e

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/establishment-of-origin
```

Evidence: trace request `4164`.

### GVMS/CTC answers

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/goods-movement-services
Content-Type: application/x-www-form-urlencoded

crumb=[REDACTED]&etag=<etag>&ncts-mrn=&ctc-question=NO&gvms-question=No&button-save-and-continue=Save+and+continue

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/transport
```

Evidence: trace request `4417`.

### Declaration and public-reference finalisation

```http
POST /notification/vnet/protected/notifications/DRAFT.GB.2026.1525979/declaration
Content-Type: application/x-www-form-urlencoded

crumb=[REDACTED]&etag=<etag>&submissionDate=16+July+2026

HTTP/1.1 302 Found
Location: /notification/vnet/protected/notifications/CHEDP.GB.2026.1525979/confirmation
```

Evidence: trace request `4636`.

## First-pass boundary and unresolved contracts

The first pass builds one IUU journey JSON object and persists it to Mongo. Only integration **#1**
is required. All reference data is versioned local JSON, upload returns metadata without storing
bytes or claiming an antivirus scan, trader/establishment records are inline or fixtures, auth is a
development-only adapter, risk is explicitly “not assessed”, and Service Bus, SOAP, Dynamics, GVMS,
Notify and PDF output are deferred.

Contracts that must be resolved before production are:

1. whether `Net weight (kg/units)` means kg, units, or a commodity-derived unit for IUU fish;
2. the authoritative rule that turns the country catalogue into the 250-entry flag-state list;
3. the full chapter-03 commodity/species and per-commodity package-type datasets;
4. live establishment and BCP eligibility/filter semantics;
5. the current POAO Dynamics contract, or confirmation that it is no longer part of CHED-P
   submission;
6. the regulatory risk-decision contract and which downstream deliveries are mandatory at submit.

**Count:** 16 systems; 1 needed for first pass; 13 reference-data lists.
