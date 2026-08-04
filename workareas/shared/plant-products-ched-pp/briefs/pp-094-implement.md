# pp-094 — the plant notification list has no secondary sort key

This brief OVERRIDES the generic `implement.md`. **BACKEND repo**, branch `spike/trace-to-requirements`.
Backend ITs run under Failsafe: **`mvn verify`, never `mvn test`.**

## The evidence, gathered by me — do not re-derive it before starting

`PlantProductsNotificationService.findAll` (~line 102):

```java
Pageable pageable = PageRequest.of(page - 1, listPageSize, PlantProductsNotificationSort.toSort(sort));
```

The live-animals original it was transposed from does the same thing **and then adds a tiebreak** —
`FulfilmentService.java:252-253`:

```java
Sort rowSort = FulfilmentSort.toSort(sort)
    .and(Sort.by(Sort.Direction.ASC, "_id"));
```

**The copy dropped it.** That is the whole defect.

## ⚠ WHY THIS IS NOT A THEORETICAL CONCERN

The dashboard's **default** sort key is `transport.arrivalDate` (`PlantProductsNotificationSort.java:38`),
and **a draft has no `transport` at all** until the user reaches that page. So the sort key is absent for
most of what a real user sees, and MongoDB does not define the order of documents with equal sort keys.

Measured by me tonight against the running stack: **58 dashboard-visible notifications, 55 of them with
no arrival date.** The four seeded documents are the **first four ever inserted**, yet they came back at
positions **18, 21 and 22** — so insertion order is demonstrably not ordering the ties either.

The user-visible consequence is a row appearing on **two pages, or on neither**, while someone pages
through their own notifications.

## The change

Append a secondary sort key, mirroring the exemplar. **`_id` matches `FulfilmentService` byte for byte;
`referenceNumber` is unique, stable and more meaningful to a reader. Pick one, say which and why.**

**Do not change the primary sort or the default.** Existing sort tests must pass without their
assertions being edited — if one needs editing, that is a finding worth reporting, not a licence.

## ⚠⚠ THE HAZARD IS THE MUTATION, AND IT RUNS THE OPPOSITE WAY TO USUAL

Normally an inert mutation falsely **confirms** a finding. Here the risk is the reverse.

You will write the test, then remove the tiebreak to prove it fails. **With a small collection MongoDB
may well return a consistent order anyway** — the storage engine is not obliged to vary, only permitted
to. So the mutation may stay **green even though the defect is real.**

**If that happens, do NOT conclude the tiebreak is pointless and do NOT quietly weaken the test.** The
defect is the absence of a *guarantee*, not the presence of an observed *failure*, and a guarantee is
not something a behavioural test can always reach. Report exactly what you saw.

In that case, and only in that case, add a second explicitly-labelled assertion that pins the effective
`Sort` includes the tiebreak — and **say in your notes that it is an implementation pin, why behaviour
alone could not cover it, and what it therefore does not prove.** A stated limitation is worth more than
a test that reads stronger than it is.

## What to test, and at which level

**Unit (`PlantProductsNotificationServiceTest`)** — the discriminating case is notifications that all
**tie** on the primary key, several with **no `transport.arrivalDate` at all**, which is the normal state
of a draft. A test over rows with distinct arrival dates proves nothing about this.

**Integration (`src/test/java/uk/gov/defra/trade/imports/animals/integration/PlantProductsNotificationIT.java`)**
— ⚠ note that path: the plant ITs live under the **`animals.integration`** package, not a plantproducts
one. I got this wrong in the plan and corrected it; the file already has a `findAll(page, sort,
referenceNumber)` helper at ~line 650 and list coverage at ~line 234, so follow what is there.

The IT is the only level that can reach MongoDB's actual behaviour. Insert **more than one page** of
notifications that all tie on the primary sort key, read page 1 and page 2, and assert the two pages are
**disjoint** and their **union is the whole set** — no row on both, none missing. That is the property a
user cares about; asserting an exact ordering is weaker and more brittle.

## Constraints

- **Do not touch live-animals code.** `FulfilmentService` is correct and is your reference, not your
  target.
- `NotificationService.java:314` (the live-animals **admin** list) also sorts with no tiebreak. **Leave
  it alone.** It is a different surface with a different audience and I have not investigated whether
  ties are reachable there. Note it in `notes` if you learn anything; do not fix it blind.
- **Never invent test data.** Every notification you insert must be built the way the existing ITs build
  theirs.
- One round-trip test plus one unknown-value negative per enum — **never** a test per enum constant.
- Compact-constructor null guards on public records at API boundaries (house rule; only if you touch
  one).
- Any test count that moves must be explained: `git diff --staged -U0` then
  `grep -cE "^- *(it|test|describe|void )"`.
- **`mvn verify` green end to end**, run to a file under `<workarea>/logs/` and read it once.
- **Stage, do not commit.** Never run `sonar`.

**AN `ok:false` IS OFTEN THE MOST VALUABLE OUTCOME AND I MEAN IT.** My briefs have been wrong eight
times now — including the IT path in this increment's own plan, which I caught myself minutes ago — and
every time the implementor or reviewer was right. If the evidence above does not hold when you look,
**say so rather than building to my description of the world.**
