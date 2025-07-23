# Our Plan

Our review of the `btc2aibtc-bridge.clar` contract will proceed in four phases. We will tackle one item at a time to ensure focus and completeness.

**Phase 1: Function Inventory and Initial Triage**

*   **Objective:** To get a high-level overview of the contract's surface area and prioritize functions for review.
*   **Actions:**
    - [x] List every function (`define-public`, `define-read-only`, `define-private`) in the contract.
    - [x] Perform a preliminary classification of each function into RED, ORANGE, YELLOW, or GREEN categories as defined in `START.md`. This will serve as our initial roadmap.
    - [x] Document this classification in a new file, e.g., `FUNCTION_TRIAGE.md`.

**Phase 2: Deep-Dive Function Analysis (Risk-First)**

*   **Objective:** To meticulously analyze the logic, security, and potential vulnerabilities within each function, starting with the most critical.
*   **Actions:**
    - [ ] Analyze functions in descending order of risk: RED -> ORANGE -> YELLOW -> GREEN.
      - **🔴 RED Functions**
        - [x] `initialize-pool`
        - [x] `add-liquidity-to-pool`
        - [x] `add-only-liquidity`
        - [x] `withdraw-from-pool`
        - [x] `process-btc-deposit`
        - [x] `process-btc-deposit-legacy`
        - [x] `swap-btc-to-aibtc`
        - [x] `swap-btc-to-aibtc-legacy`
      - **🟠 ORANGE Functions**
        - [x] `emergency-stop-swaps`
        - [ ] `set-new-operator`
        - [ ] `set-params`
        - [ ] `request-refund`
        - [ ] `process-refund`
        - [ ] `request-refund-legacy`
        - [ ] `process-refund-legacy`
      - **🟡 YELLOW Functions**
        - [ ] `propose-allowlist-dexes`
        - [ ] `signal-allowlist-approval`
        - [ ] `signal-add-liquidity`
        - [ ] `signal-set-params`
        - [ ] `signal-withdrawal`
      - **🟢 GREEN Functions**
        - [ ] `is-approver`
        - [ ] `are-swaps-paused`
        - [ ] `get-dex-allowed`
        - [ ] `get-allowlist-proposal`
        - [ ] `has-signaled`
        - [ ] `read-uint64`
        - [ ] `find-out`
        - [ ] `get-out-value`
        - [ ] `parse-payload-segwit`
        - [ ] `parse-payload-segwit-refund`
        - [ ] `get-output-segwit`
        - [ ] `parse-payload-legacy`
        - [ ] `parse-payload-legacy-refund`
        - [ ] `get-output-legacy`
        - [ ] `get-pool`
        - [ ] `is-tx-processed`
        - [ ] `get-processed-tx`
        - [ ] `get-refund-request`
        - [ ] `is-refund-processed`
        - [ ] `get-refund-count`
        - [ ] `get-current-operator`
        - [ ] `is-pool-initialized`
    - [x] For each function, apply the watchpoints from `START.md`, focusing on access control (`tx-sender`), state changes, external calls, and input validation.
    - [x] Document findings for each function using the template structure mentioned in `START.md` (purpose, parameters, state changes, etc.).

**Phase 3: Holistic System and Logic Path Review**

*   **Objective:** To analyze the contract as an integrated system, focusing on how its parts interact and identifying emergent risks.
*   **Actions:**
    - [ ] **Access Control Model:** Review the distinct roles of the `current-operator` and the multi-sig `approver`s. Ensure their permissions are correctly scoped and enforced.
    - [ ] **Core User Journeys:** Trace the primary execution paths from end-to-end:
        - [ ] BTC to sBTC deposit (`process-btc-deposit`).
        - [ ] BTC to aiBTC swap (`swap-btc-to-aibtc`).
        - [ ] Liquidity provider flows (`add-liquidity-to-pool`, `withdraw-from-pool`).
        - [ ] Refund mechanism (`request-refund`, `process-refund`).
    - [ ] **External Dependencies:** Scrutinize all external calls, especially to the `clarity-bitcoin-lib-v7`, the `sbtc-token`, and the various DEX/pool traits. We need to understand the trust assumptions for each.
    - [ ] **State Management:** Analyze the lifecycle of key data structures like the `pool` variable and the `processed-btc-txs` map to check for integrity and potential race conditions.
    - [ ] **Emergency Procedures:** Evaluate the `emergency-stop-swaps` function for effectiveness and potential bypasses.

**Phase 4: Final Report and Recommendations**

*   **Objective:** To consolidate our findings into a comprehensive and actionable report.
*   **Actions:**
    - [ ] Summarize all identified issues, categorizing them by severity.
    - [ ] Provide clear and concrete recommendations for remediation.
    - [ ] Compile a list of any remaining questions or areas requiring clarification from the development team.
