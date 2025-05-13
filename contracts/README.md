# Contracts

This directory contains all the smart contracts for the AIBTC DAO platform, organized by type.

## Purpose

These Clarity smart contracts implement the core functionality of the DAO, including governance mechanisms, token management, treasury operations, and agent automation.

## Structure

- [/agent](/contracts/agent) - Agent automation contracts for autonomous operations
- [/core](/contracts/core) - Core system contracts that handle fundamental operations
- [/dao](/contracts/dao) - Main DAO functionality
  - [/actions](/contracts/dao/actions) - Action contracts that implement specific DAO operations
  - [/extensions](/contracts/dao/extensions) - Extension contracts that add functionality to the base DAO
  - [/proposals](/contracts/dao/proposals) - Proposal contracts for governance decisions
  - [/token](/contracts/dao/token) - Token-related contracts including DEX functionality
- [/traits](/contracts/traits) - Trait definitions used across contracts

## Key Contracts

- `aibtc-base-dao.clar` - The foundational DAO contract
- `aibtc-dao-users.clar` - User management and permissions
- `aibtc-treasury.clar` - Treasury and asset management
- `aibtc-action-proposal-voting.clar` - Governance voting mechanisms

[Back to main README](/)
