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

- `request-handler.ts` - Functions for processing API requests
- `response-utils.ts` - Standardized response formatting utilities
- `api-error.ts` - Error handling and reporting utilities
- `error-catalog.ts` - Standardized error codes and messages

## Usage

The API is deployed as a Cloudflare Worker and provides endpoints for:

### GET Endpoints
- `/` - API status check
- `/types` - Get all contract types and their subtypes
- `/contracts` - Get all contracts in the registry
- `/names` - Get all contract names
- `/available-names` - Get all available contract names
- `/dao-names` - Get all DAO contract names
- `/by-type/:type` - Get contracts by type
- `/contract/:name` - Get contract by name
- `/by-type-subtype/:type/:subtype` - Get contract by type and subtype
- `/dependencies/:name` - Get contract dependencies

### POST Endpoints
- `/generate-contract` - Generate a contract from template with custom parameters
- `/generate-contract-for-network` - Generate a contract for a specific network
- `/generate-dao-contracts` - Generate all DAO contracts for a network

## Durable Objects Integration

The API integrates with Cloudflare Durable Objects for persistent state management:

- `/sse` - Server-Sent Events endpoint for real-time updates
- `/mcp` - Multi-Contract Protocol endpoint for blockchain interaction

[Back to main README](/)
