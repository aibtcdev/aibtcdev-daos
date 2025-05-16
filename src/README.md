# Source Code

This directory contains the main application source code for the AIBTC platform API.

## Purpose

The API provides a programmatic interface for interacting with the AIBTC DAO contracts, enabling frontend and backend applications and services to communicate with the blockchain in a structured way.

## Key Components

- `index.ts` - Main entry point for the API and Cloudflare Worker
- `api.ts` - API router and endpoint definitions
- `cf-types.ts` - Cloudflare-specific type definitions
- `services/` - Service implementations including contract generation
- `utils/` - API-specific utilities for error handling, request processing, etc.

## Utilities

- `request-handler.ts` - Functions for processing API requests with standardized error handling
- `response-utils.ts` - Standardized response formatting utilities and CORS support
- `api-error.ts` - Error handling and reporting with unique error IDs
- `error-catalog.ts` - Standardized error codes, messages, and HTTP status codes

## API Endpoints

The API is deployed as a Cloudflare Worker and provides the following endpoints:

### GET Endpoints

- `/api` - API status check
- `/api/types` - Get all contract types and their subtypes
- `/api/contracts` - Get all contracts in the registry
- `/api/names` - Get all contract names
- `/api/available-names` - Get all available contract names
- `/api/dao-names` - Get all DAO contract names
- `/api/by-type/:type` - Get contracts by type
- `/api/contract/:name` - Get contract by name
- `/api/by-type-subtype/:type/:subtype` - Get contract by type and subtype
- `/api/dependencies/:name` - Get contract dependencies

### POST Endpoints

- `/api/generate-contract` - Generate a contract from template with custom parameters
- `/api/generate-contract-for-network` - Generate a contract for a specific network
- `/api/generate-dao-contracts` - Generate all DAO contracts for a network

## Durable Objects Integration

The API integrates with Cloudflare Durable Objects for persistent state management:

- `/sse` - Server-Sent Events endpoint for real-time updates
- `/mcp` - Multi-Contract Protocol endpoint for blockchain interaction

## Response Format

All API responses follow a standardized format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    id: string;
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

## Error Handling

The API uses a standardized error handling system with unique error IDs for tracking and debugging. Error codes are defined in `error-catalog.ts` and provide consistent HTTP status codes and error messages.

[Back to main README](/README.md)
