# Phase 2 Analysis: 🟡 YELLOW Functions

This document contains the detailed analysis of functions categorized as YELLOW, following the risk-first approach outlined in `PLAN.md`.

---

## Function: `propose-allowlist-dexes`

- **Category:** 🟡 YELLOW
- **Purpose:** Allows a designated approver to initiate a multi-signature proposal to add a new DEX, its token, and its liquidity pool to the contract's allowlist.
- **Parameters:**
    - `ft <faktory-token>`: The fungible token contract of the DEX.
    - `dex-contract <faktory-dex>`: The DEX contract itself.
    - `pool-contract <bitflow-pool>`: The associated liquidity pool contract.
- **Return Values:** `(ok proposal-id)` on success.
- **State Changes:**
    - `allowlist-proposals`: A new proposal is created and stored with a unique ID.
    - `proposal-signals`: The proposer's vote is automatically recorded as the first signal.
    - `next-proposal-id`: Incremented.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to approvers via `(asserts! (is-approver tx-sender) ERR_NOT_APPROVER)`.
- **State Integrity:** The function securely creates a new proposal, setting its `proposed-at` height, initializing signals to `u1`, and storing the relevant contract principals. The logic is sound for initiating a governance action.
- **External Call Security:** N/A.
- **Overall Logic:** This is a standard and secure implementation of a proposal creation function within a multi-signature governance framework.

### Findings & Recommendations

- **Finding:** The function is implemented correctly and securely. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.

---

## Function: `signal-allowlist-approval`

- **Category:** 🟡 YELLOW
- **Purpose:** Allows an approver to cast a vote for an active DEX allowlist proposal. If the signal threshold is met, it automatically executes the proposal, adding the DEX to the allowlist.
- **Parameters:**
    - `proposal-id uint`: The ID of the proposal to signal.
- **Return Values:** `(ok new-signals)` on success.
- **State Changes:**
    - `proposal-signals`: Records the approver's signal to prevent duplicate voting.
    - `allowlist-proposals`: Increments the signal count and, if the threshold is met, marks the proposal as `executed: true`.
    - `allowed-dexes`: If the proposal is executed, the set of contracts is added to this map, officially allowlisting them.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to approvers.
- **State Integrity:**
    - **Proposal Checks:** The function includes a robust set of assertions to ensure the proposal is valid for voting: it must exist, not be expired, not already executed, and the approver must not have already signaled.
    - **Execution Logic:** The auto-execution that occurs when `new-signals` reaches `SIGNALS_REQUIRED` is an efficient pattern. It correctly populates the `allowed-dexes` map, which is the ultimate goal of the proposal process.
- **External Call Security:** N/A.
- **Overall Logic:** The function provides a secure mechanism for the multi-signature approval and execution of governance proposals.

### Findings & Recommendations

- **Finding:** The function is implemented securely with all necessary checks for a multi-signature voting system. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.

---

## Function: `signal-add-liquidity`

- **Category:** 🟡 YELLOW
- **Purpose:** Allows the operator to signal their intent to add liquidity to the pool. This is the first step in a two-step, time-locked process.
- **Parameters:** None.
- **Return Values:** `(ok true)`.
- **State Changes:**
    - Modifies the `pool` data variable, setting `add-liq-signaled-at` to the current `burn-block-height`.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to the `current-operator`.
- **State Integrity:** The function simply sets a timestamp in the `pool` variable. This is a safe and transparent way to initiate a privileged action. It does not overwrite an existing signal, which is acceptable as re-signaling would just refresh the timer.
- **External Call Security:** N/A.
- **Overall Logic:** The function is a secure and necessary part of the time-locked liquidity addition process.

### Findings & Recommendations

- **Finding:** The function is implemented correctly. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.

---

## Function: `signal-set-params`

- **Category:** 🟡 YELLOW
- **Purpose:** Allows the operator to signal their intent to change the pool's parameters. This is the first step in a two-step, time-locked process.
- **Parameters:** None.
- **Return Values:** `(ok true)`.
- **State Changes:**
    - Modifies the `pool` data variable, setting `set-param-signaled-at` to the current `burn-block-height`.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to the `current-operator`.
- **State Integrity:** Similar to `signal-add-liquidity`, this function safely records the operator's intent by setting a timestamp, initiating the cooldown period before parameters can be changed.
- **External Call Security:** N/A.
- **Overall Logic:** The function is a secure and necessary part of the time-locked parameter update process.

### Findings & Recommendations

- **Finding:** The function is implemented correctly. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.
