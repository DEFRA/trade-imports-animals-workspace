# pp-030 — increment-specific guidance (read alongside implement.md)

Increment id: **pp-030** — "transport-before-bip — BCP, premises, transport, arrival, containers".
Repo: **frontend** (`repos/trade-imports-animals-frontend`), branch `spike/trace-to-requirements`.

Full spec in `backlog.json` under this id — fifteen acceptance criteria and seven open questions.
Read it there; it is the contract. This is the largest page in the set so far: a conditional
sub-select, a date, a time, a boolean reveal and a nested collection.

---

## 1. Two fixtures land here — that is your structural proof

This page is the first consumer of **`bcps.js`** (pp-015) and **`transport-options.js`** (pp-016).
`lint:arch` is currently **0 errors / 6 warnings**; both should drop off the orphan list, leaving
**4**. If they do not, the fixtures are not really wired in — **say so plainly rather than explaining
it away**. This check has caught real wiring twice (pp-018, pp-020) and costs nothing.

Do not "fix" the remaining warnings; they clear as their own pages land.

## 2. The pins that must be MUTATION-PROVED

Construct the violation, watch it fail, restore byte-identically, report the exact message.

- **`usesContainers = No` purges committed container rows.** This is the highest-value pin here and
  it is silently violable: leaving orphaned rows in the document renders and navigates perfectly and
  only surfaces as junk in the submitted payload. Commit rows, switch to No, and prove they are gone
  from persistence — not merely hidden from the page.
- **The premises allowlist.** A premises value that is not on the POSTed BCP's list must be rejected
  server-side, and changing the BCP must wipe an out-of-scope premises answer. Both are reachable
  only by a crafted POST; a UI-driven test cannot construct them.
- **The arrival-date window, on BOTH edges.** `[today, today+90]` inclusive: today accepted,
  today+90 accepted, yesterday rejected, today+91 rejected. Pin all four — a one-sided boundary test
  passes against an off-by-one. Note this is the CHED-PP window; do not import a sibling CHED's
  numbers.
- **A forged or out-of-range container row index is refused.** pp-012 found the engine persisting a
  sparse fulfilment map before it threw; make sure a refused index leaves persistence untouched.

## 3. Legacy defects to FIX, not port — and how to prove it

The spec lists several. Three are accessibility defects that axe will **not** catch, which pp-017
demonstrated when an empty fieldset legend passed both axe scans at serious/critical:

- the means-of-transport select's `Choose from:` accessible name;
- the `official-seal-1` checkbox accessible name — visible label is **'This is an official seal'**;
- date and time hints not associated via `aria-describedby`.

**Assert the computed accessible names and the `aria-describedby` wiring directly.** Axe is
necessary, not sufficient. Also fix the pre-selected `usesContainers = No` default — there must be
**no pre-selected radio**.

Time of arrival is a real fieldset legend over two `govuk-input--width-2` Hour/Minute fields (the GDS
asking-for-a-time pattern), committing as an `'HH:mm'` string. **No custom datepicker, no
repurposed date-input for the time, no custom CSS** — govuk macros only.

## 4. Error copy

Generated from the **visible labels**, never the legacy `Identification` / `Document` /
`Add … details` strings. One canonical message per rule (c-018). Errors render as the GDS
'There is a problem' summary whose links move focus to the offending control, so **input name = id =
error key**. An invalid POST re-renders **raw** values at 400.

## 5. Standing rules that apply here

- `filesToTouch` is a hypothesis — **twelve consecutive increments have found the plan wrong about
  existing code.** Open the real files first; report anything already delivered, missing or extra.
- **No test may be deleted or renamed without being reported.** If a count moves, name every change.
- If an L1 file's assertion encodes the old shape, the **standing ruling applies**: update it, never
  weaken it, never truncate a journey to dodge a moved assertion, report before/after.
- Obligation section files carry **no display text** (obligation-purity). Copy is bilingual and
  structure-identical in both bundles.
- Never invent data. The BCP-to-premises mapping is pp-015 fixture data with a **recorded gap** on
  the authoritative rule — use what the fixture says and do not extend it. Genuinely missing fact →
  `ok:false` with where you looked.

## 6. Open questions — implement the plan's answer, flag, do not stop

The plan already records seven. Three you will meet directly: containers has **no `minEntries`**, so
`Yes` with zero rows currently completes the row; there is **no row cap** (legacy had 70); and 'This
is an official seal' is **placeholder copy** for a confirmed legacy content gap. Build them as the
plan says and flag them in your report — do not invent a floor, a cap, or replacement wording.

## 7. Hygiene and ladder

- Baseline first: `npm run test:plant-products`, expect **211**. Red baseline = stop and report.
- Baseline SHA-1 stays `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.
- `npm run format` before finishing. **Do not commit** — the orchestrator lands it.

```
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products   # BASELINE, expect 211
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend test
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run lint
PORT=3050 npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:features:plant-products
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run test:live-animals
npm --prefix ~/git/defra/trade-imports-animals/repos/trade-imports-animals-frontend run format
```

Report **numbers**: plant units, full `npm test`, `test:live-animals`, plant Playwright, lint:arch
errors/warnings. Baseline: plant units **211**, `npm test` **1,801 passed / 8 skipped**,
`test:live-animals` **559** (must stay 559), plant Playwright **34**, lint:arch **0 / 6** (expect
**0 / 4** after).
