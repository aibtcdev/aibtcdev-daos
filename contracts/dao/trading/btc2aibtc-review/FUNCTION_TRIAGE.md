# Function Triage

This document provides an initial classification of all functions in the `btc2aibtc-bridge.clar` contract. The categories (RED, ORANGE, YELLOW, GREEN) are based on the risk assessment guidelines in `START.md`.

| # | Function | Type | Category | Notes |
|---|---|---|---|---|
| 1 | `is-approver` | `read-only` | 🟢 GREEN | Checks principal against a hardcoded list of approvers. |
| 2 | `propose-allowlist-dexes` | `public` | 🟡 YELLOW | Approver-only. Initiates a multi-sig proposal to allow a new DEX. |
| 3 | `signal-allowlist-approval` | `public` | 🟡 YELLOW | Approver-only. Signals approval for a DEX proposal. Can execute it if threshold is met. |
| 4 | `emergency-stop-swaps` | `public` | 🟠 ORANGE | Approver-only. Pauses core swap functionality. A critical safety feature. |
| 5 | `are-swaps-paused` | `read-only` | 🟢 GREEN | Returns the status of the emergency pause flag. |
| 6 | `get-dex-allowed` | `read-only` | 🟢 GREEN | Returns information about an allowed DEX. |
| 7 | `get-allowlist-proposal` | `read-only` | 🟢 GREEN | Returns information about a specific allowlist proposal. |
| 8 | `has-signaled` | `read-only` | 🟢 GREEN | Checks if a specific approver has signaled for a proposal. |
| 9 | `read-uint64` | `read-only` | 🟢 GREEN | Internal helper for parsing buffer data. No state changes. |
| 10 | `find-out` | `private` | 🟢 GREEN | Private helper for finding a specific output in a BTC transaction. |
| 11 | `get-out-value` | `public` | 🟢 GREEN | Helper to extract output value. Should be `read-only`. No state changes. |
| 12 | `set-new-operator` | `public` | 🟠 ORANGE | Operator-only. Transfers the operator role, a high-privilege action. |
| 13 | `signal-add-liquidity` | `public` | 🟡 YELLOW | Operator-only. Signals intent to add liquidity, part of a time-locked process. |
| 14 | `signal-set-params` | `public` | 🟡 YELLOW | Operator-only. Signals intent to change pool parameters, part of a time-locked process. |
| 15 | `add-liquidity-to-pool` | `public` | 🔴 RED | Operator-only. Moves sBTC into the contract. Involves token transfers. |
| 16 | `add-only-liquidity` | `public` | 🔴 RED | Operator-only. Moves sBTC into the contract without a cooldown. Involves token transfers. |
| 17 | `set-params` | `public` | 🟠 ORANGE | Operator-only. Changes critical pool parameters like fees and deposit limits. |
| 18 | `signal-withdrawal` | `public` | 🟡 YELLOW | Operator-only. Signals intent to withdraw liquidity. |
| 19 | `withdraw-from-pool` | `public` | 🔴 RED | Operator-only. Moves sBTC out of the contract. Involves token transfers. |
| 20 | `parse-payload-segwit` | `read-only` | 🟢 GREEN | Helper for parsing data from a segwit transaction buffer. |
| 21 | `parse-payload-segwit-refund` | `read-only` | 🟢 GREEN | Helper for parsing refund data from a segwit transaction buffer. |
| 22 | `get-output-segwit` | `read-only` | 🟢 GREEN | Helper to get output from a segwit transaction. Calls external bitcoin lib. |
| 23 | `parse-payload-legacy` | `read-only` | 🟢 GREEN | Helper for parsing data from a legacy transaction buffer. |
| 24 | `parse-payload-legacy-refund` | `read-only` | 🟢 GREEN | Helper for parsing refund data from a legacy transaction buffer. |
| 25 | `get-output-legacy` | `read-only` | 🟢 GREEN | Helper to get output from a legacy transaction. Calls external bitcoin lib. |
| 26 | `process-btc-deposit` | `public` | 🔴 RED | Core logic. Anyone can call. Processes a BTC deposit and transfers sBTC to a user. |
| 27 | `process-btc-deposit-legacy` | `public` | 🔴 RED | Core logic. Anyone can call. Processes a legacy BTC deposit and transfers sBTC. |
| 28 | `swap-btc-to-aibtc` | `public` | 🔴 RED | Core logic. Anyone can call. Processes BTC deposit, swaps sBTC for aiBTC via external DEX, and transfers tokens. |
| 29 | `swap-btc-to-aibtc-legacy` | `public` | 🔴 RED | Core logic. Anyone can call. Same as above for legacy BTC transactions. |
| 30 | `get-pool` | `read-only` | 🟢 GREEN | Returns the current state of the liquidity pool. |
| 31 | `is-tx-processed` | `read-only` | 🟢 GREEN | Checks if a BTC transaction has already been processed. |
| 32 | `get-processed-tx` | `read-only` | 🟢 GREEN | Returns information about a processed BTC transaction. |
| 33 | `request-refund` | `public` | 🟠 ORANGE | User-facing. Initiates a refund process for a failed/stuck transaction. |
| 34 | `process-refund` | `public` | 🟠 ORANGE | Operator-facing. Finalizes a refund request by verifying a return BTC transaction. |
| 35 | `request-refund-legacy` | `public` | 🟠 ORANGE | User-facing. Same as `request-refund` for legacy transactions. |
| 36 | `process-refund-legacy` | `public` | 🟠 ORANGE | Operator-facing. Same as `process-refund` for legacy transactions. |
| 37 | `get-refund-request` | `read-only` | 🟢 GREEN | Returns information about a specific refund request. |
| 38 | `is-refund-processed` | `read-only` | 🟢 GREEN | Checks if a refund BTC transaction has been processed. |
| 39 | `get-refund-count` | `read-only` | 🟢 GREEN | Returns the total number of refund requests. |
| 40 | `get-current-operator` | `read-only` | 🟢 GREEN | Returns the current operator principal. |
| 41 | `initialize-pool` | `public` | 🔴 RED | Operator-only. One-time function to provide initial liquidity and initialize the pool. |
| 42 | `is-pool-initialized` | `read-only` | 🟢 GREEN | Returns whether the pool has been initialized. |
