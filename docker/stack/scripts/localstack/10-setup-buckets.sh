#!/bin/bash
# Provisions LocalStack AWS resources for local development.
# Creates two S3 buckets (quarantine and document storage), four SQS queues
# (ClamAV results, download requests, mock ClamAV, and a FIFO scan-results
# callback queue), and wires an S3 event notification so that files uploaded
# to the quarantine bucket are forwarded to the mock-clamav queue.
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

# S3 event notifications — trigger mock virus scanner when files land in quarantine
MOCK_CLAMAV_ARN="arn:aws:sqs:${AWS_REGION}:000000000000:mock-clamav"
aws --endpoint-url="$LOCALSTACK_URL" s3api put-bucket-notification-configuration \
  --bucket cdp-uploader-quarantine \
  --region "$AWS_REGION" \
  --notification-configuration "{\"QueueConfigurations\":[{\"Id\":\"mock-virus-scan\",\"QueueArn\":\"${MOCK_CLAMAV_ARN}\",\"Events\":[\"s3:ObjectCreated:*\"]}]}"
