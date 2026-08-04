# pp-039 — declaration (attestation + submit)

This brief **OVERRIDES** the generic `implement.md` and **OVERRIDES `backlog.json`** wherever they
disagree. `filesToTouch` is a HYPOTHESIS — wrong sixteen times, three destructively.

This is the increment that makes the journey **completable**. It is the first thing in the plant set
that changes a notification's state on the backend.

---

## 1. ⚠ `finalise` ALREADY EXISTS IN BOTH ADAPTERS AND DOES LESS THAN THE PLAN ASSUMES

I read both before briefing. **Do not treat either as a `create`.**

- `services/records/real.js:179-182` — `finalise` is
  `transition(journeyId, 'finalise notification', { status: BACKEND_STATUS.SUBMITTED })`. It issues
  **only the status PUT**. There is **no whole-document PUT and no declaration overlay.**
- `services/records/stub.js:139-143` — `finalise` exists too, and **throws**
  `Journey "<id>" is <status> — cannot finalise` when the record is not in a finalisable state.

The acceptance criteria require `finalise` to persist
`declaration{ agreed: true, declaredAt: <server ISO instant> }` **via a whole-document PUT, then** the
status PUT — and state that **the finalise overlay in `real.js` is the single writer**. So this
increment **extends both existing adapters**. Check the diff on each and **report it as a net
addition**; `real.js` and `stub.js` carry all of m3's persistence and the DTO round trip.

**The stub's throw is load-bearing for acceptance criterion 7.** "GET or POST on an already-SUBMITTED
notification redirects to `/confirmation` without re-committing or re-submitting" — if the controller
reaches `finalise` on a submitted record, the stub **throws** rather than redirecting. So the
already-submitted branch must be handled **before** `finalise` is called, not by catching its error.
Decide it in the controller and prove it.

## 2. ⚠ THE DECISIVE MUTATION IS THE NOT-READY BRANCH

Acceptance criterion 6: submitting a notification whose `scope.readyForCheckYourAnswers` is false must
**submit nothing** and redirect to review.

**This is the worst failure this page can have and it is invisible on the happy path.** If that branch
silently proceeds, an **incomplete notification reaches the backend as SUBMITTED** — irreversible from
the user's side, and every happy-path test still passes.

**Break it and prove a test fails by name.** Force the `submitJourney` ok:false branch to fall through
to `finalise` and confirm a named test goes red — ideally one asserting *nothing was persisted*, not
merely that the redirect changed. **A redirect assertion alone does not prove the absence of a
write.** Restore byte-identically.

**⚠ Before believing a green mutation, ask what the code now does differently.** Twice in this build a
mutation preserved the behaviour it meant to break and the false result looked exactly like a finding
(pp-025, pp-036).

## 3. The confirmation page DOES NOT EXIST — pin the transient state, do not fake it

`features/` contains no `confirmation` directory; **pp-040 builds it.** So the success redirect points
at a page that is not there yet.

**Assert the redirect TARGET and say plainly that the landing is unbuilt.** Do not stub a confirmation
page to make an e2e read nicely, and do not weaken the assertion to "redirects somewhere".

pp-029 hit exactly this — the Review row had no page until pp-038 and it **pinned the fallback
explicitly rather than leaving it implicit.** That is the standard. Record the transient state in your
report so the next reader knows it is deliberate.

## 4. Records-port parity is the substitute for a real backend here

Acceptance criterion 10: after finalise, load/list marshal the record with `status` submitted and
`submittedAt === declaration.declaredAt` **in BOTH stub and real modes.**

**pp-063 is why this matters.** Everything before it tested against the frontend's own stubs, and the
first increment to test against the real backend found a design decision that had never been
implemented. Until pp-039's own tests-repo coverage exists, **the stub/real parity pin is the only
thing stopping the two adapters drifting.** Assert it in both modes with the same assertion, not two
similar ones.

**`toDto`/`fromDto` must NEVER map a declaration property** — the criteria demand omission assertions.
Prove the omission rather than assuming it. **`to-dto.js` has been marked `create` by this plan family
three times when it holds the entire DTO projection; any diff there must be a NET ADDITION** — check
the stat.

## 5. The negative path the legacy suite never tested

Acceptance criterion 5: submit unticked → **400**, GDS error summary, link moves focus to the checkbox,
matching inline error. Legacy never covered it. Build it properly: `govukCheckboxes` with the standard
form-group/error-message pattern, **not** the legacy bare-div/`errorSpan` markup.

## 6. Copy — carry the defects, and flag the Welsh honestly

The spec says legal and policy strings go in **verbatim from the page spec, with their defects carried
and flagged, not silently corrected.** Honour that: a "helpful" fix to legal text is a change nobody
authorised. Flag each carried defect in your report.

Structural fixes ARE in scope and are the point: six `h2` section headings (**never h4** — the legacy
heading-order defect), and **exactly three external links whose visible text names the destination with
NO `aria-label` overrides** (WCAG 2.5.3). All three `rel="noopener noreferrer" target="_blank"`.

**⚠ WELSH: THIS PAGE IS THE HIGHEST-RISK MACHINE TRANSLATION IN THE BUILD.** pp-038 has just added 101
machine-drafted leaves; this page is **legal declarations, data-protection text and statutory
conditions**. Machine-drafted legal Welsh is a materially different risk from a machine-drafted button
label. **Carry the `// MACHINE-DRAFT Welsh` banner, satisfy copy-parity, and say explicitly in your
report that the legal text is unreviewed** so it lands on the standing content pass with the right
weight. Do not reach for the copy-parity allowlist to avoid translating.

## 7. Scope boundaries

No CUC paragraph (pp-043 adds it behind `isCuc`). No hidden `submissionDate` or `etag` inputs — crumb
only. No legacy outside-`main` reference bar; the shared journey strip goes inside `main`. Back link
targets `/plant-products/notifications/{journeyId}/review-notification` — **the plant CYA slug, not
live-animals' `notification-view`**, which has already caused one wrong value in this build.

`flow.js`'s review section becomes `[reviewNotificationPage, declarationPage]`. **`answerSections`
filters `review` out, so no task-row, hub GROUPS or entry-guard change is due.** A pin for the section
membership already exists — `flow/task-rows.test.js:218` *'registers review-notification as the review
section entry page'* — and I proved it bites. **Extend that pin to cover declaration**; do not leave
the new page unpinned as review-notification originally was.

## 8. Use the pp-076 shared axe helper

Import `features/axe.e2e-helper.js`. **Do not write a new inline `new AxeBuilder` block.** Pass **no**
`permittedConditionalRadio` — this page renders a checkbox, not a conditional radio, so it needs no
carve-out and must not gain one.

**AXE IS NECESSARY, NOT SUFFICIENT** — proven twice by mutation here. Assert the checkbox's and the
three links' computed accessible names **directly**, and assert the link names are **distinct**.

## 9. ⚠ THE LESSON FROM THE INCREMENT BEFORE LAST

pp-038 shipped three defects with a green unit suite, and all three shared one cause: **hand-authored
fixtures and mocks standing in for what the system actually produces.** One test mocked the very
function in question and asserted the mock's own return value; another built an answer shape no
controller ever writes.

**Your controller tests must not mock `finalise` and then assert that the mock was called.** That
proves nothing about persistence. Assert the **resulting record state** through the port — which is
what criterion 10 asks for anyway.

## 10. Baselines — verified by me at HEAD (`5a1accc5`)

| Leg | Baseline |
|---|---|
| plant unit | **653** |
| `npm test` | **2,284 passed / 8 skipped** (210 test files) |
| `test:live-animals` | **559** — a change is a REGRESSION |
| plant Playwright | **243 passed, zero flaky** |
| `lint:arch` | **0 errors / 0 warnings** (660 modules) |

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

## 11. Standing rules

- **NO TEST DELETED OR RENAMED WITHOUT REPORTING IT**, with a named replacement. Run
  `git diff --staged -U0` and `grep -cE "^- *(it|test|describe)\("`. **Any count that moves must be
  explained, especially downward.**
- **REPORT UNDER-DELIVERY PLAINLY** — if a planned file needs no change, say so with evidence.
- **NEVER INVENT DATA.** Eight increments have stopped rather than fabricate; every one was right.
- **L1 shape assertions are IN SCOPE**: update expected values, never weaken a pin, report before/after.
- **Production code outside `sets/plant-products/` stays off limits.**
- **If my brief is wrong, return `ok:false` and say so.** Three of my briefs have been wrong and all
  three times the implementor was right to push back — most recently pp-077, one increment ago.
- Run `npm run format`. **Do not commit** — leave the work staged and report.
