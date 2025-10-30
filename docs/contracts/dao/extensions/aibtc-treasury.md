# aibtc-treasury

**Source:** [`aibtc-treasury.clar`](../../../../contracts/dao/extensions/aibtc-treasury.clar)

## 1. Overview

The `aibtc-treasury` is a secure contract that serves as the central treasury for the aibtcDAO. It is designed to hold and manage the DAO's funds, including the native DAO token and other approved assets. While anyone can deposit allowed assets into the treasury, withdrawals are strictly controlled and can only be initiated by the DAO or its authorized extensions. This ensures that the DAO's funds are managed transparently and securely according to the will of its members.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Marks the contract as an official extension of the aibtcDAO.
- `.aibtc-dao-traits.treasury`: Fulfills the requirements for a treasury within the aibtcDAO ecosystem.

### Used Traits
- `sip010-trait`: The standard SIP-010 trait for fungible tokens, used for all token deposit and withdrawal operations.

---

## 3. Called Contracts

- `.aibtc-base-dao`: Called to verify that sensitive function callers (e.g., for withdrawals or asset management) are either the main DAO contract or an authorized extension.
- **Any SIP-010 Token Contract**: The treasury can interact with any SIP-010 compliant token contract to transfer funds in or out.

---

## 4. Public Functions

- [`callback`](#callback): A standard callback function for receiving tokens.
- [`allow-asset`](#allow-asset): Adds or removes a token from the list of allowed assets.
- [`deposit-ft`](#deposit-ft): Deposits an amount of an allowed fungible token into the treasury.
- [`withdraw-ft`](#withdraw-ft): Withdraws an amount of a fungible token from the treasury.

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

### `allow-asset`

`(allow-asset (token principal) (enabled bool))`

**Description:**
Allows or disallows a specific fungible token to be held in the treasury. This function can only be called by the DAO or an authorized extension.

**Parameters:**
- `token` (`principal`): The contract principal of the token to allow or disallow.
- `enabled` (`bool`): `true` to allow the asset, `false` to disallow it.

**Returns:**
`(ok bool)` on success.
`(err u1900)` if the caller is not the DAO or an authorized extension.

### `deposit-ft`

`(deposit-ft (ft <sip010-trait>) (amount uint))`

**Description:**
Deposits a specified `amount` of a fungible token (`ft`) into the treasury. Anyone can call this function, but the token must be on the list of allowed assets.

**Parameters:**
- `ft` (`<sip010-trait>`): The token contract to deposit from.
- `amount` (`uint`): The amount of tokens to deposit.

**Returns:**
`(ok (response bool ...))` on a successful deposit.
`(err u1901)` if the token is not an allowed asset.

### `withdraw-ft`

`(withdraw-ft (ft <sip010-trait>) (amount uint) (to principal))`

**Description:**
Withdraws a specified `amount` of a fungible token (`ft`) from the treasury to a recipient (`to`). This is a protected function that can only be called by the DAO or an authorized extension.

**Parameters:**
- `ft` (`<sip010-trait>`): The token contract to withdraw.
- `amount` (`uint`): The amount of tokens to withdraw.
- `to` (`principal`): The recipient's address.

**Returns:**
`(ok (response bool ...))` on a successful withdrawal.
`(err u1900)` if the caller is not the DAO or an authorized extension.
`(err u1901)` if the token is not an allowed asset.

---

## 5. Read-Only Functions

- [`is-allowed-asset`](#is-allowed-asset): Checks if an asset is allowed in the treasury.
- [`get-allowed-asset`](#get-allowed-asset): Gets the allowance status for an asset.
- [`get-contract-info`](#get-contract-info): Returns contract deployment information.

---

### `is-allowed-asset`

`(is-allowed-asset (assetContract principal))`

**Description:**
Checks if a given `assetContract` is currently on the list of allowed assets for the treasury.

**Returns:**
`(bool)`: `true` if the asset is allowed, otherwise `false`.

### `get-allowed-asset`

`(get-allowed-asset (assetContract principal))`

**Description:**
Retrieves the raw boolean value from the `AllowedAssets` map for a given `assetContract`.

**Returns:**
`(optional bool)`: `(some true)` or `(some false)` if the asset has been set, otherwise `none`.

### `get-contract-info`

`(get-contract-info)`

**Description:**
Returns information about the contract's deployment, including its address and the block heights at which it was deployed.

**Returns:**
A tuple containing `self`, `deployedBurnBlock`, and `deployedStacksBlock`.

---

## 6. Data Maps

- `AllowedAssets`: A map that stores the allowance status of token contracts.
  - **Key:** `principal` (the token contract's principal).
  - **Value:** `bool` (`true` if allowed, `false` if not).

---

## 7. Errors

- `(err u1900)`: `ERR_NOT_DAO_OR_EXTENSION`. Returned when a protected function is called by an unauthorized principal.
- `(err u1901)`: `ERR_ASSET_NOT_ALLOWED`. Returned on deposit or withdrawal if the asset is not in the `AllowedAssets` map.

---

## 8. Print Events

- `aibtc-treasury/allow-asset`: Emitted when `allow-asset` is successfully called.
- `aibtc-treasury/deposit-ft`: Emitted when `deposit-ft` is successfully called.
- `aibtc-treasury/withdraw-ft`: Emitted when `withdraw-ft` is successfully called.
