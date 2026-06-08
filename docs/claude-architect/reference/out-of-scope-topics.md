# Out-of-scope topics — explicitly NOT covered

This reference lists topics this folder explicitly excludes. Consult it when you are tempted to add depth to a skill, doc, or prompt that veers into these areas — workspace agents should not treat them as primary architectural concerns. They may still come up in passing; they are simply not the architectural shape these notes expect you to reason about.

The list is short and prescriptive. Treat it as a guardrail when scoping new skills, evaluating MCP tool surface, or writing CLAUDE.md guidance.

---

## 1. Model internals and training methodology

The following are out of scope and should not be relied upon as architectural levers:

- Constitutional AI, RLHF, or safety training methodologies
- Embedding models or vector database implementation details
- Token counting algorithms or tokenization specifics

These are properties of how Anthropic builds and aligns models, not interfaces a skill author tunes. If a design decision depends on the internals of how Claude was trained or how text becomes tokens, the design is on the wrong side of the API boundary. Reach for prompt structure, tool design, or context strategy instead.

---

## 2. Modalities and surfaces beyond text and tool use

Out of scope:

- Computer use (browser automation, desktop interaction)
- Vision/image analysis capabilities

These notes are about text-and-tool agentic systems. When a workspace skill or MCP server proposal leans on computer use or vision as the central capability, that proposal lives outside what this folder covers. Keep those capabilities walled off in their own skills and do not let them leak into general architectural rules.

---

## 3. Transport and account-management plumbing

Out of scope:

- Streaming API implementation or server-sent events
- Rate limiting, quotas, or API pricing calculations
- OAuth, API key rotation, or authentication protocol details

These are real production concerns, but they are infrastructure plumbing rather than agent architecture. These notes assume a working transport and a working auth story; they do not cover the design of either. Defer to platform/SRE docs for these, and avoid building architectural rules in workspace skills that hinge on streaming protocol details or rotation cadence.

---

## 4. Deployment substrate and benchmarking

Out of scope:

- Specific cloud provider configurations (AWS, GCP, Azure)
- Performance benchmarking or model comparison metrics

Cloud-specific deployment recipes and head-to-head benchmark numbers are not architectural primitives here. A workspace skill should describe the agent design (tools, context, subagents, evaluation) cloud-agnostically; if AWS- or GCP-specific glue is genuinely required, isolate it in a thin adapter rather than baking it into the architecture.

---

## 5. Implementation details behind known capabilities

Out of scope:

- Prompt caching implementation details (beyond knowing it exists)

Skill authors need to know prompt caching exists and when to use it; they do not need to reason about how cache keys, eviction, or TTLs are implemented inside the API. If a design depends on internal cache mechanics, treat that as a smell — the rule of thumb is "use the documented surface, do not model the internals".

---

## How to use this list

- When scoping a new workspace skill, sanity-check that its core value is not one of the topics above. If it is, the skill belongs in a domain-specific corner (e.g. a vision-only skill, a billing-ops skill) rather than in the general agent-architecture surface.
- When reviewing prompts or CLAUDE.md guidance, strip out advice that depends on training-methodology, tokenization, or cache internals. Replace it with advice grounded in the documented API and tool surface.
- When evaluating MCP servers, flag tools that expose model internals or training-pipeline knobs — they signal an abstraction these notes do not endorse.

---

## Related

- [[reference/preparation-exercises]]
- [[reference/in-scope-topics]]
- [[reference/technologies-and-concepts]]
- [[domain-2-tools-mcp/2.1-tool-interface-design]]
