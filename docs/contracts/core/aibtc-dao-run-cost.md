# aibtc-dao-run-cost

**Source:** [`aibtc-dao-run-cost.clar`](../../../contracts/core/aibtc-dao-run-cost.clar)

## 1. Overview

The `aibtc-dao-run-cost` contract serves as a treasury to hold and manage fees collected from the operation of various DAOs within the AIBTC ecosystem. Funds, typically in the form of different DAO tokens, are transferred to this contract when proposals are created. It is managed by a multi-signature scheme where a 3-of-N quorum of approved owner addresses is required to execute actions like withdrawing funds or managing contract settings. This ensures decentralized control over the collected fees.

---

## 2. Called Contracts

- **`<sip010-trait>`**: The contract calls the `transfer` function on any SIP-010 compliant fungible token that has been approved as an `AllowedAsset`. This is used to transfer funds out of the contract's treasury.

---

## 3. Public Functions

- [`set-owner`](#set-owner): Proposes and confirms adding or removing an owner address.
- [`set-asset`](#set-asset): Proposes and confirms enabling or disabling a token for use in the treasury.
- [`transfer-dao-token`](#transfer-dao-token): Proposes and confirms the transfer of a specified amount of a DAO token to a recipient.
- [`set-confirmations`](#set-confirmations): Proposes and confirms changing the number of confirmations required for proposals to pass.

---

### `set-owner`

`(set-owner (nonce uint) (who principal) (status bool))`

**Description:**
Allows an existing owner to propose and confirm a change to the list of owners. If a proposal with the given `nonce` does not exist, it creates a new one. If it exists, it confirms the proposal. Once enough owners have confirmed, the change is executed.

**Parameters:**
- `nonce` (`uint`): A unique identifier for the proposal.
- `who` (`principal`): The principal of the owner to be added or removed.
- `status` (`bool`): `true` to add the owner, `false` to remove.

**Returns:**
- `(ok bool)`: `true` if the proposal was successfully created/confirmed and executed, `false` otherwise.
- `(err uint)`: An error code if the caller is not an owner or if there is a proposal mismatch.

---

### `set-asset`

`(set-asset (nonce uint) (token principal) (enabled bool))`

**Description:**
Allows an owner to propose and confirm the addition or removal of a fungible token from the list of allowed assets. This governs which tokens can be held and transferred by this contract.

**Parameters:**
- `nonce` (`uint`): A unique identifier for the proposal.
- `token` (`principal`): The contract principal of the asset to be allowed or disallowed.
- `enabled` (`bool`): `true` to allow the asset, `false` to disallow.

**Returns:**
- `(ok bool)`: `true` if the proposal was successfully created/confirmed and executed, `false` otherwise.
- `(err uint)`: An error code if the caller is not an owner or if there is a proposal mismatch.

---

### `transfer-dao-token`

`(transfer-dao-token (nonce uint) (ft <sip010-trait>) (amount uint) (to principal))`

**Description:**
Allows an owner to propose and confirm the transfer of an allowed fungible token from the contract's balance to a specified recipient.

**Parameters:**
- `nonce` (`uint`): A unique identifier for the proposal.
- `ft` (`<sip010-trait>`): The trait of the token to be transferred.
- `amount` (`uint`): The amount of the token to transfer.
- `to` (`principal`): The recipient's principal.

**Returns:**
- `(ok bool)`: `true` if the transfer was successfully executed, `false` otherwise.
- `(err uint)`: An error code if the caller is not an owner, the asset is not allowed, or there is a proposal mismatch.

---

### `set-confirmations`

`(set-confirmations (nonce uint) (required uint))`

**Description:**
Allows an owner to propose and confirm a change to the number of owner confirmations required to execute any proposal.

**Parameters:**
- `nonce` (`uint`): A unique identifier for the proposal.
- `required` (`uint`): The new number of confirmations required.

**Returns:**
- `(ok bool)`: `true` if the change was successfully executed, `false` otherwise.
- `(err uint)`: An error code if the caller is not an owner or if there is a proposal mismatch.

---

## 4. Read-Only Functions

- `get-confirmations-required`: Returns the current number of confirmations required for proposals.
- `get-proposal-totals`: Returns the total number of proposals created for each action type.
- `is-owner`: Checks if a given principal is an owner.
- `get-set-owner-proposal`: Retrieves details of a `set-owner` proposal.
- `get-set-asset-proposal`: Retrieves details of a `set-asset` proposal.
- `get-transfer-proposal`: Retrieves details of a `transfer-dao-token` proposal.
- `get-set-confirmations-proposal`: Retrieves details of a `set-confirmations` proposal.
- `get-owner-confirmations`: Checks if the calling owner has confirmed a specific proposal.
- `owner-has-confirmed`: Checks if a specific owner has confirmed a proposal.
- `get-total-confirmations`: Returns the total number of confirmations for a proposal.
- `get-allowed-asset`: Checks if an asset is allowed.
- `is-allowed-asset`: A convenience function that returns `true` or `false` if an asset is allowed.
- `get-contract-info`: Returns basic information about the contract deployment.

---

## 5. Private Functions

- `is-confirmed`: Records a confirmation from the caller for a proposal and checks if the required threshold has been met.
- `can-execute`: Checks if a proposal is still within its valid execution window.
- `execute-set-owner`: Executes a `set-owner` proposal.
- `execute-set-asset`: Executes a `set-asset` proposal.
- `execute-transfer`: Executes a `transfer-dao-token` proposal.
- `execute-set-confirmations`: Executes a `set-confirmations` proposal.

---

## 6. Constants

- `PROPOSAL_EXPIRATION`: `u144` (approx. 24 hours). The number of blocks after which a proposal expires and can no longer be executed.
- `SET_OWNER`: `u1`. Identifier for `set-owner` proposals.
- `SET_ASSET`: `u2`. Identifier for `set-asset` proposals.
- `TRANSFER`: `u3`. Identifier for `transfer-dao-token` proposals.
- `SET_CONFIRMATIONS`: `u4`. Identifier for `set-confirmations` proposals.

---

## 7. Variables

- `confirmationsRequired`: The number of owner confirmations needed to execute a proposal. Initialized to `u3`.
- `setOwnerProposalsTotal`: A counter for the total number of `set-owner` proposals created.
- `setAssetProposalsTotal`: A counter for the total number of `set-asset` proposals created.
- `transferProposalsTotal`: A counter for the total number of `transfer-dao-token` proposals created.
- `setConfirmationsProposalsTotal`: A counter for the total number of `set-confirmations` proposals created.

---

## 8. Data Maps

- `Owners`: Stores the set of approved owner principals.
- `SetOwnerProposals`: Maps a nonce to a `set-owner` proposal's details.
- `SetAssetProposals`: Maps a nonce to a `set-asset` proposal's details.
- `TransferProposals`: Maps a nonce to a `transfer-dao-token` proposal's details.
- `SetConfirmationsProposals`: Maps a nonce to a `set-confirmations` proposal's details.
- `OwnerConfirmations`: Tracks which owners have confirmed which proposals.
- `TotalConfirmations`: Tracks the total number of confirmations for each proposal.
- `AllowedAssets`: Stores the set of approved asset contract principals.

---

## 9. Errors

- `(err u1000)`: `ERR_NOT_OWNER`. The caller is not an authorized owner.
- `(err u1001)`: `ERR_ASSET_NOT_ALLOWED`. The specified token is not on the list of allowed assets.
- `(err u1002)`: `ERR_PROPOSAL_MISMATCH`. The parameters of a confirmation call do not match the original proposal.
- `(err u1003)`: `ERR_SAVING_PROPOSAL`. An error occurred while inserting a new proposal into the map.

---

## 10. Print Events

The contract emits SIP-019 style print events for proposal creation and execution, providing visibility into the contract's operations.
- `dao-run-cost/set-owner`: Emitted when a `set-owner` proposal is created or confirmed.
- `dao-run-cost/set-asset`: Emitted when a `set-asset` proposal is created or confirmed.
- `dao-run-cost/transfer-dao-token`: Emitted when a `transfer-dao-token` proposal is created or confirmed.
- `dao-run-cost/set-confirmations`: Emitted when a `set-confirmations` proposal is created or confirmed.
- `dao-run-cost/execute-set-owner`: Emitted when a `set-owner` proposal is executed.
- `dao-run-cost/execute-set-asset`: Emitted when a `set-asset` proposal is executed.
- `dao-run-cost/execute-transfer`: Emitted when a `transfer-dao-token` proposal is executed.
- `dao-run-cost/execute-set-confirmations`: Emitted when a `set-confirmations` proposal is executed.
