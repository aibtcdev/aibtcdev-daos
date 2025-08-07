# aibtc-dao-traits

**Source:** [`aibtc-dao-traits.clar`](../../../contracts/traits/aibtc-dao-traits.clar)

This file is a comprehensive collection of traits that define the modular components of the AIBTC DAO framework. These traits cover core DAO functionalities, token standards, and various extensions.

---

## CORE DAO TRAITS

### Trait: `proposal`

**Overview:**
Defines a one-time action that can be executed by the DAO.

**Usage:**
Implemented by contracts that represent a single, executable proposal. Once passed through a vote, the DAO's `execute` function calls this trait to run the proposal's logic.

**Required Functions:**
- `(execute (principal) (response bool uint))`: Executes the action defined by the proposal.

**Implementations:**
- `aibtc-base-initialize-dao`

---

### Trait: `extension`

**Overview:**
Defines a standing feature of the DAO that can be called by the core contract.

**Usage:**
Implemented by contracts that add persistent functionality to a DAO, such as treasury management or user reputation. The DAO can call these extensions via `request-extension-callback`.

**Required Functions:**
- `(callback (principal (buff 34)) (response bool uint))`: The entry point for the DAO to interact with the extension.

**Implementations:**
- `aibtc-action-proposal-voting`
- `aibtc-dao-charter`
- `aibtc-dao-epoch`
- `aibtc-dao-users`
- `aibtc-onchain-messaging`
- `aibtc-rewards-account`
- `aibtc-token-owner`
- `aibtc-treasury`

---

## TOKEN TRAITS

### Trait: `bitflow-pool`

**Overview:**
Defines an interface for a decentralized Bitflow trading pool.

**Usage:**
This trait is used to interact with a Bitflow XYK pool, typically after a DAO's token has "graduated" from its initial DEX.

**Required Functions:**
- `(transfer (uint principal principal (optional (buff 34))) (response bool uint))`: Transfers pool tokens.

**Implementations:**
- `xyk-pool-sbtc-aibtc-v-1-1`

---

### Trait: `faktory-dex`

**Overview:**
Defines an interface for a decentralized exchange and initial bonding curve for a token.

**Usage:**
Implemented by a contract that manages the initial sale and liquidity of a DAO's token. It allows users to buy and sell tokens, with liquidity provided by the initial minting.

**Required Functions:**
- `(buy (<faktory-token> uint) (response bool uint))`: Buys DAO tokens.
- `(sell (<faktory-token> uint) (response bool uint))`: Sells DAO tokens.

**Implementations:**
- `aibtc-faktory-dex`

---

### Trait: `token`

**Overview:**
Defines a basic token contract for a DAO with no pre-mine or initial allocation.

**Usage:**
This trait is implemented by the DAO's primary token contract.

**Required Functions:**
- `(transfer (uint principal principal (optional (buff 34))) (response bool uint))`: Transfers tokens between principals.

**Implementations:**
- `aibtc-faktory`

---

## EXTENSION TRAITS

### Trait: `action`

**Overview:**
Defines a pre-defined, parameterized action that token holders can propose.

**Usage:**
Implemented by contracts that encapsulate a specific, reusable action, like sending a message. This allows for governance proposals that are more constrained and predictable than arbitrary code execution.

**Required Functions:**
- `(run ((buff 2048)) (response bool uint))`: Executes the action with the given parameters.
- `(check-parameters ((buff 2048)) (response bool uint))`: Validates the parameters for the action.

**Implementations:**
- `aibtc-action-send-message`

---

### Trait: `action-proposal-voting`

**Overview:**
Defines an interface for a contract that manages voting on whitelisted, pre-defined actions.

**Usage:**
Implemented by an extension that allows DAO members to propose, vote on, and execute `action` contracts.

**Required Functions:**
- `(create-action-proposal (<action> (buff 2048) (optional (string-ascii 1024))) (response bool uint))`: Creates a new proposal for an action.
- `(vote-on-action-proposal (uint bool) (response bool uint))`: Casts a vote on a proposal.
- `(veto-action-proposal (uint) (response bool uint))`: Vetoes a proposal.
- `(conclude-action-proposal (uint <action>) (response bool uint))`: Concludes a proposal and triggers its execution if passed.

**Implementations:**
- `aibtc-action-proposal-voting`

---

### Trait: `dao-charter`

**Overview:**
Defines an interface for managing a DAO's charter and mission on-chain.

**Usage:**
Implemented by an extension that allows the DAO to set and update its charter, providing a public record of its values and goals.

**Required Functions:**
- `(set-dao-charter ((string-utf8 16384)) (response bool uint))`: Sets the content of the DAO charter.

**Implementations:**
- `aibtc-dao-charter`

---

### Trait: `dao-epoch`

**Overview:**
Defines an interface for an extension that tracks the current epoch of the DAO.

**Usage:**
Implemented by an extension to provide a sense of time and cycles for the DAO's operations.

**Required Functions:**
- `(get-current-dao-epoch () (response uint uint))`: Returns the current epoch number.
- `(get-dao-epoch-length () (response uint uint))`: Returns the length of an epoch in blocks.

**Implementations:**
- `aibtc-dao-epoch`

---

### Trait: `dao-users`

**Overview:**
Defines an interface for an extension that tracks users and their reputation within the DAO.

**Usage:**
Implemented by an extension to manage user profiles and reputation scores, which can be used in governance or reward mechanisms.

**Required Functions:**
- `(get-or-create-user-index (principal) (response uint uint))`: Retrieves or creates a unique index for a user.
- `(increase-user-reputation (principal uint) (response bool uint))`: Increases a user's reputation score.
- `(decrease-user-reputation (principal uint) (response bool uint))`: Decreases a user's reputation score.

**Implementations:**
- `aibtc-dao-users`

---

### Trait: `messaging`

**Overview:**
Defines an interface for a contract used by the DAO to send verified on-chain messages.

**Usage:**
Implemented by an extension to allow the DAO to broadcast messages, which can be used for announcements or inter-contract communication.

**Required Functions:**
- `(send ((string-utf8 10000)) (response bool uint))`: Sends a message.

**Implementations:**
- `aibtc-onchain-messaging`

---

### Trait: `rewards-account`

**Overview:**
Defines an interface for an extension that holds and distributes rewards from the DAO treasury.

**Usage:**
Implemented by an extension to manage reward payments to users for contributions, such as successful proposals.

**Required Functions:**
- `(transfer-reward (principal uint) (response bool uint))`: Transfers a reward of a specific token to a user.

**Implementations:**
- `aibtc-rewards-account`

---

### Trait: `token-owner`

**Overview:**
Defines an interface for an extension that manages the DAO's token contract on behalf of the DAO.

**Usage:**
Implemented by an extension to give the DAO administrative control over its own token contract, allowing it to perform actions normally restricted to the deployer, such as setting the token URI or transferring ownership.

**Required Functions:**
- `(set-token-uri ((string-utf8 256)) (response bool uint))`: Sets the URI for the token's metadata.
- `(transfer-ownership (principal) (response bool uint))`: Transfers ownership of the token contract.

**Implementations:**
- `aibtc-token-owner`

---

### Trait: `treasury`

**Overview:**
Defines an interface for an extension that manages the DAO's treasury.

**Usage:**
Implemented by an extension to handle the DAO's finances, including managing allowed assets and processing deposits and withdrawals. It is designed to work with other extensions like the rewards account.

**Required Functions:**
- `(allow-asset (principal bool) (response bool uint))`: Whitelists or removes an asset from the treasury.
- `(deposit-ft (<ft-trait> uint) (response bool uint))`: Deposits a fungible token into the treasury.
- `(withdraw-ft (<ft-trait> uint principal) (response bool uint))`: Withdraws a fungible token from the treasury.

**Implementations:**
- `aibtc-treasury`
