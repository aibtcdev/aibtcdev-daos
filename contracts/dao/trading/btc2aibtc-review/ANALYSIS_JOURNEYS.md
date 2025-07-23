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

---

## Journey 2: BTC to aiBTC Swap

This is the primary value-add journey of the contract, allowing users to convert BTC directly into a specific aiBTC token.

**Actors:**
-   **User:** Initiates the process with a BTC transaction.
-   **Processor:** Any off-chain entity that calls the bridge contract.
-   **DEX:** An external, allowlisted decentralized exchange that performs the sBTC -> aiBTC swap.

### Step-by-Step Flow

1.  **User Action (Off-chain):** The user constructs a BTC transaction with a specific payload: `{p: principal, a: uint, d: uint}`.
    -   `p`: Their Stacks principal.
    -   `a`: The minimum amount of aiBTC they are willing to receive (for slippage protection).
    -   `d`: The ID of the allowlisted DEX they want to use.

2.  **Processor Action (On-chain):** An off-chain service detects the transaction and calls `swap-btc-to-aibtc` or `swap-btc-to-aibtc-legacy` with the necessary proofs and contract trait arguments.

3.  **Contract Execution (`swap-btc-to-aibtc`):**
    -   **Emergency Stop Check:** The contract first asserts that swaps are not paused (`(asserts! (not (var-get swaps-paused)) ...)`).
    -   **BTC Verification & Replay Protection:** Same as the deposit journey (verifies BTC tx, checks `processed-btc-txs`).
    -   **Payload & Value Parsing:** Parses the BTC amount, user principal (`stx-receiver`), `min-amount-out`, and `dex-id`.
    -   **DEX & Dependency Validation:** This is a critical security gate.
        -   It retrieves the approved contract set (`dex-info`) using the `dex-id`.
        -   It asserts that the `ft`, `ai-dex`, and `ai-pool` contracts passed as arguments match the ones from `dex-info`. This prevents the processor from injecting malicious contracts.
    -   **`ai-account` Resolution:** It calls `.register-ai-account` to resolve the user's `stx-receiver` principal into a dedicated `ai-account`. All subsequent token transfers are directed to this `ai-account`. This is a key dependency noted in `QUESTIONS.md`.
    -   **Liquidity & Fee Calculation:** Same as the deposit journey.
    -   **Swap Execution (Branching Logic):**
        -   **If Bonded Pool:** It calls `swap-x-for-y` on the Bitflow pool, passing the `min-amount-out`.
        -   **If Unbonded DEX:** It first calls `get-in` to get a quote (`tokens-out`). It asserts `tokens-out >= min-amount-out` before calling `buy` on the DEX.
    -   **Failure Handling (Swap Fallback):** If any part of the swap fails (e.g., the DEX call returns an `err`), the `match` statement catches it. The contract then attempts to transfer the original `sbtc-amount-to-user` directly to the user's `ai-account`. This is a robust safety net that prevents loss of funds.
    -   **Success & Token Transfer:** If the swap succeeds, the contract calls the `ft` (aiBTC token) contract to transfer the resulting tokens to the user's `ai-account`.

### System-Level Observations

-   **Composability & Risk:** This journey highlights the power and risk of DeFi composability. The bridge acts as an orchestrator, relying on multiple external contracts (`clarity-bitcoin-lib`, `sbtc-token`, `ai-account`, and the chosen DEX/pool). A vulnerability in any of these dependencies can impact the bridge.
-   **Security via Allowlisting:** The entire security model for swaps rests on the governance process for allowlisting DEXs. The `approver`s are trusted to perform due diligence on any DEX before it is added.
-   **Robust Fallback:** The sBTC refund mechanism on swap failure is a critical feature that significantly de-risks the process for the user. It ensures that even if the DEX interaction fails, the user receives the value of their initial deposit (minus fees).
-   **Tight Coupling with `ai-account`:** The journey cannot be completed without the user having an `ai-account`. This makes the `ai-account` system a hard dependency for the bridge's core functionality.

### Conclusion

The BTC-to-aiBTC swap journey is a complex but well-architected flow. It uses a defense-in-depth approach by validating all external inputs against an on-chain allowlist and providing a safe fallback path. The primary risks are inherited from its external dependencies, making the governance over those dependencies the most critical security function.
