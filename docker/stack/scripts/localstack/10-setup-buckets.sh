#!/bin/bash
# Provisions LocalStack AWS resources for local development.
# Creates two S3 buckets (quarantine and document storage), SQS queues
# (ClamAV results, download requests, mock ClamAV, FIFO scan-results
# callback), the dynamics-gateway notification pipeline (SNS FIFO topic →
# SQS FIFO queue with DLQ), and wires S3 event notifications so that files
# uploaded to the quarantine bucket are forwarded to the mock-clamav queue.
set -euo pipefail

# S3 buckets (|| true makes creation idempotent on restart)
aws --endpoint-url="$LOCALSTACK_URL" s3 --region "$AWS_REGION" mb s3://cdp-uploader-quarantine || true
aws --endpoint-url="$LOCALSTACK_URL" s3 --region "$AWS_REGION" mb s3://trade-imports-animals-documents || true

# SQS queues (|| true makes creation idempotent on restart)
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-clamav-results || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-uploader-download-requests || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name mock-clamav || true
aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" --queue-name cdp-uploader-scan-results-callback.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true || true
# || true makes creation idempotent on restart. Assumes queue attributes haven't changed between
# runs — if they have (e.g. after a local config change), the existing queue will be silently
# reused with its stale attributes. Recreate the container to force a clean queue in that case.

# Dynamics-gateway notification pipeline (SNS FIFO → SQS FIFO with DLQ)
NOTIFICATION_DLQ="trade_imports_animals_eu_notifications_dlq.fifo"
NOTIFICATION_QUEUE="trade_imports_animals_eu_notifications_gateway.fifo"
NOTIFICATION_TOPIC="trade_imports_animals_eu_notifications.fifo"
ACCOUNT="000000000000"

aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" \
  --queue-name "$NOTIFICATION_DLQ" \
  --attributes FifoQueue=true,ContentBasedDeduplication=true || true

DLQ_ARN="arn:aws:sqs:${AWS_REGION}:${ACCOUNT}:${NOTIFICATION_DLQ}"

NOTIFICATION_QUEUE_ATTRIBUTES=$(cat <<QEOF
{
  "FifoQueue": "true",
  "ContentBasedDeduplication": "true",
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"${DLQ_ARN}\",\"maxReceiveCount\":\"3\"}"
}
QEOF
)

aws --endpoint-url="$LOCALSTACK_URL" sqs create-queue --region "$AWS_REGION" \
  --queue-name "$NOTIFICATION_QUEUE" \
  --attributes "$NOTIFICATION_QUEUE_ATTRIBUTES" || true

NOTIFICATION_QUEUE_ARN="arn:aws:sqs:${AWS_REGION}:${ACCOUNT}:${NOTIFICATION_QUEUE}"

aws --endpoint-url="$LOCALSTACK_URL" sns create-topic --region "$AWS_REGION" \
  --name "$NOTIFICATION_TOPIC" \
  --attributes FifoTopic=true,ContentBasedDeduplication=true || true

NOTIFICATION_TOPIC_ARN="arn:aws:sns:${AWS_REGION}:${ACCOUNT}:${NOTIFICATION_TOPIC}"

aws --endpoint-url="$LOCALSTACK_URL" sns subscribe --region "$AWS_REGION" \
  --topic-arn "$NOTIFICATION_TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$NOTIFICATION_QUEUE_ARN" \
  --attributes RawMessageDelivery=true || true

# S3 event notifications — trigger mock virus scanner when files land in quarantine
MOCK_CLAMAV_ARN="arn:aws:sqs:${AWS_REGION}:000000000000:mock-clamav"
aws --endpoint-url="$LOCALSTACK_URL" s3api put-bucket-notification-configuration \
  --bucket cdp-uploader-quarantine \
  --region "$AWS_REGION" \
  --notification-configuration "{\"QueueConfigurations\":[{\"Id\":\"mock-virus-scan\",\"QueueArn\":\"${MOCK_CLAMAV_ARN}\",\"Events\":[\"s3:ObjectCreated:*\"]}]}"
