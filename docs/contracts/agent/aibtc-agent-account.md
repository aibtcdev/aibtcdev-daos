# aibtc-agent-account

**Source:** [`aibtc-agent-account.clar`](../../../contracts/agent/aibtc-agent-account.clar)

## 1. Overview

The `aibtc-agent-account` is a specialized smart contract that functions as a personal account, managed by both a primary `owner` (the user) and a designated `agent`. This structure allows the agent to perform specific, permissioned actions on behalf of the owner, such as participating in DAO proposals or trading assets. The owner retains ultimate control, particularly over withdrawing funds, ensuring asset security. The contract is designed to be highly configurable, allowing the owner to grant or revoke specific permissions for the agent.

---

## 2. Traits

### Implemented Traits
- `.aibtc-agent-account-traits.aibtc-account`: Core account functionalities.
- `.aibtc-agent-account-traits.aibtc-account-proposals`: Functions for interacting with DAO proposals.
- `.aibtc-agent-account-traits.aibtc-account-config`: Configuration and permission management.
- `.aibtc-agent-account-traits.aibtc-account-swaps`: Asset trading functionalities.

### Used Traits
- `sip-010-trait`: Standard for fungible tokens.
- `.aibtc-agent-account-traits.aibtc-dao-swap-adapter`: Interface for a token swap adapter.
- `.aibtc-dao-traits.action`: Interface for a DAO action.
- `.aibtc-dao-traits.proposal`: Interface for a DAO proposal.
- `.aibtc-dao-traits.action-proposal-voting`: Interface for voting on action proposals.

---

## 3. Called Contracts

- **Fungible Token Contracts (`<ft-trait>`)**: Used to deposit and withdraw various SIP-010 tokens.
- **Voting Contracts (`<action-proposal-voting-trait>`)**: Interacts with DAO proposal contracts to create, vote on, veto, and conclude proposals.
- **Swap Adapter Contracts (`<dao-swap-adapter>`)**: Interacts with DEX adapters to buy and sell DAO tokens.

---

## 4. Public Functions

- [`deposit-stx`](#deposit-stx): Deposits STX into the contract.
- [`deposit-ft`](#deposit-ft): Deposits a specified fungible token into the contract.
- [`withdraw-stx`](#withdraw-stx): Allows the owner to withdraw STX from the contract.
- [`withdraw-ft`](#withdraw-ft): Allows the owner to withdraw an approved fungible token.
- [`create-action-proposal`](#create-action-proposal): Creates a DAO proposal via an approved voting contract.
- [`vote-on-action-proposal`](#vote-on-action-proposal): Votes on a DAO proposal.
- [`veto-action-proposal`](#veto-action-proposal): Vetoes a DAO proposal.
- [`conclude-action-proposal`](#conclude-action-proposal): Concludes a DAO proposal.
- [`buy-dao-token`](#buy-dao-token): Buys a DAO token via an approved swap adapter.
- [`sell-dao-token`](#sell-dao-token): Sells a DAO token via an approved swap adapter.
- [`set-agent-can-deposit-assets`](#set-agent-can-deposit-assets): Owner sets permission for the agent to deposit assets.
- [`set-agent-can-use-proposals`](#set-agent-can-use-proposals): Owner sets permission for the agent to use proposals.
- [`set-agent-can-approve-revoke-contracts`](#set-agent-can-approve-revoke-contracts): Owner sets permission for the agent to manage contract approvals.
- [`set-agent-can-buy-sell-assets`](#set-agent-can-buy-sell-assets): Owner sets permission for the agent to trade assets.
- [`approve-contract`](#approve-contract): Approves a contract for a specific type of interaction.
- [`revoke-contract`](#revoke-contract): Revokes approval for a contract.
- [`get-config`](#get-config): A helper function to retrieve the account configuration via the trait.

---

### `deposit-stx`
`(deposit-stx (amount uint))`
- **Description:** Deposits a specified amount of STX into the agent account. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `amount` (`uint`): The amount of STX to deposit.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `deposit-ft`
`(deposit-ft (ft <ft-trait>) (amount uint))`
- **Description:** Deposits a specified amount of a fungible token into the agent account. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `ft` (`<ft-trait>`): The fungible token contract to deposit.
  - `amount` (`uint`): The amount of the token to deposit.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `withdraw-stx`
`(withdraw-stx (amount uint))`
- **Description:** Withdraws a specified amount of STX from the agent account to the owner's address. Can only be called by the owner.
- **Parameters:**
  - `amount` (`uint`): The amount of STX to withdraw.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `withdraw-ft`
`(withdraw-ft (ft <ft-trait>) (amount uint))`
- **Description:** Withdraws a specified amount of an approved fungible token to the owner's address. Can only be called by the owner.
- **Parameters:**
  - `ft` (`<ft-trait>`): The fungible token contract to withdraw.
  - `amount` (`uint`): The amount of the token to withdraw.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `create-action-proposal`
`(create-action-proposal (votingContract <action-proposal-voting-trait>) (action <action-trait>) (parameters (buff 2048)) (memo (optional (string-ascii 1024))))`
- **Description:** Creates a new action proposal by calling an approved voting contract. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `votingContract`: The proposal voting contract to use.
  - `action`: The action contract to be executed.
  - `parameters`: The parameters for the action.
  - `memo`: An optional memo for the proposal.
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `vote-on-action-proposal`
`(vote-on-action-proposal (votingContract <action-proposal-voting-trait>) (proposalId uint) (vote bool))`
- **Description:** Votes on an existing action proposal. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `votingContract`: The proposal voting contract.
  - `proposalId` (`uint`): The ID of the proposal to vote on.
  - `vote` (`bool`): The vote (`true` for 'yes', `false` for 'no').
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `veto-action-proposal`
`(veto-action-proposal (votingContract <action-proposal-voting-trait>) (proposalId uint))`
- **Description:** Vetoes an action proposal. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `votingContract`: The proposal voting contract.
  - `proposalId` (`uint`): The ID of the proposal to veto.
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `conclude-action-proposal`
`(conclude-action-proposal (votingContract <action-proposal-voting-trait>) (proposalId uint) (action <action-trait>))`
- **Description:** Concludes an action proposal. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `votingContract`: The proposal voting contract.
  - `proposalId` (`uint`): The ID of the proposal to conclude.
  - `action`: The action contract associated with the proposal.
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `buy-dao-token`
`(buy-dao-token (swapAdapter <dao-swap-adapter>) (daoToken <ft-trait>) (amount uint) (minReceive (optional uint)))`
- **Description:** Buys a DAO token using an approved swap adapter. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `swapAdapter`: The swap adapter contract.
  - `daoToken`: The DAO token to buy.
  - `amount` (`uint`): The amount of sBTC to spend.
  - `minReceive` (`(optional uint)`): The minimum amount of DAO tokens to receive.
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `sell-dao-token`
`(sell-dao-token (swapAdapter <dao-swap-adapter>) (daoToken <ft-trait>) (amount uint) (minReceive (optional uint)))`
- **Description:** Sells a DAO token using an approved swap adapter. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `swapAdapter`: The swap adapter contract.
  - `daoToken`: The DAO token to sell.
  - `amount` (`uint`): The amount of DAO tokens to sell.
  - `minReceive` (`(optional uint)`): The minimum amount of sBTC to receive.
- **Returns:** `(ok response)` on success, `(err uint)` on failure.

### `set-agent-can-deposit-assets`
`(set-agent-can-deposit-assets (canDeposit bool))`
- **Description:** Enables or disables the agent's permission to deposit assets. Owner only.
- **Parameters:**
  - `canDeposit` (`bool`): The new permission status.
- **Returns:** `(ok bool)`.

### `set-agent-can-use-proposals`
`(set-agent-can-use-proposals (canUseProposals bool))`
- **Description:** Enables or disables the agent's permission to interact with proposals. Owner only.
- **Parameters:**
  - `canUseProposals` (`bool`): The new permission status.
- **Returns:** `(ok bool)`.

### `set-agent-can-approve-revoke-contracts`
`(set-agent-can-approve-revoke-contracts (canApproveRevokeContracts bool))`
- **Description:** Enables or disables the agent's permission to approve or revoke contracts. Owner only.
- **Parameters:**
  - `canApproveRevokeContracts` (`bool`): The new permission status.
- **Returns:** `(ok bool)`.

### `set-agent-can-buy-sell-assets`
`(set-agent-can-buy-sell-assets (canBuySell bool))`
- **Description:** Enables or disables the agent's permission to buy or sell assets. Owner only.
- **Parameters:**
  - `canBuySell` (`bool`): The new permission status.
- **Returns:** `(ok bool)`.

### `approve-contract`
`(approve-contract (contract principal) (type uint))`
- **Description:** Approves a contract for a specific interaction type (voting, swap, or token). Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `contract` (`principal`): The contract to approve.
  - `type` (`uint`): The type of approval (`u1` for voting, `u2` for swap, `u3` for token).
- **Returns:** `(ok bool)`.

### `revoke-contract`
`(revoke-contract (contract principal) (type uint))`
- **Description:** Revokes a contract's approval. Can be called by the owner or the agent (if permitted).
- **Parameters:**
  - `contract` (`principal`): The contract to revoke.
  - `type` (`uint`): The type of approval to revoke.
- **Returns:** `(ok bool)`.

### `get-config`
`(get-config)`
- **Description:** A wrapper function that returns the contract's configuration object.
- **Returns:** `(ok {account: principal, agent: principal, owner: principal, sbtc: principal})`.

---

## 5. Read-Only Functions

- [`is-approved-contract`](#is-approved-contract): Checks if a contract is approved for a given interaction type.
- [`get-configuration`](#get-configuration): Returns the core configuration of the account.
- [`get-approval-types`](#get-approval-types): Returns the constant values for approval types.
- [`get-agent-permissions`](#get-agent-permissions): Returns the agent's current permissions.

---

### `is-approved-contract`
`(is-approved-contract (contract principal) (type uint))`
- **Description:** Checks if a contract is approved for a specific interaction type.
- **Returns:** `(response bool bool)`.

### `get-configuration`
`(get-configuration)`
- **Description:** Returns the core addresses associated with the account.
- **Returns:** `{account: principal, agent: principal, owner: principal, sbtc: principal}`.

### `get-approval-types`
`(get-approval-types)`
- **Description:** Returns the numeric constants used for contract approval types.
- **Returns:** `{proposalVoting: uint, swap: uint, token: uint}`.

### `get-agent-permissions`
`(get-agent-permissions)`
- **Description:** Returns a tuple of the agent's current permissions.
- **Returns:** `{canApproveRevokeContracts: bool, canBuySell: bool, canDeposit: bool, canUseProposals: bool}`.

---

## 6. Private Functions

- [`is-owner`](#is-owner): Checks if the caller is the account owner.
- [`is-agent`](#is-agent): Checks if the caller is the agent.
- [`is-valid-type`](#is-valid-type): Validates an approval type integer.
- [`deposit-allowed`](#deposit-allowed): Checks if the caller has permission to deposit.
- [`use-proposals-allowed`](#use-proposals-allowed): Checks if the caller has permission to use proposals.
- [`approve-revoke-contract-allowed`](#approve-revoke-contract-allowed): Checks if the caller has permission to manage approvals.
- [`buy-sell-assets-allowed`](#buy-sell-assets-allowed): Checks if the caller has permission to trade assets.

---

## 7. Constants

- `ACCOUNT_OWNER`: The principal of the user who owns the account.
- `ACCOUNT_AGENT`: The principal of the agent authorized to act on the owner's behalf.
- `SBTC_TOKEN`: The contract principal of the sBTC token.
- `APPROVED_CONTRACT_VOTING (u1)`: The type for a voting contract approval.
- `APPROVED_CONTRACT_SWAP (u2)`: The type for a swap contract approval.
- `APPROVED_CONTRACT_TOKEN (u3)`: The type for a token contract approval.

---

## 8. Variables

- `agentCanDepositAssets`: (`bool`) Controls if the agent can deposit assets.
- `agentCanUseProposals`: (`bool`) Controls if the agent can interact with DAO proposals.
- `agentCanApproveRevokeContracts`: (`bool`) Controls if the agent can manage contract approvals.
- `agentCanBuySellAssets`: (`bool`) Controls if the agent can trade assets.

---

## 9. Data Maps

- `ApprovedContracts`: Maps a `{contract: principal, type: uint}` tuple to a boolean, indicating whether a contract is approved for a specific purpose.

---

## 10. Errors

- `(err u1100)`: `ERR_CALLER_NOT_OWNER` - The caller is not the owner.
- `(err u1101)`: `ERR_CONTRACT_NOT_APPROVED` - The contract being interacted with is not approved.
- `(err u1103)`: `ERR_OPERATION_NOT_ALLOWED` - The caller does not have permission for the action.
- `(err u1104)`: `ERR_INVALID_APPROVAL_TYPE` - The provided approval type is not valid.

---

## 11. Print Events

This contract emits SIP-019 style print events for all major actions, including deposits, withdrawals, proposal interactions, trades, and permission changes. The event `notification` field follows the format `aibtc-agent-account/[function-name]`.
- `user-agent-account-created`: Emitted upon contract deployment with the initial configuration.
- `deposit-stx`, `deposit-ft`: Emitted when assets are deposited.
- `withdraw-stx`, `withdraw-ft`: Emitted when assets are withdrawn by the owner.
- `create-action-proposal`, `vote-on-action-proposal`, `veto-action-proposal`, `conclude-action-proposal`: Emitted for DAO proposal interactions.
- `buy-dao-token`, `sell-dao-token`: Emitted when assets are traded.
- `set-agent-can-*`: Emitted when agent permissions are changed.
- `approve-contract`, `revoke-contract`: Emitted when contract approvals are changed.
