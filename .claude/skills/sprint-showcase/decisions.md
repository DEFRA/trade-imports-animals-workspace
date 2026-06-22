# sprint-showcase skill — decisions

Recorded during CREATE interview. Update if a shape choice
changes; do not delete entries.

## 1. Purpose

Generate a non-technical Google Slides showcase of a sprint's completed (Done) work, built around audience themes rather than individual tickets. Agents individually research each completed ticket (Jira detail + git history across the trade-imports-animals workspace and its repos) and categorise it at the audience level — new feature, improvement, bug fix (reliability), or quality/velocity work — then the parent synthesises a themed deck that sells how the product is developing and how fixes and technical improvements benefit a non-technical stakeholder audience.

**Design note (2026-06-22):** the slide unit is the *category theme*, not the ticket — one slide per ticket reads as a dull technical changelog to a non-technical audience. The fan-out unit stays the ticket (each agent researches + categorises one); the deck is grouped by category with small tickets aggregated. Categories: NEW_FEATURE / IMPROVEMENT / BUG_FIX / QUALITY_OR_VELOCITY (see `assets/sprint-showcase-schema.md`).

**Window decision (2026-06-22, investigated):** this board does NOT use Jira sprints — `project = EUDPA AND sprint is not EMPTY` returns 0 issues while the project has 200+. So the window is a plain date range (`--from`/`--to`, default last 14 days); there is no sprint-resolution path and no FRESH/REFRESH mode branching.

**Deck-output decision (2026-06-22):** the Google Slides API + OAuth was a blocker for MVP. Instead the deck is built as a `.pptx` via `pptxgenjs` in a new `tim deck generate` command (library-first, no auth, behaviourally tested) — a `.pptx` uploads to Google Drive and opens natively in Google Slides for editing. `render-sprint-showcase.sh` emits `deck-spec.json`; `build-deck.sh` bridges it to `tim deck`.

## 2. State shape

**Choice:** json — per-ticket analysis records (category + headline + user benefit + evidence) plus a parent-authored `narrative` object. Consumed by `render-sprint-showcase.sh` → `deck-spec.json` → `build-deck.sh`/`tim deck` (a real downstream query, so JSON is justified, not anti-pattern A2). The deck grouping is derived, not stored.
**Pattern reference:** docs/best-practices/skills/patterns.md §1

## 3. Dispatcher

**Choice:** true
**Pattern reference:** patterns.md §2

## 4. Pre-baked context

**Choice:** true
**Pattern reference:** patterns.md §3

## 5. Worker fan-out

**Choice:** true
**Workers:** TICKET_ANALYST — one per completed ticket; researches its pre-baked context and writes a category + audience headline + user benefit + evidence. Tight per-unit deliverable from local context (pattern 5), not judgment-heavy cross-cutting work (so not anti-pattern A5). Synthesis into the themed deck stays in the parent.
**Pattern reference:** patterns.md §5

## 6. Walker

**Choice:** false
**Pattern reference:** patterns.md §7

## 7. Helpers introduced

- start-sprint-showcase — resolve the date window, seed Done-in-window tickets + commits
- prepare-sprint-showcase — pre-bake per-ticket context bundles
- ticket-set-analysis — sole mutator of the analyst-owned fields (pattern 6; avoids A3 sprawl)
- tickets-list — read-only query + coverage gate (`--status unanalyzed`, `--by-category`)
- deck-set-narrative — sole mutator of the `narrative` object (distinct field set from analyst fields, so not A3)
- render-sprint-showcase — derive `deck.md` (preview) + `deck-spec.json` from state, grouped by category
- build-deck — bridge `deck-spec.json` → `.pptx` via `tim deck generate` (pptxgenjs, no auth)

Plus a Node command in the `tim` CLI: `tim deck generate <spec> --out <file>` (`tim/src/commands/deck/`).

## 8. Triggers

- "sprint showcase"
- "sprint showcase EUDPA"
- "create sprint slideshow"
- "build sprint showcase"
- "sprint showcase deck"
- "showcase this sprint"
- "what did we ship this sprint deck"

**Disambiguation:** Distinct from Claude Code's built-in /init (which scaffolds CLAUDE.md, not workspace skills). Distinct from the what-have-i-achieved skill (Sam's personal day/week achievement summary, prose, no deck) and career-evidence (whole-contract CV dossier across many months). sprint-showcase covers ONE sprint, completed work only, and produces a non-technical business-benefit Google Slides deck aimed at stakeholders.
