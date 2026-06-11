# Agentic Loops for Autonomous Task Execution

This file covers the control-flow contract an agentic loop must honour: dispatch a request, inspect `stop_reason`, execute any requested tools, feed results back into conversation history, and repeat until Claude signals it is done. Consult it when designing or reviewing any code path that puts Claude in a loop with tools — skill scaffolds, MCP servers, harness runners, or product features that delegate multi-step work to the model. The rules below are about the loop's plumbing; choosing *which* tools to expose belongs in domain 2.

---

## 1. Drive the loop from `stop_reason`, not from text content

The single source of truth for whether Claude has more work to do is `stop_reason`. Continue the loop while `stop_reason == "tool_use"`. Terminate when `stop_reason == "end_turn"`. Anything else — parsing the assistant's prose for phrases like "I'm done" or "finished", checking whether the last block contains text, sniffing for a sentinel string — is an anti-pattern.

The failure mode is silent: a model that emits a polite sign-off mid-task gets cut off, or a model that thinks aloud about being finished but still has tool calls queued gets a half-applied result. The protocol gives you a deterministic signal — use it.

```python
# Right — protocol-driven termination
while response.stop_reason == "tool_use":
    tool_results = execute_tools(response.content)
    response = client.messages.create(
        model=...,
        messages=messages + [{"role": "user", "content": tool_results}],
        tools=tools,
    )
# Loop falls through when stop_reason == "end_turn"
```

```python
# Wrong — natural-language termination
if "done" in response.text.lower() or "completed" in response.text.lower():
    break
```

---

## 2. Append tool results to conversation history before the next iteration

Each iteration must extend the conversation with both the assistant's `tool_use` block *and* a `user`-role message carrying the corresponding `tool_result` blocks. The model reasons about the next action based on the accumulated history; if you drop the results, replace them with a summary, or only show the latest pair, Claude loses the chain of evidence it needs to decide what to do next.

Keep the linkage explicit: every `tool_result` carries the `tool_use_id` of the call it satisfies. One result per call, in the same iteration's response — do not batch results from multiple loop turns into a single message.

```python
messages.append({"role": "assistant", "content": response.content})
messages.append({
    "role": "user",
    "content": [
        {"type": "tool_result", "tool_use_id": call.id, "content": output}
        for call, output in zip(tool_calls, outputs)
    ],
})
```

---

## 3. Let the model choose tools; don't hard-code the sequence

There is a sharp line between model-driven decision-making and pre-configured decision trees. In an agentic loop, Claude inspects the current context — including prior tool results — and decides which tool to call next. If you find yourself writing `if step == 1: call_search(); elif step == 2: call_summarise()`, you have built a workflow, not an agent, and you forfeit the model's ability to adapt when the task deviates from the expected path.

The corollary: invest in tool descriptions and input schemas so the model has enough signal to pick correctly. The loop's job is plumbing; the model's job is routing.

---

## 4. Do not use iteration caps as the primary stopping mechanism

A `max_iterations` ceiling is acceptable as a runaway safeguard — a circuit breaker against pathological loops, infinite tool-call cycles, or runaway cost. It is not acceptable as the way you decide a task is finished. Arbitrary iteration caps as the primary stopping mechanism are an anti-pattern.

If your loop routinely hits the cap, the diagnosis is upstream: tools are returning results the model can't act on, the prompt is unclear, or the task genuinely needs more turns. Raise the cap or fix the cause; don't treat the cap as success.

```python
# Right — protocol is primary, cap is a safety net
MAX_ITERS = 50  # circuit breaker only
for _ in range(MAX_ITERS):
    if response.stop_reason == "end_turn":
        break
    # ... execute tools, extend messages, re-request ...
else:
    raise RuntimeError("hit safety cap — investigate upstream")
```

---

## 5. Execute every requested tool before re-requesting

When a single assistant turn returns multiple `tool_use` blocks, execute all of them and return all of their results in the next user message. Partial responses — answering some calls and dropping the rest, or returning a stub for the ones you didn't run — break the model's mental model of what state the world is in, because the conversation history will show a call without a matching result.

If a tool genuinely cannot be run (permission denied, unsupported environment), return a `tool_result` with an error payload and `is_error: true` so the model can react. Silence is worse than failure.

---

## Related

- [[domain-1-agentic-orchestration/1.2-coordinator-subagent-patterns]]
- [[domain-1-agentic-orchestration/1.3-context-isolation-between-agents]]
- [[domain-2-tools-mcp/2.1-tool-interface-design]]
- [[domain-5-context-reliability/5.1-conversation-history-management]]
