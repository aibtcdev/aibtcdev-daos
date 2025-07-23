# aibtc-action-send-message

**Source:** [`aibtc-action-send-message.clar`](../../../../contracts/dao/actions/aibtc-action-send-message.clar)

## 1. Overview

This contract defines a specific action that can be executed by the DAO through a successful proposal. Its sole purpose is to send a message using the `.aibtc-onchain-messaging` extension. The message content is passed as a parameter when the proposal is created. This allows the DAO to broadcast information to the community via on-chain events.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.action`: Implements the interface for a proposal-executable action.

---

## 3. Called Contracts

- `.aibtc-base-dao`: To verify that a call is authorized by the DAO or one of its extensions.
- `.aibtc-onchain-messaging`: To send the actual message once the action is executed.

---

## 4. Public Functions

- [`callback`](#callback): A standard function for extensions, which currently takes no action.
- [`run`](#run): Executes the action to send a message.
- [`check-parameters`](#check-parameters): Validates the parameters for the action.

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

### `run`

`(run (parameters (buff 2048)))`

**Description:**
This function is called when a proposal to send a message is successfully passed and executed. It decodes the message from the `parameters` buffer and calls the `send` function in the `.aibtc-onchain-messaging` contract.

**Parameters:**
- `parameters` (`(buff 2048)`): A buffer containing the consensus-encoded message string (`(string-utf8 2043)`).

**Returns:**
- `(ok ...)`: The result of the `contract-call?` to `.aibtc-onchain-messaging`.
- `(err u2000)`: If the caller is not the DAO or an authorized extension.
- `(err u2001)`: If the `parameters` buffer cannot be decoded into a valid message string.

---

## 5. Read-Only Functions

- [`check-parameters`](#check-parameters): Validates the parameters for the action.

---

### `check-parameters`

`(check-parameters (parameters (buff 2048)))`

**Description:**
A read-only function used to validate the parameters of a proposal before it is submitted. It ensures that the `parameters` buffer can be decoded into a non-empty message string.

**Parameters:**
- `parameters` (`(buff 2048)`): A buffer containing the consensus-encoded message string (`(string-utf8 2043)`).

**Returns:**
- `(ok true)`: If the parameters are valid.
- `(err u2001)`: If the `parameters` buffer is invalid or the decoded message is empty.

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
- `(err u2000)`: If the caller is not the DAO or a registered extension.

---

## 7. Constants

- `ERR_NOT_DAO_OR_EXTENSION`: Error code for unauthorized access.
- `ERR_INVALID_PARAMETERS`: Error code for invalid proposal parameters.

---

## 8. Variables

This contract does not use any variables.

---

## 9. Data Maps

This contract does not use any data maps.

---

## 10. Errors

- `(err u2000)`: Returned by `is-dao-or-extension` if the caller is not the DAO or an authorized extension.
- `(err u2001)`: Returned by `run` and `check-parameters` if the proposal parameters are invalid (e.g., cannot be decoded or the message is empty).

---

## 11. Print Events

This contract does not emit any print events.
