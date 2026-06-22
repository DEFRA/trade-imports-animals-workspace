# Notification pipeline — deduplication semantics (AWS SQS/SNS vs Azure Service Bus)

The `NotificationSubmitted` pipeline crosses **two messaging systems with two
different, non-interchangeable deduplication mechanisms**. This trips people up,
so the rules are written down here.

```
backend (outbox) --SNS FIFO--> SQS FIFO --consumed by--> dynamics-gateway --ASB--> PIMS / Dynamics
        \__________ AWS side __________/                          \____ Azure side ____/
```

## The two mechanisms are NOT the same thing

| Concern | AWS (SNS / SQS, FIFO only) | Azure Service Bus |
|---|---|---|
| Entity-level dedup toggle | `ContentBasedDeduplication` | `RequiresDuplicateDetection` |
| Per-message dedup key | `MessageDeduplicationId` | `MessageId` |
| What it dedupes on when the toggle is ON | SHA-256 hash of the message **body** | the **MessageId** you set (NOT the body) |
| Dedup window | fixed 5 minutes | configurable (`DuplicateDetectionHistoryTimeWindow`, default 10 min) |

A finding about one side never automatically applies to the other. CDP support
owns the AWS resources; the ASB queue is **PIMS-owned**.

## CDP platform defaults (AWS)

Per the CDP [SQS/SNS how-to](https://portal.cdp-int.defra.cloud/documentation/how-to/sqs-sns.md):

- `ContentBasedDeduplication` (FIFO) is **off by default**.
- With it off, **producers MUST supply a `MessageDeduplicationId` on every send,
  or the message is rejected.**
- Other defaults: visibility timeout 60s, DLQ max receive count 3, dedup scope
  `queue`, FIFO throughput `perQueue`.

Confirmed for dev (2026-06): both the SNS topic
(`trade_imports_animals_eu_notifications.fifo`) and the gateway SQS queue
(`trade_imports_animals_eu_notifications_gateway.fifo`) have
`ContentBasedDeduplication = false` — i.e. they were created at the platform
default.

## How dedup is actually done here (the correct pattern)

Because content-based dedup is **off**, the producer supplies the dedup id
explicitly. The backend outbox does this correctly:

`OutboxPublishService.publishToSns()`:
```java
.messageGroupId(event.getAggregateId())        // FIFO ordering key
.messageDeduplicationId(event.getEventId());   // stable dedup key
```

`event.getEventId()` is the outbox row's **Mongo `@Id`**, generated once at event
creation (`OutboxService`: `.eventId(UUID.randomUUID().toString())`) and
**persisted**. Because it is stored, re-publishes of the same outbox row (e.g. the
poller crashes after the SNS publish but before marking `publishedAt`) carry the
**same** `MessageDeduplicationId` → SNS suppresses the duplicate. This is the key
property: **the dedup id must be stable across retries**, which a persisted id is
and a freshly-generated one is not.

## The gateway → ASB caveat (EUDPA-208 review item 8 — Won't Fix)

`QueueMessageSender.publish()` sets the ASB `MessageId` to a **fresh
`UUID.randomUUID()` per call**. If ASB `RequiresDuplicateDetection` were ever
enabled, that would **defeat** dedup (ASB dedupes on `MessageId`, and a fresh one
per send never matches a retry).

Resolved as **Won't Fix** because:

- ASB `RequiresDuplicateDetection` defaults to **false**, is **immutable after
  queue creation**, the local emulator config has it `false`, and nothing in the
  service enables it.
- So the ASB `MessageId` here serves only as a **trace id**, for which a random
  UUID is correct.

**If PIMS ever enables ASB duplicate detection**, this becomes a real bug — fix it
by deriving the ASB `MessageId` from a stable event identifier (mirror the backend
outbox pattern above), not a per-call random UUID.

## Local ↔ dev parity

The local stack must mirror dev so local testing gives correct feedback. The
localstack init scripts therefore set `ContentBasedDeduplication=false` on the SNS
topic and SQS queues (matching dev + the platform default). This forces producers
to supply a `MessageDeduplicationId` locally exactly as in dev — a missing/wrong
dedup id then fails locally instead of being silently masked by body-hash dedup.

Init scripts:
- `trade-imports-animals-backend/compose/start-floci.sh` — creates the SNS topic.
- `trade-imports-dynamics-gateway/servicebus/start-localstack.sh` — creates the
  SQS queue + DLQ and subscribes to the topic.
- ASB emulator entities: `trade-imports-dynamics-gateway/servicebus/servicebus-config.json`.
