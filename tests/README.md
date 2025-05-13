# Tests

This directory contains the test suite for both the smart contracts and the API implementation.

## Purpose

These tests ensure the correct functionality of the AIBTC platform components, including contract logic, API endpoints, and utility functions.

## Structure

- `/contracts` - Tests for smart contracts, organized to mirror the contract directory structure
- `/endpoints` - Tests for API endpoints
- `/utilities` - Tests for utility functions

## Key Test Files

- Contract tests validate core functionality like voting, treasury operations, and token management
- Endpoint tests verify API behavior and response formats
- Utility tests check helper functions and shared code

## Running Tests

Contract tests can be run using Clarinet:
```bash
clarinet test
```

API endpoint tests can be run using the test scripts:
```bash
./tests/endpoints/run-endpoint-tests.sh
```

[Back to main README](/)
