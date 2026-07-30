# Behavioural parity backlog (Stream C, EUDPA-288)

Sam's call (2026-07-30): go DEEPER — mirror the authoritative behavioural suite
`frontend/e2e/live-animals.spec.js` (~40 tests: validation + happy-path +
conditional-visibility + wipe-on-change per concept), not just per-page render/validate.

Ground truth = the frontend spec (line refs below). Reuse `flows/journey.ts` + reach
helpers; API-seeded notifications CANNOT be saved via the UI (see memory
`project_parity_restore_apiseed_cannot_save`) so drive everything through the real flow.
Tag `@integration @duplicated-in-frontend`. Verify each against :3100 before commit.

## Already covered (do NOT rebuild)
- happy-path submit → `journeys/promoted-notification.spec.ts`
- lifecycle create/submit/amend/cancel/copy/soft-delete (API idempotent) + submitted read-only
  + amend re-entry → `features/promoted-lifecycle.spec.ts`
- documents upload/scan(Safe)/download(nosniff/pdf)/remove + file-type reject → `features/promoted-documents.spec.ts`
- per-page render/default/validation/accepts-valid (13 pages) → `pages/*.spec.ts` (DONE 8b5a58b)
- dashboard listing/sort/pagination/delete → `pages/notification-dashboard*.spec.ts`, `features/notification-*`

## Gaps to build (behavioural)
### A. Conditional-visibility + wipe-on-change  [HIGHEST VALUE]
- [ ] A1 import-purpose owed only for internal-market; changing reason→Transit wipes purpose (fe 2317-2392; Transit brings destination-country + port-of-exit into scope)
- [ ] A2 additional-details unweaned question shows only with a triggering commodity line (cattle) not cats (fe 2394-2459)
- [ ] A3 CPH page + addresses-hub row show only with a CPH-triggering commodity line (fe 2461+)
- [ ] A4 transit-countries routed only for rail/road means; changing means wipes saved countries (fe 2114)
- [ ] A5 commercial transporter owed only for commercial type; changing type wipes saved transporter (fe 1946)
- [ ] A6 private transporter keyed details owed for private; partial fill blocks; change type wipes (fe 2015)

### B. Documents edge behaviours
- [ ] B1 oversize file rejected (fe 1222)
- [ ] B2 rejected/virus scan blocks Continue until removed (fe 1222)
- [ ] B3 scan-status poll rewrites a settled row in place (fe 1317)
- [ ] B4 view-file offers no View link while checking, serves with nosniff once clean (fe 1375; partially in promoted-documents)

### C. Enhancement / no-JS
- [ ] C1 country-of-origin autocomplete: combobox filters, selection persists (fe 511); no-JS plain select still submits (fe 3075)
- [ ] C2 port-of-entry autocomplete: name+code search, selection persists code (fe 1810)

### D. Addresses picker
- [ ] D1 picker searches + pages the address book; row on later page saves (fe 1558)
- [ ] D2 add a new address from a spoke copies it into that spoke (fe 1651)

### E. Animal identifiers
- [ ] E1 unit form shows only the identifier types the commodity requires + permanent address for cats/dogs (fe 828); free-text fallback (fe 905)
- [ ] E2 N-of-M counter caps records at declared count; remove frees a slot; count drop blocked naming species (fe 947)

### F. Misc journey behaviours
- [ ] F1 task-page exits: Cancel discards typed input; Save-and-return commits (fe 619)
- [ ] F2 reference strip: Draft tag + GBN-AG on hub/task pages, absent pre-origin (fe 560)
- [ ] F3 import-type routing: blank blocks Continue; non-live routes to holding page; live opens run (fe 277)

Some (C no-JS, B scan-poll timing) may be environment-sensitive on the local stack — verify; drop/flag if not reproducible.

---

## STATUS 2026-07-30 — behavioural parity BUILT + verified

Authored via a parallel workflow (18 agents), then verified serially against :3100 and fixed.
All committed on `spike/EUDPA-288-model-retrofit`. **DONE + green (18 specs):**
- A1–A6 all done (reason/purpose, additional-details, CPH, transit-means, commercial + private transporter)
- C1 (autocomplete enhancement) + C1b (no-JS) + C2 (port-of-entry autocomplete)
- D1 + D2 (address-book picker search/paginate + add-new)
- E1 + E2 (animal-identifier conditional surface + N-of-M cap)
- F1 + F2 + F3 (task-page exits, reference strip, import-type routing)
- B1 (documents oversize reject)

**DROPPED (not reproducible on the :3100 real-mode stack) — flag for Sam:**
- B2 virus-found row, B3 scan-status poll, B4 view-file-while-checking. Real-mode cdp-uploader
  REJECTS a virus file at upload ("could not be uploaded") and settles clean scans instantly, so
  the accept-then-scan stub lifecycle (Checking / Virus found / stuck row) does not occur. Happy-path
  View + nosniff is already covered by `promoted-documents.spec.ts`. These would need the stub stack.

**Fixes made while verifying:** journey.reachTransporterFromHub() + means param on fillArrivalDetails
(arrival is enforced-at-continue, not blank-savable); PartyPickerPage.party() → "Select {name}" radio;
unique per-run name for the add-new address (persistent book).

**OPEN — lane load (Sam decision):** the ~19 added heavy journey specs pushed the local
`test:integration` concurrency to the edge of the defra-id auth stub's capacity — the full lane now
shows ~7 flaky (recover on retry) and one run hard-failed the heaviest spec (promoted-notification, the
full submit) on "unable to sign you in". Both re-runs otherwise green (flaky-recover = pass per the
standing rule). Options: (a) accept flaky-recover; (b) split @duplicated-in-frontend into its own lane
(the tag exists for this) so the core seam lane stays lean; (c) pin local workers lower. Recommend (b).
