# pp-091 — pin the full journey profile's own shape

This brief OVERRIDES the generic `implement.md`. **Test-infrastructure only. No production code.**
Small increment — do not let it grow.

## The gap, stated precisely (it is easy to overstate this)

`review-notification.e2e.spec.js`'s `tableExpectations()` derives every collection expectation by
mapping over `fullJourneyValues` — **the same object the journey driver fills the pages from**. Input
and expectation move together.

**What the existing assertions DO prove:** if the rendered page dropped a row while the driver entered
three, the expectation of three rows would fail. **They protect the page.**

**What they CANNOT detect:** the **profile itself** being thinned, because the expectation follows the
input down. **Verified by my mutation on pp-085:** removing the **middle** nominated contact from
`fullJourneyValues` left the whole review spec green, including the test named *'reads back the fully
populated journey, pins collection order and exposes distinct Change names'*.

**The coupling is PRE-EXISTING, not introduced by pp-085** — HEAD's spec already declared a local
`fullJourneyValues` and derived from it identically. pp-085 moved it into the shared helper and
preserved behaviour exactly. But that **centralisation is why it now matters**: one edit reduces
coverage for **three** specs at once.

**This is live, not theoretical.** pp-086 (`ba4e6c57`, one commit ago) edited `fullJourneyValues` — it
substituted commodity line 2 from `08059000`/CIDAC to `0808108090`/MABSD and swapped an invented
variety id for a real one. **I checked and it did not thin the profile.** But that is the second
increment in three to edit this object with nothing guarding its shape.

## ⚠ RULING 1 — WHERE THE PIN LIVES. I have ruled this; do not re-open it

The increment asks whether the pin should be a cheap Vitest unit test beside the profile rather than a
browser test. **No — keep it in the Playwright layer.**

`journey.e2e-helper.js:1` is `import { expect } from '@playwright/test'`. A Vitest test importing that
module drags the Playwright runtime into the unit suite — **mixing test runners for a marginal speed
gain.** Not worth it.

**But make it cheap: write a `test()` that does NOT request the `page` fixture.** Playwright only
instantiates fixtures a test actually asks for, so a pure data assertion costs no browser.

**Put it in `review-notification.e2e.spec.js`**, beside the test my mutation defeated — that keeps the
guard next to what it guards and adds **no new module** (`.e2e.spec.js` files DO count toward
`lint:arch`, unlike `.test.js`). If you think a dedicated spec file beside the helper is better because
all three specs share the profile, **say so with reasons and stop** — that is a legitimate
disagreement, but then the module count moves and you must report it.

## ⚠ RULING 2 — FOUR COLLECTIONS, NOT THREE. The plan misses one

The plan names nominated contacts, documents and commodity lines. **The `full` profile has FOUR
collections of three**, and I counted them myself in `journey.e2e-helper.js`:

- `commodities.lines` — 3 entries (~`:114`, `:129`, `:146`)
- **`containers` — 3 entries (`:174`–`:176`): `CONT-1/2/3`, `SEAL-1/2/3`, with `officialSeal`
  `false/true/false`** — the alternating boolean is itself middle-sensitive, so this collection was
  clearly built for the same purpose. **The plan omits it. Include it.**
- `nominatedContacts` — 3 entries (~`:190`, `:196`, `:202`)
- `documents` — 3 entries (~`:210`, `:215`, `:223`)

**Re-derive these counts and line numbers yourself; correct me with evidence if I am wrong.** My briefs
have been wrong seven times on this build and the implementor or reviewer was right every time.

## ⚠ RULING 3 — MINIMUM SHAPE, NOT CURRENT CONTENTS

Assert **at least three** per collection, not exactly three. Adding a fourth contact later must **not**
fail this pin — that is acceptance criterion 4, and a `toEqual(3)` would violate it.

**State WHY three is the number, in the test or a short comment beside it**: below three there is no
**middle** entry, so a bug that always removes index 0 is undetectable. **pp-026 shipped exactly that
bug and it passed 360 unit tests and 108 of 109 browser tests**; pp-077 then grew a commodity to three
species specifically to close it. The pin encodes that rule, not today's contents.

## ⚠ RULING 4 — LENGTH ALONE IS NOT ENOUGH. THIS IS THE PART THE PLAN DOES NOT ASK FOR

A `length >= 3` pin is satisfied by **three identical entries** — which would keep the count while
destroying exactly the property three entries exist to provide. Distinctness is the real invariant.

**So also assert the identifying value of each collection is DISTINCT across entries** — the container
number, the contact's identifying field, the document's, the commodity code. If a future edit
duplicates an entry to pad the count, that must fail too.

Without this the pin guards the number and not the meaning, which is the pp-084 lesson: a weaker
assertion sitting beside a stronger one is how the strong one gets quietly made redundant.

## ⚠ THE EXISTING ASSERTIONS ARE KEPT, NOT REPLACED

Acceptance criterion 3 is explicit. The derived read-back assertions still prove the page renders what
was entered, in order, in the right card. **This increment ADDS a guard they cannot provide.** If you
find yourself deleting a derived assertion, stop — that is the pp-080 shape, where a rewrite
strengthened one axis and silently weakened another.

## The decisive mutation, and it must be the real one

**Remove the MIDDLE entry** (index 1) from each of the four collections **in turn** — not the first,
not the last — and show a test fails **by name** each time. Report the four names.

Then **also** show the first-or-last case fails, per §6's rule that a collection needs both.
Then **duplicate** an entry to keep the length at three and show the distinctness pin fails.

**⚠ Restore `fullJourneyValues` byte-identically afterwards** and re-run, because on this build an
inert mutation has falsely refuted as well as falsely confirmed — most recently on pp-078, where a
green run made both me and the reviewer believe a pin was missing when the guarantee lived elsewhere.
**Say what the code does differently before believing any result.**

## Baselines — I ran all of these myself at `ba4e6c57` (pp-086)

- `test:plant-products` — **728** (58 files)
- `npm test` — **2,366** / 8 skipped (217 files)
- `test:live-animals` — **559** (65 files) — **a change is a REGRESSION**
- `test:features:plant-products` (**`PORT=3201`**) — **258**
- `lint:arch` — **0/0**, **671** modules, **2,127** dependencies; shasum
  `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`

**The plant Playwright count must not FALL.** It should rise by however many `test()` blocks you add.
Adding to the existing spec adds **no module**; a new `.e2e.spec.js` would. Derive it yourself.

## Rules

- **Test-only. No production code.** A forced production change is `ok:false` with evidence.
- **Never invent a fixture value.** You are pinning shape, not adding data.
- Any test count that moves must be explained:
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- Shared axe helper only; never a new inline `AxeBuilder` block.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.
