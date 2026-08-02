# Tickets to raise — defects in SHIPPED code found during the plant-products build

Nothing here has been raised in Jira. Each entry is a paste-ready draft: the description bodies are in
**Jira wiki markup, not markdown**, because `tools/jira/create-ticket.sh` passes the description raw.

These are all defects in **live-animals code that is already shipped** — not plant-products programme work.
They were found by transposition: the plant-products build copied a live-animals implementation, and
reviewing the copy surfaced faults nobody had looked for in the original. Each is tracked in
`backlog.json` as an increment too (so the build can fix it), but each also deserves a ticket in its own
right because it is a defect in the product rather than in this programme.

| Draft | Increment | Severity | Code fixed? | One line |
|---|---|---|---|---|
| T-1 | pp-069 | High | **Yes — `c4c8eb6`** | Concurrent copy replay can error instead of returning the existing copy |
| T-2 | pp-071 | High | **Yes — `1f77efc`** | Malformed request bodies return 500 instead of 400 across the API |

**T-2 grew when it was investigated — update the draft below before raising.** The catch-all was not
downgrading one exception but a whole class. Under Spring 6.2.10 it swallowed `TypeMismatchException` and
`MethodArgumentTypeMismatchException` (400), `ConversionNotSupportedException` (500),
`HttpMessageNotReadableException` (400), `HttpMessageNotWritableException` (500),
`MethodValidationException` (500), `HandlerMethodValidationException` (400 input / 500 return-value),
`AsyncRequestTimeoutException` (503), `ErrorResponseException` and `ResponseStatusException` with their
declared status (covering 405, 406, 413, 415, 400, 500), and any `RuntimeException` carrying
`@ResponseStatus`. **Two of this ticket's own assumptions were wrong:** the Servlet-side exceptions
(`HttpRequestMethodNotSupported`, `HttpMediaTypeNotSupported`, `MissingServletRequestParameter` and
friends) are *checked* exceptions and were never caught by a `RuntimeException` catch-all at all; and the
predicted `@WebMvcTest` slice defect **does not exist in animals** — all four slice classes already
discover `GlobalExceptionHandler`, 0 assertions ran on an incomplete stack, all 84 passed unchanged. So
**drop the slice-audit half of this ticket**: that gap was specific to the plant-products slices and is
already fixed by `e2fbdaf`.

**The fix landing does not remove the need for the ticket.** These are defects that reached shipped code
and were live in whatever environments run this branch's predecessor; they want a record with a cause and
a date, not just a commit buried in a spike branch. Raise them, then link the commit.

---

## T-1 — Fulfilment-copy idempotency recovery runs inside an aborted Mongo transaction

**Type:** Bug · **Repo:** trade-imports-animals-backend · **Increment:** pp-069

**Summary:** `Idempotency-Key` replay of a fulfilment copy can return an error instead of the existing copy under concurrency

**Description (Jira wiki markup):**

```
h2. What happens

Two concurrent {{POST}} copy requests carrying the same {{Idempotency-Key}} can both miss the
existence check. One insert wins; the other receives a {{DuplicateKeyException}}. The recovery
lookup that is supposed to return the winning copy then runs *inside the same Mongo transaction
that the failed insert has already aborted*, so it fails rather than returning the existing copy
with 201.

h2. Why it is not caught today

The copy method is {{@Transactional}} and {{MongoTransactionManager}} is registered
unconditionally ({{animals/configuration/MongoConfig.java:91}}), so this is a real transaction
rather than a no-op. No test reaches the path: the replay test is sequential, the index test
inserts directly, and the unit test mocks a successful post-exception lookup — which proves the
catch block compiles, not that the contract holds under a race.

h2. Impact

The idempotency guarantee is exactly what a race is supposed to preserve. A client retrying a
copy during contention can receive an error for an operation that in fact succeeded.

h2. How it was found

The plant-products package transposed this implementation per ruling R4 ("match live-animals
exactly"). Reviewing the copy surfaced the flaw; the original had never been reviewed for it. The
corrected implementation and a genuinely concurrent regression test landed in plant-products as
commit {{4ebf8b3}} and are the reference for this fix.

h2. Acceptance criteria

* The duplicate-key recovery lookup cannot execute inside a transaction aborted by the failed insert.
* A genuinely concurrent integration test proves the losing request returns the existing copy with 201 and that exactly one document is persisted. A Mockito-fabricated post-exception lookup does not satisfy this.
* Sequential replay, the unique partial index and header validation are unchanged.
* {{mvn verify}} is green end to end.
```

**Note when raising:** check first whether the same aborted-transaction pattern appears elsewhere in the
animals package — any `@Transactional` method that catches `DuplicateKeyException` and then reads. If it
does, this is a bug class and the ticket should say so.

---

## T-2 — GlobalExceptionHandler's RuntimeException catch-all downgrades framework exceptions to 500

**Type:** Bug · **Repo:** trade-imports-animals-backend · **Increment:** pp-071

**Summary:** Malformed request bodies return 500 instead of 400 because a catch-all swallows Spring's own exceptions

**Description (Jira wiki markup):**

```
h2. What happens

A malformed JSON request body returns 500 instead of 400. Confirmed against a running server for
{{POST /notifications}}.

h2. Root cause

{{GlobalExceptionHandler}} carries a {{RuntimeException}} catch-all. Spring raises
{{HttpMessageNotReadableException}} for an unreadable body, which the framework would resolve to
400 on its own, but the catch-all intercepts it first and maps it to 500.

{{HttpMessageNotReadableException}} is not special — it is simply the instance that surfaced. Any
Spring framework exception extending {{RuntimeException}} is liable to the same downgrade:
unsupported media type, method not allowed, missing request parameter, argument type mismatch. The
set actually affected needs enumerating.

h2. Impact

On shipped API surface a client cannot distinguish "your request was malformed" from "the server
broke". A 500 also implies a server fault to monitoring and alerting when the cause is client
input.

h2. Why it is not caught today

The {{@WebMvcTest}} controller slices omit {{GlobalExceptionHandler}}, so they exercise Spring's
default exception resolution rather than production's. A slice therefore asserts 400 and passes
while the running application returns 500. This was proved in the plant-products package: adding
the production advice to the slice made a previously-green test fail exactly as production does.

h2. How it was found

The identical defect was fixed in the plant-products package as commit {{e2fbdaf}}; probing the
animals endpoints while proving the root cause showed animals shares it.

h2. Acceptance criteria

* A malformed body, a literal-null body and a missing body each return 400 with the problem-style shape and no stack-trace content, proved by integration tests over the real HTTP stack for every endpoint family that accepts a body.
* The catch-all no longer downgrades framework exceptions that carry a correct status of their own; the set it was swallowing is enumerated in the fix.
* The {{@WebMvcTest}} slices load the same exception-handling stack as production, so a slice cannot be green where the application is broken. The number of assertions previously running on the incomplete stack is reported.
* No behaviour change for well-formed requests; existing tests pass without their assertions being edited.
```

**Note when raising:** the slice-context half is arguably a second ticket — it is a test-quality defect
across the suite rather than an API bug. Raise as one if the fix is one change; split if the audit turns
out to be large.

---

## Also worth a conversation, not yet a ticket

- **Do T-1 and T-2 share a house pattern?** Both are cases where a defensive construct (a transaction, a
  catch-all) is applied broadly enough to break the narrower case it encloses. If the same shapes were
  copied across packages, fixing the pattern once beats fixing instances.
- **The slice-context gap is a suite-wide question.** ~68 MockMvc assertions in the plant-products slices
  ran without production's advice. The animals slices have not been audited.
