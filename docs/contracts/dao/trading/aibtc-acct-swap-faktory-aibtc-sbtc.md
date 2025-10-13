# aibtc-acct-swap-faktory-aibtc-sbtc

**Source:** [`aibtc-acct-swap-faktory-aibtc-sbtc.clar`](../../../../contracts/dao/trading/aibtc-acct-swap-faktory-aibtc-sbtc.clar)

## 1. Overview

This contract is a swap adapter designed to be used with an `aibtc-agent-account`. It facilitates trading between the `aibtc` DAO token and `sBTC` on the Faktory DEX. It implements the `aibtc-dao-swap-adapter` trait, allowing an agent account to call it for buying and selling the DAO token.

---

## 2. Traits

### Implemented Traits
- `.aibtc-agent-account-traits.aibtc-dao-swap-adapter`: Defines the standard interface for a swap adapter that can be used by an agent account.

### Used Traits
- `sip010-trait`: The standard interface for fungible tokens.

---

## 3. Called Contracts

- `.aibtc-faktory-dex`: The decentralized exchange contract used to get quotes and execute swaps between `aibtc` and `sBTC`.

---

## 4. Public Functions

- [`buy-dao-token`](#buy-dao-token): Swaps `sBTC` for the `aibtc` DAO token.
- [`sell-dao-token`](#sell-dao-token): Swaps the `aibtc` DAO token for `sBTC`.

---

### `buy-dao-token`
`(buy-dao-token (daoToken <sip010-trait>) (amount uint) (minReceive (optional uint)))`
- **Description:** Converts a specified `amount` of `sBTC` into the `aibtc` DAO token by calling the Faktory DEX. It includes an optional slippage check.
- **Parameters:**
  - `daoToken` (`<sip010-trait>`): The DAO token contract, which must match the one configured in the adapter.
  - `amount` (`uint`): The amount of `sBTC` to spend.
  - `minReceive` (`(optional uint)`): If provided, the transaction will fail if the amount of DAO tokens received is less than this value.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `sell-dao-token`
`(sell-dao-token (daoToken <sip010-trait>) (amount uint) (minReceive (optional uint)))`
- **Description:** Converts a specified `amount` of the `aibtc` DAO token into `sBTC` by calling the Faktory DEX. It includes an optional slippage check.
- **Parameters:**
  - `daoToken` (`<sip010-trait>`): The DAO token contract.
  - `amount` (`uint`): The amount of DAO tokens to sell.
  - `minReceive` (`(optional uint)`): If provided, the transaction will fail if the amount of `sBTC` received is less than this value.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

---

## 5. Read-Only Functions

- [`get-contract-info`](#get-contract-info): Returns configuration information about the adapter.
- [`get-swap-info`](#get-swap-info): Returns statistics on buy and sell operations.

---

### `get-contract-info`
`(get-contract-info)`
- **Returns:** `{daoToken: principal, deployedBurnBlock: uint, deployedStacksBlock: uint, self: principal, swapContract: principal}`.

### `get-swap-info`
`(get-swap-info)`
- **Returns:** `{totalBuys: uint, totalSells: uint, totalSwaps: uint}`.

---

## 7. Constants

- `DAO_TOKEN`: The principal of the `aibtc` DAO token (`.aibtc-faktory`).

---

## 8. Variables

- `totalBuys`: A counter for the total number of successful buy operations.
- `totalSells`: A counter for the total number of successful sell operations.

---

## 10. Errors

- `(err u2200)`: `ERR_INVALID_DAO_TOKEN` - The provided `daoToken` does not match the expected contract.
- `(err u2201)`: `ERR_SWAP_FAILED` - The underlying swap call to the DEX failed.
- `(err u2202)`: `ERR_QUOTE_FAILED` - Failed to retrieve a quote from the DEX.
- `(err u2203)`: `ERR_SLIPPAGE_TOO_HIGH` - The amount of tokens received was less than the `minReceive` value.
