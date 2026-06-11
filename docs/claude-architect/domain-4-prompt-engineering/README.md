# Domain 4: Prompt Engineering & Structured Output

This domain covers the practitioner-level prompting techniques that make
Claude's output reliable enough to wire into a pipeline: writing explicit
categorical criteria instead of vague guidance, anchoring ambiguous tasks
with few-shot examples, enforcing shape via MCP tool schemas, closing
the loop with validation-and-retry, and decomposing review tasks across
multiple passes or instances.

Consult this domain whenever Claude's output feeds another system — an
extractor, a reviewer, a downstream consumer — and the cost of a
malformed, hedged, or inconsistent response is higher than the cost of
one more prompt iteration. Structured-output techniques apply equally
to MCP tool input schemas (where the schema is the contract Claude
fills) and to Claude Code prompts that need machine-parseable JSON in
their response (where the schema lives in the prompt and the consumer
parses the text reply) — the discipline is the same in both settings.
The leaves here are ordered roughly from prompt-only techniques (4.1,
4.2) through structural enforcement (4.3, 4.4) to architecture concerns
(4.6); pick the lowest level of intervention that solves the actual
failure mode rather than reaching for multi-pass when a clearer
criterion would do.

The shared thread across all six leaves is that ambiguity is the failure
mode: every rule either removes ambiguity at the source (explicit
criteria, few-shot anchors, JSON schemas) or detects and recovers from
ambiguity that slipped through (validation loops, multi-pass review,
batch-resubmit-on-failure).

## Files

| File | Topic | Rule count | When to load |
|---|---|---|---|
| [4.1-explicit-criteria.md](4.1-explicit-criteria.md) | Explicit criteria over vague instructions | 5 | Drafting a prompt and finding yourself reaching for "be accurate" or "use your judgement" — swap to defined report/skip lists with severity-level code examples |
| [4.2-few-shot-prompting.md](4.2-few-shot-prompting.md) | Few-shot prompting for ambiguous scenarios | 6 | Extraction or classification task where instructions alone yield inconsistent shape, or where two output categories collapse into one |
| [4.3-structured-output.md](4.3-structured-output.md) | Structured output via MCP tool schemas | 6 | Designing the JSON shape Claude must return — marking fields optional, adding `unclear`/`other` enum escape hatches |
| [4.4-validation-retry-loops.md](4.4-validation-retry-loops.md) | Validation, retry, and feedback loops for extraction | 6 | Wrapping a structured-output call in a retry harness — distinguishing schema errors from semantic errors and adding self-surfacing fields like `calculated_total` vs `stated_total` |
| [4.6-multi-pass-review.md](4.6-multi-pass-review.md) | Multi-instance and multi-pass review architectures | 6 | Architecting a reviewer that can't fit the whole artefact in one pass, or where self-review would compromise independence — splitting per-file vs integration, routing by self-reported confidence |

## Related domains

- [[../domain-2-tools-mcp/2.1-tool-design]] — `tool_use` schema design rules
  underpin most of 4.3 and 4.4; consult together when the extraction
  "tool" is the contract Claude is being held to, not a real
  side-effecting tool.
- [[../domain-2-tools-mcp/2.2-tool-descriptions]] — description-writing
  discipline (what counts as a good `description` string) carries over
  directly to enum value descriptions and field descriptions in 4.3.
- [[../domain-1-agentic-orchestration/1.3-subagent-fanout]] — multi-pass
  review (4.6) is frequently implemented as a subagent fan-out; the
  orchestration rules there pair with the reviewer-decomposition rules
  here.
- [[../domain-1-agentic-orchestration/1.4-handoff-artifacts]] — multi-pass
  review (4.6) relies on durable handoff artefacts between stages,
  especially when the gap between stages is measured in hours rather
  than seconds.
- [[../domain-5-context-reliability/5.2-context-management]] — few-shot
  examples (4.2) consume context budget that competes with retrieved
  evidence; load alongside when token pressure is part of the design
  constraint.
- [[../domain-5-context-reliability/5.3-hallucination-mitigation]] —
  validation loops (4.4) and self-surfacing schema fields
  (`calculated_total` vs `stated_total`, `conflict_detected`) are a
  primary hallucination-mitigation lever and should be reasoned about
  together.
