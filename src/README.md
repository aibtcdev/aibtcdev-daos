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

- Contract information retrieval
- Contract generation with custom parameters
- Dependency analysis
- Type and subtype information

[Back to main README](/)
