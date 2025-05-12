#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_contracts() {
    echo "===================="
    echo "API Contracts Tests"
    echo "===================="
    test_cors "/api/contracts" "Contracts endpoint CORS"
    test_endpoint "/api/contracts" 200 "Contracts endpoint"
}
