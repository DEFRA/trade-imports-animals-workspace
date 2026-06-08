# Checklist — Authoring a new Agent Skill

Run this checklist when you are creating (or substantially revising) a
`.claude/skills/<name>/SKILL.md` — the contract that defines how a skill
loads, what tools it can reach, and how it hands work to subagents. Walk
the items in order; do not consider the skill ready until every answer
is YES, with a justified exception captured in the skill body where it
is not.

## Checklist

1. Is the skill genuinely on-demand rather than always-loaded standards
   that belong in `CLAUDE.md`? — see
   [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
2. Is the skill placed under `.claude/skills/<name>/` (team-shared,
   versioned) rather than `~/.claude/skills/<name>/` (personal),
   matching its intended audience? — see
   [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
3. Does the `SKILL.md` declare `context: fork` if (and only if) the
   skill produces verbose or exploratory output the parent session
   does not need to retain? — see
   [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
4. Does `allowed-tools` apply least-privilege — every tool the skill
   needs and none it does not, with destructive tools excluded unless
   the skill explicitly mutates? — see
   [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
5. If the skill spawns subagents to fan work out, does `allowed-tools`
   include `Task` on the coordinator and exclude it on the worker
   personas the skill invokes? — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
6. Does the skill set an `argument-hint` for every required parameter
   (ticket ID, repo, file path) so argument-less invocations fail
   loudly rather than silently running on empty input? — see
   [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
7. Does the skill body brief subagents by inlining the findings,
   artefacts, and file paths they need — never assuming the worker
   inherits the parent's context? — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
8. When the skill forwards prior outputs to a subagent (search hits,
   document excerpts, review findings), does it use a structured
   envelope that keeps source URL / file path / line number alongside
   the content? — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
9. If the skill needs to run subagents in parallel, does the
   coordinator emit all `Task` calls in a single response rather than
   chaining them across turns? — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
10. Are subagent prompts written as goal-and-criteria (what "done"
    looks like, what the artefact must contain) rather than
    step-by-step procedures? — see
    [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
11. Are worker personas defined as narrow, tool-restricted roles
    (researcher, fixer, verifier), each with the smallest tool surface
    that lets it complete its role? — see
    [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
12. Where the skill carries conventions that fire only when editing
    matching files, are those conventions extracted into
    `.claude/rules/` files with a `paths:` glob rather than embedded
    in the always-loaded skill body? — see
    [[../domain-3-claude-code/3.3-path-specific-rules]].
13. Do any extracted rule files use globs keyed to file *type*
    (`**/*.test.ts`) rather than directory, so they keep covering
    files as the codebase reorganises? — see
    [[../domain-3-claude-code/3.3-path-specific-rules]].

## Common failure modes

- **Skill body bloats `CLAUDE.md`-style standards into on-demand
  workflow.** Universal conventions get duplicated into the skill and
  drift from the always-loaded source. — see
  [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
- **Subagent prompt assumes inheritance.** The skill spawns a worker
  with "synthesise the findings" but never inlines them; the worker
  hallucinates because the evidence never crossed the Task boundary. —
  see
  [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
- **Parallel fan-out silently serialises.** The coordinator emits one
  `Task` call, waits, then emits the next; perceived speed-up
  evaporates. — see
  [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
- **Path conventions baked into the skill body instead of
  `.claude/rules/`.** Every invocation pays the context cost of rules
  that only matter for a subset of files; new file types silently
  escape coverage when nobody audits the skill. — see
  [[../domain-3-claude-code/3.3-path-specific-rules]].
- **`allowed-tools` omitted or set to a permissive default.** The
  skill drifts into destructive operations it was never designed for
  because the allowlist did not bound it. — see
  [[../domain-3-claude-code/3.2-slash-commands-and-skills]].
