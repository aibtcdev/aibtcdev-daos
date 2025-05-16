# Tests

This directory contains the test suite for both the smart contracts and the API implementation.

## Purpose

These tests ensure the correct functionality of the AIBTC platform components, including contract logic, API endpoints, and utility functions.

## Structure

- `/contracts` - Clarinet SDK Tests for smart contracts, mirrors contract directory structure
  - `/agent` - Tests for agent automation contracts
  - `/dao` - Tests for DAO contracts
    - `/actions` - Tests for action contracts
    - `/extensions` - Tests for extension contracts
    - `/proposals` - Tests for proposal contracts
    - `/token` - Tests for token and DEX contracts

## Key Test Files

- Contract tests validate core functionality like voting, treasury operations, and token management
- Utility tests check helper functions and shared code

## Test Utilities

The tests use several utility functions from the main `/utilities` directory:
- `dao-helpers.ts` - Helper functions for DAO operations in tests
- `debug-logging.ts` - Logging utilities for test output
- `contract-registry.ts` - Contract registry for test setup

## Running Tests

All tests can be run using the npm scripts defined in package.json:

```bash
npm run test
npm run test:report  # Generates coverage report
npm run test:watch   # Watches for changes and runs tests
```

To run a specific test file:

```bash
npm run test tests/contracts/dao/token/aibtc-faktory-dex.test.ts
```

The test environment uses Clarinet's simnet for blockchain simulation.

[Back to main README](/)
