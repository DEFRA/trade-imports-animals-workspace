# pp-040 — confirmation (submission confirmation panel)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong sixteen times, three destructively.

**This closes the manual own-org happy path** (import-type → … → declaration → confirmation) and the
deliberate 404 pp-039 left behind. `backlog.json` calls it *"the thinnest page shape in the set"* —
it is, and that is exactly why the few things that CAN go wrong are worth naming.

I checked before briefing: `features/confirmation/` does not exist, so all eight `create` actions are
genuine. Three files are `edit` — `features/index.js`, `flow/flow.js` and
`features/declaration/controller.js` — and **all three must be net additions.**

---

## 1. ⚠ THIS PAGE IS ROUTES-ONLY — IT MUST NOT GO IN `dispatchPages`

Every page increment before this one added its `meta` to `dispatchPages`. **This one does not.**
`backlog.json` verified it against the exemplar and I re-checked the claim's shape: live-animals'
`features/index.js` lists `declaration.meta` but **not** confirmation, while `flow.js` places
`confirmationPage` in the review section.

So: **spread its routes into `allRoutes`, and do NOT add a meta to `dispatchPages`.** There is no
`meta.collects`, no obligations, no bindings, no `evaluation.js`, no mapper change, no
`contract.plant-products.test.js` case — there is no collecting POST.

**If dispatch or the registry rejects the page, STOP and report rather than adding a meta to make the
error go away.** pp-023 established that these guards are load-bearing and that working around them
silently is how the wiring gets wrong.

## 2. ⚠ THE DECISIVE SURFACE: `dashboardPath()`, NOT `/`

'Return to your dashboard' must resolve through the **prefix-bearing** `dashboardPath()` at render
time. **A bare `/` is the server-wide 302 to `/live-animals` — it would land the user in the WRONG
SET**, and it looks completely correct in a screenshot.

This is pp-037's lesson repeating: that increment existed because the dashboard uses prefix-free
route-shape builders and prefix-bearing link builders in one file, and swapping them is near-silent.
**Assert the resolved href, not that a link exists.**

**Run a mutation here or on the status guard (§3) and prove a test fails BY NAME.**

## 3. The status guard is the other thing that fails quietly

Deep-linking the confirmation slug on a notification whose status is **not** SUBMITTED must redirect
to that notification's hub. Get it wrong and a draft renders a confirmation panel saying it has been
sent — the worst possible false statement this page could make.

**Break the guard and confirm a named test goes red.** ⚠ **Before believing a green mutation, ask what
the code now does differently** — twice in this build a mutation preserved the behaviour it meant to
break, and both false versions looked exactly like findings.

## 4. Exactly one h1 — the point of the page, and axe will NOT catch it for you

IPAFFS ships this page with **no h1 at all**. Fixing that is the headline ruling. The `govuk-panel__title`
**is** the h1, and `<title>` must match the visible heading.

**AXE IS NECESSARY, NOT SUFFICIENT — proven twice by mutation in this build** (pp-017's emptied
fieldset legend, pp-024's identical `aria-label`s, both green under axe). `backlog.json` already
demands the spec *independently* assert exactly one h1. **Do that as a direct count assertion**, not
as a consequence of an axe pass.

Use the **pp-076 shared axe helper** (`features/axe.e2e-helper.js`). Pass **no**
`permittedConditionalRadio` — this page renders no radio at all and must not gain a carve-out.

## 5. NO CLIENT JS — and therefore NO webpack entry

The bespoke IPAFFS Copy-to-clipboard widget is **deliberately omitted** (JS-only, untested upstream,
identical 'Copy' accessible names, duplicate-id defect). Reference values stay **selectable text**.

**So there is no webpack entry to add here, and adding one would be wrong.** Saying this explicitly
because the opposite rule normally applies in this workspace — a feature bundle that compiles new
client JS must never be deferred, because a missed entry 404s silently. There is no client JS on this
page, so the correct action is none.

Also not carried over: the legacy banner+panel composite, recoloured title-less panel, header-only
notification banner, inline style overrides, `link-button` class, the Qualtrics `footer_feedback`
block, and the stale CVED/CHED-P ids. **Inspection status is a summary-list row**, per the spec's
`govukAlternative`.

## 6. Terminal page

No back link, no continue/save button, no form inputs, no validation messages, **no POST route.**
If you find yourself writing a POST handler, something has gone wrong.

`C085` is a **module constant in the controller, not copy** — it is a code, not text, and is identical
in both locales.

## 7. Copy

English and Welsh structure-identical; copy-convention and copy-parity green; **no user-facing string
outside the copy bundles.** The not-required variant's copy comes **verbatim from the served legacy
template family** (`confirmationGvmsNoInspection.html`), not the unused partials family. The
'What happens next' `ifChanges` line is rewritten service-neutral, dropping the 'IPAFFS will notify
you' branding.

**⚠ Carry the `// MACHINE-DRAFT Welsh` banner and say in your report that the Welsh is unreviewed.**
pp-038 added 101 machine-drafted leaves and pp-039 added legal text; the standing content pass is
already large, so this needs to land on it rather than be assumed fine.

## 8. Co-residency is a TWO-SIDED bar

`backlog.json` is explicit and it is right: the bar is **both sets serving correctly from one process
under their symmetric mounts** — live-animals at `/live-animals`, plant-products at `/plant-products`,
`/` a server-wide 302 to `/live-animals`. **Not a one-sided "live-animals is unaffected" check.**
`npm test` exercises `co-residency.test.js`, which must stay green.

## 9. Baselines — verified by me at HEAD (`9013ab4a`)

| Leg | Baseline |
|---|---|
| plant unit | **668** |
| `npm test` | **2,303 passed / 8 skipped** (212 test files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| plant Playwright | **250 passed, zero flaky** |
| `lint:arch` | **0 errors / 0 warnings** (666 modules) |

```
npm --prefix .../trade-imports-animals-frontend run test:plant-products
npm --prefix .../trade-imports-animals-frontend test
npm --prefix .../trade-imports-animals-frontend run test:live-animals
npm --prefix .../trade-imports-animals-frontend run lint
npm --prefix .../trade-imports-animals-frontend run lint:arch
PORT=3201 npm --prefix .../trade-imports-animals-frontend run test:features:plant-products
npm --prefix .../trade-imports-animals-frontend run format
```

`shasum .dependency-cruiser-known-violations.json` must stay
`0762285ef5bfdd1f06af6fbea491e5e69b53e19a`. **`lint:arch` must stay 0/0** — a new warning means an
orphan.

**⚠ If a Playwright run fails with `net::ERR_NETWORK_IO_SUSPENDED` across unrelated specs, that is the
machine suspending mid-run, not your code — report it and re-run.** It happened once during pp-039.

## 10. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`.
- **⚠ DO NOT MOCK A FUNCTION AND THEN ASSERT THE MOCK WAS CALLED.** pp-038 shipped three defects with
  a green unit suite and all three shared one cause: hand-authored fixtures and mocks standing in for
  what the system actually produces. Assert the resulting behaviour.
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **Production code outside `sets/plant-products/` stays off limits.**
- **If my brief is wrong, return `ok:false` and say so.** Three of my briefs have been wrong and all
  three times the implementor was right — most recently pp-077.
- Run `npm run format`. **Do not commit** — leave the work staged and report.

Exemplar to transpose file-for-file:
`sets/live-animals/journeys/linear/features/confirmation/{page.js, controller.js, template.njk, copy/,
controller.test.js, confirmation.e2e.spec.js}` and `flow.js:85` for the section wiring.
