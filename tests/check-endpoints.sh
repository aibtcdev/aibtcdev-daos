#!/bin/bash

# This script is a wrapper around run-endpoint-tests.sh
# that can be used in CI/CD pipelines

# Get the API URL from the first argument or use default
export API_URL=${1:-"http://localhost:8787"}

# Check if we should skip the delay (second argument)
SKIP_DELAY=${2:-"false"}

# Add a delay to allow the server to start up if needed
if [ "$SKIP_DELAY" != "true" ]; then
  echo "Waiting 10 seconds for server to be ready..."
  sleep 10
fi

echo "Testing endpoints at: $API_URL"

# Run the tests
"$(dirname "$0")"/endpoints/run-endpoint-tests.sh

# Exit with the same status as the test runner
exit $?
