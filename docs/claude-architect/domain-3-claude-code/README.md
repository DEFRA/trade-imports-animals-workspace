# Domain 3: Claude Code Configuration & Workflows

This domain covers the configuration surface and day-to-day workflows of
Claude Code itself — how `CLAUDE.md` hierarchies, slash commands, skills
and path-scoped rules combine to shape an agent's behaviour, and how to
operate it interactively (plan mode, iterative refinement) and
non-interactively (CI/CD). Consult this domain when designing the
configuration layout of a Claude Code project, packaging reusable
behaviours as skills or commands, deciding which mode to run a task in,
or wiring Claude Code into a build or review pipeline.

The leaves are ordered roughly from "static configuration" to "runtime
operation": files 3.1-3.3 cover what the agent reads at startup, 3.4-3.5
cover how a human drives the agent during a task, and 3.6 covers running
the same agent under a CI worker with no human in the loop.

## Files

| File | Topic | Rule count | When to load |
|---|---|---|---|
| [[3.1-claude-md-hierarchy]] | CLAUDE.md hierarchy and @import patterns | 6 | Laying out user/project/directory `CLAUDE.md` tiers, splitting rules into `.claude/rules/` topic files, or diagnosing why a rule is not taking effect using `/memory`. |
| [[3.2-slash-commands-and-skills]] | Custom slash commands and skills | 7 | Choosing between a slash command, a skill, or a `CLAUDE.md` rule for a new reusable behaviour, and authoring its frontmatter (`context: fork`, `allowed-tools`, `argument-hint`). |
| [[3.3-path-specific-rules]] | Path-specific rules with `.claude/rules` | 5 | Scoping conventions to a glob (for example `**/*.test.ts`) instead of polluting the root `CLAUDE.md`, or deciding between a subdirectory `CLAUDE.md` and a path-scoped rule file. |
| [[3.4-plan-mode-vs-direct]] | Plan mode vs direct execution | 5 | Picking the right mode for a task — plan mode for design-heavy or destructive work, direct execution for mechanical edits, and when to route discovery through the Explore subagent. |
| [[3.5-iterative-refinement]] | Iterative refinement and progressive elaboration | 5 | Closing the spec-to-implementation gap on ambiguous tasks: worked examples, test-driven iteration, the interview pattern, and batching versus sequencing feedback. |
| [[3.6-cicd-integration]] | Claude Code in CI/CD pipelines | 6 | Running Claude Code non-interactively (`-p`, JSON output), sourcing context in CI, isolating review from generation, deduplicating findings across re-runs, and feeding the test suite into generation. |

## Related domains

- [[../domain-1-agentic-orchestration/1.4-workflow-enforcement]] — slash
  commands and skills are the primary surface for enforcing workflow
  steps inside Claude Code; the rules here pair with 3.2.
- [[../domain-1-agentic-orchestration/1.5-hooks]] — hooks in
  `settings.json` complement `CLAUDE.md` rules and are the only way to
  enforce automated behaviours such as "after every Edit, run the
  formatter".
- [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]] —
  fan-out subagents are typically invoked from skill `references/`
  worker prose introduced in 3.2.
- [[../domain-1-agentic-orchestration/1.7-session-state]] — workareas
  and on-disk state referenced by skills tie into the session-state
  patterns in domain 1.
- [[../domain-2-tools-mcp/2.3-tool-distribution]] — `allowed-tools` in
  slash-command and skill frontmatter draws from the tool-distribution
  vocabulary.
- [[../domain-2-tools-mcp/2.5-built-in-tools]] — skills and commands
  routinely whitelist or forbid the built-in tools (Bash, Edit, Write,
  WebFetch) covered there.
- [[../domain-4-prompt-engineering/4.3-structured-output]] — pairs with
  3.6 when running Claude Code in CI and parsing its JSON output
  against a schema.
- [[../domain-4-prompt-engineering/4.1-explicit-criteria]] — the same
  explicit-criteria discipline applies to `CLAUDE.md` rules and skill
  prose; vague rules fail the same way vague prompts do.
- [[../domain-4-prompt-engineering/4.6-multi-pass-review]] — the
  review/generation isolation rule in 3.6 is one application of the
  multi-pass review pattern.
- [[../domain-5-context-reliability/5.4-large-codebase-exploration]] —
  the Explore-subagent guidance referenced from 3.4 (plan mode) lives
  in domain 5.
- [[../domain-5-context-reliability/5.2-escalation-and-ambiguity]] —
  underpins the interview pattern in 3.5 for unfamiliar domains.
- [[../domain-5-context-reliability/5.6-information-provenance]] —
  relevant when CLAUDE.md hierarchies pull from multiple sources and
  you need to trace which tier supplied which rule.
