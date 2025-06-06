#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_index() {
    echo "===================="
    echo "Index Tests"
    echo "===================="
    test_cors "/" "Root endpoint CORS"
    test_endpoint "/" 200 "Root endpoint"
    test_cors "/invalid" "Invalid endpoint CORS"
    test_endpoint "/invalid" 404 "Invalid endpoint"
    echo "===================="
    echo "API Index Tests"
    echo "===================="
    test_cors "/api" "API Index endpoint CORS"
    test_endpoint "/api" 200 "API Index endpoint"
}
