# Consistency Check: trade-imports-animals-tests

**Ticket:** EUDPA-48
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #44 | **Commit:** 94735f2c

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `consignment.contact` data shape | backend `Consignment{contact: ContactAddress{name, Address{addressLine1-3, country}}}`; frontend `mock-contacts.json` entries `{name, address{addressLine1-3, country}}` | `NotificationDocument.consignment?.contact{name, address{addressLine1, addressLine2, addressLine3?, country}}` + Mongo seed entries match the shape | CONSISTENT |
| Address `postcode` collapsed into `addressLine3` | backend `Address` has no `postcode`; frontend `mock-contacts.json` merges into `addressLine3` | `notification-document.ts` declares no `postcode`; Mongo seed values "Addlestone, KT15 3NB" / "Hyattmouth, 72183" / "Kesslerbury, 528272" mirror frontend mock-contacts | CONSISTENT |
| Mock data parity (three sample contacts) | backend `NotificationTestData.consignments()` has 2 (APHA, EuroStore); frontend `mock-contacts.json` has 3 (APHA, EuroStore, Laiterie) | Mongo seed contains four notifications, three of which carry `consignment` — APHA, EuroStore, Laiterie, APHA (re-used) | CONSISTENT with frontend; minor gap with backend noted in backend report |
| E2E unblocking ex-TODOs that depended on this ticket | n/a (backend / frontend each unblock their own layers) | `addresses.spec.ts` resolves two TODOs (back to accompanying-documents; place-of-destination flow); `transporters.spec.ts` un-skips `continues to contact address after saving transporter`; `declaration.spec.ts` comment refresh | EXPECTED (tests-repo is the natural home for cross-page journey unblocking) |
| `CONTACT_ADDRESS_NAME` flow constant | backend uses literal "Animal and Plant Health Agency" in `NotificationTestData`; frontend test reuses contacts fixture directly | New import in `notification-persistence.spec.ts`: `CONTACT_ADDRESS_NAME` from `@flows/journeys`; used to assert `doc.consignment?.contact.name` | CONSISTENT (centralised constant for the journey layer) |
| Arrival-date assertion reordering in persistence spec | n/a | `expectedArrivalDate` block moved above transporter assertions to keep transport assertions contiguous before the new `consignment` block | CONSISTENT (cosmetic reorder, no semantic change) |
| No new dependencies / no new env vars | backend no `pom.xml` changes; frontend no `package.json` changes | No `package.json` / Playwright config changes | CONSISTENT |

## Missing Changes

*None identified.* All peer-repo changes that have a tests-repo analogue (data shape, seed parity, journey unblocking) are present.

## Unique Changes

- **Mongo seed (`20-seed-notifications.js`) gains `consignment` on four notifications** — this is unique to tests-repo because only the E2E stack relies on Mongo seeding. Backend uses programmatic fixtures (`NotificationTestData`), frontend uses `mock-contacts.json`.
- **`notification-document.ts` declares `consignment?` as optional** — matches the practical reality that not every persisted notification needs the field; aligns with backend `Notification.consignment` (non-required, nullable by default in Lombok `@Data`).
- **Three unrelated TODO cleanups** in `addresses.spec.ts` / `transporters.spec.ts` / `declaration.spec.ts`. They are tangentially related (they unblock the full transporter -> contact-address -> declaration journey now that the contact-select page is wired through) and within ticket scope per AC2 ("Save and continue -> next page in journey").

## Verdict

**Status:** CONSISTENT
**Issues:** 0 blocking
**Summary:** Tests-repo's `NotificationDocument` type, Mongo seed and persistence-spec assertions align fully with the backend `Consignment.contact` model and the frontend `mock-contacts.json` shape; ancillary TODO removals correctly unblock the transporter -> contact-address -> declaration journey introduced by this ticket.
