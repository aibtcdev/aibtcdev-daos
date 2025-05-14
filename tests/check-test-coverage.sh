#!/bin/bash

# Exit on any error
set -e

echo "🔍 Checking test file coverage for Clarity contracts..."
echo "======================================================="

# Initialize counters
total_contracts=0
untested_contracts=0

# Function to convert contract path to expected test path
get_test_path() {
    local contract_path=$1
    # Remove 'contracts/' prefix and replace with 'tests/contracts/'
    # Replace .clar with .test.ts
    echo "${contract_path/contracts\//tests/contracts\/}" | sed 's/\.clar$/.test.ts/'
}

# Debug: Print current directory
echo "Running from directory: $(pwd)"
echo "Looking for .clar files..."

# Find all Clarity contracts and store in array
contracts=()
echo "Finding Clarity contracts..."
echo "Excluding test contracts and DAO traits..."
while IFS= read -r contract; do
    contracts+=("$contract")
done < <(find contracts -name "*.clar" -not -path "contracts/test/*" -not -path "contracts/dao/traits/*")

echo "Found ${#contracts[@]} contract files"

# Check if any contracts were found
if [ ${#contracts[@]} -eq 0 ]; then
    echo "❌ No .clar files found in the contracts directory!"
    echo "   Please make sure you're running this script from the project root."
    exit 1
fi

# Process each contract
echo -e "\nChecking test file coverage..."
echo "==================================="
for contract in "${contracts[@]}"; do
    # band-aid to skip trait file in diff location
    if [[ "$contract" == *"traits"* ]]; then
        echo "⏩ Skipping trait file: $contract"
        continue
    fi

    let "total_contracts=total_contracts+1"
    test_file=$(get_test_path "$contract")
    
    if [ ! -f "$test_file" ]; then
        echo "❌ Missing test file for: $contract"
        echo "   Expected test file at: $test_file"
        let "untested_contracts=untested_contracts+1"
    else
        echo "✅ Found test file for: $contract"
    fi
done

# Print summary
echo ""
echo "📊 Summary"
echo "=========="
echo "Total contracts found: $total_contracts"
echo "Contracts with test files: $(($total_contracts - $untested_contracts))"
echo "Contracts without test files: $untested_contracts"
echo ""

if [ $untested_contracts -eq 0 ]; then
    ./tests/chadsay.sh "All $total_contracts contracts have test files. Good job."
    exit 0
else
    echo "❌ Action needed: $untested_contracts contract(s) are missing test files."
    exit 1
fi
