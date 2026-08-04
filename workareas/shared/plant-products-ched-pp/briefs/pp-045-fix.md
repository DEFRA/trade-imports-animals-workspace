# pp-045 — fix pass

**YOUR WORK IS STAGED AND MUST BE PRESERVED. `git -C <frontend> status` FIRST. DO NOT START OVER.**
Repo: trade-imports-animals-frontend, `spike/trace-to-requirements`, staged on top of `079cada3`.
Rollback is `git stash push -u`. **Stage, do not commit. Never run `sonar`.**

The review returned **one** finding and I found **one** more. Both are real. Everything else it checked —
the four rendering rules, the pp-097 guard, path isolation, table structure and accessibility, and the
pp-100/pp-101 scope separation — it confirmed, and I am not asking you to revisit any of it.

**⚠ The unplanned `services/records/stub.js` change is CORRECT and STAYS.** I verified it independently:
`PlantProductsNotificationCopyMapper` copies only what `PlantProductsNotificationContentSnapshot`
carries, and that class has **no accompanying-documents field at all** — documents are a separate backend
resource. The review corroborated it from the other side, citing
`PlantProductsNotificationServiceTest.java:534` requiring no accompanying-document repository
interaction. **Do not revert it.**

## FINDING 1 — the dashboard Copy form drops the list query, so a recover cannot always re-render the original key

**⚠ THE REVIEW'S DIAGNOSIS IS RIGHT AND ITS FRAMING IS WRONG IN ONE WAY THAT MATTERS. Read this before
you touch anything.**

The mechanism it criticises — `toRow(journey, retryCopy)` matching the retry key by `journeyId` against
the rendered rows — is **exactly what live-animals does** (`dashboard/view-model/row/index.js:24-26` and
`controller.js:48,74`). It is a faithful transposition and **you must not re-architect it.** Do not
invent a standalone retry banner, do not change the matching rule, do not touch the live-animals side.

What is genuinely broken is narrower. The Copy form posts to `pagePath(journeyId, 'copy')` with **no
query string**, so on the recover path `renderDashboard` reads `request.query` from a POST that carries
none and renders the **default** list — page 1, no filters. If the user was on page 2 or filtering, the
source row is not in that render, `retryCopy` matches nothing, and **the original idempotency key is
never re-rendered**. The user then retries from a freshly-minted key. If the backend had in fact created
the copy and only the response was lost, that retry creates a **second notification** — which is the
precise outcome the idempotency key exists to prevent.

**The review also made a sharp point about its own test blindness that you should take seriously:** the
existing recovery test passes only because its source row is the only row on the default page. A test
that cannot distinguish "the key was re-rendered" from "the row happened to be there anyway" is not
pinning rule 3.

**THE FIX.** Carry the current list query on the Copy form so the recover render reproduces the same
page and filters. **Plant already has the facility** — `dashboard/controller.js:148` builds
`listQuerySuffix` via `buildListQueryString({...})` for its own pagination links, so use that rather
than inventing a second query builder.

⚠ **CHECK ROUTE VALIDATION FIRST — this is a claim, not an instruction.** The copy route uses
`kit.routeOptions`. If that validates the query and would reject unknown parameters, appending a suffix
to the form `action` will 400 rather than recover. **Establish which it is by reading it.** If the suffix
is safe, use it. If it is not, carry the list query in **hidden inputs** on the form and have
`recoverCopy` rebuild it from `request.payload` instead. **Say which route you took and what the
evidence was.** Do not guess, and do not loosen route validation to make the first option work.

**THE TEST THAT MUST FAIL WITHOUT THE FIX:** a failed copy initiated from a **filtered or non-first-page**
dashboard re-renders a dashboard on which the **source row is present** and its Copy form carries the
**ORIGINAL** key, not a fresh one. Assert **by reference** — never by a row count, a total or an
absolute position; the list is org-wide, page size 25, workers `fullyParallel`.

## FINDING 2 — mine: the narrowed pp-097 assertion is now vacuous

`review-notification.e2e.spec.js` previously asserted `main form[method="post"]` had count 0. You
correctly had to narrow it once the Copy form appeared on that page, and you kept the
`getByRole('button', { name: copy.continue })` count-0 assertion — good, that one is untouchable.

But the narrowing filters the form set to **forms containing a Continue button**, and the assertion
immediately above already pins Continue at count 0. **The filtered assertion is therefore implied by its
neighbour and can no longer fail on its own.** It reads like a guarantee and is not one — the pp-095
"pin with an exemption that swallows it" shape.

**THE FIX.** Make it assert what is now true and load-bearing: on a SUBMITTED review page there is
**exactly one** POST form in `main`, and its `action` matches `/copy$`. That keeps the original
guarantee (a resubmission form would make the count 2 and fail) and adds a real one (the only POST form
here is Copy). **Do not delete either existing assertion.**

## Verification

Re-run the full ladder and report every number, explaining any that moves:

```
test:plant-products · npm test · lint · lint:arch · PORT=3201 test:features:plant-products ·
test:live-animals · format
```

Your own reported figures to beat: plant **742** (59 files), `npm test` **2,381 / 8 skipped** (218
files), Playwright **262** zero flaky, `test:live-animals` **559** unchanged, `lint:arch` 0 new
violations (673 modules, 2,145 dependencies), shasum `0762285ef5bfdd1f06af6fbea491e5e69b53e19a`.

**`test:live-animals` unchanged at 559 is NECESSARY BUT NOT SUFFICIENT — say so.** Production code
outside `sets/plant-products/` stays off limits. **An `ok:false` with evidence beats a forced fix**; if
either finding turns out to be wrong when you read the source, say so and show me why.
