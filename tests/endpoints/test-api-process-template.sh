#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_process_template() {
    echo "===================="
    echo "API Process Template Tests"
    echo "===================="
    
    # Test POST endpoint with valid data for aibtc-base-dao
    local valid_data='{
        "contractName":"aibtc-base-dao",
        "replacements":{
            "aibtc/dao_token_symbol":"FACES",
            "aibtc-base-dao-trait.aibtc-base-dao":"aibtc-dao-traits-v3.dao-base",
            "aibtc-dao-traits.proposal":"aibtc-dao-traits-v3.proposal",
            "aibtc-dao-traits.extension":"aibtc-dao-traits-v3.extension"
        }
    }'
    
    # Ensure proper URL formatting
    local url
    if [[ "$API_URL" == */ ]]; then
        url="${API_URL}api/generate-contract"
    else
        url="${API_URL}/api/generate-contract"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$valid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Process template endpoint with valid data - Status: $status"
    else
        echo -e "${RED}✗${NC} Process template endpoint with valid data - Expected status 200, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with invalid data (missing name)
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    invalid_data='{"replacements":{"KEY":"value"}}'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$invalid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Process template endpoint with invalid data - Status: $status"
    else
        echo -e "${RED}✗${NC} Process template endpoint with invalid data - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}
