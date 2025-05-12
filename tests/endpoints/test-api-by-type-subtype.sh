#!/bin/bash

source "$(dirname "$0")/utils.sh"

test_api_by_type_subtype() {
    echo "===================="
    echo "API By Type/Subtype Tests"
    echo "===================="
    # Test with valid type/subtype
    test_cors "/api/by-type-subtype/BASE/DAO_CORE" "By type/subtype endpoint CORS"
    test_endpoint "/api/by-type-subtype/BASE/DAO_CORE" 200 "By type/subtype endpoint with valid values"
    
    # Test with invalid type
    test_endpoint "/api/by-type-subtype/INVALID/DAO_CORE" 400 "By type/subtype endpoint with invalid type"
    
    # Test with invalid subtype
    test_endpoint "/api/by-type-subtype/BASE/INVALID" 404 "By type/subtype endpoint with invalid subtype"
}
