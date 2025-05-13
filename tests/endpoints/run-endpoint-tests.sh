#!/bin/bash

# Set default API URL if not provided
export API_URL=${API_URL:-"http://localhost:8787"}

# Initialize counters
export TOTAL_TESTS=0
export FAILED_TESTS=0

# Source utility functions
source "$(dirname "$0")/utils.sh"

# Run all test modules
source "$(dirname "$0")/test-index.sh"
source "$(dirname "$0")/test-api-types.sh"
source "$(dirname "$0")/test-api-contracts.sh"
source "$(dirname "$0")/test-api-names.sh"
source "$(dirname "$0")/test-api-by-type.sh"
source "$(dirname "$0")/test-api-contract.sh"
source "$(dirname "$0")/test-api-by-type-subtype.sh"
source "$(dirname "$0")/test-api-dependencies.sh"
source "$(dirname "$0")/test-api-generate-contract.sh"

# Run all test functions
test_index
test_api_types
test_api_contracts
test_api_names
test_api_available_names
test_api_dao_names
test_api_by_type
test_api_contract
test_api_by_type_subtype
test_api_dependencies
test_api_generate_contract

# Print summary
echo ""
echo "===================="
echo "Test Summary"
echo "===================="
echo "Total tests: $TOTAL_TESTS"
echo "Failed tests: $FAILED_TESTS"

# Exit with failure if any tests failed
if [ $FAILED_TESTS -gt 0 ]; then
  ./tests/chadsay.sh "Action needed: $FAILED_TESTS test(s) failed."
  exit 1
else
  ./tests/chadsay.sh "All $TOTAL_TESTS endpoint tests passed. Good job."
  exit 0
fi
