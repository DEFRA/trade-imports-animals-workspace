# pp-065 — fix pass 4. One collection. Then it lands.

**Tests repo.** **`git status` first — all four files are staged and correct. Preserve them.** Stack is
up; do not rebuild. Playwright specs here run against the real stack.

## The finding, and I let it through

`tests/e2e/journeys/plant-products/plant-products-notification.spec.ts:37` — **the depth-3 commodity
tree carries only ONE variety.** With a one-element collection there is no middle, so the
middle-entry-removal property this increment's contract requires **cannot be proven**. Reordering and
the loss of an interior variety both stay untested.

**You told me this and I missed it.** Your fix-pass report said you substituted "first for middle
variety removal" — that substitution was necessary *because* there was no middle, and I read it and
moved on. The review caught it. **That is the standard on this build: for any collection, demand
removal of a MIDDLE entry with survivors asserted by identity and order, and a first or last one too.**

## The change

Walk **all three MABSD varieties** in a deliberate order, and assert the persisted `varieties` array as
an **exact three-element** collection — each variety **ID** and its **enum class** — by identity and
order.

The three are in `services/commodities/fixture.js:224-236` under `'0808108090'` → `MABSD`: McIntosh Red
`03107EFA-9BCD-1089-565E-B28F73994DEC`, Spartan `035ECF9F-7B6C-078D-60D5-D2947C23A366`, Royal Gala
`0C245190-A316-5B88-F38E-360FBBFB208F`. **Read that file and copy from it — do not type them from this
brief.** Classes for that commodity are `CLASS_I`, `CLASS_II`, `EXTRA_CLASS` (`fixture.js:243`).

⚠ **Watch the label, not just the id.** Your earlier mutation used `McIntosh` where the rendered label is
`McIntosh Red`, and you corrected it rather than accepting the failure as the proof — right call, and
the same trap is waiting here.

**Keep the walk as short as it can be while carrying three varieties.** This spec already runs a full
twelve-spoke journey against the real stack; do not let it grow further than this requires.

## Everything else stays

The review gave a per-case verdict on all six co-residency cases and every one still discriminates —
including the isolation assertion, which holds because an own-set response contains both its reference
and set-specific content, so the negative assertions genuinely fail there. The cross-browser case is
confirmed thin. **Change nothing else.**

## Verify

- The full plant suite — **report the flaky count**; it settled from 8 to 1 last run.
- `test:live-animals` — 141 collected, the 139 pre-existing passing, co-residency passing.
- `typecheck`, `lint`, `format:check`.
- Explain any test-count movement. **Stage, do not commit.** Never run `sonar`.

## Prove it, and this time it must be the middle

1. **Delete the MIDDLE variety** from the expected array → the test must fail by name.
2. **Delete the FIRST** → must fail.
3. **Swap two varieties' order** while keeping the same set → must fail, proving the assertion is
   order-sensitive rather than set-sensitive.

Report all three failing test names. **If any of them passes, the collection is not pinned by identity
and order and you have more to do.**
