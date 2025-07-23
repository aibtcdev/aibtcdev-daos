# Phase 3 Analysis: Core User Journeys

This document traces the primary execution paths from end-to-end to analyze how different parts of the contract interact.

---

## Journey 1: BTC to sBTC Deposit

This is the most fundamental user journey for the bridge, where a user sends BTC and receives sBTC on Stacks.

**Actors:**
-   **User:** Initiates the process by sending a BTC transaction.
-   **Processor:** Any off-chain entity that monitors for BTC transactions and calls the bridge contract.

### Step-by-Step Flow

1.  **User Action (Off-chain):** The user constructs a special BTC transaction.
    -   It must send at least `MIN_SATS` to the pool's `btc-receiver` address.
    -   It must include an `OP_RETURN` output containing a payload with their Stacks principal: `{p: principal, a: uint, d: uint}`. For a simple deposit, `a` (min-amount-out) and `d` (dex-id) are not used but must be present.

2.  **Processor Action (On-chain):** An off-chain service monitors the Bitcoin blockchain for transactions sent to the pool's `btc-receiver` address.
    -   Upon detecting a new transaction, the processor gathers the necessary proofs (transaction bytes, header, merkle proof).
    -   The processor calls either `process-btc-deposit` (for SegWit) or `process-btc-deposit-legacy` (for legacy).

3.  **Contract Execution (`process-btc-deposit`):**
    -   **Global Cooldown Check:** The contract first checks if it's in a global cooldown period (`(asserts! (> burn-block-height (+ (get last-updated current-pool) COOLDOWN)) ...)`). If so, the call fails. This is a potential point of failure/frustration for the user, as noted in `QUESTIONS.md`.
    -   **BTC Verification:** The contract calls the external `clarity-bitcoin-lib-v7` to verify that the BTC transaction was mined and is valid. This is the primary security checkpoint.
    -   **Replay Protection:** It checks that the BTC transaction ID has not already been processed by looking it up in the `processed-btc-txs` map.
    -   **Payload & Value Parsing:** The contract parses the BTC transaction to:
        -   Confirm the BTC amount sent to the pool address is `>= MIN_SATS`.
        -   Extract the user's Stacks principal (`stx-receiver`) from the `OP_RETURN` payload.
    -   **Liquidity & Limit Checks:**
        -   It calculates the `sbtc-amount-to-user` by deducting the fee.
        -   It asserts that the pool has enough `available-sbtc`.
        -   It asserts that the amount does not exceed the `max-deposit` limit.
    -   **State Update:**
        -   The BTC transaction ID is added to `processed-btc-txs` to prevent replay.
        -   `available-sbtc` in the `pool` variable is reduced.
        -   `processed-tx-count` is incremented.
    -   **sBTC Transfer:** The contract, via `as-contract`, calls the `sbtc-token` contract to transfer the `sbtc-amount-to-user` to the `stx-receiver`.

### System-Level Observations

-   **Decentralized Execution:** The process is permissionless. Anyone can act as a "Processor," which enhances censorship resistance.
-   **Trust in Bitcoin Library:** The entire security of this flow hinges on the correctness of the `clarity-bitcoin-lib-v7` contract. Any vulnerability there would be catastrophic for the bridge.
-   **Liquidity Risk:** If the pool lacks sufficient `available-sbtc`, the transaction cannot be processed. The user's only recourse is the `request-refund` flow, which is a more complex process.
-   **Global Cooldown Impact:** An operator action (like adding liquidity) can temporarily halt all deposits, which could be unexpected for users and processors. The purpose of this mechanism is a key question for the dev team.

### Conclusion

The BTC-to-sBTC deposit journey is well-designed with strong security primitives like replay protection and reliance on a dedicated verification library. The main risks are external (dependency on the Bitcoin library) or operational (pool liquidity and the global cooldown mechanism).
