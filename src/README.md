# Source Code

This directory contains the main application source code for the AIBTC platform API.

## Purpose

The API provides a programmatic interface for interacting with the AIBTC DAO contracts, enabling frontend applications and services to communicate with the blockchain in a structured way.

## Key Components

- `index.ts` - Main entry point for the API
- `api.ts` - API router and endpoint definitions
- `cf-types.ts` - Cloudflare-specific type definitions
- `services/` - Service implementations including contract generation
- `utils/` - API-specific utilities for error handling, request processing, etc.

## Usage

The API is deployed as a Cloudflare Worker and provides endpoints for:
- Contract information retrieval
- Contract generation with custom parameters
- Dependency analysis
- Type and subtype information

[Back to main README](/)
