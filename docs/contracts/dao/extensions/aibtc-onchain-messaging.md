# aibtc-onchain-messaging

**Source:** [`aibtc-onchain-messaging.clar`](../../../../contracts/dao/extensions/aibtc-onchain-messaging.clar)

## 1. Overview

This contract is an extension that allows the DAO or DAO token holders to send on-chain messages. Messages sent through this contract are broadcast as print events, allowing any off-chain service to listen and react to them. The DAO can send messages for free via proposals, while token holders must pay a fee in the DAO's token, which is transferred to the treasury. The message cost is dynamically set to the proposal bond amount from the `aibtc-action-proposal-voting` contract.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.messaging`: Implements the interface for sending on-chain messages.

---

## 3. Called Contracts

- `.aibtc-base-dao`: To verify that a call is authorized by the DAO or one of its extensions.
- `.aibtc-faktory`: To check the token balance of the sender to verify if they are a token holder.
- `.aibtc-treasury`: To deposit the message fee when a token holder sends a message.
- `.aibtc-action-proposal-voting`: To retrieve the proposal bond amount, which is used to set the `messageCost`.

---

## 4. Public Functions

- [`callback`](#callback): A standard function for extensions, which currently takes no action.
- [`send`](#send): Broadcasts a message as a print event.

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

### `send`

`(send (msg (string-utf8 10000)))`

**Description:**
Allows the DAO or a token holder to send an on-chain message. The message is emitted as a print event. If the sender is not the DAO (i.e., a token holder), a fee equal to `messageCost` is transferred from the sender to the DAO treasury.

**Parameters:**
- `msg` (`(string-utf8 10000)`): The message content to be broadcast.

**Returns:**
- `(ok true)`: If the message is sent successfully and the fee is paid (if applicable).
- `(err u1601)`: If the message string is empty.
- `(err u1602)`: If there is an error fetching the sender's token balance.
- An error from the `.aibtc-treasury` contract if the fee transfer fails.

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
- `(err u1600)`: If the caller is not the DAO or a registered extension.

---

## 7. Constants

- `ERR_NOT_DAO_OR_EXTENSION`: Error code for unauthorized access.
- `ERR_INVALID_INPUT`: Error code for invalid message input.
- `ERR_FETCHING_TOKEN_DATA`: Error code for failures when fetching token data.

---

## 8. Variables

- `messageCost` (`uint`): Stores the fee required for a token holder to send a message. It is initialized to the proposal bond amount.

---

## 9. Data Maps

This contract does not use any data maps.

---

## 10. Errors

- `(err u1600)`: Returned by `is-dao-or-extension` if the caller is not the DAO or an authorized extension.
- `(err u1601)`: Returned by `send` if the message string is empty.
- `(err u1602)`: Returned by `send` if the call to `.aibtc-faktory` to get the sender's balance fails.

---

## 11. Print Events

- `aibtc-onchain-messaging/initialize`: Emitted once upon contract deployment, logging the initial `messageCost`.
- `aibtc-onchain-messaging/send`: Emitted when the `send` function is successfully called. The payload includes the sender, message content, and whether the sender was the DAO or a token holder.
