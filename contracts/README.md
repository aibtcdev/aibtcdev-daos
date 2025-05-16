# Contracts

This directory contains all the smart contracts for the AIBTC DAO platform, organized by type.

## Purpose

These Clarity smart contracts implement the core functionality of the DAO, including governance mechanisms, token management, treasury operations, and agent automation.

## Structure

- [/agent](/contracts/agent) - Agent automation contracts for user custody + autonomous operations
  - `aibtc-agent-account.clar` - Agent account management
- [/dao](/contracts/dao) - Main DAO functionality
  - [/actions](/contracts/dao/actions) - Action contracts that implement specific DAO operations
    - `aibtc-action-send-message.clar` - Message sending action
  - [/extensions](/contracts/dao/extensions) - Extension contracts that add functionality to the base DAO
    - `aibtc-action-proposal-voting.clar` - Governance voting mechanisms
    - `aibtc-dao-charter.clar` - DAO charter management
    - `aibtc-dao-epoch.clar` - Epoch-based timing
    - `aibtc-dao-users.clar` - User management
    - `aibtc-onchain-messaging.clar` - Messaging system
    - `aibtc-rewards-account.clar` - Reward distribution
    - `aibtc-token-owner.clar` - Token ownership management
    - `aibtc-treasury.clar` - Treasury and asset management
  - [/proposals](/contracts/dao/proposals) - Proposal contracts for governance decisions
    - `aibtc-base-initialize-dao.clar` - DAO initialization
  - [/token](/contracts/dao/token) - Token-related contracts including DEX functionality
    - `aibtc-faktory.clar` - DAO token
    - `aibtc-faktory-dex.clar` - DEX for token trading
    - `aibtc-pre-faktory.clar` - Pre-launch token functionality
    - `xyk-pool-sbtc-aibtc-v-1-1.clar` - Liquidity pool
- [/traits](/contracts/traits) - Trait definitions used across contracts

## Contract Types

The contracts are organized according to the types defined in `utilities/contract-types.ts`:
- `AGENT` - Agent automation contracts
- `BASE` - Core DAO contracts like `aibtc-base-dao.clar`
- `ACTIONS` - Action proposal contracts
- `EXTENSIONS` - DAO extension contracts
- `PROPOSALS` - Proposal management contracts
- `TOKEN` - Token and DEX-related contracts

## Error Handling

Contracts use standardized error codes defined in `utilities/contract-error-codes.ts` for consistent error reporting across the platform.

[Back to main README](/)
