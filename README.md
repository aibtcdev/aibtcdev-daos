# AIBTC DAO Platform

A decentralized autonomous organization (DAO) platform built on the Stacks blockchain.

## Purpose

This platform provides the infrastructure for decentralized governance of the AIBTC ecosystem, enabling token holders to participate in decision-making processes, manage treasury assets, and coordinate community activities through on-chain mechanisms.

## Key Features

- Smart contract-based DAO governance
- On-chain messaging and proposal system
- Treasury management for multiple assets
- Reward distribution mechanisms
- Agent-based automation capabilities
- MCP and API for contract interaction

## Repository Structure

- [/contracts](/contracts) - Smart contracts organized by type (DAO core, extensions, actions, etc.)
- [/durable-objects](/durable-objects) - Cloudflare Durable Objects for Remote MCP
- [/models](/models) - Contract model definitions and abstractions
- [/src](/src) - Hosted API implementation and endpoints
- [/tests](/tests) - Test suite for contracts and API functionality
- [/utilities](/utilities) - Reusable helper code and shared utilities

## API Types

TypeScript type definitions for the API are available as a separate npm package:

```bash
npm install @aibtcdev/daos-types
```

Usage example:

```typescript
import { ApiResponse, ContractInfo } from '@aibtcdev/daos-types';

async function fetchContract(name: string): Promise<ApiResponse<ContractInfo>> {
  const response = await fetch(`https://api.aibtc.dev/api/contracts/${name}`);
  return response.json();
}
```
