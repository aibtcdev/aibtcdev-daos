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

### Error Codes

The platform uses standardized error codes organized by contract type:

- `ErrCodeProtocolFeesAccount` - Error codes for protocol fees (1000-1099)
- `ErrCodeAgentAccount` - Error codes for agent accounts (1100-1199)
- `ErrCodeBaseDao` - Error codes for base DAO operations (1200-1299)
- `ErrCodeActionProposalVoting` - Error codes for proposal voting (1300-1399)
- `ErrCodeDaoCharter` - Error codes for DAO charter operations (1400-1499)
- `ErrCodeDaoUsers` - Error codes for DAO user management (1500-1599)
- `ErrCodeOnchainMessaging` - Error codes for messaging (1600-1699)
- `ErrCodeRewardsAccount` - Error codes for rewards (1700-1799)
- `ErrCodeTokenOwner` - Error codes for token ownership (1800-1899)
- `ErrCodeTreasury` - Error codes for treasury operations (1900-1999)
- `ErrCodeActionSendMessage` - Error codes for message actions (2000-2099)

### Contract Types

- `ContractType` - Types of contracts (BASE, ACTIONS, etc.)
- `ContractSubtype` - Subtypes for each contract type
- `ContractInfo` - Information about a contract

### Dependencies

- `AddressDependency` - Address dependency for contract templates
- `TraitDependency` - Trait dependency for contract templates
- `ContractDependency` - Contract dependency for contract templates
- `RuntimeValue` - Runtime value for contract templates

### API Response Types

- `ContractsListResponse` - Response for listing all contracts
- `ContractDetailResponse` - Response for a single contract's details
- `ContractDependenciesResponse` - Response for contract dependencies

## License

MIT
