# AIBTC DAO Platform

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/aibtcdev/aibtcdev-daos)

A decentralized autonomous organization (DAO) platform built on the Stacks blockchain.

## Purpose

This platform provides the infrastructure for decentralized governance of the AIBTC ecosystem, enabling token holders to participate in decision-making processes, manage treasury assets, and coordinate community activities through on-chain mechanisms.

## Key Features

- Smart contract-based DAO governance
- On-chain messaging and proposal system
- Treasury management for multiple assets
- Reward distribution mechanisms
- Agent-based automation capabilities
- Multi-Contract Protocol (MCP) integration
- Cloudflare Workers-based API

## Repository Structure

- [/contracts](/contracts) - Smart contracts organized by type (DAO core, extensions, actions, etc.)
- [/durable-objects](/durable-objects) - Cloudflare Durable Objects for persistent state management
- [/models](/models) - Contract model definitions and abstractions
- [/src](/src) - Hosted API implementation and endpoints
- [/tests](/tests) - Test suite for contracts and API functionality
- [/utilities](/utilities) - Reusable helper code and shared utilities for contract generation and management
- [/@aibtc/types](/types) - TypeScript type definitions exported as an npm package

## API Types

TypeScript type definitions for the API are available as a separate npm package:

```bash
npm install @aibtc/types
```

Usage example:

```typescript
import { ApiResponse, ContractInfo } from '@aibtc/types';

async function fetchContract(name: string): Promise<ApiResponse<ContractInfo>> {
  const response = await fetch(`https://api.aibtc.dev/api/contracts/${name}`);
  return response.json();
}
```
