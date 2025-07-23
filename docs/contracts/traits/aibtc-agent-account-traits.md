# aibtc-agent-account-traits

**Source:** [`aibtc-agent-account-traits.clar`](../../../contracts/traits/aibtc-agent-account-traits.clar)

This file defines a collection of traits for smart contracts that manage agent accounts, enabling standardized interactions for deposits, proposals, swaps, and configuration.

---

## Trait: `aibtc-account`

### 1. Overview
This trait defines the standard interface for an agent account to handle deposits and withdrawals of STX and other fungible tokens (FTs).

### 2. Usage
Contracts implementing this trait provide basic treasury functions for an agent account, allowing users or other contracts to deposit and withdraw assets in a standardized way.

### 3. Required Functions
- `(deposit-stx (uint) (response bool uint))`: Deposits STX into the account.
- `(deposit-ft (<sip010-trait> uint) (response bool uint))`: Deposits a specified amount of a SIP-010 fungible token.
- `(withdraw-stx (uint) (response bool uint))`: Withdraws STX from the account.
- `(withdraw-ft (<sip010-trait> uint) (response bool uint))`: Withdraws a specified amount of a SIP-010 fungible token.

### 4. Implementations
- `aibtc-agent-account`

---

## Trait: `aibtc-account-proposals`

### 1. Overview
This trait defines the interface for an agent account to interact with a DAO's proposal and voting system.

### 2. Usage
Contracts implementing this trait allow an agent to create, vote on, veto, and conclude action-based proposals on behalf of the account owner. This is used to participate in the governance of a DAO.

### 3. Required Functions
- `(create-action-proposal (<dao-action-proposal-trait> <dao-action-trait> (buff 2048) (optional (string-ascii 1024))) (response bool uint))`: Creates a new action proposal.
- `(vote-on-action-proposal (<dao-action-proposal-trait> uint bool) (response bool uint))`: Casts a vote on an existing proposal.
- `(veto-action-proposal (<dao-action-proposal-trait> uint) (response bool uint))`: Vetoes a proposal.
- `(conclude-action-proposal (<dao-action-proposal-trait> uint <dao-action-trait>) (response bool uint))`: Concludes a proposal after the voting period has ended.

### 4. Implementations
- `aibtc-agent-account`

---

## Trait: `aibtc-account-swaps`

### 1. Overview
This trait defines an interface for an agent account to execute token swaps through a designated swap adapter.

### 2. Usage
This trait is used by an agent account to interact with different DEX protocols via a standardized adapter, allowing it to buy or sell DAO tokens.

### 3. Required Functions
- `(buy-dao-token (<aibtc-dao-swap-adapter> <sip010-trait> uint (optional uint)))`: Buys a DAO token using another token.
- `(sell-dao-token (<aibtc-dao-swap-adapter> <sip010-trait> uint (optional uint)))`: Sells a DAO token for another token.

### 4. Implementations
- `aibtc-agent-account`

---

## Trait: `aibtc-dao-swap-adapter`

### 1. Overview
This trait defines a standard interface for a swap adapter contract. Each adapter is designed to connect a DAO to a specific trading contract or DEX.

### 2. Usage
A swap adapter implements this trait to provide a consistent API for buying and selling a DAO's token. This allows the agent account to trade on different venues without needing to know the specific implementation details of each DEX.

### 3. Required Functions
- `(buy-dao-token (<sip010-trait> uint (optional uint)))`: Buys a DAO token using another token.
- `(sell-dao-token (<sip010-trait> uint (optional uint)))`: Sells a DAO token for another token.

### 4. Implementations
- `aibtc-acct-swap-bitflow-aibtc-sbtc`
- `aibtc-acct-swap-faktory-aibtc-sbtc`

---

## Trait: `aibtc-account-config`

### 1. Overview
This trait defines an interface for configuring the permissions and settings of an agent account.

### 2. Usage
This trait is implemented by an agent account to allow the owner to manage its capabilities, such as enabling or disabling proposal interactions, contract approvals, and asset trading. It also provides a way to manage a list of approved contracts that the agent can interact with.

### 3. Required Functions
- `(set-agent-can-use-proposals (bool) (response bool uint))`: Enables or disables the agent's ability to create and vote on proposals.
- `(set-agent-can-approve-revoke-contracts (bool) (response bool uint))`: Enables or disables the agent's ability to approve or revoke contracts.
- `(set-agent-can-buy-sell-assets (bool) (response bool uint))`: Enables or disables the agent's ability to trade assets.
- `(approve-contract (principal uint) (response bool uint))`: Approves a contract for interaction.
- `(revoke-contract (principal uint) (response bool uint))`: Revokes a previously approved contract.
- `(get-config () (response {account: principal, agent: principal, owner: principal, sbtc: principal} uint))`: Retrieves the core configuration of the agent account.

### 4. Implementations
- `aibtc-agent-account`
