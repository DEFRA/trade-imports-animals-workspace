# Code Review: EUDPA-58

**Ticket:** Address Book (Epic — "requirements and proposed solution for addresses visible to users in the IMP journey")
**Reviewer:** Claude Code Agent
**Date:** 2026-08-01
**Verdict:** CONCERNS

**Scope:** `trade-imports-address-book` PR #1 **only**. The other five repos in
the epic's PR set (`animals-frontend`, `ins-frontend`, `animals-backend`,
`animals-tests`, `animals-workspace`) were excluded by instruction — see
`.review-meta.full.json` for the full set.

## Summary

Initial build-out of a new per-organisation address book service (Spring Boot +
MongoDB, five `/organisation/{orgId}/...` endpoints, soft delete, org-scoped
identity header, RFC 7807 problems, EMF metrics). The test scaffolding is
genuinely good — an integration test per endpoint against real Mongo via
Testcontainers, cross-tenant behaviour treated as a first-class case, field
smuggling guarded at the mapper.

Three things stand between it and merge: nothing establishes the trust boundary
for the `Trade-Imports-Organisation-Id` header that gates all address PII; the
PR commits two contract documents that disagree with each other and with the
code, behind a compliance gate too narrow to notice; and two wired-up features
(EMF metrics, CDP trace propagation) never actually run.

## Repositories Analyzed

| Repository | PR | Commit | Files Changed | Verdict | Review |
|------------|-----|--------------|---------------|---------|--------|
| trade-imports-address-book | [#1](https://github.com/DEFRA/trade-imports-address-book/pull/1) | 6f1134b | 82 | RISKY | [review.trade-imports-address-book.md](review.trade-imports-address-book.md) |

## Findings

| Severity | Count |
|---|---|
| Critical | 11 |
| Major | 94 |
| Minor | 77 |
| **Total** | **182** |

### Critical items

| # | File:Line | Issue |
|---|---|---|
| 86 | `IdentityHeaderFilter.java:73` | The "trusted forwarded header" `Trade-Imports-Organisation-Id` is read straight off the client request with nothing establishing the trust — no Spring Security, no `SecurityFilterChain`, no gateway/ingress config, no documented upstream that strips inbound copies. Any caller who can reach the service can read, create, amend or delete any organisation's address PII by setting one header. |
| 14 | `api-contract.locked.yaml:490` | The locked contract's whole payload surface contradicts the shipped API — snake_case wire names plus fields that do not exist at all, against the code's camelCase and derived `deleted` boolean. |
| 15 | `api-contract.locked.yaml:375` | The documented identity contract is wrong in a security-relevant way: it declares a `Trade-Imports-Crn` header required on every request (exists nowhere in the service) and states organisation-id is "NOT used for read filtering" — the exact opposite of the implemented org-scoped reads. |
| 46 | `OperatorResponse.java:20` | Response shape contradicts the locked contract committed in the same PR on every property. |
| 53 | `JacksonConfig.java:23` | `LOWER_CAMEL_CASE` makes the whole HTTP boundary camelCase, contradicting both the locked contract and `docs/best-practices/rest-api/rest-api.md`. |
| 22 | `operators.yml:1` | The generated contract contradicts the locked contract it is documented to be surface-equivalent to. |
| 21 | `operators.yml:83` | The POST/PUT 400 schema emits `type: string` alongside the `anyOf`, so the published contract says a problem+json 400 body is a JSON string; generated clients type the 400 as `String`. |
| 154 | `OperatorComplianceIT.java:226` | The divergence gate compares only path keys, HTTP methods and operationIds — it never reads `components.schemas`, so the total contract drift passes green. |
| 63 | `OpenApiConfig.java:11` | Javadoc claims the gate fails the build on exactly the divergence it cannot see. |
| 80 | `GlobalExceptionHandler.java:118` | The `RuntimeException` catch-all swallows `HttpMessageNotReadableException`; a truncated JSON body returns 500 with a stack trace instead of the contract's 400. |
| 95 | `EmfMetricsPublisher.java:27` | `@EnableScheduling` appears nowhere in the repo, so `@Scheduled publishMetrics()` never fires — the whole EMF path is dead code despite `aws.emf.*` and the CDP CloudWatch endpoint being wired up. |

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| — | — | N/A | EUDPA-58 is an **Epic** with an empty Acceptance Criteria section and no comments. No AC exist to check this PR against. The PR's own contract documents were used as the stand-in specification — and they disagree with the implementation (see Critical #14/#15/#46). Worth resolving where the real spec lives before merge. |

## Test Coverage Assessment

- **Unit Tests:** Present — good breadth (service, mapper, exception handler,
  identity filter, request validation, trace interceptor). Two specific
  weaknesses: `OperatorMapperTest`'s smuggling assertions are vacuous (the JSON
  under test carries neither key), and `TraceIdPropagationInterceptorTest` calls
  `intercept()` directly, so it passes despite the interceptor being registered
  nowhere.
- **Integration Tests:** Present — an IT per endpoint on real Mongo via
  Testcontainers. Named gaps rather than uniform depth: no DELETE case in
  `AddressScopingIT` (the one `authoriseOrg` call site with no test), no
  cross-org or tombstone case for the two hand-written `@Query` methods, no
  malformed-JSON-body case, no concurrency test anywhere in the repo.
  `OperatorCrudIT` duplicates ~two thirds of four sibling ITs.

## Configuration & Environment

- **New Environment Variables:** `PORT` (8089), `MONGO_URI`, `MONGO_DATABASE`,
  `MONGO_READ_PREFERENCE`, `MONGO_WRITE_CONCERN`, `MONGO_POOL_*`,
  `TRUSTSTORE_CDP_ROOT_CA`, `SERVICE_VERSION`, `TRACING_HEADER`,
  `AWS_REGION`, `AWS_EMF_*`, `HTTP_PROXY`, `METRICS_ENABLED`, `LOG_LEVEL`,
  `LOGGING_LEVEL_*`, `ENVIRONMENT`.
- **⚠️ `LOG_LEVEL` behaviour change:** `application.yml:53` sets the application
  package to `${LOG_LEVEL:DEBUG}`. Correcting the logger key from the
  non-existent `…address.book` package to the real `…addressbook` **activates a
  previously inert DEBUG default** — every environment that does not set
  `LOG_LEVEL` now logs the whole application package at DEBUG. It reads as a
  harmless rename fix.
- **Database Changes:** New Mongo database `trade-imports-address-book`,
  `addresses` collection, `@EnableMongoAuditing` on. No `@Version` — every
  mutation is unguarded read-modify-write (last-write-wins; a PUT racing a
  DELETE resurrects the tombstone). Sort key `createdAt DESC` is non-unique, so
  `skip`/`limit` pagination has no stable ordering.
- **Workspace stack:** `trade-imports-address-book` is registered **nowhere** in
  the workspace repo (`docker/`, `scripts/`, `Makefile`). The README's whole
  "Workspace stack (recommended)" section documents an integration that does not
  exist — either a companion workspace PR is missing from this PR set, or the
  section must be withdrawn.

## Risk Matrix

| Category | Risk Level |
|----------|------------|
| Correctness | Medium |
| Code Quality | Medium |
| Security | High |
| Test Coverage | Medium |
| Contract / API stability | High |

## Conclusion

CONCERNS — not a rejection. The service is well-built and well-tested for a
first cut; the blockers are decisions rather than defects. Settle three things
before merge, in this order: (1) own the trust boundary for
`Trade-Imports-Organisation-Id`; (2) rule which document is the contract — this
is one ruling, not fifteen fixes, and patching the sites individually without it
just creates a fifteenth inconsistency; (3) decide `Operator*` vs `Address*` now,
because `OperatorComplianceIT` locks the operationIds and shipping makes the
split a contract-breaking change to fix.

Full item table and the 12 cross-file themes are in
[review.trade-imports-address-book.md](review.trade-imports-address-book.md);
theme analysis in
[file-reviews/trade-imports-address-book/_consistency-check.md](file-reviews/trade-imports-address-book/_consistency-check.md).

**Next:** `walk review EUDPA-58` to triage the 182 items.
