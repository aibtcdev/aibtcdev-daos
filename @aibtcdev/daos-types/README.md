# AIBTC DAO API Types

TypeScript type definitions for the AIBTC DAO API.

## Installation

```bash
npm install @aibtcdev/daos-types
```

## Usage

```typescript
import { ApiResponse, ContractInfo } from '@aibtcdev/daos-types';

// Example: Fetch a contract
async function fetchContract(name: string): Promise<ApiResponse<ContractInfo>> {
  const response = await fetch(`https://api.aibtc.dev/api/contracts/${name}`);
  return response.json();
}

// Example: Type checking for API responses
function processContract(data: ContractInfo) {
  console.log(`Contract: ${data.name} (${data.type}/${data.subtype})`);
  
  if (data.deploymentResult?.success) {
    console.log(`Deployed at: ${data.deploymentResult.address}`);
  }
}
```

## Available Types

- `ApiResponse<T>` - Base response wrapper for all API endpoints
- `ContractInfo` - Information about a contract
- `DeploymentResult` - Result of a contract deployment
- `ContractType` - Types of contracts (BASE, ACTIONS, etc.)
- `ErrorCode` - Error codes used in API responses
- And many more...

## License

MIT
