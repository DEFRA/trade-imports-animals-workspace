# pp-065 — fix pass 3. One assertion. Then it lands.

**Tests repo.** **`git status` first — everything is staged and correct. Preserve it.** Stack is up.

## You found a real defect and you were right not to touch it

`/live-animals/notifications/{plantRef}` returns **500**, not 404 — and you reported it rather than
adjusting anything, because the brief permitted only the cookie change. Correct call, and **it had been
masked**: the cookie assertion failed first, so this one never ran until we fixed that. A failing
assertion hiding the next one is worth remembering.

**I traced the mechanism rather than relaying it.** Both entry guards call
`const { journey, answers } = await get(request, h)` **before** anything establishes that the journey
exists or belongs to this set — `live-animals/.../entry-guard.js:54` and
`plant-products/.../entry-guard.js:47` are the same shape. So an unknown or foreign notification id on a
guarded path produces an unhandled error in **both** sets. **Not a plant defect, and not yours to fix.**
Recorded for Sam.

## The change: assert the property, not the status code

**The isolation property holds** — the other set's notification is **not served**. Only the error shape
is wrong. So assert **isolation directly and independently of the status code**: the response must not
render the other set's notification (its reference and content must not appear).

**Do NOT pin `500`.** That would bless a defect as intended behaviour, which is the trap this build has
hit before — pp-081 found a test whose name promised one thing while its assertion encoded the defect as
correct.

**Do NOT pin `404` either.** It does not do that today and the test would stay red.

**State in your notes** that the current status is 500, that 404 is what it should be, and that the
assertion deliberately pins the isolation property rather than the status so it neither blesses the
defect nor blocks the increment. **A stated gap beats both a red test and a decorative one.**

Do the same for the reverse direction if the spec asserts it (`/plant-products/notifications/{liveAnimalsRef}`)
— check whether it behaves the same way and say so either way.

## Everything else stays

The corrected cookie assertion, the authenticated `/` 302 with its surviving 301 mutation proof, both
journeys in one context, the DOM-derived static asset path, the unprefixed routes, the whole-journey
spec, and the thin cross-browser case that passed 6/6.

## Verify

- Full plant suite — **report the flaky count**. Yours was 8 last run, one above the 0–7 I have seen;
  say whether it settles.
- `test:live-animals` — 141 collected; **the 139 pre-existing must pass and the co-residency test must
  now pass**.
- `typecheck`, `lint`, `format:check`.
- No count movement beyond what this change implies. **Stage, do not commit.** Never run `sonar`.

## Prove it

Point the isolation assertion at the notification's **own** set — where it genuinely renders — and show
it **fails**. That proves the assertion discriminates "not served here" rather than passing because the
page never renders anything useful. Report the failing test name.
