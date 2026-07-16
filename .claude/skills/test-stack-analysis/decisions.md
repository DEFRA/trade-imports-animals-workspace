# test-stack-analysis skill — decisions

Recorded during CREATE interview. Update if a shape choice
changes; do not delete entries.

## 1. Purpose

Given a feature description or ticket/Confluence URL, find every related test file across the workspace repos, classify each by pyramid level and concern type, and report gaps and duplication — each gap tagged Blocking or Advisory by plausible production consequence, not just pyramid completeness — so a developer knows where to add or remove coverage before writing new tests, and what's actually urgent versus a nit.

## 2. State shape

**Choice:** prose
**Pattern reference:** docs/best-practices/skills/patterns.md §1

## 3. Dispatcher

**Choice:** true
**Pattern reference:** patterns.md §2

## 4. Pre-baked context

**Choice:** true
**Pattern reference:** patterns.md §3

## 5. Worker fan-out

**Choice:** true
**Workers:** REPO_TEST_DISCOVERER
**Pattern reference:** patterns.md §5

## 6. Walker

**Choice:** false
**Pattern reference:** patterns.md §7

## 7. Helpers introduced

- start-test-stack-analysis
- prepare-test-stack-analysis

## 8. Triggers

- "test-stack-analysis EUDPA-X"
- "find test gaps EUDPA-X"
- "test pyramid analysis EUDPA-X"
- "analyse test coverage EUDPA-X"
- "check test pyramid for <feature>"

**Disambiguation:** Distinct from review/code-style (those judge correctness/style of existing code, not where tests belong in the pyramid) and from understanding-check (judges author understanding, not test coverage). Report-only, no code changes — unlike review/code-style implement mode. Distinct from /init (CLAUDE.md scaffolding).
