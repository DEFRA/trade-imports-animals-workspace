# Users, ownership and auth audit

## 1. Executive summary

Sam's suspicion was right, but narrower than the raw number of identity-looking
names suggests. Of the branch's 10 concepts, **7 are `main-parity`, 0 are
ticket-only `grounded`, and 3 are `invented`**.

The three inventions are:

1. the composite journey owner `{ sub, organisation }`;
2. scalar `userId` plus the stub-only resume-by-user index; and
3. `responsiblePersonForLoad` as a mandatory, system-populated identity from
   `gov.identity`.

They are not authorised by EUDPA-288, whose scope contains no auth or ownership
work (`requirements-grounding.md:37-42`). EUDPA-306 is stronger than mere
silence: notifications currently have no organisation/owner, scoping is
deferred, and implementors are told not to infer ownership
(`requirements-grounding.md:73-77`). EUDPA-281 grounds only actor metadata in
the event envelope at submitted/amended/withdrawn time; it expressly does not
ground roles, domain `userId`, per-user scoping, notification ownership, or an
individual responsible person in the GBN-AG payload
(`requirements-grounding.md:14-35`).

Identity-looking plumbing is not automatically invented. The branch's OIDC
session, display profile, contact/person lookup scaffold, role/scope scaffold,
organisation reselection and dormant actor helper all have direct equivalents
on MAIN. Likewise, the branch's session-known journey IDs are the notification
version of MAIN's existing journey-session resource-membership gate. They do
not establish user or organisation ownership, and the real branch adapter
ignores the IDs when listing.

## 2. Verdict table

Branch paths are relative to
`trade-imports-animals-frontend`; MAIN paths are under `main-frontend/`.

| Branch concept | Verdict | Evidence on branch and MAIN | Grounding |
| --- | --- | --- | --- |
| OIDC authentication state and token-backed session | `main-parity` | Branch: `src/plugins/auth.js:14-50,102-128`; `src/server/auth/controller.js:35-59`; `src/server/server.js:63-83`. MAIN: `main-frontend/src/plugins/auth.js:14-50,102-128`; `main-frontend/src/server/auth/controller.js:31-56`; `main-frontend/src/server/server.js:63-83`. | EUDPA-22 grounds the current temporary frontend sign-in stub (`requirements-grounding.md:59-60,87`); EUDPA-308 → EUDPA-6 is the unfinished real-auth design (`requirements-grounding.md:51-55,88`). |
| Display identity (`displayName`, `email`, `name`) | `main-parity` | Branch: `src/config/nunjucks/context/context.js:25-47`; `src/server/live-animals/shared/layout.njk:34`; `src/server/common/components/service-header/template.njk:12-25`. MAIN: `main-frontend/src/config/nunjucks/context/context.js:26-47`; `main-frontend/src/server/common/components/service-header/template.njk:12-25`. Both are presentation-only. | Allowed by the EUDPA-22 sign-in stub; no ticket turns display fields into an ownership or authorisation control (`requirements-grounding.md:59-60`). |
| Contact ID / CRN / person-ID lookup chain | `main-parity` | Branch: `src/plugins/auth.js:43-50`; `src/server/auth/controller.js:43`; `src/auth/get-permissions.js:3-72`; `src/server/common/helpers/actor-helpers.js:1-6`. MAIN: `main-frontend/src/plugins/auth.js:43-50`; `main-frontend/src/server/auth/controller.js:39-50`; `main-frontend/src/auth/get-permissions.js:1-72`; `main-frontend/src/server/common/helpers/actor-helpers.js:1-6`. Both retain `contactId`, alias it to `crn`, and run the same mocked person lookup. | EUDPA-281 permits contact identity only as the B2C source of event `actor.id` (`requirements-grounding.md:18,23-29,35`). The hard-coded permission lookup is parity scaffold, not a new requirement. |
| Role, privilege and application auth scope | `main-parity` | Branch: `src/auth/get-permissions.js:1-20,72-108`; `src/server/auth/controller.js:39-54`; `src/plugins/auth.js:126-128`. MAIN: `main-frontend/src/auth/get-permissions.js:1-20,63-108`; `main-frontend/src/server/auth/controller.js:35-53`. In both, hard-coded role/scope is cached but no route, action, template or persistence call consumes it. Neither has `roleId`. | No implementation ticket grounds roles in this frontend. EUDPA-260 is still To Do and EUDPA-160 was closed and admin-only (`requirements-grounding.md:53-55,61-62,84`). It survives only because it is unchanged MAIN parity. |
| Organisation / relationship selection | `main-parity` | Branch: `src/plugins/auth.js:43-50,71-85`; `src/server/auth/index.js:40-47`; `src/server/auth/controller.js:43,102-111`. MAIN: `main-frontend/src/plugins/auth.js:43-50,71-87`; `main-frontend/src/server/auth/index.js:41-47`; `main-frontend/src/server/auth/controller.js:39-50,102-111`. | EUDPA-287 cites MAIN's `currentRelationshipId` → `organisationId` mapping as the established sign-in pattern, but its org-scoped address-book requirement belongs to INS, not this frontend (`requirements-grounding.md:68-72`). EUDPA-306 prohibits using it to infer notification ownership (`requirements-grounding.md:73-77`). |
| Composite journey owner `{sub, organisation}` | `invented` | Branch creates it at `src/server/live-animals/services/persistence/session/real.js:31-41` and threads it through `src/server/live-animals/engine/journey.js:49-145`; stub copy/delete enforce it at `src/server/live-animals/services/persistence/records/stub/lifecycle/create.js:26-56` and `src/server/live-animals/services/persistence/records/stub/lifecycle/transition.js:50-53`. MAIN has no composite notification/journey owner: organisation and subject are used only in the submit/amend actor (`main-frontend/src/server/common/helpers/actor-helpers.js:1-13`; `main-frontend/src/server/common/clients/notification-client.js:333-369`). | No ticket. EUDPA-281 says actor is event metadata, not notification ownership (`requirements-grounding.md:14-35`); EUDPA-306 says notifications have no owner and ownership must not be inferred (`requirements-grounding.md:73-77,85-86`). |
| Scalar `userId` and resume-by-user index | `invented` | Branch exposes `session.userId` (`src/server/live-animals/engine/persistence/session.js:1-2,12,27`), stamps/indexes it in the stub (`src/server/live-animals/services/persistence/records/stub/lifecycle/create.js:11-22`; `src/server/live-animals/services/persistence/records/stub/store/state.js:2`), and synthesises it on real DTOs (`src/server/live-animals/services/persistence/records/real/marshal/document.js:5-10`). MAIN contains no domain `userId` (`main-skeleton-user-surface.md:12-15,55-70`). | No ticket grounds frontend/domain `userId`; EUDPA-281 explicitly excludes it (`requirements-grounding.md:35,84-85`). EUDPA-306 rules out per-user notification scoping (`requirements-grounding.md:73-77`). |
| Session-known journey IDs as listing/action scope | `main-parity` | Branch keeps journey IDs in the current session and uses membership for list/action gates (`src/server/live-animals/services/persistence/session/real.js:3-13,43-50`; `src/server/live-animals/engine/journey.js:49-55,98-145`). MAIN keeps upload IDs in the current journey session and requires membership for download/removal (`main-frontend/src/server/accompanying-documents/controller/post/payload.js:33-50`; `main-frontend/src/server/accompanying-documents/controller/download/index.js:13-16,38-51`; `main-frontend/src/server/accompanying-documents/controller/post/remove.js:9-27`). The branch also retains the exact upload-membership check at `src/server/live-animals/features/documents/controller.js:73-77` and `src/server/live-animals/features/documents/contracts/upload-id.js:7-10`. | This verdict is parity for a **session-owned resource-membership mechanism**, not grounded user/org ownership. The branch real list discards session IDs and owner (`src/server/live-animals/services/persistence/records/real/lifecycle/read.js:18-31`), consistently with EUDPA-306's currently unscoped dashboard (`requirements-grounding.md:73-77`). |
| `responsiblePersonForLoad` identity from `gov.identity` | `invented` | Branch declares a mandatory identity obligation (`src/server/live-animals/model/obligations/sections/system.js:18-25`), binds it (`src/server/live-animals/features/system/evaluation.js:7-15`) and maps it into a proposed notification (`src/server/live-animals/services/persistence/records/notification-mapper/mapper-b/sections/responsible-person.js:1-8`), but has no runtime producer. MAIN has no equivalent signed-in-person domain field; its consignment contacts are business parties, not the actor (`main-skeleton-user-surface.md:87-94`). | EUDPA-281 requires the individual only in event metadata and says the GBN-AG payload carries the responsible-person **organisation**, not the individual (`requirements-grounding.md:33-35,85`). No other ticket grounds this field. |
| Actor envelope with B2C/B2B, source and on-behalf-of identity | `main-parity` | Branch helper: `src/server/common/helpers/actor-helpers.js:1-13`. MAIN has the same helper and actually posts its result on submit/amend: `main-frontend/src/server/common/helpers/actor-helpers.js:1-13`; `main-frontend/src/server/common/clients/notification-client.js:333-344,358-369`. | EUDPA-281 exactly grounds the actor shape and status history (`requirements-grounding.md:9-35`). Branch runtime parity is missing; that is the p-219 gap, not rip-out work. |

No branch-only concept receives `grounded`: the sole narrow ticket-grounded
identity concept, the actor envelope, already exists on MAIN and therefore
receives the required single verdict `main-parity`.

## 3. RIP-OUT LIST

The checkout is read-only for this audit. The locations below are the mechanical
removal surface for an implementor. Ranges intentionally include signatures,
imports, fixtures and assertions that must change together.

### 3.1 Composite journey owner `{sub, organisation}`

Remove `session.owner`, the live-animals-specific org stub header, every `owner`
argument threaded through the journey/records ports, the stored owner and
owner-comparison helper, owner-keyed copy deduplication, and owner-only test
expectations. Keep the EUDPA-281 `buildActor` helper: that is a separate,
grounded parity feature for p-219.

Production source:

- `src/server/live-animals/engine/persistence/session.js:13,28`
- `src/server/live-animals/services/persistence/session/real.js:31-41`
- `src/server/live-animals/services/persistence/session/stub.js:32-37`
- `src/server/live-animals/engine/journey.js:49-52,65-70,84-90,98-101,107-118,124-129,134-145`
- `src/server/live-animals/engine/write/submit.js:3,16-17`
- `src/server/live-animals/services/persistence/records/stub/store/state.js:3`
- `src/server/live-animals/services/persistence/records/stub/store/owner.js:1-5` (delete file)
- `src/server/live-animals/services/persistence/records/stub/lifecycle/create.js:6-7,11-15,26-35,45-56`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/read.js:7,15-20`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/mutate.js:4,6-10,18-21`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/transition.js:8,12,20,35,50-53`
- `src/server/live-animals/services/persistence/records/real/lifecycle/create.js:6-24`
- `src/server/live-animals/services/persistence/records/real/lifecycle/read.js:8-13`
- `src/server/live-animals/services/persistence/records/real/lifecycle/mutate.js:30-33,68`
- `src/server/live-animals/services/persistence/records/real/lifecycle/transition.js:6-39`

Tests:

- `src/server/live-animals/services/persistence/session/real.test.js:101-114,254-300`
- `src/server/live-animals/services/persistence/session/session.test.js:15-36`
- `src/server/live-animals/engine/journey.test.js:132-225`
- `src/server/live-animals/services/persistence/records/records-port.test.js:16-22,167-259`
- `src/server/live-animals/services/persistence/records/real/real.requests.test.js:34,66-104,110-142,158-168,194-203,213-222,240-249,286-358`
- `src/server/live-animals/services/persistence/records/real/real.amend-list.test.js:14,30-90,133-140`
- `src/server/live-animals/services/persistence/records/real/real.integration.test.js:28-34,110-128,152-190`
- `src/server/live-animals/features/notification-actions/controller.test.js:27,46,69,95`
- `src/server/live-animals/features/dashboard/controller.test.js:246-251`
- `src/server/live-animals/features/delete-notification/controller.test.js:31,50,66-86,109`

Removal notes: preserve normal reference-based load/list/copy/delete behaviour
as product behaviour, but remove the claim that `{sub, organisation}` is an
authority. In the stub, copy idempotency should be keyed by the existing
idempotency key (and source, if required by its actual contract), not an
invented owner. The production HTTP contract already sends no owner.

### 3.2 Scalar `userId` and resume-by-user index

Remove the scalar session API and stub user header, `userId` from create/load
signatures and marshalled DTOs, the `byUser` map, and the stub-only
`load({userId})` behaviour. Tests that merely use `userId` to seed an otherwise
unrelated record should create the record without identity.

Production source:

- `src/server/live-animals/engine/persistence/session.js:1-2,12,27`
- `src/server/live-animals/services/persistence/session/real.js:1,25-29`
- `src/server/live-animals/services/persistence/session/stub.js:1-3,27-30`
- `src/server/live-animals/services/persistence/records/stub/store/state.js:2`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/create.js:6,11-14,22,45-55`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/read.js:2,7-12`
- `src/server/live-animals/services/persistence/records/stub/lifecycle/mutate.js:4,18-21`
- `src/server/live-animals/services/persistence/records/stub/marshal/document.js:3-9`
- `src/server/live-animals/services/persistence/records/real/lifecycle/create.js:6,12`
- `src/server/live-animals/services/persistence/records/real/lifecycle/read.js:8-15`
- `src/server/live-animals/services/persistence/records/real/marshal/document.js:5-10`

Tests and test builders:

- `src/server/live-animals/engine/journey-user-assoc.test.js:1-56` (delete file)
- `src/server/live-animals/services/persistence/session/real.test.js:5,85-99,231-252`
- `src/server/live-animals/services/persistence/session/session.test.js:3-8,20,30-34`
- `src/server/live-animals/services/persistence/records/records-port.test.js:16-30,33,41-58,65,74,88,97,104,118,129,148,155,224`
- `src/server/live-animals/services/persistence/records/real/real.no-resume-by-user.test.js:1-41` (delete file)
- `src/server/live-animals/services/persistence/records/real/real.requests.test.js:75-82,120-126,339-343`
- `src/server/live-animals/engine/resume-self-heal.test.js:6,20,37,51`
- `src/server/live-animals/features/dashboard/controller.test.js:13,69,72`
- `src/server/live-animals/engine/journey.test.js:142,163-173,210`
- `src/server/live-animals/features/notification-actions/controller.test.js:17,27`
- `src/server/live-animals/features/delete-notification/controller.test.js:20,31`

Documentation:

- `src/server/live-animals/docs/persistence.md:20-21,27-35,46-50,87-89,109-111,146-147,241-243`
- `src/server/live-animals/docs/limits.md:152-153`

Removal notes: execute this with the composite-owner removal because
`owner.sub` currently back-fills the same `userId` DTO field. Do not replace it
with `contactId`, `sub`, account ID, role ID or another identity alias. MAIN
resumes notifications by reference and EUDPA-306 leaves dashboard scoping
unimplemented.

### 3.3 `responsiblePersonForLoad` from `gov.identity`

Remove this obligation from the canonical manifest, system-populated allow
list, evaluator binding, mapper B overlay, fixtures/oracles and tests. Preserve
ordinary user-entered consignment contact/address fields; they are a different
domain concept. Preserve EUDPA-281 actor metadata outside the obligation model.

Production source:

- `src/server/live-animals/model/obligations/sections/system.js:2-6,18-25`
- `src/server/live-animals/model/obligations/obligations.js:39-49,119-122,168-176,191-194`
- `src/server/live-animals/bridge/obligation-source.js:26-29`
- `src/server/live-animals/features/system/evaluation.js:1-15`
- `src/server/live-animals/services/persistence/records/notification-mapper/mapper-b/index.js:8,26`
- `src/server/live-animals/services/persistence/records/notification-mapper/mapper-b/sections/responsible-person.js:1-8` (delete file)
- `src/server/live-animals/model/obligations/sections/misc.js:1-4` (remove the misleading `gov.identity` comment only)

Tests and fixtures:

- `src/server/live-animals/model/obligations/coverage.test.js:82-110`
- `src/server/live-animals/model/obligations/evaluator.test.js:4-7,1326-1330,1361-1368,1389-1396`
- `src/server/live-animals/bridge/scope.test.js:130-134`
- `src/server/live-animals/bridge/fixtures/characterisation-corpus.js:29-36`
- `src/server/live-animals/bridge/fixtures/characterisation-oracles.json:743-748,1160-1163`
- `src/server/live-animals/services/persistence/records/notification-mapper/notification-mapper.test.js:69-75,262-266,343-355,441-448`

Documentation:

- `src/server/live-animals/docs/obligation-model.md:102-106`
- `src/server/live-animals/docs/flow-and-gates.md:82`

Removal notes: after removing the manifest entry, regenerate or update the
characterisation oracle so the deleted field disappears from both decoded
answers and the proposed-notification projection. Do not introduce a runtime
auth producer for it; that would deepen the ungrounded design.

## 4. Parity gaps

### p-219: actor identity is present as dead code but absent from requests

The branch retains MAIN's `buildActor` helper
(`src/server/common/helpers/actor-helpers.js:1-13`), but real submit and amend
send no body: `src/server/live-animals/services/persistence/records/real/lifecycle/transition.js:6-21`.
Their headers contain only content type and trace ID
(`src/server/live-animals/services/persistence/records/real/http/headers.js:4-7`).
This is a behavioural parity gap even though the concept itself is
`main-parity`. It belongs to queued task p-219 and is deliberately absent from
the rip-out list.

MAIN sends actor identity for submit and amend but not soft-delete/withdraw:
`main-frontend/src/server/common/clients/notification-client.js:333-344,358-369`
versus the identity-free operations at
`main-frontend/src/server/common/clients/notification-client.js:383-489`.
EUDPA-281 also requires actor capture for `withdrawn` and `statusChanges[]`
history (`requirements-grounding.md:14-16,33`), so p-219 must not assume MAIN is
the complete ticket implementation.

### Additional gaps

**None found.** MAIN's other concepts all have branch equivalents. Its
journey-session upload ownership is retained more directly in the reworked
documents feature (`src/server/live-animals/features/documents/controller.js:73-77`;
`contracts/upload-id.js:7-10`) as well as being conceptually matched by the
session-known-journey membership gate.

## 5. Notes for p-219

MAIN derives this exact request JSON from `request.auth.credentials`
(`main-frontend/src/server/common/helpers/actor-helpers.js:1-13`):

```json
{
  "id": "contactId as a string for B2C, otherwise sub",
  "source": "dynamics-contact for B2C, otherwise entra-oid",
  "userType": "B2C when contactId is truthy, otherwise B2B",
  "displayName": "credentials.name",
  "organisationId": "credentials.currentRelationshipId",
  "onBehalfOfOrganisationId": "included only when truthy"
}
```

MAIN constructs `credentials.name` as
`` `${payload.firstName} ${payload.lastName}` `` and retains all JWT claims
(`main-frontend/src/plugins/auth.js:40-50`). It posts the actor object as the
**entire request body** to `/notifications/{referenceNumber}/submit` and
`/notifications/{referenceNumber}/amend`
(`main-frontend/src/server/common/clients/notification-client.js:333-344,358-369`).

EUDPA-281 requires the same six-field actor shape inside the event envelope's
`metadata`, captured from the signed-in session when a submitted, amended or
withdrawn event occurs (`requirements-grounding.md:14-30`). It additionally
requires `statusChanges[]`, each containing `status`, millisecond-precision UTC
`dateChanged`, and the same actor (`requirements-grounding.md:33`). Therefore
p-219 should:

- use the signed-in credentials at transition time, not the composite journey
  owner and not a stored domain `userId`;
- preserve the B2C `contactId`/B2B `sub` split and delegated organisation;
- cover withdraw as well as submit/amend;
- confirm with the backend contract whether the frontend should continue
  posting the bare actor (as MAIN does) or post an envelope/metadata fragment;
  and
- confirm where `statusChanges[]` is assembled and persisted. The frontend must
  not invent notification ownership to supply that history.
