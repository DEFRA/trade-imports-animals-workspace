# EUDPA-288 backlog pile

Sam appends items to **The pile**; the loop agent works them **top-first**, one at a time. Add items
in any format — one line is enough; indent extra context under the item if useful.

Item lifecycle (the LOOP maintains these markers, Sam only writes `- [ ]`):
- `- [ ]` todo (Sam writes these)
- `- [~]` in progress
- `- [x]` done — the loop appends `(commit <hash> — <one-line outcome>)`
- `- [!]` blocked — the loop appends the reason and moves on to the next item

## The pile (top = next)

<!-- Sam: add items here. Top item is picked next. -->

## Pre-seeded suggestions (from the parity-harness session — Sam: promote to the pile, reorder, or delete)

- [ ] Generate + commit the linux visual baseline (`origin-of-import-main-linux.png`) via the branch
      tests image (now published), so the main-suite visual spec passes in CI.
- [ ] Port EUDPA-281 actor identity to the reworked journey: submit/amend in
      `live-animals/services/persistence/records/real/lifecycle/transition.js` should send the actor
      body (`actor-helpers.js` kept on the branch as the contract reference). First check whether the
      branch backend needs main's ActorRequest handling merged.
- [ ] Honest-ledger E2E gaps (see PARITY-MAPPING.md): 10-document cap; at-cap (10MB) + one-byte-over
      upload boundaries; documents-page no-JS refresh fallback; amend outbox envelope
      (aggregateVersion 2 / NotificationSubmissionAmended fields).
- [ ] Parity lane polish: separate output dirs per parity invocation (second run currently overwrites
      the first's HTML report); fix or retire `test:docker-compose:visual` (matches zero specs).
- [ ] Stale owner-era cleanup: 4 FE test titles in `real.*.test.js` still say "owner headers";
      `engine/journey.js` ownership-authority comment now false in real mode.
- [ ] Reworked-journey visual regression spec (origin page) if wanted — deliberately not authored so far.
