# Phase 2 Analysis: 🟠 ORANGE Functions

This document contains the detailed analysis of functions categorized as ORANGE, following the risk-first approach outlined in `PLAN.md`.

---

## Function: `emergency-stop-swaps`

- **Category:** 🟠 ORANGE
- **Purpose:** A critical safety function that allows any single approver to permanently halt the `swap-btc-to-aibtc` and `swap-btc-to-aibtc-legacy` functions.
- **Parameters:** None.
- **Return Values:** `(ok true)` on success.
- **State Changes:**
    - Sets the `swaps-paused` data variable to `true`.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** The function is correctly restricted to principals who pass the `is-approver` check. This allows any of the 5 designated approvers to act unilaterally in an emergency.
- **State Integrity:**
    - **One-Way Flag:** The check `(asserts! (not (var-get swaps-paused)) ERR_ALREADY_DONE)` ensures the function is idempotent and that the paused state is permanent, as there is no corresponding "resume" function. This is a strong and simple design for an emergency circuit breaker.
- **External Call Security:** N/A.
- **Overall Logic:** The logic is extremely simple and serves its critical purpose effectively. It provides a swift, decentralized way for a minority of trusted parties to protect user funds if a vulnerability is discovered in the complex swap logic or its dependencies.

### Findings & Recommendations

- **Finding:** The function is a well-designed security feature. Its simplicity is its strength. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.

---

## Function: `set-new-operator`

- **Category:** 🟠 ORANGE
- **Purpose:** Allows the current operator to transfer their administrative role to a new principal.
- **Parameters:**
    - `new-operator principal`: The principal to become the new operator.
- **Return Values:** `(ok true)`.
- **State Changes:**
    - Sets the `current-operator` data variable to the `new-operator`.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to the `current-operator`. Only the current operator can initiate the transfer of power.
- **State Integrity:** The function executes immediately without a time-lock or confirmation step. This means a compromised operator key could lead to an instant and permanent loss of control over the contract's operational functions. There is no safeguard against typos or errors when specifying the `new-operator` address.
- **External Call Security:** N/A.
- **Overall Logic:** The logic is simple and direct. However, given the high privilege of the operator role (adding/withdrawing liquidity, setting fees), this direct transfer mechanism represents a significant point of centralization and trust.

### Findings & Recommendations

- **Finding:** The `set-new-operator` function allows for an immediate, unilateral transfer of a highly privileged role. This lacks the safety features (like time-locks) seen in other sensitive functions within this contract.
- **Recommendation:** A question will be added to `QUESTIONS.md` to ask the development team about the rationale for this design and whether a more robust succession mechanism (e.g., a two-step process with a time-lock) was considered to mitigate operational risks.

---

## Function: `set-params`

- **Category:** 🟠 ORANGE
- **Purpose:** Allows the operator to update the pool's economic parameters (`max-deposit`, `fee`, `fee-threshold`) after a signaling and cooldown period.
- **Parameters:**
    - `new-max-deposit uint`: The new maximum deposit size allowed.
    - `fee uint`: The new fee charged on deposits.
    - `fee-threshold uint`: The deposit amount threshold for applying the full vs. half fee.
- **Return Values:** `(ok true)` on success.
- **State Changes:**
    - Modifies the `pool` data variable, updating `last-updated`, `max-deposit`, `fee`, `fee-threshold`, and resetting `set-param-signaled-at` to `none`.
- **External Contract Calls:** None.

### Watchpoint Review

- **Access Control:** Correctly restricted to the `current-operator`.
- **State Integrity:**
    - **Signal/Cooldown Mechanism:** Properly enforces the `signal-set-params` and `COOLDOWN` mechanism, providing transparency and a window for users to react to changes.
    - **Input Validation:** Includes two important sanity checks:
        1.  `(asserts! (<= fee FIXED_FEE) ERR_FEE_TOO_LARGE)`: This is a critical security control that caps the fee the operator can set to a hardcoded constant. It prevents the operator from setting an abusive fee.
        2.  `(asserts! (> new-max-deposit MIN_SATS) ERR_AMOUNT_NULL)`: Ensures the maximum deposit cannot be set below the minimum deposit size, which would effectively halt the contract.
    - **State Reset:** Correctly resets `set-param-signaled-at` to `none` after execution.
- **External Call Security:** N/A.
- **Overall Logic:** The function is well-designed. It grants the operator necessary control to manage the pool's parameters while mitigating risk through a time-lock and a hardcoded fee ceiling.

### Findings & Recommendations

- **Finding:** The function is implemented securely with appropriate safeguards. No vulnerabilities were identified.
- **Recommendation:** No changes recommended.
