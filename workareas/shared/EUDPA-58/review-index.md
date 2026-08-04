# Code Review: EUDPA-58

**Ticket:** Address Book (Epic — "requirements and proposed solution for addresses visible to users in the IMP journey")
**Reviewers:** Claude Code Agent — two independent passes, now consolidated
**Date:** 2026-08-01
**Last Updated:** 2026-08-04 (consolidation of Sam's six-repo review with Amir's address-book review)
**Verdict:** NEEDS MORE WORK

**Scope:** all **six** repos in the epic's PR set. This index used to cover
`trade-imports-address-book` PR #1 only; it now carries the merged state of both
reviews. Who covered what:

| Repository | PR | Commit | Reviewed by |
|---|---|---|---|
| trade-imports-address-book | [#1](https://github.com/DEFRA/trade-imports-address-book/pull/1) | bbf547c | **Both** — Amir (5 refresh rounds) and Sam (first pass + 2026-08-04 refresh) |
| trade-imports-animals-backend | #67 | 54f9f3f | Sam only |
| trade-imports-animals-frontend | #163 | c0d014a | Sam only |
| trade-imports-animals-tests | #94 | 7fcd979 | Sam only |
| trade-imports-animals-workspace | #42 | b19391e | Sam only |
| trade-imports-ins-frontend | #1 | e99a31a | Sam only |

Merge method, bucket classification and the full duplication evidence are in
[CONSOLIDATION.md](CONSOLIDATION.md).

## Summary

The two reviews overlap only on `trade-imports-address-book` (198 Sam items vs
201 Amir items). Deduplicating them drops 73 Sam items into the closed archive,
merges 5 into Amir's still-open findings, and leaves 14 places where the two
reviews **disagree about whether the code is correct**. Every one of those 14 is a
case where Amir prescribed a fix, the fix landed, he closed the item, and Sam's
later pass at the same commit found the result wanting — or, in one case, found
the fix itself to be the defect.

The other five repos have no second opinion at all.

## Merged item counts

| Repository | Live | Critical | Major | Minor | Verdict |
|---|---:|---:|---:|---:|---|
| trade-imports-address-book | 126 | 4 | 50 | 72 | RISKY |
| trade-imports-ins-frontend | **153** | **9** | 77 | 67 | **RISKY — no manual review, no triage** |
| trade-imports-animals-tests | 48 | 2 | 29 | 17 | NEEDS ATTENTION |
| trade-imports-animals-backend | 41 | 1 | 14 | 26 | NEEDS ATTENTION |
| trade-imports-animals-workspace | 30 | 1 | 15 | 14 | NEEDS ATTENTION |
| trade-imports-animals-frontend | 2 | 0 | 0 | 2 | SAFE |
| **Total** | **400** | **17** | **185** | **198** | |

Closed history for address-book is in
`items.trade-imports-address-book.closed-archive.json` — now 268 entries:
Amir's 195 preserved verbatim, plus the 73 items both reviews found and Amir
already closed (ids 202–274). 37 of those 73 carry a commit sha proving the fix.

## ⚠ `trade-imports-ins-frontend` has had no review from anyone

153 items, **9 of them Critical**, and not one has been read by a human or
triaged. It is the largest untriaged block in the epic and it is the one carrying
the security findings: two stored-XSS routes, an open redirect, `client_secret`
and `refresh_token` sent as URL query parameters, unencoded path segments proxied
to the address-book host, a sign-out that never terminates the session, and no
CSRF protection anywhere in a service with three cookie-authenticated
state-changing POSTs.

Amir's review excluded this repo by instruction. Sam's pass raised the items
machine-side and left every disposition null. **Nobody has looked at them.**
This should be the first thing scheduled, ahead of draining the address-book
backlog.

## The three things that block merge

Unchanged by the consolidation — all three live outside address-book, in repos
only Sam reviewed, and all three are still at their originally reviewed commits.

### 1. The backend's operator check cannot reach the address book

Three independent breaks on the same call path, none caught by any test:

- **Env var** — the backend binds `operators.url` from `TRADE_IMPORTS_OPERATORS_URL`
  (default `:8091`), but the workspace stack sets `TRADE_IMPORTS_ADDRESS_BOOK_URL=…:8089`
  on that same container, and the ins-frontend reads the `ADDRESS_BOOK` name too.
  Three consumers, two names, two ports. Ruling cv-042 says the backend should have
  flipped to `TRADE_IMPORTS_ADDRESS_BOOK_URL` on 8089; the workspace side complied,
  the backend did not.
- **Path** — `OperatorsApiClient` calls `/operators/{id}`, but the address book only
  ships `/organisation/{orgId}/addresses[/{id}]`. Every check would 404 to `NOT_FOUND`.
- **Header** — the client forwards `Trade-Imports-Crn`; the address book's
  `IdentityHeaderFilter` requires `Trade-Imports-Organisation-Id` and 400s without it.
  No repo in the epic sends the CRN header at all, so the submit guard fails closed
  the moment any notification carries an `operatorId`.

The integration tests miss all three because `IntegrationBase` wires the mock at
`<mockserver>/operators/` (a doubled path production cannot make) and stubs with a
wildcard `.*/{id}` matcher.

### 2. The new frontend has nine Critical security findings

See the section above — this is the untriaged block.

### 3. The E2E page objects bind to a UI that does not exist

The five new address-book page objects model an *operator* address book — "Add a new
operator", a seven-radio `operatorType` step, `approvalNumber`, `transporterCategory`.
The delivered frontend is an *address* book with none of those, and asserts their
absence in its own tests. The specs also call `navigateToFrontend()`, which resolves
the animals-frontend base URL (:3000) — the address book lives on :3002, and no
Playwright project, base URL or config entry was added. The Mongo seed likewise
targets db `trade-imports-operators` / collection `operators` with a `_class` pointing
at a package this epic deletes.

## Open findings on address-book (126)

The six Amir was tracking are all still live — five of them merged with Sam's
equivalent, one carried alone:

| Live # | Sev | File | Issue | Also raised by |
|---|-----|------|-------|---|
| 121 | Major | `AddressRequest.java` | Javadoc still says countryCode has no length check | Amir #189 |
| 122 | Minor | `application.yml` | Comment still claims api-docs stays enabled everywhere | Amir #193 |
| 123 | Major | `ProxyConfigTest.java` | `@AfterEach` ProxySelector restore is a no-op | Amir #200 (Minor) |
| 124 | Major | `AddressSearchIT.java` | No IT that `q` excludes addressLine1-only hits | Amir #201 (Minor) |
| 125 | Major | `EmfMetricsPublisherTest.java` | NaN-skip test does not assert skip behaviour | Amir #199 |
| 126 | Major | `operators.yml` / controller | Location still Relative; `create` builds it with `URI.create` | Amir only |

Where the two reviews graded the same defect differently, the merged entry keeps
Sam's text and severity — his was written at `bbf547c`, so its line numbers are current.

The other 120 are Sam's, and 14 of those are the CONTRADICTS set — the disagreements
that need a human ruling before anything is drained. They are set out one by one in
[CONSOLIDATION.md](CONSOLIDATION.md#contradicts-14).

Four Criticals are live on address-book, all raised by Sam's 2026-08-04 refresh and
all verified against the tree:

1. `EmfMetricsPublisher.java:23` — two constructors, neither `@Autowired`; with
   `aws.emf.enabled` defaulting to true the context fails to refresh at startup.
2. `ProxyConfig.java:102` — JVM-global `Authenticator` hands the CDP proxy password
   to any host that returns a 401.
3. `docs/openapi/operators.yml:184` — `page` regenerated as `type: string`, losing
   `format: int32`; `minimum` is inert on a string so the constraint is still unexpressed.
4. `AddressRequestValidationTest.java:200` — the cv-011 guard test was deleted and
   inverted to pin `@Size(max = 2)` on countryCode.

Amir's review saw none of the first three; his own prescribed fixes are the proximate
cause of all three. He saw the fourth and reached the **opposite** verdict — he asked
for `@Size(max = 2)`. That one is a spec question, not a code question.

## Acceptance Criteria Check

| # | Criterion | Met? | Notes |
|---|-----------|------|-------|
| — | — | N/A | EUDPA-58 is an **Epic** with an empty Acceptance Criteria section. Judgement below is inferred from the committed spec/design artifacts. |
| 1 | Addresses are visible to users in the IMP journey | Partial | The ins-frontend renders list/view/edit/delete, but the list has no per-row link, so view/edit/delete are unreachable from the UI. |
| 2 | Addresses are scoped to the signed-in organisation | Yes (service) / Partial (frontend) | The service enforces it correctly. The frontend passes `credentials.organisationId` straight through with no guard, so a missing relationship claim sends the literal `undefined` in both path and header — which the service accepts, pooling those users. |
| 3 | The published API contract matches the service | Partial | `api-contract.locked.yaml` was rewritten wholesale to the camelCase model and all nine prior contract items closed. Two residuals: the lock drops the `required` arrays `operators.yml` declares on `OperatorResponse`/`OperatorPageResponse`, and the two documents disagree on the `page` parameter type. The compliance gate was widened but still ignores `required`, parameter schemas, status-code sets and media types — so both residuals ship green. |
| 4 | Notifications verify referenced operators exist | No | See block 1 — the call path cannot succeed as wired. |

## Next steps

1. **Triage `trade-imports-ins-frontend`** — 153 items, 9 Critical, nobody has read them.
2. **Rule the 14 CONTRADICTS** — particularly C-1 (cv-011 `@Size(max = 2)`: is it a
   spec deviation or the correct fix?). Nothing on address-book should be drained
   until these are settled, because several of them are fixes that were already
   applied and closed once.
3. **Fix the two new address-book Criticals that block startup and leak credentials**
   (C-2, C-3) — both are small, specific and were introduced by the last fix round.
4. **Drain the 27 remaining un-cross-referenced items** from Sam's `6f1134b` cohort
   with a walker pass; the other 73 are already archived on Amir's evidence.
5. Address the three merge blockers above — backend integration, ins-frontend
   security, E2E page objects — none of which has moved since 2026-07-29.

Full item tables with per-file evidence are in each `review.{repo}.md`. Cross-repo
analysis is in `file-reviews/{repo}/_consistency-check.md`.
