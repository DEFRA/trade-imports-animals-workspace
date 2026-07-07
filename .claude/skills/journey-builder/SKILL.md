---
name: journey-builder
description: Build the real live-animals journey prototype (prototypes/standalone/live-animals in trade-imports-animals-frontend) on the obligations-v2 page-owned-spine model. Digest mode (available now) distils the requirement sources — Confluence "Live Animals Data Fields V4", the src/server skeleton journey, the interaction-design canvas — into a canonical machine-readable spec (journey-spec.json + conflicts.json) reviewed at a spec gate. Build modes (scaffold / add-page / add-field / add-collection / backlog / build loop) arrive with Phase 3 once the obligations-v2-spike refactor settles. Use when the user asks to digest journey requirements, build/refresh the live-animals journey spec, or run the journey-builder loop (triggers: "digest journey requirements", "journey spec", "journey-builder", "build the live-animals prototype"). NOT for the car-insurance spike itself or for generic ticket work.
---

# journey-builder

Run-id: the EUDPA ticket (currently **EUDPA-249** — no separate ticket for
this programme). State lives in
`workareas/journey-builder/<run-id>/`; the canonical spec lives in the
frontend **worktree** at
`<workarea>/frontend-worktree/prototypes/standalone/live-animals/spec/`
(branch `spike/<run-id>-live-animals-spec`) — never write into
`repos/trade-imports-animals-frontend` directly: other agents work in that
checkout.

Programme plan: `~/.claude/plans/so-in-the-frontend-reflective-yeti.md`.

## Mode: digest (Phase 1 — available now)

1. `tools/journey-builder/prepare-digest.sh EUDPA-X` — seeds workarea +
   worktree + cached sources + extract placeholders + spec skeleton.
   Idempotent; `--refetch` refreshes cached sources.
2. Fan out THREE `general-purpose` Task subagents in parallel, one per
   source (confluence-v4, skeleton, ixd-canvas), each told:
   "Follow ~/git/defra/trade-imports-animals-workspace/.claude/skills/journey-builder/references/SOURCE_EXTRACTOR.md
   for source <s>, run-id EUDPA-X."
3. Verify every extract has `status: "complete"` and non-trivial counts
   (`jq .status,.fields,.pages,.behaviours` per file). Re-spawn gaps —
   do not extract in the parent.
4. Spawn ONE `general-purpose` Task subagent:
   "Follow .../references/SPEC_RECONCILER.md, run-id EUDPA-X."
5. Parent re-runs `tools/journey-builder/spec-lint.sh EUDPA-X` — never
   trust the worker's green.
6. **Spec gate:** present to Sam — the uncommitted diff in the worktree,
   lint counts, conflicts, modelGap markers, and the open design questions
   (wipe-vs-retain, partial page completion, address copy-vs-reference,
   inline comments, provisional copy). Commit on the spec branch only
   after Sam approves.

## Modes: scaffold / add-page / add-field / add-collection / backlog / build / verify

Not yet built — Phase 3 of the programme plan (blocked on the
obligations-v2-spike refactor settling, then vendor-copy of the engine).
The deterministic touch-lists come from the spike's `EXTENDING.md`.

## Tools

`tools/journey-builder/`: `prepare-digest.sh`, `extract-add-item.sh`,
`extract-finalize.sh`, `spec-add-field.sh`, `spec-add-page.sh`,
`spec-add-conflict.sh`, `spec-add-behaviour.sh`, `spec-add-fieldgroup.sh`,
`spec-lint.sh [--format]`.
