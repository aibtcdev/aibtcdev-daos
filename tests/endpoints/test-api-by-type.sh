#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_by_type() {
    echo "===================="
    echo "API By Type Tests"
    echo "===================="
    # Test with valid type
    test_cors "/api/by-type/BASE" "By type endpoint CORS"
    test_endpoint "/api/by-type/BASE" 200 "By type endpoint with valid type"
    
    # Test with invalid type
    test_endpoint "/api/by-type/INVALID_TYPE" 400 "By type endpoint with invalid type"
}
