# Questions for the Development Team

This file contains questions that arise during the contract review.

## Function `get-out-value`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** The function `get-out-value` does not appear to modify any state and is used as a helper to read transaction data. Should this be a `define-read-only` function instead of a `define-public` one for clarity and to prevent it from being called in a context that implies state change?

---

## Function `add-only-liquidity`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** This function is marked as `reserved` and allows the operator to add liquidity without a cooldown, bypassing the standard `signal-add-liquidity` process. What are the specific use cases for this function? Understanding the operational need for this cooldown bypass is crucial for assessing the associated risks.

---

## Function `process-btc-deposit` and other processing functions

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** The functions `process-btc-deposit`, `process-btc-deposit-legacy`, `swap-btc-to-aibtc`, and `swap-btc-to-aibtc-legacy` all include the check `(asserts! (> burn-block-height (+ (get last-updated current-pool) COOLDOWN)) ERR_IN_COOLDOWN)`. The `last-updated` variable is only modified by operator actions like `add-liquidity-to-pool` and `set-params`. This seems to create a global cooldown on all user-facing processing functions after any operator action. Is this the intended behavior, and if so, what is the purpose of this mechanism?

---

## Function `swap-btc-to-aibtc` and `swap-btc-to-aibtc-legacy`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** These functions resolve the user's principal to an `ai-account` via `(contract-call? .register-ai-account get-ai-account-by-owner ...)`. The resulting tokens (or sBTC refund) are then sent to this `ai-account` rather than the original principal. What is the design rationale for this? Does this imply a user must create an `ai-account` before they can use the swap functionality?

---

## Function `set-new-operator`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** The function allows the current operator to immediately transfer their role to a new principal. Given the sensitivity of the operator role, was a more robust succession mechanism, such as a two-step process involving a time-lock (e.g., `propose-new-operator` and `accept-operator-role`), considered? This would provide a window to react to a compromised key and protect against accidental transfers to an incorrect address.
