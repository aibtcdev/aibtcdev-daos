# Tests

This directory contains the comprehensive test suite for both the smart contracts and the API implementation.

## Purpose

These tests ensure the correct functionality of the AIBTC platform components, including:
- Smart contract logic and interactions
- API endpoints and responses
- Utility functions and shared code
- Contract template processing

## Structure

- `/contracts` - Clarinet SDK Tests for smart contracts, mirrors contract directory structure
  - `/agent` - Tests for agent automation contracts
  - `/dao` - Tests for DAO contracts
    - `/actions` - Tests for action contracts
    - `/extensions` - Tests for extension contracts
    - `/proposals` - Tests for proposal contracts
    - `/token` - Tests for token and DEX contracts
  - `/core` - Tests for core platform contracts
- `/endpoints` - Tests for API endpoints
  - Shell scripts for testing HTTP endpoints
  - Utility functions for API testing
- `/utilities` - Tests for utility functions
  - Template processing
  - Contract dependencies
  - Contract registry

## Key Test Files

- `check-test-coverage.sh` - Script to verify test coverage for all contracts
- `check-endpoints.sh` - Script to test all API endpoints
- Contract tests validate core functionality like voting, treasury operations, and token management
- Endpoint tests verify API responses and error handling
- Utility tests check helper functions and shared code

## Test Utilities

The tests use several utility functions from the main `/utilities` directory:
- `dao-helpers.ts` - Helper functions for DAO operations in tests
- `debug-logging.ts` - Logging utilities for test output
- `contract-registry.ts` - Contract registry for test setup
- `asset-helpers.ts` - Functions for managing assets in tests
- `contract-helpers.ts` - Shared contract utility functions

## Running Tests

All tests can be run using the npm scripts defined in package.json:

```bash
npm run test                # Run all tests
npm run test:report         # Generate coverage report
npm run test:watch          # Watch for changes and run tests
npm run test:check-coverage # Check if all contracts have tests
npm run test:endpoints      # Run API endpoint tests
```

To run a specific test file:

```bash
npm run test tests/contracts/dao/token/aibtc-faktory-dex.test.ts
```

To check if all contracts have corresponding test files:

```bash
./tests/check-test-coverage.sh
```

To test API endpoints:

```bash
./tests/check-endpoints.sh http://localhost:8787
```

The test environment uses Clarinet's simnet for blockchain simulation and shell scripts for API testing.

[Back to main README](/)
