#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_generate_agent_account() {
    echo "===================="
    echo "API Generate Agent Account Tests"
    echo "===================="
    
    # Test POST endpoint with valid data
    local valid_data='{
        "name":"aibtc-acct-ST1PQ-PGZGM-ST2CY-RK9AG",
        "network":"devnet",
        "tokenSymbol":"AIBTC",
        "customReplacements": {
            "account_owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            "account_agent": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
            "dao_contract_token": "ST000000000000000000002AMW42H.aibtc-token",
            "dao_contract_token_dex": "ST000000000000000000002AMW42H.aibtc-faktory-dex"
        }
    }'
    
    # Ensure proper URL formatting
    local url
    if [[ "$API_URL" == */ ]]; then
        url="${API_URL}api/generate-agent-account"
    else
        url="${API_URL}/api/generate-agent-account"
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$valid_data" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Generate agent account endpoint with valid data - Status: $status"
        
        # Extract the JSON body
        body=$(echo "$response" | awk -v RS='' '{ print $0 }' | sed '1,/^\r$/d' | head -n -1)
        
        # If that didn't work, try another approach
        if [ -z "$body" ]; then
            body=$(echo "$response" | sed -n '/^{/,$p' | head -n -1)
        fi
        
        # Check if the response is valid JSON
        if ! echo "$body" | jq empty >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response is not valid JSON"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        
        # Check if the response contains the expected structure
        if ! echo "$body" | jq -e '.success' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response does not contain success field"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        
        # Check for data field
        if ! echo "$body" | jq -e '.data' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response does not contain data field"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        
        # Check for contract field
        if ! echo "$body" | jq -e '.data.contract' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Response does not contain contract field"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        
        # Check if the contract has a source field
        if ! echo "$body" | jq -e '.data.contract.source' >/dev/null 2>&1; then
            echo -e "${RED}✗${NC} Contract does not contain source field"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        fi
        
        echo -e "  ${GREEN}✓${NC} Successfully processed the response"
    else
        echo -e "${RED}✗${NC} Generate agent account endpoint with valid data - Expected status 200, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with missing account_owner
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local missing_owner='{
        "name":"aibtc-agent-account",
        "network":"devnet",
        "tokenSymbol":"AIBTC",
        "customReplacements": {
            "account_agent": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
            "dao_contract_token": "ST000000000000000000002AMW42H.aibtc-token",
            "dao_contract_token_dex": "ST000000000000000000002AMW42H.aibtc-faktory-dex"
        }
    }'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$missing_owner" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Generate agent account endpoint with missing account_owner - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate agent account endpoint with missing account_owner - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with missing account_agent
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local missing_agent='{
        "name":"aibtc-agent-account",
        "network":"devnet",
        "tokenSymbol":"AIBTC",
        "customReplacements": {
            "account_owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
            "dao_contract_token": "ST000000000000000000002AMW42H.aibtc-token",
            "dao_contract_token_dex": "ST000000000000000000002AMW42H.aibtc-faktory-dex"
        }
    }'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$missing_agent" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Generate agent account endpoint with missing account_agent - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate agent account endpoint with missing account_agent - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test with invalid network
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local invalid_network='{
        "name":"aibtc-agent-account",
        "network":"invalid-network",
        "tokenSymbol":"AIBTC",
        "account_owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        "account_agent": "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    }'
    
    response=$(curl -s -i -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$invalid_network" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 400 ]; then
        echo -e "${GREEN}✓${NC} Generate agent account endpoint with invalid network - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate agent account endpoint with invalid network - Expected status 400, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Test CORS support
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -w "\n%{http_code}" -X OPTIONS \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: POST" \
        "$url")
    
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Generate agent account endpoint CORS preflight - Status: $status"
    else
        echo -e "${RED}✗${NC} Generate agent account endpoint CORS preflight - Expected status 200, got $status"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}
