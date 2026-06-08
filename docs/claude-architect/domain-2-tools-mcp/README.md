# Domain 2: Tool Design & MCP Integration

Tools are the surface through which a Claude agent acts on the world. This
domain covers how to design that surface — naming and describing tools so
the model routes correctly, returning errors the agent can recover from,
scoping tools to each subagent's role, integrating MCP servers, and choosing
between Claude Code's built-in tools. Consult these files when you are
authoring a new tool (custom or MCP), reshaping an existing tool set,
deciding which MCP servers to install, or debugging cases where Claude
picked the wrong tool or got stuck on a tool error.

## Files

| File | Topic | Rule count | When to load |
|---|---|---|---|
| [[2.1-tool-interface-design]] | Tool interfaces with clear descriptions and schemas | 5 | Authoring a new tool's name, description and input schema, or untangling two siblings the model keeps confusing |
| [[2.2-structured-error-responses]] | Structured error responses for MCP tools | 6 | Designing an MCP tool's error payload so the calling agent can retry, fall back, or surface a user-facing message |
| [[2.3-tool-distribution]] | Tool distribution across agents and least-privilege | 6 | Deciding which tools each subagent gets, swapping a generic tool for a constrained one, or choosing a `tool_choice` value |
| [[2.4-mcp-server-integration]] | MCP server integration in Claude Code and agent workflows | 6 | Wiring a new MCP server into a project, picking project- vs user-scope, or weighing community vs custom servers |
| [[2.5-built-in-tools]] | Built-in tools (Read, Write, Edit, Bash, Grep, Glob) | 5 | Writing prompts or skills that drive Claude Code's built-ins, especially when search, edit-vs-rewrite, or wrapper-tracing comes up |

## Related domains

- [[../domain-1-agentic-orchestration/1.3-subagent-design]] — subagent
  roles drive the tool distribution rules in [[2.3-tool-distribution]];
  read them together when designing a multi-agent system.
- [[../domain-1-agentic-orchestration/1.4-context-isolation]] — tool
  outputs are the main thing flowing across the context boundary, so the
  error-shape rules in [[2.2-structured-error-responses]] feed directly
  into what the parent agent sees.
- [[../domain-3-claude-code/3.2-skills-and-commands]] — skills bundle
  tool prose with prompts; [[2.1-tool-interface-design]] and
  [[2.5-built-in-tools]] are the natural companions when authoring a
  skill.
- [[../domain-3-claude-code/3.4-permissions-and-allowlists]] — the
  least-privilege guidance in [[2.3-tool-distribution]] and the MCP
  server selection in [[2.4-mcp-server-integration]] both land in
  `settings.json` allowlists.
- [[../domain-4-prompt-engineering/4.3-tool-use-prompts]] — system-prompt
  wording interacts with tool descriptions; cross-reference when a tool
  is being ignored or over-selected.
- [[../domain-5-context-reliability/5.2-error-recovery]] — the recovery
  paths an agent can take depend on the error categories defined in
  [[2.2-structured-error-responses]].
