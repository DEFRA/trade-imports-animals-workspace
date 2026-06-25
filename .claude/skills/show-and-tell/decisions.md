# show-and-tell skill — decisions

Recorded during CREATE interview. Update if a shape choice
changes; do not delete entries.

## 1. Purpose

Generate Show & Tell slide content from the last two weeks of completed Jira tickets, bucketed into User Journey / Skeleton, Integration / Architecture and Technical / Delivery enablers, for the EUDP Live Animals team fortnightly show and tell.

## 2. State shape

**Choice:** json
**Pattern reference:** docs/best-practices/skills/patterns.md §1

## 3. Dispatcher

**Choice:** true
**Pattern reference:** patterns.md §2

## 4. Pre-baked context

**Choice:** false
**Pattern reference:** patterns.md §3

## 5. Worker fan-out

**Choice:** false
**Workers:** 
**Pattern reference:** patterns.md §5

## 6. Walker

**Choice:** true
**Pattern reference:** patterns.md §7

## 7. Helpers introduced

- start-show-and-tell
- set-bucket
- tickets-list
- counts
- render-slides

## 8. Triggers

- "prepare show and tell"
- "show and tell slides"
- "generate show and tell"
- "show and tell prep"
- "show & tell slides"

**Disambiguation:** Distinct from Claude Code built-in /init (which scaffolds CLAUDE.md). This generates show-and-tell presentation content from completed Jira tickets — it is reporting/presentation prep, not ticket creation (ticket-creator), not planning/implementing a ticket (ticket), and not PR review (review/code-style).
