# aibtc-faktory

**Source:** [`aibtc-faktory.clar`](../../../../contracts/dao/token/aibtc-faktory.clar)

## 1. Overview

This contract defines the `SYMBOL-AIBTC-DAO` fungible token, which is the core governance and utility token for the DAO. It adheres to the SIP-010 standard for fungible tokens and includes functions for transferring tokens, managing metadata, and distributing the initial supply to other DAO components like the treasury and DEX.

---

## 2. Traits

### Implemented Traits
- `'STTWD9SPRQVD3P733V89SV0P8RZRZNQADG034F0A.faktory-trait-v1.sip-010-trait`: A standard SIP-010 trait implementation provided by Faktory.
- `.aibtc-dao-traits.token`: A custom trait for DAO-specific token functionalities.

---

## 3. Public Functions

- [`transfer`](#transfer): Transfers a specified amount of tokens from the sender to a recipient.
- [`set-token-uri`](#set-token-uri): Updates the URI for the token's metadata.
- [`set-contract-owner`](#set-contract-owner): Transfers ownership of the contract to a new principal.
- [`send-many`](#send-many): Sends tokens to a list of up to 200 recipients in a single transaction.

---

### `transfer`

`(transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))`

**Description:**
Transfers a specified `amount` of the DAO token from the `sender`'s account to the `recipient`'s account. The transaction sender must be the same as the `sender` principal. An optional `memo` can be included.

**Parameters:**
- `amount` (`uint`): The number of tokens to transfer.
- `sender` (`principal`): The principal from which to send tokens.
- `recipient` (`principal`): The principal to receive the tokens.
- `memo` (`(optional (buff 34))`): An optional memo to include with the transfer.

**Returns:**
- `(ok bool)`: `(ok true)` on a successful transfer.
- `(err uint)`: An error code if the transfer fails (e.g., `ERR-NOT-AUTHORIZED` if `tx-sender` is not `sender`).

### `set-token-uri`

`(set-token-uri (value (string-utf8 256)))`

**Description:**
Allows the contract owner to set or update the URI pointing to the token's metadata JSON file.

**Parameters:**
- `value` (`(string-utf8 256)`): The new URI for the token metadata.

**Returns:**
- `(ok response)`: `(ok ...)` on success, printing a notification event.
- `(err uint)`: `(err ERR-NOT-AUTHORIZED)` if the caller is not the contract owner.

### `set-contract-owner`

`(set-contract-owner (new-owner principal))`

**Description:**
Allows the current contract owner to transfer ownership to a new principal.

**Parameters:**
- `new-owner` (`principal`): The principal of the new owner.

**Returns:**
- `(ok bool)`: `(ok true)` on success.
- `(err uint)`: `(err ERR-NOT-AUTHORIZED)` if the caller is not the current contract owner.

### `send-many`

`(send-many (recipients (list 200 { to: principal, amount: uint, memo: (optional (buff 34)) })))`

**Description:**
Allows the transaction sender to transfer tokens to multiple recipients in a single call. The `recipients` parameter is a list of objects, each specifying the destination address, amount, and an optional memo.

**Parameters:**
- `recipients` (`(list 200 ...)`): A list of recipient objects.

**Returns:**
- `(ok bool)`: `(ok true)` if all transfers are successful.
- `(err uint)`: An error from the underlying `transfer` call if any transfer fails.

---

## 4. Read-Only Functions

- [`get-balance`](#get-balance): Retrieves the token balance for a given account.
- [`get-name`](#get-name): Returns the name of the token.
- [`get-symbol`](#get-symbol): Returns the symbol of the token.
- [`get-decimals`](#get-decimals): Returns the number of decimals for the token.
- [`get-total-supply`](#get-total-supply): Returns the total supply of the token.
- [`get-token-uri`](#get-token-uri): Returns the metadata URI for the token.

---

## 5. Private Functions

- `check-err`: A helper function used by `send-many` to fold over the list of transfers and stop on the first error.
- `send-token`: A helper function used by `send-many` to process a single recipient object.
- `send-token-with-memo`: A helper function that calls the public `transfer` function for a single recipient.

---

## 6. Constants

- `ERR-NOT-AUTHORIZED`: `u401`, returned when a non-owner attempts a privileged action.
- `ERR-NOT-OWNER`: `u402`, an alternative authorization error.
- `MAX`: `u100000000000000000`, the maximum total supply of the token (100 million with 8 decimals).

---

## 7. Variables

- `contract-owner`: Stores the principal of the contract owner.
- `token-uri`: Stores the optional URI for the token's metadata.

---

## 8. Errors

- `(err u401)`: `ERR-NOT-AUTHORIZED`. The caller is not authorized to perform the action (e.g., not the sender in a transfer, or not the owner for admin functions).
- `(err u402)`: `ERR-NOT-OWNER`. The caller is not the owner of the contract.

---

## 9. Print Events

- **Transfer Memo:** In `transfer`, the optional `memo` buffer is printed if provided.
- **Token Metadata Update:** In `set-token-uri`, a SIP-019 event is printed to notify indexers of the metadata change.
- **Contract Initialization:** During contract deployment, an event is printed with key details about the token, including its name, symbol, supply, and parameters for the associated DEX.
