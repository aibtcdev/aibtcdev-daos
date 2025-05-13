# Source Code

This directory contains the main application source code for the AIBTC platform API.

## Purpose

The API provides a programmatic interface for interacting with the AIBTC DAO contracts, enabling frontend and backend applications and services to communicate with the blockchain in a structured way.

## Key Components

- `index.ts` - Main entry point for the API
- `api.ts` - API router and endpoint definitions
- `cf-types.ts` - Cloudflare-specific type definitions
- `services/` - Service implementations including contract generation
- `utils/` - API-specific utilities for error handling, request processing, etc.

## Utilities

- `request-helpers.ts` - Functions for parsing and validating API requests
- `response-formatters.ts` - Standardized response formatting utilities
- `error-handlers.ts` - Error handling and reporting utilities
- `cache-helpers.ts` - Utilities for response caching and optimization
- `auth-utils.ts` - Authentication and authorization utilities

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

[Back to main README](/)
