# Domain 1: Agentic Architecture & Orchestration

This domain covers the control-flow contract for autonomous agents: how
work is decomposed across coordinator and subagent processes, how state
crosses session boundaries, and where deterministic enforcement (hooks,
gates) replaces prompt-based guidance. Claude Code runs the agentic loop
internally — these notes cover the orchestration patterns layered on top
of that loop. Consult it when designing a new agentic system, adding a
subagent fan-out to an existing one, choosing between resumption and a
fresh session, or deciding whether a workflow rule belongs in a prompt
or a hook.

## Files

| File | Topic | Rule count | When to load |
|---|---|---|---|
| [[1.2-multi-agent-orchestration]] | Multi-agent systems with coordinator-subagent patterns | 7 | Designing a hub-and-spoke system, partitioning scope between a coordinator and its subagents, or deciding whether a task warrants decomposition at all. |
| [[1.3-subagent-context-passing]] | Subagent invocation, context passing, and isolation | 7 | Spawning subagents via the Task tool, writing the prompt that carries prior findings across the isolation boundary, or defining a narrow subagent with tool restrictions. |
| [[1.4-workflow-enforcement]] | Multi-step workflows with enforcement and gating | 5 | Choosing between a programmatic gate and prompt guidance for an ordering rule, wiring prerequisite checks to returned values, or designing a mid-process escalation handoff. |
| [[1.5-hooks]] | Claude Code hooks in settings.json (PreToolUse, PostToolUse, etc) for guardrails prompt-engineering can't enforce | 5 | Normalising heterogeneous tool output, enforcing a compliance rule that must hold deterministically, or replacing a flaky prompt-based instruction with a PostToolUse hook. |
| [[1.6-task-decomposition]] | Task decomposition strategies for complex workflows | 5 | Choosing between a fixed prompt-chaining pipeline and dynamic adaptive decomposition, or laying out the per-file plus integration-pass shape for a large code review. |
| [[1.7-session-state]] | Session state, resumption, and forking | 5 | Naming a session, resuming an interrupted run, forking from a baseline, or deciding whether to resume at all versus starting fresh with an injected summary. |

## Related domains

- [[../domain-2-tools-mcp/2.1-tool-interface-design]] — subagent tool
  restrictions and coordinator tool surface design feed directly into
  the orchestration patterns here.
- [[../domain-2-tools-mcp/2.2-structured-error-responses]] — the
  error-shape contract defined there is what tool results returned to
  the coordinator must follow.
- [[../domain-3-claude-code/3.2-slash-commands-and-skills]] — skills
  are the Claude Code surface for the coordinator/subagent split
  described in [[1.2-multi-agent-orchestration]] and
  [[1.3-subagent-context-passing]].
- [[../domain-3-claude-code/3.4-plan-mode-vs-direct]] — plan mode is
  one concrete instance of the gating pattern in
  [[1.4-workflow-enforcement]].
- [[../domain-3-claude-code/3.5-iterative-refinement]] — pairs with
  the iterative-refinement rule in [[1.2-multi-agent-orchestration]].
- [[../domain-4-prompt-engineering/4.4-validation-retry-loops]] —
  retry loops often drive the gating in [[1.4-workflow-enforcement]].
- [[../domain-4-prompt-engineering/4.6-multi-pass-review]] — the
  per-file plus integration-pass shape in [[1.6-task-decomposition]]
  is the orchestration counterpart to multi-pass review prompting.
- [[../domain-5-context-reliability/5.1-conversation-context]] —
  resumption and forking in [[1.7-session-state]] depend on the
  context-management rules there.
- [[../domain-5-context-reliability/5.2-escalation-and-ambiguity]] —
  the handoff summary pattern in [[1.4-workflow-enforcement]] is one
  shape of escalation.
- [[../domain-5-context-reliability/5.6-information-provenance]] —
  structured attribution metadata from
  [[1.3-subagent-context-passing]] is the provenance contract that
  domain expects.
