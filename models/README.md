# Models

This directory contains the contract model definitions and abstractions used throughout the platform.

## Purpose

These models provide type-safe representations of the smart contracts, enabling structured interaction with the blockchain contracts and simplifying contract generation and deployment.

## Key Components

- `contract-template.ts` - Base interface for contract templates
- `contract-base.ts` - Abstract base class for all contract types
- Type-specific contract models:
  - `agent-contract.ts` - Agent automation contracts
  - `core-contract.ts` - Core system contracts
  - `dao-base-contract.ts` - Base DAO contracts
  - `dao-extension-contract.ts` - DAO extension contracts
  - `dao-action-contract.ts` - DAO action contracts
  - `dao-proposal-contract.ts` - DAO proposal contracts
  - `dao-token-contract.ts` - Token-related contracts

## Usage

These models are used by the contract generator service to create and deploy contracts with the correct dependencies and configurations.

[Back to main README](/)
