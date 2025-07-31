# aibtc-action-proposal-voting

**Source:** [`aibtc-action-proposal-voting.clar`](../../../../contracts/dao/extensions/aibtc-action-proposal-voting.clar)

## 1. Overview

The `aibtc-action-proposal-voting` contract is a DAO extension that enables token holders to create, vote on, and execute proposals for predefined on-chain actions. It manages the entire lifecycle of a proposal, from creation and bonding to voting, conclusion, and execution. Voting power is determined by the user's balance of the DAO's governance token at the time the proposal was created. The contract includes mechanisms for quorum, threshold, veto periods, and rewards for successful proposals.

---

## 2. Traits

### Implemented Traits
- `.aibtc-dao-traits.extension`: Marks the contract as a valid DAO extension.
- `.aibtc-dao-traits.action-proposal-voting`: Implements the standard interface for action-based proposal voting.

### Used Traits
- `.aibtc-dao-traits.action`: Interface for a DAO action that can be proposed and executed.

---

## 3. Called Contracts

- `.aibtc-base-dao`: To verify that this contract and the proposed action are active extensions.
- `.aibtc-dao-users`: To get or create user records and update user reputation based on proposal outcomes.
- `.aibtc-faktory`: The DAO's governance token contract, used to check balances for voting power and transfer proposal bonds.
- `.aibtc-treasury`: The DAO treasury, which receives bonds from failed proposals.
- `.aibtc-dao-run-cost`: A contract that receives a fee for the operational cost of creating a proposal.
- `.aibtc-rewards-account`: A contract that holds and distributes rewards for successfully executed proposals.
- **Action Contracts (`<action-trait>`)**: Any contract implementing the action trait that is proposed for execution.

---

## 4. Public Functions

- [`callback`](#callback): A standard callback function for receiving token transfers.
- [`create-action-proposal`](#create-action-proposal): Creates a new proposal to execute a specific on-chain action.
- [`vote-on-action-proposal`](#vote-on-action-proposal): Allows token holders to cast votes on an active proposal.
- [`veto-action-proposal`](#veto-action-proposal): Allows token holders to veto a proposal after voting has ended but before it can be executed.
- [`conclude-action-proposal`](#conclude-action-proposal): Concludes a proposal, tallies votes, and executes the action if it passed.

---

### `callback`
`(callback (sender principal) (memo (buff 34)))`
- **Description:** A standard SIP-010 callback function, which simply returns `(ok true)`. It allows the contract to receive tokens.
- **Returns:** `(ok true)`.

### `create-action-proposal`
`(create-action-proposal (action <action-trait>) (parameters (buff 2048)) (memo (optional (string-ascii 1024))))`
- **Description:** Creates a new proposal. The creator must post a bond, which is returned if the proposal passes and forfeited to the treasury if it fails. A fee is also paid to the `aibtc-dao-run-cost` contract.
- **Parameters:**
  - `action` (`<action-trait>`): The action contract to be executed.
  - `parameters` (`(buff 2048)`): The parameters to pass to the action contract.
  - `memo` (`(optional (string-ascii 1024))`): An optional description for the proposal.
- **Returns:** `(ok uint)` with the new proposal ID on success, or `(err uint)` on failure.

### `vote-on-action-proposal`
`(vote-on-action-proposal (proposalId uint) (vote bool))`
- **Description:** Casts a vote on an active proposal. Voting power is based on the voter's token balance at the block the proposal was created. Voters can change their vote while the voting period is active.
- **Parameters:**
  - `proposalId` (`uint`): The ID of the proposal.
  - `vote` (`bool`): The vote (`true` for 'yes', `false` for 'no').
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `veto-action-proposal`
`(veto-action-proposal (proposalId uint))`
- **Description:** Casts a veto vote against a proposal. This can only be done during the "execution delay" period between the end of voting and the start of the execution window. A proposal is successfully vetoed if the total veto votes meet quorum and exceed the total 'yes' votes.
- **Parameters:**
  - `proposalId` (`uint`): The ID of the proposal to veto.
- **Returns:** `(ok bool)` on success, `(err uint)` on failure.

### `conclude-action-proposal`
`(conclude-action-proposal (proposalId uint) (action <action-trait>))`
- **Description:** Finalizes a proposal after its voting and delay periods have passed. It checks if the proposal met the quorum and threshold requirements. If it passed, the creator's bond is returned, their reputation is increased, and the proposed action is executed. If it failed, the bond is sent to the treasury and the creator's reputation is decreased.
- **Parameters:**
  - `proposalId` (`uint`): The ID of the proposal to conclude.
  - `action` (`<action-trait>`): The action contract, passed again for validation.
- **Returns:** `(ok bool)` indicating if the action was successfully executed (`true`) or not (`false`).

---

## 5. Read-Only Functions

- [`get-voting-power`](#get-voting-power): Gets a voter's token balance at the time a proposal was created.
- [`get-proposal`](#get-proposal): Retrieves all data associated with a proposal.
- [`get-vote-record`](#get-vote-record): Gets a user's vote for a specific proposal.
- [`get-veto-vote-record`](#get-veto-vote-record): Gets a user's veto vote for a specific proposal.
- [`get-vote-records`](#get-vote-records): A helper to get both vote and veto records for a user.
- [`get-total-proposals`](#get-total-proposals): Returns proposal count statistics.
- [`get-voting-configuration`](#get-voting-configuration): Returns the contract's voting parameters.
- [`get-liquid-supply`](#get-liquid-supply): Calculates the liquid token supply at a given block height.

---

### `get-voting-power`
`(get-voting-power (proposalId uint) (voter principal))`
- **Returns:** `(ok uint)` with the voter's balance, or `(err uint)` on failure.

### `get-proposal`
`(get-proposal (proposalId uint))`
- **Returns:** `(optional { ... })` containing the merged proposal details, blocks, and records.

### `get-vote-record`
`(get-vote-record (proposalId uint) (voter principal))`
- **Returns:** `(optional {amount: uint, vote: bool})`.

### `get-veto-vote-record`
`(get-veto-vote-record (proposalId uint) (voter principal))`
- **Returns:** `(optional uint)` representing the veto vote amount.

### `get-vote-records`
`(get-vote-records (proposalId uint) (voter principal))`
- **Returns:** `{vetoVoteRecord: (optional uint), voteRecord: (optional {amount: uint, vote: bool})}`.

### `get-total-proposals`
`(get-total-proposals)`
- **Returns:** `{concludedProposalCount: uint, executedProposalCount: uint, lastProposalBitcoinBlock: uint, lastProposalStacksBlock: uint, proposalCount: uint}`.

### `get-voting-configuration`
`(get-voting-configuration)`
- **Returns:** A tuple with all voting configuration constants.

### `get-liquid-supply`
`(get-liquid-supply (blockHeight uint))`
- **Returns:** `(ok uint)` with the liquid supply, or `(err uint)` on failure.

---

## 6. Private Functions

- [`is-dao-or-extension`](#is-dao-or-extension): Checks if the caller is the core DAO or an approved extension.
- [`is-action-valid`](#is-action-valid): Checks if both this contract and the proposed action contract are active extensions.
- [`get-block-hash`](#get-block-hash): A helper to retrieve a block hash by its height.

---

## 7. Constants

- `VOTING_QUORUM (u15)`: 15% of the liquid supply must vote for a proposal to be valid.
- `VOTING_THRESHOLD (u66)`: 66% of votes must be in favor for a proposal to pass.
- `VOTING_BOND (u50000000000)`: The amount of DAO tokens required to create a proposal.
- `VOTING_REWARD (u100000000000)`: The reward paid to the creator of a successful proposal.
- `VOTING_DELAY (u144)`: The number of blocks after creation before voting can begin (~24 hours).
- `VOTING_PERIOD (u288)`: The duration of the voting period in blocks (~48 hours).
- `REPUTATION_CHANGE (u1)`: The amount of reputation a user gains or loses from a proposal outcome.

---

## 8. Variables

- `proposalCount`: A counter for the total number of proposals created.
- `concludedProposalCount`: A counter for the number of concluded proposals.
- `executedProposalCount`: A counter for the number of executed proposals.
- `lastProposalStacksBlock`: The Stacks block height of the last proposal.
- `lastProposalBitcoinBlock`: The Bitcoin block height of the last proposal.

---

## 9. Data Maps

- `ProposalDetails`: Stores the core, static details of a proposal (action, parameters, creator, etc.).
- `ProposalBlocks`: Stores the block heights for key phases of a proposal's lifecycle (created, vote start/end, etc.).
- `ProposalRecords`: Stores the dynamic state of a proposal (vote counts, conclusion status, etc.).
- `VoteRecords`: Records each user's vote on a proposal.
- `VetoVoteRecords`: Records each user's veto vote on a proposal.

---

## 10. Errors

- `(err u1300)`: `ERR_NOT_DAO_OR_EXTENSION`
- `(err u1301)`: `ERR_FETCHING_TOKEN_DATA`
- `(err u1302)`: `ERR_INSUFFICIENT_BALANCE`
- `(err u1303)`: `ERR_PROPOSAL_NOT_FOUND`
- `(err u1304)`: `ERR_PROPOSAL_VOTING_ACTIVE`
- `(err u1305)`: `ERR_PROPOSAL_EXECUTION_DELAY`
- `(err u1306)`: `ERR_PROPOSAL_RATE_LIMIT`
- `(err u1307)`: `ERR_SAVING_PROPOSAL`
- `(err u1308)`: `ERR_PROPOSAL_ALREADY_CONCLUDED`
- `(err u1309)`: `ERR_RETRIEVING_START_BLOCK_HASH`
- `(err u1310)`: `ERR_VOTE_TOO_SOON`
- `(err u1311)`: `ERR_VOTE_TOO_LATE`
- `(err u1312)`: `ERR_ALREADY_VOTED`
- `(err u1313)`: `ERR_INVALID_ACTION`

---

## 11. Print Events

- `create-action-proposal`: Emitted when a new proposal is created.
- `vote-on-action-proposal`: Emitted when a vote is cast.
- `veto-action-proposal`: Emitted when a veto vote is cast.
- `conclude-action-proposal`: Emitted when a proposal is concluded, containing the final outcome.
