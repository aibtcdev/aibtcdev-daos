# Questions for the Development Team

This file contains questions that arise during the contract review.

## Function `get-out-value`

- **File:** `contracts/dao/trading/btc2aibtc-bridge.clar`
- **Question:** The function `get-out-value` does not appear to modify any state and is used as a helper to read transaction data. Should this be a `define-read-only` function instead of a `define-public` one for clarity and to prevent it from being called in a context that implies state change?
