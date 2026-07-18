# CHED-PP delegated-authority: authorization, ownership & visibility rules

A NEW requirements artefact the frontend-only trace pass could not produce. It captures the
delegated-authority (DoA) model — who owns a notification, who can see it, and who may act on
whose behalf — as concrete, testable statements, each tagged with confidence and trace evidence.

Source: the 10 DoA findings under `doa-findings/*.json`. Confidence taxonomy:
- **confirmed** — observed rendering in a trace snapshot/action (trace hash + action id cited).
- **legacy** — read from authoritative IPAFFS source (template/spec/page-object). Trustworthy for
  values/copy; for a rule it is "as the old system had it", a policy the rebuild may revisit.
- **inferred** — deduced from the QA tests/page objects, not directly rendered.
- **gap** — no evidence; a question for a human.

Precedence for the same fact: confirmed > legacy > inferred.

---

## Actors & fixtures (per the DoA test fixtures)

| Actor | Role | Organisation | Auth fixture |
|---|---|---|---|
| Carol Clark | Delegated **agent** | Own org: **IPAFFS Plant Agency C**; holds DoA for **IPAFFS Plant Agency F**, **IPAFFS Plant Organisation 1**, **IPAFFS Plant Organisation 2** | `b2cDoaAgent` |
| Isabel Irwin | Org **member** | **IPAFFS Plant Organisation 1** (registered contact; address KAINOS SOFTWARE LTD, 4-6 UPPER CRESCENT, BELFAST, BT7 1NT) | `b2cOrg1` |
| Franklyn D | Org **member** | **IPAFFS Plant Organisation Test** (trading name **Test Org Ltd**) | (Plant Org Test) |
| David D | Org **member** | **IPAFFS Plant Organisation Test** / **Test Org Ltd** (co-member of Franklyn D) | (Plant Org Test) |
| Shad Price | Second org in Isabel's current-org switcher | — | — |

The agent's own-org name and the delegated-org list are **per-user data**, not reference data:
a different agent sees a different set (base spec `consignment-for.json` / `consignment-organisation.json`).

---

## A. Ownership — a notification belongs to an ORGANISATION, not a user

**OWN-1 — Ownership is org-level, not author-level.** A CHED-PP is owned by the organisation it
was created *for*, regardless of who authored it.
- *Confirmed:* a notification Franklyn D submitted surfaces in co-member David D's own dashboard
  purely because they share one organisation (trace `065de8c5` title + actions 83-91). The
  Consignee resolves to the shared org 'Test Org Ltd' (action 90).
- *Confirmed (agent route):* the owning org is the **selected delegated org**, not the agent's own
  org — review `#responsible-organisation-name` = 'IPAFFS Plant Organisation 1' and dashboard
  Consignee = 'IPAFFS Plant Organisation 1' (traces `253df9dc`, `2c16ad65`, `545412266`,
  `e9b5e36b`).
- **Rebuild:** treat the selected organisation as the notification's owning tenant and enforce it
  server-side.

**OWN-2 — A member creating in their own right produces a notification owned by their org, with no
Trade Partner badge.**
- *Confirmed:* Isabel Irwin (Plant Org 1 member) creates → `#responsible-organisation-name` =
  'IPAFFS Plant Organisation 1'; no org-selection step is offered to a plain member (trace
  `6e71cf94` action 172; org-selection absent — action timeline goes Import Type → Country of
  Origin with no org step).

**OWN-3 — The owning org is fixed at submit but changeable while in Draft.** An agent may change
the responsible organisation before submit (including back to their own org); final ownership
follows the last selection.
- *Confirmed:* Carol creates for Plant Org 1, then via review → Amend → `#organisation-change-link`
  → selects own org 'IPAFFS Plant Agency C' → Save and review → submit; final
  `#responsible-organisation-name` = 'IPAFFS Plant Agency C' (trace `851759a` actions 89-95).
- *Confirmed (change surface):* base spec `consignment-for.json` documents the 'Save and review'
  button variant on the change path.

---

## B. Delegated authority — who may act for whom

**AGT-1 — An agent with DoAs may create a CHED-PP for any organisation it holds delegated authority
over.** Carol Clark's delegated set (offered as radios on `consignment-organisation`): IPAFFS Plant
Agency F, IPAFFS Plant Organisation 1, IPAFFS Plant Organisation 2.
- *Confirmed:* org picker rendered with all three (traces `253df9dc` call@517, `b1f31ed7`
  action 13, `b701cc40` snap 13, `2c16ad65` action 12, `e9b5e36b` snap 13, `545412266` action 13).

**AGT-2 — An agent may also create for their OWN organisation** (IPAFFS Plant Agency C), selected on
the `consignment-for` page rather than the delegated picker.
- *Confirmed:* own-org radio checked (trace `5dd87b7f` action 10-11; `545412266` action 11).

**AGT-3 — The delegated-authority admin entry point is 'Manage trade partners'**
(`/notification/vnet/protected/notifications/trade-partners/filter`), present in the account bar.
- *Confirmed:* present for the agent (traces `5dd87b7f`, `b701cc40` snap 11, `545412266` header).
- *Note:* the link is **NOT agent-gated** — it also appears for org members (Isabel) and for a plain
  B2C importer (base `notifications-dashboard.json` line 48, trace `219b882e`). So it is service
  chrome, not a delegated-only affordance. Address book is likewise present for all.

**AGT-4 — The two-step org selector is delegated-only surface.** `consignment-for`
('Who are you creating this notification for?' — own org vs 'A different organisation') then, only if
'A different organisation' chosen, `consignment-organisation` ('Which company is this notification
for' — the delegated picker). Neither page renders for a non-delegated user; a plain member goes
Import Type → Country of Origin.
- *Confirmed:* traces `e9b5e36b`, `253df9dc`, `b1f31ed7`, `b701cc40`, `2c16ad65`, `545412266`
  (both pages); member skip confirmed in `6e71cf94`.
- *These two pages have their own specs* (`pages/consignment-for.json`, `pages/consignment-organisation.json`)
  — no separate 'organisation-selection' page file is warranted; the findings' 'organisation-selection'
  / 'consignment-organisation-picker' slugs are the same two pages.

---

## C. Visibility — who can SEE and ACT on a notification

**VIS-1 — Agent submits FOR a delegated org → members of that org CAN see it and act on it.** A
member of the owning org finds the agent-submitted notification on their dashboard and gets full row
actions (View details, Copy as new, Amend, Show notification).
- *Confirmed:* Carol → Plant Org 1; Isabel Irwin (Plant Org 1 member) sees it and the view-details /
  copy-as-new / amend-details controls are all visible (traces `e9b5e36b` actions 93-95;
  `2c16ad65` action 93).

**VIS-2 — Agent submits FOR a delegated org → the AGENT also sees it on their own dashboard** and can
View / Copy / Amend it.
- *Confirmed:* Carol searches `CHEDPP.GB.2026.1525735` and the controls resolve on her own dashboard
  (trace `b1f31ed7` actions 89-93).
- *Legacy:* `doa-agent-access.spec.ts:34-58`.

**VIS-3 — Agent submits for their OWN org → members of a DIFFERENT org CANNOT see it.** Cross-org
isolation.
- *Confirmed:* Carol submits for own org Plant Agency C; Isabel (Plant Org 1) searches the exact
  reference `CHEDPP.GB.2026.1525736` and gets '0 results / No notifications have been found';
  `view-details-CHEDPP.GB.2026.1525736` is hidden (trace `5dd87b7f` action 91).

**VIS-4 — A DRAFT is private to the agent until submitted.** An agent's draft for a delegated org is
NOT visible to that org's members until it is submitted.
- *Confirmed:* Carol drafts for Plant Org 1 (stops before submit); Isabel searches
  `DRAFT.GB.2026.1525739` and finds no row, `view-details-DRAFT.GB.2026.1525739` hidden (trace
  `b701cc40` actions 65-67). The submitted counterpart IS visible (VIS-1).
- **Rebuild decision:** is draft-privacy deliberate (agents own work-in-progress) or an artefact? It
  means the owning org cannot review or intervene before submission.

**VIS-5 — Same-org members share visibility.** A member of an organisation can see, and fully act on,
another member's submission — no delegation involved. Org membership, not authorship, governs
visibility.
- *Confirmed:* Franklyn D submits; co-member David D (same org, Test Org Ltd) sees it and gets View
  details / Copy as new / Amend / Show notification (trace `065de8c5` actions 86-90).

**VIS-6 — Dashboard visibility is scoped by a 'Current Organisation' context switcher.** A member (or
agent) operating under multiple org contexts selects which org's notifications the list shows; a
'Change' button switches context.
- *Confirmed:* Isabel's switcher options 'IPAFFS Plant Organisation 1' [selected] and 'Shad Price'
  (traces `b701cc40` snap 66 lines 241-245; `e9b5e36b` snap 94 refs e187-e189; `2c16ad65` action 93).
  The VIS-1/VIS-4 assertions hold with Plant Organisation 1 active.

**CAP-1 — No read-only downgrade for non-authors.** A non-author who can see a notification
(delegated-org member in VIS-1, or same-org co-member in VIS-5) gets the SAME action set the author
would — View details, Copy as new, Amend, Show notification all render.
- *Confirmed:* traces `065de8c5` action 90, `e9b5e36b` actions 93-95.
- *Gap:* whether a co-member's Amend/Copy actually **succeeds** downstream (vs merely rendering the
  control) is not exercised (trace `065de8c5` gap).

---

## D. Trade Partner badge — the visible delegated-authority marker

**BDG-1 — A CHED-PP created by a delegated agent on behalf of an org carries a teal 'Trade Partner'
badge on the dashboard result card; an own-org or member-created notification does not.**
- Render condition (*legacy*, `ipaffs-frontend-notification/service/src/views/partials/common/notificationList.html:28-30`):
  `type == 'CHEDPP' AND agencyOrganisationId is set`.
- CSS: `govuk-tag tag--fixed-width govuk-tag--teal govuk-!-margin-top-1`, rendered directly beneath
  the CHED status tag; the 'CHED status' definition then holds two tags (status + 'Trade Partner').
- *Confirmed present:* traces `e9b5e36b` snap 94 (refs e322-e325, 'New' + 'Trade Partner'),
  `2c16ad65` action 93 (teal tag), `545412266` action 90 ('Draft CHEDPP' + 'Trade Partner').
- *Confirmed absent (own-org control):* the own-org submission (`5dd87b7f`) carries no badge and is
  cross-org invisible (VIS-3).
- *Gap:* does an org-member Amend/Copy-as-new of an agent-created notification strip the badge /
  `agencyOrganisationId`? Not exercised (trace `2c16ad65` gap).

---

## E. Auto-population driven by the owning organisation

**POP-1 — Importer is auto-populated as the owning organisation.** For a delegated agent, the
Importer row on the Traders/Addresses page is pre-filled with the SELECTED delegated org and its
registered address; the agent never types it.
- *Confirmed:* Importer = 'IPAFFS Plant Organisation 1 — KAINOS SOFTWARE LTD, 4-6, UPPER CRESCENT,
  BELFAST, BT7 1NT — United Kingdom of Great Britain and Northern Ireland' (trace `2c16ad65`
  action 77). Contrast the non-agent main run where the importer is the signed-in account
  ('Michael Scott…'). Role-dependent, not contradictory.

**POP-2 — Responsible-person / Contact details are auto-populated from a MEMBER of the owning org,
not the acting agent.**
- *Confirmed (rendered on review page):* Responsible person 'Isabel Irwin', Telephone '0123456789',
  Email 'ipaffs-plant-org-1-isabel@mailinator.com', Organisation 'IPAFFS Plant Organisation 1'
  (trace `545412266` action 95). The agent Carol Clark never typed these; the contact-details page is
  a pass-through for the agent.

**POP-3 — Consignee is auto-populated as the owning organisation.** The agent/member never enters it.
- *Confirmed:* Consignee = 'IPAFFS Plant Organisation 1' (delegated route, traces `e9b5e36b`,
  `2c16ad65`, `545412266`); = 'Test Org Ltd' (same-org member submission, trace `065de8c5`
  action 90).

**POP-4 — Consignor is hand-entered, NOT auto-populated.** Across every trace the agent/member
creates the consignor by hand ('Linus George Ltd'); Delivery address is set via the 'Same as
consignee' shortcut.
- *Confirmed:* all creation traces (e.g. `065de8c5` actions 62-72, `e9b5e36b` actions 65-76).

---

## F. Open questions / gaps for a human

- **G-1 (which member becomes 'Responsible person'):** for a delegated org the contact resolves to a
  designated member (Isabel Irwin for Plant Org 1), but the business rule choosing WHICH member is
  not shown in any trace (traces `545412266`, `253df9dc` — gap).
- **G-2 (badge lifecycle):** does an org-member amend/copy of an agent-created notification strip the
  'Trade Partner' badge / `agencyOrganisationId`? Unexercised (trace `2c16ad65` — gap).
- **G-3 (co-member action success):** VIS-1/VIS-5 prove the controls RENDER; they do not prove the
  Amend/Copy actions succeed for a non-author (trace `065de8c5` — gap).
- **G-4 (draft-privacy intent):** VIS-4 shows drafts are private to the agent pre-submit; confirm
  this is deliberate policy, not an artefact.
- **G-5 (8+ delegations):** the `consignment-organisation` picker switches from radios to a select
  (JS-enhanced autocomplete) at ≥8 delegations; never traced and structurally untested (base
  `consignment-organisation.json`). No agent in the corpus held ≥8 delegations.
- **G-6 (own-vs-delegated two-page split):** the own org is chosen on `consignment-for` and never
  appears in the `consignment-organisation` picker; the rebuild should decide whether to collapse
  into one radio group listing own org alongside delegated orgs (base spec open question; trace
  `2c16ad65` gap).
