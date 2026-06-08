# Domain 5: Context Management & Reliability

Context windows are finite, multi-agent systems silently drop errors, and
human reviewers have limited attention. This domain covers the
disciplines an agent architect uses to keep long-running and multi-agent
workflows trustworthy: preserving facts across turns, escalating when
stuck, propagating failures honestly, navigating large codebases without
context collapse, routing humans to the cases that need them, and
tracking where every claim came from.

Consult this domain when the work outlasts a single short prompt, spans
multiple subagents, or produces output that downstream readers must be
able to challenge.

## Files

| File | Topic | Rule count | When to load |
| --- | --- | --- | --- |
| [5.1-conversation-context.md](5.1-conversation-context.md) | Manage conversation context across long interactions | 7 | Designing a long-running chat or agent loop that must remember IDs, prices, decisions, or earlier tool outputs across many turns |
| [5.2-escalation-and-ambiguity.md](5.2-escalation-and-ambiguity.md) | Escalation and ambiguity resolution patterns | 6 | Writing the policy for when an agent stops and asks a human versus picks an option, including how to disambiguate multi-match lookups |
| [5.3-error-propagation.md](5.3-error-propagation.md) | Error propagation across multi-agent systems | 6 | Defining how a subagent reports partial failure to its coordinator and how the coordinator annotates gaps in its synthesis |
| [5.4-large-codebase-exploration.md](5.4-large-codebase-exploration.md) | Context management in large codebase exploration | 6 | Planning a multi-phase exploration of a large repository, including scratchpad files, delegated discovery, and crash recovery manifests |
| [5.5-human-review-workflows.md](5.5-human-review-workflows.md) | Human review workflows and confidence calibration | 5 | Routing reviewer attention via segment accuracy, calibrated confidence scores, and stratified sampling of high-confidence output |
| [5.6-information-provenance.md](5.6-information-provenance.md) | Information provenance and uncertainty handling | 7 | Producing a synthesis from multiple subagents where claims must remain attributable to sources, dates, and conflicting findings |

## How the leaves fit together

The six leaves form a progression from the agent's own working memory
outwards. 5.1 fixes what the agent itself must retain across turns; 5.4
extends the same problem to multi-hour exploration runs that exceed any
single context window. 5.2 governs the moment the agent must hand
control back to a human, and 5.3 governs the moment a subagent must hand
a failure back up the call stack. 5.5 and 5.6 then deal with what
arrives at the human reviewer: 5.5 controls how their attention is
allocated via confidence and sampling; 5.6 controls whether they can
actually trace and challenge the claims in front of them.

Together they answer one question: can a downstream reader (human or
agent) trust the output of a long, branched, multi-source workflow, and
re-derive how it got there?

## Related domains

The files here rarely stand alone. Common pairings:

- [[../domain-1-agentic-orchestration/1.3-subagent-context-passing]] —
  what to hand a subagent on dispatch so it can produce the structured
  error and provenance metadata Domain 5 demands.
- [[../domain-1-agentic-orchestration/1.7-session-state]] — durable
  on-disk state is the substrate behind the scratchpads and crash-recovery
  manifests in 5.4.
- [[../domain-2-tools-mcp/2.2-structured-error-responses]] — tool-level
  error shape that feeds the subagent error propagation rules in 5.3;
  without it, 5.3 cannot distinguish access failure from empty result.
- [[../domain-4-prompt-engineering/4.3-structured-output]] — the JSON
  shapes used by 5.1 (transactional facts), 5.3 (error envelopes), 5.5
  (confidence fields), and 5.6 (provenance records).
- [[../domain-4-prompt-engineering/4.4-validation-retry-loops]] — pairs
  with 5.2: validate and retry first, escalate only when the loop
  genuinely cannot make progress.
- [[../domain-4-prompt-engineering/4.6-multi-pass-review]] — the
  synthesis step that consumes the provenance and error annotations
  defined here, and the place where coverage gaps must be surfaced.
