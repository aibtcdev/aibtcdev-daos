# Integration Plan for Buy-and-Deposit Trading Adapters

This plan outlines the steps to add support for the new contracts `faktory-buy-and-deposit.clar` and `bitflow-buy-and-deposit.clar` to the DAO ecosystem. These are per-DAO trading adapters for handling token swaps and deposits, with agent account fallbacks. The goal is to enable templating, deployment, and testing without affecting existing direct-swap adapters.

Changes follow project conventions: add subtypes for type-safety, update deployment order for sequencing, templatize .clar files with pre-line comments (e.g., `;; /g/.contract/placeholder`), add template replacements, prioritize unit tests over new helpers, and add types only if needed for tests.

## 1. Update Contract Types and Names
Add new subtypes under "TRADING" to distinguish these buy-and-deposit adapters from existing direct-swap subtypes. This ensures type-safe references in deployment and tests.

- **Relevant files:**
  - utilities/contract-types.ts (primary: update CONTRACT_SUBTYPES and CONTRACT_NAMES)
  - utilities/contract-deployment-order.ts (will reference these subtypes in step 2)
  - utilities/dao-helpers.ts (may use for type checks in future helpers/tests)

- **Steps:**
  - In CONTRACT_SUBTYPES["TRADING"], append "FAKTORY_BUY_AND_DEPOSIT" and "BITFLOW_BUY_AND_DEPOSIT".
  - In CONTRACT_NAMES["TRADING"], map them to the .clar filenames (e.g., "faktory-buy-and-deposit").

## 2. Update Deployment Order
Add the new subtypes to DEPLOYMENT_ORDER after existing "TOKEN" contracts and alongside other "TRADING" entries. This sequences deployment post-dependencies like tokens/DEX.

- **Relevant files:**
  - utilities/contract-deployment-order.ts (primary: update DEPLOYMENT_ORDER map)
  - utilities/contract-types.ts (references subtypes added in step 1)

- **Steps:**
  - Use `useContract("TRADING", "FAKTORY_BUY_AND_DEPOSIT")` and assign order numbers (e.g., 62 and 63 after existing 60/61).

## 3. Templatize the .clar Files
Add pre-line comments (e.g., `;; /g/.aibtc-faktory/dao_contract_token`) before principals/traits to enable replacement without altering Clarity syntax.

- **Relevant files:**
  - contracts/dao/trading/faktory-buy-and-deposit.clar (add comments for DAO_TOKEN, AGENT_ACCOUNT_REGISTRY, etc.)
  - contracts/dao/trading/bitflow-buy-and-deposit.clar (add comments for SBTC_TOKEN, DAO_TOKEN, etc.)
  - utilities/template-variables.ts (will use these in step 4 for replacements)

- **Steps:**
  - For each hardcoded principal/trait, insert a comment on the line above matching the `/g/toReplace/key` format.
  - Ensure no extra characters or syntax changes to preserve LISP structure.

## 4. Update Template Variables
Add replacements for contract names and trait mappings to support per-DAO generation, following existing patterns (e.g., symbolized names like `.${symbol}-faktory-buy-and-deposit`).

- **Relevant files:**
  - utilities/template-variables.ts (primary: update generateTemplateReplacements and traitMappings)
  - contracts/dao/trading/faktory-buy-and-deposit.clar (templated in step 3)
  - contracts/dao/trading/bitflow-buy-and-deposit.clar (templated in step 3)

- **Steps:**
  - In replacements, add keys like "dao_contract_trading_faktory_buy_and_deposit".
  - In traitMappings, add entries for placeholders (e.g., agent_account_registry, faktory_dex).

## 5. Add Unit Tests
Create new test files to verify the contracts, focusing on scenarios like swaps with/without agent accounts, errors, and integration. Use existing helpers for setup; add new ones only if repeated patterns emerge.

- **Relevant files:**
  - tests/contracts/dao/trading/faktory-buy-and-deposit.test.ts (new: unit tests for faktory adapter)
  - tests/contracts/dao/trading/bitflow-buy-and-deposit.test.ts (new: unit tests for bitflow adapter)
  - utilities/dao-helpers.ts (use existing functions like getSbtcFromFaucet for test arrange phase)
  - utilities/dao-types.ts (reference types added in step 6 if needed for assertions)

- **Steps:**
  - Mirror structure from tests/contracts/dao/extensions/aibtc-dao-users.test.ts.
  - Test cases: successful buy-deposit to agent, fallback without agent, slippage/refund errors.
  - External task: Run tests with `vitest` after implementation to validate.

## 6. Update DAO Types (If Needed for Tests)
Add types for contract outputs (e.g., get-contract-info) only if required for typed test assertions, to avoid unnecessary bloat.

- **Relevant files:**
  - utilities/dao-types.ts (primary: extend types like AgentAccountSwapAdapterContractInfo)
  - tests/contracts/dao/trading/* (will use these types in assertions)

- **Steps:**
  - Conditionally add if tests parse responses (e.g., BuyAndDepositInfo for tokens received).

## Open Questions
- Does KnownTraits.ts need updates for new trait keys (e.g., AGENT_ACCOUNT_REGISTRY)? If yes, add to chat.
- Are there specific test scenarios or mocks needed for external dependencies (e.g., Bitflow core)? Clarify if simnet setup requires changes.
- Confirm if any other files (e.g., utilities/known-traits.ts or scripts for cost reports) need minor tweaks for new subtypes.

## External Tasks
- After updates, run full DAO generation (e.g., via constructDao in dao-helpers.ts) to verify adapters deploy correctly.
- Execute unit tests with `vitest tests/contracts/dao/trading/*` and fix any failures.
- Test per-DAO templating by generating a sample DAO and inspecting replaced principals.
- If issues arise, iterate on this PLAN.md by editing and re-testing.

This plan is iterative; update as steps are completed or questions resolved.

## Progress
- **Step 1:** Completed. Updated CONTRACT_SUBTYPES and CONTRACT_NAMES in utilities/contract-types.ts to include new buy-and-deposit subtypes.
