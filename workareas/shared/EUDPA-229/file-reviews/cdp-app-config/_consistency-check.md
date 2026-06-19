# Consistency Check: cdp-app-config

## Cross-Repo Alignment

### Environment Variable Naming
- `OUTBOX_SNS_TOPIC_ARN` in both dev and test env files matches `${OUTBOX_SNS_TOPIC_ARN:}` in `application.yml` (line 148) — **consistent**.

### Topic ARN Format
- Dev: `arn:aws:sns:eu-west-2:332499610595:trade_imports_animals_eu_notifications.fifo`
- Test: `arn:aws:sns:eu-west-2:756547862786:trade_imports_animals_eu_notifications.fifo`
- Same topic name across environments, different AWS account IDs — follows CDP convention.
- Both use `.fifo` suffix indicating FIFO topic — see critical finding on backend PR.

### Region Consistency
- Both ARNs use `eu-west-2`, matching `aws.region` in `application.yml` — **consistent**.

## Findings

**CRITICAL**: Both environments configure a FIFO topic (`.fifo` suffix), but the backend's `OutboxPublishService` does not set `MessageGroupId` on `PublishRequest`. FIFO SNS topics require this parameter. Publishing will fail at runtime with `InvalidParameterException`. This is tracked as item #20 on the backend review.

## Verdict

**NEEDS ATTENTION** — cross-repo config is internally consistent, but the FIFO topic contract is not met by the publish code.
