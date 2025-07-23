# aibtc-rewards-account

**Source:** [`aibtc-rewards-account.clar`](../../../../contracts/dao/extensions/aibtc-rewards-account.clar)

## 1. Overview

The `aibtc-rewards-account` is a specialized extension contract designed to hold and distribute funds for proposal-related rewards. It acts as a secure vault that can only be instructed to release funds by the DAO or another authorized extension. This ensures that rewards are distributed according to the outcomes of governance proposals, providing a clear and auditable trail for all reward transactions.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Marks the contract as an official extension of the aibtcDAO, allowing it to interact with core DAO functions.
- `.aibtc-dao-traits.rewards-account`: Fulfills the requirements for a rewards account within the aibtcDAO ecosystem.

### Used Traits
- `ft-trait`: The standard SIP-010 trait for fungible tokens, used here to interact with the DAO's token contract (`.aibtc-faktory`).

---

## 3. Called Contracts

- `.aibtc-base-dao`: Called to verify that the function caller is either the main DAO contract or an authorized extension.
- `.aibtc-faktory`: The DAO's token contract, called to check the balance of this contract and to transfer reward tokens to a specified recipient.

---

## 4. Public Functions

- [`callback`](#callback): A standard callback function for receiving tokens.
- [`transfer-reward`](#transfer-reward): Transfers a specified amount of DAO tokens to a recipient.

---

### `callback`

`(callback (sender principal) (memo (buff 34)))`

**Description:**
A standard function required by the SIP-010 token standard to handle receiving tokens. It currently does nothing other than return `(ok true)`.

**Parameters:**
- `sender` (`principal`): The principal that sent the tokens.
- `memo` (`(buff 34)`): A memo field for the transfer.

**Returns:**
`(ok true)` on success.

### `transfer-reward`

`(transfer-reward (recipient principal) (amount uint))`

**Description:**
Transfers a specified `amount` of DAO tokens from this contract to a `recipient`. This function is protected and can only be called by the DAO or an authorized extension, ensuring that rewards are only paid out through approved proposals.

**Parameters:**
- `recipient` (`principal`): The address to receive the reward tokens.
- `amount` (`uint`): The number of tokens to transfer.

**Returns:**
`(ok (response bool ...))` on a successful transfer.
`(err u1700)` if the caller is not the DAO or an authorized extension.
`(err u1701)` if the contract has an insufficient balance to cover the reward.

---

## 5. Private Functions

- [`is-dao-or-extension`](#is-dao-or-extension): Checks if the caller is the DAO or an authorized extension.

---

### `is-dao-or-extension`

`(is-dao-or-extension)`

**Description:**
A private helper function that verifies if the `tx-sender` is the `.aibtc-base-dao` contract or if the `contract-caller` is a registered extension of the DAO.

**Returns:**
`(ok true)` if the caller is authorized.
`(err u1900)` if the caller is not authorized.

---

## 6. Errors

- `(err u1700)`: `ERR_NOT_DAO_OR_EXTENSION`. Returned when a function is called by a principal that is not the DAO or an authorized extension.
- `(err u1701)`: `ERR_INSUFFICIENT_BALANCE`. Returned when `transfer-reward` is called but the contract's balance is less than the requested amount.

---

## 7. Print Events

- `aibtc-rewards-account/transfer-reward`: Emitted when `transfer-reward` is successfully executed. The payload includes the `recipient`, `amount`, `contractCaller`, and `txSender`.
