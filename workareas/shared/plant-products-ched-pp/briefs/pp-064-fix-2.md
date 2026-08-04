# pp-064 — fix pass 2. Five review findings, two of them scoped by me.

**Tests repo.** **Your 28 staged files are correct — `git status` first and preserve them.** The suite is
green at plant 65/65 zero flaky and live-animals 139. Stack is up; do not rebuild.

**Your three "corrected expectations" were all checked and all cleared.** The review traced each to the
frontend source: the commodity row comes from `commodities.js` using the input-method heading; optional
`grossVolume` stays in scope so it renders while only its unit is gated; and the "duplicate" origin
target existed **only in the old expectation** — `origin-of-import` legitimately owns both fields, and a
blank internal reference renders an *"Add a missing answer"* link rather than a Change link. **No defect
was blessed.** That was the thing I was most worried about and you got it right.

---

## FIX 1 — the assurance does not prove group membership. Take this in full.

`hub-groups-and-cya-rows.spec.ts:56-72`. You assert the eleven headings as one global sequence, then
**every** task-list item flattened into one global ordered array. I checked it myself: **those are two
independent sequences.** Move a spoke from the Purpose group into the Origin group and leave Purpose
empty — the eleven headings are unchanged, the flattened row order is unchanged, and the assurance
passes while the mapping is wrong.

**This is the one thing this spec exists for.** `GROUPS` is hand-authored in the hub controller and
nothing in the frontend enforces it, so this is the only executable statement of §2.1.

**Assert each heading together with the exact rows in its own immediately-associated task list**, so
membership is pinned rather than inferred from two global orders. Keep the strict full-list form — do
not swap exact arrays for `toContain`.

**Prove it:** move one row between groups in your expectation and show the test fails. Report the name.

## FIX 2 — status transitions, and I am SCOPING this against the review's advice

The review asks for **every** mandatory row driven through *Not yet started → In progress → Completed*.
**I am not asking for all twelve, and here is why** — disagree with me if you think I am wrong, that has
been the right call ten times tonight.

Per-row status computation is a pure function of answers, and it is already pinned at unit level in
`sets/plant-products/journeys/linear/flow/task-rows.test.js`, which pp-041 strengthened hours ago onto a
canonical fixture. A real backend does not change how a status is computed — it changes whether the
answers **persist**. Driving twelve spokes through three states each, against a real stack, on a suite I
have measured as contention-sensitive, would buy duplicate coverage at a large runtime cost.

**So: add the full three-state walk for the three collection-bearing rows — Commodity, Accompanying
documents, Transport to the BCP** — where a partially-answered section is most likely to be
mis-scored, and where the collection interacts with persistence. Leave the rest asserting their gated
and completed states as you have them.

**State this limitation explicitly in a comment-free way in your report**: which rows get the full walk,
which do not, and that per-row status computation is pinned at unit level. **A stated scope is worth
more than silent partial coverage.**

## FIX 3 — CYA ownership, also scoped

The review wants every CYA action enumerated **and** every owning-page return path exercised. **Split
those two halves — the first is cheap and kills the class, the second is expensive per link.**

- **Enumerate every rendered CYA action by accessible name with its complete expected href, including
  query parameters.** One page render, no journey walking. This is the part that catches a wrong target
  or a missing `?change=1` on any row, and it must be a complete ordered list, not a sample.
- **Round-trip a representative few**: one per card family, including the Transport one you already
  have and the blank-internal-reference *"Add a missing answer"* case, since that link differs in kind.

Say which you round-tripped and which you only pinned by href.

## FIX 4 — traders false-branch validation. Take this in full.

`traders.spec.ts:24` exercises only the destination gate. The frontend requires `destinationName`,
`destinationAddressLine1`, `destinationCity`, `destinationPostcode` and `destinationCountry` when "No"
is selected, and **any one could lose its linked validation without failing your test.** Add
parameterised cases: populate the destination, clear each required field in turn, submit, assert the
corresponding error-summary href. Cheap, one page, no journey walking.

## FIX 5 — consignor persistence. Take this in full.

`consignor.spec.ts:59` — the test name says it persists the confirmed operator, but the `toMatchObject`
omits several entered address fields. **A mapping defect dropping `addressLine1`, `addressLine2`, `city`
or `postcode` would pass.** That is precisely the real-backend persistence purpose this repo exists for.
Include every entered field, including all address lines, city, postcode and country.

---

## Constraints

- **Do not touch the eight built-vs-plan divergences.** They stay asserted as real behaviour.
- **Do not weaken any assertion to make something pass.** Scoping a locator is a fix; loosening an
  expectation is not.
- **Report the flaky count** on the final full plant run — you achieved zero contention failures last
  time and I want to know whether it holds as the suite grows.
- Full ladder: plant suite, `test:live-animals` (**139**, necessary but NOT sufficient — say so),
  `typecheck`, `lint`, `format:check`.
- Explain any test-count movement: `git diff --staged -U0` then
  `grep -cE "^- *(it|test|describe)\("`.
- **Stage, do not commit.** Never run `sonar`. At most 3 self-repair attempts, then `ok:false`.

## Mutations I expect, each by failing test NAME

1. Move a row between groups → FIX 1's assertion must fail.
2. Point one CYA action at the wrong owning page → the enumerated-href assertion must fail.
3. Drop one required destination field's validation → FIX 4's parameterised case must fail.

**Say what the code now does differently before believing any result.**
