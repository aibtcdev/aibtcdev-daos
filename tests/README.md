# Tests

This directory contains the test suite for both the smart contracts and the API implementation.

## Purpose

These tests ensure the correct functionality of the AIBTC platform components, including contract logic, API endpoints, and utility functions.

## Structure

- `/contracts` - Clarinet SDK Tests for smart contracts, mirrors contract directory structure
- `/endpoints` - Tests for API endpoints
- `/utilities` - Tests for utility functions

## Key Test Files

- Contract tests validate core functionality like voting, treasury operations, and token management
- Endpoint tests verify API behavior and response formats
- Utility tests check helper functions and shared code

## Running Tests

All tests can be run using `npm`, or specific test file(s) can be provided:

```bash
npm run test
npm run test tests/contracts/dao/aibtc-base-dao.test.ts
```

All Clarity contract files should have a corresponding test file, checked by this script:

```bash
bash ./tests/check-test-coverage.sh
```

API endpoint tests can be run using the test scripts, with an optional URL and flag to disable the 10s delay:

```bash
bash ./tests/check-endpoints.sh
bash ./tests/check-endpoints.sh https://aibtcdev-daos-preview.hosting-962.workers.dev/ true
```

[Back to main README](/)
