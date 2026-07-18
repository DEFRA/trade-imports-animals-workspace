# Session 5: the `understanding-check` skill

**Objective:** Interview the author of an AI-assisted PR to check they understand the change before it merges.

Companion deck: `05-understanding-check.pptx`.

## What it's for

AI assistance lets you ship code faster than you can build a mental model of it. That's fine until someone asks how it works in a month, or a subtle bug lands in a part you never really read. The risk isn't the code — it's the gap between what you merged and what you understand.

understanding-check finds the parts of a diff most likely to be under-understood, asks you evidence-anchored questions about them, and scores your answers against a rubric. It's a coaching signal to close that gap — advisory, never a merge gate.

What you get:

- **Surfaces the gap** — targets the riskiest-to-understand parts of your own diff
- **Evidence-anchored** — every question tied to specific lines; every score quotes the rubric
- **Coaching, not gating** — an advisory verdict — a human still owns the merge

## How you trigger it

You launch it in natural language: "interview EUDPA-1234" · "check understanding EUDPA-1234"

## Watch it run

1. **Analyse** — point it at a ticket; it pulls the PRs and analyses each repo's diff against the ticket to find the areas most worth probing.
2. **Question set** — it drafts 8-12 questions, each anchored to specific file lines, and shows them for you to approve or edit — the plan gate.
3. **Interview** — a terminal Q&A: one question at a time, showing where in the code it is about but never the answer.
4. **Score** — it grades each answer pass / partial / fail, quoting the exact rubric clause that decided it.
5. **Verdict & comment** — it rolls the scores into pass / needs-review / high-risk and writes a report with a paste-ready PR comment.

## Reading the output

A question set, a transcript, per-question scores, a verdict, and a report.

- `verdict` — pass / needs-review / high-risk — read this line first
- `per-question table` — which areas were weak, with the rubric clause that fired
- `paste-ready PR comment` — the last section of the report — drop it straight onto the PR

## How you use it

- **Reach for it when** — you're about to merge an AI-assisted PR and want a gut-check on your grasp
- **Where you decide** — you approve the questions, answer honestly, and decide what to do with the verdict
- **How it fits** — a self-check before or alongside review — for understanding, not correctness

## Live view

Don't memorise the surface — read the current version:

- `interview / check understanding EUDPA-X` — how you launch it
- `.claude/skills/understanding-check/SKILL.md` — workflow, verdict rules, scripts
- `the plan gate` — you approve the questions before the interview starts

## Try it

Take a PR you wrote recently with AI help and run "interview EUDPA-XXXX". Approve the question set, answer honestly without peeking at the diff, and see whether the verdict matches how well you thought you understood the change.

Next: [Session 6 — the `npm-upgrade` skill](06-npm-upgrade.md).
