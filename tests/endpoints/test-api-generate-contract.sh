#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_process_template() {
    echo "===================="
    echo "API Generate Contract Tests"
    echo "===================="
    
    # Test POST endpoint with valid data for aibtc-base-dao
    local valid_data='{
        "name":"aibtc-base-dao",
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
        echo -e "${GREEN}✓${NC} Generate contract endpoint with valid data - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate contract endpoint with valid data - Expected status 200, got $status"
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
        echo -e "${GREEN}✓${NC} Generate contract endpoint with invalid data - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate contract endpoint with invalid data - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test generate contract for network
    test_api_generate_contract_for_network
    
    # Test generate all DAO contracts
    test_api_generate_dao_contracts
}

test_api_generate_contract_for_network() {
    echo "===================="
    echo "API Generate Contract For Network Tests"
    echo "===================="
    
    # Test POST endpoint with valid data
    local valid_data='{
        "name":"aibtc-base-dao",
        "network":"devnet",
        "tokenSymbol":"TEST",
        "customReplacements":{
            "dao_manifest":"Test DAO created via API"
        }
    }'
    
    # Ensure proper URL formatting
    local url
    if [[ "$API_URL" == */ ]]; then
        url="${API_URL}api/generate-contract-for-network"
    else
        url="${API_URL}/api/generate-contract-for-network"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$valid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Generate contract for network endpoint with valid data - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate contract for network endpoint with valid data - Expected status 200, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with invalid network
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    invalid_data='{
        "name":"aibtc-base-dao",
        "network":"invalid-network"
    }'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$invalid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Generate contract for network endpoint with invalid network - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate contract for network endpoint with invalid network - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

test_api_generate_dao_contracts() {
    echo "===================="
    echo "API Generate All DAO Contracts Tests"
    echo "===================="
    
    # Test POST endpoint with valid data
    local valid_data='{
        "network":"devnet",
        "tokenSymbol":"DAOTST",
        "customReplacements":{
            "dao_manifest":"Test DAO with all contracts generated at once"
        }
    }'
    
    # Ensure proper URL formatting
    local url
    if [[ "$API_URL" == */ ]]; then
        url="${API_URL}api/generate-dao-contracts"
    else
        url="${API_URL}/api/generate-dao-contracts"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$valid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)

    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Generate all DAO contracts endpoint with valid data - Status: $status"
        
        # Check if the response contains contracts array
        body=$(echo "$response" | awk 'BEGIN{RS="\r\n\r\n"} NR==2')

        # Check if the response is valid JSON
        if ! echo "$body" | jq empty >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response is not valid JSON"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        echo "Current response body:"
        echo "$body" | jq -e '.success'
        echo "$body" | jq -e '.data'
        echo "$body" | jq -e '.data.contracts'
        # Check if the response contains the expected keys
        if ! echo "$body" | jq -e '.success, .data.contracts' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response does not contain expected keys"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        # Check if the contracts array is not empty
        if ! echo "$body" | jq -e '.data.contracts | length > 0' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Contracts array is empty"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        # Check if the contracts array contains valid contract objects
        if ! echo "$body" | jq -e '.data.contracts[] | select(.name and .content)' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Contracts array does not contain valid contract objects"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        # Check if the contracts array contains errors
        if echo "$body" | jq -e '.data.contracts[] | select(.content | contains("ERROR:"))' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Contracts array contains errors"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        # Successfully parsed the response
        echo -e "${GREEN}✓${NC} Response contains at least one valid generated contract"
    else
        echo -e "${RED}✗${NC} Generate all DAO contracts endpoint with valid data - Expected status 200, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with invalid network
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    invalid_data='{
        "network":"invalid-network",
        "tokenSymbol":"TEST"
    }'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$invalid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Generate all DAO contracts endpoint with invalid network - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate all DAO contracts endpoint with invalid network - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}
