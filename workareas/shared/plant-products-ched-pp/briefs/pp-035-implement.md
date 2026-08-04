# pp-035 — traders-addresses (spoke 10 opener)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong fifteen times, three destructively.

**The largest remaining increment: 15 obligations.** Budget the copy bundle accordingly — en/cy parity
is what goes red first on increments this wide (pp-027's lesson).

---

## 1. Fifteen obligations — manifest before registration

Two independent guards enforce the order, both established by mutation in this build:
`bridge/fulfilment-registry.js:31` rejects a binding whose obligation is not the manifest's own object
by identity, so **manifest exports land BEFORE registration**; `flow/dispatch.js` `assertFullCoverage`
rejects a manifest obligation no page collects. Two bundles under one feature name throws.

**⚠ Obligation NAMES are camelCase, not the kebab display ids in `backlog.json`.** pp-028, pp-031 and
pp-032 all hit this trap. They are answer keys and DOM field names; kebab is the page-slug namespace.

**Obligations stay pure data** — no labels, hints or options. `obligation-purity` enforces it at boot.

**Gated leaves use the L2 helper with the gate obligation passed BY OBJECT IDENTITY, never a string**,
and **leaving scope must purge the stored value**. I proved that class of gate is load-bearing in
pp-028 (flipping it open failed exactly one named test) and again in pp-031. Prove yours the same way,
for each gate you add.

## 2. ⚠ `destinationSameAsConsignee` has NO backend field — this is the subtle one

It is projected as **destination = importer-copy on save** and **re-derived by equality on load**.
That round trip is where this increment can silently break:

- A user answering "same as importer" must produce a destination that equals the importer in the DTO.
- Reloading must re-derive the radio as "same", not present an empty question.
- Changing the importer afterwards, or switching the radio away, must behave as the plan specifies —
  and whatever that behaviour is, **assert it**, because a derived-then-stored value that drifts out of
  sync is invisible until someone reads the payload.

**Prove the derivation both ways with a mutation**: break the equality re-derivation and confirm a test
fails by name. A round trip that only ever gets tested in one direction is the pp-026 class of blind
spot.

The plan flags this in `openQuestions` — if the specified behaviour is genuinely ambiguous, **say so
rather than picking silently**.

## 3. The importer is DERIVED, not collected

Mandatoriness comes from legacy `PartOne @NotNull` evidence: importer, destination and consignor
mandatory, packer optional. **The importer is satisfied by POP-1 auto-population and modelled as a
derived value** — do not build a control that asks for it. **Consignor is pp-036's**, and its
enforcement becomes manifest mandatoriness rolling into the traders row, not a controller rule here.

## 4. The legacy architecture is deliberately NOT ported — six rulings

Each is evidence-backed in the plan; follow them and do not reintroduce the legacy shape:

(a) mini-hub-inside-a-form with a hidden etag → a normal collecting page, no etag (last-write-wins,
Open Q 3); (b) four-column trader tables with bespoke `col-*`/`trader-table`/`table-responsive` CSS →
**`govukSummaryList` per populated party**; (c) empty-slot placeholder tables, which are
screen-reader-meaningless and were shown to pass axe while defective → **no table when empty**;
(d) the 'Same as consignee' link-button, which has no double-click guard, is mislabelled, actually
copies the **importer**, and is one-shot irreversible → **a Radios question naming the importer
honestly**, which also makes it reversible; (e) two equal-weight primary buttons → house single-primary
plus shared save actions; (f) legacy slot-level messages → per-field Joi messages.

**Stay inside the govuk-frontend toolbox** — no bespoke CSS, no client JS.

## 5. Baselines

Run the FIRST command as a **baseline before any edit**. A red baseline is stop-and-report.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
```

Baseline at HEAD (pp-032, `3e32a998`) — verified by me, not quoted from a report:

| Leg | Baseline |
|---|---|
| plant unit (`test:plant-products`) | **500** |
| `npm test` | **2,119 passed / 8 skipped** |
| `test:live-animals` | **559** (unchanged all session — a change here is a REGRESSION) |
| plant Playwright (`test:features:plant-products`) | **184** |
| `lint:arch` | **0 errors / 0 warnings** |

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

This increment consumes `countries.js` if it collects addresses — if so `lint:arch` stays 0/0 because
that fixture is already consumed. **Expect 0/0 unchanged**; a new warning means you created an orphan.
`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. **Every count that moves must be explained.**

**⚠ pp-076 flake, not yours to fix:** axe-core occasionally throws `Cannot read properties of null
(reading 'documentElement')` in an unchanged commodity axe test — a teardown race, no violation
reported. **If you hit it, say so and re-run.** Do not rationalise a genuine failure as this flake.

**On the conditional-radio axe false positive:** established narrow handling exists in six shipped
specs (pp-030's `transport-before-bip.e2e.spec.js:132-152`, pp-031's `goods-movement.e2e.spec.js`, five
live-animals specs). **Only apply it if this page renders a conditional radio**, and keep every part of
its discipline — rule id exactly `aria-allowed-attr`, EVERY node the one `govuk-radios__input` with
that exact `aria-controls` target and a single-element `target` array, any other node or rule fatal,
unfiltered list still printed. pp-032 correctly used none because it had no conditional radio.

## 6. The mappers are EDITS holding everything built so far

`to-dto.js` and `from-dto.js` carry origin, purpose, the depth-3 commodity subtree, additional details,
documents, goods movement and the responsible person. **Your diff to both must be a net addition —
check it**, and add a named section helper to the frozen `SECTION_MAPPERS` list rather than inline
logic, as pp-032 did.

## 7. Hub spoke

Spoke 10. Captions are numbered and **deliberately non-contiguous** — use the canonical number from
§2.1 and **do not renumber the others**. Check-answers rows are **not** this increment's work (pp-038
builds that whole feature).

**State what the hub renders before and after, row by row.** Row states have twice moved by accident
here.

## 8. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement for each. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("` before finishing.
- **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES.** Ask what each test would do if the
  behaviour were broken.
- **AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation. Assert computed accessible names
  directly, and with a summary list per party, make each Change/Remove control name **which party** it
  acts on.
- **NEVER INVENT DATA.** Country codes come from pp-013's `countries.js` as shipped. Five increments
  have stopped rather than fabricate; each was right.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report
  before/after. `co-residency.test.js` pins the plant `sectionIds` array.
- **Production code outside `sets/plant-products/` stays off limits.** A forced change is `ok:false`
  with evidence.
- **Validation copy is one canonical string per rule in the Enter/Select voice (c-018)**, GDS 'There is
  a problem' summary, visually-hidden 'Error:' prefix (c-004 / c-014).
- Run `npm run format` before finishing. **Do not commit** — leave the work staged and report.
