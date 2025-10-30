# aibtc-dao-charter

**Source:** [`aibtc-dao-charter.clar`](../../../contracts/dao/extensions/aibtc-dao-charter.clar)

## 1. Overview

The `aibtc-dao-charter` contract is an extension that manages the DAO's charter, recording its mission and values on-chain. It allows the DAO to set and update its charter through proposals, with each change being versioned for historical tracking.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Implements the standard interface for a DAO extension.
- `.aibtc-dao-traits.dao-charter`: Implements the specific interface for managing the DAO charter.

---

## 3. Called Contracts

- `.aibtc-base-dao`: This contract calls `is-extension` on the base DAO to ensure that any function calls are authorized.

---

## 4. Public Functions

- [`callback`](#callback): A standard function required by the extension trait, currently performs no action.
- [`set-dao-charter`](#set-dao-charter): Sets a new version of the DAO charter.

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

### `set-dao-charter`

`(set-dao-charter (charter (string-utf8 16384)))`

**Description:**
Sets or updates the DAO's charter. This function can only be called by the DAO or another authorized extension. It creates a new, versioned entry for the charter.

**Parameters:**
- `charter` (`(string-utf8 16384)`): The text of the new charter, with a maximum length of 16,384 bytes.

**Returns:**
`(ok true)`: On success.
`(err uint)`: If the caller is not authorized, the charter text is too long/short, or if there is an error saving the charter.

---

## 5. Read-Only Functions

- [`get-current-dao-charter-version`](#get-current-dao-charter-version): Returns the version number of the current charter.
- [`get-current-dao-charter`](#get-current-dao-charter): Returns the data for the current charter.
- [`get-dao-charter`](#get-dao-charter): Returns the data for a specific version of the charter.

---

### `get-current-dao-charter-version`

`(get-current-dao-charter-version)`

**Description:**
Retrieves the version number of the most recent DAO charter.

**Returns:**
`(optional uint)`: `(some version)` if a charter exists, otherwise `none`.

---

### `get-current-dao-charter`

`(get-current-dao-charter)`

**Description:**
Retrieves the full data object for the current DAO charter.

**Returns:**
`(optional object)`: An object containing the charter data if it exists, otherwise `none`. The object includes `burnHeight`, `createdAt`, `caller`, `sender`, and `charter`.

---

### `get-dao-charter`

`(get-dao-charter (version uint))`

**Description:**
Retrieves the full data object for a specific version of the DAO charter.

**Parameters:**
- `version` (`uint`): The version number of the charter to retrieve.

**Returns:**
`(optional object)`: An object containing the charter data if that version exists, otherwise `none`.

---

## 6. Private Functions

- [`is-dao-or-extension`](#is-dao-or-extension): Asserts that the transaction sender is the DAO contract itself or an enabled extension.

---

## 7. Constants

- `ERR_NOT_DAO_OR_EXTENSION`: `(err u1400)`
- `ERR_SAVING_CHARTER`: `(err u1401)`
- `ERR_CHARTER_TOO_SHORT`: `(err u1402)`
- `ERR_CHARTER_TOO_LONG`: `(err u1403)`

---

## 8. Variables

- `currentVersion`: A counter that tracks the current version number of the charter.

---

## 9. Data Maps

- `CharterVersions`: Maps a version number (`uint`) to a data object containing the charter's text and metadata.

---

## 10. Errors

- `(err u1400)`: Returned if the caller is not the DAO or an authorized extension.
- `(err u1401)`: Returned if `map-insert` fails when saving a new charter version.
- `(err u1402)`: Returned if the provided charter string is empty.
- `(err u1403)`: Returned if the provided charter string exceeds 16,384 bytes.

---

## 11. Print Events

- `aibtc-dao-charter/set-dao-charter`: Emitted when a new charter is successfully set. The payload includes the new and previous charter text, version number, and block height information.
