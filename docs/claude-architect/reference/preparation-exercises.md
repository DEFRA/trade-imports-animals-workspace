# Preparation Exercises

This file catalogues four hands-on exercises for building practical familiarity with production-grade Claude systems. Consult it when you want to ground a design decision in something you have actually built end-to-end, or when scoping a learning spike before committing to an architectural pattern. Each exercise reinforces specific topical domains and exposes the failure modes that purely-theoretical study tends to miss.

The exercises are designed to be done in order — earlier ones establish primitives (tool descriptions, agentic loops, structured errors) that later ones compose into multi-agent topologies — but each stands on its own.

---

## 1. Build a multi-tool agent with escalation logic

Reinforces: agentic architecture & orchestration, tool design & MCP integration, context management & reliability.

The objective is to practise designing an agentic loop with tool integration, structured error handling, and escalation patterns. The exercise forces you to confront tool-selection ambiguity and to handle every category of failure the agent can encounter.

Steps:

1. Define 3-4 MCP tools with detailed descriptions that clearly differentiate each tool's purpose, expected inputs, and boundary conditions. Include at least two tools with similar functionality that require careful description to avoid selection confusion.
2. Drive Claude Code through an end-to-end task that requires multiple tool invocations interleaved with reasoning. Observe how the agent decides when it has gathered enough information to stop calling tools and produce a final answer, and identify prompts or tool descriptions that cause it to loop or stop prematurely.
3. Add structured error responses to your tools: include an error category (transient / validation / permission), a retryable boolean, and human-readable descriptions. Test that the agent handles each error type appropriately — retrying transient errors, explaining business errors to the user.
4. Implement a `PreToolUse` hook in `settings.json` that intercepts tool calls to enforce a business rule (for example, blocking operations above a threshold amount), redirecting to an escalation workflow when triggered.
5. Test with multi-concern messages (requests involving multiple issues) and verify the agent decomposes the request, handles each concern, and synthesises a unified response.

The pair of near-duplicate tools at step 1 is the part most people skip. Without it, you never feel the cost of vague tool descriptions; with it, you learn what level of differentiation the model actually needs.

---

## 2. Configure Claude Code for a team development workflow

Reinforces: Claude Code configuration & workflows, tool design & MCP integration.

The objective is to practise configuring `CLAUDE.md` hierarchies, custom slash commands, path-specific rules, and MCP server integration for a multi-developer project. This exercise teaches you what each scope of configuration is actually for, so you stop reaching for project-level config when a path-scoped rule would have been cleaner.

Steps:

1. Create a project-level `CLAUDE.md` with universal coding standards and testing conventions. Verify that instructions placed at the project level are consistently applied across all team members.
2. Create `.claude/rules/` files with YAML frontmatter glob patterns for different code areas — for example, `paths: ["src/api/**/*"]` for API conventions, `paths: ["**/*.test.*"]` for testing conventions. Test that rules load only when editing matching files.
3. Create a project-scoped skill in `.claude/skills/` with `allowed-tools` restrictions and a clear trigger phrase in its description. Verify the skill activates only on matching requests and that its tool allowlist constrains what it can do.
4. Configure an MCP server in `.mcp.json` with environment variable expansion for credentials. Add a personal experimental MCP server in `~/.claude.json` and verify both are available simultaneously.
5. Test plan mode versus direct execution on tasks of varying complexity: a single-file bug fix, a multi-file library migration, and a new feature with multiple valid implementation approaches. Observe when plan mode provides value.

The plan-mode comparison at step 5 is the one to take seriously. The answer is rarely "always" or "never" — you are calibrating your own intuition for when planning pays back its overhead.

---

## 3. Build a structured data extraction pipeline

Reinforces: prompt engineering & structured output, context management & reliability.

The objective is to practise designing JSON schemas, eliciting structured output via an MCP tool, and implementing validation-retry loops. This exercise pushes you past "happy path" extraction into the territory where real document pipelines live: missing fields, ambiguous formats, and human-in-the-loop routing.

Steps:

1. Define an extraction MCP tool with a JSON schema containing required and optional fields, an enum with an `"other"` + detail-string pattern, and nullable fields for information that may not exist in source documents. Process documents where some fields are absent and verify the model returns `null` rather than fabricating values.
2. Implement a validation-retry loop: when schema validation fails, send a follow-up turn including the document, the failed extraction, and the specific validation error. Track which errors are resolvable via retry (format mismatches) versus which are not (information absent from source).
3. Add few-shot examples demonstrating extraction from documents with varied formats (inline citations vs bibliographies, narrative descriptions vs structured tables) and verify improved handling of structural variety.
4. Implement a human review routing strategy: have the model output field-level confidence scores, route low-confidence extractions to human review, and analyse accuracy by document type and field to verify consistent performance.

Step 2's distinction between retryable and non-retryable validation errors is the lesson worth carrying forward. A retry loop that re-prompts on "information absent" wastes tokens and never converges.

---

## 4. Design and debug a multi-agent research pipeline

Reinforces: agentic architecture & orchestration, tool design & MCP integration, context management & reliability.

The objective is to practise orchestrating subagents, managing context passing, implementing error propagation, and handling synthesis with provenance tracking. This is the most demanding of the four exercises and the one that exposes the most assumptions about how context flows between agents.

Steps:

1. Build a coordinator skill that delegates to at least two subagents (for example, web search and document analysis) via the `Task` tool. Ensure the coordinator's `allowed-tools` includes `Task` and that each subagent receives its research findings directly in its spawn prompt rather than relying on automatic context inheritance.
2. Implement parallel subagent execution by having the coordinator emit multiple `Task` tool calls in a single response. Measure the latency improvement compared to sequential execution.
3. Design structured output for subagents that separates content from metadata: each finding should include a claim, evidence excerpt, source URL or document name, and publication date. Verify that the synthesis subagent preserves source attribution when combining findings.
4. Implement error propagation: simulate a subagent timeout and verify the coordinator receives structured error context (failure type, attempted query, partial results). Test that the coordinator can proceed with partial results and annotate the final output with coverage gaps.
5. Test with conflicting source data (two credible sources with different statistics) and verify the synthesis output preserves both values with source attribution rather than arbitrarily selecting one, and structures the report to distinguish well-established from contested findings.

Step 1's note about passing findings directly into the spawn prompt — not relying on automatic context inheritance — is the one to internalise. Coordinators that assume their context "just flows" to subagents produce silently impoverished results.

---

## Related

- [[domain-2-tools-mcp/2.1-tool-interface-design]]
- [[domain-3-claude-code/3.1-claude-md-hierarchy]]
- [[domain-3-claude-code/3.2-slash-commands-and-skills]]
- [[domain-4-prompt-engineering/4.3-structured-output]]
- [[domain-4-prompt-engineering/4.4-validation-retry-loops]]
- [[domain-5-context-reliability/5.3-error-propagation]]
- [[domain-5-context-reliability/5.6-information-provenance]]
