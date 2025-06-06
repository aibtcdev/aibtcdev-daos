#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_dependencies() {
    echo "===================="
    echo "API Dependencies Tests"
    echo "===================="
    # Test with valid contract name
    test_cors "/api/dependencies/aibtc-base-dao" "Dependencies endpoint CORS"
    test_endpoint "/api/dependencies/aibtc-base-dao" 200 "Dependencies endpoint with valid name"
    
    # Test with invalid contract name
    test_endpoint "/api/dependencies/nonexistent-contract" 404 "Dependencies endpoint with invalid name"
}
