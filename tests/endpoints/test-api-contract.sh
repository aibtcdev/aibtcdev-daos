#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_contract() {
    echo "===================="
    echo "API Contract Tests"
    echo "===================="
    # Test with valid contract name
    test_cors "/api/contract/aibtc-base-dao" "Contract endpoint CORS"
    test_endpoint "/api/contract/aibtc-base-dao" 200 "Contract endpoint with valid name"
    
    # Test with invalid contract name
    test_endpoint "/api/contract/nonexistent-contract" 404 "Contract endpoint with invalid name"
}
