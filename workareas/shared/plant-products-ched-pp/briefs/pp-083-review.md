# pp-083 — review brief

Review the **staged, uncommitted** change in `trade-imports-animals-frontend` (11 files,
+225/−19). `git status` first. **Do not unstage, revert or commit. Do not start over.**

The increment pins the declaration legal copy against literal values, moves two hardcoded English
connectors out of accessible names into both copy bundles, and makes table caption visibility a
per-table decision.

## Axes I HAVE ALREADY CHECKED — do not re-tread

1. **The literals are genuine literals.** `declaration/copy/copy.test.js` now asserts inline string
   values, not values read back out of `copy.en.js`. That was the increment's single biggest risk and
   it is clear.
2. **Plan claims verified before briefing:** `copy.test.js:31-34` really did assert only
   `toHaveLength(6/4/7)`; `summary-row.js:25` and `commodities.js:153` really did hardcode ` for `;
   `template.njk:23-24` really did apply one visible caption class to every table.
3. The implementor's three mutations, each reported failing by name.

## ⚠ FINDING I HAVE ALREADY MADE — confirm provenance, do NOT fix it here

**All four English regulation strings, and all four Welsh ones, end with an unmatched `"`:**

```
'Regulation (EU) 2016/2031, (retained EU legislation)"'
```

`copy.en.js:61` — `legal.request` — **opens** a quotation (`'"I/We hereby request APHA/SASA to …'`)
and each of the four list items at `:63-66` **closes** it. So the closing quote is **repeated on
every item** instead of appearing once at the end of the quoted block. Same shape in `copy.cy.js:64-67`.

This is **landed pp-039 copy**, so per the standing rule it is a **new increment, not a fix inside
pp-083** — findings on already-landed work never get rewritten into the current increment.

**What I want from you:** determine whether this is **our transcription error or a faithful copy of
an upstream IPAFFS defect.** Check the CHED-PP trace source for the declaration page. The distinction
matters and there is precedent both ways: the build deliberately did **not** carry over IPAFFS's
misspelled "Folkstone" (pp-015 ships the correct "Folkestone"), so a faithful-but-wrong upstream
string is still something we fix. Report which it is, with the file and line of the trace you
checked. **Do not edit the copy.**

⚠ **Related and important:** pp-083 now pins these strings as *contractual values*. That is correct
for the increment — the point is to stop the copy drifting — but a future reader could mistake a
literal pin for **validation** of the text. **Say explicitly whether any OTHER pinned literal looks
wrong**, on the same reasoning. Read all five new assertions against the trace, not just for
self-consistency. Note `'No finalised CHED shall be used issued in respect of…'` reads oddly — "used
issued" — check it.

## Axes that have had NO review — spend your effort here

**A. The `toBeVisible` swap.** The implementor reports it added a `not.toBeVisible()` assertion and
then **replaced it** with computed-CSS assertions (absolute positioning, 1px dimensions) because
Playwright treats GOV.UK's clipped visually-hidden element as visible. That reasoning is plausible,
but **replacing an assertion during verification is exactly where intent silently weakens.** Judge
whether the replacement still discriminates: would it fail if the caption were fully visible? Would
it fail if the caption were `display:none` (wrong in a different direction — it would be removed from
the accessibility tree entirely rather than announced once)? **Prefer an assertion that pins the
announced outcome over one that pins CSS mechanics**, and say so if a better one exists.

**B. Does the Welsh accessible-name test genuinely discriminate?** ⚠ **The locator trap that caught
pp-024 and pp-079:** `getByRole('link', { name: /^Change / })` puts the space **in the filter**, so a
link named exactly `Change` never enters the collection and every following assertion passes without
it. Check every new locator for this shape. Confirm names are asserted **exact, row-scoped and
distinct** — "asserted distinct" is load-bearing, because a formatter that returns the same name for
every row would otherwise pass.

**C. Is the caption policy pinned in BOTH directions?** Hiding a duplicate caption and keeping the
distinct commodity captions visible are two separate claims. A test proving only the hidden case
cannot detect a later change that hides the commodity captions too. Confirm both are pinned by tests
that fail independently.

**D. Did anything weaken?** One length-only test became five literal tests, and the implementor
claims no existing assertion was weakened. **Verify against the diff rather than taking it.** ⚠ pp-080
is the precedent: a rewrite moved substring → exact matching (a real gain) and **simultaneously**
dropped section scoping, invisible in the diff stat and invisible to a green ladder. Check
`summary-row.js`, `change-link.js` and `commodities.js` for scope or specificity lost in the move.

**E. `lint:arch` went 2,128 → 2,131 dependencies with modules unchanged at 671.** The implementor
attributes this to explicit Welsh imports in the browser spec. That is consistent with
`.dependency-cruiser.cjs:181`, which excludes only `\.test\.js$` — an `.e2e.spec.js` **does** count.
Confirm the three new edges are exactly those imports and that no cycle or new module was introduced.

**F. Are the copy keys added to BOTH bundles with the MACHINE-DRAFT banner intact**, and does
copy-parity genuinely cover the new connector keys rather than passing because they are absent from
both sides?

## Rules

- Production code **inside `sets/plant-products/` is in scope**; anything outside is `ok:false` with
  evidence, not a silent edit.
- Report each finding as **real / real-but-owned-elsewhere / speculative**, with file and line.
- **Findings on already-landed code become new increments.** Only findings on this staged work get
  fixed now.
- **Welsh is covered** — a Welsh-speaking tech lead reviews the copy once complete. Do not escalate
  machine-draft Welsh as a risk; only flag a Welsh string that is structurally wrong (a mixed-language
  accessible name, a missing key, an English word left in).
