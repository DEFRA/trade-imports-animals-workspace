# Claude Architecture — Agent Routing Index

When you're authoring or reviewing a skill, MCP tool, CLAUDE.md, slash command,
or prompt anywhere under this workspace, consult the files below. Each leaf is
a focused rules reference — load only what matches the work in hand. The
workspace surfaces are Claude Code and MCP; content covering the Claude API or
Agent SDK directly lives under `api-reference/` and is not part of the default
load path, so consult it only if scope expands.

## When to load what

### Agentic architecture & orchestration

- `domain-1-agentic-orchestration/1.2-multi-agent-orchestration.md` — Read when standing up a coordinator that fans work out to subagents.
- `domain-1-agentic-orchestration/1.3-subagent-context-passing.md` — Read when spawning subagents via the Task tool and deciding what context to pass.
- `domain-1-agentic-orchestration/1.4-workflow-enforcement.md` — Read when a multi-step workflow needs gating, ordering, or mid-process handoffs.
- `domain-1-agentic-orchestration/1.5-hooks.md` — Read when you need a Claude Code hook (PreToolUse / PostToolUse in `settings.json`) to enforce a guardrail that prompt-engineering can't.
- `domain-1-agentic-orchestration/1.6-task-decomposition.md` — Read when choosing between fixed prompt chains and dynamic decomposition for a complex task.
- `domain-1-agentic-orchestration/1.7-session-state.md` — Read when designing session resumption, forking, or naming for long-running work.

### Tool design & MCP integration

MCP is exploratory in this workspace, not in production yet — treat the
guidance here as forward-looking.

- `domain-2-tools-mcp/2.1-tool-interface-design.md` — Read when naming a tool, writing its description, or splitting an overloaded one.
- `domain-2-tools-mcp/2.2-structured-error-responses.md` — Read when designing how an MCP tool reports failure to its caller.
- `domain-2-tools-mcp/2.3-tool-distribution.md` — Read when deciding which tools a given subagent should have and whether to force `tool_choice`.
- `domain-2-tools-mcp/2.4-mcp-server-integration.md` — Read when wiring an MCP server into Claude Code (scope, credentials, descriptions, resources).
- `domain-2-tools-mcp/2.5-built-in-tools.md` — Read when choosing between Read/Write/Edit/Bash/Grep/Glob for an exploration or edit task.

### Claude Code configuration & workflows

- `domain-3-claude-code/3.1-claude-md-hierarchy.md` — Read when editing or splitting a CLAUDE.md across user/project/directory tiers.
- `domain-3-claude-code/3.2-slash-commands-and-skills.md` — Read when authoring a `.claude/commands/` or `.claude/skills/<name>/SKILL.md` entry.
- `domain-3-claude-code/3.3-path-specific-rules.md` — Read when scoping conventions to a glob via `.claude/rules/` instead of a CLAUDE.md.
- `domain-3-claude-code/3.4-plan-mode-vs-direct.md` — Read when deciding between plan mode, direct execution, or an Explore subagent.
- `domain-3-claude-code/3.5-iterative-refinement.md` — Read when closing the spec-to-implementation gap via examples or test-driven iteration.
- `domain-3-claude-code/3.6-cicd-integration.md` — Read when running Claude Code non-interactively in CI/CD.

### Prompt engineering & structured output

- `domain-4-prompt-engineering/4.1-explicit-criteria.md` — Read when a prompt's accuracy criteria are vague or hedged.
- `domain-4-prompt-engineering/4.2-few-shot-prompting.md` — Read when instructions alone produce inconsistent format or ambiguous classification.
- `domain-4-prompt-engineering/4.3-structured-output.md` — Read when an MCP tool, subagent, or slash command needs a JSON-shaped result driven by a tool input schema.
- `domain-4-prompt-engineering/4.4-validation-retry-loops.md` — Read when an extraction pipeline needs schema/semantic retry with feedback.
- `domain-4-prompt-engineering/4.6-multi-pass-review.md` — Read when designing review pipelines with multiple instances or passes.

### Context management & reliability

- `domain-5-context-reliability/5.1-conversation-context.md` — Read when long conversations risk losing transactional facts or tool output.
- `domain-5-context-reliability/5.2-escalation-and-ambiguity.md` — Read when deciding whether an agent should escalate to a human or disambiguate.
- `domain-5-context-reliability/5.3-error-propagation.md` — Read when a subagent must report failure upstream without aborting the workflow.
- `domain-5-context-reliability/5.4-large-codebase-exploration.md` — Read when extended exploration is degrading context (scratchpads, /compact, recovery manifests).
- `domain-5-context-reliability/5.5-human-review-workflows.md` — Read when routing human review attention via accuracy and confidence calibration.
- `domain-5-context-reliability/5.6-information-provenance.md` — Read when synthesising claims from multiple subagents and you need traceable attribution.

### Reference & appendices

- `reference/technologies-and-concepts.md` — Read for a map of the technology families (Agent SDK, MCP, Batches, etc.) referenced across domains.
- `reference/in-scope-topics.md` — Read to confirm a task falls inside the Claude Code + MCP topics this index covers before routing it.
- `reference/out-of-scope-topics.md` — Read to confirm a topic is excluded from the Claude Code + MCP scope (training internals, vision, transport, cloud config, and anything API-/SDK-only).
- `reference/scenarios.md` — Read to map a production scenario (support agent, CI, extraction, etc.) onto the relevant domains.
- `reference/preparation-exercises.md` — Read when picking a hands-on exercise to build practical experience across domains.

## Checklists

Cross-domain checklists live under `checklists/` — consult them when validating
a finished skill, MCP tool, CLAUDE.md, or prompt against the rules in the
domain leaves above.
