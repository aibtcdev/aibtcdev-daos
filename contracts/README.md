# Contracts

This directory contains all the smart contracts for the AIBTC DAO platform, organized by type.

## Purpose

These Clarity smart contracts implement the core functionality of the DAO, including governance mechanisms, token management, treasury operations, and agent automation.

## Structure

- [/agent](/contracts/agent) - Agent automation contracts for user custody + autonomous operations
  - `aibtc-agent-account.clar` - Agent account management for automated operations
- [/core](/contracts/core) - Core system contracts that handle fundamental operations
  - `aibtc-dao-run-cost.clar` - Manages fees for AIBTC services
- [/dao](/contracts/dao) - Main DAO functionality
  - `aibtc-base-dao.clar` - The foundational DAO contract
  - [/actions](/contracts/dao/actions) - Action contracts that implement specific DAO operations
    - `aibtc-action-send-message.clar` - Message sending action
  - [/extensions](/contracts/dao/extensions) - Extension contracts that add functionality to the base DAO
    - `aibtc-action-proposal-voting.clar` - Governance voting mechanisms
    - `aibtc-dao-charter.clar` - DAO charter management
    - `aibtc-dao-epoch.clar` - Epoch-based timing
    - `aibtc-onchain-messaging.clar` - On-chain messaging system
    - `aibtc-token-owner.clar` - Token ownership management
    - `aibtc-treasury.clar` - Treasury and asset management
  - [/proposals](/contracts/dao/proposals) - Proposal contracts for governance decisions
    - `aibtc-base-initialize-dao.clar` - DAO initialization proposal
  - [/token](/contracts/dao/token) - Token-related contracts including DEX functionality
    - `aibtc-faktory.clar` - DAO token implementation
    - `aibtc-faktory-dex.clar` - DEX for token trading
    - `aibtc-pre-faktory.clar` - Pre-launch token functionality and seat allocation
    - `xyk-pool-sbtc-aibtc-v-1-1.clar` - Liquidity pool for sBTC/AIBTC
- [/traits](/contracts/traits) - Trait definitions used across contracts
  - `aibtc-agent-account-traits.clar` - Traits for agent accounts
  - `aibtc-base-dao-trait.clar` - Base DAO trait definition
  - `aibtc-dao-traits.clar` - Core DAO traits for extensions and functionality

## Contract Types

The contracts are organized according to the types defined in `utilities/contract-types.ts`:

- `AGENT` - Agent automation contracts for user custody and autonomous operations
- `BASE` - Core DAO contracts that handle fundamental operations
- `ACTIONS` - Action proposal contracts that implement specific operations
- `EXTENSIONS` - DAO extension contracts that add functionality to the base DAO
- `PROPOSALS` - Proposal management contracts for governance decisions
- `TOKEN` - Token and DEX-related contracts for the DAO token ecosystem

## Template Variables

Many contracts use template variables in the format `;; /g/variable/replacement` which are processed during contract generation. These variables allow for customization of contract addresses, names, and other parameters when deploying to different networks.

## Error Handling

Contracts use standardized error codes for consistent error reporting across the platform. Each contract defines its own error constants with unique codes to ensure clear identification of issues.

[Back to main README](/)
