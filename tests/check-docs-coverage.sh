#!/bin/bash

# Exit on any error
set -e

echo "🔍 Checking documentation file coverage for Clarity contracts..."
echo "=============================================================="

# Initialize counters
total_contracts=0
undocumented_contracts=0

# Function to convert contract path to expected documentation path
get_doc_path() {
    local contract_path=$1
    # Replace 'contracts/' with 'docs/contracts/' and '.clar' with '.md'
    local doc_path_base="${contract_path/contracts\//docs\/contracts\/}"
    echo "${doc_path_base%.clar}.md"
}

# Find all Clarity contracts and store in an array
contracts=()
while IFS= read -r contract; do
    contracts+=("$contract")
done < <(find contracts -name "*.clar")

echo "Found ${#contracts[@]} contract files to check."

# Check if any contracts were found
if [ ${#contracts[@]} -eq 0 ]; then
    echo "❌ No .clar files found in the contracts directory!"
    echo "   Please make sure you're running this script from the project root."
    exit 1
fi

# Process each contract
echo -e "\nChecking documentation file coverage..."
echo "======================================="
for contract in "${contracts[@]}"; do
    # Skip external contracts that we don't need to document
    if [[ "$contract" == *"xyk-core-v-1-2"* ]]; then
        echo "⏩ Skipping external contract: $contract"
        continue
    fi

    let "total_contracts=total_contracts+1"
    doc_path=$(get_doc_path "$contract")
    
    if [ -f "$doc_path" ]; then
        echo "✅ Found documentation for: $contract"
    else
        echo "❌ Missing documentation for: $contract"
        echo "   Expected to find: $doc_path"
        let "undocumented_contracts=undocumented_contracts+1"
    fi
done

# Print summary
echo ""
echo "📊 Summary"
echo "=========="
echo "Total contracts checked: $total_contracts"
echo "Contracts with documentation: $(($total_contracts - $undocumented_contracts))"
echo "Contracts without documentation: $undocumented_contracts"
echo ""

if [ $undocumented_contracts -eq 0 ]; then
    echo "✅ All $total_contracts contracts have documentation files. Great job!"
    exit 0
else
    echo "❌ Action needed: $undocumented_contracts contract(s) are missing documentation files."
    exit 1
fi
