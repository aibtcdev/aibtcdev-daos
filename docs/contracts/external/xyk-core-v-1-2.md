# xyk-core-v-1-2 (Bitflow)

**Source:** [`xyk-core-v-1-2.clar`](../../../contracts/dao/trading/xyk-core-v-1-2.clar)

## 1. Overview

This contract is a local copy of Bitflow's `xyk-core-v-1-2` contract, which serves as the core logic for creating and managing Automated Market Maker (AMM) liquidity pools. It is included in this repository to support the `xyk-pool-sbtc-aibtc-v-1-1` pool and to enable a self-contained testing environment.

The primary purpose of this contract is to manage the lifecycle of liquidity pools, including their creation, fee settings, and swaps. For local testing, it includes a `public-pool-creation` flag that can be enabled by an admin to allow any user to create new pools.

---

## 2. Public Functions

- `create-pool`: Creates a new liquidity pool for a pair of SIP-010 tokens.
- `swap-x-for-y`: Swaps a specified amount of token X for token Y.
- `swap-y-for-x`: Swaps a specified amount of token Y for token X.
- `add-liquidity`: Adds liquidity to a pool and receives LP tokens.
- `withdraw-liquidity`: Burns LP tokens to withdraw underlying assets from a pool.
- `set-public-pool-creation`: An admin function to allow or disallow anyone to create a pool.
- `set-fees`: Admin functions to set protocol and provider fees for a pool.

---

## 3. Read-Only Functions

- `get-pool-by-id`: Retrieves details for a specific pool.
- `get-dy`: Calculates the expected output amount of token Y for a given input of token X.
- `get-dx`: Calculates the expected output amount of token X for a given input of token Y.
- `get-dlp`: Calculates the expected amount of LP tokens for a given liquidity deposit.
