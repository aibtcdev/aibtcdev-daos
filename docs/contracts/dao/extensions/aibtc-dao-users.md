# aibtc-dao-users

**Source:** [`aibtc-dao-users.clar`](../../../contracts/dao/extensions/aibtc-dao-users.clar)

## 1. Overview

The `aibtc-dao-users` contract is an extension that tracks DAO members and their reputation scores. It provides functions to create user profiles and adjust reputation based on on-chain activities, such as participation in proposals. This allows the DAO to build a system of trust and recognize valuable contributors.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.dao-users`: Implements the specific interface for managing DAO users and reputation.

---

## 3. Called Contracts

- `.aibtc-base-dao`: This contract calls `is-extension` on the base DAO to ensure that any function calls are authorized.

---

## 4. Public Functions

- [`callback`](#callback): A standard function required by the extension trait, currently performs no action.
- [`get-or-create-user-index`](#get-or-create-user-index): Retrieves a user's index or creates a new user profile if one does not exist.
- [`increase-user-reputation`](#increase-user-reputation): Increases a user's reputation score.
- [`decrease-user-reputation`](#decrease-user-reputation): Decreases a user's reputation score.

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

### `get-or-create-user-index`

`(get-or-create-user-index (address principal))`

**Description:**
Looks up a user by their principal address. If the user exists, it returns their unique index. If not, it creates a new user profile, assigns them a new index, and initializes their reputation to zero. This function can only be called by the DAO or an authorized extension.

**Parameters:**
- `address` (`principal`): The principal address of the user.

**Returns:**
`(ok uint)`: The user's unique index.
`(err uint)`: If the caller is not authorized.

---

### `increase-user-reputation`

`(increase-user-reputation (address principal) (amount uint))`

**Description:**
Increases a user's reputation score by a specified amount. This function can only be called by the DAO or an authorized extension.

**Parameters:**
- `address` (`principal`): The address of the user whose reputation is to be increased.
- `amount` (`uint`): The amount to add to the user's reputation score.

**Returns:**
`(ok true)`: On success.
`(err uint)`: If the caller is not authorized or the user is not found.

---

### `decrease-user-reputation`

`(decrease-user-reputation (address principal) (amount uint))`

**Description:**
Decreases a user's reputation score by a specified amount. This function can only be called by the DAO or an authorized extension.

**Parameters:**
- `address` (`principal`): The address of the user whose reputation is to be decreased.
- `amount` (`uint`): The amount to subtract from the user's reputation score.

**Returns:**
`(ok true)`: On success.
`(err uint)`: If the caller is not authorized or the user is not found.

---

## 5. Read-Only Functions

- [`get-user-count`](#get-user-count): Returns the total number of registered users.
- [`get-user-index`](#get-user-index): Returns the unique index for a given user address.
- [`get-user-data-by-index`](#get-user-data-by-index): Returns user data for a given index.
- [`get-user-data-by-address`](#get-user-data-by-address): Returns user data for a given address.

---

### `get-user-count`

`(get-user-count)`

**Description:**
Returns the total number of unique users who have been registered in the contract.

**Returns:**
`(uint)`: The total user count.

---

### `get-user-index`

`(get-user-index (address principal))`

**Description:**
Retrieves the unique index associated with a user's principal address.

**Parameters:**
- `address` (`principal`): The user's address.

**Returns:**
`(optional uint)`: `(some index)` if the user exists, otherwise `none`.

---

### `get-user-data-by-index`

`(get-user-data-by-index (userIndex uint))`

**Description:**
Retrieves a user's data object using their unique index.

**Parameters:**
- `userIndex` (`uint`): The user's unique index.

**Returns:**
`(optional object)`: An object containing the user's data (`address`, `createdAt`, `reputation`) if the index is valid, otherwise `none`.

---

### `get-user-data-by-address`

`(get-user-data-by-address (address principal))`

**Description:**
Retrieves a user's data object using their principal address.

**Parameters:**
- `address` (`principal`): The user's address.

**Returns:**
`(optional object)`: An object containing the user's data if the address is registered, otherwise `none`.

---

## 6. Private Functions

- [`is-dao-or-extension`](#is-dao-or-extension): Asserts that the transaction sender is the DAO contract itself or an enabled extension.

---

## 7. Constants

- `ERR_NOT_DAO_OR_EXTENSION`: `(err u1500)`
- `ERR_USER_NOT_FOUND`: `(err u1501)`

---

## 8. Variables

- `userCount`: A counter for the total number of registered users.

---

## 9. Data Maps

- `UserIndexes`: Maps a user's `principal` to their unique `uint` index.
- `UserData`: Maps a user's `uint` index to their data object, which contains their `address`, `createdAt` block height, and `reputation` score.

---

## 10. Errors

- `(err u1500)`: Returned if the caller is not the DAO or an authorized extension.
- `(err u1501)`: Returned when trying to modify the reputation of a user that does not exist.

---

## 11. Print Events

- `aibtc-dao-users/get-or-create-user-index`: Emitted when a new user is created.
- `aibtc-dao-users/increase-user-reputation`: Emitted when a user's reputation is increased.
- `aibtc-dao-users/decrease-user-reputation`: Emitted when a user's reputation is decreased.
