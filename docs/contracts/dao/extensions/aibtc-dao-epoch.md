# aibtc-dao-epoch

**Source:** [`aibtc-dao-epoch.clar`](../../../contracts/dao/extensions/aibtc-dao-epoch.clar)

## 1. Overview

The `aibtc-dao-epoch` contract is a simple extension that provides a time-keeping mechanism for the DAO based on the Bitcoin block height. It defines a fixed-length epoch and allows other contracts to query the current epoch number, enabling time-based logic and scheduling within the DAO ecosystem.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.dao-epoch`: Implements the specific interface for providing epoch data.

---

## 3. Called Contracts

This contract does not make any external contract calls.

---

## 4. Public Functions

- [`callback`](#callback): A standard function required by the extension trait, currently performs no action.

---

### `callback`

`(callback (sender principal) (memo (buff 34)))`

**Description:**
A standard callback function required for any extension. In this contract, it simply returns `(ok true)` and performs no other action.

**Parameters:**
- `sender` (`principal`): The principal initiating the callback.
- `memo` (`(buff 34)`): A buffer for arbitrary data.

**Returns:**
`(ok true)`

---

## 5. Read-Only Functions

- [`get-current-dao-epoch`](#get-current-dao-epoch): Returns the current DAO epoch number.
- [`get-dao-epoch-length`](#get-dao-epoch-length): Returns the length of an epoch in Bitcoin blocks.

---

### `get-current-dao-epoch`

`(get-current-dao-epoch)`

**Description:**
Calculates and returns the current epoch number based on the number of Bitcoin blocks that have passed since the contract was deployed.

**Returns:**
`(ok uint)`: The current epoch number.

---

### `get-dao-epoch-length`

`(get-dao-epoch-length)`

**Description:**
Returns the fixed length of a single DAO epoch, measured in Bitcoin blocks.

**Returns:**
`(ok uint)`: The epoch length, defined by the `EPOCH_LENGTH` constant.

---

## 6. Private Functions

This contract has no private functions.

---

## 7. Constants

- `EPOCH_LENGTH`: `u4320` (approximately 30 days in Bitcoin blocks).

---

## 8. Variables

This contract has no data variables.

---

## 9. Data Maps

This contract has no data maps.

---

## 10. Errors

This contract defines no custom errors.

---

## 11. Print Events

This contract does not emit any print events.
