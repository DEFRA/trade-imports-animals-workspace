# Checklist — Designing an MCP Tool Interface, Errors, and Distribution

Run this checklist when you are about to ship a new MCP tool (or substantially
rework an existing one) and want a single pass over the cross-cutting concerns:
the routing surface the LLM sees, the error contract the calling agent has to
recover from, the distribution decisions that govern which agents get it, the
server-integration hygiene around credentials and discovery, and the overlap
with Claude Code's built-in tools. Each item below should be answerable with a
clear YES before the tool is considered done; if any answer is "not sure",
follow the wikilink back to the leaf and resolve it there.

## Checklist

1. Does the tool's description state purpose, input format, example
   invocations, edge cases, and an explicit "use this when X; use `<sibling>`
   when Y" boundary — i.e. enough signal for the model to route to it without
   inference? — see
   [[../domain-2-tools-mcp/2.1-tool-interface-design]].
2. Have you checked for sibling tools (in this server, peer servers, and
   built-ins) whose names or descriptions overlap, and either renamed or
   rewritten so each side is the *only* plausible match for its inputs? — see
   [[../domain-2-tools-mcp/2.1-tool-interface-design]].
3. If the tool currently covers more than one verb (extract vs summarise vs
   verify), have you split it into purpose-specific tools with fixed
   input/output contracts rather than one generic `analyze_*`? — see
   [[../domain-2-tools-mcp/2.1-tool-interface-design]].
4. Have you audited the calling agent's system prompt for imperatives whose
   verbs or nouns collide with this tool's keywords and would override the
   description at selection time? — see
   [[../domain-2-tools-mcp/2.1-tool-interface-design]].
5. Does every error response set `isError: true`, classify the failure
   (transient, validation, business, permission), and set `isRetryable`
   honestly so the caller picks the right recovery path? — see
   [[../domain-2-tools-mcp/2.2-structured-error-responses]].
6. Are error messages customer-friendly prose (no stack traces, no raw
   provider payloads) while still naming the field or precondition that
   failed, and does the tool distinguish a genuine access failure from a
   successful call that returned zero results? — see
   [[../domain-2-tools-mcp/2.2-structured-error-responses]].
7. Where the failure is recoverable inside the tool (retry, fallback, reduce
   scope), does the tool attempt subagent-local recovery before surfacing the
   error to the parent agent? — see
   [[../domain-2-tools-mcp/2.2-structured-error-responses]].
8. Have you scoped which agents/subagents get this tool, and where a generic
   built-in (e.g. `Bash`) would do the job, have you replaced it with a
   constrained alternative that exposes only the operations this role needs?
   — see [[../domain-2-tools-mcp/2.3-tool-distribution]].
9. For high-frequency cross-role needs, have you provided a *scoped* shared
   tool rather than handing every subagent the unconstrained version, and have
   you decided whether `tool_choice` should be `auto`, `any`, or forced for
   the callers that use it? — see
   [[../domain-2-tools-mcp/2.3-tool-distribution]].
10. Have you chosen the right scope for the MCP server registration — project
    scope for repo-bound credentials and team-shared servers, user scope for
    personal tooling — and expanded secrets via env-var interpolation rather
    than hard-coding them into config? — see
    [[../domain-2-tools-mcp/2.4-mcp-server-integration]].
11. Does the server expose stable content catalogues as MCP resources (not
    tools) where appropriate, and is the tool description written to win
    against Claude Code's built-ins when both could plausibly match the
    request? — see [[../domain-2-tools-mcp/2.4-mcp-server-integration]].
12. Before building a custom server, did you check for a community MCP server
    that already covers this surface, and if you chose custom, can you state
    the specific gap that justified the build? — see
    [[../domain-2-tools-mcp/2.4-mcp-server-integration]].
13. Does this tool genuinely earn its place against the built-ins — i.e. it
    is *not* a thin wrapper around `Read`, `Grep`, `Glob`, `Edit`, `Write`, or
    `Bash` that the agent could invoke directly with equal reliability? — see
    [[../domain-2-tools-mcp/2.5-built-in-tools]].

## Common failure modes

- **Routing collapses under keyword pressure.** A clean description gets
  overridden by an imperative in the system prompt that shares a verb with
  the tool name, and the model picks the wrong sibling on every other call.
  Skipping items 1, 2, and 4 is how this lands in production. See
  [[../domain-2-tools-mcp/2.1-tool-interface-design]].
- **Callers cannot tell retryable from terminal.** The tool returns a plain
  string error or a 500-shaped payload, so the parent agent either retries a
  validation failure forever or gives up on a transient network blip. Items
  5 and 6 prevent this. See
  [[../domain-2-tools-mcp/2.2-structured-error-responses]].
- **Empty-result poisoning.** A successful call returning zero rows is
  reported as an error (or vice versa), and the agent abandons a viable
  search path. Caught by item 6. See
  [[../domain-2-tools-mcp/2.2-structured-error-responses]].
- **Privilege creep across subagents.** Every subagent inherits the full
  tool set "for convenience", and a narrow role gets a destructive primitive
  it never needed. Items 8 and 9 are the guard. See
  [[../domain-2-tools-mcp/2.3-tool-distribution]].
- **Credentials baked into config.** The MCP server config is committed with
  a literal token instead of `${ENV_VAR}` expansion, or the server is
  registered at user scope when the team needs it project-scoped. Item 10
  catches both. See
  [[../domain-2-tools-mcp/2.4-mcp-server-integration]].
- **Reinventing a built-in.** A bespoke `read_file` or `search_repo` tool
  duplicates `Read`/`Grep` with a worse contract, and the model now has to
  choose between two equivalent tools on every invocation. Item 13 is the
  stop sign. See [[../domain-2-tools-mcp/2.5-built-in-tools]].
