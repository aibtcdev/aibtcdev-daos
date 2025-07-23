# Questions for the Development Team

This file contains questions that arise during the contract review.

## Function `get-out-value`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** The function `get-out-value` does not appear to modify any state and is used as a helper to read transaction data. Should this be a `define-read-only` function instead of a `define-public` one for clarity and to prevent it from being called in a context that implies state change?

---

## Function `add-only-liquidity`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** This function is marked as `reserved` and allows the operator to add liquidity without a cooldown, bypassing the standard `signal-add-liquidity` process. What are the specific use cases for this function? Understanding the operational need for this cooldown bypass is crucial for assessing the associated risks.
