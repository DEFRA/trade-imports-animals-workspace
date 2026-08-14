# EUDPA-328 — Phase 1 results

Run 2026-08-14. Nine workers, one per DR2.1 screen group, each on its own port.

## Outcome

| | |
|---|---|
| Workers | **9 of 9 returned, 0 errors** |
| Screens captured | **70** |
| Screens blocked | **0** |
| Wall-clock | 11.5 minutes |

Every DR2.1 view is covered, and the workers went beyond the brief where it was
warranted — conditional reveals on `reason-for-import`, error states, populated states,
and "bare" variants of the notification actions.

The frontend needed no work: Phase 0 established it already had clean-state coverage on
all 28 pages, so the whole of Phase 1 was prototype-side, exactly as Phase 0 predicted.

## The corpus

| Side | Models | From |
|---|---|---|
| Frontend | 33 | `fe-miner/capture/model/` — mined from the `features` suite's own traces, `main` at `32f6106c` |
| Prototype | 70 | `harness/capture/model/` — DR2.1 cartographer, prototype at `7da4f70` |

29 pairs compared, **468 mechanical deltas**, plus 4 frontend-only and 23
prototype-only screens. Pairing lives in `compare/pairs.js`; deltas in
`compare/deltas/`.

The canonical capture run — the whole walker, serially, on one port — is **26 specs,
all green, 2.7 minutes**. That is the repeatable command for refreshing the prototype
side of the corpus when the designers move.

## The extractor had to change first

The capture workers found that the prototype builds its two most important spine
screens from bespoke `app-*` markup rather than govuk-frontend components:

- `notification-hub` uses `app-notification-hub__tasklist` — zero `govuk-task-list`
- `review-notification` uses `app-dr2-review-card` with raw `<dl>` — no `govuk-summary-list`
- the templates list sort `<select>` sits outside any `<form>`

Diffed naively, each would have read as *"the prototype has no task list at all"* — a
confident, wholly false finding on the screens that matter most. The extractor now
captures the **concept** rather than the component, under three new keys — `taskItems`,
`summaryRows`, `allFields` — and the differ compares those. Both sides were re-captured
afterwards so the corpus is consistent.

That the prototype has left the govuk-frontend toolbox on its spine screens is itself a
candidate finding, and is carried into Phase 3 rather than treated as noise.

## Leads carried into Phase 3

All **unverified** — Phase 3 reviewers are instructed to confirm each in the source and
to report leads that turn out to be wrong.

**Germinal products** (the largest expected band):

- A germinal commodity asks Net weight, Type of package (27 options) and Number of
  packages *per donor species*; a live animal asks only Number of animals.
- `numberOfPackages[…]` is the same field name with two contracts —
  `validateNumberOfPackages` returns early for non-germinal commodities, so the
  live-animal field is never validated while the germinal one is mandatory.
- The summary aggregates packages across species into one row per commodity while the
  questions stay per-species, and Remove removes the whole commodity.
- On a germinal-only consignment the change link still reads "Change number of animals"
  (`changeCountLabel` hardcoded) — likely a prototype defect.
- Germinal package fields are a hardcoded template branch, not the `packagingFields`
  data mechanism, so two unrelated mechanisms produce packaging fields.
- Mixed consignments render both question sets on one page — an obligation and
  cardinality question, not a copy change.

**Prototype defects worth reporting back to the designers:**

- `renderDeleteNotificationPage` hardcodes a `design-release-2/` view path — the only
  one in `routes.js` — so `design-release-2.1/delete-notification.html` is never
  rendered. The files are byte-identical today, so the DR2.1 copy could be edited
  indefinitely with no effect.
- `view-template`'s primary button says "Save and continue", but the POST only writes
  `templateName` and redirects back to `/templates`.

**Other:**

- `/templates/:templateId/use` renders no page — it seeds the session and redirects. The
  substance of the templates feature is that it pre-completes five hub tasks.
- All four seeded templates are Live animals; there is no germinal-products template, so
  the templates list cannot show how that category renders.
- `review-notification` has two different h1s by variant — the draft variant says
  "Review your notification", the submitted variant uses the notification reference. h1
  is not stable per-route there and will read as a false diff unless the variant is
  recorded.
- DR2.1 `consignment-details` now validates `netWeight`, `packageType` and
  `numberOfPackages` alongside `numberOfAnimals`; the DR2-era journey helper no longer
  gets past the page.

## Most-changed pairs

```
 29 ! fe-transporter-private__dr21-transporter-add-private
 27 ! fe-transporter-commercial__dr21-transporter-add-commercial
 25 ! fe-dashboard-populated__dr21-dashboard
 21 ! fe-dashboard-empty__dr21-dashboard
 19 ! fe-import-reason__dr21-reason-for-import
 19 ! fe-import-purpose__dr21-reason-for-import-internal-market-revealed
 19 ! fe-animal-identification__dr21-animal-identification-details
 19 ! fe-address-picker-consignor-or-exporter__dr21-address-select-consignor-or-exporter
 19   fe-documents-empty__dr21-upload-documents
 18 ! fe-consignment-details__dr21-consignment-details
```

`!` marks a pair whose h1 differs. The two transporter pairs lead the table *and*
disagree on h1, so Phase 3 is told to re-check the pairing itself before trusting the
deltas.

## Tooling built

| Path | Purpose |
|---|---|
| `harness/` | DR2.1 cartographer — 9 worker specs plus the shared extractor |
| `fe-miner/` | Mines the frontend's traces into models; reuses the same extractor |
| `compare/diff.js` | Mechanical differ for one pair |
| `compare/diff-all.js` | Runs every pair, writes `deltas/` and a ranked summary |
| `compare/pairs.js` | The pairing, plus the unpaired screens on each side |
| `compare/phase3.workflow.js` | Phase 3 + 4 — band review, then adversarial refutation |
