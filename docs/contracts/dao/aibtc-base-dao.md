# aibtc-base-dao

**Source:** [`aibtc-base-dao.clar`](../../contracts/dao/aibtc-base-dao.clar)

## 1. Overview

The `aibtc-base-dao` contract is the core component of the ExecutorDAO framework. It is responsible for managing extensions, executing proposals, and serving as the central authority for all DAO operations. Once constructed, it becomes autonomous and can only be controlled through proposals passed by the DAO itself.

---

## 2. Traits

### Implemented Traits
- `.aibtc-base-dao-trait.aibtc-base-dao`: Implements the base functionalities required for the DAO's operation.

### Used Traits
- `.aibtc-dao-traits.proposal`: Defines the interface for proposals that the DAO can execute.
- `.aibtc-dao-traits.extension`: Defines the interface for extensions that can be added to the DAO.

---

## 3. Called Contracts

- **Proposal Contracts (`<proposal-trait>`)**: The DAO executes proposals by calling the `execute` function on a contract that implements the proposal trait.
- **Extension Contracts (`<extension-trait>`)**: The DAO can interact with its extensions by calling their `callback` function.

---

## 4. Public Functions

- [`construct`](#construct): Initializes the DAO with a founding proposal, setting it to a constructed state.
- [`execute`](#execute): Executes a given proposal, marking it as completed.
- [`set-extension`](#set-extension): Enables or disables a single extension.
- [`set-extensions`](#set-extensions): Enables or disables a list of extensions in a single transaction.
- [`request-extension-callback`](#request-extension-callback): Allows an extension to request a callback from the DAO.

---

### `construct`

`(construct (proposal <proposal-trait>))`

**Description:**
Initializes the DAO. This function can only be called once by the `executive` principal (initially the deployer). It sets the `constructed` flag to `true`, transfers executive power to the contract itself, and executes an initial proposal.

**Parameters:**
- `proposal` (`<proposal-trait>`): The contract address of the initial proposal to execute upon construction.

**Returns:**
`(ok response)`: The response from the `execute` function call on the initial proposal.
`(err uint)`: An error if the DAO is already constructed or the caller is not authorized.

---

### `execute`

`(execute (proposal <proposal-trait>) (sender principal))`

**Description:**
Executes a proposal contract. The caller must be the DAO itself or an authorized extension. It records the execution block height to prevent re-execution.

**Parameters:**
- `proposal` (`<proposal-trait>`): The contract address of the proposal to be executed.
- `sender` (`principal`): The principal who initiated the proposal execution.

**Returns:**
`(ok response)`: The response from the `execute` function call on the proposal.
`(err uint)`: An error if the caller is unauthorized or the proposal has already been executed.

---

### `set-extension`

`(set-extension (extension principal) (enabled bool))`

**Description:**
Enables or disables an extension. The caller must be the DAO itself or an authorized extension.

**Parameters:**
- `extension` (`principal`): The contract address of the extension to modify.
- `enabled` (`bool`): `true` to enable the extension, `false` to disable it.

**Returns:**
`(ok bool)`: `(ok true)` on success.
`(err uint)`: An error if the caller is unauthorized.

---

### `set-extensions`

`(set-extensions (extensionList (list 200 { extension: principal, enabled: bool })))`

**Description:**
Enables or disables multiple extensions in a single call. The caller must be the DAO itself or an authorized extension.

**Parameters:**
- `extensionList` (`list`): A list of up to 200 extension objects, each specifying the extension principal and its enabled status.

**Returns:**
`(ok (list bool))`: A list of `true` values, one for each successful update.
`(err uint)`: An error if the caller is unauthorized or the list is empty.

---

### `request-extension-callback`

`(request-extension-callback (extension <extension-trait>) (memo (buff 34)))`

**Description:**
Allows a valid extension to request a callback. This enables extensions to trigger actions from the DAO in a controlled manner.

**Parameters:**
- `extension` (`<extension-trait>`): The extension contract requesting the callback.
- `memo` (`(buff 34)`): A buffer for passing arbitrary data to the extension's `callback` function.

**Returns:**
`(ok response)`: The response from the extension's `callback` function.
`(err uint)`: An error if the caller is not a valid extension.

---

## 5. Read-Only Functions

- [`is-constructed`](#is-constructed): Checks if the DAO has been initialized.
- [`is-extension`](#is-extension): Checks if a contract is an enabled extension.
- [`executed-at`](#executed-at): Returns the block height at which a proposal was executed.

---

### `is-constructed`

`(is-constructed)`

**Description:**
Returns whether the `construct` function has been successfully called.

**Returns:**
`(bool)`: `true` if the DAO is constructed, otherwise `false`.

---

### `is-extension`

`(is-extension (extension principal))`

**Description:**
Checks if a given principal is registered as an enabled extension.

**Parameters:**
- `extension` (`principal`): The principal of the contract to check.

**Returns:**
`(bool)`: `true` if the contract is an enabled extension, otherwise `false`.

---

### `executed-at`

`(executed-at (proposal <proposal-trait>))`

**Description:**
Returns the Stacks block height at which a given proposal was executed.

**Parameters:**
- `proposal` (`<proposal-trait>`): The proposal contract to check.

**Returns:**
`(optional uint)`: `(some block-height)` if the proposal was executed, otherwise `none`.

---

## 6. Private Functions

- [`is-self-or-extension`](#is-self-or-extension): Asserts that the transaction sender is the DAO contract itself or an enabled extension.
- [`set-extensions-iter`](#set-extensions-iter): A helper function to iterate over the list in `set-extensions`.

---

## 7. Constants

- `ERR_UNAUTHORIZED`: `(err u1200)`
- `ERR_ALREADY_EXECUTED`: `(err u1201)`
- `ERR_INVALID_EXTENSION`: `(err u1202)`
- `ERR_NO_EMPTY_LISTS`: `(err u1203)`
- `ERR_DAO_ALREADY_CONSTRUCTED`: `(err u1204)`

---

## 8. Variables

- `executive`: The principal authorized to call the `construct` function. Initially the deployer, then set to the contract itself.
- `constructed`: A flag indicating whether the DAO has been constructed.

---

## 9. Data Maps

- `ExecutedProposals`: Maps a proposal's contract principal to the Stacks block height of its execution.
- `Extensions`: Maps an extension's contract principal to a boolean indicating if it is enabled.

---

## 10. Errors

- `(err u1200)`: Returned when the caller is not authorized to perform an action.
- `(err u1201)`: Returned when attempting to execute a proposal that has already been executed.
- `(err u1202)`: Returned when a callback is requested from an invalid or disabled extension.
- `(err u1203)`: Returned when `set-extensions` is called with an empty list.
- `(err u1204)`: Returned when `construct` is called after the DAO has already been constructed.

---

## 11. Print Events

- `aibtc-base-dao/construct`: Emitted when the DAO is constructed.
- `aibtc-base-dao/execute`: Emitted when a proposal is executed.
- `aibtc-base-dao/set-extension`: Emitted when an extension's status is set or updated.
