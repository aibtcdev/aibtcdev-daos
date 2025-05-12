#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_names() {
    echo "===================="
    echo "API Names Tests"
    echo "===================="
    test_cors "/api/names" "Names endpoint CORS"
    test_endpoint "/api/names" 200 "Names endpoint"
}

test_api_available_names() {
    echo "===================="
    echo "API Available Names Tests"
    echo "===================="
    test_cors "/api/available-names" "Available names endpoint CORS"
    test_endpoint "/api/available-names" 200 "Available names endpoint"
}

test_api_dao_names() {
    echo "===================="
    echo "API DAO Names Tests"
    echo "===================="
    test_cors "/api/dao-names" "DAO names endpoint CORS"
    test_endpoint "/api/dao-names" 200 "DAO names endpoint"
}
