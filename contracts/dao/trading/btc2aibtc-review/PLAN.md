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
    - [x] Analyze functions in descending order of risk: RED -> ORANGE -> YELLOW -> GREEN.
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
        - [x] `set-new-operator`
        - [x] `set-params`
        - [x] `request-refund`
        - [x] `process-refund`
        - [x] `request-refund-legacy`
        - [x] `process-refund-legacy`
      - **🟡 YELLOW Functions**
        - [x] `propose-allowlist-dexes`
        - [x] `signal-allowlist-approval`
        - [x] `signal-add-liquidity`
        - [x] `signal-set-params`
        - [x] `signal-withdrawal`
      - **🟢 GREEN Functions**
        - [x] `is-approver`
        - [x] `are-swaps-paused`
        - [x] `get-dex-allowed`
        - [x] `get-allowlist-proposal`
        - [x] `has-signaled`
        - [x] `read-uint64`
        - [x] `find-out`
        - [x] `get-out-value`
        - [x] `parse-payload-segwit`
        - [x] `parse-payload-segwit-refund`
        - [x] `get-output-segwit`
        - [x] `parse-payload-legacy`
        - [x] `parse-payload-legacy-refund`
        - [x] `get-output-legacy`
        - [x] `get-pool`
        - [x] `is-tx-processed`
        - [x] `get-processed-tx`
        - [x] `get-refund-request`
        - [x] `is-refund-processed`
        - [x] `get-refund-count`
        - [x] `get-current-operator`
        - [x] `is-pool-initialized`
    - [x] For each function, apply the watchpoints from `START.md`, focusing on access control (`tx-sender`), state changes, external calls, and input validation.
    - [x] Document findings for each function using the template structure mentioned in `START.md` (purpose, parameters, state changes, etc.).

**Phase 3: Holistic System and Logic Path Review**

*   **Objective:** To analyze the contract as an integrated system, focusing on how its parts interact and identifying emergent risks.
*   **Actions:**
    - [x] **Access Control Model:** Review the distinct roles of the `current-operator` and the multi-sig `approver`s. Ensure their permissions are correctly scoped and enforced.
    - [x] **Core User Journeys:** Trace the primary execution paths from end-to-end:
        - [x] BTC to sBTC deposit (`process-btc-deposit`).
        - [x] BTC to aiBTC swap (`swap-btc-to-aibtc`).
        - [x] Liquidity provider flows (`add-liquidity-to-pool`, `withdraw-from-pool`).
        - [x] Refund mechanism (`request-refund`, `process-refund`).
    - [x] **Contract Relationship Diagram:** Create a visual diagram of external contract dependencies.
    - [x] **External Dependencies:** Scrutinize all external calls, especially to the `clarity-bitcoin-lib-v7`, the `sbtc-token`, and the various DEX/pool traits. We need to understand the trust assumptions for each.
    - [x] **State Management:** Analyze the lifecycle of key data structures like the `pool` variable and the `processed-btc-txs` map to check for integrity and potential race conditions.
    - [x] **Emergency Procedures:** Evaluate the `emergency-stop-swaps` function for effectiveness and potential bypasses.

**Phase 4: Final Report and Recommendations**

*   **Objective:** To consolidate our findings into a comprehensive and actionable report.
*   **Actions:**
    - [x] Summarize all identified issues, categorizing them by severity.
    - [x] Provide clear and concrete recommendations for remediation.
    - [x] Compile a list of any remaining questions or areas requiring clarification from the development team.
