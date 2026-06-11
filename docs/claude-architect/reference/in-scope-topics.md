# In-scope topics for Claude architecture work

This file enumerates the topics treated as authoritative subject matter for
Claude architecture decisions, grouped by the domain they belong to. Consult
it when scoping a new skill, MCP server, CLAUDE.md, prompt, or workflow to
confirm the territory is in-scope before pulling in patterns from adjacent
areas. If a topic is not listed here, treat it as out of remit and link to
the dedicated out-of-scope reference instead.

The sub-clauses below describe what the in-scope label actually covers, so an
agent can route to the right topic file in `docs/claude-architect/domain-*/`.

---

## 1. Domain 1 — Agentic orchestration

| Topic | What is in scope |
|-------|------------------|
| Agentic loop implementation | Tool result handling, loop termination conditions, and the criteria the harness uses to decide whether to continue, hand off, or stop. |
| Multi-agent orchestration | Coordinator-subagent patterns, task decomposition, parallel subagent execution, iterative refinement loops. |
| Subagent context management | Explicit context passing, structured state persistence, crash recovery using manifests. |

Agentic loop work hinges on deciding whether to feed tool results back,
terminate, or escalate based on the harness's signals. Multi-agent designs are
framed as coordinator-plus-subagents, never as peer-to-peer meshes. Subagent
state is expected to be explicit and recoverable — manifests, not in-memory
handoffs.

---

## 2. Domain 2 — Tools and MCP

| Topic | What is in scope |
|-------|------------------|
| Tool interface design | Writing effective tool descriptions, splitting vs consolidating tools, tool naming to reduce ambiguity. |
| MCP tool and resource design | Resources for content catalogs, tools for actions, description quality for adoption. |
| MCP server configuration | Project vs user scope, environment variable expansion, multi-server simultaneous access. |
| Error handling and propagation | Structured error responses, transient vs business vs permission errors, local recovery before escalation. |
| Escalation decision-making | Explicit criteria, honouring customer preferences, policy gap identification. |

Tool design is treated as a writing problem first (descriptions, names) and a
schema problem second. MCP cleanly separates resources (catalog-shaped content)
from tools (actions). Errors are classified by type before any retry or
escalation policy is chosen.

---

## 3. Domain 3 — Claude Code

| Topic | What is in scope |
|-------|------------------|
| CLAUDE.md configuration | Hierarchy (user/project/directory), `@import` patterns, `.claude/rules/` with glob patterns. |
| Custom commands and skills | Project vs user scope, `context: fork`, `allowed-tools`, `argument-hint` frontmatter. |
| Plan mode vs direct execution | Complexity assessment, architectural decisions, single-file changes. |

CLAUDE.md is a hierarchy with import semantics, not a single flat file. Skills
and commands are governed by frontmatter — particularly `context: fork`,
`allowed-tools`, and `argument-hint`. Plan mode is selected by complexity, not
defaulted to.

---

## 4. Domain 4 — Prompt engineering

| Topic                              | What is in scope |
| ---------------------------------- | ---------------- |
| Iterative refinement               | Input/output examples, test-driven iteration, interview pattern, sequential vs parallel issue resolution. |
| Structured output via tool schemas | Designing a tool whose call shape carries the structured result, choosing when to force that tool, nullable fields to prevent hallucination. |
| Few-shot prompting                 | Ambiguous scenario targeting, format consistency, false positive reduction. |

Structured output is expressed by having Claude call a tool whose input schema
is the result shape — nullable fields are the documented
hallucination-prevention mechanism. Few-shot examples are aimed at ambiguity,
not at general capability.

---

## 5. Domain 5 — Context and reliability

| Topic                       | What is in scope |
| --------------------------- | ---------------- |
| Context window optimisation | Trimming verbose tool outputs, structured fact extraction, position-aware input ordering. |
| Human review workflows      | Confidence calibration, stratified sampling, accuracy segmentation by document type and field. |
| Information provenance      | Claim-source mappings, temporal data handling, conflict annotation, coverage gap reporting. |

Context optimisation is concrete: trim outputs, extract facts, order inputs
deliberately. Human review is framed in calibration and sampling terms.
Provenance is a first-class deliverable — claims must be mapped to sources,
with conflicts and gaps surfaced rather than hidden.

---

## Using this list

- If a question lands on a topic in this file, route the agent to the
  matching `docs/claude-architect/domain-N-*` task statement.
- If a question lands on a topic that is **not** in this file, check
  [[reference/out-of-scope-topics]] before answering — it may be excluded
  deliberately.
- The five domain headings above mirror the directory layout under
  `docs/claude-architect/`; keep them in sync if the topics are revised.

## Related

- [[reference/out-of-scope-topics]]
- [[reference/technology-coverage]]
- [[domain-1-agentic-orchestration/index]]
- [[domain-2-tools-mcp/index]]
- [[domain-3-claude-code/index]]
