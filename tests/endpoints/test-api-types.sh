#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_types() {
    echo "===================="
    echo "API Types Tests"
    echo "===================="
    test_cors "/api/types" "Types endpoint CORS"
    test_endpoint "/api/types" 200 "Types endpoint"
}
