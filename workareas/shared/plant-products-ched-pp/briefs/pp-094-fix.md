# pp-094 — fix pass. ONE change to the new integration test.

**BACKEND repo.** **Your work is already staged across three files and it is correct — `git status`
first, preserve all of it.** The production change, the unit pin and its label all stay exactly as they
are. `mvn verify`, never `mvn test`.

## What my own mutation found

I broke the pagination arithmetic — `PageRequest.of(page - 1, ...)` → `PageRequest.of(page, ...)` — and
ran the plant IT. **Your new test reacted, but not on its own terms:**

```
PlantProductsNotificationIT.findAll_shouldReturnDisjointAndCompletePagesWhenDefaultSortValuesTie:286
  » IllegalArgumentException: The iterable of values to look for should not be empty
```

With the off-by-one, page 2 came back **empty**, and AssertJ's `doesNotContainAnyElementsOf` **throws**
on an empty argument rather than failing on the property. So the test "caught" it by misuse, not by
assertion.

**The real problem is the mirror case, and it is a silent pass.** If pagination broke the other way and
everything landed on **page 2** with page 1 empty, then:

- `doesNotContainAnyElementsOf` on an **empty actual** passes trivially, and
- `containsExactlyInAnyOrderElementsOf` on the union still sees all 26.

**The test would go green on a total pagination failure.** Its centre — that there are two genuinely
populated pages to be disjoint *about* — is unpinned. This is the pattern this build keeps finding: a
real strengthening whose middle nothing holds.

## The change

Before the disjointness and union assertions, **pin the split**: page 1 must hold **25** references and
page 2 must hold **1**, against the effective 25-row page size and the 26 rows the test creates. Derive
them from the constants already in the test rather than typing bare numbers twice.

That turns an AssertJ misuse error into a failure that names the actual problem, and it closes the
silent-pass case.

**Do not weaken or restructure anything else.** The disjointness and union assertions stay — they are
the user-facing property and they are correct.

## Do NOT do these

- Do not touch the production change, the unit pin, or its `.as(...)` label.
- Do not add a page-3 read or an emptiness assertion beyond the split above — out of scope.
- Do not touch live-animals, `NotificationService.java`, or `backlog.json`. Never run `sonar`.

## Verify

- **`mvn verify` green end to end**, run to a file under `<workarea>/logs/` and read it once.
- **Prove the fix**: re-apply the `page - 1` → `page` mutation, confirm the test now fails **by
  assertion on the page split rather than by IllegalArgumentException**, report the message, then
  **revert the mutation and confirm green again**. Mutation evidence must survive the fix, not merely
  precede it.
- Test count: **no test added, removed or renamed** by this change. Report it either way.
- **Stage, do not commit.**
