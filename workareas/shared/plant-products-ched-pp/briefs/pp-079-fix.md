# pp-079 — fix brief (post-review)

## ⚠ FIRST: run `git status`. YOUR WORK IS STAGED. DO NOT START OVER.

The pp-079 implementation is **staged and correct** across eight files. It must be **preserved**.
Everything below is an addition to it. If you find yourself re-implementing `withChange`,
`journeyCyaSlug`, the traders three-state fix or the input-method row, stop — they are already done and
I have verified them myself against the source.

Two review findings to fix. A third is real and is **explicitly out of scope** — see §3.

---

## 1. The Change-name scan is STRUCTURALLY BLIND to a bare "Change" link (major)

`review-notification.e2e.spec.js` around line 610:

```js
const changeLinks = page.getByRole('link', { name: /^Change / })
const names = await changeLinks.evaluateAll(...)
expect(names.length).toBeGreaterThan(30)
for (const name of names) expect(name).toMatch(/^Change .+/)
expect(new Set(names).size).toBe(names.length)
```

**The trailing space is in the LOCATOR, not just the assertion.** A link whose accessible name is
exactly `"Change"` — which is what the new input-method row renders if its visually-hidden suffix goes
empty — is **never matched, never enters `names`**, and so:

- `names.length > 30` still passes with one fewer link,
- the `/^Change .+/` loop passes vacuously,
- the uniqueness check passes.

Three assertions that look like they cover this, and none of them can see it. **This is pp-024's class
exactly**: every repeated Remove control collapsed to one identical accessible name and **axe reported
no violation at all**. Axe is necessary, not sufficient.

**Do both of these:**

1. **A direct, exact accessible-name assertion for the new row's Change link** — the computed name for
   the commodity input-method row, using the journey-produced `MANUAL` value. Assert the exact string,
   not a pattern.
2. **A guard that closes the blindness itself**: assert there is **no** link on the page whose
   accessible name is exactly `Change`. One line, and it makes the surrounding scan mean what it
   already appears to mean.

The scan block is landed pp-038 code and I would normally defer it — but pp-079 adds a row that
*depends* on that scan for its coverage, and leaving a known-blind assertion in place while adding
work that relies on it is how pp-057 landed with a red suite rationalised as a known flake. The guard
is in scope. **Do not otherwise refactor that block.**

## 2. The test name does not describe what it now discriminates (minor, but it matters here)

Mutating the configured plant `cyaSlug` to `notification-view` currently fails a test named
*'reads back the fully populated journey, pins collection order and exposes distinct Change names'*.
**That name says nothing about edit-save-return**, which is the single behaviour pp-079 exists to
create. **A TEST NAME IS NOT EVIDENCE OF WHAT IT DISCRIMINATES** — pp-026's *'exposes renumbered
indices'* could not detect a removal that always hit index 0 and passed 360 unit tests.

**Preferred:** split the edit → save → return-to-review → value-reads-back sequence into its **own
test**, named for the contract — something like *'saving an edited country of origin returns to the
review page with the new value'*. Reuse the existing journey driver/helper for the populated state;
do not hand-roll a second setup.

**Only if** no reusable driver exists and splitting would duplicate an expensive setup: rename the
existing test so the name states the edit-save-return contract explicitly. **A rename must be reported
with its replacement name** — see §4.

Either way, the bar is: **mutating `cyaSlug` fails a test whose NAME identifies the set-aware
change-return behaviour.** I will re-run that mutation myself and check the failing name.

## 3. ⚠ DO NOT FIX THE HARDCODED ENGLISH `for` — IT IS ALREADY OWNED

The review correctly flags that `summary-row.js:25` builds the missing-answer accessible name as
localized copy plus a hardcoded English `` ` for ${label.toLowerCase()}` ``, so under Welsh it yields a
mixed-language screen-reader name that copy-parity cannot see (it is not a copy leaf). **The finding is
real.** I checked.

**It is landed pp-038 code and it is already increment pp-083**, whose second `filesToTouch` entry is
this exact defect, plus the same hardcoded-connector problem on the intended-final-users action.
Findings on already-landed work become new increments — **we never rewrite history to fold them in**,
and pp-083 already exists.

**So: do not touch `summary-row.js`. Do not add copy leaves for it. Do not "improve" the connective.**
If you believe it cannot wait, say so in your report and stop — do not fix it.

## 4. Verification and standing rules

Re-run the full ladder. **The Playwright count WILL move** — 255 at HEAD, and §2 likely adds one.
**Any test count that moves must be explained**, especially downward; pp-017 silently deleted three
browser specs and the only tell was 13 → 11.

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products     # 677 after implement
npm --prefix .../trade-imports-animals-frontend test                        # 2,315 / 8 skipped
npm --prefix .../trade-imports-animals-frontend run test:live-animals       # EXACTLY 559
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch               # 0 / 0
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with its replacement named. Run
  `git diff --staged -U0` then `grep -cE "^- *(it|test|describe)\("`.
- `test:live-animals` must stay at **exactly 559** — this increment touches shared platform code and a
  move there is the cross-set regression the split exists to prevent.
- **Do not mock a function and assert the mock's own return value.**
- Run `npm run format`. **Leave everything staged. Do NOT commit.**
- If either fix is wrong, return `ok:false` with evidence rather than forcing it. Four of my briefs
  have been wrong and every time the implementor was right.
