# Session 8: the `skill-creator` skill

**Objective:** Scaffold a new workspace skill end to end (CREATE), or audit existing ones against the pattern checklist (AUDIT).

Companion deck: `08-skill-creator.pptx`.

## What it's for

The harness is only useful if it's easy to extend — but a correct skill has a lot of moving parts: SKILL.md frontmatter that doubles as the trigger spec, worker prose in references/, shared scripts in tools/, runtime state in workareas/, and allowlist entries in settings. Hand-rolling all that from memory is how skills drift apart.

skill-creator scaffolds a new skill end to end from a short interview, so every skill starts from the same shape — or audits the skills you already have against the team's pattern checklist and tells you where they've drifted. It's the meta-skill: it builds and maintains the others.

What you get:

- **Consistent by construction** — every new skill starts from the same correct shape
- **No boilerplate from memory** — frontmatter, workers, tool stubs and allowlist, generated
- **Health-checks the rest** — audit mode flags where existing skills have drifted

## How you trigger it

You launch it in natural language: "scaffold skill <name>" (CREATE) · "audit skill <name>" / "audit skills" (AUDIT)

## Watch it run

1. **Dispatch** — run the trigger; the Step 0 dispatcher prints MODE: CREATE or AUDIT and branches accordingly.
2. **Interview (CREATE)** — it walks an 8-question interview — name, triggers, fan-out vs single-shot, JSON state — one question at a time.
3. **Scaffold (CREATE)** — it writes SKILL.md, references/ workers, tools/<name>/ stubs and the allowlist entries, then lists the TODO markers for you to fill in.
4. **Audit (mode 2)** — "audit skill <name>" instead fans out a worker per skill against the 8-pattern checklist and writes a plan doc you act on.

## Reading the output

CREATE writes a scaffold; AUDIT writes plans.

- `.claude/skills/<name>/` — new SKILL.md (with TODOs), references/, assets/ + tools/<name>/ stubs
- `workareas/skills-audit/<name>.md` — an audit plan per skill — pattern gaps and open questions
- `structure, not logic` — the scaffold is the shape; you fill in the TODO markers afterwards

## How you use it

- **Reach for it when** — you're adding a new repeatable workflow, or spring-cleaning the harness
- **Where you decide** — you answer the interview and fill the scaffold's TODOs — it's structure, not logic
- **How it fits** — the meta-skill — it builds and maintains all the others

## Anatomy of a skill

If you'll maintain or grow the harness, it helps to know the parts:

- `SKILL.md` — the entry point — name + description (the trigger spec) frontmatter, plus the body that dispatches
- `references/` — worker prose spawned as subagents for fan-out — each self-contained
- `tools/` — deterministic shared shell helpers the skill shells out to
- `workareas/` — per-run, gitignored state held between steps

## Live view

Don't memorise the surface — read the current version:

- `scaffold skill X · audit skill X` — CREATE or AUDIT mode
- `.claude/skills/skill-creator/SKILL.md` — the when-to-use table and scripts
- `docs/agent-skills.md` — the conventions every skill follows

## Try it

Try a no-write demo: "audit skill review", then open workareas/skills-audit/review.md to read the pattern gaps. Or "scaffold skill release-notes" and walk the interview to see the placeholders.

That's the programme — back to the [index](README.md).
