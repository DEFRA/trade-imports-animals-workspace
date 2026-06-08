# Production Scenarios — When Each Domain Matters

This file catalogues the six canonical production scenarios used to frame architectural decisions across this material. Consult it when you need to anchor a design conversation in a realistic shape — pick the closest scenario, then follow its primary domains into the per-domain references. Each scenario lists the system you are building, the operating constraint, and the domains that carry the most weight for that shape of system.

---

## 1. Customer Support Resolution Agent

**System.** A customer support resolution agent that handles high-ambiguity requests — returns, billing disputes, account issues. It reaches backend systems through custom MCP tools (`get_customer`, `lookup_order`, `process_refund`, `escalate_to_human`).

**Operating constraint.** Target 80%+ first-contact resolution while knowing when to escalate to a human.

**Primary domains.**

- Agentic Architecture & Orchestration
- Tool Design & MCP Integration
- Context Management & Reliability

**When to reach for it.** Any agent that takes irreversible actions on behalf of an end user behind a real backend. The escalation path is part of the design, not an afterthought.

---

## 2. Code Generation with Claude Code

**System.** Claude Code used to accelerate software development — code generation, refactoring, debugging, documentation. Integrated into a team workflow with custom slash commands and `CLAUDE.md` configurations.

**Operating constraint.** Knowing when to use plan mode versus direct execution.

**Primary domains.**

- Claude Code Configuration & Workflows
- Context Management & Reliability

**When to reach for it.** Team-scale Claude Code rollouts where the configuration surface (slash commands, `CLAUDE.md`, plan mode) is the lever being tuned, not the model itself.

---

## 3. Multi-Agent Research System

**System.** A multi-agent research system. A coordinator agent delegates to specialised subagents — one searches the web, one analyses documents, one synthesises findings, one generates reports. Output is a comprehensive, cited report.

**Operating constraint.** Topics are open-ended; the system must produce cited, comprehensive reports rather than single answers.

**Primary domains.**

- Agentic Architecture & Orchestration
- Tool Design & MCP Integration
- Context Management & Reliability

**When to reach for it.** Any coordinator/sub-agent fan-out where work is split across specialised roles and recombined. The orchestration shape, not the prompt content, dominates the design.

---

## 4. Developer Productivity with Claude

**System.** Developer productivity tooling built on Claude Code. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) alongside MCP servers.

**Operating constraint.** Operates against codebases the engineer (and the agent) does not already know.

**Primary domains.**

- Tool Design & MCP Integration
- Claude Code Configuration & Workflows
- Agentic Architecture & Orchestration

**When to reach for it.** Internal developer-facing agents that mix built-in filesystem/shell tools with MCP servers. Distinguished from Scenario 2 by the agent doing the exploration itself rather than serving a developer at the keyboard.

---

## 5. Claude Code for Continuous Integration

**System.** Claude Code integrated into a CI/CD pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests.

**Operating constraint.** Prompts must produce actionable feedback and minimise false positives.

**Primary domains.**

- Claude Code Configuration & Workflows
- Prompt Engineering & Structured Output

**When to reach for it.** Non-interactive Claude Code — runs without a human in the loop, output is consumed by another system or posted as PR comments. False positives are expensive because nobody is there to filter them in real time.

---

## 6. Structured Data Extraction

**System.** A structured data extraction system using Claude. Pulls information from unstructured documents, validates output against JSON schemas, and integrates with downstream systems.

**Operating constraint.** High accuracy with graceful handling of edge cases.

**Primary domains.**

- Prompt Engineering & Structured Output
- Context Management & Reliability

**When to reach for it.** Pipelines where Claude's output is parsed by another program rather than read by a human. Schema validation and edge-case behaviour are first-class concerns; agentic orchestration is not.

---

## Scenario-to-domain matrix

| # | Scenario | Agentic | Tools/MCP | Claude Code | Prompts | Context |
|---|----------|---------|-----------|-------------|---------|---------|
| 1 | Customer Support Resolution Agent | Y | Y | — | — | Y |
| 2 | Code Generation with Claude Code | — | — | Y | — | Y |
| 3 | Multi-Agent Research System | Y | Y | — | — | Y |
| 4 | Developer Productivity with Claude | Y | Y | Y | — | — |
| 5 | Claude Code for CI | — | — | Y | Y | — |
| 6 | Structured Data Extraction | — | — | — | Y | Y |

Use the matrix to spot domains that recur across scenarios — Context Management & Reliability appears in four of the six, which is why it earns its own domain rather than being folded into the others.

---

## Related

- [[domain-1-agentic-orchestration/index]]
- [[domain-2-tools-mcp/index]]
- [[domain-3-claude-code/index]]
- [[domain-4-prompt-engineering/index]]
- [[domain-5-context-reliability/index]]
