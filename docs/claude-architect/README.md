# Claude Architecture Best Practices

This folder collects focused, actionable rules for agents authoring
skills, MCP tools, slash commands, `CLAUDE.md` files, and prompts in
this workspace. Each rule is paired with a rationale so a future agent
can decide whether the rule applies to its situation, rather than
copying guidance blindly.

The material is organised into five topical domains plus a small
reference section. Inside each domain, individual topics are written up
as standalone leaf files so they can be cited from a skill or rule
without dragging in the whole domain.

## Scope: which Claude surfaces this folder covers

The workspace currently uses two Claude surfaces:

- **Claude Code** — the CLI / harness driving everything under
  `.claude/skills/`, `.claude/commands/`, `CLAUDE.md` files, hooks, and
  workspace tools.
- **MCP servers** — exploratory; used to expose project-specific tools
  to Claude Code. Treated as in-scope for tool-design guidance.

The team does **not** currently use the Claude API or the Agent SDK
directly. Guidance that only applies to direct API callers (bare
agentic loops, the Message Batches API, etc.) has been moved to
[`api-reference/`](api-reference/README.md) and is **informational
only — not in the default load path**. Pull from there only if a
specific task genuinely needs the underlying primitive.

## How to use this folder

1. **Start at [CLAUDE.md](CLAUDE.md).** That file is the routing index
   for this tree — it lists every leaf with a one-line summary so an
   agent can pick the right file without reading prose. Point future
   agents (and `@import` directives) at it rather than at this README.
2. **Each domain has its own `README.md`.** The domain README gives the
   shape of the domain, lists its leaves with "when to load" hints, and
   cross-links to the leaves in other domains that share concerns.
3. **Leaves are individual rule-with-rationale files.** Each leaf
   covers one topic and contains a small number of named rules. Cite
   leaves directly from skills (for example,
   `docs/claude-architect/domain-2-tools-mcp/2.1-tool-interface-design.md`)
   rather than re-stating the rules.
4. **Checklists in [`checklists/`](checklists/) cross-cut the
   domains** for common review tasks (authoring a new skill, reviewing
   an MCP tool spec, auditing a `CLAUDE.md`). Use them as a finishing
   pass once the domain guidance has been applied.

## Domain map

| Domain | Folder |
|---|---|
| 1. Agentic Architecture & Orchestration | [domain-1-agentic-orchestration/](domain-1-agentic-orchestration/README.md) |
| 2. Tool Design & MCP Integration | [domain-2-tools-mcp/](domain-2-tools-mcp/README.md) |
| 3. Claude Code Configuration & Workflows | [domain-3-claude-code/](domain-3-claude-code/README.md) |
| 4. Prompt Engineering & Structured Output | [domain-4-prompt-engineering/](domain-4-prompt-engineering/README.md) |
| 5. Context Management & Reliability | [domain-5-context-reliability/](domain-5-context-reliability/README.md) |

The [`reference/`](reference/) folder holds appendix material:
in-scope and out-of-scope topics, the technology and concept index,
canonical production scenarios, and preparation exercises.

The [`api-reference/`](api-reference/) folder holds parked material on
primitives the workspace does not currently use directly (raw agentic
loops, Message Batches API). Informational — not loaded by default.

## When this material applies

The audience is agents working **inside the Claude Code harness** —
authoring or reviewing skills, MCP tools, slash commands, `CLAUDE.md`
files, and prompts. It is **not** aimed at anyone calling the Claude
API directly or building an Agent SDK application.

Consult this folder when you are:

- Authoring a new workspace skill under `.claude/skills/<name>/SKILL.md`
  — particularly the trigger description, the coordinator/subagent
  split, and any per-file fan-out worker references.
- Writing or reviewing an MCP tool spec — tool description, schema,
  error shape, and distribution across agents.
- Drafting or restructuring a `CLAUDE.md` (project root, repo, or
  subdirectory) — hierarchy, `@import` patterns, and the
  `CLAUDE.md`-versus-skill choice.
- Designing a coordinator that fans work out to Task subagents —
  context passing, workflow enforcement, hooks, decomposition, and
  session state.
- Producing structured output from a Claude Code prompt — JSON-schema
  tool use, validation and retry loops, multi-pass review.
- Adding a prompt to a skill, command, or hook where the criteria need
  to survive long contexts, ambiguity, or escalation.
- Wiring Claude Code into CI/CD — non-interactive mode, structured
  output, context sourcing, and re-run deduplication.
- Reviewing any of the above in another agent's pull request.

If the work falls outside these situations (for example, training
internals, vision and computer-use, transport plumbing, cloud-specific
deployment config, or direct Claude API / Agent SDK development) check
[`reference/out-of-scope-topics.md`](reference/out-of-scope-topics.md)
before reaching for guidance here.
