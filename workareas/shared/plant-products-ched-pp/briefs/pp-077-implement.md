# pp-077 — extend the commodities fixture so depth-3 removal and varietyClass-null are testable

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree.

This is a **data** increment. The whole of it is provenance. **A wrong row here is worse than no row**,
because every later test that consumes it inherits the lie.

---

## 1. ⚠ NEVER INVENT DATA — THIS IS THE ENTIRE INCREMENT

**Seven increments in this build have stopped rather than fabricate a commodity, an EPPO association,
a species or a fixture scenario, and every one was right.** pp-014, pp-025, pp-026, pp-027 and pp-063
each refused; pp-063 is the reason this increment exists at all — it reported two acceptance clauses
unmet rather than invent a species.

**Stopping twice carries no penalty. Inventing one row does.** If you cannot find a real source for
either case below, **return `ok:false` naming exactly which case failed and what you searched.** That
is a successful outcome, not a failure.

**"From memory" is inventing.** A species name you recognise is not a source. Every added commodity
code, EPPO code, species name, `speciesId` and variety needs a source you can cite, and the citation
goes in the commit body **per addition**.

## 2. Case (a) — a third species under one commodity

Today the maximum is **two**: `SPECIES_BY_CODE['06042090']` holds `CXQDA` (*+ Crataegomespilus
dardarii*) and `LENCU` (*Lens culinaris*). Every other commodity has exactly one.

**Why two is not enough, and this is the point of the increment.** With two entries, removing "the
middle one" is impossible — pp-063's spec can only remove the first of two. A bug that **always
removes index 0** passes that test. That is not hypothetical: **pp-026 shipped exactly that bug and
it passed 360 unit tests and 108 of 109 browser tests**, because the only test that removed anything
removed index 0. The fixture limitation is currently hiding the same blind spot at depth 3.

So: **one commodity must carry at least three species**, real ones, so a genuine middle-entry removal
becomes expressible.

`backlog.json` asks whether a suitable commodity exists inside the current chapter-06/07/08
selection or needs one outside it. **Breadth of the fixture was a deliberate pp-014 property** — if
the honest answer sits outside the current chapters, say so and explain the trade-off rather than
forcing a fit.

## 3. ⚠ Case (b) — VERIFY pp-063'S CLAIM BEFORE ADDING ANYTHING FOR IT

`backlog.json` says no UI path can produce a `varietyClass: null` entry, because "CIDAC requires a
class, MABSD has varieties but no classes **and bypasses the variety page**".

**Check the second half of that before you add data.** Here is what I read in the shipped fixture:

- `CLASSES_BY_EPPO` has **only** `CIDAC` (`CLASS_I`, `CLASS_II`, `EXTRA_CLASS`).
- `VARIETIES_BY_EPPO` has `CIDAC: [{ id: 'NONE', label: 'None' }]` and `MABSD` with **two real
  varieties** (McIntosh Red, Spartan).
- **Both are reachable through the UI.** `CIDAC` is the sole species of commodity `08059000` and
  `MABSD` is the sole species of `0808108010` — neither is orphaned.

So **MABSD already looks like "has varieties, has no applicable class, and is reachable"**. If it in
fact reaches the variety page, **case (b) needs no fixture change at all** and the right outcome is
to say so with the evidence — which page renders, driven by which code path — and add only the
missing *pin*, not new data.

**This build has twice had a reported defect turn out not to exist** (pp-062's entry guard, and one of
pp-063's two claims). Read the controller and the flow rather than trusting the note. **If the claim
holds, say what actually blocks MABSD from the variety page** — that is a more useful finding than a
new fixture row.

**REPORT UNDER-DELIVERY PLAINLY.** If case (b) turns out to need nothing, that is the expected
outcome and pp-029 is the worked example of reporting it well.

## 4. It must be a PURE ADDITION — prove it by diff

pp-014's data has **stated provenance** and must not be perturbed. Every existing commodity code,
EPPO code, species, `speciesId`, variety and class stays byte-identical.

**Check `git diff` on `fixture.js` and report the stat.** Additions only. This build has had three
plans that would have destroyed shipped work by calling an existing file a `create`; the same
vigilance applies to a fixture edit that quietly reshuffles verified rows.

## 5. Record the provenance where the last one went

`docs/README.md` already carries pp-027's `plantsForPlanting` provenance entry (around line 145:
*"set only on 06011010 Hyacinths because CN heading 0601 covers bulbs and roots for planting; 0603197090
and 06042090…"*). **Put this increment's provenance alongside it, in the same voice** — what was
added, and the basis for each claim.

## 6. ⚠ THE TESTS MUST READ THE REAL FIXTURE, NOT A HAND-BUILT COPY

The increment immediately before this one (pp-038) shipped three defects with a green unit suite, and
**all three shared one cause: hand-authored fixtures and mocks standing in for what the system
actually produces.** The sharpest was a test that built `arrivalDate: { day, month, year }` — a shape
no controller ever writes — so the formatter was written to match the invention and 651 tests passed
while the page rendered `undefined/undefined/undefined`.

`commodities.test.js` must assert against the **real exported** `SPECIES_BY_CODE`,
`VARIETIES_BY_EPPO` and `CLASSES_BY_EPPO`, not against a literal re-declaration of the expected data
inside the test file. A test that restates the fixture and then compares it to itself pins nothing.

**Pin what the new entries exist to provide**, not just counts: that the chosen commodity has ≥3
species with distinct EPPO codes **in a stable order** (a middle entry only means something if order
is defined), and — if case (b) needs anything — the varieties-without-classes combination.

## 7. This fixture is inert until something consumes it

`backlog.json` says it plainly: *"the fixture alone changes nothing… a fixture with no consuming
assertion is the dead-spec pattern pp-011 found."* **pp-063's specs are not yours to strengthen in
this increment**, but **state in your report what now becomes testable and where**, so the follow-up
has a named target rather than a good intention.

And note `lint:arch` is at **0 warnings** — every reference fixture now has a consuming page. You are
adding rows to an already-consumed fixture, so **the count must not move**. If it does, you created
an orphan; never "fix" that by deleting or force-importing.

## 8. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-038, `76f25186`) — **every one verified by me in this session**:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **652** |
| `npm test` | **2,283 passed / 8 skipped** (210 test files) |
| `test:live-animals` | **559** (unchanged for the entire build — a change is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **243 passed, zero flaky** |
| `lint:arch` | **0 errors / 0 warnings** (660 modules) |

Full ladder:

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

**The plant suites should grow only by the new pins.** Adding species to a commodity can move
existing browser tests that count rows or pick a species by position — **if any existing test's
expected value changes, report it before/after and explain why the new value is correct.** Do not
adjust an assertion to make a number match; that is how a real regression gets absorbed.

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

## 9. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`.
- **Production code outside `sets/plant-products/` stays off limits.**
- **If my brief is wrong, return `ok:false` and say so.** Two of my briefs have been wrong and both
  times the implementor was right to push back.
- Use the pp-076 shared axe helper if you touch any e2e spec; do not write a new inline `AxeBuilder`.
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
