# Consistency Check: trade-imports-animals-backend

**Ticket:** EUDPA-48
**All repos in scope:** trade-imports-animals-backend, trade-imports-animals-frontend, trade-imports-animals-tests
**PR:** #36 | **Commit:** e28b2332

## Cross-Repo Pattern Analysis

| Pattern | Other Repos | This Repo | Status |
|---------|-------------|-----------|--------|
| `consignment.contact` data shape (name + address with addressLine1-3 + country) | frontend mock-contacts.json `name` + nested `address` (no `postcode` field after PR), tests-repo `NotificationDocument.consignment?.contact{name,address{addressLine1,addressLine2,addressLine3?,country}}` and Mongo seed identical shape | `Consignment{contact: ContactAddress}` with `ContactAddress{name, Address}` where `Address` has `addressLine1-3 + country` only (no `postcode`) | CONSISTENT |
| Address `postcode` field removed/merged into `addressLine3` | frontend mock-contacts.json drops `postcode`, merges into `addressLine3` ("Addlestone, KT15 3NB"); tests-repo Mongo seed uses same merged form; tests-repo TS type has no `postcode` field | Backend `Address` model exposes no `postcode` (only addressLine1-3 + country) — implicit alignment via existing model, not changed in this PR | CONSISTENT |
| Wiring `consignment` through write-path (DTO -> entity) and read-path (entity -> response) | tests-repo seed populates `consignment` on Mongo docs; frontend stores selection in session under `sessionKeys.consignmentContactAddress` | `NotificationDto.consignment` -> `NotificationService.setNotificationDetails` -> `Notification.consignment` -> `NotificationResponse.consignment` end-to-end | CONSISTENT |
| Test coverage for new field | frontend adds `controller.test.js` case for index-0 pre-selection; tests-repo adds Playwright assertions for `doc.consignment?.contact.*` in `notification-persistence.spec.ts` and unblocks the journey spec | `NotificationControllerTest` asserts `$.consignment.contact.{name,address.addressLine1,address.country}` on POST + findByRef; `NotificationServiceTest` asserts hydrated `consignment` on update + findByRef | CONSISTENT |
| `NotificationTestData.consignments()` helper providing fixtures | tests-repo Mongo seed contains four notifications, three with `consignment` (APHA / EuroStore / Laiterie); frontend `mock-contacts.json` mirrors the same three names | Backend `consignments()` returns two fixtures (APHA + EuroStore) — Laiterie is omitted | INCONSISTENT (minor) |
| `CONTACT_ADDRESS_NAME` flow constant | tests-repo introduces `CONTACT_ADDRESS_NAME` import from `@flows/journeys` for E2E persistence assertion | n/a — backend uses literal "Animal and Plant Health Agency" in `NotificationTestData` | EXPECTED (different test layer) |
| No new config / env vars / dependency bumps | frontend no new deps; tests-repo no new deps | No new properties in `application.yml`, no Spring config changes, no new dependencies in `pom.xml` | CONSISTENT |

## Missing Changes

- **Laiterie du Nord SARL fixture absent from `NotificationTestData.consignments()`.** Frontend `mock-contacts.json` (3 entries) and tests-repo `20-seed-notifications.js` (3 notifications with `consignment`) both include the Laiterie / Albania entry; the backend test helper covers only the first two. Not a defect — the controller/service tests only need one or two fixtures — but flag for awareness if future tests want a 1:1 mapping with the frontend mock list.

## Unique Changes

- **`NotificationResponse` records the `consignment` projection field via a positional-record component** (line 28, plus the `.consignment(...)` builder call in `from(...)`). This is the only repo with a strongly typed projection DTO — frontend & tests-repo both consume the JSON shape directly. Intentional and required by Spring's controller layer.
- **Whitespace cleanup in `Notification.java` and `NotificationDto.java`** (trailing-space removal on adjacent `cphNumber` / `transport` lines). Cosmetic, no behavioural impact.

## Verdict

**Status:** CONSISTENT
**Issues:** 0 blocking, 1 minor (test-data fixture parity)
**Summary:** Backend wiring of `consignment.contact` matches the frontend session model and the tests-repo Mongo seed end-to-end; the only divergence is the backend test helper carrying two fixtures vs three in peer repos, which does not affect production behaviour.
