# CHED-D delegated-authority: authorization, ownership & visibility rules

A NEW requirements artefact the frontend-only trace pass could not produce. It captures the
delegated-authority (DoA) model — who OWNS a notification, who can SEE it, and who may ACT on whose
behalf — as concrete, testable statements, each tagged with confidence, CHED-D applicability, and
trace evidence.

> ## ⚠ OPEN QUESTION FOR SAM — is DoA applicable to all CHED types, or CHED-PP-only?
>
> **This is unresolved and needs a human decision before any DoA rule below is treated as a CHED-D
> requirement.** The whole CHED-D DoA model here is *inferred*, adapted from CHED-PP — the CHED-D
> corpus contains **zero** auth/DoA traces (see PROVENANCE). The evidence is genuinely mixed:
> - **Ownership + visibility** key on the shared, notification-type-agnostic IPAFFS authorization
>   layer (organisation ownership, dashboard, "Current Organisation" switcher), so they *probably*
>   apply to every CHED type — but this has never been observed for CHED-D.
> - **Delegated-agent creation + the Trade Partner badge** are *explicitly gated to CHED-PP* in the
>   source (§B, §D) — so DoA is demonstrably **not** uniformly applied across types today.
>
> So the answer is likely "partly": some DoA is cross-type, some is CHED-PP-only. **Do not assume DoA
> applies to CHED-D (or CHED-P / CHED-D / IUU) without confirming per-capability.** Whether the rebuild
> should even *offer* delegated authority for CHED-D is a scope/policy call, not something the traces
> or legacy source can settle. Conflicts c-043 / c-044 and backlog inc-031 (G-1..G-6) carry the
> per-capability detail.

## PROVENANCE — read this before trusting any rule below

**The CHED-D corpus contains ZERO auth/DoA traces.** The 34-trace CHED-D corpus is entirely
`notification/ched-d/*`, `smoke/smoke-ched-d-*`, shared `document/*` and (0) accessibility traces —
all B2C importer ("Not Agent") or B2B notifier→inspector journeys, none of which exercises an
organisation picker, an on-behalf-of creation, or a cross-organisation visibility assertion
(`trace-index.json` boundary + a full grep of `journeys/`, `journey-spec.json`, `page-inventory.json`
for org-scoping surfaces returns nothing).

The delegated-authority model is therefore sourced from the **CHED-PP DoA corpus** — the 10 findings
under `../ched-pp/doa-findings/*.json` and the synthesis in `../ched-pp/authorization-rules.md`,
which exercise the `auth/DoA/doa-*-access.spec.ts` and `doa-notification-creation.spec.ts` specs.
Those specs test the **shared IPAFFS authorization layer** (organisation ownership, the dashboard,
the "Current Organisation" context switcher, the account-bar chrome, the auth fixtures) — a layer
that is *notification-type-agnostic* for OWNERSHIP and VISIBILITY, but is *explicitly gated to
CHED-PP* for DELEGATED-AGENT CREATION and the TRADE PARTNER BADGE (see §B and §D). This document
adapts that model to CHED-D and marks, per rule, whether it transfers.

Confidence taxonomy (per the run):
- **confirmed** — observed rendering in a trace snapshot/action (trace hash + action id cited). For a
  CHED-D artefact, "confirmed" is reserved for facts rendered in a **CHED-D** trace. Facts rendered
  only in a **CHED-PP DoA** trace are marked `confirmed (CHED-PP DoA)` and their CHED-D applicability
  is stated separately — they are NOT confirmed *for CHED-D*.
- **legacy** — read from authoritative IPAFFS source (template/handler/schema). Trustworthy for
  values/copy and for render conditions; for a policy it is "as the old system has it", which the
  rebuild may revisit.
- **inferred** — deduced from the QA tests/page objects, or from the system-wide model applied to
  CHED-D by architecture; not directly rendered for CHED-D.
- **gap** — no evidence for CHED-D; a question for a human.

Precedence for the same fact: confirmed > legacy > inferred.

CHED-D notification reference format: `CHEDD.GB.<year>.<7-8 digits>` (confirmed dashboard values
`CHEDD.GB.2026.1525925`; `types/ched-type.ts` — inferred), used in row-action locator ids below.

---

## Applicability at a glance

| Area | Applies to CHED-D? | Basis |
|---|---|---|
| Org-level ownership (owner = organisation, not author) | **Yes** | System-wide backend/dashboard model; CHED-PP DoA confirmed, CHED-D shares the dashboard |
| Same-org co-member visibility + full row actions | **Yes** | System-wide; CHED-PP DoA confirmed (VIS-5); CHED-D not directly traced |
| "Current Organisation" dashboard context switcher | **Yes** | System-wide account chrome |
| Account-bar chrome (Address book, Manage trade partners) | **Yes — CHED-D confirmed** | Rendered for the plain CHED-D B2C importer |
| Delegated-agent creation FOR another org (consignment-for / consignment-organisation pages) | **No (legacy)** | `consignment_for.js:34` gates the org-selector on `type===CHEDPP`; CHED-D redirects past it |
| Trade Partner badge on the dashboard row | **No (legacy)** | `notificationList.html:28` renders it only when `type=='CHEDPP' AND agencyOrganisationId` |
| Importer/Consignee/Contact auto-population from the owning org | **CHEDPP-delegated only; conflicts with observed CHED-D** | CHED-PP DoA confirmed for the delegated route; the CHED-D corpus hand-enters every trader |

---

## Actors & fixtures (CHED-PP DoA fixtures — the only DoA fixtures that exist)

| Actor | Role | Organisation | Auth fixture |
|---|---|---|---|
| Carol Clark | Delegated **agent** | Own org **IPAFFS Plant Agency C**; holds DoA for **IPAFFS Plant Agency F**, **IPAFFS Plant Organisation 1**, **IPAFFS Plant Organisation 2** | `b2cDoaAgent` |
| Isabel Irwin | Org **member** | **IPAFFS Plant Organisation 1** (KAINOS SOFTWARE LTD, 4-6 UPPER CRESCENT, BELFAST, BT7 1NT) | `b2cOrg1` |
| Franklyn D | Org **member** | **IPAFFS Plant Organisation Test** (trading name **Test Org Ltd**) | (Plant Org Test) |
| David D | Org **member** | co-member of Franklyn D (Test Org Ltd) | (Plant Org Test) |
| Michael Scott | Plain **B2C importer** (Not Agent) | (own account) | the CHED-D corpus's notifier |

These are all Plant/CHED-PP fixtures — there is **no CHED-D DoA agent fixture in the QA repo**
(`grep` over `ipaffs-qa-automation` shows the org-selection page object is referenced solely from
`ched-pp-workflows.ts` and the three `auth/DoA` specs; no CHED-A/P/D equivalent). The delegated-org
list is per-user data, not reference data.

---

## A. Ownership — a notification belongs to an ORGANISATION, not a user

**OWN-1 — Ownership is org-level, not author-level.** A notification is owned by the organisation it
was created *for*, regardless of who authored it; a co-member of that org sees it as their own.
- *confirmed (CHED-PP DoA):* a CHED-PP Franklyn D submitted surfaces on co-member David D's own
  dashboard purely because they share one organisation; the Consignee resolves to the shared org
  'Test Org Ltd' (trace `065de8c5` title + actions 83-91, action 90 results).
- *Applies to CHED-D:* **yes (inferred).** Ownership/visibility keys on the org identity held in the
  notification record + dashboard query, not on the CHED type. The CHED-D dashboard is the identical
  "Your import notifications" list (CHED-D confirmed, dashboard spec). No CHED-D trace exercises a
  second org member, so the CHED-D leg is inferred, not confirmed — **testable:** a CHED-D submitted
  by org member A appears on co-member B's dashboard.
- **Rebuild:** treat the owning organisation as the notification's tenant and enforce it server-side
  for every CHED type, CHED-D included.

**OWN-2 — A member creating in their own right produces a notification owned by their own org, with
no delegated marker.**
- *confirmed (CHED-PP DoA):* Isabel Irwin (Plant Org 1 member) creates → responsible organisation
  'IPAFFS Plant Organisation 1'; no org-selection step is offered to a plain member (trace
  `6e71cf94`).
- *Applies to CHED-D:* **yes — this is the ONLY creation shape CHED-D has** (see §B). Every observed
  CHED-D creation is a plain member/importer creating for their own account.

**OWN-3 — For CHED-PP the owning org is changeable while in Draft and fixed at submit.**
- *confirmed (CHED-PP DoA):* an agent changes the responsible org via review → Amend →
  `#organisation-change-link` before submit; final ownership follows the last selection (trace
  `851759a` actions 89-95).
- *Applies to CHED-D:* **no as-is (legacy)** — CHED-D has no org-selection surface to change (§B), so
  there is no in-draft owner-switch. If the rebuild extends DoA to CHED-D it must decide this too.

---

## B. Delegated authority — who may act for whom  (**CHED-D: NOT in legacy**)

**AGT-1 — Delegated-agent creation FOR another organisation is a CHED-PP-only surface in legacy
IPAFFS.** The two-step org selector — `consignment-for` ("Who are you creating this notification
for?") then, only if "A different organisation" is chosen, `consignment-organisation` ("Which company
is this notification for") — renders **only** for `type=CHEDPP` AND an agent holding ≥1 delegation.
- *legacy (render gate):* `ipaffs-frontend-notification/service/src/routes/handlers/importer/consignment_for.js:33-39`
  — `let hasDelegations = false; if (request.query.type === CHEDPP) { hasDelegations =
  (await customerService.getDelegations(...)).length > 0 } … if (hasDelegations) { render org page }`.
  For any non-CHEDPP type (CHED-D included) `hasDelegations` stays false and the handler redirects
  straight to `consignment-origin`. Corroborated: the org-selection page object is referenced solely
  from `ched-pp-workflows.ts` and the `auth/DoA` specs; there is no CHED-A/P/D equivalent.
- *confirmed (CHED-PP DoA):* the picker renders with Carol Clark's three delegated orgs (traces
  `253df9dc`, `b1f31ed7`, `b701cc40`, `2c16ad65`, `e9b5e36b`, `545412266`).
- *Applies to CHED-D:* **NO.** A CHED-D notification cannot, in the legacy system, be created on
  behalf of a different organisation through the org-selector — the pages do not render for CHED-D.
  **No `ched-d/pages/consignment-for.json` or `consignment-organisation.json` is created by this
  pass, deliberately** — those pages provably are not part of the CHED-D journey. Their full
  requirements live in `../ched-pp/pages/consignment-for.json` and `.../consignment-organisation.json`.
- **Rebuild POLICY QUESTION (G-1):** is delegated-agent creation genuinely intended to be CHED-PP-only
  forever, or is CHED-PP simply where it was first rolled out? If the rebuild wants agents to lodge
  CHED-D on behalf of importers, this whole surface (org selector + owning-tenant + badge +
  auto-population) must be *designed in* for CHED-D — it cannot be ported, because it does not exist
  for CHED-D today.

**AGT-2 — The delegated-authority admin entry point ("Manage trade partners") is service chrome, NOT
an agent-gated affordance — and it DOES render for CHED-D.**
- *confirmed (CHED-D):* the account bar for the plain CHED-D B2C importer "Michael Scott" renders
  `Michael Scott | Address book | Manage account | Manage trade partners | Sign out`, with
  `Manage trade partners` → `/notification/vnet/protected/notifications/trade-partners/filter` and
  `Address book` → `/notification/vnet/protected/notifications/address-book` (CHED-D trace snapshots
  `work/p3/snap14.txt:40`, `work/p26/snap100.txt:40`, `work/p29/snap101.txt:40`).
- *confirmed (CHED-PP DoA):* identical links render for the agent (traces `5dd87b7f`, `545412266`).
- *Interpretation:* the presence of the "Manage trade partners" link on a CHED-D page does NOT imply
  CHED-D delegated creation exists — it is shared chrome. Trade-partner/address-book infrastructure
  exists service-wide; the *creation* surface that consumes it is CHED-PP-only (AGT-1). **Testable:**
  the link renders for a CHED-D user but leads to trade-partner admin, not to a CHED-D on-behalf-of
  create flow.

---

## C. Visibility — who can SEE and ACT on a notification

**VIS-1 — Same-org members share visibility, with the full action set.** A member of an organisation
can see, and gets the same row actions (View details, Copy as new, Amend, Show notification) on, a
notification another member of the same org created — org membership, not authorship, governs
visibility, and there is no read-only downgrade for a non-author.
- *confirmed (CHED-PP DoA):* Franklyn D submits; co-member David D sees it and all four controls
  render on his dashboard row (trace `065de8c5` actions 86-90; row actions
  `copy-as-new-<ref> | view-details-<ref> | amend-details-<ref> | Show notification`).
- *Applies to CHED-D:* **yes (inferred)** — the CHED-D dashboard renders the identical per-row action
  cluster (`copy-as-new-<ref>`, `view-details-<ref>`, `amend-details-<ref>`, Show notification;
  CHED-D confirmed, dashboard spec `structure`/`openQuestions`). The org-scoping that makes a
  co-member's notification appear is the same query. **Testable:** a CHED-D created by member A shows
  on co-member B's dashboard with the full four-action cluster.
- *gap (G-2):* whether the co-member's Amend / Copy-as-new actually *succeeds* downstream (vs merely
  rendering the control) is unexercised even for CHED-PP (trace `065de8c5` gap).

**VIS-2 — The dashboard is scoped by a "Current Organisation" context switcher.** A user operating
under more than one organisation context selects which org's notifications the list shows; a "Change"
button switches context.
- *confirmed (CHED-PP DoA):* Isabel's switcher shows 'IPAFFS Plant Organisation 1' [selected] and
  'Shad Price' (traces `b701cc40` snap 66, `e9b5e36b` snap 94, `2c16ad65` action 93).
- *Applies to CHED-D:* **yes (inferred)** — it is dashboard chrome, notification-type-agnostic. Not
  separately rendered in a CHED-D trace (the CHED-D notifier operates under a single context). The
  CHED-D dashboard the corpus captured shows a single-context 'Michael Scott' account with no
  switcher exercised — so the switcher's CHED-D rendering is a gap, but the model applies.

**VIS-3 — Delegated-org and draft visibility rules (CHED-PP route only, recorded for the rebuild).**
These arise only through the CHED-PP-only delegated route, so they do NOT bear on CHED-D as-is, but
the rebuild must reproduce them if it extends DoA to CHED-D:
- Agent submits FOR a delegated org → that org's members can see and act on it (*confirmed CHED-PP
  DoA:* traces `e9b5e36b` actions 93-95, `2c16ad65` action 93); the agent also retains visibility
  (`b1f31ed7` actions 89-93).
- Agent submits for their OWN org → members of a DIFFERENT org CANNOT see it; cross-org isolation
  (*confirmed CHED-PP DoA:* `5dd87b7f` action 91 — Isabel's search for the reference returns
  "0 results / No notifications have been found", `view-details-<ref>` hidden).
- A DRAFT is private to the creating agent until submitted (*confirmed CHED-PP DoA:* `b701cc40`
  actions 65-67 — the delegated org's member cannot find the draft; the submitted counterpart is
  visible). **Rebuild decision (G-3):** is draft-privacy deliberate?
- *Applies to CHED-D:* **not as-is** — no delegated route exists for CHED-D; a CHED-D draft is simply
  the author's own until submitted, within their own org.

---

## D. Trade Partner badge — the visible delegated marker  (**CHED-D: NEVER rendered**)

**BDG-1 — The teal "Trade Partner" dashboard badge is CHED-PP-only.** It marks a notification created
by a delegated agent on behalf of an org.
- *legacy (render condition):* `ipaffs-frontend-notification/service/src/views/partials/common/notificationList.html:28`
  — `{{#and (eq type "CHEDPP") agencyOrganisationId}}`. Both conditions must hold: the type must be
  literally `CHEDPP` **and** `agencyOrganisationId` must be set. A CHED-D row satisfies neither the
  type test nor (absent a CHED-D delegated route) the agency-id, so **no CHED-D notification ever
  renders a Trade Partner badge.**
- *confirmed (CHED-PP DoA):* the teal badge renders on agent-created CHED-PP rows (traces `e9b5e36b`
  snap 94, `2c16ad65` action 93, `545412266` action 90); it is absent on the own-org CHED-PP control
  (`5dd87b7f`).
- *Applies to CHED-D:* **NO.** The CHED-D dashboard spec's status/inspection tags are the only
  `govuk-tag` uses on a CHED-D row; do not add a Trade Partner badge to CHED-D requirements.
- **Rebuild POLICY QUESTION (G-4):** if DoA is extended to CHED-D, the badge condition and its
  `agencyOrganisationId` plumbing must be generalised beyond the `CHEDPP` literal.

---

## E. Auto-population driven by the owning organisation  (**CHED-D: conflicts with observed flow**)

**POP-1 — In the CHED-PP delegated route, Importer, Consignee and Contact auto-populate from the
owning organisation; the agent types none of them.**
- *confirmed (CHED-PP DoA):* Importer = 'IPAFFS Plant Organisation 1 — KAINOS SOFTWARE LTD, 4-6,
  UPPER CRESCENT, BELFAST, BT7 1NT' (trace `2c16ad65` action 77); Consignee = 'IPAFFS Plant
  Organisation 1' (traces `e9b5e36b`, `2c16ad65`, `545412266`); responsible-person Contact = 'Isabel
  Irwin / ipaffs-plant-org-1-isabel@mailinator.com / 0123456789 / IPAFFS Plant Organisation 1'
  (trace `545412266` action 95). In the same-org member case, Consignee auto-populates as the shared
  org 'Test Org Ltd' (trace `065de8c5` action 90).
- **CONFLICT with observed CHED-D (for Reconcile).** Every CHED-D creation trace **hand-enters** the
  consignor and consignee (e.g. Consignor 'Linus George Ltd', Consignee 'Global Corp' via the
  "Create a new consignee" sub-form) and sets Importer / Place of destination via the "Same as
  consignee" shortcut — there is NO org auto-population of Importer or Consignee in the CHED-D corpus
  (CHED-D `traders-addresses.json` fields; trace `b3742f19b6eea5d9285f5c8739571523a0a13ec1`). The
  CHED-D Contact-details page IS pre-populated, but from the **signed-in account** ('Michael Scott'),
  not from a delegated org (CHED-D `contact-details.json`).
- *Resolution:* org auto-population is a property of the **delegated / registered-org route**, which
  is CHED-PP-only. The plain CHED-D importer route hand-enters traders. These do not contradict —
  they are different actor routes — but a reader must not carry POP-1 into CHED-D as a confirmed
  CHED-D behaviour. **Gap (G-5):** would a CHED-D created by a *registered org member* (rather than
  the corpus's plain B2C importer) auto-populate consignee/contact from that org? Untraced for
  CHED-D.

---

## F. Open questions / gaps for a human

- **G-1 (DoA scope):** delegated-agent creation + Trade Partner badge are CHEDPP-only in legacy
  (`consignment_for.js:34`, `notificationList.html:28`). Is that a deliberate permanent boundary, or
  an incomplete rollout? Decides whether CHED-D needs an on-behalf-of design at all.
- **G-2 (co-member action success):** VIS-1 proves the co-member's controls RENDER; that Amend /
  Copy actually succeed for a non-author is unexercised (CHED-PP `065de8c5`).
- **G-3 (draft-privacy intent):** VIS-3 shows CHED-PP delegated drafts are private pre-submit —
  confirm the intended CHED-D equivalent (author-private within own org until submit).
- **G-4 (badge generalisation):** if DoA extends to CHED-D, the `type=='CHEDPP'` badge literal and
  `agencyOrganisationId` must be generalised.
- **G-5 (org-member CHED-D auto-population):** the CHED-D corpus only has a plain B2C importer
  hand-entering traders; whether a registered-org CHED-D member gets org auto-population is untraced.
- **G-6 (CHED-D cross-org isolation):** VIS-3's negative leg (a different org's member cannot see a
  notification) is proven for CHED-PP only; the CHED-D equivalent has no trace and should get its own
  test in the rebuild.
