# Phase 2 Analysis: 🟢 GREEN Functions

This document contains the detailed analysis of functions categorized as GREEN. These are primarily read-only functions, helpers, and state getters that pose a low risk.

---

## Governance & Approver Helpers

These functions provide read-only access to governance state.

- **`is-approver`**: Securely checks a principal against a hardcoded list. Correctly implemented.
- **`are-swaps-paused`**: Safely returns the boolean `swaps-paused` variable. Correctly implemented.
- **`get-dex-allowed`**: Safely returns data for an allowlisted DEX from the `allowed-dexes` map. Correctly implemented.
- **`get-allowlist-proposal`**: Safely returns data for a specific proposal from the `allowlist-proposals` map. Correctly implemented.
- **`has-signaled`**: Safely checks the `proposal-signals` map to see if an approver has voted. Correctly implemented.

### Findings & Recommendations
These functions are simple, secure, and correctly implemented. No changes recommended.

---

## BTC Parsing Helpers

These functions are helpers for parsing data from BTC transaction buffers. Their security depends on the correctness of the underlying Clarity Bitcoin library and Clarity's own buffer manipulation functions.

- **`read-uint64`**: A `read-only` helper for parsing a 64-bit unsigned integer from a buffer. Appears correct.
- **`find-out`**: A `private` helper function used by `get-out-value` to locate a specific output script in a list of outputs. Its logic is simple and appears correct.
- **`get-out-value`**: A `public` function that iterates through transaction outputs to find one matching a given script.
    - **Finding:** As noted in `QUESTIONS.md`, this function performs no state changes and should be `define-read-only` instead of `define-public`. This would prevent it from being called in a context that implies a state change and make its intent clearer.
- **`parse-payload-segwit` / `parse-payload-legacy`**: `read-only` functions that parse a user payload (`{p: principal, a: uint, d: uint}`) from a transaction output.
- **`parse-payload-segwit-refund` / `parse-payload-legacy-refund`**: `read-only` functions that parse a refund payload (`{i: uint}`) from a transaction output.
- **`get-output-segwit` / `get-output-legacy`**: `read-only` functions that call the external `clarity-bitcoin-lib-v7` to parse a transaction and return a specific output. These correctly abstract the interaction with the Bitcoin library.

### Findings & Recommendations
- The helper functions appear correct.
- **Recommendation:** Change `get-out-value` from `define-public` to `define-read-only`.

---

## State & Info Getters

These functions provide read-only access to the contract's state.

- **`get-pool`**: Safely returns the entire `pool` data variable.
- **`is-tx-processed`**: Safely checks for the existence of a key in the `processed-btc-txs` map.
- **`get-processed-tx`**: Safely returns the details for a processed transaction from the `processed-btc-txs` map.
- **`get-refund-request`**: Safely returns a specific refund request from the `refund-requests` map.
- **`is-refund-processed`**: Safely checks for the existence of a key in the `processed-refunds` map.
- **`get-refund-count`**: Safely returns the `next-refund-id` counter.
- **`get-current-operator`**: Safely returns the `current-operator` variable.
- **`is-pool-initialized`**: Safely returns the `is-initialized` boolean flag.

### Findings & Recommendations
All getter functions are simple, secure, and correctly implemented as `read-only`. No changes recommended.
