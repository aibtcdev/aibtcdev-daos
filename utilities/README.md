# Utilities

This directory contains reusable helper code and shared utilities used throughout the AIBTC platform.

## Purpose

These utilities provide common functionality needed across different parts of the application, reducing code duplication and ensuring consistent behavior.

## Key Components

- `asset-helpers.ts` - Utilities for working with blockchain assets and balances
- `contract-dependencies.ts` - Defines dependencies between contracts
- `contract-deployment-order.ts` - Defines the order for contract deployment
- `contract-error-codes.ts` - Standardized error codes for contracts (organized by contract type with unique ranges)
- `contract-helpers.ts` - Helper functions for contract operations
- `contract-registry.ts` - Registry for managing contract definitions and lookups
- `contract-types.ts` - Type definitions for contract categories and subtypes
- `dao-helpers.ts` - Helper functions for DAO operations
- `debug-logging.ts` - Logging utilities with configurable verbosity
- `known-addresses.ts` - Registry of known blockchain addresses
- `known-traits.ts` - Registry of contract traits
- `simnet.ts` - Simnet initialization for testing
- `template-processor.ts` - Processes contract templates with variable replacements
- `template-scanner.ts` - Scans contract templates to extract variables
- `template-variables.ts` - Template variable management for contract generation

## Contract Types

The platform organizes contracts into the following types:

- `AGENT` - Agent automation contracts
- `BASE` - Core DAO contracts
- `ACTIONS` - Action proposal contracts
- `EXTENSIONS` - DAO extension contracts
- `PROPOSALS` - Proposal management contracts
- `TOKEN` - Token and DEX-related contracts

Each type has specific subtypes as defined in `contract-types.ts`.

## Usage

These utilities are imported by other parts of the codebase to perform common operations like:

- Contract generation and template processing
- Dependency management between contracts
- Asset and balance tracking
- Testing and simulation
- Type checking and validation

[Back to main README](/)
