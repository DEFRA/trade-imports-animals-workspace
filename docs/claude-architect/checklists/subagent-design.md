# Checklist — Designing subagent invocation, context passing, and isolation

Run this checklist whenever you are about to add a new subagent spawn point to
a skill or tool — whether that is a fresh `Task` call from a coordinator, a new
worker persona under `references/`, or a fan-out loop that dispatches many
parallel jobs. Walk it before you write the prompt, then again before you
commit, so the resulting subagent is narrow, well-attributed, and fails loudly
rather than silently.

## Checklist

1. Have you decided whether this work belongs in a subagent at all, rather
   than inline in the coordinator? Subagents pay for themselves when the work
   needs an isolated context window or genuine parallelism — otherwise the
   coordinator's four jobs (route, decompose, synthesise, decide) should
   absorb it directly — see
   [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].
2. Is the decomposition wide enough? A single subagent doing one narrow
   lookup wastes a context window and inflates latency without buying
   isolation — see
   [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].
3. Have you chosen between a fixed prompt-chaining pipeline (predictable
   stages, deterministic order) and dynamic adaptive decomposition
   (coordinator picks the next move from intermediate results), and does the
   shape of the task justify the choice? — see
   [[../domain-1-agentic-orchestration/1.6-task-decomposition]].
4. For multi-file reviews, are you using the per-file plus integration-pass
   pattern — one subagent per file in parallel, then a synthesising pass for
   cross-file concerns — rather than asking one subagent to review everything
   at once? — see
   [[../domain-1-agentic-orchestration/1.6-task-decomposition]].
5. Are independent subagent calls dispatched in parallel (multiple `Task`
   invocations in a single assistant turn) rather than serialised needlessly?
   — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
6. Does each subagent prompt carry the prior findings it needs, with
   structured attribution metadata (source, run id, timestamp, file path)
   rather than a vague summary? Subagents start cold — they cannot see the
   coordinator's transcript — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
7. Is the subagent prompt written as a goal plus success criteria, not a
   step-by-step recipe? Recipes overfit to the coordinator's mental model;
   goals let the subagent choose the right path from its isolated context —
   see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
8. Have you narrowed the subagent's tool surface to only what the job needs
   (`Read`, `Grep`, `Bash` on specific scripts) rather than handing it `Tools:
   *`? An over-broad tool list invites the subagent to wander off-task — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
9. If multiple subagents need the same baseline context (the same ticket
   brief, the same diff), are you forking from a shared baseline rather than
   re-fetching in each child? Forked sessions stay cheaper and more
   consistent — see
   [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
10. Does the subagent contract specify a structured return shape — verdict,
    findings, coverage gaps — that the coordinator can parse, rather than free
    prose? Synthesis is impossible without it — see
    [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].
11. When a subagent hits an access failure (missing file, auth error, tool
    refusal), does the contract require it to report the failure with
    structured context rather than returning an empty result that looks like
    a clean pass? — see
    [[../domain-5-context-reliability/5.3-error-propagation]].
12. Is local recovery scoped — the subagent retries what it can, the
    coordinator decides whether a partial failure aborts the workflow or is
    annotated as a coverage gap? Never let one failed child silently abort
    the whole run — see
    [[../domain-5-context-reliability/5.3-error-propagation]].
13. When the coordinator synthesises results, does it carry forward
    per-subagent coverage gaps into the final output rather than papering
    over them? — see
    [[../domain-5-context-reliability/5.3-error-propagation]].
14. Is there an iterative refinement loop where the coordinator can re-spawn
    a subagent with additional context if its first pass was incomplete,
    rather than treating every spawn as one-shot? — see
    [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].

## Common failure modes

- **Narrow decomposition.** One subagent per trivial lookup — the context
  window cost dominates, parallelism buys nothing, and the coordinator's
  synthesis turn does the real work anyway. See
  [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].
- **Cold-start prompts.** The coordinator says "review this file" without
  passing the ticket brief, the prior findings, or the attribution metadata —
  the subagent invents context to fill the gap and the synthesis pass cannot
  trust anything it returned. See
  [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
- **Recipe prompts.** The coordinator hands the subagent a 12-step procedure
  rather than a goal and success criteria — the subagent follows the recipe
  even when its isolated context shows the recipe is wrong. See
  [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]].
- **Silent access failures.** A subagent cannot read a file, returns "no
  issues found", and the coordinator treats absence of findings as a clean
  bill of health. The whole review is now a lie. See
  [[../domain-5-context-reliability/5.3-error-propagation]].
- **One-shot synthesis.** The coordinator merges N subagent outputs in one
  pass with no refinement loop — when one subagent comes back thin, there is
  no mechanism to re-spawn it with extra context before the final answer
  lands. See
  [[../domain-1-agentic-orchestration/1.2-multi-agent-orchestration]].
