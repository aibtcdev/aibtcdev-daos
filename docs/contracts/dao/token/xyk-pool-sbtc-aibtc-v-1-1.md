# xyk-pool-sbtc-aibtc-v-1-1

**Source:** [`xyk-pool-sbtc-aibtc-v-1-1.clar`](../../../../contracts/dao/token/xyk-pool-sbtc-aibtc-v-1-1.clar)

## 1. Overview

This contract is a specific instance of a Bitflow-compatible XYK (constant product `x * y = k`) automated market maker (AMM) pool. It is designed to hold liquidity for the sBTC and aibtc (`.aibtc-faktory`) token pair. The contract itself does not contain the core swapping logic; instead, it acts as a vault for the tokens and is managed by an external core contract (`.xyk-core-v-1-2`). It also implements the SIP-010 trait for its own fungible pool token, which represents a share of the liquidity in the pool.

---

## 2. Traits

### Implemented Traits
- `'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.xyk-pool-trait-v-1-2.xyk-pool-trait`: The standard interface for a Bitflow AMM pool, allowing the core contract to manage it.
- `.aibtc-dao-traits.bitflow-pool`: A custom DAO trait for Bitflow pools.

### Used Traits
- `sip-010-trait`: A trait constraint used in `pool-transfer` to ensure the tokens being moved are SIP-010 compliant.

---

## 3. Called Contracts

This contract only makes calls to other token contracts via the `sip-010-trait` interface when directed by the `CORE_ADDRESS`.
- `(as-contract (contract-call? token-trait transfer ...))`: Called within `pool-transfer` to move either the X or Y token out of the pool.

---

## 4. Public Functions

The majority of public functions are designed to be called only by the `CORE_ADDRESS`.

### SIP-010 Functions (for Pool Token)
- `get-name`, `get-symbol`, `get-decimals`, `get-token-uri`, `get-total-supply`, `get-balance`, `transfer`: Standard SIP-010 functions that manage the pool's own liquidity provider (LP) token. The `transfer` function allows LP token holders to trade their shares.

### Core-Managed Functions
- [`create-pool`](#create-pool): Initializes the pool's parameters.
- [`pool-mint`](#pool-mint): Mints new LP tokens to a provider.
- [`pool-burn`](#pool-burn): Burns LP tokens from a provider.
- [`pool-transfer`](#pool-transfer): Transfers one of the underlying assets (X or Y token) out of the pool.
- `set-pool-uri`, `set-pool-status`, `set-fee-address`, `set-x-fees`, `set-y-fees`, `update-pool-balances`: Various functions to update the pool's configuration and state.

---

### `create-pool`

`(create-pool (x-token-contract principal) (y-token-contract principal) ...)`

**Description:**
This function is called once by the `CORE_ADDRESS` (invoked by the `CONTRACT_DEPLOYER`) to initialize the pool. It sets the two token contracts, fees, name, symbol, and other metadata.

**Parameters:**
- `x-token-contract` (`principal`): The contract address of the first token in the pair (e.g., sBTC).
- `y-token-contract` (`principal`): The contract address of the second token (e.g., aibtc).
- ... and other configuration parameters.

**Returns:**
- `(ok true)`: On successful initialization.
- `(err uint)`: If the caller is not authorized.

### `pool-mint`

`(pool-mint (amount uint) (address principal))`

**Description:**
Mints a specified `amount` of LP tokens to a liquidity provider's `address`. This is called by the core contract after a user adds liquidity.

**Returns:** `(ok true)` or `(err uint)`.

### `pool-burn`

`(pool-burn (amount uint) (address principal))`

**Description:**
Burns a specified `amount` of LP tokens from a liquidity provider's `address`. This is called by the core contract when a user removes liquidity.

**Returns:** `(ok true)` or `(err uint)`.

### `pool-transfer`

`(pool-transfer (token-trait <sip-010-trait>) (amount uint) (recipient principal))`

**Description:**
Transfers a specified `amount` of one of the underlying tokens (X or Y) from the pool's address to a `recipient`. This is called by the core contract to send tokens to a user after a swap.

**Returns:** `(ok true)` or `(err uint)`.

---

## 5. Read-Only Functions

- [`get-pool`](#get-pool): Returns a large tuple containing all of the pool's data, including its configuration, balances, fees, and status.

---

## 6. Constants

- `CORE_ADDRESS`: `.xyk-core-v-1-2`, the only principal authorized to call most of this contract's functions.
- `CONTRACT_DEPLOYER`: `.aibtc-faktory-dex`, the only principal that can initiate the `create-pool` call (via the core contract).

---

## 7. Variables

This contract contains numerous data variables to store its state, including:
- `pool-id`, `pool-name`, `pool-symbol`, `pool-uri`
- `pool-created`, `pool-status`
- `x-token`, `y-token` (the principals of the two tokens in the pool)
- `x-balance`, `y-balance` (the liquidity of each token)
- `x-protocol-fee`, `y-protocol-fee` (fees for the protocol)
- `x-provider-fee`, `y-provider-fee` (fees for liquidity providers)

---

## 8. Errors

- `(err u4)`: `ERR_NOT_AUTHORIZED_SIP_010`. The `tx-sender` is not the `sender` in a `transfer` call.
- `(err u5)`: `ERR_INVALID_PRINCIPAL_SIP_010`. An address in a `transfer` call is not a standard principal.
- `(err u3001)`: `ERR_NOT_AUTHORIZED`. The caller is not the `CORE_ADDRESS`.
- `(err u3002)`: `ERR_INVALID_AMOUNT`. The amount for a transfer, mint, or burn is zero.
- `(err u3003)`: `ERR_INVALID_PRINCIPAL`. A principal provided to a core-managed function is invalid.
- `(err u3004)`: `ERR_POOL_NOT_CREATED`.
- `(err u3005)`: `ERR_POOL_DISABLED`.
- `(err u3006)`: `ERR_NOT_POOL_CONTRACT_DEPLOYER`. The `create-pool` call was not initiated by the authorized deployer.
