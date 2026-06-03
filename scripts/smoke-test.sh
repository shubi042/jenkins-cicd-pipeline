#!/bin/bash
set -e

ENV="${1:-dev}"
MAX_RETRIES=10
SLEEP_SECONDS=10

case "$ENV" in
  dev)  HOST="myapp-dev.example.com" ;;
  prod) HOST="myapp.example.com" ;;
  *)    echo "Usage: $0 [dev|prod]"; exit 1 ;;
esac

echo "Running smoke tests against $HOST ($ENV)..."

for i in $(seq 1 $MAX_RETRIES); do
  echo "Attempt $i/$MAX_RETRIES..."
  RESPONSE=$(curl -sf "https://$HOST/health" 2>/dev/null) && break
  echo "Not ready yet, waiting ${SLEEP_SECONDS}s..."
  sleep $SLEEP_SECONDS
done

if [ -z "$RESPONSE" ]; then
  echo "Smoke test FAILED — /health did not respond after $MAX_RETRIES attempts"
  exit 1
fi

STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")
if [ "$STATUS" != "healthy" ]; then
  echo "Smoke test FAILED — unexpected status: $STATUS"
  exit 1
fi

echo "Smoke test PASSED — $HOST is healthy"