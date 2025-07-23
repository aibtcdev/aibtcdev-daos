# Documentation Plan

This plan outlines the steps to create comprehensive functional documentation for all Clarity contracts. We will use markdown task lists to track progress.

## Phase 1: Setup and Initial Documentation

This phase focuses on establishing the process and documenting the first two priority contracts.

- [x] **Setup: Create Documentation Template**
  - [x] Create a generic `TEMPLATE_CONTRACT.md` file for documenting Clarity contracts.
- [x] **Setup: Create Test Script**
  - [x] Create a script in `../tests` to identify Clarity contracts in `../contracts` that are missing corresponding documentation files in `docs/contracts`.
- [x] **Priority Contract 1: Agent Account**
  - [x] Create `docs/contracts/agent/aibtc-agent-account.md`
  - [x] Document the purpose, public functions, and key interactions of the contract.
- [x] **Priority Contract 2: Action Proposal Voting**
  - [x] Create `docs/contracts/dao/extensions/aibtc-action-proposal-voting.md`
  - [x] Document the purpose, public functions, and key interactions of the contract.

## Phase 2: Full Contract Documentation

This phase involves documenting the remaining contracts, categorized by their location in the `contracts` directory.

- [ ] **Core Contracts**
  - [ ] `aibtc-dao-run-cost.md`
- [ ] **DAO Contracts**
  - [ ] **Base:** `aibtc-base-dao.md`
  - [ ] **Actions:** `aibtc-action-send-message.md`
  - [ ] **Extensions:**
    - [ ] `aibtc-dao-charter.md`
    - [ ] `aibtc-dao-epoch.md`
    - [ ] `aibtc-dao-users.md`
    - [ ] `aibtc-onchain-messaging.md`
    - [ ] `aibtc-rewards-account.md`
    - [ ] `aibtc-token-owner.md`
    - [ ] `aibtc-treasury.md`
  - [ ] **Proposals:** `aibtc-base-initialize-dao.md`
  - [ ] **Token:**
    - [ ] `aibtc-faktory.md`
    - [ ] `aibtc-faktory-dex.md`
    - [ ] `aibtc-pre-faktory.md`
    - [ ] `xyk-pool-sbtc-aibtc-v-1-1.md`
  - [ ] **Trading:**
    - [ ] `aibtc-acct-swap-bitflow-aibtc-sbtc.md`
    - [ ] `aibtc-acct-swap-faktory-aibtc-sbtc.md`
- [ ] **Trait Contracts**
  - [ ] `traits/aibtc-agent-account-traits.md`
  - [ ] `traits/aibtc-base-dao-trait.md`
  - [ ] `traits/aibtc-dao-traits.md`
- [ ] **External Dependencies (Skipping)**
  - [ ] `sbtc-token.md`
  - [ ] `xyk-core-v-1-2.md`

## Phase 3: Finalization and Review

- [ ] **Review and Refine:**
  - [ ] Review all generated documentation for consistency and clarity.
  - [ ] Update the root `README.md` and create `SUMMARY.md` to provide a table of contents and navigation guide.
  - [ ] Create `README.md` files for each subdirectory in `docs/contracts`.
- [ ] **Retrospective:**
  - [ ] Review the process and document lessons learned in `END.md`.
