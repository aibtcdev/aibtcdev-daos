# AIBTC DAO API Types

TypeScript type definitions for the AIBTC DAO API. These types are directly imported from the API implementation to ensure perfect compatibility.

## Installation

```bash
npm install @aibtc/types
```

## Usage

```typescript
import { ApiResponse, ContractInfo } from "@aibtc/types";

// Example: Fetch a contract
async function fetchContract(name: string): Promise<ApiResponse<ContractInfo>> {
  const response = await fetch(`https://api.aibtc.dev/api/contracts/${name}`);
  return response.json();
}

// Example: Type checking for API responses
function processContract(data: ContractInfo) {
  console.log(`Contract: ${data.name} (${data.type}/${data.subtype})`);

  if (data.source) {
    console.log(`Contract source hash: ${data.hash}`);
  }
}
```

## Available Types

### Base Types

- `ApiResponse<T>` - Base response wrapper for all API endpoints
- `ErrorCode` - Error codes used in API responses

### Contract Types

- `ContractType` - Types of contracts (BASE, ACTIONS, etc.)
- `ContractSubtype` - Subtypes for each contract type
- `ContractInfo` - Information about a contract
- `DeploymentResult` - Result of contract generation

### Dependencies

- `AddressDependency` - Address dependency for contract templates
- `TraitDependency` - Trait dependency for contract templates
- `ContractDependency` - Contract dependency for contract templates
- `RuntimeValue` - Runtime value for contract templates

### API Response Types

- `ContractsListResponse` - Response for listing all contracts
- `ContractDetailResponse` - Response for a single contract's details
- `ContractDependenciesResponse` - Response for contract dependencies
- `ContractSourceResponse` - Response for contract source code
- `GeneratedContractResponse` - Response for a generated contract

## License

MIT
