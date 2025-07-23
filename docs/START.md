# Documentation for aibtcdev-daos

This file is our starting point. This directory is our working directory.

We will work back and forth with question then commit the changes at key milestones.

We want to perform a comprehensive review of the `../contracts` directory and every Clarity `.clar` file within.

The review will include analyzing each contract's functions and creating condensed functional documentation for developers.

To maintain consistency a `TEMPLATE_*.md` file can be created for each type of documentation.

## Internal Structure

For our working directory, we can create new files as needed to document our findings, questions, and code changes. For example:

- `QUESTIONS.md` for questions that arise during the review
- `PLANS.md` for outlining next steps and action items
- items by topic, such as `TEMPLATE_*.md` for specific documentation templates

Our end goal is to create a structure here in `./docs` that mirrors the structure of the `../contracts` directory, such that:

- every Clarity contract has a corresponding documentation file, we can add a script to `../tests` to automate this
- contracts are documented consistently and explain their purpose, functionality, and any special considerations
- every folder in `../docs` contains a `README.md` that explains the contents and purpose of that folder
- every `README.md` file should link to one level above and below where applicable, to maintain a clear navigation structure

Markdown is preferred, text is king.

## Proposed Process

Our plan should start by creating the test that will show us which clarity files are missing documentation, using the same format and style as the existing check for corresponding test files.

Once we have the results of that test we can use that list to create a checklist to iterate on and decide the template format for each type of documentation. We want to start simple and focus on maximizing the reader's time. The intended audience is developers who will be working with the contracts, so clarity and conciseness are key.

This documentation should be a living document, where we will re-run this process to update it as contracts change or new contracts are added. We can use the existing Clarity contract code as a starting point for each contract's documentation.

## Proposed Structure

1. Create a `README.md` in the root of the `docs` directory to explain how to navigate dev docs, most useful info at landing.
2. Create a `TEMPLATE_*.md` file for each type of documentation needed.
3. Create a `QUESTIONS.md` file to track questions and issues that arise during the review.
4. Create a `PLANS.md` file to outline next steps and action items. use markdown task lists for tracking progress and iterations. add/modify as necessary throughout the process but keep data for retrospective at end.
5. Create a `SUMMARY.md` file in the root of the `docs` directory that lists all contracts and links to their documentation. Basically a TOC similar to GitBook format.
6. Create a `README.md` in each subdirectory of `docs` to explain the contents and purpose of that folder. Make it useful for navigation and understanding the structure and expect it to be linked to from the `SUMMARY.md` as well as 1 level above and below where applicable.
7. Create a script in `../tests` to automate the generation of documentation files based on the Clarity contracts in `../contracts`

## Example of a similar plan

This worked well for our contract analyzer project so we can use it as a reference for creating our documentation process:

```markdown
# Our Plan

Our review of the `btc2aibtc-bridge.clar` contract will proceed in four phases. We will tackle one item at a time to ensure focus and completeness.

**Phase 1: Function Inventory and Initial Triage**

- **Objective:** To get a high-level overview of the contract's surface area and prioritize functions for review.
- **Actions:**
  - [x] List every function (`define-public`, `define-read-only`, `define-private`) in the contract.
  - [x] Perform a preliminary classification of each function into RED, ORANGE, YELLOW, or GREEN categories as defined in `START.md`. This will serve as our initial roadmap.
  - [x] Document this classification in a new file, e.g., `FUNCTION_TRIAGE.md`.

**Phase 2: Deep-Dive Function Analysis (Risk-First)**

- **Objective:** To meticulously analyze the logic, security, and potential vulnerabilities within each function, starting with the most critical.
- **Actions:**
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

- **Objective:** To analyze the contract as an integrated system, focusing on how its parts interact and identifying emergent risks.
- **Actions:**
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

- **Objective:** To consolidate our findings into a comprehensive and actionable report.
- **Actions:**
  - [x] Summarize all identified issues, categorizing them by severity.
  - [x] Provide clear and concrete recommendations for remediation.
  - [x] Compile a list of any remaining questions or areas requiring clarification from the development team.
```

In the end we want to create something that we can test end-to-end now as well as reproduce the same results in future runs. Indemnify the process and the results so that we can iterate on it as needed.
