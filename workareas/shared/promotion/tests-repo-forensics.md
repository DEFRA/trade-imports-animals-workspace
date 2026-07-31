> **Provenance.** Read-only forensic investigation (2026-07-29) of the `trade-imports-animals-tests`
> "port" on `spike/EUDPA-288-model-retrofit`, triggered by Sam's suspicion that the existing tests
> were nuked rather than ported. Git evidence below; nothing was modified.

# Forensic report — tests-repo "port" (pr-012 / `c996502`)

## 1. Verdict

**Predominantly NUKED, with a genuine-but-thin replacement.** Not a like-for-like port. The single takeover commit `c996502` **deleted 44 spec files and added only 5**, with **zero renames** (git `--find-renames` finds none) — delete-most + add-few, not adapt-in-place.

- **57 spec files → 18** — and 9 of the 18 are pre-existing admin/DLQ/a11y-dashboard survivors the port never touched, so only **~9 files represent the promoted journey**.
- Test cases: **~270 `test`/`it` blocks → ~42** (≈85% reduction).
- The commit is **+990 / −5839** lines.

The *shared plumbing* (`page-objects/notification/*`, `flows/journey.ts`, `flows/api-journey.ts`, `auth.spec.ts`) **was** genuinely rewritten to the new frontend — so the claim isn't a total fabrication — but the granular per-page/per-field/validation/error-state coverage was thrown away and replaced by a handful of happy-path integration smoke specs. **The GOLD-STANDARD "27/37 passed" claim is technically true but measures a suite shrunk ~85%.**

## 2. Timeline

Two commits unique to this branch vs `origin/main`:

| SHA | Subject | Diffstat |
|---|---|---|
| `c996502` | test(EUDPA-288): take over the tests repo for the promoted live-animals service (pr-012, p-201) | 93 files, **+990 / −5839**; specs: **44 deleted, 5 added, 4 modified, 0 renamed** |
| `701b8f5` | test(EUDPA-288): verify the promoted deploy-readiness fixes in real mode | 3 files, +2 / −14 |

**Adapted (real ports, correctly target the new frontend):** `flows/journey.ts` (new Overview task-spine + `/notifications/{journeyId}/…`), `flows/api-journey.ts` (now `/fulfilments`), `page-objects/notification/*`, `auth.spec.ts` (real Defra ID sign-in, org-switch, deep-link).

**Added (5 thin `@compose` specs):** `promoted-notification` (1 test), `promoted-lifecycle` (2 — API create/submit/amend/cancel/copy/delete + read-only view), `promoted-documents` (2 — real uploader), `ownership` (1 — 404 cross-owner), `headers` (1 — CSP).

## 3. Coverage lost (44 deleted specs)

- **Per-page journey specs (26)** — field-level validation, error summaries, content assertions for: accompanying-documents, additional-details, addresses, commodities (+details/identification/select), consignees/consignors/consignment-contact/destinations/importers/place-of-origin selects, cph-number, declaration, import-reason, notification-view (draft + submitted), origin, port-of-entry, transited-countries, transporters (+select), plus admin notifications/outbox.
- **Feature specs (12)** — lifecycle *via the UI*: amend, cancel-amend, copy, delete, all-operators; documents behaviours: file-size-limit, file-types, no-js (progressive enhancement), removal, view; outbox-event notification + replay.
- **Persistence specs (2)** — save/reload round-trips.
- **A11y specs (4)** — journey error/filled/initial/view states (dashboard/admin a11y survives).
- **Visual (1)** — origin visual baseline + snapshot PNGs.

No longer tested: per-field validation + inline errors on every journey page; the no-JS/progressive-enhancement path; page-level file-type/size rejection; copy/amend/cancel/delete through the UI; persistence round-trips; journey-page accessibility.

## 4. What's failing and why (static diagnosis — stack not stood up)

`tsc --noEmit` on the current tree is **clean**, and the remaining specs **correctly target the rewritten frontend** (new routes, dashboard at `/`, Overview spine, real Defra ID) — this is **NOT** stale-route/dead-frontend rot.

Likely failure causes are **runtime/environment, not code**:
- All 5 promoted specs + `ownership` + `dlq-events` are tagged `@compose`/`@integration` → they run **only** under `test:docker-compose` against the live stack. Plain `npm test` (grep-inverts `@compose|@a11y|@agent`) now runs **almost nothing journey-related** — the no-stack/canned safety net for the journey is effectively gone.
- The deploy-readiness fixes pr-012 relied on (sign-out session, `LIVE_ANIMALS_MODE=real` reference-data URL, submit→outbox) are claimed fixed in the **frontend/backend** repos at specific SHAs (`5a4b679`, `cb4eb79`, `520c1bf`). The promoted specs pass only if all cross-repo branches are at those SHAs **and** the frontend container runs `real` mode. If not, they fail.
- Plus the documented "known fresh-stack dashboard spec flaky, recovers on retry."

## 5. Recommendation — restore-and-re-port (not fix-forward)

Fixing the 18 current files won't recover ~230 lost cases. Recover deliberately:

1. **Recover deleted specs from `c996502~1` as reference** (`git show c996502~1:<path>`), triaged by value: (a) persistence round-trips; (b) lifecycle via UI (amend/cancel-amend/copy/delete/all-operators — currently only API-level in `promoted-lifecycle`); (c) documents behaviours (file-types, file-size-limit, no-js, removal); (d) per-page validation/error-state specs for surviving pages; (e) journey a11y + visual baseline.
2. **Re-port, don't restore verbatim** — the page-objects + `flows/journey.ts` are already adapted and are the correct foundation; re-express each recovered spec against those + the new `/notifications/{id}/…` routes.
3. **Re-tag for the safety net** — bring back canned/stub-mode journey coverage so `npm test` (non-`@compose`) exercises the journey without the full stack, restoring the pre-port balance.
4. **Reconcile the GOLD-STANDARD claim** — annotate that "27/37 passed" was against a suite reduced from ~270 to ~42 cases; the green tick did not represent equivalent coverage.
