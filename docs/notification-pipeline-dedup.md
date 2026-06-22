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

## The gateway → ASB MessageId (EUDPA-208 review item 8)

`NotificationSqsListener` reads the inbound SQS `MessageDeduplicationId` (the
backend outbox `eventId`) from the `Sqs_Msa_MessageDeduplicationId` header and
passes it to `QueueMessageSender.publish(body, sessionId, messageId)`, which sets
it as the ASB `MessageId`. When the id is absent it falls back to a fresh
`UUID.randomUUID()`.

This keeps the dedup key **consistent end-to-end** — backend `eventId` → SNS
`MessageDeduplicationId` → ASB `MessageId` — so ASB duplicate detection would work
**without any code change** if `RequiresDuplicateDetection` is ever enabled. It is
off today (defaults to false, immutable after queue creation, PIMS-owned), so the
id currently doubles as a stable trace/correlation id.

Verified end-to-end by `NotificationSqsListenerIT` (localstack SQS + ASB emulator):
a known SQS `MessageDeduplicationId` arrives as the ASB `MessageId`.

> Why not read the id from the message body? The body carries only the domain
> payload (`NotificationSubmittedData`) — it has no unique event id; the only
> identifier in it is `referenceNumber`, which is the aggregate/group key shared
> across an aggregate's events, so using it would wrongly dedupe distinct events.
> The unique id travels as the SQS dedup attribute, which is why the listener reads
> it from the header. (The HTTP `EventsSendController` path has no upstream id and
> uses the two-arg `publish` overload, which generates a fresh MessageId.)

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
