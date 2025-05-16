# Utilities

This directory contains reusable helper code and shared utilities used throughout the AIBTC platform.

## Purpose

These utilities provide common functionality needed across different parts of the application, reducing code duplication and ensuring consistent behavior.

## Key Components

- `contract-registry.ts` - Registry for managing contract definitions and lookups
- `contract-types.ts` - Type definitions for contract categories and subtypes
- `contract-deployment-order.ts` - Defines the order for contract deployment
- `contract-error-codes.ts` - Standardized error codes for contracts
- `contract-helpers.ts` - Helper functions for contract operations
- `debug-logging.ts` - Logging utilities with configurable verbosity
- `dao-helpers.ts` - Helper functions for DAO operations
- `known-addresses.ts` - Registry of known blockchain addresses
- `known-traits.ts` - Registry of contract traits
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

These utilities are imported by other parts of the codebase to perform common operations like contract generation, template processing, and type checking.

[Back to main README](/)
