# Batch Processing with the Message Batches API

This file covers when to route work through the Message Batches API instead of the synchronous API, how to size batch cadence against an end-to-end SLA, and how to recover from partial batch failures. Consult it whenever you are designing a workload that produces many independent Claude requests (overnight reports, periodic audits, bulk classification) and the question is "synchronous calls or batch?". It does not cover multi-turn conversational workloads — those belong on the synchronous API.

---

## 1. Use the Batches API only for non-blocking, latency-tolerant work

The Message Batches API offers a 50% cost saving versus synchronous calls, but it carries no latency SLA and the processing window is up to 24 hours. That trade-off is right for overnight reports, weekly audits, and nightly test generation. It is wrong for anything that gates a human workflow or a CI step.

Pre-merge checks, request-response UX, and any "user is waiting" path must stay on the synchronous API. Routing a blocking check through the batch API trades 50% of API cost for an unbounded wait that can stall the whole pipeline.

| Workload | API |
|----------|-----|
| Pre-merge code check, interactive review, UI completion | Synchronous |
| Overnight report, weekly compliance audit, nightly test generation | Batch |

---

## 2. Avoid the Batches API for multi-turn tool calling

The batch API does not support multi-turn tool calling within a single request. You cannot execute a tool mid-request and feed its result back into the same batched message. If the workload needs the model to call a tool, see the result, and then continue reasoning, it must run on the synchronous API.

If you have a large volume of tool-using requests and want the batch discount, split the work: pre-compute the tool results in a separate synchronous (or non-Claude) step, then submit a single-turn batch request that includes those results inline as context. Do not try to fold mid-flight tool calls into a batch.

---

## 3. Size batch cadence to your end-to-end SLA, not to the batch window

The 24-hour processing window is a worst case, not a target. When you have an end-to-end SLA, the submission cadence has to leave room for the full batch window plus any downstream processing.

Worked example: to guarantee a 30-hour end-to-end SLA on top of a 24-hour batch window, submit batches at least every 4 hours. That leaves 6 hours of SLA slack for the worst batch to complete (24h) plus any post-processing. Pick the cadence by subtracting the batch worst-case and the downstream budget from the SLA — do not assume batches will finish quickly just because they usually do.

```
submission_interval <= SLA_total - batch_worst_case - downstream_budget
                    = 30h        - 24h               - 2h
                    = 4h
```

---

## 4. Correlate requests and responses with `custom_id`

Every batched request carries a `custom_id` field. Set it to something you can map back to the originating record — a document ID, a ticket number, a row primary key — not an index into a transient array. The batch response uses `custom_id` as the only handle you have to pair a result with its input.

This matters most on failure (§5): without a stable `custom_id`, you cannot tell which originating record needs to be resubmitted, and you have to re-run the whole batch.

---

## 5. On partial failure, resubmit only the failed `custom_id`s — with modifications

When a batch comes back with some succeeded and some failed responses, treat the failures as a smaller batch to re-prepare, not a signal to re-run the whole job. Identify failures by their `custom_id`, apply the appropriate fix per failure mode, and resubmit just those.

Common modifications by failure mode:

- **Context-length exceeded** — chunk the offending document before resubmitting.
- **Transient model error** — resubmit the same payload.
- **Malformed input** — fix the input shape, then resubmit.

Resubmitting the whole batch wastes the 50% discount on every record that already succeeded and pushes the end-to-end completion further into the SLA window.

---

## 6. Refine the prompt on a sample before submitting the full batch

Submitting 100,000 records against an unrefined prompt is the most expensive way to discover that the prompt is wrong. Run prompt refinement on a representative sample first, get the first-pass success rate as high as you can, and only then submit the full volume.

The point is not just correctness — every failed record in a large batch costs another batch cycle to resubmit (§5), which compounds against the SLA cadence (§3). High first-pass success keeps the cost saving real and keeps resubmission cycles bounded.

A workable sequence:

1. Pull a sample (e.g. 50-200 records) that covers the input variation.
2. Iterate on the prompt against the sample using the synchronous API.
3. When the sample first-pass success rate is acceptable, submit the full batch.
4. Resubmit any failures per §5.

---

## Related

- [[domain-4-prompt-engineering/4.1-prompt-structure]]
- [[domain-4-prompt-engineering/4.6-multi-instance-review]]
- [[domain-2-tools-mcp/2.1-tool-interface-design]]
- [[domain-5-context-reliability/5.1-context-budgeting]]
