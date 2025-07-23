# aibtc-faktory-dex

**Source:** [`aibtc-faktory-dex.clar`](../../../../contracts/dao/token/aibtc-faktory-dex.clar)

## 1. Overview

This contract serves as a specialized, temporary decentralized exchange (DEX) to bootstrap liquidity for the DAO token (`.aibtc-faktory`). It facilitates buying and selling the token against sBTC using a custom bonding curve. Once a target amount of sBTC (`TARGET_STX`) is raised, the contract automatically transfers the collected liquidity to create a permanent, public liquidity pool on Bitflow (`xyk-pool-sbtc-aibtc-v-1-1`).

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.faktory-dex`: A custom trait for DAO-specific DEX functionality.
- `'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-dex-trait-v1-1.dex-trait`: A standard DEX trait from Faktory.

### Used Traits
- `faktory-token`: A trait constraint for the fungible token being traded, ensuring it conforms to the Faktory SIP-010 standard.

---

## 3. Called Contracts

- `'STV9K21TBFAK4KNRJXF5DFP8N7W46G4V9RJ5XDY2.sbtc-token`: Used to transfer sBTC for buys, sells, and fees.
- `.aibtc-pre-faktory`: Interacts with the pre-launch contract to check if the market can be opened and to send it a portion of the trading fees.
- `.xyk-core-v-1-2`: The Bitflow core contract, called to create the final AMM pool upon reaching the funding target.
- `.xyk-pool-sbtc-aibtc-v-1-1`: The specific pool contract that will be created and funded.
- `.aibtc-faktory`: The DAO token contract, used for transfers during buys and sells.

---

## 4. Public Functions

- [`buy`](#buy): Allows a user to buy DAO tokens with sBTC.
- [`sell`](#sell): Allows a user to sell DAO tokens for sBTC.
- [`open-market`](#open-market): Opens the DEX for trading, contingent on the pre-launch contract allowing it.

---

### `buy`

`(buy (ft <faktory-token>) (ubtc uint))`

**Description:**
A user sends sBTC (`ubtc`) to purchase the DAO token (`ft`). The contract calculates the amount of tokens to send back based on the current sBTC and token balances, simulating a bonding curve. A fee is deducted from the sBTC input. If the purchase causes the total sBTC in the contract to meet or exceed `TARGET_STX`, it triggers the "graduation" process, creating and funding the permanent AMM pool.

**Parameters:**
- `ft` (`<faktory-token>`): The token contract principal being purchased.
- `ubtc` (`uint`): The amount of sBTC (in sats) to spend.

**Returns:**
- `(ok true)`: On success.
- `(err uint)`: On failure, with a specific error code.

### `sell`

`(sell (ft <faktory-token>) (amount uint))`

**Description:**
A user sends a specified `amount` of DAO tokens to the contract to receive sBTC in return. The amount of sBTC returned is calculated based on the contract's current balances. A fee is deducted from the sBTC output.

**Parameters:**
- `ft` (`<faktory-token>`): The token contract principal being sold.
- `amount` (`uint`): The amount of DAO tokens to sell.

**Returns:**
- `(ok true)`: On success.
- `(err uint)`: On failure, with a specific error code.

### `open-market`

`(open-market)`

**Description:**
Sets the `open` flag to `true`, allowing `buy` and `sell` transactions. This can only be called if the associated `.aibtc-pre-faktory` contract's market is also open and the DEX has not already graduated.

**Returns:**
- `(ok true)`: If the market is successfully opened.
- `(err uint)`: `(err ERR-MARKET-CLOSED)` if conditions are not met.

---

## 5. Read-Only Functions

- [`get-in`](#get-in): Calculates the outcome of a `buy` operation without executing it.
- [`get-out`](#get-out): Calculates the outcome of a `sell` operation without executing it.
- [`get-open`](#get-open): Returns the current state of the `open` data variable.

---

## 6. Constants

- `FEE-RECEIVER`: The principal that receives the majority of trading fees.
- `G-RECEIVER`: The principal that receives the graduation fee.
- `DEX-TOKEN`: The contract principal of the official DAO token (`.aibtc-faktory`).
- `TARGET_STX`: `u5000000`, the amount of sBTC that needs to be collected to trigger graduation.
- `DEX-AMOUNT`: `u250000`, the initial amount of sBTC provided to the DEX at deployment.

---

## 7. Variables

- `open`: A boolean flag indicating if the market is open for trading.
- `bonded`: A boolean flag indicating if the DEX has graduated and funded the AMM pool.
- `ft-balance`: The contract's current balance of the DAO token.
- `stx-balance`: The contract's current balance of sBTC.
- `premium`: A percentage (`u25`) used to calculate a token bonus for the graduation contributors.

---

## 8. Errors

- `(err u1001)`: `ERR-MARKET-CLOSED`. The market is not open for trading.
- `(err u1002)`: `ERR-STX-NON-POSITIVE`. The sBTC amount for a buy must be positive.
- `(err u1003)`: `ERR-STX-BALANCE-TOO-LOW`. The contract has insufficient sBTC to fulfill a sell order.
- `(err u1004)`: `ERR-FT-NON-POSITIVE`. The token amount for a sell must be positive.
- `(err u1005)`: `ERR-FETCHING-BUY-INFO`. Internal error in the `get-in` calculation.
- `(err u1006)`: `ERR-FETCHING-SELL-INFO`. Internal error in the `get-out` calculation.
- `(err u1007)`: `ERR-AMOUNT-TOO-HIGH`. The buy amount is too large and would exceed the graduation target.
- `(err u1008)`: `ERR-AMOUNT-TOO-LOW`. The calculated sBTC output for a sell is too low to be valid.
- `(err u401)`: `ERR-TOKEN-NOT-AUTH`. The token being traded is not the authorized DAO token.

---

## 9. Print Events

- **Buy Event:** Emitted on a successful `buy`, detailing the amounts, fees, and resulting balances.
- **Sell Event:** Emitted on a successful `sell`, detailing the amounts, fees, and resulting balances.
- **Graduation Event:** Emitted within a `buy` transaction that triggers graduation, detailing the final AMM pool parameters.
- **Contract Initialization:** Emitted at deployment, detailing the DEX and its associated AMM parameters.
