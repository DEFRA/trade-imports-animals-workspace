# Technologies and Concepts — Reference

This file catalogues the technologies and concepts that span the Claude architecture surface for this workspace. Treat it as the index that a future agent consults when they encounter an unfamiliar term in a SKILL.md, a CLAUDE.md, or an MCP server's tool description and need to know which family it belongs to before reaching for a deeper reference.

The workspace operates through **Claude Code** as the primary harness, with **MCP servers** as the exploratory integration layer. Lower-level surfaces (Agent SDK, Claude API, Message Batches API) are out of scope here — see `api-reference/` for those.

---

## 1. Agentic loop concepts

The agent runtime layer — the loop, the hooks, and the subagent primitives that turn a model call into an agent, as exposed through Claude Code.

- Agent definitions and the agentic loop itself.
- Loop termination signals — how the harness decides a turn is done.
- Hooks — `settings.json` `PostToolUse` and other tool-call interception points.
- Subagent spawning via the `Task` tool.
- Tool allowlisting (`.claude/settings.json` permissions, `allowed-tools` in SKILL.md frontmatter) for scoping what an agent can invoke.

When a question or design decision touches loop termination, tool-call gating, or spawning a child agent, this is the family in scope.

---

## 2. Model Context Protocol (MCP)

The integration layer for extending Claude with external tools and content. Used exploratorily in this workspace — not yet in production.

- MCP servers, MCP tools, MCP resources.
- Surfacing tool failure to the caller in a way the model can act on.
- Tool descriptions and tool distribution as adoption levers.
- `.mcp.json` configuration.
- Environment variable expansion inside MCP config.

Use this family when reasoning about where a capability should live (server-side tool vs in-prompt instruction), how a tool is discovered, or how secrets flow into a server definition.

---

## 3. Claude Code

The developer-facing harness — its configuration, its modes, its session controls. This is the primary surface for the workspace.

- `CLAUDE.md` configuration hierarchy across user, project, and directory scopes.
- `.claude/rules/` with YAML frontmatter for path-scoping.
- `.claude/commands/` for slash commands.
- `.claude/skills/` with `SKILL.md` frontmatter — `allowed-tools`, `argument-hint`, and related fields.
- Plan mode and direct execution as alternative entry modes.
- `/memory` and `/compact` commands.
- `/resume` and session forking for session control.
- The Explore subagent.

Reach for this family when the artefact under discussion lives on disk in a Claude Code repo, or when the user is asking about behaviour that varies by scope (user vs project vs directory).

---

## 4. Claude Code CLI

The non-interactive surface of Claude Code — the shape that CI and shell automation hit.

- `-p` / `--print` flag for non-interactive mode.
- `--output-format json` for machine-readable output.
- `--json-schema` for structured CI output.

If the design calls for piping Claude into a build step or a shell script, the rules belong to this family rather than to the interactive Claude Code surface above.

---

## 5. Schema and validation

The data-shape primitives that constrain model output and tool inputs.

- **JSON Schema** — required vs optional fields, enum types, nullable fields, the `"other"` + detail-string pattern, and strict mode for eliminating syntax errors. Used in MCP tool input schemas and `--json-schema` CLI output contracts.
- Validation-retry patterns — re-prompting with the specific schema or semantic error so the model can self-correct.

When the surface area is "the model is producing structured data and we need it to be right", this family covers both the declarative shape and the runtime enforcement loop.

---

## 6. Built-in tools

The default tool palette available without writing a custom tool or MCP server.

- `Read`, `Write`, `Edit`, `Bash`, `Grep`, `Glob`.

The architectural question with built-in tools is selection criteria — which one fits the job — and when a custom tool (or MCP tool) earns its keep over composing the built-ins.

---

## 7. Prompting techniques

Patterns for shaping model behaviour at the prompt layer.

- **Few-shot prompting** — targeted examples for ambiguous scenarios, format demonstration, and generalisation to novel patterns.
- **Prompt chaining** — sequential task decomposition into focused passes (skills calling skills, or slash commands chained in a workflow).

---

## 8. Context and session management

The mechanics of keeping a long-running agent coherent.

- **Context window management** — token budgets, progressive summarisation, lost-in-the-middle effects, context extraction, and scratchpad files (the `workareas/` pattern in this workspace).
- **Session management** — `/resume`, session forking, named sessions, and session context isolation between parent and subagent.

When the symptom is "the agent forgot" or "the agent is drowning in context", the rules in this family apply.

---

## 9. Confidence scoring

The measurement layer for extraction and classification quality.

- Field-level confidence values.
- Calibration against labelled validation sets.
- Stratified sampling for measuring error rates.

This is the family that lets a design move from "the model said X" to "the model said X with calibrated confidence Y, sampled this way".

---

## Related

- [[domain-2-tools-mcp/2.3-mcp-server-configuration]]
- [[domain-3-claude-code/3.1-claude-md-configuration]]
- [[domain-4-prompt-engineering/4.3-structured-output-via-tool-use]]
- [[domain-5-context-reliability/5.1-context-window-management]]
