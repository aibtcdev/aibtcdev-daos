# Models

This directory contains the contract model definitions and abstractions used throughout the platform.

## Purpose

These models provide type-safe representations of the smart contracts, enabling structured interaction with the blockchain contracts and simplifying contract generation and deployment.

## Key Components

- `contract-template.ts` - Base interface for contract templates and deployment results
- `contract-base.ts` - Abstract base class for all contract types

Type-specific contract models:

- `agent-contract.ts` - Agent automation contracts
- `dao-base-contract.ts` - Base DAO contracts
- `dao-extension-contract.ts` - DAO extension contracts
- `dao-action-contract.ts` - DAO action contracts
- `dao-proposal-contract.ts` - DAO proposal contracts
- `dao-token-contract.ts` - Token-related contracts

## Contract Model Structure

Each contract model extends the `ContractBase` class and provides:
- Type information (contract type and subtype)
- Deployment order information
- Template path generation
- Source code and hash tracking
- Deployment result storage

## Usage

These models are used by:
1. The contract registry to organize and look up contracts
2. The contract generator service to generate contracts with the correct dependencies
3. The API to provide contract information to clients

[Back to main README](/)
