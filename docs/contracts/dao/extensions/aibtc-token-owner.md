# aibtc-token-owner

**Source:** [`aibtc-token-owner.clar`](../../../../contracts/dao/extensions/aibtc-token-owner.clar)

## 1. Overview

This contract is an extension that grants the DAO ownership-level control over the `.aibtc-faktory` token contract. It allows the DAO to set the token's metadata URI and transfer its ownership. These functions can only be called by the DAO itself (or another extension), ensuring that control is decentralized and not tied to a single external account.

**Note:** While these functions exist, there is currently no proposal action designed to call them. This effectively makes the token's URI and ownership immutable unless a new action is proposed and approved by the DAO.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.token-owner`: Implements the interface for managing the DAO token.

---

## 3. Called Contracts

- `.aibtc-base-dao`: To verify that a call is authorized by the DAO or one of its extensions.
- `.aibtc-faktory`: To execute administrative functions like setting the token URI and transferring ownership.

---

## 4. Public Functions

- [`callback`](#callback): A standard function for extensions, which currently takes no action.
- [`set-token-uri`](#set-token-uri): Sets the metadata URI for the DAO token.
- [`transfer-ownership`](#transfer-ownership): Transfers ownership of the DAO token contract to a new principal.

---

### `callback`

`(callback (sender principal) (memo (buff 34)))`

**Description:**
A standard callback function required by the extension trait. It is intended to handle responses from other contracts but currently performs no action and simply returns `(ok true)`.

**Parameters:**
- `sender` (`principal`): The principal of the contract that triggered the callback.
- `memo` (`(buff 34)`): A buffer for arbitrary data.

**Returns:**
`(ok true)` always.

### `set-token-uri`

`(set-token-uri (value (string-utf8 256)))`

**Description:**
Allows the DAO to set the token URI for the `.aibtc-faktory` contract. This function must be called by the DAO (e.g., through a proposal) and uses `as-contract` to make the call from this contract's context.

**Parameters:**
- `value` (`(string-utf8 256)`): The new URI for the token's metadata.

**Returns:**
- `(ok true)`: If the URI is set successfully.
- `(err u1800)`: If the caller is not the DAO or an authorized extension.
- An error from `.aibtc-faktory` if the underlying call fails.

### `transfer-ownership`

`(transfer-ownership (new-owner principal))`

**Description:**
Allows the DAO to transfer ownership of the `.aibtc-faktory` contract to a new principal. This function must be called by the DAO and uses `as-contract` to make the call.

**Parameters:**
- `new-owner` (`principal`): The principal to become the new owner of the token contract.

**Returns:**
- `(ok true)`: If ownership is transferred successfully.
- `(err u1800)`: If the caller is not the DAO or an authorized extension.
- An error from `.aibtc-faktory` if the underlying call fails.

---

## 5. Read-Only Functions

This contract has no read-only functions.

---

## 6. Private Functions

- [`is-dao-or-extension`](#is-dao-or-extension): Checks if the caller is the DAO or an authorized extension.

---

### `is-dao-or-extension`

`(is-dao-or-extension)`

**Description:**
Verifies that the transaction sender (`tx-sender`) is the base DAO contract or that the contract caller (`contract-caller`) is a registered extension of the DAO.

**Parameters:**
None.

**Returns:**
- `(ok true)`: If the caller is authorized.
- `(err u1800)`: If the caller is not the DAO or a registered extension.

---

## 7. Constants

- `ERR_NOT_DAO_OR_EXTENSION`: Error code for unauthorized access.

---

## 8. Variables

This contract does not use any variables.

---

## 9. Data Maps

This contract does not use any data maps.

---

## 10. Errors

- `(err u1800)`: Returned by `is-dao-or-extension` if the caller is not the DAO or an authorized extension. This error is also returned by the public functions if the authorization check fails.

---

## 11. Print Events

- `aibtc-token-owner/set-token-uri`: Emitted when the `set-token-uri` function is successfully called.
- `aibtc-token-owner/transfer-ownership`: Emitted when the `transfer-ownership` function is successfully called.
