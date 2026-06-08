# API & SDK Reference (parked)

This folder holds reference material that is informational only. The workspace
team works inside Claude Code (and, where useful, behind MCP servers); it does
not write Python or Node code that calls the Claude Messages API or the
Anthropic Agent SDK directly. The two files below were authored for the
broader Claude architecture surface and have been parked here so they remain
reachable if scope ever expands. Consult them only if a future ticket pulls us
down to the API / SDK layer — they are not part of the default reading list
for agents authoring skills, MCP tools, or `CLAUDE.md` files.

## Files

| File | Topic | When it becomes relevant |
|------|-------|--------------------------|
| [`agentic-loops.md`](agentic-loops.md) | Constructing an agentic loop against the Claude Messages API or Agent SDK — `stop_reason` handling, `tool_use` / `tool_result` block plumbing, message-history management across turns. | A ticket asks us to build a bespoke agent runtime outside Claude Code (for example, a server-side worker that calls the Messages API directly). |
| [`batch-processing.md`](batch-processing.md) | Anthropic Message Batches API — submitting batches, polling status, retrieving results, cost trade-offs versus the synchronous endpoint. | A ticket asks us to process a large backlog of Claude calls offline (for example, bulk classification, retro analysis) where 24-hour turnaround is acceptable. |

## Why parked

- **Claude Code is the team's surface.** Day-to-day work happens through
  Claude Code skills, slash commands, and hooks — not bespoke SDK code, so
  the loop primitives and batch endpoint sit a layer below where we operate.
- **MCP is the only adjacent tool layer we have explored.** When we have
  needed Claude to reach external systems, we have wrapped them as MCP servers
  rather than embedding tool-use loops in application code. MCP material lives
  elsewhere in `docs/claude-architect/`; this folder is specifically about the
  raw API.
- **These files describe primitives the team does not write.** Nothing in the
  workspace currently imports `@anthropic-ai/sdk` or `anthropic` (Python),
  so the guidance here has no consumer until that changes.

## If you do start using the API

- **Graduate the file back into the main tree** once a repo genuinely depends
  on the Messages API or Agent SDK. Move it out of `api-reference/` and into
  whichever best-practices subtree owns the consuming repo, and update the
  workspace `CLAUDE.md` index so agents pick it up by default.
- **Check the model version first.** These notes were written against the
  Claude model line current at authoring time; before relying on any specific
  field, parameter, or `stop_reason` value, verify it against the live
  Anthropic API docs — the surface evolves and parked content drifts.
- **Reconfirm cost and rate-limit assumptions.** The batch file in particular
  quotes pricing and turnaround characteristics; treat those as indicative
  only and re-derive them from current Anthropic documentation before
  budgeting work.
- **Prefer Claude Code or MCP first.** Before reaching for the raw API,
  satisfy yourself that the job cannot be done as a Claude Code skill or
  behind an MCP server — those layers are where the team's existing tooling,
  observability, and conventions live.
